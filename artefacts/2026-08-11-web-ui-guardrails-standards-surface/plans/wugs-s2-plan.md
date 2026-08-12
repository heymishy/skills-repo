# Show a product's own guardrails and standards, read live from its connected repo — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — render a product's `.github/architecture-guardrails.md` and `standards/` folder, read live from its connected repo via `wugs-s1`'s `fetchRepoPath`, with an explicit empty state, an isolated per-section error state, and the products-nav sidebar correctly wired.
**Branch:** `feature/wugs-s2`
**Worktree:** `.worktrees/wugs-s2`
**Test command:** `node tests/check-wugs-s2-product-level-guardrails-view.js` (per task) / `npm test` (full suite, final step)

---

## File map

```
Create:
  tests/check-wugs-s2-product-level-guardrails-view.js  — AC1–AC5 + 2 NFR tests for the new route

Modify:
  src/web-ui/routes/products.js  — add _fetchGuardrailsSectionPiece, _renderGuardrailsSection,
                                    handleGetProductGuardrailsView; export the handler; require
                                    artefact-fetcher
  src/web-ui/server.js           — register GET /products/:id/guardrails, import the new handler
```

Route path chosen: `/products/:id/guardrails` — distinct from the existing `/products/:id/standards-tab`
(`smug-s1`, DB-backed standard docs with promote/opt-out) and `/products/:id/standards` (JSON API for the
same DB table). This story's "standards" are live repo files, a different concept entirely, so it gets its
own path rather than overloading either existing one.

---

## Task 1: Guardrails-file section — fetch, render, empty and error states (AC1)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Create: `tests/check-wugs-s2-product-level-guardrails-view.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-wugs-s2-product-level-guardrails-view.js`:

```javascript
'use strict';
// check-wugs-s2-product-level-guardrails-view.js — wugs-s2
//
// Unit/integration tests for the product-level guardrails/standards view:
// live-reads .github/architecture-guardrails.md and standards/ from the
// product's connected repo via wugs-s1's fetchRepoPath (ADR-012 reuse).

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
    session: { accessToken: 'tok', tenantId: 't1', login: 'alice' }
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

// Mock pool covering the product-lookup query (with repo_owner/repo_name)
// and getProductsNavSummary's real query shapes (products.js:1336-1360,
// matching check-rapp-s2's own makeMockPool convention).
function makeMockPool(navProducts) {
  return {
    query: async function (sql) {
      var s = String(sql);
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        return { rows: [{ name: 'Test Product', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }] };
      }
      if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(s)) {
        return { rows: (navProducts || []).map(function (p) { return { product_id: p.id, name: p.name, created_at: new Date().toISOString() }; }) };
      }
      if (/SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id/i.test(s)) {
        return { rows: [] };
      }
      if (/SELECT journey_id FROM journeys WHERE tenant_id.*product_id IS NULL/i.test(s)) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

// wugs-s1's fetchRepoPath is injectable (D37) — save/restore around each
// test so mocks never leak between tests (same convention as wugs-s1's own
// withMockedFetch helper).
async function withMockedFetchRepoPath(mockFn, testFn) {
  var original = artefactFetcher.getFetchRepoPath();
  artefactFetcher.setFetchRepoPath(mockFn);
  try {
    await testFn();
  } finally {
    artefactFetcher.setFetchRepoPath(original);
  }
}

(async () => {

// ── AC1: renders real guardrails.md content ─────────────────────────────
await checkAsync('AC1: handleGetGuardrailsView_productHasGuardrailsFile_rendersRealContent', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { return 'REAL GUARDRAILS CONTENT XYZ'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
    assert.ok(result.body.indexOf('REAL GUARDRAILS CONTENT XYZ') !== -1, 'expected real guardrails content in response');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected output: `FAIL: AC1: ... — products.handleGetProductGuardrailsView is not a function` (handler does not exist yet)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, add the require near the other adapter requires (after line 22's `_standardsRoutes` require):

```javascript
var _artefactFetcher = require('../adapters/artefact-fetcher'); // wugs-s2 — reuses wugs-s1's fetchRepoPath (ADR-012)
```

Add the fetch-piece helper and render/handler functions after `_renderStandardsTab` (after its closing `}` around line 1155, before `handleGetProductStandardsTab`):

```javascript
/**
 * wugs-s2 — fetches a single repo path (file or folder) for the
 * guardrails/standards view, isolating failures per-piece (AC4) rather
 * than letting one GitHub API error crash the whole page render.
 * @returns {Promise<{status: 'ok'|'empty'|'error', value: (string|Array|null), errorMessage: (string|null)}>}
 */
