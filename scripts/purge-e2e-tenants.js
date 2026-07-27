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

/**
 * Race a promise against a hard deadline. First real regression this script
 * hit in CI (2026-07-26, PR #622): pg's Pool has no default connection
 * timeout, so a bad/unreachable DATABASE_URL hangs the connection attempt
 * forever rather than failing fast -- the actual E2E tests had already
 * passed, but this cleanup step hung until the JOB's own external timeout
 * (15 minutes) killed the whole run, making a passing test run look failed.
 * connectionTimeoutMillis alone did not fully close this (still observed a
 * full-timeout hang), so this is a second, independent guard at the
 * call-site level -- the cleanup is pure hygiene and must never be able to
 * consume the whole job's timeout budget.
 * @param {Promise} promise
 * @param {number} ms
 * @param {string} label
 */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' timed out after ' + ms + 'ms')), ms))
  ]);
}

if (require.main === module) {
  (async () => {
    // eslint-disable-next-line global-require
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });
    setDbConnection(pool);
    try {
      const summary = await withTimeout(purgeE2eTenants(requireDbConnection()), 60000, 'purgeE2eTenants');
      console.log(`Purged ${summary.tenantCount} e2e-test- tenant(s): ${summary.tenantIds.join(', ') || '(none found)'}`);
      process.exitCode = 0;
    } catch (err) {
      // Never a hard failure here (D37-adjacent, but deliberately inverted):
      // this is pure post-run hygiene, not a correctness gate -- a failure
      // must be visible in the log but must never be able to fail the job
      // that ran the actual tests. See CI wiring's own continue-on-error.
      console.error('purge-e2e-tenants failed (non-blocking):', err.message);
      process.exitCode = 0;
    } finally {
      try { await withTimeout(pool.end(), 5000, 'pool.end'); } catch (_) {}
      process.exit(process.exitCode || 0);
    }
  })();
}

module.exports = { purgeE2eTenants, purgeTenant, findE2eTenantIds, setDbConnection, requireDbConnection, E2E_TENANT_PREFIX };
