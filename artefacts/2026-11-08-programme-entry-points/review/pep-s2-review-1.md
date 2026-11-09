# Review Report: Patch /programme and /workflow for the gaps story 1 found — Run 1

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s2-patch-programme-and-workflow.md
**Date:** 2026-11-09
**Categories run:** A, B, C, D, E, F, G, H
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** AC quality (Category C) — AC1 introduces "epic count within a single feature meeting or exceeding a defined threshold" without stating the threshold's actual value. AC2 and AC3 both depend on that same undefined value ("the gate's verdict changes from fail to pass via the new signal," "the gate still correctly recommends the standard pipeline") — none of the three can be independently tested as written, because there is no number to test against. This is not a legitimate "determine empirically during implementation" case (contrast with itar-s2's Jaccard threshold, which genuinely lacks comparable historical data): this story's own epic and discovery already have the two real data points needed to pin a number now — `skills-platform-phase4` (5 epics) and a normal multi-story feature from `pipeline-state.json` with few epics (the discovery cites `team-identity-roles`, 1 epic). A threshold anywhere in `[2, 5)` — e.g. "≥4 epics" — would satisfy both AC2 (phase4 passes) and AC3 (team-identity-roles still fails) and should be stated explicitly in the AC text, not deferred to the implementation plan to invent ad-hoc.
  Fix: Replace "a defined threshold" in AC1 with a concrete number (e.g. "≥4 epics within a single feature"), chosen so phase4 (5) passes and `team-identity-roles` (1) still fails, consistent with AC2/AC3's own stated outcomes. This is the same root-cause defect also found in `pep-s3-review-1.md` (1-H1) — fixing both stories' threshold value together, from the same chosen number, avoids the two stories silently disagreeing on what "enough epics" means.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

None.

---

## Score summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 2 | FAIL |
| Completeness | 4 | PASS |
| Architecture compliance (E) | 5 | PASS |
| Journey.js fixture hygiene (F) | N/A | — |
| skills.js fixture hygiene (G) | N/A | — |
| journeys.js fixture hygiene (H) | N/A | — |

**Justifications:**
- Traceability: references resolve correctly; benefit linkage is accurate and well-grounded in the discovery-time correction.
- Scope integrity: correctly bounds AC6 to findings traceable to pep-s1 or the already-logged discovery corrections — good discipline against freelance "improvements."
- AC quality: 2 — AC1-AC3 are not independently testable as written (see 1-H1). AC4 and AC5 (the `/workflow` de-duplication and `/orient` cross-reference) are each independently clear and testable on their own — the defect is isolated to the epic-count signal's missing value, not the whole story.
- Completeness: 4 — a fully correct document otherwise; the one point off reflects that AC1's vagueness also makes the story's own stated scope ("Stable" scope stability is declared, but AC1's open value is itself a form of residual instability the Scope Stability field doesn't surface) slightly understated, not a separate missing field.
- Architecture compliance: MC-CONSIST-02 and the governed-PR requirement are both correctly cited and consistent with the real `skills/programme/SKILL.md`/`skills/workflow/SKILL.md` content verified during /definition.

---

## Summary

1 HIGH, 0 MEDIUM, 0 LOW.
**Outcome:** FAIL — AC quality scored 2, below the pass threshold of 3.
