# Review Report: Initiative allocation matrix and FTE delta view — Run 2

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.6.md
**Date:** 2026-05-26
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture
**Outcome:** PASS

---

## Review Diff — Run 2 vs Run 1

### Resolved since last run
✅ [1-H1] (C) — AC4 required clicking person names that Out of Scope said would not exist in Phase 1. RESOLVED: AC4 removed from Phase 1 scope. AC5 renumbered to AC4. Cross-navigation behaviour added to Out of Scope as a Phase 2 consideration, explicitly linked to the names-inline feature that is also deferred.

### New findings this run
None.

### Carried forward unchanged
None.

### Progress summary
1 HIGH finding from Run 1 resolved. Run 2 is clean.

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

None.

---

## Summary scores

| Category | Score (1–5) | Notes |
|---|---|---|
| A — Traceability | 5 | Epic, discovery, benefit-metric all linked. M2 named. |
| B — Scope | 5 | Out of Scope now correctly excludes cross-navigation (Phase 2), names-inline (Phase 2), editing, sorting. Internally consistent. |
| C — AC quality | 5 | 4 ACs (post-fix): AC1 matrix display, AC2 red delta indicator, AC3 Gap badge, AC4 error state. All Given/When/Then. All internally consistent with Out of Scope. |
| D — Completeness | 5 | All sections present. Named persona. NFRs cover performance, accessibility, security. Complexity rated. |
| E — Architecture | 5 | Static HTML. CSS custom properties for colour indicators. fetch() relative path. No external libs. |

**Outcome:** PASS — 0 HIGH, 0 MEDIUM, 0 LOW. Proceed to /test-plan.
