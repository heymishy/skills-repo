'use strict';

// check-sec-perf-s3-billing-checkout-csrf.js — AC3 (story sec-perf-s3)
// Story: artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s3.md

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV = 'test';

var assert = require('assert');
var path = require('path');
var ROOT = path.join(__dirname, '..');

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

var stripeClientPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'stripe-client'));
var billingPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'billing'));
var publicPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'public'));

function mockReq(opts) {
  opts = opts || {};
  return {
    session: opts.session !== undefined ? opts.session : { accessToken: 'tok', tenantId: 'tenant-abc' },
    body:    opts.body !== undefined    ? opts.body    : undefined,
    headers: opts.headers || { host: 'test.example.com' },
    query:   opts.query  || {}
  };
}

function mockRes() {
  var res = {
    _statusCode: null,
    _headers: {},
    _body: null,
    writeHead: function(status, headers) {
      this._statusCode = status;
      if (headers) { var self = this; Object.keys(headers).forEach(function(k) { self._headers[k] = headers[k]; }); }
    },
    setHeader: function(name, value) { this._headers[name] = value; },
    end: function(body) { this._body = body || null; }
  };
  return res;
}

function extractCsrfValue(html) {
  var m = html.match(/name="_csrf" value="([^"]*)"/);
  return m ? m[1] : null;
}

async function run() {
  console.log('=== sec-perf-s3 AC3: billing checkout CSRF protection ===');

  process.env.STRIPE_PRICE_ID_STARTER = 'price_env_configured_value';
  process.env.STRIPE_PRICE_ID_PRO = 'price_pro_configured';

  delete require.cache[stripeClientPath];
  var stripeClient = require(stripeClientPath);
  var stripeCalls = [];
  stripeClient.setStripeAdapter({
    checkout: { sessions: { create: async function(params) { stripeCalls.push(params); return { id: 'cs_test_123', url: 'https://checkout.stripe.com/pay/cs_test_123' }; } } }
  });

  var queue = [];

  // AC3a: POST with no _csrf field -> 403, Stripe not called
  queue.push(function() {
    return test('AC3a: POST /billing/checkout with no _csrf field returns 403', async function() {
      stripeCalls.length = 0;
      delete require.cache[billingPath];
      var billing = require(billingPath);

      var req = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-abc', csrfToken: 'real-session-token' }, body: { planId: 'starter' } });
      var res = mockRes();
      await billing.handlePostCheckout(req, res);

      assert.strictEqual(res._statusCode, 403, 'Expected 403, got ' + res._statusCode);
      assert.strictEqual(res._body, 'Forbidden');
      assert.strictEqual(stripeCalls.length, 0, 'Stripe Checkout must NOT be created without a valid CSRF token');
    });
  });

  // AC3b: mismatched token -> 403
  queue.push(function() {
    return test('AC3b: POST with mismatched _csrf value returns 403', async function() {
      stripeCalls.length = 0;
      delete require.cache[billingPath];
      var billing = require(billingPath);

      var req = mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-abc', csrfToken: 'real-session-token' }, body: { planId: 'starter', _csrf: 'attacker-guess' } });
      var res = mockRes();
      await billing.handlePostCheckout(req, res);

      assert.strictEqual(res._statusCode, 403);
      assert.strictEqual(stripeCalls.length, 0);
    });
  });

  // AC3c: full round trip -- GET /welcome embeds real token, POST with it -> succeeds
  queue.push(function() {
    return test('AC3c: round trip -- GET /welcome embeds real token, POST /billing/checkout with it succeeds (302)', async function() {
      stripeCalls.length = 0;
      delete require.cache[billingPath];
      delete require.cache[publicPath];
      var billing = require(billingPath);
      var pub = require(publicPath);

      var session = { accessToken: 'tok', tenantId: 'tenant-abc', userId: 42, firstLogin: true };
      var getReq = mockReq({ session: session });
      var getRes = mockRes();
      await pub.handleWelcome(getReq, getRes);
      var token = extractCsrfValue(getRes._body);
      assert.ok(token, 'a _csrf token must be embedded in the rendered /welcome plan forms');
      assert.strictEqual(session.csrfToken, token, 'the embedded token must be the one stored on the session');

      var postReq = mockReq({ session: session, body: { planId: 'starter', _csrf: token } });
      var postRes = mockRes();
      await billing.handlePostCheckout(postReq, postRes);

      assert.strictEqual(postRes._statusCode, 302, 'Expected 302 redirect, got ' + postRes._statusCode);
      assert.strictEqual(postRes._headers['Location'], 'https://checkout.stripe.com/pay/cs_test_123');
      assert.strictEqual(stripeCalls.length, 1, 'Stripe Checkout must be created on a legitimate round-trip submission');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===');
  if (failed > 0) {
    failures.forEach(function(f) {
      console.log('FAILED:', f.name, '-', f.err && f.err.message || f.err);
    });
    process.exit(1);
  }
  process.exit(0);
}

run();
