'use strict';

// version.js — GET /version route handler
// Returns build identity (commit SHA, originating PR number, deploy
// timestamp) as JSON. No authentication required — same trust level as
// /health, and deliberately public so "which build is this?" can be
// confirmed without logging in. See scripts/write-version-file.js and
// src/web-ui/utils/version-info.js for how this data is produced.

const { getVersionInfo } = require('../utils/version-info');

/**
 * Handle GET /version requests.
 * @param {object} req
 * @param {object} res
 */
function versionHandler(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(getVersionInfo()));
}

module.exports = { versionHandler };
