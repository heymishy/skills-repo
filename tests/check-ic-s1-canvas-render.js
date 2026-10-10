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

  console.log(`\n[ic-s1-canvas-render] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
