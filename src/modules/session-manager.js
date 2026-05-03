'use strict';
const crypto = require('crypto');
const { randomUUID } = require('crypto');
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { isWithinBase } = require('../utils/path-validator');

const DEFAULT_SESSION_BASE = path.join(os.tmpdir(), 'copilot-sessions');
const MAX_AGE_HOURS = 24;

function getSessionBase() {
  return process.env.WUCE_SESSION_BASE_DIR || DEFAULT_SESSION_BASE;
}

let _logger = {
  info:  function(msg, data) { process.stdout.write('[session-manager] ' + msg + (data ? ' ' + JSON.stringify(data) : '') + '\n'); },
  warn:  function(msg) { process.stderr.write('[session-manager] WARN ' + msg + '\n'); },
  error: function(msg) { process.stderr.write('[session-manager] ERROR ' + msg + '\n'); }
};

function setLogger(logger) { _logger = logger; }

/**
 * createSession(userId) -> string (absolute path)
 *
 * Creates a per-user session directory at:
 *   <WUCE_SESSION_BASE_DIR>/<sha256(userId)>/<uuid>/
 *
 * Returns the absolute path for use as COPILOT_HOME.
 */
function createSession(userId) {
  var sessionBase = getSessionBase();
  var userHash = crypto.createHash('sha256').update(userId).digest('hex');
  var sessionId = randomUUID();
  var sessionPath = path.join(sessionBase, userHash, sessionId);
  fs.mkdirSync(sessionPath, { recursive: true });
  _logger.info('session_created', { userHash: userHash, sessionId: sessionId });
  return sessionPath;
}

/**
 * cleanupSession(sessionPath)
 *
 * Deletes the session directory.
 * CRITICAL: validates path is within configured session base before deletion.
 * Throws Error if path is outside the base (path traversal protection).
 */
function cleanupSession(sessionPath) {
  var sessionBase = getSessionBase();
  if (!isWithinBase(sessionPath, sessionBase)) {
    throw new Error('Invalid session path: path is outside session base directory');
  }
  fs.rmSync(sessionPath, { recursive: true, force: true });
}

/**
 * cleanupOrphanedSessions(baseDir, maxAgeMs)
 *
 * Deletes all session dirs under baseDir whose mtime is older than maxAgeMs.
 * Default maxAge: 24 hours. Safe to call at server startup.
 * Does NOT throw if baseDir doesn't exist.
 */
function cleanupOrphanedSessions(baseDir, maxAgeMs) {
  if (maxAgeMs === undefined) { maxAgeMs = MAX_AGE_HOURS * 60 * 60 * 1000; }
  if (!fs.existsSync(baseDir)) { return; }
  var now = Date.now();
  var userDirs;
  try { userDirs = fs.readdirSync(baseDir); } catch (e) { return; }
  for (var i = 0; i < userDirs.length; i++) {
    var userDirPath = path.join(baseDir, userDirs[i]);
    var sessionDirs;
    try { sessionDirs = fs.readdirSync(userDirPath); } catch (e) { continue; }
    for (var j = 0; j < sessionDirs.length; j++) {
      var sessPath = path.join(userDirPath, sessionDirs[j]);
      var stat;
      try { stat = fs.statSync(sessPath); } catch (e) { continue; }
      var age = now - stat.mtimeMs;
      if (age >= maxAgeMs) {
        try {
          fs.rmSync(sessPath, { recursive: true, force: true });
          _logger.info('orphan_session_cleaned', { path: sessPath });
        } catch (e) {
          _logger.warn('failed to clean orphan session: ' + sessPath + ' — ' + e.message);
        }
      }
    }
  }
}

module.exports = { createSession, cleanupSession, cleanupOrphanedSessions, setLogger };
