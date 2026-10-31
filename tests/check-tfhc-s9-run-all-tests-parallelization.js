#!/usr/bin/env node
/**
 * check-tfhc-s9-run-all-tests-parallelization.js
 *
 * Tests for tfhc-s9 — runFilesConcurrently(), the bounded-concurrency
 * replacement for scripts/run-all-tests.js's sequential spawnSync loop.
 *
 * Covers: AC1 (x2), AC2, AC3, AC5, AC6 (unit); AC1 integration (seam).
 * AC4 is deliberately not covered here — see decisions.md / test-plan
 * (RISK-ACCEPT 1-M1): it is measured manually at /definition-of-done.
 *
 * Run: node tests/check-tfhc-s9-run-all-tests-parallelization.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { runFilesConcurrently, runAll, GRANDFATHER_LIST } = require('../scripts/run-all-tests.js');

const fixturesDir = path.join(__dirname, 'fixtures');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function ok() { totalPassed++; }
function fail(label, message) {
  totalFailed++;
  issues.push(`  ✗ [${label}] ${message}`);
}
function assert(label, condition, message) {
  if (condition) { ok(); } else { fail(label, message); }
}
function fixture(name) {
  return path.join(fixturesDir, name);
}
function makeTempLogPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tfhc-s9-'));
  return path.join(dir, 'log.txt');
}

async function main() {
  // ── AC1: pass/fail aggregation ──────────────────────────────────────────
  {
    const T = 'AC1-mixed-pass-fail-aggregation';
    const files = [fixture('tfhc-s9-pass-fast.js'), fixture('tfhc-s9-fail-fast.js'), fixture('tfhc-s9-pass-fast.js')];
    const { failedFiles } = await runFilesConcurrently(files, { concurrency: 3 });
    assert(T, failedFiles.length === 1 && failedFiles[0] === fixture('tfhc-s9-fail-fast.js'),
      `Expected failedFiles to contain exactly [${fixture('tfhc-s9-fail-fast.js')}], got ${JSON.stringify(failedFiles)}`);
  }

  {
    const T = 'AC1-no-dropped-failure-under-queueing';
    const files = [fixture('tfhc-s9-fail-fast.js'), fixture('tfhc-s9-fail-fast.js'), fixture('tfhc-s9-fail-fast.js')];
    const { failedFiles } = await runFilesConcurrently(files, { concurrency: 2 });
    assert(T, failedFiles.length === 3,
      `Expected all 3 failing files reported, got ${failedFiles.length}: ${JSON.stringify(failedFiles)}`);
  }

  // ── AC2: peak concurrency never exceeds the configured limit ───────────
  {
    const T = 'AC2-peak-concurrency-never-exceeds-limit';
    const logPath = makeTempLogPath();
    process.env.TFHC_S9_LOG_PATH = logPath;
    process.env.TFHC_S9_SLEEP_MS = '150';
    const files = new Array(6).fill(fixture('tfhc-s9-sleep-marker.js'));
    await runFilesConcurrently(files, { concurrency: 2 });
    delete process.env.TFHC_S9_LOG_PATH;
    delete process.env.TFHC_S9_SLEEP_MS;

    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
    const events = lines.map(function(line) {
      const parts = line.split(' ');
      return { type: parts[0], ts: parseInt(parts[2], 10) };
    }).sort(function(a, b) { return a.ts - b.ts; });

    let current = 0;
    let peak = 0;
    events.forEach(function(e) {
      if (e.type === 'START') { current++; if (current > peak) peak = current; }
      else { current--; }
    });

    assert(T, peak <= 2, `Expected peak concurrency <= 2, measured peak=${peak}`);
    assert(T + '-all-ran', lines.length === 12, `Expected 12 log lines (6 START + 6 END), got ${lines.length}`);
  }

  // ── AC3: reported elapsed time is real concurrent wall-clock, not serial sum ──
  {
    const T = 'AC3-real-concurrent-wallclock-not-serial-sum';
    process.env.TFHC_S9_LOG_PATH = makeTempLogPath();
    process.env.TFHC_S9_SLEEP_MS = '250';
    const files = [fixture('tfhc-s9-sleep-marker.js'), fixture('tfhc-s9-sleep-marker.js')];
    const { elapsedMs } = await runFilesConcurrently(files, { concurrency: 2 });
    delete process.env.TFHC_S9_LOG_PATH;
    delete process.env.TFHC_S9_SLEEP_MS;
    assert(T, elapsedMs < 500, `Expected elapsedMs < 500 (below the ~500ms serial-sum floor for two 250ms runs), got ${elapsedMs}`);
    assert(T + '-sanity-floor', elapsedMs >= 200, `Expected elapsedMs >= 200 (sanity floor, not a near-zero no-op), got ${elapsedMs}`);
  }

  // ── AC5: each file's output stays contiguous, never interleaved ────────
  {
    const T = 'AC5-per-file-output-stays-contiguous';
    process.env.TFHC_S9_LINE_COUNT = '5';
    process.env.TFHC_S9_LINE_DELAY_MS = '15';
    const files = [fixture('tfhc-s9-print-lines.js'), fixture('tfhc-s9-print-lines.js')];

    const originalWrite = process.stdout.write;
    const chunks = [];
    process.stdout.write = function(chunk) { chunks.push(chunk.toString()); return true; };
    try {
      await runFilesConcurrently(files, { concurrency: 2 });
    } finally {
      process.stdout.write = originalWrite;
    }
    delete process.env.TFHC_S9_LINE_COUNT;
    delete process.env.TFHC_S9_LINE_DELAY_MS;

    const outputLines = chunks.join('').split('\n').filter(Boolean);
    const labelOf = function(line) {
      const m = line.match(/^(P\d+)-line-\d+$/);
      return m ? m[1] : null;
    };
    const labelSequence = outputLines.map(labelOf).filter(Boolean);
    const distinctLabels = Array.from(new Set(labelSequence));

    assert(T + '-two-distinct-files-produced-output', distinctLabels.length === 2,
      `Expected output from exactly 2 distinct child processes, found labels: ${JSON.stringify(distinctLabels)}`);

    let contiguous = true;
    let violation = null;
    distinctLabels.forEach(function(label) {
      const indices = [];
      labelSequence.forEach(function(l, i) { if (l === label) indices.push(i); });
      for (let k = 1; k < indices.length; k++) {
        if (indices[k] !== indices[k - 1] + 1) { contiguous = false; violation = label; }
      }
    });
    assert(T, contiguous,
      `Expected each file's output to be one contiguous run; label ${violation}'s lines were interrupted. Full sequence: ${JSON.stringify(labelSequence)}`);
  }

  // ── AC6: a hung file is killed without blocking its siblings ───────────
  // CORRECTED (2026-11-01, Task 3 code-quality finding -- see decisions.md):
  // the original version used concurrency: 3 == files.length (nothing ever
  // queues) and a pass-fast fixture (exits in a few ms), so a fully-
  // serialized replay of the same 3 fixtures ALSO passed both of its old
  // assertions (empirically confirmed: 482ms serialized vs 350ms real
  // concurrent, both well under the old 1000ms threshold) -- the test had
  // zero discriminating power. This version uses concurrency: 2 (so the
  // hang file permanently occupies one slot and the 2nd sleep-marker
  // sibling can only start once the 1st sibling's slot frees) and asserts
  // directly, via timestamped log events (same technique as AC2), that the
  // 2nd sibling starts promptly when its slot frees -- not delayed until
  // the hang file's own timeout death.
  {
    const T = 'AC6-hung-file-killed-without-blocking-siblings';
    const logPath = makeTempLogPath();
    process.env.TFHC_S9_LOG_PATH = logPath;
    process.env.TFHC_S9_SLEEP_MS = '100';
    const files = [fixture('tfhc-s9-hang.js'), fixture('tfhc-s9-sleep-marker.js'), fixture('tfhc-s9-sleep-marker.js')];
    const testStart = Date.now();
    const { failedFiles, elapsedMs } = await runFilesConcurrently(files, { concurrency: 2, timeoutMs: 500 });
    delete process.env.TFHC_S9_LOG_PATH;
    delete process.env.TFHC_S9_SLEEP_MS;

    assert(T, failedFiles.length === 1 && failedFiles[0] === fixture('tfhc-s9-hang.js'),
      `Expected only the hang file to fail, got ${JSON.stringify(failedFiles)}`);

    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
    const events = lines.map(function(line) {
      const parts = line.split(' ');
      return { type: parts[0], ts: parseInt(parts[2], 10) };
    });
    assert(T + '-both-siblings-ran', events.length === 4,
      `Expected 2 START + 2 END events from the 2 sleep-marker siblings, got ${events.length}: ${JSON.stringify(lines)}`);

    const starts = events.filter(function(e) { return e.type === 'START'; }).map(function(e) { return e.ts; }).sort(function(a, b) { return a - b; });
    const secondSiblingStart = starts[1];
    const secondSiblingOffset = secondSiblingStart - testStart;
    assert(T + '-second-sibling-not-queued-behind-hang', secondSiblingOffset < 450,
      `Expected the 2nd sibling to start within 450ms of the batch beginning (well before the hang file's own 500ms timeout) -- a correct implementation starts it as soon as the 1st sibling's slot frees (~300-350ms here), not after the hang dies (~800ms+). Measured offset: ${secondSiblingOffset}ms, events: ${JSON.stringify(lines)}`);

    assert(T + '-elapsed-not-blocked', elapsedMs < 1000,
      `Expected elapsedMs < 1000 (dominated by the hang file's own 500ms timeout, not a serialized sum), got ${elapsedMs}`);
  }

  // ── AC1 (integration): getAllTestFiles -> runFilesConcurrently seam ─────
  // getAllTestFiles() unconditionally includes every GRANDFATHER_LIST path
  // with no existence check (unlike the dynamic check-*.js glob) -- so this
  // test's own fixture repo must contain stub versions of every
  // GRANDFATHER_LIST path, or they show up as spurious MODULE_NOT_FOUND
  // failures unrelated to the seam this test actually exercises.
  {
    const T = 'AC1-integration-seam-getAllTestFiles-to-runFilesConcurrently';
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tfhc-s9-repo-'));
    GRANDFATHER_LIST.forEach(function(rel) {
      const full = path.join(tempRoot, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, 'process.exit(0);\n');
    });
    const testsDir = path.join(tempRoot, 'tests');
    fs.mkdirSync(testsDir, { recursive: true });
    fs.writeFileSync(path.join(testsDir, 'check-tfhc-s9-fixture-a.js'), 'process.exit(0);\n');
    fs.writeFileSync(path.join(testsDir, 'check-tfhc-s9-fixture-b.js'), 'process.exit(1);\n');
    fs.writeFileSync(path.join(testsDir, 'check-tfhc-s9-fixture-c.js'), 'process.exit(0);\n');

    const originalLog = console.log;
    const logged = [];
    console.log = function() { logged.push(Array.prototype.slice.call(arguments).join(' ')); };
    const originalExitCode = process.exitCode;
    process.exitCode = undefined;
    try {
      await runAll(tempRoot);
    } finally {
      console.log = originalLog;
    }
    const exitCodeAfter = process.exitCode;
    process.exitCode = originalExitCode;

    const summaryLine = logged.find(function(l) { return l.indexOf('[run-all-tests]') !== -1 && l.indexOf('file(s) run') !== -1; });
    const expectedTotal = GRANDFATHER_LIST.length + 3;
    assert(T + '-exit-code', exitCodeAfter === 1, `Expected exitCode 1 (one fixture fails), got ${exitCodeAfter}`);
    assert(T + '-summary-counts', !!summaryLine && summaryLine.indexOf(expectedTotal + ' file(s) run, 1 failed') !== -1,
      `Expected summary to report "${expectedTotal} file(s) run, 1 failed", got: ${summaryLine}`);
    const failedLine = logged.find(function(l) { return l.indexOf('check-tfhc-s9-fixture-b.js') !== -1; });
    assert(T + '-names-failed-file', !!failedLine, `Expected failed-file list to name check-tfhc-s9-fixture-b.js, got lines: ${JSON.stringify(logged)}`);

    fs.rmSync(tempRoot, { recursive: true, force: true });
  }

  // ── Report ───────────────────────────────────────────────────────────────
  if (totalFailed > 0) {
    console.error(`[tfhc-s9-run-all-tests-parallelization] FAIL — ${issues.length} issue(s) found:`);
    issues.forEach(i => console.error(i));
    process.exit(1);
  } else {
    console.log(`[tfhc-s9-run-all-tests-parallelization] ${totalPassed} check(s) OK ✓`);
  }
}

main();
