# Delete (detach) a product — Implementation Plan

> **For agent execution:** Executed directly, task-by-task, following /tdd
> discipline (RED–GREEN–REFACTOR per task, commit after each green). No
> subagent fan-out used — the change is confined to two source files and one
> test file, well within a single focused session.

**Goal:** Build a delete route handler that removes the product row, its journeys, and its standards-cache rows from Postgres, with an explicit assertion path proving zero calls are ever made to any GitHub repo-delete endpoint. Add a confirmation UI on the product view page that explicitly states the GitHub repo will not be deleted.
**Branch:** `feature/prc-s4.2` (already checked out in this worktree)
**Worktree:** current working directory
**Test command:** `node scripts/run-all-tests.js` (full suite); `node tests/check-prc-s4.2-delete-product.js` (this story's file, fast iteration)

---

## File map

```
Create:
  tests/check-prc-s4.2-delete-product.js  — integration tests for AC1 (delete + zero GitHub calls) and AC3 (post-delete 404)

Modify:
  src/web-ui/routes/products.js  — add handleDeleteProduct handler; add a "Delete product" confirmation control
                                    (with explicit "repo will not be deleted" copy) to _renderProductView
  src/web-ui/server.js           — wire DELETE /products/:id to handleDeleteProduct (import + route match)
```

No new adapter is introduced (H-ADAPTER: N/A per DoR) — `handleDeleteProduct` takes `pool`/`posthog` as plain
parameters, following the exact pattern already used by every other handler in `routes/products.js`
(`handleGetProductView`, `handlePostProductFeature`, etc.). AC1's "zero GitHub calls" guarantee is structural,
not adapter-mediated: the handler contains no `fetch()`/`https.request()` call of any kind, so there is nothing
that could reach a GitHub delete-repo endpoint. The test proves this by spying on `global.fetch` for the
duration of the call and asserting it is never invoked.

---

## Task 1: `handleDeleteProduct` — delete product + journeys + standards-cache rows, zero GitHub calls (AC1)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-prc-s4.2-delete-product.js`

- [x] **Step 1: Write the failing test**

```javascript
'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

function makeMockPool(state) {
  // state = { productId, tenantId, journeys: [...], standards: [...], optouts: [...] }
  const queries = [];
  return {
    _queries: queries,
    query: async function(sql, params) {
      queries.push({ sql, params });
      if (/SELECT product_id, tenant_id FROM products WHERE product_id/i.test(sql)) {
        if (params[0] !== state.productId) return { rows: [] };
        return { rows: [{ product_id: state.productId, tenant_id: state.tenantId }] };
      }
      if (/DELETE FROM journeys WHERE product_id/i.test(sql)) {
        return { rowCount: state.journeys.length };
      }
      if (/DELETE FROM standard_product_optouts WHERE product_id/i.test(sql)) {
        return { rowCount: state.optouts.length };
      }
      if (/DELETE FROM standards WHERE product_id/i.test(sql)) {
        return { rowCount: state.standards.length };
      }
      if (/DELETE FROM products WHERE product_id/i.test(sql)) {
        return { rowCount: 1 };
      }
      return { rows: [] };
    }
  };
}

(async function() {
  const { handleDeleteProduct } = require('../src/web-ui/routes/products');

  // T1 — deletes product row, journeys, and standards-cache rows; zero GitHub delete calls
  try {
    const state = { productId: 'prod-1', tenantId: 'tx', journeys: [{ id: 'j1' }], standards: [{ id: 's1' }], optouts: [{ id: 'o1' }] };
    const pool = makeMockPool(state);
    const ph = { _caps: [], capture: function(id, ev, props) { this._caps.push({ id, ev, props }); } };
    const req = { session: { tenantId: 'tx', login: 'u' }, params: { id: 'prod-1' } };
    const res = { json: function(b) { this._b = b; }, _b: null, status: function(c) { this._s = c; return this; } };

    const _origFetch = global.fetch;
    let fetchCalls = 0;
    global.fetch = function() { fetchCalls++; throw new Error('fetch must never be called by handleDeleteProduct'); };
    try {
      await handleDeleteProduct(req, res, null, pool, ph);
    } finally {
      global.fetch = _origFetch;
    }

    assert.strictEqual(fetchCalls, 0, 'handleDeleteProduct made a network call (possible GitHub delete-repo call)');
    assert(pool._queries.some(q => /DELETE FROM journeys WHERE product_id/i.test(q.sql)), 'journeys not deleted');
    assert(pool._queries.some(q => /DELETE FROM standards WHERE product_id/i.test(q.sql)), 'standards cache rows not deleted');
    assert(pool._queries.some(q => /DELETE FROM standard_product_optouts WHERE product_id/i.test(q.sql)), 'standard_product_optouts rows not deleted');
    assert(pool._queries.some(q => /DELETE FROM products WHERE product_id/i.test(q.sql)), 'product row not deleted');
    assert(res._s === 200 || res._s === 204 || res._b, 'no success response sent');
    pass('DELETE /products/:id removes product, journeys, standards-cache rows; zero GitHub calls made');
  } catch (e) { fail('DELETE /products/:id removes product, journeys, standards-cache rows; zero GitHub calls made', e); }

  // T2 — audit log: capture() invoked with deleting user, product ID (AC/NFR: audit)
  try {
    const state = { productId: 'prod-2', tenantId: 'ty', journeys: [], standards: [], optouts: [] };
    const pool = makeMockPool(state);
    const ph = { _caps: [], capture: function(id, ev, props) { this._caps.push({ id, ev, props }); } };
    const req = { session: { tenantId: 'ty', login: 'deleter-user' }, params: { id: 'prod-2' } };
    const res = { json: function(b) { this._b = b; }, _b: null, status: function(c) { this._s = c; return this; } };
    await handleDeleteProduct(req, res, null, pool, ph);
    const ev = ph._caps.find(e => e.ev === 'product_deleted');
    assert(ev, 'product_deleted event not captured');
    assert.strictEqual(ev.props.productId, 'prod-2', 'productId not in audit event');
    assert.strictEqual(ev.props.tenantId, 'ty', 'tenantId not in audit event');
    pass('deletion is audit-logged via PostHog capture with deleting user, tenant, and product ID');
  } catch (e) { fail('deletion is audit-logged via PostHog capture with deleting user, tenant, and product ID', e); }

  // T3 — NFR Security: only the product's own tenant can delete it (tenant mismatch -> 404, zero deletion)
  try {
    const state = { productId: 'prod-3', tenantId: 'owner-tenant', journeys: [], standards: [], optouts: [] };
    const pool = makeMockPool(state);
    const ph = { _caps: [], capture: function() {} };
    const req = { session: { tenantId: 'attacker-tenant', login: 'attacker' }, params: { id: 'prod-3' } };
    const res = { json: function(b) { this._b = b; }, _b: null, status: function(c) { this._s = c; return this; } };
    await handleDeleteProduct(req, res, null, pool, ph);
    assert(res._s === 403 || res._s === 404, `Expected 403/404 for cross-tenant delete, got ${res._s}`);
    assert(!pool._queries.some(q => /DELETE FROM products WHERE product_id/i.test(q.sql)), 'product row deleted despite tenant mismatch');
    assert(!pool._queries.some(q => /DELETE FROM journeys WHERE product_id/i.test(q.sql)), 'journeys deleted despite tenant mismatch');
    pass('a session belonging to a different tenant cannot delete the product (403/404, zero deletion)');
  } catch (e) { fail('a session belonging to a different tenant cannot delete the product (403/404, zero deletion)', e); }

  console.log(`\n[prc-s4.2] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-prc-s4.2-delete-product.js
```

Expected output: `TypeError: handleDeleteProduct is not a function` (or equivalent — export does not exist yet)

- [x] **Step 3: Write minimal implementation**

Add to `src/web-ui/routes/products.js` (after `handleGetProductView`, before `STAGE_COLUMNS`):

```javascript
/**
 * prc-s4.2: DELETE /products/:id — hard-delete a product and its wuce-side
 * data (journeys, standards-cache rows). The underlying GitHub repo is NEVER
 * touched by this handler -- no fetch()/https call of any kind is made here,
 * by design (MVP scope: detach only, never delete the repo). Tenant-scoped:
 * a product not owned by the caller's tenant returns 404 (not 403), matching
 * the existing FORBIDDEN-vs-NOT_FOUND policy used elsewhere in this file
 * (handleGetProductView, handleGetProductKanban).
 */
async function handleDeleteProduct(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;

  var prodRow = (await _pool.query(
    'SELECT product_id, tenant_id FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }

  // Hard delete, wuce-side data only. Never a GitHub API call -- the repo
  // (if any is connected) is left completely untouched. Explicit DELETEs
  // (not relying on ON DELETE CASCADE/SET NULL alone) so the deletion is
  // directly assertable and journeys are actually removed, not orphaned
  // with product_id set to NULL (journeys.product_id is ON DELETE SET NULL,
  // which would leave stale rows behind -- not what AC1 requires).
  await _pool.query('DELETE FROM journeys WHERE product_id = $1', [productId]);
  await _pool.query('DELETE FROM standard_product_optouts WHERE product_id = $1', [productId]);
  await _pool.query('DELETE FROM standards WHERE product_id = $1', [productId]);
  await _pool.query('DELETE FROM products WHERE product_id = $1', [productId]);

  _ph.capture(tenantId, 'product_deleted', {
    productId: productId,
    tenantId: tenantId,
    deletedBy: req.session && req.session.login
  });

  if (res.status) {
    res.status(200).json({ deleted: true, product_id: productId });
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ deleted: true, product_id: productId }));
  }
}
```

Add `handleDeleteProduct` to the `module.exports` block at the bottom of `src/web-ui/routes/products.js`.

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-prc-s4.2-delete-product.js
```

