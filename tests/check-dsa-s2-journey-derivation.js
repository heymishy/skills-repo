'use strict';
// tests/check-dsa-s2-journey-derivation.js -- AC7 (unit: derivation shape)
const assert = require('assert');
const { _deriveDashboardJourneyData } = require('../src/web-ui/routes/dashboard');

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

testDerivesInProgressCountAndRecentSessions();
console.log('  ok - derives in-progress count and recent sessions sorted newest-first');
testEmptyJourneysDerivesToZeroAndEmpty();
console.log('  ok - zero journeys derives to 0 count and empty recent array');
testRespectsTopNLimit();
console.log('  ok - recent sessions respects the top-N cap');