async function _fetchGuardrailsSectionPiece(owner, repo, path, token) {
  try {
    var value = await _artefactFetcher.fetchRepoPath(owner, repo, path, token);
    return { status: 'ok', value: value, errorMessage: null };
  } catch (e) {
    if (e instanceof _artefactFetcher.ArtefactNotFoundError) {
      return { status: 'empty', value: null, errorMessage: null };
    }
    return { status: 'error', value: null, errorMessage: (e && e.message) || 'Unknown error' };
  }
}

/**
 * wugs-s2 — product-level guardrails/standards section: live-reads
 * .github/architecture-guardrails.md and standards/ from the product's
 * connected repo. Each piece renders independently so a failure in one
 * does not affect the other (AC4).
 */
function _renderGuardrailsSection(guardrailsPiece) {
  var guardrailsHtml;
  if (guardrailsPiece.status === 'ok') {
    guardrailsHtml = '<pre class="gv-guardrails-content" style="white-space:pre-wrap;font-family:inherit;font-size:14px;background:var(--surface);padding:16px;border-radius:8px;border:1px solid var(--line)">' + _escapeHtml(guardrailsPiece.value) + '</pre>';
  } else if (guardrailsPiece.status === 'empty') {
    guardrailsHtml = '<p class="gv-guardrails-empty" style="color:var(--muted);font-size:14px">No architecture-guardrails.md found in this repo.</p>';
  } else {
    guardrailsHtml = '<p class="gv-guardrails-error" style="color:var(--danger,#c0392b);font-size:14px">Could not load architecture-guardrails.md: ' + _escapeHtml(guardrailsPiece.errorMessage) + '</p>';
  }

  return '<div class="gv-product-section">' +
    '<h2 style="font-size:18px;margin:0 0 12px">Architecture guardrails</h2>' +
    guardrailsHtml +
  '</div>';
}

/**
 * wugs-s2 — GET /products/:id/guardrails: live-read product-level
 * architecture guardrails + standards from the product's connected repo.
 */
