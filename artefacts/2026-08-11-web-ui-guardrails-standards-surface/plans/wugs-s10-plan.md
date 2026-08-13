# Audit-log promotion request, approval, and rejection events — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — three PostHog events (`guardrail_promotion_requested`, `guardrail_promotion_approved`, `guardrail_promotion_rejected`) fire on the real state changes wugs-s8/wugs-s9 already built, fail-open so a capture failure never blocks the underlying action (AC4).
**Branch:** `feature/wugs-s10`
**Worktree:** `.worktrees/wugs-s10`
**Test command:** `node tests/check-wugs-s10-audit-log-promotion-events.js` (per task) / `npm test` (full suite, final step)

---

## File map

```
Create:
  tests/check-wugs-s10-audit-log-promotion-events.js   — AC1-AC4

Modify:
  src/web-ui/routes/products.js — _requestPromotion, handlePostRequestPromotion,
                                   handlePostApprovePromotion, handlePostRejectPromotion
```

**Design note — the real capture convention this story must follow (read directly from the merged code, not just the story text):** `products.js:3` already imports `var _posthog = require('../modules/posthog-server');`. The established injectable pattern used throughout this file (`_designateOrgRepo`/`handlePostOrgRepoSettings`, `handleDeleteProduct`, `handlePutProductEdit`, etc.) is: the handler function takes an optional trailing `posthog` parameter, and internally does `var _ph = posthog || _posthog;` before calling `_ph.capture(distinctId, eventName, properties)`. This story adds that same optional `posthog` parameter to `_requestPromotion`, `handlePostRequestPromotion`, `handlePostApprovePromotion`, and `handlePostRejectPromotion` — no new adapter, no change to `server.js`'s route wiring (every existing call site of this pattern in `server.js`, e.g. `handlePostOrgRepoSettings` at `server.js:3227`, omits the `posthog` arg entirely and relies on the internal `|| _posthog` fallback to the real module — production behaviour is unaffected by this story).

**Design note — the real `capture()` signature:** `src/web-ui/modules/posthog-server.js:12` — `function capture(distinctId, event, properties, groups)`. It's a no-op if `POSTHOG_KEY` isn't set, and internally swallows network errors via `req.on('error', function() {})` — but it does not promise it can never throw synchronously (e.g. `JSON.stringify` on a malformed properties object), and the test plan explicitly requires proving the fail-open guarantee against a mock that throws synchronously or rejects. Every new call site in this story wraps `_ph.capture(...)` in `try { ... } catch (_) {}` — defensive, matching AC4's literal wording ("a logging failure must never block or roll back the actual state change") rather than relying on the current real implementation's own robustness.

