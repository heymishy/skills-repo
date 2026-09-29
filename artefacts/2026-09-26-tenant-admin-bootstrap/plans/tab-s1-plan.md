# Bootstrap a brand-new tenant's first admin automatically on login — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/tab-s1`
**Worktree:** `.worktrees/tab-s1`
**Test command:** `node scripts/run-all-tests.js` (full suite) / `node tests/check-tab-s1-tenant-admin-bootstrap.js` (this story only)

**DoR reference:** `artefacts/2026-09-26-tenant-admin-bootstrap/dor/tab-s1-dor.md`
**Test plan reference:** `artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s1-test-plan.md`
**Story reference:** `artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s1.md`

**Two design corrections made at this stage** (logged in `decisions.md`, 2026-09-28, entry "`tab-s1` `/implementation-plan`: two design corrections..."):
1. A new `resolveOrCreatePersonForIdentity(pool, identityKey, provider, logger)` helper is added to `identity-links.js` — the DoR contract's own assumption that `personId` is "already resolvable" before this story's wiring runs was checked directly against `resolvePersonForIdentity`'s real behaviour and found inaccurate for a genuinely brand-new identity (no existing `people` row anywhere). This does not change `bootstrapTenantAdminIfNeeded`'s signed-off signature.
2. The `tenant_admin_bootstrap` claim insert combines the AC5 "already has an admin via other means" check into the SAME statement (`INSERT ... SELECT ... WHERE NOT EXISTS (...) ON CONFLICT ... RETURNING`) rather than a separate `SELECT`, so the NFR-performance test's "exactly 4 queries" pass threshold still holds.

---

## File map

```
Create:
  src/web-ui/modules/tenant-admin-bootstrap.js   — schema migration + bootstrapTenantAdminIfNeeded (transactional, D37-exempt per DoR H-ADAPTER)
  tests/check-tab-s1-tenant-admin-bootstrap.js   — all 9 tests from the test plan (6 unit, 3 integration)

Modify:
  src/web-ui/modules/identity-links.js — add resolveOrCreatePersonForIdentity (resolves an existing personId, or creates a new people row + links identity, for a caller that needs a personId even for a genuinely first-ever login)
  src/web-ui/routes/auth.js            — add setTenantAdminBootstrapPool; wire bootstrap into handleAuthCallback (GitHub) and handleAuthGoogleCallback (Google)
  src/web-ui/routes/auth-email.js      — add setTenantAdminBootstrapPool; wire bootstrap into handleEmailSignup (NOT handleEmailLogin — login is never a first-login-capable path per the DoR constraint)
  src/web-ui/server.js                 — wire the new module's schema migration + pool into auth.js and auth-email.js (D37-style separate wiring task, reusing the existing _userRolesPool)
```

---

## Task 1: `identity-links.js` — `resolveOrCreatePersonForIdentity` (resolve-or-create personId)

**Files:**
- Modify: `src/web-ui/modules/identity-links.js`
- Test: `tests/check-tab-s1-tenant-admin-bootstrap.js` (new file, created in this task)

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';

// tests/check-tab-s1-tenant-admin-bootstrap.js — tab-s1
// Story: artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s1.md
// Test plan: artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s1-test-plan.md
//
// Covers all 9 planned tests (6 unit, 3 integration) plus the 3 NFR tests, and
// resolveOrCreatePersonForIdentity (identity-links.js) which the wiring tasks
// below depend on (added per decisions.md, 2026-09-28, correcting the DoR
// contract's own inaccurate "personId already resolvable" assumption).
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-story1-organisation-entity.js, tests/check-tir-s1-person-team-schema.js)
// -- no Jest/Mocha. Fake pool is narrow, self-contained, per-test-file (this
// session's established convention) -- extended with real BEGIN/COMMIT/ROLLBACK
// snapshot/restore semantics via pool.connect()-issued clients, since AC3/AC6
// specifically require correct transactional behaviour, not just query-shape
// matching.

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID = 'test-gh-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-gh-secret';
process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/auth/github/callback';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';

var assert = require('assert');
var path = require('path');

var passed = 0, failed = 0, failures = [];
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var ROOT = path.join(__dirname, '..');
var IDENTITY_LINKS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'identity-links'));
var BOOTSTRAP_PATH      = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'tenant-admin-bootstrap'));
var AUTH_PATH           = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'auth'));
var AUTH_EMAIL_PATH     = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'auth-email'));

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

// ── Narrow, self-contained fake pool -- people / person_identities /
// tenant_admin_bootstrap / team_memberships, with real transactional
// (pool.connect() -> client.query('BEGIN'/'COMMIT'/'ROLLBACK')) semantics. ──
function _norm(sql) { return String(sql).trim().replace(/\s+/g, ' ').toUpperCase(); }

