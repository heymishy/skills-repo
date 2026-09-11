'use strict';
// tests/check-asa-s1-agency-self-activation.js -- story-asa-s1
// Story: artefacts/2026-09-11-agency-self-activation/stories/asa-s1-standalone-org-can-self-activate-as-agency.md
// Test plan: artefacts/2026-09-11-agency-self-activation/test-plans/asa-s1-test-plan.md
//
// Covers 6 unit tests + 1 integration test across 5 ACs, matching the test plan.
// Follows this repo's hand-rolled test()/assert style, mirroring
// tests/check-story6-conversion-to-independent.js's own makeFakePool convention
// (narrowed to what this story's own module/route actually query).

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
var ORG_ACTIVATION_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'org-activation'));
var AGENCY_PROVISIONING_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'agency-provisioning'));
var SERVER_PATH = path.resolve(ROOT, 'src/web-ui/server.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

// Narrow, self-contained fake pool -- supports exactly the query shapes this
// story's module/route issue, plus organisations/agency_client_relationships/
// shared_access_grants/team_memberships lookups needed for AC4/AC5. Mirrors
// tests/check-story6-conversion-to-independent.js's makeFakePool convention.
function makeFakePool(seed) {
  var orgs = ((seed && seed.orgs) || []).slice();
  var relationships = ((seed && seed.relationships) || []).slice();
  var grants = ((seed && seed.grants) || []).slice();
  var teamMemberships = ((seed && seed.teamMemberships) || []).slice();
  var personIdentities = ((seed && seed.personIdentities) || []).slice();

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('CREATE TABLE IF NOT EXISTS') === 0) return Promise.resolve({ rows: [] });

    // ── organisations ──────────────────────────────────────────────────────
    if (s.indexOf('SELECT ORG_ID, NAME, ORG_TYPE, CREATED_AT FROM ORGANISATIONS WHERE ORG_ID') === 0) {
      var match = orgs.filter(function(r) { return r.org_id === p[0]; });
      return Promise.resolve({ rows: match });
    }
    if (s.indexOf("UPDATE ORGANISATIONS SET ORG_TYPE = 'AGENCY'") === 0) {
      var org = orgs.filter(function(o) { return o.org_id === p[0] && o.org_type === 'standalone'; })[0];
      if (!org) return Promise.resolve({ rows: [] });
      org.org_type = 'agency';
      return Promise.resolve({ rows: [org] });
    }
    if (s.indexOf('INSERT INTO ORGANISATIONS') === 0 && s.indexOf('ON CONFLICT (ORG_ID) DO NOTHING') !== -1) {
      var dup = orgs.some(function(r) { return r.org_id === p[0]; });
      if (dup) return Promise.resolve({ rows: [] });
      var row1 = { org_id: p[0], name: p[1], org_type: p[2], created_at: new Date().toISOString() };
      orgs.push(row1);
      return Promise.resolve({ rows: [row1] });
    }

    // ── agency_client_relationships / shared_access_grants (untouched-ness check, AC4) ──
    if (s.indexOf('SELECT') === 0 && s.indexOf('FROM AGENCY_CLIENT_RELATIONSHIPS') !== -1) {
      return Promise.resolve({ rows: relationships.slice() });
    }
    if (s.indexOf('SELECT') === 0 && s.indexOf('FROM SHARED_ACCESS_GRANTS') !== -1) {
      return Promise.resolve({ rows: grants.slice() });
    }

    // ── people / person_identities / team_memberships (role resolution) ────
    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var pi = personIdentities.filter(function(r) { return r.identity_key === p[0]; })[0];
      return Promise.resolve({ rows: pi ? [{ person_id: pi.person_id }] : [] });
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

    console.warn('[fake-asa-s1-pool] unhandled query (returning empty rows): ' + s.slice(0, 150));
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _state: function() { return { orgs: orgs, relationships: relationships, grants: grants, teamMemberships: teamMemberships, personIdentities: personIdentities }; },
    _seedOrg: function(orgId, name, orgType) { orgs.push({ org_id: orgId, name: name, org_type: orgType, created_at: new Date().toISOString() }); },
    _seedPerson: function(personId, identityKey, tenantId, role) {
      personIdentities.push({ identity_key: identityKey, person_id: personId, provider: 'test' });
      teamMemberships.push({ person_id: personId, tenant_id: tenantId, role: role });
    },
    _seedRelationship: function(relationshipId, agencyOrgId, clientOrgId) {
      relationships.push({ relationship_id: relationshipId, agency_org_id: agencyOrgId, client_org_id: clientOrgId, created_at: new Date().toISOString() });
    },
    _seedGrant: function(grantId, relationshipId, resourceType, resourceId) {
      grants.push({ grant_id: grantId, relationship_id: relationshipId, resource_type: resourceType, resource_id: resourceId, granted_at: new Date().toISOString(), revoked_at: null });
    }
  };
}

