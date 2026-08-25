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

  console.log('\n[fresc-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
