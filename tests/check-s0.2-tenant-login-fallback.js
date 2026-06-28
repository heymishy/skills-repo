'use strict';

// check-s0.2-tenant-login-fallback.js
// Verifies s0.2: when TENANT_ORG_ALLOWLIST is absent, the OAuth callback sets
// session.tenantId = user.login, giving each GitHub user their own isolated tenant.
// When TENANT_ORG_ALLOWLIST is set, existing org-based tenant assignment is unaffected.
//
// Run: node tests/check-s0.2-tenant-login-fallback.js

var assert = require('assert');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

// ── isolate module under test ─────────────────────────────────────────────────

// Clear require cache to ensure clean state with env var changes
Object.keys(require.cache).forEach(function(k) {
  if (k.indexOf('routes/auth') !== -1 || k.indexOf('auth/oauth-adapter') !== -1) {
    delete require.cache[k];
  }
});

var auth = require('../src/web-ui/routes/auth');

// Stub logger
auth.setLogger({ info: function() {}, warn: function() {} });

// Stub fetchOrgs (not needed for no-allowlist path)
auth.setFetchOrgs(function() { return []; });

// Minimal OAuth adapter stubs injected via module patching:
// exchangeCodeForToken and getUserIdentity are module-internal — test via handleAuthCallback

function fakeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body = b || ''; };
  return r;
}

function fakeReq(sessionState) {
  var session = { oauthState: 'state123' };
  Object.assign(session, sessionState || {});
  return { session: session, sessionId: 'sess-test', query: { code: 'fake-code', state: 'state123' } };
}

// ── AC1: no allowlist → tenantId = user.login ─────────────────────────────────

console.log('\nAC1 — no TENANT_ORG_ALLOWLIST: tenantId set to user.login');
(async function() {
  delete process.env.TENANT_ORG_ALLOWLIST;

  // Patch module internals via re-wire: we need exchangeCodeForToken and getUserIdentity
  // to return controlled values. Approach: override via the auth module's closure by
  // requiring the oauth-adapter and wrapping at the module level.
  var oauthAdapter = require('../src/web-ui/auth/oauth-adapter');
  var _origExchange = oauthAdapter.exchangeCodeForToken;
  var _origGetUser  = oauthAdapter.getUserIdentity;

  // Monkeypatch — restore after test
  oauthAdapter.exchangeCodeForToken = async function() { return 'fake-token'; };
  oauthAdapter.getUserIdentity      = async function() { return { id: 42, login: 'hamish-test' }; };

  var req = fakeReq();
  var res = fakeRes();
  await auth.handleAuthCallback(req, res);

  ok('session.tenantId equals user.login', req.session.tenantId === 'hamish-test');
  ok('session.login equals user.login',    req.session.login    === 'hamish-test');
  ok('redirect to /dashboard',             res._status === 302 && res._headers['Location'] === '/dashboard');

  oauthAdapter.exchangeCodeForToken = _origExchange;
  oauthAdapter.getUserIdentity      = _origGetUser;
})().then(function() {

// ── AC2: allowlist set + user in org → tenantId = org slug (unchanged) ────────

console.log('\nAC2 — TENANT_ORG_ALLOWLIST set: tenantId = org login, not user login');
return (async function() {
  process.env.TENANT_ORG_ALLOWLIST = 'myorg,otherapg';

  var oauthAdapter = require('../src/web-ui/auth/oauth-adapter');
  var _origExchange = oauthAdapter.exchangeCodeForToken;
  var _origGetUser  = oauthAdapter.getUserIdentity;

  oauthAdapter.exchangeCodeForToken = async function() { return 'fake-token-2'; };
  oauthAdapter.getUserIdentity      = async function() { return { id: 99, login: 'hamish-test' }; };
  // fetchOrgs returns the user's org — matches 'myorg' in the allowlist
  auth.setFetchOrgs(async function() { return [{ login: 'myorg' }]; });

  var req = fakeReq();
  var res = fakeRes();
  await auth.handleAuthCallback(req, res);

  ok('session.tenantId equals org slug, not user.login', req.session.tenantId === 'myorg');
  ok('redirect to /dashboard',                           res._status === 302);

  oauthAdapter.exchangeCodeForToken = _origExchange;
  oauthAdapter.getUserIdentity      = _origGetUser;
  delete process.env.TENANT_ORG_ALLOWLIST;
  auth.setFetchOrgs(function() { return []; });
})();

}).then(function() {

// ── AC3: allowlist set + user NOT in org → 403 (unchanged behaviour) ──────────

console.log('\nAC3 — TENANT_ORG_ALLOWLIST set + user not in org → 403');
return (async function() {
  process.env.TENANT_ORG_ALLOWLIST = 'restricted-org';

  var oauthAdapter = require('../src/web-ui/auth/oauth-adapter');
  var _origExchange = oauthAdapter.exchangeCodeForToken;
  var _origGetUser  = oauthAdapter.getUserIdentity;

  oauthAdapter.exchangeCodeForToken = async function() { return 'fake-token-3'; };
  oauthAdapter.getUserIdentity      = async function() { return { id: 77, login: 'outsider' }; };
  auth.setFetchOrgs(async function() { return [{ login: 'some-other-org' }]; });

  var req = fakeReq();
  var res = fakeRes();
  await auth.handleAuthCallback(req, res);

  ok('non-member blocked with 403', res._status === 403);
  ok('session.tenantId not set',    req.session.tenantId == null);

  oauthAdapter.exchangeCodeForToken = _origExchange;
  oauthAdapter.getUserIdentity      = _origGetUser;
  delete process.env.TENANT_ORG_ALLOWLIST;
  auth.setFetchOrgs(function() { return []; });
})();

}).then(finish).catch(function(err) {
  console.error('Unexpected error:', err);
  failed++;
  finish();
});

function finish() {
  console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
  process.exit(failed > 0 ? 1 : 0);
}
