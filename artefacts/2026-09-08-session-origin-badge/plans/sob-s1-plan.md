# Shared session-origin derivation + product feature-list indicator — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in `sob-s1-test-plan.md` pass. Add `deriveSessionOrigin`, a bulk-lookup seam, and wire the resulting tri-state indicator into the product feature-list page — without adding scope beyond the story's 9 ACs.
**Branch:** `feature/sob-s1`
**Worktree:** `.worktrees/sob-s1`
**Test command:** `node scripts/run-all-tests.js` (or a single file directly: `node tests/check-sob-s1-....js`)

---

## File map

```
Create:
  tests/check-sob-s1-session-origin-derivation.js    — unit tests for deriveSessionOrigin (AC1, AC2, AC3, AC5, AC9)
  tests/check-sob-s1-product-list-integration.js      — integration tests for the wired product-list rendering (AC4, AC5, AC6, AC7, AC8)

Modify:
  src/web-ui/routes/features.js       — add and export deriveSessionOrigin (colocated with _resolveResumeLinksForFeature)
  src/web-ui/adapters/journey-store-pg.js — add getSessionOriginForJourneys(journeyIds), sibling to getArtefactCountsForJourneys
  src/web-ui/routes/products.js       — add _getSessionOriginBulk/setGetSessionOriginBulk seam; wire into handleGetProductView, _renderProductView, _renderConsolidatedFeaturesSection, _renderPvcItemRow
  scripts/run-all-tests.js            — register the two new test files
```

---

## Task 1: `deriveSessionOrigin` pure function

**Files:**
- Modify: `src/web-ui/routes/features.js`
- Test: `tests/check-sob-s1-session-origin-derivation.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/check-sob-s1-session-origin-derivation.js
'use strict';
const assert = require('assert');
const { deriveSessionOrigin } = require('../src/web-ui/routes/features.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); passed++; }
  catch (e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; }
}

console.log('\n[sob-s1] AC1 -- fully session-backed');
test('all completedStages carry sessionId returns fully-session-backed', function() {
  const result = deriveSessionOrigin({ hasJourney: true, completedStages: [{ sessionId: 's1' }, { sessionId: 's2' }] });
  assert.strictEqual(result, 'fully-session-backed');
});

console.log('\n[sob-s1] AC2 -- mixed');
test('some completedStages carry sessionId, some do not, returns mixed', function() {
  const result = deriveSessionOrigin({ hasJourney: true, completedStages: [{ sessionId: 's1' }, { sessionId: null }] });
  assert.strictEqual(result, 'mixed');
});

console.log('\n[sob-s1] AC3 -- no session (real journey, no sessionIds)');
test('real journey with zero sessionId-bearing stages returns no-session', function() {
  const result = deriveSessionOrigin({ hasJourney: true, completedStages: [{ sessionId: null }, { sessionId: undefined }] });
  assert.strictEqual(result, 'no-session');
});

console.log('\n[sob-s1] AC5 -- zero completed stages returns null');
test('real journey with zero completed stages returns null', function() {
  const result = deriveSessionOrigin({ hasJourney: true, completedStages: [] });
  assert.strictEqual(result, null);
});

console.log('\n[sob-s1] AC9 -- hasJourney contract');
test('hasJourney false always returns no-session regardless of completedStages content', function() {
  assert.strictEqual(deriveSessionOrigin({ hasJourney: false, completedStages: [] }), 'no-session');
  assert.strictEqual(deriveSessionOrigin({ hasJourney: false, completedStages: [{ sessionId: 's1' }] }), 'no-session');
});
test('hasJourney true + empty array (null) is distinguishable from hasJourney false + empty array (no-session)', function() {
  const withJourney = deriveSessionOrigin({ hasJourney: true, completedStages: [] });
  const withoutJourney = deriveSessionOrigin({ hasJourney: false, completedStages: [] });
  assert.strictEqual(withJourney, null);
  assert.strictEqual(withoutJourney, 'no-session');
});

console.log('\n--- sob-s1 derivation results ---');
console.log('Passed:', passed, ' Failed:', failed);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-sob-s1-session-origin-derivation.js
```

