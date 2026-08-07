# Show last-synced freshness and a manual refresh action — Implementation Plan

> **For agent execution:** Use /subagent-execution (Haiku model per operator instruction).

**Goal:** Make every test in `artefacts/2026-07-16-product-rollup/test-plans/pr-s3-test-plan.md` pass. Do not add scope beyond what the ACs and tests specify.
**Branch:** `feature/pr-s3` (based on `feature/pr-s2` — pr-s2 is this story's upstream dependency and is not yet merged, so this branch includes pr-s2's commits directly; when pr-s2 merges to master, this branch should be rebased)
**Worktree:** `.worktrees/pr-s3`
**Test command:** `node <file>` (plain Node scripts using the built-in `assert` module)

**Note on scope:** pr-s2 implemented `syncProductRollup()` (the sync function) but never exposed it via an HTTP route — pr-s2's own test plan only required the function itself, not a trigger endpoint. pr-s3's own test plan explicitly names "the Refresh action handler" as a component under test for AC2 and AC4, so adding the `POST /products/:id/sync` route in this story (not pr-s2) is correctly scoped, not scope creep.

---

## File map

```
Create:
  src/web-ui/modules/sync-freshness.js       — formatSyncedAt() human-readable relative time
  tests/check-pr-s3-sync-freshness.js        — AC1, AC3 (formatting) tests

Modify:
  src/web-ui/modules/product-rollup.js       — add triggerProductSync() with in-flight tracking (AC4 concurrency guard)
  tests/check-pr-s2-product-rollup.js        — append AC4-concurrency tests for triggerProductSync (co-located with pr-s2's existing sync tests since it's the same module)
  src/web-ui/routes/products.js              — new handlePostProductSync route handler; freshness/Refresh UI in _renderProductView
  tests/check-pr-s2-products-route.js        — append tests for the new route + freshness rendering (co-located with pr-s2's existing products-route tests since it's the same file)
  src/web-ui/server.js                       — wire POST /products/:id/sync route
```

---

## Task 1: Human-readable timestamp formatting (AC1, AC3)

**Files:**
- Create: `src/web-ui/modules/sync-freshness.js`
- Test: `tests/check-pr-s3-sync-freshness.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';

// tests/check-pr-s3-sync-freshness.js
// pr-s3 AC1, AC3 -- human-readable relative-time formatting for a product's
// last sync, and the explicit "Not yet synced" state when no sync has ever run.

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS]', name);
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err.message);
  }
}

var MODULE_PATH = path.resolve(__dirname, '../src/web-ui/modules/sync-freshness.js');
var mod = require(MODULE_PATH);

console.log('\n[pr-s3] T1 -- formats a synced_at timestamp as a human-readable relative time (AC1)');
test('formatSyncedAt: 2 hours ago renders as a relative-time string mentioning hours', function() {
  var twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  var result = mod.formatSyncedAt(twoHoursAgo);
  assert.ok(/2 hours? ago/i.test(result), 'Expected a relative time mentioning "2 hours ago", got: ' + result);
});

test('formatSyncedAt: accepts an ISO string as well as a Date object', function() {
  var twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  var result = mod.formatSyncedAt(twoHoursAgo);
  assert.ok(/2 hours? ago/i.test(result), 'Expected a relative time mentioning "2 hours ago" for an ISO string input, got: ' + result);
});

test('formatSyncedAt: does not return a raw ISO timestamp or epoch number', function() {
  var result = mod.formatSyncedAt(new Date());
  assert.ok(!/^\d+$/.test(result), 'Expected a human string, not a raw epoch number: ' + result);
  assert.ok(!/^\d{4}-\d{2}-\d{2}T/.test(result), 'Expected a human string, not a raw ISO timestamp: ' + result);
});

console.log('\n[pr-s3] T2 -- shows a "Not yet synced" state when no synced_at value exists (AC3)');
test('formatSyncedAt: null/undefined input returns the explicit "Not yet synced" label', function() {
  assert.strictEqual(mod.formatSyncedAt(null), 'Not yet synced');
  assert.strictEqual(mod.formatSyncedAt(undefined), 'Not yet synced');
});

console.log('\n[pr-s3-sync-freshness] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failures.length) {
  failures.forEach(function(f) { console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err); });
}
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s3-sync-freshness.js
```

