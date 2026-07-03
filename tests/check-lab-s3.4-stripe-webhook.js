'use strict';
// check-lab-s3.4-stripe-webhook.js — AC verification for lab-s3.4 (Stripe webhook handler)
// Tests: T1.1, T1.2 (AC1), T2.1+T2.2 (AC2), T3.1 (AC3), T4.1 (AC4),
//        T5.1+T5.2 (AC5), T6.1 (AC6), T7.1 (AC7), IT1, IT2, NFR1
// No real Stripe API or DB calls — all adapters are injectable and monkeypatched.

// Set env vars BEFORE any require() of application code
process.env.SESSION_SECRET       = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV             = 'test';
process.env.CREDITS_PLAN_STARTER = '1000';
process.env.CREDITS_PLAN_PRO     = '2500';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

var path = require('path');
var fs   = require('fs');
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

// ── Module paths ──────────────────────────────────────────────────────────────
var stripeClientPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'stripe-client'));
var billingPath      = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'billing'));
var creditsPath      = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal mock req object with a pre-built raw body Buffer. */
function mockReq(opts) {
  opts = opts || {};
  return {
    session: opts.session !== undefined ? opts.session : { accessToken: 'tok', tenantId: 'tenant-abc' },
    // body as Buffer short-circuits _readRawBody() without needing stream events
    body:    opts.body !== undefined ? opts.body : Buffer.from('{}'),
    headers: opts.headers || {},
    query:   opts.query || {},
  };
}

/** Build a mock res that captures writeHead and end calls. */
function mockRes() {
  return {
    _statusCode: null,
    _headers:    {},
    _body:       null,
    writeHead: function(status, headers) {
      this._statusCode = status;
      if (headers) {
        var self = this;
        Object.keys(headers).forEach(function(k) { self._headers[k] = headers[k]; });
      }
    },
    end: function(body) {
      this._body = body || null;
    }
  };
}

/**
 * Mock DB adapter for the stripe_events idempotency store.
 * @param {boolean}  alreadyExists - true → INSERT returns rowCount=0 (duplicate event)
 * @param {Array}    sqlCalls      - if provided, each { sql, params } is pushed here for inspection
 */
function mockWebhookDb(alreadyExists, sqlCalls) {
  return {
    query: async function(sql, params) {
      if (sqlCalls) {
        sqlCalls.push({ sql: sql, params: params });
      }
      if (sql.includes('INSERT INTO stripe_events')) {
        return { rows: [], rowCount: alreadyExists ? 0 : 1 };
      }
      return { rows: [], rowCount: 0 };
    }
  };
}

/**
 * Mock credits DB adapter — captures adjustBalance calls.
 * adjustBalance in credits.js calls db.query('UPDATE credits SET balance = balance + $1 ... WHERE tenant_id = $2')
 * @param {Array|null} adjustCalls - if provided, each { delta, tenantId } is pushed here
 */
function mockCreditsAdapter(adjustCalls) {
  return {
    query: async function(sql, params) {
      if (adjustCalls !== null && adjustCalls !== undefined && sql.includes('UPDATE credits')) {
        adjustCalls.push({ delta: params[0], tenantId: params[1] });
      }
      return { rows: [] };
    }
  };
}

/**
 * Wire all three injectable adapters and return fresh billing module.
 * Order: credits → stripeClient → billing (billing grabs both from require cache).
 */
function freshBilling(stripeAdapterOpts, creditsAdapterArg, webhookDbAdapterArg) {
  // 1. Fresh credits module with mock adapter
  delete require.cache[creditsPath];
  var credits = require(creditsPath);
  credits.setCreditsAdapter(creditsAdapterArg || mockCreditsAdapter(null));

  // 2. Fresh stripe-client with mock Stripe SDK adapter
  delete require.cache[stripeClientPath];
  var sc = require(stripeClientPath);
  sc.setStripeAdapter(stripeAdapterOpts);

  // 3. Fresh billing (imports stripe-client and credits from cache above)
  delete require.cache[billingPath];
  var billing = require(billingPath);
  billing.setWebhookDbAdapter(webhookDbAdapterArg || mockWebhookDb(false, null));

  return { billing: billing, credits: credits, sc: sc };
}

// ── T7 — Default adapter throws (AC7) ────────────────────────────────────────
console.log('\n── T7: Default stripe-client stub throws on verifyWebhookSignature (AC7) ──');

(function testT7() {
  delete require.cache[stripeClientPath];
  var sc = require(stripeClientPath);
  // Do NOT call setStripeAdapter — tests the unwired default

  var threw = false;
  var errMsg = '';
  try {
    sc.verifyWebhookSignature(Buffer.from('{}'), 'sig', 'secret');
  } catch (e) {
    threw = true;
    errMsg = e.message || '';
  }
  check(
    'T7.1: default-adapter-throws-adapter-not-wired',
    threw && errMsg.toLowerCase().includes('adapter not wired')
  );
})();

