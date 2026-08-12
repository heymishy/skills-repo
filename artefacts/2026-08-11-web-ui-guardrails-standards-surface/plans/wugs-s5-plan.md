# Provide a create/edit form for a guardrail or standard — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — add Add/Edit actions to the product-level guardrails/standards view (built by `wugs-s2`), a form to create/edit an entry pre-filled with real content, and a server-side submission handler that rejects empty content and hands valid content to the write path (`wugs-s6`, not yet built).
**Branch:** `feature/wugs-s5`
**Worktree:** `.worktrees/wugs-s5`
**Test command:** `node tests/check-wugs-s5-create-edit-form.js` (per task) / `npm test` (full suite, final step)

---

## File map

```
Create:
  tests/check-wugs-s5-create-edit-form.js  — AC1-AC4 + NFR-SEC-01

Modify:
  src/web-ui/routes/products.js  — extend _renderGuardrailsSection with Add/Edit links;
                                    add _renderGuardrailsForm, handleGetGuardrailsForm,
                                    _validateGuardrailContent, handlePostGuardrailsForm
  src/web-ui/server.js           — register GET /products/:id/guardrails/form only
```

**Design note on the write path (AC4), read before starting:** `wugs-s6` (the story that builds the real
write adapter — branch creation, PR opening) does not exist yet. The DoR's own H-ADAPTER check confirmed
"No new adapter introduced by this story" — so `handlePostGuardrailsForm` takes the write function as a
plain parameter (`writeAdapter`), the same way every handler already takes `pool` as a parameter, not as a
D37 module-level injectable singleton. This story builds and fully tests the handler's own logic (empty-content
rejection, correct target+content handed to whatever `writeAdapter` it's given) by injecting a test double
directly in tests. **The POST route itself is intentionally NOT wired into `server.js` in this story** — there
is no real `writeAdapter` to wire it to yet. Wiring the real POST route together with the real write adapter is
explicitly `wugs-s6`'s job (story Dependencies: "Downstream: `wugs-s6` (the form's submission triggers the write
adapter)"). This means the Add/Edit links and the GET form will be live and working after this story merges,
but submitting the form will 404 until `wugs-s6` ships — an intentional, already-documented mid-epic gap, not
an oversight.

---

## Task 1: Add/Edit action links in the guardrails/standards view (AC1)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Create: `tests/check-wugs-s5-create-edit-form.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-wugs-s5-create-edit-form.js`:

```javascript
'use strict';
// check-wugs-s5-create-edit-form.js — wugs-s5
//
// Unit/integration tests for the create/edit form: Add/Edit action links on
// the product-level guardrails/standards view (wugs-s2), a pre-filled edit
// form, and server-side validation + write-path hand-off.

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
    query: {},
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

// ── AC1: Add/Edit actions present ─────────────────────────────────────
await checkAsync('AC1: guardrailsView_rendersAddAndEditActions', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { return 'REAL GUARDRAILS CONTENT'; }
    if (path === 'standards/') { return [{ name: 'saas-gui', path: 'standards/saas-gui', type: 'dir' }]; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    // An "Edit" action for the existing guardrails file.
    assert.ok(result.body.indexOf('/products/p1/guardrails/form?path=' + encodeURIComponent('.github/architecture-guardrails.md')) !== -1, 'expected an Edit link for the existing guardrails file');
    // An "Edit" action for the existing standards entry.
    assert.ok(result.body.indexOf('/products/p1/guardrails/form?path=' + encodeURIComponent('standards/saas-gui')) !== -1, 'expected an Edit link for the existing standards entry');
    // An "Add" action for creating a new standard.
    assert.ok(result.body.indexOf('/products/p1/guardrails/form?section=standards') !== -1, 'expected an Add link for creating a new standard');
    assert.ok(/>Add</.test(result.body), 'expected the literal "Add" label to appear');
    assert.ok(/>Edit</.test(result.body), 'expected the literal "Edit" label to appear');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s5-create-edit-form.js
```

Expected output: `FAIL: AC1: ... — expected an Edit link for the existing guardrails file` (no links exist yet)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, replace the current `_renderGuardrailsSection` function body with a version that adds Add/Edit links. Find the function (search for `function _renderGuardrailsSection`) and replace it entirely with:

