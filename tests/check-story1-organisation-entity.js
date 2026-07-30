'use strict';

// tests/check-story1-organisation-entity.js -- story-1-organisation-entity
// Story: artefacts/2026-07-30-agency-client-organisations/stories/story-1-organisation-entity.md
// Test plan: artefacts/2026-07-30-agency-client-organisations/test-plans/story-1-organisation-entity-test-plan.md
//
// Covers (10 tests across 4 ACs, matching the test plan plus a same-PR follow-up):
//   AC1: createsOrganisationsTableWithCorrectColumns
//   AC2: resolvesOrgTypeStandaloneForBackfilledTenant, backfillPathIntegratesWithSessionResolution
//   AC3: resolvesOrgTypeStandaloneForNewSignupNoAllowlistMatch
//   AC4: existingTenantRoutesUnaffectedByOrganisationsTable
//   NFR (Performance): organisationLookupAddsAtMostOneIndexedQuery
//   NFR (Security):    organisationLookupScopedByTrustedSessionTenantId
//   NFR (Audit):        organisationCreationIsAudited
//
// Follow-up (2026-07-31, same PR, pre-merge): closes the gap where organisation
// resolution was wired into GitHub/Google OAuth callbacks only, not
// email/password signup/login (see decisions.md) --
//   emailSignupResolvesOrganisationForNewTenant, emailLoginResolvesOrganisationForExistingTenant
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-tir-s1-person-team-schema.js, tests/check-ftcg-s1-free-tier-credit-grant.js)
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
var ORGANISATIONS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'organisations'));
var AUTH_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'auth'));
var AUTH_EMAIL_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'auth-email'));

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

// ── In-memory fake pool for the organisations table ─────────────────────────
// Narrow, self-contained fake -- supports exactly the query shapes
// organisations.js issues. Not a general SQL engine (mirrors
// src/web-ui/adapters/fake-test-db.js's documented "narrow, explicit
// branches" convention).
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakeOrgPool(seedRows) {
  var rows = (seedRows || []).slice();
  var createTableCalls = [];
  var queryLog = [];

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];
    queryLog.push({ sql: s, params: p });

    if (s.indexOf('CREATE TABLE IF NOT EXISTS') === 0) {
      createTableCalls.push(s);
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('SELECT ORG_ID, NAME, ORG_TYPE, CREATED_AT FROM ORGANISATIONS WHERE ORG_ID') === 0) {
      var lookupId = p[0];
      var match = rows.filter(function(r) { return r.org_id === lookupId; });
      return Promise.resolve({ rows: match });
    }

    if (s.indexOf('SELECT 1 FROM ORGANISATIONS WHERE ORG_ID') === 0) {
      var checkId = p[0];
      var exists = rows.some(function(r) { return r.org_id === checkId; });
      return Promise.resolve({ rows: exists ? [{ '?column?': 1 }] : [] });
    }

    if (s.indexOf('INSERT INTO ORGANISATIONS') === 0 && s.indexOf('ON CONFLICT (ORG_ID) DO NOTHING') !== -1) {
      var orgId = p[0]; var name = p[1]; var orgType = p[2];
      var dup = rows.some(function(r) { return r.org_id === orgId; });
      if (dup) return Promise.resolve({ rows: [] }); // ON CONFLICT DO NOTHING
      var createdAt = new Date().toISOString();
      var row = { org_id: orgId, name: name, org_type: orgType, created_at: createdAt };
      rows.push(row);
      return Promise.resolve({ rows: [row] });
    }

    console.warn('[fake-org-pool] unhandled query (returning empty rows): ' + s.slice(0, 120));
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _state: function() { return { rows: rows, createTableCalls: createTableCalls, queryLog: queryLog }; }
  };
}

