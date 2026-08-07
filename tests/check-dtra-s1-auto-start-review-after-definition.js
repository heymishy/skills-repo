'use strict';
// check-dtra-s1-auto-start-review-after-definition.js — dtra-s1
// Story: artefacts/2026-07-24-definition-to-review-autostart/stories/dtra-s1-auto-start-review-after-definition.md
// Test plan: artefacts/2026-07-24-definition-to-review-autostart/test-plans/dtra-s1-auto-start-review-after-definition-test-plan.md
//
// Covers:
//   AC1: parseable definition artefact -> redirects straight to a new /review session
//   AC2: the FULL extracted story list (not just the first story) is passed to setStoryList
//   AC3: unparseable definition artefact -> falls back to /journey/:id/stories, unchanged
//   AC4: the manual /journey/:id/stories page still works exactly as before

var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err)); return Promise.resolve();
  }
}

var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

function freshRequireJourney() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  return require(JOURNEY_PATH);
}

function getStore() {
  return require(JOURNEY_STORE_PATH);
}

function makeRes() {
  var res = {
    _status: null,
    _headers: {},
    _body: '',
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    setHeader: function(k, v) { res._headers[k] = v; },
    end: function(body) { res._body += (body || ''); }
  };
  return res;
}

function authReq(extra) {
  return Object.assign({
    session: { accessToken: 'test-token', userId: 1, login: 'user' },
    params: {},
    body: {}
  }, extra || {});
}

var tmpdir = os.tmpdir();

var H1_FORMAT_ARTEFACT = [
  '# Epic 1: Mock Epic',
  '',
  '## Stories in this epic',
  '- dtra-fix.1',
  '- dtra-fix.2',
  '',
  '# Story dtra-fix.1 — First mock story',
  'Complexity: 1',
  '',
  'AC1: Something.',
  '',
  '# Story dtra-fix.2 — Second mock story',
  'Complexity: 2',
  '',
  'AC1: Something else.'
].join('\n');

var UNRECOGNISED_ARTEFACT = [
  'Just some plain prose with no story markers of any recognised shape.',
  'Nothing here looks like a story ID.'
].join('\n');

function setUpCompletedDefinitionJourney(featureName, artefactContent, artefactRelPath) {
  var journey = freshRequireJourney();
  var store = getStore();
  store._clear();
  var journeyObj = store.createJourney(featureName);
  var journeyId = journeyObj.journeyId;
  var activeSessionId = 'sess-dtra-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  store.setActiveSession(journeyId, activeSessionId, 'definition');

  journey.setJourneyStoreModule(store);
  journey.setRegisterHtmlSession(function() {});
  journey.setLinkSessionToJourney(function() {});
  journey.setRepoRoot(tmpdir);
  journey.setGetHtmlSession(function(sid) {
    if (sid === activeSessionId) {
      return {
        skillName: 'definition',
        done: true,
        artefactContent: artefactContent,
        artefactPath: artefactRelPath,
        journeyId: journeyId,
        turns: [],
        systemPrompt: 'test'
      };
    }
    return null;
  });

  return { journey: journey, store: store, journeyId: journeyId };
}

var queue = [];

// ===========================================================================
// AC1 — parseable artefact redirects straight to a new /review session
// ===========================================================================
queue.push(function() {
  return test('AC1: parseable definition artefact redirects straight to /skills/review, not /journey/:id/stories', async function() {
    var artefactRelPath = 'dtra-test-artefacts/definition-ac1.md';
    try { fs.unlinkSync(path.join(tmpdir, artefactRelPath)); } catch (_) {}
    var setup = setUpCompletedDefinitionJourney('dtra-test-ac1', H1_FORMAT_ARTEFACT, artefactRelPath);

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await setup.journey.handlePostGateConfirm(req, res);

    assert.strictEqual(res._status, 303, 'Expected a 303 redirect');
    var location = res._headers.Location || '';
    assert.ok(location.startsWith('/skills/review/sessions/') && location.endsWith('/chat'),
      'Expected redirect straight to a review session, got: ' + location);
  });
});

