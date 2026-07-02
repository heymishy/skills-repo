'use strict';

// migrate-schema-credits.js — idempotent schema migration for credits and stripe_events tables.
// Run before first deploy or on any new environment:
//   node scripts/migrate-schema-credits.js
//
// Requires DATABASE_URL env var pointing to a Neon (or compatible Postgres) instance.
// Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS.

// Injectable db client for tests; defaults to a real pg Client
let _db = null;
function setDbClient(client) { _db = client; }

async function migrate(dbOverride) {
  const db = dbOverride || _db || (function() {
    const { Client } = require('pg');
    return new Client({ connectionString: process.env.DATABASE_URL });
  })();

  const isExternal = !dbOverride && !_db;
  if (isExternal) await db.connect();

  await db.query(`CREATE TABLE IF NOT EXISTS credits (
    tenant_id  TEXT        PRIMARY KEY,
    balance    INTEGER     NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS stripe_events (
    stripe_event_id TEXT        PRIMARY KEY,
    event_type      TEXT,
    processed_at    TIMESTAMPTZ DEFAULT now()
  )`);

  if (isExternal) await db.end();
  console.log('Credits schema migration complete.');
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
