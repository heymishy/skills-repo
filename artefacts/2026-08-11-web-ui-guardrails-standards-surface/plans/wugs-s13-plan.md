# Admin sees real Approve/Reject buttons for pending promotion requests — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — extend `_renderPromotionAction` with a third rendering branch (pending + effectively-admin → real, wired Approve/Reject buttons), calling `wugs-s9`'s already-merged endpoints, with no changes to those endpoints themselves.
**Branch:** `feature/wugs-s13`
**Worktree:** `.worktrees/wugs-s13`
**Test command:** `node tests/check-wugs-s13-approve-reject-ui.js` (per task) / `npm test` (full suite, final step)

---

## File map

```
Create:
  tests/check-wugs-s13-approve-reject-ui.js   — AC1-AC6

Modify:
  src/web-ui/routes/products.js — _renderPromotionAction, _renderGuardrailsSection,
                                   handleGetProductGuardrailsView
```

**Design note — real current code, confirmed against merged master before writing this plan:**
- `_renderPromotionAction(productId, filePath, csrfToken, pendingPromotion)` (`products.js:1822`) currently has two branches: `if (pendingPromotion)` → static "pending approval" text; else → the "Request promotion" form. This plan adds a third path: when `pendingPromotion` is truthy AND a new `isAdmin` parameter is truthy, render real buttons instead of the static text.
- `_renderGuardrailsSection(guardrailsPiece, standardsPiece, productId, pendingByPath, promotionByPath, csrfToken)` (`products.js:1232`) calls `_renderPromotionAction` twice (lines 1249, 1266 — the product's own top-level guardrails file, and each standards-folder entry). Both call sites need the new `isAdmin` argument threaded through.
- `handleGetProductGuardrailsView` (`products.js:1877`) is where `req.session` is available — this is where `isEffectivelyAdmin(req.session)` gets computed once and passed down, matching the exact pattern already used for `csrfToken` (`_csrf.generateCsrfToken(req)`, computed once in this handler, threaded through the same call chain).
- `isEffectivelyAdmin` is already imported in this file (`var { isEffectivelyAdmin } = require('../modules/impersonation');`, added by `wugs-s9`) — reuse the existing import, do not add a second one.
- `promotionByPath.get(filePath)` returns `{requestId}` (from `_resolvePendingPromotions`, `products.js:1673`) — the real `requestId` needed to build the approve/reject buttons' endpoint URLs is already available at the render site with no additional query needed.
- The real endpoints this story wires to: `POST /api/admin/promotions/:requestId/approve` and `POST /api/admin/promotions/:requestId/reject` (both `wugs-s9`, `server.js` lines ~3193/3203) — CSRF-protected via a `_csrf` field in the request body, matching every other mutating endpoint in this file.

**Design note — client-side JS pattern, reusing an already-proven shape from this codebase's own history:** the removed `smug-s1` Standards tab's own `ssPromote`/`ssOptOut` functions (deleted in `wugs-s11`, but their shape is the established precedent for "a button that calls a mutating endpoint and updates its own row") used exactly this structure:
```javascript
function ssPromote(btn, id) {
  btn.disabled = true;
  fetch("/standards/" + id + "/promote", { method: "PUT" })
    .then(function(r) { if (!r.ok) throw new Error("failed"); return r.json(); })
    .then(function() {
      var row = document.getElementById("std-row-" + id);
      if (row) { /* update row's own state */ }
    })
    .catch(function() { btn.disabled = false; alert("Failed to promote this standard. Please try again."); });
}
```
This story's own `wugsApprove`/`wugsReject` functions follow the identical shape: disable-on-click, `fetch(...)` with the real endpoint and CSRF token, on success update the row's DOM (replace the buttons with a resolved-state indicator), on failure re-enable the button and `alert(...)` — matching AC3/AC4/AC5 exactly.

---

## Task 1: Render real buttons for admins (AC1/AC2), thread isAdmin through the call chain

**Files:**
- Create: `tests/check-wugs-s13-approve-reject-ui.js`
- Modify: `src/web-ui/routes/products.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-wugs-s13-approve-reject-ui.js`:

```javascript
'use strict';
// check-wugs-s13-approve-reject-ui.js — wugs-s13
//
// Confirms an effectively-admin session sees real, wired Approve/Reject
// buttons for a pending promotion request (AC1), a non-admin session sees
// the existing static text unchanged (AC2), the client-side handlers call
// the real wugs-s9 endpoints with CSRF and proper disable/update/error
// behaviour (AC3-AC5), and wugs-s9's own server-side role gate is
// unaffected (AC6, regression-checked via its own existing test file).

var assert = require('assert');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try { fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

var products = require('../src/web-ui/routes/products');

function mockReq(overrides) {
  return Object.assign({
    params: { id: 'prod-1' },
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
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        return { rows: state.prodRow ? [state.prodRow] : [] };
      }
      if (/SELECT id, path, pr_number, pr_url FROM guardrail_pending_prs WHERE tenant_id/i.test(s)) {
        return { rows: [] };
      }
      if (/SELECT request_id, file_path, status FROM guardrail_promotion_requests WHERE tenant_id/i.test(s)) {
        return { rows: state.pendingRequests || [] };
      }
      if (/SELECT repo_owner, repo_name FROM tenant_org_repo WHERE tenant_id/i.test(s)) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

(async () => {

// ── AC1: admin sees real buttons ─────────────────────────────────────────
await checkAsyncOrSync('AC1: adminSession_pendingRequest_rendersRealButtons', async () => {
  var pool = makeMockPool({
    prodRow: { name: 'P', tenant_id: 't1', repo_owner: 'org', repo_name: 'repo' },
    pendingRequests: [{ request_id: 'req-1', file_path: '.github/architecture-guardrails.md', status: 'pending' }]
  });
  var req = mockReq();
  var res = mockRes();
  await products.handleGetProductGuardrailsView(req, res, null, pool);
  var body = res._get().body;
  assert.ok(/<button[^>]*>\s*Approve\s*<\/button>/i.test(body) || />Approve</i.test(body), 'expected a real Approve button in the rendered HTML');
  assert.ok(/>Reject</i.test(body), 'expected a real Reject button in the rendered HTML');
  assert.ok(body.indexOf('req-1') !== -1, 'expected the real requestId embedded in the rendered button wiring');
  assert.ok(body.indexOf('Promotion requested — pending approval') === -1, 'expected the static text to be replaced, not shown alongside the buttons');
});

async function checkAsyncOrSync(name, fn) {
  try { await fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s13-approve-reject-ui.js
```

Expected: fails — no Approve/Reject buttons exist yet.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`:

1. In `handleGetProductGuardrailsView`, compute `isAdmin` once, right after `tenantId`/`login`/`token` are read:
```javascript
var isAdmin = !!(req.session && isEffectivelyAdmin(req.session));
```
Thread it into the `_renderGuardrailsSection` call (currently `_renderGuardrailsSection(guardrailsPiece, standardsPiece, productId, pendingByPath, promotionByPath, csrfToken)` → add `isAdmin` as a 7th argument).

2. Update `_renderGuardrailsSection`'s own signature to accept `isAdmin`, and thread it into both `_renderPromotionAction` call sites (lines ~1249, ~1266) as a new final argument.

3. Update `_renderPromotionAction`'s own signature: `function _renderPromotionAction(productId, filePath, csrfToken, pendingPromotion, isAdmin)`. Add the new branch:
```javascript
function _renderPromotionAction(productId, filePath, csrfToken, pendingPromotion, isAdmin) {
  if (pendingPromotion && isAdmin) {
    var reqId = _escapeHtml(pendingPromotion.requestId);
    return ' <span class="gv-promotion-admin-actions" id="promo-row-' + reqId + '" style="margin-left:8px">' +
      '<button type="button" onclick="wugsApprove(this,\'' + reqId + '\',\'' + _escapeHtml(csrfToken) + '\')" style="font-size:12px;color:var(--accent);background:none;border:1px solid var(--accent);border-radius:4px;padding:2px 8px;cursor:pointer;margin-right:4px">Approve</button>' +
      '<button type="button" onclick="wugsReject(this,\'' + reqId + '\',\'' + _escapeHtml(csrfToken) + '\')" style="font-size:12px;color:var(--muted);background:none;border:1px solid var(--line);border-radius:4px;padding:2px 8px;cursor:pointer">Reject</button>' +
    '</span>';
  }
  if (pendingPromotion) {
    return ' <span class="gv-promotion-pending" style="font-size:12px;color:var(--muted);margin-left:8px">Promotion requested — pending approval</span>';
  }
  return ' <form method="POST" action="/products/' + encodeURIComponent(productId) + '/guardrails/promote" style="display:inline;margin-left:8px">' +
    '<input type="hidden" name="path" value="' + _escapeHtml(filePath) + '">' +
    '<input type="hidden" name="_csrf" value="' + _escapeHtml(csrfToken) + '">' +
    '<button type="submit" style="font-size:12px;color:var(--accent);background:none;border:none;padding:0;cursor:pointer;text-decoration:underline">Request promotion</button>' +
  '</form>';
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s13-approve-reject-ui.js
```

Expected: `1 passed, 0 failed`

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
node tests/check-wugs-s3-org-level-guardrails-view.js
node tests/check-wugs-s8-request-promotion.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s13-approve-reject-ui.js
git commit -m "feat(wugs-s13): real Approve/Reject buttons for admin sessions on pending requests (AC1)"
```

---

## Task 2: Non-admin sees unchanged static text (AC2) — lock-in test

**Files:**
- Modify: `tests/check-wugs-s13-approve-reject-ui.js`

- [ ] **Step 1: Write the test (expected to already pass — lock-in, no source change)**

Add before the final `console.log`:

```javascript
// ── AC2: non-admin sees unchanged static text ────────────────────────────
await checkAsyncOrSync('AC2: nonAdminSession_pendingRequest_rendersStaticTextUnchanged', async () => {
  var pool = makeMockPool({
    prodRow: { name: 'P', tenant_id: 't1', repo_owner: 'org', repo_name: 'repo' },
    pendingRequests: [{ request_id: 'req-2', file_path: '.github/architecture-guardrails.md', status: 'pending' }]
  });
  var req = mockReq({ session: { accessToken: 'tok', tenantId: 't1', login: 'engineer-bob', role: 'engineer', csrfToken: 'ct1' } });
  var res = mockRes();
  await products.handleGetProductGuardrailsView(req, res, null, pool);
  var body = res._get().body;
  assert.ok(body.indexOf('Promotion requested — pending approval') !== -1, 'expected the existing static text to still render for a non-admin');
  assert.ok(body.indexOf('>Approve<') === -1, 'expected no Approve button leaked into non-admin-visible markup');
  assert.ok(body.indexOf('>Reject<') === -1, 'expected no Reject button leaked into non-admin-visible markup');
  assert.ok(body.indexOf('req-2') === -1, 'expected the requestId to NOT be embedded in non-admin-visible markup (only needed for the admin buttons)');
});
```

- [ ] **Step 2: Run — expected to already pass**

```bash
node tests/check-wugs-s13-approve-reject-ui.js
```

Expected: `2 passed, 0 failed`. If it fails, the admin/non-admin branching in Task 1 has a real bug — fix `_renderPromotionAction`'s conditional, don't force the test to match.

- [ ] **Step 3: Commit**

```bash
git add tests/check-wugs-s13-approve-reject-ui.js
git commit -m "test(wugs-s13): lock in AC2 -- non-admin sessions see unchanged static text"
```

---

## Task 3: Client-side wiring — fetch, CSRF, disable/update/error handling (AC3/AC4/AC5)

**Files:**
- Modify: `src/web-ui/routes/products.js`, `tests/check-wugs-s13-approve-reject-ui.js`

- [ ] **Step 1: Write the failing tests**

Add before the final `console.log`:

```javascript
// ── AC3/AC4/AC5: client-side handler wiring ──────────────────────────────
await checkAsyncOrSync('AC3: approveHandler_source_callsRealEndpointWithCsrfAndUpdatesRow', async () => {
  var pool = makeMockPool({
    prodRow: { name: 'P', tenant_id: 't1', repo_owner: 'org', repo_name: 'repo' },
    pendingRequests: [{ request_id: 'req-3', file_path: '.github/architecture-guardrails.md', status: 'pending' }]
  });
  var req = mockReq();
  var res = mockRes();
  await products.handleGetProductGuardrailsView(req, res, null, pool);
  var body = res._get().body;
  assert.ok(/function wugsApprove/.test(body), 'expected a wugsApprove client-side handler function in the rendered page');
  var fnMatch = body.match(/function wugsApprove[\s\S]*?\n\s*\}/);
  assert.ok(fnMatch, 'expected to extract wugsApprove function source');
  var fnSrc = fnMatch[0];
  assert.ok(/\.disabled\s*=\s*true/.test(fnSrc), 'expected the button to be disabled on click');
  assert.ok(/fetch\(/.test(fnSrc) && /\/api\/admin\/promotions\//.test(fnSrc) && /approve/.test(fnSrc), 'expected a fetch call to the real approve endpoint');
  assert.ok(/_csrf/.test(fnSrc), 'expected the CSRF token to be included in the request');
  assert.ok(/method:\s*["']POST["']/.test(fnSrc), 'expected a POST request');
});

await checkAsyncOrSync('AC4: rejectHandler_source_callsRealEndpointWithCsrfAndUpdatesRow', async () => {
  var pool = makeMockPool({
    prodRow: { name: 'P', tenant_id: 't1', repo_owner: 'org', repo_name: 'repo' },
    pendingRequests: [{ request_id: 'req-4', file_path: '.github/architecture-guardrails.md', status: 'pending' }]
  });
  var req = mockReq();
  var res = mockRes();
  await products.handleGetProductGuardrailsView(req, res, null, pool);
  var body = res._get().body;
  assert.ok(/function wugsReject/.test(body), 'expected a wugsReject client-side handler function in the rendered page');
  var fnMatch = body.match(/function wugsReject[\s\S]*?\n\s*\}/);
  assert.ok(fnMatch, 'expected to extract wugsReject function source');
  var fnSrc = fnMatch[0];
  assert.ok(/\.disabled\s*=\s*true/.test(fnSrc), 'expected the button to be disabled on click');
  assert.ok(/fetch\(/.test(fnSrc) && /\/api\/admin\/promotions\//.test(fnSrc) && /reject/.test(fnSrc), 'expected a fetch call to the real reject endpoint');
  assert.ok(/_csrf/.test(fnSrc), 'expected the CSRF token to be included in the request');
});

await checkAsyncOrSync('AC5: approveAndRejectHandlers_failurePath_reEnableButtonAndShowError', async () => {
  var pool = makeMockPool({
    prodRow: { name: 'P', tenant_id: 't1', repo_owner: 'org', repo_name: 'repo' },
    pendingRequests: [{ request_id: 'req-5', file_path: '.github/architecture-guardrails.md', status: 'pending' }]
  });
  var req = mockReq();
  var res = mockRes();
  await products.handleGetProductGuardrailsView(req, res, null, pool);
  var body = res._get().body;
  ['wugsApprove', 'wugsReject'].forEach(function (fnName) {
    var fnMatch = body.match(new RegExp('function ' + fnName + '[\\s\\S]*?catch[\\s\\S]*?\\}\\s*\\)'));
    assert.ok(fnMatch, 'expected to find ' + fnName + '\'s own catch/failure branch');
    var fnSrc = fnMatch[0];
    assert.ok(/\.disabled\s*=\s*false/.test(fnSrc), fnName + ': expected the button to re-enable on failure');
    assert.ok(/alert\(/.test(fnSrc), fnName + ': expected a clear error to be surfaced on failure');
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s13-approve-reject-ui.js
```

Expected: the 3 new checks fail — no `wugsApprove`/`wugsReject` functions exist yet.

- [ ] **Step 3: Write minimal implementation**

In `_renderPromotionAction`'s admin branch (added in Task 1), the buttons already call `wugsApprove`/`wugsReject` — now add those two functions to the page's embedded `<script>` block. Find where `_renderGuardrailsSection` (or its caller) already emits a `<script>` tag for this page (check for an existing script block in the guardrails view's own HTML shell, or add a new one if none exists at this scope) and add:

```javascript
function wugsApprove(btn, requestId, csrfToken) {
  btn.disabled = true;
  fetch('/api/admin/promotions/' + requestId + '/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _csrf: csrfToken })
  })
    .then(function(r) { if (!r.ok) throw new Error('failed'); return r.json(); })
    .then(function() {
      var row = document.getElementById('promo-row-' + requestId);
      if (row) { row.outerHTML = ' <span style="font-size:12px;color:var(--accent);margin-left:8px">Approved</span>'; }
    })
    .catch(function() { btn.disabled = false; alert('Failed to approve this request. Please try again.'); });
}
function wugsReject(btn, requestId, csrfToken) {
  btn.disabled = true;
  fetch('/api/admin/promotions/' + requestId + '/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _csrf: csrfToken })
  })
    .then(function(r) { if (!r.ok) throw new Error('failed'); return r.json(); })
    .then(function() {
      var row = document.getElementById('promo-row-' + requestId);
      if (row) { row.outerHTML = ' <span style="font-size:12px;color:var(--muted);margin-left:8px">Rejected</span>'; }
    })
    .catch(function() { btn.disabled = false; alert('Failed to reject this request. Please try again.'); });
}
```

(If no existing `<script>` block exists at the scope these functions need to live in, add one — check how `handleGetProductGuardrailsView`'s own rendered HTML shell is assembled, and follow the same pattern the removed `ssPromote`/`ssOptOut` functions used: emitted once per page, inline, not per-row.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s13-approve-reject-ui.js
```

Expected: `5 passed, 0 failed`

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
node tests/check-wugs-s3-org-level-guardrails-view.js
node tests/check-wugs-s7-surface-pr-state-in-view.js
node tests/check-wugs-s8-request-promotion.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s13-approve-reject-ui.js
git commit -m "feat(wugs-s13): client-side approve/reject wiring -- fetch, CSRF, disable/update/error handling (AC3/AC4/AC5)"
```

---

## Task 4: AC6 regression check + final full-suite regression

**Files:** None new — verification-only task

- [ ] **Step 1: Re-run `wugs-s9`'s own existing AC3 tests unchanged**

```bash
node tests/check-wugs-s9-approve-reject-promotion.js
```

Expected: `10 passed, 0 failed`, exactly as before this story — confirms this story's own client-side-only changes did not touch or weaken the server-side role gate `wugs-s9` already built.

- [ ] **Step 2: Full regression + story-level check**

```bash
node tests/check-wugs-s13-approve-reject-ui.js
node tests/check-wugs-s9-approve-reject-promotion.js
node tests/check-wugs-s8-request-promotion.js
node tests/check-wugs-s2-product-level-guardrails-view.js
node tests/check-wugs-s3-org-level-guardrails-view.js
node tests/check-wugs-s7-surface-pr-state-in-view.js
```

```bash
npm test
```

Expected: the documented pre-existing baseline (33 failures, same names).

- [ ] **Step 3: Commit**

```bash
git add -A -- tests/check-wugs-s13-approve-reject-ui.js
git commit -m "test(wugs-s13): AC6 regression confirmation -- wugs-s9's server-side role gate unaffected"
```

(If Step 2 required no new file changes, this commit may be empty/unnecessary — skip if `git status` shows nothing to commit.)

---

## Final story-level check (before /verify-completion)

After all 4 tasks: `node tests/check-wugs-s13-approve-reject-ui.js` → `5 passed, 0 failed`, all sibling regression files unchanged, `npm test` at the documented baseline. This story closes `/trace`'s 2026-08-14 HIGH finding — after it merges, `benefit-metric.md`'s Metric 2 becomes measurable through the real product for the first time, not only via direct API calls.
