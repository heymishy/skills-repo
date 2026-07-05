'use strict';
const assert = require('assert');

function makeMockPool(products, journeys) {
  return {
    query: async function(sql, params) {
      if (/FROM products WHERE tenant_id/i.test(sql)) {
        return { rows: products.filter(p => !params || p.tenant_id === params[0]) };
      }
      if (/FROM journeys.*product_id.*=.*\$1/i.test(sql) || /FROM journeys WHERE product_id/i.test(sql)) {
        const pid = params && params[0];
        const tid = params && params[1];
        let rows = journeys.filter(j => j.product_id === pid);
        if (tid) rows = rows.filter(j => j.tenant_id === tid);
        return { rows };
      }
      return { rows: [] };
    }
  };
}

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { handleGetOrgKanban } = require('../src/web-ui/routes/products');

  const products = [
    { product_id: 'pA', name: 'Product A', tenant_id: 'tx' },
    { product_id: 'pB', name: 'Product B', tenant_id: 'tx' }
  ];
  const journeys = [
    { journey_id: 'j1', product_id: 'pA', tenant_id: 'tx', stage: 'discovery', health: 'green', feature_slug: 'f1' },
    { journey_id: 'j2', product_id: 'pA', tenant_id: 'tx', stage: 'review', health: 'green', feature_slug: 'f2' },
    { journey_id: 'j3', product_id: 'pA', tenant_id: 'tx', stage: 'review', health: 'amber', feature_slug: 'f3' },
    { journey_id: 'j4', product_id: 'pB', tenant_id: 'tx', stage: 'test-plan', health: 'green', feature_slug: 'f4' },
    { journey_id: 'j5', product_id: 'pB', tenant_id: 'tx', stage: 'definition', health: 'green', feature_slug: 'f5' }
  ];

  // T1 — all features grouped by product
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool(products, journeys);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: {} };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetOrgKanban(req, res, null, pool, ph);
    const body = res._b;
    assert(body && body.groups, 'No groups in response');
    assert(body.groups.length === 2, `Expected 2 product groups, got ${body.groups.length}`);
    const gA = body.groups.find(g => g.product_id === 'pA');
    assert(gA, 'Product A group missing');
    assert(gA.features.length === 3, `Expected 3 features in pA, got ${gA.features.length}`);
    pass('GET /org/kanban returns features grouped by product');
  } catch(e) { fail('GET /org/kanban returns features grouped by product', e); }

  // T2 — product filter limits to selected product
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool(products, journeys);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: { product: 'pA' } };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetOrgKanban(req, res, null, pool, ph);
    const body = res._b;
    assert(body.groups.length === 1, `Expected 1 group after filter, got ${body.groups.length}`);
    assert(body.groups[0].product_id === 'pA', 'Wrong product in filtered result');
    pass('GET /org/kanban?product=pA shows only pA features');
  } catch(e) { fail('GET /org/kanban?product=pA shows only pA features', e); }

  // T3 — no filter shows all products
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool(products, journeys);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: {} };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetOrgKanban(req, res, null, pool, ph);
    assert(res._b.groups.length === 2, `Expected 2 groups, got ${res._b.groups.length}`);
    pass('GET /org/kanban with no filter shows all products');
  } catch(e) { fail('GET /org/kanban with no filter shows all products', e); }

  // T4 — feature card includes stageLink
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool(products, [{ journey_id: 'j1', product_id: 'pA', tenant_id: 'tx', stage: 'review', health: 'green', feature_slug: 'f1' }]);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: {} };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetOrgKanban(req, res, null, pool, ph);
    const gA = res._b.groups.find(g => g.product_id === 'pA');
    const card = gA && gA.features[0];
    assert(card, 'Card not found');
    const link = card.stageLink || card.link || card.href;
    assert(link, 'No stageLink on card');
    assert(link.includes('j1'), 'journey_id not in stageLink');
    pass('org kanban feature card includes stageLink with journey_id');
  } catch(e) { fail('org kanban feature card includes stageLink with journey_id', e); }

  // T5 — PostHog kanban_viewed with view:org, productCount, featureCount
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool(products, journeys);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: {} };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetOrgKanban(req, res, null, pool, ph);
    const ev = ph._caps.find(e => e.ev === 'kanban_viewed');
    assert(ev, 'kanban_viewed not emitted');
    assert(ev.props.view === 'org', `Expected view=org, got ${ev.props.view}`);
    assert(ev.props.productCount === 2, `Expected productCount=2, got ${ev.props.productCount}`);
    assert(ev.props.featureCount === 5, `Expected featureCount=5, got ${ev.props.featureCount}`);
    pass('viewing org kanban emits kanban_viewed with view:org and correct counts');
  } catch(e) { fail('viewing org kanban emits kanban_viewed with view:org and correct counts', e); }

  // T-NFR1 — under 3 seconds for 10 products / 100 features
  try {
    const ph = { capture: function() {} };
    const bigProducts = Array.from({length:10}, (_,i) => ({ product_id:'p'+i, name:'P'+i, tenant_id:'tb' }));
    const bigJourneys = Array.from({length:100}, (_,i) => ({ journey_id:'j'+i, product_id:'p'+(i%10), tenant_id:'tb', stage:'discovery', health:'green', feature_slug:'f'+i }));
    const pool = makeMockPool(bigProducts, bigJourneys);
    const req = { session: { tenantId: 'tb', login: 'u' }, query: {} };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    const t0 = Date.now();
    await handleGetOrgKanban(req, res, null, pool, ph);
    const elapsed = Date.now() - t0;
    assert(elapsed < 3000, `Handler took ${elapsed}ms, expected < 3000ms`);
    pass('org kanban renders in under 3 seconds for 10 products and 100 features');
  } catch(e) { fail('org kanban renders in under 3 seconds for 10 products and 100 features', e); }

  // T-NFR2 — cross-tenant isolation
  try {
    const ph = { capture: function() {} };
    const mixedJourneys = [
      { journey_id: 'j-x', product_id: 'pA', tenant_id: 'tx', stage: 'discovery', health: 'green', feature_slug: 'fx' },
      { journey_id: 'j-y', product_id: 'pY', tenant_id: 'ty', stage: 'discovery', health: 'green', feature_slug: 'fy' }
    ];
    const pool = makeMockPool(products, mixedJourneys);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: {} };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetOrgKanban(req, res, null, pool, ph);
    const allFeatures = (res._b.groups || []).flatMap(g => g.features || []);
    const crossTenant = allFeatures.filter(f => f.journey_id === 'j-y');
    assert(crossTenant.length === 0, 'Cross-tenant features leaked into org kanban');
    pass('cross-tenant isolation — org kanban never returns other tenants features');
  } catch(e) { fail('cross-tenant isolation — org kanban never returns other tenants features', e); }

  console.log(`\n[psh-s7] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
