'use strict';

// tests/check-pdt-s3-deemphasize-unknown-health.js — pdt-s3
//
// Unknown-health items already used the correct var(--muted) color (no
// change needed there), but their "?" glyph made them read with the same
// visual weight as real Healthy/Warning/Blocked signals -- dropped it
// (AC1, AC2 regression guard). Separately, the top-level "Overall:" line
// silently fell through to a misleading green "Healthy" whenever there was
// zero real health signal (no rollup data at all, or 100% Unknown-health
// items) -- fixed locally in _renderProductView, without touching the
// shared computeOverallHealthSignal/computeHealthCounts functions (AC3).
//
// Covers AC1-AC3 from
// artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s3-test-plan.md.

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

(async function() {
  var productRollup = require(PRODUCT_ROLLUP_PATH);
  var productsRoute = require(PRODUCTS_ROUTE_PATH);

  // ===========================================================================
  // AC1 -- Unknown-health item renders plain "Unknown" text, no "?" glyph
  // ===========================================================================
  await test('AC1: Unknown-health item renders plain "Unknown" text in the muted token, no "?" glyph, no colored badge background', function() {
    var pipelineState = {
      features: [{ slug: 'feat-a', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }] }] }]
    };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', {}, {}, [], 0, null
    );

    assert.ok(/data-health="unknown"/.test(html), 'expected the s1 row to be marked unknown health');
    assert.ok(!/\? Unknown/.test(html), 'expected the "?" glyph to be dropped from the Unknown label');
    assert.ok(/color:var\(--muted\)">Unknown</.test(html), 'expected plain "Unknown" text in the muted color token, no background styling');
  });

  // ===========================================================================
  // AC2 -- real health values keep their existing colored labels (regression)
  // ===========================================================================
  await test('AC2: real Healthy/Warning/Blocked items keep their existing colored labels, unchanged', function() {
    var pipelineState = {
      features: [
        { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }] }] },
        { slug: 'feat-b', health: 'amber', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's2' }] }] },
        { slug: 'feat-c', health: 'red', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's3' }] }] }
      ]
    };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', {}, {}, [], 0, null
    );

    assert.ok(/color:#22c55e">✓ Healthy</.test(html), 'expected Healthy items to keep their green color and glyph, unchanged');
    assert.ok(/color:#f59e0b">⚠ Warning</.test(html), 'expected Warning items to keep their amber color and glyph, unchanged');
    assert.ok(/color:#ef4444">✕ Blocked</.test(html), 'expected Blocked items to keep their red color and glyph, unchanged');
  });

  // ===========================================================================
  // AC3 -- Overall line shows an honest Unknown state, not a misleading green
  // ===========================================================================
  await test('AC3: Overall line shows an honest Unknown state, not a misleading green Healthy, when there is no real health signal', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];

    var rollupRowNoData = { health_counts: null, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var htmlNoData = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRowNoData, false, null, null,
      modules, 'csrf-token', {}, {}, [], 0, null
    );
    assert.ok(/Overall: Unknown/.test(htmlNoData), 'expected an honest "Overall: Unknown" line when there is no rollup data at all, not a missing line');
    assert.ok(!/Overall: ✓ Healthy/.test(htmlNoData), 'expected no misleading green Healthy overall signal with zero real data');

    var pipelineState = { features: [{ slug: 'feat-a', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }] }] }] };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var rollupRowAllUnknown = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var htmlAllUnknown = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRowAllUnknown, false, null, null,
      modules, 'csrf-token', {}, {}, [], 0, null
    );
    assert.ok(/Overall: Unknown/.test(htmlAllUnknown), 'expected an honest "Overall: Unknown" line when 100% of items are Unknown-health');
    assert.ok(!/Overall: ✓ Healthy/.test(htmlAllUnknown), 'expected no misleading green Healthy overall signal when there is zero real green/amber/red signal');
  });

  // ===========================================================================
  // NFR-Accessibility -- muted Unknown color token meets WCAG 2.1 AA contrast
  // ===========================================================================
  await test('NFR-Accessibility: the muted Unknown color token meets WCAG 2.1 AA contrast (>=4.5:1) against the page background', function() {
    function relLum(hex) {
      var r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
      function lin(c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    }
    function contrast(h1, h2) {
      var L1 = relLum(h1), L2 = relLum(h2);
      var lighter = Math.max(L1, L2), darker = Math.min(L1, L2);
      return (lighter + 0.05) / (darker + 0.05);
    }
    var lightRatio = contrast('#71717A', '#FAFAF9'); // light --muted vs light --bg
    var darkRatio = contrast('#808080', '#111110');  // dark --muted vs dark --bg
    assert.ok(lightRatio >= 4.5, 'expected light-mode --muted vs --bg contrast >= 4.5:1, got ' + lightRatio.toFixed(2));
    assert.ok(darkRatio >= 4.5, 'expected dark-mode --muted vs --bg contrast >= 4.5:1, got ' + darkRatio.toFixed(2));
  });

  console.log('\n[check-pdt-s3-deemphasize-unknown-health] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
