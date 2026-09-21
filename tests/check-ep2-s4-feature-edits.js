'use strict';
const assert = require('assert');
const { migrateFeatureEditsSchema, recordEdit, listEditsForFeature } = require('../src/web-ui/modules/feature-edits');

function makeFakePool() {
  var edits = [];
  var idCounter = 0;
  return {
    query: async function (sql, params) {
      var s = sql.toUpperCase();
      if (s.indexOf('CREATE TABLE') === 0) return { rows: [] };
      if (s.indexOf('INSERT INTO FEATURE_EDITS') === 0) {
        idCounter++;
        var row = {
          id: edits.length + 1,
          feature_id: params[0],
          artefact_name: params[1],
          user_id: params[2],
          // Offset by idCounter (mirrors tests/check-dsa-s1-artefact-comments.js's
          // own fake pool) so rows created within the same tick still get
          // distinct, monotonically increasing timestamps -- otherwise the
          // ordering test below can't distinguish insertion order from
          // timestamp order.
          timestamp: new Date(Date.now() + idCounter).toISOString(),
          operation: params[3],
          edit_hash: params[4],
          merged_with: params[5],
          line_attributions: params[6],
          tenant_id: params[7]
        };
        edits.push(row);
        return { rows: [row] };
      }
      if (s.indexOf('SELECT') === 0 && s.indexOf('FROM FEATURE_EDITS') > -1) {
        var featureId = params[0];
        var tenantId  = params[1];
        // Real SQL is ORDER BY timestamp ASC -- sort explicitly here rather
        // than relying on insertion order, so this fake pool stays a
        // meaningful stand-in for that ordering guarantee.
        var matched = edits
          .filter(function (e) { return e.feature_id === featureId && e.tenant_id === tenantId; })
          .sort(function (a, b) { return a.timestamp < b.timestamp ? -1 : (a.timestamp > b.timestamp ? 1 : 0); });
        return { rows: matched };
      }
      return { rows: [] };
    }
  };
}

async function testRecordEditCreatesRowWithAttribution() {
  var pool = makeFakePool();
  await migrateFeatureEditsSchema(pool);

  var lineAttributions = { 1: 'user-susan', 2: 'user-susan', 4: 'user-darren', 5: 'user-darren' };
  var record = await recordEdit(pool, {
    featureId: 'feat-a1-uuid',
    artefactName: 's1',
    userId: 'user-susan',
    operation: 'merge',
    content: 'merged content here',
    mergedWith: ['user-susan', 'user-darren'],
    lineAttributions: lineAttributions,
    tenantId: 'tenant-test-123'
  });

  assert.strictEqual(record.operation, 'merge');
  assert.deepStrictEqual(JSON.parse(record.line_attributions), lineAttributions);
  assert.deepStrictEqual(JSON.parse(record.merged_with), ['user-susan', 'user-darren']);
  assert.strictEqual(record.tenant_id, 'tenant-test-123');
}

async function testEditHashIsRealSha256Hex() {
  var pool = makeFakePool();
  await migrateFeatureEditsSchema(pool);

  var record = await recordEdit(pool, {
    featureId: 'feat-a1-uuid',
    artefactName: 's1',
    userId: 'user-susan',
    operation: 'merge',
    content: 'merged content here',
    mergedWith: ['user-susan', 'user-darren'],
    lineAttributions: { 1: 'user-susan' },
    tenantId: 'tenant-test-123'
  });

  assert.strictEqual(typeof record.edit_hash, 'string');
  assert.strictEqual(record.edit_hash.length, 64, 'edit_hash must be a 64-character SHA-256 hex digest');
  assert.ok(/^[0-9a-f]{64}$/.test(record.edit_hash), 'edit_hash must be lowercase hex');
}

async function testRecordEditSavePathHasNullMergedWithAndLineAttributions() {
  // The common, non-concurrent path (Task 5): operation='save', no
  // mergedWith, no lineAttributions.
  var pool = makeFakePool();
  await migrateFeatureEditsSchema(pool);

  var record = await recordEdit(pool, {
    featureId: 'feat-a1-uuid',
    artefactName: 's1',
    userId: 'user-susan',
    operation: 'save',
    content: 'plain save, no merge'
    // mergedWith and lineAttributions intentionally omitted
  , tenantId: 'tenant-test-123' });

  assert.strictEqual(record.operation, 'save');
  assert.strictEqual(record.merged_with, null, 'merged_with must be null when mergedWith is not supplied');
  assert.strictEqual(record.line_attributions, null, 'line_attributions must be null when lineAttributions is not supplied');
}

async function testTenantIsolationOnQuery() {
  var pool = makeFakePool();
  await migrateFeatureEditsSchema(pool);
  await recordEdit(pool, { featureId: 'feat-a1-uuid', artefactName: 's1', userId: 'u1', operation: 'merge', content: 'x', mergedWith: [], lineAttributions: {}, tenantId: 'tenant-a' });
  await recordEdit(pool, { featureId: 'feat-a1-uuid', artefactName: 's1', userId: 'u2', operation: 'merge', content: 'y', mergedWith: [], lineAttributions: {}, tenantId: 'tenant-b' });

  var tenantARows = await listEditsForFeature(pool, 'feat-a1-uuid', 'tenant-a');
  assert.strictEqual(tenantARows.length, 1, 'tenant A query must not see tenant B\'s edit records');
  assert.strictEqual(tenantARows[0].tenant_id, 'tenant-a');
}

async function testListEditsReturnsOldestFirst() {
  var pool = makeFakePool();
  await migrateFeatureEditsSchema(pool);
  await recordEdit(pool, { featureId: 'feat-ordering', artefactName: 's1', userId: 'u1', operation: 'save', content: 'first', tenantId: 'tenant-order' });
  await recordEdit(pool, { featureId: 'feat-ordering', artefactName: 's1', userId: 'u2', operation: 'save', content: 'second', tenantId: 'tenant-order' });
  await recordEdit(pool, { featureId: 'feat-ordering', artefactName: 's1', userId: 'u3', operation: 'save', content: 'third', tenantId: 'tenant-order' });

  var list = await listEditsForFeature(pool, 'feat-ordering', 'tenant-order');
  assert.strictEqual(list.length, 3);
  assert.strictEqual(list[0].user_id, 'u1');
  assert.strictEqual(list[1].user_id, 'u2');
  assert.strictEqual(list[2].user_id, 'u3');
}

async function testListEditsEmptyStateReturnsEmptyArray() {
  var pool = makeFakePool();
  await migrateFeatureEditsSchema(pool);
  var list = await listEditsForFeature(pool, 'feat-with-no-edits', 'tenant-empty');
  assert.deepStrictEqual(list, []);
}

async function main() {
  await testRecordEditCreatesRowWithAttribution();
  console.log('  ok - recordEdit creates a row with operation=merge and correct lineAttributions JSON');
  await testEditHashIsRealSha256Hex();
  console.log('  ok - recordEdit sets edit_hash to a real 64-char SHA-256 hex digest');
  await testRecordEditSavePathHasNullMergedWithAndLineAttributions();
  console.log('  ok - recordEdit save path (no mergedWith/lineAttributions) stores null for both');
  await testTenantIsolationOnQuery();
  console.log('  ok - listEditsForFeature respects tenant isolation (ADR-025)');
  await testListEditsReturnsOldestFirst();
  console.log('  ok - listEditsForFeature returns oldest first');
  await testListEditsEmptyStateReturnsEmptyArray();
  console.log('  ok - listEditsForFeature empty state returns []');
}
main().catch(function (err) { console.error('FAIL:', err.message); process.exitCode = 1; });
