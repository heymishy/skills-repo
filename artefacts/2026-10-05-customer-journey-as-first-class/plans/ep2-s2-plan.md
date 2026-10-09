# Feature-to-stage mapping: save mapping with metric key selection — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass (7 tests covering all 5 ACs), plus 2 additional jsdom behavioral tests proactively added to pre-empt the markup-only-test gap this feature's code-quality review has already flagged twice on `ep2-s1`.
**Branch:** `feature/cj-ep2-s2`
**Worktree:** `.worktrees/cj-ep2-s2`
**Test command:** `npm test`

---

## File map

```
Create:
  tests/check-ep2-s2-feature-mapping-save.js  — 9 tests covering all 5 ACs + shape + 2 behavioral

Modify:
  src/web-ui/routes/journeys.js  — handleGetJourneyCanvas embeds featureMetricKeys;
                                    feature-picker modal gains a metric-key sub-view;
                                    the existing second <script> block gains a feature-click
                                    handler, metric-key rendering, Back/Save wiring;
                                    new handler handlePostFeatureMapping; module.exports updated
  src/web-ui/server.js           — one new dispatch entry + import update
```

---

## Task 1: Metric-key picker UI (AC1)

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep2-s2-feature-mapping-save.js`

- [x] **Step 1: Write the failing tests**

Create `tests/check-ep2-s2-feature-mapping-save.js` with this initial content:

```javascript
'use strict';
// check-ep2-s2-feature-mapping-save.js -- TDD tests for ep2-s2 (Epic 2,
// customer-journey feature). Story:
// artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s2.md
// Test plan:
// artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s2-test-plan.md
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

// Extracts the SECOND <script> block journeys.js renders -- the one
// ep2-s1's own Task 2 added (fpModal/fpClose/fpSearch/swFilterFeaturePicker),
// which this story extends with feature-selection + metric-key + save
// wiring. Same marker-based extraction technique as
// tests/check-ep2-s1-feature-picker.js's own jsdom behavioral tests.
function extractFeaturePickerScript(html) {
  var marker = 'var fpModal=document.getElementById("sw-feature-picker-modal");';
  var idx = html.indexOf(marker);
  assert.ok(idx !== -1, 'expected the feature-picker script to be present in the rendered HTML');
  var start = html.lastIndexOf('<script>', idx);
  var end = html.indexOf('</script>', idx);
  assert.ok(start !== -1 && end !== -1, 'expected enclosing <script>...</script> tags');
  return html.slice(start + '<script>'.length, end);
}

