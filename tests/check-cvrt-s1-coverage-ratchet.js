'use strict';

// check-cvrt-s1-coverage-ratchet.js -- TDD tests for cvrt-s1
// Story: artefacts/2026-11-21-coverage-ratchet/stories/cvrt-s1-coverage-ratchet.md
//
// T1-T8 exercise the real scripts/coverage-ratchet.js (the function and the command line).
// T9-T10 read the two workflow files as text, because the workflows only run on CI.
//
// Run: node tests/check-cvrt-s1-coverage-ratchet.js

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const scriptPath = path.join(root, 'scripts', 'coverage-ratchet.js');

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); console.log('  [PASS] ' + name); passed++; }
  catch (e) { console.error('  [FAIL] ' + name + ': ' + e.message); failed++; }
}

function load() { return require(scriptPath); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-cvrt-s1-'));
function writeJson(name, obj) { const p = path.join(tmp, name); fs.writeFileSync(p, typeof obj === 'string' ? obj : JSON.stringify(obj)); return p; }
function summary(s, b, f, l) {
  return { total: { statements: { pct: s }, branches: { pct: b }, functions: { pct: f }, lines: { pct: l } } };
}
const BASE = { suites: { unit: { statements: 70, branches: 60, functions: 50, lines: 70 }, e2e: { statements: 66.42, branches: 59.73, functions: 44.96, lines: 66.42 } } };

console.log('\nAC1 -- the comparison');
test('T1 equal to the baseline passes', () => {
  const r = load().compare('unit', summary(70, 60, 50, 70), BASE);
  assert.strictEqual(r.ok, true); assert.deepStrictEqual(r.failures, []);
});
test('T2 a drop inside the 0.5 point tolerance passes', () => {
  const r = load().compare('unit', summary(69.6, 59.6, 49.6, 69.6), BASE);
  assert.strictEqual(r.ok, true, JSON.stringify(r.failures));
});
test('T3 one metric more than 0.5 points below fails and names metric, baseline and measured value', () => {
  const r = load().compare('unit', summary(70, 58.9, 50, 70), BASE);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.failures.length, 1);
  assert.strictEqual(r.failures[0].metric, 'branches');
  assert.strictEqual(r.failures[0].baseline, 60);
  assert.strictEqual(r.failures[0].measured, 58.9);
});
test('T4 all four metrics below fail, each named', () => {
  const r = load().compare('e2e', summary(60, 50, 40, 60), BASE);
  assert.strictEqual(r.ok, false);
  assert.deepStrictEqual(r.failures.map((f) => f.metric).sort(), ['branches', 'functions', 'lines', 'statements']);
});

