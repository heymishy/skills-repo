'use strict';
/**
 * check-wuce26-per-answer-model-response.js
 *
 * TDD tests for wuce.26 — Per-answer model response in skill HTML flow.
 * All tests should FAIL before implementation begins.
 * All tests should PASS after full implementation (Tasks A, B, C).
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

// ---------------------------------------------------------------------------
// Setup helpers — isolate module cache between tests where needed
// ---------------------------------------------------------------------------

/**
 * Fresh-require a module, clearing it from the cache first so injectable
 * adapters start in their default state.
 */
function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

/**
 * Build a minimal session and return { sessionId, sessionStore (private), routes }.
 * We need access to the internal _sessionStore to assert state; we do this by
 * re-exporting it from the module under test (see routes/skills.js changes).
 */
function makeSession(routesModule, skillName, overrides) {
  const sid = 'test-session-' + Math.random().toString(36).slice(2);
  // Build a minimal session entry directly via registerHtmlSession then patch
  routesModule.registerHtmlSession(sid, '/tmp/s-' + sid, skillName || 'discovery');
  if (overrides) {
    const sess = routesModule._getHtmlSession(sid); // exposed for testing
    Object.assign(sess, overrides);
  }
  return sid;
}

// ---------------------------------------------------------------------------
// Require the modules under test
// ---------------------------------------------------------------------------

