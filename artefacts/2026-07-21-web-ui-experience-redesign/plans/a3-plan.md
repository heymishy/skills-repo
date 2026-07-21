# Compute health per-feature, distinct from test coverage — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Trace what `computeHealthCounts` actually reads from `pipeline-state.json` today, then extend it to also return a per-feature health breakdown that is genuinely independent of test-coverage data, persisted alongside the existing aggregate.
**Branch:** `feature/a3-per-feature-health-signal`
**Worktree:** current session worktree (`.claude/worktrees/agent-a8897794dffa2d9ca`)
**Test command:** `node tests/check-pr-s2-product-rollup.js` (module-level); `node tests/check-pr-s2-products-route.js` (route-level regression); full suite via `npm test`

---

## Task 0 (investigation, no production code) — Trace computeHealthCounts's real inputs

This is the story's own first task per its Architecture Constraints. Read
`src/web-ui/modules/product-rollup.js`'s `computeHealthCounts` and the real
`.github/pipeline-state.json` shape directly (not assumed).

**Findings (recorded here and in `decisions.md` before any implementation code is written):**

1. `computeHealthCounts(pipelineState)` today reads **only** `feature.health` — a
   field that exists directly on each top-level entry of `pipelineState.features[]`
   (the whole delivery-initiative level, e.g. `2026-07-21-web-ui-experience-redesign`).
   It does not read `story.health`, `epic.health` (no such field exists — confirmed
   by scanning all 66 real epic objects in `.github/pipeline-state.json`: their only
   keys are `slug`/`name`/`status`/`stories`/`artefact`/`id`/`title`/`oversight`, never
   `health`), and it does not read `testPlan` or `dodStatus` in any form.
2. `feature.health` is set independently of test coverage. Coverage
   (`computeTestCoverageRollup`) is a completely separate computation reading
   `story.testPlan.passing`/`story.testPlan.totalTests`. Confirmed empirically
   against the real `.github/pipeline-state.json`: 6 real features have **zero**
   `testPlan` data on any of their stories (fully docs/ADR-only, e.g.
   `2026-04-14-skills-platform-phase3`), yet every one of them still carries an
   explicit `feature.health: "green"`. Health and coverage are structurally
   different fields, sourced from different parts of the schema — this is the
   real, already-existing "second signal" the epic's benefit linkage calls for.
