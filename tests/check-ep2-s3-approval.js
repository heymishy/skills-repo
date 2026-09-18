'use strict';
// tests/check-ep2-s3-approval.js — Part 1

// vrne-s1's own env-setup requirement for requiring server.js: must be set
// BEFORE that require() below runs, matching
// tests/check-vrne-s1-server-wiring.js's established setup for this exact
// real-dispatch pattern. NODE_ENV=test + no DATABASE_URL routes server.js to
// its bri-s3.2/rbg-s1 in-memory fake-test-db bootstrap branch, which wires a
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

const assert = require('assert');
const EventEmitter = require('events').EventEmitter;
const journeyRoute = require('../src/web-ui/routes/journey');
const router = require('../src/web-ui/server').router;
const seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;

async function testApprovalHandlerExists() {
  assert.strictEqual(typeof journeyRoute.handlePostJourneyApprove, 'function');
}
testApprovalHandlerExists()
  .then(() => console.log('  ok - approval handler exported'))
  .catch((err) => { console.error('  FAIL - testApprovalHandlerExists:', err.message); process.exitCode = 1; });

// Part 2 — vrne-s1 (AC2) regression: the new POST /api/journey/:journeyId/approve
// route must deny a viewer-role session with 403, exactly like its sibling
// /api/journey/:journeyId/gate-confirm route does. Task 2's server.js wiring
// initially omitted this gate (caught in spec-compliance review) -- this test
// guards against the gate being dropped again.
// Same real-dispatch + seed-multi-user-roles pattern as
// check-vrne-s1-server-wiring.js's own T-integration-real-dispatch test.

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

async function testApproveRouteDeniesViewer() {
  var sharedOrg = 'e2e-ep2-s3-approve-viewer-gate';
  await seedMultiUserRolesForIntegrationTest(sharedOrg);

  var sessionId = 'deadbeef02';
  seedTestSession(sessionId, {
    accessToken: 'e2e-test-access-token',
    userId: 9002,
    login: 'e2e-viewer',
    tenantId: sharedOrg
  });
  var cookieHeader = { cookie: 'session_id=' + sessionId };

  var req = { headers: cookieHeader, method: 'POST', url: '/api/journey/does-not-matter/approve' };
  var result = await dispatchAndAwaitResponse(req);
  assert.strictEqual(result.statusCode, 403, 'POST /api/journey/:id/approve must return 403 for a viewer-role session, got ' + result.statusCode + ' -- ' + result.body);
}
testApproveRouteDeniesViewer()
  .then(() => console.log('  ok - approve route denies viewer role (vrne-s1 AC2)'))
  .catch((err) => { console.error('  FAIL - testApproveRouteDeniesViewer:', err.message); process.exitCode = 1; });
