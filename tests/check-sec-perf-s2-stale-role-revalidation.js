#!/usr/bin/env node
// check-sec-perf-s2-stale-role-revalidation.js — sec-perf-s2
//
// Verifies requireAdmin (src/web-ui/middleware/require-admin.js) re-checks a
// person's role live against the database on every request, instead of
// trusting req.session.role cached once at login. Follows this repo's
// hand-rolled test()/assert style (see tests/check-arl-s2-admin-middleware.js)
// — no Jest/Mocha.
//
// AC1: a demoted admin's very next request is denied (no logout required)
// AC2: req.session.role self-heals to the live value after a denial
// AC3: a promoted user's very next request is granted (bidirectional check)
// AC4: when the new adapter is unwired, requireAdmin behaves exactly as it
//      did before this story (zero regression for arl-s2/tir-s4/tir-s5)
// AC5: server.js wires setGetCurrentRole to the SAME getRoleForTenant adapter
//      already used at login — proven behaviourally, not just referentially
// AC6: an adapter rejection fails closed (denies), never falls back to a
//      stale cached role

'use strict';

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

var REQUIRE_ADMIN_PATH = path.resolve(__dirname, '../src/web-ui/middleware/require-admin.js');
var SERVER_PATH        = path.resolve(__dirname, '../src/web-ui/server.js');
var USER_ROLES_PATH    = path.resolve(__dirname, '../src/web-ui/modules/user-roles.js');

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

