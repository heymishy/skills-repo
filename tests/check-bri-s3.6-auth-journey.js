#!/usr/bin/env node
// check-bri-s3.6-auth-journey.js — AC verification tests for bri-s3.6 (Auth journey spec)
//
// Regression coverage for the GitHub OAuth first-login bug fixed in commit f845caf7
// ("fix(auth): admin role bypasses billing gate; fix GitHub OAuth first-login bug").
// This repo does NOT use Better Auth — per landing-auth-billing/decisions.md's ARCH-002,
// Path C (roll-your-own OAuth via fetch(), staying CJS) is the actual stack. This file
// targets auth.js (GitHub OAuth), Google OAuth, auth-email.js (email/password), and
// middleware/session.js (session rotation) directly.
//
// AC1: first-time GitHub OAuth login -> redirected to /welcome (plan selection)
// AC2: returning GitHub OAuth login -> redirected to /dashboard
// AC3: session expiry -> covered at E2E level (tests/e2e/bri-s3.6-auth-journey.spec.js)
// AC4: accessToken never appears in HTML response or logs, any provider
// AC5: @mocked run stubs the OAuth provider exchange, zero real endpoint calls
//
// Run: node tests/check-bri-s3.6-auth-journey.js

'use strict';

const path   = require('path');
const bcrypt = require('bcrypt');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) { console.log('  PASS: ' + label); passed++; }
  else           { console.error('  FAIL: ' + label); failed++; failures.push(label); }
}

// ── Set env vars before requiring modules ────────────────────────────────────
process.env.NODE_ENV       = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';

const AUTH_PATH         = path.resolve(ROOT, 'src/web-ui/routes/auth.js');
const AUTH_EMAIL_PATH   = path.resolve(ROOT, 'src/web-ui/routes/auth-email.js');
const OAUTH_ADAPTER_PATH = path.resolve(ROOT, 'src/web-ui/auth/oauth-adapter.js');
const SESSION_PATH      = path.resolve(ROOT, 'src/web-ui/middleware/session.js');
const USER_ROLES_PATH   = path.resolve(ROOT, 'src/web-ui/modules/user-roles.js');
const USER_FLAGS_PATH   = path.resolve(ROOT, 'src/web-ui/modules/user-flags.js');
const PASSWORD_PATH     = path.resolve(ROOT, 'src/web-ui/modules/password.js');

const { setPasswordAdapter } = require(PASSWORD_PATH);
setPasswordAdapter(bcrypt);

// ── Test helpers ─────────────────────────────────────────────────────────────

