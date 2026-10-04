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
    // sptu-s2 fix (found by the Task 3 implementer, 2026-10-05): a real
    // browser reload reuses the SAME session (and therefore the SAME cached
    // CSRF token, per middleware/csrf.js's own per-session caching) -- the
    // original version of this test built two fully independent fakeReqRes()
    // calls, each minting its own random CSRF token, so byte-identical
    // comparison failed unconditionally regardless of filter correctness.
    // Sharing one session object across both dispatches correctly simulates
    // "the same browser tab, reloaded" rather than two unrelated visitors.
    const sharedSession = { accessToken: 'tok', login: 'tester' };
    const first = fakeReqRes({ hideType: 'parse-error' });
    first.req.session = sharedSession;
    await signalsRoutes.handleGetSignalsPanelHtml(first.req, first.res);
    const second = fakeReqRes({ hideType: 'parse-error' });
    second.req.session = sharedSession;
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
