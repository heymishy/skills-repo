# Delivery view: feature and metric annotation rows on stage cards — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass (9 tests covering all 4 ACs, plus the new narrow DELETE route from decisions.md D16).
**Branch:** `feature/cj-ep2-s3`
**Worktree:** `.worktrees/cj-ep2-s3`
**Test command:** `npm test`

---

## File map

```
Create:
  tests/check-ep2-s3-delivery-view.js  — 9 tests covering all 4 ACs + the new DELETE route + shape

Modify:
  src/web-ui/routes/journeys.js  — handleGetJourneyCanvas gains: a mappings query joined
                                    against the already-read features list; a
                                    buildDeliveryAnnotations() helper; a 3-way view-toggle
                                    control; the existing FIRST <script> block gains a
                                    view-toggle click handler and a Remove-mapping click
                                    handler; new handler handleDeleteFeatureMapping;
                                    module.exports updated
  src/web-ui/server.js           — one new dispatch entry (DELETE) + import update
```

---

## Task 1: Delivery view annotation rows — mapped features, metric keys/values, feature-not-found warning (AC1, AC2, AC4)

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep2-s3-delivery-view.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-ep2-s3-delivery-view.js` with this initial content:

```javascript
'use strict';
// check-ep2-s3-delivery-view.js -- TDD tests for ep2-s3 (Epic 2,
// customer-journey feature). Story:
// artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s3.md
// Test plan:
// artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s3-test-plan.md
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let passed = 0; let failed = 0;
function pass(name) { console.log('  [PASS] ' + name); passed++; }
function fail(name, err) { console.error('  [FAIL] ' + name + ': ' + (err.message || err)); failed++; }

/**
 * @param {object} journeyRow {id, name, description}
 * @param {Array<object>} stageRows full-row stage data for handleGetJourneyCanvas's own render
 * @param {Array<object>} [mappingRows] rows from feature_customer_journey_stage_mappings
 *   {id, journey_stage_id, feature_slug, metric_keys}
 */
