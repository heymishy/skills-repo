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
 * pebd-s1: hard-delete every wuce-side row for a WHOLE BATCH of tenants in
 * one query per table (11 total), instead of purgeTenant's own 11-query-
 * PER-TENANT approach. Uses Postgres's `= ANY($1::text[])` array-parameter
 * syntax -- functionally equivalent to a large `IN (...)` list, but takes
 * the whole tenantIds array as a single bound parameter rather than
 * requiring one placeholder per value. Same table order, same explicit-
 * per-table-deletes convention as purgeTenant -- this is the batched
 * sibling of that function, not a replacement for it (purgeTenant itself
 * stays untouched, still used directly by existing tests/callers).
 * @param {object} db
 * @param {string[]} tenantIds
 * @returns {Promise<void>}
 */
async function purgeTenantsBatch(db, tenantIds) {
  if (!tenantIds || tenantIds.length === 0) return;
  await db.query(
    'DELETE FROM artefacts WHERE journey_id IN (SELECT journey_id FROM journeys WHERE tenant_id = ANY($1::text[]))',
    [tenantIds]
  ).catch(() => {});
  await db.query('DELETE FROM journeys WHERE tenant_id = ANY($1::text[])', [tenantIds]).catch(() => {});
  await db.query('DELETE FROM products WHERE tenant_id = ANY($1::text[])', [tenantIds]).catch(() => {}); // cascades
  await db.query('DELETE FROM credits WHERE tenant_id = ANY($1::text[])', [tenantIds]).catch(() => {});
  await db.query('DELETE FROM credit_audit_log WHERE tenant_id = ANY($1::text[])', [tenantIds]).catch(() => {});
  await db.query('DELETE FROM tenant_plan WHERE tenant_id = ANY($1::text[])', [tenantIds]).catch(() => {});
  await db.query('DELETE FROM user_roles WHERE tenant_id = ANY($1::text[])', [tenantIds]).catch(() => {});
  await db.query('DELETE FROM team_memberships WHERE tenant_id = ANY($1::text[])', [tenantIds]).catch(() => {});
  await db.query(
    'DELETE FROM impersonation_audit_log WHERE admin_tenant_id = ANY($1::text[]) OR target_tenant_id = ANY($1::text[])',
    [tenantIds]
  ).catch(() => {});
  await db.query('DELETE FROM github_first_login WHERE github_user_id = ANY($1::text[])', [tenantIds]).catch(() => {});
  await db.query('DELETE FROM users WHERE email = ANY($1::text[])', [tenantIds]).catch(() => {});
}

// pebd-s1: found via a real, active production data-hygiene problem
// (2026-09-05): purgeE2eTenants's own per-tenant sequential loop (11
// queries x N tenants) timed out repeatedly against a real 2260+-tenant
// backlog, with no successful clearing mechanism running as a result.
// Chunking bounds round-trip COUNT to ~11 queries per chunk regardless of
// backlog size, rather than 11 queries per TENANT -- a 2260-tenant backlog
// becomes ~12 chunks x 11 queries = ~132 round-trips instead of ~24,860.
const BATCH_SIZE = 200;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/**
 * Find and purge every e2e-test- tagged tenant. Safe to run repeatedly
 * (idempotent -- a tenant already gone is simply not found again).
 * @param {object} db
 * @param {{onFound?: (tenantIds: string[]) => void}} [options] stcs-s1: an
 *   optional callback invoked with the found tenant ids as soon as the find
 *   step completes, before the purge loop starts -- lets a caller (the CLI
 *   entrypoint) capture progress for diagnostics if a later timeout fires
 *   mid-purge, without duplicating this function's own loop.
 * @returns {Promise<{tenantCount: number, tenantIds: string[]}>}
 */
async function purgeE2eTenants(db, options) {
  const opts = options || {};
  const tenantIds = await findE2eTenantIds(db);
  if (typeof opts.onFound === 'function') {
    opts.onFound(tenantIds);
  }
  // pebd-s1: batched, chunked deletes instead of a fully sequential
  // per-tenant loop -- see purgeTenantsBatch's own doc comment.
  for (const batch of chunk(tenantIds, BATCH_SIZE)) {
    await purgeTenantsBatch(db, batch);
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

// stcs-s1: staging's Postgres is a Neon serverless branch (see decisions.md,
// bri-s2.2-neon-staging-branch) with its own independent autosuspend,
// separate from the already-documented Fly-app auto-suspend pattern
// (workspace/capture-log.md, 2026-08-31). A cold Neon compute spin-up can
// make the FIRST connection attempt fail even within connectionTimeoutMillis
// -- retrying with backoff tolerates that one-time reactivation cost rather
// than giving up immediately. Once connected, subsequent queries are fast,
// so only the initial connect is retried here.
async function connectWithRetry(connect, attempts, delaysMs) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await connect();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delaysMs[i]));
      }
    }
  }
  throw lastErr;
}

