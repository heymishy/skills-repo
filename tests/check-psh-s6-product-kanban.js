'use strict';
const assert = require('assert');

const STAGE_COLUMNS = ['discovery','benefit-metric','definition','review','test-plan','definition-of-ready','implementation','definition-of-done'];

// bri-s3.4: handleGetProductKanban now checks product tenant ownership before
// returning kanban data. `tenantId` here is the tenant that "owns" the mock
// product for this test scenario -- pass the same value as the test's
// req.session.tenantId so the (same-tenant, legitimate) existing coverage
// keeps passing.
function makeMockPool(journeys, tenantId) {
  return {
    query: async function(sql, params) {
      if (/SELECT tenant_id FROM products WHERE product_id/i.test(sql)) {
        return { rows: [{ tenant_id: tenantId }] };
      }
      if (/FROM journeys WHERE.*product_id/i.test(sql) || /FROM journeys WHERE.*product/i.test(sql)) {
        const pid = params && params[0];
        return { rows: pid ? journeys.filter(j => j.product_id === pid) : journeys };
      }
      return { rows: [] };
    }
  };
}

const mockPosthog = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { handleGetProductKanban } = require('../src/web-ui/routes/products');
  // bri-s1.5 — handleGetProductKanban now gates on isEnabled('product-kanban-view', ...);
  // this pre-existing suite predates the gate and asserts on-behaviour throughout, so wire
  // the flag on for the whole file (bri-s1.5's own test file covers the off-path directly).
  require('../src/web-ui/modules/posthog-flags').setPostHogFlagsAdapter({ evaluateFlag: async function() { return true; } });

  // T1 — 8 stage columns, all features in correct column
  try {
    const journeys = [
      { journey_id: 'j1', product_id: 'prod-1', stage: 'discovery', health: 'green', feature_slug: 'f1' },
      { journey_id: 'j2', product_id: 'prod-1', stage: 'review', health: 'green', feature_slug: 'f2' },
      { journey_id: 'j3', product_id: 'prod-1', stage: 'test-plan', health: 'green', feature_slug: 'f3' },
      { journey_id: 'j4', product_id: 'prod-1', stage: 'definition', health: 'green', feature_slug: 'f4' },
      { journey_id: 'j5', product_id: 'prod-1', stage: 'benefit-metric', health: 'green', feature_slug: 'f5' },
      { journey_id: 'j6', product_id: 'prod-1', stage: 'implementation', health: 'green', feature_slug: 'f6' }
    ];
    const pool = makeMockPool(journeys, 'tx');
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const req = { session: { tenantId: 'tx', login: 'u' }, params: { id: 'prod-1' } };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetProductKanban(req, res, null, pool, ph);
    const body = res._b;
    assert(body && body.columns, 'No columns in response');
    assert(body.columns.length === 8, `Expected 8 columns, got ${body.columns.length}`);
    const discoveryCol = body.columns.find(c => c.stage === 'discovery');
    assert(discoveryCol && discoveryCol.features.length === 1, 'j1 not in discovery column');
    const reviewCol = body.columns.find(c => c.stage === 'review');
    assert(reviewCol && reviewCol.features.length === 1, 'j2 not in review column');
    pass('GET /products/:id/kanban groups features into 8 stage columns');
  } catch(e) { fail('GET /products/:id/kanban groups features into 8 stage columns', e); }

  // T2 — stage update moves feature to new column
  try {
    const ph = { _caps: [], capture: function() {} };
    const pool1 = makeMockPool([{ journey_id: 'j1', product_id: 'p1', stage: 'review', health: 'green', feature_slug: 'F1' }], 'ty');
    const pool2 = makeMockPool([{ journey_id: 'j1', product_id: 'p1', stage: 'test-plan', health: 'green', feature_slug: 'F1' }], 'ty');
    const req = { session: { tenantId: 'ty', login: 'u' }, params: { id: 'p1' } };
    const res1 = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetProductKanban(req, res1, null, pool1, ph);
    const col1 = res1._b.columns.find(c => c.stage === 'review');
    assert(col1 && col1.features.length === 1, 'j1 not in review on first call');
    const res2 = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetProductKanban(req, res2, null, pool2, ph);
    const col2review = res2._b.columns.find(c => c.stage === 'review');
    const col2tp = res2._b.columns.find(c => c.stage === 'test-plan');
    assert(col2review && col2review.features.length === 0, 'j1 still in review after stage change');
    assert(col2tp && col2tp.features.length === 1, 'j1 not in test-plan after stage change');
    pass('kanban reflects updated stage after feature stage change');
  } catch(e) { fail('kanban reflects updated stage after feature stage change', e); }

  // T3 — red-health card includes healthLabel
  try {
    const ph = { _caps: [], capture: function() {} };
    const pool = makeMockPool([{ journey_id: 'j2', product_id: 'p2', stage: 'review', health: 'red', feature_slug: 'F2' }], 'tz');
    const req = { session: { tenantId: 'tz', login: 'u' }, params: { id: 'p2' } };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetProductKanban(req, res, null, pool, ph);
    const col = res._b.columns.find(c => c.stage === 'review');
    const card = col && col.features[0];
    assert(card, 'Card not found');
    const hasLabel = card.healthLabel || card.healthIcon || card.statusLabel;
    assert(hasLabel, 'No healthLabel or healthIcon on red-health card');
    pass('red-health feature card includes healthLabel or healthIcon');
  } catch(e) { fail('red-health feature card includes healthLabel or healthIcon', e); }

  // T4 — empty stage column shown with emptyLabel
  try {
    const ph = { _caps: [], capture: function() {} };
    const pool = makeMockPool([{ journey_id: 'j3', product_id: 'p3', stage: 'discovery', health: 'green', feature_slug: 'F3' }], 'tw');
    const req = { session: { tenantId: 'tw', login: 'u' }, params: { id: 'p3' } };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetProductKanban(req, res, null, pool, ph);
    const bmCol = res._b.columns.find(c => c.stage === 'benefit-metric');
    assert(bmCol, 'benefit-metric column missing');
    assert(bmCol.features.length === 0, 'benefit-metric column not empty');
    assert(bmCol.emptyLabel, 'No emptyLabel on empty stage column');
    pass('stage column with no features shows emptyLabel');
  } catch(e) { fail('stage column with no features shows emptyLabel', e); }

  // T5 — PostHog kanban_viewed with view:product, productId, featureCount
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool([
      { journey_id: 'j10', product_id: 'p4', stage: 'discovery', health: 'green', feature_slug: 'F10' },
      { journey_id: 'j11', product_id: 'p4', stage: 'review', health: 'green', feature_slug: 'F11' },
      { journey_id: 'j12', product_id: 'p4', stage: 'test-plan', health: 'green', feature_slug: 'F12' },
      { journey_id: 'j13', product_id: 'p4', stage: 'definition', health: 'green', feature_slug: 'F13' }
    ], 'ta');
    const req = { session: { tenantId: 'ta', login: 'u' }, params: { id: 'p4' } };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetProductKanban(req, res, null, pool, ph);
    const ev = ph._caps.find(e => e.ev === 'kanban_viewed');
    assert(ev, 'kanban_viewed not emitted');
    assert(ev.props.view === 'product', `Expected view=product, got ${ev.props.view}`);
    assert(ev.props.productId === 'p4', 'productId not in event');
    assert(ev.props.featureCount === 4, `Expected featureCount=4, got ${ev.props.featureCount}`);
    pass('viewing product kanban emits kanban_viewed with view:product and featureCount');
  } catch(e) { fail('viewing product kanban emits kanban_viewed with view:product and featureCount', e); }

  // T-NFR1 — under 2 seconds for 50 features
  try {
    const ph = { capture: function() {} };
    const j50 = Array.from({length:50}, (_,i) => ({ journey_id:'j'+i, product_id:'pb', stage: STAGE_COLUMNS[i%8], health:'green', feature_slug:'F'+i }));
    const pool = makeMockPool(j50, 'tb');
    const req = { session: { tenantId: 'tb', login: 'u' }, params: { id: 'pb' } };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    const t0 = Date.now();
    await handleGetProductKanban(req, res, null, pool, ph);
    const elapsed = Date.now() - t0;
    assert(elapsed < 2000, `Handler took ${elapsed}ms, expected < 2000ms`);
    pass('kanban renders in under 2 seconds for 50 features');
  } catch(e) { fail('kanban renders in under 2 seconds for 50 features', e); }

  // T-NFR2 — HTML-escaped feature names
  try {
    const ph = { capture: function() {} };
    const pool = makeMockPool([{ journey_id:'j-xss', product_id:'px', stage:'discovery', health:'green', feature_slug:'<script>xss</script>' }], 'tc');
    const req = { session: { tenantId: 'tc', login: 'u' }, params: { id: 'px' } };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetProductKanban(req, res, null, pool, ph);
    const col = res._b.columns.find(c => c.stage === 'discovery');
    const card = col && col.features[0];
    assert(card, 'Card not found');
    const displayName = card.name || card.displayName || '';
    assert(!displayName.includes('<script>'), 'Unescaped <script> in card name');
    pass('feature names HTML-escaped in kanban card data');
  } catch(e) { fail('feature names HTML-escaped in kanban card data', e); }

  console.log(`\n[psh-s6] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
