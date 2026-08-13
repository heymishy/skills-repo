# Request a product-level guardrail/standard be promoted to org level — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — a new `guardrail_promotion_requests` table, a request-creation handler (idempotent against duplicate pending requests, tenant-scoped), and a "pending approval" indicator on the product-level view.
**Branch:** `feature/wugs-s8`
**Worktree:** `.worktrees/wugs-s8`
**Test command:** `node tests/check-wugs-s8-request-promotion.js` (per task) / `npm test` (full suite, final step)

---

## File map

```
Create:
  tests/check-wugs-s8-request-promotion.js   — AC1-AC4

Modify:
  src/web-ui/server.js          — CREATE TABLE IF NOT EXISTS guardrail_promotion_requests (ADR-003),
                                   wire POST /products/:id/guardrails/promote route
  src/web-ui/routes/products.js — _requestPromotion, handlePostRequestPromotion,
                                   _resolvePendingPromotions, pending-promotion indicator
                                   wired into handleGetProductGuardrailsView / _renderGuardrailsSection
```

**Design note on where the CSRF token comes from for the new form:** `handleGetProductGuardrailsView` doesn't currently generate a CSRF token (the existing product-level `_renderGuardrailsSection` only has Edit `<a>` links, GET requests, no forms). This story's new "Request promotion" button is a `POST`, so it needs one — mirroring the exact pattern already used elsewhere in this file (search for `_csrf.generateCsrfToken(req)`, e.g. in the modules-management render): call `_csrf.generateCsrfToken(req)` once in `handleGetProductGuardrailsView`, thread it through to `_renderGuardrailsSection` as a new parameter, embed it as a hidden `_csrf` input in the promotion form.

**Design note on content_snapshot's source:** the story's Architecture Constraints require the snapshot to be the entry's CURRENT content at request time. The server must read this itself (via `wugs-s1`'s `fetchRepoPath`, same as the normal view-render read), not trust client-submitted content — a client-supplied "current content" field would be a tampering vector (a user could submit content they never actually had at their product, then have it end up promoted as if it were real). The request-promotion form therefore only submits the `path`; the handler re-fetches the real current content server-side before snapshotting.

**Design note on why one function (`_requestPromotion`) satisfies both AC1 and AC2:** "check for an existing pending row, INSERT only if none exists" is a single idempotent operation — AC1 (create) and AC2 (no duplicate) are two assertions about the same code path, not two different behaviors. Same proven pattern as `wugs-s7`'s `_resolveAllPendingPrs` handling all three PR states in one function.

---

## Task 1: Request-creation table + idempotent handler, tenant-scoped (AC1)

**Files:**
- Create: `tests/check-wugs-s8-request-promotion.js`
- Modify: `src/web-ui/server.js`, `src/web-ui/routes/products.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-wugs-s8-request-promotion.js`:

