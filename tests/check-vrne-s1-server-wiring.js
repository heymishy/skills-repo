'use strict';

// NOTE: These tests exercise requireNonViewer directly (the gate function in
// isolation) -- they do NOT dispatch real HTTP requests through server.js and
// do NOT prove these 15 routes are actually wired to call requireNonViewer in
// server.js's route dispatch. The route name in each test is a label only,
// used to enumerate the AC1 (Acceptance Criterion 1) route list -- it is not
// evidence that server.js calls this gate for that path.
// Real server.js wiring is a separate task in this story's implementation
// plan and is not yet verified by any test in this file. When that wiring
// task lands, it should add its own verification (e.g. a grep count check
// against src/web-ui/server.js and/or an integration test issuing real HTTP
// requests through server.js) -- neither exists in this file today.
// If you are reading this file to confirm AC1's wiring is complete, this file
// alone is NOT sufficient evidence -- confirm the separate wiring
// verification exists and passes too.

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var REQUIRE_NON_VIEWER_PATH = path.resolve(__dirname, '../src/web-ui/middleware/require-non-viewer.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

function viewerSession() {
  return { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' } };
}

// AC1 — Products-group routes
var AC1_ROUTES = [
  '/products/new',
  '/products/confirm',
  '/products/:id/sync',
  '/products/:id/repo',
  '/products/:id (DELETE)',
  '/products/:id (PUT)',
  '/products/:id/repo/create',
  '/api/board/journey/:journeyId/advance',
  '/products/:id/guardrails/form',
  '/products/:id/guardrails/promote',
  '/products/:id/modules',
  '/products/:id/modules/:moduleId (PUT)',
  '/products/:id/modules/:moduleId (DELETE)',
  '/products/:id/epics/:epicId/module',
  '/products/:id/modules/bulk-assign'
];

async function main() {
  var queue = [];

  AC1_ROUTES.forEach(function(routeName) {
    queue.push(function() {
      console.log('\n[vrne-s1] T-ac1-' + routeName + ' -- viewer denied');
      return test('AC1: viewer denied on ' + routeName, async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = viewerSession();
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.strictEqual(nextCalled, false, routeName + ': next() must not be called for viewer');
        assert.strictEqual(res._status, 403, routeName + ': status must be 403');
      });
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[vrne-s1-server-wiring] AC1 subtotal: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
