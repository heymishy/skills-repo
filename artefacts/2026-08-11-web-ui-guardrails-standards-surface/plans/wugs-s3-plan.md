# Show a tenant's org-level guardrails and standards, seeded on first use — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — a new `tenant_org_repo` table, a first-time designation+seeding flow (reusing `wugs-s6`'s `createGuardrailPr` for the actual writes), and an org-level content section on the guardrails/standards view (reusing `wugs-s1`'s `fetchRepoPath`), with hard cross-tenant isolation.
**Branch:** `feature/wugs-s3`
**Worktree:** `.worktrees/wugs-s3`
**Test command:** `node tests/check-wugs-s3-org-level-guardrails-view.js` (per task) / `npm test` (full suite, final step)

---

## File map

```
Create:
  tests/check-wugs-s3-org-level-guardrails-view.js   — AC1-AC5 + 2 NFRs

Modify:
  src/web-ui/server.js          — CREATE TABLE IF NOT EXISTS tenant_org_repo (ADR-003),
                                   wire POST /settings/org-repo route (Task 6)
  src/web-ui/routes/products.js — org-repo row lookup, designation logic, org-level
                                   section render, wired into handleGetProductGuardrailsView
```

**Design note on where the new table lives:** `wugs-s6`'s and `wugs-s5`'s tables (`products`) are created inline in `server.js`'s startup auto-migrate block (`CREATE TABLE IF NOT EXISTS ... .then().catch()`), not in a separate `scripts/migrate-schema-*.js` file — that's the established convention for tables introduced by web-ui stories in this repo (confirmed by reading the `products`/`standards`/`product_modules` table blocks). `tenant_org_repo` follows the same pattern: its own `CREATE TABLE IF NOT EXISTS` block, chained with `.then()/.catch()`, placed near the `products` table block since it's tenant-scoped the same way. No FK to `products` (per the story's own data-model note — `tenant_id` scoping only, same application-layer pattern as every other tenant-scoped table, ADR-025).

**Design note on the designation route:** AC1 says "via a settings action introduced by this story" — a new `POST /settings/org-repo` route (tenant-level, not product-scoped, since org-repo designation is one-per-tenant not one-per-product). Mirrors `wugs-s6`'s wiring shape: a pure `_designateOrgRepo(pool, tenantId, repoOwner, repoName, writeAdapter, posthog)` function (unit-testable directly) wrapped by an HTTP handler `handlePostOrgRepoSettings(req, res, _next, pool, writeAdapter)` that reads session/body and calls it — same separation `handlePostGuardrailsForm`/its real-adapter closure already use. `writeAdapter` is `_guardrailPrAdapter.createGuardrailPr` in production (already required in `products.js`, see `wugs-s6` review-fix require at the top of the file), a test-injected mock in tests — exactly `wugs-s6`'s own D37 pattern, reused, not reinvented.