function buildDom(bodyContent) {
  var scriptSrc = extractFeaturePickerScript(bodyContent);
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
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [{ id: 's1', name: 'Stage 1', position: 0 }]);
    var featuresJson = JSON.stringify({ features: [
      { slug: 'feat-a', name: 'Feature A', metricKeys: ['M1', 'M2'] },
      { slug: 'feat-b', name: 'Feature B' }
    ] });
    var out = await withMockedPipelineState(featuresJson, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('"feat-a":["M1","M2"]') !== -1, 'expected featureMetricKeys to embed feat-a\'s own metric keys');
    assert.ok(out.indexOf('"feat-b":[]') !== -1, 'expected featureMetricKeys to embed an empty array for feat-b (no metricKeys field)');
    pass('AC1 (shape) -- featureMetricKeys JSON embedded correctly per feature');
  } catch (e) { fail('AC1 (shape) -- featureMetricKeys JSON embedded correctly per feature', e); }

  try {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [{ id: 's1', name: 'Stage 1', position: 0 }]);
    var featuresJson = JSON.stringify({ features: [
      { slug: 'feat-a', name: 'Feature A', metricKeys: ['M1', 'M2'] },
      { slug: 'feat-b', name: 'Feature B' }
    ] });
    var bodyContent = await withMockedPipelineState(featuresJson, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    var dom = buildDom(bodyContent);
    var win = dom.window;
    var items = Array.prototype.slice.call(win.document.querySelectorAll('.sw-feature-picker-item'));
    var itemA = items.find(function(li) { return li.querySelector('.sw-feature-picker-slug').textContent === 'feat-a'; });
    var itemB = items.find(function(li) { return li.querySelector('.sw-feature-picker-slug').textContent === 'feat-b'; });
    assert.ok(itemA && itemB, 'expected both feat-a and feat-b list items to be present');

    itemA.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    var mapView = win.document.getElementById('sw-feature-mapping-view');
    assert.strictEqual(mapView.style.display, 'block', 'expected the metric-key sub-view to become visible after clicking a feature');
    var checkboxesA = Array.prototype.slice.call(mapView.querySelectorAll('.sw-feature-mapping-metric-checkbox'));
    assert.strictEqual(checkboxesA.length, 2, 'expected 2 metric-key checkboxes for feat-a');
    assert.deepStrictEqual(checkboxesA.map(function(cb) { return cb.value; }), ['M1', 'M2'], 'expected checkbox values M1, M2 in order');

    itemB.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    assert.ok(mapView.textContent.indexOf('No metrics recorded') !== -1, 'expected "No metrics recorded" for feat-b');
    assert.strictEqual(mapView.querySelectorAll('.sw-feature-mapping-metric-checkbox').length, 0, 'expected zero checkboxes for feat-b');
    pass('AC1 (behavioral) -- selecting a feature shows real metric-key checkboxes, or "No metrics recorded"');
  } catch (e) { fail('AC1 (behavioral) -- selecting a feature shows real metric-key checkboxes, or "No metrics recorded"', e); }

  console.log('\n[ep2-s2-feature-mapping-save] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
```

- [x] **Step 2: Run tests — must fail**

```bash
node tests/check-ep2-s2-feature-mapping-save.js
```

Expected output: both tests fail — `featureMetricKeys` is not embedded, `#sw-feature-mapping-view` does not exist.

- [x] **Step 3: Implement**

In `src/web-ui/routes/journeys.js`, inside `handleGetJourneyCanvas`, immediately after the existing block that computes `features`/`featuresLoadError` (the `try { ... } catch (_) { featuresLoadError = true; }` block from `ep2-s1`), add:

```javascript
  // ep2-s2 -- embed each feature's own optional metricKeys (string[]) for the
  // metric-key sub-view, keyed by the feature's REAL (not lowercased) slug.
  // Nothing currently writes this field (decisions.md D12) -- every feature
  // today falls through to the explicit "No metrics recorded" fallback,
  // forward-compatible once a future story defines the write path.
  var featureMetricKeysJson = JSON.stringify(features.reduce(function(acc, f) {
    acc[f.slug] = Array.isArray(f.metricKeys) ? f.metricKeys : [];
    return acc;
  }, {}));
```

Then, in the existing `featurePickerModalHtml` construction, add a new sub-view div INSIDE the same `#sw-feature-picker-modal` container, right after the closing `</div>` of `.sw-feature-picker-header` and the `featurePickerBodyHtml` variable (i.e., as a sibling of the body content, still inside the modal's outer div):

```javascript
  // ep2-s2 -- metric-key sub-view. Hidden by default; shown by the script
  // block below when a feature is clicked. Built client-side from the
  // embedded featureMetricKeys map (mirrors ep1-s3's own stageData
  // embedding precedent -- embed once server-side, populate via JS at
  // interaction time, no second round trip).
  var featureMappingViewHtml =
    '<div id="sw-feature-mapping-view" class="sw-feature-mapping-view" style="display:none">' +
      '<h3 id="sw-feature-mapping-name"></h3>' +
      '<p id="sw-feature-mapping-slug" class="sw-feature-picker-slug"></p>' +
      '<div id="sw-feature-mapping-metrics"></div>' +
      '<button type="button" id="sw-feature-mapping-back">Back</button>' +
      '<button type="button" id="sw-feature-mapping-save">Save mapping</button>' +
      '<span id="sw-feature-mapping-error" class="sw-feature-picker-message" role="status"></span>' +
    '</div>';

  var featurePickerModalHtml =
    '<div id="sw-feature-picker-modal" class="sw-feature-picker-modal" role="dialog" aria-modal="true" aria-labelledby="sw-feature-picker-title" aria-hidden="true">' +
      '<div class="sw-feature-picker-header">' +
        '<h2 id="sw-feature-picker-title">Map feature</h2>' +
        '<button type="button" id="sw-feature-picker-close" aria-label="Close feature picker">✕</button>' +
      '</div>' +
      featurePickerBodyHtml +
      featureMappingViewHtml +
    '</div>' +
    '<style>' +
      // ... existing <style> block UNCHANGED, plus these new rules appended
      // before the closing '</style>':
      '.sw-feature-mapping-view{margin-top:4px}' +
      '.sw-feature-mapping-metric-label{display:block;font-size:13px;color:var(--ink);margin:6px 0}' +
      '#sw-feature-mapping-save{margin-left:8px}' +
    '</style>';
```

(This replaces the existing `featurePickerModalHtml` assignment — keep every existing line, insert `featureMappingViewHtml` where shown, and append the 3 new CSS rules inside the existing `<style>` string before its closing `'</style>';`.)

Finally, extend the EXISTING second `<script>` block (the one `ep2-s1`'s own Task 2/3 built, containing `fpModal`/`fpClose`/`fpSearch`/`fpOpen`/`fpCloseFn`/`swFilterFeaturePicker` — do not add a third wrapper). Add these lines right after the existing `var fpTriggerEl=null;` declaration, and BEFORE the existing `function fpOpen(trigger){...}`:

```javascript
      'var featureMetricKeys=' + featureMetricKeysJson + ';' +
      'var fmView=document.getElementById("sw-feature-mapping-view");' +
      'var fmNameEl=document.getElementById("sw-feature-mapping-name");' +
      'var fmSlugEl=document.getElementById("sw-feature-mapping-slug");' +
      'var fmMetricsEl=document.getElementById("sw-feature-mapping-metrics");' +
      'var fmBack=document.getElementById("sw-feature-mapping-back");' +
      'var fmSelectedSlug=null;' +
      'function fmShowList(){' +
        'fmView.style.display="none";' +
        'var listEl=document.getElementById("sw-feature-picker-list");' +
        'var searchLabel=document.querySelector(".sw-feature-picker-search-label");' +
        'if(listEl)listEl.style.display="";' +
        'if(searchLabel)searchLabel.style.display="";' +
      '}' +
      'function fmShowFeature(slug,name){' +
        'fmSelectedSlug=slug;' +
        'fmNameEl.textContent=name;' +
        'fmSlugEl.textContent=slug;' +
        'var keys=featureMetricKeys[slug]||[];' +
        'fmMetricsEl.innerHTML="";' +
        'if(keys.length===0){' +
          'var p=document.createElement("p");' +
          'p.className="sw-feature-picker-message";' +
          'p.textContent="No metrics recorded";' +
          'fmMetricsEl.appendChild(p);' +
        '}else{' +
          'keys.forEach(function(k){' +
            'var label=document.createElement("label");' +
            'label.className="sw-feature-mapping-metric-label";' +
            'var cb=document.createElement("input");' +
            'cb.type="checkbox";' +
            'cb.value=k;' +
            'cb.className="sw-feature-mapping-metric-checkbox";' +
            'label.appendChild(cb);' +
            'label.appendChild(document.createTextNode(" "+k));' +
            'fmMetricsEl.appendChild(label);' +
          '});' +
        '}' +
        'var listEl=document.getElementById("sw-feature-picker-list");' +
        'var searchLabel=document.querySelector(".sw-feature-picker-search-label");' +
        'if(listEl)listEl.style.display="none";' +
        'if(searchLabel)searchLabel.style.display="none";' +
        'fmView.style.display="block";' +
      '}' +
      'if(fmBack)fmBack.addEventListener("click",fmShowList);' +
      'Array.prototype.slice.call(document.querySelectorAll(".sw-feature-picker-item")).forEach(function(li){' +
        'li.addEventListener("click",function(){' +
          'var realSlug=li.querySelector(".sw-feature-picker-slug").textContent;' +
          'var realName=li.querySelector(".sw-feature-picker-name").textContent;' +
          'fmShowFeature(realSlug,realName);' +
        '});' +
      '});' +
```

**Critical:** the real slug/name come from `.sw-feature-picker-slug`/`.sw-feature-picker-name` text content — NOT the `data-slug`/`data-name` attributes, which are deliberately lowercased for filtering (`ep2-s1`'s own `swFilterFeaturePicker`) and would corrupt the `featureMetricKeys` lookup and the display name for any feature whose real slug/name has uppercase characters.

Also extend `fpCloseFn` (already exists) to reset the sub-view when the whole modal closes, so re-opening always starts at the list view — add this one line inside the existing `function fpCloseFn(){...}` body, after its existing lines:

```javascript
        'fmShowList();' +
```

- [x] **Step 4: Run tests — must pass**

```bash
node tests/check-ep2-s2-feature-mapping-save.js
```

Expected output: `[ep2-s2-feature-mapping-save] Results: 2 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, 0 failed

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ep2-s2-feature-mapping-save.js
git commit -m "feat: metric-key sub-view for the feature picker (ep2-s2 AC1)"
```

**Completed.** Final commit (after a post-review amend adding Back/close-reset behavioral assertions, per code-quality review): `8a2b5de2`. Spec compliance ✅, code quality ✅.

---

## Task 2: Save mapping — transactional upsert handler (AC2, AC3, AC4, AC5)

**Files:**
- Modify: `src/web-ui/routes/journeys.js`, `src/web-ui/server.js`
- Test: `tests/check-ep2-s2-feature-mapping-save.js`

- [x] **Step 1: Write the failing tests**

Append to `tests/check-ep2-s2-feature-mapping-save.js`, inside the `(async function() { ... })()` IIFE, before the final summary-line block. First add this mock pool helper near the top of the file (after `makeCanvasMockPool`, before `makeMockReqRes`):

```javascript
/**
 * @param {object} opts
 * @param {object} [opts.stageRow] {id, journeyId, tenantId} -- the real, tenant-owned stage.
 *   Omit (or mismatch params) to simulate a cross-tenant/not-found stage.
 * @param {object} [opts.existingMapping] {id} -- a pre-existing mapping row for
 *   the same (journey_stage_id, feature_slug, tenant_id), or omit for none.
 */
function makeMappingMockPool(opts) {
  opts = opts || {};
  var stageRow = opts.stageRow;
  var existingMapping = opts.existingMapping || null;
  var insertCalls = [];
  var updateCalls = [];
  var selectForUpdateCalls = 0;
  var connectCalls = 0, beginCalls = 0, commitCalls = 0, rollbackCalls = 0;

  function makeClient() {
    return {
      query: function(sql, params) {
        var s = String(sql).trim();
        if (s === 'BEGIN') { beginCalls++; return Promise.resolve({ rows: [] }); }
        if (s === 'COMMIT') { commitCalls++; return Promise.resolve({ rows: [] }); }
        if (s === 'ROLLBACK') { rollbackCalls++; return Promise.resolve({ rows: [] }); }
        if (/^SELECT id FROM feature_customer_journey_stage_mappings[\s\S]*FOR UPDATE$/.test(s)) {
          selectForUpdateCalls++;
          return Promise.resolve({ rows: existingMapping ? [{ id: existingMapping.id }] : [] });
        }
        if (/^UPDATE feature_customer_journey_stage_mappings/.test(s)) {
          updateCalls.push({ sql: s, params: params });
          return Promise.resolve({ rows: [] });
        }
        if (/^INSERT INTO feature_customer_journey_stage_mappings/.test(s)) {
          insertCalls.push({ sql: s, params: params });
          return Promise.resolve({ rows: [{ id: 'new-mapping-id' }] });
        }
        return Promise.resolve({ rows: [] });
      },
      release: function() {}
    };
  }

  return {
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT cjs\.id FROM customer_journey_stages/.test(s)) {
        var match = stageRow && stageRow.id === params[0] && stageRow.journeyId === params[1] && stageRow.tenantId === params[2];
        return Promise.resolve({ rows: match ? [{ id: stageRow.id }] : [] });
      }
      return Promise.resolve({ rows: [] });
    },
    connect: function() { connectCalls++; return Promise.resolve(makeClient()); },
    _state: function() {
      return { insertCalls: insertCalls, updateCalls: updateCalls, selectForUpdateCalls: selectForUpdateCalls, connectCalls: connectCalls, beginCalls: beginCalls, commitCalls: commitCalls, rollbackCalls: rollbackCalls };
    }
  };
}

function makeMappingReqRes(body) {
  var req = {
    session: { tenantId: 't1' },
    params: { id: 'j1', stageId: 's1' },
    body: body
  };
  var res = {
    status: function(c) { this._s = c; return this; },
    json: function(b) { this._b = b; },
    _s: 200, _b: null
  };
  return { req: req, res: res };
}
```

Then add these 5 test cases:

```javascript
  try {
    var pool = makeMappingMockPool({ stageRow: { id: 's1', journeyId: 'j1', tenantId: 't1' } });
    var { req, res } = makeMappingReqRes({ featureSlug: 'feat-a', metricKeys: ['M1'] });
    await journeys.handlePostFeatureMapping(req, res, null, pool);
    var st = pool._state();
    assert.strictEqual(res._s, 200, 'expected a 200 response');
    assert.strictEqual(st.insertCalls.length, 1, 'expected exactly one INSERT');
    assert.strictEqual(st.insertCalls[0].params[0], 's1', 'expected journey_stage_id param');
    assert.strictEqual(st.insertCalls[0].params[1], 'j1', 'expected journey_id param');
    assert.strictEqual(st.insertCalls[0].params[2], 't1', 'expected tenant_id param');
    assert.strictEqual(st.insertCalls[0].params[3], 'feat-a', 'expected feature_slug param');
    assert.strictEqual(st.insertCalls[0].params[4], JSON.stringify(['M1']), 'expected metric_keys param');
    pass('AC2 -- saving with metric keys selected inserts a complete mapping row');
  } catch (e) { fail('AC2 -- saving with metric keys selected inserts a complete mapping row', e); }

  try {
    var pool = makeMappingMockPool({ stageRow: { id: 's1', journeyId: 'j1', tenantId: 't1' } });
    var { req, res } = makeMappingReqRes({ featureSlug: 'feat-a', metricKeys: [] });
    await journeys.handlePostFeatureMapping(req, res, null, pool);
    var st = pool._state();
    assert.strictEqual(st.insertCalls.length, 1, 'expected exactly one INSERT');
    assert.strictEqual(st.insertCalls[0].params[4], '[]', 'expected metric_keys param to be the JSON string "[]", not null/omitted');
    pass('AC3 -- saving with zero metric keys selected inserts metric_keys: []');
  } catch (e) { fail('AC3 -- saving with zero metric keys selected inserts metric_keys: []', e); }

  try {
    var pool = makeMappingMockPool({ stageRow: { id: 's1', journeyId: 'j1', tenantId: 't1' }, existingMapping: { id: 'existing-id' } });
    var { req, res } = makeMappingReqRes({ featureSlug: 'feat-a', metricKeys: ['M2'] });
    await journeys.handlePostFeatureMapping(req, res, null, pool);
    var st = pool._state();
    assert.strictEqual(st.selectForUpdateCalls, 1, 'expected exactly one SELECT ... FOR UPDATE');
    assert.strictEqual(st.insertCalls.length, 0, 'expected ZERO new INSERTs when a mapping already exists');
    assert.strictEqual(st.updateCalls.length, 1, 'expected exactly one UPDATE');
    assert.strictEqual(st.updateCalls[0].params[0], JSON.stringify(['M2']), 'expected the UPDATE to set the new metric_keys value');
    assert.strictEqual(st.updateCalls[0].params[1], 'existing-id', 'expected the UPDATE to target the existing row\'s own id');
    pass('AC4 -- mapping the same feature+stage a second time updates the existing row, not a new one');
  } catch (e) { fail('AC4 -- mapping the same feature+stage a second time updates the existing row, not a new one', e); }

  try {
    // stageRow's own tenantId ('org-2') does not match the requester's session tenantId ('t1')
    var pool = makeMappingMockPool({ stageRow: { id: 's1', journeyId: 'j1', tenantId: 'org-2' } });
    var { req, res } = makeMappingReqRes({ featureSlug: 'feat-a', metricKeys: ['M1'] });
    await journeys.handlePostFeatureMapping(req, res, null, pool);
    var st = pool._state();
    assert.strictEqual(res._s, 404, 'expected a 404 response for a cross-tenant stage (not 403 -- see decisions.md D13)');
    assert.strictEqual(st.connectCalls, 0, 'expected ZERO pool.connect() calls -- ownership must be checked before any transaction opens');
    assert.strictEqual(st.insertCalls.length, 0, 'expected zero INSERTs');
    assert.strictEqual(st.updateCalls.length, 0, 'expected zero UPDATEs');
    pass('AC5 -- a cross-tenant journey_stage_id returns 404, no insert, no transaction opened');
  } catch (e) { fail('AC5 -- a cross-tenant journey_stage_id returns 404, no insert, no transaction opened', e); }

  try {
    var src = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
    assert.ok(/\/journeys\\\/\[\^\/\]\+\\\/stages\\\/\[\^\/\]\+\\\/feature-mappings\$/.test(src) || src.indexOf('feature-mappings') !== -1, 'expected a new dispatch entry referencing feature-mappings');
    // Confirm the new route's own regex does NOT falsely match the pre-existing
    // /stages/:stageId PATCH route's own path shape (different route, same prefix).
    var stagesOnlyRegex = /^\/journeys\/[^/]+\/stages\/[^/]+$/;
    assert.ok(!stagesOnlyRegex.test('/journeys/j1/stages/s1/feature-mappings'), 'expected the existing /stages/:stageId regex to NOT match the new feature-mappings path');
    pass('(shape) -- new feature-mappings route does not collide with the existing /stages/:stageId regex');
  } catch (e) { fail('(shape) -- new feature-mappings route does not collide with the existing /stages/:stageId regex', e); }
```

- [x] **Step 2: Run tests — must fail**

```bash
node tests/check-ep2-s2-feature-mapping-save.js
```

Expected output: `TypeError: journeys.handlePostFeatureMapping is not a function` (and the shape test fails — no `feature-mappings` string in `server.js` yet).

- [x] **Step 3: Implement**

In `src/web-ui/routes/journeys.js`, add this new handler after the existing `handlePatchJourneyStagesOrder` function (before `handleGetJourneyCanvas`):

```javascript
/**
 * POST /journeys/:id/stages/:stageId/feature-mappings — upsert a
 * feature-to-stage mapping (feature_customer_journey_stage_mappings),
 * tenant-scoped.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handlePostFeatureMapping(req, res, _next, pool) {
  // ep2-s2 -- CSRF guard first, mandatory from first implementation per
  // jcg-s1/ep1-s2/ep1-s3/ep1-s4's own precedent.
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageId = req.params && req.params.stageId;
  var featureSlug = (req.body && req.body.featureSlug || '').trim();
  var metricKeys = Array.isArray(req.body && req.body.metricKeys) ? req.body.metricKeys : [];

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }
  function badRequest(msg) {
    if (res.status) { res.status(400).json({ error: msg }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: msg })); }
  }

  if (!featureSlug) { badRequest('featureSlug is required'); return; }

  // ep2-s2 -- stage ownership check BEFORE any transaction opens -- 404, not
  // 403, for a cross-tenant journey/stage id, matching every other mutating
  // handler in this file (see decisions.md D13).
  var sr = await pool.query(
    `SELECT cjs.id FROM customer_journey_stages cjs
     JOIN customer_journeys cj ON cjs.journey_id = cj.id
     WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3`,
    [stageId, journeyId, tenantId]
  );
  if (!sr.rows[0]) { notFound('stage not found'); return; }

  // ep2-s2 -- feature_customer_journey_stage_mappings has NO unique
  // constraint on (journey_stage_id, feature_slug) -- true SQL UPSERT via
  // INSERT ... ON CONFLICT is not available. Application-level
  // check-then-write inside a single transaction, matching
  // handlePatchJourneyStagesOrder's own established pattern exactly.
  var client = await pool.connect();
  var mappingId;
  try {
    await client.query('BEGIN');
    var existing = await client.query(
      `SELECT id FROM feature_customer_journey_stage_mappings
       WHERE journey_stage_id = $1 AND feature_slug = $2 AND tenant_id = $3
       FOR UPDATE`,
      [stageId, featureSlug, tenantId]
    );
    if (existing.rows[0]) {
      mappingId = existing.rows[0].id;
      await client.query(
        `UPDATE feature_customer_journey_stage_mappings SET metric_keys = $1 WHERE id = $2`,
        [JSON.stringify(metricKeys), mappingId]
      );
    } else {
      var ins = await client.query(
        `INSERT INTO feature_customer_journey_stage_mappings
         (journey_stage_id, journey_id, tenant_id, feature_slug, metric_keys)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [stageId, journeyId, tenantId, featureSlug, JSON.stringify(metricKeys)]
      );
      mappingId = ins.rows[0].id;
    }
    await client.query('COMMIT');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* best-effort */ }
    throw err;
  } finally {
    client.release();
  }

  if (res.status) { res.status(200).json({ id: mappingId, featureSlug: featureSlug, metricKeys: metricKeys }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ id: mappingId, featureSlug: featureSlug, metricKeys: metricKeys })); }
}
```

Update the existing `module.exports` line at the bottom of the file to add `handlePostFeatureMapping`:

```javascript
module.exports = { handlePostJourneys, handleGetJourneyCanvas, handlePostJourneyStage, handlePatchJourneyStage, handlePatchJourneyStagesOrder, handleGetCustomerJourneysList, handlePostFeatureMapping };
```

In `src/web-ui/server.js`, update the existing import line (search for `handleGetCustomerJourneysList`) to also import `handlePostFeatureMapping`:

```javascript
const { handlePostJourneys, handleGetJourneyCanvas, handlePostJourneyStage, handlePatchJourneyStage, handlePatchJourneyStagesOrder, handleGetCustomerJourneysList, handlePostFeatureMapping } = require('./routes/journeys');
```

Add a new dispatch entry immediately after the existing `/journeys/[^/]+/stages/[^/]+$` PATCH block (search for `cj-ep1-s3`):

```javascript
  } else if (pathname.match(/^\/journeys\/[^/]+\/stages\/[^/]+\/feature-mappings$/) && req.method === 'POST') {
    // cj-ep2-s2 — save a feature-to-stage mapping (2026-10-05-customer-journey-as-first-class)
    req.params = { id: pathname.split('/')[2], stageId: pathname.split('/')[4] };
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handlePostFeatureMapping(req, res, null, _pshPool);
    });
