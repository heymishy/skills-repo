'use strict';
// check-wugs-s4-no-connected-repo-fallback.js — wugs-s4
//
// Unit/integration tests for the "no connected repo" fallback: the
// product-level section shows a distinct connect-a-repo prompt (not
// wugs-s2's "none found in this repo" empty state) while the org-level
// section (wugs-s3) still renders normally.

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
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

// Mock pool: product lookup (repo_owner/repo_name nullable), nav summary,
// tenant_org_repo, guardrail_pending_prs — matches check-wugs-s3/s7's own
// makeMockPool convention. `hasRepo` controls whether the product row has a
// connected repo; pass a mutable `state` object to change it between calls
// (AC4's not-sticky test).
function makeMockPool(state) {
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        var row = state.hasRepo
          ? { name: 'Test Product', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }
          : { name: 'Test Product', tenant_id: 't1', repo_owner: null, repo_name: null };
        return { rows: [row] };
      }
      if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(s)) {
        return { rows: (state.navProducts || []).map(function (p) { return { product_id: p.id, name: p.name, created_at: new Date().toISOString() }; }) };
      }
      if (/SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT journey_id FROM journeys WHERE tenant_id.*product_id IS NULL/i.test(s)) { return { rows: [] }; }
      if (/SELECT .* FROM tenant_org_repo WHERE tenant_id/i.test(s)) {
        return { rows: state.orgRepoRow ? [state.orgRepoRow] : [] };
      }
      if (/SELECT .* FROM guardrail_pending_prs WHERE tenant_id/i.test(s)) { return { rows: [] }; }
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

// ── AC1: distinct "connect a repo" prompt, not wugs-s2's empty state ────
await checkAsync('AC1: handleGetGuardrailsView_noConnectedRepo_showsDistinctConnectPrompt', async () => {
  var pool = makeMockPool({ hasRepo: false });
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(/connect a repo/i.test(result.body), 'expected a "connect a repo" prompt');
    assert.ok(result.body.indexOf('No architecture-guardrails.md found in this repo.') === -1, 'expected the distinct no-repo prompt, NOT wugs-s2\'s "none found in this repo" empty-state copy');
  });
});

// ── nav coverage: sidebar still renders fully around the fallback branch ─
// Modeled on check-wugs-s2-product-level-guardrails-view.js's own AC5
// (handleGetGuardrailsView_nav_rendersFullSidebarAndActiveProduct): the
// current product (p1) must itself be a member of the tenant's nav product
// list for its /products/p1 link to render -- the sidebar only ever renders
// entries present in navSummary.products (html-shell.js's
// renderProductsSection), it does not synthesize a row for the page's own
// product. p2 stays in the fixture too so this test still exercises "full
// sidebar" (more than just the active product). Scoped to wugs-s4: hasRepo
// is false here, so the fallback "connect a repo" prompt renders in place
// of the product-level section -- the nav sidebar must still render fully
// around it, not just the fallback prompt in isolation.
await checkAsync('AC1-nav: handleGetGuardrailsView_noConnectedRepo_navStillRendersFullSidebarAndActiveProduct', async () => {
  var pool = makeMockPool({
    hasRepo: false,
    navProducts: [{ id: 'p1', name: 'Current Product' }, { id: 'p2', name: 'Nav Product One' }]
  });
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq({ params: { id: 'p1' } });
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('Nav Product One') !== -1, 'expected the products-nav sidebar to be populated even with no connected repo');
    assert.ok(result.body.indexOf('/products/p1') !== -1, 'expected the current product to appear as a real nav link (activeProductId wired) even with no connected repo');
    assert.ok(/connect a repo/i.test(result.body), 'expected the no-connected-repo fallback prompt to still render alongside the nav sidebar');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
