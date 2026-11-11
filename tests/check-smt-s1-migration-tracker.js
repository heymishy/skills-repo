'use strict';

// tests/check-smt-s1-migration-tracker.js -- smt-s1
// Story: artefacts/2026-11-11-schema-migration-tracking/stories/smt-s1-schema-migration-tracking-table.md
// Test plan: artefacts/2026-11-11-schema-migration-tracking/test-plans/smt-s1-test-plan.md
//
// Written before implementation exists -- src/web-ui/modules/migration-tracker.js
// does not exist yet, so every test below fails right now (module not found).
// The coding agent implements that module (and the 16 server.js call-site
// wrappers IT1/IT2 check for) to turn this file green.

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS] ' + name);
  } catch (err) {
    failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err));
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    passed++; console.log('  [PASS] ' + name);
  } catch (err) {
    failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err));
  }
}

// Established repo convention (see tests/check-ep1-s1-pod-creation.js's
// makeFakePool): an in-memory fake Pool simulating query(sql, params) by
// pattern-matching the uppercased, whitespace-normalized SQL string.
function makeFakePool() {
  var migrations = []; // { name, applied_at }
  var ddlCallCount = 0;
  var queryCallCount = 0;
  return {
    migrations: migrations,
    getDdlCallCount: function() { return ddlCallCount; },
    getQueryCallCount: function() { return queryCallCount; },
    query: async function(sql, params) {
      queryCallCount++;
      var s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('CREATE TABLE') === 0 && s.indexOf('SCHEMA_MIGRATIONS') !== -1) {
        return { rows: [] };
      }
      if (s.indexOf('SELECT') === 0 && s.indexOf('SCHEMA_MIGRATIONS') !== -1) {
        var name = params[0];
        var rows = migrations.filter(function(m) { return m.name === name; });
        return { rows: rows };
      }
      if (s.indexOf('INSERT INTO SCHEMA_MIGRATIONS') === 0) {
        var insertName = params[0];
        if (!migrations.some(function(m) { return m.name === insertName; })) {
          migrations.push({ name: insertName, applied_at: new Date().toISOString() });
        }
        return { rows: [] };
      }
      // Any other statement is treated as the migration's own DDL.
      ddlCallCount++;
      return { rows: [] };
    }
  };
}

function makeThrowingPool() {
  return {
    query: async function() {
      throw new Error('simulated connection failure');
    }
  };
}

