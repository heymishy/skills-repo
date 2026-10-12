'use strict';
// check-jcx-s3-emotion-curve.js -- TDD tests for jcx-s3 (Epic:
// journey-map-and-placeholder-trigger, 2026-10-11-journey-cx-redesign).
// Story: artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s3.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

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

(async function() {
  var journeys = require('../src/web-ui/routes/journeys');

  // -- AC4: curve points carry a text label alongside colour --
  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [
        { id: 's1', name: 'Discover', position: 0, emotion: 'positive' },
        { id: 's2', name: 'Buy', position: 1, emotion: 'negative' },
        { id: 's3', name: 'Use', position: 2, emotion: 'mixed' },
        { id: 's4', name: 'Support', position: 3, emotion: 'neutral' }
      ]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(/sw-emotion-curve-point--positive[\s\S]*?>positive</.test(out), 'expected a text label "positive" on the positive point');
    assert.ok(/sw-emotion-curve-point--negative[\s\S]*?>negative</.test(out), 'expected a text label "negative" on the negative point');
    assert.ok(/sw-emotion-curve-point--mixed[\s\S]*?>mixed</.test(out), 'expected a text label "mixed" on the mixed point');
    assert.ok(/sw-emotion-curve-point--neutral[\s\S]*?>neutral</.test(out), 'expected a text label "neutral" on the neutral point');
    pass('AC4: every curve point carries a text label matching its emotion value');
  } catch (e) { fail('AC4: every curve point carries a text label matching its emotion value', e); }

  // -- AC4 (empty-state marker): an unset stage shows "No data yet", not colour alone --
  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [
        { id: 's1', name: 'Discover', position: 0, emotion: 'positive' },
        { id: 's2', name: 'Buy', position: 1, emotion: null }
      ]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(/sw-emotion-curve-point--unset[\s\S]*?No data yet/.test(out), 'expected the unset stage to show a distinct "No data yet" marker, not a silent gap');
    pass('AC4 (empty-state marker): an unset stage shows a distinct text marker');
  } catch (e) { fail('AC4 (empty-state marker): an unset stage shows a distinct text marker', e); }

  // -- AC5: curve exposes an accessible linear structure --
  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [
        { id: 's1', name: 'Discover', position: 0, emotion: 'positive' },
        { id: 's2', name: 'Buy', position: 1, emotion: 'negative' },
        { id: 's3', name: 'Use', position: 2, emotion: 'neutral' }
      ]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(/<svg[^>]*aria-hidden="true"/.test(out), 'expected the SVG itself to be aria-hidden (decorative once the text alternative exists)');
    assert.ok(/class="sw-emotion-curve-a11y-list[^"]*"/.test(out), 'expected a visually-hidden accessible list alongside the SVG');
    assert.ok(/<li>Discover: positive<\/li>/.test(out), 'expected the a11y list to name each stage and its emotion in document order');
    assert.ok(/<li>Buy: negative<\/li>/.test(out), 'expected Buy/negative in the a11y list');
    assert.ok(/<li>Use: neutral<\/li>/.test(out), 'expected Use/neutral in the a11y list');
    pass('AC5: the curve exposes an accessible linear structure (aria-hidden SVG + a visually-hidden text list)');
  } catch (e) { fail('AC5: the curve exposes an accessible linear structure (aria-hidden SVG + a visually-hidden text list)', e); }

  // -- AC3: no stage has any emotion -> friendly empty state, no broken line --
  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [
        { id: 's1', name: 'Discover', position: 0, emotion: null },
        { id: 's2', name: 'Buy', position: 1, emotion: null }
      ]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(/sw-emotion-curve-empty/.test(out), 'expected the whole-curve empty state to render');
    assert.ok(!/<polyline/.test(out), 'expected NO polyline/SVG curve to render when no stage has emotion data');
    pass('AC3: a journey with zero emotion data shows the full empty state, not a broken line');
  } catch (e) { fail('AC3: a journey with zero emotion data shows the full empty state, not a broken line', e); }

  console.log(`\n[jcx-s3-emotion-curve] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
