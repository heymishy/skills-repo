#!/usr/bin/env node
/**
 * check-ep1-s1-pod-creation.js
 *
 * Unit + integration tests for ep1-s1: Create Pod UI and Backend.
 * AC1 (happy path), AC2 (duplicate name rejection), AC3 (invalid role
 * rejection), plus tenant-isolation and member-insertion-atomicity
 * integration tests from the test plan.
 *
 * Run: node tests/check-ep1-s1-pod-creation.js
 */
'use strict';

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}
function eq(a, b, label) {
  if (a === b) { console.log('  ✓ ' + label); passed++; }
  else {
    console.log('  ✗ ' + label + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
    failed++;
  }
}

/** Minimal fake pg-Pool-shaped object backing pods/pod_members in memory. */
function makeFakePool() {
  const pods = [];
  const podMembers = [];
  let nextPodId = 1;
  let nextMemberId = 1;
  return {
    pods, podMembers,
    query: async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('CREATE TABLE') === 0) return { rows: [] };
      if (s.indexOf('SELECT') === 0 && s.indexOf('FROM PODS') !== -1 && s.indexOf('POD_MEMBERS') === -1) {
        const [tenantId, name] = params;
        const rows = pods.filter(p => p.tenant_id === tenantId && (name === undefined || p.name === name));
        return { rows };
      }
      if (s.indexOf('INSERT INTO PODS') === 0) {
        const [podId, tenantId, name, createdBy] = params;
        pods.push({ pod_id: podId, tenant_id: tenantId, name, created_by: createdBy, status: 'active' });
        return { rows: [] };
      }
      if (s.indexOf('INSERT INTO POD_MEMBERS') === 0) {
        const [podId, userId, roleId] = params;
        podMembers.push({ id: nextMemberId++, pod_id: podId, user_id: userId, role_id: roleId, status: 'active' });
        return { rows: [] };
      }
      if (s.indexOf('SELECT') === 0 && s.indexOf('POD_MEMBERS') !== -1) {
        const [podId] = params;
        return { rows: podMembers.filter(m => m.pod_id === podId) };
      }
      return { rows: [] };
    }
  };
}

