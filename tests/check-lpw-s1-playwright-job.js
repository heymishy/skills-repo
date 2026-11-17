'use strict';
// lpw-s1 T3 (AC3, AC6, AC7) -- the local Playwright suite job is switched on, non-blocking, and reports.
// Reads the workflow as text (the project declares no YAML parser). Plain Node script.
// Run: node tests/check-lpw-s1-playwright-job.js
// Story: artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s1-make-the-local-playwright-suite-trustworthy.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const wf = fs.readFileSync(path.join(root, '.github', 'workflows', 'e2e.yml'), 'utf8').replace(/\r\n/g, '\n');
const ctx = fs.readFileSync(path.join(root, '.github', 'context.yml'), 'utf8').replace(/\r\n/g, '\n');
const cfg = fs.readFileSync(path.join(root, 'playwright.config.js'), 'utf8').replace(/\r\n/g, '\n');

// The `e2e` job is the text between its key and the next job key.
const start = wf.indexOf('\n  e2e:\n');
const end = wf.indexOf('\n  scenario-a-staging-e2e:\n');
assert.ok(start !== -1 && end > start, 'could not find the e2e job block in e2e.yml');
const job = wf.slice(start, end);
function at(needle) { return job.indexOf(needle); }

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('T3a the job keeps its name and stays non-blocking, with a 30-minute limit (AC6)', function () {
  assert.ok(/name: Playwright E2E smoke tests\n/.test(job), 'job name changed (the ruleset and other checks may name it)');
  assert.ok(/timeout-minutes: 30\n/.test(job), 'timeout-minutes is not 30');
  const run = job.slice(at('- name: Run E2E tests'));
  assert.ok(/continue-on-error: true/.test(run.slice(0, run.indexOf('\n      - name:', 10) === -1 ? undefined : run.indexOf('\n      - name:', 10))), 'the run step must stay continue-on-error');
});

test('T3b context.yml switches the suite on (AC6)', function () {
  assert.ok(/^\s+e2e_tests: true\b/m.test(ctx), 'audit.e2e_tests is not true in context.yml');
});

test('T3c the local suite never reaches shared staging: the six scenario specs are excluded from it (AC3)', function () {
  const run = job.slice(at('- name: Run E2E tests'));
  assert.ok(/E2E_LOCAL_SUITE: 'true'/.test(run.slice(0, 900)), 'the run step does not set E2E_LOCAL_SUITE');
  assert.ok(!/E2E_STAGING_BASE_URL/.test(job), 'the local job must not point the suite at a staging URL');
  assert.ok(/testIgnore: process\.env\.E2E_LOCAL_SUITE === 'true' \? SCENARIO_SPECS : \[\]/.test(cfg), 'playwright.config.js does not ignore the scenario specs when E2E_LOCAL_SUITE is set');
  // Exactly the specs that import the staging URL are excluded, and the Scenario jobs still run them.
  const e2eDir = path.join(root, 'tests', 'e2e');
  const staging = fs.readdirSync(e2eDir).filter(function (f) { return /\.spec\.js$/.test(f) && /STAGING_BASE_URL/.test(fs.readFileSync(path.join(e2eDir, f), 'utf8')); }).map(function (f) { return f.replace(/\.spec\.js$/, ''); }).sort();
  const listed = (cfg.match(/const SCENARIO_SPECS = \[([\s\S]*?)\]\.map/) || [])[1] || '';
  const ignored = (listed.match(/'([^']+)'/g) || []).map(function (s) { return s.replace(/'/g, ''); }).sort();
  assert.deepStrictEqual(ignored, staging, 'the ignore list must be exactly the specs that target the shared staging URL');
  assert.ok(!/E2E_LOCAL_SUITE/.test(wf.slice(wf.indexOf('\n  scenario-a-staging-e2e:\n'))), 'the Scenario jobs must not set E2E_LOCAL_SUITE');
});

test('T3d the run writes a JSON report that is uploaded even on failure (AC6)', function () {
  assert.ok(/npm run test:e2e -- --reporter=list,json/.test(job), 'run step does not add the json reporter');
  assert.ok(/PLAYWRIGHT_JSON_OUTPUT_NAME: pw-report\.json/.test(job), 'report file name not set');
  const up = job.slice(at('name: pw-report-json') - 200, at('name: pw-report-json') + 200);
  assert.ok(up.indexOf('name: pw-report-json') !== -1, 'no pw-report-json artifact upload');
  assert.ok(/if: always\(\)/.test(up), 'report upload must run with always()');
});

test('T3e the job summary shows the per-spec table and never fails the job (AC6)', function () {
  assert.ok(/node scripts\/summarise-playwright-report\.js report pw-report\.json >> "\$GITHUB_STEP_SUMMARY"/.test(job), 'report summary step missing');
});

test('T3f server coverage is collected with a pinned c8 run through npx, informational only (AC7)', function () {
  assert.ok(/NODE_V8_COVERAGE/.test(cfg), 'playwright.config.js does not set NODE_V8_COVERAGE for the server');
  assert.ok(/gracefulShutdown/.test(cfg), 'the server must be stopped gracefully so V8 coverage is written');
  assert.ok(/npx --yes c8@\d+\.\d+\.\d+ report/.test(job), 'c8 must be run through npx at a pinned version');
  assert.ok(/node scripts\/summarise-playwright-report\.js coverage .*>> "\$GITHUB_STEP_SUMMARY"/.test(job), 'coverage summary step missing');
  assert.ok(/name: playwright-server-coverage/.test(job), 'coverage report is not uploaded');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const all = Object.assign({}, pkg.dependencies, pkg.devDependencies);
  assert.ok(!all.c8, 'c8 must not be added to package.json');
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[lpw-s1] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[lpw-s1] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[lpw-s1] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
