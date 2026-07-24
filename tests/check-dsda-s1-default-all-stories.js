'use strict';
// check-dsda-s1-default-all-stories.js — dsda-s1
// Story: artefacts/2026-07-24-definition-stories-default-all/stories/dsda-s1.md
// Test plan: artefacts/2026-07-24-definition-stories-default-all/test-plans/dsda-s1-test-plan.md
//
// Covers:
//   AC1: story list auto-populated from the real definition artefact on render
//   AC2: an unedited auto-populated list proceeds through the per-story sequence
//        exactly as a manually-typed list already does
//   AC3: the manual edit affordance remains reachable and an edited value
//        (not the auto-populated one) is what gets submitted
//   AC4: an unrecognised/malformed definition artefact falls back to an empty
//        textarea, not an error page
//   AC5: the new server-side extractor matches the client-side
//        parseDefinitionArtefact's own story-ID output, across both formats
//        it documents (H1 epic/story headers, flat-story fallback)

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
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
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

// A definition artefact in the H1 epic/story header format ("Format C"),
// mirroring parseDefinitionArtefact's own documented shape.
var H1_FORMAT_ARTEFACT = [
  '# Epic 1: Mock Epic',
  '',
  '## Stories in this epic',
  '- dsda-fix.1',
  '- dsda-fix.2',
  '',
  '# Story dsda-fix.1 — First mock story',
  'Complexity: 1',
  '',
  'AC1: Something.',
  '',
  '# Story dsda-fix.2 — Second mock story',
  'Complexity: 2',
  '',
  'AC1: Something else.'
].join('\n');

// A definition artefact in the flat-story fallback format.
var FLAT_FORMAT_ARTEFACT = [
  '## Epic structure',
  '| Epic | Slug |',
  '| --- | --- |',
  '| Epic 1: Mock Epic | mock-epic |',
  '',
  '## dsda-flat.1 — First flat story',
  'Complexity: 1',
  '**Epic:** mock-epic',
  '',
  'AC1: Something.',
  '',
  '## dsda-flat.2 — Second flat story',
  'Complexity: 2',
  '**Epic:** mock-epic',
  '',
  'AC1: Something else.'
].join('\n');

var UNRECOGNISED_ARTEFACT = [
  'Just some plain prose with no story markers of any recognised shape.',
  'Nothing here looks like a story ID.'
].join('\n');

var queue = [];

// ===========================================================================
// AC5 — server-side extractor matches the client-side parser's own output
// ===========================================================================

queue.push(function() {
  console.log('\n[dsda-s1] AC5 -- server-side extractor matches H1-format story IDs');
  return test('extractStoryIdsFromDefinitionArtefact: H1 epic/story header format', function() {
    var journey = freshRequireJourney();
    var ids = journey.extractStoryIdsFromDefinitionArtefact(H1_FORMAT_ARTEFACT);
    assert.deepStrictEqual(ids, ['dsda-fix.1', 'dsda-fix.2'], 'expected both H1-format story IDs in document order');
  });
});

queue.push(function() {
  console.log('\n[dsda-s1] AC5 -- server-side extractor matches flat-story-format story IDs');
  return test('extractStoryIdsFromDefinitionArtefact: flat-story fallback format', function() {
    var journey = freshRequireJourney();
    var ids = journey.extractStoryIdsFromDefinitionArtefact(FLAT_FORMAT_ARTEFACT);
    assert.deepStrictEqual(ids, ['dsda-flat.1', 'dsda-flat.2'], 'expected both flat-format story IDs in document order');
  });
});

// ===========================================================================
// AC4 — parse failure is handled gracefully, never throws
// ===========================================================================

