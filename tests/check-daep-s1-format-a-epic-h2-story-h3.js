'use strict';
// check-daep-s1-format-a-epic-h2-story-h3.js — daep-s1
// Story: artefacts/2026-08-31-definition-artefact-story-id-parsing/stories/daep-s1-recognize-epic-h2-story-h3-format.md
// Test plan: artefacts/2026-08-31-definition-artefact-story-id-parsing/test-plans/daep-s1-test-plan.md
//
// Covers:
//   AC1: extractStoryIdsFromDefinitionArtefact recognizes Format A
//        ("## Epic N — Name" wrapping "### slug — Title" subsections),
//        both hyphenated (ep1-s1) and dotted (wgol.1) slugs
//   AC2: handleGetStories auto-populates the textarea from a Format A artefact
//   AC3: an unrecognised artefact still returns [] (no regression)
//   NFR: Format B (flat H2) and Format C (H1 epic/story) fixtures from
//        check-dsda-s1-default-all-stories.js are unaffected by this change

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
    session: { accessToken: 'test-token', userId: 1, login: 'user', csrfToken: 'test-csrf-token' },
    params: {},
    body: { _csrf: 'test-csrf-token' }
  }, extra || {});
}

var tmpdir = os.tmpdir();

// Format A, hyphenated slugs -- the exact shape that triggered the production
// incident on journey af17f555 (artefacts/new-feature-af17f555/definition.md).
var FORMAT_A_HYPHENATED = [
  'Slicing strategy: walking-skeleton',
  '',
  '## Epic 1 — Cross-Channel Feature Continuity',
  '',
  '### ep1-s1 — Feature Discovery from Pipeline-State Index',
  '',
  '**Persona:** Platform owner',
  '',
  'Complexity: 1',
  '',
  '### ep1-s2 — Artefact Resolution and HANDOFF CONTEXT Population',
  '',
  '**Persona:** Platform owner',
  '',
  'Complexity: 2'
].join('\n');

// Format A, dotted slugs -- confirms the fix isn't hyphen-only.
var FORMAT_A_DOTTED = [
  'Slicing strategy: walking-skeleton',
  '',
  '## Epic 1 — Mock Epic',
  '',
  '### wgol.1 — First story',
  '',
  'Complexity: 1',
  '',
  '### wgol.2 — Second story',
  '',
  'Complexity: 2'
].join('\n');

var UNRECOGNISED_ARTEFACT = [
  'Just some plain prose with no story markers of any recognised shape.',
  'Nothing here looks like a story ID.'
].join('\n');

var queue = [];

queue.push(function() {
  console.log('\n[daep-s1] AC1 -- Format A with hyphenated slugs (ep1-s1 style)');
  return test('extractStoryIdsFromDefinitionArtefact: Format A hyphenated slugs', function() {
    var journey = freshRequireJourney();
    var ids = journey.extractStoryIdsFromDefinitionArtefact(FORMAT_A_HYPHENATED);
    assert.deepStrictEqual(ids, ['ep1-s1', 'ep1-s2'], 'expected both hyphenated Format A story IDs in document order');
  });
});

queue.push(function() {
  console.log('\n[daep-s1] AC1 -- Format A with dotted slugs (wgol.1 style)');
  return test('extractStoryIdsFromDefinitionArtefact: Format A dotted slugs', function() {
    var journey = freshRequireJourney();
    var ids = journey.extractStoryIdsFromDefinitionArtefact(FORMAT_A_DOTTED);
    assert.deepStrictEqual(ids, ['wgol.1', 'wgol.2'], 'expected both dotted Format A story IDs in document order');
  });
});

queue.push(function() {
  console.log('\n[daep-s1] AC2 -- GET /journey/:id/stories auto-populates from a Format A artefact');
  return test('handleGetStories: textarea pre-filled from Format A artefact, "pre-filled" copy shown', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-daep-1');
    var journeyId = journeyObj.journeyId;

    var artefactPath = 'daep-s1-test-artefacts/definition-ac2.md';
    var absPath = path.join(tmpdir, artefactPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, FORMAT_A_HYPHENATED, 'utf8');
    store.completeStage(journeyId, 'definition', artefactPath);

    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpdir);

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handleGetStories(req, res, { query: async function() { return { rows: [] }; } });

    assert.strictEqual(res._status, 200, 'expected 200, got ' + res._status);
    assert.ok(res._body.includes('ep1-s1'), 'expected the first extracted story ID pre-filled in the page');
    assert.ok(res._body.includes('ep1-s2'), 'expected the second extracted story ID pre-filled in the page');
    assert.ok(res._body.includes('pre-filled below'), 'expected the "pre-filled" copy, not the manual-entry copy');
  });
});

queue.push(function() {
  console.log('\n[daep-s1] AC3 -- unrecognised artefact still returns [] (no regression)');
  return test('extractStoryIdsFromDefinitionArtefact: unrecognised format still returns [], does not throw', function() {
    var journey = freshRequireJourney();
    var ids;
    assert.doesNotThrow(function() { ids = journey.extractStoryIdsFromDefinitionArtefact(UNRECOGNISED_ARTEFACT); });
    assert.deepStrictEqual(ids, [], 'expected an empty array for an unrecognised format');
  });
});

queue.push(function() {
  console.log('\n[daep-s1] NFR -- Format B (flat H2) and Format C (H1 epic/story) are unaffected');
  return test('extractStoryIdsFromDefinitionArtefact: Format B and Format C fixtures unchanged', function() {
    var journey = freshRequireJourney();

    var h1FormatArtefact = [
      '# Epic 1: Mock Epic',
      '',
      '## Stories in this epic',
      '- dsda-fix.1',
      '- dsda-fix.2',
      '',
      '# Story dsda-fix.1 — First mock story',
      'Complexity: 1',
      '',
      '# Story dsda-fix.2 — Second mock story',
      'Complexity: 2'
    ].join('\n');
    assert.deepStrictEqual(
      journey.extractStoryIdsFromDefinitionArtefact(h1FormatArtefact),
      ['dsda-fix.1', 'dsda-fix.2'],
      'Format C (H1 epic/story) regressed'
    );

    var flatFormatArtefact = [
      '## Epic structure',
      '| Epic | Slug |',
      '| --- | --- |',
      '| Epic 1: Mock Epic | mock-epic |',
      '',
      '## dsda-flat.1 — First flat story',
      'Complexity: 1',
      '**Epic:** mock-epic',
      '',
      '## dsda-flat.2 — Second flat story',
      'Complexity: 2',
      '**Epic:** mock-epic'
    ].join('\n');
    assert.deepStrictEqual(
      journey.extractStoryIdsFromDefinitionArtefact(flatFormatArtefact),
      ['dsda-flat.1', 'dsda-flat.2'],
      'Format B (flat H2) regressed'
    );
  });
});

(async function() {
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n[daep-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
