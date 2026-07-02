'use strict';

// oauth-adapter.js — GitHub OAuth adapter + multi-provider registry (lab-s1.3 / ADR-012)
// All config read from environment variables (ADR-004).
// No inline GitHub API calls in route handlers.
// Provider registry (setProviderAdapter / providerExchangeCode / providerGetUserIdentity)
// allows future providers (Google, GitLab, etc.) to be plugged in without touching route logic.
// lab-s2.1: Google OAuth support — getGoogleAuthUrl, fetchGoogleUserInfo (injectable, D37).

const crypto = require('crypto');
const { URL, URLSearchParams } = require('url');

const GITHUB_OAUTH_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

const GOOGLE_OAUTH_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL           = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL        = 'https://openidconnect.googleapis.com/v1/userinfo';

/**
 * Generate a cryptographically random CSRF state parameter.
 * @returns {string} hex string (32 chars)
 */
function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Build the GitHub OAuth authorisation redirect URL.
 * Reads GITHUB_CLIENT_ID and GITHUB_CALLBACK_URL from environment.
 * @param {string} state - CSRF state parameter
 * @returns {string} full redirect URL
 */
function buildOAuthRedirectURL(state) {
  const clientId   = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL || process.env.GITHUB_OAUTH_CALLBACK_URL || '';
  const apiBase    = process.env.GITHUB_API_BASE_URL;

  // Support GitHub Enterprise: redirect to GHE OAuth endpoint if base URL set
  const authorizeBase = apiBase
    ? apiBase.replace(/\/api\/v3\/?$/, '').replace(/\/?$/, '') + '/login/oauth/authorize'
    : GITHUB_OAUTH_AUTHORIZE_URL;

  const url = new URL(authorizeBase);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUrl);
  const _allowlist = process.env.TENANT_ORG_ALLOWLIST || '';
  const _orgScope = _allowlist.split(',').filter(function(s) { return s.trim(); }).length > 0
    ? ',read:org'
    : '';
  url.searchParams.set('scope', 'repo,read:user' + _orgScope);
  url.searchParams.set('state', state);
  return url.toString();
}

/**
 * Exchange an authorisation code for an access token via GitHub's token endpoint.
 * Reads GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET from environment.
 * Direct function — uses fetch() internally. Retained for backwards compat and as
 * the implementation underlying gitHubProviderAdapter.exchangeCode.
 * @param {string} code - authorisation code from callback
 * @returns {Promise<string>} access token
 */
async function exchangeCodeForToken(code) {
  const clientId     = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const body = new URLSearchParams({
    client_id:     clientId,
    client_secret: clientSecret,
    code
  }).toString();

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Accept':       'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return data.access_token;
}

/**
 * Fetch the authenticated user's identity from GitHub API.
 * Direct function — uses fetch() internally. Retained for backwards compat and as
 * the implementation underlying gitHubProviderAdapter.getUserIdentity.
 * @param {string} token - OAuth access token
 * @returns {Promise<object>} user identity object
 */
async function getUserIdentity(token) {
  const apiBase = process.env.GITHUB_API_BASE_URL || 'https://api.github.com';
  const response = await fetch(`${apiBase}/user`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept':        'application/json',
      'User-Agent':    'skills-pipeline-web-ui'
    }
  });
  return response.json();
}

/**
 * Store the access token in the server-side session (never in response body/headers).
 * @param {object} req - request object with .session property
 * @param {string} token - OAuth access token
 */
function storeTokenInSession(req, token) {
  req.session.accessToken = token;
}

/**
 * Validate the CSRF state parameter.
 * @param {string} sessionState - state stored in server-side session
 * @param {string} callbackState - state received from OAuth callback
 * @returns {boolean}
 */
function validateOAuthState(sessionState, callbackState) {
  if (!sessionState || !callbackState) return false;
  return sessionState === callbackState;
}

// ── Google OAuth (lab-s2.1) ───────────────────────────────────────────────────

/**
 * Build the Google OAuth authorisation redirect URL.
 * Reads GOOGLE_CLIENT_ID and GOOGLE_CALLBACK_URL from environment.
 * Scopes: openid + email (minimal; no profile data beyond sub and email).
 * @param {string} state - CSRF state parameter
 * @returns {string} full redirect URL
 */
function getGoogleAuthUrl(state) {
  const clientId   = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL;
  const url = new URL(GOOGLE_OAUTH_AUTHORIZE_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'openid email');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  return url.toString();
}

// Injectable Google userinfo fetcher (D37: stub throws; production wiring in server.js).
let _fetchGoogleUserInfo = function() {
  throw new Error('Adapter not wired: googleUserInfo. Call setGoogleUserInfoAdapter() before use.');
};

