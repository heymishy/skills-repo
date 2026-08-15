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

/**
 * AC4: atomically mark a team invite redeemed -- returns null if it was
 * already redeemed (or never existed), so a second redemption attempt for
 * the same already-used token is always rejected, even under concurrency.
 * Mirrors client-invitations.js's markInvitationRedeemed exactly.
 * @param {object} pool
 * @param {string} teamInvitationId
 * @param {{info: Function}} [logger]
 * @returns {Promise<object|null>}
 */
async function markTeamInvitationRedeemed(pool, teamInvitationId, logger) {
  var log = logger || _defaultLogger;
  var result = await pool.query(
    'UPDATE team_invitations SET redeemed_at = NOW() ' +
    'WHERE team_invitation_id = $1 AND redeemed_at IS NULL AND expires_at > NOW() ' +
    'RETURNING team_invitation_id, tenant_id, email, role, created_at, expires_at, redeemed_at',
    [teamInvitationId]
  );
  var row = result.rows.length ? result.rows[0] : null;
  if (row) {
    log.info(JSON.stringify({
      event: 'team_invite_redeemed',
      team_invitation_id: row.team_invitation_id,
      tenant_id: row.tenant_id,
      timestamp: new Date().toISOString()
    }));
  }
  return row;
}

/**
 * AC1/AC2/AC3: resolve-or-create the invitee's person + team_memberships row,
 * scoped to the invite's own tenant_id and role (never accept-time request
 * input -- ADR-025). Mirrors client-invitations.js's
 * createClientOrgUserAndAdminMembership's resolve-or-create person logic
 * exactly, but parameterises role instead of hardcoding 'admin' (this
 * story's own Architecture Constraint).
 * @param {object} pool
 * @param {string} tenantId
 * @param {string} email
 * @param {string} role
 * @param {{info: Function}} [logger]
 * @returns {Promise<{personId: number, tenantId: string, email: string, role: string}>}
 */
async function createOrReuseTeamMemberAndMembership(pool, tenantId, email, role, logger) {
  var log = logger || _defaultLogger;

  var existingLink = await pool.query('SELECT person_id FROM person_identities WHERE identity_key = $1', [email]);
  var personId;
  if (existingLink.rows.length) {
    personId = existingLink.rows[0].person_id;
  } else {
    var personResult = await pool.query('INSERT INTO people DEFAULT VALUES RETURNING id');
    personId = personResult.rows[0].id;
    await pool.query(
      'INSERT INTO person_identities (identity_key, person_id, provider) VALUES ($1, $2, $3) ON CONFLICT (identity_key) DO NOTHING',
      [email, personId, 'magic-link']
    );
  }

  await pool.query(
    'INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3) ' +
    'ON CONFLICT (person_id, tenant_id) DO UPDATE SET role = EXCLUDED.role',
    [personId, tenantId, role]
  );

  log.info(JSON.stringify({
    event: 'team_invite_member_joined',
    tenant_id: tenantId,
    person_id: personId,
    role: role,
    timestamp: new Date().toISOString()
  }));

  return { personId: personId, tenantId: tenantId, email: email, role: role };
}

/**
 * AC1-AC4: resolve a redeemed team-invite payload (the JWT payload carrying
 * `destination` [the invitee's email] and `teamInvitationId`) into either a
 * successfully created/updated team_memberships row, or a rejection reason
 * (invite not found, email mismatch, or already redeemed -- AC4 edge case).
 * Mirrors client-invitations.js's redeemInvitation exactly.
 * @param {object} pool
 * @param {{destination:string, teamInvitationId:string}} payload
 * @param {{info:Function}} [logger]
 * @returns {Promise<{ok:true, user:object}|{ok:false, reason:string}>}
 */
async function redeemTeamInvitation(pool, payload, logger) {
  var teamInvitationId = payload && payload.teamInvitationId;
  var invitation = await getInvitationById(pool, teamInvitationId);
  if (!invitation || invitation.email !== (payload && payload.destination)) {
    return { ok: false, reason: 'invitation not found' };
  }
  var redeemed = await markTeamInvitationRedeemed(pool, invitation.team_invitation_id, logger);
  if (!redeemed) {
    // Explanatory-only: the atomic UPDATE above already made the real
    // redemption decision (both redeemed_at IS NULL and expires_at > NOW()
    // are checked together, in the same WHERE clause -- wsi-s3's own NFR).
    // This comparison only selects which rejection message to return; it
    // never re-decides whether redemption succeeded. expires_at is
    // immutable, so comparing the already-fetched value against "now" here
    // (a moment after the atomic UPDATE ran) is always accurate.
    var isExpired = new Date(invitation.expires_at).getTime() <= Date.now();
    if (isExpired) {
      return { ok: false, reason: 'invitation expired' };
    }
    return { ok: false, reason: 'invitation already used' };
  }
  var user = await createOrReuseTeamMemberAndMembership(pool, invitation.tenant_id, invitation.email, invitation.role, logger);
  return { ok: true, user: user };
}

module.exports = { migrateTeamInvitationsSchema, createInvitation, getInvitationById, markTeamInvitationRedeemed, createOrReuseTeamMemberAndMembership, redeemTeamInvitation };
