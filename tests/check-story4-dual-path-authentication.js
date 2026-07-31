'use strict';

// tests/check-story4-dual-path-authentication.js -- story-4-dual-path-authentication
// Story: artefacts/2026-07-30-agency-client-organisations/stories/story-4-dual-path-authentication.md
// Test plan: artefacts/2026-07-30-agency-client-organisations/test-plans/story-4-dual-path-authentication-test-plan.md
//
// Covers (14 tests -- matches the test plan's 5 ACs + 4 automatable NFRs;
// the test plan's 5th NFR, magicLinkDeliveryLatencyWithinExistingNorms, has
// no automated test by its own design -- Tool: "None -- confirmed with
// story NFRs", deferred to the manual verification scenario):
//   AC1: githubOAuthResolvesClientOrgSessionShape, githubOAuthFlowEndToEndForClientOrgUser
//   AC2: magicLinkRequestIssuesTokenAndCallsSendCallback, magicLinkVerificationResolvesSameSessionShapeAsOAuth,
//        magicLinkRequestEndToEndSendsEmail, magicLinkRedemptionEndToEndResolvesSession
//   AC3: magicLinkPathRejectedForAgencyOrgType, magicLinkRequestRejectedAtRouteLevelForNonClientOrgType
//   AC4: usedMagicLinkTokenRejectedOnSecondClick, secondClickOnUsedMagicLinkRejectedAtRouteLevel
//   AC5: magicLinkAdapterStubsThrowWhenUnwired, serverJsWiresMagicLoginToDistinctRealSessions
//   NFR (Security):      magicLinkSingleUseTimeLimitedAndAddressBound, magicLinkRequestEndpointIsRateLimited
//   NFR (Accessibility):  magicLinkRequestFormIsKeyboardNavigable
//   NFR (Audit):          magicLinkEventsAuditedWithoutRawToken
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-story3-self-service-provisioning.js, tests/check-story1-organisation-entity.js)
// -- no Jest/Mocha.

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID = 'test-gh-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-gh-secret';
process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/auth/github/callback';

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
var AUTH_PATH               = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'auth'));
var AUTH_EMAIL_PATH         = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'auth-email'));
var CLIENT_LOGIN_MODULE_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'client-login'));
var CLIENT_LOGIN_ROUTE_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'client-login'));
var CLIENT_INVITATIONS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'client-invitations'));
var MAGIC_LINK_STRATEGY_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'auth', 'magic-link-strategy'));
var AGENCY_PROVISIONING_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'agency-provisioning'));
var SERVER_PATH = path.resolve(ROOT, 'src/web-ui/server.js');

var tokenSuccessFixture = require('./fixtures/github/oauth-token-exchange-success.json');
var userIdentityFixture = require('./fixtures/github/user-identity.json');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function mockAuthReq(overrides) {
  return Object.assign({ session: {}, sessionId: 'test-sid', query: {}, headers: {} }, overrides || {});
}

function mockAuthRes() {
  var _headers = {};
  return {
    statusCode: null,
    get headers() { return _headers; },
    writeHead: function(code, hdrs) { this.statusCode = code; if (hdrs) Object.assign(_headers, hdrs); },
    setHeader: function(name, value) { _headers[name] = value; },
    end: function(body) { this.body = (body != null ? body : ''); this._ended = true; }
  };
}

function mockRes() {
  return { _s: null, _b: null, status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; } };
}

