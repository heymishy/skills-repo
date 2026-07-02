'use strict';

// stripe-client.js — D37-injectable Stripe API wrapper (lab-s3.2)
// Default stub throws — call setStripeAdapter() with a real Stripe instance before use.
//
// Usage:
//   const { createCheckoutSession, setStripeAdapter } = require('./modules/stripe-client');
//   setStripeAdapter(require('stripe')(process.env.STRIPE_SECRET_KEY));
//   const session = await createCheckoutSession({ priceId, tenantId, successUrl, cancelUrl });

let _stripe = null;

/**
 * Wire the real Stripe SDK instance (separate D37 wiring task — done in server.js).
 * @param {object} impl - Stripe SDK instance (e.g. require('stripe')(key))
 */
function setStripeAdapter(impl) {
  _stripe = impl;
}

function requireAdapter() {
  if (!_stripe) {
    throw new Error('Adapter not wired: stripeClient. Call setStripeAdapter() before use.');
  }
  return _stripe;
}

/**
 * Create a Stripe Checkout session for subscription.
 * @param {object} params
 * @param {string} params.priceId      - Stripe price ID (sourced from env var, never hardcoded)
 * @param {string} params.tenantId     - tenant ID set as client_reference_id (used by webhook in lab-s3.4)
 * @param {string} params.successUrl   - must include {CHECKOUT_SESSION_ID} Stripe template literal
 * @param {string} params.cancelUrl    - cancel redirect URL
 * @returns {Promise<object>} Stripe Checkout Session object (contains session.url)
 */
async function createCheckoutSession({ priceId, tenantId, successUrl, cancelUrl }) {
  var stripe = requireAdapter();
  return stripe.checkout.sessions.create({
    mode:                'subscription',
    line_items:          [{ price: priceId, quantity: 1 }],
    client_reference_id: tenantId,
    success_url:         successUrl,
    cancel_url:          cancelUrl,
  });
}

/**
 * Create a Stripe Billing Portal session.
 * Stub only in this story — implemented fully in lab-s3.5.
 * @param {string} customerId
 * @param {string} returnUrl
 */
async function createPortalSession(customerId, returnUrl) { // eslint-disable-line no-unused-vars
  throw new Error('Adapter not wired: stripeClient. Call setStripeAdapter() before use.');
}

module.exports = { setStripeAdapter, createCheckoutSession, createPortalSession };
