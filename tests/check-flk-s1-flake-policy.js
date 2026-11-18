'use strict';
// flk-s1 -- the flake ledger and the rerun rule: the policy's key rules, ledger validation (required fields, the 14-day
// review limit, overdue entries), reading flaky tests from a Playwright JSON report, and strict mode.
// Plain Node script. Run: node tests/check-flk-s1-flake-policy.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const fc = require(path.join(root, 'scripts', 'flake-check.js'));

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const TODAY = '2026-11-20';
function entry(extra) {
  return Object.assign({ test: 'tests/e2e/x.spec.js > a flaky test', firstSeen: '2026-11-18', owner: 'Hamish', issue: 'https://github.com/heymishy/skills-repo/issues/1', reviewBy: '2026-12-02', note: 'fails on the first attempt about one run in five' }, extra || {});
}
function report(specs) {
  return { suites: [{ file: 'x.spec.js', specs: specs, suites: [] }] };
}
const FLAKY = { title: 'a flaky test', file: 'tests/e2e/x.spec.js', tests: [{ status: 'flaky', projectName: 'chromium', results: [{ status: 'failed', retry: 0, errors: [{ message: 'nope' }] }, { status: 'passed', retry: 1, errors: [] }] }] };
const STEADY = { title: 'a passing test', file: 'tests/e2e/x.spec.js', tests: [{ status: 'expected', projectName: 'chromium', results: [{ status: 'passed', retry: 0, errors: [] }] }] };

test('T1 the policy states the definition, the rerun rule, the 14-day limit, quarantine and the single ledger', function () {
  const text = fs.readFileSync(path.join(root, 'tests', 'FLAKE-POLICY.md'), 'utf8');
  assert.ok(/flake/i.test(text) && /definition|what counts/i.test(text), 'defines a flake');
  assert.ok(/rerun/i.test(text) && /before/i.test(text), 'states what a rerun must have first');
  assert.ok(/14 days/.test(text), 'states the 14-day review limit');
  assert.ok(/capability-matrix/.test(text) && /quarantin/i.test(text), 'says quarantine uses the matrix');
  assert.ok(/only list|single list|one list/i.test(text), 'says the ledger is the only list');
});

test('T2a an entry missing its owner or issue is named', function () {
  const problems = fc.validateLedger({ entries: [entry({ owner: '', issue: undefined })] }, TODAY);
  assert.ok(problems.some(function (p) { return /owner/.test(p) && /a flaky test/.test(p); }), JSON.stringify(problems));
  assert.ok(problems.some(function (p) { return /issue/.test(p); }), JSON.stringify(problems));
});

test('T2b a review date more than 14 days after the first sighting is named', function () {
  const problems = fc.validateLedger({ entries: [entry({ reviewBy: '2026-12-20' })] }, TODAY);
  assert.ok(problems.some(function (p) { return /14 days/.test(p); }), JSON.stringify(problems));
  assert.deepStrictEqual(fc.validateLedger({ entries: [entry({ reviewBy: '2026-12-02' })] }, TODAY), [], '14 days exactly is allowed');
});

test('T3 an entry whose review date has passed is overdue, and the check fails', function () {
  const problems = fc.validateLedger({ entries: [entry({ reviewBy: '2026-11-19', firstSeen: '2026-11-18' })] }, TODAY);
  assert.ok(problems.some(function (p) { return /overdue|has passed/.test(p); }), JSON.stringify(problems));
  assert.notStrictEqual(fc.exitCodeForLedger(problems), 0);
});

test('T4 the flaky tests in a report are listed as file > title, and a passing test is not', function () {
  const flaky = fc.flakyTests(report([FLAKY, STEADY]));
  assert.deepStrictEqual(flaky, ['tests/e2e/x.spec.js > a flaky test']);
});

test('T5a strict mode names an untracked flake and exits 1', function () {
  const untracked = fc.untrackedFlakes(['tests/e2e/x.spec.js > a flaky test'], { entries: [] });
  assert.deepStrictEqual(untracked, ['tests/e2e/x.spec.js > a flaky test']);
  assert.strictEqual(fc.exitCodeForReport(untracked, true), 1);
});

test('T5b a tracked flake is not untracked, and strict mode exits 0', function () {
  const ledger = { entries: [entry()] };
  const untracked = fc.untrackedFlakes(['tests/e2e/x.spec.js > a flaky test'], ledger);
  assert.deepStrictEqual(untracked, []);
  assert.strictEqual(fc.exitCodeForReport(untracked, true), 0);
  assert.strictEqual(fc.exitCodeForReport(['x'], false), 0, 'without strict mode an untracked flake is reported, not failed');
});

test('T6 the committed ledger is valid and the policy is in place on master', function () {
  const ledger = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'e2e', 'flake-ledger.json'), 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  assert.deepStrictEqual(fc.validateLedger(ledger, today), []);
  assert.ok(fs.existsSync(path.join(root, 'tests', 'FLAKE-POLICY.md')));
});

(function main() {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { t.fn(); console.log('[flk-s1] PASS: ' + t.name); passed++; }
    catch (e) { console.error('[flk-s1] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
  }
  console.log('\n[flk-s1] ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
