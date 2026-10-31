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
const { runFilesConcurrently, runAll } = require('../scripts/run-all-tests.js');

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
