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
