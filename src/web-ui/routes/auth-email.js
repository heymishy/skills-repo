'use strict';

// auth-email.js — Email/password authentication handlers (lab-s2.2).
//
// MUST NOT touch routes/auth.js or auth/oauth-adapter.js.
// Password NEVER appears in any log, DB write, or response body.
// accessToken is always crypto.randomBytes(32).toString('hex') — NEVER the password hash.

const crypto  = require('crypto');
const { hashPassword, verifyPassword } = require('../modules/password');
const _session = require('../middleware/session');
// arl-s1: user-roles module (injectable adapter — D37). Loads role after tenantId is set.
const _userRoles = require('../modules/user-roles');
// sec-perf-s3: session-scoped CSRF (Cross-Site Request Forgery) protection.
const csrf = require('../middleware/csrf');

// ── D37: injectable user DB adapter ──────────────────────────────────────────
// Default stub throws — call setUserDb(pgPool) before use.
let _userDb = null;

function setUserDb(impl) { _userDb = impl; }

function _requireUserDb() {
  if (!_userDb) {
    throw new Error('Adapter not wired: userDb. Call setUserDb() before use.');
  }
  return _userDb;
}

// ── D37: injectable rotateSessionId (allows test spying) ─────────────────────
// Default: real implementation from session middleware.
let _rotateSessionId = _session.rotateSessionId;

function setRotateSessionId(fn) { _rotateSessionId = fn; }

// ── In-memory rate limiter: 10 attempts per IP per 5 minutes ─────────────────
// bri-s3.4: raised to an effectively-unlimited ceiling when
// E2E_RATE_LIMIT_BYPASS=true (set only by playwright.config.js's webServer
// env, never by production or by any unit test). Discovered via the AC4 20x
// --repeat-each run of the cross-tenant-isolation E2E spec: every repeat
// signs up 2 fresh tenants from the same Playwright-process IP, so by repeat
// ~5 the cumulative signup calls legitimately tripped this limiter (16/20
// repeats failed with 429 -- a real interaction between a legitimate
// production control and repeated E2E signups, not a false flake). Gated on
// a dedicated flag rather than NODE_ENV=test because
// tests/check-lab-s2.2-email-password.js sets NODE_ENV='test' itself (for
// unrelated module-load reasons) while still asserting the real 10-attempt
// production limit in its T4.1/T4.2 -- gating on NODE_ENV alone would have
// silently defeated that existing coverage. Same "unlimited in a controlled
// test context" precedent as lab-s3.3's credits-guard bypass in server.js.
const _rateLimits = new Map();
const RATE_MAX    = process.env.E2E_RATE_LIMIT_BYPASS === 'true' ? 100000 : 10;
const RATE_WIN_MS = 5 * 60 * 1000; // 5 minutes

// ── serlb-s1: narrow, staging-only, triple-gated rate-limit bypass ───────────
// Fix-forward for PR #563 (story a5-ci-gate-scenario-a-blocking): the newly-wired
// "Scenario A E2E (staging)" CI job signs up a fresh e2e-test--tagged tenant in
// nearly every spec (a1-a4), tripping this real 10-attempt/5-minute per-IP limiter
// on real wuce-staging (which has no NODE_ENV=test guard, unlike the local harness's
// E2E_RATE_LIMIT_BYPASS=true above).
//
// The naive fix -- raising RATE_MAX globally when a staging flag is set -- would
// remove signup/login rate-limiting for ALL traffic to staging, a real abuse-surface
// regression. Instead this reuses a1-staging-safe-auth-stub's own double-gate
// philosophy (src/web-ui/routes/auth-stub.js) and adds a third, narrower gate:
//   1. process.env.E2E_STAGING_AUTH_STUB_SECRET is configured on this server --
//      the SAME staging-only secret a1 already established (never set on the
//      production wuce.fly.dev app; production isolation is covered by the
//      existing tests/check-a1-fly-config-isolation.js guardrail with zero new
//      config-isolation test needed, since no new env var name is introduced).
//   2. The request carries a matching `x-e2e-rate-limit-bypass` header (constant-
//      time compared) -- a bare env var leak alone is not enough, mirroring
//      auth-stub.js's own header-gate reasoning.
//   3. The SPECIFIC signup/login attempt's own email is itself `e2e-test-`-tagged
//      (tests/e2e/fixtures/staging-auth.js's uniqueEmail() convention) -- this is
//      the gate a1's simpler two-gate scheme does not need (its stub creates its
//      own synthetic identity from scratch rather than accepting caller-supplied
//      email input), and is what keeps a REAL user's signup fully rate-limited
//      even if gates 1+2 both happen to be true (defense in depth).
// All three gates are only even evaluated once the normal RATE_MAX threshold is
// already exceeded -- a normal, in-limit request never reads the request body
// early and behaves exactly as before this story.
const BYPASS_SECRET_ENV_VAR = 'E2E_STAGING_AUTH_STUB_SECRET';
const BYPASS_HEADER_NAME    = 'x-e2e-rate-limit-bypass';
const E2E_TEST_EMAIL_PREFIX = 'e2e-test-';

