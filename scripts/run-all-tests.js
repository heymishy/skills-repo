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
const os = require('os');
const { spawn } = require('child_process');

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

// Files that manipulate real, shared repo-root state (not a sandboxed temp
// copy) and are therefore unsafe to run concurrently with each other.
// Confirmed concrete collision (2026-11-01, tfhc-s9): both rename the real
// workspace/learnings.md away and back to simulate "file missing" --
// production code's path is hardcoded (src/web-ui/content/learnings-count.js),
// not injectable, so neither test can be pointed at a sandboxed path instead.
// Run sequentially (concurrency: 1), in their own phase, rather than in the
// main concurrent pool. This is a maintained, explicit list, like
// GRANDFATHER_LIST -- not a dynamically-detected one.
const SEQUENTIAL_EXCLUSIVE_LIST = [
  'tests/check-lcdf-s1-build-time-learnings-count.js',
  'tests/check-lccf-s1-fail-open-learnings-count.js'
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
 * Runs each file in `files` as its own child process, bounded by
 * `options.concurrency` concurrent children at a time (default: number of
 * logical CPUs). Each child's stdout and stderr are each buffered
 * separately and flushed as one contiguous block, to their own respective
 * real stream (process.stdout / process.stderr), only when that child
 * exits — never passed through live via `stdio: 'inherit'`, which would
 * interleave at the OS level once two children run concurrently (AC5).
 * stdout and stderr are never merged into a single buffer. A child
 * exceeding `options.timeoutMs`
 * (default 120000, matching the previous sequential behaviour) is killed
 * and recorded as failed, without blocking or delaying its siblings (AC6).
 *
 * @param {string[]} files — paths to run (each resolved via `options.cwd`
 *   if relative, matching `child_process.spawn`'s own resolution rules)
 * @param {{ concurrency?: number, timeoutMs?: number, cwd?: string }} [options]
 * @returns {Promise<{ failedFiles: string[], elapsedMs: number }>}
 */
function runFilesConcurrently(files, options) {
  options = options || {};
  const concurrency = options.concurrency || os.cpus().length;
  const timeoutMs = options.timeoutMs || 120000;
  const cwd = options.cwd || process.cwd();

  return new Promise(function(resolve) {
    const start = Date.now();
    const failedFiles = [];
    let nextIndex = 0;
    let active = 0;
    let completed = 0;

    if (files.length === 0) {
      resolve({ failedFiles: [], elapsedMs: Date.now() - start });
      return;
    }

    function launchNext() {
      while (nextIndex < files.length && active < concurrency) {
        runOne(files[nextIndex++]);
      }
    }

    function runOne(file) {
      active++;
      const stdoutChunks = [];
      const stderrChunks = [];
      const child = spawn(process.execPath, [file], { cwd: cwd });
      let timedOut = false;
      const timer = setTimeout(function() {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);

      child.stdout.on('data', function(d) { stdoutChunks.push(d); });
      child.stderr.on('data', function(d) { stderrChunks.push(d); });

      child.on('close', function(code) {
        clearTimeout(timer);
        if (stdoutChunks.length > 0) process.stdout.write(Buffer.concat(stdoutChunks));
        if (stderrChunks.length > 0) process.stderr.write(Buffer.concat(stderrChunks));
        const failed = timedOut || code !== 0;
        if (failed) failedFiles.push(file);
        active--;
        completed++;
        if (completed === files.length) {
          resolve({ failedFiles: failedFiles, elapsedMs: Date.now() - start });
        } else {
          launchNext();
        }
      });
    }

    launchNext();
  });
}

/**
 * Discovers every test file via getAllTestFiles(), runs them all through
 * runFilesConcurrently() bounded by the machine's CPU count, prints the
 * same summary format as before, and sets process.exitCode. Async because
 * runFilesConcurrently() is async — callers must await it or handle the
 * returned Promise.
 *
 * @param {string} repoRoot
 * @returns {Promise<void>}
 */
async function runAll(repoRoot) {
  const allFiles = getAllTestFiles(repoRoot).map(function(f) {
    return path.relative(repoRoot, f).split(path.sep).join('/');
  });

  const exclusiveSet = new Set(SEQUENTIAL_EXCLUSIVE_LIST);
  const exclusiveFiles = allFiles.filter(function(f) { return exclusiveSet.has(f); });
  const poolFiles = allFiles.filter(function(f) { return !exclusiveSet.has(f); });

  const start = Date.now();

  const exclusiveResult = await runFilesConcurrently(exclusiveFiles, {
    concurrency: 1,
    timeoutMs: 120000,
    cwd: repoRoot
  });

  const poolResult = await runFilesConcurrently(poolFiles, {
    // Math.max(1, Math.ceil(os.cpus().length / 3)) rather than -2: re-
    // verification found os.cpus().length - 2 still made check-rb-s3-
    // harness-agnostic-instructions.js's own 2-second wall-clock NFR budget
    // fail consistently under CPU contention. Verified at concurrency 3 (on
    // the 8-core reference machine): rb-s3 passes, and the pool still
    // completes in ~200s, comfortably clearing the >=40% AC4 target. See
    // decisions.md's 2026-11-01 DESIGN entries for the full history.
    concurrency: Math.max(1, Math.ceil(os.cpus().length / 3)),
    timeoutMs: 120000,
    cwd: repoRoot
  });

  const failedFiles = exclusiveResult.failedFiles.concat(poolResult.failedFiles);
  const elapsedMs = Date.now() - start;

  console.log('\n[run-all-tests] ' + allFiles.length + ' file(s) run, ' +
    failedFiles.length + ' failed, ' + elapsedMs + 'ms');
  if (failedFiles.length > 0) {
    console.log('[run-all-tests] Failed files (' + failedFiles.length + '):');
    failedFiles.forEach(function(f) { console.log('  - ' + f); });
  }

  process.exitCode = failedFiles.length > 0 ? 1 : 0;
}

module.exports = {
  discoverTestFiles: discoverTestFiles,
  GRANDFATHER_LIST: GRANDFATHER_LIST,
  SEQUENTIAL_EXCLUSIVE_LIST: SEQUENTIAL_EXCLUSIVE_LIST,
  getAllTestFiles: getAllTestFiles,
  runFilesConcurrently: runFilesConcurrently,
  runAll: runAll
};

if (require.main === module) {
  runAll(path.join(__dirname, '..')).catch(function(err) {
    console.error('[run-all-tests] fatal error:', err);
    process.exitCode = 1;
  });
}
