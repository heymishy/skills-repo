# Contract Proposal — Restructure the Delivery view from a per-stage card stack into a swimlane grid

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s5.md
**Date:** 2026-10-15

---

## What will be built

- In `src/web-ui/routes/journeys.js`, refactor `buildCustomerExperienceSwimlaneGrid` to extract its shared mechanics into a new canonical `buildSwimlaneGridShell(stagesForGrid, { buildHeaderCell, rows, buildA11yEntry })` builder (the `gridTemplateColumns` formula, the `buildDataRow` cell/track/pinned-label-wrapper shape, and the visually-hidden accessible-list assembly). `buildCustomerExperienceSwimlaneGrid` is updated to call this shared builder, passing its own existing header-cell/row/a11y content as callbacks — its own rendered output is unchanged.
- A new `buildDeliverySwimlaneGrid(stagesForGrid)` function, calling the same shared builder with: header cell = stage name + moment-of-truth badge + `.sw-stage-edit` + `.sw-stage-reorder-controls`; two data rows = "Coverage status" (via `buildHealthIndicator`) and "Mapped features" (via `buildDeliveryAnnotations`'s existing output, plus the existing `.sw-stage-map-feature` button, `.sw-stage-add-placeholder` button, and `.sw-placeholder-add-form`, all moved in unchanged); one `sw-delivery-a11y-list`.
- CSS: new `sw-delivery-grid-*` classes mirroring the existing `sw-cx-grid-*` rules (reused structure, Delivery-specific namespacing).
- Removal of `#sw-journey-stages`, its `stagesHtml` per-stage card-loop (the `.sw-stage-card`/`.sw-stage-annotations--delivery` markup it currently renders), and its two existing `display:none` view-gating CSS rules.
- Wiring: the Delivery view toggle (`data-view="delivery"`) now shows `buildDeliverySwimlaneGrid`'s output instead of `#sw-journey-stages`.
- Tests: `tests/check-jae-s5-delivery-swimlane-grid.js` (unit/integration, 7 unit + 1 integration per the test plan) and `tests/e2e/jae-s5-delivery-swimlane-grid.spec.js` (1 E2E spec covering AC1's alignment portion and AC8, modelled on `tests/e2e/jcx-s6-swimlane-grid.spec.js`).

## What will NOT be built

- Any observable change to the Customer-experience grid's rendered output or behaviour — `check-jcx-s6-swimlane-grid.js` and `tests/e2e/jcx-s6-swimlane-grid.spec.js` must both pass unchanged after the refactor.
- A dedicated "Actions" row for Map feature/Add placeholder (decided against, `decisions.md` 2026-10-15).
- Any change to the Canvas view, the feature-picker modal, the placeholder-add-form's own fields, or the mapping/placeholder API routes.
- Any new database query, route, or request parameter.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Shared `grid-template-columns` string assertion across all 3 rows | Unit |
| AC1 (alignment) | Real browser column-order/alignment check | E2E |
| AC2 | Empty-state text/class assertion | Unit |
| AC3 | Button presence/class/data-attribute assertion inside the grid cell | Unit |
| AC4 | Form/button presence/class/data-attribute assertion inside the grid cell | Unit |
| AC5 | Reorder-control presence/class/data-attribute assertion in the header cell, including the single-stage edge case | Unit |
| AC6 | 0-stage empty-state fallback assertion | Unit |
| AC7 | Accessible-list entry-count and content assertion | Unit |
| AC8 | Real browser scroll/pinned-label check | E2E |
| ADR-028 compliance (not a story AC) | Source-level assertion: both grids call the one exported shell builder | Integration |

## Assumptions

- `buildCustomerExperienceSwimlaneGrid`'s existing test suite (`check-jcx-s6-swimlane-grid.js`) is the authoritative behaviour baseline for the refactor — if that suite passes unchanged after the refactor, the refactor is behaviour-preserving.
- The 200px minimum column width is retained for the Delivery grid, identical to the CX grid — no separate width tuning is requested by this story.
- The reorder endpoint's own request/response handling is unchanged; only the reorder buttons' render location moves.
- `buildHealthIndicator` and `buildDeliveryAnnotations` are called exactly as they are today — no signature change.

## Estimated touch points

**Files:** `src/web-ui/routes/journeys.js` (refactor + new function + CSS + wiring), `tests/check-jae-s5-delivery-swimlane-grid.js` (new), `tests/e2e/jae-s5-delivery-swimlane-grid.spec.js` (new)
**Services:** None
**APIs:** None — reuses the existing stage-reorder, feature-mapping, and placeholder endpoints unchanged

---

## H8-ext — Cross-story schema dependency check

**Dependencies block:** Upstream — `jcx-s6`, `jcx-s7` (both merged).
**schemaDepends:** `[]` (empty)
**Rationale:** This story's upstream dependency is on shipped CODE (`buildCustomerExperienceSwimlaneGrid`'s mechanics, the `sw-cx-grid-*` CSS classes, the single-click-to-edit convention) from `jcx-s6`/`jcx-s7` — not on any `pipeline-state.json` schema field those stories wrote. No schema field dependency exists to declare; the empty array is deliberate, not an omission.
