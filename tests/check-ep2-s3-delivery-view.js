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

// Extracts the inner HTML of the Delivery-view annotations container for a
// given stage id (the sibling block buildDeliveryAnnotations renders) --
// NOT the whole page. The pre-existing ep2-s1 feature-picker modal also
// renders every feature's own name/slug (<span class="sw-feature-picker-name">
// Feature A</span> etc.), completely independent of buildDeliveryAnnotations,
// so asserting against the full page would pass even if buildDeliveryAnnotations
// were deleted entirely. Div-depth-balanced scan, not a naive indexOf of the
// next "</div>" -- the container's own content includes nested
// sw-feature-mapping-row divs, so a naive scan would close too early.
function extractDeliveryAnnotationsHtml(html, stageId) {
  var marker = 'class="sw-stage-annotations sw-stage-annotations--delivery" data-stage-id="' + stageId + '"';
  var markerIdx = html.indexOf(marker);
  assert.ok(markerIdx !== -1, 'expected a sw-stage-annotations--delivery container for stage ' + stageId);
  var openTagEnd = html.indexOf('>', markerIdx) + 1;
  var pos = openTagEnd;
  var depth = 1;
  while (depth > 0) {
    var nextOpen = html.indexOf('<div', pos);
    var nextClose = html.indexOf('</div>', pos);
    assert.ok(nextClose !== -1, 'expected a matching closing </div> for the annotations container');
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      pos = nextClose + 6;
    }
  }
  return html.slice(openTagEnd, pos - '</div>'.length);
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
    var annotationsHtml = extractDeliveryAnnotationsHtml(out, 's1');
    assert.ok(annotationsHtml.indexOf('Feature A') !== -1, 'expected the mapped feature\'s name to be rendered inside the Delivery-view annotations container');
    assert.ok(annotationsHtml.indexOf('feat-a') !== -1, 'expected the mapped feature\'s slug to be rendered inside the Delivery-view annotations container');
    assert.ok(annotationsHtml.indexOf('m1: 0.42') !== -1, 'expected "m1: 0.42" (the real recorded metric value) to be rendered inside the Delivery-view annotations container');
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