queue.push(function() {
  console.log('\n[dsda-s1] AC4 -- extractor handles an unrecognised format gracefully');
  return test('extractStoryIdsFromDefinitionArtefact: unrecognised format returns empty array, does not throw', function() {
    var journey = freshRequireJourney();
    var ids;
    assert.doesNotThrow(function() { ids = journey.extractStoryIdsFromDefinitionArtefact(UNRECOGNISED_ARTEFACT); });
    assert.deepStrictEqual(ids, [], 'expected an empty array for an unrecognised format');
  });
});

queue.push(function() {
  console.log('\n[dsda-s1] AC4 -- extractor handles empty/undefined input gracefully');
  return test('extractStoryIdsFromDefinitionArtefact: empty string and undefined both return [], no throw', function() {
    var journey = freshRequireJourney();
    assert.deepStrictEqual(journey.extractStoryIdsFromDefinitionArtefact(''), []);
    assert.deepStrictEqual(journey.extractStoryIdsFromDefinitionArtefact(undefined), []);
  });
});

// ===========================================================================
// AC1 — the stories page auto-populates from the real definition artefact
// ===========================================================================

queue.push(function() {
  console.log('\n[dsda-s1] AC1 -- GET /journey/:id/stories auto-populates from the definition artefact');
  return test('handleGetStories: textarea pre-filled with every extracted story ID, not empty', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-dsda-1');
    var journeyId = journeyObj.journeyId;

    var artefactPath = 'dsda-s1-test-artefacts/definition-ac1.md';
    var absPath = path.join(tmpdir, artefactPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, H1_FORMAT_ARTEFACT, 'utf8');
    store.completeStage(journeyId, 'definition', artefactPath);

    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpdir);

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handleGetStories(req, res);

    assert.strictEqual(res._status, 200, 'expected 200, got ' + res._status);
    assert.ok(res._body.includes('<textarea'), 'expected a real <textarea> in the response');
    assert.ok(res._body.includes('dsda-fix.1'), 'expected the first extracted story ID pre-filled in the page');
    assert.ok(res._body.includes('dsda-fix.2'), 'expected the second extracted story ID pre-filled in the page');
    // The textarea itself must still be a real, unrestricted form field --
    // not readonly/disabled -- so the auto-default doesn't lock the operator out (AC3).
    var taMatch = res._body.match(/<textarea[^>]*>/);
    assert.ok(taMatch, 'expected to find the textarea open tag');
    assert.ok(!/readonly|disabled/i.test(taMatch[0]), 'expected the pre-filled textarea to remain editable (no readonly/disabled)');
  });
});

// ===========================================================================
// AC2 — an unedited auto-populated list proceeds through the per-story sequence
// ===========================================================================

queue.push(function() {
  console.log('\n[dsda-s1] AC2 -- unedited auto-populated list proceeds through the per-story sequence exactly as today');
  return test('handlePostStories: submitting the auto-populated value unmodified sets storyList and redirects to review, same as a manually-typed list', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-dsda-2');
    var journeyId = journeyObj.journeyId;

    var artefactPath = 'dsda-s1-test-artefacts/definition-ac2.md';
    var absPath = path.join(tmpdir, artefactPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, H1_FORMAT_ARTEFACT, 'utf8');
    store.completeStage(journeyId, 'definition', artefactPath);

    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpdir);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setGetHtmlSession(function() { return null; });

    // Render the auto-populated page, then extract exactly what it pre-filled --
    // this is what an operator submitting "as-is" would actually POST.
    var getReq = authReq({ params: { journeyId: journeyId } });
    var getRes = makeRes();
    await journey.handleGetStories(getReq, getRes);
    var taValueMatch = getRes._body.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/);
    assert.ok(taValueMatch, 'expected to find the pre-filled textarea value');
    var autoPopulatedValue = taValueMatch[1];
    assert.ok(autoPopulatedValue.includes('dsda-fix.1') && autoPopulatedValue.includes('dsda-fix.2'), 'expected both story IDs in the pre-filled value');

    var postReq = authReq({ params: { journeyId: journeyId }, body: { stories: autoPopulatedValue } });
    var postRes = makeRes();
    await journey.handlePostStories(postReq, postRes);

    var updated = store.getJourney(journeyId);
    assert.deepStrictEqual(updated.storyList, ['dsda-fix.1', 'dsda-fix.2'], 'expected storyList to match the auto-populated (unedited) value');
    assert.strictEqual(postRes._status, 303, 'expected 303 redirect, got ' + postRes._status);
    assert.ok(postRes._headers.Location && postRes._headers.Location.includes('/skills/review/sessions/'), 'expected redirect into the first per-story stage (review), same as today\'s manually-typed flow');
  });
});

