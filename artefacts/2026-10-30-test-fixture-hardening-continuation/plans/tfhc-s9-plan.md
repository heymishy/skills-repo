# Parallelize scripts/run-all-tests.js's sequential child-process execution — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make `node scripts/run-all-tests.js` run its discovered test files concurrently (bounded by CPU count) instead of one at a time, while keeping pass/fail aggregation, real wall-clock reporting, and per-file output exactly as reliable as today.
**Branch:** `feature/tfhc-s9`
**Worktree:** `.worktrees/tfhc-s9`
**Test command:** `npm test` (= `node scripts/run-all-tests.js`); this story's own new test file is run directly via `node tests/check-tfhc-s9-run-all-tests-parallelization.js` during development (seconds, not ~8 minutes) and is also swept into `npm test` once committed (matches the `check-*.js` glob).

**Task count note:** This plan uses 3 tasks rather than the skill's default one-task-per-AC granularity, per the operator's explicit instruction ("Yes with 3") at `/branch-setup` hand-off. Each task is correspondingly larger than the usual 2–5 minutes and bundles 2 ACs that share the same fixture/mechanism, rather than being split further.

---

## File map

```
Create:
  tests/fixtures/tfhc-s9-pass-fast.js            — exits 0 immediately
  tests/fixtures/tfhc-s9-fail-fast.js            — exits 1 immediately
  tests/fixtures/tfhc-s9-sleep-marker.js         — sleeps a configurable ms, logs start/end to a shared file
  tests/fixtures/tfhc-s9-hang.js                 — never exits on its own (killed via timeout)
  tests/fixtures/tfhc-s9-print-lines.js          — prints several delayed, self-labelled lines
  tests/check-tfhc-s9-run-all-tests-parallelization.js — the story's own test file (6 unit + 1 integration test)

Modify:
  scripts/run-all-tests.js — add exported runFilesConcurrently(files, options); runAll() becomes
                              its async wrapper; require.main entry point handles the returned Promise
```

---

## Task 1: Core concurrent runner (`runFilesConcurrently`) + AC1 (pass/fail aggregation)

**Status: COMPLETE** — spec compliance ✅, code quality ✅ (2 review rounds: Important finding on stdout/stderr channel merge, Minor on dead import — both fixed and re-approved). Ending SHA: `3901b1ed08a604389e35ec2287b34a4e32607054`. Also absorbed two real findings beyond the original spec during execution — a `SEQUENTIAL_EXCLUSIVE_LIST` mechanism (fixing a genuine file-race correctness bug between 2 unrelated test files) and a concurrency-cap tuning pass (`Math.max(1, Math.ceil(os.cpus().length / 3))` instead of the originally-planned `os.cpus().length`) — both logged in full in `decisions.md`'s 2026-11-01 entries, both operator-approved.

**Files:**
- Create: `tests/fixtures/tfhc-s9-pass-fast.js`
- Create: `tests/fixtures/tfhc-s9-fail-fast.js`
- Modify: `scripts/run-all-tests.js`
- Create: `tests/check-tfhc-s9-run-all-tests-parallelization.js` (started here, extended in Tasks 2–3)

- [x] **Step 1: Write the failing test**

Create `tests/check-tfhc-s9-run-all-tests-parallelization.js` with this initial content:

```js
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
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-tfhc-s9-run-all-tests-parallelization.js
```

