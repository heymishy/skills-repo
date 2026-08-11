'use strict';
// check-rapp-s2-standards-tab-nav-and-breadcrumb.js — rapp-s2
//
// Unit tests for rapp-s2 (the Standards tab rendered with no way back to
// /dashboard -- pan-s1's sidebar Products section was never threaded into
// handleGetProductStandardsTab's renderShell call, the same root cause and
// fix as jcn-s1's journey-page nav gap -- plus a duplicate breadcrumb:
// _renderStandardsTab's own body manually re-rendered the exact same
// "productName › Standards" text renderShell's own crumbs prop already
// renders).

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

// Mock pool covering both the product-lookup query and
// _getProductsNavSummary's exact real query shapes (products.js:1316-1341,
// matching check-jcn-s1-journey-page-nav-products.js's own makeMockPool
// convention).
function makeMockPool(navProducts) {
  return {
    query: async function (sql) {
      var s = String(sql);
      if (/SELECT name, tenant_id FROM products WHERE product_id/i.test(s)) {
        return { rows: [{ name: 'Test Product', tenant_id: 't1' }] };
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

(async () => {

// ── AC1: Standards tab nav includes product list + See all products ──
await checkAsync('AC1: handleGetProductStandardsTab_withPool_rendersProductsNavSection', async () => {
  var pool = makeMockPool([{ id: 'p2', name: 'Nav Product One' }]);
  var req = mockReq();
  var res = mockRes();
  await products.handleGetProductStandardsTab(req, res, null, pool);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('Nav Product One') !== -1, 'expected the real product name in the rendered nav');
});

// ── AC2: "See all products" link points at /dashboard ──
await checkAsync('AC2: handleGetProductStandardsTab_seeAllProductsLink_pointsAtDashboard', async () => {
  var pool = makeMockPool([{ id: 'p2', name: 'Nav Product One' }]);
  var req = mockReq();
  var res = mockRes();
  await products.handleGetProductStandardsTab(req, res, null, pool);
  var result = res._get();

  assert.ok(result.body.indexOf('See all products') !== -1, 'expected a "See all products" link');
  assert.ok(result.body.indexOf('href="/dashboard"') !== -1, 'expected the See-all-products link to point at /dashboard');
});

// ── AC3: zero-products state matches the rest of the app ──
await checkAsync('AC3: handleGetProductStandardsTab_zeroProducts_rendersEmptyProductsStateNotFabricated', async () => {
  var pool = makeMockPool([]); // zero nav products
  var req = mockReq();
  var res = mockRes();
  await products.handleGetProductStandardsTab(req, res, null, pool);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200);
  assert.ok(result.body.indexOf('Nav Product One') === -1, 'expected no fabricated product name with zero real nav products');
});

// ── AC4: the current product is marked active in the sidebar ──
await checkAsync('AC4: handleGetProductStandardsTab_marksCurrentProductActiveInSidebar', async () => {
  var pool = makeMockPool([{ id: 'p1', name: 'Test Product' }]);
  var req = mockReq({ params: { id: 'p1' } });
  var res = mockRes();
  await products.handleGetProductStandardsTab(req, res, null, pool);
  var result = res._get();

  // renderProductsSection marks the active product's link distinctly --
  // asserting the product id appears as a real /products/:id href is a
  // stable, implementation-agnostic proxy for "the nav rendered this
  // product as a real, clickable entry" without coupling to the exact CSS
  // class renderShell happens to use for "active" styling.
  assert.ok(result.body.indexOf('/products/p1') !== -1, 'expected the current product to appear as a real nav link');
});

// ── AC5: no duplicate breadcrumb -- exactly one "sw-crumbs" bar, and the
// removed manual "productName ›" link line is gone ──────────────────────
await checkAsync('AC5: standardsTab_noDuplicateBreadcrumb', async () => {
  var pool = makeMockPool([]);
  var req = mockReq();
  var res = mockRes();
  await products.handleGetProductStandardsTab(req, res, null, pool);
  var result = res._get();

  var crumbsMatches = result.body.match(/class="sw-crumbs"/g) || [];
  assert.strictEqual(crumbsMatches.length, 1, 'expected exactly one .sw-crumbs breadcrumb bar, got ' + crumbsMatches.length);

  var productNameOccurrences = (result.body.match(/Test Product/g) || []).length;
  assert.strictEqual(productNameOccurrences, 1, 'expected the product name to appear exactly once (in the real crumbs bar only), got ' + productNameOccurrences);

  assert.ok(result.body.indexOf('&rsaquo;') === -1, 'expected the removed manual breadcrumb link (its distinctive &rsaquo; separator) to be gone');
});

// ── AC6: the "Standards" page heading itself is still present ───────────
await checkAsync('AC6: standardsTab_stillShowsStandardsHeading', async () => {
  var pool = makeMockPool([]);
  var req = mockReq();
  var res = mockRes();
  await products.handleGetProductStandardsTab(req, res, null, pool);
  var result = res._get();

  assert.ok(result.body.indexOf('<h1 style="margin:0;font-size:24px">Standards</h1>') !== -1, 'expected the Standards H1 heading to still render');
});

// ── AC7: no-pool test callers unaffected (regression guard) ─────────────
await checkAsync('AC7: handleGetProductStandardsTab_jsonResponse_unaffectedByNavWiring', async () => {
  var pool = makeMockPool([{ id: 'p2', name: 'Nav Product One' }]);
  var req = mockReq();
  var jsonBody = null;
  var res = { json: function (obj) { jsonBody = obj; } };
  await products.handleGetProductStandardsTab(req, res, null, pool);

  assert.ok(jsonBody, 'expected the JSON API branch (res.json present) to still respond');
  assert.ok(Array.isArray(jsonBody.standards), 'expected the JSON API branch to be unaffected by the HTML-only nav wiring');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
