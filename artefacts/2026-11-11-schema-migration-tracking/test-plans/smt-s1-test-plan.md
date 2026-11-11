## Test Plan: Skip already-applied schema migrations on server boot via a tracking table

**Story reference:** `artefacts/2026-11-11-schema-migration-tracking/stories/smt-s1-schema-migration-tracking-table.md`
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (Copilot)
**Date:** 2026-11-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Cold run: migration runs, gets recorded | 3 (UT1, UT2, UT3) | — | — | — | — | 🟢 |
| AC2 | Warm run: migration is skipped, not re-invoked | 1 (UT4) + 1 NFR (NFR-PERF1) | — | — | — | — | 🟢 |
| AC3 | All 14 real call sites in `server.js` wrapped | — | 1 (IT1) | — | — | — | 🟢 |
| AC4 | Chained backfill/wiring steps unaffected by a skip | — | 1 (IT2) | — | 1 (post-merge boot-log check) | External-dependency | 🟡 |
| AC5 | Tracker failure propagates, doesn't crash boot | 1 (UT5) | — | — | — | — | 🟢 |
| AC6 | No `tenant_id` column, no per-tenant rows | 1 (UT6) | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in the unit harness | Handling |
|-----|----|----------|--------------------------|---------|
| Confirming the chained backfill/wiring steps actually run correctly against a *real* Postgres instance, not the in-memory fake pool | AC4 | External-dependency | The fake pool simulates SQL shape, not real Postgres transaction/constraint behaviour; a real `FOREIGN KEY`/`UNIQUE` interaction could theoretically surface only against real Postgres | Manual post-merge boot-log check (staging) — see AC verification script, Edge case 1 |

---

## Test Data Strategy