```

- [x] **Step 4: Run tests — must pass**

```bash
node tests/check-ep2-s2-feature-mapping-save.js
```

Expected output: `[ep2-s2-feature-mapping-save] Results: 7 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, 0 failed

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js src/web-ui/server.js tests/check-ep2-s2-feature-mapping-save.js
git commit -m "feat: transactional upsert handler for feature-to-stage mappings (ep2-s2 AC2-AC5)"
```

**Completed.** Final commit: `658565fa`. Spec compliance ✅, code quality ✅ (one cosmetic Minor note: test constant named `MAPPING_CSRF`, comment referenced `REAL_CSRF` — not fixed, non-blocking).

---

## Task 3: Wire the Save button client-side

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep2-s2-feature-mapping-save.js`

- [x] **Step 1: Write the failing test**

Append to `tests/check-ep2-s2-feature-mapping-save.js`, before the final summary-line block:

```javascript
  try {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [{ id: 's1', name: 'Stage 1', position: 0 }]);
    var featuresJson = JSON.stringify({ features: [{ slug: 'feat-a', name: 'Feature A', metricKeys: ['M1', 'M2'] }] });
    var bodyContent = await withMockedPipelineState(featuresJson, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    var dom = buildDom(bodyContent);
    var win = dom.window;

    var fetchCalls = [];
    win.fetch = function(url, opts) {
      fetchCalls.push({ url: url, opts: opts });
      return Promise.resolve({ ok: true, json: function() { return Promise.resolve({ id: 'm1' }); } });
    };

    var mapBtn = win.document.querySelector('.sw-stage-map-feature');
    mapBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    var item = win.document.querySelector('.sw-feature-picker-item');
    item.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    var checkbox = win.document.querySelector('.sw-feature-mapping-metric-checkbox');
    checkbox.checked = true;
    win.document.getElementById('sw-feature-mapping-save').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));

    await new Promise(function(resolve) { setTimeout(resolve, 0); });

    assert.strictEqual(fetchCalls.length, 1, 'expected exactly one fetch call on Save');
    assert.strictEqual(fetchCalls[0].url, '/journeys/j1/stages/s1/feature-mappings', 'expected the fetch URL to target this journey/stage');
    var body = JSON.parse(fetchCalls[0].opts.body);
    assert.strictEqual(body.featureSlug, 'feat-a', 'expected the correct featureSlug in the POST body');
    assert.deepStrictEqual(body.metricKeys, ['M1'], 'expected only the checked metric key in the POST body');
    pass('(wiring) -- clicking Save POSTs the correct journeyId/stageId/featureSlug/metricKeys');
  } catch (e) { fail('(wiring) -- clicking Save POSTs the correct journeyId/stageId/featureSlug/metricKeys', e); }
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ep2-s2-feature-mapping-save.js
```

