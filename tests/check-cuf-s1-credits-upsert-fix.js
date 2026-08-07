'use strict';
// check-cuf-s1-credits-upsert-fix.js — AC verification tests for cuf-s1
// (Fix credits.js UPDATE-only balance adjustment silently dropping a brand-new
// tenant's first credit provisioning).
//
// Uses a stateful fake Postgres query executor that actually implements BOTH
// the OLD (buggy, UPDATE-only) and NEW (upsert) SQL shapes' real read/write
// semantics against a {tenantId: balance} map -- so this test proves RED
// against today's code and GREEN against the fix, not just "a keyword was
// present in the SQL string."
//
// Tests: UT1 (AC1), UT2 (AC2), UT3 (AC3), UT4 (AC4), IT1 (AC5)

process.env.SESSION_SECRET        = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV              = 'test';
process.env.CREDITS_PLAN_STARTER  = '1000';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

var path = require('path');
var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;

function check(label, ok) {
  if (ok) {
    passed++;
    console.log('PASS:', label);
  } else {
    failed++;
    console.error('FAIL:', label);
  }
}

var creditsPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));

/**
 * A fake Postgres-like credits DB. Recognises both the OLD UPDATE-only
 * statement and the NEW upsert statement, and actually applies real
 * read/modify semantics against an in-memory {tenantId: balance} map --
 * this is what makes UT1/UT3/IT1 genuinely RED against the current
 * (unfixed) credits.js and genuinely GREEN once the fix lands, rather than
 * a shallow "did the mock see a certain substring" check.
 */
function makeFakeCreditsDb(initialRows) {
  var rows = {};
  (initialRows || []).forEach(function(r) { rows[r.tenant_id] = r.balance; });
  var auditRows = [];

  return {
    query: async function(sql, params) {
      // getBalance
      if (/^\s*SELECT balance FROM credits/i.test(sql)) {
        var tid = params[0];
        if (rows[tid] === undefined) return { rows: [] };
        return { rows: [{ balance: rows[tid] }] };
      }

      // NEW upsert shape: INSERT INTO credits ... ON CONFLICT (tenant_id) DO UPDATE ...
      if (/INSERT INTO credits/i.test(sql) && /ON CONFLICT/i.test(sql)) {
        var delta = params[0];
        var tenantId = params[1];
        if (rows[tenantId] === undefined) rows[tenantId] = 0;
        rows[tenantId] += delta;
        if (/RETURNING balance/i.test(sql)) {
          return { rows: [{ balance: rows[tenantId] }] };
        }
        return { rows: [] };
      }

      // OLD (buggy, pre-fix) shape: UPDATE credits SET balance = balance + $1 WHERE tenant_id = $2
      // Simulates real Postgres: if no row matches the WHERE clause, zero rows are
      // affected and RETURNING (if present) yields an empty result set.
      if (/^\s*UPDATE credits SET balance = balance \+/i.test(sql)) {
        var d = params[0];
        var t = params[1];
        if (rows[t] === undefined) {
          if (/RETURNING/i.test(sql)) return { rows: [] };
          return { rows: [] };
        }
        rows[t] += d;
        if (/RETURNING/i.test(sql)) return { rows: [{ balance: rows[t] }] };
        return { rows: [] };
      }

      // audit log insert (adjustBalanceWithAudit's second query)
      if (/INSERT INTO credit_audit_log/i.test(sql)) {
        auditRows.push({
          tenant_id: params[0],
          admin_id: params[1],
          delta: params[2],
          balance_before: params[3],
          balance_after: params[4]
        });
        return { rows: [] };
      }

      return { rows: [] };
    },
    _balance: function(tenantId) { return rows[tenantId]; },
    _auditRows: function() { return auditRows.slice(); }
  };
}

