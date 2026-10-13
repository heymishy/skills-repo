'use strict';
// check-jcx-hotfix3-cx-grid-visibility.js -- regression test for jcx-hotfix3
// (Epic: journey-map-and-placeholder-trigger, 2026-10-11-journey-cx-redesign).
//
// Found via live Chrome verification on wuce-staging.fly.dev immediately
// after jcx-s6 merged: jcx-s6's own '.sw-cx-swimlane-grid{display:block}'
// rule has the same specificity as the base '.sw-stage-annotations
// {display:none}' rule and, being later in the stylesheet, won the
// cascade unconditionally -- the swimlane grid stayed visible in the
// Delivery view too, stacked above the old per-stage delivery list.
// Reuses check-ep3-s1-customer-experience-view.js's own established
// jsdom getComputedStyle pattern for this exact class-toggle mechanism.
const assert = require('assert');
const { JSDOM } = require('jsdom');

let passed = 0; let failed = 0;
function pass(name) { console.log('  [PASS] ' + name); passed++; }
function fail(name, err) { console.error('  [FAIL] ' + name + ': ' + (err.message || err)); failed++; }

function makeCanvasMockPool(journeyRow, stageRows) {
  return {
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT id, name, description, product_id, persona_name, persona_role, persona_goal FROM customer_journeys/.test(s)) {
        var match = journeyRow && journeyRow.id === params[0];
        return Promise.resolve({ rows: match ? [journeyRow] : [] });
      }
      if (/^SELECT id, name, position, description/.test(s)) {
        return Promise.resolve({ rows: stageRows });
      }
      if (/^SELECT id, journey_stage_id, feature_slug, metric_keys, mapping_state FROM feature_customer_journey_stage_mappings/.test(s)) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

function withMockedPipelineState(jsonString, fn) {
  var fs = require('fs');
  var orig = fs.readFileSync;
  fs.readFileSync = function(p, enc) {
    if (String(p).indexOf('pipeline-state.json') !== -1) { return jsonString; }
    return orig(p, enc);
  };
  try { return fn(); } finally { fs.readFileSync = orig; }
}

function makeMockReqRes() {
  var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
  var res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
  return { req: req, res: res };
}

// Mirrors check-ep3-s1-customer-experience-view.js's own extractFirstScript/buildDom.
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
      [{ id: 's1', name: 'Stage 1', position: 0, emotion: 'positive', pain_points: 'X', opportunities: 'Y' }]
    );
    var bodyContent = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    var dom = buildDom(bodyContent);
    var win = dom.window;
    var canvasRoot = win.document.querySelector('.sw-journey-canvas');
    var grid = win.document.querySelector('.sw-cx-swimlane-grid');
    assert.ok(grid, 'expected a .sw-cx-swimlane-grid element to exist in the rendered DOM');

    // Default (canvas) view -- the bug under test never showed up here,
    // but confirming it anyway establishes the correct baseline.
    assert.strictEqual(win.getComputedStyle(grid).display, 'none', 'expected the swimlane grid hidden by default (canvas view)');

    var cxBtn = win.document.querySelector('.sw-canvas-view-toggle-btn[data-view="customer-experience"]');
    var deliveryBtn = win.document.querySelector('.sw-canvas-view-toggle-btn[data-view="delivery"]');

    cxBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    assert.ok(canvasRoot.className.indexOf('sw-journey-canvas--view-customer-experience') !== -1, 'expected the canvas root to gain the customer-experience view class');
    assert.strictEqual(win.getComputedStyle(grid).display, 'block', 'expected the swimlane grid visible in the Customer experience view');

    // THE bug: clicking Delivery must hide the grid again. jcx-s6's own
    // '.sw-cx-swimlane-grid{display:block}' rule (now removed) would have
    // kept it visible here, since that rule had no view-scoping of its own
    // and won the cascade over the base hide rule by source order.
    deliveryBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    assert.ok(canvasRoot.className.indexOf('sw-journey-canvas--view-customer-experience') === -1, 'expected the customer-experience view class removed after clicking Delivery');
    assert.strictEqual(win.getComputedStyle(grid).display, 'none', 'expected the swimlane grid HIDDEN again in the Delivery view -- this is the exact assertion that would have caught the live bug before it shipped');

    pass('jcx-hotfix3: swimlane grid is hidden in every view except Customer experience');
  } catch (e) { fail('jcx-hotfix3: swimlane grid is hidden in every view except Customer experience', e); }

  console.log('\n[jcx-hotfix3-cx-grid-visibility] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
