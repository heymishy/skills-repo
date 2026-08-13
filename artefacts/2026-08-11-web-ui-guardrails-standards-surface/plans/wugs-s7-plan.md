# Surface pending/merged PR state in the guardrails/standards view — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — track PRs opened by `wugs-s6`'s write adapter in a new `guardrail_pending_prs` table, live-check their status on each view render, and surface a text-labelled pending/merged/closed indicator per entry.
**Branch:** `feature/wugs-s7`
**Worktree:** `.worktrees/wugs-s7`
**Test command:** `node tests/check-wugs-s7-surface-pr-state-in-view.js` (per task) / `npm test` (full suite, final step)

---

## File map

```
Create:
  tests/check-wugs-s7-surface-pr-state-in-view.js   — AC1-AC4 + 1 NFR

Modify:
  src/web-ui/server.js                    — CREATE TABLE IF NOT EXISTS guardrail_pending_prs (ADR-003),
                                             wire tracking-row creation into wugs-s6's existing writeAdapter closure
  src/web-ui/adapters/guardrail-pr-adapter.js — checkPrStatus (live GitHub PR-status check, read-only, no adapter setter -- DoR's own H-ADAPTER row confirms no new D37 adapter here)
  src/web-ui/routes/products.js           — _trackPendingPr, _resolveAllPendingPrs, pending-indicator rendering wired into handleGetProductGuardrailsView
```

**Scope note — this worktree branched before `wugs-s3` merged:** `wugs-s7`'s DoR lists only `wugs-s6` as upstream (not `wugs-s3`); its Dependencies section and Complexity Rating ("no new external-write surface") both confirm this story is scoped to the product-level view only. This worktree's `products.js` predates `wugs-s3`'s org-level section and `_renderPieceContent` helper — that's expected, not a gap. When `wugs-s3` merges, its org-level write path (`POST /settings/org-repo`) will need the same `_trackPendingPr` wiring added as a small follow-up (noted in `decisions.md`), but that is out of this story's scope per its own stated dependency.

**Design note on why one function resolves all three PR states:** GitHub's `GET /repos/{owner}/{repo}/pulls/{pull_number}` returns both `state` (`'open'`/`'closed'`) and `merged` (boolean) in a single response — `state === 'open'` is AC1's pending case, `merged === true` is AC2's merged case, `state === 'closed' && merged === false` is AC3's closed-without-merge case. One live call determines all three; `_resolveAllPendingPrs` handles all three branches in one implementation (Task 2), with Tasks 3-4 locking in the merged/closed branches as tests once Task 2's single implementation already covers them — same proven pattern as `wugs-s3`'s Tasks 2-4.

**Design note on where the tracking row gets created:** `wugs-s6`'s existing `writeAdapterForRequest` closure in `server.js` (the one wired to `POST /products/:id/guardrails/form`) calls `createGuardrailPr(...)` and returns its `{prNumber, prUrl}` result directly to `handlePostGuardrailsForm`. This story adds one line to that same closure — after a successful `createGuardrailPr` call, also call `_trackPendingPr` with the same target/result — colocating the tracking-row write with the real GitHub write it tracks, rather than duplicating write-path logic elsewhere.

---

## Task 1: `guardrail_pending_prs` table + tracking-row creation wired into wugs-s6's write path

**Files:**
- Create: `tests/check-wugs-s7-surface-pr-state-in-view.js`
- Modify: `src/web-ui/server.js`, `src/web-ui/routes/products.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-wugs-s7-surface-pr-state-in-view.js`:

