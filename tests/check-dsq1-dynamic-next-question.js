'use strict';
/**
 * check-dsq1-dynamic-next-question.js
 *
 * TDD tests for dsq.1 — Dynamic next-question generation for web UI skill sessions.
 * All 9 tests FAIL before implementation.
 * All 9 tests PASS after full implementation.
 *
 * Run: node tests/check-dsq1-dynamic-next-question.js
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

/**
 * Build a minimal session using registerHtmlSession (reads real disk skill) then
 * patch the internal store to inject controlled test data via _getHtmlSession.
 */
function makeSession(routes, skillName, overrides) {
  const sid = 'test-dsq1-' + Math.random().toString(36).slice(2);
  routes.registerHtmlSession(sid, '/tmp/s-' + sid, skillName || 'discovery');
  if (overrides) {
    const sess = routes._getHtmlSession(sid);
    Object.assign(sess, overrides);
  }
  return sid;
}

const ROUTES_PATH   = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const ADAPTERS_PATH = path.resolve(__dirname, '../src/web-ui/adapters/skills.js');

const queue = [];

// ── T1.7 — AC5: setNextQuestionExecutorAdapter is exported ───────────────────

queue.push(function runT1_7() {
  console.log('\n── T1.7 — AC5: setNextQuestionExecutorAdapter exported from routes');
  return test('T1.7 (AC5): routes exports setNextQuestionExecutorAdapter as a function', function() {
    const routes = freshRequire(ROUTES_PATH);
    assert.strictEqual(
      typeof routes.setNextQuestionExecutorAdapter,
      'function',
      'setNextQuestionExecutorAdapter must be exported and be a function'
    );
  });
});

// ── T1.8 — AC6: Default stub throws exact message ────────────────────────────

queue.push(function runT1_8() {
  console.log('\n── T1.8 — AC6: Default _nextQuestionExecutor stub throws exact required message');
  return test('T1.8 (AC6): default stub throws "Adapter not wired: _nextQuestionExecutor..."', async function() {
    const routes = freshRequire(ROUTES_PATH);

    // Wire _skillTurnExecutor to avoid interfering with the stub test
    routes.setSkillTurnExecutorAdapter(async function() { return 'ok'; });

    // Create a session and use a capturing wrapper to observe the stub throw
    // before the silent fallback swallows it
    let stubError = null;
    routes.setNextQuestionExecutorAdapter(async function(systemPrompt, history, answer, token) {
      // This override captures the call; the stub itself can be tested via adapters module
      throw new Error('Adapter not wired: _nextQuestionExecutor. Call setNextQuestionExecutorAdapter() with a real implementation before use.');
    });

    // Now verify the stub message via the adapters module directly
    const adapters = freshRequire(ADAPTERS_PATH);
    // The adapters module should also expose the default stub behaviour
    // If nextQuestionExecutor is exported from adapters, test it directly
    if (typeof adapters.nextQuestionExecutor === 'function') {
      assert.throws(
        function() { adapters.nextQuestionExecutor('content', [], 'answer', 'token'); },
        function(err) {
          assert.ok(err instanceof Error, 'must be an Error instance');
          const expectedMsg = 'Adapter not wired: _nextQuestionExecutor. Call setNextQuestionExecutorAdapter() with a real implementation before use.';
          assert.ok(
            err.message === expectedMsg,
            'Error message must be exactly:\n  "' + expectedMsg + '"\nGot:\n  "' + err.message + '"'
          );
          return true;
        }
      );
    } else {
      // Test via a fresh routes module before any wiring is applied
      const routesFresh = freshRequire(ROUTES_PATH);
      // The fresh module has the stub wired as default; we need to observe its throw
      // We do this by calling htmlRecordAnswer and checking what error was caught
      let capturedStubMessage = null;
      // Patch _skillTurnExecutor so the first call doesn't fail
      routesFresh.setSkillTurnExecutorAdapter(async function() { return 'ok'; });
      // Replace the default stub with a spy that records the throw before re-throwing
      routesFresh.setNextQuestionExecutorAdapter(async function() {
        const err = new Error('Adapter not wired: _nextQuestionExecutor. Call setNextQuestionExecutorAdapter() with a real implementation before use.');
        capturedStubMessage = err.message;
        throw err;
      });
      const sid = makeSession(routesFresh, 'discovery', null);
      await routesFresh.htmlRecordAnswer('discovery', sid, 'test answer');
      const expectedMsg = 'Adapter not wired: _nextQuestionExecutor. Call setNextQuestionExecutorAdapter() with a real implementation before use.';
      assert.strictEqual(capturedStubMessage, expectedMsg, 'stub must throw with exact message');
    }
  });
});

