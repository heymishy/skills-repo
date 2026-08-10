'use strict';

// tests/check-bmau-s1-bulk-assign-checkbox-ui.js — bmau-s1
//
// Unit + integration tests for bmau-s1 (Bulk-assign-to-module has a
// working, tested backend but no UI trigger anywhere). Covers AC1, AC2,
// AC4, AC5 from
// artefacts/2026-08-10-bulk-module-assignment-ui-gap/test-plans/bmau-s1-test-plan.md.
// AC3 (visual re-render after a successful assign) is CSS/DOM-dependent and
// covered separately by tests/e2e/bmau-s1-bulk-assign-rerender.spec.js.
//
// Follows this repo's own hand-rolled test()/assert style -- no Jest/Mocha.

var assert = require('assert');
var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var MODULES_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/modules-adapter.js');

var TEST_CSRF = 'test-csrf-token';

function makeFakeModulesPool(opts) {
  opts = opts || {};
  var moduleRows = opts.moduleRows || [];
  var assignmentRows = opts.assignmentRows || [];
  var pool = {
    _assignmentRows: assignmentRows,
    query: async function(sql, params) {
      var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      var p = params || [];
      if (s.indexOf('INSERT INTO FEATURE_MODULE_ASSIGNMENTS') === 0) {
        var productId = p[0], tenantId = p[1], moduleId = p[2], slugs = p[3];
        var moduleExists = moduleRows.some(function(m) { return m.id === moduleId && m.product_id === productId && m.tenant_id === tenantId; });
        if (!moduleExists) { return { rows: [] }; }
        var returned = [];
        slugs.forEach(function(slug) {
          var existing = assignmentRows.find(function(r) { return r.product_id === productId && r.feature_slug === slug; });
          if (existing) { existing.module_id = moduleId; }
          else { assignmentRows.push({ product_id: productId, tenant_id: tenantId, feature_slug: slug, module_id: moduleId }); }
          returned.push({ feature_slug: slug });
        });
        return { rows: returned };
      }
      return { rows: [] };
    }
  };
  return pool;
}

function makeProductsOwnerPool(products) {
  return {
    query: async function(sql, params) {
      var s = String(sql).replace(/\s+/g, ' ').trim();
      if (/SELECT tenant_id FROM products WHERE product_id/i.test(s)) {
        var row = (products || []).find(function(p) { return p.product_id === params[0]; });
        return { rows: row ? [{ tenant_id: row.tenant_id }] : [] };
      }
      return { rows: [] };
    }
  };
}

