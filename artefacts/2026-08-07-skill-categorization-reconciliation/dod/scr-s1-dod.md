# Definition of Done: Unify skill-categorization into one source of truth and close the --with-outer-loop NFR gap

**PR:** #676 (commit 0518aecf) | **Merged:** 2026-08-07 13:40:15 +1200 (per `git show -s --format="%ci" 0518aecf`)
**Story:** artefacts/2026-08-07-skill-categorization-reconciliation/stories/scr-s1-unify-skill-categorization-and-fix-nfr.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 -- `check-assembly.js` derives `OUTER_LOOP_SKILLS`/`INNER_LOOP_SKILLS` from `SKILL_CATEGORIES` instead of hardcoding a duplicate | Yes | `check-scr-s1-skill-categorization-reconciliation.js` -- test `checkAssembly_derivesListsFromSkillCategories` | Unit (source-level inspection) | None |
| AC2 -- a new `SKILL_CATEGORIES` entry is automatically picked up with zero `check-assembly.js` change | Yes | `check-scr-s1-skill-categorization-reconciliation.js` -- test `newCategoryEntry_automaticallyIncludedNoCodeChange` | Unit (synthetic fixture entry) | None |
| AC3 -- `get_skill_triggers` called once per skill in the enabled branch, reused for both purposes | Yes | `check-scr-s1-skill-categorization-reconciliation.js` -- test `getSkillTriggers_calledOnceReusedForBothPurposes` | Unit (source-level / call-count check) | None |
| AC4 -- `--with-outer-loop` overhead re-measured against the 3s budget, RISK-ACCEPT resolved or re-affirmed | Partially -- re-measurement done, budget still not met | `decisions.md` entry "Inner coding loop (scr-s1) -- AC4 honest result: NFR gap not closed": post-fix isolated measurement of the AC3 fix showed ~155ms average improvement (8 samples), but the full end-to-end `--with-outer-loop` overhead (5 runs: 3680ms, 3775ms, 3858ms, 3867ms, 5766ms, avg ~4189ms) still exceeds the 3-second budget | Manual/timing (wall-clock, same methodology as `rb-s5`) | AC4's literal text is satisfied as written (re-measure, then resolve-or-re-affirm) via honest re-affirmation of the RISK-ACCEPT, not a passing result -- this is a documented, accepted outcome, not a silent gap |

---

## Scope Deviations

None beyond what AC4 itself anticipated. The story's own AC4 text explicitly allows for the RISK-ACCEPT to be "re-affirmed with fresh measurements if it still doesn't pass" rather than requiring a pass -- this is exactly what happened, and it is documented in `decisions.md` with a root-cause correction (the `get_skill_triggers` double-call was real but contributed only a few hundred ms of a multi-second delta; the dominant cost lies elsewhere in `runInit()`'s `--with-outer-loop` path and was explicitly left unprofiled as out of this story's DoR-contracted scope). The three named "Out of Scope" items in the story (Core Platform Layer's own extraction calls, changing which skills are outer/inner-loop, rewriting the bash script) were not touched, consistent with the story text.

## Test Plan Coverage

`check-scr-s1-skill-categorization-reconciliation.js`: 3 passed, 0 failed (freshly re-run 2026-08-17). This covers the three unit tests named in the test plan for AC1-AC3 (`checkAssembly_derivesListsFromSkillCategories`, `newCategoryEntry_automaticallyIncludedNoCodeChange`, `getSkillTriggers_calledOnceReusedForBothPurposes`). AC4's NFR test (`withOuterLoopOverhead_reVerifiedAgainstThreeSecondBudget`) is manual/semi-automated wall-clock timing per the test plan's own classification, not part of this automated file's count -- its result is documented in `decisions.md` rather than as a pass/fail assertion.

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance (`--with-outer-loop` adds no more than 3 seconds) | Fails, RISK-ACCEPT re-affirmed | `decisions.md`: post-fix avg ~4189ms across 5 runs, not meaningfully different from the pre-fix baseline (~4635ms single sample) or `rb-s5`'s original ~3.6-3.7s measurement |
| Security | None new (per story) | N/A |
| Accessibility | Not applicable -- no UI surface (per story) | N/A |
| Audit | None new (per story) | N/A |

## Metric Signal

No benefit-metric artefact is referenced by this story -- it is short-track and explicitly states "Two related operational/maintenance-debt gaps closed together (short-track, no formal benefit-metric artefact)." No metric signal to report.

## Outcome

**COMPLETE WITH DEVIATIONS**
**Follow-up actions:** A future story should profile `runInit()`'s full `--with-outer-loop` path end-to-end (not just the assembly script in isolation) to find the actual dominant cost contributor -- this is already named as the revisit trigger in `decisions.md` and is not a new gap introduced by this assessment.

## DoD Observations

AC1-AC3 (the categorization single-source-of-truth fix) are fully shipped and verified with real test evidence. AC4's NFR re-measurement was performed honestly per the story's own instructions and the RISK-ACCEPT was re-affirmed rather than silently dropped or fabricated as passing -- production longevity of the AC4 gap is not independently confirmed beyond the `decisions.md` entry dated 2026-08-07.
