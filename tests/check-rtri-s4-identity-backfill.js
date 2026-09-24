#!/usr/bin/env node
// check-rtri-s4-identity-backfill.js — rtri-s4
// Verifies the person_identities login-time backfill: backfillIdentityIfNeeded
// (src/web-ui/modules/identity-links.js) and the resolveRoleForPerson/
// getRoleForTenant extension (src/web-ui/modules/user-roles.js). Follows
// this repo's hand-rolled test()/assert style.
//
// AC1 (core, this task): backfillIdentityIfNeeded writes a real row --
//      remaining call-shape coverage (all 4 real login sites) added in
//      Task 2/3 of this story's implementation plan
// AC3 (this task): idempotent -- no duplicate row, no error on repeat login
// Audit NFR (this task): logs identity_backfilled without the raw identity
//
// Added by later tasks in this same story (not yet present in this file):
// AC2: backfilled identity becomes visible in listTeamMembers (rtri-s1)
// AC4: unknown identity never backfilled
// AC5: existing 3 write sites unaffected (regression, via /verify-completion)

'use strict';

var assert = require('assert');
var path = require('path');

var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  [PASS]', name); })
    .catch(function(err) {
      failed++;
      failures.push({ name: name, err: err });
      console.log('  [FAIL]', name, '--', (err && err.message) || err);
    });
}

