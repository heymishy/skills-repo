// tests/check-ep4-s1-multi-pod-assign.js
'use strict';
const assert = require('assert');
const { createFakeTestDb } = require('../src/web-ui/adapters/fake-test-db');
const podStore = require('../src/web-ui/modules/pod-store');
const podAssignmentStore = require('../src/web-ui/modules/pod-assignment-store');
const collabStore = require('../src/web-ui/modules/feature-collaborator-store');
const products = require('../src/web-ui/routes/products');

// ep4-s1: handlePostAssignFeaturePods/handleDeleteFeaturePodMember are
// csrfGuard'd (see src/web-ui/middleware/csrf.js) -- every request through
// those two handlers needs a matching session.csrfToken/body._csrf pair,
// same pattern as tests/check-a1-modules-taxonomy-crud.js.
const TEST_CSRF = 'test-csrf-token';

let passed = 0, failed = 0;
function check(name, fn) {
  return fn().then(() => { console.log('  ✓ ' + name); passed++; })
    .catch(err => { console.log('  ✗ ' + name + ' -- ' + err.message); failed++; });
}

function makeRes() {
  var res = { statusCode: null, body: null };
  res.writeHead = function(code) { res.statusCode = code; };
  res.end = function(str) { res.body = JSON.parse(str); };
  return res;
}

async function main() {
  const db = createFakeTestDb();
  await podStore.migratePodsSchema(db);
  await podAssignmentStore.migratePodAssignmentsSchema(db);
  await collabStore.migrateFeatureCollaboratorsSchema(db);
  await collabStore.migrateFeatureCollaboratorRemovalsSchema(db);

  await db.query("INSERT INTO products (product_id, tenant_id, name) VALUES ($1,$2,$3)", ['prod-1', 't1', 'Product One']).catch(() => {});
  db._upsertJourney({ journey_id: 'feat-a2', tenant_id: 't1', product_id: 'prod-1', feature_slug: 'feat-a2', stage: 'definition', active_session_id: null });

  const core = await podStore.createPod(db, { tenantId: 't1', name: 'Core Platform Pod', createdBy: 'hamish', members: [
    { userId: 'hamish', roleId: 'conductor' }, { userId: 'susan', roleId: 'engineer' }, { userId: 'darren', roleId: 'engineer' }
  ] });
  const data = await podStore.createPod(db, { tenantId: 't1', name: 'Data Analytics Pod', createdBy: 'hamish', members: [
    { userId: 'alice', roleId: 'architect' }, { userId: 'bob', roleId: 'engineer' }
  ] });

  const session = { tenantId: 't1', login: 'hamish', userId: 'hamish', accessToken: 'tok', csrfToken: TEST_CSRF };

  await check('AC1: GET pods view-model lists both pods, none assigned yet', async () => {
    var req = { params: { productId: 'prod-1', featureId: 'feat-a2' }, session: session };
    var res = makeRes();
    await products.handleGetFeaturePods(req, res, null, db);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.orgPods.length, 2);
    assert.strictEqual(res.body.assignedPods.length, 0);
  });

  var assignedCollaborators;
  await check('AC1 + AC3: POST assigns both pods, feature_collaborators is the full union', async () => {
    var req = { params: { productId: 'prod-1', featureId: 'feat-a2' }, session: session, body: { podIds: [core.podId, data.podId], _csrf: TEST_CSRF } };
    var res = makeRes();
    await products.handlePostAssignFeaturePods(req, res, null, db);
    assert.strictEqual(res.statusCode, 200);
    assignedCollaborators = res.body.collaborators;
    assert.strictEqual(assignedCollaborators.length, 5);
    assert.ok(['hamish', 'susan', 'darren', 'alice', 'bob'].every((u) => assignedCollaborators.some((c) => c.userId === u)));
  });

  await check('AC2: DELETE removes Bob for this feature only, not from pod_members', async () => {
    var req = { params: { productId: 'prod-1', featureId: 'feat-a2', userId: 'bob' }, session: session, body: { _csrf: TEST_CSRF } };
    var res = makeRes();
    await products.handleDeleteFeaturePodMember(req, res, null, db);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(!res.body.collaborators.some((c) => c.userId === 'bob'));
    var podMembersRows = (await db.query('SELECT user_id FROM pod_members WHERE pod_id = $1', [data.podId])).rows;
    assert.ok(podMembersRows.some((r) => r.user_id === 'bob'), 'Bob must remain a real Data Analytics Pod member globally');
  });

  await check('AC3: feature_collaborators is exactly the union minus Bob (Hamish, Susan, Darren, Alice)', async () => {
    var req = { params: { productId: 'prod-1', featureId: 'feat-a2' }, session: session };
    var res = makeRes();
    await products.handleGetFeaturePods(req, res, null, db);
    var userIds = res.body.collaborators.map((c) => c.userId).sort();
    assert.deepStrictEqual(userIds, ['alice', 'darren', 'hamish', 'susan']);
  });

  await check('Removal-resurrection guard: re-assigning the same pods does not bring Bob back', async () => {
    var req = { params: { productId: 'prod-1', featureId: 'feat-a2' }, session: session, body: { podIds: [core.podId, data.podId], _csrf: TEST_CSRF } };
    var res = makeRes();
    await products.handlePostAssignFeaturePods(req, res, null, db);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(!res.body.collaborators.some((c) => c.userId === 'bob'), 'Bob must stay removed across a re-save of the same pods');
    assert.strictEqual(res.body.collaborators.length, 4);
  });

  await check('Tenant isolation: a pod from a different tenant is rejected', async () => {
    var otherTenantPod = await podStore.createPod(db, { tenantId: 't2', name: 'Other Tenant Pod', createdBy: 'x', members: [] });
    var req = { params: { productId: 'prod-1', featureId: 'feat-a2' }, session: session, body: { podIds: [otherTenantPod.podId], _csrf: TEST_CSRF } };
    var res = makeRes();
    await products.handlePostAssignFeaturePods(req, res, null, db);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(/no pod found/i.test(res.body.error));
  });

  await check('Tenant isolation: a feature belonging to another tenant 404s', async () => {
    db._upsertJourney({ journey_id: 'feat-b1', tenant_id: 't2', product_id: 'prod-2', feature_slug: 'feat-b1', stage: 'definition', active_session_id: null });
    var req = { params: { productId: 'prod-1', featureId: 'feat-b1' }, session: session };
    var res = makeRes();
    await products.handleGetFeaturePods(req, res, null, db);
    assert.strictEqual(res.statusCode, 404);
  });

  console.log('\n[check-ep4-s1-multi-pod-assign] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

main();