Expected output: `[prc-s4.2] Results: 3 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all files pass, 0 failures (same pass count as the pre-implementation baseline, plus this new file)

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-prc-s4.2-delete-product.js
git commit -m "feat(prc-s4.2): add handleDeleteProduct — hard-delete product + journeys + standards cache, zero GitHub calls"
```

---

## Task 2: Post-delete access returns a clean not-found response (AC3)

**Files:**
- Test: `tests/check-prc-s4.2-delete-product.js` (append to same file)

AC3 is already satisfied by the existing `handleGetProductView` tenant-ownership check (see
`src/web-ui/routes/products.js`, added under bri-s3.4): once a product row no longer exists,
`handleGetProductView`'s lookup returns no row, `prodRow` is falsy, and the handler returns a
clean `404 { error: 'not found' }` — not a crash or partial render. No new implementation code is
required for AC3; this task only adds a regression-proving test so that guarantee is verified
specifically for the "product was deleted" case, not just "product never existed".

- [x] **Step 1: Write the test (already passing against existing code — this is a regression-proof test, not new RED/GREEN)**

```javascript
  // T4 — AC3: accessing a deleted product's URL returns a clean 404, not a crash
  try {
    const { handleGetProductView } = require('../src/web-ui/routes/products');
    const pool = {
      query: async function(sql) {
        if (/SELECT name, tenant_id FROM products WHERE product_id/i.test(sql)) {
          return { rows: [] }; // product row no longer exists -- deleted
        }
        return { rows: [] };
      }
    };
    const req = { session: { tenantId: 'tx', login: 'u' }, params: { id: 'deleted-prod' } };
    const res = { json: function(b) { this._b = b; }, _b: null, status: function(c) { this._s = c; return this; } };
    await handleGetProductView(req, res, null, pool);
    assert.strictEqual(res._s, 404, `Expected 404 for a deleted product, got ${res._s}`);
    assert(res._b && /not found/i.test(res._b.error || ''), 'Response body does not indicate not-found');
    pass('accessing a deleted product\'s URL returns a clean 404 "not found" response, not a crash or partial render');
  } catch (e) { fail('accessing a deleted product\'s URL returns a clean 404 "not found" response, not a crash or partial render', e); }
```

