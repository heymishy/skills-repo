'use strict';

// tests/check-srf-s1-session-redis-fallback.js — srf-s1
//
// Unit + integration tests for srf-s1 (session middleware falls back to
// Redis on an in-memory cache miss). Covers AC1-AC5 from
// artefacts/2026-07-22-session-redis-fallback/test-plans/srf-s1-test-plan.md.
//
// Mirrors this repo's own hand-rolled test()/assert style and the existing
// stub-Redis-adapter convention from tests/check-p3.2-redis-session-adapter.js
// -- no Jest/Mocha, no real Upstash connection.

var assert = require('assert');
var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var SESSION_PATH = path.resolve(__dirname, '../src/web-ui/middleware/session.js');
var AUTH_PATH = path.resolve(__dirname, '../src/web-ui/routes/auth.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function makeStubRedisAdapter(initialStore) {
  var store = initialStore || {};
  return {
    _store: store,
    _readCount: 0,
    writeSession: async function(id, data) { store[id] = data; },
    deleteSession: async function(id) { delete store[id]; },
    loadAllSessions: async function() {
      return Object.keys(store).map(function(id) { return { id: id, data: store[id] }; });
    },
    readSession: async function(id) {
      this._readCount++;
      return store.hasOwnProperty(id) ? store[id] : null;
    }
  };
}

function makeReq(cookieValue) {
  return { headers: cookieValue ? { cookie: 'session_id=' + cookieValue } : {} };
}

function makeRes() {
  var r = { _headers: {} };
  r.setHeader = function(k, v) { r._headers[k] = v; };
  return r;
}