```javascript
'use strict';
// check-wugs-s7-surface-pr-state-in-view.js — wugs-s7
//
// Unit/integration tests for surfacing pending/merged/closed PR state in the
// guardrails/standards view: tracks PRs opened by wugs-s6's write adapter in
// guardrail_pending_prs, live-checks status on each view render.

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
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

// Mock pool: product lookup, nav summary, and guardrail_pending_prs rows/deletes.
function makeMockPool(pendingRows, deletedIds) {
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        return { rows: [{ name: 'Test Product', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }] };
      }
      if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT journey_id FROM journeys WHERE tenant_id.*product_id IS NULL/i.test(s)) { return { rows: [] }; }
      if (/SELECT .* FROM guardrail_pending_prs WHERE tenant_id/i.test(s)) {
        return { rows: (pendingRows || []) };
      }
      if (/INSERT INTO guardrail_pending_prs/i.test(s)) { return { rows: [] }; }
      if (/DELETE FROM guardrail_pending_prs WHERE id/i.test(s)) {
        if (deletedIds) deletedIds.push(params[0]);
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

async function withMockedFetchRepoPath(mockFn, testFn) {
  var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
  var original = artefactFetcher.getFetchRepoPath();
  artefactFetcher.setFetchRepoPath(mockFn);
  try { await testFn(); } finally { artefactFetcher.setFetchRepoPath(original); }
}

(async () => {

// ── Task 1: tracking-row creation ────────────────────────────────────────
await checkAsync('trackPendingPr_afterSuccessfulWrite_insertsTrackingRow', async () => {
  var calls = [];
  var pool = {
    query: async function (sql, params) {
      calls.push({ sql: String(sql), params: params });
      return { rows: [] };
    }
  };
  await products._trackPendingPr(pool, 't1', 'p1', 'standards/new.md', 42, 'https://github.com/acme/widgets/pull/42');
  var insertCall = calls.find(function (c) { return /INSERT INTO guardrail_pending_prs/i.test(c.sql); });
  assert.ok(insertCall, 'expected an INSERT INTO guardrail_pending_prs to be issued');
  assert.deepStrictEqual(insertCall.params, ['t1', 'p1', 'standards/new.md', 42, 'https://github.com/acme/widgets/pull/42']);
});

// ── Wiring: server.js calls _trackPendingPr after a successful write ────
check('wiring: server_js_tracksNewPrAfterSuccessfulWrite', () => {
  var fs = require('fs');
  var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
  assert.ok(serverSrc.indexOf('_trackPendingPr') !== -1, 'expected server.js to call _trackPendingPr after a successful guardrail write');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s7-surface-pr-state-in-view.js
```

Expected: `FAIL: trackPendingPr_afterSuccessfulWrite_insertsTrackingRow — products._trackPendingPr is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, add near the other `CREATE TABLE IF NOT EXISTS` blocks for this feature (search for `wugs-s3: tenant_org_repo table`, add right after that whole block):

```javascript
    // wugs-s7: guardrail_pending_prs table — tracks PRs opened by wugs-s6's
    // write adapter so their live status can be surfaced on each view render.
    // product_id nullable (NULL = org-level entry, matching wugs-s3's
    // target.productId=null convention); no FK, same tenant-scoped pattern
    // as tenant_org_repo.
    _creditsPool.query(`CREATE TABLE IF NOT EXISTS guardrail_pending_prs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR NOT NULL,
      product_id UUID,
      path VARCHAR NOT NULL,
      pr_number INTEGER NOT NULL,
      pr_url VARCHAR NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`).then(function() {
      console.log('[wugs-s7] guardrail_pending_prs table ready');
    }).catch(function(err) {
      console.error('[wugs-s7] guardrail_pending_prs migration failed:', err.message);
    });
```

In `src/web-ui/routes/products.js`, add near `handlePostGuardrailsForm` (after it, before `handleGetProductGuardrailsView`):

```javascript
/**
 * wugs-s7 — records a tracking row for a PR wugs-s6's write adapter just
 * opened, so its live status can be surfaced on later view renders.
 */