function _stagingBypassSecretConfigured() {
  return !!process.env[BYPASS_SECRET_ENV_VAR];
}

/** Constant-time comparison of the request-supplied header against the configured secret. */
function _stagingBypassHeaderMatches(req) {
  const expected = process.env[BYPASS_SECRET_ENV_VAR] || '';
  const supplied = (req.headers && req.headers[BYPASS_HEADER_NAME]) || '';
  const suppliedBuf = Buffer.from(String(supplied));
  const expectedBuf = Buffer.from(expected);
  if (suppliedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(suppliedBuf, expectedBuf);
}

function _isE2eTaggedEmail(email) {
  return typeof email === 'string' && email.toLowerCase().indexOf(E2E_TEST_EMAIL_PREFIX) === 0;
}

function _getIP(req) {
  return req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
}

/**
 * Enforce per-IP rate limit (sliding window), honouring the narrow serlb-s1
 * staging-only bypass carve-out documented above.
 * Returns true if the request is allowed, false (and writes 429) if blocked.
 * When the bypass is granted, req.body is populated with the already-read parsed
 * body so the caller's subsequent _readBody(req)/csrfGuard(req) calls reuse it
 * instead of re-reading the already-consumed request stream.
 */
async function _checkRateLimit(req, res) {
  const ip     = _getIP(req);
  const now    = Date.now();
  const cutoff = now - RATE_WIN_MS;
  const timestamps = (_rateLimits.get(ip) || []).filter(function(t) { return t > cutoff; });
  timestamps.push(now);
  _rateLimits.set(ip, timestamps);

  if (timestamps.length <= RATE_MAX) return true;

  // Over the normal limit -- only now check the narrow staging E2E bypass.
  if (_stagingBypassSecretConfigured() && _stagingBypassHeaderMatches(req)) {
    const body  = await _readBody(req);
    req.body    = body;
    const email = (body && body.email ? String(body.email).toLowerCase().trim() : '');
    if (_isE2eTaggedEmail(email)) {
      return true;
    }
  }

  res.writeHead(429, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Too many attempts' }));
  return false;
}

/**
 * Reset in-memory rate-limit state (test isolation only).
 * Not exported under a public name — tests access via module internals.
 */
function _clearRateLimits() { _rateLimits.clear(); }

/** Read and parse the request body — supports JSON and form-urlencoded. */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() {
      var ct = (req.headers && req.headers['content-type']) || '';
      if (ct.includes('application/json')) {
        try { resolve(JSON.parse(raw)); } catch (_) { resolve(null); }
      } else {
        // Parse application/x-www-form-urlencoded
        var params = new URLSearchParams(raw);
        var obj = {};
        params.forEach(function(v, k) { obj[k] = v; });
        resolve(obj);
      }
    });
  });
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * POST /auth/email/signup
 * Normalises email to lowercase, bcrypt-hashes password (cost >= 10),
 * stores user in the users table, creates authenticated session,
 * rotates session ID, and redirects 302 to /welcome.
 *
 * 400 — missing email or password
 * 409 — email already registered (duplicate constraint from DB)
 */
