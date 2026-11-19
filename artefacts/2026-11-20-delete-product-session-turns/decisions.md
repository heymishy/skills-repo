# Decisions: delete product with session history

## D1. One shared list of tables that reference journeys, guarded by a test (2026-11-20)

**Context:** deleting a product failed on `session_turns_journey_id_fkey`; the same defect had already been fixed for artefacts (vdp-s1) and for single-journey delete (djfk-s1), each time by adding only the table that had just failed.
**Decision:** a frozen `JOURNEY_CHILD_TABLES` list in `src/web-ui/utils/journey-child-tables.js`, used by both `handleDeleteProduct` and `deleteJourney`, plus a test that scans `src/` and `scripts/migrate-schema*.js` for `CREATE TABLE` statements that `REFERENCES journeys(` and fails if one is not in the list.
**Rationale:** the failure repeats because the knowledge "which tables hold journey rows" lives in two hand-written queries. One list plus an automated check turns a production foreign-key error into a failing test when the new table is added.
**Alternatives rejected:** `ON DELETE CASCADE` on the foreign keys (a schema migration on production data, a larger and riskier change, and it would hide deletes that are currently explicit and assertable); only adding `session_turns` to the product delete (the third instance of the same bug waiting to happen).

## D2. Cleanup scripts are a follow-up, not part of this story (2026-11-20)

**Context:** `scripts/clean-e2e-staging-data.js` (lines 52 to 53), `scripts/cleanup-e2e-staging-data.js` (lines 123 to 124 and 182) and `scripts/purge-e2e-tenants.js` (lines 81 to 84 and 116 to 119) delete `artefacts` and `journeys` but not `session_turns`; the purge script ends the journeys delete with `.catch(() => {})`, which swallows the foreign key error.
**Decision:** do not change them here; record them for a follow-up story.
**Rationale:** they delete staging data and one runs on a schedule, so changing what they remove deserves its own review. The purge script's swallowed error probably explains leftover staging test data and may be related to the 92 s purge step measured in `artefacts/2026-11-20-ci-speed/` (not yet confirmed).
