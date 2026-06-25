# Definition of Done: Expand DoD entry condition message with actionable guidance

**PR:** https://github.com/heymishy/skills-repo/pull/411 | **Merged:** 2026-06-25
**Story:** artefacts/2026-05-18-skill-robustness-improvements/stories/sri.2.md
**Test plan:** artefacts/2026-05-18-skill-robustness-improvements/test-plans/sri.2-test-plan.md
**DoR artefact:** artefacts/2026-05-18-skill-robustness-improvements/dor/sri.2-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Entry condition message includes how to check PR merge status | ✅ | T1 (`dod-entry-condition-contains-pr-status-check`) passes. `gh pr view <number>` command is present in the entry condition block of `skills/definition-of-done/SKILL.md`. | Automated test (5/5 passing) | None |
| AC2 — Entry condition message includes next steps: mark PR ready → approval → merge → re-run `/definition-of-done` | ✅ | T2 (`dod-entry-condition-contains-next-steps-sequence`) passes. Text reads "mark PR ready for review → obtain approval → merge → re-run `/definition-of-done`". | Automated test | None |
| AC3 — Entry condition message includes gate rationale explaining that DoD validates what has actually shipped | ✅ | T3 (`dod-entry-condition-contains-gate-rationale`) passes. Text reads "DoD validates what has actually shipped, not what is proposed in an open PR." | Automated test | None |
| AC4 — All three elements appear in a single readable message block, not spread across separate prompts | ✅ | T4 (`dod-entry-condition-all-three-elements-present-in-same-section`) passes. All three patterns verified within the same bounded entry-condition section. | Automated test | None |
| AC5 — No part of the guidance appears post-merge; post-merge flow is unchanged | ✅ | T5 (`post-merge-flow-sections-still-intact`) regression guard passes. "AC coverage", "test plan", and "metric" sections all still present in the post-merge flow. | Automated test — regression guard | None |

## Scope Deviations

None. Only the entry condition early-exit block was changed. Gate logic (when the condition fires) and all post-merge steps are unchanged. No API calls, no personalisation, no schema changes.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing:** 5 / 5

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 dod-entry-condition-contains-pr-status-check | ✅ | ✅ | |
| T2 dod-entry-condition-contains-next-steps-sequence | ✅ | ✅ | |
| T3 dod-entry-condition-contains-gate-rationale | ✅ | ✅ | |
| T4 dod-entry-condition-all-three-elements-present-in-same-section | ✅ | ✅ | |
| T5 post-merge-flow-sections-still-intact (regression) | ✅ | ✅ | |

**Test gaps:** 1 — live operator session confirming that a first-time reader takes the correct next action without a follow-up question. Tests verify structural completeness (3/3 elements present in the text); they cannot observe real operator behaviour. External confirmation from OrderHub team (abhijeet-qsofte) is the M2 secondary signal.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — None identified | N/A | Text-only change. |
| Security — None identified | N/A | No data read or written. |
| Audit — None identified | N/A | |

---

## Metric Signal

Is measurement possible yet for M2 (DoD entry condition actionability)? **Yes — structural check can be completed now.**

The M2 measurement method is "structural inspection of the shipped SKILL.md at DoD time (element checklist)". All three elements are present and verified by the test suite.

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| M2 — DoD entry condition actionability (structural completeness: 3 of 3 elements present) | on-track | T1–T4 all pass: (a) `gh pr view` PR status check present ✅, (b) mark-ready → approve → merge → re-run next steps present ✅, (c) gate rationale ("DoD validates what has actually shipped") present ✅. All three elements are in a single block. The minimum structural signal (3/3 elements in shipped text) is met. External confirmation from OrderHub team (operator reads message and takes correct action without follow-up question) is the secondary signal — pending their next DoD run. | 2026-06-25 |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None
Test gaps: 1 (live operator behaviour — accepted by design; structural verification is the primary signal for SKILL.md text changes)
