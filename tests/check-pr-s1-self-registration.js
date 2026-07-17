'use strict';

// tests/check-pr-s1-self-registration.js
// pr-s1 -- registerSelfAsProduct idempotently creates skills-framework's own
// product row (AC1), skips gracefully when config is absent, and enforces
// the same tenant_id isolation as every other products query (AC4).
// Mock pool follows this repo's spy-mock convention (see check-prc-s1.1-*.js).

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

var MODULE_PATH = path.resolve(__dirname, '../src/web-ui/modules/platform-self-registration.js');

function freshRequire() {
  delete require.cache[require.resolve(MODULE_PATH)];
  return require(MODULE_PATH);
}

// Mock pool: in-memory products table, keyed by an auto-incrementing id.
function makeMockPool(seedRows) {
  var rows = (seedRows || []).slice();
  var nextId = rows.length + 1;
  return {
    query: async function(sql, params) {
      params = params || [];
      if (/SELECT product_id FROM products WHERE tenant_id = \$1 AND repo_owner = \$2 AND repo_name = \$3/i.test(sql)) {
        var match = rows.filter(function(r) {
          return r.tenant_id === params[0] && r.repo_owner === params[1] && r.repo_name === params[2];
        });
        return { rows: match };
      }
      if (/INSERT INTO products/i.test(sql)) {
        var row = {
          product_id: 'p' + nextId++,
          tenant_id: params[0],
          name: params[1],
          description: params[2],
          repo_provider: params[3],
          repo_owner: params[4],
          repo_name: params[5],
          created_by: params[6]
        };
        rows.push(row);
        return { rows: [row] };
      }
      if (/SELECT product_id, name FROM products WHERE tenant_id = \$1/i.test(sql)) {
        return { rows: rows.filter(function(r) { return r.tenant_id === params[0]; }) };
      }
      return { rows: [] };
    },
    _rows: rows
  };
}

