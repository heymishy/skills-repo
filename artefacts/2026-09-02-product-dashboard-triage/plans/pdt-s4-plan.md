# Fix the Story-Detail Dead End With a Breadcrumb and Back Link — Implementation Plan

> **For agent execution:** Executing task-by-task via /tdd in this session (no subagent dispatch — solo session, investigation already complete).

**Goal:** Add a breadcrumb to `/features/:id` showing Product (and Phase/Epic when resolvable) above the story's artefact content, so a story detail page never dead-ends with no way back — including the confirmed live case of an epic-nested story ID (e.g. `dic.5`) that isn't itself a `journeyStore` feature.
**Branch:** `feature/pdt-s4`
**Worktree:** `.worktrees/pdt-s4`
**Test command:** `node tests/check-pdt-s4-story-breadcrumb.js` (per-task), `npm test` (full suite, final task)

---

## Investigation note (code-confirmed — resolves the DoR/test-plan's "no new query" NFR wording, and designs the genuinely-new AC1a reverse lookup)

**Product segment (AC1) — the NFR wording needs a small, honest correction.** `journeyForPage.productId` (already resolved via the existing `_journeyStore.getJourneyByFeatureSlug(featureSlug)` call) is an ID, not a display name — `journey-store.js`'s `getJourneyByFeatureSlug` returns the raw in-memory journey object, which never carries a `productName` field (confirmed via grep: no `productName` anywhere in that module). Showing "Product Name › Story ID" therefore needs one minimal `SELECT name FROM products WHERE product_id = $1 AND tenant_id = $2` — the DoR's "no new query" NFR target is read here as "no *new lookup mechanism*" (the ID itself is already free), not literally zero queries, matching how `handleGetProductView` already resolves a product's own name the same way. This is the same class of DoR/test-plan NFR-wording imprecision found in `pdt-s1`/`pdt-s2`, corrected the same way: implement the honest minimal requirement, document why.

