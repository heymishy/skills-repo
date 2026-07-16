# Definition of Done: Triage the pre-existing baseline test failures

**PR:** https://github.com/heymishy/skills-repo/pull/484 | **Merged:** 2026-07-16
**Story:** artefacts/2026-07-16-baseline-test-triage/stories/tst-s1-triage-pre-existing-baseline-failures.md
**Test plan:** artefacts/2026-07-16-baseline-test-triage/test-plans/tst-s1-triage-pre-existing-baseline-failures-test-plan.md
**DoR artefact:** artefacts/2026-07-16-baseline-test-triage/dor/tst-s1-dor.md
**Assessed by:** Claude (agent) — retroactive DoD, 2026-07-16, per operator decision to require DoD for all short-track stories going forward
**Date:** 2026-07-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Every one of the 69 currently-failing files categorized (a/Fixed, b/Deferred, c/Investigated-and-classified) | ✅ | `artefacts/2026-07-16-baseline-test-triage/triage-report.md` lists all 69, none as a filename-only guess — every file run standalone and its actual output read first. | Direct review of triage-report.md against the story's own 69-file list | None |
| AC2 — Category (a) Fixed files pass standalone + zero new regressions | ✅ | 2 files fixed (`check-bee1-landing-page.js`, `check-ilc1-capture-schema.js`) — stale NFR assertions invalidated by later, already-decided dependency additions. Both confirmed passing standalone and not reappearing in a fresh full-suite run. | Automated test (U4) + full suite re-run | None |
| AC3 — `check-md-3-adr.js` specifically investigated and classified | ✅ | Classified as a pre-existing gap, not a new regression — its T4 logic was genuinely corrected, but `run-all-tests.js`'s own 120s per-file timeout always kills its nested `npm test` check regardless of the logic fix's correctness. Kept in the baseline with the logic fix retained. | Direct investigation, documented in decisions.md and triage-report.md | An earlier draft mis-classified this file as Fixed; caught and corrected via a subsequent full-suite verification before reporting done, not after. |
| AC4 — `known-baseline-failures.json` refreshed to accurately reflect current state | ✅ | Refreshed from 73 to 67 entries at merge time (2 fixed removed; 5 files independently found now-passing removed, then correctly restored after real CI — not local-only — showed them still genuinely failing). | Direct diff + real CI confirmation on the PR itself | A local-vs-CI discrepancy was found and corrected mid-PR: CI, not a local machine, is the authoritative environment for this repo's regression gate. |
| AC5 — `ci-test-regression-check.js` reports zero unaccounted regressions post-refresh | ✅ | Confirmed on the actual merged PR's final CI run — all 5 checks green, including "Lint, typecheck, test, build" (the job running the regression gate). | Real CI run on PR #484 | None |

## Scope Deviations

None from the story's own defined scope. A genuine gap in `bin/skills gate-advance` was found during implementation (doesn't support the `branch-complete` gate name, only `definition-of-ready`) — worked around using plain `advance` and logged as a GAP entry in decisions.md rather than silently patched.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 (`check-tst-s1-baseline-triage.js`, U1-U8 + a follow-up U6/U8 correction after `cfg-s1`'s fix — final count 19/19 assertions passing)
**Tests passing:** 9 / 9 (test-block level); 19/19 (individual assertion level, after the `cfg-s1` follow-up correction)

**Test gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Operational efficiency / signal quality | ✅ | Baseline failure count reduced from 73 to (eventually, post-`cfg-s1`) 67, with the remaining 67 fully documented by root cause rather than left as undifferentiated red noise. |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None
Test gaps: None

**Retroactive DoD note:** This DoD was written 2026-07-16 alongside the merge of a follow-up story (`cfg-s1`) that further refined 3 of the 5 locally-passing-but-CI-failing files this story had found and correctly restored to the baseline. `tst-s1`'s own meta-test and triage-report.md were updated as a direct, necessary consequence of `cfg-s1`'s fix — both are now internally consistent with the current, more accurate state.
