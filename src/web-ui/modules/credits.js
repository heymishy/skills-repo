'use strict';

// credits.js — injectable credits balance module (D37 compliant).
// Default stub throws — call setCreditsAdapter() with a real pg Pool/Client before use.
//
// Usage:
//   const { getBalance, adjustBalance, setCreditsAdapter } = require('./modules/credits');
//   setCreditsAdapter(pgPool);
//   const balance = await getBalance(tenantId);
//   await adjustBalance(tenantId, -1);

let _db = null;

function setCreditsAdapter(impl) {
  _db = impl;
}

function requireAdapter() {
  if (!_db) {
    throw new Error('Adapter not wired: creditsDb. Call setCreditsAdapter() before use.');
  }
  return _db;
}

/**
 * Return the current credit balance for a tenant.
 * Returns 0 if the tenant has no row in the credits table.
 * @param {string} tenantId
 * @returns {Promise<number>}
 */
async function getBalance(tenantId) {
  const db = requireAdapter();
  const result = await db.query(
    'SELECT balance FROM credits WHERE tenant_id = $1',
    [tenantId]
  );
  if (result.rows.length === 0) return 0;
  return result.rows[0].balance;
}

/**
 * Atomically adjust the credit balance for a tenant by delta.
 * Use a negative delta to decrement (e.g. -1 per turn).
 * cuf-s1: Uses INSERT ... ON CONFLICT (tenant_id) DO UPDATE (atomic upsert) rather than a
 * plain UPDATE, so a tenant with no existing `credits` row gets one created with
 * balance = delta instead of the adjustment silently no-op'ing (zero rows affected).
 * ON CONFLICT DO UPDATE SET balance = credits.balance + EXCLUDED.balance still adds to
 * an existing balance rather than overwriting it — same race-free, single-round-trip
 * atomicity as the UPDATE it replaces. Params stay [delta, tenantId] (unchanged order)
 * so existing callers/mocks relying on that order are unaffected. See decisions.md
 * ("credits upsert fix") and story cuf-s1 for the production defect this fixes: the
 * real Stripe checkout.session.completed webhook (routes/billing.js) calls this exact
 * function with no prior row-existence check, so a brand-new paying customer's first
 * checkout previously provisioned zero credits.
 * @param {string} tenantId
 * @param {number} delta  — positive to add credits, negative to deduct
 * @returns {Promise<void>}
 */
async function adjustBalance(tenantId, delta) {
  const db = requireAdapter();
  await db.query(
    'INSERT INTO credits (tenant_id, balance) VALUES ($2, $1) ' +
    'ON CONFLICT (tenant_id) DO UPDATE SET balance = credits.balance + EXCLUDED.balance, updated_at = now()',
    [delta, tenantId]
  );
}

/**
 * Return all tenant balances ordered by tenant_id (for admin UI).
 * @returns {Promise<Array<{tenant_id: string, balance: number}>>}
 */
async function getAllTenantBalances() {
  const db = requireAdapter();
  const result = await db.query(
    'SELECT tenant_id, balance FROM credits ORDER BY tenant_id'
  );
  return result.rows;
}

/**
 * Return all known tenant/account identifiers (allowlist for admin adjustments).
 * catc-s1: Previously queried `credits` alone -- circular with the exact bug
 * cuf-s1 fixed, since it excluded every tenant who does not yet have a
 * `credits` row by definition (the population a first-time top-up most needs
 * to reach). Now returns the de-duplicated union of `users.email` (every
 * email/password tenant -- tenantId === email for that login type, see
 * auth-email.js), `team_memberships.tenant_id` (any tenant ever assigned a
 * role, including GitHub/Google-OAuth tenants added via admin bulk-add or a
 * legacy user_roles backfill), and `credits.tenant_id` (kept for backward
 * compatibility with any tenant whose only record today is a credits row).
 * This is a strict superset of the old allowlist -- nothing it used to accept
 * stops being accepted. All three tables live in the same DATABASE_URL
 * Postgres instance and are migrated unconditionally at server startup, so
 * querying them via the same adapter wired by setCreditsAdapter is safe. See
 * decisions.md ("credits admin top-up tenant check fix") and story catc-s1
 * for the residual gap this does not close: a GitHub/Google-OAuth-only
 * tenant with no team_memberships row and no credits row has no persisted
 * record anywhere in this codebase, so remains rejected (unchanged from
 * before this fix -- not a regression for that population).
 * @returns {Promise<string[]>}
 */
