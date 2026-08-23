# Wire the viewer-write-block gate to edge-case routes — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/vrne-s4`
**Worktree:** `.worktrees/vrne-s4`
**Test command:** `node tests/check-vrne-s4-edge-case-gate.js` (targeted, AC1-AC4/AC6) + `node tests/check-vrne-s4-agency-org-type-regression.js` (targeted, AC5) / `node scripts/run-all-tests.js` (full suite — reserved for branch-setup baseline, verify-completion, and branch-complete only, per `skills/subagent-execution/SKILL.md`'s loop-design update — **check for an already-fresh same-session result before dispatching a new run**, per the lesson logged from `vrne-s3`'s metric overrun)

**Commit cadence:** Write task state locally after each task (no fetch, no commit). Commit in a batch at natural checkpoints — after Task 2 (RED+GREEN for the isolated-gate ACs and wiring), and once more after Tasks 3-4 — not after every individual task.

---

## Background: 3 call sites, 2 different test-mocking patterns needed

This story wires `requireNonViewer` (built in `vrne-s1`, unmodified since, `src/web-ui/middleware/require-non-viewer.js`) into 3 routes, all Pattern A (`authGuard`-wrapped at `server.js`):

1. `POST /agency/clients/new` — `server.js:3587-3594`, handler `handlePostCreateClient` in `src/web-ui/routes/agency-provisioning.js` (via factory `createAgencyProvisioningHandlers(pool)`)
2. `POST /agency/clients/:id/invite` — `server.js:3606-3614`, handler `handlePostInviteUser`, same file/factory
3. `POST /api/artefacts/:slug/annotations` — `server.js:2586-2589`, handler `handlePostAnnotation` in `src/web-ui/routes/annotation.js`

**Two findings from pre-implementation investigation, both logged in `decisions.md` (2026-08-23, implementation-plan RISK-ACCEPT entry) — read that entry for full rationale:**

1. **The test plan's literal AC1/AC2/AC4/AC5 precondition wording (`req.session.org_type = 'agency'`) does not match reality.** `handlePostCreateClient`/`handlePostInviteUser` never read `org_type` from `req.session` — it's DB-resolved via `organisations.resolveOrganisationForTenant(pool, tenantId)`. This plan uses the established hand-built fake-pool pattern from `tests/check-story3-self-service-provisioning.js` (`pool._seedOrg(tenantId, name, orgType)` + `createAgencyProvisioningHandlers(pool)` + direct handler calls) instead.
2. **Routes 1/2 cannot get a real-dispatch integration test in this repo's standard test harness.** `_agencyProvisioningHandlers` (`server.js`) is only wired inside `if (process.env.DATABASE_URL) {...}` — under `NODE_ENV=test` with no `DATABASE_URL` (the same setup all 3 prior sibling stories' integration tests use), real `router()` dispatch to routes 1/2 hits a 503 guard before ever reaching `authGuard`. Real-dispatch integration coverage is only achievable for route 3 (annotations, no such dependency). Routes 1/2's real-wiring evidence instead comes from: isolated gate tests (AC1/AC2/AC4/AC6) + a grep-count check + AC5's fake-pool direct-handler tests.

`requireNonViewer` only reads `req.session.role`/`userId`/`tenantId`/`login` and `req.url` — nothing org-related — so the isolated-gate-only test pattern from the 3 prior sibling stories remains valid and sufficient for AC1-AC4/AC6 on all 3 routes.

**Insertion point:** all 3 gates are added at the `server.js` level, inside the existing `authGuard(...)` callback, immediately before the handler call, matching every other `requireNonViewer` call site's convention — no changes to `agency-provisioning.js`/`annotation.js` themselves are needed.

**Ordering and AC5's test design:** the new gate runs at `server.js`, strictly BEFORE the handler is called — so it also runs before the handler's own internal org-type check. This means AC5's regression test cannot use a `viewer` role (a viewer would be denied by the new gate first, never reaching the org-type check, which would prove nothing about the pre-existing check's own behaviour). Instead, AC5's tests use `engineer` — a role that passes the new gate cleanly — at a non-Agency org, which correctly isolates the org-type check as the only thing left that can deny the request. This matches the test plan's own AC5 precondition ("a role that would otherwise pass the new gate") and Task 3's tests call the handler functions directly (bypassing `server.js`/the new gate entirely), which is the cleanest way to prove the org-type check itself is untouched and still independently enforced.

---

## File map

