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

  await test('NFR-Performance: renderSignalsPanel with a full SIGNALS_PAGE_SIZE page renders well within the stated <100ms budget', function() {
    const fullPage = makeSignals(SIGNALS_PAGE_SIZE);
    const { renderSignalsPanel } = require('../src/web-ui/views/signals-panel-view');
    const pagination = paginateSignals(fullPage, 1);
    const start = process.hrtime.bigint();
    renderSignalsPanel(pagination.pageSignals, 'csrf-abc', pagination);
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    assert.ok(elapsedMs < 100, 'expected renderSignalsPanel to complete in <100ms, took ' + elapsedMs.toFixed(2) + 'ms');
  });

  console.log('\n[ep2-s3] Results: ' + passed + ' passed, ' + failed + ' failed (partial run -- tasks 3/7 append more)');
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[ep2-s3] Unexpected error:', err && err.stack || err);
  process.exit(1);
});
