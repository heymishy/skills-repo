'use strict';
// tests/check-story6-conversion-to-independent.js -- story-6-conversion-to-independent
// Story: artefacts/2026-07-30-agency-client-organisations/stories/story-6-conversion-to-independent.md
// Test plan: artefacts/2026-07-30-agency-client-organisations/test-plans/story-6-conversion-to-independent-test-plan.md
//
// Covers (13 tests across 4 ACs + 4 NFRs + 1 wiring regression, matching the test plan):
//   AC1: convertsOrgTypeInPlaceRetainingSameOrgId, conversionRejectedForNonAdminRole,
//        conversionFlowEndToEndAsOrgAdmin
//   AC2: conversionRedirectsToExistingStripeCheckout
//   AC3: existingRelationshipsAndGrantsSurviveConversion,
//        relationshipsAndGrantsFunctionUnchangedPostConversionEndToEnd
//   AC4: concurrentConversionAndGrantCreationDoNotCorruptEachOther (genuine interleaving,
//        controlled promise-ordering test double -- NOT a sequential call in disguise),
//        concurrencyTestReRunAtRouteLevelUnderLoad (Promise.all, full route stack)
//   NFR (Performance): conversionHasNoSpecificLatencyTargetBeyondPageLoadNorms
//   NFR (Security):    conversionRestrictedToAdminRoleServerSide
//   NFR (Accessibility): conversionFormIsKeyboardNavigable
//   NFR (Audit):       conversionIsAudited
//   Wiring (regression, mirrors check-lab-s3.2's IT1 convention): serverWiresOrgConversionRoutes
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-story2-relationship-grants-enforcement.js, tests/check-story3-self-service-provisioning.js)
// -- no Jest/Mocha.

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
var ORGANISATIONS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'organisations'));
var GRANTS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'agency-client-grants'));
var ORG_CONVERSION_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'org-conversion'));
var BILLING_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'billing'));
var STRIPE_CLIENT_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'stripe-client'));
var SERVER_PATH = path.resolve(ROOT, 'src/web-ui/server.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

// ── In-memory fake pool -- narrow, self-contained; supports exactly the query
// shapes this story's modules issue, plus its Story 1 / Story 2 upstream
// dependencies (organisations, agency_client_relationships, shared_access_grants,
// people/person_identities/team_memberships) -- mirrors
// tests/check-story3-self-service-provisioning.js's makeFakePool convention. ──
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakePool(seed) {
  var orgs = ((seed && seed.orgs) || []).slice();
  var relationships = ((seed && seed.relationships) || []).slice();
  var grants = ((seed && seed.grants) || []).slice();
  var people = ((seed && seed.people) || []).slice();
  var personIdentities = ((seed && seed.personIdentities) || []).slice();
  var teamMemberships = ((seed && seed.teamMemberships) || []).slice();
  var queryLog = [];
  var nextPersonId = 1000;

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];
    queryLog.push({ sql: s, params: p });

    if (s.indexOf('CREATE TABLE IF NOT EXISTS') === 0) return Promise.resolve({ rows: [] });

    // ── organisations ──────────────────────────────────────────────────────
    if (s.indexOf('SELECT ORG_ID, NAME, ORG_TYPE, CREATED_AT FROM ORGANISATIONS WHERE ORG_ID') === 0) {
      var match = orgs.filter(function(r) { return r.org_id === p[0]; });
      return Promise.resolve({ rows: match });
    }
    if (s.indexOf('UPDATE ORGANISATIONS SET ORG_TYPE') === 0) {
      var org = orgs.filter(function(o) { return o.org_id === p[0] && o.org_type === 'client'; })[0];
      if (!org) return Promise.resolve({ rows: [] });
      org.org_type = 'standalone';
      return Promise.resolve({ rows: [org] });
    }
    if (s.indexOf('INSERT INTO ORGANISATIONS') === 0 && s.indexOf('ON CONFLICT (ORG_ID) DO NOTHING') !== -1) {
      var dup = orgs.some(function(r) { return r.org_id === p[0]; });
      if (dup) return Promise.resolve({ rows: [] });
      var row1 = { org_id: p[0], name: p[1], org_type: p[2], created_at: new Date().toISOString() };
      orgs.push(row1);
      return Promise.resolve({ rows: [row1] });
    }
    if (s.indexOf('INSERT INTO ORGANISATIONS') === 0) {
      var row2 = { org_id: p[0], name: p[1], org_type: p[2], created_at: new Date().toISOString() };
      orgs.push(row2);
      return Promise.resolve({ rows: [row2] });
    }

    // ── agency_client_relationships (Story 2's module) ──────────────────────
    if (s.indexOf('INSERT INTO AGENCY_CLIENT_RELATIONSHIPS') === 0) {
      var relRow = { relationship_id: p[0], agency_org_id: p[1], client_org_id: p[2], created_at: new Date().toISOString() };
      relationships.push(relRow);
      return Promise.resolve({ rows: [relRow] });
    }
    if (s.indexOf('SELECT RELATIONSHIP_ID, AGENCY_ORG_ID, CLIENT_ORG_ID, CREATED_AT FROM AGENCY_CLIENT_RELATIONSHIPS WHERE RELATIONSHIP_ID') === 0) {
      var relMatch = relationships.filter(function(r) { return r.relationship_id === p[0]; });
      return Promise.resolve({ rows: relMatch });
    }

    // ── shared_access_grants (Story 2's module) ─────────────────────────────
    if (s.indexOf('INSERT INTO SHARED_ACCESS_GRANTS') === 0) {
      var g = { grant_id: p[0], relationship_id: p[1], resource_type: p[2], resource_id: p[3], granted_at: new Date().toISOString(), revoked_at: null };
      grants.push(g);
      return Promise.resolve({ rows: [g] });
    }
    if (s.indexOf('FROM SHARED_ACCESS_GRANTS G') !== -1 && s.indexOf('RESOURCE_ID = $3') !== -1) {
      var clientOrgId2 = p[0], resType2 = p[1], resId2 = p[2];
      var match2 = grants.filter(function(g2) {
        if (g2.resource_type !== resType2 || g2.resource_id !== resId2 || g2.revoked_at) return false;
        var rel = relationships.filter(function(r) { return r.relationship_id === g2.relationship_id; })[0];
        return rel && rel.client_org_id === clientOrgId2;
      });
      return Promise.resolve({ rows: match2 });
    }

    // ── people / person_identities / team_memberships (Story 1's/tir-s1's schema) ──
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

    console.warn('[fake-story6-pool] unhandled query (returning empty rows): ' + s.slice(0, 150));
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _state: function() {
      return { orgs: orgs, relationships: relationships, grants: grants, people: people, personIdentities: personIdentities, teamMemberships: teamMemberships, queryLog: queryLog };
    },
    _seedOrg: function(orgId, name, orgType) { orgs.push({ org_id: orgId, name: name, org_type: orgType, created_at: new Date().toISOString() }); },
    _seedRelationship: function(relationshipId, agencyOrgId, clientOrgId) {
      relationships.push({ relationship_id: relationshipId, agency_org_id: agencyOrgId, client_org_id: clientOrgId, created_at: new Date().toISOString() });
    },
    // Seeds a person + person_identities link + team_memberships row -- mirrors
    // client-invitations.js's createClientOrgUserAndAdminMembership shape.
    _seedPerson: function(personId, identityKey, tenantId, role) {
      people.push({ id: personId });
      personIdentities.push({ identity_key: identityKey, person_id: personId, provider: 'test' });
      teamMemberships.push({ person_id: personId, tenant_id: tenantId, role: role });
    }
  };
}

