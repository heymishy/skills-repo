'use strict';

// Standalone Neon Postgres smoke test — s3.1 AC2/AC4
// Usage: DATABASE_URL=<neon-url> node scripts/smoke-test-pg.js
// Skips gracefully when DATABASE_URL is not set.

const { Pool } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('SKIP: DATABASE_URL not set');
    process.exit(0);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const testId = 'smoke-test-' + Date.now();
  const testTenantId = 'smoke-tenant';
  const testFeatureSlug = 'smoke-feature';
  const testData = { completedStages: [], mode: 'feature', complete: false };

  try {
    // INSERT
    await pool.query(
      `INSERT INTO journeys (journey_id, tenant_id, owner_id, feature_slug, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [testId, testTenantId, 'smoke-user', testFeatureSlug, JSON.stringify(testData)]
    );
    console.log('  INSERT ... OK');

    // SELECT by journey_id
    const result = await pool.query(
      'SELECT journey_id, tenant_id, feature_slug, data FROM journeys WHERE journey_id = $1',
      [testId]
    );
    if (result.rows.length !== 1) throw new Error('Expected 1 row, got ' + result.rows.length);
    const row = result.rows[0];
    if (row.journey_id !== testId) throw new Error('journey_id mismatch');
    if (row.tenant_id !== testTenantId) throw new Error('tenant_id mismatch');
    console.log('  SELECT ... OK (tenant_id=' + row.tenant_id + ')');

    // Verify accessToken is not present in stored data
    const stored = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    if (stored.accessToken !== undefined) throw new Error('accessToken leaked into stored data');
    console.log('  accessToken absent from stored data ... OK');

    // DELETE
    await pool.query('DELETE FROM journeys WHERE journey_id = $1', [testId]);
    const check = await pool.query('SELECT 1 FROM journeys WHERE journey_id = $1', [testId]);
    if (check.rows.length !== 0) throw new Error('Row not deleted');
    console.log('  DELETE ... OK');

    console.log('\nNeon smoke test PASSED');
    process.exit(0);
  } catch (err) {
    console.error('\nNeon smoke test FAILED:', err.message);
    // Attempt cleanup
    try { await pool.query('DELETE FROM journeys WHERE journey_id = $1', [testId]); } catch (_) {}
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