async function _trackPendingPr(pool, tenantId, productId, path, prNumber, prUrl) {
  await pool.query(
    'INSERT INTO guardrail_pending_prs (tenant_id, product_id, path, pr_number, pr_url) VALUES ($1, $2, $3, $4, $5)',
    [tenantId, productId, path, prNumber, prUrl]
  );
}
```

Add `_trackPendingPr` to `module.exports`.

In `src/web-ui/server.js`, find `wugs-s6`'s `writeAdapterForRequest` closure inside the `POST /products/:id/guardrails/form` route block (search for `const writeAdapterForRequest = async (target, content) => {` near `guardrails\\/form\$/) && req.method === 'POST'`) and add the tracking call after the real write succeeds:

```javascript
      const writeAdapterForRequest = async (target, content) => {
        const prodRow = (await _pshPool.query(
          'SELECT repo_owner, repo_name FROM products WHERE product_id = $1',
          [target.productId]
        )).rows[0];
        const writeResult = await createGuardrailPr(req.session.accessToken, prodRow.repo_owner, prodRow.repo_name, target.path, content, {
          tenantId: req.session.tenantId,
          productId: target.productId
        });
        await _trackPendingPr(_pshPool, req.session.tenantId, target.productId, target.path, writeResult.prNumber, writeResult.prUrl); // wugs-s7
        return writeResult;
      };
```

Add `_trackPendingPr` to the existing destructured `require('./routes/products')` import in `server.js` (search for `handlePostGuardrailsForm` in that line, add right after it).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s7-surface-pr-state-in-view.js
```

Expected: `2 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails\|adapters/guardrail-pr-adapter" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

Also explicitly run `node tests/check-wugs-s6-branch-pr-creation-adapter.js` (expect 18/18 unchanged — this task modifies its `writeAdapterForRequest` closure in `server.js`) and `node tests/check-wugs-s5-create-edit-form.js` (expect 13/13).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js src/web-ui/routes/products.js tests/check-wugs-s7-surface-pr-state-in-view.js
git commit -m "feat(wugs-s7): guardrail_pending_prs table + tracking-row creation on write"
```

---

## Task 2: Pending PR indicator shown for an open PR (AC1) — implements the full resolve-all-states function

**Files:**
- Modify: `src/web-ui/adapters/guardrail-pr-adapter.js`, `src/web-ui/routes/products.js`, `tests/check-wugs-s7-surface-pr-state-in-view.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── Shared test helper: mock a single GitHub PR-status response ─────────
function mockPrStatusFetch(state, merged) {
  return async function (url) {
    return {
      ok: true,
      status: 200,
      json: async function () { return { state: state, merged: !!merged, number: 42, html_url: 'https://github.com/acme/widgets/pull/42' }; }
    };
  };
}

// ── AC1: pending PR shows indicator + link ───────────────────────────────
await checkAsync('AC1: handleGetGuardrailsView_pendingPr_showsIndicatorAndLink', async () => {
  var deletedIds = [];
  var pool = makeMockPool([
    { id: 'row-1', tenant_id: 't1', product_id: 'p1', path: '.github/architecture-guardrails.md', pr_number: 42, pr_url: 'https://github.com/acme/widgets/pull/42' }
  ], deletedIds);
  var originalFetch = global.fetch;
  global.fetch = mockPrStatusFetch('open', false);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    try {
      var req = mockReq();
      var res = mockRes();
      await products.handleGetProductGuardrailsView(req, res, null, pool);
      var result = res._get();
      assert.strictEqual(result.statusCode, 200);
      assert.ok(/Pending review/i.test(result.body), 'expected a "Pending review" text indicator');
      assert.ok(result.body.indexOf('https://github.com/acme/widgets/pull/42') !== -1, 'expected a real link to the PR URL');
      assert.strictEqual(deletedIds.length, 0, 'an open PR must not clear its tracking row');
    } finally { global.fetch = originalFetch; }
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s7-surface-pr-state-in-view.js
```

Expected: `FAIL: AC1: ... — expected a "Pending review" text indicator` (no pending-PR wiring in the view yet)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/adapters/guardrail-pr-adapter.js`, add after `realCreateGuardrailPr`, before `module.exports`:

```javascript
/**
 * wugs-s7 — live-checks a single PR's status. Read-only; not a D37
 * injectable adapter (the DoR's own H-ADAPTER row confirms none is needed
 * here — this reuses _ghRequest's already-established fetch pattern
 * directly, matching realCreateGuardrailPr's own style).
 * @returns {Promise<{state: 'open'|'merged'|'closed'}>}
 */