async function handleGetProductGuardrailsView(req, res, _next, pool) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var login = req.session && req.session.login;
  var token = req.session && req.session.accessToken;

  var prodRow = (await _pool.query(
    'SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }

  var guardrailsPiece = await _fetchGuardrailsSectionPiece(prodRow.repo_owner, prodRow.repo_name, '.github/architecture-guardrails.md', token);
  var productSectionHtml = _renderGuardrailsSection(guardrailsPiece);

  var navSummary = await getProductsNavSummary(_pool, tenantId);

  var body = '<div style="max-width:720px">' +
    '<div style="margin-bottom:24px"><h1 style="margin:0;font-size:24px">Guardrails &amp; Standards</h1></div>' +
    productSectionHtml +
  '</div>';

  var html = _htmlShell.renderShell({
    title: 'Guardrails & Standards',
    bodyContent: body,
    user: { login: login },
    active: 'dashboard',
    crumbs: [prodRow.name, 'Guardrails & Standards'],
    products: navSummary.products,
    activeProductId: productId,
    noProductJourneyCount: navSummary.noProductJourneyCount
  });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}
```

Add `handleGetProductGuardrailsView` to `module.exports` (near `handleGetProductStandardsTab` in the exports block at the bottom of the file).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected output: `1 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 33 pre-existing failures as baseline (see `decisions.md` RISK-ACCEPT), 0 new failures

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s2-product-level-guardrails-view.js
git commit -m "feat(wugs-s2): render product-level architecture-guardrails.md content (AC1)"
```

---

## Task 2: Standards-folder listing (AC2)

**Files:**
- Modify: `src/web-ui/routes/products.js`, `tests/check-wugs-s2-product-level-guardrails-view.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log('\n' + passed ...` line in the test file:

```javascript
// ── AC2: lists real standards/ folder entries ────────────────────────────
await checkAsync('AC2: handleGetGuardrailsView_productHasStandardsFolder_listsEntries', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path); }
    if (path === 'standards/') { return [{ name: 'saas-gui', path: 'standards/saas-gui', type: 'dir' }, { name: 'backend-api', path: 'standards/backend-api', type: 'dir' }]; }
    throw new Error('unexpected path: ' + path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('saas-gui') !== -1, 'expected the real "saas-gui" entry name in the response');
    assert.ok(result.body.indexOf('backend-api') !== -1, 'expected the real "backend-api" entry name in the response');
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected output: `FAIL: AC2: ... — expected the real "saas-gui" entry name in the response` (standards piece is not fetched or rendered yet)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, extend `_renderGuardrailsSection` to accept and render the standards piece, and fetch it in the handler.

Replace `_renderGuardrailsSection(guardrailsPiece)` with:

```javascript
function _renderGuardrailsSection(guardrailsPiece, standardsPiece) {
  var guardrailsHtml;
  if (guardrailsPiece.status === 'ok') {
    guardrailsHtml = '<pre class="gv-guardrails-content" style="white-space:pre-wrap;font-family:inherit;font-size:14px;background:var(--surface);padding:16px;border-radius:8px;border:1px solid var(--line)">' + _escapeHtml(guardrailsPiece.value) + '</pre>';
  } else if (guardrailsPiece.status === 'empty') {
    guardrailsHtml = '<p class="gv-guardrails-empty" style="color:var(--muted);font-size:14px">No architecture-guardrails.md found in this repo.</p>';
  } else {
    guardrailsHtml = '<p class="gv-guardrails-error" style="color:var(--danger,#c0392b);font-size:14px">Could not load architecture-guardrails.md: ' + _escapeHtml(guardrailsPiece.errorMessage) + '</p>';
  }

  var standardsHtml;
  if (standardsPiece.status === 'ok') {
    var entries = Array.isArray(standardsPiece.value) ? standardsPiece.value : [];
    standardsHtml = entries.length === 0
      ? '<p class="gv-standards-empty" style="color:var(--muted);font-size:14px">No standards found in this repo.</p>'
      : '<ul class="gv-standards-list">' + entries.map(function (e) {
          return '<li>' + _escapeHtml(e.name) + '</li>';
        }).join('') + '</ul>';
  } else if (standardsPiece.status === 'empty') {
    standardsHtml = '<p class="gv-standards-empty" style="color:var(--muted);font-size:14px">No standards found in this repo.</p>';
  } else {
    standardsHtml = '<p class="gv-standards-error" style="color:var(--danger,#c0392b);font-size:14px">Could not load standards/: ' + _escapeHtml(standardsPiece.errorMessage) + '</p>';
  }

  return '<div class="gv-product-section">' +
    '<h2 style="font-size:18px;margin:0 0 12px">Architecture guardrails</h2>' +
    guardrailsHtml +
    '<h2 style="font-size:18px;margin:24px 0 12px">Standards</h2>' +
    standardsHtml +
  '</div>';
}
```

In `handleGetProductGuardrailsView`, add the standards fetch right after the guardrails fetch and pass both into the renderer:

```javascript
  var guardrailsPiece = await _fetchGuardrailsSectionPiece(prodRow.repo_owner, prodRow.repo_name, '.github/architecture-guardrails.md', token);
  var standardsPiece = await _fetchGuardrailsSectionPiece(prodRow.repo_owner, prodRow.repo_name, 'standards/', token);
  var productSectionHtml = _renderGuardrailsSection(guardrailsPiece, standardsPiece);
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected output: `2 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 33 pre-existing failures as baseline, 0 new failures

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s2-product-level-guardrails-view.js
git commit -m "feat(wugs-s2): list real standards/ folder entries (AC2)"
```

---

## Task 3: Empty-repo state + accessibility text-label NFR (AC3, NFR-A11Y)

**Files:**
- Modify: `tests/check-wugs-s2-product-level-guardrails-view.js` (implementation already handles this from Task 1/2's status branching — this task locks the behaviour in with tests)

- [ ] **Step 1: Write the failing test**

Add before the final `console.log` line:

```javascript
// ── AC3: empty-repo state, not fabricated ────────────────────────────────
await checkAsync('AC3: handleGetGuardrailsView_emptyRepo_showsExplicitEmptyState', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('No architecture-guardrails.md found in this repo.') !== -1, 'expected explicit "none found" text for the missing guardrails file');
    assert.ok(result.body.indexOf('No standards found in this repo.') !== -1, 'expected explicit "none found" text for the missing standards folder');
  });
});

