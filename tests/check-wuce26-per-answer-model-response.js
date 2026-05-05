'use strict';
/**
 * check-wuce26-per-answer-model-response.js
 *
 * Tests for wuce.26 rewritten for mfc.1 model-first architecture.
 *
 * Run: node tests/check-wuce26-per-answer-model-response.js
 */

const assert = require('assert');
const path   = require('path');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(function() {
        passed++;
        console.log('  PASS: ' + name);
      }).catch(function(err) {
        failed++;
        const msg = err && err.message ? err.message : String(err);
        failures.push({ name, msg });
        console.log('  FAIL: ' + name + '\n       ' + msg);
      });
    }
    passed++;
    console.log('  PASS: ' + name);
    return Promise.resolve();
  } catch (err) {
    failed++;
    const msg = err && err.message ? err.message : String(err);
    failures.push({ name, msg });
    console.log('  FAIL: ' + name + '\n       ' + msg);
    return Promise.resolve();
  }
}

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

const ROUTES_PATH   = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const ADAPTERS_PATH = path.resolve(__dirname, '../src/web-ui/adapters/skills.js');
const EXECUTOR_PATH = path.resolve(__dirname, '../src/modules/skill-turn-executor.js');

const queue = [];

// T8 -- default _skillTurnExecutor stub throws
queue.push(function runT8() {
  console.log('\n-- T8 -- Default _skillTurnExecutor stub throws');
  return test('T8: default skillTurnExecutor stub throws "Adapter not wired: skillTurnExecutor"', function() {
    const adapter = freshRequire(ADAPTERS_PATH);
    assert.throws(
      function() { adapter.skillTurnExecutor('content', [], 'answer', 'token'); },
      function(err) {
        assert.ok(err instanceof Error, 'must be an Error instance');
        assert.ok(err.message.includes('Adapter not wired: skillTurnExecutor'),
          'Error message must contain "Adapter not wired: skillTurnExecutor", got: ' + err.message);
        return true;
      }
    );
  });
});

// T1 -- htmlSubmitTurn calls _skillTurnExecutor and appends to session.turns
queue.push(function runT1() {
  console.log('\n-- T1 -- htmlSubmitTurn calls _skillTurnExecutor and appends turns');
  return test('T1: htmlSubmitTurn calls executor and appends user+assistant to session.turns', async function() {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Great answer, here is context.'; });
    const sid = 'test-wuce26-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT', turns: [], artefactContent: null, artefactPath: null, done: false });
    await routes.htmlSubmitTurn('discovery', sid, 'My raw idea', 'fake-tok');
    const sess = routes._getHtmlSession(sid);
    assert.ok(Array.isArray(sess.turns), 'turns must be array');
    assert.strictEqual(sess.turns.length, 2, 'must have 2 turns');
    assert.strictEqual(sess.turns[0].role, 'user', 'first turn must be user');
    assert.strictEqual(sess.turns[1].role, 'assistant', 'second turn must be assistant');
    assert.strictEqual(sess.turns[1].content, 'Great answer, here is context.', 'assistant content must match');
  });
});

// T2 -- session.turns grows correctly
queue.push(function runT2() {
  console.log('\n-- T2 -- session.turns grows with each htmlSubmitTurn');
  return test('T2: turns[3].content correct on 2nd call', async function() {
    const routes = freshRequire(ROUTES_PATH);
    let callCount = 0;
    routes.setSkillTurnExecutorAdapter(async function() { callCount++; return 'Response ' + callCount; });
    const sid = 'test-wuce26-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT', turns: [], artefactContent: null, artefactPath: null, done: false });
    await routes.htmlSubmitTurn('discovery', sid, 'First answer', 'fake-tok');
    await routes.htmlSubmitTurn('discovery', sid, 'Second answer', 'fake-tok');
    const sess = routes._getHtmlSession(sid);
    assert.strictEqual(sess.turns.length, 4, 'must have 4 turns after 2 calls');
    assert.strictEqual(sess.turns[3].content, 'Response 2', 'turns[3].content must be "Response 2"');
    assert.strictEqual(sess.turns[0].content, 'First answer');
    assert.strictEqual(sess.turns[2].content, 'Second answer');
  });
});

// T3 -- adapter throw does not prevent graceful return
queue.push(function runT3() {
  console.log('\n-- T3 -- Adapter throw handled gracefully by htmlSubmitTurn');
  return test('T3: executor throw sets done=false, response="" and does not throw', async function() {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { throw new Error('API error'); });
    const sid = 'test-wuce26-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT', turns: [], artefactContent: null, artefactPath: null, done: false });
    let threwError = false; let result = null;
    try { result = await routes.htmlSubmitTurn('discovery', sid, 'My answer', 'fake-tok'); } catch (_) { threwError = true; }
    assert.strictEqual(threwError, false, 'must not throw');
    const sess = routes._getHtmlSession(sid);
    assert.strictEqual(sess.done, false, 'done must stay false on error');
    assert.ok(result, 'must return a result object');
  });
});

