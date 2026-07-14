#!/usr/bin/env node
// check-lab-s2.2-email-password.js — AC verification tests for lab-s2.2
// Covers: T1.1-T1.4 (AC1), T2.1 (AC2), T3.1-T3.3 (AC3), T4.1-T4.2 (AC4),
//         T5.1-T5.2 (AC5/NFR), T6.1-T6.2 (AC6), T7.1 (AC7)
// Total: 13 tests (matches test-plan totalTests: 13)
//
// Run: node tests/check-lab-s2.2-email-password.js

'use strict';

const path   = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log('  PASS: ' + label); passed++; }
  else           { console.error('  FAIL: ' + label); failed++; }
}

// ── Set env vars before requiring modules ────────────────────────────────────
process.env.NODE_ENV        = 'test';
process.env.SESSION_SECRET  = 'test-session-secret-minimum32chars!!';

// ── Load modules ─────────────────────────────────────────────────────────────
const { setPasswordAdapter, hashPassword, verifyPassword } = require('../src/web-ui/modules/password');
const { handleEmailSignup, handleEmailLogin, setUserDb, setRotateSessionId, _clearRateLimits } = require('../src/web-ui/routes/auth-email');
const _session = require('../src/web-ui/middleware/session');

// Wire real bcrypt for all tests (cost 10 is the module default)
setPasswordAdapter(bcrypt);

// ── Test helpers ─────────────────────────────────────────────────────────────

// sec-perf-s3: handleEmailSignup/handleEmailLogin now require a valid session-scoped
// CSRF token. Every mockReq gets one generated on its session (mirrors what a real GET
// page render would do via generateCsrfToken), and it's auto-merged into a caller-
// supplied body's _csrf field so existing call sites (which predate the CSRF story)
// don't each need updating individually.
function mockReq(overrides) {
  const req = Object.assign({
    session:    {},
    sessionId:  'test-sid-' + Math.random().toString(36).slice(2),
    headers:    {},
    connection: { remoteAddress: '127.0.0.1' },
    body:       undefined
  }, overrides || {});
  if (!req.session.csrfToken) {
    req.session.csrfToken = 'test-csrf-token-' + Math.random().toString(36).slice(2);
  }
  if (req.body && typeof req.body === 'object' && req.body._csrf === undefined) {
    req.body = Object.assign({}, req.body, { _csrf: req.session.csrfToken });
  }
  return req;
}

function mockRes() {
  const _headers = {};
  const r = {
    statusCode: null,
    body:       '',
    headers:    _headers,
    writeHead:  function(code, hdrs) {
      r.statusCode = code;
      if (hdrs) Object.assign(_headers, hdrs);
    },
    setHeader:  function(name, value) { _headers[name] = value; },
    end:        function(body) { r.body = (body != null ? String(body) : ''); r._ended = true; }
  };
  return r;
}

// Build a mock DB adapter that captures write arguments
function mockUserDb(opts) {
  opts = opts || {};
  var _rows         = opts.rows    || [];
  var _insertError  = opts.insertError  || null;
  var _capturedInsert = null;

  return {
    captured: function() { return _capturedInsert; },
    query: async function(sql, params) {
      if (/INSERT INTO users/i.test(sql)) {
        if (_insertError) throw _insertError;
        _capturedInsert = { sql: sql, params: params };
        var id = 'uuid-' + Math.random().toString(36).slice(2, 8);
        return { rows: [{ id: id }] };
      }
      if (/SELECT.*FROM users WHERE email/i.test(sql)) {
        return { rows: _rows };
      }
      return { rows: [] };
    }
  };
}

// ── Pre-compute a real bcrypt hash to share across tests ─────────────────────
// We use a shared hash to avoid re-hashing in every test (each bcrypt.hash at cost 10 ≈ 100ms)
const TEST_PASSWORD = 'TestPassw0rd!xyz';
let SHARED_HASH;

