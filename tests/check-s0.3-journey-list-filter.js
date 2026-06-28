'use strict';

// check-s0.3-journey-list-filter.js
// Verifies s0.3: handleGetJourney (GET /journey) filters the journey list to the
// current session's tenantId. Cross-tenant journeys must not appear in the list.
//
// Run: node tests/check-s0.3-journey-list-filter.js

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function fakeRes() {
  var r = { _status: null, _body: '', _headers: {} };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body = b || ''; };
  return r;
}

function fakeReq(session, query) {
  return { session: session, params: {}, query: query || {}, url: '/journey' };
}

// ── wire up a stub journey store ──────────────────────────────────────────────

var journeyRoute = require('../src/web-ui/routes/journey');

var _aliceJourney = {
  journeyId: 'j-alice-1', featureSlug: '2026-06-29-alice-feature',
  ownerId: 'alice', tenantId: 'alice', createdAt: '2026-06-29T00:00:00Z',
  currentStage: 'discovery', stages: {}, productProfile: 'default'
};
var _bobJourney = {
  journeyId: 'j-bob-1', featureSlug: '2026-06-29-bob-feature',
  ownerId: 'bob', tenantId: 'bob', createdAt: '2026-06-29T01:00:00Z',
  currentStage: 'discovery', stages: {}, productProfile: 'default'
};
var _orgJourney = {
  journeyId: 'j-org-1', featureSlug: '2026-06-29-org-feature',
  ownerId: 'alice', tenantId: 'myorg', createdAt: '2026-06-29T02:00:00Z',
  currentStage: 'discovery', stages: {}, productProfile: 'default'
};

var stubStore = {
  listJourneys: function() { return [_aliceJourney, _bobJourney, _orgJourney]; },
  getJourney:   function() { return null; }
};

journeyRoute.setJourneyStoreModule(stubStore);
journeyRoute.setRepoRoot('/tmp/s03-test');

var { handleGetJourney } = journeyRoute;

// ── AC1: alice only sees her own journeys ─────────────────────────────────────

console.log('\nAC1 — alice (tenantId=alice) sees only her journey');
(function() {
  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' });
  var res = fakeRes();
  handleGetJourney(req, res);
  ok('alice-feature appears in response',     res._body.indexOf('alice-feature') !== -1);
  ok('bob-feature NOT in alice response',     res._body.indexOf('bob-feature')   === -1);
  ok('org-feature NOT in alice response',     res._body.indexOf('org-feature')   === -1);
  ok('200 response',                          res._status === 200);
})();

// ── AC2: bob only sees his own journeys ───────────────────────────────────────

console.log('\nAC2 — bob (tenantId=bob) sees only his journey');
(function() {
  var req = fakeReq({ accessToken: 'tok', login: 'bob', tenantId: 'bob' });
  var res = fakeRes();
  handleGetJourney(req, res);
  ok('bob-feature appears in response',       res._body.indexOf('bob-feature')   !== -1);
  ok('alice-feature NOT in bob response',     res._body.indexOf('alice-feature') === -1);
  ok('org-feature NOT in bob response',       res._body.indexOf('org-feature')   === -1);
})();

// ── AC3: org member sees only org journeys ────────────────────────────────────

console.log('\nAC3 — org user (tenantId=myorg) sees only org journey');
(function() {
  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'myorg' });
  var res = fakeRes();
  handleGetJourney(req, res);
  ok('org-feature appears in response',       res._body.indexOf('org-feature')   !== -1);
  ok('alice-feature NOT in org response',     res._body.indexOf('alice-feature') === -1);
  ok('bob-feature NOT in org response',       res._body.indexOf('bob-feature')   === -1);
})();

// ── AC4: no tenantId (pre-s0.2 session) → all journeys shown (backward compat) ──

console.log('\nAC4 — no tenantId → all journeys shown (backward compat for pre-s0.2 sessions)');
(function() {
  // After s0.2 every new session has tenantId = user.login, so a missing tenantId
  // means a session created before s0.2 was deployed.  Skipping the filter for these
  // sessions (rather than showing an empty list) preserves continuity for existing
  // operators upgrading in place.
  var req = fakeReq({ accessToken: 'tok', login: 'ghost' });  // no tenantId
  var res = fakeRes();
  handleGetJourney(req, res);
  ok('all journeys shown when tenantId absent (backward compat)',
    res._body.indexOf('alice-feature') !== -1
    && res._body.indexOf('bob-feature')   !== -1
    && res._body.indexOf('org-feature')   !== -1);
  ok('200 response', res._status === 200);
})();

// ── AC5: unauthenticated → redirect ──────────────────────────────────────────

console.log('\nAC5 — unauthenticated GET /journey → 302');
(function() {
  var req = fakeReq({});  // no accessToken
  var res = fakeRes();
  handleGetJourney(req, res);
  ok('unauthenticated → 302', res._status === 302);
})();

console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
process.exit(failed > 0 ? 1 : 0);