**Design note — where each event fires (reusing wugs-s8/wugs-s9's real, merged code):**
- `guardrail_promotion_requested` fires inside `_requestPromotion` (`products.js:1668`) only on the actual-INSERT branch (`alreadyExisted: false`) — not on the idempotent "return existing pending" branch, since AC1 says "Given a promotion request **is created**... **when it's created**." Properties: `tenantId`, `productId`, `requestId` (the new `inserted.request_id`), `filePath`.
- `guardrail_promotion_approved` fires inside `handlePostApprovePromotion` (`products.js:1784`) only on the 200 success path, after the PR-number-recording UPDATE succeeds — not on the 409 (already resolved), 422 (no org repo), 403 (non-admin), or 500/409 (write failure) paths. Properties: `tenantId`, `requestId`, `approvedBy` (=`login`), `prNumber` (=`writeResult.prNumber`).
- `guardrail_promotion_rejected` fires inside `handlePostRejectPromotion` (`products.js:1841`) only on the 200 success path — not on 403 or 409. Properties: `tenantId`, `requestId`, `rejectedBy` (=`login`).

**Design note on NFR-SEC (no PII/credential content):** all three events' properties are IDs (`tenantId`, `productId`, `requestId`) and a repo-relative file path (`filePath`) — never `token`, `accessToken`, or file content (`content_snapshot`). Covered by a dedicated test asserting the captured properties object contains none of the request's session/token fields.

---

## Task 1: AC1 — request fires `guardrail_promotion_requested`, fail-open (AC4 request path)

**Files:**
- Create: `tests/check-wugs-s10-audit-log-promotion-events.js`
- Modify: `src/web-ui/routes/products.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-wugs-s10-audit-log-promotion-events.js`:

```javascript
'use strict';
// check-wugs-s10-audit-log-promotion-events.js — wugs-s10
//
// Unit/integration tests for PostHog audit-log capture on promotion
// request/approve/reject events — fail-open (a capture failure must never
// block the underlying state change).

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
var guardrailPrAdapter = require('../src/web-ui/adapters/guardrail-pr-adapter');

function mockPosthog(captureFn) {
  return { capture: captureFn };
}

function mockReq(overrides) {
  return Object.assign({
    params: { requestId: 'req-1' },
    body: { _csrf: 'ct1' },
    session: { accessToken: 'tok', tenantId: 't1', login: 'admin-alice', role: 'admin', csrfToken: 'ct1' }
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

function makeMockPool(state) {
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (/SELECT request_id, status FROM guardrail_promotion_requests WHERE tenant_id = \$1 AND product_id = \$2 AND file_path = \$3 AND status = \$4/i.test(s)) {
        return { rows: state.existingPending ? [state.existingPending] : [] };
      }
      if (/INSERT INTO guardrail_promotion_requests/i.test(s)) {
        return { rows: [{ request_id: state.newRequestId || 'req-new-1', status: 'pending' }] };
      }
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        return { rows: state.prodRow ? [state.prodRow] : [] };
      }
      return { rows: [] };
    }
  };
}

var originalFetchRepoPath = require('../src/web-ui/adapters/artefact-fetcher').fetchRepoPath;

(async () => {

// ── AC1: request creation fires guardrail_promotion_requested ───────────
await checkAsync('AC1: requestPromotion_fires_guardrailPromotionRequested', async () => {
  var captured = null;
  var ph = mockPosthog(function (distinctId, event, properties) {
    captured = { distinctId: distinctId, event: event, properties: properties };
  });
  var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
  var originalFetch = artefactFetcher.fetchRepoPath;
  artefactFetcher.fetchRepoPath = async function () { return 'CURRENT CONTENT'; };
  try {
    var pool = makeMockPool({ existingPending: null, newRequestId: 'req-new-1' });
    var result = await products._requestPromotion(pool, 't1', 'p1', 'standards/saas-gui.md', 'alice', 'org', 'repo', 'tok', ph);
    assert.strictEqual(result.alreadyExisted, false);
    assert.ok(captured, 'expected .capture() to be called');
    assert.strictEqual(captured.event, 'guardrail_promotion_requested');
    assert.strictEqual(captured.properties.tenantId, 't1');
    assert.strictEqual(captured.properties.productId, 'p1');
    assert.strictEqual(captured.properties.requestId, 'req-new-1');
    assert.strictEqual(captured.properties.filePath, 'standards/saas-gui.md');
  } finally {
    artefactFetcher.fetchRepoPath = originalFetch;
  }
});

// ── AC4 (request path): capture failure doesn't block request creation ──
await checkAsync('AC4: requestPromotion_captureThrows_stillCreatesRequest', async () => {
  var ph = mockPosthog(function () { throw new Error('simulated PostHog failure'); });
  var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
  var originalFetch = artefactFetcher.fetchRepoPath;
  artefactFetcher.fetchRepoPath = async function () { return 'CURRENT CONTENT'; };
  try {
    var pool = makeMockPool({ existingPending: null, newRequestId: 'req-new-2' });
    var result = await products._requestPromotion(pool, 't1', 'p1', 'standards/saas-gui.md', 'alice', 'org', 'repo', 'tok', ph);
    assert.strictEqual(result.alreadyExisted, false, 'expected the request to still be created despite the capture failure');
    assert.strictEqual(result.requestId, 'req-new-2');
  } finally {
    artefactFetcher.fetchRepoPath = originalFetch;
  }
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s10-audit-log-promotion-events.js
```

Expected: both tests fail — `captured` stays `null` (no capture call exists yet) / the require path for `artefact-fetcher` may need adjusting once you confirm the real module path (`grep -n "_artefactFetcher = require" src/web-ui/routes/products.js` to get the exact relative path before finalizing the test's require line).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, modify `_requestPromotion` and `handlePostRequestPromotion`:

```javascript
async function _requestPromotion(pool, tenantId, productId, filePath, requestedBy, owner, repo, token, posthog) {
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

  // wugs-s10 -- fail-open audit capture (AC1/AC4): a PostHog failure must
  // never block or roll back the request that was just created.
  var _ph = posthog || _posthog;
  try {
    _ph.capture(tenantId, 'guardrail_promotion_requested', {
      tenantId: tenantId,
      productId: productId,
      requestId: inserted.request_id,
      filePath: filePath
    });
  } catch (_) { /* fail-open, per AC4 */ }

  return { requestId: inserted.request_id, status: inserted.status, alreadyExisted: false };
}
```

Update `handlePostRequestPromotion`'s call site to pass `posthog` through (add an optional trailing `posthog` param to the handler itself, matching `handlePostOrgRepoSettings`'s exact shape, and thread it into the `_requestPromotion(...)` call).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s10-audit-log-promotion-events.js
```

Expected: `2 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node tests/check-wugs-s8-request-promotion.js
node tests/check-wugs-s9-approve-reject-promotion.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s10-audit-log-promotion-events.js
git commit -m "feat(wugs-s10): guardrail_promotion_requested audit event, fail-open (AC1/AC4)"
```

---

## Task 2: AC2 — approval fires `guardrail_promotion_approved`, fail-open (AC4 approve path)

**Files:**
- Modify: `src/web-ui/routes/products.js`, `tests/check-wugs-s10-audit-log-promotion-events.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC2: approval fires guardrail_promotion_approved ─────────────────────
await checkAsync('AC2: approveRequest_fires_guardrailPromotionApproved', async () => {
  var captured = null;
  var ph = mockPosthog(function (distinctId, event, properties) {
    captured = { distinctId: distinctId, event: event, properties: properties };
  });
  var calls = [];
  var pool = {
    query: async function (sql, params) {
      var s = String(sql);
      calls.push({ sql: s, params: params });
      if (/SELECT repo_owner, repo_name FROM tenant_org_repo WHERE tenant_id/i.test(s)) {
        return { rows: [{ repo_owner: 'org-co', repo_name: 'org-repo' }] };
      }
      if (/UPDATE guardrail_promotion_requests SET status = \$1, resolved_by = \$2, resolved_at = NOW\(\)/i.test(s)) {
        return { rows: [{ request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }] };
      }
      return { rows: [] };
    }
  };
  await withMockedWriteAdapter(async function () { return { prNumber: 55, prUrl: 'https://github.com/org-co/org-repo/pull/55' }; }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handlePostApprovePromotion(req, res, null, pool, ph);
    assert.strictEqual(res._get().statusCode, 200);
    assert.ok(captured, 'expected .capture() to be called');
    assert.strictEqual(captured.event, 'guardrail_promotion_approved');
    assert.strictEqual(captured.properties.tenantId, 't1');
    assert.strictEqual(captured.properties.requestId, 'req-1');
    assert.strictEqual(captured.properties.approvedBy, 'admin-alice');
    assert.strictEqual(captured.properties.prNumber, 55);
  });
});