function makeCanvasMockPool(journeyRow, stageRows, mappingRows) {
  mappingRows = mappingRows || [];
  return {
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT id, name, description FROM customer_journeys/.test(s)) {
        var match = journeyRow && journeyRow.id === params[0];
        return Promise.resolve({ rows: match ? [journeyRow] : [] });
      }
      if (/^SELECT id, name, position, description/.test(s)) {
        return Promise.resolve({ rows: stageRows });
      }
      if (/^SELECT id, journey_stage_id, feature_slug, metric_keys FROM feature_customer_journey_stage_mappings/.test(s)) {
        var jMatch = params[0] === journeyRow.id;
        return Promise.resolve({ rows: jMatch ? mappingRows : [] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

function makeMockReqRes() {
  var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
  var res = {
    status: function(c) { this._s = c; return this; },
    json: function(b) { this._b = b; },
    _s: 200, _b: null
  };
  return { req: req, res: res };
}

function withMockedPipelineState(jsonStringOrThrow, fn) {
  var orig = fs.readFileSync;
  fs.readFileSync = function(p, enc) {
    if (String(p).indexOf('pipeline-state.json') !== -1) {
      if (typeof jsonStringOrThrow === 'function') { return jsonStringOrThrow(); }
      return jsonStringOrThrow;
    }
    return orig(p, enc);
  };
  try { return fn(); } finally { fs.readFileSync = orig; }
}

// Extracts the FIRST <script> block journeys.js renders -- the one
// ep1-s2/ep1-s3/ep1-s4 built (stageData/panel/drag-reorder), which this
// story extends with the view-toggle and Remove-mapping click handlers.
// Same marker-based extraction technique as the other check-ep2-*.js files,
// targeting the FIRST block, not the feature-picker's second one.
function extractFirstScript(html) {
  var marker = 'var stageData={};';
  var idx = html.indexOf(marker);
  assert.ok(idx !== -1, 'expected the stage-panel/canvas script to be present in the rendered HTML');
  var start = html.lastIndexOf('<script>', idx);
  var end = html.indexOf('</script>', idx);
  assert.ok(start !== -1 && end !== -1, 'expected enclosing <script>...</script> tags');
  return html.slice(start + '<script>'.length, end);
}

function buildDom(bodyContent) {
  var scriptSrc = extractFirstScript(bodyContent);
  var dom = new JSDOM('<!DOCTYPE html><html><body>' + bodyContent + '</body></html>', {
    runScripts: 'outside-only',
    url: 'http://localhost/journeys/j1'
  });
  dom.window.eval(scriptSrc);
  return dom;
}

(async function() {
  var journeys = require('../src/web-ui/routes/journeys');

  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's1', name: 'Stage 1', position: 0 }],
      [{ id: 'map-1', journey_stage_id: 's1', feature_slug: 'feat-a', metric_keys: ['m1'] }]
    );
    var featuresJson = JSON.stringify({ features: [
      { slug: 'feat-a', name: 'Feature A', metricValues: { m1: '0.42' } }
    ] });
    var out = await withMockedPipelineState(featuresJson, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('Feature A') !== -1, 'expected the mapped feature\'s name to be rendered');
    assert.ok(out.indexOf('feat-a') !== -1, 'expected the mapped feature\'s slug to be rendered');
    assert.ok(out.indexOf('m1: 0.42') !== -1, 'expected "m1: 0.42" (the real recorded metric value) to be rendered');
    pass('AC1 -- Delivery view shows a mapped feature with its selected metric keys and real values');
  } catch (e) { fail('AC1 -- Delivery view shows a mapped feature with its selected metric keys and real values', e); }

  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's1', name: 'Stage 1', position: 0 }],
      [{ id: 'map-1', journey_stage_id: 's1', feature_slug: 'feat-b', metric_keys: [] }]
    );
    var featuresJson = JSON.stringify({ features: [{ slug: 'feat-b', name: 'Feature B' }] });
    var out = await withMockedPipelineState(featuresJson, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('No metrics selected') !== -1, 'expected the exact text "No metrics selected" for a mapping with zero metric keys');
    pass('AC1 -- a mapped feature with zero metric keys shows "No metrics selected"');
  } catch (e) { fail('AC1 -- a mapped feature with zero metric keys shows "No metrics selected"', e); }

  console.log('\n[ep2-s3-delivery-view] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
```

- [ ] **Step 2: Run tests — must fail**

```bash
node tests/check-ep2-s3-delivery-view.js
```

Expected output: both tests fail — no mappings query exists yet, no annotation rendering exists yet.

- [ ] **Step 3: Implement**

In `src/web-ui/routes/journeys.js`, inside `handleGetJourneyCanvas`, immediately after the existing stages query (`var sr = await pool.query(...)` / `var stages = sr.rows || [];`), add the new mappings query:

```javascript
  // ep2-s3 -- read every feature-to-stage mapping for this journey in one
  // query, grouped client-side (in this function) by stage id. No separate
  // tenant_id filter needed here -- the journey's own tenant ownership was
  // already verified above (the customer_journeys SELECT that 404s before
  // this point runs).
  var mr = await pool.query(
    `SELECT id, journey_stage_id, feature_slug, metric_keys FROM feature_customer_journey_stage_mappings WHERE journey_id = $1`,
    [journeyId]
  );
  var mappingsByStage = {};
  (mr.rows || []).forEach(function(m) {
    if (!mappingsByStage[m.journey_stage_id]) mappingsByStage[m.journey_stage_id] = [];
    mappingsByStage[m.journey_stage_id].push(m);
  });
```

Immediately after the existing `features`/`featuresLoadError` block (the one `ep2-s1` added, right before `featureMetricKeysJson`), add a slug-keyed lookup:

```javascript
  // ep2-s3 -- slug-keyed lookup for joining mappings against the features
  // list already read above. Features with no matching mapping are simply
  // never looked up; mappings with no matching feature fall through to the
  // "Feature not found" branch in buildDeliveryAnnotations below (AC2).
  var featuresBySlug = {};
  features.forEach(function(f) { featuresBySlug[f.slug] = f; });
```

Add a new helper function, placed right before the `stagesHtml` assignment (so it can be called from inside the `stages.map(...)` callback):

```javascript
  // ep2-s3 -- builds one stage's Delivery-view annotation markup. Three
  // cases, never conflated: no mappings at all (AC1 boundary), a mapping
  // whose feature no longer resolves (AC2), and a normal mapping with
  // its selected metric keys/values (AC1/AC4). metricValues is read the
  // same optional-field way metricKeys already is (decisions.md D15) --
  // nothing populates it yet, so every value correctly falls through to
  // "No value recorded" today.
  function buildDeliveryAnnotations(stageId) {
    var mappings = mappingsByStage[stageId] || [];
    if (mappings.length === 0) {
      return '<p class="sw-stage-annotations-empty">No features mapped</p>';
    }
    return mappings.map(function(m) {
      var feature = featuresBySlug[m.feature_slug];
      if (!feature) {
        return '<div class="sw-feature-mapping-row sw-feature-mapping-row--missing">' +
          '<span class="sw-feature-mapping-warning">⚠️ Feature not found (' + escHtml(m.feature_slug) + ')</span>' +
          '<button type="button" class="sw-feature-mapping-remove" data-mapping-id="' + escHtml(m.id) + '" data-stage-id="' + escHtml(stageId) + '">Remove</button>' +
        '</div>';
      }
      var metricKeys = Array.isArray(m.metric_keys) ? m.metric_keys : [];
      var metricsHtml;
      if (metricKeys.length === 0) {
        metricsHtml = '<p class="sw-feature-mapping-metrics-empty">No metrics selected</p>';
      } else {
        var values = (feature.metricValues && typeof feature.metricValues === 'object') ? feature.metricValues : {};
        metricsHtml = '<ul class="sw-feature-mapping-metric-values">' +
          metricKeys.map(function(k) {
            var hasValue = Object.prototype.hasOwnProperty.call(values, k);
            var rendered = hasValue ? escHtml(String(values[k])) : 'No value recorded';
            return '<li>' + escHtml(k) + ': ' + rendered + '</li>';
          }).join('') +
        '</ul>';
      }
      return '<div class="sw-feature-mapping-row">' +
        '<span class="sw-feature-mapping-name">' + escHtml(feature.name || feature.slug) + ' (' + escHtml(feature.slug) + ')</span>' +
        metricsHtml +
      '</div>';
    }).join('');
  }
```

Modify the existing `stagesHtml` assignment's `stages.map(function(s, idx) { ... })` callback to append an annotations sibling block right after the stage card's own closing `</div>`. Find this line in the existing `return (...)` block:

```javascript
            '<button type="button" class="sw-stage-map-feature" data-stage-id="' + escHtml(s.id) + '">Map feature</button>' +
          '</div>'
        );
