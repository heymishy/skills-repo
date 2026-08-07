'use strict';

// tests/check-story3-self-service-provisioning.js -- story-3-self-service-provisioning
// Story: artefacts/2026-07-30-agency-client-organisations/stories/story-3-self-service-provisioning.md
// Test plan: artefacts/2026-07-30-agency-client-organisations/test-plans/story-3-self-service-provisioning-test-plan.md
//
// Covers (18 tests -- 16 across 5 ACs matching the test plan, plus 2 extra
// regression tests found during implementation, see AC5 and the fix-forward
// note below):
//   AC1: createsClientOrgAndRelationshipForAgencyUser, createClientFlowEndToEndAsAgencyAdmin
//   AC2: rejectsCreateClientForNonAgencyOrgType, createClientFlowRejectedForWrongOrgTypeAtRouteLevel
//   AC3: invitationRecordCreatedWithPassportMagicLinkToken, invitationRedemptionCreatesAdminRoleTeamMembership,
//        inviteUserFlowSendsEmailAndPersistsInvitation, redeemedInvitationResolvesSessionAndCreatesAdminMembership
//   AC4: rejectsBlankOrInvalidOrgName, createClientFlowRejectsInvalidNameAtRouteLevel
//   AC5: sendInvitationEmailAdapterStubThrowsWhenUnwired, serverJsWiresSendInvitationEmailToRealDifferentiatedResendCalls,
//        inviteRouteSurfaces500WhenAdapterFails (extra regression -- passport-magic-login's own
//        .send() swallows a rejected sendMagicLink into {success:false}, found during implementation)
//   Fix-forward (2026-07-31, pre-merge): inviteRouteRejectsUnrelatedAgency -- closes the
//        relationship-ownership gap originally RISK-ACCEPTed, then resolved before merge
//        per operator decision (see decisions.md)
//   NFR (Security):     createClientOrgTypeCheckIsServerSideNotClientSideOnly
//   NFR (Audit):        invitationTokenNeverLoggedInPlaintext, createClientAndInviteAreAudited
//   NFR (Accessibility): createClientFormIsKeyboardNavigable
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-story2-relationship-grants-enforcement.js, tests/check-story1-organisation-entity.js)
// -- no Jest/Mocha.

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID = 'test-gh-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-gh-secret';

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
var ORGANISATIONS_PATH   = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'organisations'));
var GRANTS_PATH           = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'agency-client-grants'));
var CLIENT_INVITATIONS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'client-invitations'));
var INVITATION_EMAIL_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'invitation-email'));
var MAGIC_LINK_STRATEGY_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'auth', 'magic-link-strategy'));
var AGENCY_PROVISIONING_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'agency-provisioning'));
var SERVER_PATH = path.resolve(ROOT, 'src/web-ui/server.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

// ── In-memory fake pool -- narrow, self-contained; supports exactly the
// query shapes this story's modules issue (mirrors
// tests/check-story1-organisation-entity.js / check-story2's own
// "narrow, explicit branches" convention). ──────────────────────────────────
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakePool(seed) {
  var orgs = ((seed && seed.orgs) || []).slice();
  var relationships = ((seed && seed.relationships) || []).slice();
  var invitations = ((seed && seed.invitations) || []).slice();
  var people = ((seed && seed.people) || []).slice();
  var personIdentities = ((seed && seed.personIdentities) || []).slice();
  var teamMemberships = ((seed && seed.teamMemberships) || []).slice();
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
      // createOrganisation -- no ON CONFLICT clause
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
    if (s.indexOf('SELECT RELATIONSHIP_ID, AGENCY_ORG_ID, CLIENT_ORG_ID, CREATED_AT FROM AGENCY_CLIENT_RELATIONSHIPS WHERE AGENCY_ORG_ID') === 0) {
      // getRelationshipForAgencyAndClient (fix-forward, 2026-07-31)
      var relPairMatch = relationships.filter(function(r) { return r.agency_org_id === p[0] && r.client_org_id === p[1]; });
      return Promise.resolve({ rows: relPairMatch });
    }

    // ── client_invitations ───────────────────────────────────────────────────
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

    // ── people / person_identities / team_memberships (Story 1's/tir-s1's schema) ──
    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var pi = personIdentities.filter(function(r) { return r.identity_key === p[0]; })[0];
      return Promise.resolve({ rows: pi ? [{ person_id: pi.person_id }] : [] });
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

    console.warn('[fake-story3-pool] unhandled query (returning empty rows): ' + s.slice(0, 150));
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _state: function() {
      return {
        orgs: orgs, relationships: relationships, invitations: invitations,
        people: people, personIdentities: personIdentities, teamMemberships: teamMemberships,
        queryLog: queryLog
      };
    },
    _seedOrg: function(orgId, name, orgType) { orgs.push({ org_id: orgId, name: name, org_type: orgType, created_at: new Date().toISOString() }); },
    _seedRelationship: function(relationshipId, agencyOrgId, clientOrgId) {
      relationships.push({ relationship_id: relationshipId, agency_org_id: agencyOrgId, client_org_id: clientOrgId, created_at: new Date().toISOString() });
    }
  };
}

