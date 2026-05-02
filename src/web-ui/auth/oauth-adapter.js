'use strict';

// oauth-adapter.js — standalone GitHub OAuth adapter (ADR-012)
// All config read from environment variables (ADR-004).
// No inline GitHub API calls in route handlers.

const crypto = require('crypto');
const { URL, URLSearchParams } = require('url');

const GITHUB_OAUTH_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

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
  url.searchParams.set('scope', 'repo,read:user');
  url.searchParams.set('state', state);
  return url.toString();
}

/**
 * Exchange an authorisation code for an access token via GitHub's token endpoint.
 * Reads GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET from environment.
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

module.exports = {
  generateState,
  buildOAuthRedirectURL,
  exchangeCodeForToken,
  getUserIdentity,
  storeTokenInSession,
  validateOAuthState
};
