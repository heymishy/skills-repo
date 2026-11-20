'use strict';

// check-rgsr-s1-resume-lands-on-regressed-stage.js -- TDD tests for rgsr-s1
// Story: artefacts/2026-11-21-journey-regress-resume/stories/rgsr-s1-resume-lands-on-regressed-stage.md
//
// Issue #1042: after a journey is regressed to an earlier stage, resuming it landed on a
// discovery session. regressToStage saves the journey to disk in the store's own shape
// (activeSkill + completedStages, no currentStage), and handleGetJourneyResume read the
// stage from the disk record's currentStage, falling back to 'discovery'.
//
// These tests drive the real journey store with the real disk adapter and the real resume
// handler; only the session registry is stubbed. They assert where the user is sent, not
// which function was called.
//
// Run: node tests/check-rgsr-s1-resume-lands-on-regressed-stage.js

var path = require('path');
var fs = require('fs');
var os = require('os');

var passed = 0;
var failed = 0;
function ok(label, cond, detail) {
  if (cond) { console.log('  [PASS] ' + label); passed++; }
  else { console.error('  [FAIL] ' + label + (detail ? ': ' + detail : '')); failed++; }
}

function fakeRes() {
  var r = { _status: null, _location: null, _body: '' };
  r.writeHead = function(s, h) { r._status = s; if (h && h.Location) r._location = h.Location; };
  r.end = function(b) { r._body = b || ''; };
  return r;
}
function fakeReq(featureSlug) {
  return {
    session: { accessToken: 'tok', login: 'alice', tenantId: 'alice' },
    params: { featureSlug: featureSlug },
    url: '/journey/' + featureSlug + '/resume',
    query: {},
    sessionId: 'http-sess-1'
  };
}

var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-rgsr-s1-'));
var journeyStore = require('../src/web-ui/modules/journey-store');
var journeyDisk = require('../src/modules/journey-disk');
var journeyRoute = require('../src/web-ui/routes/journey');

function wire() {
  journeyStore._clear();
  journeyStore.setDiskAdapter({
    saveJourney: function(j) { journeyDisk.saveJourney(j, tmpDir); },
    listJourneys: function() { return journeyDisk.listJourneys(tmpDir); },
    updateStage: function(slug, stage, update) { journeyDisk.updateStage(slug, stage, update, tmpDir); }
  });
  journeyRoute.setJourneyStoreModule(journeyStore);
  journeyRoute.setRepoRoot(tmpDir);
  journeyRoute.setRegisterHtmlSession(function() {});
  journeyRoute.setLinkSessionToJourney(function() {});
  journeyRoute.setGetHtmlSession(function() { return null; });
  journeyRoute.setReadSessionFromRedis(function() { return Promise.resolve(null); });
  journeyRoute.setMergeRedisSessionData(function() { return false; });
}

function stagesPath(slug) { return 'artefacts/' + slug; }

async function resumeFor(slug) {
  var res = fakeRes();
  await journeyRoute.handleGetJourneyResume(fakeReq(slug), res);
  return res;
}

(async function() {
  wire();

  // T1 (AC1): a regressed journey resumes in a session for the stage it was regressed to.
  console.log('\nT1 -- regress to definition, then resume lands on a definition session');
  try {
    var slug1 = 'rgsr-regressed';
    var j1 = journeyStore.createJourney(slug1, 'default');
    journeyStore.setJourneyFields(j1.journeyId, { ownerId: 'alice', tenantId: 'alice' });
    ['discovery', 'benefit-metric', 'definition', 'review'].forEach(function(s) {
      journeyStore.completeStage(j1.journeyId, s, stagesPath(slug1) + '/' + s + '.md', null, 'sid-' + s);
    });
    journeyStore.setActiveSession(j1.journeyId, 'sid-test-plan', 'test-plan');
    journeyStore.regressToStage(j1.journeyId, 'definition');
    var r1 = await resumeFor(slug1);
    ok('resume answers 303', r1._status === 303, 'status ' + r1._status);
    ok('Location is a definition-stage session', /^\/skills\/definition\/sessions\/[^/]+\/chat/.test(r1._location || ''), 'Location ' + r1._location);
  } catch (e) { ok('T1 ran without throwing', false, e.message); }

  // T2 (AC2): a journey that was not regressed still resumes at its own active stage, taken from memory.
  console.log('\nT2 -- no regress: resume lands on the journey\'s active stage');
  try {
    var slug2 = 'rgsr-not-regressed';
    var j2 = journeyStore.createJourney(slug2, 'default');
    journeyStore.setJourneyFields(j2.journeyId, { ownerId: 'alice', tenantId: 'alice' });
    ['discovery', 'benefit-metric'].forEach(function(s) {
      journeyStore.completeStage(j2.journeyId, s, stagesPath(slug2) + '/' + s + '.md', null, 'sid-' + s);
    });
    journeyStore.setJourneyFields(j2.journeyId, { activeSkill: 'definition' });
    var r2 = await resumeFor(slug2);
    ok('Location is a definition-stage session', /^\/skills\/definition\/sessions\/[^/]+\/chat/.test(r2._location || ''), 'Location ' + r2._location);
  } catch (e) { ok('T2 ran without throwing', false, e.message); }

  // T3 (AC3): a journey whose in-memory record has no active stage still falls back to the disk record's stage.
  console.log('\nT3 -- no active stage in memory: the disk record\'s currentStage is used, then discovery');
  try {
    var slug3 = 'rgsr-disk-native';
    var disk3 = journeyDisk.createJourney(slug3, 'default', tmpDir);
    journeyDisk.updateStage(slug3, 'discovery', { status: 'complete', artefactPath: null }, tmpDir);
    journeyDisk.updateStage(slug3, 'definition', { status: 'active' }, tmpDir);
    var onDisk3 = journeyDisk.loadJourney(slug3, tmpDir);
    onDisk3.ownerId = 'alice';
    onDisk3.tenantId = 'alice';
    journeyDisk.saveJourney(onDisk3, tmpDir);
    journeyStore._clear();
    journeyStore.loadAllFromDisk(tmpDir);
    // Clear the stage on the in-memory object only (no store call, so the disk-native record is not rewritten).
    journeyStore.getJourney(disk3.journeyId).activeSkill = null;
    var r3 = await resumeFor(slug3);
    ok('Location is a definition-stage session (disk currentStage)', /^\/skills\/definition\/sessions\/[^/]+\/chat/.test(r3._location || ''), 'Location ' + r3._location);

    wire();
    var slug3b = 'rgsr-nothing-anywhere';
    var j3b = journeyStore.createJourney(slug3b, 'default');
    journeyStore.setJourneyFields(j3b.journeyId, { ownerId: 'alice', tenantId: 'alice' });
    var r3b = await resumeFor(slug3b);
    ok('a journey with no stage anywhere resumes at discovery', /^\/skills\/discovery\/sessions\/[^/]+\/chat/.test(r3b._location || ''), 'Location ' + r3b._location);
  } catch (e) { ok('T3 ran without throwing', false, e.message); }

  console.log('\n[rgsr-s1] ' + passed + ' passed, ' + failed + ' failed');
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  process.exit(failed > 0 ? 1 : 0);
})();
