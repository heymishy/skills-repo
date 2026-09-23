#!/usr/bin/env node
// check-rtri-s1-team-roster-api.js — rtri-s1
// Verifies the real team roster read API: listTeamMembers
// (src/web-ui/modules/team-management.js) and handleGetTeamMembersApi
// (src/web-ui/routes/team-management.js). Follows this repo's hand-rolled
// test()/assert style (see tests/check-tir-s3-admin-adds-teammate.js).
//
// AC1: listTeamMembers returns real identity+role for every resolvable member
// AC2: a team_memberships row with no matching person_identities row is
//      silently omitted
// AC3: tenant isolation — only the requested tenant's members are returned
// AC4: GET /api/team/members returns JSON matching the read function's own output
// AC5: unauthenticated request is rejected the same way every other
//      authGuard-protected route already is (302, Location: /)
// Wiring: listTeamMembers also resolves correctly against the real
//      production fake-test-db.js path (NODE_ENV=test server wiring), not
//      just this file's own isolated fake pool

'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

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
var FAKE_TEST_DB_PATH = path.resolve(ROOT, 'src/web-ui/adapters/fake-test-db.js');

var router = require(path.resolve(ROOT, 'src/web-ui/server.js')).router;

function makeRawRes() {
  var statusCode = null, headers = {}, chunks = [];
  return {
    writeHead: function(code, h) { statusCode = code; Object.assign(headers, h || {}); },
    setHeader: function(k, v) { headers[k] = v; },
    end: function(body) { if (body != null) chunks.push(body); },
    _get: function() { return { statusCode: statusCode, headers: headers, body: chunks.join('') }; }
  };
}

function dispatchAndAwait(req) {
  return new Promise(function(resolve, reject) {
    var res = makeRawRes();
    var origEnd = res.end;
    var settled = false;
    res.end = function(body) { origEnd(body); if (!settled) { settled = true; resolve(res._get()); } };
    router(req, res).catch(function(err) { if (!settled) { settled = true; reject(err); } });
  });
}

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

