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
// adsr-s1: aslr-s1's original fix went too far -- it routed ALL FOUR sites
// through /resume unconditionally, but /resume's own documented contract is
// to always start a FRESH session for a done predecessor (never resume it).
// That's correct for /resume's own primary caller (the journey list's
// "Continue" link) but wrong for "view my current, already-done-but-not-
// confirmed stage", which is what these 4 sites actually need -- confirmed
// live on wuce-staging: repeated fresh-session churn, then 403 on
// gate-confirm against a stale session. kcrs-s1 already solved this exact
// conflict for a different entry point (handleGetJourneyById): check
// getGetHtmlSession() first; if it resolves, link directly (safe regardless
// of done-state); only fall through to /resume when the session doesn't
// exist in memory at all. The AC1b/AC2/AC3/AC4-adsr blocks below prove the
// 4 aslr-s1 sites now follow that same pattern; the AC6/AC7 blocks (aslr-s1's
// original tests, unmodified) prove the "genuinely missing" fallback to
// /resume still works.
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

  journeyRoute.setGetHtmlSession(function() { return null; }); // genuinely missing -- the aslr-s1 case

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

// ── adsr-s1 AC1/AC2: step-nav link and "Current stage" button link directly
//    when the active session EXISTS in memory, even if it's done ───────────

console.log('\nadsr-s1 AC1/AC2 — active session exists (done): step-nav link and "Current stage" button link directly, no /resume churn');
await (async function() {
  var slug = 'adsr-s1-done-nav-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;

  var discoveryArtefactPath2 = 'artefacts/' + slug + '/discovery.md';
  writeArtefact(discoveryArtefactPath2, '# Discovery\n\nViewed stage content.');
  journeyStore.completeStage(jid, 'discovery', discoveryArtefactPath2, null, 'discovery-sid-2');

  var liveActiveSid = 'live-done-session-id';
  journeyStore.setJourneyFields(jid, {
    ownerId: 'alice', tenantId: 'alice',
    activeSkill: 'benefit-metric',
    activeSessionId: liveActiveSid
  });

  // The active session genuinely exists in memory and is done -- exactly
  // the live-reproduced condition (a completed, not-yet-gate-confirmed stage).
  journeyRoute.setGetHtmlSession(function(sid) {
    if (sid === liveActiveSid) return { skillName: 'benefit-metric', done: true, artefactContent: 'drafted' };
    return null;
  });

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid, stageName: 'discovery' });
  var res = fakeRes();
  await handleGetJourneyStageView(req, res, null);

  var expectedDirectHref = '/skills/' + encodeURIComponent('benefit-metric') + '/sessions/' + encodeURIComponent(liveActiveSid) + '/chat';
  var resumeHrefFragment = '/journey/' + encodeURIComponent(slug) + '/resume';

  ok('adsr-s1 AC1: step-nav active-stage link points directly at the existing done session, not /resume',
    res._body.indexOf('href="' + expectedDirectHref + '"') !== -1);
  ok('adsr-s1 AC2: the "Current stage" button also points directly at the existing done session',
    res._body.indexOf('Current stage') !== -1 && res._body.indexOf('href="' + expectedDirectHref + '"') !== -1);
  ok('adsr-s1: /resume does NOT appear anywhere in the rendered page for this done-but-live session',
    res._body.indexOf(resumeHrefFragment) === -1);
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

// ── adsr-s1 AC3: handleGetStageReview links directly when the session
//    exists but is not done yet (not through /resume) ───────────────────────

console.log('\nadsr-s1 AC3 — handleGetStageReview: session exists but not done -- links directly, not through /resume');
await (async function() {
  var slug = 'adsr-s1-review-live-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;

  var liveActiveSid = 'live-not-done-review-session-id';
  journeyStore.setJourneyFields(jid, {
    ownerId: 'alice', tenantId: 'alice',
    activeSkill: 'review',
    activeSessionId: liveActiveSid
  });
  journeyRoute.setGetHtmlSession(function(sid) {
    if (sid === liveActiveSid) return { skillName: 'review', done: false };
    return null;
  });

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid });
  var res = fakeRes();
  await handleGetStageReview(req, res, null);

  ok('status is 302', res._status === 302);
  ok('redirects directly to the existing session, not /journey/:featureSlug/resume',
    res._location === '/skills/review/sessions/' + encodeURIComponent(liveActiveSid) + '/chat');
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
  journeyRoute.setGetHtmlSession(function() { return null; }); // genuinely missing -- reset from the prior adsr-s1 block

  // Viewing the active stage itself, which has no artefact yet.
  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid, stageName: 'design' });
  var res = fakeRes();
  await handleGetJourneyStageView(req, res, null);

  ok('status is 302', res._status === 302);
  ok('redirects to /journey/:featureSlug/resume, not a raw session chat URL',
    res._location === '/journey/' + encodeURIComponent(slug) + '/resume');
})();

