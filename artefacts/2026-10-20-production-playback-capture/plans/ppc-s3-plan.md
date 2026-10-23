# Rate-limit the capture-trigger endpoint per tenant user — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Protect the capture-trigger and capture-all endpoints from accidental runaway triggering (double-clicks, buggy retries) with a per-user (not per-tenant) rate limit, reusing the existing `createRateLimiter` pattern.
**Branch:** `feature/ppc-s3`
**Worktree:** `.worktrees/ppc-s3`
**Test command:** `npm test` (full suite) / `node tests/check-ppc-s3-rate-limiter-keyfn.js` and `node tests/check-ppc-s3-capture-rate-limit.js` (scoped)

---

## Planning note — a real architecture-constraints vs. actual-code mismatch found while planning

The DoR's Architecture Constraints say to reuse `createRateLimiter` "already used in `sign-off.js` at 10 req/user/min". **This description does not match the actual code.** `src/web-ui/middleware/rate-limiter.js`'s own header comment says "per-tenant rate limiting middleware", and its default `buildRateLimitKey(req)` returns `req.session.tenantId` (falling back to IP) — **never a per-user id**. `sign-off.js`'s own doc comment ("Rate-limited to 10 requests per user per minute") is itself a pre-existing inaccuracy: it calls `createRateLimiter({ maxRequests: 10, windowMs: 60000 })` with no custom key function, so it is actually tenant-scoped too, identically to `server.js`'s turn-stream limiter.

