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

test('isFresh returns true when no commit since the verify-completion record and fullSuite is true', () => {
  const { isFresh } = require('../scripts/lib/branch-complete-freshness');
  const record = { stage: 'verify-completion', fullSuite: true, timestamp: '2026-11-05T00:00:00.000Z' };
  const result = isFresh(record, { lastCommitTimestamp: '2026-11-04T23:00:00.000Z' });
  assert.strictEqual(result, true);
});

test('isFresh returns false when a commit happened after the verify-completion record', () => {
  const { isFresh } = require('../scripts/lib/branch-complete-freshness');
  const record = { stage: 'verify-completion', fullSuite: true, timestamp: '2026-11-05T00:00:00.000Z' };
  const result = isFresh(record, { lastCommitTimestamp: '2026-11-05T00:05:00.000Z' });
  assert.strictEqual(result, false);
});

test('isFresh returns false when the record covered only a partial/targeted run (fullSuite=false)', () => {
  const { isFresh } = require('../scripts/lib/branch-complete-freshness');
  const record = { stage: 'verify-completion', fullSuite: false, timestamp: '2026-11-05T00:00:00.000Z' };
  const result = isFresh(record, { lastCommitTimestamp: '2026-11-04T23:00:00.000Z' });
  assert.strictEqual(result, false);
});

test('isFresh returns false when no verify-completion record is provided', () => {
  const { isFresh } = require('../scripts/lib/branch-complete-freshness');
  const result = isFresh(null, { lastCommitTimestamp: '2026-11-04T23:00:00.000Z' });
  assert.strictEqual(result, false);
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
