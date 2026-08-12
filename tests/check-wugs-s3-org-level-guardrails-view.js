'use strict';
// check-wugs-s3-org-level-guardrails-view.js — wugs-s3
//
// Unit/integration tests for the org-level guardrails/standards section:
// first-time designation + seeding (reusing wugs-s6's createGuardrailPr),
// and live-read org-level content (reusing wugs-s1's fetchRepoPath), with
// hard cross-tenant isolation.

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

// Mock pool covering the product-lookup query, getProductsNavSummary's own
// queries, and tenant_org_repo lookups/inserts (matching check-wugs-s2's own
// makeMockPool convention). orgRepoRow is null (no designation) or a real row.
function makeMockPool(navProducts, orgRepoRowsByTenant, calls) {
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (calls) calls.push({ sql: s, params: params });
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        var pid = params && params[0];
        var row = { name: 'Test Product', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' };
        if (pid === 'p-tenant-b') { row = { name: 'Tenant B Product', tenant_id: 't2', repo_owner: 'bravo', repo_name: 'stuff' }; }
        return { rows: [row] };
      }
      if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(s)) {
        return { rows: (navProducts || []).map(function (p) { return { product_id: p.id, name: p.name, created_at: new Date().toISOString() }; }) };
      }
      if (/SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT journey_id FROM journeys WHERE tenant_id.*product_id IS NULL/i.test(s)) { return { rows: [] }; }
      if (/SELECT .* FROM tenant_org_repo WHERE tenant_id/i.test(s)) {
        var tid = params && params[0];
        var orgRow = (orgRepoRowsByTenant || {})[tid] || null;
        return { rows: orgRow ? [orgRow] : [] };
      }
      if (/INSERT INTO tenant_org_repo/i.test(s)) { return { rows: [] }; }
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

// ── AC3: no org repo designated — explicit prompt state ──────────────────
await checkAsync('AC3: handleGetGuardrailsView_noOrgRepoDesignated_showsExplicitPrompt', async () => {
  var pool = makeMockPool([], {});
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(/no org repo designated/i.test(result.body), 'expected an explicit "no org repo designated" prompt, not a silently empty section');
    assert.ok(result.body.indexOf('/settings/org-repo') !== -1, 'expected a real designation entry point (link/form action) in the prompt');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