// ── adsr-s1 AC4: handleGetJourneyStageView's own no-artefact-yet fallback
//    links directly when the session exists ─────────────────────────────────

console.log('\nadsr-s1 AC4 — handleGetJourneyStageView no-artefact-yet fallback: session exists -- links directly, not through /resume');
await (async function() {
  var slug = 'adsr-s1-noartefact-live-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;

  var liveActiveSid = 'live-noartefact-session-id';
  journeyStore.setJourneyFields(jid, {
    ownerId: 'alice', tenantId: 'alice',
    activeSkill: 'design',
    activeSessionId: liveActiveSid
  });
  journeyRoute.setGetHtmlSession(function(sid) {
    if (sid === liveActiveSid) return { skillName: 'design', done: false };
    return null;
  });

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid, stageName: 'design' });
  var res = fakeRes();
  await handleGetJourneyStageView(req, res, null);

  ok('status is 302', res._status === 302);
  ok('redirects directly to the existing session, not /journey/:featureSlug/resume',
    res._location === '/skills/design/sessions/' + encodeURIComponent(liveActiveSid) + '/chat');
})();

// ── adsr-s1 AC6: viewing a done session, then hitting the stage-review page,
//    never registers a new session -- no churn ──────────────────────────────

console.log('\nadsr-s1 AC6 — view-then-review does not churn sessions (no new session registered)');
await (async function() {
  var slug = 'adsr-s1-no-churn-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;

  var liveActiveSid = 'live-no-churn-session-id';
  journeyStore.setJourneyFields(jid, {
    ownerId: 'alice', tenantId: 'alice',
    activeSkill: 'test-plan',
    activeSessionId: liveActiveSid
  });
  journeyRoute.setGetHtmlSession(function(sid) {
    if (sid === liveActiveSid) return { skillName: 'test-plan', done: true, artefactContent: 'drafted' };
    return null;
  });
  var registered = [];
  journeyRoute.setRegisterHtmlSession(function(sid) { registered.push(sid); });

  // Step 1: view via the stage-view page (the "Current stage" button's target).
  var stageReq = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid, stageName: 'discovery' });
  var stageRes = fakeRes();
  var discoveryArtefactPath = 'artefacts/' + slug + '/discovery.md';
  writeArtefact(discoveryArtefactPath, '# Discovery\n\nDone.');
  journeyStore.completeStage(jid, 'discovery', discoveryArtefactPath, null, 'discovery-sid-churn');
  await handleGetJourneyStageView(stageReq, stageRes, null);

  // Step 2: hit the stage-review page (what gate-confirm's "Confirm" form
  // lives on) -- done+artefactContent both true, so this reaches the FULL
  // review render (unchanged, pre-existing behaviour), not a redirect.
  var mockNavPool = { query: async function() { return { rows: [] }; } };
  var reviewReq = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid });
  var reviewRes = fakeRes();
  await handleGetStageReview(reviewReq, reviewRes, mockNavPool);

  ok('no new session was registered by either call', registered.length === 0);
  ok('journey.activeSessionId is unchanged after both calls',
    journeyStore.getJourney(jid).activeSessionId === liveActiveSid);
  ok('stage-review page rendered successfully (200, not a redirect) for the SAME live session',
    reviewRes._status === null || reviewRes._status === 200);

  journeyRoute.setRegisterHtmlSession(function() {}); // reset
})();

console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
process.exit(failed > 0 ? 1 : 0);

})().catch(function(err) {
  console.error('Unexpected error:', err);
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  process.exit(1);
});
