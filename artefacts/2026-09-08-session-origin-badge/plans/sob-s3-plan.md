# Session-origin indicator on the org kanban board — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in `sob-s3-test-plan.md` pass. Reuse sob-s1's `deriveSessionOrigin` and `_getSessionOriginBulk` seam unchanged. Additionally completes the deferred DRY extraction logged in `decisions.md` (2026-09-08, "Deferred: extract `_sobLabelMap`/`_sobGlyphMap`...") — this is Task 1, done first so Tasks 2-3 build on the shared helper rather than adding a third inline copy.
**Branch:** `feature/sob-s3`
**Worktree:** `.worktrees/sob-s3`
**Test command:** `node scripts/run-all-tests.js` (or a single file directly: `node tests/check-sob-s3-....js`)

---

## File map

```
Create:
  tests/check-sob-s3-org-kanban-integration.js  — integration tests for AC1-AC5

Modify:
  src/web-ui/routes/features.js   — extract shared SESSION_ORIGIN_META (label+glyph per state) + sessionOriginBadgeMeta(origin) helper, exported alongside deriveSessionOrigin
  src/web-ui/routes/products.js   — Task 1: replace inline _sobLabelMap/_sobGlyphMap in _renderPvcItemRow with the shared helper. Task 2: add _enrichColumnsWithSessionOrigin(columns), wire into handleGetOrgKanban only (not product/tenant kanban -- out of this story's scope).
  src/web-ui/routes/journey.js    — Task 1: replace inline _sobLabelMap/_sobGlyphMap in _renderJourneyHome with the shared helper (behaviour-identical refactor, no test changes expected).
  src/web-ui/views/kanban-view.js — Task 3: render the session-origin badge from card.sessionOrigin, mirroring the existing artefactBadge pattern exactly (only rendered when the caller supplied it).
```

---

## Task 1: Extract the shared session-origin label/glyph map into `features.js`, refactor sob-s1/sob-s2's existing call sites to use it

**Files:**
- Modify: `src/web-ui/routes/features.js`, `src/web-ui/routes/products.js`, `src/web-ui/routes/journey.js`
- Test: existing `tests/check-sob-s1-product-list-integration.js` and `tests/check-sob-s2-journey-dashboard-integration.js` must continue passing unchanged (this is a pure refactor, not a behaviour change — no new test file for this task).

