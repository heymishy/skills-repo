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

// ep2-s2 -- matches this file's own established REAL_CSRF convention
// (e.g. check-ep1-s2-journey-stage-create.js, check-ep1-s4-stage-reorder.js):
// csrfGuard unconditionally 403s unless session.csrfToken and body._csrf are
// both present and equal, so every mock request body here must carry a
// matching _csrf field.
var MAPPING_CSRF = 'test-csrf-token-ep2-s2';
function makeMappingReqRes(body) {
  var req = {
    session: { tenantId: 't1', csrfToken: MAPPING_CSRF },
    params: { id: 'j1', stageId: 's1' },
    body: Object.assign({ _csrf: MAPPING_CSRF }, body)
  };
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

    // Re-select a feature with metrics, then use the Back button to return
    // to the list view -- asserts fmShowList() (wired to #sw-feature-mapping-back)
    // actually hides the sub-view and re-reveals the feature list, not just
    // that the click handler exists.
    itemA.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    var fmBack = win.document.getElementById('sw-feature-mapping-back');
    fmBack.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    assert.strictEqual(mapView.style.display, 'none', 'expected the metric-key sub-view to be hidden after clicking Back');
    var listEl = win.document.getElementById('sw-feature-picker-list');
    assert.notStrictEqual(listEl.style.display, 'none', 'expected the feature list to be visible again after clicking Back');

    // Re-select a feature with metrics again, then close the WHOLE modal via
    // its own close button (fpClose/fpCloseFn, ep2-s1) -- asserts fpCloseFn's
    // new fmShowList() call actually resets the sub-view, not just that the
    // modal's own aria-hidden attribute flipped (that assertion already
    // exists in check-ep2-s1-feature-picker.js and would pass identically
    // whether fmShowList() ran, no-opped, or threw).
    itemA.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    assert.strictEqual(mapView.style.display, 'block', 'expected the metric-key sub-view to be visible again after re-selecting feat-a');
    var fpClose = win.document.getElementById('sw-feature-picker-close');
    fpClose.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    assert.strictEqual(mapView.style.display, 'none', 'expected the metric-key sub-view to be hidden after closing the whole modal');

    pass('AC1 (behavioral) -- selecting a feature shows real metric-key checkboxes, or "No metrics recorded"');
  } catch (e) { fail('AC1 (behavioral) -- selecting a feature shows real metric-key checkboxes, or "No metrics recorded"', e); }

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
    assert.ok(src.indexOf('feature-mappings') !== -1, 'expected a new dispatch entry referencing feature-mappings');
    // Confirm the new route's own regex does NOT falsely match the pre-existing
    // /stages/:stageId PATCH route's own path shape (different route, same prefix).
    var stagesOnlyRegex = /^\/journeys\/[^/]+\/stages\/[^/]+$/;
    assert.ok(!stagesOnlyRegex.test('/journeys/j1/stages/s1/feature-mappings'), 'expected the existing /stages/:stageId regex to NOT match the new feature-mappings path');
    pass('(shape) -- new feature-mappings route does not collide with the existing /stages/:stageId regex');
  } catch (e) { fail('(shape) -- new feature-mappings route does not collide with the existing /stages/:stageId regex', e); }

  console.log('\n[ep2-s2-feature-mapping-save] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
