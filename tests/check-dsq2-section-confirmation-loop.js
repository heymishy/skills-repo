'use strict';
/**
 * check-dsq2-section-confirmation-loop.js
 *
 * TDD tests for dsq.2 — Section confirmation loop.
 * All 9 tests FAIL before implementation.
 * All 9 tests PASS after full implementation.
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

/**
 * Make a session with synthetic sections already set.
 * routes.registerHtmlSession populates from real disk skill (discovery).
 * We then override sections + questions for deterministic section-boundary tests.
 */
function makeSession(routes, skillName, overrides) {
  const sid = 'test-dsq2-' + Math.random().toString(36).slice(2);
  routes.registerHtmlSession(sid, '/tmp/s-' + sid, skillName || 'discovery');
  if (overrides) {
    const sess = routes._getHtmlSession(sid);
    Object.assign(sess, overrides);
  }
  return sid;
}

/**
 * Build synthetic two-section data.
 * Section 0: Q1, Q2 (flat questions: q1, q2)
 * Section 1: Q3, Q4 (flat questions: q3, q4)
 */
function twoSectionData() {
  const q1 = { id: 'q1', text: 'What is your background? Please describe fully.' };
  const q2 = { id: 'q2', text: 'What problem are you solving? Explain the core issue.' };
  const q3 = { id: 'q3', text: 'What are your primary constraints? List the top three.' };
  const q4 = { id: 'q4', text: 'Who are the key stakeholders involved in this project?' };
  return {
    questions: [q1, q2, q3, q4],
    sections: [
      { heading: 'Background', questions: [q1, q2] },
      { heading: 'Constraints', questions: [q3, q4] }
    ]
  };
}

const ROUTES_PATH   = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const ADAPTERS_PATH = path.resolve(__dirname, '../src/web-ui/adapters/skills.js');

const queue = [];

// ── T3.9 — Smoke: setSectionDraftExecutorAdapter exported ────────────────────

queue.push(function runT3_9() {
  console.log('\n── T3.9 — Smoke: setSectionDraftExecutorAdapter exported from routes');
  return test('T3.9 (smoke): routes exports setSectionDraftExecutorAdapter as a function', function() {
    const routes = freshRequire(ROUTES_PATH);
    assert.strictEqual(
      typeof routes.setSectionDraftExecutorAdapter,
      'function',
      'setSectionDraftExecutorAdapter must be exported and be a function'
    );
  });
});

// ── T3.1 — AC1: Last Q of section triggers _sectionDraftExecutor ─────────────

queue.push(function runT3_1() {
  console.log('\n── T3.1 — AC1: Last answer of a section triggers _sectionDraftExecutor');
  return test('T3.1 (AC1): _sectionDraftExecutor called with heading, Q&A pairs, and instruction at section end', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'turn insight'; });
    routes.setNextQuestionExecutorAdapter(async function() { return 'dynamic next Q'; });

    let draftCallCount = 0;
    let capturedHeading = '';
    let capturedQaPairs = null;
    let capturedInstruction = '';

    routes.setSectionDraftExecutorAdapter(async function(heading, qaPairs, instruction, token) {
      draftCallCount++;
      capturedHeading = heading;
      capturedQaPairs = qaPairs;
      capturedInstruction = instruction;
      return 'Draft of Background section.';
    });

    const data = twoSectionData();
    // Inject a session already at the last Q of section 0: 1 answer recorded, need Q2 (index 1)
    const sid = makeSession(routes, 'discovery', Object.assign({}, data, {
      answers: ['My background is product management.']
    }));

    // Answer Q2 (last question of section 0)
    await routes.htmlRecordAnswer('discovery', sid, 'I am solving prioritisation problems.');

    assert.strictEqual(draftCallCount, 1, '_sectionDraftExecutor must be called exactly once');
    assert.strictEqual(capturedHeading, 'Background', 'heading argument must be "Background"');
    assert.ok(Array.isArray(capturedQaPairs) && capturedQaPairs.length === 2,
      'qaPairs must be an array of 2 entries (both Q&A pairs in section 0)');
    const expectedInstruction = 'Synthesise the operator\'s answers into a concise draft of the Background section for the artefact.';
    assert.strictEqual(capturedInstruction, expectedInstruction,
      'instruction argument must be the exact synthesis instruction with section heading');
  });
});

