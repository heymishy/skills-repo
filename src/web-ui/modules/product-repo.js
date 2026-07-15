'use strict';

// src/web-ui/modules/product-repo.js — prc-s1.1
//
// Idempotent schema migration adding repo association columns to the
// existing `products` table. Mirrors the existing ALTER TABLE ... ADD
// COLUMN IF NOT EXISTS convention already used for products'
// mission/roadmap/tech_stack/constraints/architecture_guardrails columns
// (server.js, psh-s3) and for user-roles.js's migrateTeamSchema. ADR-025:
// tenant scoping stays at the application layer -- this adds columns to the
// existing products table, not a new per-tenant schema.
//
// Out of scope (this story): populating these columns (prc-s1.2), any UI
// (prc-s1.2 / Epic 4).

/**
 * Idempotently adds repo_provider, repo_owner, repo_name (all nullable) to
 * the products table. Safe to call on every server startup -- ADD COLUMN IF
 * NOT EXISTS is a no-op on repeated calls against a real Postgres instance.
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {{info: Function}} [logger] - injectable logger (defaults to console.log)
 */
async function migrateProductRepoColumns(pool, logger) {
  var log = logger || { info: console.log };

  await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS repo_provider VARCHAR');
  await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS repo_owner VARCHAR');
  await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS repo_name VARCHAR');

  log.info('[prc-s1.1] products repo columns ready (repo_provider, repo_owner, repo_name)');
}

module.exports = {
  migrateProductRepoColumns
};