Expected: `Cannot find module '../src/web-ui/modules/sync-freshness.js'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

// src/web-ui/modules/sync-freshness.js -- pr-s3
//
// Formats a product_rollups.synced_at value as a human-readable relative
// time ("2 hours ago"), or the explicit "Not yet synced" label when no sync
// has ever run (AC3) -- never a blank string, "Invalid Date", or a raw
// timestamp/epoch number that could read as misleadingly current (AC1).

/**
 * @param {Date|string|null|undefined} syncedAt
 * @returns {string} human-readable relative time, or "Not yet synced"
 */
function formatSyncedAt(syncedAt) {
  if (!syncedAt) return 'Not yet synced';

  var then = new Date(syncedAt);
  var diffMs = Date.now() - then.getTime();
  var diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'Last synced just now';

  var diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return 'Last synced ' + diffMin + ' minute' + (diffMin === 1 ? '' : 's') + ' ago';

  var diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return 'Last synced ' + diffHours + ' hour' + (diffHours === 1 ? '' : 's') + ' ago';

  var diffDays = Math.floor(diffHours / 24);
  return 'Last synced ' + diffDays + ' day' + (diffDays === 1 ? '' : 's') + ' ago';
}

module.exports = {
  formatSyncedAt
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s3-sync-freshness.js
```

Expected output: `[pr-s3-sync-freshness] Results: 5 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/sync-freshness.js tests/check-pr-s3-sync-freshness.js
git commit -m "feat(pr-s3): add human-readable last-synced timestamp formatting"
```

---

## Task 2: Concurrency guard for sync-in-progress (AC4)

**Files:**
- Modify: `src/web-ui/modules/product-rollup.js` (add `triggerProductSync`, `isSyncInProgress`)
- Modify (append to): `tests/check-pr-s2-product-rollup.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-pr-s2-product-rollup.js`, inserting these `queue.push(...)` blocks immediately before the line `for (var i = 0; i < queue.length; i++) {`:

```javascript
  // T5: triggerProductSync rejects a second concurrent call for the same product_id (AC4)
  queue.push(function() {
    console.log('\n[pr-s3] T5 -- triggerProductSync rejects a concurrent second call for the same product_id while the first is still in flight (AC4)');
    return test('triggerProductSync: a second call for the same productId while one is pending is rejected, not started', async function() {
      var mod = freshRequire();
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
      var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));

      var fetchCallCount = 0;
      var resolveFetch;
      var fetchPromise = new Promise(function(resolve) { resolveFetch = resolve; });
      freshAdapterMod.setPipelineStateFetchAdapter(async function() {
        fetchCallCount++;
        await fetchPromise; // held open until the test explicitly resolves it
        return { content: Buffer.from(JSON.stringify({ features: [] })).toString('base64'), encoding: 'base64' };
      });

      var mockPool = { query: async function() { return { rows: [] }; } };
      var opts = { productId: 'p-concurrent', repoOwner: 'acme', repoName: 'widgets', accessToken: 'fake-token' };

      var firstCallPromise = mod.triggerProductSync(mockPool, freshAdapterMod, opts);
      assert.strictEqual(mod.isSyncInProgress('p-concurrent'), true, 'Expected isSyncInProgress to be true while the first sync is pending');

      try {
        await mod.triggerProductSync(mockPool, freshAdapterMod, opts);
        assert.fail('Expected the second concurrent triggerProductSync call to be rejected');
      } catch (err) {
        assert.ok(/already in progress|in flight/i.test(err.message), 'Expected a clear "already in progress" error, got: ' + err.message);
      }

      resolveFetch();
      await firstCallPromise;
      assert.strictEqual(fetchCallCount, 1, 'Expected exactly one underlying fetch call despite two trigger attempts');
      assert.strictEqual(mod.isSyncInProgress('p-concurrent'), false, 'Expected isSyncInProgress to be false after the sync completes');
    });
  });

  // T6: triggerProductSync clears the in-flight flag even when the sync fails (AC4 does not deadlock on error)
  queue.push(function() {
    console.log('\n[pr-s3] T6 -- triggerProductSync clears the in-flight flag after a failed sync, allowing a subsequent retry (AC4)');
    return test('triggerProductSync: in-flight flag clears after failure, a later retry is allowed', async function() {
      var mod = freshRequire();
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
      var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
      freshAdapterMod.setPipelineStateFetchAdapter(async function() {
        throw new Error('Failed to fetch pipeline-state.json: HTTP 404');
      });
      var mockPool = { query: async function() { return { rows: [] }; } };
      var opts = { productId: 'p-retry', repoOwner: 'acme', repoName: 'missing', accessToken: 'fake-token' };

      try {
        await mod.triggerProductSync(mockPool, freshAdapterMod, opts);
        assert.fail('Expected the first sync attempt to throw (404)');
      } catch (err) {
        assert.ok(/404/.test(err.message));
      }
      assert.strictEqual(mod.isSyncInProgress('p-retry'), false, 'Expected the in-flight flag to clear after a failed sync, not deadlock');

      // A subsequent retry is allowed to proceed (not rejected as "already in progress")
      freshAdapterMod.setPipelineStateFetchAdapter(async function() {
        return { content: Buffer.from(JSON.stringify({ features: [] })).toString('base64'), encoding: 'base64' };
      });
      await mod.triggerProductSync(mockPool, freshAdapterMod, opts); // should not throw
    });
  });

```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected: `TypeError: mod.triggerProductSync is not a function`