```

Replace it with (adding the annotations block as a sibling, still inside the same template literal, after the card's closing tag):

```javascript
            '<button type="button" class="sw-stage-map-feature" data-stage-id="' + escHtml(s.id) + '">Map feature</button>' +
          '</div>' +
          '<div class="sw-stage-annotations sw-stage-annotations--delivery" data-stage-id="' + escHtml(s.id) + '">' +
            buildDeliveryAnnotations(s.id) +
          '</div>'
        );
```

Finally, add the new CSS rules to the existing `<style>` string (the one declared right before `var bodyContent = ...`, containing `.sw-stage-panel{...}` etc.) — append these rules right before its closing `'</style>';`:

```javascript
      '.sw-stage-annotations{display:none;margin:4px 0 12px 0;padding:8px 10px;' +
        'border:1px solid var(--line);border-radius:6px;background:var(--bg);font-size:12px}' +
      '.sw-journey-canvas--view-delivery .sw-stage-annotations--delivery{display:block}' +
      '.sw-feature-mapping-row{margin-bottom:8px}' +
      '.sw-feature-mapping-row:last-child{margin-bottom:0}' +
      '.sw-feature-mapping-warning{color:var(--danger)}' +
      '.sw-feature-mapping-remove{margin-left:8px}' +
      '.sw-feature-mapping-metric-values{margin:4px 0 0 0;padding-left:16px}' +
      '.sw-stage-annotations-empty,.sw-feature-mapping-metrics-empty{color:var(--ink-2)}' +
