# Contract Proposal - Record per-test-file results in CI so the next audit can use test history

**What will be built:**
- `scripts/run-all-tests.js`: `runFilesConcurrently` additionally returns `results` (file, status `pass|fail|timeout`, `exitCode`, `durationMs`, `firstFailure`), collected without changing the existing `failedFiles` and `elapsedMs` fields or the existing stdout and stderr flushing; an exported `extractFirstFailure(text)`; `runAll` merges both phases' results and writes `test-results.json` to the path in `TEST_RESULTS_PATH` (default `<repoRoot>/test-results.json`) inside a try/catch that logs one warning on failure and never changes the exit code; the `module.exports` object gains the new function.
- `.github/workflows/pr-checks.yml`: one `actions/upload-artifact` step after "Unit test chain" (`if: always()`, name `test-results-${{ github.run_id }}`, path `test-results.json`, `retention-days: 90`, `if-no-files-found: warn`).
- `.gitignore`: `test-results.json`.
- `tests/check-trr-s1-per-file-test-results.js` (new, T1 to T6).

**What will NOT be built:**
- No change to which files run, concurrency, timeouts, pass/fail semantics, the grandfather and exclusive lists, or `ci-test-regression-check.js`; no aggregation script; no new npm dependency; no change to any other workflow.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | integration (fixture repo root) |
| AC2 | T2, T3 | unit and integration |
| AC3 | T4 | integration (workflow text) |
| AC4 | T5 | integration |
| AC5 | T6 | integration (existing test) |
| AC6 | Scenario 7 | live |

**Assumptions:** the pool's children are spawned in `runOne` where stdout and stderr chunks are already buffered (read at `scripts/run-all-tests.js` lines 184 to 211), so the first failing line can be derived from those buffers; "PR Checks" is the workflow that runs `npm test` (read at `pr-checks.yml` lines 46 to 49); `.gitignore` already ignores the `test-results/` directory (Playwright) but not this file.

`schemaDepends: []`. **Estimated touch points:** Files: `scripts/run-all-tests.js`, `.github/workflows/pr-checks.yml`, `.gitignore`, `tests/check-trr-s1-per-file-test-results.js` (new). Services: none. APIs: none.
