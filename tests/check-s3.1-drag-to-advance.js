// check-s3.1-drag-to-advance.js -- TDD tests for s3.1 (Epic 3, kanban boards feature)
// Story: artefacts/2026-07-24-interactive-kanban-boards/stories/s3.1-drag-to-advance.md
// Test plan: artefacts/2026-07-24-interactive-kanban-boards/test-plans/s3.1-drag-to-advance-test-plan.md
//
// AC1-AC3 (real browser drag/drop behaviour) are covered by
// tests/e2e/s3.1-drag-to-advance.spec.js (Playwright, real browser --
// required, since drop-target resolution from pointer coordinates cannot be
// computed by a DOM-simulation environment). This file covers:
//   AC4 (source-level): the drag path reuses S1.1's own error-surfacing
//     mechanism verbatim, not a duplicated/divergent one -- a real validation
//     failure cannot be produced through this repo's own E2E harness (see
//     decisions.md and the E2E spec's own header comment for why), so this
//     is verified by confirming both call paths share the exact same
//     functions, which S1.1's own AC5 integration test already exercises.
//   AC5: the click Advance action remains fully present and wired
//     alongside the new draggable attribute on the same ready card --
//     drag is additive, not a replacement.
//   Plus source-level checks: only a ready, non-validation-failed card is
//     draggable; the column drop-target wiring is present.

'use strict';

const assert = require('assert');
const path = require('path');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  PASS: ' + name); })
    .catch(function(err) {
      failed++;
      failures.push({ name: name, err: err });
      console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err));
    });
}

const { _renderKanbanColumns } = require('../src/web-ui/views/kanban-view');

const queue = [];

// ---------------------------------------------------------------------------
// Source: only a ready, non-validation-failed card is draggable (AC3's
// "doesn't initiate" branch)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('readyCardIsDraggableWithDragStartWired: a ready card gets draggable="true" and ondragstart', function() {
    const html = _renderKanbanColumns({
      columns: [{ stage: 'review', cards: [{ id: 'j-ready', title: 'Ready', health: 'green', ready: true }] }]
    });
    assert.ok(/data-journey-id="j-ready"[^>]* draggable="true" ondragstart="kbDragStart\(event\)"/.test(html),
      'expected the ready card to carry draggable="true" ondragstart="kbDragStart(event)"');
  });
});