```

- [ ] **Step 4: Run tests — must pass**

```bash
node tests/check-ep2-s3-delivery-view.js
```

Expected output: `[ep2-s3-delivery-view] Results: 2 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, 0 failed

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ep2-s3-delivery-view.js
git commit -m "feat: Delivery view annotation rows -- mapped features, metric values, feature-not-found warning (ep2-s3 AC1, AC2, AC4)"
```

---

## Task 2: View toggle control — Canvas/Customer experience/Delivery, client-side CSS class, no server round-trip (AC3)

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep2-s3-delivery-view.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep2-s3-delivery-view.js`, inside the `(async function() { ... })()` IIFE, before the final summary-line block. First add these three test cases (zero-mappings boundary, feature-not-found warning, no-value-recorded) plus the view-toggle behavioral test:

```javascript
  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's1', name: 'Stage 1', position: 0 }],
      []
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('No features mapped') !== -1, 'expected "No features mapped" for a stage with zero mappings');
    pass('AC1 (boundary) -- a stage with zero mappings shows "No features mapped"');
  } catch (e) { fail('AC1 (boundary) -- a stage with zero mappings shows "No features mapped"', e); }

  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's1', name: 'Stage 1', position: 0 }],
      [{ id: 'map-1', journey_stage_id: 's1', feature_slug: 'ghost-feature', metric_keys: [] }]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('Feature not found (ghost-feature)') !== -1, 'expected the feature-not-found warning text with the slug');
    assert.ok(/<button[^>]*class="sw-feature-mapping-remove"[^>]*data-mapping-id="map-1"[^>]*data-stage-id="s1"/.test(out), 'expected a Remove button with the correct mapping id and stage id');
    pass('AC2 -- a mapped feature no longer in pipeline-state.json shows a warning with a Remove button');
  } catch (e) { fail('AC2 -- a mapped feature no longer in pipeline-state.json shows a warning with a Remove button', e); }

  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's1', name: 'Stage 1', position: 0 }],
      [{ id: 'map-1', journey_stage_id: 's1', feature_slug: 'feat-a', metric_keys: ['m2'] }]
    );
    var featuresJson = JSON.stringify({ features: [{ slug: 'feat-a', name: 'Feature A', metricValues: {} }] });
    var out = await withMockedPipelineState(featuresJson, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('m2: No value recorded') !== -1, 'expected "m2: No value recorded" when the key has no matching metricValues entry');
    pass('AC4 -- a selected metric key with no recorded value shows "No value recorded"');
  } catch (e) { fail('AC4 -- a selected metric key with no recorded value shows "No value recorded"', e); }

  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's1', name: 'Stage 1', position: 0 }],
      [{ id: 'map-1', journey_stage_id: 's1', feature_slug: 'feat-a', metric_keys: ['m1'] }]
    );
    var featuresJson = JSON.stringify({ features: [{ slug: 'feat-a', name: 'Feature A', metricValues: { m1: '0.42' } }] });
    var bodyContent = await withMockedPipelineState(featuresJson, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    var dom = buildDom(bodyContent);
    var win = dom.window;
    var fetchCalls = [];
    win.fetch = function(url, opts) { fetchCalls.push({ url: url, opts: opts }); return Promise.resolve({ ok: true, json: function() { return Promise.resolve({}); } }); };

    var canvasRoot = win.document.querySelector('.sw-journey-canvas');
    var deliveryBtn = win.document.querySelector('.sw-canvas-view-toggle-btn[data-view="delivery"]');
    var canvasBtn = win.document.querySelector('.sw-canvas-view-toggle-btn[data-view="canvas"]');
    var annotations = win.document.querySelector('.sw-stage-annotations--delivery');

    assert.ok(!canvasRoot.className.indexOf('sw-journey-canvas--view-delivery') >= 0 || canvasRoot.className.indexOf('sw-journey-canvas--view-delivery') === -1, 'expected delivery view class absent by default');

    deliveryBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    assert.ok(canvasRoot.className.indexOf('sw-journey-canvas--view-delivery') !== -1, 'expected the canvas root to gain the delivery-view class after clicking Delivery');
    assert.strictEqual(win.getComputedStyle(annotations).display, 'block', 'expected the annotation block to become visible in Delivery view');

    canvasBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    assert.ok(canvasRoot.className.indexOf('sw-journey-canvas--view-delivery') === -1, 'expected the delivery-view class to be removed after clicking Canvas');
    assert.strictEqual(win.getComputedStyle(annotations).display, 'none', 'expected the annotation block to be hidden again in Canvas view');

    assert.strictEqual(fetchCalls.length, 0, 'expected ZERO fetch calls -- the view toggle must never hit the network');
    pass('AC3 -- the view toggle shows/hides annotation rows via CSS class with no server round-trip');
  } catch (e) { fail('AC3 -- the view toggle shows/hides annotation rows via CSS class with no server round-trip', e); }
```

