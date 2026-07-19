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

// kbc-s1: handleGetProductKanban now renders real HTML via the shared
// renderer (AC2) instead of res.json({ columns }) -- the mock res below
// supports both writeHead/end (what the handler actually calls now) and the
// legacy json()/status() shape (kept harmless in case any other code path
// still uses it), so the same mock works for both the migrated integration
// tests below and any future JSON-returning caller.
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
  const { handleGetProductKanban, buildProductKanbanColumns } = require('../src/web-ui/routes/products');
  // bri-s1.5 — handleGetProductKanban now gates on isEnabled('product-kanban-view', ...);
  // this pre-existing suite predates the gate and asserts on-behaviour throughout, so wire
  // the flag on for the whole file (bri-s1.5's own test file covers the off-path directly).
  require('../src/web-ui/modules/posthog-flags').setPostHogFlagsAdapter({ evaluateFlag: async function() { return true; } });

  // T1 — 8 stage columns, all features in correct column
  // kbc-s1: migrated to call buildProductKanbanColumns directly -- this is
  // the shared column-building logic (AC1) that handleGetProductKanban now
  // feeds into the shared HTML renderer; asserting on it directly is the
  // AC2-preserving way to check "the same stage columns... already computed
  // by the existing handleGetProductKanban data logic" without depending on
  // the (now HTML, not JSON) response shape.
  try {
    const journeys = [
      { journey_id: 'j1', product_id: 'prod-1', stage: 'discovery', health: 'green', feature_slug: 'f1' },
      { journey_id: 'j2', product_id: 'prod-1', stage: 'review', health: 'green', feature_slug: 'f2' },
      { journey_id: 'j3', product_id: 'prod-1', stage: 'test-plan', health: 'green', feature_slug: 'f3' },
      { journey_id: 'j4', product_id: 'prod-1', stage: 'definition', health: 'green', feature_slug: 'f4' },
      { journey_id: 'j5', product_id: 'prod-1', stage: 'benefit-metric', health: 'green', feature_slug: 'f5' },
      { journey_id: 'j6', product_id: 'prod-1', stage: 'implementation', health: 'green', feature_slug: 'f6' }
    ];
    const columns = buildProductKanbanColumns(journeys);
    assert(columns, 'No columns returned');
    assert(columns.length === 8, `Expected 8 columns, got ${columns.length}`);
    const discoveryCol = columns.find(c => c.stage === 'discovery');
    assert(discoveryCol && discoveryCol.cards.length === 1, 'j1 not in discovery column');
    const reviewCol = columns.find(c => c.stage === 'review');
    assert(reviewCol && reviewCol.cards.length === 1, 'j2 not in review column');
    pass('product kanban groups features into 8 stage columns');
  } catch(e) { fail('product kanban groups features into 8 stage columns', e); }

  // T2 — stage update moves feature to new column
  try {
    const col1Set = buildProductKanbanColumns([{ journey_id: 'j1', product_id: 'p1', stage: 'review', health: 'green', feature_slug: 'F1' }]);
    const col1 = col1Set.find(c => c.stage === 'review');
    assert(col1 && col1.cards.length === 1, 'j1 not in review on first call');
    const col2Set = buildProductKanbanColumns([{ journey_id: 'j1', product_id: 'p1', stage: 'test-plan', health: 'green', feature_slug: 'F1' }]);
    const col2review = col2Set.find(c => c.stage === 'review');
    const col2tp = col2Set.find(c => c.stage === 'test-plan');
    assert(col2review && col2review.cards.length === 0, 'j1 still in review after stage change');
    assert(col2tp && col2tp.cards.length === 1, 'j1 not in test-plan after stage change');
    pass('kanban reflects updated stage after feature stage change');
  } catch(e) { fail('kanban reflects updated stage after feature stage change', e); }

  // T3 — red-health card includes healthLabel
  try {
    const columns = buildProductKanbanColumns([{ journey_id: 'j2', product_id: 'p2', stage: 'review', health: 'red', feature_slug: 'F2' }]);
    const col = columns.find(c => c.stage === 'review');
    const card = col && col.cards[0];
    assert(card, 'Card not found');
    assert(card.healthLabel, 'No healthLabel on red-health card');
    assert.strictEqual(card.healthLabel, 'Blocked', 'Expected "Blocked" healthLabel for red health');
    pass('red-health feature card includes healthLabel');
  } catch(e) { fail('red-health feature card includes healthLabel', e); }

  // T4 — empty stage column shown (no cards)
  try {
    const columns = buildProductKanbanColumns([{ journey_id: 'j3', product_id: 'p3', stage: 'discovery', health: 'green', feature_slug: 'F3' }]);
    const bmCol = columns.find(c => c.stage === 'benefit-metric');
    assert(bmCol, 'benefit-metric column missing');
    assert(bmCol.cards.length === 0, 'benefit-metric column not empty');
    pass('stage column with no features is present with an empty cards array');
  } catch(e) { fail('stage column with no features is present with an empty cards array', e); }

  // T5 — PostHog kanban_viewed with view:product, productId, featureCount
  // kbc-s1: still calls the real handleGetProductKanban handler (not just
  // the pure column-builder) since this behaviour lives in the handler
  // itself, not in buildProductKanbanColumns.
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool([
      { journey_id: 'j10', product_id: 'p4', stage: 'discovery', health: 'green', feature_slug: 'F10' },
      { journey_id: 'j11', product_id: 'p4', stage: 'review', health: 'green', feature_slug: 'F11' },
      { journey_id: 'j12', product_id: 'p4', stage: 'test-plan', health: 'green', feature_slug: 'F12' },
      { journey_id: 'j13', product_id: 'p4', stage: 'definition', health: 'green', feature_slug: 'F13' }
    ], 'ta');
    const req = { session: { tenantId: 'ta', login: 'u' }, params: { id: 'p4' } };
    const res = makeMockRes();
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
    const res = makeMockRes();
    const t0 = Date.now();
    await handleGetProductKanban(req, res, null, pool, ph);
    const elapsed = Date.now() - t0;
    assert(elapsed < 2000, `Handler took ${elapsed}ms, expected < 2000ms`);
    pass('kanban renders in under 2 seconds for 50 features');
  } catch(e) { fail('kanban renders in under 2 seconds for 50 features', e); }

  // T-NFR2 — HTML-escaped feature names
  // kbc-s1: now asserts on the rendered HTML body (res._raw) rather than a
  // JSON card.name field, since the response is real HTML (AC2, Security NFR).
  try {
    const ph = { capture: function() {} };
    const pool = makeMockPool([{ journey_id:'j-xss', product_id:'px', stage:'discovery', health:'green', feature_slug:'<script>xss</script>' }], 'tc');
    const req = { session: { tenantId: 'tc', login: 'u' }, params: { id: 'px' } };
    const res = makeMockRes();
    await handleGetProductKanban(req, res, null, pool, ph);
    assert(res._raw && typeof res._raw === 'string', 'No rendered HTML body found');
    assert(!res._raw.includes('<script>xss</script>'), 'Unescaped <script> in rendered board');
    assert(res._raw.includes('&lt;script&gt;'), 'Expected feature name to be HTML-escaped in rendered board');
    pass('feature names HTML-escaped in rendered kanban board');
  } catch(e) { fail('feature names HTML-escaped in rendered kanban board', e); }

  console.log(`\n[psh-s6] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
