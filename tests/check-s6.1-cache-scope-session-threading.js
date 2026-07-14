'use strict';
/**
 * check-s6.1-cache-scope-session-threading.js -- s6.1: activate Decision 8 (thread session into
 * prompt-cache scoping).
 *
 * p4.1 built buildCacheKey() / _anthropicSystem() to embed a tenant+session cache-scope comment
 * in the Anthropic system prompt, but Decision 8 (decisions.md, 2026-06-24) RISK-ACCEPTed
 * shipping it inert -- no caller passed a `session` argument. This suite proves the real
 * production call chain (handlePostTurnHtml / handlePostTurnStreamHtml -> skillTurnExecutor(Stream)
 * -> _callAnthropic(Stream) -> _anthropicSystem) now genuinely differentiates two tenants' cache-
 * scope values -- not merely that a parameter is accepted (D37 wiring-test discipline, CLAUDE.md).
 *
 * Mocks https.request at the module boundary -- no live Anthropic API call. Pattern matches the
 * existing precedent in tests/check-wuce26-per-answer-model-response.js (T9/T10).
 *
 * Run: node tests/check-s6.1-cache-scope-session-threading.js
 */

const assert = require('assert');
const path   = require('path');

const ROUTES_PATH   = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const EXECUTOR_PATH = path.resolve(__dirname, '../src/modules/skill-turn-executor.js');

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
        failures.push({ name: name, msg: msg });
        console.log('  FAIL: ' + name + '\n       ' + msg);
      });
    }
    passed++;
    console.log('  PASS: ' + name);
    return Promise.resolve();
  } catch (err) {
    failed++;
    const msg = err && err.message ? err.message : String(err);
    failures.push({ name: name, msg: msg });
    console.log('  FAIL: ' + name + '\n       ' + msg);
    return Promise.resolve();
  }
}

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

// Mocks https.request for the non-streaming Anthropic call. Returns the original
// https.request so the caller can restore it.
function mockAnthropicNonStreaming(captured) {
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
          usage: { input_tokens: 10, output_tokens: 5 }
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

// Mocks https.request for the streaming (SSE) Anthropic call.
function mockAnthropicStreaming(captured) {
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
        resEmitter.emit('end');
      },
      on: function() { return req; },
      setTimeout: function() { return req; }
    };
    return req;
  };
  return orig;
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

function noopRes() {
  return { writeHead: function() {}, write: function() {}, end: function() {} };
}

const queue = [];

// -- AC1 / AC2 -- non-streaming: two tenants, identical prompt -> different, correctly-formatted
// captured system texts
queue.push(function runAC1AC2() {
  console.log('\n-- AC1/AC2 -- Non-streaming: tenant-differentiated cache-scope at the Anthropic boundary');
  return test('AC1: system[0].text differs between org-a and org-b (same prompt, same sessionId); AC2: format is exact', function() {
    return withEnv({ ANTHROPIC_API_KEY: 'fake-key', SKILL_EXECUTOR_PROVIDER: 'anthropic' }, async function() {
      const routes   = freshRequire(ROUTES_PATH);
      const executor = freshRequire(EXECUTOR_PATH);
      routes.setSkillTurnExecutorAdapter(executor.skillTurnExecutor);

      const sid          = 'test-s6.1-' + Math.random().toString(36).slice(2);
      const systemPrompt = '# Discovery SKILL -- identical content for both tenants';

      const capturedA = {};
      let orig = mockAnthropicNonStreaming(capturedA);
      try {
        routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: systemPrompt, turns: [], artefactContent: null, artefactPath: null, done: false });
        await routes.handlePostTurnHtml(
          { session: { accessToken: 'tok', tenantId: 'org-a', login: 'alice' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi' } },
          noopRes()
        );
      } finally { require('https').request = orig; }

      const capturedB = {};
      orig = mockAnthropicNonStreaming(capturedB);
      try {
        routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: systemPrompt, turns: [], artefactContent: null, artefactPath: null, done: false });
        await routes.handlePostTurnHtml(
          { session: { accessToken: 'tok', tenantId: 'org-b', login: 'bob' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi' } },
          noopRes()
        );
      } finally { require('https').request = orig; }

      const textA = capturedA.body.system[0].text;
      const textB = capturedB.body.system[0].text;

      // AC1 -- safety-critical: the two must not be equal
      assert.notStrictEqual(textA, textB, 'captured system text must differ between tenants -- cross-tenant cache bleed risk otherwise');

      // AC2 -- exact format: '<!-- cache-scope: ${tenantId}-${sessionId} -->' as the first line
      assert.strictEqual(textA.split('\n')[0], '<!-- cache-scope: org-a-' + sid + ' -->', 'tenant A first line must be the exact cache-scope comment, got: ' + textA.slice(0, 100));
      assert.strictEqual(textB.split('\n')[0], '<!-- cache-scope: org-b-' + sid + ' -->', 'tenant B first line must be the exact cache-scope comment, got: ' + textB.slice(0, 100));
    });
  });
});

