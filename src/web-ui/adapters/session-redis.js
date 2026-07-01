'use strict';

const { Redis } = require('@upstash/redis');

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

function _sanitise(data) {
  const safe = Object.assign({}, data);
  delete safe.accessToken;
  return safe;
}

async function writeSession(id, data) {
  const client = _getClient();
  if (!client) return;
  const safe = _sanitise(data);
  await client.set(KEY_PREFIX + id, JSON.stringify(safe), { ex: SESSION_TTL_SECONDS });
}

async function deleteSession(id) {
  const client = _getClient();
  if (!client) return;
  await client.del(KEY_PREFIX + id);
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
          const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
          results.push({ id: key.slice(KEY_PREFIX.length), data });
        }
      } catch (_) {}
    }
  } while (cursor !== '0');
  return results;
}

module.exports = { writeSession, deleteSession, loadAllSessions, SESSION_TTL_SECONDS, KEY_PREFIX };
