'use strict';

// team-management.js — tir-s3
// App-layer logic for an admin adding/assigning a teammate's role within
// their own tenant, on top of tir-s1's team_memberships schema and tir-s2's
// identity resolution. No new D37 adapter (DoR H-ADAPTER: same reasoning as
// tir-s1/tir-s2 -- direct pool access, app-layer DB logic only) -- every
// function here takes `pool` as a plain parameter.
//
// Role granularity here is already per-person, per-tenant -- team_memberships
// supports this via its existing (person_id, tenant_id) composite key (see
// tir-s1). Wiring that per-person distinction into the LIVE login /
// requireAdmin gate is tir-s4's explicit job (see epics/tir-e1.md: "Story 4
// extends requireAdmin to check the per-person role from Story 1's schema" --
// documented current baseline: "requireAdmin only checks tenant-wide role").
// This story only needs the WRITE path (add/assign, AC1/AC4/AC5) and a
// person-scoped READ helper (getRoleForPersonInTenant, AC2) proving the data
// model holds a distinct, individually-assigned role per person -- it does
// NOT rewire auth.js/user-roles.js's existing tenant-wide login resolution
// (resolveRoleForTenant/getRoleForTenant), which remains exactly as tir-s1
// shipped it. This is a deliberate, epic-sequenced scope boundary, not an
// oversight -- see artefacts/2026-07-09-team-identity-roles/plans/tir-s3-plan.md.

var identityLinks = require('./identity-links');

var VALID_ROLES = ['admin', 'engineer', 'product', 'viewer'];

var _defaultLogger = {
  info: function(msg, data) { console.log(msg, data || ''); }
};

/**
 * Thrown when the identity descriptor does not resolve to any existing
 * `people` row (AC5). No placeholder person row is ever created -- this is
 * explicitly Out of Scope per the story.
 * @param {string} message
 */
function UnknownIdentityError(message) {
  Error.call(this, message);
  this.name = 'UnknownIdentityError';
  this.message = message;
  this.status = 400;
  if (Error.captureStackTrace) Error.captureStackTrace(this, UnknownIdentityError);
}
UnknownIdentityError.prototype = Object.create(Error.prototype);
UnknownIdentityError.prototype.constructor = UnknownIdentityError;

/**
 * Thrown when an invalid role string is supplied.
 * @param {string} message
 */
function InvalidRoleError(message) {
  Error.call(this, message);
  this.name = 'InvalidRoleError';
  this.message = message;
  this.status = 400;
  if (Error.captureStackTrace) Error.captureStackTrace(this, InvalidRoleError);
}
InvalidRoleError.prototype = Object.create(Error.prototype);
InvalidRoleError.prototype.constructor = InvalidRoleError;

/**
 * Add an existing person as a teammate of adminTenantId with the given role,
 * or update their role in place if they are already a member (AC1, AC4 --
 * one write path for both cases, per the DoR contract's stated assumption).
 * Rejects (AC5) if identityKey resolves to no existing person -- never
 * creates a placeholder people row.
 *
 * ADR-025 (tenant-scoped authorization): adminTenantId MUST come from the
 * calling admin's own session (req.session.tenantId) at the route layer,
 * never from request input -- this function has no notion of a "target
 * tenant" parameter distinct from the tenant it is invoked with, so there is
 * no cross-tenant write surface to guard against inside this function.
 *
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {string} adminTenantId - the calling admin's own tenant (req.session.tenantId)
 * @param {string} identityKey - GitHub login, Google email/sub, or email/password email
 * @param {string} role - one of admin/engineer/product/viewer
 * @param {string} [adminId] - the calling admin's own session identifier, for the audit log
 * @param {{info: Function}} [logger]
 * @returns {Promise<{personId: number, tenantId: string, role: string, updated: boolean}>}
 */
async function addOrUpdateTeammate(pool, adminTenantId, identityKey, role, adminId, logger) {
  var log = logger || _defaultLogger;

  if (VALID_ROLES.indexOf(role) === -1) {
    throw new InvalidRoleError('Invalid role \'' + role + '\'. Must be one of: ' + VALID_ROLES.join(', '));
  }

  var personId = await identityLinks.resolvePersonForIdentity(pool, identityKey);
  if (personId == null) {
    throw new UnknownIdentityError('No existing person found for this identity -- they must log in at least once before they can be added.');
  }

  var existing = await pool.query(
    'SELECT role FROM team_memberships WHERE tenant_id = $1 AND person_id = $2',
    [adminTenantId, personId]
  );
  var alreadyMember = existing.rows.length > 0;

  await pool.query(
    'INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3) ' +
    'ON CONFLICT (person_id, tenant_id) DO UPDATE SET role = EXCLUDED.role',
    [personId, adminTenantId, role]
  );

  // Audit (NFR): admin id (session-level identifier -- see module header;
  // resolving the admin's own people.id would need the same tenantId-as-
  // identity-key fallback identity-links.js already documents as ambiguous
  // once a tenant has more than one member) + target person id + role +
  // tenant + timestamp -- never the raw identityKey string.
  log.info('teammate_added', {
    adminId: adminId,
    targetPersonId: personId,
    role: role,
    tenantId: adminTenantId,
    updated: alreadyMember,
    timestamp: new Date().toISOString()
  });

  return { personId: personId, tenantId: adminTenantId, role: role, updated: alreadyMember };
}

/**
 * Person-scoped role read (AC2) -- proves the data model holds a distinct
 * role per (person, tenant) pair, e.g. an admin and a teammate sharing one
 * tenant with different roles. NOT currently wired into the live login flow
 * (see module header) -- that wiring is tir-s4's job.
 * @param {object} pool
 * @param {string} tenantId
 * @param {number} personId
 * @returns {Promise<string|null>}
 */
async function getRoleForPersonInTenant(pool, tenantId, personId) {
  var result = await pool.query(
    'SELECT role FROM team_memberships WHERE tenant_id = $1 AND person_id = $2',
    [tenantId, personId]
  );
  return result.rows.length ? result.rows[0].role : null;
}

module.exports = {
  addOrUpdateTeammate,
  getRoleForPersonInTenant,
  UnknownIdentityError,
  InvalidRoleError,
  VALID_ROLES
};
