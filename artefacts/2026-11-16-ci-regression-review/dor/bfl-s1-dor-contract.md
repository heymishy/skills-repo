# Contract Proposal - Shrink the CI known-failures baseline from 70 files to the 3 that actually fail, and stop it going stale

**What will be built:**
- `tests/known-baseline-failures.json`: `files` set to the three CI-failing files, `recordedAt` and `note` updated (mentions `bfl-s1`, `bfl-s2`).
- `scripts/ci-test-regression-check.js`: baseline entries not in the current failing set are reported as `stale baseline entry: <file>` and the script exits 1 (new failures keep exiting 1; equal sets exit 0). Message and exit logic only; log parsing and baseline loading unchanged.
- `tests/check-bfl-s1-baseline-tightened.js` (new, T1 to T5).
- Minimal edits to `tests/check-ci-test-regression-check.js` and/or `tests/check-tst-s1-baseline-triage.js` only where they assert the old behaviour (a now-passing baseline file exits 0, or the old list size); each edit listed in the evidence.

**What will NOT be built:**
- No fix for the three failing files (`bfl-s2`); no removal of the baseline mechanism; no change to `run-all-tests.js`, workflows, or any other test; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | integration (reads the data file) |
| AC2 | T2 | integration (child process, synthetic log) |
| AC3 | T3 | integration |
| AC4 | T4 | integration |
| AC5 | T5 | integration (existing tests) |
| AC6 | Scenario 6 | live |

**Assumptions:** the three failing files are those listed in CI artefact `test-results-43811318391`; the checker reads the `Failed files (N):` block and `  - path` lines (read at `scripts/ci-test-regression-check.js` lines 31 to 42); `run-all-tests.js` still prints that block unchanged (trr-s1 added output only to a JSON file).

`schemaDepends: []`. **Estimated touch points:** Files: `tests/known-baseline-failures.json`, `scripts/ci-test-regression-check.js`, `tests/check-bfl-s1-baseline-tightened.js` (new), and up to two existing tests. Services: none. APIs: none.
