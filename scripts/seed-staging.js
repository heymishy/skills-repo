'use strict';

/**
 * bri-s2.4 -- idempotent anonymized seed script for staging.
 *
 * Populates a fresh (or already-seeded) Postgres database with a small,
 * fixed set of synthetic tenants and their tenant-scoped rows (products,
 * credits, user_roles) -- AC1 -- so that downstream tests (S2.6 smoke
 * test, Epic 3's journey specs, cross-tenant isolation tests) have real,
 * schema-accurate data to exercise, without ever containing real customer
 * information (AC3 / NFR-Security).
 *
 * DB connection is an injectable adapter (D37): setDbConnection() must be
 * called with a real query-capable adapter (a pg Pool, or any object
 * exposing an async query(sql, params) method) before the CLI entrypoint
 * can run without an explicit adapter argument. seed(adapter) also accepts
 * the adapter directly as a parameter so it is independently unit-testable
 * against a mock without touching module state.
 *
 * Idempotency (AC2) is structural: every INSERT uses
 * `ON CONFLICT (<primary key>) DO NOTHING` against deterministic synthetic
 * identifiers -- never a wipe-and-reseed, and never a database-generated
 * random ID that would defeat the ON CONFLICT check on a second run.
 *
 * Reference: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.4-anonymized-seed-script-test-plan.md
 */

// ---------------------------------------------------------------------------
// D37 injectable DB-connection adapter. Default stub throws -- see
// requireDbConnection() -- rather than silently no-opping (D37 rule #1).
// Real Postgres wiring for the CLI's production path lives in the
// `require.main === module` block below.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Synthetic tenant dataset (AC1, AC3) -- fixed, small set. MVP does not
// support configurable seed volume/scale (story Out of Scope).
// ---------------------------------------------------------------------------
const SYNTHETIC_TENANTS = [
  {
    tenantId: 'tenant-demo-1',
    productId: '00000000-0000-0000-0000-000000000001',
    productName: 'Demo Product One',
    syntheticEmail: 'engineer@example-staging.test',
    role: 'admin',
    balance: 100
  },
  {
    tenantId: 'tenant-demo-2',
    productId: '00000000-0000-0000-0000-000000000002',
    productName: 'Demo Product Two',
    syntheticEmail: 'operator@example-staging.test',
    role: 'user',
    balance: 50
  }
];

const ROWS_PER_TENANT = 3; // products + credits + user_roles

// ---------------------------------------------------------------------------
// seed(adapter) -- core, directly-testable entrypoint (AC1/AC2). Every
// tenant-scoped INSERT's first bound parameter is always tenant_id, so
// callers (including tests) can generically assert tenant scoping without
// knowing each table's full column order.
// ---------------------------------------------------------------------------
async function seed(adapter) {
  const db = adapter || requireDbConnection();

  for (const tenant of SYNTHETIC_TENANTS) {
    await db.query(
      `INSERT INTO products (tenant_id, product_id, name, description, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (product_id) DO NOTHING`,
      [tenant.tenantId, tenant.productId, tenant.productName,
       'Synthetic staging demo product -- seeded by scripts/seed-staging.js', tenant.syntheticEmail]
    );

    await db.query(
      `INSERT INTO credits (tenant_id, balance)
       VALUES ($1, $2)
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.tenantId, tenant.balance]
    );

    await db.query(
      `INSERT INTO user_roles (tenant_id, role)
       VALUES ($1, $2)
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.tenantId, tenant.role]
    );
  }

  return {
    tenantCount: SYNTHETIC_TENANTS.length,
    rowCount: SYNTHETIC_TENANTS.length * ROWS_PER_TENANT
  };
}

// ---------------------------------------------------------------------------
// Minimal built-in inert mock adapter -- used only when SEED_ADAPTER_MOCK=1
// is set, so the CLI entrypoint can be smoke-tested (IT1) without a real
// DATABASE_URL. Distinct from the richer dedup-simulating mock built in
// this story's own test file -- this one exists purely to prove the
// entrypoint is invokable end-to-end (AC4's "single invokable entrypoint"
// requirement; the "automatic" triggering itself is S2.5's scope).
// ---------------------------------------------------------------------------
function createInertMockAdapter() {
  return {
    query: async function () {
      return { rows: [], rowCount: 0 };
    }
  };
}

// ---------------------------------------------------------------------------
// CLI entrypoint (AC4 / IT1 / NFR-Audit). The real Postgres wiring in the
// `else` branch below was added as a separate commit from the seed logic +
// D37 setter (D37 rule #3) -- see this story's decisions.md / implementation
// plan Task 5.
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    try {
      if (process.env.SEED_ADAPTER_MOCK === '1') {
        setDbConnection(createInertMockAdapter());
      } else {
        // eslint-disable-next-line global-require
        const { Pool } = require('pg');
        setDbConnection(new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        }));
      }

      const summary = await seed(requireDbConnection());
      console.log(`Seeded ${summary.tenantCount} tenants, ${summary.rowCount} rows`);
      process.exit(0);
    } catch (err) {
      console.error('seed-staging failed:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = { seed, setDbConnection, requireDbConnection, SYNTHETIC_TENANTS };
