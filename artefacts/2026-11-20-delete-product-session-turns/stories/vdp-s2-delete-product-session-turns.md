## Story: Deleting a product also clears its journeys' session history, and a test fails when a new table that references journeys is not cleared

**Epic reference:** None - short-track (bug fix)
**Discovery reference:** None - short-track skips discovery. Evidence: staging log, 2026-11-19 17:40:24 UTC, `DELETE /products/0d47155e-bc8c-4acc-8521-8bbdb5a1ca20` failed in `handleDeleteProduct` (`src/web-ui/routes/products.js:3441`) with `update or delete on table "journeys" violates foreign key constraint "session_turns_journey_id_fkey" on table "session_turns"`. This is the same defect as `vdp-s1` (artefacts) and `djfk-s1` (session turns when deleting one journey), fixed in one delete path each time and by naming only the table that had just failed.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui] [data]

## User Story

As **a product owner using wuce**,
I want **to delete a product whose journeys have session history**,
So that **a product with real use can be removed, and the next table that references journeys cannot silently break deletion a third time**.

## Benefit Linkage

**Metric moved:** `DELETE /products/:id` on a product whose journeys have session turns goes from failing with a foreign key error (every attempt) to answering 200.
**How:** the product delete clears every table that references `journeys` before deleting the journeys, using one shared list (`JOURNEY_CHILD_TABLES`) that `deleteJourney` also uses. A test reads the schema sources and fails if a table references `journeys` but is not in the list.

## Architecture Constraints

- Change confined to one new module `src/web-ui/utils/journey-child-tables.js`, `src/web-ui/routes/products.js` (`handleDeleteProduct`), `src/web-ui/adapters/journey-store-pg.js` (`deleteJourney`), one new test and artefacts. Source changes go through a pull request.
- Table names come only from the constant list, never from request data; they are the only text interpolated into the SQL, and the list is frozen.
- Order stays: every child table, then `journeys`, then `products`. `deleteJourney` keeps its current order (`session_turns`, then `artefacts`, then `journeys`).
- Tenant check, 404 behaviour, the PostHog `product_deleted` event and the response shape are unchanged.
- The cleanup scripts (`scripts/clean-e2e-staging-data.js`, `cleanup-e2e-staging-data.js`, `purge-e2e-tenants.js`) have the same gap but delete staging data; they are not changed here (see Out of Scope).
- `session_turns_archive` has no foreign key to `journeys`, so it is not part of the list.

## Dependencies

- **Upstream:** vdp-s1 (artefacts), djfk-s1 (session turns on single-journey delete).
- **Downstream:** a follow-up for the cleanup scripts.

## Acceptance Criteria

**AC1:** Given a product whose journey has session turns and artefacts, When `handleDeleteProduct` runs against a pool that enforces both foreign keys, Then it answers 200 with no foreign key error and the session turns, artefacts, journeys and product are all deleted.
**AC2:** Given the same product, When the queries are recorded, Then every child-table delete is issued before the journeys delete, and the journeys delete before the products delete.
**AC3:** Given a product owned by another tenant, When `handleDeleteProduct` runs, Then it answers 404 and issues no delete.
**AC4:** Given a product with no journeys, When `handleDeleteProduct` runs, Then the product is deleted and it answers 200.
**AC5:** Given a journey with session turns and artefacts, When `deleteJourney` runs, Then it clears the same shared list in the same order (`session_turns`, `artefacts`) and then deletes the journey.
**AC6:** Given the schema sources (`src/` and `scripts/migrate-schema*.js`), When every `CREATE TABLE` with a `REFERENCES journeys(` is found, Then each such table is in `JOURNEY_CHILD_TABLES`, and `JOURNEY_CHILD_TABLES` is frozen.
**AC7 (manual, recorded in the DoD):** Given this change is merged and deployed to staging, When the operator retries deleting product `0d47155e-bc8c-4acc-8521-8bbdb5a1ca20` from the UI, Then it succeeds. The agent does not delete staging data.

## Out of Scope

- The three cleanup scripts and their `.catch(() => {})` on the journeys delete (`purge-e2e-tenants.js` lines 84 and 119 swallow this exact error): follow-up, because they change what is deleted from staging.
- Deleting rows from `session_turns_archive` for a deleted journey (no foreign key; orphaned rows are harmless).
- Wrapping the deletes in a transaction (a larger change to the pool usage; noted in decisions).

## NFRs

- **Safety:** SQL text is built only from a frozen constant list; parameters stay bound.
- **Reliability:** tests use a pool that models the real foreign keys; no database or network.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
