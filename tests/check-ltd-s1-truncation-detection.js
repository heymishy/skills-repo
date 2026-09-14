#!/usr/bin/env node
// check-ltd-s1-truncation-detection.js -- ltd-s1: detect max_tokens truncation
// explicitly (via the Anthropic API's own stop_reason) instead of relying
// solely on the client's "no literal ?" continuation heuristic, and raise
// DEFAULT_MAX_TOKENS.
//
// Story:     artefacts/2026-09-14-llm-truncation-detection/stories/ltd-s1-detect-and-surface-truncation.md
// Test plan: artefacts/2026-09-14-llm-truncation-detection/test-plans/ltd-s1-test-plan.md

'use strict';

process.env.NODE_ENV             = process.env.NODE_ENV || 'test';
process.env.SESSION_SECRET       = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID || 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'test-secret';
process.env.GITHUB_CALLBACK_URL  = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';
process.env.WUCE_REPOSITORIES    = process.env.WUCE_REPOSITORIES || 'test-owner/test-repo';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');
const { Writable } = require('stream');
const pino   = require('pino');

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

const EXECUTOR_PATH = require.resolve('../src/modules/skill-turn-executor');
const ROUTES_PATH   = require.resolve('../src/web-ui/routes/skills');
const POSTHOG_PATH  = require.resolve('../src/web-ui/modules/posthog-server');

function freshRequire(modulePath) {
  delete require.cache[modulePath];
  return require(modulePath);
}

async function withEnv(vars, fn) {
  const prior = {};
  Object.keys(vars).forEach(function(k) { prior[k] = process.env[k]; process.env[k] = vars[k]; });
  try {
    return await fn();
  } finally {
    Object.keys(vars).forEach(function(k) {
      if (prior[k] === undefined) { delete process.env[k]; } else { process.env[k] = prior[k]; }
    });
  }
}

// -- executor-layer https.request mocks (check-s6.1 precedent) --------------

function mockAnthropicNonStreaming(captured, opts) {
  opts = opts || {};
  const https = require('https');
  const orig = https.request;
  https.request = function(options, callback) {
    captured.options = options;
    const EventEmitter = require('events');
    const resEmitter = new EventEmitter();
    resEmitter.statusCode = 200;
    if (callback) callback(resEmitter);
    const req = {
      write: function(data) { captured.body = JSON.parse(data); },
      end: function() {
        resEmitter.emit('data', JSON.stringify({
          content: [{ type: 'text', text: 'Model reply.' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          stop_reason: opts.stopReason !== undefined ? opts.stopReason : 'end_turn'
        }));
        resEmitter.emit('end');
      },
      on: function() { return req; },
      setTimeout: function() { return req; }
    };
    return req;
  };
  return orig;
}

function mockAnthropicStreaming(captured, opts) {
  opts = opts || {};
  const https = require('https');
  const orig = https.request;
  https.request = function(options, callback) {
    captured.options = options;
    const EventEmitter = require('events');
    const resEmitter = new EventEmitter();
    resEmitter.statusCode = 200;
    if (callback) callback(resEmitter);
    const req = {
      write: function(data) { captured.body = JSON.parse(data); },
      end: function() {
        resEmitter.emit('data', 'data: ' + JSON.stringify({
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'chunk' }
        }) + '\n\n');
        resEmitter.emit('data', 'data: ' + JSON.stringify({
          type: 'message_delta',
          delta: { stop_reason: opts.stopReason !== undefined ? opts.stopReason : 'end_turn' },
          usage: { output_tokens: 5 }
        }) + '\n\n');
        resEmitter.emit('end');
      },
      on: function() { return req; },
      setTimeout: function() { return req; }
    };
    return req;
  };
  return orig;
}

// -- route-layer mocks (check-pla-s2 / check-ssdo-s1 precedent) -------------

let _phCalls;
const mockPosthog = {
  PRIVACY_MODE: false,
  capture:       function(id, event, props, groups) { _phCalls.push({ id: id, event: event, props: props || {}, groups: groups }); },
  identify:      function() {},
  groupIdentify: function() {}
};

function installPosthogMock() {
  _phCalls = [];
  require.cache[POSTHOG_PATH] = { id: POSTHOG_PATH, filename: POSTHOG_PATH, loaded: true, exports: mockPosthog };
}

function makeStreamMock(usage, text) {
  return function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
    return new Promise(function(resolve) {
      if (typeof onFirstChunk === 'function') onFirstChunk(50);
      if (typeof onChunk === 'function') onChunk(text || 'response text, no question mark here.');
      resolve({ text: text || 'response text, no question mark here.', usage: usage });
    });
  };
}

function makeNonStreamMock(usage, text) {
  return function() {
    return Promise.resolve({ text: text || 'response text.', usage: usage });
  };
}

