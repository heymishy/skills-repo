'use strict';
const assert = require('assert');
const { migrateFeatureEditsSchema, recordEdit, listEditsForFeature } = require('../src/web-ui/modules/feature-edits');

function makeFakePool() {
  var rows = [];
  var edits = [];
  return {
    _edits: edits,
    query: async function (sql, params) {
      var s = sql.toUpperCase();
      if (s.indexOf('CREATE TABLE') === 0) return { rows: [] };
      if (s.indexOf('INSERT INTO FEATURE_EDITS') === 0) {
        var row = {
          id: edits.length + 1,
          feature_id: params[0],
          artefact_name: params[1],
          user_id: params[2],
          timestamp: new Date().toISOString(),
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
        return { rows: edits.filter(function (e) { return e.feature_id === featureId && e.tenant_id === tenantId; }) };
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

async function testTenantIsolationOnQuery() {
  var pool = makeFakePool();
  await migrateFeatureEditsSchema(pool);
  await recordEdit(pool, { featureId: 'feat-a1-uuid', artefactName: 's1', userId: 'u1', operation: 'merge', content: 'x', mergedWith: [], lineAttributions: {}, tenantId: 'tenant-a' });
  await recordEdit(pool, { featureId: 'feat-a1-uuid', artefactName: 's1', userId: 'u2', operation: 'merge', content: 'y', mergedWith: [], lineAttributions: {}, tenantId: 'tenant-b' });

  var tenantARows = await listEditsForFeature(pool, 'feat-a1-uuid', 'tenant-a');
  assert.strictEqual(tenantARows.length, 1, 'tenant A query must not see tenant B\'s edit records');
  assert.strictEqual(tenantARows[0].tenant_id, 'tenant-a');
}

async function main() {
  await testRecordEditCreatesRowWithAttribution();
  console.log('  ok - recordEdit creates a row with operation=merge and correct lineAttributions JSON');
  await testTenantIsolationOnQuery();
  console.log('  ok - listEditsForFeature respects tenant isolation (ADR-025)');
}
main().catch(function (err) { console.error('FAIL:', err.message); process.exitCode = 1; });
