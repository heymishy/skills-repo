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

module.exports = { validateRequiredEnvVars, REQUIRED_ENV_VARS };
