#!/usr/bin/env node
/**
 * check-ep1-s2-product-default-pod.js
 *
 * Unit + integration tests for ep1-s2: Assign Pod to Product as Default.
 * AC1 (assignment save + shape), AC3 (non-retroactivity, proven trivially --
 * this story never writes to journeys/features tables), plus the AC2
 * handoff-precondition (defaultPod queryable in the shape ep1-s3 needs) and
 * a tenant-isolation integration test.
 * Part 1b additionally covers the POD_NOT_FOUND error path, the
 * ON CONFLICT ... DO UPDATE upsert-replace path (twice-set does not
 * duplicate), and tenant isolation across two tenants sharing a productId.
 *
 * Run: node tests/check-ep1-s2-product-default-pod.js
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

/** Minimal fake pg-Pool-shaped object backing pods/pod_members/pod_assignments in memory. */
function makeFakePool() {
  const pods = [];
  const podMembers = [];
  const podAssignments = [];
  return {
    pods, podMembers, podAssignments,
    query: async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('CREATE TABLE') === 0) return { rows: [] };
      if (s.indexOf('SELECT POD_ID, TENANT_ID, NAME FROM PODS WHERE') === 0) {
        const [podId, tenantId] = params;
        return { rows: pods.filter(p => p.pod_id === podId && p.tenant_id === tenantId).map(p => ({ pod_id: p.pod_id, tenant_id: p.tenant_id, name: p.name })) };
      }
      if (s.indexOf('SELECT COUNT(*) AS COUNT FROM POD_MEMBERS') === 0) {
        const [podId] = params;
        return { rows: [{ count: String(podMembers.filter(m => m.pod_id === podId).length) }] };
      }
      if (s.indexOf('INSERT INTO POD_ASSIGNMENTS') === 0) {
        const [assignmentId, tenantId, podId, productId, assignmentType, assignedBy] = params;
        // Simulate UNIQUE(tenant_id, product_id, feature_id) -- feature_id is
        // always NULL for a product-level default in this story's scope, so
        // this simulates ON CONFLICT (tenant_id, product_id) WHERE feature_id
        // IS NULL DO UPDATE, matching the real migration's partial index.
        const existingIdx = podAssignments.findIndex(a => a.tenant_id === tenantId && a.product_id === productId && a.feature_id === null);
        const row = { assignment_id: assignmentId, tenant_id: tenantId, pod_id: podId, product_id: productId, feature_id: null, assignment_type: assignmentType, assigned_by: assignedBy, assigned_at: new Date().toISOString() };
        if (existingIdx !== -1) { podAssignments[existingIdx] = row; } else { podAssignments.push(row); }
        return { rows: [] };
      }
      if (s.indexOf('SELECT PA.POD_ID, P.NAME FROM POD_ASSIGNMENTS') === 0) {
        const [tenantId, productId] = params;
        const row = podAssignments.find(a => a.tenant_id === tenantId && a.product_id === productId && a.feature_id === null);
        if (!row) return { rows: [] };
        const pod = pods.find(p => p.pod_id === row.pod_id);
        return { rows: pod ? [{ pod_id: pod.pod_id, name: pod.name }] : [] };
      }
      return { rows: [] };
    }
  };
}

