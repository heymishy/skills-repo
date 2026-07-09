'use strict';
// check-arl-s4-admin-billing-bypass.js — AC verification for arl-s4
// (admin role bypasses the /welcome plan-selection/billing gate on GitHub OAuth login)
//
// Root-cause fix under test: GitHub OAuth first-login state used to be looked up in the
// `users` table (email/password signup only), which never contains a GitHub numeric id —
// so every GitHub login was treated as first-login forever. Fix: a dedicated
// github_first_login table, plus an explicit admin bypass so admins never see /welcome.

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV = 'test';

var assert = require('assert');
var path = require('path');
var fs = require('fs');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var ROOT = path.join(__dirname, '..');
var AUTH_PATH        = path.resolve(ROOT, 'src/web-ui/routes/auth.js');
var USER_ROLES_PATH  = path.resolve(ROOT, 'src/web-ui/modules/user-roles.js');
var USER_FLAGS_PATH  = path.resolve(ROOT, 'src/web-ui/modules/user-flags.js');
var OAUTH_ADAPTER_PATH = path.resolve(ROOT, 'src/web-ui/auth/oauth-adapter.js');
var SESSION_PATH      = path.resolve(ROOT, 'src/web-ui/middleware/session.js');
var SERVER_PATH       = path.resolve(ROOT, 'src/web-ui/server.js');

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

/**
 * Runs handleAuthCallback with a controlled role and a getFirstLoginFlag stub that
 * always returns true (would send a non-admin user to /welcome). Returns the response
 * and whether getFirstLoginFlag was invoked.
 */
async function runCallback(role) {
  delete require.cache[require.resolve(USER_ROLES_PATH)];
  var userRoles = require(USER_ROLES_PATH);
  userRoles.setGetUserRole(async function() { return role; });
  require.cache[require.resolve(USER_ROLES_PATH)] = {
    id: require.resolve(USER_ROLES_PATH), filename: require.resolve(USER_ROLES_PATH),
    loaded: true, exports: userRoles
  };

  delete require.cache[require.resolve(USER_FLAGS_PATH)];
  var userFlags = require(USER_FLAGS_PATH);
  var getFlagCalled = false;
  userFlags.setUserFlagsAdapter({
    getFirstLoginFlag: async function() { getFlagCalled = true; return true; },
    clearFirstLoginFlag: async function() {}
  });
  require.cache[require.resolve(USER_FLAGS_PATH)] = {
    id: require.resolve(USER_FLAGS_PATH), filename: require.resolve(USER_FLAGS_PATH),
    loaded: true, exports: userFlags
  };

  delete require.cache[require.resolve(AUTH_PATH)];
  var auth = require(AUTH_PATH);
  auth.setFetchOrgs(async function() { return []; });

  var oauthAdapter = require(OAUTH_ADAPTER_PATH);
  var saved = {
    validateOAuthState: oauthAdapter.validateOAuthState,
    providerExchangeCode: oauthAdapter.providerExchangeCode,
    providerGetUserIdentity: oauthAdapter.providerGetUserIdentity,
    storeTokenInSession: oauthAdapter.storeTokenInSession
  };
  oauthAdapter.validateOAuthState = function() { return true; };
  oauthAdapter.providerExchangeCode = async function() { return 'test-token'; };
  oauthAdapter.providerGetUserIdentity = async function() { return { id: 12345, login: 'testadmin' }; };
  oauthAdapter.storeTokenInSession = function(req, token) { req.session.accessToken = token; };

  var sessionMod = require(SESSION_PATH);
  var newSession = { accessToken: 'test-token', userId: 12345, login: 'testadmin' };
  var savedSession = {
    persistSession: sessionMod.persistSession,
    rotateSessionId: sessionMod.rotateSessionId,
    getSession: sessionMod.getSession
  };
  sessionMod.persistSession = function() {};
  sessionMod.rotateSessionId = function() { return { newId: 'new-sess-arl-s4' }; };
  sessionMod.getSession = function() { return newSession; };

  delete require.cache[require.resolve(AUTH_PATH)];
  auth = require(AUTH_PATH);
  auth.setFetchOrgs(async function() { return []; });

  var req = {
    session: { oauthState: 'csrf-state', returnTo: undefined, accessToken: undefined },
    query: { code: 'oauth-code', state: 'csrf-state' },
    sessionId: 'sess-test-arl-s4',
    headers: {}
  };
  var res = makeRes();

  try {
    await auth.handleAuthCallback(req, res);
    await new Promise(function(r) { setTimeout(r, 10); });
  } finally {
    oauthAdapter.validateOAuthState = saved.validateOAuthState;
    oauthAdapter.providerExchangeCode = saved.providerExchangeCode;
    oauthAdapter.providerGetUserIdentity = saved.providerGetUserIdentity;
    oauthAdapter.storeTokenInSession = saved.storeTokenInSession;
    sessionMod.persistSession = savedSession.persistSession;
    sessionMod.rotateSessionId = savedSession.rotateSessionId;
    sessionMod.getSession = savedSession.getSession;
    delete require.cache[require.resolve(AUTH_PATH)];
  }

  return { res: res, newSession: newSession, getFlagCalled: getFlagCalled };
}

