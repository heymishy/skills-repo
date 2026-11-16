'use strict';
// bfl-s1 -- the CI known-failures baseline lists only files that really fail in CI, and a stale entry fails the gate.
// Plain Node script. Run: node tests/check-bfl-s1-baseline-tightened.js
// Story: artefacts/2026-11-16-ci-regression-review/stories/bfl-s1-clear-baseline-test-failures.md
// Test plan: artefacts/2026-11-16-ci-regression-review/test-plans/bfl-s1-test-plan.md

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CHECKER = path.join(ROOT, 'scripts', 'ci-test-regression-check.js');
const BASELINE = path.join(ROOT, 'tests', 'known-baseline-failures.json');
// The files that fail in CI on master as of the CI artefact test-results-43811318391 (867 files, 864 passed, 3 failed).
// bfl-s2 fixes them and removes them from the baseline; when it does, this list and T1 are updated with it.
const CI_FAILING = ['scripts/check-pipeline-state-integrity.js', 'tests/check-gpa-sc06-source-path-guard.js', 'tests/run-gpa-tests.js'];

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bfl-s1-'));
function logWith(failed) {
  const p = path.join(dir, 'log-' + Math.random().toString(36).slice(2) + '.txt');
  const body = ['[run-all-tests] 867 file(s) run, ' + failed.length + ' failed, 1000ms'];
  if (failed.length) { body.push('[run-all-tests] Failed files (' + failed.length + '):'); failed.forEach((f) => body.push('  - ' + f)); }
  fs.writeFileSync(p, body.join('\n') + '\n');
  return p;
}
// bfl-s2 emptied the real baseline, so the checker behaviours below are exercised against a temporary baseline that
// lists the three files this story originally tolerated (the checker takes the baseline path as its second argument).
const TEMP_BASELINE = path.join(dir, 'baseline.json');
fs.writeFileSync(TEMP_BASELINE, JSON.stringify({ recordedAt: '2026-11-16', files: CI_FAILING }));
function check(failed) { return spawnSync(process.execPath, [CHECKER, logWith(failed), TEMP_BASELINE], { cwd: ROOT, encoding: 'utf8' }); }

test('T1 the real baseline is empty (bfl-s2 fixed the last three) and its note names bfl-s1 and bfl-s2 (AC1)', () => {
  const b = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  assert.deepStrictEqual(b.files, [], 'baseline has ' + b.files.length + ' entries');
  assert.ok(/^\d{4}-\d{2}-\d{2}/.test(b.recordedAt) && b.recordedAt >= '2026-11-16', 'recordedAt ' + b.recordedAt);
  assert.ok(typeof b.note === 'string' && b.note.indexOf('bfl-s1') !== -1 && b.note.indexOf('bfl-s2') !== -1, 'note does not name bfl-s1 and bfl-s2');
});

test('T2 a failure in a previously tolerated file is a NEW regression and exits 1 (AC2)', () => {
  const r = check(CI_FAILING.concat(['tests/check-artefact-coverage.js']));
  assert.strictEqual(r.status, 1, 'exit ' + r.status + ' out=' + r.stdout.slice(0, 200));
  assert.ok(r.stderr.indexOf('tests/check-artefact-coverage.js') !== -1, 'the new regression is not named: ' + r.stderr.slice(0, 200));
});

test('T3 a baseline entry that does not fail is a stale entry and exits 1 (AC3)', () => {
  const r = check(CI_FAILING.slice(0, 2));
  assert.strictEqual(r.status, 1, 'exit ' + r.status);
  const out = r.stdout + r.stderr;
  assert.ok(out.indexOf('stale baseline entry: ' + CI_FAILING[2]) !== -1, 'stale entry not reported: ' + out.slice(0, 300));
});

test('T4 failures equal to the baseline exit 0 (AC4)', () => {
  const r = check(CI_FAILING);
  assert.strictEqual(r.status, 0, 'exit ' + r.status + ' stderr=' + r.stderr.slice(0, 200));
  assert.ok(r.stdout.indexOf('no new regressions') !== -1);
});

test('T5 the two existing checker tests still pass (AC5)', () => {
  ['check-ci-test-regression-check.js', 'check-tst-s1-baseline-triage.js'].forEach((f) => {
    const r = spawnSync(process.execPath, [path.join(ROOT, 'tests', f)], { cwd: ROOT, encoding: 'utf8' });
    assert.strictEqual(r.status, 0, f + ' exit ' + r.status + ': ' + (r.stdout + r.stderr).split('\n').filter((l) => /FAIL|fail/.test(l)).slice(0, 3).join(' | '));
  });
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) { /* temp cleanup is best effort */ }
  console.log('[bfl-s1-baseline-tightened] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
