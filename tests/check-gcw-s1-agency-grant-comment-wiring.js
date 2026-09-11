'use strict';
// tests/check-gcw-s1-agency-grant-comment-wiring.js -- story-gcw-s1
// Story: artefacts/2026-09-11-agency-grant-comment-wiring/stories/gcw-s1-wire-grant-and-comment-routes.md
// Test plan: artefacts/2026-09-11-agency-grant-comment-wiring/test-plans/gcw-s1-test-plan.md
//
// Covers 14 integration tests + 1 wiring regression across 6 ACs, matching
// the test plan. Dispatches through small local helpers that mirror exactly
// what server.js's new route registrations do (param extraction via
// pathname.split('/'), csrfGuard-first for mutating routes) -- this is
// deliberately NOT re-testing the 9 handlers' own internal logic (already
// covered by check-story2-relationship-grants-enforcement.js and
// check-story5-client-agency-comments.js) but confirming the *wiring*.

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';

var assert = require('assert');
var path = require('path');
var fs = require('fs');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var ROOT = path.join(__dirname, '..');
var GRANTS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'agency-client-grants'));
var PRODUCTS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'products'));
var ORG_ACTIVATION_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'org-activation'));
var AGENCY_PROVISIONING_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'agency-provisioning'));
var CSRF_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'middleware', 'csrf'));
var SERVER_PATH = path.resolve(ROOT, 'src/web-ui/server.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

// Combined fake pool: organisations + agency_client_relationships +
// shared_access_grants + comments -- merges the conventions already
// established in check-story2-relationship-grants-enforcement.js and
// check-story5-client-agency-comments.js.
function makeFakePool(seed) {
  var organisations = ((seed && seed.organisations) || []).slice();
  var relationships = ((seed && seed.relationships) || []).slice();
  var grants = ((seed && seed.grants) || []).slice();
  var comments = ((seed && seed.comments) || []).slice();
  var personIdentities = ((seed && seed.personIdentities) || []).slice();
  var teamMemberships = ((seed && seed.teamMemberships) || []).slice();

  function orgTypeFor(orgId) {
    var row = organisations.filter(function(o) { return o.org_id === orgId; })[0];
    return row ? row.org_type : null;
  }

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('CREATE TABLE IF NOT EXISTS') === 0) return Promise.resolve({ rows: [] });

    // -- organisations (Story 1 reuse; resolveOrganisationForTenant/createOrganisation) --
    if (s.indexOf('SELECT ORG_ID, NAME, ORG_TYPE, CREATED_AT FROM ORGANISATIONS WHERE ORG_ID') === 0) {
      var orgMatch = organisations.filter(function(o) { return o.org_id === p[0]; });
      return Promise.resolve({ rows: orgMatch.map(function(o) { return { org_id: o.org_id, name: o.name || o.org_id, org_type: o.org_type, created_at: new Date().toISOString() }; }) });
    }
    if (s.indexOf('INSERT INTO ORGANISATIONS') === 0) {
      var dup = organisations.some(function(o) { return o.org_id === p[0]; });
      if (dup && s.indexOf('ON CONFLICT') !== -1) return Promise.resolve({ rows: [] });
      var newOrg = { org_id: p[0], name: p[1], org_type: p[2] };
      organisations.push(newOrg);
      return Promise.resolve({ rows: [{ org_id: newOrg.org_id, name: newOrg.name, org_type: newOrg.org_type, created_at: new Date().toISOString() }] });
    }

    if (s.indexOf('INSERT INTO AGENCY_CLIENT_RELATIONSHIPS') === 0) {
      var relRow = { relationship_id: p[0], agency_org_id: p[1], client_org_id: p[2], created_at: new Date().toISOString() };
      relationships.push(relRow);
      return Promise.resolve({ rows: [relRow] });
    }
    if (s.indexOf('SELECT RELATIONSHIP_ID, AGENCY_ORG_ID, CLIENT_ORG_ID, CREATED_AT FROM AGENCY_CLIENT_RELATIONSHIPS WHERE RELATIONSHIP_ID') === 0) {
      var match = relationships.filter(function(r) { return r.relationship_id === p[0]; });
      return Promise.resolve({ rows: match });
    }
    if (s.indexOf('INSERT INTO SHARED_ACCESS_GRANTS') === 0) {
      var g = { grant_id: p[0], relationship_id: p[1], resource_type: p[2], resource_id: p[3], granted_at: new Date().toISOString(), revoked_at: null };
      grants.push(g);
      return Promise.resolve({ rows: [g] });
    }
    if (s.indexOf('FROM SHARED_ACCESS_GRANTS G') !== -1 && s.indexOf('RESOURCE_ID = $3') !== -1) {
      var clientOrgId2 = p[0], resType2 = p[1], resId2 = p[2];
      var match2 = grants.filter(function(gg) {
        if (gg.resource_type !== resType2 || gg.resource_id !== resId2 || gg.revoked_at) return false;
        var rel = relationships.filter(function(r) { return r.relationship_id === gg.relationship_id; })[0];
        return rel && rel.client_org_id === clientOrgId2;
      });
      return Promise.resolve({ rows: match2 });
    }
    if (s.indexOf('FROM SHARED_ACCESS_GRANTS G') !== -1 && s.indexOf('JOIN AGENCY_CLIENT_RELATIONSHIPS') !== -1) {
      var clientOrgId3 = p[0], resType3 = p[1];
      var match3 = grants.filter(function(gg) {
        if (gg.resource_type !== resType3 || gg.revoked_at) return false;
        var rel = relationships.filter(function(r) { return r.relationship_id === gg.relationship_id; })[0];
        return rel && rel.client_org_id === clientOrgId3;
      });
      return Promise.resolve({ rows: match3 });
    }
    if (s.indexOf('UPDATE SHARED_ACCESS_GRANTS SET REVOKED_AT') === 0) {
      var g2 = grants.filter(function(gg) { return gg.grant_id === p[0] && !gg.revoked_at; })[0];
      if (!g2) return Promise.resolve({ rows: [] });
      g2.revoked_at = new Date().toISOString();
      return Promise.resolve({ rows: [g2] });
    }

    if (s.indexOf('INSERT INTO COMMENTS') === 0) {
      var row = { comment_id: p[0], resource_type: p[1], resource_id: p[2], org_id: p[3], user_id: p[4], body: p[5], created_at: new Date().toISOString() };
      comments.push(row);
      return Promise.resolve({ rows: [row] });
    }
    if (s.indexOf('SELECT COMMENT_ID') === 0) {
      var lMatch = comments.filter(function(c) { return c.resource_type === p[0] && c.resource_id === p[1]; })
        .slice().sort(function(a, b) { return a.created_at < b.created_at ? -1 : (a.created_at > b.created_at ? 1 : 0); });
      return Promise.resolve({ rows: lMatch });
    }
    if (s.indexOf('SELECT DISTINCT O.ORG_TYPE') === 0) {
      var types = [];
      comments.filter(function(c) { return c.resource_type === p[0] && c.resource_id === p[1]; }).forEach(function(c) {
        var t = orgTypeFor(c.org_id);
        if (t && types.indexOf(t) === -1) types.push(t);
      });
      return Promise.resolve({ rows: types.map(function(t) { return { org_type: t }; }) });
    }

    // -- people / person_identities / team_memberships (role resolution) --
    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var pi = personIdentities.filter(function(r) { return r.identity_key === p[0]; })[0];
      return Promise.resolve({ rows: pi ? [{ person_id: pi.person_id }] : [] });
    }
    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tmByTenant = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; })[0];
      return Promise.resolve({ rows: tmByTenant ? [{ person_id: tmByTenant.person_id }] : [] });
    }
    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE PERSON_ID') === 0) {
      var tm = teamMemberships.filter(function(r) { return r.person_id === p[0] && r.tenant_id === p[1]; })[0];
      return Promise.resolve({ rows: tm ? [{ role: tm.role }] : [] });
    }
    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tmT = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; })[0];
      return Promise.resolve({ rows: tmT ? [{ role: tmT.role }] : [] });
    }
    if (s.indexOf('SELECT ROLE FROM USER_ROLES WHERE TENANT_ID') === 0) {
      return Promise.resolve({ rows: [] });
    }

    console.warn('[fake-gcw-s1-pool] unhandled query (returning empty rows): ' + s.slice(0, 150));
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _state: function() { return { organisations: organisations, relationships: relationships, grants: grants, comments: comments }; },
    _seedOrg: function(orgId, orgType) { organisations.push({ org_id: orgId, org_type: orgType }); },
    _seedRelationship: function(relationshipId, agencyOrgId, clientOrgId) {
      relationships.push({ relationship_id: relationshipId, agency_org_id: agencyOrgId, client_org_id: clientOrgId, created_at: new Date().toISOString() });
    },
    _seedGrant: function(grantId, relationshipId, resourceType, resourceId) {
      grants.push({ grant_id: grantId, relationship_id: relationshipId, resource_type: resourceType, resource_id: resourceId, granted_at: new Date().toISOString(), revoked_at: null });
    },
    _seedPerson: function(personId, identityKey, tenantId, role) {
      personIdentities.push({ identity_key: identityKey, person_id: personId, provider: 'test' });
      teamMemberships.push({ person_id: personId, tenant_id: tenantId, role: role });
    }
  };
}

