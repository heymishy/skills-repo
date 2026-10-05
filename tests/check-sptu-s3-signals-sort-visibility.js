#!/usr/bin/env node
/**
 * check-sptu-s3-signals-sort-visibility.js -- AC verification for sptu-s3
 * (make the signals panel's existing sort order visible and explicit).
 *
 * Story: artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s3.md
 * Test plan: artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s3-test-plan.md
 *
 * Run: node tests/check-sptu-s3-signals-sort-visibility.js
 */
'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

const assert = require('assert');
const { renderSignalsPanel } = require('../src/web-ui/views/signals-panel-view');

let passed = 0, failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  ✓ ' + name); },
    function(err) { failed++; console.log('  ✗ ' + name + ' -- ' + (err && err.message || err)); }
  );
}

const DATED_SIGNAL = { id: 's1', source: 'capture-log', type: 'decision', text: 'A dated signal', timestamp: '2026-10-01T00:00:00.000Z', cta: { label: 'Review', skill: '/improve' } };
const UNDATED_SIGNAL = { id: 's2', source: 'learnings', type: 'note', text: 'An undated signal', timestamp: null, cta: { label: 'Review', skill: '/improve' } };
const DATED_PARSE_ERROR = { id: 's3', source: 'parse-error', type: 'parse-error', text: 'A dated parse-error', timestamp: '2026-10-02T00:00:00.000Z', cta: { label: 'Review', skill: '/improve' } };
const UNDATED_PARSE_ERROR = { id: 's4', source: 'parse-error', type: 'parse-error', text: 'An undated parse-error', timestamp: null, cta: { label: 'Review', skill: '/improve' } };

(async function main() {

  await test('AC1: renderSignalsPanel includes a visible sort-order label', function() {
    const html = renderSignalsPanel([DATED_SIGNAL], 'csrf-abc');
    assert.ok(/sorted by.*recent/i.test(html), 'expected a label matching /sorted by.*recent/i');
  });

  await test('AC2: a signal with timestamp=null carries a distinct "no date" marker; a dated sibling does not', function() {
    const html = renderSignalsPanel([DATED_SIGNAL, UNDATED_SIGNAL], 'csrf-abc');
    const datedBlock = html.split('data-signal-id="s2"')[0];
    assert.ok(html.includes('data-signal-id="s2"'), 'expected the undated signal to be identifiable by its own id attribute');
    const undatedBlock = html.split('data-signal-id="s2"')[1].split('data-signal-id="s1"')[0] || html.split('data-signal-id="s2"')[1];
    assert.ok(/no date/i.test(undatedBlock), 'expected the undated signal\'s own block to carry a "no date" marker');
    assert.ok(!/no date/i.test(datedBlock), 'expected the dated signal\'s block (before the undated one) to carry no "no date" marker');
  });

  await test('AC2: the "no date" marker and the parse-error marker are independent -- a signal can carry both, either, or neither', function() {
    const html = renderSignalsPanel([DATED_SIGNAL, UNDATED_SIGNAL, DATED_PARSE_ERROR, UNDATED_PARSE_ERROR], 'csrf-abc');
    function blockFor(id) {
      const marker = 'data-signal-id="' + id + '"';
      const idx = html.indexOf(marker);
      assert.ok(idx !== -1, 'expected to find a block for ' + id);
      const rest = html.slice(idx);
      const nextIdx = rest.indexOf('data-signal-id="', marker.length);
      return nextIdx === -1 ? rest : rest.slice(0, nextIdx);
    }
    const datedNormal = blockFor('s1');
    const undatedNormal = blockFor('s2');
    const datedParseError = blockFor('s3');
    const undatedParseError = blockFor('s4');

    assert.ok(!/no date/i.test(datedNormal), 'dated, non-parse-error: expected no "no date" marker');
    assert.ok(!datedNormal.includes('data-signal-type="parse-error"'), 'dated, non-parse-error: expected no parse-error marker');

    assert.ok(/no date/i.test(undatedNormal), 'undated, non-parse-error: expected a "no date" marker');
    assert.ok(!undatedNormal.includes('data-signal-type="parse-error"'), 'undated, non-parse-error: expected no parse-error marker');

    assert.ok(!/no date/i.test(datedParseError), 'dated parse-error: expected no "no date" marker');
    assert.ok(datedParseError.includes('data-signal-type="parse-error"'), 'dated parse-error: expected a parse-error marker');

    assert.ok(/no date/i.test(undatedParseError), 'undated parse-error: expected BOTH markers -- missing "no date"');
    assert.ok(undatedParseError.includes('data-signal-type="parse-error"'), 'undated parse-error: expected BOTH markers -- missing parse-error');
  });

  await test('AC3: the sort-order label never claims the full list is sorted by recency without qualification', function() {
    const html = renderSignalsPanel([DATED_SIGNAL], 'csrf-abc');
    const labelMatch = html.match(/<p class="sw-sort-label">([^<]*)<\/p>/);
    assert.ok(labelMatch, 'expected a <p class="sw-sort-label"> element containing the sort-order copy');
    const labelText = labelMatch[1];
    assert.notStrictEqual(labelText.trim(), 'Sorted by most recent first', 'label must not be the bare, unqualified claim');
    assert.ok(/no date/i.test(labelText), 'expected the label text to include qualifying language naming "no date" signals');
  });

  console.log('\n[sptu-s3-signals-sort-visibility] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
