# Show org-level guardrails/standards even when a product has no connected repo — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — when a product has no connected repo, the product-level section shows a distinct "connect a repo" prompt (not `wugs-s2`'s "none found in this repo" empty state), while the org-level section (`wugs-s3`) still renders normally.
**Branch:** `feature/wugs-s4`
**Worktree:** `.worktrees/wugs-s4`
**Test command:** `node tests/check-wugs-s4-no-connected-repo-fallback.js` (per task) / `npm test` (full suite, final step)

---

## File map

```
Create:
  tests/check-wugs-s4-no-connected-repo-fallback.js   — AC1-AC4 + 1 NFR

Modify:
  src/web-ui/routes/products.js — _renderNoConnectedRepoPrompt, short-circuit in handleGetProductGuardrailsView
```

**Design note on the reused connection entry point:** the story's own AC3 requires reusing the existing `rpc-s1`/`prc-s2.1` connection flow, not inventing a new route. Reading the existing codebase (`src/web-ui/routes/products.js`, search for `Connect a repo to get started`, an existing empty-state prompt built for a different flow — `handleGetProductRoadmap`'s no-repo fallback) confirms the established precedent: the real connection UI lives on the product view page itself (`GET /products/:id`, a JS-driven form via `rpcShowConnectForm()`/`rpcSubmitConnect()`, PUTing to `/products/:id`), not a dedicated GET route. This story's prompt reuses the exact same href pattern (`/products/{productId}`) as that existing precedent — no new route, no new connection mechanism.