Expected output: `TypeError: deriveSessionOrigin is not a function` (or `undefined is not a function`) — `features.js` does not export it yet.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/features.js`, add near `_resolveResumeLinksForFeature` (around line 166):

```js
/**
 * sob-s1: derives the tri-state session-origin classification for a
 * feature/journey from its completed-stage sessionId presence.
 * hasJourney is a required, explicit input -- NOT inferred from an empty
 * completedStages array -- because a real journey with zero completed
 * stages (nothing to classify yet -> null) and a feature with no real
 * journey at all (definitely no session -> "no-session") both present as
 * an empty array to a naive caller. See decisions.md, 2026-09-08.
 * @param {{hasJourney: boolean, completedStages: Array<{sessionId?: string}>}} input
 * @returns {"fully-session-backed"|"mixed"|"no-session"|null}
 */
function deriveSessionOrigin(input) {
  if (!input.hasJourney) return 'no-session';
  var stages = input.completedStages || [];
  if (stages.length === 0) return null;
  var withSession = stages.filter(function(s) { return !!(s && s.sessionId); }).length;
  if (withSession === 0) return 'no-session';
  if (withSession === stages.length) return 'fully-session-backed';
  return 'mixed';
}
```

Add `deriveSessionOrigin` to `features.js`'s `module.exports` block (find the existing `module.exports = { ... }` near the end of the file and add it to the list).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-sob-s1-session-origin-derivation.js
```

Expected output: `Passed: 6  Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all previously-passing files still pass (the 1 pre-existing `check-p3.5-validate-trace.js` failure is unrelated and already RISK-ACCEPTed — see `decisions.md`)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/features.js tests/check-sob-s1-session-origin-derivation.js
git commit -m "feat(sob-s1): add deriveSessionOrigin tri-state derivation function"
```

---

## Task 2: `getSessionOriginForJourneys` Postgres adapter

**Files:**
- Modify: `src/web-ui/adapters/journey-store-pg.js`

- [ ] **Step 1: Write the failing test**

Add to `tests/check-sob-s1-product-list-integration.js` (new file — create it now with just this first test; more tests are added in later tasks):

```js
// tests/check-sob-s1-product-list-integration.js
'use strict';
const assert = require('assert');
const { getSessionOriginForJourneys } = require('../src/web-ui/adapters/journey-store-pg.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); passed++; }
  catch (e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; }
}

console.log('\n[sob-s1] getSessionOriginForJourneys -- no pool configured returns {}');
test('returns empty object with no DATABASE_URL/pool wired', async function() {
  const result = await getSessionOriginForJourneys(['j1', 'j2']);
  assert.deepStrictEqual(result, {});
});
test('returns empty object for an empty journeyIds array', async function() {
  const result = await getSessionOriginForJourneys([]);
  assert.deepStrictEqual(result, {});
});

(async function main() {
  console.log('\n--- sob-s1 product-list integration results (partial -- more tasks add tests below) ---');
  console.log('Passed:', passed, ' Failed:', failed);
  process.exit(failed > 0 ? 1 : 0);
})();
```

