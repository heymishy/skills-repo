# Type/source filter for the signals panel — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/sptu-s2`
**Worktree:** `.worktrees/sptu-s2`
**Test command:** `node tests/check-sptu-s2-signals-filter.js` (single file); `npm test` (full suite)

---

## File map

```
Create:
  src/web-ui/utils/filter-signals.js       — pure filterSignals(signals, {hideTypes, hideSources})
  tests/check-sptu-s2-signals-filter.js    — 12 tests (5 unit, 6 integration, 1 NFR)

Modify:
  src/web-ui/routes/signals-panel.js       — comma-split query parsing, pre-pagination filter call, filterState passthrough
  src/web-ui/views/signals-panel-view.js   — filter toggle bar, active-filter summary, zero-match empty state
```

---

## Task 1: Write failing tests for the type/source filter (AC1–AC6)

**Files:**
- Create: `tests/check-sptu-s2-signals-filter.js`

- [ ] **Step 1: Write the failing test file**

```javascript
#!/usr/bin/env node
/**
 * check-sptu-s2-signals-filter.js -- AC verification for sptu-s2
 * (type/source filter for the signals panel).
 *
 * Story: artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s2.md
 * Test plan: artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s2-test-plan.md
 *
 * Run: node tests/check-sptu-s2-signals-filter.js
 */
'use strict';

process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

const assert = require('assert');
const { filterSignals } = require('../src/web-ui/utils/filter-signals');
const { paginateSignals } = require('../src/web-ui/utils/paginate-signals');

let passed = 0, failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  ✓ ' + name); },
    function(err) { failed++; console.log('  ✗ ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function makeSignals(n, opts) {
  opts = opts || {};
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push({
      id: 's' + i,
      source: (opts.sources && opts.sources[i % opts.sources.length]) || 'test-source',
      type: (opts.types && opts.types[i % opts.types.length]) || 'note',
      text: 'unique-signal-' + i,
      timestamp: null,
      cta: { label: 'Review', skill: '/improve' }
    });
  }
  return arr;
}

function fakeReqRes(query) {
  const req = { session: { accessToken: 'tok', login: 'tester' }, query: query || {} };
  const res = {
    _status: null, _headers: {}, body: '',
    writeHead: function(s, h) { res._status = s; Object.assign(res._headers, h || {}); },
    end: function(b) { res.body += (b || ''); },
    statusCode: null
  };
  Object.defineProperty(res, 'statusCode', { get: function() { return res._status; } });
  return { req, res };
}

(async function main() {

  // ── Unit tests (filterSignals, pure) ────────────────────────────────────────

  await test('AC1: filterSignals removes hidden type from the full array, not a page slice', function() {
    const signals = makeSignals(120, { types: ['note', 'parse-error', 'note', 'note', 'note', 'note', 'note', 'note'] });
    const result = filterSignals(signals, { hideTypes: ['parse-error'], hideSources: [] });
    assert.strictEqual(result.length, 105);
    assert.ok(result.every(function(s) { return s.type !== 'parse-error'; }));
  });

  await test('AC1: filterSignals is a no-op when hideTypes/hideSources are both empty', function() {
    const signals = makeSignals(10);
    const result = filterSignals(signals, { hideTypes: [], hideSources: [] });
    assert.deepStrictEqual(result, signals);
  });

  await test('AC2: filterSignals combines hideTypes and hideSources with AND-of-NOT semantics', function() {
    const signals = [
      { type: 'parse-error', source: 'decisions', text: 'a' },
      { type: 'gap', source: 'capture-log', text: 'b' },
      { type: 'parse-error', source: 'capture-log', text: 'c' },
      { type: 'gap', source: 'decisions', text: 'd' }
    ];
    const result = filterSignals(signals, { hideTypes: ['parse-error'], hideSources: ['capture-log'] });
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].text, 'd');
  });

  await test('AC5: rendered filter toggle controls are plain <a> elements with no tabindex override', function() {
    const { renderSignalsPanel } = require('../src/web-ui/views/signals-panel-view');
    const signals = makeSignals(5, { types: ['parse-error', 'gap'], sources: ['capture-log', 'decisions'] });
    const pagination = paginateSignals(signals, undefined);
    const filterState = {
      availableTypes: ['parse-error', 'gap'],
      availableSources: ['capture-log', 'decisions'],
      hideTypes: [],
      hideSources: []
    };
    const html = renderSignalsPanel(pagination.pageSignals, 'csrf-abc', pagination, filterState);
    const toggleLinks = html.match(/<a href="\/signals[^>]*class="[^"]*sw-filter-toggle[^"]*"[^>]*>/g) || [];
    assert.ok(toggleLinks.length >= 4, 'expected at least 4 filter toggle links (2 types + 2 sources), found ' + toggleLinks.length);
    toggleLinks.forEach(function(link) {
      assert.ok(!link.includes('tabindex'), 'expected no tabindex override on: ' + link);
    });
  });

  await test('NFR-Security: filterSignals normalizes case/whitespace so a differently-cased value still matches', function() {
    const signals = [{ type: 'parse-error', source: 'decisions', text: 'a' }];
    const result = filterSignals(signals, { hideTypes: [' Parse-Error '], hideSources: [] });
    assert.strictEqual(result.length, 0, 'expected case/whitespace-insensitive match to still hide the signal');
  });

  // ── Integration tests (real route dispatch) ─────────────────────────────────

  const signalsRoutes = require('../src/web-ui/routes/signals-panel');

  await test('AC1: GET /signals?hideType=parse-error excludes parse-error from every page, total count drops', async function() {
    const fixture = makeSignals(120, { types: ['note', 'parse-error', 'note', 'note', 'note', 'note', 'note', 'note'] });
    signalsRoutes.setSignalsSource(function() { return fixture; });
    const { req, res } = fakeReqRes({ hideType: 'parse-error' });
    await signalsRoutes.handleGetSignalsPanelHtml(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes('105'), 'expected the filtered total (105) to appear in the rendered position text');
    assert.ok(!res.body.includes('data-signal-type="parse-error"'), 'expected zero parse-error markers');
  });

  await test('AC1/AC2: GET /signals?hideType=parse-error,decision hides both comma-separated values', async function() {
    const fixture = makeSignals(30, { types: ['parse-error', 'decision', 'gap'] });
    signalsRoutes.setSignalsSource(function() { return fixture; });
    const { req, res } = fakeReqRes({ hideType: 'parse-error,decision' });
    await signalsRoutes.handleGetSignalsPanelHtml(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(!res.body.includes('data-signal-type="parse-error"'));
    assert.ok(!res.body.includes('data-signal-type="decision"'));
    assert.ok(res.body.includes('data-signal-type="gap"'), 'expected the third, non-hidden type to still appear');
  });

  await test('AC2: GET /signals?hideType=parse-error&hideSource=capture-log combines both filters', async function() {
    const fixture = [
      { id: '1', type: 'parse-error', source: 'decisions', text: 'keep-no', timestamp: null, cta: { label: 'Review', skill: '/improve' } },
      { id: '2', type: 'gap', source: 'capture-log', text: 'keep-no2', timestamp: null, cta: { label: 'Review', skill: '/improve' } },
      { id: '3', type: 'gap', source: 'decisions', text: 'keep-yes', timestamp: null, cta: { label: 'Review', skill: '/improve' } }
    ];
    signalsRoutes.setSignalsSource(function() { return fixture; });
    const { req, res } = fakeReqRes({ hideType: 'parse-error', hideSource: 'capture-log' });
    await signalsRoutes.handleGetSignalsPanelHtml(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes('keep-yes'));
    assert.ok(!res.body.includes('keep-no2'));
  });

  await test('AC3: applied filters are visible on the page and survive a reload of the same URL', async function() {
    const fixture = makeSignals(10, { types: ['parse-error', 'gap'] });
    signalsRoutes.setSignalsSource(function() { return fixture; });
    const first = fakeReqRes({ hideType: 'parse-error' });
    await signalsRoutes.handleGetSignalsPanelHtml(first.req, first.res);
    const second = fakeReqRes({ hideType: 'parse-error' });
    await signalsRoutes.handleGetSignalsPanelHtml(second.req, second.res);
    assert.strictEqual(first.res.body, second.res.body, 'expected identical output on reload');
    assert.ok(/Hiding:.*parse-error/.test(first.res.body), 'expected visible text naming the active filter');
  });

  await test('AC4: a combined filter matching zero signals shows a distinct "no matches" empty state', async function() {
    const fixture = [{ id: '1', type: 'parse-error', source: 'capture-log', text: 'only-one', timestamp: null, cta: { label: 'Review', skill: '/improve' } }];
    signalsRoutes.setSignalsSource(function() { return fixture; });
    const { req, res } = fakeReqRes({ hideType: 'parse-error' });
    await signalsRoutes.handleGetSignalsPanelHtml(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes('No signals match the current filters'), 'expected the distinct filtered-empty message');
    assert.ok(!res.body.includes('No signals yet'), 'expected NOT the ep2-s1 all-workspace-empty message');
    assert.ok(res.body.includes('Clear filters') || res.body.includes('clear filters'), 'expected a visible way to clear filters');
  });

  await test('AC6: no filter params renders identically to pre-sptu-s2 behaviour (ep2-s1/ep2-s3 regression)', async function() {
    const fixture = makeSignals(5, { types: ['note'] });
    signalsRoutes.setSignalsSource(function() { return fixture; });
    const { req, res } = fakeReqRes({});
    await signalsRoutes.handleGetSignalsPanelHtml(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes('unique-signal-0'));
    assert.ok(res.body.includes('sw-pagination') || res.body.includes('signals-list'), 'expected normal unfiltered rendering');
  });

  // ── NFR ──────────────────────────────────────────────────────────────────────

  await test('NFR-Performance: filterSignals + paginateSignals on a 5,340-item array completes within 100ms', function() {
    const big = makeSignals(5340, { types: ['note', 'parse-error', 'gap', 'decision'] });
    const start = process.hrtime.bigint();
    const filtered = filterSignals(big, { hideTypes: ['parse-error'], hideSources: [] });
    paginateSignals(filtered, 1);
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    assert.ok(elapsedMs < 100, 'expected <100ms, took ' + elapsedMs.toFixed(2) + 'ms');
  });

  console.log('\n[sptu-s2] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[sptu-s2] Unexpected error:', err && err.stack || err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-sptu-s2-signals-filter.js
```