// ── Unit tests (setImmediate ensures T7 logs appear first) ───────────────────
setImmediate(function() {

  (async function runUnitTests() {

    // ── T1 — Signature verification (AC1) ──────────────────────────────────────
    console.log('\n── T1: Signature verification (AC1) ──');

    // T1.1 — invalid signature → 400; adjustBalance NOT called
    {
      var adjCalls1_1 = [];
      var m = freshBilling(
        { webhooks: { constructEvent: function() { throw new Error('Stripe signature invalid'); } } },
        mockCreditsAdapter(adjCalls1_1),
        mockWebhookDb(false, null)
      );

      var req = mockReq({ headers: { 'stripe-signature': 'bad-sig' } });
      var res = mockRes();
      await m.billing.handlePostStripeWebhook(req, res);

      check('T1.1: invalid-signature-returns-400', res._statusCode === 400);
      check('T1.1: adjust-balance-not-called-on-invalid-sig', adjCalls1_1.length === 0);
    }

    // T1.2 — valid signature → event dispatched; adjustBalance called; 200
    {
      var adjCalls1_2 = [];
      var validEvent1_2 = {
        id: 'evt_t1_2',
        type: 'checkout.session.completed',
        data: { object: { client_reference_id: 'tenant-t1', metadata: { planName: 'STARTER' } } }
      };
      var m1_2 = freshBilling(
        { webhooks: { constructEvent: function() { return validEvent1_2; } } },
        mockCreditsAdapter(adjCalls1_2),
        mockWebhookDb(false, null)
      );

      var req1_2 = mockReq({ headers: { 'stripe-signature': 'valid-sig' } });
      var res1_2 = mockRes();
      await m1_2.billing.handlePostStripeWebhook(req1_2, res1_2);

      check('T1.2: valid-signature-returns-200', res1_2._statusCode === 200);
      check('T1.2: valid-signature-dispatches-event-adjust-balance-called', adjCalls1_2.length > 0);
    }

    // ── T2 — checkout.session.completed (AC2) ──────────────────────────────────
    console.log('\n── T2: checkout.session.completed provisions credits (AC2) ──');

    {
      var adjCalls2 = [];
      var checkoutEvt = {
        id: 'evt_t2',
        type: 'checkout.session.completed',
        data: { object: { client_reference_id: 'tenant-abc', metadata: { planName: 'starter' } } }
      };
      var m2 = freshBilling(
        { webhooks: { constructEvent: function() { return checkoutEvt; } } },
        mockCreditsAdapter(adjCalls2),
        mockWebhookDb(false, null)
      );

      var req2 = mockReq({ headers: { 'stripe-signature': 'valid-sig' } });
      var res2 = mockRes();
      await m2.billing.handlePostStripeWebhook(req2, res2);

      check('T2.1: checkout-completed-provisions-correct-credit-amount',
        adjCalls2.length > 0 && adjCalls2[0].delta === 1000
      );
      check('T2.2: checkout-completed-uses-client-reference-id-for-tenant',
        adjCalls2.length > 0 && adjCalls2[0].tenantId === 'tenant-abc'
      );
    }

    // ── T3 — invoice.paid (AC3) ───────────────────────────────────────────────
    console.log('\n── T3: invoice.paid provisions monthly renewal credits (AC3) ──');

    {
      var adjCalls3 = [];
      var invoiceEvt = {
        id: 'evt_inv_001',
        type: 'invoice.paid',
        data: {
          object: {
            subscription: 'sub_test',
            metadata: { tenant_id: 'tenant-inv', plan_name: 'STARTER' },
            lines: { data: [{ price: { id: 'price_test_starter' } }] }
          }
        }
      };
      var m3 = freshBilling(
        { webhooks: { constructEvent: function() { return invoiceEvt; } } },
        mockCreditsAdapter(adjCalls3),
        mockWebhookDb(false, null)
      );

      var req3 = mockReq({ headers: { 'stripe-signature': 'valid-sig' } });
      var res3 = mockRes();
      await m3.billing.handlePostStripeWebhook(req3, res3);

      check('T3.1: invoice-paid-provisions-monthly-renewal-credits',
        adjCalls3.length > 0 &&
        adjCalls3[0].tenantId === 'tenant-inv' &&
        adjCalls3[0].delta === 1000
      );
    }

    // ── T4 — payment_intent.succeeded (AC4) ──────────────────────────────────
    console.log('\n── T4: payment_intent.succeeded provisions top-up (AC4) ──');

    {
      var adjCalls4 = [];
      var piEvt = {
        id: 'evt_pi_001',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            metadata: { credit_amount: '500', tenant_id: 'tenant-abc' }
          }
        }
      };
      var m4 = freshBilling(
        { webhooks: { constructEvent: function() { return piEvt; } } },
        mockCreditsAdapter(adjCalls4),
        mockWebhookDb(false, null)
      );

      var req4 = mockReq({ headers: { 'stripe-signature': 'valid-sig' } });
      var res4 = mockRes();
      await m4.billing.handlePostStripeWebhook(req4, res4);

      check('T4.1: payment-intent-succeeded-provisions-top-up-amount',
        adjCalls4.length > 0 &&
        adjCalls4[0].tenantId === 'tenant-abc' &&
        adjCalls4[0].delta === 500  // string '500' must be coerced to integer
      );
    }

    // ── T5 — Idempotency (AC5) ────────────────────────────────────────────────
    console.log('\n── T5: Idempotency — duplicate stripe_event_id skips adjustBalance (AC5) ──');

    // T5.1 — first receipt: INSERT called with evt id; adjustBalance called
    {
      var sqlCalls5_1 = [];
      var adjCalls5_1 = [];
      var idemEvt5 = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: { object: { client_reference_id: 'tenant-idem', metadata: { planName: 'STARTER' } } }
      };
      var m5_1 = freshBilling(
        { webhooks: { constructEvent: function() { return idemEvt5; } } },
        mockCreditsAdapter(adjCalls5_1),
        mockWebhookDb(false, sqlCalls5_1) // rowCount=1 → new event
      );

      var req5_1 = mockReq({ headers: { 'stripe-signature': 'valid-sig' } });
      var res5_1 = mockRes();
      await m5_1.billing.handlePostStripeWebhook(req5_1, res5_1);

      var insertCalled5_1 = sqlCalls5_1.some(function(c) {
        return c.sql.includes('INSERT INTO stripe_events') &&
               c.params && c.params[0] === 'evt_test_123';
      });
      check('T5.1: first-receipt-writes-stripe-event-id', insertCalled5_1);
      check('T5.1: adjust-balance-called-on-first-receipt', adjCalls5_1.length > 0);
    }

    // T5.2 — duplicate: adjustBalance NOT called; response still 200
    {
      var adjCalls5_2 = [];
      var idemEvt5_2 = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: { object: { client_reference_id: 'tenant-idem', metadata: { planName: 'STARTER' } } }
      };
      var m5_2 = freshBilling(
        { webhooks: { constructEvent: function() { return idemEvt5_2; } } },
        mockCreditsAdapter(adjCalls5_2),
        mockWebhookDb(true, null) // alreadyExists=true → rowCount=0 → duplicate
      );

      var req5_2 = mockReq({ headers: { 'stripe-signature': 'valid-sig' } });
      var res5_2 = mockRes();
      await m5_2.billing.handlePostStripeWebhook(req5_2, res5_2);

      check('T5.2: duplicate-stripe-event-id-skips-adjust-balance', adjCalls5_2.length === 0);
      check('T5.2: duplicate-event-still-returns-200', res5_2._statusCode === 200);
    }

    // ── T6 — Unknown event type → 200 (AC6) ──────────────────────────────────
    console.log('\n── T6: Unknown event type → 200, no adjustBalance, log stripe_unhandled_event (AC6) ──');

    {
      var adjCalls6 = [];
      var unknownEvt = {
        id: 'evt_unknown_001',
        type: 'customer.updated',
        data: { object: {} }
      };
      var m6 = freshBilling(
        { webhooks: { constructEvent: function() { return unknownEvt; } } },
        mockCreditsAdapter(adjCalls6),
        mockWebhookDb(false, null)
      );

      var loggedMessages6 = [];
      var origLog6 = console.log;
      console.log = function() { loggedMessages6.push(Array.prototype.join.call(arguments, ' ')); };

      var req6 = mockReq({ headers: { 'stripe-signature': 'valid-sig' } });
      var res6 = mockRes();
      try {
        await m6.billing.handlePostStripeWebhook(req6, res6);
      } finally {
        console.log = origLog6;
      }

      check('T6.1: unknown-event-type-returns-200', res6._statusCode === 200);
      check('T6.1: adjust-balance-not-called-for-unknown-event', adjCalls6.length === 0);
      check('T6.1: stripe-unhandled-event-logged',
        loggedMessages6.some(function(m) { return m.includes('stripe_unhandled_event'); })
      );
    }

    runIntegrationTests();

  })().catch(function(err) {
    console.error('Unit test error:', err.message, err.stack);
    failed++;
    runIntegrationTests();
  });
});