```
Modify:
  src/web-ui/server.js — wire requireNonViewer into all 3 call sites (AC1, AC2, AC3)

Create:
  tests/check-vrne-s4-edge-case-gate.js — AC1-AC4, AC6 isolated gate tests + 1 real-dispatch integration test (annotations route only)
  tests/check-vrne-s4-agency-org-type-regression.js — AC5 fake-pool direct-handler tests
```

---

## Task 1: RED — write failing tests for AC1/AC2/AC3/AC4/AC6

**Files:**
- Create: `tests/check-vrne-s4-edge-case-gate.js`

- [ ] **Step 1: Write the test file**

Queue-based custom runner, matching the established sibling pattern (`check-vrne-s3-billing-gate.js`). AC1/AC2/AC3 (viewer denied) and AC4 (engineer/admin unaffected) call `requireNonViewer` directly — isolated gate-behaviour tests. AC6 tests denial logging.

```js
'use strict';

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var REQUIRE_NON_VIEWER_PATH = path.resolve(__dirname, '../src/web-ui/middleware/require-non-viewer.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

function viewerSession() {
  return { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' } };
}

async function main() {
  var queue = [];

  // AC1/AC2/AC3 -- viewer denied on all 3 routes
  [
    { ac: 'AC1', routeName: 'agency-client-new' },
    { ac: 'AC2', routeName: 'agency-client-invite' },
    { ac: 'AC3', routeName: 'annotation' }
  ].forEach(function(c) {
    queue.push(function() {
      console.log('\n[vrne-s4] T-' + c.ac.toLowerCase() + '-' + c.routeName + ' -- viewer denied');
      return test(c.ac + ': viewer denied on ' + c.routeName, async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = viewerSession();
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.strictEqual(nextCalled, false, c.routeName + ': next() must not be called for viewer');
        assert.strictEqual(res._status, 403, c.routeName + ': status must be 403');
      });
    });
  });

  // AC4 -- engineer/admin unaffected
  [
    { role: 'engineer', route: 'agency-client-new' },
    { role: 'admin',    route: 'agency-client-invite' }
  ].forEach(function(c) {
    queue.push(function() {
      console.log('\n[vrne-s4] T-ac4-' + c.role + '-' + c.route + ' -- non-viewer unaffected');
      return test('AC4: role=' + c.role + ' proceeds on ' + c.route, async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = { session: { userId: 'u2', role: c.role, tenantId: 't1', login: c.role + '@test' } };
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.ok(nextCalled, 'next() should be called for role=' + c.role);
        assert.strictEqual(res._status, null, 'no response should be written for allowed roles');
      });
    });
  });

  // AC6 -- denial logging
  queue.push(function() {
    console.log('\n[vrne-s4] T-ac6-denial-logged -- edge-case route denial logged');
    return test('AC6: denial on an edge-case route logs personId, tenantId, timestamp, route', async function() {
      var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
      var loggedEvent = null;
      var loggedPayload = null;
      gate.setLogger({ warn: function(event, payload) { loggedEvent = event; loggedPayload = payload; } });
      var req = { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' }, url: '/agency/clients/new' };
      var res = makeRes();
      await gate.requireNonViewer(req, res, function() {});
      assert.strictEqual(loggedEvent, 'viewer_write_denied');
      assert.strictEqual(loggedPayload.personId, 'u1');
      assert.strictEqual(loggedPayload.tenantId, 't1');
      assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(loggedPayload.timestamp));
      assert.strictEqual(loggedPayload.route, '/agency/clients/new');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[vrne-s4-edge-case-gate] AC1+AC2+AC3+AC4+AC6 subtotal: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
```

- [ ] **Step 2: Run test — passes immediately**

```bash
node tests/check-vrne-s4-edge-case-gate.js
```

Expected: `6 passed, 0 failed` (3 viewer-denied route tests + 2 AC4 tests + 1 AC6 test). RED for this story is proven by Task 2's grep-count check, not this run — same reasoning as the 3 prior sibling stories' Task 1.

- [ ] **Steps 3–6:** N/A for this task — Task 1 is test-authoring only. Commit deferred to Task 2 checkpoint.

---

## Task 2: GREEN — wire requireNonViewer into all 3 call sites, plus annotation integration test

**Files:**
- Modify: `src/web-ui/server.js`
- Modify: `tests/check-vrne-s4-edge-case-gate.js` (append integration test)

- [ ] **Step 1: Wire `/agency/clients/new`**

