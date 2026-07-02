#!/usr/bin/env node
// check-lab-s2.1-google-oauth.js — AC verification tests for lab-s2.1 (Google OAuth)
// Tests: T1.1-T1.3 (getGoogleAuthUrl), T2.1 (CSRF redirect), T3.1-T3.4 (callback/mismatch),
//        T4.1 (D37 stub throws), T5.1 (server.js wiring), T6.1 (login page template),
//        NFR1 (canonical session fields), NFR2 (no credentials committed)
// Total: 14 tests

'use strict';

const path = require('path');
const fs   = require('fs');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}

// ── Set env vars before requiring modules ───────────────────────────────────
process.env.GOOGLE_CLIENT_ID      = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET  = 'test-google-client-secret';
process.env.GOOGLE_CALLBACK_URL   = 'http://localhost:3000/auth/google/callback';
process.env.GITHUB_CLIENT_ID      = 'test-gh-client-id';
process.env.GITHUB_CLIENT_SECRET  = 'test-gh-secret';
process.env.GITHUB_CALLBACK_URL   = 'http://localhost:3000/auth/github/callback';
process.env.SESSION_SECRET        = 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV              = 'test';

// ── Test helpers ─────────────────────────────────────────────────────────────
function mockReq(overrides) {
  return Object.assign({ session: {}, sessionId: 'test-sid', query: {}, headers: {} }, overrides || {});
}

function mockRes() {
  const _headers = {};
  return {
    statusCode: null,
    get headers() { return _headers; },
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) Object.assign(_headers, hdrs);
    },
    setHeader(name, value) { _headers[name] = value; },
    end(body) { this.body = (body != null ? body : ''); this._ended = true; }
  };
}

// ── Test registry ─────────────────────────────────────────────────────────────
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// ── Load modules ─────────────────────────────────────────────────────────────
const _oauthAdapter = require('../src/web-ui/auth/oauth-adapter');
const {
  handleAuthGoogle,
  handleAuthGoogleCallback,
  setLogger
} = require('../src/web-ui/routes/auth');

// ═══════════════════════════════════════════════════════════════════════════
// T1 — getGoogleAuthUrl (Task 1 / AC1)
// ═══════════════════════════════════════════════════════════════════════════

test('T1.1 getGoogleAuthUrl builds URL pointing to Google OAuth authorisation endpoint', () => {
  const url = _oauthAdapter.getGoogleAuthUrl('test-state');
  assert(url.startsWith('https://accounts.google.com/o/oauth2/v2/auth'), 'T1.1: URL starts with Google OAuth endpoint');
});

test('T1.2 getGoogleAuthUrl includes correct client_id, scope, response_type, redirect_uri', () => {
  const url = _oauthAdapter.getGoogleAuthUrl('test-state');
  const parsed = new URL(url);
  assert(parsed.searchParams.get('client_id') === 'test-google-client-id', 'T1.2: client_id from env');
  assert(parsed.searchParams.get('scope') === 'openid email', 'T1.2: scope is openid email');
  assert(parsed.searchParams.get('response_type') === 'code', 'T1.2: response_type is code');
  assert(parsed.searchParams.get('redirect_uri') === 'http://localhost:3000/auth/google/callback', 'T1.2: redirect_uri from env');
});

test('T1.3 getGoogleAuthUrl embeds the provided state value', () => {
  const url = _oauthAdapter.getGoogleAuthUrl('csrf-state-xyz');
  const parsed = new URL(url);
  assert(parsed.searchParams.get('state') === 'csrf-state-xyz', 'T1.3: state param matches provided value');
});

// ═══════════════════════════════════════════════════════════════════════════
// T2 — GET /auth/google redirect (Task 2 / AC2)
// ═══════════════════════════════════════════════════════════════════════════

test('T2.1 GET /auth/google returns 302, stores oauthState in session, redirects to Google', async () => {
  const req = mockReq();
  const res = mockRes();
  setLogger({ info: () => {}, warn: () => {} });

  await handleAuthGoogle(req, res);

  assert(res.statusCode === 302, 'T2.1: response is 302');
  assert(res.headers.Location && res.headers.Location.includes('accounts.google.com'), 'T2.1: Location contains Google OAuth URL');
  assert(typeof req.session.oauthState === 'string' && req.session.oauthState.length > 0, 'T2.1: oauthState stored in session');
});

