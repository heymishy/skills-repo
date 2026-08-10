'use strict';
/**
 * check-isc-s1-ideate-success-lens-cycling.js
 *
 * Unit tests for isc-s1 — the default mock-gateway /ideate scenario
 * (tests/e2e/fixtures/llm-gateway/ideate.success.json) migrated to mgtc-s1's
 * `responses` array format so a mock /ideate session actually cycles through
 * lenses, populates assumptions/conditions, and can complete.
 *
 * turnIndex sequence note: the auto-fired first turn's synthetic "Begin the
 * session" prompt is NEVER pushed to session.turns (skills.js's
 * handlePostTurnStreamHtml only pushes the user entry when !_isInitialTurn),
 * so after the auto turn (turnIndex 0) session.turns.length is 1 (assistant
 * only) -- the operator's first REAL reply is turnIndex 1, not 2. The
 * reachable sequence for real turns is 0, 1, 3, 5, 7, 9(clamped), ... --
 * confirmed live on wuce-staging.fly.dev during this story's own review.
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

// ── AC2 — turnIndex 1: the operator's FIRST real reply must already be
// Lens B, not a repeat of Lens A. This is the exact regression this story's
// own live Chrome review caught: an earlier version of this fixture assumed
// real turns land on even turnIndex values (0,2,4,6,8), but the auto-fired
// first turn's own user content is never pushed to session.turns, so the
// operator's actual first reply is turnIndex 1 -- landing on a padding slot
// that duplicated Lens A instead of progressing to Lens B. ─────────────────

check('AC2: turnIndex1_isOperatorsFirstRealReply_mustBeLensB_notARepeatOfLensA', () => {
  withMockGateway((mockGateway) => {
    const turn0 = mockGateway.getMockResponse('ideate', 'mock', 'success', 0);
    const turn1 = mockGateway.getMockResponse('ideate', 'mock', 'success', 1);
    assert.notStrictEqual(turn1.text, turn0.text, 'the operator\'s first real reply (turnIndex 1) must NOT repeat turn 0\'s content');
    assert.ok(turn1.text.indexOf('Lens B') !== -1, 'turnIndex 1 must be Lens B');
    assert.ok(assumptionMarkers(turn1.text).length >= 1, 'turnIndex 1 must include at least one assumption marker');
    assert.ok(conditionMarkers(turn1.text).length >= 1, 'turnIndex 1 must include at least one condition marker');
  });
});

// ── AC3 — turnIndex 3/5: Lens C/D, each differs from every prior turn ──────

check('AC3: turnIndex3And5_areLensCAndD_eachDistinctFromAllPriorTurns', () => {
  withMockGateway((mockGateway) => {
    const seen = [0, 1, 3, 5].map(function(i) {
      return mockGateway.getMockResponse('ideate', 'mock', 'success', i).text;
    });
    const unique = new Set(seen);
    assert.strictEqual(unique.size, 4, 'turns 0, 1, 3, 5 must all be distinct content');
    assert.ok(seen[2].indexOf('Lens C') !== -1, 'turnIndex 3 must be Lens C');
    assert.ok(seen[3].indexOf('Lens D') !== -1, 'turnIndex 5 must be Lens D');
  });
});

// ── AC4 — turnIndex 7: final artefact-completion turn ──────────────────────

check('AC4: turnIndex7_isFinalTurn_withValidArtefactStartEndBlock', () => {
  withMockGateway((mockGateway) => {
    const turn7 = mockGateway.getMockResponse('ideate', 'mock', 'success', 7);
    const artefactMatch = turn7.text.match(/---ARTEFACT-START---\s*([\s\S]+?)\s*---ARTEFACT-END---/);
    assert.ok(artefactMatch, 'turnIndex 7 must contain a valid ARTEFACT-START/END block');
    assert.ok(artefactMatch[1].indexOf('# Ideation Artefact') !== -1, 'artefact content must be a real ideation artefact');
    assert.ok(artefactMatch[1].indexOf('Lens A') !== -1 && artefactMatch[1].indexOf('Lens D') !== -1, 'artefact must summarise multiple lenses');
  });
});

// ── AC5 — beyond turnIndex 7 clamps to the final entry ──────────────────────

check('AC5: turnIndexBeyondScriptedSequence_clampsToFinalEntry', () => {
  withMockGateway((mockGateway) => {
    const turn7   = mockGateway.getMockResponse('ideate', 'mock', 'success', 7);
    const turn100 = mockGateway.getMockResponse('ideate', 'mock', 'success', 100);
    assert.strictEqual(turn100.text, turn7.text, 'any turnIndex beyond the scripted sequence must return the same final entry as turnIndex 7');
  });
});

// ── AC6 — the genuinely-unreachable padding indices (2, 4, 6) still hold a
// validly-shaped fixture entry, in case a future code change to
// handlePostTurnStreamHtml's history-tracking ever makes them reachable. ──

check('AC6: unreachablePaddingIndices_stillValidlyShaped', () => {
  withMockGateway((mockGateway) => {
    [2, 4, 6].forEach(function(i) {
      const result = mockGateway.getMockResponse('ideate', 'mock', 'success', i);
      assert.ok(typeof result.text === 'string' && result.text.length > 0, 'index ' + i + ' must still be a non-empty string');
    });
  });
});

console.log('\n=== check-isc-s1-ideate-success-lens-cycling results: ' + passed + ' passed, ' + failed + ' failed ===');
if (failed > 0) process.exit(1);
