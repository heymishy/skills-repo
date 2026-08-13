# Admin approves or rejects a promotion request — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — admin-gated approve/reject endpoints for `wugs-s8`'s promotion requests, using a single conditional `UPDATE ... WHERE status = 'pending'` for race-safe resolution (AC5), reusing `wugs-s6`'s real write adapter on approval.
**Branch:** `feature/wugs-s9`
**Worktree:** `.worktrees/wugs-s9`
**Test command:** `node tests/check-wugs-s9-approve-reject-promotion.js` (per task) / `npm test` (full suite, final step)

---

## File map

```
Create:
  tests/check-wugs-s9-approve-reject-promotion.js   — AC1-AC5

Modify:
  src/web-ui/server.js          — ALTER TABLE guardrail_promotion_requests (ADR-003),
                                   wire POST /api/admin/promotions/:requestId/approve|reject routes
  src/web-ui/routes/products.js — _resolvePromotionRequest, handlePostApprovePromotion,
                                   handlePostRejectPromotion
```

**Design note — real schema this story builds on (read directly from `wugs-s8`'s merged code, not just its story text):** `guardrail_promotion_requests` currently has `request_id, tenant_id, product_id, file_path, content_snapshot, status, requested_by, requested_at` (confirmed in `src/web-ui/routes/products.js`'s `_requestPromotion`, merged `wugs-s8`). This story ADDs three columns via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`: `resolved_by`, `resolved_at`, `pr_number` (nullable — only set on successful approval). `_fetchOrgRepoRow(pool, tenantId)` (from `wugs-s3`, real signature confirmed) returns `{repo_owner, repo_name}|null`. `createGuardrailPr(token, owner, repo, targetPath, content, options)` (from `wugs-s6`, real signature confirmed) is the injectable write adapter — tests mock it via `setGuardrailPrAdapter`/`getGuardrailPrAdapter`, matching `wugs-s6`'s own test convention, not `global.fetch`.

**Design note on the atomic-claim mechanism (AC5):** per the story's own Architecture Constraints, resolution MUST be a single conditional `UPDATE ... WHERE request_id = $1 AND tenant_id = $2 AND status = 'pending' RETURNING ...`. Both approve and reject share this exact mechanism via `_resolvePromotionRequest(pool, tenantId, requestId, newStatus, resolvedBy)` — it returns the claimed row (with `file_path`/`content_snapshot`/`product_id`) if this call won the race, or `null` if the request was already resolved by someone else. Reject stops there (AC2 — no further action needed). Approve additionally calls `createGuardrailPr` using the claimed row's data, then does a SEPARATE, non-racy `UPDATE ... SET pr_number = $1 WHERE request_id = $2` (safe because this call already exclusively owns the row via the first atomic claim — no second admin can also be here, since their own claim attempt already failed at the first UPDATE).

**Design note on write-adapter failure after a successful claim (a scenario not directly covered by any of the 5 ACs, decided here explicitly rather than left ambiguous):** if `createGuardrailPr` throws AFTER the atomic claim has already flipped `status` to `'approved'`, leaving the request permanently `approved` with no `pr_number` would be a stuck, unrecoverable state (no way to retry). This plan's `handlePostApprovePromotion` reverts the row back to `status = 'pending'` (a compensating `UPDATE`, not itself racy since only the request owner from the failed write is doing this) and returns 500 — giving the admin a genuine retry path rather than a silent dead end. This is a deliberate design decision, not scope creep — flag it explicitly in the final story-level review as a decision worth confirming with the operator if it seems wrong.

**Design note on the route shape:** two REST-ish tenant-admin actions on a specific request, following this codebase's existing `/api/admin/*` naming convention (`/api/admin/credits/adjust`, `/api/admin/plan/set`) rather than nesting under `/products/:id` (a promotion request isn't fundamentally product-scoped from the admin's point of view — it's a tenant-wide admin queue item, even though it originated from a specific product): `POST /api/admin/promotions/:requestId/approve`, `POST /api/admin/promotions/:requestId/reject`.

**Design note on role gating:** the DoR explicitly names `isEffectivelyAdmin(req.session)` (from `modules/impersonation`, the same helper `credits-guard.js` uses) — NOT the `requireAdmin` middleware used by other `/api/admin/*` routes in `server.js`. This is a deliberate, DoR-specified choice (impersonation-safe effective-role check performed inline in the handler, matching `credits-guard.js`'s exact style: `if (req.session && isEffectivelyAdmin(req.session)) { ... }`), not an oversight — do not substitute `requireAdmin` even though it's the more common pattern for other admin routes in this file.

---

## Task 1: Approve — atomic claim, org-repo gate, write adapter, PR number recorded (AC1)

**Files:**
- Create: `tests/check-wugs-s9-approve-reject-promotion.js`
- Modify: `src/web-ui/server.js`, `src/web-ui/routes/products.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-wugs-s9-approve-reject-promotion.js`:

```javascript
'use strict';
// check-wugs-s9-approve-reject-promotion.js — wugs-s9
//
// Unit/integration tests for admin approve/reject of wugs-s8's promotion
// requests: race-safe resolution via a single conditional UPDATE, reuses
// wugs-s6's real write adapter on approval.

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

function mockReq(overrides) {
  return Object.assign({
    params: { requestId: 'req-1' },
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

// state.pendingRow: the row an UPDATE ... WHERE status='pending' should
// return (null = already resolved / no matching row). state.orgRepoRow:
// tenant_org_repo row (null = not designated). calls: records every query.
function makeMockPool(state, calls) {
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (calls) calls.push({ sql: s, params: params });
      if (/SELECT repo_owner, repo_name FROM tenant_org_repo WHERE tenant_id/i.test(s)) {
        return { rows: state.orgRepoRow ? [state.orgRepoRow] : [] };
      }
      if (/UPDATE guardrail_promotion_requests SET status = \$1, resolved_by = \$2, resolved_at = NOW\(\) WHERE request_id = \$3 AND tenant_id = \$4 AND status = \$5/i.test(s)) {
        return { rows: state.pendingRow ? [state.pendingRow] : [] };
      }
      if (/UPDATE guardrail_promotion_requests SET pr_number = \$1 WHERE request_id = \$2/i.test(s)) {
        return { rows: [] };
      }
      if (/UPDATE guardrail_promotion_requests SET status = 'pending' WHERE request_id/i.test(s)) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

async function withMockedWriteAdapter(mockFn, testFn) {
  var original = guardrailPrAdapter.getGuardrailPrAdapter();
  guardrailPrAdapter.setGuardrailPrAdapter(mockFn);
  try { await testFn(); } finally { guardrailPrAdapter.setGuardrailPrAdapter(original); }
}

(async () => {

// ── AC1: approval invokes wugs-s6's adapter, records PR number ──────────
await checkAsync('AC1: approveRequest_pending_invokesWriteAdapterAndRecordsPr', async () => {
  var calls = [];
  var pool = makeMockPool({
    orgRepoRow: { repo_owner: 'org-co', repo_name: 'org-repo' },
    pendingRow: { request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'SNAPSHOT CONTENT' }
  }, calls);
  await withMockedWriteAdapter(async function (token, owner, repo, targetPath, content, options) {
    assert.strictEqual(owner, 'org-co', 'expected the write to target the ORG repo, not the product repo');
    assert.strictEqual(repo, 'org-repo');
    assert.strictEqual(targetPath, 'standards/saas-gui.md', 'expected the request\'s own file_path');
    assert.strictEqual(content, 'SNAPSHOT CONTENT', 'expected the request\'s content_snapshot, not a fresh re-read');
    return { prNumber: 7, prUrl: 'https://github.com/org-co/org-repo/pull/7' };
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handlePostApprovePromotion(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode + ' body: ' + result.body);
    var prNumberUpdate = calls.find(function (c) { return /SET pr_number = \$1/i.test(c.sql); });
    assert.ok(prNumberUpdate, 'expected a second UPDATE recording the PR number');
    assert.strictEqual(prNumberUpdate.params[0], 7);
    var body = JSON.parse(result.body);
    assert.strictEqual(body.prNumber, 7);
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s9-approve-reject-promotion.js
```

Expected: `FAIL: AC1: ... — products.handlePostApprovePromotion is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, add near the other schema blocks for this feature (search for `wugs-s8: guardrail_promotion_requests table`, add right after that whole block):

```javascript
    // wugs-s9: extend guardrail_promotion_requests with resolution tracking.
    // Separate ALTER (not part of wugs-s8's original CREATE) since this
    // story adds columns to an existing table -- idempotent, safe to run on
    // every startup per this file's own established pattern (see psh-s3's
    // ALTER TABLE products ADD COLUMN IF NOT EXISTS block above).
    _creditsPool.query(`ALTER TABLE guardrail_promotion_requests ADD COLUMN IF NOT EXISTS resolved_by VARCHAR`)
      .then(function() { return _creditsPool.query(`ALTER TABLE guardrail_promotion_requests ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ`); })
      .then(function() { return _creditsPool.query(`ALTER TABLE guardrail_promotion_requests ADD COLUMN IF NOT EXISTS pr_number INTEGER`); })
      .then(function() { console.log('[wugs-s9] guardrail_promotion_requests resolution columns ready'); })
      .catch(function(err) { console.error('[wugs-s9] guardrail_promotion_requests ALTER failed:', err.message); });
```

In `src/web-ui/routes/products.js`, add near `_resolvePendingPromotions` (after it), and require `isEffectivelyAdmin` near the top of the file (search for the existing require block, add `var { isEffectivelyAdmin } = require('../modules/impersonation');`):

```javascript
/**
 * wugs-s9 — race-safe resolution of a pending promotion request. The
 * single conditional UPDATE (status = 'pending' in the WHERE clause) IS
 * the concurrency-safety mechanism (AC5, story's own Architecture
 * Constraints) -- a read-then-write pattern is explicitly disallowed.
 * @returns {Promise<{request_id, product_id, file_path, content_snapshot}|null>}
 *   null means the request was already resolved by a concurrent call.
 */