Expected: fails — clicking Save does nothing yet (no handler wired).

- [x] **Step 3: Implement**

In the SAME second `<script>` block (do not add a fourth wrapper), add `journeyId` and `csrfToken` duplicated into this block's own closure (they already exist in the FIRST script block's closure, which this second block cannot reach — separate IIFEs), plus the Save button's click handler and `fpStageId` capture. Add the two duplicated constants as the very first lines of the block, before `var fpModal=...`:

```javascript
      'var journeyId=' + JSON.stringify(journey.id) + ';' +
      'var csrfToken=' + JSON.stringify(csrfToken) + ';' +
```

Add `fpStageId` capture: change the existing `fpOpen(trigger)` function to also record the stage id from the trigger button:

```javascript
      'var fpStageId=null;' +
      'function fpOpen(trigger){' +
        'fpTriggerEl=trigger||document.activeElement;' +
        'fpStageId=trigger&&trigger.getAttribute?trigger.getAttribute("data-stage-id"):null;' +
        'fpModal.classList.add("sw-feature-picker-modal--open");' +
        'fpModal.setAttribute("aria-hidden","false");' +
        'if(fpSearch)fpSearch.focus();' +
      '}' +
```

(This replaces the existing `fpOpen` function body — same structure, with the new `fpStageId=...` line added right after `fpTriggerEl=...`.)