(async function() {
  var productsRoute = require(PRODUCTS_ROUTE_PATH);
  var modulesAdapter = require(MODULES_ADAPTER_PATH);

  // ===========================================================================
  // AC1 -- checkbox present on each row when >=1 module exists
  // ===========================================================================
  await test('renderPvcItemRow_withModulesPresent_includesCheckbox (AC1)', function() {
    var item = { slug: 'feat-1', name: 'Feature One', health: 'green' };
    var html = productsRoute._renderPvcItemRow(item, true);
    assert.ok(html.indexOf('class="bmau-item-checkbox"') !== -1, 'expected a bulk-assign checkbox in the row');
    assert.ok(html.indexOf('data-slug="feat-1"') !== -1, 'expected the checkbox (and the <li>) to carry data-slug="feat-1"');
    assert.ok(html.indexOf('type="checkbox"') !== -1, 'expected a real checkbox input');
  });

  // ===========================================================================
  // AC5 -- zero modules: no checkboxes, matching the existing simple fallback
  // ===========================================================================
  await test('renderPvcItemRow_zeroModules_noCheckboxes (AC5)', function() {
    var item = { slug: 'feat-1', name: 'Feature One', health: 'green' };
    var htmlDefault = productsRoute._renderPvcItemRow(item);
    var htmlExplicitFalse = productsRoute._renderPvcItemRow(item, false);
    assert.ok(htmlDefault.indexOf('bmau-item-checkbox') === -1, 'expected no checkbox when includeCheckbox is omitted');
    assert.ok(htmlExplicitFalse.indexOf('bmau-item-checkbox') === -1, 'expected no checkbox when includeCheckbox is explicitly false');

    // End-to-end through the real product view: a product with zero modules
    // renders zero checkboxes anywhere, even with multiple features (the
    // Array.map() index-leak regression this story's fix guards against).
    var features = [
      { featureSlug: 'feat-1', displayName: 'Feature One', stage: 'discovery', journey_id: 'j1' },
      { featureSlug: 'feat-2', displayName: 'Feature Two', stage: 'review', journey_id: 'j2' },
      { featureSlug: 'feat-3', displayName: 'Feature Three', stage: 'definition', journey_id: 'j3' }
    ];
    var html = productsRoute._renderProductView('Test Product', 'p1', features, 'login', null, false, 'o', 'r', [], TEST_CSRF, {});
    assert.strictEqual((html.match(/bmau-item-checkbox/g) || []).length, 0, 'expected zero checkboxes anywhere with zero modules, regardless of item count/index');
  });

  // ===========================================================================
  // AC4 -- "Assign to module" control disabled with zero checked
  // ===========================================================================
  await test('bulkAssignControl_disabledWithZeroChecked (AC4)', function() {
    var modules = [{ id: 'mod-1', name: 'Module One' }];
    var features = [
      { featureSlug: 'feat-1', displayName: 'Feature One', stage: 'discovery', journey_id: 'j1' }
    ];
    var html = productsRoute._renderProductView('Test Product', 'p1', features, 'login', null, false, 'o', 'r', modules, TEST_CSRF, {});
    assert.ok(html.indexOf('id="bmau-assign-btn" disabled') !== -1, 'expected the Assign to module control to render disabled in its initial (zero-checked) state');
  });

  // ===========================================================================
  // AC1 -- exactly one checkbox per item, no Array.map() index-leak
  // (regression guard for the bug found and fixed while implementing this
  // story: passing _renderPvcItemRow directly to .map() leaks the array
  // index into includeCheckbox, incorrectly truthy for index >= 1)
  // ===========================================================================
  await test('renderPvcItemRow_multipleItems_exactlyOneCheckboxPerModuleItem_noIndexLeak (AC1)', function() {
    var modules = [{ id: 'mod-1', name: 'Module One' }];
    var features = [
      { featureSlug: 'feat-1', displayName: 'Feature One', stage: 'discovery', journey_id: 'j1' },
      { featureSlug: 'feat-2', displayName: 'Feature Two', stage: 'review', journey_id: 'j2' },
      { featureSlug: 'feat-3', displayName: 'Feature Three', stage: 'definition', journey_id: 'j3' }
    ];
    var assignments = { 'feat-1': 'mod-1', 'feat-2': 'mod-1', 'feat-3': 'mod-1' };
    var html = productsRoute._renderProductView('Test Product', 'p1', features, 'login', null, false, 'o', 'r', modules, TEST_CSRF, assignments);
    var checkboxCount = (html.match(/<input type="checkbox" class="bmau-item-checkbox"/g) || []).length;
    assert.strictEqual(checkboxCount, 3, 'expected exactly 3 checkboxes (one per module-tab item), got ' + checkboxCount);
    ['feat-1', 'feat-2', 'feat-3'].forEach(function(slug) {
      assert.ok(html.indexOf('data-slug="' + slug + '"') !== -1, 'expected a checkbox for ' + slug);
    });
  });

  // ===========================================================================
  // AC2 -- bulk-assign is called with exactly the checked story slugs and
  // selected module id (the real backend, driven with a request shaped
  // exactly like the client JS's own fetch body construction)
  // ===========================================================================
  await test('handlePostBulkAssign_calledWithCheckedSlugsAndModule (AC2)', async function() {
    var moduleRows = [{ id: 'mod-1', product_id: 'p1', tenant_id: 't1', name: 'Governance' }];
    var pool = makeFakeModulesPool({ moduleRows: moduleRows });
    modulesAdapter.setModulesAdapter(pool);
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);

    // Matches bmauAssignToModule()'s own fetch body exactly: featureSlugs
    // (the checked slugs), moduleId (the selected dropdown value), _csrf.
    var req = {
      params: { id: 'p1' },
      session: { tenantId: 't1', csrfToken: TEST_CSRF },
      body: { featureSlugs: ['feat-1', 'feat-2'], moduleId: 'mod-1', _csrf: TEST_CSRF }
    };
    var statusCode = null;
    var responseBody = null;
    var res = {
      status: function(c) { statusCode = c; return { json: function(b) { responseBody = b; } }; },
      writeHead: function(c) { statusCode = c; },
      end: function() {}
    };
    await productsRoute.handlePostBulkAssignFeatureModules(req, res, null, ownerPool);

    assert.strictEqual(statusCode, 200, 'expected 200, got ' + statusCode);
    assert.strictEqual(pool._assignmentRows.length, 2, 'expected exactly 2 assignment rows written -- exactly the checked slugs, no more, no fewer');
    var assignedSlugs = pool._assignmentRows.map(function(r) { return r.feature_slug; }).sort();
    assert.deepStrictEqual(assignedSlugs, ['feat-1', 'feat-2'], 'expected exactly feat-1 and feat-2 assigned');
    pool._assignmentRows.forEach(function(r) {
      assert.strictEqual(r.module_id, 'mod-1', 'expected every assigned row to use the selected module id');
    });
  });

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
