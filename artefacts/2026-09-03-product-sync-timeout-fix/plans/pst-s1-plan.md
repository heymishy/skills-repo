# Make product sync fire-and-forget with client-side polling — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Fix a live production bug: `POST /products/:id/sync` currently blocks the HTTP response on the full GitHub-fetch-plus-rollup-computation duration, which exceeds the platform's own reverse-proxy timeout for products with a large connected `pipeline-state.json`. Return an immediate acknowledgment before that work starts, run it in the background, and let the client poll a new lightweight status endpoint until it completes.
**Branch:** `feature/pst-s1`
**Worktree:** `.worktrees/pst-s1`
**Test command:** `npm test` (full suite) / `node tests/check-pst-s1-sync-async-polling.js` (this story's own file)

---

## File map

```
Create:
  tests/check-pst-s1-sync-async-polling.js  — 4 unit + 1 integration + 2 NFR tests for AC1-AC5

Modify:
  src/web-ui/routes/products.js  — handlePostProductSync becomes fire-and-forget (AC1/AC3);
                                    new handleGetProductSyncStatus handler (AC4 backend);
                                    pshTriggerSync inline client script polls instead of
                                    waiting on one request (AC4 frontend); new export.
  src/web-ui/server.js            — wire GET /products/:id/sync/status route (AC4 backend)
  tests/check-pr-s2-products-route.js  — pr-s3's own happy-path test asserted a synchronous
                                    write immediately after handlePostProductSync resolved;
                                    that assumption no longer holds once the response is
                                    fire-and-forget. Update it to await the background work
                                    via the same deferred-promise pattern its own AC4
                                    concurrency test already uses, so it still proves a real
                                    rollup write happens -- just not synchronously with the
                                    HTTP response.
```

---

## Task 1: Sync route responds immediately and logs background failures (AC1, AC3)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-pst-s1-sync-async-polling.js`

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/check-pst-s1-sync-async-polling.js
'use strict';
var assert = require('assert');
var path = require('path');
var passed = 0; var failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

console.log('\n[pst-s1] AC1/AC3 -- sync route responds immediately and logs background failures');

(async function() {
  var PRODUCTS_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');

  // AC1: response is sent before the background sync work resolves
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
        await fetchGate; // never resolves until the test releases it
        return { content: Buffer.from(JSON.stringify({ features: [] })).toString('base64'), encoding: 'base64' };
      });

      delete require.cache[require.resolve(PRODUCTS_PATH)];
      var productsRouteFresh = require(PRODUCTS_PATH);

      var mockPool = {
        query: async function(sql) {
          if (/SELECT product_id, tenant_id FROM products/i.test(sql)) return { rows: [{ product_id: 'p-ac1', tenant_id: 't1' }] };
          if (/SELECT repo_owner, repo_name FROM products/i.test(sql)) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
          return { rows: [] };
        }
      };
      var req = { params: { id: 'p-ac1' }, session: { tenantId: 't1', accessToken: 'fake-token' } };
      var responded = false; var statusCode = null;
      var res = { status: function(c) { statusCode = c; responded = true; return { json: function() {} }; } };

      var start = Date.now();
      await productsRouteFresh.handlePostProductSync(req, res, null, mockPool, null);
      var elapsed = Date.now() - start;

      if (!responded) throw new Error('Expected a response to have been sent before the deferred fetch resolved');
      if (statusCode !== 202) throw new Error('Expected 202, got ' + statusCode);
      if (elapsed > 1000) throw new Error('Expected the immediate response in well under 1000ms, took ' + elapsed + 'ms');
      passed++; console.log('  [PASS] handlePostProductSync: responds 202 before the background fetch resolves (AC1)');
      resolveFetch();
      await new Promise(function(r) { setTimeout(r, 10); }); // let the background promise settle
    } catch (err) { failed++; console.log('  [FAIL] AC1 immediate response --', err.message); }
  })();

  // AC3: a background failure is logged via console.error, not swallowed
  await (async function() {
    try {
      var rollupModPath = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
      delete require.cache[require.resolve(rollupModPath)];
      var adapterModPath = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
      delete require.cache[require.resolve(adapterModPath)];
      var adapterMod = require(adapterModPath);
      adapterMod.setPipelineStateFetchAdapter(async function() { throw new Error('simulated GitHub fetch failure'); });

      delete require.cache[require.resolve(PRODUCTS_PATH)];
      var productsRouteFresh = require(PRODUCTS_PATH);

      var mockPool = {
        query: async function(sql) {
          if (/SELECT product_id, tenant_id FROM products/i.test(sql)) return { rows: [{ product_id: 'p-ac3', tenant_id: 't1' }] };
          if (/SELECT repo_owner, repo_name FROM products/i.test(sql)) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
          return { rows: [] };
        }
      };
      var req = { params: { id: 'p-ac3' }, session: { tenantId: 't1', accessToken: 'fake-token' } };
      var res = { status: function() { return { json: function() {} }; } };

      var errorLogs = [];
      var originalConsoleError = console.error;
      console.error = function() { errorLogs.push(Array.prototype.slice.call(arguments)); };
      try {
        await productsRouteFresh.handlePostProductSync(req, res, null, mockPool, null);
        await new Promise(function(r) { setTimeout(r, 20); }); // let the background rejection settle
      } finally {
        console.error = originalConsoleError;
      }

      var loggedTheFailure = errorLogs.some(function(args) {
        return args.some(function(a) { return typeof a === 'string' && /simulated GitHub fetch failure|p-ac3/.test(a); });
      });
      if (!loggedTheFailure) throw new Error('Expected the background failure to be logged via console.error, got: ' + JSON.stringify(errorLogs));
      passed++; console.log('  [PASS] handlePostProductSync: background failure is logged via console.error, not swallowed (AC3)');
    } catch (err) { failed++; console.log('  [FAIL] AC3 background failure logged --', err.message); }
  })();

  console.log('\n[pst-s1] Results so far: ' + passed + ' passed, ' + failed + ' failed');
  if (require.main === module) { process.exitCode = failed > 0 ? 1 : 0; }
})();

