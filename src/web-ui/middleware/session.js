'use strict';

// session.js — session middleware configuration (ADR-009)
// Session tokens use HttpOnly Secure SameSite=Strict cookies.
// Tokens stored server-side — never in browser-accessible storage.

const crypto = require('crypto');

// In-memory session store — primary runtime read path.
// Redis adapter (optional) provides restart-survival persistence.
const _sessions = new Map();

let _redisAdapter = null;
function setRedisAdapter(adapter) { _redisAdapter = adapter; }

let _redisAdapterForTesting = null;
function setRedisAdapterForTesting(adapter) { _redisAdapterForTesting = adapter; }

function _activeRedis() { return _redisAdapterForTesting || _redisAdapter; }

function _sanitiseForRedis(data) {
  const safe = Object.assign({}, data);
  delete safe.accessToken;
  return safe;
}

/**
 * Load sessions from Redis into the in-memory store.
 * Called once at server startup when UPSTASH_REDIS_REST_URL is set.
 * @returns {Promise<void>}
 */
async function loadSessionsFromRedis() {
  const adapter = _activeRedis();
  if (!adapter) return;
  let sessions;
  try { sessions = await adapter.loadAllSessions(); } catch (err) {
    console.error('[session] Redis load error:', err.message);
    return;
  }
  sessions.forEach(function(entry) {
    if (entry.id && !_sessions.has(entry.id)) {
      _sessions.set(entry.id, entry.data || {});
    }
  });
}

/** Clear in-memory store (test helper). */
function _clearForTesting() {
  _sessions.clear();
}

/**
 * Session cookie security configuration.
 * Exported for inspection in tests (NFR1).
 */
const SESSION_COOKIE_CONFIG = {
  httpOnly: true,
  secure:   true,
  sameSite: 'strict',
  path:     '/'
};

/** Build Set-Cookie header value for a session ID. */
function _buildCookieHeader(sessionId) {
  const parts = [
    `session_id=${sessionId}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/'
  ];
  // Enforce Secure flag in production; allow HTTP in development for local testing
  if (process.env.NODE_ENV !== 'development') {
    parts.push('Secure');
  }
  return parts.join('; ');
}

/**
 * Create a new session and return its ID and data object.
 * @returns {{ id: string, session: object }}
 */
function createSession() {
  const id      = crypto.randomBytes(32).toString('hex');
  const session = {};
  _sessions.set(id, session);
  return { id, session };
}

/**
 * Persist the current session to Redis (called after session fields are populated).
 * No-op when Redis adapter is not configured.
 * @param {string} id — session ID
 */
function persistSession(id) {
  const adapter = _activeRedis();
  if (!adapter) return;
  const data = _sessions.get(id);
  if (!data) return;
  adapter.writeSession(id, _sanitiseForRedis(data)).catch(function(err) {
    console.error('[session] Redis write error:', err.message);
  });
}

/**
 * Retrieve a session by ID.
 * @param {string} id
 * @returns {object|null}
 */
function getSession(id) {
  return _sessions.has(id) ? _sessions.get(id) : null;
}

/**
 * Destroy a session by ID.
 * @param {string} id
 */
function destroySession(id) {
  _sessions.delete(id);
  const adapter = _activeRedis();
  if (adapter) {
    adapter.deleteSession(id).catch(function(err) {
      console.error('[session] Redis delete error:', err.message);
    });
  }
}

/** Parse session ID from Cookie header value. */
function _parseSessionId(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/session_id=([a-f0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Session middleware — attaches req.session and req.sessionId.
 * Sets Set-Cookie header for new sessions.
 * @param {object} req
 * @param {object} res
 */
function sessionMiddleware(req, res) {
  const sessionId = _parseSessionId(req.headers && req.headers.cookie);

  if (sessionId && _sessions.has(sessionId)) {
    req.sessionId = sessionId;
    req.session   = _sessions.get(sessionId);
  } else {
    const { id, session } = createSession();
    req.sessionId = id;
    req.session   = session;
    if (res.setHeader) {
      res.setHeader('Set-Cookie', _buildCookieHeader(id));
    }
  }
}

/**
 * Seed a test session with a known ID and data (NODE_ENV=test only).
 * Used by the E2E test infrastructure so Playwright tests can inject an
 * authenticated session without completing the real GitHub OAuth flow.
 *
 * Security: throws if called outside NODE_ENV=test.
 *
 * @param {string} id   - hex session ID (must match /^[a-f0-9]+$/)
 * @param {object} data - session data (e.g. { accessToken, userId, login })
 */
function seedTestSession(id, data) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('seedTestSession is only available in NODE_ENV=test');
  }
  _sessions.set(id, Object.assign({}, data));
}

module.exports = {
  SESSION_COOKIE_CONFIG,
  sessionMiddleware,
  createSession,
  getSession,
  destroySession,
  seedTestSession,
  setRedisAdapter,
  setRedisAdapterForTesting,
  loadSessionsFromRedis,
  persistSession,
  _clearForTesting
};
