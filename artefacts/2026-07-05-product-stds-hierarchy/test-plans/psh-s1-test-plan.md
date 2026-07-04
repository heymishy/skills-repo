# Test Plan: psh-s1 — Products and standards Postgres tables and schema

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s1.md
**Review reference:** artefacts/2026-07-05-product-stds-hierarchy/review/psh-s1-review-1.md (PASS)
**Test file:** `tests/check-psh-s1-schema.js`
**Date:** 2026-07-05

---

## Test Data Strategy

**Strategy:** Seeded test database — a dedicated test Postgres instance (or schema) is initialised with no prior product tables. Each test block starts from a clean migration state. The test script runs the migration SQL directly via the `pg` pool and inspects `information_schema.columns` to verify table structure. A post-run teardown drops the test tables.

**Sensitivity:** None. Schema-only — no user data, no credentials, no PII.

---

## AC Coverage Table

| AC | Test type | Test name |
|----|-----------|-----------|
| AC1 — products table created with all columns | Integration | `creates products table with correct columns on fresh DB` |
| AC1 — migration is idempotent | Integration | `re-running migration does not error (products table)` |
| AC2 — standards table created with visibility CHECK | Integration | `creates standards table with visibility CHECK constraint` |
| AC2 — idempotent | Integration | `re-running migration does not error (standards table)` |
| AC3 — journeys.product_id column added | Integration | `adds product_id FK column to journeys table` |
| AC3 — idempotent | Integration | `re-running migration does not error (journeys.product_id)` |
| AC4 — tenant isolation via product_id FK join | Integration | `journeys filtered by product_id return only correct rows; cross-tenant query returns zero rows` |
| AC5 guard — no adapter introduced | Unit | `(structural check) migration file contains no setX or adapter pattern` |

**Total tests: 8** (7 integration, 1 structural unit)

---

## Gap Table

| AC | Gap | Type | Resolution |
|----|-----|------|------------|
| AC5 | Not a testable criterion (review finding 1-M1) | planning-note | Structural check that no adapter exists — passes trivially pre-implementation, flags if introduced |

---

## Unit Tests

### T1: `(structural check) migration file contains no setX or adapter pattern`
**AC:** AC5 guard
**Precondition:** Migration module file exists at its expected path.
**Action:** Read the migration file source. Assert it does not contain `set[A-Z]` or `Injectable` patterns.
**Expected result:** No adapter pattern found — assertion passes.
**Edge cases:** None — this is a guard, not a functional test. Passes trivially if no adapter is introduced.

---

## Integration Tests

All integration tests require a test Postgres pool with a `journeys` table pre-existing (matching the current schema) and no `products` or `standards` tables yet.

### T2: `creates products table with correct columns on fresh DB`
**AC:** AC1
**Precondition:** Test DB has no `products` table.
**Action:** Run the migration block. Query `information_schema.columns WHERE table_name = 'products'`.
**Expected result:** Columns present: `product_id` (uuid, not null, default gen_random_uuid()), `tenant_id` (varchar, not null), `name` (varchar, not null), `description` (text, nullable), `created_at` (timestamptz, default now()), `created_by` (varchar, not null), `updated_at` (timestamptz, default now()).

### T3: `re-running migration does not error (products table)`
**AC:** AC1 idempotency
**Precondition:** Migration has already run once (products table exists).
**Action:** Run the migration block again.
**Expected result:** No SQL error thrown. `products` table still exists with correct schema.

### T4: `creates standards table with visibility CHECK constraint`
**AC:** AC2
**Precondition:** Test DB has no `standards` table.
**Action:** Run migration. Query `information_schema.columns WHERE table_name = 'standards'`.
**Expected result:** Columns present: `standard_id` (uuid PK), `product_id` (uuid FK), `org_id` (varchar not null), `name` (varchar not null), `content` (text not null), `visibility` (varchar not null, default 'product'). Inserting `visibility = 'invalid'` throws a CHECK constraint violation. Inserting `visibility = 'public'` succeeds (reserved, not blocked at schema level).

### T5: `re-running migration does not error (standards table)`
**AC:** AC2 idempotency
**Precondition:** Standards table already exists.
**Action:** Run migration again.
**Expected result:** No error.

### T6: `adds product_id FK column to journeys table`
**AC:** AC3
**Precondition:** `journeys` table exists with no `product_id` column.
**Action:** Run migration. Query `information_schema.columns WHERE table_name = 'journeys' AND column_name = 'product_id'`.
**Expected result:** Column exists: `product_id` uuid, nullable, FK references products(product_id) ON DELETE SET NULL. Existing journey rows have `product_id = NULL`.

### T7: `re-running migration does not error (journeys.product_id)`
**AC:** AC3 idempotency
**Precondition:** `product_id` column already exists on `journeys`.
**Action:** Run migration again.
**Expected result:** No error. Column still present.

### T8: `journeys filtered by product_id return only correct rows; cross-tenant query returns zero rows`
**AC:** AC4
**Precondition:** Products for tenant-a and tenant-b created. Journeys linked to each.
**Action:** Query `journeys WHERE product_id = <tenant-a product>`. Query `products WHERE tenant_id = 'tenant-b'` for tenant-a's product.
**Expected result:** First query returns only tenant-a journeys. Second query returns zero rows.

---

## NFR Tests

### T-NFR1: `migration uses IF NOT EXISTS on all CREATE TABLE statements`
**NFR:** Idempotency
**Action:** Inspect migration SQL source. Assert each CREATE TABLE/ALTER TABLE statement includes `IF NOT EXISTS` or `IF NOT EXISTS` equivalent.
**Expected result:** Pattern found for all three statements.

### T-NFR2: `products.tenant_id and standards.org_id columns are NOT NULL`
**NFR:** Data isolation
**Action:** Query `information_schema.columns` for `is_nullable` on these columns.
**Expected result:** Both return `NO` (not nullable). Any INSERT without these fields throws a NOT NULL violation.
