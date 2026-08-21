# Thread the authenticating person's identity through requireAdmin's live role re-check — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** `requireAdmin`'s live per-request role re-check resolves each requester's OWN role, not an arbitrary tenant-mate's, on shared `TENANT_ORG_ALLOWLIST` tenants.
**Branch:** `feature/lrtc-s1`
**Worktree:** `.worktrees/lrtc-s1`
**Test command:** `node tests/check-sec-perf-s2-stale-role-revalidation.js`

---

## File map

```
Modify:
  src/web-ui/middleware/require-admin.js   — pass req.session.login as the identityKey to the live re-check
  src/web-ui/server.js                     — both setGetCurrentRole wiring sites accept + forward identityKey
  tests/check-sec-perf-s2-stale-role-revalidation.js — add AC1/AC2 tests against the real resolveRoleForPerson chain
```

---

## Task 1: RED — write the two failing tests first

**Files:**
- Modify: `tests/check-sec-perf-s2-stale-role-revalidation.js`

- [ ] **Step 1: Add a minimal in-memory fake pool**

Add near the top of the file, after the existing `freshRequire`/`makeRes` helpers (mirrors `tests/check-tir-s7-person-scoped-login-resolution.js`'s own `makeFakePool`, narrowed to only the query shapes this file's new tests need):

```javascript
function makeFakePool(personIdentities, teamMemberships) {
  var _pi = (personIdentities || []).slice();
  var _tm = (teamMemberships || []).slice();
  function query(sql, params) {
    var s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
    var p = params || [];
    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var match = _pi.filter(function(r) { return r.identity_key === p[0]; });
      return Promise.resolve({ rows: match.map(function(r) { return { person_id: r.person_id }; }) });
    }
    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND') === -1) {
      var fb = _tm.filter(function(r) { return r.tenant_id === p[0]; });
      return Promise.resolve({ rows: fb.length ? [{ person_id: fb[0].person_id }] : [] });
    }
    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE PERSON_ID') === 0 && s.indexOf('AND TENANT_ID') !== -1) {
      var scoped = _tm.filter(function(r) { return r.person_id === p[0] && r.tenant_id === p[1]; });
      return Promise.resolve({ rows: scoped.length ? [{ role: scoped[0].role }] : [] });
    }
    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var legacy = _tm.filter(function(r) { return r.tenant_id === p[0]; });
      return Promise.resolve({ rows: legacy.length ? [{ role: legacy[0].role }] : [] });
    }
    return Promise.resolve({ rows: [] });
  }
  return { query: query };
}
```

- [ ] **Step 2: Add the AC1 test (two people, one tenant)**

Add as a new queue entry, near the existing T8 (after it, not replacing it):

```javascript
  // ── AC1 (lrtc-s1): live re-check resolves each person's OWN role via the
  // REAL resolveRoleForPerson chain -- NOT a hand-substituted mock like T8
  // above. T8 wires setGetCurrentRole to a closure that ignores its tenantId
  // argument and branches on an external test variable instead -- it never
  // exercises the real argument-passing bug this test is designed to catch.
  queue.push(function() {
    console.log('\n[lrtc-s1] T13 -- two people sharing one tenant resolve to two different, correct roles via the REAL resolution chain (AC1)');
    return test('requireAdmin live re-check: person-X (admin) granted, person-Y (engineer) denied despite stale cached admin role', async function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      var userRoles = freshRequire(USER_ROLES_PATH);
      var pool = makeFakePool(
        [{ identity_key: 'person-X', person_id: 1 }, { identity_key: 'person-Y', person_id: 2 }],
        [{ person_id: 1, tenant_id: 'shared-tenant', role: 'admin' }, { person_id: 2, tenant_id: 'shared-tenant', role: 'engineer' }]
      );
      userRoles.setGetRoleForTenant(function(tenantId, identityKey) {
        return userRoles.resolveRoleForPerson ? userRoles.resolveRoleForPerson(pool, identityKey || tenantId, tenantId)
          : Promise.reject(new Error('resolveRoleForPerson not exported'));
      });
      m.setGetCurrentRole(function(tenantId, identityKey) { return userRoles.getRoleForTenant(tenantId, identityKey); });

      var reqX = { session: { userId: 'person-X', tenantId: 'shared-tenant', login: 'person-X', role: 'user' } };
      var resX = makeRes();
      var nextX = false;
      await m.requireAdmin(reqX, resX, function() { nextX = true; });
      assert.ok(nextX, 'person-X (admin) should be granted');

      var reqY = { session: { userId: 'person-Y', tenantId: 'shared-tenant', login: 'person-Y', role: 'admin' } };
      var resY = makeRes();
      var nextY = false;
      await m.requireAdmin(reqY, resY, function() { nextY = true; });
      assert.ok(!nextY, 'person-Y (engineer) should be denied, even though session was cached as admin');
      assert.strictEqual(resY._status, 403, 'Expected 403, got ' + resY._status);
    });
  });
```