// ── NFR-A11Y: empty state conveyed via text, not colour alone ───────────
await checkAsync('NFR-A11Y: emptyState_conveyedViaText_notColourAlone', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    // A real text string describing the state must be present, not just a
    // CSS class name (e.g. "gv-guardrails-empty" alone would fail this).
    assert.ok(/No architecture-guardrails\.md found/.test(result.body), 'expected a real text sentence, not just a class name, for the empty state');
  });
});
```

- [ ] **Step 2: Run test — expected to already pass (behaviour built in Tasks 1–2)**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected output: `4 passed, 0 failed` — if either fails, the `status === 'empty'` branches from Task 1/2 need fixing before continuing (this is the RED signal for this task if it occurs).

- [ ] **Step 3: Write minimal implementation**

No implementation change expected — Task 1/2's `_fetchGuardrailsSectionPiece`/`_renderGuardrailsSection` already handle the `'empty'` status with real text. If Step 2 failed, fix the empty-state text branches in `_renderGuardrailsSection` until both tests pass.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected output: `4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 33 pre-existing failures as baseline, 0 new failures

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s2-product-level-guardrails-view.js
git commit -m "test(wugs-s2): lock in empty-repo state and accessibility text-label NFR (AC3)"
```

---

## Task 4: Isolated fetch-failure error state (AC4)

**Files:**
- Modify: `tests/check-wugs-s2-product-level-guardrails-view.js` (implementation already isolates failures per-piece from Task 1's `_fetchGuardrailsSectionPiece` try/catch)

- [ ] **Step 1: Write the failing test**

Add before the final `console.log` line:

```javascript
// ── AC4: fetch failure — isolated error state, rest of page still renders ─
await checkAsync('AC4: handleGetGuardrailsView_fetchFails_sectionIsolatedError', async () => {
  var pool = makeMockPool([{ id: 'p2', name: 'Nav Product One' }]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { throw new artefactFetcher.ArtefactFetchError('Network error fetching repo path', 'rate limit exceeded'); }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'a section-level fetch failure must not crash the whole response');
    assert.ok(result.body.indexOf('Could not load architecture-guardrails.md') !== -1, 'expected a named error state for the guardrails section');
    // Rest of the page (nav) still renders — regression guard consistent with AC5.
    assert.ok(result.body.indexOf('Nav Product One') !== -1, 'expected the nav sidebar to still render despite the guardrails-section failure');
  });
});
```

- [ ] **Step 2: Run test — expected to already pass (isolation built into Task 1's helper)**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected output: `5 passed, 0 failed` — if it fails, `_fetchGuardrailsSectionPiece`'s try/catch isn't isolating correctly; this is the RED signal for this task if it occurs.

- [ ] **Step 3: Write minimal implementation**

No implementation change expected — `_fetchGuardrailsSectionPiece`'s try/catch (Task 1) already isolates each piece's failure so the handler continues past it. If Step 2 failed, fix `_fetchGuardrailsSectionPiece` so a piece-level error never propagates out of the function.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected output: `5 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 33 pre-existing failures as baseline, 0 new failures

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s2-product-level-guardrails-view.js
git commit -m "test(wugs-s2): lock in isolated per-section fetch-failure error state (AC4)"
```

---

## Task 5: Nav/activeProductId regression guard + escaping NFR (AC5, NFR-SEC-01)

**Files:**
- Modify: `tests/check-wugs-s2-product-level-guardrails-view.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log` line:

```javascript
// ── AC5: nav/activeProductId regression guard (rapp-s2-class bug) ────────
await checkAsync('AC5: handleGetGuardrailsView_nav_rendersFullSidebarAndActiveProduct', async () => {
  var pool = makeMockPool([{ id: 'p2', name: 'Nav Product One' }]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq({ params: { id: 'p1' } });
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('Nav Product One') !== -1, 'expected the products-nav sidebar to be populated');
    assert.ok(result.body.indexOf('/products/p1') !== -1, 'expected the current product to appear as a real nav link (activeProductId wired)');
  });
});