async function checkPrStatus(token, owner, repo, prNumber) {
  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
  const res = await _ghRequest(token, apiBase, 'GET', `/repos/${owner}/${repo}/pulls/${prNumber}`);
  if (!res.ok) {
    throw new GuardrailPrError('PR status check failed', `Could not check PR status (${res.status})`);
  }
  const data = await res.json();
  if (data.merged) { return { state: 'merged' }; }
  return { state: data.state === 'open' ? 'open' : 'closed' };
}
```

Add `checkPrStatus` to `module.exports`.

In `src/web-ui/routes/products.js`, add near `_trackPendingPr` (after it):

```javascript
/**
 * wugs-s7 — resolves every tracked pending PR for a product: live-checks
 * each one's status via checkPrStatus, clears (DELETEs) any that have
 * merged or closed without merging (AC2/AC3), and returns a Map of
 * path -> {prNumber, prUrl} for any still genuinely open (AC1). Handling
 * all three states in one pass is what makes AC4 (multiple independent
 * pending PRs) correct by construction — each row is resolved on its own.
 * @returns {Promise<Map<string, {prNumber: number, prUrl: string}>>}
 */
async function _resolveAllPendingPrs(pool, owner, repo, token, tenantId, productId) {
  var rows = (await pool.query(
    'SELECT id, path, pr_number, pr_url FROM guardrail_pending_prs WHERE tenant_id = $1 AND product_id = $2',
    [tenantId, productId]
  )).rows;
  var openByPath = new Map();
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var status = await _guardrailPrAdapter.checkPrStatus(token, owner, repo, row.pr_number);
    if (status.state === 'open') {
      openByPath.set(row.path, { prNumber: row.pr_number, prUrl: row.pr_url });
    } else {
      await pool.query('DELETE FROM guardrail_pending_prs WHERE id = $1', [row.id]);
    }
  }
  return openByPath;
}

/**
 * wugs-s7 — renders a text-based (not colour-only, MC-A11Y-02) pending
 * review badge linking to the real PR.
 */
function _renderPendingPrBadge(prInfo) {
  return ' <a href="' + _escapeHtml(prInfo.prUrl) + '" class="gv-pending-pr-badge" style="font-size:12px;color:var(--accent);margin-left:8px">Pending review — PR #' + prInfo.prNumber + '</a>';
}
```

In `handleGetProductGuardrailsView`, after `prodRow` is validated (before the existing `_fetchGuardrailsSectionPiece` calls), add:

```javascript
  var pendingByPath = await _resolveAllPendingPrs(_pool, prodRow.repo_owner, prodRow.repo_name, token, tenantId, productId);
```

Then in `_renderGuardrailsSection`'s call site, pass `pendingByPath` through and append the badge. Modify `_renderGuardrailsSection`'s signature to accept it as a 4th parameter, and append `_renderPendingPrBadge(...)` to `guardrailsHtml` when `pendingByPath.has(guardrailsPath)`, and to each standards `<li>` when `pendingByPath.has(e.path)`. Update the call site in `handleGetProductGuardrailsView` to pass `pendingByPath` as the 4th argument.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s7-surface-pr-state-in-view.js
```

Expected: `3 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails\|adapters/guardrail-pr-adapter" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

Also confirm `node tests/check-wugs-s2-product-level-guardrails-view.js` (11/11) and `node tests/check-wugs-s5-create-edit-form.js` (13/13) still pass — this task changes `_renderGuardrailsSection`'s signature.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/guardrail-pr-adapter.js src/web-ui/routes/products.js tests/check-wugs-s7-surface-pr-state-in-view.js
git commit -m "feat(wugs-s7): live PR-status resolution + pending indicator (AC1)"
```

---

## Task 3: Merged PR clears indicator and shows new content (AC2)

