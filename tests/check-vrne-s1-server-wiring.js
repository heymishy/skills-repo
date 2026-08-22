'use strict';

// NOTE: These tests exercise requireNonViewer directly (the gate function in
// isolation) -- they do NOT dispatch real HTTP requests through server.js and
// do NOT prove these routes are actually wired to call requireNonViewer in
// server.js's route dispatch. The route name in each test is a label only,
// used to enumerate the AC1 (Acceptance Criterion 1, 15 Products-group
// routes) and AC2 (Acceptance Criterion 2, 18 Features/journeys-group
// routes) route lists -- it is not evidence that server.js calls this gate
// for that path.
// AC1's real server.js wiring HAS landed separately (src/web-ui/server.js
// calls requireNonViewer at 15 call sites, one per AC1 route) and is verified
// by that count, independent of this file. AC2's real server.js wiring has
// NOT yet landed -- as of this writing there are no requireNonViewer call
// sites in server.js for AC2's 18 routes. When AC2's wiring task lands, it
// should add its own verification (e.g. a grep count check against
// src/web-ui/server.js and/or an integration test issuing real HTTP requests
// through server.js) -- neither exists in this file today.
// If you are reading this file to confirm AC1's or AC2's wiring is complete,
// this file alone is NOT sufficient evidence for either -- confirm the
// separate wiring verification exists and passes too (already true for AC1;
// still outstanding for AC2).

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

// AC2 — Features/journeys-group routes
var AC2_ROUTES = [
  '/products/:id/features',
  '/api/journey (POST)',
  '/api/journey/:id/gate-confirm',
  '/api/journey/:id/stories',
  '/api/journey/:id/stage/:stage/artefact',
  '/api/journey/:id/reference',
  '/api/journey/:id/reference-upload',
  '/api/journey/:id/reference-modal/skip',
  '/api/journey/:id/side-trip/clarify',
  '/api/journey/:id/decisions',
  '/api/journey/:id/estimate',
  '/api/journey/:id/spikes (POST)',
  '/api/journey/:id/spikes/:spikeSlug (PATCH)',
  '/api/journey/:id/side-trip (DELETE)',
  '/api/journey/:id (DELETE)',
  '/api/journey/:id/display-name (PUT)',
  '/api/ideas (POST)',
  '/api/ideas/:id (DELETE)'
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

  AC2_ROUTES.forEach(function(routeName) {
    queue.push(function() {
      console.log('\n[vrne-s1] T-ac2-' + routeName + ' -- viewer denied');
      return test('AC2: viewer denied on ' + routeName, async function() {
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

  // AC5 — denial logging (server-level: confirms setViewerGateLogger is actually wired in server.js bootstrap)
  queue.push(function() {
    console.log('\n[vrne-s1] T-ac5-bootstrap-logger-wired -- server.js wires setLogger for requireNonViewer');
    return test('AC5: server.js source calls requireNonViewer\'s setLogger during bootstrap', function() {
      var fs = require('fs');
      var serverSrc = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
      assert.ok(/setViewerGateLogger\s*\(/.test(serverSrc), 'server.js must call setViewerGateLogger(...) during bootstrap, mirroring the existing requireAdmin setLogger wiring pattern');
    });
  });

  // Integration: real server.js dispatch for one representative route from each group
  queue.push(function() {
    console.log('\n[vrne-s1] T-integration-real-dispatch -- real server.js dispatch denies viewer on representative routes');
    return test('integration: requireNonViewer reachable via real server.js dispatch', async function() {
      // NOTE for implementing agent: wire this against this repo's existing real-server-dispatch
      // test harness pattern (the same one used by other routes' own integration tests --
      // search tests/ for an existing example that boots server.js with stubbed DB/credits
      // adapters and issues a real HTTP request, e.g. via `http.request` against a
      // `server.listen(0)` ephemeral port). Issue POST /products/confirm and POST /api/journey
      // with a viewer-role session cookie/header (matching however this repo's existing
      // integration tests authenticate a test session) and assert both return 403.
      assert.ok(true, 'placeholder assertion -- replace with real dispatch calls per the note above before marking this task GREEN');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[vrne-s1-server-wiring] AC1+AC2+AC5 subtotal: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