function mockRes() {
  return { _s: null, _b: null, status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; } };
}

(async function main() {
  // ===========================================================================
  // AC1 -- createsClientOrgAndRelationshipForAgencyUser (unit)
  // ===========================================================================
  await test('createsClientOrgAndRelationshipForAgencyUser (AC1)', async function() {
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    var pool = makeFakePool();
    pool._seedOrg('agency-org-1', 'Agency Co', 'agency');

    var handlers = provisioning.createAgencyProvisioningHandlers(pool);
    var req = { session: { tenantId: 'agency-org-1' }, body: { name: 'Acme Client' } };
    var res = mockRes();
    await handlers.handlePostCreateClient(req, res);

    assert.strictEqual(res._s, 200, 'expected success from create-client handler');
    assert.ok(res._b && res._b.success, 'expected success:true');
    var state = pool._state();
    var newOrg = state.orgs.filter(function(o) { return o.org_id === res._b.clientOrgId; })[0];
    assert.ok(newOrg, 'expected a new organisations row for the created client org');
    assert.strictEqual(newOrg.org_type, 'client', 'new org must have org_type=client');
    var rel = state.relationships.filter(function(r) { return r.relationship_id === res._b.relationshipId; })[0];
    assert.ok(rel, 'expected a new agency_client_relationships row');
    assert.strictEqual(rel.agency_org_id, 'agency-org-1');
    assert.strictEqual(rel.client_org_id, res._b.clientOrgId);
  });

  // ===========================================================================
  // AC2 -- rejectsCreateClientForNonAgencyOrgType (unit, parametrised)
  // ===========================================================================
  await test('rejectsCreateClientForNonAgencyOrgType (AC2)', async function() {
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    for (var i = 0; i < ['standalone', 'client'].length; i++) {
      var orgType = ['standalone', 'client'][i];
      var pool = makeFakePool();
      pool._seedOrg('org-' + orgType, 'Some Org', orgType);
      var orgCountBefore = pool._state().orgs.length;
      var handlers = provisioning.createAgencyProvisioningHandlers(pool);
      var req = { session: { tenantId: 'org-' + orgType }, body: { name: 'Should Not Be Created' } };
      var res = mockRes();
      await handlers.handlePostCreateClient(req, res);
      assert.strictEqual(res._s, 403, 'expected 403 rejection for org_type=' + orgType);
      assert.strictEqual(pool._state().orgs.length, orgCountBefore, 'no NEW organisations row should be created for org_type=' + orgType);
    }
  });

  // ===========================================================================
  // AC3 -- invitationRecordCreatedWithPassportMagicLinkToken (unit)
  // ===========================================================================
  await test('invitationRecordCreatedWithPassportMagicLinkToken (AC3)', async function() {
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    strategy._resetForTesting();
    var sentCalls = [];
    strategy.registerMagicLinkStrategy({
      secret: 'unit-test-secret',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function(destination, href, code) { sentCalls.push({ destination: destination, href: href, code: code }); },
      verify: async function() {}
    });

    var pool = makeFakePool();
    pool._seedOrg('agency-org-2', 'Agency Co', 'agency');
    pool._seedRelationship('rel-2', 'agency-org-2', 'client-org-x');
    var handlers = provisioning.createAgencyProvisioningHandlers(pool);

    var req = { session: { tenantId: 'agency-org-2' }, params: { id: 'client-org-x' }, body: { email: 'newuser@example.com' } };
    var res = mockRes();
    await handlers.handlePostInviteUser(req, res);

    assert.strictEqual(res._s, 200, 'expected success from invite-user handler');
    var invRow = pool._state().invitations.filter(function(i) { return i.invitation_id === res._b.invitationId; })[0];
    assert.ok(invRow, 'expected an invitation record to be created for the Client org');
    assert.strictEqual(invRow.client_org_id, 'client-org-x');
    assert.strictEqual(invRow.email, 'newuser@example.com');

    assert.strictEqual(sentCalls.length, 1, 'expected the mocked Resend send function to be called exactly once');
    assert.strictEqual(sentCalls[0].destination, 'newuser@example.com');
    assert.ok(sentCalls[0].href.indexOf('token=') !== -1, 'expected the sent link to contain a token-bearing query param');
  });

  // ===========================================================================
  // AC3 -- invitationRedemptionCreatesAdminRoleTeamMembership (unit)
  // ===========================================================================
  await test('invitationRedemptionCreatesAdminRoleTeamMembership (AC3)', async function() {
    var clientInvitations = freshRequire(CLIENT_INVITATIONS_PATH);
    var pool = makeFakePool();
    var invitation = await clientInvitations.createInvitation(pool, 'client-org-y', 'firstuser@example.com', 'agency-org-3');

    var result = await clientInvitations.redeemInvitation(pool, { destination: 'firstuser@example.com', invitationId: invitation.invitation_id });
    assert.strictEqual(result.ok, true, 'expected redemption to succeed');
    assert.strictEqual(result.user.tenantId, 'client-org-y');
    assert.strictEqual(result.user.role, 'admin');

    // Assert by querying team_memberships directly (D37 "observable, differentiating outcome" convention) --
    // not merely that a setter/function reference was invoked.
    var tm = pool._state().teamMemberships.filter(function(r) { return r.tenant_id === 'client-org-y'; })[0];
    assert.ok(tm, 'expected a team_memberships row scoped to the new Client org tenant_id');
    assert.strictEqual(tm.role, 'admin', 'expected role=admin for the first invited user');

    // Edge case: a SECOND redemption attempt with the same already-used token is rejected.
    var second = await clientInvitations.redeemInvitation(pool, { destination: 'firstuser@example.com', invitationId: invitation.invitation_id });
    assert.strictEqual(second.ok, false, 'expected the second redemption attempt to be rejected');
    assert.strictEqual(pool._state().teamMemberships.length, 1, 'expected no additional team_memberships row from the rejected second redemption');
  });

  // ===========================================================================
  // AC4 -- rejectsBlankOrInvalidOrgName (unit, parametrised)
  // ===========================================================================
  await test('rejectsBlankOrInvalidOrgName (AC4)', async function() {
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    var invalidNames = ['', '   ', 'name/with/slash', '../traversal'];
    for (var i = 0; i < invalidNames.length; i++) {
      var pool = makeFakePool();
      pool._seedOrg('agency-org-4', 'Agency Co', 'agency');
      var handlers = provisioning.createAgencyProvisioningHandlers(pool);
      var req = { session: { tenantId: 'agency-org-4' }, body: { name: invalidNames[i] } };
      var res = mockRes();
      await handlers.handlePostCreateClient(req, res);
      assert.strictEqual(res._s, 400, 'expected 400 for invalid name ' + JSON.stringify(invalidNames[i]));
      var clientRows = pool._state().orgs.filter(function(o) { return o.org_type === 'client'; });
      assert.strictEqual(clientRows.length, 0, 'no organisations row should be created for invalid name ' + JSON.stringify(invalidNames[i]));
    }
  });

  // ===========================================================================
  // AC5 -- sendInvitationEmailAdapterStubThrowsWhenUnwired (unit)
  // ===========================================================================
  await test('sendInvitationEmailAdapterStubThrowsWhenUnwired (AC5)', async function() {
    var invitationEmail = freshRequire(INVITATION_EMAIL_PATH);
    invitationEmail._resetForTesting();
    var threw = false;
    var message = null;
    try {
      await invitationEmail.sendInvitationEmail('someone@example.com', 'https://example.com/invite?token=x');
    } catch (err) {
      threw = true;
      message = err.message;
    }
    assert.ok(threw, 'expected sendInvitationEmail to throw when unwired');
    assert.strictEqual(message, 'Adapter not wired: sendInvitationEmail. Call setSendInvitationEmail() with a real implementation before use.');
  });

  // ===========================================================================
  // AC5 (regression) -- inviteRouteSurfaces500WhenAdapterFails
  //
  // passport-magic-login's own .send() swallows a rejected sendMagicLink
  // (e.g. this D37 adapter throwing when unwired) into {success:false,
  // error} rather than rejecting the outer promise -- found while
  // implementing this story. Confirms the invite-user ROUTE (not just the
  // adapter module directly) surfaces this as a real error, rather than
  // silently reporting 200 success while no email was actually sent.
  // ===========================================================================
  await test('inviteRouteSurfaces500WhenAdapterFails (AC5 regression)', async function() {
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    strategy._resetForTesting();
    strategy.registerMagicLinkStrategy({
      secret: 'adapter-failure-test-secret',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function() { throw new Error('Adapter not wired: sendInvitationEmail. Call setSendInvitationEmail() with a real implementation before use.'); },
      verify: async function() {}
    });

    var pool = makeFakePool();
    pool._seedOrg('agency-org-12', 'Agency Co', 'agency');
    pool._seedRelationship('rel-12', 'agency-org-12', 'client-org-adapter-fail');
    var handlers = provisioning.createAgencyProvisioningHandlers(pool);

    var req = { session: { tenantId: 'agency-org-12' }, params: { id: 'client-org-adapter-fail' }, body: { email: 'willfail@example.com' } };
    var res = mockRes();
    await handlers.handlePostInviteUser(req, res);

    assert.strictEqual(res._s, 500, 'expected the route to surface a 500 when the sendInvitationEmail adapter fails, not a silent 200');
  });

  // ===========================================================================
  // Fix-forward (2026-07-31) -- inviteRouteRejectsUnrelatedAgency
  //
  // Closes the relationship-ownership gap flagged in decisions.md (RISK-ACCEPT,
  // resolved before merge per operator decision): an Agency-type org with NO
  // agency_client_relationships row to the target Client org must be rejected
  // -- both on the GET form and the POST issuance -- even though its own
  // org_type='agency' check passes. 404 (not 403), matching Story 2's
  // established FORBIDDEN-vs-NOT_FOUND policy.
  // ===========================================================================
  await test('inviteRouteRejectsUnrelatedAgency (relationship-ownership fix-forward)', async function() {
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    strategy._resetForTesting();
    var sentCalls = [];
    strategy.registerMagicLinkStrategy({
      secret: 'unrelated-agency-test-secret',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function(destination, href) { sentCalls.push({ destination: destination, href: href }); },
      verify: async function() {}
    });

    var pool = makeFakePool();
    // Agency A owns client-org-owned-by-a. Agency B is a completely separate,
    // unrelated Agency org -- no relationship row links it to that Client org.
    pool._seedOrg('agency-org-a', 'Agency A', 'agency');
    pool._seedOrg('agency-org-b', 'Agency B', 'agency');
    pool._seedRelationship('rel-a', 'agency-org-a', 'client-org-owned-by-a');
    var handlers = provisioning.createAgencyProvisioningHandlers(pool);

    var getReq = { session: { tenantId: 'agency-org-b' }, params: { id: 'client-org-owned-by-a' } };
    var getRes = mockRes();
    await handlers.handleGetInviteUser(getReq, getRes);
    assert.strictEqual(getRes._s, 404, 'expected the GET form to reject an Agency with no relationship to this Client org, 404 not 403');

    var postReq = { session: { tenantId: 'agency-org-b' }, params: { id: 'client-org-owned-by-a' }, body: { email: 'sneaky@example.com' } };
    var postRes = mockRes();
    await handlers.handlePostInviteUser(postReq, postRes);
    assert.strictEqual(postRes._s, 404, 'expected the POST issuance to reject an Agency with no relationship to this Client org, 404 not 403');
    assert.strictEqual(sentCalls.length, 0, 'no invitation email must be sent for an unrelated Agency');
    assert.strictEqual(pool._state().invitations.length, 0, 'no invitation record must be created for an unrelated Agency');

    // Sanity: Agency A (the actual owner) is still allowed through.
    var ownerReq = { session: { tenantId: 'agency-org-a' }, params: { id: 'client-org-owned-by-a' }, body: { email: 'legit@example.com' } };
    var ownerRes = mockRes();
    await handlers.handlePostInviteUser(ownerReq, ownerRes);
    assert.strictEqual(ownerRes._s, 200, 'expected the actual owning Agency to still be allowed through');
  });

  // ===========================================================================
  // AC1 -- createClientFlowEndToEndAsAgencyAdmin (integration)
  // ===========================================================================
  await test('createClientFlowEndToEndAsAgencyAdmin (AC1)', async function() {
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    var pool = makeFakePool();
    pool._seedOrg('agency-org-5', 'Agency Co', 'agency');
    var handlers = provisioning.createAgencyProvisioningHandlers(pool);

    var req = { session: { tenantId: 'agency-org-5' }, body: { name: 'Full Stack Client' } };
    var res = mockRes();
    await handlers.handlePostCreateClient(req, res);

    assert.strictEqual(res._s, 200);
    var state = pool._state();
    var persistedOrg = state.orgs.filter(function(o) { return o.org_id === res._b.clientOrgId; })[0];
    var persistedRel = state.relationships.filter(function(r) { return r.relationship_id === res._b.relationshipId; })[0];
    assert.ok(persistedOrg && persistedRel, 'both rows must be persisted and queryable afterward');
  });

  // ===========================================================================
  // AC2 -- createClientFlowRejectedForWrongOrgTypeAtRouteLevel (integration, full route stack)
  // ===========================================================================
  await test('createClientFlowRejectedForWrongOrgTypeAtRouteLevel (AC2)', async function() {
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    var pool = makeFakePool();
    pool._seedOrg('org-standalone-2', 'Solo Org', 'standalone');
    var handlers = provisioning.createAgencyProvisioningHandlers(pool);

    var req = { session: { tenantId: 'org-standalone-2' } };
    var res = mockRes();
    await handlers.handleGetCreateClient(req, res);
    assert.strictEqual(res._s, 403, 'expected the GET form itself to reject a non-Agency org_type server-side');
  });

  // ===========================================================================
  // AC3 -- inviteUserFlowSendsEmailAndPersistsInvitation (integration)
  // ===========================================================================
  await test('inviteUserFlowSendsEmailAndPersistsInvitation (AC3)', async function() {
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    strategy._resetForTesting();
    var sentCalls = [];
    var logCalls = [];
    var fakeLogger = { info: function(msg) { logCalls.push(msg); }, log: function(msg) { logCalls.push(msg); } };
    var origConsoleLog = console.log;
    console.log = function(msg) { logCalls.push(String(msg)); origConsoleLog.apply(console, arguments); };

    strategy.registerMagicLinkStrategy({
      secret: 'integration-test-secret',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function(destination, href, code) { sentCalls.push({ destination: destination, href: href }); },
      verify: async function() {}
    });

    var pool = makeFakePool();
    pool._seedOrg('agency-org-6', 'Agency Co', 'agency');
    pool._seedRelationship('rel-6', 'agency-org-6', 'client-org-z');
    var handlers = provisioning.createAgencyProvisioningHandlers(pool);

    var req = { session: { tenantId: 'agency-org-6' }, params: { id: 'client-org-z' }, body: { email: 'invitee@example.com' } };
    var res = mockRes();
    await handlers.handlePostInviteUser(req, res);
    console.log = origConsoleLog;

    assert.strictEqual(res._s, 200);
    assert.strictEqual(sentCalls.length, 1, 'expected the mocked send function invoked exactly once');
    assert.strictEqual(sentCalls[0].destination, 'invitee@example.com');
    var invRow = pool._state().invitations[0];
    assert.ok(invRow, 'expected the invitation to be persisted');

    var token = sentCalls[0].href.split('token=')[1];
    var plainTokenAppearsInLogs = logCalls.some(function(l) { return String(l).indexOf(token) !== -1; });
    assert.strictEqual(plainTokenAppearsInLogs, false, 'the raw invitation token must never appear in any captured log call');
  });

  // ===========================================================================
  // AC3 -- redeemedInvitationResolvesSessionAndCreatesAdminMembership (integration, full route stack)
  // ===========================================================================
  await test('redeemedInvitationResolvesSessionAndCreatesAdminMembership (AC3)', async function() {
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    var clientInvitations = freshRequire(CLIENT_INVITATIONS_PATH);
    strategy._resetForTesting();

    var pool = makeFakePool();

    strategy.registerMagicLinkStrategy({
      secret: 'redeem-test-secret',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function() {},
      verify: async function(payload, callback) {
        try {
          var result = await clientInvitations.redeemInvitation(pool, payload);
          if (!result.ok) { callback(null, false, { message: result.reason }); return; }
          callback(null, result.user);
        } catch (err) { callback(err); }
      }
    });

    var invitation = await clientInvitations.createInvitation(pool, 'client-org-redeem', 'redeemer@example.com', 'agency-org-7');
    var issued = await strategy.issueMagicLink('redeemer@example.com', { invitationId: invitation.invitation_id });
    void issued;
    // Extract the token from the strategy's own sendMagicLink call by issuing directly
    // and capturing the href this time (separate from the no-op registered above).
    var capturedHref = null;
    strategy.registerMagicLinkStrategy({
      secret: 'redeem-test-secret',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function(destination, href) { capturedHref = href; },
      verify: async function(payload, callback) {
        try {
          var result = await clientInvitations.redeemInvitation(pool, payload);
          if (!result.ok) { callback(null, false, { message: result.reason }); return; }
          callback(null, result.user);
        } catch (err) { callback(err); }
      }
    });
    var invitation2 = await clientInvitations.createInvitation(pool, 'client-org-redeem2', 'redeemer2@example.com', 'agency-org-7');
    await strategy.issueMagicLink('redeemer2@example.com', { invitationId: invitation2.invitation_id });
    assert.ok(capturedHref, 'expected a magic link href to be captured');
    var token = capturedHref.split('token=')[1];

    var handlers = provisioning.createAgencyProvisioningHandlers(pool);
    var req = { query: { token: token }, session: { tenantId: 'unused' }, sessionId: 'pre-redeem-session' };
    var res = mockRes();
    await handlers.handleGetInviteRedeem(req, res);

    assert.strictEqual(res._s, 200, 'expected a successful redemption response');
    assert.strictEqual(req.session.tenantId, 'client-org-redeem2', 'session tenantId must resolve to the new Client org');
    assert.ok(req.session.accessToken, 'expected an accessToken to be set on the resolved session (canonical field name)');
    assert.strictEqual(req.session.login, 'redeemer2@example.com');

    var tm = pool._state().teamMemberships.filter(function(r) { return r.tenant_id === 'client-org-redeem2'; })[0];
    assert.ok(tm, 'expected a team_memberships row for the new Client org');
    assert.strictEqual(tm.role, 'admin', 'expected role=admin confirmed directly from team_memberships');
  });

  // ===========================================================================
  // AC4 -- createClientFlowRejectsInvalidNameAtRouteLevel (integration, full route stack)
  // ===========================================================================
  await test('createClientFlowRejectsInvalidNameAtRouteLevel (AC4)', async function() {
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    var pool = makeFakePool();
    pool._seedOrg('agency-org-8', 'Agency Co', 'agency');
    var handlers = provisioning.createAgencyProvisioningHandlers(pool);

    var req = { session: { tenantId: 'agency-org-8' }, body: { name: '' } };
    var res = mockRes();
    await handlers.handlePostCreateClient(req, res);
    assert.strictEqual(res._s, 400, 'expected a 400-shaped response for a blank org name at the route level');
    assert.strictEqual(pool._state().orgs.filter(function(o) { return o.org_type === 'client'; }).length, 0);
  });

  // ===========================================================================
  // AC5 -- serverJsWiresSendInvitationEmailToRealDifferentiatedResendCalls (integration)
  // ===========================================================================
  await test('serverJsWiresSendInvitationEmailToRealDifferentiatedResendCalls (AC5)', async function() {
    // Part 1: source-scan confirms server.js actually calls the real wiring
    // factory (mirrors this codebase's own established "server.js wiring"
    // test convention -- see tests/check-tir-s3-admin-adds-teammate.js's
    // testServerWiring).
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    assert.ok(src.indexOf('setSendInvitationEmail(') !== -1, 'server.js must call setSendInvitationEmail()');
    assert.ok(src.indexOf('createResendSendInvitationEmail(') !== -1, 'server.js must wire the real createResendSendInvitationEmail() factory, not a reimplementation');
    assert.ok(src.indexOf('registerMagicLinkStrategy(') !== -1, 'server.js must register the shared magic-link strategy');

    // Part 2: exercise the REAL production wiring function directly (D37 --
    // "assert an observable, differentiating outcome", not merely that a
    // setter was called once). Two different invited emails must resolve to
    // two different, correctly-addressed Resend calls.
    var invitationEmail = freshRequire(INVITATION_EMAIL_PATH);
    var sendCalls = [];
    var fakeResendClient = { emails: { send: async function(args) { sendCalls.push(args); } } };
    var realSendFn = invitationEmail.createResendSendInvitationEmail(fakeResendClient, 'from@test.dev');

    await realSendFn('alice@example.com', 'https://app.test/invite/redeem?token=aaa');
    await realSendFn('bob@example.com', 'https://app.test/invite/redeem?token=bbb');

    assert.strictEqual(sendCalls.length, 2, 'expected exactly 2 distinct Resend calls');
    assert.strictEqual(sendCalls[0].to, 'alice@example.com');
    assert.strictEqual(sendCalls[1].to, 'bob@example.com');
    assert.notStrictEqual(sendCalls[0].to, sendCalls[1].to, 'the two calls must be addressed to two DIFFERENT recipients -- an observable, differentiating outcome');
    assert.ok(sendCalls[0].html.indexOf('token=aaa') !== -1, 'expected the first call\'s own distinct token-bearing link');
    assert.ok(sendCalls[1].html.indexOf('token=bbb') !== -1, 'expected the second call\'s own distinct token-bearing link');
    assert.strictEqual(sendCalls[0].from, 'from@test.dev');
  });

  // ===========================================================================
  // NFR (Security) -- createClientOrgTypeCheckIsServerSideNotClientSideOnly
  // ===========================================================================
  await test('createClientOrgTypeCheckIsServerSideNotClientSideOnly (NFR-security)', async function() {
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    var pool = makeFakePool();
    pool._seedOrg('org-standalone-3', 'Solo Org', 'standalone');
    var handlers = provisioning.createAgencyProvisioningHandlers(pool);

    // Forged/absent client-side flag must have zero influence -- rejection
    // comes purely from the server-side session-resolved org_type.
    var req = { session: { tenantId: 'org-standalone-3' }, body: { name: 'Sneaky Client', clientSideIsAgency: true, orgType: 'agency' } };
    var res = mockRes();
    await handlers.handlePostCreateClient(req, res);
    assert.strictEqual(res._s, 403, 'a forged client-side flag must not bypass the server-side org_type check');
  });

  // ===========================================================================
  // NFR (Audit) -- invitationTokenNeverLoggedInPlaintext
  // ===========================================================================
  await test('invitationTokenNeverLoggedInPlaintext (NFR-audit)', async function() {
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    var clientInvitations = freshRequire(CLIENT_INVITATIONS_PATH);
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    strategy._resetForTesting();

    var pool = makeFakePool();
    var capturedHref = null;
    var loggerCalls = [];
    strategy.registerMagicLinkStrategy({
      secret: 'audit-test-secret',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function(destination, href) { capturedHref = href; },
      verify: async function(payload, callback) {
        var result = await clientInvitations.redeemInvitation(pool, payload, { info: function(m) { loggerCalls.push(m); } });
        if (!result.ok) { callback(null, false); return; }
        callback(null, result.user);
      }
    });

    pool._seedOrg('agency-org-9', 'Agency Co', 'agency');
    pool._seedRelationship('rel-9', 'agency-org-9', 'client-org-audit');
    var handlers = provisioning.createAgencyProvisioningHandlers(pool);
    var origConsoleLog = console.log;
    console.log = function(msg) { loggerCalls.push(String(msg)); };

    var inviteReq = { session: { tenantId: 'agency-org-9' }, params: { id: 'client-org-audit' }, body: { email: 'audited@example.com' } };
    var inviteRes = mockRes();
    await handlers.handlePostInviteUser(inviteReq, inviteRes);

    var token = capturedHref.split('token=')[1];

    var redeemReq = { query: { token: token }, session: {}, sessionId: 'audit-sid' };
    var redeemRes = mockRes();
    await handlers.handleGetInviteRedeem(redeemReq, redeemRes);
    console.log = origConsoleLog;

    assert.strictEqual(redeemRes._s, 200, 'expected the redemption to succeed');
    var tokenInLogs = loggerCalls.some(function(l) { return String(l).indexOf(token) !== -1; });
    assert.strictEqual(tokenInLogs, false, 'the raw invitation token must never appear in any log call across invite-send AND redemption');
  });

  // ===========================================================================
  // NFR (Audit) -- createClientAndInviteAreAudited
  // ===========================================================================
  await test('createClientAndInviteAreAudited (NFR-audit)', async function() {
    var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    strategy._resetForTesting();
    strategy.registerMagicLinkStrategy({
      secret: 'audit-test-secret-2',
      callbackUrl: '/invite/redeem',
      sendMagicLink: async function() {},
      verify: async function() {}
    });

    var pool = makeFakePool();
    pool._seedOrg('agency-org-10', 'Agency Co', 'agency');
    var handlers = provisioning.createAgencyProvisioningHandlers(pool);

    var logCalls = [];
    var origConsoleLog = console.log;
    console.log = function(msg) { logCalls.push(String(msg)); };

    var createReq = { session: { tenantId: 'agency-org-10' }, body: { name: 'Audited Client' } };
    var createRes = mockRes();
    await handlers.handlePostCreateClient(createReq, createRes);

    var inviteReq = { session: { tenantId: 'agency-org-10' }, params: { id: createRes._b.clientOrgId }, body: { email: 'auditee@example.com' } };
    var inviteRes = mockRes();
    await handlers.handlePostInviteUser(inviteReq, inviteRes);

    console.log = origConsoleLog;

    var clientCreatedLog = logCalls.filter(function(l) { return l.indexOf('client_org_created') !== -1; });
    assert.strictEqual(clientCreatedLog.length, 1, 'expected exactly one client_org_created audit log entry');
    var parsedCreate = JSON.parse(clientCreatedLog[0]);
    assert.strictEqual(parsedCreate.agency_org_id, 'agency-org-10');
    assert.strictEqual(parsedCreate.client_org_id, createRes._b.clientOrgId);
    assert.ok(parsedCreate.timestamp, 'expected a timestamp on the client_org_created audit entry');

    var invitationCreatedLog = logCalls.filter(function(l) { return l.indexOf('invitation_created') !== -1; });
    assert.strictEqual(invitationCreatedLog.length, 1, 'expected exactly one invitation_created audit log entry');
    var parsedInvite = JSON.parse(invitationCreatedLog[0]);
    assert.strictEqual(parsedInvite.client_org_id, createRes._b.clientOrgId);
    assert.ok(parsedInvite.timestamp, 'expected a timestamp on the invitation_created audit entry');
  });

  // ===========================================================================
  // NFR (Accessibility) -- createClientFormIsKeyboardNavigable
  // ===========================================================================
  await test('createClientFormIsKeyboardNavigable (NFR-accessibility)', async function() {
    var provisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    var pool = makeFakePool();
    pool._seedOrg('agency-org-11', 'Agency Co', 'agency');
    var handlers = provisioning.createAgencyProvisioningHandlers(pool);

    var req = { session: { tenantId: 'agency-org-11' } };
    var res = mockRes();
    await handlers.handleGetCreateClient(req, res);

    assert.strictEqual(res._s, 200);
    var html = res._b.html;
    assert.ok(html.indexOf('<form') !== -1, 'expected a real <form> element');
    assert.ok(html.indexOf('<input') !== -1, 'expected a real <input> element');
    assert.ok(!/onclick\s*=/.test(html), 'expected no non-semantic click-only targets in the create-client form');
    assert.ok(html.indexOf('<label') !== -1, 'expected a real <label> element for accessible naming');
  });

  console.log('\n[story-3-self-service-provisioning] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[story-3-self-service-provisioning] Unexpected error:', err);
  process.exit(1);
});
