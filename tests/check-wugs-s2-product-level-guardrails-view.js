'use strict';
// check-wugs-s2-product-level-guardrails-view.js — wugs-s2
//
// Unit/integration tests for the product-level guardrails/standards view:
// live-reads .github/architecture-guardrails.md and standards/ from the
// product's connected repo via wugs-s1's fetchRepoPath (ADR-012 reuse).

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
    session: { accessToken: 'tok', tenantId: 't1', login: 'alice' }
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

// Mock pool covering the product-lookup query (with repo_owner/repo_name)
// and getProductsNavSummary's real query shapes (products.js:1336-1360,
// matching check-rapp-s2's own makeMockPool convention).
function makeMockPool(navProducts) {
  return {
    query: async function (sql) {
      var s = String(sql);
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        return { rows: [{ name: 'Test Product', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }] };
      }
      if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(s)) {
        return { rows: (navProducts || []).map(function (p) { return { product_id: p.id, name: p.name, created_at: new Date().toISOString() }; }) };
      }
      if (/SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id/i.test(s)) {
        return { rows: [] };
      }
      if (/SELECT journey_id FROM journeys WHERE tenant_id.*product_id IS NULL/i.test(s)) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

// wugs-s1's fetchRepoPath is injectable (D37) — save/restore around each
// test so mocks never leak between tests (same convention as wugs-s1's own
// withMockedFetch helper).
async function withMockedFetchRepoPath(mockFn, testFn) {
  var original = artefactFetcher.getFetchRepoPath();
  artefactFetcher.setFetchRepoPath(mockFn);
  try {
    await testFn();
  } finally {
    artefactFetcher.setFetchRepoPath(original);
  }
}

(async () => {

// ── AC1: renders real guardrails.md content ─────────────────────────────
await checkAsync('AC1: handleGetGuardrailsView_productHasGuardrailsFile_rendersRealContent', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { return 'REAL GUARDRAILS CONTENT XYZ'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
    assert.ok(result.body.indexOf('REAL GUARDRAILS CONTENT XYZ') !== -1, 'expected real guardrails content in response');
  });
});

// ── AC1: empty state when guardrails.md is missing ──────────────────────
await checkAsync('AC1: handleGetGuardrailsView_productHasNoGuardrailsFile_rendersEmptyState', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
    assert.ok(result.body.indexOf('No architecture-guardrails.md found in this repo.') !== -1, 'expected empty-state message in response');
  });
});

// ── AC1: error state when the guardrails fetch fails ─────────────────────
await checkAsync('AC1: handleGetGuardrailsView_fetchFails_rendersErrorState', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new Error('rate limit exceeded');
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
    assert.ok(result.body.indexOf('Could not load architecture-guardrails.md:') !== -1, 'expected error-state message in response');
    assert.ok(result.body.indexOf('rate limit exceeded') !== -1, 'expected underlying error message in response');
  });
});

// ── AC2: lists real standards/ folder entries ────────────────────────────
await checkAsync('AC2: handleGetGuardrailsView_productHasStandardsFolder_listsEntries', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path); }
    if (path === 'standards/') { return [{ name: 'saas-gui', path: 'standards/saas-gui', type: 'dir' }, { name: 'backend-api', path: 'standards/backend-api', type: 'dir' }]; }
    throw new Error('unexpected path: ' + path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('saas-gui') !== -1, 'expected the real "saas-gui" entry name in the response');
    assert.ok(result.body.indexOf('backend-api') !== -1, 'expected the real "backend-api" entry name in the response');
  });
});

// ── AC2: empty state when standards/ is missing ─────────────────────────
await checkAsync('AC2: handleGetGuardrailsView_productHasNoStandardsFolder_rendersEmptyState', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
    assert.ok(result.body.indexOf('No standards found in this repo.') !== -1, 'expected empty-state message in response');
  });
});

// ── AC2: error state when the standards fetch fails ──────────────────────
await checkAsync('AC2: handleGetGuardrailsView_standardsFetchFails_rendersErrorState', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path); }
    if (path === 'standards/') { throw new Error('rate limit exceeded'); }
    throw new Error('unexpected path: ' + path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
    assert.ok(result.body.indexOf('Could not load standards/:') !== -1, 'expected error-state message in response');
    assert.ok(result.body.indexOf('rate limit exceeded') !== -1, 'expected underlying error message in response');
  });
});

// ── AC3: empty-repo state, not fabricated ────────────────────────────────
await checkAsync('AC3: handleGetGuardrailsView_emptyRepo_showsExplicitEmptyState', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('No architecture-guardrails.md found in this repo.') !== -1, 'expected explicit "none found" text for the missing guardrails file');
    assert.ok(result.body.indexOf('No standards found in this repo.') !== -1, 'expected explicit "none found" text for the missing standards folder');
    // NFR-A11Y (MC-A11Y-02): the empty state must be conveyed via a real text
    // sentence, not only a CSS class name — assert the sentence matches as a
    // regex against the response body, not just an indexOf on a fixed string,
    // so this would catch a regression that replaced the text with markup-only styling.
    assert.ok(/No architecture-guardrails\.md found in this repo\./.test(result.body), 'expected the empty-state text to be a real matchable sentence, not just a CSS class');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
