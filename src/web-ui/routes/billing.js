'use strict';

// billing.js — POST /billing/checkout, GET /billing/success, POST /webhook/stripe (lab-s3.2 / lab-s3.4)
// Uses D37-injectable stripe-client and credits adapter.
// POST /webhook/stripe: raw body required — registered in server.js BEFORE any JSON body parser.

var stripeClient  = require('../modules/stripe-client');
var creditsModule = require('../modules/credits');

// Placeholder sentinel used in .env.example — treat as unconfigured.
var PLACEHOLDER = 'STRIPE_PLAN_PRICE_ID_PLACEHOLDER';

// ── lab-s3.4: Injectable DB adapter for webhook idempotency (stripe_events table) ──────────────
// Default stub throws — call setWebhookDbAdapter() with a real pg Pool before use in production.
// In production, wired to the same Postgres pool as credits (see server.js lab-s3.4 wiring block).
var _webhookDb = null;

function setWebhookDbAdapter(impl) {
  _webhookDb = impl;
}

function requireWebhookDb() {
  if (!_webhookDb) {
    throw new Error('Adapter not wired: webhookDb. Call setWebhookDbAdapter() before use.');
  }
  return _webhookDb;
}

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

/**
 * Read the raw request body as a Buffer.
 * Short-circuits if req.body is already a Buffer or string (test injection scenario).
 * In production, streams the request bytes directly to preserve the raw bytes needed
 * for Stripe webhook signature verification (constructEvent requires the unparsed body).
 */
function _readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  if (typeof req.body === 'string') return Promise.resolve(Buffer.from(req.body));
  return new Promise(function(resolve) {
    var chunks = [];
    req.on('data', function(chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', function() { resolve(Buffer.concat(chunks)); });
    req.on('error', function() { resolve(Buffer.alloc(0)); });
  });
}

/**
 * POST /webhook/stripe (lab-s3.4)
 *
 * CRITICAL: This route must be registered in server.js BEFORE any JSON body-parsing
 * middleware. Stripe signature verification (AC1) requires the raw, unparsed request
 * body bytes. If a JSON body parser runs first, constructEvent will always fail.
 *
 * AC1:  Stripe-Signature header verified via stripe.webhooks.constructEvent → invalid → 400
 * AC2:  checkout.session.completed → adjustBalance(client_reference_id, CREDITS_PLAN_<plan>)
 * AC3:  invoice.paid → adjustBalance(metadata.tenant_id, CREDITS_PLAN_<plan>)
 * AC4:  payment_intent.succeeded → adjustBalance(metadata.tenant_id, metadata.credit_amount)
 * AC5:  Idempotency via INSERT INTO stripe_events ON CONFLICT DO NOTHING (rowCount=0 → skip)
 * AC6:  Unknown event types → log stripe_unhandled_event, return 200 (never 4xx/5xx to Stripe)
 * NFR:  Every adjustBalance call emits { event: 'credits_provisioned', tenantId, amount, stripeEventId }
 */
async function handlePostStripeWebhook(req, res) {
  // AC1 step 1: capture raw body BEFORE any parsing (signature verification needs raw bytes)
  var rawBody = await _readRawBody(req);
  var sig = req.headers['stripe-signature'];
  var webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // AC1 step 2: verify signature — invalid/missing → 400
  var event;
  try {
    event = stripeClient.verifyWebhookSignature(rawBody, sig, webhookSecret);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Webhook signature invalid');
    return;
  }

  // AC5: idempotency — INSERT ON CONFLICT DO NOTHING (check-then-insert is unsafe under concurrent delivery)
  // rowCount === 0 means the stripe_event_id already exists → duplicate → acknowledge without re-processing
  var db = requireWebhookDb();
  var stripeEventId = event.id;
  var insertResult = await db.query(
    'INSERT INTO stripe_events (stripe_event_id) VALUES ($1) ON CONFLICT DO NOTHING',
    [stripeEventId]
  );
  if (insertResult.rowCount === 0) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ received: true }));
    return;
  }

  // AC2 / AC3 / AC4: dispatch on event type
  switch (event.type) {

    case 'checkout.session.completed': {
      // AC2: tenantId from client_reference_id (set by createCheckoutSession in lab-s3.2)
      var obj1 = event.data.object;
      var tenantId1 = obj1.client_reference_id;
      var planName1 = ((obj1.metadata && obj1.metadata.planName) || 'DEFAULT').toUpperCase();
      var amount1 = parseInt(process.env['CREDITS_PLAN_' + planName1] || 100);
      await creditsModule.adjustBalance(tenantId1, amount1);
      console.log(JSON.stringify({ event: 'credits_provisioned', tenantId: tenantId1, amount: amount1, stripeEventId: stripeEventId }));
      break;
    }

    case 'invoice.paid': {
      // AC3: tenantId from invoice metadata (set via subscription metadata on checkout)
      var obj2 = event.data.object;
      var tenantId2 = (obj2.metadata && obj2.metadata.tenant_id) ||
                      (obj2.subscription_details && obj2.subscription_details.metadata && obj2.subscription_details.metadata.tenant_id) ||
                      obj2.client_reference_id;
      var planName2 = ((obj2.metadata && obj2.metadata.plan_name) ||
                       (obj2.subscription_details && obj2.subscription_details.metadata && obj2.subscription_details.metadata.plan_name) ||
                       'DEFAULT').toUpperCase();
      var amount2 = parseInt(process.env['CREDITS_PLAN_' + planName2] || 100);
      await creditsModule.adjustBalance(tenantId2, amount2);
      console.log(JSON.stringify({ event: 'credits_provisioned', tenantId: tenantId2, amount: amount2, stripeEventId: stripeEventId }));
      break;
    }

    case 'payment_intent.succeeded': {
      // AC4: tenantId + credit_amount from payment intent metadata (set when creating top-up PI)
      var obj3 = event.data.object;
      var tenantId3 = obj3.metadata && obj3.metadata.tenant_id;
      var amount3 = parseInt(obj3.metadata && obj3.metadata.credit_amount); // string → integer (AC4 edge case)
      await creditsModule.adjustBalance(tenantId3, amount3);
      console.log(JSON.stringify({ event: 'credits_provisioned', tenantId: tenantId3, amount: amount3, stripeEventId: stripeEventId }));
      break;
    }

    default: {
      // AC6: unknown event type — always 200; log for observability; never 4xx/5xx (would cause Stripe retry)
      console.log(JSON.stringify({ event: 'stripe_unhandled_event', type: event.type, stripeEventId: stripeEventId }));
      break;
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ received: true }));
}

/**
 * GET /settings/billing — Stripe Billing Portal redirect (lab-s3.5)
 *
 * AC2: No session (or no accessToken) → 302 to /
 * AC1: Has session with stripeCustomerId → call createPortalSession → 302 to portal URL
 * AC6: returnUrl passed to createPortalSession contains '/dashboard'
 */
async function handleGetBillingPortal(req, res) {
  // AC2: auth guard — no session → redirect to /
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  // AC1: create portal session and redirect
  var customerId = req.session.stripeCustomerId;
  var portalUrl = await stripeClient.createPortalSession(customerId, '/dashboard');

  res.writeHead(302, { Location: portalUrl });
  res.end();
}

module.exports = { handlePostCheckout, handleGetBillingSuccess, handlePostStripeWebhook, setWebhookDbAdapter, handleGetBillingPortal };
