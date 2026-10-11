'use strict';
// check-jcx-s1-placeholder-feature.js -- TDD tests for jcx-s1 (Epic:
// journey-map-and-placeholder-trigger, 2026-10-11-journey-cx-redesign).
// Story: artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s1.md
const assert = require('assert');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

function stageRow(id, extra) {
  return Object.assign({ id, name: 'Discover', description: 'Finds the product', emotion: 'positive', pain_points: 'Hard to find', opportunities: 'Add search', touchpoints: 'Website' }, extra || {});
}
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
      if (/^SELECT id, name, description, emotion, pain_points, opportunities, touchpoints/.test(s)) {
        var foundFull = stageRows.find(function(r) { return r.id === params[0] && params[2] === 'org-1'; });
        return Promise.resolve({ rows: foundFull ? [foundFull] : [] });
      }
      if (/^SELECT feature_slug FROM feature_customer_journey_stage_mappings/.test(s)) {
        var foundMapping = mappingRows.find(function(r) { return r.id === params[0] && r.journey_stage_id === params[1] && params[2] === 'org-1'; });
        return Promise.resolve({ rows: foundMapping ? [{ feature_slug: foundMapping.feature_slug }] : [] });
      }
      if (/^INSERT INTO feature_customer_journey_stage_mappings/.test(s)) {
        // mapping_state is a literal ('placeholder') in the real SQL, not a bound param
        var row = { id: 'map-' + (mappingRows.length + 1), journey_stage_id: params[0], journey_id: params[1], tenant_id: params[2], feature_slug: params[3], mapping_state: 'placeholder' };
        mappingRows.push(row);
        return Promise.resolve({ rows: [{ id: row.id }] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

(async function() {
  const { handlePostPlaceholderFeature } = require('../src/web-ui/routes/journeys');

  // -- AC1 (unit half): placeholder creation produces the correct INSERT shape --
  try {
    const mappingRows = [];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s1-csrf';
    const req = { session: { tenantId: 'org-1', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1' }, body: { name: 'Bulk export', _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handlePostPlaceholderFeature(req, res, null, pool);
    assert.strictEqual(res._s, 200, 'expected 200 for a valid placeholder creation');
    assert.strictEqual(mappingRows.length, 1, 'expected exactly one mapping row created');
    assert.strictEqual(mappingRows[0].mapping_state, 'placeholder', 'expected mapping_state to be placeholder');
    assert.strictEqual(mappingRows[0].feature_slug, 'Bulk export', 'expected feature_slug to hold the placeholder name (not a real slug) until jcx-s2 converts it');
    pass('AC1: placeholder mapping created with mapping_state=placeholder, feature_slug holds the name');
  } catch (e) { fail('AC1: placeholder mapping created with mapping_state=placeholder, feature_slug holds the name', e); }

  // -- AC3 (creation half): cross-tenant stage id -> 404, zero INSERT --
  try {
    const mappingRows = [];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s1-csrf-ac3';
    const req = { session: { tenantId: 'org-2', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1' }, body: { name: 'Bulk export', _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handlePostPlaceholderFeature(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404 (not 403) for a cross-tenant stage id');
    assert.strictEqual(mappingRows.length, 0, 'expected zero mapping rows created');
    const insertCalls = pool.calls.filter(function(c) { return /^INSERT/.test(c.sql); });
    assert.strictEqual(insertCalls.length, 0, 'expected zero INSERT calls against the mock pool');
    pass('AC3 (creation): cross-tenant stage id returns 404 and makes zero mutation');
  } catch (e) { fail('AC3 (creation): cross-tenant stage id returns 404 and makes zero mutation', e); }

  // -- AC4: a placeholder and a real mapping coexist on the same stage --
  try {
    const mappingRows = [{ id: 'map-real-1', journey_stage_id: 's1', feature_slug: 'existing-feature', mapping_state: 'linked' }];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s1-csrf-ac4';
    const req = { session: { tenantId: 'org-1', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1' }, body: { name: 'New idea', _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handlePostPlaceholderFeature(req, res, null, pool);
    assert.strictEqual(mappingRows.length, 2, 'expected the real mapping to remain and a new placeholder to be added');
    assert.strictEqual(mappingRows[0].feature_slug, 'existing-feature', 'expected the original real mapping row to be untouched');
    assert.strictEqual(mappingRows[1].mapping_state, 'placeholder', 'expected the new row to be a placeholder');
    pass('AC4: a placeholder and a real mapping coexist on the same stage');
  } catch (e) { fail('AC4: a placeholder and a real mapping coexist on the same stage', e); }

  const { handleTriggerPlaceholderFeature } = require('../src/web-ui/routes/journeys');
  const fs = require('fs');
  const osTmp = require('os').tmpdir();

  // -- AC2: trigger creates a real artefacts/ folder and seeds discovery.md --
  try {
    const scratchRoot = fs.mkdtempSync(path.join(osTmp, 'jcx-s1-trigger-'));
    const mappingRows = [{ id: 'map-1', journey_stage_id: 's1', journey_id: 'j1', tenant_id: 'org-1', feature_slug: 'Bulk export', mapping_state: 'placeholder' }];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s1-csrf-ac2';
    const req = { session: { tenantId: 'org-1', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1', mappingId: 'map-1' }, body: { _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handleTriggerPlaceholderFeature(req, res, null, pool, { repoRoot: scratchRoot });
    assert.strictEqual(res._s, 200, 'expected 200 for a valid trigger');
    const featureSlug = res._b.featureSlug;
    const discoveryPath = path.join(scratchRoot, 'artefacts', featureSlug, 'discovery.md');
    assert.ok(fs.existsSync(discoveryPath), 'expected a real discovery.md to be created on disk');
    const content = fs.readFileSync(discoveryPath, 'utf8');
    assert.ok(content.indexOf('Discover') !== -1, 'expected the stage name in the seeded Problem Statement');
    assert.ok(content.indexOf('positive') !== -1, 'expected the stage emotion in the seeded Problem Statement');
    assert.ok(content.indexOf('Hard to find') !== -1, 'expected the stage pain_points in the seeded Problem Statement');
    assert.ok(content.indexOf('## Who It Affects') === -1, 'expected ONLY Section 1 to be seeded, not Who It Affects (per /clarify Option A)');
    fs.rmSync(scratchRoot, { recursive: true, force: true });
    pass('AC2: trigger creates a real artefacts/ folder and seeds discovery.md Section 1 only');
  } catch (e) { fail('AC2: trigger creates a real artefacts/ folder and seeds discovery.md Section 1 only', e); }

  // -- AC3 (trigger half): cross-tenant mapping id -> 404, no folder created --
  try {
    const scratchRoot = fs.mkdtempSync(path.join(osTmp, 'jcx-s1-trigger-ac3-'));
    const mappingRows = [{ id: 'map-1', journey_stage_id: 's1', journey_id: 'j1', tenant_id: 'org-1', feature_slug: 'Bulk export', mapping_state: 'placeholder' }];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s1-csrf-ac3b';
    const req = { session: { tenantId: 'org-2', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1', mappingId: 'map-1' }, body: { _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handleTriggerPlaceholderFeature(req, res, null, pool, { repoRoot: scratchRoot });
    assert.strictEqual(res._s, 404, 'expected 404 for a cross-tenant mapping');
    assert.ok(!fs.existsSync(path.join(scratchRoot, 'artefacts')), 'expected no artefacts/ folder created at all');
    fs.rmSync(scratchRoot, { recursive: true, force: true });
    pass('AC3 (trigger): cross-tenant mapping id returns 404, no folder created');
  } catch (e) { fail('AC3 (trigger): cross-tenant mapping id returns 404, no folder created', e); }

  // -- NFR: path traversal guard on the feature-folder name --
  try {
    const scratchRoot = fs.mkdtempSync(path.join(osTmp, 'jcx-s1-trigger-nfr-'));
    const mappingRows = [{ id: 'map-1', journey_stage_id: 's1', journey_id: 'j1', tenant_id: 'org-1', feature_slug: '../../etc/passwd', mapping_state: 'placeholder' }];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s1-csrf-nfr';
    const req = { session: { tenantId: 'org-1', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1', mappingId: 'map-1' }, body: { _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handleTriggerPlaceholderFeature(req, res, null, pool, { repoRoot: scratchRoot });
    assert.strictEqual(res._s, 400, 'expected 400 for a path-traversal placeholder name');
    assert.ok(!fs.existsSync(path.join(scratchRoot, '..', '..', 'etc')), 'expected no file written outside the scratch repo root');
    fs.rmSync(scratchRoot, { recursive: true, force: true });
    pass('NFR: path traversal guard rejects a crafted placeholder name with 400, no file written');
  } catch (e) { fail('NFR: path traversal guard rejects a crafted placeholder name with 400, no file written', e); }

  console.log(`\n[jcx-s1-placeholder-feature] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