```js
  } else if (pathname === '/agency/clients/new' && req.method === 'POST') {
    // story-3-self-service-provisioning — create the Client org + relationship (AC1/AC2/AC4)
    if (!_agencyProvisioningHandlers) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Agency provisioning unavailable');
    } else {
      // vrne-s4 — viewer-role write-block gate (AC1)
      authGuard(req, res, async () => {
        let _rnvOk = false;
        await requireNonViewer(req, res, () => { _rnvOk = true; });
        if (!_rnvOk) return;
        await _agencyProvisioningHandlers.handlePostCreateClient(req, res);
      });
    }
```

- [ ] **Step 2: Wire `/agency/clients/:id/invite`**

```js
  } else if (pathname.match(/^\/agency\/clients\/[^/]+\/invite$/) && req.method === 'POST') {
    // story-3-self-service-provisioning — issue the invitation (AC3, AC5)
    req.params = { id: pathname.split('/')[3] };
    if (!_agencyProvisioningHandlers) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Agency provisioning unavailable');
    } else {
      // vrne-s4 — viewer-role write-block gate (AC2)
      authGuard(req, res, async () => {
        let _rnvOk = false;
        await requireNonViewer(req, res, () => { _rnvOk = true; });
        if (!_rnvOk) return;
        await _agencyProvisioningHandlers.handlePostInviteUser(req, res);
      });
    }
```

- [ ] **Step 3: Wire `/api/artefacts/:slug/annotations`**

```js
  } else if (pathname.startsWith('/api/artefacts/') && pathname.endsWith('/annotations') && req.method === 'POST') {
    // vrne-s4 — viewer-role write-block gate (AC3)
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handlePostAnnotation(req, res);
    });
```

- [ ] **Step 4: Append a real-dispatch integration test for the annotation route only** (routes 1/2 excluded per the 503-gap RISK-ACCEPT — see Background)

Mirror the established `T-integration-real-dispatch` pattern (`check-vrne-s1-server-wiring.js`, reused in `check-vrne-s2`/`check-vrne-s3`), with the `require()` calls for `server.js`/`session.js` placed LAST — inside the integration test's own queued closure, not at module top level (the now-established lesson from `vrne-s2`/`vrne-s3`, to avoid the live role-adapter overriding the earlier isolated tests' literal mock role):

```js
queue.push(function() {
  console.log('\n[vrne-s4] T-integration-real-dispatch -- real server.js dispatch denies viewer on /api/artefacts/:slug/annotations');
  return test('integration: requireNonViewer reachable via real server.js dispatch', async function() {
    // env vars required to require('../src/web-ui/server') -- must be set BEFORE
    // that require() below runs. Mirrors check-vrne-s2/-s3's own setup.
    process.env.NODE_ENV             = 'test';
    process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
    process.env.GITHUB_CLIENT_ID     = 'test-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-secret';
    process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
    delete process.env.POSTHOG_KEY;
    delete process.env.DATABASE_URL;

    var router = require('../src/web-ui/server').router;
    var seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;
    var EventEmitter = require('events').EventEmitter;

    function integrationMockRes() {
      var _statusCode = null;
      var _headers = {};
      var _chunks = [];
      return {
        writeHead: function(code, headers) { _statusCode = code; Object.assign(_headers, headers || {}); return this; },
        setHeader: function(k, v) { _headers[k] = v; },
        end: function(body) { if (body != null) _chunks.push(body); },
        _get: function() { return { statusCode: _statusCode, headers: _headers, body: _chunks.join('') }; }
      };
    }

    function dispatchAndAwaitResponse(req) {
      return new Promise(function(resolve, reject) {
        var res = integrationMockRes();
        var settled = false;
        var origEnd = res.end;
        res.end = function(body) {
          origEnd(body);
          if (!settled) { settled = true; resolve(res._get()); }
        };
        router(req, res).catch(function(err) {
          if (!settled) { settled = true; reject(err); }
        });
      });
    }

    function seedMultiUserRolesForIntegrationTest(sharedOrg) {
      return new Promise(function(resolve, reject) {
        var req = new EventEmitter();
        req.method = 'POST';
        req.url = '/test/seed-multi-user-roles';
        req.headers = { 'content-type': 'application/json' };
        var res = integrationMockRes();
        var origEnd = res.end;
        res.end = function(body) {
          origEnd(body);
          var result = res._get();
          if (result.statusCode !== 200) {
            reject(new Error('seed-multi-user-roles failed: ' + result.statusCode + ' ' + result.body));
          } else {
            resolve(result);
          }
        };
        router(req, res).then(function() {
          req.emit('data', JSON.stringify({ sharedOrg: sharedOrg }));
          req.emit('end');
        }).catch(reject);
      });
    }

    var sharedOrg = 'e2e-vrne-s4-integration';
    await seedMultiUserRolesForIntegrationTest(sharedOrg);

    var sessionId = 'faceb00c04';
    seedTestSession(sessionId, {
      accessToken: 'e2e-test-access-token',
      userId: 9001,
      login: 'e2e-viewer',
      tenantId: sharedOrg
    });
    var cookieHeader = { cookie: 'session_id=' + sessionId };

    var req1 = { headers: Object.assign({ 'content-type': 'application/json' }, cookieHeader), method: 'POST', url: '/api/artefacts/artefacts%2Ftest%2Fdiscovery.md/annotations' };
    var result1 = await dispatchAndAwaitResponse(req1);
    assert.strictEqual(result1.statusCode, 403, 'POST /api/artefacts/:slug/annotations must return 403 for a viewer-role session, got ' + result1.statusCode + ' -- ' + result1.body);
  });
});
```

