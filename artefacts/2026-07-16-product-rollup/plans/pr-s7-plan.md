# Render discovery scope and feature/epic taxonomy grouping — Implementation Plan

> **For agent execution:** Use /subagent-execution (Haiku model per operator instruction).

**Goal:** Make every test in `artefacts/2026-07-16-product-rollup/test-plans/pr-s7-test-plan.md` pass. Do not add scope beyond what the ACs and tests specify.
**Branch:** `feature/pr-s7` (based on `feature/pr-s2`, which now also contains pr-s3's and pr-s4's merged commits)
**Worktree:** `.worktrees/pr-s7`
**Test command:** `node <file>` (plain Node scripts using the built-in `assert` module)

**Schema design note (this story has the most ambiguity of Epic 2 — read carefully):** verified directly against this repo's own real `.github/pipeline-state.json`:
- `discoveryArtefact` is a genuine **top-level-feature** field (unlike `testPlan`/`acTotal`, which are story-level) — e.g. `{ slug: "2026-06-22-skills-infra-migration-tracks", discoveryArtefact: "artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md", ... }`.
- `epics[]` is a child collection of one top-level feature (23 of this repo's 51 features have non-empty `epics[]`), each epic having its own `stories[]`. Epics never span or group multiple top-level features — a top-level feature either has its own internal epics grouping its own stories, or has a flat `stories[]`.
- The story's own AC text ("features spanning multiple epics", "groups features under their parent epic") and its test fixtures ("Epic A (2 features), Epic B (2 features)") use "feature" loosely to mean "leaf item," matching the exact same terminology looseness pr-s2's AC4, pr-s5's AC1-4, and pr-s6's AC1-4 already resolved for `dodStatus`/`testPlan`/`acTotal`. Applying the same resolution here: for a top-level feature with non-empty `epics[]`, this story groups **that feature's own stories** under their parent epic; for a top-level feature with no epics (flat), the **feature itself** (with its own `discoveryArtefact`) is the ungrouped leaf item. This is why AC2 (discovery-artefact summary/link) naturally applies to the **ungrouped** list only — an epic-nested story has no `discoveryArtefact` of its own; the artefact belongs to its parent top-level feature.
- AC4's "matches the cached rollup record's own total" is a **self-consistency guarantee by construction**: the aggregation function increments a single running counter every time it emits a leaf item (whether into a group or into the ungrouped list) and returns that counter as `totalCount` alongside the grouped/ungrouped arrays — so `sum(groups[].items.length) + ungrouped.length` always equals `totalCount` unless the function itself has an accounting bug. This is the correctness property AC4 exists to catch (mirroring the exact same "sum of dimension views vs known total" class of test already used in pr-s2's and pr-s5's own no-double-count/no-drop tests).

---

## File map

```
Modify:
  src/web-ui/modules/product-rollup.js       — add computeTaxonomyRollup()
  tests/check-pr-s2-product-rollup.js        — append AC1-AC4 unit tests
  src/web-ui/server.js                       — ALTER TABLE product_rollups ADD COLUMN taxonomy
  src/web-ui/routes/products.js              — render epic groups + ungrouped list with discovery-artefact links
  tests/check-pr-s2-products-route.js        — append AC4 integration + NFR-a11y tests
```

---

## Task 1: Taxonomy grouping aggregation (AC1, AC3, AC4)

**Files:**
- Modify: `src/web-ui/modules/product-rollup.js`
- Modify (append to): `tests/check-pr-s2-product-rollup.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-pr-s2-product-rollup.js`, inserting these `queue.push(...)` blocks immediately before the line `for (var i = 0; i < queue.length; i++) {`:

```javascript
  // T24: groups stories under their parent epic and lists ungrouped (flat) features separately (AC1)
  queue.push(function() {
    console.log('\n[pr-s7] T24 -- groups stories under their parent epic and lists ungrouped features separately (AC1)');
    return test('computeTaxonomyRollup: 2 epics with 2 stories each, plus 1 flat ungrouped feature', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          { slug: 'fa', epics: [{ slug: 'epic-a', name: 'Epic A', stories: [{ slug: 'a1' }, { slug: 'a2' }] }] },
          { slug: 'fb', epics: [{ slug: 'epic-b', name: 'Epic B', stories: [{ slug: 'b1' }, { slug: 'b2' }] }] },
          { slug: 'fc', name: 'Flat Feature C', discoveryArtefact: 'artefacts/fc/discovery.md' }
        ]
      };
      var result = mod.computeTaxonomyRollup(pipelineState);
      assert.strictEqual(result.groups.length, 2, 'Expected 2 epic groups');
      var epicA = result.groups.find(function(g) { return g.epicSlug === 'epic-a'; });
      var epicB = result.groups.find(function(g) { return g.epicSlug === 'epic-b'; });
      assert.strictEqual(epicA.items.length, 2, 'Expected Epic A to have 2 items');
      assert.strictEqual(epicB.items.length, 2, 'Expected Epic B to have 2 items');
      assert.strictEqual(result.ungrouped.length, 1, 'Expected exactly 1 ungrouped feature');
      assert.strictEqual(result.ungrouped[0].slug, 'fc');
    });
  });

  // T25: a feature with epics[].stories[] AND a stale empty top-level stories[] is not double-counted (AC1)
  queue.push(function() {
    console.log('\n[pr-s7] T25 -- a feature with both epics[].stories[] and a stale empty top-level stories[] is not double-counted (AC1)');
    return test('computeTaxonomyRollup: epic-nested feature with a leftover empty stories[] field appears once, under its epic only', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          { slug: 'fa', stories: [], epics: [{ slug: 'epic-a', name: 'Epic A', stories: [{ slug: 'a1' }] }] }
        ]
      };
      var result = mod.computeTaxonomyRollup(pipelineState);
      assert.strictEqual(result.groups.length, 1);
      assert.strictEqual(result.groups[0].items.length, 1, 'Expected exactly 1 item under Epic A, not double-counted via the stale stories[] field');
      assert.strictEqual(result.ungrouped.length, 0, 'Expected the epic-nested feature to NOT also appear in ungrouped');
    });
  });

  // T26: a product with zero epics renders a flat list with no empty epics section (AC3)
  queue.push(function() {
    console.log('\n[pr-s7] T26 -- a product with zero epics returns an empty groups array, not a misleading empty-epics placeholder (AC3)');
    return test('computeTaxonomyRollup: all-flat features -> groups is empty array, ungrouped has all 4', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          { slug: 'f1' }, { slug: 'f2' }, { slug: 'f3' }, { slug: 'f4' }
        ]
      };
      var result = mod.computeTaxonomyRollup(pipelineState);
      assert.deepStrictEqual(result.groups, [], 'Expected an empty groups array (not a group with zero items)');
      assert.strictEqual(result.ungrouped.length, 4);
    });
  });

  // T27: the taxonomy view's own total matches groups+ungrouped, by construction (AC4)
  queue.push(function() {
    console.log('\n[pr-s7] T27 -- the taxonomy view\'s own total feature count matches the sum of grouped + ungrouped items (AC4)');
    return test('computeTaxonomyRollup: totalCount equals sum(groups[].items.length) + ungrouped.length', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          { slug: 'fa', epics: [{ slug: 'epic-a', name: 'Epic A', stories: [{ slug: 'a1' }, { slug: 'a2' }] }] },
          { slug: 'fb', epics: [{ slug: 'epic-b', name: 'Epic B', stories: [{ slug: 'b1' }, { slug: 'b2' }] }] },
          { slug: 'fc', discoveryArtefact: 'artefacts/fc/discovery.md' }
        ]
      };
      var result = mod.computeTaxonomyRollup(pipelineState);
      var sumFromView = result.groups.reduce(function(acc, g) { return acc + g.items.length; }, 0) + result.ungrouped.length;
      assert.strictEqual(sumFromView, 5, 'Expected 5 total leaf items (4 epic-nested + 1 ungrouped)');
      assert.strictEqual(result.totalCount, 5, 'Expected totalCount to equal 5');
      assert.strictEqual(sumFromView, result.totalCount, 'Expected the view\'s own summed total to match totalCount exactly');
    });
  });

```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected: `TypeError: mod.computeTaxonomyRollup is not a function`

- [ ] **Step 3: Write the implementation**

Add to `src/web-ui/modules/product-rollup.js` (after `computeAcCoverageRollup`, before `syncProductRollup`):

```javascript

/**
 * Groups a product's stories by their parent epic, and lists top-level
 * features with no epics (flat stories[]) separately as "ungrouped" (AC1).
 * A feature with a populated epics[].stories[] and a stale/empty top-level
 * stories[] field (this repo's own real shape) is grouped under its epic
 * only, never also counted as ungrouped (AC1, mirrors pr-s2's AC4). A
 * product with zero epics anywhere returns an empty groups array -- never
 * a group entry with zero items -- so the render layer can correctly omit
 * an "Epics" section entirely rather than showing a misleading empty one
 * (AC3). discoveryArtefact is a genuine top-level-feature field in this
 * repo's schema, so it is only carried on ungrouped entries (AC2) -- an
 * epic-nested story has no discoveryArtefact of its own. totalCount is
 * incremented once per emitted leaf item (by construction, in the same
 * walk that builds groups/ungrouped), so it is guaranteed to equal
 * sum(groups[].items.length) + ungrouped.length unless the walk itself has
 * a bug -- this is the correctness property AC4 exists to catch (AC4).
 *
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @returns {{groups: Array<{epicSlug: string, epicName: string, items: Array<{slug: string}>}>, ungrouped: Array<{slug: string, name: string|undefined, discoveryArtefact: string|undefined}>, totalCount: number}}
 */
function computeTaxonomyRollup(pipelineState) {
  var features = (pipelineState && pipelineState.features) || [];
  var groups = [];
  var ungrouped = [];
  var totalCount = 0;

  features.forEach(function(feature) {
    if (Array.isArray(feature.epics) && feature.epics.length > 0) {
      feature.epics.forEach(function(epic) {
        var items = (epic.stories || []).map(function(story) {
          totalCount++;
          return { slug: story.slug };
        });
        groups.push({ epicSlug: epic.slug, epicName: epic.name, items: items });
      });
    } else {
      totalCount++;
      ungrouped.push({ slug: feature.slug, name: feature.name, discoveryArtefact: feature.discoveryArtefact });
    }
  });

  return { groups: groups, ungrouped: ungrouped, totalCount: totalCount };
}
```

Update `module.exports` at the bottom of the file to include `computeTaxonomyRollup`:

```javascript
module.exports = {
  computeDodStatusRollup,
  computeHealthCounts,
  computeOverallHealthSignal,
  computeTestCoverageRollup,
  computeAcCoverageRollup,
  computeTaxonomyRollup,
  syncProductRollup,
  triggerProductSync,
  isSyncInProgress
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected: all existing tests plus 4 new ones pass, 0 failed (exact total depends on which sibling Epic 2 branches have merged into this branch's base by the time you run it — do not treat a different-from-expected existing count as a failure as long as the delta is exactly +4 and every test, old and new, shows `[PASS]`).

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/product-rollup.js tests/check-pr-s2-product-rollup.js
git commit -m "feat(pr-s7): add epic/feature taxonomy grouping with a self-consistent total count"
```

---

## Task 2: Store taxonomy in the cache table (AC1/AC4 storage)

**Files:**
- Modify: `src/web-ui/modules/product-rollup.js` (`syncProductRollup`)
- Modify: `src/web-ui/server.js` (add `taxonomy` column)
- Modify (append to): `tests/check-pr-s2-product-rollup.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-pr-s2-product-rollup.js`, inside the same insertion point (immediately before the `for` loop), after Task 1's blocks:

```javascript
  // T28: syncProductRollup also computes and writes taxonomy alongside the other rollup columns (AC1/AC4 storage)
  queue.push(function() {
    console.log('\n[pr-s7] T28 -- syncProductRollup writes taxonomy alongside the other rollup columns (AC1/AC4 storage)');
    return test('syncProductRollup: the cache write includes taxonomy', async function() {
      var mod = freshRequire();
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
      var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
      var fixture = { features: [{ slug: 'f1', epics: [{ slug: 'e1', name: 'Epic 1', stories: [{ slug: 's1' }] }] }] };
      freshAdapterMod.setPipelineStateFetchAdapter(async function() {
        return { content: Buffer.from(JSON.stringify(fixture)).toString('base64'), encoding: 'base64' };
      });

      var capturedSql = null; var capturedParams = null;
      var mockPool = {
        query: async function(sql, params) {
          if (/INSERT INTO product_rollups/i.test(sql)) { capturedSql = sql; capturedParams = params; }
          return { rows: [] };
        }
      };

      await mod.syncProductRollup(mockPool, freshAdapterMod, { productId: 'p1', repoOwner: 'acme', repoName: 'widgets', accessToken: 'x' });

      assert.ok(/taxonomy/i.test(capturedSql), 'Expected the INSERT statement to include the taxonomy column');
      var taxonomyJson = capturedParams.find(function(p) { return typeof p === 'string' && p.indexOf('epicSlug') !== -1; });
      assert.ok(taxonomyJson, 'Expected one of the written params to be the taxonomy JSON containing the grouped epic data');
    });
  });

```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected: fails the `taxonomy` regex assertion.

- [ ] **Step 3: Write the implementation**

In `src/web-ui/modules/product-rollup.js`, replace the entire body of `syncProductRollup` with (extending whichever version currently exists on this branch — if a sibling Epic 2 story's own storage columns aren't present yet on this branch, add only the `taxonomy` column/parameter to whatever the current INSERT statement looks like, following the exact same positional-parameter pattern already used):

```javascript
async function syncProductRollup(pool, adapterModule, opts) {
  var raw = await adapterModule.getPipelineStateFetchAdapter()(opts.repoOwner, opts.repoName, opts.accessToken);
  var decoded = Buffer.from(raw.content, 'base64').toString('utf8');
  var pipelineState = JSON.parse(decoded);
  var rollup = computeDodStatusRollup(pipelineState);
  var healthCounts = computeHealthCounts(pipelineState);
  var taxonomy = computeTaxonomyRollup(pipelineState);

  await pool.query(
    `INSERT INTO product_rollups (product_id, dod_status_counts, health_counts, taxonomy, synced_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (product_id) DO UPDATE SET dod_status_counts = $2, health_counts = $3, taxonomy = $4, synced_at = NOW()`,
    [opts.productId, JSON.stringify(rollup), JSON.stringify(healthCounts), JSON.stringify(taxonomy)]
  );

  return rollup;
}
```

**Important:** read the CURRENT state of `syncProductRollup` on this branch before replacing it — if pr-s5's or pr-s6's storage columns (`test_coverage`, `ac_coverage`) are already present (because their branches merged into this one's base by the time you run this), keep those columns and their computation calls intact, and just ADD `taxonomy` as one more column/parameter following the same pattern, rather than reverting to the simpler 2-column version shown above. The version shown here is the minimum (pr-s2 + pr-s4 + this story's own column); adapt it to whatever this branch's actual current file contains, adding only what this task needs.

In `src/web-ui/server.js`, find the LAST existing `product_rollups` column migration block on this branch (search for `ALTER TABLE product_rollups ADD COLUMN IF NOT EXISTS` and use whichever one appears last in the file) and add a new migration immediately after its `.catch(...)` closes:

```javascript

// pr-s7: add the epic/feature taxonomy rollup column. Idempotent, same
// pattern as the other product_rollups column migrations.
_creditsPool.query(`ALTER TABLE product_rollups ADD COLUMN IF NOT EXISTS taxonomy JSONB NOT NULL DEFAULT '{}'`).then(function() {
  console.log('[pr-s7] product_rollups.taxonomy column ready');
}).catch(function(err) {
  console.error('[pr-s7] taxonomy migration failed:', err.message);
});
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected: all tests pass, 0 failed.

- [ ] **Step 5: Sanity-check server.js still parses**

```bash
node -c src/web-ui/server.js
```

- [ ] **Step 6: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/modules/product-rollup.js src/web-ui/server.js tests/check-pr-s2-product-rollup.js
git commit -m "feat(pr-s7): store computed taxonomy alongside the other rollup dimensions in the cache"
```

---

## Task 3: Render epic groups + ungrouped features with discovery-artefact links (AC2, AC3 render, AC4 integration, NFR-Accessibility)

**Files:**
- Modify: `src/web-ui/routes/products.js` (`_renderProductView`, `handleGetProductView`)
- Modify (append to): `tests/check-pr-s2-products-route.js`

- [ ] **Step 1: Write the failing test**

First, read the CURRENT `_renderProductView` and `handleGetProductView` in `src/web-ui/routes/products.js` on this branch to find the exact current `rollupRow` SELECT query (its column list depends on which sibling Epic 2 stories have merged into this branch's base already) and the exact current body-concatenation order. Then append a new test block to `tests/check-pr-s2-products-route.js`, inside the same async IIFE, immediately before the final `console.log('\n[pr-s2-...-products-route] Results...` line:

```javascript

  console.log('\n[pr-s7] AC2/AC3/AC4 -- epic/feature taxonomy renders with discovery-artefact links and a self-consistent total');

  await (async function() {
    try {
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/routes/products.js'))];
      var productsRouteFresh = require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));

      var syncedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      var taxonomyJson = JSON.stringify({
        groups: [{ epicSlug: 'epic-a', epicName: 'Epic A', items: [{ slug: 's1' }, { slug: 's2' }] }],
        ungrouped: [{ slug: 'fc', name: 'Flat Feature C', discoveryArtefact: 'artefacts/fc/discovery.md' }],
        totalCount: 3
      });
      // NOTE: adapt this mock's SELECT regex and returned row object to match
      // whatever columns handleGetProductView's rollupRow query currently
      // selects on this branch (it will include dod_status_counts,
      // health_counts, taxonomy at minimum, possibly test_coverage/
      // ac_coverage too if those sibling stories have merged in already) --
      // read the real query text first and mirror it exactly, the same way
      // every prior story's Task 3 has kept its mocks in sync with the real
      // query.
      var mockPool = {
        query: async function(sql) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          if (/FROM product_rollups/i.test(sql)) {
            return { rows: [{ dod_status_counts: '{}', health_counts: '{}', taxonomy: taxonomyJson, synced_at: syncedAt }] };
          }
          return { rows: [] };
        }
      };
      var html = null;
      var req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var res = { writeHead: function() {}, end: function(body) { html = body; } };
      await productsRouteFresh.handleGetProductView(req, res, null, mockPool);

      if (!/Epic A/.test(html)) throw new Error('Expected the epic group name "Epic A" to appear in the rendered page');
      passed++; console.log('  [PASS] _renderProductView: renders epic groups (AC1)');

      if (!/Flat Feature C/.test(html) || !/artefacts\/fc\/discovery\.md/.test(html)) throw new Error('Expected the ungrouped feature and a discovery-artefact link/reference to appear');
      passed++; console.log('  [PASS] _renderProductView: renders ungrouped features with a discovery-artefact link (AC2)');
    } catch (err) {
      failed++; console.log('  [FAIL] taxonomy rendering --', err.message);
    }
  })();

  await (async function() {
    try {
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/routes/products.js'))];
      var productsRouteFresh = require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));
      var syncedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      var flatTaxonomyJson = JSON.stringify({ groups: [], ungrouped: [{ slug: 'f1' }, { slug: 'f2' }], totalCount: 2 });
      var mockPoolFlat = {
        query: async function(sql) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          if (/FROM product_rollups/i.test(sql)) {
            return { rows: [{ dod_status_counts: '{}', health_counts: '{}', taxonomy: flatTaxonomyJson, synced_at: syncedAt }] };
          }
          return { rows: [] };
        }
      };
      var htmlFlat = null;
      var reqFlat = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var resFlat = { writeHead: function() {}, end: function(body) { htmlFlat = body; } };
      await productsRouteFresh.handleGetProductView(reqFlat, resFlat, null, mockPoolFlat);

      if (/Epics<\/h[1-6]>/i.test(htmlFlat)) throw new Error('Expected no empty "Epics" heading when there are zero epic groups (AC3)');
      passed++; console.log('  [PASS] _renderProductView: shows no misleading empty epics section when there are zero epics (AC3)');
    } catch (err) {
      failed++; console.log('  [FAIL] flat-taxonomy rendering (AC3) --', err.message);
    }
  })();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-products-route.js
