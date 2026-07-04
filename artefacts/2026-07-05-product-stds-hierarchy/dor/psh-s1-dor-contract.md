# DoR Contract — psh-s1: Products and standards Postgres tables and schema

**Feature:** 2026-07-05-product-stds-hierarchy
**Date:** 2026-07-05
**Status:** Approved

---

## What will be built

Three idempotent DDL blocks added to the `server.js` auto-migration section:

1. `CREATE TABLE IF NOT EXISTS products` with columns: `product_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `tenant_id VARCHAR NOT NULL`, `name VARCHAR NOT NULL`, `description TEXT`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `created_by VARCHAR NOT NULL`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
2. `CREATE TABLE IF NOT EXISTS standards` with columns: `standard_id UUID PK`, `product_id UUID REFERENCES products`, `org_id VARCHAR NOT NULL`, `name VARCHAR NOT NULL`, `content TEXT NOT NULL`, `visibility VARCHAR NOT NULL DEFAULT 'product' CHECK (visibility IN ('product', 'org', 'public'))`, `created_at`, `updated_at`.
3. `ALTER TABLE journeys ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(product_id) ON DELETE SET NULL`. Existing rows remain with `product_id = NULL`. All statements safe to re-run on server restart.

## What will NOT be built

Product creation API routes (psh-s3), standards management routes (psh-s8), the `standard_product_optouts` junction table (psh-s9), product context file storage columns or JSONB fields, any UI changes, any application routes.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — products table with all columns | Integration: run migration on test DB; query `information_schema.columns` and assert all 7 columns present with correct types | integration |
| AC2 — standards table with visibility CHECK constraint | Integration: table created; INSERT with `visibility = 'invalid'` throws constraint violation; `visibility = 'public'` accepted (reserved) | integration |
| AC3 — journeys.product_id FK column added, idempotent | Integration: `ALTER TABLE` runs; existing rows confirmed `product_id = NULL`; FK constraint verified by inserting and querying | integration |
| AC4 — tenant isolation | Integration: products for tenant-a and tenant-b; query scoped to tenant-b returns empty for tenant-a rows | integration |

## Assumptions

- Existing Postgres `pg` pool pattern from `server.js` is used for migration.
- Test database is available for integration tests.
- The `journeys` table already exists with at least a `tenant_id` column.
- No FK from `standards` to `journeys` — standards belong to products, not journeys.

## Estimated touch points

- **Files:** `src/web-ui/server.js` (migration block), `tests/check-psh-s1-schema.js` (new)
- **Services:** Postgres
- **APIs:** None

## schemaDepends

`schemaDepends: []` — foundation story, no upstream pipeline-state.json field dependencies.