```javascript
function _renderGuardrailsSection(guardrailsPiece, standardsPiece, productId) {
  var guardrailsPath = '.github/architecture-guardrails.md';
  var guardrailsEditHref = '/products/' + encodeURIComponent(productId) + '/guardrails/form?path=' + encodeURIComponent(guardrailsPath);
  var guardrailsActionHtml = '<a href="' + guardrailsEditHref + '" style="font-size:13px;color:var(--accent)">' + (guardrailsPiece.status === 'ok' ? 'Edit' : 'Add') + '</a>';

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
          var editHref = '/products/' + encodeURIComponent(productId) + '/guardrails/form?path=' + encodeURIComponent(e.path);
          return '<li style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
            '<span>' + _escapeHtml(e.name) + '</span>' +
            '<a href="' + editHref + '" style="font-size:13px;color:var(--accent)">Edit</a>' +
          '</li>';
        }).join('') + '</ul>';
  } else if (standardsPiece.status === 'empty') {
    standardsHtml = '<p class="gv-standards-empty" style="color:var(--muted);font-size:14px">No standards found in this repo.</p>';
  } else {
    standardsHtml = '<p class="gv-standards-error" style="color:var(--danger,#c0392b);font-size:14px">Could not load standards/: ' + _escapeHtml(standardsPiece.errorMessage) + '</p>';
  }

  var addStandardHref = '/products/' + encodeURIComponent(productId) + '/guardrails/form?section=standards';

  return '<div class="gv-product-section">' +
    '<div style="display:flex;align-items:center;justify-content:space-between"><h2 style="font-size:18px;margin:0 0 12px">Architecture guardrails</h2>' + guardrailsActionHtml + '</div>' +
    guardrailsHtml +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:24px"><h2 style="font-size:18px;margin:0 0 12px">Standards</h2><a href="' + addStandardHref + '" style="font-size:13px;color:var(--accent)">Add</a></div>' +
    standardsHtml +
  '</div>';
}
```

Then update the one call site in `handleGetProductGuardrailsView` (search for `_renderGuardrailsSection(guardrailsPiece, standardsPiece)`) to pass `productId`:

```javascript
  var productSectionHtml = _renderGuardrailsSection(guardrailsPiece, standardsPiece, productId);
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s5-create-edit-form.js
```

Expected output: `1 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected: 33 pre-existing failures (documented baseline), 0 new. Also run `node tests/check-wugs-s2-product-level-guardrails-view.js` directly to confirm wugs-s2's own 11 tests still pass unmodified by this change (the function signature grew a new optional-in-practice-but-required-here `productId` param — verify none of wugs-s2's tests broke from this).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s5-create-edit-form.js
git commit -m "feat(wugs-s5): add Add/Edit action links to guardrails/standards view (AC1)"
```

---

## Task 2: GET form route with pre-fill (AC2, NFR-SEC-01)

**Files:**
- Modify: `src/web-ui/routes/products.js`, `tests/check-wugs-s5-create-edit-form.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log('\n' + passed ...` line:

```javascript
// ── AC2: Edit form pre-filled with real current content ─────────────────
await checkAsync('AC2: editForm_prefillsWithRealCurrentContent', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === 'standards/saas-gui') { return 'REAL SAAS-GUI STANDARD CONTENT'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq({ query: { path: 'standards/saas-gui' } });
    var res = mockRes();
    await products.handleGetGuardrailsForm(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('REAL SAAS-GUI STANDARD CONTENT') !== -1, 'expected the real current content pre-filled in the form');
  });
});

// ── AC2 (blank mode): Add form (no path) renders blank, no fetch needed ──
await checkAsync('AC2: addForm_noPath_rendersBlank', async () => {
  var pool = makeMockPool([]);
  await withMockedFetchRepoPath(async function () {
    throw new Error('should not fetch in add mode');
  }, async function () {
    var req = mockReq({ query: { section: 'standards' } });
    var res = mockRes();
    await products.handleGetGuardrailsForm(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('<textarea') !== -1, 'expected a blank textarea for add mode');
  });
});

// ── NFR-SEC-01: pre-filled content is escaped before rendering ──────────
await checkAsync('NFR-SEC-01: editForm_withScriptTag_isEscapedNotLiveMarkup', async () => {
  var pool = makeMockPool([]);
  var malicious = '<script>alert(1)</script>';
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === 'standards/saas-gui') { return malicious; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq({ query: { path: 'standards/saas-gui' } });
    var res = mockRes();
    await products.handleGetGuardrailsForm(req, res, null, pool);
    var result = res._get();
    assert.ok(result.body.indexOf('<script>alert(1)</script>') === -1, 'expected the script tag to be escaped, not rendered live');
    assert.ok(result.body.indexOf('&lt;script&gt;') !== -1, 'expected the escaped form to be present');
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s5-create-edit-form.js
```