```javascript
'use strict';
// check-wugs-s8-request-promotion.js — wugs-s8
//
// Unit/integration tests for requesting a product-level guardrail/standard
// be promoted to org level: creates a guardrail_promotion_requests row
// (idempotent against duplicate pending requests), tenant-scoped.

var assert = require('assert');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try { fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

async function checkAsync(name, fn) {
  try { await fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

var products = require('../src/web-ui/routes/products');
var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');

function mockReq(overrides) {
  return Object.assign({
    params: { id: 'p1' },
    session: { accessToken: 'tok', tenantId: 't1', login: 'alice', csrfToken: 'ct1' }
  }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    status: function (c) { _statusCode = c; return this; },
    json: function (b) { _body = JSON.stringify(b); },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

// Mock pool: product lookup, guardrail_promotion_requests rows/inserts.
// `state.pendingRow` simulates an existing pending row for the tested path
// (null = none). `calls` records every query for assertion.
function makeMockPool(state, calls) {
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (calls) calls.push({ sql: s, params: params });
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        var pid = params && params[0];
        var row = pid === 'p-tenant-b'
          ? { name: 'Tenant B Product', tenant_id: 't2', repo_owner: 'bravo', repo_name: 'stuff' }
          : { name: 'Test Product', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' };
        return { rows: [row] };
      }
      if (/SELECT .* FROM guardrail_promotion_requests WHERE tenant_id.*product_id.*file_path.*status/i.test(s)) {
        return { rows: state.pendingRow ? [state.pendingRow] : [] };
      }
      if (/INSERT INTO guardrail_promotion_requests/i.test(s)) {
        return { rows: [{ request_id: 'req-1', status: 'pending' }] };
      }
      return { rows: [] };
    }
  };
}

async function withMockedFetchRepoPath(mockFn, testFn) {
  var original = artefactFetcher.getFetchRepoPath();
  artefactFetcher.setFetchRepoPath(mockFn);
  try { await testFn(); } finally { artefactFetcher.setFetchRepoPath(original); }
}

(async () => {

// ── AC1: request creates a row with a content snapshot ──────────────────
await checkAsync('AC1: requestPromotion_newRequest_createsRowWithSnapshot', async () => {
  var calls = [];
  var pool = makeMockPool({ pendingRow: null }, calls);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === 'standards/saas-gui.md') { return 'REAL CURRENT CONTENT'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq({ body: { path: 'standards/saas-gui.md', _csrf: 'ct1' } });
    var res = mockRes();
    await products.handlePostRequestPromotion(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode + ' body: ' + result.body);
    var insertCall = calls.find(function (c) { return /INSERT INTO guardrail_promotion_requests/i.test(c.sql); });
    assert.ok(insertCall, 'expected an INSERT INTO guardrail_promotion_requests');
    assert.strictEqual(insertCall.params[0], 't1', 'expected the real tenant_id');
    assert.strictEqual(insertCall.params[1], 'p1', 'expected the real product_id');
    assert.strictEqual(insertCall.params[2], 'standards/saas-gui.md', 'expected the real file_path');
    assert.strictEqual(insertCall.params[3], 'REAL CURRENT CONTENT', 'expected the real, server-fetched current content as the snapshot -- not client-submitted content');
    assert.strictEqual(insertCall.params[4], 'pending', 'expected status pending');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s8-request-promotion.js
```

Expected: `FAIL: AC1: ... — products.handlePostRequestPromotion is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, add near the other `CREATE TABLE IF NOT EXISTS` blocks for this feature (search for `wugs-s7: guardrail_pending_prs table`, add right after that whole block):

```javascript
    // wugs-s8: guardrail_promotion_requests table — tracks a tech lead's
    // request to promote a product-level guardrail/standard to org level.
    // content_snapshot taken at request time (not re-read at approval),
    // per the story's own Architecture Constraints -- immune to the
    // product-level file changing between request and approval.
    _creditsPool.query(`CREATE TABLE IF NOT EXISTS guardrail_promotion_requests (
      request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR NOT NULL,
      product_id UUID NOT NULL,
      file_path VARCHAR NOT NULL,
      content_snapshot TEXT NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      requested_by VARCHAR NOT NULL,
      requested_at TIMESTAMPTZ DEFAULT NOW()
    )`).then(function() {
      console.log('[wugs-s8] guardrail_promotion_requests table ready');
    }).catch(function(err) {
      console.error('[wugs-s8] guardrail_promotion_requests migration failed:', err.message);
    });
```

In `src/web-ui/routes/products.js`, add near `_trackPendingPr` (after it, or in a sensible neighbourhood with the other guardrails-view helpers — read the current file structure first):

```javascript
/**
 * wugs-s8 — creates a promotion request if none is pending for this exact
 * tenant/product/path, or returns the existing pending one (AC1/AC2 are
 * the same idempotent operation, not two different code paths).
 * @returns {Promise<{requestId: string, status: string, alreadyExisted: boolean}>}
 */
async function _requestPromotion(pool, tenantId, productId, filePath, requestedBy, owner, repo, token) {
  var existing = (await pool.query(
    'SELECT request_id, status FROM guardrail_promotion_requests WHERE tenant_id = $1 AND product_id = $2 AND file_path = $3 AND status = $4',
    [tenantId, productId, filePath, 'pending']
  )).rows[0];
  if (existing) {
    return { requestId: existing.request_id, status: existing.status, alreadyExisted: true };
  }
  var currentContent = await _artefactFetcher.fetchRepoPath(owner, repo, filePath, token);
  var inserted = (await pool.query(
    'INSERT INTO guardrail_promotion_requests (tenant_id, product_id, file_path, content_snapshot, status, requested_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING request_id, status',
    [tenantId, productId, filePath, currentContent, 'pending', requestedBy]
  )).rows[0];
  return { requestId: inserted.request_id, status: inserted.status, alreadyExisted: false };
}