async function _resolvePromotionRequest(pool, tenantId, requestId, newStatus, resolvedBy) {
  var claimed = (await pool.query(
    'UPDATE guardrail_promotion_requests SET status = $1, resolved_by = $2, resolved_at = NOW() WHERE request_id = $3 AND tenant_id = $4 AND status = $5 RETURNING request_id, product_id, file_path, content_snapshot',
    [newStatus, resolvedBy, requestId, tenantId, 'pending']
  )).rows[0];
  return claimed || null;
}

/**
 * wugs-s9 — POST /api/admin/promotions/:requestId/approve. Role-gated via
 * isEffectivelyAdmin (matching credits-guard.js's exact pattern, per the
 * DoR's own explicit choice -- not the requireAdmin middleware other
 * /api/admin/* routes use). Blocks with a clear error if no org repo is
 * designated (AC4) BEFORE claiming the request, so a doomed approval
 * never burns the atomic claim. On write-adapter failure after a
 * successful claim, reverts status back to 'pending' so the admin has a
 * real retry path (see plan's design note -- a decision, not an AC).
 */
async function handlePostApprovePromotion(req, res, _next, pool) {
  if (!req.session || !isEffectivelyAdmin(req.session)) {
    if (res.status) { res.status(403).json({ error: 'forbidden' }); }
    else { res.writeHead(403, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'forbidden' })); }
    return;
  }
  var tenantId = req.session.tenantId;
  var requestId = req.params && req.params.requestId;
  var login = req.session.login;
  var token = req.session.accessToken;

  var orgRow = await _fetchOrgRepoRow(pool, tenantId);
  if (!orgRow) {
    var err = 'No org repo designated for this tenant yet. Designate one before approving promotions.';
    if (res.status) { res.status(422).json({ error: err }); }
    else { res.writeHead(422, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err })); }
    return;
  }

  var claimed = await _resolvePromotionRequest(pool, tenantId, requestId, 'approved', login);
  if (!claimed) {
    if (res.status) { res.status(409).json({ error: 'This request has already been resolved.' }); }
    else { res.writeHead(409, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'This request has already been resolved.' })); }
    return;
  }

  try {
    var writeResult = await createGuardrailPr(token, orgRow.repo_owner, orgRow.repo_name, claimed.file_path, claimed.content_snapshot, {
      tenantId: tenantId,
      productId: claimed.product_id
    });
    await pool.query('UPDATE guardrail_promotion_requests SET pr_number = $1 WHERE request_id = $2', [writeResult.prNumber, requestId]);
    if (res.status) { res.status(200).json({ ok: true, prNumber: writeResult.prNumber, prUrl: writeResult.prUrl }); }
    else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, prNumber: writeResult.prNumber, prUrl: writeResult.prUrl })); }
  } catch (writeErr) {
    await pool.query(`UPDATE guardrail_promotion_requests SET status = 'pending' WHERE request_id = $1`, [requestId]);
    if (res.status) { res.status(500).json({ error: 'Failed to create the promotion PR. The request has been returned to pending -- please try again.' }); }
    else { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Failed to create the promotion PR. The request has been returned to pending -- please try again.' })); }
  }
}
```

Add `createGuardrailPr` to the existing import from `./adapters/guardrail-pr-adapter` if not already destructured in `products.js` (check — it likely isn't, since `products.js` currently only imports `_guardrailPrAdapter` as a namespace for `GuardrailPrConflictError`; add `createGuardrailPr` to that same require line's destructure, or reference it as `_guardrailPrAdapter.createGuardrailPr(...)` — read the existing require line first and match its exact style).

Add `_resolvePromotionRequest` and `handlePostApprovePromotion` to `module.exports`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s9-approve-reject-promotion.js
```

