# Test Plan: psh-s6 — Per-product kanban board

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s6.md
**Review reference:** artefacts/2026-07-05-product-stds-hierarchy/review/psh-s6-review-1.md (PASS, 1 LOW)
**Test file:** `tests/check-psh-s6-product-kanban.js`
**E2E test file:** `tests/e2e/psh-s6-product-kanban.spec.js`
**Date:** 2026-07-05

---

## Test Data Strategy

**Strategy:** Synthetic. Mocked `pg` pool returns known journey rows for a product. PostHog client mocked. Route handler tested directly.

E2E (AC6): Playwright runs against a running server with a seeded test Postgres database. Authentication bypassed in test mode (`NODE_ENV=test` flag, same pattern as existing e2e tests).

**Sensitivity:** None.

---

## AC Coverage Table

| AC | Test type | Test name |
|----|-----------|-----------|
| AC1 — 8 stage columns, all features in correct column | Integration | `GET /products/:id/kanban groups features into 8 stage columns` |
| AC2 — stage update moves feature to new column | Integration | `kanban reflects updated stage after feature stage change` |
| AC3 — health indicator uses icon/text not colour alone | Integration | `red-health feature card includes icon or text label alongside colour` |
| AC4 — empty stage column shown with empty-state label | Integration | `stage column with no features shows empty-state label` |
| AC5 — PostHog kanban_viewed event with product properties | Integration | `viewing product kanban emits kanban_viewed event with view:product and featureCount` |
| AC6 — CSS column layout renders without overflow | E2E | `product kanban 8 columns visible without horizontal overflow at 1280×800` |

**Total tests: 6** (5 integration, 1 E2E Playwright)

---

## Gap Table

| AC | Gap | Type | Resolution |
|----|-----|------|------------|
| AC6 | CSS layout cannot be verified by unit/integration test | CSS-layout-dependent | E2E Playwright test (option 1 — tooling configured). Test file: `tests/e2e/psh-s6-product-kanban.spec.js`. |

---

## Integration Tests

### T1: `GET /products/:id/kanban groups features into 8 stage columns`
**AC:** AC1
**Precondition:** Mocked pool returns 6 journeys for `productId = 'prod-1'`, each with different `stage` values covering 4 of the 8 stages.
**Action:** Call kanban handler with `productId = 'prod-1'`.
**Expected result:** Response contains 8 columns. Features appear in their correct stage column. Stages: Discovery, Benefit Metric, Definition, Review, Test Plan, Definition of Ready, Implementation, Definition of Done.

### T2: `kanban reflects updated stage after feature stage change`
**AC:** AC2
**Precondition:** First call: journey `j1` is in `stage = 'review'`. Second call: pool updated — `j1` now in `stage = 'test-plan'`.
**Action:** Two sequential handler calls.
**Expected result:** First call: `j1` in Review column. Second call: `j1` in Test Plan column, no longer in Review.

### T3: `red-health feature card includes icon or text label alongside colour`
**AC:** AC3
**Precondition:** Mocked pool returns journey `j2` with `health = 'red'`.
**Action:** Call kanban handler. Inspect the card data for `j2`.
**Expected result:** Card includes a `healthLabel` or `healthIcon` field (e.g. `'Blocked'` or `'⚠'`) in addition to the colour value. The `health` field alone is not the only data returned.

### T4: `stage column with no features shows empty-state label`
**AC:** AC4
**Precondition:** Product has features in some stages but none in "Benefit Metric".
**Action:** Call kanban handler.
**Expected result:** "Benefit Metric" column is present in the response with `features: []` and an `emptyLabel` field (e.g. `'No features at this stage'`). Column is not omitted.

### T5: `viewing product kanban emits kanban_viewed event with view:product and featureCount`
**AC:** AC5
**Precondition:** PostHog client mocked. Product has 4 features.
**Action:** Call kanban handler.
**Expected result:** PostHog `kanban_viewed` event captured with: `view: 'product'`, `productId: 'prod-1'`, `tenantId`, `featureCount: 4`.

---

## E2E Tests (Playwright)

### T6: `product kanban 8 columns visible without horizontal overflow at 1280×800`
**AC:** AC6
**Precondition:** Test server running with seeded product containing 1 feature per stage. Browser viewport set to 1280×800.
**Action:** Navigate to `/products/:id/kanban`. Wait for page load.
**Expected result:** All 8 stage column headers visible in the viewport without scrolling. `document.body.scrollWidth <= 1280` (no horizontal overflow on body). Screenshot comparison passes.

---

## NFR Tests

### T-NFR1: `kanban renders in under 2 seconds for product with 50 features`
**NFR:** Performance
**Precondition:** Pool mock returns 50 journey rows.
**Action:** Time the handler call.
**Expected result:** Handler completes in < 2 seconds.

### T-NFR2: `feature names HTML-escaped in kanban card data`
**NFR:** Security
**Precondition:** Feature with `name = '<script>xss</script>'`.
**Action:** Call kanban handler.
**Expected result:** Card name in response is `&lt;script&gt;xss&lt;/script&gt;` or rendered as plain text. No `<script>` tag in HTML output.
