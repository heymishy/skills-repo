'use strict';

// check-s2.1-preflight-gate.js
// Verifies s2.1: handlePostJourney enforces a per-tenant journey creation cap.
// Cap is driven by MAX_JOURNEYS_PER_TENANT env var; per-tenant overrides via
// {repoRoot}/tenant-caps.json; tenants are isolated from each other's counts.
//
// Run: node tests/check-s2.1-preflight-gate.js

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function fakeRes() {
  var r = { _status: null, _body: '', _headers: {} };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body = b || ''; };
  return r;
}

function fakeReq(session, body) {
  // Set req.body directly — _readFormBody short-circuits on req.body !== undefined.
  return {
    session: session,
    params:  {},
    query:   {},
    url:     '/journey',
    body:    body || { featureName: 'test feature' }
  };
}

// ── wire up stubs ─────────────────────────────────────────────────────────────

var tenantPlan = require('../src/web-ui/modules/tenant-plan');
var journeyRoute = require('../src/web-ui/routes/journey');

// Stub journey store: we control listJourneys to simulate per-tenant counts
var _stubJourneys = [];
var stubStore = {
  listJourneys:    function() { return _stubJourneys; },
  getJourney:      function() { return null; },
  createJourney:   function(slug) { return { journeyId: 'j-' + slug, featureSlug: slug, ownerId: null, tenantId: null, completedStages: [], sessions: {} }; },
  setJourneyFields: function() {},
  setActiveSession: function() {}
};

journeyRoute.setJourneyStoreModule(stubStore);
journeyRoute.setRepoRoot('/tmp/s21-test');
journeyRoute.setRegisterHtmlSession(function() {});
journeyRoute.setLinkSessionToJourney(function() {});

var { handlePostJourney } = journeyRoute;

// ── AC1: below cap → allowed ──────────────────────────────────────────────────

console.log('\nAC1 — below cap (4 journeys, cap=5) → journey created');
(async function() {
  delete process.env.MAX_JOURNEYS_PER_TENANT;
  tenantPlan.setCapReader(function(tid) { return tid === 'alice' ? 5 : null; });
  _stubJourneys = [
    { tenantId: 'alice' }, { tenantId: 'alice' }, { tenantId: 'alice' }, { tenantId: 'alice' }
  ]; // 4 journeys
  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' });
  var res = fakeRes();
  await handlePostJourney(req, res);
  ok('status is not 402 (journey not blocked)', res._status !== 402);
})().then(function() {

// ── AC2: at cap → 402 ────────────────────────────────────────────────────────

console.log('\nAC2 — at cap (5 journeys, cap=5) → 402');
return (async function() {
  tenantPlan.setCapReader(function(tid) { return tid === 'alice' ? 5 : null; });
  _stubJourneys = [
    { tenantId: 'alice' }, { tenantId: 'alice' }, { tenantId: 'alice' },
    { tenantId: 'alice' }, { tenantId: 'alice' }
  ]; // 5 journeys = at cap
  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' });
  var res = fakeRes();
  await handlePostJourney(req, res);
  ok('status is 402',                       res._status === 402);
  ok('body mentions limit',                 res._body.indexOf('limit') !== -1 || res._body.indexOf('maximum') !== -1);
})();

}).then(function() {

// ── AC3: no env var / no cap reader → unlimited ───────────────────────────────

console.log('\nAC3 — no cap configured → not blocked (unlimited)');
return (async function() {
  tenantPlan.setCapReader(null);
  delete process.env.MAX_JOURNEYS_PER_TENANT;
  _stubJourneys = Array.from({ length: 100 }, function() { return { tenantId: 'alice' }; });
  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' });
  var res = fakeRes();
  await handlePostJourney(req, res);
  ok('status is not 402 (unlimited with no cap)',  res._status !== 402);
})();

}).then(function() {

// ── AC4: per-tenant override beats global env var ─────────────────────────────

console.log('\nAC4 — per-tenant tenant-caps.json override (cap=2) beats global (cap=10)');
(function() {
  tenantPlan.setCapReader(null);
  delete process.env.MAX_JOURNEYS_PER_TENANT;

  var fs   = require('fs');
  var path = require('path');
  var os   = require('os');
  var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 's21-ac4-'));

  // Write tenant-caps.json with per-tenant cap of 2
  fs.writeFileSync(path.join(tmpDir, 'tenant-caps.json'), JSON.stringify({ 'alice': 2 }));
  process.env.MAX_JOURNEYS_PER_TENANT = '10'; // global = 10, override = 2

  ok('alice at 2 journeys is blocked by per-tenant cap of 2',
    !tenantPlan.checkJourneyCap('alice', 2, tmpDir).allowed);
  ok('alice at 1 journey is allowed by per-tenant cap of 2',
    tenantPlan.checkJourneyCap('alice', 1, tmpDir).allowed);
  ok('bob (no override) at 10 journeys is blocked by global cap of 10',
    !tenantPlan.checkJourneyCap('bob', 10, tmpDir).allowed);
  ok('bob at 9 journeys is allowed by global cap of 10',
    tenantPlan.checkJourneyCap('bob', 9, tmpDir).allowed);

  delete process.env.MAX_JOURNEYS_PER_TENANT;
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
})();

// ── AC5: cap is per-tenantId (bob not blocked by alice being at cap) ──────────

console.log('\nAC5 — cap is per-tenantId: bob not affected by alice at cap');
return (async function() {
  tenantPlan.setCapReader(function(tid) { return 1; }); // cap=1 for everyone
  _stubJourneys = [
    { tenantId: 'alice' }  // alice has 1 journey (at cap), bob has 0
  ];
  var req = fakeReq({ accessToken: 'tok', login: 'bob', tenantId: 'bob' });
  var res = fakeRes();
  await handlePostJourney(req, res);
  ok('bob not blocked (0 journeys, cap=1)', res._status !== 402);
})();

}).then(function() {

// ── AC6: unauthenticated → 302 (existing behaviour preserved) ────────────────

console.log('\nAC6 — unauthenticated POST /journey → 302');
return (async function() {
  tenantPlan.setCapReader(null);
  var req = fakeReq({});  // no accessToken
  var res = fakeRes();
  await handlePostJourney(req, res);
  ok('unauthenticated → 302', res._status === 302);
})();

}).then(finish).catch(function(err) {
  console.error('Unexpected error:', err);
  failed++;
  finish();
});

function finish() {
  tenantPlan.setCapReader(null);
  delete process.env.MAX_JOURNEYS_PER_TENANT;
  console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
  process.exit(failed > 0 ? 1 : 0);
}
