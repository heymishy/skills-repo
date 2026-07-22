'use strict';

// tests/check-a4-module-grouped-rendering.js — a4
//
// Unit + integration tests for a4 (Render the product view grouped by
// module, with dual health/coverage indicators and a scale gauge). Covers
// AC1-AC4 from
// artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a4-test-plan.md.
// AC5 (smooth expand/collapse transition) is CSS-layout-dependent and
// covered separately by tests/e2e/a4-module-expand-collapse.spec.js
// (Playwright, not part of this file/the npm test chain).
//
// Follows this repo's own hand-rolled test()/assert style (see
// tests/check-a1-modules-taxonomy-crud.js, tests/check-a2-reassign-epics-between-modules.js)
// -- no Jest/Mocha.

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

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

(async function() {
  console.log('\n[a4] AC1 -- handleGetProductView reads journeys.module_id and the product\'s modules list end-to-end');

  // tmc-s1 (unification revision, 2026-07-22): a journey's module assignment
  // is no longer read from journeys.module_id directly -- it comes from the
  // same feature_module_assignments table (keyed by feature_slug) the
  // taxonomy section reads, fetched via modulesAdapter.getFeatureModuleAssignments
  // (see decisions.md REVISION entry). This fakePool models that table.
  await test('handleGetProductView reads module assignment via feature_module_assignments and renders the product\'s modules via modulesAdapter (AC1 integration)', async function() {
    var modulesAdapter = freshRequire(MODULES_ADAPTER_PATH);
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var moduleRows = [{ id: 'mod-1', name: 'Web UI', created_at: new Date().toISOString() }];
    var fakePool = {
      query: async function(sql) {
        var s = String(sql);
        if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/i.test(s)) return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: null, repo_name: null }] };
        if (/SELECT dod_status_counts, health_counts, test_coverage, ac_coverage, taxonomy, synced_at FROM product_rollups/i.test(s)) return { rows: [] };
        if (/SELECT journey_id, feature_slug, data->>'activeSkill' AS stage FROM journeys/i.test(s)) return { rows: [{ journey_id: 'j1', feature_slug: 'f1', stage: 'discovery' }] };
        if (/SELECT id, name, created_at FROM product_modules/i.test(s)) return { rows: moduleRows };
        if (/SELECT feature_slug, module_id FROM feature_module_assignments/i.test(s)) return { rows: [{ feature_slug: 'f1', module_id: 'mod-1' }] };
        return { rows: [] };
      }
    };
    modulesAdapter.setModulesAdapter(fakePool);
    var html = null;
    var req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
    var res = { writeHead: function() {}, end: function(body) { html = body; } };
    await productsRoute.handleGetProductView(req, res, null, fakePool);
    assert.ok(/Web UI/.test(html), 'expected the module name "Web UI" to appear in the rendered page');
    assert.ok(/f1/.test(html), 'expected the epic (journey) to render nested under its module');
  });

  console.log('\n[a4] AC1 -- epics are grouped under their module, with an Unassigned bucket');

  await test('_renderProductView groups epics under their assigned module + Unassigned section (AC1 unit)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var modules = [{ id: 'mod-a', name: 'Module A' }, { id: 'mod-b', name: 'Module B' }];
    var features = [
      { journey_id: 'j1', featureSlug: 'feat-1', stage: 'discovery', health: 'green', moduleId: 'mod-a' },
      { journey_id: 'j2', featureSlug: 'feat-2', stage: 'discovery', health: 'green', moduleId: 'mod-b' },
      { journey_id: 'j3', featureSlug: 'feat-3', stage: 'discovery', health: 'green', moduleId: null }
    ];
    var html = productsRoute._renderProductView('Acme', 'p1', features, 'x', null, false, null, null, modules);
    assert.ok(/Module A/.test(html), 'expected "Module A" heading');
    assert.ok(/Module B/.test(html), 'expected "Module B" heading');
    assert.ok(/Unassigned/.test(html), 'expected an "Unassigned" section');
    assert.ok(/feat-1/.test(html) && /feat-2/.test(html) && /feat-3/.test(html), 'expected all three epics to render');
  });

  console.log('\n[a4] AC4 -- zero-module product renders a clean flat fallback');

  await test('_renderProductView renders the flat fallback list (no module headings) when modules is empty (AC4)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var features = [{ journey_id: 'j1', featureSlug: 'feat-1', stage: 'discovery', health: 'green', moduleId: null }];
    var html = productsRoute._renderProductView('Acme', 'p1', features, 'x', null, false, null, null, []);
    assert.ok(/feat-1/.test(html), 'expected the feature to still render');
    assert.ok(!/Unassigned/.test(html), 'expected no "Unassigned" heading when there are zero modules at all (flat fallback, not a 1-bucket grouping)');
  });

  await test('_renderProductView with zero modules and zero features renders without throwing (AC4)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    assert.doesNotThrow(function() {
      productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, []);
    });
  });

  await test('handleGetProductView renders a zero-module product cleanly via the real handler, no 500 (AC4 integration)', async function() {
    var modulesAdapter = freshRequire(MODULES_ADAPTER_PATH);
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = {
      query: async function(sql) {
        var s = String(sql);
        if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/i.test(s)) return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: null, repo_name: null }] };
        if (/SELECT dod_status_counts, health_counts, test_coverage, ac_coverage, taxonomy, synced_at FROM product_rollups/i.test(s)) return { rows: [] };
        if (/SELECT journey_id, feature_slug, module_id/i.test(s)) return { rows: [{ journey_id: 'j1', feature_slug: 'f1', module_id: null, stage: 'discovery' }] };
        if (/SELECT id, name, created_at FROM product_modules/i.test(s)) return { rows: [] };
        return { rows: [] };
      }
    };
    modulesAdapter.setModulesAdapter(fakePool);
    var statusCode = 200;
    var html = null;
    var req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
    var res = { writeHead: function(c) { statusCode = c; }, end: function(body) { html = body; } };
    await productsRoute.handleGetProductView(req, res, null, fakePool);
    assert.strictEqual(statusCode, 200);
    assert.ok(html && html.length > 0, 'expected a non-empty rendered response, not a blank page');
    assert.ok(!/Unassigned/.test(html), 'expected the flat fallback, not a misleading Unassigned-only grouping');
  });

  console.log('\n[a4] AC2 -- health and coverage render as two distinct elements per epic, never combined');

  await test('epic row renders a real per-feature health pill AND a separate coverage label, not one combined value (AC2)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var modules = [{ id: 'mod-a', name: 'Module A' }];
    var rollupRow = {
      health_counts: { green: 0, amber: 0, red: 1, unknown: 0, perFeature: [{ slug: 'feat-1', name: 'Feature One', health: 'red' }] },
      test_coverage: { noData: false, blendedPercentage: 80, perFeature: [{ slug: 'feat-1', percentage: 80 }], groups: [], ungrouped: [{ slug: 'feat-1', percentage: 80 }] }
    };
    var features = [{ journey_id: 'j1', featureSlug: 'feat-1', stage: 'discovery', health: 'green', moduleId: 'mod-a' }];
    var html = productsRoute._renderProductView('Acme', 'p1', features, 'x', rollupRow, false, null, null, modules);
    assert.ok(/✕ Blocked/.test(html), 'expected the epic\'s real per-feature health (A3, not the hardcoded journey.health) to render as "Blocked"');
    assert.ok(/80%/.test(html), 'expected an 80% coverage label to render');
    var healthEl = /data-a4-health[^>]*>([^<]*)</.exec(html);
    var coverageEl = /data-a4-coverage[^>]*>([^<]*)</.exec(html);
    assert.ok(healthEl && coverageEl, 'expected two separately-tagged DOM elements for health and coverage');
    assert.notStrictEqual(healthEl[1], coverageEl[1], 'health and coverage must not be the same rendered value/element');
  });

  await test('epic row falls back to "No test data yet" when no per-feature coverage match exists (honest no-data, not fabricated %) (AC2)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var modules = [{ id: 'mod-a', name: 'Module A' }];
    var rollupRow = { health_counts: { perFeature: [] }, test_coverage: { noData: false, blendedPercentage: 50, perFeature: [{ slug: 'other-feat', percentage: 50 }] } };
    var features = [{ journey_id: 'j1', featureSlug: 'feat-1', stage: 'discovery', health: 'green', moduleId: 'mod-a' }];
    var html = productsRoute._renderProductView('Acme', 'p1', features, 'x', rollupRow, false, null, null, modules);
    assert.ok(/No test data yet/.test(html), 'expected the honest no-data fallback, not a fabricated percentage');
  });

  console.log('\n[a4] AC3 -- scale gauge shows epic count, story count, and a proportional distribution strip');

  await test('_renderProductView renders a scale gauge with epic/story counts and one distribution segment per module with epics (AC3)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var modules = [{ id: 'mod-a', name: 'Module A' }, { id: 'mod-b', name: 'Module B' }, { id: 'mod-c', name: 'Module C' }];
    var features = [
      { journey_id: 'j1', featureSlug: 'f1', stage: 'discovery', health: 'green', moduleId: 'mod-a' },
      { journey_id: 'j2', featureSlug: 'f2', stage: 'discovery', health: 'green', moduleId: 'mod-a' },
      { journey_id: 'j3', featureSlug: 'f3', stage: 'discovery', health: 'green', moduleId: 'mod-b' },
      { journey_id: 'j4', featureSlug: 'f4', stage: 'discovery', health: 'green', moduleId: null }
    ];
    var rollupRow = { taxonomy: { groups: [], ungrouped: [], totalCount: 12 } };
    var html = productsRoute._renderProductView('Acme', 'p1', features, 'x', rollupRow, false, null, null, modules);
    assert.ok(/<strong>4<\/strong> epics/.test(html), 'expected the total epic count (4) to appear in the scale gauge');
    assert.ok(/<strong>12<\/strong> stories/.test(html), 'expected the total story count (12, from taxonomy.totalCount) to appear');
    var segmentCount = (html.match(/data-a4-dist-segment/g) || []).length;
    assert.strictEqual(segmentCount, 3, 'expected 3 distribution segments: Module A, Module B, Unassigned (Module C has zero epics and contributes no segment)');
  });

  await test('scale gauge handles zero epics without dividing by zero or throwing (AC3/AC4 overlap)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    assert.doesNotThrow(function() {
      productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, [{ id: 'mod-a', name: 'Module A' }]);
    });
  });

  console.log('\n[a4] Security NFR -- module and epic names are escaped before rendering');

  await test('a module name containing <script> and HTML special characters is escaped, not rendered raw', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var modules = [{ id: 'mod-a', name: '<script>alert(1)</script> & "Ops"' }];
    var features = [{ journey_id: 'j1', featureSlug: 'feat-<b>1</b>', stage: 'discovery', health: 'green', moduleId: 'mod-a' }];
    var html = productsRoute._renderProductView('Acme', 'p1', features, 'x', null, false, null, null, modules);
    assert.ok(!/<script>alert\(1\)<\/script>/.test(html), 'expected the module name\'s <script> tag to be escaped, not rendered raw');
    assert.ok(/&lt;script&gt;/.test(html), 'expected the escaped form of the module name to appear');
    assert.ok(!/feat-<b>1<\/b>/.test(html), 'expected the epic slug\'s HTML to be escaped, not rendered raw');
  });

  console.log('\n[a4] AC5 (unit-level check only -- see tests/e2e/a4-module-expand-collapse.spec.js for the real Playwright transition test)');

  await test('module section markup includes the CSS transition rule and a toggle handler (structural precondition for AC5)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var modules = [{ id: 'mod-a', name: 'Module A' }];
    var features = [{ journey_id: 'j1', featureSlug: 'feat-1', stage: 'discovery', health: 'green', moduleId: 'mod-a' }];
    var html = productsRoute._renderProductView('Acme', 'p1', features, 'x', null, false, null, null, modules);
    assert.ok(/grid-template-rows:\s*0fr/.test(html), 'expected the collapsed-state 0fr grid-template-rows rule');
    assert.ok(/transition:\s*grid-template-rows/.test(html), 'expected a real CSS transition on grid-template-rows, not an instant show/hide');
    assert.ok(/a4ToggleModule/.test(html), 'expected the expand/collapse toggle handler to be wired');
    assert.ok(/aria-expanded="true"/.test(html) && /aria-controls=/.test(html), 'expected keyboard/screen-reader accessible expand state (NFR-Accessibility)');
  });

  console.log('\n[a4] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
