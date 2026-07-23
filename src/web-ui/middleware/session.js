'use strict';

// session.js — session middleware configuration (ADR-009)
// Session tokens use HttpOnly Secure SameSite=Lax cookies.
// Tokens stored server-side — never in browser-accessible storage.
//
// scsf-s1 (2026-07-23, fix-forward): SameSite=Strict caused the browser to
// withhold the session cookie on cross-site top-level GET redirects back into
// this app -- Stripe's hosted-Checkout redirect and both GitHub/Google OAuth
// callbacks are exactly this shape. Lax still blocks the cookie on cross-site
// subrequests/AJAX/iframes/POSTs (the actual CSRF surface); it only
// additionally allows attachment on cross-site top-level GET navigation. This
// identical defect was found and fixed once before for the OAuth callback
// (commit ab99f366) but that fix never reached master; see decisions.md at
// artefacts/2026-07-23-session-cookie-samesite-fix/decisions.md for the full
// history and rationale.

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
 * SameSite=Lax: cookies are not sent on cross-site subrequests/AJAX/iframes/
 * POSTs (the CSRF-relevant surface), but ARE sent on cross-site top-level GET
 * navigations -- required for Stripe Checkout's and OAuth providers' redirect
 * back into this app to keep the session (scsf-s1, 2026-07-23).
 */
const SESSION_COOKIE_CONFIG = {
  httpOnly: true,
  secure:   true,
  sameSite: 'lax',
  path:     '/'
};

/** Build Set-Cookie header value for a session ID. */
function _buildCookieHeader(sessionId) {
  const parts = [
    `session_id=${sessionId}`,
    'HttpOnly',
    'SameSite=Lax',
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
 *
 * srf-s1: on an in-memory cache miss (e.g. a redeploy replaced the process
 * since this session's cookie was issued), falls back to a Redis read
 * before giving up and creating a brand-new session. This recovers fields
 * like oauthState (the pre-login CSRF value) that were already persisted
 * via persistSession() but never reloaded per-request -- previously only
 * loadSessionsFromRedis() at server startup did that. accessToken is
 * deliberately never restored this way (see _sanitise/_sanitiseForRedis) --
 * an operator-confirmed scope boundary, not an oversight (see decisions.md).
 *
 * @param {object} req
 * @param {object} res
 * @returns {Promise<void>}
 */
async function sessionMiddleware(req, res) {
  const sessionId = _parseSessionId(req.headers && req.headers.cookie);

  if (sessionId && _sessions.has(sessionId)) {
    req.sessionId = sessionId;
    req.session   = _sessions.get(sessionId);
    return;
  }

  if (sessionId) {
    const adapter = _activeRedis();
    if (adapter) {
      let rehydrated = null;
      try { rehydrated = await adapter.readSession(sessionId); } catch (err) {
        console.error('[session] Redis readSession error:', err.message);
      }
      if (rehydrated) {
        _sessions.set(sessionId, rehydrated);
        req.sessionId = sessionId;
        req.session   = rehydrated;
        return;
      }
    }
  }

  const { id, session } = createSession();
  req.sessionId = id;
  req.session   = session;
  if (res.setHeader) {
    res.setHeader('Set-Cookie', _buildCookieHeader(id));
  }
}

/**
 * Rotate the session ID after login to prevent session fixation attacks.
 * Creates a new session with a fresh ID, copies all data from the old session,
 * deletes the old session (in-memory and Redis), and sets a new Set-Cookie header.
 *
 * Must be called after successful token exchange and before persistSession.
 *
 * @param {string} oldId - the pre-login session ID to retire
 * @param {object} res   - HTTP response object (must support setHeader)
 * @param {object} [existingData] - session data override; when provided takes precedence over the
 *   in-memory Map lookup. Allows callers that hold a reference to req.session (which may not yet be
 *   registered under oldId in the Map) to ensure the full session contents are carried forward.
 * @returns {{ newId: string, newSession: object }}
 */
function rotateSessionId(oldId, res, existingData) {
  const oldData = existingData || _sessions.get(oldId) || {};
  const { id: newId, session: newSession } = createSession();
  Object.assign(newSession, oldData);

  // Remove old session from memory and Redis before any new writes
  _sessions.delete(oldId);
  const adapter = _activeRedis();
  if (adapter) {
    adapter.deleteSession(oldId).catch(function(err) {
      console.error('[session] rotateSessionId Redis delete error:', err.message);
    });
  }

  if (res && res.setHeader) {
    res.setHeader('Set-Cookie', _buildCookieHeader(newId));
  }

  return { newId, newSession };
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
  rotateSessionId,
  seedTestSession,
  setRedisAdapter,
  setRedisAdapterForTesting,
  loadSessionsFromRedis,
  persistSession,
  _clearForTesting,
  _sanitiseForRedis  // exported for test inspection (lab-s1.3 NFR1)
};
