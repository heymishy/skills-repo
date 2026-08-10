'use strict';
// check-smug-s1-standards-tab-and-query-fix.js — unit/integration tests for smug-s1
// (standards management had a fully-built backend but no way to reach it by
// clicking anything, plus a real data-correctness gap in standardsList's own
// query -- never included org-promoted standards from a different product,
// never excluded opted-out ones).
//
// Story:      artefacts/2026-08-10-standards-management-ui-gap/stories/smug-s1-standards-tab-and-query-fix.md
// Test plan:  artefacts/2026-08-10-standards-management-ui-gap/test-plans/smug-s1-test-plan.md
//
// Coverage:
//   AC1, AC2, AC3 (integration) — Standards tab present, lists own + org-promoted, excludes opted-out
//   AC4 (integration)           — Promote-to-org calls the real endpoint
//   AC5 (integration)           — Opt-out calls the real endpoint
//   AC6 (unit)                  — standardsList/fetchStandardsForProduct matches setStandardsAdapter's semantics

const assert = require('assert');

function makeMockPool(products, standards, optouts) {
  return {
    _ops: [],
    query: async function(sql, params) {
      this._ops.push({ sql, params });
      if (/SELECT tenant_id FROM products WHERE product_id/i.test(sql) || /SELECT name, tenant_id FROM products WHERE product_id/i.test(sql)) {
        const pid = params && params[0];
        const row = (products || []).find(p => p.product_id === pid);
        return { rows: row ? [row] : [] };
      }
      if (/SELECT standard_id, product_id, name, visibility, created_at FROM standards/i.test(sql)) {
        const pid = params && params[0];
        const orgId = params && params[1];
        const rows = (standards || []).filter(function(s) {
          const ownedByProduct = s.product_id === pid;
          const orgPromoted = s.visibility === 'org' && s.org_id === orgId;
          if (!ownedByProduct && !orgPromoted) { return false; }
          const optedOut = (optouts || []).some(function(o) { return o.standard_id === s.standard_id && o.product_id === pid; });
          return !optedOut;
        });
        rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return { rows };
      }
      if (/SELECT.*FROM standards WHERE standard_id/i.test(sql)) {
        const sid = params && params[0];
        const row = (standards || []).find(s => s.standard_id === sid);
        return { rows: row ? [row] : [] };
      }
      if (/UPDATE standards SET visibility/i.test(sql)) { return { rows: [], rowCount: 1 }; }
      if (/INSERT INTO standard_product_optouts/i.test(sql)) { return { rows: [], rowCount: 1 }; }
      if (/DELETE FROM standard_product_optouts/i.test(sql)) { return { rows: [], rowCount: 1 }; }
      return { rows: [] };
    }
  };
}