Expected: `FAIL: AC2: ... — products.handleGetGuardrailsForm is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, add these two functions right after `_renderGuardrailsSection` (after its closing `}`):

```javascript
/**
 * wugs-s5 — renders the create/edit form for a guardrail or standard.
 * @param {string} productId
 * @param {string} path        - repo path being edited, or '' for a new entry
 * @param {string} prefillContent - existing content to pre-fill, or '' for blank
 * @param {string} productName
 */
function _renderGuardrailsForm(productId, path, prefillContent, productName) {
  var isEdit = !!path;
  var body = '<div style="max-width:720px">' +
    '<h1 style="margin:0 0 24px;font-size:24px">' + (isEdit ? 'Edit' : 'Add') + ' guardrail or standard</h1>' +
    '<form method="POST" action="/products/' + encodeURIComponent(productId) + '/guardrails/form">' +
      '<input type="hidden" name="path" value="' + _escapeHtml(path) + '">' +
      '<label style="display:block;margin-bottom:8px;font-size:14px;font-weight:500" for="gv-form-content">Content</label>' +
      '<textarea id="gv-form-content" name="content" rows="16" style="width:100%;font-family:inherit;font-size:14px;padding:12px;border-radius:8px;border:1px solid var(--line)">' + _escapeHtml(prefillContent) + '</textarea>' +
      '<button type="submit" style="margin-top:16px;padding:8px 16px;border-radius:6px;border:none;background:var(--accent);color:#fff;font-size:14px;cursor:pointer">Save</button>' +
    '</form>' +
  '</div>';

  return _htmlShell.renderShell({
    title: (isEdit ? 'Edit' : 'Add') + ' guardrail or standard',
    bodyContent: body,
    active: 'dashboard',
    crumbs: [productName, 'Guardrails & Standards', isEdit ? 'Edit' : 'Add']
  });
}

/**
 * wugs-s5 — GET /products/:id/guardrails/form: renders the create/edit
 * form, pre-filled with real current content when editing an existing
 * path (?path=...), or blank when adding a new entry (?section=...).
 */
