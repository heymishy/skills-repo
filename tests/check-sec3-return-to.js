'use strict';

// check-sec3-return-to.js
// Verifies AC3: the returnTo check in handleAuthCallback uses startsWith
// string methods (not regex) and blocks //evil.com protocol-relative redirects.
//
// Run: node tests/check-sec3-return-to.js

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fakeRes() {
  var r = { _status: null, _location: null, _body: '' };
  r.writeHead = function(s, h) { r._status = s; if (h && h.Location) r._location = h.Location; };
  r.end = function(b) { r._body = b || ''; };
  return r;
}

function makeReq(sessionReturnTo, code, state) {
  return {
    session:   { oauthState: state || 'state123', returnTo: sessionReturnTo },
    sessionId: 'sess-1',
    query:     { code: code || 'code1', state: state || 'state123' }
  };
}

// ── monkeypatch oauth-adapter (auth.js uses module reference, not destructuring) ──

process.env.GITHUB_CLIENT_ID     = 'test-cid';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';

var oauthAdapter = require('../src/web-ui/auth/oauth-adapter');
oauthAdapter.generateState        = function() { return 'state123'; };
oauthAdapter.validateOAuthState   = function(a, b) { return a === b; };
oauthAdapter.exchangeCodeForToken = function() { return Promise.resolve('tok'); };
oauthAdapter.storeTokenInSession  = function(req) { req.session.accessToken = 'tok'; };
oauthAdapter.getUserIdentity      = function() { return Promise.resolve({ id: 'u1', login: 'alice' }); };

var authRoute = require('../src/web-ui/routes/auth');
authRoute.setFetchOrgs(function() { return Promise.resolve([]); });
authRoute.setLogger({ info: function() {}, warn: function() {} });

delete process.env.TENANT_ORG_ALLOWLIST;

// ── AC3a: valid path like /dashboard is honoured ──────────────────────────────

console.log('\nAC3a — valid returnTo path is used');
(async function() {
  var req = makeReq('/dashboard');
  var res = fakeRes();
  await authRoute.handleAuthCallback(req, res);
  ok('redirect to /dashboard', res._location === '/dashboard');
  ok('status is 302', res._status === 302);
})().then(function() {

// ── AC3b: protocol-relative //evil.com is blocked → fall back to /dashboard ───

console.log('\nAC3b — //evil.com is blocked');
return (async function() {
  var req = makeReq('//evil.com/steal');
  var res = fakeRes();
  await authRoute.handleAuthCallback(req, res);
  ok('redirects to /dashboard not //evil.com', res._location === '/dashboard');
  ok('status is 302', res._status === 302);
})();

}).then(function() {

// ── AC3c: http://evil.com is blocked ─────────────────────────────────────────

console.log('\nAC3c — http://evil.com is blocked');
return (async function() {
  var req = makeReq('http://evil.com/steal');
  var res = fakeRes();
  await authRoute.handleAuthCallback(req, res);
  ok('redirects to /dashboard not http://evil.com', res._location === '/dashboard');
})();

}).then(function() {

// ── AC3d: absolute path /journey/foo is honoured ─────────────────────────────

console.log('\nAC3d — /journey/foo absolute path honoured');
return (async function() {
  var req = makeReq('/journey/my-feature');
  var res = fakeRes();
  await authRoute.handleAuthCallback(req, res);
  ok('redirect to /journey/my-feature', res._location === '/journey/my-feature');
})();

}).then(function() {

// ── AC3e: undefined/null returnTo falls back to /dashboard ───────────────────

console.log('\nAC3e — undefined returnTo falls back to /dashboard');
return (async function() {
  var req = makeReq(undefined);
  var res = fakeRes();
  await authRoute.handleAuthCallback(req, res);
  ok('undefined returnTo → /dashboard', res._location === '/dashboard');
})();

}).then(function() {

// ── AC3f: source uses startsWith not regex ────────────────────────────────────

console.log('\nAC3f — source uses startsWith not /^\\//.test');
(function() {
  var fs   = require('fs');
  var path = require('path');
  var src  = fs.readFileSync(path.join(__dirname, '../src/web-ui/routes/auth.js'), 'utf8');
  ok('source uses startsWith(\'/\')', src.includes("startsWith('/')") || src.includes('startsWith("/")'));
  ok("source uses !startsWith('//')", src.includes("startsWith('//')"));
  ok('source does not use /^\\//.test', !src.includes('/^\\//.test'));
})();

}).then(function() {
  console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
  process.exit(failed > 0 ? 1 : 0);
});
