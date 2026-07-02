#!/usr/bin/env node
// check-lab-s1.3-provider-registry.js — AC verification tests for lab-s1.3
// Tests IT1.1, IT1.2 (AC1), T2.1, T2.2 (AC2), T3.1 (AC3), T4.1, T4.2 (AC4),
//       T5.1, T5.2 (AC5), T6.1 (AC6), NFR1 (Redis sanitisation)
// Total: 11 tests (matches test-plan totalTests: 11)

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
process.env.GITHUB_CLIENT_ID      = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET  = 'test-secret';
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
// Load routes/auth first — this auto-wires the real GitHub adapter in oauth-adapter.
const {
  handleAuthGithub,
  handleAuthCallback,
  authGuard,
  setLogger
} = require('../src/web-ui/routes/auth');

const _oauthAdapter = require('../src/web-ui/auth/oauth-adapter');
const { _sanitiseForRedis } = require('../src/web-ui/middleware/session');

// ─── Shared mock adapter for IT1 tests ───────────────────────────────────────
const MOCK_TOKEN    = 'mock-access-token-it1';
const MOCK_USER     = { id: 42, login: 'mockuser' };

const mockProviderAdapter = {
  exchangeCode:    async () => MOCK_TOKEN,
  getUserIdentity: async () => MOCK_USER
};

// ═══════════════════════════════════════════════════════════════════════════
// IT1 — GitHub OAuth happy path (AC1)
// ═══════════════════════════════════════════════════════════════════════════

test('IT1.1 github-oauth-full-flow-sets-session-fields', async () => {
  // Override provider adapter with controllable mock
  _oauthAdapter.setProviderAdapter(mockProviderAdapter);

  const req = mockReq({ session: { oauthState: 'state-it1' }, query: { code: 'auth-code-it1', state: 'state-it1' } });
  const res = mockRes();

  // Silence logger during test
  setLogger({ info: () => {}, warn: () => {} });

  await handleAuthCallback(req, res);

  assert(res.statusCode === 302, 'IT1.1: response is 302 redirect');
  // After rotation, req.session is the NEW session object
  assert(req.session.accessToken === MOCK_TOKEN, 'IT1.1: accessToken stored in session');
  assert(req.session.userId === MOCK_USER.id, 'IT1.1: userId stored in session');
  assert(typeof req.session.tenantId === 'string' && req.session.tenantId.length > 0, 'IT1.1: tenantId set in session');
  assert(res.headers.Location === '/dashboard', 'IT1.1: redirected to /dashboard');

  // Restore real GitHub adapter
  _oauthAdapter.setProviderAdapter(_oauthAdapter.gitHubProviderAdapter);
});

test('IT1.2 github-oauth-sets-correct-canonical-field-names', async () => {
  _oauthAdapter.setProviderAdapter(mockProviderAdapter);

  const req = mockReq({ session: { oauthState: 'state-it2' }, query: { code: 'auth-code-it2', state: 'state-it2' } });
  const res = mockRes();

  setLogger({ info: () => {}, warn: () => {} });

  await handleAuthCallback(req, res);

  // req.session.accessToken MUST be set; req.session.token must NOT be set
  assert(typeof req.session.accessToken === 'string' && req.session.accessToken.length > 0,
    'IT1.2: req.session.accessToken is set (canonical field)');
  assert(req.session.token === undefined,
    'IT1.2: req.session.token is NOT set (legacy/wrong field absent)');

  _oauthAdapter.setProviderAdapter(_oauthAdapter.gitHubProviderAdapter);
});

// ═══════════════════════════════════════════════════════════════════════════
// T2 — rotateSessionId called after login (AC2)
// ═══════════════════════════════════════════════════════════════════════════

