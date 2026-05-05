'use strict';
/**
 * check-dsq2-section-confirmation-loop.js
 *
 * Tests for dsq.2 — Section confirmation loop (model-first architecture).
 * Rewritten for mfc.1: tests verify session.turns accumulation, executor
 * call counts, and no-op behaviour of setSectionDraftExecutorAdapter.
 *
 * Run: node tests/check-dsq2-section-confirmation-loop.js
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

const queue = [];

// T3.9 — Smoke: setSectionDraftExecutorAdapter exported
queue.push(function runT3_9() {
  console.log('\n-- T3.9 -- Smoke: setSectionDraftExecutorAdapter exported from routes');
  return test('T3.9 (smoke): routes exports setSectionDraftExecutorAdapter as a function', function() {
    const routes = freshRequire(ROUTES_PATH);
    assert.strictEqual(typeof routes.setSectionDraftExecutorAdapter, 'function',
      'setSectionDraftExecutorAdapter must be exported and be a function');
  });
});

// T3.6 -- AC6: Default stub message
queue.push(function runT3_6() {
  console.log('\n-- T3.6 -- AC6: default _sectionDraftExecutor stub message');
  return test('T3.6 (AC6): default stub message from adapters or routes is correct', async function() {
    const adapters = freshRequire(ADAPTERS_PATH);
    if (typeof adapters.sectionDraftExecutor === 'function') {
      assert.throws(function() { adapters.sectionDraftExecutor('h', [], 'i', 't'); }, function(err) {
        const expected = 'Adapter not wired: _sectionDraftExecutor. Call setSectionDraftExecutorAdapter() with a real implementation before use.';
        assert.ok(err instanceof Error); assert.strictEqual(err.message, expected); return true;
      });
    } else {
      const routes = freshRequire(ROUTES_PATH);
      assert.strictEqual(typeof routes.setSectionDraftExecutorAdapter, 'function',
        'setSectionDraftExecutorAdapter must exist');
    }
  });
});

// T3.1 -- AC1: _sectionDraftExecutor NOT called by htmlSubmitTurn
queue.push(function runT3_1() {
  console.log('\n-- T3.1 -- AC1: _sectionDraftExecutor never called by htmlSubmitTurn');
  return test('T3.1 (AC1): setSectionDraftExecutorAdapter wired function never invoked by htmlSubmitTurn', async function() {
    const routes = freshRequire(ROUTES_PATH);
    let sectionDraftCallCount = 0;
    routes.setSectionDraftExecutorAdapter(async function() { sectionDraftCallCount++; return 'Draft.'; });
    routes.setSkillTurnExecutorAdapter(async function() { return 'Model response.'; });
    const sid = 'test-dsq2-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT', turns: [], artefactContent: null, artefactPath: null, done: false });
    await routes.htmlSubmitTurn('discovery', sid, 'Answer 1.', 'fake-tok');
    await routes.htmlSubmitTurn('discovery', sid, 'Answer 2.', 'fake-tok');
    assert.strictEqual(sectionDraftCallCount, 0, '_sectionDraftExecutor must NOT be called by htmlSubmitTurn');
  });
});

// T3.2 -- AC2: session.turns has 2 entries after one htmlSubmitTurn
queue.push(function runT3_2() {
  console.log('\n-- T3.2 -- AC2: session.turns has 2 entries after one htmlSubmitTurn');
  return test('T3.2 (AC2): session.turns has exactly 2 entries (user+assistant) after one call', async function() {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Model response text.'; });
    const sid = 'test-dsq2-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT', turns: [], artefactContent: null, artefactPath: null, done: false });
    await routes.htmlSubmitTurn('discovery', sid, 'First user answer.', 'fake-tok');
    const sess = routes._getHtmlSession(sid);
    assert.ok(Array.isArray(sess.turns), 'session.turns must be an array');
    assert.strictEqual(sess.turns.length, 2, 'must have exactly 2 turns');
    assert.strictEqual(sess.turns[0].role, 'user');
    assert.strictEqual(sess.turns[1].role, 'assistant');
  });
});

// T3.3 -- AC3: second htmlSubmitTurn appends 2 more entries (total 4)
queue.push(function runT3_3() {
  console.log('\n-- T3.3 -- AC3: second htmlSubmitTurn appends 2 more entries (total 4)');
  return test('T3.3 (AC3): session.turns has 4 entries after two htmlSubmitTurn calls', async function() {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Model response.'; });
    const sid = 'test-dsq2-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT', turns: [], artefactContent: null, artefactPath: null, done: false });
    await routes.htmlSubmitTurn('discovery', sid, 'First answer.', 'fake-tok');
    await routes.htmlSubmitTurn('discovery', sid, 'Second answer.', 'fake-tok');
    const sess = routes._getHtmlSession(sid);
    assert.strictEqual(sess.turns.length, 4, 'must have 4 turns after two calls');
    assert.strictEqual(sess.turns[2].role, 'user');
    assert.strictEqual(sess.turns[3].role, 'assistant');
  });
});

// T3.4 -- AC4: third htmlSubmitTurn passes history of 4 prior turns
queue.push(function runT3_4() {
  console.log('\n-- T3.4 -- AC4: third htmlSubmitTurn passes history of 4 prior turns to executor');
  return test('T3.4 (AC4): _skillTurnExecutor receives history of 4 prior turns on 3rd call', async function() {
    const routes = freshRequire(ROUTES_PATH);
    let capturedHistory = null; let callCount = 0;
    routes.setSkillTurnExecutorAdapter(async function(systemPrompt, history, currentInput, token) {
      callCount++; capturedHistory = history; return 'Response ' + callCount;
    });
    const sid = 'test-dsq2-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT', turns: [], artefactContent: null, artefactPath: null, done: false });
    await routes.htmlSubmitTurn('discovery', sid, 'First.', 'fake-tok');
    await routes.htmlSubmitTurn('discovery', sid, 'Second.', 'fake-tok');
    await routes.htmlSubmitTurn('discovery', sid, 'Third.', 'fake-tok');
    assert.strictEqual(callCount, 3);
    assert.ok(Array.isArray(capturedHistory), 'history must be an array');
    assert.strictEqual(capturedHistory.length, 4, 'history on 3rd call must have 4 entries');
  });
});

// T3.5 -- AC5: htmlSubmitTurn does not throw when _skillTurnExecutor throws
queue.push(function runT3_5() {
  console.log('\n-- T3.5 -- AC5: htmlSubmitTurn does not throw when _skillTurnExecutor throws');
  return test('T3.5 (AC5): htmlSubmitTurn handles _skillTurnExecutor throw gracefully', async function() {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { throw new Error('Copilot API timeout after 15000ms'); });
    const sid = 'test-dsq2-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT', turns: [], artefactContent: null, artefactPath: null, done: false });
    let threwError = false;
    try { await routes.htmlSubmitTurn('discovery', sid, 'My answer.', 'fake-tok'); } catch (_) { threwError = true; }
    assert.strictEqual(threwError, false, 'htmlSubmitTurn must not throw when executor throws');
    const sess = routes._getHtmlSession(sid);
    assert.strictEqual(sess.done, false, 'session.done must remain false on executor error');
  });
});

// T3.7 -- AC7: setSectionDraftExecutorAdapter accepts any function without affecting htmlSubmitTurn
queue.push(function runT3_7() {
  console.log('\n-- T3.7 -- AC7: setSectionDraftExecutorAdapter is accepted as no-op');
  return test('T3.7 (AC7): wiring a throwing fn via setSectionDraftExecutorAdapter does not break htmlSubmitTurn', async function() {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSectionDraftExecutorAdapter(async function() { throw new Error('Should never be called'); });
    routes.setSkillTurnExecutorAdapter(async function() { return 'Normal model response.'; });
    const sid = 'test-dsq2-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT', turns: [], artefactContent: null, artefactPath: null, done: false });
    let threwError = false; let result = null;
    try { result = await routes.htmlSubmitTurn('discovery', sid, 'My answer.', 'fake-tok'); } catch (_) { threwError = true; }
    assert.strictEqual(threwError, false, 'must not throw');
    assert.ok(result && !result.done, 'must return valid {done:false, response}');
    assert.strictEqual(result.response, 'Normal model response.');
  });
});

// T3.8 -- AC8: Regression -- _skillTurnExecutor called once per htmlSubmitTurn
queue.push(function runT3_8() {
  console.log('\n-- T3.8 -- AC8: Regression -- _skillTurnExecutor called once per htmlSubmitTurn');
  return test('T3.8 (AC8): _skillTurnExecutor called exactly once per htmlSubmitTurn call', async function() {
    const routes = freshRequire(ROUTES_PATH);
    let execCallCount = 0;
    routes.setSkillTurnExecutorAdapter(async function() { execCallCount++; return 'Model response'; });
    const sid = 'test-dsq2-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, { skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'PROMPT', turns: [], artefactContent: null, artefactPath: null, done: false });
    await routes.htmlSubmitTurn('discovery', sid, 'Answer 1', 'fake-tok');
    await routes.htmlSubmitTurn('discovery', sid, 'Answer 2', 'fake-tok');
    await routes.htmlSubmitTurn('discovery', sid, 'Answer 3', 'fake-tok');
    assert.strictEqual(execCallCount, 3, '_skillTurnExecutor must be called once per htmlSubmitTurn');
  });
});

// T3.10 -- AC9: server.js does NOT wire setSectionDraftExecutorAdapter
queue.push(function runT3_10() {
  console.log('\n-- T3.10 -- AC9: server.js does NOT wire setSectionDraftExecutorAdapter');
  return test('T3.10 (AC9): server.js must NOT call setSectionDraftExecutorAdapter() in model-first arch', function() {
    const fs = require('fs');
    const serverPath = path.resolve(__dirname, '../src/web-ui/server.js');
    const serverSrc = fs.readFileSync(serverPath, 'utf8');
    const wireCount = (serverSrc.match(/setSectionDraftExecutorAdapter\s*\(/g) || []).length;
    assert.strictEqual(wireCount, 0, 'server.js must NOT call setSectionDraftExecutorAdapter() (no-op in model-first)');
  });
});

// Run queue
(async function runAll() {
  console.log('check-dsq2-section-confirmation-loop.js -- 10 tests\n');
  for (const fn of queue) { await fn(); }
  console.log('\n--------------------------------------------');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f, i) { console.log('  ' + (i + 1) + '. ' + f.name + '\n     ' + f.msg); });
  }
  if (failed > 0) { process.exit(1); }
})();
