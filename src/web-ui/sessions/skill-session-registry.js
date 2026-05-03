'use strict';

// In-memory skill session registry.
// Populated by skill execution routes (wuce.13/wuce.9).
const _sessions = new Map();

function getSession(id) {
  return _sessions.get(id) || null;
}

function setSession(id, data) {
  _sessions.set(id, data);
}

function clearAll() {
  _sessions.clear();
}

module.exports = { getSession, setSession, clearAll };
