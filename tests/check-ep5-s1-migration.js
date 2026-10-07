'use strict';
// check-ep5-s1-migration.js -- AC verification for ep5-s1 (database migration:
// create journeys, journey_stages, and feature_journey_stage_mappings tables --
// see artefacts/2026-10-05-customer-journey-as-first-class/).
//
// Integration tests only (information_schema/pg_indexes introspection against
// real Postgres), matching this repo's own established convention for
// DATABASE_URL-dependent tests (check-idp-s1-persist-ideas-in-postgres.js):
// SKIP (not fail) when DATABASE_URL is absent, rather than the DoR's own
// literal "all tests fail" instruction -- npm test's CI run (pr-checks.yml)
// has no DATABASE_URL wired, so an unconditional fail here would break every
// future PR, not just this story's own merge.
//
// Run: DATABASE_URL=postgres://... node tests/check-ep5-s1-migration.js

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}

async function run() {
  console.log('\n[ep5-s1] AC1-AC5 -- real Postgres schema migration verification');
  if (!process.env.DATABASE_URL) {
    console.log('  [SKIP] AC1-AC5: DATABASE_URL not set -- integration tests require a real Postgres connection');
    console.log('\n[ep5-s1-migration] Results: ' + passed + ' passed, ' + failed + ' failed (skipped -- no DATABASE_URL)\n');
    process.exit(0);
    return;
  }

  const { Client } = require('pg');
  const { migrate } = require('../scripts/migrate-schema-journeys');
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  try {
    // Test-only setup: a minimal products table so the journeys.product_id FK
    // has a real target to reference -- the production migration script
    // itself must NOT create this table (story's own out-of-scope note; the
    // real products table already exists in production, created by server.js).
    await db.query(`CREATE TABLE IF NOT EXISTS products (
      product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR NOT NULL,
      name VARCHAR NOT NULL
    )`);

    // Clean slate for a repeatable run.
    await db.query('DROP TABLE IF EXISTS feature_journey_stage_mappings CASCADE');
    await db.query('DROP TABLE IF EXISTS journey_stages CASCADE');
    await db.query('DROP TABLE IF EXISTS journeys CASCADE');

    await migrate(db);

    // ── AC1: journeys table has all required columns ──
    {
      const res = await db.query(`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'journeys'`);
      const cols = {};
      res.rows.forEach(function(r) { cols[r.column_name] = r.is_nullable; });
      ok(Object.keys(cols).length === 7, 'AC1: journeys has exactly 7 columns, got ' + Object.keys(cols).length);
      ['id', 'tenant_id', 'name', 'description', 'product_id', 'created_at', 'updated_at'].forEach(function(c) {
        ok(c in cols, 'AC1: journeys has column ' + c);
      });
      ok(cols.tenant_id === 'NO' && cols.name === 'NO', 'AC1: tenant_id and name are NOT NULL');
      ok(cols.description === 'YES' && cols.product_id === 'YES', 'AC1: description and product_id are nullable');
    }

    // ── AC2: journey_stages table has all required columns ──
    {
      const res = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'journey_stages'`);
      const cols = res.rows.map(function(r) { return r.column_name; });
      const expected = ['id', 'journey_id', 'tenant_id', 'name', 'position', 'description', 'customer_actions',
        'touchpoints', 'channel', 'emotion', 'pain_points', 'opportunities', 'moment_of_truth', 'created_at', 'updated_at'];
      ok(cols.length === expected.length, 'AC2: journey_stages has exactly ' + expected.length + ' columns, got ' + cols.length);
      expected.forEach(function(c) { ok(cols.indexOf(c) !== -1, 'AC2: journey_stages has column ' + c); });
      const momentRes = await db.query(`SELECT data_type, column_default FROM information_schema.columns WHERE table_name = 'journey_stages' AND column_name = 'moment_of_truth'`);
      ok(momentRes.rows[0] && momentRes.rows[0].data_type === 'boolean', 'AC2: moment_of_truth is boolean');
      ok(momentRes.rows[0] && /false/i.test(momentRes.rows[0].column_default || ''), 'AC2: moment_of_truth defaults to false');
    }

    // ── AC3: feature_journey_stage_mappings table + FK constraints with cascade ──
    {
      const res = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'feature_journey_stage_mappings'`);
      const cols = res.rows.map(function(r) { return r.column_name; });
      const expected = ['id', 'journey_stage_id', 'journey_id', 'tenant_id', 'feature_slug', 'metric_keys', 'created_at'];
      ok(cols.length === expected.length, 'AC3: feature_journey_stage_mappings has exactly ' + expected.length + ' columns, got ' + cols.length);
      expected.forEach(function(c) { ok(cols.indexOf(c) !== -1, 'AC3: feature_journey_stage_mappings has column ' + c); });

      const fkRes = await db.query(`
        SELECT kcu.column_name, ccu.table_name AS foreign_table, rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'feature_journey_stage_mappings' AND tc.constraint_type = 'FOREIGN KEY'
      `);
      const stageFk = fkRes.rows.find(function(r) { return r.column_name === 'journey_stage_id'; });
      const journeyFk = fkRes.rows.find(function(r) { return r.column_name === 'journey_id'; });
      ok(stageFk && stageFk.foreign_table === 'journey_stages' && /cascade/i.test(stageFk.delete_rule), 'AC3: journey_stage_id FK -> journey_stages(id) ON DELETE CASCADE');
      ok(journeyFk && journeyFk.foreign_table === 'journeys' && /cascade/i.test(journeyFk.delete_rule), 'AC3: journey_id FK -> journeys(id) ON DELETE CASCADE');
    }

    // ── AC4: idempotent -- second run produces no error and no duplicate schema objects ──
    {
      let secondRunError = null;
      try { await migrate(db); } catch (e) { secondRunError = e; }
      ok(secondRunError === null, 'AC4: running the migration a second time does not throw');

      const tableCount = await db.query(`SELECT table_name, count(*) FROM information_schema.tables WHERE table_name IN ('journeys','journey_stages','feature_journey_stage_mappings') GROUP BY table_name`);
      ok(tableCount.rows.every(function(r) { return Number(r.count) === 1; }), 'AC4: exactly one copy of each table exists after two runs');

      const idxDupes = await db.query(`
        SELECT indexname, count(*) FROM pg_indexes
        WHERE tablename IN ('journeys','journey_stages','feature_journey_stage_mappings')
        GROUP BY indexname HAVING count(*) > 1
      `);
      ok(idxDupes.rows.length === 0, 'AC4: no duplicate index names after two runs');
    }

    // ── AC5: named indexes exist ──
    {
      const idxRes = await db.query(`SELECT indexname FROM pg_indexes WHERE tablename IN ('journeys','journey_stages','feature_journey_stage_mappings')`);
      const names = idxRes.rows.map(function(r) { return r.indexname; });
      ['idx_journeys_tenant_id', 'idx_journey_stages_journey_id', 'idx_journey_stages_tenant_id',
        'idx_fjs_mappings_stage_id', 'idx_fjs_mappings_tenant_id'].forEach(function(n) {
        ok(names.indexOf(n) !== -1, 'AC5: index ' + n + ' exists');
      });
    }
  } finally {
    // Leave the real DB clean for whatever else uses this connection.
    try {
      await db.query('DROP TABLE IF EXISTS feature_journey_stage_mappings CASCADE');
      await db.query('DROP TABLE IF EXISTS journey_stages CASCADE');
      await db.query('DROP TABLE IF EXISTS journeys CASCADE');
    } catch (_) {}
    await db.end();
  }

  console.log('\n[ep5-s1-migration] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(function(e) {
  console.error('[ep5-s1-migration] Unexpected error: ' + (e && e.message));
  process.exit(1);
});
