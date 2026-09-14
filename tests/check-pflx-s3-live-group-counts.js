'use strict';

// tests/check-pflx-s3-live-group-counts.js -- pflx-s3
// Story: artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s3-live-group-counts.md
// Test plan: artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s3-test-plan.md
//
// Same "extract the real script, run it in real jsdom against a real
// render" technique as pflx-s1/pflx-s2 / tests/check-icv-s1-ideate-canvas-turn2-render-fix.js.

var assert = require('assert');
var path = require('path');
var { JSDOM } = require('jsdom');

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

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var productsRoute = require(PRODUCTS_ROUTE_PATH);

function extractScript(html) {
  var marker = 'var pvcCurrentHealth="all";';
  var idx = html.indexOf(marker);
  assert.ok(idx !== -1, 'expected the pvc filter script to be present in the rendered HTML');
  var start = html.lastIndexOf('<script>', idx);
  var end = html.indexOf('</script>', idx);
  assert.ok(start !== -1 && end !== -1, 'expected enclosing <script>...</script> tags');
  return html.slice(start + '<script>'.length, end);
}

function buildDom(items, modules) {
  var html = productsRoute._renderConsolidatedFeaturesSection(items, modules || [], null, 'prod-1', 'csrf-tok', null, {});
  var scriptSrc = extractScript(html);
  var dom = new JSDOM('<!DOCTYPE html><html><body>' + html + '</body></html>', {
    runScripts: 'outside-only',
    url: 'http://localhost/products/prod-1'
  });
  dom.window.eval(scriptSrc);
  return dom;
}

function countFor(win, groupId) {
  var section = win.document.getElementById('a4-mod-' + groupId).closest('.a4-module-section');
  return section.querySelector('.a4-module-count').textContent;
}

(function() {
  // Two unclassified/no-epicName items -> both land in "Unclassified" (By
  // Module) and "Other features" (By Phase), one active, one already done --
  // matches the exact scenario the operator reported.
  var mixedItems = [
    { slug: 'active-one', name: 'Active feature one', health: 'green', stage: 'discovery' },
    { slug: 'done-one', name: 'Shipped feature one', health: 'green', stage: 'definition-of-done' }
  ];
  var allDoneItems = [
    { slug: 'done-a', name: 'Shipped A', health: 'green', stage: 'definition-of-done' },
    { slug: 'done-b', name: 'Shipped B', health: 'green', stage: 'definition-of-done' }
  ];

  test('T1 (AC1): a search filter narrowing visible rows reduces the group\'s count badge', function() {
    var dom = buildDom(mixedItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    // Start from an unfiltered baseline (Active only unchecked) so the search
    // itself is the only thing narrowing the group.
    var checkbox = win.document.getElementById('pvc-active-only-checkbox');
    checkbox.checked = false;
    win.pvcToggleActiveOnly(checkbox);
    assert.strictEqual(countFor(win, 'phase-other'), '(2)', 'sanity: unfiltered count is 2');
    win.pvcFilterBySearch('active');
    assert.strictEqual(countFor(win, 'phase-other'), '(1)', 'expected the count to drop to 1 matching row');
  });

  test('T2 (AC2): on initial render, with Active only checked by default, the count already reflects only active items', function() {
    var dom = buildDom(mixedItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    assert.strictEqual(countFor(win, 'phase-other'), '(1)', 'expected the default-active-only count to already exclude the done item');
  });

  test('T3 (AC3): a group whose every item is definition-of-done shows (0) once Active only is checked (its default)', function() {
    var dom = buildDom(allDoneItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    assert.strictEqual(countFor(win, 'phase-other'), '(0)');
  });

  test('T4 (AC4): clearing all filters (unchecking Active only) restores the original full count', function() {
    var dom = buildDom(mixedItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    assert.strictEqual(countFor(win, 'phase-other'), '(1)', 'sanity: default active-only count');
    var checkbox = win.document.getElementById('pvc-active-only-checkbox');
    checkbox.checked = false;
    win.pvcToggleActiveOnly(checkbox);
    assert.strictEqual(countFor(win, 'phase-other'), '(2)', 'expected the count to return to the full, unfiltered total');
  });

  test('T5 (AC5): the same group\'s count updates independently and correctly in both By Module and By Phase tabs', function() {
    var dom = buildDom(mixedItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    assert.strictEqual(countFor(win, 'unclassified'), '(1)', 'expected the By Module tab\'s Unclassified group count to reflect active-only too');
    assert.strictEqual(countFor(win, 'phase-other'), '(1)');
  });

  console.log('\n[pflx-s3] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
