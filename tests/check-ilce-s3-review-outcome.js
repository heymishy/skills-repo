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

// AC4: buildFinalRecord retains only the post-fix result when a redispatch occurred
test('buildFinalRecord retains only the post-fix result when a redispatch occurred', () => {
  const { buildFinalRecord } = require('../scripts/lib/review-outcome');
  const preFixQuality = { status: 'pass', notes: 'PRE-FIX — stale' };
  const postFixQuality = { status: 'pass', notes: 'POST-FIX — current' };
  const record = buildFinalRecord(
    { status: 'fix-required' }, // original spec result (now fixed)
    preFixQuality,
    { action: 'redispatch-quality', discard: 'quality' },
    postFixQuality
  );
  assert.strictEqual(record.qualityResult, postFixQuality);
  assert.notStrictEqual(record.qualityResult, preFixQuality);
  assert.ok(JSON.stringify(record).indexOf('PRE-FIX') === -1, 'pre-fix result must not appear anywhere in the final record');
});

// AC4 (the symmetric direction): buildFinalRecord retains only the post-fix spec result when spec was redispatched
test('buildFinalRecord retains only the post-fix spec result when the symmetric redispatch-spec occurred', () => {
  const { buildFinalRecord } = require('../scripts/lib/review-outcome');
  const preFixSpec = { status: 'pass', notes: 'PRE-FIX — stale' };
  const postFixSpec = { status: 'pass', notes: 'POST-FIX — current' };
  const record = buildFinalRecord(
    preFixSpec,
    { status: 'fix-required' }, // original quality result (now fixed)
    { action: 'redispatch-spec', discard: 'spec' },
    postFixSpec
  );
  assert.strictEqual(record.specResult, postFixSpec);
  assert.notStrictEqual(record.specResult, preFixSpec);
  assert.ok(JSON.stringify(record).indexOf('PRE-FIX') === -1, 'pre-fix result must not appear anywhere in the final record');
});

// AC4 (no-redispatch case): buildFinalRecord just carries both original results through unchanged
test('buildFinalRecord carries both original results through when no redispatch occurred', () => {
  const { buildFinalRecord } = require('../scripts/lib/review-outcome');
  const specResult = { status: 'pass' };
  const qualityResult = { status: 'pass' };
  const record = buildFinalRecord(specResult, qualityResult, { action: 'accept-both' }, null);
  assert.strictEqual(record.specResult, specResult);
  assert.strictEqual(record.qualityResult, qualityResult);
});

// AC1: Steps 2b and 2c are dispatched together, not sequentially
test('subagent-execution SKILL.md Step 2 dispatches spec-compliance and code-quality review concurrently', () => {
  const fs = require('fs');
  const path = require('path');
  const content = fs.readFileSync(path.join(__dirname, '..', 'skills/subagent-execution/SKILL.md'), 'utf8');
  assert.ok(content.includes('review-outcome'), 'must reference scripts/lib/review-outcome.js');
  assert.ok(content.includes('decideReviewOutcome'), 'must reference decideReviewOutcome specifically');
  assert.ok(content.includes('concurrently') || content.includes('same turn') || content.includes('in parallel'), 'must instruct concurrent dispatch, not sequential');
});

// AC3/AC4: the wiring references the symmetric discard-and-redispatch and single-record retention
test('subagent-execution SKILL.md references symmetric discard-and-redispatch and buildFinalRecord', () => {
  const fs = require('fs');
  const path = require('path');
  const content = fs.readFileSync(path.join(__dirname, '..', 'skills/subagent-execution/SKILL.md'), 'utf8');
  assert.ok(content.includes('buildFinalRecord'), 'must reference buildFinalRecord specifically');
  assert.ok(content.includes('redispatch-quality') || content.includes('redispatch-spec'), 'must reference at least one of the two symmetric redispatch actions');
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
