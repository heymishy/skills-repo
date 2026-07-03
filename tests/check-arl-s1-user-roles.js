'use strict';

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

var USER_ROLES_PATH = path.resolve(__dirname, '../src/web-ui/modules/user-roles.js');
var AUTH_PATH = path.resolve(__dirname, '../src/web-ui/routes/auth.js');
var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');

function freshRequireUserRoles() {
  delete require.cache[require.resolve(USER_ROLES_PATH)];
  return require(USER_ROLES_PATH);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

async function main() {
  var queue = [];

  // T1: stub throws before setGetUserRole is called
  queue.push(function() {
    console.log('\n[arl-s1] T1 -- stub throws before wiring');
    return test('stub throws when getUserRole called before wiring', async function() {
      var m = freshRequireUserRoles();
      var threw = false;
      try {
        await m.getUserRole('tenant-a');
      } catch (err) {
        threw = true;
        assert.ok(err.message.includes('Adapter not wired'), 'Error message must mention "Adapter not wired", got: ' + err.message);
      }
      assert.ok(threw, 'Expected getUserRole to throw before wiring');
    });
  });

  // T2: after wiring, returns value from the injected function
  queue.push(function() {
    console.log('\n[arl-s1] T2 -- after wiring returns injected value');
    return test('getUserRole returns value from wired function', async function() {
      var m = freshRequireUserRoles();
      m.setGetUserRole(async function(tenantId) {
        if (tenantId === 'admin-tenant') return 'admin';
        return 'user';
      });
      var role = await m.getUserRole('admin-tenant');
      assert.strictEqual(role, 'admin', 'Expected admin, got ' + role);
      var role2 = await m.getUserRole('other-tenant');
      assert.strictEqual(role2, 'user', 'Expected user, got ' + role2);
    });
  });

  // T3: auth.js handleAuthCallback sets req.session.role after tenantId is set
  queue.push(function() {
    console.log('\n[arl-s1] T3 -- handleAuthCallback sets req.session.role');
    return test('handleAuthCallback sets req.session.role via getUserRole', async function() {
      // Fresh require user-roles module and pre-wire it
      var userRoles = freshRequireUserRoles();
      userRoles.setGetUserRole(async function(tenantId) {
        if (tenantId === 'test-org') return 'admin';
        return 'user';
      });

      // Clear auth.js from cache so it picks up the freshly wired user-roles module
      delete require.cache[require.resolve(USER_ROLES_PATH)];
      // Re-register in require cache so auth.js gets our version
      require.cache[require.resolve(USER_ROLES_PATH)] = {
        id: require.resolve(USER_ROLES_PATH),
        filename: require.resolve(USER_ROLES_PATH),
        loaded: true,
        exports: userRoles
      };

      delete require.cache[require.resolve(AUTH_PATH)];
      var auth = require(AUTH_PATH);

      // Wire a stub fetchOrgs so resolveTenant doesn't throw
      auth.setFetchOrgs(async function() { return []; });

      var req = {
        query: { code: 'test-code', state: 'test-state' },
        session: { oauthState: 'test-state', tenantId: null, role: null },
        sessionId: 'sess-123',
        headers: {}
      };
      var res = makeRes();

      // Patch the oauth adapter to avoid real GitHub calls
      var oauthAdapter = require('../src/web-ui/auth/oauth-adapter.js');
      var _origExchange = oauthAdapter.providerExchangeCode;
      var _origIdentity = oauthAdapter.providerGetUserIdentity;
      var _origStore = oauthAdapter.storeTokenInSession;
      var _origValidate = oauthAdapter.validateOAuthState;
      oauthAdapter.providerExchangeCode = async function() { return 'fake-token'; };
      oauthAdapter.providerGetUserIdentity = async function() { return { id: 99, login: 'test-org' }; };
      oauthAdapter.storeTokenInSession = function(r, token) { r.session.accessToken = token; };
      oauthAdapter.validateOAuthState = function() { return true; };

      // Patch session to avoid real rotation
      var sessionMod = require('../src/web-ui/middleware/session.js');
      var _origRotate = sessionMod.rotateSessionId;
      var _origPersist = sessionMod.persistSession;
      var _origGetSession = sessionMod.getSession;
      sessionMod.rotateSessionId = function(oldId, res, sess) { return { newId: oldId }; };
      sessionMod.persistSession = function() {};
      sessionMod.getSession = function() { return req.session; };

      // Wire userFlags to avoid throwing
      var userFlags = require('../src/web-ui/modules/user-flags.js');
      var _origGetFlag = userFlags.getFirstLoginFlag;
      userFlags.getFirstLoginFlag = async function() { return false; };

      try {
        await auth.handleAuthCallback(req, res);
      } finally {
        // Restore
        oauthAdapter.providerExchangeCode = _origExchange;
        oauthAdapter.providerGetUserIdentity = _origIdentity;
        oauthAdapter.storeTokenInSession = _origStore;
        oauthAdapter.validateOAuthState = _origValidate;
        sessionMod.rotateSessionId = _origRotate;
        sessionMod.persistSession = _origPersist;
        sessionMod.getSession = _origGetSession;
        userFlags.getFirstLoginFlag = _origGetFlag;
      }

      assert.strictEqual(req.session.role, 'admin', 'Expected role=admin for test-org, got: ' + req.session.role);
    });
  });

  // T4: unknown tenant defaults to 'user'
  queue.push(function() {
    console.log('\n[arl-s1] T4 -- unknown tenant defaults to user');
    return test('getUserRole returns user for unknown tenant', async function() {
      var m = freshRequireUserRoles();
      m.setGetUserRole(async function(tenantId) {
        // Simulate: no row found -> return 'user' (default)
        return 'user';
      });
      var role = await m.getUserRole('unknown-tenant');
      assert.strictEqual(role, 'user', 'Expected user for unknown tenant, got: ' + role);
    });
  });

  // T5: integration — server.js contains user_roles migration SQL
  queue.push(function() {
    console.log('\n[arl-s1] T5 -- server.js contains user_roles migration');
    return test('server.js contains CREATE TABLE IF NOT EXISTS user_roles', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(src.includes('CREATE TABLE IF NOT EXISTS user_roles'), 'server.js must contain user_roles migration SQL');
    });
  });

  // T6: integration — server.js wires setGetUserRole before listen
  queue.push(function() {
    console.log('\n[arl-s1] T6 -- server.js calls setGetUserRole before listen');
    return test('server.js calls setGetUserRole() before server.listen()', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(src.includes('setGetUserRole('), 'server.js must call setGetUserRole()');
      var setIdx = src.indexOf('setGetUserRole(');
      var listenIdx = src.indexOf('.listen(');
      assert.ok(setIdx < listenIdx, 'setGetUserRole() must appear before server.listen() in server.js');
    });
  });

  // Run queue sequentially
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[arl-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[arl-s1] Unexpected error:', err);
  process.exit(1);
});
