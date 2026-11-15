'use strict';

const { Redis } = require('@upstash/redis');
const tokenCrypto = require('../utils/token-crypto');

const SESSION_TTL_SECONDS = 86400; // 24 hours
const KEY_PREFIX = 'session:';

let _client = null;

function _getClient() {
  if (!_client && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    _client = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    });
  }
  return _client;
}

// sps-s1: test seam, lets tests supply a recording double instead of the real @upstash/redis client.
function _setClientForTesting(c) { _client = c || null; }

function _sanitise(data) {
  const safe = Object.assign({}, data);
  delete safe.accessToken;
  delete safe.accessTokenEnc; // only this adapter writes it, from the explicit token argument below
  return safe;
}

// sps-s1: the login token is stored ONLY as ciphertext (AES-256-GCM, bound to the session id) and only when
// SESSION_ENCRYPTION_KEY is a valid 32-byte base64 key. Without a valid key the token is dropped, exactly as before:
// the session is restored with its identity but signed out. A plaintext token never reaches Redis.
/**
 * @param {string} id
 * @param {object} data   - session data; any accessToken on it is ignored (session.js already strips it)
 * @param {string} [accessToken] - the login token, passed separately so it cannot leak through the data object
 */
async function writeSession(id, data, accessToken) {
  const client = _getClient();
  if (!client) return;
  const safe = _sanitise(data);
  const key = tokenCrypto.loadKey(process.env);
  if (key && typeof accessToken === 'string' && accessToken) {
    safe.accessTokenEnc = tokenCrypto.encrypt(accessToken, id, key);
  }
  await client.set(KEY_PREFIX + id, JSON.stringify(safe), { ex: SESSION_TTL_SECONDS });
}

// Turns stored data back into session data. Never trusts a plaintext accessToken read from Redis; restores the token only
// from a ciphertext that decrypts under the current key and this session id; any failure leaves the session signed out.
function _restore(id, stored) {
  if (!stored || typeof stored !== 'object') return stored;
  const out = Object.assign({}, stored);
  const enc = out.accessTokenEnc;
  delete out.accessTokenEnc;
  delete out.accessToken;
  if (enc !== undefined) {
    const token = tokenCrypto.decrypt(enc, id, tokenCrypto.loadKey(process.env));
    if (token) out.accessToken = token;
  }
  return out;
}

let _keyWarned = false;
function _resetKeyWarningForTesting() { _keyWarned = false; }

/**
 * Logs one warning, once per process, when no valid SESSION_ENCRYPTION_KEY is configured (so logins end on every deploy).
 * Contains no secret. Call at startup when Redis is configured.
 * @param {{warn: function}} log
 */
function logKeyStatus(log) {
  if (tokenCrypto.loadKey(process.env) || _keyWarned) return;
  _keyWarned = true;
  (log || console).warn('[session] SESSION_ENCRYPTION_KEY is missing or not a 32-byte base64 key: login tokens are not kept in Redis, so people are signed out on every deploy. Set it to keep sessions across deploys.');
}

async function deleteSession(id) {
  const client = _getClient();
  if (!client) return;
  await client.del(KEY_PREFIX + id);
}

/**
 * srf-s1 -- Read a single session's data by id, for sessionMiddleware's
 * per-request fallback when the in-memory Map has lost it (e.g. a redeploy
 * replaced the process between a login redirect and its callback). Returns
 * null if Redis is not configured or the key doesn't exist -- never throws,
 * matching this adapter's existing best-effort convention.
 * sps-s1: the token is restored when it decrypts (see _restore).
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function readSession(id) {
  const client = _getClient();
  if (!client) return null;
  const raw = await client.get(KEY_PREFIX + id);
  if (!raw) return null;
  return _restore(id, typeof raw === 'string' ? JSON.parse(raw) : raw);
}

async function loadAllSessions() {
  const client = _getClient();
  if (!client) return [];
  const results = [];
  let cursor = '0';
  do {
    const [nextCursor, keys] = await client.scan(cursor, { match: KEY_PREFIX + '*', count: 100 });
    cursor = String(nextCursor);
    for (const key of (keys || [])) {
      try {
        const raw = await client.get(key);
        if (raw) {
          const id = key.slice(KEY_PREFIX.length);
          const data = _restore(id, typeof raw === 'string' ? JSON.parse(raw) : raw);
          results.push({ id, data });
        }
      } catch (_) {}
    }
  } while (cursor !== '0');
  return results;
}

module.exports = {
  writeSession, deleteSession, loadAllSessions, readSession, logKeyStatus,
  SESSION_TTL_SECONDS, KEY_PREFIX, _setClientForTesting, _resetKeyWarningForTesting
};
