'use strict';
// check-bpe-s1-billing-portal-error-handling.js — bpe-s1
//
// AC verification for handleGetBillingPortal's error handling + missing-
// customer guard. AC1-AC3 are regression coverage (behaviour already
// shipped in lab-s3.5, re-asserted here since this story touches the same
// function); AC4-AC5 are the new behaviour this story adds.
//
// Set process.env BEFORE any require() of application code.
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV = 'test';

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

function mockReq(opts) {
  opts = opts || {};
  return {
    session: opts.session !== undefined ? opts.session : { accessToken: 'tok', tenantId: 'tenant-abc' },
    headers: opts.headers || { host: 'test.example.com' },
    query: opts.query || {},
  };
}

function mockRes() {
  return {
    _statusCode: null,
    _headers: {},
    _body: null,
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

setImmediate(function() {
  var stripeClientPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'stripe-client'));
  var billingPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'billing'));

  delete require.cache[stripeClientPath];
  delete require.cache[billingPath];

  var stripeClient = require(stripeClientPath);

  var portalCalls = [];
  var _shouldThrow = false;
  var mockStripe = {
    billingPortal: {
      sessions: {
        create: async function(params) {
          portalCalls.push(params);
          if (_shouldThrow) {
            throw new Error('Stripe API error: no such customer');
          }
          return { url: 'https://billing.stripe.com/session/test_portal_123' };
        }
      }
    }
  };
  stripeClient.setStripeAdapter(mockStripe);

  delete require.cache[billingPath];
  var billing = require(billingPath);

  (async function runTests() {

    // ── AC1: valid session + stripeCustomerId → 302 to portal URL ──
    console.log('\n── AC1: valid session + stripeCustomerId → 302 to portal URL ──');
    portalCalls.length = 0;
    _shouldThrow = false;
    var req1 = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-abc', stripeCustomerId: 'cus_test_123' } });
    var res1 = mockRes();
    await billing.handleGetBillingPortal(req1, res1);
    check('billingPortal_validCustomerId_redirectsToPortalUrl',
      res1._statusCode === 302 &&
      res1._headers['Location'] === 'https://billing.stripe.com/session/test_portal_123' &&
      portalCalls.length === 1 &&
      portalCalls[0].customer === 'cus_test_123'
    );

    // ── AC2: returnUrl contains /dashboard ──
    console.log('\n── AC2: returnUrl contains /dashboard ──');
    check('billingPortal_returnUrlContainsDashboard',
      portalCalls.length === 1 &&
      typeof portalCalls[0].return_url === 'string' &&
      portalCalls[0].return_url.includes('/dashboard')
    );

    // ── AC3: no session → 302 to / ──
    console.log('\n── AC3: no session → 302 to / ──');
    portalCalls.length = 0;
    var req3a = mockReq({ session: {} });
    var res3a = mockRes();
    await billing.handleGetBillingPortal(req3a, res3a);
    check('billingPortal_noSession_redirectsToRoot',
      res3a._statusCode === 302 && res3a._headers['Location'] === '/' && portalCalls.length === 0
    );

    var req3b = mockReq({ session: null });
    var res3b = mockRes();
    await billing.handleGetBillingPortal(req3b, res3b);
    check('billingPortal_nullSession_redirectsToRoot',
      res3b._statusCode === 302 && res3b._headers['Location'] === '/' && portalCalls.length === 0
    );

    // ── AC4: missing/null/empty stripeCustomerId → guarded redirect, Stripe not called ──
    console.log('\n── AC4: missing/null/empty stripeCustomerId → 302 to /settings?error=no_billing_account ──');

    portalCalls.length = 0;
    var req4a = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-abc' } }); // no stripeCustomerId key
    var res4a = mockRes();
    await billing.handleGetBillingPortal(req4a, res4a);
    check('billingPortal_missingCustomerId_redirectsToSettingsWithNoBillingAccountError',
      res4a._statusCode === 302 &&
      res4a._headers['Location'] === '/settings?error=no_billing_account' &&
      portalCalls.length === 0
    );

    var req4b = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-abc', stripeCustomerId: null } });
    var res4b = mockRes();
    await billing.handleGetBillingPortal(req4b, res4b);
    check('billingPortal_nullCustomerId_redirectsToSettingsWithNoBillingAccountError',
      res4b._statusCode === 302 &&
      res4b._headers['Location'] === '/settings?error=no_billing_account' &&
      portalCalls.length === 0
    );

    var req4c = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-abc', stripeCustomerId: '' } });
    var res4c = mockRes();
    await billing.handleGetBillingPortal(req4c, res4c);
    check('billingPortal_emptyStringCustomerId_redirectsToSettingsWithNoBillingAccountError',
      res4c._statusCode === 302 &&
      res4c._headers['Location'] === '/settings?error=no_billing_account' &&
      portalCalls.length === 0
    );

    // ── AC5: Stripe throws → caught, 302 to /settings?error=billing_unavailable ──
    console.log('\n── AC5: createPortalSession throws → caught, 302 to /settings?error=billing_unavailable ──');

    portalCalls.length = 0;
    _shouldThrow = true;
    var req5 = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-abc', stripeCustomerId: 'cus_test_456' } });
    var res5 = mockRes();
    await billing.handleGetBillingPortal(req5, res5); // must not throw out of this await
    check('billingPortal_stripeThrows_caughtAndRedirectsToSettingsWithBillingUnavailableError',
      res5._statusCode === 302 &&
      res5._headers['Location'] === '/settings?error=billing_unavailable'
    );
    _shouldThrow = false;

    // ── NFR: structured logging, no raw error leaked to the client ──
    console.log('\n── NFR: structured logging on both new failure paths, no raw error in response ──');

    var warnCalls = [];
    var errorCalls = [];
    var origWarn = console.warn;
    var origError = console.error;
    console.warn = function() { warnCalls.push(Array.prototype.slice.call(arguments)); };
    console.error = function() { errorCalls.push(Array.prototype.slice.call(arguments)); };

    var resNfr1, resNfr2;
    try {
      var reqNfr1 = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-nfr' } });
      resNfr1 = mockRes();
      await billing.handleGetBillingPortal(reqNfr1, resNfr1);

      _shouldThrow = true;
      var reqNfr2 = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-nfr', stripeCustomerId: 'cus_nfr' } });
      resNfr2 = mockRes();
      await billing.handleGetBillingPortal(reqNfr2, resNfr2);
      _shouldThrow = false;
    } finally {
      console.warn = origWarn;
      console.error = origError;
    }

    check('billingPortal_errorLogging_structuredNoRawErrorLeaked',
      warnCalls.length === 1 && String(warnCalls[0][0]).indexOf('billing_portal_no_customer_id') !== -1 &&
      errorCalls.length === 1 && String(errorCalls[0][0]).indexOf('billing_portal_error') !== -1 &&
      // response bodies for both are null (no body written — 302 with no text) and
      // neither response's Location header contains the raw error message text
      String(resNfr1._headers['Location']).indexOf('Stripe API error') === -1 &&
      String(resNfr2._headers['Location']).indexOf('Stripe API error') === -1
    );

    console.log('\n' + passed + ' passed, ' + failed + ' failed');
    if (failed > 0) process.exit(1);

  })().catch(function(err) {
    console.error('Test error:', err.message, err.stack);
    process.exit(1);
  });
});