Expected: `1 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

Also explicitly run `node tests/check-wugs-s8-request-promotion.js` (expect 7/7), `node tests/check-wugs-s6-branch-pr-creation-adapter.js` (expect 18/18), `node tests/check-wugs-s3-org-level-guardrails-view.js` (expect 12/12).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js src/web-ui/routes/products.js tests/check-wugs-s9-approve-reject-promotion.js
git commit -m "feat(wugs-s9): approve endpoint -- atomic claim, org-repo gate, write adapter, PR recorded (AC1)"
```

---

## Task 2: Reject — sets status, no write (AC2)

**Files:**
- Modify: `src/web-ui/routes/products.js`, `tests/check-wugs-s9-approve-reject-promotion.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC2: rejection sets status, no write ─────────────────────────────────
await checkAsync('AC2: rejectRequest_pending_setsStatusNoWrite', async () => {
  var calls = [];
  var writeAdapterCalled = false;
  var pool = makeMockPool({
    pendingRow: { request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'SNAPSHOT CONTENT' }
  }, calls);
  await withMockedWriteAdapter(async function () { writeAdapterCalled = true; return { prNumber: 999, prUrl: 'should-never-be-called' }; }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handlePostRejectPromotion(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode + ' body: ' + result.body);
    assert.strictEqual(writeAdapterCalled, false, 'expected wugs-s6\'s write adapter to NEVER be called for a rejection');
    var claimUpdate = calls.find(function (c) { return /SET status = \$1, resolved_by = \$2/i.test(c.sql); });
    assert.ok(claimUpdate, 'expected the atomic claim UPDATE');
    assert.strictEqual(claimUpdate.params[0], 'rejected');
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s9-approve-reject-promotion.js
```

