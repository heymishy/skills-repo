#!/usr/bin/env node
/**
 * check-css-s4-gate-vocabulary.js
 *
 * Tests for css-s4: full gate-vocabulary coverage for css-s1's own
 * direction, including real conflict detection for the 5 journey-
 * representable gates. Covers AC1 (css-s1 side).
 *
 * Run: node tests/check-css-s4-gate-vocabulary.js
 */
'use strict';

const journeyStore = require('../src/web-ui/modules/journey-store');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

async function run() {
  console.log('\n[css-s4] gate vocabulary tests\n');

  // T1 (Task 2 red/green step): getLatestKnownStage finds the highest-index STAGE_SEQUENCE member in completedStages
  (function T1() {
    const journeyA = { completedStages: [{ skillName: 'discovery' }, { skillName: 'benefit-metric' }] };
    assert('T1-finds-highest', journeyStore.getLatestKnownStage(journeyA) === 'benefit-metric', `expected "benefit-metric" (higher STAGE_SEQUENCE index than "discovery"), got "${journeyStore.getLatestKnownStage(journeyA)}"`);

    const journeyB = { completedStages: [{ skillName: 'test-plan' }, { skillName: 'discovery' }] };
    assert('T1-order-independent', journeyStore.getLatestKnownStage(journeyB) === 'test-plan', `expected the array's own order not to matter -- "test-plan" is later in STAGE_SEQUENCE than "discovery" regardless of array position, got "${journeyStore.getLatestKnownStage(journeyB)}"`);

    const journeyC = { completedStages: [] };
    assert('T1-empty-returns-null', journeyStore.getLatestKnownStage(journeyC) === null, 'expected null for a journey with no completed stages');

    const journeyD = { completedStages: [{ skillName: 'infra-plan' }] };
    assert('T1-unrepresentable-stage-ignored', journeyStore.getLatestKnownStage(journeyD) === null, 'expected null when completedStages only contains a stage name outside STAGE_SEQUENCE (e.g. an inner-loop gate name that somehow ended up there) -- not a throw, not a false match');

    assert('T1-null-journey-safe', journeyStore.getLatestKnownStage(null) === null, 'expected null for a null journey, not a throw');
    assert('T1-missing-completedStages-safe', journeyStore.getLatestKnownStage({}) === null, 'expected null when completedStages is missing entirely, not a throw');
  })();

  console.log(`[css-s4] ${totalPassed} passed, ${totalFailed} failed (partial -- Task 2 only; Task 4 appends more below)\n`);
  if (issues.length > 0) {
    console.log(issues.join('\n'));
    console.log('');
  }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
