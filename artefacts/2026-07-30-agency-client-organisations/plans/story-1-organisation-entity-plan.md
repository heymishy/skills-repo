# Organisation exists as a first-class entity with an org_type — Implementation Plan

> **For agent execution:** Executed directly via /tdd (single coding-agent session — no
> parallel subagent dispatch used for this story; see /subagent-execution SKILL.md's
> "if no subagents available, use /tdd task-by-task instead").

**Goal:** Add an `organisations` table (org_id PK, name, org_type, created_at), a
resolution step invoked at OAuth callback that looks up or creates a `standalone`
organisation for the session's tenantId, and a one-time backfill for pre-existing
tenants — purely additive, no UI, no route.
**Branch:** `feature/story-1-organisation-entity`
**Worktree:** current worktree (already created)
**Test command:** `node tests/check-story1-organisation-entity.js` (single file), `node scripts/run-all-tests.js` (full suite)

---

## File map

```
Create:
  src/web-ui/modules/organisations.js          — schema migration, resolve-or-create, backfill (pool passed as explicit arg — no D37 adapter needed per DoR H-ADAPTER)
  tests/check-story1-organisation-entity.js     — all 8 tests from the test plan (3 unit, 2 integration, 3 NFR)

Modify:
  src/web-ui/routes/auth.js   — wire resolveOrganisationForTenant(pool, req.session.tenantId) as a fire-and-forget, try/catch-wrapped call after tenantId is set in handleAuthCallback and handleAuthGoogleCallback (mirrors _grantFreeTierCredits's existing placement/pattern)
  src/web-ui/server.js        — call migrateOrganisationsSchema(pool) and backfillStandaloneOrganisations(pool, tenantIds, logger) once at startup, inside the existing DATABASE_URL block, alongside the other migrateSchema()/migrateTeamSchema() calls; pass the pool reference into auth.js (module-level pool, mirroring how _userRolesPool is created and used in that same block)
```

---

## Task 1: `organisations` table migration (AC1)

**Files:**
- Create: `src/web-ui/modules/organisations.js`
- Test: `tests/check-story1-organisation-entity.js` (T1)

- [x] **Step 1: Write the failing test**

```js
// T1 -- createsOrganisationsTableWithCorrectColumns (AC1)
var organisations = freshRequire(ORGANISATIONS_PATH);
var pool = makeFakePool();
await organisations.migrateOrganisationsSchema(pool);
var calls = pool._state().createTableCalls;
var orgCall = calls.find(function(c) { return c.indexOf('CREATE TABLE IF NOT EXISTS ORGANISATIONS') === 0; });
assert.ok(orgCall, 'Expected a CREATE TABLE IF NOT EXISTS organisations statement');
['ORG_ID', 'NAME', 'ORG_TYPE', 'CREATED_AT', 'PRIMARY KEY'].forEach(function(col) {
  assert.ok(orgCall.indexOf(col) !== -1, 'organisations shape must include ' + col);
});
// Idempotent rerun
await organisations.migrateOrganisationsSchema(pool);
```

- [x] **Step 2: Run test — must fail** (module does not exist yet)

Expected output: `Cannot find module '.../organisations.js'`

- [x] **Step 3: Write minimal implementation**

```js
'use strict';
// organisations.js — organisation entity module (story-1-organisation-entity).
// Mirrors user-roles.js's migrateTeamSchema precedent: pool passed as an explicit
// function argument (no D37 setX() adapter — DoR H-ADAPTER confirms this story's
// table lookup uses the existing DB pool directly, not a swappable integration).

var _defaultLogger = { info: function(msg) { console.log(msg); } };

async function migrateOrganisationsSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS organisations (
      org_id     VARCHAR     PRIMARY KEY,
      name       VARCHAR,
      org_type   VARCHAR     NOT NULL DEFAULT 'standalone',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

module.exports = { migrateOrganisationsSchema };
```

- [x] **Step 4: Run test — must pass**

Expected output: `[PASS] createsOrganisationsTableWithCorrectColumns`

