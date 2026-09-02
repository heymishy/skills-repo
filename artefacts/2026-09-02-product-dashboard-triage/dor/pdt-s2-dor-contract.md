# Contract Proposal: Add a Triage Summary Strip for Blocked/Warning Counts

**Story reference:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s2.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## What will be built

A summary strip in `_renderProductView` (`src/web-ui/routes/products.js`), rendered above the feature list, reading Blocked/Warning counts from the already-computed `healthCounts` object. Blocked/Warning counts link to the existing health-filter-chip mechanism. A zero-Blocked-and-Warning state renders a clear positive message. Writes the 5 tests from the test plan: 3 unit, 2 NFR.

## What will NOT be built

- A "stalled 30+ days" count — deferred, requires staleness computation not currently available.
- A "new this week" count — deferred, same reason.
- Any change to the underlying health-filter-chip mechanism itself.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Fixture with non-zero `red`/`amber` counts; assert the strip renders both | Unit |
| AC2 | Extract the strip's Blocked link `href`; assert it targets the same mechanism the existing chip uses | Unit |
| AC3 | Fixture with zero `red`/`amber`; assert a positive-state message renders | Unit |

## Assumptions

- The existing health-filter-chip mechanism's own URL/anchor pattern is stable and reusable without modification.

## Estimated touch points

Files: `src/web-ui/routes/products.js`, `tests/check-pdt-s2-*.js` (new).
Services: None new.
APIs: None new.