queue.push(function() {
  return test('notReadyCardIsNotDraggable: a not-ready card has no draggable attribute at all', function() {
    const html = _renderKanbanColumns({
      columns: [{ stage: 'review', cards: [{ id: 'j-notready', title: 'Not Ready', health: 'amber', ready: false }] }]
    });
    const cardMatch = html.match(/<div class="kb-card[^>]*data-journey-id="j-notready"[^>]*>/);
    assert.ok(cardMatch, 'expected to find the not-ready card element');
    assert.ok(!/draggable/.test(cardMatch[0]), 'expected the not-ready card to have no draggable attribute, got: ' + cardMatch[0]);
  });
});

queue.push(function() {
  return test('validationFailedCardIsNotDraggable: a card that just failed validation has no draggable attribute (not a routine ready state)', function() {
    const html = _renderKanbanColumns({
      columns: [{ stage: 'definition-of-ready', cards: [{ id: 'j-failed', title: 'Failed', health: 'red', ready: true, validationFailed: true, validationFailedReason: 'bad artefact' }] }]
    });
    const cardMatch = html.match(/<div class="kb-card[^>]*data-journey-id="j-failed"[^>]*>/);
    assert.ok(cardMatch, 'expected to find the validation-failed card element');
    assert.ok(!/draggable/.test(cardMatch[0]), 'expected a validation-failed card to have no draggable attribute, got: ' + cardMatch[0]);
  });
});

queue.push(function() {
  return test('cardWithNoReadinessDataIsNotDraggable: a card with no readiness info at all (legacy caller) has no draggable attribute -- zero behaviour change for callers that never supply readiness', function() {
    const html = _renderKanbanColumns({
      columns: [{ stage: 'review', cards: [{ id: 'j-legacy', title: 'Legacy', health: 'green' }] }]
    });
    const cardMatch = html.match(/<div class="kb-card[^>]*data-journey-id="j-legacy"[^>]*>/);
    assert.ok(cardMatch, 'expected to find the legacy card element');
    assert.ok(!/draggable/.test(cardMatch[0]), 'expected a card with no readiness data to have no draggable attribute');
  });
});

// ---------------------------------------------------------------------------
// Source: columns are wired as valid drop targets
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('columnsAreWiredAsDropTargets: every column has ondragover/ondrop wired to the shared handlers', function() {
    const html = _renderKanbanColumns({
      columns: [{ stage: 'review', cards: [] }, { stage: 'test-plan', cards: [] }]
    });
    const columnMatches = html.match(/<div class="kb-column"[^>]*>/g) || [];
    assert.strictEqual(columnMatches.length, 2, 'expected 2 column elements');
    columnMatches.forEach(function(col) {
      assert.ok(/ondragover="kbColumnDragOver\(event\)"/.test(col), 'expected every column to wire ondragover, got: ' + col);
      assert.ok(/ondrop="kbColumnDrop\(event\)"/.test(col), 'expected every column to wire ondrop, got: ' + col);
    });
  });
});

// ---------------------------------------------------------------------------
// AC4 (source-level) -- drag and click share the exact same advance/error
// functions, not a duplicated/divergent mechanism.
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('dragAndClickShareTheSameAdvanceAndErrorFunctions: kbColumnDrop and kbAdvanceCard both call _kbTriggerAdvance and _kbAdvanceErrorMessage -- no separate/duplicated drag-specific logic', function() {
    const html = _renderKanbanColumns({ columns: [{ stage: 'review', cards: [] }] });
    assert.ok(/function _kbTriggerAdvance\(journeyId\)/.test(html), 'expected a single shared _kbTriggerAdvance function');
    assert.ok(/function _kbAdvanceErrorMessage\(body\)/.test(html), 'expected a single shared _kbAdvanceErrorMessage function');
    // kbAdvanceCard (the click path) must call the shared advance function, not its own inline fetch.
    const advanceCardBody = html.slice(html.indexOf('function kbAdvanceCard'), html.indexOf('function _kbTriggerAdvance'));
    assert.ok(/_kbTriggerAdvance\(journeyId\)/.test(advanceCardBody), 'expected kbAdvanceCard to call the shared _kbTriggerAdvance, got: ' + advanceCardBody);
    // kbColumnDrop (the drag path) must call the exact same shared functions.
    const dropBody = html.slice(html.indexOf('function kbColumnDrop'));
    assert.ok(/_kbTriggerAdvance\(data\.journeyId\)/.test(dropBody), 'expected kbColumnDrop to call the shared _kbTriggerAdvance, got: ' + dropBody);
    assert.ok(/_kbAdvanceErrorMessage\(result\.body\)/.test(dropBody), 'expected kbColumnDrop to surface errors via the shared _kbAdvanceErrorMessage, same as the click path, got: ' + dropBody);
  });
});

// ---------------------------------------------------------------------------
// AC5 -- the click Advance action remains fully present alongside the new
// draggable attribute; drag is additive, not a replacement.
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('clickAlternativeStillWorksAlongsideDrag: a ready card carries BOTH the draggable attribute AND the existing clickable Advance button', function() {
    const html = _renderKanbanColumns({
      columns: [{ stage: 'review', cards: [{ id: 'j-both', title: 'Both', health: 'green', ready: true }] }]
    });
    assert.ok(/draggable="true"/.test(html), 'expected the draggable attribute to still be present');
    assert.ok(/class="kb-advance-btn" data-journey-id="j-both" onclick="kbAdvanceCard\(this\)"/.test(html),
      'expected the existing click Advance button to remain fully present and wired, unchanged by this story');
  });
});

(async function() {
  console.log('check-s3.1-drag-to-advance.js');
  for (let i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
