'use strict';

// check-jlfc-s1-journey-legacy-filter-cutoff.js
// Verifies jlfc-s1: handleGetJourney's pre-tenancy migration-grace filter is
// time-bound to the actual tenancy rollout (2026-06-29, commit 2c0fb7ca) --
// a tenant-less journey created AFTER that point must not be granted grace
// visibility just because its ownerId matches the current user.
//
// Run: node tests/check-jlfc-s1-journey-legacy-filter-cutoff.js

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

var _postCutoffTenantLessJourney = {
  journeyId: 'j-post-cutoff-1', featureSlug: '2026-08-01-e2e-test-artifact',
  ownerId: 'kim', tenantId: null, createdAt: '2026-08-01T00:00:00Z',
  currentStage: 'discovery', stages: {}, productProfile: 'default'
};
var _preCutoffTenantLessJourney = {
  journeyId: 'j-pre-cutoff-1', featureSlug: '2026-05-01-genuine-legacy-feature',
  ownerId: 'kim', tenantId: null, createdAt: '2026-05-01T00:00:00Z',
  currentStage: 'discovery', stages: {}, productProfile: 'default'
};
var _noCreatedAtTenantLessJourney = {
  journeyId: 'j-no-created-at-1', featureSlug: '2026-01-01-ancient-no-timestamp-feature',
  ownerId: 'kim', tenantId: null,
  currentStage: 'discovery', stages: {}, productProfile: 'default'
};

var stubStore = {
  listJourneys: function() {
    return [_postCutoffTenantLessJourney, _preCutoffTenantLessJourney, _noCreatedAtTenantLessJourney];
  },
  getJourney: function() { return null; }
};

journeyRoute.setJourneyStoreModule(stubStore);
journeyRoute.setRepoRoot('/tmp/jlfc-s1-test');

var { handleGetJourney } = journeyRoute;

(async function main() {

// ── AC1: post-cutoff tenant-less journey excluded, even when owner matches ────

console.log('\nAC1 — post-cutoff tenant-less journey excluded even when ownerId matches');
await (async function() {
  var req = fakeReq({ accessToken: 'tok', login: 'kim', tenantId: 'kim-tenant' });
  var res = fakeRes();
  await handleGetJourney(req, res);
  ok('post-cutoff e2e-test-artifact feature NOT in response',
    res._body.indexOf('e2e-test-artifact') === -1);
  ok('200 response', res._status === 200);
})();

// ── AC2: pre-cutoff tenant-less journey still included when owner matches ─────

console.log('\nAC2 — pre-cutoff tenant-less journey still included when ownerId matches');
await (async function() {
  var req = fakeReq({ accessToken: 'tok', login: 'kim', tenantId: 'kim-tenant' });
  var res = fakeRes();
  await handleGetJourney(req, res);
  ok('pre-cutoff genuine-legacy-feature appears in response',
    res._body.indexOf('genuine-legacy-feature') !== -1);
})();

// ── AC3: tenant-less journey with no createdAt still included ─────────────────

console.log('\nAC3 — tenant-less journey with no createdAt still included when ownerId matches');
await (async function() {
  var req = fakeReq({ accessToken: 'tok', login: 'kim', tenantId: 'kim-tenant' });
  var res = fakeRes();
  await handleGetJourney(req, res);
  ok('no-createdAt ancient-no-timestamp-feature appears in response',
    res._body.indexOf('ancient-no-timestamp-feature') !== -1);
})();

console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
process.exit(failed > 0 ? 1 : 0);

})();
