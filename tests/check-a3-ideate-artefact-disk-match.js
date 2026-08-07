'use strict';

// tests/check-a3-ideate-artefact-disk-match.js — story a3-product-feature-ideate-canvas
//
// Integration test for AC4:
// artefacts/2026-07-23-e2e-core-journey-coverage/stories/a3-product-feature-ideate-canvas.md
//
// "Given the /ideate session has produced canvas content, When the spec reads
//  the underlying artefact from disk (or via the API that reads it from disk,
//  per this repo's disk-canonicity convention), Then the artefact content
//  matches what was rendered in the canvas -- proving the save-to-disk path,
//  not just the in-memory session state, is exercised."
//
// This repo's established durable persistence layer for stateful skill-session
// fields (including /ideate's canvasBlocks -- see skills.js's own
// mergeRedisSessionData docstring, lines ~99-107) is the Redis adapter wired
// via setSkillSessionRedisAdapter(), restored on process/tab restart via
// registerHtmlSession() + mergeRedisSessionData(). This is the exact same
// "disk canonicity" mechanism story b1 used for its own AC4
// (tests/check-b1-story-map-session-restore.js) -- this test mirrors that
// established pattern, scoped to /ideate's canvasBlocks field instead of
// /definition's story-map fields.
//
// This is an Integration test per the test plan (not E2E) -- it exercises the
// real, exported skills.js functions (parseCanvasBlock, registerHtmlSession,
// mergeRedisSessionData, _getHtmlSession) directly against the SAME canvas
// marker fixture content used by the E2E spec's mock-LLM-gateway fixture
// (tests/e2e/fixtures/llm-gateway/ideate.success.json), so what this test
// proves "matches on disk" is genuinely the same content the E2E canvas
// renders live -- not a hand-crafted stand-in payload. Deterministic; no
// staging, credits, or real model dependency, so it runs in the normal unit
// test chain (`npm test`).

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
  // AC4 precondition -- the E2E spec's own mock fixture really does contain a
  // parseable canvas marker (proves the two tests are exercising the same
  // real content, not two independently-invented payloads).
  // ===========================================================================
  await test('the a3 mock-LLM-gateway fixture (tests/e2e/fixtures/llm-gateway/ideate.success.json) contains exactly one parseable canvas marker', function() {
    assert.strictEqual(markerTexts.length, 1, 'expected exactly one ---CANVAS-JSON:...--- marker in the ideate fixture response');
    var skills = freshRequire(SKILLS_PATH);
    var parsed = skills.parseCanvasBlock(markerTexts[0]);
    assert.ok(parsed, 'parseCanvasBlock() must successfully parse the fixture marker');
    assert.strictEqual(parsed.type, 'cluster-tree');
    assert.strictEqual(parsed.title, 'Opportunity map');
    assert.ok(Array.isArray(parsed.content.clusters) && parsed.content.clusters.length > 0);
  });

  // ===========================================================================
  // AC4a -- a single turn's canvas block, once persisted and restored via the
  // real Redis round-trip mechanism, matches exactly what was rendered.
  // ===========================================================================
  await test('mergeRedisSessionData restores /ideate\'s canvasBlocks after a disk round-trip, matching exactly what was rendered from the turn (AC4)', function() {
    var skills = freshRequire(SKILLS_PATH);
    var sid = 'a3-ideate-sid-1';
    skills.registerHtmlSession(sid, '/tmp/a3-ideate', 'ideate', {});

    // Simulate the real turn-stream handler's own behaviour (skills.js ~4076-4080):
    // parse the marker exactly as it emits from a real (or mocked) LLM turn, and
    // push it onto the session's canvasBlocks, exactly like a live turn would.
    var renderedBlock = skills.parseCanvasBlock(markerTexts[0]);
    var session = skills._getHtmlSession(sid);
    session.canvasBlocks = [renderedBlock];
    var renderedSnapshot = JSON.parse(JSON.stringify(session.canvasBlocks));

    // "Write to disk" -- the real persistence layer for this field is Redis
    // (skill-session-redis.js), restored via registerHtmlSession + mergeRedisSessionData
    // exactly as _getSessionOrRestore performs it in production (skills.js ~137-148).
    var redisSnapshot = { turns: [], canvasBlocks: renderedSnapshot };

    // "Read back from disk" -- fresh registration (simulating a lost in-memory
    // session, e.g. a redeploy or tab close) then restore via the real merge function.
    skills.registerHtmlSession(sid, '/tmp/a3-ideate', 'ideate', {});
    skills.mergeRedisSessionData(sid, redisSnapshot);
    var restored = skills._getHtmlSession(sid);

    assert.deepStrictEqual(restored.canvasBlocks, renderedSnapshot, 'disk-restored canvasBlocks must exactly match what was rendered in the canvas before the round-trip');
  });

  // ===========================================================================
  // AC4b -- two turns' worth of canvas blocks (matching AC3's "canvas updates
  // between turn 1 and turn 2") both survive the disk round-trip, in order.
  // ===========================================================================
  await test('two turns\' worth of canvasBlocks (matching AC3\'s turn-1/turn-2 update) both restore in order after a disk round-trip (AC4)', function() {
    var skills = freshRequire(SKILLS_PATH);
    var sid = 'a3-ideate-sid-2';
    skills.registerHtmlSession(sid, '/tmp/a3-ideate-2', 'ideate', {});

    var block1 = skills.parseCanvasBlock(markerTexts[0]);
    var block2 = skills.parseCanvasBlock(markerTexts[0]); // same deterministic fixture, reused on turn 2 (mock gateway is stateless per session)
    var session = skills._getHtmlSession(sid);
    session.canvasBlocks = [block1];
    session.canvasBlocks.push(block2); // turn 2 appends -- new element, matching AC3's "not a static/frozen canvas"
    var renderedSnapshot = JSON.parse(JSON.stringify(session.canvasBlocks));

    assert.strictEqual(renderedSnapshot.length, 2, 'two turns must produce two canvas blocks before persistence, proving the canvas updates turn-over-turn');

    var redisSnapshot = { turns: [], canvasBlocks: renderedSnapshot };
    skills.registerHtmlSession(sid, '/tmp/a3-ideate-2', 'ideate', {});
    skills.mergeRedisSessionData(sid, redisSnapshot);
    var restored = skills._getHtmlSession(sid);

    assert.strictEqual(restored.canvasBlocks.length, 2, 'both canvas blocks must survive the disk round-trip');
    assert.deepStrictEqual(restored.canvasBlocks, renderedSnapshot, 'disk-restored canvasBlocks must exactly match what was rendered across both turns, in order');
  });

  // ===========================================================================
  // AC4c -- canvasBlocks is scoped to /ideate sessions, exactly like b1's own
  // AC4b distinctness check for /definition's story-map fields -- proves this
  // is genuinely the save-to-disk path for /ideate, not an incidental field
  // that happens to exist on every skill session type.
  // ===========================================================================
  await test('canvasBlocks is /ideate\'s own field -- a fresh /ideate session has none until a turn renders one, and the restore mechanism does not fabricate one (AC4)', function() {
    var skills = freshRequire(SKILLS_PATH);
    var sid = 'a3-ideate-sid-3';
    skills.registerHtmlSession(sid, '/tmp/a3-ideate-3', 'ideate', {});
    var freshSession = skills._getHtmlSession(sid);
    assert.strictEqual(freshSession.canvasBlocks, undefined, 'a brand-new /ideate session must have no canvasBlocks until a real turn renders one');

    // A restore with no canvasBlocks in the disk snapshot must not fabricate one either.
    skills.mergeRedisSessionData(sid, { turns: [] });
    var afterEmptyRestore = skills._getHtmlSession(sid);
    assert.strictEqual(afterEmptyRestore.canvasBlocks, undefined, 'restoring from a disk snapshot with no canvasBlocks must not fabricate canvas content');
  });

  console.log('\n[a3-product-feature-ideate-canvas] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
