'use strict';
// check-ep5-s1-migration.js -- AC verification for ep5-s1/ep5-s3 (database
// migration: create customer_journeys, customer_journey_stages, and
// feature_customer_journey_stage_mappings tables -- see
// artefacts/2026-10-05-customer-journey-as-first-class/).
//
// Integration tests only (information_schema/pg_indexes introspection against
// real Postgres), matching this repo's own established convention for
// DATABASE_URL-dependent tests (check-idp-s1-persist-ideas-in-postgres.js):
// SKIP (not fail) when DATABASE_URL is absent, rather than the DoR's own
// literal "all tests fail" instruction -- npm test's CI run (pr-checks.yml)
// has no DATABASE_URL wired, so an unconditional fail here would break every
// future PR, not just this story's own merge.
//
// ep5-s3: tables renamed customer_journeys/customer_journey_stages/
// feature_customer_journey_stage_mappings -- a plain `journeys` table
// already exists (src/web-ui/adapters/journey-store-pg.js, the platform's
// own outer-loop session persistence). AC1 below now deliberately creates
// that real platform table FIRST, reproducing the exact collision scenario
// that made ep5-s1's own original (unrenamed) migration a silent no-op in
// every real environment -- the one check ep5-s1 itself never performed.
//
// Run: DATABASE_URL=postgres://... node tests/check-ep5-s1-migration.js
//
// *** NEVER point DATABASE_URL at a shared/real (staging or production)
// *** database when running this file. Its own setup/cleanup below
// *** deliberately DROPs journeys/artefacts to give itself a clean slate --
// *** correct for a throwaway test database, but destructive against any
// *** environment where those tables hold real data (confirmed live,
// *** 2026-10-08: wuce-staging's real journeys table has 8297 rows). To
// *** verify this migration against a real/shared database, use a separate,
// *** purpose-built read-only-plus-pure-additive-migration script instead
// *** (see ep5-s3-dod.md's own DoD Observation #4) -- never this file.

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}

