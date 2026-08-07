'use strict';

// src/web-ui/modules/platform-self-registration.js -- pr-s1
//
// Idempotently registers skills-framework itself as a product row in the
// existing `products` table, so the product-rollup mechanism (pr-s2 onward)
// has a consistent single code path for both this platform's own repo and
// any tenant's connected repo. Mirrors product-repo.js's idempotent-check
// convention (check-before-insert, not INSERT ... ON CONFLICT, to stay
// portable across the mock pool used in tests and real Postgres).
//
// Skips gracefully (returns null, writes nothing) if required config
// (tenantId, repoOwner, repoName) is not fully provided -- this is an
// optional dogfooding seed, not a hard requirement for the server to start.

/**
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {{tenantId: string, repoOwner: string, repoName: string, name: string}} opts
 * @returns {Promise<string|null>} the existing or newly-created product_id, or null if skipped
 */
async function registerSelfAsProduct(pool, opts) {
  var tenantId = opts && opts.tenantId;
  var repoOwner = opts && opts.repoOwner;
  var repoName = opts && opts.repoName;
  var name = (opts && opts.name) || 'skills-framework';

  if (!tenantId || !repoOwner || !repoName) {
    return null;
  }

  var existing = await pool.query(
    'SELECT product_id FROM products WHERE tenant_id = $1 AND repo_owner = $2 AND repo_name = $3',
    [tenantId, repoOwner, repoName]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0].product_id;
  }

  var inserted = await pool.query(
    `INSERT INTO products (tenant_id, name, description, repo_provider, repo_owner, repo_name, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING product_id`,
    [tenantId, name, 'This platform\'s own dogfooded product row.', 'github', repoOwner, repoName, 'system']
  );
  return inserted.rows[0].product_id;
}

module.exports = { registerSelfAsProduct };