// ── Integration tests ─────────────────────────────────────────────────────────

function runIntegrationTests() {
  console.log('\n── IT: Integration tests ──');

  var serverSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'server.js'), 'utf8');

  // IT1 — webhook route registered in server.js BEFORE billing checkout route
  var webhookIdx = serverSrc.indexOf('/webhook/stripe');
  var billingIdx = serverSrc.indexOf('/billing/checkout');

  check('IT1: webhook-route-registered-in-server', webhookIdx !== -1);
  check('IT1: webhook-route-registered-before-billing-checkout',
    webhookIdx !== -1 && billingIdx !== -1 && webhookIdx < billingIdx
  );

  // IT2 — billing.js uses INSERT ON CONFLICT DO NOTHING; no SELECT before INSERT in handler
  var billingSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'routes', 'billing.js'), 'utf8');

  check('IT2: insert-uses-on-conflict-do-nothing',
    billingSrc.includes('ON CONFLICT DO NOTHING')
  );

  // Verify no SQL SELECT query is issued before the INSERT inside handlePostStripeWebhook.
  // A SQL SELECT would appear as a db.query() call with a SELECT statement — look for that pattern.
  var handlerStart = billingSrc.indexOf('async function handlePostStripeWebhook');
  var insertPos    = billingSrc.indexOf('INSERT INTO stripe_events', handlerStart);
  var handlerFnContent = billingSrc.substring(handlerStart, insertPos);
  // Detect actual SQL SELECT queries (not the word "select" appearing in comments or var names)
  var hasSqlSelectQuery = /\.query\s*\(\s*['"`]SELECT/i.test(handlerFnContent);
  check('IT2: no-select-query-before-insert-in-webhook-handler',
    handlerStart !== -1 && insertPos !== -1 && !hasSqlSelectQuery
  );

  // ── NFR1 — credits_provisioned audit log ─────────────────────────────────
  console.log('\n── NFR1: credits_provisioned audit log emitted on adjustBalance ──');

  (async function runNfr1() {
    var nfrEvt = {
      id: 'evt_nfr_001',
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'tenant-nfr', metadata: { planName: 'STARTER' } } }
    };
    var mNfr = freshBilling(
      { webhooks: { constructEvent: function() { return nfrEvt; } } },
      mockCreditsAdapter(null),
      mockWebhookDb(false, null)
    );

    var loggedNfr = [];
    var origLogNfr = console.log;
    console.log = function() { loggedNfr.push(Array.prototype.join.call(arguments, ' ')); };

    var reqNfr = mockReq({ headers: { 'stripe-signature': 'valid-sig' } });
    var resNfr = mockRes();
    try {
      await mNfr.billing.handlePostStripeWebhook(reqNfr, resNfr);
    } finally {
      console.log = origLogNfr;
    }

    var creditsProvisionedLog = loggedNfr.find(function(m) { return m.includes('credits_provisioned'); });
    check('NFR1: credits-provisioned-audit-logged', !!creditsProvisionedLog);

    if (creditsProvisionedLog) {
      var logObj = null;
      try { logObj = JSON.parse(creditsProvisionedLog); } catch (_) {}
      check('NFR1: log-has-event-credits-provisioned', logObj && logObj.event === 'credits_provisioned');
      check('NFR1: log-has-tenantId-field', logObj && logObj.tenantId !== undefined);
      check('NFR1: log-has-amount-field', logObj && logObj.amount !== undefined);
      check('NFR1: log-has-stripeEventId-field', logObj && logObj.stripeEventId !== undefined);
    } else {
      ['NFR1: log-has-event-credits-provisioned',
       'NFR1: log-has-tenantId-field',
       'NFR1: log-has-amount-field',
       'NFR1: log-has-stripeEventId-field'
      ].forEach(function(l) { failed++; console.error('FAIL:', l, '(no log entry found)'); });
    }

    // ── NFR: STRIPE_WEBHOOK_SECRET not committed ───────────────────────────────
    console.log('\n── NFR: STRIPE_WEBHOOK_SECRET not in committed files ──');
    var { execSync } = require('child_process');
    var grepResult = '';
    try {
      grepResult = execSync(
        'git grep -n "STRIPE_WEBHOOK_SECRET=whsec_" -- . 2>/dev/null || true',
        { cwd: ROOT, encoding: 'utf8' }
      );
    } catch (_) { grepResult = ''; }
    check('no-stripe-webhook-secret-in-committed-files', grepResult.trim() === '');

    // ── Final summary ─────────────────────────────────────────────────────────
    console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
    if (failed > 0) process.exit(1);

  })().catch(function(err) {
    console.error('NFR test error:', err.message, err.stack);
    failed++;
    console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
    process.exit(1);
  });
}
