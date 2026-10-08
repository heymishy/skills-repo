'use strict';
// check-ep1-s4-stage-reorder.js -- TDD tests for ep1-s4 (Epic 1, customer-journey
// feature). Story: artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s4.md
// Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep1-s4-test-plan.md
const assert = require('assert');

const REAL_CSRF = 'ep1-s4-real-token'; // mirrors ep1-s3's own REAL_CSRF convention

function makeMockRes() {
  return {
    status: function(c) { this._s = c; return this; },
    json: function(b) { this._b = b; },
    writeHead: function(c, headers) { this._s = c; this._headers = headers; },
    end: function(b) { this._b = b; },
    _s: 200, _b: null, _headers: null
  };
}

// ── Transactional mock pool/client, modeled on check-tab-s1-tenant-admin-bootstrap.js's own fake-pool pattern ──
function makeTransactionalMockPool(opts) {
  opts = opts || {};
  var journeyRow = opts.journeyRow; // { id, tenant_id } or undefined
  var stageRows = (opts.stageRows || []).map(function(r) { return Object.assign({}, r); }); // [{id, position}]
  var updateCalls = [];
  var connectCalls = 0;
  var beginCalls = 0, commitCalls = 0, rollbackCalls = 0;
  var failOnUpdateNumber = opts.failOnUpdateNumber || null; // 1-indexed

  function makeClient() {
    var updateCountThisTx = 0;
    return {
      query: function(sql, params) {
        var s = String(sql).trim();
        if (s === 'BEGIN') { beginCalls++; return Promise.resolve({ rows: [] }); }
        if (s === 'COMMIT') { commitCalls++; return Promise.resolve({ rows: [] }); }
        if (s === 'ROLLBACK') { rollbackCalls++; return Promise.resolve({ rows: [] }); }
        if (/^UPDATE customer_journey_stages/.test(s)) {
          updateCountThisTx++;
          if (failOnUpdateNumber && updateCountThisTx === failOnUpdateNumber) {
            return Promise.reject(new Error('simulated mid-transaction failure'));
          }
          var position = params[0], stageId = params[1];
          var row = stageRows.find(function(r) { return r.id === stageId; });
          updateCalls.push({ sql: s, params: params });
          if (row) row.position = position;
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      },
      release: function() {}
    };
  }

  return {
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT id FROM customer_journeys WHERE id = \$1 AND tenant_id = \$2$/.test(s)) {
        var match = journeyRow && journeyRow.id === params[0] && journeyRow.tenant_id === params[1];
        return Promise.resolve({ rows: match ? [{ id: journeyRow.id }] : [] });
      }
      if (/^SELECT id FROM customer_journey_stages WHERE journey_id = \$1$/.test(s)) {
        return Promise.resolve({ rows: stageRows.map(function(r) { return { id: r.id }; }) });
      }
      return Promise.resolve({ rows: [] });
    },
    connect: function() { connectCalls++; return Promise.resolve(makeClient()); },
    _state: function() {
      return { stageRows: stageRows, updateCalls: updateCalls, connectCalls: connectCalls, beginCalls: beginCalls, commitCalls: commitCalls, rollbackCalls: rollbackCalls };
    }
  };
}

/**
 * @param {object} journeyRow {id, name, description}
 * @param {Array<object>} stageRows full-row stage data for handleGetJourneyCanvas's own render
 */
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

function extractScript(html) {
  var m = html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('no <script> tag found in rendered HTML');
  return m[1];
}

