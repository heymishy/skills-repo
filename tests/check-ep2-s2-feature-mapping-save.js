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

  console.log('\n[ep2-s2-feature-mapping-save] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
