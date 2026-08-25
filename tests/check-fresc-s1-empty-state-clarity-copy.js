'use strict';

// tests/check-fresc-s1-empty-state-clarity-copy.js — AC1-AC4 tests for fresc-s1
// Story: artefacts/2026-08-25-first-run-empty-state-copy/stories/fresc-s1-product-and-modules-clarity-copy.md

var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function assertTrue(condition, label) {
  if (!condition) { throw new Error(label); }
}

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var MODULES_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/modules-adapter.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

var TEST_CSRF = 'test-csrf-token';

function makeFakeModulesPool() {
  return { query: async function() { return { rows: [] }; } };
}

function makePool(journeyRows) {
  return {
    query: async function(sql) {
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/.test(sql)) {
        return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: null, repo_name: null }] };
      }
      if (/FROM product_rollups/.test(sql)) { return { rows: [] }; }
      if (/FROM journeys/.test(sql)) { return { rows: journeyRows }; }
      return { rows: [] };
    }
  };
}

function makeRes() {
  var html = null;
  return { html: function() { return html; }, writeHead: function() {}, end: function(b) { html = b; } };
}

(async function() {
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  var modulesAdapter = require(MODULES_ADAPTER_PATH);

  // ===========================================================================
  // AC1 — Modules card hidden at 0 or 1 features
  // ===========================================================================

  await test('modulesCardHiddenWithZeroFeatures (AC1)', function() {
    var html = productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, [{ id: 'mod-1', name: 'Billing' }], TEST_CSRF);
    assertTrue(html.indexOf('a1-create-form') === -1, 'expected no create-module form with 0 features');
    assertTrue(html.indexOf('a1-rename-form') === -1, 'expected no rename form with 0 features');
    assertTrue(html.indexOf('a1-delete-btn') === -1, 'expected no delete control with 0 features');
  });

  await test('modulesCardHiddenWithExactlyOneFeature (AC1, boundary)', function() {
    var oneFeature = [{ journey_id: 'j1' }];
    var html = productsRoute._renderProductView('Acme', 'p1', oneFeature, 'x', null, false, null, null, [{ id: 'mod-1', name: 'Billing' }], TEST_CSRF);
    assertTrue(html.indexOf('a1-create-form') === -1, 'expected Modules card still hidden at exactly 1 feature');
  });

  // ===========================================================================
  // AC2 — Modules card + explanatory line shown at >1 features
  // ===========================================================================

  await test('modulesCardVisibleWithTwoFeatures (AC2)', function() {
    var twoFeatures = [{ journey_id: 'j1' }, { journey_id: 'j2' }];
    var html = productsRoute._renderProductView('Acme', 'p1', twoFeatures, 'x', null, false, null, null, [], TEST_CSRF);
    assertTrue(html.indexOf('a1-create-form') !== -1, 'expected the create-module form to be present with 2 features');
    assertTrue(html.indexOf('a1-modules-hint') !== -1, 'expected the explanatory hint element to be present');
  });

  await test('moduleCrudMarkupUnchangedWhenCardVisible (AC2, AC4 non-regression)', function() {
    var twoFeatures = [{ journey_id: 'j1' }, { journey_id: 'j2' }];
    var modules = [{ id: 'mod-1', name: 'Billing' }];
    var html = productsRoute._renderProductView('Acme', 'p1', twoFeatures, 'x', null, false, null, null, modules, TEST_CSRF);
    assertTrue(html.indexOf('data-module-id="mod-1"') !== -1, 'expected the existing module\'s rename/delete controls to be present');
    assertTrue(html.indexOf('class="a1-rename-form"') !== -1, 'expected a rename form');
    assertTrue(html.indexOf('class="a1-delete-btn"') !== -1, 'expected a delete control');
    assertTrue(html.indexOf('name="_csrf" value="' + TEST_CSRF + '"') !== -1, 'expected CSRF fields to remain wired to the real token');
  });

  // ===========================================================================
  // AC3 — Product empty-state explanatory line, list view and board view
  // ===========================================================================

  await test('productEmptyStateIncludesExplanatoryLine (AC3)', function() {
    var html = productsRoute._renderProductDashboard([], 'login', [], null, 0, false);
    assertTrue(html.indexOf('No products yet') !== -1, 'expected existing "No products yet" text to remain');
    assertTrue(html.toLowerCase().indexOf('create your first product') !== -1, 'expected existing CTA link text to remain');
    assertTrue(html.indexOf('sw-products-empty-hint') !== -1, 'expected the explanatory hint element to be present');
  });

  await test('productListNonEmptyStateUnaffected (AC3, non-regression)', function() {
    var oneProduct = [{ product_id: 'p1', name: 'Acme', featureCount: 3, lastUpdated: null }];
    var html = productsRoute._renderProductDashboard(oneProduct, 'login', [], null, 0, false);
    assertTrue(html.indexOf('No products yet') === -1, 'expected empty-state text absent when a product exists');
    assertTrue(html.indexOf('sw-products-empty-hint') === -1, 'expected the hint element absent when a product exists');
  });

  // ===========================================================================
  // Integration — handleGetProductView reflects the gate end to end
  // ===========================================================================

  await test('handleGetProductViewReflectsVisibilityGateEndToEnd (AC1)', async function() {
    modulesAdapter.setModulesAdapter(makeFakeModulesPool());

    var reqZero = { params: { id: 'p1' }, session: { tenantId: 't1' } };
    var resZero = makeRes();
    await productsRoute.handleGetProductView(reqZero, resZero, null, makePool([]));
    assertTrue(resZero.html().indexOf('a1-create-form') === -1, 'expected Modules card absent with 0 journeys/features');

    var reqTwo = { params: { id: 'p1' }, session: { tenantId: 't1' } };
    var resTwo = makeRes();
    await productsRoute.handleGetProductView(reqTwo, resTwo, null, makePool([
      { journey_id: 'j1', feature_slug: 'feat-a', stage: 'discovery', display_name: null },
      { journey_id: 'j2', feature_slug: 'feat-b', stage: 'discovery', display_name: null }
    ]));
    assertTrue(resTwo.html().indexOf('a1-create-form') !== -1, 'expected Modules card present with 2 journeys/features');
  });

  await test('boardViewEmptyStateAlsoIncludesExplanatoryLine (AC3, shared-function regression check)', async function() {
    var pool = {
      query: async function(sql) {
        if (sql.includes('FROM products')) { return { rows: [] }; }
        if (sql.includes('product_id IS NULL')) { return { rows: [] }; }
        return { rows: [] };
      }
    };
    var req = { session: { tenantId: 'tenant-empty' }, query: { view: 'board' } };
    var res = makeRes();
    await productsRoute.handleGetDashboard(req, res, null, pool);
    assertTrue(res.html().indexOf('sw-products-empty-hint') !== -1, 'expected the same explanatory hint to appear on the board-view empty state');
  });

  console.log('\n[fresc-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