- [ ] **Step 3: Add the AC2 regression test (solo tenant)**

```javascript
  queue.push(function() {
    console.log('\n[lrtc-s1] T14 -- solo-tenant call pattern unchanged (AC2, regression check)');
    return test('requireAdmin live re-check: solo tenant (tenantId === identity) still resolves correctly', async function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      var userRoles = freshRequire(USER_ROLES_PATH);
      var pool = makeFakePool(
        [{ identity_key: 'solo-person', person_id: 3 }],
        [{ person_id: 3, tenant_id: 'solo-person', role: 'admin' }]
      );
      userRoles.setGetRoleForTenant(function(tenantId, identityKey) {
        return userRoles.resolveRoleForPerson(pool, identityKey || tenantId, tenantId);
      });
      m.setGetCurrentRole(function(tenantId, identityKey) { return userRoles.getRoleForTenant(tenantId, identityKey); });

      var req = { session: { userId: 'solo-person', tenantId: 'solo-person', login: 'solo-person', role: 'user' } };
      var res = makeRes();
      var nextCalled = false;
      await m.requireAdmin(req, res, function() { nextCalled = true; });
      assert.ok(nextCalled, 'solo-tenant admin should be granted, unchanged from before this story');
    });
  });
```

- [ ] **Step 4: Run — both new tests must fail**

```bash
node tests/check-sec-perf-s2-stale-role-revalidation.js
```

Expected output: `[FAIL] requireAdmin live re-check: person-X (admin) granted, person-Y (engineer) denied despite stale cached admin role` — because `requireAdmin`'s current call passes no `identityKey`, so `resolveRoleForPerson` can't resolve `person-Y` distinctly from `person-X`. AC2's test is expected to pass already (solo tenant is unaffected either way) — that's fine, it's a regression guard, not required to be red.

- [ ] **Step 5: Commit the failing test**

```bash
git add tests/check-sec-perf-s2-stale-role-revalidation.js
git commit -m "test(lrtc-s1): add failing test proving requireAdmin's live re-check collapses distinct tenant-mates to one role"
```

---

## Task 2: GREEN — thread the identity through

**Files:**
- Modify: `src/web-ui/middleware/require-admin.js`
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Update require-admin.js's live re-check call**

Find:
```javascript
  if (hasSession && _getCurrentRole) {
    try {
      role = await _getCurrentRole(req.session.tenantId);
```

Replace with:
```javascript
  if (hasSession && _getCurrentRole) {
    try {
      role = await _getCurrentRole(req.session.tenantId, req.session.login);
```

- [ ] **Step 2: Update server.js's real-DATABASE_URL wiring**

Find (inside `if (process.env.DATABASE_URL) { ... }`):
```javascript
    setGetCurrentRole(function(tenantId) {
      return getRoleForTenant(tenantId);
    });
```

Replace with:
```javascript
    setGetCurrentRole(function(tenantId, identityKey) {
      return getRoleForTenant(tenantId, identityKey);
    });
```

- [ ] **Step 3: Update server.js's fake-test-db wiring**

Find (inside `if (!process.env.DATABASE_URL) { ... }`, added by rbg-s1):
```javascript
    setGetCurrentRole(function(tenantId) {
      return getRoleForTenant(tenantId);
    });
    console.log('[rbg-s1] fake in-memory team_memberships role adapter wired (NODE_ENV=test, no DATABASE_URL)');
```

Replace with:
```javascript
    setGetCurrentRole(function(tenantId, identityKey) {
      return getRoleForTenant(tenantId, identityKey);
    });
    console.log('[rbg-s1/lrtc-s1] fake in-memory team_memberships role adapter wired, identity-aware (NODE_ENV=test, no DATABASE_URL)');
```

- [ ] **Step 4: Run — both new tests must pass**

```bash
node tests/check-sec-perf-s2-stale-role-revalidation.js
```

Expected output: `14 passed, 0 failed` (T1-T12 unchanged, T13/T14 now pass).

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/middleware/require-admin.js src/web-ui/server.js
git commit -m "fix(lrtc-s1): thread req.session.login through requireAdmin's live role re-check"
```

---

## Task 3: AC3 — confirm rbg-s1's own E2E test passes unmodified

**Files:**
- None (verification only)

- [ ] **Step 1: Run rbg-s1's AC1 E2E test**

```bash
npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js -g "AC1: admin"
```

Expected output: `1 passed` — alice `200`, bob `403`. No changes to the spec file itself (it already has rbg-s1's WIP commit cherry-picked onto this branch).

- [ ] **Step 2: No commit needed**

Verification only — Task 1 and Task 2 already made the only real file changes this story requires.

---
