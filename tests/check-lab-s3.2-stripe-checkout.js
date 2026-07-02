'use strict';
// check-lab-s3.2-stripe-checkout.js — AC verification tests for lab-s3.2 (Stripe Checkout + plan subscription flow)
// Tests T1.1–T1.3, T2.1, T3.1–T3.2, T4.1, T5.1, T6.1–T6.2, T7.1 (unit)
// Integration tests IT1, IT2 and NFR test NFR1
// No real Stripe API calls — adapter is fully monkeypatched.

// Set process.env BEFORE any require() of application code
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV = 'test';

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

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal mock req object for handler tests. */
function mockReq(opts) {
  opts = opts || {};
  return {
    session: opts.session !== undefined ? opts.session : { accessToken: 'tok', tenantId: 'tenant-abc' },
    body:    opts.body !== undefined    ? opts.body    : undefined,
    headers: opts.headers || { host: 'test.example.com' },
    query:   opts.query  || {},
  };
}

/** Build a mock res that captures writeHead and end calls. */
function mockRes() {
  var res = {
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
  return res;
}

// ── T7 — Default Stripe adapter stub throws (AC7) ────────────────────────────
console.log('\n── T7: Default Stripe adapter stub throws (AC7) ──');

(function testT7() {
  var stripeClientPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'stripe-client'));
  delete require.cache[stripeClientPath];
  var stripeClientClean = require(stripeClientPath);

  var threw = false;
  var errMsg = '';
  stripeClientClean.createCheckoutSession({}).then(function() {
    threw = false;
  }).catch(function(e) {
    threw = true;
    errMsg = e.message || '';
  }).then(function() {
    check(
      'default-stripe-adapter-throws-on-create-checkout',
      threw && errMsg.includes('Adapter not wired: stripeClient')
    );
  });
})();

// ── T1–T6 — Main unit tests ───────────────────────────────────────────────────

