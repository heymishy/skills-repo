'use strict';

// check-tir-s9-per-person-identitykey-login-fix.js — tir-s9 (fix-forward)
//
// tir-s7 (PR #467) correctly rewrote resolveRoleForPerson(pool, identityKey, tenantId)
// to resolve identityKey -> personId before scoping team_memberships by BOTH person_id
// AND tenant_id -- proven by tests/check-tir-s7-person-scoped-login-resolution.js, which
// calls resolveRoleForPerson directly with two distinct, already-correct identity
// strings. But server.js's production wiring collapsed both arguments into the SAME
// value: setGetRoleForTenant(function(tenantId) { return resolveRoleForPerson(pool,
// tenantId, tenantId); }) -- and every login call site (routes/auth.js GitHub/Google
// callbacks) called getRoleForTenant(req.session.tenantId) with a single argument. For a
// solo tenant or email/password login this is harmless (tenantId already equals that
// person's own identity), but once TENANT_ORG_ALLOWLIST is configured, resolveTenant()
// returns the SAME shared org tenantId for every teammate -- so every teammate's login
// calls resolveRoleForPerson with the shared org name as identityKey, reproducing tir-s7's
// original bug one layer removed. This file drives the REAL routes/auth.js callback
// handlers (not resolveRoleForPerson directly) to prove the fix holds on the actual
// production login path.
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-tir-s7-person-scoped-login-resolution.js, tests/check-arl-s4-admin-billing-bypass.js)
// -- no Jest/Mocha.

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
var AUTH_PATH          = path.resolve(ROOT, 'src/web-ui/routes/auth.js');
var AUTH_EMAIL_PATH    = path.resolve(ROOT, 'src/web-ui/routes/auth-email.js');
var USER_ROLES_PATH    = path.resolve(ROOT, 'src/web-ui/modules/user-roles.js');
var OAUTH_ADAPTER_PATH = path.resolve(ROOT, 'src/web-ui/auth/oauth-adapter.js');
var SESSION_PATH       = path.resolve(ROOT, 'src/web-ui/middleware/session.js');
var SERVER_PATH        = path.resolve(ROOT, 'src/web-ui/server.js');

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

