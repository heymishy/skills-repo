# Session-origin indicator on the /journey dashboard — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in `sob-s2-test-plan.md` pass. Reuse sob-s1's `deriveSessionOrigin` unchanged to render the session-origin indicator on each `/journey` dashboard card, without adding any new query.
**Branch:** `feature/sob-s2`
**Worktree:** `.worktrees/sob-s2`
**Test command:** `node scripts/run-all-tests.js` (or a single file directly: `node tests/check-sob-s2-....js`)

---

## File map

```
Create:
  tests/check-sob-s2-journey-dashboard-integration.js  — integration tests for the wired /journey card rendering (AC1-AC5)

Modify:
  src/web-ui/routes/journey.js  — thread the session-origin indicator into _renderJourneyHome's card template
  scripts/run-all-tests.js      — auto-discovers tests/check-*.js by glob (confirmed at sob-s1 Task 5) -- no change expected
```

---

## Task 1: Wire the session-origin indicator into `_renderJourneyHome`'s card template

**Files:**
- Modify: `src/web-ui/routes/journey.js`
- Test: `tests/check-sob-s2-journey-dashboard-integration.js`

**Grounded directly in the real, current code** (read during this plan's own authoring): `_renderJourneyHome(data)` at line 189 builds cards via `var cards = journeys.map(function(j) {...})` at line 238. Each `j` is either a real journey object (always carries a `completedStages` array, even if empty) or a synthesized entry from `_mergeStateFeaturesIntoJourneyList` (never carries a `completedStages` property at all — confirmed against that function's real return shape: `{featureSlug, currentStage, productProfile, createdAt, stages: {}}`). `deriveSessionOrigin` (sob-s1, already merged and exported from `src/web-ui/routes/features.js`) is reused unchanged — this task does not modify it.

- [ ] **Step 1: Write the failing test**

```js
// tests/check-sob-s2-journey-dashboard-integration.js
'use strict';
const assert = require('assert');
const { deriveSessionOrigin } = require('../src/web-ui/routes/features.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); passed++; }
  catch (e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; }
}

// sob-s2: the exact mapping this story adds to _renderJourneyHome's card
// loop -- extracted here as a small pure helper so it can be unit-tested
// directly, matching sob-s1's own AC9-contract-testing precedent.
function journeyCardSessionOrigin(j) {
  return deriveSessionOrigin({
    hasJourney: Array.isArray(j.completedStages),
    completedStages: j.completedStages || []
  });
}

console.log('\n[sob-s2] AC1 -- real journey, fully session-backed');
test('real journey with all completedStages carrying sessionId returns fully-session-backed', function() {
  const j = { completedStages: [{ sessionId: 's1' }, { sessionId: 's2' }] };
  assert.strictEqual(journeyCardSessionOrigin(j), 'fully-session-backed');
});

console.log('\n[sob-s2] AC2 -- real journey, mixed');
test('real journey with partial sessionId coverage returns mixed', function() {
  const j = { completedStages: [{ sessionId: 's1' }, { sessionId: null }] };
  assert.strictEqual(journeyCardSessionOrigin(j), 'mixed');
});

console.log('\n[sob-s2] AC3 -- synthesized entry (no completedStages property at all) returns no-session');
test('a synthesized _mergeStateFeaturesIntoJourneyList-shaped entry returns no-session, does not throw', function() {
  const synthesized = { featureSlug: 'some-cli-feature', currentStage: 'definition', productProfile: 'default', createdAt: '2026-09-01', stages: {} };
  // no .completedStages property at all -- this is the exact real shape
  assert.strictEqual(journeyCardSessionOrigin(synthesized), 'no-session');
});

console.log('\n[sob-s2] AC4 -- real journey, zero completed stages, returns null (no indicator)');
test('real journey with completedStages: [] returns null', function() {
  const j = { completedStages: [] };
  assert.strictEqual(journeyCardSessionOrigin(j), null);
});

console.log('\n--- sob-s2 unit-level mapping results (partial -- integration tests follow) ---');
console.log('Passed:', passed, ' Failed:', failed);
```

Note: this first version only unit-tests the mapping helper in isolation. AC5 (no new query) and the full rendered-HTML assertions for AC1-AC4 are added in Step 3 below, once the real wiring exists in `journey.js` to test against.

- [ ] **Step 2: Run test — must fail (partially)**

```bash
node tests/check-sob-s2-journey-dashboard-integration.js
```

Expected: this file doesn't yet call `process.exit()` (deliberately incomplete at this step) — the 4 assertions above should all PASS already, since they only exercise `deriveSessionOrigin` (already merged) through a locally-defined helper function, not yet wired into `journey.js` itself. This is expected — Step 1's test proves the MAPPING LOGIC is correct in isolation before Step 3 wires it into the real card template and adds the render-level assertions that will genuinely start RED.

- [ ] **Step 3: Extend the test file with real render-level assertions (these ARE the RED step) and write the implementation together**

First, in `src/web-ui/routes/journey.js`, inside the `cards = journeys.map(function(j) {...})` closure (line 238), add before the `return [...]` array:

