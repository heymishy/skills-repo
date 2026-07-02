'use strict';

// check-sec5-session-rotation.js
// Verifies AC5: rotateSessionId is added to session.js and called in
// handleAuthCallback after successful token exchange, preventing session
// fixation attacks.
//
// Run: node tests/check-sec5-session-rotation.js

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fakeRes() {
  var r = { _status: null, _location: null, _body: '', _headers: {} };
  r.writeHead = function(s, h) { r._status = s; if (h && h.Location) r._location = h.Location; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body = b || ''; };
  r.setHeader = function(k, v) { r._headers[k] = v; };
  return r;
}

// ── AC5a: rotateSessionId is exported from session.js ─────────────────────────

console.log('\nAC5a — rotateSessionId exported from session.js');
var sessionModule = require('../src/web-ui/middleware/session');
ok('rotateSessionId is a function', typeof sessionModule.rotateSessionId === 'function');

// ── AC5b: rotateSessionId creates new session, copies data, deletes old ───────

console.log('\nAC5b — rotateSessionId: new ID created, data copied, old deleted');
(function() {
  sessionModule._clearForTesting();

  // Create old session with pre-login data
  var created = sessionModule.createSession();
  var oldId   = created.id;
  var oldSess = created.session;
  oldSess.oauthState = 'csrf123';
  oldSess.returnTo   = '/journey/my-feature';

  var res = fakeRes();
  var result = sessionModule.rotateSessionId(oldId, res);

  ok('returns newId', typeof result.newId === 'string' && result.newId.length > 0);
  ok('newId differs from oldId', result.newId !== oldId);

  // Old session must be gone
  var oldLookup = sessionModule.getSession(oldId);
  ok('old session deleted from memory', oldLookup === null);

  // New session must exist and have copied data
  var newSess = sessionModule.getSession(result.newId);
  ok('new session exists', newSess !== null);
  ok('oauthState copied to new session', newSess && newSess.oauthState === 'csrf123');
  ok('returnTo copied to new session', newSess && newSess.returnTo === '/journey/my-feature');
})();

// ── AC5c: rotateSessionId sets Set-Cookie header with new ID ──────────────────

console.log('\nAC5c — rotateSessionId sets Set-Cookie with new session ID');
(function() {
  sessionModule._clearForTesting();

  var created = sessionModule.createSession();
  var res     = fakeRes();
  var result  = sessionModule.rotateSessionId(created.id, res);

  var cookie = res._headers['Set-Cookie'] || '';
  ok('Set-Cookie header set', cookie.length > 0);
  ok('cookie contains new session ID', cookie.includes(result.newId));
  ok('cookie is HttpOnly', cookie.toLowerCase().includes('httponly'));
})();

// ── AC5d: handleAuthCallback calls rotateSessionId after token exchange ────────

console.log('\nAC5d — handleAuthCallback uses new session ID after rotation');
(async function() {
  sessionModule._clearForTesting();

  // Seed a pre-login session (simulating what sessionMiddleware sets before login)
  var preLoginId = sessionModule.createSession().id;
  var preLoginSess = sessionModule.getSession(preLoginId);
  preLoginSess.oauthState = 'state-abc';

  // Monkeypatch oauth-adapter
  process.env.GITHUB_CLIENT_ID     = 'test-cid';
  process.env.GITHUB_CLIENT_SECRET = 'test-secret';
  process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';

  var oauthAdapter = require('../src/web-ui/auth/oauth-adapter');
  oauthAdapter.validateOAuthState   = function(a, b) { return a === b; };
  oauthAdapter.exchangeCodeForToken = function() { return Promise.resolve('tok'); };
  oauthAdapter.storeTokenInSession  = function(req) { req.session.accessToken = 'tok'; };
  oauthAdapter.getUserIdentity      = function() { return Promise.resolve({ id: 'u99', login: 'carol' }); };

  var authRoute = require('../src/web-ui/routes/auth');
  authRoute.setFetchOrgs(function() { return Promise.resolve([]); });
  authRoute.setLogger({ info: function() {}, warn: function() {} });
  delete process.env.TENANT_ORG_ALLOWLIST;

  var req = {
    session:   preLoginSess,
    sessionId: preLoginId,
    query:     { code: 'code1', state: 'state-abc' }
  };
  var res = fakeRes();
  await authRoute.handleAuthCallback(req, res);

  ok('response is 302 redirect', res._status === 302);
  ok('redirects to /dashboard', res._location === '/dashboard');

  // Pre-login session ID must no longer exist
  var oldLookup = sessionModule.getSession(preLoginId);
  ok('pre-login session deleted after rotation', oldLookup === null);

  // req.sessionId must have been updated to the new ID
  ok('req.sessionId updated to new ID', req.sessionId !== preLoginId);

  // New session must carry the user identity
  var newSess = sessionModule.getSession(req.sessionId);
  ok('new session has login', newSess && newSess.login === 'carol');
  ok('new session has accessToken', newSess && newSess.accessToken === 'tok');

  // Cookie must carry the new ID
  var cookie = res._headers['Set-Cookie'] || '';
  ok('Set-Cookie header contains new session ID', cookie.includes(req.sessionId));
})().then(function() {

// ── AC5e: Redis deleteSession called for old ID ───────────────────────────────

console.log('\nAC5e — rotateSessionId calls Redis deleteSession for old session');
(function() {
  sessionModule._clearForTesting();

  var deletedIds = [];
  var fakeRedis = {
    writeSession:    function() { return Promise.resolve(); },
    deleteSession:   function(id) { deletedIds.push(id); return Promise.resolve(); },
    loadAllSessions: function() { return Promise.resolve([]); }
  };
  sessionModule.setRedisAdapterForTesting(fakeRedis);

  var created = sessionModule.createSession();
  var oldId   = created.id;
  var res     = fakeRes();
  sessionModule.rotateSessionId(oldId, res);

  ok('Redis deleteSession called with old session ID', deletedIds.includes(oldId));

  // Reset
  sessionModule.setRedisAdapterForTesting(null);
})();

}).then(function() {
  console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
  process.exit(failed > 0 ? 1 : 0);
});
