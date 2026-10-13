'use strict';
// check-jcx-hotfix4-add-stage-visibility.js -- regression test for jcx-hotfix4
// (Epic: journey-map-and-placeholder-trigger, 2026-10-11-journey-cx-redesign).
//
// Found while researching the cx-interaction-design-polish spike: clicking
// "+ Add stage" inserted the new, unsaved stage-name input into
// #sw-journey-stages, which is hidden (display:none) in BOTH the Canvas view
// (ep2-s3, predates this feature) and the Customer-experience view (jcx-s6,
// which extended the same already-existing hidden-container pattern). The
// new input's container being hidden also means input.focus() silently
// no-ops (a descendant of a display:none ancestor cannot receive focus).
// Confirmed live via javascript_tool against wuce-staging.fly.dev before
// writing this test. Only the Delivery view ever worked.
//
// Reuses check-jcx-hotfix3-cx-grid-visibility.js's own established
// extractFirstScript/buildDom jsdom pattern.
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
  // fetch is referenced by submitJson -- never actually invoked by this
  // test (we stop short of blur/save), but defining it avoids a stray
  // ReferenceError if any unrelated init code in the script touches it.
  dom.window.fetch = function() { return Promise.resolve({ ok: true, json: function() { return Promise.resolve({}); } }); };
  dom.window.eval(scriptSrc);
  return dom;
}

// Walks from el up to (and including) root; false if any ancestor in that
// chain (el itself included) has a computed display of "none". This is the
// real-world check -- a display:none ANCESTOR hides a visually-plain child
// even though the child's own computed display property is untouched.
function isVisible(win, el, root) {
  var node = el;
  while (node) {
    if (win.getComputedStyle(node).display === 'none') { return false; }
    if (node === root) { break; }
    node = node.parentElement;
  }
  return true;
}

function switchView(win, viewName) {
  var btn = win.document.querySelector('.sw-canvas-view-toggle-btn[data-view="' + viewName + '"]');
  assert.ok(btn, 'expected a view-toggle button for ' + viewName);
  btn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
}

function clickAddStageAndInspect(win, canvasRoot) {
  var addBtn = win.document.getElementById('sw-add-stage-btn');
  assert.ok(addBtn, 'expected the "+ Add stage" button to exist');
  addBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  var card = win.document.querySelector('.sw-stage-card--new');
  assert.ok(card, 'expected a new unsaved stage card to be inserted');
  var input = card.querySelector('.sw-stage-name-input');
  assert.ok(input, 'expected a stage-name input inside the new card');
  return {
    visible: isVisible(win, input, canvasRoot),
    focused: win.document.activeElement === input
  };
}

(async function() {
  var journeys = require('../src/web-ui/routes/journeys');

  async function renderCanvas() {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [{ id: 's1', name: 'Stage 1', position: 0, emotion: 'positive', pain_points: 'X', opportunities: 'Y' }]
    );
    return withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
  }

  try {
    var bodyContent = await renderCanvas();
    var dom = buildDom(bodyContent);
    var win = dom.window;
    var canvasRoot = win.document.querySelector('.sw-journey-canvas');

    // Scenario 1: Canvas view is the page's own default -- no toggle click needed.
    var canvasResult = clickAddStageAndInspect(win, canvasRoot);
    assert.strictEqual(canvasResult.visible, true, 'expected the new stage input to be visible from the Canvas view (the page default)');
    assert.strictEqual(canvasResult.focused, true, 'expected the new stage input to receive focus from the Canvas view');
    pass('jcx-hotfix4: "+ Add stage" produces a visible, focused input from the Canvas view');
  } catch (e) { fail('jcx-hotfix4: "+ Add stage" produces a visible, focused input from the Canvas view', e); }

  try {
    var bodyContent2 = await renderCanvas();
    var dom2 = buildDom(bodyContent2);
    var win2 = dom2.window;
    var canvasRoot2 = win2.document.querySelector('.sw-journey-canvas');
    switchView(win2, 'customer-experience');
    var cxResult = clickAddStageAndInspect(win2, canvasRoot2);
    assert.strictEqual(cxResult.visible, true, 'expected the new stage input to be visible from the Customer experience view');
    assert.strictEqual(cxResult.focused, true, 'expected the new stage input to receive focus from the Customer experience view');
    pass('jcx-hotfix4: "+ Add stage" produces a visible, focused input from the Customer experience view');
  } catch (e) { fail('jcx-hotfix4: "+ Add stage" produces a visible, focused input from the Customer experience view', e); }

  try {
    var bodyContent3 = await renderCanvas();
    var dom3 = buildDom(bodyContent3);
    var win3 = dom3.window;
    var canvasRoot3 = win3.document.querySelector('.sw-journey-canvas');
    switchView(win3, 'delivery');
    var deliveryResult = clickAddStageAndInspect(win3, canvasRoot3);
    assert.strictEqual(deliveryResult.visible, true, 'expected the new stage input to remain visible from the Delivery view (no regression -- this view already worked)');
    assert.strictEqual(deliveryResult.focused, true, 'expected the new stage input to remain focused from the Delivery view (no regression)');
    pass('jcx-hotfix4: "+ Add stage" still works from the Delivery view (no regression)');
  } catch (e) { fail('jcx-hotfix4: "+ Add stage" still works from the Delivery view (no regression)', e); }

  console.log('\n[jcx-hotfix4-add-stage-visibility] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