(async function() {
  var sessionModule = freshRequire(SESSION_PATH);

  // ===========================================================================
  // AC1 -- Redis fallback rehydrates a session on in-memory cache miss
  // ===========================================================================
  await test('sessionMiddleware rehydrates a session from Redis on an in-memory cache miss, no new Set-Cookie (AC1)', async function() {
    sessionModule._clearForTesting();
    var stub = makeStubRedisAdapter({ 'aaaa1111': { login: 'octocat', userId: 42 } });
    sessionModule.setRedisAdapterForTesting(stub);

    var req = makeReq('aaaa1111');
    var res = makeRes();
    await sessionModule.sessionMiddleware(req, res);

    assert.strictEqual(req.sessionId, 'aaaa1111');
    assert.deepStrictEqual(req.session, { login: 'octocat', userId: 42 });
    assert.strictEqual(res._headers['Set-Cookie'], undefined, 'no new Set-Cookie should be sent for a rehydrated session');
    sessionModule.setRedisAdapterForTesting(null);
  });

  await test('the rehydrated session is written back into the in-memory Map (AC1)', async function() {
    sessionModule._clearForTesting();
    var stub = makeStubRedisAdapter({ 'bbbb2222': { login: 'hubot' } });
    sessionModule.setRedisAdapterForTesting(stub);

    var req = makeReq('bbbb2222');
    var res = makeRes();
    await sessionModule.sessionMiddleware(req, res);

    var again = sessionModule.getSession('bbbb2222');
    assert.deepStrictEqual(again, { login: 'hubot' });
    sessionModule.setRedisAdapterForTesting(null);
  });

  // ===========================================================================
  // AC2 -- genuine double-miss still creates a new session
  // ===========================================================================
  await test('a cookie session absent from both memory and Redis creates a new session (AC2)', async function() {
    sessionModule._clearForTesting();
    var stub = makeStubRedisAdapter({});
    sessionModule.setRedisAdapterForTesting(stub);

    var req = makeReq('cccc3333');
    var res = makeRes();
    await sessionModule.sessionMiddleware(req, res);

    assert.notStrictEqual(req.sessionId, 'cccc3333', 'expected a fresh session id, not the stale cookie value');
    assert.ok(res._headers['Set-Cookie'], 'expected a new Set-Cookie header');
    sessionModule.setRedisAdapterForTesting(null);
  });

  await test('no cookie at all creates a new session without attempting a Redis read (AC2)', async function() {
    sessionModule._clearForTesting();
    var stub = makeStubRedisAdapter({});
    sessionModule.setRedisAdapterForTesting(stub);

    var req = makeReq(null);
    var res = makeRes();
    await sessionModule.sessionMiddleware(req, res);

    assert.ok(res._headers['Set-Cookie'], 'expected a new Set-Cookie header');
    assert.strictEqual(stub._readCount, 0, 'expected zero Redis reads for a request with no cookie');
    sessionModule.setRedisAdapterForTesting(null);
  });

  // ===========================================================================
  // AC4 -- accessToken is honestly absent (not fabricated) after rehydration
  // ===========================================================================
  await test('accessToken is absent after rehydration, matching real _sanitise stripping (AC4)', async function() {
    sessionModule._clearForTesting();
    var stub = makeStubRedisAdapter({ 'dddd4444': { login: 'octocat', userId: 42 } });
    sessionModule.setRedisAdapterForTesting(stub);

    var req = makeReq('dddd4444');
    var res = makeRes();
    await sessionModule.sessionMiddleware(req, res);

    assert.strictEqual(req.session.accessToken, undefined);
    assert.strictEqual(req.session.login, 'octocat');
    assert.strictEqual(req.session.userId, 42);
    sessionModule.setRedisAdapterForTesting(null);
  });

  // ===========================================================================
  // AC5 -- no Redis configured, cache miss falls straight through
  // ===========================================================================
  await test('with no Redis adapter configured, a cache miss falls straight through to a new session (AC5)', async function() {
    sessionModule._clearForTesting();
    sessionModule.setRedisAdapterForTesting(null);

    var req = makeReq('eeee5555');
    var res = makeRes();
    var threw = false;
    try {
      await sessionModule.sessionMiddleware(req, res);
    } catch (e) {
      threw = true;
    }
    assert.strictEqual(threw, false, 'expected no error when Redis is not configured');
    assert.ok(req.session, 'expected a session to be created');
    assert.ok(res._headers['Set-Cookie']);
  });

  // ===========================================================================
  // AC3 (integration) -- real OAuth callback survives a simulated mid-flow process replacement
  // ===========================================================================
  await test('handleAuthCallback does not return 403 after the in-memory session is cleared but Redis retains it (AC3)', async function() {
    sessionModule._clearForTesting();
    var stub = makeStubRedisAdapter({});
    sessionModule.setRedisAdapterForTesting(stub);

    process.env.GITHUB_CLIENT_ID = 'test-cid';
    process.env.GITHUB_CLIENT_SECRET = 'test-secret';
    process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/auth/github/callback';
    delete process.env.TENANT_ORG_ALLOWLIST;

    var authRoute = freshRequire(AUTH_PATH);
    authRoute.setLogger({ info: function() {}, warn: function() {} });
    authRoute.setFetchOrgs(function() { return Promise.resolve([]); });

    // Mirrors this repo's own established convention (check-sec5-session-rotation.js)
    // of monkeypatching the required oauth-adapter module directly -- matching the
    // REAL method names auth.js actually calls (providerExchangeCode/
    // providerGetUserIdentity via the provider registry, lab-s1.3), not the older,
    // stale names that test file's own known-baseline-failing mock still uses.
    var oauthAdapter = require('../src/web-ui/auth/oauth-adapter');
    oauthAdapter.validateOAuthState = function(a, b) { return !!a && a === b; };
    oauthAdapter.providerExchangeCode = function() { return Promise.resolve('fake-access-token'); };
    oauthAdapter.storeTokenInSession = function(req, token) { req.session.accessToken = token; };
    oauthAdapter.providerGetUserIdentity = function() { return Promise.resolve({ id: 42, login: 'octocat' }); };

    // Step 1: GET /auth/github -- writes oauthState, persists to Redis stub.
    var loginReq = {};
    var loginRes = { writeHead: function() {}, end: function() {} };
    await sessionModule.sessionMiddleware(loginReq, loginRes);
    await authRoute.handleAuthGithub(loginReq, loginRes);
    var issuedSessionId = loginReq.sessionId;
    var issuedState = loginReq.session.oauthState;

    assert.ok(stub._store[issuedSessionId], 'expected the pre-login session to have been persisted to the stub Redis store');
    assert.strictEqual(stub._store[issuedSessionId].oauthState, issuedState);

    // Step 2: simulate a process replacement (a redeploy) -- in-memory Map wiped, Redis untouched.
    sessionModule._clearForTesting();

    // Step 3: the callback request re-attaches the same cookie.
    var callbackReq = makeReq(issuedSessionId);
    callbackReq.query = { code: 'fake-code', state: issuedState };
    var callbackRes = { _status: null, writeHead: function(s) { this._status = s; }, end: function() {} };
    await sessionModule.sessionMiddleware(callbackReq, callbackRes);
    await authRoute.handleAuthCallback(callbackReq, callbackRes);

    assert.notStrictEqual(callbackRes._status, 403, 'expected no false-positive Forbidden after the simulated process replacement');
    sessionModule.setRedisAdapterForTesting(null);
  });

  console.log('\n[srf-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
