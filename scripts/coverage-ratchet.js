#!/usr/bin/env node
/**
 * scripts/coverage-ratchet.js -- cvrt-s1
 *
 * A pull request may not lower a suite's server code coverage below the recorded baseline.
 *
 * Usage: node scripts/coverage-ratchet.js <suite> <coverage-summary.json> [baseline.json]
 *   suite            "unit" (the unit chain, scripts/run-all-tests.js) or "e2e" (the browser suite)
 *   summary          a c8 json-summary file; its "total" block is compared
 *   baseline         tests/coverage-baseline.json as read from the BASE branch (so a pull request cannot lower its
 *                    own floor, the same rule as the known-failures baseline). Omitted or not on disk: the base
 *                    branch has none yet, so the check passes with a notice.
 *
 * Exit 0: every metric is at or above its baseline minus the tolerance (or there is no baseline yet).
 * Exit 1: a metric is below its floor, the baseline is malformed or has no entry for the suite, or the summary is
 *         missing or not numeric. Fails closed: an unreadable input never passes silently.
 *
 * Baseline shape: { "suites": { "unit": { "statements": n, "branches": n, "functions": n, "lines": n }, "e2e": {...} } }
 */
'use strict';

const fs = require('fs');

const METRICS = ['statements', 'branches', 'functions', 'lines'];
const TOLERANCE = 0.5; // percentage points

function isNumber(n) { return typeof n === 'number' && isFinite(n); }

/**
 * Compare a c8 json-summary object with one suite's baseline entry.
 * @param {string} suite
 * @param {object} summary  c8 json-summary ({ total: { statements: { pct }, ... } })
 * @param {object} baseline parsed baseline file ({ suites: { [suite]: { statements, ... } } })
 * @returns {{ok: boolean, failures: Array<{metric: string, baseline: number, measured: number}>, floor: object}}
 */
function compare(suite, summary, baseline) {
  const entry = baseline && baseline.suites && baseline.suites[suite];
  if (!entry) throw new Error('the baseline has no entry for suite "' + suite + '"');
  const total = summary && summary.total;
  if (!total) throw new Error('the summary has no "total" block');
  const failures = [];
  const floor = {};
  METRICS.forEach(function(metric) {
    const base = entry[metric];
    const measured = total[metric] && total[metric].pct;
    if (!isNumber(base)) throw new Error('the baseline for suite "' + suite + '" has no numeric ' + metric);
    if (!isNumber(measured)) throw new Error('the summary has no numeric ' + metric + ' percentage (got ' + JSON.stringify(measured) + ')');
    floor[metric] = Math.round((base - TOLERANCE) * 100) / 100;
    if (measured < base - TOLERANCE) failures.push({ metric: metric, baseline: base, measured: measured });
  });
  return { ok: failures.length === 0, failures: failures, floor: floor };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function main(argv) {
  const suite = argv[0];
  const summaryPath = argv[1];
  const baselinePath = argv[2];
  if (!suite || !summaryPath) {
    console.error('Usage: node scripts/coverage-ratchet.js <suite> <coverage-summary.json> [baseline.json]');
    return 1;
  }

  let summary;
  try { summary = readJson(summaryPath); }
  catch (e) {
    console.error('[coverage-ratchet] ' + suite + ': cannot read the coverage summary ' + summaryPath + ' (' + e.message + '). The suite ran, so a missing summary fails the check.');
    return 1;
  }

  if (!baselinePath || !fs.existsSync(baselinePath)) {
    const t = summary && summary.total;
    const shown = t ? METRICS.map(function(m) { return m + ' ' + (t[m] && t[m].pct); }).join(', ') : 'no total block';
    console.log('[coverage-ratchet] ' + suite + ': no baseline on the base branch yet, so nothing to compare. Measured: ' + shown + '.');
    return 0;
  }

  let baseline;
  try { baseline = readJson(baselinePath); }
  catch (e) {
    console.error('[coverage-ratchet] ' + suite + ': the baseline file ' + baselinePath + ' is not valid JSON (' + e.message + '). Failing closed.');
    return 1;
  }

  let result;
  try { result = compare(suite, summary, baseline); }
  catch (e) {
    console.error('[coverage-ratchet] ' + suite + ': ' + e.message + ' (baseline file ' + baselinePath + '). Failing closed.');
    return 1;
  }

  if (result.ok) {
    console.log('[coverage-ratchet] ' + suite + ': at or above the floor on all four metrics (tolerance ' + TOLERANCE + ' points).');
    return 0;
  }
  console.error('[coverage-ratchet] ' + suite + ': coverage fell below the recorded baseline by more than ' + TOLERANCE + ' points:');
  result.failures.forEach(function(f) {
    console.error('  ! ' + f.metric + ': baseline ' + f.baseline + '%, measured ' + f.measured + '% (floor ' + result.floor[f.metric] + '%)');
  });
  console.error('Add tests for the code this change adds, or restore the tests it removed. The baseline is read from the base branch, so this pull request cannot lower its own floor: if the drop is intended, the operator decides whether to lower tests/coverage-baseline.json on the base branch first or to merge with this check red.');
  return 1;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { compare, TOLERANCE, METRICS };