**Design note on why this naturally satisfies AC2 and AC4 without extra work:** the check (`!prodRow.repo_owner || !prodRow.repo_name`) is evaluated fresh from a live DB query on every call to `handleGetProductGuardrailsView` — there is no caching layer anywhere in this read path. AC4 ("not sticky past connection") is therefore satisfied by construction, not by any special invalidation logic: the second call in the AC4 test naturally re-reads the now-updated `prodRow` and takes the normal `wugs-s2` branch. AC2 ("org section still renders") is satisfied because the org-level fetch/render (`wugs-s3`'s `orgRow`/`orgSectionHtml` logic) is a structurally separate code path in the same function, unaffected by which branch the product-level section takes.

---

## Task 1: Distinct "connect a repo" prompt when no repo is connected (AC1)

**Files:**
- Create: `tests/check-wugs-s4-no-connected-repo-fallback.js`
- Modify: `src/web-ui/routes/products.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-wugs-s4-no-connected-repo-fallback.js`:

```javascript
'use strict';
// check-wugs-s4-no-connected-repo-fallback.js — wugs-s4
//
// Unit/integration tests for the "no connected repo" fallback: the
// product-level section shows a distinct connect-a-repo prompt (not
// wugs-s2's "none found in this repo" empty state) while the org-level
// section (wugs-s3) still renders normally.

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
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

// Mock pool: product lookup (repo_owner/repo_name nullable), nav summary,
// tenant_org_repo, guardrail_pending_prs — matches check-wugs-s3/s7's own
// makeMockPool convention. `hasRepo` controls whether the product row has a
// connected repo; pass a mutable `state` object to change it between calls
// (AC4's not-sticky test).
function makeMockPool(state) {
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        var row = state.hasRepo
          ? { name: 'Test Product', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }
          : { name: 'Test Product', tenant_id: 't1', repo_owner: null, repo_name: null };
        return { rows: [row] };
      }
      if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT journey_id FROM journeys WHERE tenant_id.*product_id IS NULL/i.test(s)) { return { rows: [] }; }
      if (/SELECT .* FROM tenant_org_repo WHERE tenant_id/i.test(s)) {
        return { rows: state.orgRepoRow ? [state.orgRepoRow] : [] };
      }
      if (/SELECT .* FROM guardrail_pending_prs WHERE tenant_id/i.test(s)) { return { rows: [] }; }
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

// ── AC1: distinct "connect a repo" prompt, not wugs-s2's empty state ────
await checkAsync('AC1: handleGetGuardrailsView_noConnectedRepo_showsDistinctConnectPrompt', async () => {
  var pool = makeMockPool({ hasRepo: false });
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(/connect a repo/i.test(result.body), 'expected a "connect a repo" prompt');
    assert.ok(result.body.indexOf('No architecture-guardrails.md found in this repo.') === -1, 'expected the distinct no-repo prompt, NOT wugs-s2\'s "none found in this repo" empty-state copy');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s4-no-connected-repo-fallback.js
```

Expected: `FAIL: AC1: ... — expected a "connect a repo" prompt` (no such branch exists yet; the current code always attempts a fetch regardless of whether `repo_owner`/`repo_name` are set).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, add near `_renderGuardrailsSection` (before it):

```javascript
/**
 * wugs-s4 — distinct "connect a repo" prompt shown in place of the
 * product-level section when the product has no connected repo at all.
 * Deliberately different copy/markup from _renderPieceContent's 'empty'
 * branch ("No X found in this repo.") -- that's the "repo exists but the
 * file/folder doesn't" case (wugs-s2 AC3); this is the "no repo at all"
 * case, and the two must stay textually distinguishable per AC1. Reuses
 * the product view page (GET /products/:id) as the connection entry point
 * -- the existing rpc-s1/prc-s2.1 connect-repo form lives there already
 * (see handleGetProductRoadmap's own "Connect a repo to get started"
 * fallback for the established precedent this mirrors).
 */
function _renderNoConnectedRepoPrompt(productId) {
  return '<div class="gv-product-section gv-no-repo-prompt" style="padding:16px;border:1px dashed var(--line);border-radius:8px">' +
    '<h2 style="font-size:18px;margin:0 0 8px">Architecture guardrails &amp; standards</h2>' +
    '<p style="color:var(--muted);font-size:14px;margin:0 0 12px">Connect a repo to see this product\'s architecture guardrails and standards.</p>' +
    '<a href="/products/' + encodeURIComponent(productId) + '" style="font-size:13px;color:var(--accent)">Connect a repo</a>' +
  '</div>';
}
```

In `handleGetProductGuardrailsView`, find where `pendingByPath`/`guardrailsPiece`/`standardsPiece`/`productSectionHtml` are computed (after `prodRow` validation, before the org-level block) and wrap that whole block in a check:

```javascript
  var productSectionHtml;
  if (!prodRow.repo_owner || !prodRow.repo_name) {
    productSectionHtml = _renderNoConnectedRepoPrompt(productId);
  } else {
    var pendingByPath = await _resolveAllPendingPrs(_pool, prodRow.repo_owner, prodRow.repo_name, token, tenantId, productId);
    var guardrailsPiece = await _fetchGuardrailsSectionPiece(prodRow.repo_owner, prodRow.repo_name, '.github/architecture-guardrails.md', token);
    var standardsPiece = await _fetchGuardrailsSectionPiece(prodRow.repo_owner, prodRow.repo_name, 'standards/', token);
    productSectionHtml = _renderGuardrailsSection(guardrailsPiece, standardsPiece, productId, pendingByPath);
  }
```

(This replaces the existing unconditional `pendingByPath`/`guardrailsPiece`/`standardsPiece`/`productSectionHtml` assignments — read the function's current full body with the Read tool first to get the exact existing lines to replace, since `wugs-s3`/`wugs-s7`'s merge already changed this function's shape from what any single story's own plan originally showed.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s4-no-connected-repo-fallback.js
```

Expected: `1 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

Also explicitly run `node tests/check-wugs-s2-product-level-guardrails-view.js` (expect 11/11), `node tests/check-wugs-s3-org-level-guardrails-view.js` (expect 12/12), `node tests/check-wugs-s5-create-edit-form.js` (expect 13/13), `node tests/check-wugs-s7-surface-pr-state-in-view.js` (expect 8/8) — this task changes `handleGetProductGuardrailsView`'s branching, which all four stories' tests exercise.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s4-no-connected-repo-fallback.js
git commit -m "feat(wugs-s4): distinct connect-a-repo prompt when no repo connected (AC1)"
```

---

## Task 2: Org-level section still renders (AC2)

**Files:**
- Modify: `tests/check-wugs-s4-no-connected-repo-fallback.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC2: org section still renders alongside the product-level prompt ───
await checkAsync('AC2: handleGetGuardrailsView_noConnectedRepo_orgSectionStillRenders', async () => {
  var pool = makeMockPool({ hasRepo: false, orgRepoRow: { repo_owner: 'org-co', repo_name: 'org-repo' } });
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (owner === 'org-co' && path === '.github/architecture-guardrails.md') { return 'REAL ORG CONTENT'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('REAL ORG CONTENT') !== -1, 'expected the org-level section to still render its real content');
    assert.ok(/connect a repo/i.test(result.body), 'expected the product-level connect-a-repo prompt to also be present — the page is not blocked/hidden');
  });
});
```

- [ ] **Step 2: Run test — expected to already pass (behaviour built in Task 1)**

```bash
node tests/check-wugs-s4-no-connected-repo-fallback.js
```

Expected: `2 passed, 0 failed` — if it fails, the org-level fetch/render block was accidentally made conditional on the product-level repo check; fix so the two are independent.

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
git add tests/check-wugs-s4-no-connected-repo-fallback.js
git commit -m "test(wugs-s4): lock in org section still renders alongside the prompt (AC2)"
```

---

## Task 3: Prompt links to the real connection flow (AC3)

