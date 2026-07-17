# Render aggregate health on the product rollup view — Implementation Plan

> **For agent execution:** Use /subagent-execution (Haiku model per operator instruction).

**Goal:** Make every test in `artefacts/2026-07-16-product-rollup/test-plans/pr-s4-test-plan.md` pass. Do not add scope beyond what the ACs and tests specify.
**Branch:** `feature/pr-s4` (based on `feature/pr-s2`, which now also contains pr-s3's merged commits — pr-s2/pr-s3 are this story's unmerged upstream dependency)
**Worktree:** `.worktrees/pr-s4`
**Test command:** `node <file>` (plain Node scripts using the built-in `assert` module)

---

## File map

```
Modify:
  src/web-ui/modules/product-rollup.js       — add computeHealthCounts(), computeOverallHealthSignal()
  tests/check-pr-s2-product-rollup.js        — append AC1-AC4 unit tests (co-located with pr-s2's existing rollup tests since it's the same module)
  src/web-ui/server.js                       — ALTER TABLE product_rollups ADD COLUMN health_counts
  src/web-ui/routes/products.js              — render health counts + overall signal in _renderProductView
  tests/check-pr-s2-products-route.js        — append AC1 integration + NFR-a11y tests
```

---

## Task 1: Health-count aggregation and overall-signal derivation (AC1, AC2, AC3, AC4)

**Files:**
- Modify: `src/web-ui/modules/product-rollup.js`
- Modify (append to): `tests/check-pr-s2-product-rollup.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-pr-s2-product-rollup.js`, inserting these `queue.push(...)` blocks immediately before the line `for (var i = 0; i < queue.length; i++) {`:

```javascript
  // T7: computeHealthCounts counts features across all four health statuses (AC1)
  queue.push(function() {
    console.log('\n[pr-s4] T7 -- computeHealthCounts counts features across all four health statuses (AC1)');
    return test('computeHealthCounts: counts 3 green, 2 amber, 1 red, 1 unknown correctly', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          { slug: 'f1', health: 'green' }, { slug: 'f2', health: 'green' }, { slug: 'f3', health: 'green' },
          { slug: 'f4', health: 'amber' }, { slug: 'f5', health: 'amber' },
          { slug: 'f6', health: 'red' },
          { slug: 'f7', health: 'unknown' }
        ]
      };
      var counts = mod.computeHealthCounts(pipelineState);
      assert.deepStrictEqual(counts, { green: 3, amber: 2, red: 1, unknown: 1 });
    });
  });

  // T8: a feature with no health field at all counts as unknown, not a thrown error
  queue.push(function() {
    console.log('\n[pr-s4] T8 -- a feature with a missing health field counts as unknown (AC1 robustness)');
    return test('computeHealthCounts: a feature object with no health property is counted as unknown', function() {
      var mod = freshRequire();
      var counts = mod.computeHealthCounts({ features: [{ slug: 'f1' }] });
      assert.strictEqual(counts.unknown, 1);
    });
  });

  // T9: one red among many green/amber yields overall red (AC2)
  queue.push(function() {
    console.log('\n[pr-s4] T9 -- one red feature among many green/amber yields an overall red signal (AC2)');
    return test('computeOverallHealthSignal: 10 green, 5 amber, 1 red -> red', function() {
      var mod = freshRequire();
      var signal = mod.computeOverallHealthSignal({ green: 10, amber: 5, red: 1, unknown: 0 });
      assert.strictEqual(signal, 'red');
    });
  });

  // T10: a single red feature with zero others still yields red (AC2 boundary)
  queue.push(function() {
    console.log('\n[pr-s4] T10 -- a single red feature with zero other features still yields red (AC2 boundary)');
    return test('computeOverallHealthSignal: 0 green, 0 amber, 1 red -> red', function() {
      var mod = freshRequire();
      var signal = mod.computeOverallHealthSignal({ green: 0, amber: 0, red: 1, unknown: 0 });
      assert.strictEqual(signal, 'red');
    });
  });

  // T11: no red, at least one amber yields overall amber (AC3)
  queue.push(function() {
    console.log('\n[pr-s4] T11 -- no red features, at least one amber, yields an overall amber signal (AC3)');
    return test('computeOverallHealthSignal: 5 green, 2 amber, 0 red -> amber', function() {
      var mod = freshRequire();
      var signal = mod.computeOverallHealthSignal({ green: 5, amber: 2, red: 0, unknown: 0 });
      assert.strictEqual(signal, 'amber');
    });
  });

  // T12: all-green yields overall green (AC4)
  queue.push(function() {
    console.log('\n[pr-s4] T12 -- all-green features yield an overall green signal (AC4)');
    return test('computeOverallHealthSignal: 8 green, 0 amber/red/unknown -> green', function() {
      var mod = freshRequire();
      var signal = mod.computeOverallHealthSignal({ green: 8, amber: 0, red: 0, unknown: 0 });
      assert.strictEqual(signal, 'green');
    });
  });

  // T13: zero features yields overall green, not an error or undefined (AC4 boundary)
  queue.push(function() {
    console.log('\n[pr-s4] T13 -- zero features yields an overall green signal, not an error or undefined (AC4 boundary)');
    return test('computeOverallHealthSignal: all-zero counts -> green (does not throw or return undefined)', function() {
      var mod = freshRequire();
      var signal = mod.computeOverallHealthSignal({ green: 0, amber: 0, red: 0, unknown: 0 });
      assert.strictEqual(signal, 'green');
    });
    return test('computeOverallHealthSignal: empty object input -> green (does not throw)', function() {
      var mod = freshRequire();
      var signal = mod.computeOverallHealthSignal({});
      assert.strictEqual(signal, 'green');
    });
  });

```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected: `TypeError: mod.computeHealthCounts is not a function`

