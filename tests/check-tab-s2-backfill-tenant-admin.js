'use strict';
const assert = require('assert');

function makeFakePool(rows) {
  const _rows = rows.map(r => ({ ...r }));
  const ops = [];
  return {
    ops,
    _rows,
    query: async function(sql, params) {
      ops.push({ sql, params: params || [] });
      const sqlL = sql.toLowerCase().replace(/\s+/g, ' ').trim();
      if (sqlL.startsWith('select distinct tenant_id from team_memberships')) {
        const admins = new Set(_rows.filter(r => r.role === 'admin').map(r => r.tenant_id));
        const candidates = [...new Set(_rows.map(r => r.tenant_id))].filter(t => !admins.has(t));
        candidates.sort();
        return { rows: candidates.map(t => ({ tenant_id: t })) };
      }
      if (sqlL.startsWith('select person_id, tenant_id, role, created_at from team_memberships where tenant_id')) {
        const tid = params[0];
        return { rows: _rows.filter(r => r.tenant_id === tid).map(r => ({ ...r })) };
      }
      if (sqlL.startsWith('update team_memberships set role')) {
        const [personId, tenantId, role] = params;
        const row = _rows.find(r => r.person_id === personId && r.tenant_id === tenantId);
        if (row) row.role = role;
        return { rowCount: row ? 1 : 0 };
      }
      // resolveRoleForPerson's own real queries (Task 7 integration test)
      if (sqlL.startsWith('select person_id from person_identities where identity_key')) {
        return { rows: [] }; // no explicit link seeded -- forces the team_memberships fallback below
      }
      if (sqlL.startsWith('select person_id from team_memberships where tenant_id')) {
        const tid = params[0];
        const row = _rows.find(r => r.tenant_id === tid);
        return { rows: row ? [{ person_id: row.person_id }] : [] };
      }
      if (sqlL.startsWith('select role from team_memberships where person_id') && sqlL.includes('tenant_id')) {
        const [personId, tenantId] = params;
        const row = _rows.find(r => r.person_id === personId && r.tenant_id === tenantId);
        return { rows: row ? [{ role: row.role }] : [] };
      }
      return { rows: [], rowCount: 0 };
    }
  };
}

function makeFakePoolWithErrors(rows, erroringTenants) {
  const pool = makeFakePool(rows);
  const realQuery = pool.query;
  pool.query = async function(sql, params) {
    const sqlL = sql.toLowerCase().replace(/\s+/g, ' ').trim();
    if (sqlL.startsWith('select person_id, tenant_id, role, created_at from team_memberships where tenant_id')) {
      if ((erroringTenants || []).includes(params[0])) {
        throw new Error('simulated processing error for ' + params[0]);
      }
    }
    return realQuery(sql, params);
  };
  return pool;
}

const noopLog = { info: function() {}, warn: function() {}, error: function() {} };
let passed = 0, failed = 0;
function pass(n) { console.log('  [PASS] ' + n); passed++; }
function fail(n, e) { console.error('  [FAIL] ' + n + ': ' + (e.message || e)); failed++; }