3. Per-feature (not per-epic) is therefore the correct, real granularity for AC1 —
   epics have no independent health field to expose one at a finer grain without
   inventing new data, which is explicitly out of scope ("this story adds a
   per-feature breakdown of the same underlying concept, not a new concept").
4. **Complexity check-in (per DoR Warning W2):** the investigation did NOT reveal
   additional complexity beyond the story's Complexity Rating of 3 — the real
   signal (`feature.health`) already exists in the schema and requires no new
   data model, migration, or write path. This is a straightforward exposure of
   an already-independent field, not a new computation. No scope-expansion flag
   needed.

**AC2a concretization (resolves the placeholder now that the investigation is done):**

> **AC2a (concrete):** Given a real `pipeline-state.json` feature with an explicit
> `health` field, when the extended `computeHealthCounts` computes that feature's
> per-feature health entry, then the value equals that feature's own `health`
> field, normalized by the exact same rule already used for the aggregate (any
> value other than `green`/`amber`/`red` — including a missing field — normalizes
> to `unknown`). The per-feature value is never derived from `testPlan`,
> `dodStatus`, or any coverage computation.

This replaces the placeholder text in the story file's AC2a and the test plan's
gap row — both will be updated once Task 2 is committed (Task 5 below).

- [ ] Append an ARCH decision entry to `artefacts/2026-07-21-web-ui-experience-redesign/decisions.md`
      recording findings 1–4 above (title: "a3 investigation — real per-feature
      health source confirmed as `feature.health`").

---

## File map

```
Modify:
  src/web-ui/modules/product-rollup.js        — extend computeHealthCounts to also return a perFeature breakdown (AC1, AC2, AC2a)
  tests/check-pr-s2-product-rollup.js         — update T7/T8 for the extended shape; add new tests for AC1/AC2/AC2a/AC3/AC4
  tests/check-pr-s2-products-route.js         — add a regression test confirming the gauge renders unchanged with the extended health_counts shape (AC3)
  artefacts/2026-07-21-web-ui-experience-redesign/decisions.md   — investigation finding (ARCH entry)
  artefacts/2026-07-21-web-ui-experience-redesign/stories/a3-per-feature-health-signal.md  — concretize AC2a text
  artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a3-test-plan.md               — close the AC2a gap row
```

---

## Task 1: Extend `computeHealthCounts` to return a per-feature breakdown (AC1)

**Files:**
- Modify: `src/web-ui/modules/product-rollup.js`
- Test: `tests/check-pr-s2-product-rollup.js`

- [ ] **Step 1: Write the failing test**

```js
// New test in tests/check-pr-s2-product-rollup.js
queue.push(function() {
  console.log('\n[a3] T29 -- computeHealthCounts returns a perFeature breakdown alongside the aggregate (AC1)');
  return test('computeHealthCounts: perFeature array has one entry per feature with slug + normalized health', function() {
    var mod = freshRequire();
    var pipelineState = {
      features: [
        { slug: 'f1', name: 'Feature One', health: 'green' },
        { slug: 'f2', name: 'Feature Two', health: 'amber' }
      ]
    };
    var counts = mod.computeHealthCounts(pipelineState);
    assert.strictEqual(counts.green, 1);
    assert.strictEqual(counts.amber, 1);
    assert.ok(Array.isArray(counts.perFeature), 'Expected a perFeature array in the result');
    assert.strictEqual(counts.perFeature.length, 2);
    var f1 = counts.perFeature.find(function(f) { return f.slug === 'f1'; });
    assert.strictEqual(f1.health, 'green');
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: `[FAIL] computeHealthCounts: perFeature array has one entry per feature...` — `counts.perFeature` is `undefined`, `Array.isArray` assertion fails.

- [ ] **Step 3: Write minimal implementation**

```js
// src/web-ui/modules/product-rollup.js -- replace computeHealthCounts (AC1, AC2, AC2a)
/**
 * Counts features by their top-level health status (green/amber/red), using
 * "unknown" for any feature with no health field or an unrecognised value
 * (unchanged aggregate behaviour, byte-for-byte compatible with pr-s4). Also
 * returns a perFeature breakdown -- one entry per feature carrying its own
 * normalized health value, read directly from feature.health (AC1). This is
 * the ONLY input computeHealthCounts reads from pipeline-state.json -- traced
 * at a3 story time (see this story's implementation plan Task 0 and
 * decisions.md): feature.health is set independently of test-coverage data
 * (computeTestCoverageRollup reads story.testPlan instead), so per-feature
 * health here is a genuinely separate signal, not a repaint of coverage
 * (AC2, AC2a).
 *
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @returns {{green: number, amber: number, red: number, unknown: number, perFeature: Array<{slug: string, name: string|undefined, health: 'green'|'amber'|'red'|'unknown'}>}}
 */
function computeHealthCounts(pipelineState) {
  var counts = { green: 0, amber: 0, red: 0, unknown: 0, perFeature: [] };
  var features = (pipelineState && pipelineState.features) || [];

  features.forEach(function(feature) {
    var health = feature.health;
    if (health !== 'green' && health !== 'amber' && health !== 'red') {
      health = 'unknown';
    }
    counts[health]++;
    counts.perFeature.push({ slug: feature.slug, name: feature.name, health: health });
  });

  return counts;
}
```

- [ ] **Step 4: Update the two pre-existing tests (T7, T8) for the extended shape**

T7 and T8 (`tests/check-pr-s2-product-rollup.js`) use `assert.deepStrictEqual(counts, {...})`
against the exact aggregate object. Update both to assert the aggregate keys
individually (`counts.green`, `counts.amber`, etc.) instead of a whole-object
deep-equal, since the object now legitimately carries an additional
`perFeature` key. This is an intentional, documented shape extension (this
story's own AC1), not a regression — update, do not work around.

```js
// T7 (was assert.deepStrictEqual(counts, { green: 3, amber: 2, red: 1, unknown: 1 }))
assert.strictEqual(counts.green, 3);
assert.strictEqual(counts.amber, 2);
assert.strictEqual(counts.red, 1);
assert.strictEqual(counts.unknown, 1);
assert.strictEqual(counts.perFeature.length, 7, 'Expected one perFeature entry per input feature');
```

```js
// T8 (was assert.strictEqual(counts.unknown, 1))
assert.strictEqual(counts.unknown, 1);
assert.strictEqual(counts.perFeature[0].health, 'unknown', 'Expected the missing-health feature to normalize to unknown in perFeature too');
```

- [ ] **Step 5: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: all tests passing, including the new T29 and updated T7/T8.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/product-rollup.js tests/check-pr-s2-product-rollup.js
git commit -m "feat(a3): extend computeHealthCounts to return a per-feature health breakdown (AC1)"
```

---

## Task 2: Prove per-feature health is independent of coverage (AC2) and matches the confirmed real rule (AC2a)

**Files:**
- Test: `tests/check-pr-s2-product-rollup.js`

- [ ] **Step 1: Write the failing test**

```js
queue.push(function() {
  console.log('\n[a3] T30 -- a docs-only feature\'s per-feature health is not silently equal to a coverage-derived value, and matches the confirmed real signal (AC2, AC2a)');
  return test('computeHealthCounts: docs-only feature (zero testPlan data) still gets a real, independently-sourced health value', function() {
    var mod = freshRequire();
    // Docs-only feature: no story anywhere has testPlan data, but the feature
    // carries its own explicit health field -- this is the real shape found in
    // this repo's own pipeline-state.json (e.g. 2026-04-14-skills-platform-phase3).
    var pipelineState = {
      features: [
        { slug: 'docs-only', name: 'Docs Only Feature', health: 'green',
          stories: [ { slug: 's1' }, { slug: 's2' } ] } // no testPlan anywhere
      ]
    };
    var healthResult = mod.computeHealthCounts(pipelineState);
    var coverageResult = mod.computeTestCoverageRollup(pipelineState);

    // AC2: coverage has no data for this product at all (null/noData) -- the
    // per-feature health value is a real 'green', not silently mirroring that
    // no-data/null state.
    assert.strictEqual(coverageResult.blendedPercentage, null, 'Expected coverage to be null (no testPlan data anywhere)');
    assert.strictEqual(coverageResult.noData, true);
    var docsOnlyHealth = healthResult.perFeature.find(function(f) { return f.slug === 'docs-only'; });
    assert.strictEqual(docsOnlyHealth.health, 'green', 'Expected a real green health value, not a value derived from the (nonexistent) coverage percentage');
    assert.notStrictEqual(docsOnlyHealth.health, coverageResult.blendedPercentage, 'perFeatureHealth must not equal deriveFromCoverage(feature) -- the two must be genuinely different signals');

    // AC2a (concretized, see plan Task 0): health matches the confirmed real
    // rule exactly -- it equals feature.health, normalized, and changing
    // story-level testPlan/dodStatus data must NOT change it (proves the code
    // path is genuinely independent, not just coincidentally different output).
    var pipelineStateVariant = {
      features: [
        { slug: 'docs-only', name: 'Docs Only Feature', health: 'green',
          stories: [ { slug: 's1', testPlan: { totalTests: 100, passing: 0 } } ] } // now 0% coverage
      ]
    };
    var healthResultVariant = mod.computeHealthCounts(pipelineStateVariant);
    var docsOnlyHealthVariant = healthResultVariant.perFeature.find(function(f) { return f.slug === 'docs-only'; });
    assert.strictEqual(docsOnlyHealthVariant.health, 'green', 'Expected health to stay green (sourced from feature.health) even though coverage for the same feature dropped to 0% -- proves independence, not coincidental inequality');
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: fails only if Task 1 was skipped (perFeature undefined). If
Task 1 is already committed, this test should already pass — in that case,
confirm by temporarily reverting `feature.health` reads to something
coverage-derived (e.g. hardcoding `'unknown'` when `stories` has no
`testPlan`) and observe the assertion catch it, then revert back. This
guards against the RED step accidentally testing already-correct code.

- [ ] **Step 3: No new implementation needed** — this test asserts the behaviour
      already implemented in Task 1 (that `computeHealthCounts` reads only
      `feature.health`, never `testPlan`). If it fails, the Task 1
      implementation has a bug — fix `computeHealthCounts`, not this test.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: all tests passing, including T30.

- [ ] **Step 5: Commit**

```bash
git add tests/check-pr-s2-product-rollup.js
git commit -m "test(a3): prove per-feature health is independent of test coverage, matching the confirmed real signal rule (AC2, AC2a)"
```

---

## Task 3: Confirm existing aggregate consumers are unaffected (AC3)

**Files:**
- Test: `tests/check-pr-s2-products-route.js`

- [ ] **Step 1: Write the failing test (regression guard, should already pass — confirms no accidental breakage)**

```js
// New test in tests/check-pr-s2-products-route.js, alongside the existing
// AC1 health-gauge rendering test around line 212.
queue.push(function() { // (or inline per this file's own test-running convention)
  console.log('\n[a3] AC3 -- the Feature health gauge still renders correctly when health_counts includes the new perFeature field');
  return test('_renderProductView: extended health_counts (with perFeature) renders the same gauge output as before', function() {
    var mod = freshRequire(); // per this file's own require pattern
    var healthCountsJson = JSON.stringify({ green: 3, amber: 2, red: 1, unknown: 1, perFeature: [{ slug: 'f1', health: 'green' }] });
    // ...wire into the same mockPool / render call pattern already used at
    // line ~220 of this file, with health_counts: healthCountsJson...
    // assert the same four health labels render (✓ Healthy / ⚠ Warning / ✕ Blocked / ? Unknown)
    // and the overall signal section renders, exactly as the existing AC1 test does.
  });
});
```

- [ ] **Step 2: Run test — must fail only if a real regression exists**

```bash
node tests/check-pr-s2-products-route.js
```

Expected output: passes immediately (additive `perFeature` key does not
change `healthCounts[status]` lookups in `_renderProductView` — confirms AC3
by construction). If it fails, that reveals an actual regression in
`_renderProductView`'s health-gauge rendering — fix `products.js`, not the test.

- [ ] **Step 3: No implementation change expected.** `_renderProductView` reads
      `healthCounts.green`/`.amber`/`.red`/`.unknown` and
      `computeOverallHealthSignal(healthCounts)` — both ignore the new
      `perFeature` sibling key entirely. This step exists to prove that, not
      to change it.

- [ ] **Step 4: Run full existing pre-story gauge test unmodified**

```bash
node tests/check-pr-s2-products-route.js
```

Expected output: the original AC1 health-gauge test (unmodified) still passes,
exactly as the test plan's integration-test row requires.

- [ ] **Step 5: Commit**

```bash
git add tests/check-pr-s2-products-route.js
git commit -m "test(a3): confirm the Feature health gauge renders unchanged with the extended health_counts shape (AC3)"
```

---

## Task 4: Confirm persistence via sync (AC4)

**Files:**
- Test: `tests/check-pr-s2-product-rollup.js`

- [ ] **Step 1: Write the failing test**

```js
queue.push(function() {
  console.log('\n[a3] T31 -- syncProductRollup persists the perFeature health breakdown alongside the aggregate (AC4)');
  return test('syncProductRollup: the health_counts write includes perFeature entries, not recomputed per request', function() {
    var mod = freshRequire();
    var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
    delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
    var freshAdapterMod2 = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
    var fixture = { features: [{ slug: 'f1', name: 'Feature One', health: 'amber', stories: [{ dodStatus: 'complete' }] }] };
    freshAdapterMod2.setPipelineStateFetchAdapter(async function() {
      return { content: Buffer.from(JSON.stringify(fixture)).toString('base64'), encoding: 'base64' };
    });

    var capturedParams = null;
    var mockPool = {
      query: async function(sql, params) {
        if (/INSERT INTO product_rollups/i.test(sql)) { capturedParams = params; }
        return { rows: [] };
      }
    };

    return mod.syncProductRollup(mockPool, freshAdapterMod2, { productId: 'p1', repoOwner: 'acme', repoName: 'widgets', accessToken: 'x' }).then(function() {
      var healthJson = capturedParams.find(function(p) { return typeof p === 'string' && p.indexOf('perFeature') !== -1; });
      assert.ok(healthJson, 'Expected the persisted health_counts JSON to include the perFeature breakdown');
      var parsed = JSON.parse(healthJson);
      assert.strictEqual(parsed.perFeature[0].slug, 'f1');
      assert.strictEqual(parsed.perFeature[0].health, 'amber');
    });
  });
});
```

- [ ] **Step 2: Run test — must fail if Task 1 wasn't wired through** (it already is,
      since `syncProductRollup` calls `computeHealthCounts` directly and
      `JSON.stringify`s its full return value) — confirm PASS with no further
      implementation change needed. If it fails, the write path in
      `syncProductRollup` isn't passing the full return value through — fix
      that, not the test.

- [ ] **Step 3: No new implementation expected** — `syncProductRollup` already
      does `JSON.stringify(healthCounts)` with the full return value from
      `computeHealthCounts`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

- [ ] **Step 5: Commit**

```bash
git add tests/check-pr-s2-product-rollup.js
git commit -m "test(a3): confirm per-feature health persists through product-sync, not recomputed per request (AC4)"
```

---

## Task 5: Close out AC2a and the test-plan gap (documentation-only, no new code)

**Files:**
- Modify: `artefacts/2026-07-21-web-ui-experience-redesign/stories/a3-per-feature-health-signal.md` (AC2a text)
- Modify: `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a3-test-plan.md` (close the AC2a gap row, mark test added)
- Modify: `artefacts/2026-07-21-web-ui-experience-redesign/decisions.md` (append investigation finding, if not already done in Task 0)

- [ ] Update the story's AC2a line to the concretized wording from Task 0.
- [ ] Update the test plan's Coverage gaps / Test Gaps and Risks tables: AC2a
      now has a concrete unit test (T30 in `tests/check-pr-s2-product-rollup.js`),
      remove the 🔴 risk marker, change Gap type from "External-dependency" to
      "Closed — see T30".
- [ ] No code change in this task — artefact-only, bundled into the same PR per
      CLAUDE.md's "bundle first" rule for state/artefact updates.

```bash
git add artefacts/2026-07-21-web-ui-experience-redesign/stories/a3-per-feature-health-signal.md artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a3-test-plan.md artefacts/2026-07-21-web-ui-experience-redesign/decisions.md
git commit -m "docs(a3): concretize AC2a and close the test-plan gap now that the investigation is resolved"
```

---

## Out of scope for this plan (per story)

- Any UI rendering of per-feature health (A4's job).
- Redefining product-level `health_counts` semantics.
- Per-epic health (no independent epic-level health field exists in the real
  schema — see Task 0 finding 3).
