'use strict';

/**
 * mock-llm-gateway.js — D37 injectable adapter (bri-s3.1)
 *
 * Backend mock LLM gateway returning canned fixture responses keyed by
 * (stage, model, scenarioName). Wired alongside the real skill-turn-executor.js
 * client (src/modules/skill-turn-executor.js) so `@mocked`-tagged E2E journey
 * specs run deterministically and fast, without depending on real LLM API
 * calls or their latency/cost/nondeterminism.
 *
 * SECURITY (mirrors tests/e2e/fixtures/auth.js's NODE_ENV=test guard pattern,
 * per ADR-018): the gateway is only reachable when isMockGatewayEnabled()
 * returns true. NODE_ENV === 'production' is a hard override — the gateway
 * NEVER activates in that case, regardless of any other flag. This closes the
 * "activated by production configuration error" gap: an operator who
 * accidentally sets MOCK_LLM_GATEWAY=true in a real environment is still
 * protected as long as NODE_ENV is correctly set to 'production' there.
 *
 * Activation rules (see isMockGatewayEnabled):
 *   NODE_ENV=test          — always enables (standard test-mode signal)
 *   MOCK_LLM_GATEWAY=true  — explicit opt-in for local/CI @mocked runs outside NODE_ENV=test
 *   NODE_ENV=production    — hard override: gateway never activates, even with MOCK_LLM_GATEWAY=true
 *
 * D37: the adapter default stub throws — call setMockGatewayClient() with a
 * real implementation before use, or call wireDefaultMockGatewayClient() to
 * wire the built-in fixture-file-backed client.
 */

const fs   = require('fs');
const path = require('path');

const FIXTURE_DIR = path.join(__dirname, '..', '..', '..', 'tests', 'e2e', 'fixtures', 'llm-gateway');

// The 7 gate-map.js pipeline stages this story's fixture matrix covers (AC2/AC4).
// Resolved 2026-07-09 (decisions.md): all 7 confirmed LLM-invoking via
// routes/journey.js's SLASH_CAPABILITY_MAP — branch-setup/branch-complete
// included, not just the 5 outer-loop stages.
const STAGES = Object.freeze([
  'discovery',
  'benefit-metric',
  'definition',
  'test-plan',
  'definition-of-ready',
  'branch-setup',
  'branch-complete'
]);

let _mockGatewayClient = null;

/**
 * D37 mandatory: default stub throws if called without wiring.
 */
function _requireAdapter() {
  if (!_mockGatewayClient) {
    throw new Error('Adapter not wired: mockGatewayClient. Call setMockGatewayClient() with a real implementation before use.');
  }
  return _mockGatewayClient;
}

/**
 * Wire a mock gateway client implementation. Must implement:
 *   getMockResponse(stage, model, scenarioName) -> { text, usage, ... }
 * @param {{getMockResponse: Function}} impl
 */
function setMockGatewayClient(impl) {
  _mockGatewayClient = impl;
}

/**
 * Reset wiring back to unwired (stub throws again). Test-only helper.
 */
function resetMockGatewayClient() {
  _mockGatewayClient = null;
}

/**
 * True when the mock gateway is permitted to activate in the current process.
 * NODE_ENV=production is a hard override — never activates regardless of
 * MOCK_LLM_GATEWAY, so a stray MOCK_LLM_GATEWAY=true in a real environment
 * cannot silently route production traffic through canned fixtures.
 * @returns {boolean}
 */
function isMockGatewayEnabled() {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.NODE_ENV === 'test' || process.env.MOCK_LLM_GATEWAY === 'true';
}

function _fixtureFileName(stage, scenarioName) {
  return stage + '.' + scenarioName + '.json';
}

/**
 * Load + parse a single fixture file for (stage, scenarioName).
 * Throws a clear error (never returns undefined/empty) for an unrecognised key,
 * mirroring the D37 stub-must-throw convention (test plan AC1 edge case).
 */
function _loadFixtureFile(stage, scenarioName) {
  const fileName = _fixtureFileName(stage, scenarioName);
  const filePath = path.join(FIXTURE_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      'No fixture found for stage="' + stage + '" scenarioName="' + scenarioName + '" ' +
      '(expected ' + fileName + ' in ' + FIXTURE_DIR + ')'
    );
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

/**
 * Built-in mock gateway client — reads canned fixture JSON files from
 * tests/e2e/fixtures/llm-gateway/. Deterministic: identical
 * (stage, model, scenarioName) always returns an equal response object (AC1).
 */
const _defaultMockGatewayClient = {
  getMockResponse: function(stage, model, scenarioName) {
    const fixture = _loadFixtureFile(stage, scenarioName);
    return {
      text: fixture.response,
      usage: {
        input_tokens:          (fixture.usage && fixture.usage.input_tokens) || 0,
        output_tokens:         (fixture.usage && fixture.usage.output_tokens) || 0,
        cache_read_tokens:     0,
        cache_creation_tokens: 0,
        model:                 model || fixture.model || 'mock'
      },
      stage:        stage,
      scenarioName: scenarioName,
      fixtureModel: fixture.model
    };
  }
};

/**
 * Wire the built-in fixture-file-backed client as the active adapter.
 * Call once at process startup (or test setup) instead of hand-rolling a
 * client via setMockGatewayClient().
 */
function wireDefaultMockGatewayClient() {
  setMockGatewayClient(_defaultMockGatewayClient);
}

/**
 * Public lookup — returns the canned fixture response for (stage, model, scenarioName).
 * D37: throws via _requireAdapter() if no adapter has been wired.
 * @param {string} stage
 * @param {string} model
 * @param {string} scenarioName
 * @returns {{text:string, usage:object, stage:string, scenarioName:string}}
 */
function getMockResponse(stage, model, scenarioName) {
  return _requireAdapter().getMockResponse(stage, model, scenarioName);
}

/**
 * Inventory helper (AC2) — scans FIXTURE_DIR and returns fixture counts
 * grouped by stage/scenario. Used by the integration test asserting the
 * 7-stage, minimum-14-fixture matrix.
 * @returns {{total:number, byStage: Object<string,{success:number, failure:number, files:string[]}>}}
 */
function inventoryFixtures() {
  const files = fs.existsSync(FIXTURE_DIR)
    ? fs.readdirSync(FIXTURE_DIR).filter(function(f) { return f.endsWith('.json'); })
    : [];
  const byStage = {};
  STAGES.forEach(function(s) { byStage[s] = { success: 0, failure: 0, files: [] }; });
  files.forEach(function(f) {
    const base = f.replace(/\.json$/, '');
    const parts = base.split('.');
    if (parts.length < 2) return;
    const scenario = parts[parts.length - 1];
    const stage = parts.slice(0, parts.length - 1).join('.');
    if (!byStage[stage]) byStage[stage] = { success: 0, failure: 0, files: [] };
    byStage[stage].files.push(f);
    if (scenario === 'success') byStage[stage].success++;
    else byStage[stage].failure++; // any non-success scenario counts as failure/edge-case
  });
  return { total: files.length, byStage: byStage };
}

module.exports = {
  STAGES,
  FIXTURE_DIR,
  setMockGatewayClient,
  resetMockGatewayClient,
  wireDefaultMockGatewayClient,
  isMockGatewayEnabled,
  getMockResponse,
  inventoryFixtures
};
