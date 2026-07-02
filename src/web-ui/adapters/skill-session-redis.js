'use strict';
/**
 * skill-session-redis.js
 * Redis persistence adapter for skill sessions (turns + session state).
 * Complements the disk adapter (session-store.js) — survives Fly.io deploys
 * where ephemeral disk is wiped but Redis (Upstash) is external and durable.
 *
 * Key prefix: skill_session: (distinct from HTTP sessions using session:)
 * TTL: 7 days (matching SESSION_MAX_AGE_DAYS disk eviction policy)
 *
 * Wire in server.js startup via setSkillSessionRedisAdapter(skillSessionRedis).
 */

const { Redis } = require('@upstash/redis');

const SKILL_SESSION_KEY_PREFIX = 'skill_session:';
const SKILL_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

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

// Fields that are large and always rebuildable via registerHtmlSession — strip from Redis writes
// to keep per-session Redis values small (system prompt alone can be 250KB+).
const COMPACT_STRIP = ['systemPrompt', 'contextFiles', 'precomputedStep1'];

function _sanitise(data) {
  const safe = Object.assign({}, data);
  delete safe.accessToken; // never present on skill sessions, belt-and-suspenders
  COMPACT_STRIP.forEach(function(k) { delete safe[k]; });
  return safe;
}

/**
 * Persist a compact skill session to Redis. Fire-and-forget — caller should not await.
 * Only turns + runtime state are stored; systemPrompt is rebuilt on restore.
 * @param {string} sessionId
 * @param {object} data
 * @returns {Promise<void>}
 */
async function write(sessionId, data) {
  const client = _getClient();
  if (!client) return;
  const safe = _sanitise(data);
  await client.set(
    SKILL_SESSION_KEY_PREFIX + sessionId,
    JSON.stringify(safe),
    { ex: SKILL_SESSION_TTL_SECONDS }
  );
}

/**
 * Read compact session data from Redis. Returns null if absent or parse error.
 * The returned object has turns + state but no systemPrompt — caller must rebuild it.
 * @param {string} sessionId
 * @returns {Promise<object|null>}
 */
async function read(sessionId) {
  const client = _getClient();
  if (!client) return null;
  try {
    const raw = await client.get(SKILL_SESSION_KEY_PREFIX + sessionId);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (_) {
    return null;
  }
}

/**
 * Delete a skill session from Redis. Call when session completes to free space immediately.
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
async function del(sessionId) {
  const client = _getClient();
  if (!client) return;
  await client.del(SKILL_SESSION_KEY_PREFIX + sessionId);
}

module.exports = { write, read, del, COMPACT_STRIP, SKILL_SESSION_KEY_PREFIX, SKILL_SESSION_TTL_SECONDS };