Expected: `FAIL: AC2: ... — products.handlePostRejectPromotion is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, add near `handlePostApprovePromotion` (after it):

```javascript
/**
 * wugs-s9 — POST /api/admin/promotions/:requestId/reject. Same role gate
 * and atomic claim as approve, but stops there -- no write adapter call,
 * no org-repo check needed (AC2: rejecting never touches the org repo).
 */
async function handlePostRejectPromotion(req, res, _next, pool) {
  if (!req.session || !isEffectivelyAdmin(req.session)) {
    if (res.status) { res.status(403).json({ error: 'forbidden' }); }
    else { res.writeHead(403, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'forbidden' })); }
    return;
  }
  var tenantId = req.session.tenantId;
  var requestId = req.params && req.params.requestId;
  var login = req.session.login;

  var claimed = await _resolvePromotionRequest(pool, tenantId, requestId, 'rejected', login);
  if (!claimed) {
    if (res.status) { res.status(409).json({ error: 'This request has already been resolved.' }); }
    else { res.writeHead(409, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'This request has already been resolved.' })); }
    return;
  }

  if (res.status) { res.status(200).json({ ok: true }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true })); }
}
```

Add `handlePostRejectPromotion` to `module.exports`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s9-approve-reject-promotion.js
```

Expected: `2 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s9-approve-reject-promotion.js
git commit -m "feat(wugs-s9): reject endpoint -- sets status, no write (AC2)"
```

---

## Task 3: Non-admin rejected (AC3) + no org repo blocks approval (AC4)

**Files:**
- Modify: `tests/check-wugs-s9-approve-reject-promotion.js`

- [ ] **Step 1: Write the failing tests**

Add before the final `console.log`:

```javascript
// ── AC3: non-admin rejected server-side, no state change ────────────────
await checkAsync('AC3: resolveRequest_nonAdmin_rejected403', async () => {
  var calls = [];
  var pool = makeMockPool({
    orgRepoRow: { repo_owner: 'org-co', repo_name: 'org-repo' },
    pendingRow: { request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }
  }, calls);
  var req = mockReq({ session: { accessToken: 'tok', tenantId: 't1', login: 'engineer-bob', role: 'engineer', csrfToken: 'ct1' } });
  var res = mockRes();
  await products.handlePostApprovePromotion(req, res, null, pool);
  var result = res._get();
  assert.strictEqual(result.statusCode, 403, 'expected 403 for a non-admin, matching-role session');
  var claimUpdate = calls.find(function (c) { return /SET status = \$1, resolved_by = \$2/i.test(c.sql); });
  assert.ok(!claimUpdate, 'expected NO state change -- the role gate must block before any DB write');
});

// ── AC4: no org repo designated — approval blocked with a clear error ───
await checkAsync('AC4: resolveRequest_noOrgRepo_blockedWithClearError', async () => {
  var calls = [];
  var pool = makeMockPool({
    orgRepoRow: null,
    pendingRow: { request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }
  }, calls);
  var req = mockReq();
  var res = mockRes();
  await products.handlePostApprovePromotion(req, res, null, pool);
  var result = res._get();
  assert.strictEqual(result.statusCode, 422, 'expected 422 (not a silent failure)');
  assert.ok(/org repo/i.test(result.body), 'expected a clear error mentioning the org repo');
  var claimUpdate = calls.find(function (c) { return /SET status = \$1, resolved_by = \$2/i.test(c.sql); });
  assert.ok(!claimUpdate, 'expected the request to remain untouched -- no wasted atomic claim on a doomed approval');
});
```

- [ ] **Step 2: Run tests — expected to already pass (behaviour built in Task 1)**

```bash
node tests/check-wugs-s9-approve-reject-promotion.js
```

Expected: `4 passed, 0 failed` — if either fails, fix `handlePostApprovePromotion`'s role-gate or org-repo-check ordering.

- [ ] **Step 3: Write minimal implementation**

No implementation change expected.

- [ ] **Step 4: Run test — must pass**

Expected: `4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s9-approve-reject-promotion.js
git commit -m "test(wugs-s9): lock in non-admin rejection (AC3) and no-org-repo block (AC4)"
```

---

## Task 4: Concurrent resolution — only first wins (AC5) + wire real routes + final regression

**Files:**
- Modify: `src/web-ui/server.js`, `tests/check-wugs-s9-approve-reject-promotion.js`

- [ ] **Step 1: Write the failing tests**

Add before the final `console.log`:

```javascript
// ── AC5: concurrent resolution -- only the first call wins ──────────────
await checkAsync('AC5: resolveRequest_concurrentCalls_onlyFirstUpdateSucceeds', async () => {
  var calls = [];
  var claimCallCount = 0;
  var pool = {
    query: async function (sql, params) {
      var s = String(sql);
      calls.push({ sql: s, params: params });
      if (/SELECT repo_owner, repo_name FROM tenant_org_repo WHERE tenant_id/i.test(s)) {
        return { rows: [{ repo_owner: 'org-co', repo_name: 'org-repo' }] };
      }
      if (/UPDATE guardrail_promotion_requests SET status = \$1, resolved_by = \$2, resolved_at = NOW\(\) WHERE request_id = \$3 AND tenant_id = \$4 AND status = \$5/i.test(s)) {
        claimCallCount++;
        // Simulate real Postgres behaviour: only the FIRST conditional
        // UPDATE actually finds a row still in 'pending' -- the second
        // one (fired after the first already flipped the status) matches
        // zero rows, exactly as a real DB would return under this race.
        return claimCallCount === 1
          ? { rows: [{ request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }] }
          : { rows: [] };
      }
      if (/UPDATE guardrail_promotion_requests SET pr_number = \$1 WHERE request_id = \$2/i.test(s)) { return { rows: [] }; }
      return { rows: [] };
    }
  };
  var writeAdapterCallCount = 0;
  await withMockedWriteAdapter(async function () { writeAdapterCallCount++; return { prNumber: 42, prUrl: 'https://github.com/org-co/org-repo/pull/42' }; }, async function () {
    var req1 = mockReq();
    var res1 = mockRes();
    var req2 = mockReq({ session: { accessToken: 'tok', tenantId: 't1', login: 'admin-carol', role: 'admin', csrfToken: 'ct1' } });
    var res2 = mockRes();
    await products.handlePostApprovePromotion(req1, res1, null, pool);
    await products.handlePostApprovePromotion(req2, res2, null, pool);
    assert.strictEqual(res1._get().statusCode, 200, 'expected the first call to succeed');
    assert.strictEqual(res2._get().statusCode, 409, 'expected the second call to get "already resolved", not a duplicate success');
    assert.strictEqual(writeAdapterCallCount, 1, 'expected the write adapter to be invoked exactly ONCE, not twice -- no duplicate PR');
  });
});

// ── Wiring: both admin routes are registered in server.js ───────────────
check('wiring: server_js_routes_adminPromotionsApproveReject_to_handlers', () => {
  var fs = require('fs');
  var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
  assert.ok(serverSrc.indexOf('/api/admin/promotions') !== -1, 'expected server.js to route /api/admin/promotions/:requestId/approve|reject');
  assert.ok(serverSrc.indexOf('handlePostApprovePromotion') !== -1, 'expected server.js to reference handlePostApprovePromotion');
  assert.ok(serverSrc.indexOf('handlePostRejectPromotion') !== -1, 'expected server.js to reference handlePostRejectPromotion');
});
```

