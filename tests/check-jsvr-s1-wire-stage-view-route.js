#!/usr/bin/env node
// check-jsvr-s1-wire-stage-view-route.js — regression test for jsvr-s1.
//
// GET /journey/:journeyId/stage/:stageName (handleGetJourneyStageView) and its
// sibling POST /api/journey/:journeyId/stage/:stageName/artefact
// (handlePostJourneyStageArtefact) were fully implemented and unit-tested in
// journey.js, but were never registered in server.js's router -- every
// breadcrumb "view a completed stage" link in the app pointed at a URL the
// server could not actually answer, silently falling through to the sign-in
// page instead. This test dispatches real pathnames through the ACTUAL
// exported router (not a direct handler call), so it fails if the wiring is
// ever removed again -- the same gap that let the original bug ship
// undetected (check-p0.2-journey-guard-wiring.js calls the handler function
// directly and never exercises server.js's dispatch chain at all).
//
// Tests FAIL until the two `else if` branches are added to server.js's router.

'use strict';

process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

var passed = 0;
var failed = 0;

function check(label, ok) {
  if (ok) {
    console.log('  ✓ ' + label);
    passed++;
  } else {
    console.error('  ✗ ' + label);
    failed++;
  }
}

var os = require('os');
var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;

var router, seedTestSession, journeyStore, journeyRoutes;
try {
  router = require('../src/web-ui/server').router;
  seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;
  journeyStore = require('../src/web-ui/modules/journey-store');
  journeyRoutes = require('../src/web-ui/routes/journey');
} catch (e) {
  console.error('FATAL: could not load server.js / session middleware / journey-store:', e.message);
  process.exit(1);
}

journeyStore._clearForTesting();

// Point the artefact read/write path at a scratch temp directory so this
// router-dispatch test (which exercises handlePostJourneyStageArtefact's
// real fs.writeFileSync) never touches the actual repo tree.
var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jsvr-s1-'));
journeyRoutes.setRepoRoot(_scratchRoot);

// ── Mock req/res ─────────────────────────────────────────────────────────────

function mockReq(overrides) {
  return Object.assign({ headers: {}, method: 'GET', url: '/' }, overrides || {});
}

