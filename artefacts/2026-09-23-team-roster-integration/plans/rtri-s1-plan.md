# Expose the real team roster as a read API — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/rtri-s1`
**Worktree:** `.worktrees/rtri-s1`
**Test command:** `node scripts/run-all-tests.js` (full suite) / `node tests/check-rtri-s1-team-roster-api.js` (this story's file only)

---

## File map

```
Modify:
  src/web-ui/modules/team-management.js  — add listTeamMembers(pool, tenantId)
  src/web-ui/routes/team-management.js   — add handleGetTeamMembersApi(req, res, pool), plain export
                                            (NOT inside createTeamManagementHandlers's factory)
  src/web-ui/server.js                   — require handleGetTeamMembersApi; register GET /api/team/members
                                            standalone, authGuard + _pshPool
  src/web-ui/adapters/fake-test-db.js    — add a query-pattern branch for listTeamMembers' JOIN query

Create:
  tests/check-rtri-s1-team-roster-api.js — all 5 AC tests + 1 wiring-completeness test
```

---

## Task 1: `listTeamMembers` — AC1, AC2, AC3

**Files:**
- Modify: `src/web-ui/modules/team-management.js`
- Create: `tests/check-rtri-s1-team-roster-api.js`

All three ACs are satisfied by the same single query (an INNER JOIN naturally silently omits unresolvable rows and the `WHERE tenant_id = $1` clause naturally isolates tenants) — one implementation step, three failing tests written first.

- [ ] **Step 1: Write the failing tests**

Create `tests/check-rtri-s1-team-roster-api.js` with this content:

```javascript
#!/usr/bin/env node
// check-rtri-s1-team-roster-api.js — rtri-s1
// Verifies the real team roster read API: listTeamMembers
// (src/web-ui/modules/team-management.js) and handleGetTeamMembersApi
// (src/web-ui/routes/team-management.js). Follows this repo's hand-rolled
// test()/assert style (see tests/check-tir-s3-admin-adds-teammate.js).
//
// AC1: listTeamMembers returns real identity+role for every resolvable member
// AC2: a team_memberships row with no matching person_identities row is
//      silently omitted
// AC3: tenant isolation — only the requested tenant's members are returned
// AC4: GET /api/team/members returns JSON matching the read function's own output
// AC5: unauthenticated request is rejected the same way every other
//      authGuard-protected route already is (302, Location: /)
// Wiring: listTeamMembers also resolves correctly against the real
//      production fake-test-db.js path (NODE_ENV=test server wiring), not
//      just this file's own isolated fake pool

'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

var assert = require('assert');
var path = require('path');

var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  [PASS]', name); })
    .catch(function(err) {
      failed++;
      failures.push({ name: name, err: err });
      console.log('  [FAIL]', name, '--', (err && err.message) || err);
    });
}

var TEAM_MANAGEMENT_PATH = path.resolve(ROOT, 'src/web-ui/modules/team-management.js');
var TEAM_MANAGEMENT_ROUTE_PATH = path.resolve(ROOT, 'src/web-ui/routes/team-management.js');
var FAKE_TEST_DB_PATH = path.resolve(ROOT, 'src/web-ui/adapters/fake-test-db.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function mockReq(overrides) {
  return Object.assign({
    session: {},
    sessionId: 'test-sid-' + Math.random().toString(36).slice(2),
    query: {},
    headers: {},
    body: undefined
  }, overrides || {});
}

function mockRes() {
  var r = { statusCode: null, body: '', headers: {} };
  r.writeHead = function(code, hdrs) { r.statusCode = code; Object.assign(r.headers, hdrs || {}); };
  r.end = function(b) { r.body = (b != null ? String(b) : ''); r._ended = true; };
  return r;
}

// ── Narrow, self-contained in-memory fake pool ──────────────────────────────
// Mirrors tests/check-tir-s3-admin-adds-teammate.js's own makeFakePool
// convention exactly — a narrow, explicit-branch fake, NOT an extension of
// src/web-ui/adapters/fake-test-db.js (that file's own new branch is
// exercised separately, in the wiring-completeness test below).
function makeFakePool() {
  var teamMemberships = []; // { person_id, tenant_id, role }
  var personIdentities = []; // { identity_key, person_id }

  function _norm(sql) {
    return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
  }

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('SELECT TM.ROLE, PI.IDENTITY_KEY FROM TEAM_MEMBERSHIPS TM INNER JOIN PERSON_IDENTITIES PI') === 0) {
      var tenantId = p[0];
      var rows = teamMemberships
        .filter(function(r) { return r.tenant_id === tenantId; })
        .map(function(tm) {
          var pi = personIdentities.filter(function(x) { return x.person_id === tm.person_id; })[0];
          return pi ? { role: tm.role, identity_key: pi.identity_key } : null;
        })
        .filter(function(r) { return r !== null; });
      return Promise.resolve({ rows: rows });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 160));
    return Promise.resolve({ rows: [] });
  }

  // Test-setup helper (not a production query shape) — seeds a fully-resolvable
  // member directly, bypassing SQL, matching tir-s3's own _seedPerson convention.
  function _seedMember(tenantId, personId, role, identityKey) {
    teamMemberships.push({ person_id: personId, tenant_id: tenantId, role: role });
    if (identityKey !== null) {
      personIdentities.push({ identity_key: identityKey, person_id: personId });
    }
  }

  return { query: query, _seedMember: _seedMember };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — listTeamMembers returns real identity + role for every resolvable member
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1ReturnsRealEntries() {
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();

  pool._seedMember('acme', 1, 'engineer', 'alice@example.com');
  pool._seedMember('acme', 2, 'admin', 'bob-gh');

  var members = await teamManagement.listTeamMembers(pool, 'acme');

  assert.strictEqual(members.length, 2, 'AC1: exactly 2 entries returned');
  var byIdentity = {};
  members.forEach(function(m) { byIdentity[m.identity] = m.role; });
  assert.strictEqual(byIdentity['alice@example.com'], 'engineer', 'AC1: alice resolves with her real identity and role');
  assert.strictEqual(byIdentity['bob-gh'], 'admin', 'AC1: bob resolves with his real identity and role');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — a team_memberships row with no matching person_identities row is
// silently omitted
// ─────────────────────────────────────────────────────────────────────────────

async function testAC2SilentlyOmitsUnresolvable() {
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();

  pool._seedMember('acme', 3, 'viewer', null); // no person_identities row for person 3

  var members = await teamManagement.listTeamMembers(pool, 'acme');

  assert.deepStrictEqual(members, [], 'AC2: unresolvable member is silently omitted, not returned as a placeholder/error');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — tenant isolation
// ─────────────────────────────────────────────────────────────────────────────

async function testAC3TenantIsolation() {
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();

  pool._seedMember('acme', 1, 'engineer', 'alice@example.com');
  pool._seedMember('other-tenant', 2, 'admin', 'carol@example.com');

  var members = await teamManagement.listTeamMembers(pool, 'acme');

  assert.strictEqual(members.length, 1, 'AC3: only tenant acme\'s member is returned');
  assert.strictEqual(members[0].identity, 'alice@example.com', 'AC3: the returned member is acme\'s own');
  var identities = members.map(function(m) { return m.identity; });
  assert.ok(identities.indexOf('carol@example.com') === -1, 'AC3: the other tenant\'s member never appears');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner (extended by Tasks 2-4 below)
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[rtri-s1] Running AC verification tests...\n');

  console.log('AC1 — real entries returned');
  await test('AC1: listTeamMembers returns real identity + role for every resolvable member', testAC1ReturnsRealEntries);

  console.log('\nAC2 — unresolvable silently omitted');
  await test('AC2: a team_memberships row with no matching person_identities row is silently omitted', testAC2SilentlyOmitsUnresolvable);

  console.log('\nAC3 — tenant isolation');
  await test('AC3: listTeamMembers never returns another tenant\'s members', testAC3TenantIsolation);

  console.log('\n[rtri-s1] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[rtri-s1] Unexpected error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rtri-s1-team-roster-api.js
```

Expected output: `[FAIL] AC1... -- teamManagement.listTeamMembers is not a function` (and the same for AC2/AC3) — `3 passed, 0 failed` is WRONG at this point; expect `0 passed, 3 failed`.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/modules/team-management.js`, add this function (place it after `getRoleForPersonInTenant`, before `module.exports`):

```javascript
/**
 * List the real, resolvable team members of a tenant (rtri-s1) — joins
 * team_memberships to person_identities so every returned entry carries a
 * real, displayable identity string. A team_memberships row with no
 * matching person_identities row is silently omitted (inner join), matching
 * user-roles.js's own established "no auto-creation, fall through
 * unchanged" convention for unresolvable identities (resolveRoleForPerson,
 * AC4).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {string} tenantId
 * @returns {Promise<{identity: string, role: string}[]>}
 */
async function listTeamMembers(pool, tenantId) {
  var result = await pool.query(
    'SELECT tm.role, pi.identity_key FROM team_memberships tm ' +
    'INNER JOIN person_identities pi ON pi.person_id = tm.person_id ' +
    'WHERE tm.tenant_id = $1',
    [tenantId]
  );
  return result.rows.map(function(r) { return { identity: r.identity_key, role: r.role }; });
}
```

Update `module.exports` at the bottom of the same file to:

```javascript
module.exports = {
  addOrUpdateTeammate,
  getRoleForPersonInTenant,
  listTeamMembers,
  UnknownIdentityError,
  InvalidRoleError,
  VALID_ROLES
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rtri-s1-team-roster-api.js
```

Expected output: `[rtri-s1] 3 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same baseline as `/branch-setup` (698 files, 1 pre-existing failure — `tests/check-p3.5-validate-trace.js` — plus this story's own new file now passing).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/team-management.js tests/check-rtri-s1-team-roster-api.js
git commit -m "feat(rtri-s1): add listTeamMembers, the real team roster read function"
```

---

## Task 2: `handleGetTeamMembersApi` + server.js wiring — AC4

**Files:**
- Modify: `src/web-ui/routes/team-management.js`
- Modify: `src/web-ui/server.js`
- Modify: `tests/check-rtri-s1-team-roster-api.js`

- [ ] **Step 1: Write the failing test**

Add this test function to `tests/check-rtri-s1-team-roster-api.js`, immediately after `testAC3TenantIsolation`:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// AC4 — GET /api/team/members returns JSON matching the read function's own output
// ─────────────────────────────────────────────────────────────────────────────

async function testAC4EndpointReturnsMatchingJson() {
  var teamManagementRoute = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();

  pool._seedMember('acme', 1, 'engineer', 'alice@example.com');
  pool._seedMember('acme', 2, 'admin', 'bob-gh');

  var req = mockReq({ session: { accessToken: 'tok', tenantId: 'acme' } });
  var res = mockRes();

  await teamManagementRoute.handleGetTeamMembersApi(req, res, pool);

  assert.strictEqual(res.statusCode, 200, 'AC4: endpoint responds 200');
  var body = JSON.parse(res.body);
  var directOutput = await teamManagement.listTeamMembers(pool, 'acme');
  assert.deepStrictEqual(body.members, directOutput, 'AC4: response body\'s members array deep-equals the read function\'s own direct-call output');
}
```

Add the call to `main()`, right after the AC3 block and before the `console.log('\n[rtri-s1] ' + passed ...` summary line:

```javascript
  console.log('\nAC4 — endpoint returns matching JSON');
  await test('AC4: GET /api/team/members returns a JSON body matching the read function\'s own output', testAC4EndpointReturnsMatchingJson);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rtri-s1-team-roster-api.js
```

Expected output: `[FAIL] AC4... -- teamManagementRoute.handleGetTeamMembersApi is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/team-management.js`, add this function at module level (NOT inside `createTeamManagementHandlers`'s closure) — place it after the closing brace of `createTeamManagementHandlers`, before `module.exports`:

```javascript
/**
 * GET /api/team/members — real team roster read API (rtri-s1). Deliberately
 * NOT part of createTeamManagementHandlers's factory: that factory is bound
 * to _userRolesPool (real-Postgres-only, no NODE_ENV=test fallback — see
 * server.js line ~131) and its routes are requireAdmin-gated. This endpoint
 * must work for any authenticated tenant member — rtri-s2's picker persona
 * is "product owner or feature lead", not necessarily an admin — and must
 * be testable in NODE_ENV=test, so it takes `pool` as a plain parameter
 * (matches routes/pods.js's handleGetPods exactly) and is wired in
 * server.js with authGuard + _pshPool, not requireAdmin + _userRolesPool.
 * See decisions.md, 2026-09-24, for the full investigation.
 * @param {object} req
 * @param {object} res
 * @param {object} pool
 */
async function handleGetTeamMembersApi(req, res, pool) {
  var tenantId = req.session && req.session.tenantId;
  var members = await teamManagement.listTeamMembers(pool, tenantId);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ members: members }));
}
```

Update `module.exports` at the bottom of the same file to:

```javascript
module.exports = { createTeamManagementHandlers: createTeamManagementHandlers, setLogger: setLogger, handleGetTeamMembersApi: handleGetTeamMembersApi };
```

In `src/web-ui/server.js`, change the require at line ~97 from:

```javascript
const { createTeamManagementHandlers }                               = require('./routes/team-management');       // tir-s3
```

to:

```javascript
const { createTeamManagementHandlers, handleGetTeamMembersApi }       = require('./routes/team-management');       // tir-s3 / rtri-s1
```

In the routing block, immediately before the existing `} else if (pathname === '/api/team/members' && req.method === 'POST') {` block (~line 3664), add:

```javascript
  } else if (pathname === '/api/team/members' && req.method === 'GET') {
    // rtri-s1 — real team roster read API. authGuard (not requireAdmin): any
    // authenticated tenant member can read it. _pshPool (not _userRolesPool/
    // _teamManagementHandlers): works in NODE_ENV=test. See decisions.md,
    // 2026-09-24.
    authGuard(req, res, async () => { await handleGetTeamMembersApi(req, res, _pshPool); });

```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rtri-s1-team-roster-api.js
```

Expected output: `[rtri-s1] 4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same baseline (698 files, 1 pre-existing failure).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/team-management.js src/web-ui/server.js tests/check-rtri-s1-team-roster-api.js
git commit -m "feat(rtri-s1): wire GET /api/team/members (authGuard + _pshPool, standalone from the requireAdmin-gated team-management routes)"
```

---

## Task 3: Unauthenticated rejection — AC5

**Files:**
- Modify: `tests/check-rtri-s1-team-roster-api.js`

No production code change — this task adds a test proving the route registration from Task 2 correctly delegates rejection to `authGuard`'s own real, unmodified behaviour.

- [ ] **Step 1: Write the failing test**

Add this near the top of `tests/check-rtri-s1-team-roster-api.js`, after the `FAKE_TEST_DB_PATH` constant declaration:

```javascript
var router = require(path.resolve(ROOT, 'src/web-ui/server.js')).router;

function makeRawRes() {
  var statusCode = null, headers = {}, chunks = [];
  return {
    writeHead: function(code, h) { statusCode = code; Object.assign(headers, h || {}); },
    setHeader: function(k, v) { headers[k] = v; },
    end: function(body) { if (body != null) chunks.push(body); },
    _get: function() { return { statusCode: statusCode, headers: headers, body: chunks.join('') }; }
  };
}

function dispatchAndAwait(req) {
  return new Promise(function(resolve, reject) {
    var res = makeRawRes();
    var origEnd = res.end;
    var settled = false;
    res.end = function(body) { origEnd(body); if (!settled) { settled = true; resolve(res._get()); } };
    router(req, res).catch(function(err) { if (!settled) { settled = true; reject(err); } });
  });
}
```

Add this test function after `testAC4EndpointReturnsMatchingJson`:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// AC5 — unauthenticated request rejected the same way every other
// authGuard-protected route already is
// ─────────────────────────────────────────────────────────────────────────────

async function testAC5UnauthenticatedRequestRejected() {
  var req = { headers: {}, method: 'GET', url: '/api/team/members' };
  var result = await dispatchAndAwait(req);

  assert.strictEqual(result.statusCode, 302, 'AC5: unauthenticated request is redirected, matching authGuard\'s real, unmodified behaviour (routes/auth.js line ~536)');
  assert.strictEqual(result.headers.Location, '/', 'AC5: redirect target is the sign-in page, matching every other authGuard-protected route (e.g. GET /api/pods)');
}
```

Add the call to `main()`, right after the AC4 block:

```javascript
  console.log('\nAC5 — unauthenticated request rejected');
  await test('AC5: unauthenticated request is rejected the same way every other authGuard-protected route already is', testAC5UnauthenticatedRequestRejected);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rtri-s1-team-roster-api.js
```

Expected output: this test should actually PASS already once Task 2's server.js wiring is in place (authGuard's rejection behaviour requires no new code) — if it fails, it means the route registration from Task 2 is missing or mis-placed. Run this step immediately after Task 2's Step 3 is in place but BEFORE Task 2's own commit, to confirm true red/green discipline: temporarily comment out the new `else if` block from Task 2, confirm this test fails with a 404/wrong-status, then restore it and confirm the test passes. Do not skip this red check.

- [ ] **Step 3: (no implementation step — Task 2 already provides the code)**

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rtri-s1-team-roster-api.js
```

Expected output: `[rtri-s1] 5 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same baseline (698 files, 1 pre-existing failure).

- [ ] **Step 6: Commit**

```bash
git add tests/check-rtri-s1-team-roster-api.js
git commit -m "test(rtri-s1): verify GET /api/team/members rejects unauthenticated requests via the real router (AC5)"
```

---

## Task 4: `fake-test-db.js` wiring completeness

**Files:**
- Modify: `src/web-ui/adapters/fake-test-db.js`
- Modify: `tests/check-rtri-s1-team-roster-api.js`

Not tied to a single numbered AC — this closes the gap flagged in `decisions.md` (2026-09-24): without this, the endpoint returns empty results whenever the real server runs against `createFakeTestDb()` (NODE_ENV=test/CI, no DATABASE_URL), even though this story's own AC1-AC5 tests (which use their own isolated fake pool) would all still pass. This is required for the endpoint to be genuinely functional, not just unit-testable.

- [ ] **Step 1: Write the failing test**

Add this test function to `tests/check-rtri-s1-team-roster-api.js`, after `testAC5UnauthenticatedRequestRejected`:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// Wiring completeness — listTeamMembers also resolves correctly against the
// real production fake-test-db.js path (NODE_ENV=test server wiring), not
// just this file's own isolated fake pool
// ─────────────────────────────────────────────────────────────────────────────

async function testWiringCompletenessAgainstProductionFakeDb() {
  var createFakeTestDb = require(FAKE_TEST_DB_PATH).createFakeTestDb;
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var fakeDb = createFakeTestDb();

  var personResult = await fakeDb.query('INSERT INTO people DEFAULT VALUES');
  var personId = personResult.rows[0].id;
  await fakeDb.query('INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3)', [personId, 'acme', 'engineer']);
  await fakeDb.query('INSERT INTO person_identities (identity_key, person_id, provider) VALUES ($1, $2, $3)', ['carol@example.com', personId, 'email']);

  var members = await teamManagement.listTeamMembers(fakeDb, 'acme');

  assert.deepStrictEqual(members, [{ identity: 'carol@example.com', role: 'engineer' }], 'Wiring: listTeamMembers resolves correctly against the real production fake-test-db.js path used by _pshPool in NODE_ENV=test, not just this file\'s own isolated fake pool');
}
```

Add the call to `main()`, right after the AC5 block and before the summary line:

```javascript
  console.log('\nWiring completeness — production fake-test-db.js path');
  await test('Wiring: listTeamMembers resolves correctly via createFakeTestDb() (the real _pshPool test-mode path)', testWiringCompletenessAgainstProductionFakeDb);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rtri-s1-team-roster-api.js
```

Expected output: `[FAIL] Wiring... -- ` with a `[fake-pool] unhandled query` warning logged and an empty-array assertion mismatch (`members` comes back `[]`, not the expected single entry) — `fake-test-db.js` does not yet recognise `listTeamMembers`'s query text.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/adapters/fake-test-db.js`, add this branch immediately after the existing `// tir-s1: SELECT 1 FROM team_memberships (migration check in migrateTeamSchema)` block (the one ending around line 737, right before the `// ── session_turns_archive (dsh-s6) ──` comment):

```javascript
    // rtri-s1: SELECT ... team_memberships JOIN person_identities
    // (listTeamMembers) -- real team roster read, tenant-scoped; the inner
    // join silently omits any team_memberships row with no matching
    // person_identities row, matching the real production query exactly.
    if (s.indexOf('SELECT TM.ROLE, PI.IDENTITY_KEY FROM TEAM_MEMBERSHIPS TM INNER JOIN PERSON_IDENTITIES PI') === 0) {
      var rosterTenantId = p[0];
      var rosterRows = teamMemberships
        .filter(function(r) { return r.tenant_id === rosterTenantId; })
        .map(function(tm) {
          var pi = personIdentities.filter(function(x) { return x.person_id === tm.person_id; })[0];
          return pi ? { role: tm.role, identity_key: pi.identity_key } : null;
        })
        .filter(function(r) { return r !== null; });
      return Promise.resolve({ rows: rosterRows });
    }

```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rtri-s1-team-roster-api.js
```

Expected output: `[rtri-s1] 6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same baseline (698 files, 1 pre-existing failure). Pay particular attention to any other test file that exercises `fake-test-db.js`'s `team_memberships`/`person_identities` branches (tir-s1/tir-s2/tir-s3/tir-s7's own test files) — this change only ADDS a new branch, it must not alter any existing branch's behaviour.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/fake-test-db.js tests/check-rtri-s1-team-roster-api.js
git commit -m "feat(rtri-s1): extend fake-test-db.js with listTeamMembers' query pattern for NODE_ENV=test wiring completeness"
```

---

## Final check before /verify-completion

- [ ] All 6 tests in `tests/check-rtri-s1-team-roster-api.js` pass
- [ ] `node scripts/run-all-tests.js` shows no NEW failures beyond the acknowledged baseline (`tests/check-p3.5-validate-trace.js`)
- [ ] Walk through `artefacts/2026-09-23-team-roster-integration/verification-scripts/rtri-s1-verification.md` manually (live server, real sign-in) before opening the PR — this is separate from the automated suite and required by `/verify-completion`
