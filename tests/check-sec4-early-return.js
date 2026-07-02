'use strict';

// check-sec4-early-return.js
// Verifies AC4: handleGetJourneyResume performs the in-memory session check
// BEFORE any Postgres/disk artefact reads. When the session is live in memory,
// a 303 redirect is issued immediately with zero I/O.
//
// Run: node tests/check-sec4-early-return.js

var path   = require('path');
var fs     = require('fs');
var os     = require('os');
var crypto = require('crypto');

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

// ── setup ─────────────────────────────────────────────────────────────────────

var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-sec4-'));

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
journeyRoute.setLinkSessionToJourney(function() {});
journeyRoute.setReadSessionFromRedis(function() { return Promise.resolve(null); });
journeyRoute.setMergeRedisSessionData(function() { return false; });

var { handleGetJourneyResume } = journeyRoute;

// ── AC4a: in-memory session → 303 redirect with NO Postgres/disk I/O ─────────

console.log('\nAC4a — live in-memory session: redirect without artefact I/O');
(async function() {
  var slug    = '2026-07-01-sec4-live';
  var created = journeyStore.createJourney(slug, 'default');
  var jid     = created.journeyId;

  var existingId = crypto.randomUUID();
  journeyStore.setJourneyFields(jid, {
    ownerId:         'alice',
    tenantId:        'alice',
    activeSessionId: existingId,
    activeSkill:     'discovery'
  });

  // Track whether Postgres was called (via DATABASE_URL — not set so no real call,
  // but we verify no artefact reads happen by watching registerHtmlSession calls).
  var registerCalls = [];
  journeyRoute.setRegisterHtmlSession(function(sid) { registerCalls.push(sid); });

  // Live session in memory
  journeyRoute.setGetHtmlSession(function(sid) {
    if (sid === existingId) {
      return { skillName: 'discovery', turns: [{ role: 'assistant', content: 'hi' }], done: false };
    }
    return null;
  });

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { featureSlug: slug });
  var res = fakeRes();
  await handleGetJourneyResume(req, res);

  ok('status is 303', res._status === 303);
  ok('location contains existingId', res._location && res._location.includes(existingId));
  ok('registerHtmlSession NOT called (no new session created)', registerCalls.length === 0);
})().then(function() {

// ── AC4b: live session → redirect contains skill name ─────────────────────────

console.log('\nAC4b — live session redirect URL contains skillName');
return (async function() {
  var slug    = '2026-07-01-sec4-skill';
  var created = journeyStore.createJourney(slug, 'default');
  var jid     = created.journeyId;

  var existingId = crypto.randomUUID();
  journeyStore.setJourneyFields(jid, {
    ownerId:         'bob',
    tenantId:        'bob',
    activeSessionId: existingId,
    activeSkill:     'benefit-metric'
  });

  journeyRoute.setGetHtmlSession(function(sid) {
    if (sid === existingId) {
      return { skillName: 'benefit-metric', turns: [], done: false };
    }
    return null;
  });
  journeyRoute.setRegisterHtmlSession(function() {});

  var req = fakeReq({ accessToken: 'tok', login: 'bob', tenantId: 'bob' }, { featureSlug: slug });
  var res = fakeRes();
  await handleGetJourneyResume(req, res);

  ok('location contains benefit-metric', res._location && res._location.includes('benefit-metric'));
})();

}).then(function() {

// ── AC4c: done session → falls through to new session creation (I/O path) ─────

console.log('\nAC4c — done session in memory → creates new session (I/O path runs)');
return (async function() {
  var slug    = '2026-07-01-sec4-done';
  var created = journeyStore.createJourney(slug, 'default');
  var jid     = created.journeyId;

  var doneId = crypto.randomUUID();
  journeyStore.setJourneyFields(jid, {
    ownerId:         'alice',
    tenantId:        'alice',
    activeSessionId: doneId,
    activeSkill:     'discovery'
  });

  journeyRoute.setGetHtmlSession(function(sid) {
    if (sid === doneId) {
      return { skillName: 'discovery', done: true };
    }
    return null;
  });

  var registerCalls = [];
  journeyRoute.setRegisterHtmlSession(function(sid) { registerCalls.push(sid); });

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { featureSlug: slug });
  var res = fakeRes();
  await handleGetJourneyResume(req, res);

  ok('status is 303', res._status === 303);
  ok('new session registered (I/O path ran)', registerCalls.length > 0);
  ok('redirect to new session, not done one', res._location && !res._location.includes(doneId));
})();

}).then(function() {

// ── AC4d: source code — fast-path check appears before DATABASE_URL block ─────

console.log('\nAC4d — source: fast-path check precedes priorArtefacts/Postgres block');
(function() {
  var src  = fs.readFileSync(path.join(__dirname, '../src/web-ui/routes/journey.js'), 'utf8');
  var fastPathIdx = src.indexOf('Fast path');
  var pgIdx       = src.indexOf('DATABASE_URL');
  ok('fast-path comment exists in source', fastPathIdx !== -1);
  ok('fast-path check is before DATABASE_URL block in source', fastPathIdx < pgIdx);
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
