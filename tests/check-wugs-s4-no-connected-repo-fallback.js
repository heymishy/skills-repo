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
      if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(s)) { return { rows: [] }; }
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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
