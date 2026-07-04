## Migration Story: psh-s2 — Existing journey migration to Default product

**Type:** Data migration
**Epic reference:** artefacts/2026-07-05-product-stds-hierarchy/epics/psh-e1-product-data-model.md
**Discovery reference:** artefacts/2026-07-05-product-stds-hierarchy/discovery.md
**Benefit-metric reference:** artefacts/2026-07-05-product-stds-hierarchy/benefit-metric.md

## Migration Purpose

Assign all existing journeys (created before psh-s1 shipped) to a "Default" product per org (tenantId). After psh-s1 adds `journeys.product_id`, all existing rows have `product_id = NULL`. This migration creates one Default product per tenantId and back-fills `product_id` on all unassociated journeys. Operators see their existing work under "Default product" immediately after migration and can move features to new products at any time.

## Benefit Linkage

**Metric moved:** M1 (Product setup completion rate) — prerequisite: existing users must have a product before the product-aware dashboard (psh-s4) can show them features. Without this migration, existing users have NULL product_id journeys and the new dashboard cannot display them. M2 (Context injection rate) — the Default product initially has empty context files; context injection for migrated journeys returns empty sections, which is correct and not an injection failure.

## Architecture Constraints

- **ADR-011 (artefact-first):** This story artefact exists before any migration script is written.
- **Node.js CommonJS only:** Migration script is plain Node.js using existing `pg` pool.
- **No new npm dependencies.**
- **Idempotency required:** Re-running the migration must not create duplicate Default products or re-assign journeys that already have a product_id set (by any post-psh-s1 action).

## Dependencies

- **Upstream:** psh-s1 — `products` table and `journeys.product_id` column must exist.
- **Downstream:** psh-s3, psh-s4 — creation flow and navigation depend on all journeys having a product_id.

## Migration Steps

1. Query distinct `tenant_id` values from `journeys` where `product_id IS NULL`.
2. For each such `tenant_id`:
   - Check if a product named "Default" already exists for that tenant (`SELECT product_id FROM products WHERE tenant_id = $1 AND name = 'Default'`).
   - If not: insert a new product row with `name = 'Default'`, `description = 'Auto-created default product — migrate your features to named products when ready.'`, `created_by = 'migration'`, `tenant_id = tenant_id`.
3. For all journeys where `product_id IS NULL`:
   - `UPDATE journeys SET product_id = (SELECT product_id FROM products WHERE tenant_id = journeys.tenant_id AND name = 'Default' LIMIT 1) WHERE product_id IS NULL`.

## Acceptance Criteria

**AC1:** Given the migration script runs on a database with existing journeys (product_id IS NULL for tenants A and B), when it completes, then: (a) exactly one product with name "Default" exists for tenant A and one for tenant B; (b) all journeys for tenant A have their product_id set to tenant A's Default product; (c) all journeys for tenant B have their product_id set to tenant B's Default product.

**AC2:** Given the migration script is run twice (re-entrant), when the second run completes, then no duplicate "Default" products are created for any tenant_id, and no journey has its product_id changed by the second run.

**AC3:** Given a tenant_id has no journeys with product_id IS NULL (either no journeys or all already assigned), when the migration runs, then no new Default product is created for that tenant_id.

**AC4:** Given a journey already has a product_id set (assigned after psh-s1 deployed, before this migration ran), when the migration runs, then that journey's product_id is not overwritten.

**AC5:** Given the migration runs successfully, when the script exits, then it logs a summary: count of Default products created, count of journeys updated, and count of tenants processed. No uncaught promise rejections or partial-commit states.

## Rollback Plan

The migration is additive and non-destructive:
- Default products can be deleted (cascading SET NULL on journeys.product_id).
- Journeys can have product_id reset to NULL via a reverse script.
- No data is deleted or overwritten. Rollback: `UPDATE journeys SET product_id = NULL WHERE product_id IN (SELECT product_id FROM products WHERE name = 'Default' AND created_by = 'migration')` then `DELETE FROM products WHERE name = 'Default' AND created_by = 'migration'`.

## Out of Scope

- Migration of product context files — Default product has empty context files by design.
- Migration of standards — no standards existed before this feature.
- Any UI changes — this is a data migration only.

## NFRs

- **Idempotency:** Running the migration multiple times produces the same result as running it once.
- **No data loss:** Existing journey data (turns, stages, completed stages) is untouched.
- **Execution time:** Migration is expected to complete in < 30 seconds on a database with < 10,000 journeys.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

Simple INSERT + UPDATE migration. The re-entrancy check (AC2) and the no-overwrite guard (AC4) require careful SQL, but the overall logic is well-defined.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Migration steps are clearly defined
- [ ] Rollback plan is documented
- [ ] Idempotency is an explicit AC
- [ ] Benefit linkage is written
- [ ] Complexity rated
- [ ] Upstream dependency (psh-s1) confirmed complete
