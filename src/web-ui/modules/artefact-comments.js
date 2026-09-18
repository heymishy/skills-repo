'use strict';

// artefact-comments.js -- dsa-s1
//
// Generic, append-only comment thread on an artefact page. Deliberately NOT
// scoped by org_id/org_type (unlike modules/agency-client-comments.js, which
// this module is modeled on structurally but not reused directly -- see
// decisions.md, 2026-09-18, "the real artefact viewer has no Sign-off/
// Comments UI" entry, for the full reasoning: agency-client-comments.js
// requires a real clientOrgId/agencyOrgId tied to an organisations row with
// org_type 'agency'|'client', which this product's general users don't have).
//
// Data Model: comment_id PK, resource_type, resource_id, user_id, body,
// created_at. No org_id column by design -- every signed-in user viewing
// this artefact can read and post, no client/agency distinction applies.

var _defaultLogger = { info: function (msg) { console.log(msg); } };

/**
 * Startup schema bootstrap. Idempotent -- safe to call on every server
 * restart, matching this codebase's existing CREATE TABLE IF NOT EXISTS
 * migration convention (see modules/agency-client-comments.js's own
 * migrateCommentsSchema).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @returns {Promise<void>}
 */
async function migrateArtefactCommentsSchema(pool) {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS artefact_comments (' +
    'comment_id VARCHAR PRIMARY KEY, ' +
    'resource_type VARCHAR NOT NULL, ' +
    'resource_id VARCHAR NOT NULL, ' +
    'user_id VARCHAR NOT NULL, ' +
    'body TEXT NOT NULL, ' +
    'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' +
    ')'
  );
}

function _genId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

/**
 * Append a comment (AC8). Comments are append-only -- no update/delete
 * function exists in this module at all, by design (Out of Scope).
 * Audit (NFR): every comment creation is logged with author, resource
 * reference, and timestamp.
 * @param {object} pool
 * @param {string} resourceType - e.g. 'artefact'
 * @param {string} resourceId - e.g. '<featureSlug>/<artefactType>'
 * @param {string} userId - the author's user_id (session login)
 * @param {string} body - comment text
 * @param {{info: Function}} [logger]
 * @returns {Promise<{comment_id:string, resource_type:string, resource_id:string, user_id:string, body:string, created_at:string}>}
 */
async function createComment(pool, resourceType, resourceId, userId, body, logger) {
  var log = logger || _defaultLogger;
  var commentId = _genId('artefact-comment');
  var result = await pool.query(
    'INSERT INTO artefact_comments (comment_id, resource_type, resource_id, user_id, body) ' +
    'VALUES ($1, $2, $3, $4, $5) ' +
    'RETURNING comment_id, resource_type, resource_id, user_id, body, created_at',
    [commentId, resourceType, resourceId, userId, body]
  );
  var row = result.rows[0];
  log.info(JSON.stringify({
    event: 'artefact_comment_created',
    user_id: userId,
    resource_type: resourceType,
    resource_id: resourceId,
    timestamp: new Date().toISOString()
  }));
  return row;
}

/**
 * List every comment on a resource, oldest first (AC7). Performance NFR:
 * this is the ONE batched query per resource view -- callers must never
 * loop and call this once per comment.
 * @param {object} pool
 * @param {string} resourceType
 * @param {string} resourceId
 * @returns {Promise<Array<object>>}
 */
async function listCommentsForResource(pool, resourceType, resourceId) {
  var result = await pool.query(
    'SELECT comment_id, resource_type, resource_id, user_id, body, created_at ' +
    'FROM artefact_comments WHERE resource_type = $1 AND resource_id = $2 ORDER BY created_at ASC',
    [resourceType, resourceId]
  );
  return result.rows;
}

module.exports = {
  migrateArtefactCommentsSchema,
  createComment,
  listCommentsForResource
};
