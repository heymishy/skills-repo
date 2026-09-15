'use strict';

// pod-store.js — ep1-s1: pods/pod_members schema bootstrap + data access.
// Mirrors user-roles.js's migrateTeamSchema() CREATE TABLE IF NOT EXISTS
// convention exactly -- idempotent, safe to call again on every server
// restart. Reuses _userRolesPool (ADR-026: reuse before introducing a new
// pool) since pods are conceptually the same family as people/team_memberships.
//
// Role validation is a hardcoded constant, not a role_definitions table --
// see decisions.md (2026-09-15) for why. When a future story introduces the
// real role_definitions table (stage-visibility, per-tenant custom roles),
// migrate VALID_ROLES into seed rows there rather than the reverse.
const crypto = require('crypto');

const VALID_ROLES = ['conductor', 'engineer', 'architect', 'product'];

function isValidRole(roleId) {
  return VALID_ROLES.indexOf(roleId) !== -1;
}

/**
 * Startup schema bootstrap for pods/pod_members (AC1's underlying tables).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {{info: Function}} [logger] - injectable logger (defaults to console.log)
 */
async function migratePodsSchema(pool, logger) {
  const log = logger || { info: function(msg) { console.log(msg); } };

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pods (
      pod_id     UUID        PRIMARY KEY,
      tenant_id  VARCHAR     NOT NULL,
      name       VARCHAR     NOT NULL,
      created_by VARCHAR,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status     VARCHAR     NOT NULL DEFAULT 'active',
      UNIQUE(tenant_id, name)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pod_members (
      id         SERIAL      PRIMARY KEY,
      pod_id     UUID        NOT NULL REFERENCES pods(pod_id),
      user_id    VARCHAR     NOT NULL,
      role_id    VARCHAR     NOT NULL,
      joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status     VARCHAR     NOT NULL DEFAULT 'active'
    )
  `);

  log.info('[ep1-s1] pods/pod_members schema migrated');
}

/**
 * Look up a pod by (tenantId, name) -- used for the AC2 duplicate-name check.
 * @returns {Promise<object|null>}
 */
async function findPodByName(pool, tenantId, name) {
  const result = await pool.query('SELECT pod_id, name FROM pods WHERE tenant_id = $1 AND name = $2', [tenantId, name]);
  return result.rows[0] || null;
}

/**
 * List every pod for a tenant (GET /api/pods, AC "tenant isolation").
 * @returns {Promise<object[]>}
 */
async function listPods(pool, tenantId) {
  const result = await pool.query('SELECT pod_id, name, created_at FROM pods WHERE tenant_id = $1', [tenantId]);
  return result.rows;
}

/**
 * Create a pod + its members in one call. Caller (routes/pods.js) is
 * responsible for AC2 (duplicate-name) and AC3 (invalid-role) validation
 * BEFORE calling this -- this function assumes valid input.
 * @param {object} pool
 * @param {{tenantId: string, name: string, createdBy: string, members: {userId: string, roleId: string}[]}} args
 * @returns {Promise<{podId: string, name: string, memberCount: number}>}
 */
async function createPod(pool, args) {
  const podId = crypto.randomUUID();
  try {
    await pool.query('INSERT INTO pods (pod_id, tenant_id, name, created_by) VALUES ($1, $2, $3, $4)', [podId, args.tenantId, args.name, args.createdBy]);
  } catch (err) {
    if (err && err.code === '23505') {
      const nameTakenErr = new Error("A pod named '" + args.name + "' already exists");
      nameTakenErr.code = 'POD_NAME_TAKEN';
      throw nameTakenErr;
    }
    throw err;
  }
  for (const m of args.members) {
    await pool.query('INSERT INTO pod_members (pod_id, user_id, role_id) VALUES ($1, $2, $3)', [podId, m.userId, m.roleId]);
  }
  return { podId, name: args.name, memberCount: args.members.length };
}

module.exports = {
  VALID_ROLES,
  isValidRole,
  migratePodsSchema,
  findPodByName,
  listPods,
  createPod
};
