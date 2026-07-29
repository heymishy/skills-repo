'use strict';

// validate-env.js — startup environment variable validation (ADR-004)
// All required runtime configuration must be present before the server binds to a port.
// Throws a descriptive error naming ALL missing variables in one message.

const REQUIRED_ENV_VARS = [
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'SESSION_SECRET'
];

/**
 * Validate that all required environment variables are set.
 * Throws an Error naming every missing variable if any are absent.
 * Does not throw if all are present.
 */
function validateRequiredEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      'Missing required environment variable(s): ' + missing.join(', ')
    );
  }
}

// ebv-s1 — a second, distinct boot-time check for vars that are legitimately
// optional in some deployments but have silently caused real incidents when
// missing/mismatched (workspace/learnings.md, 2026-07-19/20): each one was
// previously diagnosed only by reading source code to find the exact var
// name, then confirming via `flyctl secrets list` that it was absent or
// wrong. This function warns (never throws, never exits) so the gap shows
// up in `flyctl logs` on the very first request instead.
//
// POSTHOG_KEY_STAGING/POSTHOG_KEY_PROD are deliberately NOT covered here —
// src/web-ui/modules/posthog-config.js's initPostHogFlagsClient() already
// logs a clear, non-fatal error for that case (see decisions.md).
//
// Injectable envVars/logger, matching posthog-config.js's own established
// pattern for testability without mutating real process.env.
function warnOnOptionalEnvVars(envVars, logger) {
  envVars = envVars || {};
  const log = logger || console;

  if (!envVars.PLATFORM_TENANT_ID) {
    log.warn(
      '[validate-env] PLATFORM_TENANT_ID is not set — platform self-registration will be skipped ' +
      '(registerSelfAsProduct() silently no-ops).'
    );
  }

  const adminLogins = String(envVars.ADMIN_GITHUB_LOGINS || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  if (adminLogins.length === 0) {
    log.warn(
      '[validate-env] ADMIN_GITHUB_LOGINS is not set (or resolves to zero logins) — ' +
      'no admin users will be seeded; /admin/credits will be unreachable for everyone.'
    );
  }

  const provider = String(envVars.SKILL_EXECUTOR_PROVIDER || 'anthropic').toLowerCase();
  if (provider === 'copilot') {
    log.warn(
      '[validate-env] SKILL_EXECUTOR_PROVIDER=copilot — this requires each signed-in user\'s ' +
      'own GitHub token to carry Copilot licensing/scope, which cannot be verified at boot time. ' +
      'A user without a Copilot seat will see every skill turn fail per-request.'
    );
  } else if (!envVars.ANTHROPIC_API_KEY) {
    log.warn(
      '[validate-env] SKILL_EXECUTOR_PROVIDER is unset or "anthropic" (the default) and ' +
      'ANTHROPIC_API_KEY is not set — skill turns will fail.'
    );
  }
}

module.exports = { validateRequiredEnvVars, REQUIRED_ENV_VARS, warnOnOptionalEnvVars };