- [ ] **Step 2: Run tests — AC5 expected to already pass (behaviour built in Task 1); wiring test must fail**

```bash
node tests/check-wugs-s9-approve-reject-promotion.js
```

Expected: `5 passed, 1 failed` (AC5 passes as a lock-in of Task 1's atomic mechanism; the wiring test fails since no route exists yet).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`: add `handlePostApprovePromotion`, `handlePostRejectPromotion` to the existing destructured `require('./routes/products')` import. Find a sensible existing `/api/admin/*` route block (search for `/api/admin/plan/set`) and add two new routes right after it, each requiring `req.session` and `isEffectivelyAdmin` are checked INSIDE the handler (per this story's design note — do NOT wrap in `requireAdmin`):

```javascript
  } else if (pathname.match(/^\/api\/admin\/promotions\/[^/]+\/approve$/) && req.method === 'POST') {
    // wugs-s9 -- approve a pending promotion request. Role gate is inside
    // the handler (isEffectivelyAdmin), matching credits-guard.js's own
    // pattern per this story's explicit DoR choice -- not requireAdmin.
    req.params = { requestId: pathname.split('/')[4] };
    authGuard(req, res, async () => { await handlePostApprovePromotion(req, res, null, _pshPool); });

  } else if (pathname.match(/^\/api\/admin\/promotions\/[^/]+\/reject$/) && req.method === 'POST') {
    // wugs-s9 -- reject a pending promotion request.
    req.params = { requestId: pathname.split('/')[4] };
    authGuard(req, res, async () => { await handlePostRejectPromotion(req, res, null, _pshPool); });
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s9-approve-reject-promotion.js
```

Expected: `6 passed, 0 failed`

- [ ] **Step 5: Full regression + story-level check**

```bash
node tests/check-wugs-s9-approve-reject-promotion.js
node tests/check-wugs-s8-request-promotion.js
node tests/check-wugs-s6-branch-pr-creation-adapter.js
node tests/check-wugs-s3-org-level-guardrails-view.js
node tests/check-wugs-s2-product-level-guardrails-view.js
node tests/check-wugs-s4-no-connected-repo-fallback.js
node tests/check-wugs-s5-create-edit-form.js
node tests/check-wugs-s7-surface-pr-state-in-view.js
```

All expected: 6/6, 7/7, 18/18, 12/12, 11/11, 7/7, 13/13, 8/8.

```bash
npm test
```

Expected: same 33 pre-existing baseline failures (see `decisions.md` RISK-ACCEPT for `wugs-s9`), 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-wugs-s9-approve-reject-promotion.js
git commit -m "feat(wugs-s9): wire real admin routes, lock in concurrent-resolution safety (AC5)"
```

---

## Final story-level check (before /verify-completion)

After all 4 tasks: `node tests/check-wugs-s9-approve-reject-promotion.js` → `6 passed, 0 failed`, plus all seven sibling regression files unchanged, plus `npm test` at the documented baseline. No manual pre-merge step required — reuses `wugs-s6`'s already-verified write path, no new GitHub API surface.
