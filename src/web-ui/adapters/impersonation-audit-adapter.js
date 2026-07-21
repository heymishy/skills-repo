'use strict';

/**
 * impersonation-audit-adapter.js — d1 (D37 injectable adapter)
 *
 * Writes one immutable audit row per impersonation session start, and reads
 * rows back for verification (AC6) / D3's future viewing UI. Backs a new
 * `impersonation_audit_log` table. A genuinely new data-access layer for a
 * genuinely new table (mirrors modules-adapter.js's own a1 reasoning) — not
 * an existing adapter repurposed for a new query shape (CLAUDE.md's
 * mock-shape-verification rule / the tir-s5/tir-s8 incident it exists to
 * prevent).
 *
 * D37 rule 1: the stub default throws (never returns null/empty) until
 * setImpersonationAuditAdapter() wires a real Postgres pool in server.js.
 */

var _db = null;

/**
 * Wire the real Postgres pool (or an injected test double) — D37 pattern.
 * @param {object} pool — a `.query(sql, params)`-capable client (real pg.Pool
 *   or a test double).
 */
function setImpersonationAuditAdapter(pool) {
  _db = pool;
}

function _requireAdapter() {
  if (!_db) {
    throw new Error('Adapter not wired: impersonationAuditDb. Call setImpersonationAuditAdapter() before use.');
  }
  return _db;
}

/**
 * Write one audit row recording the real admin's identity, the target's
 * identity, the reason, and a timestamp (AC3). Never receives or stores
 * req.session.accessToken — callers must pass identity fields only.
 * @param {{adminId:*, adminLogin:string, adminTenantId:string, targetId:*, targetLogin:string, targetTenantId:string, reason:string}} record
 * @returns {Promise<object>} the inserted row (id, admin_id, admin_login, admin_tenant_id, target_id, target_login, target_tenant_id, reason, created_at)
 */
async function writeImpersonationAudit(record) {
  var db = _requireAdapter();
  var r = await db.query(
    `INSERT INTO impersonation_audit_log
       (admin_id, admin_login, admin_tenant_id, target_id, target_login, target_tenant_id, reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, admin_id, admin_login, admin_tenant_id, target_id, target_login, target_tenant_id, reason, created_at`,
    [record.adminId, record.adminLogin, record.adminTenantId, record.targetId, record.targetLogin, record.targetTenantId, record.reason]
  );
  return r.rows[0];
}

/**
 * Retrieve a single audit row by id (AC6 verification / D3's future viewing UI).
 * @param {*} auditId
 * @returns {Promise<object|null>}
 */
async function getImpersonationAuditRow(auditId) {
  var db = _requireAdapter();
  var r = await db.query('SELECT * FROM impersonation_audit_log WHERE id = $1', [auditId]);
  return r.rows.length ? r.rows[0] : null;
}

/**
 * List every audit row, most recent first (AC6 verification / D3's future viewing UI).
 * @returns {Promise<Array<object>>}
 */
async function listImpersonationAuditRows() {
  var db = _requireAdapter();
  var r = await db.query('SELECT * FROM impersonation_audit_log ORDER BY created_at DESC');
  return r.rows;
}

module.exports = {
  setImpersonationAuditAdapter,
  writeImpersonationAudit,
  getImpersonationAuditRow,
  listImpersonationAuditRows
};