// ── AC4 (approve path): capture failure doesn't block approval ──────────
await checkAsync('AC4: approveRequest_captureThrows_stillApproves', async () => {
  var ph = mockPosthog(function () { throw new Error('simulated PostHog failure'); });
  var pool = {
    query: async function (sql) {
      var s = String(sql);
      if (/SELECT repo_owner, repo_name FROM tenant_org_repo WHERE tenant_id/i.test(s)) {
        return { rows: [{ repo_owner: 'org-co', repo_name: 'org-repo' }] };
      }
      if (/UPDATE guardrail_promotion_requests SET status = \$1, resolved_by = \$2, resolved_at = NOW\(\)/i.test(s)) {
        return { rows: [{ request_id: 'req-2', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }] };
      }
      return { rows: [] };
    }
  };
  await withMockedWriteAdapter(async function () { return { prNumber: 56, prUrl: 'x' }; }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handlePostApprovePromotion(req, res, null, pool, ph);
    assert.strictEqual(res._get().statusCode, 200, 'expected approval to still succeed despite the capture failure');
  });
});
```

You will need to copy this test file's `withMockedWriteAdapter` helper from `tests/check-wugs-s9-approve-reject-promotion.js` (same shape: `guardrailPrAdapter.setGuardrailPrAdapter`/`getGuardrailPrAdapter`) into this file, near the top, since this is a separate test file.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s10-audit-log-promotion-events.js
```

