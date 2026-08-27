'use strict';

// check-aslr-s1-active-stage-link-resume.js
// Verifies aslr-s1: every place journey.js used to build a raw
// /skills/:skill/sessions/:id/chat URL directly from journey.activeSessionId
// (with no existence check) now routes through the existing, already-tested
// /journey/:featureSlug/resume endpoint instead, so a stale/evicted
// activeSessionId can never dead-end the user on a "Session not found" page.
//
// This file does NOT re-test handleGetJourneyResume's own fallback behaviour
// (live / Redis-restorable / stale-and-missing) -- that is already fully
// covered by check-s0.1/s0.2/s0.4. This file only proves each of the four
// call sites now emits the correct redirect/href target.
//
// Run: node tests/check-aslr-s1-active-stage-link-resume.js

var path   = require('path');
var fs     = require('fs');
var os     = require('os');

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
  return { session: session, params: params || {}, url: '/journey', query: {}, sessionId: 'http-sess-1' };
}

var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-aslr-s1-'));

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

var { handleGetJourneyStageView, handleGetStageReview } = journeyRoute;

function writeArtefact(relPath, content) {
  var abs = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

(async function main() {

// ── AC1 / AC1b / AC5: rendered step-nav HTML on a completed-stage view ───────

console.log('\nAC1/AC1b/AC5 — step-nav active-stage link, "Current stage" button, and completed-stage link');
await (async function() {
  var slug = 'aslr-s1-nav-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;

  var ideateArtefactPath = 'artefacts/' + slug + '/ideate.md';
  writeArtefact(ideateArtefactPath, '# Ideate\n\nDone stage content.');
  journeyStore.completeStage(jid, 'ideate', ideateArtefactPath, null, 'ideate-sid');

  var discoveryArtefactPath = 'artefacts/' + slug + '/discovery.md';
  writeArtefact(discoveryArtefactPath, '# Discovery\n\nViewed stage content.');
  journeyStore.completeStage(jid, 'discovery', discoveryArtefactPath, null, 'discovery-sid');

  var staleActiveSid = 'stale-active-session-id';
  journeyStore.setJourneyFields(jid, {
    ownerId: 'alice', tenantId: 'alice',
    activeSkill: 'benefit-metric',
    activeSessionId: staleActiveSid
  });

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid, stageName: 'discovery' });
  var res = fakeRes();
  await handleGetJourneyStageView(req, res, null);

  ok('page renders 200', res._status === null || res._status === 200);

  var expectedResumeHref = '/journey/' + encodeURIComponent(slug) + '/resume';
  var oldRawHrefFragment = '/skills/' + encodeURIComponent('benefit-metric') + '/sessions/' + encodeURIComponent(staleActiveSid) + '/chat';

  ok('AC1: step-nav active-stage link (benefit-metric) points at /journey/:featureSlug/resume',
    res._body.indexOf('href="' + expectedResumeHref + '"') !== -1);
  ok('AC1: the old raw stale-session chat URL does NOT appear anywhere in the rendered page',
    res._body.indexOf(oldRawHrefFragment) === -1);
  ok('AC1b: the "Current stage" button also points at /journey/:featureSlug/resume',
    res._body.indexOf('Current stage') !== -1 && res._body.indexOf('href="' + expectedResumeHref + '"') !== -1);
  ok('AC5: the completed, non-viewed stage (ideate) still links to the static artefact view, unchanged',
    res._body.indexOf('href="/journey/' + encodeURIComponent(jid) + '/stage/ideate"') !== -1);
})();

// ── AC6: handleGetStageReview's "not done yet" fallback ──────────────────────

console.log('\nAC6 — handleGetStageReview: no-done-session fallback routes through resume, not a raw chat URL');
await (async function() {
  var slug = 'aslr-s1-review-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;

  var staleActiveSid = 'stale-review-session-id';
  journeyStore.setJourneyFields(jid, {
    ownerId: 'alice', tenantId: 'alice',
    activeSkill: 'review',
    activeSessionId: staleActiveSid
  });
  journeyRoute.setGetHtmlSession(function() { return null; }); // not in memory -- stale

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid });
  var res = fakeRes();
  await handleGetStageReview(req, res, null);

  ok('status is 302', res._status === 302);
  ok('redirects to /journey/:featureSlug/resume, not a raw session chat URL',
    res._location === '/journey/' + encodeURIComponent(slug) + '/resume');
})();

// ── AC7: handleGetJourneyStageView's "no artefact yet" fallback ──────────────

console.log('\nAC7 — handleGetJourneyStageView: no-artefact-yet fallback routes through resume, not a raw chat URL');
await (async function() {
  var slug = 'aslr-s1-noartefact-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;

  var staleActiveSid = 'stale-noartefact-session-id';
  journeyStore.setJourneyFields(jid, {
    ownerId: 'alice', tenantId: 'alice',
    activeSkill: 'design',
    activeSessionId: staleActiveSid
  });

  // Viewing the active stage itself, which has no artefact yet.
  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid, stageName: 'design' });
  var res = fakeRes();
  await handleGetJourneyStageView(req, res, null);

  ok('status is 302', res._status === 302);
  ok('redirects to /journey/:featureSlug/resume, not a raw session chat URL',
    res._location === '/journey/' + encodeURIComponent(slug) + '/resume');
})();

console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
process.exit(failed > 0 ? 1 : 0);

})().catch(function(err) {
  console.error('Unexpected error:', err);
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  process.exit(1);
});
