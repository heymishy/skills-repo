## Implementation Plan: Paginate the signals panel to handle real-world signal volume

**Story:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s3.md
**DoR:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/dor/ep2-s3-dor.md
**DoR contract:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/dor/ep2-s3-dor-contract.md
**Test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s3-test-plan.md

**Real architecture grounding (confirmed by direct code read at DoR time, re-confirmed at branch-setup):**
- `handleGetSignalsPanelHtml(req, res)` (`src/web-ui/routes/signals-panel.js:20`) currently calls `getSignals(repoPath)` then `renderSignalsPanel(signals, csrfToken)` directly — no pagination, no `req.query` read.
- `req.query` is populated by the router (`server.js`'s `parseQuery`) as a plain object of string values — `req.query.page` will be a string (e.g. `"2"`) or `undefined`, never an array or pre-parsed number.
- `renderSignalsPanel(signals, csrfToken)` (`src/web-ui/views/signals-panel-view.js:51`) is a pure function. Its existing empty-state branch (`if (!signals || signals.length === 0) return '<div class="sw-empty">...'`) is the FIRST check — must stay first so a paginated render with 0 real signals still hits it, not a pagination bar.
- Only one production caller of `renderSignalsPanel` exists (`signals-panel.js`); `ep2-s1`'s own 7 existing test calls in `tests/check-ep2-s1-signals-panel.js` all call it with exactly 2 arguments — the new 3rd `pagination` parameter MUST be optional, defaulting to "no pagination controls rendered," so those 7 tests continue to pass unmodified.
- `/signals` GET route registration confirmed unchanged at `server.js:3043`.
- No existing pagination pattern elsewhere in this web UI; closest analog is `dashboard-view.js`'s `(data.skills || []).slice(0, 6)` hard-cap pattern (cited, not copied — no shared helper exists to reuse).

---

## File map

| File | Change | Mirrors |
|------|--------|---------|
| `src/web-ui/utils/paginate-signals.js` | New — pure pagination-math function | `src/web-ui/utils/signal-context.js` (`ep2-s2`'s own pure-helper precedent) |
| `src/web-ui/routes/signals-panel.js` | Modified — read `req.query.page`, call `paginateSignals`, pass metadata to the view | Existing handler, extended |
| `src/web-ui/views/signals-panel-view.js` | Modified — accept optional 3rd `pagination` param, render Previous/Next + count/position | Existing view, extended |
| `tests/check-ep2-s3-signals-pagination.js` | New — unit + integration + NFR-Performance tests | `tests/check-ep2-s2-signal-seeding-bridge.js` |
| `tests/e2e/ep2-s3-signals-pagination.spec.js` | New — real-data Accessibility E2E test (AC7) | `tests/e2e/ep2-s1-signals-panel.spec.js` |

---

## Task 1 — Write failing unit tests for `paginateSignals` (AC1, AC3, AC4, AC5, AC6-edge) [RED]

**File:** `tests/check-ep2-s3-signals-pagination.js` (new)

```javascript
#!/usr/bin/env node
/**
 * check-ep2-s3-signals-pagination.js -- AC verification for ep2-s3
 * (paginate the signals panel to handle real-world signal volume).
 *
 * Story: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s3.md
 * Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s3-test-plan.md
 *
 * Run: node tests/check-ep2-s3-signals-pagination.js
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
const { paginateSignals, SIGNALS_PAGE_SIZE } = require('../src/web-ui/utils/paginate-signals');

let passed = 0, failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  ✓ ' + name); },
    function(err) { failed++; console.log('  ✗ ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function makeSignals(n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push({ id: 's' + i, source: 'test', type: 'note', text: 'signal ' + i, timestamp: null, cta: { label: 'Review', skill: '/improve' } });
  }
  return arr;
}

(async function main() {

  await test('AC1: page 1 (no page param) returns exactly SIGNALS_PAGE_SIZE items when more signals exist', function() {
    const signals = makeSignals(SIGNALS_PAGE_SIZE + 10);
    const result = paginateSignals(signals, undefined);
    assert.strictEqual(result.pageSignals.length, SIGNALS_PAGE_SIZE);
  });

  await test('AC1: page 1 preserves the input array\'s own existing order, no re-sort', function() {
    const signals = makeSignals(SIGNALS_PAGE_SIZE + 10);
    const result = paginateSignals(signals, 1);
    assert.deepStrictEqual(result.pageSignals, signals.slice(0, SIGNALS_PAGE_SIZE));
  });

  await test('AC2: an arbitrary middle page slices the correct startIndex/endIndex range', function() {
    const signals = makeSignals(SIGNALS_PAGE_SIZE * 3);
    const result = paginateSignals(signals, 2);
    assert.deepStrictEqual(result.pageSignals, signals.slice(SIGNALS_PAGE_SIZE, SIGNALS_PAGE_SIZE * 2));
    assert.strictEqual(result.currentPage, 2);
  });

  await test('AC3: page 1 of a multi-page result has hasPrevious=false, hasNext=true', function() {
    const signals = makeSignals(SIGNALS_PAGE_SIZE * 3);
    const result = paginateSignals(signals, 1);
    assert.strictEqual(result.hasPrevious, false);
    assert.strictEqual(result.hasNext, true);
  });

  await test('AC3: the real last page has hasPrevious=true, hasNext=false', function() {
    const signals = makeSignals(SIGNALS_PAGE_SIZE * 3);
    const result = paginateSignals(signals, 3);
    assert.strictEqual(result.hasPrevious, true);
    assert.strictEqual(result.hasNext, false);
  });

  await test('AC4: a non-numeric page value clamps to page 1', function() {
    const signals = makeSignals(SIGNALS_PAGE_SIZE * 3);
    const result = paginateSignals(signals, 'abc');
    assert.strictEqual(result.currentPage, 1);
  });

  await test('AC4: a negative or zero page value clamps to page 1', function() {
    const signals = makeSignals(SIGNALS_PAGE_SIZE * 3);
    assert.strictEqual(paginateSignals(signals, '0').currentPage, 1);
    assert.strictEqual(paginateSignals(signals, '-5').currentPage, 1);
  });

  await test('AC4: a page value beyond the real last page clamps to the real last page, not empty', function() {
    const signals = makeSignals(SIGNALS_PAGE_SIZE * 3);
    const result = paginateSignals(signals, '9999');
    assert.strictEqual(result.currentPage, 3);
    assert.strictEqual(result.pageSignals.length, SIGNALS_PAGE_SIZE);
  });

  await test('AC5: totalCount/totalPages/startIndex/endIndex are correct for a non-round-multiple size', function() {
    const signals = makeSignals(134);
    const result = paginateSignals(signals, 2);
    assert.strictEqual(result.totalCount, 134);
    assert.strictEqual(result.totalPages, 3);
    assert.strictEqual(result.startIndex, 51);
    assert.strictEqual(result.endIndex, 100);
  });

  await test('AC6 (edge): an empty input array returns totalPages=1, no previous/next, zero pageSignals', function() {
    const result = paginateSignals([], undefined);
    assert.strictEqual(result.totalCount, 0);
    assert.strictEqual(result.totalPages, 1);
    assert.strictEqual(result.pageSignals.length, 0);
    assert.strictEqual(result.hasPrevious, false);
    assert.strictEqual(result.hasNext, false);
  });

  console.log('\n[ep2-s3] Results: ' + passed + ' passed, ' + failed + ' failed (partial run -- tasks 3/7 append more)');
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[ep2-s3] Unexpected error:', err && err.stack || err);
  process.exit(1);
});
```

**Run:** `node tests/check-ep2-s3-signals-pagination.js`
**Expected output:** `Cannot find module '../src/web-ui/utils/paginate-signals'` (RED — module does not exist yet).

**Commit message:** `test(ep2-s3): add failing unit tests for paginateSignals`

---

## Task 2 — Implement `paginate-signals.js` to make Task 1's tests pass [GREEN]

**File:** `src/web-ui/utils/paginate-signals.js` (new)

```javascript
'use strict';
// paginate-signals.js -- ep2-s3: pure pagination-math function slicing
// getSignals()'s own existing output, PAGE_SIZE at a time, in its existing
// order. No I/O, no adapter calls -- independently unit-testable, matching
// ep2-s2's own utils/signal-context.js precedent.

const SIGNALS_PAGE_SIZE = 50;

/**
 * @param {Array} signals -- getSignals()'s own existing output, unmodified order
 * @param {string|undefined} rawPage -- req.query.page: a plain string or undefined, never pre-parsed
 * @returns {{pageSignals:Array, currentPage:number, totalPages:number, totalCount:number, startIndex:number, endIndex:number, hasPrevious:boolean, hasNext:boolean}}
 */
function paginateSignals(signals, rawPage) {
  const list = signals || [];
  const totalCount = list.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / SIGNALS_PAGE_SIZE));

  let page = parseInt(rawPage, 10);
  if (!Number.isInteger(page) || page < 1) page = 1;
  if (page > totalPages) page = totalPages;

  const sliceStart = (page - 1) * SIGNALS_PAGE_SIZE;
  const sliceEnd = Math.min(sliceStart + SIGNALS_PAGE_SIZE, totalCount);
  const pageSignals = list.slice(sliceStart, sliceEnd);

  return {
    pageSignals: pageSignals,
    currentPage: page,
    totalPages: totalPages,
    totalCount: totalCount,
    startIndex: totalCount === 0 ? 0 : sliceStart + 1,
    endIndex: sliceEnd,
    hasPrevious: page > 1,
    hasNext: page < totalPages
  };
}

module.exports = { paginateSignals, SIGNALS_PAGE_SIZE };
```

**Run:** `node tests/check-ep2-s3-signals-pagination.js`
**Expected output:** `[ep2-s3] Results: 10 passed, 0 failed (partial run -- tasks 3/7 append more)` (corrected 2026-10-04 during /subagent-execution — Task 1's own committed file has 10 `test()` calls, not 11; the plan's original count was an arithmetic slip, caught by the Task 2 implementer. The overall story total of 19 tests, spanning this file plus the separate Playwright E2E spec, is unaffected.)

**Commit message:** `feat(ep2-s3): add paginateSignals pure pagination helper (AC1, AC3, AC4, AC5, AC6-edge)`

---

## Task 3 — Write failing integration tests for the extended route handler (AC1 behavioural, AC2, AC3, AC4, AC5, AC6) [RED]

**File:** append to `tests/check-ep2-s3-signals-pagination.js`, inserted immediately BEFORE the existing final footer (the `console.log('\n[ep2-s3] Results...')` block). Leave the footer untouched for now (Task 7 modifies it later):

```javascript
  const signalsRoutes = require('../src/web-ui/routes/signals-panel');

  function fakeReqRes(query) {
    const req = { session: { accessToken: 'tok', login: 'alice' }, query: query || {}, headers: {}, method: 'GET', url: '/signals' };
    const res = { statusCode: null, headers: null, body: null, writeHead: function(c, h) { this.statusCode = c; this.headers = h; }, end: function(b) { this.body = b; } };
    return { req, res };
  }

  await test('Real route dispatch: GET /signals with no page param renders only SIGNALS_PAGE_SIZE signals', async function() {
    const oversized = makeSignals(SIGNALS_PAGE_SIZE + 10);
    signalsRoutes.setSignalsSource(function() { return oversized; });
    const { req, res } = fakeReqRes({});
    await signalsRoutes.handleGetSignalsPanelHtml(req, res);
    assert.strictEqual(res.statusCode, 200);
    const count = (res.body.match(/class="sw-card signal-item"/g) || []).length;
    assert.strictEqual(count, SIGNALS_PAGE_SIZE, 'expected exactly SIGNALS_PAGE_SIZE signal-item cards, found ' + count);
  });

  await test('Real route dispatch: GET /signals?page=2 renders page 2\'s own content with a real Previous link to page 1', async function() {
    const oversized = makeSignals(SIGNALS_PAGE_SIZE * 3).map(function(s, i) { return Object.assign({}, s, { text: 'unique-signal-' + i }); });
    signalsRoutes.setSignalsSource(function() { return oversized; });
    const { req, res } = fakeReqRes({ page: '2' });
    await signalsRoutes.handleGetSignalsPanelHtml(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes('unique-signal-' + SIGNALS_PAGE_SIZE), 'expected page 2\'s own first item text to appear');
    assert.ok(!res.body.includes('>unique-signal-0<'), 'expected page 1\'s own first item text to NOT appear on page 2');
    assert.ok(res.body.includes('href="/signals?page=1"'), 'expected a real Previous link targeting page 1');
  });

  await test('Real route dispatch: page 1 has no Previous link, the real last page has no Next link', async function() {
    const oversized = makeSignals(SIGNALS_PAGE_SIZE * 3);
    signalsRoutes.setSignalsSource(function() { return oversized; });
    const page1 = fakeReqRes({});
    await signalsRoutes.handleGetSignalsPanelHtml(page1.req, page1.res);
    assert.ok(!page1.res.body.includes('Previous'), 'expected no Previous link on page 1');
    const lastPage = fakeReqRes({ page: '3' });
    await signalsRoutes.handleGetSignalsPanelHtml(lastPage.req, lastPage.res);
    assert.ok(!lastPage.res.body.includes('Next'), 'expected no Next link on the real last page');
  });

  await test('Real route dispatch: invalid page params never produce an error response', async function() {
    const oversized = makeSignals(SIGNALS_PAGE_SIZE * 3);
    signalsRoutes.setSignalsSource(function() { return oversized; });
    for (const badPage of ['abc', '0', '-1', '9999']) {
      const { req, res } = fakeReqRes({ page: badPage });
      await signalsRoutes.handleGetSignalsPanelHtml(req, res);
      assert.strictEqual(res.statusCode, 200, 'expected 200 for page=' + badPage + ', got ' + res.statusCode);
    }
  });

  await test('Real route dispatch: position indicator shows the real total count and current range', async function() {
    const sized = makeSignals(134);
    signalsRoutes.setSignalsSource(function() { return sized; });
    const { req, res } = fakeReqRes({ page: '2' });
    await signalsRoutes.handleGetSignalsPanelHtml(req, res);
    assert.ok(res.body.includes('51') && res.body.includes('100') && res.body.includes('134'), 'expected the real range/total (51, 100, 134) to appear in the rendered text');
  });

  await test('Real route dispatch: a parse-error signal within a single page still carries ep2-s1\'s own distinguishing marker', async function() {
    const parseErrorSignal = { id: 'pe1', source: 'parse-error', type: 'parse-error', text: 'bad file', timestamp: null, cta: { label: 'Review', skill: '/improve' } };
    signalsRoutes.setSignalsSource(function() { return [parseErrorSignal]; });
    const { req, res } = fakeReqRes({});
    await signalsRoutes.handleGetSignalsPanelHtml(req, res);
    assert.ok(res.body.includes('data-signal-type="parse-error"'), 'expected ep2-s1\'s own parse-error marker to survive within a paginated page');
  });

  await test('Real route dispatch: zero signals still renders ep2-s1\'s own empty state, not a pagination bar', async function() {
    signalsRoutes.setSignalsSource(function() { return []; });
    const { req, res } = fakeReqRes({});
    await signalsRoutes.handleGetSignalsPanelHtml(req, res);
    assert.ok(res.body.includes('No signals yet'), 'expected ep2-s1\'s own empty-state message');
    assert.ok(!res.body.includes('Previous') && !res.body.includes('Next'), 'expected no pagination links on the empty state');
  });
```

**Run:** `node tests/check-ep2-s3-signals-pagination.js`
**Expected output:** The 7 new integration tests FAIL (RED) because `handleGetSignalsPanelHtml` doesn't yet read `req.query.page` or call `paginateSignals` — all 11 Task-1/2 unit tests still pass.

**Commit message:** `test(ep2-s3): add failing integration tests for the paginated route handler`

---

## Task 4 — Extend `handleGetSignalsPanelHtml` and `renderSignalsPanel` to make Task 3's tests pass [GREEN]

**File:** `src/web-ui/routes/signals-panel.js` — replace the body of `handleGetSignalsPanelHtml`:

```javascript
async function handleGetSignalsPanelHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  try {
    const getSignals = _signalsSourceOverride || require('../modules/signals-aggregator').getSignals;
    const signals = getSignals(_getRepoPath());
    // ep2-s3: slice to a bounded page before rendering -- req.query.page is a
    // plain string or undefined (confirmed via server.js's own parseQuery).
    const pagination = paginateSignals(signals, req.query && req.query.page);
    const csrfToken = await _csrf.generateCsrfToken(req);
    const _nav = await _getSkillsNavContext(req, null);
    const html = renderShell({
      title: 'Improvement Signals',
      bodyContent: renderSignalsPanel(pagination.pageSignals, csrfToken, pagination),
      user: { login: req.session.login || '' },
      active: 'signals',
      products: _nav.products, activeProductId: _nav.activeProductId, noProductJourneyCount: _nav.noProductJourneyCount
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    const _nav = await _getSkillsNavContext(req, null);
    const html = renderShell({
      title:       'Error',
      bodyContent: '<p>Could not load signals: ' + escHtml(err.message) + '</p>',
      user:        { login: (req.session && req.session.login) || '' },
      active:      'signals',
      products: _nav.products, activeProductId: _nav.activeProductId, noProductJourneyCount: _nav.noProductJourneyCount
    });
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}
```

Add the require near the top of `signals-panel.js`:
```javascript
const { paginateSignals } = require('../utils/paginate-signals'); // ep2-s3
```

**File:** `src/web-ui/views/signals-panel-view.js` — modify `renderSignalsPanel` to accept an optional 3rd `pagination` parameter and render pagination controls when present:

```javascript
function _paginationBar(pagination) {
  if (!pagination) return '';
  const prevLink = pagination.hasPrevious
    ? '<a href="/signals?page=' + (pagination.currentPage - 1) + '" class="sw-btn">Previous</a>'
    : '';
  const nextLink = pagination.hasNext
    ? '<a href="/signals?page=' + (pagination.currentPage + 1) + '" class="sw-btn">Next</a>'
    : '';
  const isLastPage = pagination.currentPage === pagination.totalPages;
  const positionText = 'Signals ' + pagination.startIndex + '–' + pagination.endIndex + ' of ' + pagination.totalCount +
    (isLastPage ? ' (last page)' : '');
  return [
    '<div class="sw-pagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;gap:12px">',
    '  <span>' + prevLink + '</span>',
    '  <span class="sw-pagination-position">' + positionText + '</span>',
    '  <span>' + nextLink + '</span>',
    '</div>'
  ].join('\n');
}

/**
 * @param {Array<{id:string,source:string,type:string,text:string,timestamp:?string,cta:{label:string,skill:string}}>} signals -- already the current page's own slice
 * @param {string} csrfToken
 * @param {object} [pagination] -- ep2-s3: optional pagination metadata from paginateSignals(). Omitted -> renders exactly as before ep2-s3 (ep2-s1's own 7 existing test calls all omit it).
 * @returns {string} HTML body content for the /signals panel page
 */
function renderSignalsPanel(signals, csrfToken, pagination) {
  if (!signals || signals.length === 0) {
    return '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No signals yet</h1><p>No improvement signals were found in the workspace.</p></div>';
  }
  const items = signals.map(function(s) { return _signalItem(s, csrfToken); }).join('\n');
  return [
    '<p class="sw-section-title">Improvement signals</p>',
    '<div class="signals-list" style="display:flex;flex-direction:column;gap:12px">',
    items,
    '</div>',
    _paginationBar(pagination)
  ].join('\n');
}
```

**Constraint check:** when `pagination` is `undefined` (every one of `ep2-s1`'s own 7 existing test calls), `_paginationBar(undefined)` returns `''` — byte-identical to today's output with an extra empty string joined on (no visible difference).

**Run:** `node tests/check-ep2-s3-signals-pagination.js`
**Expected output:** `[ep2-s3] Results: 17 passed, 0 failed (partial run -- tasks 3/7 append more)` (corrected 2026-10-04: 10 unit + 7 new integration tests = 17, not 18 — see Task 2's own correction note above.)

**Commit message:** `feat(ep2-s3): wire pagination into the signals panel route and view (AC1-AC6)`

---

## Task 5 — Full regression pass for `ep2-s1`'s own existing tests [verification only, no code change]

**Run:** `node tests/check-ep2-s1-signals-panel.js`
**Expected output:** All 11 tests pass unmodified — confirms the optional 3rd `pagination` parameter does not regress any of `ep2-s1`'s own 5 ACs (AC6's own explicit requirement).

**Commit message:** none — this task makes no code change; its result is recorded in the next commit's own message or verified inline during `/subagent-execution`.

---

## Task 6 — Write and implement the dedicated NFR-Performance test [RED → GREEN, single task]

This is explicitly named as a REQUIRED, real test — per the DoR's own Coding Agent Instructions, citing the `ep2-s2` DoD lesson (a named-but-never-implemented NFR test is not acceptable).

**File:** append to `tests/check-ep2-s3-signals-pagination.js`, before the (still-partial) footer:

```javascript
  await test('NFR-Performance: renderSignalsPanel with a full SIGNALS_PAGE_SIZE page renders well within the stated <100ms budget', function() {
    const fullPage = makeSignals(SIGNALS_PAGE_SIZE);
    const { renderSignalsPanel } = require('../src/web-ui/views/signals-panel-view');
    const pagination = paginateSignals(fullPage, 1);
    const start = process.hrtime.bigint();
    renderSignalsPanel(pagination.pageSignals, 'csrf-abc', pagination);
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    assert.ok(elapsedMs < 100, 'expected renderSignalsPanel to complete in <100ms, took ' + elapsedMs.toFixed(2) + 'ms');
  });
```

(This test should pass immediately once added, since Task 4's implementation already exists — this task is RED-then-immediately-GREEN in the same commit, matching `ep1-s3`'s/`ep2-s1`'s own precedent for render-time NFR tests added after the render function itself already exists.)

**Run:** `node tests/check-ep2-s3-signals-pagination.js`
**Expected output:** `[ep2-s3] Results: 18 passed, 0 failed (partial run -- task 7 appends the final footer)` (corrected 2026-10-04: 17 + 1 NFR test = 18, not 19 — see Task 2's own correction note above. The 19th test in this story's own total is the SEPARATE Playwright E2E spec added in Task 7, which has its own independent "1 passed" output and is never counted inside this file's own result line.)

**Commit message:** `test(ep2-s3): add dedicated NFR-Performance test for paginated render time`

---

## Task 7 — Real Playwright E2E test for AC7 (real-data Accessibility) + final footer

**File:** `tests/e2e/ep2-s3-signals-pagination.spec.js` (new)

```javascript
// ep2-s3-signals-pagination.spec.js -- E2E coverage for ep2-s3's AC7
// (keyboard Tab-order across a single real, bounded page of /signals,
// using this repo's own real, unmodified getSignals() data -- NO
// /test/seed-signals fixture seeding, unlike ep2-s1's own existing
// Accessibility test, which needed that fixture specifically because
// pagination did not yet exist. This test proves the real production fix
// at real scale, not a test-side workaround.
// NOT in npm test chain (ADR-018) -- run with:
// npx playwright test tests/e2e/ep2-s3-signals-pagination.spec.js

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('AC7: Tab-order across a single real, bounded page of /signals completes in normal time, using real unseeded data', async ({ page }) => {
  await page.goto('/signals'); // page 1, no ?page= param, no fixture seeding
  await page.waitForLoadState('networkidle');

  const ctaButtons = page.locator('.signal-item .sw-btn--primary');
  const count = await ctaButtons.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(50); // SIGNALS_PAGE_SIZE -- confirms real bounding, not the old unbounded list

  await page.locator('body').evaluate((el) => el.focus());
  let seen = 0;
  for (let i = 0; i < 120 && seen < count; i++) {
    await page.keyboard.press('Tab');
    const inCta = await page.evaluate(() => {
      const active = document.activeElement;
      return !!(active && active.closest('.signal-item'));
    });
    if (inCta) seen++;
  }
  expect(seen).toBe(count); // Tab order reaches every CTA on this one real, bounded page -- within the test's own default timeout, unlike ep2-s1's own Task 5 finding against the unbounded list
});
```

**Run:** `NODE_ENV=test npx playwright test tests/e2e/ep2-s3-signals-pagination.spec.js`
**Expected output:** `1 passed`, completing in normal time (the real point of this test — `ep2-s1`'s own Task 5 test timed out attempting an equivalent walk against the full unbounded list).

Then replace the still-partial footer in `tests/check-ep2-s3-signals-pagination.js` (remove the `(partial run -- ...)` text):
```javascript
  console.log('\n[ep2-s3] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[ep2-s3] Unexpected error:', err && err.stack || err);
  process.exit(1);
});
```

**Run:** `node tests/check-ep2-s3-signals-pagination.js`
**Expected output:** `[ep2-s3] Results: 18 passed, 0 failed` (corrected 2026-10-04 — this file's own final total is 18, not 19; see Task 6's own correction note above. Separately, the new Playwright spec itself should report `1 passed` when run.)

**Commit message:** `test(ep2-s3): add real Playwright E2E test for AC7 (real-data Tab-order)`

---

## Task 8 — Full regression + verification pass

**Run:** `npm test`
**Expected output:** No new failures beyond the already-known pre-existing `tests/check-p3.5-validate-trace.js` failure (confirmed clean baseline at `/branch-setup`: 710/711).

**Run:** `node tests/check-ep2-s1-signals-panel.js`
**Expected output:** All 11 tests still pass unmodified — final confirmation of AC6's own non-regression requirement.

**Commit message:** `chore(ep2-s3): final regression pass`