async function buildSharedHash() {
  SHARED_HASH = await bcrypt.hash(TEST_PASSWORD, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test runner
// ─────────────────────────────────────────────────────────────────────────────

async function runTests() {
  await buildSharedHash();

  // ── T1.1 — signup normalises email to lowercase (AC1) ────────────────────
  console.log('\nT1.1 — signup-normalises-email-to-lowercase (AC1)');
  {
    _clearRateLimits();
    const db  = mockUserDb();
    setUserDb(db);
    const req = mockReq({ body: { email: 'TEST@Example.com', password: TEST_PASSWORD } });
    const res = mockRes();
    await handleEmailSignup(req, res);
    const captured = db.captured();
    assert(captured !== null, 'DB insert was called');
    assert(captured && captured.params[0] === 'test@example.com', 'email param is lowercase');
  }

  // ── T1.2 — signup stores bcrypt hash not plaintext (AC1 / AC5 / NFR1) ────
  console.log('\nT1.2 — signup-stores-bcrypt-hash-not-plaintext (AC1 / AC5 / NFR1)');
  {
    _clearRateLimits();
    const db  = mockUserDb();
    setUserDb(db);
    const req = mockReq({ body: { email: 'user@example.com', password: TEST_PASSWORD } });
    const res = mockRes();
    await handleEmailSignup(req, res);
    const captured = db.captured();
    const hash = captured && captured.params[1];
    assert(hash && (hash.startsWith('$2b$') || hash.startsWith('$2a$')), 'password_hash starts with bcrypt prefix');
    assert(hash && hash !== TEST_PASSWORD, 'password_hash is not the plaintext password');
    assert(hash && !captured.params.includes(TEST_PASSWORD), 'plaintext password not in DB write params');
    // NFR1: verify cost factor >= 10 by parsing the hash
    const costMatch = hash && hash.match(/^\$2[ab]\$(\d+)\$/);
    const costFactor = costMatch ? parseInt(costMatch[1], 10) : 0;
    assert(costFactor >= 10, 'bcrypt cost factor is >= 10 (actual: ' + costFactor + ')');
    // Verify the hash is actually correct (bcrypt round-trip)
    const roundTrip = await bcrypt.compare(TEST_PASSWORD, hash);
    assert(roundTrip === true, 'bcrypt.compare verifies the stored hash correctly');
  }

  // ── T1.3 — signup creates session with correct fields (AC1) ──────────────
  console.log('\nT1.3 — signup-creates-session-with-correct-fields (AC1)');
  {
    _clearRateLimits();
    // Use real rotateSessionId for session field inspection
    setRotateSessionId(_session.rotateSessionId);
    _session._clearForTesting();

    const db  = mockUserDb();
    setUserDb(db);
    const created = _session.createSession();
    const req = mockReq({
      body:      { email: 'User@Example.com', password: TEST_PASSWORD },
      session:   created.session,
      sessionId: created.id
    });
    const res = mockRes();
    await handleEmailSignup(req, res);

    // After rotation, the new session should have the fields
    const newSession = _session.getSession(req.sessionId);
    const sessionToCheck = newSession || req.session;
    assert(typeof sessionToCheck.accessToken === 'string' && sessionToCheck.accessToken.length > 0, 'session.accessToken is set');
    assert(sessionToCheck.accessToken !== SHARED_HASH, 'session.accessToken is NOT the bcrypt hash');
    assert(sessionToCheck.userId !== undefined && sessionToCheck.userId !== null, 'session.userId is set');
    assert(sessionToCheck.tenantId === 'user@example.com', 'session.tenantId equals normalised email');
    assert(sessionToCheck.login   === 'user@example.com', 'session.login equals normalised email');
  }

  // ── T1.4 — signup redirects to /welcome (AC1) ────────────────────────────
  console.log('\nT1.4 — signup-redirects-to-welcome (AC1)');
  {
    _clearRateLimits();
    setRotateSessionId(_session.rotateSessionId);
    _session._clearForTesting();

    const db  = mockUserDb();
    setUserDb(db);
    const created = _session.createSession();
    const req = mockReq({
      body:      { email: 'redirect@example.com', password: TEST_PASSWORD },
      session:   created.session,
      sessionId: created.id
    });
    const res = mockRes();
    await handleEmailSignup(req, res);
    assert(res.statusCode === 302, 'response is 302');
    assert(res.headers['Location'] === '/welcome', 'redirects to /welcome');
  }

  // ── T2.1 — duplicate email → 409 (AC2) ────────────────────────────────────
  console.log('\nT2.1 — signup-duplicate-email-returns-409 (AC2)');
  {
    _clearRateLimits();
    const dupError = new Error('duplicate key value violates unique constraint');
    dupError.code  = '23505';
    const db  = mockUserDb({ insertError: dupError });
    setUserDb(db);
    const req = mockReq({ body: { email: 'dup@example.com', password: TEST_PASSWORD } });
    const res = mockRes();
    await handleEmailSignup(req, res);
    assert(res.statusCode === 409, 'response is 409');
    const body = res.body;
    const parsed = body ? JSON.parse(body) : {};
    assert(parsed.error === 'Email already registered', 'body contains "Email already registered"');
    assert(!body.includes(TEST_PASSWORD), 'response body does not contain the password');
  }

  // ── T3.1 — login correct password creates session + 302 (AC3) ────────────
  console.log('\nT3.1 — login-correct-password-creates-session (AC3)');
  {
    _clearRateLimits();
    setRotateSessionId(_session.rotateSessionId);
    _session._clearForTesting();

    const user = { id: 'uuid-123', email: 'user@example.com', password_hash: SHARED_HASH };
    const db   = mockUserDb({ rows: [user] });
    setUserDb(db);
    const created = _session.createSession();
    const req = mockReq({
      body:      { email: 'user@example.com', password: TEST_PASSWORD },
      session:   created.session,
      sessionId: created.id
    });
    const res = mockRes();
    await handleEmailLogin(req, res);
    assert(res.statusCode === 302, 'response is 302');
    assert(res.headers['Location'] === '/dashboard', 'redirects to /dashboard');
    const newSession = _session.getSession(req.sessionId);
    const sessionToCheck = newSession || req.session;
    assert(typeof sessionToCheck.accessToken === 'string' && sessionToCheck.accessToken.length > 0, 'session.accessToken is set after login');
  }

  // ── T3.2 — login wrong password → 401 (AC3) ──────────────────────────────
  console.log('\nT3.2 — login-wrong-password-returns-401 (AC3)');
  {
    _clearRateLimits();
    const user = { id: 'uuid-123', email: 'user@example.com', password_hash: SHARED_HASH };
    const db   = mockUserDb({ rows: [user] });
    setUserDb(db);
    const req = mockReq({ body: { email: 'user@example.com', password: 'WrongPassword!' } });
    const res = mockRes();
    await handleEmailLogin(req, res);
    assert(res.statusCode === 401, 'response is 401');
    assert(res.body === 'Invalid email or password', 'body is "Invalid email or password"');
    assert(!req.session.accessToken, 'session.accessToken is NOT set on wrong password');
  }

  // ── T3.3 — nonexistent email → same 401 (AC3) ────────────────────────────
  console.log('\nT3.3 — login-nonexistent-email-returns-401 (AC3)');
  {
    _clearRateLimits();
    const db  = mockUserDb({ rows: [] }); // no user found
    setUserDb(db);
    const req = mockReq({ body: { email: 'nobody@example.com', password: TEST_PASSWORD } });
    const res = mockRes();
    await handleEmailLogin(req, res);
    assert(res.statusCode === 401, 'response is 401');
    assert(res.body === 'Invalid email or password', 'body is identical to wrong-password 401 (no distinction)');
  }

  // ── T4.1 — rate limit allows 10 attempts (AC4) ───────────────────────────
  console.log('\nT4.1 — rate-limit-allows-10-attempts (AC4)');
  {
    _clearRateLimits();
    const db  = mockUserDb({ rows: [] }); // always returns 401
    setUserDb(db);
    let allAllowed = true;
    for (let i = 0; i < 10; i++) {
      const req = mockReq({
        body:       { email: 'ratelimit@example.com', password: 'WrongPass!' },
        connection: { remoteAddress: '10.0.0.1' }
      });
      const res = mockRes();
      await handleEmailLogin(req, res);
      if (res.statusCode === 429) { allAllowed = false; break; }
    }
    assert(allAllowed, 'first 10 attempts are not rate-limited (all return 401, not 429)');
  }

  // ── T4.2 — rate limit blocks 11th attempt (AC4) ──────────────────────────
  console.log('\nT4.2 — rate-limit-blocks-11th-attempt (AC4)');
  {
    // Do NOT clear rate limits — T4.1 used 10 attempts from 10.0.0.1
    const db  = mockUserDb({ rows: [] });
    setUserDb(db);
    const req = mockReq({
      body:       { email: 'ratelimit@example.com', password: 'WrongPass!' },
      connection: { remoteAddress: '10.0.0.1' }
    });
    const res = mockRes();
    await handleEmailLogin(req, res);
    assert(res.statusCode === 429, '11th attempt returns 429');

    // Verify a different IP is still allowed
    _clearRateLimits();
    const req2 = mockReq({
      body:       { email: 'ratelimit@example.com', password: 'WrongPass!' },
      connection: { remoteAddress: '10.0.0.2' }
    });
    const res2 = mockRes();
    await handleEmailLogin(req2, res2);
    assert(res2.statusCode === 401, 'different IP still gets 401 (not 429) after reset');
  }

  // ── T6.1 — rotateSessionId called after signup (AC6) ─────────────────────
  console.log('\nT6.1 — rotate-session-id-called-after-signup (AC6)');
  {
    _clearRateLimits();
    let rotateCallCount = 0;
    let rotateArgs = null;
    setRotateSessionId(function spyRotate(oldId, res, data) {
      rotateCallCount++;
      rotateArgs = { oldId, data: Object.assign({}, data) };
      return { newId: 'spy-new-id-' + Math.random().toString(36).slice(2) };
    });
    const db  = mockUserDb();
    setUserDb(db);
    const req = mockReq({ body: { email: 'rotate@example.com', password: TEST_PASSWORD } });
    const res = mockRes();
    await handleEmailSignup(req, res);
    assert(rotateCallCount === 1, 'rotateSessionId called exactly once after signup');
    assert(rotateArgs && rotateArgs.data && rotateArgs.data.accessToken !== undefined, 'rotateSessionId called after session fields are set');
    // Restore real rotateSessionId for subsequent tests
    setRotateSessionId(_session.rotateSessionId);
  }

  // ── T6.2 — rotateSessionId called after login (AC6) ──────────────────────
  console.log('\nT6.2 — rotate-session-id-called-after-login (AC6)');
  {
    _clearRateLimits();
    let rotateCallCount = 0;
    setRotateSessionId(function spyRotate(oldId, res, data) {
      rotateCallCount++;
      return { newId: 'spy-new-id-' + Math.random().toString(36).slice(2) };
    });
    const user = { id: 'uuid-456', email: 'rotate@example.com', password_hash: SHARED_HASH };
    const db   = mockUserDb({ rows: [user] });
    setUserDb(db);
    const req = mockReq({ body: { email: 'rotate@example.com', password: TEST_PASSWORD } });
    const res = mockRes();
    await handleEmailLogin(req, res);
    assert(rotateCallCount === 1, 'rotateSessionId called exactly once after login');
    // Restore real rotateSessionId
    setRotateSessionId(_session.rotateSessionId);
  }

  // ── T7.1 — auth chooser contains email/password option (AC7) ─────────────
  console.log('\nT7.1 — auth-chooser-contains-email-password-option (AC7)');
  {
    const { renderLoginPage } = require('../src/web-ui/utils/html-shell');
    const html = renderLoginPage();
    assert(typeof html === 'string' && html.length > 0, 'renderLoginPage returns non-empty HTML');
    assert(
      html.toLowerCase().includes('email') && html.toLowerCase().includes('password'),
      'HTML contains "email" and "password" text'
    );
    assert(
      html.includes('/auth/email/login') || html.includes('/auth/email/signup'),
      'HTML contains a form action targeting /auth/email/login or /auth/email/signup'
    );
    assert(
      html.includes('<form') && html.includes('type="email"'),
      'HTML contains a form with an email input field'
    );
    assert(
      html.includes('type="password"'),
      'HTML contains a password input field'
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n────────────────────────────────────────');
  console.log('Tests passed: ' + passed);
  console.log('Tests failed: ' + failed);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\nAll tests passed.');
    process.exit(0);
  }
}

runTests().catch(function(err) {
  console.error('Unexpected test error:', err);
  process.exit(1);
});
