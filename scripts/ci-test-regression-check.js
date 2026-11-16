'use strict';

/**
 * bri-s2.5 follow-up: gate the "Unit test chain" CI step on NEW test
 * regressions only, not on this repo's pre-existing, already-documented
 * baseline failures (currently ~69-73 files, tracked across several
 * stories' decisions.md entries — see pcr-s1's AC1 verdict-parity finding
 * for the fullest accounting).
 *
 * Without this, the PR-checks workflow's Unit test chain step fails on
 * every single PR regardless of content, since `npm test` exits non-zero
 * whenever ANY file fails — including all the pre-existing ones. That
 * makes the gate permanently red and useless as a signal.
 *
 * Reads a captured `npm test` output log, extracts the "Failed files (N):"
 * list scripts/run-all-tests.js prints, and diffs it against a checked-in
 * baseline (tests/known-baseline-failures.json). Exits 0 only when the
 * failing set equals the baseline. Exits 1 for a file that fails but is NOT
 * in the baseline (a genuine new regression), and (bfl-s1, 2026-11-16) for a
 * baseline entry that no longer fails ("stale baseline entry"): it must be
 * removed in the PR that fixed it, so the list can shrink but never rot.
 *
 * Usage: node scripts/ci-test-regression-check.js <path-to-test-output-log>
 */

const fs = require('fs');
const path = require('path');

const BASELINE_PATH = path.join(__dirname, '..', 'tests', 'known-baseline-failures.json');

function extractFailedFiles(logText) {
  const marker = /Failed files \(\d+\):/;
  const lines = logText.split(/\r?\n/);
  const markerIdx = lines.findIndex((l) => marker.test(l));
  if (markerIdx === -1) return [];
  const failed = [];
  for (let i = markerIdx + 1; i < lines.length; i++) {
    const m = lines[i].match(/^\s{2}-\s(.+)$/);
    if (!m) break;
    failed.push(m[1].trim());
  }
  return failed;
}

function loadBaseline(baselinePath) {
  const p = baselinePath || BASELINE_PATH;
  if (!fs.existsSync(p)) return { files: [] };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function run(logPath, baselinePath) {
  if (!logPath || !fs.existsSync(logPath)) {
    console.error('[ci-test-regression-check] usage: node scripts/ci-test-regression-check.js <test-output-log> [baseline-path]');
    process.exit(1);
  }
  const logText = fs.readFileSync(logPath, 'utf8');
  const currentFailures = extractFailedFiles(logText);
  const baseline = loadBaseline(baselinePath);
  const baselineSet = new Set(baseline.files || []);

  const newFailures = currentFailures.filter((f) => !baselineSet.has(f));
  const nowPassing = (baseline.files || []).filter((f) => !currentFailures.includes(f));

  console.log('[ci-test-regression-check] ' + currentFailures.length + ' file(s) currently failing, ' +
    baselineSet.size + ' in known baseline (recorded ' + (baseline.recordedAt || 'unknown date') + ')');

  // bfl-s1: a baseline entry that no longer fails is a stale entry and fails the gate. Left as an info line, the list went
  // from 70 files to 67 passing ones being excused, so a regression in any of them would have been reported as "known".
  if (nowPassing.length > 0) {
    console.error('[ci-test-regression-check] ' + nowPassing.length + ' stale baseline entr' + (nowPassing.length === 1 ? 'y' : 'ies') + ' (the file no longer fails; remove it from tests/known-baseline-failures.json in the PR that fixed it):');
    nowPassing.forEach((f) => console.error('  stale baseline entry: ' + f));
  }

  if (newFailures.length > 0) {
    console.error('[ci-test-regression-check] ' + newFailures.length + ' NEW regression(s) not in the known baseline:');
    newFailures.forEach((f) => console.error('  ! ' + f));
  }

  if (newFailures.length > 0 || nowPassing.length > 0) {
    process.exit(1);
  }

  console.log('[ci-test-regression-check] no new regressions — all failing files are already-documented pre-existing baseline gaps');
  process.exit(0);
}

if (require.main === module) run(process.argv[2], process.argv[3]);
module.exports = { extractFailedFiles, loadBaseline, run };
