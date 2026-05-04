'use strict';
/**
 * check-dsq3-post-session-clarify-gate.js
 *
 * TDD tests for dsq.3 — Post-session /clarify gate.
 * All 7 tests FAIL before implementation.
 * All 7 tests PASS after full implementation.
 *
 * Run: node tests/check-dsq3-post-session-clarify-gate.js
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

function makeSession(routes, skillName, overrides) {
  const sid = 'test-dsq3-' + Math.random().toString(36).slice(2);
  routes.registerHtmlSession(sid, '/tmp/s-' + sid, skillName || 'discovery');
  if (overrides) {
    const sess = routes._getHtmlSession(sid);
    Object.assign(sess, overrides);
  }
  return sid;
}

const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

const queue = [];

// ── T4.1 — AC1: Final answer nextUrl points to /complete ──────────────────────

queue.push(function runT4_1() {
  console.log('\n── T4.1 — AC1: final answer returns nextUrl pointing to /complete');
  return test('T4.1 (AC1): htmlRecordAnswer for final Q returns nextUrl containing "/complete"', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function()      { return 'turn insight'; });
    routes.setNextQuestionExecutorAdapter(async function()   { return 'dynamic Q'; });
    routes.setSectionDraftExecutorAdapter(async function()   { return ''; });

    // Single-question session so the first answer is the final one
    const q1 = { id: 'q1', text: 'What is your background? Please describe your experience fully.' };
    const sid = makeSession(routes, 'discovery', {
      questions: [q1],
      answers:   []
    });

    const result = await routes.htmlRecordAnswer('discovery', sid, 'My background is product management.');

    assert.ok(result && result.nextUrl, 'htmlRecordAnswer must return { nextUrl }');
    assert.ok(
      result.nextUrl.includes('/complete'),
      'nextUrl must contain "/complete" for the final answer, got: ' + result.nextUrl
    );
    assert.ok(
      !result.nextUrl.includes('commit-preview'),
      'nextUrl must NOT contain "commit-preview" directly — must go via /complete first, got: ' + result.nextUrl
    );
  });
});

// ── T4.2 — AC2: htmlGetCompletePage exported and returns required elements ────

queue.push(function runT4_2() {
  console.log('\n── T4.2 — AC2: htmlGetCompletePage exported; HTML contains heading, skill name, question count');
  return test('T4.2 (AC2): htmlGetCompletePage returns HTML with "Draft complete", skill name, and question count', function() {
    const routes = freshRequire(ROUTES_PATH);

    assert.strictEqual(typeof routes.htmlGetCompletePage, 'function',
      'routes must export htmlGetCompletePage as a function');

    const q1 = { id: 'q1', text: 'What is your background? Please describe.' };
    const q2 = { id: 'q2', text: 'What are your goals? Please be specific.' };
    const sid = makeSession(routes, 'discovery', {
      questions: [q1, q2],
      answers:   ['Answer 1', 'Answer 2']
    });

    const html = routes.htmlGetCompletePage('discovery', sid);

    assert.ok(typeof html === 'string' && html.length > 0, 'must return a non-empty string');
    assert.ok(html.includes('Draft complete'),
      'HTML must contain "Draft complete" heading text');
    assert.ok(html.includes('discovery'),
      'HTML must contain the skill name "discovery"');
    // Check question count is present (either as "2" or as the count of answers)
    assert.ok(html.includes('2'),
      'HTML must include the question count (2) somewhere in the page');
  });
});

// ── T4.3 — AC2 continued: HTML has "Commit artefact" and "Run /clarify first" ─

queue.push(function runT4_3() {
  console.log('\n── T4.3 — AC2 continued: HTML has "Commit artefact" and "Run /clarify first"');
  return test('T4.3 (AC2+): complete page HTML contains "Commit artefact" and "Run /clarify first"', function() {
    const routes = freshRequire(ROUTES_PATH);

    const q1 = { id: 'q1', text: 'What is your background? Please describe.' };
    const sid = makeSession(routes, 'discovery', {
      questions: [q1],
      answers:   ['Answer 1']
    });

    const html = routes.htmlGetCompletePage('discovery', sid);

    assert.ok(html.includes('Commit artefact'),
      'HTML must contain "Commit artefact" button/link text');
    assert.ok(html.includes('Run /clarify first') || html.includes('/clarify'),
      'HTML must contain "Run /clarify first" or "/clarify" as a link target');
  });
});

// ── T4.4 — AC3: Commit artefact links to commit-preview URL ──────────────────

queue.push(function runT4_4() {
  console.log('\n── T4.4 — AC3: commit-preview URL present in complete page HTML');
  return test('T4.4 (AC3): complete page HTML contains commit-preview URL segment', function() {
    const routes = freshRequire(ROUTES_PATH);

    const q1 = { id: 'q1', text: 'What is your background? Please describe.' };
    const sid = makeSession(routes, 'discovery', {
      questions: [q1],
      answers:   ['Answer 1']
    });

    const html = routes.htmlGetCompletePage('discovery', sid);

    assert.ok(html.includes('commit-preview'),
      'HTML must contain "commit-preview" URL segment linking to the commit flow');
  });
});

// ── T4.5 — AC4: "Run /clarify first" links to /skills/clarify ────────────────

queue.push(function runT4_5() {
  console.log('\n── T4.5 — AC4: complete page links to /skills/clarify');
  return test('T4.5 (AC4): complete page HTML contains /skills/clarify as a link target', function() {
    const routes = freshRequire(ROUTES_PATH);

    const q1 = { id: 'q1', text: 'What is your background? Please describe.' };
    const sid = makeSession(routes, 'discovery', {
      questions: [q1],
      answers:   ['Answer 1']
    });

    const html = routes.htmlGetCompletePage('discovery', sid);

    assert.ok(html.includes('/skills/clarify'),
      'HTML must contain "/skills/clarify" as the href for the clarify link');
  });
});

// ── T4.6 — AC5: Commit appears before clarify in HTML ────────────────────────

queue.push(function runT4_6() {
  console.log('\n── T4.6 — AC5: "Commit artefact" appears before "Run /clarify first" in HTML (primary before secondary)');
  return test('T4.6 (AC5): commit-preview href appears before /skills/clarify href in HTML', function() {
    const routes = freshRequire(ROUTES_PATH);

    const q1 = { id: 'q1', text: 'What is your background? Please describe.' };
    const sid = makeSession(routes, 'discovery', {
      questions: [q1],
      answers:   ['Answer 1']
    });

    const html = routes.htmlGetCompletePage('discovery', sid);

    const commitPos  = html.indexOf('commit-preview');
    const clarifyPos = html.indexOf('/skills/clarify');

    assert.ok(commitPos !== -1, '"commit-preview" must appear in HTML');
    assert.ok(clarifyPos !== -1, '"/skills/clarify" must appear in HTML');
    assert.ok(commitPos < clarifyPos,
      '"commit-preview" must appear before "/skills/clarify" in HTML document order ' +
      '(commit is primary CTA). commit at ' + commitPos + ', clarify at ' + clarifyPos);
  });
});

// ── T4.7 — AC6: Regression — non-final answer nextUrl unchanged ───────────────

queue.push(function runT4_7() {
  console.log('\n── T4.7 — AC6: Regression — non-final answer nextUrl does not contain "/complete"');
  return test('T4.7 (AC6): non-final answer nextUrl must not point to /complete', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function()      { return 'turn insight'; });
    routes.setNextQuestionExecutorAdapter(async function()   { return 'dynamic Q'; });
    routes.setSectionDraftExecutorAdapter(async function()   { return ''; });

    const q1 = { id: 'q1', text: 'What is your background? Please describe your experience.' };
    const q2 = { id: 'q2', text: 'What are your goals? Please be specific.' };
    const q3 = { id: 'q3', text: 'What are your constraints? Please list them.' };

    // Session with 3 questions, first answer is non-final
    const sid = makeSession(routes, 'discovery', {
      questions: [q1, q2, q3],
      answers:   []
    });

    const result = await routes.htmlRecordAnswer('discovery', sid, 'First non-final answer.');

    assert.ok(result && result.nextUrl, 'must return { nextUrl }');
    assert.ok(
      !result.nextUrl.includes('complete'),
      'non-final answer nextUrl must NOT contain "complete", got: ' + result.nextUrl
    );
    assert.ok(
      !result.nextUrl.includes('commit-preview'),
      'non-final answer nextUrl must NOT contain "commit-preview", got: ' + result.nextUrl
    );
  });
});

// ── Run queue ────────────────────────────────────────────────────────────────

(async function runAll() {
  console.log('check-dsq3-post-session-clarify-gate.js — 7 tests\n');
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
