'use strict';

// agency-client-comments.js -- story-5-client-agency-comments
// (artefacts/2026-07-30-agency-client-organisations)
//
// Append-only comment thread on a shared product/feature. Comments are
// scoped by (resource_type, resource_id) exactly like Story 2's
// shared_access_grants -- visibility/submission enforcement itself lives in
// routes/products.js, which calls THIS module's read/write functions plus
// Story 2's own dedicated checkGrantAccess adapter directly (never a
// duplicate access-control path -- NFR-security,
// commentEndpointsGoThroughSameGrantCheckGuardAsStory2).
//
// ADR-026 (reuse before introducing new entities): confirmed at /definition
// -- no existing commenting/annotation mechanism exists anywhere else in
// this codebase for products/features. This IS a genuinely new table.
//
// Data Model (matches the story's own Mermaid ERD exactly -- see
// artefacts/2026-07-30-agency-client-organisations/stories/
// story-5-client-agency-comments.md "## Data Model"): comment_id PK,
// resource_type, resource_id, org_id FK, user_id FK, body, created_at. No
// org_type column on this table by design -- "which org types exist in a
// thread" is answered by joining to organisations.org_type (see
// getThreadOrgTypes below), never by denormalizing org_type onto each row.
//
// No D37 injectable adapter here (mirrors modules/agency-client-grants.js's
// own H-ADAPTER precedent -- an internal adapter over the existing DB pool,
// not a swappable external integration). Every function below takes `pool`
// as an explicit argument.

var _defaultLogger = { info: function(msg) { console.log(msg); } };

/**
 * Startup schema bootstrap. Idempotent -- safe to call on every server
 * restart, matching this codebase's existing CREATE TABLE IF NOT EXISTS
 * migration convention (see modules/agency-client-grants.js's
 * migrateAgencyClientGrantsSchema).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @returns {Promise<void>}
 */
async function migrateCommentsSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      comment_id    VARCHAR     PRIMARY KEY,
      resource_type VARCHAR     NOT NULL,
      resource_id   VARCHAR     NOT NULL,
      org_id        VARCHAR     NOT NULL,
      user_id       VARCHAR     NOT NULL,
      body          TEXT        NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function _genId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

/**
 * Append a comment (AC1, AC3). Comments are append-only in this MVP -- no
 * update/delete function exists in this module at all, by design (Out of
 * Scope).
 *
 * Audit (NFR): every comment creation is logged with author org_id,
 * user_id, resource reference, and timestamp.
 *
 * @param {object} pool
 * @param {string} resourceType - e.g. 'product'
 * @param {string} resourceId
 * @param {string} orgId - the author's org_id (Client-org or Agency-org)
 * @param {string} userId - the author's user_id (session login)
 * @param {string} body - comment text
 * @param {{info: Function}} [logger]
 * @returns {Promise<{comment_id:string, resource_type:string, resource_id:string, org_id:string, user_id:string, body:string, created_at:string}>}
 */
async function createComment(pool, resourceType, resourceId, orgId, userId, body, logger) {
  var log = logger || _defaultLogger;
  var commentId = _genId('comment');
  var result = await pool.query(
    'INSERT INTO comments (comment_id, resource_type, resource_id, org_id, user_id, body) ' +
    'VALUES ($1, $2, $3, $4, $5, $6) ' +
    'RETURNING comment_id, resource_type, resource_id, org_id, user_id, body, created_at',
    [commentId, resourceType, resourceId, orgId, userId, body]
  );
  var row = result.rows[0];
  log.info(JSON.stringify({
    event: 'comment_created',
    org_id: orgId,
    user_id: userId,
    resource_type: resourceType,
    resource_id: resourceId,
    timestamp: new Date().toISOString()
  }));
  return row;
}

/**
 * List every comment on a resource, oldest first (AC1, AC3). Performance
 * NFR: this is the ONE batched query per resource view -- callers must never
 * loop and call this (or an equivalent) once per comment; mirrors
 * routes/products.js's _getArtefactCountsBulk batched-read precedent (one
 * query for however many rows exist, not N).
 * @param {object} pool
 * @param {string} resourceType
 * @param {string} resourceId
 * @returns {Promise<Array<object>>}
 */
async function listCommentsForResource(pool, resourceType, resourceId) {
  var result = await pool.query(
    'SELECT comment_id, resource_type, resource_id, org_id, user_id, body, created_at ' +
    'FROM comments WHERE resource_type = $1 AND resource_id = $2 ORDER BY created_at ASC',
    [resourceType, resourceId]
  );
  return result.rows;
}

/**
 * AC4: which org_type(s) (per organisations.org_type -- 'agency', 'client',
 * or 'standalone') have posted at least one comment on this thread, as of
 * right now. This is what makes thread_has_both_org_types a real,
 * testable computation rather than a hardcoded flag -- callers compute this
 * AFTER the triggering comment has been inserted, so the just-created
 * comment's own org_type is already included in the result.
 * @param {object} pool
 * @param {string} resourceType
 * @param {string} resourceId
 * @returns {Promise<Array<string>>} distinct org_type values present in the thread
 */
async function getThreadOrgTypes(pool, resourceType, resourceId) {
  var result = await pool.query(
    'SELECT DISTINCT o.org_type ' +
    'FROM comments c JOIN organisations o ON o.org_id = c.org_id ' +
    'WHERE c.resource_type = $1 AND c.resource_id = $2',
    [resourceType, resourceId]
  );
  return result.rows.map(function(r) { return r.org_type; });
}

/**
 * AC4: the concrete, testable predicate behind thread_has_both_org_types --
 * true only once the thread's org_type set contains BOTH 'agency' and
 * 'client' (never hardcoded true; false for a thread that only ever has one
 * side's comments).
 * @param {string[]} orgTypes
 * @returns {boolean}
 */
function threadHasBothOrgTypes(orgTypes) {
  var types = orgTypes || [];
  return types.indexOf('agency') !== -1 && types.indexOf('client') !== -1;
}

/**
 * AC4 (benefit-metric data condition): the measurement function
 * benefit-metric.md's Metric 2 ("Ongoing client-agency artefact
 * collaboration") references -- count of distinct (resource_type,
 * resource_id) threads that have at least one Agency-org comment AND at
 * least one Client-org comment.
 * @param {object} pool
 * @returns {Promise<number>} count of qualifying threads
 */
async function countQualifyingThreads(pool) {
  var result = await pool.query(
    'SELECT c.resource_type, c.resource_id ' +
    'FROM comments c JOIN organisations o ON o.org_id = c.org_id ' +
    'GROUP BY c.resource_type, c.resource_id ' +
    'HAVING COUNT(DISTINCT CASE WHEN o.org_type = \'agency\' THEN 1 END) > 0 ' +
    'AND COUNT(DISTINCT CASE WHEN o.org_type = \'client\' THEN 1 END) > 0',
    []
  );
  return result.rows.length;
}

module.exports = {
  migrateCommentsSchema,
  createComment,
  listCommentsForResource,
  getThreadOrgTypes,
  threadHasBothOrgTypes,
  countQualifyingThreads
};
