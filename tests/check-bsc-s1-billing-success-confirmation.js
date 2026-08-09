'use strict';
// check-bsc-s1-billing-success-confirmation.js — AC verification tests for bsc-s1
// Real, visible checkout confirmation sourced from Stripe checkout session
// metadata, not a client-suppliable query parameter.
// No real Stripe API calls — adapter is fully monkeypatched.

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV = 'test';

var path = require('path');
var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;
function check(label, ok) {
  if (ok) { passed++; console.log('PASS:', label); }
  else { failed++; console.error('FAIL:', label); }
}

function mockReq(opts) {
  opts = opts || {};
  var session = opts.session !== undefined ? opts.session : { accessToken: 'tok', tenantId: 'tenant-abc' };
  return { session: session, body: opts.body, headers: opts.headers || { host: 'test.example.com' }, query: opts.query || {} };
}

function mockRes() {
  return {
    _statusCode: null, _headers: {}, _body: null,
    writeHead: function(status, headers) { this._statusCode = status; if (headers) Object.assign(this._headers, headers); },
    end: function(body) { this._body = body || null; }
  };
}

var stripeClientPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'stripe-client'));
var billingPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'billing'));
var posthogPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'posthog-server'));

function freshModules() {
  delete require.cache[stripeClientPath];
  delete require.cache[billingPath];
  return {
    stripeClient: require(stripeClientPath),
    billing: require(billingPath)
  };
}

(async function main() {
  // ── AC1 (creation half): createCheckoutSession sets metadata.planId ────────
  (function testCreateSessionMetadata() {
    var mods = freshModules();
    var calls = [];
    mods.stripeClient.setStripeAdapter({
      checkout: { sessions: { create: async function(params) { calls.push(params); return { id: 'cs_x', url: 'https://checkout.stripe.com/pay/cs_x' }; } } }
    });
    return mods.stripeClient.createCheckoutSession({
      priceId: 'price_pro', tenantId: 'tenant-abc', successUrl: 'https://x/success', cancelUrl: 'https://x/cancel', planId: 'PRO'
    }).then(function() {
      check('createCheckoutSession-sets-metadata-planId', calls[0] && calls[0].metadata && calls[0].metadata.planId === 'PRO');
    });
  })();

  // ── AC1 (retrieve half) + AC2 + AC3: confirmation page names the real plan ──
  await (async function testConfirmationPage() {
    var mods = freshModules();
    mods.stripeClient.setStripeAdapter({
      checkout: { sessions: {
        create: async function() { return { id: 'cs_test_pro', url: 'https://checkout.stripe.com/pay/cs_test_pro' }; },
        retrieve: async function(sessionId) {
          check('retrieve-called-with-real-session-id', sessionId === 'cs_test_pro');
          return { id: 'cs_test_pro', metadata: { planId: 'PRO' } };
        }
      } }
    });
    var req = mockReq({ query: { session_id: 'cs_test_pro' } });
    var res = mockRes();
    await mods.billing.handleGetBillingSuccess(req, res);

    check('billing-success-renders-200-confirmation-not-redirect', res._statusCode === 200);
    check('billing-success-body-mentions-payment-success', typeof res._body === 'string' && /payment|success/i.test(res._body));
    check('billing-success-body-names-real-plan', typeof res._body === 'string' && /pro/i.test(res._body));
    check('billing-success-has-continue-link-to-dashboard', typeof res._body === 'string' && /href="\/dashboard"/i.test(res._body));
  })();

  // ── AC4: checkout_completed PostHog event carries the real plan name ───────
  await (async function testPosthogRealPlanName() {
    var mods = freshModules();
    mods.stripeClient.setStripeAdapter({
      checkout: { sessions: {
        retrieve: async function() { return { id: 'cs_test_pro', metadata: { planId: 'ENTERPRISE' } }; }
      } }
    });
    var posthogModule = require(posthogPath);
    var originalCapture = posthogModule.capture;
    var calls = [];
    posthogModule.capture = function(id, event, props) { calls.push({ id: id, event: event, props: props }); };

    var req = mockReq({ query: { session_id: 'cs_test_pro' } });
    var res = mockRes();
    await mods.billing.handleGetBillingSuccess(req, res);
    await new Promise(function(r) { setTimeout(r, 10); });

    var phCall = calls.find(function(c) { return c.event === 'checkout_completed'; });
    check('posthog-checkout-completed-fired', !!phCall);
    check('posthog-planName-is-real-not-empty', !!phCall && phCall.props.planName === 'ENTERPRISE');

    posthogModule.capture = originalCapture;
  })();

  // NFR: a client-supplied plan_name query param must never be trusted
  await (async function testNoClientSuppliablePlanName() {
    var mods = freshModules();
    mods.stripeClient.setStripeAdapter({
      checkout: { sessions: { retrieve: async function() { return { id: 'cs_test_free', metadata: { planId: 'FREE' } }; } } }
    });
    var req = mockReq({ query: { session_id: 'cs_test_free', plan_name: 'ENTERPRISE' } });
    var res = mockRes();
    await mods.billing.handleGetBillingSuccess(req, res);
    check('client-suppliable-plan-name-ignored', typeof res._body === 'string' && /free/i.test(res._body) && !/enterprise/i.test(res._body));
  })();

  // ── AC5: fails open when session_id is missing ──────────────────────────────
  await (async function testMissingSessionId() {
    var mods = freshModules();
    mods.stripeClient.setStripeAdapter({ checkout: { sessions: {} } });
    var req = mockReq({ query: {} });
    var res = mockRes();
    var threw = false;
    try { await mods.billing.handleGetBillingSuccess(req, res); } catch (e) { threw = true; }
    check('missing-session-id-does-not-throw', !threw);
    check('missing-session-id-falls-back-to-dashboard-redirect', res._statusCode === 302 && res._headers['Location'] === '/dashboard');
  })();

  // ── AC5: fails open when Stripe retrieve throws ─────────────────────────────
  await (async function testRetrieveFails() {
    var mods = freshModules();
    mods.stripeClient.setStripeAdapter({
      checkout: { sessions: { retrieve: async function() { throw new Error('Stripe API error'); } } }
    });
    var req = mockReq({ query: { session_id: 'cs_broken' } });
    var res = mockRes();
    var threw = false;
    try { await mods.billing.handleGetBillingSuccess(req, res); } catch (e) { threw = true; }
    check('retrieve-failure-does-not-throw', !threw);
    check('retrieve-failure-falls-back-to-dashboard-redirect', res._statusCode === 302 && res._headers['Location'] === '/dashboard');
  })();

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
