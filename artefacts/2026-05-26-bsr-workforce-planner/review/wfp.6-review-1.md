# Review Report: Initiative allocation matrix and FTE delta view — Run 1

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.6.md
**Date:** 2026-05-26
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** [C — AC quality] — AC4 specifies: "Given I click on a person's name in the 'allocated people' cell of the allocation matrix, then the dashboard switches to the Roster tab and the clicked person's row is visually highlighted." However, the Out of Scope section for the same story explicitly states: "Showing the full list of allocated people names inline in the matrix table — only the count is shown in the default view. An expandable detail panel or tooltip showing names is a Phase 2 consideration." Person names are not rendered in Phase 1, so there is nothing to click — AC4 describes behaviour that directly contradicts the Phase 1 scope boundary. AC4 cannot be implemented without violating Out of Scope.
  Fix: Remove AC4 from Phase 1 scope. Move the cross-navigation behaviour to Out of Scope as: "Cross-navigation from the allocation matrix to a specific person's row in the Roster view (clicking a person's name to jump to their roster row) — Phase 2 consideration, depends on names-inline feature also deferred to Phase 2."

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
| A — Traceability | 5 | Epic, discovery, benefit-metric all linked. M2 named with explicit "makes M2 immediately confirmable" mechanism. |
| B — Scope | 5 | Editing, names-inline, sorting, and gap/leadership views all explicitly excluded. No scope creep from discovery. |
| C — AC quality | 1 | AC1–AC3, AC5 all well-formed and testable. AC4 FAIL: requires clicking names that Out of Scope says don't exist in Phase 1. Incoherence between AC4 and Out of Scope is a HIGH finding. |
| D — Completeness | 5 | All sections present. Named persona. NFRs cover performance, accessibility, security. Complexity rated. |
| E — Architecture | 5 | Static HTML. No external libs. CSS custom properties for colour indicators. fetch() relative path. No build step. |

**Outcome:** FAIL — 1 HIGH (1-H1), 0 MEDIUM, 0 LOW. Must resolve before /test-plan. See Run 2 for resolution.
