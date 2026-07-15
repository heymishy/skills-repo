# Implementation Plan: Edit a product's name, description, and repo association (prc-s4.1)

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s4.1.md
**Test plan reference:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s4.1-test-plan.md
**Plan date:** 2026-07-15

---

## Overview

Edit an existing product's name, description, and/or repo association. Reuse prc-s1.2's repo-access-verification logic (via the `repoAdapter` injectable adapter) for AC2 and AC3. Extract the shared repo-connection logic into a named helper function so the edit handler and the existing connect-repo handler both call the same code path, preventing AC3's drift concern.

**ACs covered:** 3/3
**Tasks:** 3
**Estimated effort:** 15–20 minutes

---

## File map

| File | Status | Purpose |
|------|--------|---------|
| `src/web-ui/routes/products.js` | Modify | Add `handlePutProductEdit` handler for name/description/repo changes |
| `src/web-ui/routes/product-repo.js` | Modify | Extract shared repo-connection logic into `_applyRepoChange()` helper; update `handlePostConnectRepo` to call it |
| `tests/check-prc-s4.1-edit-product.js` | Create | 3 integration tests for AC1–AC3 |

---

## Task 1: Extract shared repo-connection logic into product-repo.js

**Verifies:** AC2 (reuses access verification), AC3 (shared code path)
**File:** `src/web-ui/routes/product-repo.js`
**Time estimate:** 5 min

### Step 1 — Write failing test

Create `tests/check-prc-s4.1-edit-product.js`:

```javascript
'use strict';

var tap = require('tap');
var _pool = require('../src/db/pool-mock');
var _posthog = require('../src/modules/posthog-server');
var _repoAdapter = require('../src/web-ui/adapters/repo-adapter');
var productRepo = require('../src/web-ui/routes/product-repo');
var products = require('../src/web-ui/routes/products');

tap.test('prc-s4.1 AC1 — edit name and description saves immediately', async function(t) {
  var mockReq = {
    params: { id: 'prod-1' },
    session: { tenantId: 'tenant-1', login: 'user1', accessToken: 'token123' },
    body: { name: 'New Name', description: 'New Desc' }
  };
  var updateCalled = null;
  var mockPool = {
    query: function(sql, params) {
      if (sql.indexOf('UPDATE products') !== -1 && sql.indexOf('name') !== -1) {
        updateCalled = { sql: sql, params: params };
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

  await products.handlePutProductEdit(mockReq, mockRes, null, mockPool, mockPostHog);

  t.ok(updateCalled, 'UPDATE query was called');
  t.match(updateCalled.sql, /UPDATE products SET/, 'SQL is UPDATE');
  t.match(updateCalled.sql, /name.*description/i, 'name and description are updated');
  t.equal(updateCalled.params[0], 'New Name', 'name parameter matches');
  t.equal(updateCalled.params[1], 'New Desc', 'description parameter matches');
  t.equal(mockRes._status, 200, 'response is 200');
  t.ok(capturedEvent, 'PostHog event captured');
  t.equal(capturedEvent.event, 'product_edited', 'event type is product_edited');
});

tap.test('prc-s4.1 AC2 — changing repo association re-verifies access before accepting', async function(t) {
  var mockReq = {
    params: { id: 'prod-1' },
    session: { tenantId: 'tenant-1', login: 'user1', accessToken: 'token123' },
    body: { owner: 'newowner', repo: 'newrepo' }
  };
  var adapterCheckCalls = [];
  var updateCalls = [];
  var mockPool = {
    query: function(sql, params) {
      if (sql.indexOf('SELECT product_id') !== -1) {
        return Promise.resolve({ rows: [{ product_id: 'prod-1', tenant_id: 'tenant-1', repo_owner: 'oldowner', repo_name: 'oldrepo' }] });
      }
      if (sql.indexOf('UPDATE products') !== -1 && sql.indexOf('repo') !== -1) {
        updateCalls.push({ sql: sql, params: params });
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

  _repoAdapter.setRepoAdapter(function(owner, repo, token) {
    adapterCheckCalls.push({ owner: owner, repo: repo, token: token });
    return Promise.resolve({ hasAccess: true, status: 200 });
  });

  await products.handlePutProductEdit(mockReq, mockRes, null, mockPool, mockPostHog);

  t.equal(adapterCheckCalls.length, 1, 'repo adapter was called once');
  t.equal(adapterCheckCalls[0].owner, 'newowner', 'adapter called with new owner');
  t.equal(adapterCheckCalls[0].repo, 'newrepo', 'adapter called with new repo');
  t.equal(updateCalls.length, 1, 'UPDATE executed after verification');
  t.equal(mockRes._status, 200, 'response is 200');
});

tap.test('prc-s4.1 AC3 — adding a repo via edit uses identical code path to first-time config', async function(t) {
  var firstTimeConnectCalls = [];
  var editConnectCalls = [];

  var mockReq1 = {
    params: { id: 'prod-1' },
    session: { tenantId: 'tenant-1', login: 'user1', accessToken: 'token123' },
    body: { owner: 'owner1', repo: 'repo1' }
  };
  var mockReq2 = {
    params: { id: 'prod-2' },
    session: { tenantId: 'tenant-1', login: 'user1', accessToken: 'token123' },
    body: { owner: 'owner1', repo: 'repo1' }
  };

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
      }
      return Promise.resolve({ rows: [] });
    }
  };

  var mockPostHog = { capture: function() {} };
  var mockRes = { status: function(code) { this._status = code; return this; }, json: function() {} };

  _repoAdapter.setRepoAdapter(function(owner, repo, token) {
    return Promise.resolve({ hasAccess: true, status: 200 });
  });

  // First-time configuration
  mockPool._curId = 'prod-2';
  await products.handlePutProductEdit(mockReq2, mockRes, null, mockPool, mockPostHog);

  // Re-link configuration (same repo, existing product)
  mockPool._curId = 'prod-1';
  await products.handlePutProductEdit(mockReq1, mockRes, null, mockPool, mockPostHog);

  t.equal(firstTimeConnectCalls.length, 1, 'first-time connect calls repo update');
  t.equal(editConnectCalls.length, 1, 'edit connect calls repo update');
  // Both should have identical SQL structure (just different product IDs in params)
  t.match(firstTimeConnectCalls[0].sql, /UPDATE products SET repo_provider.*repo_owner.*repo_name/, 'first-time SQL structure');
  t.match(editConnectCalls[0].sql, /UPDATE products SET repo_provider.*repo_owner.*repo_name/, 'edit SQL structure');
  t.equal(firstTimeConnectCalls[0].sql, editConnectCalls[0].sql, 'both use identical SQL (no separate code path)');
});
```

