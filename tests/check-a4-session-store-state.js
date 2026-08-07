'use strict';

// tests/check-a4-session-store-state.js — story a4-ideate-session-resume
//
// Integration test for AC1 and AC4:
// artefacts/2026-07-23-e2e-core-journey-coverage/stories/a4-ideate-session-resume.md
//
// AC1: "Given an active /ideate session with canvas content from A3, When the
//       spec closes the browser tab/context mid-way through a new turn's SSE
//       stream (before the stream completes), Then the server's session store
//       still contains a pendingSectionDraft (or equivalent in-progress
//       marker) for the interrupted turn, queryable via the same
//       session-state read path AC2-AC4 use."
//
// AC4: "Given the resumed session, When the spec inspects the restored
//       session's canvasBlocks field specifically, Then it is present and
//       populated -- this field was not in mergeRedisSessionData's original
//       8-field allowlist, so its correct restoration proves the fix is
//       structural (per wusl-s2's AC4 test design), not another narrow
//       allowlist."
//
// This story continues a3-product-feature-ideate-canvas's session. /ideate
// does not itself use `pendingSectionDraft` (that field is specific to the
// /definition story-map flow -- see skills.js's mergeRedisSessionData
// docstring, ~lines 99-107). The AC's own "(or equivalent in-progress
// marker)" wording anticipates this: the equivalent, skill-agnostic marker
// the real SSE turn-streaming handler (handlePostTurnStreamHtml, skills.js
// ~4090-4124) sets when a multi-turn artefact/section is opened but not yet
// closed by the time a stream ends is `session._artefactInProgress` +
// `session._artefactBuffer`. This is the exact mechanism that would be set,
// mid-write, if a browser closed before an in-progress artefact-style
// response finished streaming -- a real, code-verified "the server still
// has a record that a turn was in progress" marker, not a fabricated one.
//
// This is an Integration test per the test plan (not E2E) -- it exercises
// the real, exported skills.js functions (registerHtmlSession,
// mergeRedisSessionData, _getHtmlSession, parseCanvasBlock) directly,
// mirroring the established pattern from
// tests/check-a3-ideate-artefact-disk-match.js. Deterministic; no staging,
// credits, or real model dependency, so it runs in the normal unit test
// chain (`npm test`). Per this story's Constraints, mergeRedisSessionData
// itself is NOT modified -- these tests only exercise the already-shipped
// denylist-based restore mechanism (wusl-s2).

var assert = require('assert');
var path = require('path');
var fs = require('fs');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var SKILLS_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
// Plain (cached) require, NOT freshRequire -- skills.js holds its own
// internal `_journeyStore` reference to this exact module instance (via its
// own top-level `require('../modules/journey-store')`). The NFR-Security
// tests below must create journeys through the SAME singleton instance
// skills.js's handleGetChatHtml will look them up from -- freshRequire-ing
// journey-store separately here would create a second, disconnected
// instance with its own empty journeys Map, silently no-op-ing the guard
// under test.
var journeyStore = require(JOURNEY_STORE_PATH);
var FIXTURE_PATH = path.resolve(__dirname, 'e2e/fixtures/llm-gateway/ideate.success.json');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

/** Extract the ---CANVAS-JSON:...--- marker(s) present in a response text. */
function extractMarkerTexts(text) {
  var MARKER_RE = /---CANVAS-JSON:\s*\{[\s\S]*?\}\s*---/g;
  return String(text).match(MARKER_RE) || [];
}

