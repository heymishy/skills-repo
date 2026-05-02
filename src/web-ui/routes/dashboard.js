'use strict';

// dashboard.js — action queue route handler (ADR-012: adapter pattern)
// GET /api/actions — returns personalised action queue for authenticated user.
// Server-side repository access validation enforced via getPendingActions adapter.

const { getPendingActions: defaultGetPendingActions } = require('../adapters/action-queue');

// Audit logger — replaced via setLogger() in tests and production bootstrap
let _logger = {
  info: (/* event, data */) => {},
  warn: (/* event, data */) => {}
};

// Injectable getPendingActions implementation (replaced in integration tests)
let _getPendingActions = defaultGetPendingActions;

function setLogger(logger) { _logger = logger; }
function setGetPendingActions(fn) { _getPendingActions = fn; }

/**
 * GET /api/actions — return personalised action queue.
 * Requires authentication; returns 401 if no session.
 * @param {object} req
 * @param {object} res
 */
async function handleGetActions(req, res) {
  // API authentication check — return 401 JSON (not redirect) for API consumers
  const isAuthenticated = req.session &&
    req.session.userId !== undefined &&
    req.session.accessToken;
  if (!isAuthenticated) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const userIdentity = {
    id:    req.session.userId,
    login: req.session.login
  };
  const token = req.session.accessToken;

  let result;
  try {
    result = await _getPendingActions(userIdentity, token);
  } catch (err) {
    _logger.warn('action_queue_error', { userId: userIdentity.id, reason: err.message });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to load action queue' }));
    return;
  }

  // Audit log: user ID and item count only — never tokens or artefact content
  _logger.info('action_queue_load', {
    userId:    userIdentity.id,
    itemCount: result.items.length,
    timestamp: new Date().toISOString()
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
}

module.exports = {
  handleGetActions,
  setLogger,
  setGetPendingActions
};