**Grounded directly in the real, current code** (read during this plan's own authoring): `products.js`'s `_renderPvcItemRow` (line ~354-367) and `journey.js`'s `_renderJourneyHome` card-mapping closure each carry an identical, hand-written `_sobLabelMap`/`_sobGlyphMap` pair plus near-identical HTML-building. `products.js` requires `features.js` INLINE (line 354) because of a genuine require cycle (`features.js` → `products.js` for `renderShellWithNav`) — `journey.js` requires it at top level (no cycle). The shared helper must therefore return DATA (label + glyph), not a pre-built HTML string with baked-in escaping, since each caller uses its own local escaping helper (`products.js`: `_escapeHtml`; `journey.js`: `escHtml`).

- [ ] **Step 1: Add the shared helper to `features.js`**

Add, near `deriveSessionOrigin`:

```js
// sob-s3: single source of truth for the tri-state's display label + glyph.
// Returns { label, glyph } or null (for a null/unrecognised origin) -- callers
// build their own escaped <span> markup using their own local escHtml, since
// this module must not assume a particular escaping convention (products.js
// requires this file inline to avoid a require cycle; journey.js requires it
// top-level -- both must still get identical label/glyph data).
var SESSION_ORIGIN_META = {
  'fully-session-backed': { label: 'All completed stages driven through a live session — resumable', glyph: '●' },
  'mixed': { label: 'Some stages authored via CLI/agent, some through a live session — partially resumable', glyph: '◐' },
  'no-session': { label: 'No live session — authored via CLI/agent', glyph: '○' }
};
function sessionOriginBadgeMeta(origin) {
  return SESSION_ORIGIN_META[origin] || null;
}
```

Add `sessionOriginBadgeMeta` to `module.exports`.

- [ ] **Step 2: Refactor `products.js`'s `_renderPvcItemRow`**

Replace the `_sobLabelMap`/`_sobGlyphMap`/`sessionOriginHtml` block (lines ~359-367) with:

```js
  var _sobMeta = require('./features.js').sessionOriginBadgeMeta(_sobOrigin);
  var sessionOriginHtml = _sobMeta
    ? ' <span data-sob-session-origin="' + _sobOrigin + '" class="sw-pill sw-pill--nodot" title="' + _escapeHtml(_sobMeta.label) + '" aria-label="' + _escapeHtml(_sobMeta.label) + '">' + _sobMeta.glyph + '</span>'
    : '';
```

- [ ] **Step 3: Refactor `journey.js`'s `_renderJourneyHome` card closure**

Same substitution, using the already-hoisted top-level `require('./features.js')` and `journey.js`'s own `escHtml`.

- [ ] **Step 4: Run the existing sob-s1/sob-s2 test files — must still pass unchanged**

```bash
node tests/check-sob-s1-product-list-integration.js
node tests/check-sob-s2-journey-dashboard-integration.js
```

Expected: identical pass counts to before this refactor (8/8 and 9/9). This is a pure extraction — output markup is byte-identical (`title="` and `aria-label="` HTML-escape the same string, glyph characters are byte-identical to the originals).

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/features.js src/web-ui/routes/products.js src/web-ui/routes/journey.js
git commit -m "refactor(sob-s3): extract shared session-origin label/glyph map into features.js"
```

---

## Task 2: Add `_enrichColumnsWithSessionOrigin` in `products.js`, wire into `handleGetOrgKanban` only

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-sob-s3-org-kanban-integration.js`

**Grounded directly in the real, current code:** `_enrichColumnsWithArtefactCounts` (line 86-106) is the exact shape to mirror — one bulk read keyed by `c.id` (already confirmed: `_aggregateJourneysByStage` sets `card.id = j.journey_id`, so this is directly compatible with `_getSessionOriginBulk`'s `journeyIds` parameter, no new ID-mapping needed), degrades gracefully on throw (AC4), mutates and returns `columns`. `handleGetOrgKanban` (line 2952) already calls `_enrichColumnsWithArtefactCounts(columns)` once (line 2994) — this task adds a second enrichment call immediately after it, at the SAME call site only. Do NOT add this call to the other two `_enrichColumnsWithArtefactCounts` call sites (lines 2885, 2929 — tenant/product-scope kanban) — out of this story's scope per its own Out of Scope section; those boards' cards simply won't carry `card.sessionOrigin`, so Task 3's badge naturally won't render there (same "callers that never supply it get zero behaviour change" contract `_enrichColumnsWithArtefactCounts` already establishes).

- [ ] **Step 1: Write the failing test**

```js
// tests/check-sob-s3-org-kanban-integration.js
'use strict';
const assert = require('assert');
const products = require('../src/web-ui/routes/products.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); passed++; }
  catch (e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; }
}
async function testAsync(name, fn) {
  try { await fn(); console.log('  ✓ ' + name); passed++; }
  catch (e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; }
}

(async function main() {
  console.log('\n[sob-s3] AC1/AC2 -- _enrichColumnsWithSessionOrigin derives card.sessionOrigin from the raw completedStages bulk read');
  await testAsync('fully session-backed and mixed cards each get the correct tri-state value', async function() {
    // _getSessionOriginBulk (getSessionOriginForJourneys) returns RAW
    // completedStages arrays keyed by journeyId, not a pre-derived
    // tri-state -- deriveSessionOrigin is called per-card inside
    // _enrichColumnsWithSessionOrigin itself. See sob-s3-plan.md Task 2
    // Step 3's note for why (confirmed by reading journey-store-pg.js
    // directly, not assumed).
    products.setGetSessionOriginBulk(async function(journeyIds) {
      assert.deepStrictEqual(journeyIds.sort(), ['j1', 'j2']);
      return {
        j1: [{ sessionId: 's1' }, { sessionId: 's2' }],
        j2: [{ sessionId: 's1' }, { sessionId: null }]
      };
    });
    try {
      const columns = [{ stage: 'discovery', cards: [{ id: 'j1' }, { id: 'j2' }] }];
      await products._enrichColumnsWithSessionOrigin(columns);
      assert.strictEqual(columns[0].cards[0].sessionOrigin, 'fully-session-backed');
      assert.strictEqual(columns[0].cards[1].sessionOrigin, 'mixed');
    } finally {
      products.setGetSessionOriginBulk(null);
    }
  });

  console.log('\n[sob-s3] AC3 -- handleGetOrgKanban calls the shared _getSessionOriginBulk seam, not a second implementation');
  await testAsync('_enrichColumnsWithSessionOrigin is the only path org kanban uses to populate sessionOrigin', async function() {
    let callCount = 0;
    products.setGetSessionOriginBulk(async function() { callCount++; return {}; });
    try {
      const columns = [{ stage: 'discovery', cards: [{ id: 'j1' }] }];
      await products._enrichColumnsWithSessionOrigin(columns);
      assert.strictEqual(callCount, 1, 'expected exactly one call to the shared bulk seam');
    } finally {
      products.setGetSessionOriginBulk(null);
    }
  });

  console.log('\n[sob-s3] AC4 -- a bulk-read failure omits sessionOrigin without throwing');
  await testAsync('board render survives a thrown bulk read, cards simply have no sessionOrigin', async function() {
    products.setGetSessionOriginBulk(async function() { throw new Error('db down'); });
    try {
      const columns = [{ stage: 'discovery', cards: [{ id: 'j1' }] }];
      const result = await products._enrichColumnsWithSessionOrigin(columns);
      assert.strictEqual(result[0].cards[0].sessionOrigin, undefined);
    } finally {
      products.setGetSessionOriginBulk(null);
    }
  });

  console.log('\n[sob-s3] AC5 -- handleGetOrgKanban\\'s own query has no taxonomy-merge call (documents the "no session" state is structurally unreachable there today)');
  test('handleGetOrgKanban source contains no taxonomy-merge/mergeFeatureSources reference', function() {
    const src = require('fs').readFileSync(require.resolve('../src/web-ui/routes/products.js'), 'utf8');
    const fnStart = src.indexOf('async function handleGetOrgKanban');
    const fnEnd = src.indexOf('\nasync function ', fnStart + 10);
    const fnBody = src.slice(fnStart, fnEnd === -1 ? undefined : fnEnd);
    assert.ok(!/mergeFeatureSources|taxonomy/i.test(fnBody), 'handleGetOrgKanban must not merge in taxonomy-only (non-journey) rows -- its query is journeys-table-only by design (see decisions.md/story Architecture Constraints)');
  });

  console.log('\n--- sob-s3 full results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  process.exit(failed > 0 ? 1 : 0);
})();
```

- [ ] **Step 2: Run test — must fail (RED)**

```bash
node tests/check-sob-s3-org-kanban-integration.js
```

Expected: fails immediately — `products._enrichColumnsWithSessionOrigin` does not exist yet (AC5's test may already pass since it only reads source text, not behaviour — that's fine, TDD RED only requires at least one genuinely-new assertion to fail).

- [ ] **Step 3: Implement `_enrichColumnsWithSessionOrigin` in `products.js`**

Add immediately after `_enrichColumnsWithArtefactCounts` (after line 106):

```js
/**
 * sob-s3 (AC1-AC4) -- enrich already-built STAGE_COLUMNS-shaped columns with
 * each card's session-origin tri-state, via exactly ONE bulk read for the
 * whole board render (mirrors _enrichColumnsWithArtefactCounts exactly,
 * reusing sob-s1's _getSessionOriginBulk seam -- never a second,
 * independently-implemented bulk function, per AC3).
 *
 * AC4: if the bulk read throws, the board render must NOT fail -- cards are
 * simply left without a sessionOrigin, so kanban-view.js's card renderer
 * shows no badge at all (identical degrade-gracefully contract to
 * _enrichColumnsWithArtefactCounts's own AC5).
 * @param {Array} columns
 * @returns {Promise<Array>}
 */
async function _enrichColumnsWithSessionOrigin(columns) {
  var journeyIds = [];
  (columns || []).forEach(function(col) {
    (col.cards || []).forEach(function(c) { journeyIds.push(c.id); });
  });
  if (journeyIds.length === 0) return columns;

  var stagesById;
  try {
    stagesById = await _getSessionOriginBulk(journeyIds);
  } catch (e) {
    return columns; // AC4 -- degrade gracefully, never break the board render
  }

  var _deriveFn = require('./features.js').deriveSessionOrigin;
  (columns || []).forEach(function(col) {
    (col.cards || []).forEach(function(c) {
      // Every org-kanban card is journey-backed by construction (this
      // story's own Architecture Constraints, confirmed by reading
      // handleGetOrgKanban's query directly: no taxonomy merge) -- so
      // hasJourney is always true here, unlike journey.js's sob-s2 case
      // which had to handle synthesized (non-journey) entries too.
      var origin = _deriveFn({ hasJourney: true, completedStages: (stagesById && stagesById[c.id]) || [] });
      if (origin) c.sessionOrigin = origin;
    });
  });
  return columns;
}
```

Note: `_getSessionOriginBulk` (via `getSessionOriginForJourneys` in `journey-store-pg.js`, confirmed by direct read during this plan's authoring, line 146-156) returns `{ [journeyId]: completedStages array }` — RAW completed-stages, not a pre-derived tri-state string. `deriveSessionOrigin` must be called per card here, same as both sob-s1's and sob-s2's own call sites already do — `_getSessionOriginBulk` itself is a shared raw-data seam, not a shared derivation. Do not assume it returns an already-derived string.

Export `_enrichColumnsWithSessionOrigin` from `products.js`'s `module.exports` (needed for the test file's direct call).

Wire into `handleGetOrgKanban`, immediately after its existing `_enrichColumnsWithArtefactCounts(columns)` call (line 2994):

```js
  await _enrichColumnsWithArtefactCounts(columns);
  await _enrichColumnsWithSessionOrigin(columns); // sob-s3 (AC1-AC4)
```

- [ ] **Step 4: Run test — must pass (GREEN)**

```bash
node tests/check-sob-s3-org-kanban-integration.js
```

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-sob-s3-org-kanban-integration.js
git commit -m "feat(sob-s3): add _enrichColumnsWithSessionOrigin, wire into handleGetOrgKanban"
```

---

## Task 3: Render the session-origin badge in `kanban-view.js`'s shared card renderer

**Files:**
- Modify: `src/web-ui/views/kanban-view.js`
- Test: extend `tests/check-sob-s3-org-kanban-integration.js`

**Grounded directly in the real, current code:** the artefact-count badge (line 340-344) is the exact pattern to mirror — read `card.<field>`, render nothing if the caller never supplied it, insert into the card's `<a>` alongside the other badges (line 408-420). `kanban-view.js` does not currently require `features.js` or `products.js` — confirmed no require cycle either direction, safe to add a top-level `require('../routes/features.js')` for `sessionOriginBadgeMeta`.

- [ ] **Step 1: Extend the test file with a render-level assertion (RED)**

Add to `tests/check-sob-s3-org-kanban-integration.js`, before the final summary:

```js
  console.log('\n[sob-s3] AC1/AC2 (render-level) -- kanban-view renders the session-origin badge from card.sessionOrigin');
  test('renderKanban outputs data-sob-session-origin for a card carrying sessionOrigin', function() {
    const kanbanView = require('../src/web-ui/views/kanban-view.js');
    const html = kanbanView.renderKanban({
      columns: [{ stage: 'discovery', cards: [{ id: 'j1', title: 'Test', sessionOrigin: 'fully-session-backed' }] }]
    });
    assert.ok(html.includes('data-sob-session-origin="fully-session-backed"'), 'expected the session-origin badge to render on a card carrying sessionOrigin');
  });

  test('renderKanban renders no session-origin badge for a card without sessionOrigin (zero behaviour change for other callers)', function() {
    const kanbanView = require('../src/web-ui/views/kanban-view.js');
    const html = kanbanView.renderKanban({
      columns: [{ stage: 'discovery', cards: [{ id: 'j2', title: 'Test2' }] }]
    });
    assert.ok(!html.includes('data-sob-session-origin'), 'expected no session-origin badge for a card the caller never enriched');
  });
```

Check `renderKanban`'s real exported signature (module.exports at the bottom of `kanban-view.js`) before writing this — confirm the fixture shape matches what other existing kanban-view tests already pass it (e.g. whether `columns` is a top-level key or nested differently). Ground this against a real existing kanban-view test file's fixture, not assumption.

- [ ] **Step 2: Run — confirm RED**

```bash
node tests/check-sob-s3-org-kanban-integration.js
```

- [ ] **Step 3: Implement in `kanban-view.js`**

Add near the top (after the existing `escHtml` require, line 6):

```js
const { sessionOriginBadgeMeta } = require('../routes/features.js');
```

Add alongside `artefactBadge`'s computation (after line 344):

```js
      // sob-s3 (AC1, AC2) -- session-origin badge, same markup pattern as the
      // artefact-count badge above. Only rendered when the caller (products.js's
      // _enrichColumnsWithSessionOrigin, currently only wired for org kanban)
      // actually computed a value -- other kanban scopes render with no badge,
      // zero behaviour change for them.
      var _sobMeta = card.sessionOrigin ? sessionOriginBadgeMeta(card.sessionOrigin) : null;
      var sessionOriginBadge = _sobMeta
        ? '<span data-sob-session-origin="' + escHtml(card.sessionOrigin) + '" class="kb-session-origin-badge" title="' + escHtml(_sobMeta.label) + '" aria-label="' + escHtml(_sobMeta.label) + '">' + _sobMeta.glyph + '</span>'
        : '';
```

Insert `sessionOriginBadge` into the card's returned array (after line 412's `artefactBadge,`):

```js
          artefactBadge,
          sessionOriginBadge,
```

- [ ] **Step 4: Run — confirm GREEN**

```bash
node tests/check-sob-s3-org-kanban-integration.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected: no NEW failures beyond the already-known, RISK-ACCEPTed pre-existing failure(s) documented in `decisions.md` (`check-p3.5-validate-trace.js`; possibly the intermittent `check-pcr-s1-test-runner.js` timing flake).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/views/kanban-view.js tests/check-sob-s3-org-kanban-integration.js
git commit -m "feat(sob-s3): render session-origin badge on org kanban cards"
```

---

## Task 4: Confirm test auto-discovery (verification only, mirrors sob-s1 Task 5 / sob-s2 Task 2)

**Files:** None — verification only.

- [ ] **Step 1: Run full suite — confirm the new file is included**

```bash
node scripts/run-all-tests.js 2>&1 | grep "sob-s3"
```

Expected: `check-sob-s3-org-kanban-integration.js` appears in the run output with 0 failures.

- [ ] **Step 2: No commit needed.**