function makeSkillReq(sessionId, skillName) {
  return {
    params:  { name: skillName || 'discovery', id: sessionId },
    session: { login: 'alice', tenantId: 'acme', role: 'user', accessToken: 'tok', journeyId: 'journey-' + sessionId },
    body:    { answer: 'my answer' }
  };
}

function makeSseRes() {
  const writes = [];
  return { writeHead: function() {}, write: function(d) { writes.push(d); }, end: function() {}, _writes: writes };
}

function lastDoneEvent(res) {
  const events = res._writes
    .filter(function(w) { return w.indexOf('data: ') === 0; })
    .map(function(w) { try { return JSON.parse(w.slice(6).trim()); } catch (_) { return null; } })
    .filter(function(e) { return e && e.done !== undefined; });
  return events[events.length - 1];
}

let seq = 0;
function uniqueId(label) { seq++; return 'test-ltd-s1-' + label + '-' + seq + '-' + Math.random().toString(36).slice(2); }

const queue = [];

// -- AC1 -------------------------------------------------------------------
queue.push(function() {
  console.log('\n-- AC1 -- _callAnthropic (non-streaming) threads stop_reason through usage');
  return test('T1: stop_reason "max_tokens" on the raw response resolves in usage.stop_reason', function() {
    return withEnv({ ANTHROPIC_API_KEY: 'fake-key' }, async function() {
      const executor = freshRequire(EXECUTOR_PATH);
      const captured = {};
      const orig = mockAnthropicNonStreaming(captured, { stopReason: 'max_tokens' });
      try {
        const result = await executor.skillTurnExecutor('sys', [], 'hi', 'tok');
        assert.strictEqual(result.usage.stop_reason, 'max_tokens');
      } finally { require('https').request = orig; }
    });
  }).then(function() {
    return test('T2: stop_reason "end_turn" on the raw response resolves in usage.stop_reason (not dropped)', function() {
      return withEnv({ ANTHROPIC_API_KEY: 'fake-key' }, async function() {
        const executor = freshRequire(EXECUTOR_PATH);
        const captured = {};
        const orig = mockAnthropicNonStreaming(captured, { stopReason: 'end_turn' });
        try {
          const result = await executor.skillTurnExecutor('sys', [], 'hi', 'tok');
          assert.strictEqual(result.usage.stop_reason, 'end_turn');
        } finally { require('https').request = orig; }
      });
    });
  });
});

// -- AC2 -------------------------------------------------------------------
queue.push(function() {
  console.log('\n-- AC2 -- _callAnthropicStream threads stop_reason from message_delta');
  return test('T3: message_delta.delta.stop_reason "max_tokens" resolves in usage.stop_reason', function() {
    return withEnv({ ANTHROPIC_API_KEY: 'fake-key' }, async function() {
      const executor = freshRequire(EXECUTOR_PATH);
      const captured = {};
      const orig = mockAnthropicStreaming(captured, { stopReason: 'max_tokens' });
      try {
        const result = await executor.skillTurnExecutorStream('sys', [], 'hi', 'tok', function() {}, function() {}, function() {});
        assert.strictEqual(result.usage.stop_reason, 'max_tokens');
      } finally { require('https').request = orig; }
    });
  }).then(function() {
    return test('T4: message_delta.delta.stop_reason "end_turn" resolves in usage.stop_reason', function() {
      return withEnv({ ANTHROPIC_API_KEY: 'fake-key' }, async function() {
        const executor = freshRequire(EXECUTOR_PATH);
        const captured = {};
        const orig = mockAnthropicStreaming(captured, { stopReason: 'end_turn' });
        try {
          const result = await executor.skillTurnExecutorStream('sys', [], 'hi', 'tok', function() {}, function() {}, function() {});
          assert.strictEqual(result.usage.stop_reason, 'end_turn');
        } finally { require('https').request = orig; }
      });
    });
  });
});