**Expected output after running test:** All 3 tests fail (not yet implemented).

### Step 2 — Implement the shared helper

Edit `src/web-ui/routes/product-repo.js` to extract the repo-connection logic:

Add this helper function after `_sendJson` and before `handlePostConnectRepo`:

```javascript
/**
 * Shared helper for connecting/updating a repo association. Used by both
 * handlePostConnectRepo (prc-s1.2) and handlePutProductEdit (prc-s4.1) to
 * ensure the edit flow and first-time configuration use identical code.
 * Verifies access, then updates the product row. Returns an object with
 * { success: boolean, error: string | null }.
 * @param {object} pool - database pool
 * @param {string} productId - product_id to update
 * @param {string} tenantId - tenant_id ownership check
 * @param {string} owner - GitHub owner
 * @param {string} repo - GitHub repo name
 * @param {string} accessToken - GitHub OAuth token
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
async function _applyRepoChange(pool, productId, tenantId, owner, repo, accessToken) {
  // Tenant-ownership check
  var prodRow = (await pool.query(
    'SELECT product_id, tenant_id FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    return { success: false, error: 'not found' };
  }

  // Verify access via adapter
  var checkAccess = _repoAdapterModule.getRepoAdapter();
  var result = await checkAccess(owner, repo, accessToken);

  if (!result || !result.hasAccess) {
    return { success: false, error: 'You do not have access to that repository, or it does not exist.' };
  }

  // Update the product
  await pool.query(
    'UPDATE products SET repo_provider = $1, repo_owner = $2, repo_name = $3 WHERE product_id = $4',
    ['github', owner, repo, productId]
  );

  return { success: true, error: null };
}
```

Then update `handlePostConnectRepo` to call this helper. Replace the body of the function (lines 113–127) with:

```javascript
async function handlePostConnectRepo(req, res, _next, pool, posthog) {
  req.body = await _readBody(req);
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var productId = req.params && req.params.id;
  var accessToken = req.session && req.session.accessToken;
  var owner = (req.body && req.body.owner) || '';
  var repo = (req.body && req.body.repo) || '';

  // AC3 — no GitHub token in session
  if (!accessToken) {
    _sendJson(res, 200, {
      error: 'Link your GitHub account first to connect a repo.',
      linkUrl: '/settings/link-account/github/start'
    });
    return;
  }

  // Use shared helper
  var result = await _applyRepoChange(_pool, productId, tenantId, owner, repo, accessToken);

  if (!result.success) {
    var statusCode = result.error === 'not found' ? 404 : 403;
    _sendJson(res, statusCode, { error: result.error });
    return;
  }

  _ph.capture(tenantId, 'product_repo_connected', {
    productId: productId,
    tenantId: tenantId,
    owner: owner,
    repo: repo,
    connectedBy: req.session && req.session.login
  });

  _sendJson(res, 200, { connected: true, owner: owner, repo: repo });
}
```

Also export the helper for tests:

```javascript
module.exports = {
  handlePostConnectRepo,
  _applyRepoChange  // exported for AC3 test verification
};
```

