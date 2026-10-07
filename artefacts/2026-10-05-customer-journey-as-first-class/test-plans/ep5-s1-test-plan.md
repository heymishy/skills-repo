# Test Plan: ep5-s1 — Database migration: create journeys, journey_stages, and feature_journey_stage_mappings tables

**Feature:** 2026-10-05-customer-journey-as-first-class
**Story:** ep5-s1
**Review status:** PASS (Run 1, 2026-10-07)
**Date:** 2026-10-05
**Test runner:** Node.js custom `async test()` helper — `node tests/check-ep5-s1-migration.js`

---

## Test Data Strategy

**Strategy:** Seeded database — the test runner connects to a real Postgres test instance via `DATABASE_URL` environment variable. The migration script is run fresh against a clean test database (or a database that has already had the migration applied, for idempotency tests). All assertions use `information_schema` and `pg_indexes` queries.

**PCI/sensitivity constraints:** None — migration tests operate on schema structure only; no user data involved.

**Data owner:** Self-contained — tests generate schema state by running the migration; no external data dependency.

**Pre-condition:** `DATABASE_URL` must point to a Postgres test database before the test suite runs. If not set, all tests fail with a clear error: "DATABASE_URL not set — cannot run migration tests."

---

## AC Coverage Table

| AC | Description | Test type | Test ID(s) | Gap? |
|----|-------------|-----------|------------|------|
| AC1 | `journeys` table exists with all required columns and correct types | Integration | ep5-s1-t01 through ep5-s1-t07 | None |
| AC2 | `journey_stages` table exists with all required columns | Integration | ep5-s1-t08 through ep5-s1-t20 | None |
| AC3 | `feature_journey_stage_mappings` table exists with FK constraints, cascade delete, and `metric_keys` JSONB default `[]` | Integration | ep5-s1-t21 through ep5-s1-t28 | None |
| AC4 | Migration is idempotent — safe to run twice; no duplicate tables, indexes, or errors | Integration | ep5-s1-t29 through ep5-s1-t31 | None |
| AC5 | Five required indexes exist | Integration | ep5-s1-t32 through ep5-s1-t36 | None |

---

## Gap Table

| Gap | AC | Gap type | Handling | Risk-accept justification |
|-----|-----|----------|----------|--------------------------|
| Missing indexes on `journeys(product_id)` and `feature_journey_stage_mappings(feature_slug)` | AC5 | Advisory — performance, not correctness | Manual advisory note only; no test assertion | 12-L1 from review: these are performance indexes surfaced as LOW finding; the migration AC5 as written does not require them. Log as tech-debt if query plans show degradation post-release. |

---

## Unit Tests

Migration scripts are not unit-testable in isolation (they are SQL DDL executed against Postgres). No pure-function unit tests apply here. All tests are integration tests against a live Postgres instance.

**No unit tests — confirmed.** All verification is at the integration layer.

---

## Integration Tests

### AC1 — `journeys` table schema

**ep5-s1-t01**
- Name: `journeys table exists after migration`
- AC: AC1
- Precondition: Migration script has been run against the test database
- Action: Query `information_schema.tables WHERE table_name = 'journeys'`
- Expected: One row returned with `table_schema = 'public'`
- Edge case: False if table missing — test fails with clear message

**ep5-s1-t02**
- Name: `journeys.id column is UUID primary key`
- AC: AC1
- Precondition: Migration complete
- Action: Query `information_schema.columns` for `journeys.id`; query `information_schema.table_constraints` for PK on `journeys`
- Expected: Column exists, `data_type = 'uuid'`; primary key constraint exists on `id`

**ep5-s1-t03**
- Name: `journeys.tenant_id is text not null`
- AC: AC1
- Precondition: Migration complete
- Action: Query `information_schema.columns` for `journeys.tenant_id`
- Expected: `data_type = 'text'`, `is_nullable = 'NO'`

**ep5-s1-t04**
- Name: `journeys.name is text not null`
- AC: AC1
- Precondition: Migration complete
- Action: Query `information_schema.columns` for `journeys.name`
- Expected: `data_type = 'text'`, `is_nullable = 'NO'`

**ep5-s1-t05**
- Name: `journeys.description is text nullable`
- AC: AC1
- Precondition: Migration complete
- Action: Query `information_schema.columns` for `journeys.description`
- Expected: `data_type = 'text'`, `is_nullable = 'YES'`