// ===========================================================================
// AC2 — the full extracted story list is passed to setStoryList
// ===========================================================================
queue.push(function() {
  return test('AC2: the full extracted story list (not just the first story) is set on the journey', async function() {
    var artefactRelPath = 'dtra-test-artefacts/definition-ac2.md';
    try { fs.unlinkSync(path.join(tmpdir, artefactRelPath)); } catch (_) {}
    var setup = setUpCompletedDefinitionJourney('dtra-test-ac2', H1_FORMAT_ARTEFACT, artefactRelPath);

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await setup.journey.handlePostGateConfirm(req, res);

    var updated = setup.store.getJourney(setup.journeyId);
    assert.deepStrictEqual(updated.storyList, ['dtra-fix.1', 'dtra-fix.2'],
      'Expected the full 2-story list to be set, not just the first story');
  });
});

// ===========================================================================
// AC3 — unparseable artefact falls back to the manual /journey/:id/stories page
// ===========================================================================
queue.push(function() {
  return test('AC3: unparseable definition artefact falls back to /journey/:id/stories, unchanged', async function() {
    var artefactRelPath = 'dtra-test-artefacts/definition-ac3.md';
    try { fs.unlinkSync(path.join(tmpdir, artefactRelPath)); } catch (_) {}
    var setup = setUpCompletedDefinitionJourney('dtra-test-ac3', UNRECOGNISED_ARTEFACT, artefactRelPath);

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await setup.journey.handlePostGateConfirm(req, res);

    assert.strictEqual(res._status, 303, 'Expected a 303 redirect');
    assert.strictEqual(res._headers.Location, '/journey/' + setup.journeyId + '/stories',
      'Expected the unchanged manual fallback redirect');
  });
});

// ===========================================================================
// AC4 — the manual /journey/:id/stories page still works exactly as before
// ===========================================================================
queue.push(function() {
  return test('AC4: GET /journey/:id/stories and POST /api/journey/:id/stories still work directly', async function() {
    var artefactRelPath = 'dtra-test-artefacts/definition-ac4.md';
    try { fs.unlinkSync(path.join(tmpdir, artefactRelPath)); } catch (_) {}
    var setup = setUpCompletedDefinitionJourney('dtra-test-ac4', H1_FORMAT_ARTEFACT, artefactRelPath);

    // Complete the definition stage on disk first (handlePostGateConfirm does this
    // as a side effect of AC1's flow) so handleGetStories has a real completedStages
    // entry to read from, matching how the manual page is reached in production.
    var reqGate = authReq({ params: { journeyId: setup.journeyId } });
    var resGate = makeRes();
    await setup.journey.handlePostGateConfirm(reqGate, resGate);

    var reqGet = authReq({ params: { journeyId: setup.journeyId } });
    var resGet = makeRes();
    await setup.journey.handleGetStories(reqGet, resGet);
    assert.strictEqual(resGet._status, 200, 'Expected GET /journey/:id/stories to still return 200');
    assert.ok(resGet._body.includes('Story list for journey'), 'Expected the manual story-list page content');

    var reqPost = authReq({ params: { journeyId: setup.journeyId }, body: { stories: 'dtra-manual.1\ndtra-manual.2' } });
    var resPost = makeRes();
    await setup.journey.handlePostStories(reqPost, resPost);
    assert.strictEqual(resPost._status, 303, 'Expected POST /api/journey/:id/stories to still redirect');
    var updated = setup.store.getJourney(setup.journeyId);
    assert.deepStrictEqual(updated.storyList, ['dtra-manual.1', 'dtra-manual.2'],
      'Expected the manually-submitted list to override the auto-extracted one');
  });
});

(async function() {
  console.log('check-dtra-s1-auto-start-review-after-definition.js');
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