async function main() {
  var queue = [];

  // T1: creates a product row scoped to the caller's tenant_id (AC1)
  queue.push(function() {
    console.log('\n[pr-s1] T1 -- registerSelfAsProduct creates a product row when none exists (AC1)');
    return test('registerSelfAsProduct: creates row with correct tenant_id/repo fields', async function() {
      var mod = freshRequire();
      var pool = makeMockPool([]);
      var productId = await mod.registerSelfAsProduct(pool, {
        tenantId: 'operator-tenant',
        repoOwner: 'heymishy',
        repoName: 'skills-repo',
        name: 'skills-framework'
      });

      assert.ok(productId, 'Expected a product_id to be returned');
      assert.strictEqual(pool._rows.length, 1, 'Expected exactly one product row created');
      assert.strictEqual(pool._rows[0].tenant_id, 'operator-tenant');
      assert.strictEqual(pool._rows[0].repo_owner, 'heymishy');
      assert.strictEqual(pool._rows[0].repo_name, 'skills-repo');
      assert.strictEqual(pool._rows[0].name, 'skills-framework');
    });
  });

  // T2: seed step is idempotent -- running it twice does not create a duplicate row (AC1)
  queue.push(function() {
    console.log('\n[pr-s1] T2 -- registerSelfAsProduct is idempotent across repeated calls (AC1)');
    return test('registerSelfAsProduct: second call with same tenant/repo does not duplicate', async function() {
      var mod = freshRequire();
      var pool = makeMockPool([]);
      var opts = { tenantId: 'operator-tenant', repoOwner: 'heymishy', repoName: 'skills-repo', name: 'skills-framework' };

      var firstId = await mod.registerSelfAsProduct(pool, opts);
      var secondId = await mod.registerSelfAsProduct(pool, opts);

      assert.strictEqual(pool._rows.length, 1, 'Expected still exactly one row after second call');
      assert.strictEqual(firstId, secondId, 'Expected the second call to return the same existing product_id');
    });
  });

  // T3: querying a product row by tenant_id never returns another tenant's row (AC4)
  queue.push(function() {
    console.log('\n[pr-s1] T3 -- tenant A never sees tenant B\'s product row (AC4)');
    return test('registerSelfAsProduct: two tenants each get their own isolated row', async function() {
      var mod = freshRequire();
      var pool = makeMockPool([]);
      await mod.registerSelfAsProduct(pool, { tenantId: 'tenant-a', repoOwner: 'org-a', repoName: 'repo-a', name: 'Product A' });
      await mod.registerSelfAsProduct(pool, { tenantId: 'tenant-b', repoOwner: 'org-b', repoName: 'repo-b', name: 'Product B' });

      var tenantAResult = await pool.query('SELECT product_id, name FROM products WHERE tenant_id = $1', ['tenant-a']);
      assert.strictEqual(tenantAResult.rows.length, 1, 'Expected tenant A to see exactly one row');
      assert.strictEqual(tenantAResult.rows[0].name, 'Product A');
      assert.ok(!tenantAResult.rows.some(function(r) { return r.name === 'Product B'; }), 'Tenant A must not see Product B');
    });
  });

  // T4: reverse-direction check -- tenant B's query never returns tenant A's row (AC4)
  queue.push(function() {
    console.log('\n[pr-s1] T4 -- tenant B never sees tenant A\'s product row (AC4, reverse direction)');
    return test('registerSelfAsProduct: tenant B query is isolated from tenant A', async function() {
      var mod = freshRequire();
      var pool = makeMockPool([]);
      await mod.registerSelfAsProduct(pool, { tenantId: 'tenant-a', repoOwner: 'org-a', repoName: 'repo-a', name: 'Product A' });
      await mod.registerSelfAsProduct(pool, { tenantId: 'tenant-b', repoOwner: 'org-b', repoName: 'repo-b', name: 'Product B' });

      var tenantBResult = await pool.query('SELECT product_id, name FROM products WHERE tenant_id = $1', ['tenant-b']);
      assert.strictEqual(tenantBResult.rows.length, 1, 'Expected tenant B to see exactly one row');
      assert.strictEqual(tenantBResult.rows[0].name, 'Product B');
      assert.ok(!tenantBResult.rows.some(function(r) { return r.name === 'Product A'; }), 'Tenant B must not see Product A');
    });
  });

  // T5: missing config (tenantId/repoOwner/repoName absent) skips gracefully, no throw
  queue.push(function() {
    console.log('\n[pr-s1] T5 -- registerSelfAsProduct skips gracefully when config is absent');
    return test('registerSelfAsProduct: returns null and writes nothing when repoOwner is missing', async function() {
      var mod = freshRequire();
      var pool = makeMockPool([]);
      var result = await mod.registerSelfAsProduct(pool, { tenantId: 'operator-tenant', repoOwner: '', repoName: 'skills-repo', name: 'skills-framework' });

      assert.strictEqual(result, null, 'Expected null when required config is missing');
      assert.strictEqual(pool._rows.length, 0, 'Expected no row written when config is incomplete');
    });
  });

  // T6: server.js wires registerSelfAsProduct into startup, using the
  // GITHUB_REPO_OWNER/GITHUB_REPO_NAME env vars already established by
  // sign-off.js for "this platform's own repo", plus a new PLATFORM_TENANT_ID
  queue.push(function() {
    console.log('\n[pr-s1] T6 -- server.js wires registerSelfAsProduct into startup');
    return test('server.js: requires platform-self-registration and calls registerSelfAsProduct', function() {
      var fs = require('fs');
      var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(/require\(['"]\.\/modules\/platform-self-registration['"]\)/.test(src),
        "server.js must require('./modules/platform-self-registration')");
      assert.ok(/registerSelfAsProduct\(\s*_creditsPool/.test(src),
        'server.js must call registerSelfAsProduct(_creditsPool, ...) using the shared products pool');
      assert.ok(/PLATFORM_TENANT_ID/.test(src),
        'server.js must read the PLATFORM_TENANT_ID env var for the self-registration tenantId');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[pr-s1-self-registration] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[pr-s1-self-registration] Unexpected error:', err);
  process.exit(1);
});