Expected output: `Error: Cannot find module '../scripts/run-all-tests.js'` export `runFilesConcurrently` — specifically a `TypeError: runFilesConcurrently is not a function` (the function doesn't exist yet), or the fixture files don't exist yet (`ENOENT`). Either way, a hard failure before any assertion runs.

- [x] **Step 3: Create the two simplest fixtures**

`tests/fixtures/tfhc-s9-pass-fast.js`:
```js
#!/usr/bin/env node
process.exit(0);
```

`tests/fixtures/tfhc-s9-fail-fast.js`:
```js
#!/usr/bin/env node
process.exit(1);
```

- [x] **Step 4: Implement `runFilesConcurrently` and wire it into `runAll`**

Modify `scripts/run-all-tests.js`. Add `const os = require('os');` near the top (alongside the existing `fs`/`path`/`spawnSync` requires — keep `spawnSync` imported too, it is no longer used by `runAll` but removing the import is not required by any AC). Also add this constant near `GRANDFATHER_LIST` (same section, same style — see `decisions.md`'s 2026-11-01 DESIGN entry for why it exists):

```js
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
```

Then replace the existing `runAll` function and the bottom `module.exports`/entry-point block with:

```js
/**
 * Runs each file in `files` as its own child process, bounded by
 * `options.concurrency` concurrent children at a time (default: number of
 * logical CPUs). Each child's stdout/stderr is buffered and flushed as one
 * contiguous block only when that child exits — never passed through live
 * via `stdio: 'inherit'`, which would interleave at the OS level once two
 * children run concurrently (AC5). A child exceeding `options.timeoutMs`
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
  const { spawn } = require('child_process');

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
      const chunks = [];
      const child = spawn(process.execPath, [file], { cwd: cwd });
      let timedOut = false;
      const timer = setTimeout(function() {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);

      child.stdout.on('data', function(d) { chunks.push(d); });
      child.stderr.on('data', function(d) { chunks.push(d); });

      child.on('close', function(code) {
        clearTimeout(timer);
        if (chunks.length > 0) process.stdout.write(Buffer.concat(chunks));
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

  // SEQUENTIAL_EXCLUSIVE_LIST: files confirmed (2026-11-01) to race on real,
  // shared repo-root state when run concurrently with each other -- see
  // decisions.md's DESIGN entries. Run them in their own concurrency:1
  // phase; everything else runs through the pool.
  const exclusiveSet = new Set(SEQUENTIAL_EXCLUSIVE_LIST);
  const exclusiveFiles = allFiles.filter(function(f) { return exclusiveSet.has(f); });
  const poolFiles = allFiles.filter(function(f) { return !exclusiveSet.has(f); });

  const start = Date.now();

  const exclusiveResult = await runFilesConcurrently(exclusiveFiles, {
    concurrency: 1,
    timeoutMs: 120000,
    cwd: repoRoot
  });

  // Math.max(1, Math.ceil(os.cpus().length / 3)) rather than the raw core
  // count: full-core saturation (and even os.cpus().length - 2) was found
  // (2026-11-01, Task 1 verification) to make check-rb-s3-harness-agnostic-
  // instructions.js's own 2-second wall-clock NFR budget fail consistently
  // under CPU contention -- see decisions.md's DESIGN entries. Verified at
  // concurrency 3 (on the 8-core reference machine): rb-s3 passes, and the
  // pool still completes in ~200s, comfortably clearing the >=40% AC4 target.
  const poolResult = await runFilesConcurrently(poolFiles, {
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
```

This fully replaces the old sequential `runAll` (the `files.forEach(function(f) { ... spawnSync ... })` loop) and the old bottom block. `discoverTestFiles`, `GRANDFATHER_LIST`, and `getAllTestFiles` above this point in the file are untouched.

- [x] **Step 5: Run test — must pass**

```bash
node tests/check-tfhc-s9-run-all-tests-parallelization.js
```

Expected output: `[tfhc-s9-run-all-tests-parallelization] 2 check(s) OK ✓`

- [x] **Step 6: Run full suite — no regressions**

```bash
npm test
```

Expected output: same file count and same 2 pre-existing failures as this story's own `/branch-setup` baseline (`scripts/check-pipeline-state-integrity.js` [C3], `tests/check-pcr-s1-test-runner.js` N1 — both RISK-ACCEPTed in `decisions.md`, unrelated to this story) — no new or different failure, and the new test file itself passes.

- [x] **Step 7: Commit**

```bash
git add scripts/run-all-tests.js tests/fixtures/tfhc-s9-pass-fast.js tests/fixtures/tfhc-s9-fail-fast.js tests/check-tfhc-s9-run-all-tests-parallelization.js
git commit -m "feat: add bounded-concurrency runFilesConcurrently to run-all-tests.js"
```

---

## Task 2: AC2 (concurrency bound) + AC3 (real wall-clock)

**Status: COMPLETE** — spec compliance ✅, code quality ✅ (approved first pass, no findings). Mutation-test performed and verified (AC2's guard confirmed load-bearing: peak jumped to 6 when disabled, restored and re-confirmed passing). Ending SHA: `6ca96dedd55f78269ec61a651c8e396c88e9b730`. Full-suite run showed the 2 expected pre-existing failures plus one already-accepted residual flake (`check-cat-s1-core-trace-builder.js`, confirmed passing standalone) — per the standing RISK-ACCEPT in `decisions.md`.

**Files:**
- Create: `tests/fixtures/tfhc-s9-sleep-marker.js`
- Modify: `tests/check-tfhc-s9-run-all-tests-parallelization.js`

- [x] **Step 1: Write the failing tests**

Insert these two blocks into `tests/check-tfhc-s9-run-all-tests-parallelization.js`'s `main()`, immediately after the two AC1 blocks from Task 1 (before the `// ── Report ──` section):

```js
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
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-tfhc-s9-run-all-tests-parallelization.js
```

Expected output: a crash/`ENOENT` reading `tests/fixtures/tfhc-s9-sleep-marker.js` (the fixture doesn't exist yet) — the new AC2/AC3 blocks fail before reaching their assertions.

- [x] **Step 3: Create the sleep-marker fixture**

`tests/fixtures/tfhc-s9-sleep-marker.js`:
```js
#!/usr/bin/env node
'use strict';
const fs = require('fs');
const logPath = process.env.TFHC_S9_LOG_PATH;
const sleepMs = parseInt(process.env.TFHC_S9_SLEEP_MS || '100', 10);
if (!logPath) {
  console.error('[tfhc-s9-sleep-marker] TFHC_S9_LOG_PATH not set');
  process.exit(1);
}
fs.appendFileSync(logPath, 'START ' + process.pid + ' ' + Date.now() + '\n');
setTimeout(function() {
  fs.appendFileSync(logPath, 'END ' + process.pid + ' ' + Date.now() + '\n');
  process.exit(0);
}, sleepMs);
```

- [x] **Step 4: Mutation-test the concurrency guard before trusting AC2's test (per `.github/standards/testing/test-design-patterns.md`)**

Temporarily change `runFilesConcurrently`'s `launchNext` loop condition from `active < concurrency` to `true` (effectively unbounded), re-run `node tests/check-tfhc-s9-run-all-tests-parallelization.js`, and confirm `AC2-peak-concurrency-never-exceeds-limit` now **fails** (peak should jump to 6, since nothing bounds it). Then revert the change back to `active < concurrency` and confirm the test passes again. Do not commit the temporarily-broken version — this step is a verification discipline, not a code change.

- [x] **Step 5: Run test — must pass**

```bash
node tests/check-tfhc-s9-run-all-tests-parallelization.js
```

Expected output: `[tfhc-s9-run-all-tests-parallelization] 6 check(s) OK ✓`

- [x] **Step 6: Run full suite — no regressions**

```bash
npm test
```

Expected output: same as Task 1's Step 6 — no new or different failure.

- [x] **Step 7: Commit**

```bash
git add tests/fixtures/tfhc-s9-sleep-marker.js tests/check-tfhc-s9-run-all-tests-parallelization.js
git commit -m "test: cover concurrency bound (AC2) and real wall-clock reporting (AC3)"
```

---

## Task 3: AC5 (output attribution) + AC6 (hang/timeout) + integration seam test

**Files:**
- Create: `tests/fixtures/tfhc-s9-print-lines.js`
- Create: `tests/fixtures/tfhc-s9-hang.js`
- Modify: `tests/check-tfhc-s9-run-all-tests-parallelization.js`

- [ ] **Step 1: Write the failing tests**

Insert these three blocks into `tests/check-tfhc-s9-run-all-tests-parallelization.js`'s `main()`, immediately after Task 2's AC3 block (before `// ── Report ──`):

```js
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
  {
    const T = 'AC6-hung-file-killed-without-blocking-siblings';
    const files = [fixture('tfhc-s9-hang.js'), fixture('tfhc-s9-pass-fast.js'), fixture('tfhc-s9-pass-fast.js')];
    const { failedFiles, elapsedMs } = await runFilesConcurrently(files, { concurrency: 3, timeoutMs: 300 });
    assert(T, failedFiles.length === 1 && failedFiles[0] === fixture('tfhc-s9-hang.js'),
      `Expected only the hang file to fail, got ${JSON.stringify(failedFiles)}`);
    assert(T + '-elapsed-not-blocked', elapsedMs < 1000,
      `Expected elapsedMs < 1000 (close to the 300ms timeout, not blocked waiting on siblings), got ${elapsedMs}`);
  }

  // ── AC1 (integration): getAllTestFiles -> runFilesConcurrently seam ─────
  {
    const T = 'AC1-integration-seam-getAllTestFiles-to-runFilesConcurrently';
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tfhc-s9-repo-'));
    const testsDir = path.join(tempRoot, 'tests');
    fs.mkdirSync(testsDir);
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
    assert(T + '-exit-code', exitCodeAfter === 1, `Expected exitCode 1 (one fixture fails), got ${exitCodeAfter}`);
    assert(T + '-summary-counts', !!summaryLine && summaryLine.indexOf('3 file(s) run, 1 failed') !== -1,
      `Expected summary to report "3 file(s) run, 1 failed", got: ${summaryLine}`);
    const failedLine = logged.find(function(l) { return l.indexOf('check-tfhc-s9-fixture-b.js') !== -1; });
    assert(T + '-names-failed-file', !!failedLine, `Expected failed-file list to name check-tfhc-s9-fixture-b.js, got lines: ${JSON.stringify(logged)}`);

    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tfhc-s9-run-all-tests-parallelization.js
```

Expected output: `ENOENT` reading `tests/fixtures/tfhc-s9-print-lines.js` / `tests/fixtures/tfhc-s9-hang.js` (neither fixture exists yet).

- [ ] **Step 3: Create the two remaining fixtures**

`tests/fixtures/tfhc-s9-print-lines.js`:
```js
#!/usr/bin/env node
'use strict';
const label = 'P' + process.pid;
const count = parseInt(process.env.TFHC_S9_LINE_COUNT || '5', 10);
const delayMs = parseInt(process.env.TFHC_S9_LINE_DELAY_MS || '15', 10);
let i = 0;
function next() {
  if (i >= count) { process.exit(0); return; }
  process.stdout.write(label + '-line-' + i + '\n');
  i++;
  setTimeout(next, delayMs);
}
next();
```

`tests/fixtures/tfhc-s9-hang.js`:
```js
#!/usr/bin/env node
'use strict';
setInterval(function() {}, 1000);
```

- [ ] **Step 4: Mutation-test the timeout guard before trusting AC6's test (per `.github/standards/testing/test-design-patterns.md`)**

Temporarily remove the `setTimeout(function() { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);` call in `runOne` (or set it to an effectively-infinite delay), re-run `node tests/check-tfhc-s9-run-all-tests-parallelization.js` with a short wait, and confirm `AC6-hung-file-killed-without-blocking-siblings` now **fails** (or the whole test process itself hangs, proving the guard was genuinely load-bearing). Then restore the timeout logic and confirm the test passes again within the expected `< 1000ms`.

- [ ] **Step 5: Run test — must pass**

```bash
node tests/check-tfhc-s9-run-all-tests-parallelization.js
```

Expected output: `[tfhc-s9-run-all-tests-parallelization] 11 check(s) OK ✓`

- [ ] **Step 6: Run full suite — no regressions**

```bash
npm test
```

Expected output: same file count as before this story (+1 for the new `check-tfhc-s9-run-all-tests-parallelization.js` file itself) and only the same 2 pre-existing, RISK-ACCEPTed failures — no new or different failure.

- [ ] **Step 7: Commit**

```bash
git add tests/fixtures/tfhc-s9-print-lines.js tests/fixtures/tfhc-s9-hang.js tests/check-tfhc-s9-run-all-tests-parallelization.js
git commit -m "test: cover output attribution (AC5), hang/timeout (AC6), and the discovery-to-execution integration seam"
```

---

## After all 3 tasks: AC4 (manual, not a task)

AC4 (≥40% full-suite wall-clock reduction) has no task above by design — per `/review` finding 1-M1 and the test plan's own Coverage Gaps table, it is measured manually at `/definition-of-done` via a timed `node scripts/run-all-tests.js` run against the real 816-file suite, not as part of this plan's automated tasks. Do not add a 4th task for it.