Note: the two tests above are synchronous-looking but call an async function without awaiting inside `test()` — this is a known pitfall (see `feedback_heredoc_backtick_corruption`-adjacent lessons this session learned the hard way with async test structure). Use the `async function main() { ... } main().then(...)` pattern established this session (`cat-s5`'s own fix) for every test file in this story, not a bare synchronous `test()` wrapper around an async call. Restructure this file's `test()` calls to `await` properly — see Task 4's full version of this file for the corrected structure once all tests are added.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-sob-s1-product-list-integration.js
```

Expected output: `TypeError: getSessionOriginForJourneys is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/adapters/journey-store-pg.js`, add near `getArtefactCountsForJourneys`:

```js
// sob-s1: sibling to getArtefactCountsForJourneys (s2.2) -- one batched
// read for the whole page/board render, never one call per row. Returns
// completedStages verbatim per journey (including each entry's sessionId,
// if present) so deriveSessionOrigin can classify it -- not a count or
// aggregate, the caller needs the raw per-stage detail.
async function getSessionOriginForJourneys(journeyIds) {
  const pool = _getPool();
  if (!pool || !journeyIds || journeyIds.length === 0) return {};
  const result = await pool.query(
    "SELECT journey_id, data->'completedStages' AS completed_stages FROM journeys WHERE journey_id = ANY($1)",
    [journeyIds]
  );
  const map = {};
  result.rows.forEach(function(row) { map[row.journey_id] = row.completed_stages || []; });
  return map;
}
```

Add `getSessionOriginForJourneys` to this file's `module.exports` list.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-sob-s1-product-list-integration.js
```

Expected output: `Passed: 2  Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same as Task 1 Step 5 — no new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/journey-store-pg.js tests/check-sob-s1-product-list-integration.js
git commit -m "feat(sob-s1): add getSessionOriginForJourneys Postgres adapter"
```

---

## Task 3: `_getSessionOriginBulk`/`setGetSessionOriginBulk` seam in `products.js`

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-sob-s1-product-list-integration.js` (extend)

- [ ] **Step 1: Write the failing test**

Extend `tests/check-sob-s1-product-list-integration.js` — replace its bottom `(async function main() ...)` block with:

```js
const { setGetSessionOriginBulk } = require('../src/web-ui/routes/products.js');

console.log('\n[sob-s1] AC6 -- bulk seam is called exactly once, injectable via setGetSessionOriginBulk');
async function testBulkSeamCallCount() {
  let callCount = 0;
  let receivedIds = null;
  setGetSessionOriginBulk(async function(ids) {
    callCount++;
    receivedIds = ids;
    return {};
  });
  const { _getSessionOriginBulk } = require('../src/web-ui/routes/products.js');
  await _getSessionOriginBulk(['j1', 'j2', 'j3']);
  assert.strictEqual(callCount, 1, 'expected exactly 1 call, got ' + callCount);
  assert.deepStrictEqual(receivedIds, ['j1', 'j2', 'j3']);
  setGetSessionOriginBulk(null); // reset to real default for other tests
}

(async function main() {
  await testBulkSeamCallCount().then(function() { console.log('  ✓ bulk seam call count and args'); passed++; })
    .catch(function(e) { console.log('  ✗ bulk seam call count and args'); console.log('      ' + e.message); failed++; });

  console.log('\n--- sob-s1 product-list integration results (partial) ---');
  console.log('Passed:', passed, ' Failed:', failed);
  process.exit(failed > 0 ? 1 : 0);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-sob-s1-product-list-integration.js
```

Expected output: `TypeError: setGetSessionOriginBulk is not a function` (or `_getSessionOriginBulk is not a function`)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, add near `_getArtefactCountsBulk`/`setGetArtefactCountsBulk` (around line 49-54):

```js
// sob-s1 -- injectable bulk session-origin reader, mirroring s2.2's
// _getArtefactCountsBulk seam exactly. Defaults to a lazy require of
// journey-store-pg.js's real getSessionOriginForJourneys -- ONE batched
// query for the whole page render, never one call per row. This is the
// "real-by-default, test-injectable" shape (NOT a D37 stub-throws
// adapter) -- see sob-s1-dor.md's H-ADAPTER reasoning for why.
var _getSessionOriginBulkFn = null;
async function _getSessionOriginBulk(journeyIds) {
  var fn = _getSessionOriginBulkFn || require('../adapters/journey-store-pg').getSessionOriginForJourneys;
  return fn(journeyIds);
}
function setGetSessionOriginBulk(fn) { _getSessionOriginBulkFn = fn; }
```

Add `_getSessionOriginBulk` and `setGetSessionOriginBulk` to this file's `module.exports` list.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-sob-s1-product-list-integration.js
```

Expected output: `Passed: 3  Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: no new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-sob-s1-product-list-integration.js
git commit -m "feat(sob-s1): add injectable _getSessionOriginBulk seam"
```

---

## Task 4: Wire the indicator into `handleGetProductView` / `_renderProductView` / `_renderPvcItemRow`

**Files:**
- Modify: `src/web-ui/routes/products.js` (three call sites)
- Test: `tests/check-sob-s1-product-list-integration.js` (finalize)

- [ ] **Step 1: Write the failing test**

Replace `tests/check-sob-s1-product-list-integration.js`'s content entirely with the final, complete version (fixes the async-structure note from Task 2 by using the `async function main() { ... } main().then(...)` pattern throughout, per this session's own established convention):

```js
// tests/check-sob-s1-product-list-integration.js
'use strict';
const assert = require('assert');
const {
  getSessionOriginForJourneys
} = require('../src/web-ui/adapters/journey-store-pg.js');
const {
  _getSessionOriginBulk,
  setGetSessionOriginBulk,
  _renderConsolidatedFeaturesSection
} = require('../src/web-ui/routes/products.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === 'function') {
      return r.then(function() { console.log('  ✓ ' + name); passed++; })
        .catch(function(e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; });
    }
    console.log('  ✓ ' + name); passed++;
  } catch (e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; }
  return Promise.resolve();
}

async function main() {
  console.log('\n[sob-s1] getSessionOriginForJourneys -- no pool configured');
  await test('returns empty object with no DATABASE_URL/pool wired', async function() {
    assert.deepStrictEqual(await getSessionOriginForJourneys(['j1']), {});
  });
  await test('returns empty object for an empty journeyIds array', async function() {
    assert.deepStrictEqual(await getSessionOriginForJourneys([]), {});
  });

  console.log('\n[sob-s1] AC6 -- bulk seam call count and args');
  await test('_getSessionOriginBulk calls the injected fn exactly once with the full ID array', async function() {
    let callCount = 0, receivedIds = null;
    setGetSessionOriginBulk(async function(ids) { callCount++; receivedIds = ids; return {}; });
    await _getSessionOriginBulk(['j1', 'j2', 'j3']);
    assert.strictEqual(callCount, 1);
    assert.deepStrictEqual(receivedIds, ['j1', 'j2', 'j3']);
    setGetSessionOriginBulk(null);
  });

  console.log('\n[sob-s1] AC4 -- taxonomy-only mergedItem (no journeyId) renders no-session');
  await test('a mergedItems entry with no journeyId shows the no-session indicator', function() {
    setGetSessionOriginBulk(async function() { return {}; }); // no journey-backed items to look up
    const mergedItems = [
      { slug: 'taxonomy-only-feature', name: 'Taxonomy Only', source: 'taxonomy', health: 'unknown', coverageLabel: 'No test data yet' }
      // deliberately no journeyId field -- mirrors mergeFeatureSources's real taxonomy-only shape
    ];
    const html = _renderConsolidatedFeaturesSection(mergedItems, [], null, 'prod-1', 'csrf', null);
    assert.ok(html.includes('data-sob-session-origin="no-session"'), 'expected no-session indicator in rendered HTML');
    setGetSessionOriginBulk(null);
  });

  console.log('\n[sob-s1] AC8 -- every indicator state carries a text-equivalent');
  await test('rendered indicator has a non-empty title/aria-label naming the state', function() {
    const mergedItems = [
      { slug: 'taxonomy-only-feature', name: 'Taxonomy Only', source: 'taxonomy', health: 'unknown', coverageLabel: 'No test data yet' }
    ];
    const html = _renderConsolidatedFeaturesSection(mergedItems, [], null, 'prod-1', 'csrf', null);
    const match = html.match(/<span data-sob-session-origin="no-session"[^>]*title="([^"]+)"/);
    assert.ok(match, 'expected a title attribute on the session-origin span');
    assert.ok(match[1].length > 0, 'title attribute must not be empty');
  });

  console.log('\n--- sob-s1 product-list integration results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  process.exit(failed > 0 ? 1 : 0);
}

main();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-sob-s1-product-list-integration.js
```

Expected output: `AssertionError [ERR_ASSERTION]` on the AC4 test — `data-sob-session-origin` is not yet in the rendered HTML.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`:

**3a. `handleGetProductView`** (around line 2416-2421, alongside the existing `_getArtefactCountsBulk` call): fetch session-origin data using `mergedItems`' journeyIds — but `mergedItems` is computed later, inside the HTML-render branch (around line 839). Move the bulk fetch to right after `mergedItems` is computed, not alongside the artefact-count fetch (which uses the earlier, raw `rows` array):

```js
    // sob-s1 (AC4, review finding 1-M1): built from mergedItems, NOT the
    // raw rows array _getArtefactCountsBulk above uses -- mergedItems
    // includes taxonomy-only entries with no journeyId at all, and this
    // is the array that actually gets rendered by _renderConsolidatedFeaturesSection.
    var sessionOriginByJourneyId = {};
    try {
      var _sobJourneyIds = mergedItems.filter(function(item) { return !!item.journeyId; }).map(function(item) { return item.journeyId; });
      sessionOriginByJourneyId = await _getSessionOriginBulk(_sobJourneyIds);
    } catch (_) {
      sessionOriginByJourneyId = {};
    }
```

Place this immediately after the `var mergedItems = ...` assignment (around line 839-861), before `_renderConsolidatedFeaturesSection` is called.

**3b. Thread it through `_renderConsolidatedFeaturesSection`** (line 378): add a 7th parameter `sessionOriginByJourneyId` and pass it to every row-renderer closure it builds. Update the call site in `handleGetProductView` (around line 868) to pass the new map as the 7th argument.

Inside `_renderConsolidatedFeaturesSection`, thread `sessionOriginByJourneyId` into the three row-renderer wrapper closures (`_renderPvcItemRowWithCheckbox`, `_renderPvcItemRowForPhase`, and the plain `_renderPvcItemRow` used in `allHtml`) by passing it as an additional argument to `_renderPvcItemRow`.

**3c. `_renderPvcItemRow`** (line 296): add a 4th parameter `sessionOriginByJourneyId`, defaulting to `{}`:

```js
function _renderPvcItemRow(item, includeCheckbox, preferFeatureName, sessionOriginByJourneyId) {
  sessionOriginByJourneyId = sessionOriginByJourneyId || {};
  // ... existing code unchanged down to the innerHtml assembly ...

  // sob-s1: derive this row's session-origin state. hasJourney is true
  // only when the item actually carries a journeyId (taxonomy-only items
  // from mergeFeatureSources do not -- AC4).
  var { deriveSessionOrigin } = require('./features.js');
  var _sobOrigin = deriveSessionOrigin({
    hasJourney: !!item.journeyId,
    completedStages: item.journeyId ? (sessionOriginByJourneyId[item.journeyId] || []) : []
  });
  var _sobLabelMap = {
    'fully-session-backed': 'All completed stages driven through a live session — resumable',
    'mixed': 'Some stages authored via CLI/agent, some through a live session — partially resumable',
    'no-session': 'No live session — authored via CLI/agent'
  };
  var sessionOriginHtml = _sobOrigin
    ? ' <span data-sob-session-origin="' + _sobOrigin + '" class="sw-pill sw-pill--nodot" title="' + _escapeHtml(_sobLabelMap[_sobOrigin]) + '" aria-label="' + _escapeHtml(_sobLabelMap[_sobOrigin]) + '">' +
        (_sobOrigin === 'fully-session-backed' ? '●' : _sobOrigin === 'mixed' ? '◐' : '○') +
      '</span>'
    : '';

  // Insert sessionOriginHtml as a sibling after the existing
  // data-a4-coverage span, inside the same flex container (around line 341):
  //   '<span data-a4-coverage ...>' + ... + '</span>' + sessionOriginHtml +
  // ... rest of function unchanged ...
```

(Note to implementer: `require('./features.js')` at call time, not top-of-file, only if a top-level `require('./features.js')` in `products.js` would create a circular-require issue with `features.js` — check first; if no cycle exists, hoist this to a normal top-of-file `require` alongside this file's other `var _xxx = require(...)` lines instead, matching this file's existing convention.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-sob-s1-product-list-integration.js
```

Expected output: `Passed: 5  Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: no new failures beyond the pre-existing, RISK-ACCEPTed `check-p3.5-validate-trace.js`.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-sob-s1-product-list-integration.js
git commit -m "feat(sob-s1): wire session-origin indicator into product feature-list rows"
```

---

## Task 5: Confirm auto-discovery picked up both new test files (no code change expected)

**Files:** None — verification only.

Confirmed directly (`scripts/run-all-tests.js` lines 64-83): it dynamically globs `tests/check-*.js` via a non-recursive `fs.readdirSync` + regex filter — there is no manual registration list to edit. Both `check-sob-s1-session-origin-derivation.js` and `check-sob-s1-product-list-integration.js` will be picked up automatically because their names match the convention. This task is a verification step, not an implementation step.

- [ ] **Step 1: Run full suite — confirm both new files are included**

```bash
node scripts/run-all-tests.js 2>&1 | grep "sob-s1"
```

Expected output: both file names appear in the run output, each with 0 failures, and the total file count (`[run-all-tests] N file(s) run`) is 2 higher than this story's own branch-setup baseline (628 → 630).

- [ ] **Step 2: No commit needed for this task** — nothing was changed. If, contrary to the confirmation above, the files are somehow NOT picked up, stop and re-read `scripts/run-all-tests.js`'s discovery logic before proceeding — do not add a manual registration workaround without understanding why auto-discovery didn't work as documented here.