Expected output: a `MODULE_NOT_FOUND` error (or similar) since `src/web-ui/utils/filter-signals.js` does not exist yet, and `signals-panel.js`/`signals-panel-view.js` don't yet accept/use filter params. This is the expected RED state — do not modify any source file yet.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/check-sptu-s2-signals-filter.js
git commit -m "test: add failing AC1-AC6 tests for the signals type/source filter (sptu-s2)"
```

---

## Task 2: Implement the pure filterSignals module

**Files:**
- Create: `src/web-ui/utils/filter-signals.js`

- [ ] **Step 1: Write the implementation**

```javascript
'use strict';
// filter-signals.js -- sptu-s2: pure filtering-by-type/source function over
// getSignals()'s own existing output, applied BEFORE paginateSignals() slices
// it -- filtering a single page after the fact would produce an inconsistent
// totalCount/page count. No I/O, no adapter calls -- independently
// unit-testable, matching paginate-signals.js's own established precedent.

/**
 * @param {Array} signals — getSignals()'s own existing output, unmodified order
 * @param {{hideTypes?: string[], hideSources?: string[]}} [opts]
 * @returns {Array} signals with any item matching a hidden type OR hidden source removed
 */
function filterSignals(signals, opts) {
  const list = signals || [];
  opts = opts || {};
  const hideTypes = (opts.hideTypes || []).map(_normalize).filter(Boolean);
  const hideSources = (opts.hideSources || []).map(_normalize).filter(Boolean);
  if (hideTypes.length === 0 && hideSources.length === 0) return list;

  const typeSet = new Set(hideTypes);
  const sourceSet = new Set(hideSources);
  return list.filter(function(s) {
    const type = _normalize(s && s.type);
    const source = _normalize(s && s.source);
    if (type && typeSet.has(type)) return false;
    if (source && sourceSet.has(source)) return false;
    return true;
  });
}

