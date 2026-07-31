'use strict';

// client-invitations.js -- story-3-self-service-provisioning
// (artefacts/2026-07-30-agency-client-organisations)
//
// Data model for the first-user invitation flow (AC3): one row per issued
// invitation, keyed by invitation_id, scoped to the new Client org
// (client_org_id) and the inviting Agency org (invited_by_org_id, audit
// only). Single-use enforcement mirrors modules/agency-client-grants.js's
// revokeGrant() convention exactly: an atomic
// `UPDATE ... WHERE ... AND redeemed_at IS NULL RETURNING *` so a second,
// concurrent redemption attempt for the same invitation can never both
// succeed (AC3 edge case).
//
// No D37 injectable adapter here (DoR H-ADAPTER: table lookups use the
// existing DB pool directly, not a swappable external integration) -- every
// function below takes `pool` as an explicit argument, mirroring
// modules/organisations.js / modules/agency-client-grants.js's precedent
// (this story's direct upstream dependencies).
//
// Audit (NFR): the raw invitation token is NEVER logged in plaintext by any
// function in this module -- only invitation_id, client_org_id, and
// timestamps are ever passed to a logger. The token itself lives only in the
// signed JWT the invited email receives (see auth/magic-link-strategy.js).

var _defaultLogger = { info: function(msg) { console.log(msg); } };

function _genId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

/**
 * Startup schema bootstrap. Idempotent -- safe to call on every server
 * restart, matching this codebase's existing CREATE TABLE IF NOT EXISTS
 * migration convention (see modules/organisations.js's migrateOrganisationsSchema).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @returns {Promise<void>}
 */
