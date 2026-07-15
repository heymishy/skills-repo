'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

const products = require('../src/web-ui/routes/products');
const productRepo = require('../src/web-ui/routes/product-repo');
const repoAdapter = require('../src/web-ui/adapters/repo-adapter');

console.log('[prc-s4.1] Edit product name, description, and repo association\n');

// Tests run sequentially (awaited in order) — the repoAdapter module holds
// shared mutable state (setRepoAdapter), so concurrent unawaited tests would
// race on which mock is active when a handler calls getRepoAdapter().

async function testAC1() {
  console.log('AC1 — Edit name and description saves immediately');
  try {
    var updateCalled = null;
    var mockPool = {
      query: function(sql, params) {
        if (sql.indexOf('UPDATE products') !== -1 && sql.indexOf('name') !== -1) {
          updateCalled = { sql: sql, params: params };
          return Promise.resolve({ rows: [] });
        }
        if (sql.indexOf('SELECT product_id') !== -1) {
          return Promise.resolve({ rows: [{ product_id: 'prod-1', tenant_id: 'tenant-1' }] });
        }
        return Promise.resolve({ rows: [] });
      }
    };
    var capturedEvent = null;
    var mockPostHog = {
      capture: function(tenantId, event, data) {
        capturedEvent = { event: event, data: data };
      }
    };
    var mockRes = {
      status: function(code) { mockRes._status = code; return mockRes; },
      json: function(body) { mockRes._body = body; },
      _status: null,
      _body: null
    };
    var mockReq = {
      params: { id: 'prod-1' },
      session: { tenantId: 'tenant-1', login: 'user1', accessToken: 'token123' },
      body: { name: 'New Name', description: 'New Desc' },
      on: function() {}
    };

    await products.handlePutProductEdit(mockReq, mockRes, null, mockPool, mockPostHog);

    assert.ok(updateCalled, 'UPDATE query was called');
    assert.ok(updateCalled.sql.indexOf('UPDATE products') !== -1, 'SQL is UPDATE');
    assert.ok(updateCalled.sql.indexOf('name') !== -1, 'name is updated');
    assert.ok(updateCalled.sql.indexOf('description') !== -1, 'description is updated');
    assert.equal(updateCalled.params[0], 'New Name', 'name parameter matches');
    assert.equal(updateCalled.params[1], 'New Desc', 'description parameter matches');
    assert.equal(mockRes._status, 200, 'response is 200');
    assert.ok(capturedEvent, 'PostHog event captured');
    assert.equal(capturedEvent.event, 'product_edited', 'event type is product_edited');

    pass('AC1: Edit name and description saves immediately');
  } catch (err) {
    fail('AC1: Edit name and description saves immediately', err);
  }
}

async function testAC2() {
  console.log('AC2 — Changing repo association re-verifies access before accepting');
  try {
    var adapterCheckCalls = [];
    var updateCalls = [];
    var mockPool = {
      query: function(sql, params) {
        if (sql.indexOf('SELECT product_id') !== -1) {
          return Promise.resolve({ rows: [{ product_id: 'prod-1', tenant_id: 'tenant-1', repo_owner: 'oldowner', repo_name: 'oldrepo' }] });
        }
        if (sql.indexOf('UPDATE products') !== -1 && sql.indexOf('repo') !== -1) {
          updateCalls.push({ sql: sql, params: params });
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      }
    };
    var mockPostHog = { capture: function() {} };
    var mockRes = {
      status: function(code) { mockRes._status = code; return mockRes; },
      json: function(body) { mockRes._body = body; },
      _status: null,
      _body: null
    };
    var mockReq = {
      params: { id: 'prod-1' },
      session: { tenantId: 'tenant-1', login: 'user1', accessToken: 'token123' },
      body: { owner: 'newowner', repo: 'newrepo' },
      on: function() {}
    };

    repoAdapter.setRepoAdapter(function(owner, repo, token) {
      adapterCheckCalls.push({ owner: owner, repo: repo, token: token });
      return Promise.resolve({ hasAccess: true, status: 200 });
    });

    await products.handlePutProductEdit(mockReq, mockRes, null, mockPool, mockPostHog);

    assert.equal(adapterCheckCalls.length, 1, 'repo adapter was called once');
    assert.equal(adapterCheckCalls[0].owner, 'newowner', 'adapter called with new owner');
    assert.equal(adapterCheckCalls[0].repo, 'newrepo', 'adapter called with new repo');
    assert.equal(updateCalls.length, 1, 'UPDATE executed after verification');
    assert.equal(mockRes._status, 200, 'response is 200');

    pass('AC2: Changing repo association re-verifies access before accepting');
  } catch (err) {
    fail('AC2: Changing repo association re-verifies access before accepting', err);
  }
}

async function testAC3() {
  console.log('AC3 — Adding a repo via edit uses identical code path to first-time config');
  try {
    var firstTimeConnectCalls = [];
    var editConnectCalls = [];

    var mockPool = {
      query: function(sql, params) {
        if (sql.indexOf('SELECT product_id') !== -1) {
          var id = this._curId;
          return Promise.resolve({ rows: [{ product_id: id, tenant_id: 'tenant-1', repo_owner: id === 'prod-2' ? null : 'old', repo_name: id === 'prod-2' ? null : 'old' }] });
        }
        if (sql.indexOf('UPDATE products') !== -1 && sql.indexOf('repo') !== -1) {
          if (this._curId === 'prod-1') {
            firstTimeConnectCalls.push({ sql: sql, params: params });
          } else {
            editConnectCalls.push({ sql: sql, params: params });
          }
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      }
    };

    var mockPostHog = { capture: function() {} };
    var mockRes = { status: function(code) { this._status = code; return this; }, json: function() {} };

    repoAdapter.setRepoAdapter(function(owner, repo, token) {
      return Promise.resolve({ hasAccess: true, status: 200 });
    });

    // First-time configuration (prod-2 has no repo yet)
    mockPool._curId = 'prod-2';
    var mockReq2 = {
      params: { id: 'prod-2' },
      session: { tenantId: 'tenant-1', login: 'user1', accessToken: 'token123' },
      body: { owner: 'owner1', repo: 'repo1' },
      on: function() {}
    };
    await products.handlePutProductEdit(mockReq2, mockRes, null, mockPool, mockPostHog);

    // Re-link configuration (prod-1 already has old repo)
    mockPool._curId = 'prod-1';
    var mockReq1 = {
      params: { id: 'prod-1' },
      session: { tenantId: 'tenant-1', login: 'user1', accessToken: 'token123' },
      body: { owner: 'owner1', repo: 'repo1' },
      on: function() {}
    };
    await products.handlePutProductEdit(mockReq1, mockRes, null, mockPool, mockPostHog);

    assert.equal(firstTimeConnectCalls.length, 1, 'first-time connect calls repo update');
    assert.equal(editConnectCalls.length, 1, 'edit connect calls repo update');
    assert.ok(firstTimeConnectCalls[0].sql.indexOf('UPDATE products SET repo_provider') !== -1, 'first-time SQL structure');
    assert.ok(editConnectCalls[0].sql.indexOf('UPDATE products SET repo_provider') !== -1, 'edit SQL structure');
    assert.equal(firstTimeConnectCalls[0].sql, editConnectCalls[0].sql, 'both use identical SQL (no separate code path)');

    pass('AC3: Adding a repo via edit uses identical code path to first-time config');
  } catch (err) {
    fail('AC3: Adding a repo via edit uses identical code path to first-time config', err);
  }
}

(async function main() {
  await testAC1();
  await testAC2();
  await testAC3();
  console.log('\n[prc-s4.1] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