// T4 -- executor rejection (non-Error) handled gracefully
queue.push(function runT4() {
  console.log('\n-- T4 -- Adapter rejection (non-Error) handled gracefully');
  return test('T4: executor rejecting with string handled without unhandled rejection', async function() {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(function() { return Promise.reject('timeout'); });
    const sid = 'test-wuce26-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT', turns: [], artefactContent: null, artefactPath: null, done: false });
    let threwError = false;
    try { await routes.htmlSubmitTurn('discovery', sid, 'Answer', 'fake-tok'); } catch (_) { threwError = true; }
    assert.strictEqual(threwError, false, 'must not throw on rejection');
    const sess = routes._getHtmlSession(sid);
    assert.strictEqual(sess.done, false);
  });
});

// T5 -- handleGetChatHtml renders prior turns in HTML
queue.push(function runT5() {
  console.log('\n-- T5 -- handleGetChatHtml renders prior session.turns in HTML');
  return test('T5: handleGetChatHtml renders user+assistant turns from session.turns', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'test-wuce26-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT',
      turns: [
        { role: 'user', content: 'My first raw idea' },
        { role: 'assistant', content: 'Here is the model insight.' }
      ],
      artefactContent: null, artefactPath: null, done: false
    });
    let capturedHtml = '';
    const mockRes = { writeHead: function() {}, end: function(body) { capturedHtml = body || ''; } };
    const mockReq = { session: { accessToken: 'tok', login: 'user', userId: 'u1' }, params: { name: 'discovery', id: sid } };
    await routes.handleGetChatHtml(mockReq, mockRes);
    assert.ok(capturedHtml.includes('My first raw idea'), 'rendered HTML must include user message text');
    assert.ok(capturedHtml.includes('Here is the model insight.'), 'rendered HTML must include assistant message text');
  });
});

// T6 -- chat page contains turn message text
queue.push(function runT6() {
  console.log('\n-- T6 -- Chat HTML page includes session turn content');
  return test('T6: handleGetChatHtml includes .msg--user and .msg--assistant elements for turns', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'test-wuce26-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT',
      turns: [
        { role: 'user', content: 'User message content here' },
        { role: 'assistant', content: 'Assistant message content here' }
      ],
      artefactContent: null, artefactPath: null, done: false
    });
    let capturedHtml = '';
    const mockRes = { writeHead: function() {}, end: function(body) { capturedHtml = body || ''; } };
    const mockReq = { session: { accessToken: 'tok', login: 'user', userId: 'u1' }, params: { name: 'discovery', id: sid } };
    await routes.handleGetChatHtml(mockReq, mockRes);
    assert.ok(capturedHtml.includes('msg--user') || capturedHtml.includes('msg-user'), 'must include user message CSS class');
    assert.ok(capturedHtml.includes('msg--assistant') || capturedHtml.includes('msg-assistant'), 'must include assistant message CSS class');
  });
});

// T7 -- handlePostTurnHtml returns 200 JSON {done, response}
queue.push(function runT7() {
  console.log('\n-- T7 -- handlePostTurnHtml returns 200 JSON {done, response}');
  return test('T7: handlePostTurnHtml returns 200 with JSON body containing done and response', async function() {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Model reply.'; });
    const sid = 'test-wuce26-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT', turns: [], artefactContent: null, artefactPath: null, done: false });
    let capturedStatus = null; let capturedBody = '';
    const mockRes = { writeHead: function(s) { capturedStatus = s; }, end: function(body) { capturedBody = body || ''; } };
    const mockReq = {
      session: { accessToken: 'fake-tok', login: 'user', userId: 'u1' },
      params: { name: 'discovery', id: sid },
      body: { answer: 'My answer' }
    };
    await routes.handlePostTurnHtml(mockReq, mockRes);
    assert.strictEqual(capturedStatus, 200, 'status must be 200');
    let parsed;
    try { parsed = JSON.parse(capturedBody); } catch (e) { throw new Error('body must be valid JSON, got: ' + capturedBody.slice(0, 100)); }
    assert.ok('done' in parsed, 'response must have "done" field');
    assert.ok('response' in parsed, 'response must have "response" field');
    assert.strictEqual(parsed.response, 'Model reply.');
  });
});

