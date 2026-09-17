#!/usr/bin/env node
/**
 * check-ep1-s3-feature-pod-inheritance.js
 *
 * Unit + integration tests for ep1-s3: Feature Inherits Product Default Pod
 * on Creation. AC1 (pod_assignments recorded), AC2 (feature_collaborators
 * pre-populated), AC3 (roles preserved exactly), plus tenant isolation.
 *
 * Run: node tests/check-ep1-s3-feature-pod-inheritance.js
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

/** Minimal fake pg-Pool-shaped object backing pods/pod_members/pod_assignments/feature_collaborators. */
function makeFakePool() {
  const pods = [];
  const podMembers = [];
  const podAssignments = [];
  const featureCollaborators = [];
  return {
    pods, podMembers, podAssignments, featureCollaborators,
    query: async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('CREATE TABLE') === 0 || s.indexOf('CREATE UNIQUE INDEX') === 0) return { rows: [] };
      if (s.indexOf('SELECT USER_ID, ROLE_ID FROM POD_MEMBERS WHERE POD_ID') === 0) {
        const [podId] = params;
        return { rows: podMembers.filter(m => m.pod_id === podId).map(m => ({ user_id: m.user_id, role_id: m.role_id })) };
      }
      if (s.indexOf('INSERT INTO FEATURE_COLLABORATORS') === 0) {
        const [collaboratorId, featureId, userId, roleId, podId] = params;
        featureCollaborators.push({ collaborator_id: collaboratorId, feature_id: featureId, user_id: userId, role_id: roleId, pod_id: podId, is_approver: false });
        return { rows: [] };
      }
      if (s.indexOf('SELECT COLLABORATOR_ID, USER_ID, ROLE_ID, POD_ID FROM FEATURE_COLLABORATORS') === 0) {
        const [featureId] = params;
        return { rows: featureCollaborators.filter(c => c.feature_id === featureId) };
      }
      // --- Branches below copied/adapted from tests/check-ep1-s2-product-default-pod.js's
      // own makeFakePool() (ep1-s2's already-proven mock), for
      // pod-assignment-store.js's getProductDefaultPod/setFeatureDefaultPod
      // (Task 2 of this story's plan).
      if (s.indexOf('SELECT POD_ID, TENANT_ID, NAME FROM PODS WHERE') === 0) {
        const [podId, tenantId] = params;
        return { rows: pods.filter(p => p.pod_id === podId && p.tenant_id === tenantId).map(p => ({ pod_id: p.pod_id, tenant_id: p.tenant_id, name: p.name })) };
      }
      if (s.indexOf('SELECT COUNT(*) AS COUNT FROM POD_MEMBERS') === 0) {
        const [podId] = params;
        return { rows: [{ count: String(podMembers.filter(m => m.pod_id === podId).length) }] };
      }
      if (s.indexOf('SELECT PA.POD_ID, P.NAME FROM POD_ASSIGNMENTS') === 0) {
        const [tenantId, productId] = params;
        const row = podAssignments.find(a => a.tenant_id === tenantId && a.product_id === productId && a.feature_id === null);
        if (!row) return { rows: [] };
        const pod = pods.find(p => p.pod_id === row.pod_id);
        return { rows: pod ? [{ pod_id: pod.pod_id, name: pod.name }] : [] };
      }
      // ep1-s3's own setFeatureDefaultPod INSERT (7 params, feature_id NOT
      // NULL, always a plain INSERT -- no ON CONFLICT, unlike ep1-s2's
      // setProductDefaultPod upsert insert).
      if (s.indexOf('INSERT INTO POD_ASSIGNMENTS') === 0) {
        const [assignmentId, tenantId, podId, productId, featureId, assignmentType, assignedBy] = params;
        podAssignments.push({ assignment_id: assignmentId, tenant_id: tenantId, pod_id: podId, product_id: productId, feature_id: featureId, assignment_type: assignmentType, assigned_by: assignedBy, assigned_at: new Date().toISOString() });
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

async function run() {
  const { migrateFeatureCollaboratorsSchema, populateFeatureCollaboratorsFromPod, getFeatureCollaborators } = require('../src/web-ui/modules/feature-collaborator-store');

  // --- Part 1: feature-collaborator-store.js ---
  {
    const pool = makeFakePool();
    await migrateFeatureCollaboratorsSchema(pool);
    ok(true, 'migrateFeatureCollaboratorsSchema resolves without throwing (schema bootstrap)');

    pool.podMembers.push(
      { pod_id: 'pod-core-uuid', user_id: 'hamish-uuid', role_id: 'conductor' },
      { pod_id: 'pod-core-uuid', user_id: 'susan-uuid', role_id: 'engineer' },
      { pod_id: 'pod-core-uuid', user_id: 'darren-uuid', role_id: 'engineer' }
    );

    const result = await populateFeatureCollaboratorsFromPod(pool, { featureId: 'journey-abc', podId: 'pod-core-uuid' });
    eq(result.collaboratorCount, 3, 'populateFeatureCollaboratorsFromPod: returns collaboratorCount 3');
    eq(pool.featureCollaborators.length, 3, 'populateFeatureCollaboratorsFromPod: exactly 3 rows written');
    ok(pool.featureCollaborators.every(c => c.feature_id === 'journey-abc'), 'populateFeatureCollaboratorsFromPod: every row references the correct featureId');
    ok(pool.featureCollaborators.every(c => c.pod_id === 'pod-core-uuid'), 'populateFeatureCollaboratorsFromPod: every row references the source podId');

    const collaborators = await getFeatureCollaborators(pool, 'journey-abc');
    eq(collaborators.length, 3, 'getFeatureCollaborators: returns all 3 collaborators');
    const hamish = collaborators.find(c => c.userId === 'hamish-uuid');
    ok(hamish, 'getFeatureCollaborators: finds Hamish');
    eq(hamish.roleId, 'conductor', 'getFeatureCollaborators: Hamish role is conductor');
  }

  // --- Part 2: handlePostProductFeature — AC1, pod_assignments recorded ---
  {
    const path = require('path');
    function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }
    const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
    const PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
    const SKILLS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

    function makeRes() {
      const r = { _status: null, _headers: {}, _body: '' };
      r.writeHead = function(status, headers) { r._status = status; Object.assign(r._headers, headers || {}); };
      r.setHeader = function(k, v) { r._headers[k] = v; };
      r.end = function(b) { r._body += (b || ''); };
      return r;
    }
    function extractSidFromRedirect(res) {
      const loc = res._headers.Location || '';
      const m = /\/skills\/discovery\/sessions\/([^/]+)\/chat/.exec(loc);
      return m ? decodeURIComponent(m[1]) : null;
    }

    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    const productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    const skillsRoute = require(SKILLS_ROUTE_PATH);

    const pool = makeFakePool();
    // Also seed the products/pods/pod_members/pod_assignments query shapes
    // handlePostProductFeature and getProductDefaultPod need -- reuse the
    // SAME narrow branches pod-assignment-store.js's own test file already
    // established, added directly to this file's makeFakePool() query fn
    // in Task 1's own edit above (see that function's full body once this
    // task's Step 3 changes are in place -- this test assumes those branches
    // already exist there; if you are implementing Task 2 before extending
    // makeFakePool() with them, do that extension first as part of this task).
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-1', name: 'Core Platform Pod' });
    pool.podMembers.push(
      { pod_id: 'pod-core-uuid', user_id: 'hamish-uuid', role_id: 'conductor' },
      { pod_id: 'pod-core-uuid', user_id: 'susan-uuid', role_id: 'engineer' },
      { pod_id: 'pod-core-uuid', user_id: 'darren-uuid', role_id: 'engineer' }
    );
    pool.podAssignments.push({ tenant_id: 'tenant-1', pod_id: 'pod-core-uuid', product_id: 'prod-1', feature_id: null, assignment_type: 'inherit-to-all-features' });
    // das-s2 repo-connected gate + products lookup, matching jrf-s2's own established fixture pattern.
    const originalQuery = pool.query.bind(pool);
    pool.query = async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('SELECT REPO_OWNER, REPO_NAME') !== -1) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
      return originalQuery(sql, params);
    };

    const req = { params: { id: 'prod-1' }, session: { tenantId: 'tenant-1', login: 'octocat', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    const res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });

    const sid = extractSidFromRedirect(res);
    ok(sid, 'AC1 setup: feature creation redirects to a real discovery chat session');
    const session = skillsRoute._getHtmlSession(sid);
    const journeyId = session && session.journeyId;
    ok(journeyId, 'AC1 setup: session is linked to a real journeyId');

    eq(pool.podAssignments.filter(a => a.feature_id === journeyId).length, 1, 'AC1: exactly 1 pod_assignments row written with feature_id = journeyId');
    const featureAssignment = pool.podAssignments.find(a => a.feature_id === journeyId);
    eq(featureAssignment.pod_id, 'pod-core-uuid', 'AC1: the assignment references the product\'s default pod');
    eq(featureAssignment.assignment_type, 'feature-inherits-product-default', 'AC1: assignmentType is feature-inherits-product-default');
  }

  // --- Part 3: AC2 — feature_collaborators pre-populated with every pod member ---
  {
    const path = require('path');
    function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }
    const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
    const PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
    const SKILLS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

    function makeRes() {
      const r = { _status: null, _headers: {}, _body: '' };
      r.writeHead = function(status, headers) { r._status = status; Object.assign(r._headers, headers || {}); };
      r.setHeader = function(k, v) { r._headers[k] = v; };
      r.end = function(b) { r._body += (b || ''); };
      return r;
    }
    function extractSidFromRedirect(res) {
      const loc = res._headers.Location || '';
      const m = /\/skills\/discovery\/sessions\/([^/]+)\/chat/.exec(loc);
      return m ? decodeURIComponent(m[1]) : null;
    }

    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    const productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    const skillsRoute = require(SKILLS_ROUTE_PATH);

    const pool = makeFakePool();
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-1', name: 'Core Platform Pod' });
    pool.podMembers.push(
      { pod_id: 'pod-core-uuid', user_id: 'hamish-uuid', role_id: 'conductor' },
      { pod_id: 'pod-core-uuid', user_id: 'susan-uuid', role_id: 'engineer' },
      { pod_id: 'pod-core-uuid', user_id: 'darren-uuid', role_id: 'engineer' }
    );
    pool.podAssignments.push({ tenant_id: 'tenant-1', pod_id: 'pod-core-uuid', product_id: 'prod-1', feature_id: null, assignment_type: 'inherit-to-all-features' });
    const originalQuery = pool.query.bind(pool);
    pool.query = async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('SELECT REPO_OWNER, REPO_NAME') !== -1) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
      return originalQuery(sql, params);
    };

    const req = { params: { id: 'prod-1' }, session: { tenantId: 'tenant-1', login: 'octocat', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    const res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });

    const sid = extractSidFromRedirect(res);
    const session = skillsRoute._getHtmlSession(sid);
    const journeyId = session && session.journeyId;

    const collaboratorRows = pool.featureCollaborators.filter(c => c.feature_id === journeyId);
    eq(collaboratorRows.length, 3, 'AC2: exactly 3 feature_collaborators rows pre-populated');
    const userIds = collaboratorRows.map(c => c.user_id).sort();
    eq(JSON.stringify(userIds), JSON.stringify(['darren-uuid', 'hamish-uuid', 'susan-uuid']), 'AC2: all 3 pod members present (Hamish, Susan, Darren)');
    ok(collaboratorRows.every(c => c.pod_id === 'pod-core-uuid'), 'AC2: every collaborator row references the source pod');
  }

  // --- Part 4: AC3 — collaborator roles match pod_members exactly ---
  {
    const path = require('path');
    function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }
    const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
    const PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
    const SKILLS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

    function makeRes() {
      const r = { _status: null, _headers: {}, _body: '' };
      r.writeHead = function(status, headers) { r._status = status; Object.assign(r._headers, headers || {}); };
      r.setHeader = function(k, v) { r._headers[k] = v; };
      r.end = function(b) { r._body += (b || ''); };
      return r;
    }
    function extractSidFromRedirect(res) {
      const loc = res._headers.Location || '';
      const m = /\/skills\/discovery\/sessions\/([^/]+)\/chat/.exec(loc);
      return m ? decodeURIComponent(m[1]) : null;
    }

    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    const productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    const skillsRoute = require(SKILLS_ROUTE_PATH);

    const pool = makeFakePool();
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-1', name: 'Core Platform Pod' });
    // NOTE: roleId order deliberately does NOT match insertion order used in
    // Parts 2/3, to prove role lookup is by userId, not by array position.
    pool.podMembers.push(
      { pod_id: 'pod-core-uuid', user_id: 'susan-uuid', role_id: 'engineer' },
      { pod_id: 'pod-core-uuid', user_id: 'hamish-uuid', role_id: 'conductor' },
      { pod_id: 'pod-core-uuid', user_id: 'darren-uuid', role_id: 'engineer' }
    );
    pool.podAssignments.push({ tenant_id: 'tenant-1', pod_id: 'pod-core-uuid', product_id: 'prod-1', feature_id: null, assignment_type: 'inherit-to-all-features' });
    const originalQuery = pool.query.bind(pool);
    pool.query = async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('SELECT REPO_OWNER, REPO_NAME') !== -1) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
      return originalQuery(sql, params);
    };

    const req = { params: { id: 'prod-1' }, session: { tenantId: 'tenant-1', login: 'octocat', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    const res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });

    const sid = extractSidFromRedirect(res);
    const session = skillsRoute._getHtmlSession(sid);
    const journeyId = session && session.journeyId;

    const collaboratorRows = pool.featureCollaborators.filter(c => c.feature_id === journeyId);
    eq(collaboratorRows.length, 3, 'AC3: exactly 3 feature_collaborators rows written (no duplicate/phantom row masked by the byUser lookup below)');
    const byUser = {};
    collaboratorRows.forEach(c => { byUser[c.user_id] = c.role_id; });
    eq(byUser['hamish-uuid'], 'conductor', 'AC3: Hamish role is conductor (not dropped or defaulted)');
    eq(byUser['susan-uuid'], 'engineer', 'AC3: Susan role is engineer');
    eq(byUser['darren-uuid'], 'engineer', 'AC3: Darren role is engineer');
  }

  // --- Part 5: tenant isolation — a product's default pod never leaks across tenants ---
  {
    const path = require('path');
    function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }
    const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
    const PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
    const SKILLS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

    function makeRes() {
      const r = { _status: null, _headers: {}, _body: '' };
      r.writeHead = function(status, headers) { r._status = status; Object.assign(r._headers, headers || {}); };
      r.setHeader = function(k, v) { r._headers[k] = v; };
      r.end = function(b) { r._body += (b || ''); };
      return r;
    }
    function extractSidFromRedirect(res) {
      const loc = res._headers.Location || '';
      const m = /\/skills\/discovery\/sessions\/([^/]+)\/chat/.exec(loc);
      return m ? decodeURIComponent(m[1]) : null;
    }

    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    const productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    const skillsRoute = require(SKILLS_ROUTE_PATH);

    const pool = makeFakePool();
    // Tenant A has a default pod on prod-A; tenant B's product (different
    // product id, no assignment row) must NOT inherit tenant A's pod.
    pool.pods.push({ pod_id: 'pod-A', tenant_id: 'tenant-A', name: 'Platform A' });
    pool.podMembers.push({ pod_id: 'pod-A', user_id: 'u1', role_id: 'conductor' });
    pool.podAssignments.push({ tenant_id: 'tenant-A', pod_id: 'pod-A', product_id: 'prod-A', feature_id: null, assignment_type: 'inherit-to-all-features' });
    const originalQuery = pool.query.bind(pool);
    pool.query = async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('SELECT REPO_OWNER, REPO_NAME') !== -1) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
      return originalQuery(sql, params);
    };

    // Tenant B creates a feature under a DIFFERENT product (prod-B) with no default pod.
    const req = { params: { id: 'prod-B' }, session: { tenantId: 'tenant-B', login: 'other-user', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    const res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });

    const sid = extractSidFromRedirect(res);
    const session = skillsRoute._getHtmlSession(sid);
    const journeyId = session && session.journeyId;

    eq(pool.podAssignments.filter(a => a.feature_id === journeyId).length, 0, 'Tenant isolation: tenant B\'s feature does NOT inherit tenant A\'s default pod');
    eq(pool.featureCollaborators.filter(c => c.feature_id === journeyId).length, 0, 'Tenant isolation: no feature_collaborators rows created for tenant B\'s feature');
  }

  console.log(`\n[ep1-s3] ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