**ep5-s1-t06**
- Name: `journeys.product_id is UUID nullable with FK to products`
- AC: AC1
- Precondition: Migration complete
- Action: Query `information_schema.columns` for `journeys.product_id`; query `information_schema.referential_constraints` and `information_schema.key_column_usage` for FK from `journeys.product_id` → `products.id`
- Expected: Column exists, `data_type = 'uuid'`, `is_nullable = 'YES'`; FK constraint exists pointing to `products`

**ep5-s1-t07**
- Name: `journeys.created_at and updated_at are timestamptz`
- AC: AC1
- Precondition: Migration complete
- Action: Query `information_schema.columns` for `journeys.created_at` and `journeys.updated_at`
- Expected: Both have `data_type = 'timestamp with time zone'`

---

### AC2 — `journey_stages` table schema

**ep5-s1-t08**
- Name: `journey_stages table exists after migration`
- AC: AC2
- Precondition: Migration complete
- Action: Query `information_schema.tables WHERE table_name = 'journey_stages'`
- Expected: One row returned

**ep5-s1-t09**
- Name: `journey_stages.id is UUID primary key`
- AC: AC2
- Precondition: Migration complete
- Action: Query column type and PK constraint
- Expected: `data_type = 'uuid'`; PK on `id`

**ep5-s1-t10**
- Name: `journey_stages.journey_id is UUID not null with FK to journeys`
- AC: AC2
- Precondition: Migration complete
- Action: Query column; query FK constraint from `journey_stages.journey_id` → `journeys.id`
- Expected: `data_type = 'uuid'`, `is_nullable = 'NO'`; FK exists

**ep5-s1-t11**
- Name: `journey_stages.tenant_id is text not null`
- AC: AC2
- Precondition: Migration complete
- Action: Query column
- Expected: `data_type = 'text'`, `is_nullable = 'NO'`

**ep5-s1-t12**
- Name: `journey_stages.name is text not null`
- AC: AC2
- Precondition: Migration complete
- Action: Query column
- Expected: `data_type = 'text'`, `is_nullable = 'NO'`

**ep5-s1-t13**
- Name: `journey_stages.position is integer not null`
- AC: AC2
- Precondition: Migration complete
- Action: Query column
- Expected: `data_type = 'integer'`, `is_nullable = 'NO'`

**ep5-s1-t14**
- Name: `journey_stages optional text columns are nullable (description, customer_actions, touchpoints, channel, emotion, pain_points, opportunities)`
- AC: AC2
- Precondition: Migration complete
- Action: Query `information_schema.columns` for each of the seven optional text columns
- Expected: All have `data_type = 'text'`, `is_nullable = 'YES'`

**ep5-s1-t15**
- Name: `journey_stages.moment_of_truth is boolean with default false`
- AC: AC2
- Precondition: Migration complete
- Action: Query column type and column default
- Expected: `data_type = 'boolean'`, `column_default = 'false'`

**ep5-s1-t16**
- Name: `journey_stages.created_at and updated_at are timestamptz`
- AC: AC2
- Precondition: Migration complete
- Action: Query both columns
- Expected: Both `data_type = 'timestamp with time zone'`

**ep5-s1-t17**
- Name: `journey_stages channel enum values are constrained`
- AC: AC2
- Precondition: Migration complete
- Action: Attempt to insert a row with `channel = 'fax'` (invalid value)
- Expected: Postgres raises a check constraint violation (or the column uses a `CHECK` constraint or enum type that rejects invalid values)
- Note: If `channel` is implemented as a plain `text` column with no constraint, this test documents the gap — the design artefact specifies an enum

**ep5-s1-t18**
- Name: `journey_stages emotion enum values are constrained`
- AC: AC2
- Precondition: Migration complete
- Action: Attempt to insert a row with `emotion = 'ecstatic'` (invalid value)
- Expected: Postgres raises a check constraint violation
- Note: Same caveat as ep5-s1-t17

**ep5-s1-t19** *(edge case)*
- Name: `journey_stages can be inserted with only required fields`
- AC: AC2
- Precondition: Migration complete; a `journeys` record exists with known `id` and `tenant_id`
- Action: Insert a `journey_stages` row with only `id`, `journey_id`, `tenant_id`, `name`, `position`; all optional fields null
- Expected: Insert succeeds; row retrievable

