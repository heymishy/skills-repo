# Definition of Done: Add a regression test for /definition story-extraction and investigate the unexplained gate-confirm 400 (csgc-s1)

**PR:** https://github.com/heymishy/skills-repo/pull/863 | **Merged:** 2026-09-11 (merge commit `42a6959a7cd3a0d15081b0a2d4c96d133a5b9ed9`)
**Story:** artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/stories/csgc-s1-story-extraction-regression-test-and-gate-confirm-investigation.md
**Test plan:** artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/test-plans/csgc-s1-test-plan.md
**DoR:** artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/dor/csgc-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `extractStoryIdsFromDefinitionArtefact` against the real `definition.success.json` fixture returns `["mock-fixture.1"]`, re-run fresh on merged master | Automated test, re-run post-merge | None |
| AC2 | ✅ | `handlePostGateConfirm` redirects straight to review and sets the full real-fixture-extracted story list, re-run fresh on merged master | Automated test, re-run post-merge | None |
| AC3 | ✅ (outcome b) | T3a/T3b re-run fresh on merged master, same result as pre-merge: the real streaming path never 400s when correctly sequenced; only an out-of-sequence call does. Root cause confirmed as a debug-script artifact, not a production bug | Automated test, re-run post-merge | None |

**Full re-run on merged master:** `tests/check-csgc-s1-story-extraction-and-gate-confirm.js` — 7/7 passing.

---

## Scope Deviations

None. Confirmed via `gh pr view 863 --json files`: the merged diff is exactly the one new test file, `tests/check-csgc-s1-story-extraction-and-gate-confirm.js` (plus artefacts/pipeline-state.json bookkeeping) — no production code under `src/` touched, matching AC3's own "investigation only, fix code only if a real bug is found" framing (none was).

---

## Test Plan Coverage

**Tests from plan implemented:** 4/4 (AC1, AC2, AC3/T3a, AC3/T3b)
**Tests passing on merged master:** 7/7 (individual assertions within the 4 test cases)

**Gaps:** None.

---

## NFR Status

Not applicable — story states none identified across all 4 categories.

---

## Metric Signal

No formal benefit-metric artefact exists for this story — short-track gap-closure, per the story's own Benefit Linkage section. The stated benefit (closing `r-canvas-render-and-story-extraction-fix`'s own self-documented `NEEDS-TESTS` gap) is directly confirmed by the AC evidence above.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

**Follow-up actions:** None required for this story's own scope. The genuinely valuable, unplanned side-finding — a definitive, empirically-confirmed root cause for a 3-week-old unconfirmed production observation — is now recorded permanently in `icrh-s1`/`icv-s1`'s own decisions.md entries (2026-09-11) and this story's own test file, closing an uncertainty that had sat unresolved since 2026-07-26.

---

## DoD Observations

1. This story is the clearest example in this session's whole DoD-triage sweep of live investigation producing more value than the story itself asked for: AC3 only required the 400 be "confirmed as a real bug, root-caused, and fixed" OR "confirmed as an artifact... does not occur in the real production request path" — either outcome was acceptable. The investigation didn't just pick an outcome; it built a genuine, reusable regression test (`T3b`) that actively guards against ever losing this specific race-safety property in the future, going beyond what "confirm and record" alone would have required.
2. Same `pipeline-state.json` `stage`/`prStatus` silent-revert issue found and corrected as `vcb-s1`'s own DoD Observation #1 documents — see that entry for the full explanation. Corrected here identically.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Add a regression test for /definition story-extraction and investigate the unexplained gate-confirm 400" (csgc-s1).
Check:
1. Does the AC3 evidence genuinely distinguish "code-path confirmed" from "assumed," given this closes a real production uncertainty?
2. Is the pipeline-state.json stage/prStatus revert correctly explained and corrected?
3. Is the outcome verdict (COMPLETE) consistent with the AC and deviation rows?
```
