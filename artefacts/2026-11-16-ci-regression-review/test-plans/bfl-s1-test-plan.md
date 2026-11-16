## Test Plan: Shrink the CI known-failures baseline from 70 files to the 3 that actually fail, and stop it going stale

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/bfl-s1-clear-baseline-test-failures.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-bfl-s1-baseline-tightened.js`. It reads `tests/known-baseline-failures.json` and runs `scripts/ci-test-regression-check.js` as a child process against small synthetic log files in a temp directory (the same shape `run-all-tests.js` prints: a `Failed files (N):` block of `  - path` lines). Existing `tests/check-ci-test-regression-check.js` and `tests/check-tst-s1-baseline-triage.js` are inspected and edited only where they encode the old behaviour.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Baseline lists exactly the 3 CI-failing files; note names bfl-s1 and bfl-s2 | - | 1 (T1) | - | - | - | 🟢 |
| AC2 | A previously tolerated file failing is a NEW regression, exit 1 | - | 1 (T2) | - | - | - | 🟢 |
| AC3 | A baseline file that does not fail is a stale entry, exit 1 | - | 1 (T3) | - | - | - | 🟢 |
| AC4 | Failures equal to the baseline: exit 0 | - | 1 (T4) | - | - | - | 🟢 |
| AC5 | Existing checker tests pass with only listed edits | - | 1 (T5 runs both) | - | - | - | 🟢 |
| AC6 | Live: next PR run shows "3 file(s) currently failing, 3 in known baseline" | - | - | - | 1 | Live-only | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs a real CI run | AC6 | Live-only | Verification scenario 6 |

## Tests (new file `tests/check-bfl-s1-baseline-tightened.js`)

- **T1 (AC1).** `files` equals exactly `['scripts/check-pipeline-state-integrity.js', 'tests/check-gpa-sc06-source-path-guard.js', 'tests/run-gpa-tests.js']`; `recordedAt` is a date on or after 2026-11-16; `note` contains `bfl-s1` and `bfl-s2`. Fails today (70 entries).
- **T2 (AC2).** Synthetic log: the three baseline files plus `tests/check-artefact-coverage.js` (one of the formerly tolerated 67) fail: exit 1 and stderr names `tests/check-artefact-coverage.js` as a NEW regression. Fails today (it is excused).
- **T3 (AC3).** Synthetic log with only two of the three baseline files failing: exit 1, output contains `stale baseline entry: ` and the third file's path. Fails today (exit 0).
- **T4 (AC4).** Synthetic log with exactly the three: exit 0 and the "no new regressions" line. Passes today only if the baseline is the three, so it fails until T1 does.
- **T5 (AC5).** `tests/check-ci-test-regression-check.js` and `tests/check-tst-s1-baseline-triage.js` exit 0 when run as child processes (they are small and not timing-sensitive; if either proves timing-sensitive it is dropped from this test and verified by the full suite instead).

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| The real CI failing set can drift between plan and merge | A new failure could appear | AC6 and the regression check itself report it; the three are re-derived from the latest CI artefact at implementation time |

**Total automated tests:** 5 (T1 to T5) plus AC6 live.
