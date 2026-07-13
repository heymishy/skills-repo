#!/usr/bin/env node
// check-tir-s5-github-org-bulk-add.js — tir-s5
// Verifies the GitHub-org bulk-add feature: bulkAddFromGithubOrg/OrgAccessError
// (src/web-ui/modules/github-org-bulk-add.js) and the
// POST /api/team/bulk-add-github-org route handler
// (src/web-ui/routes/github-org-bulk-add.js). Follows this repo's hand-rolled
// test()/assert style (see tests/check-tir-s3-admin-adds-teammate.js) — no
// Jest/Mocha.
//
// AC1: admin bulk-adds every org member not already present, default role
//      "engineer"
// AC2: a bulk-added member logs in and resolves identically to a manually
//      added teammate (same write path -- addOrUpdateTeammate -- so tir-s7's
//      resolveRoleForPerson resolves it the same way)
// AC3: re-running bulk-add skips already-present members -- no duplicate
//      rows, no overwrite of a manually-changed role
// AC4: a token missing org-membership read scope fails with a clear,
//      actionable error -- not a silent no-op, not a crash
// NFR (security): bulk-add cannot be pointed at an arbitrary org via request
//      parameters -- there is no org-name request field at all, and every
//      write always lands in req.session.tenantId
// NFR (audit): bulk-add logs admin id, org name, count added, timestamp

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

