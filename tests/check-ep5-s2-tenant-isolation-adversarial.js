'use strict';
// check-ep5-s2-tenant-isolation-adversarial.js -- TDD tests for ep5-s2 (Epic 5,
// customer-journey feature). Story: artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s2.md
// Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep5-s2-test-plan.md
//
// Self-contained by design (per this repo's own test-file convention) --
// does NOT import mock-pool helpers from any other check-*.js file. Each
// of the 6 handlers under test has a distinct SQL query shape; each mock
// pool below matches that handler's own real query text exactly (confirmed
// by reading src/web-ui/routes/journeys.js directly during planning).
const assert = require('assert');

const REAL_CSRF = 'ep5-s2-real-token';

function makeMockRes() {
  return {
    status: function(c) { this._s = c; return this; },
    json: function(b) { this._b = b; },
    writeHead: function(c, headers) { this._s = c; this._headers = headers; },
    end: function(b) { this._b = b; },
    _s: 200, _b: null, _headers: null
  };
}

// Normalizes a template-literal SQL string's internal whitespace/newlines
// to single spaces so the match regexes below don't have to mirror the
// handler's own indentation exactly.
function norm(sql) { return String(sql).replace(/\s+/g, ' ').trim(); }

let passed = 0; let failed = 0;
const results = {}; // AC id -> true/false, read by the AC7 aggregate check below
function pass(name, acId) { console.log(`  [PASS] ${name}`); passed++; if (acId) results[acId] = true; }
function fail(name, err, acId) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; if (acId) results[acId] = false; }

