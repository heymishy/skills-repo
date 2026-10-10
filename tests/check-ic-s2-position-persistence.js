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

  // -- AC3: cross-tenant stage id -> 404, zero mutation ---------------------
  try {
    const calls = [];
    const pool = {
      query: function(sql, params) {
        calls.push({ sql: String(sql).trim(), params: params });
        var s = String(sql).trim();
        if (/^SELECT cjs\.id FROM customer_journey_stages/.test(s)) {
          return Promise.resolve({ rows: [] }); // cross-tenant: never matches
        }
        return Promise.resolve({ rows: [] });
      }
    };
    const { handlePatchJourneyStagePosition } = require('../src/web-ui/routes/journeys');
    // Deviation from the plan's literal mock (noted in final report): the
    // handler calls _csrf.csrfGuard first, which 403s (and calls
    // res.writeHead, absent from this status/json-shaped mock) unless
    // session.csrfToken matches body._csrf -- same established convention
    // already documented in check-ep2-s3-delivery-view.js's own
    // makeDeleteReqRes for handleDeleteFeatureMapping.
    const AC3_CSRF = 'ic-s2-ac3-csrf-token';
    const req = { session: { tenantId: 'org-1', csrfToken: AC3_CSRF }, params: { id: 'j1', stageId: 's-other-tenant' }, body: { x: 10, y: 20, _csrf: AC3_CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handlePatchJourneyStagePosition(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404, not 403, for a cross-tenant stage id');
    const updateCalls = calls.filter(function(c) { return /^UPDATE/.test(c.sql); });
    assert.strictEqual(updateCalls.length, 0, 'expected zero UPDATE calls against the mock pool');
    pass('AC3: cross-tenant stage id returns 404 (not 403) and makes no UPDATE call');
  } catch (e) { fail('AC3: cross-tenant stage id returns 404 (not 403) and makes no UPDATE call', e); }

  // -- AC5: updating stage A's position leaves stage B's completely untouched --
  try {
    const updateCalls = [];
    const pool = {
      query: function(sql, params) {
        var s = String(sql).trim();
        if (/^SELECT cjs\.id FROM customer_journey_stages/.test(s)) {
          return Promise.resolve({ rows: [{ id: 'sA' }] }); // sA belongs to this journey/tenant
        }
        if (/^UPDATE customer_journey_stages/.test(s)) {
          updateCalls.push(params);
          return Promise.resolve({ rowCount: 1 });
        }
        return Promise.resolve({ rows: [] });
      }
    };
    const { handlePatchJourneyStagePosition } = require('../src/web-ui/routes/journeys');
    // Same CSRF-mock deviation as the AC3 block above.
    const AC5_CSRF = 'ic-s2-ac5-csrf-token';
    const req = { session: { tenantId: 'org-1', csrfToken: AC5_CSRF }, params: { id: 'j1', stageId: 'sA' }, body: { x: 42, y: 99, _csrf: AC5_CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handlePatchJourneyStagePosition(req, res, null, pool);
    assert.strictEqual(res._s, 200, 'expected 200 for a valid same-tenant stage id');
    assert.strictEqual(updateCalls.length, 1, 'expected exactly one UPDATE call');
    assert.ok(updateCalls[0].indexOf('sA') !== -1, 'expected the UPDATE to target stage sA only');
    assert.ok(updateCalls[0].indexOf('sB') === -1, 'expected stage sB\'s id to never appear in the UPDATE params -- it must be completely untouched by updating a different stage');
    pass('AC5: updating stage A\'s position makes exactly one UPDATE, targeting only stage A');
  } catch (e) { fail('AC5: updating stage A\'s position makes exactly one UPDATE, targeting only stage A', e); }

  console.log(`\n[ic-s2-position-persistence] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
