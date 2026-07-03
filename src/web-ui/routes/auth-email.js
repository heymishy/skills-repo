'use strict';

// auth-email.js — Email/password authentication handlers (lab-s2.2).
//
// MUST NOT touch routes/auth.js or auth/oauth-adapter.js.
// Password NEVER appears in any log, DB write, or response body.
// accessToken is always crypto.randomBytes(32).toString('hex') — NEVER the password hash.

const crypto  = require('crypto');
const { hashPassword, verifyPassword } = require('../modules/password');
const _session = require('../middleware/session');

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
const _rateLimits = new Map();
const RATE_MAX    = 10;
const RATE_WIN_MS = 5 * 60 * 1000; // 5 minutes

function _getIP(req) {
  return req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
}

/**
 * Enforce per-IP rate limit (sliding window).
 * Returns true if the request is allowed, false (and writes 429) if blocked.
 */
function _checkRateLimit(req, res) {
  const ip     = _getIP(req);
  const now    = Date.now();
  const cutoff = now - RATE_WIN_MS;
  const timestamps = (_rateLimits.get(ip) || []).filter(function(t) { return t > cutoff; });
  timestamps.push(now);
  _rateLimits.set(ip, timestamps);
  if (timestamps.length > RATE_MAX) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Too many attempts' }));
    return false;
  }
  return true;
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
  if (!_checkRateLimit(req, res)) return;

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
  if (!_checkRateLimit(req, res)) return;

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
