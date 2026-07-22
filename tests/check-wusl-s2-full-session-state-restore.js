'use strict';

// tests/check-wusl-s2-full-session-state-restore.js — wusl-s2
//
// Unit tests for wusl-s2 (session restore from Redis carries forward ALL
// session state, not a hardcoded 8-field allowlist). Covers AC1-AC4 from
// artefacts/2026-07-23-skill-session-full-restore/dor/wusl-s2-dor.md.

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
  // AC1 -- previously-missing fields now restore correctly
  // ===========================================================================
  await test('mergeRedisSessionData restores canvasBlocks, conditionItems, and the definition story-map fields (AC1)', function() {
    var skills = freshRequire(SKILLS_PATH);
    var sid = 'wusl-s2-sid-1';
    skills.registerHtmlSession(sid, '/tmp/x', 'ideate', {});

    var redisData = {
      turns: [{ role: 'assistant', content: 'hi' }],
      canvasBlocks: [{ id: 'c1', text: 'block one' }],
      conditionItems: [{ id: 'cond1', text: 'condition one' }],
      dynamicQuestions: ['q1', 'q2'],
      sectionDrafts: ['draft A', 'draft B'],
      pendingConfirmation: true,
      pendingSectionDraft: 'draft in flight',
      currentSectionIndex: 2,
      modelResponses: ['resp1', 'resp2'],
      auditLog: [{ event: 'card_confirmed', at: '2026-07-23T00:00:00Z' }]
    };
    skills.mergeRedisSessionData(sid, redisData);

    var session = skills._getHtmlSession(sid);
    assert.deepStrictEqual(session.canvasBlocks, redisData.canvasBlocks, 'canvasBlocks must be restored');
    assert.deepStrictEqual(session.conditionItems, redisData.conditionItems, 'conditionItems must be restored');
    assert.deepStrictEqual(session.dynamicQuestions, redisData.dynamicQuestions, 'dynamicQuestions must be restored');
    assert.deepStrictEqual(session.sectionDrafts, redisData.sectionDrafts, 'sectionDrafts must be restored');
    assert.strictEqual(session.pendingConfirmation, true, 'pendingConfirmation must be restored');
    assert.strictEqual(session.pendingSectionDraft, 'draft in flight', 'pendingSectionDraft must be restored');
    assert.strictEqual(session.currentSectionIndex, 2, 'currentSectionIndex must be restored');
    assert.deepStrictEqual(session.modelResponses, redisData.modelResponses, 'modelResponses must be restored');
    assert.deepStrictEqual(session.auditLog, redisData.auditLog, 'auditLog must be restored');
  });

  // ===========================================================================
  // AC2 -- previously-covered fields still restore correctly, no regression
  // ===========================================================================
  await test('mergeRedisSessionData still restores the original 8 allowlisted fields correctly (AC2)', function() {
    var skills = freshRequire(SKILLS_PATH);
    var sid = 'wusl-s2-sid-2';
    skills.registerHtmlSession(sid, '/tmp/x', 'discovery', {});

    var redisData = {
      turns: [{ role: 'user', content: 'hello' }],
      artefactContent: '# Draft',
      artefactPath: 'artefacts/x/discovery.md',
      done: true,
      usage: { input_tokens: 10, output_tokens: 20 },
      _artefactBuffer: 'partial buffer',
      _artefactInProgress: true,
      _slugBuffer: 'sl',
      assumptionCards: { c1: { status: 'confirmed' } }
    };
    skills.mergeRedisSessionData(sid, redisData);

    var session = skills._getHtmlSession(sid);
    assert.deepStrictEqual(session.turns, redisData.turns);
    assert.strictEqual(session.artefactContent, '# Draft');
    assert.strictEqual(session.artefactPath, 'artefacts/x/discovery.md');
    assert.strictEqual(session.done, true);
    assert.deepStrictEqual(session.usage, redisData.usage);
    assert.strictEqual(session._artefactBuffer, 'partial buffer');
    assert.strictEqual(session._artefactInProgress, true);
    assert.strictEqual(session._slugBuffer, 'sl');
    assert.deepStrictEqual(session.assumptionCards, redisData.assumptionCards);
  });

  // ===========================================================================
  // AC3 -- never-persisted fields are never accidentally restored with a stale/wrong value
  // ===========================================================================
  await test('mergeRedisSessionData never overwrites the freshly-built systemPrompt/contextFiles/precomputedStep1, even if adversarially present in redisData (AC3)', function() {
    var skills = freshRequire(SKILLS_PATH);
    var sid = 'wusl-s2-sid-3';
    skills.registerHtmlSession(sid, '/tmp/x', 'discovery', {});
    var freshSession = skills._getHtmlSession(sid);
    var freshSystemPrompt = freshSession.systemPrompt;
    var freshContextFiles = freshSession.contextFiles;

    // Deliberately adversarial: real Redis data never actually contains these
    // keys (skill-session-redis.js's own _sanitise strips them before write),
    // but prove the denylist itself is what protects against them, not just
    // their real-world absence.
    var redisData = {
      turns: [],
      systemPrompt: 'SENTINEL-STALE-SYSTEM-PROMPT-SHOULD-NEVER-APPEAR',
      contextFiles: ['SENTINEL-STALE-CONTEXT-FILE'],
      precomputedStep1: 'SENTINEL-STALE-STEP1',
      accessToken: 'SENTINEL-SHOULD-NEVER-BE-ON-A-SKILL-SESSION'
    };
    skills.mergeRedisSessionData(sid, redisData);

    var session = skills._getHtmlSession(sid);
    assert.strictEqual(session.systemPrompt, freshSystemPrompt, 'systemPrompt must never be overwritten by the restore merge');
    assert.deepStrictEqual(session.contextFiles, freshContextFiles, 'contextFiles must never be overwritten by the restore merge');
    assert.notStrictEqual(session.precomputedStep1, 'SENTINEL-STALE-STEP1');
    assert.strictEqual(session.accessToken, undefined, 'accessToken must never be restored onto a skill session');
  });

  // ===========================================================================
  // AC4 -- a genuinely novel field restores automatically (proves the fix is structural)
  // ===========================================================================
  await test('mergeRedisSessionData restores a field that does not exist anywhere in today\'s codebase, proving this is not another allowlist (AC4)', function() {
    var skills = freshRequire(SKILLS_PATH);
    var sid = 'wusl-s2-sid-4';
    skills.registerHtmlSession(sid, '/tmp/x', 'discovery', {});

    var redisData = {
      turns: [],
      _futureFieldNotYetInvented: { some: 'future-shaped state' }
    };
    skills.mergeRedisSessionData(sid, redisData);

    var session = skills._getHtmlSession(sid);
    assert.deepStrictEqual(session._futureFieldNotYetInvented, { some: 'future-shaped state' }, 'a genuinely novel field must still be restored -- proves no allowlist needs updating for future stories');
  });

  console.log('\n[wusl-s2] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
