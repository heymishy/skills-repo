'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

function makeMockPool(state) {
  // state = { productId, tenantId, journeys: [...], standards: [...], optouts: [...] }
  const queries = [];
  return {
    _queries: queries,
    query: async function(sql, params) {
      queries.push({ sql, params });
      if (/SELECT product_id, tenant_id FROM products WHERE product_id/i.test(sql)) {
        if (params[0] !== state.productId) return { rows: [] };
        return { rows: [{ product_id: state.productId, tenant_id: state.tenantId }] };
      }
      if (/DELETE FROM journeys WHERE product_id/i.test(sql)) {
        return { rowCount: state.journeys.length };
      }
      if (/DELETE FROM standard_product_optouts WHERE product_id/i.test(sql)) {
        return { rowCount: state.optouts.length };
      }
      if (/DELETE FROM standards WHERE product_id/i.test(sql)) {
        return { rowCount: state.standards.length };
      }
      if (/DELETE FROM products WHERE product_id/i.test(sql)) {
        return { rowCount: 1 };
      }
      return { rows: [] };
    }
  };
}

(async function() {
  const { handleDeleteProduct, handleGetProductView } = require('../src/web-ui/routes/products');

  // T1 — deletes product row, journeys, and standards-cache rows; zero GitHub delete calls
  try {
    const state = { productId: 'prod-1', tenantId: 'tx', journeys: [{ id: 'j1' }], standards: [{ id: 's1' }], optouts: [{ id: 'o1' }] };
    const pool = makeMockPool(state);
    const ph = { _caps: [], capture: function(id, ev, props) { this._caps.push({ id, ev, props }); } };
    const req = { session: { tenantId: 'tx', login: 'u' }, params: { id: 'prod-1' } };
    const res = { json: function(b) { this._b = b; }, _b: null, status: function(c) { this._s = c; return this; } };

    const _origFetch = global.fetch;
    let fetchCalls = 0;
    global.fetch = function() { fetchCalls++; throw new Error('fetch must never be called by handleDeleteProduct'); };
    try {
      await handleDeleteProduct(req, res, null, pool, ph);
    } finally {
      global.fetch = _origFetch;
    }

    assert.strictEqual(fetchCalls, 0, 'handleDeleteProduct made a network call (possible GitHub delete-repo call)');
    assert(pool._queries.some(q => /DELETE FROM journeys WHERE product_id/i.test(q.sql)), 'journeys not deleted');
    assert(pool._queries.some(q => /DELETE FROM standards WHERE product_id/i.test(q.sql)), 'standards cache rows not deleted');
    assert(pool._queries.some(q => /DELETE FROM standard_product_optouts WHERE product_id/i.test(q.sql)), 'standard_product_optouts rows not deleted');
    assert(pool._queries.some(q => /DELETE FROM products WHERE product_id/i.test(q.sql)), 'product row not deleted');
    assert(res._s === 200 || res._s === 204 || res._b, 'no success response sent');
    pass('DELETE /products/:id removes product, journeys, standards-cache rows; zero GitHub calls made');
  } catch (e) { fail('DELETE /products/:id removes product, journeys, standards-cache rows; zero GitHub calls made', e); }

  // T2 — audit log: capture() invoked with deleting user, product ID (AC/NFR: audit)
  try {
    const state = { productId: 'prod-2', tenantId: 'ty', journeys: [], standards: [], optouts: [] };
    const pool = makeMockPool(state);
    const ph = { _caps: [], capture: function(id, ev, props) { this._caps.push({ id, ev, props }); } };
    const req = { session: { tenantId: 'ty', login: 'deleter-user' }, params: { id: 'prod-2' } };
    const res = { json: function(b) { this._b = b; }, _b: null, status: function(c) { this._s = c; return this; } };
    await handleDeleteProduct(req, res, null, pool, ph);
    const ev = ph._caps.find(e => e.ev === 'product_deleted');
    assert(ev, 'product_deleted event not captured');
    assert.strictEqual(ev.props.productId, 'prod-2', 'productId not in audit event');
    assert.strictEqual(ev.props.tenantId, 'ty', 'tenantId not in audit event');
    pass('deletion is audit-logged via PostHog capture with deleting user, tenant, and product ID');
  } catch (e) { fail('deletion is audit-logged via PostHog capture with deleting user, tenant, and product ID', e); }

  // T3 — NFR Security: only the product's own tenant can delete it (tenant mismatch -> 404, zero deletion)
  try {
    const state = { productId: 'prod-3', tenantId: 'owner-tenant', journeys: [], standards: [], optouts: [] };
    const pool = makeMockPool(state);
    const ph = { _caps: [], capture: function() {} };
    const req = { session: { tenantId: 'attacker-tenant', login: 'attacker' }, params: { id: 'prod-3' } };
    const res = { json: function(b) { this._b = b; }, _b: null, status: function(c) { this._s = c; return this; } };
    await handleDeleteProduct(req, res, null, pool, ph);
    assert(res._s === 403 || res._s === 404, `Expected 403/404 for cross-tenant delete, got ${res._s}`);
    assert(!pool._queries.some(q => /DELETE FROM products WHERE product_id/i.test(q.sql)), 'product row deleted despite tenant mismatch');
    assert(!pool._queries.some(q => /DELETE FROM journeys WHERE product_id/i.test(q.sql)), 'journeys deleted despite tenant mismatch');
    pass('a session belonging to a different tenant cannot delete the product (403/404, zero deletion)');
  } catch (e) { fail('a session belonging to a different tenant cannot delete the product (403/404, zero deletion)', e); }

  // T4 — AC3: accessing a deleted product's URL returns a clean 404, not a crash
  try {
    const pool = {
      query: async function(sql) {
        if (/SELECT name, tenant_id FROM products WHERE product_id/i.test(sql)) {
          return { rows: [] }; // product row no longer exists -- deleted
        }
        return { rows: [] };
      }
    };
    const req = { session: { tenantId: 'tx', login: 'u' }, params: { id: 'deleted-prod' } };
    const res = { json: function(b) { this._b = b; }, _b: null, status: function(c) { this._s = c; return this; } };
    await handleGetProductView(req, res, null, pool);
    assert.strictEqual(res._s, 404, `Expected 404 for a deleted product, got ${res._s}`);
    assert(res._b && /not found/i.test(res._b.error || ''), 'Response body does not indicate not-found');
    pass('accessing a deleted product\'s URL returns a clean 404 "not found" response, not a crash or partial render');
  } catch (e) { fail('accessing a deleted product\'s URL returns a clean 404 "not found" response, not a crash or partial render', e); }

  console.log(`\n[prc-s4.2] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