var IDENTITY_LINKS_PATH = path.resolve(ROOT, 'src/web-ui/modules/identity-links.js');
var USER_ROLES_PATH = path.resolve(ROOT, 'src/web-ui/modules/user-roles.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

// ── Narrow, self-contained in-memory fake pool ──────────────────────────────
// Mirrors rtri-s1's own makeFakePool convention exactly, extended with
// people + a resolvable-only-via-fallback seed helper.
function makeFakePool() {
  var people = []; // { id }
  var teamMemberships = []; // { person_id, tenant_id, role }
  var personIdentities = []; // { identity_key, person_id, provider }
  var nextPersonId = 1;

  function _norm(sql) {
    return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
  }

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var match = personIdentities.filter(function(r) { return r.identity_key === p[0]; });
      return Promise.resolve({ rows: match.length ? [{ person_id: match[0].person_id }] : [] });
    }

    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tm = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; });
      return Promise.resolve({ rows: tm.length ? [{ person_id: tm[0].person_id }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE PERSON_ID') === 0) {
      var tm = teamMemberships.filter(function(r) { return r.person_id === p[0] && r.tenant_id === p[1]; });
      return Promise.resolve({ rows: tm.length ? [{ role: tm[0].role }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tm = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; });
      return Promise.resolve({ rows: tm.length ? [{ role: tm[0].role }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM USER_ROLES WHERE TENANT_ID') === 0) {
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('INSERT INTO PERSON_IDENTITIES') === 0) {
      personIdentities.push({ identity_key: p[0], person_id: p[1], provider: p[2] });
      return Promise.resolve({ rows: [] });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 160));
    return Promise.resolve({ rows: [] });
  }

  // Test-setup helper — seeds a person resolvable ONLY via the
  // team_memberships.tenant_id fallback (no explicit person_identities row)
  // -- exactly reproducing the live-verified wuce-staging gap.
  function _seedFallbackResolvable(tenantId, role) {
    var person = { id: nextPersonId++ };
    people.push(person);
    teamMemberships.push({ person_id: person.id, tenant_id: tenantId, role: role || 'engineer' });
    return person.id;
  }

  return {
    query: query,
    _seedFallbackResolvable: _seedFallbackResolvable,
    _state: function() { return { people: people, teamMemberships: teamMemberships, personIdentities: personIdentities }; }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 (core) — backfillIdentityIfNeeded writes a real row when none exists
// ─────────────────────────────────────────────────────────────────────────────

async function testBackfillWritesRowWhenNoneExists() {
  var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
  var pool = makeFakePool();
  var personId = pool._seedFallbackResolvable('acme');

  var result = await identityLinks.backfillIdentityIfNeeded(pool, 'acme', personId, 'github');

  assert.strictEqual(result.backfilled, true, 'AC1: backfill reports it wrote a new row');
  var state = pool._state();
  assert.strictEqual(state.personIdentities.length, 1, 'AC1: exactly one person_identities row now exists');
  assert.strictEqual(state.personIdentities[0].identity_key, 'acme', 'AC1: row has the real identity_key');
  assert.strictEqual(state.personIdentities[0].person_id, personId, 'AC1: row links to the real person_id');
  assert.strictEqual(state.personIdentities[0].provider, 'github', 'AC1: row has the real provider');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — idempotent, no duplicate row on repeat call
// ─────────────────────────────────────────────────────────────────────────────

async function testBackfillIsIdempotent() {
  var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
  var pool = makeFakePool();
  var personId = pool._seedFallbackResolvable('acme');

  await identityLinks.backfillIdentityIfNeeded(pool, 'acme', personId, 'github');
  var result2 = await identityLinks.backfillIdentityIfNeeded(pool, 'acme', personId, 'github');

  assert.strictEqual(result2.backfilled, false, 'AC3: second call reports no new write');
  var state = pool._state();
  assert.strictEqual(state.personIdentities.length, 1, 'AC3: still exactly one row -- no duplicate');
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit NFR — logs identity_backfilled, never the raw identity string
// ─────────────────────────────────────────────────────────────────────────────

async function testBackfillAuditLogsWithoutRawIdentity() {
  var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
  var pool = makeFakePool();
  var personId = pool._seedFallbackResolvable('acme');
  var calls = [];
  var spyLogger = { info: function(event, data) { calls.push({ event: event, data: data }); }, warn: function() {} };

  await identityLinks.backfillIdentityIfNeeded(pool, 'alice@example.com', personId, 'email', spyLogger);

  var event = calls.filter(function(c) { return c.event === 'identity_backfilled'; })[0];
  assert.ok(event, 'Audit: an identity_backfilled event was logged');
  assert.strictEqual(event.data.personId, personId, 'Audit: log includes the real person id');
  assert.strictEqual(event.data.provider, 'email', 'Audit: log includes the real provider');
  assert.ok(event.data.timestamp, 'Audit: log includes a timestamp');
  assert.ok(/^[0-9a-f]{64}$/.test(event.data.identityHash), 'Audit: log includes a SHA-256 hex hash of the identity');
  assert.ok(JSON.stringify(event.data).indexOf('alice@example.com') === -1, 'Audit: raw identity string never appears in the logged data');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 (github call shape) — resolveRoleForPerson backfills when provider is given
// ─────────────────────────────────────────────────────────────────────────────

async function testResolveRoleForPersonBackfillsGithubShape() {
  var userRoles = freshRequire(USER_ROLES_PATH);
  var pool = makeFakePool();
  pool._seedFallbackResolvable('acme');

  // mirrors auth.js's real GitHub call shape: identityKey and tenantId both
  // resolve to the same string for a solo/personal tenant
  await userRoles.resolveRoleForPerson(pool, 'acme', 'acme', 'github');

  var state = pool._state();
  assert.strictEqual(state.personIdentities.length, 1, 'AC1 (github): a person_identities row was backfilled');
  assert.strictEqual(state.personIdentities[0].provider, 'github', 'AC1 (github): the real provider was recorded');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — a genuinely unknown identity is never backfilled
// ─────────────────────────────────────────────────────────────────────────────

async function testUnknownIdentityNeverBackfilled() {
  var userRoles = freshRequire(USER_ROLES_PATH);
  var pool = makeFakePool();
  // no people/team_memberships/person_identities row for 'nobody' at all

  await userRoles.resolveRoleForPerson(pool, 'nobody', 'nobody', 'email');

  var state = pool._state();
  assert.strictEqual(state.personIdentities.length, 0, 'AC4: no person_identities row is created for a genuinely unknown identity');
  assert.strictEqual(state.people.length, 0, 'AC4: no new person row is created either');
}

// ─────────────────────────────────────────────────────────────────────────────
// Backward compatibility — omitted provider preserves exact prior behaviour
// ─────────────────────────────────────────────────────────────────────────────

async function testOmittedProviderSkipsBackfill() {
  var userRoles = freshRequire(USER_ROLES_PATH);
  var pool = makeFakePool();
  pool._seedFallbackResolvable('acme', 'admin');

  var role = await userRoles.resolveRoleForPerson(pool, 'acme', 'acme');

  assert.strictEqual(role, 'admin', 'Backward-compat: role resolution still works exactly as before');
  var state = pool._state();
  assert.strictEqual(state.personIdentities.length, 0, 'Backward-compat: omitting provider correctly skips the backfill, not errors or backfills with a garbage value');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner (extended by later tasks)
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[rtri-s4] Running AC verification tests...\n');

  console.log('AC1 (core) — backfillIdentityIfNeeded writes a real row');
  await test('AC1: backfillIdentityIfNeeded writes a real person_identities row when none exists', testBackfillWritesRowWhenNoneExists);

  console.log('\nAC3 — idempotent');
  await test('AC3: backfillIdentityIfNeeded is idempotent, no duplicate row on repeat call', testBackfillIsIdempotent);

  console.log('\nAudit NFR — logs without raw identity');
  await test('Audit: backfillIdentityIfNeeded logs identity_backfilled without ever logging the raw identity string', testBackfillAuditLogsWithoutRawIdentity);

  console.log('\nAC1 (github shape) — resolveRoleForPerson backfills');
  await test('AC1: resolveRoleForPerson backfills a real row for the GitHub OAuth call shape', testResolveRoleForPersonBackfillsGithubShape);

  console.log('\nAC4 — unknown identity never backfilled');
  await test('AC4: a genuinely unknown identity is never backfilled', testUnknownIdentityNeverBackfilled);

  console.log('\nBackward compatibility — omitted provider');
  await test('Backward-compat: omitting the new provider argument preserves exact prior behaviour', testOmittedProviderSkipsBackfill);

  console.log('\n[rtri-s4] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[rtri-s4] Unexpected error:', err);
  process.exit(1);
});
