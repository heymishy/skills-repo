# Journey health indicators: per-stage health state and summary bar — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass (6 tests covering all 6 ACs).
**Branch:** `feature/cj-ep3-s2`
**Worktree:** `.worktrees/cj-ep3-s2`
**Test command:** `npm test`

---

## File map

```
Create:
  tests/check-ep3-s2-journey-health.js  — 6 tests covering all 6 ACs

Modify:
  src/web-ui/routes/journeys.js  — handleGetJourneyCanvas gains: CHECK_ICON/CLOSE_ICON
                                    constants; computeStageHealth()/buildHealthIndicator()
                                    helpers; a health indicator per stage card; a summary
                                    bar; window.location.reload() added to the existing
                                    Save-mapping (ep2-s2) and Remove-mapping (ep2-s3)
                                    success handlers
```

No changes to `src/web-ui/server.js` — no new route or query.

---

## Task 1: Health indicator computation, per-stage rendering, and summary bar (AC1, AC2, AC3, AC4, AC5)

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep3-s2-journey-health.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-ep3-s2-journey-health.js` with this content:

```javascript
'use strict';
// check-ep3-s2-journey-health.js -- TDD tests for ep3-s2 (Epic 3,
// customer-journey feature). Story:
// artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s2.md
// Test plan:
// artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep3-s2-test-plan.md
const assert = require('assert');
const fs = require('fs');
const { JSDOM } = require('jsdom');

let passed = 0; let failed = 0;
function pass(name) { console.log('  [PASS] ' + name); passed++; }
function fail(name, err) { console.error('  [FAIL] ' + name + ': ' + (err.message || err)); failed++; }