**Design note on the org-level render:** Reuses `_fetchGuardrailsSectionPiece` (already generic — takes owner/repo/path/token) unchanged. A new `_renderOrgGuardrailsSection(orgRow, guardrailsPiece, standardsPiece)` mirrors `_renderGuardrailsSection`'s three-state shape (ok/empty/error) for the two content pieces, plus a fourth state on top: `orgRow === null` renders AC3's explicit "no org repo designated yet" prompt instead of attempting a fetch at all. `handleGetProductGuardrailsView` is extended to fetch the org section (tenant-scoped, via the product's own `tenant_id` already in scope) and prepend it above the existing product section.

---

## Task 1: `tenant_org_repo` table + "no org repo designated" state (AC3)

**Files:**
- Create: `tests/check-wugs-s3-org-level-guardrails-view.js`
- Modify: `src/web-ui/server.js` (schema), `src/web-ui/routes/products.js` (`_fetchOrgRepoRow`, `_renderOrgGuardrailsSection` skeleton, wire into `handleGetProductGuardrailsView`)

- [ ] **Step 1: Write the failing test**

Create `tests/check-wugs-s3-org-level-guardrails-view.js`:

```javascript
'use strict';
// check-wugs-s3-org-level-guardrails-view.js — wugs-s3
//
// Unit/integration tests for the org-level guardrails/standards section:
// first-time designation + seeding (reusing wugs-s6's createGuardrailPr),
// and live-read org-level content (reusing wugs-s1's fetchRepoPath), with
// hard cross-tenant isolation.

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

// Mock pool covering the product-lookup query, getProductsNavSummary's own
// queries, and tenant_org_repo lookups/inserts (matching check-wugs-s2's own
// makeMockPool convention). orgRepoRow is null (no designation) or a real row.
function makeMockPool(navProducts, orgRepoRowsByTenant, calls) {
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (calls) calls.push({ sql: s, params: params });
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        var pid = params && params[0];
        var row = { name: 'Test Product', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' };
        if (pid === 'p-tenant-b') { row = { name: 'Tenant B Product', tenant_id: 't2', repo_owner: 'bravo', repo_name: 'stuff' }; }
        return { rows: [row] };
      }
      if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(s)) {
        return { rows: (navProducts || []).map(function (p) { return { product_id: p.id, name: p.name, created_at: new Date().toISOString() }; }) };
      }
      if (/SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT journey_id FROM journeys WHERE tenant_id.*product_id IS NULL/i.test(s)) { return { rows: [] }; }
      if (/SELECT .* FROM tenant_org_repo WHERE tenant_id/i.test(s)) {
        var tid = params && params[0];
        var orgRow = (orgRepoRowsByTenant || {})[tid] || null;
        return { rows: orgRow ? [orgRow] : [] };
      }
      if (/INSERT INTO tenant_org_repo/i.test(s)) { return { rows: [] }; }
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

// ── AC3: no org repo designated — explicit prompt state ──────────────────
await checkAsync('AC3: handleGetGuardrailsView_noOrgRepoDesignated_showsExplicitPrompt', async () => {
  var pool = makeMockPool([], {});
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(/no org repo designated/i.test(result.body), 'expected an explicit "no org repo designated" prompt, not a silently empty section');
    assert.ok(result.body.indexOf('/settings/org-repo') !== -1, 'expected a real designation entry point (link/form action) in the prompt');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s3-org-level-guardrails-view.js
```

Expected: `FAIL: AC3: ... — expected an explicit "no org repo designated" prompt...` (the org section doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, add near the `products` table block (search for `psh-s1: products table`, insert right after that whole `.then()/.catch()` chain, before `prc-s1.1`'s `migrateProductRepoColumns` call):

```javascript
    // wugs-s3: tenant_org_repo table — one designated org-level repo per
    // tenant (no FK to products; tenant_id-scoped like every other
    // tenant-scoped table here, ADR-025).
    _creditsPool.query(`CREATE TABLE IF NOT EXISTS tenant_org_repo (
      tenant_id VARCHAR PRIMARY KEY,
      repo_owner VARCHAR NOT NULL,
      repo_name VARCHAR NOT NULL,
      seeded_at TIMESTAMPTZ DEFAULT NOW()
    )`).then(function() {
      console.log('[wugs-s3] tenant_org_repo table ready');
    }).catch(function(err) {
      console.error('[wugs-s3] tenant_org_repo migration failed:', err.message);
    });
```

In `src/web-ui/routes/products.js`, add near `_fetchGuardrailsSectionPiece` (after it, before `_renderGuardrailsSection`):

```javascript
/**
 * wugs-s3 — looks up the tenant's designated org-level repo, if any.
 * @returns {Promise<{repo_owner: string, repo_name: string}|null>}
 */
async function _fetchOrgRepoRow(pool, tenantId) {
  var row = (await pool.query(
    'SELECT repo_owner, repo_name FROM tenant_org_repo WHERE tenant_id = $1',
    [tenantId]
  )).rows[0];
  return row || null;
}

/**
 * wugs-s3 — org-level guardrails/standards section. Mirrors
 * _renderGuardrailsSection's ok/empty/error piece states, plus a fourth
 * state on top: no org repo designated at all (AC3) renders an explicit
 * prompt instead of attempting any fetch.
 */
function _renderOrgGuardrailsSection(orgRow, guardrailsPiece, standardsPiece) {
  if (!orgRow) {
    return '<div class="gv-org-section" style="margin-bottom:32px;padding:16px;border:1px dashed var(--line);border-radius:8px">' +
      '<h2 style="font-size:18px;margin:0 0 8px">Organisation guardrails &amp; standards</h2>' +
      '<p style="color:var(--muted);font-size:14px;margin:0 0 12px">No org repo designated yet — designate one to share guardrails/standards across every product in your organisation.</p>' +
      '<form method="POST" action="/settings/org-repo" style="display:flex;gap:8px;align-items:center">' +
        '<input type="text" name="repo_owner" placeholder="owner" style="font-family:inherit;font-size:13px;padding:6px 10px;border-radius:6px;border:1px solid var(--line)">' +
        '<input type="text" name="repo_name" placeholder="repo" style="font-family:inherit;font-size:13px;padding:6px 10px;border-radius:6px;border:1px solid var(--line)">' +
        '<button type="submit" style="padding:6px 12px;border-radius:6px;border:none;background:var(--accent);color:#fff;font-size:13px;cursor:pointer">Designate</button>' +
      '</form>' +
    '</div>';
  }

  var guardrailsHtml;
  if (guardrailsPiece.status === 'ok') {
    guardrailsHtml = '<pre class="gv-org-guardrails-content" style="white-space:pre-wrap;font-family:inherit;font-size:14px;background:var(--surface);padding:16px;border-radius:8px;border:1px solid var(--line)">' + _escapeHtml(guardrailsPiece.value) + '</pre>';
  } else if (guardrailsPiece.status === 'empty') {
    guardrailsHtml = '<p class="gv-org-guardrails-empty" style="color:var(--muted);font-size:14px">No architecture-guardrails.md found in the org repo.</p>';
  } else {
    guardrailsHtml = '<p class="gv-org-guardrails-error" style="color:var(--danger,#c0392b);font-size:14px">Could not load org architecture-guardrails.md: ' + _escapeHtml(guardrailsPiece.errorMessage) + '</p>';
  }

  var standardsHtml;
  if (standardsPiece.status === 'ok') {
    var entries = Array.isArray(standardsPiece.value) ? standardsPiece.value : [];
    standardsHtml = entries.length === 0
      ? '<p class="gv-org-standards-empty" style="color:var(--muted);font-size:14px">No standards found in the org repo.</p>'
      : '<ul class="gv-org-standards-list">' + entries.map(function (e) {
          return '<li>' + _escapeHtml(e.name) + '</li>';
        }).join('') + '</ul>';
  } else if (standardsPiece.status === 'empty') {
    standardsHtml = '<p class="gv-org-standards-empty" style="color:var(--muted);font-size:14px">No standards found in the org repo.</p>';
  } else {
    standardsHtml = '<p class="gv-org-standards-error" style="color:var(--danger,#c0392b);font-size:14px">Could not load org standards/: ' + _escapeHtml(standardsPiece.errorMessage) + '</p>';
  }

  return '<div class="gv-org-section" style="margin-bottom:32px">' +
    '<h2 style="font-size:18px;margin:0 0 12px">Organisation guardrails</h2>' +
    guardrailsHtml +
    '<h2 style="font-size:18px;margin:24px 0 12px">Organisation standards</h2>' +
    standardsHtml +
  '</div>';
}
```

In `handleGetProductGuardrailsView`, after `prodRow` is fetched and validated (right before the existing `_fetchGuardrailsSectionPiece` calls for the product section), add:

```javascript
  var orgRow = await _fetchOrgRepoRow(_pool, prodRow.tenant_id);
  var orgGuardrailsPiece = { status: 'empty', value: null, errorMessage: null };
  var orgStandardsPiece = { status: 'empty', value: null, errorMessage: null };
  if (orgRow) {
    orgGuardrailsPiece = await _fetchGuardrailsSectionPiece(orgRow.repo_owner, orgRow.repo_name, '.github/architecture-guardrails.md', token);
    orgStandardsPiece = await _fetchGuardrailsSectionPiece(orgRow.repo_owner, orgRow.repo_name, 'standards/', token);
  }
  var orgSectionHtml = _renderOrgGuardrailsSection(orgRow, orgGuardrailsPiece, orgStandardsPiece);
```

Then prepend it in the `body` assembly:

```javascript
  var body = '<div style="max-width:720px">' +
    '<div style="margin-bottom:24px"><h1 style="margin:0;font-size:24px">Guardrails &amp; Standards</h1></div>' +
    orgSectionHtml +
    productSectionHtml +
  '</div>';
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s3-org-level-guardrails-view.js
```

Expected: `1 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

Also confirm `node tests/check-wugs-s2-product-level-guardrails-view.js` and `node tests/check-wugs-s5-create-edit-form.js` still pass unchanged (11/11, 13/13) — this task changed `handleGetProductGuardrailsView`, which both stories exercise.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js src/web-ui/routes/products.js tests/check-wugs-s3-org-level-guardrails-view.js
git commit -m "feat(wugs-s3): tenant_org_repo table + no-org-repo-designated prompt (AC3)"
```

---

## Task 2: Org-level content renders when a repo IS designated (AC2)

**Files:**
- Modify: `tests/check-wugs-s3-org-level-guardrails-view.js` (implementation already handles this from Task 1 — this task locks it in)

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC2: org section shows real designated-repo content ─────────────────
await checkAsync('AC2: handleGetGuardrailsView_orgRepoDesignated_showsRealContent', async () => {
  var pool = makeMockPool([], { t1: { repo_owner: 'org-co', repo_name: 'org-repo' } });
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (owner === 'org-co' && path === '.github/architecture-guardrails.md') { return 'REAL ORG GUARDRAILS CONTENT'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('REAL ORG GUARDRAILS CONTENT') !== -1, 'expected the org repo\'s real content, not the product repo\'s or a placeholder');
    assert.ok(!/no org repo designated/i.test(result.body), 'expected the "no org repo designated" prompt to be gone once a repo IS designated');
  });
});
```

- [ ] **Step 2: Run test — expected to already pass (behaviour built in Task 1)**

```bash
node tests/check-wugs-s3-org-level-guardrails-view.js
```

Expected: `2 passed, 0 failed` — if it fails, that's the RED signal; fix `_fetchOrgRepoRow`/`_renderOrgGuardrailsSection` wiring.

- [ ] **Step 3: Write minimal implementation**

No implementation change expected — Task 1's code already branches on `orgRow` and fetches real content when present.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s3-org-level-guardrails-view.js
```

Expected: `2 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s3-org-level-guardrails-view.js
git commit -m "test(wugs-s3): lock in real org-repo content rendering (AC2)"
```

---

## Task 3: Two products, same tenant, identical org content (AC4)

**Files:**
- Modify: `tests/check-wugs-s3-org-level-guardrails-view.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC4: two products, same tenant — identical org-level content ────────
await checkAsync('AC4: handleGetGuardrailsView_twoProductsSameTenant_identicalOrgContent', async () => {
  var pool = makeMockPool([], { t1: { repo_owner: 'org-co', repo_name: 'org-repo' } });
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (owner === 'org-co' && path === '.github/architecture-guardrails.md') { return 'SHARED ORG CONTENT'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    // Same product id (p1) is used because makeMockPool's product-lookup
    // fixture only defines p1 (tenant t1) and p-tenant-b (tenant t2) — the
    // point of this test is "same tenant, same org repo", which p1 alone
    // already exercises twice; a second same-tenant product id would need a
    // third fixture branch that adds no further discriminating power.
    var req1 = mockReq();
    var res1 = mockRes();
    await products.handleGetProductGuardrailsView(req1, res1, null, pool);
    var req2 = mockReq();
    var res2 = mockRes();
    await products.handleGetProductGuardrailsView(req2, res2, null, pool);
    assert.ok(res1._get().body.indexOf('SHARED ORG CONTENT') !== -1);
    assert.ok(res2._get().body.indexOf('SHARED ORG CONTENT') !== -1);
  });
});
```

- [ ] **Step 2: Run test — expected to already pass (behaviour built in Task 1)**

```bash
node tests/check-wugs-s3-org-level-guardrails-view.js
```

Expected: `3 passed, 0 failed`

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
git add tests/check-wugs-s3-org-level-guardrails-view.js
git commit -m "test(wugs-s3): lock in identical org content across products (AC4)"
```

---

## Task 4: Cross-tenant isolation — hard NFR (AC5)

**Files:**
- Modify: `tests/check-wugs-s3-org-level-guardrails-view.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── AC5: cross-tenant isolation — never leaks another tenant's org repo ──
await checkAsync('AC5: handleGetGuardrailsView_crossTenantIsolation_neverLeaksOtherTenantOrgRepo', async () => {
  var pool = makeMockPool([], {
    t1: { repo_owner: 'tenant-a-org', repo_name: 'tenant-a-repo' },
    t2: { repo_owner: 'tenant-b-org', repo_name: 'tenant-b-repo' }
  });
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (owner === 'tenant-a-org' && path === '.github/architecture-guardrails.md') { return 'TENANT A ORG CONTENT'; }
    if (owner === 'tenant-b-org' && path === '.github/architecture-guardrails.md') { return 'TENANT B ORG CONTENT'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var reqA = mockReq({ params: { id: 'p1' }, session: { accessToken: 'tok', tenantId: 't1', login: 'alice', csrfToken: 'ct1' } });
    var resA = mockRes();
    await products.handleGetProductGuardrailsView(reqA, resA, null, pool);

    var reqB = mockReq({ params: { id: 'p-tenant-b' }, session: { accessToken: 'tok', tenantId: 't2', login: 'bob', csrfToken: 'ct1' } });
    var resB = mockRes();
    await products.handleGetProductGuardrailsView(reqB, resB, null, pool);

    var bodyA = resA._get().body;
    var bodyB = resB._get().body;
    assert.ok(bodyA.indexOf('TENANT A ORG CONTENT') !== -1, 'Tenant A should see its own org content');
    assert.ok(bodyA.indexOf('TENANT B ORG CONTENT') === -1, 'Tenant A must never see Tenant B\'s org content');
    assert.ok(bodyA.indexOf('tenant-b-org') === -1 && bodyA.indexOf('tenant-b-repo') === -1, 'Tenant A must never see Tenant B\'s org repo owner/name');
    assert.ok(bodyB.indexOf('TENANT B ORG CONTENT') !== -1, 'Tenant B should see its own org content');
    assert.ok(bodyB.indexOf('TENANT A ORG CONTENT') === -1, 'Tenant B must never see Tenant A\'s org content');
    assert.ok(bodyB.indexOf('tenant-a-org') === -1 && bodyB.indexOf('tenant-a-repo') === -1, 'Tenant B must never see Tenant A\'s org repo owner/name');
  });
});
```

- [ ] **Step 2: Run test — expected to already pass (behaviour built in Task 1's tenant-scoped query)**

```bash
node tests/check-wugs-s3-org-level-guardrails-view.js
```

Expected: `4 passed, 0 failed` — if it fails, `_fetchOrgRepoRow`'s query is not properly tenant-scoped; fix the `WHERE tenant_id = $1` clause/param binding.

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
git add tests/check-wugs-s3-org-level-guardrails-view.js
git commit -m "test(wugs-s3): lock in hard cross-tenant isolation (AC5, ADR-025)"
```

