# Render aggregate AC coverage on the product rollup view — Implementation Plan

> **For agent execution:** Use /subagent-execution (Haiku model per operator instruction).

**Goal:** Make every test in `artefacts/2026-07-16-product-rollup/test-plans/pr-s6-test-plan.md` pass. Do not add scope beyond what the ACs and tests specify.
**Branch:** `feature/pr-s6` (based on `feature/pr-s2`, which now also contains pr-s3's and pr-s4's merged commits)
**Worktree:** `.worktrees/pr-s6`
**Test command:** `node <file>` (plain Node scripts using the built-in `assert` module)

**Schema note (same granularity clarification as pr-s5):** `acTotal`/`acVerified` are **story-level** fields in this repo's real `.github/pipeline-state.json` (confirmed by this session's own state-advance calls, e.g. `node bin/skills advance <feature> <story-id> acTotal=5 acVerified=5`), not top-level-feature fields. This plan's aggregation walks stories (same epics-vs-flat-stories pattern as `computeDodStatusRollup` and pr-s5's `computeTestCoverageRollup`), mirroring pr-s5's own resolution of the identical ambiguity for `testPlan`.

---

## File map

```
Modify:
  src/web-ui/modules/product-rollup.js       — add computeAcCoverageRollup() (mirrors computeTestCoverageRollup)
  tests/check-pr-s2-product-rollup.js        — append AC1-AC4 unit tests
  src/web-ui/server.js                       — ALTER TABLE product_rollups ADD COLUMN ac_coverage
  src/web-ui/routes/products.js              — render blended AC-coverage %, clearly labelled apart from test coverage
  tests/check-pr-s2-products-route.js        — append AC1/AC3 integration + AC4 render tests
```

---

## Task 1: AC-coverage aggregation (AC1, AC2, AC4)

**Files:**
- Modify: `src/web-ui/modules/product-rollup.js`
- Modify (append to): `tests/check-pr-s2-product-rollup.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-pr-s2-product-rollup.js`, inserting these `queue.push(...)` blocks immediately before the line `for (var i = 0; i < queue.length; i++) {`:

```javascript
  // T20: blended AC coverage is sum-of-verified/sum-of-total, not an average of percentages (AC1)
  queue.push(function() {
    console.log('\n[pr-s6] T20 -- blended AC coverage is sum-of-verified/sum-of-total, not an average of percentages (AC1)');
    return test('computeAcCoverageRollup: 12/10 + 4/4 stories -> 87.5% blended (not 91.7% naive average)', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          { slug: 'f1', stories: [{ slug: 's1', acTotal: 12, acVerified: 10 }] },
          { slug: 'f2', stories: [{ slug: 's2', acTotal: 4, acVerified: 4 }] }
        ]
      };
      var result = mod.computeAcCoverageRollup(pipelineState);
      assert.strictEqual(result.blendedPercentage, 87.5, 'Expected 87.5 (14/16 blended), got ' + result.blendedPercentage);
    });
  });

  // T21: stories with no acTotal/acVerified are excluded from numerator and denominator (AC2)
  queue.push(function() {
    console.log('\n[pr-s6] T21 -- stories with no acTotal/acVerified are excluded from the aggregate, not counted as 0% (AC2)');
    return test('computeAcCoverageRollup: a story with no acTotal/acVerified contributes nothing to numerator or denominator', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          { slug: 'f1', stories: [{ slug: 's1', acTotal: 12, acVerified: 9 }] },
          { slug: 'f2', stories: [{ slug: 's2' }] } // no acTotal/acVerified -- pre-DoR story
        ]
      };
      var result = mod.computeAcCoverageRollup(pipelineState);
      assert.strictEqual(result.blendedPercentage, 75, 'Expected 75% (9/12), story with no AC data must contribute nothing, got ' + result.blendedPercentage);
    });
  });

  // T22: zero stories with AC data returns an explicit no-data marker, not 0% or NaN (AC4)
  queue.push(function() {
    console.log('\n[pr-s6] T22 -- zero stories with AC data returns an explicit no-data marker, not 0% or NaN (AC4)');
    return test('computeAcCoverageRollup: no acTotal/acVerified data anywhere returns blendedPercentage null and noData true', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          { slug: 'f1', stories: [{ slug: 's1' }] },
          { slug: 'f2', stories: [{ slug: 's2' }] }
        ]
      };
      var result = mod.computeAcCoverageRollup(pipelineState);
      assert.strictEqual(result.blendedPercentage, null, 'Expected null (not 0 or NaN) when no story has AC data');
      assert.strictEqual(result.noData, true, 'Expected an explicit noData: true marker');
    });
  });

```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected: `TypeError: mod.computeAcCoverageRollup is not a function`

