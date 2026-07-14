#!/usr/bin/env node
// check-sec-perf-s3-auth-email-csrf.js — AC4 (story sec-perf-s3)
// Story: artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s3.md

'use strict';

const path = require('path');
const bcrypt = require('bcrypt');
const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) { console.log('  PASS: ' + label); passed++; }
  else { console.error('  FAIL: ' + label); failed++; failures.push(label); }
}

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

const { setPasswordAdapter } = require('../src/web-ui/modules/password');
const { handleEmailSignup, handleEmailLogin, setUserDb, _clearRateLimits } = require('../src/web-ui/routes/auth-email');
const publicRoute = require('../src/web-ui/routes/public');

setPasswordAdapter(bcrypt);

function mockReq(overrides) {
  return Object.assign({
    session: {},
    sessionId: 'test-sid-' + Math.random().toString(36).slice(2),
    headers: {},
    connection: { remoteAddress: '127.0.0.1' },
    body: undefined
  }, overrides || {});
}

function mockRes() {
  const _headers = {};
  const r = {
    statusCode: null,
    body: '',
    headers: _headers,
    writeHead: function(code, hdrs) { r.statusCode = code; if (hdrs) Object.assign(_headers, hdrs); },
    setHeader: function(name, value) { _headers[name] = value; },
    end: function(body) { r.body = (body != null ? String(body) : ''); r._ended = true; }
  };
  return r;
}

function mockUserDb(opts) {
  opts = opts || {};
  var _rows = opts.rows || [];
  var _capturedInsert = null;
  return {
    captured: function() { return _capturedInsert; },
    query: async function(sql, params) {
      if (/INSERT INTO users/i.test(sql)) {
        _capturedInsert = { sql: sql, params: params };
        return { rows: [{ id: 'uuid-' + Math.random().toString(36).slice(2, 8) }] };
      }
      if (/SELECT.*FROM users WHERE email/i.test(sql)) {
        return { rows: _rows };
      }
      return { rows: [] };
    }
  };
}

function extractCsrfValues(html) {
  var out = [];
  var re = /name="_csrf" value="([^"]*)"/g;
  var m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

