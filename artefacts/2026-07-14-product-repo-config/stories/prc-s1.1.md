## Story: Add repo association columns to the products table

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-1-walking-skeleton.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **tenant admin configuring a new product**,
I want to **the product record to store which GitHub repo it's linked to**,
So that **every later write path has somewhere real to resolve a target repo from**.

## Benefit Linkage

**Metric moved:** Metric 2 — Products with a configured repo
**How:** This story creates the actual schema field (`repo_provider`, `repo_owner`, `repo_name`) that Metric 2 measures as non-null.

## Architecture Constraints

ADR-025: tenant scoping stays at the application layer — the `products` table already has a `tenant_id` FK; this migration adds columns to the existing table, not a new per-tenant schema. Follow the existing `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` idempotent migration convention already used in `products.js`/`server.js`.

## Dependencies

- **Upstream:** None
- **Downstream:** prc-s1.2 and prc-s1.3 both require these columns to exist before they can be implemented.

## Acceptance Criteria

**AC1:** Given the `products` table exists without repo columns, When the migration runs, Then `products` gains `repo_provider`, `repo_owner`, `repo_name` columns (all nullable), applied idempotently — safe to run on every server startup, matching the existing `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` pattern.

**AC2:** Given a product created before this migration, When its row is read after the migration runs, Then `repo_provider`/`repo_owner`/`repo_name` are all null — no data loss, no fabricated default value for existing rows.

**AC3:** Given the migration has already been applied once, When the server restarts and the migration runs again, Then no error occurs and no duplicate columns are created.

## Out of Scope

- Populating these columns — that's prc-s1.2.
- Any UI to view or edit them — that's prc-s1.2 and Epic 4.

## NFRs

- **Performance:** None identified — a one-time schema migration.
- **Security:** None identified — no new externally-reachable surface.
- **Accessibility:** Not applicable — no UI.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