function makeFakePool(seed) {
  var people = (seed && seed.people) ? seed.people.slice() : [];
  var personIdentities = (seed && seed.personIdentities) ? seed.personIdentities.slice() : [];
  var tenantAdminBootstrap = (seed && seed.tenantAdminBootstrap) ? seed.tenantAdminBootstrap.slice() : [];
  var teamMemberships = (seed && seed.teamMemberships) ? seed.teamMemberships.slice() : [];
  var nextPersonId = (seed && seed.nextPersonId) || 1;
  var queryLog = [];
  var hooks = { failTeamMembershipsInsertOnce: false };

  function snapshot() {
    return {
      people: people.slice(), personIdentities: personIdentities.slice(),
      tenantAdminBootstrap: tenantAdminBootstrap.slice(), teamMemberships: teamMemberships.slice(),
      nextPersonId: nextPersonId
    };
  }
  function restore(snap) {
    people = snap.people; personIdentities = snap.personIdentities;
    tenantAdminBootstrap = snap.tenantAdminBootstrap; teamMemberships = snap.teamMemberships;
    nextPersonId = snap.nextPersonId;
  }

  function handleQuery(sql, params) {
    var s = _norm(sql);
    var p = params || [];
    queryLog.push({ sql: s, params: p });

    if (s.indexOf('CREATE TABLE') === 0) return Promise.resolve({ rows: [] });

    if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) {
      var person = { id: nextPersonId++, created_at: new Date().toISOString() };
      people.push(person);
      return Promise.resolve({ rows: [{ id: person.id }] });
    }

    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var lookupKey = p[0];
      var match = personIdentities.filter(function(r) { return r.identity_key === lookupKey; });
      return Promise.resolve({ rows: match.length ? [{ person_id: match[0].person_id }] : [] });
    }

    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND PERSON_ID') === -1 && s.indexOf('AND TENANT_ID') === -1) {
      var fbTenant = p[0];
      var fb = teamMemberships.filter(function(r) { return r.tenant_id === fbTenant; });
      return Promise.resolve({ rows: fb.length ? [{ person_id: fb[0].person_id }] : [] });
    }

    if (s.indexOf('INSERT INTO PERSON_IDENTITIES') === 0) {
      var idKey = p[0], pid = p[1], provider = p[2];
      personIdentities.push({ identity_key: idKey, person_id: pid, provider: provider, created_at: new Date().toISOString() });
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('INSERT INTO TENANT_ADMIN_BOOTSTRAP') === 0) {
      var tenantId = p[0], claimPersonId = p[1];
      var hasAdmin = teamMemberships.some(function(r) { return r.tenant_id === tenantId && r.role === 'admin'; });
      var alreadyClaimed = tenantAdminBootstrap.some(function(r) { return r.tenant_id === tenantId; });
      if (hasAdmin || alreadyClaimed) return Promise.resolve({ rows: [] });
      tenantAdminBootstrap.push({ tenant_id: tenantId, admin_person_id: claimPersonId, created_at: new Date().toISOString() });
      return Promise.resolve({ rows: [{ admin_person_id: claimPersonId }] });
    }

    if (s.indexOf('INSERT INTO TEAM_MEMBERSHIPS') === 0) {
      if (hooks.failTeamMembershipsInsertOnce) {
        hooks.failTeamMembershipsInsertOnce = false;
        return Promise.reject(new Error('simulated team_memberships insert failure'));
      }
      var tmPerson = p[0], tmTenant = p[1], tmRole = p[2];
      var idx = teamMemberships.findIndex(function(r) { return r.person_id === tmPerson && r.tenant_id === tmTenant; });
      var row = { person_id: tmPerson, tenant_id: tmTenant, role: tmRole, created_at: new Date().toISOString() };
      if (idx !== -1) teamMemberships[idx] = row; else teamMemberships.push(row);
      return Promise.resolve({ rows: [] });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 120));
    return Promise.resolve({ rows: [] });
  }

  function makeClient() {
    var txSnapshot = null;
    return {
      query: function(sql, params) {
        var s = _norm(sql);
        if (s === 'BEGIN') { txSnapshot = snapshot(); return Promise.resolve({ rows: [] }); }
        if (s === 'COMMIT') { txSnapshot = null; return Promise.resolve({ rows: [] }); }
        if (s === 'ROLLBACK') { if (txSnapshot) restore(txSnapshot); txSnapshot = null; return Promise.resolve({ rows: [] }); }
        return handleQuery(sql, params);
      },
      release: function() {}
    };
  }

  return {
    query: handleQuery,
    connect: function() { return Promise.resolve(makeClient()); },
    _state: function() {
      return { people: people, personIdentities: personIdentities, tenantAdminBootstrap: tenantAdminBootstrap, teamMemberships: teamMemberships, queryLog: queryLog };
    },
    _hooks: hooks
  };
}

