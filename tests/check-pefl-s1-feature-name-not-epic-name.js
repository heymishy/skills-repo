'use strict';

// tests/check-pefl-s1-feature-name-not-epic-name.js
// pefl-s1 -- confirmed live in production: the By Phase (epic-grouped) tab's
// own group header already shows the epic name (e.g. "Phase 2 -- skills
// advance, web UI gate enforcement, and chain-hash trace"), but every child
// row underneath it (cdg.3-cdg.7) repeated that exact same text as its own
// sub-label -- pure duplication. Root cause: _renderPvcItemRow's subLabel
// fell back to item.epicName unconditionally. Fixed by threading a
// preferFeatureName parameter, only ever passed truthy by the By Phase
// tab's own row renderer, so it shows the item's parent feature name
// instead. Also makes By Phase the default tab whenever a product's real
// epic-group count is >1, not just when it has zero custom Modules.

var assert = require('assert');
var path = require('path');
var passed = 0; var failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var ROLLUP_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
var productsRoute = require(PRODUCTS_ROUTE_PATH);
var rollup = require(ROLLUP_PATH);

console.log('\n[pefl-s1] AC1 -- By Phase tab row sub-label shows feature name, not the repeated epic name');

test('By Phase row: preferFeatureName=true shows featureName, not epicName', function() {
  var item = { slug: 'cdg.3', name: 'cdg.3', health: 'green', epicName: 'Phase 2 — skills advance, web UI gate enforcement, and chain-hash trace', featureName: 'CLI Deterministic Governance — Executable Gate Enforcement and Tamper-Evident Audit Trail' };
  var html = productsRoute._renderPvcItemRow(item, false, true);
  assert.ok(html.indexOf('CLI Deterministic Governance') !== -1, 'expected the sub-label to contain the feature name');
  assert.ok(html.indexOf('Phase 2 — skills advance') === -1, 'expected the sub-label to NOT repeat the epic name');
});

console.log('\n[pefl-s1] AC2 -- By Module / All tabs row sub-label behaviour is completely unchanged (regression guard)');

test('By Module / All rows: default and checkbox call shapes still use epicName, unaffected by featureName', function() {
  var item = { slug: 'cdg.3', name: 'cdg.3', health: 'green', epicName: 'Phase 2 — skills advance, web UI gate enforcement, and chain-hash trace', featureName: 'CLI Deterministic Governance — Executable Gate Enforcement and Tamper-Evident Audit Trail' };
  var htmlDefault = productsRoute._renderPvcItemRow(item);
  var htmlCheckbox = productsRoute._renderPvcItemRow(item, true);
  assert.ok(htmlDefault.indexOf('Phase 2 — skills advance') !== -1, 'expected the default (1-arg) call to still show epicName');
  assert.ok(htmlDefault.indexOf('CLI Deterministic Governance') === -1, 'expected the default (1-arg) call to NOT show featureName');
  assert.ok(htmlCheckbox.indexOf('Phase 2 — skills advance') !== -1, 'expected the checkbox (2-arg) call to still show epicName');
  assert.ok(htmlCheckbox.indexOf('CLI Deterministic Governance') === -1, 'expected the checkbox (2-arg) call to NOT show featureName');
});

console.log('\n[pefl-s1] AC3 -- epic-group count > 1: By Phase is the default tab regardless of module count');

test('2-epic-group product with modules: By Phase is still the default tab', function() {
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var rollupRow = {
    health_counts: { green: 5, amber: 0, red: 0, unknown: 0 },
    taxonomy: { groups: [
      { epicSlug: 'e1', epicName: 'Phase 1', items: [{ slug: 'a.1' }] },
      { epicSlug: 'e2', epicName: 'Phase 2', items: [{ slug: 'a.2' }] }
    ], ungrouped: [] },
    test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null
  };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', modules, 'csrf-token', {}, {}, [], 0, null, false);
  assert.ok(/id="pvc-tab-phase" role="tab" aria-selected="true"/.test(html), 'expected By Phase tab to be aria-selected=true despite modules existing');
  assert.ok(/id="pvc-tab-panel-phase" class="pvc-tab-panel pvc-tab-panel--active"/.test(html), 'expected the By Phase panel to carry the active class');
  assert.ok(/id="pvc-tab-module" role="tab" aria-selected="false"/.test(html), 'expected By Module tab to NOT be the default when epic-group count > 1');
});

console.log('\n[pefl-s1] AC4 -- epic-group count <= 1: defaultTab logic unchanged from ppg-s1 (regression guard)');

test('0-epic-group, 0-module product: still defaults to By Phase (matches ppg-s1 AC3)', function() {
  var rollupRow = { health_counts: { green: 1, amber: 0, red: 0, unknown: 0 }, taxonomy: { groups: [], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', [], 'csrf-token', {}, {}, [], 0, null, false);
  assert.ok(/id="pvc-tab-phase" role="tab" aria-selected="true"/.test(html), 'expected By Phase to still be default (matches ppg-s1 AC3)');
});

test('1-epic-group, with-modules product: still defaults to By Module (matches ppg-s1 AC6)', function() {
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var rollupRow = { health_counts: { green: 1, amber: 0, red: 0, unknown: 0 }, taxonomy: { groups: [{ epicSlug: 'e1', epicName: 'Phase 1', items: [{ slug: 'a.1' }] }], ungrouped: [] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', modules, 'csrf-token', {}, {}, [], 0, null, false);
  assert.ok(/id="pvc-tab-module" role="tab" aria-selected="true"/.test(html), 'expected By Module to still be default when exactly 1 epic group exists (matches ppg-s1 AC6)');
});

console.log('\n[pefl-s1] AC5 -- computeTaxonomyRollup: featureName is additive, existing fields unaffected (regression guard)');

test('computeTaxonomyRollup: featureName added alongside unchanged slug/featureSlug for both object- and bare-string-shaped stories', function() {
  var pipelineState = {
    features: [{
      slug: 'x',
      name: 'Feature X Display Name',
      epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 'x.1' }, 'x.2'] }]
    }]
  };
  var result = rollup.computeTaxonomyRollup(pipelineState);
  var items = result.groups[0].items;
  assert.strictEqual(items[0].slug, 'x.1');
  assert.strictEqual(items[0].featureSlug, 'x');
  assert.strictEqual(items[0].featureName, 'Feature X Display Name');
  assert.strictEqual(items[1].slug, 'x.2');
  assert.strictEqual(items[1].featureSlug, 'x');
  assert.strictEqual(items[1].featureName, 'Feature X Display Name');
});

console.log('\n[pefl-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed > 0 ? 1 : 0;