**Files:**
- Modify: `tests/check-wugs-s7-surface-pr-state-in-view.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC2: merged PR clears indicator, shows new content ───────────────────
await checkAsync('AC2: handleGetGuardrailsView_mergedPr_clearsIndicatorShowsNewContent', async () => {
  var deletedIds = [];
  var pool = makeMockPool([
    { id: 'row-1', tenant_id: 't1', product_id: 'p1', path: '.github/architecture-guardrails.md', pr_number: 42, pr_url: 'https://github.com/acme/widgets/pull/42' }
  ], deletedIds);
  var originalFetch = global.fetch;
  global.fetch = mockPrStatusFetch('closed', true);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { return 'THE NEW MERGED CONTENT'; }
    var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    try {
      var req = mockReq();
      var res = mockRes();
      await products.handleGetProductGuardrailsView(req, res, null, pool);
      var result = res._get();
      assert.strictEqual(result.statusCode, 200);
      assert.ok(!/Pending review/i.test(result.body), 'expected no pending indicator once merged');
      assert.ok(result.body.indexOf('THE NEW MERGED CONTENT') !== -1, 'expected the new merged content to show via the normal live-read path');
      assert.deepStrictEqual(deletedIds, ['row-1'], 'expected the tracking row to be cleared');
    } finally { global.fetch = originalFetch; }
  });
});
```

- [ ] **Step 2: Run test — expected to already pass (behaviour built in Task 2)**

```bash
node tests/check-wugs-s7-surface-pr-state-in-view.js
```

Expected: `4 passed, 0 failed` — if it fails, that's the RED signal; fix `_resolveAllPendingPrs`'s merged branch.

- [ ] **Step 3: Write minimal implementation**

No implementation change expected — Task 2's `_resolveAllPendingPrs` already DELETEs on any non-open state, and the normal `_fetchGuardrailsSectionPiece` call already reads live content regardless of pending state.

- [ ] **Step 4: Run test — must pass**

Expected: `4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s7-surface-pr-state-in-view.js
git commit -m "test(wugs-s7): lock in merged-PR clears indicator and shows new content (AC2)"
```

---

## Task 4: Closed-without-merge reverts cleanly (AC3)

**Files:**
- Modify: `tests/check-wugs-s7-surface-pr-state-in-view.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC3: closed-without-merge reverts cleanly ────────────────────────────
await checkAsync('AC3: handleGetGuardrailsView_closedPr_revertsCleanly', async () => {
  var deletedIds = [];
  var pool = makeMockPool([
    { id: 'row-1', tenant_id: 't1', product_id: 'p1', path: '.github/architecture-guardrails.md', pr_number: 42, pr_url: 'https://github.com/acme/widgets/pull/42' }
  ], deletedIds);
  var originalFetch = global.fetch;
  global.fetch = mockPrStatusFetch('closed', false);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { return 'ORIGINAL PRE-EDIT CONTENT'; }
    var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    try {
      var req = mockReq();
      var res = mockRes();
      await products.handleGetProductGuardrailsView(req, res, null, pool);
      var result = res._get();
      assert.strictEqual(result.statusCode, 200);
      assert.ok(!/Pending review/i.test(result.body), 'expected no pending indicator once closed without merging');
      assert.ok(result.body.indexOf('ORIGINAL PRE-EDIT CONTENT') !== -1, 'expected the original pre-edit content, not a placeholder or blank');
      assert.deepStrictEqual(deletedIds, ['row-1'], 'expected the tracking row to be cleared, no orphaned pending state');
    } finally { global.fetch = originalFetch; }
  });
});
```

- [ ] **Step 2: Run test — expected to already pass (behaviour built in Task 2)**

```bash
node tests/check-wugs-s7-surface-pr-state-in-view.js
```

Expected: `5 passed, 0 failed` — if it fails, fix `_resolveAllPendingPrs`'s closed-not-merged branch.

- [ ] **Step 3: Write minimal implementation**

No implementation change expected.

- [ ] **Step 4: Run test — must pass**

Expected: `5 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s7-surface-pr-state-in-view.js
git commit -m "test(wugs-s7): lock in closed-without-merge reverts cleanly, no orphaned state (AC3)"
```

---

## Task 5: Multiple pending PRs individually correct (AC4) + accessibility (NFR) + final regression

**Files:**
- Modify: `tests/check-wugs-s7-surface-pr-state-in-view.js`

- [ ] **Step 1: Write the failing tests**

Add before the final `console.log`:

```javascript
// ── AC4: multiple pending PRs, each shows its own correct state ─────────
await checkAsync('AC4: handleGetGuardrailsView_multiplePendingPrs_eachShowsOwnCorrectState', async () => {
  var deletedIds = [];
  var pool = makeMockPool([
    { id: 'row-1', tenant_id: 't1', product_id: 'p1', path: '.github/architecture-guardrails.md', pr_number: 42, pr_url: 'https://github.com/acme/widgets/pull/42' },
    { id: 'row-2', tenant_id: 't1', product_id: 'p1', path: 'standards/saas-gui.md', pr_number: 43, pr_url: 'https://github.com/acme/widgets/pull/43' }
  ], deletedIds);
  var originalFetch = global.fetch;
  var callCount = 0;
  global.fetch = async function (url) {
    callCount++;
    // First PR (42) is still open; second PR (43) has merged -- proves each
    // row is resolved independently, not one shared/ambiguous status.
    var isFirstPr = /pulls\/42$/.test(url);
    return { ok: true, status: 200, json: async function () {
      return isFirstPr
        ? { state: 'open', merged: false, number: 42, html_url: 'https://github.com/acme/widgets/pull/42' }
        : { state: 'closed', merged: true, number: 43, html_url: 'https://github.com/acme/widgets/pull/43' };
    } };
  };
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === 'standards/') { return [{ name: 'saas-gui', path: 'standards/saas-gui.md', type: 'file' }]; }
    var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    try {
      var req = mockReq();
      var res = mockRes();
      await products.handleGetProductGuardrailsView(req, res, null, pool);
      var result = res._get();
      assert.strictEqual(result.statusCode, 200);
      assert.strictEqual(callCount, 2, 'expected one live PR-status check per pending row');
      assert.ok(result.body.indexOf('PR #42') !== -1, 'expected the still-open PR #42 to show its own pending indicator');
      assert.ok(result.body.indexOf('PR #43') === -1, 'expected the merged PR #43 to NOT show a pending indicator');
      assert.deepStrictEqual(deletedIds, ['row-2'], 'expected only the merged row to be cleared, the open one left alone');
    } finally { global.fetch = originalFetch; }
  });
});

// ── NFR-A11Y: pending indicator conveys state via text, not colour alone ─
check('NFR-A11Y: pendingPrBadge_conveysStateViaTextLabel', () => {
  var fs = require('fs');
  var src = fs.readFileSync(require.resolve('../src/web-ui/routes/products.js'), 'utf8');
  assert.ok(/Pending review/.test(src), 'expected a real "Pending review" text label in the source, not a colour-only indicator');
});
```

- [ ] **Step 2: Run tests — expected to already pass (behaviour built in Task 2)**

```bash
node tests/check-wugs-s7-surface-pr-state-in-view.js
```

Expected: `7 passed, 0 failed` — if AC4 fails, that's the RED signal; fix `_resolveAllPendingPrs`'s per-row independence (each row must be checked and cleared on its own, not sharing state across rows).

- [ ] **Step 3: Write minimal implementation**

No implementation change expected — Task 2's `_resolveAllPendingPrs` already loops per-row independently.

- [ ] **Step 4: Run test — must pass**

Expected: `7 passed, 0 failed`

- [ ] **Step 5: Full regression + story-level check**

```bash
node tests/check-wugs-s7-surface-pr-state-in-view.js
node tests/check-wugs-s6-branch-pr-creation-adapter.js
node tests/check-wugs-s5-create-edit-form.js
node tests/check-wugs-s2-product-level-guardrails-view.js
```

All expected: 7/7, 18/18, 13/13, 11/11.

```bash
npm test
```

Expected: same 33 pre-existing baseline failures (see `decisions.md` RISK-ACCEPT for `wugs-s7`), 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s7-surface-pr-state-in-view.js
git commit -m "test(wugs-s7): lock in multiple independent pending PRs + accessibility text label (AC4, NFR-A11Y)"
```

---

## Final story-level check (before /verify-completion)

After all 5 tasks: `node tests/check-wugs-s7-surface-pr-state-in-view.js` → `7 passed, 0 failed`, plus the 3 sibling regression files unchanged, plus `npm test` at the documented baseline. No manual pre-merge step required (read-only PR-status check, no new write surface).