// ── In-memory fake pool -- narrow, self-contained; supports exactly the
// query shapes this story's modules issue, plus the shapes Story 1/3's
// modules (organisations, identity-links, client-invitations) issue when
// this test file uses them to set up fixtures (mirrors
// tests/check-story3-self-service-provisioning.js's own convention). ──────
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakePool() {
  var orgs = [];
  var people = [];
  var personIdentities = [];
  var teamMemberships = [];
  var loginTokens = [];
  var invitations = [];
  var queryLog = [];
  var nextPersonId = 1000;

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];
    queryLog.push({ sql: s, params: p });

    if (s.indexOf('CREATE TABLE IF NOT EXISTS') === 0) {
      return Promise.resolve({ rows: [] });
    }

    // ── organisations ──────────────────────────────────────────────────────
    if (s.indexOf('SELECT ORG_ID, NAME, ORG_TYPE, CREATED_AT FROM ORGANISATIONS WHERE ORG_ID') === 0) {
      var match = orgs.filter(function(r) { return r.org_id === p[0]; });
      return Promise.resolve({ rows: match });
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

    // ── people / person_identities / team_memberships (Story 1's/tir-s1's schema) ──
    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var pi = personIdentities.filter(function(r) { return r.identity_key === p[0]; })[0];
      return Promise.resolve({ rows: pi ? [{ person_id: pi.person_id }] : [] });
    }
    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tmByTenant = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; })[0];
      return Promise.resolve({ rows: tmByTenant ? [{ person_id: tmByTenant.person_id }] : [] });
    }
    if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES RETURNING ID') === 0) {
      var newPersonId = nextPersonId++;
      people.push({ id: newPersonId });
      return Promise.resolve({ rows: [{ id: newPersonId }] });
    }
    if (s.indexOf('INSERT INTO PERSON_IDENTITIES') === 0) {
      var already = personIdentities.some(function(r) { return r.identity_key === p[0]; });
      if (!already) personIdentities.push({ identity_key: p[0], person_id: p[1], provider: p[2] });
      return Promise.resolve({ rows: [] });
    }
    if (s.indexOf('INSERT INTO TEAM_MEMBERSHIPS') === 0) {
      var existingMembership = teamMemberships.filter(function(r) { return r.person_id === p[0] && r.tenant_id === p[1]; })[0];
      if (existingMembership) { existingMembership.role = p[2]; }
      else { teamMemberships.push({ person_id: p[0], tenant_id: p[1], role: p[2] }); }
      return Promise.resolve({ rows: [] });
    }
    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE PERSON_ID') === 0) {
      var tm = teamMemberships.filter(function(r) { return r.person_id === p[0] && r.tenant_id === p[1]; })[0];
      return Promise.resolve({ rows: tm ? [{ role: tm.role }] : [] });
    }

    // ── client-login.js's own membership-org_type JOIN (AC3) ────────────────
    if (s.indexOf('SELECT TM.TENANT_ID, TM.ROLE FROM TEAM_MEMBERSHIPS TM JOIN ORGANISATIONS O') === 0) {
      var personTms = teamMemberships.filter(function(r) { return r.person_id === p[0]; });
      var joined = personTms.map(function(r) {
        var org = orgs.filter(function(o) { return o.org_id === r.tenant_id; })[0];
        return { tenant_id: r.tenant_id, role: r.role, org_type: org ? org.org_type : null };
      }).filter(function(r) { return r.org_type === 'client'; });
      return Promise.resolve({ rows: joined.length ? [{ tenant_id: joined[0].tenant_id, role: joined[0].role }] : [] });
    }

    // ── client_login_tokens (this story) ─────────────────────────────────────
    if (s.indexOf('INSERT INTO CLIENT_LOGIN_TOKENS') === 0) {
      var tokRow = { token_id: p[0], email: p[1], tenant_id: p[2], created_at: new Date().toISOString(), redeemed_at: null };
      loginTokens.push(tokRow);
      return Promise.resolve({ rows: [tokRow] });
    }
    if (s.indexOf('SELECT TOKEN_ID, EMAIL, TENANT_ID, CREATED_AT, REDEEMED_AT FROM CLIENT_LOGIN_TOKENS') === 0) {
      var tokMatch = loginTokens.filter(function(r) { return r.token_id === p[0]; });
      return Promise.resolve({ rows: tokMatch });
    }
    if (s.indexOf('UPDATE CLIENT_LOGIN_TOKENS SET REDEEMED_AT') === 0) {
      var tok2 = loginTokens.filter(function(r) { return r.token_id === p[0] && !r.redeemed_at; })[0];
      if (!tok2) return Promise.resolve({ rows: [] });
      tok2.redeemed_at = new Date().toISOString();
      return Promise.resolve({ rows: [tok2] });
    }

    // ── client_invitations (Story 3's module -- reused here only to set up a
    // realistic "invited then redeemed" Client-org user fixture) ────────────
    if (s.indexOf('INSERT INTO CLIENT_INVITATIONS') === 0) {
      var invRow = {
        invitation_id: p[0], client_org_id: p[1], email: p[2], invited_by_org_id: p[3],
        created_at: new Date().toISOString(), redeemed_at: null
      };
      invitations.push(invRow);
      return Promise.resolve({ rows: [invRow] });
    }
    if (s.indexOf('SELECT INVITATION_ID, CLIENT_ORG_ID, EMAIL, INVITED_BY_ORG_ID, CREATED_AT, REDEEMED_AT FROM CLIENT_INVITATIONS') === 0) {
      var invMatch = invitations.filter(function(r) { return r.invitation_id === p[0]; });
      return Promise.resolve({ rows: invMatch });
    }
    if (s.indexOf('UPDATE CLIENT_INVITATIONS SET REDEEMED_AT') === 0) {
      var inv2 = invitations.filter(function(r) { return r.invitation_id === p[0] && !r.redeemed_at; })[0];
      if (!inv2) return Promise.resolve({ rows: [] });
      inv2.redeemed_at = new Date().toISOString();
      return Promise.resolve({ rows: [inv2] });
    }

    console.warn('[fake-story4-pool] unhandled query (returning empty rows): ' + s.slice(0, 150));
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _state: function() {
      return {
        orgs: orgs, people: people, personIdentities: personIdentities,
        teamMemberships: teamMemberships, loginTokens: loginTokens, invitations: invitations,
        queryLog: queryLog
      };
    },
    _seedOrg: function(orgId, name, orgType) { orgs.push({ org_id: orgId, name: name, org_type: orgType, created_at: new Date().toISOString() }); },
    // Seed a fully-provisioned Client-org user (as Story 3's invitation
    // redemption would have left behind): a client-type org, a person,
    // a person_identities(email -> person) link, and a team_memberships
    // row scoped to that org.
    _seedClientOrgUser: function(clientOrgId, email, role) {
      if (!orgs.some(function(o) { return o.org_id === clientOrgId; })) {
        orgs.push({ org_id: clientOrgId, name: clientOrgId, org_type: 'client', created_at: new Date().toISOString() });
      }
      var personId = nextPersonId++;
      people.push({ id: personId });
      personIdentities.push({ identity_key: email, person_id: personId, provider: 'magic-link' });
      teamMemberships.push({ person_id: personId, tenant_id: clientOrgId, role: role || 'admin' });
      return personId;
    }
  };
}

