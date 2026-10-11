# Review Report: Add a placeholder feature to a journey stage, triggering a new seeded discovery — Run 1

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s1.md
**Date:** 2026-10-11
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category C (AC quality) — AC5 ("visually and functionally distinct from a mapped real feature — not confusable with the existing 'feature not found' warning state") is subjective and not independently testable as written. "Not confusable" has no objective pass/fail signal a test runner or reviewer can check without their own judgment call.
  Risk if proceeding: `/test-plan` will need to invent its own concrete criterion (e.g. a specific CSS class, icon, or ARIA label) to make this testable — if that invention happens without re-confirming against this AC's own intent, the test could pass while the actual UX remains confusing.
  To acknowledge: run /decisions, category RISK-ACCEPT — or revise AC5 now to name a concrete, checkable distinguishing signal (e.g. "renders with a distinct `sw-mapping--placeholder` class and a visible 'Placeholder' label, never sharing markup with the existing feature-not-found warning row").

- **[1-M2]** Category D (Completeness) / data model — The `feature_slug` column is reused to hold a human-readable placeholder *name* (not a real feature slug) until `jcx-s2`'s own conversion step runs. The column's own name (`feature_slug`) implies it always holds a real slug, which it does not for placeholder rows between creation and conversion. This is not flagged anywhere in the story's own Architecture Constraints or NFRs.
  Risk if proceeding: a future engineer reading the schema or writing a query against `feature_customer_journey_stage_mappings` could reasonably assume `feature_slug` is always a valid, resolvable slug — causing a real bug (e.g. a query joining against `pipeline-state.json` features by `feature_slug` that silently fails or mismatches for placeholder rows) that `mapping_state = 'placeholder'` alone doesn't make obvious without also checking that field first.
  To acknowledge: run /decisions, category RISK-ACCEPT — or add an explicit note to the story's Architecture Constraints documenting this dual-use, and ensure `jcx-s2`'s own implementation never queries `feature_slug` against `pipeline-state.json` without first checking `mapping_state`.

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 2 MEDIUM, 0 LOW.
**Outcome:** PASS
