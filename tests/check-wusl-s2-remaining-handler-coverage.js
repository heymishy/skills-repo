'use strict';

// tests/check-wusl-s2-remaining-handler-coverage.js — wusl-s2
//
// Dedicated Redis-fallback regression tests for the remaining wusl-s1 call
// sites that were previously verified only via code review (byte-identical
// _getSessionOrRestore delegation), not by an individual automated test.
// Covers AC1-AC4 from
// artefacts/2026-09-12-skill-session-redis-fallback-coverage-backfill/test-plans/wusl-s2-test-plan.md.
//
// htmlRecordAnswer (the story's original 5th target) was confirmed dead code
// during this story's own preparation -- not exported, zero callers anywhere
// in the codebase -- and is intentionally not covered here. See the story's
// own Out of Scope section.

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

function makeStubRedisAdapter(initialStore) {
  var store = initialStore || {};
  return {
    _store: store,
    write: async function(id, data) { store[id] = data; },
    del: async function(id) { delete store[id]; },
    read: async function(id) { return store.hasOwnProperty(id) ? store[id] : null; }
  };
}

function authReq(extra) {
  return Object.assign({ session: { accessToken: 'tok', userId: 'u1' }, params: {}, body: {} }, extra || {});
}

(async function() {
  // ===========================================================================
  // AC1 -- handleCommitArtefact restores from Redis on a cold in-memory Map
  // ===========================================================================
  await test('handleCommitArtefact restores a complete session from Redis on a cold in-memory Map (AC1)', async function() {
    var _fresh = freshRequire(SKILLS_PATH);
    var sid = 'commit-sid-1';
    var stub = makeStubRedisAdapter();
    stub._store[sid] = {
      sessionPath: '/tmp/x',
      skillName: 'discovery',
      turns: [],
      userId: 'u1',
      questions: [{ text: 'Q1' }],
      answers: [{ text: 'A1' }]
    };
    _fresh.setSkillSessionRedisAdapter(stub);

    var req = authReq({ params: { name: 'discovery', id: sid } });
    var capture = { status: null, body: null };
    var shimRes = { writeHead: function(s) { capture.status = s; }, end: function(b) { try { capture.body = JSON.parse(b); } catch (_) { capture.body = b; } } };
    await _fresh.handleCommitArtefact(req, shimRes);

    assert.notStrictEqual(capture.body && capture.body.error, 'SESSION_NOT_FOUND', 'expected no SESSION_NOT_FOUND, got ' + capture.status + ' ' + JSON.stringify(capture.body));
    _fresh.setSkillSessionRedisAdapter(null);
  });

  // ===========================================================================
  // AC2 -- handlePostCanvasEditHtml restores from Redis on a cold in-memory Map
  // ===========================================================================
  await test('handlePostCanvasEditHtml restores a session from Redis on a cold in-memory Map (AC2)', async function() {
    var _fresh = freshRequire(SKILLS_PATH);
    var sid = 'canvas-sid-1';
    var stub = makeStubRedisAdapter();
    stub._store[sid] = { sessionPath: '/tmp/x', skillName: 'design', turns: [], artefactContent: '', streamActive: false };
    _fresh.setSkillSessionRedisAdapter(stub);

    var req = authReq({ params: { name: 'design', id: sid }, body: { pendingReorder: [], pendingAdds: [] } });
    var capture = { status: null, body: null };
    var shimRes = { writeHead: function(s) { capture.status = s; }, end: function(b) { try { capture.body = JSON.parse(b); } catch (_) { capture.body = b; } } };
    await _fresh.handlePostCanvasEditHtml(req, shimRes);

    assert.notStrictEqual(capture.body && capture.body.error, 'Session not found', 'expected no session-not-found error, got ' + capture.status + ' ' + JSON.stringify(capture.body));
    _fresh.setSkillSessionRedisAdapter(null);
  });

  // ===========================================================================
  // AC3 -- handlePostTurnStreamHtml restores from Redis on a cold in-memory Map
  // ===========================================================================
  await test('handlePostTurnStreamHtml restores a session from Redis on a cold in-memory Map, responds 200 not 404 (AC3)', async function() {
    var _fresh = freshRequire(SKILLS_PATH);
    var sid = 'stream-sid-1';
    var stub = makeStubRedisAdapter();
    stub._store[sid] = { sessionPath: '/tmp/x', skillName: 'discovery', turns: [], done: false };
    _fresh.setSkillSessionRedisAdapter(stub);
    _fresh.setSkillTurnExecutorStreamAdapter(async function(_sysPrompt, _history, _currentInput, _token, onChunk) {
      onChunk('ok');
      return 'ok';
    });

    var req = authReq({ params: { name: 'discovery', id: sid }, body: { answer: '__init__' } });
    var capture = { status: null, body: '' };
    var shimRes = {
      writeHead: function(s) { capture.status = s; },
      write: function() {},
      end: function(b) { capture.body += (b || ''); }
    };
    await _fresh.handlePostTurnStreamHtml(req, shimRes);

    assert.strictEqual(capture.status, 200, 'expected a 200 SSE stream (session found via Redis), got ' + capture.status);
    _fresh.setSkillSessionRedisAdapter(null);
  });

  // ===========================================================================
  // AC4 -- htmlSubmitTurn restores from Redis on a cold in-memory Map
  // ===========================================================================
  await test('htmlSubmitTurn restores a session from Redis on a cold in-memory Map, does not return null (AC4)', async function() {
    var _fresh = freshRequire(SKILLS_PATH);
    var sid = 'submit-sid-1';
    var stub = makeStubRedisAdapter();
    stub._store[sid] = { sessionPath: '/tmp/x', skillName: 'discovery', turns: [], done: false };
    _fresh.setSkillSessionRedisAdapter(stub);
    _fresh.setSkillTurnExecutorAdapter(async function() { return 'ok'; });

    var result = await _fresh.htmlSubmitTurn('discovery', sid, 'hello', 'tok');

    assert.notStrictEqual(result, null, 'expected htmlSubmitTurn to find the session via Redis restore, not return null');
    _fresh.setSkillSessionRedisAdapter(null);
  });

  console.log('\n[wusl-s2] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