// ── In-memory fake pool (same shape as tests/check-tir-s7-person-scoped-login-resolution.js) ──
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakePool(personIdentities, teamMemberships, userRoles) {
  var _personIdentities = (personIdentities || []).slice();
  var _teamMemberships = (teamMemberships || []).slice();
  var _userRoles = (userRoles || []).slice();

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var identityKey = p[0];
      var linked = _personIdentities.filter(function(r) { return r.identity_key === identityKey; });
      return Promise.resolve({ rows: linked.map(function(r) { return { person_id: r.person_id }; }) });
    }

    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND TENANT_ID') === -1 && s.indexOf('AND PERSON_ID') === -1) {
      var fallbackTenantId = p[0];
      var match = _teamMemberships.filter(function(r) { return r.tenant_id === fallbackTenantId; });
      return Promise.resolve({ rows: match.length ? [{ person_id: match[0].person_id }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE PERSON_ID') === 0 && s.indexOf('AND TENANT_ID') !== -1) {
      var scopedPersonId = p[0];
      var scopedTenantId = p[1];
      var scopedMatch = _teamMemberships.filter(function(r) { return r.person_id === scopedPersonId && r.tenant_id === scopedTenantId; });
      return Promise.resolve({ rows: scopedMatch.length ? [{ role: scopedMatch[0].role }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var legacyScopeTenantId = p[0];
      var legacyScopeMatch = _teamMemberships.filter(function(r) { return r.tenant_id === legacyScopeTenantId; });
      return Promise.resolve({ rows: legacyScopeMatch.length ? [{ role: legacyScopeMatch[0].role }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM USER_ROLES WHERE TENANT_ID') === 0) {
      var legacyTenantId = p[0];
      var legacyMatch = _userRoles.filter(function(r) { return r.tenant_id === legacyTenantId; });
      return Promise.resolve({ rows: legacyMatch.map(function(r) { return { role: r.role }; }) });
    }

    if (s.indexOf('SELECT 1 FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var checkTenantId = p[0];
      var exists = _teamMemberships.some(function(r) { return r.tenant_id === checkTenantId; });
      return Promise.resolve({ rows: exists ? [{ '?column?': 1 }] : [] });
    }

    if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) {
      return Promise.resolve({ rows: [{ id: 999 }] });
    }

    if (s.indexOf('INSERT INTO TEAM_MEMBERSHIPS') === 0) {
      return Promise.resolve({ rows: [] });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 120));
    return Promise.resolve({ rows: [] });
  }

  return { query: query };
}

// Wires setGetRoleForTenant exactly as server.js's FIXED wiring is expected to: forward an
// optional identityKey second argument through to resolveRoleForPerson, falling back to
// tenantId when the caller does not supply one (backward compatible with auth-email.js).
function wireServerStyleRoleAdapter(userRoles, pool) {
  userRoles.setGetRoleForTenant(function(tenantId, identityKey) {
    return userRoles.resolveRoleForPerson(pool, identityKey || tenantId, tenantId);
  });
}

// ── GitHub OAuth callback driver (mirrors tests/check-arl-s4-admin-billing-bypass.js) ──
async function runGithubCallback(opts) {
  var userRoles = freshRequire(USER_ROLES_PATH);
  wireServerStyleRoleAdapter(userRoles, opts.pool);
  require.cache[require.resolve(USER_ROLES_PATH)] = {
    id: require.resolve(USER_ROLES_PATH), filename: require.resolve(USER_ROLES_PATH),
    loaded: true, exports: userRoles
  };

  var oauthAdapter = require(OAUTH_ADAPTER_PATH);
  var saved = {
    validateOAuthState: oauthAdapter.validateOAuthState,
    providerExchangeCode: oauthAdapter.providerExchangeCode,
    providerGetUserIdentity: oauthAdapter.providerGetUserIdentity,
    storeTokenInSession: oauthAdapter.storeTokenInSession
  };
  oauthAdapter.validateOAuthState = function() { return true; };
  oauthAdapter.providerExchangeCode = async function() { return 'test-token'; };
  oauthAdapter.providerGetUserIdentity = async function() { return { id: opts.id, login: opts.login }; };
  oauthAdapter.storeTokenInSession = function(req, token) { req.session.accessToken = token; };

  var sessionMod = require(SESSION_PATH);
  var newSession = {};
  var savedSession = {
    persistSession: sessionMod.persistSession,
    rotateSessionId: sessionMod.rotateSessionId,
    getSession: sessionMod.getSession
  };
  sessionMod.persistSession = function() {};
  // Real rotateSessionId carries the pre-rotation session's fields (tenantId, role, etc.)
  // into the rotated session -- mirror that here rather than returning a fixed stub object.
  sessionMod.rotateSessionId = function(sessionId, res, session) {
    Object.assign(newSession, session);
    return { newId: 'new-sess-tir-s9' };
  };
  sessionMod.getSession = function() { return newSession; };

  // auth.js destructures { persistSession, rotateSessionId, getSession } from
  // middleware/session at require time -- it must be freshly required AFTER the
  // session module's exports are monkeypatched above, or it will capture the real
  // functions instead (same ordering established in check-arl-s4-admin-billing-bypass.js).
  var auth = freshRequire(AUTH_PATH);
  auth.setFetchOrgs(async function() { return opts.orgs || []; });

  var hadAllowlist = Object.prototype.hasOwnProperty.call(process.env, 'TENANT_ORG_ALLOWLIST');
  var prevAllowlist = process.env.TENANT_ORG_ALLOWLIST;
  if (opts.allowlist !== undefined) {
    process.env.TENANT_ORG_ALLOWLIST = opts.allowlist;
  } else {
    delete process.env.TENANT_ORG_ALLOWLIST;
  }

  var req = {
    session: { oauthState: 'csrf-state', returnTo: undefined, accessToken: undefined },
    query: { code: 'oauth-code', state: 'csrf-state' },
    sessionId: 'sess-test-tir-s9',
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
    if (hadAllowlist) process.env.TENANT_ORG_ALLOWLIST = prevAllowlist; else delete process.env.TENANT_ORG_ALLOWLIST;
    delete require.cache[require.resolve(AUTH_PATH)];
    delete require.cache[require.resolve(USER_ROLES_PATH)];
  }

  return { res: res, session: newSession };
}

// ── Google OAuth callback driver ────────────────────────────────────────────
async function runGoogleCallback(opts) {
  var userRoles = freshRequire(USER_ROLES_PATH);
  wireServerStyleRoleAdapter(userRoles, opts.pool);
  require.cache[require.resolve(USER_ROLES_PATH)] = {
    id: require.resolve(USER_ROLES_PATH), filename: require.resolve(USER_ROLES_PATH),
    loaded: true, exports: userRoles
  };

  var oauthAdapter = require(OAUTH_ADAPTER_PATH);
  var saved = {
    validateOAuthState: oauthAdapter.validateOAuthState,
    fetchGoogleUserInfo: oauthAdapter.fetchGoogleUserInfo
  };
  oauthAdapter.validateOAuthState = function() { return true; };
  oauthAdapter.fetchGoogleUserInfo = async function() {
    return { accessToken: 'google-test-token', sub: opts.sub, email: opts.email };
  };

  var sessionMod = require(SESSION_PATH);
  var newSession = {};
  var savedSession = {
    persistSession: sessionMod.persistSession,
    rotateSessionId: sessionMod.rotateSessionId,
    getSession: sessionMod.getSession
  };
  sessionMod.persistSession = function() {};
  sessionMod.rotateSessionId = function(sessionId, res, session) {
    Object.assign(newSession, session);
    return { newId: 'new-sess-tir-s9-google' };
  };
  sessionMod.getSession = function() { return newSession; };

  // Fresh-require AFTER session mocks are in place (see runGithubCallback comment above).
  var auth = freshRequire(AUTH_PATH);

  var req = {
    session: { oauthState: 'csrf-state' },
    query: { code: 'oauth-code', state: 'csrf-state' },
    sessionId: 'sess-test-tir-s9-google',
    headers: {}
  };
  var res = makeRes();

  try {
    await auth.handleAuthGoogleCallback(req, res);
  } finally {
    oauthAdapter.validateOAuthState = saved.validateOAuthState;
    oauthAdapter.fetchGoogleUserInfo = saved.fetchGoogleUserInfo;
    sessionMod.persistSession = savedSession.persistSession;
    sessionMod.rotateSessionId = savedSession.rotateSessionId;
    sessionMod.getSession = savedSession.getSession;
    delete require.cache[require.resolve(AUTH_PATH)];
    delete require.cache[require.resolve(USER_ROLES_PATH)];
  }

  return { res: res, session: newSession };
}

// ── Email/password login driver ─────────────────────────────────────────────
async function runEmailLogin(opts) {
  var userRoles = freshRequire(USER_ROLES_PATH);
  wireServerStyleRoleAdapter(userRoles, opts.pool);
  require.cache[require.resolve(USER_ROLES_PATH)] = {
    id: require.resolve(USER_ROLES_PATH), filename: require.resolve(USER_ROLES_PATH),
    loaded: true, exports: userRoles
  };

  var authEmail = freshRequire(AUTH_EMAIL_PATH);
  var passwordMod = require(path.resolve(ROOT, 'src/web-ui/modules/password'));
  // password.js's D37 adapter is module-internal state, not exported -- swap it via
  // setPasswordAdapter (its own public API) rather than trying to monkeypatch the
  // destructured verifyPassword reference auth-email.js already holds (that reference
  // would not see a reassignment of the exported binding).
  passwordMod.setPasswordAdapter({
    hash: async function() { return 'unused-hash'; },
    compare: async function() { return true; }
  });

  authEmail.setUserDb({
    query: async function(sql) {
      if (/SELECT id, email, password_hash FROM users WHERE email/i.test(sql)) {
        return { rows: [{ id: 'u1', email: opts.email, password_hash: 'hash' }] };
      }
      return { rows: [] };
    }
  });

  var sessionMod = require(SESSION_PATH);
  var newSession = {};
  var savedGetSession = sessionMod.getSession;
  var savedRotateSessionId = sessionMod.rotateSessionId;
  sessionMod.getSession = function() { return newSession; };
  authEmail.setRotateSessionId(function(sessionId, res, session) {
    Object.assign(newSession, session);
    return { newId: 'new-sess-tir-s9-email' };
  });

  var req = {
    session: {},
    sessionId: 'sess-test-tir-s9-email',
    headers: {},
    connection: { remoteAddress: '127.0.0.1' },
    body: { email: opts.email, password: 'irrelevant-mocked' }
  };
  var res = makeRes();

  try {
    await authEmail.handleEmailLogin(req, res);
  } finally {
    sessionMod.getSession = savedGetSession;
    sessionMod.rotateSessionId = savedRotateSessionId;
    delete require.cache[require.resolve(AUTH_EMAIL_PATH)];
    delete require.cache[require.resolve(USER_ROLES_PATH)];
  }

  return { res: res, session: newSession };
}

async function main() {
  var queue = [];

  // ── AC1 — person Y resolves their own role through the REAL GitHub callback ──
  queue.push(function() {
    console.log('\n[tir-s9] T1 -- person Y logs in via the real GitHub OAuth callback in a shared org tenant and resolves their own role, not X\'s (AC1)');
    return test('handleAuthCallback sets req.session.role = engineer for person Y', async function() {
      var pool = makeFakePool(
        [
          { identity_key: 'person-x', person_id: 1 },
          { identity_key: 'person-y', person_id: 2 }
        ],
        [
          { person_id: 1, tenant_id: 'acme-org', role: 'admin' },
          { person_id: 2, tenant_id: 'acme-org', role: 'engineer' }
        ],
        []
      );
      var r = await runGithubCallback({
        id: 2002, login: 'person-y', pool: pool,
        allowlist: 'acme-org', orgs: [{ login: 'acme-org' }]
      });
      assert.strictEqual(r.session.tenantId, 'acme-org', 'Expected shared tenantId acme-org, got: ' + r.session.tenantId);
      assert.strictEqual(r.session.role, 'engineer', 'Expected person Y\'s own role (engineer), got: ' + r.session.role);
    });
  });

  // ── AC2 — person X resolves their own role through the same real callback ──
  queue.push(function() {
    console.log('\n[tir-s9] T2 -- person X (admin) logs in via the same real GitHub OAuth callback and resolves their own role (AC2)');
    return test('handleAuthCallback sets req.session.role = admin for person X', async function() {
      var pool = makeFakePool(
        [
          { identity_key: 'person-x', person_id: 1 },
          { identity_key: 'person-y', person_id: 2 }
        ],
        [
          { person_id: 1, tenant_id: 'acme-org', role: 'admin' },
          { person_id: 2, tenant_id: 'acme-org', role: 'engineer' }
        ],
        []
      );
      var r = await runGithubCallback({
        id: 2001, login: 'person-x', pool: pool,
        allowlist: 'acme-org', orgs: [{ login: 'acme-org' }]
      });
      assert.strictEqual(r.session.tenantId, 'acme-org', 'Expected shared tenantId acme-org, got: ' + r.session.tenantId);
      assert.strictEqual(r.session.role, 'admin', 'Expected person X\'s own role (admin), got: ' + r.session.role);
    });
  });

  // ── AC3a — solo GitHub tenant login is unaffected (regression) ─────────────
  queue.push(function() {
    console.log('\n[tir-s9] T3a -- solo GitHub tenant (no TENANT_ORG_ALLOWLIST match) resolves exactly as before this story (AC3)');
    return test('handleAuthCallback preserves solo-tenant role resolution', async function() {
      var pool = makeFakePool(
        [],
        [{ person_id: 7, tenant_id: 'solo-dev', role: 'admin' }],
        []
      );
      var r = await runGithubCallback({ id: 3001, login: 'solo-dev', pool: pool });
      assert.strictEqual(r.session.tenantId, 'solo-dev', 'Expected solo tenantId = own login, got: ' + r.session.tenantId);
      assert.strictEqual(r.session.role, 'admin', 'Expected unchanged solo-tenant role (admin), got: ' + r.session.role);
    });
  });

  // ── AC3b — email/password login is unaffected (regression) ─────────────────
  queue.push(function() {
    console.log('\n[tir-s9] T3b -- email/password login (auth-email.js, unmodified) resolves exactly as before this story (AC3)');
    return test('handleEmailLogin preserves existing role resolution via its unmodified single-argument call', async function() {
      var pool = makeFakePool(
        [],
        [{ person_id: 9, tenant_id: 'teammate@example.com', role: 'product' }],
        []
      );
      var r = await runEmailLogin({ email: 'teammate@example.com', pool: pool });
      assert.strictEqual(r.res._status, 302, 'Expected 302 redirect, got ' + r.res._status);
      assert.strictEqual(r.session.role, 'product', 'Expected unchanged email-tenant role (product), got: ' + r.session.role);
    });
  });

  // ── AC4 — Google callback: identityKey === tenantId already, no behaviour change ──
  queue.push(function() {
    console.log('\n[tir-s9] T4 -- Google OAuth callback passes sub explicitly as identityKey; req.session.role is unchanged (AC4, non-bug finding)');
    return test('handleAuthGoogleCallback resolves the same role as before this story (sub used as both identityKey and tenantId)', async function() {
      var pool = makeFakePool(
        [],
        [{ person_id: 11, tenant_id: 'google-sub-123', role: 'viewer' }],
        []
      );
      var r = await runGoogleCallback({ sub: 'google-sub-123', email: 'g-user@example.com', pool: pool });
      assert.strictEqual(r.session.tenantId, 'google-sub-123', 'Expected tenantId = sub, got: ' + r.session.tenantId);
      assert.strictEqual(r.session.role, 'viewer', 'Expected unchanged role (viewer), got: ' + r.session.role);
    });
  });

  // ── AC5 (D37, unit half) — getRoleForTenant forwards an optional identityKey ──
  queue.push(function() {
    console.log('\n[tir-s9] T5 -- getRoleForTenant accepts and forwards an optional identityKey second argument (AC5, unit)');
    return test('getRoleForTenant(tenantId, identityKey) forwards both args to the wired implementation; single-arg calls still work', async function() {
      var userRoles = freshRequire(USER_ROLES_PATH);
      var received = [];
      userRoles.setGetRoleForTenant(function(tenantId, identityKey) {
        received.push([tenantId, identityKey]);
        return Promise.resolve('whatever');
      });
      await userRoles.getRoleForTenant('tenant-a', 'identity-a');
      await userRoles.getRoleForTenant('tenant-b'); // single-arg, backward compatible (auth-email.js shape)
      assert.deepStrictEqual(received[0], ['tenant-a', 'identity-a'], 'Expected both arguments forwarded, got: ' + JSON.stringify(received[0]));
      assert.strictEqual(received[1][0], 'tenant-b', 'Expected single-arg call to still pass tenantId through');
    });
  });

  // ── AC5 (D37, behavioural half) — two identities sharing one tenantId resolve to two DIFFERENT, individually-correct roles ──
  queue.push(function() {
    console.log('\n[tir-s9] T6 -- server.js\'s wired setGetRoleForTenant differentiates two identities sharing one tenantId into two different, individually-correct roles (AC5, not just \'a function reference was assigned\')');
    return test('the exact wiring shape server.js is expected to use resolves person X and person Y to different roles from the same shared tenantId', async function() {
      var pool = makeFakePool(
        [
          { identity_key: 'person-x', person_id: 1 },
          { identity_key: 'person-y', person_id: 2 }
        ],
        [
          { person_id: 1, tenant_id: 'acme-org', role: 'admin' },
          { person_id: 2, tenant_id: 'acme-org', role: 'engineer' }
        ],
        []
      );
      var userRoles = freshRequire(USER_ROLES_PATH);
      wireServerStyleRoleAdapter(userRoles, pool);

      var roleX = await userRoles.getRoleForTenant('acme-org', 'person-x');
      var roleY = await userRoles.getRoleForTenant('acme-org', 'person-y');

      assert.strictEqual(roleX, 'admin', 'Expected person X to resolve admin, got: ' + roleX);
      assert.strictEqual(roleY, 'engineer', 'Expected person Y to resolve engineer, got: ' + roleY);
      assert.notStrictEqual(roleX, roleY, 'Two different identities sharing one tenantId must resolve to two DIFFERENT roles -- the exact collision this story fixes');

      // Static half: server.js's actual production wiring call site must match this shape.
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      var setIdx = src.indexOf('setGetRoleForTenant(');
      assert.ok(setIdx !== -1, 'server.js must call setGetRoleForTenant()');
      var wiringBlock = src.slice(setIdx, setIdx + 400);
      assert.ok(
        /function\s*\(\s*tenantId\s*,\s*identityKey\s*\)/.test(wiringBlock),
        'server.js\'s setGetRoleForTenant wiring must accept a second (identityKey) parameter. Wiring block was: ' + wiringBlock
      );
      assert.ok(
        wiringBlock.indexOf('resolveRoleForPerson(_userRolesPool, tenantId, tenantId)') === -1,
        'server.js must no longer collapse identityKey and tenantId into the same value -- that is the tir-s9 bug this story fixes.'
      );
      assert.ok(
        /resolveRoleForPerson\(_userRolesPool,\s*identityKey\s*\|\|\s*tenantId,\s*tenantId\)/.test(wiringBlock),
        'server.js must forward identityKey (falling back to tenantId when absent) into resolveRoleForPerson. Wiring block was: ' + wiringBlock
      );

      var authSrc = fs.readFileSync(AUTH_PATH, 'utf8');
      var githubCallIdx = authSrc.indexOf('getRoleForTenant(req.session.tenantId, user.login)');
      assert.ok(githubCallIdx !== -1, 'routes/auth.js\'s GitHub callback must call getRoleForTenant(req.session.tenantId, user.login) -- passing the per-person GitHub login as identityKey, not just the (possibly shared) tenantId.');
      var googleCallIdx = authSrc.indexOf('getRoleForTenant(req.session.tenantId, userInfo.sub)');
      assert.ok(googleCallIdx !== -1, 'routes/auth.js\'s Google callback must call getRoleForTenant(req.session.tenantId, userInfo.sub) -- passing sub explicitly as identityKey (AC4).');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[tir-s9] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[tir-s9] Unexpected error:', err);
  process.exit(1);
});
