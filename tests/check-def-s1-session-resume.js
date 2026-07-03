'use strict';

var assert = require('assert');
var path = require('path');
var crypto = require('crypto');

var SKILLS_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

function freshRequire() {
  delete require.cache[require.resolve(SKILLS_PATH)];
  return require(SKILLS_PATH);
}

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
    failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

function makeReq(sessionId) {
  return { params: { name: 'discovery', id: sessionId }, session: { accessToken: 'test-token' } };
}

function makeRes() {
  var r = { _code: null, _body: '' };
  r.writeHead = function(code) { r._code = code; };
  r.end = function(html) { r._body = html || ''; };
  return r;
}

function makeRedisData(overrides) {
  return Object.assign({
    skillName: 'discovery',
    sessionPath: '/tmp/test-session',
    featureSlug: null,
    journeyId: null,
    turns: [],
    artefactContent: null,
    artefactPath: null,
    done: false
  }, overrides);
}

async function main() {
  var queue = [];

  // T1.1 — AC1: cache miss + Redis hit → 200
  queue.push(function() {
    console.log('\n[def-s1] T1.1 -- AC1: cache miss + Redis hit → 200');
    return test('T1.1 chat-page-200-when-session-in-redis-not-in-memory', async function() {
      var routes = freshRequire();
      routes.setSkillSessionRedisAdapter({ read: async function() { return makeRedisData(); }, del: async function() {}, write: async function() {} });
      var sid = crypto.randomUUID();
      var req = makeReq(sid); var res = makeRes();
      await routes.handleGetChatHtml(req, res);
      assert.strictEqual(res._code, 200, 'Expected 200 from Redis restore, got ' + res._code);
      assert.ok(res._body.length > 0, 'Response body must be non-empty');
      routes.setSkillSessionRedisAdapter(null);
    });
  });

  // T2.1 — AC2: cache miss + Redis miss → 404
  queue.push(function() {
    console.log('\n[def-s1] T2.1 -- AC2: cache miss + Redis miss → 404');
    return test('T2.1 chat-page-404-when-session-absent-everywhere', async function() {
      var routes = freshRequire();
      routes.setSkillSessionRedisAdapter({ read: async function() { return null; }, del: async function() {}, write: async function() {} });
      var sid = crypto.randomUUID();
      var req = makeReq(sid); var res = makeRes();
      await routes.handleGetChatHtml(req, res);
      assert.strictEqual(res._code, 404, 'Expected 404, got ' + res._code);
      assert.ok(
        res._body.includes('Session not found') || res._body.includes('not found') || res._body.includes('Not Found'),
        'Body should mention not found, got: ' + res._body.slice(0, 200)
      );
      routes.setSkillSessionRedisAdapter(null);
    });
  });

  // T3.1 — AC3(a)(b): prior Q&A in HTML, current Q shown
  queue.push(function() {
    console.log('\n[def-s1] T3.1 -- AC3(a)(b): prior turns + current Q rendered in HTML');
    return test('T3.1 restored-session-renders-prior-qa-in-html', async function() {
      var routes = freshRequire();
      var turns = [
        { role: 'assistant', content: 'QUESTION_ONE' },
        { role: 'user',      content: 'ANSWER_ONE' },
        { role: 'assistant', content: 'QUESTION_TWO' }
      ];
      routes.setSkillSessionRedisAdapter({ read: async function() { return makeRedisData({ turns: turns }); }, del: async function() {}, write: async function() {} });
      var sid = crypto.randomUUID();
      var req = makeReq(sid); var res = makeRes();
      await routes.handleGetChatHtml(req, res);
      assert.ok(res._body.includes('QUESTION_ONE'), 'Prior assistant turn must appear in HTML');
      assert.ok(res._body.includes('ANSWER_ONE'),   'Prior user turn must appear in HTML');
      assert.ok(res._body.includes('QUESTION_TWO'), 'Current (unanswered) Q must appear in HTML');
      routes.setSkillSessionRedisAdapter(null);
    });
  });

  // T3.2 — AC3(c): chat thread non-empty (auto-fire guard would not trigger)
  queue.push(function() {
    console.log('\n[def-s1] T3.2 -- AC3(c): #chat-messages has sw-chat-msg children');
    return test('T3.2 restored-session-has-non-empty-chat-thread', async function() {
      var routes = freshRequire();
      var turns = [
        { role: 'assistant', content: 'QUESTION_ONE' },
        { role: 'user',      content: 'ANSWER_ONE' },
        { role: 'assistant', content: 'QUESTION_TWO' }
      ];
      routes.setSkillSessionRedisAdapter({ read: async function() { return makeRedisData({ turns: turns }); }, del: async function() {}, write: async function() {} });
      var sid = crypto.randomUUID();
      var req = makeReq(sid); var res = makeRes();
      await routes.handleGetChatHtml(req, res);
      assert.ok(res._body.includes('id="chat-messages"'), '#chat-messages element must be present');
      assert.ok(res._body.includes('sw-chat-msg'), '#chat-messages must contain sw-chat-msg children (non-empty thread)');
      routes.setSkillSessionRedisAdapter(null);
    });
  });

  // T4.1 — AC4: artefactContent → __SW_INITIAL_ARTEFACT__ in HTML
  queue.push(function() {
    console.log('\n[def-s1] T4.1 -- AC4: artefactContent → __SW_INITIAL_ARTEFACT__ init script');
    return test('T4.1 restored-session-with-artefact-includes-init-script', async function() {
      var routes = freshRequire();
      routes.setSkillSessionRedisAdapter({ read: async function() { return makeRedisData({ artefactContent: 'PRIOR_ARTEFACT_CONTENT' }); }, del: async function() {}, write: async function() {} });
      var sid = crypto.randomUUID();
      var req = makeReq(sid); var res = makeRes();
      await routes.handleGetChatHtml(req, res);
      assert.ok(res._body.includes('__SW_INITIAL_ARTEFACT__'), 'HTML must include __SW_INITIAL_ARTEFACT__ when artefactContent is set');
      routes.setSkillSessionRedisAdapter(null);
    });
  });

  // T5.1 — AC5: journeyId explicitly restored on session
  queue.push(function() {
    console.log('\n[def-s1] T5.1 -- AC5: journeyId restored explicitly after Redis restore');
    return test('T5.1 restored-session-has-journey-id-from-redis', async function() {
      var routes = freshRequire();
      routes.setSkillSessionRedisAdapter({ read: async function() { return makeRedisData({ journeyId: 'test-journey-id' }); }, del: async function() {}, write: async function() {} });
      var sid = crypto.randomUUID();
      var req = makeReq(sid); var res = makeRes();
      await routes.handleGetChatHtml(req, res);
      var restored = routes._getHtmlSession(sid);
      assert.ok(restored, 'Session must exist in _sessionStore after restore');
      assert.strictEqual(restored.journeyId, 'test-journey-id', 'journeyId must be restored from Redis data (not null from registerHtmlSession)');
      routes.setSkillSessionRedisAdapter(null);
    });
  });

  // T6.1 — AC6: hot path — session in memory → Redis NOT called
  queue.push(function() {
    console.log('\n[def-s1] T6.1 -- AC6: hot path skips Redis when session already in memory');
    return test('T6.1 hot-path-skips-redis-when-session-in-memory', async function() {
      var routes = freshRequire();
      var redisReadCount = 0;
      routes.setSkillSessionRedisAdapter({ read: async function() { redisReadCount++; return null; }, del: async function() {}, write: async function() {} });
      var sid = crypto.randomUUID();
      routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'SP', turns: [], artefactContent: null, artefactPath: null, done: false, journeyId: null });
      var req = makeReq(sid); var res = makeRes();
      await routes.handleGetChatHtml(req, res);
      assert.strictEqual(res._code, 200, 'Hot path must return 200');
      assert.strictEqual(redisReadCount, 0, 'Redis read must NOT be called when session is in memory (got ' + redisReadCount + ' calls)');
      routes.setSkillSessionRedisAdapter(null);
    });
  });

  // IT1 — graceful fallback when Redis adapter not wired
  queue.push(function() {
    console.log('\n[def-s1] IT1 -- graceful fallback when Redis adapter is null');
    return test('IT1 graceful-fallback-when-redis-adapter-not-wired', async function() {
      var routes = freshRequire();
      routes.setSkillSessionRedisAdapter(null);
      var sid = crypto.randomUUID();
      var req = makeReq(sid); var res = makeRes();
      await routes.handleGetChatHtml(req, res);
      assert.strictEqual(res._code, 404, 'Must return 404 (not crash) when no Redis adapter and session not in memory');
    });
  });

  // NFR1 — hot path read count = 0 (explicit performance constraint)
  queue.push(function() {
    console.log('\n[def-s1] NFR1 -- redis-read-count-zero-for-hot-path');
    return test('NFR1 redis-read-count-zero-for-hot-path', async function() {
      var routes = freshRequire();
      var redisReadCount = 0;
      routes.setSkillSessionRedisAdapter({ read: async function() { redisReadCount++; return null; }, del: async function() {}, write: async function() {} });
      var sid = crypto.randomUUID();
      routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'SP', turns: [], artefactContent: null, artefactPath: null, done: false, journeyId: null });
      var req = makeReq(sid); var res = makeRes();
      await routes.handleGetChatHtml(req, res);
      assert.strictEqual(redisReadCount, 0, 'NFR: zero Redis reads for hot path (session in memory). Got: ' + redisReadCount);
      routes.setSkillSessionRedisAdapter(null);
    });
  });

  for (var i = 0; i < queue.length; i++) { await queue[i](); }

  console.log('\n── Summary ──────────────────────────────────────────');
  console.log('  Passed:', passed, '/', passed + failed);
  if (failures.length) {
    console.log('  Failures:');
    failures.forEach(function(f) { console.log('    -', f.name, ':', f.err && f.err.message || f.err); });
    process.exit(1);
  }
  console.log('  All tests passed.');
}

main().catch(function(err) { console.error('Test runner error:', err); process.exit(1); });
