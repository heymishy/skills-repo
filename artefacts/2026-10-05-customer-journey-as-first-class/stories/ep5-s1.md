## Story: Database migration: create journeys, journey_stages, and feature_journey_stage_mappings tables
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/database-migration-and-tenant-isolation-hardening.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Outer loop practitioner (PO / SME / discovery lead)**,
I want **tenant-scoped storage, I need a Postgres migration script that creates the three new tables with all required columns, constraints, and indexes**,
So that **the journey canvas has durable**.
## Benefit Linkage
M1 — Journey adoption — without the migration, no journey records can be created and M1 cannot be measured.
## Architecture Constraints
Migration follows existing `migrate-schema-*.js` naming convention. ADR-025 — all three tables include `tenant_id` column. No new npm runtime dependencies.
## Dependencies
None
## Acceptance Criteria
Given the migration script is run against a Postgres database,
When the migration completes,
Then the `journeys` table exists with columns: `id` (UUID PK), `tenant_id` (text, not null), `name` (text, not null), `description` (text, nullable), `product_id` (UUID, nullable, FK → products), `created_at` (timestamptz), `updated_at` (timestamptz).

Given the migration script is run,
When the migration completes,
Then the `journey_stages` table exists with all columns from the design artefact: `id`, `journey_id`, `tenant_id`, `name`, `position`, `description`, `customer_actions`, `touchpoints`, `channel`, `emotion`, `pain_points`, `opportunities`, `moment_of_truth`, `created_at`, `updated_at`.

Given the migration script is run,
When the migration completes,
Then the `feature_journey_stage_mappings` table exists with columns: `id`, `journey_stage_id`, `journey_id`, `tenant_id`, `feature_slug`, `metric_keys` (JSONB, default `[]`), `created_at`.

Given the migration is run on a database that already has data,
When the migration completes,
Then existing data is unaffected and the migration is idempotent (safe to run twice without error).

Given the migration script is run,
When the migration completes,
Then indexes exist on: `journeys(tenant_id)`, `journey_stages(journey_id)`, `journey_stages(tenant_id)`, `feature_journey_stage_mappings(journey_stage_id)`, `feature_journey_stage_mappings(tenant_id)`.
## Out of Scope
Seed data, rollback script, migration for future columns not in MVP scope.
## NFRs
Follows `migrate-schema-*.js` naming convention. Idempotent. No new npm runtime dependencies.
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
