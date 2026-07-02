'use strict';

// smoke-test-credits.js — round-trip smoke test for credits table.
// Requires DATABASE_URL env var and migration already run.
// Skips gracefully when DATABASE_URL is not set.
//
// Usage:
//   node scripts/smoke-test-credits.js

if (!process.env.DATABASE_URL) {
  console.log('SKIP: DATABASE_URL not set — skipping credits smoke test.');
  process.exit(0);
}

const { Client } = require('pg');

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const testTenant = 'smoke-test-tenant-' + Date.now();

  // (1) Upsert test tenant with balance = 100
  await db.query(
    'INSERT INTO credits (tenant_id, balance) VALUES ($1, $2) ON CONFLICT (tenant_id) DO UPDATE SET balance = $2',
    [testTenant, 100]
  );

  // (2) Read back and assert balance is 100
  const r1 = await db.query('SELECT balance FROM credits WHERE tenant_id = $1', [testTenant]);
  if (r1.rows[0].balance !== 100) {
    throw new Error('Expected balance 100, got ' + r1.rows[0].balance);
  }

  // (3) Decrement balance by 10 (atomic UPDATE)
  await db.query(
    'UPDATE credits SET balance = balance + $1 WHERE tenant_id = $2',
    [-10, testTenant]
  );

  // (4) Read again and assert balance is 90
  const r2 = await db.query('SELECT balance FROM credits WHERE tenant_id = $1', [testTenant]);
  if (r2.rows[0].balance !== 90) {
    throw new Error('Expected balance 90, got ' + r2.rows[0].balance);
  }

  // (5) Delete test row
  await db.query('DELETE FROM credits WHERE tenant_id = $1', [testTenant]);

  await db.end();
  console.log('Credits smoke test PASSED');
  process.exit(0);
}

main().catch(function(e) {
  console.error('Credits smoke test FAILED:', e.message);
  process.exit(1);
});