// stcs-s1: default kept deliberately below the CI step's own
// timeout-minutes: 2 (120000ms, see staging-deploy.yml/e2e.yml's purge
// step) so this script's own graceful timeout/cleanup path (which still
// runs pool.end() and exits 0) always fires first -- the step-level kill
// remains a true last-resort backstop, never the normal path.
const DEFAULT_TIMEOUT_MS = 90000;

function getConfiguredTimeoutMs() {
  const raw = process.env.PURGE_E2E_TENANTS_TIMEOUT_MS;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

/**
 * stcs-s1: builds the non-blocking failure log line, distinguishing "no
 * tenants found yet" from "found N tenants, timed out partway through
 * purging them" -- extracted as a pure function (rather than inlined in the
 * CLI's catch block) so it is directly unit-testable without spawning a
 * child process.
 * @param {Error} err
 * @param {string[]|null} foundTenantIds null if findE2eTenantIds had not
 *   completed before the failure; the found array otherwise.
 * @returns {string}
 */
function formatPurgeFailureMessage(err, foundTenantIds) {
  if (foundTenantIds === null) {
    return `purge-e2e-tenants failed (non-blocking), before any tenants were found: ${err.message}`;
  }
  return `purge-e2e-tenants failed (non-blocking), found ${foundTenantIds.length} tenant(s) but did not finish purging them: ${err.message}`;
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
    const timeoutMs = getConfiguredTimeoutMs();
    // --dry-run: read-only preview for an operator running this by hand
    // against real staging data (e.g. the one-off retroactive purge) --
    // lists what WOULD be deleted without deleting anything. CI's own
    // always()-gated cleanup steps never pass this flag.
    const isDryRun = process.argv.includes('--dry-run');
    // stcs-s1: tracked outside the try block so the catch handler can report
    // how far the operation got before a timeout fired (see below).
    let foundTenantIds = null;
    try {
      // stcs-s1: retry is a best-effort warm-up, not a hard gate -- if it
      // never succeeds (e.g. a genuinely bad/unreachable DATABASE_URL, not
      // just a cold Neon compute), fall through into the existing find/purge
      // logic exactly as before this story. findE2eTenantIds's own per-query
      // try/catch already tolerates connection failures gracefully (treating
      // them the same as "table doesn't exist"), so a persistently broken
      // connection must keep degrading to "nothing found," not abort with an
      // error it previously never threw. Retrying here only ever ADDS a
      // chance to recover from a transient cold start; it must never make a
      // permanently-bad connection behave worse than it did before.
      try {
        await connectWithRetry(() => pool.query('SELECT 1'), 3, [2000, 4000]);
      } catch (_) { /* handled below by the existing tolerant find/purge path */ }
      if (isDryRun) {
        const tenantIds = await withTimeout(findE2eTenantIds(requireDbConnection()), timeoutMs, 'findE2eTenantIds');
        console.log(`[dry-run] Would purge ${tenantIds.length} e2e-test- tenant(s): ${tenantIds.join(', ') || '(none found)'}`);
        process.exitCode = 0;
        try { await withTimeout(pool.end(), 5000, 'pool.end'); } catch (_) {}
        process.exit(process.exitCode || 0);
        return;
      }
      const summary = await withTimeout(
        purgeE2eTenants(requireDbConnection(), {
          onFound: (tenantIds) => { foundTenantIds = tenantIds; }
        }),
        timeoutMs,
        'purgeE2eTenants'
      );
      console.log(`Purged ${summary.tenantCount} e2e-test- tenant(s): ${summary.tenantIds.join(', ') || '(none found)'}`);
      process.exitCode = 0;
    } catch (err) {
      // Never a hard failure here (D37-adjacent, but deliberately inverted):
      // this is pure post-run hygiene, not a correctness gate -- a failure
      // must be visible in the log but must never be able to fail the job
      // that ran the actual tests. See CI wiring's own continue-on-error.
      // stcs-s1: report how far the run got, so "cold start, nothing found
      // yet" is distinguishable from "found N tenants, timed out purging
      // them" in CI logs -- a generic message could not previously tell
      // these apart, hiding whether orphaned data is actually accumulating.
      console.error(formatPurgeFailureMessage(err, foundTenantIds));
      process.exitCode = 0;
    } finally {
      try { await withTimeout(pool.end(), 5000, 'pool.end'); } catch (_) {}
      process.exit(process.exitCode || 0);
    }
  })();
}

module.exports = {
  purgeE2eTenants,
  purgeTenant,
  purgeTenantsBatch,
  BATCH_SIZE,
  findE2eTenantIds,
  setDbConnection,
  requireDbConnection,
  E2E_TENANT_PREFIX,
  connectWithRetry,
  getConfiguredTimeoutMs,
  formatPurgeFailureMessage,
  withTimeout,
  DEFAULT_TIMEOUT_MS
};
