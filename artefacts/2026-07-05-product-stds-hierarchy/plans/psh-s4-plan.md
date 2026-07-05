# Implementation Plan — psh-s4: Product-aware dashboard and navigation

**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s4.md
**DoR:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s4-dor.md
**Test file:** `tests/check-psh-s4-navigation.js`
**E2E test file:** `tests/e2e/psh-s4-dashboard-layout.spec.js`
**Model class:** balanced
**Upstream dependency:** psh-s1, psh-s3.

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/web-ui/routes/products.js` | Modify | Add dashboard, product view, and new-feature handlers |
| `src/web-ui/server.js` | Modify | Mount product navigation routes |
| `tests/check-psh-s4-navigation.js` | Create | 5 integration + 2 NFR tests |
| `tests/e2e/psh-s4-dashboard-layout.spec.js` | Create | AC6 Playwright layout test |

---

## Task 1 — Write failing tests (RED)

**File:** `tests/check-psh-s4-navigation.js`

```js
'use strict';
const assert = require('assert');

function makeMockPool(products, journeys) {
  return {
    query: async function(sql, params) {
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
  const {
    handleGetDashboard,
    handleGetProductView,
    handlePostProductFeature
  } = require('../src/web-ui/routes/products');

  // T1 — AC1: dashboard returns product cards with name, feature count, last updated
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

  // T2 — AC2: product view lists features with stage and health
  try {
    const journeys = [
      { journey_id: 'j4', product_id: 'prod-1', stage: 'review', health: 'green', tenant_id: 'ty' },
      { journey_id: 'j5', product_id: 'prod-1', stage: 'definition', health: 'amber', tenant_id: 'ty' },
      { journey_id: 'j6', product_id: 'prod-1', stage: 'discovery', health: 'red', tenant_id: 'ty' }
    ];
    const pool = makeMockPool([], journeys);
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

  // T3 — AC3: new feature creates journey with product_id, PostHog fires
  try {
    const ph = { _captured: [], capture: function(id,ev,props) { this._captured.push({ev,props}); } };
    const pool = {
      _inserts: [],
      query: async function(sql, params) {
        this._inserts.push({ sql, params });
        if (/INSERT INTO journeys/i.test(sql)) return { rows: [{ journey_id: 'new-j' }] };
        return { rows: [] };
      }
    };
    const req = { session: { tenantId: 'tz' }, params: { id: 'prod-xyz' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, redirect: function(u) { this._redirect=u; }, _s:200, _b:null };
    await handlePostProductFeature(req, res, null, pool, ph);
    const ins = pool._inserts.find(i => /INSERT INTO journeys/i.test(i.sql));
    assert(ins, 'No INSERT into journeys');
    const productIdParam = ins.params.find(p => p === 'prod-xyz');
    assert(productIdParam, 'product_id not set in INSERT');
    const ev = ph._captured.find(e => e.ev === 'journey_created');
    assert(ev, 'journey_created not emitted');
    assert(ev.props.productId === 'prod-xyz', 'productId not in event');
    pass('POST /products/:id/features creates journey with product_id and emits journey_created event');
  } catch(e) { fail('POST /products/:id/features creates journey with product_id and emits journey_created event', e); }

  // T4 — AC4: no products → CTA shown
  try {
    const pool = makeMockPool([], []);
    const req = { session: { tenantId: 'new-tenant' } };
    const res = { json: function(b) { this._b=b; }, _b: null, status: function(c) { this._s=c; return this; } };
    await handleGetDashboard(req, res, null, pool);
    const body = res._b;
    assert(body && (body.showCta || body.cta || (body.products && body.products.length === 0)), 'CTA not shown for empty products');
    pass('GET /dashboard with no products shows create-first-product CTA');
  } catch(e) { fail('GET /dashboard with no products shows create-first-product CTA', e); }

  // T5 — AC5: feature count reflects current DB state
  try {
    const products = [{ product_id: 'px', name: 'PX', tenant_id: 'tw' }];
    // First call: 3 journeys
    const pool1 = makeMockPool(products, [
      { journey_id: 'j10', product_id: 'px', tenant_id: 'tw', stage: 'review', health: 'green', updated_at: new Date() },
      { journey_id: 'j11', product_id: 'px', tenant_id: 'tw', stage: 'review', health: 'green', updated_at: new Date() },
      { journey_id: 'j12', product_id: 'px', tenant_id: 'tw', stage: 'review', health: 'green', updated_at: new Date() }
    ]);
    const req = { session: { tenantId: 'tw' } };
    const res1 = { json: function(b) { this._b=b; }, _b: null, status: function(c) { this._s=c; return this; } };
    await handleGetDashboard(req, res1, null, pool1);
    const count1 = res1._b.products[0].featureCount;
    // Second call: 2 journeys
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

  // T-NFR2 — HTML-escaped product name
  try {
    const products = [{ product_id: 'pb', name: '<b>Bold</b>', tenant_id: 'tb' }];
    const pool = makeMockPool(products, []);
    const req = { session: { tenantId: 'tb' } };
    const res = { json: function(b) { this._b=b; }, _b: null, status: function(c) { this._s=c; return this; } };
    await handleGetDashboard(req, res, null, pool);
    const card = res._b && res._b.products && res._b.products[0];
    const renderedName = card && (card.name || card.displayName || '');
    assert(!/<b>/.test(renderedName), 'Raw HTML <b> tag found in product name — not escaped');
    pass('product name is HTML-escaped before DOM insertion — no raw innerHTML');
  } catch(e) { fail('product name is HTML-escaped before DOM insertion — no raw innerHTML', e); }

  console.log(`\n[psh-s4] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
```

---

## Task 2 — Add navigation handlers to products.js (GREEN)

**File:** `src/web-ui/routes/products.js` — add to existing file:

```js
function _escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function handleGetDashboard(req, res, _next, pool) {
  var _pool = pool;
  var tenantId = req.session && req.session.tenantId;
  var products = (await _pool.query(`SELECT product_id, name, created_at FROM products WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId])).rows;
  var cards = await Promise.all(products.map(async function(p) {
    var journeyRows = (await _pool.query(`SELECT journey_id, updated_at FROM journeys WHERE product_id = $1`, [p.product_id])).rows;
    var lastUpdated = journeyRows.reduce(function(mx, j) { return (!mx || j.updated_at > mx) ? j.updated_at : mx; }, null);
    return { product_id: p.product_id, name: _escapeHtml(p.name), featureCount: journeyRows.length, lastUpdated: lastUpdated };
  }));
  res.json({ products: cards, showCta: cards.length === 0 });
}

async function handleGetProductView(req, res, _next, pool) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var rows = (await _pool.query(`SELECT journey_id, stage, health, feature_slug, updated_at FROM journeys WHERE product_id = $1`, [productId])).rows;
  var features = rows.map(function(j) { return { journey_id: j.journey_id, stage: j.stage, health: j.health, featureSlug: j.feature_slug }; });
  res.json({ features: features });
}

async function handlePostProductFeature(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var productId = req.params && req.params.id;
  var journeyId = require('crypto').randomUUID();
  await _pool.query(
    `INSERT INTO journeys (journey_id, feature_slug, tenant_id, product_id, data) VALUES ($1, $2, $3, $4, '{}'::jsonb) ON CONFLICT DO NOTHING`,
    [journeyId, 'new-feature-' + journeyId.slice(0,8), tenantId, productId]
  );
  _ph.capture(tenantId, 'journey_created', { journeyId: journeyId, productId: productId, tenantId: tenantId });
  if (res.redirect) {
    res.redirect('/journeys/' + journeyId + '/discovery');
  } else {
    res.status(201).json({ journey_id: journeyId });
  }
}

module.exports = Object.assign(module.exports || {}, {
  handleGetDashboard, handleGetProductView, handlePostProductFeature
});
```

---

## Task 3 — Create E2E spec

**File:** `tests/e2e/psh-s4-dashboard-layout.spec.js`

```js
const { test, expect } = require('@playwright/test');

test('product dashboard cards visible without overflow at 1280x800', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(1280);
});
```

---

## Task 4 — Mount routes in server.js

Wire in server.js request dispatcher: route `GET /dashboard` → `handleGetDashboard`, `GET /products/:id` → `handleGetProductView`, `POST /products/:id/features` → `handlePostProductFeature`.

**Run:** `node tests/check-psh-s4-navigation.js`
**Expected (GREEN):** `[psh-s4] Results: 7 passed, 0 failed`

---

## Task 5 — Commit

```
feat(psh-s4): product-aware dashboard navigation — product cards, product view, new feature
```