async function handleGetGuardrailsForm(req, res, _next, pool) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var token = req.session && req.session.accessToken;
  var path = (req.query && req.query.path) || '';

  var prodRow = (await _pool.query(
    'SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }

  var prefillContent = '';
  if (path) {
    var piece = await _fetchGuardrailsSectionPiece(prodRow.repo_owner, prodRow.repo_name, path, token);
    prefillContent = piece.status === 'ok' ? piece.value : '';
  }

  var html = _renderGuardrailsForm(productId, path, prefillContent, prodRow.name);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}
```

Add `handleGetGuardrailsForm` to `module.exports` (near `handleGetProductGuardrailsView`).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s5-create-edit-form.js
```

Expected: `4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected: 33 pre-existing failures, 0 new.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s5-create-edit-form.js
git commit -m "feat(wugs-s5): GET form route with real-content pre-fill (AC2)"
```

---

## Task 3: Server-side empty-content validation (AC3)

**Files:**
- Modify: `src/web-ui/routes/products.js`, `tests/check-wugs-s5-create-edit-form.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC3: empty submission rejected server-side ───────────────────────────
await checkAsync('AC3: submitForm_emptyContent_rejectedServerSide', async () => {
  var pool = makeMockPool([]);
  var writeAdapterCalled = false;
  var writeAdapter = async function () { writeAdapterCalled = true; };
  var req = mockReq({ body: { path: 'standards/saas-gui', content: '   ' } });
  var res = mockRes();
  await products.handlePostGuardrailsForm(req, res, null, pool, writeAdapter);
  var result = res._get();
  assert.strictEqual(result.statusCode, 400, 'expected a 400 validation error for whitespace-only content');
  assert.ok(/content/i.test(result.body), 'expected a clear validation error message mentioning content');
  assert.strictEqual(writeAdapterCalled, false, 'expected the write adapter to never be called for invalid content');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s5-create-edit-form.js
```

Expected: `FAIL: AC3: ... — products.handlePostGuardrailsForm is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, add these two functions right after `handleGetGuardrailsForm`:

```javascript
/**
 * wugs-s5 — validates submitted guardrail/standard content server-side.
 * Never trust client-side-only validation (Architecture Constraints).
 * @returns {{valid: boolean, error: (string|null)}}
 */
function _validateGuardrailContent(content) {
  if (typeof content !== 'string' || content.trim().length === 0) {
    return { valid: false, error: 'Content cannot be empty.' };
  }
  return { valid: true, error: null };
}

/**
 * wugs-s5 — POST /products/:id/guardrails/form: validates submitted
 * content server-side and, if valid, hands it to the write path.
 * `writeAdapter(target, content)` is the write path — not yet wired to a
 * real implementation in server.js (wugs-s6's job, see the plan's Design
 * note); tests inject a mock directly as a function parameter.
 */
async function handlePostGuardrailsForm(req, res, _next, pool, writeAdapter) {
  req.body = await _readBody(req);
  var productId = req.params && req.params.id;
  var path = (req.body && req.body.path) || '';
  var content = (req.body && req.body.content) || '';

  var validation = _validateGuardrailContent(content);
  if (!validation.valid) {
    if (res.status) { res.status(400).json({ error: validation.error }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: validation.error })); }
    return;
  }

  if (res.status) { res.status(200).json({ ok: true }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true })); }
}
```

Add `handlePostGuardrailsForm` to `module.exports`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s5-create-edit-form.js
```

Expected: `5 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected: 33 pre-existing failures, 0 new.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s5-create-edit-form.js
git commit -m "feat(wugs-s5): reject empty/whitespace-only submissions server-side (AC3)"
```

---

## Task 4: Valid submission passed to the write path (AC4)

**Files:**
- Modify: `src/web-ui/routes/products.js`, `tests/check-wugs-s5-create-edit-form.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC4: valid submission passed to write path with correct target ──────
await checkAsync('AC4: submitForm_validContent_passesToWritePathWithCorrectTarget', async () => {
  var pool = makeMockPool([]);
  var capturedTarget = null;
  var capturedContent = null;
  var writeAdapter = async function (target, content) {
    capturedTarget = target;
    capturedContent = content;
    return { ok: true };
  };
  var req = mockReq({ body: { path: 'standards/saas-gui', content: 'Real new content for the standard.' } });
  var res = mockRes();
  await products.handlePostGuardrailsForm(req, res, null, pool, writeAdapter);
  var result = res._get();
  assert.strictEqual(result.statusCode, 200, 'expected a 200 on valid submission');
  assert.ok(capturedContent === 'Real new content for the standard.', 'expected the exact submitted content to reach the write adapter, no silent transformation');
  assert.ok(capturedTarget && capturedTarget.path === 'standards/saas-gui', 'expected the exact target path to reach the write adapter');
  assert.ok(capturedTarget && capturedTarget.productId === 'p1', 'expected the productId to reach the write adapter as part of the target');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s5-create-edit-form.js
```