const ROUTES_PATH   = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const ADAPTERS_PATH = path.resolve(__dirname, '../src/web-ui/adapters/skills.js');
const EXECUTOR_PATH = path.resolve(__dirname, '../src/modules/skill-turn-executor.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const queue = [];

// ── T8 first (stub existence check — simplest) ──────────────────────────────

queue.push(function runT8() {
  console.log('\n── T8 — Default _skillTurnExecutor stub throws');
  return test('T8: default skillTurnExecutor stub throws "Adapter not wired: skillTurnExecutor"', function() {
    const adapter = freshRequire(ADAPTERS_PATH);
    assert.throws(
      function() { adapter.skillTurnExecutor('content', [], 'answer', 'token'); },
      function(err) {
        assert.ok(err instanceof Error, 'must be an Error instance');
        assert.ok(
          err.message.includes('Adapter not wired: skillTurnExecutor'),
          'Error message must contain "Adapter not wired: skillTurnExecutor", got: ' + err.message
        );
        return true;
      }
    );
  });
});

// ── T1 ──────────────────────────────────────────────────────────────────────

queue.push(function runT1() {
  console.log('\n── T1 — htmlRecordAnswer calls _skillTurnExecutor and appends to modelResponses');
  return test('T1: htmlRecordAnswer calls executor and appends response to modelResponses', async function() {
    const routes  = freshRequire(ROUTES_PATH);
    const adapters = freshRequire(ADAPTERS_PATH);

    // Wire a stub executor that resolves immediately
    adapters.setSkillTurnExecutor(async function() {
      return 'Great answer, here is context.';
    });
    routes.setSkillTurnExecutorAdapter(adapters.skillTurnExecutor);

    const sid = makeSession(routes, 'discovery', null);

    const result = await routes.htmlRecordAnswer('discovery', sid, 'My raw idea');

    const sess = routes._getHtmlSession(sid);

    assert.ok(Array.isArray(sess.answers),         'answers must be array');
    assert.strictEqual(sess.answers.length, 1,     'must have 1 answer');

    assert.ok(Array.isArray(sess.modelResponses),  'modelResponses must be array');
    assert.strictEqual(sess.modelResponses.length, 1, 'must have 1 model response');
    assert.strictEqual(sess.modelResponses[0], 'Great answer, here is context.', 'response text must match');

    assert.ok(result && result.nextUrl, 'must return { nextUrl }');
  });
});

// ── T2 ──────────────────────────────────────────────────────────────────────

queue.push(function runT2() {
  console.log('\n── T2 — Model response index aligns with answer index');
  return test('T2: modelResponses[2] set correctly when 2 prior exist', async function() {
    const routes  = freshRequire(ROUTES_PATH);
    const adapters = freshRequire(ADAPTERS_PATH);

    adapters.setSkillTurnExecutor(async function() { return 'Response 3'; });
    routes.setSkillTurnExecutorAdapter(adapters.skillTurnExecutor);

    const sid = makeSession(routes, 'discovery', {
      answers:        ['a1', 'a2'],
      modelResponses: ['r1', 'r2']
    });

    await routes.htmlRecordAnswer('discovery', sid, 'Third answer');

    const sess = routes._getHtmlSession(sid);
    assert.strictEqual(sess.modelResponses.length, 3, 'must have 3 model responses');
    assert.strictEqual(sess.modelResponses[2], 'Response 3', 'modelResponses[2] must be "Response 3"');
    assert.strictEqual(sess.modelResponses[0], 'r1', 'earlier indices must not be modified');
    assert.strictEqual(sess.modelResponses[1], 'r2', 'earlier indices must not be modified');
    assert.strictEqual(sess.answers.length, 3, 'must have 3 answers');
  });
});

// ── T3 ──────────────────────────────────────────────────────────────────────

queue.push(function runT3() {
  console.log('\n── T3 — Adapter throw does not prevent answer recording');
  return test('T3: executor throw sets modelResponses[i]=null, still returns nextUrl', async function() {
    const routes  = freshRequire(ROUTES_PATH);
    const adapters = freshRequire(ADAPTERS_PATH);

    adapters.setSkillTurnExecutor(async function() {
      throw new Error('API error');
    });
    routes.setSkillTurnExecutorAdapter(adapters.skillTurnExecutor);

    const sid = makeSession(routes, 'discovery', null);

    const result = await routes.htmlRecordAnswer('discovery', sid, 'My answer');

    const sess = routes._getHtmlSession(sid);
    assert.strictEqual(sess.answers.length, 1,       'answer must still be recorded');
    assert.strictEqual(sess.modelResponses.length, 1, 'modelResponses must have 1 entry');
    assert.strictEqual(sess.modelResponses[0], null,  'failed response must be null');
    assert.ok(result && result.nextUrl, 'must still return { nextUrl }');
  });
});

// ── T4 ──────────────────────────────────────────────────────────────────────

queue.push(function runT4() {
  console.log('\n── T4 — Adapter rejection (non-Error) handled gracefully');
  return test('T4: executor rejecting with string sets modelResponses[i]=null, no unhandled rejection', async function() {
    const routes  = freshRequire(ROUTES_PATH);
    const adapters = freshRequire(ADAPTERS_PATH);

    adapters.setSkillTurnExecutor(function() {
      return Promise.reject('timeout');
    });
    routes.setSkillTurnExecutorAdapter(adapters.skillTurnExecutor);

    const sid = makeSession(routes, 'discovery', null);

    const result = await routes.htmlRecordAnswer('discovery', sid, 'Answer');

    const sess = routes._getHtmlSession(sid);
    assert.strictEqual(sess.modelResponses[0], null, 'non-Error rejection must yield null');
    assert.ok(result && result.nextUrl, 'must return { nextUrl }');
  });
});

// ── T5 ──────────────────────────────────────────────────────────────────────

queue.push(function runT5() {
  console.log('\n── T5 — htmlGetNextQuestion includes modelResponse from previous turn');
  return test('T5: priorQA[0].modelResponse equals modelResponses[0]', function() {
    const routes = freshRequire(ROUTES_PATH);

    const sid = makeSession(routes, 'discovery', {
      answers:        ['First answer'],
      modelResponses: ['Model said hello']
    });

    const result = routes.htmlGetNextQuestion('discovery', sid);

    assert.ok(result, 'must return a result');
    assert.ok(Array.isArray(result.priorQA), 'priorQA must be an array');
    assert.strictEqual(result.priorQA.length, 1, 'must have 1 prior Q&A entry');
    assert.strictEqual(
      result.priorQA[0].modelResponse,
      'Model said hello',
      'priorQA[0].modelResponse must equal modelResponses[0]'
    );
    assert.strictEqual(result.questionIndex, 2, 'questionIndex must be 2');
  });
});

// ── T6 ──────────────────────────────────────────────────────────────────────

queue.push(function runT6() {
  console.log('\n── T6 — handleGetQuestionHtml renders model response block for Q>1');
  return test('T6: rendered HTML contains model response text in distinct block', async function() {
    const routes  = freshRequire(ROUTES_PATH);
    const adapters = freshRequire(ADAPTERS_PATH);

    // Wire _getNextQuestion to use htmlGetNextQuestion
    routes.setGetNextQuestion(async function(skillName, sessionId) {
      return routes.htmlGetNextQuestion(skillName, sessionId);
    });

    const sid = makeSession(routes, 'discovery', {
      answers:        ['First answer'],
      modelResponses: ['Here is the model insight.']
    });

    let capturedHtml = '';
    const mockRes = {
      writeHead: function() {},
      end: function(body) { capturedHtml = body || ''; }
    };
    const mockReq = {
      session: { accessToken: 'tok', login: 'user', userId: 'u1' },
      params:  { name: 'discovery', id: sid }
    };

    await routes.handleGetQuestionHtml(mockReq, mockRes);

    assert.ok(
      capturedHtml.includes('Here is the model insight.'),
      'rendered HTML must include model response text'
    );
    // Must be in a distinct element from prior-qa section
    assert.ok(
      capturedHtml.includes('model-response') || capturedHtml.includes('model_response'),
      'model response must be in an element with class "model-response" (or model_response)'
    );
  });
});

// ── T7 ──────────────────────────────────────────────────────────────────────

queue.push(function runT7() {
  console.log('\n── T7 — handleGetQuestionHtml renders no model-response block for Q1');
  return test('T7: Q1 rendered HTML contains no model-response section', async function() {
    const routes  = freshRequire(ROUTES_PATH);

    routes.setGetNextQuestion(async function(skillName, sessionId) {
      return routes.htmlGetNextQuestion(skillName, sessionId);
    });

    const sid = makeSession(routes, 'discovery', null);
    // Fresh session — 0 answers, modelResponses = []

    let capturedHtml = '';
    const mockRes = {
      writeHead: function() {},
      end: function(body) { capturedHtml = body || ''; }
    };
    const mockReq = {
      session: { accessToken: 'tok', login: 'user', userId: 'u1' },
      params:  { name: 'discovery', id: sid }
    };

    await routes.handleGetQuestionHtml(mockReq, mockRes);

    assert.ok(
      !capturedHtml.includes('model-response') && !capturedHtml.includes('model_response'),
      'Q1 must not render any model-response block'
    );
  });
});

// ── T9 ──────────────────────────────────────────────────────────────────────

queue.push(function runT9() {
  console.log('\n── T9 — skill-turn-executor sends correct request to Copilot API');
  return test('T9: executor sends POST to api.githubcopilot.com with correct headers/body', async function() {
    // Require the module — will fail if not yet created
    const executor = require(EXECUTOR_PATH);

    let capturedOptions = null;
    let capturedBody    = null;

    // Stub https module by monkey-patching require cache
    const https = require('https');
    const origRequest = https.request;
    https.request = function(options, callback) {
      capturedOptions = options;
      // Simulate a valid response
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
        on: function(ev, fn) {
          if (ev === 'error') { /* ignore for happy path */ }
          return req;
        },
        setTimeout: function() { return req; }
      };
      return req;
    };

    try {
      const skillContent = '# Discovery SKILL';
      const priorQA      = [{ question: 'What is the problem?', answer: 'It is slow', modelResponse: null }];
      const token        = 'fake-token';

      const result = await executor.skillTurnExecutor(skillContent, priorQA, 'What is the solution?', token);

      // Verify request options
      assert.ok(capturedOptions, 'https.request must have been called');
      assert.strictEqual(capturedOptions.hostname || (capturedOptions.host && capturedOptions.host.replace(':443', '')), 'api.githubcopilot.com', 'host must be api.githubcopilot.com');
      assert.ok((capturedOptions.path || '').includes('/chat/completions'), 'path must include /chat/completions');
      const authHeader = (capturedOptions.headers || {})['Authorization'] || (capturedOptions.headers || {})['authorization'];
      assert.strictEqual(authHeader, 'Bearer fake-token', 'Authorization header must be "Bearer fake-token"');
      const ua = (capturedOptions.headers || {})['User-Agent'] || (capturedOptions.headers || {})['user-agent'];
      assert.ok(ua && ua.length > 0, 'User-Agent header must be present');

      // Verify request body
      assert.ok(capturedBody, 'request body must be captured');
      assert.ok(Array.isArray(capturedBody.messages), 'messages must be array');
      assert.strictEqual(capturedBody.messages[0].role, 'system', 'first message must be system role');
      assert.strictEqual(capturedBody.messages[0].content, skillContent, 'system message must contain skillContent');
      // priorQA generates 2 messages (user + assistant)
      assert.strictEqual(capturedBody.messages[1].role, 'user', 'second message must be user (prior Q)');
      assert.strictEqual(capturedBody.messages[2].role, 'assistant', 'third message must be assistant (prior model response)');
      // last message is current answer
      const last = capturedBody.messages[capturedBody.messages.length - 1];
      assert.strictEqual(last.role, 'user', 'last message must be user role');
      assert.strictEqual(last.content, 'What is the solution?', 'last message content must be current answer');

      assert.ok(capturedBody.max_tokens > 0, 'max_tokens must be positive');

      // Verify return value
      assert.strictEqual(result, 'Good insight.', 'executor must return parsed response content');
    } finally {
      https.request = origRequest;
    }
  });
});

