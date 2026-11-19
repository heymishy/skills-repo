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

## Delivery log: vdp-s2 (2026-11-20)

**Change:** new `src/web-ui/utils/journey-child-tables.js` exporting a frozen `JOURNEY_CHILD_TABLES = [session_turns, artefacts]`. `handleDeleteProduct` (`src/web-ui/routes/products.js`) now deletes from each listed table, then journeys, then the product; `deleteJourney` (`src/web-ui/adapters/journey-store-pg.js`) loops over the same list in the same order. 2 source files changed (CRLF preserved), 1 new module, no schema change, no change to the route response, tenant check or PostHog event.

**Test:** `tests/check-vdp-s2-delete-product-session-turns.js` (T1 to T7, 12 assertions). Red first: 5 passed, 7 failed; T1 failed with the exact staging error (`session_turns_journey_id_fkey`), T3 and T4 pass by design as regression guards. After the change: 12 passed, 0 failed. T6 scans `src/` and `scripts/migrate-schema*.js` for tables that reference journeys, and checks its own scanner against a fixture table so the guard cannot go quiet.

**Regression check:** `check-vdp-s1-delete-product-artefacts.js` (5) and `check-djfk-s1-delete-journey-session-turns.js` (4) pass unchanged; all 111 `tests/check-*.js` files that mention `handleDeleteProduct`, `deleteJourney`, `journey-store-pg`, `DELETE FROM journeys` or `routes/products` pass; `node scripts/review-checklist.js --check` exits 0.

**Not yet verified (AC7):** the staging retry of product `0d47155e-bc8c-4acc-8521-8bbdb5a1ca20`. It needs a merge and a staging deploy, and is the operator's step. To be recorded in the DoD.

**Follow-up (D2):** `scripts/clean-e2e-staging-data.js`, `scripts/cleanup-e2e-staging-data.js` and `scripts/purge-e2e-tenants.js` still omit `session_turns`; the purge script swallows the resulting error.
