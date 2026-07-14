'use strict';

// check-sec-perf-s3-team-members-csrf.js — AC2 (story sec-perf-s3)
// Story: artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s3.md

var assert = require('assert');
var path = require('path');

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
var TEAM_MANAGEMENT_ROUTE_PATH = path.resolve(ROOT, 'src/web-ui/routes/team-management.js');
var REQUIRE_ADMIN_PATH = path.resolve(ROOT, 'src/web-ui/middleware/require-admin.js');

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
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: undefined
  }, overrides || {});
}

function mockRes() {
  var r = { statusCode: null, body: '', headers: {} };
  r.writeHead = function(code, hdrs) { r.statusCode = code; Object.assign(r.headers, hdrs || {}); };
  r.end = function(b) { r.body = (b != null ? String(b) : ''); r._ended = true; };
  return r;
}

function makeFakePool() {
  var teamMemberships = [];
  var nextPersonId = 1;
  var people = [];

  function _findMembership(personId, tenantId) {
    return teamMemberships.filter(function(r) { return r.person_id === personId && r.tenant_id === tenantId; })[0];
  }

  function query(sql, params) {
    var s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
    var p = params || [];

    if (s.indexOf('CREATE TABLE IF NOT EXISTS') === 0) return Promise.resolve({ rows: [] });

    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      return Promise.resolve({ rows: [] });
    }
    // identity-links.js's resolvePersonForIdentity fallback: treats identityKey as a
    // solo-tenant lookup against team_memberships (matches _seedPerson's seeding shape).
    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tm = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; });
      return Promise.resolve({ rows: tm.length ? [{ person_id: tm[0].person_id }] : [] });
    }
    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var found = _findMembership(p[1], p[0]);
      return Promise.resolve({ rows: found ? [{ role: found.role }] : [] });
    }
    if (s.indexOf('INSERT INTO TEAM_MEMBERSHIPS') === 0) {
      var personId = p[0], tenantId = p[1], role = p[2];
      var existing = _findMembership(personId, tenantId);
      if (existing) { existing.role = role; } else { teamMemberships.push({ person_id: personId, tenant_id: tenantId, role: role }); }
      return Promise.resolve({ rows: [] });
    }
    if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) {
      var person = { id: nextPersonId++ };
      people.push(person);
      return Promise.resolve({ rows: [{ id: person.id }] });
    }
    return Promise.resolve({ rows: [] });
  }

  // Test-setup helper (mirrors tests/check-tir-s3-admin-adds-teammate.js's own
  // convention): seeds a person already known to tir-s1's schema (a
  // team_memberships row keyed by their own identity as a solo tenant),
  // simulating someone who has logged in at least once before an admin adds them.
  function _seedPerson(identityKey, role) {
    var person = { id: nextPersonId++ };
    people.push(person);
    teamMemberships.push({ person_id: person.id, tenant_id: identityKey, role: role || 'user' });
    return person.id;
  }

  return { query: query, _seedPerson: _seedPerson, _state: function() { return { teamMemberships: teamMemberships }; } };
}

function extractCsrfValue(html) {
  var m = html.match(/name="_csrf" value="([^"]*)"/);
  return m ? m[1] : null;
}