async function run() {
  console.log('\n== cuf-s1: credits.js upsert fix ==');

  // ── UT1 (AC1): adjustBalance creates a row for a brand-new tenant ──────────
  {
    delete require.cache[creditsPath];
    var credits1 = require(creditsPath);
    var db1 = makeFakeCreditsDb([]);
    credits1.setCreditsAdapter(db1);

    await credits1.adjustBalance('tenant-brand-new', 500);
    var balance1 = await credits1.getBalance('tenant-brand-new');

    check('UT1 (AC1): adjustBalance creates a credits row for a brand-new tenant with balance = delta', balance1 === 500);
  }

  // ── UT2 (AC2): adjustBalance adds to an existing tenant's balance, doesn't overwrite ──
  {
    delete require.cache[creditsPath];
    var credits2 = require(creditsPath);
    var db2 = makeFakeCreditsDb([{ tenant_id: 'tenant-existing', balance: 100 }]);
    credits2.setCreditsAdapter(db2);

    await credits2.adjustBalance('tenant-existing', 50);
    var balance2 = await credits2.getBalance('tenant-existing');

    check('UT2 (AC2): adjustBalance adds delta to an existing balance (100 + 50 = 150), does not overwrite', balance2 === 150);
  }

  // ── UT3 (AC3): adjustBalanceWithAudit creates a row + correct audit for a brand-new tenant ──
  {
    delete require.cache[creditsPath];
    var credits3 = require(creditsPath);
    var db3 = makeFakeCreditsDb([]);
    credits3.setCreditsAdapter(db3);

    var result3 = await credits3.adjustBalanceWithAudit('tenant-brand-new-audit', 500, 'alice');

    check('UT3 (AC3): adjustBalanceWithAudit balanceBefore is 0 (not null) for a brand-new tenant', result3.balanceBefore === 0);
    check('UT3 (AC3): adjustBalanceWithAudit balanceAfter is 500 for a brand-new tenant', result3.balanceAfter === 500);

    var auditRows3 = db3._auditRows();
    check('UT3 (AC3): exactly one credit_audit_log row written', auditRows3.length === 1);
    check('UT3 (AC3): audit row balance_before is 0 (not null)', auditRows3.length === 1 && auditRows3[0].balance_before === 0);
    check('UT3 (AC3): audit row balance_after is 500', auditRows3.length === 1 && auditRows3[0].balance_after === 500);

    var actualBalance3 = db3._balance('tenant-brand-new-audit');
    check('UT3 (AC3): the credits table itself now actually has a row for the brand-new tenant', actualBalance3 === 500);
  }

  // ── UT4 (AC4): adjustBalanceWithAudit regression — existing tenant unaffected ──
  {
    delete require.cache[creditsPath];
    var credits4 = require(creditsPath);
    var db4 = makeFakeCreditsDb([{ tenant_id: 'tenant-existing-audit', balance: 100 }]);
    credits4.setCreditsAdapter(db4);

    var result4 = await credits4.adjustBalanceWithAudit('tenant-existing-audit', 25, 'alice');

    check('UT4 (AC4): adjustBalanceWithAudit balanceBefore is 100 for an existing tenant', result4.balanceBefore === 100);
    check('UT4 (AC4): adjustBalanceWithAudit balanceAfter is 125 (100 + 25)', result4.balanceAfter === 125);
  }

  // ── IT1 (AC5): real Stripe webhook path provisions credits for a brand-new tenant ──
  {
    var stripeClientPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'stripe-client'));
    var billingPath      = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'billing'));

    delete require.cache[creditsPath];
    var creditsForWebhook = require(creditsPath);
    var webhookCreditsDb = makeFakeCreditsDb([]); // brand-new tenant: zero existing rows
    creditsForWebhook.setCreditsAdapter(webhookCreditsDb);

    delete require.cache[stripeClientPath];
    var sc = require(stripeClientPath);
    var checkoutEvt = {
      id: 'evt_cuf_s1_001',
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'tenant-webhook-new', metadata: { planName: 'STARTER' } } }
    };
    sc.setStripeAdapter({ webhooks: { constructEvent: function() { return checkoutEvt; } } });

    delete require.cache[billingPath];
    var billing = require(billingPath);
    billing.setWebhookDbAdapter({
      query: async function(sql) {
        if (sql.includes('INSERT INTO stripe_events')) return { rows: [], rowCount: 1 };
        return { rows: [], rowCount: 0 };
      }
    });

    var req = {
      session: { accessToken: 'tok', tenantId: 'tenant-webhook-new' },
      body: Buffer.from('{}'),
      headers: { 'stripe-signature': 'valid-sig' },
      query: {}
    };
    var res = {
      _statusCode: null,
      writeHead: function(status) { this._statusCode = status; },
      end: function() {}
    };

    await billing.handlePostStripeWebhook(req, res);

    var webhookBalance = await creditsForWebhook.getBalance('tenant-webhook-new');
    check('IT1 (AC5): real checkout.session.completed webhook returns 200', res._statusCode === 200);
    check('IT1 (AC5): a brand-new tenant\'s first real Stripe checkout webhook results in a correct, non-zero credit balance (the actual production defect)', webhookBalance === 1000);
  }

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

run().catch(function(err) {
  console.error('Test error:', err.message, err.stack);
  process.exit(1);
});
