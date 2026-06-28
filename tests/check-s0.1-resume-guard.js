'use strict';

// check-s0.1-resume-guard.js
// Verifies s0.1: handleGetJourneyResume enforces tenant/owner access control,
// and that ownerId + tenantId survive a server restart (disk round-trip).
//
// Run: node tests/check-s0.1-resume-guard.js

var assert  = require('assert');
var path    = require('path');
var fs      = require('fs');
var os      = require('os');
var crypto  = require('crypto');

// ── helpers ──────────────────────────────────────────────────────────────────

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else      { console.error('  FAIL:', label); failed++; }
}

function fakeRes() {
  var r = { _status: null, _body: '', _headers: {} };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body = b || ''; };
  return r;
}

function fakeReq(session, params) {
  return { session: session, params: params || {}, url: '', query: {} };
}

// ── test setup ────────────────────────────────────────────────────────────────

// Isolated temp directory for disk journey files
var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-s0.1-'));

// Wire real journey-store with disk adapter pointing at tmpDir
var journeyStore = require('../src/web-ui/modules/journey-store');
journeyStore._clear();

var journeyDisk  = require('../src/modules/journey-disk');
journeyStore.setDiskAdapter({
  saveJourney:  function(j) { journeyDisk.saveJourney(j, tmpDir); },
  listJourneys: function()  { return journeyDisk.listJourneys(tmpDir); },
  updateStage:  function(slug, stage, update) { journeyDisk.updateStage(slug, stage, update, tmpDir); }
});

// Import the handler under test and wire its adapters
var journeyRoute = require('../src/web-ui/routes/journey');
journeyRoute.setJourneyStoreModule(journeyStore);
journeyRoute.setRepoRoot(tmpDir);

// Stub html-session adapters (not under test)
journeyRoute.setRegisterHtmlSession(function() {});
journeyRoute.setLinkSessionToJourney(function() {});
journeyRoute.setGetHtmlSession(function() { return null; });

var { handleGetJourneyResume } = journeyRoute;

// ── AC1: owner can resume their own journey ───────────────────────────────────

console.log('\nAC1 — owner can resume own journey');
(async function() {
  var slug = '2026-06-29-owner-test';
  var created = journeyStore.createJourney(slug, 'default');
  journeyStore.setJourneyFields(created.journeyId, {
    ownerId: 'alice', tenantId: 'alice'
  });

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { featureSlug: slug });
  var res = fakeRes();
  await handleGetJourneyResume(req, res);
  ok('alice resuming own journey → not 404', res._status !== 404 && res._status !== 403);
})().then(function() {

// ── AC2: cross-tenant user gets 404 ──────────────────────────────────────────

console.log('\nAC2 — cross-tenant user blocked (404)');
return (async function() {
  var slug = '2026-06-29-tenant-test';
  var created = journeyStore.createJourney(slug, 'default');
  journeyStore.setJourneyFields(created.journeyId, {
    ownerId: 'alice', tenantId: 'alice'
  });

  var req = fakeReq({ accessToken: 'tok', login: 'bob', tenantId: 'bob' }, { featureSlug: slug });
  var res = fakeRes();
  await handleGetJourneyResume(req, res);
  ok('bob resuming alice journey → 404', res._status === 404);
})();

}).then(function() {

// ── AC3: ownerId/tenantId round-trip through disk ────────────────────────────

console.log('\nAC3 — ownerId/tenantId survive disk round-trip');
(function() {
  var slug = '2026-06-29-persist-test';
  var created = journeyStore.createJourney(slug, 'default');
  journeyStore.setJourneyFields(created.journeyId, {
    ownerId: 'carol', tenantId: 'carol'
  });

  var diskJourney = journeyDisk.loadJourney(slug, tmpDir);
  ok('ownerId saved to disk', diskJourney && diskJourney.ownerId === 'carol');
  ok('tenantId saved to disk', diskJourney && diskJourney.tenantId === 'carol');
})();

// ── AC4: loadAllFromDisk restores ownerId/tenantId ───────────────────────────

console.log('\nAC4 — loadAllFromDisk restores ownerId + tenantId');
(function() {
  // Clear in-memory store, then reload from disk
  journeyStore._clear();
  journeyStore.loadAllFromDisk(tmpDir);

  var all = journeyStore.listJourneys(tmpDir);
  // Find the journey created in AC3
  var restored = all.find(function(j) { return j.featureSlug === '2026-06-29-persist-test'; });
  ok('journey restored from disk', !!restored);
  ok('ownerId restored', restored && restored.ownerId === 'carol');
  ok('tenantId restored', restored && restored.tenantId === 'carol');
})();

// ── AC5: unauthenticated resume → 302 ────────────────────────────────────────

console.log('\nAC5 — unauthenticated resume → 302');
(async function() {
  var slug = '2026-06-29-unauth-test';
  journeyStore.createJourney(slug, 'default');

  var req = fakeReq({}, { featureSlug: slug });  // no accessToken
  var res = fakeRes();
  await handleGetJourneyResume(req, res);
  ok('unauthenticated resume → 302', res._status === 302);
})().then(finish);

}).catch(function(err) {
  console.error('Unexpected error:', err);
  failed++;
  finish();
});

function finish() {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
  process.exit(failed > 0 ? 1 : 0);
}
