#!/usr/bin/env node
// check-ssdo-s1-sse-client-disconnect-logging.js -- ssdo-s1: log a premature
// SSE client disconnect (res 'close' fired before the handler itself ever
// called res.end() for that turn), distinguishable from a normal completion.
//
// Story:     artefacts/2026-08-31-sse-disconnect-observability/stories/ssdo-s1-log-premature-sse-disconnect.md
// Test plan: artefacts/2026-08-31-sse-disconnect-observability/test-plans/ssdo-s1-test-plan.md

'use strict';

process.env.NODE_ENV             = process.env.NODE_ENV || 'test';
process.env.SESSION_SECRET       = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID || 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'test-secret';
process.env.GITHUB_CALLBACK_URL  = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';
process.env.WUCE_REPOSITORIES    = process.env.WUCE_REPOSITORIES || 'test-owner/test-repo';

const assert = require('assert');
const { Writable } = require('stream');
const pino = require('pino');
const { createLogger } = require('../src/web-ui/logger');

const routes = require('../src/web-ui/routes/skills');

routes.setSkillTurnGitCommitAdapter(function ssdoS1NoOpGitCommitTestMode() { /* no-op */ });

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  PASS: ' + name); })
    .catch(function(err) {
      failed++;
      const msg = err && err.message ? err.message : String(err);
      failures.push({ name: name, msg: msg });
      console.log('  FAIL: ' + name + '\n       ' + msg);
    });
}

// A mock http.ServerResponse-like object that tracks writableEnded (set true
// only once .end() is called, matching Node's own semantics) and supports
// .on('close', ...) registration plus a manual _emitClose() trigger, so a
// test can simulate the connection closing at a controlled point in time.
function makeStreamRes() {
  const chunks = [];
  const closeHandlers = [];
  const res = {
    _chunks: chunks,
    writableEnded: false,
    writeHead: function() {},
    write: function(d) { chunks.push(d); },
    end: function(d) { if (d) { chunks.push(d); } res.writableEnded = true; },
    on: function(event, handler) { if (event === 'close') closeHandlers.push(handler); },
    _emitClose: function() { closeHandlers.forEach(function(h) { h(); }); }
  };
  return res;
}

let seq = 0;
function uniqueId(label) { seq++; return 'test-ssdo-s1-' + label + '-' + seq + '-' + Math.random().toString(36).slice(2); }

function setupSession(sessionId) {
  routes._setHtmlSession(sessionId, {
    skillName: 'ideate', sessionPath: '/tmp/t', systemPrompt: '# ideate',
    turns: [], artefactContent: null, artefactPath: null, done: false,
    journeyId: null, assumptionCardsEnabled: true, canvasBlocks: []
  });
}

const queue = [];

queue.push(function runAc1() {
  console.log('\n-- AC1 -- normalCompletionEmitsNoDisconnectEvent');
  return test('a normal turn completion followed by close emits no sse_client_disconnect event', async function() {
    const sid = uniqueId('ac1');
    setupSession(sid);
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk('Normal content');
      return Promise.resolve({ text: 'Normal content', usage: { model: 'stub' } });
    });

    const res = makeStreamRes();
    let captured = '';
    const captureDest = new Writable({ write: function(chunk, _enc, cb) { captured += chunk.toString(); cb(); } });
    const testLogger = pino({ level: 'info' }, captureDest);
    routes._setPinoLogger(testLogger);
    try {
      await routes.handlePostTurnStreamHtml(
        { session: { accessToken: 'tok', login: 'test-user' }, params: { name: 'ideate', id: sid }, body: { answer: 'hello' } },
        res
      );
      assert.strictEqual(res.writableEnded, true, 'expected the handler to have called res.end() by the time it resolves');
      res._emitClose();
    } finally {
      routes._setPinoLogger(createLogger());
    }

    assert.ok(captured.indexOf('sse_client_disconnect') === -1, 'expected no sse_client_disconnect event after a normal completion');
  });
});

queue.push(function runAc2() {
  console.log('\n-- AC2 -- prematureDisconnectEmitsClientDisconnectEvent');
  return test('a close event firing before res.end() has been called emits sse_client_disconnect', async function() {
    const sid = uniqueId('ac2');
    setupSession(sid);
    routes.setSkillTurnExecutorStreamAdapter(function() {
      return new Promise(function() { /* never resolves -- simulates a still-in-flight LLM call */ });
    });

    const res = makeStreamRes();
    let captured = '';
    const captureDest = new Writable({ write: function(chunk, _enc, cb) { captured += chunk.toString(); cb(); } });
    const testLogger = pino({ level: 'info' }, captureDest);
    routes._setPinoLogger(testLogger);
    try {
      // Fire-and-forget: the handler is stuck awaiting the never-resolving
      // adapter, well past res.writeHead()/the close-listener attachment.
      routes.handlePostTurnStreamHtml(
        { session: { accessToken: 'tok', login: 'test-user' }, params: { name: 'ideate', id: sid }, body: { answer: 'hello' } },
        res
      );
      // Give the async handler a microtask/tick to reach res.writeHead() and
      // attach the close listener before we simulate the disconnect.
      await new Promise(function(resolve) { setTimeout(resolve, 50); });

      assert.strictEqual(res.writableEnded, false, 'expected the handler to still be mid-flight (res.end() not yet called)');
      res._emitClose();
    } finally {
      routes._setPinoLogger(createLogger());
    }

    assert.ok(captured.indexOf('sse_client_disconnect') !== -1, 'expected an sse_client_disconnect event when close fires before res.end()');
  });
});

queue.push(function runAc3() {
  console.log('\n-- AC3 -- noRegressionToExistingErrorPathBehaviour');
  return test('the existing error path (retry exhausted) still behaves identically -- no new event on that path either', async function() {
    const sid = uniqueId('ac3');
    setupSession(sid);
    routes.setSkillTurnExecutorStreamAdapter(function() {
      return Promise.reject(new Error('Anthropic API stream timed out after 90000ms'));
    });

    const res = makeStreamRes();
    let captured = '';
    const captureDest = new Writable({ write: function(chunk, _enc, cb) { captured += chunk.toString(); cb(); } });
    const testLogger = pino({ level: 'info' }, captureDest);
    routes._setPinoLogger(testLogger);
    try {
      await routes.handlePostTurnStreamHtml(
        { session: { accessToken: 'tok', login: 'test-user' }, params: { name: 'ideate', id: sid }, body: { answer: 'hello' } },
        res
      );
      assert.strictEqual(res.writableEnded, true, 'expected the existing error path to still call res.end()');
      res._emitClose();
    } finally {
      routes._setPinoLogger(createLogger());
    }

    assert.ok(captured.indexOf('sse_error') !== -1, 'expected the existing sse_error event to still fire (no regression)');
    assert.ok(captured.indexOf('sse_client_disconnect') === -1, 'expected no sse_client_disconnect event on a normal (already-logged) error completion');
  });
});

(async function run() {
  console.log('ssdo-s1 -- Log a premature SSE client disconnect, distinguishable from a normal completion\n');
  for (const fn of queue) { await fn(); }
  console.log('\n-----------------------------------------');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(function(f) { console.log('  x ' + f.name + '\n    ' + f.msg); });
    process.exit(1);
  } else {
    console.log('\nAll tests passed.');
    process.exit(0);
  }
})();