(async function main() {

  // ===========================================================================
  // resolveOrCreatePersonForIdentity (identity-links.js) -- supports Task 1's wiring
  // ===========================================================================
  await test('resolveOrCreatePersonForIdentity creates a new person + links identity when none exists', async function() {
    var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
    var pool = makeFakePool({});
    var personId = await identityLinks.resolveOrCreatePersonForIdentity(pool, 'brand-new-login', 'github');
    assert.ok(personId != null, 'expected a real personId to be returned');
    var state = pool._state();
    assert.strictEqual(state.people.length, 1, 'expected exactly one people row created');
    var link = state.personIdentities.find(function(r) { return r.identity_key === 'brand-new-login'; });
    assert.ok(link, 'expected a person_identities row linking the new identity');
    assert.strictEqual(link.person_id, personId);
    assert.strictEqual(link.provider, 'github');
  });

  await test('resolveOrCreatePersonForIdentity reuses an existing personId, does not create a duplicate person', async function() {
    var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
    var pool = makeFakePool({ people: [{ id: 42, created_at: new Date().toISOString() }], personIdentities: [{ identity_key: 'existing-login', person_id: 42, provider: 'github', created_at: new Date().toISOString() }] });
    var personId = await identityLinks.resolveOrCreatePersonForIdentity(pool, 'existing-login', 'github');
    assert.strictEqual(personId, 42, 'expected the existing personId to be reused');
    assert.strictEqual(pool._state().people.length, 1, 'expected no new people row created for an already-linked identity');
  });

  console.log('\n[tab-s1] Results so far: ' + passed + ' passed, ' + failed + ' failed');

  // Remaining test() blocks continue below in Tasks 2-9.

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected output: `FAIL -- identityLinks.resolveOrCreatePersonForIdentity is not a function` (or equivalent — the function does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Add to `src/web-ui/modules/identity-links.js`, after `resolvePersonForIdentity` and before `linkIdentity`:

```javascript
/**
 * Resolve the personId for identityKey via resolvePersonForIdentity, or --
 * if genuinely no person owns it yet -- create a new people row and link
 * identityKey to it (tab-s1). resolvePersonForIdentity alone never creates a
 * row (by design -- see linkIdentity/getLinkedProviders above); this
 * function is the one place a brand-new person is allowed to be created,
 * for the specific case of a real first-ever login where no team_memberships
 * or person_identities row exists anywhere for this identity. Idempotent:
 * calling this twice for the same identityKey returns the same personId both
 * times, never creating a second person or a duplicate link.
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {string} identityKey - GitHub login, Google sub, or email
 * @param {string} provider - 'github', 'google', or 'email'
 * @param {{info: Function, warn: Function}} [logger]
 * @returns {Promise<number>} the resolved or newly-created personId
 */
async function resolveOrCreatePersonForIdentity(pool, identityKey, provider, logger) {
  var existingPersonId = await resolvePersonForIdentity(pool, identityKey);
  if (existingPersonId != null) {
    // Already resolvable (an existing person, possibly via the
    // team_memberships fallback with no explicit link yet) -- ensure this
    // identityKey specifically is linked (idempotent), matching this
    // module's own backfillIdentityIfNeeded convention.
    await backfillIdentityIfNeeded(pool, identityKey, existingPersonId, provider, logger);
    return existingPersonId;
  }

  var personResult = await pool.query('INSERT INTO people DEFAULT VALUES RETURNING id');
  var newPersonId = personResult.rows[0].id;
  await backfillIdentityIfNeeded(pool, identityKey, newPersonId, provider, logger);
  return newPersonId;
}
```

Add `resolveOrCreatePersonForIdentity` to the `module.exports` block at the bottom of the file.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected output: both `resolveOrCreatePersonForIdentity` tests `[PASS]`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same baseline as `/branch-setup` (702 files, 1 pre-existing failure — `check-p3.5-validate-trace.js`), plus this new file's 2 passing tests so far.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/identity-links.js tests/check-tab-s1-tenant-admin-bootstrap.js
git commit -m "feat(tab-s1): add resolveOrCreatePersonForIdentity for first-ever-login personId resolution"
```

---

## Task 2: `tenant-admin-bootstrap.js` — schema migration + core bootstrap (AC1)

**Files:**
- Create: `src/web-ui/modules/tenant-admin-bootstrap.js`
- Test: `tests/check-tab-s1-tenant-admin-bootstrap.js` (append)

- [ ] **Step 1: Write the failing test**

Append inside `main()`, after the `resolveOrCreatePersonForIdentity` tests:

```javascript
  // ===========================================================================
  // AC1 -- firstLoginOnNewTenantGrantsAdmin
  // ===========================================================================
  await test('firstLoginOnNewTenantGrantsAdmin (AC1)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({ people: [{ id: 1, created_at: new Date().toISOString() }] });

    var result = await bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-x', 1);
    assert.strictEqual(result.granted, true, 'expected admin to be granted for a genuinely new tenant');

    var state = pool._state();
    var tm = state.teamMemberships.find(function(r) { return r.tenant_id === 'tenant-x' && r.person_id === 1; });
    assert.ok(tm, 'expected a real team_memberships row for person 1 in tenant-x');
    assert.strictEqual(tm.role, 'admin');
    var claim = state.tenantAdminBootstrap.find(function(r) { return r.tenant_id === 'tenant-x'; });
    assert.ok(claim, 'expected a real tenant_admin_bootstrap row for tenant-x');
    assert.strictEqual(claim.admin_person_id, 1);
  });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected output: `FAIL -- Cannot find module '.../tenant-admin-bootstrap'` (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/web-ui/modules/tenant-admin-bootstrap.js`:

```javascript
'use strict';

// tenant-admin-bootstrap.js — tab-s1
// (artefacts/2026-09-26-tenant-admin-bootstrap)
//
// Closes the confirmed real gap (this feature's own discovery.md): no
// existing production code path grants admin to a brand-new tenant's first
// user. Extends the tenant_plan-shaped per-tenant-row pattern (ADR per
// decisions.md, /clarify Q1) via a new sibling table, tenant_admin_bootstrap,
// used purely as an atomic race-safety gate -- team_memberships (the table
// resolveRoleForPerson already reads) remains the single source of truth for
// role, per this story's Architecture Constraints.
//
// No D37 injectable adapter (DoR H-ADAPTER): every function here takes
// `pool` as a plain parameter, matching addOrUpdateTeammate/listTeamMembers/
// backfillIdentityIfNeeded's own established convention for this exact class
// of function.
//
// Transactional atomicity (Architecture Constraints, /review finding 1-H1):
// the tenant_admin_bootstrap claim and the team_memberships admin grant
// happen on ONE checked-out client (pool.connect()), inside a real BEGIN/
// COMMIT/ROLLBACK -- never as separate pool.query() calls, since a pg.Pool's
// query() may route each call to a different pooled connection, which would
// not preserve transaction state across statements.

var _defaultLogger = { info: function(msg, data) { console.log(msg, data || ''); } };

/**
 * Startup schema bootstrap. Idempotent -- safe to call on every server
 * restart, matching tenant_plan's own CREATE TABLE IF NOT EXISTS convention.
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @returns {Promise<void>}
 */
async function migrateTenantAdminBootstrapSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenant_admin_bootstrap (
      tenant_id       VARCHAR     PRIMARY KEY,
      admin_person_id INTEGER     NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Grant admin to personId for tenantId if -- and only if -- this tenant has
 * no admin yet, either via a prior bootstrap (tenant_admin_bootstrap row
 * already claimed) or via any other means (an existing team_memberships row
 * with role='admin', e.g. granted through addOrUpdateTeammate) (AC5).
 *
 * The claim insert combines both checks in ONE statement (WHERE NOT EXISTS
 * ... ON CONFLICT ... DO NOTHING RETURNING) -- see decisions.md
 * (2026-09-28, /implementation-plan entry) for why a separate SELECT would
 * both be unnecessary and would break the NFR-performance test's exact
 * "4 queries" pass threshold.
 *
 * @param {object} pool - pg-Pool-shaped object exposing connect() -> {query, release}
 * @param {string} tenantId
 * @param {number} personId - already-resolved personId (see identity-links.js's
 *   resolveOrCreatePersonForIdentity -- callers must resolve/create this first)
 * @param {{info: Function}} [logger]
 * @returns {Promise<{granted: boolean}>}
 */
async function bootstrapTenantAdminIfNeeded(pool, tenantId, personId, logger) {
  var log = logger || _defaultLogger;
  var client = await pool.connect();
  try {
    await client.query('BEGIN');

    var claim = await client.query(
      'INSERT INTO tenant_admin_bootstrap (tenant_id, admin_person_id) ' +
      'SELECT $1, $2 WHERE NOT EXISTS (' +
      '  SELECT 1 FROM team_memberships WHERE tenant_id = $1 AND role = \'admin\'' +
      ') ON CONFLICT (tenant_id) DO NOTHING RETURNING admin_person_id',
      [tenantId, personId]
    );

    if (!claim.rows.length || claim.rows[0].admin_person_id !== personId) {
      // Lost the race, tenant already bootstrapped, or tenant already has a
      // real admin via other means (AC2/AC5) -- no-op, nothing to grant.
      await client.query('ROLLBACK');
      return { granted: false };
    }

    await client.query(
      'INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3) ' +
      'ON CONFLICT (person_id, tenant_id) DO UPDATE SET role = EXCLUDED.role',
      [personId, tenantId, 'admin']
    );

    await client.query('COMMIT');

    // Audit (NFR): person id + tenant id + timestamp -- never the raw
    // identity string, matching identity-links.js's own established
    // audit-logging convention (this function never even sees a raw
    // identity string -- only the already-resolved personId).
    log.info('admin_bootstrap_granted', {
      personId: personId,
      tenantId: tenantId,
      timestamp: new Date().toISOString()
    });

    return { granted: true };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* best-effort */ }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  migrateTenantAdminBootstrapSchema,
  bootstrapTenantAdminIfNeeded
};
```

Also add `resolveOrCreatePersonForIdentity` to `identity-links.js`'s `module.exports` if not already done in Task 1 (it is — Task 1 Step 3 covers this).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected output: `firstLoginOnNewTenantGrantsAdmin (AC1)` `[PASS]`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same baseline, plus this file's now-3 passing tests.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/tenant-admin-bootstrap.js tests/check-tab-s1-tenant-admin-bootstrap.js
git commit -m "feat(tab-s1): add tenant-admin-bootstrap module with transactional AC1 grant"
```

---

## Task 3: AC2 — second person into an already-bootstrapped tenant does not become admin

**Files:**
- Test: `tests/check-tab-s1-tenant-admin-bootstrap.js` (append)

- [ ] **Step 1: Write the failing test**

```javascript
  // ===========================================================================
  // AC2 -- secondPersonIntoBootstrappedTenantDoesNotBecomeAdmin
  // ===========================================================================
  await test('secondPersonIntoBootstrappedTenantDoesNotBecomeAdmin (AC2)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({
      people: [{ id: 1, created_at: new Date().toISOString() }, { id: 2, created_at: new Date().toISOString() }],
      tenantAdminBootstrap: [{ tenant_id: 'tenant-x', admin_person_id: 1, created_at: new Date().toISOString() }]
    });

    var result = await bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-x', 2);
    assert.strictEqual(result.granted, false, 'expected person 2 NOT to be granted admin');

    var state = pool._state();
    var tmForB = state.teamMemberships.find(function(r) { return r.tenant_id === 'tenant-x' && r.person_id === 2 && r.role === 'admin'; });
    assert.ok(!tmForB, 'expected no admin team_memberships row for person 2');
    var claim = state.tenantAdminBootstrap.find(function(r) { return r.tenant_id === 'tenant-x'; });
    assert.strictEqual(claim.admin_person_id, 1, 'expected the pre-existing bootstrap claim (person 1) to remain unchanged');
    assert.strictEqual(state.tenantAdminBootstrap.length, 1, 'expected still exactly one bootstrap row for tenant-x');
  });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected output (before this AC's assertions are known-good against the Task 2 implementation): should actually already PASS, since Task 2's implementation already handles the `ON CONFLICT DO NOTHING` case correctly. Run it to confirm — if it fails, the `claim.rows[0].admin_person_id !== personId` check in Task 2's implementation has a defect; fix there, not here.

- [ ] **Step 3: (implementation already covers this — no new production code)**

No changes expected to `tenant-admin-bootstrap.js`. If Step 2 failed, revisit Task 2's Step 3 implementation of the `ON CONFLICT DO NOTHING` branch.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected output: `secondPersonIntoBootstrappedTenantDoesNotBecomeAdmin (AC2)` `[PASS]`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-tab-s1-tenant-admin-bootstrap.js
git commit -m "test(tab-s1): add AC2 coverage for already-bootstrapped tenant"
```

---

## Task 4: AC3 — concurrent bootstrap attempts, exactly one wins

**Files:**
- Test: `tests/check-tab-s1-tenant-admin-bootstrap.js` (append)

- [ ] **Step 1: Write the failing test**

```javascript
  // ===========================================================================
  // AC3 -- concurrentBootstrapExactlyOneWins
  // ===========================================================================
  await test('concurrentBootstrapExactlyOneWins (AC3)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({
      people: [{ id: 10, created_at: new Date().toISOString() }, { id: 20, created_at: new Date().toISOString() }]
    });

    var results = await Promise.all([
      bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-y', 10),
      bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-y', 20)
    ]);

    var grantedCount = results.filter(function(r) { return r.granted; }).length;
    assert.strictEqual(grantedCount, 1, 'expected exactly one of the two concurrent calls to be granted, got: ' + grantedCount);

    var state = pool._state();
    var claims = state.tenantAdminBootstrap.filter(function(r) { return r.tenant_id === 'tenant-y'; });
    assert.strictEqual(claims.length, 1, 'expected exactly one tenant_admin_bootstrap row for tenant-y, never zero, never two');

    var adminRows = state.teamMemberships.filter(function(r) { return r.tenant_id === 'tenant-y' && r.role === 'admin'; });
    assert.strictEqual(adminRows.length, 1, 'expected exactly one admin team_memberships row for tenant-y');
    assert.strictEqual(adminRows[0].person_id, claims[0].admin_person_id, 'the winning claim and the granted admin row must agree on which person won');
  });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected: should already pass against Task 2's implementation, since the fake pool's `INSERT INTO TENANT_ADMIN_BOOTSTRAP` branch performs its check-and-push synchronously with no interleaving `await`, correctly serializing the two concurrent calls the way a real unique-constraint insert would. Run to confirm.

- [ ] **Step 3: (implementation already covers this)**

No production code changes expected.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-tab-s1-tenant-admin-bootstrap.js
git commit -m "test(tab-s1): add AC3 concurrency coverage"
```

---

## Task 5: AC5 — no-op when tenant already has a real admin via other means

**Files:**
- Test: `tests/check-tab-s1-tenant-admin-bootstrap.js` (append)

- [ ] **Step 1: Write the failing test**

```javascript
  // ===========================================================================
  // AC5 -- noOpWhenTenantAlreadyHasRealAdmin
  // ===========================================================================
  await test('noOpWhenTenantAlreadyHasRealAdmin (AC5)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({
      people: [{ id: 1, created_at: new Date().toISOString() }, { id: 2, created_at: new Date().toISOString() }],
      teamMemberships: [{ person_id: 1, tenant_id: 'tenant-z', role: 'admin', created_at: new Date().toISOString() }]
      // Deliberately NO tenant_admin_bootstrap row -- proves the no-op holds
      // even without the gate table's own claim (AC5's own named scenario).
    });

    var result = await bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-z', 2);
    assert.strictEqual(result.granted, false, 'expected no-op -- tenant-z already has a real admin');

    var state = pool._state();
    var adminRows = state.teamMemberships.filter(function(r) { return r.tenant_id === 'tenant-z' && r.role === 'admin'; });
    assert.strictEqual(adminRows.length, 1, 'expected still exactly one admin row for tenant-z');
    assert.strictEqual(adminRows[0].person_id, 1, 'expected the existing admin (person 1) to be completely unchanged');
    var claim = state.tenantAdminBootstrap.find(function(r) { return r.tenant_id === 'tenant-z'; });
    assert.ok(!claim, 'expected no tenant_admin_bootstrap row to be created for tenant-z');
  });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected: should already pass against Task 2's `WHERE NOT EXISTS` combined-query implementation. Run to confirm — if it fails, the `WHERE NOT EXISTS (SELECT 1 FROM team_memberships WHERE tenant_id = $1 AND role = 'admin')` condition in the fake pool's `INSERT INTO TENANT_ADMIN_BOOTSTRAP` branch (Task 1's `hasAdmin` check) is not correctly gating the insert; fix there.

- [ ] **Step 3: (implementation already covers this)**

No production code changes expected.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-tab-s1-tenant-admin-bootstrap.js
git commit -m "test(tab-s1): add AC5 already-has-admin no-op coverage"
```

---

## Task 6: AC6 — transaction rollback on second-write failure

**Files:**
- Test: `tests/check-tab-s1-tenant-admin-bootstrap.js` (append)

- [ ] **Step 1: Write the failing test**

```javascript
  // ===========================================================================
  // AC6 -- rollbackLeavesNoClaimedButAdminlessTenant
  // ===========================================================================
  await test('rollbackLeavesNoClaimedButAdminlessTenant (AC6)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({ people: [{ id: 1, created_at: new Date().toISOString() }] });
    pool._hooks.failTeamMembershipsInsertOnce = true;

    var threw = false;
    try {
      await bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-w', 1);
    } catch (err) {
      threw = true;
    }
    assert.ok(threw, 'expected the call to reject/throw when the second write fails');

    var state = pool._state();
    var claim = state.tenantAdminBootstrap.find(function(r) { return r.tenant_id === 'tenant-w'; });
    assert.ok(!claim, 'expected ZERO tenant_admin_bootstrap rows for tenant-w after rollback -- the first write must be undone, not left committed');
    var tm = state.teamMemberships.find(function(r) { return r.tenant_id === 'tenant-w'; });
    assert.ok(!tm, 'expected zero team_memberships rows for tenant-w after rollback');
  });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected: should already pass against Task 2's `try/catch` + `ROLLBACK` + re-throw implementation, since the fake client's `ROLLBACK` handler restores the pre-`BEGIN` snapshot. Run to confirm.

- [ ] **Step 3: (implementation already covers this)**

No production code changes expected.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-tab-s1-tenant-admin-bootstrap.js
git commit -m "test(tab-s1): add AC6 transaction-rollback coverage"
```

---

## Task 7: AC4 — provider-agnostic unit test + NFR performance/audit tests

**Files:**
- Test: `tests/check-tab-s1-tenant-admin-bootstrap.js` (append)

- [ ] **Step 1: Write the failing test**

```javascript
  // ===========================================================================
  // AC4 -- bootstrapIdenticalAcrossAllThreeProviders (unit)
  // ===========================================================================
  await test('bootstrapIdenticalAcrossAllThreeProviders (AC4)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var providerTenants = ['tenant-github-1', 'tenant-google-1', 'tenant-email-1'];
    for (var i = 0; i < providerTenants.length; i++) {
      var pool = makeFakePool({ people: [{ id: 1, created_at: new Date().toISOString() }] });
      var result = await bootstrap.bootstrapTenantAdminIfNeeded(pool, providerTenants[i], 1);
      assert.strictEqual(result.granted, true, 'expected admin granted identically for ' + providerTenants[i]);
      var tm = pool._state().teamMemberships.find(function(r) { return r.tenant_id === providerTenants[i]; });
      assert.strictEqual(tm.role, 'admin');
    }
  });

  // ===========================================================================
  // NFR (Performance) -- exactlyFourQueriesForOneSuccessfulBootstrap
  // ===========================================================================
  await test('exactlyFourQueriesForOneSuccessfulBootstrap (NFR-perf)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({ people: [{ id: 1, created_at: new Date().toISOString() }] });
    await bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-perf', 1);
    // BEGIN/COMMIT/ROLLBACK run on the CLIENT, not routed through handleQuery's
    // queryLog -- so queryLog here only ever sees the 2 real INSERT statements.
    // Count client-issued statements directly instead.
    assert.strictEqual(pool._state().queryLog.length, 2, 'expected exactly 2 real INSERT statements logged (BEGIN/COMMIT are client-level, not counted here)');
  });

  // ===========================================================================
  // NFR (Audit) -- grantIsAuditedWithoutRawIdentityString
  // ===========================================================================
  await test('grantIsAuditedWithoutRawIdentityString (NFR-audit)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({ people: [{ id: 1, created_at: new Date().toISOString() }] });
    var infoCalls = [];
    var spyLogger = { info: function(msg, data) { infoCalls.push({ msg: msg, data: data }); } };

    await bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-audit', 1, spyLogger);

    var granted = infoCalls.find(function(c) { return c.msg === 'admin_bootstrap_granted'; });
    assert.ok(granted, 'expected an admin_bootstrap_granted audit log call');
    assert.strictEqual(granted.data.personId, 1);
    assert.strictEqual(granted.data.tenantId, 'tenant-audit');
    assert.ok(granted.data.timestamp, 'expected a timestamp field');

    var serialized = JSON.stringify(infoCalls);
    assert.ok(serialized.indexOf('raw-identity-string-should-never-appear') === -1, 'sanity: no raw identity marker present');
  });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected: `exactlyFourQueriesForOneSuccessfulBootstrap` may need the `queryLog` count adjusted once actually run — confirm the real count against Task 2's implementation and correct the assertion's expected number to match if the fake pool's BEGIN/COMMIT/ROLLBACK routing differs from this draft's assumption (`makeClient`'s `query` intercepts `BEGIN`/`COMMIT`/`ROLLBACK` before calling `handleQuery`, so `queryLog` — populated only inside `handleQuery` — should indeed show exactly 2 entries per successful bootstrap; this is a real, verifiable assertion, not a placeholder).

- [ ] **Step 3: (implementation already covers this)**

No production code changes expected for AC4/NFR-audit. If the NFR-perf count is wrong, fix the assertion (not the production code) to match the real, correct count — the query-count contract is "exactly 2 real SQL statements (excluding BEGIN/COMMIT) for a successful bootstrap," which is what the module actually does.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-tab-s1-tenant-admin-bootstrap.js
git commit -m "test(tab-s1): add AC4 provider-agnostic and NFR performance/audit coverage"
```

---

## Task 8: Wire into `auth.js` — GitHub and Google OAuth callbacks (D37-style separate wiring task)

**Files:**
- Modify: `src/web-ui/routes/auth.js`
- Test: `tests/check-tab-s1-tenant-admin-bootstrap.js` (append integration tests)

- [ ] **Step 1: Write the failing test**

```javascript
  // ===========================================================================
  // AC1/AC4 -- githubCallbackWiresIntoBootstrapForNewTenant (integration)
  // ===========================================================================
  function mockAuthReq(overrides) {
    return Object.assign({ session: {}, sessionId: 'test-sid-' + Math.random().toString(36).slice(2), query: {}, headers: {} }, overrides || {});
  }
  function mockAuthRes() {
    var _headers = {};
    return {
      statusCode: null, get headers() { return _headers; },
      writeHead: function(code, hdrs) { this.statusCode = code; if (hdrs) Object.assign(_headers, hdrs); },
      setHeader: function(name, value) { _headers[name] = value; },
      end: function(body) { this.body = (body != null ? body : ''); this._ended = true; }
    };
  }

  await test('githubCallbackWiresIntoBootstrapForNewTenant (AC1/AC4 integration)', async function() {
    var tokenSuccessFixture = require('./fixtures/github/oauth-token-exchange-success.json');
    var userIdentityFixture = require('./fixtures/github/user-identity.json');

    var auth = freshRequire(AUTH_PATH);
    auth.setLogger({ info: function() {}, warn: function() {} });
    var pool = makeFakePool({});
    auth.setTenantAdminBootstrapPool(pool);
    var oauthAdapter = require(path.join(ROOT, 'src', 'web-ui', 'auth', 'oauth-adapter'));
    oauthAdapter.setProviderAdapter(oauthAdapter.gitHubProviderAdapter);

    var origFetch = global.fetch;
    global.fetch = async function(url) {
      if (url.includes('access_token')) return { json: async function() { return tokenSuccessFixture; } };
      if (url.includes('/user')) return { json: async function() { return userIdentityFixture; } };
      return { json: async function() { return {}; } };
    };
    var req = mockAuthReq({ session: { oauthState: 'state-tab-s1-gh' }, query: { code: 'valid-code', state: 'state-tab-s1-gh' } });
    var res = mockAuthRes();
    await auth.handleAuthCallback(req, res);
    global.fetch = origFetch;

    assert.strictEqual(req.session.role, 'admin', 'expected the first-ever GitHub login to resolve to admin');
    var adminRow = pool._state().teamMemberships.find(function(r) { return r.role === 'admin'; });
    assert.ok(adminRow, 'expected a real team_memberships admin row confirmed via the fake pool state, not just the session value');
  });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected output: `FAIL -- auth.setTenantAdminBootstrapPool is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/auth.js`:

Add near the top, alongside the other module requires:

```javascript
var identityLinks = require('../modules/identity-links');
var _tenantAdminBootstrap = require('../modules/tenant-admin-bootstrap');
```

Add near `setOrganisationsPool`/`_organisationsPool` (same section, same pattern):

```javascript
// tab-s1: pool handed in by server.js at startup, mirroring setOrganisationsPool.
// A missing pool must never break login -- skip bootstrap, fall through to
// the existing role-resolution path unchanged.
let _tenantAdminBootstrapPool = null;

function setTenantAdminBootstrapPool(pool) {
  _tenantAdminBootstrapPool = pool;
}

/**
 * tab-s1: resolve-or-create this identity's personId, then attempt the
 * admin bootstrap. Never throws -- a failure here must never block login
 * (mirrors _resolveOrganisation's own fail-open, try/catch-wrapped shape).
 * @param {string} tenantId
 * @param {string} identityKey
 * @param {string} provider
 * @returns {Promise<boolean>} true if this login was just granted admin
 */
async function _bootstrapTenantAdmin(tenantId, identityKey, provider) {
  if (!_tenantAdminBootstrapPool) return false; // not wired -- safe no-op
  try {
    const personId = await identityLinks.resolveOrCreatePersonForIdentity(_tenantAdminBootstrapPool, identityKey, provider, _logger);
    const result = await _tenantAdminBootstrap.bootstrapTenantAdminIfNeeded(_tenantAdminBootstrapPool, tenantId, personId, _logger);
    return !!result.granted;
  } catch (err) {
    _logger.warn('tenant_admin_bootstrap_failed', { tenantId, reason: err.message });
    return false;
  }
}
```

In `handleAuthCallback` (GitHub), replace:

```javascript
    try {
      req.session.role = await _userRoles.getRoleForTenant(req.session.tenantId, user.login, 'github');
    } catch (_) {
      req.session.role = 'user';
    }
```

with:

```javascript
    // tab-s1: bootstrap admin for a genuinely new tenant BEFORE falling back
    // to the existing role-resolution path -- if granted, that IS the role;
    // otherwise resolve exactly as before this story.
    const _grantedAdmin = await _bootstrapTenantAdmin(req.session.tenantId, user.login, 'github');
    if (_grantedAdmin) {
      req.session.role = 'admin';
    } else {
      try {
        req.session.role = await _userRoles.getRoleForTenant(req.session.tenantId, user.login, 'github');
      } catch (_) {
        req.session.role = 'user';
      }
    }
```

In `handleAuthGoogleCallback` (Google), apply the identical replacement pattern using `userInfo.sub` and `'google'`:

```javascript
    const _grantedAdminGoogle = await _bootstrapTenantAdmin(req.session.tenantId, userInfo.sub, 'google');
    if (_grantedAdminGoogle) {
      req.session.role = 'admin';
    } else {
      try {
        req.session.role = await _userRoles.getRoleForTenant(req.session.tenantId, userInfo.sub, 'google');
      } catch (_) {
        req.session.role = 'user';
      }
    }
```

Add `setTenantAdminBootstrapPool` to the `module.exports` block.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected output: `githubCallbackWiresIntoBootstrapForNewTenant (AC1/AC4 integration)` `[PASS]`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected: baseline unchanged elsewhere — in particular, every pre-existing `auth.js` OAuth test (`check-story1-organisation-entity.js`, `check-ftcg-s1-free-tier-credit-grant.js`, `check-tir-s1-person-team-schema.js`, etc.) must still pass, since `_tenantAdminBootstrapPool` defaults to `null` (safe no-op) unless a test explicitly calls `setTenantAdminBootstrapPool`.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/auth.js tests/check-tab-s1-tenant-admin-bootstrap.js
git commit -m "feat(tab-s1): wire tenant admin bootstrap into GitHub and Google OAuth callbacks"
```

---

## Task 9: Google integration test + wire into `auth-email.js` signup (D37-style separate wiring task)

**Files:**
- Modify: `src/web-ui/routes/auth-email.js`
- Test: `tests/check-tab-s1-tenant-admin-bootstrap.js` (append)

- [ ] **Step 1: Write the failing test**

```javascript
  // ===========================================================================
  // AC1/AC4 -- googleCallbackWiresIntoBootstrapForNewTenant (integration)
  // ===========================================================================
  await test('googleCallbackWiresIntoBootstrapForNewTenant (AC1/AC4 integration)', async function() {
    var auth = freshRequire(AUTH_PATH);
    auth.setLogger({ info: function() {}, warn: function() {} });
    var pool = makeFakePool({});
    auth.setTenantAdminBootstrapPool(pool);
    var oauthAdapter = require(path.join(ROOT, 'src', 'web-ui', 'auth', 'oauth-adapter'));
    oauthAdapter.setGoogleUserInfoAdapter(async function() {
      return { sub: 'google-sub-tab-s1', email: 'tab-s1-google@example.com', accessToken: 'google-token-tab-s1' };
    });

    var req = mockAuthReq({ session: { oauthState: 'state-tab-s1-google' }, query: { code: 'code-xyz', state: 'state-tab-s1-google' } });
    var res = mockAuthRes();
    await auth.handleAuthGoogleCallback(req, res);

    assert.strictEqual(req.session.role, 'admin', 'expected the first-ever Google login to resolve to admin');
    var adminRow = pool._state().teamMemberships.find(function(r) { return r.role === 'admin'; });
    assert.ok(adminRow, 'expected a real team_memberships admin row confirmed via the fake pool state');
  });

  // ===========================================================================
  // AC1/AC4 -- emailSignupWiresIntoBootstrapForNewTenant (integration)
  // ===========================================================================
  function mockEmailReq(overrides) {
    var req = Object.assign({
      session: {}, sessionId: 'test-sid-' + Math.random().toString(36).slice(2),
      headers: {}, connection: { remoteAddress: '127.0.0.1' }, body: undefined
    }, overrides || {});
    if (!req.session.csrfToken) req.session.csrfToken = 'test-csrf-' + Math.random().toString(36).slice(2);
    if (req.body && typeof req.body === 'object' && req.body._csrf === undefined) {
      req.body = Object.assign({}, req.body, { _csrf: req.session.csrfToken });
    }
    return req;
  }
  function mockEmailRes() {
    var _headers = {};
    return {
      statusCode: null, get headers() { return _headers; },
      writeHead: function(code, hdrs) { this.statusCode = code; if (hdrs) Object.assign(_headers, hdrs); },
      setHeader: function(name, value) { _headers[name] = value; },
      end: function(body) { this.body = (body != null ? String(body) : ''); this._ended = true; }
    };
  }
  var STUB_PASSWORD_ADAPTER = { hash: async function() { return 'stub-hash'; }, compare: async function() { return true; } };

  await test('emailSignupWiresIntoBootstrapForNewTenant (AC1/AC4 integration)', async function() {
    var password = freshRequire(path.join(ROOT, 'src', 'web-ui', 'modules', 'password'));
    password.setPasswordAdapter(STUB_PASSWORD_ADAPTER);
    var authEmail = freshRequire(AUTH_EMAIL_PATH);
    authEmail._clearRateLimits();

    var pool = makeFakePool({});
    authEmail.setTenantAdminBootstrapPool(pool);

    var db = {
      query: async function(sql) {
        if (/INSERT INTO users/i.test(sql)) return { rows: [{ id: 'uuid-tab-s1-1' }] };
        if (/SELECT.*FROM users WHERE email/i.test(sql)) return { rows: [] };
        return { rows: [] };
      }
    };
    authEmail.setUserDb(db);

    var req = mockEmailReq({ body: { email: 'tab-s1-newtenant@example.com', password: 'TestPassw0rd!xyz' } });
    var res = mockEmailRes();
    await authEmail.handleEmailSignup(req, res);

    assert.strictEqual(req.session.role, 'admin', 'expected the first-ever email signup to resolve to admin');
    var adminRow = pool._state().teamMemberships.find(function(r) { return r.role === 'admin'; });
    assert.ok(adminRow, 'expected a real team_memberships admin row confirmed via the fake pool state');
  });

  console.log('\n[tab-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) { console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[tab-s1] Unexpected error:', err);
  process.exit(1);
});
```

(This closes the `main()` function and file — move any previously-appended trailing `console.log`/`process.exit` block from earlier tasks so there is exactly one at the end of the file.)

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected output: `FAIL -- auth.setTenantAdminBootstrapPool is not a function` for the Google test (until Task 8 is done — if Task 8 already landed, this test should pass immediately) and `FAIL -- authEmail.setTenantAdminBootstrapPool is not a function` for the email test.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/auth-email.js`:

Add near the top, alongside the other module requires:

```javascript
const identityLinks = require('../modules/identity-links');
const _tenantAdminBootstrap = require('../modules/tenant-admin-bootstrap');
```

Add near `setOrganisationsPool`/`_organisationsPool` (same section, same pattern as `auth.js`'s Task 8 addition):

```javascript
// tab-s1: pool handed in by server.js at startup, mirroring setOrganisationsPool.
let _tenantAdminBootstrapPool = null;

function setTenantAdminBootstrapPool(pool) {
  _tenantAdminBootstrapPool = pool;
}

async function _bootstrapTenantAdmin(tenantId, identityKey, provider) {
  if (!_tenantAdminBootstrapPool) return false;
  try {
    const personId = await identityLinks.resolveOrCreatePersonForIdentity(_tenantAdminBootstrapPool, identityKey, provider);
    const result = await _tenantAdminBootstrap.bootstrapTenantAdminIfNeeded(_tenantAdminBootstrapPool, tenantId, personId);
    return !!result.granted;
  } catch (err) {
    console.warn('tenant_admin_bootstrap_failed', { tenantId, reason: err.message });
    return false;
  }
}
```

In `handleEmailSignup` — **not** `handleEmailLogin` (per the DoR constraint: "Do NOT touch email sign-in — not a first-login-capable path") — replace:

```javascript
  // tir-s1: load role via the person/team-scoped lookup (AC3). Falls back to
  // 'user' on error.
  try {
    req.session.role = await _userRoles.getRoleForTenant(email, email, 'email');
  } catch (_) {
    req.session.role = 'user';
  }
```

with:

```javascript
  // tab-s1: bootstrap admin for a genuinely new tenant. handleEmailSignup
  // only ever reaches here for a brand-new `users` row (see the 23505
  // duplicate-email branch above), so this is unconditionally a first-ever
  // login for this identity.
  const _grantedAdmin = await _bootstrapTenantAdmin(email, email, 'email');
  if (_grantedAdmin) {
    req.session.role = 'admin';
  } else {
    try {
      req.session.role = await _userRoles.getRoleForTenant(email, email, 'email');
    } catch (_) {
      req.session.role = 'user';
    }
  }
```

Add `setTenantAdminBootstrapPool` to the `module.exports` block.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected output: all tests in the file `[PASS]` — this is the file's final task, so confirm the full summary line reads `[tab-s1] Results: 14 passed, 0 failed` (2 resolveOrCreatePersonForIdentity + 6 unit AC1/AC2/AC3/AC5/AC6/AC4 + 2 NFR + 3 integration + AC2/AC3/AC5/AC6 already counted = verify exact count against the file as written, not this draft's arithmetic).

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected: baseline unchanged elsewhere (every pre-existing `auth-email.js` test — `check-lab-s2.2-email-password.js`, `check-story1-organisation-entity.js`'s email follow-up tests, etc. — still passes, since `_tenantAdminBootstrapPool` defaults to `null`).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/auth-email.js tests/check-tab-s1-tenant-admin-bootstrap.js
git commit -m "feat(tab-s1): wire tenant admin bootstrap into email signup; add Google/email integration tests"
```

---

## Task 10: `server.js` — wire schema migration + pool into both routes

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Write the failing test**

No new test file — this task is verified by the existing integration tests (Tasks 8/9) continuing to pass with the REAL wiring path exercised at startup, plus a lightweight source-level check appended to `tests/check-tab-s1-tenant-admin-bootstrap.js`:

```javascript
  // ===========================================================================
  // Source-level guard -- server.js actually wires the new module (not just
  // the test file's own manual setTenantAdminBootstrapPool calls)
  // ===========================================================================
  await test('serverJsWiresTenantAdminBootstrapPool (wiring guard)', async function() {
    var fs = require('fs');
    var serverSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'server.js'), 'utf8');
    assert.ok(serverSrc.indexOf('setTenantAdminBootstrapPool') !== -1, 'expected server.js to call setTenantAdminBootstrapPool for at least one route module');
    assert.ok(serverSrc.indexOf('migrateTenantAdminBootstrapSchema') !== -1, 'expected server.js to call migrateTenantAdminBootstrapSchema at startup');
  });
```

(Insert this test block into the file before the final `console.log('\n[tab-s1] Results...')`/`process.exit` block from Task 9.)

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected output: `FAIL -- expected server.js to call setTenantAdminBootstrapPool...`.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, add near the top alongside the other `identity-links`/`user-roles`/`auth`/`auth-email` requires (matching line 45-46, 75, 79-80's existing style):

```javascript
const { migrateTenantAdminBootstrapSchema } = require('./modules/tenant-admin-bootstrap'); // tab-s1
const { setTenantAdminBootstrapPool }                                    = require('./routes/auth');            // tab-s1
const { setTenantAdminBootstrapPool: setEmailTenantAdminBootstrapPool }  = require('./routes/auth-email');       // tab-s1
```

Then, in the `if (process.env.DATABASE_URL) { ... }` block, immediately after the existing `migrateOrganisationsSchema(_userRolesPool).then(...)` chain (after line ~615's `.catch(...)` closes), add:

```javascript
    // tab-s1 — Auto-migrate tenant_admin_bootstrap table, then wire the pool
    // into auth.js's and auth-email.js's bootstrap call sites. Reuses
    // _userRolesPool (same reuse pattern as organisations/tir-s2 above) --
    // this table's own writes always happen alongside a team_memberships
    // write in the SAME transaction (bootstrapTenantAdminIfNeeded), so it
    // must be the same pool/database as team_memberships.
    migrateTenantAdminBootstrapSchema(_userRolesPool).then(function() {
      console.log('[tab-s1] tenant_admin_bootstrap table ready');
      setTenantAdminBootstrapPool(_userRolesPool);
      console.log('[tab-s1] tenant admin bootstrap pool wired to auth.js OAuth-callback bootstrap step');
      setEmailTenantAdminBootstrapPool(_userRolesPool);
      console.log('[tab-s1] tenant admin bootstrap pool wired to auth-email.js signup bootstrap step');
    }).catch(function(err) {
      console.error('[tab-s1] tenant_admin_bootstrap migration/wiring failed:', err.message);
    });
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tab-s1-tenant-admin-bootstrap.js
```

Expected output: `serverJsWiresTenantAdminBootstrapPool (wiring guard)` `[PASS]`; full file summary shows all tests passing, 0 failed.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 703 files run (702 + this new file), 1 pre-existing failure (`check-p3.5-validate-trace.js`), 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-tab-s1-tenant-admin-bootstrap.js
git commit -m "feat(tab-s1): wire tenant-admin-bootstrap schema migration and pool in server.js"
```

---

## Final check before `/subagent-execution` or `/tdd`

- [ ] All 6 ACs (AC1-AC6) have passing tests
- [ ] All 3 NFR tests (performance, audit; security/race-safety is covered by AC3 per the test plan's own NFR scope note) pass
- [ ] All 3 integration tests (GitHub, Google, email) pass, dispatching through the REAL route handlers
- [ ] `node scripts/run-all-tests.js` shows zero NEW failures beyond the established `check-p3.5-validate-trace.js` baseline
- [ ] Grep check: `grep -rn "req\.session\.token[^A]" src/web-ui/` returns zero results (DoR standards injection, auth-patterns.md)
- [ ] Open a draft PR when all tests pass — do not mark ready for review (DoR Coding Agent Instructions)
