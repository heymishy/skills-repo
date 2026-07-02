'use strict';

// check-s0.2-resume-existing-session.js
// Verifies the session-resume fix: handleGetJourneyResume redirects to the
// existing in-memory session when the journey's activeSessionId is live and
// not done, instead of always creating a new session (abandoning turns).
//
// Run: node tests/check-s0.2-resume-existing-session.js

var path    = require('path');
var fs      = require('fs');
var os      = require('os');
var crypto  = require('crypto');

// ── helpers ──────────────────────────────────────────────────────────────────

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function fakeRes() {
  var r = { _status: null, _location: null, _body: '' };
  r.writeHead = function(s, h) { r._status = s; if (h && h.Location) r._location = h.Location; };
  r.end = function(b) { r._body = b || ''; };
  return r;
}

function fakeReq(session, params) {
  return { session: session, params: params || {}, url: '/journey/test/resume', query: {}, sessionId: 'http-sess-1' };
}

// ── setup ────────────────────────────────────────────────────────────────────

var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-s0.2-'));

var journeyStore = require('../src/web-ui/modules/journey-store');
journeyStore._clear();

var journeyDisk = require('../src/modules/journey-disk');
journeyStore.setDiskAdapter({
  saveJourney:  function(j) { journeyDisk.saveJourney(j, tmpDir); },
  listJourneys: function()  { return journeyDisk.listJourneys(tmpDir); },
  updateStage:  function(slug, stage, update) { journeyDisk.updateStage(slug, stage, update, tmpDir); }
});

var journeyRoute = require('../src/web-ui/routes/journey');
journeyRoute.setJourneyStoreModule(journeyStore);
journeyRoute.setRepoRoot(tmpDir);
journeyRoute.setRegisterHtmlSession(function() {});
journeyRoute.setLinkSessionToJourney(function() {});
journeyRoute.setReadSessionFromRedis(function() { return Promise.resolve(null); });
journeyRoute.setMergeRedisSessionData(function() { return false; });

var { handleGetJourneyResume } = journeyRoute;

// ── AC1: existing live session → redirect to it (303) ────────────────────────

console.log('\nAC1 — live in-progress session: redirect to existing session URL');
(async function() {
  var slug   = '2026-07-01-resume-live';
  var created = journeyStore.createJourney(slug, 'default');
  var jid     = created.journeyId;

  // Simulate a live in-memory session registered for this journey
  var existingSessionId = crypto.randomUUID();
  journeyStore.setJourneyFields(jid, {
    ownerId:         'alice',
    tenantId:        'alice',
    activeSessionId: existingSessionId,
    activeSkill:     'discovery'
  });

  // Wire getGetHtmlSession to return an in-progress (not done) session
  journeyRoute.setGetHtmlSession(function(sid) {
    if (sid === existingSessionId) {
      return { skillName: 'discovery', turns: [{ role: 'assistant', content: 'hello' }], done: false };
    }
    return null;
  });

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { featureSlug: slug });
  var res = fakeRes();
  await handleGetJourneyResume(req, res);

  ok('status is 303', res._status === 303);
  ok('location contains existing sessionId', res._location && res._location.includes(existingSessionId));
  ok('location contains skill name', res._location && res._location.includes('discovery'));
})().then(function() {

// ── AC2: existing session is done → create new session (not 303) ─────────────

console.log('\nAC2 — done session: create new session, not redirect to old one');
return (async function() {
  var slug   = '2026-07-01-resume-done';
  var created = journeyStore.createJourney(slug, 'default');
  var jid     = created.journeyId;

  var existingSessionId = crypto.randomUUID();
  journeyStore.setJourneyFields(jid, {
    ownerId:         'alice',
    tenantId:        'alice',
    activeSessionId: existingSessionId,
    activeSkill:     'discovery'
  });

  // Session exists but is marked done
  journeyRoute.setGetHtmlSession(function(sid) {
    if (sid === existingSessionId) {
      return { skillName: 'discovery', turns: [], done: true, artefactContent: 'artefact text' };
    }
    return null;
  });

  var registered = [];
  journeyRoute.setRegisterHtmlSession(function(sid) { registered.push(sid); });

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { featureSlug: slug });
  var res = fakeRes();
  await handleGetJourneyResume(req, res);

  ok('status is 303', res._status === 303);
  ok('location does NOT contain old sessionId', !(res._location && res._location.includes(existingSessionId)));
  ok('a new session was registered', registered.length > 0);
  ok('redirect points to new session', res._location && registered.length > 0 && res._location.includes(registered[0]));
})();

}).then(function() {

// ── AC3: no existing session (null) → create new session ─────────────────────

console.log('\nAC3 — no active session (null): create fresh session');
return (async function() {
  var slug   = '2026-07-01-resume-fresh';
  var created = journeyStore.createJourney(slug, 'default');
  var jid     = created.journeyId;

  journeyStore.setJourneyFields(jid, {
    ownerId: 'alice', tenantId: 'alice', activeSkill: 'discovery'
    // activeSessionId intentionally omitted / null
  });

  journeyRoute.setGetHtmlSession(function() { return null; });

  var registered = [];
  journeyRoute.setRegisterHtmlSession(function(sid) { registered.push(sid); });

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { featureSlug: slug });
  var res = fakeRes();
  await handleGetJourneyResume(req, res);

  ok('status is 303', res._status === 303);
  ok('new session was registered', registered.length > 0);
})();

}).then(function() {

// ── AC4: activeSessionId set but session missing from memory → create new ─────

console.log('\nAC4 — stale activeSessionId not in memory (post-deploy): create new session');
return (async function() {
  var slug   = '2026-07-01-resume-stale';
  var created = journeyStore.createJourney(slug, 'default');
  var jid     = created.journeyId;

  var staleId = crypto.randomUUID();
  journeyStore.setJourneyFields(jid, {
    ownerId:         'alice',
    tenantId:        'alice',
    activeSessionId: staleId,
    activeSkill:     'discovery'
  });

  // Session is NOT in memory (wiped by deploy)
  journeyRoute.setGetHtmlSession(function() { return null; });

  var registered = [];
  journeyRoute.setRegisterHtmlSession(function(sid) { registered.push(sid); });

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { featureSlug: slug });
  var res = fakeRes();
  await handleGetJourneyResume(req, res);

  ok('status is 303', res._status === 303);
  ok('location does NOT contain stale sessionId', !(res._location && res._location.includes(staleId)));
  ok('new session was registered', registered.length > 0);
})();

}).then(finish).catch(function(err) {
  console.error('Unexpected error:', err);
  failed++;
  finish();
});

function finish() {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
  process.exit(failed > 0 ? 1 : 0);
}
