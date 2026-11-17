#!/usr/bin/env node
'use strict';
// lpw-s2 (AC1, AC2) -- measures, for each browser spec file run on its own against a fresh test server, which
// statements of src/web-ui it executes (Node V8 coverage of the server, read through c8's json reporter). The pure
// helpers below are unit-tested; the CLI needs Playwright, Chromium and c8 and is run by
// .github/workflows/playwright-spec-coverage.yml.
//
//   node scripts/measure-playwright-spec-coverage.js <out-dir> [spec-file ...]
//
// Writes <out-dir>/measurement.json (input to scripts/select-core-specs.js), <out-dir>/per-spec-coverage.json and
// <out-dir>/per-spec-coverage.md.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SCOPE = 'src/web-ui/';
const C8 = 'c8@10.1.3';

function relativeKey(file) {
  const norm = String(file).split('\\').join('/');
  const i = norm.indexOf(SCOPE);
  return i === -1 ? null : norm.slice(i);
}

/** Every statement key (file:line:column) in src/web-ui from a c8 coverage-final.json object. */
function allStatements(cov) {
  const out = new Set();
  Object.keys(cov || {}).forEach(function (file) {
    const rel = relativeKey(file);
    if (!rel) return;
    const map = cov[file].statementMap || {};
    Object.keys(map).forEach(function (id) { out.add(rel + ':' + map[id].start.line + ':' + map[id].start.column); });
  });
  return out;
}

/** The statement keys with at least one hit. */
function coveredStatements(cov) {
  const out = new Set();
  Object.keys(cov || {}).forEach(function (file) {
    const rel = relativeKey(file);
    if (!rel) return;
    const map = cov[file].statementMap || {};
    const hits = cov[file].s || {};
    Object.keys(map).forEach(function (id) {
      if (hits[id] > 0) out.add(rel + ':' + map[id].start.line + ':' + map[id].start.column);
    });
  });
  return out;
}

/** For each spec, the statements no other spec covers. */
function uniqueStatements(setsBySpec) {
  const count = new Map();
  Object.keys(setsBySpec).forEach(function (spec) { setsBySpec[spec].forEach(function (s) { count.set(s, (count.get(s) || 0) + 1); }); });
  const out = {};
  Object.keys(setsBySpec).forEach(function (spec) {
    out[spec] = new Set(Array.from(setsBySpec[spec]).filter(function (s) { return count.get(s) === 1; }));
  });
  return out;
}

/** Specs in order of new statements added (greedy), ties broken by name. */
function greedyOrder(setsBySpec) {
  const covered = new Set();
  const left = Object.keys(setsBySpec).sort();
  const out = [];
  while (left.length) {
    let bi = 0; let bg = -1;
    left.forEach(function (spec, i) {
      let g = 0; setsBySpec[spec].forEach(function (s) { if (!covered.has(s)) g++; });
      if (g > bg) { bg = g; bi = i; }
    });
    const spec = left.splice(bi, 1)[0];
    setsBySpec[spec].forEach(function (s) { covered.add(s); });
    out.push({ spec: spec, added: bg, cumulative: covered.size });
  }
  return out;
}

/** Files in the scope where no statement is covered by any spec. */
function untouchedFiles(allSet, unionSet) {
  const touched = new Set();
  unionSet.forEach(function (k) { touched.add(k.replace(/:\d+:\d+$/, '')); });
  const files = new Set();
  allSet.forEach(function (k) { files.add(k.replace(/:\d+:\d+$/, '')); });
  return Array.from(files).filter(function (f) { return !touched.has(f); }).sort();
}

/**
 * @param {{spec:string,passed:number,failed:number,skipped:number,statements:Set}[]} results
 * @param {{totalStatements:number, seconds?:number, allStatements?:Set}} info
 */
function buildReport(results, info) {
  const sets = {};
  results.forEach(function (r) { sets[r.spec] = r.statements; });
  const uniq = uniqueStatements(sets);
  const order = greedyOrder(sets);
  const orderOf = {}; const addedOf = {};
  order.forEach(function (o, i) { orderOf[o.spec] = i + 1; addedOf[o.spec] = o.added; });
  const union = new Set();
  results.forEach(function (r) { r.statements.forEach(function (s) { union.add(s); }); });
  const rows = results.map(function (r) {
    return { spec: r.spec, passed: r.passed, failed: r.failed, skipped: r.skipped, covered: r.statements.size,
      unique: uniq[r.spec].size, order: orderOf[r.spec], added: addedOf[r.spec] };
  }).sort(function (a, b) { return a.order - b.order; });
  const json = { totalStatements: info.totalStatements, unionStatements: union.size, seconds: info.seconds || 0, specs: rows };
  const lines = [];
  lines.push('# Per-spec server coverage of src/web-ui');
  lines.push('');
  lines.push('Together the specs execute ' + union.size + ' of ' + info.totalStatements + ' statements (' +
    (info.totalStatements ? (union.size / info.totalStatements * 100).toFixed(1) : '0.0') + '%). Each spec ran alone on a fresh server' +
    (info.seconds ? ' (' + (info.seconds / 60).toFixed(1) + ' minutes in all)' : '') + '. Order is greedy by new statements added.');
  lines.push('');
  lines.push('| Spec | Passed | Failed | Skipped | Covered | Only this spec | Order | New when added |');
  lines.push('|---|---|---|---|---|---|---|---|');
  rows.forEach(function (r) {
    lines.push('| ' + r.spec + ' | ' + r.passed + ' | ' + r.failed + ' | ' + r.skipped + ' | ' + r.covered + ' | ' + r.unique + ' | ' + r.order + ' | ' + r.added + ' |');
  });
  if (info.allStatements) {
    const untouched = untouchedFiles(info.allStatements, union);
    lines.push('');
    lines.push('## Files no spec touches (' + untouched.length + ')');
    lines.push('');
    untouched.forEach(function (f) { lines.push('- ' + f); });
  }
  lines.push('');
  return { json: json, markdown: lines.join('\n') };
}

