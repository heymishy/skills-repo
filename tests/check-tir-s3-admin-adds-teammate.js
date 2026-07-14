#!/usr/bin/env node
// check-tir-s3-admin-adds-teammate.js — tir-s3
// Verifies the admin add-teammate/assign-role feature: addOrUpdateTeammate/
// getRoleForPersonInTenant (src/web-ui/modules/team-management.js) and the
// /team/members + /api/team/members route handlers
// (src/web-ui/routes/team-management.js). Follows this repo's hand-rolled
// test()/assert style (see tests/check-tir-s2-cross-provider-linking.js) —
// no Jest/Mocha.
//
// AC1: admin adds an existing person by identity, specifies a role -> a
//      team_memberships row is created
// AC2: assigned role resolves distinctly per-person within the same tenant
//      (see module header of team-management.js for why this is verified via
//      a direct person-scoped read rather than a full auth.js login drive —
//      wiring person-aware resolution into the live login/admin gate is
//      tir-s4's job, per epics/tir-e1.md)
// AC3: non-admin caller is denied 403 by requireAdmin; handler never reached
// AC4: re-adding an existing member updates the role in place, no duplicate row
// AC5: adding a never-logged-in identity is rejected, no placeholder row created
// ADR-025: tenant-scoped authorization — a spoofed tenant field in the
//          request body is ignored; the write always targets the admin's own
//          session tenant
// NFR: audit log records admin id, target person id, role, tenant, timestamp

'use strict';

var assert = require('assert');
var path = require('path');

var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  [PASS]', name); })
    .catch(function(err) {
      failed++;
      failures.push({ name: name, err: err });
      console.log('  [FAIL]', name, '--', (err && err.message) || err);
    });
}

var TEAM_MANAGEMENT_PATH = path.resolve(ROOT, 'src/web-ui/modules/team-management.js');
var TEAM_MANAGEMENT_ROUTE_PATH = path.resolve(ROOT, 'src/web-ui/routes/team-management.js');
var REQUIRE_ADMIN_PATH = path.resolve(ROOT, 'src/web-ui/middleware/require-admin.js');
var SERVER_PATH = path.resolve(ROOT, 'src/web-ui/server.js');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function mockReq(overrides) {
  return Object.assign({
    session: {},
    sessionId: 'test-sid-' + Math.random().toString(36).slice(2),
    query: {},
    headers: {},
    body: undefined
  }, overrides || {});
}

function mockRes() {
  var r = { statusCode: null, body: '', headers: {} };
  r.writeHead = function(code, hdrs) { r.statusCode = code; Object.assign(r.headers, hdrs || {}); };
  r.end = function(b) { r.body = (b != null ? String(b) : ''); r._ended = true; };
  return r;
}

