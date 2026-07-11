'use strict';
// check-bri-s3.2-dor-gate-evaluator.js
//
// Integration test for bri-s3.2 AC3/AC4 — verifies the definition-of-ready
// gate evaluator (src/enforcement/cli-outer-loop.js's validate()) returns a
// distinct pass result for a complete DoR input and a distinct, reasoned
// fail result for an incomplete one. This is the data-layer guarantee the
// bri-s3.2 Playwright spec's UI pass/fail assertions depend on (per the
// test plan: "Definition-of-ready gate evaluator returns a distinct pass and
// fail result").
//
// The "pass" case uses this story's OWN real, already-signed-off DoR
// artefact on disk (artefacts/2026-07-09-beta-readiness-infra/dor/
// bri-s3.2-signup-onboarding-journey-dor.md) rather than a synthetic fixture
// — it is the most faithful available proof that a genuinely-approved DoR
// artefact validates cleanly. The "fail" case is a minimal synthetic
// artefact referencing a non-existent story file (H1), mirroring the
// existing check-cdg4-gate-confirm-validation.js IT2 pattern.
//
// Run: node tests/check-bri-s3.2-dor-gate-evaluator.js
// Exit 0 if all pass, exit 1 if any fail.

var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
var os     = require('os');

var { validate } = require('../src/enforcement/cli-outer-loop');

var REPO_ROOT = path.resolve(__dirname, '..');
var REAL_DOR_REL_PATH = 'artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.2-signup-onboarding-journey-dor.md';

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS] ' + name);
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err));
  }
}

// ── Pass case: this story's own real, signed-off DoR artefact ──────────────

test('real signed-off bri-s3.2 DoR artefact validates with exitCode 0', function() {
  var result = validate(REAL_DOR_REL_PATH, 'definition-of-ready', REPO_ROOT);
  assert.strictEqual(result.exitCode, 0, 'expected exitCode 0 (pass), got ' + result.exitCode + ': ' + result.stderr);
});

test('pass result has no stderr reason (clean pass)', function() {
  var result = validate(REAL_DOR_REL_PATH, 'definition-of-ready', REPO_ROOT);
  assert.strictEqual(result.stderr, '');
});

// ── Fail case: synthetic DoR artefact referencing a non-existent story ─────

var tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bri-s3-2-dor-gate-'));

test('a deliberately incomplete DoR input (missing story artefact) fails validation', function() {
  var failingRelPath = path.join('artefacts', 'bri-s3-2-fail-fixture', 'dor', 'incomplete-dor.md');
  var failingAbsPath = path.join(tmpRoot, failingRelPath);
  fs.mkdirSync(path.dirname(failingAbsPath), { recursive: true });
  fs.writeFileSync(failingAbsPath, [
    '# Definition of Ready: Incomplete fixture',
    '',
    '**Story reference:** artefacts/bri-s3-2-fail-fixture/stories/nonexistent-story.md',
    ''
  ].join('\n'), 'utf8');

  var result = validate(failingRelPath, 'definition-of-ready', tmpRoot);
  assert.notStrictEqual(result.exitCode, 0, 'expected a non-zero (fail) exitCode');
  assert.ok(result.stderr && result.stderr.length > 0, 'expected a non-empty failure reason');
});

test('the pass and fail results are distinguishable from each other', function() {
  var passResult = validate(REAL_DOR_REL_PATH, 'definition-of-ready', REPO_ROOT);

  var failingRelPath = path.join('artefacts', 'bri-s3-2-fail-fixture', 'dor', 'incomplete-dor-2.md');
  var failingAbsPath = path.join(tmpRoot, failingRelPath);
  fs.mkdirSync(path.dirname(failingAbsPath), { recursive: true });
  fs.writeFileSync(failingAbsPath, [
    '# Definition of Ready: Incomplete fixture 2',
    '',
    '**Story reference:** artefacts/bri-s3-2-fail-fixture/stories/still-nonexistent.md',
    ''
  ].join('\n'), 'utf8');
  var failResult = validate(failingRelPath, 'definition-of-ready', tmpRoot);

  assert.notStrictEqual(passResult.exitCode, failResult.exitCode, 'pass and fail exitCodes must differ');
  assert.notStrictEqual(passResult.stderr, failResult.stderr, 'pass and fail stderr reasons must differ');
});

fs.rmSync(tmpRoot, { recursive: true, force: true });

console.log('\n[bri-s3.2-dor-gate-evaluator] ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  failures.forEach(function(f) { console.error('FAILED: ' + f.name + ' -- ' + (f.err && f.err.stack || f.err)); });
  process.exit(1);
}
process.exit(0);