(async function main() {
  // ===========================================================================
  // AC1 -- createsOrganisationsTableWithCorrectColumns
  // ===========================================================================
  await test('createsOrganisationsTableWithCorrectColumns (AC1)', async function() {
    var organisations = freshRequire(ORGANISATIONS_PATH);
    var pool = makeFakeOrgPool();
    await organisations.migrateOrganisationsSchema(pool);
    var calls = pool._state().createTableCalls;
    var orgCall = calls.find(function(c) { return c.indexOf('CREATE TABLE IF NOT EXISTS ORGANISATIONS') === 0; });
    assert.ok(orgCall, 'Expected a CREATE TABLE IF NOT EXISTS organisations statement, got: ' + JSON.stringify(calls));
    ['ORG_ID', 'NAME', 'ORG_TYPE', 'CREATED_AT', 'PRIMARY KEY'].forEach(function(col) {
      assert.ok(orgCall.indexOf(col) !== -1, 'organisations shape must include ' + col + ', got: ' + orgCall);
    });

    // Idempotent rerun -- must not throw or duplicate.
    await organisations.migrateOrganisationsSchema(pool);
    assert.strictEqual(pool._state().createTableCalls.length, 2, 'expected exactly 2 CREATE TABLE calls (one per invocation), no error on rerun');
  });

  // ===========================================================================
  // AC3 -- resolvesOrgTypeStandaloneForNewSignupNoAllowlistMatch
  // ===========================================================================
  await test('resolvesOrgTypeStandaloneForNewSignupNoAllowlistMatch (AC3)', async function() {
    var organisations = freshRequire(ORGANISATIONS_PATH);
    var pool = makeFakeOrgPool([]);

    var row = await organisations.resolveOrganisationForTenant(pool, 'brand-new-tenant');
    assert.strictEqual(row.org_id, 'brand-new-tenant');
    assert.strictEqual(row.org_type, 'standalone', 'expected org_type=standalone for a new signup with no allowlist/agency/client selection');

    // Edge case: calling resolution twice for the same tenant_id returns the
    // same row, does not create a second one.
    var again = await organisations.resolveOrganisationForTenant(pool, 'brand-new-tenant');
    assert.strictEqual(again.org_id, 'brand-new-tenant');
    var matches = pool._state().rows.filter(function(r) { return r.org_id === 'brand-new-tenant'; });
    assert.strictEqual(matches.length, 1, 'expected exactly one organisations row after resolving the same tenant_id twice, got: ' + matches.length);
  });

  // ===========================================================================
  // AC2 -- resolvesOrgTypeStandaloneForBackfilledTenant
  // ===========================================================================
  await test('resolvesOrgTypeStandaloneForBackfilledTenant (AC2)', async function() {
    var organisations = freshRequire(ORGANISATIONS_PATH);
    var pool = makeFakeOrgPool([]);

    var createdCount = await organisations.backfillStandaloneOrganisations(pool, ['legacy-tenant-1', 'legacy-tenant-2']);
    assert.strictEqual(createdCount, 2, 'expected 2 rows created for 2 pre-existing tenants with no organisations row');
    var row1 = pool._state().rows.find(function(r) { return r.org_id === 'legacy-tenant-1'; });
    var row2 = pool._state().rows.find(function(r) { return r.org_id === 'legacy-tenant-2'; });
    assert.ok(row1 && row1.org_type === 'standalone', 'legacy-tenant-1 must be backfilled with org_type=standalone');
    assert.ok(row2 && row2.org_type === 'standalone', 'legacy-tenant-2 must be backfilled with org_type=standalone');

    // Edge case: backfill run twice for the same tenant is idempotent (no
    // duplicate row, no error).
    var secondRunCreated = await organisations.backfillStandaloneOrganisations(pool, ['legacy-tenant-1', 'legacy-tenant-2']);
    assert.strictEqual(secondRunCreated, 0, 'expected zero NEW rows created on a second backfill run over the same tenant list');
    assert.strictEqual(pool._state().rows.length, 2, 'expected still exactly 2 rows total after a second backfill run');
  });

  // ===========================================================================
  // AC4 -- existingTenantRoutesUnaffectedByOrganisationsTable
  // ===========================================================================
  await test('existingTenantRoutesUnaffectedByOrganisationsTable (AC4)', async function() {
    // Precondition: an organisations row already exists for this tenant_id
    // (matches the test plan's stated precondition for this AC).
    var pool = makeFakeOrgPool([{ org_id: userIdentityFixture.login, name: userIdentityFixture.login, org_type: 'standalone', created_at: new Date().toISOString() }]);

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
    var req = mockAuthReq({ session: { oauthState: 'state-ac4' }, query: { code: 'valid-code', state: 'state-ac4' } });
    var res = mockAuthRes();
    await auth.handleAuthCallback(req, res);
    global.fetch = origFetch;

    // Same assertions this codebase's pre-existing OAuth-callback tests make
    // (see check-ftcg-s1-free-tier-credit-grant.js, check-tir-s1-person-team-schema.js)
    // -- proves the route's response/session shape is unchanged by the new
    // organisations table/resolution step being active.
    assert.strictEqual(res.statusCode, 302, 'expected the standard 302 redirect, unchanged from before this story');
    assert.strictEqual(req.session.userId, userIdentityFixture.id);
    assert.strictEqual(req.session.login, userIdentityFixture.login);
    assert.strictEqual(req.session.tenantId, userIdentityFixture.login, 'no TENANT_ORG_ALLOWLIST configured -- tenantId must still equal the GitHub login, unchanged');
    assert.ok(req.session.accessToken, 'accessToken must still be set on the session, unchanged');
    assert.ok(req.session.role, 'role must still be resolved (falls back to "user"), unchanged');

    // Sanity: the pre-existing row was reused, not duplicated.
    var matches = pool._state().rows.filter(function(r) { return r.org_id === userIdentityFixture.login; });
    assert.strictEqual(matches.length, 1, 'expected the pre-existing organisations row to be reused, not duplicated');
  });

  // ===========================================================================
  // AC2 -- backfillPathIntegratesWithSessionResolution
  // ===========================================================================
  await test('backfillPathIntegratesWithSessionResolution (AC2)', async function() {
    // Precondition: a pre-story tenant with an active login path but NO
    // organisations row yet (simulates a tenant who signed up before this
    // story shipped and has not yet been through the startup backfill).
    var pool = makeFakeOrgPool([]);

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
    var req = mockAuthReq({ session: { oauthState: 'state-backfill' }, query: { code: 'valid-code', state: 'state-backfill' } });
    var res = mockAuthRes();
    await auth.handleAuthCallback(req, res);
    global.fetch = origFetch;

    // The request completes with the same response the tenant would have
    // received before this story shipped -- no prompt, no error, no delay.
    assert.strictEqual(res.statusCode, 302, 'expected the pre-existing tenant to complete login normally, no forced re-classification step');

    // The row is backfilled transparently as a side effect of the resolution step.
    var row = pool._state().rows.find(function(r) { return r.org_id === userIdentityFixture.login; });
    assert.ok(row, 'expected an organisations row to be transparently created for this pre-existing tenant');
    assert.strictEqual(row.org_type, 'standalone');
  });

  // ===========================================================================
  // NFR (Performance) -- organisationLookupAddsAtMostOneIndexedQuery
  // ===========================================================================
  await test('organisationLookupAddsAtMostOneIndexedQuery (NFR-perf)', async function() {
    var organisations = freshRequire(ORGANISATIONS_PATH);
    // Seed an existing row -- the common case at OAuth callback is a
    // RETURNING user whose organisation already exists.
    var pool = makeFakeOrgPool([{ org_id: 'existing-tenant', name: 'existing-tenant', org_type: 'standalone', created_at: new Date().toISOString() }]);

    var before = pool._state().queryLog.length;
    await organisations.resolveOrganisationForTenant(pool, 'existing-tenant');
    var after = pool._state().queryLog.length;

    assert.strictEqual(after - before, 1, 'expected exactly 1 additional query for an existing organisation, got: ' + (after - before));
    var issuedQuery = pool._state().queryLog[pool._state().queryLog.length - 1];
    assert.ok(issuedQuery.sql.indexOf('SELECT') === 0 && issuedQuery.sql.indexOf('FROM ORGANISATIONS') !== -1 && issuedQuery.sql.indexOf('WHERE ORG_ID') !== -1,
      'expected a SELECT ... FROM organisations WHERE org_id = $1-shaped query, got: ' + issuedQuery.sql);
    assert.deepStrictEqual(issuedQuery.params, ['existing-tenant']);
  });

  // ===========================================================================
  // NFR (Security) -- organisationLookupScopedByTrustedSessionTenantId
  // ===========================================================================
  await test('organisationLookupScopedByTrustedSessionTenantId (NFR-security)', async function() {
    var organisations = freshRequire(ORGANISATIONS_PATH);
    var pool = makeFakeOrgPool([]);

    // The lookup must be scoped by exactly the tenantId value the caller
    // supplies -- never a separately-derived "request" value.
    var trustedTenantId = 'trusted-session-tenant-id';
    await organisations.resolveOrganisationForTenant(pool, trustedTenantId);
    var calls = pool._state().queryLog.filter(function(c) { return c.params && c.params.indexOf(trustedTenantId) !== -1; });
    assert.ok(calls.length >= 1, 'expected at least one query scoped by the trusted tenantId value');
    pool._state().queryLog.forEach(function(c) {
      (c.params || []).forEach(function(param) {
        // None of the params issued for this resolution should be anything
        // other than the trusted tenantId / derived name / org_type constant.
        assert.ok(['trusted-session-tenant-id', 'standalone'].indexOf(param) !== -1,
          'unexpected param value reached the DB query: ' + param + ' -- lookup must only ever use the trusted tenantId');
      });
    });

    // Source-level guard: auth.js's call site must pass req.session.tenantId,
    // never a request-supplied value (query string, body, header).
    var authSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'routes', 'auth.js'), 'utf8');
    assert.ok(authSrc.indexOf('_resolveOrganisation(req.session.tenantId)') !== -1,
      'auth.js must call _resolveOrganisation(req.session.tenantId) -- the trusted, server-set value');
    assert.ok(!/_resolveOrganisation\(req\.(query|body)/.test(authSrc),
      'auth.js must never call _resolveOrganisation with a request-supplied value (req.query/req.body)');
  });

  // ===========================================================================
  // NFR (Audit) -- organisationCreationIsAudited
  // ===========================================================================
  await test('organisationCreationIsAudited (NFR-audit)', async function() {
    var organisations = freshRequire(ORGANISATIONS_PATH);

    // AC3 path: new signup creation is audited.
    var infoCallsNew = [];
    var loggerNew = { info: function(msg) { infoCallsNew.push(msg); } };
    var poolNew = makeFakeOrgPool([]);
    await organisations.resolveOrganisationForTenant(poolNew, 'audited-new-tenant', loggerNew);
    assert.strictEqual(infoCallsNew.length, 1, 'expected exactly one audit log call for a new organisation creation, got: ' + infoCallsNew.length);
    var parsedNew = JSON.parse(infoCallsNew[0]);
    assert.strictEqual(parsedNew.event, 'organisation_created');
    assert.strictEqual(parsedNew.tenant_id, 'audited-new-tenant');
    assert.strictEqual(parsedNew.org_type, 'standalone');
    assert.ok(parsedNew.timestamp, 'expected a timestamp field in the audit log entry');

    // Resolving the SAME tenant again (already exists) must NOT re-log a creation.
    await organisations.resolveOrganisationForTenant(poolNew, 'audited-new-tenant', loggerNew);
    assert.strictEqual(infoCallsNew.length, 1, 'expected no additional audit log call when resolving an already-existing organisation');

    // AC2 path: backfill creation is also audited.
    var infoCallsBackfill = [];
    var loggerBackfill = { info: function(msg) { infoCallsBackfill.push(msg); } };
    var poolBackfill = makeFakeOrgPool([]);
    await organisations.backfillStandaloneOrganisations(poolBackfill, ['audited-backfill-tenant'], loggerBackfill);
    assert.strictEqual(infoCallsBackfill.length, 1, 'expected exactly one audit log call for the backfilled organisation, got: ' + infoCallsBackfill.length);
    var parsedBackfill = JSON.parse(infoCallsBackfill[0]);
    assert.strictEqual(parsedBackfill.event, 'organisation_created');
    assert.strictEqual(parsedBackfill.tenant_id, 'audited-backfill-tenant');
    assert.strictEqual(parsedBackfill.org_type, 'standalone');
    assert.ok(parsedBackfill.timestamp);
  });

  // ===========================================================================
  // Follow-up (2026-07-31): email/password signup + login wire the same
  // organisation-resolution step as the OAuth callbacks. Closes the gap
  // flagged in decisions.md where brand-new email/password signups had no
  // organisations row until the next server-restart backfill sweep.
  // ===========================================================================

  function mockEmailReq(overrides) {
    var req = Object.assign({
      session: {}, sessionId: 'test-sid-' + Math.random().toString(36).slice(2),
      headers: {}, connection: { remoteAddress: '127.0.0.1' }, body: undefined
    }, overrides || {});
    if (!req.session.csrfToken) req.session.csrfToken = 'test-csrf-' + Math.random().toString(36).slice(2);
    if (req.body && typeof req.body === 'object' && req.body._csrf === undefined) {
      req.body = Object.assign({}, req.body, { _csrf: req.session.csrfToken });
    }
    return req;
  }

  function mockEmailRes() {
    var _headers = {};
    return {
      statusCode: null,
      get headers() { return _headers; },
      writeHead: function(code, hdrs) { this.statusCode = code; if (hdrs) Object.assign(_headers, hdrs); },
      setHeader: function(name, value) { _headers[name] = value; },
      end: function(body) { this.body = (body != null ? String(body) : ''); this._ended = true; }
    };
  }

  // Stub password adapter -- always succeeds. Password correctness itself is
  // already covered by check-lab-s2.2-email-password.js; this file only needs
  // signup/login to reach the point where organisation resolution fires.
  var STUB_PASSWORD_ADAPTER = {
    hash: async function() { return 'stub-hash'; },
    compare: async function() { return true; }
  };

  await test('emailSignupResolvesOrganisationForNewTenant (AC3 follow-up)', async function() {
    var password = freshRequire(path.join(ROOT, 'src', 'web-ui', 'modules', 'password'));
    password.setPasswordAdapter(STUB_PASSWORD_ADAPTER);
    var authEmail = freshRequire(AUTH_EMAIL_PATH);
    authEmail._clearRateLimits();

    var pool = makeFakeOrgPool([]);
    authEmail.setOrganisationsPool(pool);

    var db = {
      query: async function(sql) {
        if (/INSERT INTO users/i.test(sql)) return { rows: [{ id: 'uuid-signup-1' }] };
        if (/SELECT.*FROM users WHERE email/i.test(sql)) return { rows: [] };
        return { rows: [] };
      }
    };
    authEmail.setUserDb(db);

    var req = mockEmailReq({ body: { email: 'newtenant@example.com', password: 'TestPassw0rd!xyz' } });
    var res = mockEmailRes();
    await authEmail.handleEmailSignup(req, res);

    assert.strictEqual(res.statusCode, 302, 'expected the standard signup redirect, unchanged by organisation resolution');
    var row = pool._state().rows.find(function(r) { return r.org_id === 'newtenant@example.com'; });
    assert.ok(row, 'expected an organisations row to be created for the new email/password tenant');
    assert.strictEqual(row.org_type, 'standalone');
  });

  await test('emailLoginResolvesOrganisationForExistingTenant (follow-up, mirrors OAuth every-login behaviour)', async function() {
    var password = freshRequire(path.join(ROOT, 'src', 'web-ui', 'modules', 'password'));
    password.setPasswordAdapter(STUB_PASSWORD_ADAPTER);
    var authEmail = freshRequire(AUTH_EMAIL_PATH);
    authEmail._clearRateLimits();

    // Precondition: tenant already has an organisations row (e.g. from an
    // earlier signup or the startup backfill) -- login must resolve/reuse it,
    // not fail, and must not duplicate it.
    var pool = makeFakeOrgPool([{ org_id: 'existing@example.com', name: 'existing@example.com', org_type: 'standalone', created_at: new Date().toISOString() }]);
    authEmail.setOrganisationsPool(pool);

    var db = {
      query: async function(sql) {
        if (/SELECT.*FROM users WHERE email/i.test(sql)) {
          return { rows: [{ id: 'uuid-login-1', email: 'existing@example.com', password_hash: 'stub-hash' }] };
        }
        return { rows: [] };
      }
    };
    authEmail.setUserDb(db);

    var req = mockEmailReq({ body: { email: 'existing@example.com', password: 'TestPassw0rd!xyz' } });
    var res = mockEmailRes();
    await authEmail.handleEmailLogin(req, res);

    assert.strictEqual(res.statusCode, 302, 'expected the standard login redirect, unchanged by organisation resolution');
    var matches = pool._state().rows.filter(function(r) { return r.org_id === 'existing@example.com'; });
    assert.strictEqual(matches.length, 1, 'expected the pre-existing organisations row to be reused, not duplicated, on login');
  });

  console.log('\n[story-1-organisation-entity] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[story-1-organisation-entity] Unexpected error:', err);
  process.exit(1);
});
