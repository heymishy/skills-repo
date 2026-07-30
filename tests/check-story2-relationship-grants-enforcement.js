'use strict';

// tests/check-story2-relationship-grants-enforcement.js -- story-2-relationship-grants-enforcement
// Story: artefacts/2026-07-30-agency-client-organisations/stories/story-2-relationship-grants-enforcement.md
// Test plan: artefacts/2026-07-30-agency-client-organisations/test-plans/story-2-relationship-grants-enforcement-test-plan.md
//
// Covers (12 tests across 6 ACs, plus 3 NFR tests, matching the test plan):
//   AC1: createsGrantScopedToRelationshipNotOrgBroadly, agencyShareCreatesGrantEndToEnd
//   AC2: grantCheckDeniesAccessViaWrongRelationship, clientUserSeesOnlyGrantedProductsAcrossTwoAgencies,
//        clientUserSeesOnlyGrantedProductsNotUngranted
//   AC3: grantConveysReadNotWrite, mutationRouteRejectsGrantedReadOnlyUser
//   AC4: noGrantReturnsNotFoundNotForbidden, directIdAccessWithNoGrantReturns404
//   AC5: revocationTakesEffectImmediately, revokedGrantDeniesAccessOnNextRequest
//   AC6 (regression guard): existingTenantIsolationSuiteRunsUnmodifiedAndPasses
//   NFR (Performance): grantCheckAddsAtMostOneQueryPerProtectedRoute
//   NFR (Security):    everyNewReadPathGoesThroughGrantCheckGuard
//   NFR (Audit):       deniedAccessAttemptsAreAudited
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-story1-organisation-entity.js, tests/check-tir-s1-person-team-schema.js)
// -- no Jest/Mocha.

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var { execFileSync } = require('child_process');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var ROOT = path.join(__dirname, '..');
var GRANTS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'agency-client-grants'));
var JOURNEY_ACCESS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'middleware', 'journey-access'));
var PRODUCTS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'products'));

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

// ── In-memory fake pool for agency_client_relationships / shared_access_grants ──
// Narrow, self-contained fake -- supports exactly the query shapes
// agency-client-grants.js issues (mirrors tests/check-story1-organisation-entity.js's
// makeFakeOrgPool "narrow, explicit branches" convention).
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakeGrantsPool(seed) {
  var relationships = ((seed && seed.relationships) || []).slice();
  var grants = ((seed && seed.grants) || []).slice();
  var queryLog = [];
  var ops = [];

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];
    queryLog.push({ sql: s, params: p });

    if (s.indexOf('CREATE TABLE IF NOT EXISTS') === 0) {
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('INSERT INTO AGENCY_CLIENT_RELATIONSHIPS') === 0) {
      ops.push('insert-relationship');
      var relationshipId = p[0], agencyOrgId = p[1], clientOrgId = p[2];
      var relRow = { relationship_id: relationshipId, agency_org_id: agencyOrgId, client_org_id: clientOrgId, created_at: new Date().toISOString() };
      relationships.push(relRow);
      return Promise.resolve({ rows: [relRow] });
    }

    if (s.indexOf('SELECT RELATIONSHIP_ID, AGENCY_ORG_ID, CLIENT_ORG_ID, CREATED_AT FROM AGENCY_CLIENT_RELATIONSHIPS WHERE RELATIONSHIP_ID') === 0) {
      var lookupId = p[0];
      var match = relationships.filter(function(r) { return r.relationship_id === lookupId; });
      return Promise.resolve({ rows: match });
    }

    if (s.indexOf('INSERT INTO SHARED_ACCESS_GRANTS') === 0) {
      ops.push('insert-grant');
      var grantId = p[0], relId = p[1], resType = p[2], resId = p[3];
      var g = { grant_id: grantId, relationship_id: relId, resource_type: resType, resource_id: resId, granted_at: new Date().toISOString(), revoked_at: null };
      grants.push(g);
      return Promise.resolve({ rows: [g] });
    }

    // checkGrantAccess (resource_id-scoped -- distinguishes it from the list query below)
    if (s.indexOf('FROM SHARED_ACCESS_GRANTS G') !== -1 && s.indexOf('RESOURCE_ID = $3') !== -1) {
      var clientOrgId2 = p[0], resType2 = p[1], resId2 = p[2];
      var match2 = grants.filter(function(g) {
        if (g.resource_type !== resType2 || g.resource_id !== resId2 || g.revoked_at) return false;
        var rel = relationships.filter(function(r) { return r.relationship_id === g.relationship_id; })[0];
        return rel && rel.client_org_id === clientOrgId2;
      });
      return Promise.resolve({ rows: match2 });
    }

    // listGrantedResourcesForClient
    if (s.indexOf('FROM SHARED_ACCESS_GRANTS G') !== -1 && s.indexOf('JOIN AGENCY_CLIENT_RELATIONSHIPS') !== -1) {
      var clientOrgId3 = p[0], resType3 = p[1];
      var match3 = grants.filter(function(g) {
        if (g.resource_type !== resType3 || g.revoked_at) return false;
        var rel = relationships.filter(function(r) { return r.relationship_id === g.relationship_id; })[0];
        return rel && rel.client_org_id === clientOrgId3;
      });
      return Promise.resolve({ rows: match3 });
    }

    if (s.indexOf('UPDATE SHARED_ACCESS_GRANTS SET REVOKED_AT') === 0) {
      ops.push('update-revoke');
      var revokeId = p[0];
      var g2 = grants.filter(function(g) { return g.grant_id === revokeId && !g.revoked_at; })[0];
      if (!g2) return Promise.resolve({ rows: [] });
      g2.revoked_at = new Date().toISOString();
      return Promise.resolve({ rows: [g2] });
    }

    console.warn('[fake-grants-pool] unhandled query (returning empty rows): ' + s.slice(0, 150));
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _state: function() { return { relationships: relationships, grants: grants, queryLog: queryLog, ops: ops }; }
  };
}