async function main() {
  console.log('\n[arl-s4] T1 -- admin role bypasses /welcome even when getFirstLoginFlag would return true');
  await test('admin login redirects to dashboard, not /welcome', async function() {
    var r = await runCallback('admin');
    assert.strictEqual(r.res._status, 302, 'Expected 302, got ' + r.res._status);
    assert.strictEqual(r.res._headers['Location'], '/dashboard', 'Expected /dashboard, got ' + r.res._headers['Location']);
    assert.strictEqual(r.getFlagCalled, false, 'getFirstLoginFlag must not be called for admin role');
    assert.strictEqual(r.newSession.firstLogin, undefined, 'firstLogin must not be set on session for admin');
  });

  console.log('\n[arl-s4] T2 -- non-admin role still uses getFirstLoginFlag (regression check)');
  await test('non-admin login still redirects to /welcome on first login', async function() {
    var r = await runCallback('user');
    assert.strictEqual(r.res._status, 302, 'Expected 302, got ' + r.res._status);
    assert.strictEqual(r.res._headers['Location'], '/welcome', 'Expected /welcome, got ' + r.res._headers['Location']);
    assert.strictEqual(r.getFlagCalled, true, 'getFirstLoginFlag must be called for non-admin role');
  });

  console.log('\n[arl-s4] T3 -- server.js tracks GitHub first-login state in its own table, not `users`');
  await test('server.js queries github_first_login keyed by github_user_id', function() {
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    assert.ok(src.includes('CREATE TABLE IF NOT EXISTS github_first_login'), 'server.js must migrate github_first_login table');
    assert.ok(src.includes('FROM github_first_login WHERE github_user_id'), 'getFirstLoginFlag must query github_first_login by github_user_id');
    assert.ok(!src.includes('SELECT first_login FROM users WHERE id'), 'getFirstLoginFlag must no longer query the users table (root-cause bug)');
  });

  console.log('\n[arl-s4] T4 -- server.js seeds admin role from ADMIN_GITHUB_LOGINS');
  await test('server.js upserts user_roles admin role from ADMIN_GITHUB_LOGINS', function() {
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    assert.ok(src.includes('ADMIN_GITHUB_LOGINS'), 'server.js must read ADMIN_GITHUB_LOGINS env var');
    assert.ok(src.includes("ON CONFLICT (tenant_id) DO UPDATE SET role = 'admin'"), 'server.js must upsert admin role into user_roles');
  });

  console.log('\n[arl-s4] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[arl-s4] Unexpected error:', err);
  process.exit(1);
});
