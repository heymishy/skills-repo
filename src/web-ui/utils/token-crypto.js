'use strict';

// src/web-ui/utils/token-crypto.js -- sps-s1
//
// Encrypts the login token before it is stored in Redis, so the third-party store only ever holds ciphertext.
// AES-256-GCM, a random 12-byte nonce per encryption, and the session id as additional authenticated data so a
// ciphertext copied to another session fails to decrypt. Stored form: v1.<nonce>.<tag>.<ciphertext> (base64url parts).
//
// Fail safe, never fail open: every problem (no key, wrong key, corrupt or tampered value, unknown version) means "no
// token", never an exception. Nothing here logs; the key, the token and the ciphertext never appear in any message.

const crypto = require('crypto');

const VERSION = 'v1';
const KEY_ENV = 'SESSION_ENCRYPTION_KEY';
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

/**
 * @param {object} env - usually process.env
 * @returns {Buffer|null} the 32-byte key, or null when it is missing or not exactly 32 bytes of base64
 */
function loadKey(env) {
  try {
    const v = env && env[KEY_ENV];
    if (typeof v !== 'string' || !v || !/^[A-Za-z0-9+/]+={0,2}$/.test(v)) { return null; }
    const key = Buffer.from(v, 'base64');
    return key.length === 32 ? key : null;
  } catch (_) { return null; }
}

/** @returns {string} v1.<nonce>.<tag>.<ciphertext> */
function encrypt(token, sessionId, key) {
  const nonce = crypto.randomBytes(NONCE_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(Buffer.from(String(sessionId), 'utf8'));
  const ct = Buffer.concat([cipher.update(String(token), 'utf8'), cipher.final()]);
  return [VERSION, nonce.toString('base64url'), cipher.getAuthTag().toString('base64url'), ct.toString('base64url')].join('.');
}

/** @returns {string|null} the token, or null on any problem. Never throws. */
function decrypt(value, sessionId, key) {
  try {
    if (typeof value !== 'string' || !key) { return null; }
    const parts = value.split('.');
    if (parts.length !== 4 || parts[0] !== VERSION) { return null; }
    const nonce = Buffer.from(parts[1], 'base64url');
    const tag = Buffer.from(parts[2], 'base64url');
    const ct = Buffer.from(parts[3], 'base64url');
    if (nonce.length !== NONCE_BYTES || tag.length !== TAG_BYTES) { return null; }
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAAD(Buffer.from(String(sessionId), 'utf8'));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  } catch (_) { return null; }
}

module.exports = { loadKey, encrypt, decrypt, KEY_ENV };