**ep5-s1-t20** *(edge case)*
- Name: `journey_stages.moment_of_truth defaults to false without explicit value`
- AC: AC2
- Precondition: Migration complete
- Action: Insert a `journey_stages` row without specifying `moment_of_truth`
- Expected: Retrieved row has `moment_of_truth = false`

---

### AC3 — `feature_journey_stage_mappings` table schema, FK constraints, and cascade delete

**ep5-s1-t21**
- Name: `feature_journey_stage_mappings table exists after migration`
- AC: AC3
- Precondition: Migration complete
- Action: Query `information_schema.tables WHERE table_name = 'feature_journey_stage_mappings'`
- Expected: One row returned

**ep5-s1-t22**
- Name: `feature_journey_stage_mappings.id is UUID primary key`
- AC: AC3
- Precondition: Migration complete
- Action: Query column type and PK
- Expected: `data_type = 'uuid'`; PK on `id`

**ep5-s1-t23**
- Name: `feature_journey_stage_mappings.journey_stage_id FK to journey_stages with cascade delete`
- AC: AC3 (and 12-M2 review finding)
- Precondition: Migration complete
- Action: Query FK constraint from `feature_journey_stage_mappings.journey_stage_id` → `journey_stages.id`; query `information_schema.referential_constraints` for `DELETE_RULE`
- Expected: FK exists; `delete_rule = 'CASCADE'`

**ep5-s1-t24**
- Name: `feature_journey_stage_mappings.journey_id FK to journeys with cascade delete`
- AC: AC3 (and 12-M2 review finding)
- Precondition: Migration complete
- Action: Query FK from `feature_journey_stage_mappings.journey_id` → `journeys.id`; query `delete_rule`
- Expected: FK exists; `delete_rule = 'CASCADE'`

**ep5-s1-t25**
- Name: `feature_journey_stage_mappings.tenant_id is text not null`
- AC: AC3
- Precondition: Migration complete
- Action: Query column
- Expected: `data_type = 'text'`, `is_nullable = 'NO'`

**ep5-s1-t26**
- Name: `feature_journey_stage_mappings.feature_slug is text not null`
- AC: AC3
- Precondition: Migration complete
- Action: Query column
- Expected: `data_type = 'text'`, `is_nullable = 'NO'`

**ep5-s1-t27**
- Name: `feature_journey_stage_mappings.metric_keys is JSONB with default empty array`
- AC: AC3
- Precondition: Migration complete
- Action: Query column type and default; insert a row without specifying `metric_keys` and retrieve it
- Expected: `data_type = 'jsonb'`; retrieved row has `metric_keys = []`

**ep5-s1-t28** *(edge case — cascade delete behaviour)*
- Name: `deleting a journey_stages row cascades to feature_journey_stage_mappings`
- AC: AC3 (12-M2 review finding — cascade must be verified behaviourally, not just as a schema constraint)
- Precondition: Migration complete; a `journeys` record, a `journey_stages` record, and a `feature_journey_stage_mappings` record referencing that stage all exist
- Action: Delete the `journey_stages` row
- Expected: The associated `feature_journey_stage_mappings` row is also deleted; no orphaned mapping records remain

---

### AC4 — Idempotency

**ep5-s1-t29**
- Name: `migration runs to completion a second time without error`
- AC: AC4 (and 12-M1 review finding — idempotency means no error)
- Precondition: Migration has already been run once
- Action: Run the migration script a second time
- Expected: Script exits with code 0; no Postgres error thrown (tables and indexes already exist are detected via `IF NOT EXISTS` or equivalent)

**ep5-s1-t30**
- Name: `no duplicate tables after second migration run`
- AC: AC4 (12-M1 review finding — idempotency means no duplicate objects)
- Precondition: Migration run twice
- Action: Query `information_schema.tables WHERE table_name IN ('journeys', 'journey_stages', 'feature_journey_stage_mappings')`
- Expected: Exactly 3 rows — one per table; no duplicates

**ep5-s1-t31**
- Name: `no duplicate indexes after second migration run`
- AC: AC4 (12-M1 review finding)
- Precondition: Migration run twice
- Action: Query `pg_indexes` for all indexes on the three tables
- Expected: The count of indexes per table matches the first run exactly — no indexes are duplicated

---

### AC5 — Required indexes

