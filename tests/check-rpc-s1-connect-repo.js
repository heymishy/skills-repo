'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

const products = require('../src/web-ui/routes/products');
const repoAdapter = require('../src/web-ui/adapters/repo-adapter');

console.log('[rpc-s1] Connect-repo UI affordance\n');

// U1 (AC1) — Unconnected product shows Connect-repo control
function testU1() {
  console.log('U1 — Unconnected product shows Connect-repo control');
  try {
    var html = products._renderProductView(
      'Test Product', 'prod-123', [], 'testuser', null, false,
      null, null // no repo connected
    );
    assert.ok(html.indexOf('Connect GitHub repo') !== -1, 'expected "Connect GitHub repo" heading, not found');
    assert.ok(html.indexOf('id="rpc-repo-form"') !== -1, 'expected form with id="rpc-repo-form"');
    pass('U1: renders a Connect-repo affordance when repo_owner/repo_name are null');
  } catch (err) { fail('U1: renders a Connect-repo affordance when repo_owner/repo_name are null', err); }
}

// U2 (AC4) — Connected product hides Connect-repo, shows repo info
function testU2() {
  console.log('U2 — Connected product hides Connect-repo, shows repo info');
  try {
    var html = products._renderProductView(
      'Test Product', 'prod-123', [], 'testuser', null, false,
      'octocat', 'Hello-World'
    );
    assert.ok(html.indexOf('Connect GitHub repo') === -1, 'expected no Connect-repo prompt once connected, but found it');
    assert.ok(html.indexOf('id="rpc-repo-form"') === -1, 'expected no rpc-repo-form once connected, but found it');
    assert.ok(html.indexOf('octocat') !== -1, 'expected repo owner "octocat" to be displayed');
    assert.ok(html.indexOf('Hello-World') !== -1, 'expected repo name "Hello-World" to be displayed');
    pass('U2: hides Connect-repo affordance and shows repo info when repo_owner/repo_name are set');
  } catch (err) { fail('U2: hides Connect-repo affordance and shows repo info when repo_owner/repo_name are set', err); }
}

// IT1 (AC2) — Create-new-repo path end-to-end: the exact request shape the
// new UI's rpcSubmitCreate() sends (POST /products/:id/repo/create with
// JSON body {name: name}) reaches the existing handlePostProductRepoCreate
// handler unmodified, and the subsequent product-page render (via
// _renderProductView, fed the resulting repo_owner/repo_name) shows the
// newly created repo.
async function testIT1() {
  console.log('IT1 — Create-new-repo path end-to-end');
  try {
    repoAdapter.setCreateRepoAdapter(async function(token, name) {
      assert.strictEqual(token, 'session-token-abc', 'createRepo not called with the session accessToken');
      assert.strictEqual(name, 'my-new-repo', 'createRepo not called with the name submitted via the new UI form');
      return { owner: { login: 'newowner' }, name: name };
    });

    var updateCall = null;
    var mockPool = {
      query: async function(sql, params) {
        if (/UPDATE products SET repo_provider/i.test(sql)) {
          updateCall = { sql: sql, params: params };
          return { rows: [{ product_id: 'prod-1' }] };
        }
        return { rows: [] };
      }
    };
    var mockPostHog = { capture: function() {} };
    var mockRes = {
      status: function(c) { this._status = c; return this; },
      json: function(b) { this._body = b; },
      _status: null,
      _body: null
    };
    // Request body shape mirrors rpcSubmitCreate()'s fetch call exactly:
    // fetch('/products/'+productId+'/repo/create', {method:'POST', body: JSON.stringify({name:name})})
    var mockReq = {
      params: { id: 'prod-1' },
      session: { tenantId: 'tenant-1', login: 'user1', accessToken: 'session-token-abc' },
      body: { name: 'my-new-repo' }
    };

    await products.handlePostProductRepoCreate(mockReq, mockRes, null, mockPool, mockPostHog);

    assert.ok(updateCall, 'the create-repo form submission never reached a product UPDATE — handlePostProductRepoCreate was not invoked correctly');
    assert.deepStrictEqual(updateCall.params, ['github', 'newowner', 'my-new-repo', 'prod-1'], 'UPDATE params did not persist the created repo owner/name correctly');
    assert.ok(mockRes._status === 200 || mockRes._status === 201, 'expected a success status from handlePostProductRepoCreate, got ' + mockRes._status);

    // Subsequent product-page render must show the newly created repo —
    // simulates the page reload rpcSubmitCreate() triggers on success.
    var html = products._renderProductView(
      'Test Product', 'prod-1', [], 'user1', null, false,
      updateCall.params[1], updateCall.params[2] // repo_owner, repo_name as persisted
    );
    assert.ok(html.indexOf('newowner') !== -1, 'product page does not show the newly created repo owner after create-new-repo');
    assert.ok(html.indexOf('my-new-repo') !== -1, 'product page does not show the newly created repo name after create-new-repo');
    assert.ok(html.indexOf('Connect GitHub repo') === -1, 'product page still shows the Connect-repo prompt after a repo was just created');

    pass('IT1: create-new-repo form submission reaches handlePostProductRepoCreate and the page subsequently shows the created repo');
  } catch (err) { fail('IT1: create-new-repo form submission reaches handlePostProductRepoCreate and the page subsequently shows the created repo', err); }
}

