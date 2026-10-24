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
const GATE_MAP = require('../src/enforcement/gate-map');
const syncLog = require('../src/web-ui/adapters/sync-log');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

function makeFakePool() {
  const calls = [];
  return { calls: calls, query: async function(sql, params) { calls.push({ sql, params }); return { rows: [] }; } };
}

function freshRequireJourneySyncClient() {
  const p = require.resolve('../src/sync/journey-sync-client');
  try { delete require.cache[p]; } catch (_) {}
  return require(p);
}

async function run() {
  console.log('\n[css-s4] gate vocabulary tests\n');

  // T1: getLatestKnownStage
  (function T1() {
    const journeyA = { completedStages: [{ skillName: 'discovery' }, { skillName: 'benefit-metric' }] };
    assert('T1-finds-highest', journeyStore.getLatestKnownStage(journeyA) === 'benefit-metric', `expected "benefit-metric", got "${journeyStore.getLatestKnownStage(journeyA)}"`);

    const journeyB = { completedStages: [{ skillName: 'test-plan' }, { skillName: 'discovery' }] };
    assert('T1-order-independent', journeyStore.getLatestKnownStage(journeyB) === 'test-plan', `expected "test-plan", got "${journeyStore.getLatestKnownStage(journeyB)}"`);

    assert('T1-empty-returns-null', journeyStore.getLatestKnownStage({ completedStages: [] }) === null, 'expected null for empty completedStages');
    assert('T1-unrepresentable-stage-ignored', journeyStore.getLatestKnownStage({ completedStages: [{ skillName: 'infra-plan' }] }) === null, 'expected null when completedStages only contains a non-STAGE_SEQUENCE name');
    assert('T1-null-journey-safe', journeyStore.getLatestKnownStage(null) === null, 'expected null for a null journey');
    assert('T1-missing-completedStages-safe', journeyStore.getLatestKnownStage({}) === null, 'expected null when completedStages is missing');
  })();

  // T2 (AC1): GATE_TO_JOURNEY_STAGE's keys are DERIVED from gate-map.js, not re-typed
  (function T2() {
    const journeySyncClient = freshRequireJourneySyncClient();
    const mapKeys = Object.keys(journeySyncClient.GATE_TO_JOURNEY_STAGE).sort();
    const gateMapKeys = Object.keys(GATE_MAP).sort();
    assert('T2-keys-match-gate-map', JSON.stringify(mapKeys) === JSON.stringify(gateMapKeys), `expected GATE_TO_JOURNEY_STAGE's own keys to exactly match gate-map.js's own 7 keys, got ${JSON.stringify(mapKeys)} vs ${JSON.stringify(gateMapKeys)}`);
  })();

  // T3 (AC1): the 5 journey-representable gates map to their correct stage name
  (function T3() {
    const journeySyncClient = freshRequireJourneySyncClient();
    const m = journeySyncClient.GATE_TO_JOURNEY_STAGE;
    assert('T3-discovery-approved', m['discovery-approved'] === 'discovery', `got "${m['discovery-approved']}"`);
    assert('T3-benefit-metric-active', m['benefit-metric-active'] === 'benefit-metric', `got "${m['benefit-metric-active']}"`);
    assert('T3-definition-complete', m['definition-complete'] === 'definition', `got "${m['definition-complete']}"`);
    assert('T3-test-plan-complete', m['test-plan-complete'] === 'test-plan', `got "${m['test-plan-complete']}"`);
    assert('T3-dor-signed-off', m['dor-signed-off'] === 'definition-of-ready', `got "${m['dor-signed-off']}"`);
  })();

  // T4 (AC1): the 2 inner-loop gates map to null -- no journey-trackable session exists
  (function T4() {
    const journeySyncClient = freshRequireJourneySyncClient();
    const m = journeySyncClient.GATE_TO_JOURNEY_STAGE;
    assert('T4-branch-complete-null', m['branch-complete'] === null, `expected null (no journey session for an inner-loop CLI milestone), got "${m['branch-complete']}"`);
    assert('T4-definition-of-done-null', m['definition-of-done'] === null, `expected null, got "${m['definition-of-done']}"`);
  })();

  // T5 (AC1): syncGateAdvanceToJourney safely no-ops for a journey-unrepresentable gate -- no transport call at all
  await (async function T5() {
    const journeySyncClient = freshRequireJourneySyncClient();
    let transportCalled = false;
    journeySyncClient.setJourneySyncClient(async function() { transportCalled = true; return { updated: true }; });
    await journeySyncClient.syncGateAdvanceToJourney({ journeyId: 'j1', featureSlug: 'f1', repoOwner: null, repoName: null, currentStage: null }, 'branch-complete');
    assert('T5-no-op-for-unrepresentable-gate', transportCalled === false, 'expected NO transport call for a gate with no journey-side representation');
  })();

  // T6 (AC1): syncGateAdvanceToJourney works for a journey-representable gate, no conflict
  await (async function T6() {
    const journeySyncClient = freshRequireJourneySyncClient();
    let updateCall = null;
    journeySyncClient.setJourneySyncClient(async function(op, payload) {
      if (op === 'update') { updateCall = payload; return { updated: true }; }
      return null;
    });
    await journeySyncClient.syncGateAdvanceToJourney({ journeyId: 'j1', featureSlug: 'f1', repoOwner: null, repoName: null, currentStage: 'discovery' }, 'benefit-metric-active');
    assert('T6-syncs-representable-gate', !!updateCall, 'expected an update transport call for a journey-representable gate');
    assert('T6-correct-stage-pushed', updateCall && updateCall.stage === 'benefit-metric', `expected stage 'benefit-metric' pushed, got "${updateCall && updateCall.stage}"`);
  })();

  // T7 (AC1, real conflict detection -- the NEW capability this story adds to css-s1's own direction): journey's own current stage conflicts with the gate being synced
  await (async function T7() {
    const journeySyncClient = freshRequireJourneySyncClient();
    const fakePool = makeFakePool();
    syncLog._setPoolForTesting(fakePool);
    let transportCalled = false;
    journeySyncClient.setJourneySyncClient(async function() { transportCalled = true; return { updated: true }; });

    // Journey's own current representable stage is 'review' -- genuinely
    // different from both 'discovery' (the journey's own last-synced
    // marker, read from pipeline-state.json by the CALLER, not this
    // function) and 'definition' (the gate now being synced). Both sides
    // moved since last sync, to different values: a genuine conflict.
    await journeySyncClient.syncGateAdvanceToJourney(
      { journeyId: 'j1', featureSlug: 'f1', repoOwner: null, repoName: null, currentStage: 'review' },
      'definition-complete',
      'discovery' // lastSyncedStage, passed by the caller (cli-gate-advance.js reads this from local pipeline-state.json)
    );

    assert('T7-no-push-on-conflict', transportCalled === false, 'expected NO update transport call when a genuine conflict is detected -- pushing would silently overwrite the journey\'s own more-recent, disagreeing progress');
    const conflictCall = fakePool.calls.find(function(c) { return String(c.sql).toUpperCase().indexOf('SYNC_LOG') !== -1 && c.params.indexOf('conflict') !== -1; });
    assert('T7-conflict-logged', !!conflictCall, 'expected a sync_log conflict entry');
  })();

  console.log(`[css-s4] ${totalPassed} passed, ${totalFailed} failed\n`);
  if (issues.length > 0) {
    console.log(issues.join('\n'));
    console.log('');
  }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