/**
 * @param {object} journeyRow {id, name, description}
 * @param {Array<object>} stageRows full-row stage data for handleGetJourneyCanvas's own render
 * @param {Array<object>} [mappingRows] rows from feature_customer_journey_stage_mappings
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

(async function() {
  var journeys = require('../src/web-ui/routes/journeys');

  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's1', name: 'Stage 1', position: 0 }],
      [{ id: 'map-1', journey_stage_id: 's1', feature_slug: 'feat-a', metric_keys: ['m1'] }]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(/class="[^"]*sw-stage-health--covered[^"]*"[^>]*aria-label="Health: Covered"/.test(out), 'expected a covered health indicator with an aria-label for s1');
    pass('AC1, AC5 -- a stage with a mapping + selected metric key shows the covered health indicator with an accessible label');
  } catch (e) { fail('AC1, AC5 -- a stage with a mapping + selected metric key shows the covered health indicator with an accessible label', e); }

  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's2', name: 'Stage 2', position: 0 }],
      [{ id: 'map-2', journey_stage_id: 's2', feature_slug: 'feat-a', metric_keys: [] }]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(/class="[^"]*sw-stage-health--partial[^"]*"[^>]*aria-label="Health: Needs metrics"/.test(out), 'expected a partial health indicator with an aria-label for s2');
    pass('AC2, AC5 -- a stage with mapped features but zero metric keys shows the partial health indicator with an accessible label');
  } catch (e) { fail('AC2, AC5 -- a stage with mapped features but zero metric keys shows the partial health indicator with an accessible label', e); }

  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's3', name: 'Stage 3', position: 0 }],
      []
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(/class="[^"]*sw-stage-health--none[^"]*"[^>]*aria-label="Health: No coverage"/.test(out), 'expected a none health indicator with an aria-label for s3');
    pass('AC3, AC5 -- a stage with no mapped features shows the none health indicator with an accessible label');
  } catch (e) { fail('AC3, AC5 -- a stage with no mapped features shows the none health indicator with an accessible label', e); }

  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [
        { id: 's1', name: 'Stage 1', position: 0 },
        { id: 's2', name: 'Stage 2', position: 1 },
        { id: 's3', name: 'Stage 3', position: 2 }
      ],
      [
        { id: 'map-1', journey_stage_id: 's1', feature_slug: 'feat-a', metric_keys: ['m1'] },
        { id: 'map-2', journey_stage_id: 's2', feature_slug: 'feat-a', metric_keys: [] }
      ]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('1 of 3 stages have metric coverage') !== -1, 'expected the summary bar to show "1 of 3 stages have metric coverage"');
    pass('AC4 -- the summary bar shows the correct X of Y stages have metric coverage count');
  } catch (e) { fail('AC4 -- the summary bar shows the correct X of Y stages have metric coverage count', e); }

  console.log('\n[ep3-s2-journey-health] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
```

- [ ] **Step 2: Run tests — must fail**

```bash
node tests/check-ep3-s2-journey-health.js
```

Expected output: all 4 tests fail — no `.sw-stage-health` markup or summary bar text exists yet.

- [ ] **Step 3: Implement**

In `src/web-ui/routes/journeys.js`, add two new icon constants right after the existing `WARNING_ICON` definition (search for `var WARNING_ICON =`, insert after its closing `'</svg>';`):

```javascript
  // ep3-s2 -- 14x14/20x20-viewBox/1.5px-stroke icons per DESIGN.md's own
  // icon spec, not unicode glyphs -- matches MOMENT_OF_TRUTH_ICON/
  // ARROW_UP_ICON/ARROW_DOWN_ICON/WARNING_ICON's own precedent above.
  var CHECK_ICON =
    '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M4 10l4 4 8-8"/>' +
    '</svg>';
  var CLOSE_ICON =
    '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M5 5l10 10M15 5L5 15"/>' +
    '</svg>';
```

Right after the existing `buildCustomerExperienceAnnotations` function (before the `// AC4: each saved stage renders...` comment and the `var stagesHtml = ...` assignment), add:

```javascript
  // ep3-s2 -- health state is a pure function of the already-fetched
  // mappingsByStage data (ep2-s3) -- no new query. Zero mappings => none
  // (❌); >=1 mapping, none with metric_keys.length>0 => partial (⚠️);
  // >=1 mapping with at least one having metric_keys.length>0 => covered
  // (✅).
  function computeStageHealth(stageId) {
    var mappings = mappingsByStage[stageId] || [];
    if (mappings.length === 0) return 'none';
    var hasMetrics = mappings.some(function(m) {
      return Array.isArray(m.metric_keys) && m.metric_keys.length > 0;
    });
    return hasMetrics ? 'covered' : 'partial';
  }

  var HEALTH_META = {
    covered: { icon: CHECK_ICON, label: 'Covered', className: 'sw-stage-health--covered' },
    partial: { icon: WARNING_ICON, label: 'Needs metrics', className: 'sw-stage-health--partial' },
    none: { icon: CLOSE_ICON, label: 'No coverage', className: 'sw-stage-health--none' }
  };

  // ep3-s2 -- icon + accessible label together, never colour/icon alone
  // (MC-A11Y-02, AC5).
  function buildHealthIndicator(stageId) {
    var health = computeStageHealth(stageId);
    var meta = HEALTH_META[health];
    return '<span class="sw-stage-health ' + meta.className + '" role="img" aria-label="Health: ' + meta.label + '">' +
      meta.icon + ' ' + meta.label +
    '</span>';
  }
```

Inside the `stages.map(function(s, idx) { ... })` callback's `return (...)` block, find this line:

```javascript
            '<span class="sw-stage-name">' + escHtml(s.name) + '</span>' +
```

Add the health indicator right after it:

```javascript
            '<span class="sw-stage-name">' + escHtml(s.name) + '</span>' +
            buildHealthIndicator(s.id) +
```

Right after the existing `stagesHtml` assignment (its own `: '<p class="sw-journey-stages-empty">...'` fallback and closing `;`), add the summary bar computation:

```javascript
  // ep3-s2 AC4 -- X counts only 'covered' stages; Y is the total stage
  // count regardless of health state.
  var coveredStageCount = stages.filter(function(s) { return computeStageHealth(s.id) === 'covered'; }).length;
  var summaryBarHtml = '<p class="sw-journey-health-summary">' + coveredStageCount + ' of ' + stages.length + ' stages have metric coverage</p>';
```

In the `bodyContent` assignment, find:

```javascript
      viewToggleHtml +
      '<div class="sw-journey-stages" id="sw-journey-stages">' +
```

Add `summaryBarHtml` between them:

```javascript
      viewToggleHtml +
      summaryBarHtml +
      '<div class="sw-journey-stages" id="sw-journey-stages">' +
```

Finally, add the new CSS rules to the existing `<style>` string (the one containing `.sw-stage-annotations{...}`, `.sw-canvas-view-toggle{...}`, `.sw-stage-emotion-chip{...}` — the SAME block `ep2-s3`/`ep3-s1` already appended to) — append these rules right before its closing `'</style>';`:

```javascript
      '.sw-stage-health{display:inline-flex;align-items:center;gap:4px;margin-left:8px;font-size:11px}' +
      '.sw-stage-health--covered{color:var(--success)}' +
      '.sw-stage-health--partial{color:var(--warn)}' +
      '.sw-stage-health--none{color:var(--danger)}' +
      '.sw-journey-health-summary{font-size:13px;color:var(--ink-2);margin-bottom:8px}' +
```

- [ ] **Step 4: Run tests — must pass**

```bash
node tests/check-ep3-s2-journey-health.js
```

Expected output: `[ep3-s2-journey-health] Results: 4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, 0 failed.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ep3-s2-journey-health.js
git commit -m "feat: journey health indicators per stage card + summary bar (ep3-s2 AC1-AC5)"
```

---

## Task 2: Reload Save-mapping and Remove-mapping on success so health reflects the new state (AC6)

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep3-s2-journey-health.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-ep3-s2-journey-health.js`, inside the `(async function() { ... })()` IIFE, before the final summary-line block. First add this helper (after `withMockedPipelineState`, before the main test body):

```javascript
// Extracts the FIRST <script> block (stage-panel/canvas/Remove handler,
// ep1-s2/ep1-s3/ep1-s4/ep2-s3) and the SECOND <script> block (feature-picker/
// Save handler, ep2-s1/ep2-s2/ep2-s3) separately -- the two handlers this
// task modifies live in different blocks and must each be eval'd with the
// other's own DOM already present.
function extractScriptByMarker(html, marker) {
  var idx = html.indexOf(marker);
  assert.ok(idx !== -1, 'expected to find marker: ' + marker);
  var start = html.lastIndexOf('<script>', idx);
  var end = html.indexOf('</script>', idx);
  assert.ok(start !== -1 && end !== -1, 'expected enclosing <script>...</script> tags for marker: ' + marker);
  return html.slice(start + '<script>'.length, end);
}

function buildFullDom(bodyContent) {
  var dom = new JSDOM('<!DOCTYPE html><html><body>' + bodyContent + '</body></html>', {
    runScripts: 'outside-only',
    url: 'http://localhost/journeys/j1'
  });
  dom.window.eval(extractScriptByMarker(bodyContent, 'var stageData={};'));
  dom.window.eval(extractScriptByMarker(bodyContent, 'var fpModal=document.getElementById'));
  return dom;
}
```

Then add the two test cases:

```javascript
  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's1', name: 'Stage 1', position: 0 }],
      []
    );
    var featuresJson = JSON.stringify({ features: [{ slug: 'feat-a', name: 'Feature A', metricKeys: ['M1'] }] });
    var bodyContent = await withMockedPipelineState(featuresJson, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    var dom = buildFullDom(bodyContent);
    var win = dom.window;
    win.fetch = function() { return Promise.resolve({ ok: true, json: function() { return Promise.resolve({}); } }); };
    var reloadCalls = 0;
    Object.defineProperty(win.location, 'reload', { value: function() { reloadCalls++; }, configurable: true });

    win.document.querySelector('.sw-stage-map-feature').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    win.document.querySelector('.sw-feature-picker-item').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    var checkbox = win.document.querySelector('.sw-feature-mapping-metric-checkbox');
    checkbox.checked = true;
    win.document.getElementById('sw-feature-mapping-save').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));

    await new Promise(function(resolve) { setTimeout(resolve, 0); });
    assert.strictEqual(reloadCalls, 1, 'expected window.location.reload to be called exactly once after a successful Save');
    pass('AC6 -- saving a feature mapping triggers a reload so the health indicator reflects the new state');
  } catch (e) { fail('AC6 -- saving a feature mapping triggers a reload so the health indicator reflects the new state', e); }

  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's1', name: 'Stage 1', position: 0 }],
      [{ id: 'map-1', journey_stage_id: 's1', feature_slug: 'ghost-feature', metric_keys: [] }]
    );
    var bodyContent = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    var dom = buildFullDom(bodyContent);
    var win = dom.window;
    win.fetch = function() { return Promise.resolve({ ok: true, json: function() { return Promise.resolve({}); } }); };
    var reloadCalls = 0;
    Object.defineProperty(win.location, 'reload', { value: function() { reloadCalls++; }, configurable: true });

    win.document.querySelector('.sw-feature-mapping-remove').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    await new Promise(function(resolve) { setTimeout(resolve, 0); });
    assert.strictEqual(reloadCalls, 1, 'expected window.location.reload to be called exactly once after a successful Remove');
    pass('AC6 -- removing an orphaned mapping triggers a reload so the health indicator reflects the new state');
  } catch (e) { fail('AC6 -- removing an orphaned mapping triggers a reload so the health indicator reflects the new state', e); }
```

- [ ] **Step 2: Run tests — must fail**

```bash
node tests/check-ep3-s2-journey-health.js
```

Expected: the 2 new AC6 tests fail (`reloadCalls` stays 0 — neither handler calls reload yet); the 4 Task 1 tests still pass.

- [ ] **Step 3: Implement**

In `src/web-ui/routes/journeys.js`, find the Remove-mapping handler's success callback (search for `'if(row)row.remove();'`, inside the FIRST `<script>` block):

```javascript
            '.then(function(){' +
              'var row=btn.closest(".sw-feature-mapping-row");' +
              'if(row)row.remove();' +
            '})' +
```

Replace with (adding the reload call after the existing row removal):

```javascript
            '.then(function(){' +
              'var row=btn.closest(".sw-feature-mapping-row");' +
              'if(row)row.remove();' +
              'window.location.reload();' +
            '})' +
```

Find the Save-mapping handler's success callback (search for `'fpCloseFn();'`, inside the SECOND `<script>` block):

```javascript
          '}).then(function(r){' +
            'if(!r.ok){return r.json().then(function(j){throw new Error((j&&j.error)||"Request failed");});}' +
            'fpCloseFn();' +
          '}).catch(function(e){' +
```

Replace with (adding the reload call after the existing `fpCloseFn()`):

```javascript
          '}).then(function(r){' +
            'if(!r.ok){return r.json().then(function(j){throw new Error((j&&j.error)||"Request failed");});}' +
            'fpCloseFn();' +
            'window.location.reload();' +
          '}).catch(function(e){' +
```

**Critical:** do not add any other behavioural change to either handler — this is a single, scoped addition per handler, operator-confirmed (decisions.md).

- [ ] **Step 4: Run tests — must pass**

```bash
node tests/check-ep3-s2-journey-health.js
```

Expected output: `[ep3-s2-journey-health] Results: 6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, 0 failed.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ep3-s2-journey-health.js
git commit -m "feat: reload Save-mapping and Remove-mapping on success so health reflects the new state (ep3-s2 AC6)"
```

---

## After all tasks

Run `/verify-completion` — full suite + walk through `artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep3-s2-verification.md`. A local real-browser render check is viable IF a real DB-backed journey with existing feature mappings exists locally — otherwise expect the same `fake-test-db.js` gap already logged repeatedly for this feature, and defer to a post-merge staging confirmation, same as every prior story in this epic.
