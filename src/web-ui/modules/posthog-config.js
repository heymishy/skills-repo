'use strict';

// posthog-config.js — bri-s1.2: env-driven PostHog project/key resolution and
// server-startup wiring of the real PostHog flags client into the bri-s1.1
// adapter contract (posthog-flags.js).
//
// resolvePostHogApiKey() never returns the non-active environment's key, even
// when both are present in the input env vars (AC3) — and throws, naming the
// specific missing variable, rather than silently falling back to the other
// environment's key (AC4).
//
// initPostHogFlagsClient() wires a real PostHog client into the S1.1 adapter
// contract at startup. All external dependencies (the PostHog SDK constructor,
// the adapter setter, the logger) are injected via the `deps` parameter so the
// function can be tested in isolation without a real network call or a real
// posthog-node import (Integration tests, Test plan bri-s1.2).

/**
 * Resolve the PostHog API key for the given environment.
 * Never falls back to the other environment's key — throws, naming the
 * specific missing env var, when the active environment's key is absent.
 *
 * @param {string} envName - 'staging' or 'production'
 * @param {object} [envVars] - a map of environment variables (e.g. process.env)
 * @returns {string} the resolved API key for envName
 */
function resolvePostHogApiKey(envName, envVars) {
  envVars = envVars || {};

  if (envName === 'staging') {
    var stagingKey = envVars.POSTHOG_KEY_STAGING;
    if (!stagingKey) {
      throw new Error(
        'PostHog config error: POSTHOG_KEY_STAGING is missing or empty. ' +
        'The staging environment requires POSTHOG_KEY_STAGING to be set — ' +
        'refusing to fall back to the production key.'
      );
    }
    return stagingKey;
  }

  if (envName === 'production') {
    var prodKey = envVars.POSTHOG_KEY_PROD;
    if (!prodKey) {
      throw new Error(
        'PostHog config error: POSTHOG_KEY_PROD is missing or empty. ' +
        'The production environment requires POSTHOG_KEY_PROD to be set.'
      );
    }
    return prodKey;
  }

  throw new Error(
    'PostHog config error: unrecognized environment "' + envName + '" — ' +
    'expected "staging" or "production".'
  );
}

/**
 * Wire the real PostHog flags client into the S1.1 adapter contract at startup.
 * Resolves the environment-appropriate key, constructs a PostHog client with it,
 * and calls setPostHogFlagsAdapter() with a real evaluateFlag() implementation.
 *
 * Never throws — a missing/misconfigured key logs a clear, key-value-free error
 * identifying the missing variable and returns { wired: false }, rather than
 * crashing the process (AC4) or falling back to the other environment's key.
 *
 * @param {string} envName - 'staging' or 'production'
 * @param {object} envVars - process.env (or an equivalent map) — injected for testability
 * @param {object} [deps] - { PostHogClient, setPostHogFlagsAdapter, logger } — all injected for testability
 * @returns {{ wired: boolean, project?: string, error?: Error }}
 */
function initPostHogFlagsClient(envName, envVars, deps) {
  deps = deps || {};
  var log = deps.logger || console;
  var PostHogClientCtor = deps.PostHogClient;
  var setAdapter = deps.setPostHogFlagsAdapter;

  var key;
  try {
    key = resolvePostHogApiKey(envName, envVars);
  } catch (err) {
    log.error('[posthog-config] ' + err.message);
    return { wired: false, error: err };
  }

  if (!PostHogClientCtor) {
    // Real posthog-node import — only reached outside tests, where deps.PostHogClient
    // is always injected as a fake constructor (see tests/check-bri-s1.2-staging-prod-separation.js).
    PostHogClientCtor = require('posthog-node').PostHog;
  }

  var client = new PostHogClientCtor(key, { host: 'https://us.i.posthog.com' });

  if (typeof setAdapter === 'function') {
    setAdapter({
      evaluateFlag: function(flagKey, context) {
        var distinctId = (context && context.tenantId) || 'anonymous';
        return client.isFeatureEnabled(flagKey, distinctId, { groups: context && context.groups });
      }
    });
  }

  // Audit NFR — name the active project, never log the key value itself.
  log.info('[posthog-config] PostHog flags client wired to the ' + envName + ' project');
  return { wired: true, project: envName };
}

module.exports = { resolvePostHogApiKey: resolvePostHogApiKey, initPostHogFlagsClient: initPostHogFlagsClient };