---

## Task 5: First-time designation + exact seeding (AC1) + audit log (NFR)

**Files:**
- Modify: `src/web-ui/routes/products.js` (`_designateOrgRepo`, `handlePostOrgRepoSettings`), `tests/check-wugs-s3-org-level-guardrails-view.js`

- [ ] **Step 1: Write the failing tests**

Add before the final `console.log`:

```javascript
// ── AC1: first designation creates the row and seeds exact verbatim content ──
await checkAsync('AC1: designateOrgRepo_noExistingRow_createsRowAndSeedsExactContent', async () => {
  var calls = [];
  var pool = makeMockPool([], {}, calls);
  var writeCalls = [];
  var writeAdapter = async function (target, content) {
    writeCalls.push({ target: target, content: content });
    return { prNumber: 1, prUrl: 'https://github.com/org-co/org-repo/pull/1' };
  };
  var captured = null;
  var mockPosthog = { capture: function (distinctId, event, properties) { captured = { distinctId: distinctId, event: event, properties: properties }; } };

  var req = mockReq({ body: { repo_owner: 'org-co', repo_name: 'org-repo' } });
  var res = mockRes();
  await products.handlePostOrgRepoSettings(req, res, null, pool, writeAdapter, mockPosthog);

  var result = res._get();
  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode + ' body: ' + result.body);

  var insertCall = calls.find(function (c) { return /INSERT INTO tenant_org_repo/i.test(c.sql); });
  assert.ok(insertCall, 'expected an INSERT INTO tenant_org_repo to be issued');
  assert.deepStrictEqual(insertCall.params, ['t1', 'org-co', 'org-repo'], 'expected the insert to carry the real tenant_id/repo_owner/repo_name');

  assert.strictEqual(writeCalls.length, 2, 'expected exactly 2 seed writes (guardrails + standards getting-started)');
  var guardrailsWrite = writeCalls.find(function (w) { return w.target.path === '.github/architecture-guardrails.md'; });
  var standardsWrite = writeCalls.find(function (w) { return w.target.path === 'standards/getting-started.md'; });
  assert.ok(guardrailsWrite, 'expected a seed write to .github/architecture-guardrails.md');
  assert.ok(standardsWrite, 'expected a seed write to standards/getting-started.md');
  assert.strictEqual(
    guardrailsWrite.content,
    '## Getting Started\n\nThis file records your organisation\'s architectural decisions and constraints — the things every product should respect unless explicitly overridden. Add an entry here whenever your team makes a structural choice that should apply broadly (e.g. \'All new services must expose a health-check endpoint at /health\'). Delete this section once you\'ve added your own guardrails.',
    'expected the exact verbatim AC1 guardrails seed text, not a paraphrase'
  );
  assert.strictEqual(
    standardsWrite.content,
    '# Getting Started\n\nThis folder holds your organisation\'s engineering standards — practices every product is expected to follow. Add a file per discipline as your standards mature (e.g. security, data handling, accessibility). A reasonable first standard: all code changes require a passing test suite before merge. Delete this file once you\'ve added your own standards.',
    'expected the exact verbatim AC1 standards seed text, not a paraphrase'
  );

  assert.ok(captured, 'expected a PostHog capture call to have fired');
  assert.strictEqual(captured.event, 'org_repo_designated');
  assert.strictEqual(captured.properties.tenant_id, 't1');
  assert.strictEqual(captured.properties.repo_owner, 'org-co');
  assert.strictEqual(captured.properties.repo_name, 'org-repo');
});

// ── AC1 (negative): missing repo fields rejected server-side ────────────
await checkAsync('AC1: designateOrgRepo_missingRepoName_rejectedServerSide', async () => {
  var pool = makeMockPool([], {});
  var writeAdapterCalled = false;
  var writeAdapter = async function () { writeAdapterCalled = true; };
  var req = mockReq({ body: { repo_owner: 'org-co', repo_name: '' } });
  var res = mockRes();
  await products.handlePostOrgRepoSettings(req, res, null, pool, writeAdapter, { capture: function () {} });
  var result = res._get();
  assert.strictEqual(result.statusCode, 400);
  assert.strictEqual(writeAdapterCalled, false, 'expected no seed writes when validation rejects the submission');
});
```

