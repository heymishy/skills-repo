#!/usr/bin/env node
// check-sstr-s1-sse-retry-on-pre-first-chunk-failure.js -- sstr-s1: retry an
// LLM stream call once when it fails before any content has streamed,
// gated on _ttfbMs === null (the safety invariant proving zero client-visible
// or session-state side effects have occurred yet).
//
// Story:     artefacts/2026-08-31-sse-timeout-retry-resilience/stories/sstr-s1-retry-on-pre-first-chunk-failure.md
// Test plan: artefacts/2026-08-31-sse-timeout-retry-resilience/test-plans/sstr-s1-test-plan.md
//
// Follows the real-render harness pattern established by csd-s1/csd-s2's own
// tests: builds a REAL page via handleGetChatHtml(), extracts the actual
// generated client script, evaluates it in jsdom against a REAL
// handlePostTurnStreamHtml() call -- only the model call itself is stubbed.

'use strict';

process.env.NODE_ENV             = process.env.NODE_ENV || 'test';
process.env.SESSION_SECRET       = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID || 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'test-secret';
process.env.GITHUB_CALLBACK_URL  = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';
process.env.WUCE_REPOSITORIES    = process.env.WUCE_REPOSITORIES || 'test-owner/test-repo';

const assert = require('assert');
const { JSDOM } = require('jsdom');
const { Writable } = require('stream');
const pino = require('pino');
const { createLogger } = require('../src/web-ui/logger');

const routes = require('../src/web-ui/routes/skills');

// stis-s1 pattern: never let a real git commit fire from this test file.
routes.setSkillTurnGitCommitAdapter(function sstrS1NoOpGitCommitTestMode() { /* no-op */ });

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

function noopRes() {
  const chunks = [];
  return {
    _chunks: chunks,
    writeHead: function() {},
    write: function(d) { chunks.push(d); },
    end: function(d) { if (d) { chunks.push(d); } }
  };
}

function extractMainScript(html) {
  const marker = 'var form    = document.getElementById("chat-form");';
  const idx = html.indexOf(marker);
  assert.ok(idx !== -1, 'expected the chat-form client script to be present in the rendered HTML');
  const start = html.lastIndexOf('<script>', idx);
  const end   = html.indexOf('</script>', idx);
  assert.ok(start !== -1 && end !== -1, 'expected to find enclosing <script>...</script> tags');
  return html.slice(start + '<script>'.length, end);
}

let seq = 0;
function uniqueId(label) { seq++; return 'test-sstr-s1-' + label + '-' + seq + '-' + Math.random().toString(36).slice(2); }

async function buildPage(sessionId) {
  routes._setHtmlSession(sessionId, {
    skillName: 'ideate', sessionPath: '/tmp/t', systemPrompt: '# ideate',
    turns: [], artefactContent: null, artefactPath: null, done: false,
    journeyId: null, assumptionCardsEnabled: true, canvasBlocks: []
  });

  const res = noopRes();
  await routes.handleGetChatHtml(
    { session: { accessToken: 'tok', login: 'test-user' }, params: { name: 'ideate', id: sessionId } },
    res
  );
  const html = res._chunks.join('');
  const scriptSrc = extractMainScript(html);

  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/skills/ideate/sessions/' + sessionId + '/chat' });
  const win = dom.window;
  win.TextDecoder = TextDecoder;
  win.TextEncoder = TextEncoder;
  win.mermaid = { initialize: function() {}, run: function() { return Promise.resolve(); } };

  win.fetch = function(url, fopts) {
    const body = JSON.parse((fopts && fopts.body) || '{}');
    const streamRes = noopRes();
    return routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', login: 'test-user' }, params: { name: 'ideate', id: sessionId }, body: body },
      streamRes
    ).then(function() {
      const text  = streamRes._chunks.join('');
      const bytes = new TextEncoder().encode(text);
      let served  = false;
      return {
        ok: true,
        body: { getReader: function() {
          return { read: function() {
            if (served) { return Promise.resolve({ done: true, value: undefined }); }
            served = true;
            return Promise.resolve({ done: false, value: bytes });
          } };
        } },
        headers: { get: function() { return 'text/event-stream'; } }
      };
    });
  };

  dom.window.eval(scriptSrc);
  return { dom: dom };
}

function settle(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms || 500); });
}

async function sendAndCaptureStream(sessionId, dom) {
  // Directly capture the raw SSE text sent for this turn, bypassing the
  // client-script DOM rendering (which is exercised separately by other
  // test suites) -- this test cares about the raw stream contract and the
  // resulting session.turns state, not DOM rendering.
  const res = noopRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', login: 'test-user' }, params: { name: 'ideate', id: sessionId }, body: { answer: 'hello' } },
    res
  );
  return res._chunks.join('');
}

const queue = [];

