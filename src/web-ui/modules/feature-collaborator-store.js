'use strict';

// feature-collaborator-store.js — ep1-s3: feature_collaborators schema
// bootstrap + data access. Deliberately does NOT modify pod-store.js or
// issue pod_members WRITE queries (DoR exclusion) -- reads pod_members with
// its own narrow, read-only SELECT, mirroring pod-assignment-store.js's own
// established convention (ep1-s1/ep1-s2).
//
// "featureId" here is journeyId -- this codebase's real data model has no
// separate "features" table; a "feature" (per this story's own ACs) IS a
// journey. See decisions.md (2026-09-17) for the full architecture
// correction this module is built against.
const crypto = require('crypto');

async function migrateFeatureCollaboratorsSchema(pool, logger) {
  const log = logger || { info: function(msg) { console.log(msg); } };

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feature_collaborators (
      collaborator_id UUID        PRIMARY KEY,
      feature_id      VARCHAR     NOT NULL,
      user_id         VARCHAR     NOT NULL,
      role_id         VARCHAR     NOT NULL,
      joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      pod_id          UUID,
      is_approver     BOOLEAN     NOT NULL DEFAULT false,
      UNIQUE(feature_id, user_id)
    )
  `);

  log.info('[ep1-s3] feature_collaborators schema migrated');
}

/**
 * Pre-populate feature_collaborators with every member of a pod. Caller
 * (routes/products.js) is responsible for deciding WHEN to call this
 * (only when a product default pod was found) -- this function assumes
 * podId is valid and just does the read+write.
 * @returns {Promise<{collaboratorCount: number}>}
 */
async function populateFeatureCollaboratorsFromPod(pool, args) {
  const members = (await pool.query('SELECT user_id, role_id FROM pod_members WHERE pod_id = $1', [args.podId])).rows;
  for (const m of members) {
    const collaboratorId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO feature_collaborators (collaborator_id, feature_id, user_id, role_id, pod_id) VALUES ($1, $2, $3, $4, $5)',
      [collaboratorId, args.featureId, m.user_id, m.role_id, args.podId]
    );
  }
  return { collaboratorCount: members.length };
}

/**
 * Read all collaborators for a feature (journey).
 * @returns {Promise<{collaboratorId: string, userId: string, roleId: string, podId: string}[]>}
 */
async function getFeatureCollaborators(pool, featureId) {
  const rows = (await pool.query('SELECT collaborator_id, user_id, role_id, pod_id FROM feature_collaborators WHERE feature_id = $1', [featureId])).rows;
  return rows.map(r => ({ collaboratorId: r.collaborator_id, userId: r.user_id, roleId: r.role_id, podId: r.pod_id }));
}

module.exports = {
  migrateFeatureCollaboratorsSchema,
  populateFeatureCollaboratorsFromPod,
  getFeatureCollaborators
};