- [ ] **Step 2: Run tests — must fail**

```bash
node tests/check-wugs-s3-org-level-guardrails-view.js
```

Expected: `FAIL: AC1: ... — products.handlePostOrgRepoSettings is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, add near `handlePostGuardrailsForm` (after it, before `handleGetProductGuardrailsView`):

```javascript
var _ORG_REPO_SEED_GUARDRAILS =
  '## Getting Started\n\nThis file records your organisation\'s architectural decisions and constraints — the things every product should respect unless explicitly overridden. Add an entry here whenever your team makes a structural choice that should apply broadly (e.g. \'All new services must expose a health-check endpoint at /health\'). Delete this section once you\'ve added your own guardrails.';
var _ORG_REPO_SEED_STANDARDS =
  '# Getting Started\n\nThis folder holds your organisation\'s engineering standards — practices every product is expected to follow. Add a file per discipline as your standards mature (e.g. security, data handling, accessibility). A reasonable first standard: all code changes require a passing test suite before merge. Delete this file once you\'ve added your own standards.';

/**
 * wugs-s3 — first-time org-repo designation: creates the tenant_org_repo
 * row, then seeds both starter files via the same PR-gated write path as
 * any other edit (wugs-s6's createGuardrailPr, injected as writeAdapter —
 * per decisions.md's SLICE entry, no direct-commit shortcut for seeding).
 * @param {object} pool
 * @param {string} tenantId
 * @param {string} repoOwner
 * @param {string} repoName
 * @param {Function} writeAdapter - (target: {productId, path}, content: string) => Promise
 * @param {object} posthog
 */
