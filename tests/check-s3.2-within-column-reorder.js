'use strict';
// check-s3.2-within-column-reorder.js -- TDD tests for s3.2 (Epic 3, kanban boards feature)
// Story: artefacts/2026-07-24-interactive-kanban-boards/stories/s3.2-within-column-reorder.md
// Test plan: artefacts/2026-07-24-interactive-kanban-boards/test-plans/s3.2-within-column-reorder-test-plan.md
//
// AC1/AC3 are CSS-layout-dependent (real drag-and-drop) and covered by
// tests/e2e/s3.2-within-column-reorder.spec.js. This file covers the
// source-level shape of that behaviour plus AC2 (persistence) and AC4
// (non-drag keyboard alternative).

var assert = require('assert');

var passed = 0; var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  PASS: ' + name);
  } catch (err) {
    failed++; console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err));
  }
}

var { _renderKanbanColumns } = require('../src/web-ui/views/kanban-view');

function extractScript(html) {
  var m = html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('no <script> tag found in rendered HTML');
  return m[1];
}

// The whole script is a single '' (no-separator) join of many small string
// literals -- there are no newlines to anchor on. Extract a named function's
// full body by counting braces from its "function name(" start up to the
// matching close, rather than a fragile fixed-length slice.
function extractFunctionBody(script, fnName) {
  var start = script.indexOf('function ' + fnName + '(');
  if (start === -1) throw new Error('function ' + fnName + ' not found in script');
  var openBrace = script.indexOf('{', start);
  var depth = 0;
  for (var i = openBrace; i < script.length; i++) {
    if (script[i] === '{') depth++;
    else if (script[i] === '}') {
      depth--;
      if (depth === 0) return script.slice(start, i + 1);
    }
  }
  throw new Error('unbalanced braces while extracting ' + fnName);
}

// ===========================================================================
// AC4 -- non-drag reorder alternative exists, keyboard-activatable
// ===========================================================================

test('AC4: a multi-card column renders up/down move buttons for every card', function() {
  var html = _renderKanbanColumns({
    columns: [{ stage: 'review', cards: [
      { id: 'j-1', title: 'First', health: 'green' },
      { id: 'j-2', title: 'Second', health: 'green' }
    ] }]
  });
  assert.ok(/data-journey-id="j-1" data-direction="up" onclick="kbMoveCard\(this, event\)"/.test(html), 'expected an up button for j-1');
  assert.ok(/data-journey-id="j-1" data-direction="down" onclick="kbMoveCard\(this, event\)"/.test(html), 'expected a down button for j-1');
  assert.ok(/data-journey-id="j-2" data-direction="up" onclick="kbMoveCard\(this, event\)"/.test(html), 'expected an up button for j-2');
});

test('AC4: the first card in a column has its up button disabled, the last has its down button disabled', function() {
  var html = _renderKanbanColumns({
    columns: [{ stage: 'review', cards: [
      { id: 'j-first', title: 'First', health: 'green' },
      { id: 'j-mid', title: 'Middle', health: 'green' },
      { id: 'j-last', title: 'Last', health: 'green' }
    ] }]
  });
  assert.ok(/data-journey-id="j-first" data-direction="up" onclick="kbMoveCard\(this, event\)" disabled/.test(html), 'expected j-first\'s up button disabled');
  assert.ok(!/data-journey-id="j-first" data-direction="down" onclick="kbMoveCard\(this, event\)" disabled/.test(html), 'expected j-first\'s down button NOT disabled');
  assert.ok(/data-journey-id="j-last" data-direction="down" onclick="kbMoveCard\(this, event\)" disabled/.test(html), 'expected j-last\'s down button disabled');
  assert.ok(!/data-journey-id="j-mid" data-direction="up" onclick="kbMoveCard\(this, event\)" disabled/.test(html), 'expected j-mid\'s up button NOT disabled');
  assert.ok(!/data-journey-id="j-mid" data-direction="down" onclick="kbMoveCard\(this, event\)" disabled/.test(html), 'expected j-mid\'s down button NOT disabled');
});

test('AC4: a single-card column renders no reorder controls at all (nothing to reorder against)', function() {
  var html = _renderKanbanColumns({
    columns: [{ stage: 'review', cards: [{ id: 'j-only', title: 'Only', health: 'green' }] }]
  });
  // Match the rendered element only (class="kb-reorder-controls">), not the
  // CSS rule (.kb-reorder-controls {), which is always present in <style>.
  assert.ok(!/class="kb-reorder-controls">/.test(html), 'expected no rendered reorder-controls element for a single-card column');
});

