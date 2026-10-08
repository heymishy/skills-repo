'use strict';

// migrate-schema-journeys.js — idempotent schema migration for the customer
// journey feature: customer_journeys, customer_journey_stages, and
// feature_customer_journey_stage_mappings.
// Run before first deploy or on any new environment:
//   node scripts/migrate-schema-journeys.js
//
// Requires DATABASE_URL env var pointing to a Neon (or compatible Postgres) instance.
// Safe to run multiple times — uses CREATE TABLE/INDEX IF NOT EXISTS throughout.
// The `products` table is assumed to already exist (FK target for
// customer_journeys.product_id).
//
// ep5-s3: table names are prefixed customer_* deliberately -- a plain
// `journeys` table already exists (src/web-ui/adapters/journey-store-pg.js,
// the platform's own outer-loop session persistence, created on every
// server boot). CREATE TABLE IF NOT EXISTS against that name would have
// silently no-op'd forever, since the table already exists under a
// completely different, incompatible shape. See decisions.md D4.

// Injectable db client for tests; defaults to a real pg Client (D37 convention,
// matching migrate-schema-credits.js).
let _db = null;
function setDbClient(client) { _db = client; }

async function migrate(dbOverride) {
  const db = dbOverride || _db || (function() {
    const { Client } = require('pg');
    return new Client({ connectionString: process.env.DATABASE_URL });
  })();

  const isExternal = !dbOverride && !_db;
  if (isExternal) await db.connect();

  await db.query(`CREATE TABLE IF NOT EXISTS customer_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    product_id UUID REFERENCES products(product_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_customer_journeys_tenant_id ON customer_journeys(tenant_id)`);

  await db.query(`CREATE TABLE IF NOT EXISTS customer_journey_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID NOT NULL REFERENCES customer_journeys(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    description TEXT,
    customer_actions TEXT,
    touchpoints TEXT,
    channel TEXT,
    emotion TEXT,
    pain_points TEXT,
    opportunities TEXT,
    moment_of_truth BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_customer_journey_stages_journey_id ON customer_journey_stages(journey_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_customer_journey_stages_tenant_id ON customer_journey_stages(tenant_id)`);

  await db.query(`CREATE TABLE IF NOT EXISTS feature_customer_journey_stage_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_stage_id UUID NOT NULL REFERENCES customer_journey_stages(id) ON DELETE CASCADE,
    journey_id UUID NOT NULL REFERENCES customer_journeys(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    feature_slug TEXT NOT NULL,
    metric_keys JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_fjs_mappings_stage_id ON feature_customer_journey_stage_mappings(journey_stage_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_fjs_mappings_tenant_id ON feature_customer_journey_stage_mappings(tenant_id)`);

  if (isExternal) await db.end();
  console.log('Customer journeys schema migration complete.');
}

module.exports = { migrate, setDbClient };

if (require.main === module) {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  migrate().then(function() { process.exit(0); }).catch(function(e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  });
}
