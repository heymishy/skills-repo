'use strict';

// check-tir-s1-person-team-schema.js — tir-s1
// Verifies the people/team_memberships schema migration + backfill, the new
// person/team-scoped D37 adapter (getRoleForTenant/setGetRoleForTenant), the
// login call-site rewiring in auth.js/auth-email.js, and the AC6 production
// wiring in server.js. Follows this repo's hand-rolled test()/assert style
// (see tests/check-arl-s1-user-roles.js) — no Jest/Mocha.

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
var AUTH_EMAIL_PATH = path.resolve(__dirname, '../src/web-ui/routes/auth-email.js');
var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

// ── In-memory fake pool ──────────────────────────────────────────────────────
// Narrow, self-contained fake — supports exactly the query shapes migrateTeamSchema
// and resolveRoleForTenant issue against user_roles / people / team_memberships.
// Not a general SQL engine (mirrors src/web-ui/adapters/fake-test-db.js's own
// documented convention of narrow, explicit branches rather than a generic engine).
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakePool(seedUserRoles) {
  var userRoles = (seedUserRoles || []).slice();
  var people = [];
  var nextPersonId = 1;
  var teamMemberships = [];
  var createTableCalls = [];

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('CREATE TABLE IF NOT EXISTS') === 0) {
      createTableCalls.push(s);
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('SELECT TENANT_ID, ROLE FROM USER_ROLES') === 0) {
      return Promise.resolve({ rows: userRoles.map(function(r) { return { tenant_id: r.tenant_id, role: r.role }; }) });
    }

    if (s.indexOf('SELECT ROLE FROM USER_ROLES WHERE TENANT_ID') === 0) {
      var legacyTenantId = p[0];
      var legacyMatch = userRoles.filter(function(r) { return r.tenant_id === legacyTenantId; });
      return Promise.resolve({ rows: legacyMatch.map(function(r) { return { role: r.role }; }) });
    }

    if (s.indexOf('SELECT 1 FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var checkTenantId = p[0];
      var exists = teamMemberships.some(function(r) { return r.tenant_id === checkTenantId; });
      return Promise.resolve({ rows: exists ? [{ '?column?': 1 }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var lookupTenantId = p[0];
      var match = teamMemberships.filter(function(r) { return r.tenant_id === lookupTenantId; });
      return Promise.resolve({ rows: match.length ? [{ role: match[0].role }] : [] });
    }

    if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) {
      var person = { id: nextPersonId++ };
      people.push(person);
      return Promise.resolve({ rows: [{ id: person.id }] });
    }

    if (s.indexOf('INSERT INTO TEAM_MEMBERSHIPS') === 0) {
      var personId = p[0];
      var tenantId = p[1];
      var role = p[2];
      var dup = teamMemberships.some(function(r) { return r.person_id === personId && r.tenant_id === tenantId; });
      if (!dup) {
        teamMemberships.push({ person_id: personId, tenant_id: tenantId, role: role, created_at: new Date().toISOString() });
      }
      return Promise.resolve({ rows: [] });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 120));
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _state: function() { return { people: people, teamMemberships: teamMemberships, createTableCalls: createTableCalls }; }
  };
}