Expected: both new tests fail — `handlePostApprovePromotion` doesn't yet accept/use a `posthog` param, so `captured` stays `null`.

- [ ] **Step 3: Write minimal implementation**

In `handlePostApprovePromotion`, add an optional trailing `posthog` parameter, and fire the capture call only in the success branch, after the `pr_number` UPDATE:

```javascript
async function handlePostApprovePromotion(req, res, _next, pool, posthog) {
  // ...unchanged CSRF guard, role gate, org-repo check, atomic claim...
  try {
    var writeResult = await _guardrailPrAdapter.createGuardrailPr(token, orgRow.repo_owner, orgRow.repo_name, claimed.file_path, claimed.content_snapshot, {
      tenantId: tenantId,
      productId: claimed.product_id
    });
    await pool.query('UPDATE guardrail_promotion_requests SET pr_number = $1 WHERE request_id = $2', [writeResult.prNumber, requestId]);

    // wugs-s10 -- fail-open audit capture (AC2/AC4).
    var _ph = posthog || _posthog;
    try {
      _ph.capture(tenantId, 'guardrail_promotion_approved', {
        tenantId: tenantId,
        requestId: requestId,
        approvedBy: login,
        prNumber: writeResult.prNumber
      });
    } catch (_) { /* fail-open, per AC4 */ }

    if (res.status) { res.status(200).json({ ok: true, prNumber: writeResult.prNumber, prUrl: writeResult.prUrl }); }
    else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, prNumber: writeResult.prNumber, prUrl: writeResult.prUrl })); }
  } catch (writeErr) {
    // ...unchanged...
  }
}
```

