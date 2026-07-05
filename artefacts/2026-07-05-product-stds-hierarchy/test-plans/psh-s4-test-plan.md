# Test Plan: psh-s4 — Product-aware dashboard and navigation

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s4.md
**Review reference:** artefacts/2026-07-05-product-stds-hierarchy/review/psh-s4-review-1.md (PASS, 1 LOW)
**Test file:** `tests/check-psh-s4-navigation.js`
**Date:** 2026-07-05

---

## Test Data Strategy

**Strategy:** Synthetic. Mocked `pg` pool returns known product and journey rows. PostHog client mocked. Tests operate on route handler logic directly without a running HTTP server.

**Sensitivity:** None.

---

## AC Coverage Table

| AC | Test type | Test name |
|----|-----------|-----------|
| AC1 — product cards show name, feature count, last updated | Integration | `GET /dashboard returns product cards with name, feature count, and last-updated date` |
| AC2 — product view lists features with stage and health | Integration | `GET /products/:id lists features with pipeline stage and health indicator` |
| AC3 — new feature: journey created with product_id, PostHog fired | Integration | `POST /products/:id/features creates journey with product_id and emits journey_created event` |
| AC4 — no-products CTA shown for new accounts | Integration | `GET /dashboard with no products shows create-first-product CTA` |
| AC5 — feature count is accurate (not stale) | Integration | `product card feature count reflects current DB state on each load` |

**Total tests: 5** (all integration)

---

## Gap Table

| AC | Gap | Type | Resolution |
|----|-----|------|------------|
| AC5 deletion path | "if deletion exists" scenario cannot be tested (out-of-scope) | out-of-scope-reference | Test covers stage-movement path only — journey moves to completed stage, count re-queried. Deletion path skipped. |

---

## Integration Tests

### T1: `GET /dashboard returns product cards with name, feature count, and last-updated date`
**AC:** AC1
**Precondition:** Mocked pool returns 2 products for `tenantId = 'tenant-x'`. Product-1 has 3 journeys; Product-2 has 0.
**Action:** Call the dashboard handler with session `tenantId = 'tenant-x'`.
**Expected result:** Response includes product cards for both products. Product-1 card shows `featureCount: 3` and `lastUpdated` matching the most recently updated journey timestamp. Product-2 shows `featureCount: 0`.

### T2: `GET /products/:id lists features with pipeline stage and health indicator`
**AC:** AC2
**Precondition:** Mocked pool returns 3 journeys for `productId = 'prod-1'`, each with different `stage` and `health` values.
**Action:** Call the product view handler with `productId = 'prod-1'`.
**Expected result:** Response lists all 3 journeys with their `stage` and `health` fields. No journeys from other products appear.

### T3: `POST /products/:id/features creates journey with product_id and emits journey_created event`
**AC:** AC3
**Precondition:** Mocked pool captures INSERT. Mocked PostHog client captures events. Session has `tenantId = 'tenant-x'`.
**Action:** POST to `/products/prod-1/features`.
**Expected result:** INSERT captured on `journeys` table with `product_id = 'prod-1'` and `tenant_id = 'tenant-x'`. PostHog `journey_created` event captured with `productId = 'prod-1'`, `tenantId = 'tenant-x'`, `journeyId` present. Response navigates to the discovery stage for the new journey.

### T4: `GET /dashboard with no products shows create-first-product CTA`
**AC:** AC4
**Precondition:** Mocked pool returns empty products array for `tenantId = 'new-tenant'`.
**Action:** Call dashboard handler with `tenantId = 'new-tenant'`.
**Expected result:** Response includes a "Create your first product" call-to-action element. No empty product list or flat journey list shown as the default.

### T5: `product card feature count reflects current DB state on each load`
**AC:** AC5
**Precondition:** First call: pool returns 3 journeys for product. Second call (new request): pool returns 2 journeys (one moved to completed).
**Action:** Call dashboard handler twice with the updated pool mock.
**Expected result:** First call shows `featureCount: 3`. Second call shows `featureCount: 2`. No cached stale value returned.

---

## NFR Tests

### T-NFR1: `dashboard product cards load in under 2 seconds for 20 products`
**NFR:** Performance
**Precondition:** Mocked pool returns 20 products with journey counts.
**Action:** Time the dashboard handler call.
**Expected result:** Handler completes in < 2 seconds (excluding network).

### T-NFR2: `product name is HTML-escaped before DOM insertion — no raw innerHTML`
**NFR:** Security
**Precondition:** Product with `name = '<b>Bold</b>'` in mocked pool.
**Action:** Call dashboard handler. Inspect the rendered product card HTML.
**Expected result:** The name appears as `&lt;b&gt;Bold&lt;/b&gt;` in the HTML output (or via textContent assignment). No raw `<b>` tag in the card HTML.
