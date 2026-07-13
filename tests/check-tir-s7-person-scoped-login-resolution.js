'use strict';

// check-tir-s7-person-scoped-login-resolution.js — tir-s7 (fix-forward)
//
// tir-s1 (PR #463) shipped resolveRoleForTenant(pool, tenantId), which queries
// `team_memberships WHERE tenant_id = $1 LIMIT 1` — no person_id filter at
// all. Once a tenant has 2+ people with different roles, login resolves an
// ARBITRARY row's role for whoever logs in, not their own. This test file
// verifies the fix: a person-scoped lookup that resolves the authenticating
// identity to a personId first (via tir-s2's resolvePersonForIdentity), then
// filters team_memberships by BOTH person_id AND tenant_id.
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-tir-s1-person-team-schema.js) — no Jest/Mocha.

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
var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

// ── In-memory fake pool ──────────────────────────────────────────────────────
// Narrow, self-contained fake — supports exactly the query shapes
// resolvePersonForIdentity (identity-links.js) and the corrected
// person-scoped role lookup (user-roles.js) issue against person_identities /
// team_memberships / user_roles. Mirrors tests/check-tir-s1-person-team-schema.js's
// own documented convention of narrow, explicit branches rather than a
// generic SQL engine.
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

// personIdentities: [{ identity_key, person_id }]
// teamMemberships: [{ person_id, tenant_id, role }]
// userRoles: [{ tenant_id, role }] (legacy table)
function makeFakePool(personIdentities, teamMemberships, userRoles) {
  var _personIdentities = (personIdentities || []).slice();
  var _teamMemberships = (teamMemberships || []).slice();
  var _userRoles = (userRoles || []).slice();
  var queryLog = [];

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];
    queryLog.push(s);

    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var identityKey = p[0];
      var linked = _personIdentities.filter(function(r) { return r.identity_key === identityKey; });
      return Promise.resolve({ rows: linked.map(function(r) { return { person_id: r.person_id }; }) });
    }

    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND TENANT_ID') === -1 && s.indexOf('AND PERSON_ID') === -1) {
      // resolvePersonForIdentity's tenant_id-only fallback (identity-links.js) —
      // not used by the AC1/AC2 fixtures below (they use explicit
      // person_identities rows so resolution is unambiguous per-person), but
      // supported here for completeness / the solo-tenant AC3 case.
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
      // Legacy tenant-only lookup (resolveRoleForTenant) — used as the AC4
      // fallback path when resolvePersonForIdentity returns null.
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

  return {
    query: query,
    _queryLog: function() { return queryLog; }
  };
}

