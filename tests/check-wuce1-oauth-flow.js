#!/usr/bin/env node
// check-wuce1-oauth-flow.js — AC verification tests for wuce.1 (GitHub OAuth flow)
// Tests T1.1–T1.4, T2.1–T2.3, T3.1–T3.3, T5.1–T5.2, IT1–IT4, NFR1–NFR2
// Tests FAIL until src/web-ui/auth/oauth-adapter.js, routes/auth.js, middleware/session.js exist.
// No external dependencies — Node.js built-ins only.

'use strict';

const path = require('path');

const ROOT = path.join(__dirname, '..');

const tokenSuccessFixture = require('./fixtures/github/oauth-token-exchange-success.json');
const userIdentityFixture  = require('./fixtures/github/user-identity.json');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

// ── Set env vars before requiring modules ───────────────────────────────────
process.env.GITHUB_CLIENT_ID      = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET  = 'test-secret';
process.env.GITHUB_CALLBACK_URL   = 'http://localhost:3000/auth/github/callback';
process.env.SESSION_SECRET        = 'test-session-secret-minimum32chars!!';

// ── Load modules ─────────────────────────────────────────────────────────────
const {
  generateState,
  buildOAuthRedirectURL,
  exchangeCodeForToken,
  storeTokenInSession,
  validateOAuthState,
  getUserIdentity
} = require('../src/web-ui/auth/oauth-adapter');

const {
  handleAuthGithub,
  handleAuthCallback,
  handleLogout,
  authGuard,
  setLogger
} = require('../src/web-ui/routes/auth');

const { SESSION_COOKIE_CONFIG } = require('../src/web-ui/middleware/session');

// ── Test helpers ─────────────────────────────────────────────────────────────
function mockReq(overrides) {
  return Object.assign({ session: {}, sessionId: 'test-sid', query: {}, headers: {} }, overrides || {});
}

function mockRes() {
  return {
    statusCode: null,
    headers: {},
    body: '',
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) Object.assign(this.headers, hdrs);
    },
    end(body) { this.body = (body != null ? body : ''); this._ended = true; }
  };
}

// ── Test registry ─────────────────────────────────────────────────────────────
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// ═══════════════════════════════════════════════════════════════════════════
// AC1 — OAuth redirect generation
// ═══════════════════════════════════════════════════════════════════════════

test('T1.1 buildOAuthRedirectURL returns URL pointing to GitHub OAuth authorisation endpoint', () => {
  const url = buildOAuthRedirectURL('test-state');
  assert(url.startsWith('https://github.com/login/oauth/authorize'), 'T1.1: URL starts with GitHub OAuth endpoint');
  assert(url.includes('client_id=test-client-id'), 'T1.1: URL contains client_id');
});

test('T1.2 buildOAuthRedirectURL includes repo and read:user scopes', () => {
  const url = buildOAuthRedirectURL('test-state');
  const decoded = decodeURIComponent(url);
  assert(decoded.includes('repo') && decoded.includes('read:user'), 'T1.2: URL contains repo and read:user scopes');
});

test('T1.3 buildOAuthRedirectURL embeds the provided state value in the redirect URL', () => {
  const url = buildOAuthRedirectURL('test-csrf-state-abc123');
  assert(url.includes('state=test-csrf-state-abc123'), 'T1.3: URL contains provided state value');
});

test('T1.4 generateState returns a different value on each call', () => {
  const s1 = generateState();
  const s2 = generateState();
  assert(typeof s1 === 'string' && s1.length > 0, 'T1.4: generateState returns non-empty string');
  assert(s1 !== s2, 'T1.4: consecutive calls return different values');
});

// ═══════════════════════════════════════════════════════════════════════════
// AC2 — Token exchange and session storage
// ═══════════════════════════════════════════════════════════════════════════

test('T2.1 exchangeCodeForToken calls GitHub token endpoint with code and client credentials', async () => {
  let capturedUrl, capturedOptions;
  const origFetch = global.fetch;
  global.fetch = async (url, opts) => {
    capturedUrl = url;
    capturedOptions = opts;
    return { json: async () => tokenSuccessFixture };
  };

  await exchangeCodeForToken('valid-code');
  global.fetch = origFetch;

  assert(capturedUrl === 'https://github.com/login/oauth/access_token', 'T2.1: fetch called with GitHub token URL');
  assert(capturedOptions && capturedOptions.method === 'POST', 'T2.1: fetch uses POST method');
  assert(capturedOptions.body && capturedOptions.body.includes('code=valid-code'), 'T2.1: body contains code');
  assert(capturedOptions.body && capturedOptions.body.includes('client_id=test-client-id'), 'T2.1: body contains client_id');
  assert(capturedOptions.body && capturedOptions.body.includes('client_secret=test-secret'), 'T2.1: body contains client_secret');
});

