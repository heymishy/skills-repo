# DoR Contract — psh-s6: Per-product kanban board

**Feature:** 2026-07-05-product-stds-hierarchy
**Date:** 2026-07-05
**Status:** Approved

---

## What will be built

1. `GET /products/:productId/kanban` route returning all journeys for the product grouped by pipeline stage.
2. Kanban view template rendering 8 stage columns (Discovery, Benefit Metric, Definition, Review, Test Plan, Definition of Ready, Implementation, Definition of Done) — each column always visible even when empty (shows "No features at this stage" empty state).
3. Health indicator rendering per card: icon (e.g. ⚠ for red/blocked) or text label ("Blocked") alongside any colour treatment — colour is never the sole indicator (MC-A11Y-02).
4. Feature names HTML-escaped before rendering in cards (MC-SEC-01).
5. All interactive kanban elements keyboard-accessible (MC-A11Y-01).
6. `kanban_viewed` PostHog event on page load with: `view: 'product'`, `productId`, `tenantId`, `featureCount`.
7. Playwright E2E screenshot comparison test at `tests/e2e/psh-s6-product-kanban.spec.js` for AC6 column layout verification.

**CSS-layout classification (CLAUDE.md B2 / ADR-018):** AC6 — Playwright E2E test at `tests/e2e/psh-s6-product-kanban.spec.js`.

## What will NOT be built

Drag-and-drop reordering, sprint/milestone grouping, filtering by health, org-level kanban (psh-s7).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — features shown in correct stage columns | Integration: mocked pool with journeys in 3 different stages; assert stage grouping in response | integration |
| AC2 — stage accuracy on refresh | Integration: updated pool mock returns journey in new stage; assert card appears in new column only | integration |
| AC3 — health indicator uses icon/text not colour-only | Integration: journey with health='red'; assert response includes icon/label alongside health class | integration |
| AC4 — empty stage column visible | Integration: no journeys in 'benefit-metric' stage; assert column still present with empty-state label | integration |
| AC5 — PostHog kanban_viewed event | Integration: mocked PostHog; assert event with view='product', productId, tenantId, featureCount | integration |
| AC6 — CSS column layout | E2E Playwright: `tests/e2e/psh-s6-product-kanban.spec.js` — screenshot comparison of kanban column layout | E2E |

## Assumptions

- Stage column list is the 8 stages enumerated above (same as pipeline-state.json stage enum).
- Feature count in PostHog event = total journeys shown in the kanban (not just one stage).
- Health values: 'green', 'amber', 'red' — red requires visible error indicator beyond colour.
- Keyboard accessibility: tab focus reaches each card; Enter/Space activates card navigation.

## Estimated touch points

- **Files:** `src/web-ui/routes/kanban.js` (new or extend), kanban view template (new), `tests/check-psh-s6-product-kanban.js` (new), `tests/e2e/psh-s6-product-kanban.spec.js` (new)
- **Services:** Postgres, PostHog
- **APIs:** `GET /products/:productId/kanban`

## schemaDepends

`schemaDepends: []`
