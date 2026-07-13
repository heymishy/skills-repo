'use strict';

// check-tir-s4-role-gated-credits-panel.js — tir-s4
// Verifies the admin/credits panel is gated by per-person role, not tenant membership.
// requireAdmin's existing strict-equality check (arl-s2) is already fail-closed by
// construction; this story's tests confirm that behaviour holds when the session
// reflects a genuine per-person role (seeded directly from a team_memberships-shaped
// fixture, per this story's own Test Data Strategy -- no need for the real login flow
// or tir-s3's admin-adds-teammate UI), and adds coverage for the new audit-logging
// requirement (NFR: Audit). Follows this repo's hand-rolled test()/assert style
// (see tests/check-arl-s2-admin-middleware.js) -- no Jest/Mocha.

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

var REQUIRE_ADMIN_PATH = path.resolve(__dirname, '../src/web-ui/middleware/require-admin.js');

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

// ── team_memberships-shaped fixture (seeded directly -- no DB, no login flow) ──
// Mirrors tir-s1's schema shape: one row per (personId, tenantId) pair, each with
// its own role. Two people share tenant 'acme' with DIFFERENT roles -- exactly the
// scenario this story exists to gate correctly.
var TEAM_MEMBERSHIPS = [
  { personId: 'person-X', tenantId: 'acme', role: 'admin' },
  { personId: 'person-Y', tenantId: 'acme', role: 'engineer' }
];

function sessionFor(personId, tenantId) {
  var row = TEAM_MEMBERSHIPS.filter(function(r) { return r.personId === personId && r.tenantId === tenantId; })[0];
  return { userId: personId, tenantId: tenantId, role: row ? row.role : undefined };
}

async function main() {
  var queue = [];

  // ── AC1: non-admin team member sharing the admin's tenant is denied ────────
  queue.push(function() {
    console.log('\n[tir-s4] T1 -- requireAdmin denies a non-admin team member sharing the admin\'s tenant (AC1)');
    return test('requireAdmin: non-admin (person-Y, engineer) sharing tenant acme with an admin is denied 403', function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      var req = { session: sessionFor('person-Y', 'acme') };
      var res = makeRes();
      var nextCalled = false;
      m.requireAdmin(req, res, function() { nextCalled = true; });
      assert.ok(!nextCalled, 'next() must NOT be called for a non-admin team member');
      assert.strictEqual(res._status, 403, 'Expected 403, got ' + res._status);
      var body = JSON.parse(res._body);
      assert.strictEqual(body.error, 'Forbidden');
    });
  });

  // ── AC2: the admin of that same tenant is granted access ───────────────────
  queue.push(function() {
    console.log('\n[tir-s4] T2 -- requireAdmin grants the admin of the same tenant (AC2)');
    return test('requireAdmin: admin (person-X) of tenant acme is granted access', function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      var req = { session: sessionFor('person-X', 'acme') };
      var res = makeRes();
      var nextCalled = false;
      m.requireAdmin(req, res, function() { nextCalled = true; });
      assert.ok(nextCalled, 'next() should be called for the admin');
      assert.strictEqual(res._status, null, 'No response should be written for the admin');
    });
  });

  // ── AC3: solo tenant (single person, no team) is unchanged -- zero regression ──
  queue.push(function() {
    console.log('\n[tir-s4] T3 -- requireAdmin is unchanged for a solo tenant (AC3, zero regression)');
    return test('requireAdmin: solo-tenant admin access is unchanged', function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      // Solo tenant: tenantId is unique to this one person (matches today's common case --
      // no team_memberships row shared with anyone else).
      var req = { session: { userId: 'solo-person', tenantId: 'solo-acme', role: 'admin' } };
      var res = makeRes();
      var nextCalled = false;
      m.requireAdmin(req, res, function() { nextCalled = true; });
      assert.ok(nextCalled, 'next() should be called -- identical behaviour to before this story');
      assert.strictEqual(res._status, null, 'No response should be written for the solo admin');
    });
  });

  // ── AC4: ambiguous/missing/stale role fails closed ──────────────────────────
  queue.push(function() {
    console.log('\n[tir-s4] T4 -- requireAdmin fails closed when the role is missing/stale/ambiguous (AC4)');
    return test('requireAdmin: missing/stale/ambiguous role is denied by default (fail closed)', function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);

      // Case A: role key entirely absent from session (e.g. stale session predating role write).
      var reqMissing = { session: { userId: 'person-Z', tenantId: 'acme' } };
      var resMissing = makeRes();
      var nextMissing = false;
      m.requireAdmin(reqMissing, resMissing, function() { nextMissing = true; });
      assert.ok(!nextMissing, 'next() must NOT be called when role is missing');
      assert.strictEqual(resMissing._status, 403, 'Expected 403 when role is missing');

      // Case B: role explicitly null (ambiguous/corrupt state).
      var m2 = freshRequire(REQUIRE_ADMIN_PATH);
      var reqNull = { session: { userId: 'person-Z', tenantId: 'acme', role: null } };
      var resNull = makeRes();
      var nextNull = false;
      m2.requireAdmin(reqNull, resNull, function() { nextNull = true; });
      assert.ok(!nextNull, 'next() must NOT be called when role is null');
      assert.strictEqual(resNull._status, 403, 'Expected 403 when role is null');

      // Case C: role is an unrecognised/stale string value (not one of the 4 known roles).
      var m3 = freshRequire(REQUIRE_ADMIN_PATH);
      var reqStale = { session: { userId: 'person-Z', tenantId: 'acme', role: 'former-admin-stale-value' } };
      var resStale = makeRes();
      var nextStale = false;
      m3.requireAdmin(reqStale, resStale, function() { nextStale = true; });
      assert.ok(!nextStale, 'next() must NOT be called for an unrecognised/stale role value');
      assert.strictEqual(resStale._status, 403, 'Expected 403 for a stale/unrecognised role');
    });
  });

  // ── NFR: Audit -- denied access attempts are logged (person ID, tenant ID, timestamp) ──
  queue.push(function() {
    console.log('\n[tir-s4] T5 -- denied access attempts are audit-logged (NFR: Audit)');
    return test('requireAdmin: denial is logged with personId, tenantId, and timestamp', function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      var logCalls = [];
      m.setLogger({
        warn: function(event, data) { logCalls.push({ event: event, data: data }); }
      });

      var req = { session: sessionFor('person-Y', 'acme') };
      var res = makeRes();
      m.requireAdmin(req, res, function() {});

      assert.strictEqual(logCalls.length, 1, 'Expected exactly one log call on denial');
      assert.strictEqual(logCalls[0].event, 'admin_access_denied');
      assert.strictEqual(logCalls[0].data.personId, 'person-Y', 'Log must include the denied person\'s ID');
      assert.strictEqual(logCalls[0].data.tenantId, 'acme', 'Log must include the tenant ID');
      assert.ok(logCalls[0].data.timestamp, 'Log must include a timestamp');
      assert.ok(!isNaN(Date.parse(logCalls[0].data.timestamp)), 'timestamp must be a parseable date string');

      // Granting a request must NOT log a denial.
      var logCallsGrant = [];
      m.setLogger({ warn: function(event, data) { logCallsGrant.push({ event: event, data: data }); } });
      var reqAdmin = { session: sessionFor('person-X', 'acme') };
      var resAdmin = makeRes();
      m.requireAdmin(reqAdmin, resAdmin, function() {});
      assert.strictEqual(logCallsGrant.length, 0, 'Granted admin access must not log a denial event');
    });
  });

  // Run queue sequentially
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[tir-s4] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[tir-s4] Unexpected error:', err);
  process.exit(1);
});