test('T2.2 exchangeCodeForToken returns the access_token from the fixture response', async () => {
  const origFetch = global.fetch;
  global.fetch = async () => ({ json: async () => tokenSuccessFixture });
  const token = await exchangeCodeForToken('valid-code');
  global.fetch = origFetch;

  assert(token === 'gho_test_fixture_token_wuce1', 'T2.2: returns correct access_token from fixture');
});

test('T2.3 storeTokenInSession stores token in req.session, not in response headers', () => {
  const req = mockReq();
  storeTokenInSession(req, 'gho_test_fixture_token_wuce1');
  assert(req.session.accessToken === 'gho_test_fixture_token_wuce1', 'T2.3: token stored in req.session.accessToken');
});

// ═══════════════════════════════════════════════════════════════════════════
// AC3 — CSRF state mismatch protection
// ═══════════════════════════════════════════════════════════════════════════

test('T3.1 validateOAuthState returns false when states do not match', () => {
  assert(validateOAuthState('state-abc', 'state-xyz') === false, 'T3.1: returns false for mismatched states');
});

test('T3.2 validateOAuthState returns true when states match', () => {
  assert(validateOAuthState('state-abc', 'state-abc') === true, 'T3.2: returns true for matching states');
});

test('T3.3 callbackHandler logs oauth_state_mismatch event and returns 403 on state mismatch', async () => {
  const logEvents = [];
  setLogger({
    info: (event, data) => logEvents.push({ event, data }),
    warn: (event, data) => logEvents.push({ event, data })
  });

  const req = mockReq({ session: { oauthState: 'state-stored' }, query: { code: 'any-code', state: 'state-different' } });
  const res = mockRes();

  await handleAuthCallback(req, res);

  const mismatch = logEvents.find(e => e.event === 'oauth_state_mismatch');
  assert(mismatch !== undefined, 'T3.3: oauth_state_mismatch event logged');
  assert(res.statusCode === 403, 'T3.3: response status is 403');
  assert(!req.session.accessToken, 'T3.3: no token stored after mismatch');
});

// ═══════════════════════════════════════════════════════════════════════════
// AC5 — Session expiry and auth guard
// ═══════════════════════════════════════════════════════════════════════════

test('T5.1 authGuard middleware redirects to / when req.session.accessToken is absent', () => {
  const req = mockReq({ session: {} });
  const res = mockRes();
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  authGuard(req, res, next);

  assert(!nextCalled, 'T5.1: next() is not called when no accessToken');
  assert(res.statusCode === 302, 'T5.1: status is 302');
  assert(res.headers.Location === '/', 'T5.1: redirects to /');
});

test('T5.2 authGuard middleware does not include session data in redirect response', () => {
  // Simulate session with cleared token (expired/revoked)
  const req = mockReq({ session: { accessToken: null } });
  const res = mockRes();

  authGuard(req, res, () => {});

  assert(res.statusCode === 302, 'T5.2: redirects when token is null');
  const responseStr = (res.headers.Location || '') + (res.body || '');
  assert(!responseStr.includes('gho_'), 'T5.2: redirect does not expose any token value');
});

// ═══════════════════════════════════════════════════════════════════════════
// Integration tests (route handler with mock req/res)
// ═══════════════════════════════════════════════════════════════════════════

test('IT1 GET /auth/github returns 302 redirect to GitHub OAuth URL with state stored in session', async () => {
  const req = mockReq();
  const res = mockRes();

  await handleAuthGithub(req, res);

  assert(res.statusCode === 302, 'IT1: status is 302');
  assert(res.headers.Location && res.headers.Location.includes('github.com/login/oauth/authorize'), 'IT1: Location contains GitHub OAuth URL');
  assert(req.session.oauthState && req.session.oauthState.length > 0, 'IT1: oauthState set in session');
});

