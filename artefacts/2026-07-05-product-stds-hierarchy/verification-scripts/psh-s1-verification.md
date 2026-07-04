# AC Verification Script: psh-s1 — Products and standards Postgres tables and schema

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s1.md
**Test plan reference:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s1-test-plan.md
**Date:** 2026-07-05

---

## Setup

This story is schema-only — no UI to open. Verification is done by running the test script and inspecting Postgres directly.

**Load environment and run tests:**
```powershell
# PowerShell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node tests/check-psh-s1-schema.js
```
```bash
# bash/zsh
export $(grep -v '^#' .env | xargs) && node tests/check-psh-s1-schema.js
```

All tests should pass. If any fail, the migration SQL needs fixing before continuing.

---

## Scenario 1 — products table exists with correct columns (AC1)

After running the migration (server start), connect to Postgres and run:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

**Expected:** You see rows for `product_id`, `tenant_id`, `name`, `description`, `created_at`, `created_by`, `updated_at`. The `tenant_id` and `name` columns have `is_nullable = NO`.

**Broken behaviour looks like:** Missing columns, or `tenant_id` allowing NULL values.

---

## Scenario 2 — server restart does not error on products table (AC1 idempotency)

Restart the server a second time. Watch the startup log.

**Expected:** No SQL error in the log. The server starts cleanly. No "relation already exists" error.

**Broken behaviour looks like:** `ERROR: relation "products" already exists` in the startup log.

---

## Scenario 3 — standards table has visibility CHECK constraint (AC2)

Connect to Postgres and try inserting an invalid visibility value:
```sql
INSERT INTO standards (product_id, org_id, name, content, visibility)
VALUES (gen_random_uuid(), 'org-1', 'test', 'test content', 'invalid_value');
```

**Expected:** The insert is rejected with a CHECK constraint violation error.

Then try `visibility = 'public'` — this should succeed (reserved for Phase 2, not blocked at DB level).

**Broken behaviour looks like:** `'invalid_value'` inserts without error.

---

## Scenario 4 — journeys.product_id column exists and is nullable (AC3)

Run:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'journeys' AND column_name = 'product_id';
```

**Expected:** One row: `product_id`, `uuid`, `YES` (nullable). Existing journey rows (from before this migration) have `product_id = NULL`.

**Broken behaviour looks like:** Column missing, or `is_nullable = NO` (which would reject existing rows).

---

## Scenario 5 — cross-tenant isolation (AC4)

Create two products in different tenants, then check isolation:
```sql
-- Insert test products
INSERT INTO products (tenant_id, name, created_by) VALUES ('tenant-a', 'Test A', 'test') RETURNING product_id;
INSERT INTO products (tenant_id, name, created_by) VALUES ('tenant-b', 'Test B', 'test') RETURNING product_id;

-- Verify cross-tenant query returns zero rows for tenant-a's product
SELECT * FROM products WHERE tenant_id = 'tenant-b' AND product_id = <tenant-a-product-id>;
```

**Expected:** Zero rows returned.

**Broken behaviour looks like:** A row is returned — cross-tenant data visible.

---

## Scenario 6 — re-run is safe (all statements idempotent)

Restart the server a third time (migration has run at least twice).

**Expected:** Startup log shows no SQL errors. All tables intact.

**Broken behaviour looks like:** Any `already exists` or `duplicate` errors in startup log.
