'use strict';

// user-flags.js — D37-injectable adapter for user first-login flag (lab-s2.3)
// Default stub throws — call setUserFlagsAdapter() with a real implementation before use.
//
// The adapter must implement:
//   getFirstLoginFlag(userId)   → Promise<boolean>   (true = first login, false = returning user)
//   clearFirstLoginFlag(userId) → Promise<void>      (mark first-login complete so next login → /dashboard)

let _userFlagsAdapter = null;

/**
 * D37 mandatory: default stub throws if called without wiring.
 * @returns {object}
 */
function _requireAdapter() {
  if (!_userFlagsAdapter) {
    throw new Error('Adapter not wired: userFlagsAdapter. Call setUserFlagsAdapter() before use.');
  }
  return _userFlagsAdapter;
}

/**
 * Wire the real user-flags adapter (done in server.js — separate D37 wiring task).
 * @param {{ getFirstLoginFlag: Function, clearFirstLoginFlag: Function }} impl
 */
function setUserFlagsAdapter(impl) {
  _userFlagsAdapter = impl;
}

/**
 * Get the first-login flag for a user.
 * Returns true if this is the user's first login (they should be sent to /welcome).
 * Returns false if the user has already completed /welcome (send to /dashboard).
 * @param {string|number} userId
 * @returns {Promise<boolean>}
 */
async function getFirstLoginFlag(userId) {
  return _requireAdapter().getFirstLoginFlag(userId);
}

/**
 * Clear the first-login flag for a user.
 * Called during the auth callback when a first-time user is detected.
 * After this call, subsequent logins return getFirstLoginFlag() === false.
 * @param {string|number} userId
 * @returns {Promise<void>}
 */
async function clearFirstLoginFlag(userId) {
  return _requireAdapter().clearFirstLoginFlag(userId);
}

module.exports = { setUserFlagsAdapter, getFirstLoginFlag, clearFirstLoginFlag };