async function getValidTenantIds() {
  const db = requireAdapter();
  const [usersResult, membershipsResult, creditsResult] = await Promise.all([
    db.query('SELECT email FROM users'),
    db.query('SELECT tenant_id FROM team_memberships'),
    db.query('SELECT tenant_id FROM credits')
  ]);
  const ids = new Set();
  usersResult.rows.forEach(function(r) { if (r.email) ids.add(r.email); });
  membershipsResult.rows.forEach(function(r) { if (r.tenant_id) ids.add(r.tenant_id); });
  creditsResult.rows.forEach(function(r) { if (r.tenant_id) ids.add(r.tenant_id); });
  return Array.from(ids);
}

/**
 * arl-s5 — Atomically adjust a tenant's credit balance AND write an immutable audit row
 * recording who made the change, the delta applied, and the before/after balance.
 * cuf-s1: Uses INSERT ... ON CONFLICT (tenant_id) DO UPDATE ... RETURNING balance (atomic
 * upsert) rather than a plain UPDATE, so a tenant with no existing `credits` row gets one
 * created with balance = delta instead of RETURNING yielding zero rows (which previously
 * produced balanceBefore/balanceAfter = null and a nonsensical audit row while the credits
 * table itself never gained a row). balanceBefore/balanceAfter are still captured atomically
 * on the same round trip (no separate read-then-write race). No new D37 adapter — reuses
 * the existing _db wired by setCreditsAdapter (same precedent as
 * getAllTenantBalances/getValidTenantIds).
 * @param {string} tenantId
 * @param {number} delta — positive to add credits (top-up)
 * @param {string} adminId — the admin's identity (req.session.login, never req.session.accessToken)
 * @returns {Promise<{balanceBefore: number, balanceAfter: number}>}
 */
async function adjustBalanceWithAudit(tenantId, delta, adminId) {
  const db = requireAdapter();
  const result = await db.query(
    'INSERT INTO credits (tenant_id, balance) VALUES ($2, $1) ' +
    'ON CONFLICT (tenant_id) DO UPDATE SET balance = credits.balance + EXCLUDED.balance, updated_at = now() ' +
    'RETURNING balance',
    [delta, tenantId]
  );
  const balanceAfter = result.rows.length ? result.rows[0].balance : null;
  const balanceBefore = balanceAfter === null ? null : balanceAfter - delta;
  await db.query(
    'INSERT INTO credit_audit_log (tenant_id, admin_id, delta, balance_before, balance_after) VALUES ($1, $2, $3, $4, $5)',
    [tenantId, adminId, delta, balanceBefore, balanceAfter]
  );
  return { balanceBefore: balanceBefore, balanceAfter: balanceAfter };
}

/**
 * arl-s5 — Return the audit log rows for a tenant, most recent first.
 * @param {string} tenantId
 * @returns {Promise<Array<{tenant_id: string, admin_id: string, delta: number, balance_before: number, balance_after: number, created_at: string}>>}
 */
async function getAuditLog(tenantId) {
  const db = requireAdapter();
  const result = await db.query(
    'SELECT tenant_id, admin_id, delta, balance_before, balance_after, created_at FROM credit_audit_log WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  );
  return result.rows;
}

module.exports = {
  getBalance,
  adjustBalance,
  setCreditsAdapter,
  getAllTenantBalances,
  getValidTenantIds,
  adjustBalanceWithAudit,
  getAuditLog
};