test('IT2 GET /auth/github/callback with valid code and matching state stores token and redirects to /dashboard', async () => {
  const origFetch = global.fetch;
  global.fetch = async (url) => {
    if (url.includes('access_token')) return { json: async () => tokenSuccessFixture };
    if (url.includes('/user')) return { json: async () => userIdentityFixture };
    return { json: async () => ({}) };
  };

  const req = mockReq({ session: { oauthState: 'state-abc' }, query: { code: 'valid-code', state: 'state-abc' } });
  const res = mockRes();

  await handleAuthCallback(req, res);
  global.fetch = origFetch;

  assert(res.statusCode === 302, 'IT2: status is 302');
  assert(res.headers.Location === '/dashboard', 'IT2: redirects to /dashboard');
  assert(req.session.accessToken === 'gho_test_fixture_token_wuce1', 'IT2: token stored in session');
  const cookieHeader = String(res.headers['Set-Cookie'] || '');
  assert(!cookieHeader.includes('gho_test_fixture_token_wuce1'), 'IT2: token not in Set-Cookie header');
});

test('IT3 GET /auth/github/callback with mismatched state returns 403', async () => {
  const req = mockReq({ session: { oauthState: 'state-stored' }, query: { code: 'any-code', state: 'state-different' } });
  const res = mockRes();

  await handleAuthCallback(req, res);

  assert(res.statusCode === 403, 'IT3: status is 403');
  assert(!req.session.accessToken, 'IT3: no token stored in session');
  assert(!String(res.body).includes('gho_'), 'IT3: response body does not contain token');
});

test('IT4 GET /dashboard without session redirects to /', () => {
  const req = mockReq({ session: {} }); // no accessToken
  const res = mockRes();
  let nextCalled = false;

  authGuard(req, res, () => { nextCalled = true; });

  assert(res.statusCode === 302, 'IT4: status is 302');
  assert(res.headers.Location === '/', 'IT4: redirects to /');
  assert(!nextCalled, 'IT4: protected handler not invoked');
});

// ═══════════════════════════════════════════════════════════════════════════
// NFR tests
// ═══════════════════════════════════════════════════════════════════════════

test('NFR1 session cookie config is HttpOnly Secure SameSite=Strict', () => {
  assert(SESSION_COOKIE_CONFIG.httpOnly === true, 'NFR1: httpOnly is true');
  assert(SESSION_COOKIE_CONFIG.secure === true, 'NFR1: secure is true');
  assert(SESSION_COOKIE_CONFIG.sameSite === 'strict', 'NFR1: sameSite is strict');
});

test('NFR2 audit log contains login event with GitHub user ID and timestamp but no access token', async () => {
  const logEvents = [];
  setLogger({
    info: (event, data) => logEvents.push({ event, ...(data || {}) }),
    warn: (event, data) => logEvents.push({ event, ...(data || {}) })
  });

  const origFetch = global.fetch;
  global.fetch = async (url) => {
    if (url.includes('access_token')) return { json: async () => tokenSuccessFixture };
    if (url.includes('/user')) return { json: async () => userIdentityFixture };
    return { json: async () => ({}) };
  };

  const req = mockReq({ session: { oauthState: 'state-nfr2' }, query: { code: 'test-code', state: 'state-nfr2' } });
  const res = mockRes();

  await handleAuthCallback(req, res);
  global.fetch = origFetch;

  const loginEvent = logEvents.find(e => e.event === 'login');
  assert(loginEvent !== undefined, 'NFR2: login event is logged');
  assert(loginEvent.userId === 99001, 'NFR2: log entry contains GitHub user ID');
  assert(loginEvent.timestamp && /\d{4}-\d{2}-\d{2}T/.test(loginEvent.timestamp), 'NFR2: log entry contains ISO timestamp');

  const logStr = JSON.stringify(logEvents);
  assert(!logStr.includes('gho_test_fixture_token_wuce1'), 'NFR2: access token not present in any log entry');
});

// ═══════════════════════════════════════════════════════════════════════════
// Runner
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n[wuce.1-oauth-flow] Running 18 AC verification tests...\n');

  for (const t of tests) {
    try {
      const result = t.fn();
      if (result && typeof result.then === 'function') {
        await result;
      }
    } catch (err) {
      console.log(`  \u2717 ${t.name} \u2014 threw: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n[wuce.1-oauth-flow] ${passed} passed, ${failed} failed`);

  if (failed > 0) process.exit(1);
}

main();
