'use strict';
// check-ic-s1-canvas-render.js -- TDD tests for ic-s1 (Epic: canvas-replacement-for-journey-stages,
// 2026-10-10-infinite-canvas). Story: artefacts/2026-10-10-infinite-canvas/stories/ic-s1.md
// Test plan: artefacts/2026-10-10-infinite-canvas/test-plans/ic-s1-test-plan.md
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { handleDrawflowJsAsset, handleDrawflowCssAsset } = require('../src/web-ui/routes/public');

  // Real files read directly from node_modules, independent of the handler's
  // own implementation -- used to assert the handler's response body is
  // byte-for-byte the real vendored asset, not just "a non-empty buffer".
  const REAL_JS_PATH = path.join(__dirname, '..', 'node_modules', 'drawflow', 'dist', 'drawflow.min.js');
  const REAL_CSS_PATH = path.join(__dirname, '..', 'node_modules', 'drawflow', 'dist', 'drawflow.min.css');
  const REAL_JS_RAW = fs.readFileSync(REAL_JS_PATH);
  const REAL_CSS_RAW = fs.readFileSync(REAL_CSS_PATH);
  const REAL_JS_GZIP = zlib.gzipSync(REAL_JS_RAW);
  const REAL_CSS_GZIP = zlib.gzipSync(REAL_CSS_RAW);

  function makeMockRes() {
    const headers = {};
    let statusCode, body;
    return {
      writeHead: function(code, h) { statusCode = code; Object.assign(headers, h); },
      end: function(b) { body = b; },
      _statusCode: function() { return statusCode; },
      _headers: function() { return headers; },
      _body: function() { return body; }
    };
  }

  // -- AC5: zero-build asset serving, non-gzip branch --------------------
  try {
    const res = makeMockRes();
    handleDrawflowJsAsset({ headers: {} }, res);
    assert.strictEqual(res._statusCode(), 200);
    assert.strictEqual(res._headers()['Content-Type'], 'application/javascript; charset=utf-8');
    assert.strictEqual(res._headers()['Content-Encoding'], undefined, 'no Content-Encoding header when gzip not requested');
    assert.ok(Buffer.isBuffer(res._body()) && res._body().length > 0);
    assert.ok(Buffer.compare(res._body(), REAL_JS_RAW) === 0, 'body must match the real drawflow.min.js file read from node_modules');
    pass('AC5: GET /vendor/drawflow.min.js (no Accept-Encoding) returns 200 with the real uncompressed file from node_modules');
  } catch (e) { fail('AC5: GET /vendor/drawflow.min.js (no Accept-Encoding) returns 200 with the real uncompressed file from node_modules', e); }

  try {
    const res = makeMockRes();
    handleDrawflowCssAsset({ headers: {} }, res);
    assert.strictEqual(res._statusCode(), 200);
    assert.strictEqual(res._headers()['Content-Type'], 'text/css; charset=utf-8');
    assert.strictEqual(res._headers()['Content-Encoding'], undefined, 'no Content-Encoding header when gzip not requested');
    assert.ok(Buffer.isBuffer(res._body()) && res._body().length > 0);
    assert.ok(Buffer.compare(res._body(), REAL_CSS_RAW) === 0, 'body must match the real drawflow.min.css file read from node_modules');
    pass('AC5: GET /vendor/drawflow.min.css (no Accept-Encoding) returns 200 with the real uncompressed file from node_modules');
  } catch (e) { fail('AC5: GET /vendor/drawflow.min.css (no Accept-Encoding) returns 200 with the real uncompressed file from node_modules', e); }

  // -- AC5: zero-build asset serving, gzip branch -------------------------
  try {
    const res = makeMockRes();
    handleDrawflowJsAsset({ headers: { 'accept-encoding': 'gzip, deflate, br' } }, res);
    assert.strictEqual(res._statusCode(), 200);
    assert.strictEqual(res._headers()['Content-Type'], 'application/javascript; charset=utf-8');
    assert.strictEqual(res._headers()['Content-Encoding'], 'gzip');
    assert.ok(Buffer.isBuffer(res._body()) && res._body().length > 0);
    assert.ok(Buffer.compare(res._body(), REAL_JS_GZIP) === 0, 'gzip body must match the real drawflow.min.js file gzip-compressed');
    // Round-trip check: the gzip body must decompress back to the exact real file.
    assert.ok(Buffer.compare(zlib.gunzipSync(res._body()), REAL_JS_RAW) === 0, 'gzip body must decompress to the real drawflow.min.js file');
    pass('AC5: GET /vendor/drawflow.min.js (Accept-Encoding: gzip) returns 200 with Content-Encoding: gzip and the real gzip-compressed file');
  } catch (e) { fail('AC5: GET /vendor/drawflow.min.js (Accept-Encoding: gzip) returns 200 with Content-Encoding: gzip and the real gzip-compressed file', e); }

  try {
    const res = makeMockRes();
    handleDrawflowCssAsset({ headers: { 'accept-encoding': 'gzip, deflate, br' } }, res);
    assert.strictEqual(res._statusCode(), 200);
    assert.strictEqual(res._headers()['Content-Type'], 'text/css; charset=utf-8');
    assert.strictEqual(res._headers()['Content-Encoding'], 'gzip');
    assert.ok(Buffer.isBuffer(res._body()) && res._body().length > 0);
    assert.ok(Buffer.compare(res._body(), REAL_CSS_GZIP) === 0, 'gzip body must match the real drawflow.min.css file gzip-compressed');
    assert.ok(Buffer.compare(zlib.gunzipSync(res._body()), REAL_CSS_RAW) === 0, 'gzip body must decompress to the real drawflow.min.css file');
    pass('AC5: GET /vendor/drawflow.min.css (Accept-Encoding: gzip) returns 200 with Content-Encoding: gzip and the real gzip-compressed file');
  } catch (e) { fail('AC5: GET /vendor/drawflow.min.css (Accept-Encoding: gzip) returns 200 with Content-Encoding: gzip and the real gzip-compressed file', e); }

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

  function stageRow(id, name, position, extra) {
    return Object.assign({ id: id, name: name, position: position, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false }, extra || {});
  }

  const { handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');

  // Named distinctly from the writeHead/end-shaped makeMockRes() above --
  // both are `function` declarations in this same IIFE scope, and same-name
  // function declarations hoist such that the textually-later one wins for
  // the WHOLE scope (including calls made earlier in execution order), which
  // would have silently broken the AC5 tests above (res.writeHead would no
  // longer exist on their mock res).
  function makeCanvasMockRes() {
    return { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
  }

  // -- AC1: nodes in position order, auto-connected ------------------------
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      stageRow('s1', 'Discover', 0), stageRow('s2', 'Evaluate', 1), stageRow('s3', 'Buy', 2)
    ]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeCanvasMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(/id="sw-drawflow-canvas"/.test(html), 'expected a #sw-drawflow-canvas container');
    const idxS1 = html.indexOf('"s1"');
    const idxS2 = html.indexOf('"s2"');
    const idxS3 = html.indexOf('"s3"');
    assert.ok(idxS1 !== -1 && idxS2 !== -1 && idxS3 !== -1 && idxS1 < idxS2 && idxS2 < idxS3, 'expected node data for s1, s2, s3 in position order in the generated script');
    const connectionCount = (html.match(/addConnection/g) || []).length;
    assert.strictEqual(connectionCount, 2, 'expected exactly 2 addConnection calls for 3 sequential stages');
    pass('AC1: 3 stages render as drawflow nodes in position order with 2 auto-connections');
  } catch (e) { fail('AC1: 3 stages render as drawflow nodes in position order with 2 auto-connections', e); }

  // -- AC1 edge case: 1 stage, 0 connections --------------------------------
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [stageRow('s1', 'Only', 0)]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeCanvasMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const connectionCount = (res._b.bodyContent.match(/addConnection/g) || []).length;
    assert.strictEqual(connectionCount, 0, 'expected 0 connections for a single-stage journey');
    pass('AC1 (edge case): a single-stage journey renders 0 connections');
  } catch (e) { fail('AC1 (edge case): a single-stage journey renders 0 connections', e); }

  // -- AC2: existing per-stage actions preserved in BOTH renderings --------
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [stageRow('s1', 'Discover', 0)]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeCanvasMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(/sw-stage-edit[^>]*data-stage-id="s1"/.test(html), 'expected Edit-stage control for s1 (legacy list, unchanged)');
    assert.ok(/sw-stage-map-feature[^>]*data-stage-id="s1"/.test(html), 'expected Map-feature control for s1 (legacy list, unchanged)');
    // The SAME action controls must also be reachable from the new canvas node's own HTML content.
    const nodeHtmlMatch = html.match(/addNode\([^)]*"s1"[^)]*\)/);
    assert.ok(nodeHtmlMatch, 'expected an addNode(...) call referencing stage s1');
    pass('AC2: Edit-stage and Map-feature controls exist for s1, both in the legacy list and the new canvas node');
  } catch (e) { fail('AC2: Edit-stage and Map-feature controls exist for s1, both in the legacy list and the new canvas node', e); }

  // -- AC3: moment-of-truth badge on the flagged node only -----------------
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      stageRow('s1', 'Discover', 0, { moment_of_truth: true }),
      stageRow('s2', 'Evaluate', 1, { moment_of_truth: false })
    ]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeCanvasMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    const s1NodeCall = html.match(/addNode\([^;]*?"s1"[^;]*?\);/);
    const s2NodeCall = html.match(/addNode\([^;]*?"s2"[^;]*?\);/);
    assert.ok(s1NodeCall && /Moment of truth/.test(s1NodeCall[0]), 'expected s1\'s own node HTML to include the Moment of truth badge');
    assert.ok(s2NodeCall && !/Moment of truth/.test(s2NodeCall[0]), 'expected s2\'s own node HTML to NOT include the badge');
    pass('AC3: moment-of-truth badge appears in the flagged stage\'s own node content only');
  } catch (e) { fail('AC3: moment-of-truth badge appears in the flagged stage\'s own node content only', e); }

  // -- AC4: 0-stage empty state unchanged -----------------------------------
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeCanvasMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(/No stages yet\. Add your first stage\./.test(html), 'expected the unchanged empty-state message');
    assert.ok(!/addNode\(/.test(html), 'expected zero addNode calls for an empty journey');
    pass('AC4: 0-stage journey shows the unchanged empty-state message, no canvas nodes');
  } catch (e) { fail('AC4: 0-stage journey shows the unchanged empty-state message, no canvas nodes', e); }

  // -- AC6: client-side load guard ------------------------------------------
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [stageRow('s1', 'Discover', 0)]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeCanvasMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(/typeof\s+window\.Drawflow\s*===\s*['"]function['"]/.test(html), 'expected a window.Drawflow load guard before any node-rendering call');
    pass('AC6: client script guards against window.Drawflow being undefined');
  } catch (e) { fail('AC6: client script guards against window.Drawflow being undefined', e); }

  // -- AC5/AC6 regression: the drawflow asset must actually be requested on
  // the page, not just servable by the route handler. Found via a live
  // browser render check (verify-completion): Task 1 added the handler and
  // route, Task 2 added the init script that calls new window.Drawflow(...),
  // but neither ever added the <script src="/vendor/drawflow.min.js"> or
  // <link rel="stylesheet" href="/vendor/drawflow.min.css"> tag that loads
  // it -- window.Drawflow was always undefined in a real browser, so the
  // AC6 load-guard's failure branch fired unconditionally. None of the
  // above jsdom tests caught this because they only assert the init
  // script's own text, never whether the library that text depends on was
  // ever requested.
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [stageRow('s1', 'Discover', 0)]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeCanvasMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(/<script src="\/vendor\/drawflow\.min\.js"><\/script>/.test(html), 'expected a <script src="/vendor/drawflow.min.js"> tag so window.Drawflow is actually defined');
    assert.ok(/<link rel="stylesheet" href="\/vendor\/drawflow\.min\.css">/.test(html), 'expected a <link> tag loading drawflow.min.css so nodes/connections are actually styled');
    const scriptIdx = html.indexOf('<script src="/vendor/drawflow.min.js"></script>');
    const initIdx = html.indexOf('new window.Drawflow(');
    assert.ok(scriptIdx !== -1 && initIdx !== -1 && scriptIdx < initIdx, 'expected the vendor <script src> tag to appear before the inline script that constructs new window.Drawflow(...)');
    pass('AC5/AC6 (regression): the page actually requests drawflow.min.js/.css, and in the right document order');
  } catch (e) { fail('AC5/AC6 (regression): the page actually requests drawflow.min.js/.css, and in the right document order', e); }

  console.log(`\n[ic-s1-canvas-render] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
