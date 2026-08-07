'use strict';
// check-alrf-s11-purge-e2e-tenants.js -- alrf-s11: purge every e2e-test-
// tagged tenant. Operator-requested: "hundreds of e2e-test and UAT-based
// tenants that are still persistent" were noticed via /admin/credits; this
// stops the leak (auto-cleanup, wired into CI separately) and provides the
// reusable purge logic for a one-off retroactive cleanup.

var assert = require('assert');
var path   = require('path');
var { execFileSync } = require('child_process');

var SCRIPT_PATH = path.resolve(__dirname, '../scripts/purge-e2e-tenants.js');

function freshRequire() {
  try { delete require.cache[require.resolve(SCRIPT_PATH)]; } catch (_) {}
  return require(SCRIPT_PATH);
}

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

/**
 * A minimal fake db that stores rows per table in-memory and supports just
 * enough SQL pattern matching (via regex on the literal query strings this
 * script actually issues) to prove the real behaviour without a real
 * Postgres connection.
 */
function makeFakeDb(seedRows) {
  var tables = JSON.parse(JSON.stringify(seedRows));
  var queryLog = [];
  return {
    _tables: tables,
    _queryLog: queryLog,
    query: async function(sql, params) {
      queryLog.push({ sql: sql, params: params });
      var likeMatch = /FROM (\w+) WHERE (\w+) LIKE 'e2e-test-%'/.exec(sql);
      if (likeMatch) {
        var table = likeMatch[1];
        var col = likeMatch[2];
        var rows = (tables[table] || []).filter(function(r) { return String(r[col] || '').indexOf('e2e-test-') === 0; });
        return { rows: rows.map(function(r) { return { id: r[col] }; }) };
      }
      var deleteMatch = /DELETE FROM (\w+) WHERE (\w+) = \$1( OR (\w+) = \$1)?/.exec(sql);
      if (deleteMatch) {
        var dTable = deleteMatch[1];
        var dCol = deleteMatch[2];
        var dCol2 = deleteMatch[4];
        var tenantId = params[0];
        var before = (tables[dTable] || []).length;
        tables[dTable] = (tables[dTable] || []).filter(function(r) {
          var matches = r[dCol] === tenantId || (dCol2 && r[dCol2] === tenantId);
          return !matches;
        });
        return { rowCount: before - tables[dTable].length };
      }
      var journeyArtefactMatch = /DELETE FROM artefacts WHERE journey_id IN \(SELECT journey_id FROM journeys WHERE tenant_id = \$1\)/.exec(sql);
      if (journeyArtefactMatch) {
        var jTenantId = params[0];
        var journeyIds = (tables.journeys || []).filter(function(j) { return j.tenant_id === jTenantId; }).map(function(j) { return j.journey_id; });
        tables.artefacts = (tables.artefacts || []).filter(function(a) { return journeyIds.indexOf(a.journey_id) === -1; });
        return { rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    }
  };
}

async function main() {
  // -- AC1: finds e2e-test- tagged tenants across all four source tables, de-duplicated
  console.log('\n[alrf-s11] AC1 -- findE2eTenantIds finds tenants across credits/journeys/team_memberships/users');
  {
    var mod = freshRequire();
    var db = makeFakeDb({
      credits: [{ tenant_id: 'e2e-test-gh-111' }, { tenant_id: 'tenant-demo-1' }],
      journeys: [{ tenant_id: 'e2e-test-abc-222', journey_id: 'j1' }],
      team_memberships: [{ tenant_id: 'e2e-test-gh-111' }], // duplicate of credits row -- must de-dup
      users: [{ email: 'e2e-test-xyz-333@example.test' }]
    });
    await test('AC1: finds exactly 3 distinct e2e-test- tenant ids, real tenants excluded', async function() {
      var ids = await mod.findE2eTenantIds(db);
      assert.strictEqual(ids.length, 3, 'expected 3 distinct ids, got ' + JSON.stringify(ids));
      assert.ok(ids.indexOf('tenant-demo-1') === -1, 'a real seeded tenant must never be matched');
    });
  }

  // -- AC2: purgeTenant deletes rows across every relevant table for one tenant
  console.log('\n[alrf-s11] AC2 -- purgeTenant removes a tenant\'s rows from every relevant table');
  {
    var mod = freshRequire();
    var db = makeFakeDb({
      credits: [{ tenant_id: 'e2e-test-gh-111' }, { tenant_id: 'tenant-demo-1' }],
      journeys: [{ tenant_id: 'e2e-test-gh-111', journey_id: 'j1' }],
      artefacts: [{ journey_id: 'j1', skill_name: 'discovery' }],
      team_memberships: [{ tenant_id: 'e2e-test-gh-111' }],
      users: [{ email: 'e2e-test-gh-111' }]
    });
    await test('AC2a: purgeTenant removes the credits row for the target tenant only', async function() {
      await mod.purgeTenant(db, 'e2e-test-gh-111');
      assert.strictEqual(db._tables.credits.length, 1);
      assert.strictEqual(db._tables.credits[0].tenant_id, 'tenant-demo-1', 'the OTHER tenant must survive');
    });
    await test('AC2b: journeys row removed', function() {
      assert.strictEqual(db._tables.journeys.length, 0);
    });
    await test('AC2c: that journey\'s artefacts removed too', function() {
      assert.strictEqual(db._tables.artefacts.length, 0);
    });
    await test('AC2d: team_memberships row removed', function() {
      assert.strictEqual(db._tables.team_memberships.length, 0);
    });
    await test('AC2e: users row removed', function() {
      assert.strictEqual(db._tables.users.length, 0);
    });
  }

  // -- AC3: purgeE2eTenants is the end-to-end find+purge, and is idempotent
  console.log('\n[alrf-s11] AC3 -- purgeE2eTenants finds and purges everything, then finds nothing on a second run');
  {
    var mod = freshRequire();
    var db = makeFakeDb({
      credits: [{ tenant_id: 'e2e-test-a' }, { tenant_id: 'e2e-test-b' }, { tenant_id: 'tenant-demo-1' }]
    });
    await test('AC3a: first run purges both e2e tenants', async function() {
      var summary = await mod.purgeE2eTenants(db);
      assert.strictEqual(summary.tenantCount, 2);
      assert.strictEqual(db._tables.credits.length, 1);
    });
    await test('AC3b: second run finds nothing left to purge (idempotent)', async function() {
      var summary = await mod.purgeE2eTenants(db);
      assert.strictEqual(summary.tenantCount, 0);
    });
  }

  // -- AC4: a missing table (query throws) does not abort the whole purge
  console.log('\n[alrf-s11] AC4 -- a missing/failing table does not abort the rest of the purge');
  {
    var mod = freshRequire();
    var db = {
      query: async function(sql) {
        if (sql.indexOf('tenant_plan') !== -1) { throw new Error('relation "tenant_plan" does not exist'); }
        return { rows: [], rowCount: 0 };
      }
    };
    await test('AC4: purgeTenant does not throw even when one DELETE fails', async function() {
      await mod.purgeTenant(db, 'e2e-test-anything'); // must not throw
    });
  }

  // -- CLI --dry-run flag: read-only preview, never deletes -- added for the
  //    operator's manual one-off retroactive purge (a real terminal command
  //    they run themselves against staging), so they can see what WOULD be
  //    deleted before running the real purge.
  console.log('\n[alrf-s11] CLI --dry-run flag -- read-only preview, never deletes');
  {
    await test('--dry-run: exits 0 and prints "[dry-run]" (not "Purged") against an unreachable DB', function() {
      var out = execFileSync(process.execPath, [SCRIPT_PATH, '--dry-run'], {
        env: Object.assign({}, process.env, { DATABASE_URL: 'postgres://baduser:badpass@127.0.0.1:1/nonexistent' }),
        timeout: 15000,
        encoding: 'utf8'
      });
      assert.ok(out.indexOf('[dry-run]') !== -1, 'expected "[dry-run]" in output, got: ' + out);
      assert.ok(out.indexOf('Purged ') === -1, 'dry-run must never print the real-purge "Purged" message, got: ' + out);
    });

    await test('without --dry-run: still runs the real purge path ("Purged", not "[dry-run]")', function() {
      var out = execFileSync(process.execPath, [SCRIPT_PATH], {
        env: Object.assign({}, process.env, { DATABASE_URL: 'postgres://baduser:badpass@127.0.0.1:1/nonexistent' }),
        timeout: 15000,
        encoding: 'utf8'
      });
      assert.ok(out.indexOf('Purged ') !== -1, 'expected the real-purge "Purged" message, got: ' + out);
      assert.ok(out.indexOf('[dry-run]') === -1, 'non-dry-run must never print "[dry-run]", got: ' + out);
    });
  }

  console.log('\n--- alrf-s11 Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log(' -', f.name, '--', f.err && f.err.message || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
