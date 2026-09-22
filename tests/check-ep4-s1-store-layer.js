// tests/check-ep4-s1-store-layer.js
'use strict';
const assert = require('assert');
const { createFakeTestDb } = require('../src/web-ui/adapters/fake-test-db');
const podStore = require('../src/web-ui/modules/pod-store');
const podAssignmentStore = require('../src/web-ui/modules/pod-assignment-store');
const collabStore = require('../src/web-ui/modules/feature-collaborator-store');

let passed = 0, failed = 0;
function check(name, fn) {
  return fn().then(() => { console.log('  ✓ ' + name); passed++; })
    .catch(err => { console.log('  ✗ ' + name + ' -- ' + err.message); failed++; });
}

async function main() {
  const db = createFakeTestDb();
  await podStore.migratePodsSchema(db);
  await podAssignmentStore.migratePodAssignmentsSchema(db);
  await collabStore.migrateFeatureCollaboratorsSchema(db);
  await collabStore.migrateFeatureCollaboratorRemovalsSchema(db);

  const core = await podStore.createPod(db, { tenantId: 't1', name: 'Core Platform Pod', createdBy: 'hamish', members: [
    { userId: 'hamish', roleId: 'conductor' }, { userId: 'susan', roleId: 'engineer' }, { userId: 'darren', roleId: 'engineer' }
  ] });
  const data = await podStore.createPod(db, { tenantId: 't1', name: 'Data Analytics Pod', createdBy: 'hamish', members: [
    { userId: 'alice', roleId: 'architect' }, { userId: 'bob', roleId: 'engineer' }
  ] });

  await check('assignPodsToFeature inserts one pod_assignments row per pod', async () => {
    const result = await podAssignmentStore.assignPodsToFeature(db, {
      tenantId: 't1', featureId: 'feat-a2', productId: 'prod-1', podIds: [core.podId, data.podId], assignedBy: 'hamish'
    });
    assert.strictEqual(result.assignmentIds.length, 2);
  });

  await check('getFeaturePodAssignments returns both assigned pods', async () => {
    const rows = await podAssignmentStore.getFeaturePodAssignments(db, 't1', 'feat-a2');
    assert.strictEqual(rows.length, 2);
    assert.ok(rows.some(r => r.podName === 'Core Platform Pod'));
    assert.ok(rows.some(r => r.podName === 'Data Analytics Pod'));
  });

  await check('assignPodsToFeature rejects a podId from another tenant', async () => {
    let threw = false;
    try {
      await podAssignmentStore.assignPodsToFeature(db, { tenantId: 't2', featureId: 'feat-b1', productId: 'prod-2', podIds: [core.podId], assignedBy: 'x' });
    } catch (err) { threw = err.code === 'POD_NOT_FOUND'; }
    assert.ok(threw, 'expected POD_NOT_FOUND for a pod belonging to a different tenant');
  });

  await check('populateFeatureCollaboratorsFromPods unions both pods with no duplicates', async () => {
    const result = await collabStore.populateFeatureCollaboratorsFromPods(db, { featureId: 'feat-a2', podIds: [core.podId, data.podId] });
    assert.strictEqual(result.addedCount, 5);
    const rows = await collabStore.getFeatureCollaborators(db, 'feat-a2');
    assert.strictEqual(rows.length, 5);
  });

  await check('removeFeatureCollaborator deletes the row and records a removal', async () => {
    await collabStore.removeFeatureCollaborator(db, { featureId: 'feat-a2', userId: 'bob', removedBy: 'hamish' });
    const rows = await collabStore.getFeatureCollaborators(db, 'feat-a2');
    assert.ok(!rows.some(r => r.userId === 'bob'), 'bob should be gone from feature_collaborators');
    const removals = await collabStore.getFeatureCollaboratorRemovals(db, 'feat-a2');
    assert.deepStrictEqual(removals, ['bob']);
  });

  await check('re-running populateFeatureCollaboratorsFromPods does not resurrect a removed member', async () => {
    await collabStore.populateFeatureCollaboratorsFromPods(db, { featureId: 'feat-a2', podIds: [core.podId, data.podId] });
    const rows = await collabStore.getFeatureCollaborators(db, 'feat-a2');
    assert.ok(!rows.some(r => r.userId === 'bob'), 'bob must stay removed across a re-assignment of the same pods');
    assert.strictEqual(rows.length, 4, 'exactly Hamish, Susan, Darren, Alice');
  });

  await check('pod_members is untouched by the removal (removal is feature-scoped only)', async () => {
    const memberRow = (await db.query('SELECT user_id, role_id FROM pod_members WHERE pod_id = $1', [data.podId])).rows;
    assert.ok(memberRow.some(r => r.user_id === 'bob'), 'bob must remain a real pod_members row globally');
  });

  console.log('\n[check-ep4-s1-store-layer] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

main();
