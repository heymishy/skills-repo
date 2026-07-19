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

// kbc-s1: handleGetOrgKanban now renders real HTML via the shared renderer
// (AC3) instead of res.json({ groups }) -- the mock res below supports
// writeHead/end (what the handler actually calls now).
function makeMockRes() {
  const res = { _b: null, _raw: null, _headers: {}, _statusCode: null };
  res.json = function(b) { this._b = b; return this; };
  res.status = function(c) { this._statusCode = c; return this; };
  res.writeHead = function(code, hdrs) { this._statusCode = code; if (hdrs) Object.assign(this._headers, hdrs); return this; };
  res.end = function(data) { this._raw = data; return this; };
  return res;
}

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { handleGetOrgKanban, buildOrgKanbanColumns } = require('../src/web-ui/routes/products');
  // bri-s1.5 — handleGetOrgKanban now gates on isEnabled('org-kanban-view', ...); this
  // pre-existing suite predates the gate and asserts on-behaviour throughout, so wire
  // the flag on for the whole file (bri-s1.5's own test file covers the off-path directly).
  require('../src/web-ui/modules/posthog-flags').setPostHogFlagsAdapter({ evaluateFlag: async function() { return true; } });

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
  // kbc-s1: migrated to call buildOrgKanbanColumns directly -- this is the
  // shared column-building logic (AC1) that handleGetOrgKanban now feeds
  // into the shared HTML renderer. buildOrgKanbanColumns groups by STAGE
  // (matching product/tenant scope, per AC1's "no duplicated column-
  // building logic across scopes"), with each card title prefixed by its
  // product name -- so "grouped by product" is now verified by checking
  // each product's features are attributed correctly within the stage
  // columns, rather than a separate per-product groups array.
  try {
    const groups = [
      { productId: 'pA', productName: 'Product A', journeys: journeys.filter(j => j.product_id === 'pA') },
      { productId: 'pB', productName: 'Product B', journeys: journeys.filter(j => j.product_id === 'pB') }
    ];
    const columns = buildOrgKanbanColumns(groups);
    const allCards = columns.reduce((acc, c) => acc.concat(c.cards), []);
    assert(allCards.length === 5, `Expected 5 total cards, got ${allCards.length}`);
    const pACards = allCards.filter(c => c.title.startsWith('Product A'));
    assert(pACards.length === 3, `Expected 3 features attributed to Product A, got ${pACards.length}`);
    const pBCards = allCards.filter(c => c.title.startsWith('Product B'));
    assert(pBCards.length === 2, `Expected 2 features attributed to Product B, got ${pBCards.length}`);
    pass('org kanban columns correctly attribute features to their product');
  } catch(e) { fail('org kanban columns correctly attribute features to their product', e); }

  // T2 — product filter limits to selected product (filtering happens in
  // the handler before column-building, so this stays an integration test)
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool(products, journeys);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: { product: 'pA' } };
    const res = makeMockRes();
    await handleGetOrgKanban(req, res, null, pool, ph);
    assert(res._raw && res._raw.includes('Product A'), 'Expected Product A in filtered rendered board');
    assert(!res._raw.includes('Product B'), 'Expected Product B excluded from filtered rendered board');
    pass('GET org kanban with product filter shows only the filtered product');
  } catch(e) { fail('GET org kanban with product filter shows only the filtered product', e); }

  // T3 — no filter shows all products
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool(products, journeys);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: {} };
    const res = makeMockRes();
    await handleGetOrgKanban(req, res, null, pool, ph);
    assert(res._raw.includes('Product A'), 'Expected Product A in unfiltered rendered board');
    assert(res._raw.includes('Product B'), 'Expected Product B in unfiltered rendered board');
    pass('GET org kanban with no filter shows all products');
  } catch(e) { fail('GET org kanban with no filter shows all products', e); }

  // T4 — feature card is attributed with its product name (kbc-s1: the old
  // per-card stageLink concept was JSON-response-specific; the HTML board's
  // equivalent is the product-name-prefixed card title, which the shared
  // renderer displays for every card)
  try {
    const groups = [{ productId: 'pA', productName: 'Product A', journeys: [{ journey_id: 'j1', product_id: 'pA', tenant_id: 'tx', stage: 'review', health: 'green', feature_slug: 'f1' }] }];
    const columns = buildOrgKanbanColumns(groups);
    const col = columns.find(c => c.stage === 'review');
    const card = col && col.cards[0];
    assert(card, 'Card not found');
    assert(card.title.includes('Product A'), 'Card title missing product attribution');
    assert(card.id === 'j1', 'card id should be the journey_id');
    pass('org kanban feature card is attributed with its product name and journey id');
  } catch(e) { fail('org kanban feature card is attributed with its product name and journey id', e); }

  // T5 — PostHog kanban_viewed with view:org, productCount, featureCount
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool(products, journeys);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: {} };
    const res = makeMockRes();
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
    const res = makeMockRes();
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
    const res = makeMockRes();
    await handleGetOrgKanban(req, res, null, pool, ph);
    assert(!res._raw.includes('j-y'), 'Cross-tenant journey_id leaked into org kanban board');
    assert(!res._raw.includes('fy'), 'Cross-tenant feature leaked into org kanban board');
    pass('cross-tenant isolation — org kanban board never renders other tenants features');
  } catch(e) { fail('cross-tenant isolation — org kanban board never renders other tenants features', e); }

  console.log(`\n[psh-s7] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