// ── In-memory fake pool ──────────────────────────────────────────────────────
// Narrow, self-contained fake — supports exactly the query shapes
// team-management.js and identity-links.js's resolvePersonForIdentity issue
// against people / team_memberships / person_identities. Mirrors
// tests/check-tir-s2-cross-provider-linking.js's own convention (a narrow,
// explicit-branch fake, NOT an extension of src/web-ui/adapters/fake-test-db.js).
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakePool() {
  var people = [];
  var nextPersonId = 1;
  var teamMemberships = []; // { person_id, tenant_id, role }
  var personIdentities = []; // { identity_key, person_id, provider }

  function _findMembership(personId, tenantId) {
    return teamMemberships.filter(function(r) { return r.person_id === personId && r.tenant_id === tenantId; })[0];
  }

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('CREATE TABLE IF NOT EXISTS') === 0) {
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var match = personIdentities.filter(function(r) { return r.identity_key === p[0]; });
      return Promise.resolve({ rows: match.length ? [{ person_id: match[0].person_id }] : [] });
    }

    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tm = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; });
      return Promise.resolve({ rows: tm.length ? [{ person_id: tm[0].person_id }] : [] });
    }

    // Read used both for the pre-write "already a member?" check and for
    // AC2's person-scoped role read (getRoleForPersonInTenant).
    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND PERSON_ID') !== -1) {
      var found = _findMembership(p[1], p[0]);
      return Promise.resolve({ rows: found ? [{ role: found.role }] : [] });
    }

    if (s.indexOf('INSERT INTO TEAM_MEMBERSHIPS') === 0 && s.indexOf('ON CONFLICT') !== -1 && s.indexOf('DO UPDATE') !== -1) {
      var personId = p[0], tenantId = p[1], role = p[2];
      var existing = _findMembership(personId, tenantId);
      if (existing) {
        existing.role = role;
      } else {
        teamMemberships.push({ person_id: personId, tenant_id: tenantId, role: role });
      }
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) {
      var person = { id: nextPersonId++ };
      people.push(person);
      return Promise.resolve({ rows: [{ id: person.id }] });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 160));
    return Promise.resolve({ rows: [] });
  }

  // Test-setup helper (not a production query shape) — seeds a person already
  // migrated/known to tir-s1's schema (a team_memberships row), simulating a
  // person who has already logged in at least once before any tir-s3 add
  // action runs. Mirrors tir-s1/tir-s2's own test convention exactly.
  function _seedPerson(identityKey, role) {
    var person = { id: nextPersonId++ };
    people.push(person);
    teamMemberships.push({ person_id: person.id, tenant_id: identityKey, role: role || 'user' });
    return person.id;
  }

  return {
    query: query,
    _seedPerson: _seedPerson,
    _state: function() { return { people: people, teamMemberships: teamMemberships, personIdentities: personIdentities }; }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — admin adds an existing person by identity, specifies a role
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1AddsExistingPersonWithRole() {
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();

  var alicePersonId = pool._seedPerson('alice-github'); // Alice already logged in once, under her own solo tenant

  var result = await teamManagement.addOrUpdateTeammate(pool, 'acme', 'alice-github', 'engineer');

  assert.strictEqual(result.personId, alicePersonId, 'AC1: result identifies the correct person');
  assert.strictEqual(result.tenantId, 'acme', 'AC1: result identifies the tenant the membership was written to');
  assert.strictEqual(result.role, 'engineer', 'AC1: result carries the assigned role');

  var state = pool._state();
  var membership = state.teamMemberships.filter(function(r) { return r.person_id === alicePersonId && r.tenant_id === 'acme'; })[0];
  assert.ok(membership, 'AC1: a team_memberships row was created linking the person to tenant acme');
  assert.strictEqual(membership.role, 'engineer', 'AC1: the created row carries the specified role');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — assigned role resolves distinctly per-person within the same tenant
// ─────────────────────────────────────────────────────────────────────────────

async function testAC2RoleResolvesDistinctlyPerPerson() {
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();

  var adminPersonId = pool._seedPerson('admin-github', 'admin'); // admin already a member of acme (seeded directly as an established tenant member)
  pool._state().teamMemberships[0].tenant_id = 'acme'; // re-key the admin's seed row onto the shared tenant 'acme'

  var alicePersonId = pool._seedPerson('alice-github');
  await teamManagement.addOrUpdateTeammate(pool, 'acme', 'alice-github', 'engineer');

  var aliceRole = await teamManagement.getRoleForPersonInTenant(pool, 'acme', alicePersonId);
  var adminRole = await teamManagement.getRoleForPersonInTenant(pool, 'acme', adminPersonId);

  assert.strictEqual(aliceRole, 'engineer', 'AC2: the newly added teammate resolves to the assigned role for tenant acme');
  assert.strictEqual(adminRole, 'admin', "AC2: the admin's own role in the same tenant is unaffected");
  assert.notStrictEqual(aliceRole, adminRole, "AC2: the teammate's role is distinct from the admin's own role in the same tenant");
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — non-admin is denied on the add-teammate endpoint
// ─────────────────────────────────────────────────────────────────────────────

async function testAC3NonAdminDenied() {
  var requireAdminModule = freshRequire(REQUIRE_ADMIN_PATH);
  var teamManagementRoute = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
  var pool = makeFakePool();
  var handlers = teamManagementRoute.createTeamManagementHandlers(pool);

  var handlerCalled = false;
  var wrappedHandler = function(req, res) {
    handlerCalled = true;
    return handlers.handleAddTeammate(req, res);
  };

  var req = mockReq({ session: { userId: 'u1', tenantId: 'acme', role: 'engineer' }, body: { identity: 'alice-github', role: 'engineer' } });
  var res = mockRes();

  requireAdminModule.requireAdmin(req, res, function() { return wrappedHandler(req, res); });

  assert.strictEqual(res.statusCode, 403, 'AC3: non-admin caller is denied with 403 Forbidden');
  assert.strictEqual(handlerCalled, false, 'AC3: the add-teammate handler is never reached for a non-admin caller');

  var state = pool._state();
  assert.strictEqual(state.teamMemberships.length, 0, 'AC3: no team_memberships row is created or modified');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — re-adding an existing member updates their role in place
// ─────────────────────────────────────────────────────────────────────────────

async function testAC4IdempotentReAddUpdatesInPlace() {
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();

  var bobPersonId = pool._seedPerson('bob-github');
  await teamManagement.addOrUpdateTeammate(pool, 'acme', 'bob-github', 'engineer');

  var afterFirstAdd = pool._state().teamMemberships.filter(function(r) { return r.person_id === bobPersonId && r.tenant_id === 'acme'; });
  assert.strictEqual(afterFirstAdd.length, 1, 'AC4 setup: exactly one row exists after the first add');

  var result = await teamManagement.addOrUpdateTeammate(pool, 'acme', 'bob-github', 'product');
  assert.strictEqual(result.updated, true, 'AC4: result flags this as an update to an existing membership, not a fresh add');

  var afterSecondAdd = pool._state().teamMemberships.filter(function(r) { return r.person_id === bobPersonId && r.tenant_id === 'acme'; });
  assert.strictEqual(afterSecondAdd.length, 1, 'AC4: exactly one team_memberships row exists for this person/tenant pair -- not duplicated');
  assert.strictEqual(afterSecondAdd[0].role, 'product', 'AC4: the existing row is updated in place with the new role');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — adding a never-logged-in identity is rejected
// ─────────────────────────────────────────────────────────────────────────────

async function testAC5RejectsNeverLoggedInIdentity() {
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();

  var stateBefore = JSON.parse(JSON.stringify(pool._state()));

  await assert.rejects(
    function() { return teamManagement.addOrUpdateTeammate(pool, 'acme', 'never-logged-in-identity', 'engineer'); },
    function(err) {
      assert.ok(err instanceof teamManagement.UnknownIdentityError, 'AC5: rejection is the dedicated UnknownIdentityError type');
      assert.ok(err.message && err.message.length > 0, 'AC5: rejection carries a clear error message');
      assert.ok(/log in/i.test(err.message), 'AC5: the error explains the teammate must log in at least once first, got: ' + err.message);
      return true;
    },
    'AC5: adding an identity with no existing people row is rejected'
  );

  var stateAfter = pool._state();
  assert.deepStrictEqual(stateAfter.people, stateBefore.people, 'AC5: no placeholder people row is created');
  assert.deepStrictEqual(stateAfter.teamMemberships, stateBefore.teamMemberships, 'AC5: no team_memberships row is created');
}

// ─────────────────────────────────────────────────────────────────────────────
// ADR-025 — tenant-scoped authorization: an admin of tenant A cannot add or
// assign roles for tenant B, even if a request attempts to spoof the tenant
// ─────────────────────────────────────────────────────────────────────────────

async function testADR025TenantScopedAuthorization() {
  var teamManagementRoute = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
  var pool = makeFakePool();
  var handlers = teamManagementRoute.createTeamManagementHandlers(pool);

  pool._seedPerson('carol-github');

  // Admin's real session tenant is 'acme'. The request body attempts to smuggle
  // a different target tenant -- the handler must ignore it entirely; there is
  // no code path that reads a tenant value from the request body at all.
  // sec-perf-s3: handleAddTeammate now requires a valid session-scoped CSRF token.
  var req = mockReq({
    session: { userId: 'admin-1', tenantId: 'acme', role: 'admin', csrfToken: 'test-csrf-token' },
    body: { identity: 'carol-github', role: 'engineer', tenantId: 'other-tenant', _csrf: 'test-csrf-token' }
  });
  var res = mockRes();

  await handlers.handleAddTeammate(req, res);

  assert.strictEqual(res.statusCode, 200, 'ADR-025 setup: the add action succeeds for the admin\'s own tenant');

  var state = pool._state();
  var otherTenantRows = state.teamMemberships.filter(function(r) { return r.tenant_id === 'other-tenant'; });
  var acmeRows = state.teamMemberships.filter(function(r) { return r.tenant_id === 'acme'; });

  assert.strictEqual(otherTenantRows.length, 0, 'ADR-025: zero rows are ever written for the spoofed target tenant');
  assert.strictEqual(acmeRows.length, 1, 'ADR-025: the write lands only in the admin\'s own real session tenant');
}

// ─────────────────────────────────────────────────────────────────────────────
// NFR — audit: role assignment logged with admin id, target person id, role,
// tenant, and timestamp
// ─────────────────────────────────────────────────────────────────────────────

async function testNfrAuditLogging() {
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();
  pool._seedPerson('dave-github');

  var logEvents = [];
  var spyLogger = { info: function(event, data) { logEvents.push({ event: event, data: data }); } };

  await teamManagement.addOrUpdateTeammate(pool, 'acme', 'dave-github', 'viewer', 'admin-user-1', spyLogger);

  var addEvent = logEvents.filter(function(e) { return e.event === 'teammate_added'; })[0];
  assert.ok(addEvent, 'NFR audit: an add-teammate event was logged');
  assert.strictEqual(addEvent.data.adminId, 'admin-user-1', "NFR audit: log entry includes the admin's id");
  assert.ok(addEvent.data.targetPersonId != null, 'NFR audit: log entry includes the target person id');
  assert.strictEqual(addEvent.data.role, 'viewer', 'NFR audit: log entry includes the assigned role');
  assert.strictEqual(addEvent.data.tenantId, 'acme', 'NFR audit: log entry includes the tenant');
  assert.ok(addEvent.data.timestamp, 'NFR audit: log entry includes a timestamp');
}

// ─────────────────────────────────────────────────────────────────────────────
// Server wiring — production wiring check (mirrors tir-s1's own T2 test style:
// reads server.js as text and asserts the expected wiring calls are present)
// ─────────────────────────────────────────────────────────────────────────────

function testServerWiring() {
  var fs = require('fs');
  var src = fs.readFileSync(SERVER_PATH, 'utf8');
  assert.ok(src.indexOf('createTeamManagementHandlers(') !== -1, 'server.js must call createTeamManagementHandlers()');
  assert.ok(src.indexOf('/api/team/members') !== -1, 'server.js must register the POST /api/team/members route');
  assert.ok(src.indexOf('/team/members') !== -1, 'server.js must register the GET /team/members route');
  assert.ok(src.indexOf('requireAdmin') !== -1, 'server.js must gate the team-management routes with requireAdmin');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[tir-s3] Running AC verification tests...\n');

  console.log('AC1 — admin adds an existing person with a role');
  await test('AC1: admin adds an existing person by identity and specifies a role', testAC1AddsExistingPersonWithRole);

  console.log('\nAC2 — assigned role resolves distinctly per-person');
  await test('AC2: assigned role resolves distinctly per-person within the same tenant', testAC2RoleResolvesDistinctlyPerPerson);

  console.log('\nAC3 — non-admin denied');
  await test('AC3: non-admin caller is denied 403 on the add-teammate endpoint', testAC3NonAdminDenied);

  console.log('\nAC4 — idempotent re-add updates in place');
  await test('AC4: re-adding an existing member updates their role in place, not a duplicate row', testAC4IdempotentReAddUpdatesInPlace);

  console.log('\nAC5 — never-logged-in identity rejected');
  await test('AC5: adding a never-logged-in identity is rejected, no placeholder row created', testAC5RejectsNeverLoggedInIdentity);

  console.log('\nADR-025 — tenant-scoped authorization');
  await test('ADR-025: an admin cannot add/assign roles for a tenant other than their own session tenant', testADR025TenantScopedAuthorization);

  console.log('\nNFR — audit logging');
  await test('NFR: add-teammate actions are audit-logged with admin id, target person id, role, tenant, timestamp', testNfrAuditLogging);

  console.log('\nServer wiring');
  await test('server.js wires the team-management routes behind requireAdmin', testServerWiring);

  console.log('\n[tir-s3] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[tir-s3] Unexpected error:', err);
  process.exit(1);
});
