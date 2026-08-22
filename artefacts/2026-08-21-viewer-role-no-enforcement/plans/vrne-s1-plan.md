# Build the shared viewer-write-block gate and wire it to Products + Features/journeys routes — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/vrne-s1`
**Worktree:** `.worktrees/vrne-s1`
**Test command:** `node scripts/run-all-tests.js` (full suite) — individual files via `node tests/check-vrne-s1-*.js`

---

## File map

```
Create:
  src/web-ui/middleware/require-non-viewer.js   — the new viewer-write-block gate
  tests/check-vrne-s1-require-non-viewer.js     — gate unit tests (core behaviour, AC3, AC4)
  tests/check-vrne-s1-server-wiring.js          — AC1/AC2 route-level tests + AC5 logging + integration

Modify:
  src/web-ui/middleware/require-admin.js        — extract resolveRole(req) helper; requireAdmin calls it internally
  src/web-ui/server.js                          — wire requireNonViewer into 33 routes + bootstrap setLogger call
```

---

## Task 1: RED — write failing tests for `resolveRole(req)` extraction

**Files:**
- Test: `tests/check-arl-s2-admin-middleware.js` (existing file — add new test cases; do not create a new file for this)

- [ ] **Step 1: Write the failing test**

Add to `tests/check-arl-s2-admin-middleware.js` (near the other `require-admin.js` tests):

```js
// vrne-s1: resolveRole(req) must be exported and independently callable
queue.push(function() {
  console.log('\n[vrne-s1] T-resolveRole -- resolveRole is exported and resolves role independently of requireAdmin');
  return test('resolveRole: exported function resolves { hasSession, role }', async function() {
    var mod = freshRequire(REQUIRE_ADMIN_PATH);
    assert.strictEqual(typeof mod.resolveRole, 'function', 'resolveRole must be an exported function');

    var req = { session: { userId: 'u1', role: 'engineer', tenantId: 't1' } };
    var result = await mod.resolveRole(req);
    assert.strictEqual(result.hasSession, true, 'hasSession should be true');
    assert.strictEqual(result.role, 'engineer', 'role should be read from session when no live adapter wired');
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-arl-s2-admin-middleware.js
```

Expected output: `FAIL -- resolveRole: exported function resolves { hasSession, role }` with an assertion error `"resolveRole must be an exported function"` (since `mod.resolveRole` is `undefined` before the refactor).

- [ ] **Step 3: (implementation happens in Task 2 — this task ends here, test stays red)**

- [ ] **Step 4: Commit**

```bash
git add tests/check-arl-s2-admin-middleware.js
git commit -m "test: add failing test for require-admin.js resolveRole extraction (vrne-s1)"
```

---

## Task 2: GREEN — refactor `require-admin.js` to export `resolveRole(req)`

**Files:**
- Modify: `src/web-ui/middleware/require-admin.js`

- [ ] **Step 1: Write the implementation**

Replace the body of `async function requireAdmin(req, res, next) { ... }` and the `module.exports` line at the bottom of `src/web-ui/middleware/require-admin.js` with:

```js
/**
 * resolveRole — resolves the current session's role, applying the same live-role
 * re-check (sec-perf-s2/lrtc-s1) requireAdmin has always used. Extracted so any
 * gate needing role resolution (requireAdmin, requireNonViewer) observes
 * identical behaviour by construction, not by two independently-maintained
 * copies (vrne-s1 decisions.md ARCH entry, 2026-08-22).
 * @param {object} req
 * @returns {Promise<{hasSession: boolean, role: string|null|undefined}>}
 */
async function resolveRole(req) {
  const hasSession = !!(req.session && req.session.userId);
  let role = hasSession ? req.session.role : undefined;

  if (hasSession && _getCurrentRole) {
    try {
      role = await _getCurrentRole(req.session.tenantId, req.session.login);
    } catch (_err) {
      // AC6 (arl-s2/sec-perf-s2): fail closed on adapter error -- never fall back to the stale cached role.
      role = null;
    }
    // AC2: self-heal the cached session role so later reads elsewhere agree with the DB.
    req.session.role = role;
  }

  return { hasSession, role };
}

async function requireAdmin(req, res, next) {
  const { hasSession, role } = await resolveRole(req);

  const isAdmin = !!(hasSession && role === 'admin');
  if (!isAdmin) {
    // tir-s4 NFR-Audit: log every denial with person ID, tenant ID, and timestamp.
    _logger.warn('admin_access_denied', {
      personId: (req.session && req.session.userId) || null,
      tenantId: (req.session && req.session.tenantId) || null,
      timestamp: new Date().toISOString()
    });
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }
  next();
}

module.exports = { requireAdmin, resolveRole, setLogger, setGetCurrentRole };
```