/**
 * Replace the Google userinfo adapter (used in tests and production startup).
 * @param {Function} impl - async (code: string, redirectUri: string) => { sub: string, email: string }
 */
function setGoogleUserInfoAdapter(impl) {
  _fetchGoogleUserInfo = impl;
}

/**
 * Fetch Google user info by exchanging an auth code.
 * Delegates to the injectable adapter (set via setGoogleUserInfoAdapter).
 * @param {string} code - authorisation code from callback
 * @param {string} redirectUri - must match the redirect_uri used in the auth request
 * @returns {Promise<{ sub: string, email: string, accessToken: string }>}
 */
async function fetchGoogleUserInfo(code, redirectUri) {
  return _fetchGoogleUserInfo(code, redirectUri);
}

/**
 * Real Google userinfo implementation — exchanges code for token then fetches userinfo.
 * Reads GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from environment.
 * @param {string} code
 * @param {string} redirectUri
 * @returns {Promise<{ sub: string, email: string, accessToken: string }>}
 */
async function _realFetchGoogleUserInfo(code, redirectUri) {
  const tokenBody = new URLSearchParams({
    code,
    client_id:     process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri:  redirectUri,
    grant_type:    'authorization_code'
  }).toString();

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept':       'application/json'
    },
    body: tokenBody
  });

  const tokenData = await tokenResponse.json();
  if (tokenData.error) {
    throw new Error(tokenData.error_description || tokenData.error);
  }

  const accessToken = tokenData.access_token;

  const userinfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept':        'application/json'
    }
  });

  const userinfo = await userinfoResponse.json();
  return { sub: userinfo.sub, email: userinfo.email, accessToken };
}

// ── Provider registry (lab-s1.3 / D37) ───────────────────────────────────────
//
// The provider adapter is injectable so tests can swap in a mock without touching
// global.fetch. The DEFAULT stub throws — misconfiguration surfaces immediately
// rather than silently returning null/undefined.
//
// Production wiring is done in server.js (D37 rule 3: separate task).
// routes/auth.js also wires the real GitHub adapter at module load so that any
// code requiring the route module directly (e.g. unit tests) works without
// server.js in the call stack.
//
// Pattern:
//   let _providerAdapter = <throwing stub>
//   function setProviderAdapter(impl) { _providerAdapter = impl; }
//   function providerExchangeCode(code) { return _providerAdapter.exchangeCode(code); }
//   function providerGetUserIdentity(token) { return _providerAdapter.getUserIdentity(token); }

let _providerAdapter = {
  exchangeCode: function() {
    throw new Error('Adapter not wired: providerAdapter. Call setProviderAdapter() before use.');
  },
  getUserIdentity: function() {
    throw new Error('Adapter not wired: providerAdapter. Call setProviderAdapter() before use.');
  }
};

/**
 * Replace the provider adapter (used in tests and production startup).
 * @param {{ exchangeCode: Function, getUserIdentity: Function }} impl
 */
function setProviderAdapter(impl) {
  _providerAdapter = impl;
}

/**
 * Real GitHub provider adapter — delegates to the standalone fetch()-based functions.
 * Wire this in server.js (and in routes/auth.js at module load for direct-require compat).
 */
const gitHubProviderAdapter = {
  exchangeCode: exchangeCodeForToken,
  getUserIdentity: getUserIdentity
};

/**
 * Exchange an authorisation code for a token via the current provider adapter.
 * Route handlers call this — NOT exchangeCodeForToken directly — so the provider
 * can be swapped without modifying route logic.
 * @param {string} code - authorisation code from OAuth callback
 * @returns {Promise<string>} access token
 */
async function providerExchangeCode(code) {
  return _providerAdapter.exchangeCode(code);
}

/**
 * Fetch the authenticated user's identity via the current provider adapter.
 * Route handlers call this — NOT getUserIdentity directly — so the provider
 * can be swapped without modifying route logic.
 * @param {string} token - OAuth access token
 * @returns {Promise<object>} user identity object
 */
async function providerGetUserIdentity(token) {
  return _providerAdapter.getUserIdentity(token);
}

module.exports = {
  // ── Existing standalone functions (backwards compat — check-wuce1 imports these directly) ──
  generateState,
  buildOAuthRedirectURL,
  exchangeCodeForToken,
  getUserIdentity,
  storeTokenInSession,
  validateOAuthState,
  // ── Provider registry (lab-s1.3) ──
  setProviderAdapter,
  gitHubProviderAdapter,
  providerExchangeCode,
  providerGetUserIdentity,
  // ── Google OAuth (lab-s2.1) ──
  getGoogleAuthUrl,
  fetchGoogleUserInfo,
  setGoogleUserInfoAdapter,
  _realFetchGoogleUserInfo
};
