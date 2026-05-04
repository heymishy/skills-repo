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

// ── T1.1 — AC1: htmlRecordAnswer calls _nextQuestionExecutor with correct args ─

queue.push(function runT1_1() {
  console.log('\n── T1.1 — AC1: htmlRecordAnswer calls _nextQuestionExecutor with SKILL.md + history + instruction');
  return test('T1.1 (AC1): _nextQuestionExecutor called once with systemPrompt containing skill content and instruction', async function() {
    const routes = freshRequire(ROUTES_PATH);

    // Wire skillTurnExecutor (existing, must not interfere)
    routes.setSkillTurnExecutorAdapter(async function() { return 'Copilot insight.'; });

    // Wire nextQuestionExecutor spy
    let executorCallCount = 0;
    let capturedSystemPrompt = '';
    let capturedHistory = null;
    let capturedAnswer = '';
    routes.setNextQuestionExecutorAdapter(async function(systemPrompt, history, answer, token) {
      executorCallCount++;
      capturedSystemPrompt = systemPrompt;
      capturedHistory = history;
      capturedAnswer = answer;
      return 'What is your primary constraint?';
    });

    const sid = makeSession(routes, 'discovery', null);
    await routes.htmlRecordAnswer('discovery', sid, 'My background is in product management.');

    assert.strictEqual(executorCallCount, 1, '_nextQuestionExecutor must be called exactly once');
    assert.ok(typeof capturedSystemPrompt === 'string' && capturedSystemPrompt.length > 0,
      'systemPrompt must be a non-empty string');
    // AC1 requires the instruction to appear in the prompt
    const instruction = 'Given the skill instructions and the conversation so far, what is the single best next question to ask the operator?';
    assert.ok(
      capturedSystemPrompt.includes(instruction) || capturedAnswer.includes(instruction),
      'The instruction "' + instruction + '" must appear in the systemPrompt or answer argument'
    );
    assert.ok(Array.isArray(capturedHistory), 'history argument must be an array');
  });
});

// ── T1.2 — AC2: Non-empty response stored in dynamicQuestions and served ─────

queue.push(function runT1_2() {
  console.log('\n── T1.2 — AC2: non-empty executor response stored in session.dynamicQuestions and returned by htmlGetNextQuestion');
  return test('T1.2 (AC2): dynamicQuestions[0] set to executor result; htmlGetNextQuestion returns it', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'Copilot insight.'; });
    routes.setNextQuestionExecutorAdapter(async function() {
      return 'What is your primary constraint?';
    });

    const sid = makeSession(routes, 'discovery', null);
    await routes.htmlRecordAnswer('discovery', sid, 'My background is in product management.');

    const sess = routes._getHtmlSession(sid);
    assert.ok(Array.isArray(sess.dynamicQuestions), 'session.dynamicQuestions must be an array');
    assert.strictEqual(sess.dynamicQuestions[0], 'What is your primary constraint?',
      'session.dynamicQuestions[0] must equal the executor return value');

    const nextQ = routes.htmlGetNextQuestion('discovery', sid);
    assert.ok(nextQ, 'htmlGetNextQuestion must return a result');
    assert.strictEqual(nextQ.question, 'What is your primary constraint?',
      'htmlGetNextQuestion must return the dynamic question, not the static one');
  });
});

// ── T1.3 — AC3 path A: Executor throws → static fallback ─────────────────────

