'use strict';

var assert = require('assert');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

// vrne-s2 (Task 10): `router` + `seedTestSession` for the real server.js
// dispatch integration test further below. Deliberately NOT required at
// module top level (unlike check-vrne-s1-server-wiring.js's own otherwise-
// identical setup, which lives in its own dedicated file): requiring
// '../src/web-ui/server' wires a live getCurrentRole adapter into
// require-admin.js's resolveRole() process-wide the moment it is required,
// which overrides req.session.role with a real (fake-backed) DB lookup on
// every subsequent requireNonViewer() call in THIS process -- including the
// AC1-AC6 isolated gate tests above, which use viewerSession()'s unseeded
// tenantId/login and would then resolve to the 'user' fallback role (i.e.
// ALLOWED) instead of 'viewer' (DENIED), flipping those tests from pass to
// fail. Requiring server.js lazily -- only inside the integration test's own
// queue.push callback below, which runs last -- keeps the earlier isolated
// tests' role resolution exactly as it was pre-Task-10. Mirrors the same
// require-ordering hazard check-vrne-s1-server-wiring.js's own comments
// document for viewerSession() (see that file's AC1_ROUTES/AC2_ROUTES
// section), just resolved here by deferring the require instead of seeding
// the isolated tests' identity (this file's own AC1-AC6 tests test the gate
// in isolation by design -- see Task 1's plan note -- so they should not
// need a seeded DB identity at all).
var router;
var seedTestSession;

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

// ── Real server.js dispatch helpers (Task 10 integration test) ─────────────
// Mirror check-vrne-s1-server-wiring.js's own helpers of the same name exactly.

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

function dispatchAndAwaitResponse(req) {
  return new Promise(function(resolve, reject) {
    var res = integrationMockRes();
    var settled = false;
    var origEnd = res.end;
    res.end = function(body) {
      origEnd(body);
      if (!settled) { settled = true; resolve(res._get()); }
    };
    router(req, res).catch(function(err) {
      if (!settled) { settled = true; reject(err); }
    });
  });
}

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

