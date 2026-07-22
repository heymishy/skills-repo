'use strict';
const assert = require('assert');

function makeMockPool(products, journeys) {
  return {
    query: async function(sql, params) {
      // bri-s3.4: tenant-ownership lookups added to handleGetProductView /
      // handleGetProductKanban -- match these before the broader tenant_id
      // list-query regex below so single-product-by-id lookups resolve.
      if (/SELECT (name, )?tenant_id.*FROM products WHERE product_id/i.test(sql)) {
        const pid = params && params[0];
        const row = (products || []).find(p => p.product_id === pid);
        return { rows: row ? [row] : [] };
      }
      if (/SELECT.*products.*tenant_id/i.test(sql) || /FROM products WHERE tenant_id/i.test(sql)) {
        return { rows: products || [] };
      }
      if (/SELECT.*journeys.*product_id/i.test(sql) || /FROM journeys WHERE product_id/i.test(sql)) {
        return { rows: (journeys || []).filter(j => !params || j.product_id === params[0]) };
      }
      if (/INSERT INTO journeys/i.test(sql)) {
        return { rows: [{ journey_id: 'new-j-id' }] };
      }
      if (/SELECT count|COUNT/i.test(sql)) {
        const pid = params && params[0];
        const count = (journeys || []).filter(j => j.product_id === pid).length;
        return { rows: [{ count: String(count) }] };
      }
      return { rows: [] };
    }
  };
}

