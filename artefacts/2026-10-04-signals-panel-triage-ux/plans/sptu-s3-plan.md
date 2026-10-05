# Make the signals panel's existing sort order visible and explicit — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in `artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s3-test-plan.md` pass. Add a visible, honestly-qualified sort-order label and a "no date" marker to `renderSignalsPanel` — presentation only, no change to `getSignals()`/`_sortSignals()`/`paginateSignals()`.
**Branch:** `feature/sptu-s3`
**Worktree:** `.worktrees/sptu-s3`
**Test command:** `npm test` (full suite via `node scripts/run-all-tests.js`); a single new file can be run directly via `node tests/check-sptu-s3-signals-sort-visibility.js`

---

## File map

```
Create:
  tests/check-sptu-s3-signals-sort-visibility.js — 4 unit tests covering AC1 (sort-order label present), AC2 (no-date marker, independent of the parse-error marker), AC3 (label is qualified, not an unconditional claim)

Modify:
  src/web-ui/views/signals-panel-view.js — add a `_sortOrderLabel()` helper rendered above the signals list (AC1/AC3), and a "no date" marker inside `_signalItem` for any signal with `timestamp == null` (AC2). No change to any route file, no change to `getSignals()`/`_sortSignals()`/`paginateSignals()` (AC4).
```

---

## Task 1: Write failing tests for AC1-AC3 (sort-order label + no-date marker)

**Files:**
- Create: `tests/check-sptu-s3-signals-sort-visibility.js`

- [ ] **Step 1: Write the failing tests**

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-sptu-s3-signals-sort-visibility.js
```

Expected output: all 4 tests fail — `renderSignalsPanel` does not yet include a sort-order label, `data-signal-id` attributes do not yet exist on signal items, and no "no date" marker exists.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/check-sptu-s3-signals-sort-visibility.js
git commit -m "test: add failing AC1-AC3 tests for the signals sort-order visibility story"
```

---

## Task 2: Implement the sort-order label and the "no date" marker

**Files:**
- Modify: `src/web-ui/views/signals-panel-view.js`

- [ ] **Step 1: Add a `data-signal-id` attribute to `_signalItem`'s wrapping `<div>`, a `_sortOrderLabel()` helper, and a "no date" marker**

In `src/web-ui/views/signals-panel-view.js`:

1. Add `data-signal-id="' + escHtml(signal.id || '') + '"` to the `_signalItem` wrapping `<div class="sw-card signal-item" ...>` element (needed so tests — and a future operator reading the DOM — can identify which rendered block belongs to which signal; this does not change any existing assertion since no prior test asserted the full attribute list).

2. Add a `noDateMarker` conditional inside `_signalItem`, independent of the existing `isParseError` styling:

```javascript
const hasNoDate = signal.timestamp == null;
const noDateMarkerHtml = hasNoDate
  ? '<span class="signal-no-date-marker">🕑 No date</span>'
  : '';
```

Insert `noDateMarkerHtml` into the item's header block (next to `signal-source`/`signal-type`), e.g.:

```javascript
'    <div class="signal-source">' + safeSource + '</div>',
'    <div class="signal-type">' + safeType + '</div>' + (noDateMarkerHtml ? ' ' + noDateMarkerHtml : ''),
```

3. Add a new `_sortOrderLabel()` function near the other small render helpers (after `_paginationBar`, before `_toggleHideValue`):

```javascript
// sptu-s3: makes the signals-aggregator's own existing recency sort
// (already applied by getSignals()'s _sortSignals() since ep1-s1) visible
// and honestly qualified -- most real signals (87% as measured 2026-10-04)
// have no timestamp at all and are not actually sorted by recency, so the
// copy must not claim an unqualified "sorted by recency" guarantee (AC3).
function _sortOrderLabel() {
  return '<p class="sw-sort-label">Sorted by most recent first for signals that have a date — signals with no date are shown last, in their original order</p>';
}
```

4. Call `_sortOrderLabel()` in `renderSignalsPanel`, immediately after the filter bar and before the empty-state / list branch, so the label appears on every render (including both empty states and the populated list) per AC1's own "any page, filtered or not" framing:

```javascript
function renderSignalsPanel(signals, csrfToken, pagination, filterState) {
  const filterBarHtml = _filterBar(filterState);
  const sortOrderLabelHtml = _sortOrderLabel();
  const hasActiveFilter = !!(filterState && ((filterState.hideTypes || []).length || (filterState.hideSources || []).length));

  if (!signals || signals.length === 0) {
    if (hasActiveFilter) {
      return [
        filterBarHtml,
        sortOrderLabelHtml,
        '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No signals match the current filters</h1><p>Try clearing a filter to see more.</p><p><a href="/signals" class="sw-btn">Clear filters</a></p></div>'
      ].join('\n');
    }
    return [sortOrderLabelHtml, '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No signals yet</h1><p>No improvement signals were found in the workspace.</p></div>'].join('\n');
  }
  const items = signals.map(function(s) { return _signalItem(s, csrfToken); }).join('\n');
  return [
    filterBarHtml,
    sortOrderLabelHtml,
    '<p class="sw-section-title">Improvement signals</p>',
    '<div class="signals-list" style="display:flex;flex-direction:column;gap:12px">',
    items,
    '</div>',
    _paginationBar(pagination)
  ].join('\n');
}
```

- [ ] **Step 2: Run the new test file — must pass**

```bash
node tests/check-sptu-s3-signals-sort-visibility.js
```

Expected output: `[sptu-s3-signals-sort-visibility] Results: 4 passed, 0 failed`

- [ ] **Step 3: Run the full suite — no regressions (AC4)**

```bash
npm test
```

Expected output: all tests passing, including `tests/check-ep2-s1-signals-panel.js` and `tests/check-ep2-s3-signals-pagination.js` unchanged (AC4 — no functional change to signal order or content). The one pre-existing, environmental `check-pcr-s1-test-runner.js` failure logged in `decisions.md` at `/branch-setup` (2026-10-05) may still appear — that is expected and already RISK-ACCEPTed, not a new regression from this task.

- [ ] **Step 4: Commit**

```bash
git add src/web-ui/views/signals-panel-view.js
git commit -m "feat: add a visible, honestly-qualified sort-order label and a no-date marker to the signals panel"
```

---

## Task 3: Final regression confirmation and PR

**Files:** none (verification only)

- [ ] **Step 1: Run the full suite one more time**

```bash
npm test
```

Expected output: `714 file(s) run, 0 failed` (or `1 failed` if the pre-existing `check-pcr-s1-test-runner.js` environmental flake from `/branch-setup` is still present — confirm it is the same perf-floor finding, not a new failure, before proceeding).

- [ ] **Step 2: Open a draft PR**

```bash
git push -u origin feature/sptu-s3
gh pr create --draft --title "Make the signals panel's existing sort order visible and explicit" --body-file <PR body file, see branch-complete skill>
```

Do not mark ready for review — DoR's own Coding Agent Instructions specify Low oversight, draft PR only.