- [x] **Step 5: Run full suite — no regressions** — `node scripts/run-all-tests.js`
- [x] **Step 6: Commit** — `git commit -m "feat(story-1): add organisations table migration (AC1)"`

---

## Task 2: resolve-or-create + backfill (AC2, AC3)

**Files:**
- Modify: `src/web-ui/modules/organisations.js`
- Test: `tests/check-story1-organisation-entity.js` (T2, T3)

- [x] **Step 1: Write failing tests** — `resolvesOrgTypeStandaloneForNewSignupNoAllowlistMatch` (calls `resolveOrganisationForTenant` twice, expects one row created, `org_type='standalone'`, second call returns same row) and `resolvesOrgTypeStandaloneForBackfilledTenant` (calls `backfillStandaloneOrganisations` with a list of pre-existing tenantIds, expects rows created only for tenants with no existing row, idempotent on rerun).

- [x] **Step 2: Run — must fail** (`resolveOrganisationForTenant is not a function`)

- [x] **Step 3: Write minimal implementation**

```js
async function resolveOrganisationForTenant(pool, tenantId, logger) {
  var log = logger || _defaultLogger;
  var existing = await pool.query('SELECT org_id, name, org_type, created_at FROM organisations WHERE org_id = $1', [tenantId]);
  if (existing.rows.length) return existing.rows[0];

  var inserted = await pool.query(
    'INSERT INTO organisations (org_id, name, org_type) VALUES ($1, $2, $3) ON CONFLICT (org_id) DO NOTHING RETURNING org_id, name, org_type, created_at',
    [tenantId, tenantId, 'standalone']
  );
  if (inserted.rows.length) {
    log.info(JSON.stringify({ event: 'organisation_created', tenant_id: tenantId, org_type: 'standalone', timestamp: new Date().toISOString() }));
    return inserted.rows[0];
  }
  // Lost the insert race to a concurrent caller -- re-select (still idempotent, still exactly one row).
  var reread = await pool.query('SELECT org_id, name, org_type, created_at FROM organisations WHERE org_id = $1', [tenantId]);
  return reread.rows[0];
}

async function backfillStandaloneOrganisations(pool, tenantIds, logger) {
  var createdCount = 0;
  for (var i = 0; i < (tenantIds || []).length; i++) {
    var tenantId = tenantIds[i];
    var existing = await pool.query('SELECT 1 FROM organisations WHERE org_id = $1', [tenantId]);
    if (existing.rows.length) continue;
    await resolveOrganisationForTenant(pool, tenantId, logger);
    createdCount++;
  }
  return createdCount;
}

module.exports = { migrateOrganisationsSchema, resolveOrganisationForTenant, backfillStandaloneOrganisations };
```

- [x] **Step 4: Run — must pass**
- [x] **Step 5: Run full suite — no regressions**
- [x] **Step 6: Commit** — `git commit -m "feat(story-1): add resolve-or-create + backfill for organisations (AC2, AC3)"`

---

## Task 3: wire OAuth-callback resolution + startup migration/backfill (AC2, AC3, AC4)

