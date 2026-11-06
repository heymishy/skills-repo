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

// AC1: a bookkeeping-only commit does not count -- the function falls through to
// the prior real code commit's timestamp instead.
test('getLastCodeCommitTimestamp excludes a commit that only touches the bookkeeping paths', () => {
  const { getLastCodeCommitTimestamp } = require('../scripts/lib/branch-complete-freshness');
  // Simulates: `git log -1 --format=%cI -- . ':!.github/pipeline-state.json' ':!.github/pipeline-timings.jsonl'`
  const mockExecGitLog = () => '2026-11-06T00:00:00+00:00\n';
  const result = getLastCodeCommitTimestamp(mockExecGitLog);
  assert.strictEqual(result, '2026-11-06T00:00:00+00:00');
});

// AC1 (edge case): no code commit exists yet at all
test('getLastCodeCommitTimestamp returns null when no code commit exists', () => {
  const { getLastCodeCommitTimestamp } = require('../scripts/lib/branch-complete-freshness');
  const mockExecGitLog = () => '';
  const result = getLastCodeCommitTimestamp(mockExecGitLog);
  assert.strictEqual(result, null);
});

// AC2: a real code commit after the record still correctly reports not-fresh
test('isFresh still correctly reports not-fresh when getLastCodeCommitTimestamp finds a later real commit', () => {
  const { isFresh, getLastCodeCommitTimestamp } = require('../scripts/lib/branch-complete-freshness');
  const record = { stage: 'verify-completion', fullSuite: true, timestamp: '2026-11-06T00:00:00.000Z' };
  const mockExecGitLog = () => '2026-11-06T00:05:00+00:00\n'; // 5 minutes after the record -- a real later commit
  const lastCommitTimestamp = getLastCodeCommitTimestamp(mockExecGitLog);
  const fresh = isFresh(record, { lastCommitTimestamp });
  assert.strictEqual(fresh, false);
});

// AC3: injectable, no real git process required to test
test('getLastCodeCommitTimestamp uses the injected executor, not real execSync, when provided', () => {
  const { getLastCodeCommitTimestamp } = require('../scripts/lib/branch-complete-freshness');
  let called = false;
  const mockExecGitLog = () => { called = true; return '2026-11-06T00:00:00+00:00\n'; };
  getLastCodeCommitTimestamp(mockExecGitLog);
  assert.strictEqual(called, true, 'the injected mock must be the one actually called');
});

// Integration: the REAL default git command actually works against this repo's real history
// (not a mock) -- confirms the literal pathspec-exclusion string is syntactically correct and
// anchored correctly, not just that trim/pass-through logic works on a canned string.
test('getLastCodeCommitTimestamp with the real default executor returns a valid ISO 8601 timestamp from this repo\'s own history', () => {
  const { getLastCodeCommitTimestamp } = require('../scripts/lib/branch-complete-freshness');
  const result = getLastCodeCommitTimestamp(); // no mock -- uses the real defaultExecGitLog
  assert.ok(result !== null, 'expected a real commit touching non-bookkeeping files to exist in this repo\'s history');
  assert.ok(!Number.isNaN(new Date(result).getTime()), `expected a valid ISO 8601 timestamp, got "${result}"`);
});

// Error handling: a git-log failure must not crash the freshness check -- it must fall back
// to null (which isFresh's own existing NaN guard already treats as "not fresh" / run full suite).
test('getLastCodeCommitTimestamp returns null without throwing when the git command itself fails', () => {
  const { getLastCodeCommitTimestamp } = require('../scripts/lib/branch-complete-freshness');
  const throwingExecGitLog = () => { throw new Error('fatal: not a git repository'); };
  let result;
  assert.doesNotThrow(() => { result = getLastCodeCommitTimestamp(throwingExecGitLog); });
  assert.strictEqual(result, null);
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
