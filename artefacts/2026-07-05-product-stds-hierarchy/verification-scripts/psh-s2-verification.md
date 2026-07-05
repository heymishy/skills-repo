# AC Verification Script: psh-s2 — Existing journey migration to Default product

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s2.md
**Test plan reference:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s2-test-plan.md
**Date:** 2026-07-05

---

## Setup

This story is a data migration — no UI. Verification is done via SQL queries and the test script.

```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node tests/check-psh-s2-migration.js
```
```bash
export $(grep -v '^#' .env | xargs) && node tests/check-psh-s2-migration.js
```

---

## Scenario 1 — Each tenant gets exactly one Default product (AC1)

After running the migration script, connect to Postgres and run:
```sql
SELECT tenant_id, COUNT(*) as default_count
FROM products
WHERE name = 'Default'
GROUP BY tenant_id;
```

**Expected:** Each tenant with pre-existing journeys (before psh-s1 deployed) shows `default_count = 1`. No tenant has more than one Default product.

**Broken behaviour:** Any `default_count > 1` for a tenant.

---

## Scenario 2 — All unassigned journeys now have a product_id (AC1)

```sql
SELECT COUNT(*) FROM journeys WHERE product_id IS NULL;
```

**Expected:** Zero rows. All journeys have a product_id.

**Broken behaviour:** Any rows with `product_id = NULL` after migration.

---

## Scenario 3 — Running the migration twice is safe (AC2)

Run the migration script a second time. Then check:
```sql
SELECT tenant_id, COUNT(*) FROM products WHERE name = 'Default' GROUP BY tenant_id;
```

**Expected:** Same counts as after the first run — no new Default products created.

**Broken behaviour:** Duplicate Default products appear, or the script throws an error on the second run.

---

## Scenario 4 — Pre-assigned journeys are untouched (AC4)

If any journey had a `product_id` already set before the migration, verify it after:
```sql
SELECT product_id FROM journeys WHERE journey_id = '<your-pre-assigned-journey-id>';
```

**Expected:** The same `product_id` as before. Not replaced by the Default product's ID.

**Broken behaviour:** The journey's product_id changed to the Default product ID.

---

## Scenario 5 — Migration summary is logged (AC5)

Run the migration and read its output. You should see a line like:

> "Migration complete: 3 Default products created, 47 journeys updated, 3 tenants processed"

(Numbers will match your actual data.)

**Expected:** All three counts are present in the output. The script exits cleanly — no error messages.

**Broken behaviour:** Script crashes, no summary line, or counts are zero when journeys exist.