**Phase/Epic segment (AC1a) — genuinely new, designed from the confirmed-available data.** Confirmed via `product-rollup.js`'s `computeTaxonomyRollup` (already used by `pdt-s1`/`pdt-s3`): every epic-nested story item in a product's cached `product_rollups.taxonomy` carries `{slug: story.slug, featureSlug: feature.slug}` inside `groups[].items[]`, and each group carries `{epicSlug, epicName}`. This is exactly the data needed to answer "which product and which epic does story slug X belong to" — and it's already-synced, cached Postgres data (no GitHub API call, honoring the NFR's real constraint: "not a new **per-request network call**"). Design: when `journeyForPage` does **not** resolve a `productId` directly (the epic-nested case — a story slug is never itself a `journeyStore` feature slug, confirmed via the DoR's own CONFIRMED FACTS), scan every product's cached taxonomy for this tenant (`SELECT p.product_id, p.name, pr.taxonomy FROM product_rollups pr JOIN products p ON p.product_id = pr.product_id WHERE p.tenant_id = $1`) for a `groups[].items[]` entry whose `.slug === featureSlug`; a match yields the Phase/Epic name (`group.epicName`) **and** the Product (that row's own `name`/`product_id`) together, in one query. No match → graceful degradation (AC1a's own specified worst case: a bare "Back to product list" link, reusing the existing `/dashboard` href already used by `_renderProductView`'s own breadcrumb — `src/web-ui/routes/products.js`).

**A genuine security correction to the story's own NFR-Security field.** The story states "Security: None — no new data is exposed beyond what's already shown on the product page this story was reached from." That's true for the direct (AC1) path, but the new AC1a reverse-lookup query scans **other products'** cached taxonomy to find a match — if not scoped by `tenant_id`, this would leak cross-tenant story-slug/product-name matches to an operator who never had that context (the confirmed live `bri-s3.4` incident in `handleGetProductView` — `src/web-ui/routes/products.js` line ~2307 — is the exact precedent this avoids: a prior real security bug from a missing tenant filter). The reverse-lookup query above is written with an explicit `WHERE p.tenant_id = $1` for this reason; this is a correction, not scope creep — the ACs never authorized a cross-tenant leak, and this filter is required to deliver AC1a safely.

---

## File map

```
Modify:
  src/web-ui/routes/features.js — add a breadcrumb block to
    handleGetFeatureArtefacts, rendered above the existing <h1> (AC1, AC1a,
    AC2, AC3); a new small helper resolving Product/Phase-Epic context

Create:
  tests/check-pdt-s4-story-breadcrumb.js — 3 unit + 2 integration + 2 NFR tests
```

---

## Task 1: Product breadcrumb segment for the common (direct-resolve) case (AC1)

**Files:**
- Modify: `src/web-ui/routes/features.js`
- Test: `tests/check-pdt-s4-story-breadcrumb.js`

- [ ] **Step 1: Write the failing test**

```javascript
await test('AC1: Product breadcrumb segment renders using journeyForPage.productId when resolvable', async function() {
  var routes = freshRequire(FEATURES_PATH);
  routes.setListArtefacts(async function() { return { artefacts: [{ path: 'artefacts/x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false }; });
  routes.setJourneyStoreModule({
    getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'x', displayName: 'Feature X', completedStages: [], productId: 'product-abc' }; },
    getArtefactsForJourney: async function() { return []; }
  });
  var pool = { query: async function(sql, params) {
    if (/SELECT name FROM products WHERE product_id/i.test(sql)) {
      return { rows: params[0] === 'product-abc' ? [{ name: 'Acme Product' }] : [] };
    }
    return { rows: [] };
  } };
  var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
  var res = makeRes();
  await routes.handleGetFeatureArtefacts(req, res, 'x', pool);
  var body = res._get().body;
  assert.ok(/Acme Product/.test(body), 'expected the breadcrumb to show the resolved product name, got: ' + body.slice(0, 400));
  assert.ok(/href="\/products\/product-abc"/.test(body), 'expected the product segment to link to /products/product-abc');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pdt-s4-story-breadcrumb.js
```

Expected output: `[FAIL] AC1: ... -- expected the breadcrumb to show the resolved product name`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/features.js`, add a new helper function (near `_resolveResumeLinksForFeature`):

```javascript
// pdt-s4 (AC1, AC1a): resolves the breadcrumb context for a story detail
// page. Two paths:
//  - Direct: journeyForPage.productId already resolved (the common case,
//    AC1) -- one minimal query to turn the ID into a display name.
//  - Reverse lookup: journeyForPage has no productId (an epic-nested story
//    slug, e.g. dic.5, is never itself a journeyStore feature slug -- AC1a)
//    -- scan this tenant's already-synced taxonomy for a matching nested
//    story item, giving Product + Phase/Epic together in one query.
//    Explicitly tenant-scoped (bri-s3.4's own precedent in products.js) --
//    never leak a match from another tenant's product.
async function _resolveBreadcrumbContext(featureSlug, journeyForPage, pool, tenantId) {
  if (journeyForPage && journeyForPage.productId) {
    var direct = (await pool.query(
      'SELECT name FROM products WHERE product_id = $1 AND tenant_id = $2',
      [journeyForPage.productId, tenantId]
    )).rows[0];
    return direct ? { productId: journeyForPage.productId, productName: direct.name, epicName: null } : null;
  }

  var rows = (await pool.query(
    'SELECT p.product_id, p.name, pr.taxonomy FROM product_rollups pr JOIN products p ON p.product_id = pr.product_id WHERE p.tenant_id = $1',
    [tenantId]
  )).rows;
  for (var i = 0; i < rows.length; i++) {
    var taxonomy = (typeof rows[i].taxonomy === 'string') ? JSON.parse(rows[i].taxonomy) : rows[i].taxonomy;
    var groups = (taxonomy && taxonomy.groups) || [];
    for (var g = 0; g < groups.length; g++) {
      var items = groups[g].items || [];
      for (var it = 0; it < items.length; it++) {
        if (items[it].slug === featureSlug) {
          return { productId: rows[i].product_id, productName: rows[i].name, epicName: groups[g].epicName };
        }
      }
    }
  }
  return null;
}

// pdt-s4 (AC1, AC1a, AC2, AC3): renders the breadcrumb nav — Product
// (linked) › [Phase/Epic (plain text, no dedicated page)] › story title.
// Degrades to a bare "Back to product list" link (reusing the existing
// /dashboard href from _renderProductView's own breadcrumb) when neither
// resolves — never a silent failure or a broken/blank breadcrumb (AC1a).
function _renderStoryBreadcrumb(context, displayTitle) {
  if (!context || !context.productId) {
    return '<nav aria-label="Breadcrumb" style="font-size:13px;color:var(--muted);margin-bottom:12px">' +
      '<a href="/dashboard" style="color:var(--muted);text-decoration:none">Back to product list</a>' +
    '</nav>';
  }
  var epicSegment = context.epicName
    ? ' &rsaquo; <span>' + shellEscHtml(context.epicName) + '</span>'
    : '';
  return '<nav aria-label="Breadcrumb" style="font-size:13px;color:var(--muted);margin-bottom:12px">' +
    '<a href="/products/' + shellEscHtml(context.productId) + '" style="color:var(--muted);text-decoration:none">' + shellEscHtml(context.productName) + '</a>' +
    epicSegment +
    ' &rsaquo; <span style="color:var(--ink)">' + shellEscHtml(displayTitle) + '</span>' +
  '</nav>';
}
```

Then, inside `handleGetFeatureArtefacts`, immediately after `const displayTitle = ...` (existing line) and before `const deletePostRedirect = ...`:

```javascript
  var breadcrumbContext = await _resolveBreadcrumbContext(featureSlug, journeyForPage, pool, req.session.tenantId);
  var breadcrumbHtml = _renderStoryBreadcrumb(breadcrumbContext, displayTitle);
```

And change the `bodyContent` line to prepend it:

```javascript
    const bodyContent = `${breadcrumbHtml}\n<h1>${shellEscHtml(displayTitle)}</h1>\n${deleteSectionHtml}\n${listHtml}`;
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pdt-s4-story-breadcrumb.js
```

Expected output: `[PASS] AC1: Product breadcrumb segment renders using journeyForPage.productId when resolvable`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all passing except the one pre-existing, unrelated `check-p3.5-validate-trace.js` failure. **Watch specifically** for `check-dfr-s1-fix-delete-feature-redirect.js` and `check-alrf-s4-postgres-artefact-fallback.js` — both call `handleGetFeatureArtefacts` directly with a mock `pool`; confirm their mock `pool.query` functions return `{rows: []}` for the new `SELECT name FROM products...`/`SELECT p.product_id...` queries (their existing catch-all `return { rows: [] }` branches should already handle this, since neither test asserts on the new breadcrumb markup) rather than throwing.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/features.js tests/check-pdt-s4-story-breadcrumb.js
git commit -m "feat: add Product breadcrumb segment to the story detail page (pdt-s4 AC1)"
```

---

## Task 2: Phase/Epic reverse lookup with graceful degradation (AC1a)

**Files:**
- Test: `tests/check-pdt-s4-story-breadcrumb.js` (no additional source change — Task 1's `_resolveBreadcrumbContext`/`_renderStoryBreadcrumb` already implement both branches)

- [ ] **Step 1: Write the failing tests**

```javascript
await test('AC1a: Phase/Epic segment resolves via reverse lookup when the story is nested in a known feature', async function() {
  var routes = freshRequire(FEATURES_PATH);
  routes.setListArtefacts(async function() { return { artefacts: [{ path: 'artefacts/dic/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false }; });
  routes.setJourneyStoreModule({
    getJourneyByFeatureSlug: function() { return null; }, // dic.5 is not itself a journeyStore feature
    getArtefactsForJourney: async function() { return []; }
  });
  var taxonomy = { groups: [{ epicSlug: 'e1', epicName: 'Discovery Improvements', items: [{ slug: 'dic.5', featureSlug: 'dic' }] }], ungrouped: [] };
  var pool = { query: async function(sql, params) {
    if (/SELECT p\.product_id, p\.name, pr\.taxonomy/i.test(sql)) {
      return { rows: params[0] === 't1' ? [{ product_id: 'product-dic', name: 'Discovery Product', taxonomy: taxonomy }] : [] };
    }
    return { rows: [] };
  } };
  var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
  var res = makeRes();
  await routes.handleGetFeatureArtefacts(req, res, 'dic.5', pool);
  var body = res._get().body;
  assert.ok(/Discovery Product/.test(body), 'expected the resolved product name from the reverse lookup');
  assert.ok(/Discovery Improvements/.test(body), 'expected the resolved epic name in the breadcrumb');
  assert.ok(/href="\/products\/product-dic"/.test(body), 'expected the product segment to link to /products/product-dic');
});

await test('AC1a: Phase/Epic segment gracefully omits when not resolvable -- no broken breadcrumb', async function() {
  var routes = freshRequire(FEATURES_PATH);
  routes.setListArtefacts(async function() { return { artefacts: [], grouped: {}, noArtefacts: true }; });
  routes.setJourneyStoreModule({
    getJourneyByFeatureSlug: function() { return null; },
    getArtefactsForJourney: async function() { return []; }
  });
  var pool = { query: async function() { return { rows: [] }; } }; // nothing resolvable anywhere
  var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
  var res = makeRes();
  var threw = false;
  try {
    await routes.handleGetFeatureArtefacts(req, res, 'totally-unknown-slug', pool);
  } catch (e) { threw = true; }
  assert.ok(!threw, 'expected no thrown exception for the fully-unresolvable case');
  var body = res._get().body;
  assert.ok(/Back to product list/.test(body), 'expected the bare "Back to product list" fallback link');
  assert.ok(/href="\/dashboard"/.test(body), 'expected the fallback link to target /dashboard');
});
```

- [ ] **Step 2: Run test — must pass immediately (Task 1's implementation already handles both branches)**

```bash
node tests/check-pdt-s4-story-breadcrumb.js
```

Expected output: both `[PASS]`

- [ ] **Step 3: Commit**

```bash
git add tests/check-pdt-s4-story-breadcrumb.js
git commit -m "test: confirm the Phase/Epic reverse lookup and its graceful degradation (pdt-s4 AC1a)"
```

---

## Task 3: Clicking the product name navigates back to the product page (AC2, integration)

**Files:**
- Test: `tests/check-pdt-s4-story-breadcrumb.js` (no source change — Task 1's link `href` already targets `/products/:id`; this test confirms it resolves through the real `handleGetProductView` route, not just that the href string looks right)

- [ ] **Step 1: Write the test**

```javascript
await test('AC2 (integration): the breadcrumb product link resolves to that product page via handleGetProductView', async function() {
  var featuresRoutes = freshRequire(FEATURES_PATH);
  featuresRoutes.setListArtefacts(async function() { return { artefacts: [{ path: 'artefacts/x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false }; });
  featuresRoutes.setJourneyStoreModule({
    getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'x', displayName: 'Feature X', completedStages: [], productId: 'product-abc' }; },
    getArtefactsForJourney: async function() { return []; }
  });
  var pool = { query: async function(sql, params) {
    if (/SELECT name FROM products WHERE product_id/i.test(sql)) return { rows: [{ name: 'Acme Product' }] };
    if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/i.test(sql)) return { rows: [{ name: 'Acme Product', tenant_id: 't1', repo_owner: null, repo_name: null }] };
    if (/FROM product_rollups WHERE product_id/i.test(sql)) return { rows: [] };
    if (/FROM journeys WHERE product_id/i.test(sql)) return { rows: [] };
    return { rows: [] };
  } };
  var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
  var res = makeRes();
  await featuresRoutes.handleGetFeatureArtefacts(req, res, 'x', pool);
  var breadcrumbBlock = /<nav aria-label="Breadcrumb"[\s\S]{0,400}?<\/nav>/.exec(res._get().body);
  assert.ok(breadcrumbBlock, 'expected a <nav aria-label="Breadcrumb"> block in the response');
  var breadcrumbHref = /<a href="(\/products\/[^"]+)"/.exec(breadcrumbBlock[0]);
  assert.ok(breadcrumbHref, 'expected a product link href inside the breadcrumb specifically (not elsewhere on the page, e.g. the nav sidebar\'s own /products/new link)');
  assert.strictEqual(breadcrumbHref[1], '/products/product-abc');

  var productsRoutes = freshRequire(PRODUCTS_PATH);
  var req2 = { params: { id: 'product-abc' }, session: { tenantId: 't1', login: 'user' } };
  var res2 = makeRes();
  await productsRoutes.handleGetProductView(req2, res2, null, pool);
  assert.strictEqual(res2._get().status, 200, 'expected the linked product page to resolve with a 200, not a 404');
  assert.ok(/Acme Product/.test(res2._get().body), 'expected the linked product page to be the same product');
});
```

**Note (found during TDD execution):** the original draft assertion here grabbed the first `/products/...` link anywhere on the page, which matched the nav sidebar's own unrelated "New feature"/`/products/new` link before reaching the breadcrumb's own link. Corrected to scope the search to the `<nav aria-label="Breadcrumb">` block specifically, as shown above.

- [ ] **Step 2: Run test — must pass**

```bash
node tests/check-pdt-s4-story-breadcrumb.js
```

Expected output: `[PASS] AC2 (integration): ...`

- [ ] **Step 3: Commit**

```bash
git add tests/check-pdt-s4-story-breadcrumb.js
git commit -m "test: confirm the breadcrumb product link resolves through the real product route (pdt-s4 AC2)"
```

---

## Task 4: No-artefacts case shows the breadcrumb, never a bare dead end (AC3)

**Files:**
- Test: `tests/check-pdt-s4-story-breadcrumb.js` (no source change — the breadcrumb is prepended to `bodyContent` unconditionally, before the existing `noArtefacts` branch decides `listHtml`)

- [ ] **Step 1: Write the test**

```javascript
await test('AC3: no-artefacts case still shows the breadcrumb and the honest empty message together', async function() {
  var routes = freshRequire(FEATURES_PATH);
  routes.setListArtefacts(async function() { return { artefacts: [], grouped: {}, noArtefacts: true }; });
  routes.setJourneyStoreModule({
    getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'x', displayName: 'Feature X', completedStages: [], productId: 'product-abc' }; },
    getArtefactsForJourney: async function() { return []; }
  });
  var pool = { query: async function(sql, params) {
    if (/SELECT name FROM products WHERE product_id/i.test(sql)) return { rows: [{ name: 'Acme Product' }] };
    return { rows: [] };
  } };
  var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
  var res = makeRes();
  await routes.handleGetFeatureArtefacts(req, res, 'x', pool);
  var body = res._get().body;
  assert.ok(/Acme Product/.test(body), 'expected the resolvable breadcrumb segment to still render');
  assert.ok(/No artefacts found for this feature/.test(body), 'expected the existing honest empty-state message to still render');
});
```

- [ ] **Step 2: Run test — must pass immediately**

```bash
node tests/check-pdt-s4-story-breadcrumb.js
```

Expected output: `[PASS] AC3: no-artefacts case still shows the breadcrumb and the honest empty message together`

- [ ] **Step 3: Commit**

```bash
git add tests/check-pdt-s4-story-breadcrumb.js
git commit -m "test: confirm the breadcrumb and no-artefacts message render together, never a bare dead end (pdt-s4 AC3)"
```

---

## Task 5: NFR tests — no new network call for the common case, and keyboard-navigable links

**Files:**
- Test: `tests/check-pdt-s4-story-breadcrumb.js`

- [ ] **Step 1: Write the tests**

```javascript
await test('NFR-Performance: the reverse lookup is not attempted when the direct (common-case) path already resolved', async function() {
  var routes = freshRequire(FEATURES_PATH);
  routes.setListArtefacts(async function() { return { artefacts: [{ path: 'artefacts/x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false }; });
  routes.setJourneyStoreModule({
    getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'x', displayName: 'Feature X', completedStages: [], productId: 'product-abc' }; },
    getArtefactsForJourney: async function() { return []; }
  });
  var reverseLookupCalled = false;
  var pool = { query: async function(sql, params) {
    if (/SELECT p\.product_id, p\.name, pr\.taxonomy/i.test(sql)) { reverseLookupCalled = true; return { rows: [] }; }
    if (/SELECT name FROM products WHERE product_id/i.test(sql)) return { rows: [{ name: 'Acme Product' }] };
    return { rows: [] };
  } };
  var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
  var res = makeRes();
  await routes.handleGetFeatureArtefacts(req, res, 'x', pool);
  assert.ok(!reverseLookupCalled, 'expected the heavier reverse-lookup query to be skipped entirely when journeyForPage.productId already resolved');
});

await test('NFR-Accessibility: breadcrumb segments are real, keyboard-navigable <a> elements', async function() {
  var routes = freshRequire(FEATURES_PATH);
  routes.setListArtefacts(async function() { return { artefacts: [{ path: 'artefacts/x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false }; });
  routes.setJourneyStoreModule({
    getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'x', displayName: 'Feature X', completedStages: [], productId: 'product-abc' }; },
    getArtefactsForJourney: async function() { return []; }
  });
  var pool = { query: async function(sql) {
    if (/SELECT name FROM products WHERE product_id/i.test(sql)) return { rows: [{ name: 'Acme Product' }] };
    return { rows: [] };
  } };
  var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
  var res = makeRes();
  await routes.handleGetFeatureArtefacts(req, res, 'x', pool);
  var body = res._get().body;
  assert.ok(/<nav aria-label="Breadcrumb"/.test(body), 'expected a semantic <nav aria-label="Breadcrumb"> wrapper');
  assert.ok(/<a href="\/products\/product-abc"/.test(body), 'expected the product segment to be a real <a href> element, not a span/div with a click handler');
});
```

- [ ] **Step 2: Run test — must pass**

```bash
node tests/check-pdt-s4-story-breadcrumb.js
```

Expected output: `[check-pdt-s4-story-breadcrumb] Results: 7 passed, 0 failed`

- [ ] **Step 3: Run full suite — no regressions**

```bash
npm test
```

Expected output: all passing except the one pre-existing, unrelated `check-p3.5-validate-trace.js` failure.

- [ ] **Step 4: Commit**

```bash
git add tests/check-pdt-s4-story-breadcrumb.js
git commit -m "test: add NFR tests for query-count discipline and breadcrumb keyboard-navigability (pdt-s4)"
```