function makeRawRes() {
  const res = { _statusCode: null, _headers: {}, _body: null };
  res.writeHead = function(c, h) { this._statusCode = c; if (h) Object.assign(this._headers, h); return this; };
  res.end = function(b) { if (b != null) this._body = b; };
  return res;
}

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { standardsList, standardsPromote, optoutPost, fetchStandardsForProduct } = require('../src/web-ui/routes/standards');
  const { handleGetProductStandardsTab } = require('../src/web-ui/routes/products');

  const products = [
    { product_id: 'p1', name: 'Product One', tenant_id: 'org-1' },
    { product_id: 'p2', name: 'Product Two', tenant_id: 'org-1' }
  ];
  // p1 owns std-own (not promoted); p2 owns std-promoted, which IS org-promoted
  // (so it should appear in p1's list too); p2 also owns std-opted-out, also
  // org-promoted, but p1 has opted out of it (so it must NOT appear for p1).
  const standards = [
    { standard_id: 'std-own', product_id: 'p1', org_id: 'org-1', name: 'Own Standard', visibility: 'product', created_at: new Date(2026, 0, 1) },
    { standard_id: 'std-promoted', product_id: 'p2', org_id: 'org-1', name: 'Promoted Standard', visibility: 'org', created_at: new Date(2026, 0, 2) },
    { standard_id: 'std-opted-out', product_id: 'p2', org_id: 'org-1', name: 'Opted-Out Standard', visibility: 'org', created_at: new Date(2026, 0, 3) }
  ];
  const optouts = [{ standard_id: 'std-opted-out', product_id: 'p1' }];

  // ── AC6 (unit): fetchStandardsForProduct includes org-promoted, excludes opted-out ──
  try {
    const pool = makeMockPool(products, standards, optouts);
    const rows = await fetchStandardsForProduct(pool, 'p1', 'org-1');
    const ids = rows.map(r => r.standard_id).sort();
    assert.deepStrictEqual(ids, ['std-own', 'std-promoted'], `Expected [std-own, std-promoted], got ${JSON.stringify(ids)}`);
    assert(!ids.includes('std-opted-out'), 'Opted-out standard must not appear');
    pass('standardsList_includesOrgPromoted_excludesOptedOut (via fetchStandardsForProduct)');
  } catch (e) { fail('standardsList_includesOrgPromoted_excludesOptedOut (via fetchStandardsForProduct)', e); }

  // ── AC6 (unit, JSON route): standardsList itself produces the same result ──
  try {
    const pool = makeMockPool(products, standards, optouts);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'p1' } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200 };
    await standardsList(req, res, null, pool);
    const ids = (res._b.standards || []).map(s => s.standard_id).sort();
    assert.deepStrictEqual(ids, ['std-own', 'std-promoted'], `Expected [std-own, std-promoted], got ${JSON.stringify(ids)}`);
    pass('standardsList (JSON route) matches fetchStandardsForProduct\'s semantics exactly');
  } catch (e) { fail('standardsList (JSON route) matches fetchStandardsForProduct\'s semantics exactly', e); }

  // ── AC1, AC2, AC3 (integration): tab renders nav link, own+promoted, excludes opted-out ──
  try {
    const pool = makeMockPool(products, standards, optouts);
    const req = { session: { tenantId: 'org-1', login: 'alice' }, params: { id: 'p1' } };
    const res = makeRawRes();
    await handleGetProductStandardsTab(req, res, null, pool);
    assert.strictEqual(res._statusCode, 200, `Expected 200, got ${res._statusCode}`);
    const body = res._body;
    assert(body.includes('Own Standard'), 'Expected the own standard in the list');
    assert(body.includes('Promoted Standard'), 'Expected the org-promoted standard in the list');
    assert(!body.includes('Opted-Out Standard'), 'Opted-out standard must not appear in the rendered tab');
    assert(body.includes('Product') && body.includes('Org-promoted'), 'Expected distinct visibility labels for own vs promoted');
    pass('handleGetProductStandardsTab_rendersTabAndList');
  } catch (e) { fail('handleGetProductStandardsTab_rendersTabAndList', e); }

  // ── AC1: the product page nav includes a Standards link alongside Kanban/Roadmap ──
  try {
    const { _renderProductView } = require('../src/web-ui/routes/products');
    const html = _renderProductView('Product One', 'p1', [], 'alice', null, false, null, null, []);
    assert(html.includes('/products/p1/standards-tab'), 'Expected a Standards tab link in the product page nav');
    assert(html.includes('>Standards<'), 'Expected the Standards link text to read "Standards"');
    assert(html.includes('/products/p1/kanban') && html.includes('/products/p1/roadmap'), 'Expected Standards to sit alongside the existing Kanban/Roadmap links, not replace them');
    pass('productPageNav_includesStandardsLinkAlongsideKanbanRoadmap');
  } catch (e) { fail('productPageNav_includesStandardsLinkAlongsideKanbanRoadmap', e); }

  // ── AC4 (integration): Promote to org calls the real endpoint ──
  try {
    const ph = { _caps: [], capture: function(id, ev, props) { this._caps.push({ ev, props }); } };
    const pool = makeMockPool(products, standards, optouts);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'std-own' } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200 };
    await standardsPromote(req, res, null, pool, ph);
    assert.strictEqual(res._b.visibility, 'org', 'Expected visibility updated to org in the response');
    const upd = pool._ops.find(op => /UPDATE standards SET visibility/i.test(op.sql));
    assert(upd && upd.params.includes('std-own'), 'Expected UPDATE called with the right standard id');
    pass('handlePutStandardPromote_updatesVisibilityInPlace');
  } catch (e) { fail('handlePutStandardPromote_updatesVisibilityInPlace', e); }

  // ── AC5 (integration): Opt out calls the real endpoint, standard then absent from list ──
  try {
    const pool = makeMockPool(products, standards, []);
    const optReq = { params: { id: 'std-promoted' }, body: { productId: 'p1' } };
    const optRes = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200 };
    await optoutPost(optReq, optRes, null, pool, { capture: function() {} });
    const ins = pool._ops.find(op => /INSERT INTO standard_product_optouts/i.test(op.sql));
    assert(ins && ins.params.includes('std-promoted') && ins.params.includes('p1'), 'Expected opt-out INSERT with the right standard/product ids');

    // Now re-list -- the opted-out-just-now standard must be gone from p1's view.
    const listPool = makeMockPool(products, standards, [{ standard_id: 'std-promoted', product_id: 'p1' }]);
    const rows = await fetchStandardsForProduct(listPool, 'p1', 'org-1');
    assert(!rows.some(r => r.standard_id === 'std-promoted'), 'Expected std-promoted absent after opting out');
    pass('handlePostStandardOptout_removesFromList');
  } catch (e) { fail('handlePostStandardOptout_removesFromList', e); }

  console.log(`\n[smug-s1] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
