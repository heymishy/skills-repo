'use strict';
// check-wugs-s8-request-promotion.js — wugs-s8
//
// Unit/integration tests for requesting a product-level guardrail/standard
// be promoted to org level: creates a guardrail_promotion_requests row
// (idempotent against duplicate pending requests), tenant-scoped.

var assert = require('assert');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try { fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

async function checkAsync(name, fn) {
  try { await fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

var products = require('../src/web-ui/routes/products');
var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');

function mockReq(overrides) {
  return Object.assign({
    params: { id: 'p1' },
    session: { accessToken: 'tok', tenantId: 't1', login: 'alice', csrfToken: 'ct1' }
  }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    status: function (c) { _statusCode = c; return this; },
    json: function (b) { _body = JSON.stringify(b); },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

// Mock pool: product lookup, guardrail_promotion_requests rows/inserts.
// `state.pendingRow` simulates an existing pending row for the tested path
// (null = none). `calls` records every query for assertion.
function makeMockPool(state, calls) {
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (calls) calls.push({ sql: s, params: params });
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        var pid = params && params[0];
        var row = pid === 'p-tenant-b'
          ? { name: 'Tenant B Product', tenant_id: 't2', repo_owner: 'bravo', repo_name: 'stuff' }
          : { name: 'Test Product', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' };
        return { rows: [row] };
      }
      if (/SELECT .* FROM guardrail_promotion_requests WHERE tenant_id.*product_id.*file_path.*status/i.test(s)) {
        return { rows: state.pendingRow ? [state.pendingRow] : [] };
      }
      if (/INSERT INTO guardrail_promotion_requests/i.test(s)) {
        return { rows: [{ request_id: 'req-1', status: 'pending' }] };
      }
      return { rows: [] };
    }
  };
}

async function withMockedFetchRepoPath(mockFn, testFn) {
  var original = artefactFetcher.getFetchRepoPath();
  artefactFetcher.setFetchRepoPath(mockFn);
  try { await testFn(); } finally { artefactFetcher.setFetchRepoPath(original); }
}

(async () => {

// ── AC1: request creates a row with a content snapshot ──────────────────
await checkAsync('AC1: requestPromotion_newRequest_createsRowWithSnapshot', async () => {
  var calls = [];
  var pool = makeMockPool({ pendingRow: null }, calls);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === 'standards/saas-gui.md') { return 'REAL CURRENT CONTENT'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq({ body: { path: 'standards/saas-gui.md', _csrf: 'ct1' } });
    var res = mockRes();
    await products.handlePostRequestPromotion(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode + ' body: ' + result.body);
    var insertCall = calls.find(function (c) { return /INSERT INTO guardrail_promotion_requests/i.test(c.sql); });
    assert.ok(insertCall, 'expected an INSERT INTO guardrail_promotion_requests');
    assert.strictEqual(insertCall.params[0], 't1', 'expected the real tenant_id');
    assert.strictEqual(insertCall.params[1], 'p1', 'expected the real product_id');
    assert.strictEqual(insertCall.params[2], 'standards/saas-gui.md', 'expected the real file_path');
    assert.strictEqual(insertCall.params[3], 'REAL CURRENT CONTENT', 'expected the real, server-fetched current content as the snapshot -- not client-submitted content');
    assert.strictEqual(insertCall.params[4], 'pending', 'expected status pending');
  });
});

// ── review fix: fetchRepoPath throws ArtefactNotFoundError -> 404, no INSERT ──
await checkAsync('reviewFix: requestPromotion_fileDeletedSincePageLoad_returns404NoInsert', async () => {
  var calls = [];
  var pool = makeMockPool({ pendingRow: null }, calls);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq({ body: { path: 'standards/saas-gui.md', _csrf: 'ct1' } });
    var res = mockRes();
    await products.handlePostRequestPromotion(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 404, 'expected 404, got: ' + result.statusCode + ' body: ' + result.body);
    var insertCall = calls.find(function (c) { return /INSERT INTO guardrail_promotion_requests/i.test(c.sql); });
    assert.ok(!insertCall, 'expected no INSERT INTO guardrail_promotion_requests when the fetch fails');
  });
});

// ── review fix: path outside the allowlist -> 400, no INSERT ────────────
await checkAsync('reviewFix: requestPromotion_pathOutsideAllowlist_returns400NoInsert', async () => {
  var calls = [];
  var pool = makeMockPool({ pendingRow: null }, calls);
  await withMockedFetchRepoPath(async function () {
    return 'should never be reached';
  }, async function () {
    var req = mockReq({ body: { path: '.github/workflows/ci.yml', _csrf: 'ct1' } });
    var res = mockRes();
    await products.handlePostRequestPromotion(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 400, 'expected 400, got: ' + result.statusCode + ' body: ' + result.body);
    var insertCall = calls.find(function (c) { return /INSERT INTO guardrail_promotion_requests/i.test(c.sql); });
    assert.ok(!insertCall, 'expected no INSERT INTO guardrail_promotion_requests for a disallowed path');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
