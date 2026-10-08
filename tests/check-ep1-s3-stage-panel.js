'use strict';
// check-ep1-s3-stage-panel.js -- AC verification for ep1-s3 (stage side
// panel: edit all optional attributes -- see
// artefacts/2026-10-05-customer-journey-as-first-class/). cj-ep1-s3: not to
// be confused with any other unrelated "ep1-s3" story-slug reused elsewhere
// in this repo's history.
const assert = require('assert');

const REAL_CSRF = 'ep1-s3-real-token'; // mirrors jcg-s1/ep1-s2's own REAL_CSRF convention

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
 * @param {Array<{id:string,journey_id:string}>} opts.stages
 * @param {Array<object>} [opts.canvasStages] full-row stage data for handleGetJourneyCanvas's own render
 */
function makeMockPool(opts) {
  opts = opts || {};
  var journeys = opts.journeys || [];
  var stages = opts.stages || [];
  return {
    _ops: [],
    query: async function(sql, params) {
      this._ops.push({ sql, params });
      if (/FROM customer_journeys WHERE id/i.test(sql)) {
        var jid = params[0]; var tid = params[1];
        var foundJourney = journeys.find(function(j) { return j.id === jid && j.tenant_id === tid; });
        return { rows: foundJourney ? [{ id: foundJourney.id, name: foundJourney.name || 'My Journey', description: null }] : [] };
      }
      if (/SELECT id FROM customer_journey_stages WHERE id = \$1 AND journey_id/i.test(sql)) {
        var sid = params[0]; var sjid = params[1];
        var foundStage = stages.find(function(s) { return s.id === sid && s.journey_id === sjid; });
        return { rows: foundStage ? [{ id: foundStage.id }] : [] };
      }
      if (/UPDATE customer_journey_stages SET/i.test(sql)) {
        return { rows: [] };
      }
      if (/FROM customer_journey_stages WHERE journey_id/i.test(sql)) {
        return { rows: opts.canvasStages || [] };
      }
      return { rows: [] };
    }
  };
}

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { handlePatchJourneyStage, handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');

  // AC1 (markup) -- side panel contains all 8 fields with correct types/options
  try {
    const pool = makeMockPool({
      journeys: [{ id: 'j1', tenant_id: 'org-1' }],
      canvasStages: [{ id: 's1', name: 'Discover', position: 0, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false }]
    });
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    assert(html.includes('data-field="description"'), 'description field missing');
    assert(html.includes('data-field="customer_actions"'), 'customer_actions field missing');
    assert(html.includes('data-field="touchpoints"'), 'touchpoints field missing');
    assert(html.includes('data-field="channel"'), 'channel field missing');
    assert(html.includes('data-field="emotion"'), 'emotion field missing');
    assert(html.includes('data-field="pain_points"'), 'pain_points field missing');
    assert(html.includes('data-field="opportunities"'), 'opportunities field missing');
    assert(html.includes('data-field="moment_of_truth"'), 'moment_of_truth field missing');
    ['web', 'mobile', 'in-person', 'phone', 'email', 'other'].forEach(function(v) {
      assert(html.includes('value="' + v + '"'), 'channel option ' + v + ' missing');
    });
    ['positive', 'neutral', 'negative', 'mixed'].forEach(function(v) {
      assert(html.includes('value="' + v + '"'), 'emotion option ' + v + ' missing');
    });
    pass('AC1 (markup): side panel contains all 8 fields with the correct channel/emotion options');
  } catch (e) { fail('AC1 (markup): side panel contains all 8 fields with the correct channel/emotion options', e); }

  // AC2 -- valid field edit PATCHes the scoped record
  try {
    const pool = makeMockPool({
      journeys: [{ id: 'j1', tenant_id: 'org-1' }],
      stages: [{ id: 's1', journey_id: 'j1' }]
    });
    const req = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1', stageId: 's1' },
      body: { field: 'description', value: 'Updated description', _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePatchJourneyStage(req, res, null, pool);
    const upd = pool._ops.find(op => /UPDATE customer_journey_stages SET description/i.test(op.sql));
    assert(upd, 'No UPDATE of the description column');
    assert(upd.params.includes('Updated description'), 'new value not in UPDATE params');
    assert(upd.params.includes('s1'), 'stage id not in UPDATE params');
    assert(upd.params.includes('j1'), 'journey id not in UPDATE params');
    assert(upd.params.includes('org-1'), 'tenant id not in UPDATE params');
    assert(res._s === 200, `Expected 200, got ${res._s}`);
    pass('AC2: valid field edit PATCHes the record, scoped to tenant/journey/stage');
  } catch (e) { fail('AC2: valid field edit PATCHes the record, scoped to tenant/journey/stage', e); }

  // AC2 (security) -- disallowed field name is rejected
  try {
    const pool = makeMockPool({
      journeys: [{ id: 'j1', tenant_id: 'org-1' }],
      stages: [{ id: 's1', journey_id: 'j1' }]
    });
    const req = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1', stageId: 's1' },
      body: { field: 'tenant_id', value: 'org-evil', _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePatchJourneyStage(req, res, null, pool);
    assert(res._s === 400, `Expected 400, got ${res._s}`);
    const upd = pool._ops.find(op => /UPDATE customer_journey_stages SET/i.test(op.sql));
    assert(!upd, 'UPDATE should not have been called for a disallowed field');
    pass('AC2 (security): disallowed field name returns 400 and does not update');
  } catch (e) { fail('AC2 (security): disallowed field name returns 400 and does not update', e); }

  // AC2 (security) -- invalid channel enum value is rejected
  try {
    const pool = makeMockPool({
      journeys: [{ id: 'j1', tenant_id: 'org-1' }],
      stages: [{ id: 's1', journey_id: 'j1' }]
    });
    const req = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1', stageId: 's1' },
      body: { field: 'channel', value: 'carrier-pigeon', _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePatchJourneyStage(req, res, null, pool);
    assert(res._s === 400, `Expected 400, got ${res._s}`);
    const upd = pool._ops.find(op => /UPDATE customer_journey_stages SET/i.test(op.sql));
    assert(!upd, 'UPDATE should not have been called for an invalid channel value');
    pass('AC2 (security): invalid channel enum value returns 400 and does not update');
  } catch (e) { fail('AC2 (security): invalid channel enum value returns 400 and does not update', e); }

  // AC3 -- toggling moment_of_truth updates the DB value
  try {
    const pool = makeMockPool({
      journeys: [{ id: 'j1', tenant_id: 'org-1' }],
      stages: [{ id: 's1', journey_id: 'j1' }]
    });
    const req = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1', stageId: 's1' },
      body: { field: 'moment_of_truth', value: true, _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePatchJourneyStage(req, res, null, pool);
    const upd = pool._ops.find(op => /UPDATE customer_journey_stages SET moment_of_truth/i.test(op.sql));
    assert(upd, 'No UPDATE of the moment_of_truth column');
    assert(upd.params.includes(true), 'true value not in UPDATE params');
    pass('AC3: toggling moment_of_truth updates the DB value');
  } catch (e) { fail('AC3: toggling moment_of_truth updates the DB value', e); }

  // AC3 (render) -- canvas shows the moment-of-truth indicator for a true row
  try {
    const pool = makeMockPool({
      journeys: [{ id: 'j1', tenant_id: 'org-1' }],
      canvasStages: [{ id: 's1', name: 'Discover', position: 0, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: true }]
    });
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    assert(res._b.bodyContent.includes('sw-stage-moment-badge'), 'moment-of-truth indicator not rendered for a true row');
    assert(res._b.bodyContent.includes('Moment of truth'), 'moment-of-truth label text not rendered');
    pass('AC3 (render): canvas shows the moment-of-truth indicator for a true row');
  } catch (e) { fail('AC3 (render): canvas shows the moment-of-truth indicator for a true row', e); }

  // (security) CSRF -- no or mismatched token is rejected
  try {
    const pool = makeMockPool({
      journeys: [{ id: 'j1', tenant_id: 'org-1' }],
      stages: [{ id: 's1', journey_id: 'j1' }]
    });
    const req = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1', stageId: 's1' },
      body: { field: 'description', value: 'x' } // no _csrf
    };
    const res = makeMockRes();
    await handlePatchJourneyStage(req, res, null, pool);
    assert(res._s === 403, `Expected 403, got ${res._s}`);
    const upd = pool._ops.find(op => /UPDATE customer_journey_stages SET/i.test(op.sql));
    assert(!upd, 'UPDATE should not have been called when _csrf is missing');
    pass('(security) no _csrf field returns 403 and does not update');
  } catch (e) { fail('(security) no _csrf field returns 403 and does not update', e); }

  // (security) cross-tenant journey id is rejected
  try {
    const pool = makeMockPool({
      journeys: [{ id: 'j1', tenant_id: 'org-OTHER' }],
      stages: [{ id: 's1', journey_id: 'j1' }]
    });
    const req = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1', stageId: 's1' },
      body: { field: 'description', value: 'x', _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePatchJourneyStage(req, res, null, pool);
    assert(res._s === 404, `Expected 404, got ${res._s}`);
    const upd = pool._ops.find(op => /UPDATE customer_journey_stages SET/i.test(op.sql));
    assert(!upd, 'UPDATE should not have been called for a cross-tenant journey id');
    pass('(security) cross-tenant journey id returns 404 and does not update');
  } catch (e) { fail('(security) cross-tenant journey id returns 404 and does not update', e); }

  // (security) stage not belonging to the given journey is rejected
  try {
    const pool = makeMockPool({
      journeys: [{ id: 'j1', tenant_id: 'org-1' }],
      stages: [{ id: 's1', journey_id: 'DIFFERENT-JOURNEY' }]
    });
    const req = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1', stageId: 's1' },
      body: { field: 'description', value: 'x', _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePatchJourneyStage(req, res, null, pool);
    assert(res._s === 404, `Expected 404, got ${res._s}`);
    const upd = pool._ops.find(op => /UPDATE customer_journey_stages SET/i.test(op.sql));
    assert(!upd, 'UPDATE should not have been called for a stage belonging to a different journey');
    pass('(security) stage id not belonging to the given journey returns 404 and does not update');
  } catch (e) { fail('(security) stage id not belonging to the given journey returns 404 and does not update', e); }

  console.log(`\n[ep1-s3-stage-panel] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
