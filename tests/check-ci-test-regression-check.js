'use strict';

/**
 * Verifies scripts/ci-test-regression-check.js's baseline-diffing logic
 * (added alongside bri-s2.5 to fix its PR-checks workflow's Unit test
 * chain step failing on every PR regardless of content -- see
 * artefacts/2026-07-09-beta-readiness-infra/decisions.md 2026-07-12 entry).
 *
 * Run: node tests/check-ci-test-regression-check.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { extractFailedFiles } = require('../scripts/ci-test-regression-check.js');

const SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'ci-test-regression-check.js');
const BASELINE_PATH = path.join(__dirname, 'known-baseline-failures.json');

const SUITE = '[ci-test-regression-check]';
let passed = 0;
let failed = 0;

function pass(name, msg) { passed++; console.log('  ✓ ' + name + (msg ? ': ' + msg : '')); }
function fail(name, msg) { failed++; console.error('  ✗ ' + name + (msg ? ': ' + msg : '')); }

function makeLog(failedFiles) {
  const lines = ['[run-all-tests] 300 file(s) run, ' + failedFiles.length + ' failed, 12345ms'];
  if (failedFiles.length > 0) {
    lines.push('[run-all-tests] Failed files (' + failedFiles.length + '):');
    failedFiles.forEach((f) => lines.push('  - ' + f));
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// U1 — extractFailedFiles() parses the run-all-tests.js output format
// ---------------------------------------------------------------------------
(function u1() {
  const files = extractFailedFiles(makeLog(['tests/check-a.js', 'tests/check-b.js']));
  if (files.length === 2 && files[0] === 'tests/check-a.js' && files[1] === 'tests/check-b.js') {
    pass('U1', 'extracts the exact failed-file list');
  } else {
    fail('U1', 'got: ' + JSON.stringify(files));
  }
})();

// ---------------------------------------------------------------------------
// U2 — extractFailedFiles() returns [] when nothing failed
// ---------------------------------------------------------------------------
(function u2() {
  const files = extractFailedFiles(makeLog([]));
  if (files.length === 0) {
    pass('U2', 'empty array when no Failed files section present');
  } else {
    fail('U2', 'got: ' + JSON.stringify(files));
  }
})();

// ---------------------------------------------------------------------------
// IT1 — the script exits 0 when every failing file is in the baseline
// (spawned as a real child process against a temp baseline file, not
// in-process mocking, since process.exit() cannot be safely intercepted
// in-process without also halting control flow, which would corrupt the
// result — see decisions.md for the false-negative this caused initially).
// ---------------------------------------------------------------------------
(function it1() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-regress-'));
  const logPath = path.join(tmpDir, 'log.txt');
  const baselinePath = path.join(tmpDir, 'baseline.json');
  fs.writeFileSync(logPath, makeLog(['tests/check-a.js', 'tests/check-b.js']));
  fs.writeFileSync(baselinePath, JSON.stringify({ recordedAt: '2026-07-12', files: ['tests/check-a.js', 'tests/check-b.js'] }));
  const result = spawnSync(process.execPath, [SCRIPT_PATH, logPath, baselinePath], { encoding: 'utf8' });
  if (result.status === 0) {
    pass('IT1', 'exits 0 when all failures are in the baseline');
  } else {
    fail('IT1', 'expected exit 0, got ' + result.status + ' stderr=' + result.stderr);
  }
})();

// ---------------------------------------------------------------------------
// IT2 — the script exits 1 and names the file when a NEW failure appears
// ---------------------------------------------------------------------------
(function it2() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-regress-'));
  const logPath = path.join(tmpDir, 'log.txt');
  const baselinePath = path.join(tmpDir, 'baseline.json');
  fs.writeFileSync(logPath, makeLog(['tests/check-a.js', 'tests/check-new-regression.js']));
  fs.writeFileSync(baselinePath, JSON.stringify({ recordedAt: '2026-07-12', files: ['tests/check-a.js'] }));
  const result = spawnSync(process.execPath, [SCRIPT_PATH, logPath, baselinePath], { encoding: 'utf8' });
  if (result.status === 1 && result.stderr.includes('tests/check-new-regression.js')) {
    pass('IT2', 'exits 1 and names the new regression when a non-baseline file fails');
  } else {
    fail('IT2', 'expected exit 1 naming the file, got exit=' + result.status + ' stderr=' + result.stderr);
  }
})();

// ---------------------------------------------------------------------------
// IT3 — a baseline file that now passes is reported but does not fail the gate
// ---------------------------------------------------------------------------
(function it3() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-regress-'));
  const logPath = path.join(tmpDir, 'log.txt');
  const baselinePath = path.join(tmpDir, 'baseline.json');
  fs.writeFileSync(logPath, makeLog(['tests/check-a.js']));
  fs.writeFileSync(baselinePath, JSON.stringify({ recordedAt: '2026-07-12', files: ['tests/check-a.js', 'tests/check-b.js'] }));
  const result = spawnSync(process.execPath, [SCRIPT_PATH, logPath, baselinePath], { encoding: 'utf8' });
  if (result.status === 0 && result.stdout.includes('tests/check-b.js')) {
    pass('IT3', 'exits 0 and reports a now-passing baseline file without failing the gate');
  } else {
    fail('IT3', 'expected exit 0 reporting check-b.js, got exit=' + result.status + ' stdout=' + result.stdout);
  }
})();

// ---------------------------------------------------------------------------
// U3 — known-baseline-failures.json exists and is well-formed
// ---------------------------------------------------------------------------
(function u3() {
  const baselinePath = path.join(__dirname, 'known-baseline-failures.json');
  if (!fs.existsSync(baselinePath)) {
    fail('U3', 'tests/known-baseline-failures.json does not exist');
    return;
  }
  const data = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  if (Array.isArray(data.files) && data.files.length > 0 && typeof data.recordedAt === 'string') {
    pass('U3', 'known-baseline-failures.json is well-formed with ' + data.files.length + ' entries');
  } else {
    fail('U3', 'malformed baseline file');
  }
})();

console.log('');
if (failed > 0) {
  console.error(SUITE + ' ' + passed + ' passed, ' + failed + ' failed');
  process.exit(1);
} else {
  console.log(SUITE + ' ' + passed + ' passed, 0 failed');
}
