'use strict';

// organisations.js -- story-1-organisation-entity
// (artefacts/2026-07-30-agency-client-organisations)
//
// Establishes `organisations` as a first-class entity so later stories in the
// agency-client-organisations epic (relationships, self-service provisioning,
// dual-path auth, conversion) have a real row to attach to, instead of
// tenant_id being a bare string with no backing entity.
//
// ADR-025: this table extends the existing tenant_id string-scoping model --
// org_id becomes the canonical value that tenant_id columns reference going
// forward, not a schema-per-tenant boundary change. For a standalone tenant
// (the only org_type this story ever creates -- 'agency'/'client' assignment
// is Story 3's job), org_id's value is identical to the session's tenantId.
//
// No D37 injectable adapter here (DoR H-ADAPTER: "table lookup uses the
// existing DB pool directly, not a swappable external integration"). Every
// function below takes `pool` as an explicit argument, mirroring
// modules/user-roles.js's migrateTeamSchema/resolveRoleForTenant precedent
// and adapters/journey-store-pg.js's migrateSchema CREATE TABLE IF NOT EXISTS
// convention -- both are the closest existing analogues for this shape.

var _defaultLogger = { info: function(msg) { console.log(msg); } };

/**
 * Startup schema bootstrap (AC1). Idempotent -- safe to call on every server
 * restart, matching this codebase's existing CREATE TABLE IF NOT EXISTS
 * migration convention (see migrateTeamSchema / journey-store-pg.js's
 * migrateSchema).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @returns {Promise<void>}
 */
