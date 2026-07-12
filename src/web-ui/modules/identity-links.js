'use strict';

// identity-links.js — tir-s2
// App-layer logic linking a second auth-provider identity to an existing
// person row (tir-s1's people/team_memberships schema). No new D37 adapter
// (DoR H-ADAPTER: reuses existing provider adapters and direct DB access,
// same reasoning tir-s1 applied to resolveRoleForTenant/migrateTeamSchema) —
// every function here takes `pool` as a plain parameter rather than a
// setter/getter injectable pair.
//
// tir-s1's shipped `people` table has NO identity columns (github_id/
// google_sub/email) — just (id, created_at). team_memberships is keyed only
// by tenant_id, with no existing function resolving tenant_id -> person_id
// (only tenant_id -> role, via resolveRoleForTenant). This module adds the
// missing piece: a new join table, person_identities(identity_key -> person_id),
// where identity_key reuses the exact same string every login flow already
// computes as req.session.tenantId (GitHub org/login, Google `sub`, or the
// literal email for email/password — see routes/auth.js / auth-email.js).
// Linking never reads or writes team_memberships.role — ADR-025 (tenant/role
// state is unaffected by identity linking).

var crypto = require('crypto');

var _defaultLogger = {
  info: function(msg, data) { console.log(msg, data || ''); },
  warn: function(msg, data) { console.warn(msg, data || ''); }
};

function _hashIdentity(identityKey) {
  return crypto.createHash('sha256').update(String(identityKey)).digest('hex');
}

/**
 * Error thrown when the identity being linked already belongs to a different
 * person (AC4). Always thrown BEFORE any write — linkIdentity guarantees zero
 * data changes for either person when this is thrown.
 * @param {string} message
 */
function IdentityAlreadyLinkedError(message) {
  Error.call(this, message);
  this.name = 'IdentityAlreadyLinkedError';
  this.message = message;
  this.status = 409;
  if (Error.captureStackTrace) Error.captureStackTrace(this, IdentityAlreadyLinkedError);
}
IdentityAlreadyLinkedError.prototype = Object.create(Error.prototype);
IdentityAlreadyLinkedError.prototype.constructor = IdentityAlreadyLinkedError;

/**
 * Startup schema bootstrap (mirrors migrateTeamSchema's CREATE TABLE IF NOT
 * EXISTS convention in user-roles.js) — idempotent, safe to call again on
 * every server restart. Must run AFTER people/team_memberships exist
 * (person_identities.person_id references people(id)).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {{info: Function}} [logger] - injectable logger (defaults to console.log)
 */
async function migrateIdentityLinksSchema(pool, logger) {
  var log = logger || _defaultLogger;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS person_identities (
      identity_key VARCHAR     PRIMARY KEY,
      person_id    INTEGER     NOT NULL REFERENCES people(id),
      provider     VARCHAR     NOT NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  log.info('[tir-s2] person_identities schema migrated');
}

/**
 * Resolve the person_id that owns a given identity key, or null if no person
 * owns it yet. Checks person_identities first (explicit tir-s2 links), then
 * falls back to team_memberships.tenant_id (identities tir-s1 already
 * migrated/seeded but never explicitly linked via this module). Never reads
 * role — ADR-025.
 * @param {object} pool
 * @param {string} identityKey
 * @returns {Promise<number|null>}
 */
async function resolvePersonForIdentity(pool, identityKey) {
  var linked = await pool.query('SELECT person_id FROM person_identities WHERE identity_key = $1', [identityKey]);
  if (linked.rows.length) return linked.rows[0].person_id;

  var membership = await pool.query('SELECT person_id FROM team_memberships WHERE tenant_id = $1', [identityKey]);
  if (membership.rows.length) return membership.rows[0].person_id;

  return null;
}

/**
 * Link a second provider identity to the person who owns currentIdentityKey
 * (AC1). Rejects with IdentityAlreadyLinkedError — no writes — if
 * newIdentityKey already resolves to a DIFFERENT person (AC4). No-ops
 * (idempotent) if newIdentityKey already resolves to the SAME person.
 * Never merges based on email or any cross-provider inference — identityKey
 * is always the provider-specific key each login flow already computes, and
 * this function only ever compares two already-computed keys (AC3).
 * @param {object} pool
 * @param {string} currentIdentityKey - the identity of the already-authenticated session
 * @param {string} newIdentityKey - the identity being linked (ownership already proven via a completed auth step)
 * @param {string} provider - e.g. 'google', 'github'
 * @param {{info: Function, warn: Function}} [logger]
 * @returns {Promise<{linked: boolean, personId: number, alreadyLinked?: boolean}>}
 */
async function linkIdentity(pool, currentIdentityKey, newIdentityKey, provider, logger) {
  var log = logger || _defaultLogger;

  var currentPersonId = await resolvePersonForIdentity(pool, currentIdentityKey);
  if (currentPersonId == null) {
    throw new Error('Cannot link: no existing person found for the current session identity.');
  }

  var targetPersonId = await resolvePersonForIdentity(pool, newIdentityKey);

  if (targetPersonId != null && targetPersonId !== currentPersonId) {
    throw new IdentityAlreadyLinkedError('This identity is already linked to a different person.');
  }

  if (targetPersonId === currentPersonId) {
    // Idempotent — already linked to the same person, nothing to write.
    return { linked: true, personId: currentPersonId, alreadyLinked: true };
  }

  await pool.query(
    'INSERT INTO person_identities (identity_key, person_id, provider) VALUES ($1, $2, $3)',
    [newIdentityKey, currentPersonId, provider]
  );

  // Audit (NFR): person id + a SHA-256 hash of the linked identity + a
  // timestamp — never the raw identity string or any token value.
  log.info('identity_linked', {
    personId: currentPersonId,
    linkedIdentityHash: _hashIdentity(newIdentityKey),
    provider: provider,
    timestamp: new Date().toISOString()
  });

  return { linked: true, personId: currentPersonId };
}

module.exports = {
  migrateIdentityLinksSchema,
  resolvePersonForIdentity,
  linkIdentity,
  IdentityAlreadyLinkedError
};