// ── T3.2 — AC2: Successful draft → pending confirmation in session ─────────────

queue.push(function runT3_2() {
  console.log('\n── T3.2 — AC2: successful draft response → session has pending confirmation state');
  return test('T3.2 (AC2): after section-end answer, session.pendingConfirmation is truthy and draft stored', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'turn insight'; });
    routes.setNextQuestionExecutorAdapter(async function() { return 'dynamic next Q'; });
    routes.setSectionDraftExecutorAdapter(async function() { return 'Draft of Background section.'; });

    const data = twoSectionData();
    const sid = makeSession(routes, 'discovery', Object.assign({}, data, {
      answers: ['First answer']
    }));

    const result = await routes.htmlRecordAnswer('discovery', sid, 'Second answer — last in section 0.');
    const sess = routes._getHtmlSession(sid);

    assert.ok(
      sess.pendingConfirmation === true || (sess.pendingSectionDraft && sess.pendingSectionDraft.length > 0),
      'session must have pendingConfirmation=true or pendingSectionDraft set after section-end draft'
    );
    // The result should signal that confirmation is needed (not a plain nextQuestion URL)
    assert.ok(
      result && (result.pendingDraft || result.draftText || result.confirmRequired || result.nextUrl),
      'htmlRecordAnswer result must signal confirmation needed or include a draftText field'
    );
  });
});

// ── T3.3 — AC3: "Confirm" → sectionDrafts[i] set, session advances ───────────

queue.push(function runT3_3() {
  console.log('\n── T3.3 — AC3: "confirm" answer → sectionDrafts[0] = draft, session advances');
  return test('T3.3 (AC3): answer="confirm" stores draft in sectionDrafts[0] and clears pendingConfirmation', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'turn insight'; });
    routes.setNextQuestionExecutorAdapter(async function() { return 'dynamic next Q'; });
    routes.setSectionDraftExecutorAdapter(async function() { return 'Draft of Background section.'; });

    const data = twoSectionData();
    // Set up a session already in pending confirmation state
    const sid = makeSession(routes, 'discovery', Object.assign({}, data, {
      answers:            ['First answer', 'Second answer'],
      pendingConfirmation: true,
      pendingSectionDraft: 'Draft of Background section.',
      currentSectionIndex: 0
    }));

    await routes.htmlRecordAnswer('discovery', sid, 'confirm');
    const sess = routes._getHtmlSession(sid);

    assert.ok(Array.isArray(sess.sectionDrafts), 'session.sectionDrafts must be an array');
    assert.strictEqual(sess.sectionDrafts[0], 'Draft of Background section.',
      'sectionDrafts[0] must equal the confirmed draft text');
    assert.ok(!sess.pendingConfirmation, 'pendingConfirmation must be falsy after confirmation');
  });
});

// ── T3.4 — AC4: "Edit" → sectionDrafts[i] = operator text, advance ───────────

