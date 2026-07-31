'use strict';

// tests/check-story5-client-agency-comments.js -- story-5-client-agency-comments
// Story: artefacts/2026-07-30-agency-client-organisations/stories/story-5-client-agency-comments.md
// Test plan: artefacts/2026-07-30-agency-client-organisations/test-plans/story-5-client-agency-comments-test-plan.md
//
// Covers (13 tests across 4 ACs, plus 4 NFR tests, matching the test plan):
//   AC1: savesCommentWithAuthorMetadataVisibleToBothSides, commentFlowEndToEndForClientUserWithGrant
//   AC2: rejectsCommentSubmissionWithNoGrant, commentFlowRejectedAtRouteLevelWithNoGrant
//   AC3: agencyUserSeesClientCommentsAndCanReply, agencyReplyFlowEndToEnd
//   AC4: bidirectionalThreadSatisfiesMetricDataCondition, firesClientAgencyCommentCreatedEventOnEveryComment,
//        benefitMetricMeasurementCountsQualifyingThread
//   NFR (Performance): commentListUsesBatchedQueryNotN1
//   NFR (Security):    commentEndpointsGoThroughSameGrantCheckGuardAsStory2
//   NFR (Accessibility): commentFormIsKeyboardNavigable
//   NFR (Audit):        commentCreationIsAudited
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-story2-relationship-grants-enforcement.js) -- no Jest/Mocha.

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
var COMMENTS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'agency-client-comments'));
var GRANTS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'agency-client-grants'));
var JOURNEY_ACCESS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'middleware', 'journey-access'));
var PRODUCTS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'products'));
var POSTHOG_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'posthog-server'));

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

// ── In-memory fake pool: organisations + agency_client_relationships +
// shared_access_grants + comments ── narrow, explicit branches, mirroring
// tests/check-story2-relationship-grants-enforcement.js's
// makeFakeGrantsPool convention, extended with the two tables this story
// introduces plus a directly-seeded `organisations` array (org_id -> org_type)
// so thread_has_both_org_types can be computed via a real JOIN.
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakeCommentsPool(seed) {
  var organisations = ((seed && seed.organisations) || []).slice();
  var relationships = ((seed && seed.relationships) || []).slice();
  var grants = ((seed && seed.grants) || []).slice();
  var comments = ((seed && seed.comments) || []).slice();
  var queryLog = [];

  function orgTypeFor(orgId) {
    var row = organisations.filter(function(o) { return o.org_id === orgId; })[0];
    return row ? row.org_type : null;
  }

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];
    queryLog.push({ sql: s, params: p });

    if (s.indexOf('CREATE TABLE IF NOT EXISTS') === 0) {
      return Promise.resolve({ rows: [] });
    }

    // -- agency_client_relationships / shared_access_grants (Story 2 reuse) --
    if (s.indexOf('INSERT INTO AGENCY_CLIENT_RELATIONSHIPS') === 0) {
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
      var grantId = p[0], relId = p[1], resType = p[2], resId = p[3];
      var g = { grant_id: grantId, relationship_id: relId, resource_type: resType, resource_id: resId, granted_at: new Date().toISOString(), revoked_at: null };
      grants.push(g);
      return Promise.resolve({ rows: [g] });
    }
    // checkGrantAccess (resource_id-scoped)
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
      var revokeId = p[0];
      var g2 = grants.filter(function(g) { return g.grant_id === revokeId && !g.revoked_at; })[0];
      if (!g2) return Promise.resolve({ rows: [] });
      g2.revoked_at = new Date().toISOString();
      return Promise.resolve({ rows: [g2] });
    }

    // -- comments (this story) --
    if (s.indexOf('INSERT INTO COMMENTS') === 0) {
      var commentId = p[0], cResType = p[1], cResId = p[2], cOrgId = p[3], cUserId = p[4], cBody = p[5];
      var row = { comment_id: commentId, resource_type: cResType, resource_id: cResId, org_id: cOrgId, user_id: cUserId, body: cBody, created_at: new Date().toISOString() };
      comments.push(row);
      return Promise.resolve({ rows: [row] });
    }
    if (s.indexOf('SELECT COMMENT_ID') === 0) {
      var lResType = p[0], lResId = p[1];
      var lMatch = comments.filter(function(c) { return c.resource_type === lResType && c.resource_id === lResId; })
        .slice()
        .sort(function(a, b) { return a.created_at < b.created_at ? -1 : (a.created_at > b.created_at ? 1 : 0); });
      return Promise.resolve({ rows: lMatch });
    }
    // countQualifyingThreads (GROUP BY -- check before the DISTINCT org_type branch)
    if (s.indexOf('FROM COMMENTS C JOIN ORGANISATIONS O') !== -1 && s.indexOf('GROUP BY') !== -1) {
      var byThread = {};
      comments.forEach(function(c) {
        var key = c.resource_type + '::' + c.resource_id;
        byThread[key] = byThread[key] || [];
        byThread[key].push(orgTypeFor(c.org_id));
      });
      var qualifying = Object.keys(byThread).filter(function(key) {
        var types = byThread[key];
        return types.indexOf('agency') !== -1 && types.indexOf('client') !== -1;
      });
      return Promise.resolve({ rows: qualifying.map(function(key) {
        var parts = key.split('::');
        return { resource_type: parts[0], resource_id: parts[1] };
      }) });
    }
    // getThreadOrgTypes
    if (s.indexOf('SELECT DISTINCT O.ORG_TYPE') === 0) {
      var tResType = p[0], tResId = p[1];
      var types = [];
      comments.filter(function(c) { return c.resource_type === tResType && c.resource_id === tResId; }).forEach(function(c) {
        var t = orgTypeFor(c.org_id);
        if (t && types.indexOf(t) === -1) types.push(t);
      });
      return Promise.resolve({ rows: types.map(function(t) { return { org_type: t }; }) });
    }

    console.warn('[fake-comments-pool] unhandled query (returning empty rows): ' + s.slice(0, 150));
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _state: function() { return { organisations: organisations, relationships: relationships, grants: grants, comments: comments, queryLog: queryLog }; }
  };
}

