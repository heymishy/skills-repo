'use strict';

// vrne-s1 (Task 10, Part B): env vars required to require('../src/web-ui/server')
// -- must be set BEFORE that require() below runs. Mirrors
// tests/check-jsvr-s1-wire-stage-view-route.js's own top-of-file setup (the
// established pattern in this codebase for tests that dispatch real requests
// through server.js's router). NODE_ENV=test + no DATABASE_URL routes server.js
// to its bri-s3.2/rbg-s1 in-memory fake-test-db bootstrap branch, which wires a
// real (fake-backed) getCurrentRole adapter -- required for requireNonViewer's
// live role resolution to see the viewer role seeded via
// /test/seed-multi-user-roles below.
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

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
var EventEmitter = require('events').EventEmitter;

// vrne-s1 (Task 10, Part B): real server.js dispatch requires for the
// integration test below -- same `router` + `seedTestSession` pair
// check-jsvr-s1-wire-stage-view-route.js already uses successfully for this
// exact real-dispatch pattern.
var router = require('../src/web-ui/server').router;
var seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;

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

// ── Real server.js dispatch helpers (Task 10, Part B integration test) ──────
// mockReq/mockRes mirror check-jsvr-s1-wire-stage-view-route.js's own
// mockReq/mockRes exactly (the proven real-router-dispatch pattern already
// used successfully elsewhere in this codebase).

function integrationMockRes() {
  var _statusCode = null;
  var _headers = {};
  var _chunks = [];
  return {
    writeHead: function(code, headers) { _statusCode = code; Object.assign(_headers, headers || {}); return this; },
    setHeader: function(k, v) { _headers[k] = v; },
    end: function(body) { if (body != null) _chunks.push(body); },
    _get: function() { return { statusCode: _statusCode, headers: _headers, body: _chunks.join('') }; }
  };
}

// Dispatches req/res through the real router and resolves once the response
// actually completes (res.end() fires) -- NOT once router()'s own returned
// promise resolves. Required because /products/confirm's route branch calls
// `authGuard(req, res, async () => { ... })` without awaiting or returning
// authGuard's inner promise (authGuard itself is fire-and-forget: it invokes
// next() and only .catch()es it for unhandled errors, it never awaits or
// returns that promise up to the router() caller). That means
// `await router(req, res)` resolves BEFORE the async requireNonViewer check
// inside that callback has actually written a status code -- confirmed by
// running this exact assertion pattern first: it observed statusCode===null
// synchronously, with the real 403 write (and audit log line) landing only
// afterward. /api/journey's own branch (no authGuard wrapper) awaits
// requireNonViewer directly inline, so router()'s promise already resolves
// correctly for it -- but this helper is used for both dispatches so the
// test does not depend on which internal pattern each route happens to use.
function dispatchAndAwaitResponse(req) {
  return new Promise(function(resolve, reject) {
    var res = integrationMockRes();
    var origEnd = res.end;
    var settled = false;
    res.end = function(body) {
      origEnd(body);
      if (!settled) { settled = true; resolve(res._get()); }
    };
    router(req, res).catch(function(err) {
      if (!settled) { settled = true; reject(err); }
    });
  });
}

// Seeds e2e-alice (admin), e2e-bob (engineer) and e2e-viewer (viewer) team
// roles for the given shared org via the real /test/seed-multi-user-roles
// route -- the SAME real, already-proven endpoint
// check-jsvr-s1-wire-stage-view-route.js's own seedMultiUserRoles() uses.
// That route reads its body via req.on('data'/'end') rather than a
// pre-parsed req.body, so this dispatch uses an EventEmitter-based fake req
// (the same fix check-jsvr-s1-wire-stage-view-route.js's commit 05409b17
// established for exactly this situation) -- router() runs an unconditional
// `await sessionMiddleware(req, res)` before reaching this pathname's
// branch, so the 'data'/'end' listeners are not attached synchronously;
// await router() first, THEN emit the body.
function seedMultiUserRolesForIntegrationTest(sharedOrg) {
  return new Promise(function(resolve, reject) {
    var req = new EventEmitter();
    req.method = 'POST';
    req.url = '/test/seed-multi-user-roles';
    req.headers = { 'content-type': 'application/json' };
    var res = integrationMockRes();
    var origEnd = res.end;
    res.end = function(body) {
      origEnd(body);
      var result = res._get();
      if (result.statusCode !== 200) {
        reject(new Error('seed-multi-user-roles failed: ' + result.statusCode + ' ' + result.body));
      } else {
        resolve(result);
      }
    };
    router(req, res).then(function() {
      req.emit('data', JSON.stringify({ sharedOrg: sharedOrg }));
      req.emit('end');
    }).catch(reject);
  });
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
  // (Task 10, Part B). Issues two REAL dispatches through the actual exported
  // `router` function -- not a direct requireNonViewer() call like the AC1/AC2
  // tests above -- so this fails if server.js's wiring for either call site is
  // ever removed, matching the regression-guard rationale
  // check-jsvr-s1-wire-stage-view-route.js documents for its own real-dispatch
  // tests.
  queue.push(function() {
    console.log('\n[vrne-s1] T-integration-real-dispatch -- real server.js dispatch denies viewer on representative routes');
    return test('integration: requireNonViewer reachable via real server.js dispatch', async function() {
      var sharedOrg = 'e2e-vrne-s1-integration';
      await seedMultiUserRolesForIntegrationTest(sharedOrg);

      var sessionId = 'faceb00c01';
      seedTestSession(sessionId, {
        accessToken: 'e2e-test-access-token',
        userId: 9001,
        login: 'e2e-viewer',
        tenantId: sharedOrg
      });
      var cookieHeader = { cookie: 'session_id=' + sessionId };

      // AC1: POST /products/confirm (Products-group route, authGuard-wrapped)
      var req1 = { headers: cookieHeader, method: 'POST', url: '/products/confirm' };
      var result1 = await dispatchAndAwaitResponse(req1);
      assert.strictEqual(result1.statusCode, 403, 'POST /products/confirm must return 403 for a viewer-role session, got ' + result1.statusCode + ' -- ' + result1.body);

      // AC2: POST /api/journey (Features/journeys-group route, no authGuard wrapper)
      var req2 = { headers: cookieHeader, method: 'POST', url: '/api/journey' };
      var result2 = await dispatchAndAwaitResponse(req2);
      assert.strictEqual(result2.statusCode, 403, 'POST /api/journey must return 403 for a viewer-role session, got ' + result2.statusCode + ' -- ' + result2.body);
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