var BULK_ADD_MODULE_PATH = path.resolve(ROOT, 'src/web-ui/modules/github-org-bulk-add.js');
var BULK_ADD_ROUTE_PATH = path.resolve(ROOT, 'src/web-ui/routes/github-org-bulk-add.js');
var USER_ROLES_PATH = path.resolve(ROOT, 'src/web-ui/modules/user-roles.js');

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
// tests/check-tir-s3-admin-adds-teammate.js's own convention (a narrow,
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
    // getRoleForPersonInTenant / resolveRoleForPerson.
    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND PERSON_ID') !== -1) {
      var found = _findMembership(p[1], p[0]);
      return Promise.resolve({ rows: found ? [{ role: found.role }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE PERSON_ID') === 0 && s.indexOf('AND TENANT_ID') !== -1) {
      var found2 = _findMembership(p[0], p[1]);
      return Promise.resolve({ rows: found2 ? [{ role: found2.role }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tenantOnly = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; });
      return Promise.resolve({ rows: tenantOnly.length ? [{ role: tenantOnly[0].role }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM USER_ROLES WHERE TENANT_ID') === 0) {
      return Promise.resolve({ rows: [] });
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

  // Test-setup helper — seeds a person who has logged in at least once
  // (a people row exists, resolvable via their own solo tenant_id membership
  // row) but who is NOT yet a member of the admin's tenant. Mirrors
  // tir-s3's own `_seedPerson` convention exactly.
  function _seedKnownPerson(identityKey) {
    var person = { id: nextPersonId++ };
    people.push(person);
    teamMemberships.push({ person_id: person.id, tenant_id: identityKey, role: 'user' });
    return person.id;
  }

  // Test-setup helper — seeds a person who is ALREADY a member of a given
  // tenant with a given role (simulates an earlier manual add or bulk-add).
  function _seedTenantMember(identityKey, tenantId, role) {
    var personId = _seedKnownPerson(identityKey);
    teamMemberships.push({ person_id: personId, tenant_id: tenantId, role: role });
    return personId;
  }

  return {
    query: query,
    _seedKnownPerson: _seedKnownPerson,
    _seedTenantMember: _seedTenantMember,
    _state: function() { return { people: people, teamMemberships: teamMemberships, personIdentities: personIdentities }; }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — bulk-add creates memberships for every org member not already present
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1BulkAddCreatesMembershipsForNewMembers() {
  var bulkAdd = freshRequire(BULK_ADD_MODULE_PATH);
  var pool = makeFakePool();

  pool._seedKnownPerson('alice-gh');
  pool._seedKnownPerson('bob-gh');
  pool._seedKnownPerson('carol-gh');

  var fetchOrgs = async function() {
    return { orgs: [{ login: 'alice-gh' }, { login: 'bob-gh' }, { login: 'carol-gh' }], nextPage: null };
  };

  var result = await bulkAdd.bulkAddFromGithubOrg(pool, 'acme', fetchOrgs, 'fake-token', 'admin-1');

  assert.strictEqual(result.addedCount, 3, 'AC1: 3 members added');
  assert.strictEqual(result.totalOrgMembers, 3, 'AC1: 3 total org members seen');

  var state = pool._state();
  var acmeRows = state.teamMemberships.filter(function(r) { return r.tenant_id === 'acme'; });
  assert.strictEqual(acmeRows.length, 3, 'AC1: 3 new team_memberships rows exist for tenant acme');
  acmeRows.forEach(function(r) {
    assert.strictEqual(r.role, 'engineer', 'AC1: each new row carries the default role engineer');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — a bulk-added member logs in and resolves identically to a manually
// added teammate (same write path, no separate login code path)
// ─────────────────────────────────────────────────────────────────────────────

async function testAC2BulkAddedMemberResolvesLikeManualAdd() {
  var bulkAdd = freshRequire(BULK_ADD_MODULE_PATH);
  var userRoles = freshRequire(USER_ROLES_PATH);
  var pool = makeFakePool();

  pool._seedKnownPerson('dave-gh');

  var fetchOrgs = async function() {
    return { orgs: [{ login: 'dave-gh' }], nextPage: null };
  };

  await bulkAdd.bulkAddFromGithubOrg(pool, 'acme', fetchOrgs, 'fake-token', 'admin-1');

  var role = await userRoles.resolveRoleForPerson(pool, 'dave-gh', 'acme');
  assert.strictEqual(role, 'engineer', 'AC2: bulk-added member resolves to engineer via the same person-scoped login resolution as a manual add');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — re-running bulk-add skips existing members and does not overwrite a
// manually-changed role
// ─────────────────────────────────────────────────────────────────────────────

async function testAC3RerunSkipsExistingAndDoesNotOverwrite() {
  var bulkAdd = freshRequire(BULK_ADD_MODULE_PATH);
  var pool = makeFakePool();

  // erin-gh was already manually added/changed to role 'product' before this run.
  pool._seedTenantMember('erin-gh', 'acme', 'product');
  pool._seedKnownPerson('frank-gh');
  pool._seedKnownPerson('grace-gh');

  var fetchOrgs = async function() {
    return { orgs: [{ login: 'erin-gh' }, { login: 'frank-gh' }, { login: 'grace-gh' }], nextPage: null };
  };

  var firstRun = await bulkAdd.bulkAddFromGithubOrg(pool, 'acme', fetchOrgs, 'fake-token', 'admin-1');
  assert.strictEqual(firstRun.addedCount, 2, 'AC3 setup: first run adds only the 2 not-yet-present members');
  assert.strictEqual(firstRun.skippedCount, 1, 'AC3 setup: first run skips the already-present member');

  // Re-run bulk-add a second time with the same org member list.
  var secondRun = await bulkAdd.bulkAddFromGithubOrg(pool, 'acme', fetchOrgs, 'fake-token', 'admin-1');
  assert.strictEqual(secondRun.addedCount, 0, 'AC3: re-run adds no new members');
  assert.strictEqual(secondRun.skippedCount, 3, 'AC3: re-run skips all 3, now-present members');

  var state = pool._state();
  var acmeRows = state.teamMemberships.filter(function(r) { return r.tenant_id === 'acme'; });
  assert.strictEqual(acmeRows.length, 3, 'AC3: exactly 3 team_memberships rows exist total -- no duplicates');

  var erinRole = acmeRows.filter(function(r) { return r.role === 'product'; });
  assert.strictEqual(erinRole.length, 1, "AC3: the manually-set role 'product' still exists on exactly one row");

  var otherRoles = acmeRows.filter(function(r) { return r.role === 'engineer'; });
  assert.strictEqual(otherRoles.length, 2, 'AC3: the other 2 members carry the default engineer role, unaffected by the re-run');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — missing org-membership read scope fails with a clear, actionable error
// ─────────────────────────────────────────────────────────────────────────────

async function testAC4MissingScopeFailsWithClearError() {
  var bulkAdd = freshRequire(BULK_ADD_MODULE_PATH);
  var pool = makeFakePool();

  var fetchOrgs = async function() {
    var e = new Error('Bad credentials');
    e.status = 401;
    throw e;
  };

  await assert.rejects(
    function() { return bulkAdd.bulkAddFromGithubOrg(pool, 'acme', fetchOrgs, 'scopeless-token', 'admin-1'); },
    function(err) {
      assert.ok(err instanceof bulkAdd.OrgAccessError, 'AC4: rejection is the dedicated OrgAccessError type');
      assert.ok(/read:org|permission|scope/i.test(err.message), 'AC4: error message names the missing permission, got: ' + err.message);
      return true;
    },
    'AC4: a token missing org-membership read scope fails with a clear error'
  );

  var state = pool._state();
  assert.strictEqual(state.teamMemberships.length, 0, 'AC4: no team_memberships row is created -- not a silent no-op, not a partial write');
}

// ─────────────────────────────────────────────────────────────────────────────
// NFR (security) — bulk-add cannot be pointed at an arbitrary org via
// request parameters; it only ever operates within the admin's own tenant
// ─────────────────────────────────────────────────────────────────────────────

async function testNfrSecurityCannotTargetArbitraryOrg() {
  var route = freshRequire(BULK_ADD_ROUTE_PATH);
  var pool = makeFakePool();

  pool._seedKnownPerson('henry-gh');

  var fetchOrgsCallArgs = [];
  var fetchOrgs = async function(accessToken, page) {
    fetchOrgsCallArgs.push({ accessToken: accessToken, page: page });
    return { orgs: [{ login: 'henry-gh' }], nextPage: null };
  };

  var handlers = route.createGithubOrgBulkAddHandlers(pool, function() { return fetchOrgs; });

  // Attempt to smuggle a different target org/tenant in the request body --
  // the handler must ignore it entirely; there is no code path that reads an
  // org/tenant value from the request body at all.
  var req = mockReq({
    session: { userId: 'admin-1', tenantId: 'acme', role: 'admin', accessToken: 'real-token' },
    body: { org: 'some-other-org', tenantId: 'some-other-org' }
  });
  var res = mockRes();

  await handlers.handleBulkAddFromGithubOrg(req, res);

  assert.strictEqual(res.statusCode, 200, 'NFR security setup: the bulk-add action succeeds for the admin\'s own tenant');

  fetchOrgsCallArgs.forEach(function(call) {
    assert.strictEqual(call.accessToken, 'real-token', 'NFR security: fetchOrgs is always called with the admin\'s own session accessToken');
  });

  var state = pool._state();
  var otherOrgRows = state.teamMemberships.filter(function(r) { return r.tenant_id === 'some-other-org'; });
  var acmeRows = state.teamMemberships.filter(function(r) { return r.tenant_id === 'acme'; });

  assert.strictEqual(otherOrgRows.length, 0, 'NFR security: zero rows are ever written for the spoofed target org/tenant');
  assert.strictEqual(acmeRows.length, 1, 'NFR security: the write lands only in the admin\'s own real session tenant');
}

// ─────────────────────────────────────────────────────────────────────────────
// NFR (audit) — bulk-add action logged (admin id, org name, count added, timestamp)
// ─────────────────────────────────────────────────────────────────────────────

async function testNfrAuditLogging() {
  var bulkAdd = freshRequire(BULK_ADD_MODULE_PATH);
  var pool = makeFakePool();

  pool._seedKnownPerson('ida-gh');

  var fetchOrgs = async function() {
    return { orgs: [{ login: 'ida-gh' }], nextPage: null };
  };

  var logEvents = [];
  var spyLogger = { info: function(event, data) { logEvents.push({ event: event, data: data }); } };

  await bulkAdd.bulkAddFromGithubOrg(pool, 'acme', fetchOrgs, 'fake-token', 'admin-1', spyLogger);

  var completedEvent = logEvents.filter(function(e) { return e.event === 'bulk_add_completed'; })[0];
  assert.ok(completedEvent, 'NFR audit: a bulk_add_completed event was logged');
  assert.strictEqual(completedEvent.data.adminId, 'admin-1', "NFR audit: log entry includes the admin's id");
  assert.ok(completedEvent.data.orgName, 'NFR audit: log entry includes the org name');
  assert.strictEqual(completedEvent.data.addedCount, 1, 'NFR audit: log entry includes the count of members added');
  assert.ok(completedEvent.data.timestamp, 'NFR audit: log entry includes a timestamp');
}

// ─────────────────────────────────────────────────────────────────────────────
// Server wiring — production wiring check (mirrors tir-s3's own test style:
// reads server.js as text and asserts the expected wiring calls are present)
// ─────────────────────────────────────────────────────────────────────────────

function testServerWiring() {
  var fs = require('fs');
  var SERVER_PATH = path.resolve(ROOT, 'src/web-ui/server.js');
  var src = fs.readFileSync(SERVER_PATH, 'utf8');
  assert.ok(src.indexOf('createGithubOrgBulkAddHandlers(') !== -1, 'server.js must call createGithubOrgBulkAddHandlers()');
  assert.ok(src.indexOf('/api/team/bulk-add-github-org') !== -1, 'server.js must register the POST /api/team/bulk-add-github-org route');
  assert.ok(src.indexOf('getFetchOrgs') !== -1, 'server.js must pass the getFetchOrgs accessor to the bulk-add handlers');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[tir-s5] Running AC verification tests...\n');

  console.log('AC1 — bulk-add creates memberships for new org members');
  await test('AC1: bulk-add creates memberships for every org member not already present, role engineer', testAC1BulkAddCreatesMembershipsForNewMembers);

  console.log('\nAC2 — bulk-added member resolves like a manual add');
  await test('AC2: a bulk-added member logs in and resolves identically to a manually-added teammate', testAC2BulkAddedMemberResolvesLikeManualAdd);

  console.log('\nAC3 — re-run skips existing members, no overwrite');
  await test('AC3: re-running bulk-add skips existing members and does not overwrite a manually-changed role', testAC3RerunSkipsExistingAndDoesNotOverwrite);

  console.log('\nAC4 — missing scope fails with a clear error');
  await test('AC4: missing org-membership read scope fails with a clear, actionable error', testAC4MissingScopeFailsWithClearError);

  console.log('\nNFR security — cannot target an arbitrary org');
  await test('NFR security: bulk-add cannot be pointed at an arbitrary org via request parameters', testNfrSecurityCannotTargetArbitraryOrg);

  console.log('\nNFR audit — bulk-add action logged');
  await test('NFR audit: bulk-add action logged with admin id, org name, count added, timestamp', testNfrAuditLogging);

  console.log('\nServer wiring');
  await test('server.js wires the github-org-bulk-add route behind requireAdmin', testServerWiring);

  console.log('\n[tir-s5] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[tir-s5] Unexpected error:', err);
  process.exit(1);
});