```

Expected: fails (current `_renderProductView` doesn't render taxonomy at all, and the current `rollupRow` query doesn't select `taxonomy`).

- [ ] **Step 3: Write the implementation**

**First**, read the CURRENT `handleGetProductView`'s `rollupRow` query on this branch and add `taxonomy` to its column list, keeping every other column already present (from whichever sibling stories have merged into this branch's base) — e.g. if it currently reads `SELECT dod_status_counts, health_counts, synced_at FROM product_rollups WHERE product_id = $1`, change it to `SELECT dod_status_counts, health_counts, taxonomy, synced_at FROM product_rollups WHERE product_id = $1`.

**This changes the real SQL query string.** Update every existing mock `query` function already in `tests/check-pr-s2-products-route.js` to also match the new query text and include a `taxonomy: '{}'` key in their returned row objects, exactly the same necessary-mock-sync fix every prior story's Task 3 has made for its own new column.

**Second**, in `_renderProductView`, add a new rendering block for taxonomy. Insert it after whatever the LAST existing rollup-rendering block is (e.g. after `healthHtml`, or after `acCoverageHtml`/`coverageHtml` if those siblings' code is present on this branch — insert after the last one, before `var body = ...`):

```javascript
  var taxonomy = (rollupRow && rollupRow.taxonomy) ? JSON.parse(rollupRow.taxonomy) : null;
  var taxonomyHtml = '';
  if (taxonomy) {
    var epicsSectionHtml = '';
    if (taxonomy.groups && taxonomy.groups.length > 0) {
      epicsSectionHtml =
        '<h3 style="font-size:14px;margin:16px 0 8px">Epics</h3>' +
        taxonomy.groups.map(function(g) {
          return '<div style="margin-bottom:10px">' +
            '<h4 style="font-size:13px;margin:0 0 4px">' + _escapeHtml(g.epicName || g.epicSlug) + '</h4>' +
            '<ul style="margin:0;padding-left:18px;font-size:12px;color:var(--muted)">' +
              g.items.map(function(item) {
                return '<li tabindex="0">' + _escapeHtml(item.slug) + '</li>';
              }).join('') +
            '</ul>' +
          '</div>';
        }).join('');
    }
    var ungroupedSectionHtml = (taxonomy.ungrouped && taxonomy.ungrouped.length > 0)
      ? '<h3 style="font-size:14px;margin:16px 0 8px">Other features</h3>' +
        '<ul style="margin:0;padding-left:18px;font-size:12px">' +
          taxonomy.ungrouped.map(function(f) {
            var link = f.discoveryArtefact
              ? ' — <a href="/artefact/' + _escapeHtml(f.slug) + '/discovery" tabindex="0">' + _escapeHtml(f.discoveryArtefact) + '</a>'
              : '';
            return '<li tabindex="0">' + _escapeHtml(f.name || f.slug) + link + '</li>';
          }).join('') +
        '</ul>'
      : '';
    taxonomyHtml = '<div style="margin-top:16px">' + epicsSectionHtml + ungroupedSectionHtml + '</div>';
  }