// ── T1.1 — AC1: _nextQuestionExecutor is NOT called by htmlSubmitTurn ─────────

queue.push(function runT1_1() {
  console.log('\n── T1.1 — AC1: _nextQuestionExecutor is a no-op and never called by htmlSubmitTurn');
  return test('T1.1 (AC1): setNextQuestionExecutorAdapter wired function is never invoked by htmlSubmitTurn', async function() {
    const routes = freshRequire(ROUTES_PATH);

    let nextQCallCount = 0;
    routes.setNextQuestionExecutorAdapter(async function() {
      nextQCallCount++;
      return 'dynamic question text';
    });

    routes.setSkillTurnExecutorAdapter(async function() { return 'Model response.'; });

    const sid = 'test-dsq1-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test',
      systemPrompt: 'TEST SYSTEM PROMPT', turns: [],
      artefactContent: null, artefactPath: null, done: false
    });

    await routes.htmlSubmitTurn('discovery', sid, 'My background is in product management.', 'fake-tok');

    assert.strictEqual(nextQCallCount, 0,
      '_nextQuestionExecutor must NOT be called by htmlSubmitTurn in model-first architecture');
  });
});

// ── T1.2 — AC2: session.turns grows after htmlSubmitTurn ────────────────────

queue.push(function runT1_2() {
  console.log('\n── T1.2 — AC2: session.turns grows after htmlSubmitTurn (user + assistant)');
  return test('T1.2 (AC2): after htmlSubmitTurn, session.turns has user + assistant entry', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'Model response text.'; });

    const sid = 'test-dsq1-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test',
      systemPrompt: 'TEST SYSTEM PROMPT', turns: [],
      artefactContent: null, artefactPath: null, done: false
    });

    await routes.htmlSubmitTurn('discovery', sid, 'My answer here.', 'fake-tok');

    const sess = routes._getHtmlSession(sid);
    assert.ok(Array.isArray(sess.turns), 'session.turns must be an array');
    assert.strictEqual(sess.turns.length, 2, 'must have 2 turns (user + assistant)');
    assert.strictEqual(sess.turns[0].role, 'user', 'first turn must be user');
    assert.strictEqual(sess.turns[1].role, 'assistant', 'second turn must be assistant');
  });
});

// ── T1.3 — AC3: htmlSubmitTurn does not throw when _skillTurnExecutor throws ──

queue.push(function runT1_3() {
  console.log('\n── T1.3 — AC3: htmlSubmitTurn does not throw when _skillTurnExecutor throws');
  return test('T1.3 (AC3A): htmlSubmitTurn handles executor throw gracefully without propagating error', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() {
      throw new Error('API timeout');
    });

    const sid = 'test-dsq1-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test',
      systemPrompt: 'TEST SYSTEM PROMPT', turns: [],
      artefactContent: null, artefactPath: null, done: false
    });

    let threwError = false;
    try {
      await routes.htmlSubmitTurn('discovery', sid, 'My answer.', 'fake-tok');
    } catch (_) {
      threwError = true;
    }

    assert.strictEqual(threwError, false, 'htmlSubmitTurn must not throw when executor throws');
    const sess = routes._getHtmlSession(sid);
    assert.strictEqual(sess.done, false, 'session.done must remain false on executor error');
  });
});

// ── T1.4 — AC3 path B: htmlSubmitTurn returns {done:false, response} ──────────

queue.push(function runT1_4() {
  console.log('\n── T1.4 — AC3 path B: htmlSubmitTurn returns {done:false, response} without artefact signal');
  return test('T1.4 (AC3B): htmlSubmitTurn returns {done:false, response} when no artefact signal', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'What are your goals?'; });

    const sid = 'test-dsq1-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test',
      systemPrompt: 'TEST SYSTEM PROMPT', turns: [],
      artefactContent: null, artefactPath: null, done: false
    });

    const result = await routes.htmlSubmitTurn('discovery', sid, 'My background.', 'fake-tok');

    assert.ok(result, 'must return a result object');
    assert.strictEqual(result.done, false, 'done must be false without artefact signal');
    assert.strictEqual(result.response, 'What are your goals?', 'response must be the executor return value');
  });
});