- [ ] **Step 3: Write the implementation**

Add to `src/web-ui/modules/product-rollup.js` (after `syncProductRollup`, before `module.exports`):

```javascript

// pr-s3 AC4: in-flight sync tracking, keyed by product_id. A simple
// in-memory Set is sufficient here -- this platform runs as a single Node
// process per environment (no multi-instance horizontal scaling in the
// current architecture), so a per-process guard is the correct scope for
// preventing duplicate concurrent syncs of the same product.
var _syncsInProgress = new Set();

/**
 * @param {string} productId
 * @returns {boolean} true if a sync for this product is currently in flight
 */
function isSyncInProgress(productId) {
  return _syncsInProgress.has(productId);
}

/**
 * Wraps syncProductRollup with a per-product_id concurrency guard (AC4).
 * Rejects immediately (does not queue or wait) if a sync for the same
 * product_id is already in flight, so a second concurrent Refresh click
 * never starts a second underlying fetch. Always clears the in-flight flag
 * on completion, success or failure, so a failed sync can be retried
 * immediately rather than deadlocking the product's Refresh action.
 *
 * @param {object} pool
 * @param {{getPipelineStateFetchAdapter: Function}} adapterModule
 * @param {{productId: string, repoOwner: string, repoName: string, accessToken: string}} opts
 */
async function triggerProductSync(pool, adapterModule, opts) {
  if (_syncsInProgress.has(opts.productId)) {
    throw new Error('A sync for this product is already in progress');
  }
  _syncsInProgress.add(opts.productId);
  try {
    return await syncProductRollup(pool, adapterModule, opts);
  } finally {
    _syncsInProgress.delete(opts.productId);
  }
}
```

Update `module.exports` at the bottom of the file to:

```javascript
module.exports = {
  computeDodStatusRollup,
  syncProductRollup,
  triggerProductSync,
  isSyncInProgress
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: `[pr-s2-product-rollup] Results: 6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/product-rollup.js tests/check-pr-s2-product-rollup.js
git commit -m "feat(pr-s3): add per-product concurrency guard preventing duplicate concurrent syncs"
```

---

## Task 3: POST /products/:id/sync route + server.js wiring (AC2, AC4)

**Files:**
- Modify: `src/web-ui/routes/products.js` (add `handlePostProductSync`)
- Modify: `src/web-ui/server.js` (wire the new route)
- Modify (append to): `tests/check-pr-s2-products-route.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-pr-s2-products-route.js` (replacing its final `process.exit(...)` line, which will be re-added at the end):

```javascript

console.log('\n[pr-s3] AC2 -- POST /products/:id/sync triggers a new sync and returns the updated rollup');