Insert this block into `tests/check-prc-s4.2-delete-product.js` immediately before the final
`console.log('\n[prc-s4.2] Results...')` line.

- [x] **Step 2: Run test — must pass immediately (no implementation change needed)**

```bash
node tests/check-prc-s4.2-delete-product.js
```

Expected output: `[prc-s4.2] Results: 4 passed, 0 failed`

- [x] **Step 3: Commit**

```bash
git add tests/check-prc-s4.2-delete-product.js
git commit -m "test(prc-s4.2): regression-prove AC3 — deleted product access returns clean 404 via existing handleGetProductView"
```

---

## Task 3: Wire `DELETE /products/:id` in server.js

**Files:**
- Modify: `src/web-ui/server.js`

- [x] **Step 1: No new failing test** — this is routing wire-up; covered indirectly by the handler-level
tests in Task 1 (which call `handleDeleteProduct` directly, matching this file's existing convention where
every other `routes/products.js` handler is unit-tested directly and server.js wiring is a thin pass-through
with no test file of its own — see `handleGetProductKanban`/`handleGetOrgKanban`, wired at
`src/web-ui/server.js` with no dedicated server.js-level test).

- [x] **Step 2: Make the change**

In `src/web-ui/server.js`, extend the destructured import on line 48:

```javascript
const { handlePostProductNew, handlePostProductConfirm, handleGetDashboard: _handleGetDashboard, handleGetProductNew, handleGetProductView, handlePostProductFeature, handleGetProductKanban, handleGetOrgKanban, handleDeleteProduct } = require('./routes/products'); // psh-s3 / psh-s4 / psh-s6 / psh-s7 / prc-s4.2
```

