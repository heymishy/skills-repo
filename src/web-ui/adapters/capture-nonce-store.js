'use strict';

const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

// capture-nonce-store.js — ppc-s9: short-lived, single-use nonce store so a
// GitHub Actions capture-worker workflow can authenticate as the tenant's own
// PO without the real, opaque req.sessionId ever appearing directly in a
// workflow_dispatch input (visible in GitHub's own Actions UI to any repo
// collaborator). issueNonce() is called server-side when the dispatch is
// made; the dispatched workflow later exchanges the nonce (via the new
// internal endpoint, Task 2) for the real session id exactly once.
//
// D37 (CLAUDE.md, mandatory): a proper injectable adapter --
// setNonceStoreAdapter/getNonceStoreAdapter with a throw-on-unwired default
// stub -- mirroring artefact-commit-writer.js's own
// setArtefactCommitAdapter/getArtefactCommitAdapter shape exactly. Production
// wiring happens in server.js, as its own, separate task from this module and
// the route-handler changes that call it (D37 rule 3).

const NONCE_TTL_SECONDS = 600; // 10 minutes, per the story's own AC2 wording
const KEY_PREFIX = 'capture-nonce:';

function _throwUnwired() {
  throw new Error('Adapter not wired: nonceStoreAdapter. Call setNonceStoreAdapter() with a real implementation before use.');
}

// Default stub exposes the same {set, get, del} contract the real/test
// adapters use, but every method throws -- never silently no-ops -- per
// D37 rule 1 (CLAUDE.md).
let _nonceStoreAdapter = {
  set: _throwUnwired,
  get: _throwUnwired,
  del: _throwUnwired
};

/**
 * Replace the nonce-store adapter (used in tests and production startup).
 * The wired adapter exposes exactly {set, get, del} -- not the full Upstash
 * client surface -- so issueNonce/exchangeNonce below are the only callers
 * that need to know the underlying storage mechanics.
 * @param {{ set: (key: string, value: string, ttlSeconds: number) => Promise<void>, get: (key: string) => Promise<string|null>, del: (key: string) => Promise<void> }} adapter
 */
function setNonceStoreAdapter(adapter) {
  _nonceStoreAdapter = adapter;
}

/**
 * Retrieve the currently wired nonce-store adapter. Callers invoke
 * getNonceStoreAdapter() rather than holding a captured reference, so
 * rewiring (e.g. setNonceStoreAdapter() in a test) always takes effect for
 * the next call -- mirrors artefact-commit-writer.js's
 * getArtefactCommitAdapter() convention.
 * @returns {object}
 */
function getNonceStoreAdapter() {
  return _nonceStoreAdapter;
}

/**
 * Issue a new single-use nonce bound to a session id. Route code calls this
 * when dispatching the GitHub Actions capture-worker workflow -- the nonce
 * (never the raw session id) is what goes into the workflow_dispatch input.
 * @param {string} sessionId - the opaque, already-scoped-as-sensitive session cookie value
 * @returns {Promise<string>} a random 64-hex-character nonce
 */
async function issueNonce(sessionId) {
  const nonce = crypto.randomBytes(32).toString('hex');
  await getNonceStoreAdapter().set(KEY_PREFIX + nonce, sessionId, NONCE_TTL_SECONDS);
  return nonce;
}

/**
 * Exchange a nonce for the session id it was issued for, exactly once. The
 * nonce is deleted immediately after being read, so a replay with the same
 * nonce returns null rather than the real session id -- single-use.
 *
 * This is a plain get-then-delete, NOT a single atomic primitive: Upstash's
 * REST client has no GETDEL equivalent, matching this repo's own existing
 * Redis usage (session-redis.js). The narrow race window this leaves (two
 * concurrent exchanges of the same nonce both reading before either deletes)
 * is accepted as correct for this threat model -- the nonce is single-tenant,
 * single-use-by-design, short-TTL, and never transmitted anywhere an
 * unrelated party could race it in practice. This is a deliberate tradeoff,
 * not an oversight.
 *
 * @param {string} nonce
 * @returns {Promise<string|null>} the bound sessionId, or null if the nonce
 *   never existed, already expired, or was already exchanged once
 */
async function exchangeNonce(nonce) {
  const adapter = getNonceStoreAdapter();
  const key = KEY_PREFIX + nonce;
  const sessionId = await adapter.get(key);
  if (sessionId === null || sessionId === undefined) {
    return null;
  }
  await adapter.del(key);
  return sessionId;
}

/**
 * Real production implementation -- mirrors session-redis.js's own
 * _getClient() lazy-init pattern exactly (Upstash Redis client from
 * UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN env vars), with its own
 * key prefix (capture-nonce:) so it never collides with session-redis.js's
 * own session: keys in the same Redis instance.
 */
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

const realNonceStoreAdapter = {
  /**
   * @param {string} key - already includes the capture-nonce: prefix
   * @param {string} value - the sessionId to bind to this key
   * @param {number} ttlSeconds
   */
  set: async function(key, value, ttlSeconds) {
    const client = _getClient();
    if (!client) throw new Error('realNonceStoreAdapter.set: Redis not configured (UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN missing)');
    await client.set(key, value, { ex: ttlSeconds });
  },
  /**
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  get: async function(key) {
    const client = _getClient();
    if (!client) throw new Error('realNonceStoreAdapter.get: Redis not configured (UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN missing)');
    const raw = await client.get(key);
    return raw === undefined ? null : raw;
  },
  /**
   * @param {string} key
   */
  del: async function(key) {
    const client = _getClient();
    if (!client) throw new Error('realNonceStoreAdapter.del: Redis not configured (UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN missing)');
    await client.del(key);
  }
};

module.exports = {
  setNonceStoreAdapter,
  getNonceStoreAdapter,
  issueNonce,
  exchangeNonce,
  realNonceStoreAdapter,
  NONCE_TTL_SECONDS,
  KEY_PREFIX
};