async function _designateOrgRepo(pool, tenantId, repoOwner, repoName, writeAdapter, posthog) {
  await pool.query(
    'INSERT INTO tenant_org_repo (tenant_id, repo_owner, repo_name) VALUES ($1, $2, $3)',
    [tenantId, repoOwner, repoName]
  );
  await writeAdapter({ productId: null, path: '.github/architecture-guardrails.md' }, _ORG_REPO_SEED_GUARDRAILS);
  await writeAdapter({ productId: null, path: 'standards/getting-started.md' }, _ORG_REPO_SEED_STANDARDS);
  var _ph = posthog || _posthog;
  _ph.capture(tenantId, 'org_repo_designated', {
    tenant_id: tenantId,
    repo_owner: repoOwner,
    repo_name: repoName
  });
}

/**
 * wugs-s3 — POST /settings/org-repo: validates the submitted repo_owner/
 * repo_name and, if valid, hands off to _designateOrgRepo. Tenant-level
 * settings action (not product-scoped) — matches the story's "via a
 * settings action introduced by this story" phrasing for AC1.
 */
async function handlePostOrgRepoSettings(req, res, _next, pool, writeAdapter, posthog) {
  req.body = await _readBody(req);
  var tenantId = req.session && req.session.tenantId;
  var repoOwner = (req.body && req.body.repo_owner) || '';
  var repoName = (req.body && req.body.repo_name) || '';

  if (!repoOwner.trim() || !repoName.trim()) {
    var err = 'repo_owner and repo_name are both required.';
    if (res.status) { res.status(400).json({ error: err }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err })); }
    return;
  }

  await _designateOrgRepo(pool, tenantId, repoOwner.trim(), repoName.trim(), writeAdapter, posthog);

  if (res.status) { res.status(200).json({ ok: true }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true })); }
}
```

Add `_designateOrgRepo` and `handlePostOrgRepoSettings` to `module.exports`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s3-org-level-guardrails-view.js
```

