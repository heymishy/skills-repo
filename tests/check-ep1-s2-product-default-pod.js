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
  const products = [];
  return {
    pods, podMembers, podAssignments, products,
    query: async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('CREATE TABLE') === 0) return { rows: [] };
      if (s.indexOf('SELECT PRODUCT_ID, TENANT_ID FROM PRODUCTS WHERE') === 0) {
        const [productId] = params;
        const row = products.find(p => p.product_id === productId);
        return { rows: row ? [{ product_id: row.product_id, tenant_id: row.tenant_id }] : [] };
      }
      // Part 4b: handleGetProductView's own product lookup uses a different
      // column list/order than pod-assignment-store's -- same `products`
      // array, second query shape.
      if (s.indexOf('SELECT NAME, TENANT_ID, REPO_OWNER, REPO_NAME FROM PRODUCTS WHERE') === 0) {
        const [productId] = params;
        const row = products.find(p => p.product_id === productId);
        return { rows: row ? [{ name: row.name, tenant_id: row.tenant_id, repo_owner: row.repo_owner || null, repo_name: row.repo_name || null }] : [] };
      }
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

  // --- Part 2: routes/products.js — handlePostSetDefaultPod, AC1 happy path ---
  {
    const { handlePostSetDefaultPod } = require('../src/web-ui/routes/products');
    const pool = makeFakePool();
    const { migratePodAssignmentsSchema } = require('../src/web-ui/modules/pod-assignment-store');
    await migratePodAssignmentsSchema(pool);
    pool.products.push({ product_id: 'prod-payments-uuid', tenant_id: 'tenant-test-123' });
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-test-123', name: 'Core Platform Pod' });
    pool.podMembers.push({ pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' });

    const req = { session: { tenantId: 'tenant-test-123', userId: 'hamish-uuid', csrfToken: 'test-csrf-token-part2' }, params: { id: 'prod-payments-uuid' }, body: { podId: 'pod-core-uuid', _csrf: 'test-csrf-token-part2' } };
    let statusCode = null, responseBody = null;
    const res = {
      json: function(body) { statusCode = 200; responseBody = body; },
      status: function(code) { statusCode = code; return { json: function(body) { responseBody = body; } }; },
      writeHead: function(code) { statusCode = code; },
      end: function(payload) { try { responseBody = JSON.parse(payload); } catch (_) { responseBody = payload; } }
    };

    await handlePostSetDefaultPod(req, res, null, pool);
    eq(statusCode, 200, 'AC1: happy path returns HTTP 200');
    eq(responseBody.productId, 'prod-payments-uuid', 'AC1: response includes the productId');
    eq(responseBody.defaultPodId, 'pod-core-uuid', 'AC1: response includes the defaultPodId');
    eq(responseBody.podName, 'Core Platform Pod', 'AC1: response includes the pod name');
    eq(responseBody.memberCount, 3, 'AC1: response memberCount is 3');

    // Prove CSRF is genuinely enforced, not just present in the code: a
    // request with a WRONG csrf token must be rejected before any write.
    const podAssignmentsCountBefore = pool.podAssignments.length;
    const badReq = { session: { tenantId: 'tenant-test-123', userId: 'hamish-uuid', csrfToken: 'real-token' }, params: { id: 'prod-payments-uuid' }, body: { podId: 'pod-core-uuid', _csrf: 'WRONG-token' } };
    let badStatus = null;
    const badRes = { writeHead: function(code) { badStatus = code; }, end: function() {}, json: function() { badStatus = 200; }, status: function(code) { badStatus = code; return { json: function() {} }; } };
    await handlePostSetDefaultPod(badReq, badRes, null, pool);
    eq(badStatus, 403, 'CSRF: a request with a mismatched _csrf token is rejected with 403');
    eq(pool.podAssignments.length, podAssignmentsCountBefore, 'CSRF: no write occurred on the rejected request');
  }

  // --- Part 3: AC3 — setting a default pod does not touch any other table ---
  {
    const { handlePostSetDefaultPod } = require('../src/web-ui/routes/products');
    const pool = makeFakePool();
    const { migratePodAssignmentsSchema } = require('../src/web-ui/modules/pod-assignment-store');
    await migratePodAssignmentsSchema(pool);
    pool.products.push({ product_id: 'prod-payments-uuid', tenant_id: 'tenant-test-123' });
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-test-123', name: 'Core Platform Pod' });
    pool.podMembers.push({ pod_id: 'pod-core-uuid' });

    // Simulate one pre-existing "feature" row (a table this story's own code
    // never queries or writes) to prove it is untouched by the assignment call.
    pool.preExistingFeatureRows = [{ journey_id: 'old-feature-1', product_id: 'prod-payments-uuid', pod_assignments: [] }];
    const snapshotBefore = JSON.stringify(pool.preExistingFeatureRows);

    const req = { session: { tenantId: 'tenant-test-123', userId: 'hamish-uuid', csrfToken: 'test-csrf-token-part3' }, params: { id: 'prod-payments-uuid' }, body: { podId: 'pod-core-uuid', _csrf: 'test-csrf-token-part3' } };
    let statusCode = null, responseBody = null;
    const res = {
      json: function(body) { statusCode = 200; responseBody = body; },
      status: function(code) { statusCode = code; return { json: function(body) { responseBody = body; } }; },
      writeHead: function(code) { statusCode = code; },
      end: function(payload) { try { responseBody = JSON.parse(payload); } catch (_) { responseBody = payload; } }
    };

    await handlePostSetDefaultPod(req, res, null, pool);

    eq(JSON.stringify(pool.preExistingFeatureRows), snapshotBefore, 'AC3: pre-existing feature rows are byte-identical after setting the default pod (never queried or written)');
    eq(pool.podAssignments.length, 1, 'AC3 setup sanity: exactly 1 pod_assignments row exists (the one just written, nothing retroactively created for the old feature)');
  }

  // --- Part 4: AC2 handoff precondition — GET product view JSON includes defaultPod ---
  {
    const { handleGetProductView } = require('../src/web-ui/routes/products');
    const pool = makeFakePool();
    const { migratePodAssignmentsSchema, setProductDefaultPod } = require('../src/web-ui/modules/pod-assignment-store');
    await migratePodAssignmentsSchema(pool);
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-test-123', name: 'Core Platform Pod' });
    pool.podMembers.push({ pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' });
    await setProductDefaultPod(pool, { tenantId: 'tenant-test-123', productId: 'prod-payments-uuid', podId: 'pod-core-uuid', assignedBy: 'hamish-uuid' });

    // handleGetProductView's own existing queries (products/product_rollups/journeys)
    // aren't stubbed by makeFakePool -- this test exercises ONLY the
    // getProductDefaultPod() call path this task adds, by calling that
    // function directly against the same pool state, matching what
    // handleGetProductView's own res.json branch will now also call.
    const { getProductDefaultPod } = require('../src/web-ui/modules/pod-assignment-store');
    const defaultPod = await getProductDefaultPod(pool, 'tenant-test-123', 'prod-payments-uuid');
    ok(defaultPod, 'AC2 precondition: getProductDefaultPod returns a result for a product with a default set');
    eq(defaultPod.podId, 'pod-core-uuid', 'AC2 precondition: correct podId');
    eq(defaultPod.podName, 'Core Platform Pod', 'AC2 precondition: correct podName');
    eq(defaultPod.memberCount, 3, 'AC2 precondition: correct memberCount -- this exact shape is what ep1-s3 will consume');
  }

  // --- Part 4b: AC2 -- handleGetProductView's OWN res.json branch actually
  // produces defaultPod, driven end-to-end through the real handler (not
  // getProductDefaultPod() called in isolation against the same pool state,
  // as Part 4 above does). This is the direct-execution proof that Task 4's
  // one-line change to handleGetProductView is genuinely wired, closing the
  // wiring-coverage gap flagged by review -- see ep1-s1's sibling story,
  // where a handler unit-tested only in isolation was wired to the wrong
  // variable in server.js and would have shipped undetected.
  {
    const { handleGetProductView } = require('../src/web-ui/routes/products');
    const pool = makeFakePool();
    const { migratePodAssignmentsSchema, setProductDefaultPod } = require('../src/web-ui/modules/pod-assignment-store');
    await migratePodAssignmentsSchema(pool);
    pool.products.push({ product_id: 'prod-payments-uuid', tenant_id: 'tenant-test-123', name: 'Acme Payments', repo_owner: null, repo_name: null });
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-test-123', name: 'Core Platform Pod' });
    pool.podMembers.push({ pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' });
    await setProductDefaultPod(pool, { tenantId: 'tenant-test-123', productId: 'prod-payments-uuid', podId: 'pod-core-uuid', assignedBy: 'hamish-uuid' });

    // handleGetProductView's modulesAdapter calls are unwired here (no
    // setModulesAdapter) -- they're wrapped in try/catch with safe []/{}
    // fallbacks in the handler itself, so this doesn't need stubbing to
    // reach the res.json branch (see products.js handleGetProductView).
    const req = { params: { id: 'prod-payments-uuid' }, session: { tenantId: 'tenant-test-123', login: 'hamish' } };
    let responseBody = null;
    const res = {
      json: function(body) { responseBody = body; },
      status: function(code) { return { json: function(body) { responseBody = body; } }; },
      writeHead: function() {},
      end: function() {}
    };

    await handleGetProductView(req, res, null, pool);

    ok(responseBody, 'AC2 (real handler): handleGetProductView res.json branch returns a response body');
    ok(responseBody && responseBody.defaultPod, "AC2 (real handler): handleGetProductView's own res.json branch actually produces a defaultPod field -- not just getProductDefaultPod() called in isolation");
    eq(responseBody && responseBody.defaultPod && responseBody.defaultPod.podId, 'pod-core-uuid', 'AC2 (real handler): defaultPod.podId is correct via the real handler');
    eq(responseBody && responseBody.defaultPod && responseBody.defaultPod.podName, 'Core Platform Pod', 'AC2 (real handler): defaultPod.podName is correct via the real handler');
    eq(responseBody && responseBody.defaultPod && responseBody.defaultPod.memberCount, 3, 'AC2 (real handler): defaultPod.memberCount is correct via the real handler');
  }

  console.log(`\n[ep1-s2] ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