// ===========================================================================
// AC3 — the edited value overrides the auto-populated default (edit affordance)
// ===========================================================================

queue.push(function() {
  console.log('\n[dsda-s1] AC3 -- an edited value (not the auto-populated default) is what gets submitted');
  return test('handlePostStories: an operator-edited list overrides the auto-populated default', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-dsda-3');
    var journeyId = journeyObj.journeyId;

    var artefactPath = 'dsda-s1-test-artefacts/definition-ac3.md';
    var absPath = path.join(tmpdir, artefactPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, H1_FORMAT_ARTEFACT, 'utf8');
    store.completeStage(journeyId, 'definition', artefactPath);

    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpdir);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setGetHtmlSession(function() { return null; });

    // Operator removes dsda-fix.2 and adds a story of their own choosing --
    // simulating a real edit of the pre-filled textarea before submitting.
    var editedValue = 'dsda-fix.1\ndsda-fix.3-added-by-operator';
    var postReq = authReq({ params: { journeyId: journeyId }, body: { stories: editedValue } });
    var postRes = makeRes();
    await journey.handlePostStories(postReq, postRes);

    var updated = store.getJourney(journeyId);
    assert.deepStrictEqual(updated.storyList, ['dsda-fix.1', 'dsda-fix.3-added-by-operator'], 'expected the EDITED list, not the auto-populated default, to be what was stored -- confirms the auto-default does not remove operator control (AC3)');
  });
});

// ===========================================================================
// AC4 — an unrecognised definition artefact falls back to an empty textarea
// ===========================================================================

queue.push(function() {
  console.log('\n[dsda-s1] AC4 -- unrecognised definition artefact falls back to the manual-entry textarea, not an error');
  return test('handleGetStories: unparseable artefact -> 200 with an empty (not pre-filled) textarea, no error page', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-dsda-4');
    var journeyId = journeyObj.journeyId;

    var artefactPath = 'dsda-s1-test-artefacts/definition-ac4.md';
    var absPath = path.join(tmpdir, artefactPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, UNRECOGNISED_ARTEFACT, 'utf8');
    store.completeStage(journeyId, 'definition', artefactPath);

    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpdir);

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handleGetStories(req, res);

    assert.strictEqual(res._status, 200, 'expected 200 (never blocks/errors), got ' + res._status);
    assert.ok(res._body.includes('<textarea'), 'expected the manual-entry textarea to still render');
    var taMatch = res._body.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/);
    assert.ok(taMatch, 'expected to find the textarea');
    assert.strictEqual(taMatch[1].trim(), '', 'expected an empty textarea value when extraction found nothing');
  });
});

queue.push(function() {
  console.log('\n[dsda-s1] AC4 -- no definition stage recorded at all falls back the same way');
  return test('handleGetStories: no completed definition stage -> empty textarea, no error', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-dsda-5');
    var journeyId = journeyObj.journeyId;

    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpdir);

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handleGetStories(req, res);

    assert.strictEqual(res._status, 200, 'expected 200, got ' + res._status);
    var taMatch = res._body.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/);
    assert.ok(taMatch, 'expected to find the textarea');
    assert.strictEqual(taMatch[1].trim(), '', 'expected an empty textarea when no definition stage exists yet');
  });
});

(async function() {
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n[dsda-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