// sec-perf-s3: handleEmailLogin now requires a valid session-scoped CSRF token.
// Every mockReq gets one generated on its session, auto-merged into a caller-
// supplied body's _csrf field, so existing call sites (which predate the CSRF
// story) don't each need updating individually.
function mockReq(overrides) {
  const req = Object.assign({
    session:    {},
    sessionId:  'test-sid-' + Math.random().toString(36).slice(2),
    query:      {},
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

// Reload a module fresh (clears require cache so monkeypatches from a prior
// test group don't leak into the next).
function freshRequire(modPath) {
  delete require.cache[require.resolve(modPath)];
  return require(modPath);
}

function mockUserDb(opts) {
  opts = opts || {};
  const rows = opts.rows || [];
  return {
    query: async function(sql) {
      if (/SELECT.*FROM users WHERE email/i.test(sql)) return { rows: rows };
      return { rows: [] };
    }
  };
}

// ── Global fetch spy (AC5) — records every call made to global.fetch so we can
// assert the real GitHub/Google OAuth token/userinfo endpoints are never hit
// when the provider adapter is stubbed. ──────────────────────────────────────
let fetchCalls = [];
function installFetchSpy() {
  fetchCalls = [];
  global.fetch = function(url) {
    fetchCalls.push(String(url));
    return Promise.reject(new Error('global.fetch must not be called when the provider adapter is stubbed (AC5)'));
  };
}
function restoreFetchSpy(orig) {
  global.fetch = orig;
}

// ─────────────────────────────────────────────────────────────────────────────
// U1 — rotateSessionId is called exactly once per provider login (AC1/AC2/AC4)
// ─────────────────────────────────────────────────────────────────────────────

async function testU1aGithub() {
  // NOTE: auth.js destructures { persistSession, rotateSessionId, getSession } from
  // middleware/session.js AT REQUIRE TIME (not via property access), so the spy MUST
  // be installed on sessionMod BEFORE auth.js is (re)required — otherwise auth.js's
  // internal binding still points at the real, un-spied implementation.
  const sessionMod = require(SESSION_PATH);

  let rotateCallCount = 0;
  const origRotate = sessionMod.rotateSessionId;
  sessionMod.rotateSessionId = function(oldId, res, existingData) {
    rotateCallCount++;
    return { newId: 'rotated-sid', newSession: Object.assign({}, existingData) };
  };
  const origGetSession = sessionMod.getSession;
  sessionMod.getSession = function() { return { accessToken: 'gho_stub_token', userId: 555, login: 'octocat' }; };
  const origPersist = sessionMod.persistSession;
  sessionMod.persistSession = function() {};

  const oauthAdapter = freshRequire(OAUTH_ADAPTER_PATH);
  const userRoles = freshRequire(USER_ROLES_PATH);
  const userFlags = freshRequire(USER_FLAGS_PATH);
  const auth = freshRequire(AUTH_PATH); // must be required AFTER the sessionMod spy is installed

  userRoles.setGetUserRole(async function() { return 'user'; });
  userFlags.setUserFlagsAdapter({
    getFirstLoginFlag:   async function() { return false; }, // returning user — simplest path for this assertion
    clearFirstLoginFlag: async function() {}
  });
  auth.setFetchOrgs(async function() { return []; });

  oauthAdapter.validateOAuthState     = function() { return true; };
  oauthAdapter.providerExchangeCode   = async function() { return 'gho_stub_token'; };
  oauthAdapter.providerGetUserIdentity = async function() { return { id: 555, login: 'octocat' }; };
  oauthAdapter.storeTokenInSession    = function(req, token) { req.session.accessToken = token; };

  const req = mockReq({ session: { oauthState: 'state-u1a' }, query: { code: 'c', state: 'state-u1a' } });
  const res = mockRes();

  try {
    await auth.handleAuthCallback(req, res);
    await new Promise(function(r) { setTimeout(r, 5); });
    assert(rotateCallCount === 1, 'U1a: rotateSessionId called exactly once for GitHub login');
  } finally {
    sessionMod.rotateSessionId = origRotate;
    sessionMod.getSession      = origGetSession;
    sessionMod.persistSession  = origPersist;
  }
}

async function testU1bGoogle() {
  // NOTE: same require-time-destructuring caveat as testU1aGithub — spy must be
  // installed on sessionMod before auth.js is (re)required.
  const sessionMod = require(SESSION_PATH);

  let rotateCallCount = 0;
  const origRotate = sessionMod.rotateSessionId;
  sessionMod.rotateSessionId = function(oldId, res, existingData) {
    rotateCallCount++;
    return { newId: 'rotated-sid-google', newSession: Object.assign({}, existingData) };
  };
  const origGetSession = sessionMod.getSession;
  sessionMod.getSession = function() { return { accessToken: 'ya29.stub', userId: 'google-sub-1' }; };
  const origPersist = sessionMod.persistSession;
  sessionMod.persistSession = function() {};

  const oauthAdapter = freshRequire(OAUTH_ADAPTER_PATH);
  const userRoles = freshRequire(USER_ROLES_PATH);
  const auth = freshRequire(AUTH_PATH); // must be required AFTER the sessionMod spy is installed

  userRoles.setGetUserRole(async function() { return 'user'; });

  oauthAdapter.validateOAuthState = function() { return true; };
  oauthAdapter.setGoogleUserInfoAdapter(async function() {
    return { sub: 'google-sub-1', email: 'user@example.com', accessToken: 'ya29.stub' };
  });

  const req = mockReq({ session: { oauthState: 'state-u1b' }, query: { code: 'c', state: 'state-u1b' } });
  const res = mockRes();

  try {
    await auth.handleAuthGoogleCallback(req, res);
    assert(rotateCallCount === 1, 'U1b: rotateSessionId called exactly once for Google login');
  } finally {
    sessionMod.rotateSessionId = origRotate;
    sessionMod.getSession      = origGetSession;
    sessionMod.persistSession  = origPersist;
  }
}

async function testU1cEmailPassword() {
  const authEmail = freshRequire(AUTH_EMAIL_PATH);
  const userRoles = freshRequire(USER_ROLES_PATH);
  authEmail._clearRateLimits();
  userRoles.setGetUserRole(async function() { return 'user'; });

  const hash = await bcrypt.hash('TestPassw0rd!xyz', 10);
  authEmail.setUserDb(mockUserDb({ rows: [{ id: 1, email: 'u1c@example.com', password_hash: hash }] }));

  let rotateCallCount = 0;
  authEmail.setRotateSessionId(function(oldId, res, existingData) {
    rotateCallCount++;
    return { newId: 'rotated-sid-email' };
  });

  const req = mockReq({ body: { email: 'u1c@example.com', password: 'TestPassw0rd!xyz' } });
  const res = mockRes();

  await authEmail.handleEmailLogin(req, res);
  assert(rotateCallCount === 1, 'U1c: rotateSessionId called exactly once for email/password login');
}

// ─────────────────────────────────────────────────────────────────────────────
// IT1/IT2 — first-time vs. returning GitHub OAuth login redirects (AC1, AC2)
// ─────────────────────────────────────────────────────────────────────────────

async function runGithubCallback(isFirstLogin) {
  const oauthAdapter = freshRequire(OAUTH_ADAPTER_PATH);
  const userRoles = freshRequire(USER_ROLES_PATH);
  const userFlags = freshRequire(USER_FLAGS_PATH);
  const auth = freshRequire(AUTH_PATH);
  // Uses the REAL middleware/session.js implementation (rotateSessionId / getSession /
  // persistSession) rather than mocking it — it works correctly against the in-memory
  // session store with no Redis adapter configured (persistSession is then a no-op),
  // so this doubles as a light integration check of the real rotation behaviour.

  userRoles.setGetUserRole(async function() { return 'user'; });
  let clearFlagCalled = false;
  userFlags.setUserFlagsAdapter({
    getFirstLoginFlag:   async function() { return isFirstLogin; },
    clearFirstLoginFlag: async function() { clearFlagCalled = true; }
  });
  auth.setFetchOrgs(async function() { return []; });

  oauthAdapter.validateOAuthState      = function() { return true; };
  oauthAdapter.providerExchangeCode    = async function() { return 'gho_stub_token'; };
  oauthAdapter.providerGetUserIdentity = async function() { return { id: isFirstLogin ? 111 : 222, login: 'octocat' }; };
  oauthAdapter.storeTokenInSession     = function(req, token) { req.session.accessToken = token; };

  const req = mockReq({ session: { oauthState: 'state-it' }, query: { code: 'c', state: 'state-it' } });
  const res = mockRes();

  await auth.handleAuthCallback(req, res);
  await new Promise(function(r) { setTimeout(r, 5); });

  return { res: res, clearFlagCalled: clearFlagCalled };
}

async function testIT1FirstTimeToWelcome() {
  const r = await runGithubCallback(true);
  assert(r.res.statusCode === 302, 'IT1: first-time login responds 302');
  assert(r.res.headers.Location === '/welcome', 'IT1: first-time GitHub login redirects to /welcome (f845caf7 fix)');
  assert(r.clearFlagCalled === true, 'IT1: clearFirstLoginFlag invoked so the next login is treated as returning');
}

async function testIT2ReturningToDashboard() {
  const r = await runGithubCallback(false);
  assert(r.res.statusCode === 302, 'IT2: returning login responds 302');
  assert(r.res.headers.Location === '/dashboard', 'IT2: returning GitHub login redirects straight to /dashboard, not /welcome');
}

// ─────────────────────────────────────────────────────────────────────────────
// IT3 — accessToken never appears in the HTML response body or captured logs,
// for any of the three providers (AC4)
// ─────────────────────────────────────────────────────────────────────────────

async function testIT3NoTokenLeakGithub() {
  const oauthAdapter = freshRequire(OAUTH_ADAPTER_PATH);
  const userRoles = freshRequire(USER_ROLES_PATH);
  const userFlags = freshRequire(USER_FLAGS_PATH);
  const auth = freshRequire(AUTH_PATH);
  // Uses the REAL middleware/session.js implementation — see comment in runGithubCallback.

  const TOKEN = 'gho_SECRET_TOKEN_VALUE_abc123';
  const logEvents = [];
  auth.setLogger({
    info: function(event, data) { logEvents.push({ event: event, data: data }); },
    warn: function(event, data) { logEvents.push({ event: event, data: data }); }
  });

  userRoles.setGetUserRole(async function() { return 'user'; });
  userFlags.setUserFlagsAdapter({
    getFirstLoginFlag:   async function() { return false; },
    clearFirstLoginFlag: async function() {}
  });
  auth.setFetchOrgs(async function() { return []; });

  oauthAdapter.validateOAuthState      = function() { return true; };
  oauthAdapter.providerExchangeCode    = async function() { return TOKEN; };
  oauthAdapter.providerGetUserIdentity = async function() { return { id: 333, login: 'octocat' }; };
  oauthAdapter.storeTokenInSession     = function(req, token) { req.session.accessToken = token; };

  const req = mockReq({ session: { oauthState: 'state-it3' }, query: { code: 'c', state: 'state-it3' } });
  const res = mockRes();

  await auth.handleAuthCallback(req, res);
  await new Promise(function(r) { setTimeout(r, 5); });

  const responseStr = String(res.body) + JSON.stringify(res.headers);
  assert(!responseStr.includes(TOKEN), 'IT3 (GitHub): accessToken absent from HTML response body / headers');
  assert(!JSON.stringify(logEvents).includes(TOKEN), 'IT3 (GitHub): accessToken absent from captured logs');
}

async function testIT3NoTokenLeakGoogle() {
  const oauthAdapter = freshRequire(OAUTH_ADAPTER_PATH);
  const userRoles = freshRequire(USER_ROLES_PATH);
  const auth = freshRequire(AUTH_PATH);
  // Uses the REAL middleware/session.js implementation — see comment in runGithubCallback.

  const TOKEN = 'ya29.SECRET_GOOGLE_TOKEN_xyz789';
  const logEvents = [];
  auth.setLogger({
    info: function(event, data) { logEvents.push({ event: event, data: data }); },
    warn: function(event, data) { logEvents.push({ event: event, data: data }); }
  });

  userRoles.setGetUserRole(async function() { return 'user'; });
  oauthAdapter.validateOAuthState = function() { return true; };
  oauthAdapter.setGoogleUserInfoAdapter(async function() {
    return { sub: 'google-sub-2', email: 'user2@example.com', accessToken: TOKEN };
  });

  const req = mockReq({ session: { oauthState: 'state-it3g' }, query: { code: 'c', state: 'state-it3g' } });
  const res = mockRes();

  await auth.handleAuthGoogleCallback(req, res);

  const responseStr = String(res.body) + JSON.stringify(res.headers);
  assert(!responseStr.includes(TOKEN), 'IT3 (Google): accessToken absent from HTML response body / headers');
  assert(!JSON.stringify(logEvents).includes(TOKEN), 'IT3 (Google): accessToken absent from captured logs');
}

async function testIT3NoTokenLeakEmailPassword() {
  const authEmail = freshRequire(AUTH_EMAIL_PATH);
  const userRoles = freshRequire(USER_ROLES_PATH);
  authEmail._clearRateLimits();
  userRoles.setGetUserRole(async function() { return 'user'; });

  const hash = await bcrypt.hash('TestPassw0rd!xyz', 10);
  authEmail.setUserDb(mockUserDb({ rows: [{ id: 2, email: 'it3@example.com', password_hash: hash }] }));
  authEmail.setRotateSessionId(function(oldId, res, existingData) {
    return { newId: 'rotated-sid-email-it3' };
  });

  const req = mockReq({ body: { email: 'it3@example.com', password: 'TestPassw0rd!xyz' } });
  const res = mockRes();

  await authEmail.handleEmailLogin(req, res);
  const generatedToken = req.session.accessToken;

  assert(typeof generatedToken === 'string' && generatedToken.length > 0, 'IT3 (email/password): accessToken generated on session');
  const responseStr = String(res.body) + JSON.stringify(res.headers);
  assert(!responseStr.includes(generatedToken), 'IT3 (email/password): accessToken absent from HTML response body / headers');
}

// ─────────────────────────────────────────────────────────────────────────────
// IT4 — @mocked runs stub the OAuth provider exchange; zero real HTTP calls (AC5)
// ─────────────────────────────────────────────────────────────────────────────

async function testIT4NoRealOAuthCallsGithub() {
  const oauthAdapter = freshRequire(OAUTH_ADAPTER_PATH);
  const userRoles = freshRequire(USER_ROLES_PATH);
  const userFlags = freshRequire(USER_FLAGS_PATH);
  const auth = freshRequire(AUTH_PATH);
  // Uses the REAL middleware/session.js implementation — see comment in runGithubCallback.

  userRoles.setGetUserRole(async function() { return 'user'; });
  userFlags.setUserFlagsAdapter({
    getFirstLoginFlag:   async function() { return false; },
    clearFirstLoginFlag: async function() {}
  });
  auth.setFetchOrgs(async function() { return []; });

  // Stub the provider registry directly — the real gitHubProviderAdapter (which calls
  // global.fetch against github.com) is never invoked.
  oauthAdapter.validateOAuthState      = function() { return true; };
  oauthAdapter.providerExchangeCode    = async function() { return 'gho_stub_token'; };
  oauthAdapter.providerGetUserIdentity = async function() { return { id: 444, login: 'octocat' }; };
  oauthAdapter.storeTokenInSession     = function(req, token) { req.session.accessToken = token; };

  const origFetch = global.fetch;
  installFetchSpy();

  const req = mockReq({ session: { oauthState: 'state-it4' }, query: { code: 'c', state: 'state-it4' } });
  const res = mockRes();

  try {
    await auth.handleAuthCallback(req, res);
    await new Promise(function(r) { setTimeout(r, 5); });
  } finally {
    restoreFetchSpy(origFetch);
  }

  assert(res.statusCode === 302, 'IT4 (GitHub): login still completes (302) via the stubbed exchange');
  assert(fetchCalls.length === 0, 'IT4 (GitHub): zero real HTTP calls recorded against github.com token/user endpoints');
}

async function testIT4NoRealOAuthCallsGoogle() {
  const oauthAdapter = freshRequire(OAUTH_ADAPTER_PATH);
  const userRoles = freshRequire(USER_ROLES_PATH);
  const auth = freshRequire(AUTH_PATH);
  // Uses the REAL middleware/session.js implementation — see comment in runGithubCallback.

  userRoles.setGetUserRole(async function() { return 'user'; });
  oauthAdapter.validateOAuthState = function() { return true; };
  oauthAdapter.setGoogleUserInfoAdapter(async function() {
    return { sub: 'google-sub-3', email: 'user3@example.com', accessToken: 'ya29.stub2' };
  });

  const origFetch = global.fetch;
  installFetchSpy();

  const req = mockReq({ session: { oauthState: 'state-it4g' }, query: { code: 'c', state: 'state-it4g' } });
  const res = mockRes();

  try {
    await auth.handleAuthGoogleCallback(req, res);
  } finally {
    restoreFetchSpy(origFetch);
  }

  assert(res.statusCode === 302, 'IT4 (Google): login still completes (302) via the stubbed exchange');
  assert(fetchCalls.length === 0, 'IT4 (Google): zero real HTTP calls recorded against accounts.google.com token/userinfo endpoints');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[bri-s3.6-auth-journey] Running AC verification tests...\n');

  console.log('U1 — rotateSessionId called exactly once per provider login (AC1/AC2/AC4)');
  await testU1aGithub();
  await testU1bGoogle();
  await testU1cEmailPassword();

  console.log('\nIT1/IT2 — first-time vs. returning GitHub login redirects (AC1, AC2)');
  await testIT1FirstTimeToWelcome();
  await testIT2ReturningToDashboard();

  console.log('\nIT3 — accessToken never appears in HTML response or logs (AC4)');
  await testIT3NoTokenLeakGithub();
  await testIT3NoTokenLeakGoogle();
  await testIT3NoTokenLeakEmailPassword();

  console.log('\nIT4 — @mocked stubbed exchange, zero real OAuth endpoint calls (AC5)');
  await testIT4NoRealOAuthCallsGithub();
  await testIT4NoRealOAuthCallsGoogle();

  console.log('\n[bri-s3.6-auth-journey] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[bri-s3.6-auth-journey] Unexpected error:', err);
  process.exit(1);
});