// T9 -- skill-turn-executor new signature: systemPrompt, history, currentInput, token
queue.push(function runT9() {
  console.log('\n-- T9 -- skill-turn-executor sends correct request with new signature');
  return test('T9: executor sends POST with messages=[system, ...history, currentUser]', async function() {
    const executor = require(EXECUTOR_PATH);
    let capturedOptions = null; let capturedBody = null;
    const https = require('https');
    const origRequest = https.request;
    https.request = function(options, callback) {
      capturedOptions = options;
      const EventEmitter = require('events');
      const resEmitter = new EventEmitter();
      resEmitter.statusCode = 200;
      if (callback) callback(resEmitter);
      const req = {
        write: function(data) { capturedBody = JSON.parse(data); },
        end: function() {
          resEmitter.emit('data', JSON.stringify({ choices: [{ message: { content: 'Good insight.' } }] }));
          resEmitter.emit('end');
        },
        on: function(ev, fn) { return req; },
        setTimeout: function() { return req; }
      };
      return req;
    };
    try {
      const systemPrompt = '# Discovery SKILL';
      const history = [{ role: 'user', content: 'prior Q' }, { role: 'assistant', content: 'prior A' }];
      const result = await executor.skillTurnExecutor(systemPrompt, history, 'current input', 'fake-token');
      assert.ok(capturedOptions, 'https.request must have been called');
      const host = capturedOptions.hostname || (capturedOptions.host && capturedOptions.host.replace(':443',''));
      assert.strictEqual(host, 'api.githubcopilot.com', 'host must be api.githubcopilot.com');
      assert.ok((capturedOptions.path || '').includes('/chat/completions'), 'path must include /chat/completions');
      const authHeader = (capturedOptions.headers || {})['Authorization'] || (capturedOptions.headers || {})['authorization'];
      assert.strictEqual(authHeader, 'Bearer fake-token', 'Authorization must be Bearer fake-token');
      assert.ok(capturedBody, 'body must be captured');
      assert.ok(Array.isArray(capturedBody.messages), 'messages must be array');
      assert.strictEqual(capturedBody.messages[0].role, 'system', 'messages[0] must be system');
      assert.strictEqual(capturedBody.messages[0].content, systemPrompt, 'system message must be systemPrompt');
      assert.strictEqual(capturedBody.messages[1].role, 'user', 'messages[1] must be user (history)');
      assert.strictEqual(capturedBody.messages[1].content, 'prior Q', 'messages[1].content must be "prior Q"');
      assert.strictEqual(capturedBody.messages[2].role, 'assistant', 'messages[2] must be assistant (history)');
      assert.strictEqual(capturedBody.messages[2].content, 'prior A', 'messages[2].content must be "prior A"');
      const last = capturedBody.messages[capturedBody.messages.length - 1];
      assert.strictEqual(last.role, 'user', 'last message must be user');
      assert.strictEqual(last.content, 'current input', 'last message must be current input');
      assert.ok(capturedBody.max_tokens > 0, 'max_tokens must be positive');
      assert.strictEqual(result, 'Good insight.', 'must return choices[0].message.content');
    } finally { https.request = origRequest; }
  });
});

// T10 -- executor returns parsed response content
queue.push(function runT10() {
  console.log('\n-- T10 -- executor returns parsed response content');
  return test('T10: executor returns choices[0].message.content from response JSON', async function() {
    const executor = require(EXECUTOR_PATH);
    const https = require('https');
    const origRequest = https.request;
    https.request = function(options, callback) {
      const EventEmitter = require('events');
      const resEmitter = new EventEmitter();
      resEmitter.statusCode = 200;
      if (callback) callback(resEmitter);
      const req = {
        write: function() {},
        end: function() {
          resEmitter.emit('data', JSON.stringify({ choices: [{ message: { content: 'Parsed result here.' } }] }));
          resEmitter.emit('end');
        },
        on: function() { return req; },
        setTimeout: function() { return req; }
      };
      return req;
    };
    try {
      const result = await executor.skillTurnExecutor('skill', [], 'answer', 'tok');
      assert.strictEqual(result, 'Parsed result here.', 'must return choices[0].message.content');
    } finally { https.request = origRequest; }
  });
});

// T11 -- htmlGetPreview returns session.artefactContent
queue.push(function runT11() {
  console.log('\n-- T11 -- htmlGetPreview returns session.artefactContent');
  return test('T11: htmlGetPreview returns {artefactContent} from session.artefactContent', function() {
    const routes = freshRequire(ROUTES_PATH);
    const modelContent = '# Discovery\n\n## Background\nThe model-produced artefact content.';
    const sid = 'test-wuce26-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: '', turns: [], artefactContent: modelContent, artefactPath: 'artefacts/2026-05-05-test/discovery.md', done: true });
    const preview = routes.htmlGetPreview('discovery', sid);
    assert.strictEqual(preview.artefactContent, modelContent, 'artefactContent must equal session.artefactContent');
    assert.ok(!preview.artefactContent.includes('null'), 'must not include the string "null"');
  });
});