- [ ] **Step 3: Write the implementation**

Add to `src/web-ui/modules/product-rollup.js` (after `computeTestCoverageRollup`, before `syncProductRollup`):

```javascript

/**
 * Aggregates AC (acceptance-criteria) coverage across every story in every
 * feature, using the identical blended (sum-of-verified/sum-of-total, not
 * average-of-percentages) method as computeTestCoverageRollup, applied to
 * story.acTotal/story.acVerified instead of story.testPlan (AC1). A story
 * with no acTotal/acVerified fields at all (e.g. not yet past
 * /definition-of-ready) is excluded from both the numerator and
 * denominator (AC2). If no story anywhere has any AC data,
 * blendedPercentage is null and noData is true (AC4).
 *
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @returns {{blendedPercentage: number|null, noData: boolean, totalVerified: number, totalAc: number, perFeature: Array<{slug: string, verified: number, total: number, percentage: number}>}}
 */
function computeAcCoverageRollup(pipelineState) {
  var features = (pipelineState && pipelineState.features) || [];
  var totalVerified = 0;
  var totalAc = 0;
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
      if (typeof story.acTotal !== 'number' || story.acTotal <= 0) {
        return;
      }
      var verified = story.acVerified || 0;
      var total = story.acTotal;
      totalVerified += verified;
      totalAc += total;
      perFeature.push({
        slug: story.slug,
        verified: verified,
        total: total,
        percentage: Math.round((verified / total) * 1000) / 10
      });
    });
  });

  if (totalAc === 0) {
    return { blendedPercentage: null, noData: true, totalVerified: 0, totalAc: 0, perFeature: [] };
  }

  return {
    blendedPercentage: Math.round((totalVerified / totalAc) * 1000) / 10,
    noData: false,
    totalVerified: totalVerified,
    totalAc: totalAc,
    perFeature: perFeature
  };
}
```

Update `module.exports` at the bottom of the file to include `computeAcCoverageRollup`:

```javascript
module.exports = {
  computeDodStatusRollup,
  computeHealthCounts,
  computeOverallHealthSignal,
  computeTestCoverageRollup,
  computeAcCoverageRollup,
  syncProductRollup,
  triggerProductSync,
  isSyncInProgress
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: `[pr-s2-product-rollup] Results: 23 passed, 0 failed` (20 existing + 3 new)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/product-rollup.js tests/check-pr-s2-product-rollup.js
git commit -m "feat(pr-s6): add blended AC-coverage aggregation excluding no-data stories"
```

---

## Task 2: Store AC coverage in the cache table (AC1 storage)

**Files:**
- Modify: `src/web-ui/modules/product-rollup.js` (`syncProductRollup`)
- Modify: `src/web-ui/server.js` (add `ac_coverage` column)
- Modify (append to): `tests/check-pr-s2-product-rollup.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-pr-s2-product-rollup.js`, inside the same insertion point (immediately before the `for` loop), after Task 1's blocks:

```javascript
  // T23: syncProductRollup also computes and writes ac_coverage alongside the other rollup columns (AC1 storage)
  queue.push(function() {
    console.log('\n[pr-s6] T23 -- syncProductRollup writes ac_coverage alongside dod_status_counts, health_counts, and test_coverage (AC1 storage)');
    return test('syncProductRollup: the cache write includes ac_coverage', async function() {
      var mod = freshRequire();
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
      var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
      var fixture = { features: [{ slug: 'f1', stories: [{ slug: 's1', acTotal: 12, acVerified: 10 }] }] };
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

      assert.ok(/ac_coverage/i.test(capturedSql), 'Expected the INSERT statement to include the ac_coverage column');
      var acJson = capturedParams.find(function(p) { return typeof p === 'string' && p.indexOf('blendedPercentage') !== -1 && p.indexOf('83.3') !== -1; });
      assert.ok(acJson, 'Expected one of the written params to be the ac_coverage JSON containing the correct blendedPercentage (10/12 = 83.3)');
    });
  });

```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected: fails the `ac_coverage` regex assertion.

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
  var acCoverage = computeAcCoverageRollup(pipelineState);

  await pool.query(
    `INSERT INTO product_rollups (product_id, dod_status_counts, health_counts, test_coverage, ac_coverage, synced_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (product_id) DO UPDATE SET dod_status_counts = $2, health_counts = $3, test_coverage = $4, ac_coverage = $5, synced_at = NOW()`,
    [opts.productId, JSON.stringify(rollup), JSON.stringify(healthCounts), JSON.stringify(testCoverage), JSON.stringify(acCoverage)]
  );

  return rollup;
}
```

In `src/web-ui/server.js`, find the existing `test_coverage` column migration block (search for `ALTER TABLE product_rollups ADD COLUMN IF NOT EXISTS test_coverage`) and add a new migration immediately after its `.catch(...)` closes:

```javascript

