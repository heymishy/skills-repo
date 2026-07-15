'use strict';

// tests/check-prc-s1.1-product-repo-columns.js
// prc-s1.1 -- migrateProductRepoColumns idempotently adds repo_provider/
// repo_owner/repo_name (all nullable) to the products table.
// Mock pool follows this repo's spy-mock convention (see check-arl-s5-*.js).

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

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
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var PRODUCT_REPO_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-repo.js');

function freshRequire() {
  delete require.cache[require.resolve(PRODUCT_REPO_PATH)];
  return require(PRODUCT_REPO_PATH);
}

// Mock pool: records every ALTER TABLE call, and simulates a single
// pre-existing product row for AC2's null-column check.
function makeMockPool() {
  var alterCalls = [];
  var row = { product_id: 'p1', name: 'Existing Product', repo_provider: null, repo_owner: null, repo_name: null };
  return {
    query: async function(sql, params) {
      if (/ALTER TABLE products/i.test(sql)) {
        alterCalls.push(sql);
        return { rows: [] };
      }
      if (/SELECT repo_provider, repo_owner, repo_name FROM products/i.test(sql)) {
        return { rows: [row] };
      }
      return { rows: [] };
    },
    _alterCalls: alterCalls
  };
}

async function main() {
  var queue = [];

  // T1: exactly 3 idempotent ALTER TABLE ADD COLUMN IF NOT EXISTS calls, all nullable (AC1)
  queue.push(function() {
    console.log('\n[prc-s1.1] T1 -- migrateProductRepoColumns issues 3 idempotent, nullable ALTER TABLE calls (AC1)');
    return test('migrateProductRepoColumns: 3 ALTER TABLE ADD COLUMN IF NOT EXISTS calls, no NOT NULL', async function() {
      var mod = freshRequire();
      var pool = makeMockPool();
      await mod.migrateProductRepoColumns(pool);

      assert.strictEqual(pool._alterCalls.length, 3, 'Expected exactly 3 ALTER TABLE calls, got ' + pool._alterCalls.length);
      ['repo_provider', 'repo_owner', 'repo_name'].forEach(function(col) {
        var matching = pool._alterCalls.filter(function(sql) { return sql.indexOf(col) !== -1; });
        assert.strictEqual(matching.length, 1, 'Expected exactly one ALTER TABLE call for column: ' + col);
        assert.ok(/ADD COLUMN IF NOT EXISTS/i.test(matching[0]), col + ' call must use ADD COLUMN IF NOT EXISTS');
        assert.ok(!/NOT NULL/i.test(matching[0]), col + ' call must not declare NOT NULL (nullable per AC1)');
      });
    });
  });

  // T2: existing product rows read back null for all three new columns (AC2)
  queue.push(function() {
    console.log('\n[prc-s1.1] T2 -- existing product rows have null repo columns after migration (AC2)');
    return test('migrateProductRepoColumns: pre-existing row reads back null repo_provider/repo_owner/repo_name', async function() {
      var mod = freshRequire();
      var pool = makeMockPool();
      await mod.migrateProductRepoColumns(pool);

      var r = await pool.query('SELECT repo_provider, repo_owner, repo_name FROM products WHERE product_id = $1', ['p1']);
      assert.strictEqual(r.rows.length, 1);
      assert.strictEqual(r.rows[0].repo_provider, null, 'repo_provider must be null for pre-existing row, no fabricated default');
      assert.strictEqual(r.rows[0].repo_owner, null, 'repo_owner must be null for pre-existing row, no fabricated default');
      assert.strictEqual(r.rows[0].repo_name, null, 'repo_name must be null for pre-existing row, no fabricated default');
    });
  });

  // T3: calling the migration twice is a no-op -- no error, no duplicate columns (AC3)
  queue.push(function() {
    console.log('\n[prc-s1.1] T3 -- migration is idempotent across repeated calls, no error, no duplication (AC3)');
    return test('migrateProductRepoColumns: second call succeeds, still exactly 3 ALTER TABLE calls per run, both runs use IF NOT EXISTS', async function() {
      var mod = freshRequire();
      var pool = makeMockPool();

      await mod.migrateProductRepoColumns(pool); // first run
      var firstRunCount = pool._alterCalls.length;
      assert.strictEqual(firstRunCount, 3);

      await mod.migrateProductRepoColumns(pool); // second run -- must not throw
      assert.strictEqual(pool._alterCalls.length, 6, 'Second run should issue its own 3 calls (mock does not dedupe -- real Postgres IF NOT EXISTS makes this safe)');
      pool._alterCalls.forEach(function(sql) {
        assert.ok(/IF NOT EXISTS/i.test(sql), 'Every call across both runs must use IF NOT EXISTS: ' + sql);
      });
    });
  });

  // T4: server.js wires migrateProductRepoColumns into the existing DATABASE_URL-gated
  // products migration chain (code inspection, matching arl-s5 T6's convention)
  queue.push(function() {
    console.log('\n[prc-s1.1] T4 -- server.js wires migrateProductRepoColumns into the products migration chain');
    return test('server.js: requires product-repo module and calls migrateProductRepoColumns(_creditsPool)', function() {
      var fs = require('fs');
      var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(/require\(['"]\.\/modules\/product-repo['"]\)/.test(src),
        "server.js must require('./modules/product-repo')");
      assert.ok(/migrateProductRepoColumns\(\s*_creditsPool/.test(src),
        'server.js must call migrateProductRepoColumns(_creditsPool, ...) using the shared credits/products pool');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[prc-s1.1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[prc-s1.1] Unexpected error:', err);
  process.exit(1);
});
