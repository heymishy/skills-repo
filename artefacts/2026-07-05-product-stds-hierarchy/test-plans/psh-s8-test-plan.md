# Test Plan: psh-s8 — Standards definition and management per product

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s8.md
**Review reference:** artefacts/2026-07-05-product-stds-hierarchy/review/psh-s8-review-1.md (PASS, clean)
**Test file:** `tests/check-psh-s8-standards-management.js`
**Date:** 2026-07-05

---

## Test Data Strategy

**Strategy:** Synthetic. Mocked `pg` pool. PostHog mocked. Tests operate on route handlers directly.

**Sensitivity:** None.

---

## AC Coverage Table

| AC | Test type | Test name |
|----|-----------|-----------|
| AC1 — create standard inserts row with correct fields | Integration | `POST /products/:id/standards inserts standard with product_id, org_id, visibility=product` |
| AC2 — PostHog standard_created event emitted | Integration | `creating a standard emits standard_created PostHog event with required properties` |
| AC3 — list view returns all product standards, newest first | Integration | `GET /products/:id/standards returns all standards ordered by created_at DESC` |
| AC4 — edit updates name/content and refreshes updated_at | Integration | `PUT /standards/:id updates name, content, and updated_at` |
| AC5 — XSS: script name rendered as plain text | Unit | `standard name with script tag stored and rendered as escaped text` |
| AC6 — path traversal returns 400, no file written | Unit | `standard creation with traversal path returns 400 and no file write` |

**Total tests: 6** (4 integration, 2 unit)

---

## Gap Table

No gaps. All ACs testable.

---

## Unit Tests

### T1: `standard name with script tag stored and rendered as escaped text`
**AC:** AC5
**Precondition:** Mocked pool captures INSERT value.
**Action:** POST to `/products/prod-1/standards` with `name = '<script>alert(1)</script>'`.
**Expected result:** Captured INSERT name field is the raw text string (not decoded HTML). Response or subsequent GET does not render an executable `<script>` tag.

### T2: `standard creation with traversal path returns 400 and no file write`
**AC:** AC6
**Precondition:** File-write spy installed. Resolved path check active.
**Action:** POST with `name = '../../../etc/evil'` on a route that writes to disk.
**Expected result:** HTTP 400. File-write spy not called.

---

## Integration Tests

### T3: `POST /products/:id/standards inserts standard with product_id, org_id, visibility=product`
**AC:** AC1
**Precondition:** Mocked pool captures INSERT. Session has `tenantId = 'org-1'`.
**Action:** POST to `/products/prod-1/standards` with `{ name: 'My Standard', content: 'Use tabs' }`.
**Expected result:** INSERT captured with `product_id = 'prod-1'`, `org_id = 'org-1'`, `visibility = 'product'`, `name = 'My Standard'`, `content = 'Use tabs'`. HTTP 201 response includes `standard_id`.

### T4: `creating a standard emits standard_created PostHog event with required properties`
**AC:** AC2
**Precondition:** PostHog mock.
**Action:** POST `/products/prod-1/standards` with valid data.
**Expected result:** PostHog `standard_created` captured with: `standardId` (non-null), `productId: 'prod-1'`, `tenantId: 'org-1'`, `visibility: 'product'`.

### T5: `GET /products/:id/standards returns all standards ordered by created_at DESC`
**AC:** AC3
**Precondition:** Mocked pool returns 3 standards for `prod-1` with different `created_at` timestamps.
**Action:** GET `/products/prod-1/standards`.
**Expected result:** All 3 standards returned. Ordered newest-first (descending `created_at`). Each has `name`, `visibility` indicator, `created_at`.

### T6: `PUT /standards/:id updates name, content, and updated_at`
**AC:** AC4
**Precondition:** Mocked pool captures UPDATE. Standard `std-1` exists.
**Action:** PUT `/standards/std-1` with `{ name: 'New Name', content: 'New content' }`.
**Expected result:** UPDATE captured with new `name`, new `content`, and `updated_at = NOW()`. HTTP 200 returned.

---

## NFR Tests

### T-NFR1: `req.session.tenantId used as org_id — never from request body`
**NFR:** Security
**Precondition:** Request includes `org_id: 'injected-org'` in body. Session has `tenantId = 'real-org'`.
**Action:** POST `/products/prod-1/standards` with body `org_id` set.
**Expected result:** INSERT captures `org_id = 'real-org'` (from session). Not `'injected-org'` (from body).

### T-NFR2: `standards list loads in under 1 second for 50 standards`
**NFR:** Performance
**Precondition:** Pool mock returns 50 standard rows.
**Action:** Time the GET handler.
**Expected result:** Completes in < 1 second.
