'use strict';
/**
 * session-store.js — wsm.1 + p2.1
 * Disk persistence adapter for HTML skill sessions.
 * Sessions are written as JSON to SESSION_STORE_PATH/<sessionId>.json.
 * Multi-tenant writes use SESSION_STORE_PATH/<tenantSlug>/<sessionId>.json (p2.1).
 * accessToken is ALWAYS stripped before writing (NFR-sec-no-accesstoken-disk).
 *
 * Usage (server.js wiring):
 *   const sessionStore = require('./adapters/session-store');
 *   setSessionStore(sessionStore);
 *   sessionStore.loadSessions(_setHtmlSession); // on startup
 */

var fs = require('fs');
var path = require('path');
var { slugifyTenantId } = require('./repo-root');

var DEFAULT_MAX_AGE_DAYS = 7;

/** Resolved SESSION_STORE_PATH — read dynamically so tests can override via env. */
function getStorePath() {
  if (process.env.SESSION_STORE_PATH) {
    return process.env.SESSION_STORE_PATH;
  }
  // Default: <repo-root>/sessions-store
  return path.join(path.resolve(__dirname, '../../..'), 'sessions-store');
}

/**
 * Write session data to disk, stripping accessToken.
 * Non-fatal: catches all fs errors and logs at ERROR level.
 * @param {string} sessionId
 * @param {object} data
 */
function write(sessionId, data) {
  var storePath = getStorePath();
  try {
    fs.mkdirSync(storePath, { recursive: true });
    // Strip accessToken at the serialiser boundary (AC2 / NFR-sec-no-accesstoken-disk)
    var safe = Object.assign({}, data);
    delete safe.accessToken;
    safe.lastUpdated = new Date().toISOString();
    var filePath = path.join(storePath, sessionId + '.json');
    fs.writeFileSync(filePath, JSON.stringify(safe, null, 2), 'utf8');
  } catch (err) {
    console.error(JSON.stringify({
      event: 'session_write_error',
      sessionId: sessionId,
      error: err && err.message ? err.message : String(err)
    }));
  }
}

/**
 * Read a session from disk. Returns null if file absent or invalid.
 * @param {string} sessionId
 * @returns {object|null}
 */
function read(sessionId) {
  var storePath = getStorePath();
  try {
    var content = fs.readFileSync(path.join(storePath, sessionId + '.json'), 'utf8');
    return JSON.parse(content);
  } catch (_) {
    return null;
  }
}

/**
 * List all session IDs persisted on disk.
 * @returns {string[]} session IDs (without .json extension)
 */
function list() {
  var storePath = getStorePath();
  try {
    return fs.readdirSync(storePath)
      .filter(function(f) { return f.endsWith('.json'); })
      .map(function(f) { return f.slice(0, -5); });
  } catch (_) {
    return [];
  }
}

/**
 * Load all persisted sessions into the in-memory store.
 * - Creates SESSION_STORE_PATH if it does not exist (AC8 / T6).
 * - Skips files with invalid JSON and logs WARN.
 * - Deletes sessions where lastUpdated is older than SESSION_MAX_AGE_DAYS.
 * - Calls setFn(sessionId, data) for each valid fresh session.
 *
 * @param {function(string, object): void} setFn - callback to populate in-memory store
 */
function loadSessions(setFn) {
  var storePath = getStorePath();
  var maxAgeDays = parseInt(process.env.SESSION_MAX_AGE_DAYS || String(DEFAULT_MAX_AGE_DAYS), 10);
  var staleThreshold = Date.now() - (maxAgeDays * 86400000);

  // Create directory if it doesn't exist (AC8)
  try {
    fs.mkdirSync(storePath, { recursive: true });
  } catch (_) {}

  var files;
  try {
    files = fs.readdirSync(storePath).filter(function(f) { return f.endsWith('.json'); });
  } catch (_) {
    return;
  }

  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    var filePath = path.join(storePath, f);
    var sessionId = f.slice(0, -5);

    var content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (_) {
      continue;
    }

    var data;
    try {
      data = JSON.parse(content);
    } catch (_) {
      console.warn(JSON.stringify({
        event: 'session_load_invalid_json',
        file: filePath,
        sessionId: sessionId
      }));
      continue;
    }

    // Delete stale sessions (AC5)
    if (data.lastUpdated && new Date(data.lastUpdated).getTime() < staleThreshold) {
      try { fs.unlinkSync(filePath); } catch (_) {}
      console.info(JSON.stringify({ event: 'session_stale_deleted', sessionId: sessionId }));
      continue;
    }

    setFn(sessionId, data);
  }
}

/**
 * Write session data to tenant-namespaced path (p2.1 AC5/AC8).
 * If session.tenantId is present, writes to SESSION_STORE_PATH/<tenantSlug>/<sessionId>.json.
 * Otherwise falls through to flat write.
 * accessToken is stripped before write — invariant unchanged.
 * @param {object} session — must include sessionId; optionally tenantId
 */
function writeSession(session) {
  if (!session || !session.sessionId) return;
  var storePath = getStorePath();
  var tenantId = session.tenantId;
  var dir = tenantId
    ? path.join(storePath, slugifyTenantId(tenantId))
    : storePath;
  try {
    fs.mkdirSync(dir, { recursive: true });
    var safe = Object.assign({}, session);
    delete safe.accessToken;
    safe.lastUpdated = new Date().toISOString();
    var filePath = path.join(dir, session.sessionId + '.json');
    fs.writeFileSync(filePath, JSON.stringify(safe, null, 2), 'utf8');
  } catch (err) {
    console.error(JSON.stringify({
      event: 'session_write_error',
      error: err && err.message ? err.message : String(err)
    }));
  }
}

/**
 * Read session from tenant-namespaced path (p2.1 AC6).
 * If tenantId is present, reads from SESSION_STORE_PATH/<tenantSlug>/<sessionId>.json.
 * Otherwise reads from the flat path.
 * @param {string} sessionId
 * @param {string} [tenantId]
 * @returns {object|null}
 */
function readSession(sessionId, tenantId) {
  var storePath = getStorePath();
  var dir = tenantId
    ? path.join(storePath, slugifyTenantId(tenantId))
    : storePath;
  try {
    var content = fs.readFileSync(path.join(dir, sessionId + '.json'), 'utf8');
    return JSON.parse(content);
  } catch (_) {
    return null;
  }
}

module.exports = { write, read, list, loadSessions, writeSession, readSession };