// ── NFR-SEC-01: repo content is escaped before rendering ────────────────
await checkAsync('NFR-SEC-01: guardrailsContent_withScriptTag_isEscapedNotLiveMarkup', async () => {
  var pool = makeMockPool([]);
  var malicious = '<script>alert(1)</script><img src=x onerror="alert(2)">';
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { return malicious; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.ok(result.body.indexOf('<script>alert(1)</script>') === -1, 'expected the <script> tag to be escaped, not rendered live');
    assert.ok(result.body.indexOf('onerror="alert(2)"') === -1, 'expected the onerror attribute to be escaped, not rendered live');
    assert.ok(result.body.indexOf('&lt;script&gt;') !== -1, 'expected the escaped form of the script tag to be present');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
```

(This replaces the plain `console.log('\n' + passed ...)` block added at the end of Task 1's Step 1 — remove the earlier duplicate so it appears exactly once, at the very end of the file.)

- [ ] **Step 2: Run test — must fail initially only if escaping/nav wiring is missing**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected output: `7 passed, 0 failed` — both tests should already pass from Task 1's `_escapeHtml` usage and `getProductsNavSummary`/`activeProductId` wiring. If AC5 or NFR-SEC-01 fails, that is the RED signal for this task.

- [ ] **Step 3: Write minimal implementation**

No implementation change expected. If Step 2 failed:
- For AC5: confirm `handleGetProductGuardrailsView` passes `products: navSummary.products` and `activeProductId: productId` to `renderShell` (Task 1's code already does this).
- For NFR-SEC-01: confirm `_renderGuardrailsSection` wraps `guardrailsPiece.value` in `_escapeHtml(...)` before interpolating into the `<pre>` block (Task 1's code already does this).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected output: `7 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 33 pre-existing failures as baseline, 0 new failures

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s2-product-level-guardrails-view.js
git commit -m "test(wugs-s2): lock in nav/activeProductId wiring and content-escaping NFR (AC5)"
```

---

## Task 6: Wire the real route in server.js

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log` line in the test file:

```javascript
// ── Wiring: GET /products/:id/guardrails is routed in server.js ─────────
check('wiring: server_js_routes_getProductsGuardrails_to_handler', () => {
  var fs = require('fs');
  var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
  assert.ok(serverSrc.indexOf('/guardrails$/') !== -1, 'expected server.js to route GET /products/:id/guardrails');
  assert.ok(serverSrc.indexOf('handleGetProductGuardrailsView') !== -1, 'expected server.js to reference handleGetProductGuardrailsView');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected output: `FAIL: wiring: ... — expected server.js to route GET /products/:id/guardrails`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, add `handleGetProductGuardrailsView` to the destructured import from `./routes/products` (the long `require('./routes/products')` line, alongside `handleGetProductStandardsTab`):

```javascript
const { handlePostProductNew, handlePostProductConfirm, handleGetDashboard: _handleGetDashboard, handleGetProductNew, handleGetProductView, handleGetProductRoadmap, handleGetProductStandardsTab, handleGetProductGuardrailsView, handlePostProductSync, handlePostProductFeature, handleGetProductKanban, handleGetOrgKanban, handlePostBoardAdvance, handleDeleteProduct, handlePostProductRepoCreate, handlePutProductEdit, handleGetProductModules, handlePostProductModule, handlePutProductModule, handleDeleteProductModule, handlePutEpicModule, handlePostBulkAssignFeatureModules } = require('./routes/products'); // psh-s3 / psh-s4 / psh-s6 / psh-s7 / prc-s4.2 / prc-s2.1 / prc-s4.1 / pr-s3 / a1 / a2 / a5 / tmc-s1 / s1.1 / smug-s1 / wugs-s2
```

Add the route, right after the existing `standards-tab` route block (after its closing line):

```javascript
  } else if (pathname.match(/^\/products\/[^/]+\/guardrails$/) && req.method === 'GET') {
    // wugs-s2 -- product-level guardrails/standards view: live-reads
    // .github/architecture-guardrails.md and standards/ from the product's
    // connected repo. Distinct from /products/:id/standards-tab (smug-s1,
    // DB-backed standard docs) and /products/:id/standards (its JSON API).
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handleGetProductGuardrailsView(req, res, null, _pshPool); });
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected output: `8 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 33 pre-existing failures as baseline, 0 new failures

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-wugs-s2-product-level-guardrails-view.js
git commit -m "feat(wugs-s2): wire GET /products/:id/guardrails to handleGetProductGuardrailsView"
```

---

## Final story-level check (before /verify-completion)

After all 6 tasks:

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected: `8 passed, 0 failed` (AC1, AC2, AC3, NFR-A11Y, AC4, AC5, NFR-SEC-01, wiring)

```bash
npm test
```

Expected: same 33 pre-existing baseline failures (see `decisions.md` RISK-ACCEPT for `wugs-s2`), 0 new failures, 8 new passing tests from this story.