// ── T10 ─────────────────────────────────────────────────────────────────────

queue.push(function runT10() {
  console.log('\n── T10 — executor returns parsed response content');
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
    } finally {
      https.request = origRequest;
    }
  });
});

// ── T11 ─────────────────────────────────────────────────────────────────────

queue.push(function runT11() {
  console.log('\n── T11 — htmlGetPreview includes model responses in artefact content');
  return test('T11: artefactContent includes both model responses after corresponding answers', function() {
    const routes = freshRequire(ROUTES_PATH);

    const sid = makeSession(routes, 'discovery', {
      answers:        ['Answer 1', 'Answer 2'],
      modelResponses: ['Model response 1', 'Model response 2']
    });

    const preview = routes.htmlGetPreview('discovery', sid);

    assert.ok(preview.artefactContent.includes('Model response 1'), 'must include "Model response 1"');
    assert.ok(preview.artefactContent.includes('Model response 2'), 'must include "Model response 2"');

    // Each model response must appear AFTER its corresponding answer
    const idx1a = preview.artefactContent.indexOf('Answer 1');
    const idx1m = preview.artefactContent.indexOf('Model response 1');
    const idx2a = preview.artefactContent.indexOf('Answer 2');
    const idx2m = preview.artefactContent.indexOf('Model response 2');

    assert.ok(idx1a < idx1m, '"Model response 1" must appear after "Answer 1"');
    assert.ok(idx2a < idx2m, '"Model response 2" must appear after "Answer 2"');
  });
});

