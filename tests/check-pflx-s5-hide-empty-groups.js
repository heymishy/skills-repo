'use strict';

// tests/check-pflx-s5-hide-empty-groups.js -- pflx-s5
// Story: artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s5-hide-empty-groups.md
// Test plan: artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s5-test-plan.md
//
// Same "extract the real script, run it in real jsdom against a real
// render" technique as pflx-s1/s2/s3 / tests/check-icv-s1-ideate-canvas-turn2-render-fix.js.

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

function section(win, groupId) {
  var body = win.document.getElementById('a4-mod-' + groupId);
  return body ? body.closest('.a4-module-section') : null;
}

(function() {
  var mixedItems = [
    { slug: 'active-one', name: 'Active feature one', health: 'green', stage: 'discovery' },
    { slug: 'done-one', name: 'Shipped feature one', health: 'green', stage: 'definition-of-done' }
  ];
  var allDoneItems = [
    { slug: 'done-a', name: 'Shipped A', health: 'green', stage: 'definition-of-done' },
    { slug: 'done-b', name: 'Shipped B', health: 'green', stage: 'definition-of-done' }
  ];
  var allActiveItems = [
    { slug: 'active-a', name: 'Active A', health: 'green', stage: 'discovery' },
    { slug: 'active-b', name: 'Active B', health: 'green', stage: 'test-plan' }
  ];

  test('T1 (AC1): a group left at 0 by the active-only default is hidden entirely', function() {
    var dom = buildDom(allDoneItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    var sec = section(win, 'phase-other');
    assert.ok(sec, 'expected the Other features phase group to exist');
    assert.strictEqual(sec.hasAttribute('hidden'), true, 'expected an all-done group to be hidden under the active-only default');
  });

  test('T2 (AC2): unchecking Active only restores the group above 0 and makes it visible again', function() {
    var dom = buildDom(allDoneItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    var sec = section(win, 'phase-other');
    assert.strictEqual(sec.hasAttribute('hidden'), true, 'sanity: hidden by default');
    var checkbox = win.document.getElementById('pvc-active-only-checkbox');
    checkbox.checked = false;
    win.pvcToggleActiveOnly(checkbox);
    assert.strictEqual(sec.hasAttribute('hidden'), false, 'expected the group to become visible once Active only is unchecked');
  });

  test('T3 (AC3): every group empty under Active only shows a "No active features match" message', function() {
    var dom = buildDom(allDoneItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    var phasePanel = win.document.getElementById('pvc-tab-panel-phase');
    var empty = phasePanel.querySelector('.pvc-empty-state');
    assert.ok(empty, 'expected an empty-state element to exist');
    assert.strictEqual(empty.hidden, false, 'expected the empty-state message to be visible when every group is hidden');
    assert.strictEqual(empty.textContent, 'No active features match.');
  });

  test('T3b (AC3, regression guard): the empty-state message stays hidden when at least one group has visible items', function() {
    var dom = buildDom(mixedItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    var phasePanel = win.document.getElementById('pvc-tab-panel-phase');
    var empty = phasePanel.querySelector('.pvc-empty-state');
    assert.ok(empty, 'expected an empty-state element to exist (created but hidden)');
    assert.strictEqual(empty.hidden, true, 'expected the empty-state message to stay hidden when a group still has visible items');
  });

  test('T4 (AC4): the same group hides/shows independently and correctly in both By Module and By Phase tabs', function() {
    var dom = buildDom(allDoneItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    var moduleSec = section(win, 'unclassified');
    var phaseSec = section(win, 'phase-other');
    assert.strictEqual(moduleSec.hasAttribute('hidden'), true, 'expected the By Module tab\'s group to be hidden too');
    assert.strictEqual(phaseSec.hasAttribute('hidden'), true);
  });

  test('T5 (AC5): a group with at least one visible item is never hidden, and its count badge is unaffected', function() {
    var dom = buildDom(allActiveItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    var sec = section(win, 'phase-other');
    assert.strictEqual(sec.hasAttribute('hidden'), false, 'expected a group with active items to stay visible');
    assert.strictEqual(sec.querySelector('.a4-module-count').textContent, '(2)');
  });

  console.log('\n[pflx-s5] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
