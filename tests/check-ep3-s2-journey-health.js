'use strict';
// check-ep3-s2-journey-health.js -- TDD tests for ep3-s2 (Epic 3,
// customer-journey feature). Story:
// artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s2.md
// Test plan:
// artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep3-s2-test-plan.md
const assert = require('assert');
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

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

// DEVIATION from plan (jsdom version mismatch): the plan's own test code
// stubs reload via `Object.defineProperty(win.location, 'reload', {value:
// fn, configurable: true})`. Against the jsdom actually installed in this
// repo (25.0.1), `location.reload` is an own, non-configurable,
// non-writable property, so that defineProperty call throws "Cannot
// redefine property: reload" before the handler is even exercised -- it is
// not possible to stub `location.reload` directly in this jsdom version.
// jsdom instead reports an unimplemented navigation (what `reload()`
// internally triggers) via the VirtualConsole's 'jsdomError' event rather
// than a catchable throw or promise rejection, so that event is the only
// observable signal, in this environment, that `window.location.reload()`
// was actually invoked. `dom.reloadCalls` below counts those events and is
// used as the discriminating assertion in place of a stub call count --
// it is still zero until the handler is wired, and still fires exactly
// once per reload() call, so it preserves the same pass/fail discrimination
// the plan intended.
function buildFullDom(bodyContent) {
  var vc = new VirtualConsole();
  var dom = new JSDOM('<!DOCTYPE html><html><body>' + bodyContent + '</body></html>', {
    runScripts: 'outside-only',
    url: 'http://localhost/journeys/j1',
    virtualConsole: vc
  });
  dom.reloadCalls = 0;
  vc.on('jsdomError', function(err) {
    if (err && /navigation/i.test(err.message)) dom.reloadCalls++;
  });
  dom.window.eval(extractScriptByMarker(bodyContent, 'var stageData={};'));
  dom.window.eval(extractScriptByMarker(bodyContent, 'var fpModal=document.getElementById'));
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

    win.document.querySelector('.sw-stage-map-feature').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    win.document.querySelector('.sw-feature-picker-item').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    var checkbox = win.document.querySelector('.sw-feature-mapping-metric-checkbox');
    checkbox.checked = true;
    win.document.getElementById('sw-feature-mapping-save').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));

    await new Promise(function(resolve) { setTimeout(resolve, 0); });
    assert.strictEqual(dom.reloadCalls, 1, 'expected window.location.reload to be called exactly once after a successful Save');
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

    win.document.querySelector('.sw-feature-mapping-remove').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    await new Promise(function(resolve) { setTimeout(resolve, 0); });
    assert.strictEqual(dom.reloadCalls, 1, 'expected window.location.reload to be called exactly once after a successful Remove');
    pass('AC6 -- removing an orphaned mapping triggers a reload so the health indicator reflects the new state');
  } catch (e) { fail('AC6 -- removing an orphaned mapping triggers a reload so the health indicator reflects the new state', e); }

  console.log('\n[ep3-s2-journey-health] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
