# Contract Proposal: Consolidate the Epic/Phase List

**Story reference:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s1.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## What will be built

1. In `src/web-ui/routes/products.js`, remove the static, non-interactive epic/phase text-dump rendering (the section currently duplicating the interactive By Phase tab's own grouping).
2. Change the interactive By Module/By Phase/All list's default state so every group renders collapsed (item count + rolled-up status bar visible, individual rows hidden) until clicked — implemented as a client-side markup-state change (native `<details>`/`<summary>` preferred), not server-side lazy loading.
3. Add an empty-state message for a product with zero groups.
4. Write the 7 tests from the test plan: 5 unit, 2 NFR.

## What will NOT be built

- Any change to which stories belong to which group (grouping-assignment logic).
- Persisting collapse/expand state across page reloads.
- Any change to the By Module/By Phase/All tab switching, health-filter chips, search box, or module editor.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Call `_renderProductView` with a multi-group fixture; assert each group heading appears exactly once | Unit |
| AC2 | Same fixture; assert row markup present but in a closed/collapsed state, with a real item count and status indicator | Unit |
| AC3 | Same fixture; assert the markup structure natively supports expand-on-click (`<details>` with rows nested inside) | Unit |
| AC4 | Fixture with zero features; assert a clear empty-state message, no exception | Unit |

## Assumptions

- `_renderConsolidatedFeaturesSection`/`_renderProductView` (`src/web-ui/routes/products.js`) are confirmed, via discovery-time code reading, to be the correct and only functions producing both the static dump and the interactive list.
- A native `<details>`/`<summary>` element is an acceptable implementation choice (zero new JS, keyboard-accessible by default) — not mandated, but the story's own AC2 clarification names it as an acceptable option.

## Estimated touch points

Files: `src/web-ui/routes/products.js`, `tests/check-pdt-s1-*.js` (new).
Services: None new.
APIs: None new.
