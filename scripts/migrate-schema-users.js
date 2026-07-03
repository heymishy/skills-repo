'use strict';

// migrate-schema-users.js — idempotent schema migration for users table.
// Run before first deploy or on any new environment:
//   node scripts/migrate-schema-users.js
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

  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT        UNIQUE NOT NULL,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT now()
  )`);

  if (isExternal) await db.end();
  console.log('Users schema migration complete.');
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