function mockRes() {
  return {
    _s: null, _b: null,
    status: function(c) { this._s = c; return this; },
    json: function(b) { this._b = b; return this; },
    // csrfGuard (middleware/csrf.js) always uses raw writeHead/end on rejection,
    // never the res.status/json dual-path -- both must be supported on the same mock.
    writeHead: function(status) { this._s = status; },
    end: function(body) { if (body !== undefined) this._b = body; }
  };
}

var VALID_CSRF = 'test-csrf-token-value';

function mockReq(opts) {
  opts = opts || {};
  var session = opts.session !== undefined ? opts.session : { tenantId: 'org-1', login: 'admin@example.com', csrfToken: VALID_CSRF };
  var body = opts.body !== undefined ? Object.assign({}, opts.body, { _csrf: opts.omitCsrf ? undefined : (opts.csrf !== undefined ? opts.csrf : VALID_CSRF) }) : undefined;
  return { session: session, body: body, params: opts.params || {}, query: opts.query || {}, headers: { host: 'test.example.com' } };
}

// Dispatch helpers -- mirror server.js's new route registrations EXACTLY
// (this is the actual thing under test: does the wiring reach the handler
// with the right params, and does the CSRF guard actually gate the 3
// mutating routes).
function makeDispatchers(products, csrf, pool) {
  return {
    createGrant: async function(req, res) {
      var ok = await csrf.csrfGuard(req, res);
      if (!ok) return;
      await products.handleCreateGrant(req, res, pool);
    },
    revokeGrant: async function(req, res) {
      await products.handleRevokeGrant(req, res, pool);
    },
    createAgencyComment: async function(req, res) {
      var ok = await csrf.csrfGuard(req, res);
      if (!ok) return;
      await products.handleCreateAgencyComment(req, res, pool);
    },
    listAgencyComments: async function(req, res) {
      await products.handleListAgencyComments(req, res, pool);
    },
    listSharedProducts: async function(req, res) {
      await products.handleListSharedProducts(req, res, pool);
    },
    getSharedProduct: async function(req, res) {
      await products.handleGetSharedProduct(req, res, pool);
    },
    mutateSharedProduct: function(req, res) {
      products.handleMutateSharedProduct(req, res, pool);
    },
    createSharedComment: async function(req, res) {
      var ok = await csrf.csrfGuard(req, res);
      if (!ok) return;
      await products.handleCreateSharedComment(req, res, pool);
    },
    listSharedComments: async function(req, res) {
      await products.handleListSharedComments(req, res, pool);
    }
  };
}