/**
 * wugs-s8 — POST /products/:id/guardrails/promote: tenant-scoped (AC4,
 * matching handlePostGuardrailsForm's own 404-not-403 FORBIDDEN-vs-NOT_FOUND
 * convention), CSRF-guarded (matching every other mutating form in this
 * file). Delegates to _requestPromotion for the idempotent create-or-return.
 */
async function handlePostRequestPromotion(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  req.body = await _readBody(req);
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var login = req.session && req.session.login;
  var token = req.session && req.session.accessToken;
  var filePath = (req.body && req.body.path) || '';

  var prodRow = (await pool.query(
    'SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }

  var result = await _requestPromotion(pool, tenantId, productId, filePath, login, prodRow.repo_owner, prodRow.repo_name, token);
  if (res.status) { res.status(200).json({ ok: true, result: result }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, result: result })); }
}
```

Add `_requestPromotion` and `handlePostRequestPromotion` to `module.exports`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s8-request-promotion.js
```

Expected: `1 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

Also explicitly run `node tests/check-wugs-s2-product-level-guardrails-view.js` (expect 11/11), `node tests/check-wugs-s3-org-level-guardrails-view.js` (expect 12/12), `node tests/check-wugs-s5-create-edit-form.js` (expect 13/13), `node tests/check-wugs-s6-branch-pr-creation-adapter.js` (expect 18/18), `node tests/check-wugs-s7-surface-pr-state-in-view.js` (expect 8/8), `node tests/check-wugs-s4-no-connected-repo-fallback.js` (expect 7/7).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js src/web-ui/routes/products.js tests/check-wugs-s8-request-promotion.js
git commit -m "feat(wugs-s8): guardrail_promotion_requests table + idempotent request handler (AC1)"
```

---

## Task 2: Duplicate pending request not re-created (AC2)

**Files:**
- Modify: `tests/check-wugs-s8-request-promotion.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC2: existing pending request — no duplicate created ────────────────
await checkAsync('AC2: requestPromotion_existingPending_returnsExistingNotDuplicate', async () => {
  var calls = [];
  var pool = makeMockPool({ pendingRow: { request_id: 'req-existing', status: 'pending' } }, calls);
  var req = mockReq({ body: { path: 'standards/saas-gui.md', _csrf: 'ct1' } });
  var res = mockRes();
  await products.handlePostRequestPromotion(req, res, null, pool);
  var result = res._get();
  assert.strictEqual(result.statusCode, 200);
  var insertCall = calls.find(function (c) { return /INSERT INTO guardrail_promotion_requests/i.test(c.sql); });
  assert.ok(!insertCall, 'expected NO new INSERT — a pending request already exists for this exact entry');
  var body = JSON.parse(result.body);
  assert.strictEqual(body.result.requestId, 'req-existing', 'expected the existing pending request to be returned, not a new one');
  assert.strictEqual(body.result.alreadyExisted, true);
});
```

- [ ] **Step 2: Run test — expected to already pass (behaviour built in Task 1)**

```bash
node tests/check-wugs-s8-request-promotion.js
```

Expected: `2 passed, 0 failed` — if it fails, that's the RED signal; fix `_requestPromotion`'s existing-row check.

- [ ] **Step 3: Write minimal implementation**

No implementation change expected.

- [ ] **Step 4: Run test — must pass**

Expected: `2 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s8-request-promotion.js
git commit -m "test(wugs-s8): lock in duplicate pending request is not re-created (AC2)"
```

---

## Task 3: Cross-tenant request rejected (AC4)

