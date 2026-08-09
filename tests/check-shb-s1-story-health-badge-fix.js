'use strict';

// tests/check-shb-s1-story-health-badge-fix.js — shb-s1
//
// Epic-nested story rows always showed "? Unknown" health instead of their
// real (inherited) health, because computeHealthCounts only ever computes
// health at feature granularity, while the taxonomy-flattening pipeline
// produced story-level items with no reference back to their parent
// feature's slug. This fix threads featureSlug through that pipeline so a
// story item can inherit its parent feature's health.
//
// Covers AC1-AC4 from
// artefacts/2026-08-10-story-health-badge-fix/test-plans/shb-s1-test-plan.md.

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

var PRODUCT_ROLLUP_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');

function healthAttrForSlug(html, slug) {
  var re = new RegExp('data-health="([a-z]+)"[^>]*data-search="[^"]*"[^>]*>\\s*<a[^>]*href="/features/' + slug + '"');
  var m = re.exec(html);
  return m ? m[1] : null;
}

(async function() {
  var productRollup = require(PRODUCT_ROLLUP_PATH);
  var productsRoute = require(PRODUCTS_ROUTE_PATH);

  // ===========================================================================
  // AC1 (data-layer half) -- computeTaxonomyRollup carries featureSlug onto
  // epic-nested story items
  // ===========================================================================
  await test('computeTaxonomyRollup: epic-nested story item carries parent featureSlug (AC1)', function() {
    var pipelineState = {
      features: [
        { slug: 'feat-a', health: 'amber', epics: [{ slug: 'e1', name: 'Epic 1', stories: [{ slug: 's1' }] }] }
      ]
    };
    var result = productRollup.computeTaxonomyRollup(pipelineState);
    assert.strictEqual(result.groups.length, 1);
    assert.strictEqual(result.groups[0].items[0].slug, 's1');
    assert.strictEqual(result.groups[0].items[0].featureSlug, 'feat-a', 'expected the story item to carry its parent feature slug');
  });

  // ===========================================================================
  // AC1 (render-layer half) -- an epic-nested story inherits its parent
  // feature's health, rather than showing Unknown
  // ===========================================================================
  await test('_renderProductView: epic-nested story inherits parent feature health, not Unknown (AC1)', function() {
    var pipelineState = {
      features: [
        { slug: 'feat-a', health: 'amber', epics: [{ slug: 'e1', name: 'Epic 1', stories: [{ slug: 's1' }] }] }
      ]
    };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var featureModuleAssignments = { s1: 'm1' };
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
    );

    assert.strictEqual(healthAttrForSlug(html, 's1'), 'amber', 'expected story s1 to show amber (Warning), inherited from its parent feature feat-a');
  });

  // ===========================================================================
  // AC2 -- non-epic-nested (ungrouped taxonomy) item is unaffected -- regression guard
  // ===========================================================================
  await test('_renderProductView: non-epic-nested item health is unchanged (AC2, regression guard)', function() {
    var pipelineState = {
      features: [
        { slug: 'feat-b', name: 'Feature B', health: 'green' }
      ]
    };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var featureModuleAssignments = { 'feat-b': 'm1' };
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
    );

    assert.strictEqual(healthAttrForSlug(html, 'feat-b'), 'green', 'expected the ungrouped feature item to still resolve its own health directly, unchanged from before this fix');
  });

  // ===========================================================================
  // AC3 -- a story whose parent feature has no resolvable health still falls
  // back to Unknown, not a fabricated value
  // ===========================================================================
  await test('_renderProductView: story with unresolvable parent health still falls back to Unknown (AC3)', function() {
    var pipelineState = {
      features: [
        // feat-c has no `health` field at all -- computeHealthCounts will
        // classify it as 'unknown' too, but the point here is the LOOKUP
        // must not throw or silently invent a value when unmatched.
        { slug: 'feat-c', epics: [{ slug: 'e1', name: 'Epic 1', stories: [{ slug: 's2' }] }] }
      ]
    };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var featureModuleAssignments = { s2: 'm1' };
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
    );

    assert.strictEqual(healthAttrForSlug(html, 's2'), 'unknown', 'expected the fallback Unknown value to be preserved for genuinely-unmatched data, not fabricated');
  });

  // ===========================================================================
  // AC4 -- end to end: the top rollup and the per-row badges no longer
  // contradict each other for a real multi-feature product
  // ===========================================================================
  await test('_renderProductView: rollup counts and row-level badges agree, no contradiction (AC4)', function() {
    var pipelineState = {
      features: [
        { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic 1', stories: [{ slug: 's1' }] }] },
        { slug: 'feat-b', health: 'amber', epics: [{ slug: 'e2', name: 'Epic 2', stories: [{ slug: 's2' }] }] }
      ]
    };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    assert.strictEqual(healthCounts.green, 1);
    assert.strictEqual(healthCounts.amber, 1);
    assert.strictEqual(healthCounts.unknown, 0);

    var modules = [{ id: 'm1', name: 'Module 1' }];
    var featureModuleAssignments = { s1: 'm1', s2: 'm1' };
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
    );

    // Top rollup line
    assert.ok(/Healthy: 1/.test(html), 'expected the top rollup to show Healthy: 1');
    assert.ok(/Warning: 1/.test(html), 'expected the top rollup to show Warning: 1');
    assert.ok(/Unknown: 0/.test(html), 'expected the top rollup to show Unknown: 0');

    // Row-level badges must agree with the rollup -- neither row shows Unknown
    assert.strictEqual(healthAttrForSlug(html, 's1'), 'green');
    assert.strictEqual(healthAttrForSlug(html, 's2'), 'amber');
    assert.ok(!/data-health="unknown"/.test(html), 'expected zero rows to show Unknown, matching the rollup\'s Unknown: 0');
  });

  console.log('\n[check-shb-s1-story-health-badge-fix] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
