'use strict';
var fs   = require('fs');
var path = require('path');

// Injectable cap reader — lets tests control cap without touching env vars or disk.
// When null, the module reads MAX_JOURNEYS_PER_TENANT and tenant-caps.json directly.
var _capReader = null;
function setCapReader(fn) { _capReader = fn; }

// ── bri-s3.5: tenant plan-state store ────────────────────────────────────────
// In-memory, per-tenantId plan state, updated by the Stripe webhook handler
// (src/web-ui/routes/billing.js) when a checkout/payment-failure/cancellation
// event is processed. Not a D37 adapter (no external system) — a plain
// resettable in-memory store, mirroring the existing _capReader pattern in
// this file. Default (untracked tenant) is the trial plan, active status.
var _planState = new Map();

/**
 * Record a tenant's plan/status, driven by Stripe webhook events (bri-s3.5):
 *   checkout.session.completed → setPlanState(tenantId, 'paid', 'active')
 *   invoice.payment_failed     → setPlanState(tenantId, 'trial', 'past_due')
 *   customer.subscription.deleted → setPlanState(tenantId, 'trial', 'canceled')
 * @param {string} tenantId
 * @param {string} plan   - 'trial' | 'paid'
 * @param {string} status - 'active' | 'past_due' | 'canceled'
 */
function setPlanState(tenantId, plan, status) {
  _planState.set(tenantId, { plan: plan, status: status });
}

/**
 * Read a tenant's plan state. Defaults to trial/active for an untracked tenant.
 * @param {string} tenantId
 * @returns {{plan:string, status:string}}
 */
function getPlanState(tenantId) {
  return _planState.get(tenantId) || { plan: 'trial', status: 'active' };
}

/** Test-only helper: clear all tracked plan state back to default trial/active. */
function resetPlanState() {
  _planState.clear();
}

/**
 * Resolve the journey cap for a given tenantId.
 * Priority: injected capReader > per-tenant tenant-caps.json entry > MAX_JOURNEYS_PER_TENANT env var.
 * Returns null (unlimited) when no cap is configured.
 * @param {string} tenantId
 * @param {string} [repoRoot]
 * @returns {number|null}
 */
function getJourneyCap(tenantId, repoRoot) {
  if (_capReader) return _capReader(tenantId);

  // Per-tenant override file
  if (repoRoot) {
    try {
      var capFile = path.join(repoRoot, 'tenant-caps.json');
      var caps = JSON.parse(fs.readFileSync(capFile, 'utf8'));
      if (caps[tenantId] != null) return Number(caps[tenantId]);
    } catch (_) {}
  }

  // Global env var
  var globalCap = parseInt(process.env.MAX_JOURNEYS_PER_TENANT, 10);
  if (!isNaN(globalCap) && globalCap >= 0) return globalCap;

  return null; // unlimited
}

/**
 * Check whether a tenant is allowed to create another journey.
 * bri-s3.5 AC4: a paid + active tenant is unrestricted (cap lifted); any
 * other plan state (trial, past_due, canceled) falls back to the existing
 * cap resolution — so a downgrade or cancellation webhook event genuinely
 * restores the restriction rather than leaving the tenant at the old
 * plan's (unlimited) access level.
 * @param {string} tenantId
 * @param {number} currentCount — number of journeys the tenant already owns
 * @param {string} [repoRoot]
 * @returns {{ allowed: boolean, cap: number|null, count: number }}
 */
function checkJourneyCap(tenantId, currentCount, repoRoot) {
  var planState = getPlanState(tenantId);
  if (planState.plan === 'paid' && planState.status === 'active') {
    return { allowed: true, cap: null, count: currentCount };
  }
  var cap = getJourneyCap(tenantId, repoRoot);
  if (cap === null) return { allowed: true,              cap: null, count: currentCount };
  return            { allowed: currentCount < cap,       cap: cap,  count: currentCount };
}

module.exports = { checkJourneyCap, setCapReader, getPlanState, setPlanState, resetPlanState };
