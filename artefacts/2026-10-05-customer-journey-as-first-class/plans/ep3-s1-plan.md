# Customer experience view: emotion, pain points, opportunities annotation rows — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass (4 tests covering all 4 ACs).
**Branch:** `feature/cj-ep3-s1`
**Worktree:** `.worktrees/cj-ep3-s1`
**Test command:** `npm test`

---

## File map

```
Create:
  tests/check-ep3-s1-customer-experience-view.js  — 4 tests covering all 4 ACs

Modify:
  src/web-ui/routes/journeys.js  — handleGetJourneyCanvas's stagesHtml map gains a new
                                    sibling annotation block per stage (buildCustomerExperienceAnnotations);
                                    the existing <style> block gains new CSS rules
```

No changes to `src/web-ui/server.js` — this story adds no new route. No changes to the existing `<script>` blocks — the view toggle and its click handler already exist (built by `ep2-s3`, Task 2) and are already fully generic for any `data-view` value.

---

## Task 1: Customer experience annotation rows (AC1, AC2, AC3, AC4)

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep3-s1-customer-experience-view.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-ep3-s1-customer-experience-view.js` with this content:

```javascript
'use strict';
// check-ep3-s1-customer-experience-view.js -- TDD tests for ep3-s1 (Epic 3,
// customer-journey feature). Story:
// artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s1.md
// Test plan:
// artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep3-s1-test-plan.md
const assert = require('assert');
const { JSDOM } = require('jsdom');

let passed = 0; let failed = 0;
function pass(name) { console.log('  [PASS] ' + name); passed++; }
function fail(name, err) { console.error('  [FAIL] ' + name + ': ' + (err.message || err)); failed++; }

/**
 * @param {object} journeyRow {id, name, description}
 * @param {Array<object>} stageRows full-row stage data for handleGetJourneyCanvas's own render
 */
function makeCanvasMockPool(journeyRow, stageRows) {
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
        return Promise.resolve({ rows: [] });
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
  var fs = require('fs');
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
// ep1-s2/ep1-s3/ep1-s4/ep2-s3 built, containing the already-generic view-toggle
// click handler this story reuses unmodified.
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
      [{ id: 's1', name: 'Stage 1', position: 0, emotion: 'positive', pain_points: 'Checkout is slow', opportunities: 'Add express checkout' }]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(/<span[^>]*class="[^"]*sw-stage-emotion-chip[^"]*"[^>]*>positive<\/span>/.test(out), 'expected an emotion chip element containing the literal text "positive"');
    assert.ok(out.indexOf('Checkout is slow') !== -1, 'expected the pain points text to render');
    assert.ok(out.indexOf('Add express checkout') !== -1, 'expected the opportunities text to render');
    pass('AC1, AC4 -- Customer experience view shows emotion chip+label, pain points, and opportunities');
  } catch (e) { fail('AC1, AC4 -- Customer experience view shows emotion chip+label, pain points, and opportunities', e); }

  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's2', name: 'Stage 2', position: 0, emotion: null, pain_points: null, opportunities: null }]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    var matches = out.match(/Not set/g) || [];
    assert.strictEqual(matches.length, 3, 'expected exactly 3 occurrences of "Not set" (one per row: emotion, pain points, opportunities), got ' + matches.length);
    pass('AC2 -- a stage with nothing set shows "Not set" for all three rows, none omitted');
  } catch (e) { fail('AC2 -- a stage with nothing set shows "Not set" for all three rows, none omitted', e); }

  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's1', name: 'Stage 1', position: 0, emotion: 'positive', pain_points: 'X', opportunities: 'Y' }]
    );
    var bodyContent = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    var dom = buildDom(bodyContent);
    var win = dom.window;
    var fetchCalls = [];
    win.fetch = function(url, opts) { fetchCalls.push({ url: url, opts: opts }); return Promise.resolve({ ok: true, json: function() { return Promise.resolve({}); } }); };

    var canvasRoot = win.document.querySelector('.sw-journey-canvas');
    var cxBtn = win.document.querySelector('.sw-canvas-view-toggle-btn[data-view="customer-experience"]');
    var canvasBtn = win.document.querySelector('.sw-canvas-view-toggle-btn[data-view="canvas"]');
    var annotations = win.document.querySelector('.sw-stage-annotations--customer-experience');

    assert.strictEqual(win.getComputedStyle(annotations).display, 'none', 'expected the Customer experience annotation block hidden by default');

    cxBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    assert.ok(canvasRoot.className.indexOf('sw-journey-canvas--view-customer-experience') !== -1, 'expected the canvas root to gain the customer-experience view class');
    assert.strictEqual(win.getComputedStyle(annotations).display, 'block', 'expected the annotation block to become visible in Customer experience view');

    canvasBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    assert.ok(canvasRoot.className.indexOf('sw-journey-canvas--view-customer-experience') === -1, 'expected the customer-experience view class to be removed after clicking Canvas');
    assert.strictEqual(win.getComputedStyle(annotations).display, 'none', 'expected the annotation block hidden again in Canvas view');

    assert.strictEqual(fetchCalls.length, 0, 'expected ZERO fetch calls -- the view toggle must never hit the network');
    pass('AC3 -- switching to the Customer experience view shows the annotation rows via CSS class, with no server round-trip');
  } catch (e) { fail('AC3 -- switching to the Customer experience view shows the annotation rows via CSS class, with no server round-trip', e); }

  console.log('\n[ep3-s1-customer-experience-view] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
```

- [ ] **Step 2: Run tests — must fail**

```bash
node tests/check-ep3-s1-customer-experience-view.js
```

Expected output: all 3 tests fail — no `.sw-stage-emotion-chip`/`.sw-stage-annotations--customer-experience` markup exists yet.

- [ ] **Step 3: Implement**

In `src/web-ui/routes/journeys.js`, add a new helper function right after the existing `buildDeliveryAnnotations` function (which ends around line 530, just before `var stagesHtml = ...`):

```javascript
  // ep3-s1 -- builds one stage's Customer experience annotation markup:
  // emotion (colour chip + text label, MC-A11Y-02 -- never colour alone),
  // pain points, opportunities. All three rows always render, "Not set"
  // when the underlying column is null -- never omitted (AC2).
  function buildCustomerExperienceAnnotations(s) {
    var emotionHtml = s.emotion
      ? '<span class="sw-stage-emotion-chip sw-stage-emotion-chip--' + escHtml(s.emotion) + '">' + escHtml(s.emotion) + '</span>'
      : 'Not set';
    return (
      '<p class="sw-stage-cx-row"><strong>Emotion:</strong> ' + emotionHtml + '</p>' +
      '<p class="sw-stage-cx-row"><strong>Pain points:</strong> ' + (s.pain_points ? escHtml(s.pain_points) : 'Not set') + '</p>' +
      '<p class="sw-stage-cx-row"><strong>Opportunities:</strong> ' + (s.opportunities ? escHtml(s.opportunities) : 'Not set') + '</p>'
    );
  }
```

Then find this existing block inside the `stages.map(function(s, idx) { ... })` callback's `return (...)`:

```javascript
          '</div>' +
          '<div class="sw-stage-annotations sw-stage-annotations--delivery" data-stage-id="' + escHtml(s.id) + '">' +
            buildDeliveryAnnotations(s.id) +
          '</div>'
        );
