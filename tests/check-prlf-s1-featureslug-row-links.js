'use strict';

// tests/check-prlf-s1-featureslug-row-links.js
// prlf-s1 -- confirmed real slug collision: p3.3 exists as two different
// stories in two different features (2026-04-14-skills-platform-phase3's
// own "Platform Structural Integrity" epic, and 2026-06-22-wuce-multi-
// tenancy's "Phase 3 -- State Persistence" epic). _renderPvcItemRow built
// every row's link from the raw story slug even though computeTaxonomyRollup
// (fal-s1/pefl-s1) already resolves and carries the correct featureSlug on
// every epic-nested item. Fixed by using item.featureSlug when present,
// falling back to item.slug for top-level items (which have no featureSlug
// field -- their own slug already IS the real feature slug).

var assert = require('assert');
var path = require('path');
var passed = 0; var failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var productsRoute = require(PRODUCTS_ROUTE_PATH);

console.log('\n[prlf-s1] AC1 -- epic-nested item: row link uses featureSlug, not slug');

test('epic-nested item with differing slug/featureSlug: href uses featureSlug', function() {
  var item = { slug: 'x.1', featureSlug: 'y-feature', name: 'x.1', health: 'green' };
  var html = productsRoute._renderPvcItemRow(item);
  assert.ok(/href="\/features\/y-feature"/.test(html), 'expected href to use featureSlug, got: ' + html.slice(0, 200));
  assert.ok(!/href="\/features\/x\.1"/.test(html), 'expected href to NOT use the raw story slug');
});

console.log('\n[prlf-s1] AC2 -- top-level item: row link falls back to slug (regression guard)');

test('top-level item with no featureSlug: href falls back to slug', function() {
  var item = { slug: 'top-level-feature', name: 'Top Level Feature', health: 'green' };
  var html = productsRoute._renderPvcItemRow(item);
  assert.ok(/href="\/features\/top-level-feature"/.test(html), 'expected href to fall back to slug, got: ' + html.slice(0, 200));
});

console.log('\n[prlf-s1] AC3 -- real p3.3 collision: link resolves to the correct, unambiguous feature');

test('real p3.3 collision fixture: href resolves to the correct feature, not the ambiguous story slug', function() {
  var item = { slug: 'p3.3', featureSlug: '2026-04-14-skills-platform-phase3', name: 'p3.3', health: 'green' };
  var html = productsRoute._renderPvcItemRow(item);
  assert.ok(/href="\/features\/2026-04-14-skills-platform-phase3"/.test(html), 'expected href to resolve to the real, unambiguous feature slug, got: ' + html.slice(0, 200));
  assert.ok(!/href="\/features\/p3\.3"/.test(html), 'expected href to NOT use the ambiguous, colliding story slug');
});

console.log('\n[prlf-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed > 0 ? 1 : 0;