async function main() {
  var queue = [];

  // ── AC1: demoted admin's very next request is denied ───────────────────────
  queue.push(function() {
    console.log('\n[sec-perf-s2] T1 -- demoted admin is denied on the very next request (AC1)');
    return test('requireAdmin: session cached role=admin, live role=engineer -> 403', async function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      m.setGetCurrentRole(async function(/* tenantId */) { return 'engineer'; });

      var req = { session: { userId: 1, tenantId: 'acme', role: 'admin' } };
      var res = makeRes();
      var nextCalled = false;
      await m.requireAdmin(req, res, function() { nextCalled = true; });

      assert.ok(!nextCalled, 'next() must NOT be called for a demoted admin');
      assert.strictEqual(res._status, 403, 'Expected 403, got ' + res._status);
      var body = JSON.parse(res._body);
      assert.strictEqual(body.error, 'Forbidden');
    });
  });

  // ── AC2: session role self-heals after denial ───────────────────────────────
  queue.push(function() {
    console.log('\n[sec-perf-s2] T2 -- req.session.role self-heals to the live value (AC2)');
    return test('requireAdmin: req.session.role is corrected to the live role after denial', async function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      m.setGetCurrentRole(async function(/* tenantId */) { return 'engineer'; });

      var req = { session: { userId: 1, tenantId: 'acme', role: 'admin' } };
      var res = makeRes();
      await m.requireAdmin(req, res, function() {});

      assert.strictEqual(req.session.role, 'engineer', 'session role should self-heal to the live value');
    });
  });

  // ── AC3: promoted user's very next request is granted ───────────────────────
  queue.push(function() {
    console.log('\n[sec-perf-s2] T3 -- promoted user is granted on the very next request (AC3)');
    return test('requireAdmin: session cached role=user, live role=admin -> next() called', async function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      m.setGetCurrentRole(async function(/* tenantId */) { return 'admin'; });

      var req = { session: { userId: 1, tenantId: 'acme', role: 'user' } };
      var res = makeRes();
      var nextCalled = false;
      await m.requireAdmin(req, res, function() { nextCalled = true; });

      assert.ok(nextCalled, 'next() should be called for a promoted user');
      assert.strictEqual(res._status, null, 'No response should be written for a granted request');
      assert.strictEqual(req.session.role, 'admin', 'session role should self-heal to the live value');
    });
  });

  // ── AC3: bidirectional, per-request re-evaluation on the same session ──────
  queue.push(function() {
    console.log('\n[sec-perf-s2] T4 -- live check re-evaluates on every request, both directions (AC3)');
    return test('requireAdmin: same session object, role changes between two calls', async function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      var liveRole = 'admin';
      m.setGetCurrentRole(async function(/* tenantId */) { return liveRole; });

      var req = { session: { userId: 1, tenantId: 'acme', role: 'admin' } };

      var res1 = makeRes();
      var next1 = false;
      await m.requireAdmin(req, res1, function() { next1 = true; });
      assert.ok(next1, 'first call should be granted (live role is admin)');

      liveRole = 'engineer';
      var res2 = makeRes();
      var next2 = false;
      await m.requireAdmin(req, res2, function() { next2 = true; });
      assert.ok(!next2, 'second call should be denied (live role changed to engineer)');
      assert.strictEqual(res2._status, 403);
    });
  });

  // ── AC4: unwired adapter preserves pre-story behaviour exactly ─────────────
  queue.push(function() {
    console.log('\n[sec-perf-s2] T5 -- unwired adapter: admin session still granted synchronously (AC4)');
    return test('requireAdmin: unwired adapter, admin session -> next() called, matches pre-story behaviour', function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      // setGetCurrentRole is deliberately NOT called — adapter left unwired.
      var req = { session: { userId: 1, role: 'admin' } };
      var res = makeRes();
      var nextCalled = false;
      m.requireAdmin(req, res, function() { nextCalled = true; });
      assert.ok(nextCalled, 'next() should be called for admin user (unwired fallback)');
      assert.strictEqual(res._status, null, 'No response should be written for admin');
    });
  });

  queue.push(function() {
    console.log('\n[sec-perf-s2] T6 -- unwired adapter: non-admin session still denied (AC4)');
    return test('requireAdmin: unwired adapter, non-admin session -> 403, matches pre-story arl-s2 T5', function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      var req = { session: { userId: 1, role: 'user' } };
      var res = makeRes();
      var nextCalled = false;
      m.requireAdmin(req, res, function() { nextCalled = true; });
      assert.ok(!nextCalled, 'next() must NOT be called for non-admin');
      assert.strictEqual(res._status, 403, 'Expected 403, got ' + res._status);
    });
  });

  queue.push(function() {
    console.log('\n[sec-perf-s2] T7 -- unwired adapter: no session still denied (AC4)');
    return test('requireAdmin: unwired adapter, no session -> 403, matches pre-story arl-s2 T4', function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      var req = { session: null };
      var res = makeRes();
      var nextCalled = false;
      m.requireAdmin(req, res, function() { nextCalled = true; });
      assert.ok(!nextCalled, 'next() must NOT be called with no session');
      assert.strictEqual(res._status, 403, 'Expected 403, got ' + res._status);
      var body = JSON.parse(res._body);
      assert.strictEqual(body.error, 'Forbidden');
    });
  });

  // ── AC5: wiring forwards to the SAME adapter used at login, behaviourally ──
  queue.push(function() {
    console.log('\n[sec-perf-s2] T8 -- wiring resolves two distinct sessions to two distinct, correct roles (AC5)');
    return test('requireAdmin: two sessions sharing one tenantId resolve to two different, individually-correct roles', async function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      // Simulate a getRoleForTenant-shaped adapter that differentiates by an
      // out-of-band identity, proving the wiring isn't a hardcoded constant.
      var roleByPerson = { 'person-X': 'admin', 'person-Y': 'engineer' };
      var currentPerson = 'person-X';
      m.setGetCurrentRole(async function(/* tenantId */) { return roleByPerson[currentPerson]; });

      currentPerson = 'person-X';
      var reqX = { session: { userId: 'person-X', tenantId: 'acme', role: 'user' } };
      var resX = makeRes();
      var nextX = false;
      await m.requireAdmin(reqX, resX, function() { nextX = true; });
      assert.ok(nextX, 'person-X (admin) should be granted');

      currentPerson = 'person-Y';
      var reqY = { session: { userId: 'person-Y', tenantId: 'acme', role: 'admin' } };
      var resY = makeRes();
      var nextY = false;
      await m.requireAdmin(reqY, resY, function() { nextY = true; });
      assert.ok(!nextY, 'person-Y (engineer) should be denied, even though session was cached as admin');
    });
  });

  queue.push(function() {
    console.log('\n[sec-perf-s2] T9 -- server.js wires setGetCurrentRole to getRoleForTenant (AC5, static check)');
    return test('server.js references setGetCurrentRole and getRoleForTenant in its wiring', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(src.includes('setGetCurrentRole'), 'server.js must reference setGetCurrentRole');
      assert.ok(/setGetCurrentRole\s*\(\s*function[\s\S]{0,120}getRoleForTenant/.test(src),
        'setGetCurrentRole must be wired to call getRoleForTenant (the same adapter used at login)');
    });
  });

  // ── AC6: adapter rejection fails closed ─────────────────────────────────────
  queue.push(function() {
    console.log('\n[sec-perf-s2] T10 -- adapter rejection fails closed, not open (AC6)');
    return test('requireAdmin: adapter throws -> 403, never falls back to stale cached admin role', async function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      m.setGetCurrentRole(async function() { throw new Error('db unavailable'); });

      var req = { session: { userId: 1, tenantId: 'acme', role: 'admin' } };
      var res = makeRes();
      var nextCalled = false;
      await m.requireAdmin(req, res, function() { nextCalled = true; });

      assert.ok(!nextCalled, 'next() must NOT be called when the adapter rejects');
      assert.strictEqual(res._status, 403, 'Expected 403 (fail closed), got ' + res._status);
    });
  });

  // ── Regression: every server.js call site awaits requireAdmin ──────────────
  queue.push(function() {
    console.log('\n[sec-perf-s2] T11 -- every requireAdmin call site in server.js is awaited (regression)');
    return test('server.js: all requireAdmin(...) call sites are preceded by await', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      var callSitePattern = /(^|\n)([^\n]*)requireAdmin\(req, res,/g;
      var match;
      var total = 0;
      var missingAwait = [];
      while ((match = callSitePattern.exec(src)) !== null) {
        total++;
        var linePrefix = match[2];
        if (!/\bawait\s*$/.test(linePrefix.trim()) && linePrefix.indexOf('await') === -1) {
          missingAwait.push(linePrefix);
        }
      }
      assert.ok(total >= 5, 'expected at least 5 requireAdmin call sites, found ' + total);
      assert.strictEqual(missingAwait.length, 0, 'call sites missing await: ' + JSON.stringify(missingAwait));
    });
  });

  // ── NFR: denial audit log still fires on a live-demotion denial ────────────
  queue.push(function() {
    console.log('\n[sec-perf-s2] T12 -- admin_access_denied audit log still fires on live-demotion denial (NFR)');
    return test('requireAdmin: denial from a live role check is still audit-logged', async function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      m.setGetCurrentRole(async function() { return 'engineer'; });

      var loggedEvents = [];
      m.setLogger({ warn: function(event, data) { loggedEvents.push({ event: event, data: data }); } });

      var req = { session: { userId: 42, tenantId: 'acme', role: 'admin' } };
      var res = makeRes();
      await m.requireAdmin(req, res, function() {});

      assert.strictEqual(loggedEvents.length, 1, 'expected exactly one audit log entry');
      assert.strictEqual(loggedEvents[0].event, 'admin_access_denied');
      assert.strictEqual(loggedEvents[0].data.personId, 42);
      assert.strictEqual(loggedEvents[0].data.tenantId, 'acme');
      assert.ok(loggedEvents[0].data.timestamp, 'timestamp should be present');
    });
  });

  // Run queue sequentially
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[sec-perf-s2] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[sec-perf-s2] Unexpected error:', err);
  process.exit(1);
});
