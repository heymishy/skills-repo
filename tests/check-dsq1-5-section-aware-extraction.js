'use strict';
/**
 * check-dsq1-5-section-aware-extraction.js
 *
 * TDD tests for dsq.1.5 — Section-aware question extraction.
 * All 7 tests FAIL before implementation.
 * All 7 tests PASS after full implementation.
 *
 * Run: node tests/check-dsq1-5-section-aware-extraction.js
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
  const sid = 'test-dsq15-' + Math.random().toString(36).slice(2);
  routes.registerHtmlSession(sid, '/tmp/s-' + sid, skillName || 'discovery');
  if (overrides) {
    const sess = routes._getHtmlSession(sid);
    Object.assign(sess, overrides);
  }
  return sid;
}

const ADAPTER_PATH = path.resolve(__dirname, '../src/skill-content-adapter.js');
const ROUTES_PATH  = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

// Synthetic SKILL.md strings used across tests
const CONTENT_TWO_SECTIONS = [
  '# Discovery Skill',
  '',
  '## Section One',
  '',
  '> **What is your background? Please describe in detail your experience and context.**',
  '> **What problem are you trying to solve right now for your team?**',
  '',
  '## Section Two',
  '',
  '> **What are your primary constraints and limitations for this project?**',
  '> **Who are the main stakeholders involved in this decision?**',
  ''
].join('\n');

const CONTENT_NO_SECTIONS = [
  '# Discovery Skill',
  '',
  '> **What is your background? Please describe in detail your experience and context.**',
  '> **What problem are you trying to solve right now?**',
  '> **What are your primary constraints?**',
  ''
].join('\n');

const CONTENT_PRE_H2_QUESTIONS = [
  '# Skill',
  '',
  '> **A question before any heading. This is the pre-section question text here.**',
  '',
  '## First Heading',
  '',
  '> **What is your primary challenge in this domain at the moment?**',
  ''
].join('\n');

const queue = [];

// ── T2.1 — AC1: H2 headings → section array in document order ────────────────

queue.push(function runT2_1() {
  console.log('\n── T2.1 — AC1: extractSections with two H2 headings produces two sections in order');
  return test('T2.1 (AC1): extractSections returns Array<{heading, questions[]}> in document order', function() {
    const adapter = freshRequire(ADAPTER_PATH);
    assert.strictEqual(typeof adapter.extractSections, 'function',
      'extractSections must be exported from skill-content-adapter.js');

    const sections = adapter.extractSections(CONTENT_TWO_SECTIONS);

    assert.ok(Array.isArray(sections), 'extractSections must return an array');
    assert.strictEqual(sections.length, 2, 'must return 2 sections for content with 2 H2 headings');
    assert.strictEqual(sections[0].heading, 'Section One',
      'sections[0].heading must be "Section One"');
    assert.strictEqual(sections[1].heading, 'Section Two',
      'sections[1].heading must be "Section Two"');
    assert.ok(Array.isArray(sections[0].questions), 'sections[0].questions must be an array');
    assert.ok(Array.isArray(sections[1].questions), 'sections[1].questions must be an array');
    assert.strictEqual(sections[0].questions.length, 2,
      'sections[0] must contain 2 questions (those under Section One)');
    assert.strictEqual(sections[1].questions.length, 2,
      'sections[1] must contain 2 questions (those under Section Two)');
  });
});

// ── T2.2 — AC1 extended: question id and text fields correct ─────────────────

queue.push(function runT2_2() {
  console.log('\n── T2.2 — AC1 extended: question objects have id and text fields');
  return test('T2.2 (AC1+): each question in sections[0].questions has id and text string fields', function() {
    const adapter = freshRequire(ADAPTER_PATH);
    const sections = adapter.extractSections(CONTENT_TWO_SECTIONS);

    const q0 = sections[0].questions[0];
    assert.ok(typeof q0.id === 'string' && q0.id.length > 0,
      'questions[0].id must be a non-empty string');
    assert.ok(typeof q0.text === 'string' && q0.text.length > 0,
      'questions[0].text must be a non-empty string');
    // text must include the actual question content (not the > ** markup)
    assert.ok(
      q0.text.includes('background') || q0.text.includes('experience'),
      'questions[0].text must be the parsed question text without markdown markup'
    );
    // No question should appear in both sections
    const q0Texts = sections[0].questions.map(function(q) { return q.text; });
    const q1Texts = sections[1].questions.map(function(q) { return q.text; });
    const overlap = q0Texts.filter(function(t) { return q1Texts.includes(t); });
    assert.strictEqual(overlap.length, 0, 'no question should appear in both sections');
  });
});

// ── T2.3 — AC2: No H2 headings → single section with empty heading ────────────

queue.push(function runT2_3() {
  console.log('\n── T2.3 — AC2: no H2 headings → [{heading: "", questions: [...all...]}]');
  return test('T2.3 (AC2): no H2 headings returns single section with heading="" and all questions', function() {
    const adapter = freshRequire(ADAPTER_PATH);
    const sections = adapter.extractSections(CONTENT_NO_SECTIONS);

    assert.strictEqual(sections.length, 1,
      'must return exactly 1 section when no H2 headings present');
    assert.strictEqual(sections[0].heading, '',
      'section heading must be empty string when no H2 headings');
    assert.strictEqual(sections[0].questions.length, 3,
      'all 3 questions must be captured under the single empty-heading section');
  });
});

// ── T2.4 — AC3: Union of section questions === extractQuestions result ─────────

queue.push(function runT2_4() {
  console.log('\n── T2.4 — AC3: union of all section.questions equals extractQuestions(content)');
  return test('T2.4 (AC3): flat union of extractSections questions equals extractQuestions for same content', function() {
    const adapter = freshRequire(ADAPTER_PATH);
    const flat     = adapter.extractQuestions(CONTENT_TWO_SECTIONS);
    const sections = adapter.extractSections(CONTENT_TWO_SECTIONS);

    const union = sections.reduce(function(acc, sec) {
      return acc.concat(sec.questions);
    }, []);

    assert.strictEqual(union.length, flat.length,
      'union of section questions must have same count as extractQuestions: expected ' + flat.length + ', got ' + union.length);

    const flatTexts  = flat.map(function(q) { return q.text; });
    const unionTexts = union.map(function(q) { return q.text; });

    flatTexts.forEach(function(t, i) {
      assert.strictEqual(unionTexts[i], t,
        'question texts must match in order at index ' + i + ': expected "' + t + '", got "' + unionTexts[i] + '"');
    });
  });
});

// ── T2.5 — AC4: session.sections populated by registerHtmlSession ─────────────

queue.push(function runT2_5() {
  console.log('\n── T2.5 — AC4: session.sections populated by registerHtmlSession');
  return test('T2.5 (AC4): _getHtmlSession after registerHtmlSession has session.sections as an array', function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = makeSession(routes, 'discovery', null);
    const sess = routes._getHtmlSession(sid);

    assert.ok(sess !== undefined, 'session must exist');
    assert.ok(Array.isArray(sess.sections),
      'session.sections must be populated as an array by registerHtmlSession');
    // Must still have existing questions flat array
    assert.ok(Array.isArray(sess.questions),
      'session.questions (flat, pre-existing) must still be present after dsq.1.5 changes');
    assert.ok(Array.isArray(sess.answers),
      'session.answers must still be an empty array (no regression)');
  });
});

// ── T2.6 — AC5: Regression canary — existing wuce.26 session fields intact ───

queue.push(function runT2_6() {
  console.log('\n── T2.6 — AC5: Regression canary — wuce.26 session fields still populated');
  return test('T2.6 (AC5): session.skillContent and session.modelResponses still present after dsq.1.5', function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = makeSession(routes, 'discovery', null);
    const sess = routes._getHtmlSession(sid);

    assert.ok(typeof sess.skillContent === 'string',
      'session.skillContent must still be a string (wuce.26 regression)');
    assert.ok(sess.skillContent.length > 0,
      'session.skillContent must be non-empty (wuce.26 regression)');
    assert.ok(Array.isArray(sess.modelResponses),
      'session.modelResponses must still be an array (wuce.26 regression)');
  });
});

// ── T2.7 — NFR: Questions before first H2 captured under empty-string heading ─

queue.push(function runT2_7() {
  console.log('\n── T2.7 — NFR: Questions before first H2 captured under empty-string heading');
  return test('T2.7 (NFR): pre-H2 questions land in sections[0] with heading=""', function() {
    const adapter = freshRequire(ADAPTER_PATH);
    const sections = adapter.extractSections(CONTENT_PRE_H2_QUESTIONS);

    // Expect at least 2 sections: one for pre-H2 questions, one for ## First Heading
    assert.ok(sections.length >= 2,
      'must return at least 2 sections (pre-H2 empty heading + First Heading), got ' + sections.length);
    assert.strictEqual(sections[0].heading, '',
      'first section must have empty heading for pre-H2 questions');
    assert.strictEqual(sections[0].questions.length, 1,
      'pre-H2 section must contain the 1 question before the first H2');
    assert.strictEqual(sections[1].heading, 'First Heading',
      'second section must have heading "First Heading"');
    assert.strictEqual(sections[1].questions.length, 1,
      'First Heading section must contain 1 question');
  });
});

// ── Run queue ────────────────────────────────────────────────────────────────

(async function runAll() {
  console.log('check-dsq1-5-section-aware-extraction.js — 7 tests\n');
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
