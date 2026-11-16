# bfl-s2 Definition of Done

Date: 2026-11-16. Story: the last three CI test failures fixed honestly: a documented known-failure carve-out in the pipeline-state integrity check (no inflated count) and a platform-independent source-path guard, leaving the known-failures baseline empty. PR #1130, merged to master as `01523f3e2` (2026-11-16). Evidence: `reference/bfl-s2-verify-completion-evidence.md`, plus the CI observation below.

## Result: COMPLETE

All 6 acceptance criteria (AC) met. The change affects CI tooling only; nothing runs in production, so there is no production observation.

## AC6 observation (CI, Linux)

The PR's own "PR Checks" run (run 43828020984, on Linux) printed `[ci-test-regression-check] 0 file(s) currently failing, 0 in known baseline (recorded 2026-11-16)` and `no new regressions`, with no stale-baseline line; all 9 checks passed. This is the end-to-end proof for the Linux-only failure, because Docker was not running locally. On master after the merge: baseline `files` is `[]` and `check-pipeline-state-integrity` reports "817 stories checked, 0 fail".

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | T1 to T4: documented known failure accepted; refused without a written reason, on a shortfall, and on an over-count | automated | none |
| AC2 | ✅ | T5: `tfhc-s1` keeps the honest `passing` 4 with `knownFailing` 1 and a reason naming `decisions.md`; the real integrity check exits 0 | automated | none |
| AC3 | ✅ | T6, T7: six adversarial vectors rejected and valid paths accepted under `path.posix` and `path.win32` | automated | none |
| AC4 | ✅ | T8: same answers from another working directory; the six vectors return the redacted traversal object | automated | none |
| AC5 | ✅ | T9 and the updated bfl-s1, ci-test-regression-check, tst-s1 and gpa tests: baseline empty, clean run exits 0, any failing file exits 1 | automated | none |
| AC6 | ✅ | PR Checks run 43828020984 on Linux: "0 file(s) currently failing, 0 in known baseline", "no new regressions" | CI-observed | none |

## Observations and follow-ups

- `tfhc-s1`'s underlying product bug remains: regressing a journey back lands on a `discovery` session instead of `definition` (`handlePostJourneyRegress` / `handleGetJourneyResume` in `src/web-ui/routes/journey.js`), and its spec `tests/e2e/ep3-s1-regression.spec.js` is not run in CI. Candidate follow-up story `rgs-s1`; not written.
- Three process slips were caught and corrected during the build: a DoR gate failure advanced past once (re-run and passed), test assertions that matched the integrity script's own self-test lines (tightened before implementing), and a guard rule that rejected legitimate absolute in-repo paths (caught by `gpa-sc07`, refined).
- The four local-only failures (no working bash on this Windows machine) are unchanged and pass in CI.