module.exports = { getCounts: function() { return { passed: passed, failed: failed }; } };
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pst-s1-sync-async-polling.js
```

Expected output: `[FAIL] AC1 immediate response -- Expected 202, got 200` (current handler awaits the full sync before responding, with the old `{synced:true,...}` 200 shape)

- [ ] **Step 3: Write the implementation**

Replace `handlePostProductSync` (currently `src/web-ui/routes/products.js` lines 2413-2458) with:

```javascript
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

  // pst-s1 (AC1): respond immediately -- never block the HTTP response on the
  // GitHub fetch + rollup computation, which can exceed the platform's own
  // reverse-proxy timeout for large connected repos. triggerProductSync's own
  // in-flight guard (_syncsInProgress) is set synchronously before its first
  // await, so isSyncInProgress() already reflects "in progress" by the time
  // this response is sent -- the client's first status poll will see it.
  if (res.status) { res.status(202).json({ started: true }); }
  else { res.writeHead(202, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ started: true })); }

  // pst-s1 (AC3): no HTTP request is waiting to observe a background failure
  // directly -- log it server-side so it stays diagnosable rather than
  // becoming a silent, unhandled promise rejection.
  _productRollup.triggerProductSync(_pool, _pipelineStateFetchAdapter, {
    productId: productId,
    repoOwner: repoRow.repo_owner,
    repoName: repoRow.repo_name,
    accessToken: accessToken
  }).catch(function(err) {
    console.error('[product-sync] background sync failed for product ' + productId + ':', err.message);
  });
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pst-s1-sync-async-polling.js
```

Expected output: `[PASS] handlePostProductSync: responds 202 before the background fetch resolves (AC1)` and `[PASS] handlePostProductSync: background failure is logged via console.error, not swallowed (AC3)`

- [ ] **Step 5: Run full suite — check what regresses**

```bash
npm test
```

Expected output: `tests/check-pr-s2-products-route.js`'s pr-s3 happy-path sub-test now fails (`Expected exactly one cache write, got 0`) — this is the known, expected coupling named in the File map; fixed in Task 2. No other file should newly fail. If anything else fails, stop and investigate before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-pst-s1-sync-async-polling.js
git commit -m "fix: respond immediately from product sync and log background failures (AC1, AC3)"
```

