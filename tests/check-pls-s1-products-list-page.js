'use strict';
// pls-s1 -- a products list page, so "See all products" shows all products.
// Plain Node script. Run: node tests/check-pls-s1-products-list-page.js
// Story: artefacts/2026-11-15-products-list-page/stories/pls-s1-products-list-page.md
// Test plan: artefacts/2026-11-15-products-list-page/test-plans/pls-s1-test-plan.md

process.env.NODE_ENV = 'test';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const productsRoutes = require('../src/web-ui/routes/products');
const htmlShell = require('../src/web-ui/utils/html-shell');
const SERVER_SRC = path.join(__dirname, '..', 'src', 'web-ui', 'server.js');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function mockRes() {
  return { _status: null, _body: '', writeHead(c) { this._status = c; }, end(b) { this._body = b || ''; } };
}
// Mock pool mirroring the REAL queries in getProductsNavSummary (routes/products.js): products by tenant_id (the
// params[0] filter is what makes tenant isolation provable by the data), journeys by product_id, no-product journeys.
function makePool(byTenant, journeysByProduct) {
  return {
    query: async function (sql, params) {
      if (sql.includes('FROM products')) { return { rows: (byTenant[params && params[0]] || []).slice() }; }
      if (sql.includes('product_id IS NULL')) { return { rows: [] }; }
      if (sql.includes('WHERE product_id = $1')) {
        return { rows: (journeysByProduct[params && params[0]] || []).map((j) => Object.assign({ updated_at: '2026-08-01' }, j)) };
      }
      return { rows: [] };
    }
  };
}
const DATA = {
  'tenant-a': [
    { product_id: 'pa1', name: 'Alpha', created_at: '2026-01-03' },
    { product_id: 'pa2', name: 'Beta', created_at: '2026-01-02' },
    { product_id: 'pa3', name: 'Gamma', created_at: '2026-01-01' }
  ],
  'tenant-b': [{ product_id: 'pb1', name: 'BravoSecretProduct', created_at: '2026-01-01' }],
  'tenant-empty': []
};
const JOURNEYS = { pa1: [{ journey_id: 'j1' }, { journey_id: 'j2' }, { journey_id: 'j3' }], pa2: [{ journey_id: 'j4' }], pb1: [{ journey_id: 'j9' }] };
async function getPage(tenantId, data) {
  const req = { session: { tenantId, login: 'tester' }, query: {} };
  const res = mockRes();
  await productsRoutes.handleGetProductsList(req, res, null, makePool(data || DATA, JOURNEYS));
  return res;
}
const hasHex = (s) => /#[0-9A-Fa-f]{3,8}\b/.test(s);
// The shell's own entry point (renderSidebar is internal): render a page with one product in the nav.
function shellFor(active) {
  return htmlShell.renderShell({ title: 'x', bodyContent: '<p>x</p>', user: { login: 'tester' }, active, isAdmin: false,
    products: [{ productId: 'p1', name: 'Alpha', journeyCount: 1 }], activeProductId: null, noProductJourneyCount: 0 });
}

