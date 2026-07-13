'use strict';

// auth.js — OAuth route handlers (ADR-009: separate from read/write routes)
// Auth handler is standalone — no inline GitHub API calls.
// CSRF state parameter is mandatory on every callback (ADR-012).
// lab-s1.3: uses provider registry (providerExchangeCode / providerGetUserIdentity) so
// future providers (Google, etc.) can be swapped in via setProviderAdapter() in server.js.

// Use module reference (not destructuring) so tests can monkeypatch individual exports.
const _oauthAdapter = require('../auth/oauth-adapter');
const { persistSession, rotateSessionId, getSession } = require('../middleware/session');
// lab-s2.3: user-flags module (injectable adapter — D37). Used only in handleAuthCallback.
const _userFlags = require('../modules/user-flags');
// arl-s1: user-roles module (injectable adapter — D37). Loads role after tenantId is set.
const _userRoles = require('../modules/user-roles');

// Wire the real GitHub provider adapter on module load.
// This ensures handleAuthCallback works when auth.js is required without server.js
// (e.g. unit tests that require('./routes/auth') directly).
// server.js also calls setProviderAdapter() explicitly on startup for clarity (AC6).
_oauthAdapter.setProviderAdapter(_oauthAdapter.gitHubProviderAdapter);

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
 * Return the currently-wired org-fetch adapter function itself (tir-s5).
 * Exposes the SAME single, already-wired `setFetchOrgs` adapter to a second
 * route module (bulk-add) -- this is not a second D37 adapter/stub-throw
 * pair, it is a read accessor for the one that already exists here.
 * @returns {Function}
 */
function getFetchOrgs() {
  return _fetchOrgs;
}

// tir-s8: injectable org-MEMBERS-fetch adapter (D37: stub throws; production wiring in
// server.js via setFetchOrgMembers). Distinct from setFetchOrgs/_fetchOrgs above --
// that adapter lists the ORGS a token belongs to (GET /user/orgs), used only for tenant
// resolution against TENANT_ORG_ALLOWLIST. This adapter lists the MEMBERS of one
// specific org (GET /orgs/{org}/members), given an org name -- this is bulk-add's actual
// data source. tir-s5's bulkAddFromGithubOrg incorrectly reused setFetchOrgs/_fetchOrgs
// for this purpose (each returned .login was an ORG's name, not a person's username,
// making bulk-add a functional no-op) -- this adapter fixes that by fetching the right
// data. The two adapters must never be conflated.
let _fetchOrgMembers = function() {
  throw new Error('Adapter not wired: getOrgMembers. Call setFetchOrgMembers() with a real implementation before use.');
};

/**
 * Replace the org-members-fetch adapter (used in tests and production startup).
 * @param {Function} fn - async (orgName: string, accessToken: string, page: number) =>
 *   Array<{login}> | {members: Array<{login}>, nextPage: number|null}
 */
function setFetchOrgMembers(fn) {
  _fetchOrgMembers = fn;
}

/**
 * Fetch one page of members for a specific GitHub org (tir-s8). Unlike getFetchOrgs
 * (an accessor that returns the adapter function), this IS the callable wrapper itself --
 * it always delegates to whichever adapter is currently wired via setFetchOrgMembers, so
 * callers can hold a single reference to this function without re-fetching it per call.
 * ADR-025: orgName must always be the caller's own req.session.tenantId -- callers must
 * never pass through a request-supplied org name.
 * @param {string} orgName
 * @param {string} accessToken
 * @param {number} page
 * @returns {Promise<Array<{login: string}>|{members: Array<{login: string}>, nextPage: number|null}>}
 */
async function getOrgMembers(orgName, accessToken, page) {
  return _fetchOrgMembers(orgName, accessToken, page);
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
  const state = _oauthAdapter.generateState();
  req.session.oauthState = state;
  // Persist OAuth state to Redis immediately so it survives across the external redirect
  persistSession(req.sessionId);
  const redirectUrl = _oauthAdapter.buildOAuthRedirectURL(state);
  res.writeHead(302, { Location: redirectUrl });
  res.end();
}

/**
 * GET /auth/github/callback — receive OAuth code + state from GitHub.
 * Validates CSRF state, exchanges code for token via provider registry, stores token in session.
 * Returns 403 on state mismatch (no token stored, mismatch logged).
 * lab-s1.3: uses providerExchangeCode / providerGetUserIdentity (registry dispatch) so
 * additional providers can be supported by swapping the adapter.
 */