async function main() {
  var queue = [];

  // AC1 — session start (2 call sites: form path server.js-wrapped, JSON path skills.js-internal)
  ['session-start-form', 'session-start-json'].forEach(function(routeName) {
    queue.push(function() {
      console.log('\n[vrne-s2] T-ac1-' + routeName + ' -- viewer denied');
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

  // AC2 — turn/turn-stream/answers/answer (4 call sites)
  ['turn', 'turn-stream', 'answers-json', 'answer-form'].forEach(function(routeName) {
    queue.push(function() {
      console.log('\n[vrne-s2] T-ac2-' + routeName + ' -- viewer denied');
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

  // AC3 — commit-form/commit-json/execute (3 call sites)
  ['commit-form', 'commit-json', 'execute'].forEach(function(routeName) {
    queue.push(function() {
      console.log('\n[vrne-s2] T-ac3-' + routeName + ' -- viewer denied');
      return test('AC3: viewer denied on ' + routeName, async function() {
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

  // AC5 — canvas-edit/assumption-confirm (2 call sites, added via /decisions 2026-08-22 SCOPE entry)
  ['canvas-edit', 'assumption-confirm'].forEach(function(routeName) {
    queue.push(function() {
      console.log('\n[vrne-s2] T-ac5-' + routeName + ' -- viewer denied');
      return test('AC5: viewer denied on ' + routeName, async function() {
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

  // AC4 — non-viewer roles unaffected (regression guard)
  [
    { role: 'engineer', route: 'turn' },
    { role: 'product',  route: 'commit-json' },
    { role: 'admin',    route: 'execute' }
  ].forEach(function(c) {
    queue.push(function() {
      console.log('\n[vrne-s2] T-ac4-' + c.role + '-' + c.route + ' -- non-viewer unaffected');
      return test('AC4: role=' + c.role + ' proceeds on ' + c.route, async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = { session: { userId: 'u2', role: c.role, tenantId: 't1', login: c.role + '@test' } };
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.ok(nextCalled, 'next() should be called for role=' + c.role);
        assert.strictEqual(res._status, null, 'no response should be written for allowed roles');
      });
    });
  });

  // AC6 — denial logging, same shape as vrne-s1's AC5
  queue.push(function() {
    console.log('\n[vrne-s2] T-ac6-denial-logged -- skill-session denial logged');
    return test('AC6: denial on a skill-session route logs personId, tenantId, timestamp, route', async function() {
      var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
      var loggedEvent = null;
      var loggedPayload = null;
      gate.setLogger({ warn: function(event, payload) { loggedEvent = event; loggedPayload = payload; } });
      var req = { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' }, url: '/api/skills/discovery/sessions/abc/turn' };
      var res = makeRes();
      await gate.requireNonViewer(req, res, function() {});
      assert.strictEqual(loggedEvent, 'viewer_write_denied');
      assert.strictEqual(loggedPayload.personId, 'u1');
      assert.strictEqual(loggedPayload.tenantId, 't1');
      assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(loggedPayload.timestamp));
      assert.strictEqual(loggedPayload.route, '/api/skills/discovery/sessions/abc/turn');
    });
  });

  // Integration: real server.js dispatch for Pattern-A, Pattern-B, and AC5
  // (Task 10). Issues real dispatches through the actual exported `router`
  // function -- not a direct requireNonViewer() call like the AC1-AC6 tests
  // above -- so this fails if server.js's (or skills.js's) wiring for any of
  // these call sites is ever removed. Three routes are covered because 3 of
  // this story's 11 call sites are Pattern B (gated internally in skills.js,
  // no server.js wrapper), and AC5's canvas-edit call sites are this story's
  // own NFR-designated "highest-value security gate in the epic" -- see the
  // plan's Task 10 note for the full rationale. Written as three separately
  // counted test() calls (not one test with three assertions bundled inside)
  // so each route's pass/fail is independently visible in the queue-based
  // runner's tally -- matching the plan's own "18 passed" expected count
  // (15 AC1-AC6 + 3 integration) and its "Write all three integration tests"
  // Step 1 title.
  var INTEGRATION_SHARED_ORG = 'e2e-vrne-s2-integration';
  var INTEGRATION_SESSION_ID = 'faceb00c02';

  // Setup step -- seeds the shared org's multi-user roles and the viewer
  // session the three route tests below all reuse. Deliberately does NOT
  // call test() (no pass/fail recorded here): it is one-time fixture setup,
  // not an assertion. Lazily requires '../src/web-ui/server' here (not at
  // module top level) -- see the top-of-file comment above `var router;` for
  // why: requiring it wires a live role adapter process-wide that would
  // otherwise flip the AC1-AC6 isolated gate tests above (which run first,
  // via this same queue) from pass to fail.
  queue.push(function() {
    console.log('\n[vrne-s2] T-integration-setup -- seed multi-user roles + viewer session for integration tests');
    return (async function() {
      process.env.NODE_ENV             = 'test';
      process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
      process.env.GITHUB_CLIENT_ID     = 'test-client-id';
      process.env.GITHUB_CLIENT_SECRET = 'test-secret';
      process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
      delete process.env.POSTHOG_KEY;
      delete process.env.DATABASE_URL;
      router = require('../src/web-ui/server').router;
      seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;

      await seedMultiUserRolesForIntegrationTest(INTEGRATION_SHARED_ORG);
      seedTestSession(INTEGRATION_SESSION_ID, {
        accessToken: 'e2e-test-access-token',
        userId: 9001,
        login: 'e2e-viewer',
        tenantId: INTEGRATION_SHARED_ORG
      });
    })();
  });

  [
    { label: 'Pattern A: POST /turn (authGuard-wrapped in server.js)', url: '/api/skills/discovery/sessions/dummy-session/turn', jsonBody: false },
    { label: 'Pattern B: POST /answers (internally gated in skills.js, no server.js wrapper)', url: '/api/skills/discovery/sessions/dummy-session/answers', jsonBody: true },
    { label: 'AC5: POST /canvas-edit', url: '/api/skills/discovery/sessions/dummy-session/canvas-edit', jsonBody: true }
  ].forEach(function(c) {
    queue.push(function() {
      console.log('\n[vrne-s2] T-integration-real-dispatch -- ' + c.label);
      return test('integration: requireNonViewer reachable via real server.js dispatch -- ' + c.label, async function() {
        var cookieHeader = { cookie: 'session_id=' + INTEGRATION_SESSION_ID };
        var headers = c.jsonBody ? Object.assign({ 'content-type': 'application/json' }, cookieHeader) : cookieHeader;
        var req = { headers: headers, method: 'POST', url: c.url };
        var result = await dispatchAndAwaitResponse(req);
        assert.strictEqual(result.statusCode, 403, c.url + ' must return 403 for a viewer-role session, got ' + result.statusCode + ' -- ' + result.body);
      });
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[vrne-s2-skill-session-gate] AC1+AC2+AC3+AC4+AC5+AC6 subtotal: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
