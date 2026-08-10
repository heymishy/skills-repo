#!/usr/bin/env node
// check-mgtc-s1-turn-index-cycling.js — unit/integration tests for mgtc-s1
// (the mock LLM gateway returned the identical response on every turn,
// blocking multi-turn skill progression -- e.g. /ideate's 4 lens types --
// in mock mode).
//
// Story:      artefacts/2026-08-10-mock-gateway-turn-index-cycling/stories/mgtc-s1-turn-index-aware-mock-responses.md
// Test plan:  artefacts/2026-08-10-mock-gateway-turn-index-cycling/test-plans/mgtc-s1-test-plan.md
//
// Coverage:
//   AC1 (unit)        — responses[K] returned for turn K < N
//   AC2 (unit)        — last entry repeats past the scripted sequence
//   AC3 (unit)        — single-response fixtures unchanged, byte-identical
//   AC4 (integration) — turn index reflects history.length across a 3-turn sequence
//   AC5 (unit)        — mock-disabled path completely unchanged

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log('PASS:', name);
    passed++;
  } catch (e) {
    console.error('FAIL:', name, '—', e.message);
    failed++;
    process.exitCode = 1;
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    console.log('PASS:', name);
    passed++;
  } catch (e) {
    console.error('FAIL:', name, '—', e.message);
    failed++;
    process.exitCode = 1;
  }
}

const mockGateway = require('../src/web-ui/modules/mock-llm-gateway');
const executor = require('../src/modules/skill-turn-executor');

const ENV_KEYS = ['NODE_ENV', 'MOCK_LLM_GATEWAY'];
function snapshotEnv() {
  const snap = {};
  ENV_KEYS.forEach(function(k) { snap[k] = process.env[k]; });
  return snap;
}
function restoreEnv(snap) {
  ENV_KEYS.forEach(function(k) {
    if (snap[k] === undefined) { delete process.env[k]; } else { process.env[k] = snap[k]; }
  });
}

// ── AC1/AC2/AC3: real _defaultMockGatewayClient against a scratch fixture ──
const SCRATCH_STAGE = '__mgtc-s1-test';
const SCRATCH_SCENARIO = 'multi-turn';
const SCRATCH_FIXTURE_PATH = path.join(mockGateway.FIXTURE_DIR, SCRATCH_STAGE + '.' + SCRATCH_SCENARIO + '.json');

function writeScratchMultiResponseFixture() {
  fs.writeFileSync(SCRATCH_FIXTURE_PATH, JSON.stringify({
    responses: [
      { response: 'A', usage: { input_tokens: 1, output_tokens: 1 }, model: 'mock' },
      { response: 'B', usage: { input_tokens: 2, output_tokens: 2 }, model: 'mock' },
      { response: 'C', usage: { input_tokens: 3, output_tokens: 3 }, model: 'mock' }
    ]
  }, null, 2), 'utf8');
}
function removeScratchFixture() {
  if (fs.existsSync(SCRATCH_FIXTURE_PATH)) { fs.unlinkSync(SCRATCH_FIXTURE_PATH); }
}

