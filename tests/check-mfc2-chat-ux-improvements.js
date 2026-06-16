'use strict';
/**
 * check-mfc2-chat-ux-improvements.js
 *
 * TDD tests for mfc.2 — Chat UX improvements:
 *   AC1/AC2: DOM-update client script (scroll, no-reload, typing indicator)
 *   AC3: Live draft panel update on artefactContent
 *   AC4: No question counter in rendered HTML
 *   AC5: npm test passes
 *
 * Run: node tests/check-mfc2-chat-ux-improvements.js
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

const CHAT_VIEW_PATH = path.resolve(__dirname, '../src/web-ui/views/chat-view.js');

const queue = [];

// ── T2.1 — AC4: No question counter in rendered HTML ─────────────────────────

queue.push(function runT2_1() {
  console.log('\n── T2.1 — AC4: renderChat does not include question counter text');
  return test('T2.1 (AC4): rendered HTML does not contain "questions answered"', function() {
    const { renderChat } = freshRequire(CHAT_VIEW_PATH);
    const html = renderChat({
      skillName:   'discovery',
      skillLabel:  'Discovery',
      featureSlug: 'test-feature',
      sessionId:   'sess-1',
      questionIndex:    3,
      totalQuestions:   7,
      currentQuestion:  'What is the problem?',
      priorQA:     [],
      draftSections: [],
      pendingConfirmation: false,
      userInitial: 'M'
    });
    assert.ok(
      !html.includes('questions answered'),
      'HTML must not contain "questions answered" — question counter must be removed'
    );
  });
});

queue.push(function runT2_2() {
  console.log('\n── T2.2 — AC4: rendered HTML does not contain question count progress indicators');
  return test('T2.2 (AC4): rendered HTML does not contain numeric question count in sub-heading', function() {
    const { renderChat } = freshRequire(CHAT_VIEW_PATH);
    const html = renderChat({
      skillName:   'discovery',
      skillLabel:  'Discovery',
      featureSlug: 'test-feature',
      sessionId:   'sess-1',
      questionIndex:    3,
      totalQuestions:   7,
      currentQuestion:  'What is the problem?',
      priorQA:     [],
      draftSections: [],
      pendingConfirmation: false,
      userInitial: 'M'
    });
    // Should not show "3 of 7" or "7 questions remaining" type text in the header
    assert.ok(
      !html.includes('3 of 7') && !html.includes('questions remaining'),
      'HTML must not contain question count fractions or "remaining" text'
    );
  });
});

// ── T2.3 — AC3: Canvas panel element has id="canvas-panel" ───────────────────

queue.push(function runT2_3() {
  console.log('\n── T2.3 — AC3: right panel has id="canvas-panel" for live JS update');
  return test('T2.3 (AC3): rendered HTML includes element with id="canvas-panel"', function() {
    const { renderChat } = freshRequire(CHAT_VIEW_PATH);
    const html = renderChat({
      skillName:   'discovery',
      skillLabel:  'Discovery',
      featureSlug: 'test-feature',
      sessionId:   'sess-1',
      questionIndex:    1,
      totalQuestions:   5,
      currentQuestion:  'What is the problem?',
      priorQA:     [],
      draftSections: [],
      pendingConfirmation: false,
      userInitial: 'M'
    });
    assert.ok(
      html.includes('id="canvas-panel"'),
      'HTML must include an element with id="canvas-panel" for the live canvas panel'
    );
  });
});

// ── T2.4 — AC3: artefactContent populates canvas-panel on server render ─────

queue.push(function runT2_4() {
  console.log('\n── T2.4 — AC3: draftSections renders inside canvas-panel element');
  return test('T2.4 (AC3): when draftSections is provided, its content appears inside #canvas-panel', function() {
    const { renderChat } = freshRequire(CHAT_VIEW_PATH);
    const html = renderChat({
      skillName:   'discovery',
      skillLabel:  'Discovery',
      featureSlug: 'test-feature',
      sessionId:   'sess-1',
      questionIndex:    1,
      totalQuestions:   1,
      currentQuestion:  '',
      priorQA:     [],
      draftSections: [{ title: 'Problem statement', body: 'A real problem', state: 'drafted' }],
      pendingConfirmation: false,
      userInitial: 'M'
    });
    const canvasIdx = html.indexOf('id="canvas-panel"');
    const contentIdx = html.indexOf('A real problem');
    assert.ok(canvasIdx !== -1, 'canvas-panel element must exist');
    assert.ok(contentIdx > canvasIdx, 'draft section content must appear after (inside) canvas-panel element');
  });
});

// ── T2.5 — AC1/AC2: client script includes scrollToBottom logic ──────────────

queue.push(function runT2_5() {
  console.log('\n── T2.5 — AC1/AC2: client script includes scroll-to-bottom logic');
  return test('T2.5 (AC1): rendered HTML client script includes scrollTop = scrollHeight', function() {
    const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
    const routes = freshRequire(ROUTES_PATH);
    // We can't easily invoke _renderChatPage directly (it's private), so we
    // verify the pattern appears in the source file itself.
    const fs = require('fs');
    const src = fs.readFileSync(ROUTES_PATH, 'utf8');
    assert.ok(
      src.includes('scrollTop') && src.includes('scrollHeight'),
      'skills.js must include scrollTop = scrollHeight logic in the client script'
    );
  });
});

// ── T2.6 — AC2: client script does not use window.location.reload ────────────

queue.push(function runT2_6() {
  console.log('\n── T2.6 — AC2: client script does not reload page on normal turn response');
  return test('T2.6 (AC2): skills.js client script does not call window.location.reload()', function() {
    const fs = require('fs');
    const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
    const src = fs.readFileSync(ROUTES_PATH, 'utf8');
    // Extract just the inline client script section (between <script> and </script>)
    // to avoid false positives from comments or test infrastructure
    const scriptStart = src.indexOf("'<script>',");
    const scriptEnd = src.indexOf("'</script>'", scriptStart);
    const scriptBlock = scriptStart !== -1 && scriptEnd !== -1
      ? src.slice(scriptStart, scriptEnd)
      : src;
    assert.ok(
      !scriptBlock.includes('window.location.reload()'),
      'client script must not call window.location.reload() — DOM updates should be used instead'
    );
  });
});

// ── T2.7 — AC3: client script updates canvas-panel on artefactContent ───────

queue.push(function runT2_7() {
  console.log('\n── T2.7 — AC3: client script updates #canvas-panel when data.artefactContent present');
  return test('T2.7 (AC3): skills.js client script references canvas-panel element', function() {
    const fs = require('fs');
    const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
    const src = fs.readFileSync(ROUTES_PATH, 'utf8');
    assert.ok(
      src.includes('canvas-panel'),
      'skills.js client script must reference "canvas-panel" to update the live canvas panel'
    );
  });
});

// ── T2.8 — model label rendered in chat header ────────────────────────────────

queue.push(function runT2_8() {
  console.log('\n── T2.8 — model label shown in chat header when modelLabel is provided');
  return test('T2.8: renderChat renders modelLabel as a badge in the header', function() {
    const { renderChat } = freshRequire(CHAT_VIEW_PATH);
    const html = renderChat({
      skillName:   'discovery',
      skillLabel:  'Discovery',
      featureSlug: 'test-feature',
      sessionId:   'sess-1',
      questionIndex:    1,
      totalQuestions:   1,
      currentQuestion:  'What is the problem?',
      priorQA:     [],
      draftSections: [],
      pendingConfirmation: false,
      userInitial: 'M',
      modelLabel:  'claude-sonnet-4.6'
    });
    assert.ok(
      html.includes('claude-sonnet-4.6'),
      'rendered HTML must contain the modelLabel text "claude-sonnet-4.6" in the header'
    );
  });
});

// ── Run all ───────────────────────────────────────────────────────────────────

(async function main() {
  console.log('=== mfc.2 — Chat UX improvements ===');
  for (const fn of queue) {
    await fn();
  }
  console.log('\n--- Results ---');
  console.log('Passed: ' + passed);
  console.log('Failed: ' + failed);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) {
      console.log('  FAIL: ' + f.name);
      console.log('        ' + f.msg);
    });
    process.exit(1);
  }
  process.exit(0);
})();
