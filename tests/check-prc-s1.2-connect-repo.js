'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

const REPO_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/repo-adapter.js');
const PRODUCT_REPO_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/product-repo.js');
const SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');
function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }

function makeMockPool(state) {
  // state = { productId, tenantId }
  const queries = [];
  return {
    _queries: queries,
    query: async function(sql, params) {
      queries.push({ sql, params });
      if (/SELECT product_id, tenant_id FROM products WHERE product_id/i.test(sql)) {
        if (params[0] !== state.productId) return { rows: [] };
        return { rows: [{ product_id: state.productId, tenant_id: state.tenantId }] };
      }
      if (/UPDATE products SET repo_provider/i.test(sql)) {
        return { rowCount: 1 };
      }
      return { rows: [] };
    }
  };
}
function mockRes() {
  return { _s: null, _b: null, status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; return this; } };
}
function mockPosthog() { return { _caps: [], capture: function(id, ev, props) { this._caps.push({ id, ev, props }); } }; }

(async function() {
  // T1 (AC5, first half) — unwired repoAdapter throws, never a silent safe return
  try {
    const repoAdapter = freshRequire(REPO_ADAPTER_PATH);
    let threw = null;
    try {
      await repoAdapter.getRepoAdapter()('acme', 'widgets', 'fake-token');
    } catch (e) { threw = e; }
    assert(threw, 'Expected getRepoAdapter() to throw when unwired');
    assert.strictEqual(
      threw.message,
      'Adapter not wired: repoAdapter. Call setRepoAdapter() with a real implementation before use.',
      'Error message does not match the D37 convention exactly'
    );
    pass('unwired repoAdapter throws the exact D37 error message, never a silent safe return');
  } catch (e) { fail('unwired repoAdapter throws the exact D37 error message, never a silent safe return', e); }

  const repoAdapterModule = require('../src/web-ui/adapters/repo-adapter');

  // T2 (AC1) — connecting a repo the user has access to sets the product's repo columns
  try {
    repoAdapterModule.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });
    const { handlePostConnectRepo } = freshRequire(PRODUCT_REPO_ROUTE_PATH);
    const pool = makeMockPool({ productId: 'prod-1', tenantId: 'tx' });
    const ph = mockPosthog();
    const req = { session: { tenantId: 'tx', accessToken: 'gh-token', login: 'alice' }, params: { id: 'prod-1' }, body: { owner: 'acme', repo: 'widgets' } };
    const res = mockRes();
    await handlePostConnectRepo(req, res, null, pool, ph);
    assert(pool._queries.some(q => /UPDATE products SET repo_provider = \$1, repo_owner = \$2, repo_name = \$3 WHERE product_id = \$4/i.test(q.sql) && q.params[0] === 'github' && q.params[1] === 'acme' && q.params[2] === 'widgets' && q.params[3] === 'prod-1'), 'UPDATE did not set repo_provider/repo_owner/repo_name correctly');
    pass('AC1: connecting a repo the user has access to sets repo_provider/repo_owner/repo_name');
  } catch (e) { fail('AC1: connecting a repo the user has access to sets repo_provider/repo_owner/repo_name', e); }

  // T3 (AC1, confirmation) — response indicates success, not a bare empty 200
  try {
    repoAdapterModule.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });
    const { handlePostConnectRepo } = freshRequire(PRODUCT_REPO_ROUTE_PATH);
    const pool = makeMockPool({ productId: 'prod-1', tenantId: 'tx' });
    const req = { session: { tenantId: 'tx', accessToken: 'gh-token', login: 'alice' }, params: { id: 'prod-1' }, body: { owner: 'acme', repo: 'widgets' } };
    const res = mockRes();
    await handlePostConnectRepo(req, res, null, pool, mockPosthog());
    assert.strictEqual(res._s, 200, `Expected 200, got ${res._s}`);
    assert(res._b && res._b.connected === true, 'Response body does not confirm success (connected:true)');
    pass('AC1: confirmation response indicates success (connected:true), not a bare empty 200');
  } catch (e) { fail('AC1: confirmation response indicates success (connected:true), not a bare empty 200', e); }

  // T4 (AC2) — connecting a repo without access is rejected, zero writes
  try {
    repoAdapterModule.setRepoAdapter(async function() { return { hasAccess: false, status: 404 }; });
    const { handlePostConnectRepo } = freshRequire(PRODUCT_REPO_ROUTE_PATH);
    const pool = makeMockPool({ productId: 'prod-2', tenantId: 'tx' });
    const req = { session: { tenantId: 'tx', accessToken: 'gh-token', login: 'alice' }, params: { id: 'prod-2' }, body: { owner: 'acme', repo: 'private-thing' } };
    const res = mockRes();
    await handlePostConnectRepo(req, res, null, pool, mockPosthog());
    assert(res._s >= 400 && res._s < 500, `Expected a 4xx rejection, got ${res._s}`);
    assert(res._b && res._b.error, 'Response body does not contain a clear error message');
    assert(!pool._queries.some(q => /UPDATE products SET repo_provider/i.test(q.sql)), 'UPDATE was called despite no access');
    pass('AC2: repo without access is rejected (4xx, clear error), zero columns written');
  } catch (e) { fail('AC2: repo without access is rejected (4xx, clear error), zero columns written', e); }

  // T5 (AC3) — non-GitHub-authenticated session is redirected to account-linking, zero writes
  try {
    const { handlePostConnectRepo } = freshRequire(PRODUCT_REPO_ROUTE_PATH);
    const pool = makeMockPool({ productId: 'prod-3', tenantId: 'tx' });
    const req = { session: { tenantId: 'tx', login: 'jane@example.com' }, params: { id: 'prod-3' }, body: { owner: 'acme', repo: 'widgets' } };
    const res = mockRes();
    await handlePostConnectRepo(req, res, null, pool, mockPosthog());
    assert(res._b && res._b.linkUrl === '/settings/link-account/github/start', 'Response does not direct to the real account-linking start route');
    assert(res._b.error || res._b.message, 'Response does not include a clear message');
    assert(!pool._queries.some(q => /UPDATE products SET repo_provider/i.test(q.sql)), 'UPDATE was called despite no GitHub token in session');
    pass('AC3: no GitHub token in session -> directed to /settings/link-account/github/start, zero writes');
  } catch (e) { fail('AC3: no GitHub token in session -> directed to /settings/link-account/github/start, zero writes', e); }

  // T6 (AC4) — re-connecting to a different repo updates, not duplicates, the association
  try {
    repoAdapterModule.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });
    const { handlePostConnectRepo } = freshRequire(PRODUCT_REPO_ROUTE_PATH);
    const pool = makeMockPool({ productId: 'prod-4', tenantId: 'tx', existingOwner: 'acme', existingName: 'widgets' });
    const req = { session: { tenantId: 'tx', accessToken: 'gh-token', login: 'alice' }, params: { id: 'prod-4' }, body: { owner: 'acme', repo: 'widgets-v2' } };
    const res = mockRes();
    await handlePostConnectRepo(req, res, null, pool, mockPosthog());
    const updateCalls = pool._queries.filter(q => /UPDATE products SET repo_provider/i.test(q.sql));
    assert.strictEqual(updateCalls.length, 1, `Expected exactly 1 UPDATE call, got ${updateCalls.length}`);
    assert.strictEqual(updateCalls[0].params[2], 'widgets-v2', 'UPDATE did not reflect the new repo name');
    assert.strictEqual(res._s, 200, `Expected 200 for a successful re-link, got ${res._s}`);
    pass('AC4: re-connecting to a different repo issues a single UPDATE reflecting the new values, not an "already connected" error');
  } catch (e) { fail('AC4: re-connecting to a different repo issues a single UPDATE reflecting the new values, not an "already connected" error', e); }

  // T7 (NFR Performance) — no async job/queue enqueued; response sent within the same handler invocation
  try {
    repoAdapterModule.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });
    const { handlePostConnectRepo } = freshRequire(PRODUCT_REPO_ROUTE_PATH);
    const pool = makeMockPool({ productId: 'prod-5', tenantId: 'tx' });
    const req = { session: { tenantId: 'tx', accessToken: 'gh-token', login: 'alice' }, params: { id: 'prod-5' }, body: { owner: 'acme', repo: 'widgets' } };
    const res = mockRes();
    await handlePostConnectRepo(req, res, null, pool, mockPosthog());
    assert(res._s !== null, 'Response was not sent synchronously within the handler invocation (no async job pattern expected)');
    pass('NFR (Performance): repo-access verification + response completes within the same request handler invocation, no async job');
  } catch (e) { fail('NFR (Performance): repo-access verification + response completes within the same request handler invocation, no async job', e); }

  // T8 (NFR Security) — the OAuth token itself is never written to the products table
  try {
    repoAdapterModule.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });
    const { handlePostConnectRepo } = freshRequire(PRODUCT_REPO_ROUTE_PATH);
    const fakeToken = 'super-secret-fake-token-should-never-be-persisted';
    const pool = makeMockPool({ productId: 'prod-6', tenantId: 'tx' });
    const req = { session: { tenantId: 'tx', accessToken: fakeToken, login: 'alice' }, params: { id: 'prod-6' }, body: { owner: 'acme', repo: 'widgets' } };
    const res = mockRes();
    await handlePostConnectRepo(req, res, null, pool, mockPosthog());
    const allParams = pool._queries.reduce((acc, q) => acc.concat(q.params || []), []);
    assert(allParams.every(p => p !== fakeToken), 'The OAuth access token was passed as a SQL param — it must never be persisted against the product');
    pass('NFR (Security): the OAuth token itself is never written to the products table across all UPDATE/SELECT params');
  } catch (e) { fail('NFR (Security): the OAuth token itself is never written to the products table across all UPDATE/SELECT params', e); }

  // T9 (AC5, second half) — server.js wires setRepoAdapter to the real
  // implementation; the wired real function then resolves two different
  // sessions to two different, individually-correct access results.
  try {
    // Static half: server.js's production wiring call site must reference
    // the real implementation, not a mock or the throwing stub itself.
    const src = fs.readFileSync(SERVER_PATH, 'utf8');
    const setIdx = src.indexOf('setRepoAdapter(realCheckRepoAccess)');
    assert(setIdx !== -1, 'server.js must call setRepoAdapter(realCheckRepoAccess) to wire the real implementation');
    const importIdx = src.indexOf("require('./adapters/repo-adapter')");
    assert(importIdx !== -1 && importIdx < setIdx, 'server.js must import realCheckRepoAccess from ./adapters/repo-adapter before wiring it');

    // Behavioural half: wire the ACTUAL production function (not a mock),
    // and prove two different sessions -- distinguished only by their own
    // accessToken, exactly as the route handler passes it -- resolve
    // independently and correctly through it.
    const repoAdapter = freshRequire(REPO_ADAPTER_PATH);
    repoAdapter.setRepoAdapter(repoAdapter.realCheckRepoAccess);

    const origFetch = global.fetch;
    global.fetch = async function(url, opts) {
      const auth = opts && opts.headers && opts.headers['Authorization'];
      if (auth === 'token session-a-token') return { status: 200 }; // Session A has access
      if (auth === 'token session-b-token') return { status: 404 }; // Session B does not
      throw new Error('Unexpected token in wiring test: ' + auth);
    };
    let resultA, resultB;
    try {
      resultA = await repoAdapter.getRepoAdapter()('acme', 'widgets', 'session-a-token');
      resultB = await repoAdapter.getRepoAdapter()('other-org', 'private-repo', 'session-b-token');
    } finally {
      global.fetch = origFetch;
    }

    assert.strictEqual(resultA.hasAccess, true, 'Session A (real access) should resolve hasAccess:true through the wired real adapter');
    assert.strictEqual(resultB.hasAccess, false, 'Session B (no access) should resolve hasAccess:false through the SAME wired real adapter');
    pass('AC5: server.js wires the real repo adapter, and two different sessions resolve to two different, individually-correct access results through it (not just proof the setter was called)');
  } catch (e) { fail('AC5: server.js wires the real repo adapter, and two different sessions resolve to two different, individually-correct access results through it (not just proof the setter was called)', e); }

  console.log(`\n[prc-s1.2] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
