'use strict';

// tests/check-pflx-s2-default-active-only-filter.js -- pflx-s2
// Story: artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s2-default-active-only-feature-list.md
// Test plan: artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s2-test-plan.md
//
// Same "extract the real script, run it in real jsdom against a real
// render" technique as pflx-s1 / tests/check-icv-s1-ideate-canvas-turn2-render-fix.js.

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

(function() {
  var mixedItems = [
    { slug: 'active-one', name: 'Active feature one', health: 'green', stage: 'discovery' },
    { slug: 'active-two', name: 'Active feature two', health: 'green', stage: 'test-plan' },
    { slug: 'done-one', name: 'Shipped feature one', health: 'green', stage: 'definition-of-done' },
    { slug: 'done-two', name: 'Shipped feature two', health: 'green', stage: 'definition-of-done' }
  ];

  function itemsIn(win, panelId) {
    return Array.from(win.document.querySelectorAll('#' + panelId + ' .pvc-item'));
  }
  function findBySlug(items, slug) {
    var el = items.find(function(el) { return el.getAttribute('data-slug') === slug || (el.querySelector('a') && el.querySelector('a').getAttribute('href') === '/features/' + slug); });
    return el;
  }

  test('T1 (AC1): definition-of-done items are already hidden on initial render, before any interaction', function() {
    var dom = buildDom(mixedItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    var allPanelItems = itemsIn(win, 'pvc-tab-panel-all');
    var doneItems = allPanelItems.filter(function(el) { return el.getAttribute('data-active') === 'false'; });
    var activeItems = allPanelItems.filter(function(el) { return el.getAttribute('data-active') === 'true'; });
    assert.strictEqual(doneItems.length, 2, 'expected 2 definition-of-done items in the All tab');
    doneItems.forEach(function(el) { assert.strictEqual(el.hasAttribute('hidden'), true, 'expected a done item to be hidden by default'); });
    activeItems.forEach(function(el) { assert.strictEqual(el.hasAttribute('hidden'), false, 'expected an active item to be visible by default'); });
  });

  test('T2 (AC2): the Active only checkbox is checked by default', function() {
    var dom = buildDom(mixedItems.map(function(i) { return Object.assign({}, i); }));
    var checkbox = dom.window.document.getElementById('pvc-active-only-checkbox');
    assert.ok(checkbox, 'expected the Active only checkbox to be rendered');
    assert.strictEqual(checkbox.checked, true);
  });

  test('T3 (AC3): unchecking Active only reveals definition-of-done items', function() {
    var dom = buildDom(mixedItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    var checkbox = win.document.getElementById('pvc-active-only-checkbox');
    checkbox.checked = false;
    win.pvcToggleActiveOnly(checkbox);
    var allPanelItems = itemsIn(win, 'pvc-tab-panel-all');
    var doneItems = allPanelItems.filter(function(el) { return el.getAttribute('data-active') === 'false'; });
    doneItems.forEach(function(el) { assert.strictEqual(el.hasAttribute('hidden'), false, 'expected a done item to become visible once Active only is unchecked'); });
  });

  test('T4 (AC4): re-checking Active only hides definition-of-done items again', function() {
    var dom = buildDom(mixedItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    var checkbox = win.document.getElementById('pvc-active-only-checkbox');
    checkbox.checked = false;
    win.pvcToggleActiveOnly(checkbox);
    checkbox.checked = true;
    win.pvcToggleActiveOnly(checkbox);
    var allPanelItems = itemsIn(win, 'pvc-tab-panel-all');
    var doneItems = allPanelItems.filter(function(el) { return el.getAttribute('data-active') === 'false'; });
    doneItems.forEach(function(el) { assert.strictEqual(el.hasAttribute('hidden'), true, 'expected a done item to be hidden again once Active only is re-checked'); });
  });

  test('T5 (AC5): an active item\'s visibility is unaffected by toggling Active only', function() {
    var dom = buildDom(mixedItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    var checkbox = win.document.getElementById('pvc-active-only-checkbox');
    var allPanelItems = itemsIn(win, 'pvc-tab-panel-all');
    var activeItems = allPanelItems.filter(function(el) { return el.getAttribute('data-active') === 'true'; });
    checkbox.checked = false;
    win.pvcToggleActiveOnly(checkbox);
    activeItems.forEach(function(el) { assert.strictEqual(el.hasAttribute('hidden'), false); });
    checkbox.checked = true;
    win.pvcToggleActiveOnly(checkbox);
    activeItems.forEach(function(el) { assert.strictEqual(el.hasAttribute('hidden'), false); });
  });

  test('T6 (AC6): the active-only default applies consistently across By Module, By Phase, and All tabs', function() {
    var dom = buildDom(mixedItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    ['pvc-tab-panel-module', 'pvc-tab-panel-phase', 'pvc-tab-panel-all'].forEach(function(panelId) {
      var items = itemsIn(win, panelId);
      var doneItems = items.filter(function(el) { return el.getAttribute('data-active') === 'false'; });
      assert.strictEqual(doneItems.length, 2, 'expected 2 done items in ' + panelId);
      doneItems.forEach(function(el) { assert.strictEqual(el.hasAttribute('hidden'), true, 'expected done items hidden by default in ' + panelId); });
    });
  });

  console.log('\n[pflx-s2] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