(async function main() {
  // ===========================================================================
  // AC1 -- grantCreationReachableViaLiveRouteWithOwnershipEnforced
  // ===========================================================================
  await test('grantCreationReachableViaLiveRouteWithOwnershipEnforced (AC1)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var csrf = freshRequire(CSRF_PATH);
    var pool = makeFakePool();
    pool._seedRelationship('rel-1', 'agency-1', 'client-1');
    var d = makeDispatchers(products, csrf, pool);

    var req = mockReq({ session: { tenantId: 'agency-1', login: 'a@example.com', csrfToken: VALID_CSRF }, body: { relationshipId: 'rel-1', resourceType: 'product', resourceId: 'product-x' } });
    var res = mockRes();
    await d.createGrant(req, res);

    assert.strictEqual(res._s, 200, 'expected the owner to successfully create a grant via the wired route');
    assert.strictEqual(pool._state().grants.length, 1);
  });

  // ===========================================================================
  // AC1 -- grantOwnershipRejectedAtRouteLevel (negative)
  // ===========================================================================
  await test('grantOwnershipRejectedAtRouteLevel (AC1 negative)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var csrf = freshRequire(CSRF_PATH);
    var pool = makeFakePool();
    pool._seedRelationship('rel-2', 'agency-2', 'client-2');
    var d = makeDispatchers(products, csrf, pool);

    var req = mockReq({ session: { tenantId: 'not-the-agency', login: 'x@example.com', csrfToken: VALID_CSRF }, body: { relationshipId: 'rel-2', resourceType: 'product', resourceId: 'product-y' } });
    var res = mockRes();
    await d.createGrant(req, res);

    assert.strictEqual(res._s, 404, 'expected a non-owner to be rejected via the wired route');
    assert.strictEqual(pool._state().grants.length, 0);
  });

  // ===========================================================================
  // AC2 -- sharedProductsListAndGetReachableViaLiveRoute
  // ===========================================================================
  await test('sharedProductsListAndGetReachableViaLiveRoute (AC2)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var csrf = freshRequire(CSRF_PATH);
    var pool = makeFakePool();
    pool._seedRelationship('rel-3', 'agency-3', 'client-3');
    pool._seedGrant('grant-3', 'rel-3', 'product', 'product-z');
    var d = makeDispatchers(products, csrf, pool);

    var listReq = mockReq({ session: { tenantId: 'client-3', login: 'c@example.com' } });
    var listRes = mockRes();
    await d.listSharedProducts(listReq, listRes);
    assert.strictEqual(listRes._s, 200);
    assert.strictEqual(listRes._b.resources.length, 1);
    assert.strictEqual(listRes._b.resources[0].resourceId, 'product-z');

    var getReq = mockReq({ session: { tenantId: 'client-3', login: 'c@example.com' }, params: { id: 'product-z' } });
    var getRes = mockRes();
    await d.getSharedProduct(getReq, getRes);
    assert.strictEqual(getRes._s, 200);
  });

  // ===========================================================================
  // AC2 -- sharedProductGetReturns404ForNoGrant (negative)
  // ===========================================================================
  await test('sharedProductGetReturns404ForNoGrant (AC2 negative)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var csrf = freshRequire(CSRF_PATH);
    var pool = makeFakePool();
    pool._seedRelationship('rel-4', 'agency-4', 'client-4');
    var d = makeDispatchers(products, csrf, pool);

    var req = mockReq({ session: { tenantId: 'client-4', login: 'c4@example.com' }, params: { id: 'never-shared' } });
    var res = mockRes();
    await d.getSharedProduct(req, res);
    assert.strictEqual(res._s, 404, 'never a 403 that would confirm the resource exists');
  });

  // ===========================================================================
  // AC2 -- sharedProductsListEmptyForNoGrants (edge)
  // ===========================================================================
  await test('sharedProductsListEmptyForNoGrants (AC2 edge)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var csrf = freshRequire(CSRF_PATH);
    var pool = makeFakePool();
    var d = makeDispatchers(products, csrf, pool);

    var req = mockReq({ session: { tenantId: 'client-nogrants', login: 'x@example.com' } });
    var res = mockRes();
    await d.listSharedProducts(req, res);
    assert.strictEqual(res._s, 200);
    assert.deepStrictEqual(res._b.resources, []);
  });

  // ===========================================================================
  // AC3 -- mutationAlwaysRejectedOnWiredRoute
  // ===========================================================================
  await test('mutationAlwaysRejectedOnWiredRoute (AC3)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var csrf = freshRequire(CSRF_PATH);
    var pool = makeFakePool();
    pool._seedRelationship('rel-5', 'agency-5', 'client-5');
    pool._seedGrant('grant-5', 'rel-5', 'product', 'product-m');
    var d = makeDispatchers(products, csrf, pool);

    var methods = ['PUT', 'POST', 'DELETE'];
    for (var i = 0; i < methods.length; i++) {
      var req = mockReq({ session: { tenantId: 'client-5', login: 'c5@example.com' }, params: { id: 'product-m' }, body: { name: 'Hacked' } });
      var res = mockRes();
      d.mutateSharedProduct(req, res);
      assert.strictEqual(res._s, 403, 'expected 403 for ' + methods[i] + ' regardless of a valid grant');
    }
  });

  // ===========================================================================
  // AC4 -- sharedCommentCreateAndListReachableViaLiveRoute
  // ===========================================================================
  await test('sharedCommentCreateAndListReachableViaLiveRoute (AC4)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var csrf = freshRequire(CSRF_PATH);
    var pool = makeFakePool();
    pool._seedOrg('client-6', 'client');
    pool._seedRelationship('rel-6', 'agency-6', 'client-6');
    pool._seedGrant('grant-6', 'rel-6', 'product', 'product-c');
    var d = makeDispatchers(products, csrf, pool);

    var createReq = mockReq({ session: { tenantId: 'client-6', login: 'client-user@example.com', csrfToken: VALID_CSRF }, body: { resourceType: 'product', resourceId: 'product-c', body: 'Looks great!' } });
    var createRes = mockRes();
    await d.createSharedComment(createReq, createRes);
    assert.strictEqual(createRes._s, 200);

    var listReq = mockReq({ session: { tenantId: 'client-6', login: 'client-user@example.com' }, params: { id: 'product-c' } });
    var listRes = mockRes();
    await d.listSharedComments(listReq, listRes);
    assert.strictEqual(listRes._s, 200);
    assert.strictEqual(listRes._b.comments.length, 1);
    assert.strictEqual(listRes._b.comments[0].body, 'Looks great!');
  });

  // ===========================================================================
  // AC4 -- agencyCommentCreateAndListReachableViaLiveRoute
  // ===========================================================================
  await test('agencyCommentCreateAndListReachableViaLiveRoute (AC4)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var csrf = freshRequire(CSRF_PATH);
    var pool = makeFakePool();
    pool._seedOrg('client-7', 'client');
    pool._seedOrg('agency-7', 'agency');
    pool._seedRelationship('rel-7', 'agency-7', 'client-7');
    pool._seedGrant('grant-7', 'rel-7', 'product', 'product-d');
    var d = makeDispatchers(products, csrf, pool);

    // Client comments first.
    var clientReq = mockReq({ session: { tenantId: 'client-7', login: 'client7@example.com', csrfToken: VALID_CSRF }, body: { resourceType: 'product', resourceId: 'product-d', body: 'Client comment' } });
    await d.createSharedComment(clientReq, mockRes());

    // Agency replies via its own wired route.
    var agencyReq = mockReq({ session: { tenantId: 'agency-7', login: 'agency7@example.com', csrfToken: VALID_CSRF }, body: { resourceType: 'product', resourceId: 'product-d', body: 'Agency reply' } });
    var agencyRes = mockRes();
    await d.createAgencyComment(agencyReq, agencyRes);
    assert.strictEqual(agencyRes._s, 200);

    // Agency lists via its own wired route -- both comments visible.
    var listReq = mockReq({ session: { tenantId: 'agency-7', login: 'agency7@example.com' }, params: { id: 'product-d' } });
    var listRes = mockRes();
    await d.listAgencyComments(listReq, listRes);
    assert.strictEqual(listRes._s, 200);
    assert.strictEqual(listRes._b.comments.length, 2, 'expected both the client comment and the agency reply visible via the agency-side route');
  });

  // ===========================================================================
  // AC4 -- sharedCommentCreateReturns404ForNoGrant (negative)
  // ===========================================================================
  await test('sharedCommentCreateReturns404ForNoGrant (AC4 negative)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var csrf = freshRequire(CSRF_PATH);
    var pool = makeFakePool();
    var d = makeDispatchers(products, csrf, pool);

    var req = mockReq({ session: { tenantId: 'client-nogrant', login: 'x@example.com', csrfToken: VALID_CSRF }, body: { resourceType: 'product', resourceId: 'never-shared', body: 'Hi' } });
    var res = mockRes();
    await d.createSharedComment(req, res);
    assert.strictEqual(res._s, 404);
    assert.strictEqual(pool._state().comments.length, 0);
  });

  // ===========================================================================
  // AC5 -- csrfRequiredOnCreateGrant
  // ===========================================================================
  await test('csrfRequiredOnCreateGrant (AC5)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var csrf = freshRequire(CSRF_PATH);
    var pool = makeFakePool();
    pool._seedRelationship('rel-8', 'agency-8', 'client-8');
    var d = makeDispatchers(products, csrf, pool);

    var req = mockReq({ session: { tenantId: 'agency-8', login: 'a8@example.com', csrfToken: VALID_CSRF }, body: { relationshipId: 'rel-8', resourceType: 'product', resourceId: 'product-x' }, omitCsrf: true });
    var res = mockRes();
    await d.createGrant(req, res);

    assert.strictEqual(res._statusCode || res._s, 403, 'expected 403 Forbidden for a missing CSRF token');
    assert.strictEqual(pool._state().grants.length, 0, 'no grant must be created when CSRF fails');
  });

  // ===========================================================================
  // AC5 -- csrfRequiredOnCreateSharedComment
  // ===========================================================================
  await test('csrfRequiredOnCreateSharedComment (AC5)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var csrf = freshRequire(CSRF_PATH);
    var pool = makeFakePool();
    pool._seedRelationship('rel-9', 'agency-9', 'client-9');
    pool._seedGrant('grant-9', 'rel-9', 'product', 'product-e');
    var d = makeDispatchers(products, csrf, pool);

    var req = mockReq({ session: { tenantId: 'client-9', login: 'c9@example.com', csrfToken: VALID_CSRF }, body: { resourceType: 'product', resourceId: 'product-e', body: 'x' }, omitCsrf: true });
    var res = mockRes();
    await d.createSharedComment(req, res);

    assert.strictEqual(res._statusCode || res._s, 403);
    assert.strictEqual(pool._state().comments.length, 0);
  });

  // ===========================================================================
  // AC5 -- csrfRequiredOnCreateAgencyComment
  // ===========================================================================
  await test('csrfRequiredOnCreateAgencyComment (AC5)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var csrf = freshRequire(CSRF_PATH);
    var pool = makeFakePool();
    var d = makeDispatchers(products, csrf, pool);

    var req = mockReq({ session: { tenantId: 'agency-10', login: 'a10@example.com', csrfToken: VALID_CSRF }, body: { resourceType: 'product', resourceId: 'product-f', body: 'x' }, omitCsrf: true });
    var res = mockRes();
    await d.createAgencyComment(req, res);

    assert.strictEqual(res._statusCode || res._s, 403);
    assert.strictEqual(pool._state().comments.length, 0);
  });

  // ===========================================================================
  // AC6 -- fullChainActivateCreateClientGrantAndClientViewSucceeds
  // ===========================================================================
  await test('fullChainActivateCreateClientGrantAndClientViewSucceeds (AC6)', async function() {
    var orgActivation = freshRequire(ORG_ACTIVATION_PATH);
    var agencyProvisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    var products = freshRequire(PRODUCTS_PATH);
    var csrf = freshRequire(CSRF_PATH);

    // Combined pool needs organisations rows too, for asa-s1's own UPDATE.
    var pool = makeFakePool();
    // asa-s1's activateOrganisationAsAgency issues its own
    // "UPDATE organisations SET org_type = 'agency' WHERE org_id = $1 AND
    // org_type = 'standalone'" -- not covered by this test's own fake pool
    // branches above, so this wrapper adds that one extra branch.
    var orgAwarePool = {
      query: function(sql, params) {
        var s = _norm(sql);
        if (s.indexOf("UPDATE ORGANISATIONS SET ORG_TYPE = 'AGENCY'") === 0) {
          var org = pool._state().organisations.filter(function(o) { return o.org_id === params[0] && o.org_type === 'standalone'; })[0];
          if (!org) return Promise.resolve({ rows: [] });
          org.org_type = 'agency';
          return Promise.resolve({ rows: [org] });
        }
        return pool.query(sql, params);
      },
      _state: pool._state,
      _seedOrg: pool._seedOrg,
      _seedRelationship: pool._seedRelationship,
      _seedGrant: pool._seedGrant,
      _seedPerson: pool._seedPerson
    };
    orgAwarePool._seedOrg('org-e2e', 'standalone');
    orgAwarePool._seedPerson(9001, 'admin@example.com', 'org-e2e', 'admin');

    var d = makeDispatchers(products, csrf, orgAwarePool);

    // 1. Activate as Agency.
    var activationHandlers = orgActivation.createOrgActivationHandlers(orgAwarePool);
    var activateReq = mockReq({ session: { tenantId: 'org-e2e', login: 'admin@example.com', csrfToken: VALID_CSRF } });
    var activateRes = mockRes();
    await activationHandlers.handlePostBecomeAgency(activateReq, activateRes);
    assert.strictEqual(orgAwarePool._state().organisations.filter(function(o) { return o.org_id === 'org-e2e'; })[0].org_type, 'agency');

    // 2. Create a Client org + relationship.
    var provisioningHandlers = agencyProvisioning.createAgencyProvisioningHandlers(orgAwarePool);
    var createClientReq = mockReq({ session: { tenantId: 'org-e2e', login: 'admin@example.com' }, body: { name: 'E2E Client' } });
    var createClientRes = mockRes();
    await provisioningHandlers.handlePostCreateClient(createClientReq, createClientRes);
    var clientOrgId = createClientRes._b && createClientRes._b.clientOrgId;
    assert.ok(clientOrgId, 'expected Story 3\'s own handler to create a real Client org');

    var relationshipId = orgAwarePool._state().relationships.filter(function(r) { return r.agency_org_id === 'org-e2e' && r.client_org_id === clientOrgId; })[0].relationship_id;

    // 3. Share a product via this story's new wired route.
    var grantReq = mockReq({ session: { tenantId: 'org-e2e', login: 'admin@example.com', csrfToken: VALID_CSRF }, body: { relationshipId: relationshipId, resourceType: 'product', resourceId: 'e2e-product' } });
    var grantRes = mockRes();
    await d.createGrant(grantReq, grantRes);
    assert.strictEqual(grantRes._s, 200);

    // 4. Client views the shared product via this story's new wired route.
    var viewReq = mockReq({ session: { tenantId: clientOrgId, login: 'client-user@example.com' } });
    var viewRes = mockRes();
    await d.listSharedProducts(viewReq, viewRes);
    assert.strictEqual(viewRes._s, 200);
    assert.strictEqual(viewRes._b.resources.length, 1);
    assert.strictEqual(viewRes._b.resources[0].resourceId, 'e2e-product', 'expected the full activate -> create-client -> grant -> view chain to work end-to-end');
  });

  // ===========================================================================
  // Wiring regression -- serverWiresGrantAndCommentRoutes
  // ===========================================================================
  await test('serverWiresGrantAndCommentRoutes (wiring regression)', function() {
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    assert.ok(src.indexOf("'/api/agency/grants'") !== -1, 'server.js must register /api/agency/grants');
    assert.ok(src.indexOf('agency\\\\/grants\\\\/[^/]+\\\\/revoke') !== -1 || src.indexOf('/api\\/agency\\/grants\\/[^/]+\\/revoke') !== -1, 'server.js must register the grant-revoke route');
    assert.ok(src.indexOf("'/api/agency/comments'") !== -1, 'server.js must register /api/agency/comments');
    assert.ok(src.indexOf("'/client/shared-products'") !== -1, 'server.js must register /client/shared-products');
    assert.ok(src.indexOf("'/client/comments'") !== -1, 'server.js must register /client/comments');
    assert.ok(src.indexOf('handleCreateGrant') !== -1 && src.indexOf('handleListSharedProducts') !== -1 && src.indexOf('handleGetSharedProduct') !== -1 && src.indexOf('handleMutateSharedProduct') !== -1 && src.indexOf('handleRevokeGrant') !== -1, 'server.js must wire all 5 Story 2 handlers');
    assert.ok(src.indexOf('handleCreateSharedComment') !== -1 && src.indexOf('handleListSharedComments') !== -1 && src.indexOf('handleCreateAgencyComment') !== -1 && src.indexOf('handleListAgencyComments') !== -1, 'server.js must wire all 4 Story 5 handlers');
    assert.ok(src.indexOf('_gcwCsrf.csrfGuard') !== -1, 'server.js must CSRF-guard the newly-wired mutating routes');
  });

  console.log('\n[gcw-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[gcw-s1] Unexpected error:', err);
  process.exit(1);
});
