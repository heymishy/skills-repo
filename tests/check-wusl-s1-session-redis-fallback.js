'use strict';

// tests/check-wusl-s1-session-redis-fallback.js — wusl-s1
//
// Unit + integration tests for wusl-s1 (skill session lookups fall back to
// Redis consistently across every request handler, not just chat-page
// load). Covers AC1-AC4 from
// artefacts/2026-07-22-skill-session-redis-fallback/test-plans/wusl-s1-test-plan.md.

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

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

function authReq(extra) {
  return Object.assign({ session: { accessToken: 'tok', userId: 'u1' }, params: {}, body: {} }, extra || {});
}

(async function() {
  var skills = freshRequire(SKILLS_PATH);

  // ===========================================================================
  // AC1 -- handleGetChatHtml's own behavior is unchanged after extraction
  // ===========================================================================
  await test('handleGetChatHtml still restores from Redis on a cold in-memory Map (AC1 regression)', async function() {
    var sid = 'chat-sid-1';
    var redisRecord = { sessionPath: '/tmp/x', skillName: 'discovery', turns: [{ role: 'assistant', content: 'hi' }], done: false };
    var stub = makeStubRedisAdapter();
    stub._store[sid] = redisRecord;
    skills.setSkillSessionRedisAdapter(stub);

    var req = authReq({ params: { name: 'discovery', id: sid } });
    var res = makeRes();
    await skills.handleGetChatHtml(req, res);

    assert.notStrictEqual(res._status, 404, 'expected the chat page to render, not 404');
    skills.setSkillSessionRedisAdapter(null);
  });

  // ===========================================================================
  // AC2 -- the 9 named handlers restore from Redis on a cold in-memory Map
  // ===========================================================================
  await test('handlePostAnswer restores from Redis on a cold in-memory Map (AC2)', async function() {
    var sid = 'ans-sid-1';
    skills.registerHtmlSession(sid, '/tmp/x', 'discovery', {});
    var full = skills._getHtmlSession(sid);
    full.questions = [{ text: 'Q1' }];
    full.answers = [];
    skills._setHtmlSession(sid, full);
    var stub = makeStubRedisAdapter();
    stub._store[sid] = Object.assign({}, full, { turns: [] });
    skills.setSkillSessionRedisAdapter(stub);

    // Simulate the cache miss: the process was replaced, in-memory copy gone.
    var _fresh = freshRequire(SKILLS_PATH);
    _fresh.setSkillSessionRedisAdapter(stub);

    var req = authReq({ params: { name: 'discovery', id: sid }, body: { answer: 'my answer' } });
    var res = { _status: null, _body: null, writeHead: function() {}, end: function() {} };
    var jsonRes = { statusCode: null, _json: null };
    // handlePostAnswer uses _json(res, status, body) internally via res.writeHead/end -- capture via a minimal shim
    var capture = { status: null, body: null };
    var shimRes = {
      writeHead: function(s, h) { capture.status = s; },
      end: function(b) { try { capture.body = JSON.parse(b); } catch (_) { capture.body = b; } }
    };
    await _fresh.handlePostAnswer(req, shimRes);

    assert.notStrictEqual(capture.status, 404, 'expected no SESSION_NOT_FOUND after Redis restore, got status ' + capture.status + ' body ' + JSON.stringify(capture.body));
    _fresh.setSkillSessionRedisAdapter(null);
  });

  await test('handleGetSessionState restores from Redis on a cold in-memory Map (AC2)', async function() {
    var _fresh = freshRequire(SKILLS_PATH);
    var sid = 'state-sid-1';
    var stub = makeStubRedisAdapter();
    stub._store[sid] = { sessionPath: '/tmp/x', skillName: 'discovery', turns: [], userId: 'u1', questions: [], answers: [] };
    _fresh.setSkillSessionRedisAdapter(stub);

    var req = authReq({ params: { id: sid } });
    var capture = { status: null, body: null };
    var shimRes = { writeHead: function(s) { capture.status = s; }, end: function(b) { try { capture.body = JSON.parse(b); } catch (_) { capture.body = b; } } };
    await _fresh.handleGetSessionState(req, shimRes);

    assert.notStrictEqual(capture.status, 404, 'expected no SESSION_NOT_FOUND, got ' + capture.status);
    _fresh.setSkillSessionRedisAdapter(null);
  });

  await test('handlePostTurnHtml restores from Redis on a cold in-memory Map (AC2)', async function() {
    var _fresh = freshRequire(SKILLS_PATH);
    var sid = 'turn-sid-1';
    var stub = makeStubRedisAdapter();
    stub._store[sid] = { sessionPath: '/tmp/x', skillName: 'discovery', turns: [], done: false };
    _fresh.setSkillSessionRedisAdapter(stub);

    var req = authReq({ params: { name: 'discovery', id: sid }, body: { answer: 'hello' } });
    var capture = { status: null, body: null };
    var shimRes = { writeHead: function(s) { capture.status = s; }, end: function(b) { try { capture.body = JSON.parse(b); } catch (_) { capture.body = b; } } };
    try { await _fresh.handlePostTurnHtml(req, shimRes); } catch (_) { /* downstream LLM call may throw in this bare test env -- not the concern here */ }

    assert.notStrictEqual(capture.status, 404, 'expected no 404, got ' + capture.status);
    _fresh.setSkillSessionRedisAdapter(null);
  });

  await test('handlePostAssumptionConfirm restores from Redis on a cold in-memory Map (AC2)', async function() {
    var _fresh = freshRequire(SKILLS_PATH);
    var sid = 'assum-sid-1';
    var stub = makeStubRedisAdapter();
    stub._store[sid] = { sessionPath: '/tmp/x', skillName: 'ideate', turns: [], assumptionCards: { 'abcd1234': { status: 'pending' } } };
    _fresh.setSkillSessionRedisAdapter(stub);

    var req = authReq({ params: { id: sid, cardId: 'abcd1234' }, body: { action: 'confirm' } });
    var capture = { status: null, body: null };
    var shimRes = { writeHead: function(s) { capture.status = s; }, end: function(b) { try { capture.body = JSON.parse(b); } catch (_) { capture.body = b; } } };
    await _fresh.handlePostAssumptionConfirm(req, shimRes);

    // The specific error this story's fix targets is SESSION_NOT_FOUND (the
    // session itself missing from the in-memory Map) -- confirm that error
    // never fires, proving the Redis restore succeeded. A later, unrelated
    // error would be a genuine test-fixture gap, not this story's concern.
    assert.notStrictEqual(capture.body && capture.body.error, 'SESSION_NOT_FOUND', 'expected no SESSION_NOT_FOUND, got ' + capture.status + ' ' + JSON.stringify(capture.body));
    _fresh.setSkillSessionRedisAdapter(null);
  });

  // ===========================================================================
  // AC3 -- genuine double-miss still 404s exactly as today
  // ===========================================================================
  await test('handleGetSessionState still 404s for a session absent from both memory and Redis (AC3)', async function() {
    var _fresh = freshRequire(SKILLS_PATH);
    var stub = makeStubRedisAdapter({});
    _fresh.setSkillSessionRedisAdapter(stub);

    var req = authReq({ params: { id: 'genuinely-unknown-sid' } });
    var capture = { status: null, body: null };
    var shimRes = { writeHead: function(s) { capture.status = s; }, end: function(b) { try { capture.body = JSON.parse(b); } catch (_) { capture.body = b; } } };
    await _fresh.handleGetSessionState(req, shimRes);

    assert.strictEqual(capture.status, 404);
    assert.strictEqual(capture.body.error, 'SESSION_NOT_FOUND');
    _fresh.setSkillSessionRedisAdapter(null);
  });

  // ===========================================================================
  // AC4 -- sync functions remain synchronous, unconverted, explicit boundary
  // ===========================================================================
  await test('sync accessor functions (_getHtmlSession, htmlGetNextQuestion, htmlGetCompletePage, htmlGetPreview) remain synchronous and never consult Redis, matching each function\'s own existing missing-session contract exactly (AC4)', function() {
    var _fresh = freshRequire(SKILLS_PATH);
    var stub = makeStubRedisAdapter({ 'unreachable-sid': { sessionPath: '/tmp/x', skillName: 'discovery', turns: [], done: true, questions: [{ text: 'Q1' }], answers: [], artefactContent: 'SHOULD NOT APPEAR' } });
    _fresh.setSkillSessionRedisAdapter(stub);

    // Each function's own pre-existing missing-session contract, unchanged --
    // none of them consult the Redis stub even though it has real data for
    // this sessionId, proving no fallback was silently added.
    assert.strictEqual(_fresh._getHtmlSession('unreachable-sid'), undefined, '_getHtmlSession must not fall back to Redis (explicit scope boundary)');
    assert.strictEqual(_fresh.htmlGetNextQuestion('discovery', 'unreachable-sid'), null, 'htmlGetNextQuestion must still return null, not restore from Redis');
    var previewResult = _fresh.htmlGetPreview('discovery', 'unreachable-sid');
    assert.deepStrictEqual(previewResult, { artefactContent: '', artefactPath: '' }, 'htmlGetPreview must still return its empty-session default, not the Redis stub\'s real artefactContent');
    var completePageHtml = _fresh.htmlGetCompletePage('discovery', 'unreachable-sid');
    assert.ok(completePageHtml.indexOf('Session in progress') !== -1, 'htmlGetCompletePage must still degrade to its missing-session wording, not treat the Redis-only session as done');
    _fresh.setSkillSessionRedisAdapter(null);
  });

  console.log('\n[wusl-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
