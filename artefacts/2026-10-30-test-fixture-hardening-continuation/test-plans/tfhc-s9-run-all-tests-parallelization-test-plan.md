## Test Plan: Parallelize scripts/run-all-tests.js's sequential child-process execution

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s9-run-all-tests-parallelization.md
**Epic reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/epics/fixture-divergence-closure.md
**Test plan author:** Copilot
**Date:** 2026-10-31

**Test runner confirmed from `package.json`:** `"test": "node scripts/run-all-tests.js"` — plain Node scripts, no Jest/Mocha/other framework. Every test file in this repo is a standalone `node <file>` process using manual assertions and `console.log('✓ ...')`/`process.exitCode`, exactly the same convention this plan follows. All verification commands below use this confirmed runner.

**Test data strategy:** Synthetic — all test fixtures are new, tiny, self-contained Node scripts committed to `tests/fixtures/` (no real data, no PCI/sensitive fields, no external services, no database). Available now, self-contained — no data dependency gap.

**E2E / browser-layout scan (Step 3a):** None of this story's 6 ACs mention drag-drop, pointer/click coordinates, `getBoundingClientRect`, CSS-position, or visual rendering — this is a Node child-process/concurrency change with no UI surface. No layout-dependent AC found; no E2E tooling gap.

---

## Implementation-contract note (read before writing code)

This test plan assumes the following minimal, testable contract — not a mandated internal design, but the shape the tests below are written against. The coding agent may implement the pool mechanism differently as long as this externally-observable contract holds:

- A new function, `runFilesConcurrently(files, options)`, exported from `scripts/run-all-tests.js`, returning a Promise that resolves to `{ failedFiles: string[], elapsedMs: number }`.
  - `options.concurrency` (number, default `os.cpus().length`) — the pool's bounded worker limit.
  - `options.timeoutMs` (number, default `120000`) — per-file kill timeout, overridable by tests so AC6 doesn't require waiting out the real 120-second default.
  - Each file in `files` is spawned as its own child process (same `node <file>` execution model the current `spawnSync` call already uses) — `runFilesConcurrently` must use an **asynchronous** spawn mechanism (e.g. `child_process.spawn`, not `spawnSync`), since `spawnSync` blocks the event loop and cannot run two children at once from a single Node process.
  - Each child's stdout/stderr is **captured** (`stdio: ['ignore', 'pipe', 'pipe']`), buffered per-child, and flushed to the parent's real stdout/stderr as one contiguous block only once that child exits — not passed through live via `stdio: 'inherit'`, which would interleave at the OS level the moment two children run concurrently (this is the mechanism AC5 requires).
  - Children inherit the parent process's environment by default (standard `child_process.spawn` behaviour) — the test fixtures below rely on this to receive test-only configuration via `process.env`, with no new API surface needed for that.
- `runAll(repoRoot)` becomes the thin wrapper: `getAllTestFiles(repoRoot)` → `runFilesConcurrently(files, { concurrency: os.cpus().length, timeoutMs: 120000 })` → print the existing summary line format using the returned `{ failedFiles, elapsedMs }`. Since `runFilesConcurrently` is async, `runAll` becomes async too, and the module's `require.main === module` entry point must handle the returned Promise (e.g. `.catch(...)` or awaiting it) rather than calling `runAll` and immediately falling off the end of the script.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Aggregated failedFiles/exit code identical to sequential expectation | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Peak concurrent child count never exceeds configured limit | 1 test | — | — | — | — | 🟢 |
| AC3 | Reported elapsed time is real wall-clock, not serial sum | 1 test | — | — | — | — | 🟢 |
| AC4 | ≥40% full-suite wall-clock reduction vs. the 816-file/485063ms baseline | — | — | — | 1 scenario | Untestable-by-nature | 🔴 |
| AC5 | Per-file output attributable as a contiguous block, not interleaved | 1 test | — | — | — | — | 🟢 |
| AC6 | Hung file killed at timeout; doesn't block/delay sibling files | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in CI | Handling |
|-----|----|----------|--------------------------|---------|
| AC4's ≥40% wall-clock reduction, measured against the real 816-file suite | AC4 | Untestable-by-nature | A single-run wall-clock percentage on the full real suite is inherently sensitive to concurrent machine/CI load — this repo already has a confirmed precedent of exactly this flakiness shape (`tests/check-pcr-s1-test-runner.js`, logged in `workspace/capture-log.md`). This is not a test-design gap — the underlying quantity (real wall-clock time on a shared, variable-load machine) is not deterministic at the precision a hard CI assertion requires. | RISK-ACCEPTed at `/review` (finding 1-M1, `decisions.md`). Measured manually as a timed run at `/definition-of-done`, exactly as `benefit-metric.md`'s own m10 "Measurement method" field already specifies. AC3's unit test (below) gives automated, CI-safe evidence that the *mechanism* genuinely overlaps execution (small, fixed-duration fixtures, generous tolerance) — it is the proxy-level automated signal that concurrency is real; AC4's absolute percentage on the full suite is the DoD-measured magnitude number. See AC verification script Scenario 4 (🔴) for the manual procedure. |

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — all fixtures are new files committed as part of this story's own implementation

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A small fixed set of pass/fail fixture scripts | Synthetic — `tests/fixtures/tfhc-s9-pass-fast.js`, `tfhc-s9-fail-fast.js` | None | Deterministic exit codes (0 / 1), no timing dependency |
| AC2 | Fixture scripts that record start/end timestamps to a shared log file | Synthetic — `tests/fixtures/tfhc-s9-sleep-marker.js` | None | Log path supplied via `process.env.TFHC_S9_LOG_PATH`, inherited by children |
| AC3 | Same sleep-marker fixture, 2 instances | Synthetic — same as AC2 | None | Short, fixed sleep duration (~250ms) keeps the test fast and non-flaky |
| AC5 | Fixture scripts that print labelled, delayed lines | Synthetic — `tests/fixtures/tfhc-s9-print-lines.js` | None | Label and line count supplied via env vars |
| AC6 | A fixture that never exits on its own | Synthetic — `tests/fixtures/tfhc-s9-hang.js` | None | Killed via the runner's own timeout mechanism, never via a real infinite loop left running after the test |

