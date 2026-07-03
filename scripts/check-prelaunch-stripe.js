'use strict';
// check-prelaunch-stripe.js — Pre-launch checklist: verify all Stripe env vars are set and non-placeholder.
// Usage: node scripts/check-prelaunch-stripe.js
// Exit 0: all vars set and not placeholder — safe to deploy.
// Exit 1: one or more vars are missing or still equal to the placeholder sentinel.
//
// No npm dependencies — only process.env reads and process.exit().

var PLACEHOLDER = 'STRIPE_PLAN_PRICE_ID_PLACEHOLDER';

var VARS_TO_CHECK = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID_STARTER',
  'STRIPE_PRICE_ID_PRO',
];

var failed = false;

VARS_TO_CHECK.forEach(function(varName) {
  var value = process.env[varName];
  if (!value || value === PLACEHOLDER) {
    var reason = value === PLACEHOLDER ? 'still set to placeholder (' + PLACEHOLDER + ')' : 'not set';
    console.error('FAIL: ' + varName + ' — ' + reason);
    failed = true;
  } else {
    console.log('✓ ' + varName + ' set (not placeholder)');
  }
});

if (failed) {
  console.error('\nPre-launch check FAILED. Replace all placeholder values before deploying.');
  process.exit(1);
} else {
  console.log('\nAll Stripe env vars are set and non-placeholder. Safe to deploy.');
  process.exit(0);
}