- [ ] **Step 5: Run targeted test — must pass**

```bash
node tests/check-vrne-s4-edge-case-gate.js
```

Expected: `AC1+AC2+AC3+AC4+AC6 subtotal: 7 passed, 0 failed` (6 from Task 1 + 1 integration test).

- [ ] **Step 6: Grep-count check**

```bash
grep -c "requireNonViewer" src/web-ui/server.js
```

Expected: count increases by 3 from the pre-story baseline (43, from `vrne-s1`+`vrne-s2`+`vrne-s3`) to 46.

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/server.js tests/check-vrne-s4-edge-case-gate.js
git commit -m "feat: wire viewer-write-block gate into agency-provisioning and annotation routes (AC1-AC4, AC6)"
```

---

## Task 3: AC5 — org-type-check-still-fires regression tests (additive, not replacing)

**Files:**
- Create: `tests/check-vrne-s4-agency-org-type-regression.js`

**Why a separate file:** this test does not exercise the new `requireNonViewer` gate at all — it is a pure regression guard on `agency-provisioning.js`'s PRE-EXISTING org-type check, proving the new gate did not accidentally weaken or replace it (the story's single most important regression test, per the test plan). It uses a completely different test infrastructure (hand-built fake pool + direct handler calls, mirroring `tests/check-story3-self-service-provisioning.js`) than the isolated gate tests in Task 1/2, so it belongs in its own file rather than forcing two incompatible test-harness styles into one.

- [ ] **Step 1: Write the test file**

```js
'use strict';

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var AGENCY_PROVISIONING_PATH = path.resolve(__dirname, '../src/web-ui/routes/agency-provisioning.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

// Minimal fake pool -- only the ORGANISATIONS query shape this test path touches.
// Mirrors tests/check-story3-self-service-provisioning.js's makeFakePool/_seedOrg convention.
function makeFakePool() {
  var orgs = [];
  var queryLog = [];
  function _norm(sql) { return String(sql).trim().replace(/\s+/g, ' ').toUpperCase(); }
  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];
    queryLog.push({ sql: s, params: p });
    if (s.indexOf('SELECT ORG_ID, NAME, ORG_TYPE, CREATED_AT FROM ORGANISATIONS WHERE ORG_ID') === 0) {
      var match = orgs.filter(function(r) { return r.org_id === p[0]; });
      return Promise.resolve({ rows: match });
    }
    console.warn('[fake-vrne-s4-pool] unhandled query (returning empty rows): ' + s.slice(0, 150));
    return Promise.resolve({ rows: [] });
  }
  return {
    query: query,
    _state: function() { return { orgs: orgs, queryLog: queryLog }; },
    _seedOrg: function(orgId, name, orgType) { orgs.push({ org_id: orgId, name: name, org_type: orgType, created_at: new Date().toISOString() }); }
  };
}

function mockRes() {
  return { _s: null, _b: null, status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; } };
}

