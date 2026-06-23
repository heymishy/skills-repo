'use strict';

// auth.js — OAuth route handlers (ADR-009: separate from read/write routes)
// Auth handler is standalone — no inline GitHub API calls.
// CSRF state parameter is mandatory on every callback (ADR-012).

const {
  generateState,
  buildOAuthRedirectURL,
  exchangeCodeForToken,
  getUserIdentity,
  storeTokenInSession,
  validateOAuthState
} = require('../auth/oauth-adapter');

// Audit logger — replaced via setLogger() in tests and in production bootstrap
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

// Injectable org-fetch adapter (D37: stub throws; production wiring in server.js via setFetchOrgs)
let _fetchOrgs = function() {
  throw new Error('Adapter not wired: fetchOrgs. Call setFetchOrgs() with a real implementation before use.');
};

/**
 * Replace the org-fetch adapter (used in tests and production startup).
 * @param {Function} fn - async (accessToken: string, page: number) => Array<{login}> | {orgs: Array<{login}>, nextPage: number|null}
 */
function setFetchOrgs(fn) {
  _fetchOrgs = fn;
}

/**
 * Resolve the tenantId by matching the user's GitHub org memberships against TENANT_ORG_ALLOWLIST.
 * Returns the first allowlist match (allowlist order wins over API response order — AC5).
 * Fetches all pages before matching (AC3).
 * Returns undefined immediately if allowlist is empty/absent (AC6 backward-compatible).
 * @param {string} accessToken
 * @param {string} allowlist - raw TENANT_ORG_ALLOWLIST value (may be empty string)
 * @returns {Promise<string|undefined>}
 */
async function resolveTenant(accessToken, allowlist) {
  const allowedOrgs = allowlist.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  if (!allowedOrgs.length) return undefined;

  const startTime = Date.now();
  let allOrgs = [];
  let page = 1;

  while (true) {
    const result = await _fetchOrgs(accessToken, page);
    const orgs    = Array.isArray(result) ? result      : result.orgs;
    const nextPage = Array.isArray(result) ? null        : result.nextPage;
    allOrgs = allOrgs.concat(orgs || []);
    if (!nextPage) break;
    page = nextPage;
  }

  const elapsed = Date.now() - startTime;
  if (elapsed > 3000) {
    _logger.warn('org_fetch_slow', { elapsed });
  }

  // Match by allowlist order, not by orgs response order (AC5)
  const orgLoginSet = new Set(allOrgs.map(function(o) { return o.login; }));
  return allowedOrgs.find(function(org) { return orgLoginSet.has(org); });
}

/**
 * GET /auth/github — redirect to GitHub OAuth authorisation page.
 * Stores a random CSRF state parameter in the session.
 */
async function handleAuthGithub(req, res) {
  const state = generateState();
  req.session.oauthState = state;
  const redirectUrl = buildOAuthRedirectURL(state);
  res.writeHead(302, { Location: redirectUrl });
  res.end();
}

/**
 * GET /auth/github/callback — receive OAuth code + state from GitHub.
 * Validates CSRF state, exchanges code for token, stores token in session.
 * Returns 403 on state mismatch (no token stored, mismatch logged).
 */
async function handleAuthCallback(req, res) {
  const query         = req.query || {};
  const code          = query.code;
  const callbackState = query.state;
  const sessionState  = req.session && req.session.oauthState;

  if (!validateOAuthState(sessionState, callbackState)) {
    _logger.warn('oauth_state_mismatch', { sessionId: req.sessionId });
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  try {
    const token = await exchangeCodeForToken(code);
    storeTokenInSession(req, token);

    const user = await getUserIdentity(token);
    req.session.userId = user.id;
    req.session.login  = user.login;

    // Tenant resolution (AC2–AC6) — only when TENANT_ORG_ALLOWLIST is configured
    const _allowlist = process.env.TENANT_ORG_ALLOWLIST || '';
    if (_allowlist.trim()) {
      const tenantId = await resolveTenant(token, _allowlist);
      if (!tenantId) {
        // Zero-match rejection (AC4): message must NOT expose TENANT_ORG_ALLOWLIST contents (NFR-sec-allowlist-disclosure)
        _logger.warn('tenant_mismatch', { userId: user.id, timestamp: new Date().toISOString() });
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('You are not a member of an authorised organisation.');
        return;
      }
      req.session.tenantId = tenantId;
    }
    // When TENANT_ORG_ALLOWLIST is absent, session.tenantId is not set (AC6 backward-compatible)

    // Audit log: user ID and timestamp only — never the token value
    _logger.info('login', {
      userId:    user.id,
      timestamp: new Date().toISOString()
    });

    res.writeHead(302, { Location: '/dashboard' });
    res.end();
  } catch (err) {
    _logger.warn('login_failure', { reason: err.message });
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Authentication failed');
  }
}

/**
 * GET /auth/logout — clear session and redirect to sign-in.
 */
async function handleLogout(req, res) {
  if (req.session) {
    const userId = req.session.userId;
    req.session.accessToken = undefined;
    req.session.userId      = undefined;
    _logger.info('logout', { userId, timestamp: new Date().toISOString() });
  }
  res.writeHead(302, { Location: '/' });
  res.end();
}

/**
 * Auth guard middleware — protects routes requiring an authenticated session.
 * Redirects to / without exposing session data when token is absent.
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
function authGuard(req, res, next) {
  const hasToken = req.session && req.session.accessToken;
  if (!hasToken) {
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }
  next();
}

module.exports = {
  handleAuthGithub,
  handleAuthCallback,
  handleLogout,
  authGuard,
  setLogger,
  setFetchOrgs,
  resolveTenant
};