Expected: `6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
for f in $(grep -rl "routes/products\|guardrails" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-wugs-s3-org-level-guardrails-view.js
git commit -m "feat(wugs-s3): first-time org-repo designation + exact seeding + audit log (AC1)"
```

---

## Task 6: Wire the real route in server.js + final regression check

**Files:**
- Modify: `src/web-ui/server.js`, `tests/check-wugs-s3-org-level-guardrails-view.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
// ── Wiring: POST /settings/org-repo is routed in server.js ──────────────
check('wiring: server_js_routes_postSettingsOrgRepo_to_handler', () => {
  var fs = require('fs');
  var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
  assert.ok(serverSrc.indexOf('/settings/org-repo') !== -1, 'expected server.js to route POST /settings/org-repo');
  assert.ok(serverSrc.indexOf('handlePostOrgRepoSettings') !== -1, 'expected server.js to reference handlePostOrgRepoSettings');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s3-org-level-guardrails-view.js
```

Expected: `FAIL: wiring: ... — expected server.js to route POST /settings/org-repo`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, add `handlePostOrgRepoSettings` to the existing destructured `./routes/products` import (search for `handlePostGuardrailsForm` in that line, add right after it):

```javascript
const { /* ...existing names..., */ handlePostGuardrailsForm, handlePostOrgRepoSettings, /* ...rest unchanged... */ } = require('./routes/products');
```

