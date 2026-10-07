## Story: Rename the feature's journeys/journey_stages tables to customer_journeys/customer_journey_stages to avoid a collision with the platform's own pre-existing journeys table
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/database-migration-and-tenant-isolation-hardening.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As an **operator relying on this feature's own database migration actually creating usable tables**,
I want **the migration to use table names that do not collide with any pre-existing table**,
So that **the schema this feature depends on actually gets created in every real environment, not silently skipped**.
## Benefit Linkage
M1 — Journey adoption — a migration that silently no-ops means `journeys` (as designed) never exists, so no downstream story (route handler, UI) can ever work against real data; this is a correctness prerequisite for M1, not a feature of its own.
## Architecture Constraints
**Root cause (confirmed by direct code read, 2026-10-08):** `src/web-ui/adapters/journey-store-pg.js` already creates and owns a table literally named `journeys` — the platform's own outer-loop session persistence layer (`journey_id VARCHAR PRIMARY KEY, tenant_id, owner_id, feature_slug, created_at, data JSONB`), wired via `migrateSchema()` called on every server boot (`src/web-ui/server.js:421`) whenever `DATABASE_URL` is set. `ep5-s1`'s own migration (merged, PR #954) used `CREATE TABLE IF NOT EXISTS journeys (id UUID PRIMARY KEY, tenant_id, name, description, product_id, created_at, updated_at)` — a completely different, incompatible shape under the identical table name. `CREATE TABLE IF NOT EXISTS` is a true no-op when the table already exists, regardless of whether its existing shape matches what's being requested — so in every real environment (the platform's own `journeys` table is created on every boot), `ep5-s1`'s intended schema never actually gets created. Every downstream customer-journey story's own SQL (inserts referencing `id`/`name`/`description`, FKs from `journey_stages.journey_id` → `journeys(id)`) would fail or behave incorrectly against the platform's real table shape.
**Fix:** rename the feature's own 3 tables to a non-colliding, feature-specific prefix: `journeys` → `customer_journeys`, `journey_stages` → `customer_journey_stages`, `feature_journey_stage_mappings` → `feature_customer_journey_stage_mappings` (renamed for naming consistency even though it did not itself collide with anything). Update the migration script, its test file, and every artefact (`design.md`, `benefit-metric.md`, and the story files that reference the literal SQL table/column identifiers) to match. English prose uses of "journey"/"journeys" as a concept (not a SQL identifier) are left unchanged.
**Confirmed no other collision:** `journey_stages` and `feature_journey_stage_mappings` were grep-checked against the whole `src/web-ui` tree and have zero pre-existing references outside this feature's own new files.
## Dependencies
ep5-s1 (merged — this story corrects it)
## Acceptance Criteria
Given `scripts/migrate-schema-journeys.js` is run against a Postgres database that already has the platform's own `journeys` table (the realistic case in every real environment),
When the migration completes,
Then a `customer_journeys` table exists with the schema `ep5-s1` originally specified (just under the new name), and the platform's own pre-existing `journeys` table is completely untouched.

Given the migration is run,
When it completes,
Then `customer_journey_stages` and `feature_customer_journey_stage_mappings` exist with their own `ep5-s1`-specified columns, FK constraints (with cascade delete), and named indexes, all referencing the renamed tables correctly.

Given the migration is run twice,
When the second run completes,
Then it is still idempotent — no error, no duplicate schema objects — exactly as `ep5-s1` already verified, just against the new names.

Given `artefacts/2026-10-05-customer-journey-as-first-class/design.md`, `benefit-metric.md`, and every story file's own literal SQL table/column references,
When they are reviewed,
Then every reference to the old `journeys`/`journey_stages`/`feature_journey_stage_mappings` table/FK identifiers is updated to the new names, while prose uses of "journey"/"journeys" as a concept are left unchanged.
## Out of Scope
Any change to the platform's own `journeys` table (`journey-store-pg.js`) — it is correct and unrelated; this story works around it, not with it. Any change to route handlers or UI — none have been implemented yet, so there is nothing else to update.
## NFRs
Same as `ep5-s1`: idempotent (`CREATE TABLE/INDEX IF NOT EXISTS`), no new npm runtime dependencies, tenant-scoped columns on all 3 tables.
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
