'use strict';

// check-res-s1-reopen-completed-stage-live-session.js
// Verifies res-s1: a completed stage's step-nav link routes directly to a
// live session (existing or freshly created), instead of the static
// read-only /journey/:id/stage/:skill view -- extending the kcrs-s1/adsr-s1
// existing-session-first pattern to ANY completed stage, not just the
// journey's current active one.
//
// Run: node tests/check-res-s1-reopen-completed-stage-live-session.js

var fs = require('fs');
var path = require('path');
var os = require('os');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'res-s1-'));

var journeyStore = require('../src/web-ui/modules/journey-store');
journeyStore._clear();
// No _diskAdapter is wired here -- this test exercises only the in-memory
// _journeys map (journeyStore.updateCompletedStageSessionId's own guarded
// `if (_diskAdapter)` branch is a no-op with no adapter set). Wiring a real
// journeyDisk adapter to also assert the disk-persisted copy was attempted
// but abandoned: journeyStore.createJourney's in-memory journey shape
// (completedStages: []) does not match what journeyDisk.loadJourney/
// updateStage expect on disk (stages: {}), so completeStage's own disk
// write silently no-ops (wrapped in try/catch) before this function ever
// runs -- a pre-existing shape mismatch between the two modules, unrelated
// to and out of scope for this story.

(async function main() {

console.log('\nTask 1 — updateCompletedStageSessionId');
(function() {
  var slug = 'res-s1-store-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;

  journeyStore.completeStage(jid, 'discovery', 'artefacts/' + slug + '/discovery.md', null, 'old-sid');

  var _preUpdateEntry = journeyStore.getJourney(jid).completedStages.find(function(cs) { return cs.skillName === 'discovery'; });
  var _completedAtBefore = _preUpdateEntry.completedAt;

  journeyStore.updateCompletedStageSessionId(jid, 'discovery', 'new-sid');

  var journey = journeyStore.getJourney(jid);
  var entry = journey.completedStages.find(function(cs) { return cs.skillName === 'discovery'; });

  ok('sessionId updated to the new session', entry.sessionId === 'new-sid');
  ok('skillName unchanged', entry.skillName === 'discovery');
  ok('artefactPath unchanged', entry.artefactPath === 'artefacts/' + slug + '/discovery.md');
  ok('completedAt unchanged (not a re-completion)', !!_completedAtBefore && entry.completedAt === _completedAtBefore);
  ok('journey.sessions map updated', journey.sessions['new-sid'] === 'discovery');
})();

(function() {
  // Negative case: unknown journeyId — must not throw
  var threwOnUnknownJourney = false;
  try { journeyStore.updateCompletedStageSessionId('nonexistent-journey', 'discovery', 'sid'); }
  catch (_) { threwOnUnknownJourney = true; }
  ok('unknown journeyId does not throw', !threwOnUnknownJourney);
})();

(function() {
  // Negative case: unknown skillName on a real journey — must not throw
  var threwOnUnknownStage = false;
  try { journeyStore.updateCompletedStageSessionId(journeyStore.createJourney('res-s1-neg-feature', 'default').journeyId, 'not-a-real-stage', 'sid'); }
  catch (_) { threwOnUnknownStage = true; }
  ok('unknown skillName on a real journey does not throw', !threwOnUnknownStage);
})();

console.log('\nTask 2 — handleGetJourneyStageReopen handler');
await (async function() {
  var journeyRoute = require('../src/web-ui/routes/journey');
  journeyRoute.setJourneyStoreModule(journeyStore);
  journeyRoute.setRepoRoot(tmpDir);
  journeyRoute.setLinkSessionToJourney(function() {});

  function fakeRes() {
    var r = { _status: null, _location: null };
    r.writeHead = function(s, h) { r._status = s; if (h && h.Location) r._location = h.Location; };
    r.end = function() {};
    return r;
  }
  function fakeReq(session, params) {
    return { session: session, params: params || {} };
  }
  function writeArtefact(relPath, content) {
    var abs = path.join(tmpDir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
  }

  var slug = 'res-s1-reopen-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;
  var artefactPath = 'artefacts/' + slug + '/discovery.md';
  writeArtefact(artefactPath, '# Discovery\n\nOriginal content.');
  journeyStore.completeStage(jid, 'discovery', artefactPath, null, null); // no sessionId -- simulates a pruned/pre-frsr-s1 session
  journeyStore.setJourneyFields(jid, { ownerId: 'alice', tenantId: 'alice' });

  // AC2: no live session exists -- expect a fresh one to be created
  journeyRoute.setGetHtmlSession(function() { return null; });
  var registeredCalls = [];
  journeyRoute.setRegisterHtmlSession(function(sid, sessionPath, skillName, opts) {
    registeredCalls.push({ sid: sid, skillName: skillName, opts: opts });
  });

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid, skillName: 'discovery' });
  var res = fakeRes();
  await journeyRoute.handleGetJourneyStageReopen(req, res);

  ok('AC2: redirects (303) to a new chat session', res._status === 303 && /^\/skills\/discovery\/sessions\/.+\/chat$/.test(res._location || ''));
  ok('AC2: a fresh session was registered for the "discovery" skill', registeredCalls.length === 1 && registeredCalls[0].skillName === 'discovery');
  ok('AC2: priorArtefacts contains the stage\'s own artefact content read from disk', registeredCalls.length === 1 &&
    registeredCalls[0].opts.priorArtefacts.length === 1 &&
    registeredCalls[0].opts.priorArtefacts[0].path === artefactPath &&
    registeredCalls[0].opts.priorArtefacts[0].content === '# Discovery\n\nOriginal content.');

  var updatedJourney = journeyStore.getJourney(jid);
  var updatedEntry = updatedJourney.completedStages.find(function(cs) { return cs.skillName === 'discovery'; });
  ok('AC3: completedStages sessionId updated to the new session', updatedEntry.sessionId && updatedEntry.sessionId === registeredCalls[0].sid);
  ok('AC3: completedStages artefactPath unchanged', updatedEntry.artefactPath === artefactPath);

  // AC1 (safety-net re-check): session now exists -- a second reopen call
  // must NOT create another fresh session.
  journeyRoute.setGetHtmlSession(function(sid) {
    return sid === registeredCalls[0].sid ? { skillName: 'discovery', turns: [] } : null;
  });
  var res2 = fakeRes();
  await journeyRoute.handleGetJourneyStageReopen(fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid, skillName: 'discovery' }), res2);
  ok('AC1: second reopen with an existing session redirects directly, no new session created', res2._status === 303 && registeredCalls.length === 1 &&
    res2._location === '/skills/discovery/sessions/' + registeredCalls[0].sid + '/chat');

  // AC2 edge case: artefact file missing/unreadable -- must degrade to an
  // empty priorArtefacts array (matching handleGetJourneyResume's own
  // try/catch precedent for the same fs.readFileSync call), not crash the
  // whole reopen. Uses a second, otherwise-identical stage whose
  // artefactPath points at a file that was never written.
  var slug2 = 'res-s1-reopen-missing-artefact-feature';
  var created2 = journeyStore.createJourney(slug2, 'default');
  var jid2 = created2.journeyId;
  var missingArtefactPath = 'artefacts/' + slug2 + '/discovery.md'; // deliberately never written to disk
  journeyStore.completeStage(jid2, 'discovery', missingArtefactPath, null, null);
  journeyStore.setJourneyFields(jid2, { ownerId: 'alice', tenantId: 'alice' });

  journeyRoute.setGetHtmlSession(function() { return null; });
  var registeredCalls2 = [];
  journeyRoute.setRegisterHtmlSession(function(sid, sessionPath, skillName, opts) {
    registeredCalls2.push({ sid: sid, skillName: skillName, opts: opts });
  });

  var res3 = fakeRes();
  await journeyRoute.handleGetJourneyStageReopen(fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid2, skillName: 'discovery' }), res3);

  ok('AC2 edge case: unreadable artefact does not crash the reopen', res3._status === 303 && /^\/skills\/discovery\/sessions\/.+\/chat$/.test(res3._location || ''));
  ok('AC2 edge case: unreadable artefact degrades to an empty priorArtefacts array', registeredCalls2.length === 1 && registeredCalls2[0].opts.priorArtefacts.length === 0);
})();