async function runTests() {
  console.log('=== sec-perf-s3 AC4: email signup/login CSRF protection ===');

  // AC4a: signup POST with no _csrf field -> 403, no DB insert
  {
    console.log('\nAC4a — signup with no _csrf field returns 403');
    _clearRateLimits();
    const db = mockUserDb();
    setUserDb(db);
    const req = mockReq({ session: { csrfToken: 'real-session-token' }, body: { email: 'user@example.com', password: 'TestPassw0rd!xyz' } });
    const res = mockRes();
    await handleEmailSignup(req, res);
    assert(res.statusCode === 403, 'expected 403, got ' + res.statusCode);
    assert(res.body === 'Forbidden', 'expected body "Forbidden"');
    assert(db.captured() === null, 'no DB insert must happen without a valid CSRF token');
  }

  // AC4b: login POST with no _csrf field -> 403, no DB lookup side effect asserted via session state
  {
    console.log('\nAC4b — login with no _csrf field returns 403');
    _clearRateLimits();
    const db = mockUserDb({ rows: [{ id: 'u1', email: 'user@example.com', password_hash: await bcrypt.hash('TestPassw0rd!xyz', 10) }] });
    setUserDb(db);
    const req = mockReq({ session: { csrfToken: 'real-session-token' }, body: { email: 'user@example.com', password: 'TestPassw0rd!xyz' } });
    const res = mockRes();
    await handleEmailLogin(req, res);
    assert(res.statusCode === 403, 'expected 403, got ' + res.statusCode);
    assert(res.body === 'Forbidden', 'expected body "Forbidden"');
    assert(req.session.accessToken === undefined, 'session must not be authenticated without a valid CSRF token');
  }

  // AC4c: round trip -- GET / embeds real token in sign-up form, POST /auth/email/signup with it succeeds
  {
    console.log('\nAC4c — round trip: GET / embeds token, POST /auth/email/signup succeeds');
    _clearRateLimits();
    const db = mockUserDb();
    setUserDb(db);

    const session = {};
    const getReq = mockReq({ session: session });
    const getRes = mockRes();
    await publicRoute.handleRoot(getReq, getRes);
    const tokens = extractCsrfValues(getRes.body);
    assert(tokens.length >= 2, 'both sign-in and sign-up forms on the landing page must embed a _csrf field (found ' + tokens.length + ')');
    assert(session.csrfToken && tokens.indexOf(session.csrfToken) !== -1, 'the embedded token(s) must match the value stored on the session');

    const postReq = mockReq({ session: session, body: { email: 'newuser@example.com', password: 'TestPassw0rd!xyz', _csrf: session.csrfToken } });
    const postRes = mockRes();
    await handleEmailSignup(postReq, postRes);
    assert(postRes.statusCode === 302, 'expected 302 redirect on legitimate round-trip signup, got ' + postRes.statusCode);
    assert(postRes.headers['Location'] === '/welcome', 'expected redirect to /welcome');
    assert(db.captured() !== null, 'DB insert must happen on a legitimate round-trip submission');
  }

  // AC4d: round trip -- GET / embeds real token in sign-in form, POST /auth/email/login with it succeeds
  {
    console.log('\nAC4d — round trip: GET / embeds token, POST /auth/email/login succeeds');
    _clearRateLimits();
    const hash = await bcrypt.hash('TestPassw0rd!xyz', 10);
    const db = mockUserDb({ rows: [{ id: 'u1', email: 'existing@example.com', password_hash: hash }] });
    setUserDb(db);

    const session = {};
    const getReq = mockReq({ session: session });
    const getRes = mockRes();
    await publicRoute.handleRoot(getReq, getRes);
    const token = session.csrfToken;
    assert(token, 'a _csrf token must be generated/embedded on the landing page');

    const postReq = mockReq({ session: session, body: { email: 'existing@example.com', password: 'TestPassw0rd!xyz', _csrf: token } });
    const postRes = mockRes();
    await handleEmailLogin(postReq, postRes);
    assert(postRes.statusCode === 302, 'expected 302 redirect on legitimate round-trip login, got ' + postRes.statusCode);
    assert(postRes.headers['Location'] === '/dashboard', 'expected redirect to /dashboard');
  }

  // AC4e (story AC5): two distinct sessions get distinct tokens; cross-session token is rejected
  {
    console.log('\nAC4e — two sessions get distinct tokens; cross-session submission is rejected');
    _clearRateLimits();
    const db = mockUserDb();
    setUserDb(db);

    const sessionA = {};
    const getReqA = mockReq({ session: sessionA });
    await publicRoute.handleRoot(getReqA, mockRes());

    const sessionB = {};
    const getReqB = mockReq({ session: sessionB });
    await publicRoute.handleRoot(getReqB, mockRes());

    assert(sessionA.csrfToken && sessionB.csrfToken, 'both sessions must receive a token');
    assert(sessionA.csrfToken !== sessionB.csrfToken, 'two distinct sessions must receive two distinct tokens');

    // Attacker: session B's cookie, but submits session A's token (e.g. leaked/guessed)
    const crossReq = mockReq({ session: sessionB, body: { email: 'x@example.com', password: 'TestPassw0rd!xyz', _csrf: sessionA.csrfToken } });
    const crossRes = mockRes();
    await handleEmailSignup(crossReq, crossRes);
    assert(crossRes.statusCode === 403, 'a token from a different session must be rejected, got ' + crossRes.statusCode);
  }

  console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===');
  if (failed > 0) {
    console.log('FAILED:', failures.join(', '));
    process.exit(1);
  }
  process.exit(0);
}

runTests();
