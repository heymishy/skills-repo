'use strict';
const crypto = require('crypto');

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const _store = new Map();
const IMMUTABLE_FIELDS = ['sessionId', 'userId', 'createdAt', 'skillName'];

// Clock injection for testing (allows time travel in T6, NFR3 tests)
let _clock = function() { return new Date(); };
function _setClock(fn) { _clock = fn; }

async function createDurableSession(userId, skillName) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const now       = _clock();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const session = {
    sessionId, userId, skillName,
    createdAt:       now.toISOString(),
    updatedAt:       now.toISOString(),
    expiresAt:       expiresAt.toISOString(),
    questionIndex:   0,
    answers:         [],
    partialArtefact: null,
    complete:        false,
    copilotHomeDeleted: false
  };
  _store.set(sessionId, JSON.parse(JSON.stringify(session)));
  return JSON.parse(JSON.stringify(session));
}

async function getDurableSession(sessionId, userId) {
  const session = _store.get(sessionId);
  if (!session) {
    const err = new Error('Session not found: ' + sessionId);
    err.code = 'SESSION_NOT_FOUND';
    throw err;
  }
  if (session.userId !== userId) {
    const err = new Error('Access forbidden: session belongs to a different user');
    err.code = 'SESSION_FORBIDDEN';
    throw err;
  }
  if (_clock() > new Date(session.expiresAt)) {
    _store.delete(sessionId);
    const err = new Error('Session expired — please start a new session');
    err.code = 'SESSION_EXPIRED';
    throw err;
  }
  return JSON.parse(JSON.stringify(session));
}

async function updateDurableSession(sessionId, updates) {
  const session = _store.get(sessionId);
  if (!session) {
    const err = new Error('Session not found: ' + sessionId);
    err.code = 'SESSION_NOT_FOUND';
    throw err;
  }
  for (const [key, value] of Object.entries(updates)) {
    if (IMMUTABLE_FIELDS.includes(key)) { continue; }
    session[key] = value;
  }
  session.updatedAt = _clock().toISOString();
  _store.set(sessionId, session);
  return JSON.parse(JSON.stringify(session));
}

async function listDurableSessions(userId) {
  const now = _clock();
  const results = [];
  for (const session of _store.values()) {
    if (session.userId !== userId) { continue; }
    if (session.complete) { continue; }
    if (new Date(session.expiresAt) <= now) { continue; }
    results.push(JSON.parse(JSON.stringify(session)));
  }
  return results;
}

async function deleteDurableSession(sessionId) {
  _store.delete(sessionId);
}

function _resetStore() { _store.clear(); }

module.exports = {
  createDurableSession,
  getDurableSession,
  updateDurableSession,
  listDurableSessions,
  deleteDurableSession,
  _resetStore,
  _setClock
};