- [ ] **Step 3: Write the implementation**

Add to `src/web-ui/modules/product-rollup.js` (after `computeDodStatusRollup`, before `syncProductRollup`):

```javascript

/**
 * Counts features by their top-level health status (green/amber/red), using
 * "unknown" for any feature with no health field or an unrecognised value.
 * Reuses the same status vocabulary and precedence convention already
 * established in .github/scripts/viz-functions.js's fleetHealthLabel/
 * featureActionMeta, even though this counting logic is new application
 * code (that file lives in the legacy/unused dashboard's support module,
 * not something this application code imports from) (AC1).
 *
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @returns {{green: number, amber: number, red: number, unknown: number}}
 */
function computeHealthCounts(pipelineState) {
  var counts = { green: 0, amber: 0, red: 0, unknown: 0 };
  var features = (pipelineState && pipelineState.features) || [];

  features.forEach(function(feature) {
    var health = feature.health;
    if (health !== 'green' && health !== 'amber' && health !== 'red') {
      health = 'unknown';
    }
    counts[health]++;
  });

  return counts;
}

/**
 * Derives a single overall product-health signal from per-status counts,
 * using the same red-takes-precedence rule already applied per-feature
 * elsewhere in this codebase (viz-functions.js's featureActionMeta): any
 * red feature makes the overall signal red regardless of how many
 * green/amber features also exist (AC2). With no red, any amber makes it
 * amber (AC3). All-green, or zero features entirely, yields green (AC4) --
 * this function never throws and never returns undefined/null.
 *
 * @param {{green?: number, amber?: number, red?: number, unknown?: number}} counts
 * @returns {'green'|'amber'|'red'}
 */
function computeOverallHealthSignal(counts) {
  var safe = counts || {};
  if ((safe.red || 0) > 0) return 'red';
  if ((safe.amber || 0) > 0) return 'amber';
  return 'green';
}
```

Update `module.exports` at the bottom of the file to:

```javascript
module.exports = {
  computeDodStatusRollup,
  computeHealthCounts,
  computeOverallHealthSignal,
  syncProductRollup,
  triggerProductSync,
  isSyncInProgress
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: `[pr-s2-product-rollup] Results: 14 passed, 0 failed` (6 existing from pr-s2/pr-s3 + 8 new from this task — note T13 registers two `test()` calls)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/product-rollup.js tests/check-pr-s2-product-rollup.js
git commit -m "feat(pr-s4): add health-count aggregation and overall-signal derivation"
```

---

## Task 2: Store health counts in the cache table (AC1 storage)

**Files:**
- Modify: `src/web-ui/modules/product-rollup.js` (`syncProductRollup`)
- Modify: `src/web-ui/server.js` (add `health_counts` column)
- Modify (append to): `tests/check-pr-s2-product-rollup.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-pr-s2-product-rollup.js`, inside the same insertion point as Task 1 (immediately before the `for` loop), after Task 1's blocks:

```javascript
  // T14: syncProductRollup also computes and writes health_counts alongside dod_status_counts (AC1 storage)
  queue.push(function() {
    console.log('\n[pr-s4] T14 -- syncProductRollup writes health_counts alongside dod_status_counts (AC1 storage)');
    return test('syncProductRollup: the cache write includes both dod_status_counts and health_counts', async function() {
      var mod = freshRequire();
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
      var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
      var fixture = { features: [{ slug: 'f1', health: 'red', stories: [{ dodStatus: 'complete' }] }] };
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

      assert.ok(/health_counts/i.test(capturedSql), 'Expected the INSERT statement to include the health_counts column');
      var healthJson = capturedParams.find(function(p) { return typeof p === 'string' && p.indexOf('"red"') !== -1; });
      assert.ok(healthJson, 'Expected one of the written params to be the health_counts JSON containing the red count');
    });
  });

```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected: fails the `health_counts` regex assertion (current INSERT statement only has `dod_status_counts`).

- [ ] **Step 3: Write the implementation**

In `src/web-ui/modules/product-rollup.js`, modify `syncProductRollup` (replace its body) to:

```javascript
async function syncProductRollup(pool, adapterModule, opts) {
  var raw = await adapterModule.getPipelineStateFetchAdapter()(opts.repoOwner, opts.repoName, opts.accessToken);
  var decoded = Buffer.from(raw.content, 'base64').toString('utf8');
  var pipelineState = JSON.parse(decoded);
  var rollup = computeDodStatusRollup(pipelineState);
  var healthCounts = computeHealthCounts(pipelineState);

  await pool.query(
    `INSERT INTO product_rollups (product_id, dod_status_counts, health_counts, synced_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (product_id) DO UPDATE SET dod_status_counts = $2, health_counts = $3, synced_at = NOW()`,
    [opts.productId, JSON.stringify(rollup), JSON.stringify(healthCounts)]
  );

  return rollup;
}
```

In `src/web-ui/server.js`, find the existing `product_rollups` table creation block (search for `CREATE TABLE IF NOT EXISTS product_rollups`) and add an idempotent column migration immediately after that `.catch(...)` block closes, following the same `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` convention already used elsewhere in this file for the `products` table's context columns:

```javascript

// pr-s4: add the health-count rollup column. Idempotent — safe to run on
// every server start, matching the products-table context-column migration
// pattern already used elsewhere in this file.
_creditsPool.query(`ALTER TABLE product_rollups ADD COLUMN IF NOT EXISTS health_counts JSONB NOT NULL DEFAULT '{}'`).then(function() {
  console.log('[pr-s4] product_rollups.health_counts column ready');
}).catch(function(err) {
  console.error('[pr-s4] health_counts migration failed:', err.message);
});
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: `[pr-s2-product-rollup] Results: 15 passed, 0 failed`

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
git commit -m "feat(pr-s4): store computed health counts alongside DoD status in the rollup cache"
```

---

## Task 3: Render health counts + overall signal on the product view (AC1 integration, NFR-Accessibility)

**Files:**
- Modify: `src/web-ui/routes/products.js` (`_renderProductView`)
- Modify (append to): `tests/check-pr-s2-products-route.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-pr-s2-products-route.js`, inside the same async IIFE, immediately before the final `console.log('\n[pr-s2-pr-s3-products-route] Results...` line:

```javascript

  console.log('\n[pr-s4] AC1 -- health counts and overall signal render on the product view, with text labels (not colour alone)');

  await (async function() {
    try {
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/routes/products.js'))];
      var productsRouteFresh = require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));

      var syncedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      var healthCountsJson = JSON.stringify({ green: 3, amber: 2, red: 1, unknown: 1 });
      var mockPool = {
        query: async function(sql) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          if (/SELECT dod_status_counts, health_counts, synced_at FROM product_rollups/i.test(sql)) {
            return { rows: [{ dod_status_counts: '{"complete":1}', health_counts: healthCountsJson, synced_at: syncedAt }] };
          }
          return { rows: [] };
        }
      };
      var html = null;
      var req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var res = { writeHead: function() {}, end: function(body) { html = body; } };
      await productsRouteFresh.handleGetProductView(req, res, null, mockPool);

      if (!/✓ Healthy/.test(html) || !/⚠ Warning/.test(html) || !/✕ Blocked/.test(html) || !/\? Unknown/.test(html)) {
        throw new Error('Expected all four health labels (✓ Healthy / ⚠ Warning / ✕ Blocked / ? Unknown) in the rendered page');
      }
      passed++; console.log('  [PASS] _renderProductView: renders all four health-status labels using the existing label convention (AC1)');

      if (!/\b3\b/.test(html) || !/\b2\b/.test(html) || !/\b1\b/.test(html)) {
        throw new Error('Expected the numeric counts (3, 2, 1) to appear in the rendered page');
      }
      passed++; console.log('  [PASS] _renderProductView: renders the numeric per-status counts (AC1)');

      // Overall signal: 1 red present -> overall must show as Blocked/red (AC2), and the
      // label must accompany any colour so it is not colour-only (NFR-Accessibility)
      if (!/overall/i.test(html)) {
        throw new Error('Expected an overall product-health signal section in the rendered page');
      }
      passed++; console.log('  [PASS] _renderProductView: renders an overall product-health signal section (AC2/AC3/AC4 integration)');
    } catch (err) {
      failed++; console.log('  [FAIL] health rollup rendering --', err.message);
    }
  })();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-products-route.js
```

Expected: fails (current `_renderProductView` doesn't render health counts or an overall signal at all yet, and the current `rollupRow` query doesn't select `health_counts`).

- [ ] **Step 3: Write the implementation**

In `src/web-ui/routes/products.js`, find `handleGetProductView`'s existing `rollupRow` query (currently `SELECT dod_status_counts, synced_at FROM product_rollups WHERE product_id = $1`) and change it to also select the new column:

```javascript
  var rollupRow = (await _pool.query(
    'SELECT dod_status_counts, health_counts, synced_at FROM product_rollups WHERE product_id = $1',
    [productId]
  )).rows[0] || null;
```

In `_renderProductView`, add a small local helper near the top of the function (before `var syncedAtLabel = ...`):

```javascript
  var HEALTH_LABELS = { green: '✓ Healthy', amber: '⚠ Warning', red: '✕ Blocked', unknown: '? Unknown' };
  var HEALTH_COLORS = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444', unknown: 'var(--muted)' };
  var healthCounts = (rollupRow && rollupRow.health_counts) ? JSON.parse(rollupRow.health_counts) : null;
  var overallSignal = healthCounts ? _productRollup.computeOverallHealthSignal(healthCounts) : null;
  var healthHtml = healthCounts
    ? '<div style="margin-top:12px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;font-size:13px">' +
        '<span style="font-weight:600;color:' + HEALTH_COLORS[overallSignal] + '">Overall: ' + _escapeHtml(HEALTH_LABELS[overallSignal]) + '</span>' +
        ['green', 'amber', 'red', 'unknown'].map(function(status) {
          return '<span style="color:' + HEALTH_COLORS[status] + '">' + _escapeHtml(HEALTH_LABELS[status]) + ': ' + _escapeHtml(String(healthCounts[status] || 0)) + '</span>';
        }).join('') +
      '</div>'
    : '';
```

Add `_productRollup.computeOverallHealthSignal` is already available since `_productRollup` is required at the top of the file (from pr-s3's Task 3) — no new require needed.

Update the `body` concatenation to include `healthHtml` immediately after `freshnessHtml +`:

```javascript
    freshnessHtml +
    healthHtml +
    featuresHtml +
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-products-route.js
```

Expected output: `[pr-s2-pr-s3-pr-s4-products-route] Results: 14 passed, 0 failed` (11 existing from pr-s2/pr-s3 + 3 new)

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
git commit -m "feat(pr-s4): render aggregate health counts and overall signal on the product view"
```

---

## Final check before handoff

- [ ] All 4 story ACs covered: AC1 (Task 1, Task 3), AC2 (Task 1), AC3 (Task 1), AC4 (Task 1)
- [ ] Total new/appended tests: 9 (health aggregation, Task 1 — note T13 registers 2) + 1 (storage, Task 2) + 3 (rendering, Task 3) = 13
- [ ] `npm test` full suite run after all 3 tasks — compare failed-file count against this branch's own baseline (captured at `/branch-setup`) — must be unchanged or lower, never higher
- [ ] Since this branch is based on `feature/pr-s2` (which now also contains pr-s3's commits), note in the PR description that this PR should not be merged before pr-s2/pr-s3's combined branch (PR #490) merges to master
