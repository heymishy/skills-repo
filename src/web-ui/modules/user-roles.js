'use strict';

// user-roles.js — injectable user role lookup module (arl-s1, D37 compliant).
// Default stub throws — call setGetUserRole() with a real implementation before use.
//
// tir-s1: extended in place (not a parallel module — see decisions.md) with a
// second, person/team-scoped adapter (getRoleForTenant/setGetRoleForTenant) plus
// the people/team_memberships schema bootstrap + backfill (migrateTeamSchema) and
// its lookup helper (resolveRoleForTenant). getUserRole/setGetUserRole above are
// left completely untouched — the legacy user_roles table and adapter stay in
// place, unused by any production call site after this story (Out of Scope).

let _getUserRole = null;

function setGetUserRole(fn) {
  _getUserRole = fn;
}

/**
 * Return the role for a tenant. Falls back to 'user' if no row found.
 * @param {string} tenantId
 * @returns {Promise<string>}
 */
async function getUserRole(tenantId) {
  if (!_getUserRole) {
    throw new Error('Adapter not wired: getUserRole. Call setGetUserRole() before use.');
  }
  return _getUserRole(tenantId);
}

// ── tir-s1: person/team-scoped adapter (D37) ────────────────────────────────
// Default stub, when unwired, falls back to the legacy getUserRole adapter IF
// that has been wired -- this is not a silent/empty-value stub, it is an
// explicit delegation to another real, already-wired adapter, preserving pre
// -tir-s1 test/caller behaviour (AC4) with zero modification to those tests.
// It only throws (D37-compliant) when *neither* adapter has been wired. In
// production, server.js (AC6) always wires setGetRoleForTenant, so the
// fallback branch is dead in production and exists only for backward
// compatibility with callers/tests that predate this story.
let _getRoleForTenant = null;

function setGetRoleForTenant(fn) {
  _getRoleForTenant = fn;
}

/**
 * Return the role for a tenant via the person/team-membership lookup path.
 * @param {string} tenantId
 * @returns {Promise<string>}
 */
async function getRoleForTenant(tenantId) {
  if (_getRoleForTenant) {
    return _getRoleForTenant(tenantId);
  }
  if (_getUserRole) {
    return _getUserRole(tenantId);
  }
  throw new Error('Adapter not wired: getRoleForTenant. Call setGetRoleForTenant() with a real implementation before use.');
}

var _defaultLogger = { info: function(msg) { console.log(msg); } };

/**
 * Insert a single person + team_memberships row for tenantId/role if (and only
 * if) no team_memberships row already exists for that tenant -- idempotent.
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {string} tenantId
 * @param {string} role
 */
async function _backfillOne(pool, tenantId, role) {
  const existing = await pool.query('SELECT 1 FROM team_memberships WHERE tenant_id = $1 LIMIT 1', [tenantId]);
  if (existing.rows.length) return; // already migrated -- idempotent rerun (AC1)
  const personResult = await pool.query('INSERT INTO people DEFAULT VALUES RETURNING id');
  const personId = personResult.rows[0].id;
  await pool.query(
    'INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3) ON CONFLICT (person_id, tenant_id) DO NOTHING',
    [personId, tenantId, role]
  );
}

/**
 * Startup schema bootstrap (AC1) + backfill of every legacy user_roles row
 * into the new schema, unchanged (AC2). Mirrors the existing
 * journey-store-pg.js CREATE TABLE IF NOT EXISTS convention -- idempotent,
 * safe to call again on every server restart.
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {{info: Function}} [logger] - injectable logger (defaults to console.log)
 */
async function migrateTeamSchema(pool, logger) {
  const log = logger || _defaultLogger;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS people (
      id         SERIAL      PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS team_memberships (
      person_id  INTEGER     NOT NULL REFERENCES people(id),
      tenant_id  VARCHAR     NOT NULL,
      role       VARCHAR     NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (person_id, tenant_id)
    )
  `);

  const legacy = await pool.query('SELECT tenant_id, role FROM user_roles');
  for (const row of legacy.rows) {
    await _backfillOne(pool, row.tenant_id, row.role);
  }

  log.info('[tir-s1] people/team_memberships schema migrated (' + legacy.rows.length + ' legacy user_roles row(s) considered for backfill)');
}

/**
 * Resolve the role for a tenant via team_memberships, lazily migrating a
 * legacy user_roles row on first miss (AC5). Falls back to 'user' if neither
 * table has a row for this tenant (matches the old getUserRole default).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {string} tenantId
 * @returns {Promise<string>}
 */
async function resolveRoleForTenant(pool, tenantId) {
  const membership = await pool.query('SELECT role FROM team_memberships WHERE tenant_id = $1 LIMIT 1', [tenantId]);
  if (membership.rows.length) return membership.rows[0].role;

  // AC5: not migrated yet -- check the legacy table and lazily backfill.
  const legacy = await pool.query('SELECT role FROM user_roles WHERE tenant_id = $1', [tenantId]);
  if (!legacy.rows.length) return 'user';

  const role = legacy.rows[0].role;
  await _backfillOne(pool, tenantId, role);
  return role;
}

module.exports = {
  getUserRole,
  setGetUserRole,
  getRoleForTenant,
  setGetRoleForTenant,
  migrateTeamSchema,
  resolveRoleForTenant
};
