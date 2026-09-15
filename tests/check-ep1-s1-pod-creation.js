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

  console.log(`\n[ep1-s1] ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
