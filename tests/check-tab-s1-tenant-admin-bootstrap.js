'use strict';

// tests/check-tab-s1-tenant-admin-bootstrap.js — tab-s1
// Story: artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s1.md
// Test plan: artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s1-test-plan.md
//
// Built incrementally across the implementation plan's 10 tasks
// (artefacts/2026-09-26-tenant-admin-bootstrap/plans/tab-s1-plan.md) -- each
// task appends its own tests to this same file. This commit (Task 1) adds
// resolveOrCreatePersonForIdentity (identity-links.js) plus 2 unit tests
// covering it -- the personId-resolution helper the remaining 9 planned
// tests (6 unit, 3 integration, matching AC1-AC6 + NFRs) and their
// production wiring depend on. Added per decisions.md, 2026-09-28,
// correcting the DoR contract's own inaccurate "personId already
// resolvable" assumption.
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-story1-organisation-entity.js, tests/check-tir-s1-person-team-schema.js)
// -- no Jest/Mocha. Fake pool is narrow, self-contained, per-test-file (this
// session's established convention) -- pre-built here with real
// BEGIN/COMMIT/ROLLBACK semantics via pool.connect()-issued clients, backed
// by a per-transaction undo log (not whole-state snapshot/restore -- see the
// comment above handleQuery, and decisions.md's "Task 4" entry, 2026-09-29,
// for why: a real Postgres ROLLBACK only ever undoes the rolling-back
// transaction's OWN writes, never a concurrent transaction's already-
// committed rows), transactional query branches, and a failure-injection
// hook, ALL of which later tasks in this same file require (AC3 concurrency,
// AC6 rollback) -- not needed by Task 1's own 2 tests alone.

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID = 'test-gh-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-gh-secret';
process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/auth/github/callback';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';

var assert = require('assert');
var path = require('path');

var passed = 0, failed = 0, failures = [];
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var ROOT = path.join(__dirname, '..');
var IDENTITY_LINKS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'identity-links'));
var BOOTSTRAP_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'tenant-admin-bootstrap'));
var AUTH_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'auth'));
var AUTH_EMAIL_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'auth-email'));

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function mockAuthReq(overrides) {
  return Object.assign({ session: {}, sessionId: 'test-sid-' + Math.random().toString(36).slice(2), query: {}, headers: {} }, overrides || {});
}
function mockAuthRes() {
  var _headers = {};
  return {
    statusCode: null, get headers() { return _headers; },
    writeHead: function(code, hdrs) { this.statusCode = code; if (hdrs) Object.assign(_headers, hdrs); },
    setHeader: function(name, value) { _headers[name] = value; },
    end: function(body) { this.body = (body != null ? body : ''); this._ended = true; }
  };
}

// ── Narrow, self-contained fake pool -- people / person_identities /
// tenant_admin_bootstrap / team_memberships, with real transactional
// (pool.connect() -> client.query('BEGIN'/'COMMIT'/'ROLLBACK')) semantics. ──
function _norm(sql) { return String(sql).trim().replace(/\s+/g, ' ').toUpperCase(); }