// ═══════════════════════════════════════════════════════════════════════════
// T3 — Callback handler (Task 3 / AC3)
// ═══════════════════════════════════════════════════════════════════════════

test('T3.1 callback with mismatched state returns 403 and logs oauth_state_mismatch', async () => {
  const logEvents = [];
  setLogger({
    info: (event, data) => logEvents.push({ event, data }),
    warn: (event, data) => logEvents.push({ event, data })
  });

  const req = mockReq({ session: { oauthState: 'state-stored' }, query: { code: 'any-code', state: 'state-different' } });
  const res = mockRes();

  await handleAuthGoogleCallback(req, res);

  const mismatch = logEvents.find(e => e.event === 'oauth_state_mismatch');
  assert(mismatch !== undefined, 'T3.1: oauth_state_mismatch event logged');
  assert(res.statusCode === 403, 'T3.1: response status is 403');
  assert(!req.session.accessToken, 'T3.1: no token stored after mismatch');
});

test('T3.2 callback with matching state sets canonical session fields and redirects to /dashboard', async () => {
  const MOCK_SUB   = 'google-sub-12345';
  const MOCK_EMAIL = 'user@example.com';
  const MOCK_TOKEN = 'google-access-token-xyz';

  _oauthAdapter.setGoogleUserInfoAdapter(async () => ({
    sub: MOCK_SUB, email: MOCK_EMAIL, accessToken: MOCK_TOKEN
  }));

  setLogger({ info: () => {}, warn: () => {} });

  const req = mockReq({ session: { oauthState: 'state-match' }, query: { code: 'code-xyz', state: 'state-match' } });
  const res = mockRes();

  await handleAuthGoogleCallback(req, res);

  assert(res.statusCode === 302, 'T3.2: response is 302');
  assert(res.headers.Location === '/dashboard', 'T3.2: redirects to /dashboard');
  // After session rotation, req.session is the new session
  assert(req.session.accessToken === MOCK_TOKEN, 'T3.2: accessToken stored (canonical field)');
  assert(req.session.userId === MOCK_SUB, 'T3.2: userId set to Google sub');
  assert(req.session.tenantId === MOCK_SUB, 'T3.2: tenantId set to Google sub');
  assert(req.session.login === MOCK_EMAIL, 'T3.2: login set to email');
});

test('T3.3 callback never stores token under legacy field req.session.googleToken', async () => {
  _oauthAdapter.setGoogleUserInfoAdapter(async () => ({
    sub: 'sub-nfr', email: 'nfr@example.com', accessToken: 'tok-nfr'
  }));

  setLogger({ info: () => {}, warn: () => {} });

  const req = mockReq({ session: { oauthState: 'state-nfr3' }, query: { code: 'code-nfr', state: 'state-nfr3' } });
  const res = mockRes();

  await handleAuthGoogleCallback(req, res);

  assert(req.session.googleToken === undefined, 'T3.3: req.session.googleToken is NOT set (legacy field absent)');
  assert(typeof req.session.accessToken === 'string' && req.session.accessToken.length > 0, 'T3.3: req.session.accessToken IS set (canonical)');
});

test('T3.4 rotateSessionId called after successful Google callback (session ID changes)', async () => {
  _oauthAdapter.setGoogleUserInfoAdapter(async () => ({
    sub: 'sub-t34', email: 't34@example.com', accessToken: 'tok-t34'
  }));

  setLogger({ info: () => {}, warn: () => {} });

  const preLoginSessionId = 'pre-login-sid-t34';
  const req = mockReq({
    session: { oauthState: 'state-t34' },
    sessionId: preLoginSessionId,
    query: { code: 'code-t34', state: 'state-t34' }
  });
  const res = mockRes();

  await handleAuthGoogleCallback(req, res);

  assert(req.sessionId !== preLoginSessionId, 'T3.4: session ID rotated after successful Google login');
  assert(typeof req.sessionId === 'string' && req.sessionId.length > 0, 'T3.4: new session ID is non-empty');
});

// ═══════════════════════════════════════════════════════════════════════════
// T4 — D37 injectable stub throws (Task 1 / D37 / AC4)
// ═══════════════════════════════════════════════════════════════════════════

