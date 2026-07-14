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

var CREDITS_PATH = path.resolve(__dirname, '../src/web-ui/modules/credits.js');
var ADMIN_CREDITS_PATH = path.resolve(__dirname, '../src/web-ui/routes/admin-credits.js');
var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');

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

function makeReqFromBody(bodyStr, session) {
  return {
    session: session,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    on: function(event, cb) {
      if (event === 'data') cb(bodyStr);
      if (event === 'end') cb();
    }
  };
}

// Simple spy-capturing mock: allowlist ['tenant-a'], balance starts at 50, UPDATE...RETURNING
// returns balance + delta, INSERT captured into insertedRows.
function makeSpyMockDb(opts) {
  opts = opts || {};
  var startBalance = opts.startBalance !== undefined ? opts.startBalance : 50;
  var allowlist = opts.allowlist || ['tenant-a'];
  var insertedRows = [];
  var updateCalls = 0;
  var db = {
    query: async function(sql, params) {
      if (sql.includes('SELECT tenant_id FROM')) {
        return { rows: allowlist.map(function(t) { return { tenant_id: t }; }) };
      }
      if (sql.includes('UPDATE credits') && sql.includes('RETURNING')) {
        updateCalls++;
        var delta = params[0];
        return { rows: [{ balance: startBalance + delta }] };
      }
      if (sql.includes('INSERT INTO credit_audit_log')) {
        insertedRows.push(params);
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
  db._insertedRows = insertedRows;
  db._updateCallsGetter = function() { return updateCalls; };
  return db;
}

// Stateful mock for AC3/AC6: tracks a per-tenant balance map and a real audit array,
// so adjustBalanceWithAudit + getAuditLog can be exercised as a genuine round trip.
function makeStatefulMockDb(initialBalances) {
  var balances = Object.assign({}, initialBalances);
  var auditLog = [];
  return {
    query: async function(sql, params) {
      if (sql.includes('UPDATE credits') && sql.includes('RETURNING')) {
        var delta = params[0];
        var tenantId = params[1];
        balances[tenantId] = (balances[tenantId] || 0) + delta;
        return { rows: [{ balance: balances[tenantId] }] };
      }
      if (sql.includes('INSERT INTO credit_audit_log')) {
        auditLog.push({
          tenant_id: params[0],
          admin_id: params[1],
          delta: params[2],
          balance_before: params[3],
          balance_after: params[4],
          created_at: new Date().toISOString()
        });
        return { rows: [] };
      }
      if (sql.includes('SELECT') && sql.includes('credit_audit_log')) {
        var tid = params[0];
        return { rows: auditLog.filter(function(r) { return r.tenant_id === tid; }) };
      }
      return { rows: [] };
    }
  };
}

async function main() {
  var queue = [];

  // T1: Valid POST writes exactly one audit row with correct fields (AC1)
  queue.push(function() {
    console.log('\n[arl-s5] T1 -- valid POST writes one audit row with correct fields (AC1)');
    return test('adminCreditsPost: writes one credit_audit_log row with tenant_id/admin_id/delta/balance_before/balance_after', async function() {
      var credits = freshRequireCredits();
      var db = makeSpyMockDb({ startBalance: 50 });
      credits.setCreditsAdapter(db);
      var handler = freshRequireAdminCredits(credits);

      var req = makeReqFromBody('tenantId=tenant-a&amount=10', { userId: 1, login: 'alice', role: 'admin' });
      var res = makeRes();
      await handler.adminCreditsPost(req, res);

      assert.strictEqual(res._status, 302, 'Expected 302, got ' + res._status);
      assert.strictEqual(db._insertedRows.length, 1, 'Expected exactly one audit INSERT');
      var row = db._insertedRows[0];
      assert.strictEqual(row[0], 'tenant-a', 'tenant_id must be tenant-a');
      assert.strictEqual(row[1], 'alice', 'admin_id must be alice');
      assert.strictEqual(row[2], 10, 'delta must be 10');
      assert.strictEqual(row[3], 50, 'balance_before must be 50');
      assert.strictEqual(row[4], 60, 'balance_after must be 60');
    });
  });

  // T2: balance_after - balance_before === delta across multiple amounts (AC2)
  queue.push(function() {
    console.log('\n[arl-s5] T2 -- balance_after - balance_before equals delta (AC2, table-driven)');
    return test('adjustBalanceWithAudit: balance_after - balance_before === delta for deltas 5, 50, 1', async function() {
      var cases = [5, 50, 1];
      for (var i = 0; i < cases.length; i++) {
        var credits = freshRequireCredits();
        var db = makeSpyMockDb({ startBalance: 100 });
        credits.setCreditsAdapter(db);
        var result = await credits.adjustBalanceWithAudit('tenant-a', cases[i], 'alice');
        assert.strictEqual(result.balanceAfter - result.balanceBefore, cases[i],
          'balance_after - balance_before must equal delta=' + cases[i]);
      }
    });
  });

  // T3: Two different admins on two different tenants -- correctly attributed (AC3, AC6)
  queue.push(function() {
    console.log('\n[arl-s5] T3 -- two admins, two tenants: correct attribution, no cross-contamination (AC3/AC6)');
    return test('adjustBalanceWithAudit + getAuditLog: per-actor correctness across two admins/tenants', async function() {
      var credits = freshRequireCredits();
      var db = makeStatefulMockDb({ 'tenant-a': 0, 'tenant-b': 0 });
      credits.setCreditsAdapter(db);

      await credits.adjustBalanceWithAudit('tenant-a', 10, 'alice');
      await credits.adjustBalanceWithAudit('tenant-b', 20, 'bob');

      var logA = await credits.getAuditLog('tenant-a');
      var logB = await credits.getAuditLog('tenant-b');

      assert.strictEqual(logA.length, 1, 'tenant-a audit log must have exactly 1 row');
      assert.strictEqual(logA[0].admin_id, 'alice', 'tenant-a row must be attributed to alice');
      assert.strictEqual(logA[0].delta, 10, 'tenant-a row delta must be 10');

      assert.strictEqual(logB.length, 1, 'tenant-b audit log must have exactly 1 row');
      assert.strictEqual(logB[0].admin_id, 'bob', 'tenant-b row must be attributed to bob');
      assert.strictEqual(logB[0].delta, 20, 'tenant-b row delta must be 20');

      // no cross-contamination
      assert.notStrictEqual(logA[0].admin_id, logB[0].admin_id);
    });
  });

  // T4: Invalid amount writes no audit row (AC4)
  queue.push(function() {
    console.log('\n[arl-s5] T4 -- invalid amount (0/-5/abc/empty) writes no audit row (AC4)');
    return test('adminCreditsPost: invalid amounts never write to credit_audit_log', async function() {
      var badAmounts = ['0', '-5', 'abc', ''];
      for (var i = 0; i < badAmounts.length; i++) {
        var credits = freshRequireCredits();
        var db = makeSpyMockDb({ startBalance: 50 });
        credits.setCreditsAdapter(db);
        var handler = freshRequireAdminCredits(credits);

        var req = makeReqFromBody('tenantId=tenant-a&amount=' + badAmounts[i], { userId: 1, login: 'alice', role: 'admin' });
        var res = makeRes();
        await handler.adminCreditsPost(req, res);

        assert.strictEqual(res._status, 400, 'Expected 400 for amount=' + JSON.stringify(badAmounts[i]) + ', got ' + res._status);
        assert.strictEqual(db._insertedRows.length, 0, 'No audit row for invalid amount=' + JSON.stringify(badAmounts[i]));
      }
    });
  });

  // T5: Unknown tenantId writes no audit row (AC4)
  queue.push(function() {
    console.log('\n[arl-s5] T5 -- unknown tenantId writes no audit row (AC4)');
    return test('adminCreditsPost: unknown tenantId never writes to credit_audit_log', async function() {
      var credits = freshRequireCredits();
      var db = makeSpyMockDb({ startBalance: 50, allowlist: ['tenant-a'] });
      credits.setCreditsAdapter(db);
      var handler = freshRequireAdminCredits(credits);

      var req = makeReqFromBody('tenantId=unknown-tenant&amount=10', { userId: 1, login: 'alice', role: 'admin' });
      var res = makeRes();
      await handler.adminCreditsPost(req, res);

      assert.strictEqual(res._status, 400, 'Expected 400 for unknown tenantId, got ' + res._status);
      assert.strictEqual(db._insertedRows.length, 0, 'No audit row for unknown tenantId');
    });
  });

  // T6: server.js creates credit_audit_log idempotently in the existing migration block (AC5)
  queue.push(function() {
    console.log('\n[arl-s5] T6 -- server.js creates credit_audit_log idempotently (AC5, code inspection)');
    return test('server.js: CREATE TABLE IF NOT EXISTS credit_audit_log present with required columns', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(src.includes('CREATE TABLE IF NOT EXISTS credit_audit_log'),
        'server.js must contain CREATE TABLE IF NOT EXISTS credit_audit_log');
      var idx = src.indexOf('CREATE TABLE IF NOT EXISTS credit_audit_log');
      var snippet = src.slice(idx, idx + 500);
      ['tenant_id', 'admin_id', 'delta', 'balance_before', 'balance_after', 'created_at'].forEach(function(col) {
        assert.ok(snippet.includes(col), 'credit_audit_log table must include column: ' + col);
      });
    });
  });

  // T7: Full round trip via getAuditLog matches actual adjustment values (AC6)
  queue.push(function() {
    console.log('\n[arl-s5] T7 -- full round trip: adjust then retrieve matches actual values (AC6)');
    return test('adjustBalanceWithAudit + getAuditLog: retrieved row matches actual adjustment', async function() {
      var credits = freshRequireCredits();
      var db = makeStatefulMockDb({ 'tenant-a': 100 });
      credits.setCreditsAdapter(db);

      await credits.adjustBalanceWithAudit('tenant-a', 25, 'alice');
      var log = await credits.getAuditLog('tenant-a');

      assert.strictEqual(log.length, 1);
      assert.strictEqual(log[0].balance_before, 100);
      assert.strictEqual(log[0].balance_after, 125);
      assert.strictEqual(log[0].delta, 25);
      assert.strictEqual(log[0].admin_id, 'alice');
    });
  });

  // T8: admin_id stores login, never raw accessToken (AC7)
  queue.push(function() {
    console.log('\n[arl-s5] T8 -- admin_id is login, never the raw accessToken (AC7)');
    return test('adminCreditsPost: accessToken never appears in admin_id or any audit INSERT param', async function() {
      var credits = freshRequireCredits();
      var db = makeSpyMockDb({ startBalance: 50 });
      credits.setCreditsAdapter(db);
      var handler = freshRequireAdminCredits(credits);

      var secretToken = 'ghp_secretvalue123DoNotPersist';
      var req = makeReqFromBody('tenantId=tenant-a&amount=10', {
        userId: 1, login: 'alice', role: 'admin', accessToken: secretToken
      });
      var res = makeRes();
      await handler.adminCreditsPost(req, res);

      assert.strictEqual(db._insertedRows.length, 1);
      var row = db._insertedRows[0];
      assert.strictEqual(row[1], 'alice', 'admin_id must be the login, not the token');
      row.forEach(function(v) {
        assert.notStrictEqual(v, secretToken, 'accessToken value must never appear in any INSERT param');
      });
    });
  });

  // T9: admin_id falls back to userId when login is absent (AC7 fallback path)
  queue.push(function() {
    console.log('\n[arl-s5] T9 -- admin_id falls back to userId when login is absent (AC7)');
    return test('adminCreditsPost: admin_id falls back to stringified userId when login is missing', async function() {
      var credits = freshRequireCredits();
      var db = makeSpyMockDb({ startBalance: 50 });
      credits.setCreditsAdapter(db);
      var handler = freshRequireAdminCredits(credits);

      var req = makeReqFromBody('tenantId=tenant-a&amount=10', { userId: 42, role: 'admin' });
      var res = makeRes();
      await handler.adminCreditsPost(req, res);

      assert.strictEqual(db._insertedRows.length, 1);
      assert.strictEqual(db._insertedRows[0][1], '42', 'admin_id must fall back to stringified userId');
    });
  });

  // T10: POST handler calls the audited path with the parsed integer and resolved admin identity (integration)
  queue.push(function() {
    console.log('\n[arl-s5] T10 -- integration: handler invokes adjustBalanceWithAudit with parsed integer + resolved admin (AC1)');
    return test('adminCreditsPost -> adjustBalanceWithAudit integration: one UPDATE...RETURNING + one INSERT per request', async function() {
      var credits = freshRequireCredits();
      var db = makeSpyMockDb({ startBalance: 50 });
      credits.setCreditsAdapter(db);
      var handler = freshRequireAdminCredits(credits);

      var req = makeReqFromBody('tenantId=tenant-a&amount=7', { userId: 1, login: 'alice', role: 'admin' });
      var res = makeRes();
      await handler.adminCreditsPost(req, res);

      assert.strictEqual(db._updateCallsGetter(), 1, 'Expected exactly one UPDATE...RETURNING call');
      assert.strictEqual(db._insertedRows.length, 1, 'Expected exactly one INSERT call');
      assert.strictEqual(db._insertedRows[0][2], 7, 'delta must be the parsed integer 7, not the string "7"');
      assert.strictEqual(res._status, 302);
    });
  });

  // T11: no separate SELECT-balance read precedes the UPDATE...RETURNING (NFR -- atomicity)
  queue.push(function() {
    console.log('\n[arl-s5] T11 -- adjustBalanceWithAudit source uses UPDATE...RETURNING (atomic, no read-then-write race) (NFR)');
    return test('credits.js source: adjustBalanceWithAudit query includes RETURNING balance', function() {
      var src = fs.readFileSync(CREDITS_PATH, 'utf8');
      var fnStart = src.indexOf('async function adjustBalanceWithAudit');
      assert.ok(fnStart !== -1, 'adjustBalanceWithAudit must be defined in credits.js');
      var fnBody = src.slice(fnStart, fnStart + 800);
      assert.ok(fnBody.includes('RETURNING balance'), 'adjustBalanceWithAudit must use UPDATE ... RETURNING balance for atomicity');
    });
  });

  // T12: existing adjustBalance export remains intact (no regression to arl-s3's exports)
  queue.push(function() {
    console.log('\n[arl-s5] T12 -- existing adjustBalance export is unchanged (no regression)');
    return test('credits.js: adjustBalance, getAllTenantBalances, getValidTenantIds still exported', function() {
      var credits = freshRequireCredits();
      assert.strictEqual(typeof credits.adjustBalance, 'function');
      assert.strictEqual(typeof credits.getAllTenantBalances, 'function');
      assert.strictEqual(typeof credits.getValidTenantIds, 'function');
      assert.strictEqual(typeof credits.adjustBalanceWithAudit, 'function');
      assert.strictEqual(typeof credits.getAuditLog, 'function');
    });
  });

  // Run queue sequentially
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[arl-s5] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[arl-s5] Unexpected error:', err);
  process.exit(1);
});
