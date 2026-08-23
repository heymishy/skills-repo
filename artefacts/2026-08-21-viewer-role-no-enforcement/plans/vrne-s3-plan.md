# Wire the viewer-write-block gate to Credits/billing routes — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/vrne-s3`
**Worktree:** `.worktrees/vrne-s3`
**Test command:** `node tests/check-vrne-s3-billing-gate.js` (targeted) / `node scripts/run-all-tests.js` (full suite — reserved for branch-setup baseline, verify-completion, and branch-complete only, per `skills/subagent-execution/SKILL.md`'s loop-design update)

**Commit cadence:** Write task state locally after each task (no fetch, no commit). Commit in a batch at natural checkpoints — after the RED+GREEN pair (Task 2), and once more after the remaining tasks — not after every individual task.

---

## Background

This story wires the existing `requireNonViewer` gate (built in `vrne-s1`, `src/web-ui/middleware/require-non-viewer.js`) into exactly **one** call site: `POST /billing/checkout`, wired via `authGuard` at `src/web-ui/server.js:3049-3051` (Pattern A, identical idiom to `vrne-s1`/`vrne-s2`'s other Pattern-A call sites):

```js
} else if (pathname === '/billing/checkout' && req.method === 'POST') {
  // lab-s3.2 — Stripe Checkout session creation
  authGuard(req, res, async () => { await handlePostCheckout(req, res); });
```

`requireNonViewer` is already imported in `server.js` (used by 41 pre-existing call sites from `vrne-s1`/`vrne-s2`) — no new import needed.

**Pre-verified, no regression risk:** two pre-existing test files call `POST /billing/checkout`-adjacent behaviour — `tests/check-lab-s3.2-stripe-checkout.js` and `tests/check-sec-perf-s3-billing-checkout-csrf.js` — but both call `billing.handlePostCheckout(req, res)` **directly**, bypassing `server.js`'s `authGuard` wrapper (and therefore this story's new gate) entirely. Confirmed via source read before this plan was written. Unlike `vrne-s2`'s Pattern-B call sites (which gate *inside* the handler and were reachable by direct handler-level test calls), this story's single Pattern-A call site cannot be hit by tests that bypass the router — so the `vrne-s2`-style mock-session regression cannot recur here.

`POST /webhook/stripe` (`handlePostStripeWebhook`) has no `req.session`/role concept at all — raw-body Stripe-signature verification only. It is explicitly out of scope (AC4 is a regression guard confirming the gate was never applied to it).

---

## File map

```
Modify:
  src/web-ui/server.js — wire requireNonViewer into the /billing/checkout POST branch (AC1)

Create:
  tests/check-vrne-s3-billing-gate.js — AC1-AC4 tests
```

---

## Task 1: RED — write failing tests for AC1/AC2/AC3/AC4

**Files:**
- Create: `tests/check-vrne-s3-billing-gate.js`

- [ ] **Step 1: Write the test file**

Queue-based custom runner, matching `tests/check-vrne-s1-require-non-viewer.js`'s established pattern. AC1 (viewer denied) and AC2 (engineer/admin unaffected) call `requireNonViewer` directly — isolated gate-behaviour tests, matching the established `vrne-s1`/`vrne-s2` pattern (real-wiring proof for the one call site comes from the grep-count check in Task 2 plus a real-dispatch integration test in this same task, not per-test spies). AC3 tests denial logging. AC4 is a static-source regression guard confirming the gate was never wired into the webhook route.

```js
'use strict';

var assert = require('assert');
var path = require('path');
var fs = require('fs');

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
var SERVER_JS_PATH = path.resolve(__dirname, '../src/web-ui/server.js');

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

  // AC1 — viewer denied on /billing/checkout
  queue.push(function() {
    console.log('\n[vrne-s3] T-ac1-billing-checkout -- viewer denied');
    return test('AC1: viewer denied on billing-checkout', async function() {
      var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
      var req = viewerSession();
      var res = makeRes();
      var nextCalled = false;
      await gate.requireNonViewer(req, res, function() { nextCalled = true; });
      assert.strictEqual(nextCalled, false, 'next() must not be called for viewer');
      assert.strictEqual(res._status, 403, 'status must be 403');
    });
  });

  // AC2 — engineer/admin roles unaffected
  ['engineer', 'admin'].forEach(function(roleName) {
    queue.push(function() {
      console.log('\n[vrne-s3] T-ac2-' + roleName + '-billing-checkout -- non-viewer unaffected');
      return test('AC2: role=' + roleName + ' proceeds on billing-checkout', async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = { session: { userId: 'u2', role: roleName, tenantId: 't1', login: roleName + '@test' } };
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.ok(nextCalled, 'next() should be called for role=' + roleName);
        assert.strictEqual(res._status, null, 'no response should be written for allowed roles');
      });
    });
  });

  // AC3 — denial logging
  queue.push(function() {
    console.log('\n[vrne-s3] T-ac3-denial-logged -- billing-checkout denial logged');
    return test('AC3: denial on billing-checkout logs personId, tenantId, timestamp, route', async function() {
      var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
      var loggedEvent = null;
      var loggedPayload = null;
      gate.setLogger({ warn: function(event, payload) { loggedEvent = event; loggedPayload = payload; } });
      var req = { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' }, url: '/billing/checkout' };
      var res = makeRes();
      await gate.requireNonViewer(req, res, function() {});
      assert.strictEqual(loggedEvent, 'viewer_write_denied');
      assert.strictEqual(loggedPayload.personId, 'u1');
      assert.strictEqual(loggedPayload.tenantId, 't1');
      assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(loggedPayload.timestamp));
      assert.strictEqual(loggedPayload.route, '/billing/checkout');
    });
  });

  // AC4 — /webhook/stripe unaffected by the gate (static-source regression guard)
  queue.push(function() {
    console.log('\n[vrne-s3] T-ac4-webhook-unaffected -- gate not applied to /webhook/stripe');
    return test('AC4: /webhook/stripe route branch does not call requireNonViewer', function() {
      var serverSrc = fs.readFileSync(SERVER_JS_PATH, 'utf8');
      var webhookIdx = serverSrc.indexOf("pathname === '/webhook/stripe'");
      var checkoutIdx = serverSrc.indexOf("pathname === '/billing/checkout'");
      assert.ok(webhookIdx > -1, '/webhook/stripe branch must exist in server.js');
      assert.ok(checkoutIdx > -1, '/billing/checkout branch must exist in server.js');
      // Slice from the webhook branch to the next " } else if (" branch boundary
      // and confirm requireNonViewer does not appear inside that slice.
      var nextBranchIdx = serverSrc.indexOf('} else if (', webhookIdx);
      var webhookBranchSrc = serverSrc.slice(webhookIdx, nextBranchIdx);
      assert.ok(!webhookBranchSrc.includes('requireNonViewer'), '/webhook/stripe branch must not call requireNonViewer');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[vrne-s3-billing-gate] AC1+AC2+AC3+AC4 subtotal: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
```

- [ ] **Step 2: Run test — mixed result expected**

```bash
node tests/check-vrne-s3-billing-gate.js
```

Expected output: `5 passed, 0 failed`. AC1/AC2/AC3 pass immediately (isolated gate tests against the already-built `requireNonViewer` — same reasoning as `vrne-s1`/`vrne-s2`'s Task 1). **AC4 passing at this point is the real RED signal for this story**: since the gate hasn't been wired into `/billing/checkout` yet, `requireNonViewer` also doesn't appear near the webhook branch, so AC4 trivially passes — but it should *continue* passing after Task 2's wiring (a true regression guard, not a temporarily-true assertion). Confirm AC4 still passes after Task 2 as the real verification.

- [ ] **Steps 3–6:** N/A for this task — Task 1 is test-authoring only, no implementation step. Commit deferred to Task 2 checkpoint.

---

## Task 2: GREEN — wire requireNonViewer into /billing/checkout, plus integration test

**Files:**
- Modify: `src/web-ui/server.js`
- Modify: `tests/check-vrne-s3-billing-gate.js` (append integration test)

- [ ] **Step 1: Wire the gate**

```js
} else if (pathname === '/billing/checkout' && req.method === 'POST') {
  // lab-s3.2 — Stripe Checkout session creation
  // vrne-s3 — viewer-role write-block gate (AC1)
  authGuard(req, res, async () => {
    let _rnvOk = false;
    await requireNonViewer(req, res, () => { _rnvOk = true; });
    if (!_rnvOk) return;
    await handlePostCheckout(req, res);
  });
```

- [ ] **Step 2: Append a real-dispatch integration test**

Mirror `check-vrne-s1-server-wiring.js`'s own `T-integration-real-dispatch` test — same `router`/`seedTestSession`/`dispatchAndAwaitResponse`/`seedMultiUserRolesForIntegrationTest` helpers, same real seeded `e2e-viewer` identity (this exact pattern was already proven necessary and correct in `vrne-s1`'s post-merge-CI-catch and reused cleanly in `vrne-s2`).

```js
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

queue.push(function() {
  console.log('\n[vrne-s3] T-integration-real-dispatch -- real server.js dispatch denies viewer on /billing/checkout');
  return test('integration: requireNonViewer reachable via real server.js dispatch', async function() {
    var sharedOrg = 'e2e-vrne-s3-integration';
    await seedMultiUserRolesForIntegrationTest(sharedOrg);

    var sessionId = 'faceb00c03';
    seedTestSession(sessionId, {
      accessToken: 'e2e-test-access-token',
      userId: 9001,
      login: 'e2e-viewer',
      tenantId: sharedOrg
    });
    var cookieHeader = { cookie: 'session_id=' + sessionId };

    var req1 = { headers: Object.assign({ 'content-type': 'application/json' }, cookieHeader), method: 'POST', url: '/billing/checkout' };
    var result1 = await dispatchAndAwaitResponse(req1);
    assert.strictEqual(result1.statusCode, 403, 'POST /billing/checkout must return 403 for a viewer-role session, got ' + result1.statusCode + ' -- ' + result1.body);
  });
});
```

Add the `var router = ...` through `seedMultiUserRolesForIntegrationTest` declarations near the top of the file (after the existing helper functions, following the exact lazy-require lesson learned in `vrne-s2`: these `require`s must NOT run at module top level, since doing so wires the live role-resolution adapter process-wide and would flip the earlier AC1/AC2 isolated tests' unseeded `viewerSession()`/role fixtures to resolve via the live adapter instead of the literal mock role — place these declarations inside the file but ensure the `require()` calls for `server.js`/`session.js` are the LAST thing evaluated before the integration test itself runs, i.e., keep them adjacent to the `queue.push` block added in this step, not hoisted above the AC1/AC2/AC3 test blocks).

- [ ] **Step 3: Run targeted test — must pass**

```bash
node tests/check-vrne-s3-billing-gate.js
```

Expected output: `AC1+AC2+AC3+AC4 subtotal: 6 passed, 0 failed` (5 from Task 1 + 1 integration test).

- [ ] **Step 4: Grep-count check**

```bash
grep -c "requireNonViewer" src/web-ui/server.js
```

Expected: count increases by 1 from the pre-story baseline (42, from `vrne-s1` + `vrne-s2`) to 43.

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/server.js tests/check-vrne-s3-billing-gate.js
git commit -m "feat: wire viewer-write-block gate into /billing/checkout (AC1-AC4)"
```

---

## Task 3: Full regression — confirm all 6 planned tests pass, zero regressions

**Files:** None modified — verification only.

- [ ] **Step 1: Run the story's own targeted test file**

```bash
node tests/check-vrne-s3-billing-gate.js
```

Expected output: `6 passed, 0 failed`

- [ ] **Step 2: Run the full suite (anchor point 2 of 3 — branch-setup baseline, this check, and branch-complete)**

```bash
node scripts/run-all-tests.js
```

Expected output: `537 file(s) run` (536 baseline + this story's new test file), `0 failed` or exactly the one pre-existing `check-p3.5-validate-trace.js` pwsh-timeout flake already RISK-ACCEPTed — no other failures. Given this story's pre-verified regression-risk analysis (see Background above), no other test files should be affected.

- [ ] **Step 3: Confirm `vrne-s1`/`vrne-s2`'s own test suites still pass unmodified (regression guard)**

```bash
node tests/check-vrne-s1-require-non-viewer.js
node tests/check-vrne-s1-server-wiring.js
node tests/check-vrne-s2-skill-session-gate.js
```

Expected output: `10 passed, 0 failed`, `35 passed, 0 failed`, `18 passed, 0 failed` respectively — identical to their post-DoD counts.

- [ ] **Step 4: Confirm the pre-existing checkout/CSRF test files are genuinely unaffected (validates the Background section's pre-analysis)**

```bash
node tests/check-lab-s3.2-stripe-checkout.js
node tests/check-sec-perf-s3-billing-checkout-csrf.js
```

Expected output: both pass at their pre-story counts — no new failures, confirming these direct-handler-call test files were correctly assessed as unaffected by the new `server.js`-level gate.

- [ ] **Step 5: No implementation changes expected at this step** — this task exists to produce the verify-completion evidence, not to modify files.
