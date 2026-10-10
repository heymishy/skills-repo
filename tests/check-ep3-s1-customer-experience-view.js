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
    assert.ok(/<span[^>]*class="[^"]*sw-stage-emotion-chip--positive[^"]*"[^>]*>positive<\/span>/.test(out), 'expected an emotion chip element with the sw-stage-emotion-chip--positive modifier class, containing the literal text "positive"');
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
    var cxBlockMarker = 'sw-stage-annotations--customer-experience" data-stage-id="s2"';
    var cxBlockStart = out.indexOf(cxBlockMarker);
    assert.ok(cxBlockStart !== -1, 'expected to find the Customer experience annotation block for stage s2');
    var cxBlockEnd = out.indexOf('</div>', cxBlockStart);
    assert.ok(cxBlockEnd !== -1, 'expected a closing </div> for the Customer experience annotation block');
    var cxBlockHtml = out.slice(cxBlockStart, cxBlockEnd);
    var matches = cxBlockHtml.match(/Not set/g) || [];
    assert.strictEqual(matches.length, 3, 'expected exactly 3 occurrences of "Not set" within the Customer experience annotation block (one per row: emotion, pain points, opportunities), got ' + matches.length);
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
