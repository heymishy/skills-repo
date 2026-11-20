'use strict';

// check-rrf-s1-no-membership-gets-user-role.js -- rrf-s1
// (artefacts/2026-11-20-role-resolution-fallback/stories/rrf-s1-no-membership-gets-user-role.md)
//
// resolveRoleForPerson used to fall back to resolveRoleForTenant (SELECT role FROM team_memberships WHERE tenant_id = $1
// LIMIT 1, no ORDER BY) whenever a person had no membership in the tenant, so a person who signed in to a tenant that
// already had members was handed an arbitrary member's role, in practice often admin. Found by the failing E2E spec
// bri-s3.6 AC1. These tests use the in-memory database the test server itself uses and the real role and identity modules.
//
// Plain Node, no framework. Run: node tests/check-rrf-s1-no-membership-gets-user-role.js

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const USER_ROLES_PATH = path.join(ROOT, 'src', 'web-ui', 'modules', 'user-roles.js');
const { createFakeTestDb } = require(path.join(ROOT, 'src', 'web-ui', 'adapters', 'fake-test-db.js'));
const userRoles = require(USER_ROLES_PATH);
const identityLinks = require(path.join(ROOT, 'src', 'web-ui', 'modules', 'identity-links.js'));

const SHARED = 'e2e-shared-org';
const quietLog = { info: function () {}, warn: function () {} };

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log('  ok  ' + name);
  } catch (err) {
    failed++;
    console.log('  FAIL ' + name + '\n       ' + (err && err.message ? err.message : err));
  }
}

// Seed one member the way bri-s3.3's /test/seed-multi-user-roles does.
async function seedMember(db, identityKey, personId, tenantId, role) {
  await db.query('INSERT INTO person_identities (identity_key, person_id, provider) VALUES ($1, $2, $3)', [identityKey, personId, 'github']);
  await db.query('INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3)', [personId, tenantId, role]);
}

async function membershipRowCount(db) {
  const r = await db.query('SELECT person_id FROM team_memberships WHERE tenant_id = $1', [SHARED]);
  return r.rows.length;
}

(async function main() {
  console.log('\n[rrf-s1] a person with no membership in a tenant gets the lowest role');

  // T1 - AC1: a person created by the login path, with no membership, in a tenant whose only member is an admin.
  await test('T1 (AC1): known person with no membership in a tenant with an admin resolves to user, and no row is written', async function () {
    const db = createFakeTestDb();
    await seedMember(db, 'e2e-alice', 101, SHARED, 'admin');
    // The login path (routes/auth.js _bootstrapTenantAdmin) creates the person before role resolution; it adds no membership.
    const personId = await identityLinks.resolveOrCreatePersonForIdentity(db, 'brand-new-user', 'github', quietLog);
    assert.ok(personId != null && personId !== 101, 'a new person must exist and must not be alice');
    const before = await membershipRowCount(db);
    const role = await userRoles.resolveRoleForPerson(db, 'brand-new-user', SHARED, 'github');
    assert.strictEqual(role, 'user', 'a person with no membership must not inherit another member\'s role (got ' + role + ')');
    assert.strictEqual(await membershipRowCount(db), before, 'resolving a role must not write a membership row');
  });

  // T2 - AC2: three members each resolve to their own role, in two orders.
  await test('T2 (AC2): admin, engineer and viewer in one tenant each resolve to their own role, in either order', async function () {
    async function build(order) {
      const db = createFakeTestDb();
      const members = { 'e2e-alice': [101, 'admin'], 'e2e-bob': [102, 'engineer'], 'e2e-viewer': [103, 'viewer'] };
      for (const key of order) { await seedMember(db, key, members[key][0], SHARED, members[key][1]); }
      return { db, members };
    }
    for (const order of [['e2e-alice', 'e2e-bob', 'e2e-viewer'], ['e2e-viewer', 'e2e-bob', 'e2e-alice']]) {
      const built = await build(order);
      for (const key of Object.keys(built.members)) {
        const role = await userRoles.resolveRoleForPerson(built.db, key, SHARED, 'github');
        assert.strictEqual(role, built.members[key][1], key + ' must resolve to ' + built.members[key][1] + ' (order ' + order.join(',') + ', got ' + role + ')');
      }
    }
  });

  // T3 - AC3: an identity with no person row at all, in a tenant that has members.
  await test('T3 (AC3): an unknown identity in a tenant with members resolves to user and creates no person or identity row', async function () {
    const db = createFakeTestDb();
    await seedMember(db, 'e2e-alice', 101, SHARED, 'admin');
    const idsBefore = (await db.query('SELECT person_id FROM person_identities WHERE identity_key = $1', ['never-seen'])).rows.length;
    const role = await userRoles.resolveRoleForPerson(db, 'never-seen', SHARED, 'github');
    assert.strictEqual(role, 'user', 'an identity nobody knows must not inherit another member\'s role (got ' + role + ')');
    const idsAfter = (await db.query('SELECT person_id FROM person_identities WHERE identity_key = $1', ['never-seen'])).rows.length;
    assert.strictEqual(idsAfter, idsBefore, 'no identity row may be created');
  });

  // T4 - AC4: the first person in an empty tenant keeps admin; a second new person does not. The in-memory database does not
  // model the bootstrap's atomic claim statement (tab-s1 covers that module), so this writes the one membership row the
  // bootstrap writes for the first person and checks the role resolution on either side of it.
  await test('T4 (AC4): the first person in a new tenant (admin membership written by the bootstrap) resolves to admin; a second new person to user', async function () {
    const db = createFakeTestDb();
    const first = await identityLinks.resolveOrCreatePersonForIdentity(db, 'first-person', 'github', quietLog);
    await db.query('INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3)', [first, SHARED, 'admin']);
    assert.strictEqual(await userRoles.resolveRoleForPerson(db, 'first-person', SHARED, 'github'), 'admin', 'the first person resolves to admin');
    await identityLinks.resolveOrCreatePersonForIdentity(db, 'second-person', 'github', quietLog);
    assert.strictEqual(await userRoles.resolveRoleForPerson(db, 'second-person', SHARED, 'github'), 'user', 'the second person, with no membership, resolves to user');
  });

  // T5 - guard: resolveRoleForPerson must not call the tenant-wide lookup again.
  await test('T5 (guard): resolveRoleForPerson does not call resolveRoleForTenant (the arbitrary-row lookup)', function () {
    const src = fs.readFileSync(USER_ROLES_PATH, 'utf8').replace(/\r\n/g, '\n');
    const start = src.indexOf('async function resolveRoleForPerson(');
    assert.ok(start >= 0, 'resolveRoleForPerson must exist');
    const end = src.indexOf('\nmodule.exports', start);
    const body = src.slice(start, end > start ? end : undefined);
    const code = body.split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n');
    assert.ok(!/resolveRoleForTenant\s*\(/.test(code),
      'rrf-s1: resolveRoleForPerson must not fall back to resolveRoleForTenant, which returns an arbitrary member\'s role (SELECT role ... WHERE tenant_id = $1 LIMIT 1, no ORDER BY)');
  });

  console.log('\n[rrf-s1] ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
}()).catch(function (err) {
  console.error('[rrf-s1] unexpected error: ' + (err && err.stack ? err.stack : err));
  process.exit(1);
});