// ── T12 ─────────────────────────────────────────────────────────────────────

queue.push(function runT12() {
  console.log('\n── T12 — htmlGetPreview handles null model responses gracefully');
  return test('T12: null model response is omitted; non-null response still included', function() {
    const routes = freshRequire(ROUTES_PATH);

    const sid = makeSession(routes, 'discovery', {
      answers:        ['Answer 1', 'Answer 2'],
      modelResponses: ['Model response 1', null]
    });

    const preview = routes.htmlGetPreview('discovery', sid);

    assert.ok(preview.artefactContent.includes('Model response 1'), 'must include non-null response');
    assert.ok(!preview.artefactContent.includes('null'), 'must not render the string "null"');
    assert.ok(!preview.artefactContent.includes('undefined'), 'must not render "undefined"');
  });
});

// ── T-NFR1 ──────────────────────────────────────────────────────────────────

queue.push(function runNFR1() {
  console.log('\n── T-NFR1 — Token not logged on executor error');
  return test('T-NFR1: token "secret-token-abc" does not appear in any log output on error', async function() {
    const executor = require(EXECUTOR_PATH);

    const https = require('https');
    const origRequest = https.request;
    const origStdout  = process.stdout.write.bind(process.stdout);
    const origStderr  = process.stderr.write.bind(process.stderr);

    const logOutput = [];
    process.stdout.write = function(data) { logOutput.push(String(data)); return true; };
    process.stderr.write = function(data) { logOutput.push(String(data)); return true; };

    https.request = function(options, callback) {
      const req = {
        write: function() {},
        end:   function() {},
        on:    function(ev, fn) { if (ev === 'error') fn(new Error('connection refused')); return req; },
        setTimeout: function() { return req; }
      };
      return req;
    };

    try {
      await executor.skillTurnExecutor('skill', [], 'answer', 'secret-token-abc');
    } catch (_) {
      // expected to throw
    } finally {
      process.stdout.write = origStdout;
      process.stderr.write = origStderr;
      https.request = origRequest;
    }

    const combined = logOutput.join('');
    assert.ok(
      !combined.includes('secret-token-abc'),
      'Token must not appear in any log output. Found in: ' + combined.slice(0, 200)
    );
  });
});