---

## Task 2: Background success still writes product_rollups; fix the now-outdated pr-s3 coupling (AC2)

**Files:**
- Test: `tests/check-pst-s1-sync-async-polling.js` (append)
- Modify: `tests/check-pr-s2-products-route.js`

- [ ] **Step 1: Write the failing integration test**

Append to `tests/check-pst-s1-sync-async-polling.js`, before the final `console.log('\n[pst-s1] Results so far...')` block:

```javascript
  console.log('\n[pst-s1] AC2 -- background success still writes to product_rollups exactly as before');

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

      delete require.cache[require.resolve(PRODUCTS_PATH)];
      var productsRouteFresh = require(PRODUCTS_PATH);

      var writtenRows = [];
      var mockPool = {
        query: async function(sql, params) {
          if (/SELECT product_id, tenant_id FROM products/i.test(sql)) return { rows: [{ product_id: 'p-ac2', tenant_id: 't1' }] };
          if (/SELECT repo_owner, repo_name FROM products/i.test(sql)) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
          if (/INSERT INTO product_rollups/i.test(sql)) { writtenRows.push(params); return { rows: [] }; }
          return { rows: [] };
        }
      };
      var req = { params: { id: 'p-ac2' }, session: { tenantId: 't1', accessToken: 'fake-token' } };
      var res = { status: function() { return { json: function() {} }; } };

      await productsRouteFresh.handlePostProductSync(req, res, null, mockPool, null);
      if (writtenRows.length !== 0) throw new Error('Expected zero writes before the background fetch resolves, got ' + writtenRows.length);
      resolveFetch();
      await new Promise(function(r) { setTimeout(r, 20); }); // let the background write settle
      if (writtenRows.length !== 1) throw new Error('Expected exactly one cache write once the background sync resolves, got ' + writtenRows.length);
      passed++; console.log('  [PASS] handlePostProductSync: background success still writes exactly one product_rollups row, unchanged shape (AC2)');
    } catch (err) { failed++; console.log('  [FAIL] AC2 background write --', err.message); }
  })();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pst-s1-sync-async-polling.js
```

Expected output: passes already if Task 1 is done correctly (this test targets the same behaviour Task 1 implemented) — this step confirms it, it should already be green. If red, the Task 1 implementation has a defect; fix it before continuing.

- [ ] **Step 3: Fix the now-outdated pr-s3 happy-path test**

In `tests/check-pr-s2-products-route.js`, the `[pr-s3] AC2` block (around line 43-92) currently does:

```javascript
      await productsRouteFresh.handlePostProductSync(req, res, null, mockPool, null);

      passed++; console.log('  [PASS] handlePostProductSync: completes without throwing for a valid product with a connected repo');
      if (writtenRows.length !== 1) { throw new Error('Expected exactly one cache write, got ' + writtenRows.length); }
      passed++; console.log('  [PASS] handlePostProductSync: writes exactly one rollup cache row via triggerProductSync');
```

