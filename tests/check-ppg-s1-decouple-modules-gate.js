'use strict';

// tests/check-ppg-s1-decouple-modules-gate.js
// ppg-s1 -- the grouped/tabbed/filterable features UI (pdt-s1) only
// rendered when a product had >=1 custom Module; a module-less product
// (e.g. skills-framework itself) fell into an older, pre-pdt-s1 flat-list
// code path with none of that design's benefits. Decoupled here, reusing
// existing, already-tested zero-modules grouping behaviour unchanged.
// Also consolidates health counts (previously duplicated 3 places on one
// page) onto the single interactive chip bar.

var assert = require('assert');
var path = require('path');
var passed = 0; var failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var productsRoute = require(PRODUCTS_ROUTE_PATH);

console.log('\n[ppg-s1] AC1 -- zero-modules product renders the full tabbed/filterable UI, not a flat list');

test('zero-modules: tabs, search, and health-filter chip bar all render', function() {
  var rollupRow = { health_counts: { green: 1, amber: 1, red: 1, unknown: 0 }, taxonomy: { groups: [{ epicSlug: 'ph0', epicName: 'Phase 0', items: [{ slug: 'p0.1' }, { slug: 'p0.2' }] }], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', [], 'csrf-token', {}, {}, [], 0, null, false);
  assert.ok(/class="pvc-tabs"/.test(html), 'expected the tabs bar to render');
  assert.ok(/id="pvc-tab-phase"/.test(html), 'expected the By Phase tab to render');
  assert.ok(/id="pvc-tab-module"/.test(html), 'expected the By Module tab to render');
  assert.ok(/id="pvc-tab-all"/.test(html), 'expected the All tab to render');
  assert.ok(/class="pvc-search"/.test(html), 'expected the search box to render');
  assert.ok(/class="pvc-health-chip/.test(html), 'expected the health-filter chip bar to render');
});

console.log('\n[ppg-s1] AC2 -- zero-modules By Module tab shows exactly one Unclassified group, no bulk-assign bar');

test('zero-modules: By Module tab shows one Unclassified(N) group, no bmau-bar', function() {
  var rollupRow = { health_counts: { green: 1, amber: 1, red: 1, unknown: 0 }, taxonomy: { groups: [{ epicSlug: 'ph0', epicName: 'Phase 0', items: [{ slug: 'p0.1' }, { slug: 'p0.2' }] }], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', [], 'csrf-token', {}, {}, [], 0, null, false);
  var modulePanel = html.match(/id="pvc-tab-panel-module"[\s\S]*?(?=id="pvc-tab-panel-phase")/)[0];
  assert.ok(/Unclassified/.test(modulePanel), 'expected an Unclassified group in the By Module panel');
  assert.ok(/Unclassified.*\(3\)/.test(modulePanel), 'expected the Unclassified group to show the correct item count (3)');
  assert.ok(!/bmau-bar/.test(modulePanel), 'expected no bulk-assign bar when there are zero modules to assign to');
});

console.log('\n[ppg-s1] AC3/AC6 -- default active tab: By Phase for zero modules, By Module for >=1 module');

test('zero-modules: By Phase is the default active tab', function() {
  var rollupRow = { health_counts: { green: 1, amber: 1, red: 1, unknown: 0 }, taxonomy: { groups: [{ epicSlug: 'ph0', epicName: 'Phase 0', items: [{ slug: 'p0.1' }, { slug: 'p0.2' }] }], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', [], 'csrf-token', {}, {}, [], 0, null, false);
  assert.ok(/id="pvc-tab-phase" role="tab" aria-selected="true"/.test(html), 'expected By Phase tab to be aria-selected=true');
  assert.ok(/id="pvc-tab-panel-phase" class="pvc-tab-panel pvc-tab-panel--active"/.test(html), 'expected the By Phase panel to carry the active class');
  assert.ok(/id="pvc-tab-module" role="tab" aria-selected="false"/.test(html), 'expected By Module tab to NOT be aria-selected when zero modules');
});

test('with-modules: By Module remains the default active tab (regression guard, AC6)', function() {
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var rollupRow = { health_counts: { green: 1, amber: 1, red: 1, unknown: 0 }, taxonomy: { groups: [], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', modules, 'csrf-token', {}, {}, [], 0, null, false);
  assert.ok(/id="pvc-tab-module" role="tab" aria-selected="true"/.test(html), 'expected By Module tab to still be the default when >=1 module exists');
  assert.ok(/id="pvc-tab-panel-module" class="pvc-tab-panel pvc-tab-panel--active"/.test(html), 'expected the By Module panel to carry the active class');
});

test('with-modules: bulk-assign bar still renders (regression guard, AC6)', function() {
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var rollupRow = { health_counts: { green: 1, amber: 1, red: 1, unknown: 0 }, taxonomy: { groups: [], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', modules, 'csrf-token', {}, {}, [], 0, null, false);
  assert.ok(/bmau-bar/.test(html), 'expected the bulk-assign bar to still render when >=1 module exists');
});

console.log('\n[ppg-s1] AC4 -- health counts appear once, on the interactive chip bar, with real counts');

test('health-filter chips show real per-status counts; pdt-triage-strip is gone', function() {
  var rollupRow = { health_counts: { green: 50, amber: 3, red: 1, unknown: 10 }, taxonomy: { groups: [], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', [], 'csrf-token', {}, {}, [], 0, null, false);
  assert.ok(/Warning \(3\)/.test(html), 'expected the Warning chip to show its real count (3)');
  assert.ok(/Blocked \(1\)/.test(html), 'expected the Blocked chip to show its real count (1)');
  assert.ok(/Healthy \(50\)/.test(html), 'expected the Healthy chip to show its real count (50)');
  assert.ok(/Unknown \(10\)/.test(html), 'expected the Unknown chip to show its real count (10)');
  assert.ok(!/pdt-triage-strip/.test(html), 'expected the old separate triage-strip block to be gone');
});

console.log('\n[ppg-s1] AC5 -- Overall line shows only its single derived label, no repeated breakdown');

test('Overall line contains only its own label, no per-status breakdown', function() {
  var rollupRow = { health_counts: { green: 50, amber: 3, red: 1, unknown: 10 }, taxonomy: { groups: [], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', [], 'csrf-token', {}, {}, [], 0, null, false);
  var overallMatch = html.match(/Overall: [^<]*<\/span>\s*<\/div>/);
  assert.ok(overallMatch, 'expected an Overall line to render');
  var overallDiv = html.match(/<div style="margin-top:12px;font-size:13px">[\s\S]{0,150}/)[0];
  assert.ok(!/Blocked: 1/.test(overallDiv), 'expected no Blocked: N text inside the simplified Overall div');
  assert.ok(!/Healthy: 50/.test(overallDiv), 'expected no Healthy: N text inside the simplified Overall div');
});

console.log('\n[ppg-s1] Results so far: ' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed > 0 ? 1 : 0;