**ep5-s1-t32**
- Name: `journeys(tenant_id) index exists`
- AC: AC5
- Precondition: Migration complete
- Action: Query `pg_indexes WHERE tablename = 'journeys' AND indexdef LIKE '%tenant_id%'`
- Expected: At least one row returned

**ep5-s1-t33**
- Name: `journey_stages(journey_id) index exists`
- AC: AC5
- Precondition: Migration complete
- Action: Query `pg_indexes WHERE tablename = 'journey_stages' AND indexdef LIKE '%journey_id%'`
- Expected: At least one row returned

**ep5-s1-t34**
- Name: `journey_stages(tenant_id) index exists`
- AC: AC5
- Precondition: Migration complete
- Action: Query `pg_indexes WHERE tablename = 'journey_stages' AND indexdef LIKE '%tenant_id%'`
- Expected: At least one row returned

**ep5-s1-t35**
- Name: `feature_journey_stage_mappings(journey_stage_id) index exists`
- AC: AC5
- Precondition: Migration complete
- Action: Query `pg_indexes WHERE tablename = 'feature_journey_stage_mappings' AND indexdef LIKE '%journey_stage_id%'`
- Expected: At least one row returned

**ep5-s1-t36**
- Name: `feature_journey_stage_mappings(tenant_id) index exists`
- AC: AC5
- Precondition: Migration complete
- Action: Query `pg_indexes WHERE tablename = 'feature_journey_stage_mappings' AND indexdef LIKE '%tenant_id%'`
- Expected: At least one row returned

---

## NFR Tests

**Story NFRs:** Idempotent migration (covered by AC4 tests above), follows `migrate-schema-*.js` naming convention, no new npm runtime dependencies.