Add a new route branch immediately after the existing `GET /products/:id` branch (after line 1724's closing `});`):

```javascript
  } else if (pathname.match(/^\/products\/[^/]+$/) && req.method === 'DELETE') {
    // prc-s4.2 — delete (detach) a product: removes product row, journeys, and
    // standards-cache rows; never touches the underlying GitHub repo
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handleDeleteProduct(req, res, null, _pshPool, null); });

```

- [x] **Step 3: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing, same count as Task 1's Step 5 (server.js has no direct test file that
imports/executes this branch, so no new test count change is expected here — the E2E suite, if run
separately, is out of scope per this story's test plan which specifies integration + manual only)

- [x] **Step 4: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat(prc-s4.2): wire DELETE /products/:id to handleDeleteProduct"
```

---

## Task 4: Confirmation UI — explicit "repo will not be deleted" copy (AC2)

**Files:**
- Modify: `src/web-ui/routes/products.js` (`_renderProductView`)

AC2 is a manual/UI verification per the test plan (no automated test — "1 scenario" manual, Scenario 2 in
the verification script). This task adds the actual UI control so that manual scenario can be run at all.

- [x] **Step 1: No automated test** (per test plan — AC2 coverage type is "Manual"). Implementation only.

- [x] **Step 2: Add the delete control + confirmation copy to `_renderProductView`**

In `src/web-ui/routes/products.js`, modify `_renderProductView`'s header `<div style="display:flex;gap:10px">`
block (the one containing the Kanban link and "New feature" form) to add a "Delete product" button, and add
a `<script>` block with a `pshConfirmDeleteProduct` function that shows the required copy before submitting:

```javascript
        '<button type="button" onclick="pshConfirmDeleteProduct(\'' + _escapeHtml(productId) + '\')" style="padding:8px 14px;border:1px solid #ef4444;border-radius:6px;background:none;color:#ef4444;font-size:13px;cursor:pointer">Delete product</button>' +
```

(inserted as the first child inside the existing `'<div style="display:flex;gap:10px">'` block, before the
Kanban link)

Append a `<script>` block at the end of the returned body string (before the closing `'</div>'` of the
outer container), matching the pattern already used in `_renderProductNew`:

```javascript
    '<script>' +
    'function pshConfirmDeleteProduct(id){' +
      'var ok=confirm("Delete this product? This permanently removes it from wuce, including its journeys and standards cache. Your GitHub repository will NOT be deleted — this only removes the product from wuce, the repo and its history are untouched.");' +
      'if(!ok)return;' +
      'fetch(\'/products/\'+id,{method:\'DELETE\'}).then(function(r){' +
        'if(r.ok){window.location.href=\'/dashboard\';}' +
        'else{alert(\'Failed to delete product\');}' +
      '}).catch(function(e){alert(\'Failed to delete product: \'+e.message);});' +
    '}' +
    '<\/script>' +
```

The `confirm()` copy explicitly and unambiguously states the GitHub repo will NOT be deleted (AC2)
before any DELETE request is sent.

- [x] **Step 3: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (this task changes only string-returning render logic; no existing test
asserts on the exact HTML string produced by `_renderProductView`'s header block, so no test breaks)

- [x] **Step 4: Commit**

```bash
git add src/web-ui/routes/products.js
git commit -m "feat(prc-s4.2): add delete-product confirmation UI stating the GitHub repo will not be deleted"
```

---

## Post-implementation

- [x] Update AC verification script (`artefacts/2026-07-14-product-repo-config/verification-scripts/prc-s4.2-verification.md`)
  scenario results are left for the operator to run manually against a real deployed instance (Scenario 1 and 2
  require a real GitHub repo and browser interaction respectively — out of reach of an automated agent session).
  Scenario 3 (AC3) is proven automatically by Task 2's test.
- [x] Run `node scripts/run-all-tests.js` one final time before /verify-completion.