function makeFakePool(seed) {
  var people = (seed && seed.people) ? seed.people.slice() : [];
  var personIdentities = (seed && seed.personIdentities) ? seed.personIdentities.slice() : [];
  var tenantAdminBootstrap = (seed && seed.tenantAdminBootstrap) ? seed.tenantAdminBootstrap.slice() : [];
  var teamMemberships = (seed && seed.teamMemberships) ? seed.teamMemberships.slice() : [];
  var nextPersonId = (seed && seed.nextPersonId) || 1;
  var queryLog = [];
  var hooks = { failTeamMembershipsInsertOnce: false };

  // Per-transaction undo log (not whole-state snapshot/restore -- see
  // decisions.md / Task 4 fix note): a real Postgres ROLLBACK only undoes
  // the rolling-back transaction's OWN uncommitted writes -- it never
  // touches another transaction's already-committed data. A whole-state
  // snapshot captured at this client's own BEGIN time predates any
  // concurrent transaction's later commit, so restoring to it would wipe
  // out that other transaction's committed rows too. Each mutating branch
  // below calls recordUndo(fn) to register a targeted reversal; ROLLBACK
  // replays them in reverse; COMMIT just discards the log (the shared
  // arrays are already the durable, mutated state).
  var NOOP_RECORD_UNDO = function() {};

  function handleQuery(sql, params, recordUndo) {
    var s = _norm(sql);
    var p = params || [];
    var undo = recordUndo || NOOP_RECORD_UNDO;
    queryLog.push({ sql: s, params: p });

    if (s.indexOf('CREATE TABLE') === 0) return Promise.resolve({ rows: [] });

    if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) {
      var person = { id: nextPersonId++, created_at: new Date().toISOString() };
      people.push(person);
      undo(function() {
        var i = people.indexOf(person);
        if (i !== -1) people.splice(i, 1);
      });
      return Promise.resolve({ rows: [{ id: person.id }] });
    }

    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var lookupKey = p[0];
      var match = personIdentities.filter(function(r) { return r.identity_key === lookupKey; });
      return Promise.resolve({ rows: match.length ? [{ person_id: match[0].person_id }] : [] });
    }

    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND PERSON_ID') === -1 && s.indexOf('AND TENANT_ID') === -1) {
      var fbTenant = p[0];
      var fb = teamMemberships.filter(function(r) { return r.tenant_id === fbTenant; });
      return Promise.resolve({ rows: fb.length ? [{ person_id: fb[0].person_id }] : [] });
    }

    if (s.indexOf('INSERT INTO PERSON_IDENTITIES') === 0) {
      var idKey = p[0], pid = p[1], provider = p[2];
      var identityRow = { identity_key: idKey, person_id: pid, provider: provider, created_at: new Date().toISOString() };
      personIdentities.push(identityRow);
      undo(function() {
        var i = personIdentities.indexOf(identityRow);
        if (i !== -1) personIdentities.splice(i, 1);
      });
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('INSERT INTO TENANT_ADMIN_BOOTSTRAP') === 0) {
      var tenantId = p[0], claimPersonId = p[1];
      var hasAdmin = teamMemberships.some(function(r) { return r.tenant_id === tenantId && r.role === 'admin'; });
      var alreadyClaimed = tenantAdminBootstrap.some(function(r) { return r.tenant_id === tenantId; });
      if (hasAdmin || alreadyClaimed) return Promise.resolve({ rows: [] });
      var claimRow = { tenant_id: tenantId, admin_person_id: claimPersonId, created_at: new Date().toISOString() };
      tenantAdminBootstrap.push(claimRow);
      undo(function() {
        var i = tenantAdminBootstrap.indexOf(claimRow);
        if (i !== -1) tenantAdminBootstrap.splice(i, 1);
      });
      return Promise.resolve({ rows: [{ admin_person_id: claimPersonId }] });
    }

    if (s.indexOf('INSERT INTO TEAM_MEMBERSHIPS') === 0) {
      if (hooks.failTeamMembershipsInsertOnce) {
        hooks.failTeamMembershipsInsertOnce = false;
        return Promise.reject(new Error('simulated team_memberships insert failure'));
      }
      var tmPerson = p[0], tmTenant = p[1], tmRole = p[2];
      var idx = teamMemberships.findIndex(function(r) { return r.person_id === tmPerson && r.tenant_id === tmTenant; });
      var row = { person_id: tmPerson, tenant_id: tmTenant, role: tmRole, created_at: new Date().toISOString() };
      var prevRow = idx !== -1 ? teamMemberships[idx] : null;
      if (idx !== -1) teamMemberships[idx] = row; else teamMemberships.push(row);
      undo(function() {
        var i = teamMemberships.indexOf(row);
        if (i === -1) return;
        if (prevRow) teamMemberships[i] = prevRow; else teamMemberships.splice(i, 1);
      });
      return Promise.resolve({ rows: [] });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 120));
    return Promise.resolve({ rows: [] });
  }

  function makeClient() {
    var txUndo = null;
    function recordUndo(fn) {
      if (txUndo) txUndo.push(fn);
    }
    return {
      query: function(sql, params) {
        var s = _norm(sql);
        if (s === 'BEGIN') { txUndo = []; return Promise.resolve({ rows: [] }); }
        if (s === 'COMMIT') { txUndo = null; return Promise.resolve({ rows: [] }); }
        if (s === 'ROLLBACK') {
          if (txUndo) { while (txUndo.length) { txUndo.pop()(); } }
          txUndo = null;
          return Promise.resolve({ rows: [] });
        }
        return handleQuery(sql, params, recordUndo);
      },
      release: function() {}
    };
  }

  return {
    query: handleQuery,
    connect: function() { return Promise.resolve(makeClient()); },
    _state: function() {
      return { people: people, personIdentities: personIdentities, tenantAdminBootstrap: tenantAdminBootstrap, teamMemberships: teamMemberships, queryLog: queryLog };
    },
    _hooks: hooks
  };
}

