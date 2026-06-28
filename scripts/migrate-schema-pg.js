'use strict';

// migrate-schema-pg.js — one-time schema creation for Phase 3 Postgres persistence (p3.1).
// Run manually before activating DATABASE_URL:
//   node scripts/migrate-schema-pg.js
//
// Requires DATABASE_URL env var pointing to a Neon (or compatible Postgres) instance.

const { Pool } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS journeys (
        journey_id   VARCHAR      PRIMARY KEY,
        tenant_id    VARCHAR,
        owner_id     VARCHAR,
        feature_slug VARCHAR      NOT NULL,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        data         JSONB        NOT NULL DEFAULT '{}'
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS journeys_tenant_id_idx ON journeys (tenant_id)`);
    console.log('Schema created (or already exists): journeys table + tenant_id index');
  } finally {
    await pool.end();
  }
}

main().catch(function(err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