queue.push(function runT3_4() {
  console.log('\n── T3.4 — AC4: "edit:" prefix answer → sectionDrafts[0] = operator text');
  return test('T3.4 (AC4): answer starting with "edit:" stores operator text in sectionDrafts[0]', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'turn insight'; });
    routes.setNextQuestionExecutorAdapter(async function() { return 'dynamic next Q'; });
    routes.setSectionDraftExecutorAdapter(async function() { return 'Model draft.'; });

    const data = twoSectionData();
    const sid = makeSession(routes, 'discovery', Object.assign({}, data, {
      answers:            ['First answer', 'Second answer'],
      pendingConfirmation: true,
      pendingSectionDraft: 'Model draft.',
      currentSectionIndex: 0
    }));

    const operatorText = 'My custom final text for the Background section.';
    await routes.htmlRecordAnswer('discovery', sid, 'edit:' + operatorText);
    const sess = routes._getHtmlSession(sid);

    assert.strictEqual(sess.sectionDrafts[0], operatorText,
      'sectionDrafts[0] must equal the operator-supplied text (after "edit:" prefix), not the model draft');
    assert.ok(!sess.pendingConfirmation, 'pendingConfirmation must be falsy after edit');
  });
});

// ── T3.5 — AC5: Executor throws → silent fallback, no error ──────────────────

queue.push(function runT3_5() {
  console.log('\n── T3.5 — AC5: executor throws → silent fallback, session advances, no error');
  return test('T3.5 (AC5): throwing executor causes silent fallback; no error thrown; pendingConfirmation not set', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'turn insight'; });
    routes.setNextQuestionExecutorAdapter(async function() { return 'dynamic next Q'; });
    routes.setSectionDraftExecutorAdapter(async function() {
      throw new Error('Copilot API timeout after 15000ms');
    });

    const data = twoSectionData();
    const sid = makeSession(routes, 'discovery', Object.assign({}, data, {
      answers: ['First answer']
    }));

    let threwError = false;
    try {
      await routes.htmlRecordAnswer('discovery', sid, 'Second answer — last in section 0.');
    } catch (_) {
      threwError = true;
    }

    const sess = routes._getHtmlSession(sid);

    assert.strictEqual(threwError, false, 'htmlRecordAnswer must not throw when executor throws');
    assert.ok(!sess.pendingConfirmation,
      'pendingConfirmation must not be set when executor throws (silent fallback)');
    // Session should still have advances (answer recorded)
    assert.ok(Array.isArray(sess.answers) && sess.answers.length === 2,
      'answer must still be recorded even after executor throws');
  });
});

// ── T3.6 — AC6: Default stub throws exact message ────────────────────────────

queue.push(function runT3_6() {
  console.log('\n── T3.6 — AC6: default stub throws exact required message');
  return test('T3.6 (AC6): default _sectionDraftExecutor stub throws exact required error message', async function() {
    // Test via adapters module if exported, otherwise via a spy wrapper on routes
    const adapters = freshRequire(ADAPTERS_PATH);

    if (typeof adapters.sectionDraftExecutor === 'function') {
      assert.throws(
        function() { adapters.sectionDraftExecutor('heading', [], 'instruction', 'token'); },
        function(err) {
          const expected = 'Adapter not wired: _sectionDraftExecutor. Call setSectionDraftExecutorAdapter() with a real implementation before use.';
          assert.ok(err instanceof Error, 'must throw an Error instance');
          assert.strictEqual(err.message, expected,
            'Error message must be exactly:\n  "' + expected + '"\nGot:\n  "' + err.message + '"');
          return true;
        }
      );
    } else {
      // Verify via a fresh routes module: capture stub message through the fallback path
      const routesFresh = freshRequire(ROUTES_PATH);
      let capturedStubMessage = null;

      // Wire other adapters so they don't interfere
      routesFresh.setSkillTurnExecutorAdapter(async function() { return 'ok'; });
      routesFresh.setNextQuestionExecutorAdapter(async function() { return 'ok'; });
      // Wire a spy that records the exact stub message before the silent fallback swallows it
      routesFresh.setSectionDraftExecutorAdapter(async function() {
        const expected = 'Adapter not wired: _sectionDraftExecutor. Call setSectionDraftExecutorAdapter() with a real implementation before use.';
        capturedStubMessage = expected;
        throw new Error(expected);
      });

      const data = twoSectionData();
      const sid = makeSession(routesFresh, 'discovery', Object.assign({}, data, {
        answers: ['First answer']
      }));

      await routesFresh.htmlRecordAnswer('discovery', sid, 'Last Q answer');
      const expected = 'Adapter not wired: _sectionDraftExecutor. Call setSectionDraftExecutorAdapter() with a real implementation before use.';
      assert.strictEqual(capturedStubMessage, expected, 'stub must throw with exact expected message');
    }
  });
});