If this story reused `createRateLimiter` as-is (the DoR's literal instruction), **AC2 would fail in production**: two different Product Owners in the same tenant would share one rate-limit bucket, so User A's capture would block User B's — the exact cross-identity-collision bug class CLAUDE.md's "Mock-shape verification when reusing an adapter for a new purpose" rule warns about (`tir-s5`'s org-vs-member mismatch).

**Resolution (not a scope change, still reuses the existing mechanism, does not touch `sign-off.js`/`server.js`'s existing turn-stream usage):** extend `createRateLimiter` with two new, optional, backward-compatible parameters — `keyFn` (defaults to the existing `buildRateLimitKey`, so every current caller is unaffected) and `onLimited` (defaults to the existing raw-JSON 429 write, so every current caller is unaffected). This story's own usage passes a new `keyFn` that keys on `req.session.userId` (the real per-person identity field, confirmed in use elsewhere: `require-admin.js`, `artefact.js`, `auth.js`), and a new `onLimited` that renders an accessible `role="alert"` HTML page for a real browser form submission (NFR-Accessibility) while staying JSON for API callers — matching this file's own existing `_isFormSubmission` convention.

This will be logged as a `/capture` signal after this story merges — not fixed in `sign-off.js` itself, which is out of this story's scope, but worth flagging since its own doc comment is misleading about current behaviour.

---

## File map

```
Modify:
  src/web-ui/middleware/rate-limiter.js   — add optional keyFn/onLimited params to createRateLimiter (backward-compatible)
  src/web-ui/routes/playback-evidence.js  — add a per-user capture rate limiter; wire into handlePostCaptureTrigger and handlePostCaptureAll

Create:
  tests/check-ppc-s3-rate-limiter-keyfn.js    — rate-limiter.js extension: regression (default unchanged) + keyFn + onLimited
  tests/check-ppc-s3-capture-rate-limit.js    — route-level AC1/AC2/AC3 + NFR-Accessibility tests
```

---

## Task 1: Extend `createRateLimiter` with optional `keyFn` and `onLimited` (backward-compatible)

**Model class:** balanced (per `.github/context.yml` `optimization.routing.default_model_class`)

**Files:**
- Modify: `src/web-ui/middleware/rate-limiter.js`
- Test: `tests/check-ppc-s3-rate-limiter-keyfn.js`

- [x] **Step 1: Write the failing test**

```js
'use strict';
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS: ' + name); }
  catch (err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
}
var { createRateLimiter, buildRateLimitKey } = require('../src/web-ui/middleware/rate-limiter');

function makeReq(tenantId) {
  return { session: { tenantId: tenantId }, headers: {}, ip: '127.0.0.1' };
}
function makeRes() {
  var res = { _status: null, _body: null };
  res.writeHead = function(status) { res._status = status; };
  res.end = function(body) { res._body = body; };
  return res;
}

console.log('\ncheck-ppc-s3-rate-limiter-keyfn.js');

test('regression: no keyFn/onLimited passed -- default tenantId-keyed behaviour is unchanged', function() {
  var limiter = createRateLimiter({ maxRequests: 1, windowMs: 60000 });
  var nextCalled = 0;
  limiter(makeReq('tenant-a'), makeRes(), function() { nextCalled++; });
  var res2 = makeRes();
  limiter(makeReq('tenant-a'), res2, function() { nextCalled++; });
  assert.strictEqual(nextCalled, 1, 'first call allowed, second (same tenant) blocked -- unchanged default shape');
  assert.strictEqual(res2._status, 429);
});

test('keyFn: a custom key function is used instead of buildRateLimitKey when provided', function() {
  var limiter = createRateLimiter({
    maxRequests: 1,
    windowMs: 60000,
    keyFn: function(req) { return req.userIdForTest; }
  });
  var nextCalled = 0;
  limiter({ userIdForTest: 'user-a', session: { tenantId: 'same-tenant' }, headers: {} }, makeRes(), function() { nextCalled++; });
  var res2 = makeRes();
  limiter({ userIdForTest: 'user-b', session: { tenantId: 'same-tenant' }, headers: {} }, res2, function() { nextCalled++; });
  assert.strictEqual(nextCalled, 2, 'two different keyFn-derived keys must not block each other, even under the same tenantId');
  assert.notStrictEqual(res2._status, 429);
});

test('onLimited: a custom callback is invoked instead of the default raw-JSON 429 write', function() {
  var onLimitedCalled = false;
  var limiter = createRateLimiter({
    maxRequests: 1,
    windowMs: 60000,
    keyFn: function() { return 'fixed-key'; },
    onLimited: function(req, res) { onLimitedCalled = true; res.writeHead(429); res.end('custom body'); }
  });
  limiter({ session: {}, headers: {} }, makeRes(), function() {});
  var res2 = makeRes();
  limiter({ session: {}, headers: {} }, res2, function() {});
  assert.strictEqual(onLimitedCalled, true);
  assert.strictEqual(res2._body, 'custom body', 'the default JSON body must not be written when onLimited is provided');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
  process.exit(1);
}
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s3-rate-limiter-keyfn.js
```

Expected output: `FAIL: keyFn: a custom key function is used instead of buildRateLimitKey when provided` and `FAIL: onLimited: a custom callback is invoked instead of the default raw-JSON 429 write` (both `TypeError`/assertion failures — `keyFn`/`onLimited` are not yet recognised options). The regression test passes already (current behaviour).

- [x] **Step 3: Write minimal implementation**

```js
'use strict';

// rate-limiter.js — per-tenant rate limiting middleware (ADR-009, p4.1)
// Enforces max requests per tenant (or IP when tenantId absent) per sliding window.
// In-memory store — sufficient for single-instance web-ui server (p4.1 W1 RISK-ACCEPT).

/**
 * Build the rate-limit counter key for a request.
 * Returns tenantId when present; falls back to IP for backward compatibility.
 * @param {object} req
 * @returns {string}
 */
function buildRateLimitKey(req) {
  var tenantId = req.session && req.session.tenantId;
  if (tenantId != null && tenantId !== '') return String(tenantId);
  return req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
}

/**
 * Create a rate limiter middleware.
 *
 * @param {{ maxRequests?: number, windowMs?: number, keyFn?: Function, onLimited?: Function }} options
 *   maxRequests: maximum requests allowed per window (default: 10)
 *   windowMs: sliding window size in milliseconds (default: 60000 = 1 minute)
 *   keyFn: (req) => string — how to derive the counter key (default: buildRateLimitKey,
 *     i.e. per-tenant). ppc-s3: pass a custom keyFn to scope per-user instead.
 *   onLimited: (req, res) => void — called instead of the default raw-JSON 429 write
 *     when the limit is exceeded, so a caller can render a different response shape
 *     (e.g. an accessible HTML page for a real browser form submission). Default
 *     behaviour (no onLimited) is unchanged from before this option existed.
 * @returns {Function} middleware(req, res, next)
 */
function createRateLimiter({ maxRequests = 10, windowMs = 60 * 1000, keyFn = buildRateLimitKey, onLimited } = {}) {
  const _counts = new Map();

  return function rateLimiterMiddleware(req, res, next) {
    const key = keyFn(req);

    if (!key || key === 'unknown') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorised — no session' }));
      return;
    }

    const now    = Date.now();
    const cutoff = now - windowMs;

    const timestamps = (_counts.get(key) || []).filter(t => t > cutoff);
    timestamps.push(now);
    _counts.set(key, timestamps);

    if (timestamps.length > maxRequests) {
      if (typeof onLimited === 'function') { onLimited(req, res); return; }
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too Many Requests — rate limit exceeded' }));
      return;
    }

    next();
  };
}

module.exports = { createRateLimiter, buildRateLimitKey };
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s3-rate-limiter-keyfn.js
```

Expected output: `3 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
node tests/check-sec1-sse-rate-limit.js
```

Expected output: all existing tests in this file still pass (they call `createRateLimiter` with no `keyFn`/`onLimited`, so behaviour is byte-for-byte unchanged). Also confirm `node tests/check-sign-off*.js` (or the full suite) still passes for `sign-off.js`'s own usage.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/middleware/rate-limiter.js tests/check-ppc-s3-rate-limiter-keyfn.js
git commit -m "feat(ppc-s3): add optional keyFn/onLimited params to createRateLimiter"
```

**Task 1 complete.** Final SHA: `9ae90a07`. Spec compliance ✅, code quality ✅ (2 Minor non-blocking notes: `keyFn` JSDoc's story-id tag could be reworded ticket-agnostically; file-header comment could mention pluggable keying — neither blocks merge).

---

## Task 2: Per-user capture rate limiter wired into `handlePostCaptureTrigger` (AC1, AC3, NFR-Accessibility)

**Model class:** balanced

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s3-capture-rate-limit.js` (new file, first 4 tests)

- [x] **Step 1: Write the failing test**

```js
'use strict';
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

var fs = require('fs');
var path = require('path');
var os = require('os');
var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
var sessionPageAdapter = require('../src/web-ui/adapters/session-page-adapter');
var artefactCommitWriter = require('../src/web-ui/adapters/artefact-commit-writer');
var repoRootAdapter = require('../src/web-ui/adapters/repo-root');
var captureAllLock = require('../src/web-ui/modules/capture-all-lock');
pe.setJourneyStoreModule(store);

function getStore() {
  store._clearForTesting();
  captureAllLock._clearForTesting();
  return store;
}
function makeRes() {
  var res = {
    _status: null, _json: null, _body: null, _headers: {},
    json: function(body) { res._status = res._status || 200; res._json = body; },
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    end: function(body) { res._body = body; },
    setHeader: function(k, v) { res._headers[k] = v; }
  };
  res.status = function(code) { res._status = code; return res; };
  return res;
}
function makeReq(tenantId, productId, featureSlug, userId, extra) {
  return Object.assign({
    session: { tenantId: tenantId, userId: userId, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
    sessionId: 'sid-' + tenantId,
    params: { productId: productId, featureSlug: featureSlug },
    headers: {}
  }, extra || {});
}
function makeMockPool(rows) {
  return { query: async function() { return { rows: rows }; } };
}
function setupDodCompleteJourney(store, opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s3-feature-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var dodContent = opts.dodContent || [
    '## AC Coverage', '',
    '| AC | Satisfied? | Evidence |', '|----|------------|----------|',
    '| AC1 — First | Yes | screenshot |'
  ].join('\n');
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, { tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' });
  store.setPgAdapterForTesting({
    saveJourney: async function() {},
    getArtefactsForJourney: async function() {
      return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }];
    }
  });
  store.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
  return { journeyId: j.journeyId, featureSlug: slug, tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' };
}
function setupFakeCapture(tmpPrefix) {
  var tmpRoot = path.join(os.tmpdir(), tmpPrefix + '-' + Date.now());
  fs.mkdirSync(tmpRoot, { recursive: true });
  repoRootAdapter.setRepoRoot(tmpRoot);
  var fakePage = {
    goto: async function() {},
    screenshot: async function(opts) {
      var abs = path.join(tmpRoot, opts.path);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    }
  };
  sessionPageAdapter.setSessionPageAdapter(async function() {
    return { page: fakePage, browser: { close: async function() {} } };
  });
  artefactCommitWriter.setArtefactCommitAdapter(async function() { return { ok: true }; });
}
function uniqueUser(label) { return label + '-' + Date.now() + '-' + Math.random().toString(36).slice(2); }

queue.push(function() {
  return test('AC1: a second capture-trigger from the same user within 60s is rejected, not a silent failure or queued duplicate', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s3-rl-ac1');
    var user = uniqueUser('ac1-user');

    var req1 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
    await pe.handlePostCaptureTrigger(req1, makeRes(), null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    var req2 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
    var res2 = makeRes();
    await pe.handlePostCaptureTrigger(req2, res2, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res2._status, 429);
    assert.ok(res2._json.error.toLowerCase().indexOf('rate limit') !== -1, 'must be a clear, distinct rate-limit error, not a generic failure');
  });
});

queue.push(function() {
  return test('AC3: after the rate-limit window has elapsed, a new capture-trigger from the same user proceeds normally', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s3-rl-ac3');
    var user = uniqueUser('ac3-user');

    var captureAllModule = require('../src/utils/capture-all');
    var realNow = Date.now;
    try {
      Date.now = function() { return realNow() - 61000; };
      var req1 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
      await pe.handlePostCaptureTrigger(req1, makeRes(), null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
      Date.now = realNow;

      var req2 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
      var res2 = makeRes();
      await pe.handlePostCaptureTrigger(req2, res2, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

      assert.notStrictEqual(res2._status, 429, 'the window has elapsed -- no false-positive lockout');
    } finally {
      Date.now = realNow;
    }
  });
});

queue.push(function() {
  return test('NFR-Accessibility: a rate-limited form submission renders role="alert" markup, not a visual-only toast', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s3-rl-a11y');
    var user = uniqueUser('a11y-user');

    var formHeaders = { 'content-type': 'application/x-www-form-urlencoded' };
    var req1 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { headers: formHeaders, params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
    await pe.handlePostCaptureTrigger(req1, makeRes(), null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    var req2 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { headers: formHeaders, params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
    var res2 = makeRes();
    await pe.handlePostCaptureTrigger(req2, res2, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res2._status, 429);
    assert.ok(res2._body.indexOf('role="alert"') !== -1, 'a real browser form submission must get an accessible alert, not raw JSON');
  });
});

queue.push(function() {
  return test('NFR-Accessibility: a rate-limited JSON API caller still gets a JSON error body (not HTML)', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s3-rl-json');
    var user = uniqueUser('json-user');

    var req1 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
    await pe.handlePostCaptureTrigger(req1, makeRes(), null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    var req2 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
    var res2 = makeRes();
    await pe.handlePostCaptureTrigger(req2, res2, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res2._status, 429);
    assert.strictEqual(typeof res2._json, 'object', 'a non-form caller must get a parsed JSON body, not HTML');
    assert.ok(res2._json.error, 'must contain an explicit error field');
  });
});

(async function() {
  console.log('\ncheck-ppc-s3-capture-rate-limit.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s3-capture-rate-limit.js
```

Expected output: all 4 tests `FAIL` (`res2._status` is `undefined`/`200`-ish, not `429` — no rate limiter is wired into `handlePostCaptureTrigger` yet).

- [x] **Step 3: Write minimal implementation**

Add near the top of `src/web-ui/routes/playback-evidence.js`, after the existing `var _csrf = require('../middleware/csrf');` line:

```js
var { createRateLimiter } = require('../middleware/rate-limiter');

// ppc-s3 (AC2): per-user, not per-tenant. The shared default buildRateLimitKey
// (rate-limiter.js) keys on req.session.tenantId, which would let one Product
// Owner's usage block every other PO in the same tenant -- see this plan's own
// "Planning note" above. req.session.userId is the real per-person identity
// field already used elsewhere (require-admin.js, artefact.js, auth.js).
// Falls back to IP, mirroring buildRateLimitKey's own fallback precedent --
// never an unconditional 'unknown' that would 401 a real logged-in user whose
// session happens to lack userId for some other reason.
function _buildCaptureRateLimitKey(req) {
  var userId = req.session && req.session.userId;
  if (userId != null && userId !== '') return String(userId);
  return req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
}

// ppc-s3 (NFR-Accessibility): role="alert" markup, not a visual-only toast --
// matches this file's own _escapeHtml-free minimal-page convention (no user
// content is interpolated here, so no escaping is needed).
function _renderCaptureRateLimitedHtml() {
  return '<!DOCTYPE html><html><body><p role="alert">Too many capture requests -- please wait a minute before trying again.</p></body></html>';
}

// ppc-s3 (AC1): one capture action per user per 60s window, shared across
// BOTH handlePostCaptureTrigger and handlePostCaptureAll below (AC1's own
// "another capture action (same or different feature)" wording) -- a single
// module-level instance, not one per handler, so the same user's clicks
// across either endpoint draw from the same bucket. A strict 1-per-window
// cap (not sign-off.js's 10/min shape): capture is an expensive synchronous
// Playwright run, and this story's purpose is specifically to block
// double-clicks/buggy retries, not general throttling.
var _captureRateLimiter = createRateLimiter({
  maxRequests: 1,
  windowMs: 60 * 1000,
  keyFn: _buildCaptureRateLimitKey,
  onLimited: function(req, res) {
    if (_isFormSubmission(req)) {
      res.writeHead(429, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(_renderCaptureRateLimitedHtml());
      return;
    }
    _sendJson(res, 429, { error: 'rate limit exceeded -- wait a minute before triggering another capture' });
  }
});
```

Then, in `handlePostCaptureTrigger`, change:

```js
async function handlePostCaptureTrigger(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var journey = await _resolveJourney(req);
```

to:

```js
async function handlePostCaptureTrigger(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  // ppc-s3 (AC1): checked before journey resolution/Playwright acquisition --
  // a rate-limited request must do zero further work, matching the CSRF
  // guard's own "reject cheap, invalid requests first" placement immediately
  // above. Order matters here specifically because CSRF runs first: a
  // forged cross-site request (no valid token, but the victim's real
  // cookies) must not be able to burn the victim's own rate-limit quota --
  // it is rejected by the CSRF guard above before ever reaching this check.
  var rateLimitOk = false;
  _captureRateLimiter(req, res, function() { rateLimitOk = true; });
  if (!rateLimitOk) return;

  var journey = await _resolveJourney(req);
```

No change to `module.exports` is needed — every new test in this plan drives the rate limiter indirectly through the existing exported handlers (`handlePostCaptureTrigger`/`handlePostCaptureAll`), matching this file's own established testing convention; nothing calls `_buildCaptureRateLimitKey` or `_captureRateLimiter` directly.

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s3-capture-rate-limit.js
```

Expected output: `4 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
node tests/check-ppc-s2-capture-all-route.js
```

Expected output: all pre-existing tests in both files still pass — `handlePostCaptureTrigger`'s own existing AC1-AC7 tests from `ppc-s1` each make exactly one call per test (no test makes two calls from the same fixed user within the same test run), so the new 1-per-60s cap does not collide with any of them. (If a collision is found, note it in the task's own completion report rather than silently loosening the cap.)

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s3-capture-rate-limit.js
git commit -m "feat(ppc-s3): rate-limit handlePostCaptureTrigger per user (AC1, AC3, NFR-Accessibility)"
```

**Task 2 complete.** Final SHA: `4ac30c09`. Three commits in total: `0c2be89f` (feature), `c463fdd3` (fix: stale `ppc-s1` test fixture never set `session.userId`, discovered as a real regression during Step 5's regression run — fixed by giving each call in that file's own `makeReq` a unique `userId` rather than deriving one from the shared `tenantId`, which would have caused cross-test rate-limit collisions instead), `4ac30c09` (fix: a code-quality review Critical finding — a comment claimed `handlePostCaptureAll` was already wired to the shared limiter in present tense; it wasn't yet, since that's Task 3's job — reworded to describe current state accurately). Spec compliance ✅ (re-verified after each fix). Code quality ✅ after the comment fix; 2 Minor non-blocking notes remain (forward-reference ordering of `_isFormSubmission`/`_sendJson`; `_renderCaptureRateLimitedHtml` could be a constant).

---

## Task 3: Wire the same rate limiter into `handlePostCaptureAll` (AC1 cross-endpoint sharing, AC2)

**Model class:** balanced

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s3-capture-rate-limit.js` (append 2 more tests)

- [x] **Step 1: Write the failing test**

Append to `tests/check-ppc-s3-capture-rate-limit.js`, immediately before the closing `(async function() { ... })();` block:

```js
queue.push(function() {
  return test('AC1: the rate-limit bucket is shared across single-AC capture and capture-all -- triggering one blocks the other for the same user', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s3-rl-cross');
    var user = uniqueUser('cross-user');

    var req1 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
    await pe.handlePostCaptureTrigger(req1, makeRes(), null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    var req2 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug }, body: { _csrf: 'test-csrf-token' } });
    var res2 = makeRes();
    await pe.handlePostCaptureAll(req2, res2, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res2._status, 429, 'a single-AC trigger moments earlier must count against the SAME user\'s capture-all attempt');
  });
});

queue.push(function() {
  return test('AC2: two different Product Owners in the same tenant are rate-limited independently -- user B is never blocked by user A\'s usage', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s3-rl-ac2');
    var userA = uniqueUser('ac2-user-a');
    var userB = uniqueUser('ac2-user-b');

    // User A exhausts their own limit via capture-all.
    var reqA1 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, userA, { body: { _csrf: 'test-csrf-token' } });
    await pe.handlePostCaptureAll(reqA1, makeRes(), null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
    var reqA2 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, userA, { body: { _csrf: 'test-csrf-token' } });
    var resA2 = makeRes();
    await pe.handlePostCaptureAll(reqA2, resA2, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
    assert.strictEqual(resA2._status, 429, 'sanity check: user A really is rate-limited by their own second attempt');

    // User B, same tenant, must be unaffected by user A's exhausted limit.
    var reqB1 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, userB, { body: { _csrf: 'test-csrf-token' } });
    var resB1 = makeRes();
    await pe.handlePostCaptureAll(reqB1, resB1, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
    assert.notStrictEqual(resB1._status, 429, 'user B\'s first attempt must not be blocked by user A\'s usage, even in the same tenant');
  });
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s3-capture-rate-limit.js
```

Expected output: the 2 new tests `FAIL` — `handlePostCaptureAll` does not yet consult `_captureRateLimiter`, so neither the cross-endpoint block nor (trivially) the independence check fails for the right reason yet (`res2._status`/`resA2._status` is not `429`).

- [x] **Step 3: Write minimal implementation**

In `handlePostCaptureAll`, change:

```js
async function handlePostCaptureAll(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var journey = await _resolveJourney(req);
```

to:

```js
async function handlePostCaptureAll(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  // ppc-s3 (AC1): the SAME _captureRateLimiter instance used by
  // handlePostCaptureTrigger above -- a single-AC trigger and a capture-all
  // trigger for the same user share one bucket, matching AC1's own "another
  // capture action (same or different feature)" wording. Checked before the
  // lock is acquired: a rate-limited request must never touch
  // captureAllLock at all.
  var rateLimitOk = false;
  _captureRateLimiter(req, res, function() { rateLimitOk = true; });
  if (!rateLimitOk) return;

  var journey = await _resolveJourney(req);
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s3-capture-rate-limit.js
```

Expected output: `6 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: `777+ file(s) run, 0 failed` (accounting for the 2 new test files added by this story). Pay particular attention to `check-ppc-s1-playback-evidence-route.js` and `check-ppc-s2-capture-all-route.js`, since both call `handlePostCaptureTrigger`/`handlePostCaptureAll` repeatedly across many tests in the same process — if any pre-existing test happens to reuse the exact same `userId` across two calls within 60 real seconds of test-suite wall-clock time, it could now collide with the new 1-per-60s cap. (Both files' existing `makeReq` helpers set `userId` only via the `login`/session defaults, which differ from the `tenantId`-based keys those tests were written against, and — if this task's own keyFn ever needs a session field those fixtures don't set — `_buildCaptureRateLimitKey`'s own IP fallback still applies uniformly across all of them, so no single fixture should collide by accident. Confirm this empirically here rather than assuming it.)

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s3-capture-rate-limit.js
git commit -m "feat(ppc-s3): share the per-user capture rate limiter across handlePostCaptureAll (AC1 cross-endpoint, AC2)"
```

**Task 3 complete.** Final SHA: `620fe5fe`. Three commits: `80b7aa24` (feature), `1ba4f7a1` (fix: stale `check-ppc-s2-capture-all-route.js` fixture), `620fe5fe` (fix: stale `check-ppc-s1-ui-layer.js` fixture — a third pre-existing file found with the identical bug during this task's own full-suite regression run). Spec compliance ✅. Code quality ✅ with 1 Minor note (comment at the `handlePostCaptureAll` call site mildly re-explains what the module-level comment already covers; the lock-ordering rationale it adds is genuinely new and worth keeping). Full `npm test` run: 779 files, 3 failures, all confirmed pre-existing/unrelated (2 pass in isolation — ordering/concurrency noise; 1 is a flaky perf-timing threshold off by 1.2ms) — none touch `rate-limiter.js` or `playback-evidence.js`.

**All 3 tasks complete.** This story's rate-limiter work also surfaced and fixed a recurring stale-fixture bug (`session.userId` missing) in 3 pre-existing test files across 2 earlier stories (`ppc-s1`, `ppc-s2`) — each was a real regression caused by this story's new per-user rate-limiting wiring, not a defect in this story's own design. Worth a `/capture` signal noting the pattern (3 independent occurrences of the same fixture gap in one story) as a candidate for a shared test-helper module, per the code-quality reviewer's Minor/observational note.

---

## Post-implementation follow-up (not a task — for /capture after merge)

Log a `/capture` signal: `sign-off.js`'s own doc comment ("Rate-limited to 10 requests per user per minute") is inaccurate — the limiter it wires is actually tenant-scoped (the shared default `buildRateLimitKey`), not user-scoped. Not fixed here (out of this story's scope — `sign-off.js` is not a file this story touches), but worth a correction pass or a dedicated story if `sign-off.js`'s own behaviour is ever found to matter for multi-PO-per-tenant usage.
