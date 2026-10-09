'use strict';
// check-ep2-s1-feature-picker.js -- TDD tests for ep2-s1 (Epic 2, customer-journey
// feature). Story: artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s1.md
// Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s1-test-plan.md
const assert = require('assert');
const fs = require('fs');

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

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  var journeys = require('../src/web-ui/routes/journeys');

  // ── AC1 -- feature picker modal lists features from pipeline-state.json with name and slug ──
  try {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    var featuresJson = JSON.stringify({ features: [
      { slug: 'feat-a', name: 'Feature A' },
      { slug: 'feat-b', name: 'Feature B' }
    ] });
    var out = await withMockedPipelineState(featuresJson, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('Feature A') !== -1 && out.indexOf('feat-a') !== -1, 'expected Feature A / feat-a in rendered HTML');
    assert.ok(out.indexOf('Feature B') !== -1 && out.indexOf('feat-b') !== -1, 'expected Feature B / feat-b in rendered HTML');
    pass('AC1 -- feature picker modal lists features from pipeline-state.json with name and slug');
  } catch (e) { fail('AC1 -- feature picker modal lists features from pipeline-state.json with name and slug', e); }

  // ── AC1 (boundary) -- feature picker renders a distinct empty state with zero features, not the AC3 error state ──
  try {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('No features found') !== -1, 'expected a zero-features message');
    assert.ok(out.indexOf('could not be loaded') === -1, 'zero-features state must NOT show the AC3 error text');
    pass('AC1 (boundary) -- feature picker renders a distinct empty state with zero features, not the AC3 error state');
  } catch (e) { fail('AC1 (boundary) -- feature picker renders a distinct empty state with zero features, not the AC3 error state', e); }

  // ── AC3 -- explicit error state when pipeline-state.json cannot be read (ENOENT) ──
  try {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    var out = await withMockedPipelineState(function() { throw new Error('ENOENT: no such file'); }, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('Features could not be loaded. Check that pipeline-state.json exists.') !== -1, 'expected the exact AC3 error text');
    pass('AC3 -- explicit error state when pipeline-state.json cannot be read (ENOENT)');
  } catch (e) { fail('AC3 -- explicit error state when pipeline-state.json cannot be read (ENOENT)', e); }

  // ── AC3 -- same explicit error state when pipeline-state.json contains invalid JSON ──
  try {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    var out = await withMockedPipelineState('{not valid json', async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('Features could not be loaded. Check that pipeline-state.json exists.') !== -1, 'expected the exact AC3 error text on JSON.parse failure');
    pass('AC3 -- same explicit error state when pipeline-state.json contains invalid JSON');
  } catch (e) { fail('AC3 -- same explicit error state when pipeline-state.json contains invalid JSON', e); }

  // ── (shape) -- handleGetJourneyCanvas reads pipeline-state.json via the repo-root adapter, not a hardcoded path ──
  try {
    var src = fs.readFileSync(require.resolve('../src/web-ui/routes/journeys'), 'utf8');
    assert.ok(src.indexOf('_repoRootAdapter.getRepoRoot(req)') !== -1, 'expected a call to _repoRootAdapter.getRepoRoot(req)');
    assert.ok(/\.github['"],\s*['"]pipeline-state\.json/.test(src), "expected a path.join(..., '.github', 'pipeline-state.json') construction");
    pass('(shape) -- handleGetJourneyCanvas reads pipeline-state.json via the repo-root adapter, not a hardcoded path');
  } catch (e) { fail('(shape) -- handleGetJourneyCanvas reads pipeline-state.json via the repo-root adapter, not a hardcoded path', e); }

  console.log(`\n[ep2-s1-feature-picker] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
