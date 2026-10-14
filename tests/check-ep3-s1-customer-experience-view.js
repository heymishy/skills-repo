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

  // jcx-s6 update: ep3-s1's own original per-stage annotation block (one
  // box per stage, "emotion chip" + pain points + opportunities stacked
  // inside it) was replaced by jcx-s6's own swimlane grid -- the same
  // underlying user-facing guarantee (emotion/pain points/opportunities
  // always visible, "Not set" when null, never omitted) now holds across
  // the grid's own rows rather than inside one per-stage block. Re-pointed
  // here, not weakened -- see artefacts/2026-10-11-journey-cx-redesign/
  // stories/jcx-s6.md and spikes/post-release-cx-visual-gap-outcome.md.
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
    // Emotion now renders via the connected curve (jcx-s3/jcx-s6), not a
    // standalone chip -- same underlying guarantee (text label, never
    // colour alone, MC-A11Y-02), different element.
    assert.ok(/sw-emotion-curve-point--positive[\s\S]*?>positive</.test(out), 'expected the emotion curve to carry a text label "positive" for this stage (now via the curve, not a standalone chip)');
    var painPointsIdx = out.indexOf('sw-cx-grid-row--pain-points');
    var opportunitiesIdx = out.indexOf('sw-cx-grid-row--opportunities');
    assert.ok(painPointsIdx !== -1 && opportunitiesIdx !== -1, 'expected pain-points and opportunities swimlane rows to exist');
    assert.ok(out.slice(painPointsIdx, opportunitiesIdx).indexOf('Checkout is slow') !== -1, 'expected the pain points text to render inside the pain-points row');
    var endOfOpportunitiesRow = out.indexOf('</ul>', opportunitiesIdx); // the grid's own a11y list closes the row sequence
    assert.ok(out.slice(opportunitiesIdx, endOfOpportunitiesRow !== -1 ? endOfOpportunitiesRow : out.length).indexOf('Add express checkout') !== -1, 'expected the opportunities text to render inside the opportunities row');
    pass('AC1, AC4 -- Customer experience view shows emotion (via the curve), pain points, and opportunities');
  } catch (e) { fail('AC1, AC4 -- Customer experience view shows emotion (via the curve), pain points, and opportunities', e); }

  try {
    // A second, emotion-set stage is required alongside s2 -- if EVERY
    // stage has emotion null, buildEmotionCurve renders the whole-curve
    // empty state (jcx-s3 AC3), not a per-point "unset" marker (jcx-s3
    // AC2), which needs at least one OTHER stage with emotion set.
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [
        { id: 's1', name: 'Stage 1', position: 0, emotion: 'positive', pain_points: 'X', opportunities: 'Y' },
        { id: 's2', name: 'Stage 2', position: 1, emotion: null, pain_points: null, opportunities: null }
      ]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    // Emotion's own "nothing set" marker is the curve's distinct
    // sw-emotion-curve-point--unset + "No data yet" text (jcx-s3 AC2),
    // not a muted-empty cell -- pain points/opportunities still render
    // their own "nothing set" marker in each row, each in its own cell.
    // jcx-s7 AC4 update: the plain "Not set" text was replaced with a
    // muted, visually-dulled em-dash treatment (sw-cx-grid-cell--empty) --
    // re-pointed here, not weakened -- see
    // artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s7.md.
    assert.ok(/sw-emotion-curve-point--unset[\s\S]*?No data yet/.test(out), 'expected the curve\'s own distinct "No data yet" marker for the unset emotion, not a silent gap');
    var painPointsIdx = out.indexOf('sw-cx-grid-row--pain-points');
    var opportunitiesIdx = out.indexOf('sw-cx-grid-row--opportunities');
    var endOfOpportunitiesRow = out.indexOf('</ul>', opportunitiesIdx);
    assert.ok(out.slice(painPointsIdx, opportunitiesIdx).indexOf('sw-cx-grid-cell--empty') !== -1, 'expected the muted-empty marker in the pain-points row');
    assert.ok(out.slice(opportunitiesIdx, endOfOpportunitiesRow !== -1 ? endOfOpportunitiesRow : out.length).indexOf('sw-cx-grid-cell--empty') !== -1, 'expected the muted-empty marker in the opportunities row');
    pass('AC2 -- a stage with nothing set shows its own "no data" marker for every row, none omitted');
  } catch (e) { fail('AC2 -- a stage with nothing set shows its own "no data" marker for every row, none omitted', e); }

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
