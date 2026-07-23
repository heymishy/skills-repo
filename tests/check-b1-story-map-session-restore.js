'use strict';

// tests/check-b1-story-map-session-restore.js — story b1-formed-idea-outer-loop-story-map
//
// Integration test for AC4:
// artefacts/2026-07-23-e2e-core-journey-coverage/stories/b1-formed-idea-outer-loop-story-map.md
//
// "Given an active /definition session with story-map canvas content, When
//  the spec closes the browser mid-SSE-stream and reopens the same session,
//  Then the story-map canvas re-renders with the same epics/stories, the
//  turn history matches, and a story-map-specific session field (distinct
//  from A4's canvasBlocks) is confirmed restored."
//
// The underlying restore mechanism (mergeRedisSessionData, a denylist-based
// merge covering every field Redis persisted rather than a hardcoded
// allowlist) already shipped in wusl-s2 (tests/check-wusl-s2-full-session-
// state-restore.js) and its AC1 test already asserts, in the same test, that
// canvasBlocks (/ideate's field) AND the /definition story-map flow's fields
// (dynamicQuestions/sectionDrafts/pendingConfirmation/pendingSectionDraft/
// currentSectionIndex — labelled exactly that in skills.js's own
// mergeRedisSessionData docstring, lines ~99-107) both restore correctly.
//
// This story's own AC4 is scoped narrower and more specifically: prove that
// for a session actually REGISTERED as a /definition skill session (not
// /ideate), the restore mechanism (a) restores the /definition story-map
// field(s) that hold the confirmed section/story-map content
// (sectionDrafts, currentSectionIndex, pendingConfirmation,
// pendingSectionDraft), and (b) does NOT restore/introduce A4's canvasBlocks
// field on a /definition session (proving the two skill types' story-map
// mechanisms are genuinely distinct, not just two names for the same thing).
//
// This is an Integration test per the test plan (not E2E) — it exercises
// mergeRedisSessionData() directly against the real, exported skills.js
// module functions and does not depend on real staging, real credits, or
// real model turns, so it can run fully deterministically in the normal
// unit test chain (`npm test`).

var assert = require('assert');
var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var SKILLS_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