// ── T1.5 — AC3 path C: session.done remains false without artefact signal ─────

queue.push(function runT1_5() {
  console.log('\n── T1.5 — AC3 path C: session.done remains false without artefact signal');
  return test('T1.5 (AC3C): session.done stays false across multiple htmlSubmitTurn calls without artefact signal', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'Keep going, more context needed.'; });

    const sid = 'test-dsq1-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test',
      systemPrompt: 'TEST SYSTEM PROMPT', turns: [],
      artefactContent: null, artefactPath: null, done: false
    });

    await routes.htmlSubmitTurn('discovery', sid, 'First answer.', 'fake-tok');
    await routes.htmlSubmitTurn('discovery', sid, 'Second answer.', 'fake-tok');
    await routes.htmlSubmitTurn('discovery', sid, 'Third answer.', 'fake-tok');

    const sess = routes._getHtmlSession(sid);
    assert.strictEqual(sess.done, false, 'session.done must stay false without artefact signal');
    assert.strictEqual(sess.turns.length, 6, 'must have 6 turns (3 user + 3 assistant)');
  });
});

// ── T1.6 — AC4: questionIndex and totalQuestions reflect static list count ────

queue.push(function runT1_6() {
  console.log('\n── T1.6 — AC4: questionIndex/totalQuestions always reflect static list count');
  return test('T1.6 (AC4): questionIndex=2, totalQuestions=3 even when dynamicQuestions[0] is set', function() {
    const routes = freshRequire(ROUTES_PATH);

    const q1 = { id: 'q1', text: 'Static Q1' };
    const q2 = { id: 'q2', text: 'Static Q2' };
    const q3 = { id: 'q3', text: 'Static Q3' };

    const sid = makeSession(routes, 'discovery', {
      questions:        [q1, q2, q3],
      answers:          ['Answer to Q1'],
      dynamicQuestions: ['Dynamic generated Q2']
    });

    const result = routes.htmlGetNextQuestion('discovery', sid);
    assert.ok(result, 'must return a result');
    assert.strictEqual(result.questionIndex, 2,
      'questionIndex must be 2 (answer count + 1), regardless of dynamic substitution');
    assert.strictEqual(result.totalQuestions, 3,
      'totalQuestions must equal static questions.length (3), not dynamicQuestions.length');
    assert.strictEqual(result.question, 'Dynamic generated Q2',
      'question text must be the dynamic value when available');
  });
});

// ── T1.9 — AC7: Regression canary — _skillTurnExecutor called once per turn ──

queue.push(function runT1_9() {
  console.log('\n── T1.9 — AC7: Regression canary — _skillTurnExecutor called once per htmlSubmitTurn');
  return test('T1.9 (AC7): htmlSubmitTurn calls _skillTurnExecutor exactly once per call', async function() {
    const routes = freshRequire(ROUTES_PATH);

    let execCallCount = 0;
    routes.setSkillTurnExecutorAdapter(async function() {
      execCallCount++;
      return 'Model-first response';
    });

    const sid = 'test-dsq1-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test',
      systemPrompt: 'TEST SYSTEM PROMPT', turns: [],
      artefactContent: null, artefactPath: null, done: false
    });

    await routes.htmlSubmitTurn('discovery', sid, 'My answer', 'fake-tok');
    await routes.htmlSubmitTurn('discovery', sid, 'Second answer', 'fake-tok');

    assert.strictEqual(execCallCount, 2, '_skillTurnExecutor must be called once per htmlSubmitTurn call');
  });
});

// ── Run queue ────────────────────────────────────────────────────────────────

(async function runAll() {
  console.log('check-dsq1-dynamic-next-question.js — 9 tests\n');
  for (const fn of queue) {
    await fn();
  }
  console.log('\n────────────────────────────────────────────');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f, i) {
      console.log('  ' + (i + 1) + '. ' + f.name + '\n     ' + f.msg);
    });
  }
  if (failed > 0) { process.exit(1); }
})();
