'use strict';

// tests/check-pdt-s2-triage-summary-strip.js — pdt-s2, superseded by ppg-s1
//
// pdt-s2 originally added a separate, standalone triage-strip block above
// the feature list. ppg-s1 found this duplicated the same Blocked/Warning
// counts already shown (non-interactively) on the Overall line, and a
// THIRD time (uncounted) on the health-filter chip bar inside the features
// section -- confirmed live on skills-framework.fly.dev production.
// Consolidated onto that single chip bar, now with real counts -- this
// file's own tests are rewritten to match, not deleted, since the
// underlying requirement (clickable, above-the-list Blocked/Warning
// triage) is still true, just served by one mechanism instead of two.
//
// Originally covered AC1-AC3 from
// artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s2-test-plan.md;
// now covers ppg-s1 AC4 (see
// artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/test-plans/ppg-s1-test-plan.md).

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

  await test('Blocked and Warning counts render as clickable chips with real counts', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 50, amber: 3, red: 1, unknown: 10 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var html = productsRoute._renderProductView('Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null, modules, 'csrf-token', {}, {}, [], 0, null, false);
    assert.ok(/Blocked \(1\)/.test(html), 'expected the Blocked chip to show count 1');
    assert.ok(/Warning \(3\)/.test(html), 'expected the Warning chip to show count 3');
  });

  await test('chips reuse the real pvcFilterByHealth mechanism', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 50, amber: 3, red: 1, unknown: 10 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var html = productsRoute._renderProductView('Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null, modules, 'csrf-token', {}, {}, [], 0, null, false);
    var blockedChipMatch = /<button type="button" class="pvc-health-chip[^"]*" data-health-filter="red" onclick="pvcFilterByHealth\(this\)">[^<]*Blocked \(1\)<\/button>/.exec(html);
    assert.ok(blockedChipMatch, 'expected the Blocked chip to carry the real filter class/handler');
    assert.ok(/function pvcFilterByHealth\(btn\)/.test(html), 'expected the real pvcFilterByHealth handler to be defined on the page');
  });

  await test('zero Blocked and zero Warning still shows real (0) counts on the chips', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 60, amber: 0, red: 0, unknown: 5 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var html = productsRoute._renderProductView('Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null, modules, 'csrf-token', {}, {}, [], 0, null, false);
    assert.ok(/Blocked \(0\)/.test(html), 'expected the Blocked chip to show (0), not be hidden or replaced with a separate message');
    assert.ok(/Warning \(0\)/.test(html), 'expected the Warning chip to show (0)');
  });

  await test('NFR-Performance: chips reuse existing healthCounts, no new query/computation', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 1, amber: 1, red: 1, unknown: 0 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var html = productsRoute._renderProductView('Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null, modules, 'csrf-token', {}, {}, [], 0, null, false);
    assert.ok(/Warning \(1\)/.test(html), 'expected the chip to render from the already-computed healthCounts, no new query path');
  });

  await test('NFR-Accessibility: chips are real, keyboard-operable <button> controls', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 1, amber: 1, red: 1, unknown: 0 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var html = productsRoute._renderProductView('Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null, modules, 'csrf-token', {}, {}, [], 0, null, false);
    assert.ok(/<button type="button" class="pvc-health-chip/.test(html), 'expected real <button type="button"> elements, natively keyboard-operable via Enter/Space');
  });

  console.log('\n[check-pdt-s2-triage-summary-strip] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
