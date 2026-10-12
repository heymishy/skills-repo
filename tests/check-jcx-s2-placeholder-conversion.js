'use strict';
// check-jcx-s2-placeholder-conversion.js -- TDD tests for jcx-s2 (Epic:
// journey-map-and-placeholder-trigger, 2026-10-11-journey-cx-redesign).
// Story: artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s2.md
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

function makeDiscoveryFixture(repoRoot, slug, status) {
  var dir = path.join(repoRoot, 'artefacts', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'discovery.md'), '# Discovery: X\n\n**Status:** ' + status + '\n', 'utf8');
}

function makeMockPool(mappingRows) {
  const updateCalls = [];
  return {
    updateCalls: updateCalls,
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT .* FROM feature_customer_journey_stage_mappings WHERE mapping_state = 'placeholder'/.test(s)) {
        var journeyId = params[0], tenantId = params[1];
        var rows = mappingRows.filter(function(m) { return m.journey_id === journeyId && m.tenant_id === tenantId && m.mapping_state === 'placeholder'; });
        return Promise.resolve({ rows: rows });
      }
      if (/^UPDATE feature_customer_journey_stage_mappings SET mapping_state = 'linked'/.test(s)) {
        updateCalls.push({ sql: s, params: params });
        var row = mappingRows.find(function(m) { return m.id === params[1]; });
        if (row) { row.mapping_state = 'linked'; row.feature_slug = row.triggered_feature_slug; }
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

(async function() {
  const { checkPlaceholderConversions } = require('../src/web-ui/routes/journeys');

  // -- AC1: approval converts placeholder -> linked, feature_slug updates --
  try {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s2-'));
    makeDiscoveryFixture(repoRoot, '2026-10-13-bulk-export', 'Approved');
    const mappingRows = [{ id: 'map-1', journey_id: 'j1', journey_stage_id: 's1', tenant_id: 't1', mapping_state: 'placeholder', feature_slug: 'Bulk export', triggered_feature_slug: '2026-10-13-bulk-export' }];
    const pool = makeMockPool(mappingRows);
    await checkPlaceholderConversions(pool, 'j1', 't1', repoRoot);
    assert.strictEqual(mappingRows[0].mapping_state, 'linked', 'expected mapping_state to become linked');
    assert.strictEqual(mappingRows[0].feature_slug, '2026-10-13-bulk-export', 'expected feature_slug to update to the real approved slug');
    assert.strictEqual(pool.updateCalls.length, 1, 'expected exactly one UPDATE');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC1: approval converts the mapping to linked with the real feature slug');
  } catch (e) { fail('AC1: approval converts the mapping to linked with the real feature slug', e); }

  // -- AC2: an unapproved discovery leaves the mapping untouched --
  try {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s2-'));
    makeDiscoveryFixture(repoRoot, '2026-10-13-still-draft', 'Draft');
    const mappingRows = [{ id: 'map-1', journey_id: 'j1', journey_stage_id: 's1', tenant_id: 't1', mapping_state: 'placeholder', feature_slug: 'Still draft', triggered_feature_slug: '2026-10-13-still-draft' }];
    const pool = makeMockPool(mappingRows);
    await checkPlaceholderConversions(pool, 'j1', 't1', repoRoot);
    assert.strictEqual(mappingRows[0].mapping_state, 'placeholder', 'expected mapping_state to remain placeholder');
    assert.strictEqual(pool.updateCalls.length, 0, 'expected zero UPDATE calls');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC2: an unapproved discovery leaves the mapping untouched');
  } catch (e) { fail('AC2: an unapproved discovery leaves the mapping untouched', e); }

  // -- AC3: two independent mappings convert independently --
  try {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s2-'));
    makeDiscoveryFixture(repoRoot, '2026-10-13-approved-one', 'Approved');
    makeDiscoveryFixture(repoRoot, '2026-10-13-draft-one', 'Draft');
    const mappingRows = [
      { id: 'map-1', journey_id: 'j1', journey_stage_id: 's1', tenant_id: 't1', mapping_state: 'placeholder', feature_slug: 'Approved one', triggered_feature_slug: '2026-10-13-approved-one' },
      { id: 'map-2', journey_id: 'j1', journey_stage_id: 's2', tenant_id: 't1', mapping_state: 'placeholder', feature_slug: 'Draft one', triggered_feature_slug: '2026-10-13-draft-one' }
    ];
    const pool = makeMockPool(mappingRows);
    await checkPlaceholderConversions(pool, 'j1', 't1', repoRoot);
    assert.strictEqual(mappingRows[0].mapping_state, 'linked', 'expected the approved one to convert');
    assert.strictEqual(mappingRows[1].mapping_state, 'placeholder', 'expected the draft one to remain placeholder');
    assert.strictEqual(pool.updateCalls.length, 1, 'expected exactly one UPDATE, targeting only the approved mapping');
    assert.strictEqual(pool.updateCalls[0].params[1], 'map-1', 'expected the UPDATE to target map-1 specifically');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC3: two independent placeholder mappings convert independently');
  } catch (e) { fail('AC3: two independent placeholder mappings convert independently', e); }

  // -- AC4 (unit): an abandoned placeholder (never triggered) never auto-converts --
  try {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s2-'));
    const mappingRows = [{ id: 'map-1', journey_id: 'j1', journey_stage_id: 's1', tenant_id: 't1', mapping_state: 'placeholder', feature_slug: 'Never triggered', triggered_feature_slug: null }];
    const pool = makeMockPool(mappingRows);
    await checkPlaceholderConversions(pool, 'j1', 't1', repoRoot);
    assert.strictEqual(mappingRows[0].mapping_state, 'placeholder', 'expected mapping_state to remain placeholder');
    assert.strictEqual(pool.updateCalls.length, 0, 'expected zero UPDATE calls -- no triggered_feature_slug means nothing to check');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC4: an abandoned (never-triggered) placeholder never auto-converts');
  } catch (e) { fail('AC4: an abandoned (never-triggered) placeholder never auto-converts', e); }

  // -- NFR: conversion check is tenant-scoped --
  try {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s2-'));
    makeDiscoveryFixture(repoRoot, '2026-10-13-other-tenant', 'Approved');
    const mappingRows = [{ id: 'map-1', journey_id: 'j1', journey_stage_id: 's1', tenant_id: 'org-2', mapping_state: 'placeholder', feature_slug: 'Other tenant', triggered_feature_slug: '2026-10-13-other-tenant' }];
    const pool = makeMockPool(mappingRows);
    await checkPlaceholderConversions(pool, 'j1', 'org-1', repoRoot);
    assert.strictEqual(mappingRows[0].mapping_state, 'placeholder', 'expected the other tenant\'s mapping to remain untouched');
    assert.strictEqual(pool.updateCalls.length, 0, 'expected zero UPDATE calls -- the SELECT itself is tenant-scoped, matching D13');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('NFR: conversion check is tenant-scoped -- a cross-tenant mapping is never touched');
  } catch (e) { fail('NFR: conversion check is tenant-scoped -- a cross-tenant mapping is never touched', e); }

  console.log(`\n[jcx-s2-placeholder-conversion] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