async function run() {
  var MODULE_PATH = '../src/web-ui/modules/migration-tracker';
  var tracker;
  try {
    tracker = require(MODULE_PATH);
  } catch (err) {
    console.log('  [FAIL] module load -- ' + err.message);
    failed++;
  }

  if (tracker) {
    var hasMigrationRun = tracker.hasMigrationRun;
    var recordMigrationRun = tracker.recordMigrationRun;
    var runMigrationOnce = tracker.runMigrationOnce;

    await asyncTest('UT1 (AC1): hasMigrationRun returns false for a never-before-seen migration name', async function() {
      var pool = makeFakePool();
      var result = await hasMigrationRun(pool, 'migrateFooSchema');
      assert.strictEqual(result, false);
    });

    await asyncTest('UT2 (AC1): recordMigrationRun writes a row, and a subsequent hasMigrationRun call for the same name returns true', async function() {
      var pool = makeFakePool();
      await recordMigrationRun(pool, 'migrateFooSchema');
      var result = await hasMigrationRun(pool, 'migrateFooSchema');
      assert.strictEqual(result, true);
    });

    await asyncTest('UT3 (AC1): runMigrationOnce invokes the supplied migration function on a cold run, then records it', async function() {
      var pool = makeFakePool();
      var called = 0;
      await runMigrationOnce(pool, 'migrateFooSchema', async function() { called++; });
      assert.strictEqual(called, 1, 'migration function must be invoked exactly once on a cold run');
      var alreadyRun = await hasMigrationRun(pool, 'migrateFooSchema');
      assert.strictEqual(alreadyRun, true, 'the migration must be recorded after running');
    });

    await asyncTest('UT4 (AC2): runMigrationOnce does NOT invoke the migration function a second time once already recorded', async function() {
      var pool = makeFakePool();
      var called = 0;
      var migrationFn = async function() { called++; };
      await runMigrationOnce(pool, 'migrateFooSchema', migrationFn); // cold run
      await runMigrationOnce(pool, 'migrateFooSchema', migrationFn); // warm run
      assert.strictEqual(called, 1, 'migration function must still have been called exactly once total');
    });

    await asyncTest('UT5 (AC5): a tracker-layer failure propagates to the caller unchanged, matching every existing .catch() call site\'s behaviour', async function() {
      var pool = makeThrowingPool();
      var threw = false;
      try {
        await runMigrationOnce(pool, 'migrateFooSchema', async function() {});
      } catch (err) {
        threw = true;
        assert.ok(/simulated connection failure/.test(err.message), 'the original error must propagate, not be swallowed or replaced');
      }
      assert.strictEqual(threw, true, 'runMigrationOnce must reject when the tracker-table query itself fails, not swallow the error');
    });

    await asyncTest('UT6 (AC6): the schema_migrations table is created with no tenant_id column, and recorded rows carry no tenant identifier', async function() {
      var pool = makeFakePool();
      await runMigrationOnce(pool, 'migrateFooSchema', async function() {});
      var row = pool.migrations[0];
      assert.ok(row, 'expected one recorded migration row');
      assert.ok(!('tenant_id' in row), 'the schema_migrations row must not carry a tenant_id field');
      assert.deepStrictEqual(Object.keys(row).sort(), ['applied_at', 'name'], 'schema_migrations rows must only carry name and applied_at');
    });

    await asyncTest('NFR-PERF1 (AC2): a warm run issues exactly one tracker query and zero DDL calls, down from a cold run\'s full DDL cost', async function() {
      var coldPool = makeFakePool();
      await runMigrationOnce(coldPool, 'migrateFooSchema', async function() { await coldPool.query('CREATE TABLE IF NOT EXISTS foo (id INT)'); });
      var coldDdlCount = coldPool.getDdlCallCount();
      assert.ok(coldDdlCount >= 1, 'a cold run must still execute the migration\'s own DDL');

      var warmPool = makeFakePool();
      await recordMigrationRun(warmPool, 'migrateFooSchema'); // simulate: already applied on a prior boot
      var queryCountBefore = warmPool.getQueryCallCount();
      await runMigrationOnce(warmPool, 'migrateFooSchema', async function() { await warmPool.query('CREATE TABLE IF NOT EXISTS foo (id INT)'); });
      var ddlCallsDuringWarmRun = warmPool.getDdlCallCount();
      assert.strictEqual(ddlCallsDuringWarmRun, 0, 'a warm run must issue zero DDL calls for an already-applied migration');
      assert.strictEqual(warmPool.getQueryCallCount() - queryCountBefore, 1, 'a warm run must issue exactly one query (the existence check)');
    });
  }

  // ── IT1/IT2 — structural checks on server.js's real wiring ────────────────
  // Same convention as lasr-s1's T6 (regex-count check on the real source,
  // not a live server boot -- server.js is an app entry point, not a module
  // designed to be required() in isolation).
  var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');
  var serverSrc = fs.readFileSync(SERVER_PATH, 'utf8');

  // smt-s1 (2026-11-11): migrateCommentsSchema (agency-client-comments.js)
  // and migrateFeatureEditsSchema (feature-edits.js) are deliberately
  // excluded from this list -- confirmed by direct grep that neither is
  // ever called in src/web-ui/server.js's boot sequence (migrateFeatureEditsSchema
  // is only called from tests/check-ep2-s4-feature-edits.js). Both are real,
  // defined, exported migrations that follow the same convention as every
  // other one here, just never wired into boot at all -- a separate, latent
  // finding (captured in workspace/capture-log.md), out of scope for this
  // story, which only adds tracking to call sites that already exist.
  var KNOWN_MIGRATE_FUNCTIONS = [
    'migrateTeamSchema', 'migrateIdentityLinksSchema', 'migrateOrganisationsSchema',
    'migrateTenantAdminBootstrapSchema', 'migratePodsSchema', 'migratePodAssignmentsSchema',
    'migrateFeatureCollaboratorsSchema', 'migrateFeatureCollaboratorRemovalsSchema',
    'migrateAgencyClientGrantsSchema', 'migrateArtefactCommentsSchema', 'migrateClientInvitationsSchema',
    'migrateClientLoginTokensSchema', 'migrateProductRepoColumns', 'migrateTeamInvitationsSchema',
  ];

  test('IT1 (AC3): all 14 known migrate*Schema/Columns call sites in server.js are wrapped via runMigrationOnce(...), none called directly/unwrapped', function() {
    var unwrapped = [];
    KNOWN_MIGRATE_FUNCTIONS.forEach(function(fnName) {
      // A direct, unwrapped call looks like `migrateXSchema(pool)` NOT preceded
      // by `runMigrationOnce(`. A wrapped call passes the function reference
      // or an inline arrow/function wrapping it as runMigrationOnce's 3rd arg.
      var directCallPattern = new RegExp('(?<!runMigrationOnce\\([^)]{0,200})\\b' + fnName + '\\s*\\(', 'g');
      var directMatches = serverSrc.match(directCallPattern) || [];
      var wrappedPattern = new RegExp('runMigrationOnce\\([^;]*?' + fnName, 's');
      if (directMatches.length > 0 && !wrappedPattern.test(serverSrc)) {
        unwrapped.push(fnName);
      }
    });
    assert.deepStrictEqual(unwrapped, [], 'expected every known migrate* function to be called through runMigrationOnce; found unwrapped: ' + unwrapped.join(', '));
  });

  test('IT2 (AC4): migrateOrganisationsSchema\'s chained backfill/pool-wiring steps remain in the same .then() chain, after the runMigrationOnce-wrapped call', function() {
    var idx = serverSrc.indexOf('migrateOrganisationsSchema');
    assert.ok(idx !== -1, 'expected to find migrateOrganisationsSchema referenced in server.js');
    var chainSlice = serverSrc.slice(idx, idx + 1200);
    assert.ok(/backfillStandaloneOrganisations/.test(chainSlice), 'expected backfillStandaloneOrganisations to still be chained after the migration call');
    assert.ok(/setOrganisationsPool/.test(chainSlice), 'expected setOrganisationsPool wiring to still be chained after the migration call');
  });

  console.log('\n[smt-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

run();
