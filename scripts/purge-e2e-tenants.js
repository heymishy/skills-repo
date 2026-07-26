'use strict';

/**
 * alrf-s11 -- purge every tenant created by an E2E test run.
 *
 * Both of this repo's E2E-tenant-creation mechanisms tag their synthetic
 * identities with an unambiguous, unique `e2e-test-` prefix:
 *   - tests/e2e/fixtures/staging-auth.js's uniqueEmail(): 'e2e-test-' + tag + ... + '@example.test'
 *   - routes/auth-stub.js's GitHub OAuth stub: 'e2e-test-gh-' + Date.now() + ...
 * Both become the session's tenantId (tenantId === email for email/password
 * logins; tenantId === login for the OAuth stub) -- so every real E2E test
 * tenant's tenant_id starts with 'e2e-test-'. Nothing else in this codebase
 * uses that prefix (seed-staging.js's own synthetic demo tenants are named
 * 'tenant-demo-N', not 'e2e-test-*'), so the match below cannot collide with
 * real or seeded data.
 *
 * Deliberately does NOT touch people/person_identities -- those tables are
 * intentionally cross-tenant identity records (a person can belong to
 * multiple tenants); the tenant-scoped join table (team_memberships) is
 * cleaned up, but the underlying person/identity rows are left alone rather
 * than risk deleting an identity shared with a non-test tenant.
 *
 * D37: the DB connection is an injectable adapter, matching
 * scripts/seed-staging.js's exact convention -- default stub throws, real
 * Postgres wiring lives in the CLI entrypoint below.
 */

let _dbConnection = null;

function setDbConnection(adapter) {
  _dbConnection = adapter;
}

function requireDbConnection() {
  if (!_dbConnection) {
    throw new Error('Adapter not wired: dbConnection. Call setDbConnection() with a real implementation before use.');
  }
  return _dbConnection;
}

const E2E_TENANT_PREFIX = 'e2e-test-';

/**
 * Find every distinct tenant_id (or email, for email/password identities
 * where tenantId === email) tagged with the e2e-test- prefix, across every
 * table that can independently introduce a new tenant identity.
 * @param {object} db
 * @returns {Promise<string[]>}
 */
async function findE2eTenantIds(db) {
  const found = new Set();
  const queries = [
    "SELECT DISTINCT tenant_id AS id FROM credits WHERE tenant_id LIKE 'e2e-test-%'",
    "SELECT DISTINCT tenant_id AS id FROM journeys WHERE tenant_id LIKE 'e2e-test-%'",
    "SELECT DISTINCT tenant_id AS id FROM team_memberships WHERE tenant_id LIKE 'e2e-test-%'",
    "SELECT DISTINCT email AS id FROM users WHERE email LIKE 'e2e-test-%'"
  ];
  for (const sql of queries) {
    let result;
    try { result = await db.query(sql); } catch (_) { continue; } // table may not exist in every environment
    (result.rows || []).forEach((row) => { if (row.id) found.add(row.id); });
  }
  return [...found];
}

/**
 * Hard-delete every wuce-side row for one tenant. Explicit per-table
 * deletes, not cascade-reliance-alone, matching this codebase's established
 * convention (routes/products.js's handleDeleteProduct). products' own
 * ON DELETE CASCADE already cleans up standards/standard_product_optouts/
 * product_rollups/product_modules/feature_module_assignments -- only the
 * products row itself needs an explicit delete.
 * @param {object} db
 * @param {string} tenantId
 * @returns {Promise<void>}
 */
async function purgeTenant(db, tenantId) {
  // journeys' artefacts must go first -- artefacts.journey_id is a plain FK
  // with no ON DELETE clause (default RESTRICT).
  await db.query(
    'DELETE FROM artefacts WHERE journey_id IN (SELECT journey_id FROM journeys WHERE tenant_id = $1)',
    [tenantId]
  ).catch(() => {});
  await db.query('DELETE FROM journeys WHERE tenant_id = $1', [tenantId]).catch(() => {});
  await db.query('DELETE FROM products WHERE tenant_id = $1', [tenantId]).catch(() => {}); // cascades
  await db.query('DELETE FROM credits WHERE tenant_id = $1', [tenantId]).catch(() => {});
  await db.query('DELETE FROM credit_audit_log WHERE tenant_id = $1', [tenantId]).catch(() => {});
  await db.query('DELETE FROM tenant_plan WHERE tenant_id = $1', [tenantId]).catch(() => {});
  await db.query('DELETE FROM user_roles WHERE tenant_id = $1', [tenantId]).catch(() => {});
  await db.query('DELETE FROM team_memberships WHERE tenant_id = $1', [tenantId]).catch(() => {});
  await db.query(
    'DELETE FROM impersonation_audit_log WHERE admin_tenant_id = $1 OR target_tenant_id = $1',
    [tenantId]
  ).catch(() => {});
  await db.query('DELETE FROM github_first_login WHERE github_user_id = $1', [tenantId]).catch(() => {});
  await db.query('DELETE FROM users WHERE email = $1', [tenantId]).catch(() => {});
}

/**
 * Find and purge every e2e-test- tagged tenant. Safe to run repeatedly
 * (idempotent -- a tenant already gone is simply not found again).
 * @param {object} db
 * @returns {Promise<{tenantCount: number, tenantIds: string[]}>}
 */
async function purgeE2eTenants(db) {
  const tenantIds = await findE2eTenantIds(db);
  for (const tenantId of tenantIds) {
    await purgeTenant(db, tenantId);
  }
  return { tenantCount: tenantIds.length, tenantIds };
}

if (require.main === module) {
  (async () => {
    try {
      // eslint-disable-next-line global-require
      const { Pool } = require('pg');
      setDbConnection(new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }));
      const summary = await purgeE2eTenants(requireDbConnection());
      console.log(`Purged ${summary.tenantCount} e2e-test- tenant(s): ${summary.tenantIds.join(', ') || '(none found)'}`);
      process.exit(0);
    } catch (err) {
      console.error('purge-e2e-tenants failed:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = { purgeE2eTenants, purgeTenant, findE2eTenantIds, setDbConnection, requireDbConnection, E2E_TENANT_PREFIX };