test('AC4: reorder controls render regardless of readiness -- not gated the same way Advance is', function() {
  var html = _renderKanbanColumns({
    columns: [{ stage: 'review', cards: [
      { id: 'j-notready', title: 'Not ready', health: 'amber', ready: false },
      { id: 'j-ready', title: 'Ready', health: 'green', ready: true }
    ] }]
  });
  assert.ok(/data-journey-id="j-notready" data-direction="up"/.test(html), 'expected reorder controls on the not-ready card too');
  assert.ok(/data-journey-id="j-ready" data-direction="up"/.test(html), 'expected reorder controls on the ready card too');
});

// ===========================================================================
// AC1/AC3 shape checks -- the actual drag/drop mechanics are E2E-covered,
// but the source-level wiring must exist and be mutually exclusive with S3.1.
// ===========================================================================

test('kbColumnDrop calls the within-column reorder helper when target stage equals source stage', function() {
  var html = _renderKanbanColumns({
    columns: [{ stage: 'review', cards: [{ id: 'j-1', title: 'A', health: 'green', ready: true }] }]
  });
  var script = extractScript(html);
  assert.ok(/if \(targetStage === data\.sourceStage\) \{ _kbReorderWithinColumn\(event, targetColumn, data\.journeyId\); return; \}/.test(script),
    'expected the within-column branch to call _kbReorderWithinColumn, not silently no-op');
});

test('a between-column drop never reaches _kbReorderWithinColumn (mutually exclusive with S3.1 advance logic)', function() {
  var html = _renderKanbanColumns({
    columns: [{ stage: 'review', cards: [{ id: 'j-1', title: 'A', health: 'green', ready: true }] }]
  });
  var script = extractScript(html);
  // The advance path (_kbTriggerAdvance) must appear strictly AFTER the
  // early-return guard for the within-column case -- proves the two are
  // structurally exclusive, not just conditionally similar.
  var guardIdx = script.indexOf('_kbReorderWithinColumn(event, targetColumn, data.journeyId); return;');
  var advanceIdx = script.indexOf('_kbTriggerAdvance(data.journeyId)');
  assert.ok(guardIdx !== -1 && advanceIdx !== -1 && guardIdx < advanceIdx,
    'expected the within-column guard to appear before, and return before reaching, the advance call');
});

// ===========================================================================
// AC2 -- persistence beyond the current page view
// ===========================================================================

test('AC2: _kbPersistColumnOrder writes the current DOM card order to localStorage, scoped by path + stage', function() {
  var html = _renderKanbanColumns({
    columns: [{ stage: 'review', cards: [{ id: 'j-1', title: 'A', health: 'green' }] }]
  });
  var script = extractScript(html);
  assert.ok(/function _kbColumnOrderKey\(stage\) \{\s*return "kb-order:" \+ window\.location\.pathname \+ ":" \+ stage;/.test(script),
    'expected the storage key to be scoped by pathname + stage (so each of the 3 board scopes stays independent, per Out of Scope)');
  assert.ok(/window\.localStorage\.setItem\(_kbColumnOrderKey\(stage\), JSON\.stringify\(ids\)\)/.test(script),
    'expected the current DOM order to be written to localStorage');
});

test('AC2: _kbApplyPersistedOrder reads localStorage and reorders each column on page load', function() {
  var html = _renderKanbanColumns({
    columns: [{ stage: 'review', cards: [{ id: 'j-1', title: 'A', health: 'green' }] }]
  });
  var script = extractScript(html);
  assert.ok(/function _kbApplyPersistedOrder\(\) \{/.test(script), 'expected _kbApplyPersistedOrder to be defined');
  assert.ok(/window\.localStorage\.getItem\(_kbColumnOrderKey\(stage\)\)/.test(script), 'expected it to read the per-stage saved order');
  // Script is a no-separator join (no newlines to anchor a /^...$/m match
  // on) -- count occurrences instead: 1 for the definition, 1+ for the call.
  var occurrences = script.split('_kbApplyPersistedOrder').length - 1;
  assert.ok(occurrences >= 2, 'expected _kbApplyPersistedOrder() to actually be invoked at page load, not just defined (found ' + occurrences + ' occurrence(s))');
});

test('kbMoveCard (AC4) calls the same persistence helper the drag path uses -- proves a shared mechanism, not a second implementation', function() {
  var html = _renderKanbanColumns({
    columns: [{ stage: 'review', cards: [{ id: 'j-1', title: 'A', health: 'green' }] }]
  });
  var script = extractScript(html);
  var moveCardBody = extractFunctionBody(script, 'kbMoveCard');
  var dragReorderBody = extractFunctionBody(script, '_kbReorderWithinColumn');
  assert.ok(/_kbPersistColumnOrder\(columnEl\)/.test(moveCardBody), 'expected kbMoveCard to call _kbPersistColumnOrder');
  assert.ok(/_kbPersistColumnOrder\(columnEl\)/.test(dragReorderBody), 'expected _kbReorderWithinColumn to call the same _kbPersistColumnOrder');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