### PCI / sensitivity constraints

None — no production data, no PII, no regulated fields anywhere in this story's scope.

### Gaps

None — all test data is generated synthetically and committed with the story.

---

## Unit Tests

### Parallel runner produces identical pass/fail aggregation to the known-correct expectation for a mixed fixture set

- **Verifies:** AC1
- **Precondition:** 3-file list: `[tfhc-s9-pass-fast.js, tfhc-s9-fail-fast.js, tfhc-s9-pass-fast.js]` (same pass fixture listed twice is fine — this is testing aggregation logic, not file identity).
- **Action:** `await runFilesConcurrently(files, { concurrency: 3 })`.
- **Expected result:** `failedFiles` has exactly 1 entry, matching the relative path of `tfhc-s9-fail-fast.js`; no other file appears in `failedFiles`.
- **Edge case:** No.

### No failure is silently dropped when every file in the batch fails

- **Verifies:** AC1
- **Precondition:** 3-file list, all three `tfhc-s9-fail-fast.js`.
- **Action:** `await runFilesConcurrently(files, { concurrency: 2 })` (concurrency lower than file count, forcing at least one file to wait for a free slot).
- **Expected result:** `failedFiles.length === 3` — every failing file is reported, none hidden by being queued behind another failure.
- **Edge case:** Yes — tests that queueing (concurrency < file count) doesn't drop a result.

### Peak concurrent child-process count never exceeds the configured limit

- **Verifies:** AC2
- **Precondition:** 6 instances of `tfhc-s9-sleep-marker.js` (same file path repeated 6 times), each sleeping ~150ms; `process.env.TFHC_S9_LOG_PATH` set to a fresh temp file before the test runs; `process.env.TFHC_S9_SLEEP_MS = '150'`.
- **Action:** `await runFilesConcurrently(files, { concurrency: 2 })`. After completion, read the log file, pair each child's `START <pid> <ts>` / `END <pid> <ts>` lines, and compute the maximum number of overlapping `[START, END]` intervals at any instant.
- **Expected result:** Maximum overlap count `<= 2` (the configured concurrency). All 6 START/END pairs are present in the log (no child silently never ran).
- **Edge case:** No.

### Reported elapsed time reflects real concurrent wall-clock time, not the serial sum of each child's duration

