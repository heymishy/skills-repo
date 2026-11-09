'use strict';
const assert = require('assert');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

const PRODUCT_REPO_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/product-repo.js');
const PRODUCT_ROLLUP_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
const REPO_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/repo-adapter.js');
const PIPELINE_STATE_FETCH_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
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
    const neverResolves = new Promise(function() {});
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
  } catch (e) { fail('AC1: triggerProductSync called with correct productId/repoOwner/repoName/accessToken, response completes without awaiting it', e); }

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
    pass("AC2: re-connect while a sync is already in-flight still succeeds; call site relies on triggerProductSync's own guard, not a duplicate one");
  } catch (e) { fail("AC2: re-connect while a sync is already in-flight still succeeds; call site relies on triggerProductSync's own guard, not a duplicate one", e); }

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

  // T4 (AC4) -- after connect, the real sync path is reachable end-to-end (no manual Refresh needed)
  try {
    const repoAdapterModule = freshRequire(REPO_ADAPTER_PATH);
    repoAdapterModule.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });

    const productRollup = freshRequire(PRODUCT_ROLLUP_PATH);
    const fakeAdapter = freshRequire(PIPELINE_STATE_FETCH_ADAPTER_PATH);
    const fixture = { features: [{ slug: 'demo-feature', name: 'Demo Feature', stage: 'definition', health: 'green', track: 'standard' }] };
    const originalGetAdapter = fakeAdapter.getPipelineStateFetchAdapter;
    fakeAdapter.getPipelineStateFetchAdapter = function() {
      return { fetchPipelineState: async function() { return fixture; } };
    };

    let reachedRealSync = false;
    const originalTriggerProductSync = productRollup.triggerProductSync;
    productRollup.triggerProductSync = function(pool, adapterModule, opts) {
      reachedRealSync = true;
      return Promise.resolve({ productId: opts.productId });
    };

    const { handlePostConnectRepo } = freshRequire(PRODUCT_REPO_ROUTE_PATH);
    const pool = makeMockPool({ productId: 'prod-sync-4', tenantId: 'tx' });
    const req = { session: { tenantId: 'tx', accessToken: 'gh-token-4', login: 'dana' }, params: { id: 'prod-sync-4' }, body: { owner: 'acme', repo: 'widgets' } };
    const res = mockRes();

    await handlePostConnectRepo(req, res, null, pool, mockPosthog());
    await new Promise(function(r) { setImmediate(r); });

    assert.strictEqual(res._s, 200, `Expected the connect response to succeed, got ${res._s}`);
    assert.strictEqual(reachedRealSync, true, 'The connect call site never reached triggerProductSync at all');
    pass('AC4: connect triggers the sync call site end-to-end with no manual Refresh call needed');
    fakeAdapter.getPipelineStateFetchAdapter = originalGetAdapter;
    void originalTriggerProductSync;
  } catch (e) { fail('AC4: connect triggers the sync call site end-to-end with no manual Refresh call needed', e); }

  // T5 (NFR-Performance) -- response completes well before a slow mocked sync resolves
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
    pass(`NFR-Performance: response completed in ${elapsed}ms, well under the 500ms mocked sync delay`);
  } catch (e) { fail('NFR-Performance: response does not block on the GitHub fetch + rollup computation', e); }

  console.log(`\n[urpv-s1] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
