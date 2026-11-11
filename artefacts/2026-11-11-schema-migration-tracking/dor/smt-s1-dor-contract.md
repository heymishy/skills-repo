# Contract Proposal — Skip already-applied schema migrations on server boot via a tracking table

**What will be built:**
- A new module `src/web-ui/modules/migration-tracker.js` exporting three functions: `hasMigrationRun(pool, name)`, `recordMigrationRun(pool, name)`, and `runMigrationOnce(pool, name, migrationFn)`. `runMigrationOnce` lazily creates a `schema_migrations` table (`name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`), checks whether `name` is already recorded, and only invokes `migrationFn` (and records the result) when it is not.
- Edits to `src/web-ui/server.js`: each of the 14 real `migrate*Schema`/`migrate*Columns` call sites (listed in the story's AC3) is rewrapped as `runMigrationOnce(pool, 'migrateXSchema', function() { return migrateXSchema(pool); })`, preserving every existing chained `.then()`/`.catch()` call exactly as it is today.

**What will NOT be built:**
- No change to the DDL content of any of the 14 migration functions themselves.
- No change to `backfillStandaloneOrganisations` or any other chained backfill/pool-wiring step — these keep running on every boot, unconditionally, exactly as today (AC4).
- `migrateCommentsSchema` and `migrateFeatureEditsSchema` are not wired up — they remain exactly as orphaned as they are today (a separate, logged finding, not this story's problem).
- No rollback/down-migration support.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | UT1-UT3 against a fake pool | Unit |
| AC2 | UT4 + NFR-PERF1 (query-count assertion) | Unit |
| AC3 | IT1 — regex structural check against the real `server.js` source | Integration (structural) |
| AC4 | IT2 — regex structural check confirming the chain shape around `migrateOrganisationsSchema` is preserved | Integration (structural) |
| AC5 | UT5 — fake pool whose `query` always rejects | Unit |
| AC6 | UT6 — structural check on the recorded row's own keys | Unit |

**Assumptions:**
- Each of the 14 call sites' existing Postgres pool variable (mostly `_userRolesPool`, confirmed directly for 7 of the 14; the remainder to be confirmed per-site during implementation) can be passed into `runMigrationOnce` unchanged — no new pool/connection needs provisioning.
- `pool.query` behaves the same (accepts `(sql, params)`, returns `{ rows }`) for every pool used across the 14 call sites — consistent with every existing migration function's own usage.
- No two of the 14 migrations currently race to create the SAME table concurrently at boot (each targets its own distinct table(s)) — `runMigrationOnce`'s own `schema_migrations` bootstrap is the only shared resource, and it uses the same `CREATE TABLE IF NOT EXISTS` idempotency the rest of the codebase already relies on for exactly this reason.

**Estimated touch points:**
Files: `src/web-ui/modules/migration-tracker.js` (new), `src/web-ui/server.js` (edited — 14 call sites)
Services: None new
APIs: None new — internal module only, no HTTP surface