async function migrateClientInvitationsSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_invitations (
      invitation_id     VARCHAR     PRIMARY KEY,
      client_org_id     VARCHAR     NOT NULL,
      email             VARCHAR     NOT NULL,
      invited_by_org_id VARCHAR     NOT NULL,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      redeemed_at       TIMESTAMPTZ
    )
  `);
}

/**
 * Create a pending invitation row for the first user of a brand-new Client
 * org (AC3).
 * @param {object} pool
 * @param {string} clientOrgId
 * @param {string} email
 * @param {string} invitedByOrgId - the inviting Agency org's own org_id (audit only)
 * @param {{info: Function}} [logger]
 * @returns {Promise<{invitation_id:string, client_org_id:string, email:string, invited_by_org_id:string, created_at:string, redeemed_at:(string|null)}>}
 */
async function createInvitation(pool, clientOrgId, email, invitedByOrgId, logger) {
  var log = logger || _defaultLogger;
  var invitationId = _genId('inv');
  var result = await pool.query(
    'INSERT INTO client_invitations (invitation_id, client_org_id, email, invited_by_org_id) ' +
    'VALUES ($1, $2, $3, $4) RETURNING invitation_id, client_org_id, email, invited_by_org_id, created_at, redeemed_at',
    [invitationId, clientOrgId, email, invitedByOrgId]
  );
  var row = result.rows[0];
  // Audit (NFR): invitation_id + client_org_id + inviting org + timestamp --
  // never the raw token (issued separately by auth/magic-link-strategy.js,
  // never passed into this module at all).
  log.info(JSON.stringify({
    event: 'invitation_created',
    invitation_id: row.invitation_id,
    client_org_id: clientOrgId,
    invited_by_org_id: invitedByOrgId,
    timestamp: new Date().toISOString()
  }));
  return row;
}

/**
 * Read a single invitation row by ID -- used by the shared magic-link
 * strategy's verify() callback (wired in server.js) to resolve the
 * invitationId carried inside the redeemed JWT payload.
 * @param {object} pool
 * @param {string} invitationId
 * @returns {Promise<object|null>}
 */
async function getInvitationById(pool, invitationId) {
  var result = await pool.query(
    'SELECT invitation_id, client_org_id, email, invited_by_org_id, created_at, redeemed_at ' +
    'FROM client_invitations WHERE invitation_id = $1',
    [invitationId]
  );
  return result.rows.length ? result.rows[0] : null;
}

/**
 * AC3 edge case: atomically mark an invitation redeemed -- returns null if it
 * was already redeemed (or never existed), so a second redemption attempt
 * for the same already-used token is always rejected, even under
 * concurrency. Mirrors modules/agency-client-grants.js's revokeGrant()
 * WHERE ... IS NULL convention.
 * @param {object} pool
 * @param {string} invitationId
 * @param {{info: Function}} [logger]
 * @returns {Promise<object|null>}
 */
async function markInvitationRedeemed(pool, invitationId, logger) {
  var log = logger || _defaultLogger;
  var result = await pool.query(
    'UPDATE client_invitations SET redeemed_at = NOW() ' +
    'WHERE invitation_id = $1 AND redeemed_at IS NULL ' +
    'RETURNING invitation_id, client_org_id, email, invited_by_org_id, created_at, redeemed_at',
    [invitationId]
  );
  var row = result.rows.length ? result.rows[0] : null;
  if (row) {
    log.info(JSON.stringify({
      event: 'invitation_redeemed',
      invitation_id: row.invitation_id,
      client_org_id: row.client_org_id,
      timestamp: new Date().toISOString()
    }));
  }
  return row;
}

/**
 * Create the invited user's account (a new `people` row + `person_identities`
 * link, unless this email already resolves to an existing person) and their
 * `team_memberships` row with role='admin', scoped to the new Client org's
 * own tenant_id (AC3 role-model decision -- see decisions.md 2026-07-31 ARCH
 * entry, Stories 3+6).
 *
 * This reuses team-management.js's exact team_memberships INSERT statement
 * SHAPE, not the addOrUpdateTeammate() function itself: that function throws
 * UnknownIdentityError when identityKey resolves to no existing person --
 * exactly the case for a brand-new invitee who has never logged in before.
 * Calling it here would always throw. See decisions.md for the full writeup
 * (flagged there, not silently guessed).
 *
 * @param {object} pool
 * @param {string} clientOrgId
 * @param {string} email
 * @param {{info: Function}} [logger]
 * @returns {Promise<{personId: number, tenantId: string, email: string, role: string}>}
 */
async function createClientOrgUserAndAdminMembership(pool, clientOrgId, email, logger) {
  var log = logger || _defaultLogger;

  // Reuse an existing person if this email has already logged in / been
  // linked elsewhere (ADR-026: reuse before introducing a new entity) --
  // otherwise create a brand-new person row, mirroring
  // modules/user-roles.js's _backfillOne exactly.
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

  // team-management.js's addOrUpdateTeammate INSERT statement, verbatim
  // shape (ADR-026 reuse) -- role='admin', scoped to the NEW Client org's
  // own tenant_id, never the inviting Agency's.
  await pool.query(
    'INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3) ' +
    'ON CONFLICT (person_id, tenant_id) DO UPDATE SET role = EXCLUDED.role',
    [personId, clientOrgId, 'admin']
  );

  log.info(JSON.stringify({
    event: 'client_org_user_created',
    client_org_id: clientOrgId,
    person_id: personId,
    role: 'admin',
    timestamp: new Date().toISOString()
  }));

  return { personId: personId, tenantId: clientOrgId, email: email, role: 'admin' };
}

/**
 * AC3: resolve a redeemed invitation payload (the JWT payload carrying
 * `destination` [the invited email] and `invitationId`) into either a
 * successfully created Client-org user + team_memberships(role='admin')
 * row, or a rejection reason (invitation not found, email mismatch, or
 * already redeemed -- AC3 edge case: a second redemption attempt with the
 * same already-used token is always rejected).
 *
 * This is the domain logic the shared magic-link strategy's verify()
 * callback (registered once in server.js -- see auth/magic-link-strategy.js)
 * delegates to. Kept here rather than inline in server.js so it is directly
 * unit-testable with a fake pool, without needing to exercise the real JWT
 * sign/verify machinery for a pure domain-logic test.
 * @param {object} pool
 * @param {{destination:string, invitationId:string}} payload
 * @param {{info:Function}} [logger]
 * @returns {Promise<{ok:true, user:object}|{ok:false, reason:string}>}
 */
async function redeemInvitation(pool, payload, logger) {
  var invitationId = payload && payload.invitationId;
  var invitation = await getInvitationById(pool, invitationId);
  if (!invitation || invitation.email !== (payload && payload.destination)) {
    return { ok: false, reason: 'invitation not found' };
  }
  var redeemed = await markInvitationRedeemed(pool, invitation.invitation_id, logger);
  if (!redeemed) {
    // AC3 edge case: already redeemed -- reject the second attempt.
    return { ok: false, reason: 'invitation already used' };
  }
  var user = await createClientOrgUserAndAdminMembership(pool, invitation.client_org_id, invitation.email, logger);
  return { ok: true, user: user };
}

module.exports = {
  migrateClientInvitationsSchema,
  createInvitation,
  getInvitationById,
  markInvitationRedeemed,
  createClientOrgUserAndAdminMembership,
  redeemInvitation
};
