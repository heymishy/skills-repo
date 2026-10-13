'use strict';
// check-jcx-s5-authorization.js -- TDD tests for jcx-s5 (Epic:
// journey-map-and-placeholder-trigger, 2026-10-11-journey-cx-redesign).
// Story: artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s5.md
//
// Verification-only story -- no new production code. These tests confirm
// jcx-s1's and jcx-s2's own already-shipped routes correctly deny
// cross-tenant access (404) and viewer-role mutation (403).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

function stageRow(id, extra) {
  return Object.assign({ id, name: 'Discover', description: 'Finds the product', emotion: 'positive', pain_points: 'Hard to find', opportunities: 'Add search', touchpoints: 'Website' }, extra || {});
}

// Mirrors check-jcx-s1-placeholder-feature.js's own makeMockPool -- a new
// local copy here, matching this session's own established per-file
// convention (no shared mock-pool helper module exists yet).
function makeMockPool(stageRows, mappingRows) {
  const calls = [];
  return {
    calls: calls,
    query: function(sql, params) {
      calls.push({ sql: String(sql).trim(), params: params });
      var s = String(sql).trim();
      if (/^SELECT cjs\.id FROM customer_journey_stages/.test(s)) {
        var found = stageRows.find(function(r) { return r.id === params[0] && params[2] === 'org-1'; });
        return Promise.resolve({ rows: found ? [{ id: found.id }] : [] });
      }
      if (/^SELECT cjs\.id, cjs\.name, cjs\.description, cjs\.emotion, cjs\.pain_points, cjs\.opportunities, cjs\.touchpoints/.test(s)) {
        var foundFull = stageRows.find(function(r) { return r.id === params[0] && params[2] === 'org-1'; });
        return Promise.resolve({ rows: foundFull ? [foundFull] : [] });
      }
      if (/^SELECT feature_slug FROM feature_customer_journey_stage_mappings/.test(s)) {
        var foundMapping = mappingRows.find(function(r) { return r.id === params[0] && r.journey_stage_id === params[1] && params[2] === 'org-1'; });
        return Promise.resolve({ rows: foundMapping ? [{ feature_slug: foundMapping.feature_slug }] : [] });
      }
      if (/^INSERT INTO feature_customer_journey_stage_mappings/.test(s)) {
        var row = { id: 'map-' + (mappingRows.length + 1), journey_stage_id: params[0], journey_id: params[1], tenant_id: params[2], feature_slug: params[3], mapping_state: 'placeholder' };
        mappingRows.push(row);
        return Promise.resolve({ rows: [{ id: row.id }] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

// Mirrors check-jcx-s1-placeholder-feature.js's own makeCanvasMockPool --
// same query shapes handleGetJourneyCanvas issues, with an added updateCalls
// tracker so AC4 can assert zero mapping_state conversions happened.
function makeCanvasMockPool(journeyRow, stageRows, mappingRows) {
  mappingRows = mappingRows || [];
  const updateCalls = [];
  return {
    updateCalls: updateCalls,
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT id, name, description, product_id, persona_name, persona_role, persona_goal FROM customer_journeys/.test(s)) {
        var match = journeyRow && journeyRow.id === params[0] && journeyRow.tenant_id === params[1];
        return Promise.resolve({ rows: match ? [journeyRow] : [] });
      }
      if (/^SELECT id, name, position, description/.test(s)) {
        return Promise.resolve({ rows: stageRows });
      }
      if (/^SELECT .* FROM feature_customer_journey_stage_mappings WHERE mapping_state = 'placeholder'/.test(s)) {
        return Promise.resolve({ rows: mappingRows.filter(function(m) { return m.mapping_state === 'placeholder'; }) });
      }
      if (/^SELECT id, journey_stage_id, feature_slug, metric_keys, mapping_state FROM feature_customer_journey_stage_mappings/.test(s)) {
        var jMatch = journeyRow && params[0] === journeyRow.id;
        return Promise.resolve({ rows: jMatch ? mappingRows : [] });
      }
      if (/^UPDATE feature_customer_journey_stage_mappings SET mapping_state = 'linked'/.test(s)) {
        updateCalls.push({ sql: s, params: params });
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

function withMockedPipelineState(jsonString, fn) {
  var orig = fs.readFileSync;
  fs.readFileSync = function(p, enc) {
    if (String(p).indexOf('pipeline-state.json') !== -1) { return jsonString; }
    return orig(p, enc);
  };
  try { return fn(); } finally { fs.readFileSync = orig; }
}

(async function() {
  const { handlePostPlaceholderFeature, handleTriggerPlaceholderFeature, handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');

  // -- AC1: cross-tenant placeholder-feature creation -> 404, zero writes --
  try {
    const mappingRows = [];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s5-csrf-ac1';
    const req = { session: { tenantId: 'org-2', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1' }, body: { name: 'Bulk export', _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handlePostPlaceholderFeature(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404 (not 403) for a cross-tenant stage id');
    assert.strictEqual(mappingRows.length, 0, 'expected zero mapping rows created');
    const insertCalls = pool.calls.filter(function(c) { return /^INSERT/.test(c.sql); });
    assert.strictEqual(insertCalls.length, 0, 'expected zero INSERT calls against the mock pool');
    pass('AC1: cross-tenant placeholder-feature creation returns 404 and makes zero writes');
  } catch (e) { fail('AC1: cross-tenant placeholder-feature creation returns 404 and makes zero writes', e); }

  // -- AC2: cross-tenant trigger -> 404, no folder or state created --
  try {
    const scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s5-ac2-'));
    const mappingRows = [{ id: 'map-1', journey_stage_id: 's1', journey_id: 'j1', tenant_id: 'org-1', feature_slug: 'Bulk export', mapping_state: 'placeholder' }];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s5-csrf-ac2';
    const req = { session: { tenantId: 'org-2', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1', mappingId: 'map-1' }, body: { _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handleTriggerPlaceholderFeature(req, res, null, pool, { repoRoot: scratchRoot });
    assert.strictEqual(res._s, 404, 'expected 404 for a cross-tenant mapping id');
    assert.ok(!fs.existsSync(path.join(scratchRoot, 'artefacts')), 'expected no artefacts/ folder created at all');
    fs.rmSync(scratchRoot, { recursive: true, force: true });
    pass('AC2: cross-tenant trigger returns 404, no folder or pipeline-state entry created');
  } catch (e) { fail('AC2: cross-tenant trigger returns 404, no folder or pipeline-state entry created', e); }

  // -- AC3: viewer-role session denied via a real server.js router dispatch --
  try {
    process.env.NODE_ENV             = 'test';
    process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
    process.env.GITHUB_CLIENT_ID     = 'test-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-secret';
    process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
    delete process.env.POSTHOG_KEY;
    delete process.env.DATABASE_URL;

    var router = require('../src/web-ui/server').router;
    var seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;
    var EventEmitter = require('events').EventEmitter;

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

    var sharedOrg = 'e2e-jcx-s5-integration';
    await seedMultiUserRolesForIntegrationTest(sharedOrg);

    // Hex-only (per _parseSessionId's own [a-f0-9]+ gotcha), distinct from
    // vrne-s4's own 'faceb00c04' and every other hardcoded session id in
    // the suite.
    var sessionId = '5ec5b5a1a5';
    seedTestSession(sessionId, {
      accessToken: 'e2e-test-access-token',
      userId: 9002,
      login: 'e2e-viewer',
      tenantId: sharedOrg
    });
    var cookieHeader = { cookie: 'session_id=' + sessionId };

    var req1 = { headers: Object.assign({ 'content-type': 'application/json' }, cookieHeader), method: 'POST', url: '/journeys/j1/stages/s1/placeholder-features' };
    var result1 = await dispatchAndAwaitResponse(req1);
    assert.strictEqual(result1.statusCode, 403, 'expected 403 for a viewer-role session on the placeholder-creation route, got ' + result1.statusCode + ' -- ' + result1.body);

    var req2 = { headers: Object.assign({ 'content-type': 'application/json' }, cookieHeader), method: 'POST', url: '/journeys/j1/stages/s1/placeholder-features/map-1/trigger' };
    var result2 = await dispatchAndAwaitResponse(req2);
    assert.strictEqual(result2.statusCode, 403, 'expected 403 for a viewer-role session on the trigger route, got ' + result2.statusCode + ' -- ' + result2.body);

    pass('AC3: viewer-role session denied with 403 on both the placeholder-creation and trigger routes via real server.js dispatch');
  } catch (e) { fail('AC3: viewer-role session denied with 403 on both the placeholder-creation and trigger routes via real server.js dispatch', e); }

  // -- AC4: cross-tenant mapping-conversion -> 404, no partial conversion --
  try {
    const mappingRows = [{ id: 'map-1', journey_id: 'j1', journey_stage_id: 's1', tenant_id: 'org-1', mapping_state: 'placeholder', feature_slug: 'Bulk export', triggered_feature_slug: '2026-10-13-bulk-export' }];
    const canvasPool = makeCanvasMockPool(
      { id: 'j1', tenant_id: 'org-1', name: 'J', description: null },
      [{ id: 's1', name: 'Discover', position: 0 }],
      mappingRows
    );
    await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      const req = { session: { tenantId: 'org-2' }, params: { id: 'j1' } };
      const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
      await handleGetJourneyCanvas(req, res, null, canvasPool);
      assert.strictEqual(res._s, 404, 'expected 404 for a cross-tenant journey id');
    });
    assert.strictEqual(canvasPool.updateCalls.length, 0, 'expected zero UPDATE calls -- the journey 404 must happen before checkPlaceholderConversions ever runs');
    assert.strictEqual(mappingRows[0].mapping_state, 'placeholder', 'expected the mapping to remain unchanged -- no partial conversion');
    pass('AC4: cross-tenant mapping-conversion returns 404 with zero partial conversion');
  } catch (e) { fail('AC4: cross-tenant mapping-conversion returns 404 with zero partial conversion', e); }

  console.log(`\n[jcx-s5-authorization] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
