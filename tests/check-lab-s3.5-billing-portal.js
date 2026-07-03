'use strict';
// check-lab-s3.5-billing-portal.js — AC verification tests for lab-s3.5 (Billing portal + pre-launch checklist)
// Covers: AC1 (portal redirect), AC2 (no session → /), AC3 (prelaunch exits 0), AC4 (prelaunch exits 1), AC6 (returnUrl contains /dashboard)
// No real Stripe API calls — adapter is fully monkeypatched.

// Set process.env BEFORE any require() of application code
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV = 'test';

var path     = require('path');
var fs       = require('fs');
var { execSync } = require('child_process');
var ROOT     = path.join(__dirname, '..');

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

function mockReq(opts) {
  opts = opts || {};
  return {
    session: opts.session !== undefined ? opts.session : { accessToken: 'tok', tenantId: 'tenant-abc' },
    body:    opts.body !== undefined    ? opts.body    : undefined,
    headers: opts.headers || { host: 'test.example.com' },
    query:   opts.query  || {},
  };
}

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

// ── Unit tests ────────────────────────────────────────────────────────────────

setImmediate(function() {
  // Isolate fresh module instances for each test group
  var stripeClientPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'stripe-client'));
  var billingPath      = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'billing'));

  delete require.cache[stripeClientPath];
  delete require.cache[billingPath];

  var stripeClient = require(stripeClientPath);

  // Wire a mock Stripe adapter that records calls to billingPortal.sessions.create
  var portalCalls = [];
  var mockStripe = {
    billingPortal: {
      sessions: {
        create: async function(params) {
          portalCalls.push(params);
          return { url: 'https://billing.stripe.com/session/test_portal_123' };
        }
      }
    }
  };
  stripeClient.setStripeAdapter(mockStripe);

  // Reload billing so it picks up the fresh stripeClient
  delete require.cache[billingPath];
  var billing = require(billingPath);

  (async function runUnitTests() {

    // ── AC1: authenticated session with stripeCustomerId → 302 to portal URL ──
    console.log('\n── AC1: GET /settings/billing with valid session → 302 to portal URL ──');

    portalCalls.length = 0;
    var req1 = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-abc', stripeCustomerId: 'cus_test_123' } });
    var res1 = mockRes();
    await billing.handleGetBillingPortal(req1, res1);

    check(
      'portal-redirects-to-stripe-portal-url',
      res1._statusCode === 302 &&
      res1._headers['Location'] === 'https://billing.stripe.com/session/test_portal_123'
    );

    check(
      'portal-calls-create-with-correct-customer-id',
      portalCalls.length === 1 &&
      portalCalls[0].customer === 'cus_test_123'
    );

    // ── AC6: returnUrl passed to createPortalSession contains '/dashboard' ──
    console.log('\n── AC6: returnUrl contains /dashboard ──');

    check(
      'portal-return-url-contains-dashboard',
      portalCalls.length === 1 &&
      typeof portalCalls[0].return_url === 'string' &&
      portalCalls[0].return_url.includes('/dashboard')
    );

    // ── AC2: no session → 302 to /, Stripe NOT called ────────────────────────
    console.log('\n── AC2: GET /settings/billing with no session → 302 to / ──');

    portalCalls.length = 0;
    var req2 = mockReq({ session: {} }); // no accessToken
    var res2 = mockRes();
    await billing.handleGetBillingPortal(req2, res2);

    check(
      'portal-no-session-redirects-to-root',
      res2._statusCode === 302 && res2._headers['Location'] === '/'
    );

    check(
      'portal-no-session-stripe-not-called',
      portalCalls.length === 0
    );

    // ── AC2 variant: null session → 302 to / ─────────────────────────────────
    portalCalls.length = 0;
    var req2b = mockReq({ session: null });
    var res2b = mockRes();
    await billing.handleGetBillingPortal(req2b, res2b);

    check(
      'portal-null-session-redirects-to-root',
      res2b._statusCode === 302 && res2b._headers['Location'] === '/'
    );

  })().catch(function(err) {
    console.error('Unit test error:', err.message, err.stack);
    failed++;
  }).then(runPrelaunchTests);

});

// ── Prelaunch script tests ────────────────────────────────────────────────────

function runPrelaunchTests() {
  console.log('\n── AC3/AC4: check-prelaunch-stripe.js ──');

  var scriptPath = path.join(ROOT, 'scripts', 'check-prelaunch-stripe.js');

  // AC3: all vars set and non-placeholder → exit 0
  console.log('\n── AC3: All vars set (non-placeholder) → exit 0 ──');

  var envForAC3 = Object.assign({}, process.env, {
    STRIPE_SECRET_KEY:      'sk_test_real_key',
    STRIPE_WEBHOOK_SECRET:  'whsec_real_secret',
    STRIPE_PRICE_ID_STARTER: 'price_real_starter',
    STRIPE_PRICE_ID_PRO:     'price_real_pro',
  });

  var ac3ExitCode = null;
  var ac3Output   = '';
  try {
    ac3Output   = execSync('node "' + scriptPath + '"', { env: envForAC3, encoding: 'utf8' });
    ac3ExitCode = 0;
  } catch (e) {
    ac3ExitCode = e.status;
    ac3Output   = (e.stdout || '') + (e.stderr || '');
  }

  check(
    'prelaunch-exits-0-when-all-vars-non-placeholder',
    ac3ExitCode === 0
  );

  check(
    'prelaunch-ac3-output-contains-check-marks',
    ac3Output.includes('set (not placeholder)')
  );

  // AC4: one var is placeholder → exit 1, names the failing var
  console.log('\n── AC4: One var set to placeholder → exit 1, names failing var ──');

  var envForAC4 = Object.assign({}, process.env, {
    STRIPE_SECRET_KEY:       'sk_test_real_key',
    STRIPE_WEBHOOK_SECRET:   'whsec_real_secret',
    STRIPE_PRICE_ID_STARTER: 'STRIPE_PLAN_PRICE_ID_PLACEHOLDER',
    STRIPE_PRICE_ID_PRO:     'price_real_pro',
  });

  var ac4ExitCode = null;
  var ac4Output   = '';
  try {
    ac4Output   = execSync('node "' + scriptPath + '"', { env: envForAC4, encoding: 'utf8' });
    ac4ExitCode = 0;
  } catch (e) {
    ac4ExitCode = e.status;
    ac4Output   = (e.stdout || '') + (e.stderr || '');
  }

  check(
    'prelaunch-exits-1-when-placeholder-found',
    ac4ExitCode === 1
  );

  check(
    'prelaunch-ac4-output-names-failing-var',
    ac4Output.includes('STRIPE_PRICE_ID_STARTER')
  );

  // ── Integration: server.js registers /settings/billing ───────────────────
  console.log('\n── IT: server.js registration check ──');

  var serverSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'server.js'), 'utf8');

  check(
    'settings-billing-route-registered-in-server',
    serverSrc.includes('/settings/billing') &&
    serverSrc.includes('handleGetBillingPortal')
  );

  check(
    'handleGetBillingPortal-imported-from-billing',
    serverSrc.includes("handleGetBillingPortal } = require('./routes/billing')")
  );

  // ── Results ───────────────────────────────────────────────────────────────
  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}