function mockRes() {
  return {
    _statusCode: null,
    _headers: {},
    _body: null,
    writeHead: function(status, headers) {
      this._statusCode = status;
      if (headers) { var self = this; Object.keys(headers).forEach(function(k) { self._headers[k] = headers[k]; }); }
    },
    end: function(body) { this._body = body || null; },
    status: function(code) { this._statusCode = code; return this; },
    json: function(body) { this._body = JSON.stringify(body); this._jsonBody = body; return this; }
  };
}

function mockReq(opts) {
  opts = opts || {};
  var session = opts.session !== undefined ? opts.session : { accessToken: 'tok', tenantId: 'org-1', login: 'admin@example.com', userId: 1000 };
  return { session: session, body: opts.body, headers: opts.headers || { host: 'test.example.com' }, query: opts.query || {} };
}

(async function main() {
  // ===========================================================================
  // AC1 -- activateOrganisationAsAgency-flips-standalone-org-in-place (unit)
  // ===========================================================================
  await test('activateOrganisationAsAgency-flips-standalone-org-in-place (AC1)', async function() {
    var organisations = freshRequire(ORGANISATIONS_PATH);
    var pool = makeFakePool();
    pool._seedOrg('org-1', 'Acme Consultancy', 'standalone');

    var logCalls = [];
    var activated = await organisations.activateOrganisationAsAgency(pool, 'org-1', { info: function(m) { logCalls.push(m); } });

    assert.ok(activated, 'expected an activated row to be returned');
    assert.strictEqual(activated.org_id, 'org-1', 'must retain the SAME org_id -- never a new org');
    assert.strictEqual(activated.org_type, 'agency');

    var state = pool._state();
    assert.strictEqual(state.orgs.length, 1, 'expected exactly one organisations row -- no second org created');
    assert.strictEqual(state.orgs[0].org_type, 'agency');

    var activatedLog = logCalls.filter(function(m) { return m.indexOf('organisation_activated_as_agency') !== -1; });
    assert.strictEqual(activatedLog.length, 1, 'expected exactly one organisation_activated_as_agency audit log entry');
    var parsed = JSON.parse(activatedLog[0]);
    assert.strictEqual(parsed.org_id, 'org-1');
    assert.ok(parsed.timestamp, 'expected a timestamp on the audit entry');
  });

  // ===========================================================================
  // AC3 -- activateOrganisationAsAgency-idempotent-safe-on-non-standalone (unit)
  // ===========================================================================
  await test('activateOrganisationAsAgency-idempotent-safe-on-non-standalone (AC3)', async function() {
    var organisations = freshRequire(ORGANISATIONS_PATH);
    var pool = makeFakePool();
    pool._seedOrg('org-agency', 'Already Agency', 'agency');
    pool._seedOrg('org-client', 'Already Client', 'client');

    var activatedAgency = await organisations.activateOrganisationAsAgency(pool, 'org-agency');
    var activatedClient = await organisations.activateOrganisationAsAgency(pool, 'org-client');

    assert.strictEqual(activatedAgency, null, 'expected null for an org already org_type=agency');
    assert.strictEqual(activatedClient, null, 'expected null for an org that is org_type=client');

    var state = pool._state();
    assert.strictEqual(state.orgs.filter(function(o) { return o.org_id === 'org-agency'; })[0].org_type, 'agency', 'unchanged');
    assert.strictEqual(state.orgs.filter(function(o) { return o.org_id === 'org-client'; })[0].org_type, 'client', 'unchanged');
  });

  // ===========================================================================
  // AC2 -- handlePostBecomeAgency-rejects-non-admin (unit)
  // ===========================================================================
  await test('handlePostBecomeAgency-rejects-non-admin (AC2)', async function() {
    var orgActivation = freshRequire(ORG_ACTIVATION_PATH);
    var pool = makeFakePool();
    pool._seedOrg('org-2', 'Acme Consultancy', 'standalone');
    pool._seedPerson(2001, 'viewer@example.com', 'org-2', 'viewer');

    var logCalls = [];
    orgActivation.setActivationLogger({ info: function(m) { logCalls.push(m); } });

    var handlers = orgActivation.createOrgActivationHandlers(pool);
    var req = mockReq({ session: { accessToken: 'tok', tenantId: 'org-2', login: 'viewer@example.com', userId: 2001 }, body: { confirm: 'AGENCY' } });
    var res = mockRes();
    await handlers.handlePostBecomeAgency(req, res);

    assert.strictEqual(res._statusCode, 403, 'expected 403 for a non-admin activation attempt');
    var org = pool._state().orgs.filter(function(o) { return o.org_id === 'org-2'; })[0];
    assert.strictEqual(org.org_type, 'standalone', 'org_type must be unchanged after a rejected activation attempt');

    var denied = logCalls.filter(function(m) { return m.indexOf('organisation_activation_denied') !== -1; });
    assert.strictEqual(denied.length, 1, 'expected the denial to be audited');
    orgActivation.setActivationLogger(null);
  });

  // ===========================================================================
  // AC2 -- handleGetBecomeAgencyForm-rejects-non-admin (unit)
  // ===========================================================================
  await test('handleGetBecomeAgencyForm-rejects-non-admin (AC2)', async function() {
    var orgActivation = freshRequire(ORG_ACTIVATION_PATH);
    var pool = makeFakePool();
    pool._seedOrg('org-3', 'Acme Consultancy', 'standalone');
    pool._seedPerson(3001, 'viewer3@example.com', 'org-3', 'viewer');

    var handlers = orgActivation.createOrgActivationHandlers(pool);
    var req = mockReq({ session: { accessToken: 'tok', tenantId: 'org-3', login: 'viewer3@example.com', userId: 3001 } });
    var res = mockRes();
    await handlers.handleGetBecomeAgencyForm(req, res);

    assert.strictEqual(res._statusCode, 403, 'expected 403 for a non-admin GET attempt');
    assert.ok(res._body && res._body.indexOf('<form') === -1, 'form HTML must never be returned to a non-admin');
  });

  // ===========================================================================
  // AC3 -- handlePostBecomeAgency-rejects-already-activated-org (unit)
  // ===========================================================================
  await test('handlePostBecomeAgency-rejects-already-activated-org (AC3)', async function() {
    var orgActivation = freshRequire(ORG_ACTIVATION_PATH);
    var pool = makeFakePool();
    pool._seedOrg('org-4', 'Already Agency', 'agency');
    pool._seedPerson(4001, 'admin4@example.com', 'org-4', 'admin');

    var handlers = orgActivation.createOrgActivationHandlers(pool);
    var req = mockReq({ session: { accessToken: 'tok', tenantId: 'org-4', login: 'admin4@example.com', userId: 4001 }, body: { confirm: 'AGENCY' } });
    var res = mockRes();
    await handlers.handlePostBecomeAgency(req, res);

    assert.strictEqual(res._statusCode, 400, 'expected 400 for an org that is not eligible for activation');
    var org = pool._state().orgs.filter(function(o) { return o.org_id === 'org-4'; })[0];
    assert.strictEqual(org.org_type, 'agency', 'org_type must be unchanged');
  });

  // ===========================================================================
  // AC4 -- activateOrganisationAsAgency-does-not-touch-relationship-or-grant-tables (unit)
  // ===========================================================================
  await test('activateOrganisationAsAgency-does-not-touch-relationship-or-grant-tables (AC4)', async function() {
    var organisations = freshRequire(ORGANISATIONS_PATH);
    var pool = makeFakePool();
    pool._seedOrg('org-5', 'Acme Consultancy', 'standalone');
    pool._seedRelationship('rel-unrelated-1', 'other-agency', 'other-client');
    pool._seedGrant('grant-unrelated-1', 'rel-unrelated-1', 'product', 'other-product');

    var beforeState = JSON.parse(JSON.stringify(pool._state()));
    await organisations.activateOrganisationAsAgency(pool, 'org-5');
    var afterState = pool._state();

    assert.deepStrictEqual(afterState.relationships, beforeState.relationships, 'agency_client_relationships must be byte-for-byte unchanged after activation');
    assert.deepStrictEqual(afterState.grants, beforeState.grants, 'shared_access_grants must be byte-for-byte unchanged after activation');
  });

  // ===========================================================================
  // AC5 -- become-agency-then-create-client-flow-succeeds-end-to-end (integration)
  // ===========================================================================
  await test('become-agency-then-create-client-flow-succeeds-end-to-end (AC5)', async function() {
    var orgActivation = freshRequire(ORG_ACTIVATION_PATH);
    var agencyProvisioning = freshRequire(AGENCY_PROVISIONING_PATH);
    var pool = makeFakePool();
    pool._seedOrg('org-6', 'Acme Consultancy', 'standalone');
    pool._seedPerson(6001, 'admin6@example.com', 'org-6', 'admin');

    // Before activation: Story 3's own Create-Client form must reject this org.
    var provisioningHandlers = agencyProvisioning.createAgencyProvisioningHandlers(pool);
    var reqBefore = mockReq({ session: { accessToken: 'tok', tenantId: 'org-6', login: 'admin6@example.com', userId: 6001 } });
    var resBefore = mockRes();
    await provisioningHandlers.handleGetCreateClient(reqBefore, resBefore);
    assert.strictEqual(resBefore._statusCode, 403, 'sanity check: pre-activation, the Create-Client form must still reject a standalone org');

    // Activate as Agency.
    var activationHandlers = orgActivation.createOrgActivationHandlers(pool);
    var reqActivate = mockReq({ session: { accessToken: 'tok', tenantId: 'org-6', login: 'admin6@example.com', userId: 6001 }, body: { confirm: 'AGENCY' } });
    var resActivate = mockRes();
    await activationHandlers.handlePostBecomeAgency(reqActivate, resActivate);
    assert.strictEqual(resActivate._statusCode, 200, 'expected activation to succeed');

    // After activation: the SAME org, via the SAME session, must now reach
    // Story 3's real Create-Client form -- confirming this story actually
    // closes the gap it exists to close.
    var reqAfter = mockReq({ session: { accessToken: 'tok', tenantId: 'org-6', login: 'admin6@example.com', userId: 6001 } });
    var resAfter = mockRes();
    await provisioningHandlers.handleGetCreateClient(reqAfter, resAfter);
    assert.strictEqual(resAfter._statusCode, 200, 'expected the Create-Client form to render successfully post-activation');
    assert.ok(resAfter._body.indexOf('<form') !== -1, 'expected the real Create-Client form HTML');
  });

  // ===========================================================================
  // Wiring regression -- serverWiresOrgActivationRoutes
  // ===========================================================================
  await test('serverWiresOrgActivationRoutes (wiring regression)', function() {
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    assert.ok(src.indexOf("require('./routes/org-activation')") !== -1, 'server.js must require routes/org-activation');
    assert.ok(src.indexOf('createOrgActivationHandlers(') !== -1, 'server.js must instantiate the org-activation handlers factory');
    assert.ok(src.indexOf('/organisations/become-agency') !== -1, 'server.js must register the /organisations/become-agency route');
    assert.ok(src.indexOf('handleGetBecomeAgencyForm') !== -1 && src.indexOf('handlePostBecomeAgency') !== -1, 'server.js must wire both the GET form and POST activation handlers');
  });

  console.log('\n[asa-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[asa-s1] Unexpected error:', err);
  process.exit(1);
});