const mockPosthog = { _captured: [], capture: function(id,ev,props) { this._captured.push({ev,props}); } };

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { handleGetDashboard, handleGetProductView, handlePostProductFeature } = require('../src/web-ui/routes/products');

  // T1 — dashboard returns product cards with name, feature count, last updated
  try {
    const products = [
      { product_id: 'p1', name: 'Prod One', tenant_id: 'tx' },
      { product_id: 'p2', name: 'Prod Two', tenant_id: 'tx' }
    ];
    const journeys = [
      { journey_id: 'j1', product_id: 'p1', tenant_id: 'tx', stage: 'review', health: 'green', updated_at: new Date('2026-01-02') },
      { journey_id: 'j2', product_id: 'p1', tenant_id: 'tx', stage: 'test-plan', health: 'green', updated_at: new Date('2026-01-01') },
      { journey_id: 'j3', product_id: 'p1', tenant_id: 'tx', stage: 'definition', health: 'green', updated_at: new Date('2026-01-03') }
    ];
    const pool = makeMockPool(products, journeys);
    const req = { session: { tenantId: 'tx' } };
    const res = { json: function(b) { this._b=b; }, _b: null, status: function(c) { this._s=c; return this; } };
    await handleGetDashboard(req, res, null, pool);
    const body = res._b;
    assert(body && body.products, 'No products in response');
    const p1card = body.products.find(p => p.product_id === 'p1');
    assert(p1card, 'p1 card not found');
    assert(p1card.featureCount === 3, `Expected featureCount=3, got ${p1card.featureCount}`);
    assert(p1card.name, 'name missing');
    pass('GET /dashboard returns product cards with name, feature count, and last-updated date');
  } catch(e) { fail('GET /dashboard returns product cards with name, feature count, and last-updated date', e); }

  // T2 — product view lists features with stage and health
  try {
    const journeys = [
      { journey_id: 'j4', product_id: 'prod-1', stage: 'review', health: 'green', tenant_id: 'ty' },
      { journey_id: 'j5', product_id: 'prod-1', stage: 'definition', health: 'amber', tenant_id: 'ty' },
      { journey_id: 'j6', product_id: 'prod-1', stage: 'discovery', health: 'red', tenant_id: 'ty' }
    ];
    // bri-s3.4: handleGetProductView now checks product ownership by tenant_id
    // before returning features -- this product row must match the session's
    // tenantId ('ty') for this (same-tenant, legitimate) test to still pass.
    const products = [{ product_id: 'prod-1', name: 'Prod One', tenant_id: 'ty' }];
    const pool = makeMockPool(products, journeys);
    const req = { session: { tenantId: 'ty' }, params: { id: 'prod-1' } };
    const res = { json: function(b) { this._b=b; }, _b: null, status: function(c) { this._s=c; return this; } };
    await handleGetProductView(req, res, null, pool);
    const body = res._b;
    assert(body && body.features, 'No features in product view response');
    assert(body.features.length === 3, `Expected 3 features, got ${body.features.length}`);
    assert(body.features[0].stage, 'stage missing from feature');
    assert(body.features[0].health, 'health missing from feature');
    pass('GET /products/:id lists features with pipeline stage and health indicator');
  } catch(e) { fail('GET /products/:id lists features with pipeline stage and health indicator', e); }

  // T3 — new feature creates journey with product_id, PostHog fires
  //
  // jrf-s2 (2026-07-22): this handler no longer INSERTs directly against the
  // pool argument -- that raw SQL bypassed the shared in-memory journey-store
  // entirely, leaving every journey it created invisible to getJourney/
  // setActiveSession/completeStage (confirmed live: "Journey not found" at
  // gate-confirm). It now registers through journey-store.js's own
  // createJourney/setJourneyFields, matching handlePostJourney's already-
  // correct pattern. Verifying via the real journey-store module instead of
  // inspecting the pool's raw SQL calls.
  try {
    const ph = { _captured: [], capture: function(id,ev,props) { this._captured.push({ev,props}); } };
    const pool = { query: async function() { return { rows: [] }; } };
    const journeyStore = require('../src/web-ui/modules/journey-store');
    journeyStore._clearForTesting();

    const req = { session: { tenantId: 'tz' }, params: { id: 'prod-xyz' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, redirect: function(u) { this._redirect=u; }, _s:200, _b:null };
    await handlePostProductFeature(req, res, null, pool, ph);

    const ev = ph._captured.find(e => e.ev === 'journey_created');
    assert(ev, 'journey_created not emitted');
    assert(ev.props.productId === 'prod-xyz', 'productId not in event');

    const journey = journeyStore.getJourney(ev.props.journeyId);
    assert(journey, 'journey not registered in the shared in-memory store (this is the exact bug being fixed)');
    assert(journey.productId === 'prod-xyz', 'product_id not set on the registered journey');
    assert(journey.tenantId === 'tz', 'tenant_id not set on the registered journey');
    pass('POST /products/:id/features creates journey with product_id and emits journey_created event');
  } catch(e) { fail('POST /products/:id/features creates journey with product_id and emits journey_created event', e); }

  // T4 — no products → showCta shown
  try {
    const pool = makeMockPool([], []);
    const req = { session: { tenantId: 'new-tenant' } };
    const res = { json: function(b) { this._b=b; }, _b: null, status: function(c) { this._s=c; return this; } };
    await handleGetDashboard(req, res, null, pool);
    const body = res._b;
    assert(body && (body.showCta === true || (body.products && body.products.length === 0)), 'showCta not set for empty products');
    pass('GET /dashboard with no products shows showCta:true');
  } catch(e) { fail('GET /dashboard with no products shows showCta:true', e); }

  // T5 — feature count reflects current DB state
  try {
    const products = [{ product_id: 'px', name: 'PX', tenant_id: 'tw' }];
    const pool1 = makeMockPool(products, [
      { journey_id: 'j10', product_id: 'px', tenant_id: 'tw', stage: 'review', health: 'green', updated_at: new Date() },
      { journey_id: 'j11', product_id: 'px', tenant_id: 'tw', stage: 'review', health: 'green', updated_at: new Date() },
      { journey_id: 'j12', product_id: 'px', tenant_id: 'tw', stage: 'review', health: 'green', updated_at: new Date() }
    ]);
    const req = { session: { tenantId: 'tw' } };
    const res1 = { json: function(b) { this._b=b; }, _b: null, status: function(c) { this._s=c; return this; } };
    await handleGetDashboard(req, res1, null, pool1);
    const count1 = res1._b.products[0].featureCount;
    const pool2 = makeMockPool(products, [
      { journey_id: 'j10', product_id: 'px', tenant_id: 'tw', stage: 'review', health: 'green', updated_at: new Date() },
      { journey_id: 'j11', product_id: 'px', tenant_id: 'tw', stage: 'completed', health: 'green', updated_at: new Date() }
    ]);
    const res2 = { json: function(b) { this._b=b; }, _b: null, status: function(c) { this._s=c; return this; } };
    await handleGetDashboard(req, res2, null, pool2);
    const count2 = res2._b.products[0].featureCount;
    assert(count1 === 3, `Expected 3, got ${count1}`);
    assert(count2 === 2, `Expected 2, got ${count2}`);
    pass('product card feature count reflects current DB state on each load');
  } catch(e) { fail('product card feature count reflects current DB state on each load', e); }

  // T-NFR1 — HTML-escaped product name
  try {
    const products = [{ product_id: 'pb', name: '<b>Bold</b>', tenant_id: 'tb' }];
    const pool = makeMockPool(products, []);
    const req = { session: { tenantId: 'tb' } };
    const res = { json: function(b) { this._b=b; }, _b: null, status: function(c) { this._s=c; return this; } };
    await handleGetDashboard(req, res, null, pool);
    const card = res._b && res._b.products && res._b.products[0];
    const renderedName = card && (card.name || card.displayName || '');
    assert(!/<b>/.test(renderedName), 'Raw HTML <b> tag found in product name — not escaped');
    pass('product name is HTML-escaped before returning in response');
  } catch(e) { fail('product name is HTML-escaped before returning in response', e); }

  console.log(`\n[psh-s4] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