(async function main() {

  // ===========================================================================
  // resolveOrCreatePersonForIdentity (identity-links.js) -- supports Task 1's wiring
  // ===========================================================================
  await test('resolveOrCreatePersonForIdentity creates a new person + links identity when none exists', async function() {
    var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
    var pool = makeFakePool({});
    var personId = await identityLinks.resolveOrCreatePersonForIdentity(pool, 'brand-new-login', 'github');
    assert.ok(personId != null, 'expected a real personId to be returned');
    var state = pool._state();
    assert.strictEqual(state.people.length, 1, 'expected exactly one people row created');
    var link = state.personIdentities.find(function(r) { return r.identity_key === 'brand-new-login'; });
    assert.ok(link, 'expected a person_identities row linking the new identity');
    assert.strictEqual(link.person_id, personId);
    assert.strictEqual(link.provider, 'github');
  });

  await test('resolveOrCreatePersonForIdentity reuses an existing personId, does not create a duplicate person', async function() {
    var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
    var pool = makeFakePool({ people: [{ id: 42, created_at: new Date().toISOString() }], personIdentities: [{ identity_key: 'existing-login', person_id: 42, provider: 'github', created_at: new Date().toISOString() }] });
    var personId = await identityLinks.resolveOrCreatePersonForIdentity(pool, 'existing-login', 'github');
    assert.strictEqual(personId, 42, 'expected the existing personId to be reused');
    assert.strictEqual(pool._state().people.length, 1, 'expected no new people row created for an already-linked identity');
  });

  // ===========================================================================
  // AC1 -- firstLoginOnNewTenantGrantsAdmin
  // ===========================================================================
  await test('firstLoginOnNewTenantGrantsAdmin (AC1)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({ people: [{ id: 1, created_at: new Date().toISOString() }] });

    var result = await bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-x', 1);
    assert.strictEqual(result.granted, true, 'expected admin to be granted for a genuinely new tenant');

    var state = pool._state();
    var tm = state.teamMemberships.find(function(r) { return r.tenant_id === 'tenant-x' && r.person_id === 1; });
    assert.ok(tm, 'expected a real team_memberships row for person 1 in tenant-x');
    assert.strictEqual(tm.role, 'admin');
    var claim = state.tenantAdminBootstrap.find(function(r) { return r.tenant_id === 'tenant-x'; });
    assert.ok(claim, 'expected a real tenant_admin_bootstrap row for tenant-x');
    assert.strictEqual(claim.admin_person_id, 1);
  });

  // ===========================================================================
  // AC2 -- secondPersonIntoBootstrappedTenantDoesNotBecomeAdmin
  // ===========================================================================
  await test('secondPersonIntoBootstrappedTenantDoesNotBecomeAdmin (AC2)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({
      people: [{ id: 1, created_at: new Date().toISOString() }, { id: 2, created_at: new Date().toISOString() }],
      tenantAdminBootstrap: [{ tenant_id: 'tenant-x', admin_person_id: 1, created_at: new Date().toISOString() }]
    });

    var result = await bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-x', 2);
    assert.strictEqual(result.granted, false, 'expected person 2 NOT to be granted admin');

    var state = pool._state();
    var tmForB = state.teamMemberships.find(function(r) { return r.tenant_id === 'tenant-x' && r.person_id === 2 && r.role === 'admin'; });
    assert.ok(!tmForB, 'expected no admin team_memberships row for person 2');
    var claim = state.tenantAdminBootstrap.find(function(r) { return r.tenant_id === 'tenant-x'; });
    assert.strictEqual(claim.admin_person_id, 1, 'expected the pre-existing bootstrap claim (person 1) to remain unchanged');
    assert.strictEqual(state.tenantAdminBootstrap.length, 1, 'expected still exactly one bootstrap row for tenant-x');
  });

  // ===========================================================================
  // AC3 -- concurrentBootstrapExactlyOneWins
  // ===========================================================================
  await test('concurrentBootstrapExactlyOneWins (AC3)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({
      people: [{ id: 10, created_at: new Date().toISOString() }, { id: 20, created_at: new Date().toISOString() }]
    });

    var results = await Promise.all([
      bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-y', 10),
      bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-y', 20)
    ]);

    var grantedCount = results.filter(function(r) { return r.granted; }).length;
    assert.strictEqual(grantedCount, 1, 'expected exactly one of the two concurrent calls to be granted, got: ' + grantedCount);

    var state = pool._state();
    var claims = state.tenantAdminBootstrap.filter(function(r) { return r.tenant_id === 'tenant-y'; });
    assert.strictEqual(claims.length, 1, 'expected exactly one tenant_admin_bootstrap row for tenant-y, never zero, never two');

    var adminRows = state.teamMemberships.filter(function(r) { return r.tenant_id === 'tenant-y' && r.role === 'admin'; });
    assert.strictEqual(adminRows.length, 1, 'expected exactly one admin team_memberships row for tenant-y');
    assert.strictEqual(adminRows[0].person_id, claims[0].admin_person_id, 'the winning claim and the granted admin row must agree on which person won');
  });

  // ===========================================================================
  // AC5 -- noOpWhenTenantAlreadyHasRealAdmin
  // ===========================================================================
  await test('noOpWhenTenantAlreadyHasRealAdmin (AC5)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({
      people: [{ id: 1, created_at: new Date().toISOString() }, { id: 2, created_at: new Date().toISOString() }],
      teamMemberships: [{ person_id: 1, tenant_id: 'tenant-z', role: 'admin', created_at: new Date().toISOString() }]
      // Deliberately NO tenant_admin_bootstrap row -- proves the no-op holds
      // even without the gate table's own claim (AC5's own named scenario).
    });

    var result = await bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-z', 2);
    assert.strictEqual(result.granted, false, 'expected no-op -- tenant-z already has a real admin');

    var state = pool._state();
    var adminRows = state.teamMemberships.filter(function(r) { return r.tenant_id === 'tenant-z' && r.role === 'admin'; });
    assert.strictEqual(adminRows.length, 1, 'expected still exactly one admin row for tenant-z');
    assert.strictEqual(adminRows[0].person_id, 1, 'expected the existing admin (person 1) to be completely unchanged');
    var claim = state.tenantAdminBootstrap.find(function(r) { return r.tenant_id === 'tenant-z'; });
    assert.ok(!claim, 'expected no tenant_admin_bootstrap row to be created for tenant-z');
  });

  // ===========================================================================
  // AC6 -- rollbackLeavesNoClaimedButAdminlessTenant
  // ===========================================================================
  await test('rollbackLeavesNoClaimedButAdminlessTenant (AC6)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({ people: [{ id: 1, created_at: new Date().toISOString() }] });
    pool._hooks.failTeamMembershipsInsertOnce = true;

    var threw = false;
    try {
      await bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-w', 1);
    } catch (err) {
      threw = true;
    }
    assert.ok(threw, 'expected the call to reject/throw when the second write fails');

    var state = pool._state();
    var claim = state.tenantAdminBootstrap.find(function(r) { return r.tenant_id === 'tenant-w'; });
    assert.ok(!claim, 'expected ZERO tenant_admin_bootstrap rows for tenant-w after rollback -- the first write must be undone, not left committed');
    var tm = state.teamMemberships.find(function(r) { return r.tenant_id === 'tenant-w'; });
    assert.ok(!tm, 'expected zero team_memberships rows for tenant-w after rollback');
  });

  // ===========================================================================
  // AC4 -- bootstrapIdenticalAcrossAllThreeProviders (unit)
  // ===========================================================================
  await test('bootstrapIdenticalAcrossAllThreeProviders (AC4)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var providerTenants = ['tenant-github-1', 'tenant-google-1', 'tenant-email-1'];
    for (var i = 0; i < providerTenants.length; i++) {
      var pool = makeFakePool({ people: [{ id: 1, created_at: new Date().toISOString() }] });
      var result = await bootstrap.bootstrapTenantAdminIfNeeded(pool, providerTenants[i], 1);
      assert.strictEqual(result.granted, true, 'expected admin granted identically for ' + providerTenants[i]);
      var tm = pool._state().teamMemberships.find(function(r) { return r.tenant_id === providerTenants[i]; });
      assert.strictEqual(tm.role, 'admin');
    }
  });

  // ===========================================================================
  // NFR (Performance) -- exactlyTwoRealInsertsForOneSuccessfulBootstrap
  // ===========================================================================
  await test('exactlyTwoRealInsertsForOneSuccessfulBootstrap (NFR-perf)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({ people: [{ id: 1, created_at: new Date().toISOString() }] });
    await bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-perf', 1);
    // BEGIN/COMMIT/ROLLBACK run on the client and are intercepted before
    // reaching handleQuery, so queryLog (populated only inside handleQuery)
    // shows only the real INSERT statements -- confirm the count below
    // empirically rather than assuming a specific number.
    var realQueryCount = pool._state().queryLog.length;
    assert.strictEqual(realQueryCount, 2, 'expected exactly 2 real SQL statements (the tenant_admin_bootstrap claim insert + the team_memberships grant insert) for one successful bootstrap, got: ' + realQueryCount + ' -- queries were: ' + JSON.stringify(pool._state().queryLog.map(function(q) { return q.sql.slice(0, 60); })));
  });

  // ===========================================================================
  // NFR (Audit) -- grantIsAuditedWithoutRawIdentityString
  // ===========================================================================
  await test('grantIsAuditedWithoutRawIdentityString (NFR-audit)', async function() {
    var bootstrap = freshRequire(BOOTSTRAP_PATH);
    var pool = makeFakePool({ people: [{ id: 1, created_at: new Date().toISOString() }] });
    var infoCalls = [];
    var spyLogger = { info: function(msg, data) { infoCalls.push({ msg: msg, data: data }); } };

    await bootstrap.bootstrapTenantAdminIfNeeded(pool, 'tenant-audit', 1, spyLogger);

    var granted = infoCalls.find(function(c) { return c.msg === 'admin_bootstrap_granted'; });
    assert.ok(granted, 'expected an admin_bootstrap_granted audit log call');
    assert.strictEqual(granted.data.personId, 1);
    assert.strictEqual(granted.data.tenantId, 'tenant-audit');
    assert.ok(granted.data.timestamp, 'expected a timestamp field');
  });

  // ===========================================================================
  // AC1/AC4 -- githubCallbackWiresIntoBootstrapForNewTenant (integration)
  // ===========================================================================
  await test('githubCallbackWiresIntoBootstrapForNewTenant (AC1/AC4 integration)', async function() {
    var tokenSuccessFixture = require('./fixtures/github/oauth-token-exchange-success.json');
    var userIdentityFixture = require('./fixtures/github/user-identity.json');

    var auth = freshRequire(AUTH_PATH);
    auth.setLogger({ info: function() {}, warn: function() {} });
    var pool = makeFakePool({});
    auth.setTenantAdminBootstrapPool(pool);
    var oauthAdapter = require(path.join(ROOT, 'src', 'web-ui', 'auth', 'oauth-adapter'));
    oauthAdapter.setProviderAdapter(oauthAdapter.gitHubProviderAdapter);

    var origFetch = global.fetch;
    global.fetch = async function(url) {
      if (url.includes('access_token')) return { json: async function() { return tokenSuccessFixture; } };
      if (url.includes('/user')) return { json: async function() { return userIdentityFixture; } };
      return { json: async function() { return {}; } };
    };
    var req = mockAuthReq({ session: { oauthState: 'state-tab-s1-gh' }, query: { code: 'valid-code', state: 'state-tab-s1-gh' } });
    var res = mockAuthRes();
    await auth.handleAuthCallback(req, res);
    global.fetch = origFetch;

    assert.strictEqual(req.session.role, 'admin', 'expected the first-ever GitHub login to resolve to admin');
    var adminRow = pool._state().teamMemberships.find(function(r) { return r.role === 'admin'; });
    assert.ok(adminRow, 'expected a real team_memberships admin row confirmed via the fake pool state, not just the session value');
  });

  // ===========================================================================
  // AC1/AC4 -- googleCallbackWiresIntoBootstrapForNewTenant (integration)
  // ===========================================================================
  await test('googleCallbackWiresIntoBootstrapForNewTenant (AC1/AC4 integration)', async function() {
    var auth = freshRequire(AUTH_PATH);
    auth.setLogger({ info: function() {}, warn: function() {} });
    var pool = makeFakePool({});
    auth.setTenantAdminBootstrapPool(pool);
    var oauthAdapter = require(path.join(ROOT, 'src', 'web-ui', 'auth', 'oauth-adapter'));
    oauthAdapter.setGoogleUserInfoAdapter(async function() {
      return { sub: 'google-sub-tab-s1', email: 'tab-s1-google@example.com', accessToken: 'google-token-tab-s1' };
    });

    var req = mockAuthReq({ session: { oauthState: 'state-tab-s1-google' }, query: { code: 'code-xyz', state: 'state-tab-s1-google' } });
    var res = mockAuthRes();
    await auth.handleAuthGoogleCallback(req, res);

    assert.strictEqual(req.session.role, 'admin', 'expected the first-ever Google login to resolve to admin');
    var adminRow = pool._state().teamMemberships.find(function(r) { return r.role === 'admin'; });
    assert.ok(adminRow, 'expected a real team_memberships admin row confirmed via the fake pool state');
  });

  // ===========================================================================
  // AC1/AC4 -- emailSignupWiresIntoBootstrapForNewTenant (integration)
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
      statusCode: null, get headers() { return _headers; },
      writeHead: function(code, hdrs) { this.statusCode = code; if (hdrs) Object.assign(_headers, hdrs); },
      setHeader: function(name, value) { _headers[name] = value; },
      end: function(body) { this.body = (body != null ? String(body) : ''); this._ended = true; }
    };
  }
  var STUB_PASSWORD_ADAPTER = { hash: async function() { return 'stub-hash'; }, compare: async function() { return true; } };

  await test('emailSignupWiresIntoBootstrapForNewTenant (AC1/AC4 integration)', async function() {
    var password = freshRequire(path.join(ROOT, 'src', 'web-ui', 'modules', 'password'));
    password.setPasswordAdapter(STUB_PASSWORD_ADAPTER);
    var authEmail = freshRequire(AUTH_EMAIL_PATH);
    authEmail._clearRateLimits();

    var pool = makeFakePool({});
    authEmail.setTenantAdminBootstrapPool(pool);

    var db = {
      query: async function(sql) {
        if (/INSERT INTO users/i.test(sql)) return { rows: [{ id: 'uuid-tab-s1-1' }] };
        if (/SELECT.*FROM users WHERE email/i.test(sql)) return { rows: [] };
        return { rows: [] };
      }
    };
    authEmail.setUserDb(db);

    var req = mockEmailReq({ body: { email: 'tab-s1-newtenant@example.com', password: 'TestPassw0rd!xyz' } });
    var res = mockEmailRes();
    await authEmail.handleEmailSignup(req, res);

    assert.strictEqual(req.session.role, 'admin', 'expected the first-ever email signup to resolve to admin');
    var adminRow = pool._state().teamMemberships.find(function(r) { return r.role === 'admin'; });
    assert.ok(adminRow, 'expected a real team_memberships admin row confirmed via the fake pool state');
  });

  // ===========================================================================
  // Source-level guard -- server.js actually wires the new module (not just
  // the test file's own manual setTenantAdminBootstrapPool calls)
  // ===========================================================================
  await test('serverJsWiresTenantAdminBootstrapPool (wiring guard)', async function() {
    var fs = require('fs');
    var serverSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'server.js'), 'utf8');
    // Assert the actual CALL-SITE strings (with the real pool argument), not
    // just that the identifiers appear anywhere -- a bare require() line
    // alone would already satisfy a weaker substring check, without proving
    // any invocation actually happens (D37 rule #4 / CLAUDE.md: a wiring
    // test must assert an observable invocation, not just that a reference
    // exists -- see identity-links.js's own tir-s1 precedent for why this
    // class of weak test previously shipped a real production no-op).
    assert.ok(serverSrc.indexOf('migrateTenantAdminBootstrapSchema(_userRolesPool)') !== -1, 'expected server.js to actually call migrateTenantAdminBootstrapSchema(_userRolesPool) at startup, not just import it');
    assert.ok(serverSrc.indexOf('setTenantAdminBootstrapPool(_userRolesPool)') !== -1, 'expected server.js to actually call setTenantAdminBootstrapPool(_userRolesPool) for auth.js, not just import it');
    assert.ok(serverSrc.indexOf('setEmailTenantAdminBootstrapPool(_userRolesPool)') !== -1, 'expected server.js to actually call setEmailTenantAdminBootstrapPool(_userRolesPool) for auth-email.js, not just import it');
  });

  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }

  console.log('\n[tab-s1] Results so far: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);

})().catch(function(err) {
  console.error('[tab-s1] Unexpected error:', err);
  process.exit(1);
});
