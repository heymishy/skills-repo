'use strict';

// user-roles.js — injectable person/team-scoped role lookup module (tir-s1, D37 compliant).
// Default stub throws — call setGetRoleForTenant() with a real implementation before use.
//
// tab-s3: the original arl-s1 legacy tenant-wide adapter this module was
// first built around has been removed entirely (see decisions.md) -- the
// person/team-scoped adapter below (tir-s1) and its own schema bootstrap
// (migrateTeamSchema) and lookup helper (resolveRoleForTenant) are now the
// only role-resolution mechanism in this module.
//
// tir-s7 (fix-forward): resolveRoleForTenant above shipped in tir-s1 (PR #463)
// with a real bug — it queries team_memberships filtered by tenant_id ONLY
// (LIMIT 1), so once a tenant has 2+ people with different roles, login
// resolves an arbitrary row's role for whoever logs in, not their own. Adds
// resolveRoleForPerson(pool, identityKey, tenantId), which resolves the
// authenticating identity to a personId first (via tir-s2's
// resolvePersonForIdentity, identity-links.js) and then scopes the
// team_memberships lookup by BOTH person_id AND tenant_id. The
// getRoleForTenant/setGetRoleForTenant adapter pair itself (D37 stub-throw
// contract) is unchanged — only server.js's production wiring is updated to
// call the new, corrected function (see AC5).
const { resolvePersonForIdentity, backfillIdentityIfNeeded } = require('./identity-links');

// ── tir-s1: person/team-scoped adapter (D37) ────────────────────────────────
// tab-s3: the legacy tenant-wide adapter's own fallback delegation that used
// to live here was removed along with that legacy adapter itself -- there is
// no longer a second adapter to fall back to. server.js always wires
// setGetRoleForTenant before listen(), so the throw branch below is dead in
// production and exists purely as a D37-compliant misconfiguration guard.
let _getRoleForTenant = null;

function setGetRoleForTenant(fn) {
  _getRoleForTenant = fn;
}

/**
 * Return the role for a tenant via the person/team-membership lookup path.
 *
 * tir-s9 (fix-forward): accepts an optional second `identityKey` argument and
 * forwards it to the wired implementation. Every pre-tir-s9 call site (and
 * `auth-email.js`'s two call sites, unmodified by this story) calls this with
 * a single argument -- that remains fully supported; the wired implementation
 * (`server.js`) falls back to `tenantId` itself when `identityKey` is
 * omitted, exactly preserving prior behaviour for the solo-tenant and
 * email/password cases where `tenantId` already equals the person's own
 * identity. See decisions.md (2026-07-14) for why this argument was missing
 * in production despite tir-s7 already fixing the underlying query.
 *
 * rtri-s4: accepts an optional 3rd `provider` argument, forwarded to the
 * wired implementation the same way. Omitting it preserves exact prior
 * behaviour for every pre-rtri-s4 caller.
 * @param {string} tenantId
 * @param {string} [identityKey] - the authenticating person's own per-person identity (GitHub login, Google sub, or email) -- distinct from tenantId whenever a tenant is shared by 2+ people (e.g. a TENANT_ORG_ALLOWLIST-matched GitHub org)
 * @param {string} [provider] - 'github', 'google', or 'email' (rtri-s4)
 * @returns {Promise<string>}
 */
async function getRoleForTenant(tenantId, identityKey, provider) {
  if (_getRoleForTenant) {
    return _getRoleForTenant(tenantId, identityKey, provider);
  }
  throw new Error('Adapter not wired: getRoleForTenant. Call setGetRoleForTenant() with a real implementation before use.');
}

var _defaultLogger = { info: function(msg) { console.log(msg); } };

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

  // si-s2: idempotent column additions for per-person locale preference --
  // mirrors product-repo.js's migrateProductRepoColumns() ALTER TABLE ... ADD
  // COLUMN IF NOT EXISTS convention exactly. Never touches the legacy `users`
  // table (Architecture Constraints, story si-s2 -- ADR-026 correction).
  await pool.query('ALTER TABLE people ADD COLUMN IF NOT EXISTS timezone TEXT');
  await pool.query('ALTER TABLE people ADD COLUMN IF NOT EXISTS date_format TEXT');

  log.info('[tir-s1] people/team_memberships schema migrated');
}

