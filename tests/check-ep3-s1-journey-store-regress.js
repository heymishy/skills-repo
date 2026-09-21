'use strict';
const assert = require('assert');
const journeyStore = require('../src/web-ui/modules/journey-store');

function testIsStrictlyLaterStage() {
  journeyStore._clearForTesting();
  assert.strictEqual(journeyStore.isStrictlyLaterStage('definition', 'definition-of-ready'), true, 'definition-of-ready is after definition');
  assert.strictEqual(journeyStore.isStrictlyLaterStage('definition-of-ready', 'definition'), false, 'definition is NOT after definition-of-ready');
  assert.strictEqual(journeyStore.isStrictlyLaterStage('definition', 'definition'), false, 'a stage is not later than itself');
  assert.strictEqual(journeyStore.isStrictlyLaterStage('not-a-real-stage', 'definition'), false, 'unknown earlier stage returns false, not a throw');
}
testIsStrictlyLaterStage();
console.log('  ok - isStrictlyLaterStage: correct earlier/later/self/unknown semantics');

function testRegressToStageRemovesTargetAndDownstream() {
  journeyStore._clearForTesting();
  const j = journeyStore.createJourney('ep3-s1-test-feature', 'default');
  journeyStore.completeStage(j.journeyId, 'discovery', 'artefacts/f/discovery.md');
  journeyStore.completeStage(j.journeyId, 'benefit-metric', 'artefacts/f/benefit-metric.md');
  journeyStore.completeStage(j.journeyId, 'definition', 'artefacts/f/definition.md');
  journeyStore.completeStage(j.journeyId, 'review', 'artefacts/f/review.md');
  journeyStore.setJourneyFields(j.journeyId, { activeSkill: 'test-plan' });

  const result = journeyStore.regressToStage(j.journeyId, 'definition');
  const journey = journeyStore.getJourney(j.journeyId);

  assert.deepStrictEqual(result.invalidatedStages.sort(), ['definition', 'review', 'test-plan', 'definition-of-ready'].sort(), 'invalidatedStages = targetStage + everything downstream of it in STAGE_SEQUENCE');
  assert.strictEqual(journey.activeSkill, 'definition', 'activeSkill reset to targetStage');
  const remainingNames = journey.completedStages.map((cs) => cs.skillName);
  assert.deepStrictEqual(remainingNames, ['discovery', 'benefit-metric'], 'only stages BEFORE targetStage remain complete');
}
testRegressToStageRemovesTargetAndDownstream();
console.log('  ok - regressToStage: removes targetStage + everything downstream from completedStages, resets activeSkill');

function testRegressToStageUnknownJourneyIsNoop() {
  journeyStore._clearForTesting();
  const result = journeyStore.regressToStage('not-a-real-journey-id', 'definition');
  assert.deepStrictEqual(result.invalidatedStages, [], 'unknown journeyId returns empty invalidatedStages, does not throw');
}
testRegressToStageUnknownJourneyIsNoop();
console.log('  ok - regressToStage: unknown journeyId is a safe no-op');

function testRegressToStagePreservesStagesBeforeTarget() {
  journeyStore._clearForTesting();
  const j = journeyStore.createJourney('ep3-s1-test-feature-2', 'default');
  journeyStore.completeStage(j.journeyId, 'discovery', 'artefacts/f2/discovery.md');
  const beforeCount = journeyStore.getJourney(j.journeyId).completedStages.length;
  journeyStore.regressToStage(j.journeyId, 'definition');
  const after = journeyStore.getJourney(j.journeyId);
  assert.strictEqual(after.completedStages.length, beforeCount, 'discovery (before targetStage) is untouched');
  assert.strictEqual(after.completedStages[0].skillName, 'discovery');
}
testRegressToStagePreservesStagesBeforeTarget();
console.log('  ok - regressToStage: stages before targetStage are never touched');

console.log('\n[ep3-s1-journey-store-regress] 4/4 passed');
