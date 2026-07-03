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

var CREDITS_GUARD_PATH = path.resolve(__dirname, '../src/web-ui/middleware/credits-guard.js');
var REQUIRE_ADMIN_PATH = path.resolve(__dirname, '../src/web-ui/middleware/require-admin.js');
var CREDITS_PATH = path.resolve(__dirname, '../src/web-ui/modules/credits.js');
var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');

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

  // ── creditsGuard tests ──────────────────────────────────────────────────────

  // T1: admin role bypasses creditsGuard (getBalance NOT called)
  queue.push(function() {
    console.log('\n[arl-s2] T1 -- admin bypasses creditsGuard (getBalance not called)');
    return test('creditsGuard: admin session bypasses balance check', async function() {
      // Wire credits adapter with a spy to detect if getBalance is called
      var creditsMod = freshRequire(CREDITS_PATH);
      var getBalanceCalled = false;
      creditsMod.setCreditsAdapter({
        query: async function() {
          getBalanceCalled = true;
          return { rows: [{ balance: 0 }] }; // balance=0 would block a non-admin
        }
      });

      // Re-require credits-guard with fresh credits module
      delete require.cache[require.resolve(CREDITS_PATH)];
      require.cache[require.resolve(CREDITS_PATH)] = {
        id: require.resolve(CREDITS_PATH),
        filename: require.resolve(CREDITS_PATH),
        loaded: true,
        exports: creditsMod
      };

      delete require.cache[require.resolve(CREDITS_GUARD_PATH)];
      var guard = require(CREDITS_GUARD_PATH);

      var req = { session: { role: 'admin', tenantId: 'admin-tenant' } };
      var res = makeRes();
      var nextCalled = false;
      await guard.creditsGuard(req, res, function() { nextCalled = true; });

      assert.ok(nextCalled, 'next() should be called for admin');
      assert.ok(!getBalanceCalled, 'getBalance must NOT be called for admin');
      assert.strictEqual(res._status, null, 'No response written for admin');
    });
  });

  // T2: non-admin with low balance is blocked (getBalance IS called)
  queue.push(function() {
    console.log('\n[arl-s2] T2 -- non-admin with zero balance is blocked');
    return test('creditsGuard: non-admin with 0 balance returns 402', async function() {
      var creditsMod = freshRequire(CREDITS_PATH);
      creditsMod.setCreditsAdapter({
        query: async function() { return { rows: [{ balance: 0 }] }; }
      });

      delete require.cache[require.resolve(CREDITS_PATH)];
      require.cache[require.resolve(CREDITS_PATH)] = {
        id: require.resolve(CREDITS_PATH),
        filename: require.resolve(CREDITS_PATH),
        loaded: true,
        exports: creditsMod
      };

      delete require.cache[require.resolve(CREDITS_GUARD_PATH)];
      var guard = require(CREDITS_GUARD_PATH);

      var req = { session: { role: 'user', tenantId: 'regular-tenant' } };
      var res = makeRes();
      var nextCalled = false;
      await guard.creditsGuard(req, res, function() { nextCalled = true; });

      assert.ok(!nextCalled, 'next() must NOT be called for 0-balance user');
      assert.strictEqual(res._status, 402, 'Expected 402 for 0-balance user');
    });
  });

  // T3: non-admin with positive balance passes through
  queue.push(function() {
    console.log('\n[arl-s2] T3 -- non-admin with positive balance passes');
    return test('creditsGuard: non-admin with positive balance calls next()', async function() {
      var creditsMod = freshRequire(CREDITS_PATH);
      creditsMod.setCreditsAdapter({
        query: async function() { return { rows: [{ balance: 10 }] }; }
      });

      delete require.cache[require.resolve(CREDITS_PATH)];
      require.cache[require.resolve(CREDITS_PATH)] = {
        id: require.resolve(CREDITS_PATH),
        filename: require.require || require.resolve(CREDITS_PATH),
        loaded: true,
        exports: creditsMod
      };

      delete require.cache[require.resolve(CREDITS_GUARD_PATH)];
      var guard = require(CREDITS_GUARD_PATH);

      var req = { session: { role: 'user', tenantId: 'regular-tenant' } };
      var res = makeRes();
      var nextCalled = false;
      await guard.creditsGuard(req, res, function() { nextCalled = true; });

      assert.ok(nextCalled, 'next() should be called for user with positive balance');
    });
  });

  // ── requireAdmin tests ──────────────────────────────────────────────────────

  // T4: no session → 403
  queue.push(function() {
    console.log('\n[arl-s2] T4 -- requireAdmin: no session returns 403');
    return test('requireAdmin: no session returns 403', function() {
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

  // T5: authenticated but non-admin → 403
  queue.push(function() {
    console.log('\n[arl-s2] T5 -- requireAdmin: non-admin authenticated user returns 403');
    return test('requireAdmin: authenticated non-admin returns 403', function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      var req = { session: { userId: 1, role: 'user' } };
      var res = makeRes();
      var nextCalled = false;
      m.requireAdmin(req, res, function() { nextCalled = true; });
      assert.ok(!nextCalled, 'next() must NOT be called for non-admin');
      assert.strictEqual(res._status, 403, 'Expected 403, got ' + res._status);
    });
  });

  // T6: authenticated admin → next() called
  queue.push(function() {
    console.log('\n[arl-s2] T6 -- requireAdmin: admin user calls next()');
    return test('requireAdmin: admin user calls next()', function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      var req = { session: { userId: 1, role: 'admin' } };
      var res = makeRes();
      var nextCalled = false;
      m.requireAdmin(req, res, function() { nextCalled = true; });
      assert.ok(nextCalled, 'next() should be called for admin user');
      assert.strictEqual(res._status, null, 'No response should be written for admin');
    });
  });

  // T7: userId present but role absent → 403
  queue.push(function() {
    console.log('\n[arl-s2] T7 -- requireAdmin: userId present but no role returns 403');
    return test('requireAdmin: userId present but no role returns 403', function() {
      var m = freshRequire(REQUIRE_ADMIN_PATH);
      var req = { session: { userId: 1 } };
      var res = makeRes();
      var nextCalled = false;
      m.requireAdmin(req, res, function() { nextCalled = true; });
      assert.ok(!nextCalled, 'next() must NOT be called without role');
      assert.strictEqual(res._status, 403, 'Expected 403 when role is missing');
    });
  });

  // T8: integration — server.js references requireAdmin for /admin routes
  queue.push(function() {
    console.log('\n[arl-s2] T8 -- server.js uses requireAdmin for /admin routes');
    return test('server.js references requireAdmin in admin route block', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(src.includes('requireAdmin'), 'server.js must reference requireAdmin');
      assert.ok(src.includes('/admin/credits'), 'server.js must include /admin/credits route');
    });
  });

  // Run queue sequentially
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[arl-s2] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[arl-s2] Unexpected error:', err);
  process.exit(1);
});
