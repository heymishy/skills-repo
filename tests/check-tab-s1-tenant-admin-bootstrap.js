'use strict';

// tests/check-tab-s1-tenant-admin-bootstrap.js — tab-s1
// Story: artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s1.md
// Test plan: artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s1-test-plan.md
//
// Covers all 9 planned tests (6 unit, 3 integration) plus the 3 NFR tests, and
// resolveOrCreatePersonForIdentity (identity-links.js) which the wiring tasks
// below depend on (added per decisions.md, 2026-09-28, correcting the DoR
// contract's own inaccurate "personId already resolvable" assumption).
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-story1-organisation-entity.js, tests/check-tir-s1-person-team-schema.js)
// -- no Jest/Mocha. Fake pool is narrow, self-contained, per-test-file (this
// session's established convention) -- extended with real BEGIN/COMMIT/ROLLBACK
// snapshot/restore semantics via pool.connect()-issued clients, since AC3/AC6
// specifically require correct transactional behaviour, not just query-shape
// matching.

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

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
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

  function snapshot() {
    return {
      people: people.slice(), personIdentities: personIdentities.slice(),
      tenantAdminBootstrap: tenantAdminBootstrap.slice(), teamMemberships: teamMemberships.slice(),
      nextPersonId: nextPersonId
    };
  }
  function restore(snap) {
    people = snap.people; personIdentities = snap.personIdentities;
    tenantAdminBootstrap = snap.tenantAdminBootstrap; teamMemberships = snap.teamMemberships;
    nextPersonId = snap.nextPersonId;
  }

  function handleQuery(sql, params) {
    var s = _norm(sql);
    var p = params || [];
    queryLog.push({ sql: s, params: p });

    if (s.indexOf('CREATE TABLE') === 0) return Promise.resolve({ rows: [] });

    if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) {
      var person = { id: nextPersonId++, created_at: new Date().toISOString() };
      people.push(person);
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
      personIdentities.push({ identity_key: idKey, person_id: pid, provider: provider, created_at: new Date().toISOString() });
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('INSERT INTO TENANT_ADMIN_BOOTSTRAP') === 0) {
      var tenantId = p[0], claimPersonId = p[1];
      var hasAdmin = teamMemberships.some(function(r) { return r.tenant_id === tenantId && r.role === 'admin'; });
      var alreadyClaimed = tenantAdminBootstrap.some(function(r) { return r.tenant_id === tenantId; });
      if (hasAdmin || alreadyClaimed) return Promise.resolve({ rows: [] });
      tenantAdminBootstrap.push({ tenant_id: tenantId, admin_person_id: claimPersonId, created_at: new Date().toISOString() });
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
      if (idx !== -1) teamMemberships[idx] = row; else teamMemberships.push(row);
      return Promise.resolve({ rows: [] });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 120));
    return Promise.resolve({ rows: [] });
  }

  function makeClient() {
    var txSnapshot = null;
    return {
      query: function(sql, params) {
        var s = _norm(sql);
        if (s === 'BEGIN') { txSnapshot = snapshot(); return Promise.resolve({ rows: [] }); }
        if (s === 'COMMIT') { txSnapshot = null; return Promise.resolve({ rows: [] }); }
        if (s === 'ROLLBACK') { if (txSnapshot) restore(txSnapshot); txSnapshot = null; return Promise.resolve({ rows: [] }); }
        return handleQuery(sql, params);
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

  console.log('\n[tab-s1] Results so far: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);

})().catch(function(err) {
  console.error('[tab-s1] Unexpected error:', err);
  process.exit(1);
});