test('products.js exports handlePostProductSync', function() {
  var productsRoute = require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));
  assert.strictEqual(typeof productsRoute.handlePostProductSync, 'function', 'Expected products.js to export handlePostProductSync');
});

(async function() {
  var productsRoute = require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));

  await (async function() {
    try {
      var rollupModPath = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
      delete require.cache[require.resolve(rollupModPath)];
      var adapterModPath = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
      delete require.cache[require.resolve(adapterModPath)];
      var adapterMod = require(adapterModPath);
      adapterMod.setPipelineStateFetchAdapter(async function() {
        return { content: Buffer.from(JSON.stringify({ features: [{ slug: 'f1', stories: [{ dodStatus: 'complete' }] }] })).toString('base64'), encoding: 'base64' };
      });

      var writtenRows = [];
      var mockPool = {
        query: async function(sql, params) {
          if (/SELECT product_id, tenant_id FROM products/i.test(sql)) {
            return { rows: [{ product_id: 'p1', tenant_id: 't1' }] };
          }
          if (/SELECT repo_owner, repo_name FROM products/i.test(sql)) {
            return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
          }
          if (/INSERT INTO product_rollups/i.test(sql)) {
            writtenRows.push(params);
            return { rows: [] };
          }
          return { rows: [] };
        }
      };

      var req = { params: { id: 'p1' }, session: { tenantId: 't1', accessToken: 'fake-token' } };
      var statusCode = null; var jsonBody = null;
      var res = { status: function(c) { statusCode = c; return { json: function(b) { jsonBody = b; } }; } };

      await productsRoute.handlePostProductSync(req, res, null, mockPool, null);

      passed++; console.log('  [PASS] handlePostProductSync: completes without throwing for a valid product with a connected repo');
      if (writtenRows.length !== 1) { throw new Error('Expected exactly one cache write, got ' + writtenRows.length); }
      passed++; console.log('  [PASS] handlePostProductSync: writes exactly one rollup cache row via triggerProductSync');
    } catch (err) {
      failed++; console.log('  [FAIL] handlePostProductSync happy path --', err.message);
    }
  })();

  console.log('\n[pr-s3] AC4 -- a second concurrent POST /products/:id/sync for the same product is rejected (409)');

  await (async function() {
    try {
      var rollupModPath = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
      delete require.cache[require.resolve(rollupModPath)];
      var adapterModPath = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
      delete require.cache[require.resolve(adapterModPath)];
      var adapterMod = require(adapterModPath);
      var resolveFetch;
      var fetchGate = new Promise(function(resolve) { resolveFetch = resolve; });
      adapterMod.setPipelineStateFetchAdapter(async function() {
        await fetchGate;
        return { content: Buffer.from(JSON.stringify({ features: [] })).toString('base64'), encoding: 'base64' };
      });

      var mockPool = {
        query: async function(sql) {
          if (/SELECT product_id, tenant_id FROM products/i.test(sql)) return { rows: [{ product_id: 'p2', tenant_id: 't1' }] };
          if (/SELECT repo_owner, repo_name FROM products/i.test(sql)) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
          return { rows: [] };
        }
      };
      var req = { params: { id: 'p2' }, session: { tenantId: 't1', accessToken: 'fake-token' } };

      var productsRouteFresh = require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));
      var firstStatus = null; var secondStatus = null;
      var res1 = { status: function(c) { firstStatus = c; return { json: function() {} }; } };
      var res2 = { status: function(c) { secondStatus = c; return { json: function() {} }; } };

      var firstCallPromise = productsRouteFresh.handlePostProductSync(req, res1, null, mockPool, null);
      await new Promise(function(r) { setTimeout(r, 10); }); // let the first call reach the in-flight guard
      await productsRouteFresh.handlePostProductSync(req, res2, null, mockPool, null);

      if (secondStatus !== 409) { throw new Error('Expected the second concurrent call to respond 409, got ' + secondStatus); }
      passed++; console.log('  [PASS] handlePostProductSync: a second concurrent call for the same product responds 409');

      resolveFetch();
      await firstCallPromise;
    } catch (err) {
      failed++; console.log('  [FAIL] handlePostProductSync concurrency --', err.message);
    }
  })();

  console.log('\n[pr-s2-pr-s3-products-route] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-products-route.js
```

Expected: `TypeError: productsRoute.handlePostProductSync is not a function` (or similar)

- [ ] **Step 3: Write the implementation**

In `src/web-ui/routes/products.js`, add near the top (after the existing requires) a new require for the rollup module and adapter module:

```javascript
var _productRollup = require('../modules/product-rollup'); // pr-s3
var _pipelineStateFetchAdapter = require('../adapters/pipeline-state-fetch-adapter'); // pr-s3
```

Add the new handler after `handleGetProductView` (before `handleDeleteProduct`):

```javascript
/**
 * pr-s3 AC2/AC4 -- POST /products/:id/sync: triggers a new sync of the
 * product's connected repo's pipeline-state.json, writing a fresh rollup to
 * the cache table. Rejects with 409 if a sync for this product is already
 * in flight (AC4) rather than starting a second concurrent fetch.
 */
async function handlePostProductSync(req, res, _next, pool, posthog) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var accessToken = req.session && req.session.accessToken;

  var prodRow = (await _pool.query(
    'SELECT product_id, tenant_id FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }

  if (_productRollup.isSyncInProgress(productId)) {
    if (res.status) { res.status(409).json({ error: 'A sync for this product is already in progress' }); }
    else { res.writeHead(409, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'A sync for this product is already in progress' })); }
    return;
  }

  var repoRow = (await _pool.query(
    'SELECT repo_owner, repo_name FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!repoRow || !repoRow.repo_owner || !repoRow.repo_name) {
    if (res.status) { res.status(400).json({ error: 'This product has no GitHub repo configured.' }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'This product has no GitHub repo configured.' })); }
    return;
  }

  try {
    var rollup = await _productRollup.triggerProductSync(_pool, _pipelineStateFetchAdapter, {
      productId: productId,
      repoOwner: repoRow.repo_owner,
      repoName: repoRow.repo_name,
      accessToken: accessToken
    });
    if (res.status) { res.status(200).json({ synced: true, rollup: rollup }); }
    else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ synced: true, rollup: rollup })); }
  } catch (err) {
    if (res.status) { res.status(502).json({ error: err.message }); }
    else { res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message })); }
  }
}
```

Add `handlePostProductSync` to `module.exports` at the bottom of the file.

In `src/web-ui/server.js`, add the require for the new handler to the existing products destructure (search for `handleGetProductView` in the requires block) — add `handlePostProductSync` to that same destructured require line.

Add the route match immediately after the existing `pathname.match(/^\/products\/[^/]+$/) && req.method === 'GET'` block:

```javascript

  } else if (pathname.match(/^\/products\/[^/]+\/sync$/) && req.method === 'POST') {
    // pr-s3 -- trigger a new sync of the product's connected repo
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handlePostProductSync(req, res, null, _pshPool, null); });
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-products-route.js
```

Expected output: `[pr-s2-pr-s3-products-route] Results: 4 passed, 0 failed`

- [ ] **Step 5: Sanity-check both modified files still parse**

```bash
node -c src/web-ui/routes/products.js
node -c src/web-ui/server.js
```

- [ ] **Step 6: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/products.js src/web-ui/server.js tests/check-pr-s2-products-route.js
git commit -m "feat(pr-s3): add POST /products/:id/sync route with concurrency rejection"
```