function mockRes() {
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

function seedSession(sessionId, fields) {
  seedTestSession(sessionId, Object.assign({
    accessToken: 'tok-' + sessionId,
    userId: 1,
    login: 'alice',
    tenantId: 'e2e-tester'
  }, fields || {}));
}

// vrne-s1 surfaced a pre-existing gap: this file's seedSession() never seeded
// a matching team_memberships role row, so requireNonViewer's live role
// resolution (added in vrne-s1) fail-closed 403s the AC3 request instead of
// reaching the real handler. Completing the fixture (not weakening the gate)
// by seeding a real, resolvable role via the same staging-safe
// /test/seed-multi-user-roles endpoint dss-s1/nis-s1 already provide -- it
// writes through the SAME in-memory fake-test-db instance server.js wires
// internally (see server.js's `if (!process.env.DATABASE_URL)` bootstrap
// block), which this test has no other handle on. Dispatches the request
// through the real `router(req, res)` (matching this file's own
// direct-router-dispatch convention) with an EventEmitter-based req, since
// the route reads its body via req.on('data'/'end') rather than a
// pre-parsed req.body.
function seedMultiUserRoles(sharedOrg) {
  return new Promise(function(resolve, reject) {
    var req = new EventEmitter();
    req.method = 'POST';
    req.url = '/test/seed-multi-user-roles';
    req.headers = { 'content-type': 'application/json' };
    var res = mockRes();
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
    // router() runs an unconditional `await sessionMiddleware(req, res)`
    // before reaching this pathname's branch, so the 'data'/'end' listeners
    // are not attached synchronously -- await router() fully first (it
    // registers the listeners then returns without waiting on the body,
    // mirroring real Node http streaming) and only then emit the body,
    // otherwise the emitted events are lost before anything is listening.
    router(req, res).then(function() {
      req.emit('data', JSON.stringify({ sharedOrg: sharedOrg }));
      req.emit('end');
    }).catch(reject);
  });
}

async function main() {
  // ── Fixture: a journey with one completed stage ("discovery") ─────────────
  var journey = journeyStore.createJourney('jsvr-s1-test-feature', 'default');
  journeyStore.completeStage(journey.journeyId, 'discovery', 'artefacts/jsvr-s1-test-feature/discovery.md', null, 'seed-sid-1');
  journeyStore.setJourneyFields(journey.journeyId, { activeSkill: 'benefit-metric', activeSessionId: 'seed-sid-2' });

  var SIGN_IN_MARKER = 'Sign in — Skills Platform';

  // ── AC1: GET .../stage/:completedStage reaches handleGetJourneyStageView ──
  await (async function () {
    seedSession('aaaa1111', {});
    var req = mockReq({ url: '/journey/' + journey.journeyId + '/stage/discovery', headers: { cookie: 'session_id=aaaa1111' } });
    var res = mockRes();
    await router(req, res);
    var result = res._get();
    check('AC1: GET /journey/:id/stage/discovery does not fall through to the sign-in page', result.body.indexOf(SIGN_IN_MARKER) === -1);
    check('AC1: GET /journey/:id/stage/discovery returns 200 with the stage-view title', result.statusCode === 200 && result.body.indexOf('Discovery') !== -1);
  })();

  // ── AC1 (edge case): a non-completed stageName falls back to the existing
  //    internal redirect-to-chat behaviour, now actually reachable ─────────
  await (async function () {
    seedSession('bbbb2222', {});
    var req = mockReq({ url: '/journey/' + journey.journeyId + '/stage/not-a-real-stage', headers: { cookie: 'session_id=bbbb2222' } });
    var res = mockRes();
    await router(req, res);
    var result = res._get();
    // aslr-s1: this fallback now routes through the existing resume endpoint
    // instead of a raw session URL, so it can never dead-end on a stale
    // activeSessionId (the endpoint itself resolves live/Redis-restorable/
    // expired sessions correctly).
    check('AC1 edge case: unknown stageName 302-redirects through the resume endpoint (handler\'s own fallback, now reachable, and dead-end-proof per aslr-s1)', result.statusCode === 302 && result.headers.Location === '/journey/jsvr-s1-test-feature/resume');
  })();

  // ── AC2: unauthenticated request 302s to /auth/github, not the sign-in page body ──
  await (async function () {
    var req = mockReq({ url: '/journey/' + journey.journeyId + '/stage/discovery', headers: {} });
    var res = mockRes();
    await router(req, res);
    var result = res._get();
    check('AC2: unauthenticated GET redirects to /auth/github', result.statusCode === 302 && result.headers.Location === '/auth/github');
  })();

  // ── AC3: POST .../stage/:name/artefact reaches handlePostJourneyStageArtefact ──
  await (async function () {
    // vrne-s1: requireNonViewer now live-resolves this session's role before
    // the real handler runs. 'e2e-tester' (this suite's default tenantId,
    // already 'e2e-'-prefixed) is seeded via /test/seed-multi-user-roles with
    // 'e2e-bob' as an 'engineer' -- an ALLOWED_ROLES role -- so the session
    // below authenticates as a normal, legitimate non-viewer identity, not a
    // role-less one the gate correctly denies.
    await seedMultiUserRoles('e2e-tester');
    seedSession('cccc3333', { login: 'e2e-bob' });
    var req = mockReq({
      method: 'POST',
      url: '/api/journey/' + journey.journeyId + '/stage/discovery/artefact',
      headers: { cookie: 'session_id=cccc3333' },
      body: { content: 'edited artefact text' }
    });
    var res = mockRes();
    await router(req, res);
    var result = res._get();
    check('AC3: POST artefact-save route does not fall through to the sign-in page', result.body.indexOf(SIGN_IN_MARKER) === -1);
    check('AC3: POST artefact-save route redirects back to the stage-view page (real handler\'s own success response)', result.statusCode === 302 && !!result.headers.Location && result.headers.Location.indexOf('/stage/discovery') !== -1);
  })();

  // ── AC4: regression guard — these are real router-dispatch tests, not
  //    direct handler calls, so removing the wiring fails AC1/AC3 above.
  //    (No separate test body — AC1/AC3 themselves are the AC4 guard.) ─────

  console.log('\n--- check-jsvr-s1-wire-stage-view-route Results ---');
  console.log('Passed: ' + passed + '  Failed: ' + failed);
  if (failed > 0) process.exitCode = 1;
}

function cleanup() {
  try { fs.rmSync(_scratchRoot, { recursive: true, force: true }); } catch (_) {}
}

main()
  .then(cleanup)
  .catch(function (err) {
    cleanup();
    console.error('FATAL:', err.message, err.stack);
    process.exit(1);
  });