**Files:**
- Modify: `tests/check-wugs-s4-no-connected-repo-fallback.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC3: prompt links to the real, existing connection flow ─────────────
await checkAsync('AC3: handleGetGuardrailsView_connectPrompt_linksToRealConnectionFlow', async () => {
  var pool = makeMockPool({ hasRepo: false });
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.ok(result.body.indexOf('href="/products/p1"') !== -1, 'expected the prompt to link to the real product view page (GET /products/:id), where the existing rpc-s1/prc-s2.1 connect-repo form lives — not a new route');
  });
});

// ── Wiring: the real connection route (prc-s1.2) still exists ───────────
check('wiring: server_js_still_routes_postProductsIdRepo_to_handlePostConnectRepo', () => {
  var fs = require('fs');
  var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
  assert.ok(serverSrc.indexOf('handlePostConnectRepo') !== -1, 'expected server.js to still reference the existing handlePostConnectRepo — confirms this story reused it rather than replacing it');
});
```

- [ ] **Step 2: Run tests — expected to already pass (behaviour built in Task 1)**

```bash
node tests/check-wugs-s4-no-connected-repo-fallback.js
```

Expected: `4 passed, 0 failed`

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
git add tests/check-wugs-s4-no-connected-repo-fallback.js
git commit -m "test(wugs-s4): lock in prompt reuses the real connection flow (AC3)"
```

---

## Task 4: Not sticky past repo connection (AC4) + accessibility (NFR) + final regression

**Files:**
- Modify: `tests/check-wugs-s4-no-connected-repo-fallback.js`

- [ ] **Step 1: Write the failing tests**

Add before the final `console.log`:

```javascript
// ── AC4: fallback state is not sticky past a repo connection ────────────
await checkAsync('AC4: handleGetGuardrailsView_repoConnectedAfterFallback_showsNormalContentNextLoad', async () => {
  var state = { hasRepo: false };
  var pool = makeMockPool(state);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { return 'REAL PRODUCT CONTENT'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req1 = mockReq();
    var res1 = mockRes();
    await products.handleGetProductGuardrailsView(req1, res1, null, pool);
    assert.ok(/connect a repo/i.test(res1._get().body), 'expected the fallback prompt on the first call (no repo yet)');

    // Simulate a real repo connection happening between the two page loads.
    state.hasRepo = true;

    var req2 = mockReq();
    var res2 = mockRes();
    await products.handleGetProductGuardrailsView(req2, res2, null, pool);
    var body2 = res2._get().body;
    assert.ok(!/connect a repo/i.test(body2), 'expected the fallback prompt to be GONE on the second call, now that a repo is connected');
    assert.ok(body2.indexOf('REAL PRODUCT CONTENT') !== -1, 'expected wugs-s2\'s normal product-level content on the second call — no stale/cached fallback state');
  });
});

// ── NFR-A11Y: the connect-a-repo prompt is a real, keyboard-accessible link ──
check('NFR-A11Y: connectPrompt_isRealFocusableLinkNotNonInteractiveText', () => {
  var fs = require('fs');
  var src = fs.readFileSync(require.resolve('../src/web-ui/routes/products.js'), 'utf8');
  var promptFnMatch = src.match(/function _renderNoConnectedRepoPrompt[\s\S]{0,600}/);
  assert.ok(promptFnMatch, 'expected to find _renderNoConnectedRepoPrompt in the source');
  assert.ok(/<a\s+href=/.test(promptFnMatch[0]), 'expected a real <a href> element, not a non-interactive <div>/<span> hint');
});
```

- [ ] **Step 2: Run tests — expected to already pass (behaviour built in Task 1)**

```bash
node tests/check-wugs-s4-no-connected-repo-fallback.js
```

Expected: `6 passed, 0 failed` — if AC4 fails, that's the RED signal; the fallback check must be re-evaluated fresh from `prodRow` on every call, not cached anywhere. If NFR-A11Y fails, use a real `<a href="...">`, not a `<div>`/`<span>`.

- [ ] **Step 3: Write minimal implementation**

No implementation change expected.

- [ ] **Step 4: Run test — must pass**

Expected: `6 passed, 0 failed`

- [ ] **Step 5: Full regression + story-level check**

```bash
node tests/check-wugs-s4-no-connected-repo-fallback.js
node tests/check-wugs-s2-product-level-guardrails-view.js
node tests/check-wugs-s3-org-level-guardrails-view.js
node tests/check-wugs-s5-create-edit-form.js
node tests/check-wugs-s6-branch-pr-creation-adapter.js
node tests/check-wugs-s7-surface-pr-state-in-view.js
```

All expected: 6/6, 11/11, 12/12, 13/13, 18/18, 8/8.

```bash
npm test
```

Expected: same 33 pre-existing baseline failures (see `decisions.md` RISK-ACCEPT for `wugs-s4`), 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s4-no-connected-repo-fallback.js
git commit -m "test(wugs-s4): lock in not-sticky-past-connection + accessible link (AC4, NFR-A11Y)"
```

---

## Final story-level check (before /verify-completion)

After all 4 tasks: `node tests/check-wugs-s4-no-connected-repo-fallback.js` → `6 passed, 0 failed`, plus all five sibling regression files unchanged, plus `npm test` at the documented baseline. No manual pre-merge step required (pure UI composition, no new write surface, no new external API calls).
