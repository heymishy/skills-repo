'use strict';

// check-catc-s1-admin-topup-tenant-check-fix.js — regression guard for catc-s1:
// getValidTenantIds() (src/web-ui/modules/credits.js) previously only allowlisted
// tenantIds already present in the `credits` table -- a circular definition that
// rejects every brand-new tenant (the exact population a first-time admin top-up
// needs to reach). Fixed to query the de-duplicated union of users.email,
// team_memberships.tenant_id, and credits.tenant_id.
//
// See: artefacts/2026-07-23-credits-admin-topup-tenant-check-fix/stories/catc-s1.md
//      artefacts/2026-07-23-credits-admin-topup-tenant-check-fix/test-plans/catc-s1-test-plan.md
//      artefacts/2026-07-23-credits-upsert-fix/decisions.md (originating GAP entry)

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

var CREDITS_PATH = path.resolve(__dirname, '../src/web-ui/modules/credits.js');
var ADMIN_CREDITS_PATH = path.resolve(__dirname, '../src/web-ui/routes/admin-credits.js');

function freshRequireCredits() {
  delete require.cache[require.resolve(CREDITS_PATH)];
  return require(CREDITS_PATH);
}

function freshRequireAdminCredits(creditsMod) {
  if (creditsMod) {
    delete require.cache[require.resolve(CREDITS_PATH)];
    require.cache[require.resolve(CREDITS_PATH)] = {
      id: require.resolve(CREDITS_PATH),
      filename: require.resolve(CREDITS_PATH),
      loaded: true,
      exports: creditsMod
    };
  }
  delete require.cache[require.resolve(ADMIN_CREDITS_PATH)];
  return require(ADMIN_CREDITS_PATH);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

var TEST_CSRF_TOKEN = 'catc-s1-test-csrf-token';

function makeReqFromBody(bodyStr, session) {
  session.csrfToken = TEST_CSRF_TOKEN;
  var bodyWithCsrf = bodyStr + '&_csrf=' + TEST_CSRF_TOKEN;
  return {
    session: session,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    on: function(event, cb) {
      if (event === 'data') cb(bodyWithCsrf);
      if (event === 'end') cb();
    }
  };
}

// Fake DB dispatching on exact per-table SQL shape. Each table's row set is
// independently controlled so tests can prove a tenantId lives in exactly one
// (or zero, or overlapping) of the three tables.
function makeThreeTableMockDb(opts) {
  opts = opts || {};
  var users = opts.users || [];               // array of email strings
  var teamMemberships = opts.teamMemberships || []; // array of tenant_id strings
  var credits = opts.credits || [];            // array of tenant_id strings
  var adjustCalled = false;
  var db = {
    query: async function(sql, params) {
      if (sql.includes('SELECT email FROM users')) {
        return { rows: users.map(function(e) { return { email: e }; }) };
      }
      if (sql.includes('SELECT tenant_id FROM team_memberships')) {
        return { rows: teamMemberships.map(function(t) { return { tenant_id: t }; }) };
      }
      if (sql.includes('SELECT tenant_id FROM credits')) {
        return { rows: credits.map(function(t) { return { tenant_id: t }; }) };
      }
      if (sql.includes('INSERT INTO credits') && sql.includes('ON CONFLICT') && sql.includes('RETURNING')) {
        adjustCalled = true;
        var delta = params[0];
        return { rows: [{ balance: delta }] };
      }
      if (sql.includes('INSERT INTO credit_audit_log')) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
  db._adjustCalledGetter = function() { return adjustCalled; };
  return db;
}

async function main() {
  var queue = [];

  // UT1 (AC1): tenantId with only a `users` row can be topped up
  queue.push(function() {
    console.log('\n[catc-s1] UT1 -- users-only tenant admitted, admin top-up succeeds (AC1)');
    return test('adminCreditsPost: tenantId present only in users table succeeds (302)', async function() {
      var credits = freshRequireCredits();
      var db = makeThreeTableMockDb({ users: ['newtenant@example.test'], teamMemberships: [], credits: [] });
      credits.setCreditsAdapter(db);
      var handler = freshRequireAdminCredits(credits);

      var req = makeReqFromBody('tenantId=newtenant@example.test&amount=100', { userId: 1, login: 'admin', role: 'admin' });
      var res = makeRes();
      await handler.adminCreditsPost(req, res);

      assert.strictEqual(res._status, 302, 'Expected 302 for a brand-new users-only tenant, got ' + res._status + ' body=' + res._body);
      assert.ok(db._adjustCalledGetter(), 'adjustBalanceWithAudit must have been called');
    });
  });

  // UT2 (AC2): tenantId in none of the 3 tables is still rejected
  queue.push(function() {
    console.log('\n[catc-s1] UT2 -- tenantId in no table rejected with 400 (AC2, regression guard)');
    return test('adminCreditsPost: tenantId with no row anywhere is rejected (400)', async function() {
      var credits = freshRequireCredits();
      var db = makeThreeTableMockDb({ users: ['real@example.test'], teamMemberships: ['org-tenant'], credits: ['tenant-existing'] });
      credits.setCreditsAdapter(db);
      var handler = freshRequireAdminCredits(credits);

      var req = makeReqFromBody('tenantId=ghost-tenant&amount=100', { userId: 1, login: 'admin', role: 'admin' });
      var res = makeRes();
      await handler.adminCreditsPost(req, res);

      assert.strictEqual(res._status, 400, 'Expected 400 for a tenantId with no row anywhere, got ' + res._status);
      var body = JSON.parse(res._body);
      assert.ok(body.error && body.error.toLowerCase().includes('unknown'), 'Error must mention unknown tenantId');
      assert.ok(!db._adjustCalledGetter(), 'adjustBalanceWithAudit must NOT have been called for an unknown tenantId');
    });
  });

  // UT3 (AC3): existing credits-only tenant unaffected (no regression)
  queue.push(function() {
    console.log('\n[catc-s1] UT3 -- existing credits-only tenant unaffected (AC3, regression guard)');
    return test('adminCreditsPost: tenantId already present in credits table succeeds unchanged (302)', async function() {
      var credits = freshRequireCredits();
      var db = makeThreeTableMockDb({ users: [], teamMemberships: [], credits: ['tenant-existing'] });
      credits.setCreditsAdapter(db);
      var handler = freshRequireAdminCredits(credits);

      var req = makeReqFromBody('tenantId=tenant-existing&amount=50', { userId: 1, login: 'admin', role: 'admin' });
      var res = makeRes();
      await handler.adminCreditsPost(req, res);

      assert.strictEqual(res._status, 302, 'Expected 302 for an existing credits-row tenant, got ' + res._status);
    });
  });

  // UT4 (AC4): tenantId with only a team_memberships row can be topped up
  queue.push(function() {
    console.log('\n[catc-s1] UT4 -- team_memberships-only tenant admitted (AC4)');
    return test('adminCreditsPost: tenantId present only in team_memberships table succeeds (302)', async function() {
      var credits = freshRequireCredits();
      var db = makeThreeTableMockDb({ users: [], teamMemberships: ['org-tenant'], credits: [] });
      credits.setCreditsAdapter(db);
      var handler = freshRequireAdminCredits(credits);

      var req = makeReqFromBody('tenantId=org-tenant&amount=25', { userId: 1, login: 'admin', role: 'admin' });
      var res = makeRes();
      await handler.adminCreditsPost(req, res);

      assert.strictEqual(res._status, 302, 'Expected 302 for a team_memberships-only tenant, got ' + res._status + ' body=' + res._body);
    });
  });

  // UT5 (AC5): getValidTenantIds returns de-duplicated union across all 3 tables
  queue.push(function() {
    console.log('\n[catc-s1] UT5 -- getValidTenantIds returns de-duplicated union of users/team_memberships/credits (AC5)');
    return test('getValidTenantIds: de-duplicated union across all 3 source tables', async function() {
      var credits = freshRequireCredits();
      var db = makeThreeTableMockDb({
        users: ['a@x.test', 'shared@x.test'],
        teamMemberships: ['shared@x.test', 'org-b'],
        credits: ['tenant-c']
      });
      credits.setCreditsAdapter(db);

      var ids = await credits.getValidTenantIds();
      assert.ok(Array.isArray(ids), 'getValidTenantIds must return an array');
      assert.strictEqual(ids.length, 4, 'Expected 4 distinct entries (shared@x.test de-duplicated), got ' + JSON.stringify(ids));
      ['a@x.test', 'shared@x.test', 'org-b', 'tenant-c'].forEach(function(expected) {
        assert.ok(ids.includes(expected), 'Expected ids to include ' + expected + ', got ' + JSON.stringify(ids));
      });
    });
  });

  // Run queue sequentially
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[catc-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[catc-s1] Unexpected error:', err);
  process.exit(1);
});