async function main() {
  var queue = [];

  // AC5 -- non-agency org still denied for /agency/clients/new, even with a role
  // that would pass the new gate (engineer) -- isolates the pre-existing org-type
  // check specifically, proving the new gate didn't replace or weaken it.
  queue.push(function() {
    console.log('\n[vrne-s4] T-ac5-non-agency-still-denied-create-client');
    return test('AC5: non-agency org still denied on /agency/clients/new (engineer role)', async function() {
      var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
      var pool = makeFakePool();
      pool._seedOrg('standard-org-1', 'Some Org', 'standard');
      var handlers = provisioning.createAgencyProvisioningHandlers(pool);
      var req = { session: { userId: 'u1', role: 'engineer', tenantId: 'standard-org-1', login: 'eng@test' }, body: { name: 'Should Not Be Created' } };
      var res = mockRes();
      await handlers.handlePostCreateClient(req, res);
      assert.strictEqual(res._s, 403, 'expected 403 from the pre-existing org-type check');
      assert.strictEqual(pool._state().orgs.length, 1, 'no new organisations row should be created (only the seeded org should exist)');
    });
  });

  // AC5 -- same for /agency/clients/:id/invite
  queue.push(function() {
    console.log('\n[vrne-s4] T-ac5-non-agency-still-denied-invite');
    return test('AC5: non-agency org still denied on /agency/clients/:id/invite (engineer role)', async function() {
      var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
      var pool = makeFakePool();
      pool._seedOrg('standard-org-2', 'Some Org 2', 'standard');
      var handlers = provisioning.createAgencyProvisioningHandlers(pool);
      var req = { session: { userId: 'u1', role: 'engineer', tenantId: 'standard-org-2', login: 'eng@test' }, params: { id: 'client-1' }, body: { email: 'invitee@test.com' } };
      var res = mockRes();
      await handlers.handlePostInviteUser(req, res);
      assert.strictEqual(res._s, 403, 'expected 403 from the pre-existing org-type check');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[vrne-s4-agency-org-type-regression] AC5 subtotal: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
```

- [ ] **Step 2: Run test — must pass immediately (no implementation change needed — this tests pre-existing, unmodified code)**

```bash
node tests/check-vrne-s4-agency-org-type-regression.js
```

Expected: `AC5 subtotal: 2 passed, 0 failed`. This should pass whether run before or after Task 2's wiring change — it's a true regression guard, not a temporarily-true assertion. Confirm it still passes after Task 2 (it will, since these calls go directly to the handler functions, bypassing `server.js`'s new gate entirely).

- [ ] **Step 3: Commit (batched — deferred to Task 4 checkpoint)**

```bash
git add tests/check-vrne-s4-agency-org-type-regression.js
git commit -m "test: add AC5 org-type-check regression guard (additive, not replacing)"
```

---

## Task 4: Full regression — confirm all 9 planned tests pass, zero regressions

**Files:** None modified — verification only.

- [ ] **Step 1: Run both of the story's own targeted test files**

```bash
node tests/check-vrne-s4-edge-case-gate.js
node tests/check-vrne-s4-agency-org-type-regression.js
```

Expected: `7 passed, 0 failed` and `2 passed, 0 failed` respectively (9 tests total).

- [ ] **Step 2: Run the full suite (anchor point 2 of 3 — branch-setup baseline, this check, and branch-complete). Check first whether a fresh full-suite result already exists from a very recent step in this same session before dispatching a new run — do not re-run redundantly (lesson from `vrne-s3`'s metric overrun).**

```bash
node scripts/run-all-tests.js
```

Expected: `539 file(s) run` (537 baseline + 2 new test files), `0 failed` or exactly the one pre-existing `check-p3.5-validate-trace.js` pwsh-timeout flake already RISK-ACCEPTed — no other failures.

- [ ] **Step 3: Confirm `vrne-s1`/`vrne-s2`/`vrne-s3`'s own test suites still pass unmodified (regression guard)**

```bash
node tests/check-vrne-s1-require-non-viewer.js
node tests/check-vrne-s1-server-wiring.js
node tests/check-vrne-s2-skill-session-gate.js
node tests/check-vrne-s3-billing-gate.js
```

Expected: `10 passed, 0 failed`, `35 passed, 0 failed`, `18 passed, 0 failed`, `6 passed, 0 failed` respectively — identical to their post-DoD counts.

- [ ] **Step 4: Confirm `tests/check-story3-self-service-provisioning.js` (the pre-existing agency-provisioning test suite) is genuinely unaffected**

```bash
node tests/check-story3-self-service-provisioning.js
```

Expected: passes at its pre-story count — this file calls `handlePostCreateClient`/`handlePostInviteUser` directly (bypassing `server.js`'s new `authGuard`+`requireNonViewer` wrapper entirely), so it should be unaffected, matching the same pre-verified-safe pattern already confirmed for `vrne-s3`'s checkout/CSRF test files.

- [ ] **Step 5: Confirm `tests/check-wuce8-annotation.js` (the pre-existing annotation test suite) is genuinely unaffected**

```bash
node tests/check-wuce8-annotation.js
```

Expected: passes at its pre-story count — this file calls `handlePostAnnotation` directly, same reasoning as Step 4.

- [ ] **Step 6: No implementation changes expected at this step** — this task exists to produce the verify-completion evidence, not to modify files.
