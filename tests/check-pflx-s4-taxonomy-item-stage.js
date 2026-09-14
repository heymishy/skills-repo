'use strict';

// tests/check-pflx-s4-taxonomy-item-stage.js -- pflx-s4
// Story: artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s4-populate-stage-for-taxonomy-items.md
// Test plan: artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s4-test-plan.md
//
// Uses the same real computeTaxonomyRollup/computeHealthCounts/_renderProductView
// fixture pipeline already established by tests/check-shb-s1-story-health-badge-fix.js
// -- not a hand-built mock shape (the exact trap that made pflx-s2 inert in
// production: a synthetic item.stage that never matched how real data is
// actually assembled).

var assert = require('assert');
var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS] ' + name);
  } catch (err) {
    failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err));
  }
}

var PRODUCT_ROLLUP_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var productRollup = require(PRODUCT_ROLLUP_PATH);
var productsRoute = require(PRODUCTS_ROUTE_PATH);

function dataActiveForSlug(html, slug) {
  var escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var re = new RegExp('data-active="([a-z]+)"[^>]*data-search="[^"]*' + escapedSlug + '[^"]*"');
  var m = re.exec(html);
  return m ? m[1] : null;
}

(function() {
  // ===========================================================================
  // AC1/AC5 -- computeHealthCounts surfaces a real stage per feature
  // ===========================================================================
  test('T1 (AC1): computeHealthCounts perFeature entries carry the real feature stage', function() {
    var pipelineState = { features: [
      { slug: 'feat-a', health: 'green', stage: 'definition-of-done' },
      { slug: 'feat-b', health: 'amber', stage: 'discovery' }
    ] };
    var counts = productRollup.computeHealthCounts(pipelineState);
    var a = counts.perFeature.find(function(f) { return f.slug === 'feat-a'; });
    var b = counts.perFeature.find(function(f) { return f.slug === 'feat-b'; });
    assert.strictEqual(a.stage, 'definition-of-done');
    assert.strictEqual(b.stage, 'discovery');
  });

  test('T2 (AC1, regression guard): a feature with no stage produces an undefined perFeature.stage, never fabricated', function() {
    var pipelineState = { features: [{ slug: 'feat-c', health: 'green' }] };
    var counts = productRollup.computeHealthCounts(pipelineState);
    var c = counts.perFeature.find(function(f) { return f.slug === 'feat-c'; });
    assert.strictEqual(c.stage, undefined);
  });

  // ===========================================================================
  // AC2 -- a taxonomy-only item picks up its real stage from pipeline-state
  // ===========================================================================
  test('T3 (AC2): a taxonomy-only item at definition-of-done renders data-active=false', function() {
    var pipelineState = { features: [
      { slug: 'feat-done', name: 'Shipped feature', health: 'green', stage: 'definition-of-done' }
    ] };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      [], 'csrf-token', {}, {}, [], 0, null
    );

    assert.strictEqual(dataActiveForSlug(html, 'feat-done'), 'false', 'expected a definition-of-done taxonomy item to be marked inactive');
  });

  // ===========================================================================
  // AC3 -- a journey-sourced item's own live stage wins over pipeline-state
  // ===========================================================================
  test('T4 (AC3): a journey-sourced item uses its own live stage, not the pipeline-state feature-level lookup', function() {
    var pipelineState = { features: [
      { slug: 'feat-live', name: 'In-progress feature', health: 'amber', stage: 'definition-of-done' }
    ] };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    // The live journey disagrees with pipeline-state (still mid-discovery) --
    // its own value must win.
    var journeyFeatures = [{ featureSlug: 'feat-live', journey_id: 'j1', stage: 'discovery' }];

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', journeyFeatures, 'tester', rollupRow, false, null, null,
      [], 'csrf-token', {}, {}, [], 0, null
    );

    assert.strictEqual(dataActiveForSlug(html, 'feat-live'), 'true', 'expected the journey\'s own live "discovery" stage to win, not pipeline-state\'s stale "definition-of-done"');
  });

  // ===========================================================================
  // AC4 -- absence of any match never means done
  // ===========================================================================
  test('T5 (AC4): a taxonomy item with no matching healthCounts.perFeature entry stays active (no false-positive hiding)', function() {
    var pipelineState = { features: [
      { slug: 'feat-orphan', name: 'Desynced feature', health: 'green', stage: 'definition-of-done' }
    ] };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    // Simulate a desync between taxonomy and healthCounts (e.g. stale cached
    // rollup) -- healthCounts genuinely has no entry for this slug at all.
    var healthCounts = { green: 0, amber: 0, red: 0, unknown: 0, perFeature: [] };
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      [], 'csrf-token', {}, {}, [], 0, null
    );

    assert.strictEqual(dataActiveForSlug(html, 'feat-orphan'), 'true', 'expected an item with no completion signal at all to never be hidden');
  });

  console.log('\n[pflx-s4] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