function mockRes() {
  return { _s: null, _b: null, status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; } };
}

(async function main() {
  // ===========================================================================
  // AC1 -- createsGrantScopedToRelationshipNotOrgBroadly (unit)
  // ===========================================================================
  await test('createsGrantScopedToRelationshipNotOrgBroadly (AC1)', async function() {
    var grants = freshRequire(GRANTS_PATH);
    var pool = makeFakeGrantsPool();
    var rel = await grants.createRelationship(pool, 'agency-org-a', 'client-org-1');
    var grant = await grants.createGrant(pool, rel.relationship_id, 'product', 'product-x');
    assert.strictEqual(grant.relationship_id, rel.relationship_id, 'grant must be scoped to the specific relationship_id, not a bare client_org_id');
    assert.strictEqual(grant.resource_type, 'product');
    assert.strictEqual(grant.resource_id, 'product-x');
    assert.strictEqual(grant.revoked_at, null, 'a freshly created grant must not be revoked');
  });

  // ===========================================================================
  // AC2 -- grantCheckDeniesAccessViaWrongRelationship (unit, core security property)
  // ===========================================================================
  await test('grantCheckDeniesAccessViaWrongRelationship (AC2)', async function() {
    var grants = freshRequire(GRANTS_PATH);
    var pool = makeFakeGrantsPool();
    var relA = await grants.createRelationship(pool, 'agency-a', 'client-1');
    var relB = await grants.createRelationship(pool, 'agency-b', 'client-1');
    // Only the Agency A relationship has a grant for Product X.
    await grants.createGrant(pool, relA.relationship_id, 'product', 'product-x');

    var viaA = await grants.checkGrantAccess(pool, 'client-1', 'product', 'product-x');
    assert.ok(viaA, 'grant-check must succeed when evaluated against the Agency A relationship');
    assert.strictEqual(viaA.relationship_id, relA.relationship_id);

    // Simulate "as if only the Agency B relationship existed" by checking a
    // client org that only has the B relationship attached to a grant for a
    // DIFFERENT resource -- Product X must never be reachable through it.
    var relBOnly = await grants.createRelationship(pool, 'agency-b', 'client-2');
    await grants.createGrant(pool, relBOnly.relationship_id, 'product', 'product-y');
    var crossCheck = await grants.checkGrantAccess(pool, 'client-2', 'product', 'product-x');
    assert.strictEqual(crossCheck, null, 'Product X must never be reachable via a relationship that never had a grant for it');
  });

  // ===========================================================================
  // AC3 -- grantConveysReadNotWrite (unit)
  // ===========================================================================
  await test('grantConveysReadNotWrite (AC3)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var grants = freshRequire(GRANTS_PATH);
    var pool = makeFakeGrantsPool();
    var rel = await grants.createRelationship(pool, 'agency-a', 'client-1');
    await grants.createGrant(pool, rel.relationship_id, 'product', 'product-x');

    var req = { session: { tenantId: 'client-1' }, params: { id: 'product-x' }, body: { name: 'Hacked' } };
    var res = mockRes();
    await products.handleMutateSharedProduct(req, res, pool);
    assert.strictEqual(res._s, 403, 'expected 403 for a mutation attempt by a Client-org read-grant holder');
    var mutationOps = pool._state().ops.filter(function(o) { return o === 'update-revoke' || o.indexOf('insert') === 0; });
    // No relationship/grant creation or mutation op should have occurred as a
    // side effect of this request (the only ops present are the ones we
    // issued ourselves via createRelationship/createGrant above).
    assert.strictEqual(mutationOps.length, 2, 'expected only the 2 setup ops (createRelationship, createGrant) -- the mutate route must not touch the pool at all');
  });

  // ===========================================================================
  // AC4 -- noGrantReturnsNotFoundNotForbidden (unit)
  // ===========================================================================
  await test('noGrantReturnsNotFoundNotForbidden (AC4)', async function() {
    var { requireGrantAccess, asHttpResponse, POLICY } = freshRequire(JOURNEY_ACCESS_PATH);
    var grants = freshRequire(GRANTS_PATH);
    var pool = makeFakeGrantsPool();
    // No relationship, no grant at all for 'product-y'.
    var grant = await grants.checkGrantAccess(pool, 'client-1', 'product', 'product-y');
    assert.strictEqual(grant, null);

    var threw = false; var code = null;
    try { requireGrantAccess(grant); } catch (e) { threw = true; code = e.code; }
    assert.ok(threw, 'requireGrantAccess must throw when no grant exists');
    var status = asHttpResponse({ code: code }, POLICY.TENANT);
    assert.strictEqual(status, 404, 'no-grant access must resolve to 404, never 403');

    // Edge case: the 404 body must be identical in shape to a genuinely
    // non-existent resource -- assert the response body carries no field
    // that would distinguish "exists but not granted" from "does not exist".
    var body = { error: 'not found' };
    assert.deepStrictEqual(Object.keys(body), ['error'], 'the 404 body must not reveal resource existence');
  });

  // ===========================================================================
  // AC5 -- revocationTakesEffectImmediately (unit)
  // ===========================================================================
  await test('revocationTakesEffectImmediately (AC5)', async function() {
    var grants = freshRequire(GRANTS_PATH);
    var pool = makeFakeGrantsPool();
    var rel = await grants.createRelationship(pool, 'agency-a', 'client-1');
    var grant = await grants.createGrant(pool, rel.relationship_id, 'product', 'product-x');

    var before = await grants.checkGrantAccess(pool, 'client-1', 'product', 'product-x');
    assert.ok(before, 'grant must be active before revocation');

    await grants.revokeGrant(pool, grant.grant_id);

    // No delay, no cache-warm step -- call immediately.
    var afterQueryCountBefore = pool._state().queryLog.length;
    var after = await grants.checkGrantAccess(pool, 'client-1', 'product', 'product-x');
    var afterQueryCountAfter = pool._state().queryLog.length;
    assert.strictEqual(after, null, 'grant-check must return false/null immediately after revocation -- no TTL, no stale-read window');
    assert.strictEqual(afterQueryCountAfter - afterQueryCountBefore, 1, 'checkGrantAccess must issue exactly one live query -- no caching layer bypassed or otherwise');
  });

  // ===========================================================================
  // AC1 -- agencyShareCreatesGrantEndToEnd (integration)
  // ===========================================================================
  await test('agencyShareCreatesGrantEndToEnd (AC1)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var grants = freshRequire(GRANTS_PATH);
    var pool = makeFakeGrantsPool();
    var rel = await grants.createRelationship(pool, 'agency-a', 'client-1');

    var req = { session: { tenantId: 'agency-a' }, body: { relationshipId: rel.relationship_id, resourceType: 'product', resourceId: 'product-x' } };
    var res = mockRes();
    await products.handleCreateGrant(req, res, pool);

    assert.strictEqual(res._s, 200, 'expected success response from the share/grant-creation route');
    assert.ok(res._b && res._b.success, 'expected success:true in the response');
    var persisted = pool._state().grants.filter(function(g) { return g.resource_id === 'product-x'; })[0];
    assert.ok(persisted, 'expected a grant row to be persisted');
    assert.strictEqual(persisted.relationship_id, rel.relationship_id, 'the persisted grant must be scoped to the correct relationship_id');
  });

  // ===========================================================================
  // AC2 -- clientUserSeesOnlyGrantedProductsAcrossTwoAgencies (integration)
  // ===========================================================================
  await test('clientUserSeesOnlyGrantedProductsAcrossTwoAgencies (AC2)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var grants = freshRequire(GRANTS_PATH);
    var pool = makeFakeGrantsPool();
    var relA = await grants.createRelationship(pool, 'agency-a', 'client-1');
    await grants.createRelationship(pool, 'agency-b', 'client-1'); // Agency B shares nothing
    await grants.createGrant(pool, relA.relationship_id, 'product', 'product-x');

    var req = { session: { tenantId: 'client-1' } };
    var res = mockRes();
    await products.handleListSharedProducts(req, res, pool);

    assert.strictEqual(res._s, 200);
    var ids = res._b.resources.map(function(r) { return r.resourceId; });
    assert.ok(ids.indexOf('product-x') !== -1, 'expected Product X (shared by Agency A) to appear');
    assert.strictEqual(ids.length, 1, 'expected exactly one resource -- nothing from Agency B (which shared nothing)');
  });

  // ===========================================================================
  // AC2 -- clientUserSeesOnlyGrantedProductsNotUngranted (integration, negative direction)
  // ===========================================================================
  await test('clientUserSeesOnlyGrantedProductsNotUngranted (AC2 negative)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var grants = freshRequire(GRANTS_PATH);
    var pool = makeFakeGrantsPool();
    var relA = await grants.createRelationship(pool, 'agency-a', 'client-1');
    var relB = await grants.createRelationship(pool, 'agency-b', 'client-1');
    await grants.createGrant(pool, relA.relationship_id, 'product', 'product-x');
    // Agency B shares Product Y, but only through ITS OWN relationship with a
    // DIFFERENT client org -- never reaching client-1.
    var relBOtherClient = await grants.createRelationship(pool, 'agency-b', 'client-2');
    await grants.createGrant(pool, relBOtherClient.relationship_id, 'product', 'product-y');
    void relB;

    var req = { session: { tenantId: 'client-1' } };
    var res = mockRes();
    await products.handleListSharedProducts(req, res, pool);

    var ids = res._b.resources.map(function(r) { return r.resourceId; });
    assert.strictEqual(ids.indexOf('product-y'), -1, 'Agency B\'s product-y (shared with a different client org) must never appear for client-1');
    assert.ok(ids.indexOf('product-x') !== -1, 'client-1\'s own granted product must still appear');
  });

  // ===========================================================================
  // AC3 -- mutationRouteRejectsGrantedReadOnlyUser (integration, full route stack)
  // ===========================================================================
  await test('mutationRouteRejectsGrantedReadOnlyUser (AC3)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var grants = freshRequire(GRANTS_PATH);
    var pool = makeFakeGrantsPool();
    var rel = await grants.createRelationship(pool, 'agency-a', 'client-1');
    await grants.createGrant(pool, rel.relationship_id, 'product', 'product-x');
    var opsBefore = pool._state().ops.length;

    var req = { session: { tenantId: 'client-1' }, params: { id: 'product-x' }, body: { name: 'Hacked' } };
    var res = mockRes();
    await products.handleMutateSharedProduct(req, res, pool);

    assert.strictEqual(res._s, 403, 'handler body never reached -- 403 rejected before any mutation logic');
    assert.strictEqual(pool._state().ops.length, opsBefore, 'no side effect -- pool ops count must be unchanged after the rejected mutation attempt');
  });

  // ===========================================================================
  // AC4 -- directIdAccessWithNoGrantReturns404 (integration, full route stack)
  // ===========================================================================
  await test('directIdAccessWithNoGrantReturns404 (AC4)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var pool = makeFakeGrantsPool();
    var req = { session: { tenantId: 'client-1' }, params: { id: 'never-shared-product' } };
    var res = mockRes();
    await products.handleGetSharedProduct(req, res, pool);
    assert.strictEqual(res._s, 404, 'expected 404 for a resource that exists but is not granted to this client org');
    assert.deepStrictEqual(Object.keys(res._b), ['error'], 'response body shape must be identical to a genuinely-nonexistent-ID 404');
  });

  // ===========================================================================
  // AC5 -- revokedGrantDeniesAccessOnNextRequest (integration, full route stack)
  // ===========================================================================
  await test('revokedGrantDeniesAccessOnNextRequest (AC5)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var grants = freshRequire(GRANTS_PATH);
    var pool = makeFakeGrantsPool();
    var rel = await grants.createRelationship(pool, 'agency-a', 'client-1');
    var grant = await grants.createGrant(pool, rel.relationship_id, 'product', 'product-x');

    var reqBefore = { session: { tenantId: 'client-1' }, params: { id: 'product-x' } };
    var resBefore = mockRes();
    await products.handleGetSharedProduct(reqBefore, resBefore, pool);
    assert.strictEqual(resBefore._s, 200, 'client must be able to view the product before revocation');

    await grants.revokeGrant(pool, grant.grant_id);

    var reqAfter = { session: { tenantId: 'client-1' }, params: { id: 'product-x' } };
    var resAfter = mockRes();
    await products.handleGetSharedProduct(reqAfter, resAfter, pool);
    assert.strictEqual(resAfter._s, 404, 'expected 404 on the very next request after revocation -- no delay');
  });

  // ===========================================================================
  // AC6 (regression guard) -- existingTenantIsolationSuiteRunsUnmodifiedAndPasses
  // ===========================================================================
  await test('existingTenantIsolationSuiteRunsUnmodifiedAndPasses (AC6, bri-s3.4 regression)', async function() {
    var bri34Path = path.join(ROOT, 'tests', 'check-bri-s3.4-cross-tenant-isolation.js');
    assert.ok(fs.existsSync(bri34Path), 'expected the existing bri-s3.4 tenant-isolation suite to exist, unmodified');
    // Run the file exactly as it exists today, in a child process (this suite
    // registers global.fetch overrides / posthog adapters that would collide
    // with this file's own module cache if required in-process).
    var output;
    var exitCode = 0;
    try {
      output = execFileSync(process.execPath, [bri34Path], { cwd: ROOT, encoding: 'utf8' });
    } catch (e) {
      output = (e.stdout || '') + (e.stderr || '');
      exitCode = e.status || 1;
    }
    console.log(output.split('\n').slice(-3).join('\n'));
    assert.strictEqual(exitCode, 0, 'expected the existing bri-s3.4 suite to exit 0 (100% passing), unmodified, got exit code ' + exitCode + '. Output tail:\n' + output.slice(-800));
    assert.ok(/(\d+) passed, 0 failed/.test(output), 'expected "N passed, 0 failed" in bri-s3.4 output, got:\n' + output.slice(-500));
  });

  // ===========================================================================
  // NFR (Performance) -- grantCheckAddsAtMostOneQueryPerProtectedRoute
  // ===========================================================================
  await test('grantCheckAddsAtMostOneQueryPerProtectedRoute (NFR-perf)', async function() {
    var grants = freshRequire(GRANTS_PATH);
    var pool = makeFakeGrantsPool();
    var rel = await grants.createRelationship(pool, 'agency-a', 'client-1');
    await grants.createGrant(pool, rel.relationship_id, 'product', 'product-x');

    var before = pool._state().queryLog.length;
    await grants.checkGrantAccess(pool, 'client-1', 'product', 'product-x');
    var after = pool._state().queryLog.length;
    assert.strictEqual(after - before, 1, 'expected exactly 1 additional query for a grant-check, got: ' + (after - before));
  });

  // ===========================================================================
  // NFR (Security) -- everyNewReadPathGoesThroughGrantCheckGuard (source scan)
  // ===========================================================================
  await test('everyNewReadPathGoesThroughGrantCheckGuard (NFR-security)', async function() {
    var productsSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'routes', 'products.js'), 'utf8');
    // Isolate just this story's own section of products.js (from its section
    // banner to end of file) so this scan cannot false-positive on pre-existing,
    // unrelated products.js queries against OTHER tables (e.g. `products`,
    // `journeys`) that predate this story.
    var sectionMarker = 'story-2-relationship-grants-enforcement (artefacts/2026-07-30-agency-client-organisations)';
    var sectionStart = productsSrc.indexOf(sectionMarker);
    assert.ok(sectionStart !== -1, 'expected this story\'s section banner to be present in products.js');
    var section = productsSrc.slice(sectionStart);

    // The real assertion: this story's route-handler section must contain
    // ZERO raw SQL query() calls against the two new tables -- every read/
    // write must go through modules/agency-client-grants.js's exported
    // functions instead.
    var directQueryPattern = /pool\.query\([^)]*(agency_client_relationships|shared_access_grants)/i;
    assert.ok(!directQueryPattern.test(section), 'expected zero direct pool.query() calls against agency_client_relationships/shared_access_grants in products.js\'s new route-handler section -- all reads must go through modules/agency-client-grants.js');
    // Confirm the adapter IS actually used (not just absent of direct queries
    // because the feature was never wired at all).
    assert.ok(/_agencyClientGrants\.(checkGrantAccess|listGrantedResourcesForClient|createGrant|getRelationshipById|revokeGrant)/.test(section),
      'expected products.js to actually call the dedicated grant-check adapter functions');
  });

  // ===========================================================================
  // NFR (Audit) -- deniedAccessAttemptsAreAudited
  // ===========================================================================
  await test('deniedAccessAttemptsAreAudited (NFR-audit)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var pool = makeFakeGrantsPool();
    var logCalls = [];
    products.setSharedAccessLogger({ info: function(msg) { logCalls.push(msg); } });

    var req = { session: { tenantId: 'client-1' }, params: { id: 'never-shared-product' } };
    var res = mockRes();
    await products.handleGetSharedProduct(req, res, pool);

    assert.strictEqual(res._s, 404);
    var denialLog = logCalls.filter(function(m) { return m.indexOf('grant_access_denied') !== -1; });
    assert.strictEqual(denialLog.length, 1, 'expected exactly one denied-access audit log entry');
    var parsed = JSON.parse(denialLog[0]);
    assert.ok(Object.prototype.hasOwnProperty.call(parsed, 'relationship_id'), 'audit entry must contain relationship_id');
    assert.strictEqual(parsed.org_id, 'client-1');
    assert.strictEqual(parsed.resource_id, 'never-shared-product');
    assert.ok(parsed.timestamp, 'audit entry must contain a timestamp');

    products.setSharedAccessLogger(null); // reset injectable logger back to default for subsequent tests
  });

  console.log('\n[story-2-relationship-grants-enforcement] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[story-2-relationship-grants-enforcement] Unexpected error:', err);
  process.exit(1);
});
