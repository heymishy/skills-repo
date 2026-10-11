'use strict';
// check-ic-hotfix1-position-migration.js -- TDD test for the production
// incident fix: ic-s2's position_x/position_y columns were only ever added
// via scripts/migrate-schema-journeys.js, which is never copied into the
// deployed Docker image (see the Dockerfile's own COPY allowlist). This
// broke every GET /journeys/:id canvas page view in every deployed
// environment with "column position_x does not exist" -- confirmed live on
// wuce-staging.fly.dev, 2026-10-11. The fix mirrors the ALTER TABLE
// statements directly into server.js's own inline startup migration block
// (the only thing that actually runs against a deployed database).
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

if (!process.env.DATABASE_URL) {
  console.log('  [SKIP] AC1/AC2/AC3: DATABASE_URL not set -- integration test requires a real Postgres connection');
  console.log('\n[ic-hotfix1-position-migration] Results: 0 passed, 0 failed (all SKIPped)');
} else {
  (async function() {
    const { Client } = require('pg');
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();

    try {
      // -- handleGetJourneyCanvas renders through renderShellWithNav, which
      // calls getProductsNavSummary -- two unrelated, long-established
      // tables real staging/production already has (products, and the
      // legacy journeys table from journey-store-pg.js -- a SEPARATE table
      // from customer_journeys, see ep5-s3 decisions.md D4). Empty tables
      // (zero rows) are sufficient: getProductsNavSummary's own
      // noProductJourneyCount query runs unconditionally but only needs the
      // table to exist, not be populated, to prove this fix in isolation. --
      await db.query('DROP TABLE IF EXISTS journeys CASCADE');
      await db.query('DROP TABLE IF EXISTS products CASCADE');
      await db.query(`
        CREATE TABLE journeys (
          journey_id VARCHAR PRIMARY KEY,
          tenant_id VARCHAR,
          owner_id VARCHAR,
          feature_slug VARCHAR NOT NULL,
          product_id UUID,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          data JSONB NOT NULL DEFAULT '{}'
        )
      `);
      await db.query(`
        CREATE TABLE products (
          product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR NOT NULL,
          name VARCHAR NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          created_by VARCHAR NOT NULL DEFAULT 'system',
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // -- Reproduce the REAL pre-fix staging state: customer_journeys,
      // customer_journey_stages (without position_x/position_y), and
      // feature_customer_journey_stage_mappings all already exist (a manual
      // scripts/migrate-schema-journeys.js run, historically, before ic-s2
      // added the position columns to that same script) -- exactly what
      // real staging/production had before this fix, confirmed via
      // flyctl logs against both environments. --
      await db.query('DROP TABLE IF EXISTS feature_customer_journey_stage_mappings CASCADE');
      await db.query('DROP TABLE IF EXISTS customer_journey_stages CASCADE');
      await db.query('DROP TABLE IF EXISTS customer_journeys CASCADE');
      await db.query(`
        CREATE TABLE customer_journeys (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await db.query(`
        CREATE TABLE customer_journey_stages (
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
        )
      `);
      await db.query(`
        CREATE TABLE feature_customer_journey_stage_mappings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          journey_stage_id UUID NOT NULL REFERENCES customer_journey_stages(id) ON DELETE CASCADE,
          journey_id UUID NOT NULL REFERENCES customer_journeys(id) ON DELETE CASCADE,
          tenant_id TEXT NOT NULL,
          feature_slug TEXT NOT NULL,
          metric_keys JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // A pre-existing stage row, to prove the fix doesn't lose data.
      const jr = await db.query(`INSERT INTO customer_journeys (tenant_id, name) VALUES ('t1','J') RETURNING id`);
      await db.query(`INSERT INTO customer_journey_stages (journey_id, tenant_id, name, position) VALUES ($1,'t1','S1',0)`, [jr.rows[0].id]);

      // -- AC1/AC2: run the EXACT statements server.js's own startup
      // migration now runs (copied verbatim from the fix in src/web-ui/server.js). --
      try {
        await db.query(`ALTER TABLE customer_journey_stages ADD COLUMN IF NOT EXISTS position_x DOUBLE PRECISION`);
        await db.query(`ALTER TABLE customer_journey_stages ADD COLUMN IF NOT EXISTS position_y DOUBLE PRECISION`);
        // Run a second time -- must not error (idempotent, matches real
        // repeated-deploy/restart behaviour).
        await db.query(`ALTER TABLE customer_journey_stages ADD COLUMN IF NOT EXISTS position_x DOUBLE PRECISION`);
        await db.query(`ALTER TABLE customer_journey_stages ADD COLUMN IF NOT EXISTS position_y DOUBLE PRECISION`);

        const cols = await db.query(`SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'customer_journey_stages' AND column_name IN ('position_x','position_y')`);
        assert.strictEqual(cols.rows.length, 2, 'expected both position_x and position_y columns to exist');
        cols.rows.forEach(function(r) {
          assert.strictEqual(r.is_nullable, 'YES', r.column_name + ' must be nullable');
          assert.strictEqual(r.data_type, 'double precision', r.column_name + ' must be DOUBLE PRECISION');
        });

        const row = await db.query(`SELECT name, position_x, position_y FROM customer_journey_stages WHERE journey_id = $1`, [jr.rows[0].id]);
        assert.strictEqual(row.rows[0].name, 'S1', 'expected the pre-existing row to be untouched');
        assert.strictEqual(row.rows[0].position_x, null, 'pre-existing row position_x must be NULL, no backfill');
        assert.strictEqual(row.rows[0].position_y, null, 'pre-existing row position_y must be NULL, no backfill');
        pass('AC1/AC2: server.js\'s own inline migration adds position_x/position_y idempotently, no data loss on existing rows');
      } catch (e) { fail('AC1/AC2: server.js\'s own inline migration adds position_x/position_y idempotently, no data loss on existing rows', e); }

      // -- AC3: handleGetJourneyCanvas no longer throws against a table
      // migrated only via this inline path. --
      try {
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const { handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');
        const req = { session: { tenantId: 't1' }, params: { id: jr.rows[0].id } };
        let body = null;
        const res = { writeHead: function() {}, end: function(b) { body = b; } };
        await handleGetJourneyCanvas(req, res, null, pool);
        assert.ok(body && body.indexOf('S1') !== -1, 'expected the canvas page to render the stage, not throw');
        await pool.end();
        pass('AC3: handleGetJourneyCanvas succeeds against a table migrated only via server.js\'s own inline path');
      } catch (e) { fail('AC3: handleGetJourneyCanvas succeeds against a table migrated only via server.js\'s own inline path', e); }

      await db.query('DROP TABLE IF EXISTS feature_customer_journey_stage_mappings CASCADE');
      await db.query('DROP TABLE IF EXISTS customer_journey_stages CASCADE');
      await db.query('DROP TABLE IF EXISTS customer_journeys CASCADE');

      // -- AC4: a genuinely FRESH environment (no tables at all -- the
      // scenario this fix must also cover, since server.js's own inline
      // migrations are the only thing a brand-new deploy target ever runs).
      // Runs every statement server.js's own startup migration block now
      // runs, in the exact order it runs them. --
      try {
        await db.query(`
          CREATE TABLE IF NOT EXISTS customer_journeys (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        await db.query(`
          CREATE TABLE IF NOT EXISTS customer_journey_stages (
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
          )
        `);
        await db.query(`ALTER TABLE customer_journey_stages ADD COLUMN IF NOT EXISTS position_x DOUBLE PRECISION`);
        await db.query(`ALTER TABLE customer_journey_stages ADD COLUMN IF NOT EXISTS position_y DOUBLE PRECISION`);
        await db.query(`
          CREATE TABLE IF NOT EXISTS feature_customer_journey_stage_mappings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            journey_stage_id UUID NOT NULL REFERENCES customer_journey_stages(id) ON DELETE CASCADE,
            journey_id UUID NOT NULL REFERENCES customer_journeys(id) ON DELETE CASCADE,
            tenant_id TEXT NOT NULL,
            feature_slug TEXT NOT NULL,
            metric_keys JSONB NOT NULL DEFAULT '[]',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);

        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const { handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');
        const freshJourney = await db.query(`INSERT INTO customer_journeys (tenant_id, name) VALUES ('t2','FreshJ') RETURNING id`);
        await db.query(`INSERT INTO customer_journey_stages (journey_id, tenant_id, name, position) VALUES ($1,'t2','FreshStage',0)`, [freshJourney.rows[0].id]);
        const req = { session: { tenantId: 't2' }, params: { id: freshJourney.rows[0].id } };
        let body = null;
        const res = { writeHead: function() {}, end: function(b) { body = b; } };
        await handleGetJourneyCanvas(req, res, null, pool);
        assert.ok(body && body.indexOf('FreshStage') !== -1, 'expected the canvas page to render on a genuinely fresh environment, not throw');
        await pool.end();
        pass('AC4: a genuinely fresh environment (no pre-existing tables) migrates cleanly end to end');
      } catch (e) { fail('AC4: a genuinely fresh environment (no pre-existing tables) migrates cleanly end to end', e); }

      await db.query('DROP TABLE IF EXISTS feature_customer_journey_stage_mappings CASCADE');
      await db.query('DROP TABLE IF EXISTS customer_journey_stages CASCADE');
      await db.query('DROP TABLE IF EXISTS customer_journeys CASCADE');
      await db.query('DROP TABLE IF EXISTS products CASCADE');
      await db.query('DROP TABLE IF EXISTS journeys CASCADE');
    } finally {
      await db.end();
    }

    console.log(`\n[ic-hotfix1-position-migration] Results: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exitCode = 1;
  })();
}