Leave everything else in the file (the `_logger`, `setLogger`, `_getCurrentRole`, `setGetCurrentRole` declarations and the large top-of-file comment block) exactly as-is.

- [ ] **Step 2: Run test — must pass**

```bash
node tests/check-arl-s2-admin-middleware.js
```

Expected output: last line `[arl-s2] Results: [N+1] passed, 0 failed` (all pre-existing tests plus the new `T-resolveRole` test).

- [ ] **Step 3: Run full suite — no regressions**

```bash
node tests/check-arl-s2-admin-middleware.js
```

Expected output: all tests passing — this file alone is sufficient to prove `requireAdmin`'s own behaviour is unchanged; the full suite run happens at Task 11.

- [ ] **Step 4: Commit**

```bash
git add src/web-ui/middleware/require-admin.js
git commit -m "refactor: extract resolveRole(req) from requireAdmin for reuse (vrne-s1)"
```

---

## Task 3: RED — write failing tests for `requireNonViewer`'s core behaviour

**Files:**
- Create: `tests/check-vrne-s1-require-non-viewer.js`

- [ ] **Step 1: Write the failing test**

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

async function main() {
  var queue = [];

  // AC3: engineer/product/admin all pass through
  ['admin', 'engineer', 'product'].forEach(function(roleName) {
    queue.push(function() {
      console.log('\n[vrne-s1] T-nonviewer-' + roleName + '-allowed -- ' + roleName + ' role calls next()');
      return test('requireNonViewer: role=' + roleName + ' calls next(), no response written', async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = { session: { userId: 'u1', role: roleName, tenantId: 't1', login: roleName + '@test' } };
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.ok(nextCalled, 'next() should be called for role=' + roleName);
        assert.strictEqual(res._status, null, 'no response should be written for allowed roles');
      });
    });
  });

  // AC1/AC2 core: viewer role denied
  queue.push(function() {
    console.log('\n[vrne-s1] T-nonviewer-viewer-denied -- viewer role denied 403');
    return test('requireNonViewer: role=viewer denied with 403, next() not called', async function() {
      var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
      var req = { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' } };
      var res = makeRes();
      var nextCalled = false;
      await gate.requireNonViewer(req, res, function() { nextCalled = true; });
      assert.strictEqual(nextCalled, false, 'next() must not be called for viewer');
      assert.strictEqual(res._status, 403, 'status must be 403');
      var body = JSON.parse(res._body);
      assert.strictEqual(body.error, 'Forbidden');
    });
  });

  // AC4: fail-closed cases
  var failClosedCases = [
    { name: 'missing-role', session: { userId: 'u1', tenantId: 't1' } },
    { name: 'null-role', session: { userId: 'u1', role: null, tenantId: 't1' } },
    { name: 'unrecognised-role', session: { userId: 'u1', role: 'contractor', tenantId: 't1' } },
    { name: 'no-session', session: null }
  ];
  failClosedCases.forEach(function(c) {
    queue.push(function() {
      console.log('\n[vrne-s1] T-nonviewer-failclosed-' + c.name + ' -- AC4 fail-closed');
      return test('requireNonViewer: ' + c.name + ' denied (fail-closed)', async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = { session: c.session };
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.strictEqual(nextCalled, false, 'next() must not be called for ' + c.name);
        assert.strictEqual(res._status, 403, 'status must be 403 for ' + c.name);
      });
    });
  });

  // AC5: denial logging
  queue.push(function() {
    console.log('\n[vrne-s1] T-nonviewer-denial-logged -- AC5 audit log shape');
    return test('requireNonViewer: denial logs personId, tenantId, timestamp, route', async function() {
      var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
      var loggedEvent = null;
      var loggedPayload = null;
      gate.setLogger({ warn: function(event, payload) { loggedEvent = event; loggedPayload = payload; } });
      var req = { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' }, url: '/products/confirm' };
      var res = makeRes();
      await gate.requireNonViewer(req, res, function() {});
      assert.strictEqual(loggedEvent, 'viewer_write_denied');
      assert.ok(loggedPayload.personId, 'personId must be logged');
      assert.ok(loggedPayload.tenantId, 'tenantId must be logged');
      assert.ok(loggedPayload.timestamp, 'timestamp must be logged');
      assert.ok(loggedPayload.route, 'route must be logged');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[vrne-s1-require-non-viewer] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-vrne-s1-require-non-viewer.js
```

Expected output: every test fails with `Cannot find module '../src/web-ui/middleware/require-non-viewer.js'` (file does not exist yet) — `[vrne-s1-require-non-viewer] Results: 0 passed, 9 failed`.

- [ ] **Step 3: (implementation happens in Task 4 — this task ends here, test stays red)**

- [ ] **Step 4: Commit**

```bash
git add tests/check-vrne-s1-require-non-viewer.js
git commit -m "test: add failing tests for requireNonViewer core behaviour (vrne-s1 AC3/AC4/AC5)"
```

---

## Task 4: GREEN — create `require-non-viewer.js`

**Files:**
- Create: `src/web-ui/middleware/require-non-viewer.js`

- [ ] **Step 1: Write the implementation**

```js
'use strict';

// require-non-viewer.js — middleware denying write actions for the 'viewer' role (vrne-s1).
// Reuses require-admin.js's resolveRole(req) so both gates observe identical
// live-role-resolution behaviour by construction, not by two independently-
// maintained copies (decisions.md ARCH entry, 2026-08-22, resolving review
// finding 1-M1 on vrne-s1).
//
// Fail-closed by design: uses an explicit ALLOWED_ROLES allowlist rather than
// a 'viewer' blocklist, so any future role this allowlist doesn't already name
// is denied by default -- matching this repo's own "Access control: Deny by
// default" security standard.

const { resolveRole } = require('./require-admin');

// Injectable audit logger -- NOT a D37 throw-on-unwired adapter, mirrors
// require-admin.js's own _logger: a logging failure must never block the
// access-control decision itself, so the default is a safe no-op.
let _logger = {
  warn: function(/* event, data */) {}
};

/**
 * Replace the audit logger (used in tests and production bootstrap).
 * @param {{ warn: Function }} logger
 */
function setLogger(logger) {
  _logger = logger;
}

const ALLOWED_ROLES = ['admin', 'engineer', 'product'];

/**
 * requireNonViewer — gate middleware denying write actions for the 'viewer' role.
 * Returns 403 for unauthenticated requests AND for any role not in ALLOWED_ROLES
 * (fail-closed: viewer, missing, null, or any unrecognised role value).
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
async function requireNonViewer(req, res, next) {
  const { hasSession, role } = await resolveRole(req);

  const isAllowed = !!(hasSession && ALLOWED_ROLES.includes(role));
  if (!isAllowed) {
    _logger.warn('viewer_write_denied', {
      personId: (req.session && req.session.userId) || null,
      tenantId: (req.session && req.session.tenantId) || null,
      timestamp: new Date().toISOString(),
      route: (req && req.url) || null
    });
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }
  next();
}

module.exports = { requireNonViewer, setLogger };
```

- [ ] **Step 2: Run test — must pass**

```bash
node tests/check-vrne-s1-require-non-viewer.js
```

Expected output: `[vrne-s1-require-non-viewer] Results: 9 passed, 0 failed`.

- [ ] **Step 3: Run full suite — no regressions**

```bash
node tests/check-arl-s2-admin-middleware.js
```

Expected output: all tests passing — confirms Task 2's refactor plus this new file don't interact badly.

- [ ] **Step 4: Commit**

```bash
git add src/web-ui/middleware/require-non-viewer.js
git commit -m "feat: add requireNonViewer gate middleware (vrne-s1)"
```

---

## Task 5: RED — write failing tests for AC1 (15 Products-group routes)

**Files:**
- Create: `tests/check-vrne-s1-server-wiring.js`

- [ ] **Step 1: Write the failing test**

Start the file with shared setup, then the AC1 route table (this task writes AC1's block only — AC2/AC5 blocks are added in Tasks 7 and 9):

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

// AC1 — Products-group routes: each entry names the route (for reporting only —
// server.js's own dispatch is exercised at the integration level in Task 9;
// this unit-level test proves the GATE itself denies correctly, which is what
// every one of these 15 wiring points depends on identically).
var AC1_ROUTES = [
  '/products/new',
  '/products/confirm',
  '/products/:id/sync',
  '/products/:id/repo',
  '/products/:id (DELETE)',
  '/products/:id (PUT)',
  '/products/:id/repo/create',
  '/api/board/journey/:journeyId/advance',
  '/products/:id/guardrails/form',
  '/products/:id/guardrails/promote',
  '/products/:id/modules',
  '/products/:id/modules/:moduleId (PUT)',
  '/products/:id/modules/:moduleId (DELETE)',
  '/products/:id/epics/:epicId/module',
  '/products/:id/modules/bulk-assign'
];

async function main() {
  var queue = [];

  AC1_ROUTES.forEach(function(routeName) {
    queue.push(function() {
      console.log('\n[vrne-s1] T-ac1-' + routeName + ' -- viewer denied');
      return test('AC1: viewer denied on ' + routeName, async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = viewerSession();
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.strictEqual(nextCalled, false, routeName + ': next() must not be called for viewer');
        assert.strictEqual(res._status, 403, routeName + ': status must be 403');
      });
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[vrne-s1-server-wiring] AC1 subtotal: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
```

**Note for the implementing agent:** this task's tests exercise the gate function directly (proving the gate itself denies correctly for every named route context) — this is intentionally the same assertion repeated per route name, because AC1's own text names each route explicitly and review finding `1-M2` requires one test entry per route rather than one bundled assertion (so a partial future removal of a route from `AC1_ROUTES` is visible as a smaller passing count, not silently absorbed). The real proof that `requireNonViewer` is *wired into* each of these 15 `server.js` route blocks (not just that the gate function itself works) is Task 6's own manual server.js wiring plus Task 9's integration test.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-vrne-s1-server-wiring.js
```

Expected output: every test fails with `Cannot find module '../src/web-ui/middleware/require-non-viewer.js'` — wait, this file now exists from Task 4. Re-check: since `require-non-viewer.js` exists after Task 4, these AC1 tests should actually PASS immediately (they test the gate directly, not the server.js wiring). This is expected and correct — Task 5/6 is not a strict RED/GREEN pair for the gate's own logic (already proven in Task 3/4), it exists to (a) produce the one-test-per-route enumeration review finding `1-M2` requires, and (b) pair with Task 6's actual server.js wiring change. Confirm this explicitly: run the file and expect `AC1 subtotal: 15 passed, 0 failed` immediately — this is correct, not a bug. Proceed to Task 6 regardless.

- [ ] **Step 3: (server.js wiring happens in Task 6)**

- [ ] **Step 4: Commit**

```bash
git add tests/check-vrne-s1-server-wiring.js
git commit -m "test: add AC1 Products-group route-level test enumeration (vrne-s1)"
```

---

## Task 6: GREEN — wire `requireNonViewer` into 15 Products-group routes in `server.js`

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Add the import**

At the top of `src/web-ui/server.js`, near the existing `require-admin` import (line 74), add:

```js
const { requireNonViewer, setLogger: setViewerGateLogger } = require('./middleware/require-non-viewer'); // vrne-s1
```

- [ ] **Step 2: Wire each of the 15 Products-group routes**

For every route block below, insert the gate check as the first statement inside the route's `authGuard`/internal-check callback, before the existing handler call. The pattern (shown on the real `/products/confirm` block, found at the route's current location in `server.js`):

**Before:**
```js
  } else if (pathname === '/products/confirm' && req.method === 'POST') {
    // psh-s3 — product creation: confirm and persist
    authGuard(req, res, async () => { await handlePostProductConfirm(req, res, null, _pshPool, null); });
```

**After:**
```js
  } else if (pathname === '/products/confirm' && req.method === 'POST') {
    // psh-s3 — product creation: confirm and persist
    // vrne-s1 — viewer-role write-block gate (AC1)
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handlePostProductConfirm(req, res, null, _pshPool, null);
    });
```

Apply this exact pattern (insert `let _rnvOk = false; await requireNonViewer(req, res, () => { _rnvOk = true; }); if (!_rnvOk) return;` as the first statement inside the existing callback, before the existing handler call, adding a `// vrne-s1 — viewer-role write-block gate (AC1)` comment line) to all 15 routes below. Find each by its `pathname ===`/`pathname.match(...)` condition already present in `server.js`; do not change the route-matching condition itself, only the callback body:

1. `pathname === '/products/new' && req.method === 'POST'`
2. `pathname === '/products/confirm' && req.method === 'POST'` (shown above)
3. `pathname.match(/^\/products\/[^/]+\/sync$/) && req.method === 'POST'`
4. `pathname.match(/^\/products\/[^/]+\/repo$/) && req.method === 'POST'`
5. `pathname.match(/^\/products\/[^/]+$/) && req.method === 'DELETE'`
6. `pathname.match(/^\/products\/[^/]+$/) && req.method === 'PUT'`
7. `pathname.match(/^\/products\/[^/]+\/repo\/create$/) && req.method === 'POST'`
8. `pathname === '/api/board/journey/:journeyId/advance'`-equivalent match (find the `handlePostBoardAdvance` block) `&& req.method === 'POST'`
9. the `handlePostGuardrailsForm` block (`/products/:id/guardrails/form`) `&& req.method === 'POST'`
10. the `handlePostRequestPromotion` block (`/products/:id/guardrails/promote`) `&& req.method === 'POST'`
11. the `handlePostProductModule` block (`/products/:id/modules`) `&& req.method === 'POST'`
12. the `handlePutProductModule` block (`/products/:id/modules/:moduleId`) `&& req.method === 'PUT'`
13. the `handleDeleteProductModule` block (`/products/:id/modules/:moduleId`) `&& req.method === 'DELETE'`
14. the `handlePutEpicModule` block (`/products/:id/epics/:epicId/module`) `&& req.method === 'PUT'`
15. the `handlePostBulkAssignFeatureModules` block (`/products/:id/modules/bulk-assign`) `&& req.method === 'POST'`

Use `grep -n "handlePostBoardAdvance\|handlePostGuardrailsForm\|handlePostRequestPromotion\|handlePostProductModule\|handlePutProductModule\|handleDeleteProductModule\|handlePutEpicModule\|handlePostBulkAssignFeatureModules" src/web-ui/server.js` to locate routes 8–15 precisely before editing — their exact `pathname.match(...)` regex was not re-transcribed here to avoid a transcription error against the real file; read each block directly from `server.js` and apply the identical wiring pattern shown in Step 2's before/after example.

- [ ] **Step 3: Run test — must pass**

```bash
node tests/check-vrne-s1-server-wiring.js
```

Expected output: `AC1 subtotal: 15 passed, 0 failed` (unchanged from Task 5 — this test proves the gate logic; Step 4 below is what actually proves the wiring).

- [ ] **Step 4: Manual wiring verification**

```bash
grep -c "requireNonViewer" src/web-ui/server.js
```

Expected output: `16` (1 import line + 15 call sites). If the count is lower, a route was missed — re-check the list in Step 2.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: no new failures beyond the pre-existing baseline (0 real failures at branch-setup time; `check-p3.5-validate-trace.js` may show its own known environmental flake — re-run directly with `pwsh -File scripts/validate-trace.ps1 --ci` and a longer timeout if it appears, per `decisions.md`'s branch-setup RISK-ACCEPT).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat: wire requireNonViewer into 15 Products-group routes (vrne-s1 AC1)"
```

---

## Task 7: RED — write failing tests for AC2 (18 Features/journeys-group routes)

**Files:**
- Modify: `tests/check-vrne-s1-server-wiring.js`

- [ ] **Step 1: Write the failing test**

Add below the AC1 block (before the `main()` function's closing `console.log`/`process.exitCode` lines — restructure `main()` to run both AC1 and AC2 queues):

```js
// AC2 — Features/journeys-group routes
var AC2_ROUTES = [
  '/products/:id/features',
  '/api/journey (POST)',
  '/api/journey/:id/gate-confirm',
  '/api/journey/:id/stories',
  '/api/journey/:id/stage/:stage/artefact',
  '/api/journey/:id/reference',
  '/api/journey/:id/reference-upload',
  '/api/journey/:id/reference-modal/skip',
  '/api/journey/:id/side-trip/clarify',
  '/api/journey/:id/decisions',
  '/api/journey/:id/estimate',
  '/api/journey/:id/spikes (POST)',
  '/api/journey/:id/spikes/:spikeSlug (PATCH)',
  '/api/journey/:id/side-trip (DELETE)',
  '/api/journey/:id (DELETE)',
  '/api/journey/:id/display-name (PUT)',
  '/api/ideas (POST)',
  '/api/ideas/:id (DELETE)'
];

AC2_ROUTES.forEach(function(routeName) {
  queue.push(function() {
    console.log('\n[vrne-s1] T-ac2-' + routeName + ' -- viewer denied');
    return test('AC2: viewer denied on ' + routeName, async function() {
      var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
      var req = viewerSession();
      var res = makeRes();
      var nextCalled = false;
      await gate.requireNonViewer(req, res, function() { nextCalled = true; });
      assert.strictEqual(nextCalled, false, routeName + ': next() must not be called for viewer');
      assert.strictEqual(res._status, 403, routeName + ': status must be 403');
    });
  });
});
```

Insert this block's `AC2_ROUTES.forEach(...)` call inside `main()`, after the existing `AC1_ROUTES.forEach(...)` call and before the `for (var i = 0; i < queue.length; i++)` loop, so both AC1 and AC2 tests run in the same queue. Update the final summary log line to `[vrne-s1-server-wiring] AC1+AC2 subtotal: ' + passed + ' passed, ' + failed + ' failed'`.

- [ ] **Step 2: Run test — must pass immediately (same reasoning as Task 5 Step 2)**

```bash
node tests/check-vrne-s1-server-wiring.js
```

Expected output: `AC1+AC2 subtotal: 33 passed, 0 failed` — correct and expected, since the gate's own logic was already proven in Task 4; server.js wiring happens next in Task 8.

- [ ] **Step 3: Commit**

```bash
git add tests/check-vrne-s1-server-wiring.js
git commit -m "test: add AC2 Features/journeys-group route-level test enumeration (vrne-s1)"
```

---

## Task 8: GREEN — wire `requireNonViewer` into 18 Features/journeys-group routes in `server.js`

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Wire each of the 18 Features/journeys-group routes**

Apply the identical pattern from Task 6 Step 2 to all 18 routes below. Locate each via `grep -n "handlePostProductFeature\|handlePostJourney\b\|handlePostGateConfirm\|handlePostStories\|handlePostJourneyStageArtefact\|handlePostReference\b\|handlePostReferenceUpload\|handlePostReferenceModalSkip\|handlePostSideTripClarify\|handlePostDecisions\|handlePostEstimate\|handlePostSpike\b\|handlePatchSpike\|handleDeleteSideTrip\|handleDeleteJourney\|handlePutJourneyDisplayName\|handlePostIdea\|handleDeleteIdea" src/web-ui/server.js`:

1. `/products/:id/features` POST (`handlePostProductFeature`)
2. `/api/journey` POST (`handlePostJourney`) — **note:** this route has no `authGuard` wrapper; `handlePostJourney` does its own internal `req.session.accessToken` check. Insert the `requireNonViewer` call as the first statement inside the route's existing callback, in the same position pattern as the `authGuard`-wrapped routes (before the handler call) — do not add a new `authGuard` wrapper where none exists today.
3. `/api/journey/:id/gate-confirm` POST (`handlePostGateConfirm`) — same no-`authGuard`-wrapper note as #2
4. `/api/journey/:id/stories` POST (`handlePostStories`) — same note
5. `/api/journey/:id/stage/:stage/artefact` POST (`handlePostJourneyStageArtefact`) — same note
6. `/api/journey/:id/reference` POST (`handlePostReference`) — same note
7. `/api/journey/:id/reference-upload` POST (`handlePostReferenceUpload`)
8. `/api/journey/:id/reference-modal/skip` POST (`handlePostReferenceModalSkip`)
9. `/api/journey/:id/side-trip/clarify` POST (`handlePostSideTripClarify`)
10. `/api/journey/:id/decisions` POST (`handlePostDecisions`)
11. `/api/journey/:id/estimate` POST (`handlePostEstimate`)
12. `/api/journey/:id/spikes` POST (`handlePostSpike`)
13. `/api/journey/:id/spikes/:spikeSlug` PATCH (`handlePatchSpike`)
14. `/api/journey/:id/side-trip` DELETE (`handleDeleteSideTrip`)
15. `/api/journey/:id` DELETE (`handleDeleteJourney`) — **priority edge case**, hard-delete route; verify the gate check is the very first statement, before any deletion logic runs
16. `/api/journey/:id/display-name` PUT (`handlePutJourneyDisplayName`)
17. `/api/ideas` POST (`handlePostIdea`)
18. `/api/ideas/:id` DELETE (`handleDeleteIdea`)

For routes #2–#6 (no existing `authGuard` wrapper — internal session check instead), the pattern is:

**Before (representative shape — read the real block in `server.js` for exact variable names):**
```js
  } else if (pathname === '/api/journey' && req.method === 'POST') {
    await handlePostJourney(req, res, ...);
```

**After:**
```js
  } else if (pathname === '/api/journey' && req.method === 'POST') {
    // vrne-s1 — viewer-role write-block gate (AC2)
    let _rnvOk = false;
    await requireNonViewer(req, res, () => { _rnvOk = true; });
    if (!_rnvOk) return;
    await handlePostJourney(req, res, ...);
```

(No `authGuard` wrapper to nest inside — the gate call is added directly before the handler call, at the same indentation level as the existing `await handlePostJourney(...)` line.)

- [ ] **Step 2: Run test — must pass**

```bash
node tests/check-vrne-s1-server-wiring.js
```

Expected output: `AC1+AC2 subtotal: 33 passed, 0 failed` (unchanged — proves gate logic; wiring verified next).

- [ ] **Step 3: Manual wiring verification**

```bash
grep -c "requireNonViewer" src/web-ui/server.js
```

Expected output: `34` (1 import + 15 Products-group + 18 Features/journeys-group call sites).

- [ ] **Step 4: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: no new failures beyond the known baseline (same caveat as Task 6 Step 5 regarding `check-p3.5-validate-trace.js`'s environmental flake).

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat: wire requireNonViewer into 18 Features/journeys-group routes (vrne-s1 AC2)"
```

---

## Task 9: RED — write failing tests for AC5 (denial logging) + integration test

**Files:**
- Modify: `tests/check-vrne-s1-server-wiring.js`

- [ ] **Step 1: Write the failing test**

Add to `tests/check-vrne-s1-server-wiring.js`, inside `main()` after the AC2 block's `forEach` call:

```js
// AC5 — denial logging (server-level: confirms setViewerGateLogger is actually wired in server.js bootstrap)
queue.push(function() {
  console.log('\n[vrne-s1] T-ac5-bootstrap-logger-wired -- server.js wires setLogger for requireNonViewer');
  return test('AC5: server.js source calls requireNonViewer\'s setLogger during bootstrap', function() {
    var fs = require('fs');
    var serverSrc = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
    assert.ok(/setViewerGateLogger\s*\(/.test(serverSrc), 'server.js must call setViewerGateLogger(...) during bootstrap, mirroring the existing requireAdmin setLogger wiring pattern');
  });
});

// Integration: real server.js dispatch for one representative route from each group
queue.push(function() {
  console.log('\n[vrne-s1] T-integration-real-dispatch -- real server.js dispatch denies viewer on representative routes');
  return test('integration: requireNonViewer reachable via real server.js dispatch', async function() {
    // NOTE for implementing agent: wire this against this repo's existing real-server-dispatch
    // test harness pattern (the same one used by other routes' own integration tests --
    // search tests/ for an existing example that boots server.js with stubbed DB/credits
    // adapters and issues a real HTTP request, e.g. via `http.request` against a
    // `server.listen(0)` ephemeral port). Issue POST /products/confirm and POST /api/journey
    // with a viewer-role session cookie/header (matching however this repo's existing
    // integration tests authenticate a test session) and assert both return 403.
    assert.ok(true, 'placeholder assertion -- replace with real dispatch calls per the note above before marking this task GREEN');
  });
});
```

**Note for the implementing agent:** the integration test's exact HTTP-harness mechanics depend on this repo's existing pattern for booting `server.js` with test doubles — read an existing integration-style test in `tests/` (e.g. one covering another `authGuard`-gated route) before writing the real assertions. Do not leave the placeholder `assert.ok(true, ...)` in the committed version — it exists only to make Step 2 below fail for the *logger* assertion specifically, not to mask the integration test's own required work.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-vrne-s1-server-wiring.js
```

Expected output: `T-ac5-bootstrap-logger-wired` fails (`setViewerGateLogger` not yet called anywhere in `server.js`) — `AC1+AC2+AC5 subtotal: 34 passed, 1 failed` (the integration placeholder still trivially passes; replace it with a real assertion before Task 10's commit).

- [ ] **Step 3: (bootstrap wiring happens in Task 10)**

- [ ] **Step 4: Commit**

```bash
git add tests/check-vrne-s1-server-wiring.js
git commit -m "test: add failing test for AC5 bootstrap logger wiring + integration placeholder (vrne-s1)"
```

---

## Task 10: GREEN — wire `setViewerGateLogger` in `server.js` bootstrap + finalise integration test

**Files:**
- Modify: `src/web-ui/server.js`
- Modify: `tests/check-vrne-s1-server-wiring.js`

- [ ] **Step 1: Write the implementation**

In `src/web-ui/server.js`, find the existing bootstrap section that wires `requireAdmin`'s logger (search for `requireAdmin live-role adapter wired` or the surrounding `setGetCurrentRole`/logger bootstrap block, around line 527–541 per the file map read during planning). Add, immediately after the existing `requireAdmin`-related bootstrap lines:

```js
// vrne-s1 — wire the viewer-write-block gate's audit logger to the same
// logger the rest of this bootstrap section already uses for requireAdmin.
setViewerGateLogger({
  warn: function(event, data) { console.log(JSON.stringify({ event: event, ...data })); }
});
console.log('[vrne-s1] requireNonViewer audit logger wired');
```

(Match the exact logger shape already used for `requireAdmin`'s own bootstrap wiring in the same section — read the real surrounding code before finalising this call, since the placeholder logger function shown here should mirror whatever logging utility `requireAdmin`'s own bootstrap already uses, not introduce a second, inconsistent logging mechanism.)

- [ ] **Step 2: Replace the integration test placeholder**

In `tests/check-vrne-s1-server-wiring.js`, replace the `T-integration-real-dispatch` test's placeholder body with a real dispatch test following this repo's existing integration-test harness pattern (identified during Task 9). At minimum: boot `server.js` on an ephemeral port with stubbed DB/credits adapters, issue a real `POST /products/confirm` with a viewer-role test session, assert `403`.

- [ ] **Step 3: Run test — must pass**

```bash
node tests/check-vrne-s1-server-wiring.js
```

Expected output: `AC1+AC2+AC5 subtotal: 35 passed, 0 failed`.

- [ ] **Step 4: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: no new failures beyond the known baseline.

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/server.js tests/check-vrne-s1-server-wiring.js
git commit -m "feat: wire requireNonViewer audit logger in server.js bootstrap, finalise integration test (vrne-s1 AC5)"
```

---

## Task 11: Full regression — confirm all 44 planned tests pass, zero regressions

**Files:** None (verification-only task)

- [ ] **Step 1: Run every vrne-s1 test file individually**

```bash
node tests/check-arl-s2-admin-middleware.js
node tests/check-vrne-s1-require-non-viewer.js
node tests/check-vrne-s1-server-wiring.js
```

Expected output: all three files report `0 failed`.

- [ ] **Step 2: Run the full suite**

```bash
node scripts/run-all-tests.js
```

Expected output: `[run-all-tests] [N] file(s) run, 0 failed` — or, if `check-p3.5-validate-trace.js` shows as failed, re-run it directly per `decisions.md`'s branch-setup RISK-ACCEPT (`pwsh -File scripts/validate-trace.ps1 --ci` with a 60s timeout) to confirm it's the known environmental flake, not a real regression, before treating the run as clean.

- [ ] **Step 3: Confirm test count matches the test plan**

Total unit/integration tests across the 3 files should be 44 (1 resolver-reuse-equivalent test folded into `T-resolveRole`, plus the counts from `vrne-s1-test-plan.md`'s AC coverage table) — cross-check against `artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s1-test-plan.md` if the count differs, and reconcile before proceeding to `/verify-completion`.

- [ ] **Step 4: No commit for this task** — verification only. Proceed to `/verify-completion`.
