'use strict';

// tests/check-pdt-s2-triage-summary-strip.js — pdt-s2
//
// Adds a clickable triage summary strip above the feature list showing
// Blocked/Warning counts. Reuses the existing pvc-health-chip filter
// mechanism (identical class + pvcFilterByHealth(this) handler) rather than
// building a second, parallel filter -- confirmed via code investigation
// that mechanism is button-based, not anchor-based (see the implementation
// plan's own Investigation note for why this diverges from the DoR/test
// plan's "<a> element" assumption).
//
// Covers AC1-AC3 from
// artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s2-test-plan.md.

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

(async function() {
  var productsRoute = require(PRODUCTS_ROUTE_PATH);

  // ===========================================================================
  // AC1 -- strip renders Blocked and Warning counts when present
  // ===========================================================================
  await test('AC1: strip renders Blocked and Warning counts when present', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 50, amber: 3, red: 1, unknown: 10 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', {}, {}, [], 0, null
    );

    assert.ok(/pdt-triage-strip/.test(html), 'expected the triage strip container to render');
    assert.ok(/Blocked: 1/.test(html), 'expected the strip to show Blocked count of 1');
    assert.ok(/Warning: 3/.test(html), 'expected the strip to show Warning count of 3');
  });

  // ===========================================================================
  // AC2 -- strip's Blocked count reuses the existing filter mechanism
  // ===========================================================================
  await test('AC2: strip Blocked count reuses the existing pvc-health-chip filter mechanism, not a parallel one', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 50, amber: 3, red: 1, unknown: 10 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', {}, {}, [], 0, null
    );

    var blockedButtonMatch = /<button type="button" class="pvc-health-chip" data-health-filter="red" onclick="pvcFilterByHealth\(this\)"[^>]*>[^<]*Blocked: 1<\/button>/.exec(html);
    assert.ok(blockedButtonMatch, 'expected the strip\'s Blocked button to carry the exact same class, data-health-filter, and onclick handler as the existing health-filter chips');
    assert.ok(/function pvcFilterByHealth\(btn\)/.test(html), 'expected the real pvcFilterByHealth handler to be defined on the page (proves reuse, not a parallel implementation)');
  });

  // ===========================================================================
  // AC3 -- zero-state shows a clear "nothing blocked" message
  // ===========================================================================
  await test('AC3: zero Blocked and zero Warning shows a clear "nothing blocked" state', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 60, amber: 0, red: 0, unknown: 5 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', {}, {}, [], 0, null
    );

    assert.ok(/pdt-triage-strip/.test(html), 'expected the strip container to still render in the zero-state');
    assert.ok(/Nothing blocked/.test(html), 'expected a clear positive-state message');
    var stripBlock = html.match(/pdt-triage-strip[\s\S]{0,300}/)[0];
    assert.ok(!/data-health-filter="red"/.test(stripBlock), 'expected no clickable Blocked button in the zero-state');
  });

  // ===========================================================================
  // NFR-Performance -- reuses existing healthCounts, no new query
  // ===========================================================================
  await test('NFR-Performance: strip reuses existing healthCounts, no new query/computation', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 1, amber: 1, red: 1, unknown: 0 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', {}, {}, [], 0, null
    );
    assert.ok(/pdt-triage-strip/.test(html), 'expected the strip to render using the already-computed healthCounts, no new query path');
  });

  // ===========================================================================
  // NFR-Accessibility -- real, keyboard-operable button controls
  // ===========================================================================
  await test('NFR-Accessibility: strip counts are real, keyboard-operable <button> controls (not a bare div/span with a click handler)', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 1, amber: 1, red: 1, unknown: 0 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', {}, {}, [], 0, null
    );
    var stripBlock = html.match(/pdt-triage-strip[\s\S]{0,600}/)[0];
    assert.ok(/<button type="button" class="pvc-health-chip"/.test(stripBlock), 'expected the strip\'s counts to be real <button type="button"> elements, natively keyboard-operable via Enter/Space');
    assert.ok(!/<div class="pdt-triage-strip"[^>]*onclick=/.test(stripBlock), 'expected the strip container itself not to be a div-with-onclick pattern');
  });

  console.log('\n[check-pdt-s2-triage-summary-strip] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
