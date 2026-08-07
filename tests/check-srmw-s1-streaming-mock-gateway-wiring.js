'use strict';
/**
 * check-srmw-s1-streaming-mock-gateway-wiring.js -- srmw-s1: wire {stage, scenarioName}
 * into handlePostTurnStreamHtml's _turnOptions, exactly as htmlSubmitTurn's _turnMeta
 * already does, so MOCK_LLM_GATEWAY=true genuinely activates for the real chat UI's
 * streaming turn endpoint -- the ONLY endpoint the actual browser chat UI calls.
 *
 * Prior to this fix, handlePostTurnStreamHtml built _turnOptions with noThinking,
 * maxTokens, model, tenantId, sessionId -- but never stage/scenarioName. Since
 * skillTurnExecutorStream() only routes to the mock gateway when `options.stage`
 * is truthy AND mockLlmGateway.isMockGatewayEnabled() is true, every real
 * browser-driven streaming turn fell through to the real Anthropic/Copilot
 * provider regardless of MOCK_LLM_GATEWAY -- even after mgfd-s1 fixed both the
 * fixture-shipping gap and the server.js adapter-wiring gap.
 *
 * AC1/AC2 (unit, wiring): capture the options object the streaming route passes
 * into the executor via a fake adapter, and prove two DIFFERENT skillNames /
 * scenario overrides produce two DIFFERENT (differentiating, per CLAUDE.md's
 * D37 wiring-test-discipline note) options.stage / options.scenarioName values
 * -- not merely that *some* stage field is present.
 *
 * AC3 (integration, behavioural): with MOCK_LLM_GATEWAY=true and the REAL
 * mock-llm-gateway wired (wireDefaultMockGatewayClient() -- the actual production
 * wiring path), a real call into handlePostTurnStreamHtml returns the real
 * fixture file's deterministic text over the SSE stream, and https.request
 * (the real network boundary) is never invoked.
 *
 * Run: node tests/check-srmw-s1-streaming-mock-gateway-wiring.js
 */

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROUTES_PATH   = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const EXECUTOR_PATH = path.resolve(__dirname, '../src/modules/skill-turn-executor.js');
const GATEWAY_PATH   = path.resolve(__dirname, '../src/web-ui/modules/mock-llm-gateway.js');
const FIXTURE_DIR    = path.resolve(__dirname, 'e2e/fixtures/llm-gateway');

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
  const chunks = [];
  return {
    _chunks: chunks,
    writeHead: function() {},
    write: function(data) { chunks.push(data); },
    end: function() {}
  };
}

function ssePayloads(res) {
  return res._chunks
    .map(function(c) {
      const m = /^data: (.*)\n\n$/.exec(c);
      if (!m) return null;
      try { return JSON.parse(m[1]); } catch (_) { return null; }
    })
    .filter(Boolean);
}

const queue = [];

// -- AC1 -- two different skillNames produce two different options.stage values
queue.push(function runAC1() {
  console.log('\n-- AC1 -- Different session.skillName values produce different options.stage passed to the executor');
  return test('AC1: options.stage differs for skillName=discovery vs skillName=review (same session shape otherwise)', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const captured = [];
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk, options) {
      captured.push(options);
      onFirstChunk(0);
      onChunk('stub response');
      return Promise.resolve({ text: 'stub response', usage: { model: 'stub' } });
    });

    const sidA = 'test-srmw-s1-a-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sidA, { skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [], artefactContent: null, artefactPath: null, done: false });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sidA }, body: { answer: 'hi' } },
      noopRes()
    );

    const sidB = 'test-srmw-s1-b-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sidB, { skillName: 'review', sessionPath: '/tmp/t', systemPrompt: '# review', turns: [], artefactContent: null, artefactPath: null, done: false });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'review', id: sidB }, body: { answer: 'hi' } },
      noopRes()
    );

    assert.strictEqual(captured.length, 2, 'expected two executor calls');
    assert.strictEqual(captured[0].stage, 'discovery', 'first call options.stage must equal the session skillName (discovery), got: ' + JSON.stringify(captured[0]));
    assert.strictEqual(captured[1].stage, 'review', 'second call options.stage must equal the session skillName (review), got: ' + JSON.stringify(captured[1]));
    assert.notStrictEqual(captured[0].stage, captured[1].stage, 'the two stages must differ -- proves the value is actually threaded through per-session, not a hardcoded constant');
  });
});

