#!/usr/bin/env node
/**
 * scripts/run-all-tests.js — pcr-s1
 *
 * Replaces package.json's monolithic `&&`-chained scripts.test string with a
 * single invocation that discovers test files dynamically instead of
 * requiring every new test file to be manually appended to a shared line —
 * that shared line is exactly what caused recurring merge conflicts between
 * concurrently-open parallel-wave story branches (see
 * artefacts/2026-07-11-pipeline-conflict-reduction).
 *
 * Discovery mechanism:
 *   1. GRANDFATHER_LIST — a fixed list of the 16 files that were chained
 *      in package.json before this change but do not match the
 *      `check-*.js` naming convention (so they can't be dynamically
 *      discovered by glob). Kept exactly as-is; no behaviour change.
 *   2. Dynamic glob of `tests/check-*.js` and `.github/scripts/check-*.js`
 *      (non-recursive) — covers every file following the naming
 *      convention, present today and added in future, with zero
 *      package.json edits required (this is what makes AC2's zero-conflict
 *      property true: there is nothing left in package.json to collide on).
 *
 * Each discovered file is run as its own `node <file>` child process —
 * the same execution mechanism the old `&&` chain already used — and
 * failures are aggregated rather than short-circuiting, so one failing
 * file no longer hides every file listed after it (a real, pre-existing
 * gap this change closes as a side effect — see the plan's
 * "Pre-implementation finding" section for details).
 *
 * Run: node scripts/run-all-tests.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// ── Grandfather list ─────────────────────────────────────────────────────
// The 16 files chained in package.json as of 2026-07-11 that do not match
// the `check-*.js` naming convention. Confirmed by parsing that day's
// package.json chain — see the DoR contract's "What will be built" section
// and tests/check-pcr-s1-test-runner.js's IT1 parity test, which locks this
// list to that historical snapshot.
const GRANDFATHER_LIST = [
  'tests/watermark-gate.test.js',
  'tests/failure-detector.test.js',
  'tests/failure-detector.integration.test.js',
  'src/improvement-agent/calibration.test.js',
  'src/trace-registry/getTraces.test.js',
  'src/improvement-agent/compliance-report.test.js',
  'scripts/check-pipeline-state-integrity.js',
  'tests/cli-subprocess.test.js',
  'tests/session-isolation.test.js',
  'tests/skill-discovery.test.js',
  'tests/byok-config.test.js',
  'tests/skill-launcher.test.js',
  'tests/artefact-preview.test.js',
  'tests/artefact-writeback.test.js',
  'tests/session-persistence.test.js',
  'tests/run-gpa-tests.js',
];

/**
 * Discover all `check-*.js` files directly inside `dir` (non-recursive —
 * matches the current chain's behaviour, which never referenced files in
 * subdirectories of tests/ or .github/scripts/). Returns absolute paths,
 * sorted alphabetically by basename for a stable, deterministic run order.
 *
 * @param {string} dir
 * @returns {string[]}
 */
function discoverTestFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(function(f) { return /^check-.*\.js$/.test(f); })
    .sort()
    .map(function(f) { return path.join(dir, f); });
}

/**
 * Full ordered list of test files that make up `npm test`: the grandfather
 * list (fixed order, as before) followed by dynamically-discovered
 * `tests/check-*.js` and `.github/scripts/check-*.js` files (each sorted).
 *
 * @param {string} repoRoot
 * @returns {string[]} absolute file paths
 */
function getAllTestFiles(repoRoot) {
  const grandfather = GRANDFATHER_LIST.map(function(f) { return path.join(repoRoot, f); });
  const testsDiscovered = discoverTestFiles(path.join(repoRoot, 'tests'));
  const ghScriptsDiscovered = discoverTestFiles(path.join(repoRoot, '.github', 'scripts'));
  return grandfather.concat(testsDiscovered, ghScriptsDiscovered);
}

/**
 * Run every file returned by getAllTestFiles() as its own `node <file>`
 * child process, aggregate pass/fail, print a summary, and exit non-zero if
 * any file failed. Does not short-circuit on the first failure — every
 * file always runs, so a single broken check can never silently hide the
 * rest of the suite (unlike the `&&`-chain this replaces).
 *
 * @param {string} repoRoot
 */
function runAll(repoRoot) {
  const files = getAllTestFiles(repoRoot);
  const failedFiles = [];
  const start = Date.now();

  files.forEach(function(f) {
    const rel = path.relative(repoRoot, f).split(path.sep).join('/');
    const result = spawnSync(process.execPath, [f], {
      cwd: repoRoot,
      stdio: 'inherit',
      timeout: 120000,
    });
    const code = result.status === null ? 1 : result.status;
    if (code !== 0) failedFiles.push(rel);
  });

  const elapsedMs = Date.now() - start;
  console.log('\n[run-all-tests] ' + files.length + ' file(s) run, ' +
    failedFiles.length + ' failed, ' + elapsedMs + 'ms');
  if (failedFiles.length > 0) {
    console.log('[run-all-tests] Failed files (' + failedFiles.length + '):');
    failedFiles.forEach(function(f) { console.log('  - ' + f); });
  }

  process.exitCode = failedFiles.length > 0 ? 1 : 0;
}

module.exports = { discoverTestFiles: discoverTestFiles, GRANDFATHER_LIST: GRANDFATHER_LIST, getAllTestFiles: getAllTestFiles, runAll: runAll };

if (require.main === module) {
  runAll(path.join(__dirname, '..'));
}
