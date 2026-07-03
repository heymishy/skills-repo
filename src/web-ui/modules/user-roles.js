'use strict';

// user-roles.js — injectable user role lookup module (arl-s1, D37 compliant).
// Default stub throws — call setGetUserRole() with a real implementation before use.

let _getUserRole = null;

function setGetUserRole(fn) {
  _getUserRole = fn;
}

/**
 * Return the role for a tenant. Falls back to 'user' if no row found.
 * @param {string} tenantId
 * @returns {Promise<string>}
 */
async function getUserRole(tenantId) {
  if (!_getUserRole) {
    throw new Error('Adapter not wired: getUserRole. Call setGetUserRole() before use.');
  }
  return _getUserRole(tenantId);
}

module.exports = { getUserRole, setGetUserRole };
