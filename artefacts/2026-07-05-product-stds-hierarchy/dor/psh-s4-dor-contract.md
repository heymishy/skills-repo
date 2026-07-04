# DoR Contract — psh-s4: Product-aware dashboard and navigation

**Feature:** 2026-07-05-product-stds-hierarchy
**Date:** 2026-07-05
**Status:** Approved

---

## What will be built

1. Updated `GET /dashboard` handler returning product cards for `req.session.tenantId`: each card includes `productId`, `name`, `featureCount` (count of journeys with that `product_id`), `lastUpdated` (timestamp of most recently updated journey). If no products exist, response includes a "Create your first product" CTA.
2. `GET /products/:productId` handler listing all journeys for that product with `stage`, `health`, and journey metadata. `productId` URL param validated against products belonging to `req.session.tenantId`.
3. `POST /products/:productId/features` handler creating a new journey row with `product_id` from URL param and `tenant_id` from `req.session.tenantId`, emitting `journey_created` PostHog event with `productId`, `tenantId`, `journeyId`. Redirects to discovery stage for the new journey.
4. HTML-escaping of product names before DOM insertion (MC-SEC-01).
5. ADR-024 compliance: `GET /api/journey/:id` response shape preserved — `productId` added but `turns`, `stages`, `completedStages`, `stage`, `ownerId`, `activeSkill` remain present.

**CSS-layout classification (CLAUDE.md B2 / ADR-018):** Dashboard product card grid layout is CSS-layout-dependent. Classification: Playwright E2E test — `tests/e2e/psh-s4-dashboard-layout.spec.js` must be written as part of implementation.

## What will NOT be built

Product editing or deletion, sorting/filtering the product list, mixing NULL-product_id journeys into the product view.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — product cards with name/featureCount/lastUpdated | Integration: mocked pool; assert card fields for 2 products | integration |
| AC2 — product view lists features with stage/health | Integration: 3 journeys for prod-1; assert all 3 with correct fields | integration |
| AC3 — new feature: journey inserted with product_id + PostHog | Integration: mocked pool + PostHog; assert INSERT + event | integration |
| AC4 — no-products CTA | Integration: empty products result; assert CTA in response | integration |
| AC5 — feature count accurate (no stale) | Integration: pool updated mock returns new count; assert reflects DB state | integration |
| Dashboard card layout | E2E Playwright: `tests/e2e/psh-s4-dashboard-layout.spec.js` screenshot comparison | E2E |

## Assumptions

- `req.session.tenantId` is set by session middleware for all authenticated routes.
- `product_id` URL param is validated against `tenantId` ownership before any DB read.
- ADR-024: `productId` added to journey response without removing required fields.
- Feature count queries the `journeys` table on each request — no caching.

## Estimated touch points

- **Files:** `src/web-ui/server.js` or `src/web-ui/routes/dashboard.js`, `src/web-ui/routes/products.js`, dashboard view template, `tests/check-psh-s4-navigation.js`, `tests/e2e/psh-s4-dashboard-layout.spec.js` (new)
- **Services:** Postgres, PostHog
- **APIs:** `GET /dashboard`, `GET /products/:productId`, `POST /products/:productId/features`

## schemaDepends

`schemaDepends: []`