Replace those three lines with (matching the deferred-promise pattern the file's own AC4 concurrency test below it already uses, and switching the mocked adapter to a deferred one so this still proves genuine decoupling):

```javascript
      await productsRouteFresh.handlePostProductSync(req, res, null, mockPool, null);

      passed++; console.log('  [PASS] handlePostProductSync: completes without throwing for a valid product with a connected repo');
      // pst-s1: the response is now fire-and-forget (AC1) -- the background
      // write is no longer guaranteed to have happened synchronously with
      // the response. Wait briefly for it to settle before asserting.
      await new Promise(function(r) { setTimeout(r, 20); });
      if (writtenRows.length !== 1) { throw new Error('Expected exactly one cache write, got ' + writtenRows.length); }
      passed++; console.log('  [PASS] handlePostProductSync: writes exactly one rollup cache row via triggerProductSync');
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-products-route.js
node tests/check-pst-s1-sync-async-polling.js
```

Expected output: all `[PASS]` lines, 0 `[FAIL]` in both files.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same result as this story's own baseline (598 files run, 1 pre-existing unrelated failure in `tests/check-p3.5-validate-trace.js`, 0 new failures).

- [ ] **Step 6: Commit**

```bash
git add tests/check-pst-s1-sync-async-polling.js tests/check-pr-s2-products-route.js
git commit -m "test: fix pr-s3 happy-path coupling to the new fire-and-forget sync response (AC2)"
```

---

## Task 3: New sync-status endpoint, wired end to end (AC4 backend)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Modify: `src/web-ui/server.js`
- Test: `tests/check-pst-s1-sync-async-polling.js` (append)

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-pst-s1-sync-async-polling.js`:

```javascript
  console.log('\n[pst-s1] AC4 (backend) -- GET /products/:id/sync/status reports in-flight state, tenant-scoped');

  await (async function() {
    try {
      delete require.cache[require.resolve(PRODUCTS_PATH)];
      var productsRouteFresh = require(PRODUCTS_PATH);

      if (typeof productsRouteFresh.handleGetProductSyncStatus !== 'function') {
        throw new Error('Expected products.js to export handleGetProductSyncStatus');
      }
      passed++; console.log('  [PASS] products.js exports handleGetProductSyncStatus');

      var mockPool = {
        query: async function(sql) {
          if (/SELECT product_id, tenant_id FROM products/i.test(sql)) return { rows: [{ product_id: 'p-status', tenant_id: 't1' }] };
          return { rows: [] };
        }
      };

      // Wrong tenant -> 404, no leak of sync state across tenants
      var wrongTenantReq = { params: { id: 'p-status' }, session: { tenantId: 't-other' } };
      var wrongTenantStatus = null;
      var wrongTenantRes = { status: function(c) { wrongTenantStatus = c; return { json: function() {} }; } };
      await productsRouteFresh.handleGetProductSyncStatus(wrongTenantReq, wrongTenantRes, null, mockPool);
      if (wrongTenantStatus !== 404) throw new Error('Expected 404 for a mismatched tenant, got ' + wrongTenantStatus);
      passed++; console.log('  [PASS] handleGetProductSyncStatus: 404 for a product outside the caller\'s tenant (NFR-Security)');

      // Correct tenant, no sync in progress -> inProgress:false
      var req = { params: { id: 'p-status' }, session: { tenantId: 't1' } };
      var jsonBody = null;
      var res = { status: function() { return { json: function(b) { jsonBody = b; } }; } };
      await productsRouteFresh.handleGetProductSyncStatus(req, res, null, mockPool);
      if (jsonBody.inProgress !== false) throw new Error('Expected inProgress:false when no sync is running, got ' + JSON.stringify(jsonBody));
      passed++; console.log('  [PASS] handleGetProductSyncStatus: reports inProgress:false when no sync is running (AC4)');
    } catch (err) { failed++; console.log('  [FAIL] AC4 backend status endpoint --', err.message); }
  })();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pst-s1-sync-async-polling.js
```

Expected output: `[FAIL] products.js exports handleGetProductSyncStatus -- Expected products.js to export handleGetProductSyncStatus` (handler does not exist yet)

- [ ] **Step 3: Write the implementation**

Add this new function in `src/web-ui/routes/products.js`, directly after `handlePostProductSync` (after the closing `}` currently at line 2458):

```javascript
/**
 * pst-s1 (AC4): GET /products/:id/sync/status -- lightweight status check the
 * client polls after triggering a fire-and-forget sync (handlePostProductSync).
 * Backed entirely by the existing isSyncInProgress guard -- no new
 * state-tracking mechanism.
 */
