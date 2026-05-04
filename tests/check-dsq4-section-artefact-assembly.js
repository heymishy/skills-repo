'use strict';
/**
 * check-dsq4-section-artefact-assembly.js
 *
 * TDD tests for dsq.4 — Section-by-section artefact assembly.
 * All 7 tests FAIL before implementation.
 * All 7 tests PASS after full implementation.
 *
 * Run: node tests/check-dsq4-section-artefact-assembly.js
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
  const sid = 'test-dsq4-' + Math.random().toString(36).slice(2);
  routes.registerHtmlSession(sid, '/tmp/s-' + sid, skillName || 'discovery');
  if (overrides) {
    const sess = routes._getHtmlSession(sid);
    Object.assign(sess, overrides);
  }
  return sid;
}

const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

const queue = [];

// ── T5.1 — AC1: Sectioned skill → H2 headings, no Q/A prefixes ───────────────

queue.push(function runT5_1() {
  console.log('\n── T5.1 — AC1: sectioned skill produces H2 headings without Q/A prefixes');
  return test('T5.1 (AC1): artefactContent has H2 section headings and no "Q1:", "A:", "## Q" prefixes', function() {
    const routes = freshRequire(ROUTES_PATH);

    const q1 = { id: 'q1', text: 'What is your background? Please describe your experience.' };
    const q2 = { id: 'q2', text: 'What problem are you solving? Explain the core issue here.' };
    const q3 = { id: 'q3', text: 'What are your primary constraints? List the top factors.' };
    const q4 = { id: 'q4', text: 'Who are the stakeholders? Name the key people involved.' };

    const sid = makeSession(routes, 'discovery', {
      questions: [q1, q2, q3, q4],
      sections:  [
        { heading: 'Background', questions: [q1, q2] },
        { heading: 'Constraints', questions: [q3, q4] }
      ],
      answers:      ['I have a product background.', 'I am solving prioritisation.', 'Budget constraints.', 'The CTO and PM.'],
      sectionDrafts: []
    });

    const preview = routes.htmlGetPreview('discovery', sid);

    assert.ok(preview && typeof preview.artefactContent === 'string',
      'htmlGetPreview must return { artefactContent }');

    const content = preview.artefactContent;

    assert.ok(content.includes('## Background'),
      'artefactContent must contain "## Background" section heading');
    assert.ok(content.includes('## Constraints'),
      'artefactContent must contain "## Constraints" section heading');

    // Section headings must appear BEFORE Constraints (document order)
    assert.ok(content.indexOf('## Background') < content.indexOf('## Constraints'),
      '"## Background" must appear before "## Constraints" in artefactContent');

    // Old-format prefixes must NOT appear
    assert.ok(!content.includes('Q1:'), 'artefactContent must NOT contain "Q1:" prefix');
    assert.ok(!content.includes('\nA:'), 'artefactContent must NOT contain "A:" prefix');
    assert.ok(!content.match(/## Q\d/), 'artefactContent must NOT contain "## Q1" / "## Q2" style headings');

    // Answer content must be present
    assert.ok(content.includes('I have a product background.'),
      'artefactContent must include the answer text');
  });
});

// ── T5.2 — AC2: sectionDrafts[i] populated → section content = draft text ─────

queue.push(function runT5_2() {
  console.log('\n── T5.2 — AC2: sectionDrafts[0] populated → Background section uses confirmed draft');
  return test('T5.2 (AC2): section with sectionDraft uses draft text, not raw answers', function() {
    const routes = freshRequire(ROUTES_PATH);

    const q1 = { id: 'q1', text: 'What is your background? Please describe fully.' };
    const q2 = { id: 'q2', text: 'What are your constraints? List the key factors.' };

    const sid = makeSession(routes, 'discovery', {
      questions: [q1, q2],
      sections:  [
        { heading: 'Background', questions: [q1] },
        { heading: 'Constraints', questions: [q2] }
      ],
      answers:      ['Raw background answer.', 'Raw constraints answer.'],
      sectionDrafts: ['Confirmed draft for the Background section.']
    });

    const preview = routes.htmlGetPreview('discovery', sid);
    const content = preview.artefactContent;

    assert.ok(content.includes('Confirmed draft for the Background section.'),
      'artefactContent must contain the confirmed section draft text for Background');
    assert.ok(!content.includes('Raw background answer.'),
      'artefactContent must NOT include the raw answer when a sectionDraft exists');
  });
});

// ── T5.3 — AC3: sectionDrafts[i] absent → answers concatenated under heading ──

queue.push(function runT5_3() {
  console.log('\n── T5.3 — AC3: no sectionDraft → answers concatenated under heading, no Q/A labels');
  return test('T5.3 (AC3): section without sectionDraft uses concatenated answers with no Q/A prefix', function() {
    const routes = freshRequire(ROUTES_PATH);

    const q1 = { id: 'q1', text: 'First question in this section, please answer fully.' };
    const q2 = { id: 'q2', text: 'Second question in this section, provide context.' };

    const sid = makeSession(routes, 'discovery', {
      questions: [q1, q2],
      sections:  [
        { heading: 'Background', questions: [q1, q2] }
      ],
      answers:      ['First raw answer here.', 'Second raw answer here.'],
      sectionDrafts: []
    });

    const preview = routes.htmlGetPreview('discovery', sid);
    const content = preview.artefactContent;

    assert.ok(content.includes('First raw answer here.'),
      'artefactContent must include first answer under Background heading');
    assert.ok(content.includes('Second raw answer here.'),
      'artefactContent must include second answer under Background heading');
    assert.ok(!content.includes('Q1:'), 'must NOT contain "Q1:" label prefix');
    assert.ok(!content.includes('Q2:'), 'must NOT contain "Q2:" label prefix');
    assert.ok(!content.match(/^A:/m), 'must NOT contain "A:" label prefix at line start');
  });
});

// ── T5.4 — AC4: Flat skill → skill name as H2, answers concatenated ───────────

queue.push(function runT5_4() {
  console.log('\n── T5.4 — AC4: flat skill (no H2 sections) → skill name as H2 heading');
  return test('T5.4 (AC4): flat session uses skill name as H2 heading, answers concatenated without Q/A labels', function() {
    const routes = freshRequire(ROUTES_PATH);

    const q1 = { id: 'q1', text: 'Flat question one, please answer fully.' };
    const q2 = { id: 'q2', text: 'Flat question two, provide all context.' };

    const sid = makeSession(routes, 'discovery', {
      questions: [q1, q2],
      sections:  [{ heading: '', questions: [q1, q2] }],
      answers:   ['Flat answer one.', 'Flat answer two.']
    });

    const preview = routes.htmlGetPreview('discovery', sid);
    const content = preview.artefactContent;

    assert.ok(content.includes('## discovery'),
      'flat skill artefact must use skill name "discovery" as H2 heading');
    assert.ok(content.includes('Flat answer one.'), 'must include first answer');
    assert.ok(content.includes('Flat answer two.'), 'must include second answer');
    assert.ok(!content.includes('Q1:'), 'must NOT contain "Q1:" label prefix');
  });
});

// ── T5.5 — AC5 (smoke): artefactContent is non-empty, artefactPath unchanged ──

queue.push(function runT5_5() {
  console.log('\n── T5.5 — AC5 smoke: artefactContent non-empty, artefactPath format unchanged');
  return test('T5.5 (AC5): htmlGetPreview returns non-empty artefactContent and valid artefactPath', function() {
    const routes = freshRequire(ROUTES_PATH);

    const q1 = { id: 'q1', text: 'What is your background? Please describe.' };
    const sid = makeSession(routes, 'discovery', {
      questions: [q1],
      sections:  [{ heading: 'Background', questions: [q1] }],
      answers:   ['My background.']
    });

    const preview = routes.htmlGetPreview('discovery', sid);

    assert.ok(preview && typeof preview.artefactContent === 'string' && preview.artefactContent.length > 0,
      'artefactContent must be a non-empty string');
    assert.ok(typeof preview.artefactPath === 'string' && preview.artefactPath.length > 0,
      'artefactPath must be a non-empty string');
    // artefactPath must still contain the skill name and session id
    assert.ok(preview.artefactPath.includes('discovery'),
      'artefactPath must contain the skill name');
    assert.ok(preview.artefactPath.endsWith('.md'),
      'artefactPath must end with .md');
  });
});

// ── T5.6 — AC6: Section order preserved ──────────────────────────────────────

queue.push(function runT5_6() {
  console.log('\n── T5.6 — AC6 NFR: section order in artefactContent matches SKILL.md section order');
  return test('T5.6 (AC6 NFR): three-section skill produces Alpha < Beta < Gamma order in artefactContent', function() {
    const routes = freshRequire(ROUTES_PATH);

    const q = { id: 'q1', text: 'This is a question spanning all sections, please answer.' };

    const sid = makeSession(routes, 'discovery', {
      questions: [q, q, q],
      sections:  [
        { heading: 'Alpha',  questions: [q] },
        { heading: 'Beta',   questions: [q] },
        { heading: 'Gamma',  questions: [q] }
      ],
      answers: ['Alpha answer.', 'Beta answer.', 'Gamma answer.']
    });

    const content = routes.htmlGetPreview('discovery', sid).artefactContent;

    const alphaIdx = content.indexOf('## Alpha');
    const betaIdx  = content.indexOf('## Beta');
    const gammaIdx = content.indexOf('## Gamma');

    assert.ok(alphaIdx !== -1, '"## Alpha" must appear in artefactContent');
    assert.ok(betaIdx  !== -1, '"## Beta" must appear in artefactContent');
    assert.ok(gammaIdx !== -1, '"## Gamma" must appear in artefactContent');

    assert.ok(alphaIdx < betaIdx,
      '"## Alpha" must appear before "## Beta". Alpha: ' + alphaIdx + ', Beta: ' + betaIdx);
    assert.ok(betaIdx < gammaIdx,
      '"## Beta" must appear before "## Gamma". Beta: ' + betaIdx + ', Gamma: ' + gammaIdx);
  });
});

// ── T5.7 — AC6 regression: artefactPath derivation unchanged ─────────────────

queue.push(function runT5_7() {
  console.log('\n── T5.7 — AC6 regression: artefactPath format unchanged by dsq.4');
  return test('T5.7 (AC6 regression): artefactPath pattern is artefacts/YYYY-MM-DD-<skill>/session-<id>-output.md', function() {
    const routes = freshRequire(ROUTES_PATH);

    const q1 = { id: 'q1', text: 'What is your background? Please describe your experience.' };
    const sid = makeSession(routes, 'discovery', {
      questions: [q1],
      sections:  [{ heading: 'Background', questions: [q1] }],
      answers:   ['My background.']
    });

    const preview = routes.htmlGetPreview('discovery', sid);
    const p = preview.artefactPath;

    // Must match: artefacts/YYYY-MM-DD-discovery/session-<sid>-output.md
    const pattern = /^artefacts\/\d{4}-\d{2}-\d{2}-discovery\/session-.+-output\.md$/;
    assert.ok(pattern.test(p),
      'artefactPath must match "artefacts/YYYY-MM-DD-discovery/session-<id>-output.md", got: ' + p);
  });
});

// ── Run queue ────────────────────────────────────────────────────────────────

(async function runAll() {
  console.log('check-dsq4-section-artefact-assembly.js — 7 tests\n');
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
