'use strict';
// check-bri-s3.5-billing-webhook.js — integration tests for bri-s3.5
// Verifies the Stripe webhook handler (billing.js) updates tenant plan
// state (tenant-plan.js) for the checkout/upgrade, payment-failure, and
// cancellation event types (AC1, AC3, AC4). No real Stripe API or DB calls
// — all adapters are injectable and monkeypatched, mirroring
// check-lab-s3.4-stripe-webhook.js's conventions.

process.env.SESSION_SECRET        = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV               = 'test';
process.env.STRIPE_WEBHOOK_SECRET  = 'whsec_test';

var path = require('path');
var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;
function check(label, ok) {
  if (ok) { passed++; console.log('PASS:', label); }
  else    { failed++; console.error('FAIL:', label); }
}

var stripeClientPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'stripe-client'));
var billingPath      = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'billing'));
var creditsPath       = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));
var tenantPlanPath    = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'tenant-plan'));

function mockReq(opts) {
  opts = opts || {};
  return {
    session: opts.session !== undefined ? opts.session : { accessToken: 'tok', tenantId: 'tenant-abc' },
    body:    opts.body !== undefined ? opts.body : Buffer.from('{}'),
    headers: opts.headers || {},
    query:   opts.query || {},
  };
}

function mockRes() {
  return {
    _statusCode: null,
    _body: null,
    writeHead: function(status) { this._statusCode = status; },
    end: function(body) { this._body = body || null; }
  };
}

function mockWebhookDb() {
  return { query: async function(sql) {
    if (sql.includes('INSERT INTO stripe_events')) return { rows: [], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  } };
}

function mockCreditsAdapter() {
  return { query: async function() { return { rows: [] }; } };
}

function freshModules() {
  delete require.cache[creditsPath];
  var credits = require(creditsPath);
  credits.setCreditsAdapter(mockCreditsAdapter());

  delete require.cache[tenantPlanPath];
  var tenantPlan = require(tenantPlanPath);

  return { credits: credits, tenantPlan: tenantPlan };
}

function freshBilling(stripeAdapterOpts) {
  delete require.cache[stripeClientPath];
  var sc = require(stripeClientPath);
  sc.setStripeAdapter(stripeAdapterOpts);

  delete require.cache[billingPath];
  var billing = require(billingPath);
  billing.setWebhookDbAdapter(mockWebhookDb());

  return billing;
}

(async function run() {
  // ── AC1: checkout.session.completed sets tenant plan to paid/active ──────
  console.log('\n── AC1: checkout.session.completed upgrades tenant plan to paid/active ──');
  {
    var mods1 = freshModules();
    mods1.tenantPlan.resetPlanState();
    var checkoutEvt = {
      id: 'evt_ac1',
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'tenant-upgrade', metadata: { planName: 'STARTER' } } }
    };
    var billing1 = freshBilling({ webhooks: { constructEvent: function() { return checkoutEvt; } } });

    var before = mods1.tenantPlan.getPlanState('tenant-upgrade');
    check('AC1: before webhook, tenant defaults to trial/active', before.plan === 'trial' && before.status === 'active');

    await billing1.handlePostStripeWebhook(mockReq({ headers: { 'stripe-signature': 'valid-sig' } }), mockRes());

    var after = mods1.tenantPlan.getPlanState('tenant-upgrade');
    check('AC1: after webhook, tenant reflects paid/active immediately', after.plan === 'paid' && after.status === 'active');
  }

  // ── AC3: payment-failure event reflects failure state, not silently ignored ──
  console.log('\n── AC3: invoice.payment_failed reflects failure state (not silently ignored) ──');
  {
    var mods3 = freshModules();
    mods3.tenantPlan.resetPlanState();
    mods3.tenantPlan.setPlanState('tenant-fail', 'paid', 'active'); // was paid before the failure
    var failureEvt = {
      id: 'evt_ac3',
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_1', metadata: { tenant_id: 'tenant-fail' } } }
    };
    var billing3 = freshBilling({ webhooks: { constructEvent: function() { return failureEvt; } } });

    var before3 = mods3.tenantPlan.getPlanState('tenant-fail');
    var res3 = mockRes();
    await billing3.handlePostStripeWebhook(mockReq({ headers: { 'stripe-signature': 'valid-sig' } }), res3);
    var after3 = mods3.tenantPlan.getPlanState('tenant-fail');

    check('AC3: webhook returns 200 (never 4xx/5xx to Stripe)', res3._statusCode === 200);
    check('AC3: plan state changed from pre-event state (not silently dropped)',
      JSON.stringify(before3) !== JSON.stringify(after3));
    check('AC3: plan state reflects failure (past_due)', after3.status === 'past_due');
  }

  // ── AC4: cancellation event downgrades plan and restricts usage gates ────
  console.log('\n── AC4: customer.subscription.deleted downgrades plan and restricts usage gates ──');
  {
    var mods4 = freshModules();
    mods4.tenantPlan.resetPlanState();
    process.env.MAX_JOURNEYS_PER_TENANT = '2';
    mods4.tenantPlan.setPlanState('tenant-cancel', 'paid', 'active');

    var whilePaid = mods4.tenantPlan.checkJourneyCap('tenant-cancel', 10);
    check('AC4: while paid+active, usage gate is unrestricted', whilePaid.allowed === true);

    var cancelEvt = {
      id: 'evt_ac4',
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_2', metadata: { tenant_id: 'tenant-cancel' } } }
    };
    var billing4 = freshBilling({ webhooks: { constructEvent: function() { return cancelEvt; } } });
    await billing4.handlePostStripeWebhook(mockReq({ headers: { 'stripe-signature': 'valid-sig' } }), mockRes());

    var afterCancel = mods4.tenantPlan.checkJourneyCap('tenant-cancel', 10);
    check('AC4: after cancellation, usage gate blocks an action the old (paid) plan allowed',
      afterCancel.allowed === false && afterCancel.cap === 2);

    delete process.env.MAX_JOURNEYS_PER_TENANT;
  }

  // ── Regression: existing lab-s3.4 credit-provisioning event types unaffected ──
  console.log('\n── Regression: checkout.session.completed still provisions credits (lab-s3.4) ──');
  {
    process.env.CREDITS_PLAN_STARTER = '1000';
    var adjCalls = [];
    var mods5 = freshModules();
    mods5.credits.setCreditsAdapter({
      query: async function(sql, params) {
        if (sql.includes('UPDATE credits')) adjCalls.push({ delta: params[0], tenantId: params[1] });
        return { rows: [] };
      }
    });
    var checkoutEvt2 = {
      id: 'evt_regress',
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'tenant-regress', metadata: { planName: 'STARTER' } } }
    };
    var billing5 = freshBilling({ webhooks: { constructEvent: function() { return checkoutEvt2; } } });
    await billing5.handlePostStripeWebhook(mockReq({ headers: { 'stripe-signature': 'valid-sig' } }), mockRes());
    check('regression: credits still provisioned on checkout.session.completed', adjCalls.length > 0 && adjCalls[0].delta === 1000);
  }

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('Test error:', err.message, err.stack);
  process.exit(1);
});
