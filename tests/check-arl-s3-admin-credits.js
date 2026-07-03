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

var CREDITS_PATH = path.resolve(__dirname, '../src/web-ui/modules/credits.js');
var ADMIN_CREDITS_PATH = path.resolve(__dirname, '../src/web-ui/routes/admin-credits.js');
var requireAdmin = require(path.resolve(__dirname, '../src/web-ui/middleware/require-admin')).requireAdmin;

function freshRequireCredits() {
  delete require.cache[require.resolve(CREDITS_PATH)];
  return require(CREDITS_PATH);
}

function freshRequireAdminCredits(creditsMod) {
  // Inject fresh credits module into cache before requiring admin-credits
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

// Standard multi-purpose mock adapter
function makeMockDb(overrides) {
  return {
    query: async function(sql) {
      if (overrides && overrides.query) return overrides.query(sql);
      if (sql.includes('SELECT tenant_id, balance')) return { rows: [{ tenant_id: 'tenant-a', balance: 10 }] };
      if (sql.includes('SELECT tenant_id FROM')) return { rows: [{ tenant_id: 'tenant-a' }] };
      if (sql.includes('UPDATE')) return { rows: [] };
      return { rows: [] };
    }
  };
}

async function main() {
  var queue = [];

  // T1: GET /admin/credits renders HTML with tenant balances
  queue.push(function() {
    console.log('\n[arl-s3] T1 -- GET renders HTML with tenant balances');
    return test('adminCreditsGet: renders HTML page with tenant balance table', async function() {
      var credits = freshRequireCredits();
      credits.setCreditsAdapter(makeMockDb());
      var handler = freshRequireAdminCredits(credits);

      var req = { session: { userId: 1, role: 'admin' } };
      var res = makeRes();
      await handler.adminCreditsGet(req, res);

      assert.strictEqual(res._status, 200, 'Expected 200, got ' + res._status);
      assert.ok(res._body.includes('tenant-a'), 'HTML must contain tenant-a');
      assert.ok(res._body.includes('10'), 'HTML must contain balance 10');
      assert.ok(res._body.includes('<table'), 'HTML must contain a table');
      assert.ok(res._body.includes('/api/admin/credits/adjust'), 'HTML must contain the adjust form action');
      assert.ok(res._body.includes('name="tenantId"'), 'Form must have tenantId field');
      assert.ok(res._body.includes('name="amount"'), 'Form must have amount field');
      assert.ok(res._body.includes('type="hidden"'), 'tenantId must be a hidden input, not a select');
      assert.ok(!res._body.includes('<select'), 'Old select dropdown must not be present');
      assert.ok(res._body.includes('value="tenant-a"'), 'Hidden input must have tenant-a as its value');
    });
  });

  // T2: POST with valid tenantId and positive amount adjusts balance and redirects 302
  queue.push(function() {
    console.log('\n[arl-s3] T2 -- POST valid tenantId + amount adjusts and redirects 302');
    return test('adminCreditsPost: valid POST adjusts balance and redirects 302', async function() {
      var adjustCalled = false;
      var credits = freshRequireCredits();
      credits.setCreditsAdapter({
        query: async function(sql, params) {
          if (sql.includes('SELECT tenant_id FROM')) return { rows: [{ tenant_id: 'tenant-a' }] };
          if (sql.includes('UPDATE')) { adjustCalled = true; return { rows: [] }; }
          return { rows: [] };
        }
      });
      var handler = freshRequireAdminCredits(credits);

      var body = 'tenantId=tenant-a&amount=50';
      var req = {
        session: { userId: 1, role: 'admin' },
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb(body);
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      await handler.adminCreditsPost(req, res);

      assert.strictEqual(res._status, 302, 'Expected 302 redirect, got ' + res._status);
      assert.strictEqual(res._headers['Location'], '/admin/credits', 'Expected redirect to /admin/credits');
      assert.ok(adjustCalled, 'adjustBalance must be called');
    });
  });

  // T3: POST with amount=0 → 400
  queue.push(function() {
    console.log('\n[arl-s3] T3 -- POST amount=0 returns 400');
    return test('adminCreditsPost: amount=0 returns 400', async function() {
      var credits = freshRequireCredits();
      credits.setCreditsAdapter(makeMockDb());
      var handler = freshRequireAdminCredits(credits);

      var body = 'tenantId=tenant-a&amount=0';
      var req = {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb(body);
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      await handler.adminCreditsPost(req, res);
      assert.strictEqual(res._status, 400, 'Expected 400 for amount=0, got ' + res._status);
    });
  });

  // T4: POST with negative amount → 400
  queue.push(function() {
    console.log('\n[arl-s3] T4 -- POST negative amount returns 400');
    return test('adminCreditsPost: negative amount returns 400', async function() {
      var credits = freshRequireCredits();
      credits.setCreditsAdapter(makeMockDb());
      var handler = freshRequireAdminCredits(credits);

      var body = 'tenantId=tenant-a&amount=-5';
      var req = {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb(body);
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      await handler.adminCreditsPost(req, res);
      assert.strictEqual(res._status, 400, 'Expected 400 for negative amount, got ' + res._status);
    });
  });

  // T5: POST with non-numeric amount → 400
  queue.push(function() {
    console.log('\n[arl-s3] T5 -- POST non-numeric amount returns 400');
    return test('adminCreditsPost: non-numeric amount returns 400', async function() {
      var credits = freshRequireCredits();
      credits.setCreditsAdapter(makeMockDb());
      var handler = freshRequireAdminCredits(credits);

      var body = 'tenantId=tenant-a&amount=abc';
      var req = {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb(body);
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      await handler.adminCreditsPost(req, res);
      assert.strictEqual(res._status, 400, 'Expected 400 for non-numeric amount, got ' + res._status);
    });
  });

  // T6: POST with float amount → 400 (not a positive integer)
  queue.push(function() {
    console.log('\n[arl-s3] T6 -- POST float amount returns 400');
    return test('adminCreditsPost: float amount returns 400', async function() {
      var credits = freshRequireCredits();
      credits.setCreditsAdapter(makeMockDb());
      var handler = freshRequireAdminCredits(credits);

      var body = 'tenantId=tenant-a&amount=1.5';
      var req = {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb(body);
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      await handler.adminCreditsPost(req, res);
      assert.strictEqual(res._status, 400, 'Expected 400 for float amount, got ' + res._status);
    });
  });

  // T7: POST with unknown tenantId → 400
  queue.push(function() {
    console.log('\n[arl-s3] T7 -- POST unknown tenantId returns 400');
    return test('adminCreditsPost: unknown tenantId returns 400', async function() {
      var credits = freshRequireCredits();
      credits.setCreditsAdapter({
        query: async function(sql) {
          if (sql.includes('SELECT tenant_id FROM')) return { rows: [{ tenant_id: 'tenant-a' }] };
          return { rows: [] };
        }
      });
      var handler = freshRequireAdminCredits(credits);

      var body = 'tenantId=unknown-tenant&amount=10';
      var req = {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb(body);
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      await handler.adminCreditsPost(req, res);
      assert.strictEqual(res._status, 400, 'Expected 400 for unknown tenantId, got ' + res._status);
      var body2 = JSON.parse(res._body);
      assert.ok(body2.error && body2.error.toLowerCase().includes('unknown'), 'Error must mention unknown tenantId');
    });
  });

  // T8: GET HTML escapes tenant_id to prevent XSS
  queue.push(function() {
    console.log('\n[arl-s3] T8 -- GET escapes tenant_id HTML');
    return test('adminCreditsGet: tenant_id is HTML-escaped in output', async function() {
      var credits = freshRequireCredits();
      credits.setCreditsAdapter({
        query: async function(sql) {
          if (sql.includes('SELECT tenant_id, balance')) {
            return { rows: [{ tenant_id: 'a<b>c', balance: 5 }] };
          }
          return { rows: [] };
        }
      });
      var handler = freshRequireAdminCredits(credits);

      var req = { session: { userId: 1, role: 'admin' } };
      var res = makeRes();
      await handler.adminCreditsGet(req, res);

      assert.ok(!res._body.includes('<b>'), 'Raw <b> tag must not appear in output');
      assert.ok(res._body.includes('a&lt;b&gt;c'), 'tenant_id must be HTML-escaped');
    });
  });

  // T9: getAllTenantBalances returns correct structure
  queue.push(function() {
    console.log('\n[arl-s3] T9 -- getAllTenantBalances returns rows');
    return test('getAllTenantBalances: returns tenant_id + balance rows', async function() {
      var credits = freshRequireCredits();
      credits.setCreditsAdapter({
        query: async function(sql) {
          if (sql.includes('SELECT tenant_id, balance')) {
            return { rows: [{ tenant_id: 'tenant-x', balance: 42 }] };
          }
          return { rows: [] };
        }
      });
      var rows = await credits.getAllTenantBalances();
      assert.strictEqual(rows.length, 1);
      assert.strictEqual(rows[0].tenant_id, 'tenant-x');
      assert.strictEqual(rows[0].balance, 42);
    });
  });

  // T10: getValidTenantIds returns array of strings
  queue.push(function() {
    console.log('\n[arl-s3] T10 -- getValidTenantIds returns string array');
    return test('getValidTenantIds: returns array of tenant_id strings', async function() {
      var credits = freshRequireCredits();
      credits.setCreditsAdapter({
        query: async function(sql) {
          if (sql.includes('SELECT tenant_id FROM')) {
            return { rows: [{ tenant_id: 'tenant-a' }, { tenant_id: 'tenant-b' }] };
          }
          return { rows: [] };
        }
      });
      var ids = await credits.getValidTenantIds();
      assert.ok(Array.isArray(ids), 'getValidTenantIds must return an array');
      assert.strictEqual(ids.length, 2);
      assert.ok(ids.includes('tenant-a'));
      assert.ok(ids.includes('tenant-b'));
    });
  });

  // T11: Non-admin GET /admin/credits returns 403 (AC5)
  queue.push(function() {
    console.log('\n[arl-s3] T11 -- Non-admin GET /admin/credits returns 403 (AC5)');
    return test('requireAdmin + adminCreditsGet: non-admin role returns 403', async function() {
      var credits = freshRequireCredits();
      credits.setCreditsAdapter(makeMockDb());
      var handler = freshRequireAdminCredits(credits);

      var req = { session: { userId: 1, role: 'user' } };
      var res = makeRes();

      await new Promise(function(resolve) {
        var called = false;
        requireAdmin(req, res, function() { called = true; });
        if (called) {
          handler.adminCreditsGet(req, res).then(resolve).catch(resolve);
        } else {
          resolve();
        }
      });

      assert.strictEqual(res._status, 403, 'Expected 403 for non-admin role, got ' + res._status);
      assert.ok(!res._body.includes('<table'), 'Credits page HTML must not be rendered');
    });
  });

  // T12: Non-admin POST /api/admin/credits/adjust returns 403 (AC6)
  queue.push(function() {
    console.log('\n[arl-s3] T12 -- Non-admin POST /api/admin/credits/adjust returns 403 (AC6)');
    return test('requireAdmin + adminCreditsPost: non-admin role returns 403', async function() {
      var adjustCalled = false;
      var credits = freshRequireCredits();
      credits.setCreditsAdapter({
        query: async function(sql) {
          if (sql.includes('UPDATE')) { adjustCalled = true; return { rows: [] }; }
          return { rows: [] };
        }
      });
      var handler = freshRequireAdminCredits(credits);

      var body = 'tenantId=tenant-a&amount=50';
      var req = {
        session: { userId: 1, role: 'user' },
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb(body);
          if (event === 'end') cb();
        }
      };
      var res = makeRes();

      await new Promise(function(resolve) {
        var called = false;
        requireAdmin(req, res, function() { called = true; });
        if (called) {
          handler.adminCreditsPost(req, res).then(resolve).catch(resolve);
        } else {
          resolve();
        }
      });

      assert.strictEqual(res._status, 403, 'Expected 403 for non-admin role, got ' + res._status);
      assert.ok(!adjustCalled, 'adjustBalance must not be called for non-admin');
    });
  });

  // Run queue sequentially
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[arl-s3] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[arl-s3] Unexpected error:', err);
  process.exit(1);
});
