'use strict';
/**
 * check-isc-s1-ideate-success-lens-cycling.js
 *
 * Unit tests for isc-s1 — the default mock-gateway /ideate scenario
 * (tests/e2e/fixtures/llm-gateway/ideate.success.json) migrated to mgtc-s1's
 * `responses` array format so a mock /ideate session actually cycles through
 * lenses, populates assumptions/conditions, and can complete.
 *
 * Run: node tests/check-isc-s1-ideate-success-lens-cycling.js
 */

const assert = require('assert');
const path   = require('path');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS: ' + name);
  } catch (err) {
    failed++;
    console.log('  FAIL: ' + name + '\n       ' + (err && err.message ? err.message : String(err)));
  }
}

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

const MOCK_GATEWAY_PATH = path.resolve(__dirname, '../src/web-ui/modules/mock-llm-gateway.js');

function withMockGateway(fn) {
  const mockGateway = freshRequire(MOCK_GATEWAY_PATH);
  mockGateway.wireDefaultMockGatewayClient();
  try {
    return fn(mockGateway);
  } finally {
    mockGateway.resetMockGatewayClient();
  }
}

function assumptionMarkers(text) {
  return String(text).match(/---ASSUMPTION-JSON:\s*\{[\s\S]*?\}\s*---/g) || [];
}
function conditionMarkers(text) {
  return String(text).match(/---CONDITION-JSON:\s*\{[\s\S]*?\}\s*---/g) || [];
}
function canvasMarkers(text) {
  return String(text).match(/---CANVAS-JSON:\s*\{[\s\S]*?\}\s*---/g) || [];
}

// ── AC1 — turnIndex 0: Lens A, cluster-tree + assumption marker ────────────

check('AC1: turnIndex0_isLensA_withClusterTreeAndAssumptionMarker', () => {
  withMockGateway((mockGateway) => {
    const result = mockGateway.getMockResponse('ideate', 'mock', 'success', 0);
    assert.ok(result.text.indexOf('Lens A') !== -1, 'turn 0 must be Lens A');
    const canvas = canvasMarkers(result.text);
    assert.strictEqual(canvas.length, 1, 'turn 0 must have exactly one canvas marker');
    assert.ok(canvas[0].indexOf('"type":"cluster-tree"') !== -1, 'turn 0 canvas marker must be cluster-tree');
    assert.ok(canvas[0].indexOf('Opportunity map') !== -1, 'turn 0 canvas marker must be titled Opportunity map');
    assert.ok(assumptionMarkers(result.text).length >= 1, 'turn 0 must include at least one assumption marker');
  });
});

// ── AC2 — turnIndex 2: Lens B, differs from turn 0, assumption + condition ─

check('AC2: turnIndex2_isLensB_differsFromTurn0_withAssumptionAndConditionMarkers', () => {
  withMockGateway((mockGateway) => {
    const turn0 = mockGateway.getMockResponse('ideate', 'mock', 'success', 0);
    const turn2 = mockGateway.getMockResponse('ideate', 'mock', 'success', 2);
    assert.notStrictEqual(turn2.text, turn0.text, 'turn 2 must differ from turn 0');
    assert.ok(turn2.text.indexOf('Lens B') !== -1, 'turn 2 must be Lens B');
    assert.ok(assumptionMarkers(turn2.text).length >= 1, 'turn 2 must include at least one assumption marker');
    assert.ok(conditionMarkers(turn2.text).length >= 1, 'turn 2 must include at least one condition marker');
  });
});

// ── AC3 — turnIndex 4/6: Lens C/D, each differs from every prior turn ──────

check('AC3: turnIndex4And6_areLensCAndD_eachDistinctFromAllPriorTurns', () => {
  withMockGateway((mockGateway) => {
    const seen = [0, 2, 4, 6].map(function(i) {
      return mockGateway.getMockResponse('ideate', 'mock', 'success', i).text;
    });
    const unique = new Set(seen);
    assert.strictEqual(unique.size, 4, 'turns 0, 2, 4, 6 must all be distinct content');
    assert.ok(seen[2].indexOf('Lens C') !== -1, 'turn 4 must be Lens C');
    assert.ok(seen[3].indexOf('Lens D') !== -1, 'turn 6 must be Lens D');
  });
});

// ── AC4 — turnIndex 8: final artefact-completion turn ──────────────────────

check('AC4: turnIndex8_isFinalTurn_withValidArtefactStartEndBlock', () => {
  withMockGateway((mockGateway) => {
    const turn8 = mockGateway.getMockResponse('ideate', 'mock', 'success', 8);
    const artefactMatch = turn8.text.match(/---ARTEFACT-START---\s*([\s\S]+?)\s*---ARTEFACT-END---/);
    assert.ok(artefactMatch, 'turn 8 must contain a valid ARTEFACT-START/END block');
    assert.ok(artefactMatch[1].indexOf('# Ideation Artefact') !== -1, 'artefact content must be a real ideation artefact');
    assert.ok(artefactMatch[1].indexOf('Lens A') !== -1 && artefactMatch[1].indexOf('Lens D') !== -1, 'artefact must summarise multiple lenses');
  });
});

// ── AC5 — beyond turnIndex 8 clamps to the final entry ──────────────────────

check('AC5: turnIndexBeyondScriptedSequence_clampsToFinalEntry', () => {
  withMockGateway((mockGateway) => {
    const turn8   = mockGateway.getMockResponse('ideate', 'mock', 'success', 8);
    const turn100 = mockGateway.getMockResponse('ideate', 'mock', 'success', 100);
    assert.strictEqual(turn100.text, turn8.text, 'any turnIndex beyond the scripted sequence must return the same final entry as turn 8');
  });
});

console.log('\n=== check-isc-s1-ideate-success-lens-cycling results: ' + passed + ' passed, ' + failed + ' failed ===');
if (failed > 0) process.exit(1);