queue.push(function runAc1() {
  console.log('\n-- AC1 -- preFirstChunkFailureIsRetriedOnceAndSucceedsSilently');
  return test('a pre-first-chunk failure on attempt 1 is retried once and succeeds silently on attempt 2', async function() {
    const sid = uniqueId('ac1');
    await buildPage(sid);
    let attempt = 0;
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      attempt++;
      if (attempt === 1) {
        return Promise.reject(new Error('Anthropic API stream timed out after 90000ms'));
      }
      onFirstChunk(0);
      onChunk('Hello');
      return Promise.resolve({ text: 'Hello', usage: { model: 'stub' } });
    });

    const streamText = await sendAndCaptureStream(sid);
    assert.strictEqual(attempt, 2, 'expected the adapter to have been called exactly twice');
    assert.ok(streamText.indexOf('Hello') !== -1, 'expected the successful retry\'s content to reach the client');
    assert.ok(streamText.indexOf('Model error') === -1, 'expected no error to be shown to the operator');

    const session = routes._getHtmlSession(sid);
    const lastTurn = session.turns[session.turns.length - 1];
    assert.strictEqual(lastTurn.role, 'assistant', 'expected the last turn to be a real assistant reply, not an error state');
    assert.strictEqual(lastTurn.content, 'Hello');
  });
});

queue.push(function runAc2() {
  console.log('\n-- AC2 -- retryAlsoFailsSurfacesExistingErrorNoThirdAttempt');
  return test('when the retry also fails, the existing generic error fires and no third attempt is made', async function() {
    const sid = uniqueId('ac2');
    await buildPage(sid);
    let attempt = 0;
    routes.setSkillTurnExecutorStreamAdapter(function() {
      attempt++;
      return Promise.reject(new Error('Anthropic API stream timed out after 90000ms'));
    });

    const streamText = await sendAndCaptureStream(sid);
    assert.strictEqual(attempt, 2, 'expected the adapter to have been called exactly twice, never a third time');
    assert.ok(streamText.indexOf('Model error') !== -1, 'expected the existing generic error message');
  });
});

queue.push(function runAc3() {
  console.log('\n-- AC3 -- failureAfterContentStreamedNeverRetries');
  return test('a failure after content has already streamed is never retried', async function() {
    const sid = uniqueId('ac3');
    await buildPage(sid);
    let attempt = 0;
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      attempt++;
      onFirstChunk(0);
      onChunk('Partial content');
      return Promise.reject(new Error('Anthropic API stream failed: socket hang up'));
    });

    const streamText = await sendAndCaptureStream(sid);
    assert.strictEqual(attempt, 1, 'expected exactly one attempt -- no retry once content has streamed');
    assert.ok(streamText.indexOf('Partial content') !== -1, 'expected the already-streamed partial content to still reach the client');
    assert.ok(streamText.indexOf('Model error') !== -1, 'expected the existing generic error message to still fire');
  });
});

queue.push(function runAc4() {
  console.log('\n-- AC4 -- danglingUserTurnPoppedOnUltimateFailure');
  return test('the dangling user turn is removed from session.turns on ultimate failure', async function() {
    const sid = uniqueId('ac4');
    await buildPage(sid);
    routes.setSkillTurnExecutorStreamAdapter(function() {
      return Promise.reject(new Error('Anthropic API stream timed out after 90000ms'));
    });

    const beforeSession = routes._getHtmlSession(sid);
    const turnsBefore = beforeSession.turns.length;

    await sendAndCaptureStream(sid);

    const afterSession = routes._getHtmlSession(sid);
    assert.strictEqual(afterSession.turns.length, turnsBefore, 'expected no net-new turn left dangling after ultimate failure (the pushed user turn was popped)');
  });
});

queue.push(function runAc5() {
  console.log('\n-- AC5 -- successfulRetryEmitsDistinguishableLogEvent');
  return test('a successful retry emits a distinguishable sse_retry_succeeded log event', async function() {
    const sid = uniqueId('ac5');
    await buildPage(sid);
    let attempt = 0;
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      attempt++;
      if (attempt === 1) {
        return Promise.reject(new Error('Anthropic API stream timed out after 90000ms'));
      }
      onFirstChunk(0);
      onChunk('Recovered');
      return Promise.resolve({ text: 'Recovered', usage: { model: 'stub' } });
    });

    let captured = '';
    const captureDest = new Writable({
      write: function(chunk, _enc, cb) { captured += chunk.toString(); cb(); }
    });
    const testLogger = pino({ level: 'info' }, captureDest);
    routes._setPinoLogger(testLogger);
    try {
      await sendAndCaptureStream(sid);
    } finally {
      routes._setPinoLogger(createLogger()); // restore the standard test-mode no-op logger
    }

    assert.ok(captured.indexOf('sse_retry_succeeded') !== -1, 'expected a sse_retry_succeeded log event to have been emitted');
  });
});

queue.push(function runNfr() {
  console.log('\n-- NFR -- noRegressionToNormalSuccessfulTurnTiming');
  return test('a normal successful turn (no failure at all) calls the adapter exactly once', async function() {
    const sid = uniqueId('nfr');
    await buildPage(sid);
    let attempt = 0;
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      attempt++;
      onFirstChunk(0);
      onChunk('Normal');
      return Promise.resolve({ text: 'Normal', usage: { model: 'stub' } });
    });

    await sendAndCaptureStream(sid);
    assert.strictEqual(attempt, 1, 'expected exactly one adapter invocation for a normal successful turn');
  });
});

(async function run() {
  console.log('sstr-s1 -- Retry an LLM stream call once when it fails before any content has streamed\n');
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