test('T4.1 default googleUserInfo adapter stub throws "Adapter not wired: googleUserInfo"', async () => {
  const oauthPath = require.resolve('../src/web-ui/auth/oauth-adapter');
  delete require.cache[oauthPath];
  const freshOAuth = require('../src/web-ui/auth/oauth-adapter');

  let threw = false;
  let errorMsg = '';
  try {
    await freshOAuth.fetchGoogleUserInfo('code', 'http://localhost/cb');
  } catch (e) {
    threw = true;
    errorMsg = e.message;
  }

  assert(threw, 'T4.1: fetchGoogleUserInfo throws on fresh (unwired) module');
  assert(errorMsg.includes('Adapter not wired'), 'T4.1: error message contains "Adapter not wired"');
  assert(errorMsg.includes('googleUserInfo'), 'T4.1: error message names the adapter');

  delete require.cache[oauthPath];
});

// ═══════════════════════════════════════════════════════════════════════════
// T5 — server.js wiring (Task 4 / AC5)
// ═══════════════════════════════════════════════════════════════════════════

test('T5.1 server.js imports Google handler functions and registers /auth/google routes', () => {
  const serverSource = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');

  assert(serverSource.includes('handleAuthGoogle') && serverSource.includes('handleAuthGoogleCallback'),
    'T5.1: server.js imports handleAuthGoogle and handleAuthGoogleCallback');
  assert(serverSource.includes("'/auth/google'") || serverSource.includes('"/auth/google"'),
    'T5.1: server.js registers GET /auth/google route');
  assert(serverSource.includes("'/auth/google/callback'") || serverSource.includes('"/auth/google/callback"'),
    'T5.1: server.js registers GET /auth/google/callback route');
  assert(serverSource.includes('setGoogleUserInfoAdapter') && serverSource.includes('google oauth registered'),
    'T5.1: server.js wires Google adapter and logs startup message');
});

// ═══════════════════════════════════════════════════════════════════════════
// T6 — Auth chooser template (Task 5 / AC6)
// ═══════════════════════════════════════════════════════════════════════════

test('T6.1 renderLoginPage includes "Continue with Google" button pointing to /auth/google', () => {
  const { renderLoginPage } = require('../src/web-ui/utils/html-shell');
  const html = renderLoginPage();

  assert(html.includes('/auth/google'), 'T6.1: login page contains /auth/google link');
  assert(html.includes('Continue with Google') || html.includes('Sign in with Google'),
    'T6.1: login page contains Google sign-in label');
  assert(html.includes('/auth/github'), 'T6.1: GitHub sign-in link still present (regression check)');
});

// ═══════════════════════════════════════════════════════════════════════════
// NFR — Credential safety
// ═══════════════════════════════════════════════════════════════════════════

test('NFR1 GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are read from env — no hardcoded credentials in source', () => {
  const oauthSource  = fs.readFileSync(path.join(ROOT, 'src/web-ui/auth/oauth-adapter.js'), 'utf8');
  const serverSource = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');

  // Ensure the strings are read from process.env, not hardcoded
  const hasEnvRead = oauthSource.includes('process.env.GOOGLE_CLIENT_ID') &&
                     oauthSource.includes('process.env.GOOGLE_CLIENT_SECRET');
  assert(hasEnvRead, 'NFR1: oauth-adapter.js reads GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from process.env');

  // Neither file should contain a literal secret value (beyond test env vars in test files)
  const suspiciousCredential = /GOOGLE_CLIENT_SECRET\s*=\s*['"][^'"]{8,}/;
  assert(!suspiciousCredential.test(oauthSource), 'NFR1: oauth-adapter.js has no hardcoded GOOGLE_CLIENT_SECRET value');
  assert(!suspiciousCredential.test(serverSource), 'NFR1: server.js has no hardcoded GOOGLE_CLIENT_SECRET value');
});

// ═══════════════════════════════════════════════════════════════════════════
// Runner
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n[lab-s2.1-google-oauth] Running 14 AC verification tests...\n');

  for (const t of tests) {
    try {
      const result = t.fn();
      if (result && typeof result.then === 'function') {
        await result;
      }
    } catch (err) {
      console.log(`  ✗ ${t.name} — threw: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n[lab-s2.1-google-oauth] ${passed} passed, ${failed} failed`);

  if (failed > 0) process.exit(1);
}

main();
