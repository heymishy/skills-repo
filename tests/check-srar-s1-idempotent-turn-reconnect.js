#!/usr/bin/env node
/**
 * check-srar-s1-idempotent-turn-reconnect.js -- AC verification for srar-s1
 * (client-side reconnect-on-resume for a dropped SSE turn, with an idempotent
 * server-side attemptId guard so a retry after a Fly auto-suspend mid-request
 * drop can never double-run the LLM call, double-deduct credits, or duplicate
 * a turn -- see artefacts/2026-09-01-sse-reconnect-on-resume/).
 *
 * Run: node tests/check-srar-s1-idempotent-turn-reconnect.js
 */
'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}
function eq(a, b, label) {
  if (a === b) { console.log('  ✓ ' + label); passed++; }
  else {
    console.log('  ✗ ' + label + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
    failed++;
  }
}

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

function mockRes() {
  const events = [];
  return {
    _events: events,
    writeHead: function() {},
    write: function(chunk) {
      const m = String(chunk).match(/^data: (.+)\n\n$/);
      if (m) { try { events.push(JSON.parse(m[1])); } catch (_) {} }
    },
    end: function() {},
    on: function() {}
  };
}

const _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'srar-s1-'));
process.env.COPILOT_REPO_PATH = _tmpRepoRoot;