async function main() {
  var queue = [];

  // ── Unit: AC1 — migration bootstrap creates the expected table shape ──────
  queue.push(function() {
    console.log('\n[tir-s1] T1 -- migration bootstrap creates expected table shape (AC1)');
    return test('migrateTeamSchema issues CREATE TABLE for people and team_memberships with the expected shape', async function() {
      var userRoles = freshRequire(USER_ROLES_PATH);
      var pool = makeFakePool([]);
      await userRoles.migrateTeamSchema(pool);
      var calls = pool._state().createTableCalls;
      var peopleCall = calls.find(function(c) { return c.indexOf('CREATE TABLE IF NOT EXISTS PEOPLE') === 0; });
      var membershipsCall = calls.find(function(c) { return c.indexOf('CREATE TABLE IF NOT EXISTS TEAM_MEMBERSHIPS') === 0; });
      assert.ok(peopleCall, 'Expected a CREATE TABLE IF NOT EXISTS people statement');
      assert.ok(membershipsCall, 'Expected a CREATE TABLE IF NOT EXISTS team_memberships statement');
      ['PERSON_ID', 'TENANT_ID', 'ROLE', 'CREATED_AT', 'PRIMARY KEY'].forEach(function(col) {
        assert.ok(membershipsCall.indexOf(col) !== -1, 'team_memberships shape must include ' + col + ', got: ' + membershipsCall);
      });
      assert.ok(membershipsCall.indexOf('(PERSON_ID, TENANT_ID)') !== -1, 'team_memberships PK must be (person_id, tenant_id), got: ' + membershipsCall);

      // Second call against the same empty pool state must not throw.
      await userRoles.migrateTeamSchema(pool);
    });
  });

  // ── Unit: AC6 — server.js wires the new person/team-scoped adapter ────────
  queue.push(function() {
    console.log('\n[tir-s1] T2 -- server.js wires getRoleForTenant as the real production implementation (AC6)');
    return test('server.js calls setGetRoleForTenant() wired to a team_memberships-based query, before listen()', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(src.indexOf('setGetRoleForTenant(') !== -1, 'server.js must call setGetRoleForTenant()');
      assert.ok(src.indexOf('resolveRoleForTenant') !== -1 || src.indexOf('team_memberships') !== -1,
        'server.js wiring must reference the team_memberships-based lookup (resolveRoleForTenant or team_memberships), not just the legacy query');
      assert.ok(src.indexOf('migrateTeamSchema') !== -1, 'server.js must call migrateTeamSchema() to bootstrap the new schema at startup');
      var setIdx = src.indexOf('setGetRoleForTenant(');
      var listenIdx = src.indexOf('.listen(');
      assert.ok(setIdx < listenIdx, 'setGetRoleForTenant() must appear before server.listen() in server.js');
      // Legacy adapter/table must still be present, unused-but-not-removed (Out of Scope).
      assert.ok(src.indexOf('setGetUserRole(') !== -1, 'legacy setGetUserRole() wiring must remain in place (Out of Scope: do not remove)');
      assert.ok(src.indexOf('CREATE TABLE IF NOT EXISTS user_roles') !== -1, 'legacy user_roles table bootstrap must remain in place (Out of Scope: do not remove)');
    });
  });

  // ── Integration: AC1 — idempotent rerun across a simulated restart ────────
  queue.push(function() {
    console.log('\n[tir-s1] T3 -- migration bootstrap is idempotent across a simulated server restart (AC1)');
    return test('running migrateTeamSchema twice against the same pool state does not error or duplicate rows', async function() {
      var userRoles = freshRequire(USER_ROLES_PATH);
      var pool = makeFakePool([{ tenant_id: 'acme', role: 'admin' }]);
      await userRoles.migrateTeamSchema(pool);
      var afterFirst = pool._state().teamMemberships.length;
      assert.strictEqual(afterFirst, 1, 'Expected exactly one team_memberships row after first run');

      // Simulate a server restart: run the same bootstrap function again against
      // the same (now-populated) pool state.
      await userRoles.migrateTeamSchema(pool);
      var afterSecond = pool._state().teamMemberships.length;
      assert.strictEqual(afterSecond, 1, 'Expected no duplicate team_memberships row after a second (restart) run');
    });
  });

  // ── Integration: AC2 — legacy solo-tenant role migrates unchanged ─────────
  queue.push(function() {
    console.log('\n[tir-s1] T4 -- legacy solo-tenant role migrates unchanged into the new schema (AC2)');
    return test('a legacy user_roles row backfills into people + team_memberships with the role unchanged', async function() {
      var userRoles = freshRequire(USER_ROLES_PATH);
      var pool = makeFakePool([{ tenant_id: 'acme', role: 'admin' }]);
      await userRoles.migrateTeamSchema(pool);
      var state = pool._state();
      assert.strictEqual(state.people.length, 1, 'Expected exactly one people row created');
      assert.strictEqual(state.teamMemberships.length, 1, 'Expected exactly one team_memberships row created');
      var row = state.teamMemberships[0];
      assert.strictEqual(row.tenant_id, 'acme', 'team_memberships row must be for tenant acme');
      assert.strictEqual(row.role, 'admin', 'role must be copied unchanged from the legacy row -- no value drift');
      assert.strictEqual(row.person_id, state.people[0].id, 'team_memberships row must reference the newly created person');
    });
  });

  // ── Integration: AC3 — login resolves role via the new schema, all 3 providers ──
  queue.push(function() {
    console.log('\n[tir-s1] T5 -- login resolves req.session.role via the new schema, not the legacy lookup, across all 3 providers (AC3)');
    return test('handleAuthCallback, handleAuthGoogleCallback, and handleEmailLogin all resolve role via getRoleForTenant; legacy getUserRole is never called', async function() {
      var legacyCalled = false;

      var userRoles = freshRequire(USER_ROLES_PATH);
      userRoles.setGetUserRole(async function() { legacyCalled = true; return 'wrong-legacy-role'; });
      userRoles.setGetRoleForTenant(async function(tenantId) {
        if (tenantId === 'known-org' || tenantId === 'known-sub' || tenantId === 'known@example.com') return 'engineer';
        return 'user';
      });
      require.cache[require.resolve(USER_ROLES_PATH)] = {
        id: require.resolve(USER_ROLES_PATH), filename: require.resolve(USER_ROLES_PATH),
        loaded: true, exports: userRoles
      };

      // ── GitHub provider (handleAuthCallback) ──────────────────────────────
      delete require.cache[require.resolve(AUTH_PATH)];
      var auth = require(AUTH_PATH);
      auth.setFetchOrgs(async function() { return []; });

      var oauthAdapter = require('../src/web-ui/auth/oauth-adapter.js');
      var _origExchange = oauthAdapter.providerExchangeCode;
      var _origIdentity = oauthAdapter.providerGetUserIdentity;
      var _origStore = oauthAdapter.storeTokenInSession;
      var _origValidate = oauthAdapter.validateOAuthState;
      oauthAdapter.providerExchangeCode = async function() { return 'fake-token'; };
      oauthAdapter.providerGetUserIdentity = async function() { return { id: 1, login: 'known-org' }; };
      oauthAdapter.storeTokenInSession = function(r, token) { r.session.accessToken = token; };
      oauthAdapter.validateOAuthState = function() { return true; };

      var sessionMod = require('../src/web-ui/middleware/session.js');
      var _origRotate = sessionMod.rotateSessionId;
      var _origPersist = sessionMod.persistSession;
      var _origGetSession = sessionMod.getSession;

      var userFlags = require('../src/web-ui/modules/user-flags.js');
      var _origGetFlag = userFlags.getFirstLoginFlag;
      userFlags.getFirstLoginFlag = async function() { return false; };

      var reqGithub = {
        query: { code: 'test-code', state: 'test-state' },
        session: { oauthState: 'test-state', tenantId: null, role: null },
        sessionId: 'sess-github',
        headers: {}
      };
      sessionMod.rotateSessionId = function(oldId) { return { newId: oldId }; };
      sessionMod.persistSession = function() {};
      sessionMod.getSession = function() { return reqGithub.session; };
      var resGithub = makeRes();

      try {
        await auth.handleAuthCallback(reqGithub, resGithub);
      } finally {
        oauthAdapter.providerExchangeCode = _origExchange;
        oauthAdapter.providerGetUserIdentity = _origIdentity;
        oauthAdapter.storeTokenInSession = _origStore;
        oauthAdapter.validateOAuthState = _origValidate;
      }
      assert.strictEqual(reqGithub.session.role, 'engineer', 'GitHub login: expected role=engineer, got: ' + reqGithub.session.role);

      // ── Google provider (handleAuthGoogleCallback) ────────────────────────
      oauthAdapter.fetchGoogleUserInfo = async function() {
        return { accessToken: 'ya29.fake', sub: 'known-sub', email: 'known-sub@example.com' };
      };
      var reqGoogle = {
        query: { code: 'g-code', state: 'g-state' },
        session: { oauthState: 'g-state', tenantId: null, role: null },
        sessionId: 'sess-google',
        headers: {}
      };
      sessionMod.getSession = function() { return reqGoogle.session; };
      var resGoogle = makeRes();
      await auth.handleAuthGoogleCallback(reqGoogle, resGoogle);
      assert.strictEqual(reqGoogle.session.role, 'engineer', 'Google login: expected role=engineer, got: ' + reqGoogle.session.role);

      sessionMod.rotateSessionId = _origRotate;
      sessionMod.persistSession = _origPersist;
      sessionMod.getSession = _origGetSession;
      userFlags.getFirstLoginFlag = _origGetFlag;

      // ── Email/password provider (handleEmailLogin) ────────────────────────
      delete require.cache[require.resolve(AUTH_EMAIL_PATH)];
      var authEmail = require(AUTH_EMAIL_PATH);
      authEmail._clearRateLimits();
      var passwordModule = require('../src/web-ui/modules/password.js');
      passwordModule.setPasswordAdapter(require('bcrypt'));
      var bcryptHash = await passwordModule.hashPassword('Test123!Password');
      authEmail.setUserDb({
        query: async function(sql) {
          var s = _norm(sql);
          if (s.indexOf('SELECT ID, EMAIL, PASSWORD_HASH FROM USERS') === 0) {
            return { rows: [{ id: 42, email: 'known@example.com', password_hash: bcryptHash }] };
          }
          return { rows: [] };
        }
      });
      authEmail.setRotateSessionId(function(oldId) { return { newId: oldId }; });
      var reqEmail = {
        body: { email: 'known@example.com', password: 'Test123!Password' },
        session: {},
        sessionId: 'sess-email',
        ip: '127.0.0.1',
        headers: { 'content-type': 'application/json' }
      };
      var resEmail = makeRes();
      await authEmail.handleEmailLogin(reqEmail, resEmail);
      assert.strictEqual(reqEmail.session.role, 'engineer', 'Email login: expected role=engineer, got: ' + reqEmail.session.role);

      assert.strictEqual(legacyCalled, false, 'The legacy getUserRole(tenantId) adapter must never be called when the new getRoleForTenant adapter is wired');
    });
  });

  // ── Integration: AC5 — unmigrated solo tenant gets lazily-created row ─────
  queue.push(function() {
    console.log('\n[tir-s1] T6 -- unmigrated solo tenant gets a lazily-created team_memberships row on first post-migration login (AC5)');
    return test('resolveRoleForTenant lazily creates a team_memberships row from the legacy user_roles value when none exists yet', async function() {
      var userRoles = freshRequire(USER_ROLES_PATH);
      var pool = makeFakePool([{ tenant_id: 'legacy-tenant', role: 'admin' }]);
      // No migration has run yet -- team_memberships is empty for this tenant.
      var role = await userRoles.resolveRoleForTenant(pool, 'legacy-tenant');
      assert.strictEqual(role, 'admin', 'Login must resolve the legacy role, not fail or default to a different role');
      var state = pool._state();
      assert.strictEqual(state.teamMemberships.length, 1, 'Expected a team_memberships row to be lazily created');
      assert.strictEqual(state.teamMemberships[0].tenant_id, 'legacy-tenant');
      assert.strictEqual(state.teamMemberships[0].role, 'admin', 'Lazily-created row must match the legacy value exactly');
    });
  });

  // ── NFR: Audit — migration logs an info-level message ─────────────────────
  queue.push(function() {
    console.log('\n[tir-s1] T7 -- migration logs an info-level message identifying the migration (Audit NFR)');
    return test('migrateTeamSchema calls the injected logger exactly once with an identifiable message', async function() {
      var userRoles = freshRequire(USER_ROLES_PATH);
      var pool = makeFakePool([{ tenant_id: 'acme', role: 'admin' }]);
      var infoCalls = [];
      var logger = { info: function(msg) { infoCalls.push(msg); } };
      await userRoles.migrateTeamSchema(pool, logger);
      assert.strictEqual(infoCalls.length, 1, 'Expected exactly one info-level log call per migration run, got: ' + infoCalls.length);
      assert.ok(/team_membership/i.test(infoCalls[0]), 'Log message must identify the migration by name, got: ' + infoCalls[0]);
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[tir-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[tir-s1] Unexpected error:', err);
  process.exit(1);
});