**ep5-s1-nfr01**
- Name: `migration file follows migrate-schema-*.js naming convention`
- NFR: File naming convention
- Precondition: Migration script exists in the repo
- Action: Check that the migration file name matches the pattern `migrate-schema-*.js` (or the project's established convention)
- Expected: File name matches — verified by inspecting the filename at test setup

**ep5-s1-nfr02**
- Name: `no new npm runtime dependencies introduced`
- NFR: product/constraints.md #11
- Precondition: Baseline `package.json` known
- Action: Compare `dependencies` (not `devDependencies`) in `package.json` before and after adding the migration script
- Expected: `dependencies` object is unchanged — the migration uses only the existing Postgres client already in the project

---

## Verification Script (AC verification script for human review)

**Artefact:** `artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep5-s1-verification.md`

---

### Setup

You will need:
- A terminal with access to a Postgres database (the test or staging database)
- The `psql` command-line tool or a Postgres client
- The `DATABASE_URL` environment variable pointing to the correct database

**Before starting:** confirm which database you are connected to. Do not run this against production.

---

### Scenario 1 — Verify the `journeys` table exists with correct columns

**Steps:**
1. Connect to the database
2. Run: `\d journeys` (in psql) or query `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'journeys' ORDER BY ordinal_position;`
3. Check the output

**Expected result:** You should see these columns: `id` (uuid, not null), `tenant_id` (text, not null), `name` (text, not null), `description` (text, nullable), `product_id` (uuid, nullable), `created_at` (timestamp with time zone), `updated_at` (timestamp with time zone). All seven columns present.

**If broken:** The table is missing or has missing columns — the migration script did not run correctly or is incomplete.

---

### Scenario 2 — Verify the `journey_stages` table exists with correct columns including `position` and `moment_of_truth`

**Steps:**
1. Run: `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'journey_stages' ORDER BY ordinal_position;`
2. Check the output

**Expected result:** You should see all columns from the design specification: `id`, `journey_id`, `tenant_id`, `name` (not null), `position` (integer, not null), `description`, `customer_actions`, `touchpoints`, `channel`, `emotion`, `pain_points`, `opportunities` (all text, nullable), `moment_of_truth` (boolean, default false), `created_at`, `updated_at`.

**Check specifically:** `position` must be `integer`, not null. `moment_of_truth` must have `column_default = 'false'`.

**If broken:** Any missing column or wrong type indicates the migration is incomplete.

---

### Scenario 3 — Verify the `feature_journey_stage_mappings` table has FK constraints with cascade delete

**Steps:**
1. Run:
```sql
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'feature_journey_stage_mappings'
  AND tc.constraint_type = 'FOREIGN KEY';
```
2. Check the output

**Expected result:** Two FK rows: (1) `journey_stage_id` → `journey_stages.id` with `delete_rule = CASCADE`; (2) `journey_id` → `journeys.id` with `delete_rule = CASCADE`.

**If broken:** Missing FK or wrong delete rule — staging data will become orphaned when stages or journeys are deleted.

---

### Scenario 4 — Verify `metric_keys` column defaults to an empty JSON array

**Steps:**
1. Insert a test mapping row without specifying `metric_keys`:
```sql
-- First ensure you have a valid journey and stage to reference
INSERT INTO feature_journey_stage_mappings (id, journey_stage_id, journey_id, tenant_id, feature_slug)
VALUES (gen_random_uuid(), '<stage-id>', '<journey-id>', 'test-tenant', 'test-feature-slug');
```
2. Retrieve the row:
```sql
SELECT metric_keys FROM feature_journey_stage_mappings WHERE feature_slug = 'test-feature-slug';
```
3. Clean up: `DELETE FROM feature_journey_stage_mappings WHERE feature_slug = 'test-feature-slug';`

**Expected result:** The `metric_keys` column shows `[]` — an empty JSON array, not `null`.

**If broken:** `null` instead of `[]` means the default was not set correctly. Features mapped without metrics would need special null-handling throughout the codebase.

---

### Scenario 5 — Verify cascade delete works end to end

**Steps:**
1. Insert a test journey, stage, and mapping:
```sql
INSERT INTO journeys (id, tenant_id, name) VALUES (gen_random_uuid(), 'test-tenant', 'Test Journey') RETURNING id;
-- copy returned id as <journey-id>
INSERT INTO journey_stages (id, journey_id, tenant_id, name, position) VALUES (gen_random_uuid(), '<journey-id>', 'test-tenant', 'Test Stage', 1) RETURNING id;
-- copy returned id as <stage-id>
INSERT INTO feature_journey_stage_mappings (id, journey_stage_id, journey_id, tenant_id, feature_slug) VALUES (gen_random_uuid(), '<stage-id>', '<journey-id>', 'test-tenant', 'cascade-test');
```
2. Delete the stage: `DELETE FROM journey_stages WHERE id = '<stage-id>';`
3. Check mappings: `SELECT * FROM feature_journey_stage_mappings WHERE feature_slug = 'cascade-test';`
4. Clean up: `DELETE FROM journeys WHERE id = '<journey-id>';`

**Expected result:** Step 3 returns zero rows — the mapping was automatically deleted when the stage was deleted.

**If broken:** The mapping still exists — orphaned data that will cause incorrect health computation in ep3-s2.

---

### Scenario 6 — Verify idempotency (run migration twice)

**Steps:**
1. Run the migration script a second time: `node scripts/migrate-schema-journeys.js` (or the actual filename)
2. Observe the output

**Expected result:** The script completes without error. No "table already exists" or "index already exists" errors thrown. Exit code 0.

3. Verify no duplicate tables: `SELECT count(*) FROM information_schema.tables WHERE table_name IN ('journeys', 'journey_stages', 'feature_journey_stage_mappings');`

**Expected result:** Count is exactly 3.

**If broken:** Script crashes with a duplicate-object error — migration is not idempotent and cannot be safely re-run in CI or during deployment retries.

---

### Scenario 7 — Verify all required indexes exist

**Steps:**
1. Run:
```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('journeys', 'journey_stages', 'feature_journey_stage_mappings')
ORDER BY tablename, indexname;
```
2. Check the output

**Expected result:** You should see at minimum these 5 indexes:
- An index on `journeys(tenant_id)`
- An index on `journey_stages(journey_id)`
- An index on `journey_stages(tenant_id)`
- An index on `feature_journey_stage_mappings(journey_stage_id)`
- An index on `feature_journey_stage_mappings(tenant_id)`

Primary key indexes do not count toward these 5.

**If broken:** Missing indexes will cause slow queries under load; not a correctness issue but a performance risk.

---

### Advisory note (not a blocking scenario)

The review (finding 12-L1) flagged that indexes on `journeys(product_id)` and `feature_journey_stage_mappings(feature_slug)` are absent from AC5 but may be needed for ep4-s2's product-page join and ep2-s3's feature-not-found lookup. These are not required by the current story but should be evaluated before the full feature is released to production. Add them via a follow-up migration if query performance is degraded.