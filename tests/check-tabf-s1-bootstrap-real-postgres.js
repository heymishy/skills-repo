'use strict';
// tabf-s1 -- the tenant-admin bootstrap claim statement must run on a real Postgres.
// Plain Node script. Run: node tests/check-tabf-s1-bootstrap-real-postgres.js
//
// Why this exists: tab-s1's tests use a pool double, so they never prepared the claim statement against a real
// database. On a real Postgres the old statement fails every time with "inconsistent types deduced for parameter $1"
// (found by the first real production error, GitHub issue #1101, 2026-11-15). The real-database tests (P1 to P6) need
//   TAB_TEST_DATABASE_URL=postgres://postgres:test@127.0.0.1:25432/postgres   (a THROWAWAY local Postgres)
// and print SKIPPED without it: a SKIPPED line is not a pass. U1 always runs.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_URL = process.env.TAB_TEST_DATABASE_URL;
const SRC = path.join(__dirname, '..', 'src', 'web-ui', 'modules', 'tenant-admin-bootstrap.js');
const bootstrap = require('../src/web-ui/modules/tenant-admin-bootstrap');
const { migrateTeamSchema } = require('../src/web-ui/modules/user-roles');
const quiet = { info() {} };

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function dbTest(name, fn) { tests.push(DB_URL ? { name, fn } : { name, skip: true }); }
const tenant = () => 'tabf-' + crypto.randomBytes(5).toString('hex');

// The claim statement exactly as it was before this story (from tenant-admin-bootstrap.js at commit 1ae1a492c).
const OLD_CLAIM_SQL = 'INSERT INTO tenant_admin_bootstrap (tenant_id, admin_person_id) ' +
  'SELECT $1, $2 WHERE NOT EXISTS (' +
  '  SELECT 1 FROM team_memberships WHERE tenant_id = $1 AND role = \'admin\'' +
  ') ON CONFLICT (tenant_id) DO NOTHING RETURNING admin_person_id';

// True only for a parseable URL whose host is 127.0.0.1, localhost or ::1 (a throwaway local container).
function isLocalDbUrl(url) {
  let u;
  try { u = new URL(url); } catch (e) { return false; }
  return ['127.0.0.1', 'localhost', '[::1]', '::1'].indexOf(u.hostname) !== -1;
}
let _Pool = null;
async function freshDb() {
  if (!isLocalDbUrl(DB_URL)) {
    throw new Error('refusing to DROP TABLE on a non-local database: TAB_TEST_DATABASE_URL must be a throwaway local Postgres');
  }
  if (!_Pool) _Pool = require('pg').Pool;
  const pool = new _Pool({ connectionString: DB_URL });
  await pool.query('DROP TABLE IF EXISTS tenant_admin_bootstrap, team_memberships, people CASCADE');
  await migrateTeamSchema(pool, quiet);
  await bootstrap.migrateTenantAdminBootstrapSchema(pool);
  return pool;
}
async function newPerson(pool) { return (await pool.query('INSERT INTO people DEFAULT VALUES RETURNING id')).rows[0].id; }
const rows = async (pool, sql, params) => (await pool.query(sql, params)).rows;
async function withDb(fn) { const pool = await freshDb(); try { await fn(pool); } finally { await pool.end(); } }

test('U1 the claim statement carries explicit parameter casts and keeps its single race-safe shape', () => {
  const src = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
  assert.ok(/SELECT \$1::varchar, \$2::integer WHERE NOT EXISTS/.test(src), 'the select list must cast both parameters');
  assert.ok(/tenant_id = \$1::varchar AND role = /.test(src), 'the subquery comparison must cast $1 too');
  assert.ok(src.indexOf('ON CONFLICT (tenant_id) DO NOTHING RETURNING admin_person_id') !== -1, 'still one statement with ON CONFLICT DO NOTHING RETURNING');
});

dbTest('P1 a real database rejects the old statement with "inconsistent types deduced for parameter $1"', () => withDb(async (pool) => {
  const person = await newPerson(pool);
  await assert.rejects(() => pool.query(OLD_CLAIM_SQL, [tenant(), person]), (err) => {
    assert.ok(/inconsistent types deduced for parameter \$1/.test(err.message), 'unexpected message: ' + err.message);
    return true;
  });
}));