async function handleAuthCallback(req, res) {
  const query         = req.query || {};
  const code          = query.code;
  const callbackState = query.state;
  const sessionState  = req.session && req.session.oauthState;

  if (!_oauthAdapter.validateOAuthState(sessionState, callbackState)) {
    _logger.warn('oauth_state_mismatch', { sessionId: req.sessionId });
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  try {
    // lab-s1.3: call through provider registry (not the direct standalone functions) so
    // the adapter can be swapped in tests and for future non-GitHub providers.
    const token = await _oauthAdapter.providerExchangeCode(code);
    _oauthAdapter.storeTokenInSession(req, token);

    const user = await _oauthAdapter.providerGetUserIdentity(token);
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
    } else {
      // No TENANT_ORG_ALLOWLIST: each GitHub user is their own isolated tenant.
      // Org-based tenantId (when TENANT_ORG_ALLOWLIST is set) is unaffected by this branch.
      req.session.tenantId = user.login;
    }

    // tir-s1: load role via the person/team-scoped lookup (replaces the arl-s1
    // legacy getUserRole(tenantId) tenant-wide lookup — AC3). Falls back to
    // 'user' on error (adapter not wired in test mode).
    try {
      req.session.role = await _userRoles.getRoleForTenant(req.session.tenantId);
    } catch (_) {
      req.session.role = 'user';
    }

    // Audit log: user ID and timestamp only — never the token value
    _logger.info('login', {
      userId:    user.id,
      timestamp: new Date().toISOString()
    });

    // lab-s2.3: first-login detection — check before session rotation so userId is available.
    // getFirstLoginFlag returns true if this is the user's first login.
    // D37: _userFlags adapter must be wired before this runs (done in server.js).
    // arl-s4: admins bypass the /welcome plan-selection gate entirely — they must never
    // be routed to billing regardless of first-login state.
    let isFirstLogin = false;
    if (req.session.role !== 'admin') {
      try {
        isFirstLogin = await _userFlags.getFirstLoginFlag(user.id);
      } catch (_) {
        // Adapter not wired or lookup failed — treat as returning user (safe fallback).
      }
    }

    // sec-perf AC5 / lab-s1.3 AC2: rotate session ID after every successful provider login
    // to prevent session fixation attacks. Must happen after all session fields are set.
    const _rt = req.session.returnTo;
    const returnTo = (_rt && _rt.startsWith('/') && !_rt.startsWith('//')) ? _rt : '/dashboard';
    const { newId } = rotateSessionId(req.sessionId, res, req.session);
    req.sessionId = newId;
    req.session   = getSession(newId);
    req.session.returnTo = undefined;

    if (isFirstLogin) {
      // AC1: mark session as first-login and redirect to /welcome for plan selection.
      req.session.firstLogin = true;
      // Clear the DB flag fire-and-forget so subsequent logins go to /dashboard (AC2).
      _userFlags.clearFirstLoginFlag(user.id).catch(function() {});
      persistSession(req.sessionId);
      res.writeHead(302, { Location: '/welcome' });
      res.end();
    } else {
      persistSession(req.sessionId);
      res.writeHead(302, { Location: returnTo });
      res.end();
    }
  } catch (err) {
    _logger.warn('login_failure', { reason: err.message });
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Authentication failed');
  }
}

/**
 * GET /auth/google — redirect to Google OAuth authorisation page.
 * Stores a random CSRF state parameter in the session.
 * lab-s2.1: mirrors handleAuthGithub but uses Google OAuth URL builder.
 */
async function handleAuthGoogle(req, res) {
  const state = _oauthAdapter.generateState();
  req.session.oauthState = state;
  persistSession(req.sessionId);
  const redirectUrl = _oauthAdapter.getGoogleAuthUrl(state);
  res.writeHead(302, { Location: redirectUrl });
  res.end();
}

/**
 * GET /auth/google/callback — receive OAuth code + state from Google.
 * Validates CSRF state, exchanges code + fetches userinfo via injectable adapter,
 * stores token in session, rotates session ID, and redirects to /dashboard.
 * Returns 403 on state mismatch (no token stored, mismatch logged).
 * lab-s2.1: canonical session fields — accessToken, userId (sub), tenantId (sub), login (email).
 */
async function handleAuthGoogleCallback(req, res) {
  const query         = req.query || {};
  const code          = query.code;
  const callbackState = query.state;
  const sessionState  = req.session && req.session.oauthState;

  if (!_oauthAdapter.validateOAuthState(sessionState, callbackState)) {
    _logger.warn('oauth_state_mismatch', { sessionId: req.sessionId });
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  try {
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;
    const userInfo = await _oauthAdapter.fetchGoogleUserInfo(code, redirectUri);

    // Store Google access token under the canonical field name (CLAUDE.md)
    req.session.accessToken = userInfo.accessToken;
    req.session.userId      = userInfo.sub;
    req.session.tenantId    = userInfo.sub;
    req.session.login       = userInfo.email;

    // tir-s1: load role via the person/team-scoped lookup (AC3). Falls back to
    // 'user' on error.
    try {
      req.session.role = await _userRoles.getRoleForTenant(req.session.tenantId);
    } catch (_) {
      req.session.role = 'user';
    }

    _logger.info('login', {
      provider:  'google',
      userId:    userInfo.sub,
      timestamp: new Date().toISOString()
    });

    // Rotate session ID after every successful provider login (sec-perf / D37)
    const { newId } = rotateSessionId(req.sessionId, res, req.session);
    req.sessionId = newId;
    req.session   = getSession(newId);
    persistSession(req.sessionId);

    res.writeHead(302, { Location: '/dashboard' });
    res.end();
  } catch (err) {
    _logger.warn('login_failure', { provider: 'google', reason: err.message });
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
 * Reads req.session.accessToken (canonical field — CLAUDE.md).
 * NEVER reads req.session.token — sessions using the legacy field are rejected (ARCH-003).
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
  handleAuthGoogle,
  handleAuthGoogleCallback,
  handleLogout,
  authGuard,
  setLogger,
  setFetchOrgs,
  getFetchOrgs,
  setFetchOrgMembers,
  getOrgMembers,
  resolveTenant
};
