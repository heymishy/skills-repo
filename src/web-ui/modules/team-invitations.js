'use strict';

// team-invitations.js — wsi-s1
//
// Mirrors modules/client-invitations.js's shape (invitation_id PK, atomic
// single-use redemption via UPDATE ... WHERE redeemed_at IS NULL RETURNING *)
// with 3 additions this feature needs that client_invitations has no column
// for: tenant_id (joining an EXISTING tenant, not creating a new org), role
// (the admin-chosen role — client_invitations always hardcodes 'admin'), and
// expires_at (client_invitations has no expiry at all — this feature's own
// 24-hour rule, per decisions.md's Q4 resolution).
//
// ADR-026 reuse-check confirmed with operator at /definition: genuinely a
// new table, not an extension of client_invitations, to avoid coupling two
// features' schemas together.

var _defaultLogger = { info: function (msg) { console.log(msg); } };

function _genId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

/**
 * Startup schema bootstrap. Idempotent, matching client-invitations.js's own
 * CREATE TABLE IF NOT EXISTS migration convention.
 * @param {object} pool
 * @returns {Promise<void>}
 */
async function migrateTeamInvitationsSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS team_invitations (
      team_invitation_id VARCHAR     PRIMARY KEY,
      tenant_id           VARCHAR     NOT NULL,
      email               VARCHAR     NOT NULL,
      role                VARCHAR     NOT NULL,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at           TIMESTAMPTZ NOT NULL,
      redeemed_at          TIMESTAMPTZ
    )
  `);
}

/**
 * Create a pending team invite, scoped to the admin's own tenant (AC1).
 * @param {object} pool
 * @param {string} tenantId - the calling admin's own tenant (req.session.tenantId), never request input (ADR-025)
 * @param {string} email
 * @param {string} role - one of team-management.js's VALID_ROLES
 * @param {string} [adminId] - the calling admin's own session identifier, for the audit log
 * @param {{info: Function}} [logger]
 * @returns {Promise<{team_invitation_id:string, tenant_id:string, email:string, role:string, created_at:string, expires_at:string, redeemed_at:(string|null)}>}
 */
async function createInvitation(pool, tenantId, email, role, adminId, logger) {
  var log = logger || _defaultLogger;
  var invitationId = _genId('tinv');
  var expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  var result = await pool.query(
    'INSERT INTO team_invitations (team_invitation_id, tenant_id, email, role, expires_at) ' +
    'VALUES ($1, $2, $3, $4, $5) RETURNING team_invitation_id, tenant_id, email, role, created_at, expires_at, redeemed_at',
    [invitationId, tenantId, email, role, expiresAt]
  );
  var row = result.rows[0];
  // Audit: invitation_id + tenant_id + role + admin + timestamp — never the raw token (issued only inside the emailed link).
  log.info(JSON.stringify({
    event: 'team_invite_created',
    team_invitation_id: row.team_invitation_id,
    tenant_id: tenantId,
    role: role,
    created_by: adminId,
    timestamp: new Date().toISOString()
  }));
  return row;
}

/**
 * Read a single invite row by ID.
 * @param {object} pool
 * @param {string} teamInvitationId
 * @returns {Promise<object|null>}
 */
async function getInvitationById(pool, teamInvitationId) {
  var result = await pool.query(
    'SELECT team_invitation_id, tenant_id, email, role, created_at, expires_at, redeemed_at ' +
    'FROM team_invitations WHERE team_invitation_id = $1',
    [teamInvitationId]
  );
  return result.rows.length ? result.rows[0] : null;
}

module.exports = { migrateTeamInvitationsSchema, createInvitation, getInvitationById };