Add the Save button wiring, placed after the existing `fmShowFeature`/`fmShowList` functions and the `.sw-feature-picker-item` click-wiring loop from Task 1:

```javascript
      'var fmSave=document.getElementById("sw-feature-mapping-save");' +
      'var fmError=document.getElementById("sw-feature-mapping-error");' +
      'if(fmSave){' +
        'fmSave.addEventListener("click",function(){' +
          'if(!fmSelectedSlug||!fpStageId)return;' +
          'var checked=Array.prototype.slice.call(document.querySelectorAll(".sw-feature-mapping-metric-checkbox:checked")).map(function(cb){return cb.value;});' +
          'fetch("/journeys/"+journeyId+"/stages/"+fpStageId+"/feature-mappings",{' +
            'method:"POST",' +
            'headers:{"Content-Type":"application/json"},' +
            'body:JSON.stringify({featureSlug:fmSelectedSlug,metricKeys:checked,_csrf:csrfToken})' +
          '}).then(function(r){' +
            'if(!r.ok){return r.json().then(function(j){throw new Error((j&&j.error)||"Request failed");});}' +
            'fpCloseFn();' +
          '}).catch(function(e){' +
            'if(fmError)fmError.textContent=e.message;' +
          '});' +
        '});' +
      '}' +
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s2-feature-mapping-save.js
```

Expected output: `[ep2-s2-feature-mapping-save] Results: 9 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, 0 failed

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ep2-s2-feature-mapping-save.js
git commit -m "feat: wire the Save button to POST the feature-to-stage mapping (ep2-s2)"
```

**Completed.** Final commit (after a post-review amend adding a direct modal-closed assertion to the success-path test, per code-quality review): `467349ff`. Spec compliance ✅, code quality ✅ — including a holistic full-block check across all 3 tasks together.

---

## After all tasks

Run `/verify-completion` — full suite + walk through `artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep2-s2-verification.md`. Scenarios 1/2 (metric picker rendering) and the "save closes the modal" halves of Scenarios 3/4 are viable for a local real-browser render check (matching `ep4-s1`/`ep4-s2`/`ep2-s1`'s own precedent) IF a real DB-backed journey with a feature already exists locally — otherwise expect the same `fake-test-db.js` gap already logged for `ep2-s1`'s own DoD (D11), and defer to a post-merge staging confirmation. Scenario 5's own DB-query confirmation step and the cross-tenant edge case both require either a real staging/local Postgres connection or are covered sufficiently by the automated integration tests (AC4, AC5) — do not attempt either against the real shared staging database's own live mapping rows.