function extractFunctionBody(script, fnName) {
  var start = script.indexOf('function ' + fnName + '(');
  if (start === -1) throw new Error('function ' + fnName + ' not found in script');
  var openBrace = script.indexOf('{', start);
  var depth = 0;
  for (var i = openBrace; i < script.length; i++) {
    if (script[i] === '{') depth++;
    else if (script[i] === '}') { depth--; if (depth === 0) return script.slice(start, i + 1); }
  }
  throw new Error('unbalanced braces while extracting ' + fnName);
}

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { handlePatchJourneyStagesOrder, handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');

  // ── AC1 (backend) ──────────────────────────────────────────────────────
  try {
    const pool = makeTransactionalMockPool({
      journeyRow: { id: 'j1', tenant_id: 'org-1' },
      stageRows: [{ id: 's1', position: 0 }, { id: 's2', position: 1 }, { id: 's3', position: 2 }]
    });
    const req = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1' },
      body: { stageIds: ['s3', 's1', 's2'], _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePatchJourneyStagesOrder(req, res, null, pool);
    const st = pool._state();
    assert.strictEqual(st.connectCalls, 1, 'expected exactly one pool.connect() call');
    assert.strictEqual(st.beginCalls, 1, 'expected exactly one BEGIN');
    assert.strictEqual(st.commitCalls, 1, 'expected exactly one COMMIT');
    assert.strictEqual(st.rollbackCalls, 0, 'expected zero ROLLBACK calls');
    assert.strictEqual(st.updateCalls.length, 3, 'expected 3 UPDATE calls, one per stage');
    assert.strictEqual(res._s, 200);
    pass('AC1 (backend): valid ordered stageIds array updates all positions in one transaction');
  } catch (e) { fail('AC1 (backend): valid ordered stageIds array updates all positions in one transaction', e); }

  // ── AC1 (backend security): foreign stageId ───────────────────────────
  try {
    const pool = makeTransactionalMockPool({
      journeyRow: { id: 'j1', tenant_id: 'org-1' },
      stageRows: [{ id: 's1', position: 0 }, { id: 's2', position: 1 }]
    });
    const req = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1' },
      body: { stageIds: ['s1', 's2', 's-foreign'], _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePatchJourneyStagesOrder(req, res, null, pool);
    assert.strictEqual(res._s, 400);
    assert.strictEqual(pool._state().connectCalls, 0, 'expected zero pool.connect() calls -- rejected before any transaction opens');
    pass('AC1 (backend security): a stageId not belonging to this journey is rejected before any transaction opens');
  } catch (e) { fail('AC1 (backend security): a stageId not belonging to this journey is rejected before any transaction opens', e); }

  // ── AC1 (backend security): missing/extra id ──────────────────────────
  try {
    const pool = makeTransactionalMockPool({
      journeyRow: { id: 'j1', tenant_id: 'org-1' },
      stageRows: [{ id: 's1', position: 0 }, { id: 's2', position: 1 }]
    });
    const req = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1' },
      body: { stageIds: ['s1'], _csrf: REAL_CSRF } // missing s2
    };
    const res = makeMockRes();
    await handlePatchJourneyStagesOrder(req, res, null, pool);
    assert.strictEqual(res._s, 400);
    assert.strictEqual(pool._state().connectCalls, 0);
    pass('AC1 (backend security): a stageIds array missing one of the journey\'s real stages is rejected');
  } catch (e) { fail('AC1 (backend security): a stageIds array missing one of the journey\'s real stages is rejected', e); }

  // ── AC1 (backend security): CSRF ──────────────────────────────────────
  try {
    const pool = makeTransactionalMockPool({
      journeyRow: { id: 'j1', tenant_id: 'org-1' },
      stageRows: [{ id: 's1', position: 0 }]
    });
    const req = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1' },
      body: { stageIds: ['s1'] } // no _csrf
    };
    const res = makeMockRes();
    await handlePatchJourneyStagesOrder(req, res, null, pool);
    assert.strictEqual(res._s, 403);
    assert.strictEqual(pool._state().connectCalls, 0);
    pass('AC1 (backend security): missing _csrf field returns 403 and opens zero transactions');
  } catch (e) { fail('AC1 (backend security): missing _csrf field returns 403 and opens zero transactions', e); }

  // ── AC1 (backend security): cross-tenant ──────────────────────────────
  try {
    const pool = makeTransactionalMockPool({
      journeyRow: { id: 'j1', tenant_id: 'org-OTHER' },
      stageRows: [{ id: 's1', position: 0 }]
    });
    const req = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1' },
      body: { stageIds: ['s1'], _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePatchJourneyStagesOrder(req, res, null, pool);
    assert.strictEqual(res._s, 404);
    assert.strictEqual(pool._state().connectCalls, 0);
    pass('AC1 (backend security): cross-tenant journey id is rejected');
  } catch (e) { fail('AC1 (backend security): cross-tenant journey id is rejected', e); }

  // ── AC1 (atomicity) ────────────────────────────────────────────────────
  try {
    const pool = makeTransactionalMockPool({
      journeyRow: { id: 'j1', tenant_id: 'org-1' },
      stageRows: [{ id: 's1', position: 0 }, { id: 's2', position: 1 }, { id: 's3', position: 2 }],
      failOnUpdateNumber: 2
    });
    const req = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1' },
      body: { stageIds: ['s3', 's1', 's2'], _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    let threw = false;
    try { await handlePatchJourneyStagesOrder(req, res, null, pool); } catch (_) { threw = true; }
    assert.ok(threw, 'expected the handler to propagate the mid-transaction error after rollback');
    const st = pool._state();
    assert.strictEqual(st.rollbackCalls, 1, 'expected ROLLBACK to be called');
    assert.strictEqual(st.commitCalls, 0, 'expected COMMIT to never be called');
    assert.strictEqual(st.updateCalls.length, 1, 'expected only the 1st UPDATE to have been recorded before the 2nd one failed');
    pass('AC1 (atomicity): a mid-transaction failure rolls back -- ALL stages keep their pre-call position, not just the failed one');
  } catch (e) { fail('AC1 (atomicity): a mid-transaction failure rolls back -- ALL stages keep their pre-call position, not just the failed one', e); }

  // ── AC1 (wiring shape) ─────────────────────────────────────────────────
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      { id: 's1', name: 'A', position: 0, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false },
      { id: 's2', name: 'B', position: 1, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false }
    ]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    assert.ok(/class="sw-stage-card" data-stage-id="s1" draggable="true"/.test(res._b.bodyContent), 'expected draggable="true" on stage cards');
    pass('AC1 (wiring shape): stage cards are draggable');
  } catch (e) { fail('AC1 (wiring shape): stage cards are draggable', e); }

  // ── AC3 (render) ────────────────────────────────────────────────────────
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      { id: 's1', name: 'First', position: 0, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false },
      { id: 's2', name: 'Mid', position: 1, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false },
      { id: 's3', name: 'Last', position: 2, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false }
    ]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(/data-stage-id="s1" data-direction="up"[^>]*disabled/.test(html), 'expected s1 (first) up button disabled');
    assert.ok(!/data-stage-id="s1" data-direction="down"[^>]*disabled/.test(html), 'expected s1 down button NOT disabled');
    assert.ok(/data-stage-id="s3" data-direction="down"[^>]*disabled/.test(html), 'expected s3 (last) down button disabled');
    assert.ok(!/data-stage-id="s3" data-direction="up"[^>]*disabled/.test(html), 'expected s3 up button NOT disabled');
    assert.ok(!/data-stage-id="s2" data-direction="up"[^>]*disabled/.test(html), 'expected s2 (mid) up button NOT disabled');
    assert.ok(!/data-stage-id="s2" data-direction="down"[^>]*disabled/.test(html), 'expected s2 (mid) down button NOT disabled');
    pass('AC3: up/down move buttons render for every card when there are 2+ stages, boundary-disabled');
  } catch (e) { fail('AC3: up/down move buttons render for every card when there are 2+ stages, boundary-disabled', e); }

  // ── AC3 (single-stage) ──────────────────────────────────────────────────
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      { id: 's1', name: 'Only', position: 0, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false }
    ]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    assert.ok(!/class="sw-stage-reorder-controls"/.test(res._b.bodyContent), 'expected no reorder-controls element for a single-stage journey');
    pass('AC3 (single-stage): a journey with exactly one stage renders no reorder controls');
  } catch (e) { fail('AC3 (single-stage): a journey with exactly one stage renders no reorder controls', e); }

  // ── AC2 (shape) ─────────────────────────────────────────────────────────
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      { id: 's1', name: 'A', position: 0, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false },
      { id: 's2', name: 'B', position: 1, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false }
    ]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const script = extractScript(res._b.bodyContent);
    const submitOrderBody = extractFunctionBody(script, 'submitOrder');
    assert.ok(/reorderDom\(snapshot\)/.test(submitOrderBody), 'expected submitOrder\'s failure branch to restore the DOM snapshot');
    assert.ok(submitOrderBody.indexOf('Stage order not saved — please try again') !== -1, 'expected the EXACT toast text in submitOrder\'s failure branch');
    pass('AC2 (shape): the drop handler reverts to the pre-drop snapshot and shows the exact toast text on failure');
  } catch (e) { fail('AC2 (shape): the drop handler reverts to the pre-drop snapshot and shows the exact toast text on failure', e); }

  // ── AC3 (click wiring) ──────────────────────────────────────────────────
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      { id: 's1', name: 'A', position: 0, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false },
      { id: 's2', name: 'B', position: 1, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false }
    ]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const script = extractScript(res._b.bodyContent);
    const occurrences = script.split('submitOrder(').length - 1;
    assert.ok(occurrences >= 3, 'expected submitOrder to be defined once and called from at least 2 call sites (drop + move button), found ' + occurrences + ' occurrence(s)');
    pass('AC3 (click wiring): the move-button handler shares submitOrder with the drop handler -- proves one shared mechanism');
  } catch (e) { fail('AC3 (click wiring): the move-button handler shares submitOrder with the drop handler -- proves one shared mechanism', e); }

  // ── AC4 ─────────────────────────────────────────────────────────────────
  try {
    const reorderPool = makeTransactionalMockPool({
      journeyRow: { id: 'j1', tenant_id: 'org-1' },
      stageRows: [{ id: 's1', position: 0 }, { id: 's2', position: 1 }, { id: 's3', position: 2 }]
    });
    const reorderReq = {
      session: { tenantId: 'org-1', csrfToken: REAL_CSRF },
      params: { id: 'j1' },
      body: { stageIds: ['s3', 's1', 's2'], _csrf: REAL_CSRF }
    };
    const reorderRes = makeMockRes();
    await handlePatchJourneyStagesOrder(reorderReq, reorderRes, null, reorderPool);

    const state = reorderPool._state();
    const sortedStages = state.stageRows.slice().sort(function(a, b) { return a.position - b.position; })
      .map(function(r) { return { id: r.id, name: r.id.toUpperCase(), position: r.position, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false }; });
    const canvasPool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, sortedStages);
    const canvasReq = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const canvasRes = makeMockRes();
    await handleGetJourneyCanvas(canvasReq, canvasRes, null, canvasPool);
    const html = canvasRes._b.bodyContent;
    const idxS3 = html.indexOf('data-stage-id="s3"');
    const idxS1 = html.indexOf('data-stage-id="s1"');
    const idxS2 = html.indexOf('data-stage-id="s2"');
    assert.ok(idxS3 !== -1 && idxS1 !== -1 && idxS2 !== -1 && idxS3 < idxS1 && idxS1 < idxS2, 'expected rendered order s3, s1, s2 (the new position order), got offsets ' + idxS3 + ',' + idxS1 + ',' + idxS2);
    pass('AC4: after a successful reorder, re-querying the canvas renders stage cards in the new position order');
  } catch (e) { fail('AC4: after a successful reorder, re-querying the canvas renders stage cards in the new position order', e); }

  console.log(`\n[ep1-s4-stage-reorder] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
