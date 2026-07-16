'use strict';
var fs   = require('fs');
var path = require('path');

// Injectable cap reader — lets tests control cap without touching env vars or disk.
// When null, the module reads MAX_JOURNEYS_PER_TENANT and tenant-caps.json directly.
var _capReader = null;
function setCapReader(fn) { _capReader = fn; }

// ── jlc-s1: tenant plan-state store, persisted to Postgres ──────────────────
// bri-s3.5 originally stored this in a plain in-memory Map, updated by the
// Stripe webhook handler (src/web-ui/routes/billing.js) when a
// checkout/payment-failure/cancellation event is processed. That store had
// zero persistence: any server restart (deploy, crash, scaling event) wiped
// it, silently reverting every tenant to the default trial/active state and
// re-applying the free/trial count cap to a legitimately paying tenant.
// jlc-s1 replaces the Map with a D37 injectable Postgres adapter, matching
// credits.js's existing pattern — same table-per-tenant, same
// INSERT ... ON CONFLICT DO UPDATE upsert shape.
var _planStateDb = null;

/** Wire the real Postgres pool (or an injected test double) — D37 pattern. */
function setPlanStateAdapter(impl) {
  _planStateDb = impl;
}

function requirePlanStateAdapter() {
  if (!_planStateDb) {
    throw new Error('Adapter not wired: planStateDb. Call setPlanStateAdapter() before use.');
  }
  return _planStateDb;
}

var DEFAULT_PLAN_STATE = { plan: 'trial', status: 'active' };

/**
 * Record a tenant's plan/status, driven by Stripe webhook events (bri-s3.5):
 *   checkout.session.completed → setPlanState(tenantId, 'paid', 'active')
 *   invoice.payment_failed     → setPlanState(tenantId, 'trial', 'past_due')
 *   customer.subscription.deleted → setPlanState(tenantId, 'trial', 'canceled')
 * jlc-s1: now persisted via the planStateDb adapter (tenant_plan table).
 * Fail-open: if the adapter is unwired or the write genuinely errors, this
 * logs and swallows the error rather than throwing — a plan-state write
 * failure must never crash Stripe webhook processing or cause Stripe to see
 * a non-200 response (billing.js's own AC6 requirement).
 * @param {string} tenantId
 * @param {string} plan   - 'trial' | 'paid'
 * @param {string} status - 'active' | 'past_due' | 'canceled'
 * @returns {Promise<void>}
 */
async function setPlanState(tenantId, plan, status) {
  try {
    var db = requirePlanStateAdapter();
    await db.query(
      'INSERT INTO tenant_plan (tenant_id, plan, status, updated_at) VALUES ($1, $2, $3, now()) ' +
      'ON CONFLICT (tenant_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at',
      [tenantId, plan, status]
    );
  } catch (err) {
    console.error('[tenant-plan] setPlanState failed for tenant ' + tenantId + ': ' + err.message);
  }
}

/**
 * Read a tenant's plan state. Defaults to trial/active for an untracked tenant.
 * jlc-s1 AC3: if the planStateDb adapter is unwired, or the read genuinely
 * errors, fails open to the safe default rather than throwing — this is read
 * on every journey-creation attempt and billing-status check, so a DB hiccup
 * here must never 500 an unrelated request or grant unconditional access.
 * @param {string} tenantId
 * @returns {Promise<{plan:string, status:string}>}
 */
async function getPlanState(tenantId) {
  try {
    var db = requirePlanStateAdapter();
    var result = await db.query('SELECT plan, status FROM tenant_plan WHERE tenant_id = $1', [tenantId]);
    if (!result.rows.length) return Object.assign({}, DEFAULT_PLAN_STATE);
    return { plan: result.rows[0].plan, status: result.rows[0].status };
  } catch (err) {
    return Object.assign({}, DEFAULT_PLAN_STATE);
  }
}

/**
 * Test-only helper: clear all tracked plan state back to default trial/active.
 * Issues a DELETE against the wired adapter (fail-open — a no-op, not a
 * throw, when no adapter is wired, so callers that never wire one don't break).
 * @returns {Promise<void>}
 */
async function resetPlanState() {
  try {
    var db = requirePlanStateAdapter();
    await db.query('DELETE FROM tenant_plan');
  } catch (err) {
    // No adapter wired, or the delete failed — either way, there's nothing
    // more this test helper can safely do. Callers relying on it when no
    // adapter is wired already get the correct default from getPlanState.
  }
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
 * jlc-s1: now async — getPlanState reads the persisted plan state. This is a
 * real, necessary signature change; getPlanState itself never throws (it
 * fails open to the safe trial/active default internally), so this function
 * never throws either.
 * @param {string} tenantId
 * @param {number} currentCount — number of journeys the tenant already owns
 * @param {string} [repoRoot]
 * @returns {Promise<{ allowed: boolean, cap: number|null, count: number }>}
 */
async function checkJourneyCap(tenantId, currentCount, repoRoot) {
  var planState = await getPlanState(tenantId);
  if (planState.plan === 'paid' && planState.status === 'active') {
    return { allowed: true, cap: null, count: currentCount };
  }
  var cap = getJourneyCap(tenantId, repoRoot);
  if (cap === null) return { allowed: true,              cap: null, count: currentCount };
  return            { allowed: currentCount < cap,       cap: cap,  count: currentCount };
}

module.exports = {
  checkJourneyCap,
  setCapReader,
  getPlanState,
  setPlanState,
  resetPlanState,
  setPlanStateAdapter
};