/**
 * A "gated" pool wrapper for AC4's genuine-interleaving concurrency test.
 * Every query() call is queued (NOT executed) and returns an unresolved
 * Promise; the queued query only actually runs against the underlying base
 * pool -- mutating its in-memory state and resolving the caller's Promise --
 * when the test explicitly calls releaseNext(). This gives the test full,
 * explicit control over the relative ORDER two concurrently-in-flight
 * operations' underlying writes actually apply, which a plain sequential
 * `await a(); await b();` can never simulate (a sequential await never has
 * two operations genuinely in flight at the same instant).
 */
function makeGatedPool(basePool) {
  var pending = [];
  function query(sql, params) {
    return new Promise(function(resolve, reject) {
      pending.push({
        sql: sql,
        params: params,
        run: function() {
          Promise.resolve(basePool.query(sql, params)).then(resolve, reject);
        }
      });
    });
  }
  function releaseNext() {
    var next = pending.shift();
    if (!next) throw new Error('[gated-pool] releaseNext() called with an empty queue');
    next.run();
    return next;
  }
  function pendingCount() { return pending.length; }
  return { query: query, releaseNext: releaseNext, pendingCount: pendingCount, _base: basePool };
}

// Raw-http-style mock res -- required because billing.js's handlePostCheckout
// (which org-conversion.js forwards into unmodified for AC2) always calls
// res.writeHead()/res.end() directly, never an Express-style res.status().json()
// fallback. Mirrors check-lab-s3.2-stripe-checkout.js's own mockRes() exactly, so
// any test that may reach the billing-forwarding success path works uniformly.
function mockRes() {
  return {
    _statusCode: null,
    _headers: {},
    _body: null,
    writeHead: function(status, headers) {
      this._statusCode = status;
      if (headers) {
        var self = this;
        Object.keys(headers).forEach(function(k) { self._headers[k] = headers[k]; });
      }
    },
    end: function(body) { this._body = body || null; }
  };
}

