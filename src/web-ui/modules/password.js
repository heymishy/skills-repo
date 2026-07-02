'use strict';

// password.js — bcrypt wrapper with D37 injectable adapter.
// Default stub throws to enforce production wiring — call setPasswordAdapter(require('bcrypt')) before use.
// Cost factor is hard-coded to 10 (minimum per security NFR); never lower.
//
// Usage:
//   const { setPasswordAdapter, hashPassword, verifyPassword } = require('./modules/password');
//   setPasswordAdapter(require('bcrypt'));
//   const hash = await hashPassword('plaintext');
//   const ok   = await verifyPassword('plaintext', hash);

const COST_FACTOR = 10;

// D37: injectable adapter — default stub throws.
let _adapter = {
  hash:    function() { throw new Error('Adapter not wired: passwordAdapter. Call setPasswordAdapter() before use.'); },
  compare: function() { throw new Error('Adapter not wired: passwordAdapter. Call setPasswordAdapter() before use.'); }
};

/**
 * Replace the bcrypt adapter (used in tests and production startup).
 * @param {{ hash: Function, compare: Function }} impl — bcrypt-compatible adapter
 */
function setPasswordAdapter(impl) {
  _adapter = impl;
}

/**
 * Hash a plaintext password using bcrypt at cost factor >= 10.
 * NEVER logs or returns the plaintext — only the hash.
 * @param {string} plaintext
 * @returns {Promise<string>} bcrypt hash string
 */
async function hashPassword(plaintext) {
  return _adapter.hash(plaintext, COST_FACTOR);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 * @param {string} plaintext
 * @param {string} hash — stored bcrypt hash from the users table
 * @returns {Promise<boolean>}
 */
async function verifyPassword(plaintext, hash) {
  return _adapter.compare(plaintext, hash);
}

module.exports = { setPasswordAdapter, hashPassword, verifyPassword };