// T12 -- htmlGetPreview with null artefactContent returns empty strings
queue.push(function runT12() {
  console.log('\n-- T12 -- htmlGetPreview with null artefactContent returns empty strings');
  return test('T12: htmlGetPreview returns {artefactContent:"", artefactPath:""} when session.artefactContent=null', function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'test-wuce26-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: '', turns: [], artefactContent: null, artefactPath: null, done: false });
    const preview = routes.htmlGetPreview('discovery', sid);
    assert.strictEqual(preview.artefactContent, '', 'artefactContent must be "" when null');
    assert.strictEqual(preview.artefactPath, '', 'artefactPath must be "" when null');
    assert.ok(!preview.artefactContent.includes('null'), 'must not include "null"');
    assert.ok(!preview.artefactContent.includes('undefined'), 'must not include "undefined"');
  });
});

// T-NFR1 -- Token not logged on executor error
queue.push(function runNFR1() {
  console.log('\n-- T-NFR1 -- Token not logged on executor error');
  return test('T-NFR1: token "secret-token-abc" does not appear in any log output on error', async function() {
    const executor = require(EXECUTOR_PATH);
    const https = require('https');
    const origRequest = https.request;
    const origStdout = process.stdout.write.bind(process.stdout);
    const origStderr = process.stderr.write.bind(process.stderr);
    const logOutput = [];
    process.stdout.write = function(data) { logOutput.push(String(data)); return true; };
    process.stderr.write = function(data) { logOutput.push(String(data)); return true; };
    https.request = function(options, callback) {
      const req = {
        write: function() {}, end: function() {},
        on: function(ev, fn) { if (ev === 'error') fn(new Error('connection refused')); return req; },
        setTimeout: function() { return req; }
      };
      return req;
    };
    try { await executor.skillTurnExecutor('skill', [], 'answer', 'secret-token-abc'); } catch (_) {}
    finally {
      process.stdout.write = origStdout; process.stderr.write = origStderr; https.request = origRequest;
    }
    const combined = logOutput.join('');
    assert.ok(!combined.includes('secret-token-abc'), 'Token must not appear in any log output. Found in: ' + combined.slice(0, 200));
  });
});

// T-NFR2 -- Executor respects timeout
queue.push(function runNFR2() {
  console.log('\n-- T-NFR2 -- Executor respects 30-second timeout');
  return test('T-NFR2: executor rejects within 400ms when request never completes (timeout=100ms)', async function() {
    const origEnv = process.env.WUCE_TURN_TIMEOUT_MS;
    process.env.WUCE_TURN_TIMEOUT_MS = '100';
    const resolved = require.resolve(EXECUTOR_PATH);
    delete require.cache[resolved];
    const executor = require(resolved);
    const https = require('https');
    const origRequest = https.request;
    https.request = function(options, callback) {
      let _timeoutFn = null; let _errorFn = null;
      const req = {
        write: function() {}, end: function() {},
        on: function(ev, fn) { if (ev === 'error') { _errorFn = fn; } return req; },
        setTimeout: function(ms, fn) { _timeoutFn = fn; return req; },
        destroy: function(err) { if (_errorFn) { _errorFn(err || new Error('destroyed')); } }
      };
      setTimeout(function() { if (_timeoutFn) { _timeoutFn(); } }, 50);
      return req;
    };
    try {
      const start = Date.now(); let rejected = false;
      try { await executor.skillTurnExecutor('skill', [], 'answer', 'tok'); } catch (err) {
        rejected = true;
        const elapsed = Date.now() - start;
        assert.ok(elapsed < 400, 'must reject within 400ms, took: ' + elapsed + 'ms');
      }
      assert.ok(rejected, 'executor must reject on timeout');
    } finally {
      https.request = origRequest;
      if (origEnv === undefined) { delete process.env.WUCE_TURN_TIMEOUT_MS; } else { process.env.WUCE_TURN_TIMEOUT_MS = origEnv; }
      delete require.cache[require.resolve(EXECUTOR_PATH)];
    }
  });
});

// Run all tests
(async function run() {
  console.log('wuce.26 -- Per-answer model response tests (model-first)\n');
  for (const fn of queue) { await fn(); }
  console.log('\n-----------------------------------------');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(function(f) { console.log('  x ' + f.name + '\n    ' + f.msg); });
    process.exit(1);
  } else { console.log('\nAll tests passed.'); process.exit(0); }
})();
