// check-s1.2-not-ready-explanation.js -- TDD tests for s1.2 (Epic 1, kanban boards feature)
// Story: artefacts/2026-07-24-interactive-kanban-boards/stories/s1.2-not-ready-explanation.md
// Test plan: artefacts/2026-07-24-interactive-kanban-boards/test-plans/s1.2-not-ready-explanation-test-plan.md
//
// Covers: Unit (notReadyIndicatorHasTextLabelNotColourOnly, readyCardShowsNoNotReadyIndicator,
// validationFailureStyledDistinctlyFromNotReady), Integration (hoverRevealsDetailedReason).
// E2E (notReadyIndicatorVisibleAndKeyboardFocusable) lives in
// tests/e2e/s1.2-not-ready-explanation.spec.js (Playwright, separate run).

'use strict';

const assert = require('assert');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  PASS: ' + name);
  } catch (err) {
    failed++;
    failures.push({ name: name, err: err });
    console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err));
  }
}

const { renderKanban } = require('../src/web-ui/views/kanban-view');

// ---------------------------------------------------------------------------
// Unit: notReadyIndicatorHasTextLabelNotColourOnly (AC1)
// ---------------------------------------------------------------------------
test('notReadyIndicatorHasTextLabelNotColourOnly: not-ready card renders a real text label, not colour-only', function() {
  const columns = [{ stage: 'discovery', cards: [
    { id: 'j1', title: 'Not Ready Feature', health: 'green', ready: false }
  ] }];
  const html = renderKanban({ columns: columns });
  assert.ok(/kb-not-ready/.test(html), 'expected a not-ready indicator element to be rendered');
  assert.ok(/Not ready to advance/i.test(html), 'expected a plain-language text label, not merely a CSS colour treatment');
});

// ---------------------------------------------------------------------------
// Unit: readyCardShowsNoNotReadyIndicator (AC3)
// ---------------------------------------------------------------------------
test('readyCardShowsNoNotReadyIndicator: ready card shows no not-ready indicator, Advance action IS present and distinguishable', function() {
  const columns = [{ stage: 'discovery', cards: [
    { id: 'j2', title: 'Ready Feature', health: 'green', ready: true }
  ] }];
  const html = renderKanban({ columns: columns });
  assert.ok(!/<div class="kb-not-ready"/.test(html), 'no not-ready indicator <div> element rendered for a ready card (the CSS rule name alone always appears in the static stylesheet, so this checks for the actual element)');
  assert.ok(/<button[^>]*class="kb-advance-btn"/.test(html), 'Advance action IS present for a ready card');
  assert.ok(/class="kb-card [^"]*kb-card--ready/.test(html), 'ready card\'s own wrapper element carries the distinct kb-card--ready class, distinguishable from a not-ready card');
});

// ---------------------------------------------------------------------------
// Unit: validationFailureStyledDistinctlyFromNotReady (AC4)
// ---------------------------------------------------------------------------
test('validationFailureStyledDistinctlyFromNotReady: a card that just failed validation gets a distinct class/text from the routine not-ready case', function() {
  const notReadyColumns = [{ stage: 'discovery', cards: [
    { id: 'j3', title: 'Not Ready Feature', health: 'green', ready: false }
  ] }];
  const notReadyHtml = renderKanban({ columns: notReadyColumns });

  const validationFailedColumns = [{ stage: 'discovery', cards: [
    { id: 'j4', title: 'Failed Feature', health: 'green', ready: false, validationFailed: true, validationFailedReason: 'H3: AC section missing or malformed' }
  ] }];
  const validationFailedHtml = renderKanban({ columns: validationFailedColumns });

  assert.ok(/class="kb-card [^"]*kb-card--not-ready/.test(notReadyHtml), 'routine not-ready card\'s wrapper element carries the kb-card--not-ready class');
  assert.ok(!/class="kb-card [^"]*kb-card--validation-failed/.test(notReadyHtml), 'routine not-ready card\'s wrapper element must NOT carry the validation-failed class');

  assert.ok(/class="kb-card [^"]*kb-card--validation-failed/.test(validationFailedHtml), 'validation-failed card\'s wrapper element carries its own distinct kb-card--validation-failed class');
  assert.ok(!/class="kb-card [^"]*kb-card--not-ready/.test(validationFailedHtml), 'validation-failed card must not ALSO carry the plain not-ready class (mutually exclusive state)');
  assert.ok(/Advance failed/i.test(validationFailedHtml), 'validation-failed card shows its own distinct text, not the routine not-ready label');
  assert.ok(!/<div class="kb-not-ready"/.test(validationFailedHtml), 'validation-failed card must not render the routine not-ready indicator element/label');
});

// ---------------------------------------------------------------------------
// Integration: hoverRevealsDetailedReason (AC2)
// ---------------------------------------------------------------------------
test('hoverRevealsDetailedReason: a more detailed explanation is available beyond the short label (title attribute)', function() {
  const columns = [{ stage: 'review', cards: [
    { id: 'j5', title: 'In Progress Feature', health: 'green', ready: false }
  ] }];
  const html = renderKanban({ columns: columns });
  // Short label always visible:
  assert.ok(/Not ready to advance/i.test(html), 'short label always visible');
  // Detailed reason available via title attribute, naming the real stage (plain language, CLAUDE.md convention):
  const titleMatch = html.match(/title="([^"]*review[^"]*)"/i);
  assert.ok(titleMatch, 'expected a title attribute containing a detailed, stage-named explanation. HTML snippet: ' + html.slice(html.indexOf('kb-not-ready') - 50, html.indexOf('kb-not-ready') + 250));
  assert.ok(titleMatch[1].length > 'Not ready to advance'.length, 'detailed title text must be longer/more specific than the short label');
});

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
console.log('\ncheck-s1.2-not-ready-explanation.js');
console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(function(f) {
    console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err));
  });
  process.exit(1);
}