async function migrateOrganisationsSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS organisations (
      org_id     VARCHAR     PRIMARY KEY,
      name       VARCHAR,
      org_type   VARCHAR     NOT NULL DEFAULT 'standalone',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Resolve (or create, org_type='standalone') the organisations row for a
 * tenant_id (AC3). Used both by the OAuth-callback resolution step and by the
 * backfill step (AC2) -- the exact same idempotent operation either way.
 *
 * Read-first design is deliberate for the NFR-performance requirement: the
 * common case at OAuth callback is a RETURNING user whose org already exists,
 * so that path costs exactly one indexed SELECT. Only a brand-new tenant_id
 * (the rarer path) costs a second query (the INSERT). Calling this twice for
 * the same tenant_id is safe -- the second call always takes the SELECT-hit
 * branch and returns the same row, never creating a duplicate.
 *
 * Audit (NFR): a row is only ever logged as created on the branch that
 * actually performs the INSERT -- never on a read-only resolve of an
 * existing row.
 *
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {string} tenantId - the trusted tenant_id from req.session.tenantId (never a request-supplied value)
 * @param {{info: Function}} [logger] - injectable logger (defaults to console.log)
 * @returns {Promise<{org_id: string, name: string, org_type: string, created_at: string}>}
 */
async function resolveOrganisationForTenant(pool, tenantId, logger) {
  var log = logger || _defaultLogger;

  var existing = await pool.query(
    'SELECT org_id, name, org_type, created_at FROM organisations WHERE org_id = $1',
    [tenantId]
  );
  if (existing.rows.length) return existing.rows[0];

  var inserted = await pool.query(
    'INSERT INTO organisations (org_id, name, org_type) VALUES ($1, $2, $3) ' +
    'ON CONFLICT (org_id) DO NOTHING RETURNING org_id, name, org_type, created_at',
    [tenantId, tenantId, 'standalone']
  );
  if (inserted.rows.length) {
    log.info(JSON.stringify({
      event: 'organisation_created',
      tenant_id: tenantId,
      org_type: 'standalone',
      timestamp: new Date().toISOString()
    }));
    return inserted.rows[0];
  }

  // Lost the insert race to a concurrent caller for the same tenantId -- the
  // row now exists (created by the other caller), re-select it. Still exactly
  // one row ever exists for this tenantId.
  var reread = await pool.query(
    'SELECT org_id, name, org_type, created_at FROM organisations WHERE org_id = $1',
    [tenantId]
  );
  return reread.rows[0];
}

/**
 * One-time backfill (AC2): create a `standalone` organisations row for every
 * pre-existing tenant_id that has no organisations row yet. Purely additive
 * -- never mutates or deletes an existing row (see the DoR contract's
 * assumption that this is safe to run against production data). Idempotent:
 * running twice against the same tenantIds list creates zero additional rows
 * on the second run.
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {string[]} tenantIds - known tenant_id values (e.g. from credits.getValidTenantIds())
 * @param {{info: Function}} [logger] - injectable logger (defaults to console.log)
 * @returns {Promise<number>} count of rows actually created by this run
 */
async function backfillStandaloneOrganisations(pool, tenantIds, logger) {
  var createdCount = 0;
  var ids = tenantIds || [];
  for (var i = 0; i < ids.length; i++) {
    var tenantId = ids[i];
    var existing = await pool.query('SELECT 1 FROM organisations WHERE org_id = $1', [tenantId]);
    if (existing.rows.length) continue;
    await resolveOrganisationForTenant(pool, tenantId, logger);
    createdCount++;
  }
  return createdCount;
}

/**
 * Create a new organisations row with an explicit org_id/org_type
 * (story-3-self-service-provisioning, AC1). Unlike
 * resolveOrganisationForTenant (which always creates org_type='standalone'
 * for an unknown tenantId), this is used when the caller already knows the
 * desired org_type up front -- e.g. the Create-Client flow, which creates a
 * brand-new org_type='client' row rather than resolving an existing
 * tenant's row. Added as an additive export (existing exports/behaviour
 * unchanged) rather than a new ad hoc INSERT scattered in a route file, to
 * keep a single sanctioned write path for the organisations table -- see
 * decisions.md (2026-07-31, story-3) for the touch-point note.
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {string} orgId
 * @param {string} name
 * @param {string} orgType
 * @param {{info: Function}} [logger] - injectable logger (defaults to console.log)
 * @returns {Promise<{org_id: string, name: string, org_type: string, created_at: string}>}
 */
async function createOrganisation(pool, orgId, name, orgType, logger) {
  var log = logger || _defaultLogger;
  var result = await pool.query(
    'INSERT INTO organisations (org_id, name, org_type) VALUES ($1, $2, $3) RETURNING org_id, name, org_type, created_at',
    [orgId, name, orgType]
  );
  var row = result.rows[0];
  log.info(JSON.stringify({
    event: 'organisation_created',
    tenant_id: orgId,
    org_type: orgType,
    timestamp: new Date().toISOString()
  }));
  return row;
}

/**
 * Convert an organisation from org_type='client' to org_type='standalone', IN
 * PLACE on the SAME org_id row -- never a second, brand-new org, never a data
 * migration (story-6-conversion-to-independent, AC1; decisions.md 2026-07-30
 * "conversion is structural only" entry). Single-statement, atomic UPDATE:
 * no read-modify-write race is possible, and no other table is ever touched
 * by this function -- AC3 (existing Agency relationships / shared-access
 * grants remain unaffected) is satisfied by construction, not by convention.
 *
 * Idempotent-safe: the WHERE clause only ever matches a row that is
 * currently org_type='client', so calling this twice (or racing a second
 * caller) can never flip an already-standalone org a second time or produce
 * more than one audit log entry for the same conversion.
 *
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {string} orgId - the organisation's own org_id (never a
 *   request-supplied value distinct from the authenticated session's own tenant)
 * @param {{info: Function}} [logger] - injectable logger (defaults to console.log)
 * @returns {Promise<{org_id: string, name: string, org_type: string, created_at: string}|null>}
 *   the updated row, or null if the org was not currently org_type='client'
 *   (already converted, or does not exist) -- caller decides how to respond.
 */
async function convertOrganisationToStandalone(pool, orgId, logger) {
  var log = logger || _defaultLogger;
  var result = await pool.query(
    "UPDATE organisations SET org_type = 'standalone' WHERE org_id = $1 AND org_type = 'client' " +
    'RETURNING org_id, name, org_type, created_at',
    [orgId]
  );
  var row = result.rows.length ? result.rows[0] : null;
  if (row) {
    log.info(JSON.stringify({
      event: 'organisation_converted_to_standalone',
      org_id: orgId,
      timestamp: new Date().toISOString()
    }));
  }
  return row;
}

module.exports = {
  migrateOrganisationsSchema,
  resolveOrganisationForTenant,
  backfillStandaloneOrganisations,
  createOrganisation,
  convertOrganisationToStandalone
};