// ---------------------------------------------------------------------------------------------------------------
// CLI (CI only)

function listSpecs(root) { return require('./capability-matrix').listSpecFiles(root); }

function runOne(root, outDir, n, specFile) {
  const covDir = path.join(outDir, 'cov', String(n));
  const jsonFile = path.join(outDir, 'json', n + '.json');
  fs.mkdirSync(covDir, { recursive: true });
  fs.mkdirSync(path.dirname(jsonFile), { recursive: true });
  const env = Object.assign({}, process.env, {
    NODE_ENV: 'test', E2E_LOCAL_SUITE: 'true', LPW_SERVER_COVERAGE_DIR: covDir,
    PLAYWRIGHT_JSON_OUTPUT_NAME: jsonFile
  });
  spawnSync('npx', ['playwright', 'test', specFile, '--workers=1', '--reporter=json'], { cwd: root, env: env, stdio: 'ignore', shell: true, timeout: 6 * 60 * 1000 });
  let passed = 0; let failed = 0; let skipped = 0;
  try {
    const st = JSON.parse(fs.readFileSync(jsonFile, 'utf8')).stats || {};
    passed = (st.expected || 0) + (st.flaky || 0); failed = st.unexpected || 0; skipped = st.skipped || 0;
  } catch (e) { failed = -1; }
  const reportDir = path.join(outDir, 'c8', String(n));
  spawnSync('npx', ['--yes', C8, 'report', '--temp-directory', covDir, '--reporter=json', '--reports-dir=' + reportDir, '--include=src/web-ui/**'], { cwd: root, stdio: 'ignore', shell: true });
  let cov = {};
  try { cov = JSON.parse(fs.readFileSync(path.join(reportDir, 'coverage-final.json'), 'utf8')); } catch (e) { /* no coverage written */ }
  return { spec: specFile, passed: passed, failed: failed, skipped: skipped, cov: cov };
}

function main() {
  const root = path.resolve(__dirname, '..');
  const outDir = path.resolve(process.argv[2] || 'spec-coverage');
  const scenario = require('./capability-matrix').SCENARIO_FILES;
  const files = process.argv.length > 3 ? process.argv.slice(3) : listSpecs(root).filter(function (f) { return scenario.indexOf(f) === -1; });
  const started = Date.now();
  const results = []; let all = new Set();
  files.forEach(function (f, i) {
    const t0 = Date.now();
    const r = runOne(root, outDir, i, f);
    allStatements(r.cov).forEach(function (s) { all.add(s); });
    results.push({ spec: f, passed: r.passed, failed: r.failed, skipped: r.skipped, statements: coveredStatements(r.cov) });
    console.log('[' + (i + 1) + '/' + files.length + '] ' + f + ': ' + r.passed + ' passed, ' + r.failed + ' failed, ' + results[results.length - 1].statements.size + ' statements, ' + Math.round((Date.now() - t0) / 1000) + 's');
  });
  const seconds = Math.round((Date.now() - started) / 1000);
  const report = buildReport(results, { totalStatements: all.size, seconds: seconds, allStatements: all });
  // measurement.json: statements as indices into keys, so the file stays small.
  const keys = Array.from(all).sort(); const index = new Map(keys.map(function (k, i) { return [k, i]; }));
  const specs = {};
  results.forEach(function (r) { specs[r.spec] = { passed: r.passed, failed: r.failed, skipped: r.skipped, statements: Array.from(r.statements).map(function (s) { return index.get(s); }) }; });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'measurement.json'), JSON.stringify({ totalStatements: all.size, seconds: seconds, keys: keys, specs: specs }));
  fs.writeFileSync(path.join(outDir, 'per-spec-coverage.json'), JSON.stringify(report.json, null, 2));
  fs.writeFileSync(path.join(outDir, 'per-spec-coverage.md'), report.markdown);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report.markdown + '\n');
}

if (require.main === module) main();

module.exports = { relativeKey, allStatements, coveredStatements, uniqueStatements, greedyOrder, untouchedFiles, buildReport };