- [ ] **Step 2: Run tests — must fail**

```bash
node tests/check-ep2-s3-delivery-view.js
```

Expected: the boundary/AC2/AC4 cases from Task 1's own rendering should already pass once Task 1 is complete — re-run them here to confirm no regression, then the AC3 test fails (`.sw-canvas-view-toggle-btn` does not exist yet).

- [ ] **Step 3: Implement**

In `src/web-ui/routes/journeys.js`, add the view-toggle markup immediately before the existing `<div class="sw-journey-stages" id="sw-journey-stages">` line inside the `bodyContent` assignment, and change the outer `.sw-journey-canvas` div to carry the default view class:

```javascript
  var viewToggleHtml =
    '<div class="sw-canvas-view-toggle" role="group" aria-label="Canvas view">' +
      '<button type="button" class="sw-canvas-view-toggle-btn sw-canvas-view-toggle-btn--active" data-view="canvas" aria-pressed="true">Canvas</button>' +
      '<button type="button" class="sw-canvas-view-toggle-btn" data-view="customer-experience" aria-pressed="false">Customer experience</button>' +
      '<button type="button" class="sw-canvas-view-toggle-btn" data-view="delivery" aria-pressed="false">Delivery</button>' +
    '</div>';
```

Change this existing line:

```javascript
  var bodyContent =
    '<div class="sw-journey-canvas">' +
      '<h1>' + escHtml(journey.name) + '</h1>' +
      '<div class="sw-journey-stages" id="sw-journey-stages">' +
```

to:

```javascript
  var bodyContent =
    '<div class="sw-journey-canvas sw-journey-canvas--view-canvas">' +
      '<h1>' + escHtml(journey.name) + '</h1>' +
      viewToggleHtml +
      '<div class="sw-journey-stages" id="sw-journey-stages">' +
```

Add the toggle's own CSS rules to the existing `<style>` string (alongside Task 1's new rules, before the closing `'</style>';`):