test('T2.1 rotate-session-id-called-on-github-callback-success', async () => {
  _oauthAdapter.setProviderAdapter(mockProviderAdapter);

  const sessionMid = require('../src/web-ui/middleware/session');
  const origRotate = sessionMid.rotateSessionId;

  let rotateCallCount = 0;
  let rotateCalledWithSessionId = null;

  // Monkeypatch rotateSessionId via the module export
  // routes/auth.js destructures { rotateSessionId } at require time, so we need
  // to use Object.defineProperty on the exports to capture the call.
  // Instead, since we can't easily spy on the destructured binding,
  // we verify via the side-effect: the session ID on req changes after the callback.
  const preLoginSessionId = 'pre-login-sid-t21';
  const req = mockReq({
    session: { oauthState: 'state-t21' },
    sessionId: preLoginSessionId,
    query: { code: 'code-t21', state: 'state-t21' }
  });
  const res = mockRes();

  setLogger({ info: () => {}, warn: () => {} });

  await handleAuthCallback(req, res);

  // After rotation, req.sessionId must differ from the pre-login session ID
  assert(req.sessionId !== preLoginSessionId,
    'T2.1: session ID rotated after successful login (req.sessionId changed)');
  assert(typeof req.sessionId === 'string' && req.sessionId.length > 0,
    'T2.1: new session ID is a non-empty string');

  _oauthAdapter.setProviderAdapter(_oauthAdapter.gitHubProviderAdapter);
});

test('T2.2 new-session-cookie-set-after-rotation', async () => {
  _oauthAdapter.setProviderAdapter(mockProviderAdapter);

  const preLoginSessionId = 'pre-login-sid-t22';
  const req = mockReq({
    session: { oauthState: 'state-t22' },
    sessionId: preLoginSessionId,
    query: { code: 'code-t22', state: 'state-t22' }
  });
  const res = mockRes();

  setLogger({ info: () => {}, warn: () => {} });

  await handleAuthCallback(req, res);

  // rotateSessionId calls res.setHeader('Set-Cookie', ...) with the new session ID
  const setCookie = res.headers['Set-Cookie'] || res.headers['set-cookie'] || '';
  assert(typeof setCookie === 'string' && setCookie.includes('session_id='),
    'T2.2: Set-Cookie header contains session_id after rotation');
  assert(!setCookie.includes(preLoginSessionId),
    'T2.2: new Set-Cookie session_id differs from pre-login session ID');

  _oauthAdapter.setProviderAdapter(_oauthAdapter.gitHubProviderAdapter);
});

// ═══════════════════════════════════════════════════════════════════════════
// T3 — Pre-deploy sessions rejected (AC3)
// ═══════════════════════════════════════════════════════════════════════════

test('T3.1 old-session-structure-rejected-by-auth-guard', () => {
  // Simulate a pre-registry session that has req.session.token but not req.session.accessToken
  const req = mockReq({ session: { token: 'old-session-token-value' } });
  const res = mockRes();
  let nextCalled = false;

  authGuard(req, res, () => { nextCalled = true; });

  assert(!nextCalled, 'T3.1: next() not called — old session rejected');
  assert(res.statusCode === 302, 'T3.1: redirect issued for old session');
  assert(res.headers.Location === '/', 'T3.1: redirect target is /');
});

// ═══════════════════════════════════════════════════════════════════════════
// T4 — authGuard uses canonical field (AC4)
// ═══════════════════════════════════════════════════════════════════════════

test('T4.1 auth-guard-allows-request-with-access-token', () => {
  const req = mockReq({ session: { accessToken: 'valid-access-token' } });
  const res = mockRes();
  let nextCalled = false;

  authGuard(req, res, () => { nextCalled = true; });

  assert(nextCalled, 'T4.1: next() called when req.session.accessToken is present');
  assert(res.statusCode === null, 'T4.1: no redirect issued');
});

test('T4.2 auth-guard-rejects-request-with-only-session-token-field', () => {
  // req.session.token is the WRONG field; req.session.accessToken is the canonical field.
  // A session with only req.session.token must be rejected (CLAUDE.md canonical field rule).
  const req = mockReq({ session: { token: 'some-token' } });  // wrong field
  const res = mockRes();
  let nextCalled = false;

  authGuard(req, res, () => { nextCalled = true; });

  assert(!nextCalled, 'T4.2: next() NOT called when only req.session.token is set');
  assert(res.statusCode === 302, 'T4.2: 302 redirect when only legacy field present');
  assert(res.headers.Location === '/', 'T4.2: redirect to /');
});