**Files:**
- Modify: `tests/check-wugs-s8-request-promotion.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC4: cross-tenant request rejected, no row created ───────────────────
await checkAsync('AC4: requestPromotion_crossTenantProduct_rejected', async () => {
  var calls = [];
  var pool = makeMockPool({ pendingRow: null }, calls);
  var req = mockReq({
    params: { id: 'p-tenant-b' },
    session: { accessToken: 'tok', tenantId: 't1', login: 'alice', csrfToken: 'ct1' },
    body: { path: 'standards/saas-gui.md', _csrf: 'ct1' }
  });
  var res = mockRes();
  await products.handlePostRequestPromotion(req, res, null, pool);
  var result = res._get();
  assert.strictEqual(result.statusCode, 404, 'expected 404 (FORBIDDEN-vs-NOT_FOUND convention), got: ' + result.statusCode);
  var insertCall = calls.find(function (c) { return /INSERT INTO guardrail_promotion_requests/i.test(c.sql); });
  assert.ok(!insertCall, 'expected no row created for a cross-tenant request');
});
```

- [ ] **Step 2: Run test — expected to already pass (behaviour built in Task 1)**

```bash
node tests/check-wugs-s8-request-promotion.js
```

Expected: `3 passed, 0 failed` — if it fails, fix the tenant-ownership check in `handlePostRequestPromotion`.

- [ ] **Step 3: Write minimal implementation**

No implementation change expected.

- [ ] **Step 4: Run test — must pass**

Expected: `3 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s8-request-promotion.js
git commit -m "test(wugs-s8): lock in cross-tenant request rejected with 404 (AC4)"
```

---

## Task 4: "Pending approval" indicator in the view (AC3) + wire the real route + final regression

**Files:**
- Modify: `src/web-ui/routes/products.js`, `src/web-ui/server.js`, `tests/check-wugs-s8-request-promotion.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC3: pending promotion shows an indicator on the next render ────────
await checkAsync('AC3: handleGetGuardrailsView_pendingPromotion_showsIndicator', async () => {
  var pool = {
    query: async function (sql, params) {
      var s = String(sql);
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        return { rows: [{ name: 'Test Product', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }] };
      }
      if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT journey_id FROM journeys WHERE tenant_id.*product_id IS NULL/i.test(s)) { return { rows: [] }; }
      if (/SELECT .* FROM tenant_org_repo WHERE tenant_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT .* FROM guardrail_pending_prs WHERE tenant_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT .* FROM guardrail_promotion_requests WHERE tenant_id.*product_id.*status/i.test(s)) {
        return { rows: [{ file_path: '.github/architecture-guardrails.md', status: 'pending' }] };
      }
      return { rows: [] };
    }
  };
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(/promotion requested.{0,20}pending approval/i.test(result.body), 'expected a "promotion requested, pending approval" indicator');
  });
});

// ── Wiring: POST /products/:id/guardrails/promote is routed in server.js ──
check('wiring: server_js_routes_postProductsIdGuardrailsPromote_to_handler', () => {
  var fs = require('fs');
  var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
  assert.ok(serverSrc.indexOf('guardrails/promote') !== -1, 'expected server.js to route POST /products/:id/guardrails/promote');
  assert.ok(serverSrc.indexOf('handlePostRequestPromotion') !== -1, 'expected server.js to reference handlePostRequestPromotion');
});
```

- [ ] **Step 2: Run tests — must fail**

```bash
node tests/check-wugs-s8-request-promotion.js
```

Expected: both fail — no `_resolvePendingPromotions`/indicator wiring in the view yet, and no route wired in `server.js`.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, add near `_requestPromotion` (after it):

