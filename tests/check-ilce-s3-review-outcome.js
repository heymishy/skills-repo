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

// AC2: both reviewers pass clean -> accept both, no redispatch
test('decideReviewOutcome returns accept-both when both reviewers pass clean', () => {
  const { decideReviewOutcome } = require('../scripts/lib/review-outcome');
  const result = decideReviewOutcome({ status: 'pass' }, { status: 'pass' });
  assert.deepStrictEqual(result, { action: 'accept-both' });
});

// AC3 direction 1: spec requires a fix, quality already passed -> discard+redispatch quality
test('decideReviewOutcome returns redispatch-quality when spec requires a fix and quality already passed', () => {
  const { decideReviewOutcome } = require('../scripts/lib/review-outcome');
  const result = decideReviewOutcome({ status: 'fix-required' }, { status: 'pass' });
  assert.deepStrictEqual(result, { action: 'redispatch-quality', discard: 'quality' });
});

// AC3 direction 2 (the symmetric case): quality requires a fix, spec already passed -> discard+redispatch spec
test('decideReviewOutcome returns redispatch-spec when quality requires a fix and spec already passed', () => {
  const { decideReviewOutcome } = require('../scripts/lib/review-outcome');
  const result = decideReviewOutcome({ status: 'pass' }, { status: 'fix-required' });
  assert.deepStrictEqual(result, { action: 'redispatch-spec', discard: 'spec' });
});

// Edge case: both require a fix -> spec takes priority (must fix spec first; quality gets redispatched after)
test('decideReviewOutcome returns redispatch-quality when both reviewers require a fix (spec fix takes priority)', () => {
  const { decideReviewOutcome } = require('../scripts/lib/review-outcome');
  const result = decideReviewOutcome({ status: 'fix-required' }, { status: 'fix-required' });
  assert.deepStrictEqual(result, { action: 'redispatch-quality', discard: 'quality' });
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