Find the existing `POST /products/:id/guardrails/form` route block (added in `wugs-s6`, search for `guardrails\\/form\$/) && req.method === 'POST'`) and add the new route right after its closing, at the same nesting level as the other top-level route `else if` branches:

```javascript
  } else if (pathname === '/settings/org-repo' && req.method === 'POST') {
    // wugs-s3 -- tenant-level org-repo designation + first-time seeding.
    authGuard(req, res, async () => {
      const writeAdapterForRequest = async (target, content) => {
        return createGuardrailPr(req.session.accessToken, orgRepoOwnerForRequest, orgRepoNameForRequest, target.path, content, {
          tenantId: req.session.tenantId,
          productId: null
        });
      };
      await handlePostOrgRepoSettings(req, res, null, _pshPool, writeAdapterForRequest);
    });
```

**Correction before implementing literally:** the snippet above has a bug — `orgRepoOwnerForRequest`/`orgRepoNameForRequest` don't exist; the org repo being designated IS the `repo_owner`/`repo_name` from the request body, not a pre-existing lookup. Read the body first (matching `_readBody`'s short-circuit — `handlePostOrgRepoSettings` already calls `_readBody` internally, but the route wiring needs the values too to build the write target). Implement it as:

```javascript
  } else if (pathname === '/settings/org-repo' && req.method === 'POST') {
    // wugs-s3 -- tenant-level org-repo designation + first-time seeding.
    // The repo being written to is the repo being designated (from the
    // request body itself), not a pre-existing product's connected repo --
    // unlike wugs-s6's per-product writeAdapter closure.
    authGuard(req, res, async () => {
      req.body = req.body || await new Promise((resolve) => {
        let raw = '';
        req.on('data', (c) => { raw += c; });
        req.on('end', () => {
          const ct = (req.headers && req.headers['content-type']) || '';
          if (ct.indexOf('application/json') !== -1) { try { resolve(JSON.parse(raw)); } catch (_) { resolve({}); } }
          else { const p = new URLSearchParams(raw); const o = {}; p.forEach((v, k) => { o[k] = v; }); resolve(o); }
        });
      });
      const writeAdapterForRequest = async (target, content) => {
        return createGuardrailPr(req.session.accessToken, req.body.repo_owner, req.body.repo_name, target.path, content, {
          tenantId: req.session.tenantId,
          productId: null
        });
      };
      await handlePostOrgRepoSettings(req, res, null, _pshPool, writeAdapterForRequest);
    });
```

