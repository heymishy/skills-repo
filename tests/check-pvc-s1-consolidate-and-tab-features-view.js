'use strict';

// tests/check-pvc-s1-consolidate-and-tab-features-view.js — pvc-s1
//
// Unit + integration tests for pvc-s1 (Consolidate the product view's two
// module-grouped sections into one, with By Module / By Phase / All tabs
// and health/search filtering). Covers AC1-AC9 from
// artefacts/2026-07-22-product-view-consolidation/test-plans/pvc-s1-test-plan.md.
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
var PRODUCT_ROLLUP_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
var MODULES_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/modules-adapter.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

(async function() {
  var productRollup = require(PRODUCT_ROLLUP_PATH);
  var productsRoute = require(PRODUCTS_ROUTE_PATH);
  var modulesAdapter = require(MODULES_ADAPTER_PATH);

  // ===========================================================================
  // AC2 -- merge precedence: taxonomy metadata wins on overlap, journey stage carried
  // ===========================================================================
  await test('mergeFeatureSources: overlapping slug uses taxonomy metadata, keeps journey stage (AC2)', function() {
    var taxonomy = { groups: [{ epicSlug: 'ex', epicName: 'Epic X', items: [{ slug: 'shared-1', name: 'Shared Feature' }] }], ungrouped: [] };
    var journeyFeatures = [{ featureSlug: 'shared-1', stage: 'implementation', journey_id: 'j1' }];
    var merged = productRollup.mergeFeatureSources(taxonomy, journeyFeatures);
    assert.strictEqual(merged.length, 1, 'expected exactly one merged item, not two');
    assert.strictEqual(merged[0].name, 'Shared Feature');
    assert.strictEqual(merged[0].epicName, 'Epic X');
    assert.strictEqual(merged[0].stage, 'implementation');
    assert.strictEqual(merged[0].journeyId, 'j1');
  });

  // ===========================================================================
  // AC3 -- journeys-only item surfaces
  // ===========================================================================
  await test('mergeFeatureSources: a journeys-only slug still appears, tagged source journey (AC3)', function() {
    var taxonomy = { groups: [], ungrouped: [] };
    var journeyFeatures = [{ featureSlug: 'journey-only-1', stage: 'discovery', journey_id: 'j2' }];
    var merged = productRollup.mergeFeatureSources(taxonomy, journeyFeatures);
    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0].slug, 'journey-only-1');
    assert.strictEqual(merged[0].source, 'journey');
    assert.strictEqual(merged[0].stage, 'discovery');
  });

  await test('mergeFeatureSources: a taxonomy-only slug appears tagged source taxonomy', function() {
    var taxonomy = { groups: [], ungrouped: [{ slug: 'tax-only-1', name: 'Tax Only' }] };
    var merged = productRollup.mergeFeatureSources(taxonomy, []);
    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0].source, 'taxonomy');
    assert.strictEqual(merged[0].name, 'Tax Only');
  });

  // ===========================================================================
  // AC4 -- By Module bucketing over the merged list (generalized groupItemsByModule)
  // ===========================================================================
  await test('groupItemsByModule: every module gets a bucket (even empty), unassigned items land in Unclassified (AC4)', function() {
    var items = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
    var assignmentMap = { a: 'mod-1' };
    var modules = [{ id: 'mod-1', name: 'Module One' }, { id: 'mod-2', name: 'Module Two' }];
    var result = productRollup.groupItemsByModule(items, assignmentMap, modules);
    assert.strictEqual(result.byModule.length, 2);
    var mod1 = result.byModule.find(function(b) { return b.moduleId === 'mod-1'; });
    var mod2 = result.byModule.find(function(b) { return b.moduleId === 'mod-2'; });
    assert.strictEqual(mod1.items.length, 1);
    assert.strictEqual(mod2.items.length, 0, 'Module Two must still appear with an empty bucket');
    assert.strictEqual(result.unclassified.length, 2);
    assert.strictEqual(result.totalCount, 3);
  });

  // ===========================================================================
  // AC5 -- By Phase bucketing over the merged list
  // ===========================================================================
  await test('groupItemsByPhase: groups by epicName, no-epic items land in Other (AC5)', function() {
    var items = [
      { slug: 'a', epicName: 'Phase 1' },
      { slug: 'b', epicName: 'Phase 1' },
      { slug: 'c', epicName: 'Phase 2' },
      { slug: 'd' }
    ];
    var result = productRollup.groupItemsByPhase(items);
    assert.strictEqual(result.byPhase.length, 2);
    var phase1 = result.byPhase.find(function(p) { return p.epicName === 'Phase 1'; });
    assert.strictEqual(phase1.items.length, 2);
    assert.strictEqual(result.other.length, 1);
    assert.strictEqual(result.totalCount, 4);
  });

  // ===========================================================================
  // AC6 -- All-tab count parity across every grouping mode
  // ===========================================================================
  await test('count parity: merged list length equals byModule total equals byPhase total (AC6)', function() {
    var items = [];
    for (var i = 0; i < 120; i++) {
      items.push({ slug: 'item-' + i, epicName: i % 3 === 0 ? 'Phase ' + (i % 5) : undefined });
    }
    var modules = [{ id: 'mod-1', name: 'M1' }, { id: 'mod-2', name: 'M2' }];
    var assignmentMap = {};
    items.forEach(function(item, i) { if (i % 2 === 0) { assignmentMap[item.slug] = i % 4 === 0 ? 'mod-1' : 'mod-2'; } });
    var byModule = productRollup.groupItemsByModule(items, assignmentMap, modules);
    var byPhase = productRollup.groupItemsByPhase(items);
    assert.strictEqual(byModule.totalCount, items.length, 'byModule total must equal merged list length at 120-item scale');
    assert.strictEqual(byPhase.totalCount, items.length, 'byPhase total must equal merged list length at 120-item scale');
  });

  // ===========================================================================
  // AC1 -- no duplicate module sections; AC4 -- By Module tab default + empty buckets
  // ===========================================================================
  await test('_renderProductView renders exactly one features section, not two, with each module name appearing once (AC1)', function() {
    modulesAdapter.setModulesAdapter({ query: async function() { return { rows: [] }; } });
    var modules = [{ id: 'mod-1', name: 'Alpha Module' }, { id: 'mod-2', name: 'Beta Module' }];
    var features = [
      { journey_id: 'j1', featureSlug: 'feat-1', stage: 'discovery', health: 'green', moduleId: null }
    ];
    var rollupRow = {
      health_counts: {}, test_coverage: {}, ac_coverage: {},
      taxonomy: { groups: [{ epicSlug: 'e1', epicName: 'Epic One', items: [{ slug: 'tax-1' }] }], ungrouped: [] },
      synced_at: new Date().toISOString()
    };
    var assignments = { 'tax-1': 'mod-1' };
    var html = productsRoute._renderProductView('Test Product', 'p1', features, 'login', rollupRow, false, 'o', 'r', modules, 'csrf-tok', assignments);

    // Match the exact _renderModuleSection header pattern (the collapsible
    // section heading), not any occurrence of the module name anywhere on
    // the page -- the module CRUD management list (a1) legitimately shows
    // the same name too, in a different, unrelated section. The bug this
    // story fixes is TWO section headings for the same module (one from the
    // old a4 journeys-section, one from tmc-s1's taxonomy-section) -- so the
    // section-heading pattern specifically must appear exactly once.
    ['Alpha Module', 'Beta Module'].forEach(function(name) {
      var headerPattern = new RegExp('<span>' + name + ' <span style="color:var\\(--muted\\);font-weight:400">\\(', 'g');
      var count = (html.match(headerPattern) || []).length;
      assert.strictEqual(count, 1, 'expected "' + name + '" to appear exactly once as a module bucket section heading, got ' + count);
    });
    // Confirm the old dual-section markers are both gone.
    assert.ok(html.indexOf('Features by module') === -1, 'old tmc-s1 heading must not appear');
  });

  await test('_renderProductView: By Module tab is active by default, includes an empty bucket for a module with zero items (AC4)', function() {
    modulesAdapter.setModulesAdapter({ query: async function() { return { rows: [] }; } });
    var modules = [{ id: 'mod-1', name: 'Has Items' }, { id: 'mod-2', name: 'Empty Module' }];
    var features = [];
    var rollupRow = {
      health_counts: {}, test_coverage: {}, ac_coverage: {},
      taxonomy: { groups: [], ungrouped: [{ slug: 'tax-1', name: 'Tax One' }] },
      synced_at: new Date().toISOString()
    };
    var assignments = { 'tax-1': 'mod-1' };
    var html = productsRoute._renderProductView('Test Product', 'p1', features, 'login', rollupRow, false, 'o', 'r', modules, 'csrf-tok', assignments);

    assert.ok(/id="pvc-tab-panel-module" class="pvc-tab-panel pvc-tab-panel--active"/.test(html), 'By Module panel must be active by default');
    assert.ok(html.indexOf('Empty Module') !== -1, 'empty module must still render its own (empty) section');
  });

  // ===========================================================================
  // AC5 (integration) -- By Phase tab renders with real grouping
  // ===========================================================================
  await test('_renderProductView: By Phase tab groups items by epicName (AC5)', function() {
    modulesAdapter.setModulesAdapter({ query: async function() { return { rows: [] }; } });
    var modules = [{ id: 'mod-1', name: 'M1' }];
    var rollupRow = {
      health_counts: {}, test_coverage: {}, ac_coverage: {},
      taxonomy: { groups: [{ epicSlug: 'e1', epicName: 'Phase Alpha', items: [{ slug: 'tax-1' }] }], ungrouped: [{ slug: 'tax-2', name: 'Tax Two' }] },
      synced_at: new Date().toISOString()
    };
    var html = productsRoute._renderProductView('Test Product', 'p1', [], 'login', rollupRow, false, 'o', 'r', modules, 'csrf-tok', {});
    assert.ok(html.indexOf('Phase Alpha') !== -1, 'By Phase panel must show the real epic name');
    assert.ok(html.indexOf('Other features') !== -1, 'items with no epicName must land in Other features');
  });

  // ===========================================================================
  // AC7 -- health filter chips + data-health attributes
  // ===========================================================================
  await test('_renderProductView: 5 health filter chips present, item rows carry data-health (AC7)', function() {
    modulesAdapter.setModulesAdapter({ query: async function() { return { rows: [] }; } });
    var modules = [{ id: 'mod-1', name: 'M1' }];
    var rollupRow = {
      health_counts: { perFeature: [{ slug: 'tax-1', health: 'red' }] }, test_coverage: {}, ac_coverage: {},
      taxonomy: { groups: [], ungrouped: [{ slug: 'tax-1', name: 'Tax One' }] },
      synced_at: new Date().toISOString()
    };
    var html = productsRoute._renderProductView('Test Product', 'p1', [], 'login', rollupRow, false, 'o', 'r', modules, 'csrf-tok', {});
    ['all', 'green', 'amber', 'red', 'unknown'].forEach(function(h) {
      assert.ok(html.indexOf('data-health-filter="' + h + '"') !== -1, 'expected a filter chip for ' + h);
    });
    assert.ok(html.indexOf('data-health="red"') !== -1, 'expected the red-health item row to carry data-health="red"');
  });

  // ===========================================================================
  // AC8 -- search input + data-search attributes
  // ===========================================================================
  await test('_renderProductView: search input present, item rows carry data-search (AC8)', function() {
    modulesAdapter.setModulesAdapter({ query: async function() { return { rows: [] }; } });
    var modules = [{ id: 'mod-1', name: 'M1' }];
    var rollupRow = {
      health_counts: {}, test_coverage: {}, ac_coverage: {},
      taxonomy: { groups: [], ungrouped: [{ slug: 'searchable-slug', name: 'Findable Name' }] },
      synced_at: new Date().toISOString()
    };
    var html = productsRoute._renderProductView('Test Product', 'p1', [], 'login', rollupRow, false, 'o', 'r', modules, 'csrf-tok', {});
    assert.ok(/class="pvc-search"/.test(html), 'expected a search input');
    assert.ok(html.indexOf('data-search="findable name searchable-slug"') !== -1, 'expected the lowercased name+slug data-search attribute');
  });

  // ===========================================================================
  // AC9 -- zero-module fallback preserved (no tabs, no filter bar)
  // ===========================================================================
  await test('_renderProductView: zero modules renders the simple flat fallback, no tabs, no filter bar (AC9)', function() {
    modulesAdapter.setModulesAdapter({ query: async function() { return { rows: [] }; } });
    var rollupRow = {
      health_counts: {}, test_coverage: {}, ac_coverage: {},
      taxonomy: { groups: [], ungrouped: [{ slug: 'tax-1', name: 'Tax One' }] },
      synced_at: new Date().toISOString()
    };
    var html = productsRoute._renderProductView('Test Product', 'p1', [], 'login', rollupRow, false, 'o', 'r', [], 'csrf-tok', {});
    assert.ok(html.indexOf('pvc-tabs') === -1, 'zero modules must not show tabs');
    assert.ok(html.indexOf('pvc-filter-bar') === -1, 'zero modules must not show the filter bar');
    assert.ok(html.indexOf('Tax One') !== -1, 'the item must still appear in the flat fallback list');
  });

  await test('_renderProductView: zero modules and zero items renders "No features yet." without throwing', function() {
    modulesAdapter.setModulesAdapter({ query: async function() { return { rows: [] }; } });
    var html = productsRoute._renderProductView('Test Product', 'p1', [], 'login', null, false, 'o', 'r', [], 'csrf-tok', {});
    assert.ok(html.indexOf('No features yet.') !== -1);
  });

  // ===========================================================================
  // Accessibility NFR -- tab roles match settings.js's established convention
  // ===========================================================================
  await test('tab markup uses role=tablist/tab and aria-selected, matching the settings.js convention', function() {
    modulesAdapter.setModulesAdapter({ query: async function() { return { rows: [] }; } });
    var modules = [{ id: 'mod-1', name: 'M1' }];
    var html = productsRoute._renderProductView('Test Product', 'p1', [], 'login', null, false, 'o', 'r', modules, 'csrf-tok', {});
    assert.ok(/role="tablist"/.test(html));
    assert.ok(/role="tab"/.test(html));
    assert.ok(/aria-selected="true"/.test(html));
  });

  console.log('\n[pvc-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
