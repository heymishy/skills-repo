'use strict';

// tests/check-pflx-s1-auto-expand-search-match.js -- pflx-s1
// Story: artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s1-auto-expand-collapsed-groups-on-search-match.md
// Test plan: artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s1-test-plan.md
//
// Extracts the real generated client script from a real
// _renderConsolidatedFeaturesSection() render and evaluates it in real jsdom
// against the real rendered DOM -- the same technique established by
// tests/check-icv-s1-ideate-canvas-turn2-render-fix.js (not a source-string
// regex check).

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

function group(win, id) {
  return win.document.getElementById('a4-mod-' + id);
}
function headerFor(win, body) {
  return win.document.querySelector('[aria-controls="' + body.id + '"]');
}

(function() {
  // Two unclassified/no-epicName items -> both land in "Unclassified"
  // (By Module tab) and "Other features" (By Phase tab), each its own
  // collapsed group, per groupItemsByModule/groupItemsByPhase's own
  // documented zero-module/no-epicName fallback behaviour.
  var baseItems = [
    { slug: 'multi-user-role-sessions', name: 'Multi-User Role Sessions', health: 'green', stage: 'discovery' },
    { slug: 'unrelated-feature', name: 'Totally Different Feature', health: 'green', stage: 'discovery' }
  ];

  test('T1 (AC1): a search match inside a collapsed group expands it and sets aria-expanded=true', function() {
    var dom = buildDom(baseItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    win.pvcFilterBySearch('multi');
    var phaseGroup = group(win, 'phase-other');
    assert.ok(phaseGroup, 'expected the "Other features" phase group to exist');
    assert.ok(!phaseGroup.classList.contains('a4-module-body--collapsed'), 'expected the group to be expanded after a matching search');
    var header = headerFor(win, phaseGroup);
    assert.strictEqual(header.getAttribute('aria-expanded'), 'true');
  });

  test('T2 (AC2): clearing the search re-collapses a group this logic auto-expanded', function() {
    var dom = buildDom(baseItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    win.pvcFilterBySearch('multi');
    var phaseGroup = group(win, 'phase-other');
    assert.ok(!phaseGroup.classList.contains('a4-module-body--collapsed'), 'sanity: expanded after search');
    win.pvcFilterBySearch('');
    assert.ok(phaseGroup.classList.contains('a4-module-body--collapsed'), 'expected the group to re-collapse once search is cleared');
    assert.strictEqual(phaseGroup.hasAttribute('data-auto-expanded'), false, 'expected the auto-expanded marker to be removed');
    var header = headerFor(win, phaseGroup);
    assert.strictEqual(header.getAttribute('aria-expanded'), 'false');
  });

  test('T3 (AC3): a group expanded manually (not by search) stays expanded after a later search is cleared', function() {
    var dom = buildDom(baseItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    var phaseGroup = group(win, 'phase-other');
    // Simulate the operator manually opening it via the real click handler.
    var header = headerFor(win, phaseGroup);
    win.a4ToggleModule(header);
    assert.ok(!phaseGroup.classList.contains('a4-module-body--collapsed'), 'sanity: manually expanded');
    assert.strictEqual(phaseGroup.hasAttribute('data-auto-expanded'), false, 'sanity: no auto-expanded marker from a manual toggle');

    win.pvcFilterBySearch('multi');
    assert.strictEqual(phaseGroup.hasAttribute('data-auto-expanded'), false, 'expected no auto-expanded marker to be added to an already-expanded group');

    win.pvcFilterBySearch('');
    assert.ok(!phaseGroup.classList.contains('a4-module-body--collapsed'), 'expected the manually-opened group to remain expanded after search clears');
  });

  test('T4 (AC4): a group with zero matching rows keeps its collapse state completely unchanged', function() {
    var dom = buildDom(baseItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    var phaseGroup = group(win, 'phase-other');
    assert.ok(phaseGroup.classList.contains('a4-module-body--collapsed'), 'sanity: starts collapsed');
    win.pvcFilterBySearch('zzz-no-such-feature-zzz');
    assert.ok(phaseGroup.classList.contains('a4-module-body--collapsed'), 'expected the group to remain collapsed when nothing inside it matches');
    assert.strictEqual(phaseGroup.hasAttribute('data-auto-expanded'), false);
  });

  test('T5 (AC5): a search match expands the equivalent group independently in both the By Module and By Phase tabs', function() {
    var dom = buildDom(baseItems.map(function(i) { return Object.assign({}, i); }));
    var win = dom.window;
    win.pvcFilterBySearch('multi');
    var moduleGroup = group(win, 'unclassified');
    var phaseGroup = group(win, 'phase-other');
    assert.ok(moduleGroup, 'expected the By Module tab\'s Unclassified group to exist');
    assert.ok(phaseGroup, 'expected the By Phase tab\'s Other features group to exist');
    assert.ok(!moduleGroup.classList.contains('a4-module-body--collapsed'), 'expected the By Module tab\'s group to expand too');
    assert.ok(!phaseGroup.classList.contains('a4-module-body--collapsed'), 'expected the By Phase tab\'s group to expand');
  });

  console.log('\n[pflx-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