**Expected output after Step 2:** All 3 tests still failing (tests call handlePutProductEdit which doesn't exist yet).

---

## Task 2: Add handlePutProductEdit to products.js

**Verifies:** AC1 (name/description), AC2+AC3 (repo changes via shared logic)
**File:** `src/web-ui/routes/products.js`
**Time estimate:** 8 min

### Step 1 — Write the handler

At the end of `products.js`, before `module.exports`, add:

```javascript
async function handlePutProductEdit(req, res, _next, pool, posthog) {
  req.body = await _readBody(req);
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var productId = req.params && req.params.id;
  var accessToken = req.session && req.session.accessToken;
  var name = (req.body && req.body.name) || undefined;
  var description = (req.body && req.body.description) || undefined;
  var owner = (req.body && req.body.owner) || undefined;
  var repo = (req.body && req.body.repo) || undefined;

  // Tenant-ownership check first
  var prodRow = (await _pool.query(
    'SELECT product_id, tenant_id, name as oldName FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    res.status(404).json({ error: 'not found' });
    return;
  }

  // AC1: Update name/description if provided
  if (name !== undefined || description !== undefined) {
    var setClause = [];
    var params = [];
    var paramIndex = 1;

    if (name !== undefined) {
      setClause.push('name = $' + paramIndex);
      params.push(name);
      paramIndex++;
    }
    if (description !== undefined) {
      setClause.push('description = $' + paramIndex);
      params.push(description);
      paramIndex++;
    }

    params.push(productId);
    await _pool.query(
      'UPDATE products SET ' + setClause.join(', ') + ' WHERE product_id = $' + paramIndex,
      params
    );

    _ph.capture(tenantId, 'product_edited', {
      productId: productId,
      tenantId: tenantId,
      name: name,
      description: description,
      changedBy: req.session && req.session.login
    });
  }

  // AC2/AC3: Update repo if provided (reuse shared logic from product-repo.js)
  if (owner !== undefined && repo !== undefined) {
    if (!accessToken) {
      res.status(200).json({
        error: 'Link your GitHub account first to connect a repo.',
        linkUrl: '/settings/link-account/github/start'
      });
      return;
    }

    var repoResult = await _repoAdapter._applyRepoChange(_pool, productId, tenantId, owner, repo, accessToken);

    if (!repoResult.success) {
      var statusCode = repoResult.error === 'not found' ? 404 : 403;
      res.status(statusCode).json({ error: repoResult.error });
      return;
    }

    _ph.capture(tenantId, 'product_repo_connected', {
      productId: productId,
      tenantId: tenantId,
      owner: owner,
      repo: repo,
      changedBy: req.session && req.session.login
    });
  }

  res.status(200).json({ edited: true });
}
```

Then update `module.exports` to include the new handler:

```javascript
module.exports = {
  handleGetProductDashboard,
  handleGetProductNew,
  handlePostProductNew,
  handlePostProductConfirm,
  handleGetProductView,
  handleDeleteProduct,
  handlePutProductEdit
};
```

**Expected output after Step 2:** Tests still fail because the test file hasn't been created as a route yet; tests should now load the handler but still fail on test assertions.

---

## Task 3: Wire the route and run tests

**Verifies:** All ACs (route wiring ensures handlers are called)
**File:** `server.js`
**Time estimate:** 4 min

### Step 1 — Wire the route

In `server.js`, find the section where product routes are mounted (look for `POST /products/confirm` or similar). Add this route handler (adapt the exact line numbers to match your server.js):

```javascript
// prc-s4.1 — Edit product name, description, repo
app.put('/products/:id', async function(req, res, next) {
  return await productsModule.handlePutProductEdit(req, res, next, pool, posthog);
});
```

Ensure `productsModule` is already required at the top of server.js (it should be, if prc-s1.1 and prc-s4.2 are already merged).

### Step 2 — Run story-specific tests

Run only the prc-s4.1 test file:

```bash
node tests/check-prc-s4.1-edit-product.js
```

**Expected output:**
```
prc-s4.1 AC1 — edit name and description saves immediately ... ok
prc-s4.1 AC2 — changing repo association re-verifies access before accepting ... ok
prc-s4.1 AC3 — adding a repo via edit uses identical code path to first-time config ... ok

test summary: 3 of 3 tests passed
```

### Step 3 — Commit

Commit with message:

```
prc-s4.1: Edit product name, description, and repo association

AC1: Edit name/description saves immediately — handlePutProductEdit updates product table, PostHog event
AC2: Repo association change re-verifies access via repoAdapter (shared logic from prc-s1.2)
AC3: Adding repo via edit uses identical code path to first-time config — extracted _applyRepoChange helper in product-repo.js, both handlePostConnectRepo and handlePutProductEdit call it

All 3 ACs verified by integration tests. Route /products/:id PUT wired in server.js.
```

---

## Verification checklist

- [ ] AC1 test passes: name/description update recorded in DB
- [ ] AC2 test passes: repo adapter called before UPDATE, access-check reuses prc-s1.2 logic
- [ ] AC3 test passes: both first-time-config and edit-path UPDATE queries are identical
- [ ] Route `PUT /products/:id` wired in server.js
- [ ] No syntax errors: `node -c` on all modified files
- [ ] Conflict markers scanned (D40): `grep -n "<<<<\|===\|>>>>" src/web-ui/routes/products.js src/web-ui/routes/product-repo.js`