async function handleEmailSignup(req, res) {
  if (!(await _checkRateLimit(req, res))) return;

  // sec-perf-s3 AC4: reject a POST that does not carry a valid session-scoped CSRF token.
  const csrfOk = await csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  const body     = await _readBody(req);
  const email    = (body && body.email ? String(body.email).toLowerCase().trim() : '');
  const password = (body && body.password ? String(body.password) : '');

  if (!email || !password) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Email and password are required' }));
    return;
  }

  const db = _requireUserDb();
  let newUser;
  try {
    const hash = await hashPassword(password);
    // SECURITY: only `hash` (not `password`) is written to the DB.
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hash]
    );
    newUser = result.rows[0];
  } catch (err) {
    // PostgreSQL unique-constraint violation: error code 23505
    if (err.code === '23505' || (err.message && err.message.toLowerCase().includes('duplicate'))) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Email already registered' }));
      return;
    }
    throw err;
  }

  // Populate session fields BEFORE rotating the session ID.
  // accessToken is a server-generated opaque token — NEVER the password hash.
  req.session.accessToken = crypto.randomBytes(32).toString('hex');
  req.session.userId      = newUser.id;
  req.session.tenantId    = email;
  req.session.login       = email;
  // lab-s2.3: a fresh signup is a first-time user — flag the session so the /welcome
  // redirect below renders the plan-selection page instead of bouncing to /dashboard.
  // Set BEFORE session rotation so it is carried into the rotated (persisted) session.
  req.session.firstLogin  = true;

  // tir-s1: load role via the person/team-scoped lookup (AC3). Falls back to
  // 'user' on error.
  try {
    req.session.role = await _userRoles.getRoleForTenant(email);
  } catch (_) {
    req.session.role = 'user';
  }

  // Rotate session ID to prevent session fixation (AC6).
  const { newId } = _rotateSessionId(req.sessionId, res, req.session);
  req.sessionId = newId;
  // getSession may return null if rotateSessionId was replaced by a test spy that
  // does not create a real session — fall back to the existing req.session.
  const rotatedSession = _session.getSession(newId);
  if (rotatedSession !== null && rotatedSession !== undefined) req.session = rotatedSession;

  res.writeHead(302, { Location: '/welcome' });
  res.end();
}

/**
 * POST /auth/email/login
 * Finds user by email, verifies bcrypt hash, creates authenticated session,
 * rotates session ID, and redirects 302 to /dashboard.
 *
 * 401 "Invalid email or password" — wrong password OR non-existent email
 *   (same message; no distinction to prevent user enumeration).
 */
async function handleEmailLogin(req, res) {
  if (!(await _checkRateLimit(req, res))) return;

  // sec-perf-s3 AC4: reject a POST that does not carry a valid session-scoped CSRF token.
  const csrfOk = await csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  const body     = await _readBody(req);
  const email    = (body && body.email ? String(body.email).toLowerCase().trim() : '');
  const password = (body && body.password ? String(body.password) : '');

  const db     = _requireUserDb();
  const result = await db.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email]
  );
  const user = result.rows[0] || null;

  if (!user) {
    res.writeHead(401, { 'Content-Type': 'text/plain' });
    res.end('Invalid email or password');
    return;
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    res.writeHead(401, { 'Content-Type': 'text/plain' });
    res.end('Invalid email or password');
    return;
  }

  // Populate session fields BEFORE rotating the session ID.
  req.session.accessToken = crypto.randomBytes(32).toString('hex');
  req.session.userId      = user.id;
  req.session.tenantId    = email;
  req.session.login       = email;

  // tir-s1: load role via the person/team-scoped lookup (AC3). Falls back to
  // 'user' on error.
  try {
    req.session.role = await _userRoles.getRoleForTenant(email);
  } catch (_) {
    req.session.role = 'user';
  }

  // Rotate session ID to prevent session fixation (AC6).
  const { newId } = _rotateSessionId(req.sessionId, res, req.session);
  req.sessionId = newId;
  const rotatedSession = _session.getSession(newId);
  if (rotatedSession !== null && rotatedSession !== undefined) req.session = rotatedSession;

  res.writeHead(302, { Location: '/dashboard' });
  res.end();
}

module.exports = {
  handleEmailSignup,
  handleEmailLogin,
  setUserDb,
  setRotateSessionId,
  _clearRateLimits
};