async function run() {
  console.log('\n[ep5-s1/ep5-s3] AC1-AC5 -- real Postgres schema migration verification');
  if (!process.env.DATABASE_URL) {
    console.log('  [SKIP] AC1-AC5: DATABASE_URL not set -- integration tests require a real Postgres connection');
    console.log('\n[ep5-s1-migration] Results: ' + passed + ' passed, ' + failed + ' failed (skipped -- no DATABASE_URL)\n');
    process.exit(0);
    return;
  }

  const { Client } = require('pg');
  const { migrate } = require('../scripts/migrate-schema-journeys');
  const journeyStorePg = require('../src/web-ui/adapters/journey-store-pg');
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  try {
    // Test-only setup: a minimal products table so the customer_journeys.product_id
    // FK has a real target to reference -- the production migration script
    // itself must NOT create this table (story's own out-of-scope note; the
    // real products table already exists in production, created by server.js).
    await db.query(`CREATE TABLE IF NOT EXISTS products (
      product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR NOT NULL,
      name VARCHAR NOT NULL
    )`);

    // Clean slate for a repeatable run.
    await db.query('DROP TABLE IF EXISTS feature_customer_journey_stage_mappings CASCADE');
    await db.query('DROP TABLE IF EXISTS customer_journey_stages CASCADE');
    await db.query('DROP TABLE IF EXISTS customer_journeys CASCADE');
    await db.query('DROP TABLE IF EXISTS artefacts CASCADE');
    await db.query('DROP TABLE IF EXISTS journeys CASCADE');

    // ep5-s3 AC1: reproduce the real collision -- the platform's own journeys
    // table is created FIRST, exactly as it is on every real server boot.
    await journeyStorePg.migrateSchema();

    await migrate(db);

    // ── AC1: customer_journeys has all required columns, AND the platform's
    //    own journeys table is provably untouched ──
    {
      const res = await db.query(`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'customer_journeys'`);
      const cols = {};
      res.rows.forEach(function(r) { cols[r.column_name] = r.is_nullable; });
      ok(Object.keys(cols).length === 7, 'AC1: customer_journeys has exactly 7 columns, got ' + Object.keys(cols).length);
      ['id', 'tenant_id', 'name', 'description', 'product_id', 'created_at', 'updated_at'].forEach(function(c) {
        ok(c in cols, 'AC1: customer_journeys has column ' + c);
      });
      ok(cols.tenant_id === 'NO' && cols.name === 'NO', 'AC1: tenant_id and name are NOT NULL');
      ok(cols.description === 'YES' && cols.product_id === 'YES', 'AC1: description and product_id are nullable');

      const platformRes = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'journeys'`);
      const platformCols = platformRes.rows.map(function(r) { return r.column_name; });
      ok(platformCols.indexOf('journey_id') !== -1 && platformCols.indexOf('owner_id') !== -1 && platformCols.indexOf('data') !== -1,
        'AC1: the platform\'s own journeys table (journey_id/owner_id/data) is untouched by this migration');
      ok(platformCols.indexOf('id') === -1 && platformCols.indexOf('name') === -1,
        'AC1: the platform\'s own journeys table was NOT overwritten with customer_journeys\' own shape');
    }

    // ── AC2: customer_journey_stages table has all required columns ──
    {
      const res = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'customer_journey_stages'`);
      const cols = res.rows.map(function(r) { return r.column_name; });
      const expected = ['id', 'journey_id', 'tenant_id', 'name', 'position', 'description', 'customer_actions',
        'touchpoints', 'channel', 'emotion', 'pain_points', 'opportunities', 'moment_of_truth', 'created_at', 'updated_at'];
      ok(cols.length === expected.length, 'AC2: customer_journey_stages has exactly ' + expected.length + ' columns, got ' + cols.length);
      expected.forEach(function(c) { ok(cols.indexOf(c) !== -1, 'AC2: customer_journey_stages has column ' + c); });
      const momentRes = await db.query(`SELECT data_type, column_default FROM information_schema.columns WHERE table_name = 'customer_journey_stages' AND column_name = 'moment_of_truth'`);
      ok(momentRes.rows[0] && momentRes.rows[0].data_type === 'boolean', 'AC2: moment_of_truth is boolean');
      ok(momentRes.rows[0] && /false/i.test(momentRes.rows[0].column_default || ''), 'AC2: moment_of_truth defaults to false');
    }

    // ── AC3: feature_customer_journey_stage_mappings table + FK constraints with cascade ──
    {
      const res = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'feature_customer_journey_stage_mappings'`);
      const cols = res.rows.map(function(r) { return r.column_name; });
      const expected = ['id', 'journey_stage_id', 'journey_id', 'tenant_id', 'feature_slug', 'metric_keys', 'created_at'];
      ok(cols.length === expected.length, 'AC3: feature_customer_journey_stage_mappings has exactly ' + expected.length + ' columns, got ' + cols.length);
      expected.forEach(function(c) { ok(cols.indexOf(c) !== -1, 'AC3: feature_customer_journey_stage_mappings has column ' + c); });

      const fkRes = await db.query(`
        SELECT kcu.column_name, ccu.table_name AS foreign_table, rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'feature_customer_journey_stage_mappings' AND tc.constraint_type = 'FOREIGN KEY'
      `);
      const stageFk = fkRes.rows.find(function(r) { return r.column_name === 'journey_stage_id'; });
      const journeyFk = fkRes.rows.find(function(r) { return r.column_name === 'journey_id'; });
      ok(stageFk && stageFk.foreign_table === 'customer_journey_stages' && /cascade/i.test(stageFk.delete_rule), 'AC3: journey_stage_id FK -> customer_journey_stages(id) ON DELETE CASCADE');
      ok(journeyFk && journeyFk.foreign_table === 'customer_journeys' && /cascade/i.test(journeyFk.delete_rule), 'AC3: journey_id FK -> customer_journeys(id) ON DELETE CASCADE');
    }

    // ── AC4: idempotent -- second run produces no error and no duplicate schema objects ──
    {
      let secondRunError = null;
      try { await migrate(db); } catch (e) { secondRunError = e; }
      ok(secondRunError === null, 'AC4: running the migration a second time does not throw');

      const tableCount = await db.query(`SELECT table_name, count(*) FROM information_schema.tables WHERE table_name IN ('customer_journeys','customer_journey_stages','feature_customer_journey_stage_mappings') GROUP BY table_name`);
      ok(tableCount.rows.every(function(r) { return Number(r.count) === 1; }), 'AC4: exactly one copy of each table exists after two runs');

      const idxDupes = await db.query(`
        SELECT indexname, count(*) FROM pg_indexes
        WHERE tablename IN ('customer_journeys','customer_journey_stages','feature_customer_journey_stage_mappings')
        GROUP BY indexname HAVING count(*) > 1
      `);
      ok(idxDupes.rows.length === 0, 'AC4: no duplicate index names after two runs');
    }

    // ── AC5: named indexes exist ──
    {
      const idxRes = await db.query(`SELECT indexname FROM pg_indexes WHERE tablename IN ('customer_journeys','customer_journey_stages','feature_customer_journey_stage_mappings')`);
      const names = idxRes.rows.map(function(r) { return r.indexname; });
      ['idx_customer_journeys_tenant_id', 'idx_customer_journey_stages_journey_id', 'idx_customer_journey_stages_tenant_id',
        'idx_fjs_mappings_stage_id', 'idx_fjs_mappings_tenant_id'].forEach(function(n) {
        ok(names.indexOf(n) !== -1, 'AC5: index ' + n + ' exists');
      });
    }
  } finally {
    // Leave the real DB clean for whatever else uses this connection. The
    // platform's own journeys/artefacts tables (created by migrateSchema()
    // above to reproduce the collision) are also test-only here and torn
    // down -- a real environment creates them once at boot and keeps them.
    try {
      await db.query('DROP TABLE IF EXISTS feature_customer_journey_stage_mappings CASCADE');
      await db.query('DROP TABLE IF EXISTS customer_journey_stages CASCADE');
      await db.query('DROP TABLE IF EXISTS customer_journeys CASCADE');
      await db.query('DROP TABLE IF EXISTS artefacts CASCADE');
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
