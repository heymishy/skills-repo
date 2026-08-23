'use strict';

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

var AGENCY_PROVISIONING_PATH = path.resolve(__dirname, '../src/web-ui/routes/agency-provisioning.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

// Minimal fake pool -- only the ORGANISATIONS query shape this test path touches.
// Mirrors tests/check-story3-self-service-provisioning.js's makeFakePool/_seedOrg convention.
function makeFakePool() {
  var orgs = [];
  var queryLog = [];
  function _norm(sql) { return String(sql).trim().replace(/\s+/g, ' ').toUpperCase(); }
  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];
    queryLog.push({ sql: s, params: p });
    if (s.indexOf('SELECT ORG_ID, NAME, ORG_TYPE, CREATED_AT FROM ORGANISATIONS WHERE ORG_ID') === 0) {
      var match = orgs.filter(function(r) { return r.org_id === p[0]; });
      return Promise.resolve({ rows: match });
    }
    console.warn('[fake-vrne-s4-pool] unhandled query (returning empty rows): ' + s.slice(0, 150));
    return Promise.resolve({ rows: [] });
  }
  return {
    query: query,
    _state: function() { return { orgs: orgs, queryLog: queryLog }; },
    _seedOrg: function(orgId, name, orgType) { orgs.push({ org_id: orgId, name: name, org_type: orgType, created_at: new Date().toISOString() }); }
  };
}

function mockRes() {
  return { _s: null, _b: null, status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; } };
}

async function main() {
  var queue = [];

  // AC5 -- non-agency org still denied for /agency/clients/new, even with a role
  // that would pass the new gate (engineer) -- isolates the pre-existing org-type
  // check specifically, proving the new gate didn't replace or weaken it.
  queue.push(function() {
    console.log('\n[vrne-s4] T-ac5-non-agency-still-denied-create-client');
    return test('AC5: non-agency org still denied on /agency/clients/new (engineer role)', async function() {
      var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
      var pool = makeFakePool();
      pool._seedOrg('standard-org-1', 'Some Org', 'standard');
      var handlers = provisioning.createAgencyProvisioningHandlers(pool);
      var req = { session: { userId: 'u1', role: 'engineer', tenantId: 'standard-org-1', login: 'eng@test' }, body: { name: 'Should Not Be Created' } };
      var res = mockRes();
      await handlers.handlePostCreateClient(req, res);
      assert.strictEqual(res._s, 403, 'expected 403 from the pre-existing org-type check');
      assert.strictEqual(pool._state().orgs.length, 1, 'no new organisations row should be created (only the seeded org should exist)');
    });
  });

  // AC5 -- same for /agency/clients/:id/invite
  queue.push(function() {
    console.log('\n[vrne-s4] T-ac5-non-agency-still-denied-invite');
    return test('AC5: non-agency org still denied on /agency/clients/:id/invite (engineer role)', async function() {
      var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
      var pool = makeFakePool();
      pool._seedOrg('standard-org-2', 'Some Org 2', 'standard');
      var handlers = provisioning.createAgencyProvisioningHandlers(pool);
      var req = { session: { userId: 'u1', role: 'engineer', tenantId: 'standard-org-2', login: 'eng@test' }, params: { id: 'client-1' }, body: { email: 'invitee@test.com' } };
      var res = mockRes();
      await handlers.handlePostInviteUser(req, res);
      assert.strictEqual(res._s, 403, 'expected 403 from the pre-existing org-type check');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[vrne-s4-agency-org-type-regression] AC5 subtotal: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
