'use strict';
/**
 * check-dsq4-section-artefact-assembly.js
 *
 * Tests for dsq.4 â€” Section artefact assembly (model-first architecture).
 * Rewritten for mfc.1: htmlGetPreview returns model-produced artefact content
 * (session.artefactContent / session.artefactPath), not assembled sections.
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

const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

const queue = [];

// â”€â”€ T5.1 â€” AC1: htmlGetPreview returns empty strings for fresh session â”€â”€â”€â”€â”€â”€â”€â”€

queue.push(function runT5_1() {
  console.log('\nâ”€â”€ T5.1 â€” AC1: htmlGetPreview returns empty strings for session with no artefact yet');
  return test('T5.1 (AC1): htmlGetPreview returns {artefactContent:"", artefactPath:""} for fresh session', function() {
    const routes = freshRequire(ROUTES_PATH);

    const sid = 'test-dsq4-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: '',
      turns: [], artefactContent: null, artefactPath: null, done: false
    });

    const preview = routes.htmlGetPreview('discovery', sid);

    assert.ok(preview && typeof preview === 'object', 'must return an object');
    assert.strictEqual(preview.artefactContent, '', 'artefactContent must be "" when null in session');
    assert.strictEqual(preview.artefactPath, '', 'artefactPath must be "" when null in session');
  });
});

// â”€â”€ T5.2 â€” AC2: htmlGetPreview returns session.artefactContent when set â”€â”€â”€â”€â”€â”€â”€

queue.push(function runT5_2() {
  console.log('\nâ”€â”€ T5.2 â€” AC2: htmlGetPreview returns session.artefactContent');
  return test('T5.2 (AC2): htmlGetPreview returns the full model artefact content from session', function() {
    const routes = freshRequire(ROUTES_PATH);

    const expectedContent = '# Discovery\n\n## Background\nThe background content.\n\n## Goals\nThe goals content.';
    const sid = 'test-dsq4-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: '',
      turns: [], artefactContent: expectedContent,
      artefactPath: 'artefacts/2026-05-05-discovery/discovery.md', done: true
    });

    const preview = routes.htmlGetPreview('discovery', sid);

    assert.strictEqual(preview.artefactContent, expectedContent,
      'htmlGetPreview must return session.artefactContent verbatim');
  });
});

// â”€â”€ T5.3 â€” AC3: htmlGetPreview returns session.artefactPath when set â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

queue.push(function runT5_3() {
  console.log('\nâ”€â”€ T5.3 â€” AC3: htmlGetPreview returns session.artefactPath');
  return test('T5.3 (AC3): htmlGetPreview returns session.artefactPath', function() {
    const routes = freshRequire(ROUTES_PATH);

    const expectedPath = 'artefacts/2026-05-05-fast-checkout/discovery.md';
    const sid = 'test-dsq4-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: '',
      turns: [], artefactContent: '# Content', artefactPath: expectedPath, done: true
    });

    const preview = routes.htmlGetPreview('discovery', sid);

    assert.strictEqual(preview.artefactPath, expectedPath,
      'htmlGetPreview must return session.artefactPath');
  });
});

// â”€â”€ T5.4 â€” AC4: artefactPath set by htmlSubmitTurn contains skill name â”€â”€â”€â”€â”€â”€â”€â”€â”€

queue.push(function runT5_4() {
  console.log('\nâ”€â”€ T5.4 â€” AC4: artefactPath set by htmlSubmitTurn contains session.skillName');
  return test('T5.4 (AC4): artefactPath set by htmlSubmitTurn contains the session skill name', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() {
      return [
        'Here is your artefact:',
        '---ARTEFACT-START---',
        '# Discovery Artefact',
        '---ARTEFACT-END---',
        '---SLUG---',
        '2026-05-05-my-feature'
      ].join('\n');
    });

    const sid = 'test-dsq4-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test',
      systemPrompt: 'TEST SYSTEM PROMPT', turns: [],
      artefactContent: null, artefactPath: null, done: false
    });

    await routes.htmlSubmitTurn('discovery', sid, 'Tell me about the problem.', 'fake-tok');

    const preview = routes.htmlGetPreview('discovery', sid);

    assert.ok(preview.artefactPath.includes('discovery'),
      'artefactPath must contain the skill name "discovery", got: ' + preview.artefactPath);
  });
});

// â”€â”€ T5.5 â€” AC5 smoke: artefactContent non-empty, artefactPath ends with .md â”€â”€

queue.push(function runT5_5() {
  console.log('\nâ”€â”€ T5.5 â€” AC5 smoke: artefactContent non-empty, artefactPath ends with .md');
  return test('T5.5 (AC5): htmlGetPreview returns non-empty artefactContent and path ending with .md', function() {
    const routes = freshRequire(ROUTES_PATH);

    const sid = 'test-dsq4-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: '',
      turns: [], artefactContent: '## Background\nSome content.',
      artefactPath: 'artefacts/2026-05-05-test/discovery.md', done: true
    });

    const preview = routes.htmlGetPreview('discovery', sid);

    assert.ok(preview.artefactContent.length > 0, 'artefactContent must be a non-empty string');
    assert.ok(preview.artefactPath.endsWith('.md'), 'artefactPath must end with .md');
  });
});

// â”€â”€ T5.6 â€” AC6 NFR: model artefact returned verbatim, no Q/A prefixes â”€â”€â”€â”€â”€â”€â”€â”€â”€

queue.push(function runT5_6() {
  console.log('\nâ”€â”€ T5.6 â€” AC6 NFR: artefactContent is verbatim model output, no Q/A prefixes');
  return test('T5.6 (AC6 NFR): model-produced artefact contains model content verbatim without Q/A prefixes', function() {
    const routes = freshRequire(ROUTES_PATH);

    const modelContent = [
      '# Discovery Artefact',
      '',
      '## Background',
      'The product is a task management tool for remote teams.',
      '',
      '## Problem Statement',
      'Teams struggle to track async work across time zones.'
    ].join('\n');

    const sid = 'test-dsq4-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: '',
      turns: [], artefactContent: modelContent,
      artefactPath: 'artefacts/2026-05-05-test/discovery.md', done: true
    });

    const preview = routes.htmlGetPreview('discovery', sid);

    assert.ok(!preview.artefactContent.includes('Q1:'), 'must not contain "Q1:" prefix');
    assert.ok(!preview.artefactContent.match(/^A:/m), 'must not contain "A:" prefix at line start');
    assert.ok(preview.artefactContent.includes('## Background'), 'must contain "## Background" from model output');
    assert.ok(preview.artefactContent.includes('## Problem Statement'), 'must contain "## Problem Statement"');
  });
});

// â”€â”€ T5.7 â€” AC6 regression: unknown session returns empty strings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

queue.push(function runT5_7() {
  console.log('\nâ”€â”€ T5.7 â€” AC6 regression: unknown session ID returns empty strings from htmlGetPreview');
  return test('T5.7 (AC6 regression): htmlGetPreview returns {artefactContent:"", artefactPath:""} for unknown session', function() {
    const routes = freshRequire(ROUTES_PATH);

    const preview = routes.htmlGetPreview('discovery', 'non-existent-session-id-xyz');

    assert.ok(preview && typeof preview === 'object', 'must return an object');
    assert.strictEqual(preview.artefactContent, '', 'artefactContent must be "" for unknown session');
    assert.strictEqual(preview.artefactPath, '', 'artefactPath must be "" for unknown session');
  });
});

// â”€â”€ Run queue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

(async function runAll() {
  console.log('check-dsq4-section-artefact-assembly.js â€” 7 tests\n');
  for (const fn of queue) {
    await fn();
  }
  console.log('\nâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f, i) {
      console.log('  ' + (i + 1) + '. ' + f.name + '\n     ' + f.msg);
    });
  }
  if (failed > 0) { process.exit(1); }
})();
