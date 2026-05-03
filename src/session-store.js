'use strict';
const crypto = require('crypto');

// In-memory store: Map<sessionId, sessionObject>
const _store = new Map();

/**
 * createDurableSession(userId, skillName) → session object
 */
async function createDurableSession(userId, skillName) {
  const sessionId = crypto.randomBytes(24).toString('hex');
  const now       = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const session = {
    sessionId,
    userId,
    skillName,
    createdAt:          now.toISOString(),
    updatedAt:          now.toISOString(),
    expiresAt:          expiresAt.toISOString(),
    questionIndex:      0,
    answers:            [],
    partialArtefact:    null,
    complete:           false,
    copilotHomeDeleted: false
  };
  _store.set(sessionId, session);
  return Object.assign({}, session);
}

/**
 * getDurableSession(sessionId, userId) → session object
 *
 * Throws SessionError with:
 *   code: 'SESSION_NOT_FOUND'  — session doesn't exist
 *   code: 'SESSION_FORBIDDEN'  — userId doesn't match owner
 *   code: 'SESSION_EXPIRED'    — current time is past expiresAt (also deletes session)
 */
async function getDurableSession(sessionId, userId) {
  const session = _store.get(sessionId);
  if (!session) {
    const err = new Error('Session not found');
    err.code = 'SESSION_NOT_FOUND';
    throw err;
  }
  if (session.userId !== userId) {
    const err = new Error('Session belongs to a different user');
    err.code = 'SESSION_FORBIDDEN';
    throw err;
  }
  if (new Date() > new Date(session.expiresAt)) {
    _store.delete(sessionId);
    const err = new Error('Session has expired');
    err.code = 'SESSION_EXPIRED';
    throw err;
  }
  return Object.assign({}, session);
}

/**
 * updateDurableSession(sessionId, patch) → updated session object
 *
 * Immutable fields: userId, createdAt, skillName, sessionId — silently ignored in patch.
 * Updates updatedAt to current time.
 */
async function updateDurableSession(sessionId, patch) {
  const session = _store.get(sessionId);
  if (!session) {
    const err = new Error('Session not found');
    err.code = 'SESSION_NOT_FOUND';
    throw err;
  }
  const IMMUTABLE = new Set(['userId', 'createdAt', 'skillName', 'sessionId']);
  Object.keys(patch).forEach(function(key) {
    if (!IMMUTABLE.has(key)) {
      session[key] = patch[key];
    }
  });
  session.updatedAt = new Date().toISOString();
  _store.set(sessionId, session);
  return Object.assign({}, session);
}

/**
 * listDurableSessions(userId) → session[] (non-expired, non-complete for this user)
 */
async function listDurableSessions(userId) {
  const now     = new Date();
  const results = [];
  _store.forEach(function(session) {
    if (session.userId === userId && !session.complete && new Date(session.expiresAt) > now) {
      results.push(Object.assign({}, session));
    }
  });
  return results;
}

/**
 * purgeExpiredSessions() → number of sessions deleted
 */
async function purgeExpiredSessions() {
  const now     = new Date();
  let   deleted = 0;
  _store.forEach(function(session, id) {
    if (new Date(session.expiresAt) <= now) {
      _store.delete(id);
      deleted++;
    }
  });
  return deleted;
}

// Expose _store for test time-travel manipulation
function _getStore() { return _store; }

module.exports = { createDurableSession, getDurableSession, updateDurableSession, listDurableSessions, purgeExpiredSessions, _getStore };
