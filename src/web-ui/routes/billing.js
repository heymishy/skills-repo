'use strict';

// billing.js — POST /billing/checkout and GET /billing/success route handlers (lab-s3.2)
// Uses D37-injectable stripe-client; PostHog fired fire-and-forget (non-blocking).

var stripeClient = require('../modules/stripe-client');

// Placeholder sentinel used in .env.example — treat as unconfigured.
var PLACEHOLDER = 'STRIPE_PLAN_PRICE_ID_PLACEHOLDER';

// Lazy getter for PostHog — allows monkeypatching in tests without
// requiring the adapter at module load time (pattern from public.js).
function _getPosthog() {
  return require('../modules/posthog-server');
}

/**
 * Read and JSON-parse the full request body.
 * Returns req.body if already parsed (test scenario).
 */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(chunk) { raw += chunk; });
    req.on('end', function() {
      try { resolve(JSON.parse(raw)); } catch (_) { resolve(null); }
    });
    req.on('error', function() { resolve(null); });
  });
}

/**
 * POST /billing/checkout
 *
 * Auth guard: no session → 401 (AC2)
 * Reads plan from req.body.planId (AC5 — price ID from env var)
 * Missing or placeholder price ID → 500 "Billing not configured" (AC3)
 * Creates Stripe Checkout session and responds 302 to session.url (AC1)
 * success_url contains {CHECKOUT_SESSION_ID} Stripe template literal (AC4)
 * client_reference_id is req.session.tenantId (AC1 — needed for webhook in lab-s3.4)
 */
async function handlePostCheckout(req, res) {
  // AC2: auth guard
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'text/plain' });
    res.end('Unauthorized');
    return;
  }

  var body = await _readBody(req);
  var planId = (body && body.planId ? String(body.planId) : '').toUpperCase();
  var priceEnvKey = 'STRIPE_PRICE_ID_' + planId;
  var priceId = process.env[priceEnvKey];

  // AC3: missing or placeholder price ID → 500
  if (!priceId || priceId === PLACEHOLDER) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Billing not configured');
    return;
  }

  // AC4: success_url must use Stripe template literal {CHECKOUT_SESSION_ID} — never URL-encoded
  var host = (req.headers && req.headers.host)
    ? 'https://' + req.headers.host
    : 'https://localhost';
  var successUrl = host + '/billing/success?session_id={CHECKOUT_SESSION_ID}';
  var cancelUrl  = '/welcome';

  // AC1: create Stripe Checkout session with mode:subscription + client_reference_id
  var session = await stripeClient.createCheckoutSession({
    priceId:    priceId,
    tenantId:   req.session.tenantId,
    successUrl: successUrl,
    cancelUrl:  cancelUrl,
  });

  // AC1: redirect to Stripe Checkout
  res.writeHead(302, { Location: session.url });
  res.end();
}

/**
 * GET /billing/success
 *
 * Auth guard: no session → redirect / (AC6 implicit — unauthenticated users sent home)
 * Fires `checkout_completed` PostHog event fire-and-forget (AC6 — must not block redirect)
 * Responds 302 to /dashboard (AC6)
 */
async function handleGetBillingSuccess(req, res) {
  // Auth guard: unauthenticated → redirect to root
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  // AC6: fire checkout_completed event fire-and-forget — do NOT await
  try {
    var planName = (req.query && req.query.plan_name) || '';
    _getPosthog().capture(
      req.session.tenantId || req.session.login || 'anonymous',
      'checkout_completed',
      { planName: planName }
    );
  } catch (_) {}

  // AC6: redirect to dashboard
  res.writeHead(302, { Location: '/dashboard' });
  res.end();
}

module.exports = { handlePostCheckout, handleGetBillingSuccess };