(async function() {

  // ===========================================================================
  // AC4a -- a /definition session's story-map-specific fields restore correctly
  // ===========================================================================
  await test('mergeRedisSessionData restores /definition\'s story-map-specific fields (sectionDrafts, currentSectionIndex, pendingConfirmation, pendingSectionDraft) on a real /definition-registered session (AC4)', function() {
    var skills = freshRequire(SKILLS_PATH);
    var sid = 'b1-story-map-sid-1';
    skills.registerHtmlSession(sid, '/tmp/b1-definition', 'definition', {});

    var redisData = {
      turns: [
        { role: 'user', content: 'Add a CSV export button to the reports page.' },
        { role: 'assistant', content: 'Understood -- drafting the epic/story breakdown.' }
      ],
      // /definition story-map flow fields (distinct from A4's /ideate canvasBlocks) --
      // sectionDrafts holds the confirmed story-map section content per epic/section
      // boundary crossed so far; currentSectionIndex/pendingConfirmation/
      // pendingSectionDraft track an in-flight confirm-or-edit cycle.
      sectionDrafts: ['Epic 1: Reports export -- Story 1.1: Add Export CSV button'],
      currentSectionIndex: 0,
      pendingConfirmation: true,
      pendingSectionDraft: 'Epic 1: Reports export -- Story 1.1: Add Export CSV button (draft)'
    };
    skills.mergeRedisSessionData(sid, redisData);

    var session = skills._getHtmlSession(sid);
    assert.strictEqual(session.skillName, 'definition', 'the registered session must be a real /definition session, not /ideate');
    assert.deepStrictEqual(session.sectionDrafts, redisData.sectionDrafts, 'sectionDrafts must be restored on a /definition session');
    assert.strictEqual(session.currentSectionIndex, 0, 'currentSectionIndex must be restored');
    assert.strictEqual(session.pendingConfirmation, true, 'pendingConfirmation must be restored');
    assert.strictEqual(session.pendingSectionDraft, redisData.pendingSectionDraft, 'pendingSectionDraft must be restored');
    assert.deepStrictEqual(session.turns, redisData.turns, 'turn history must match after restore');
  });

  // ===========================================================================
  // AC4b -- the /definition story-map fields are distinct from A4's canvasBlocks
  // ===========================================================================
  await test('a /definition session\'s restored story-map field is distinct from A4\'s canvasBlocks -- proving the restore mechanism generalizes across skill session types, not just /ideate (AC4)', function() {
    var skills = freshRequire(SKILLS_PATH);
    var sid = 'b1-story-map-sid-2';
    skills.registerHtmlSession(sid, '/tmp/b1-definition-2', 'definition', {});

    var redisData = {
      turns: [],
      sectionDrafts: ['Epic 1: Reports export -- Story 1.1: Add Export CSV button']
      // Deliberately no canvasBlocks in this /definition session's Redis data --
      // canvasBlocks is /ideate's field (A4), never written for a /definition session.
    };
    skills.mergeRedisSessionData(sid, redisData);

    var session = skills._getHtmlSession(sid);
    assert.deepStrictEqual(session.sectionDrafts, redisData.sectionDrafts, 'sectionDrafts must still restore');
    assert.strictEqual(session.canvasBlocks, undefined, 'canvasBlocks must not appear on a /definition session -- it is /ideate\'s field, not /definition\'s');
  });

  // ===========================================================================
  // AC4c -- close mid-SSE / reopen: a fresh registration + merge reproduces the
  // same story-map state a real reload of the chat page would see (the
  // in-memory _sessionStore is process-scoped, so a "close browser tab, reopen
  // in a new tab" round trip is modelled here exactly as _getSessionOrRestore
  // performs it in production: registerHtmlSession (fresh systemPrompt) then
  // mergeRedisSessionData (restore everything else)).
  // ===========================================================================
  await test('closing and reopening a /definition session (registerHtmlSession + mergeRedisSessionData) reproduces identical story-map state (AC4)', function() {
    var skills = freshRequire(SKILLS_PATH);
    var sid = 'b1-story-map-sid-3';

    // "Before close" -- initial registration + Redis snapshot as it would exist
    // mid-SSE-stream, right after a section boundary was crossed.
    skills.registerHtmlSession(sid, '/tmp/b1-definition-3', 'definition', {});
    var redisSnapshot = {
      turns: [
        { role: 'user', content: 'Add a CSV export button to the reports page.' },
        { role: 'assistant', content: 'Drafted Epic 1 with one story so far.' }
      ],
      sectionDrafts: ['Epic 1: Reports export -- Story 1.1: Add Export CSV button'],
      currentSectionIndex: 0,
      pendingConfirmation: false,
      pendingSectionDraft: null
    };
    skills.mergeRedisSessionData(sid, redisSnapshot);
    var beforeClose = skills._getHtmlSession(sid);
    var beforeCloseSectionDrafts = beforeClose.sectionDrafts.slice();

    // "Close" -- simulate the process losing the in-memory session (tab closed
    // mid-SSE-stream; a redeploy or eviction could also cause this in production).
    // _getSessionOrRestore's own restore path is: registerHtmlSession (fresh
    // systemPrompt) then mergeRedisSessionData (restore everything else) -- exercised
    // directly here since this is a deterministic Integration test of the mechanism,
    // not a live SSE connection.
    skills.registerHtmlSession(sid, '/tmp/b1-definition-3', 'definition', {});
    skills.mergeRedisSessionData(sid, redisSnapshot);
    var afterReopen = skills._getHtmlSession(sid);

    assert.deepStrictEqual(afterReopen.sectionDrafts, beforeCloseSectionDrafts, 'the story map (sectionDrafts) must be identical after close/reopen');
    assert.deepStrictEqual(afterReopen.turns, redisSnapshot.turns, 'the turn history must match after close/reopen');
    assert.strictEqual(afterReopen.currentSectionIndex, 0, 'currentSectionIndex must be identical after close/reopen');
  });

  console.log('\n[b1-formed-idea-outer-loop-story-map] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