(async function() {

  var fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
  var markerTexts = extractMarkerTexts(fixture.response);

  // ===========================================================================
  // AC1 -- an interrupted mid-stream turn's in-progress marker survives a
  // close-browser / reopen-session round trip via the real, already-shipped
  // mergeRedisSessionData denylist restore mechanism.
  // ===========================================================================
  await test('AC1: the interrupted turn\'s in-progress marker (_artefactInProgress/_artefactBuffer) survives a close/resume round-trip, queryable via the same read path AC2-AC4 use', function() {
    var skills = freshRequire(SKILLS_PATH);
    var sid = 'a4-ideate-sid-ac1';
    skills.registerHtmlSession(sid, '/tmp/a4-ideate-ac1', 'ideate', {});

    var session = skills._getHtmlSession(sid);
    session.turns = [
      { role: 'user', content: 'Here is my rough idea: an internal tool that captures meeting decisions automatically.' },
      { role: 'assistant', content: 'Let\'s map out the opportunity space for your idea.' }
    ];

    // Simulate exactly what handlePostTurnStreamHtml does mid-stream when a
    // multi-turn artefact/section has opened but the closing marker has not
    // yet arrived (skills.js ~4101-4104) -- this is the real, code-verified
    // "turn in progress" state at the moment a browser would disconnect.
    session._artefactInProgress = true;
    session._artefactBuffer = 'Partial section content accumulated before the browser tab was closed mid-stream...';

    // "Write to disk" -- the real persistence layer (skill-session-redis.js)
    // would have already captured this in-progress state on its next write.
    var redisSnapshot = {
      turns: session.turns.slice(),
      _artefactInProgress: session._artefactInProgress,
      _artefactBuffer: session._artefactBuffer
    };

    // "Close the browser" -- in-memory session lost (redeploy, tab close);
    // "reopen the session URL" -- fresh registration + restore, exactly as
    // _getSessionOrRestore performs it in production (skills.js ~137-148).
    skills.registerHtmlSession(sid, '/tmp/a4-ideate-ac1', 'ideate', {});
    skills.mergeRedisSessionData(sid, redisSnapshot);
    var restored = skills._getHtmlSession(sid);

    assert.strictEqual(restored._artefactInProgress, true, 'the interrupted turn\'s in-progress marker must survive the close/resume round-trip (AC1)');
    assert.strictEqual(restored._artefactBuffer, redisSnapshot._artefactBuffer, 'the interrupted turn\'s partial buffer content must survive the close/resume round-trip (AC1)');
    assert.strictEqual(restored.turns.length, 2, 'turn history up to the interruption must also be present alongside the in-progress marker');
  });

  // ===========================================================================
  // AC4 -- canvasBlocks (never in the original 8-field allowlist) restores
  // correctly on resume, proving the denylist-restore mechanism is
  // structural, not another narrow allowlist. Uses the same fixture content
  // a3's own mock-LLM-gateway fixture and Integration test use (per this
  // repo's reuse convention), so this proves the SAME real marker content
  // the E2E canvas renders live survives the round-trip -- not a
  // hand-crafted stand-in payload.
  // ===========================================================================
  await test('AC4: canvasBlocks (not in mergeRedisSessionData\'s original 8-field allowlist) restores correctly and populated after a close/resume round-trip', function() {
    assert.strictEqual(markerTexts.length, 1, 'expected exactly one ---CANVAS-JSON:...--- marker in the shared ideate fixture response');
    var skills = freshRequire(SKILLS_PATH);
    var sid = 'a4-ideate-sid-ac4';
    skills.registerHtmlSession(sid, '/tmp/a4-ideate-ac4', 'ideate', {});

    var renderedBlock = skills.parseCanvasBlock(markerTexts[0]);
    assert.ok(renderedBlock, 'parseCanvasBlock() must successfully parse the shared fixture marker');

    var session = skills._getHtmlSession(sid);
    session.canvasBlocks = [renderedBlock];
    var renderedSnapshot = JSON.parse(JSON.stringify(session.canvasBlocks));

    var redisSnapshot = { turns: [], canvasBlocks: renderedSnapshot };

    skills.registerHtmlSession(sid, '/tmp/a4-ideate-ac4', 'ideate', {});
    skills.mergeRedisSessionData(sid, redisSnapshot);
    var restored = skills._getHtmlSession(sid);

    assert.ok(Array.isArray(restored.canvasBlocks) && restored.canvasBlocks.length > 0, 'canvasBlocks must be present and populated after restore (AC4)');
    assert.deepStrictEqual(restored.canvasBlocks, renderedSnapshot, 'disk-restored canvasBlocks must exactly match what was rendered before the close/resume round-trip (AC4)');
  });

  // ===========================================================================
  // Combined AC1 + AC2 + AC4 -- models this story's actual end-to-end scenario:
  // a session continuing A3's canvas/turn history, WITH a new turn interrupted
  // mid-stream, all restore together in a single close/resume round trip. This
  // is the structural proof that motivates the whole story: the denylist
  // restore mechanism does not selectively restore some fields while dropping
  // others when they co-occur on the same session.
  // ===========================================================================
  await test('Combined: turn history (AC2), an interrupted mid-stream marker (AC1), and canvasBlocks (AC4) all restore together after one close/resume round-trip', function() {
    var skills = freshRequire(SKILLS_PATH);
    var sid = 'a4-ideate-sid-combined';
    skills.registerHtmlSession(sid, '/tmp/a4-ideate-combined', 'ideate', {});

    var session = skills._getHtmlSession(sid);
    // Prior (A3) turn history + canvas content already established.
    session.turns = [
      { role: 'user', content: 'Here is my rough idea: an internal tool that captures meeting decisions automatically so nothing gets lost after a workshop.' },
      { role: 'assistant', content: 'Let\'s map out the opportunity space for your idea.' }
    ];
    session.canvasBlocks = [skills.parseCanvasBlock(markerTexts[0])];
    // A new turn's user message has been recorded, but its SSE response was
    // interrupted mid-stream before the artefact section closed.
    session.turns.push({ role: 'user', content: 'Let\'s focus on the capture problem first -- that seems like the highest-value cluster.' });
    session._artefactInProgress = true;
    session._artefactBuffer = 'Partial follow-up content, interrupted mid-stream...';

    var preCloseTurns = JSON.parse(JSON.stringify(session.turns));
    var preCloseCanvasBlocks = JSON.parse(JSON.stringify(session.canvasBlocks));

    var redisSnapshot = {
      turns: preCloseTurns,
      canvasBlocks: preCloseCanvasBlocks,
      _artefactInProgress: session._artefactInProgress,
      _artefactBuffer: session._artefactBuffer
    };

    skills.registerHtmlSession(sid, '/tmp/a4-ideate-combined', 'ideate', {});
    skills.mergeRedisSessionData(sid, redisSnapshot);
    var restored = skills._getHtmlSession(sid);

    assert.deepStrictEqual(restored.turns, preCloseTurns, 'turn history (chat log) must match exactly what existed before closing (AC2)');
    assert.deepStrictEqual(restored.canvasBlocks, preCloseCanvasBlocks, 'canvasBlocks must match exactly what existed before closing (AC4)');
    assert.strictEqual(restored._artefactInProgress, true, 'the interrupted turn marker must also survive alongside turn history and canvasBlocks (AC1)');
    assert.strictEqual(restored._artefactBuffer, redisSnapshot._artefactBuffer, 'the interrupted turn\'s partial buffer content must also survive alongside turn history and canvasBlocks (AC1)');
  });

  // ===========================================================================
  // NFR-Security -- a resumed session (GET /skills/:name/sessions/:id/chat,
  // handleGetChatHtml) is only reachable by the same authenticated user who
  // created it (ADR-025 tenant/ownership scoping).
  //
  // Found while implementing this story's E2E NFR test: handleGetChatHtml had
  // NO ownership/tenant check at all (only "is any authenticated user"),
  // unlike the sibling POST turn endpoint (handlePostTurnHtml), which already
  // checks _linkedJourney.ownerId. Fixed as part of this story -- see
  // decisions.md's "a4: handleGetChatHtml ... had no tenant/ownership check
  // at all" entry for the full rationale and the ADR-008 contract amendment.
  //
  // These are deterministic, local, unit-style tests of the fix itself
  // (mirroring the req/res mocking pattern already established by
  // tests/check-ougl4-journey-aware-chat-button.js) -- independent of real
  // staging, so they verify correctness even while wuce-staging itself may
  // still be running a not-yet-redeployed build (this repo's CI auto-deploy
  // has been broken all session -- see decisions.md's earlier RISK entry).
  // ===========================================================================
  await test('NFR-Security: a different tenant\'s request for a session linked to another tenant\'s journey is rejected (not the session content)', async function() {
    var skills = freshRequire(SKILLS_PATH);

    var journey = journeyStore.createJourney('a4-nfr-test-feature', 'default');
    journeyStore.setJourneyFields(journey.journeyId, { ownerId: 'owner-login@example.test', tenantId: 'owner-login@example.test' });

    var sid = 'a4-nfr-sid-different-tenant';
    skills.registerHtmlSession(sid, '/tmp/a4-nfr-different-tenant', 'ideate', {});
    var session = skills._getHtmlSession(sid);
    session.journeyId = journey.journeyId;
    session.turns = [{ role: 'assistant', content: 'Secret opportunity map content that must not leak to another tenant.' }];

    var body = '';
    var statusCode = null;
    await skills.handleGetChatHtml(
      { params: { name: 'ideate', id: sid }, session: { accessToken: 'tok', login: 'different-login@example.test' } },
      { writeHead: function(code) { statusCode = code; }, end: function(h) { body = h || ''; } }
    );

    assert.notStrictEqual(statusCode, 200, 'a different tenant\'s request must not receive HTTP 200 for another tenant\'s session');
    assert.ok(!body.includes('Secret opportunity map content'), 'a different tenant\'s response body must not contain the session\'s actual content');
  });

  await test('NFR-Security: the owning user\'s own request for their own session still succeeds (the guard is not overly broad)', async function() {
    var skills = freshRequire(SKILLS_PATH);

    var journey = journeyStore.createJourney('a4-nfr-test-feature-owner', 'default');
    journeyStore.setJourneyFields(journey.journeyId, { ownerId: 'owner-login@example.test', tenantId: 'owner-login@example.test' });

    var sid = 'a4-nfr-sid-owner';
    skills.registerHtmlSession(sid, '/tmp/a4-nfr-owner', 'ideate', {});
    var session = skills._getHtmlSession(sid);
    session.journeyId = journey.journeyId;
    session.turns = [{ role: 'assistant', content: 'Owner-visible opportunity map content.' }];

    var body = '';
    var statusCode = null;
    await skills.handleGetChatHtml(
      { params: { name: 'ideate', id: sid }, session: { accessToken: 'tok', login: 'owner-login@example.test' } },
      { writeHead: function(code) { statusCode = code; }, end: function(h) { body = h || ''; } }
    );

    assert.strictEqual(statusCode, 200, 'the owning user\'s own request must still succeed');
  });

  console.log('\n[a4-ideate-session-resume] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