// pr-s6: add the blended AC-coverage rollup column. Idempotent, same
// pattern as the health_counts/test_coverage migrations above.
_creditsPool.query(`ALTER TABLE product_rollups ADD COLUMN IF NOT EXISTS ac_coverage JSONB NOT NULL DEFAULT '{}'`).then(function() {
  console.log('[pr-s6] product_rollups.ac_coverage column ready');
}).catch(function(err) {
  console.error('[pr-s6] ac_coverage migration failed:', err.message);
});
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: `[pr-s2-product-rollup] Results: 24 passed, 0 failed`

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
git commit -m "feat(pr-s6): store computed AC coverage alongside the other rollup dimensions in the cache"
```

---

## Task 3: Render AC coverage, clearly labelled apart from test coverage (AC1 integration, AC3, AC4 render, NFR-Accessibility)

**Files:**
- Modify: `src/web-ui/routes/products.js` (`_renderProductView`, `handleGetProductView`)
- Modify (append to): `tests/check-pr-s2-products-route.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-pr-s2-products-route.js`, inside the same async IIFE, immediately before the final `console.log('\n[pr-s2-pr-s3-products-route] Results...` line — and update the mock `query` functions in this file that currently match `/SELECT dod_status_counts, health_counts, test_coverage, synced_at FROM product_rollups/i` (added by pr-s5's Task 3) to also select `ac_coverage`, per the same necessary-mock-sync pattern used by every prior story's Task 3 (see Step 3 note below):

```javascript

  console.log('\n[pr-s6] AC1/AC3/AC4 -- blended AC coverage renders on the product view, clearly labelled apart from test coverage');

  await (async function() {
    try {
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/routes/products.js'))];
      var productsRouteFresh = require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));

      var syncedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      var testCoverageJson = JSON.stringify({ blendedPercentage: 87, noData: false, perFeature: [] });
      var acCoverageJson = JSON.stringify({ blendedPercentage: 75, noData: false, perFeature: [] });
      var mockPool = {
        query: async function(sql) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          if (/SELECT dod_status_counts, health_counts, test_coverage, ac_coverage, synced_at FROM product_rollups/i.test(sql)) {
            return { rows: [{ dod_status_counts: '{}', health_counts: '{}', test_coverage: testCoverageJson, ac_coverage: acCoverageJson, synced_at: syncedAt }] };
          }
          return { rows: [] };
        }
      };
      var html = null;
      var req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var res = { writeHead: function() {}, end: function(body) { html = body; } };
      await productsRouteFresh.handleGetProductView(req, res, null, mockPool);

      if (!/Test coverage[^0-9]*87%/.test(html)) throw new Error('Expected a clearly-labelled "Test coverage: 87%" in the rendered page');
      if (!/AC coverage[^0-9]*75%/.test(html)) throw new Error('Expected a clearly-labelled "AC coverage: 75%" in the rendered page');
      passed++; console.log('  [PASS] _renderProductView: renders both test-coverage and AC-coverage percentages under distinct, unambiguous labels (AC1, AC3)');

      // No-AC-data state (AC4)
      var noAcDataJson = JSON.stringify({ blendedPercentage: null, noData: true, perFeature: [] });
      var mockPoolNoAcData = {
        query: async function(sql) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          if (/SELECT dod_status_counts, health_counts, test_coverage, ac_coverage, synced_at FROM product_rollups/i.test(sql)) {
            return { rows: [{ dod_status_counts: '{}', health_counts: '{}', test_coverage: testCoverageJson, ac_coverage: noAcDataJson, synced_at: syncedAt }] };
          }
          return { rows: [] };
        }
      };
      var htmlNoAcData = null;
      var reqNoAcData = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var resNoAcData = { writeHead: function() {}, end: function(body) { htmlNoAcData = body; } };
      await productsRouteFresh.handleGetProductView(reqNoAcData, resNoAcData, null, mockPoolNoAcData);
      if (!/No AC data yet/i.test(htmlNoAcData)) throw new Error('Expected the explicit "No AC data yet" state, not 0% or NaN');
      passed++; console.log('  [PASS] _renderProductView: shows explicit "No AC data yet" state, not 0%/NaN (AC4)');
    } catch (err) {
      failed++; console.log('  [FAIL] AC-coverage rendering --', err.message);
    }
  })();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-products-route.js
```