Expected: `FAIL: AC4: ... — expected the exact submitted content to reach the write adapter, no silent transformation` (handler doesn't call `writeAdapter` yet)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, replace the success branch of `handlePostGuardrailsForm` (the `if (res.status) { res.status(200)...` block at the end) with:

```javascript
  var writeResult = await writeAdapter({ productId: productId, path: path }, content);

  if (res.status) { res.status(200).json({ ok: true, result: writeResult }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, result: writeResult })); }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s5-create-edit-form.js
```

Expected: `6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected: 33 pre-existing failures, 0 new.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s5-create-edit-form.js
git commit -m "feat(wugs-s5): pass valid submissions to the write path with correct target (AC4)"
```

---

## Task 5: Wire the GET form route in server.js

**Files:**
- Modify: `src/web-ui/server.js`

**Reminder:** only the GET route is wired here. The POST route is intentionally left unwired — see the plan's Design note. Do not add a POST route wiring in this task.

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── Wiring: GET /products/:id/guardrails/form is routed in server.js ────
check('wiring: server_js_routes_getGuardrailsForm_to_handler', () => {
  var fs = require('fs');
  var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
  assert.ok(serverSrc.indexOf('/guardrails\\/form$/') !== -1, 'expected server.js to route GET /products/:id/guardrails/form');
  assert.ok(serverSrc.indexOf('handleGetGuardrailsForm') !== -1, 'expected server.js to reference handleGetGuardrailsForm');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s5-create-edit-form.js
```

Expected: `FAIL: wiring: ... — expected server.js to route GET /products/:id/guardrails/form`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, add `handleGetGuardrailsForm` to the destructured import from `./routes/products` (the same long line already carrying `handleGetProductGuardrailsView` from `wugs-s2`):

```javascript
const { handlePostProductNew, handlePostProductConfirm, handleGetDashboard: _handleGetDashboard, handleGetProductNew, handleGetProductView, handleGetProductRoadmap, handleGetProductStandardsTab, handleGetProductGuardrailsView, handleGetGuardrailsForm, handlePostProductSync, handlePostProductFeature, handleGetProductKanban, handleGetOrgKanban, handlePostBoardAdvance, handleDeleteProduct, handlePostProductRepoCreate, handlePutProductEdit, handleGetProductModules, handlePostProductModule, handlePutProductModule, handleDeleteProductModule, handlePutEpicModule, handlePostBulkAssignFeatureModules } = require('./routes/products'); // psh-s3 / psh-s4 / psh-s6 / psh-s7 / prc-s4.2 / prc-s2.1 / prc-s4.1 / pr-s3 / a1 / a2 / a5 / tmc-s1 / s1.1 / smug-s1 / wugs-s2 / wugs-s5
```

(Only `handleGetGuardrailsForm` and the trailing comment tag are new — keep the rest of the line identical.)

Find the `guardrails$` route block added by `wugs-s2` (search for `\/guardrails\$\/`) and add the new route right after its closing line:

```javascript
  } else if (pathname.match(/^\/products\/[^/]+\/guardrails\/form$/) && req.method === 'GET') {
    // wugs-s5 -- Add/Edit form for a guardrail or standard. The POST route
    // for this same path is intentionally NOT wired yet -- there is no real
    // write adapter until wugs-s6 ships (see wugs-s5-plan.md's Design note).
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handleGetGuardrailsForm(req, res, null, _pshPool); });
```

**Important — regex ordering:** this new pattern (`/products/:id/guardrails/form`) is more specific than the existing `/products/:id/guardrails$` pattern (`wugs-s2`) — since both are anchored with `$`, a URL matching `/guardrails/form` will never match the shorter `/guardrails$` pattern (the trailing `/form` prevents it), so either ordering works correctly. Place this new block immediately after `wugs-s2`'s `guardrails$` block for readability, matching the file's existing convention of grouping related routes together.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s5-create-edit-form.js
```

Expected: `7 passed, 0 failed`

- [ ] **Step 5: Regression check**

```bash
for f in $(grep -rl "routes/products" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

Only `done` expected, no `FAIL` lines. Also confirm `node tests/check-wugs-s2-product-level-guardrails-view.js` still shows `11 passed, 0 failed` (Task 1 changed the shared `_renderGuardrailsSection` function's signature).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-wugs-s5-create-edit-form.js
git commit -m "feat(wugs-s5): wire GET /products/:id/guardrails/form to handleGetGuardrailsForm"
```

---

## Final story-level check (before /verify-completion)

After all 5 tasks:

```bash
node tests/check-wugs-s5-create-edit-form.js
```

Expected: `7 passed, 0 failed` (AC1, AC2 x2, NFR-SEC-01, AC3, AC4, wiring)

```bash
node tests/check-wugs-s2-product-level-guardrails-view.js
```

Expected: `11 passed, 0 failed` — confirms `wugs-s2`'s own story is unaffected by the shared-function signature change.

```bash
npm test
```

Expected: same 33 pre-existing baseline failures (see `decisions.md` RISK-ACCEPT for `wugs-s5`), 0 new failures.
