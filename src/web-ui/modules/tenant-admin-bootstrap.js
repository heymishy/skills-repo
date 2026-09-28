'use strict';

// tenant-admin-bootstrap.js — tab-s1
// (artefacts/2026-09-26-tenant-admin-bootstrap)
//
// Closes the confirmed real gap (this feature's own discovery.md): no
// existing production code path grants admin to a brand-new tenant's first
// user. Extends the tenant_plan-shaped per-tenant-row pattern (per
// decisions.md, /clarify Q1) via a new sibling table, tenant_admin_bootstrap,
// used purely as an atomic race-safety gate -- team_memberships (the table
// resolveRoleForPerson already reads) remains the single source of truth for
// role, per this story's Architecture Constraints.
//
// No D37 injectable adapter (DoR H-ADAPTER): every function here takes
// `pool` as a plain parameter, matching addOrUpdateTeammate/listTeamMembers/
// backfillIdentityIfNeeded's own established convention for this exact class
// of function.
//
// Transactional atomicity (Architecture Constraints, /review finding 1-H1):
// the tenant_admin_bootstrap claim and the team_memberships admin grant
// happen on ONE checked-out client (pool.connect()), inside a real BEGIN/
// COMMIT/ROLLBACK -- never as separate pool.query() calls, since a pg.Pool's
// query() may route each call to a different pooled connection, which would
// not preserve transaction state across statements.

var _defaultLogger = { info: function(msg, data) { console.log(msg, data || ''); } };

/**
 * Startup schema bootstrap. Idempotent -- safe to call on every server
 * restart, matching tenant_plan's own CREATE TABLE IF NOT EXISTS convention.
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @returns {Promise<void>}
 */
async function migrateTenantAdminBootstrapSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenant_admin_bootstrap (
      tenant_id       VARCHAR     PRIMARY KEY,
      admin_person_id INTEGER     NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Grant admin to personId for tenantId if -- and only if -- this tenant has
 * no admin yet, either via a prior bootstrap (tenant_admin_bootstrap row
 * already claimed) or via any other means (an existing team_memberships row
 * with role='admin', e.g. granted through addOrUpdateTeammate) (AC5).
 *
 * The claim insert combines both checks in ONE statement (WHERE NOT EXISTS
 * ... ON CONFLICT ... DO NOTHING RETURNING) -- see decisions.md
 * (2026-09-28, /implementation-plan entry) for why a separate SELECT would
 * both be unnecessary and would break the NFR-performance test's exact
 * "4 queries" pass threshold.
 *
 * @param {object} pool - pg-Pool-shaped object exposing connect() -> {query, release}
 * @param {string} tenantId
 * @param {number} personId - already-resolved personId (see identity-links.js's
 *   resolveOrCreatePersonForIdentity -- callers must resolve/create this first)
 * @param {{info: Function}} [logger]
 * @returns {Promise<{granted: boolean}>}
 */
async function bootstrapTenantAdminIfNeeded(pool, tenantId, personId, logger) {
  var log = logger || _defaultLogger;
  var client = await pool.connect();
  try {
    await client.query('BEGIN');

    var claim = await client.query(
      'INSERT INTO tenant_admin_bootstrap (tenant_id, admin_person_id) ' +
      'SELECT $1, $2 WHERE NOT EXISTS (' +
      '  SELECT 1 FROM team_memberships WHERE tenant_id = $1 AND role = \'admin\'' +
      ') ON CONFLICT (tenant_id) DO NOTHING RETURNING admin_person_id',
      [tenantId, personId]
    );

    if (!claim.rows.length || claim.rows[0].admin_person_id !== personId) {
      // Lost the race, tenant already bootstrapped, or tenant already has a
      // real admin via other means (AC2/AC5) -- no-op, nothing to grant.
      await client.query('ROLLBACK');
      return { granted: false };
    }

    await client.query(
      'INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3) ' +
      'ON CONFLICT (person_id, tenant_id) DO UPDATE SET role = EXCLUDED.role',
      [personId, tenantId, 'admin']
    );

    await client.query('COMMIT');

    // Audit (NFR): person id + tenant id + timestamp -- never the raw
    // identity string, matching identity-links.js's own established
    // audit-logging convention (this function never even sees a raw
    // identity string -- only the already-resolved personId).
    log.info('admin_bootstrap_granted', {
      personId: personId,
      tenantId: tenantId,
      timestamp: new Date().toISOString()
    });

    return { granted: true };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* best-effort */ }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  migrateTenantAdminBootstrapSchema,
  bootstrapTenantAdminIfNeeded
};
