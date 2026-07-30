'use strict';

// agency-client-grants.js -- story-2-relationship-grants-enforcement
// (artefacts/2026-07-30-agency-client-organisations)
//
// Establishes agency_client_relationships (many-to-many between organisations,
// see modules/organisations.js) and shared_access_grants (per-relationship
// scoped read grants), plus the ONE dedicated grant-check adapter function
// this story's own Guardrail requires: "no ad hoc queries scattered across
// route handlers ... the enforcement logic has exactly one place to audit."
//
// ADR-025: this extends the existing requireJourneyAccess/isSameTenant guard
// pattern (middleware/journey-access.js) to a materially new relationship
// shape (many-to-many, per-relationship scoping), not a replacement of it.
// This is the highest-risk story in the epic -- directly analogous in kind
// (though not in cause) to the real cross-tenant access bug fixed in
// bri-s3.4 (see tests/check-bri-s3.4-cross-tenant-isolation.js, re-run
// unmodified by this story's own AC6).
//
// Caching (Architecture Constraint, added 2026-07-31, resolves review
// [1-M1]): NO caching layer anywhere in this module. checkGrantAccess always
// issues a direct, live query -- AC5's "immediate, not after a caching
// delay" revocation requirement is satisfied by construction, not by a
// cache-invalidation mechanism. Do not add a TTL, memoization, or cache
// layer here in a future change without re-verifying AC5.
//
// No D37 injectable adapter here (DoR H-ADAPTER: "the grant-check function is
// an internal adapter over the existing DB pool ... not a swappable external
// integration"). Every function below takes `pool` as an explicit argument,
// mirroring modules/organisations.js's resolveOrganisationForTenant/
// backfillStandaloneOrganisations precedent (the closest existing analogue
// for this shape, and this story's direct upstream dependency).

var _defaultLogger = { info: function(msg) { console.log(msg); } };

/**
 * Startup schema bootstrap. Idempotent -- safe to call on every server
 * restart, matching this codebase's existing CREATE TABLE IF NOT EXISTS
 * migration convention (see modules/organisations.js's
 * migrateOrganisationsSchema).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @returns {Promise<void>}
 */
async function migrateAgencyClientGrantsSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agency_client_relationships (
      relationship_id VARCHAR     PRIMARY KEY,
      agency_org_id   VARCHAR     NOT NULL,
      client_org_id   VARCHAR     NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shared_access_grants (
      grant_id        VARCHAR     PRIMARY KEY,
      relationship_id VARCHAR     NOT NULL,
      resource_type   VARCHAR     NOT NULL,
      resource_id     VARCHAR     NOT NULL,
      granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at      TIMESTAMPTZ
    )
  `);
}

function _genId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

/**
 * Create an Agency<->Client relationship row. Story 3 (self-service
 * provisioning) is what actually wires an Agency admin's real UI flow to
 * this -- this story provides the data-model function only.
 * @param {object} pool
 * @param {string} agencyOrgId
 * @param {string} clientOrgId
 * @param {{info: Function}} [logger]
 * @returns {Promise<{relationship_id:string, agency_org_id:string, client_org_id:string, created_at:string}>}
 */
async function createRelationship(pool, agencyOrgId, clientOrgId, logger) {
  var log = logger || _defaultLogger;
  var relationshipId = _genId('rel');
  var result = await pool.query(
    'INSERT INTO agency_client_relationships (relationship_id, agency_org_id, client_org_id) ' +
    'VALUES ($1, $2, $3) RETURNING relationship_id, agency_org_id, client_org_id, created_at',
    [relationshipId, agencyOrgId, clientOrgId]
  );
  var row = result.rows[0];
  log.info(JSON.stringify({
    event: 'relationship_created',
    relationship_id: row.relationship_id,
    agency_org_id: agencyOrgId,
    client_org_id: clientOrgId,
    timestamp: new Date().toISOString()
  }));
  return row;
}

/**
 * Read a single relationship row by ID. All relationship reads go through
 * this function -- never an ad hoc query in a route handler (story
 * Guardrail).
 * @param {object} pool
 * @param {string} relationshipId
 * @returns {Promise<object|null>}
 */
async function getRelationshipById(pool, relationshipId) {
  var result = await pool.query(
    'SELECT relationship_id, agency_org_id, client_org_id, created_at ' +
    'FROM agency_client_relationships WHERE relationship_id = $1',
    [relationshipId]
  );
  return result.rows.length ? result.rows[0] : null;
}

/**
 * AC1: create a grant scoped to a SPECIFIC relationship_id -- never a bare
 * client_org_id-only scoping. This is what makes AC2's per-relationship
 * isolation possible: a grant only ever exists attached to one relationship
 * row, so checkGrantAccess below can never "leak" across relationships.
 * @param {object} pool
 * @param {string} relationshipId
 * @param {string} resourceType - e.g. 'product'
 * @param {string} resourceId
 * @param {{info: Function}} [logger]
 * @returns {Promise<object>}
 */
async function createGrant(pool, relationshipId, resourceType, resourceId, logger) {
  var log = logger || _defaultLogger;
  var grantId = _genId('grant');
  var result = await pool.query(
    'INSERT INTO shared_access_grants (grant_id, relationship_id, resource_type, resource_id) ' +
    'VALUES ($1, $2, $3, $4) RETURNING grant_id, relationship_id, resource_type, resource_id, granted_at, revoked_at',
    [grantId, relationshipId, resourceType, resourceId]
  );
  var row = result.rows[0];
  log.info(JSON.stringify({
    event: 'grant_created',
    relationship_id: relationshipId,
    resource_type: resourceType,
    resource_id: resourceId,
    timestamp: new Date().toISOString()
  }));
  return row;
}

/**
 * THE dedicated grant-check adapter (story's own Guardrail: "no direct DB
 * access from the UI layer for access checks -- all grant/relationship
 * reads go through a dedicated adapter function"). Every new read path
 * touching a Client-org user's view of shared data MUST call this function
 * -- never an inline query.
 *
 * AC2 (core security property): scoped strictly per-relationship. A grant
 * is only ever reachable via the ONE relationship it was created against --
 * this query can never return a grant belonging to a different Agency's
 * relationship with the same Client org, because the JOIN only matches rows
 * where agency_client_relationships.client_org_id = clientOrgId AND the
 * grant's own relationship_id is that exact relationship row.
 *
 * AC5: revoked_at IS NULL is evaluated live on every single call -- no
 * caching layer exists anywhere in this path (2026-07-31 Architecture
 * Constraint), so a revocation takes effect on the very next call, by
 * construction.
 *
 * NFR-performance: exactly one query per call (one JOIN, not N).
 *
 * @param {object} pool
 * @param {string} clientOrgId
 * @param {string} resourceType
 * @param {string} resourceId
 * @returns {Promise<object|null>} the active grant row (includes
 *   relationship_id) if access is currently granted, else null.
 */
async function checkGrantAccess(pool, clientOrgId, resourceType, resourceId) {
  var result = await pool.query(
    'SELECT g.grant_id, g.relationship_id, g.resource_type, g.resource_id, g.granted_at, g.revoked_at ' +
    'FROM shared_access_grants g ' +
    'JOIN agency_client_relationships r ON r.relationship_id = g.relationship_id ' +
    'WHERE r.client_org_id = $1 AND g.resource_type = $2 AND g.resource_id = $3 AND g.revoked_at IS NULL',
    [clientOrgId, resourceType, resourceId]
  );
  return result.rows.length ? result.rows[0] : null;
}

/**
 * AC2 (list view): every active grant reachable by this Client org, across
 * ALL of its relationships (however many Agencies it works with) -- never
 * surfacing a grant scoped to a relationship this client_org_id is not the
 * client party of. Same JOIN shape as checkGrantAccess, just without the
 * resource_id filter.
 * @param {object} pool
 * @param {string} clientOrgId
 * @param {string} resourceType
 * @returns {Promise<Array<object>>}
 */
async function listGrantedResourcesForClient(pool, clientOrgId, resourceType) {
  var result = await pool.query(
    'SELECT g.grant_id, g.relationship_id, g.resource_type, g.resource_id, g.granted_at ' +
    'FROM shared_access_grants g ' +
    'JOIN agency_client_relationships r ON r.relationship_id = g.relationship_id ' +
    'WHERE r.client_org_id = $1 AND g.resource_type = $2 AND g.revoked_at IS NULL',
    [clientOrgId, resourceType]
  );
  return result.rows;
}

/**
 * AC5: revoke a grant -- sets revoked_at. Because checkGrantAccess always
 * queries live (no cache), the very next checkGrantAccess call for this
 * grant sees the revocation immediately.
 * @param {object} pool
 * @param {string} grantId
 * @param {{info: Function}} [logger]
 * @returns {Promise<object|null>} the revoked row, or null if not found /
 *   already revoked.
 */
async function revokeGrant(pool, grantId, logger) {
  var log = logger || _defaultLogger;
  var result = await pool.query(
    'UPDATE shared_access_grants SET revoked_at = NOW() ' +
    'WHERE grant_id = $1 AND revoked_at IS NULL ' +
    'RETURNING grant_id, relationship_id, resource_type, resource_id, granted_at, revoked_at',
    [grantId]
  );
  var row = result.rows.length ? result.rows[0] : null;
  if (row) {
    log.info(JSON.stringify({
      event: 'grant_revoked',
      relationship_id: row.relationship_id,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      timestamp: new Date().toISOString()
    }));
  }
  return row;
}

/**
 * Audit (NFR): every denied access attempt (AC4 path -- checkGrantAccess
 * returned null) is logged with relationship_id, org_id, resource_id, and
 * timestamp -- "the audit trail the next bri-s3.x-style investigation would
 * need if a leak were ever suspected." relationship_id is null here by
 * definition: a denial means no relationship+grant pair resolved this
 * resource for this org, so there is no specific relationship_id to name.
 * @param {{info: Function}} logger
 * @param {string} orgId
 * @param {string} resourceType
 * @param {string} resourceId
 */
function logDeniedAccess(logger, orgId, resourceType, resourceId) {
  var log = logger || _defaultLogger;
  log.info(JSON.stringify({
    event: 'grant_access_denied',
    relationship_id: null,
    org_id: orgId,
    resource_type: resourceType,
    resource_id: resourceId,
    timestamp: new Date().toISOString()
  }));
}

module.exports = {
  migrateAgencyClientGrantsSchema,
  createRelationship,
  getRelationshipById,
  createGrant,
  checkGrantAccess,
  listGrantedResourcesForClient,
  revokeGrant,
  logDeniedAccess
};