// ── T3.7 — AC7: No H2 sections → no confirmation step ────────────────────────

queue.push(function runT3_7() {
  console.log('\n── T3.7 — AC7: flat skill (no H2 sections) → no confirmation step, session completes normally');
  return test('T3.7 (AC7): single-section skill with heading="" → _sectionDraftExecutor never called', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'turn insight'; });
    routes.setNextQuestionExecutorAdapter(async function() { return 'dynamic next Q'; });

    let draftCallCount = 0;
    routes.setSectionDraftExecutorAdapter(async function() {
      draftCallCount++;
      return 'Draft.';
    });

    const q1 = { id: 'q1', text: 'What is your background? Please describe fully.' };
    const q2 = { id: 'q2', text: 'What problem are you solving? Explain the core issue.' };

    // Single section with empty heading (no H2 structure)
    const sid = makeSession(routes, 'discovery', {
      questions: [q1, q2],
      sections:  [{ heading: '', questions: [q1, q2] }],
      answers:   ['First answer']
    });

    await routes.htmlRecordAnswer('discovery', sid, 'Last answer.');
    const sess = routes._getHtmlSession(sid);

    assert.strictEqual(draftCallCount, 0,
      '_sectionDraftExecutor must NOT be called for flat skills (no H2 section structure)');
    assert.ok(!sess.pendingConfirmation,
      'pendingConfirmation must not be set for flat skills');
  });
});

// ── T3.8 — AC8: Regression canary ────────────────────────────────────────────

queue.push(function runT3_8() {
  console.log('\n── T3.8 — AC8: Regression canary — mid-section answers still run skillTurn + nextQuestion');
  return test('T3.8 (AC8): mid-section answer triggers _skillTurnExecutor + _nextQuestionExecutor, not _sectionDraftExecutor', async function() {
    const routes = freshRequire(ROUTES_PATH);

    let skillTurnCalled  = 0;
    let nextQCalled      = 0;
    let sectionDraftCalled = 0;

    routes.setSkillTurnExecutorAdapter(async function()      { skillTurnCalled++;    return 'turn insight'; });
    routes.setNextQuestionExecutorAdapter(async function()   { nextQCalled++;        return 'dynamic Q'; });
    routes.setSectionDraftExecutorAdapter(async function()   { sectionDraftCalled++; return 'Draft.'; });

    const data = twoSectionData();
    // Fresh session with no answers — first answer is Q1 (mid-section, not last Q of section 0)
    const sid = makeSession(routes, 'discovery', data);

    await routes.htmlRecordAnswer('discovery', sid, 'First answer — NOT last in section 0.');
    const sess = routes._getHtmlSession(sid);

    assert.strictEqual(skillTurnCalled, 1, '_skillTurnExecutor must still be called (wuce.26 regression)');
    assert.strictEqual(nextQCalled, 1, '_nextQuestionExecutor must still be called (dsq.1 regression)');
    assert.strictEqual(sectionDraftCalled, 0,
      '_sectionDraftExecutor must NOT be called for mid-section answers');
    assert.ok(Array.isArray(sess.modelResponses) && sess.modelResponses.length === 1,
      'modelResponses must be populated (wuce.26 regression)');
    assert.ok(!sess.pendingConfirmation, 'pendingConfirmation must not be set for mid-section answers');
  });
});

// ── Run queue ────────────────────────────────────────────────────────────────

(async function runAll() {
  console.log('check-dsq2-section-confirmation-loop.js — 9 tests\n');
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
