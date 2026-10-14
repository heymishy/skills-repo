'use strict';
// check-jae-s1-default-skeleton.js -- unit/integration tests for jae-s1
// (Epic: journey-authoring-guided-creation, 2026-10-14-journey-authoring-experience).
//
// Covers: AC1 (checkbox renders, checked by default), AC2 (checked
// submission seeds exactly 5 stages), AC3 (unchecked submission seeds
// zero stages), AC4 (seeded stages always carry the journey's own
// tenant_id).
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log('  [PASS] ' + name); passed++; }
function fail(name, err) { console.error('  [FAIL] ' + name + ': ' + (err.message || err)); failed++; }

function makeCapturingPool(journeyId) {
  var calls = [];
  return {
    calls: calls,
    query: function(sql, params) {
      var s = String(sql).trim();
      calls.push({ sql: s, params: params });
      if (/^INSERT INTO customer_journeys/.test(s)) {
        return Promise.resolve({ rows: [{ id: journeyId }] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

function makeMockReqRes(body, tenantId) {
  var fullBody = Object.assign({ _csrf: 'tok' }, body);
  var req = { session: { tenantId: tenantId || 't1', csrfToken: 'tok' }, body: fullBody };
  var res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
  return { req: req, res: res };
}

(async function() {
  var journeys = require('../src/web-ui/routes/journeys');

  // AC1: checkbox renders, checked by default
  try {
    var pool1 = {
      query: function(sql) {
        var s = String(sql).trim();
        if (/^SELECT cj.id/.test(s)) return Promise.resolve({ rows: [] });
        if (/^SELECT journey_id/.test(s)) return Promise.resolve({ rows: [] });
        if (/^SELECT product_id, name FROM products/.test(s)) return Promise.resolve({ rows: [] });
        return Promise.resolve({ rows: [] });
      }
    };
    var req1 = { session: { tenantId: 't1' } };
    var res1 = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await journeys.handleGetCustomerJourneysList(req1, res1, null, pool1);
    var html = res1._b.bodyContent;
    var idx = html.indexOf('sw-new-journey-seed-default');
    assert.ok(idx !== -1, 'expected the default-skeleton checkbox to be present');
    var tagStart = html.lastIndexOf('<input', idx);
    var tagEnd = html.indexOf('>', idx);
    var tag = html.slice(tagStart, tagEnd + 1);
    assert.ok(/\bchecked\b/.test(tag), 'expected the checkbox to be checked by default');
    pass('jae-s1 AC1: "+ New journey" modal includes the default-checked skeleton checkbox');
  } catch (e) { fail('jae-s1 AC1: "+ New journey" modal includes the default-checked skeleton checkbox', e); }

  // AC2: seedDefaultStages !== false seeds exactly 5 stages
  try {
    var pool2 = makeCapturingPool('j1');
    var { req, res } = makeMockReqRes({ name: 'J', seedDefaultStages: true });
    await journeys.handlePostJourneys(req, res, null, pool2);
    var stageInserts = pool2.calls.filter(function(c) { return /^INSERT INTO customer_journey_stages/.test(c.sql); });
    assert.strictEqual(stageInserts.length, 5, 'expected exactly 5 stage INSERT calls');
    var expectedNames = ['Evaluate', 'Discover', 'Purchase', 'Onboard', 'Retain'];
    stageInserts.forEach(function(call, idx) {
      assert.strictEqual(call.params[2], expectedNames[idx], 'expected stage ' + idx + ' to be named ' + expectedNames[idx]);
      assert.strictEqual(call.params[3], idx, 'expected stage ' + idx + ' to have position ' + idx);
    });

    // Also confirm the field-omitted case defaults to seeding (true).
    var pool2b = makeCapturingPool('j2');
    var { req: req2b, res: res2b } = makeMockReqRes({ name: 'J2' });
    await journeys.handlePostJourneys(req2b, res2b, null, pool2b);
    var stageInserts2b = pool2b.calls.filter(function(c) { return /^INSERT INTO customer_journey_stages/.test(c.sql); });
    assert.strictEqual(stageInserts2b.length, 5, 'expected seeding to default to true when the field is omitted entirely');

    pass('jae-s1 AC2: seedDefaultStages !== false seeds exactly 5 stages, name/position only, defaults true when omitted');
  } catch (e) { fail('jae-s1 AC2: seedDefaultStages !== false seeds exactly 5 stages, name/position only, defaults true when omitted', e); }

  // AC3: seedDefaultStages: false seeds zero stages
  try {
    var pool3 = makeCapturingPool('j3');
    var { req: req3, res: res3 } = makeMockReqRes({ name: 'J3', seedDefaultStages: false });
    await journeys.handlePostJourneys(req3, res3, null, pool3);
    var stageInserts3 = pool3.calls.filter(function(c) { return /^INSERT INTO customer_journey_stages/.test(c.sql); });
    assert.strictEqual(stageInserts3.length, 0, 'expected zero stage INSERT calls when seedDefaultStages is false');
    pass('jae-s1 AC3: seedDefaultStages: false seeds zero stages');
  } catch (e) { fail('jae-s1 AC3: seedDefaultStages: false seeds zero stages', e); }

  // AC4: seeded stages always carry the journey's own tenant_id
  try {
    var pool4 = makeCapturingPool('j4');
    var { req: req4, res: res4 } = makeMockReqRes({ name: 'J4', seedDefaultStages: true }, 't-tenant-4');
    await journeys.handlePostJourneys(req4, res4, null, pool4);
    var stageInserts4 = pool4.calls.filter(function(c) { return /^INSERT INTO customer_journey_stages/.test(c.sql); });
    assert.strictEqual(stageInserts4.length, 5, 'expected 5 seeded stages');
    stageInserts4.forEach(function(call) {
      assert.strictEqual(call.params[1], 't-tenant-4', 'expected every seeded stage to carry the journey\'s own tenant_id');
    });
    pass('jae-s1 AC4: seeded stages always carry the journey\'s own tenant_id');
  } catch (e) { fail('jae-s1 AC4: seeded stages always carry the journey\'s own tenant_id', e); }

  console.log('\n[jae-s1-default-skeleton] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
