'use strict';

/**
 * validateLicence(accessToken) -> Promise<{ valid: boolean }>
 *
 * Checks whether the GitHub user has an active Copilot licence.
 * Security: accessToken must never be logged.
 */
async function validateLicence(accessToken) {
  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
    return { valid: false };
  }
  // Real implementation would call GitHub Copilot billing API
  // Stub: treat non-empty token as valid for unit test purposes
  return { valid: true };
}

module.exports = { validateLicence };
