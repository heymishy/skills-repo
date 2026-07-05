# Implementation Plan — psh-s6: Per-product kanban board

**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s6.md
**DoR:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s6-dor.md
**Test file:** `tests/check-psh-s6-product-kanban.js`
**E2E test file:** `tests/e2e/psh-s6-product-kanban.spec.js`
**Model class:** balanced
**Upstream dependency:** psh-s1, psh-s4.

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/web-ui/routes/products.js` | Modify | Add `handleGetProductKanban` handler |
| `src/web-ui/server.js` | Modify | Mount GET /products/:id/kanban |
| `tests/check-psh-s6-product-kanban.js` | Create | 5 integration + 2 NFR tests |
| `tests/e2e/psh-s6-product-kanban.spec.js` | Create | AC6 Playwright layout test |

---

## Task 1 — Write failing tests (RED)

**File:** `tests/check-psh-s6-product-kanban.js`

```js
'use strict';
const assert = require('assert');

const STAGE_COLUMNS = ['discovery','benefit-metric','definition','review','test-plan','definition-of-ready','implementation','definition-of-done'];

function makeMockPool(journeys) {
  return {
    query: async function(sql, params) {
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

  // T1 — AC1: 8 stage columns, all features in correct column
  try {
    const journeys = [
      { journey_id: 'j1', product_id: 'prod-1', stage: 'discovery', health: 'green', name: 'F1' },
      { journey_id: 'j2', product_id: 'prod-1', stage: 'review', health: 'green', name: 'F2' },
      { journey_id: 'j3', product_id: 'prod-1', stage: 'test-plan', health: 'green', name: 'F3' },
      { journey_id: 'j4', product_id: 'prod-1', stage: 'definition', health: 'green', name: 'F4' },
      { journey_id: 'j5', product_id: 'prod-1', stage: 'benefit-metric', health: 'green', name: 'F5' },
      { journey_id: 'j6', product_id: 'prod-1', stage: 'implementation', health: 'green', name: 'F6' }
    ];
    const pool = makeMockPool(journeys);
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

  // T2 — AC2: stage update moves feature to new column
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool1 = makeMockPool([{ journey_id: 'j1', product_id: 'p1', stage: 'review', health: 'green', name: 'F1' }]);
    const pool2 = makeMockPool([{ journey_id: 'j1', product_id: 'p1', stage: 'test-plan', health: 'green', name: 'F1' }]);
    const req = { session: { tenantId: 'ty', login: 'u' }, params: { id: 'p1' } };
    const res1 = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetProductKanban(req, res1, null, pool1, ph);
    const col1 = res1._b.columns.find(c => c.stage === 'review');
    assert(col1 && col1.features.length === 1, 'j1 not in review first call');
    const res2 = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetProductKanban(req, res2, null, pool2, ph);
    const col2review = res2._b.columns.find(c => c.stage === 'review');
    const col2tp = res2._b.columns.find(c => c.stage === 'test-plan');
    assert(col2review && col2review.features.length === 0, 'j1 still in review after stage change');
    assert(col2tp && col2tp.features.length === 1, 'j1 not in test-plan after stage change');
    pass('kanban reflects updated stage after feature stage change');
  } catch(e) { fail('kanban reflects updated stage after feature stage change', e); }

  // T3 — AC3: red-health card includes icon/text label
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool([{ journey_id: 'j2', product_id: 'p2', stage: 'review', health: 'red', name: 'F2' }]);
    const req = { session: { tenantId: 'tz', login: 'u' }, params: { id: 'p2' } };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetProductKanban(req, res, null, pool, ph);
    const col = res._b.columns.find(c => c.stage === 'review');
    const card = col && col.features[0];
    assert(card, 'Card not found');
    const hasLabel = card.healthLabel || card.healthIcon || card.statusLabel;
    assert(hasLabel, 'No healthLabel or healthIcon on red-health card');
    pass('red-health feature card includes icon or text label alongside colour');
  } catch(e) { fail('red-health feature card includes icon or text label alongside colour', e); }

  // T4 — AC4: empty stage column shown with empty-state label
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool([{ journey_id: 'j3', product_id: 'p3', stage: 'discovery', health: 'green', name: 'F3' }]);
    const req = { session: { tenantId: 'tw', login: 'u' }, params: { id: 'p3' } };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetProductKanban(req, res, null, pool, ph);
    const bmCol = res._b.columns.find(c => c.stage === 'benefit-metric');
    assert(bmCol, 'benefit-metric column missing');
    assert(bmCol.features.length === 0, 'benefit-metric column not empty');
    assert(bmCol.emptyLabel, 'No emptyLabel on empty stage column');
    pass('stage column with no features shows empty-state label');
  } catch(e) { fail('stage column with no features shows empty-state label', e); }

  // T5 — AC5: PostHog kanban_viewed with view:product, productId, featureCount
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool([
      { journey_id: 'j10', product_id: 'p4', stage: 'discovery', health: 'green', name: 'F10' },
      { journey_id: 'j11', product_id: 'p4', stage: 'review', health: 'green', name: 'F11' },
      { journey_id: 'j12', product_id: 'p4', stage: 'test-plan', health: 'green', name: 'F12' },
      { journey_id: 'j13', product_id: 'p4', stage: 'definition', health: 'green', name: 'F13' }
    ]);
    const req = { session: { tenantId: 'ta', login: 'u' }, params: { id: 'p4' } };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    await handleGetProductKanban(req, res, null, pool, ph);
    const ev = ph._caps.find(e => e.ev === 'kanban_viewed');
    assert(ev, 'kanban_viewed not emitted');
    assert(ev.props.view === 'product', `Expected view=product, got ${ev.props.view}`);
    assert(ev.props.productId === 'p4', 'productId not in event');
    assert(ev.props.featureCount === 4, `Expected featureCount=4, got ${ev.props.featureCount}`);
    pass('viewing product kanban emits kanban_viewed event with view:product and featureCount');
  } catch(e) { fail('viewing product kanban emits kanban_viewed event with view:product and featureCount', e); }

  // T-NFR1 — under 2 seconds for 50 features
  try {
    const ph = { capture: function() {} };
    const j50 = Array.from({length: 50}, (_,i) => ({ journey_id: 'j'+i, product_id: 'pb', stage: STAGE_COLUMNS[i % 8], health: 'green', name: 'F'+i }));
    const pool = makeMockPool(j50);
    const req = { session: { tenantId: 'tb', login: 'u' }, params: { id: 'pb' } };
    const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
    const t0 = Date.now();
    await handleGetProductKanban(req, res, null, pool, ph);
    const elapsed = Date.now() - t0;
    assert(elapsed < 2000, `Handler took ${elapsed}ms, expected < 2000ms`);
    pass('kanban renders in under 2 seconds for product with 50 features');
  } catch(e) { fail('kanban renders in under 2 seconds for product with 50 features', e); }

  // T-NFR2 — HTML-escaped feature names
  try {
    const ph = { capture: function() {} };
    const pool = makeMockPool([{ journey_id: 'j-xss', product_id: 'px', stage: 'discovery', health: 'green', name: '<script>xss</script>' }]);
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
```

**Run:** `node tests/check-psh-s6-product-kanban.js`
**Expected (RED):** `handleGetProductKanban is not a function`

---

## Task 2 — Add kanban handler to products.js (GREEN)

**File:** `src/web-ui/routes/products.js` — add:

```js
var STAGE_COLUMNS = ['discovery','benefit-metric','definition','review','test-plan','definition-of-ready','implementation','definition-of-done'];

function _healthLabel(health) {
  if (health === 'red')   return 'Blocked';
  if (health === 'amber') return 'Warning';
  return 'Healthy';
}

async function handleGetProductKanban(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;

  var rows = (await _pool.query(`SELECT journey_id, stage, health, feature_slug FROM journeys WHERE product_id = $1`, [productId])).rows;

  var columns = STAGE_COLUMNS.map(function(stage) {
    var features = rows
      .filter(function(j) { return j.stage === stage; })
      .map(function(j) {
        return {
          journey_id: j.journey_id,
          name: _escapeHtml(j.feature_slug || j.journey_id),
          health: j.health,
          healthLabel: _healthLabel(j.health),
          healthIcon: j.health === 'red' ? '⚠' : (j.health === 'amber' ? '⚠' : '✓')
        };
      });
    return { stage: stage, features: features, emptyLabel: features.length === 0 ? 'No features at this stage' : null };
  });

  _ph.capture(tenantId || (req.session && req.session.login), 'kanban_viewed', {
    view: 'product',
    productId: productId,
    tenantId: tenantId,
    featureCount: rows.length
  });

  res.json({ columns: columns });
}

// Add to module.exports
module.exports = Object.assign(module.exports || {}, { handleGetProductKanban });
```

---

## Task 3 — Create E2E spec

**File:** `tests/e2e/psh-s6-product-kanban.spec.js`

```js
const { test, expect } = require('@playwright/test');

test('product kanban 8 columns visible without horizontal overflow at 1280x800', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/products/test-product-id/kanban');
  await page.waitForLoadState('networkidle');
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(1280);
  const columns = await page.locator('[data-stage]').count();
  expect(columns).toBe(8);
});
```

**Run:** `node tests/check-psh-s6-product-kanban.js`
**Expected (GREEN):** `[psh-s6] Results: 7 passed, 0 failed`

---

## Task 4 ��� Commit

```
feat(psh-s6): per-product kanban board with 8 stage columns and health indicators
```
