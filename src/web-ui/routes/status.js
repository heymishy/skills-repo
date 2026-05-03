'use strict';

// status.js — route handlers for GET /status and GET /status/export.
// ADR-012: uses getPipelineStatus adapter (pipeline-status.js).
// ADR-003: no new pipeline-state.json fields read or written.
// Security: both routes require authenticated session.
// Audit: status board access logged with userId, featureCount, timestamp.

const { getPipelineStatus, setFetcher } = require('../adapters/pipeline-status');
const statusBoardModule = require('../utils/status-board');
const { deriveBlockerIndicator, deriveFeatureStatusLabel } = statusBoardModule;
const { exportStatusAsMarkdown } = require('../utils/status-export');
const { renderShell } = require('../utils/html-shell');

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
 * GET /status — returns portfolio status board as JSON (or HTML when Accept: text/html).
 * Requires authenticated session.
 * Unauthenticated HTML requests redirect to /auth/github (302).
 * Unauthenticated JSON/other requests return 401.
 * Logs access with userId, route, featureCount, timestamp.
 * @param {object} req
 * @param {object} res
 */
async function handleGetStatus(req, res) {
  const accept = (req.headers && req.headers.accept) || '';
  const wantsHtml = accept.includes('text/html');

  if (!req.session || !req.session.userId) {
    if (wantsHtml) {
      res.writeHead(302, { 'Location': '/auth/github' });
      res.end();
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
    }
    return;
  }

  const token = (req.session && req.session.accessToken) || null;
  const login = (req.session && req.session.login) || '';

  let features = [];
  try {
    const result = await getPipelineStatus('*', token);
    features = Array.isArray(result) ? result : (result ? [result] : []);
  } catch (err) {
    if (err.message === 'Access denied') {
      if (wantsHtml) {
        res.writeHead(302, { 'Location': '/auth/github' });
        res.end();
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
      }
      return;
    }
    features = [];
  }

  _logger.info('status_board_access', {
    userId:       req.session.userId,
    route:        '/status',
    featureCount: features.length,
    timestamp:    new Date().toISOString()
  });

  if (wantsHtml) {
    const boardHtml = statusBoardModule.renderStatusBoard(features);
    const html = renderShell({ title: 'Pipeline Status', bodyContent: boardHtml, user: { login } });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  const featureStatuses = features.map(f => ({
    slug:             f.slug,
    stage:            f.stage,
    lastActivityDate: f.lastActivityDate || f.updatedAt || null,
    blockerLabel:     deriveBlockerIndicator(f),
    statusLabel:      deriveFeatureStatusLabel(f.stories || []),
    stories:          f.stories || []
  }));

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
