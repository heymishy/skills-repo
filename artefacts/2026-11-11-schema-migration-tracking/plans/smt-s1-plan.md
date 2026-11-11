# Skip already-applied schema migrations on server boot via a tracking table — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in `tests/check-smt-s1-migration-tracker.js` pass. Do not add scope beyond the 6 ACs and the test plan.
**Branch:** `feature/smt-s1`
**Worktree:** `.worktrees/smt-s1`
**Test command:** `node tests/check-smt-s1-migration-tracker.js` (per-file); `node scripts/run-all-tests.js` (full suite)

---

## File map

```
Create:
  src/web-ui/modules/migration-tracker.js   — hasMigrationRun/recordMigrationRun/runMigrationOnce

Modify:
  src/web-ui/server.js   — wrap each of the 14 real migrate*Schema/Columns call sites
                            through runMigrationOnce; preserve every existing
                            .then()/.catch() chain exactly as-is

Already exists (written during /test-plan, not created by this plan):
  tests/check-smt-s1-migration-tracker.js   — 9 tests (UT1-UT6, NFR-PERF1, IT1-IT2)
```

---

## Task 1: Build migration-tracker.js

**Covers:** AC1, AC2, AC5, AC6 (UT1, UT2, UT3, UT4, UT5, UT6, NFR-PERF1)
**Model class:** balanced

**Files:**
- Create: `src/web-ui/modules/migration-tracker.js`
- Test (already exists): `tests/check-smt-s1-migration-tracker.js`

- [ ] **Step 1: Confirm the existing test fails for the right reason**

```bash
node tests/check-smt-s1-migration-tracker.js
```

Expected output: `[FAIL] module load -- Cannot find module '../src/web-ui/modules/migration-tracker'` plus `IT1 (AC3)` failing (14 unwrapped call sites found) — `IT2 (AC4)` passes already (it only checks the existing chain shape, unaffected by this task).

- [ ] **Step 2: Write the implementation**

```javascript
'use strict';
/**
 * src/web-ui/modules/migration-tracker.js — smt-s1
 *
 * Skips a migration's own DDL once it has already been applied, instead of
 * re-running CREATE TABLE/ALTER TABLE on every boot. No new npm dependency —
 * uses the same pool.query(sql, params) convention every other migration in
 * this codebase already uses.
 */

async function ensureTable(pool) {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (' +
    'name TEXT PRIMARY KEY, ' +
    'applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' +
    ')'
  );
}

async function hasMigrationRun(pool, name) {
  await ensureTable(pool);
  const result = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
  return result.rows.length > 0;
}

async function recordMigrationRun(pool, name) {
  await ensureTable(pool);
  await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
}

async function runMigrationOnce(pool, name, migrationFn) {
  const alreadyRun = await hasMigrationRun(pool, name);
  if (alreadyRun) {
    return;
  }
  await migrationFn();
  await recordMigrationRun(pool, name);
}

module.exports = { hasMigrationRun, recordMigrationRun, runMigrationOnce };
```

- [ ] **Step 3: Run the test file — unit tests must now pass**

```bash
node tests/check-smt-s1-migration-tracker.js
```

Expected output: `UT1` through `UT6` and `NFR-PERF1` all `[PASS]`. `IT1 (AC3)` still fails (server.js not yet wired — that's Task 2). `IT2 (AC4)` still passes.

- [ ] **Step 4: Run the full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same 4 pre-existing baseline failures as before this story started, plus `tests/check-smt-s1-migration-tracker.js` (now failing only on IT1, not on module-load) — no other file newly broken.

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/modules/migration-tracker.js
git commit -m "feat(smt-s1): add migration-tracker module for skip-if-already-applied DDL"
```

---

## Task 2: Wire the 14 real call sites in server.js through runMigrationOnce

**Covers:** AC3, AC4 (IT1, IT2)
**Model class:** balanced

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Confirm the existing test fails for the right reason**

```bash
node tests/check-smt-s1-migration-tracker.js
```

Expected output: `IT1 (AC3)` fails, listing all 14 function names as unwrapped. All other tests pass (from Task 1).

- [ ] **Step 2: Write the implementation**

Import `runMigrationOnce` near the top of `src/web-ui/server.js`, alongside the other `require('./modules/...')` lines:

```javascript
const { runMigrationOnce } = require('./modules/migration-tracker');
```

For each of the 14 call sites, replace the direct call with a `runMigrationOnce`-wrapped call, preserving every existing `.then()`/`.catch()` chain exactly. Example (the simplest case, `migratePodsSchema`):

```javascript
// Before:
migratePodsSchema(_userRolesPool).then(function() {
  console.log('[ep1-s1] pods/pod_members schema ready');
}).catch(function(err) { console.error('[ep1-s1] pods schema migration failed:', err.message); });

// After:
runMigrationOnce(_userRolesPool, 'migratePodsSchema', function() { return migratePodsSchema(_userRolesPool); }).then(function() {
  console.log('[ep1-s1] pods/pod_members schema ready');
}).catch(function(err) { console.error('[ep1-s1] pods schema migration failed:', err.message); });
```

Apply the same pattern to all 14: `migrateTeamSchema`, `migrateIdentityLinksSchema`, `migrateOrganisationsSchema`, `migrateTenantAdminBootstrapSchema`, `migratePodsSchema`, `migratePodAssignmentsSchema`, `migrateFeatureCollaboratorsSchema`, `migrateFeatureCollaboratorRemovalsSchema`, `migrateAgencyClientGrantsSchema`, `migrateArtefactCommentsSchema`, `migrateClientInvitationsSchema`, `migrateClientLoginTokensSchema`, `migrateProductRepoColumns`, `migrateTeamInvitationsSchema`.

For chained cases (e.g. `migrateTeamSchema` → `migrateIdentityLinksSchema`, and `migrateOrganisationsSchema` → `backfillStandaloneOrganisations` → pool wiring), wrap only the schema-migration call itself — every `.then()` step after it stays exactly as it is, unwrapped, so it keeps running on every boot (AC4).

- [ ] **Step 3: Run the test file — all 9 tests must now pass**

```bash
node tests/check-smt-s1-migration-tracker.js
```

Expected output: `[smt-s1] Results: 9 passed, 0 failed`

- [ ] **Step 4: Run the full suite — no regressions, and confirm the baseline entry can be removed**

```bash
node scripts/run-all-tests.js
```

Expected output: same 4 pre-existing baseline failures as before this story started; `tests/check-smt-s1-migration-tracker.js` no longer in the failed list.

- [ ] **Step 5: Remove the now-stale baseline entries**

`tests/check-smt-s1-migration-tracker.js` now passes for real — remove it from `tests/known-baseline-failures.json`'s `files` array and from `artefacts/2026-07-16-baseline-test-triage/triage-report.md`'s Deferred table (the row added 2026-11-11), per both files' own stated convention ("remove this entry once the inner loop implements migration-tracker.js and the test file passes for real").

```bash
node tests/check-tst-s1-baseline-triage.js
```

Expected output: all checks pass (confirms the removal kept both files consistent).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/known-baseline-failures.json artefacts/2026-07-16-baseline-test-triage/triage-report.md
git commit -m "feat(smt-s1): wire 14 migration call sites through runMigrationOnce"
```
