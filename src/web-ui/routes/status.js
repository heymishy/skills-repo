'use strict';

// status.js — route handlers for GET /status and GET /status/export.
// ADR-012: uses getPipelineStatus adapter (pipeline-status.js).
// ADR-003: no new pipeline-state.json fields read or written.
// Security: both routes require authenticated session.
// Audit: status board access logged with userId, featureCount, timestamp.

const { getPipelineStatus, setFetcher } = require('../adapters/pipeline-status');
const { deriveBlockerIndicator, deriveFeatureStatusLabel } = require('../utils/status-board');
const { exportStatusAsMarkdown } = require('../utils/status-export');

// Audit logger — replaced via setLogger() in tests and production bootstrap
let _logger = {
  info: (/* event, data */) => {},
  warn: (/* event, data */) => {}
};

/**
 * Replace the audit logger (used in tests and production startup).
 * @param {{ info: Function, warn: Function }} logger
 */
function setLogger(logger) {
  _logger = logger;
}

/**
 * GET /status — returns portfolio status board data as JSON array.
 * Requires authenticated session (401 otherwise).
 * Logs access with userId and featureCount.
 * @param {object} req
 * @param {object} res
 */
async function handleGetStatus(req, res) {
  if (!req.session || !req.session.userId) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const token = (req.session && req.session.accessToken) || null;

  let features = [];
  try {
    const result = await getPipelineStatus('*', token);
    features = Array.isArray(result) ? result : (result ? [result] : []);
  } catch (err) {
    if (err.message === 'Access denied') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    features = [];
  }

  const featureStatuses = features.map(f => ({
    slug:             f.slug,
    stage:            f.stage,
    lastActivityDate: f.lastActivityDate || f.updatedAt || null,
    blockerLabel:     deriveBlockerIndicator(f),
    statusLabel:      deriveFeatureStatusLabel(f.stories || []),
    stories:          f.stories || []
  }));

  _logger.info('status_board_access', {
    userId:       req.session.userId,
    featureCount: featureStatuses.length,
    timestamp:    new Date().toISOString()
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(featureStatuses));
}

/**
 * GET /status/export — returns portfolio status as a markdown table.
 * Requires authenticated session (401 otherwise).
 * Content-Type: text/markdown; Content-Disposition: attachment; filename="status.md"
 * @param {object} req
 * @param {object} res
 */
async function handleGetStatusExport(req, res) {
  if (!req.session || !req.session.userId) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const token = (req.session && req.session.accessToken) || null;

  let features = [];
  try {
    const result = await getPipelineStatus('*', token);
    features = Array.isArray(result) ? result : (result ? [result] : []);
  } catch (err) {
    features = [];
  }

  const markdown = exportStatusAsMarkdown(features);

  res.writeHead(200, {
    'Content-Type': 'text/markdown',
    'Content-Disposition': 'attachment; filename="status.md"'
  });
  res.end(markdown);
}

module.exports = { handleGetStatus, handleGetStatusExport, setLogger, setFetcher };
