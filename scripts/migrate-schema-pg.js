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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session_turns (
        id            SERIAL       PRIMARY KEY,
        journey_id    VARCHAR      NOT NULL REFERENCES journeys(journey_id),
        tenant_id     VARCHAR,
        skill_name    VARCHAR      NOT NULL,
        turns         JSONB        NOT NULL DEFAULT '[]',
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        UNIQUE(journey_id, skill_name)
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS session_turns_journey_id_idx ON session_turns (journey_id)`);
    console.log('Schema created (or already exists): session_turns table + journey_id index');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session_turns_archive (
        id            INTEGER      PRIMARY KEY,
        journey_id    VARCHAR      NOT NULL,
        tenant_id     VARCHAR,
        skill_name    VARCHAR      NOT NULL,
        turns         JSONB        NOT NULL DEFAULT '[]',
        created_at    TIMESTAMPTZ  NOT NULL
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS session_turns_archive_journey_id_idx ON session_turns_archive (journey_id)`);
    console.log('Schema created (or already exists): session_turns_archive table + journey_id index');
  } finally {
    await pool.end();
  }
}

main().catch(function(err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