```

Replace it with (adding the new Customer experience annotation block as a second sibling, right after the Delivery one):

```javascript
          '</div>' +
          '<div class="sw-stage-annotations sw-stage-annotations--delivery" data-stage-id="' + escHtml(s.id) + '">' +
            buildDeliveryAnnotations(s.id) +
          '</div>' +
          '<div class="sw-stage-annotations sw-stage-annotations--customer-experience" data-stage-id="' + escHtml(s.id) + '">' +
            buildCustomerExperienceAnnotations(s) +
          '</div>'
        );
```

**Critical:** `buildCustomerExperienceAnnotations(s)` takes the FULL stage row object directly (`s`, already in scope inside this `.map()` callback) — unlike `buildDeliveryAnnotations(stageId)`, it does NOT need a lookup, since `emotion`/`pain_points`/`opportunities` are already present on `s` from the existing stages query.

Finally, add the new CSS rules to the existing `<style>` string (the one containing `.sw-stage-annotations{...}`, `.sw-journey-canvas--view-delivery ...`, `.sw-canvas-view-toggle{...}` — appended by `ep2-s3`) — append these rules right before its closing `'</style>';`:

```javascript
      '.sw-journey-canvas--view-customer-experience .sw-stage-annotations--customer-experience{display:block}' +
      '.sw-stage-cx-row{margin:4px 0}' +
      '.sw-stage-emotion-chip{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;color:#fff}' +
      '.sw-stage-emotion-chip--positive{background:var(--success)}' +
      '.sw-stage-emotion-chip--negative{background:var(--danger)}' +
      '.sw-stage-emotion-chip--mixed{background:var(--warn)}' +
      '.sw-stage-emotion-chip--neutral{background:var(--ink-2)}' +
```

**Critical:** no changes to any `<script>` block are needed or permitted for this story — the view-toggle click handler already built by `ep2-s3` is fully generic (reads `data-view` off whichever button was clicked) and already works correctly for the "Customer experience" button without modification.

- [ ] **Step 4: Run tests — must pass**

```bash
node tests/check-ep3-s1-customer-experience-view.js
```

Expected output: `[ep3-s1-customer-experience-view] Results: 3 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, 0 failed. (Note: if `check-pcr-s1-test-runner.js` or `check-pcr-s3.3-multi-user-tenant-journey.spec.js`-style tests fail transiently due to known unrelated flakiness documented in `workspace/capture-log.md`, re-run once to confirm before treating it as a real regression.)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ep3-s1-customer-experience-view.js
git commit -m "feat: Customer experience view -- emotion chip+label, pain points, opportunities (ep3-s1)"
```

---

## After all tasks

Run `/verify-completion` — full suite + walk through `artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep3-s1-verification.md`. A local real-browser render check is viable IF a real DB-backed journey with emotion/pain_points/opportunities already set exists locally — otherwise expect the same `fake-test-db.js` gap already logged repeatedly for this feature, and defer to a post-merge staging confirmation, same as every prior story in this epic.