async function run() {
  // ── AC1: new attemptId -> unchanged behaviour ──
  console.log('\n  AC1 -- new attemptId: LLM called once, credits/turns unaffected, normal completion');
  {
    const routes = freshRequire(ROUTES_PATH);
    let llmCalls = 0;
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      llmCalls++;
      onFirstChunk(0);
      onChunk('Hello, and a question?');
      return Promise.resolve({ text: 'Hello, and a question?', usage: {} });
    });
    const sid = 'test-srar-s1-a-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
      artefactContent: null, artefactPath: null, done: false, featureSlug: 'srar-repro-feature'
    });
    const res = mockRes();
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi', attemptId: 'attempt-1' } },
      res
    );
    eq(llmCalls, 1, 'AC1: LLM executor called exactly once');
    const session = routes._getHtmlSession(sid);
    eq(session.turns.length, 2, 'AC1: exactly one user/assistant turn pair appended');
    ok(session._lastAttempt && session._lastAttempt.attemptId === 'attempt-1' && session._lastAttempt.status === 'complete', 'AC1: _lastAttempt recorded as complete for attempt-1');
    ok(!res._events.some(function(e) { return e.resumed; }), 'AC1: stream does not contain a resumed event');
  }

  // ── AC2: duplicate attemptId after completion -> short-circuit, no re-run ──
  console.log('\n  AC2 -- duplicate attemptId after completion: no LLM re-call, no duplicate turns, resumed:true');
  {
    const routes = freshRequire(ROUTES_PATH);
    let llmCalls = 0;
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      llmCalls++;
      onFirstChunk(0);
      onChunk('Hello, and a question?');
      return Promise.resolve({ text: 'Hello, and a question?', usage: {} });
    });
    const sid = 'test-srar-s1-b-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
      artefactContent: null, artefactPath: null, done: false, featureSlug: 'srar-repro-feature-2'
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi', attemptId: 'attempt-2' } },
      mockRes()
    );
    eq(llmCalls, 1, 'AC2 setup: first call reached the LLM once');
    const turnsAfterFirst = routes._getHtmlSession(sid).turns.length;

    const res2 = mockRes();
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi', attemptId: 'attempt-2' } },
      res2
    );
    eq(llmCalls, 1, 'AC2: LLM executor NOT called again on the duplicate request');
    eq(routes._getHtmlSession(sid).turns.length, turnsAfterFirst, 'AC2: no duplicate turns appended');
    eq(res2._events.length, 1, 'AC2: exactly one event written for the short-circuited duplicate');
    ok(res2._events[0].done === true && res2._events[0].resumed === true, 'AC2: response is {done:true, resumed:true}');
  }

  // ── AC3: duplicate attemptId while still in-flight (<60s) -> wait error, no concurrent call ──
  console.log('\n  AC3 -- duplicate attemptId while in-flight (<60s): wait error, no concurrent LLM call');
  {
    const routes = freshRequire(ROUTES_PATH);
    let llmCalls = 0;
    routes.setSkillTurnExecutorStreamAdapter(function() {
      llmCalls++;
      return Promise.resolve({ text: 'x', usage: {} });
    });
    const sid = 'test-srar-s1-c-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
      artefactContent: null, artefactPath: null, done: false, featureSlug: 'srar-repro-feature-3',
      _lastAttempt: { attemptId: 'attempt-3', status: 'in-flight', startedAt: Date.now() }
    });
    const res = mockRes();
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi', attemptId: 'attempt-3' } },
      res
    );
    eq(llmCalls, 0, 'AC3: LLM executor never called for a duplicate against a fresh in-flight attempt');
    eq(res._events.length, 1, 'AC3: exactly one event written');
    ok(typeof res._events[0].error === 'string' && res._events[0].error.indexOf('still processing') !== -1, 'AC3: distinct "still processing" error event');
  }

  // ── AC4: stale in-flight (>60s) -> treated as fresh ──
  console.log('\n  AC4 -- stale in-flight attemptId (>60s old): treated as a fresh attempt');
  {
    const routes = freshRequire(ROUTES_PATH);
    let llmCalls = 0;
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      llmCalls++;
      onFirstChunk(0);
      onChunk('Fresh response?');
      return Promise.resolve({ text: 'Fresh response?', usage: {} });
    });
    const sid = 'test-srar-s1-d-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
      artefactContent: null, artefactPath: null, done: false, featureSlug: 'srar-repro-feature-4',
      _lastAttempt: { attemptId: 'attempt-4', status: 'in-flight', startedAt: Date.now() - 61000 }
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi', attemptId: 'attempt-4' } },
      mockRes()
    );
    eq(llmCalls, 1, 'AC4: LLM executor IS called for a stale (>60s) in-flight duplicate');
    const session = routes._getHtmlSession(sid);
    ok(session._lastAttempt.status === 'complete', 'AC4: _lastAttempt updated to complete after the fresh attempt finishes');
  }

  // ── AC5: no attemptId field -> unchanged behaviour, guard never engaged ──
  console.log('\n  AC5 -- no attemptId field: guard never engaged, behaviour unchanged');
  {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0);
      onChunk('No attemptId here?');
      return Promise.resolve({ text: 'No attemptId here?', usage: {} });
    });
    const sid = 'test-srar-s1-e-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
      artefactContent: null, artefactPath: null, done: false, featureSlug: 'srar-repro-feature-5'
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi' } },
      mockRes()
    );
    const session = routes._getHtmlSession(sid);
    eq(session._lastAttempt, undefined, 'AC5: _lastAttempt never set when no attemptId is provided');
  }

  // ── AC6/AC7: embedded client script contains the retry/reload logic ──
  console.log('\n  AC6/AC7 -- embedded client script contains attemptId retry-once and resumed-reload logic');
  {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'test-srar-s1-f-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
      artefactContent: null, artefactPath: null, done: false, journeyId: null
    });
    let capturedHtml = null;
    const mockReq = { session: { accessToken: 'tok', userId: 1, login: 'user' }, params: { name: 'discovery', id: sid } };
    const mockResPage = { writeHead: function() {}, end: function(h) { capturedHtml = h; } };
    await routes.handleGetChatHtml(mockReq, mockResPage);
    const html = capturedHtml || '';
    ok(html.indexOf('attemptId') !== -1, 'AC6: attemptId present in the generated client script');
    ok(html.indexOf('crypto.randomUUID') !== -1, 'AC6: attemptId generation uses crypto.randomUUID with a fallback');
    ok(html.indexOf('session-expired') !== -1 && html.indexOf('_isRetry') !== -1, 'AC6: retry logic excludes session-expired and guards against retrying twice');
    ok(html.indexOf('evt.resumed') !== -1 && html.indexOf('window.location.reload') !== -1, 'AC7: resumed handling reloads the page instead of rendering stream content');
  }

  delete process.env.COPILOT_REPO_PATH;
  fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });

  console.log('\n[srar-s1-idempotent-turn-reconnect] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();
