# Test Plan: psh-s2 — Existing journey migration to Default product

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s2.md
**Review reference:** artefacts/2026-07-05-product-stds-hierarchy/review/psh-s2-review-1.md (PASS)
**Test file:** `tests/check-psh-s2-migration.js`
**Date:** 2026-07-05

---

## Test Data Strategy

**Strategy:** Seeded test database. Test script inserts known journeys with `product_id = NULL` for multiple tenants, then runs the migration and inspects the resulting state. A teardown block removes all test rows after each test.

**Sensitivity:** None. Test data is synthetic tenant IDs and journey IDs only — no real user data.

---

## AC Coverage Table

| AC | Test type | Test name |
|----|-----------|-----------|
| AC1 — Default products created per tenant, journeys assigned | Integration | `creates one Default product per tenant and assigns all NULL-product_id journeys` |
| AC2 — idempotent (no duplicates on second run) | Integration | `second run produces no duplicate Default products and no product_id changes` |
| AC3 — no Default created for tenants with no NULL journeys | Integration | `skips tenant with no NULL-product_id journeys` |
| AC4 — already-assigned journeys not overwritten | Integration | `journeys with existing product_id are unchanged by migration` |
| AC5 — logs summary on completion | Integration | `migration logs count of defaults created, journeys updated, tenants processed` |

**Total tests: 5** (all integration)

---

## Gap Table

No gaps. All ACs are testable via the seeded test database.

---

## Integration Tests

### T1: `creates one Default product per tenant and assigns all NULL-product_id journeys`
**AC:** AC1
**Precondition:** Journeys exist for tenant-a (3 rows, `product_id = NULL`) and tenant-b (2 rows, `product_id = NULL`). No `products` rows for either tenant.
**Action:** Run migration script.
**Expected result:** Exactly one product with `name = 'Default'` exists for tenant-a; one for tenant-b. All 3 tenant-a journeys have `product_id` pointing to tenant-a's Default product. All 2 tenant-b journeys point to tenant-b's Default product.

### T2: `second run produces no duplicate Default products and no product_id changes`
**AC:** AC2
**Precondition:** Migration has already run once. Capture `product_id` values for all Default products and all journey `product_id` values.
**Action:** Run migration script a second time.
**Expected result:** Count of `products WHERE name = 'Default'` is unchanged. Each journey's `product_id` is identical to the pre-second-run value. No new rows inserted into `products`.

### T3: `skips tenant with no NULL-product_id journeys`
**AC:** AC3
**Precondition:** Tenant-c has journeys all with `product_id` already set (non-NULL). No `products` row for tenant-c exists.
**Action:** Run migration script.
**Expected result:** No `products` row is created for tenant-c. Tenant-c's journeys are unchanged.

### T4: `journeys with existing product_id are unchanged by migration`
**AC:** AC4
**Precondition:** Tenant-d has one journey with `product_id` already set to a known product UUID (P1) and one journey with `product_id = NULL`.
**Action:** Run migration script.
**Expected result:** The NULL journey is assigned to a Default product for tenant-d. The P1 journey still has `product_id = P1` — not overwritten.

### T5: `migration logs count of defaults created, journeys updated, tenants processed`
**AC:** AC5
**Precondition:** Journeys for 2 tenants with NULL `product_id`.
**Action:** Run migration script, capture stdout.
**Expected result:** Stdout contains a summary line with: count of Default products created (≥1), count of journeys updated (≥1), count of tenants processed (≥1). Script exits with code 0 (no uncaught rejections).

---

## NFR Tests

### T-NFR1: `migration completes within 30 seconds for 1000 journeys`
**NFR:** Execution time
**Precondition:** 1000 journeys with `product_id = NULL` across 10 tenants.
**Action:** Time the migration run.
**Expected result:** Total wall time < 30 seconds.

### T-NFR2: `no journey data fields are modified by the migration (turns, stages unchanged)`
**NFR:** No data loss
**Precondition:** Journey row with known `turns = '[{"role":"user"}]'` and `stages` before migration.
**Action:** Run migration. Re-query the journey row.
**Expected result:** `turns` and `stages` fields are byte-identical to pre-migration values. Only `product_id` changes.