dbTest('P2 a fresh tenant gets its first user as admin, with both rows written', () => withDb(async (pool) => {
  const t = tenant(); const person = await newPerson(pool);
  const res = await bootstrap.bootstrapTenantAdminIfNeeded(pool, t, person, quiet);
  assert.deepStrictEqual(res, { granted: true });
  const claim = await rows(pool, 'SELECT admin_person_id FROM tenant_admin_bootstrap WHERE tenant_id = $1', [t]);
  assert.strictEqual(claim.length, 1); assert.strictEqual(claim[0].admin_person_id, person);
  const member = await rows(pool, 'SELECT role FROM team_memberships WHERE tenant_id = $1 AND person_id = $2', [t, person]);
  assert.strictEqual(member.length, 1); assert.strictEqual(member[0].role, 'admin');
}));

dbTest('P3 a second login for the same or another person is a no-op', () => withDb(async (pool) => {
  const t = tenant(); const a = await newPerson(pool); const b = await newPerson(pool);
  assert.deepStrictEqual(await bootstrap.bootstrapTenantAdminIfNeeded(pool, t, a, quiet), { granted: true });
  assert.deepStrictEqual(await bootstrap.bootstrapTenantAdminIfNeeded(pool, t, a, quiet), { granted: false });
  assert.deepStrictEqual(await bootstrap.bootstrapTenantAdminIfNeeded(pool, t, b, quiet), { granted: false });
  assert.strictEqual((await rows(pool, 'SELECT 1 FROM tenant_admin_bootstrap WHERE tenant_id = $1', [t])).length, 1);
  assert.strictEqual((await rows(pool, 'SELECT 1 FROM team_memberships WHERE tenant_id = $1 AND person_id = $2', [t, b])).length, 0);
}));

dbTest('P4 a tenant that already has an admin is never overridden and gets no bootstrap row', () => withDb(async (pool) => {
  const t = tenant(); const existing = await newPerson(pool); const newcomer = await newPerson(pool);
  await pool.query('INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3)', [existing, t, 'admin']);
  assert.deepStrictEqual(await bootstrap.bootstrapTenantAdminIfNeeded(pool, t, newcomer, quiet), { granted: false });
  assert.strictEqual((await rows(pool, 'SELECT 1 FROM tenant_admin_bootstrap WHERE tenant_id = $1', [t])).length, 0);
  assert.strictEqual((await rows(pool, 'SELECT 1 FROM team_memberships WHERE tenant_id = $1 AND person_id = $2', [t, newcomer])).length, 0);
}));

dbTest('P5 bootstrapping one tenant does not touch another', () => withDb(async (pool) => {
  const a = tenant(); const b = tenant(); const pa = await newPerson(pool); const pb = await newPerson(pool);
  assert.deepStrictEqual(await bootstrap.bootstrapTenantAdminIfNeeded(pool, a, pa, quiet), { granted: true });
  assert.strictEqual((await rows(pool, 'SELECT 1 FROM tenant_admin_bootstrap WHERE tenant_id = $1', [b])).length, 0);
  assert.strictEqual((await rows(pool, 'SELECT 1 FROM team_memberships WHERE tenant_id = $1', [b])).length, 0);
  assert.deepStrictEqual(await bootstrap.bootstrapTenantAdminIfNeeded(pool, b, pb, quiet), { granted: true });
}));

dbTest('P6 two first logins at the same moment produce exactly one admin', () => withDb(async (pool) => {
  const t = tenant(); const a = await newPerson(pool); const b = await newPerson(pool);
  const results = await Promise.all([
    bootstrap.bootstrapTenantAdminIfNeeded(pool, t, a, quiet),
    bootstrap.bootstrapTenantAdminIfNeeded(pool, t, b, quiet)
  ]);
  assert.strictEqual(results.filter((r) => r.granted).length, 1, JSON.stringify(results));
  assert.strictEqual((await rows(pool, 'SELECT 1 FROM tenant_admin_bootstrap WHERE tenant_id = $1', [t])).length, 1);
  assert.strictEqual((await rows(pool, "SELECT 1 FROM team_memberships WHERE tenant_id = $1 AND role = 'admin'", [t])).length, 1);
}));

(async () => {
  let passed = 0, failed = 0, skipped = 0;
  for (const t of tests) {
    if (t.skip) { skipped++; console.log('  SKIPPED ' + t.name + ' (set TAB_TEST_DATABASE_URL to a throwaway local Postgres; a skip is not a pass)'); continue; }
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[tabf-s1-bootstrap-real-postgres] Results: ' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped');
  process.exit(failed ? 1 : 0);
})();
