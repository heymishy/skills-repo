# De-emphasize Unknown Health Visually — Implementation Plan

> **For agent execution:** Executing task-by-task via /tdd in this session (no subagent dispatch — solo session, investigation already complete).

**Goal:** Reduce Unknown health's visual competition with real Healthy/Warning/Blocked signals in the per-item list (AC1, AC2), and fix the top-level "Overall:" line so a product with no real health signal shows an honest Unknown state instead of a misleading green "Healthy" (AC3).
**Branch:** `feature/pdt-s3`
**Worktree:** `.worktrees/pdt-s3`
**Test command:** `node tests/check-pdt-s3-deemphasize-unknown-health.js` (per-task), `npm test` (full suite, final task)

---

## Investigation note (code-confirmed — two real findings, both narrower than the story text alone suggests)

**Finding 1 (AC1/AC2 are largely pre-existing):** Direct code reading of every health-color assignment in `src/web-ui/routes/products.js` (`_renderEpicRow` line 216, `_renderPvcItemRow` line 295, `_renderProductView`'s own `HEALTH_COLORS` const line 721) confirms `unknown` **already** maps to `var(--muted)` everywhere — never a "loud" color, and no `<span>` anywhere in this codebase's health badges carries a `background-color` at all (they are all plain `style="color:X"` text, never a filled pill/badge). AC1's literal text ("quiet grey text without a colored badge background") is already true today. The remaining, genuine visual-competition gap is the `"? Unknown"` label itself: the `?` glyph sits in the exact same position/size/pattern as the real `✓`/`⚠`/`✕` signal glyphs, so even in a muted color it still reads as "a status marker" at a glance. Fix: drop the `?` prefix — render plain `"Unknown"` text, keeping the already-correct `var(--muted)` color unchanged (so the NFR-Accessibility contrast result is unaffected by this task). Confirmed via probing unmodified code with a real fixture (see below) that AC1/AC2's literal color/background assertions already pass; only the glyph-removal is new.

**Finding 2 (AC3 needs a real, narrowly-scoped fix):** `_productRollup.computeOverallHealthSignal(counts)` (`src/web-ui/modules/product-rollup.js` — a file this story's Architecture Constraints do NOT authorize touching) has no `unknown` branch — it returns `'red'` if `counts.red > 0`, `'amber'` if `counts.amber > 0`, and otherwise **always** falls through to `'green'`, even when `green` is itself `0` and every real signal is absent. Confirmed by probing unmodified code: a product where 100% of items are Unknown-health renders `"Overall: ✓ Healthy"` (green) today — misleading, since there is zero real health signal. Separately, when `rollupRow.health_counts` is entirely `null` (no rollup data at all — the exact scenario named in AC3's own parenthetical, and the test plan's own precondition), the whole `healthHtml` block currently renders as an empty string — no Overall line at all, not an Unknown-styled one. Both are the same underlying gap (no way to express "no real signal" in the Overall line) and both are AC3's literal target. Fix: entirely local to `_renderProductView` in `products.js` — override `overallSignal` to `'unknown'` in both cases, and render an Overall line even when `healthCounts` is null. `computeOverallHealthSignal` itself, and `computeHealthCounts`, are both left untouched, honoring the Architecture Constraint's file scope.

---

## File map

```
Modify:
  src/web-ui/routes/products.js — drop the "?" glyph from the unknown health
    label (AC1); render an honest Unknown-styled Overall line when there's no
    real health signal (AC3)

Create:
  tests/check-pdt-s3-deemphasize-unknown-health.js — 3 unit + 1 NFR test (AC1-AC3 + NFR)
```

---

## Task 1: Drop the "?" glyph from the Unknown label (AC1)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-pdt-s3-deemphasize-unknown-health.js`

- [ ] **Step 1: Write the failing test**

```javascript
await test('AC1: Unknown-health item renders plain "Unknown" text in the muted token, no "?" glyph, no colored badge background', function() {
  var pipelineState = {
    features: [{ slug: 'feat-a', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }] }] }]
  };
  var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
  var healthCounts = productRollup.computeHealthCounts(pipelineState);
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

  var html = productsRoute._renderProductView(
    'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
    modules, 'csrf-token', {}, {}, [], 0, null
  );

  assert.ok(/data-health="unknown"/.test(html), 'expected the s1 row to be marked unknown health');
  assert.ok(!/\? Unknown/.test(html), 'expected the "?" glyph to be dropped from the Unknown label');
  assert.ok(/color:var\(--muted\)">Unknown</.test(html), 'expected plain "Unknown" text in the muted color token, no background styling');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pdt-s3-deemphasize-unknown-health.js
```

Expected output: `[FAIL] AC1: ... -- expected the "?" glyph to be dropped from the Unknown label`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, change all 3 occurrences of `'? Unknown'` to `'Unknown'`:
- Line 217 (`_renderEpicRow`'s `label` ternary)
- Line 296 (`_renderPvcItemRow`'s `label` ternary)
- Line 721 (`_renderProductView`'s own `HEALTH_LABELS` const, used by the Overall/per-status summary line)

```javascript
// _renderEpicRow, line 217
var label = f.health === 'red' ? '✕ Blocked' : f.health === 'amber' ? '⚠ Warning' : f.health === 'unknown' ? 'Unknown' : '✓ Healthy';

// _renderPvcItemRow, line 296
var label = item.health === 'red' ? '✕ Blocked' : item.health === 'amber' ? '⚠ Warning' : item.health === 'unknown' ? 'Unknown' : '✓ Healthy';

// _renderProductView, line 721
var HEALTH_LABELS = { green: '✓ Healthy', amber: '⚠ Warning', red: '✕ Blocked', unknown: 'Unknown' };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pdt-s3-deemphasize-unknown-health.js
```

Expected output: `[PASS] AC1: Unknown-health item renders plain "Unknown" text...`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all passing except the one pre-existing, unrelated `check-p3.5-validate-trace.js` failure. **Watch specifically** for any pre-existing test asserting the literal string `"? Unknown"` — grep `tests/*.js` for `"? Unknown"` before running, since this is a text-content change any prior story's test could have hardcoded.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-pdt-s3-deemphasize-unknown-health.js
git commit -m "fix: drop the '?' glyph from the Unknown health label to reduce visual competition (pdt-s3 AC1)"
```

---

## Task 2: Confirm real health values are unchanged (AC2, regression guard)

**Files:**
- Test only: `tests/check-pdt-s3-deemphasize-unknown-health.js` (no source change — Task 1 only touched the `unknown` branch of each ternary)

- [ ] **Step 1: Write the test**

```javascript
await test('AC2: real Healthy/Warning/Blocked items keep their existing colored labels, unchanged', function() {
  var pipelineState = {
    features: [
      { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }] }] },
      { slug: 'feat-b', health: 'amber', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's2' }] }] },
      { slug: 'feat-c', health: 'red', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's3' }] }] }
    ]
  };
  var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
  var healthCounts = productRollup.computeHealthCounts(pipelineState);
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

  var html = productsRoute._renderProductView(
    'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
    modules, 'csrf-token', {}, {}, [], 0, null
  );

  assert.ok(/color:#22c55e">✓ Healthy</.test(html), 'expected Healthy items to keep their green color and glyph, unchanged');
  assert.ok(/color:#f59e0b">⚠ Warning</.test(html), 'expected Warning items to keep their amber color and glyph, unchanged');
  assert.ok(/color:#ef4444">✕ Blocked</.test(html), 'expected Blocked items to keep their red color and glyph, unchanged');
});
```

- [ ] **Step 2: Run test — must pass immediately (regression guard, Task 1 only touched the unknown branch)**

```bash
node tests/check-pdt-s3-deemphasize-unknown-health.js
```

Expected output: `[PASS] AC2: real Healthy/Warning/Blocked items keep their existing colored labels, unchanged`

- [ ] **Step 3: Commit**

```bash
git add tests/check-pdt-s3-deemphasize-unknown-health.js
git commit -m "test: confirm real health values are unaffected by the Unknown label change (pdt-s3 AC2)"
```

---

## Task 3: Fix the Overall summary line's unknown-signal case (AC3)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-pdt-s3-deemphasize-unknown-health.js`

- [ ] **Step 1: Write the failing test**

```javascript
await test('AC3: Overall line shows an honest Unknown state, not a misleading green Healthy, when there is no real health signal', function() {
  var modules = [{ id: 'm1', name: 'Module 1' }];

  // Scenario A: health_counts is entirely null (no rollup data at all --
  // the exact case named in AC3's own parenthetical, and the test plan's
  // own precondition).
  var rollupRowNoData = { health_counts: null, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var htmlNoData = productsRoute._renderProductView(
    'Test Product', 'prod-1', [], 'tester', rollupRowNoData, false, null, null,
    modules, 'csrf-token', {}, {}, [], 0, null
  );
  assert.ok(/Overall: Unknown/.test(htmlNoData), 'expected an honest "Overall: Unknown" line when there is no rollup data at all, not a missing line');
  assert.ok(!/Overall: ✓ Healthy/.test(htmlNoData), 'expected no misleading green Healthy overall signal with zero real data');

  // Scenario B: health_counts exists but every real status is 0 and only
  // unknown is non-zero (100% Unknown-health items).
  var pipelineState = { features: [{ slug: 'feat-a', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }] }] }] };
  var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
  var healthCounts = productRollup.computeHealthCounts(pipelineState);
  var rollupRowAllUnknown = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var htmlAllUnknown = productsRoute._renderProductView(
    'Test Product', 'prod-1', [], 'tester', rollupRowAllUnknown, false, null, null,
    modules, 'csrf-token', {}, {}, [], 0, null
  );
  assert.ok(/Overall: Unknown/.test(htmlAllUnknown), 'expected an honest "Overall: Unknown" line when 100% of items are Unknown-health');
  assert.ok(!/Overall: ✓ Healthy/.test(htmlAllUnknown), 'expected no misleading green Healthy overall signal when there is zero real green/amber/red signal');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pdt-s3-deemphasize-unknown-health.js
```

Expected output: `[FAIL] AC3: ... -- expected an honest "Overall: Unknown" line when there is no rollup data at all, not a missing line`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, replace the `overallSignal`/`healthHtml` block in `_renderProductView`:

```javascript
  var overallSignal = healthCounts ? _productRollup.computeOverallHealthSignal(healthCounts) : 'unknown';
  // pdt-s3 (AC3): computeOverallHealthSignal (product-rollup.js -- out of
  // scope for this story) has no 'unknown' branch; it falls through to
  // 'green' whenever red=0 and amber=0, even with zero real signal. Correct
  // that presentation-layer gap locally, here only, without touching the
  // shared computation function itself.
  if (healthCounts && (healthCounts.green || 0) === 0 && (healthCounts.red || 0) === 0 && (healthCounts.amber || 0) === 0) {
    overallSignal = 'unknown';
  }
  var healthHtml = healthCounts
    ? '<div style="margin-top:12px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;font-size:13px">' +
        '<span style="font-weight:600;color:' + HEALTH_COLORS[overallSignal] + '">Overall: ' + _escapeHtml(HEALTH_LABELS[overallSignal]) + '</span>' +
        ['green', 'amber', 'red', 'unknown'].map(function(status) {
          return '<span style="color:' + HEALTH_COLORS[status] + '">' + _escapeHtml(HEALTH_LABELS[status]) + ': ' + _escapeHtml(String(healthCounts[status] || 0)) + '</span>';
        }).join('') +
      '</div>'
    : '<div style="margin-top:12px;font-size:13px"><span style="font-weight:600;color:' + HEALTH_COLORS.unknown + '">Overall: ' + HEALTH_LABELS.unknown + '</span></div>';
```

(Only the `overallSignal` initializer, the new zero-signal override, and the `healthHtml` else-branch change — the existing `healthCounts`-present rendering path is untouched.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pdt-s3-deemphasize-unknown-health.js
```

Expected output: `[PASS] AC3: Overall line shows an honest Unknown state...`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all passing except the one pre-existing, unrelated failure. **Watch specifically** for `check-shb-s1-story-health-badge-fix.js` and `check-pr-s2-products-route.js`'s AC1/AC3/AC4 health-rollup tests, since they construct fixtures with real health counts and could plausibly assert the old always-green fallback.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-pdt-s3-deemphasize-unknown-health.js
git commit -m "fix: Overall summary line shows honest Unknown state instead of misleading green Healthy with zero real signal (pdt-s3 AC3)"
```

---

## Task 4: NFR test — de-emphasized Unknown treatment remains readable

**Files:**
- Test only: `tests/check-pdt-s3-deemphasize-unknown-health.js`

- [ ] **Step 1: Write the test**

```javascript
await test('NFR-Accessibility: the muted Unknown color token meets WCAG 2.1 AA contrast (>=4.5:1) against the page background', function() {
  // Computed from html-shell.js's own DESIGN_SYSTEM_CSS token values --
  // --muted vs --bg (the actual background pvc-item rows render against;
  // --surface is reserved for boxed/bordered "card" sections, not the flat
  // item list), both light and dark themes.
  function relLum(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    function lin(c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }
  function contrast(h1, h2) {
    var L1 = relLum(h1), L2 = relLum(h2);
    var lighter = Math.max(L1, L2), darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }
  var lightRatio = contrast('#71717A', '#FAFAF9'); // light --muted vs light --bg
  var darkRatio = contrast('#808080', '#111110');  // dark --muted vs dark --bg
  assert.ok(lightRatio >= 4.5, 'expected light-mode --muted vs --bg contrast >= 4.5:1, got ' + lightRatio.toFixed(2));
  assert.ok(darkRatio >= 4.5, 'expected dark-mode --muted vs --bg contrast >= 4.5:1, got ' + darkRatio.toFixed(2));
});
```

- [ ] **Step 2: Run test — must pass immediately (this story does not change the color token, only removes a glyph and fixes the Overall-signal case)**

```bash
node tests/check-pdt-s3-deemphasize-unknown-health.js
```

Expected output: `[check-pdt-s3-deemphasize-unknown-health] Results: 4 passed, 0 failed`

- [ ] **Step 3: Run full suite — no regressions**

```bash
npm test
```

Expected output: all passing except the one pre-existing, unrelated `check-p3.5-validate-trace.js` failure.

- [ ] **Step 4: Commit**

```bash
git add tests/check-pdt-s3-deemphasize-unknown-health.js
git commit -m "test: add NFR-Accessibility contrast test for the Unknown health token (pdt-s3)"
```