Expected: fails (current `_renderProductView` doesn't render AC coverage at all, and the current `rollupRow` query doesn't select `ac_coverage`).

- [ ] **Step 3: Write the implementation**

**First**, in `src/web-ui/routes/products.js`, find `handleGetProductView`'s existing `rollupRow` query (currently selects `dod_status_counts, health_counts, test_coverage, synced_at`) and change it to also select `ac_coverage`:

```javascript
  var rollupRow = (await _pool.query(
    'SELECT dod_status_counts, health_counts, test_coverage, ac_coverage, synced_at FROM product_rollups WHERE product_id = $1',
    [productId]
  )).rows[0] || null;
```

**This changes the real SQL query string again.** Update every existing mock `query` function in `tests/check-pr-s2-products-route.js` that matches the old four-column regex (`/SELECT dod_status_counts, health_counts, test_coverage, synced_at FROM product_rollups/i`, added by pr-s5's Task 3) to the new five-column pattern (`/SELECT dod_status_counts, health_counts, test_coverage, ac_coverage, synced_at FROM product_rollups/i`), adding an `ac_coverage: '{}'` key to each mock's returned row object. This is the same necessary mock-sync fix every prior story's Task 3 has made for its own new column — not a weakening of any assertion.

**Second**, in `_renderProductView`, relabel the existing coverage rendering to clearly distinguish test coverage from AC coverage (AC3), and add the AC-coverage block. Locate the `coverageHtml` block added by pr-s5 (which currently renders under the implicit label "Test coverage:") and change its label text to be explicit, then add a new `acCoverageHtml` block immediately after it:

```javascript
  var testCoverage = (rollupRow && rollupRow.test_coverage) ? JSON.parse(rollupRow.test_coverage) : null;
  var coverageHtml;
  if (!testCoverage || testCoverage.noData) {
    coverageHtml = '<div style="margin-top:12px;font-size:13px;color:var(--muted)">Test coverage: No test data yet</div>';
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

  var acCoverage = (rollupRow && rollupRow.ac_coverage) ? JSON.parse(rollupRow.ac_coverage) : null;
  var acCoverageHtml;
  if (!acCoverage || acCoverage.noData) {
    acCoverageHtml = '<div style="margin-top:8px;font-size:13px;color:var(--muted)">AC coverage: No AC data yet</div>';
  } else {
    acCoverageHtml = '<div style="margin-top:8px;font-size:13px">AC coverage: <strong>' + _escapeHtml(String(acCoverage.blendedPercentage)) + '%</strong></div>';
  }
```

Note: `coverageHtml`'s implementation body is being restated here (not newly introduced) purely to show the small label-text change ("Test coverage: No test data yet" instead of the bare "No test data yet" pr-s5 originally wrote) that makes AC3's label-distinction requirement unambiguous — do not otherwise alter its logic.

Update the `body` concatenation to include `acCoverageHtml` immediately after the existing `coverageHtml +` line:

```javascript
    freshnessHtml +
    healthHtml +
    coverageHtml +
    acCoverageHtml +
    featuresHtml +
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-products-route.js
```

Expected output: `[pr-s2-pr-s3-pr-s4-pr-s5-pr-s6-products-route] Results: 19 passed, 0 failed` (17 existing + 2 new)

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
git commit -m "feat(pr-s6): render blended AC coverage, clearly labelled apart from test coverage"
```

---

## Final check before handoff

- [ ] All 4 story ACs covered: AC1 (Task 1, Task 3), AC2 (Task 1), AC3 (Task 3), AC4 (Task 1, Task 3)
- [ ] Total new/appended tests: 3 (aggregation, Task 1) + 1 (storage, Task 2) + 2 (rendering, Task 3) = 6
- [ ] `npm test` full suite run after all 3 tasks — compare failed-file count against this branch's own baseline (captured at `/branch-setup`) — must be unchanged or lower, never higher
- [ ] Since this branch is based on `feature/pr-s2` (which now also contains pr-s3's and pr-s4's commits), note in the PR description that this PR should not be merged before PR #490 merges to master