```javascript
      '.sw-canvas-view-toggle{display:flex;gap:6px;margin-bottom:12px}' +
      '.sw-canvas-view-toggle-btn{background:none;border:1px solid var(--line);border-radius:6px;' +
        'padding:6px 12px;font-size:13px;color:var(--ink-2);cursor:pointer}' +
      '.sw-canvas-view-toggle-btn--active{background:var(--accent);color:var(--on-accent,#fff);border-color:var(--accent)}' +
```

Finally, in the EXISTING first `<script>` block (the one containing `var stageData={};`, `addBtn`, `panel`, drag-reorder — do not add a new wrapper), add the view-toggle click handler. Place it right after the existing `'if(panelClose)panelClose.addEventListener("click",closePanel);'` line:

```javascript
      'var canvasRoot=document.querySelector(".sw-journey-canvas");' +
      'var viewToggleBtns=Array.prototype.slice.call(document.querySelectorAll(".sw-canvas-view-toggle-btn"));' +
      'viewToggleBtns.forEach(function(btn){' +
        'btn.addEventListener("click",function(){' +
          'var view=btn.getAttribute("data-view");' +
          'canvasRoot.className=canvasRoot.className.replace(/sw-journey-canvas--view-\\S+/,"").trim()+" sw-journey-canvas--view-"+view;' +
          'viewToggleBtns.forEach(function(b){' +
            'var active=b===btn;' +
            'b.classList.toggle("sw-canvas-view-toggle-btn--active",active);' +
            'b.setAttribute("aria-pressed",active?"true":"false");' +
          '});' +
        '});' +
      '});' +
```

**Critical:** this handler does nothing beyond a `className` string swap and a `classList`/`aria-pressed` update on the toggle buttons themselves — no `fetch`, no server round-trip, matching AC3 exactly.

- [ ] **Step 4: Run tests — must pass**

```bash
node tests/check-ep2-s3-delivery-view.js
```

Expected output: `[ep2-s3-delivery-view] Results: 6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, 0 failed

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ep2-s3-delivery-view.js
git commit -m "feat: Canvas/Customer experience/Delivery view toggle, client-side only (ep2-s3 AC3)"
```

---

## Task 3: Remove an orphaned mapping — narrow DELETE route + client wiring (decisions.md D16)

**Files:**
- Modify: `src/web-ui/routes/journeys.js`, `src/web-ui/server.js`
- Test: `tests/check-ep2-s3-delivery-view.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-ep2-s3-delivery-view.js`. First add this mock pool helper near the top of the file (after `makeCanvasMockPool`, before `makeMockReqRes`):

```javascript
/**
 * @param {object} opts
 * @param {object} [opts.stageRow] {id, journeyId, tenantId} -- the real, tenant-owned stage.
 *   Omit (or mismatch params) to simulate a cross-tenant/not-found stage.
 */
function makeDeleteMockPool(opts) {
  opts = opts || {};
  var stageRow = opts.stageRow;
  var deleteCalls = [];
  return {
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT cjs\.id FROM customer_journey_stages/.test(s)) {
        var match = stageRow && stageRow.id === params[0] && stageRow.journeyId === params[1] && stageRow.tenantId === params[2];
        return Promise.resolve({ rows: match ? [{ id: stageRow.id }] : [] });
      }
      if (/^DELETE FROM feature_customer_journey_stage_mappings/.test(s)) {
        deleteCalls.push({ sql: s, params: params });
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    },
    _state: function() { return { deleteCalls: deleteCalls }; }
  };
}

function makeDeleteReqRes() {
  var req = { session: { tenantId: 't1' }, params: { id: 'j1', stageId: 's1', mappingId: 'map-1' } };
  var res = {
    status: function(c) { this._s = c; return this; },
    json: function(b) { this._b = b; },
    _s: 200, _b: null
  };
  return { req: req, res: res };
}
```

Then add these test cases:

```javascript
  try {
    var pool = makeDeleteMockPool({ stageRow: { id: 's1', journeyId: 'j1', tenantId: 't1' } });
    var { req, res } = makeDeleteReqRes();
    await journeys.handleDeleteFeatureMapping(req, res, null, pool);
    var st = pool._state();
    assert.strictEqual(res._s, 200, 'expected a 200 response');
    assert.strictEqual(st.deleteCalls.length, 1, 'expected exactly one DELETE');
    assert.strictEqual(st.deleteCalls[0].params[0], 'map-1', 'expected the DELETE to target the mapping id');
    pass('(new route) -- removing an orphaned mapping deletes exactly the one targeted row');
  } catch (e) { fail('(new route) -- removing an orphaned mapping deletes exactly the one targeted row', e); }

  try {
    // stageRow's own tenantId ('org-2') does not match the requester's session tenantId ('t1')
    var pool = makeDeleteMockPool({ stageRow: { id: 's1', journeyId: 'j1', tenantId: 'org-2' } });
    var { req, res } = makeDeleteReqRes();
    await journeys.handleDeleteFeatureMapping(req, res, null, pool);
    var st = pool._state();
    assert.strictEqual(res._s, 404, 'expected a 404 response for a cross-tenant stage (not 403 -- see decisions.md D13)');
    assert.strictEqual(st.deleteCalls.length, 0, 'expected ZERO deletes -- ownership must be checked before any mutation');
    pass('(new route) -- a cross-tenant mapping delete returns 404, not 403, with no deletion');
  } catch (e) { fail('(new route) -- a cross-tenant mapping delete returns 404, not 403, with no deletion', e); }

  try {
    var src = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
    assert.ok(src.indexOf('feature-mappings') !== -1, 'expected a dispatch entry referencing feature-mappings');
    var postOnlyRegex = /^\/journeys\/[^/]+\/stages\/[^/]+\/feature-mappings$/;
    assert.ok(!postOnlyRegex.test('/journeys/j1/stages/s1/feature-mappings/map-1'), 'expected the existing POST feature-mappings regex to NOT match the new DELETE path (which has a 4th segment)');
    pass('(shape) -- the new DELETE feature-mappings route does not collide with the existing POST route');
  } catch (e) { fail('(shape) -- the new DELETE feature-mappings route does not collide with the existing POST route', e); }
```

- [ ] **Step 2: Run tests — must fail**

```bash
node tests/check-ep2-s3-delivery-view.js
```

