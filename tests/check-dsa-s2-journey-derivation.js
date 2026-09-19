'use strict';
// tests/check-dsa-s2-journey-derivation.js -- AC7 (unit: derivation shape)
const assert = require('assert');
const { _deriveDashboardJourneyData, _formatCompletedAgo } = require('../src/web-ui/routes/dashboard');

function testDerivesInProgressCountAndRecentSessions() {
  const journeys = [
    { featureSlug: 'feature-a', complete: false, completedStages: [
      { skillName: 'discovery', completedAt: '2026-09-17T10:00:00.000Z' }
    ] },
    { featureSlug: 'feature-b', complete: true, completedStages: [
      { skillName: 'test-plan', completedAt: '2026-09-18T09:00:00.000Z' },
      { skillName: 'definition', completedAt: '2026-09-16T09:00:00.000Z' }
    ] }
  ];
  const result = _deriveDashboardJourneyData(journeys, 5);
  assert.strictEqual(result.inProgressCount, 1, 'only feature-a is incomplete');
  assert.strictEqual(result.recent.length, 3);
  assert.strictEqual(result.recent[0].skill, 'test-plan', 'most recent completedAt first');
  assert.strictEqual(result.recent[0].feature, 'feature-b');
  assert.strictEqual(result.recent[0].stage, 'done');
  assert.ok(result.recent[0].pillColor, 'expected a pill color token reference');
}

function testEmptyJourneysDerivesToZeroAndEmpty() {
  const result = _deriveDashboardJourneyData([], 5);
  assert.strictEqual(result.inProgressCount, 0);
  assert.deepStrictEqual(result.recent, []);
}

function testRespectsTopNLimit() {
  const manyStages = [];
  for (let i = 0; i < 10; i++) {
    manyStages.push({ skillName: 'discovery', completedAt: '2026-09-' + (10 + i) + 'T00:00:00.000Z' });
  }
  const result = _deriveDashboardJourneyData([{ featureSlug: 'f', complete: true, completedStages: manyStages }], 5);
  assert.strictEqual(result.recent.length, 5, 'must cap at the requested top-N');
}

function testFormatCompletedAgoTodayBoundary() {
  // dsa-s2 code-quality review: assert both sides of the 24h "today" vs
  // "Nd ago" boundary deterministically, via the injectable nowMs param
  // -- no global clock mocking needed.
  const now = Date.parse('2026-09-19T12:00:00.000Z');
  assert.strictEqual(
    _formatCompletedAgo('2026-09-18T13:00:00.000Z', now),
    'today',
    '23h ago (under the 24h floor) must read as today'
  );
  assert.strictEqual(
    _formatCompletedAgo('2026-09-18T11:00:00.000Z', now),
    '1d ago',
    '25h ago (over the 24h floor) must read as 1d ago'
  );
  assert.strictEqual(
    _formatCompletedAgo('2026-09-19T12:00:00.000Z', now),
    'today',
    'exactly now must read as today'
  );
}

function testFormatCompletedAgoInvalidInputFallsBackToRawString() {
  assert.strictEqual(
    _formatCompletedAgo('not-a-real-date', Date.now()),
    'not-a-real-date',
    'an unparseable timestamp must fall back to the raw string, not throw or silently misreport'
  );
}

testDerivesInProgressCountAndRecentSessions();
console.log('  ok - derives in-progress count and recent sessions sorted newest-first');
testEmptyJourneysDerivesToZeroAndEmpty();
console.log('  ok - zero journeys derives to 0 count and empty recent array');
testRespectsTopNLimit();
console.log('  ok - recent sessions respects the top-N cap');
testFormatCompletedAgoTodayBoundary();
console.log('  ok - _formatCompletedAgo handles the 24h today/Nd-ago boundary correctly');
testFormatCompletedAgoInvalidInputFallsBackToRawString();
console.log('  ok - _formatCompletedAgo falls back to the raw string on invalid input');