function mockRes() {
  return { _s: null, _b: null, status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; } };
}

(async function main() {
  // ===========================================================================
  // AC1 -- savesCommentWithAuthorMetadataVisibleToBothSides (unit)
  // ===========================================================================
  await test('savesCommentWithAuthorMetadataVisibleToBothSides (AC1)', async function() {
    var comments = freshRequire(COMMENTS_PATH);
    var pool = makeFakeCommentsPool({
      organisations: [{ org_id: 'client-1', org_type: 'client' }, { org_id: 'agency-a', org_type: 'agency' }]
    });

    var saved = await comments.createComment(pool, 'product', 'product-x', 'client-1', 'alice', 'nice work', { info: function() {} });
    assert.strictEqual(saved.org_id, 'client-1');
    assert.strictEqual(saved.user_id, 'alice');
    assert.strictEqual(saved.resource_type, 'product');
    assert.strictEqual(saved.resource_id, 'product-x');
    assert.ok(saved.created_at, 'expected a created_at timestamp');

    // Visible to both the Client-org author and an Agency-org user reading the same resource.
    var list = await comments.listCommentsForResource(pool, 'product', 'product-x');
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].body, 'nice work');
  });

  // ===========================================================================
  // AC2 -- rejectsCommentSubmissionWithNoGrant (unit)
  // ===========================================================================
  await test('rejectsCommentSubmissionWithNoGrant (AC2)', async function() {
    var grants = freshRequire(GRANTS_PATH);
    var { requireGrantAccess, asHttpResponse, POLICY } = freshRequire(JOURNEY_ACCESS_PATH);
    var pool = makeFakeCommentsPool();

    // No relationship, no grant at all for 'product-y'.
    var grant = await grants.checkGrantAccess(pool, 'client-1', 'product', 'product-y');
    assert.strictEqual(grant, null);

    var threw = false; var code = null;
    try { requireGrantAccess(grant); } catch (e) { threw = true; code = e.code; }
    assert.ok(threw, 'requireGrantAccess must throw when no grant exists');
    var status = asHttpResponse({ code: code }, POLICY.TENANT);
    assert.strictEqual(status, 404, 'no-grant comment submission must resolve to 404, never 403 -- matches Story 2 AC4 exactly');

    // No comment row must have been created as a side effect.
    assert.strictEqual(pool._state().comments.length, 0, 'expected zero comment rows created for a rejected submission');
  });

  // ===========================================================================
  // AC3 -- agencyUserSeesClientCommentsAndCanReply (unit)
  // ===========================================================================
  await test('agencyUserSeesClientCommentsAndCanReply (AC3)', async function() {
    var comments = freshRequire(COMMENTS_PATH);
    var pool = makeFakeCommentsPool({
      organisations: [{ org_id: 'client-1', org_type: 'client' }, { org_id: 'agency-a', org_type: 'agency' }]
    });
    await comments.createComment(pool, 'product', 'product-x', 'client-1', 'alice', 'client comment', { info: function() {} });

    var beforeReply = await comments.listCommentsForResource(pool, 'product', 'product-x');
    assert.strictEqual(beforeReply.length, 1, 'Agency user must see the Client comment');
    assert.strictEqual(beforeReply[0].org_id, 'client-1');

    // Agency-org user replies.
    await comments.createComment(pool, 'product', 'product-x', 'agency-a', 'bob', 'agency reply', { info: function() {} });

    // Explicit assertion of bidirectional visibility (closes review's LOW-1) --
    // the Agency reply must itself show up in a subsequent read, not just the
    // original Client comment.
    var afterReply = await comments.listCommentsForResource(pool, 'product', 'product-x');
    assert.strictEqual(afterReply.length, 2, 'expected both the original Client comment and the Agency reply');
    var replyRow = afterReply.filter(function(c) { return c.org_id === 'agency-a'; })[0];
    assert.ok(replyRow, 'the Agency reply must be visible in the thread');
    assert.strictEqual(replyRow.body, 'agency reply');
  });

  // ===========================================================================
  // AC4 -- bidirectionalThreadSatisfiesMetricDataCondition (unit)
  // ===========================================================================
  await test('bidirectionalThreadSatisfiesMetricDataCondition (AC4)', async function() {
    var comments = freshRequire(COMMENTS_PATH);
    var pool = makeFakeCommentsPool({
      organisations: [{ org_id: 'client-1', org_type: 'client' }, { org_id: 'agency-a', org_type: 'agency' }]
    });
    await comments.createComment(pool, 'product', 'product-x', 'client-1', 'alice', 'client comment', { info: function() {} });
    await comments.createComment(pool, 'product', 'product-x', 'agency-a', 'bob', 'agency reply', { info: function() {} });

    var count = await comments.countQualifyingThreads(pool);
    assert.strictEqual(count, 1, 'expected the bidirectional thread to be counted as satisfying the metric data condition');
  });

  // ===========================================================================
  // AC4 -- firesClientAgencyCommentCreatedEventOnEveryComment (unit, edge case)
  // ===========================================================================
  await test('firesClientAgencyCommentCreatedEventOnEveryComment (AC4, edge case)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var pool = makeFakeCommentsPool({
      organisations: [{ org_id: 'client-1', org_type: 'client' }, { org_id: 'agency-a', org_type: 'agency' }],
      relationships: [{ relationship_id: 'rel-1', agency_org_id: 'agency-a', client_org_id: 'client-1', created_at: new Date().toISOString() }],
      grants: [{ grant_id: 'grant-1', relationship_id: 'rel-1', resource_type: 'product', resource_id: 'product-x', granted_at: new Date().toISOString(), revoked_at: null }]
    });

    // Plain require (NOT freshRequire) -- must be the SAME cached module
    // object products.js's own `require('../modules/posthog-server')` call
    // already resolved to (products was just freshRequired above, which
    // populated/reused that cache entry), otherwise this monkeypatch would
    // land on a different object than the one products.js actually calls.
    var posthogServer = require(POSTHOG_PATH);
    var captured = [];
    posthogServer.capture = function(distinctId, event, properties) { captured.push({ distinctId: distinctId, event: event, properties: properties }); };

    // First comment: Client-org user (no Agency comment yet on this thread).
    var reqClient = { session: { tenantId: 'client-1', login: 'alice' }, body: { resourceType: 'product', resourceId: 'product-x', body: 'client comment' } };
    var resClient = mockRes();
    await products.handleCreateSharedComment(reqClient, resClient, pool);
    assert.strictEqual(resClient._s, 200, 'expected the granted Client comment submission to succeed');

    assert.strictEqual(captured.length, 1, 'expected exactly one client_agency_comment_created event after the first comment');
    assert.strictEqual(captured[0].event, 'client_agency_comment_created');
    assert.strictEqual(captured[0].properties.org_id, 'client-1');
    assert.strictEqual(captured[0].properties.resource_type, 'product');
    assert.strictEqual(captured[0].properties.resource_id, 'product-x');
    assert.strictEqual(captured[0].properties.thread_has_both_org_types, false, 'expected false -- only one org type has commented so far');

    // Second comment: Agency-org user, completing the bidirectional thread.
    var reqAgency = { session: { tenantId: 'agency-a', login: 'bob' }, body: { resourceType: 'product', resourceId: 'product-x', body: 'agency reply' } };
    var resAgency = mockRes();
    await products.handleCreateAgencyComment(reqAgency, resAgency, pool);
    assert.strictEqual(resAgency._s, 200);

    assert.strictEqual(captured.length, 2, 'expected a second client_agency_comment_created event after the Agency reply');
    assert.strictEqual(captured[1].properties.thread_has_both_org_types, true, 'expected true now that both an Agency-org and Client-org comment exist -- this must be a real computation, not a hardcoded value');

    // Reset the monkeypatch so later tests in this file (or a subsequent file
    // sharing the process) never see this test's spy.
    posthogServer.capture = function() {};
  });

  // ===========================================================================
  // AC1 -- commentFlowEndToEndForClientUserWithGrant (integration)
  // ===========================================================================
  await test('commentFlowEndToEndForClientUserWithGrant (AC1)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var pool = makeFakeCommentsPool({
      organisations: [{ org_id: 'client-1', org_type: 'client' }],
      relationships: [{ relationship_id: 'rel-1', agency_org_id: 'agency-a', client_org_id: 'client-1', created_at: new Date().toISOString() }],
      grants: [{ grant_id: 'grant-1', relationship_id: 'rel-1', resource_type: 'product', resource_id: 'product-x', granted_at: new Date().toISOString(), revoked_at: null }]
    });

    var req = { session: { tenantId: 'client-1', login: 'alice' }, body: { resourceType: 'product', resourceId: 'product-x', body: 'hello from client' } };
    var res = mockRes();
    await products.handleCreateSharedComment(req, res, pool);
    assert.strictEqual(res._s, 200, 'expected success for a granted Client-org submission');
    assert.ok(res._b && res._b.success);

    // Retrievable via the resource's comment-list route.
    var listReq = { session: { tenantId: 'client-1' }, params: { id: 'product-x' }, query: { resourceType: 'product' } };
    var listRes = mockRes();
    await products.handleListSharedComments(listReq, listRes, pool);
    assert.strictEqual(listRes._s, 200);
    assert.strictEqual(listRes._b.comments.length, 1);
    assert.strictEqual(listRes._b.comments[0].body, 'hello from client');
  });

  // ===========================================================================
  // AC2 -- commentFlowRejectedAtRouteLevelWithNoGrant (integration, full route stack)
  // ===========================================================================
  await test('commentFlowRejectedAtRouteLevelWithNoGrant (AC2)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var pool = makeFakeCommentsPool({ organisations: [{ org_id: 'client-1', org_type: 'client' }] });

    var req = { session: { tenantId: 'client-1', login: 'alice' }, body: { resourceType: 'product', resourceId: 'never-shared-product', body: 'crafted request' } };
    var res = mockRes();
    await products.handleCreateSharedComment(req, res, pool);

    assert.strictEqual(res._s, 404, 'expected 404, matching Story 2 AC4\'s policy exactly -- same guard, not a parallel access-control path');
    assert.deepStrictEqual(Object.keys(res._b), ['error'], 'the 404 body must not reveal resource existence');
    assert.strictEqual(pool._state().comments.length, 0, 'no comment row should be created for a rejected submission');
  });

  // ===========================================================================
  // AC3 -- agencyReplyFlowEndToEnd (integration, full route stack)
  // ===========================================================================
  await test('agencyReplyFlowEndToEnd (AC3)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var comments = freshRequire(COMMENTS_PATH);
    var pool = makeFakeCommentsPool({
      organisations: [{ org_id: 'client-1', org_type: 'client' }, { org_id: 'agency-a', org_type: 'agency' }]
    });
    await comments.createComment(pool, 'product', 'shared-product', 'client-1', 'alice', 'existing client comment', { info: function() {} });

    var getReq = { session: { tenantId: 'agency-a' }, params: { id: 'shared-product' }, query: { resourceType: 'product' } };
    var getRes = mockRes();
    await products.handleListAgencyComments(getReq, getRes, pool);
    assert.strictEqual(getRes._s, 200);
    assert.strictEqual(getRes._b.comments.length, 1, 'Client comment must be visible in the GET response');

    var postReq = { session: { tenantId: 'agency-a', login: 'bob' }, body: { resourceType: 'product', resourceId: 'shared-product', body: 'agency reply' } };
    var postRes = mockRes();
    await products.handleCreateAgencyComment(postReq, postRes, pool);
    assert.strictEqual(postRes._s, 200);

    var getReq2 = { session: { tenantId: 'agency-a' }, params: { id: 'shared-product' }, query: { resourceType: 'product' } };
    var getRes2 = mockRes();
    await products.handleListAgencyComments(getReq2, getRes2, pool);
    assert.strictEqual(getRes2._b.comments.length, 2, 'expected the Agency reply to appear in a subsequent GET');
    assert.ok(getRes2._b.comments.some(function(c) { return c.body === 'agency reply'; }));
  });

  // ===========================================================================
  // AC4 -- benefitMetricMeasurementCountsQualifyingThread (integration)
  // ===========================================================================
  await test('benefitMetricMeasurementCountsQualifyingThread (AC4)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var comments = freshRequire(COMMENTS_PATH);
    var pool = makeFakeCommentsPool({
      organisations: [{ org_id: 'client-1', org_type: 'client' }, { org_id: 'agency-a', org_type: 'agency' }],
      relationships: [{ relationship_id: 'rel-1', agency_org_id: 'agency-a', client_org_id: 'client-1', created_at: new Date().toISOString() }],
      grants: [{ grant_id: 'grant-1', relationship_id: 'rel-1', resource_type: 'product', resource_id: 'product-x', granted_at: new Date().toISOString(), revoked_at: null }]
    });

    var clientReq = { session: { tenantId: 'client-1', login: 'alice' }, body: { resourceType: 'product', resourceId: 'product-x', body: 'client comment' } };
    await products.handleCreateSharedComment(clientReq, mockRes(), pool);
    var agencyReq = { session: { tenantId: 'agency-a', login: 'bob' }, body: { resourceType: 'product', resourceId: 'product-x', body: 'agency reply' } };
    await products.handleCreateAgencyComment(agencyReq, mockRes(), pool);

    var count = await comments.countQualifyingThreads(pool);
    assert.strictEqual(count, 1, 'expected the seeded bidirectional thread to be counted correctly end-to-end');
  });

  // ===========================================================================
  // NFR (Performance) -- commentListUsesBatchedQueryNotN1
  // ===========================================================================
  await test('commentListUsesBatchedQueryNotN1 (NFR-perf)', async function() {
    var comments = freshRequire(COMMENTS_PATH);
    var pool = makeFakeCommentsPool({
      organisations: [{ org_id: 'client-1', org_type: 'client' }, { org_id: 'agency-a', org_type: 'agency' }]
    });
    await comments.createComment(pool, 'product', 'product-x', 'client-1', 'alice', 'comment 1', { info: function() {} });
    await comments.createComment(pool, 'product', 'product-x', 'agency-a', 'bob', 'comment 2', { info: function() {} });
    await comments.createComment(pool, 'product', 'product-x', 'client-1', 'alice', 'comment 3', { info: function() {} });

    var before = pool._state().queryLog.length;
    var list = await comments.listCommentsForResource(pool, 'product', 'product-x');
    var after = pool._state().queryLog.length;

    assert.strictEqual(list.length, 3, 'expected all 3 comments returned');
    assert.strictEqual(after - before, 1, 'expected exactly ONE batched query for the whole comment-list read, regardless of comment count, got ' + (after - before));
  });

  // ===========================================================================
  // NFR (Security) -- commentEndpointsGoThroughSameGrantCheckGuardAsStory2
  // ===========================================================================
  await test('commentEndpointsGoThroughSameGrantCheckGuardAsStory2 (NFR-security)', async function() {
    var productsSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'routes', 'products.js'), 'utf8');
    var sectionMarker = 'story-5-client-agency-comments (artefacts/2026-07-30-agency-client-organisations)';
    var sectionStart = productsSrc.indexOf(sectionMarker);
    assert.ok(sectionStart !== -1, 'expected this story\'s section banner to be present in products.js');
    var section = productsSrc.slice(sectionStart);

    // Same function references Story 2's own handlers use, not a duplicated/parallel implementation.
    assert.ok(/_agencyClientGrants\.checkGrantAccess/.test(section), 'expected the comment route to call _agencyClientGrants.checkGrantAccess directly');
    assert.ok(/_journeyAccess\.requireGrantAccess/.test(section), 'expected the comment route to call _journeyAccess.requireGrantAccess directly');
    assert.ok(/_journeyAccess\.asHttpResponse/.test(section), 'expected the comment route to call _journeyAccess.asHttpResponse directly');

    // Zero direct SQL against the two Story 2 tables in this story's own section.
    var directQueryPattern = /pool\.query\([^)]*(agency_client_relationships|shared_access_grants)/i;
    assert.ok(!directQueryPattern.test(section), 'expected zero direct pool.query() calls against Story 2\'s tables in this story\'s route-handler section');
  });

  // ===========================================================================
  // NFR (Accessibility) -- commentFormIsKeyboardNavigable
  // ===========================================================================
  await test('commentFormIsKeyboardNavigable (NFR-accessibility)', async function() {
    var products = freshRequire(PRODUCTS_PATH);
    var html = products.renderCommentThreadHtml([
      { commentId: 'c-1', resourceType: 'product', resourceId: 'product-x', orgId: 'client-1', userId: 'alice', body: 'hi', createdAt: new Date().toISOString() }
    ], 'product', 'product-x');

    assert.ok(/<form[\s>]/.test(html), 'expected a real <form> element');
    assert.ok(/<textarea[\s>]/.test(html), 'expected a real <textarea> element');
    assert.ok(/<ul[\s>]/.test(html) || /<ol[\s>]/.test(html), 'expected a semantic list element for the comment thread');
    assert.ok(/<li[\s>]/.test(html), 'expected semantic list items for each comment');
    assert.ok(/<button[\s>]/.test(html), 'expected a real, focusable submit control');
  });

  // ===========================================================================
  // NFR (Audit) -- commentCreationIsAudited
  // ===========================================================================
  await test('commentCreationIsAudited (NFR-audit)', async function() {
    var comments = freshRequire(COMMENTS_PATH);
    var pool = makeFakeCommentsPool({ organisations: [{ org_id: 'client-1', org_type: 'client' }] });
    var logCalls = [];
    var logger = { info: function(msg) { logCalls.push(msg); } };

    await comments.createComment(pool, 'product', 'product-x', 'client-1', 'alice', 'audited comment', logger);

    var creationLog = logCalls.filter(function(m) { return m.indexOf('comment_created') !== -1; });
    assert.strictEqual(creationLog.length, 1, 'expected exactly one comment-creation audit log entry');
    var parsed = JSON.parse(creationLog[0]);
    assert.strictEqual(parsed.org_id, 'client-1');
    assert.strictEqual(parsed.user_id, 'alice');
    assert.strictEqual(parsed.resource_type, 'product');
    assert.strictEqual(parsed.resource_id, 'product-x');
    assert.ok(parsed.timestamp, 'audit entry must contain a timestamp');
  });

  console.log('\n[story-5-client-agency-comments] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[story-5-client-agency-comments] Unexpected error:', err);
  process.exit(1);
});
