# Contract Proposal: Parallelize scripts/run-all-tests.js's sequential child-process execution

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s9-run-all-tests-parallelization.md
**Test plan reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s9-run-all-tests-parallelization-test-plan.md
**Date:** 2026-10-31

---

## What will be built

- `scripts/run-all-tests.js`: add a new exported function `runFilesConcurrently(files, options)` that spawns each file as its own child process using an **asynchronous** `child_process.spawn` (not the current `spawnSync`, which blocks the event loop and cannot run two children at once) bounded by a worker pool of size `options.concurrency` (default `os.cpus().length`). Each child's stdout/stderr is piped and buffered per-child, flushed to the real stdout/stderr as one contiguous block only when that child exits — not passed through live via `stdio: 'inherit'`, which interleaves at the OS level once two children run concurrently. Each child is killed if it exceeds `options.timeoutMs` (default `120000`, matching today's behaviour), and a killed/timed-out file is recorded in the returned `failedFiles` list exactly as a normal failing exit code would be. Returns `{ failedFiles, elapsedMs }` where `elapsedMs` is real wall-clock time for the whole batch.
- `runAll(repoRoot)` becomes the thin async wrapper: `getAllTestFiles(repoRoot)` → `runFilesConcurrently(files, { concurrency: os.cpus().length, timeoutMs: 120000 })` → print the existing summary line format. The `require.main === module` entry point is updated to handle the now-async `runAll`'s returned Promise.
- New test file `tests/check-tfhc-s9-run-all-tests-parallelization.js` implementing the 6 unit tests + 1 integration test from the test plan.
- New fixture files under `tests/fixtures/`: `tfhc-s9-pass-fast.js`, `tfhc-s9-fail-fast.js`, `tfhc-s9-sleep-marker.js`, `tfhc-s9-hang.js`, `tfhc-s9-print-lines.js` — all tiny, synthetic, self-contained scripts used only by this story's own tests, not swept into the real suite (`tests/fixtures/` is not matched by the `check-*.js` glob).

## What will NOT be built

- `GRANDFATHER_LIST` and `discoverTestFiles`/`getAllTestFiles`'s own glob-discovery mechanism — untouched. This story only changes how discovered files are *executed*, not which files are discovered.
- A configurable concurrency override (CLI flag or environment variable) for production use — ships with a single fixed default (`os.cpus().length`), per the story's own Out of Scope section.
- Any CI workflow YAML change (`.github/workflows/*.yml`) — CI already calls `node scripts/run-all-tests.js`, so it inherits the speedup automatically with no workflow edit needed.
- Any individual `check-*.js` file's own internal test logic — untouched.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test: mixed pass/fail fixture set, assert `failedFiles` aggregation matches the known-correct expectation; second unit test with an all-failing batch under constrained concurrency confirms no failure is dropped by queueing. Integration test: `runAll()` against a small temp fixture repo exercises the real discovery→execution seam. | unit, integration |
| AC2 | Unit test: 6 sleep-marker fixtures writing start/end timestamps to a shared log file, concurrency=2; parse the log and assert peak interval overlap never exceeds 2. | unit |
| AC3 | Unit test: 2 sleep-marker fixtures (~250ms each), concurrency=2; assert returned `elapsedMs` is well below the ~500ms serial-sum floor. | unit |
| AC4 | Manual: verification script Scenario 4, a timed real run of the full 816-file suite at `/definition-of-done`. Not CI-gated — RISK-ACCEPTed at `/review` (finding 1-M1, `decisions.md`) to avoid reproducing the known `pcr-s1`-shaped single-run timing flake. | manual |
| AC5 | Unit test: monkey-patch `process.stdout.write` during a concurrent run of two print-lines fixtures; assert each file's captured output chunks form one contiguous run, never interrupted by the other file's chunks. | unit |
| AC6 | Unit test: a hang fixture + 2 pass-fast fixtures, concurrency=3, short test-only `timeoutMs` override; assert the hang file is killed/failed, the 2 siblings are not marked failed, and total elapsed time stays close to the short timeout rather than blocking indefinitely. | unit |

## Assumptions

- Children spawned via `child_process.spawn` inherit the parent process's environment by default — the test fixtures rely on this (reading `TFHC_S9_LOG_PATH`, `TFHC_S9_SLEEP_MS`, `TFHC_S9_LABEL`, etc. from `process.env`) rather than requiring a new env-passthrough option on `runFilesConcurrently` itself.
- The existing 120000ms per-file timeout behaviour (today implicit via `spawnSync`'s own `timeout` option) must be reimplemented explicitly for the async path (e.g. `setTimeout(() => child.kill(), timeoutMs)`), since `spawn`'s own built-in timeout handling is not assumed to be used verbatim.
- The real 816-file discoverable set is unaffected by this story — AC1/AC2/AC3/AC5/AC6 are all verified against small, fast, synthetic fixture sets specifically so this story's own new test file runs in seconds, not the ~8 minutes the real full suite takes.
- Per the Testing domain standard (`.github/standards/testing/test-design-patterns.md`), the concurrency-limit test (AC2) and the hang/timeout test (AC6) must each be mutation-tested before being trusted — temporarily break the concurrency limiter (e.g. hardcode no bound) or the timeout-kill logic and confirm the corresponding new test then fails for the expected reason, before committing it as evidence.

## Estimated touch points

**Files:** `scripts/run-all-tests.js`, `tests/check-tfhc-s9-run-all-tests-parallelization.js` (new), `tests/fixtures/tfhc-s9-pass-fast.js` (new), `tests/fixtures/tfhc-s9-fail-fast.js` (new), `tests/fixtures/tfhc-s9-sleep-marker.js` (new), `tests/fixtures/tfhc-s9-hang.js` (new), `tests/fixtures/tfhc-s9-print-lines.js` (new)
**Services:** None
**APIs:** None

**schemaDepends:** [`dodStatus`] — this story's Dependencies block names `tfhc-s8` as upstream (must be DoD-complete before this story's precondition is considered closed); the dependency is tracked via `tfhc-s8`'s own `dodStatus` field in `pipeline-state.json`, confirmed present in `.github/pipeline-state.schema.json` and confirmed `"complete"` on `tfhc-s8`'s current entry.