(async function() {
  const {
    handleGetJourneyCanvas,
    handlePostJourneyStage,
    handlePatchJourneyStage,
    handlePatchJourneyStagesOrder,
    handlePostFeatureMapping,
    handleDeleteFeatureMapping
  } = require('../src/web-ui/routes/journeys');

  // ── AC1: GET /journeys/:id with a cross-tenant journey id ────────────
  try {
    const journeyRow = { id: 'j-victim', name: 'Victim Journey', description: 'tenant-B secret', tenant_id: 'tenant-B' };
    const pool = {
      query: function(sql, params) {
        const s = norm(sql);
        if (/^SELECT id, name, description FROM customer_journeys WHERE id = \$1 AND tenant_id = \$2$/.test(s)) {
          const match = journeyRow.id === params[0] && journeyRow.tenant_id === params[1];
          return Promise.resolve({ rows: match ? [journeyRow] : [] });
        }
        throw new Error('unexpected query in AC1 mock: ' + s);
      }
    };
    const req = { session: { tenantId: 'tenant-A' }, params: { id: 'j-victim' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404');
    const bodyText = JSON.stringify(res._b || '');
    assert.ok(bodyText.indexOf('Victim Journey') === -1, 'expected no journey name in response body');
    assert.ok(bodyText.indexOf('tenant-B secret') === -1, 'expected no journey description in response body');
    pass('AC1: GET /journeys/:id with a cross-tenant journey id returns 404 with no journey data', 'AC1');
  } catch (e) { fail('AC1: GET /journeys/:id with a cross-tenant journey id returns 404 with no journey data', e, 'AC1'); }

  // ── AC2: POST /journeys/:id/stages with a cross-tenant journey id ────
  try {
    const journeyRow = { id: 'j-victim', tenant_id: 'tenant-B' };
    const insertCalls = [];
    const pool = {
      query: function(sql, params) {
        const s = norm(sql);
        if (/^SELECT id FROM customer_journeys WHERE id = \$1 AND tenant_id = \$2$/.test(s)) {
          const match = journeyRow.id === params[0] && journeyRow.tenant_id === params[1];
          return Promise.resolve({ rows: match ? [{ id: journeyRow.id }] : [] });
        }
        if (/^INSERT INTO customer_journey_stages/.test(s)) {
          insertCalls.push({ sql: s, params: params });
          return Promise.resolve({ rows: [{ id: 'new-stage' }] });
        }
        if (/^SELECT COALESCE\(MAX\(position\)/.test(s)) {
          return Promise.resolve({ rows: [{ max_position: -1 }] });
        }
        throw new Error('unexpected query in AC2 mock: ' + s);
      }
    };
    const req = {
      session: { tenantId: 'tenant-A', csrfToken: REAL_CSRF },
      params: { id: 'j-victim' },
      body: { name: 'Injected stage', _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePostJourneyStage(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404');
    assert.strictEqual(insertCalls.length, 0, 'expected zero INSERT calls');
    pass('AC2: POST /journeys/:id/stages with a cross-tenant journey id returns 404 and creates no stage', 'AC2');
  } catch (e) { fail('AC2: POST /journeys/:id/stages with a cross-tenant journey id returns 404 and creates no stage', e, 'AC2'); }

  // ── AC3: PATCH /journeys/:id/stages/:stageId with a stage from a different journey ──
  try {
    // Attacker owns journey j-attacker (tenant-A) and passes it as :id
    // (so the journey-ownership check passes), but supplies :stageId
    // belonging to a DIFFERENT journey (j-victim). The stage lookup is
    // scoped by journey_id, so it must not match.
    const attackerJourney = { id: 'j-attacker', tenant_id: 'tenant-A' };
    const victimStage = { id: 's-victim', journey_id: 'j-victim' };
    const updateCalls = [];
    const pool = {
      query: function(sql, params) {
        const s = norm(sql);
        if (/^SELECT id FROM customer_journeys WHERE id = \$1 AND tenant_id = \$2$/.test(s)) {
          const match = attackerJourney.id === params[0] && attackerJourney.tenant_id === params[1];
          return Promise.resolve({ rows: match ? [{ id: attackerJourney.id }] : [] });
        }
        if (/^SELECT id FROM customer_journey_stages WHERE id = \$1 AND journey_id = \$2$/.test(s)) {
          const match = victimStage.id === params[0] && victimStage.journey_id === params[1];
          return Promise.resolve({ rows: match ? [{ id: victimStage.id }] : [] });
        }
        if (/^UPDATE customer_journey_stages SET/.test(s)) {
          updateCalls.push({ sql: s, params: params });
          return Promise.resolve({ rows: [] });
        }
        throw new Error('unexpected query in AC3 mock: ' + s);
      }
    };
    const req = {
      session: { tenantId: 'tenant-A', csrfToken: REAL_CSRF },
      params: { id: 'j-attacker', stageId: 's-victim' },
      body: { field: 'name', value: 'Hacked', _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePatchJourneyStage(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404');
    assert.strictEqual(updateCalls.length, 0, 'expected zero UPDATE calls');
    pass('AC3: PATCH .../stages/:stageId with a stage id from a different journey/tenant returns 404 and modifies nothing', 'AC3');
  } catch (e) { fail('AC3: PATCH .../stages/:stageId with a stage id from a different journey/tenant returns 404 and modifies nothing', e, 'AC3'); }

  // ── AC4: PATCH /journeys/:id/stages-order with a cross-tenant journey id ──
  try {
    const journeyRow = { id: 'j-victim', tenant_id: 'tenant-B' };
    let connectCalls = 0;
    const pool = {
      query: function(sql, params) {
        const s = norm(sql);
        if (/^SELECT id FROM customer_journeys WHERE id = \$1 AND tenant_id = \$2$/.test(s)) {
          const match = journeyRow.id === params[0] && journeyRow.tenant_id === params[1];
          return Promise.resolve({ rows: match ? [{ id: journeyRow.id }] : [] });
        }
        throw new Error('unexpected query in AC4 mock: ' + s);
      },
      connect: function() {
        connectCalls++;
        return Promise.resolve({ query: function() { return Promise.resolve({ rows: [] }); }, release: function() {} });
      }
    };
    const req = {
      session: { tenantId: 'tenant-A', csrfToken: REAL_CSRF },
      params: { id: 'j-victim' },
      body: { stageIds: ['s1', 's2'], _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePatchJourneyStagesOrder(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404');
    assert.strictEqual(connectCalls, 0, 'expected zero pool.connect() calls -- rejected before any transaction opens');
    pass('AC4: PATCH .../stages-order with a cross-tenant journey id returns 404 and modifies no positions', 'AC4');
  } catch (e) { fail('AC4: PATCH .../stages-order with a cross-tenant journey id returns 404 and modifies no positions', e, 'AC4'); }

  // ── AC5: POST .../feature-mappings with a cross-tenant stage id ──────
  try {
    let connectCalls = 0;
    const pool = {
      query: function(sql, params) {
        const s = norm(sql);
        if (/^SELECT cjs\.id FROM customer_journey_stages cjs JOIN customer_journeys cj ON cjs\.journey_id = cj\.id WHERE cjs\.id = \$1 AND cjs\.journey_id = \$2 AND cj\.tenant_id = \$3$/.test(s)) {
          return Promise.resolve({ rows: [] }); // cross-tenant: never matches
        }
        throw new Error('unexpected query in AC5 mock: ' + s);
      },
      connect: function() {
        connectCalls++;
        return Promise.resolve({ query: function() { return Promise.resolve({ rows: [] }); }, release: function() {} });
      }
    };
    const req = {
      session: { tenantId: 'tenant-A', csrfToken: REAL_CSRF },
      params: { id: 'j-victim', stageId: 's-victim' },
      body: { featureSlug: 'injected-feature', metricKeys: [], _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePostFeatureMapping(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404');
    assert.strictEqual(connectCalls, 0, 'expected zero pool.connect() calls -- rejected before any transaction opens, so zero INSERT/UPDATE is implied');
    pass('AC5: POST .../feature-mappings with a cross-tenant stage id returns 404 and creates no mapping', 'AC5');
  } catch (e) { fail('AC5: POST .../feature-mappings with a cross-tenant stage id returns 404 and creates no mapping', e, 'AC5'); }

  // ── AC6: DELETE .../feature-mappings/:mappingId with a cross-tenant stage id ──
  try {
    const deleteCalls = [];
    const pool = {
      query: function(sql, params) {
        const s = norm(sql);
        if (/^SELECT cjs\.id FROM customer_journey_stages cjs JOIN customer_journeys cj ON cjs\.journey_id = cj\.id WHERE cjs\.id = \$1 AND cjs\.journey_id = \$2 AND cj\.tenant_id = \$3$/.test(s)) {
          return Promise.resolve({ rows: [] }); // cross-tenant: never matches
        }
        if (/^DELETE FROM feature_customer_journey_stage_mappings/.test(s)) {
          deleteCalls.push({ sql: s, params: params });
          return Promise.resolve({ rows: [] });
        }
        throw new Error('unexpected query in AC6 mock: ' + s);
      }
    };
    const req = {
      session: { tenantId: 'tenant-A', csrfToken: REAL_CSRF },
      params: { id: 'j-victim', stageId: 's-victim', mappingId: 'm-victim' },
      body: { _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handleDeleteFeatureMapping(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404');
    assert.strictEqual(deleteCalls.length, 0, 'expected zero DELETE calls');
    pass('AC6: DELETE .../feature-mappings/:mappingId with a cross-tenant stage id returns 404 and deletes nothing', 'AC6');
  } catch (e) { fail('AC6: DELETE .../feature-mappings/:mappingId with a cross-tenant stage id returns 404 and deletes nothing', e, 'AC6'); }

  // ── AC7: aggregate zero-leaks summary ─────────────────────────────────
  try {
    const checked = ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6'];
    const allPassed = checked.every(function(id) { return results[id] === true; });
    assert.ok(allPassed, 'expected all 6 individual adversarial tests to have passed: ' + JSON.stringify(results));
    console.log('  0 cross-tenant leaks found across all 6 journey/stage/mapping routes');
    pass('AC7: all 6 routes confirmed to enforce tenant isolation -- zero cross-tenant leaks found', 'AC7');
  } catch (e) { fail('AC7: all 6 routes confirmed to enforce tenant isolation -- zero cross-tenant leaks found', e, 'AC7'); }

  console.log(`\n[ep5-s2-tenant-isolation-adversarial] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