/**
 * Resolve the role for a tenant via team_memberships. Falls back to 'user' if
 * no row exists for this tenant (tab-s3: the legacy user_roles fallback and
 * lazy backfill were removed along with the rest of the retired legacy path
 * -- this is now a plain, direct default, matching the pre-existing behaviour
 * for a tenant that was never in either table).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {string} tenantId
 * @returns {Promise<string>}
 */
async function resolveRoleForTenant(pool, tenantId) {
  const membership = await pool.query('SELECT role FROM team_memberships WHERE tenant_id = $1 LIMIT 1', [tenantId]);
  if (membership.rows.length) return membership.rows[0].role;
  return 'user';
}

/**
 * Resolve the role for the authenticating PERSON, not just their tenant
 * (tir-s7 fix-forward for the tir-s1 bug described at the top of this file).
 * Resolves identityKey -> personId via resolvePersonForIdentity
 * (identity-links.js, tir-s2) first, then queries team_memberships filtering
 * by BOTH person_id AND tenant_id — closing the gap where 2+ people sharing a
 * tenant could resolve to an arbitrary row's role instead of their own
 * (AC1/AC2).
 *
 * rtri-s4: accepts an optional 4th `provider` argument. When supplied and a
 * personId resolves (via either path), backfills a person_identities row if
 * none exists yet -- closing the gap where a real, already-existing
 * team_memberships row is invisible to rtri-s1's listTeamMembers because no
 * login path ever wrote person_identities. Omitting `provider` preserves
 * EXACT prior behaviour for every pre-rtri-s4 caller -- no backfill is
 * attempted.
 *
 * Falls through to the pre-tir-s7 resolveRoleForTenant behaviour (tenant-only
 * lookup, legacy user_roles fallback, default 'user') in two cases:
 *  - resolvePersonForIdentity returns null — a completely unknown identity
 *    with no team_memberships/person_identities row anywhere (AC4). This
 *    story does NOT add auto-creation of a person/team_membership row for a
 *    brand-new signup — the existing default-to-'user' behaviour is
 *    preserved exactly as before.
 *  - a personId IS resolved but no team_memberships row matches both filters
 *    (defensive — should not happen in normal operation for a resolved
 *    person, but avoids a hard failure if it ever does).
 *
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {string} identityKey - the identity string used to resolve personId (GitHub login, Google sub, or email — whatever the login flow already computes as tenantId today)
 * @param {string} tenantId - the tenant to scope the team_memberships lookup to
 * @param {string} [provider] - 'github', 'google', or 'email' (rtri-s4) — when supplied, triggers the person_identities backfill if needed
 * @returns {Promise<string>}
 */
async function resolveRoleForPerson(pool, identityKey, tenantId, provider) {
  const personId = await resolvePersonForIdentity(pool, identityKey);
  if (personId == null) {
    // AC4: unknown identity — no auto-creation, fall through unchanged.
    return resolveRoleForTenant(pool, tenantId);
  }

  if (provider) {
    // rtri-s4: backfill is idempotent and safe to call on every login.
    await backfillIdentityIfNeeded(pool, identityKey, personId, provider);
  }

  const membership = await pool.query(
    'SELECT role FROM team_memberships WHERE person_id = $1 AND tenant_id = $2 LIMIT 1',
    [personId, tenantId]
  );
  if (membership.rows.length) return membership.rows[0].role;

  // Defensive fallback: personId resolved but no row matches both filters —
  // defer to the same legacy-table + default-'user' semantics as
  // resolveRoleForTenant rather than throwing.
  return resolveRoleForTenant(pool, tenantId);
}

module.exports = {
  getRoleForTenant,
  setGetRoleForTenant,
  migrateTeamSchema,
  resolveRoleForTenant,
  resolveRoleForPerson
};
