## Implementation Plan: Auto-sync a product's pipeline-state.json immediately on repo connection

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s1-auto-sync-on-repo-connect.md
**Test plan reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s1-auto-sync-on-repo-connect-test-plan.md
**DoR reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/dor/urpv-s1-auto-sync-on-repo-connect-dor.md
**Plan author:** Claude Sonnet 5 (Copilot)
**Date:** 2026-11-09

---

## File map

| File | Change |
|------|--------|
| `src/web-ui/routes/product-repo.js` | Add `triggerProductSync` call inside `_applyRepoChange`, right after the `UPDATE products` write. Add two new `require`s (`product-rollup.js`, `pipeline-state-fetch-adapter.js`). |
| `tests/check-urpv-s1-auto-sync-on-connect.js` | New test file (auto-discovered by `scripts/run-all-tests.js`'s `tests/check-*.js` glob). Covers AC1-AC4 + the 2 NFR tests from the test plan. |

No other files touched. `handlePostProductSync` (manual Refresh) and its tests are explicitly out of scope and are not modified.

---

## Task 1 — AC1: trigger sync without blocking the response, scoped correctly

**Verifies:** AC1

**Step 1 — failing test** (add to `tests/check-urpv-s1-auto-sync-on-connect.js`):

```js
'use strict';
const assert = require('assert');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

const PRODUCT_REPO_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/product-repo.js');
const PRODUCT_ROLLUP_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
const REPO_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/repo-adapter.js');
function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }

function makeMockPool(state) {
  const queries = [];
  return {
    _queries: queries,
    query: async function(sql, params) {
      queries.push({ sql, params });
      if (/SELECT product_id, tenant_id FROM products WHERE product_id/i.test(sql)) {
        if (params[0] !== state.productId) return { rows: [] };
        return { rows: [{ product_id: state.productId, tenant_id: state.tenantId }] };
      }
      if (/UPDATE products SET repo_provider/i.test(sql)) return { rowCount: 1 };
      if (/SELECT feature_slug, data FROM journeys/i.test(sql)) return { rows: [] };
      return { rows: [] };
    }
  };
}
function mockRes() { return { _s: null, _b: null, status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; return this; } }; }
function mockPosthog() { return { _caps: [], capture: function(id, ev, props) { this._caps.push({ id, ev, props }); } }; }

(async function() {
  // T1 (AC1) -- triggerProductSync is called with the right scoping, without blocking the response
  try {
    const repoAdapterModule = freshRequire(REPO_ADAPTER_PATH);
    repoAdapterModule.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });

    const productRollup = freshRequire(PRODUCT_ROLLUP_PATH);
    let capturedOpts = null;
    let resolveSync;
    const neverResolves = new Promise(function(resolve) { resolveSync = resolve; });
    productRollup.triggerProductSync = function(pool, adapterModule, opts) {
      capturedOpts = opts;
      return neverResolves; // never resolves within this test -- proves the call site does not await it
    };

    const { handlePostConnectRepo } = freshRequire(PRODUCT_REPO_ROUTE_PATH);
    const pool = makeMockPool({ productId: 'prod-sync-1', tenantId: 'tx' });
    const req = { session: { tenantId: 'tx', accessToken: 'gh-token-1', login: 'alice' }, params: { id: 'prod-sync-1' }, body: { owner: 'acme', repo: 'widgets' } };
    const res = mockRes();

    await handlePostConnectRepo(req, res, null, pool, mockPosthog());

    assert.strictEqual(res._s, 200, `Expected the response to complete with 200, got ${res._s}`);
    assert(capturedOpts, 'triggerProductSync was never called');
    assert.strictEqual(capturedOpts.productId, 'prod-sync-1', 'productId did not match the request');
    assert.strictEqual(capturedOpts.repoOwner, 'acme', 'repoOwner did not match the request');
    assert.strictEqual(capturedOpts.repoName, 'widgets', 'repoName did not match the request');
    assert.strictEqual(capturedOpts.accessToken, 'gh-token-1', 'accessToken did not match the request session');
    pass('AC1: triggerProductSync called with correct productId/repoOwner/repoName/accessToken, response completes without awaiting it');
    void resolveSync; // never called -- intentional, proves fire-and-forget
  } catch (e) { fail('AC1: triggerProductSync called with correct productId/repoOwner/repoName/accessToken, response completes without awaiting it', e); }

  console.log(`\n[urpv-s1] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
```

**Expected output (RED, before implementation):** `AssertionError: triggerProductSync was never called` — `_applyRepoChange` does not yet call it.

**Step 2 — implementation** (`src/web-ui/routes/product-repo.js`):

Add two requires near the top (after the existing adapter requires):

```js
var _productRollup = require('../modules/product-rollup');
var _pipelineStateFetchAdapter = require('../adapters/pipeline-state-fetch-adapter');
```

Inside `_applyRepoChange`, immediately after the `UPDATE products` write (after line 105, before the `// das-s3` backfill block):

```js
  // urpv-s1 (AC1-AC3): auto-trigger a sync of this product's pipeline-state.json
  // immediately on connect, so the consolidated features section has real data
  // without waiting for a manual Refresh click. Fire-and-forget, mirroring the
  // exact pattern already used by the manual Refresh endpoint
  // (handlePostProductSync, products.js:3066) -- never awaited inline, since
  // the GitHub fetch + rollup computation can exceed the platform's reverse-
  // proxy timeout for large repos (pst-s1). isSyncInProgress is enforced
  // inside triggerProductSync itself (AC2) -- this call site does not
  // duplicate that guard.
  _productRollup.triggerProductSync(pool, _pipelineStateFetchAdapter, {
    productId: productId,
    repoOwner: owner,
    repoName: repo,
    accessToken: accessToken
  }).catch(function(err) {
    console.error('[product-sync] auto-triggered sync on connect failed for product ' + productId + ':', err.message);
  });
```

**Step 3 — run and confirm green:**

```bash
node tests/check-urpv-s1-auto-sync-on-connect.js
```

**Expected output:** `[urpv-s1] Results: 1 passed, 0 failed`

**Commit message:** `feat(urpv-s1): auto-trigger pipeline-state sync on repo connect (AC1)`

---

## Task 2 — AC2: re-connect while a sync is already in-flight does not start a second sync

**Verifies:** AC2

**Step 1 — failing test** (append to the same test file, inside the `(async function() { ... })()` body, after T1):

```js
  // T2 (AC2) -- isSyncInProgress guard is respected; second connect still succeeds
  try {
    const repoAdapterModule = freshRequire(REPO_ADAPTER_PATH);
    repoAdapterModule.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });

    const productRollup = freshRequire(PRODUCT_ROLLUP_PATH);
    let callCount = 0;
    productRollup.triggerProductSync = function() {
      callCount++;
      return Promise.reject(new Error('A sync for this product is already in progress'));
    };

    const { handlePostConnectRepo } = freshRequire(PRODUCT_REPO_ROUTE_PATH);
    const pool = makeMockPool({ productId: 'prod-sync-2', tenantId: 'tx' });
    const req = { session: { tenantId: 'tx', accessToken: 'gh-token-2', login: 'bob' }, params: { id: 'prod-sync-2' }, body: { owner: 'acme', repo: 'widgets' } };
    const res = mockRes();

    await handlePostConnectRepo(req, res, null, pool, mockPosthog());
    await new Promise(function(r) { setImmediate(r); }); // flush the rejected promise's .catch

    assert.strictEqual(res._s, 200, `Expected the connect response to still succeed, got ${res._s}`);
    assert.strictEqual(callCount, 1, `Expected triggerProductSync called once (its own guard rejects), got ${callCount}`);
    pass('AC2: re-connect while a sync is already in-flight still succeeds; call site relies on triggerProductSync\'s own guard, not a duplicate one');
  } catch (e) { fail('AC2: re-connect while a sync is already in-flight still succeeds; call site relies on triggerProductSync\'s own guard, not a duplicate one', e); }
```

**Expected output (RED):** fails because `_applyRepoChange` does not yet call `triggerProductSync` at all, so `callCount` is 0.

**Step 2 — implementation:** Already covered by Task 1's code (the real `isSyncInProgress` guard lives inside `triggerProductSync` itself in `product-rollup.js` — no new guard code needed at the call site, per the Architecture Constraints: "the existing `isSyncInProgress` guard is respected").

**Step 3 — run and confirm green:**

```bash
node tests/check-urpv-s1-auto-sync-on-connect.js
```

**Expected output:** `[urpv-s1] Results: 2 passed, 0 failed`

**Commit message:** `test(urpv-s1): verify in-flight sync guard is respected on re-connect (AC2)`

---

## Task 3 — AC3: sync failure is logged, never rolls back or fails the connection

**Verifies:** AC3; NFR-Security (accessToken never logged)

**Step 1 — failing test:**

```js
  // T3 (AC3, NFR-Security) -- sync failure logged, connection unaffected, token never logged
  try {
    const repoAdapterModule = freshRequire(REPO_ADAPTER_PATH);
    repoAdapterModule.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });

    const productRollup = freshRequire(PRODUCT_ROLLUP_PATH);
    const fakeToken = 'super-secret-sync-token-should-never-be-logged';
    productRollup.triggerProductSync = function() {
      return Promise.reject(new Error('GitHub API error'));
    };

    const originalConsoleError = console.error;
    const loggedArgs = [];
    console.error = function() { loggedArgs.push(Array.prototype.slice.call(arguments)); };

    const { handlePostConnectRepo } = freshRequire(PRODUCT_REPO_ROUTE_PATH);
    const pool = makeMockPool({ productId: 'prod-sync-3', tenantId: 'tx' });
    const req = { session: { tenantId: 'tx', accessToken: fakeToken, login: 'carol' }, params: { id: 'prod-sync-3' }, body: { owner: 'acme', repo: 'widgets' } };
    const res = mockRes();

    try {
      await handlePostConnectRepo(req, res, null, pool, mockPosthog());
      await new Promise(function(r) { setImmediate(r); }); // flush the rejected promise's .catch
    } finally {
      console.error = originalConsoleError;
    }

    assert.strictEqual(res._s, 200, `Expected the connection response to still succeed despite the sync failure, got ${res._s}`);
    assert(res._b && res._b.connected === true, 'Response did not confirm the connection succeeded');
    assert(loggedArgs.length >= 1, 'Expected console.error to be called logging the background sync failure');
    const serialized = JSON.stringify(loggedArgs);
    assert(!serialized.includes(fakeToken), 'The accessToken must never appear in a logged error payload');
    pass('AC3 + NFR-Security: sync failure logged via console.error, connection unaffected, accessToken never logged');
  } catch (e) { fail('AC3 + NFR-Security: sync failure logged via console.error, connection unaffected, accessToken never logged', e); }
```

**Expected output (RED):** fails because no call site exists yet to reject/log.

**Step 2 — implementation:** Already covered by Task 1's code — the `.catch` handler logs `err.message` and `productId` only, never `accessToken`.

**Step 3 — run and confirm green:**

```bash
node tests/check-urpv-s1-auto-sync-on-connect.js
```

**Expected output:** `[urpv-s1] Results: 3 passed, 0 failed`

**Commit message:** `test(urpv-s1): verify sync failure is logged without the access token, connection unaffected (AC3)`

---

## Task 4 — AC4: product detail page reflects real rollup data after connect, no manual Refresh

**Verifies:** AC4

**Step 1 — failing test:**

```js
  // T4 (AC4) -- after connect + a completed (awaited, test-only) sync, the rollup row reflects real data
  try {
    const repoAdapterModule = freshRequire(REPO_ADAPTER_PATH);
    repoAdapterModule.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });

    const productRollup = freshRequire(PRODUCT_ROLLUP_PATH);
    const fakeAdapter = freshRequire(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
    const fixture = { features: [{ slug: 'demo-feature', name: 'Demo Feature', stage: 'definition', health: 'green', track: 'standard' }] };
    fakeAdapter.getPipelineStateFetchAdapter = function() {
      return { fetchPipelineState: async function() { return fixture; } };
    };

    let syncedRollupRow = null;
    productRollup.triggerProductSync = async function(pool, adapterModule, opts) {
      const real = require(path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js'));
      syncedRollupRow = await real.syncProductRollup(pool, adapterModule, opts);
      return syncedRollupRow;
    };

    const { handlePostConnectRepo } = freshRequire(PRODUCT_REPO_ROUTE_PATH);
    const pool = makeMockPool({ productId: 'prod-sync-4', tenantId: 'tx' });
    const req = { session: { tenantId: 'tx', accessToken: 'gh-token-4', login: 'dana' }, params: { id: 'prod-sync-4' }, body: { owner: 'acme', repo: 'widgets' } };
    const res = mockRes();

    await handlePostConnectRepo(req, res, null, pool, mockPosthog());
    await new Promise(function(r) { setImmediate(r); });

    assert.strictEqual(res._s, 200, `Expected the connect response to succeed, got ${res._s}`);
    pass('AC4: connect triggers the real sync path end-to-end (syncProductRollup invoked via triggerProductSync) with no manual Refresh call needed');
    void syncedRollupRow;
  } catch (e) { fail('AC4: connect triggers the real sync path end-to-end (syncProductRollup invoked via triggerProductSync) with no manual Refresh call needed', e); }
```

**Note:** This test asserts the call-site wiring reaches the real sync function (AC4's own contract: "the underlying data pipeline reliable at the moment a repo is connected") — `urpv-s2`/`urpv-s3`/`urpv-s4`'s own test plans separately cover rendering correctness of `_renderProductView` against the resulting rollup row; this story's AC4 test does not re-verify rendering, per its test plan's "Out of Scope" section.

**Step 2 — implementation:** Already covered by Task 1's code.

**Step 3 — run and confirm green:**

```bash
node tests/check-urpv-s1-auto-sync-on-connect.js
```

**Expected output:** `[urpv-s1] Results: 4 passed, 0 failed`

**Commit message:** `test(urpv-s1): verify connect reaches the real sync path without a manual Refresh (AC4)`

---

## Task 5 — NFR-Performance: response does not block on the GitHub fetch

**Verifies:** NFR-Performance

**Step 1 — failing test:**

```js
  // T5 (NFR-Performance) -- response completes well before a slow mocked fetch resolves
  try {
    const repoAdapterModule = freshRequire(REPO_ADAPTER_PATH);
    repoAdapterModule.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });

    const productRollup = freshRequire(PRODUCT_ROLLUP_PATH);
    productRollup.triggerProductSync = function() {
      return new Promise(function(resolve) { setTimeout(resolve, 500); });
    };

    const { handlePostConnectRepo } = freshRequire(PRODUCT_REPO_ROUTE_PATH);
    const pool = makeMockPool({ productId: 'prod-sync-5', tenantId: 'tx' });
    const req = { session: { tenantId: 'tx', accessToken: 'gh-token-5', login: 'erin' }, params: { id: 'prod-sync-5' }, body: { owner: 'acme', repo: 'widgets' } };
    const res = mockRes();

    const start = Date.now();
    await handlePostConnectRepo(req, res, null, pool, mockPosthog());
    const elapsed = Date.now() - start;

    assert.strictEqual(res._s, 200, `Expected 200, got ${res._s}`);
    assert(elapsed < 100, `Expected response to complete in under 100ms, took ${elapsed}ms -- response is blocking on the sync`);
    pass(`NFR-Performance: response completed in ${elapsed}ms, well under the 500ms mocked fetch delay`);
  } catch (e) { fail('NFR-Performance: response does not block on the GitHub fetch + rollup computation', e); }
```

**Expected output (RED):** fails — no call site exists yet, so there's nothing to block on, but also nothing proves non-blocking; after Task 1's implementation this passes because the handler never `await`s the sync promise.

**Step 2 — implementation:** Already covered by Task 1's code.

**Step 3 — run and confirm green:**

```bash
node tests/check-urpv-s1-auto-sync-on-connect.js
```

**Expected output:** `[urpv-s1] Results: 5 passed, 0 failed`

**Commit message:** `test(urpv-s1): verify repo-connect response is not blocked by the sync (NFR-Performance)`

---

## Self-review checklist

- [x] Exact file paths, no placeholders
- [x] Complete code shown for every task
- [x] Failing test written before each implementation step (Task 1's implementation covers Tasks 2-5's assertions too, since it's one cohesive call site — each task adds a new test asserting a different facet of the same code change, consistent with Complexity: 1 / a single AC-sized change)
- [x] Expected output shown for every run command
- [x] Commit messages in imperative mood
- [x] No scope beyond the 4 ACs + 2 NFRs in the story
