'use strict';

/**
 * scripts/regenerate-llm-fixtures.js — bri-s3.1 (AC3)
 *
 * Regenerates one or more mock-LLM-gateway fixture files
 * (tests/e2e/fixtures/llm-gateway/<stage>.<scenarioName>.json) by calling the
 * real skill-turn-executor.js client against a live provider and writing the
 * response into the fixture file in place — no manual JSON hand-editing.
 *
 * REQUIRES LIVE CREDENTIALS to actually regenerate against a real dev/staging
 * response:
 *   ANTHROPIC_API_KEY  (SKILL_EXECUTOR_PROVIDER=anthropic, default), or
 *   GITHUB_TOKEN       with the copilot scope (SKILL_EXECUTOR_PROVIDER=copilot)
 *
 * Neither is available in this development/CI environment. This script is
 * structurally complete and covered by tests/check-bri-s3.1-mock-llm-gateway.js
 * against an injected stub "real response" fetcher (per the test plan's
 * documented External-dependency gap) — but it has not been exercised against
 * a real dev/staging endpoint. Running it for real requires those credentials
 * to be configured first. Periodic manual regeneration against real
 * staging, reviewed by an operator, is the mitigation for that gap
 * (test-plan.md "Coverage gaps").
 *
 * Usage:
 *   node scripts/regenerate-llm-fixtures.js --stage discovery --scenario success
 *   node scripts/regenerate-llm-fixtures.js --all   (regenerates every fixture file currently on disk)
 */

const fs   = require('fs');
const path = require('path');

const DEFAULT_FIXTURE_DIR = path.join(__dirname, '..', 'tests', 'e2e', 'fixtures', 'llm-gateway');

/**
 * Default "real response" fetcher — calls the real skill-turn-executor.js
 * client. Requires live credentials; throws a clear, actionable error if
 * they are not configured rather than silently writing a fake value
 * (mirrors the D37 stub-must-throw convention used elsewhere in this repo).
 * @param {string} stage
 * @param {string} model
 * @param {string} scenarioName
 * @returns {Promise<object>} fixture-shaped object ready to be written to disk
 */
async function defaultFetchRealResponse(stage, model, scenarioName) {
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasGithubToken  = !!process.env.GITHUB_TOKEN;
  if (!hasAnthropicKey && !hasGithubToken) {
    throw new Error(
      'regenerate-llm-fixtures: no live credentials configured. Set ANTHROPIC_API_KEY ' +
      '(SKILL_EXECUTOR_PROVIDER=anthropic) or GITHUB_TOKEN with the copilot scope ' +
      '(SKILL_EXECUTOR_PROVIDER=copilot) to regenerate fixture "' + stage + '.' + scenarioName + '" ' +
      'against a real dev/staging response.'
    );
  }

  // eslint-disable-next-line global-require
  const { skillTurnExecutor } = require('../src/modules/skill-turn-executor');
  const systemPrompt =
    'You are regenerating a mock-LLM-gateway fixture for the "' + stage + '" skill stage, ' +
    'scenario "' + scenarioName + '". Produce a realistic ' + scenarioName + ' response for this stage.';

  const result = await skillTurnExecutor(systemPrompt, [], 'Begin the session.', process.env.GITHUB_TOKEN || '');
  const text = typeof result === 'string' ? result : (result && result.text) || '';

  return {
    stage: stage,
    scenarioName: scenarioName,
    model: model || (result && result.usage && result.usage.model) || 'unknown',
    response: text,
    usage: (result && result.usage) || {},
    regeneratedAt: new Date().toISOString(),
    source: hasAnthropicKey ? 'anthropic-live' : 'copilot-live'
  };
}

/**
 * Regenerate a single fixture file in place. No manual JSON hand-editing
 * required (AC3). Logs an audit entry naming the fixture changed and its
 * source (NFR — Audit).
 * @param {object}   opts
 * @param {string}   opts.stage
 * @param {string}   opts.scenarioName
 * @param {string}   [opts.model]
 * @param {string}   [opts.fixtureDir]
 * @param {function} [opts.fetchRealResponse] — injectable so tests can stub the "real response" source
 * @param {function} [opts.log] — injectable audit logger; defaults to console.log
 * @returns {Promise<{filePath: string, fixture: object}>}
 */
async function regenerateFixture(opts) {
  opts = opts || {};
  const stage        = opts.stage;
  const scenarioName = opts.scenarioName;
  const model        = opts.model || null;
  const fixtureDir   = opts.fixtureDir || DEFAULT_FIXTURE_DIR;
  const fetchReal    = opts.fetchRealResponse || defaultFetchRealResponse;
  const log          = opts.log || console.log;

  if (!stage || !scenarioName) {
    throw new Error('regenerateFixture requires both a stage and a scenarioName');
  }

  const fixture  = await fetchReal(stage, model, scenarioName);
  const fileName = stage + '.' + scenarioName + '.json';
  const filePath = path.join(fixtureDir, fileName);

  fs.mkdirSync(fixtureDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(fixture, null, 2) + '\n', 'utf8');

  log(
    '[regenerate-llm-fixtures] Regenerated ' + fileName +
    ' from source=' + (fixture.source || 'unknown') +
    ' at ' + (fixture.regeneratedAt || new Date().toISOString())
  );

  return { filePath: filePath, fixture: fixture };
}

/**
 * Regenerate every fixture file currently on disk in fixtureDir.
 * @param {object} [opts] — same shape as regenerateFixture's opts, minus stage/scenarioName
 * @returns {Promise<Array<{filePath: string, fixture: object}>>}
 */
async function regenerateAll(opts) {
  opts = opts || {};
  const fixtureDir = opts.fixtureDir || DEFAULT_FIXTURE_DIR;
  const files = fs.existsSync(fixtureDir)
    ? fs.readdirSync(fixtureDir).filter(function(f) { return f.endsWith('.json'); })
    : [];

  const results = [];
  for (let i = 0; i < files.length; i++) {
    const base   = files[i].replace(/\.json$/, '');
    const parts  = base.split('.');
    const scenarioName = parts[parts.length - 1];
    const stage  = parts.slice(0, parts.length - 1).join('.');
    // eslint-disable-next-line no-await-in-loop
    results.push(await regenerateFixture(Object.assign({}, opts, { stage: stage, scenarioName: scenarioName })));
  }
  return results;
}

function _parseArgs(argv) {
  const out = { all: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') out.all = true;
    else if (a === '--stage') out.stage = argv[++i];
    else if (a === '--scenario') out.scenario = argv[++i];
    else if (a === '--model') out.model = argv[++i];
  }
  return out;
}

async function _main() {
  const args = _parseArgs(process.argv.slice(2));
  if (args.all) {
    const results = await regenerateAll({});
    console.log('[regenerate-llm-fixtures] Regenerated ' + results.length + ' fixture(s).');
    return;
  }
  if (!args.stage || !args.scenario) {
    console.error('Usage: node scripts/regenerate-llm-fixtures.js --stage <stage> --scenario <success|failure> [--model <model>]');
    console.error('       node scripts/regenerate-llm-fixtures.js --all');
    process.exitCode = 1;
    return;
  }
  await regenerateFixture({ stage: args.stage, scenarioName: args.scenario, model: args.model });
}

if (require.main === module) {
  _main().catch(function(err) {
    console.error('[regenerate-llm-fixtures] Failed: ' + (err && err.message ? err.message : err));
    process.exitCode = 1;
  });
}

module.exports = { regenerateFixture, regenerateAll, defaultFetchRealResponse, DEFAULT_FIXTURE_DIR };
