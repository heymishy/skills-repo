'use strict';

// feature-edits.js — ep2-s4 AC3. Modeled directly on
// modules/artefact-comments.js's own migrateArtefactCommentsSchema +
// createComment shape (idempotent bootstrap, explicit column list,
// RETURNING the inserted row).

var _defaultLogger = { info: function (msg) { console.log(msg); } };

async function migrateFeatureEditsSchema(pool) {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS feature_edits (' +
    'id SERIAL PRIMARY KEY, ' +
    'feature_id VARCHAR NOT NULL, ' +
    'artefact_name VARCHAR NOT NULL, ' +
    'user_id VARCHAR NOT NULL, ' +
    'timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' +
    'operation VARCHAR NOT NULL, ' + // 'save' | 'merge'
    'edit_hash VARCHAR NOT NULL, ' +
    'merged_with TEXT, ' +        // nullable JSON array of user IDs
    'line_attributions TEXT, ' +  // nullable JSON object
    'tenant_id VARCHAR NOT NULL' +
    ')'
  );
}

function _sha256(content) {
  return require('crypto').createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * @param {object} pool
 * @param {{featureId:string, artefactName:string, userId:string, operation:'save'|'merge', content:string, mergedWith?:string[], lineAttributions?:object, tenantId:string}} params
 * @param {{info:Function}} [logger]
 * @returns {Promise<object>} the inserted row
 */
async function recordEdit(pool, params, logger) {
  var log = logger || _defaultLogger;
  var editHash = _sha256(params.content);
  var mergedWithJson = params.mergedWith ? JSON.stringify(params.mergedWith) : null;
  var lineAttributionsJson = params.lineAttributions ? JSON.stringify(params.lineAttributions) : null;

  var result = await pool.query(
    'INSERT INTO feature_edits (feature_id, artefact_name, user_id, operation, edit_hash, merged_with, line_attributions, tenant_id) ' +
    'VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ' +
    'RETURNING id, feature_id, artefact_name, user_id, timestamp, operation, edit_hash, merged_with, line_attributions, tenant_id',
    [params.featureId, params.artefactName, params.userId, params.operation, editHash, mergedWithJson, lineAttributionsJson, params.tenantId]
  );
  var row = result.rows[0];
  log.info(JSON.stringify({
    event: 'feature_edit_recorded',
    feature_id: params.featureId,
    artefact_name: params.artefactName,
    operation: params.operation,
    user_id: params.userId
  }));
  return row;
}

/**
 * @param {object} pool
 * @param {string} featureId
 * @param {string} tenantId
 * @returns {Promise<object[]>}
 */
async function listEditsForFeature(pool, featureId, tenantId) {
  var result = await pool.query(
    'SELECT id, feature_id, artefact_name, user_id, timestamp, operation, edit_hash, merged_with, line_attributions, tenant_id ' +
    'FROM feature_edits WHERE feature_id = $1 AND tenant_id = $2 ORDER BY timestamp ASC',
    [featureId, tenantId]
  );
  return result.rows;
}

module.exports = { migrateFeatureEditsSchema, recordEdit, listEditsForFeature };
