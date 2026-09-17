'use strict';

// pod-assignment-store.js — ep1-s2: pod_assignments schema bootstrap + data
// access. Deliberately does NOT modify pod-store.js or issue pod_members
// write queries (DoR exclusion) -- reads pods/pod_members with its own
// narrow, read-only SELECTs. Mirrors pod-store.js's migrate*Schema()
// CREATE TABLE IF NOT EXISTS convention exactly.
//
// This story's own AC2 (a new feature auto-inherits the product default) is
// NOT implemented here -- getProductDefaultPod()'s return shape is the
// handoff contract ep1-s3's feature-creation code will consume. See
// decisions.md (2026-09-16) for the full scope-boundary writeup.
const crypto = require('crypto');

/**
 * Startup schema bootstrap for pod_assignments.
 * feature_id is NULL for a product-level default (this story's only case);
 * a real per-feature assignment (explicit-feature / multi-feature-set) is
 * out of scope here -- the column exists now so ep1-s3/Epic 2 don't need a
 * later migration to add it.
 */
async function migratePodAssignmentsSchema(pool, logger) {
  const log = logger || { info: function(msg) { console.log(msg); } };

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pod_assignments (
      assignment_id    UUID        PRIMARY KEY,
      tenant_id        VARCHAR     NOT NULL,
      pod_id           UUID        NOT NULL REFERENCES pods(pod_id),
      product_id       VARCHAR     NOT NULL,
      feature_id       VARCHAR,
      assignment_type  VARCHAR     NOT NULL,
      assigned_by      VARCHAR,
      assigned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Partial unique index: only one product-level default (feature_id IS
  // NULL) per (tenant_id, product_id). A future per-feature assignment
  // (feature_id NOT NULL) is NOT constrained by this index -- Epic 2/4 scope.
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS pod_assignments_product_default_uq
      ON pod_assignments (tenant_id, product_id)
      WHERE feature_id IS NULL
  `);

  log.info('[ep1-s2] pod_assignments schema migrated');
}

/**
 * Set (or replace) a product's default pod. Validates the pod belongs to
 * this tenant BEFORE writing -- caller (routes/products.js) is responsible
 * for validating the product itself belongs to this tenant.
 * @returns {Promise<{assignmentId: string, podName: string, memberCount: number}>}
 * @throws {Error} with .code = 'POD_NOT_FOUND' if podId doesn't belong to this tenant
 */
async function setProductDefaultPod(pool, args) {
  const podRow = (await pool.query('SELECT pod_id, tenant_id, name FROM pods WHERE pod_id = $1 AND tenant_id = $2', [args.podId, args.tenantId])).rows[0];
  if (!podRow) {
    const err = new Error("No pod found with that id for this tenant");
    err.code = 'POD_NOT_FOUND';
    throw err;
  }

  const memberCountRow = (await pool.query('SELECT COUNT(*) AS count FROM pod_members WHERE pod_id = $1', [args.podId])).rows[0];
  const memberCount = parseInt(memberCountRow.count, 10);

  const assignmentId = crypto.randomUUID();
  await pool.query(
    'INSERT INTO pod_assignments (assignment_id, tenant_id, pod_id, product_id, assignment_type, assigned_by) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (tenant_id, product_id) WHERE feature_id IS NULL DO UPDATE SET pod_id = EXCLUDED.pod_id, assignment_type = EXCLUDED.assignment_type, assigned_by = EXCLUDED.assigned_by, assigned_at = NOW()',
    [assignmentId, args.tenantId, args.podId, args.productId, 'inherit-to-all-features', args.assignedBy]
  );

  return { assignmentId, podName: podRow.name, memberCount };
}

/**
 * Read a product's current default pod (feature_id IS NULL row), if any.
 * Return shape is the AC2 handoff contract ep1-s3's feature-creation code
 * will consume: { podId, podName, memberCount }.
 * @returns {Promise<{podId: string, podName: string, memberCount: number}|null>}
 */
async function getProductDefaultPod(pool, tenantId, productId) {
  const row = (await pool.query(
    'SELECT pa.pod_id, p.name FROM pod_assignments pa JOIN pods p ON p.pod_id = pa.pod_id WHERE pa.tenant_id = $1 AND pa.product_id = $2 AND pa.feature_id IS NULL',
    [tenantId, productId]
  )).rows[0];
  if (!row) return null;

  const memberCountRow = (await pool.query('SELECT COUNT(*) AS count FROM pod_members WHERE pod_id = $1', [row.pod_id])).rows[0];
  return { podId: row.pod_id, podName: row.name, memberCount: parseInt(memberCountRow.count, 10) };
}

/**
 * ep1-s3: record that a specific FEATURE (journey) inherited a pod from its
 * product's default. Unlike setProductDefaultPod (feature_id IS NULL, one
 * row per product), this always INSERTs a new row (feature_id IS NOT NULL,
 * one row per feature) -- no upsert/conflict handling needed, since a given
 * featureId can only be created once.
 * @returns {Promise<{assignmentId: string}>}
 */
async function setFeatureDefaultPod(pool, args) {
  const assignmentId = crypto.randomUUID();
  await pool.query(
    'INSERT INTO pod_assignments (assignment_id, tenant_id, pod_id, product_id, feature_id, assignment_type, assigned_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [assignmentId, args.tenantId, args.podId, args.productId, args.featureId, 'feature-inherits-product-default', args.assignedBy]
  );
  return { assignmentId };
}

module.exports = {
  migratePodAssignmentsSchema,
  setProductDefaultPod,
  getProductDefaultPod,
  setFeatureDefaultPod
};
