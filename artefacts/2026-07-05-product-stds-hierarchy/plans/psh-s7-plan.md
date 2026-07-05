# Implementation Plan — psh-s7: Org-level kanban with product grouping and filter

**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s7.md
**DoR:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s7-dor.md
**Test file:** `tests/check-psh-s7-org-kanban.js`
**E2E test file:** `tests/e2e/psh-s7-org-kanban.spec.js`
**Model class:** balanced
**Upstream dependency:** psh-s6.

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/web-ui/routes/products.js` | Modify | Add `handleGetOrgKanban` handler |
| `src/web-ui/server.js` | Modify | Mount GET /org/kanban |
| `tests/check-psh-s7-org-kanban.js` | Create | 5 integration + 2 NFR tests |
| `tests/e2e/psh-s7-org-kanban.spec.js` | Create | AC6 Playwright layout test |

---

## Task 1 — Write failing tests (RED)

**File:** `tests/check-psh-s7-org-kanban.js`

```js
'use strict';
const assert = require('assert');

function makeMockPool(products, journeys) {
  return {
    query: async function(sql, params) {
      if (/FROM products WHERE tenant_id/i.test(sql)) {
        return { rows: products.filter(p => !params || p.tenant_id === params[0]) };
      }
      if (/FROM journeys.*product_id/i.test(sql) || /FROM journeys j.*JOIN/i.test(sql)) {
        const tenantId = params && params[0];
        const productFilter = params && params[1];
        let rows = journeys.filter(j => !tenantId || j.tenant_id === tenantId);
        if (productFilter) rows = rows.filter(j => j.product_id === productFilter);
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

  // T1 — AC1: all features grouped by product and stage
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
    pass('GET /org/kanban returns features grouped by product then by stage');
  } catch(e) { fail('GET /org/kanban returns features grouped by product then by stage', e); }

  // T2 — AC2: product filter limits to selected product
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool(products, journeys);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: { product: 'pA' } };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetOrgKanban(req, res, null, pool, ph);
    const body = res._b;
    assert(body.groups.length === 1, `Expected 1 group after filter, got ${body.groups.length}`);
    assert(body.groups[0].product_id === 'pA', 'Wrong product in filtered result');
    pass('GET /org/kanban?product=prod-1 shows only prod-1 features');
  } catch(e) { fail('GET /org/kanban?product=prod-1 shows only prod-1 features', e); }

  // T3 — AC3: no filter shows all products
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool(products, journeys);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: {} };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetOrgKanban(req, res, null, pool, ph);
    assert(res._b.groups.length === 2, `Expected 2 groups, got ${res._b.groups.length}`);
    pass('GET /org/kanban with no filter shows all products');
  } catch(e) { fail('GET /org/kanban with no filter shows all products', e); }

  // T4 — AC4: feature card includes link to active journey stage
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool(products, [{ journey_id: 'j1', product_id: 'pA', tenant_id: 'tx', stage: 'review', health: 'green', feature_slug: 'f1' }]);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: {} };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetOrgKanban(req, res, null, pool, ph);
    const gA = res._b.groups.find(g => g.product_id === 'pA');
    const card = gA && gA.features[0];
    assert(card, 'Card not found');
    assert(card.stageLink || card.link || card.href, 'No stageLink on card');
    const link = card.stageLink || card.link || card.href;
    assert(link.includes('j1'), 'journey_id not in link');
    pass('org kanban feature card includes link to active journey stage');
  } catch(e) { fail('org kanban feature card includes link to active journey stage', e); }

  // T5 — AC5: PostHog kanban_viewed with view:org, productCount, featureCount
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
    const bigProducts = Array.from({length:10}, (_,i) => ({ product_id: 'p'+i, name: 'P'+i, tenant_id: 'tb' }));
    const bigJourneys = Array.from({length:100}, (_,i) => ({ journey_id: 'j'+i, product_id: 'p'+(i%10), tenant_id: 'tb', stage: 'discovery', health: 'green', feature_slug: 'f'+i }));
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
    pass('cross-tenant isolation — org kanban never returns other tenants\' features');
  } catch(e) { fail('cross-tenant isolation — org kanban never returns other tenants\' features', e); }

  console.log(`\n[psh-s7] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
```

**Run:** `node tests/check-psh-s7-org-kanban.js`
**Expected (RED):** `handleGetOrgKanban is not a function`

---

## Task 2 — Add org kanban handler to products.js (GREEN)

**File:** `src/web-ui/routes/products.js` — add:

```js
async function handleGetOrgKanban(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var productFilter = req.query && req.query.product;

  // Get all products for this tenant
  var prodRows = (await _pool.query(`SELECT product_id, name FROM products WHERE tenant_id = $1`, [tenantId])).rows;
  var filteredProds = productFilter ? prodRows.filter(function(p) { return p.product_id === productFilter; }) : prodRows;

  // Get all journeys for these products
  var allJourneys = [];
  for (var i = 0; i < filteredProds.length; i++) {
    var p = filteredProds[i];
    var jRows = (await _pool.query(`SELECT journey_id, product_id, stage, health, feature_slug FROM journeys WHERE product_id = $1 AND tenant_id = $2`, [p.product_id, tenantId])).rows;
    allJourneys = allJourneys.concat(jRows.map(function(j) { return Object.assign({}, j, { productName: _escapeHtml(p.name) }); }));
  }

  var groups = filteredProds.map(function(p) {
    var features = allJourneys
      .filter(function(j) { return j.product_id === p.product_id; })
      .map(function(j) {
        return {
          journey_id: j.journey_id,
          name: _escapeHtml(j.feature_slug || j.journey_id),
          stage: j.stage,
          health: j.health,
          healthLabel: j.health === 'red' ? 'Blocked' : (j.health === 'amber' ? 'Warning' : 'Healthy'),
          stageLink: '/journeys/' + j.journey_id + '/' + j.stage
        };
      });
    return { product_id: p.product_id, productName: _escapeHtml(p.name), features: features };
  });

  _ph.capture(tenantId || (req.session && req.session.login), 'kanban_viewed', {
    view: 'org',
    tenantId: tenantId,
    productCount: groups.length,
    featureCount: allJourneys.length
  });

  res.json({ groups: groups });
}

module.exports = Object.assign(module.exports || {}, { handleGetOrgKanban });
```

---

## Task 3 — Create E2E spec

**File:** `tests/e2e/psh-s7-org-kanban.spec.js`

```js
const { test, expect } = require('@playwright/test');

test('org kanban product groups visible without horizontal overflow at 1280x800', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/org/kanban');
  await page.waitForLoadState('networkidle');
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(1280);
});
```

**Run:** `node tests/check-psh-s7-org-kanban.js`
**Expected (GREEN):** `[psh-s7] Results: 7 passed, 0 failed`

---

## Task 4 — Commit

```
feat(psh-s7): org-level kanban with product grouping and filter
```
