'use strict';
const assert = require('assert');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  ✗ ' + name + ': ' + err.message);
  }
}

// AC1: cross-reference correctly matches a story's prUrl against gh pr list output
test('crossReferenceStories matches a story prUrl against a real merged PR', () => {
  const { crossReferenceStories } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'abc-s1', prUrl: 'https://github.com/org/repo/pull/999', prStatus: 'merged' }];
  const result = crossReferenceStories(ghMergedPrs, stories);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].storySlug, 'abc-s1');
  assert.deepStrictEqual(result[0].liveMatch, { number: 999, mergedAt: '2026-10-01T00:00:00Z' });
});

// AC1 (no match case): a story whose prUrl does not correspond to any merged PR
test('crossReferenceStories returns liveMatch null when no merged PR matches', () => {
  const { crossReferenceStories } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'abc-s2', prUrl: 'https://github.com/org/repo/pull/111', prStatus: 'draft' }];
  const result = crossReferenceStories(ghMergedPrs, stories);
  assert.strictEqual(result[0].liveMatch, null);
});

// Direct coverage of extractPrNumber's own branches (previously only exercised indirectly)
test('extractPrNumber extracts the numeric PR number from a well-formed GitHub PR URL', () => {
  const { extractPrNumber } = require('../scripts/lib/dod-handoff-reconciliation');
  assert.strictEqual(extractPrNumber('https://github.com/org/repo/pull/999'), 999);
});

test('extractPrNumber returns null for a missing, null, or non-matching prUrl', () => {
  const { extractPrNumber } = require('../scripts/lib/dod-handoff-reconciliation');
  assert.strictEqual(extractPrNumber(undefined), null);
  assert.strictEqual(extractPrNumber(null), null);
  assert.strictEqual(extractPrNumber(''), null);
  assert.strictEqual(extractPrNumber('https://github.com/org/repo/issues/999'), null);
});

// The single most common real production input: a story with no prUrl yet (not merged)
test('crossReferenceStories returns liveMatch null for a story with no prUrl at all', () => {
  const { crossReferenceStories } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'not-yet-merged-s1', prStatus: 'test-plan' }];
  const result = crossReferenceStories(ghMergedPrs, stories);
  assert.strictEqual(result[0].storySlug, 'not-yet-merged-s1');
  assert.strictEqual(result[0].prUrl, null);
  assert.strictEqual(result[0].liveMatch, null);
});

// AC2: flags a reconciliation gap when prUrl matches a merged PR but prStatus disagrees
test('findReconciliationGaps flags a gap when live-merged story has a non-merged prStatus', () => {
  const { crossReferenceStories, findReconciliationGaps } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'abc-s1', prUrl: 'https://github.com/org/repo/pull/999', prStatus: 'draft' }];
  const crossRef = crossReferenceStories(ghMergedPrs, stories);
  const gaps = findReconciliationGaps(crossRef, stories);
  assert.strictEqual(gaps.length, 1);
  assert.strictEqual(gaps[0].storySlug, 'abc-s1');
  assert.strictEqual(gaps[0].severity, 'merged-no-dod');
  assert.strictEqual(gaps[0].source, 'live-reconciliation');
});

// AC2 (negative/control case): no finding when prUrl and prStatus agree
test('findReconciliationGaps produces no finding when prStatus already says merged', () => {
  const { crossReferenceStories, findReconciliationGaps } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'abc-s1', prUrl: 'https://github.com/org/repo/pull/999', prStatus: 'merged' }];
  const crossRef = crossReferenceStories(ghMergedPrs, stories);
  const gaps = findReconciliationGaps(crossRef, stories);
  assert.strictEqual(gaps.length, 0);
});

// Edge case: a crossReferenceResults entry whose storySlug has no matching story entry
test('findReconciliationGaps skips a cross-reference result with no matching story entry', () => {
  const { findReconciliationGaps } = require('../scripts/lib/dod-handoff-reconciliation');
  const crossRef = [{ storySlug: 'ghost-s1', prUrl: 'https://github.com/org/repo/pull/999', liveMatch: { number: 999, mergedAt: '2026-10-01T00:00:00Z' } }];
  const stories = []; // no story matching 'ghost-s1'
  assert.doesNotThrow(() => findReconciliationGaps(crossRef, stories));
  const gaps = findReconciliationGaps(crossRef, stories);
  assert.strictEqual(gaps.length, 0);
});

// Mixed array: a story with no live match must never be flagged, regardless of its own prStatus
test('findReconciliationGaps never flags a story with no live match, even with a non-merged prStatus', () => {
  const { crossReferenceStories, findReconciliationGaps } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [
    { slug: 'matched-s1', prUrl: 'https://github.com/org/repo/pull/999', prStatus: 'draft' },
    { slug: 'unmatched-s2', prUrl: 'https://github.com/org/repo/pull/111', prStatus: 'draft' },
  ];
  const crossRef = crossReferenceStories(ghMergedPrs, stories);
  const gaps = findReconciliationGaps(crossRef, stories);
  assert.strictEqual(gaps.length, 1);
  assert.strictEqual(gaps[0].storySlug, 'matched-s1');
});

console.log('\n── Summary ──');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(({ name, err }) => {
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  });
}
if (failed > 0) {
  process.exit(1);
}