Update `server.js`'s route wiring for the approve route only if it needs to keep working unchanged — it does not need to change, since `posthog` defaults via `|| _posthog` when the route doesn't pass one (matching `handlePostOrgRepoSettings`'s established convention).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s10-audit-log-promotion-events.js
```

Expected: `4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node tests/check-wugs-s9-approve-reject-promotion.js
```

Expected: `10 passed, 0 failed` (the `posthog` param is additive/optional — every existing call site omits it and falls back to the real module, so no existing test should need changes).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s10-audit-log-promotion-events.js
git commit -m "feat(wugs-s10): guardrail_promotion_approved audit event, fail-open (AC2/AC4)"
```

---

## Task 3: AC3 — rejection fires `guardrail_promotion_rejected`, fail-open (AC4 reject path) + NFR-SEC + final regression

**Files:**
- Modify: `src/web-ui/routes/products.js`, `tests/check-wugs-s10-audit-log-promotion-events.js`

- [ ] **Step 1: Write the failing tests**

Add before the final `console.log`:

```javascript
// ── AC3: rejection fires guardrail_promotion_rejected ────────────────────
await checkAsync('AC3: rejectRequest_fires_guardrailPromotionRejected', async () => {
  var captured = null;
  var ph = mockPosthog(function (distinctId, event, properties) {
    captured = { distinctId: distinctId, event: event, properties: properties };
  });
  var pool = {
    query: async function (sql) {
      var s = String(sql);
      if (/UPDATE guardrail_promotion_requests SET status = \$1, resolved_by = \$2, resolved_at = NOW\(\)/i.test(s)) {
        return { rows: [{ request_id: 'req-3', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }] };
      }
      return { rows: [] };
    }
  };
  var req = mockReq();
  var res = mockRes();
  await products.handlePostRejectPromotion(req, res, null, pool, ph);
  assert.strictEqual(res._get().statusCode, 200);
  assert.ok(captured, 'expected .capture() to be called');
  assert.strictEqual(captured.event, 'guardrail_promotion_rejected');
  assert.strictEqual(captured.properties.tenantId, 't1');
  assert.strictEqual(captured.properties.requestId, 'req-3');
  assert.strictEqual(captured.properties.rejectedBy, 'admin-alice');
});

// ── AC4 (reject path): capture failure doesn't block rejection ──────────
await checkAsync('AC4: rejectRequest_captureThrows_stillRejects', async () => {
  var ph = mockPosthog(function () { throw new Error('simulated PostHog failure'); });
  var pool = {
    query: async function (sql) {
      var s = String(sql);
      if (/UPDATE guardrail_promotion_requests SET status = \$1, resolved_by = \$2, resolved_at = NOW\(\)/i.test(s)) {
        return { rows: [{ request_id: 'req-4', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }] };
      }
      return { rows: [] };
    }
  };
  var req = mockReq();
  var res = mockRes();
  await products.handlePostRejectPromotion(req, res, null, pool, ph);
  assert.strictEqual(res._get().statusCode, 200, 'expected rejection to still succeed despite the capture failure');
});

// ── NFR-SEC: no PII/credential content in any captured event ────────────
check('NFR-SEC: capturedProperties_neverContainTokenOrContent', () => {
  var forbidden = ['token', 'accessToken', 'content', 'content_snapshot', 'csrfToken'];
  // Static check: read the source and confirm none of the three capture
  // call sites reference these field names inside their properties object.
  var fs = require('fs');
  var src = fs.readFileSync(require.resolve('../src/web-ui/routes/products.js'), 'utf8');
  var captureBlocks = src.match(/_ph\.capture\([^)]*\{[^}]*\}/g) || [];
  var promotionCaptureBlocks = captureBlocks.filter(function (b) { return /guardrail_promotion_(requested|approved|rejected)/.test(b); });
  assert.ok(promotionCaptureBlocks.length >= 3, 'expected to find all 3 promotion capture call sites in source');
  promotionCaptureBlocks.forEach(function (block) {
    forbidden.forEach(function (field) {
      assert.ok(block.indexOf(field) === -1, 'capture block unexpectedly references "' + field + '": ' + block);
    });
  });
});
```

- [ ] **Step 2: Run tests — first two must fail, NFR-SEC check should already pass once Tasks 1-2's blocks exist (partial) but will fail until this task's own block is added too (since it asserts >= 3 blocks)**

```bash
node tests/check-wugs-s10-audit-log-promotion-events.js
```

- [ ] **Step 3: Write minimal implementation**

In `handlePostRejectPromotion`, add an optional trailing `posthog` parameter, fire the capture call only in the 200 success branch:

```javascript
async function handlePostRejectPromotion(req, res, _next, pool, posthog) {
  // ...unchanged CSRF guard, role gate...
  var claimed = await _resolvePromotionRequest(pool, tenantId, requestId, 'rejected', login);
  if (!claimed) {
    // ...unchanged 409...
    return;
  }

  // wugs-s10 -- fail-open audit capture (AC3/AC4).
  var _ph = posthog || _posthog;
  try {
    _ph.capture(tenantId, 'guardrail_promotion_rejected', {
      tenantId: tenantId,
      requestId: requestId,
      rejectedBy: login
    });
  } catch (_) { /* fail-open, per AC4 */ }

  if (res.status) { res.status(200).json({ ok: true }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true })); }
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s10-audit-log-promotion-events.js
```

Expected: `9 passed, 0 failed`

- [ ] **Step 5: Full regression + story-level check**

```bash
node tests/check-wugs-s10-audit-log-promotion-events.js
node tests/check-wugs-s9-approve-reject-promotion.js
node tests/check-wugs-s8-request-promotion.js
node tests/check-wugs-s6-branch-pr-creation-adapter.js
node tests/check-wugs-s3-org-level-guardrails-view.js
```

```bash
npm test
```

Expected: same 33 pre-existing baseline failures (see `decisions.md` RISK-ACCEPT for `wugs-s10`), 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s10-audit-log-promotion-events.js
git commit -m "feat(wugs-s10): guardrail_promotion_rejected audit event, fail-open (AC3/AC4) + NFR-SEC lock-in"
```

---

## Final story-level check (before /verify-completion)

After all 3 tasks: `node tests/check-wugs-s10-audit-log-promotion-events.js` → `9 passed, 0 failed`, plus all sibling regression files unchanged, plus `npm test` at the documented baseline. This is the terminal story in Epic 3's walking skeleton — after it merges, `m2` (Product→org promotion-approval workflow usage) becomes fully measurable via a real PostHog event count, closing out the epic's own benefit-metric linkage.