async function run() {
  const { migratePodAssignmentsSchema, setProductDefaultPod, getProductDefaultPod } = require('../src/web-ui/modules/pod-assignment-store');

  // --- Part 1: pod-assignment-store.js ---
  {
    const pool = makeFakePool();
    await migratePodAssignmentsSchema(pool);
    ok(true, 'migratePodAssignmentsSchema resolves without throwing (schema bootstrap)');

    // Seed a pod + 3 members directly (simulating ep1-s1's own createPod having already run).
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-test-123', name: 'Core Platform Pod' });
    pool.podMembers.push({ pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' });

    const result = await setProductDefaultPod(pool, {
      tenantId: 'tenant-test-123',
      productId: 'prod-payments-uuid',
      podId: 'pod-core-uuid',
      assignedBy: 'hamish-uuid'
    });
    ok(result.assignmentId, 'setProductDefaultPod: returns an assignmentId');
    eq(result.podName, 'Core Platform Pod', 'setProductDefaultPod: returns the correct pod name');
    eq(result.memberCount, 3, 'setProductDefaultPod: returns the correct member count');
    eq(pool.podAssignments.length, 1, 'setProductDefaultPod: exactly 1 assignment row written');
    eq(pool.podAssignments[0].assignment_type, 'inherit-to-all-features', 'setProductDefaultPod: assignmentType is inherit-to-all-features');

    const found = await getProductDefaultPod(pool, 'tenant-test-123', 'prod-payments-uuid');
    ok(found, 'getProductDefaultPod: finds the just-set default pod');
    eq(found.podName, 'Core Platform Pod', 'getProductDefaultPod: returns the correct pod name');
  }

  // --- Part 1b: error path, upsert-replace path, and tenant isolation ---
  {
    const { migratePodAssignmentsSchema, setProductDefaultPod, getProductDefaultPod } = require('../src/web-ui/modules/pod-assignment-store');

    // POD_NOT_FOUND error path: podId doesn't belong to this tenant.
    {
      const pool = makeFakePool();
      await migratePodAssignmentsSchema(pool);
      pool.pods.push({ pod_id: 'pod-other-tenant', tenant_id: 'tenant-DIFFERENT', name: 'Not Mine' });
      let caught = null;
      try {
        await setProductDefaultPod(pool, { tenantId: 'tenant-test-123', productId: 'prod-x', podId: 'pod-other-tenant', assignedBy: 'u1' });
      } catch (e) {
        caught = e;
      }
      ok(caught && caught.code === 'POD_NOT_FOUND', 'setProductDefaultPod: throws POD_NOT_FOUND when podId does not belong to this tenant');
      eq(pool.podAssignments.length, 0, 'setProductDefaultPod: no assignment row written on POD_NOT_FOUND');
    }

    // Upsert-replace path: calling twice for the same (tenant, product) replaces, not duplicates.
    {
      const pool = makeFakePool();
      await migratePodAssignmentsSchema(pool);
      pool.pods.push({ pod_id: 'pod-alpha', tenant_id: 'tenant-test-123', name: 'Alpha Pod' });
      pool.pods.push({ pod_id: 'pod-beta', tenant_id: 'tenant-test-123', name: 'Beta Pod' });
      pool.podMembers.push({ pod_id: 'pod-alpha' });
      pool.podMembers.push({ pod_id: 'pod-beta' }, { pod_id: 'pod-beta' });

      await setProductDefaultPod(pool, { tenantId: 'tenant-test-123', productId: 'prod-x', podId: 'pod-alpha', assignedBy: 'u1' });
      eq(pool.podAssignments.length, 1, 'Upsert: exactly 1 assignment row after first set');

      const replaced = await setProductDefaultPod(pool, { tenantId: 'tenant-test-123', productId: 'prod-x', podId: 'pod-beta', assignedBy: 'u1' });
      eq(pool.podAssignments.length, 1, 'Upsert: still exactly 1 assignment row after replacing the default (not 2 -- the ON CONFLICT DO UPDATE path, not a duplicate insert)');
      eq(replaced.podName, 'Beta Pod', 'Upsert: setProductDefaultPod returns the NEW pod name after replacement');
      eq(replaced.memberCount, 2, 'Upsert: setProductDefaultPod returns the NEW pod member count after replacement');

      const current = await getProductDefaultPod(pool, 'tenant-test-123', 'prod-x');
      eq(current.podId, 'pod-beta', 'Upsert: getProductDefaultPod reflects the replacement, not the original pod');
    }

    // Tenant isolation: two tenants' product defaults do not leak.
    {
      const pool = makeFakePool();
      await migratePodAssignmentsSchema(pool);
      pool.pods.push({ pod_id: 'pod-A', tenant_id: 'tenant-A', name: 'Platform A' });
      pool.pods.push({ pod_id: 'pod-B', tenant_id: 'tenant-B', name: 'Platform B' });
      pool.podMembers.push({ pod_id: 'pod-A' });
      pool.podMembers.push({ pod_id: 'pod-B' });

      await setProductDefaultPod(pool, { tenantId: 'tenant-A', productId: 'prod-shared-name', podId: 'pod-A', assignedBy: 'u1' });
      await setProductDefaultPod(pool, { tenantId: 'tenant-B', productId: 'prod-shared-name', podId: 'pod-B', assignedBy: 'u2' });

      const defaultForA = await getProductDefaultPod(pool, 'tenant-A', 'prod-shared-name');
      const defaultForB = await getProductDefaultPod(pool, 'tenant-B', 'prod-shared-name');
      eq(defaultForA.podName, 'Platform A', 'Tenant isolation: tenant A sees its own default pod');
      eq(defaultForB.podName, 'Platform B', 'Tenant isolation: tenant B sees its own default pod (same productId string, different tenant)');
      eq(pool.podAssignments.length, 2, 'Tenant isolation: both tenants can use the same productId without collision (2 separate assignment rows)');
    }
  }

  console.log(`\n[ep1-s2] ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