```javascript
/**
 * wugs-s8 — fetches all pending promotion requests for a product, keyed
 * by file_path, so the view can show a "pending approval" indicator per
 * entry without an N+1 query per displayed entry.
 * @returns {Promise<Map<string, {requestId: string}>>}
 */
async function _resolvePendingPromotions(pool, tenantId, productId) {
  var rows = (await pool.query(
    'SELECT request_id, file_path, status FROM guardrail_promotion_requests WHERE tenant_id = $1 AND product_id = $2 AND status = $3',
    [tenantId, productId, 'pending']
  )).rows;
  var byPath = new Map();
  for (var i = 0; i < rows.length; i++) {
    byPath.set(rows[i].file_path, { requestId: rows[i].request_id });
  }
  return byPath;
}

/**
 * wugs-s8 — renders either the "Request promotion" form (real, keyboard-
 * accessible button per the story's own Accessibility NFR) or a "pending
 * approval" indicator, depending on whether a promotion request is
 * already pending for this exact path.
 */
function _renderPromotionAction(productId, path, csrfToken, pendingPromotion) {
  if (pendingPromotion) {
    return ' <span class="gv-promotion-pending" style="font-size:12px;color:var(--muted);margin-left:8px">Promotion requested — pending approval</span>';
  }
  return ' <form method="POST" action="/products/' + encodeURIComponent(productId) + '/guardrails/promote" style="display:inline;margin-left:8px">' +
    '<input type="hidden" name="path" value="' + _escapeHtml(path) + '">' +
    '<input type="hidden" name="_csrf" value="' + _escapeHtml(csrfToken) + '">' +
    '<button type="submit" style="font-size:12px;color:var(--accent);background:none;border:none;padding:0;cursor:pointer;text-decoration:underline">Request promotion</button>' +
  '</form>';
}
```

Read `handleGetProductGuardrailsView`'s CURRENT actual body first (its shape has changed across `wugs-s3`/`wugs-s7`/`wugs-s4` — do not assume any prior snippet matches). Add, after `pendingByPath` is resolved and before `_renderGuardrailsSection` is called:

```javascript
  var promotionByPath = await _resolvePendingPromotions(_pool, tenantId, productId);
  var csrfToken = _csrf.generateCsrfToken(req);
```

Then find `_renderGuardrailsSection`'s current call site and definition (read both fully first) and add `promotionByPath`/`csrfToken` as new parameters, appending `_renderPromotionAction(productId, guardrailsPath, csrfToken, promotionByPath.get(guardrailsPath))` to `guardrailsHtml`, and the same per-entry to each standards `<li>` (using `e.path` and `promotionByPath.get(e.path)`) — matching exactly how `pendingByPath`/`_renderPendingPrBadge` were threaded through in the `wugs-s7` story (same shape, one more Map/render-helper pair).

In `src/web-ui/server.js`: add `handlePostRequestPromotion` to the existing destructured `require('./routes/products')` import (search for `_trackPendingPr` in that line, add right after it). Find the existing `POST /products/:id/guardrails/form` route block (search for `guardrails\\/form\$/) && req.method === 'POST'`) and add the new route right after its closing, at the same nesting level:

```javascript
  } else if (pathname.match(/^\/products\/[^/]+\/guardrails\/promote$/) && req.method === 'POST') {
    // wugs-s8 -- request a product-level guardrail/standard be promoted to org level.
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handlePostRequestPromotion(req, res, null, _pshPool); });
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s8-request-promotion.js
```

Expected: `5 passed, 0 failed`

- [ ] **Step 5: Full regression + story-level check**

```bash
node tests/check-wugs-s8-request-promotion.js
node tests/check-wugs-s2-product-level-guardrails-view.js
node tests/check-wugs-s3-org-level-guardrails-view.js
node tests/check-wugs-s4-no-connected-repo-fallback.js
node tests/check-wugs-s5-create-edit-form.js
node tests/check-wugs-s6-branch-pr-creation-adapter.js
node tests/check-wugs-s7-surface-pr-state-in-view.js
```

All expected: 5/5, 11/11, 12/12, 7/7, 13/13, 18/18, 8/8.

```bash
npm test
```

Expected: same 33 pre-existing baseline failures (see `decisions.md` RISK-ACCEPT for `wugs-s8` — note one additional entry documenting a load-sensitive `pcr-s1` perf-check flake unrelated to this story, investigate if it recurs), 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js src/web-ui/server.js tests/check-wugs-s8-request-promotion.js
git commit -m "feat(wugs-s8): pending-promotion indicator in the view + wire real route (AC3)"
```

---

## Final story-level check (before /verify-completion)

After all 4 tasks: `node tests/check-wugs-s8-request-promotion.js` → `5 passed, 0 failed`, plus all six sibling regression files unchanged, plus `npm test` at the documented baseline. No manual pre-merge step required (no new external write surface — this is an internal DB-only request-tracking mechanism, no GitHub API calls).