async function run() {
  console.log('=== sec-perf-s3 AC2: team member add/role-assign CSRF protection ===');

  var queue = [];

  // AC2a: POST with no _csrf field -> 403, no membership written
  queue.push(function() {
    return test('AC2a: POST /api/team/members with no _csrf field returns 403', async function() {
      var teamManagementRoute = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
      var pool = makeFakePool();
      pool._seedPerson('alice-github');
      var handlers = teamManagementRoute.createTeamManagementHandlers(pool);

      var req = mockReq({
        session: { userId: 'u1', tenantId: 'acme', role: 'admin', csrfToken: 'real-session-token' },
        body: { identity: 'alice-github', role: 'engineer' } // no _csrf field -- pre-fix shape
      });
      var res = mockRes();
      await handlers.handleAddTeammate(req, res);

      assert.strictEqual(res.statusCode, 403, 'Expected 403, got ' + res.statusCode);
      assert.strictEqual(res.body, 'Forbidden');
      // _seedPerson itself writes one identity-resolution row (solo tenant = 'alice-github');
      // the assertion is that no ADDITIONAL row for tenant 'acme' was written.
      var acmeRows = pool._state().teamMemberships.filter(function(r) { return r.tenant_id === 'acme'; });
      assert.strictEqual(acmeRows.length, 0, 'no acme-tenant membership must be written without a valid CSRF token');
    });
  });

  // AC2b: POST with mismatched _csrf -> 403
  queue.push(function() {
    return test('AC2b: POST with mismatched _csrf value returns 403', async function() {
      var teamManagementRoute = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
      var pool = makeFakePool();
      pool._seedPerson('alice-github');
      var handlers = teamManagementRoute.createTeamManagementHandlers(pool);

      var req = mockReq({
        session: { userId: 'u1', tenantId: 'acme', role: 'admin', csrfToken: 'real-session-token' },
        body: { identity: 'alice-github', role: 'engineer', _csrf: 'attacker-guess' }
      });
      var res = mockRes();
      await handlers.handleAddTeammate(req, res);

      assert.strictEqual(res.statusCode, 403);
      var acmeRows = pool._state().teamMemberships.filter(function(r) { return r.tenant_id === 'acme'; });
      assert.strictEqual(acmeRows.length, 0);
    });
  });

  // AC2c: full round trip -- GET page, extract real token, POST with it -> succeeds
  queue.push(function() {
    return test('AC2c: round trip -- GET /team/members embeds real token, POST with it succeeds', async function() {
      var teamManagementRoute = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
      var pool = makeFakePool();
      pool._seedPerson('alice-github');
      var handlers = teamManagementRoute.createTeamManagementHandlers(pool);

      var session = { userId: 'u1', tenantId: 'acme', role: 'admin' };
      var getReq = mockReq({ session: session });
      var getRes = mockRes();
      handlers.handleGetTeamMembers(getReq, getRes);
      var token = extractCsrfValue(getRes.body);
      assert.ok(token, 'a _csrf token must be embedded in the rendered team members page HTML');
      assert.strictEqual(session.csrfToken, token, 'the embedded token must be the one stored on the session');

      var postReq = mockReq({
        session: session,
        body: { identity: 'alice-github', role: 'engineer', _csrf: token }
      });
      var postRes = mockRes();
      await handlers.handleAddTeammate(postReq, postRes);

      assert.strictEqual(postRes.statusCode, 200, 'Expected 200 success, got ' + postRes.statusCode);
      var acmeRows = pool._state().teamMemberships.filter(function(r) { return r.tenant_id === 'acme'; });
      assert.strictEqual(acmeRows.length, 1, 'acme-tenant membership must be written on a legitimate round-trip submission');
    });
  });

  // AC2d: requireAdmin still enforced independently of the CSRF check
  queue.push(function() {
    return test('AC2d: non-admin is still denied 403 by requireAdmin, independent of CSRF', async function() {
      var requireAdminModule = freshRequire(REQUIRE_ADMIN_PATH);
      var teamManagementRoute = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
      var pool = makeFakePool();
      var handlers = teamManagementRoute.createTeamManagementHandlers(pool);

      var handlerCalled = false;
      var wrappedHandler = function(req, res) {
        handlerCalled = true;
        return handlers.handleAddTeammate(req, res);
      };

      var req = mockReq({ session: { userId: 'u1', tenantId: 'acme', role: 'engineer', csrfToken: 'real-token' }, body: { identity: 'alice-github', role: 'engineer', _csrf: 'real-token' } });
      var res = mockRes();

      requireAdminModule.requireAdmin(req, res, function() { return wrappedHandler(req, res); });

      assert.strictEqual(res.statusCode, 403, 'non-admin caller is denied with 403 even with a technically-valid CSRF token');
      assert.strictEqual(handlerCalled, false, 'the add-teammate handler is never reached for a non-admin caller');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===');
  if (failed > 0) {
    failures.forEach(function(f) {
      console.log('FAILED:', f.name, '-', f.err && f.err.message || f.err);
    });
    process.exit(1);
  }
  process.exit(0);
}

run();