// ── Narrow, self-contained in-memory fake pool ──────────────────────────────
// Mirrors tests/check-tir-s3-admin-adds-teammate.js's own makeFakePool
// convention exactly — a narrow, explicit-branch fake, NOT an extension of
// src/web-ui/adapters/fake-test-db.js (that file's own new branch is
// exercised separately, in the wiring-completeness test added in Task 4).
function makeFakePool() {
  var teamMemberships = []; // { person_id, tenant_id, role }
  var personIdentities = []; // { identity_key, person_id }

  function _norm(sql) {
    return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
  }

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('SELECT TM.ROLE, PI.IDENTITY_KEY FROM TEAM_MEMBERSHIPS TM INNER JOIN PERSON_IDENTITIES PI') === 0) {
      var tenantId = p[0];
      var rows = teamMemberships
        .filter(function(r) { return r.tenant_id === tenantId; })
        .map(function(tm) {
          var pi = personIdentities.filter(function(x) { return x.person_id === tm.person_id; })[0];
          return pi ? { role: tm.role, identity_key: pi.identity_key } : null;
        })
        .filter(function(r) { return r !== null; });
      return Promise.resolve({ rows: rows });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 160));
    return Promise.resolve({ rows: [] });
  }

  // Test-setup helper (not a production query shape) — seeds a fully-resolvable
  // member directly, bypassing SQL, matching tir-s3's own _seedPerson convention.
  function _seedMember(tenantId, personId, role, identityKey) {
    teamMemberships.push({ person_id: personId, tenant_id: tenantId, role: role });
    if (identityKey !== null) {
      personIdentities.push({ identity_key: identityKey, person_id: personId });
    }
  }

  return { query: query, _seedMember: _seedMember };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — listTeamMembers returns real identity + role for every resolvable member
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1ReturnsRealEntries() {
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();

  pool._seedMember('acme', 1, 'engineer', 'alice@example.com');
  pool._seedMember('acme', 2, 'admin', 'bob-gh');

  var members = await teamManagement.listTeamMembers(pool, 'acme');

  assert.strictEqual(members.length, 2, 'AC1: exactly 2 entries returned');
  var byIdentity = {};
  members.forEach(function(m) { byIdentity[m.identity] = m.role; });
  assert.strictEqual(byIdentity['alice@example.com'], 'engineer', 'AC1: alice resolves with her real identity and role');
  assert.strictEqual(byIdentity['bob-gh'], 'admin', 'AC1: bob resolves with his real identity and role');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — a team_memberships row with no matching person_identities row is
// silently omitted
// ─────────────────────────────────────────────────────────────────────────────

async function testAC2SilentlyOmitsUnresolvable() {
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();

  pool._seedMember('acme', 3, 'viewer', null); // no person_identities row for person 3

  var members = await teamManagement.listTeamMembers(pool, 'acme');

  assert.deepStrictEqual(members, [], 'AC2: unresolvable member is silently omitted, not returned as a placeholder/error');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — tenant isolation
// ─────────────────────────────────────────────────────────────────────────────

async function testAC3TenantIsolation() {
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();

  pool._seedMember('acme', 1, 'engineer', 'alice@example.com');
  pool._seedMember('other-tenant', 2, 'admin', 'carol@example.com');

  var members = await teamManagement.listTeamMembers(pool, 'acme');

  assert.strictEqual(members.length, 1, 'AC3: only tenant acme\'s member is returned');
  assert.strictEqual(members[0].identity, 'alice@example.com', 'AC3: the returned member is acme\'s own');
  var identities = members.map(function(m) { return m.identity; });
  assert.ok(identities.indexOf('carol@example.com') === -1, 'AC3: the other tenant\'s member never appears');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — GET /api/team/members returns JSON matching the read function's own output
// ─────────────────────────────────────────────────────────────────────────────

async function testAC4EndpointReturnsMatchingJson() {
  var teamManagementRoute = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();

  pool._seedMember('acme', 1, 'engineer', 'alice@example.com');
  pool._seedMember('acme', 2, 'admin', 'bob-gh');

  var req = mockReq({ session: { accessToken: 'tok', tenantId: 'acme' } });
  var res = mockRes();

  await teamManagementRoute.handleGetTeamMembersApi(req, res, pool);

  assert.strictEqual(res.statusCode, 200, 'AC4: endpoint responds 200');
  var body = JSON.parse(res.body);
  var directOutput = await teamManagement.listTeamMembers(pool, 'acme');
  assert.deepStrictEqual(body.members, directOutput, 'AC4: response body\'s members array deep-equals the read function\'s own direct-call output');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — unauthenticated request rejected the same way every other
// authGuard-protected route already is
// ─────────────────────────────────────────────────────────────────────────────

async function testAC5UnauthenticatedRequestRejected() {
  var req = { headers: {}, method: 'GET', url: '/api/team/members' };
  var result = await dispatchAndAwait(req);

  assert.strictEqual(result.statusCode, 302, 'AC5: unauthenticated request is redirected, matching authGuard\'s real, unmodified behaviour (routes/auth.js line ~536)');
  assert.strictEqual(result.headers.Location, '/', 'AC5: redirect target is the sign-in page, matching every other authGuard-protected route (e.g. GET /api/pods)');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner (extended by later tasks)
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[rtri-s1] Running AC verification tests...\n');

  console.log('AC1 — real entries returned');
  await test('AC1: listTeamMembers returns real identity + role for every resolvable member', testAC1ReturnsRealEntries);

  console.log('\nAC2 — unresolvable silently omitted');
  await test('AC2: a team_memberships row with no matching person_identities row is silently omitted', testAC2SilentlyOmitsUnresolvable);

  console.log('\nAC3 — tenant isolation');
  await test('AC3: listTeamMembers never returns another tenant\'s members', testAC3TenantIsolation);

  console.log('\nAC4 — endpoint returns matching JSON');
  await test('AC4: GET /api/team/members returns a JSON body matching the read function\'s own output', testAC4EndpointReturnsMatchingJson);

  console.log('\nAC5 — unauthenticated request rejected');
  await test('AC5: unauthenticated request is rejected the same way every other authGuard-protected route already is', testAC5UnauthenticatedRequestRejected);

  console.log('\n[rtri-s1] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[rtri-s1] Unexpected error:', err);
  process.exit(1);
});
