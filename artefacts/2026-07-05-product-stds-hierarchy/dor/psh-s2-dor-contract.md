# DoR Contract — psh-s2: Existing journey migration to Default product

**Feature:** 2026-07-05-product-stds-hierarchy
**Date:** 2026-07-05
**Status:** Approved

---

## What will be built

A standalone Node.js migration script `scripts/migrate-default-product.js` that:

1. Queries distinct `tenant_id` values from `journeys` where `product_id IS NULL`.
2. For each such `tenant_id`: checks if a product with `name = 'Default'` already exists for that tenant. If not: inserts a new product row with `name = 'Default'`, `description = 'Auto-created default product — migrate your features to named products when ready.'`, `created_by = 'migration'`, `tenant_id = $tenantId`.
3. Bulk-updates `journeys SET product_id = <default-id> WHERE product_id IS NULL AND tenant_id = $tenantId` per tenant.
4. Logs a completion summary: count of tenants processed, Default products created, journeys updated. Exits with code 0 on success, non-zero on error.

The script is idempotent — safe to run multiple times without creating duplicates or overwriting already-assigned journeys.

## What will NOT be built

Migration of product context files (Default product has empty context by design), migration of standards (none existed pre-feature), any UI changes, any API routes, changes to psh-s1 schema.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — one Default product per tenant, all NULL journeys assigned | Integration: two tenants with NULL-product_id journeys; after script run, each has exactly one Default and all journeys assigned | integration |
| AC2 — idempotent (no duplicates on second run) | Integration: run script twice; assert Default product count unchanged, journey product_ids unchanged | integration |
| AC3 — no Default created for tenant with no NULL journeys | Integration: tenant with all journeys already assigned; after run, no new Default for that tenant | integration |
| AC4 — already-assigned journeys not overwritten | Integration: one journey pre-assigned to a named product; after run, product_id unchanged | integration |
| AC5 — completion log emitted | Integration: capture stdout; assert summary line with counts present, script exits 0 | integration |

## Assumptions

- psh-s1 is complete: `products` table and `journeys.product_id` FK column exist before this script runs.
- Script runs once as a one-shot migration, not on every server start.
- No concurrent journey creation during migration run.
- `journeys.tenant_id` column exists and matches `products.tenant_id` semantics.

## Estimated touch points

- **Files:** `scripts/migrate-default-product.js` (new), `tests/check-psh-s2-migration.js` (new)
- **Services:** Postgres
- **APIs:** None

## schemaDepends

`schemaDepends: []` — depends on psh-s1 Postgres schema only; no pipeline-state.json field dependencies.
