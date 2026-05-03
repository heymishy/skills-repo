'use strict';
const { redactApiKey } = require('../utils/redact-sensitive');

const BYOK_VARS = [
  'COPILOT_PROVIDER_TYPE',
  'COPILOT_PROVIDER_BASE_URL',
  'COPILOT_PROVIDER_API_KEY',
  'COPILOT_PROVIDER_MODEL'
];

let _logger = {
  info:  function(evt, data) { process.stdout.write('[byok-config] ' + evt + ' ' + JSON.stringify(data || {}) + '\n'); },
  warn:  function(msg)       { process.stderr.write('[byok-config] WARN ' + msg + '\n'); },
  error: function(msg)       { process.stderr.write('[byok-config] ERROR ' + msg + '\n'); }
};

function setLogger(logger) { _logger = logger; }

/**
 * getBYOKEnv() -> Record<string, string>
 *
 * Returns the set of BYOK env vars to inject into subprocess environment.
 * Rules:
 * - All 4 BYOK vars present: return all 4 (plus OFFLINE if set)
 * - COPILOT_OFFLINE=true alone: return { COPILOT_OFFLINE: 'true' }
 * - Neither condition met: return {}
 * - Reads vars fresh at call time (no caching)
 * NEVER returns COPILOT_PROVIDER_API_KEY value in logs or error messages.
 */
function getBYOKEnv() {
  var env = process.env;
  var byokActive = BYOK_VARS.every(function(v) { return env[v]; });
  var offlineMode = env.COPILOT_OFFLINE === 'true';

  if (byokActive) {
    var result = {};
    BYOK_VARS.forEach(function(v) { result[v] = env[v]; });
    if (offlineMode) { result.COPILOT_OFFLINE = 'true'; }
    // Log active state — type only, never key value
    _logger.info('byok_env_active', {
      providerType: env.COPILOT_PROVIDER_TYPE,
      hasBaseUrl:   !!env.COPILOT_PROVIDER_BASE_URL,
      hasModel:     !!env.COPILOT_PROVIDER_MODEL,
      hasApiKey:    true
      // key value OMITTED intentionally
    });
    return result;
  }

  if (offlineMode) {
    _logger.info('byok_offline_mode', { offlineOnly: true });
    return { COPILOT_OFFLINE: 'true' };
  }

  return {};
}

/**
 * validateByokConfig()
 *
 * Checks for partially-configured BYOK and logs a warning.
 * Does NOT throw. Safe to call at startup.
 */
function validateByokConfig() {
  var env = process.env;
  if (env.COPILOT_PROVIDER_TYPE && !env.COPILOT_PROVIDER_BASE_URL) {
    _logger.warn(
      'BYOK configuration warning: COPILOT_PROVIDER_TYPE is set but COPILOT_PROVIDER_BASE_URL is missing. ' +
      'BYOK mode will not activate until all required vars are set.'
    );
  }
}

module.exports = { getBYOKEnv, validateByokConfig, setLogger };
