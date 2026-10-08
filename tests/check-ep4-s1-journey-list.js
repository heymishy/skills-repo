'use strict';
// check-ep4-s1-journey-list.js -- TDD tests for ep4-s1 (Epic 4, customer-journey
// feature). Story: artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s1.md
// Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep4-s1-test-plan.md
// cj-ep4-s1: not to be confused with the unrelated, pre-existing "ep4-s1"
// story-slug reused elsewhere in this repo's history (Assign pods modal).
const assert = require('assert');

function makeMockRes() {
  return {
    status: function(c) { this._s = c; return this; },
    json: function(b) { this._b = b; },
    writeHead: function(c, headers) { this._s = c; this._headers = headers; },
    end: function(b) { this._b = b; },
    _s: 200, _b: null, _headers: null
  };
}

/**
 * @param {object} opts
 * @param {Array<{id,tenant_id,name,description,product_id,created_at}>} opts.journeys
 * @param {Array<{journey_id}>} opts.stages one row per stage, so N rows for a journey = N stages
 * @param {Array<{product_id,name,tenant_id}>} opts.products
 */
function makeMockPool(opts) {
  opts = opts || {};
  var journeys = opts.journeys || [];
  var stages = opts.stages || [];
  var products = opts.products || [];
  return {
    _ops: [],
    query: function(sql, params) {
      this._ops.push({ sql: String(sql), params: params });
      var s = String(sql);
      if (/FROM customer_journeys cj/.test(s)) {
        var tid = params[0];
        var rows = journeys.filter(function(j) { return j.tenant_id === tid; })
          .sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); })
          .map(function(j) {
            var prod = products.find(function(p) { return p.product_id === j.product_id; });
            return { id: j.id, name: j.name, description: j.description, product_id: j.product_id, product_name: prod ? prod.name : null };
          });
        return Promise.resolve({ rows: rows });
      }
      if (/FROM customer_journey_stages WHERE journey_id = ANY/.test(s)) {
        var ids = params[0];
        var counts = {};
        stages.forEach(function(st) {
          if (ids.indexOf(st.journey_id) !== -1) counts[st.journey_id] = (counts[st.journey_id] || 0) + 1;
        });
        var rows = Object.keys(counts).map(function(jid) { return { journey_id: jid, stage_count: counts[jid] }; });
        return Promise.resolve({ rows: rows });
      }
      if (/FROM products WHERE tenant_id/.test(s)) {
        var ptid = params[0];
        return Promise.resolve({ rows: products.filter(function(p) { return p.tenant_id === ptid; }) });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

function extractScript(html) {
  var m = html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('no <script> tag found in rendered HTML');
  return m[1];
}

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { handleGetCustomerJourneysList } = require('../src/web-ui/routes/journeys');

  // ── AC1 ─────────────────────────────────────────────────────────────────
  try {
    const pool = makeMockPool({
      journeys: [
        { id: 'j1', tenant_id: 'org-1', name: 'Checkout', description: 'Short desc', product_id: 'p1', created_at: '2026-10-01' },
        { id: 'j2', tenant_id: 'org-1', name: 'Onboarding', description: null, product_id: null, created_at: '2026-10-02' }
      ],
      stages: [{ journey_id: 'j1' }, { journey_id: 'j1' }],
      products: [{ product_id: 'p1', name: 'Widgets', tenant_id: 'org-1' }]
    });
    const req = { session: { tenantId: 'org-1' } };
    const res = makeMockRes();
    await handleGetCustomerJourneysList(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(html.includes('Checkout'), 'expected Checkout journey name');
    assert.ok(html.includes('Short desc'), 'expected Checkout description');
    assert.ok(html.includes('Widgets'), 'expected resolved product name for j1');
    assert.ok(html.includes('2 stage'), 'expected j1 stage count of 2');
    assert.ok(html.includes('Onboarding'), 'expected Onboarding journey name');
    assert.ok(html.includes('No product'), 'expected "No product" fallback for j2');
    assert.ok(html.includes('0 stage'), 'expected j2 stage count of 0');
    pass('AC1: list renders all tenant-scoped journeys with correct fields');
  } catch (e) { fail('AC1: list renders all tenant-scoped journeys with correct fields', e); }

  // ── AC1 (truncation) ────────────────────────────────────────────────────
  try {
    const longDesc = 'x'.repeat(200);
    const pool = makeMockPool({
      journeys: [{ id: 'j1', tenant_id: 'org-1', name: 'Long', description: longDesc, product_id: null, created_at: '2026-10-01' }],
      stages: [],
      products: []
    });
    const req = { session: { tenantId: 'org-1' } };
    const res = makeMockRes();
    await handleGetCustomerJourneysList(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(!html.includes(longDesc), 'expected the full 200-char description NOT to appear verbatim');
    assert.ok(html.includes('…') || html.includes('...'), 'expected a truncation ellipsis marker');
    pass('AC1 (truncation): a long description is truncated');
  } catch (e) { fail('AC1 (truncation): a long description is truncated', e); }

  // ── AC2 ─────────────────────────────────────────────────────────────────
  try {
    const pool = makeMockPool({ journeys: [], stages: [], products: [] });
    const req = { session: { tenantId: 'org-1' } };
    const res = makeMockRes();
    await handleGetCustomerJourneysList(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(html.includes('No journeys yet. Create your first journey.'), 'expected the exact empty-state message');
    assert.ok(/New journey/.test(html), 'expected a "New journey" CTA');
    pass('AC2: empty state renders the exact message and CTA');
  } catch (e) { fail('AC2: empty state renders the exact message and CTA', e); }

  // ── AC3 ─────────────────────────────────────────────────────────────────
  try {
    const pool = makeMockPool({
      journeys: [],
      stages: [],
      products: [{ product_id: 'p1', name: 'Widgets', tenant_id: 'org-1' }, { product_id: 'p2', name: 'Gadgets', tenant_id: 'org-1' }]
    });
    const req = { session: { tenantId: 'org-1' } };
    const res = makeMockRes();
    await handleGetCustomerJourneysList(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(/id="sw-new-journey-name"[^>]*required/.test(html), 'expected a required name input');
    assert.ok(html.includes('id="sw-new-journey-description"'), 'expected a description field');
    assert.ok(html.includes('>Widgets<') && html.includes('>Gadgets<'), 'expected both product names as select options');
    pass('AC3: "New journey" modal renders name, description, and product-picker fields');
  } catch (e) { fail('AC3: "New journey" modal renders name, description, and product-picker fields', e); }

  // ── AC4 (shape) ─────────────────────────────────────────────────────────
  try {
    const pool = makeMockPool({ journeys: [], stages: [], products: [] });
    const req = { session: { tenantId: 'org-1' } };
    const res = makeMockRes();
    await handleGetCustomerJourneysList(req, res, null, pool);
    const script = extractScript(res._b.bodyContent);
    const redirectedIdx = script.indexOf('r.redirected');
    const jsonIdx = script.indexOf('.json()');
    assert.ok(redirectedIdx !== -1, 'expected the submit handler to check r.redirected');
    assert.ok(jsonIdx !== -1 && redirectedIdx < jsonIdx, 'expected the redirected check to come BEFORE any .json() call');
    pass('AC4 (shape): submit handler treats a redirected response as success without parsing it as JSON');
  } catch (e) { fail('AC4 (shape): submit handler treats a redirected response as success without parsing it as JSON', e); }

  // ── AC5 (reinterpreted) ─────────────────────────────────────────────────
  try {
    const pool = makeMockPool({
      journeys: [
        { id: 'j1', tenant_id: 'org-1', name: 'Mine', description: null, product_id: null, created_at: '2026-10-01' },
        { id: 'j2', tenant_id: 'org-2', name: 'TheirsSecret', description: null, product_id: null, created_at: '2026-10-01' }
      ],
      stages: [], products: []
    });
    const req = { session: { tenantId: 'org-1' } };
    const res = makeMockRes();
    await handleGetCustomerJourneysList(req, res, null, pool);
    const html = res._b.bodyContent;
    const journeyQuery = pool._ops.find(function(op) { return /FROM customer_journeys cj/.test(op.sql); });
    assert.strictEqual(journeyQuery.params[0], 'org-1', 'expected the tenant_id param to be org-1');
    assert.ok(!html.includes('TheirsSecret'), 'expected org-2\'s journey to never appear');
    assert.ok(html.includes('Mine'), 'expected org-1\'s own journey to appear');
    pass('AC5 (reinterpreted): another tenant\'s journeys never appear in the list');
  } catch (e) { fail('AC5 (reinterpreted): another tenant\'s journeys never appear in the list', e); }

  // ── stage count boundaries ──────────────────────────────────────────────
  try {
    const pool = makeMockPool({
      journeys: [
        { id: 'j1', tenant_id: 'org-1', name: 'NoStages', description: null, product_id: null, created_at: '2026-10-01' },
        { id: 'j2', tenant_id: 'org-1', name: 'ThreeStages', description: null, product_id: null, created_at: '2026-10-02' }
      ],
      stages: [{ journey_id: 'j2' }, { journey_id: 'j2' }, { journey_id: 'j2' }],
      products: []
    });
    const req = { session: { tenantId: 'org-1' } };
    const res = makeMockRes();
    await handleGetCustomerJourneysList(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(html.includes('0 stage'), 'expected 0 stages for j1');
    assert.ok(html.includes('3 stage'), 'expected 3 stages for j2');
    pass('(data) stage count is correct at both boundaries');
  } catch (e) { fail('(data) stage count is correct at both boundaries', e); }

  // ── product name resolution ─────────────────────────────────────────────
  try {
    const pool = makeMockPool({
      journeys: [
        { id: 'j1', tenant_id: 'org-1', name: 'HasProduct', description: null, product_id: 'p1', created_at: '2026-10-01' },
        { id: 'j2', tenant_id: 'org-1', name: 'NoProductJourney', description: null, product_id: null, created_at: '2026-10-02' }
      ],
      stages: [],
      products: [{ product_id: 'p1', name: 'ResolvedProductName', tenant_id: 'org-1' }]
    });
    const req = { session: { tenantId: 'org-1' } };
    const res = makeMockRes();
    await handleGetCustomerJourneysList(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(html.includes('ResolvedProductName'), 'expected the resolved product name for j1');
    assert.ok(html.includes('No product'), 'expected "No product" fallback for j2');
    pass('(data) product name resolution and the null-product fallback');
  } catch (e) { fail('(data) product name resolution and the null-product fallback', e); }

  console.log(`\n[ep4-s1-journey-list] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