// IT2 (AC3) — Connect-existing-repo path end-to-end: the exact request
// shape the new UI's rpcSubmitConnect() sends (PUT /products/:id with JSON
// body {owner, repo}) reaches handlePutProductEdit's existing
// repo-association path unmodified, and the subsequent product-page render
// shows the connected repo.
async function testIT2() {
  console.log('IT2 — Connect-existing-repo path end-to-end');
  try {
    repoAdapter.setRepoAdapter(async function(owner, repo, token) {
      assert.strictEqual(owner, 'existingowner', 'repo adapter not called with the owner submitted via the new UI form');
      assert.strictEqual(repo, 'existingrepo', 'repo adapter not called with the repo submitted via the new UI form');
      assert.strictEqual(token, 'session-token-xyz', 'repo adapter not called with the session accessToken');
      return { hasAccess: true, status: 200 };
    });

    var updateCall = null;
    var mockPool = {
      query: async function(sql, params) {
        if (/SELECT product_id/i.test(sql)) {
          return { rows: [{ product_id: 'prod-2', tenant_id: 'tenant-1' }] };
        }
        if (/UPDATE products SET repo_provider/i.test(sql)) {
          updateCall = { sql: sql, params: params };
          return { rows: [] };
        }
        return { rows: [] };
      }
    };
    var mockPostHog = { capture: function() {} };
    var mockRes = {
      status: function(c) { this._status = c; return this; },
      json: function(b) { this._body = b; },
      _status: null,
      _body: null
    };
    // Request body shape mirrors rpcSubmitConnect()'s fetch call exactly:
    // fetch('/products/'+productId, {method:'PUT', body: JSON.stringify({owner:owner, repo:repo})})
    var mockReq = {
      params: { id: 'prod-2' },
      session: { tenantId: 'tenant-1', login: 'user1', accessToken: 'session-token-xyz' },
      body: { owner: 'existingowner', repo: 'existingrepo' }
    };

    await products.handlePutProductEdit(mockReq, mockRes, null, mockPool, mockPostHog);

    assert.ok(updateCall, 'the connect-existing-repo form submission never reached a product UPDATE — handlePutProductEdit repo-association path was not invoked correctly');
    assert.deepStrictEqual(updateCall.params, ['github', 'existingowner', 'existingrepo', 'prod-2'], 'UPDATE params did not persist the connected repo owner/name correctly');
    assert.strictEqual(mockRes._status, 200, 'expected a 200 from handlePutProductEdit, got ' + mockRes._status);

    // Subsequent product-page render must show the connected repo —
    // simulates the page reload rpcSubmitConnect() triggers on success.
    var html = products._renderProductView(
      'Test Product', 'prod-2', [], 'user1', null, false,
      updateCall.params[1], updateCall.params[2] // repo_owner, repo_name as persisted
    );
    assert.ok(html.indexOf('existingowner') !== -1, 'product page does not show the connected repo owner after connect-existing-repo');
    assert.ok(html.indexOf('existingrepo') !== -1, 'product page does not show the connected repo name after connect-existing-repo');
    assert.ok(html.indexOf('Connect GitHub repo') === -1, 'product page still shows the Connect-repo prompt after a repo was just connected');

    pass('IT2: connect-existing-repo form submission reaches handlePutProductEdit\'s repo-association path and the page subsequently shows the connected repo');
  } catch (err) { fail('IT2: connect-existing-repo form submission reaches handlePutProductEdit\'s repo-association path and the page subsequently shows the connected repo', err); }
}

// IT3 (NFR-Security / MC-SEC-01) — repo owner/name rendered safely, no injection
function testIT3() {
  console.log('IT3 — Security: repo owner/name rendered safely (no injection)');
  try {
    var html = products._renderProductView(
      'Test Product', 'prod-123', [], 'testuser', null, false,
      '<script>alert(1)</script>', '"><img src=x>'
    );
    assert.ok(html.indexOf('<script>alert(1)</script>') === -1, 'expected raw <script> tag to be escaped, but found it verbatim');
    assert.ok(html.indexOf('"><img src=x>') === -1, 'expected raw HTML-special repo name to be escaped, but found it verbatim');
    assert.ok(html.indexOf('&lt;script&gt;') !== -1, 'expected the escaped form of the malicious owner to be present');
    pass('IT3: repo owner/name containing HTML special characters are escaped via _escapeHtml (MC-SEC-01)');
  } catch (err) { fail('IT3: repo owner/name containing HTML special characters are escaped via _escapeHtml (MC-SEC-01)', err); }
}

(async function main() {
  testU1();
  testU2();
  await testIT1();
  await testIT2();
  testIT3();
  console.log(`\n[rpc-s1] Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