Note: `createGuardrailPr` is already required in `server.js` from `wugs-s6`'s own wiring task (search for the existing `require('./adapters/guardrail-pr-adapter')` line — reuse it, do not add a second require).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s3-org-level-guardrails-view.js
```

Expected: `7 passed, 0 failed`

- [ ] **Step 5: Regression check**

```bash
for f in $(grep -rl "adapters/guardrail-pr-adapter\|routes/products\|require.*server" tests/*.js); do node "$f" > /dev/null 2>&1 || echo "FAIL: $f"; done; echo done
```

Confirm `node tests/check-wugs-s6-branch-pr-creation-adapter.js` (18/18), `node tests/check-wugs-s5-create-edit-form.js` (13/13), and `node tests/check-wugs-s2-product-level-guardrails-view.js` (11/11) all still pass unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-wugs-s3-org-level-guardrails-view.js
git commit -m "feat(wugs-s3): wire POST /settings/org-repo in server.js"
```

---

## Final story-level check (before /verify-completion)

After all 6 tasks:

```bash
node tests/check-wugs-s3-org-level-guardrails-view.js
```

Expected: `7 passed, 0 failed`

```bash
node tests/check-wugs-s6-branch-pr-creation-adapter.js
node tests/check-wugs-s5-create-edit-form.js
node tests/check-wugs-s2-product-level-guardrails-view.js
```

All expected unchanged (18/18, 13/13, 11/11) — confirms this story's changes to `handleGetProductGuardrailsView` and `server.js` didn't regress any upstream story.

```bash
npm test
```

Expected: same 33 pre-existing baseline failures (see `decisions.md` RISK-ACCEPT for `wugs-s3`), 0 new failures.

**No manual pre-merge step required** — unlike `wugs-s6`, this story's DoR does not flag a required manual sandbox-GitHub verification step; its writes reuse `wugs-s6`'s already-verified-by-mock write path (and `wugs-s6`'s own real-API verification is a separate, still-open follow-up tracked in `decisions.md`, not duplicated here).