async function run() {
  const { migratePodsSchema, createPod, findPodByName, isValidRole, VALID_ROLES } = require('../src/web-ui/modules/pod-store');

  // --- Part 1: pod-store.js ---
  {
    const pool = makeFakePool();
    await migratePodsSchema(pool);
    ok(true, 'migratePodsSchema resolves without throwing (schema bootstrap)');

    ok(isValidRole('conductor'), 'isValidRole: conductor is valid');
    ok(isValidRole('engineer'), 'isValidRole: engineer is valid');
    ok(!isValidRole('wizard'), 'isValidRole: wizard is NOT valid');
    eq(VALID_ROLES.join(','), 'conductor,engineer,architect,product', 'VALID_ROLES matches the signed-off AC3 role set exactly');

    const created = await createPod(pool, {
      tenantId: 'tenant-test-123',
      name: 'Core Platform Test Run 1',
      createdBy: 'hamish-uuid',
      members: [
        { userId: 'hamish-uuid', roleId: 'conductor' },
        { userId: 'susan-uuid', roleId: 'engineer' },
        { userId: 'darren-uuid', roleId: 'engineer' }
      ]
    });
    ok(created.podId, 'createPod: returns a podId');
    eq(created.memberCount, 3, 'createPod: memberCount is 3');
    eq(pool.pods.length, 1, 'createPod: one row written to pods');
    eq(pool.podMembers.length, 3, 'createPod: three rows written to pod_members');

    const found = await findPodByName(pool, 'tenant-test-123', 'Core Platform Test Run 1');
    ok(found, 'findPodByName: finds the just-created pod');
  }

  // --- Part 2: routes/pods.js — AC1 happy path ---
  {
    const { handlePostPodsCreate } = require('../src/web-ui/routes/pods');
    const pool = makeFakePool();
    const { migratePodsSchema } = require('../src/web-ui/modules/pod-store');
    await migratePodsSchema(pool);

    const body = {
      name: 'Core Platform',
      members: [
        { userId: 'hamish-uuid', roleId: 'conductor' },
        { userId: 'susan-uuid', roleId: 'engineer' },
        { userId: 'darren-uuid', roleId: 'engineer' }
      ]
    };
    const req = { session: { tenantId: 'tenant-test-123' } };
    let statusCode = null, responseBody = null;
    const res = {
      writeHead: function(status) { statusCode = status; },
      end: function(payload) { responseBody = JSON.parse(payload); }
    };

    await handlePostPodsCreate(req, res, pool, body);
    eq(statusCode, 200, 'AC1: happy path returns HTTP 200');
    eq(responseBody.name, 'Core Platform', 'AC1: response includes the pod name');
    eq(responseBody.memberCount, 3, 'AC1: response memberCount is 3');
    ok(responseBody.podId, 'AC1: response includes a podId');
  }

  // --- Part 3: routes/pods.js — AC2 duplicate name rejection ---
  {
    const { handlePostPodsCreate } = require('../src/web-ui/routes/pods');
    const pool = makeFakePool();
    const { migratePodsSchema } = require('../src/web-ui/modules/pod-store');
    await migratePodsSchema(pool);

    const req = { session: { tenantId: 'tenant-test-123' } };
    const firstBody = { name: 'Core Platform Duplicate Test', members: [{ userId: 'hamish-uuid', roleId: 'conductor' }] };
    await handlePostPodsCreate(req, { writeHead: function() {}, end: function() {} }, pool, firstBody);
    eq(pool.pods.length, 1, 'AC2 setup: first pod created (count is 1)');

    let statusCode = null, responseBody = null;
    const res = { writeHead: function(s) { statusCode = s; }, end: function(p) { responseBody = JSON.parse(p); } };
    await handlePostPodsCreate(req, res, pool, firstBody);

    eq(statusCode, 400, 'AC2: duplicate name returns HTTP 400');
    eq(responseBody.error, "A pod named 'Core Platform Duplicate Test' already exists", 'AC2: error message names the pod');
    eq(pool.pods.length, 1, 'AC2: no new row written to pods (count still 1)');
    eq(pool.podMembers.length, 1, 'AC2: no pod_members rows created by the rejected attempt');
  }

  // --- Part 3b: routes/pods.js — AC2 race-condition safety net (unique constraint violation) ---
  {
    const { handlePostPodsCreate } = require('../src/web-ui/routes/pods');
    const pool = makeFakePool();
    const { migratePodsSchema } = require('../src/web-ui/modules/pod-store');
    await migratePodsSchema(pool);

    // Simulate a genuine race via a "phantom" duplicate set that is
    // consulted only by the INSERT path (never by the SELECT path that
    // findPodByName uses). This lets the pre-check (findPodByName) miss the
    // duplicate -- exactly as it would in a real race, where the other
    // concurrent request's row does not exist yet at SELECT-time but lands
    // by the time this request's own INSERT runs -- while the INSERT still
    // hits a Postgres-shaped unique-violation error (code 23505). Using
    // pool.pods directly for this (as an initial draft of this test did)
    // would make findPodByName's own pre-check catch the duplicate first,
    // which would make the route handler return 400 via the pre-check
    // branch instead of the catch-block safety net this test exists to
    // prove -- defeating the purpose of the test.
    const raceNames = new Set();
    const originalQuery = pool.query.bind(pool);
    pool.query = async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('INSERT INTO PODS') === 0) {
        const [, tenantId, name] = params;
        if (raceNames.has(tenantId + '::' + name)) {
          const err = new Error('duplicate key value violates unique constraint "pods_tenant_id_name_key"');
          err.code = '23505';
          throw err;
        }
      }
      return originalQuery(sql, params);
    };

    // --- First: exercise createPod directly (the lower-level function) to
    // confirm it translates the raw 23505 into a clean, recognizable error.
    raceNames.add('tenant-race-test::Race Test Pod');
    const { createPod } = require('../src/web-ui/modules/pod-store');
    let caught = null;
    try {
      await createPod(pool, { tenantId: 'tenant-race-test', name: 'Race Test Pod', createdBy: 'racer-uuid', members: [{ userId: 'racer-uuid', roleId: 'conductor' }] });
    } catch (e) {
      caught = e;
    }
    ok(caught && caught.code === 'POD_NAME_TAKEN', 'Race safety net: createPod translates a 23505 unique-violation into a recognizable POD_NAME_TAKEN error (not a raw DB error)');
    eq(pool.pods.length, 0, 'Race safety net: no pod row was left behind by the failed createPod call');

    // --- Second: exercise the full HTTP path. findPodByName's pre-check
    // will miss this (pool.pods has no row for this tenant/name -- nothing
    // was ever committed), so handlePostPodsCreate proceeds to call
    // createPod, which is where the race actually bites.
    raceNames.add('tenant-race-test-2::Race Test Pod 2');
    const req2 = { session: { tenantId: 'tenant-race-test-2' } };
    let statusCode = null, responseBody = null;
    const res2 = { writeHead: function(s) { statusCode = s; }, end: function(p) { responseBody = JSON.parse(p); } };
    await handlePostPodsCreate(req2, res2, pool, { name: 'Race Test Pod 2', members: [{ userId: 'racer-uuid', roleId: 'conductor' }] });
    eq(statusCode, 400, 'Race safety net: handlePostPodsCreate returns 400 (not an unhandled 500) when the DB constraint catches a raced duplicate');
    eq(responseBody.error, "A pod named 'Race Test Pod 2' already exists", 'Race safety net: same clean AC2 error message shape as the pre-check path');
  }

  // --- Part 4: routes/pods.js — AC3 invalid role rejection ---
  {
    const { handlePostPodsCreate } = require('../src/web-ui/routes/pods');
    const pool = makeFakePool();
    const { migratePodsSchema } = require('../src/web-ui/modules/pod-store');
    await migratePodsSchema(pool);

    const req = { session: { tenantId: 'tenant-test-123' } };
    const body = { name: 'Invalid Role Test Pod', members: [{ userId: 'hamish-uuid', roleId: 'wizard' }] };
    let statusCode = null, responseBody = null;
    const res = { writeHead: function(s) { statusCode = s; }, end: function(p) { responseBody = JSON.parse(p); } };
    await handlePostPodsCreate(req, res, pool, body);

    eq(statusCode, 400, 'AC3: invalid role returns HTTP 400');
    eq(responseBody.error, "Invalid role: 'wizard'. Valid roles are: conductor, engineer, architect, product", 'AC3: error names the invalid role and lists valid ones');
    eq(pool.pods.length, 0, 'AC3: no pod row created (count is 0)');
    eq(pool.podMembers.length, 0, 'AC3: no pod_members rows created');
  }

  // --- Part 5: integration — tenant isolation + member-insertion atomicity ---
  {
    const { handlePostPodsCreate, handleGetPods } = require('../src/web-ui/routes/pods');
    const pool = makeFakePool();
    const { migratePodsSchema } = require('../src/web-ui/modules/pod-store');
    await migratePodsSchema(pool);

    const reqA = { session: { tenantId: 'tenant-A' } };
    const reqB = { session: { tenantId: 'tenant-B' } };
    await handlePostPodsCreate(reqA, { writeHead: function() {}, end: function() {} }, pool, { name: 'Platform A', members: [{ userId: 'u1', roleId: 'conductor' }] });
    await handlePostPodsCreate(reqB, { writeHead: function() {}, end: function() {} }, pool, { name: 'Platform B', members: [{ userId: 'u2', roleId: 'conductor' }] });

    let bodyA = null, bodyB = null;
    await handleGetPods(reqA, { writeHead: function() {}, end: function(p) { bodyA = JSON.parse(p); } }, pool);
    await handleGetPods(reqB, { writeHead: function() {}, end: function(p) { bodyB = JSON.parse(p); } }, pool);

    eq(bodyA.pods.length, 1, 'Tenant isolation: tenant A sees exactly 1 pod');
    eq(bodyA.pods[0].name, 'Platform A', "Tenant isolation: tenant A's pod is Platform A");
    eq(bodyB.pods.length, 1, 'Tenant isolation: tenant B sees exactly 1 pod');
    eq(bodyB.pods[0].name, 'Platform B', "Tenant isolation: tenant B's pod is Platform B");

    // Both tenants can reuse the same pod name without conflict (isolated by tenant).
    let sameNameStatus = null;
    await handlePostPodsCreate(reqB, { writeHead: function(s) { sameNameStatus = s; }, end: function() {} }, pool, { name: 'Platform A', members: [{ userId: 'u3', roleId: 'conductor' }] });
    eq(sameNameStatus, 200, 'Tenant isolation: tenant B can create a pod named "Platform A" (no cross-tenant collision)');

    // Member-insertion atomicity: all 3 members land, no orphans.
    const pool2 = makeFakePool();
    await migratePodsSchema(pool2);
    await handlePostPodsCreate({ session: { tenantId: 'tenant-test-123' } }, { writeHead: function() {}, end: function() {} }, pool2, {
      name: 'Atomicity Test Pod',
      members: [{ userId: 'a', roleId: 'conductor' }, { userId: 'b', roleId: 'engineer' }, { userId: 'c', roleId: 'engineer' }]
    });
    eq(pool2.pods.length, 1, 'Atomicity: exactly 1 pod row');
    eq(pool2.podMembers.length, 3, 'Atomicity: all 3 member rows present, none orphaned');
  }

  console.log(`\n[ep1-s1] ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
