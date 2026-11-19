## Story: The e2e purge and cleanup scripts clear session history before journeys, so the staging backlog clears and the purge step stops costing 92 s

**Epic reference:** None - short-track (CI speed and data hygiene)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-20-ci-speed/dod/dgn-s1-dod.md` and the diagnosis note section 3. The first real purge log (Staging Deploy run 44592470706) showed the journeys delete failing with `session_turns_journey_id_fkey` in 35 of 35 chunks; about 8,430 of the 8,437 found tenants exist only as journeys rows, so they are found again on every run, the run wastes its 90 s guard (92 s, in each of two serial jobs per deploy), and the backlog grows by about 28 per deploy.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [ci] [staging]

## User Story

As **the operator who waits on staging deploys and keeps staging data tidy**,
I want **the e2e purge and cleanup scripts to delete a journey's session history before the journey**,
So that **the 8,430-tenant backlog is cleared, new test tenants are removed each run, and the two purge steps fall from 92 s to a few seconds, about 3 minutes per deploy**.

## Benefit Linkage

**Metric moved:** the purge step goes from about 92 s (timed out, nothing removed) to a few seconds; tenants found per run goes from about 8,437 to the 14 to 28 the run itself created; `purge journeys errors` in the summary goes from 35 of 35 to 0.
**How:** `purgeTenantsBatch` and `purgeTenant` (`scripts/purge-e2e-tenants.js`), `run` (`scripts/clean-e2e-staging-data.js`), and `deleteJourneyRow` and `deleteProduct` (`scripts/cleanup-e2e-staging-data.js`) clear every table in the shared `JOURNEY_CHILD_TABLES` list (`session_turns`, `artefacts`, added in vdp-s2) before deleting journeys. A guard test fails if any file under `src/` or `scripts/` deletes from `journeys` without handling the listed tables.

## Architecture Constraints

- Change confined to the three scripts above, one new test, deliberate updates to the existing tests that pin their queries (`check-pebd-s1`, `check-alrf-s11`, `check-b3`, `check-tdc-s1`, and the table counts in `check-dgn-s1`), and artefacts. `scripts/` changes go through a pull request.
- **Scope of deletion is unchanged**: the same tenants and journeys the scripts already select (the exact `e2e-test-` prefix rules, the retention window, dry-run defaults) are the only rows affected. The new statements only remove child rows of journeys that the existing statement was already trying to delete.
- Table names are interpolated into SQL only from the frozen `JOURNEY_CHILD_TABLES` list; every other value stays a bound parameter.
- The other nine delete literals in `purgeTenantsBatch` (products through users) stay byte-identical; `artefacts` keeps its existing text. The purge stays non-fatal: errors are still swallowed (and now reported by the dgn-s1 hook), the 90 s guard and the exit code are unchanged.
- The `report` hook and `createPurgeReport` from dgn-s1 are unchanged; the new statement appears as one more table (12 per chunk).
- **Operator go-ahead (2026-11-20, "ok 1 yes and 2 yes")** covers: shipping the purge fix, which will delete the journeys and session history of about 8,430 `e2e-test-` tenants from staging over the next few deploys; and including the two cleanup scripts. It does not cover running either cleanup script with `--confirm` or `--execute`, which the agent will not do.
- No staging or production data is read or changed during development; tests use fake databases.

## Dependencies

- **Upstream:** vdp-s2 (`JOURNEY_CHILD_TABLES` and its guard), dgn-s1 (reporting that will show the result), pebd-s1, alrf-s11, stcs-s1, b3, tdc-s1.
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given a fake database that enforces `session_turns.journey_id` and `artefacts.journey_id` as foreign keys with no cascade, When `purgeTenantsBatch` runs for a chunk where one tenant's journey has session turns, Then that chunk's session turns, artefacts and journeys are all deleted and no error is reported.
**AC2:** Given the same fake, When `purgeTenant` (the single-tenant function) runs, Then it clears the same tables in the same order and the journeys delete succeeds.
**AC3:** Given a recorded chunk, When the statements are listed, Then they are `session_turns`, `artefacts`, `journeys`, then the nine remaining tables in their existing order, and the nine remaining statements and the `artefacts` statement are byte-identical to master's.
**AC4:** Given `scripts/clean-e2e-staging-data.js` run with `confirm: true`, When its statements are recorded, Then it deletes session turns, then artefacts, then journeys for the matched journey ids; without `confirm` it issues no delete.
**AC5:** Given `scripts/cleanup-e2e-staging-data.js`, When `deleteJourneyRow` runs it clears session turns, artefacts, then the journey; and when `deleteProduct` runs it clears the session turns and artefacts of the product's journeys before deleting journeys, then the product.
**AC6:** Given every file under `src/` and `scripts/`, When those containing `DELETE FROM journeys` are scanned, Then each either uses `JOURNEY_CHILD_TABLES` or contains a delete for every table in it, except a short documented allowlist (`scripts/smoke-test-pg.js`, which deletes the one journey row it just inserted); and the scanner reports a fixture file that deletes journeys without the child tables.
**AC7:** Given a child-table delete that fails, When the purge runs, Then it still does not throw and still exits 0, and the report shows the error, and the reporting shows 12 purge tables per chunk.
**AC8 (manual, recorded in the DoD):** Given this change is merged, When the next one to three Staging Deploys run, Then the purge summary shows `purge journeys` with 0 errors, the found count falls toward the 14 to 28 created per run, and the step duration falls from about 92 s to a few seconds; the DoD records the numbers per deploy and says plainly if the guard still fires while the backlog clears.

## Out of Scope

- Running `clean-e2e-staging-data.js` or `cleanup-e2e-staging-data.js` against staging (operator-run, `--confirm` / `--execute`).
- Raising the chunk size (200) or investigating the slow `products` delete (about 1.06 s per chunk); revisit after the backlog is gone and the log shows what remains.
- `session_turns_archive` rows of deleted journeys (no foreign key; harmless).
- The 19 failing E2E smoke specs.
- Lowering or removing the 90 s guard.

## NFRs

- **Safety:** statements are tenant-scoped exactly as before; table names come only from a frozen list.
- **Reliability:** each chunk statement is independent, so progress persists across runs even if the guard fires while the backlog clears.
- **Observability:** the dgn-s1 summary shows per-table timing, rows and errors for the new statement.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