// -- AC3 -- streaming: two tenants, identical prompt -> different captured system texts
queue.push(function runAC3() {
  console.log('\n-- AC3 -- Streaming: tenant-differentiated cache-scope at the Anthropic boundary');
  return test('AC3: streaming system[0].text differs between org-a and org-b (same prompt, same sessionId)', function() {
    return withEnv({ ANTHROPIC_API_KEY: 'fake-key', SKILL_EXECUTOR_PROVIDER: 'anthropic' }, async function() {
      const routes   = freshRequire(ROUTES_PATH);
      const executor = freshRequire(EXECUTOR_PATH);
      routes.setSkillTurnExecutorStreamAdapter(executor.skillTurnExecutorStream);

      const sid          = 'test-s6.1-stream-' + Math.random().toString(36).slice(2);
      const systemPrompt = '# Review SKILL -- identical content for both tenants';

      const capturedA = {};
      let orig = mockAnthropicStreaming(capturedA);
      try {
        routes._setHtmlSession(sid, { skillName: 'review', sessionPath: '/tmp/t', systemPrompt: systemPrompt, turns: [], artefactContent: null, artefactPath: null, done: false });
        await routes.handlePostTurnStreamHtml(
          { session: { accessToken: 'tok', tenantId: 'org-a', login: 'alice' }, params: { name: 'review', id: sid }, body: { answer: 'hi' } },
          noopRes()
        );
      } finally { require('https').request = orig; }

      const capturedB = {};
      orig = mockAnthropicStreaming(capturedB);
      try {
        routes._setHtmlSession(sid, { skillName: 'review', sessionPath: '/tmp/t', systemPrompt: systemPrompt, turns: [], artefactContent: null, artefactPath: null, done: false });
        await routes.handlePostTurnStreamHtml(
          { session: { accessToken: 'tok', tenantId: 'org-b', login: 'bob' }, params: { name: 'review', id: sid }, body: { answer: 'hi' } },
          noopRes()
        );
      } finally { require('https').request = orig; }

      const textA = capturedA.body.system[0].text;
      const textB = capturedB.body.system[0].text;
      assert.notStrictEqual(textA, textB, 'streaming captured system text must differ between tenants');
      assert.ok(textA.includes('org-a-' + sid), 'tenant A streaming text must include its own cache-scope, got: ' + textA.slice(0, 100));
      assert.ok(textB.includes('org-b-' + sid), 'tenant B streaming text must include its own cache-scope, got: ' + textB.slice(0, 100));
    });
  });
});

// -- AC4a -- non-streaming: no tenantId -> prompt unchanged (regression guard)
queue.push(function runAC4a() {
  console.log('\n-- AC4a -- Non-streaming: no tenantId leaves system prompt unchanged');
  return test('AC4a: system[0].text === systemPrompt when req.session.tenantId absent', function() {
    return withEnv({ ANTHROPIC_API_KEY: 'fake-key', SKILL_EXECUTOR_PROVIDER: 'anthropic' }, async function() {
      const routes   = freshRequire(ROUTES_PATH);
      const executor = freshRequire(EXECUTOR_PATH);
      routes.setSkillTurnExecutorAdapter(executor.skillTurnExecutor);

      const sid          = 'test-s6.1-notenant-' + Math.random().toString(36).slice(2);
      const systemPrompt = '# Single-tenant SKILL -- no tenantId on this session';

      const captured = {};
      const orig = mockAnthropicNonStreaming(captured);
      try {
        routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: systemPrompt, turns: [], artefactContent: null, artefactPath: null, done: false });
        await routes.handlePostTurnHtml(
          { session: { accessToken: 'tok', login: 'solo' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi' } },
          noopRes()
        );
      } finally { require('https').request = orig; }

      assert.strictEqual(captured.body.system[0].text, systemPrompt, 'system text must be unchanged (no cache-scope line) when tenantId is absent');
    });
  });
});

// -- AC4b -- streaming: no tenantId -> prompt unchanged (regression guard)
queue.push(function runAC4b() {
  console.log('\n-- AC4b -- Streaming: no tenantId leaves system prompt unchanged');
  return test('AC4b: streaming system[0].text === systemPrompt when req.session.tenantId absent', function() {
    return withEnv({ ANTHROPIC_API_KEY: 'fake-key', SKILL_EXECUTOR_PROVIDER: 'anthropic' }, async function() {
      const routes   = freshRequire(ROUTES_PATH);
      const executor = freshRequire(EXECUTOR_PATH);
      routes.setSkillTurnExecutorStreamAdapter(executor.skillTurnExecutorStream);

      const sid          = 'test-s6.1-stream-notenant-' + Math.random().toString(36).slice(2);
      const systemPrompt = '# Single-tenant streaming SKILL -- no tenantId on this session';

      const captured = {};
      const orig = mockAnthropicStreaming(captured);
      try {
        routes._setHtmlSession(sid, { skillName: 'review', sessionPath: '/tmp/t', systemPrompt: systemPrompt, turns: [], artefactContent: null, artefactPath: null, done: false });
        await routes.handlePostTurnStreamHtml(
          { session: { accessToken: 'tok', tenantId: null, login: 'solo' }, params: { name: 'review', id: sid }, body: { answer: 'hi' } },
          noopRes()
        );
      } finally { require('https').request = orig; }

      assert.strictEqual(captured.body.system[0].text, systemPrompt, 'streaming system text must be unchanged when tenantId is null');
    });
  });
});

// Run all tests
(async function run() {
  console.log('s6.1 -- Thread session into prompt-cache scoping (activate Decision 8)\n');
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
