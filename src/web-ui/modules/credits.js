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
 * Uses UPDATE ... SET balance = balance + $1 to avoid read-modify-write race conditions.
 * @param {string} tenantId
 * @param {number} delta  — positive to add credits, negative to deduct
 * @returns {Promise<void>}
 */
async function adjustBalance(tenantId, delta) {
  const db = requireAdapter();
  await db.query(
    'UPDATE credits SET balance = balance + $1, updated_at = now() WHERE tenant_id = $2',
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
 * Return all known tenant IDs from the credits table (allowlist for admin adjustments).
 * @returns {Promise<string[]>}
 */
async function getValidTenantIds() {
  const db = requireAdapter();
  const result = await db.query('SELECT tenant_id FROM credits');
  return result.rows.map(function(r) { return r.tenant_id; });
}

module.exports = { getBalance, adjustBalance, setCreditsAdapter, getAllTenantBalances, getValidTenantIds };