async function main() {
  var queue = [];

  // ── AC1 — person Y resolves their own role, not X's ───────────────────────
  queue.push(function() {
    console.log('\n[tir-s7] T1 -- person Y in a 2-person shared tenant resolves their own role, not person X\'s (AC1)');
    return test('resolveRoleForPerson returns engineer for person Y regardless of row order', async function() {
      var userRoles = freshRequire(USER_ROLES_PATH);
      var pool = makeFakePool(
        [
          { identity_key: 'person-x@example.com', person_id: 1 },
          { identity_key: 'person-y@example.com', person_id: 2 }
        ],
        [
          { person_id: 1, tenant_id: 'acme', role: 'admin' },
          { person_id: 2, tenant_id: 'acme', role: 'engineer' }
        ],
        []
      );
      var role = await userRoles.resolveRoleForPerson(pool, 'person-y@example.com', 'acme');
      assert.strictEqual(role, 'engineer', 'Expected person Y\'s own role (engineer), got: ' + role);
    });
  });

  // ── AC2 — person X resolves their own role in the same shared tenant ──────
  queue.push(function() {
    console.log('\n[tir-s7] T2 -- person X (admin) in the same shared tenant resolves their own role (AC2)');
    return test('resolveRoleForPerson returns admin for person X, confirming independent resolution', async function() {
      var userRoles = freshRequire(USER_ROLES_PATH);
      var pool = makeFakePool(
        [
          { identity_key: 'person-x@example.com', person_id: 1 },
          { identity_key: 'person-y@example.com', person_id: 2 }
        ],
        [
          { person_id: 1, tenant_id: 'acme', role: 'admin' },
          { person_id: 2, tenant_id: 'acme', role: 'engineer' }
        ],
        []
      );
      var role = await userRoles.resolveRoleForPerson(pool, 'person-x@example.com', 'acme');
      assert.strictEqual(role, 'admin', 'Expected person X\'s own role (admin), got: ' + role);
    });
  });

  // ── AC3 — solo tenant login is unaffected (regression) ─────────────────────
  queue.push(function() {
    console.log('\n[tir-s7] T3 -- solo tenant (one person, one role) resolves exactly as before this story (AC3)');
    return test('resolveRoleForPerson returns the unchanged role for a solo tenant via the team_memberships fallback path', async function() {
      var userRoles = freshRequire(USER_ROLES_PATH);
      // No explicit person_identities row -- exercises resolvePersonForIdentity's
      // tenant_id-only fallback, which is unambiguous here because there is
      // only one team_memberships row for this tenant (today's common case).
      var pool = makeFakePool(
        [],
        [
          { person_id: 7, tenant_id: 'solo-org', role: 'admin' }
        ],
        []
      );
      var role = await userRoles.resolveRoleForPerson(pool, 'solo-org', 'solo-org');
      assert.strictEqual(role, 'admin', 'Expected the unchanged solo-tenant role (admin), got: ' + role);
    });
  });

  // ── AC4 — brand-new unknown identity resolves to default 'user', no crash ─
  queue.push(function() {
    console.log('\n[tir-s7] T4 -- brand-new unknown identity resolves to the default \'user\' role, no crash (AC4)');
    return test('resolveRoleForPerson falls through gracefully when resolvePersonForIdentity returns null', async function() {
      var userRoles = freshRequire(USER_ROLES_PATH);
      // No person_identities row, no team_memberships row, no legacy user_roles
      // row anywhere for this identity -- a completely unknown, brand-new signup.
      var pool = makeFakePool([], [], []);
      var role = await userRoles.resolveRoleForPerson(pool, 'never-seen@example.com', 'never-seen@example.com');
      assert.strictEqual(role, 'user', 'Expected the default \'user\' role for an unknown identity, got: ' + role);
    });
  });

  // ── AC5 (D37) — server.js wiring resolves personId before the role lookup ─
  queue.push(function() {
    console.log('\n[tir-s7] T5 -- server.js\'s setGetRoleForTenant wiring uses the person-scoped lookup, not the bare tenant-only one (AC5)');
    return test('server.js wires setGetRoleForTenant to resolveRoleForPerson, and resolveRoleForPerson genuinely resolves personId before querying team_memberships', async function() {
      // Static half: server.js's production wiring call site must reference
      // the corrected, person-scoped function -- not the old bare
      // resolveRoleForTenant(pool, tenantId) call. Read as text only (never
      // require()/boot server.js in-process -- this repo's server.js starts
      // a setInterval()-driven session-eviction loop and DB migrations that
      // hang a test process; see tests/check-tir-s1-person-team-schema.js's
      // own T2 for the same precedent).
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      var setIdx = src.indexOf('setGetRoleForTenant(');
      assert.ok(setIdx !== -1, 'server.js must call setGetRoleForTenant()');
      var wiringBlock = src.slice(setIdx, setIdx + 400);
      assert.ok(
        wiringBlock.indexOf('resolveRoleForPerson') !== -1,
        'server.js\'s setGetRoleForTenant(...) wiring call site must call the person-scoped resolveRoleForPerson, not the bare tenant-only resolveRoleForTenant. Wiring block was: ' + wiringBlock
      );
      assert.ok(
        wiringBlock.indexOf('resolveRoleForTenant(_userRolesPool, tenantId)') === -1,
        'server.js must no longer wire the bare, unscoped resolveRoleForTenant(_userRolesPool, tenantId) call directly into setGetRoleForTenant -- that is the tir-s1 bug this story fixes.'
      );
      var importLine = src.slice(0, setIdx);
      assert.ok(
        /resolveRoleForPerson/.test(importLine),
        'server.js must import resolveRoleForPerson from ./modules/user-roles alongside the existing tir-s1 imports.'
      );

      // Behavioural half: the actual exported resolveRoleForPerson function
      // (the one server.js's wiring now calls) must call resolvePersonForIdentity
      // BEFORE issuing the team_memberships query -- proving the ordering the
      // wiring depends on, without needing to boot server.js itself.
      var userRoles = freshRequire(USER_ROLES_PATH);
      var pool = makeFakePool(
        [{ identity_key: 'order-check@example.com', person_id: 5 }],
        [{ person_id: 5, tenant_id: 'order-check-tenant', role: 'engineer' }],
        []
      );
      await userRoles.resolveRoleForPerson(pool, 'order-check@example.com', 'order-check-tenant');
      var log = pool._queryLog();
      var personIdentitiesIdx = log.findIndex(function(q) { return q.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES') === 0; });
      var teamMembershipsRoleIdx = log.findIndex(function(q) { return q.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE PERSON_ID') === 0; });
      assert.ok(personIdentitiesIdx !== -1, 'Expected a person_identities lookup to have been issued');
      assert.ok(teamMembershipsRoleIdx !== -1, 'Expected a person+tenant-scoped team_memberships role query to have been issued');
      assert.ok(personIdentitiesIdx < teamMembershipsRoleIdx, 'Person resolution must happen BEFORE the team_memberships role query, per AC5');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[tir-s7] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[tir-s7] Unexpected error:', err);
  process.exit(1);
});