(async function() {
  const { runMigration } = require('../scripts/backfill-tenant-admin');

  // Task 1 -- AC1
  try {
    const pool = makeFakePool([
      { person_id: 3, tenant_id: 'tenant-a', role: 'user', created_at: '2026-01-03T00:00:00Z' },
      { person_id: 1, tenant_id: 'tenant-a', role: 'user', created_at: '2026-01-01T00:00:00Z' },
      { person_id: 2, tenant_id: 'tenant-a', role: 'user', created_at: '2026-01-02T00:00:00Z' }
    ]);
    await runMigration(pool, noopLog);
    const admin = pool._rows.find(r => r.tenant_id === 'tenant-a' && r.role === 'admin');
    assert(admin, 'no row promoted to admin for tenant-a');
    assert.strictEqual(admin.person_id, 1, 'expected the minimum-created_at row (person_id=1) to be promoted, got ' + admin.person_id);
    const others = pool._rows.filter(r => r.tenant_id === 'tenant-a' && r.person_id !== 1);
    others.forEach(r => assert.strictEqual(r.role, 'user', 'non-promoted row was modified'));
    pass('earliest member (min created_at) is promoted to admin (AC1)');
  } catch (e) { fail('earliest member (min created_at) is promoted to admin (AC1)', e); }

  // Task 2 -- AC3 (TR-03, TR-02)
  try {
    const pool = makeFakePool([
      { person_id: 10, tenant_id: 'tenant-b', role: 'admin', created_at: '2026-01-01T00:00:00Z' },
      { person_id: 11, tenant_id: 'tenant-b', role: 'user', created_at: '2026-01-02T00:00:00Z' }
    ]);
    const before = JSON.stringify(pool._rows);
    await runMigration(pool, noopLog);
    assert.strictEqual(JSON.stringify(pool._rows), before, 'already-admin tenant-b rows were modified');
    pass('a tenant that already has an admin is left completely untouched (AC3/TR-03)');
  } catch (e) { fail('a tenant that already has an admin is left completely untouched (AC3/TR-03)', e); }

  try {
    const pool = makeFakePool([
      { person_id: 20, tenant_id: 'tenant-a2', role: 'user', created_at: '2026-01-01T00:00:00Z' }
    ]); // tenant-c has ZERO rows -- never appears in _rows at all
    await runMigration(pool, noopLog);
    assert(!pool._rows.some(r => r.tenant_id === 'tenant-c'), 'a row was created for zero-member tenant-c');
    pass('a tenant with zero members gets no new row (AC3/TR-02)');
  } catch (e) { fail('a tenant with zero members gets no new row (AC3/TR-02)', e); }

  // Task 3 -- AC2 tie-break (TR-04)
  try {
    const warnings = [];
    const log = { info: function() {}, warn: function(m) { warnings.push(m); }, error: function() {} };
    const pool = makeFakePool([
      { person_id: 5, tenant_id: 'tenant-d', role: 'user', created_at: '2026-01-01T00:00:00Z' },
      { person_id: 2, tenant_id: 'tenant-d', role: 'user', created_at: '2026-01-01T00:00:00Z' } // exact tie
    ]);
    await runMigration(pool, log);
    const admin = pool._rows.find(r => r.tenant_id === 'tenant-d' && r.role === 'admin');
    assert.strictEqual(admin.person_id, 2, 'expected lowest person_id (2) to win the tie, got ' + admin.person_id);
    assert(warnings.some(w => /tie/i.test(w)), 'no WARNING logged for the tie case');
    pass('a tie on minimum created_at is broken deterministically by lowest person_id, logged as WARNING (AC2/TR-04)');
  } catch (e) { fail('a tie on minimum created_at is broken deterministically by lowest person_id, logged as WARNING (AC2/TR-04)', e); }

  // Task 4 -- AC4 idempotency
  try {
    const pool = makeFakePool([
      { person_id: 30, tenant_id: 'tenant-e', role: 'user', created_at: '2026-01-01T00:00:00Z' },
      { person_id: 31, tenant_id: 'tenant-e', role: 'user', created_at: '2026-01-02T00:00:00Z' }
    ]);
    const r1 = await runMigration(pool, noopLog);
    assert.strictEqual(r1.promoted, 1, 'first run should promote exactly 1 tenant');
    const afterRun1 = JSON.stringify(pool._rows);
    const r2 = await runMigration(pool, noopLog);
    assert.strictEqual(r2.promoted, 0, 'second run should promote 0 -- tenant-e already has an admin');
    assert.strictEqual(JSON.stringify(pool._rows), afterRun1, 'second run changed state -- not idempotent');
    pass('running the migration twice makes zero further changes (AC4)');
  } catch (e) { fail('running the migration twice makes zero further changes (AC4)', e); }

  // Task 5 -- error handling
  try {
    const rows = [];
    for (let i = 1; i <= 15; i++) rows.push({ person_id: i, tenant_id: 'tenant-ok-' + String(i).padStart(2, '0'), role: 'user', created_at: '2026-01-01T00:00:00Z' });
    rows.push({ person_id: 100, tenant_id: 'tenant-zz-bad', role: 'user', created_at: '2026-01-01T00:00:00Z' });
    // Candidate order is alphabetical (sorted in makeFakePool): tenant-ok-01..15 come before
    // tenant-zz-bad, so 15 valid tenants are processed before the 1 error -- cumulative rate
    // never exceeds 10% (max 1/16 = 6.25%).
    const pool = makeFakePoolWithErrors(rows, ['tenant-zz-bad']);
    const result = await runMigration(pool, noopLog);
    assert.strictEqual(result.processed, 16, 'expected all 16 tenants attempted, got ' + result.processed);
    assert.strictEqual(result.promoted, 15, 'expected 15 successful promotions, got ' + result.promoted);
    assert.strictEqual(result.errors, 1, 'expected exactly 1 error, got ' + result.errors);
    assert.strictEqual(result.stopped, false, 'migration should NOT have stopped -- 1/16 is below the 10% threshold');
    pass('a single error among many tenants does not abort the batch');
  } catch (e) { fail('a single error among many tenants does not abort the batch', e); }

  try {
    const rows = [
      { person_id: 1, tenant_id: 'tenant-1-ok', role: 'user', created_at: '2026-01-01T00:00:00Z' },
      { person_id: 2, tenant_id: 'tenant-2-bad', role: 'user', created_at: '2026-01-01T00:00:00Z' },
      { person_id: 3, tenant_id: 'tenant-3-bad', role: 'user', created_at: '2026-01-01T00:00:00Z' },
      { person_id: 4, tenant_id: 'tenant-4-bad', role: 'user', created_at: '2026-01-01T00:00:00Z' },
      { person_id: 5, tenant_id: 'tenant-5-bad', role: 'user', created_at: '2026-01-01T00:00:00Z' }
    ];
    // Alphabetical candidate order: tenant-1-ok, tenant-2-bad, tenant-3-bad, tenant-4-bad, tenant-5-bad.
    // After tenant-2-bad: 1 error / 2 processed = 50% > 10% -- stops immediately, 3/4/5 never attempted.
    const pool = makeFakePoolWithErrors(rows, ['tenant-2-bad', 'tenant-3-bad', 'tenant-4-bad', 'tenant-5-bad']);
    const alerts = [];
    const log = { info: function() {}, warn: function() {}, error: function(m) { alerts.push(m); } };
    const result = await runMigration(pool, log);
    assert.strictEqual(result.stopped, true, 'migration should have stopped -- error rate exceeded 10%');
    assert(result.processed < 5, 'expected fewer than all 5 tenants attempted (STOP gate should short-circuit), got ' + result.processed);
    assert(alerts.some(a => /ALERT/i.test(a) && /threshold/i.test(a)), 'no ALERT/threshold message logged');
    pass('an error rate above 10% triggers the STOP gate');
  } catch (e) { fail('an error rate above 10% triggers the STOP gate', e); }

  // Task 6 -- audit logging
  try {
    const infos = [];
    const log = { info: function(m) { infos.push(m); }, warn: function() {}, error: function() {} };
    const pool = makeFakePool([
      { person_id: 40, tenant_id: 'tenant-audit', role: 'contributor', created_at: '2026-01-01T00:00:00Z' }
    ]);
    await runMigration(pool, log);
    const logged = infos.some(m => /tenant-audit/.test(m) && /person=40/.test(m) && /previousRole=contributor/.test(m));
    assert(logged, 'no log entry found with tenantId, personId, and pre-migration role');
    pass('pre-migration role is logged before each overwrite, enabling rollback');
  } catch (e) { fail('pre-migration role is logged before each overwrite, enabling rollback', e); }

  // Task 7 -- integration with the real, unmodified resolveRoleForPerson
  try {
    const { resolveRoleForPerson } = require('../src/web-ui/modules/user-roles');
    const pool = makeFakePool([
      { person_id: 50, tenant_id: 'tenant-integ', role: 'user', created_at: '2026-01-01T00:00:00Z' }
    ]);
    await runMigration(pool, noopLog);
    // identityKey === tenantId deliberately: resolvePersonForIdentity's own real fallback path
    // (no person_identities row exists) resolves personId via `team_memberships WHERE tenant_id = $1`,
    // matching this exact real query shape rather than a guessed one.
    const role = await resolveRoleForPerson(pool, 'tenant-integ', 'tenant-integ');
    assert.strictEqual(role, 'admin', 'resolveRoleForPerson did not resolve the backfilled admin correctly, got ' + role);
    pass('backfilled admin resolves correctly via the real resolveRoleForPerson function afterward');
  } catch (e) { fail('backfilled admin resolves correctly via the real resolveRoleForPerson function afterward', e); }

  // Task 8 -- NFR performance
  try {
    const rows = [];
    for (let i = 1; i <= 100; i++) rows.push({ person_id: i, tenant_id: 'tenant-perf-' + i, role: 'user', created_at: '2026-01-01T00:00:00Z' });
    const pool = makeFakePool(rows);
    const start = Date.now();
    const result = await runMigration(pool, noopLog);
    const elapsedMs = Date.now() - start;
    assert.strictEqual(result.promoted, 100, 'expected all 100 tenants promoted');
    assert(elapsedMs < 10000, 'expected under 10s for 100 tenants, took ' + elapsedMs + 'ms');
    pass('migration completes in well under 1 minute at realistic scale (100-tenant proxy, NFR-perf)');
  } catch (e) { fail('migration completes in well under 1 minute at realistic scale (100-tenant proxy, NFR-perf)', e); }

  console.log('\n[tab-s2] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
