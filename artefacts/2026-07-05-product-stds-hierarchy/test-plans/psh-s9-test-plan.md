# Test Plan: psh-s9 — Org-level standard promotion and per-product opt-out

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s9.md
**Review reference:** artefacts/2026-07-05-product-stds-hierarchy/review/psh-s9-review-1.md (PASS, 2 LOW)
**Test file:** `tests/check-psh-s9-standard-promotion.js`
**Date:** 2026-07-05

---

## Test Data Strategy

**Strategy:** Synthetic. Mocked `pg` pool for route handler tests. A separate test block runs the `standard_product_optouts` schema migration against the test DB to verify AC6.

**Sensitivity:** None.

---

## AC Coverage Table

| AC | Test type | Test name |
|----|-----------|-----------|
| AC1 — promotion changes visibility product→org | Integration | `PUT /standards/:id/promote updates visibility to org and returns 200` |
| AC2 — org standard appears in all product lists | Integration | `org-level standard appears in standards list for other products in same org` |
| AC3 — opt-out inserts row in standard_product_optouts | Integration | `POST /products/:id/standards/:sid/optout inserts optout row` |
| AC4 — opt-out reversal deletes row | Integration | `DELETE /products/:id/standards/:sid/optout removes optout row` |
| AC5 — visibility=public returns HTTP 400 | Unit | `PUT with visibility=public returns 400 with public_visibility_not_available` |
| AC6 — standard_product_optouts table schema correct | Integration | `standard_product_optouts table created with correct columns and UNIQUE constraint` |

**Total tests: 6** (5 integration, 1 unit)

---

## Gap Table

No gaps.

---

## Unit Tests

### T1: `PUT with visibility=public returns 400 with public_visibility_not_available`
**AC:** AC5
**Precondition:** Route handler loaded. Mocked pool.
**Action:** PUT `/standards/std-1` or `/standards/std-1/promote` with `visibility = 'public'`.
**Expected result:** HTTP 400. Response body: `{ "reason": "public_visibility_not_available" }`. No UPDATE executed on the `standards` table.

---

## Integration Tests

### T2: `PUT /standards/:id/promote updates visibility to org and returns 200`
**AC:** AC1
**Precondition:** Standard `std-1` has `visibility = 'product'`. Mocked pool captures UPDATE.
**Action:** PUT `/standards/std-1/promote` (or equivalent promotion endpoint).
**Expected result:** UPDATE captured: `visibility = 'org'` WHERE `standard_id = 'std-1'`. HTTP 200 returned. Standard is now org-level.

### T3: `org-level standard appears in standards list for other products in same org`
**AC:** AC2
**Precondition:** Standard `std-global` promoted to `visibility = 'org'`, `org_id = 'org-1'`. Pool returns it when querying standards for `product_id = 'prod-B'` (different product, same org).
**Action:** GET `/products/prod-B/standards`.
**Expected result:** `std-global` appears in the list with an `orgBadge: true` or `visibility: 'org'` field.

### T4: `POST /products/:id/standards/:sid/optout inserts optout row`
**AC:** AC3
**Precondition:** Mocked pool captures INSERT. Org standard `std-global` exists.
**Action:** POST `/products/prod-B/standards/std-global/optout`.
**Expected result:** INSERT captured into `standard_product_optouts` with `product_id = 'prod-B'`, `standard_id = 'std-global'`. HTTP 200 or 201. Standard no longer appears as active for `prod-B`.

### T5: `DELETE /products/:id/standards/:sid/optout removes optout row`
**AC:** AC4
**Precondition:** Optout row exists for `prod-B` / `std-global`. Mocked pool captures DELETE.
**Action:** DELETE `/products/prod-B/standards/std-global/optout`.
**Expected result:** DELETE captured for the `standard_product_optouts` row. Standard is active again for `prod-B`.

### T6: `standard_product_optouts table created with correct columns and UNIQUE constraint`
**AC:** AC6
**Precondition:** Test DB has no `standard_product_optouts` table.
**Action:** Run migration block that creates `standard_product_optouts`.
**Expected result:** Table exists with: `optout_id UUID PK DEFAULT gen_random_uuid()`, `product_id UUID FK → products`, `standard_id UUID FK → standards`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `UNIQUE(product_id, standard_id)`. Inserting duplicate `(product_id, standard_id)` pair throws a UNIQUE constraint violation.

---

## NFR Tests

### T-NFR1: `promoting an already-org-level standard is a no-op, not an error`
**NFR:** Idempotency
**Precondition:** Standard already has `visibility = 'org'`. Mocked pool.
**Action:** PUT `/standards/std-1/promote` again.
**Expected result:** HTTP 200 (or 204). No error thrown. Standard remains `visibility = 'org'`. Pool UPDATE call is either a no-op or safely re-applied.

### T-NFR2: `req.session.tenantId is sole authority — no cross-tenant standard access`
**NFR:** Security
**Precondition:** Standard `std-other` belongs to `org_id = 'org-other'`. Session has `tenantId = 'org-1'`.
**Action:** Attempt to promote `std-other` from a session for `org-1`.
**Expected result:** HTTP 403 or 404. Standard is not updated. `org-1` cannot modify `org-other`'s standards.