console.log('\nAC2 -- the baseline file');
test('T5 no baseline file passes with a notice (the base branch has none yet)', () => {
  const r = spawnSync(process.execPath, [scriptPath, 'unit', writeJson('s5.json', summary(1, 1, 1, 1))], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.ok(/no baseline/i.test(r.stdout + r.stderr), 'expected a notice, got: ' + r.stdout);
  const r2 = spawnSync(process.execPath, [scriptPath, 'unit', writeJson('s5b.json', summary(1, 1, 1, 1)), path.join(tmp, 'does-not-exist.json')], { encoding: 'utf8' });
  assert.strictEqual(r2.status, 0, r2.stdout + r2.stderr);
});
test('T6 a malformed baseline file fails closed and names the file', () => {
  const bad = writeJson('bad-baseline.json', '{ not json');
  const r = spawnSync(process.execPath, [scriptPath, 'unit', writeJson('s6.json', summary(99, 99, 99, 99)), bad], { encoding: 'utf8' });
  assert.strictEqual(r.status, 1, r.stdout + r.stderr);
  assert.ok((r.stdout + r.stderr).indexOf('bad-baseline.json') !== -1, 'expected the file name in the message');
});
test('T7 a baseline with no entry for the suite fails closed', () => {
  const other = writeJson('no-suite.json', { suites: { e2e: BASE.suites.e2e } });
  const r = spawnSync(process.execPath, [scriptPath, 'unit', writeJson('s7.json', summary(99, 99, 99, 99)), other], { encoding: 'utf8' });
  assert.strictEqual(r.status, 1, r.stdout + r.stderr);
  assert.ok(/unit/.test(r.stdout + r.stderr));
});
test('T8 the command line exits 0 at the floor and 1 below it, and fails closed on a missing or unreadable summary', () => {
  const base = writeJson('base8.json', BASE);
  const ok = spawnSync(process.execPath, [scriptPath, 'unit', writeJson('s8a.json', summary(70, 60, 50, 70)), base], { encoding: 'utf8' });
  assert.strictEqual(ok.status, 0, ok.stdout + ok.stderr);
  const low = spawnSync(process.execPath, [scriptPath, 'unit', writeJson('s8b.json', summary(10, 60, 50, 70)), base], { encoding: 'utf8' });
  assert.strictEqual(low.status, 1, low.stdout + low.stderr);
  assert.ok(/statements/.test(low.stdout + low.stderr));
  const gone = spawnSync(process.execPath, [scriptPath, 'unit', path.join(tmp, 'missing-summary.json'), base], { encoding: 'utf8' });
  assert.strictEqual(gone.status, 1, 'a suite that ran but left no summary must fail');
  const unknown = spawnSync(process.execPath, [scriptPath, 'unit', writeJson('s8c.json', summary('Unknown', 60, 50, 70)), base], { encoding: 'utf8' });
  assert.strictEqual(unknown.status, 1, 'a non-numeric percentage must fail closed');
});

console.log('\nAC3 / AC4 -- the workflows (text)');
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
test('T9 PR Checks runs the unit chain under pinned c8, keeps test-output.log and the regression check, ratchets and uploads the summary', () => {
  const y = read('.github/workflows/pr-checks.yml');
  assert.ok(/c8@10\.1\.3/.test(y), 'c8 must be pinned at 10.1.3');
  assert.ok(/--include=["']?src\/\*\*/.test(y), 'c8 must include src/**');
  assert.ok(/c8@10\.1\.3 --all /.test(y), 'c8 must run with --all so files no test loads count as uncovered');
  assert.ok(/json-summary/.test(y), 'json-summary reporter');
  assert.ok(/test-output\.log/.test(y), 'test-output.log kept');
  assert.ok(/ci-test-regression-check\.js test-output\.log tests\/known-baseline-failures\.json/.test(y), 'regression check arguments unchanged');
  assert.ok(/coverage-ratchet\.js unit coverage-unit\/coverage-summary\.json/.test(y), 'ratchet step for the unit suite');
  assert.ok(/upload-artifact@v4[\s\S]{0,200}coverage-unit/.test(y) || /name: unit-coverage/.test(y), 'summary uploaded');
});
test('T10 the E2E job runs the ratchet after the c8 report and keeps exactly one continue-on-error', () => {
  const y = read('.github/workflows/e2e.yml');
  const reportAt = y.indexOf('Server code coverage report (informational)');
  const ratchetAt = y.indexOf('coverage-ratchet.js e2e coverage-e2e/coverage-summary.json');
  assert.ok(reportAt !== -1 && ratchetAt !== -1 && ratchetAt > reportAt, 'ratchet step must follow the c8 report step');
  const e2eJob = y.slice(y.indexOf('  e2e:'), y.indexOf('scenario-a-staging-e2e:'));
  assert.strictEqual((e2eJob.match(/continue-on-error:\s*true/g) || []).length, 1, 'exactly one continue-on-error in the e2e job');
});

console.log('\n[cvrt-s1] ' + passed + ' passed, ' + failed + ' failed');
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
process.exit(failed > 0 ? 1 : 0);
