'use strict';

// auth-stub.js — staging-only GitHub OAuth auth-stub mechanism (a1-staging-safe-auth-stub).
//
// SECURITY (single most important property of this file): every handler below is a
// complete no-op unless process.env.E2E_STAGING_AUTH_STUB_SECRET is set. That variable
// must be set ONLY as a Fly secret on the wuce-staging app (`flyctl secrets set
// E2E_STAGING_AUTH_STUB_SECRET=<value> --app wuce-staging`) — never committed to
// fly.toml, fly.staging.toml, or any other file in this repo, and never set on the
// production (wuce.fly.dev / fly.toml) Fly app. tests/check-a1-fly-config-isolation.js
// enforces its absence from fly.toml (production) as a repo-level guardrail (AC3).
//
// This mechanism only replaces the external GitHub OAuth round-trip (the part that
// would otherwise require a real third-party GitHub test account) — it does not
// bypass or shortcut session/tenant creation, which follows the same session-field
// shape (userId, login, tenantId, authProvider, role, session rotation) as the real
// GET /auth/github/callback handler in routes/auth.js. See the ADR-018 addendum in
// .github/architecture-guardrails.md for the full rationale.
//
// This is deliberately NOT the same mechanism as tests/e2e/fixtures/auth.js (the
// NODE_ENV=test fixture-layer bypass used by the existing 29 local-harness specs,
// per ADR-018's original decision) — wuce-staging runs in production mode, so no
// NODE_ENV=test guard exists there, and adding one would weaken production auth for
// all traffic on that app. This stub is gated by its own dedicated, staging-only
// secret instead, checked at request time, never at require time (so this module can
// be safely required by server.js and by check scripts regardless of environment).

const crypto = require('crypto');
const { persistSession, rotateSessionId, getSession } = require('../middleware/session');
const _userRoles = require('../modules/user-roles');

// Audit trail (NFR-Audit — "the stub auth mechanism's usage is logged, which test run
// created which staging user"). Deliberately in-memory, not a DB table: this mechanism
// creates no persistent `users` row, mirroring real GitHub OAuth login, which also never
// writes to the `users` table (that table only backs email/password signup — see
// routes/auth-email.js). The audit-read endpoint below lets an E2E test confirm an
// entry was recorded for the identity it just created, in the same server process that
// created it, without needing direct DB/log access to the deployed Fly machine.
const _stubAuditLog = [];

/** True only when the staging-only gate secret is configured on this server. */
function _stubEnabled() {
  return !!process.env.E2E_STAGING_AUTH_STUB_SECRET;
}

/**
 * Constant-time comparison of the request-supplied secret against the configured one.
 * Returns false (never throws) on any length mismatch.
 * @param {string} candidate
 * @returns {boolean}
 */
function _secretMatches(candidate) {
  const expected = process.env.E2E_STAGING_AUTH_STUB_SECRET || '';
  const candidateBuf = Buffer.from(String(candidate || ''));
  const expectedBuf = Buffer.from(expected);
  if (candidateBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(candidateBuf, expectedBuf);
}

/**
 * POST /auth/e2e-stub/github
 *
 * Staging-only stand-in for the real GET /auth/github -> /auth/github/callback
 * round-trip (AC1). Requires E2E_STAGING_AUTH_STUB_SECRET to be set on the server
 * AND the request to carry a matching x-e2e-stub-secret header — a double gate, so
 * a single mistaken env var leak does not, by itself, allow the bypass to fire.
 *
 * On success, establishes a session with the same field shape handleAuthCallback
 * (routes/auth.js) would set for a real GitHub login, for a freshly generated,
 * uniquely `e2e-test-` tagged synthetic identity — not a fixed/shared identity, so
 * concurrent test runs never collide.
 *
 * @param {object} req
 * @param {object} res
 */
async function handleAuthStubGithub(req, res) {
  if (!_stubEnabled()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const suppliedSecret = req.headers && req.headers['x-e2e-stub-secret'];
  if (!_secretMatches(suppliedSecret)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  const suffix = crypto.randomBytes(8).toString('hex');
  const login = 'e2e-test-gh-' + Date.now() + '-' + suffix;
  // Synthetic numeric GitHub user id — never a real GitHub account id.
  const userId = parseInt(suffix.slice(0, 8), 16);

  req.session.userId = userId;
  req.session.login = login;
  req.session.authProvider = 'github-e2e-stub';
  // No TENANT_ORG_ALLOWLIST case (mirrors handleAuthCallback's else-branch): each
  // stub identity is its own isolated tenant, same as an un-allowlisted real
  // GitHub login (ADR-025).
  req.session.tenantId = login;
  // accessToken is a server-generated opaque token, never a real GitHub token
  // (canonical field name — CLAUDE.md).
  req.session.accessToken = crypto.randomBytes(32).toString('hex');

  try {
    req.session.role = await _userRoles.getRoleForTenant(req.session.tenantId, login);
  } catch (_) {
    req.session.role = 'user';
  }

  const createdAt = new Date().toISOString();
  _stubAuditLog.push({ login: login, userId: userId, createdAt: createdAt });

  const { newId } = rotateSessionId(req.sessionId, res, req.session);
  req.sessionId = newId;
  req.session = getSession(newId);
  persistSession(req.sessionId);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ login: login, userId: userId, tenantId: login, createdAt: createdAt }));
}

/**
 * GET /auth/e2e-stub/audit?login=<login>
 *
 * Staging-only, same double-gate as handleAuthStubGithub. Lets an E2E test that just
 * created a stub identity confirm an audit entry was recorded for it (NFR-Audit)
 * without needing direct DB/log access to the deployed Fly machine.
 *
 * @param {object} req
 * @param {object} res
 */
async function handleAuthStubAudit(req, res) {
  if (!_stubEnabled()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const suppliedSecret = req.headers && req.headers['x-e2e-stub-secret'];
  if (!_secretMatches(suppliedSecret)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  const login = (req.query && req.query.login) || null;
  const entry = _stubAuditLog.find(function(e) { return e.login === login; }) || null;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ found: !!entry, entry: entry }));
}

module.exports = {
  handleAuthStubGithub,
  handleAuthStubAudit,
  _stubEnabled,
  _stubAuditLogForTesting: _stubAuditLog
};
