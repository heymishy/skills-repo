'use strict';
// check-ic-s2-position-persistence.js -- TDD tests for ic-s2 (Epic: canvas-replacement-for-journey-stages,
// 2026-10-10-infinite-canvas). Story: artefacts/2026-10-10-infinite-canvas/stories/ic-s2.md
// Test plan: artefacts/2026-10-10-infinite-canvas/test-plans/ic-s2-test-plan.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  // -- AC4: migration is idempotent, DATABASE_URL-gated -------------------
  if (!process.env.DATABASE_URL) {
    console.log('  [SKIP] AC4: DATABASE_URL not set -- integration test requires a real Postgres connection');
  } else {
    try {
      const { Client } = require('pg');
      const { migrate } = require('../scripts/migrate-schema-journeys');
      const db = new Client({ connectionString: process.env.DATABASE_URL });
      await db.connect();
      try {
        await db.query(`CREATE TABLE IF NOT EXISTS products (
          product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR NOT NULL,
          name VARCHAR NOT NULL
        )`);
        await db.query('DROP TABLE IF EXISTS feature_customer_journey_stage_mappings CASCADE');
        await db.query('DROP TABLE IF EXISTS customer_journey_stages CASCADE');
        await db.query('DROP TABLE IF EXISTS customer_journeys CASCADE');
        await migrate(db);
        // Insert a pre-existing row BEFORE the second run, to prove no backfill happens.
        const jr = await db.query(`INSERT INTO customer_journeys (tenant_id, name) VALUES ('t1','J') RETURNING id`);
        await db.query(`INSERT INTO customer_journey_stages (journey_id, tenant_id, name, position) VALUES ($1,'t1','S1',0)`, [jr.rows[0].id]);
        await migrate(db); // second run -- must not error, must not backfill
        const cols = await db.query(`SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'customer_journey_stages' AND column_name IN ('position_x','position_y')`);
        assert.strictEqual(cols.rows.length, 2, 'expected both position_x and position_y columns to exist');
        cols.rows.forEach(function(r) {
          assert.strictEqual(r.is_nullable, 'YES', r.column_name + ' must be nullable');
          assert.strictEqual(r.data_type, 'double precision', r.column_name + ' must be DOUBLE PRECISION');
        });
        const row = await db.query(`SELECT position_x, position_y FROM customer_journey_stages WHERE journey_id = $1`, [jr.rows[0].id]);
        assert.strictEqual(row.rows[0].position_x, null, 'pre-existing row position_x must be NULL, no backfill');
        assert.strictEqual(row.rows[0].position_y, null, 'pre-existing row position_y must be NULL, no backfill');
        await db.query('DROP TABLE IF EXISTS feature_customer_journey_stage_mappings CASCADE');
        await db.query('DROP TABLE IF EXISTS customer_journey_stages CASCADE');
        await db.query('DROP TABLE IF EXISTS customer_journeys CASCADE');
        await db.end();
        pass('AC4: migration adds nullable position_x/position_y columns idempotently, no backfill');
      } catch (e) {
        try { await db.end(); } catch (_) {}
        throw e;
      }
    } catch (e) { fail('AC4: migration adds nullable position_x/position_y columns idempotently, no backfill', e); }
  }

  console.log(`\n[ic-s2-position-persistence] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