---

## Task 4: Render freshness + Refresh UI in the product view (AC1, AC3, AC4 render, NFR-Perf, NFR-A11y)

**Files:**
- Modify: `src/web-ui/routes/products.js` (`_renderProductView`, `handleGetProductView`)
- Modify (append to): `tests/check-pr-s2-products-route.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-pr-s2-products-route.js`, inside the same async IIFE, immediately before the final `console.log('\n[pr-s2-pr-s3-products-route] Results...` line:

```javascript

  console.log('\n[pr-s3] AC1/AC3/AC4 -- freshness section and Refresh control render correctly in all three states');

  await (async function() {
    try {
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/routes/products.js'))];
      var productsRouteFresh = require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));
      var rollupModPath = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
      delete require.cache[require.resolve(rollupModPath)];
      var rollupMod = require(rollupModPath);

      // State 1: never synced (AC3)
      var mockPoolNeverSynced = {
        query: async function(sql) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          if (/SELECT dod_status_counts, synced_at FROM product_rollups/i.test(sql)) return { rows: [] };
          return { rows: [] };
        }
      };
      var htmlNeverSynced = null;
      var reqNeverSynced = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var resNeverSynced = { writeHead: function() {}, end: function(body) { htmlNeverSynced = body; } };
      await productsRouteFresh.handleGetProductView(reqNeverSynced, resNeverSynced, null, mockPoolNeverSynced);
      if (!/Not yet synced/i.test(htmlNeverSynced)) throw new Error('Expected "Not yet synced" text in the rendered page when no rollup row exists');
      passed++; console.log('  [PASS] _renderProductView: shows "Not yet synced" when no cache row exists (AC3)');

      // State 2: previously synced (AC1)
      var syncedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      var mockPoolSynced = {
        query: async function(sql) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          if (/SELECT dod_status_counts, synced_at FROM product_rollups/i.test(sql)) return { rows: [{ dod_status_counts: '{"complete":1}', synced_at: syncedAt }] };
          return { rows: [] };
        }
      };
      var htmlSynced = null;
      var reqSynced = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var resSynced = { writeHead: function() {}, end: function(body) { htmlSynced = body; } };
      await productsRouteFresh.handleGetProductView(reqSynced, resSynced, null, mockPoolSynced);
      if (!/2 hours? ago/i.test(htmlSynced)) throw new Error('Expected a relative-time string mentioning "2 hours ago" in the rendered page');
      passed++; console.log('  [PASS] _renderProductView: shows human-readable last-synced time (AC1)');
      if (!/Refresh/i.test(htmlSynced)) throw new Error('Expected a Refresh action in the rendered page');
      passed++; console.log('  [PASS] _renderProductView: renders a Refresh action');

      // State 3: sync currently in progress (AC4) -- render must disable Refresh
      // and show a non-colour-only loading signal (text label)
      rollupMod._syncsInProgressForTest = rollupMod._syncsInProgressForTest; // no-op guard, real check below
      var wasInProgress = rollupMod.isSyncInProgress('p1');
      // Force the in-flight flag on via triggerProductSync's own tracked Set,
      // using a fetch adapter that never resolves during this synchronous check.
      var adapterModPath = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
      delete require.cache[require.resolve(adapterModPath)];
      var adapterMod = require(adapterModPath);
      adapterMod.setPipelineStateFetchAdapter(function() { return new Promise(function() {}); }); // never resolves
      var mockPoolForTrigger = { query: async function() { return { rows: [] }; } };
      rollupMod.triggerProductSync(mockPoolForTrigger, adapterMod, { productId: 'p1', repoOwner: 'acme', repoName: 'widgets', accessToken: 'x' }); // fire and forget, intentionally not awaited

      var htmlInProgress = null;
      var reqInProgress = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var resInProgress = { writeHead: function() {}, end: function(body) { htmlInProgress = body; } };
      await productsRouteFresh.handleGetProductView(reqInProgress, resInProgress, null, mockPoolSynced);
      if (!/disabled/i.test(htmlInProgress)) throw new Error('Expected the Refresh control to render as disabled while a sync is in progress (AC4)');
      passed++; console.log('  [PASS] _renderProductView: Refresh control is disabled while a sync is in progress (AC4)');
      if (!/(Syncing|Refreshing|in progress)/i.test(htmlInProgress)) throw new Error('Expected a text loading label (not colour-only) during sync (NFR-A11y)');
      passed++; console.log('  [PASS] _renderProductView: loading state has a text label, not colour alone (NFR-A11y)');
    } catch (err) {
      failed++; console.log('  [FAIL] freshness/Refresh rendering --', err.message);
    }
  })();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-products-route.js
```