// ── T-NFR2 ──────────────────────────────────────────────────────────────────

queue.push(function runNFR2() {
  console.log('\n── T-NFR2 — Executor respects 30-second timeout');
  return test('T-NFR2: executor rejects within 200ms when request never completes (timeout=100ms)', async function() {
    // Set a short timeout via env var for this test
    const origEnv = process.env.WUCE_TURN_TIMEOUT_MS;
    process.env.WUCE_TURN_TIMEOUT_MS = '100';

    // Fresh require to pick up the env var if module caches it
    const resolved = require.resolve(EXECUTOR_PATH);
    delete require.cache[resolved];
    const executor = require(resolved);

    const https = require('https');
    const origRequest = https.request;

    https.request = function(options, callback) {
      let _timeoutFn = null;
      let _errorFn   = null;
      const req = {
        write: function() {},
        end:   function() { /* never resolves */ },
        on:    function(ev, fn) {
          if (ev === 'error') { _errorFn = fn; }
          return req;
        },
        setTimeout: function(ms, fn) { _timeoutFn = fn; return req; },
        destroy: function(err) {
          // Simulate Node's destroy: fires the 'error' event (not the timeout fn again)
          if (_errorFn) { _errorFn(err || new Error('destroyed')); }
        }
      };
      // Simulate timeout firing after a short delay
      setTimeout(function() { if (_timeoutFn) { _timeoutFn(); } }, 50);
      return req;
    };

    try {
      const start = Date.now();
      let rejected = false;
      try {
        await executor.skillTurnExecutor('skill', [], 'answer', 'tok');
      } catch (err) {
        rejected = true;
        const elapsed = Date.now() - start;
        assert.ok(elapsed < 400, 'must reject within 400ms, took: ' + elapsed + 'ms');
      }
      assert.ok(rejected, 'executor must reject on timeout');
    } finally {
      https.request = origRequest;
      if (origEnv === undefined) {
        delete process.env.WUCE_TURN_TIMEOUT_MS;
      } else {
        process.env.WUCE_TURN_TIMEOUT_MS = origEnv;
      }
      // Clear module cache so subsequent tests use default timeout
      delete require.cache[require.resolve(EXECUTOR_PATH)];
    }
  });
});

// ---------------------------------------------------------------------------
// Run all tests sequentially
// ---------------------------------------------------------------------------

(async function run() {
  console.log('wuce.26 — Per-answer model response tests\n');

  for (const fn of queue) {
    await fn();
  }

  console.log('\n─────────────────────────────────────────');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(function(f) {
      console.log('  ✗ ' + f.name);
      console.log('    ' + f.msg);
    });
    process.exit(1);
  } else {
    console.log('\nAll tests passed.');
    process.exit(0);
  }
})();