- **Verifies:** AC3
- **Precondition:** 2 instances of `tfhc-s9-sleep-marker.js`, each sleeping ~250ms (`TFHC_S9_SLEEP_MS = '250'`).
- **Action:** `await runFilesConcurrently(files, { concurrency: 2 })`.
- **Expected result:** Returned `elapsedMs < 500` (safely below the ~500ms floor that two *sequential* 250ms runs would require, with generous headroom for process-spawn overhead) and `elapsedMs >= 200` (sanity floor — didn't somehow return near-zero). This proves true overlap without a tight, flake-prone band.
- **Edge case:** No.

### Each concurrently-running file's console output remains a contiguous, unbroken block

- **Verifies:** AC5
- **Precondition:** 2 instances of `tfhc-s9-print-lines.js`: one with `TFHC_S9_LABEL=A`, one with `TFHC_S9_LABEL=B`, both `TFHC_S9_LINE_COUNT=5`, `TFHC_S9_LINE_DELAY_MS=15`. Test monkey-patches `process.stdout.write` to push every chunk into an in-memory array instead of the real terminal, restoring the original function in a `finally` block.
- **Action:** `await runFilesConcurrently(files, { concurrency: 2 })` while the stdout spy is active.
- **Expected result:** In the captured chunk array, once a chunk containing `A-line-` appears, every subsequent chunk belonging to file A's block appears before any `B-line-` chunk interrupts it, and vice versa — i.e. grouping the captured chunks by their originating label and checking each label's chunks form one contiguous run, not two separated runs with the other label's chunks in between.
- **Edge case:** Yes — this is specifically testing the interleaving failure mode, not the happy path of "output eventually appears."

### A file that hangs past its timeout is killed and marked failed without blocking its concurrently-running siblings

- **Verifies:** AC6
- **Precondition:** 3-file list: `[tfhc-s9-hang.js, tfhc-s9-pass-fast.js, tfhc-s9-pass-fast.js]`.
- **Action:** `await runFilesConcurrently(files, { concurrency: 3, timeoutMs: 300 })` (short test-only timeout — AC6 does not require waiting out the real 120000ms production default).
- **Expected result:** `failedFiles` contains exactly the hang file's path (the 2 pass-fast files are NOT in `failedFiles`); `elapsedMs` is close to the 300ms timeout (e.g. `< 1000ms`), not several seconds — proving the 2 fast siblings weren't held up waiting for the hang file, and the hang file itself didn't block the runner from returning promptly once its own timeout fired.
- **Edge case:** Yes — this is the story's one explicit edge-case AC (AC6 in the story itself).

---

## Integration Tests

### getAllTestFiles → runFilesConcurrently seam produces a correct end-to-end result against a small controlled fixture repo

- **Verifies:** AC1 (integration layer)
- **Components involved:** `getAllTestFiles(repoRoot)` (discovery), `runFilesConcurrently` (execution), `runAll(repoRoot)` (the existing public entry point that wires them together)
- **Precondition:** A temp directory is created with its own `tests/` subfolder containing 3 small fixture files named to match the real `check-*.js` glob (e.g. `check-tfhc-s9-fixture-a.js` → pass, `check-tfhc-s9-fixture-b.js` → fail, `check-tfhc-s9-fixture-c.js` → pass), and an empty `GRANDFATHER_LIST`-equivalent (the real `GRANDFATHER_LIST` constant is untouched by this story — this test only exercises the dynamic-discovery half of `getAllTestFiles`, not the fixed grandfather list).
- **Action:** `await runAll(tempRepoRoot)`.
- **Expected result:** `process.exitCode === 1` (one of the three fixture files fails); the printed summary line reports `3 file(s) run, 1 failed`, and the failed file list names exactly `check-tfhc-s9-fixture-b.js`. This exercises the real seam between discovery and the new concurrent execution path without depending on the real repo's full 816-file set (which would make this specific test take ~8 minutes on every `npm test` run).

---

## NFR Tests

### Performance — ≥40% full-suite wall-clock reduction

- **NFR addressed:** Performance
- **Measurement method:** Manual timed run of `node scripts/run-all-tests.js` against the real repo at `/definition-of-done` — **not** a CI-gating unit test. See Coverage gaps above and `decisions.md`'s RISK-ACCEPT entry for AC4 (finding 1-M1) for why this is deliberately not automated as a hard single-run CI assertion.
- **Pass threshold:** `elapsedMs <= 291000` (≤40% of the confirmed 816-file/485063ms sequential baseline), compared against an identical `failedFiles` list/exit code to the pre-parallelization sequential baseline (no new or masked failures).
- **Tool:** Manual — `node scripts/run-all-tests.js` run directly, timed with the shell's own timing (e.g. PowerShell `Measure-Command` or bash `time`), at `/definition-of-done`. The AC3 unit test above is the automated, CI-safe proxy that the underlying concurrency mechanism is real; this NFR test is the real-world magnitude check.

### Security — None identified

No new production code path is introduced (confirmed in the story's own Architecture Constraints and NFR sections); no new subprocess target beyond what already runs sequentially today. No NFR test written — confirmed with story owner (the story itself states "None identified").

### Accessibility — N/A

No UI surface. No NFR test written — confirmed with story owner.

### Audit — N/A

No audit-relevant surface. No NFR test written — confirmed with story owner.

---

## Out of Scope for This Test Plan

- Running the real, full 816-file suite as part of this test plan's own automated unit/integration tests — the full real suite is used only for the manual, DoD-time NFR measurement (AC4), not for CI-gating correctness tests, to keep this story's own test file fast (seconds, not ~8 minutes) and non-flaky.
- Testing any individual `check-*.js` file's own internal assertions — out of scope per the story's own Out of Scope section; if parallel execution surfaces a pre-existing test-isolation bug in a specific real file, that is a separate finding against that file, not something this test plan covers.
- CI workflow YAML behaviour (`.github/workflows/*.yml`) — out of scope per the story's own Out of Scope section; this test plan covers `scripts/run-all-tests.js` itself only.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4's exact ≥40% real-world reduction on the full 816-file suite | Full-suite wall-clock timing is sensitive to concurrent machine/CI load — not reliably assertable as a deterministic single-run CI test (confirmed precedent: `pcr-s1`'s own existing flaky timing NFR check) | RISK-ACCEPTed at `/review` (1-M1); measured manually at `/definition-of-done` as a timed real run; AC3's unit test gives automated, non-flaky evidence that the underlying concurrency mechanism itself is genuine at a small, controlled scale |