// We run remaining tests after a short tick so T7 promise resolves first.
setImmediate(function() {

  // Wire a fresh stripe-client with a mock Stripe adapter for T1–T5
  var stripeClientPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'stripe-client'));
  delete require.cache[stripeClientPath];
  var stripeClient = require(stripeClientPath);

  // Also clear billing route cache so it picks up the re-loaded stripe-client
  var billingPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'billing'));
  delete require.cache[billingPath];

  // ── T1–T5 — POST /billing/checkout ──────────────────────────────────────────
  console.log('\n── T1: POST /billing/checkout happy path (AC1) ──');

  (async function testCheckoutHappyPath() {
    // Set up env
    process.env.STRIPE_PRICE_ID_STARTER = 'price_env_configured_value';
    process.env.STRIPE_PRICE_ID_PRO     = 'price_pro_configured';

    // Mock Stripe adapter
    var stripeCalls = [];
    var mockStripe = {
      checkout: {
        sessions: {
          create: async function(params) {
            stripeCalls.push(params);
            return { id: 'cs_test_123', url: 'https://checkout.stripe.com/pay/cs_test_123' };
          }
        }
      }
    };
    stripeClient.setStripeAdapter(mockStripe);

    // Reload billing route so it uses the fresh stripeClient
    delete require.cache[billingPath];
    var billing = require(billingPath);

    var req = mockReq({ body: { planId: 'starter' } });
    var res = mockRes();
    await billing.handlePostCheckout(req, res);

    // T1.1 — createCheckoutSession called with mode:subscription + correct priceId
    var call = stripeCalls[0] || {};
    check(
      'checkout-calls-stripe-create-session-with-subscription-mode',
      call.mode === 'subscription' &&
      Array.isArray(call.line_items) &&
      call.line_items.length === 1 &&
      call.line_items[0].price === 'price_env_configured_value' &&
      call.line_items[0].quantity === 1
    );

    // T1.2 — response is 302 to stripe session URL
    check(
      'checkout-redirects-to-stripe-session-url',
      res._statusCode === 302 &&
      res._headers['Location'] === 'https://checkout.stripe.com/pay/cs_test_123'
    );

    // T1.3 — client_reference_id is tenantId
    check(
      'checkout-includes-client-reference-id',
      call.client_reference_id === 'tenant-abc'
    );

    // ── T2 — Unauthenticated → 401, no Stripe call (AC2) ──────────────────────
    console.log('\n── T2: Unauthenticated → 401 (AC2) ──');

    stripeCalls.length = 0;
    var req2 = mockReq({ session: {} }); // no accessToken
    req2.body = { planId: 'starter' };
    var res2 = mockRes();
    await billing.handlePostCheckout(req2, res2);

    check(
      'checkout-unauthenticated-returns-401-no-stripe-call',
      res2._statusCode === 401 && stripeCalls.length === 0
    );

    // ── T3 — Missing / placeholder price ID → 500 (AC3) ──────────────────────
    console.log('\n── T3: Missing/placeholder price ID → 500 (AC3) ──');

    // T3.1 — missing env var
    stripeCalls.length = 0;
    delete process.env.STRIPE_PRICE_ID_STARTER;
    var req3a = mockReq({ body: { planId: 'starter' } });
    var res3a = mockRes();
    await billing.handlePostCheckout(req3a, res3a);
    check(
      'checkout-missing-price-id-returns-500',
      res3a._statusCode === 500 &&
      (res3a._body || '').includes('Billing not configured') &&
      stripeCalls.length === 0
    );

    // T3.2 — placeholder value
    stripeCalls.length = 0;
    process.env.STRIPE_PRICE_ID_STARTER = 'STRIPE_PLAN_PRICE_ID_PLACEHOLDER';
    var req3b = mockReq({ body: { planId: 'starter' } });
    var res3b = mockRes();
    await billing.handlePostCheckout(req3b, res3b);
    check(
      'checkout-placeholder-price-id-returns-500',
      res3b._statusCode === 500 &&
      (res3b._body || '').includes('Billing not configured') &&
      stripeCalls.length === 0
    );

    // ── T4 — success_url contains {CHECKOUT_SESSION_ID} template literal (AC4) ─
    console.log('\n── T4: success_url template literal (AC4) ──');

    stripeCalls.length = 0;
    process.env.STRIPE_PRICE_ID_STARTER = 'price_env_configured_value';
    var req4 = mockReq({ body: { planId: 'starter' } });
    var res4 = mockRes();
    await billing.handlePostCheckout(req4, res4);
    var callForT4 = stripeCalls[0] || {};
    check(
      'success-url-contains-checkout-session-id-template',
      typeof callForT4.success_url === 'string' &&
      callForT4.success_url.includes('{CHECKOUT_SESSION_ID}') &&
      !callForT4.success_url.includes('%7B') // must NOT be URL-encoded
    );

    // ── T5 — Price ID sourced from env var, not hardcoded (AC5) ──────────────
    console.log('\n── T5: Price ID from env var (AC5) ──');

    stripeCalls.length = 0;
    process.env.STRIPE_PRICE_ID_STARTER = 'price_env_configured_value';
    var req5 = mockReq({ body: { planId: 'starter' } });
    var res5 = mockRes();
    await billing.handlePostCheckout(req5, res5);
    var callForT5 = stripeCalls[0] || {};
    check(
      'price-id-read-from-env-not-hardcoded',
      callForT5.line_items &&
      callForT5.line_items[0] &&
      callForT5.line_items[0].price === 'price_env_configured_value'
    );

    // ── T6 — GET /billing/success (AC6) ──────────────────────────────────────
    console.log('\n── T6: GET /billing/success (AC6) ──');

    // Monkeypatch posthog-server capture
    var posthogPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'posthog-server'));
    var posthogModule = require(posthogPath);
    var originalCapture = posthogModule.capture;
    var posthogCalls = [];
    posthogModule.capture = function(id, event, props) {
      posthogCalls.push({ id: id, event: event, props: props });
    };

    // Reload billing so it uses the patched posthog via lazy getter
    delete require.cache[billingPath];
    var billing2 = require(billingPath);
    // Wire stripe adapter again for the reloaded module
    stripeClient.setStripeAdapter(mockStripe);

    // T6.1 — redirects to /dashboard
    var req6 = mockReq({ query: { session_id: 'cs_test_123', plan_name: 'starter' } });
    var res6 = mockRes();
    await billing2.handleGetBillingSuccess(req6, res6);
    check(
      'billing-success-redirects-to-dashboard',
      res6._statusCode === 302 && res6._headers['Location'] === '/dashboard'
    );

    // T6.2 — fires checkout_completed PostHog event with planName
    // Give a tick for any async fire-and-forget
    await new Promise(function(r) { setTimeout(r, 10); });
    var phCall = posthogCalls.find(function(c) { return c.event === 'checkout_completed'; });
    check(
      'billing-success-fires-posthog-checkout-completed',
      !!phCall &&
      phCall.props !== undefined &&
      'planName' in phCall.props
    );

    // Restore posthog
    posthogModule.capture = originalCapture;

  })().catch(function(err) {
    console.error('Unit test error:', err.message, err.stack);
    failed++;
  }).then(runIntegrationTests);

});

// ── Integration + NFR tests ───────────────────────────────────────────────────

function runIntegrationTests() {
  console.log('\n── IT: Integration tests ──');

  var serverSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'server.js'), 'utf8');

  // IT1 — billing routes registered in server.js
  check(
    'billing-routes-registered-in-server',
    serverSrc.includes('handlePostCheckout') &&
    serverSrc.includes('handleGetBillingSuccess') &&
    serverSrc.includes('/billing/checkout') &&
    serverSrc.includes('/billing/success')
  );

  // IT2 — Stripe adapter wired in server.js (D37 production wiring)
  check(
    'stripe-adapter-wired-in-server',
    serverSrc.includes('setStripeAdapter') &&
    serverSrc.includes('STRIPE_SECRET_KEY') &&
    serverSrc.includes('Stripe adapter wired')
  );

  // ── NFR1 — STRIPE_SECRET_KEY not committed as a value ────────────────────
  console.log('\n── NFR: STRIPE_SECRET_KEY not in committed files ──');

  var { execSync } = require('child_process');
  var grepResult = '';
  try {
    // Look for STRIPE_SECRET_KEY=sk_... (a real key assignment) in committed files
    grepResult = execSync(
      'git grep -n "STRIPE_SECRET_KEY=sk_" -- . 2>/dev/null || true',
      { cwd: ROOT, encoding: 'utf8' }
    );
  } catch (_) {
    grepResult = '';
  }
  check(
    'no-stripe-secret-key-in-committed-files',
    grepResult.trim() === ''
  );

  // ── Results ───────────────────────────────────────────────────────────────
  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}