(async function() {

try {
  writeScratchMultiResponseFixture();
  mockGateway.resetMockGatewayClient();
  mockGateway.wireDefaultMockGatewayClient();

  // ── AC1: turnIndex within the scripted sequence returns that index's entry ──
  check('AC1: getMockResponse_turnIndexWithinScriptedSequence_returnsThatIndexEntry', () => {
    const result = mockGateway.getMockResponse(SCRATCH_STAGE, 'mock', SCRATCH_SCENARIO, 1);
    assert.strictEqual(result.text, 'B', 'expected the index-1 entry, not the first or last');
  });

  // ── AC2: turnIndex beyond the scripted sequence returns the last entry ──
  check('AC2: getMockResponse_turnIndexBeyondScriptedSequence_returnsLastEntry', () => {
    const result = mockGateway.getMockResponse(SCRATCH_STAGE, 'mock', SCRATCH_SCENARIO, 7);
    assert.strictEqual(result.text, 'C', 'expected the last entry, no throw, no undefined');
  });

} finally {
  removeScratchFixture();
}

// ── AC3: an existing single-response fixture is unaffected by turnIndex ──
check('AC3: getMockResponse_singleResponseFixture_unchangedRegardlessOfTurnIndex', () => {
  mockGateway.resetMockGatewayClient();
  mockGateway.wireDefaultMockGatewayClient();
  const baseline = mockGateway.getMockResponse('discovery', 'mock', 'success');
  const withTurnZero = mockGateway.getMockResponse('discovery', 'mock', 'success', 0);
  const withTurnFive = mockGateway.getMockResponse('discovery', 'mock', 'success', 5);
  assert.deepStrictEqual(withTurnZero, baseline, 'expected turnIndex=0 to be byte-identical to omitting turnIndex entirely');
  assert.deepStrictEqual(withTurnFive, baseline, 'expected turnIndex=5 to be byte-identical too -- single-response fixtures ignore turnIndex');
});

// ── AC5: mock-disabled path is completely unchanged ──
await checkAsync('AC5: skillTurnExecutor_mockDisabled_behaviourUnchanged', async () => {
  const envSnapshot = snapshotEnv();
  try {
    delete process.env.NODE_ENV;
    delete process.env.MOCK_LLM_GATEWAY;
    let mockWasCalled = false;
    mockGateway.setMockGatewayClient({
      getMockResponse: function() { mockWasCalled = true; return { text: 'should not be used', usage: {} }; }
    });
    assert.strictEqual(mockGateway.isMockGatewayEnabled(), false, 'precondition: mock gateway must be disabled for this test');
    // With mock disabled, skillTurnExecutor must not reach the mock branch at
    // all -- it falls through toward the real-provider path, which is not
    // separately exercised here (no real network mock installed), so a
    // real-provider call attempt with no credentials/network mock is
    // expected to reject; that failure is not what this AC verifies.
    await executor.skillTurnExecutor('sys', [], 'hi', 'tok', { stage: 'discovery', scenarioName: 'success' }).catch(function() {});
    assert.strictEqual(mockWasCalled, false, 'mock gateway must not be called when isMockGatewayEnabled() is false');
  } finally {
    restoreEnv(envSnapshot);
    mockGateway.resetMockGatewayClient();
  }
});

// ── AC4: turn index reflects history.length across a simulated 3-turn sequence ──
await checkAsync('AC4: skillTurnExecutor_threeTurnHistory_passesCorrectTurnIndexEachCall', async () => {
  const envSnapshot = snapshotEnv();
  try {
    process.env.NODE_ENV = 'test';
    delete process.env.MOCK_LLM_GATEWAY;
    const recordedTurnIndexes = [];
    mockGateway.setMockGatewayClient({
      getMockResponse: function(stage, model, scenarioName, turnIndex) {
        recordedTurnIndexes.push(turnIndex);
        return { text: 'turn-' + turnIndex, usage: {} };
      }
    });

    const histories = [[], [{ role: 'assistant', content: 'q1' }], [{ role: 'assistant', content: 'q1' }, { role: 'user', content: 'a1' }]];
    await Promise.all(histories.map(function(h) {
      return executor.skillTurnExecutor('sys', h, 'hi', 'tok', { stage: 'discovery', scenarioName: 'success' });
    }));
    assert.deepStrictEqual(recordedTurnIndexes.sort(), [0, 1, 2], 'expected turnIndex to equal each call\'s history.length');
  } finally {
    restoreEnv(envSnapshot);
    mockGateway.resetMockGatewayClient();
  }
});

await checkAsync('AC4: skillTurnExecutorStream_threeTurnHistory_passesCorrectTurnIndexEachCall', async () => {
  const envSnapshot = snapshotEnv();
  try {
    process.env.NODE_ENV = 'test';
    delete process.env.MOCK_LLM_GATEWAY;
    const recordedTurnIndexes = [];
    mockGateway.setMockGatewayClient({
      getMockResponse: function(stage, model, scenarioName, turnIndex) {
        recordedTurnIndexes.push(turnIndex);
        return { text: 'turn-' + turnIndex, usage: {} };
      }
    });

    const histories = [[], [{ role: 'assistant', content: 'q1' }], [{ role: 'assistant', content: 'q1' }, { role: 'user', content: 'a1' }]];
    await Promise.all(histories.map(function(h) {
      return executor.skillTurnExecutorStream('sys', h, 'hi', 'tok', function() {}, null, null, { stage: 'discovery', scenarioName: 'success' });
    }));
    assert.deepStrictEqual(recordedTurnIndexes.sort(), [0, 1, 2], 'expected turnIndex to equal each call\'s history.length');
  } finally {
    restoreEnv(envSnapshot);
    mockGateway.resetMockGatewayClient();
  }
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