function _normalize(v) {
  return String(v == null ? '' : v).trim().toLowerCase();
}

module.exports = { filterSignals };
```

- [ ] **Step 2: Run test — the 5 unit tests must pass (integration tests still fail)**

```bash
node tests/check-sptu-s2-signals-filter.js
```

Expected output: the 5 unit tests (AC1 x2, AC2, AC5, NFR-Security) now pass; the 6 integration tests and the NFR-Performance test still fail (route/view not wired yet).

- [ ] **Step 3: Commit**

```bash
git add src/web-ui/utils/filter-signals.js
git commit -m "feat: add pure filterSignals module (sptu-s2)"
```

---

## Task 3: Wire the filter into the route and view

**Files:**
- Modify: `src/web-ui/routes/signals-panel.js`
- Modify: `src/web-ui/views/signals-panel-view.js`

- [ ] **Step 1: Modify signals-panel.js**

Add the import near the top (alongside the existing `paginateSignals` import):

```javascript
const { paginateSignals } = require('../utils/paginate-signals'); // ep2-s3
const { filterSignals } = require('../utils/filter-signals'); // sptu-s2
```

Add this helper function above `handleGetSignalsPanelHtml`:

```javascript
// sptu-s2: req.query.hideType/hideSource are each a single comma-separated
// string (never a repeated key -- server.js's own parseQuery is last-wins on
// repeated keys, confirmed at /definition-of-ready). Split, trim, drop empties.
function _parseHideParam(raw) {
  if (!raw) return [];
  return String(raw).split(',').map(function(v) { return v.trim(); }).filter(Boolean);
}
```

Replace the body of `handleGetSignalsPanelHtml`'s try block (everything between `try {` and the `res.writeHead(200, ...)` call) with:

```javascript
  try {
    const getSignals = _signalsSourceOverride || require('../modules/signals-aggregator').getSignals;
    const allSignals = getSignals(_getRepoPath());

    // sptu-s2: the real distinct type/source universe, computed live from the
    // FULL unfiltered list every render -- never a hardcoded list that could
    // go stale as signals-aggregator.js gains sources over time.
    const availableTypes = Array.from(new Set(allSignals.map(function(s) { return s.type; }).filter(Boolean))).sort();
    const availableSources = Array.from(new Set(allSignals.map(function(s) { return s.source; }).filter(Boolean))).sort();

    const requestedHideTypes = _parseHideParam(req.query && req.query.hideType).map(function(v) { return v.trim().toLowerCase(); });
    const requestedHideSources = _parseHideParam(req.query && req.query.hideSource).map(function(v) { return v.trim().toLowerCase(); });
    // Only keep values that match a real, currently-observed type/source --
    // never echo an attacker/typo-supplied value into the active-filter
    // summary UI text (escHtml makes it safe, but not meaningful).
    const hideTypes = requestedHideTypes.filter(function(t) { return availableTypes.indexOf(t) !== -1; });
    const hideSources = requestedHideSources.filter(function(s) { return availableSources.indexOf(s) !== -1; });

    const signals = filterSignals(allSignals, { hideTypes: hideTypes, hideSources: hideSources });

    // ep2-s3: slice to a bounded page before rendering -- req.query.page is a
    // plain string or undefined (confirmed via server.js's own parseQuery).
    const pagination = paginateSignals(signals, req.query && req.query.page);
    const csrfToken = await _csrf.generateCsrfToken(req);
    const _nav = await _getSkillsNavContext(req, null);
    const filterState = {
      availableTypes: availableTypes,
      availableSources: availableSources,
      hideTypes: hideTypes,
      hideSources: hideSources
    };
    const html = renderShell({
      title: 'Improvement Signals',
      bodyContent: renderSignalsPanel(pagination.pageSignals, csrfToken, pagination, filterState),
      user: { login: req.session.login || '' },
      active: 'signals',
      products: _nav.products, activeProductId: _nav.activeProductId, noProductJourneyCount: _nav.noProductJourneyCount
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
```

(The `catch` block below is unchanged — leave it exactly as-is.)

- [ ] **Step 2: Modify signals-panel-view.js**

Add these two new helper functions above `renderSignalsPanel` (after the existing `_paginationBar` function):

```javascript
function _toggleHideValue(currentList, value) {
  const idx = currentList.indexOf(value);
  if (idx === -1) return currentList.concat([value]);
  return currentList.slice(0, idx).concat(currentList.slice(idx + 1));
}

function _buildFilterUrl(hideTypes, hideSources) {
  const params = [];
  if (hideTypes.length) params.push('hideType=' + encodeURIComponent(hideTypes.join(',')));
  if (hideSources.length) params.push('hideSource=' + encodeURIComponent(hideSources.join(',')));
  return '/signals' + (params.length ? '?' + params.join('&') : '');
}

function _filterToggleLink(value, isHidden, nextUrl) {
  const label = (isHidden ? 'Show ' : 'Hide ') + value;
  return '<a href="' + escHtml(nextUrl) + '" class="sw-btn sw-filter-toggle' + (isHidden ? ' sw-filter-toggle--active' : '') + '">' +
    (isHidden ? '✓ ' : '') + escHtml(label) + '</a>';
}

// sptu-s2: filter toggle bar -- plain <a> links (zero-client-JS convention,
// matching ep2-s3's own Previous/Next precedent), so every control is
// natively keyboard-focusable with no custom tabindex handling needed (AC5).
function _filterBar(filterState) {
  if (!filterState) return '';
  const availableTypes = filterState.availableTypes || [];
  const availableSources = filterState.availableSources || [];
  const hideTypes = filterState.hideTypes || [];
  const hideSources = filterState.hideSources || [];
  if (availableTypes.length === 0 && availableSources.length === 0) return '';

  const typeLinks = availableTypes.map(function(t) {
    const isHidden = hideTypes.indexOf(t) !== -1;
    return _filterToggleLink(t, isHidden, _buildFilterUrl(_toggleHideValue(hideTypes, t), hideSources));
  }).join(' ');

  const sourceLinks = availableSources.map(function(s) {
    const isHidden = hideSources.indexOf(s) !== -1;
    return _filterToggleLink(s, isHidden, _buildFilterUrl(hideTypes, _toggleHideValue(hideSources, s)));
  }).join(' ');

  // AC5 (accessibility): the ✓ glyph is a text character, not a colour-only
  // cue -- the --active class also changes more than colour (see CSS), but
  // this inline text marker is what guarantees colour is never the sole signal.
  const activeSummary = (hideTypes.length || hideSources.length)
    ? '<p class="sw-filter-summary">Hiding: ' + escHtml(hideTypes.concat(hideSources).join(', ')) +
      ' — <a href="/signals">Clear filters</a></p>'
    : '';

  return [
    '<div class="sw-filter-bar" style="margin-bottom:16px">',
    '  <p class="sw-filter-bar-label">Filter by type:</p>',
    '  <div class="sw-filter-bar-row" style="display:flex;flex-wrap:wrap;gap:6px">' + typeLinks + '</div>',
    '  <p class="sw-filter-bar-label">Filter by source:</p>',
    '  <div class="sw-filter-bar-row" style="display:flex;flex-wrap:wrap;gap:6px">' + sourceLinks + '</div>',
    activeSummary,
    '</div>'
  ].join('\n');
}
```

Replace the `renderSignalsPanel` function with:

```javascript
/**
 * @param {Array<{id:string,source:string,type:string,text:string,timestamp:?string,cta:{label:string,skill:string}}>} signals -- already the current page's own slice
 * @param {string} csrfToken
 * @param {object} [pagination] -- ep2-s3: optional pagination metadata from paginateSignals(). Omitted -> renders exactly as before ep2-s3.
 * @param {object} [filterState] -- sptu-s2: optional {availableTypes, availableSources, hideTypes, hideSources}. Omitted -> no filter bar, renders exactly as before sptu-s2 (ep2-s1's own 7 existing test calls all omit it).
 * @returns {string} HTML body content for the /signals panel page
 */
function renderSignalsPanel(signals, csrfToken, pagination, filterState) {
  const filterBarHtml = _filterBar(filterState);
  const hasActiveFilter = !!(filterState && ((filterState.hideTypes || []).length || (filterState.hideSources || []).length));

  if (!signals || signals.length === 0) {
    if (hasActiveFilter) {
      // sptu-s2 (AC4): distinct from ep2-s1's own "no signals in the
      // workspace at all" message below -- this means signals EXIST but the
      // current filter combination matches none of them.
      return [
        filterBarHtml,
        '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No signals match the current filters</h1><p>Try clearing a filter to see more.</p><p><a href="/signals" class="sw-btn">Clear filters</a></p></div>'
      ].join('\n');
    }
    return '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No signals yet</h1><p>No improvement signals were found in the workspace.</p></div>';
  }
  const items = signals.map(function(s) { return _signalItem(s, csrfToken); }).join('\n');
  return [
    filterBarHtml,
    '<p class="sw-section-title">Improvement signals</p>',
    '<div class="signals-list" style="display:flex;flex-direction:column;gap:12px">',
    items,
    '</div>',
    _paginationBar(pagination)
  ].join('\n');
}
```

Update the `module.exports` line at the bottom if needed — it already exports `{ renderSignalsPanel }`, no change needed there.

- [ ] **Step 2: Run test — all 12 tests must pass**

```bash
node tests/check-sptu-s2-signals-filter.js
```

Expected output:
```
  ✓ AC1: filterSignals removes hidden type from the full array, not a page slice
  ✓ AC1: filterSignals is a no-op when hideTypes/hideSources are both empty
  ✓ AC2: filterSignals combines hideTypes and hideSources with AND-of-NOT semantics
  ✓ AC5: rendered filter toggle controls are plain <a> elements with no tabindex override
  ✓ NFR-Security: filterSignals normalizes case/whitespace so a differently-cased value still matches
  ✓ AC1: GET /signals?hideType=parse-error excludes parse-error from every page, total count drops
  ✓ AC1/AC2: GET /signals?hideType=parse-error,decision hides both comma-separated values
  ✓ AC2: GET /signals?hideType=parse-error&hideSource=capture-log combines both filters
  ✓ AC3: applied filters are visible on the page and survive a reload of the same URL
  ✓ AC4: a combined filter matching zero signals shows a distinct "no matches" empty state
  ✓ AC6: no filter params renders identically to pre-sptu-s2 behaviour (ep2-s1/ep2-s3 regression)
  ✓ NFR-Performance: filterSignals + paginateSignals on a 5,340-item array completes within 100ms

[sptu-s2] Results: 12 passed, 0 failed
```

- [ ] **Step 3: Run the ep2-s1 and ep2-s3 regression suites — must still pass**

```bash
node tests/check-ep2-s1-signals-panel.js
node tests/check-ep2-s3-signals-pagination.js
```

Expected output: both files' own existing tests pass unchanged (ep2-s1's own call sites all omit the new `filterState` 4th parameter, which is optional — confirm no call site needed updating).

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: 713 files (712 + this story's new test file), 0 failed.

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/signals-panel.js src/web-ui/views/signals-panel-view.js
git commit -m "feat: wire type/source filter into the signals panel route and view (sptu-s2)"
```
