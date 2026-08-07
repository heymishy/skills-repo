# Render aggregate test coverage on the product rollup view — Implementation Plan

> **For agent execution:** Use /subagent-execution (Haiku model per operator instruction).

**Goal:** Make every test in `artefacts/2026-07-16-product-rollup/test-plans/pr-s5-test-plan.md` pass. Do not add scope beyond what the ACs and tests specify.
**Branch:** `feature/pr-s5` (based on `feature/pr-s2`, which now also contains pr-s3's and pr-s4's merged commits)
**Worktree:** `.worktrees/pr-s5`
**Test command:** `node <file>` (plain Node scripts using the built-in `assert` module)

**Important schema note (verified directly against this repo's own real `.github/pipeline-state.json`):** the story's ACs and test plan describe aggregating "features'" `testPlan.{totalTests,passing}` values, but in the real schema `testPlan` is a **story-level** field (nested under `feature.stories[]` or `feature.epics[].stories[]`) — zero of this repo's 51 top-level `feature` objects have a feature-level `testPlan` field. This is the exact same feature-vs-story granularity resolved by pr-s2's AC4 for `dodStatus`. This plan's fixtures therefore use per-**story** `testPlan` values (matching the real schema) rather than per-top-level-feature values, reusing the identical epics-vs-flat-stories walk already established in `computeDodStatusRollup`. The DoR's locked-in method (sum-of-passing/sum-of-total, "blended," not an average of percentages) is unaffected by this granularity clarification — only the loop target (stories, not top-level features) changes.

---

## File map

```
Modify:
  src/web-ui/modules/product-rollup.js       — add computeTestCoverageRollup()
  tests/check-pr-s2-product-rollup.js        — append AC1-AC4 unit tests
  src/web-ui/server.js                       — ALTER TABLE product_rollups ADD COLUMN test_coverage
  src/web-ui/routes/products.js              — render blended % + per-story breakdown + "No test data yet" state
  tests/check-pr-s2-products-route.js        — append AC1 integration + NFR-a11y tests
```

---

## Task 1: Test-coverage aggregation (AC1, AC2, AC3, AC4)

**Files:**
- Modify: `src/web-ui/modules/product-rollup.js`
- Modify (append to): `tests/check-pr-s2-product-rollup.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-pr-s2-product-rollup.js`, inserting these `queue.push(...)` blocks immediately before the line `for (var i = 0; i < queue.length; i++) {`:

```javascript
  // T15: blended test coverage is sum-of-passing/sum-of-total, not an average of percentages (AC1)
  queue.push(function() {
    console.log('\n[pr-s5] T15 -- blended test coverage is sum-of-passing/sum-of-total, not an average of percentages (AC1)');
    return test('computeTestCoverageRollup: 10/9 + 2/2 stories -> 91.7% blended (not 95% naive average)', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          { slug: 'f1', stories: [{ slug: 's1', testPlan: { totalTests: 10, passing: 9 } }] },
          { slug: 'f2', stories: [{ slug: 's2', testPlan: { totalTests: 2, passing: 2 } }] }
        ]
      };
      var result = mod.computeTestCoverageRollup(pipelineState);
      assert.strictEqual(result.blendedPercentage, 91.7, 'Expected 91.7 (11/12 blended), got ' + result.blendedPercentage);
    });
  });

  // T16: stories with no testPlan field are excluded from numerator and denominator (AC2)
  queue.push(function() {
    console.log('\n[pr-s5] T16 -- stories with no testPlan field are excluded from the aggregate, not counted as 0% (AC2)');
    return test('computeTestCoverageRollup: a story with no testPlan contributes nothing to numerator or denominator', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          { slug: 'f1', stories: [{ slug: 's1', testPlan: { totalTests: 10, passing: 8 } }] },
          { slug: 'f2', stories: [{ slug: 's2' }] } // no testPlan at all
        ]
      };
      var result = mod.computeTestCoverageRollup(pipelineState);
      assert.strictEqual(result.blendedPercentage, 80, 'Expected 80% (8/10), story with no testPlan must contribute nothing, got ' + result.blendedPercentage);
    });
  });

  // T17: per-story test-coverage detail is retrievable alongside the blended aggregate (AC3)
  queue.push(function() {
    console.log('\n[pr-s5] T17 -- per-story test-coverage detail is retrievable alongside the blended aggregate (AC3)');
    return test('computeTestCoverageRollup: result includes a perFeature breakdown array with each story\'s own percentage', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          { slug: 'f1', stories: [{ slug: 's1', testPlan: { totalTests: 10, passing: 9 } }] },
          { slug: 'f2', stories: [{ slug: 's2', testPlan: { totalTests: 2, passing: 2 } }] }
        ]
      };
      var result = mod.computeTestCoverageRollup(pipelineState);
      assert.ok(Array.isArray(result.perFeature), 'Expected a perFeature array in the result');
      assert.strictEqual(result.perFeature.length, 2, 'Expected one breakdown entry per testPlan-bearing story');
      var s1 = result.perFeature.find(function(x) { return x.slug === 's1'; });
      assert.strictEqual(s1.percentage, 90, 'Expected s1\'s own percentage to be 90 (9/10), got ' + (s1 && s1.percentage));
    });
  });

  // T18: zero stories with testPlan data returns an explicit no-data marker, not 0% or NaN (AC4)
  queue.push(function() {
    console.log('\n[pr-s5] T18 -- zero stories with testPlan data returns an explicit no-data marker, not 0% or NaN (AC4)');
    return test('computeTestCoverageRollup: no testPlan data anywhere returns blendedPercentage null and noData true', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          { slug: 'f1', stories: [{ slug: 's1' }] },
          { slug: 'f2', stories: [{ slug: 's2' }] }
        ]
      };
      var result = mod.computeTestCoverageRollup(pipelineState);
      assert.strictEqual(result.blendedPercentage, null, 'Expected null (not 0 or NaN) when no story has testPlan data');
      assert.strictEqual(result.noData, true, 'Expected an explicit noData: true marker');
      assert.deepStrictEqual(result.perFeature, [], 'Expected an empty perFeature array, not undefined or an array of zeros');
    });
  });

```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected: `TypeError: mod.computeTestCoverageRollup is not a function`

- [ ] **Step 3: Write the implementation**

Add to `src/web-ui/modules/product-rollup.js` (after `computeOverallHealthSignal`, before `syncProductRollup`):

```javascript

/**
 * Aggregates test coverage across every story in every feature (handling
 * both epics[].stories[] and flat feature.stories[] structures, same walk
 * as computeDodStatusRollup) as a single blended percentage -- sum of
 * testPlan.passing over sum of testPlan.totalTests -- NOT an average of
 * each story's own percentage (AC1). A story with no testPlan field at all
 * is excluded from both the numerator and denominator entirely; it is
 * never treated as a 0% contributor (AC2). Per-story detail is always
 * returned alongside the blended number (AC3). If no story anywhere has
 * any testPlan data, blendedPercentage is null and noData is true --
 * never 0 or NaN (AC4).
 *
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @returns {{blendedPercentage: number|null, noData: boolean, totalPassing: number, totalTests: number, perFeature: Array<{slug: string, passing: number, totalTests: number, percentage: number}>}}
 */
function computeTestCoverageRollup(pipelineState) {
  var features = (pipelineState && pipelineState.features) || [];
  var totalPassing = 0;
  var totalTests = 0;
  var perFeature = [];

  features.forEach(function(feature) {
    var stories = [];
    if (Array.isArray(feature.epics) && feature.epics.length > 0) {
      feature.epics.forEach(function(epic) {
        (epic.stories || []).forEach(function(story) { stories.push(story); });
      });
    } else {
      stories = feature.stories || [];
    }

    stories.forEach(function(story) {
      if (!story.testPlan || typeof story.testPlan.totalTests !== 'number' || story.testPlan.totalTests <= 0) {
        return;
      }
      var passing = story.testPlan.passing || 0;
      var total = story.testPlan.totalTests;
      totalPassing += passing;
      totalTests += total;
      perFeature.push({
        slug: story.slug,
        passing: passing,
        totalTests: total,
        percentage: Math.round((passing / total) * 1000) / 10
      });
    });
  });

  if (totalTests === 0) {
    return { blendedPercentage: null, noData: true, totalPassing: 0, totalTests: 0, perFeature: [] };
  }

  return {
    blendedPercentage: Math.round((totalPassing / totalTests) * 1000) / 10,
    noData: false,
    totalPassing: totalPassing,
    totalTests: totalTests,
    perFeature: perFeature
  };
}
```

Update `module.exports` at the bottom of the file to include `computeTestCoverageRollup`:

```javascript
module.exports = {
  computeDodStatusRollup,
  computeHealthCounts,
  computeOverallHealthSignal,
  computeTestCoverageRollup,
  syncProductRollup,
  triggerProductSync,
  isSyncInProgress
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: `[pr-s2-product-rollup] Results: 19 passed, 0 failed` (15 existing + 4 new)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/product-rollup.js tests/check-pr-s2-product-rollup.js
git commit -m "feat(pr-s5): add blended test-coverage aggregation excluding no-data stories"
```

---

## Task 2: Store test coverage in the cache table (AC1 storage)

**Files:**
- Modify: `src/web-ui/modules/product-rollup.js` (`syncProductRollup`)
- Modify: `src/web-ui/server.js` (add `test_coverage` column)
- Modify (append to): `tests/check-pr-s2-product-rollup.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-pr-s2-product-rollup.js`, inside the same insertion point (immediately before the `for` loop), after Task 1's blocks:

```javascript
  // T19: syncProductRollup also computes and writes test_coverage alongside the other rollup columns (AC1 storage)
  queue.push(function() {
    console.log('\n[pr-s5] T19 -- syncProductRollup writes test_coverage alongside dod_status_counts and health_counts (AC1 storage)');
    return test('syncProductRollup: the cache write includes test_coverage', async function() {
      var mod = freshRequire();
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
      var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
      var fixture = { features: [{ slug: 'f1', stories: [{ slug: 's1', testPlan: { totalTests: 10, passing: 9 } }] }] };
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

      assert.ok(/test_coverage/i.test(capturedSql), 'Expected the INSERT statement to include the test_coverage column');
      var coverageJson = capturedParams.find(function(p) { return typeof p === 'string' && p.indexOf('blendedPercentage') !== -1; });
      assert.ok(coverageJson, 'Expected one of the written params to be the test_coverage JSON containing blendedPercentage');
    });
  });

```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected: fails the `test_coverage` regex assertion.

- [ ] **Step 3: Write the implementation**

In `src/web-ui/modules/product-rollup.js`, replace the entire body of `syncProductRollup` with:

```javascript
async function syncProductRollup(pool, adapterModule, opts) {
  var raw = await adapterModule.getPipelineStateFetchAdapter()(opts.repoOwner, opts.repoName, opts.accessToken);
  var decoded = Buffer.from(raw.content, 'base64').toString('utf8');
  var pipelineState = JSON.parse(decoded);
  var rollup = computeDodStatusRollup(pipelineState);
  var healthCounts = computeHealthCounts(pipelineState);
  var testCoverage = computeTestCoverageRollup(pipelineState);

  await pool.query(
    `INSERT INTO product_rollups (product_id, dod_status_counts, health_counts, test_coverage, synced_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (product_id) DO UPDATE SET dod_status_counts = $2, health_counts = $3, test_coverage = $4, synced_at = NOW()`,
    [opts.productId, JSON.stringify(rollup), JSON.stringify(healthCounts), JSON.stringify(testCoverage)]
  );

  return rollup;
}
```

In `src/web-ui/server.js`, find the existing `health_counts` column migration block (search for `ALTER TABLE product_rollups ADD COLUMN IF NOT EXISTS health_counts`) and add a new migration immediately after its `.catch(...)` closes:

```javascript

// pr-s5: add the blended test-coverage rollup column. Idempotent, same
// pattern as the health_counts migration above.
_creditsPool.query(`ALTER TABLE product_rollups ADD COLUMN IF NOT EXISTS test_coverage JSONB NOT NULL DEFAULT '{}'`).then(function() {
  console.log('[pr-s5] product_rollups.test_coverage column ready');
}).catch(function(err) {
  console.error('[pr-s5] test_coverage migration failed:', err.message);
});
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: `[pr-s2-product-rollup] Results: 20 passed, 0 failed`

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
git commit -m "feat(pr-s5): store computed test coverage alongside DoD status and health in the rollup cache"
```

---

## Task 3: Render blended coverage + per-story breakdown (AC1 integration, AC4 render, NFR-Accessibility)

**Files:**
- Modify: `src/web-ui/routes/products.js` (`_renderProductView`, `handleGetProductView`)
- Modify (append to): `tests/check-pr-s2-products-route.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-pr-s2-products-route.js`, inside the same async IIFE, immediately before the final `console.log('\n[pr-s2-pr-s3-products-route] Results...` line — and also update the THREE existing mock `query` functions in this file that match `/SELECT dod_status_counts, health_counts, synced_at FROM product_rollups/i` to also match a `test_coverage` column (see Step 3 note below on why this update is required):

```javascript

  console.log('\n[pr-s5] AC1/AC3/AC4 -- blended test coverage and per-story breakdown render on the product view');

  await (async function() {
    try {
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/routes/products.js'))];
      var productsRouteFresh = require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));

      var syncedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      var testCoverageJson = JSON.stringify({
        blendedPercentage: 91.7, noData: false, totalPassing: 11, totalTests: 12,
        perFeature: [{ slug: 's1', passing: 9, totalTests: 10, percentage: 90 }, { slug: 's2', passing: 2, totalTests: 2, percentage: 100 }]
      });
      var mockPool = {
        query: async function(sql) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          if (/SELECT dod_status_counts, health_counts, test_coverage, synced_at FROM product_rollups/i.test(sql)) {
            return { rows: [{ dod_status_counts: '{"complete":1}', health_counts: '{"green":1,"amber":0,"red":0,"unknown":0}', test_coverage: testCoverageJson, synced_at: syncedAt }] };
          }
          return { rows: [] };
        }
      };
      var html = null;
      var req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var res = { writeHead: function() {}, end: function(body) { html = body; } };
      await productsRouteFresh.handleGetProductView(req, res, null, mockPool);

      if (!/91\.7%/.test(html)) throw new Error('Expected the blended percentage 91.7% to appear in the rendered page');
      passed++; console.log('  [PASS] _renderProductView: renders the blended test-coverage percentage (AC1)');

      if (!/\bs1\b/.test(html) || !/\bs2\b/.test(html)) throw new Error('Expected per-story breakdown entries (s1, s2) to appear in the rendered page');
      passed++; console.log('  [PASS] _renderProductView: renders per-story test-coverage detail alongside the blended number (AC3)');

      // No-data state (AC4)
      var noDataJson = JSON.stringify({ blendedPercentage: null, noData: true, totalPassing: 0, totalTests: 0, perFeature: [] });
      var mockPoolNoData = {
        query: async function(sql) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          if (/SELECT dod_status_counts, health_counts, test_coverage, synced_at FROM product_rollups/i.test(sql)) {
            return { rows: [{ dod_status_counts: '{}', health_counts: '{}', test_coverage: noDataJson, synced_at: syncedAt }] };
          }
          return { rows: [] };
        }
      };
      var htmlNoData = null;
      var reqNoData = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var resNoData = { writeHead: function() {}, end: function(body) { htmlNoData = body; } };
      await productsRouteFresh.handleGetProductView(reqNoData, resNoData, null, mockPoolNoData);
      if (!/No test data yet/i.test(htmlNoData)) throw new Error('Expected the explicit "No test data yet" state, not 0% or NaN');
      passed++; console.log('  [PASS] _renderProductView: shows explicit "No test data yet" state, not 0%/NaN (AC4)');
    } catch (err) {
      failed++; console.log('  [FAIL] test-coverage rendering --', err.message);
    }
  })();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-products-route.js
```

Expected: fails (current `_renderProductView` doesn't render test coverage at all, and the existing `rollupRow` query doesn't select `test_coverage`).

- [ ] **Step 3: Write the implementation**

**First**, in `src/web-ui/routes/products.js`, find `handleGetProductView`'s existing `rollupRow` query (currently `SELECT dod_status_counts, health_counts, synced_at FROM product_rollups WHERE product_id = $1`) and change it to also select `test_coverage`:

```javascript
  var rollupRow = (await _pool.query(
    'SELECT dod_status_counts, health_counts, test_coverage, synced_at FROM product_rollups WHERE product_id = $1',
    [productId]
  )).rows[0] || null;
```

**This changes the real SQL query string**, which means the THREE existing mock `query` functions already in `tests/check-pr-s2-products-route.js` (from pr-s3's Task 3/4 and pr-s4's Task 3) that match the old two-column regex will no longer match the real query and will fall through to their `return { rows: [] }` default — silently breaking those earlier tests. Update each of those three mocks' regex from `/SELECT dod_status_counts, health_counts, synced_at FROM product_rollups/i` to `/SELECT dod_status_counts, health_counts, test_coverage, synced_at FROM product_rollups/i`, and add a `test_coverage: '{}'` (or an appropriate coverage fixture) key to each of those mocks' returned row objects so they keep matching the real, updated query. This is the same kind of necessary mock-sync fix pr-s4's Task 3 already made for the `health_counts` column addition — not a weakening of any assertion, just keeping the mocks aligned with the real query text.

**Second**, in `_renderProductView`, add new local variables near the top of the function (after the existing `healthHtml` block, before `var body = ...`):

```javascript
  var testCoverage = (rollupRow && rollupRow.test_coverage) ? JSON.parse(rollupRow.test_coverage) : null;
  var coverageHtml;
  if (!testCoverage || testCoverage.noData) {
    coverageHtml = '<div style="margin-top:12px;font-size:13px;color:var(--muted)">No test data yet</div>';
  } else {
    var perFeatureHtml = testCoverage.perFeature.map(function(f) {
      return '<li style="font-size:12px;color:var(--muted)">' + _escapeHtml(f.slug) + ': ' + _escapeHtml(String(f.percentage)) + '%</li>';
    }).join('');
    coverageHtml =
      '<div style="margin-top:12px;font-size:13px">' +
        '<div>Test coverage: <strong>' + _escapeHtml(String(testCoverage.blendedPercentage)) + '%</strong></div>' +
        '<ul style="margin:6px 0 0;padding-left:18px">' + perFeatureHtml + '</ul>' +
      '</div>';
  }
```

Update the `body` concatenation to include `coverageHtml` immediately after the existing `healthHtml +` line:

```javascript
    freshnessHtml +
    healthHtml +
    coverageHtml +
    featuresHtml +
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-products-route.js
```

Expected output: `[pr-s2-pr-s3-pr-s4-pr-s5-products-route] Results: 17 passed, 0 failed` (14 existing + 3 new)

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
git commit -m "feat(pr-s5): render blended test coverage and per-story breakdown on the product view"
```

---

## Final check before handoff

- [ ] All 4 story ACs covered: AC1 (Task 1, Task 3), AC2 (Task 1), AC3 (Task 1, Task 3), AC4 (Task 1, Task 3)
- [ ] Total new/appended tests: 4 (aggregation, Task 1) + 1 (storage, Task 2) + 3 (rendering, Task 3) = 8
- [ ] `npm test` full suite run after all 3 tasks — compare failed-file count against this branch's own baseline (captured at `/branch-setup`) — must be unchanged or lower, never higher
- [ ] Since this branch is based on `feature/pr-s2` (which now also contains pr-s3's and pr-s4's commits), note in the PR description that this PR should not be merged before PR #490 merges to master