test('T1 the page lists every product of the tenant with its count, date and a link to its page', async () => {
  const res = await getPage('tenant-a');
  assert.strictEqual(res._status, 200);
  ['Alpha', 'Beta', 'Gamma'].forEach((n) => assert.ok(res._body.indexOf(n) !== -1, 'missing ' + n));
  ['pa1', 'pa2', 'pa3'].forEach((id) => assert.ok(res._body.indexOf('href="/products/' + id + '"') !== -1, 'missing link for ' + id));
  assert.ok(res._body.indexOf('3 features') !== -1, 'Alpha has 3 journeys');
  assert.ok(res._body.indexOf('1 feature<') !== -1 || res._body.indexOf('1 feature ') !== -1 || /1 feature(?!s)/.test(res._body), 'Beta has 1 journey');
  assert.ok(res._body.indexOf('2026-08-01') !== -1, 'the last-updated date is shown');
  const fragment = productsRoutes._renderProductsList([
    { productId: 'x1', name: 'One', journeyCount: 2, lastUpdated: '2026-08-01' },
    { productId: 'x2', name: 'Two', journeyCount: 0, lastUpdated: null },
    { productId: 'x3', name: 'Three', journeyCount: 1, lastUpdated: '2026-08-02' }
  ]);
  assert.strictEqual((fragment.match(/href="\/products\//g) || []).length, 3, 'exactly one link per product in the list body');
});

test('T2 a tenant with no products sees an empty state with a create link', async () => {
  const res = await getPage('tenant-empty');
  assert.strictEqual(res._status, 200);
  assert.ok(res._body.indexOf('No products yet') !== -1);
  assert.ok(/href="\/products\/new"[^>]*>[^<]*Create your first product/.test(res._body), 'create link to /products/new');
});

test('T3 another tenant\'s products never appear anywhere in the response', async () => {
  const res = await getPage('tenant-a');
  assert.ok(res._body.indexOf('BravoSecretProduct') === -1, 'tenant B name leaked');
  assert.ok(res._body.indexOf('pb1') === -1, 'tenant B id leaked');
  const resB = await getPage('tenant-b');
  assert.ok(resB._body.indexOf('BravoSecretProduct') !== -1);
  assert.ok(resB._body.indexOf('Alpha') === -1 && resB._body.indexOf('pa1') === -1, 'tenant A leaked into B');
});

test('T4 product names are HTML-escaped', async () => {
  const evil = { 'tenant-x': [{ product_id: 'px1', name: '<img src=x onerror=1>', created_at: '2026-01-01' }] };
  const res = await getPage('tenant-x', evil);
  assert.ok(res._body.indexOf('&lt;img') !== -1, 'name shown as text');
  assert.ok(res._body.indexOf('<img src=x') === -1, 'name must never become a tag');
});

test('T5 See all products links to /products; the List and Board links keep pointing at the dashboard', () => {
  const html = shellFor('dashboard');
  const m =/<a href="([^"]*)" class="sw-see-all-products[^"]*"[^>]*>See all products/.exec(html);
  assert.ok(m, 'See all products link present');
  assert.strictEqual(m[1], '/products');
  assert.ok(/<a href="\/dashboard" class="sw-nav-subitem">List<\/a>/.test(html), 'List still goes to /dashboard');
  assert.ok(/<a href="\/dashboard\?view=board" class="sw-nav-subitem">Board<\/a>/.test(html), 'Board still goes to /dashboard?view=board');
});

test('T6 the new page keeps the sidebar and marks See all products active', async () => {
  const res = await getPage('tenant-a');
  assert.ok(res._body.indexOf('aria-label="Products"') !== -1, 'the Products sidebar section is present');
  assert.ok(/class="sw-see-all-products[^"]*sw-see-all-products--active[^"]*"/.test(res._body) || /sw-see-all-products--active/.test(res._body), 'See all products carries the active class');
  assert.ok(/aria-current="page"[^>]*>See all products|sw-see-all-products[^>]*aria-current="page"/.test(res._body), 'aria-current on the active link');
  const other = shellFor('dashboard');
  assert.ok(other.indexOf('sw-see-all-products--active') === -1, 'not active on other pages');
});

test('T7 the new list markup uses no hard-coded hex colours', () => {
  const fragment = productsRoutes._renderProductsList([{ productId: 'x1', name: 'One', journeyCount: 2, lastUpdated: '2026-08-01' }]);
  assert.ok(!hasHex(fragment), 'found a hex colour in: ' + fragment.slice(0, 120));
  assert.ok(!hasHex(productsRoutes._renderProductsList([])), 'empty state must not use hex colours either');
});

test('T8 GET /products is registered in server.js behind authGuard and the handler is imported', () => {
  const src = fs.readFileSync(SERVER_SRC, 'utf8').replace(/\r\n/g, '\n');
  const start = src.indexOf("pathname === '/products' && req.method === 'GET'");
  assert.ok(start !== -1, 'route branch exists');
  const end = src.indexOf('} else if', start);
  const branch = src.slice(start, end);
  assert.ok(branch.indexOf('authGuard(') !== -1, 'wrapped in authGuard');
  assert.ok(branch.indexOf('handleGetProductsList(') !== -1, 'calls handleGetProductsList');
  assert.ok(/const \{[^}]*handleGetProductsList[^}]*\} = require\('\.\/routes\/products'\)/.test(src), 'handler imported from routes/products');
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[pls-s1-products-list-page] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