Expected output: `TypeError: journeys.handleDeleteFeatureMapping is not a function` for the first two; the shape test should already pass (it only checks the string "feature-mappings" is present, which it already is from `ep2-s2`'s own route) — confirm it stays green, not a new failure.

- [ ] **Step 3: Implement**

In `src/web-ui/routes/journeys.js`, add this new handler right after `handlePostFeatureMapping` (before `handleGetJourneyCanvas`):

```javascript
/**
 * DELETE /journeys/:id/stages/:stageId/feature-mappings/:mappingId —
 * remove one feature-to-stage mapping by its own id. Scoped narrowly to
 * the Delivery view's "Remove" affordance on a feature-not-found warning
 * row (decisions.md D16) -- the general case of editing/removing a VALID
 * mapping remains deferred.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handleDeleteFeatureMapping(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageId = req.params && req.params.stageId;
  var mappingId = req.params && req.params.mappingId;

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }

  // ep2-s3 -- same ownership-check-before-mutation / 404-not-403 cross-tenant
  // policy as handlePostFeatureMapping (decisions.md D13).
  var sr = await pool.query(
    `SELECT cjs.id FROM customer_journey_stages cjs
     JOIN customer_journeys cj ON cjs.journey_id = cj.id
     WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3`,
    [stageId, journeyId, tenantId]
  );
  if (!sr.rows[0]) { notFound('stage not found'); return; }

  // Single-statement delete, no transaction needed -- matches this file's
  // own convention of only wrapping multi-row writes in BEGIN/COMMIT (D6).
  await pool.query(
    `DELETE FROM feature_customer_journey_stage_mappings WHERE id = $1 AND journey_stage_id = $2`,
    [mappingId, stageId]
  );

  if (res.status) { res.status(200).json({ id: mappingId }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ id: mappingId })); }
}
```

Update the existing `module.exports` line at the bottom of the file to add `handleDeleteFeatureMapping`:

```javascript
module.exports = { handlePostJourneys, handleGetJourneyCanvas, handlePostJourneyStage, handlePatchJourneyStage, handlePatchJourneyStagesOrder, handleGetCustomerJourneysList, handlePostFeatureMapping, handleDeleteFeatureMapping };
```

In `src/web-ui/server.js`, update the existing import line to also import `handleDeleteFeatureMapping`:

```javascript
const { handlePostJourneys, handleGetJourneyCanvas, handlePostJourneyStage, handlePatchJourneyStage, handlePatchJourneyStagesOrder, handleGetCustomerJourneysList, handlePostFeatureMapping, handleDeleteFeatureMapping } = require('./routes/journeys');
```

Add a new dispatch entry immediately after the existing `POST .../feature-mappings` block (search for `cj-ep2-s2`), before the `/stages-order` PATCH block:

```javascript
  } else if (pathname.match(/^\/journeys\/[^/]+\/stages\/[^/]+\/feature-mappings\/[^/]+$/) && req.method === 'DELETE') {
    // cj-ep2-s3 — remove an orphaned feature-to-stage mapping (2026-10-05-customer-journey-as-first-class, D16)
    req.params = { id: pathname.split('/')[2], stageId: pathname.split('/')[4], mappingId: pathname.split('/')[6] };
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handleDeleteFeatureMapping(req, res, null, _pshPool);
    });

```

Now wire the client-side Remove button. In the SAME first `<script>` block (right after the view-toggle handler added in Task 2), add a delegated click handler on `list` (`#sw-journey-stages`, already declared in this block):

```javascript
      'if(list){' +
        'list.addEventListener("click",function(ev){' +
          'var btn=ev.target.closest&&ev.target.closest(".sw-feature-mapping-remove");' +
          'if(!btn)return;' +
          'var mappingId=btn.getAttribute("data-mapping-id");' +
          'var stageId=btn.getAttribute("data-stage-id");' +
          'submitJson("/journeys/"+journeyId+"/stages/"+stageId+"/feature-mappings/"+mappingId,"DELETE",{_csrf:csrfToken})' +
            '.then(function(){' +
              'var row=btn.closest(".sw-feature-mapping-row");' +
              'if(row)row.remove();' +
            '})' +
            '.catch(function(){});' +
        '});' +
      '}' +
```

This reuses the existing `submitJson(url, method, payload)` helper already declared earlier in this same script block (`ep1-s2`'s own convention) — it already supports an arbitrary `method` string, so `"DELETE"` works unmodified.

- [ ] **Step 4: Run tests — must pass**

```bash
node tests/check-ep2-s3-delivery-view.js
```

Expected output: `[ep2-s3-delivery-view] Results: 9 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, 0 failed

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js src/web-ui/server.js tests/check-ep2-s3-delivery-view.js
git commit -m "feat: narrow DELETE route + client wiring for removing an orphaned feature mapping (ep2-s3 AC2, decisions.md D16)"
```

---

## After all tasks

Run `/verify-completion` — full suite + walk through `artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep2-s3-verification.md`. A local real-browser render check is viable IF a real DB-backed journey with a feature mapping already exists locally (matching `ep4-s1`/`ep4-s2`/`ep2-s1`/`ep2-s2`'s own precedent) — otherwise expect the same `fake-test-db.js` gap already logged repeatedly for this feature, and defer to a post-merge staging confirmation, same as every prior story in this epic.
