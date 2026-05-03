'use strict';

// dashboard.js — action queue route handler (ADR-012: adapter pattern) +
//                dashboard HTML route handler (wuce.18, ADR-009)
// GET /api/actions — returns personalised action queue for authenticated user.
// GET /dashboard   — renders HTML shell with navigation for authenticated user.
// Server-side repository access validation enforced via getPendingActions adapter.

const { getPendingActions: defaultGetPendingActions } = require('../adapters/action-queue');
const { renderShell, escHtml }                        = require('../utils/html-shell');

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

/**
 * GET /dashboard — render the HTML shell dashboard for authenticated users.
 * Performs its own auth check and redirects to /auth/github when unauthenticated
 * (AC2: 302 → /auth/github). Renders renderShell with user login in header (AC1, AC3).
 * Writes audit log on every authenticated request.
 *
 * @param {object} req
 * @param {object} res
 */
function handleDashboard(req, res) {
  // Auth check — redirect to /auth/github if no session token (AC2)
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }

  const userId = req.session.userId;
  const login  = req.session.login || '';

  // Audit log (per Coding Agent Instructions requirement)
  _logger.info('dashboard_accessed', {
    userId,
    route:     '/dashboard',
    timestamp: new Date().toISOString()
  });

  const bodyContent = `<h1>Dashboard</h1>`;
  const html = renderShell({
    title:       'Dashboard',
    bodyContent,
    user:        { login }
  });

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * GET /actions — render the HTML action queue view for authenticated users.
 * Returns the pending action queue as a complete HTML page via renderShell.
 * GET /api/actions (JSON) remains unchanged — this handler is separate (ADR-009).
 *
 * @param {object} req
 * @param {object} res
 */
async function handleGetActionsHtml(req, res) {
  // Auth check — redirect to /auth/github for HTML consumers (AC5)
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }

  const userId = req.session.userId;
  const login  = req.session.login || '';

  // Audit log (AC NFR audit)
  _logger.info('actions_view_accessed', {
    userId,
    route:     '/actions',
    timestamp: new Date().toISOString()
  });

  const userIdentity = { id: userId, login };
  const token        = req.session.accessToken;

  let result;
  try {
    result = await _getPendingActions(userIdentity, token);
  } catch (err) {
    _logger.warn('action_queue_error', { userId, reason: err.message });
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Actions', bodyContent: '<p>Error loading actions.</p>', user: { login } }));
    return;
  }

  // Support both { items, bannerMessage } shape and flat array
  const items = Array.isArray(result) ? result : (result.items || []);

  let bodyContent;
  if (items.length === 0) {
    bodyContent = '<h1>Actions</h1><p class="no-pending-actions">No pending actions — you\'re up to date</p>';
  } else {
    const listItems = items.map(item => {
      const safeTitle      = escHtml(item.title      || '');
      const safeFeature    = escHtml(item.feature    || '');
      const safeActionType = escHtml(item.actionType || '');
      const safeHref       = escHtml('/artefact/' + (item.artefactPath || ''));
      return [
        '<li class="action-item">',
        `<a href="${safeHref}" class="action-link">View ${safeTitle}</a>`,
        `<span class="action-feature">${safeFeature}</span>`,
        `<span class="action-type">${safeActionType}</span>`,
        '</li>'
      ].join('');
    }).join('\n');
    bodyContent = `<h1>Actions</h1>\n<ul class="action-list">\n${listItems}\n</ul>`;
  }

  const html = renderShell({ title: 'Actions', bodyContent, user: { login } });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

module.exports = {
  handleGetActions,
  handleDashboard,
  handleGetActionsHtml,
  setLogger,
  setGetPendingActions
};
