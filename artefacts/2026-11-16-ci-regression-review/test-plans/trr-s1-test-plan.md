## Test Plan: Record per-test-file results in CI so the next audit can use test history

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/trr-s1-record-per-test-file-results.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-trr-s1-per-file-test-results.js`. It drives `runFilesConcurrently` and `runAll` from `scripts/run-all-tests.js` against small fixture test files written to a temp directory (one passing, one failing with an assertion message, one that times out, one that exits 0 after printing noise), and reads the CI workflow file as text for AC3. Existing `tests/check-tfhc-s9-run-all-tests-parallelization.js` must keep passing unchanged; `tests/check-pcr-s1-test-runner.js` is a known baseline failure and must not get worse.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `test-results.json` lists every file with status and duration; counts equal the summary | - | 1 (T1) | - | - | - | 🟢 |
| AC2 | A failing file's entry has exit code and first failing line, truncated | 1 (T2 extractor) | 1 (T3) | - | - | - | 🟢 |
| AC3 | CI uploads the file as a 90-day artefact | - | 1 (T4 workflow text) | - | - | - | 🟢 |
| AC4 | Unwritable results path: suite outcome unchanged, warning logged | - | 1 (T5) | - | - | - | 🟢 |
| AC5 | Existing runner tests pass unchanged | - | 1 (T6 runs tfhc-s9) | - | - | - | 🟢 |
| AC6 (added) | Live: the next PR run's artefact exists and parses | - | - | - | 1 | Live-only | 🟡 |
| NFR | No secrets or bodies stored; entry text bounded | 1 (T2) | - | - | - | - | 🟢 |

AC6 is added at test-plan time (the story had five ACs): the first real CI run is the only proof the upload step works.

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs a real CI run | AC6 | Live-only | Verification scenario 7; `production-observed` |

## Tests (new file `tests/check-trr-s1-per-file-test-results.js`)

- **T1 (AC1).** Run `runAll` (or its extracted core) over a fixture repo root containing 4 fixture `check-*.js` files with `TEST_RESULTS_PATH` pointing into the temp dir: the JSON file lists 4 entries with `file`, `status` (`pass`, `fail` or `timeout`), `durationMs` (number) and `exitCode`; the pass and fail counts equal the runner's own `failedFiles` count and file count. Fails today (no file written).
- **T2 (AC2, NFR).** The first-failing-line extractor: returns the first line containing `FAIL`, `✗`, `AssertionError` or `Error:`; falls back to the first stderr line, then an empty string; truncates to 300 characters; never throws on empty or non-string input; returns a line containing no more than the line itself (no neighbouring output).
- **T3 (AC2).** A fixture that fails with `AssertionError: expected 1 to equal 2` yields `exitCode` 1 and that line in `firstFailure`; a fixture that exceeds the timeout yields `status: 'timeout'`.
- **T4 (AC3).** `.github/workflows/pr-checks.yml` contains an `actions/upload-artifact` step with `if: always()`, a name containing the run id, the path `test-results.json` and `retention-days: 90`, placed after the "Unit test chain" step. `.gitignore` lists `test-results.json`.
- **T5 (AC4).** With `TEST_RESULTS_PATH` pointing at a path that cannot be written, `runAll` still reports the right failed count and exit code and logs one warning line.
- **T6 (AC5).** The runner's existing contract is unchanged: every export that existed is still exported, the grandfather list still has 16 entries, `failedFiles` and `elapsedMs` keep their meaning, and an empty file list returns empty arrays. The existing `check-tfhc-s9-run-all-tests-parallelization` and `check-pcr-s1-test-runner` files are not nested inside this test (running one test file from another proved intermittently flaky); the full suite runs them as before and AC5 is verified there.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| A real upload cannot run in a unit test | Needs GitHub Actions | AC6 live on the first PR run |

**Total automated tests:** 6 (T1 to T6) plus AC6 live.
