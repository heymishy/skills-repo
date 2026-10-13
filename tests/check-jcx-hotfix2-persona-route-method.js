'use strict';
// check-jcx-hotfix2-persona-route-method.js -- regression test for jcx-hotfix2
// (Epic: journey-map-and-placeholder-trigger, 2026-10-11-journey-cx-redesign).
//
// Found via live Chrome verification on wuce-staging.fly.dev: the persona
// editor's real client code (journeys.js's own jcxSubmitJson helper) always
// sends POST, but the route was wired for PATCH only (src/web-ui/server.js).
// Every handler-level/jsdom test for jcx-s4 mocked window.fetch directly and
// never caught this, since none of them dispatched the client's own exact
// request shape through the real server.js router. This test reuses the
// real-dispatch harness pattern from check-jcx-s5-authorization.js /
// check-vrne-s4-edge-case-gate.js to close that gap permanently.
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  try {
    process.env.NODE_ENV             = 'test';
    process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
    process.env.GITHUB_CLIENT_ID     = 'test-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-secret';
    process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
    delete process.env.POSTHOG_KEY;
    delete process.env.DATABASE_URL;

    var router = require('../src/web-ui/server').router;
    var seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;
    var EventEmitter = require('events').EventEmitter;

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

    function postJson(req, payload) {
      // A real stream.Readable (not a bare EventEmitter with manually-fired
      // events) -- req.on('data', fn) attached LATER than this call (e.g.
      // after requireNonViewer's own async role-lookup hop, as on this
      // route) must still receive the body. A Readable in paused mode
      // buffers pushed chunks until a listener attaches; a bare EventEmitter
      // drops emit() calls that have no listener yet, which silently hangs
      // any route with an async gate before its own body-read step.
      var Readable = require('stream').Readable;
      return new Promise(function(resolve, reject) {
        var r = new Readable({ read: function() {} });
        Object.assign(r, req);
        r.push(JSON.stringify(payload));
        r.push(null);
        var res = integrationMockRes();
        var origEnd = res.end;
        res.end = function(body) {
          origEnd(body);
          resolve(res._get());
        };
        router(r, res).catch(reject);
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

    var sharedOrg = 'e2e-jcx-hotfix2-integration';
    await seedMultiUserRolesForIntegrationTest(sharedOrg);

    var sessionId = '7a1e5b0fd1';
    var csrfToken = 'jcx-hotfix2-csrf-probe';
    seedTestSession(sessionId, {
      accessToken: 'e2e-test-access-token',
      userId: 9003,
      login: 'e2e-tester',
      tenantId: sharedOrg,
      csrfToken: csrfToken
    });
    var cookieHeader = { cookie: 'session_id=' + sessionId };

    // -- the real client's exact request shape: POST, JSON body including
    // _csrf (journeys.js's own jcxSubmitJson call site always includes it
    // in the payload, never as a header) --
    var saveResult = await postJson(
      { headers: Object.assign({ 'content-type': 'application/json' }, cookieHeader), method: 'POST', url: '/journeys/does-not-exist/persona' },
      { persona_name: 'probe', persona_role: 'probe', persona_goal: 'probe', _csrf: csrfToken }
    );
    // A nonexistent journey id correctly 404s from inside the real handler --
    // proving the POST request reached handlePatchJourneyPersona itself,
    // not the unrelated sign-in-page catch-all (which would return 200 with
    // an HTML body instead).
    assert.strictEqual(saveResult.statusCode, 404, 'expected the real handler to run and 404 on an unknown journey id (not fall through to the catch-all, which would return 200 HTML) -- got ' + saveResult.statusCode + ' ' + saveResult.body.slice(0, 120));
    assert.ok(saveResult.body.indexOf('journey not found') !== -1, 'expected the real handler\'s own "journey not found" message, not the catch-all sign-in page HTML -- got: ' + saveResult.body.slice(0, 120));

    pass('jcx-hotfix2: POST /journeys/:id/persona reaches the real handler (not the catch-all) via a real server.js router dispatch');
  } catch (e) { fail('jcx-hotfix2: POST /journeys/:id/persona reaches the real handler (not the catch-all) via a real server.js router dispatch', e); }

  console.log(`\n[jcx-hotfix2-persona-route-method] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