```

Update the `body` concatenation to include `taxonomyHtml` immediately after whatever the last existing rollup-html variable currently is in the concatenation chain (e.g. after `healthHtml +`, or after `acCoverageHtml +`/`coverageHtml +` if present), before `featuresHtml +`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-products-route.js
```

Expected: all tests pass, 0 failed.

- [ ] **Step 5: Sanity-check syntax**

```bash
node -c src/web-ui/routes/products.js
```

- [ ] **Step 6: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-pr-s2-products-route.js
git commit -m "feat(pr-s7): render epic/feature taxonomy grouping with discovery-artefact links"
```

---

## Final check before handoff

- [ ] All 4 story ACs covered: AC1 (Task 1, Task 3), AC2 (Task 1 via discoveryArtefact field, Task 3 render), AC3 (Task 1, Task 3), AC4 (Task 1, Task 2, Task 3)
- [ ] Total new/appended tests: 4 (aggregation, Task 1) + 1 (storage, Task 2) + 3 (rendering, Task 3) = 8
- [ ] `npm test` full suite run after all 3 tasks — compare failed-file count against this branch's own baseline (captured at `/branch-setup`) — must be unchanged or lower, never higher
- [ ] Since this branch is based on `feature/pr-s2` (which now also contains pr-s3's and pr-s4's commits, and possibly pr-s5's/pr-s6's if merged by the time this runs), note in the PR description that this PR should not be merged before PR #490 merges to master
- [ ] The epic-level cross-story consistency check (this story's total vs. pr-s4's rendered health-view total) is explicitly NOT part of this story's test plan (per review finding 7-M1) — do not add it here; it belongs in `pr-e2-dimensions.md`'s epic-level integration check
