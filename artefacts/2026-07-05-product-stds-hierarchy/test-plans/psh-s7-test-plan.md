# Test Plan: psh-s7 — Org-level kanban with product grouping and filter

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s7.md
**Review reference:** artefacts/2026-07-05-product-stds-hierarchy/review/psh-s7-review-1.md (PASS, 1 LOW)
**Test file:** `tests/check-psh-s7-org-kanban.js`
**E2E test file:** `tests/e2e/psh-s7-org-kanban.spec.js`
**Date:** 2026-07-05

---

## Test Data Strategy

**Strategy:** Synthetic. Mocked `pg` pool returns known products and journeys for a tenant. PostHog client mocked.

E2E (AC6): Playwright. Same setup as psh-s6 E2E.

**Sensitivity:** None.

---

## AC Coverage Table

| AC | Test type | Test name |
|----|-----------|-----------|
| AC1 — all features grouped by product and stage | Integration | `GET /org/kanban returns features grouped by product then by stage` |
| AC2 — product filter limits output to selected product | Integration | `GET /org/kanban?product=prod-1 shows only prod-1 features` |
| AC3 — "All products" filter reset shows all | Integration | `GET /org/kanban with no filter shows all products` |
| AC4 — feature card links to feature's active stage view | Integration | `org kanban feature card includes link to active journey stage` |
| AC5 — PostHog event with view:org, productCount, featureCount | Integration | `viewing org kanban emits kanban_viewed with view:org and correct counts` |
| AC6 — CSS layout renders without overflow | E2E | `org kanban product groups visible without horizontal overflow at 1280×800` |

**Total tests: 6** (5 integration, 1 E2E Playwright)

---

## Gap Table

| AC | Gap | Type | Resolution |
|----|-----|------|------------|
| AC6 | CSS layout cannot be verified by unit/integration test | CSS-layout-dependent | E2E Playwright test (option 1). Test file: `tests/e2e/psh-s7-org-kanban.spec.js`. |

---

## Integration Tests

### T1: `GET /org/kanban returns features grouped by product then by stage`
**AC:** AC1
**Precondition:** Tenant has 2 products. Product-A has 3 features across 2 stages. Product-B has 2 features in 1 stage.
**Action:** Call org kanban handler with `tenantId = 'tenant-x'`.
**Expected result:** Response contains 2 product groups. Product-A group has features in correct stage columns. Product-B group correct. No features from other tenants appear.

### T2: `GET /org/kanban?product=prod-1 shows only prod-1 features`
**AC:** AC2
**Precondition:** Same setup as T1.
**Action:** Call org kanban handler with `productFilter = 'prod-1'`.
**Expected result:** Response contains only Product-A features. Product-B group is absent. Product-A group header still visible.

### T3: `GET /org/kanban with no filter shows all products`
**AC:** AC3
**Precondition:** Same setup as T1.
**Action:** Call org kanban handler with no `productFilter`.
**Expected result:** Both Product-A and Product-B groups appear. All 5 features total.

### T4: `org kanban feature card includes link to active journey stage`
**AC:** AC4
**Precondition:** Feature `j1` has `stage = 'review'`. Known link format is `/journeys/j1/review`.
**Action:** Call org kanban handler. Inspect `j1` card data.
**Expected result:** Card includes `stageLink` field pointing to `/journeys/j1/review` (or equivalent active-stage URL).

### T5: `viewing org kanban emits kanban_viewed with view:org and correct counts`
**AC:** AC5
**Precondition:** PostHog mock. Tenant has 2 products, 5 features.
**Action:** Call org kanban handler.
**Expected result:** PostHog `kanban_viewed` captured with: `view: 'org'`, `tenantId`, `productCount: 2`, `featureCount: 5`.

---

## E2E Tests (Playwright)

### T6: `org kanban product groups visible without horizontal overflow at 1280×800`
**AC:** AC6
**Precondition:** Test server. Seeded tenant with 2 products and features. Viewport 1280×800.
**Action:** Navigate to `/org/kanban`. Wait for page load.
**Expected result:** Both product group headers visible. All stage columns visible within viewport. No horizontal scrollbar on body.

---

## NFR Tests

### T-NFR1: `org kanban renders in under 3 seconds for 10 products and 100 features`
**NFR:** Performance
**Precondition:** Pool mock returns 10 products with 100 journey rows total.
**Action:** Time the handler.
**Expected result:** Completes in < 3 seconds.

### T-NFR2: `cross-tenant isolation — org kanban never returns other tenants' features`
**NFR:** Security
**Precondition:** Two tenants. Handler called with `tenantId = 'tenant-x'`.
**Action:** Inspect all features in response.
**Expected result:** Every feature has `tenant_id = 'tenant-x'`. Zero rows from `'tenant-y'`.
