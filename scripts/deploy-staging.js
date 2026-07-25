'use strict';

/**
 * dsn-s1 -- a single, correct entry point for deploying to wuce-staging, with
 * a post-deploy check that fails loudly instead of silently.
 *
 * Root incident this fixes (see workspace/capture-log.md, 2026-07-24,
 * recurred twice in one day): a bare `flyctl deploy --app wuce-staging`
 * (missing --config fly.staging.toml) silently deploys using the root
 * fly.toml (production config) instead, dropping MOCK_LLM_GATEWAY=true --
 * the flag that keeps staging's E2E specs from making real, billed
 * Anthropic API calls. Both times, this was only caught by a human noticing
 * "Unexpected Anthropic response format" warnings in live server logs, up
 * to ~1h18m after the bad deploy.
 *
 * Fix: hardcode the correct flags here (not configurable by design -- there
 * is no CLI arg or env var that can override --config away from
 * fly.staging.toml), then immediately verify the live deployed config
 * actually has MOCK_LLM_GATEWAY=true before declaring success.
 *
 * Command runner is an injectable adapter (D37) so the safety-check LOGIC
 * (parsing, pass/fail decision) is unit-testable without invoking a real
 * flyctl binary.
 */

let _runCommand = null;

function setCommandRunner(fn) {
  _runCommand = fn;
}

function _requireCommandRunner() {
  if (!_runCommand) {
    throw new Error('Adapter not wired: commandRunner. Call setCommandRunner() with a real implementation before use.');
  }
  return _runCommand;
}

const DEPLOY_ARGS = ['deploy', '--remote-only', '--config', 'fly.staging.toml', '--app', 'wuce-staging'];
// JSON is flyctl's default output format for `config show` -- there is no
// --json flag (confirmed via `flyctl config show --help`; passing one errors).
const CONFIG_SHOW_ARGS = ['config', 'show', '--app', 'wuce-staging'];

/**
 * Run the deploy, then verify the live config actually has
 * MOCK_LLM_GATEWAY=true. Returns { ok: boolean, message: string }.
 * Never throws for an expected failure mode (a bad deploy result) -- only
 * for a genuinely unexpected error (e.g. flyctl itself missing), which the
 * CLI entrypoint below catches and reports.
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function deployAndVerify() {
  const run = _requireCommandRunner();

  const deployResult = await run('flyctl', DEPLOY_ARGS);
  if (deployResult.status !== 0) {
    return { ok: false, message: 'flyctl deploy failed (exit ' + deployResult.status + '):\n' + (deployResult.stderr || deployResult.stdout || '') };
  }

  const configResult = await run('flyctl', CONFIG_SHOW_ARGS);
  if (configResult.status !== 0) {
    return { ok: false, message: 'Deploy succeeded, but "flyctl config show" failed (exit ' + configResult.status + ') -- could not verify the live config: ' + (configResult.stderr || configResult.stdout || '') };
  }

  let parsed;
  try {
    parsed = JSON.parse(configResult.stdout);
  } catch (err) {
    return { ok: false, message: 'Deploy succeeded, but the live config output could not be parsed as JSON: ' + err.message };
  }

  const env = (parsed && parsed.env) || {};
  if (env.MOCK_LLM_GATEWAY !== 'true') {
    return {
      ok: false,
      message:
        'DEPLOY SUCCEEDED BUT THE LIVE CONFIG IS WRONG: MOCK_LLM_GATEWAY is ' +
        (env.MOCK_LLM_GATEWAY === undefined ? 'missing entirely' : 'set to "' + env.MOCK_LLM_GATEWAY + '"') +
        ' (expected "true"). This means fly.staging.toml\'s [env] block was not applied -- ' +
        'staging is very likely now making REAL, BILLED Anthropic API calls. ' +
        'Re-run this script (do not use a raw flyctl deploy) to fix.'
    };
  }

  return { ok: true, message: 'Deploy succeeded and MOCK_LLM_GATEWAY=true confirmed on the live wuce-staging config.' };
}

// ---------------------------------------------------------------------------
// Real command runner using child_process.spawnSync -- wired in the CLI
// entrypoint below, never at module load, so a plain require() of this file
// (e.g. from a test) never shells out.
// ---------------------------------------------------------------------------
function createRealCommandRunner() {
  const { spawnSync } = require('child_process');
  return async function(cmd, args) {
    const result = spawnSync(cmd, args, { encoding: 'utf8' });
    return { status: result.status, stdout: result.stdout, stderr: result.stderr };
  };
}

if (require.main === module) {
  setCommandRunner(createRealCommandRunner());
  deployAndVerify().then(function(result) {
    if (result.ok) {
      console.log(result.message);
      process.exit(0);
    } else {
      console.error(result.message);
      process.exit(1);
    }
  }).catch(function(err) {
    console.error('deploy-staging failed unexpectedly:', err.message);
    process.exit(1);
  });
}

module.exports = { deployAndVerify, setCommandRunner, DEPLOY_ARGS, CONFIG_SHOW_ARGS };