**Files:**
- Modify: `src/web-ui/routes/auth.js` — add `_resolveOrganisation(tenantId)` helper (fire-and-forget, try/catch, mirrors `_grantFreeTierCredits`), call it in `handleAuthCallback` and `handleAuthGoogleCallback` right after `req.session.tenantId` is set (same placement as the existing `_grantFreeTierCredits` call). Add `setOrganisationsPool(pool)` so server.js can hand the module a pool without a D37 stub-throw (defaults to a no-op when unwired, matching this story's "no adapter needed" DoR note — a missing pool must never break login, only skip organisation resolution).
- Modify: `src/web-ui/server.js` — inside the existing `DATABASE_URL` block (near where `_userRolesPool` is created), create/reuse a pool, call `organisations.migrateOrganisationsSchema(pool)` and `organisations.backfillStandaloneOrganisations(pool, await credits.getValidTenantIds(), logger)` once at startup, then `auth.setOrganisationsPool(pool)`.

- [x] **Step 1: Write failing integration test** — `existingTenantRoutesUnaffectedByOrganisationsTable` (AC4): call `handleAuthCallback` with the wiring active, assert session shape (`userId`, `login`, `tenantId`, `role`, `accessToken`) and response (`statusCode` 302, redirect `Location`) match the same values asserted by the existing `check-ftcg-s1`/`check-tir-s1` tests — i.e. unchanged.

- [x] **Step 2: Run — must fail** (`setOrganisationsPool is not a function`)

- [x] **Step 3: Write minimal implementation** in `auth.js`:

```js
const _organisations = require('../modules/organisations');
let _organisationsPool = null;
function setOrganisationsPool(pool) { _organisationsPool = pool; }

async function _resolveOrganisation(tenantId) {
  if (!_organisationsPool) return; // not wired (e.g. no DATABASE_URL) -- safe no-op, never blocks login
  try {
    await _organisations.resolveOrganisationForTenant(_organisationsPool, tenantId);
  } catch (err) {
    _logger.warn('organisation_resolution_failed', { tenantId, reason: err.message });
  }
}
```
Call `await _resolveOrganisation(req.session.tenantId);` immediately after the existing `await _grantFreeTierCredits(req.session.tenantId);` line in both `handleAuthCallback` and `handleAuthGoogleCallback`.

In `server.js`, alongside the existing `_userRolesPool` creation:
```js
const { migrateOrganisationsSchema, backfillStandaloneOrganisations } = require('./modules/organisations');
await migrateOrganisationsSchema(_userRolesPool);
const _validTenantIds = await _credits.getValidTenantIds().catch(() => []);
await backfillStandaloneOrganisations(_userRolesPool, _validTenantIds);
_auth.setOrganisationsPool(_userRolesPool);
```

- [x] **Step 4: Run — must pass**
- [x] **Step 5: Run full suite — no regressions**
- [x] **Step 6: Commit** — `git commit -m "feat(story-1): wire organisation resolution into OAuth callback + startup migration/backfill (AC2, AC3, AC4)"`

---

## Task 4: NFR tests (Performance, Security, Audit)

**Files:**
- Test: `tests/check-story1-organisation-entity.js` (T6, T7, T8)

- [x] **Step 1: Write failing NFR tests**
  - `organisationLookupAddsAtMostOneIndexedQuery` — seed an existing org row, call `resolveOrganisationForTenant` once, assert the fake pool's query log grew by exactly 1 call and that call is a `SELECT ... FROM organisations WHERE org_id = $1`-shaped query.
  - `organisationLookupScopedByTrustedSessionTenantId` — call `resolveOrganisationForTenant(pool, tenantId)` directly and assert the only param passed to the DB query is the given `tenantId` value (never a separately-supplied "request" value); additionally assert `auth.js`'s wiring calls `_resolveOrganisation(req.session.tenantId)`, never `req.query`/`req.body`, by source-inspection of the diff.
  - `organisationCreationIsAudited` — assert a log call with `tenant_id`, `org_type`, `timestamp` fires on both the AC3 (new signup) and AC2 (backfill) creation paths.

- [x] **Step 2: Run — must fail**
- [x] **Step 3: Implementation** — already satisfied by Task 2's logging inside `resolveOrganisationForTenant`; no new production code expected, tests should pass as written. If a test fails, fix `organisations.js` (not the test) to match the NFR.
- [x] **Step 4: Run — must pass**
- [x] **Step 5: Run full suite — no regressions**
- [x] **Step 6: Commit** — `git commit -m "test(story-1): add NFR tests for organisation resolution (perf, security, audit)"`

---

## Task 5: Verification pass + PR

- [x] Run `node scripts/run-all-tests.js`, confirm `tests/check-story1-organisation-entity.js` is auto-discovered and all 8 tests pass, zero new failures vs. the pre-story baseline (38 pre-existing failing files).
- [x] Walk the AC verification script scenarios conceptually against the implementation.
- [x] Open draft PR, update `.github/pipeline-state.json`, update `workspace/capture-log.md` if any ambiguity was found.