async function handleGetProductSyncStatus(req, res, _next, pool) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;

  var prodRow = (await _pool.query(
    'SELECT product_id, tenant_id FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }

  var inProgress = _productRollup.isSyncInProgress(productId);
  if (res.status) { res.status(200).json({ inProgress: inProgress }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ inProgress: inProgress })); }
}
```

Add it to `module.exports` in the same file (next to the existing `handlePostProductSync,` line):

```javascript
  handlePostProductSync,
  handleGetProductSyncStatus,
```

In `src/web-ui/server.js`, add a new route branch immediately after the existing `/products/:id/sync` POST branch (after its closing `});` currently at line 3372):

```javascript
  } else if (pathname.match(/^\/products\/[^/]+\/sync\/status$/) && req.method === 'GET') {
    // pst-s1 -- lightweight poll target for the fire-and-forget sync trigger
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handleGetProductSyncStatus(req, res, null, _pshPool); });

```

Add `handleGetProductSyncStatus` to the destructured import of `../routes/products` at the top of `server.js` (find the existing line that destructures `handlePostProductSync` from that module and add `handleGetProductSyncStatus` alongside it).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pst-s1-sync-async-polling.js
```

Expected output: all three new `[PASS]` lines for AC4 backend.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same baseline (598 files, 1 pre-existing unrelated failure), 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js src/web-ui/server.js tests/check-pst-s1-sync-async-polling.js
git commit -m "feat: add GET /products/:id/sync/status, tenant-scoped (AC4 backend)"
```

---

## Task 4: Client polls for completion instead of waiting on one request (AC4 frontend)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-pst-s1-sync-async-polling.js` (append)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-pst-s1-sync-async-polling.js`:

```javascript
  console.log('\n[pst-s1] AC4 (frontend) -- rendered page includes real polling logic targeting the status endpoint');

  await (async function() {
    try {
      delete require.cache[require.resolve(PRODUCTS_PATH)];
      var productsRouteFresh = require(PRODUCTS_PATH);
      var html = productsRouteFresh._renderProductView('Acme', 'p1', [], 'user1', null, false, null, null, [], 'csrf-token', {}, {}, [], 0, null, false);

      if (!/pshTriggerSync/.test(html)) throw new Error('Expected the pshTriggerSync function to still be rendered');
      passed++; console.log('  [PASS] _renderProductView: still renders pshTriggerSync');

      if (!/\/sync\/status/.test(html)) throw new Error('Expected a fetch call targeting a .../sync/status-shaped URL in the rendered script');
      passed++; console.log('  [PASS] _renderProductView: rendered script fetches the new sync/status endpoint (AC4)');

      if (!/setTimeout\(/.test(html)) throw new Error('Expected a real polling construct (setTimeout), not a single one-shot fetch');
      passed++; console.log('  [PASS] _renderProductView: rendered script contains a polling construct, not a one-shot fetch (AC4)');

      if (!/window\.location\.reload\(\)/.test(html)) throw new Error('Expected a window.location.reload() call gated on the polled status');
      passed++; console.log('  [PASS] _renderProductView: rendered script reloads the page once polling reports completion (AC4)');
    } catch (err) { failed++; console.log('  [FAIL] AC4 frontend polling script --', err.message); }
  })();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pst-s1-sync-async-polling.js
```

Expected output: `[FAIL] _renderProductView: rendered script fetches the new sync/status endpoint (AC4) -- Expected a fetch call targeting a .../sync/status-shaped URL...`

- [ ] **Step 3: Write the implementation**

In `src/web-ui/routes/products.js`, replace the existing `pshTriggerSync` client function (currently lines 979-989) with:

```javascript
    'async function pshTriggerSync(id){' +
      'var btn=document.getElementById(\'psh-refresh-btn\');' +
      'btn.disabled=true;btn.textContent=\'Syncing…\';' +
      'try{' +
        'var r=await fetch(\'/products/\'+id+\'/sync\',{method:\'POST\'});' +
        'if(!r.ok){var j=await r.json();alert(j.error||\'Sync failed\');btn.disabled=false;btn.textContent=\'Refresh\';return;}' +
        'var pshPoll=function(){' +
          'fetch(\'/products/\'+id+\'/sync/status\').then(function(sr){return sr.json();}).then(function(sj){' +
            'if(sj.inProgress){setTimeout(pshPoll,3000);}' +
            'else{window.location.reload();}' +
          '}).catch(function(){setTimeout(pshPoll,3000);});' +
        '};' +
        'setTimeout(pshPoll,3000);' +
      '}catch(e){alert(\'Sync failed: \'+e.message);btn.disabled=false;btn.textContent=\'Refresh\';}' +
    '}' +
```

(Note: the previous `finally{btn.disabled=false;btn.textContent='Refresh';}` block is intentionally removed — the button must stay disabled/"Syncing…" through the whole poll cycle, per AC4; it is only re-enabled explicitly on the two error paths above.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pst-s1-sync-async-polling.js
```

Expected output: all four new `[PASS]` lines for AC4 frontend.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same baseline (598 files, 1 pre-existing unrelated failure), 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-pst-s1-sync-async-polling.js
git commit -m "feat: poll for sync completion client-side instead of waiting on one request (AC4 frontend)"
```

---

## Task 5: Regression guard — existing isSyncing button-disable state on page load is unaffected (AC5)

**Files:**
- Test: `tests/check-pst-s1-sync-async-polling.js` (append)

No production code change in this task — `handleGetProductView`'s existing `isSyncing` read is untouched by Tasks 1-4. This task adds the explicit regression-guard test the story's AC5 requires.

- [ ] **Step 1: Write the test**

Append to `tests/check-pst-s1-sync-async-polling.js`, immediately before the final `console.log('\n[pst-s1] Results so far...')` block:

```javascript
  console.log('\n[pst-s1] AC5 (regression guard) -- existing isSyncing-driven button-disable state on page load is unaffected');

  await (async function() {
    try {
      delete require.cache[require.resolve(PRODUCTS_PATH)];
      var productsRouteFresh = require(PRODUCTS_PATH);
      var html = productsRouteFresh._renderProductView('Acme', 'p1', [], 'user1', null, true, null, null, [], 'csrf-token', {}, {}, [], 0, null, false);

      if (!/disabled/i.test(html)) throw new Error('Expected the Refresh control to render disabled when isSyncing is true');
      passed++; console.log('  [PASS] _renderProductView: Refresh control still renders disabled when isSyncing=true (AC5)');
      if (!/Syncing…/.test(html)) throw new Error('Expected the "Syncing…" label when isSyncing is true');
      passed++; console.log('  [PASS] _renderProductView: Refresh control still shows "Syncing…" label when isSyncing=true (AC5)');
    } catch (err) { failed++; console.log('  [FAIL] AC5 regression guard --', err.message); }
  })();
```

- [ ] **Step 2: Run test — must pass immediately (no implementation change needed)**

```bash
node tests/check-pst-s1-sync-async-polling.js
```

Expected output: `[PASS] _renderProductView: Refresh control still renders disabled when isSyncing=true (AC5)` and the "Syncing…" label check, both green on the first run — confirms Tasks 1-4 did not regress this pre-existing behaviour.

- [ ] **Step 3: Run full suite — final check**

```bash
npm test
```

Expected output: same baseline (598 files, 1 pre-existing unrelated failure in `tests/check-p3.5-validate-trace.js`), 0 new failures. This is the last task — all 5 story ACs now have passing tests.

- [ ] **Step 4: Commit**

```bash
git add tests/check-pst-s1-sync-async-polling.js
git commit -m "test: add AC5 regression guard for pre-existing isSyncing button-disable state"
```

---

<!-- End of plan. Next: /verify-completion once all 5 tasks are committed. -->
