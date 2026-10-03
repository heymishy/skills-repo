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