// -- AC3 -------------------------------------------------------------------
queue.push(function() {
  console.log('\n-- AC3 -- llm_complete log entry includes stop_reason');
  return test('T5: captured pino log line for a truncated turn includes "stop_reason":"max_tokens"', function() {
    return withEnv({ ANTHROPIC_API_KEY: 'fake-key' }, async function() {
      const routes = freshRequire(ROUTES_PATH);
      routes.setSkillTurnGitCommitAdapter(function() {});
      const sid = uniqueId('ac3');
      routes._setHtmlSession(sid, {
        skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# sys',
        turns: [], artefactContent: null, artefactPath: null, done: false
      });
      routes.setSkillTurnExecutorStreamAdapter(makeStreamMock({
        model: 'claude-haiku-4-5', input_tokens: 10, output_tokens: 20, stop_reason: 'max_tokens'
      }));

      let captured = '';
      const captureDest = new Writable({ write: function(chunk, _enc, cb) { captured += chunk.toString(); cb(); } });
      const testLogger = pino({ level: 'info' }, captureDest);
      routes._setPinoLogger(testLogger);
      try {
        await routes.handlePostTurnStreamHtml(makeSkillReq(sid, 'discovery'), makeSseRes());
      } finally {
        const { createLogger } = require('../src/web-ui/logger');
        routes._setPinoLogger(createLogger());
      }

      const lines = captured.trim().split('\n').map(function(l) { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
      const completeLine = lines.find(function(l) { return l.event === 'llm_complete'; });
      assert.ok(completeLine, 'expected an llm_complete log line');
      assert.strictEqual(completeLine.stop_reason, 'max_tokens');
    });
  });
});

// -- AC4 -------------------------------------------------------------------
queue.push(function() {
  console.log('\n-- AC4 -- $ai_generation PostHog capture includes stop_reason / $ai_is_error / $ai_error');
  return test('T6: streaming capture, stop_reason max_tokens -> stop_reason + $ai_is_error + $ai_error present', function() {
    return withEnv({ ANTHROPIC_API_KEY: 'fake-key' }, async function() {
      installPosthogMock();
      const routes = freshRequire(ROUTES_PATH);
      routes.setSkillTurnGitCommitAdapter(function() {});
      const sid = uniqueId('ac4-stream-trunc');
      routes._setHtmlSession(sid, {
        skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# sys',
        turns: [], artefactContent: null, artefactPath: null, done: false
      });
      routes.setSkillTurnExecutorStreamAdapter(makeStreamMock({
        model: 'claude-haiku-4-5', input_tokens: 10, output_tokens: 20, stop_reason: 'max_tokens'
      }));
      await routes.handlePostTurnStreamHtml(makeSkillReq(sid, 'discovery'), makeSseRes());

      const gen = _phCalls.find(function(c) { return c.event === '$ai_generation'; });
      assert.ok(gen, 'expected an $ai_generation capture');
      assert.strictEqual(gen.props.stop_reason, 'max_tokens');
      assert.strictEqual(gen.props.$ai_is_error, true);
      assert.strictEqual(gen.props.$ai_error, 'max_tokens - response truncated');
    });
  }).then(function() {
    return test('T7: streaming capture, stop_reason end_turn -> no $ai_is_error/$ai_error keys', function() {
      return withEnv({ ANTHROPIC_API_KEY: 'fake-key' }, async function() {
        installPosthogMock();
        const routes = freshRequire(ROUTES_PATH);
        routes.setSkillTurnGitCommitAdapter(function() {});
        const sid = uniqueId('ac4-stream-ok');
        routes._setHtmlSession(sid, {
          skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# sys',
          turns: [], artefactContent: null, artefactPath: null, done: false
        });
        routes.setSkillTurnExecutorStreamAdapter(makeStreamMock({
          model: 'claude-haiku-4-5', input_tokens: 10, output_tokens: 20, stop_reason: 'end_turn'
        }, 'Is this a real question?'));
        await routes.handlePostTurnStreamHtml(makeSkillReq(sid, 'discovery'), makeSseRes());

        const gen = _phCalls.find(function(c) { return c.event === '$ai_generation'; });
        assert.ok(gen, 'expected an $ai_generation capture');
        assert.strictEqual(gen.props.stop_reason, 'end_turn');
        assert.ok(!('$ai_is_error' in gen.props), 'expected no $ai_is_error key for a normal completion');
        assert.ok(!('$ai_error' in gen.props), 'expected no $ai_error key for a normal completion');
      });
    });
  }).then(function() {
    return test('T8: non-streaming capture, stop_reason max_tokens -> stop_reason + $ai_is_error + $ai_error present', function() {
      return withEnv({ ANTHROPIC_API_KEY: 'fake-key' }, async function() {
        installPosthogMock();
        const routes = freshRequire(ROUTES_PATH);
        routes.setSkillTurnGitCommitAdapter(function() {});
        const sid = uniqueId('ac4-nonstream-trunc');
        routes._setHtmlSession(sid, {
          skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# sys',
          turns: [], artefactContent: null, artefactPath: null, done: false
        });
        routes.setSkillTurnExecutorAdapter(makeNonStreamMock({
          model: 'claude-haiku-4-5', input_tokens: 10, output_tokens: 20, stop_reason: 'max_tokens'
        }));
        const res = { writeHead: function() {}, write: function() {}, end: function() {} };
        await routes.handlePostTurnHtml(makeSkillReq(sid, 'discovery'), res);

        const gen = _phCalls.find(function(c) { return c.event === '$ai_generation'; });
        assert.ok(gen, 'expected an $ai_generation capture');
        assert.strictEqual(gen.props.stop_reason, 'max_tokens');
        assert.strictEqual(gen.props.$ai_is_error, true);
        assert.strictEqual(gen.props.$ai_error, 'max_tokens - response truncated');
      });
    });
  });
});

// -- AC5 -------------------------------------------------------------------
queue.push(function() {
  console.log('\n-- AC5 -- final SSE done event carries truncated flag from real stop_reason');
  return test('T9: stop_reason max_tokens -> final done event has truncated: true', function() {
    return withEnv({ ANTHROPIC_API_KEY: 'fake-key' }, async function() {
      installPosthogMock();
      const routes = freshRequire(ROUTES_PATH);
      routes.setSkillTurnGitCommitAdapter(function() {});
      const sid = uniqueId('ac5-trunc');
      routes._setHtmlSession(sid, {
        skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# sys',
        turns: [], artefactContent: null, artefactPath: null, done: false
      });
      routes.setSkillTurnExecutorStreamAdapter(makeStreamMock({
        model: 'claude-haiku-4-5', input_tokens: 10, output_tokens: 20, stop_reason: 'max_tokens'
      }, 'This text trails off mid-sentence and hap'));
      const res = makeSseRes();
      await routes.handlePostTurnStreamHtml(makeSkillReq(sid, 'discovery'), res);

      const doneEvt = lastDoneEvent(res);
      assert.ok(doneEvt, 'expected a done event in the SSE stream');
      assert.strictEqual(doneEvt.truncated, true);
    });
  }).then(function() {
    return test('T10: stop_reason end_turn -> final done event has truncated: false', function() {
      return withEnv({ ANTHROPIC_API_KEY: 'fake-key' }, async function() {
        installPosthogMock();
        const routes = freshRequire(ROUTES_PATH);
        routes.setSkillTurnGitCommitAdapter(function() {});
        const sid = uniqueId('ac5-ok');
        routes._setHtmlSession(sid, {
          skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# sys',
          turns: [], artefactContent: null, artefactPath: null, done: false
        });
        routes.setSkillTurnExecutorStreamAdapter(makeStreamMock({
          model: 'claude-haiku-4-5', input_tokens: 10, output_tokens: 20, stop_reason: 'end_turn'
        }, 'Here is a genuine question for you?'));
        const res = makeSseRes();
        await routes.handlePostTurnStreamHtml(makeSkillReq(sid, 'discovery'), res);

        const doneEvt = lastDoneEvent(res);
        assert.ok(doneEvt, 'expected a done event in the SSE stream');
        assert.strictEqual(doneEvt.truncated, false);
      });
    });
  });
});

// -- AC6 (source assertion, lasr-s1 precedent) ------------------------------
queue.push(function() {
  console.log('\n-- AC6 -- client-side auto-continue condition includes evt.truncated');
  return test('T11: the client JS auto-continue condition ORs in evt.truncated alongside the "no ?" heuristic', function() {
    const src = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/routes/skills.js'), 'utf8');
    const idx = src.indexOf('IS_IDEATE && streamText && (evt.truncated || streamText.indexOf("?") === -1)');
    assert.ok(idx !== -1, 'expected the auto-continue condition to OR in evt.truncated ahead of the "no ?" heuristic');
  });
});

// -- AC7 ---------------------------------------------------------------------
queue.push(function() {
  console.log('\n-- AC7 -- DEFAULT_MAX_TOKENS raised to 32768, env override still wins');
  return test('T12: no env override -> outgoing request body max_tokens is 32768', function() {
    return withEnv({ ANTHROPIC_API_KEY: 'fake-key', WUCE_TURN_MODEL_MAX_TOKENS: undefined }, async function() {
      delete process.env.WUCE_TURN_MODEL_MAX_TOKENS;
      const executor = freshRequire(EXECUTOR_PATH);
      const captured = {};
      const orig = mockAnthropicNonStreaming(captured);
      try {
        await executor.skillTurnExecutor('sys', [], 'hi', 'tok');
        assert.strictEqual(captured.body.max_tokens, 32768);
      } finally { require('https').request = orig; }
    });
  }).then(function() {
    return test('T13: WUCE_TURN_MODEL_MAX_TOKENS env override still takes precedence over the new default', function() {
      return withEnv({ ANTHROPIC_API_KEY: 'fake-key', WUCE_TURN_MODEL_MAX_TOKENS: '4096' }, async function() {
        const executor = freshRequire(EXECUTOR_PATH);
        const captured = {};
        const orig = mockAnthropicNonStreaming(captured);
        try {
          await executor.skillTurnExecutor('sys', [], 'hi', 'tok');
          assert.strictEqual(captured.body.max_tokens, 4096);
        } finally { require('https').request = orig; }
      });
    });
  });
});

// Run all tests
(async function run() {
  console.log('ltd-s1 -- Detect max_tokens truncation explicitly, raise the output ceiling\n');
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