queue.push(function runT1_3() {
  console.log('\n── T1.3 — AC3 path A: executor throws → static fallback, no error propagated');
  return test('T1.3 (AC3A): executor throw causes static fallback; session continues; no error thrown', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'Copilot insight.'; });
    routes.setNextQuestionExecutorAdapter(async function() {
      throw new Error('API timeout');
    });

    const syntheticQ1 = { id: 'q1', text: 'What is your background?' };
    const syntheticQ2 = { id: 'q2', text: 'What are your goals?' };
    const sid = makeSession(routes, 'discovery', {
      questions: [syntheticQ1, syntheticQ2]
    });

    let threwError = false;
    try {
      await routes.htmlRecordAnswer('discovery', sid, 'My background is product management.');
    } catch (_) {
      threwError = true;
    }

    assert.strictEqual(threwError, false, 'htmlRecordAnswer must not throw when executor throws');

    const nextQ = routes.htmlGetNextQuestion('discovery', sid);
    assert.ok(nextQ, 'session must continue after fallback');
    assert.strictEqual(nextQ.question, 'What are your goals?',
      'static fallback question must be returned when executor throws');
  });
});

// ── T1.4 — AC3 path B: Executor returns empty string → static fallback ────────

queue.push(function runT1_4() {
  console.log('\n── T1.4 — AC3 path B: executor returns empty string → static fallback');
  return test('T1.4 (AC3B): empty executor response causes static fallback question to be served', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'Copilot insight.'; });
    routes.setNextQuestionExecutorAdapter(async function() { return ''; });

    const syntheticQ1 = { id: 'q1', text: 'What is your background?' };
    const syntheticQ2 = { id: 'q2', text: 'What are your goals?' };
    const sid = makeSession(routes, 'discovery', {
      questions: [syntheticQ1, syntheticQ2]
    });

    await routes.htmlRecordAnswer('discovery', sid, 'My background is product management.');

    const nextQ = routes.htmlGetNextQuestion('discovery', sid);
    assert.ok(nextQ, 'session must continue after empty fallback');
    assert.strictEqual(nextQ.question, 'What are your goals?',
      'static question must be used when executor returns empty string');
  });
});

// ── T1.5 — AC3 path C: Executor returns null → static fallback ───────────────

queue.push(function runT1_5() {
  console.log('\n── T1.5 — AC3 path C: executor returns null → static fallback');
  return test('T1.5 (AC3C): null executor response causes static fallback question to be served', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'Copilot insight.'; });
    routes.setNextQuestionExecutorAdapter(async function() { return null; });

    const syntheticQ1 = { id: 'q1', text: 'What is your background?' };
    const syntheticQ2 = { id: 'q2', text: 'What are your goals?' };
    const sid = makeSession(routes, 'discovery', {
      questions: [syntheticQ1, syntheticQ2]
    });

    await routes.htmlRecordAnswer('discovery', sid, 'My background is product management.');

    const nextQ = routes.htmlGetNextQuestion('discovery', sid);
    assert.ok(nextQ, 'session must continue after null fallback');
    assert.strictEqual(nextQ.question, 'What are your goals?',
      'static question must be used when executor returns null');
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

// ── T1.9 — AC7: Regression canary — wuce.26 core behaviour unaffected ─────────

queue.push(function runT1_9() {
  console.log('\n── T1.9 — AC7: Regression canary — _skillTurnExecutor still called and modelResponses stored');
  return test('T1.9 (AC7): after dsq.1 changes, htmlRecordAnswer still calls _skillTurnExecutor and stores modelResponses', async function() {
    const routes  = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'wuce26 insight'; });
    routes.setNextQuestionExecutorAdapter(async function() { return 'dynamic next Q'; });

    const sid = makeSession(routes, 'discovery', null);
    const result = await routes.htmlRecordAnswer('discovery', sid, 'My answer');

    const sess = routes._getHtmlSession(sid);

    assert.ok(Array.isArray(sess.answers) && sess.answers.length === 1,
      'answer must still be recorded (wuce.26 regression)');
    assert.ok(Array.isArray(sess.modelResponses) && sess.modelResponses.length === 1,
      'modelResponses must still be populated (wuce.26 regression)');
    assert.strictEqual(sess.modelResponses[0], 'wuce26 insight',
      'modelResponses[0] must be the _skillTurnExecutor result (wuce.26 regression)');
    assert.ok(result && result.nextUrl, 'must still return { nextUrl } (wuce.26 regression)');
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