Expected: fails on the "Not yet synced" assertion (current `_renderProductView` doesn't render freshness text at all yet).

- [ ] **Step 3: Write the implementation**

In `src/web-ui/routes/products.js`, add a require for the freshness formatter near the top:

```javascript
var _syncFreshness = require('../modules/sync-freshness'); // pr-s3
```

Modify `_renderProductView`'s signature and body — change:

```javascript
function _renderProductView(productName, productId, features, login, rollupRow) {
```

to:

```javascript
function _renderProductView(productName, productId, features, login, rollupRow, isSyncing) {
```

Replace the existing `dodStatusHtml` block with a combined freshness + DoD status + Refresh control block:

```javascript
  var syncedAtLabel = rollupRow ? _syncFreshness.formatSyncedAt(rollupRow.synced_at) : _syncFreshness.formatSyncedAt(null);
  var dodCountsHtml = rollupRow
    ? Object.entries(JSON.parse(rollupRow.dod_status_counts || '{}')).map(function(entry) {
        return _escapeHtml(entry[0]) + ': ' + _escapeHtml(String(entry[1]));
      }).join(' &middot; ')
    : '';
  var refreshLabel = isSyncing ? 'Syncing…' : 'Refresh';
  var refreshDisabledAttr = isSyncing ? ' disabled' : '';
  var freshnessHtml =
    '<div style="margin-top:12px;display:flex;align-items:center;gap:10px;font-size:13px;color:var(--muted)">' +
      '<span id="psh-sync-label">' + _escapeHtml(syncedAtLabel) + (dodCountsHtml ? ' &middot; ' + dodCountsHtml : '') + '</span>' +
      '<button type="button" id="psh-refresh-btn" onclick="pshTriggerSync(\'' + _escapeHtml(productId) + '\')"' + refreshDisabledAttr + ' style="padding:4px 10px;border:1px solid var(--line);border-radius:5px;background:none;font-size:12px;cursor:pointer;color:var(--ink)">' + _escapeHtml(refreshLabel) + '</button>' +
    '</div>';
```

Replace the line `dodStatusHtml +` in the `body` concatenation with `freshnessHtml +`.

Add a client script (append to the existing `<script>...</script>` block in `_renderProductView`, before the closing `<\/script>`):

```javascript
    'async function pshTriggerSync(id){' +
      'var btn=document.getElementById(\'psh-refresh-btn\');' +
      'var label=document.getElementById(\'psh-sync-label\');' +
      'btn.disabled=true;btn.textContent=\'Syncing…\';' +
      'try{' +
        'var r=await fetch(\'/products/\'+id+\'/sync\',{method:\'POST\'});' +
        'if(r.ok){window.location.reload();}' +
        'else{var j=await r.json();alert(j.error||\'Sync failed\');}' +
      '}catch(e){alert(\'Sync failed: \'+e.message);}' +
      'finally{btn.disabled=false;btn.textContent=\'Refresh\';}' +
    '}' +
```

In `handleGetProductView`, after the existing `rollupRow` query, add an in-flight check and pass it through:

```javascript
  var isSyncing = _productRollup.isSyncInProgress(productId);
```

Update the render call:

```javascript
    var html = _renderProductView(productName, productId, features, login, rollupRow, isSyncing);
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-products-route.js
```

Expected output: `[pr-s2-pr-s3-products-route] Results: 9 passed, 0 failed`

- [ ] **Step 5: Sanity-check syntax**

```bash
node -c src/web-ui/routes/products.js
```

- [ ] **Step 6: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-pr-s2-products-route.js
git commit -m "feat(pr-s3): render last-synced freshness and a working Refresh control"
```

---

## Final check before handoff

- [ ] All 4 story ACs covered: AC1 (Task 1, Task 4), AC2 (Task 3), AC3 (Task 1, Task 4), AC4 (Task 2, Task 3, Task 4)
- [ ] Total new/appended tests: 5 (freshness formatting) + 2 (concurrency guard, appended to pr-s2's product-rollup test file) + 9 (route + rendering, appended to pr-s2's products-route test file) = 16
- [ ] `npm test` full suite run after all 4 tasks — compare failed-file count against this branch's own baseline (captured at `/branch-setup`, based on `feature/pr-s2` since pr-s2 is unmerged) — must be unchanged or lower, never higher
- [ ] Since this branch is based on `feature/pr-s2` rather than `origin/master`, note in the PR description that this PR should not be merged before (or independently of) PR #490 (pr-s2) — either rebase onto master after pr-s2 merges, or merge in sequence