// ═══════════════════════════════════════════════════════════════════════════
// T5 — Default adapter stub throws (AC5)
// ═══════════════════════════════════════════════════════════════════════════

test('T5.1 default-provider-adapter-throws-on-exchange-code', async () => {
  // Get a FRESH require of oauth-adapter — before routes/auth.js's module-level
  // setProviderAdapter() runs — to test the throwing stub behaviour.
  const oauthPath = require.resolve('../src/web-ui/auth/oauth-adapter');
  delete require.cache[oauthPath];
  const freshOAuth = require('../src/web-ui/auth/oauth-adapter');
  // freshOAuth._providerAdapter is the throwing stub (auto-wire hasn't run yet
  // because routes/auth.js is still the cached copy that holds a reference to
  // the OLD module instance).

  let threw = false;
  let errorMsg = '';
  try {
    await freshOAuth.providerExchangeCode('test-code');
  } catch (e) {
    threw = true;
    errorMsg = e.message;
  }

  assert(threw, 'T5.1: providerExchangeCode throws on fresh module (stub not wired)');
  assert(errorMsg.includes('Adapter not wired'), 'T5.1: error message contains "Adapter not wired"');
  assert(errorMsg.includes('providerAdapter'), 'T5.1: error message names the adapter');

  // Clean up: remove fresh module from cache (the cached routes/auth.js still holds
  // the real-wired instance of oauth-adapter)
  delete require.cache[oauthPath];
});

test('T5.2 default-provider-adapter-throws-on-get-user-identity', async () => {
  const oauthPath = require.resolve('../src/web-ui/auth/oauth-adapter');
  delete require.cache[oauthPath];
  const freshOAuth = require('../src/web-ui/auth/oauth-adapter');

  let threw = false;
  let errorMsg = '';
  try {
    await freshOAuth.providerGetUserIdentity('test-token');
  } catch (e) {
    threw = true;
    errorMsg = e.message;
  }

  assert(threw, 'T5.2: providerGetUserIdentity throws on fresh module (stub not wired)');
  assert(errorMsg.includes('Adapter not wired'), 'T5.2: error message contains "Adapter not wired"');

  delete require.cache[oauthPath];
});

// ═══════════════════════════════════════════════════════════════════════════
// T6 — Production wiring in server.js (AC6)
// ═══════════════════════════════════════════════════════════════════════════

test('T6.1 server-js-calls-set-provider-adapter-on-startup', () => {
  // Verify server.js source contains the explicit wiring call and the startup log.
  const serverSource = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');

  assert(serverSource.includes('setProviderAdapter(gitHubProviderAdapter)'),
    'T6.1: server.js calls setProviderAdapter(gitHubProviderAdapter)');
  assert(serverSource.includes('provider registry initialised'),
    'T6.1: server.js logs "provider registry initialised" on startup');
});

// ═══════════════════════════════════════════════════════════════════════════
// NFR1 — accessToken not written to Redis
// ═══════════════════════════════════════════════════════════════════════════

test('NFR1 access-token-not-written-to-redis', () => {
  const sanitised = _sanitiseForRedis({ accessToken: 'secret-token', userId: '123', tenantId: 't1' });

  assert(!('accessToken' in sanitised),
    'NFR1: _sanitiseForRedis removes accessToken field');
  assert(sanitised.userId === '123',
    'NFR1: _sanitiseForRedis preserves userId');
  assert(sanitised.tenantId === 't1',
    'NFR1: _sanitiseForRedis preserves tenantId');
});

// ═══════════════════════════════════════════════════════════════════════════
// Runner
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n[lab-s1.3-provider-registry] Running 11 AC verification tests...\n');

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

  console.log(`\n[lab-s1.3-provider-registry] ${passed} passed, ${failed} failed`);

  if (failed > 0) process.exit(1);
}

main();
