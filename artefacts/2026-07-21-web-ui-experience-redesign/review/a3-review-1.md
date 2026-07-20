# Review Report: Compute health per-feature, distinct from test coverage — Run 1

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a3-per-feature-health-signal.md`
**Date:** 2026-07-21
**Categories run:** A, B, C, D, E
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** Category D (Completeness) / Category E (Architecture compliance) — The Architecture Constraints field contains malformed, garbled prose: *"This story extends `computeHealthCounts`... Before writing implementation code, the actual current per-... wait: **investigate first** —"*. This reads as an unedited self-correction artifact, not a coherent constraint statement. A field with broken prose does not satisfy "populated with real content."
  Fix: Rewrite the Architecture Constraints bullet as a clean, single statement of the required investigation, removing the mid-sentence self-correction.

- **[1-H2]** Category C (AC quality) — AC2 is not independently testable as written: *"the health value is NOT automatically derived from the (non-existent) coverage percentage — it reflects whatever the real health signal source is, confirmed during this story's technical investigation."* The AC's own pass/fail condition depends on an investigation outcome that doesn't exist yet at story-authoring time — a test runner cannot evaluate "whatever the real signal source is" against anything concrete.
  Fix: AC2 should assert the one thing that IS knowable now (health is not silently equal to a coverage-percentage-derived value) as a negative/exclusion assertion, and defer the positive assertion (what health *should* equal) to a follow-up AC written once the investigation in the Architecture Constraints is actually done — or explicitly frame AC2 as provisional pending that investigation.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None beyond the HIGH findings above.

---

## LOW findings — note for retrospective

None.

---

## Summary

2 HIGH, 0 MEDIUM, 0 LOW.
**Outcome:** FAIL — 2 HIGH findings must be resolved before /test-plan.

## Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 2 | FAIL |
| Completeness | 2 | FAIL |
| Architecture compliance | 3 | PASS |