// -- AC2 -- a session-level mockScenarioName override changes options.scenarioName;
// absence of an override defaults to 'success' -- two DIFFERENT, individually-correct outcomes
queue.push(function runAC2() {
  console.log('\n-- AC2 -- session.mockScenarioName threads through to options.scenarioName, with a \'success\' default');
  return test('AC2: options.scenarioName === session.mockScenarioName when set, and defaults to \'success\' when absent', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const captured = [];
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk, options) {
      captured.push(options);
      onFirstChunk(0);
      onChunk('stub response');
      return Promise.resolve({ text: 'stub response', usage: { model: 'stub' } });
    });

    const sidDefault = 'test-srmw-s1-default-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sidDefault, { skillName: 'definition-of-ready', sessionPath: '/tmp/t', systemPrompt: '# dor', turns: [], artefactContent: null, artefactPath: null, done: false });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok' }, params: { name: 'definition-of-ready', id: sidDefault }, body: { answer: 'hi' } },
      noopRes()
    );

    const sidFailure = 'test-srmw-s1-failure-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sidFailure, { skillName: 'definition-of-ready', sessionPath: '/tmp/t', systemPrompt: '# dor', turns: [], artefactContent: null, artefactPath: null, done: false, mockScenarioName: 'failure' });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok' }, params: { name: 'definition-of-ready', id: sidFailure }, body: { answer: 'hi' } },
      noopRes()
    );

    assert.strictEqual(captured[0].scenarioName, 'success', 'no mockScenarioName override must default to \'success\', got: ' + JSON.stringify(captured[0]));
    assert.strictEqual(captured[1].scenarioName, 'failure', 'session.mockScenarioName=\'failure\' must be threaded through, got: ' + JSON.stringify(captured[1]));
    assert.notStrictEqual(captured[0].scenarioName, captured[1].scenarioName, 'the two scenarioName values must differ');
  });
});

// -- AC3 -- real end-to-end: MOCK_LLM_GATEWAY=true + real mock gateway wired + real executor
// -> a real streaming turn returns the real fixture's deterministic text, and NEVER calls
// https.request (the real network boundary) -- this is the actual behaviour a browser-driven
// turn on staging depends on.
queue.push(function runAC3() {
  console.log('\n-- AC3 -- Real streaming turn with MOCK_LLM_GATEWAY=true routes through the mock gateway and returns fixture content, never touching the real network');
  return test('AC3: handlePostTurnStreamHtml streams the real discovery.success.json fixture text and never calls https.request', function() {
    return withEnv({ MOCK_LLM_GATEWAY: 'true', ANTHROPIC_API_KEY: 'unused-should-never-be-read', SKILL_EXECUTOR_PROVIDER: 'anthropic' }, async function() {
      // Order matters: wire the gateway BEFORE freshRequire'ing the executor, so the
      // executor's own internal `require('.../mock-llm-gateway')` resolves to this
      // same, already-wired module instance rather than a second, unwired one.
      const gateway  = freshRequire(GATEWAY_PATH);
      gateway.wireDefaultMockGatewayClient();
      const executor = freshRequire(EXECUTOR_PATH);
      const routes   = freshRequire(ROUTES_PATH);

      routes.setSkillTurnExecutorStreamAdapter(executor.skillTurnExecutorStream);

      const https = require('https');
      const origRequest = https.request;
      let realNetworkCallAttempted = false;
      https.request = function() {
        realNetworkCallAttempted = true;
        throw new Error('https.request was called -- a real network call was attempted despite MOCK_LLM_GATEWAY=true');
      };

      const sid = 'test-srmw-s1-e2e-' + Math.random().toString(36).slice(2);
      const res = noopRes();
      try {
        routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# Discovery SKILL', turns: [], artefactContent: null, artefactPath: null, done: false });
        await routes.handlePostTurnStreamHtml(
          { session: { accessToken: 'tok', tenantId: 'e2e-test-admin@example.test' }, params: { name: 'discovery', id: sid }, body: { answer: '__init__' } },
          res
        );
      } finally {
        https.request = origRequest;
      }

      assert.strictEqual(realNetworkCallAttempted, false, 'https.request must never be called when MOCK_LLM_GATEWAY=true routes the turn through the mock gateway');

      const expectedFixture = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'discovery.success.json'), 'utf8'));
      const payloads = ssePayloads(res);
      const chunkText = payloads.filter(function(p) { return typeof p.chunk === 'string'; }).map(function(p) { return p.chunk; }).join('');
      const draftText = payloads.filter(function(p) { return typeof p.draftChunk === 'string'; }).map(function(p) { return p.draftChunk; }).join('');

      assert.ok(chunkText.length > 0 || draftText.length > 0, 'expected at least one chunk/draftChunk SSE event with fixture content, got payloads: ' + JSON.stringify(payloads));
      // The fixture's own distinguishing sentence must appear somewhere in the streamed content --
      // proves this is the FIXTURE's text, not an empty response and not a real model's text.
      assert.ok(
        (chunkText + draftText).indexOf('canned discovery artefact used by the') !== -1,
        'streamed content must contain the discovery.success.json fixture\'s own distinguishing text, got chunkText=' + JSON.stringify(chunkText) + ' draftText=' + JSON.stringify(draftText)
      );
      assert.strictEqual(expectedFixture.stage, 'discovery', 'sanity: fixture file itself is the discovery stage fixture');
    });
  });
});

// Run all tests
(async function run() {
  console.log('srmw-s1 -- Wire {stage, scenarioName} into handlePostTurnStreamHtml so MOCK_LLM_GATEWAY activates for the real chat UI\n');
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