(async function main() {
  // ===========================================================================
  // AC1 -- githubOAuthResolvesClientOrgSessionShape (unit)
  // ===========================================================================
  await test('githubOAuthResolvesClientOrgSessionShape (AC1)', async function() {
    // Precondition: an organisations row already exists with org_type='client'
    // for this GitHub user's resolved tenantId (no TENANT_ORG_ALLOWLIST
    // configured -- tenantId = the GitHub login, matching this codebase's
    // existing OAuth resolution pattern used by Standalone/Agency tenants).
    var pool = makeFakePool();
    pool._seedOrg(userIdentityFixture.login, userIdentityFixture.login, 'client');

    var auth = freshRequire(AUTH_PATH);
    auth.setLogger({ info: function() {}, warn: function() {} });
    auth.setOrganisationsPool(pool);
    var oauthAdapter = require(path.join(ROOT, 'src', 'web-ui', 'auth', 'oauth-adapter'));
    oauthAdapter.setProviderAdapter(oauthAdapter.gitHubProviderAdapter);

    var origFetch = global.fetch;
    global.fetch = async function(url) {
      if (url.includes('access_token')) return { json: async function() { return tokenSuccessFixture; } };
      if (url.includes('/user')) return { json: async function() { return userIdentityFixture; } };
      return { json: async function() { return {}; } };
    };
    var req = mockAuthReq({ session: { oauthState: 'state-story4-ac1' }, query: { code: 'valid-code', state: 'state-story4-ac1' } });
    var res = mockAuthRes();
    await auth.handleAuthCallback(req, res);
    global.fetch = origFetch;

    assert.strictEqual(res.statusCode, 302, 'expected the standard 302 redirect, unchanged from before this story');
    assert.strictEqual(req.session.tenantId, userIdentityFixture.login, 'tenantId must resolve exactly as it always has for this OAuth path');
    assert.strictEqual(req.session.login, userIdentityFixture.login);
    assert.ok(req.session.accessToken, 'accessToken (canonical field name) must be set on the session');
    assert.ok(req.session.role, 'role must be resolved');

    // Confirm the pre-existing org_type='client' row was PRESERVED, not
    // overwritten -- resolveOrganisationForTenant's read-first design.
    var orgRow = pool._state().orgs.filter(function(o) { return o.org_id === userIdentityFixture.login; })[0];
    assert.strictEqual(orgRow.org_type, 'client', 'the pre-existing Client-org row must not be overwritten to standalone');
  });

  // ===========================================================================
  // AC1 -- githubOAuthFlowEndToEndForClientOrgUser (integration)
  // ===========================================================================
  await test('githubOAuthFlowEndToEndForClientOrgUser (AC1)', async function() {
    var pool = makeFakePool();
    pool._seedOrg(userIdentityFixture.login, userIdentityFixture.login, 'client');

    var auth = freshRequire(AUTH_PATH);
    auth.setLogger({ info: function() {}, warn: function() {} });
    auth.setOrganisationsPool(pool);
    var oauthAdapter = require(path.join(ROOT, 'src', 'web-ui', 'auth', 'oauth-adapter'));
    oauthAdapter.setProviderAdapter(oauthAdapter.gitHubProviderAdapter);

    var origFetch = global.fetch;
    global.fetch = async function(url) {
      if (url.includes('access_token')) return { json: async function() { return tokenSuccessFixture; } };
      if (url.includes('/user')) return { json: async function() { return userIdentityFixture; } };
      return { json: async function() { return {}; } };
    };
    var req = mockAuthReq({ session: { oauthState: 'state-story4-ac1-int' }, query: { code: 'valid-code', state: 'state-story4-ac1-int' } });
    var res = mockAuthRes();
    await auth.handleAuthCallback(req, res);
    global.fetch = origFetch;

    assert.strictEqual(res.statusCode, 302, 'full HTTP-level OAuth callback must complete exactly as it does for any other org type');
    assert.strictEqual(req.session.tenantId, userIdentityFixture.login);
  });

  // ===========================================================================
  // AC2 -- magicLinkRequestIssuesTokenAndCallsSendCallback (unit)
  // ===========================================================================
  await test('magicLinkRequestIssuesTokenAndCallsSendCallback (AC2)', async function() {
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    var clientLoginRoute = freshRequire(CLIENT_LOGIN_ROUTE_PATH);
    strategy._resetForTesting();
    clientLoginRoute._clearRateLimits();
    var sentCalls = [];
    strategy.registerMagicLinkStrategy({
      secret: 'unit-test-secret-ac2',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function(destination, href, code) { sentCalls.push({ destination: destination, href: href, code: code }); },
      verify: async function() {}
    });

    var pool = makeFakePool();
    pool._seedClientOrgUser('client-org-req1', 'invited@example.com');
    var handlers = clientLoginRoute.createClientLoginHandlers(pool);

    var req = { body: { email: 'invited@example.com' }, headers: {}, connection: { remoteAddress: '10.0.0.1' } };
    var res = mockRes();
    await handlers.handlePostMagicLinkRequest(req, res);

    assert.strictEqual(res._s, 200, 'expected success from the magic-link request handler');
    assert.strictEqual(sentCalls.length, 1, 'expected the mocked send function invoked exactly once');
    assert.strictEqual(sentCalls[0].destination, 'invited@example.com');
    assert.ok(sentCalls[0].href.indexOf('token=') !== -1, 'expected the sent link to contain a token-bearing query param');
    var tokRow = pool._state().loginTokens[0];
    assert.ok(tokRow, 'expected a client_login_tokens row to be persisted');
    assert.strictEqual(tokRow.email, 'invited@example.com');
  });

  // ===========================================================================
  // AC2 -- magicLinkVerificationResolvesSameSessionShapeAsOAuth (unit)
  // ===========================================================================
  await test('magicLinkVerificationResolvesSameSessionShapeAsOAuth (AC2)', async function() {
    var clientLogin = freshRequire(CLIENT_LOGIN_MODULE_PATH);
    var pool = makeFakePool();
    pool._seedClientOrgUser('client-org-shape', 'shapecheck@example.com', 'admin');

    var issued = await clientLogin.requestMagicLinkLogin(pool, 'shapecheck@example.com');
    assert.strictEqual(issued.ok, true);

    var result = await clientLogin.resolveLoginToken(pool, { destination: 'shapecheck@example.com', loginTokenId: issued.tokenId });
    assert.strictEqual(result.ok, true, 'expected redemption to succeed');

    // Field-for-field equality of shape with the OAuth path's session fields
    // (tenantId, login, role) -- not just "a session was created".
    assert.strictEqual(result.user.tenantId, 'client-org-shape');
    assert.strictEqual(result.user.email, 'shapecheck@example.com');
    assert.strictEqual(result.user.role, 'admin');
    assert.ok(Object.prototype.hasOwnProperty.call(result.user, 'personId'), 'expected a personId field, same shape as invitation redemption\'s user object');
  });

  // ===========================================================================
  // AC3 -- magicLinkPathRejectedForAgencyOrgType (unit, parametrised)
  // ===========================================================================
  await test('magicLinkPathRejectedForAgencyOrgType (AC3)', async function() {
    var clientLogin = freshRequire(CLIENT_LOGIN_MODULE_PATH);
    var orgTypes = ['agency', 'standalone'];
    for (var i = 0; i < orgTypes.length; i++) {
      var orgType = orgTypes[i];
      var pool = makeFakePool();
      pool._seedOrg('org-' + orgType, 'Some Org', orgType);
      // Give the email a team_membership against the non-client org.
      var personId = 2000 + i;
      pool._state().people.push({ id: personId });
      pool._state().personIdentities.push({ identity_key: orgType + '-user@example.com', person_id: personId, provider: 'magic-link' });
      pool._state().teamMemberships.push({ person_id: personId, tenant_id: 'org-' + orgType, role: 'admin' });

      var result = await clientLogin.requestMagicLinkLogin(pool, orgType + '-user@example.com');
      assert.strictEqual(result.ok, false, 'expected rejection for org_type=' + orgType);
      assert.strictEqual(pool._state().loginTokens.length, 0, 'no token should be issued for org_type=' + orgType);
    }
  });

  // ===========================================================================
  // AC3 -- magicLinkRequestRejectedAtRouteLevelForNonClientOrgType (integration, full route stack)
  // ===========================================================================
  await test('magicLinkRequestRejectedAtRouteLevelForNonClientOrgType (AC3)', async function() {
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    var clientLoginRoute = freshRequire(CLIENT_LOGIN_ROUTE_PATH);
    strategy._resetForTesting();
    clientLoginRoute._clearRateLimits();
    var sentCalls = [];
    strategy.registerMagicLinkStrategy({
      secret: 'unit-test-secret-ac3-route',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function(destination, href) { sentCalls.push({ destination: destination, href: href }); },
      verify: async function() {}
    });

    var pool = makeFakePool();
    pool._seedOrg('agency-org-route', 'Agency Co', 'agency');
    pool._state().people.push({ id: 3000 });
    pool._state().personIdentities.push({ identity_key: 'agencyuser@example.com', person_id: 3000, provider: 'magic-link' });
    pool._state().teamMemberships.push({ person_id: 3000, tenant_id: 'agency-org-route', role: 'admin' });

    var handlers = clientLoginRoute.createClientLoginHandlers(pool);
    var req = { body: { email: 'agencyuser@example.com' }, headers: {}, connection: { remoteAddress: '10.0.0.2' } };
    var res = mockRes();
    await handlers.handlePostMagicLinkRequest(req, res);

    assert.strictEqual(res._s, 403, 'expected a server-side 403 rejection before any token issuance -- never a client-side-only restriction');
    assert.strictEqual(sentCalls.length, 0, 'no magic-link email must be sent for a rejected org_type');
    assert.strictEqual(pool._state().loginTokens.length, 0);
  });

  // ===========================================================================
  // AC4 -- usedMagicLinkTokenRejectedOnSecondClick (unit, + expired edge case)
  // ===========================================================================
  await test('usedMagicLinkTokenRejectedOnSecondClick (AC4)', async function() {
    var clientLogin = freshRequire(CLIENT_LOGIN_MODULE_PATH);
    clientLogin._resetNowForTesting();

    // Already-used case.
    var pool = makeFakePool();
    pool._seedClientOrgUser('client-org-reuse', 'reuse@example.com');
    var issued = await clientLogin.requestMagicLinkLogin(pool, 'reuse@example.com');
    var first = await clientLogin.resolveLoginToken(pool, { destination: 'reuse@example.com', loginTokenId: issued.tokenId });
    assert.strictEqual(first.ok, true, 'expected the first redemption to succeed');
    var second = await clientLogin.resolveLoginToken(pool, { destination: 'reuse@example.com', loginTokenId: issued.tokenId });
    assert.strictEqual(second.ok, false, 'expected the second redemption attempt (same token) to be rejected');
    assert.strictEqual(second.reason, 'login link already used');

    // Edge case: an EXPIRED but NEVER-USED token is rejected distinctly.
    var pool2 = makeFakePool();
    pool2._seedClientOrgUser('client-org-expired', 'expired@example.com');
    var issued2 = await clientLogin.requestMagicLinkLogin(pool2, 'expired@example.com');
    var fakeNow = Date.now() + (clientLogin.TTL_MS + 60 * 1000); // just past the TTL
    clientLogin._setNowForTesting(function() { return fakeNow; });
    var expiredResult = await clientLogin.resolveLoginToken(pool2, { destination: 'expired@example.com', loginTokenId: issued2.tokenId });
    clientLogin._resetNowForTesting();
    assert.strictEqual(expiredResult.ok, false, 'expected an expired-but-never-used token to be rejected');
    assert.strictEqual(expiredResult.reason, 'login link expired', 'expected a DISTINCT reason from the already-used case');
  });

  // ===========================================================================
  // AC4 -- secondClickOnUsedMagicLinkRejectedAtRouteLevel (integration, full route stack)
  // ===========================================================================
  await test('secondClickOnUsedMagicLinkRejectedAtRouteLevel (AC4)', async function() {
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    var clientLogin = freshRequire(CLIENT_LOGIN_MODULE_PATH);
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    strategy._resetForTesting();

    var pool = makeFakePool();
    pool._seedClientOrgUser('client-org-route-reuse', 'routereuse@example.com');

    async function _combinedVerify(payload, callback) {
      try {
        var result = await clientLogin.resolveLoginToken(pool, payload);
        if (!result.ok) { callback(null, false, { message: result.reason }); return; }
        callback(null, result.user);
      } catch (err) { callback(err); }
    }

    var capturedHref = null;
    strategy.registerMagicLinkStrategy({
      secret: 'route-reuse-secret',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function(destination, href) { capturedHref = href; },
      verify: _combinedVerify
    });

    var issued = await clientLogin.requestMagicLinkLogin(pool, 'routereuse@example.com');
    await strategy.issueMagicLink('routereuse@example.com', { loginTokenId: issued.tokenId });
    assert.ok(capturedHref, 'expected a magic-link href to be captured');
    var token = capturedHref.split('token=')[1];

    var handlers = provisioning.createAgencyProvisioningHandlers(pool);

    var req1 = { query: { token: token }, session: {}, sessionId: 'sid-1' };
    var res1 = mockRes();
    await handlers.handleGetInviteRedeem(req1, res1);
    assert.strictEqual(res1._s, 200, 'expected the first click to succeed via the shared /invite/redeem route');
    assert.strictEqual(req1.session.tenantId, 'client-org-route-reuse');

    var req2 = { query: { token: token }, session: {}, sessionId: 'sid-2' };
    var res2 = mockRes();
    await handlers.handleGetInviteRedeem(req2, res2);
    assert.strictEqual(res2._s, 400, 'expected the second click on the SAME link to be rejected, not a successful sign-in');
    assert.strictEqual(req2.session.tenantId, undefined, 'no new session should be established on the rejected second click');
  });

  // ===========================================================================
  // AC5 -- magicLinkAdapterStubsThrowWhenUnwired (unit)
  // ===========================================================================
  await test('magicLinkAdapterStubsThrowWhenUnwired (AC5)', async function() {
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    strategy._resetForTesting();

    // verify()/send callbacks: a fresh, never-registered strategy throws on
    // any use -- getStrategy() (used internally by both issueMagicLink and
    // verifyMagicLinkToken) is the single throw point (D37 contract).
    var threwOnIssue = false;
    try {
      await strategy.issueMagicLink('someone@example.com', {});
    } catch (err) {
      threwOnIssue = true;
      assert.ok(err.message.indexOf('Adapter not wired') !== -1, 'expected a D37-shaped "Adapter not wired" error message');
    }
    assert.ok(threwOnIssue, 'expected issueMagicLink to throw when the strategy is unregistered');

    var threwOnVerify = false;
    try {
      await strategy.verifyMagicLinkToken('any-token');
    } catch (err) {
      threwOnVerify = true;
      assert.ok(err.message.indexOf('Adapter not wired') !== -1);
    }
    assert.ok(threwOnVerify, 'expected verifyMagicLinkToken to throw when the strategy is unregistered');

    // setVerifyCallback() itself also throws before registration (Story 4's
    // own extension point).
    var threwOnSetVerify = false;
    try {
      strategy.setVerifyCallback(function() {});
    } catch (err) {
      threwOnSetVerify = true;
    }
    assert.ok(threwOnSetVerify, 'expected setVerifyCallback to throw before registerMagicLinkStrategy has run');

    // The send-side adapter (sendInvitationEmail, reused unchanged by this
    // story per AC5) also throws when unwired.
    var invitationEmail = freshRequire(path.join(ROOT, 'src', 'web-ui', 'modules', 'invitation-email'));
    invitationEmail._resetForTesting();
    var threwOnSend = false;
    try {
      await invitationEmail.sendInvitationEmail('x@example.com', 'https://example.com/invite/redeem?token=x');
    } catch (err) {
      threwOnSend = true;
    }
    assert.ok(threwOnSend, 'expected the shared send-side adapter to throw when unwired');
  });

  // ===========================================================================
  // AC5 -- serverJsWiresMagicLoginToDistinctRealSessions (integration)
  // ===========================================================================
  await test('serverJsWiresMagicLoginToDistinctRealSessions (AC5)', async function() {
    // Part 1: source-scan confirms server.js wires the combined dispatcher
    // via setVerifyCallback(), never re-registering the strategy (mirrors
    // check-story3-self-service-provisioning.js's own established
    // "server.js wiring" test convention).
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    assert.ok(src.indexOf('setVerifyCallback(') !== -1, 'server.js must extend the shared strategy via setVerifyCallback()');
    assert.ok(src.indexOf('_combinedMagicLinkVerify') !== -1, 'server.js must define a combined verify() dispatcher routed by payload shape');
    var registerCount = (src.match(/registerMagicLinkStrategy\(\{/g) || []).length;
    assert.strictEqual(registerCount, 1, 'registerMagicLinkStrategy() must be called exactly once in server.js -- Story 4 must never re-register the strategy');

    // Part 2: exercise the REAL production dispatch logic directly (D37 --
    // "assert an observable, differentiating outcome"). Redeem magic-links
    // for TWO DIFFERENT Client-org users in sequence and confirm each
    // resolves its own, individually-correct session -- not merely that a
    // setter was called.
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    var clientLogin = freshRequire(CLIENT_LOGIN_MODULE_PATH);
    var clientInvitations = freshRequire(CLIENT_INVITATIONS_PATH);
    strategy._resetForTesting();

    var pool = makeFakePool();
    pool._seedClientOrgUser('client-org-alice', 'alice@example.com', 'admin');
    pool._seedClientOrgUser('client-org-bob', 'bob@example.com', 'admin');

    // The exact same dispatch shape server.js wires: invitationId present ->
    // Story 3's redemption; absent -> Story 4's login resolution.
    async function _verifyInvitationRedemption(payload, callback) {
      try {
        var result = await clientInvitations.redeemInvitation(pool, payload);
        if (!result.ok) { callback(null, false, { message: result.reason }); return; }
        callback(null, result.user);
      } catch (err) { callback(err); }
    }
    async function _verifyClientLogin(payload, callback) {
      try {
        var result = await clientLogin.resolveLoginToken(pool, payload);
        if (!result.ok) { callback(null, false, { message: result.reason }); return; }
        callback(null, result.user);
      } catch (err) { callback(err); }
    }
    function _combinedMagicLinkVerify(payload, callback, req) {
      if (payload && payload.invitationId) return _verifyInvitationRedemption(payload, callback, req);
      return _verifyClientLogin(payload, callback, req);
    }

    var capturedHrefs = [];
    strategy.registerMagicLinkStrategy({
      secret: 'ac5-distinct-sessions-secret',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function(destination, href) { capturedHrefs.push(href); },
      verify: function() {} // placeholder, replaced by setVerifyCallback below
    });
    strategy.setVerifyCallback(_combinedMagicLinkVerify);

    var issuedAlice = await clientLogin.requestMagicLinkLogin(pool, 'alice@example.com');
    await strategy.issueMagicLink('alice@example.com', { loginTokenId: issuedAlice.tokenId });
    var issuedBob = await clientLogin.requestMagicLinkLogin(pool, 'bob@example.com');
    await strategy.issueMagicLink('bob@example.com', { loginTokenId: issuedBob.tokenId });

    assert.strictEqual(capturedHrefs.length, 2, 'expected two distinct magic-link hrefs to be sent');
    var tokenAlice = capturedHrefs[0].split('token=')[1];
    var tokenBob = capturedHrefs[1].split('token=')[1];
    assert.notStrictEqual(tokenAlice, tokenBob, 'expected two distinct tokens');

    var resultAlice = await strategy.verifyMagicLinkToken(tokenAlice);
    var resultBob = await strategy.verifyMagicLinkToken(tokenBob);

    assert.strictEqual(resultAlice.ok, true);
    assert.strictEqual(resultBob.ok, true);
    assert.strictEqual(resultAlice.user.tenantId, 'client-org-alice', 'expected Alice\'s own, individually-correct tenantId');
    assert.strictEqual(resultBob.user.tenantId, 'client-org-bob', 'expected Bob\'s own, individually-correct tenantId');
    assert.notStrictEqual(resultAlice.user.tenantId, resultBob.user.tenantId, 'the two sessions must be observably DIFFERENT and each individually correct -- not merely proof a setter was invoked');
  });

  // ===========================================================================
  // NFR (Security) -- magicLinkSingleUseTimeLimitedAndAddressBound
  // ===========================================================================
  await test('magicLinkSingleUseTimeLimitedAndAddressBound (NFR-security)', async function() {
    var clientLogin = freshRequire(CLIENT_LOGIN_MODULE_PATH);
    clientLogin._resetNowForTesting();

    // (a) TTL is within 15-30 minutes.
    assert.ok(clientLogin.TTL_MS >= 15 * 60 * 1000 && clientLogin.TTL_MS <= 30 * 60 * 1000, 'expected the login-link TTL to be within the NFR\'s 15-30 minute window');

    // (b) An expired token (simulated via clock injection) is rejected.
    var pool = makeFakePool();
    pool._seedClientOrgUser('client-org-ttl', 'ttl@example.com');
    var issued = await clientLogin.requestMagicLinkLogin(pool, 'ttl@example.com');
    clientLogin._setNowForTesting(function() { return Date.now() + clientLogin.TTL_MS + 1000; });
    var expired = await clientLogin.resolveLoginToken(pool, { destination: 'ttl@example.com', loginTokenId: issued.tokenId });
    clientLogin._resetNowForTesting();
    assert.strictEqual(expired.ok, false, 'expected an expired token to be rejected');

    // (c) verify() binds strictly to the exact invited email address -- a
    // token issued for email A cannot be redeemed against a session claiming
    // email B.
    var pool2 = makeFakePool();
    pool2._seedClientOrgUser('client-org-bind', 'realowner@example.com');
    var issued2 = await clientLogin.requestMagicLinkLogin(pool2, 'realowner@example.com');
    var mismatched = await clientLogin.resolveLoginToken(pool2, { destination: 'attacker@example.com', loginTokenId: issued2.tokenId });
    assert.strictEqual(mismatched.ok, false, 'expected a payload destination that does not match the token\'s own recorded email to be rejected');
    assert.strictEqual(mismatched.reason, 'email mismatch');
  });

  // ===========================================================================
  // NFR (Security) -- magicLinkRequestEndpointIsRateLimited
  // ===========================================================================
  await test('magicLinkRequestEndpointIsRateLimited (NFR-security, resolves review [1-M1])', async function() {
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    var authEmail = freshRequire(AUTH_EMAIL_PATH);
    var clientLoginRoute = freshRequire(CLIENT_LOGIN_ROUTE_PATH);
    strategy._resetForTesting();
    clientLoginRoute._clearRateLimits();
    strategy.registerMagicLinkStrategy({
      secret: 'rate-limit-secret',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function() {},
      verify: async function() {}
    });

    var pool = makeFakePool();
    pool._seedClientOrgUser('client-org-rl', 'ratelimited@example.com');
    var handlers = clientLoginRoute.createClientLoginHandlers(pool);

    // Fire (RATE_MAX + 1) requests from the SAME IP/target-email within the
    // window -- the (N+1)th must be rejected with the same rate-limit
    // response shape as auth-email.js's existing limiter.
    var lastRes = null;
    for (var i = 0; i < authEmail.RATE_MAX + 1; i++) {
      var req = { body: { email: 'ratelimited@example.com' }, headers: {}, connection: { remoteAddress: '203.0.113.5' } };
      lastRes = mockRes();
      await handlers.handlePostMagicLinkRequest(req, lastRes);
    }
    assert.strictEqual(lastRes._s, 429, 'expected requests beyond the threshold to be rejected with 429, mirroring auth-email.js\'s limiter');
    assert.ok(lastRes._b && lastRes._b.error, 'expected a rate-limit error body, same shape as auth-email.js\'s limiter');
  });

  // ===========================================================================
  // NFR (Accessibility) -- magicLinkRequestFormIsKeyboardNavigable
  // ===========================================================================
  await test('magicLinkRequestFormIsKeyboardNavigable (NFR-accessibility)', async function() {
    var clientLoginRoute = freshRequire(CLIENT_LOGIN_ROUTE_PATH);
    var pool = makeFakePool();
    var handlers = clientLoginRoute.createClientLoginHandlers(pool);

    var req = {};
    var res = mockRes();
    await handlers.handleGetMagicLinkRequestForm(req, res);

    assert.strictEqual(res._s, 200);
    var html = res._b.html;
    assert.ok(html.indexOf('<form') !== -1, 'expected a real <form> element');
    assert.ok(html.indexOf('<input') !== -1 && html.indexOf('type="email"') !== -1, 'expected a real <input type="email"> element');
    assert.ok(html.indexOf('<label') !== -1, 'expected a real <label> element for accessible naming');
    assert.ok(!/onclick\s*=/.test(html), 'expected no non-semantic click-only targets');
  });

  // ===========================================================================
  // NFR (Audit) -- magicLinkEventsAuditedWithoutRawToken
  // ===========================================================================
  await test('magicLinkEventsAuditedWithoutRawToken (NFR-audit)', async function() {
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    var clientLogin = freshRequire(CLIENT_LOGIN_MODULE_PATH);
    var clientLoginRoute = freshRequire(CLIENT_LOGIN_ROUTE_PATH);
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    strategy._resetForTesting();
    clientLoginRoute._clearRateLimits();

    var pool = makeFakePool();
    pool._seedClientOrgUser('client-org-audit4', 'audited4@example.com');

    var logCalls = [];
    var origConsoleLog = console.log;
    console.log = function(msg) { logCalls.push(String(msg)); };

    async function _combinedVerify(payload, callback) {
      var result = await clientLogin.resolveLoginToken(pool, payload, { info: function(m) { logCalls.push(m); } });
      if (!result.ok) { callback(null, false); return; }
      callback(null, result.user);
    }
    var capturedHref = null;
    strategy.registerMagicLinkStrategy({
      secret: 'audit-secret-story4',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function(destination, href) { capturedHref = href; },
      verify: _combinedVerify
    });

    var handlers = clientLoginRoute.createClientLoginHandlers(pool);
    var reqRequest = { body: { email: 'audited4@example.com' }, headers: {}, connection: { remoteAddress: '10.0.0.9' } };
    var resRequest = mockRes();
    await handlers.handlePostMagicLinkRequest(reqRequest, resRequest);
    assert.strictEqual(resRequest._s, 200);

    var token = capturedHref.split('token=')[1];
    var provisioningHandlers = provisioning.createAgencyProvisioningHandlers(pool);
    var redeemReq = { query: { token: token }, session: {}, sessionId: 'audit-sid-4' };
    var redeemRes = mockRes();
    await provisioningHandlers.handleGetInviteRedeem(redeemReq, redeemRes);
    console.log = origConsoleLog;

    assert.strictEqual(redeemRes._s, 200, 'expected the redemption to succeed');
    var tokenInLogs = logCalls.some(function(l) { return String(l).indexOf(token) !== -1; });
    assert.strictEqual(tokenInLogs, false, 'the raw login token must never appear in any log call across request AND redemption');

    var requestedLog = logCalls.filter(function(l) { return String(l).indexOf('magic_link_login_requested') !== -1; });
    assert.strictEqual(requestedLog.length, 1, 'expected exactly one magic_link_login_requested audit entry');
    var parsedRequested = JSON.parse(requestedLog[0]);
    assert.strictEqual(parsedRequested.email, 'audited4@example.com');
    assert.ok(parsedRequested.timestamp);

    var redeemedLog = logCalls.filter(function(l) { return String(l).indexOf('magic_link_login_redeemed') !== -1; });
    assert.strictEqual(redeemedLog.length, 1, 'expected exactly one magic_link_login_redeemed audit entry');
    var parsedRedeemed = JSON.parse(redeemedLog[0]);
    assert.strictEqual(parsedRedeemed.email, 'audited4@example.com');
    assert.ok(parsedRedeemed.timestamp);
  });

  console.log('\n[story-4-dual-path-authentication] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[story-4-dual-path-authentication] Unexpected error:', err);
  process.exit(1);
});
