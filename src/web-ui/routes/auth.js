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
  setLogger
};
