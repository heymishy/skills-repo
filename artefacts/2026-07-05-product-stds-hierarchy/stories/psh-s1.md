## Story: psh-s1 — Products and standards Postgres tables and schema

**Epic reference:** artefacts/2026-07-05-product-stds-hierarchy/epics/psh-e1-product-data-model.md
**Discovery reference:** artefacts/2026-07-05-product-stds-hierarchy/discovery.md
**Benefit-metric reference:** artefacts/2026-07-05-product-stds-hierarchy/benefit-metric.md

## User Story

As a **Platform operator (Hamish King)**,
I want **a Postgres schema that supports products, standards, and product-scoped journeys**,
So that **every subsequent product hierarchy story has a stable data foundation to build on, moving M1 and M2 from impossible to achievable**.

## Benefit Linkage

**Metric moved:** M1 (Product setup completion rate) — prerequisite: creation flow cannot be built without the `products` table. M2 (Product context injection rate) — prerequisite: context injection requires `journeys.product_id` FK to exist.
**How:** This story creates the `products`, `standards`, and `journey_product_id` schema. Without it, no product can be created, stored, or referenced. All subsequent stories in this feature depend on this schema being present and idempotent.

## Architecture Constraints

- **ADR-003 (schema-first):** Any new fields added to `pipeline-state.json` referencing products must be added to `pipeline-state.schema.json` in the same commit. Schema and implementation must stay in sync.
- **ADR-011 (artefact-first):** This story artefact must exist before any `src/` module is created.
- **Node.js CommonJS only:** Migration code uses `require('pg')` pool pattern established in `server.js`. No ES modules.
- **No new npm dependencies:** Uses the existing `pg` pool — no new packages.
- **Additive-only schema changes:** No `DROP`, no column renames. All changes must be `IF NOT EXISTS`.
- **D37 guard (no adapter in this story):** This story introduces no injectable adapter — migration is a direct Postgres call. If an adapter pattern is introduced during implementation, the stub must throw per D37 (CLAUDE.md). Record in implementation plan.

## Dependencies

- **Upstream:** None — foundation story.
- **Downstream:** psh-s2 (migration script requires `products` and `journeys.product_id`), psh-s3 (creation flow requires `products` table), all other psh stories.

## Acceptance Criteria

**AC1:** Given the server starts against a clean database (no prior migration run), when the auto-migration block in `server.js` executes, then a `products` table exists with columns: `product_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `tenant_id VARCHAR NOT NULL`, `name VARCHAR NOT NULL`, `description TEXT`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `created_by VARCHAR NOT NULL`, `updated_at TIMESTAMPTZ DEFAULT NOW()`. Re-running the migration (server restart) does not error (`CREATE TABLE IF NOT EXISTS`).

**AC2:** Given the migration runs, when it completes, then a `standards` table exists with columns: `standard_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `product_id UUID REFERENCES products(product_id) ON DELETE CASCADE`, `org_id VARCHAR NOT NULL`, `name VARCHAR NOT NULL`, `content TEXT NOT NULL`, `visibility VARCHAR NOT NULL DEFAULT 'product' CHECK (visibility IN ('product', 'org', 'public'))`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`. Re-running does not error. The `'public'` visibility value is reserved for Phase 2 and is present in the schema but not exposed in any UI in this feature.

**AC3:** Given the migration runs, when it completes, then the `journeys` table has a `product_id UUID REFERENCES products(product_id) ON DELETE SET NULL` column added via `ALTER TABLE journeys ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(product_id) ON DELETE SET NULL`. Existing rows have `product_id = NULL`. Re-running does not error.

**AC4:** Given a product is created with `tenant_id = 'tenant-a'` and a journey is created with `product_id` pointing to that product, when `journeys` is queried filtering by `product_id`, then only journeys associated with that product are returned. A query for `tenant_id = 'tenant-b'` returns no rows from the `products` table for tenant-a.


## Out of Scope

- Product creation API routes or UI — psh-s3.
- Standards management routes — psh-s8.
- Migration of existing journeys to Default product — psh-s2 (separate migration story).
- `product_context_files` table or storage of context file content — product context is stored in the `products` table as JSONB or TEXT columns (implementation detail for psh-s3).
- `standard_product_optouts` junction table — psh-s9 will add this when opt-out is implemented.

## NFRs

- **Idempotency:** All migration statements use `IF NOT EXISTS` or equivalent. Server restart does not error.
- **Data isolation:** `tenant_id` column on `products` and `org_id` on `standards` ensure all query paths include a tenant/org scoping predicate.
- **No new npm dependencies.**

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

Three separate `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE IF NOT EXISTS` statements. Simple schema work but touches the core `journeys` table — FK addition requires care to avoid locking issues on large tables.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic (Medium)
