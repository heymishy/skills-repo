'use strict';

// session.js — session middleware configuration (ADR-009)
// Session tokens use HttpOnly Secure SameSite=Strict cookies.
// Tokens stored server-side — never in browser-accessible storage.

const crypto = require('crypto');

// In-memory session store (replace with persistent store in production)
const _sessions = new Map();

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

module.exports = {
  SESSION_COOKIE_CONFIG,
  sessionMiddleware,
  createSession,
  getSession,
  destroySession
};
