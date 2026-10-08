'use strict';
// check-ep1-s2-journey-stage-create.js -- AC verification for ep1-s2 (add and
// name stages: POST route, inline name entry, and stage card rendering -- see
// artefacts/2026-10-05-customer-journey-as-first-class/). cj-ep1-s2: not to be
// confused with the two other unrelated "ep1-s2" story-slugs already used
// elsewhere in server.js (migratePodsSchema / signals-panel).
const assert = require('assert');

const REAL_CSRF = 'ep1-s2-real-token'; // mirrors jcg-s1's own REAL_CSRF convention

function makeMockRes() {
  return {
    status: function(c) { this._s = c; return this; },
    json: function(b) { this._b = b; },
    writeHead: function(c, headers) { this._s = c; this._headers = headers; },
    end: function(b) { this._b = b; },
    _s: 200, _b: null, _headers: null
  };
}

/**
 * @param {object} opts
 * @param {Array<{id:string,tenant_id:string}>} opts.journeys
 * @param {number} [opts.maxPosition] existing max position for the target journey (undefined = no rows)
 */
function makeMockPool(opts) {
  opts = opts || {};
  var journeys = opts.journeys || [];
  return {
    _ops: [],
    query: async function(sql, params) {
      this._ops.push({ sql, params });
      if (/FROM customer_journeys WHERE id/i.test(sql)) {
        var id = params[0]; var tid = params[1];
        var found = journeys.find(function(j) { return j.id === id && j.tenant_id === tid; });
        return { rows: found ? [{ id: found.id, name: found.name || 'My Journey', description: null }] : [] };
      }
      if (/SELECT COALESCE\(MAX\(position\)/i.test(sql)) {
        return { rows: [{ max_position: opts.maxPosition === undefined ? -1 : opts.maxPosition }] };
      }
      if (/INSERT INTO customer_journey_stages/i.test(sql)) {
        return { rows: [{ id: 'new-stage-id' }] };
      }
      if (/FROM customer_journey_stages WHERE journey_id/i.test(sql)) {
        return { rows: opts.stages || [] };
      }
      return { rows: [] };
    }
  };
}

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { handlePostJourneyStage, handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');

  // AC2 — valid submission inserts customer_journey_stages record, appended at end
  try {
    const pool = makeMockPool({ journeys: [{ id: 'j1', tenant_id: 'org-1' }], maxPosition: 0 });
    const req = { session: { tenantId: 'org-1', csrfToken: REAL_CSRF }, params: { id: 'j1' }, body: { name: 'Discover', _csrf: REAL_CSRF } };
    const res = makeMockRes();
    await handlePostJourneyStage(req, res, null, pool);
    const ins = pool._ops.find(op => /INSERT INTO customer_journey_stages/i.test(op.sql));
    assert(ins, 'No INSERT into customer_journey_stages');
    assert(ins.params.includes('j1'), 'journey_id not in INSERT params');
    assert(ins.params.includes('org-1'), 'tenant_id not in INSERT params');
    assert(ins.params.includes('Discover'), 'name not in INSERT params');
    assert(ins.params.includes(1), `expected position=1 (maxPosition 0 + 1), got params ${JSON.stringify(ins.params)}`);
    assert(res._s === 201, `Expected 201, got ${res._s}`);
    pass('AC2: valid submission inserts customer_journey_stages appended at end (position = max+1)');
  } catch (e) { fail('AC2: valid submission inserts customer_journey_stages appended at end (position = max+1)', e); }

  // AC2 edge case — first stage in an empty journey gets position 0
  try {
    const pool = makeMockPool({ journeys: [{ id: 'j1', tenant_id: 'org-1' }] }); // no maxPosition -> -1 -> position 0
    const req = { session: { tenantId: 'org-1', csrfToken: REAL_CSRF }, params: { id: 'j1' }, body: { name: 'Discover', _csrf: REAL_CSRF } };
    const res = makeMockRes();
    await handlePostJourneyStage(req, res, null, pool);
    const ins = pool._ops.find(op => /INSERT INTO customer_journey_stages/i.test(op.sql));
    assert(ins, 'No INSERT into customer_journey_stages');
    assert(ins.params.includes(0), `expected position=0 for the first stage, got params ${JSON.stringify(ins.params)}`);
    pass('AC2 (edge): first stage in an empty journey gets position 0');
  } catch (e) { fail('AC2 (edge): first stage in an empty journey gets position 0', e); }

  // AC3 — blank name returns 400, no insert
  try {
    const pool = makeMockPool({ journeys: [{ id: 'j1', tenant_id: 'org-1' }], maxPosition: 0 });
    const req = { session: { tenantId: 'org-1', csrfToken: REAL_CSRF }, params: { id: 'j1' }, body: { name: '', _csrf: REAL_CSRF } };
    const res = makeMockRes();
    await handlePostJourneyStage(req, res, null, pool);
    assert(res._s === 400, `Expected 400, got ${res._s}`);
    const ins = pool._ops.find(op => /INSERT INTO customer_journey_stages/i.test(op.sql));
    assert(!ins, 'INSERT should not have been called for a blank name');
    pass('AC3: blank name returns 400 and does not insert');
  } catch (e) { fail('AC3: blank name returns 400 and does not insert', e); }

  // AC4 — saved stage renders with name and "Edit stage" affordance
  try {
    const pool = makeMockPool({
      journeys: [{ id: 'j1', tenant_id: 'org-1' }],
      stages: [{ id: 's1', name: 'Discover', position: 0 }]
    });
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    assert(res._s === 200, `Expected 200, got ${res._s}`);
    assert(res._b && res._b.bodyContent.includes('Discover'), 'stage name not in rendered content');
    assert(res._b && res._b.bodyContent.includes('Edit stage'), '"Edit stage" affordance not in rendered content');
    pass('AC4: saved stage renders with its name and the "Edit stage" affordance');
  } catch (e) { fail('AC4: saved stage renders with its name and the "Edit stage" affordance', e); }

  // (security) CSRF — no or mismatched token is rejected
  try {
    const pool = makeMockPool({ journeys: [{ id: 'j1', tenant_id: 'org-1' }], maxPosition: 0 });
    const req = { session: { tenantId: 'org-1', csrfToken: REAL_CSRF }, params: { id: 'j1' }, body: { name: 'Discover' } }; // no _csrf
    const res = makeMockRes();
    await handlePostJourneyStage(req, res, null, pool);
    assert(res._s === 403, `Expected 403, got ${res._s}`);
    const ins = pool._ops.find(op => /INSERT INTO customer_journey_stages/i.test(op.sql));
    assert(!ins, 'INSERT should not have been called when _csrf is missing');
    pass('(security) no _csrf field returns 403 and does not insert');
  } catch (e) { fail('(security) no _csrf field returns 403 and does not insert', e); }

  try {
    const pool = makeMockPool({ journeys: [{ id: 'j1', tenant_id: 'org-1' }], maxPosition: 0 });
    const req = { session: { tenantId: 'org-1', csrfToken: REAL_CSRF }, params: { id: 'j1' }, body: { name: 'Discover', _csrf: 'wrong-token' } };
    const res = makeMockRes();
    await handlePostJourneyStage(req, res, null, pool);
    assert(res._s === 403, `Expected 403, got ${res._s}`);
    const ins = pool._ops.find(op => /INSERT INTO customer_journey_stages/i.test(op.sql));
    assert(!ins, 'INSERT should not have been called when _csrf does not match');
    pass('(security) mismatched _csrf field returns 403 and does not insert');
  } catch (e) { fail('(security) mismatched _csrf field returns 403 and does not insert', e); }

  // (security) cross-tenant journey id is rejected as not found
  try {
    const pool = makeMockPool({ journeys: [{ id: 'j1', tenant_id: 'org-OTHER' }], maxPosition: 0 });
    const req = { session: { tenantId: 'org-1', csrfToken: REAL_CSRF }, params: { id: 'j1' }, body: { name: 'Discover', _csrf: REAL_CSRF } };
    const res = makeMockRes();
    await handlePostJourneyStage(req, res, null, pool);
    assert(res._s === 404, `Expected 404, got ${res._s}`);
    const ins = pool._ops.find(op => /INSERT INTO customer_journey_stages/i.test(op.sql));
    assert(!ins, 'INSERT should not have been called for a cross-tenant journey id');
    pass('(security) cross-tenant journey id returns 404 and does not insert');
  } catch (e) { fail('(security) cross-tenant journey id returns 404 and does not insert', e); }

  console.log(`\n[ep1-s2-journey-stage-create] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
