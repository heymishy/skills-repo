# Review Report: Roster view — filterable and searchable workforce table — Run 1

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.5.md
**Date:** 2026-05-26
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[1-L1]** [C — AC quality] — AC2 and AC3 define filter behaviour for the Roster tab but do not specify whether filter state persists when the user switches to another tab (e.g. Allocation Matrix or Hiring Gaps) and returns. wfp.7 AC2 references "the same filter control used in the Roster view," implying a single shared control whose state applies across all tabs. The expected behaviour when returning to Roster after viewing another tab is unspecified. This is a low-risk ambiguity since either interpretation is implementable, but it should be clarified at DoR so test expectations are consistent.

---

## Summary scores

| Category | Score (1–5) | Notes |
|---|---|---|
| A — Traceability | 5 | Epic, discovery, benefit-metric all linked. M1 named with specific "data discovery portion" mechanism. |
| B — Scope | 5 | Editing, retired records, pagination, other tabs, and export all explicitly excluded. No scope creep. |
| C — AC quality | 4 | 5 ACs in Given/When/Then. AC1 updated to local server (CORS fix applied). AC2 multi-filter simultaneous use explicit. AC3 date filter null-exclusion explicit. AC4 real-time search. AC5 error state. LOW-L1: cross-tab filter persistence not specified. |
| D — Completeness | 5 | All sections present. Named persona. Architecture constraint updated to require local dev server. NFRs cover performance, accessibility (contrast ratio), and security. Complexity rated. |
| E — Architecture | 5 | Local dev server requirement stated with explicit browser reason (CORS). No external libs. CSS custom properties. fetch() relative path. No build step required. |

**Outcome:** PASS — 0 HIGH, 0 MEDIUM, 1 LOW. Proceed to /test-plan with LOW noted for DoR clarification.