```js
    // sob-s2: reuses sob-s1's deriveSessionOrigin unchanged. hasJourney is
    // true only when j actually carries a real completedStages array --
    // synthesized entries from _mergeStateFeaturesIntoJourneyList never do
    // (see decisions.md, 2026-09-08, for why this must be an explicit
    // Array.isArray check, not an empty-array fallback).
    var _sobDeriveFn = require('./features.js').deriveSessionOrigin;
    var _sobOrigin = _sobDeriveFn({
      hasJourney: Array.isArray(j.completedStages),
      completedStages: j.completedStages || []
    });
    var _sobLabelMap = {
      'fully-session-backed': 'All completed stages driven through a live session — resumable',
      'mixed': 'Some stages authored via CLI/agent, some through a live session — partially resumable',
      'no-session': 'No live session — authored via CLI/agent'
    };
    var _sobGlyphMap = { 'fully-session-backed': '●', 'mixed': '◐', 'no-session': '○' };
    var sessionOriginHtml = _sobOrigin
      ? '<span data-sob-session-origin="' + _sobOrigin + '" class="sw-pill sw-pill--nodot" title="' + escHtml(_sobLabelMap[_sobOrigin]) + '" aria-label="' + escHtml(_sobLabelMap[_sobOrigin]) + '">' + _sobGlyphMap[_sobOrigin] + '</span>'
      : '';
```

Check first whether `require('./features.js')` can be hoisted to the top of `journey.js` as a normal module-level import instead of this inline call — grep `journey.js` for any existing `require('./products')` or similar that might create a cycle with `features.js` (which itself requires `./products`, not `./journey` — so a `journey.js` → `features.js` top-level require is likely SAFE, unlike `products.js`'s own inline-require case in sob-s1's Task 4, which had a genuine cycle). If no cycle exists, hoist it; if one is found, keep it inline and add a one-line comment explaining why, matching sob-s1's own precedent.

Then insert `sessionOriginHtml` as a new sibling inside the card's `.jh-card__meta` div (line 244-248), alongside the existing `jh-stage-badge`/`jh-card__profile`/`jh-card__date` spans:

```js
          '<div class="jh-card__meta">',
            '<span class="jh-stage-badge">' + escHtml(stageLabel(j.currentStage || '')) + '</span>',
            '<span class="jh-card__profile">◈ ' + escHtml(j.productProfile || 'default') + '</span>',
            '<span class="jh-card__date">' + escHtml((j.createdAt ? new Date(j.createdAt).toISOString() : '').slice(0, 10)) + '</span>',
            sessionOriginHtml,
          '</div>',
```

Now extend `tests/check-sob-s2-journey-dashboard-integration.js` with real render-level tests calling `_renderJourneyHome` (or whatever export path reaches it — check `journey.js`'s `module.exports` for how this function is exposed for testing; if it's not currently exported, add it, mirroring sob-s1's own precedent of exporting internal render helpers for direct testing) with fixture `journeys` arrays covering:

- AC1: a fully session-backed journey renders `data-sob-session-origin="fully-session-backed"`
- AC2: a mixed journey renders `data-sob-session-origin="mixed"`
- AC3: a synthesized entry renders `data-sob-session-origin="no-session"` without throwing
- AC4: a journey with `completedStages: []` renders NO `data-sob-session-origin` element at all
- AC5: call-count check — before/after this story's change, `_journeyStore.listJourneys`/`_mergeStateFeaturesIntoJourneyList` are each still called exactly once per page render (use a spy/counter on both, matching the existing call pattern in the route handler that invokes `_renderJourneyHome` — find and reuse whatever test seam already exists for this handler, or add a minimal one if none exists, following sob-s1's own precedent for introducing test seams narrowly and only where needed)

Add `process.exit(failed > 0 ? 1 : 0);` at the end once these are added (removing the earlier no-exit placeholder from Step 1).

Run the extended file BEFORE making the `journey.js` change — confirm the new render-level assertions fail (RED) because `data-sob-session-origin` doesn't exist in the rendered output yet. Then apply the `journey.js` change above and confirm they pass (GREEN).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-sob-s2-journey-dashboard-integration.js
```

Expected: all assertions pass (4 unit-level from Step 1 + the render-level AC1-AC5 assertions from Step 3).

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected: no NEW failures beyond the one already-known, RISK-ACCEPTed pre-existing failure documented in `artefacts/2026-09-08-session-origin-badge/decisions.md` (`tests/check-p3.5-validate-trace.js`). The other previously-noted intermittent flake (`check-pcr-s1-test-runner.js`) may or may not appear on any given run — that's expected variance, not a regression.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journey.js tests/check-sob-s2-journey-dashboard-integration.js
git commit -m "feat(sob-s2): wire session-origin indicator into /journey dashboard cards"
```

---

## Task 2: Confirm test auto-discovery (verification only, mirrors sob-s1 Task 5)

**Files:** None — verification only.

Already confirmed at sob-s1 Task 5: `scripts/run-all-tests.js` dynamically globs `tests/check-*.js` — no manual registration needed. This task exists only to re-confirm the new file was picked up.

- [ ] **Step 1: Run full suite — confirm the new file is included**

```bash
node scripts/run-all-tests.js 2>&1 | grep "sob-s2"
```

Expected: `check-sob-s2-journey-dashboard-integration.js` appears in the run output with 0 failures.

- [ ] **Step 2: No commit needed** — nothing changes for this task.
