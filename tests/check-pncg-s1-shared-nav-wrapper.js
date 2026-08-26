'use strict';

// tests/check-pncg-s1-shared-nav-wrapper.js — AC1 unit tests for pncg-s1's
// new renderShellWithNav helper.
// Story: artefacts/2026-08-26-products-nav-coverage-gap/stories/pncg-s1-shared-nav-wrapper-and-full-coverage.md

var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function assertTrue(condition, label) {
  if (!condition) { throw new Error(label); }
}

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');

function makeMockPool(products) {
  return {
    query: async function(sql, params) {
      if (sql.includes('FROM products')) { return { rows: products }; }
      if (sql.includes('product_id IS NULL')) { return { rows: [] }; }
      if (sql.includes('WHERE product_id = $1')) { return { rows: [] }; }
      return { rows: [] };
    }
  };
}

(async function() {
  var productsRoute = require(PRODUCTS_ROUTE_PATH);

  await test('renderShellWithNavIncludesProductsSection (AC1)', async function() {
    var pool = makeMockPool([{ product_id: 'p1', name: 'Acme', created_at: '2026-01-01' }]);
    var html = await productsRoute.renderShellWithNav(pool, 'tenant-1', {
      title: 'Test', bodyContent: '<p>hi</p>', user: { login: 'x' }, active: 'test'
    });
    assertTrue(html.indexOf('class="sw-product-nav-list"') !== -1, 'expected the Products nav section to be present');
    assertTrue(html.indexOf('Acme') !== -1, 'expected the product name to appear');
  });

  await test('renderShellWithNavPreservesOtherOpts (AC1)', async function() {
    var pool = makeMockPool([]);
    var html = await productsRoute.renderShellWithNav(pool, 'tenant-1', {
      title: 'Distinctive Title XYZ', bodyContent: '<p>distinctive body content</p>', user: { login: 'x' }, active: 'test'
    });
    assertTrue(html.indexOf('Distinctive Title XYZ') !== -1, 'expected the title to pass through unchanged');
    assertTrue(html.indexOf('distinctive body content') !== -1, 'expected the body content to pass through unchanged');
  });

  await test('renderShellWithNavRespectsExplicitActiveProductId (AC1)', async function() {
    var pool = makeMockPool([
      { product_id: 'p1', name: 'Product One', created_at: '2026-01-01' },
      { product_id: 'p2', name: 'Product Two', created_at: '2026-01-02' }
    ]);
    var html = await productsRoute.renderShellWithNav(pool, 'tenant-1', {
      title: 'Test', bodyContent: '', user: { login: 'x' }, active: 'test', activeProductId: 'p2'
    });
    var p2Row = html.slice(html.indexOf('Product Two') - 300, html.indexOf('Product Two') + 50);
    assertTrue(p2Row.indexOf('sw-product-nav-item--active') !== -1, 'expected Product Two\'s nav row to carry the active class');
    var p1Row = html.slice(html.indexOf('Product One') - 300, html.indexOf('Product One') + 50);
    assertTrue(p1Row.indexOf('sw-product-nav-item--active') === -1, 'expected Product One\'s nav row NOT to carry the active class');
  });

  console.log('\n[pncg-s1] Wrapper results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
