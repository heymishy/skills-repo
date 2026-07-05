# DoR Contract — psh-s7: Org-level kanban with product grouping and filter

**Feature:** 2026-07-05-product-stds-hierarchy
**Date:** 2026-07-05
**Status:** Approved

---

## What will be built

1. `GET /kanban` (org-level) route returning all journeys for `req.session.tenantId` joined with their product data, grouped by product then stage.
2. Org kanban view template rendering products as labelled group headers, each with stage columns for their features.
3. Product filter dropdown — default "All products"; selecting a specific product hides all other product groups. Filter is keyboard-accessible (MC-A11Y-01).
4. Feature card navigation — clicking a card routes to the feature's active stage view.
5. `kanban_viewed` PostHog event on page load: `view: 'org'`, `tenantId`, `productCount`, `featureCount`.
6. HTML-escaping of product names and feature names in org kanban (MC-SEC-01).
7. Health indicators with icon/text alongside colour (MC-A11Y-02).
8. Playwright E2E screenshot comparison test at `tests/e2e/psh-s7-org-kanban.spec.js` for AC6 layout verification.

**CSS-layout classification (CLAUDE.md B2 / ADR-018):** AC6 — Playwright E2E test at `tests/e2e/psh-s7-org-kanban.spec.js`.

## What will NOT be built

Cross-tenant visibility, sorting/prioritising features, export, per-stage filtering by health.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — all features across all products, grouped by product/stage | Integration: mocked pool with 2 products + multiple journeys; assert product-grouped response | integration |
| AC2 — product filter: only filtered product features shown | Integration: filter param applied; assert only matching product's journeys in response | integration |
| AC3 — filter reset: all products shown | Integration: remove filter; assert all products restored | integration |
| AC4 — feature card navigation to active stage | Integration: card href resolves to correct stage route for the journey | integration |
| AC5 — PostHog kanban_viewed org event | Integration: mocked PostHog; assert view='org', productCount, featureCount | integration |
| AC6 — CSS layout | E2E Playwright: `tests/e2e/psh-s7-org-kanban.spec.js` — screenshot comparison | E2E |

## Assumptions

- Extends psh-s6 rendering pattern and route structure.
- `productCount` in PostHog event = count of distinct products returned in the current view.
- Product filter implemented client-side (show/hide product groups) or server-side (query param) — implementation choice.
- `req.session.tenantId` is the sole source of org scoping — no cross-tenant data.

## Estimated touch points

- **Files:** `src/web-ui/routes/kanban.js` (extend), org-kanban view template (new), `tests/check-psh-s7-org-kanban.js` (new), `tests/e2e/psh-s7-org-kanban.spec.js` (new)
- **Services:** Postgres, PostHog
- **APIs:** `GET /kanban`

## schemaDepends

`schemaDepends: []`