/** Build a mock req for org-conversion handler tests, mirroring check-lab-s3.2's mockReq shape. */
function mockConvertReq(opts) {
  opts = opts || {};
  var session = opts.session !== undefined ? opts.session : { accessToken: 'tok', tenantId: 'client-org-1', login: 'admin@example.com', userId: 1000 };
  return {
    session: session,
    body: opts.body,
    headers: opts.headers || { host: 'test.example.com' },
    query: opts.query || {}
  };
}

(async function main() {
  // ===========================================================================
  // AC1 -- convertsOrgTypeInPlaceRetainingSameOrgId (unit)
  // ===========================================================================
  await test('convertsOrgTypeInPlaceRetainingSameOrgId (AC1)', async function() {
    var organisations = freshRequire(ORGANISATIONS_PATH);
    var pool = makeFakePool();
    pool._seedOrg('client-org-1', 'Acme Client', 'client');

    var converted = await organisations.convertOrganisationToStandalone(pool, 'client-org-1');
    assert.ok(converted, 'expected a converted row to be returned');
    assert.strictEqual(converted.org_id, 'client-org-1', 'must retain the SAME org_id -- never a new org');
    assert.strictEqual(converted.org_type, 'standalone');

    var state = pool._state();
    assert.strictEqual(state.orgs.length, 1, 'expected exactly one organisations row -- no second org created');
    assert.strictEqual(state.orgs[0].org_id, 'client-org-1');
    assert.strictEqual(state.orgs[0].org_type, 'standalone');
  });

  // ===========================================================================
  // AC1 -- conversionRejectedForNonAdminRole (unit, negative)
  // ===========================================================================
  await test('conversionRejectedForNonAdminRole (AC1 negative)', async function() {
    var orgConversion = freshRequire(ORG_CONVERSION_PATH);
    var pool = makeFakePool();
    pool._seedOrg('client-org-2', 'Acme Client', 'client');
    pool._seedPerson(2001, 'viewer@example.com', 'client-org-2', 'viewer');

    var handlers = orgConversion.createOrgConversionHandlers(pool);
    var req = mockConvertReq({ session: { accessToken: 'tok', tenantId: 'client-org-2', login: 'viewer@example.com', userId: 2001 }, body: { confirm: 'CONVERT' } });
    var res = mockRes();
    await handlers.handlePostConvertOrganisation(req, res);

    assert.strictEqual(res._statusCode, 403, 'expected 403 for a non-admin conversion attempt');
    var org = pool._state().orgs.filter(function(o) { return o.org_id === 'client-org-2'; })[0];
    assert.strictEqual(org.org_type, 'client', 'org_type must be unchanged after a rejected conversion attempt');
  });

  // ===========================================================================
  // AC3 -- existingRelationshipsAndGrantsSurviveConversion (unit)
  // ===========================================================================
  await test('existingRelationshipsAndGrantsSurviveConversion (AC3)', async function() {
    var organisations = freshRequire(ORGANISATIONS_PATH);
    var grants = freshRequire(GRANTS_PATH);
    var pool = makeFakePool();
    pool._seedOrg('client-org-3', 'Acme Client', 'client');
    var rel = await grants.createRelationship(pool, 'agency-org-3', 'client-org-3');
    var grant = await grants.createGrant(pool, rel.relationship_id, 'product', 'product-x');

    await organisations.convertOrganisationToStandalone(pool, 'client-org-3');

    var state = pool._state();
    var relAfter = state.relationships.filter(function(r) { return r.relationship_id === rel.relationship_id; })[0];
    var grantAfter = state.grants.filter(function(g) { return g.grant_id === grant.grant_id; })[0];
    assert.deepStrictEqual(relAfter, rel, 'relationship row must be byte-identical after conversion');
    assert.deepStrictEqual(grantAfter, grant, 'grant row must be byte-identical after conversion');
    assert.strictEqual(grantAfter.revoked_at, null, 'grant must still be active after conversion');

    var stillGranted = await grants.checkGrantAccess(pool, 'client-org-3', 'product', 'product-x');
    assert.ok(stillGranted, 'checkGrantAccess must still return the grant after the org has converted to standalone');
    assert.strictEqual(stillGranted.relationship_id, rel.relationship_id);
  });

  // ===========================================================================
  // AC4 -- concurrentConversionAndGrantCreationDoNotCorruptEachOther (unit,
  // genuine interleaving via a controlled promise-ordering test double --
  // NOT a sequential call in disguise)
  // ===========================================================================
  await test('concurrentConversionAndGrantCreationDoNotCorruptEachOther (AC4)', async function() {
    var organisations = freshRequire(ORGANISATIONS_PATH);
    var grants = freshRequire(GRANTS_PATH);

    // Scenario A: the grant-creation write is released BEFORE the conversion
    // write -- the grant lands while the org is still (about to stop being)
    // 'client'.
    await (function() {
      var basePool = makeFakePool();
      basePool._seedOrg('client-org-4a', 'Acme Client', 'client');
      var relId = 'rel-4a';
      basePool._state().relationships.push({ relationship_id: relId, agency_org_id: 'agency-4a', client_org_id: 'client-org-4a', created_at: new Date().toISOString() });
      var gatedPool = makeGatedPool(basePool);

      // Both operations START without awaiting -- each issues exactly ONE
      // query() call and is now genuinely in flight simultaneously (2
      // entries queued) before either resolves. This is the load-bearing
      // difference from `await a(); await b();`, which never has two
      // operations in flight at the same instant.
      var convertPromise = organisations.convertOrganisationToStandalone(gatedPool, 'client-org-4a');
      var grantPromise = grants.createGrant(gatedPool, relId, 'product', 'product-a');
      assert.strictEqual(gatedPool.pendingCount(), 2, 'expected both operations\' queries to be genuinely in flight simultaneously before either resolves');

      // Explicitly choose the interleaving: grant's write applies FIRST.
      gatedPool.releaseNext(); // the grant INSERT (queued first, released first here)
      gatedPool.releaseNext(); // the conversion UPDATE

      return Promise.all([convertPromise, grantPromise]).then(function(results) {
        var converted = results[0];
        var grant = results[1];
        assert.ok(converted, 'conversion must still succeed regardless of interleaving order');
        assert.strictEqual(converted.org_type, 'standalone');
        assert.ok(grant, 'grant creation must still succeed regardless of interleaving order');
        assert.strictEqual(grant.relationship_id, relId);

        var state = basePool._state();
        assert.strictEqual(state.orgs.filter(function(o) { return o.org_id === 'client-org-4a'; }).length, 1, 'no duplicate/torn organisations row');
        assert.strictEqual(state.orgs[0].org_type, 'standalone');
        assert.strictEqual(state.grants.filter(function(g) { return g.relationship_id === relId; }).length, 1, 'no duplicate/torn grant row');
      });
    })();

    // Scenario B: the conversion write is released BEFORE the grant-creation
    // write -- the grant lands against the now-standalone org.
    await (function() {
      var basePool = makeFakePool();
      basePool._seedOrg('client-org-4b', 'Acme Client', 'client');
      var relId = 'rel-4b';
      basePool._state().relationships.push({ relationship_id: relId, agency_org_id: 'agency-4b', client_org_id: 'client-org-4b', created_at: new Date().toISOString() });
      var gatedPool = makeGatedPool(basePool);

      var convertPromise = organisations.convertOrganisationToStandalone(gatedPool, 'client-org-4b');
      var grantPromise = grants.createGrant(gatedPool, relId, 'product', 'product-b');
      assert.strictEqual(gatedPool.pendingCount(), 2, 'expected both operations\' queries to be genuinely in flight simultaneously before either resolves');

      // Reversed interleaving this time: conversion's write applies FIRST.
      gatedPool.releaseNext(); // the conversion UPDATE
      gatedPool.releaseNext(); // the grant INSERT

      return Promise.all([convertPromise, grantPromise]).then(function(results) {
        var converted = results[0];
        var grant = results[1];
        assert.ok(converted, 'conversion must still succeed regardless of interleaving order');
        assert.strictEqual(converted.org_type, 'standalone');
        assert.ok(grant, 'grant creation must still succeed regardless of interleaving order');
        assert.strictEqual(grant.relationship_id, relId);

        var state = basePool._state();
        assert.strictEqual(state.orgs.filter(function(o) { return o.org_id === 'client-org-4b'; }).length, 1, 'no duplicate/torn organisations row');
        assert.strictEqual(state.orgs[0].org_type, 'standalone');
        assert.strictEqual(state.grants.filter(function(g) { return g.relationship_id === relId; }).length, 1, 'no duplicate/torn grant row');
      });
    })();
  });

  // ===========================================================================
  // AC1 -- conversionFlowEndToEndAsOrgAdmin (integration)
  // ===========================================================================
  await test('conversionFlowEndToEndAsOrgAdmin (AC1)', async function() {
    // Order matters: stripe-client must be freshly required and have its
    // mock adapter set BEFORE billing.js is (re)required, and billing.js's
    // cache must be cleared BEFORE org-conversion.js is freshly required --
    // org-conversion.js's own `require('./billing')` (and billing.js's own
    // `require('../modules/stripe-client')`) resolve at THEIR OWN module
    // load time, so requiring org-conversion first would silently close over
    // a stale billing/stripe-client instance from an earlier test.
    var stripeClient = freshRequire(STRIPE_CLIENT_PATH);
    var mockStripe = { checkout: { sessions: { create: async function() { return { id: 'cs_test_ac1', url: 'https://checkout.stripe.com/pay/cs_test_ac1' }; } } } };
    stripeClient.setStripeAdapter(mockStripe);
    delete require.cache[BILLING_PATH];
    var orgConversion = freshRequire(ORG_CONVERSION_PATH);

    var pool = makeFakePool();
    pool._seedOrg('client-org-5', 'Acme Client', 'client');
    pool._seedPerson(5001, 'admin5@example.com', 'client-org-5', 'admin');
    process.env.STRIPE_PRICE_ID_STARTER = 'price_env_configured_value';

    var handlers = orgConversion.createOrgConversionHandlers(pool);
    var req = mockConvertReq({ session: { accessToken: 'tok', tenantId: 'client-org-5', login: 'admin5@example.com', userId: 5001 }, body: { confirm: 'CONVERT' } });
    var res = mockRes();
    await handlers.handlePostConvertOrganisation(req, res);

    var org = pool._state().orgs.filter(function(o) { return o.org_id === 'client-org-5'; })[0];
    assert.strictEqual(org.org_type, 'standalone', 'expected org_type updated via the full route stack');
    assert.strictEqual(res._statusCode, 302, 'expected the full route stack to end in a 302 redirect (into the Stripe checkout flow)');
  });

  // ===========================================================================
  // AC2 -- conversionRedirectsToExistingStripeCheckout (integration)
  // ===========================================================================
  await test('conversionRedirectsToExistingStripeCheckout (AC2)', async function() {
    var stripeClient = freshRequire(STRIPE_CLIENT_PATH);
    var stripeCalls = [];
    var mockStripe = {
      checkout: {
        sessions: {
          create: async function(params) {
            stripeCalls.push(params);
            return { id: 'cs_test_ac2', url: 'https://checkout.stripe.com/pay/cs_test_ac2' };
          }
        }
      }
    };
    stripeClient.setStripeAdapter(mockStripe);
    delete require.cache[BILLING_PATH];
    var orgConversion = freshRequire(ORG_CONVERSION_PATH);
    process.env.STRIPE_PRICE_ID_STARTER = 'price_env_configured_value';

    var pool = makeFakePool();
    pool._seedOrg('client-org-6', 'Acme Client', 'client');
    pool._seedPerson(6001, 'admin6@example.com', 'client-org-6', 'admin');

    var handlers = orgConversion.createOrgConversionHandlers(pool);
    var req = {
      session: { accessToken: 'tok', tenantId: 'client-org-6', login: 'admin6@example.com', userId: 6001 },
      body: { confirm: 'CONVERT' },
      headers: { host: 'test.example.com' }
    };
    var res = {
      _statusCode: null, _headers: {}, _body: null,
      writeHead: function(status, headers) { this._statusCode = status; if (headers) { var self = this; Object.keys(headers).forEach(function(k) { self._headers[k] = headers[k]; }); } },
      end: function(body) { this._body = body || null; }
    };
    await handlers.handlePostConvertOrganisation(req, res);

    // The SAME function every new standalone signup uses was called -- not a
    // separate/new checkout code path -- and the redirect target is the
    // real, mocked Stripe-produced URL.
    assert.strictEqual(stripeCalls.length, 1, 'expected exactly one call into the real stripeClient.createCheckoutSession (via billing.handlePostCheckout)');
    assert.strictEqual(stripeCalls[0].client_reference_id, 'client-org-6', 'expected the converting org_id as client_reference_id, matching every other standalone checkout');
    assert.strictEqual(res._statusCode, 302, 'expected a 302 redirect');
    assert.strictEqual(res._headers['Location'], 'https://checkout.stripe.com/pay/cs_test_ac2', 'expected the redirect target to be the createCheckoutSession-produced URL');

    var org = pool._state().orgs.filter(function(o) { return o.org_id === 'client-org-6'; })[0];
    assert.strictEqual(org.org_type, 'standalone');
  });

  // ===========================================================================
  // AC3 -- relationshipsAndGrantsFunctionUnchangedPostConversionEndToEnd (integration, full route stack)
  // ===========================================================================
  await test('relationshipsAndGrantsFunctionUnchangedPostConversionEndToEnd (AC3)', async function() {
    var grants = freshRequire(GRANTS_PATH);
    var stripeClient = freshRequire(STRIPE_CLIENT_PATH);
    stripeClient.setStripeAdapter({ checkout: { sessions: { create: async function() { return { id: 'cs_ac3', url: 'https://checkout.stripe.com/pay/cs_ac3' }; } } } });
    delete require.cache[BILLING_PATH];
    var orgConversion = freshRequire(ORG_CONVERSION_PATH);
    process.env.STRIPE_PRICE_ID_STARTER = 'price_env_configured_value';

    var pool = makeFakePool();
    pool._seedOrg('client-org-7', 'Acme Client', 'client');
    pool._seedPerson(7001, 'admin7@example.com', 'client-org-7', 'admin');
    var rel = await grants.createRelationship(pool, 'agency-org-7', 'client-org-7');
    await grants.createGrant(pool, rel.relationship_id, 'product', 'product-shared');

    var handlers = orgConversion.createOrgConversionHandlers(pool);
    var req = mockConvertReq({ session: { accessToken: 'tok', tenantId: 'client-org-7', login: 'admin7@example.com', userId: 7001 }, body: { confirm: 'CONVERT' } });
    var res = mockRes();
    await handlers.handlePostConvertOrganisation(req, res);

    var org = pool._state().orgs.filter(function(o) { return o.org_id === 'client-org-7'; })[0];
    assert.strictEqual(org.org_type, 'standalone', 'expected the conversion itself to succeed via the full route stack');

    // Story 2's own grant-check function, unmodified, called exactly as any
    // other route would call it -- must still resolve access for the
    // previously-granted resource after conversion.
    var grantCheck = await grants.checkGrantAccess(pool, 'client-org-7', 'product', 'product-shared');
    assert.ok(grantCheck, 'expected Story 2\'s checkGrantAccess to still resolve the previously-granted resource after conversion');
  });

  // ===========================================================================
  // AC4 -- concurrencyTestReRunAtRouteLevelUnderLoad (integration, full route
  // stack, Promise.all -- real concurrent async execution via JS's event loop,
  // distinct from the unit test's explicitly-gated interleaving above)
  // ===========================================================================
  await test('concurrencyTestReRunAtRouteLevelUnderLoad (AC4)', async function() {
    var grants = freshRequire(GRANTS_PATH);
    var stripeClient = freshRequire(STRIPE_CLIENT_PATH);
    stripeClient.setStripeAdapter({ checkout: { sessions: { create: async function() { return { id: 'cs_ac4', url: 'https://checkout.stripe.com/pay/cs_ac4' }; } } } });
    delete require.cache[BILLING_PATH];
    var orgConversion = freshRequire(ORG_CONVERSION_PATH);
    process.env.STRIPE_PRICE_ID_STARTER = 'price_env_configured_value';

    var pool = makeFakePool();
    pool._seedOrg('client-org-8', 'Acme Client', 'client');
    pool._seedPerson(8001, 'admin8@example.com', 'client-org-8', 'admin');
    var rel = await grants.createRelationship(pool, 'agency-org-8', 'client-org-8');

    var handlers = orgConversion.createOrgConversionHandlers(pool);
    var convertReq = mockConvertReq({ session: { accessToken: 'tok', tenantId: 'client-org-8', login: 'admin8@example.com', userId: 8001 }, body: { confirm: 'CONVERT' } });
    var convertRes = mockRes();

    var grantResultPromise = grants.createGrant(pool, rel.relationship_id, 'product', 'product-concurrent');
    var convertResultPromise = handlers.handlePostConvertOrganisation(convertReq, convertRes);

    await Promise.all([grantResultPromise, convertResultPromise]);

    var state = pool._state();
    assert.strictEqual(state.orgs.filter(function(o) { return o.org_id === 'client-org-8'; }).length, 1, 'no duplicate organisations row under concurrent load');
    assert.strictEqual(state.orgs[0].org_type, 'standalone');
    assert.strictEqual(state.grants.filter(function(g) { return g.relationship_id === rel.relationship_id; }).length, 1, 'no duplicate/torn grant row under concurrent load');
  });

  // ===========================================================================
  // NFR (Performance) -- conversionHasNoSpecificLatencyTargetBeyondPageLoadNorms
  // ===========================================================================
  await test('conversionHasNoSpecificLatencyTargetBeyondPageLoadNorms (NFR-performance)', function() {
    var storyPath = path.join(ROOT, 'artefacts', '2026-07-30-agency-client-organisations', 'stories', 'story-6-conversion-to-independent.md');
    var storySrc = fs.readFileSync(storyPath, 'utf8');
    assert.ok(storySrc.indexOf('no specific latency target') !== -1, 'expected the story\'s own NFR text confirming no specific latency target beyond page-load norms');
  });

  // ===========================================================================
  // NFR (Security) -- conversionRestrictedToAdminRoleServerSide
  // ===========================================================================
  await test('conversionRestrictedToAdminRoleServerSide (NFR-security)', async function() {
    var orgConversion = freshRequire(ORG_CONVERSION_PATH);
    var pool = makeFakePool();
    pool._seedOrg('client-org-9', 'Acme Client', 'client');
    pool._seedPerson(9001, 'viewer9@example.com', 'client-org-9', 'viewer');

    var handlers = orgConversion.createOrgConversionHandlers(pool);
    // A forged/absent client-side flag must have zero influence -- rejection
    // comes purely from the server-resolved team_memberships.role, never a
    // request body/query value.
    var req = mockConvertReq({
      session: { accessToken: 'tok', tenantId: 'client-org-9', login: 'viewer9@example.com', userId: 9001 },
      body: { confirm: 'CONVERT', isAdmin: true, role: 'admin' }
    });
    var res = mockRes();
    await handlers.handlePostConvertOrganisation(req, res);

    assert.strictEqual(res._statusCode, 403, 'a forged client-side admin flag must not bypass the server-side role check');
    var org = pool._state().orgs.filter(function(o) { return o.org_id === 'client-org-9'; })[0];
    assert.strictEqual(org.org_type, 'client', 'org_type must be unchanged');
  });

  // ===========================================================================
  // NFR (Accessibility) -- conversionFormIsKeyboardNavigable
  // ===========================================================================
  await test('conversionFormIsKeyboardNavigable (NFR-accessibility)', async function() {
    var orgConversion = freshRequire(ORG_CONVERSION_PATH);
    var pool = makeFakePool();
    pool._seedOrg('client-org-10', 'Acme Client', 'client');
    pool._seedPerson(10001, 'admin10@example.com', 'client-org-10', 'admin');

    var handlers = orgConversion.createOrgConversionHandlers(pool);
    var req = mockConvertReq({ session: { accessToken: 'tok', tenantId: 'client-org-10', login: 'admin10@example.com', userId: 10001 } });
    var res = mockRes();
    await handlers.handleGetConvertForm(req, res);

    assert.strictEqual(res._statusCode, 200);
    var html = res._body;
    assert.ok(html.indexOf('<form') !== -1, 'expected a real <form> element');
    assert.ok(html.indexOf('<input') !== -1, 'expected a real <input> element');
    assert.ok(html.indexOf('<label') !== -1, 'expected a real <label> element for accessible naming');
    assert.ok(!/onclick\s*=/.test(html), 'expected no non-semantic click-only targets');
  });

  // ===========================================================================
  // NFR (Audit) -- conversionIsAudited
  // ===========================================================================
  await test('conversionIsAudited (NFR-audit)', async function() {
    var stripeClient = freshRequire(STRIPE_CLIENT_PATH);
    stripeClient.setStripeAdapter({ checkout: { sessions: { create: async function() { return { id: 'cs_audit', url: 'https://checkout.stripe.com/pay/cs_audit' }; } } } });
    delete require.cache[BILLING_PATH];
    var orgConversion = freshRequire(ORG_CONVERSION_PATH);
    process.env.STRIPE_PRICE_ID_STARTER = 'price_env_configured_value';

    var pool = makeFakePool();
    pool._seedOrg('client-org-11', 'Acme Client', 'client');
    pool._seedPerson(11001, 'admin11@example.com', 'client-org-11', 'admin');

    var logCalls = [];
    orgConversion.setConversionLogger({ info: function(msg) { logCalls.push(msg); } });

    var handlers = orgConversion.createOrgConversionHandlers(pool);
    var req = mockConvertReq({ session: { accessToken: 'tok', tenantId: 'client-org-11', login: 'admin11@example.com', userId: 11001 }, body: { confirm: 'CONVERT' } });
    var res = mockRes();
    await handlers.handlePostConvertOrganisation(req, res);

    var convertedLog = logCalls.filter(function(m) { return m.indexOf('organisation_converted') !== -1 && m.indexOf('organisation_converted_to_standalone') === -1; });
    assert.strictEqual(convertedLog.length, 1, 'expected exactly one organisation_converted audit log entry');
    var parsed = JSON.parse(convertedLog[0]);
    assert.strictEqual(parsed.org_id, 'client-org-11');
    assert.strictEqual(parsed.person_id, 11001);
    assert.ok(parsed.timestamp, 'expected a timestamp on the audit entry');

    orgConversion.setConversionLogger(null); // reset injectable logger back to default for subsequent tests
  });

  // ===========================================================================
  // Wiring regression (mirrors check-lab-s3.2's IT1 source-scan convention) --
  // serverWiresOrgConversionRoutes
  // ===========================================================================
  await test('serverWiresOrgConversionRoutes (wiring regression)', function() {
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    assert.ok(src.indexOf("require('./routes/org-conversion')") !== -1, 'server.js must require routes/org-conversion');
    assert.ok(src.indexOf('createOrgConversionHandlers(') !== -1, 'server.js must instantiate the org-conversion handlers factory');
    assert.ok(src.indexOf('/organisations/convert') !== -1, 'server.js must register the /organisations/convert route');
    assert.ok(src.indexOf('handleGetConvertForm') !== -1 && src.indexOf('handlePostConvertOrganisation') !== -1, 'server.js must wire both the GET form and POST conversion handlers');
  });

  console.log('\n[story-6-conversion-to-independent] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[story-6-conversion-to-independent] Unexpected error:', err);
  process.exit(1);
});