console.log('\nTask 3 — step-nav done-stage link');
await (async function() {
  var journeyRoute = require('../src/web-ui/routes/journey');
  var { handleGetJourneyStageView } = journeyRoute;

  function fakeRes() {
    var r = { _status: null, _body: '' };
    r.writeHead = function(s) { r._status = s; };
    r.end = function(b) { r._body = b || ''; };
    return r;
  }
  function writeArtefact(relPath, content) {
    var abs = path.join(tmpDir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
  }

  var slug = 'res-s1-stepnav-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;

  // "discovery" is done with a live session -- expect a direct chat link
  var discoveryPath = 'artefacts/' + slug + '/discovery.md';
  writeArtefact(discoveryPath, '# Discovery');
  journeyStore.completeStage(jid, 'discovery', discoveryPath, null, 'live-sid');

  // "benefit-metric" is done but its session is gone -- expect a /reopen link
  var bmPath = 'artefacts/' + slug + '/benefit-metric.md';
  writeArtefact(bmPath, '# Benefit Metric');
  journeyStore.completeStage(jid, 'benefit-metric', bmPath, null, 'stale-sid');

  journeyStore.setJourneyFields(jid, { ownerId: 'alice', tenantId: 'alice', activeSkill: 'definition' });

  journeyRoute.setGetHtmlSession(function(sid) {
    return sid === 'live-sid' ? { skillName: 'discovery', turns: [] } : null;
  });

  var req = { session: { accessToken: 'tok', login: 'alice', tenantId: 'alice' }, params: { journeyId: jid, stageName: 'discovery' } };
  var res = fakeRes();
  await handleGetJourneyStageView(req, res, null);

  ok('AC1: done stage with a live session links directly to its chat', res._body.indexOf('/skills/discovery/sessions/live-sid/chat') !== -1);
  ok('AC1: does NOT link to the static read-only view for that stage', res._body.indexOf('/journey/' + jid + '/stage/discovery"') === -1);
  ok('AC2: done stage with no live session links to the reopen route', res._body.indexOf('/journey/' + jid + '/stage/benefit-metric/reopen') !== -1);
  ok('AC4: a not-yet-completed stage (definition, active) is unaffected -- still an active-stage link, not a done-stage link', res._body.indexOf('sn-step--active') !== -1);
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

})();
