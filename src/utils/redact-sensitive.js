'use strict';

/**
 * redactApiKey(str) -> string
 *
 * Replaces the actual value of COPILOT_PROVIDER_API_KEY in a string with [REDACTED].
 * Must be called before including any user-provided configuration values in logs or HTTP responses.
 */
function redactApiKey(str) {
  if (typeof str !== 'string') { return str; }
  var apiKey = process.env.COPILOT_PROVIDER_API_KEY;
  if (apiKey && apiKey.length > 4) {
    var escaped = apiKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    str = str.replace(new RegExp(escaped, 'g'), '[REDACTED]');
  }
  return str;
}

module.exports = { redactApiKey };
