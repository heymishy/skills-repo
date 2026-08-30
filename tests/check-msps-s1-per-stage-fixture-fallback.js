#!/usr/bin/env node
// check-msps-s1-per-stage-fixture-fallback.js -- msps-s1: fall back to
// 'success' per-stage when a journey-wide e2eMockScenario has no fixture
// for the current stage, instead of applying it unconditionally.
//
// Fixes a real defect in mgss-s1 (PR #797) found via live Chrome
// verification: e2eMockScenario applied to every stage unconditionally,
// throwing "No fixture found" on discovery (no diagram-showcase fixture)
// before a journey could ever reach design/definition.
//
// Story:     artefacts/2026-08-30-mock-scenario-per-stage-fallback/stories/msps-s1-per-stage-fixture-existence-fallback.md
// Test plan: artefacts/2026-08-30-mock-scenario-per-stage-fallback/test-plans/msps-s1-test-plan.md

'use strict';

process.env.NODE_ENV             = process.env.NODE_ENV || 'test';
process.env.SESSION_SECRET       = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID || 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'test-secret';
process.env.GITHUB_CALLBACK_URL  = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';
process.env.WUCE_REPOSITORIES    = process.env.WUCE_REPOSITORIES || 'test-owner/test-repo';

const assert = require('assert');

const journeyRoutes = require('../src/web-ui/routes/journey');
const mockGateway   = require('../src/web-ui/modules/mock-llm-gateway');

mockGateway.wireDefaultMockGatewayClient();

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  PASS: ' + name); })
    .catch(function(err) {
      failed++;
      const msg = err && err.message ? err.message : String(err);
      failures.push({ name: name, msg: msg });
      console.log('  FAIL: ' + name + '\n       ' + msg);
    });
}

const queue = [];

queue.push(function runHasFixtureTrue() {
  return test('hasFixtureReturnsTrueForExistingFixture', function() {
    assert.strictEqual(mockGateway.hasFixture('design', 'diagram-showcase'), true);
  });
});

queue.push(function runHasFixtureFalse() {
  return test('hasFixtureReturnsFalseForMissingFixture', function() {
    assert.strictEqual(mockGateway.hasFixture('discovery', 'diagram-showcase'), false);
  });
});

queue.push(function runFallback() {
  return test('mockScenarioForStageFallsBackToSuccessWhenNoFixtureExistsForThisStage', function() {
    mockGateway.setRuntimeMockGatewayOverride(true);
    try {
      const journey = { e2eMockScenario: 'diagram-showcase' };
      assert.strictEqual(journeyRoutes._mockScenarioForStage(journey, 'discovery'), undefined);
    } finally {
      mockGateway.resetRuntimeMockGatewayOverride();
    }
  });
});

queue.push(function runStillApplies() {
  return test('mockScenarioForStageStillAppliesOverrideWhenFixtureExists', function() {
    mockGateway.setRuntimeMockGatewayOverride(true);
    try {
      const journey = { e2eMockScenario: 'diagram-showcase' };
      assert.strictEqual(journeyRoutes._mockScenarioForStage(journey, 'design'), 'diagram-showcase');
    } finally {
      mockGateway.resetRuntimeMockGatewayOverride();
    }
  });
});

queue.push(function runStillThrows() {
  return test('unrecognizedScenarioNameStillThrowsWhenCalledDirectly', function() {
    assert.throws(function() {
      mockGateway.getMockResponse('design', 'mock', 'nonexistent-scenario-xyz');
    }, /No fixture found/);
  });
});

queue.push(function runForceFailUnaffected() {
  return test('e2eForceFailStageBehaviorUnaffectedByThisChange', function() {
    mockGateway.setRuntimeMockGatewayOverride(true);
    try {
      const journey = { e2eForceFailStage: 'design' };
      assert.strictEqual(journeyRoutes._mockScenarioForStage(journey, 'design'), 'failure');
      assert.strictEqual(journeyRoutes._mockScenarioForStage(journey, 'definition'), undefined);
    } finally {
      mockGateway.resetRuntimeMockGatewayOverride();
    }
  });
});

(async function run() {
  console.log('msps-s1 -- Per-stage fixture-existence fallback\n');
  for (const fn of queue) { await fn(); }
  console.log('\n-----------------------------------------');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(function(f) { console.log('  x ' + f.name + '\n    ' + f.msg); });
    process.exit(1);
  } else {
    console.log('\nAll tests passed.');
    process.exit(0);
  }
})();