**Source:** Mocked (in-memory fake `pg`-Pool-shaped object, matching the established repo convention in `tests/check-ep1-s1-pod-creation.js`'s `makeFakePool()`)
**PCI/sensitivity in scope:** No — the `schema_migrations` table holds only migration names and timestamps, no tenant or user data (AC6)
**Availability:** Available now — no real Postgres connection or seed data required for any test in this plan
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1-AC6 | A fake pool object with an in-memory `migrations` array standing in for the `schema_migrations` table | Mocked, generated in test setup | None | See `makeFakePool()` in `tests/check-smt-s1-migration-tracker.js` |
| AC3-AC4 | The real, current text of `src/web-ui/server.js` | Repo source file, read directly | None | Structural/regex checks, not live execution — `server.js` is a full app entry point, not unit-testable in isolation (established convention: migration functions are tested via their own modules, never by booting `server.js`) |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### UT1 — hasMigrationRun returns false for an unseen migration

- **Verifies:** AC1
- **Precondition:** Fake pool with an empty `migrations` array; `schema_migrations` table does not exist yet
- **Action:** Call `hasMigrationRun(pool, 'migrateFooSchema')`
- **Expected result:** Returns `false`
- **Edge case:** No

### UT2 — recordMigrationRun writes a row that hasMigrationRun then finds

- **Verifies:** AC1
- **Precondition:** Fake pool, empty migrations array
- **Action:** Call `recordMigrationRun(pool, 'migrateFooSchema')`, then `hasMigrationRun(pool, 'migrateFooSchema')`
- **Expected result:** Second call returns `true`
- **Edge case:** No

### UT3 — runMigrationOnce invokes the supplied function on a cold run and records it

- **Verifies:** AC1
- **Precondition:** Fake pool, empty migrations array
- **Action:** Call `runMigrationOnce(pool, 'migrateFooSchema', migrationFn)`
- **Expected result:** `migrationFn` is called exactly once; `hasMigrationRun` afterward returns `true`
- **Edge case:** No

### UT4 — runMigrationOnce does not re-invoke an already-recorded migration

- **Verifies:** AC2
- **Precondition:** Fake pool; `runMigrationOnce` already called once for `migrateFooSchema`
- **Action:** Call `runMigrationOnce(pool, 'migrateFooSchema', migrationFn)` a second time
- **Expected result:** `migrationFn`'s total call count remains 1 (not invoked the second time)
- **Edge case:** Yes — this is the core "warm boot" behaviour the whole story exists to deliver

### UT5 — a tracker failure propagates unchanged to the caller

- **Verifies:** AC5
- **Precondition:** A pool whose `query` always rejects (simulated connection failure)
- **Action:** Call `runMigrationOnce(pool, 'migrateFooSchema', migrationFn)`
- **Expected result:** The call rejects with the original error message, unmodified — not swallowed, not replaced with a different error
- **Edge case:** Yes — this is what lets every existing per-call-site `.catch()` in `server.js` keep working unchanged

### UT6 — the tracking table carries no tenant data

- **Verifies:** AC6
- **Precondition:** Fake pool, a migration recorded via `runMigrationOnce`
- **Action:** Inspect the recorded row's own keys
- **Expected result:** Keys are exactly `['applied_at', 'name']` — no `tenant_id` or any other field
- **Edge case:** No

---

## Integration Tests

### IT1 — all 14 real call sites are wrapped

- **Verifies:** AC3
- **Components involved:** `src/web-ui/server.js` (read as source text, not executed)
- **Precondition:** The 14 confirmed `migrate*Schema`/`migrate*Columns` function names (listed in the story's AC3)
- **Action:** Regex-scan `server.js` for each function name used as a direct, unwrapped call vs. a call passed through `runMigrationOnce(...)`
- **Expected result:** Zero direct/unwrapped call sites remain for any of the 14

### IT2 — chained backfill/wiring survives a skip

- **Verifies:** AC4
- **Components involved:** `src/web-ui/server.js`'s `migrateOrganisationsSchema` chain specifically (the clearest example with both a backfill and a pool-wiring step)
- **Precondition:** The text of `server.js` around the `migrateOrganisationsSchema` reference
- **Action:** Confirm `backfillStandaloneOrganisations` and `setOrganisationsPool` still appear within the same chain, after the (now `runMigrationOnce`-wrapped) migration call
- **Expected result:** Both chained calls remain present and in the same relative position

---

## NFR Tests

### NFR-PERF1 — a warm boot issues one query, not a full DDL re-run

- **NFR addressed:** Performance
- **Measurement method:** Count `pool.query` calls issued by `runMigrationOnce` on a warm run (migration already recorded) vs. a cold run
- **Pass threshold:** Exactly 1 query call on a warm run (the existence check only); 0 DDL-shaped calls issued during that run
- **Tool:** Custom assert-based test harness (`tests/check-smt-s1-migration-tracker.js`), matching this repo's established convention (no Jest/mocha in this codebase)

### NFR-SEC1 — no tenant data in the tracking table

- **NFR addressed:** Security
- **Measurement method:** UT6 (structural check on recorded row shape)
- **Pass threshold:** Zero tenant-identifying fields ever present
- **Tool:** Custom assert-based test harness

### NFR-AVAIL1 — a tracker failure never crashes boot

- **NFR addressed:** Availability
- **Measurement method:** UT5 (failure-propagation check) plus a manual post-merge log check (see verification script) confirming the existing `.catch()` log line still appears if a migration is simulated to fail
- **Pass threshold:** Boot process completes (does not crash) even when a tracker query throws
- **Tool:** Custom assert-based test harness + manual staging smoke check

---

## Out of Scope for This Test Plan

- Testing against a real Postgres instance — all tests use the established in-memory fake-pool convention (see Coverage gaps above for the one manual follow-up this implies).
- `migrateCommentsSchema`/`migrateFeatureEditsSchema` wiring — out of scope for the story itself (see story's Out of Scope section); not tested here either.
- Load-testing actual boot-time wall-clock improvement in production — NFR-PERF1 measures query-count reduction as a reliable proxy instead.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real-Postgres behaviour under concurrent boot (e.g. two processes racing to create `schema_migrations` for the first time) | Not exercisable against the in-memory fake pool; this codebase's existing `CREATE TABLE IF NOT EXISTS` pattern already assumes single-boot-at-a-time semantics, same assumption carried forward here | Accepted — matches the existing risk profile of every other migration in this codebase today; not a new risk introduced by this story |
