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

  // -- regression: the position route must deny a viewer-role session, like
  // every other mutating route in this file -------------------------------
  // Found during Task 2's own independent verification (not an AC/NFR this
  // story names explicitly): the route was wired without requireNonViewer,
  // unlike the immediately-adjacent stages-order PATCH route it was modeled
  // on and ~58 other mutating routes in server.js. Tests the REAL wiring via
  // a real server.js dispatch (requireNonViewer lives in server.js's route
  // chain, not inside handlePatchJourneyStagePosition itself, so a handler-
  // level unit test cannot observe this) -- reuses
  // check-vrne-s4-edge-case-gate.js's own already-proven real-dispatch
  // harness verbatim (same env setup, same /test/seed-multi-user-roles seed,
  // same session shape) rather than reinventing it.
  try {
    process.env.NODE_ENV             = 'test';
    process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
    process.env.GITHUB_CLIENT_ID     = 'test-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-secret';
    process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
    delete process.env.POSTHOG_KEY;
    delete process.env.DATABASE_URL;

    const router = require('../src/web-ui/server').router;
    const seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;
    const EventEmitter = require('events').EventEmitter;

    function integrationMockRes() {
      var _statusCode = null;
      var _headers = {};
      var _chunks = [];
      return {
        writeHead: function(code, headers) { _statusCode = code; Object.assign(_headers, headers || {}); return this; },
        setHeader: function(k, v) { _headers[k] = v; },
        end: function(body) { if (body != null) _chunks.push(body); },
        _get: function() { return { statusCode: _statusCode, headers: _headers, body: _chunks.join('') }; }
      };
    }
    function dispatchAndAwaitResponse(req) {
      return new Promise(function(resolve, reject) {
        var res = integrationMockRes();
        var settled = false;
        var origEnd = res.end;
        res.end = function(body) {
          origEnd(body);
          if (!settled) { settled = true; resolve(res._get()); }
        };
        router(req, res).catch(function(err) {
          if (!settled) { settled = true; reject(err); }
        });
      });
    }
    function seedMultiUserRolesForIntegrationTest(sharedOrg) {
      return new Promise(function(resolve, reject) {
        var req = new EventEmitter();
        req.method = 'POST';
        req.url = '/test/seed-multi-user-roles';
        req.headers = { 'content-type': 'application/json' };
        var res = integrationMockRes();
        var origEnd = res.end;
        res.end = function(body) {
          origEnd(body);
          var result = res._get();
          if (result.statusCode !== 200) {
            reject(new Error('seed-multi-user-roles failed: ' + result.statusCode + ' ' + result.body));
          } else {
            resolve(result);
          }
        };
        router(req, res).then(function() {
          req.emit('data', JSON.stringify({ sharedOrg: sharedOrg }));
          req.emit('end');
        }).catch(reject);
      });
    }

    const sharedOrg = 'e2e-ic-s2-integration';
    await seedMultiUserRolesForIntegrationTest(sharedOrg);

    // _parseSessionId only captures [a-f0-9]+ from the cookie header -- must
    // be a valid hex string, distinct from check-vrne-s4-edge-case-gate.js's
    // own 'faceb00c04' so the two tests' in-memory sessions never collide.
    const sessionId = 'faceb00c05';
    seedTestSession(sessionId, {
      accessToken: 'e2e-test-access-token',
      userId: 9002,
      login: 'e2e-viewer',
      tenantId: sharedOrg
    });
    const cookieHeader = { cookie: 'session_id=' + sessionId };

    const req = {
      headers: Object.assign({ 'content-type': 'application/json' }, cookieHeader),
      method: 'PATCH',
      url: '/journeys/j1/stages/s1/position'
    };
    const result = await dispatchAndAwaitResponse(req);
    assert.strictEqual(result.statusCode, 403, 'PATCH /journeys/:id/stages/:stageId/position must return 403 for a viewer-role session, got ' + result.statusCode + ' -- ' + result.body);
    pass('regression: position route denies a viewer-role session via real server.js dispatch, matching every other mutating route');
  } catch (e) { fail('regression: position route denies a viewer-role session via real server.js dispatch, matching every other mutating route', e); }

  function stageRow(id, name, position, extra) {
    return Object.assign({ id: id, name: name, position: position, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false, position_x: null, position_y: null }, extra || {});
  }
  function makeCanvasMockPool(journeyRow, stageRows) {
    return {
      query: function(sql, params) {
        var s = String(sql).trim();
        if (/^SELECT id, name, description FROM customer_journeys/.test(s)) {
          var match = journeyRow && journeyRow.id === params[0];
          return Promise.resolve({ rows: match ? [journeyRow] : [] });
        }
        if (/^SELECT id, name, position, description/.test(s)) {
          return Promise.resolve({ rows: stageRows });
        }
        return Promise.resolve({ rows: [] });
      }
    };
  }
  function makeCanvasMockRes() {
    return { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
  }

  // -- AC2: NULL position falls back to ic-s1's own auto-layout formula ----
  try {
    const { handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      stageRow('s1', 'Discover', 0), // position_x/position_y both NULL (default above)
      stageRow('s2', 'Evaluate', 1, { position_x: 500, position_y: 300 }) // has a stored position
    ]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeCanvasMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    const s1Call = html.match(/addNode\("s1", 1, 1, ([\d.]+), ([\d.]+),/);
    const s2Call = html.match(/addNode\("s2", 1, 1, ([\d.]+), ([\d.]+),/);
    assert.ok(s1Call, 'expected an addNode call for s1');
    assert.strictEqual(Number(s1Call[1]), 0, 'expected s1 (NULL position, idx=0) to use the auto-layout x formula (idx*220=0)');
    assert.strictEqual(Number(s1Call[2]), 120, 'expected s1 (NULL position) to use the auto-layout y (120)');
    assert.ok(s2Call, 'expected an addNode call for s2');
    assert.strictEqual(Number(s2Call[1]), 500, 'expected s2 (stored position_x=500) to use its OWN stored x, not the auto-layout formula (idx*220=220)');
    assert.strictEqual(Number(s2Call[2]), 300, 'expected s2 (stored position_y=300) to use its own stored y, not the auto-layout 120');
    pass('AC2: a stage with NULL position falls back to ic-s1\'s auto-layout; a stage with a stored position uses it');
  } catch (e) { fail('AC2: a stage with NULL position falls back to ic-s1\'s auto-layout; a stage with a stored position uses it', e); }

  // -- AC6: a failed position-save shows a visible error toast -------------
  try {
    const { handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [stageRow('s1', 'Discover', 0)]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeCanvasMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(/editor\.on\(["']nodeMoved["']/.test(html), 'expected an editor.on("nodeMoved", ...) listener to be registered');
    assert.ok(/getNodeFromId/.test(html), 'expected the nodeMoved handler to read the node\'s final position via editor.getNodeFromId');
    assert.ok(/\/stages\/["']?\s*\+?\s*\w*\s*\+?\s*["']?\/position/.test(html) || /\/position["']/.test(html), 'expected a PATCH to a .../position URL');
    assert.ok(/reorderError/.test(html), 'expected the save-failure handler to reuse the existing #sw-stage-reorder-error element, not a new one');
    assert.ok(/position not saved/i.test(html), 'expected a position-save-specific failure message, adapted from ep1-s4\'s own "Stage order not saved" convention');
    pass('AC6: nodeMoved handler reads the real position, PATCHes it, and reuses the existing failure-toast element on rejection');
  } catch (e) { fail('AC6: nodeMoved handler reads the real position, PATCHes it, and reuses the existing failure-toast element on rejection', e); }

  console.log(`\n[ic-s2-position-persistence] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
