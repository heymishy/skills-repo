'use strict';
// check-ep3-s2-journey-health.js -- TDD tests for ep3-s2 (Epic 3,
// customer-journey feature). Story:
// artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s2.md
// Test plan:
// artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep3-s2-test-plan.md
const assert = require('assert');
const fs = require('fs');
const { JSDOM } = require('jsdom');

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

  console.log('\n[ep3-s2-journey-health] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
