# The feature artefact-index page renders every document's real status, using the canonical trace — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in `tests/check-cat-s4-features-page-integration.js` pass, and confirm the golden-fixture byte-identical requirement (AC4) holds. Do not add scope beyond what the tests and ACs specify.
**Branch:** `feature/cat-s4`
**Worktree:** `.worktrees/cat-s4`
**Test command:** `node tests/check-cat-s4-features-page-integration.js` (new file), `node scripts/run-all-tests.js` (full suite — must also confirm `cat-s1`/`cat-s2`/`cat-s3`'s own suites are unaffected, since this story is the first real consumer of all three)

---

## Critical findings from reading the REAL current code (read before starting any task)

This story's DoR/design assumed a simpler wiring than what the real code requires. Two non-obvious shape mismatches were found that would silently break AC4's byte-identical requirement if missed — **read this section before writing any code**:

1. **Path shape mismatch.** `buildArtefactTrace`'s artefact `.path` field is already FEATURE-relative (e.g. `"dor/psh-s1-dor-contract.md"`, computed via `path.relative(resolvedDir, full)` inside `cat-s1`'s own `walkDir`). But every existing render function (`_renderFeatureLevelTable`, `renderArtefactMatrix`, `_extractEpicDocs`, `_deriveMatrixColumn` indirectly) calls `_relativeArtefactPath(a.path, featureSlug)`, which searches for the literal substring `featureSlug + '/'` inside `a.path` and strips everything up to and including it. A bare feature-relative path like `"dor/x.md"` contains NO such substring, so `_relativeArtefactPath` would return `''` for every single artefact — breaking every view link and matrix cell. **Fix: when adapting a trace artefact for rendering, reconstruct `.path` as `` `artefacts/${featureSlug}/${traceArtefact.path}` `` — the exact `artefacts/` vs `artefacts/archived/` prefix doesn't matter, since `_relativeArtefactPath` only searches for the `featureSlug + '/'` substring, not a specific prefix.**

2. **Type/label shape mismatch.** The OLD pipeline's artefact `.type` field is ALREADY a resolved display label (e.g. `"Ready Check"`, `"Stories"`) — `artefact-list.js`'s `deriveTypeFromPath` (redirected by `cat-s2`'s own Task 4 to the canonical table) returns a label, not a raw key. The render functions then call `getLabel(a.type)` a second time on that already-a-label string, which is a harmless pass-through today. `buildArtefactTrace`'s artefact `.type` field is the BARE SUBDIRECTORY KEY (e.g. `"dor"`, `"test-plans"`, `"stories"`) — passing this through unadapted would make `getLabel('test-plans')` fall through to its own generic fallback (`'Test-plans'`, hyphen-replaced/title-cased) instead of the correct `"Test Plan"`, since `getLabel`'s own `TYPE_LABELS` map only has 4 keys and doesn't know about `cat-s2`'s 14-subdirectory table. **Fix: when adapting a trace artefact, replace `.type` with `resolveLabel(traceArtefact.type, traceArtefact.filename)` (from `cat-s2`'s canonical table) BEFORE handing it to the existing render functions — this produces the exact same final label the old pipeline did for every subdirectory both pipelines recognise.**

3. **The routing gate itself must change.** `handleGetFeatureArtefacts` currently only uses the grouped/matrix rendering (`renderGroupedArtefactIndexHtml`) when `getFeatureStoryStructure` finds >1 real registered stories; a zero-registration feature like `phase4` currently falls through to the OLD flat `renderArtefactIndexHtml` dump entirely (the exact bug this epic exists to fix) — NOT `renderGroupedArtefactIndexHtml`. AC1 requires `phase4` to now render via the grouped/inferred view. **Fix: the routing gate changes from "only use the grouped renderer for >1 registered stories" to "always use the trace-based grouped renderer whenever the trace found real documents" — this is an intentional, in-scope behavior change for the previously-single-story/zero-story case, not a regression. AC4's own byte-identical guarantee is scoped specifically to the already->1-story, non-divergent case (the story's own named fixture already has 6 real stories), not to every feature.**

---

## File map

```
Modify:
  src/web-ui/routes/features.js   — new _buildGroupedFromTrace() adapter, matrix/story-row rendering
                                     extended for "Unregistered" pill and orphaned-registration gap
                                     state, handleGetFeatureArtefacts rewired to call buildArtefactTrace
                                     instead of getFeatureStoryStructure/groupArtefactsByStory, not-yet-
                                     synced handling added

Create:
  tests/check-cat-s4-features-page-integration.js
```

`src/web-ui/adapters/feature-story-structure.js` is NOT deleted or modified — it becomes dead code once `features.js` no longer calls it (confirm via grep at Task 4 that nothing else in `src/` still requires it; if something does, leave it in place and only stop calling it from `features.js`). `buildArtefactTrace`/`classifyDivergence`/`resolveLabel`/`resolveColumnKey` are NOT modified — this story is a pure consumer.

---

## Task 1: The trace→grouped adapter (AC1's foundation) ✅ DONE (b60d4112, fixup 0fdbf17d)

**Two-stage review:** spec compliance ✅ (rigorously independently re-derived both critical shape-mismatch fixes from first principles, not just trusted) | code quality — first pass found 1 **Critical** bug: `_adaptTraceArtefact` labeled every feature-root document ("discovery.md", "decisions.md", etc.) as the generic "Feature Level", since `resolveLabel('feature-level', ...)` has no matching key — invisible to AC4's own golden-fixture test because that fixture happens to have zero root-level files. Fixed in `0fdbf17d` by routing feature-level artefacts through the existing `labelFromPath(filename)` function instead → ✅ Approved.

**Recommended model class:** deep-reasoning — this is the task with the two critical shape-mismatch fixes described above; a subtle mistake here breaks every other task silently.

**Files:**
- Modify: `src/web-ui/routes/features.js`
- Test: `tests/check-cat-s4-features-page-integration.js`

- [ ] **Step 1: Write the failing test**

```js
'use strict';
// check-cat-s4-features-page-integration.js -- cat-s4: /features/:slug renders
// from the canonical trace (cat-s1's buildArtefactTrace + cat-s3's
// classifyDivergence + cat-s2's resolveLabel), replacing the independent
// feature-story-structure.js derivation. ADR-028.

var assert = require('assert');
var path = require('path');

var FEATURES_PATH = path.resolve(__dirname, '../src/web-ui/routes/features.js');
var REPO_ROOT = path.resolve(__dirname, '..');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

var mod = freshRequire(FEATURES_PATH);

console.log('\n[cat-s4] AC1 (foundation) -- _buildGroupedFromTrace reconstructs render-compatible paths and labels');
{
  var fakeTrace = {
    status: 'found',
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [{ slug: 's1', name: 'Story One', epicSlug: 'e1', divergence: 'registered' }],
    artefacts: [
      { path: 'dor/s1-dor-contract.md', type: 'dor', filename: 's1-dor-contract.md', storySlug: 's1', divergence: 'registered' },
      { path: 'discovery.md', type: 'feature-level', filename: 'discovery.md', storySlug: null, divergence: 'unregistered', inferredGroup: null }
    ]
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'test-feature-x');
  test('story artefact path is reconstructed to contain featureSlug/ as a substring', function() {
    var storyArtefact = grouped.epics[0].stories[0].artefacts[0];
    assert.ok(storyArtefact.path.indexOf('test-feature-x/') !== -1, 'expected featureSlug in path, got: ' + storyArtefact.path);
    assert.ok(storyArtefact.path.indexOf('dor/s1-dor-contract.md') !== -1);
  });
  test('story artefact type is resolved to a real label, not the raw subdirectory key', function() {
    var storyArtefact = grouped.epics[0].stories[0].artefacts[0];
    assert.notStrictEqual(storyArtefact.type, 'dor');
    assert.strictEqual(storyArtefact.type, 'Ready Check');
  });
  test('feature-level artefact lands in featureLevel, not attached to any story', function() {
    assert.strictEqual(grouped.featureLevel.length, 1);
    assert.strictEqual(grouped.featureLevel[0].path.indexOf('discovery.md') !== -1, true);
  });
}

console.log('\n[cat-s4] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s4-features-page-integration.js
```

Expected output: `TypeError: mod._buildGroupedFromTrace is not a function`

- [ ] **Step 3: Write minimal implementation**

Add to `src/web-ui/routes/features.js`, near the other adapter functions (after `_deriveMatrixColumn`/before `_extractEpicDocs` is a reasonable spot), requiring the 3 new modules at the top of the file alongside the existing requires:

```js
const { buildArtefactTrace } = require('../adapters/artefact-trace');
const { resolveLabel } = require('../utils/artefact-labels');
```

(`classifyDivergence` is already wired into `buildArtefactTrace` by `cat-s3` — no separate import needed.)

```js
/**
 * cat-s4: reconstructs a trace artefact into the shape the existing render
 * functions (_renderFeatureLevelTable, renderArtefactMatrix, _extractEpicDocs)
 * already expect -- these functions are NOT modified, only their data source is.
 * Two non-obvious fixes here (see cat-s4-plan.md's own "Critical findings"
 * section for the full reasoning):
 *   1. path is reconstructed to `artefacts/<featureSlug>/<relPath>` because
 *      _relativeArtefactPath searches for the literal featureSlug+'/' substring
 *      -- a bare feature-relative path from buildArtefactTrace has no such
 *      substring and would silently break every view link.
 *   2. type is resolved via resolveLabel (cat-s2's canonical table) because
 *      buildArtefactTrace's raw subdirectory key ('test-plans') is not the
 *      same string the OLD pipeline's already-a-label type field held
 *      ('Test Plan') -- getLabel(a.type) downstream would produce the wrong
 *      fallback label if fed the raw key directly.
 * @param {object} traceArtefact one entry from buildArtefactTrace's artefacts[]
 * @param {string} featureSlug
 * @returns {object} { path, type, divergence, inferredGroup, storySlug }
 */
function _adaptTraceArtefact(traceArtefact, featureSlug) {
  return {
    path: `artefacts/${featureSlug}/${traceArtefact.path}`,
    type: resolveLabel(traceArtefact.type, traceArtefact.filename),
    storySlug: traceArtefact.storySlug || null,
    divergence: traceArtefact.divergence,
    inferredGroup: traceArtefact.inferredGroup || null
  };
}

/**
 * cat-s4: converts buildArtefactTrace's classified {epics, stories, artefacts}
 * into the {featureLevel, epics, flatStories} shape renderGroupedArtefactIndexHtml
 * and renderArtefactMatrix already consume (feature-story-structure.js's own
 * groupArtefactsByStory produced this same shape; this function replaces it
 * as the ONE canonical source of that shape, per ADR-028).
 * @param {object} trace  a 'found'-status result from buildArtefactTrace
 * @param {string} featureSlug
 * @returns {{featureLevel: Array, epics: Array, flatStories: Array}}
 */
function _buildGroupedFromTrace(trace, featureSlug) {
  const featureLevel = [];
  const byStorySlug = {};
  trace.stories.forEach((story) => { byStorySlug[story.slug] = []; });

  trace.artefacts.forEach((artefact) => {
    const adapted = _adaptTraceArtefact(artefact, featureSlug);
    if (adapted.storySlug && byStorySlug[adapted.storySlug]) {
      byStorySlug[adapted.storySlug].push(adapted);
    } else if (artefact.type === 'feature-level') {
      featureLevel.push(adapted);
    } else {
      // Not attached to a real story, not a feature-root file -- Task 2/3
      // extend this branch to route into inferred-group / unregistered
      // buckets rather than silently dropping it. Placeholder for Task 1.
      featureLevel.push(adapted);
    }
  });

  const epicsBySlug = {};
  trace.epics.forEach((epic) => { epicsBySlug[epic.slug] = { epicName: epic.name, epicSlug: epic.slug, stories: [] }; });
  const flatStories = [];
  trace.stories.forEach((story) => {
    const storyEntry = { slug: story.slug, artefacts: byStorySlug[story.slug] || [], divergence: story.divergence };
    if (story.epicSlug && epicsBySlug[story.epicSlug]) {
      epicsBySlug[story.epicSlug].stories.push(storyEntry);
    } else {
      flatStories.push(storyEntry);
    }
  });

  return { featureLevel, epics: Object.values(epicsBySlug), flatStories };
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s4-features-page-integration.js
```

Expected output: `[cat-s4] Results: 3 passed, 0 failed`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure(s). Confirm `tests/check-fadm-s1-document-matrix.js`, `tests/check-cat-s1-core-trace-builder.js`, `tests/check-cat-s2-unified-label-table.js`, `tests/check-cat-s3-divergence-classification.js` are all unaffected (this task is purely additive to `features.js`, no existing function modified yet).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/features.js tests/check-cat-s4-features-page-integration.js
git commit -m "feat(cat-s4): add _buildGroupedFromTrace adapter converting buildArtefactTrace output to the existing render shape"
```

---

## Task 2: "Unregistered" pill rendering (AC2)

**Recommended model class:** balanced.

**Files:**
- Modify: `src/web-ui/routes/features.js`
- Test: `tests/check-cat-s4-features-page-integration.js`

- [ ] **Step 1: Write the failing test**

Append, before the `Results` log line:

```js
console.log('\n[cat-s4] AC2 -- unregistered document with no inferredGroup gets its own labeled bucket with a visible Unregistered pill');
{
  var fakeTrace = {
    status: 'found', epics: [], stories: [],
    artefacts: [
      { path: 'stray-notes.md', type: 'feature-level', filename: 'stray-notes.md', storySlug: null, divergence: 'unregistered', inferredGroup: null }
    ]
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'test-feature-y');
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'test-feature-y', {});
  test('rendered output contains a visible "Unregistered" pill', function() {
    assert.ok(html.indexOf('Unregistered') !== -1, 'expected "Unregistered" text in rendered output');
    assert.ok(html.indexOf('sw-pill') !== -1, 'expected the pill CSS class to be used');
  });
}

console.log('\n[cat-s4] AC2 -- unregistered artefact with an inferredGroup renders inside that inferred grouping, still flagged');
{
  var fakeTrace = {
    status: 'found', epics: [], stories: [],
    artefacts: [
      { path: 'phase4-story-3-notes.md', type: 'feature-level', filename: 'phase4-story-3-notes.md', storySlug: null, divergence: 'unregistered', inferredGroup: 'phase4-story-3' },
      { path: 'phase4-story-3-plan.md', type: 'feature-level', filename: 'phase4-story-3-plan.md', storySlug: null, divergence: 'unregistered', inferredGroup: 'phase4-story-3' }
    ]
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'phase4-fixture');
  test('both inferred-group artefacts land in the same synthetic story bucket', function() {
    var inferredBucket = grouped.flatStories.find(function(s) { return s.slug === 'phase4-story-3'; });
    assert.ok(inferredBucket, 'expected a synthetic story bucket keyed by the inferredGroup value');
    assert.strictEqual(inferredBucket.artefacts.length, 2);
  });
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'phase4-fixture', {});
  test('rendered output still shows Unregistered for the inferred-group artefacts', function() {
    assert.ok(html.indexOf('Unregistered') !== -1);
  });
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s4-features-page-integration.js
```

Expected output: the inferred-group bucket test fails (`_buildGroupedFromTrace` currently dumps everything unmatched into `featureLevel`, not a synthetic per-inferredGroup bucket), and the pill tests fail (no rendering support for `divergence`/`inferredGroup` yet).

- [ ] **Step 3: Write minimal implementation**

Update `_buildGroupedFromTrace`'s artefact-routing branch (the `else` clause from Task 1) to route unregistered, non-feature-level artefacts into a synthetic per-`inferredGroup` bucket (or a shared `'Unregistered'` catch-all bucket when there's no `inferredGroup`), appended to `flatStories`:

```js
  const inferredBuckets = {};
  const unregisteredCatchAll = { slug: 'Unregistered', artefacts: [] };

  trace.artefacts.forEach((artefact) => {
    const adapted = _adaptTraceArtefact(artefact, featureSlug);
    if (adapted.storySlug && byStorySlug[adapted.storySlug]) {
      byStorySlug[adapted.storySlug].push(adapted);
    } else if (artefact.type === 'feature-level' && !artefact.inferredGroup) {
      featureLevel.push(adapted);
    } else if (artefact.inferredGroup) {
      if (!inferredBuckets[artefact.inferredGroup]) inferredBuckets[artefact.inferredGroup] = { slug: artefact.inferredGroup, artefacts: [] };
      inferredBuckets[artefact.inferredGroup].artefacts.push(adapted);
    } else {
      unregisteredCatchAll.artefacts.push(adapted);
    }
  });
```

(Replace Task 1's simpler placeholder branch with this. Note: a `feature-level` artefact with a real `inferredGroup` now correctly routes to the inferred bucket instead of `featureLevel` — `phase4`'s own root-level unregistered files can still be usefully grouped.)

At the end of `_buildGroupedFromTrace`, before the `return`, append the inferred buckets and catch-all to `flatStories` (only if non-empty):

```js
  Object.values(inferredBuckets).forEach((bucket) => flatStories.push(bucket));
  if (unregisteredCatchAll.artefacts.length > 0) flatStories.push(unregisteredCatchAll);
```

Now add pill rendering. In `renderArtefactMatrix`'s `storyRows` mapping (the `cells` computation), change the tick-cell rendering to include an "Unregistered" pill when the artefact's `divergence === 'unregistered'`:

```js
      const cells = columns.map((k) => {
        const a = byColumn[k];
        if (!a) return '<td class="doc-matrix__dash">–</td>';
        const relPath = _relativeArtefactPath(a.path || '', featureSlug) || (a.type || '');
        const viewUrl = `/artefact/${featureSlug}/${encodeURIComponent(relPath)}`;
        const resumable = resumeLookup[a.path || ''];
        const resumeLink = resumable
          ? ` <a class="doc-matrix__resume-link" href="/journey/${encodeURIComponent(resumable.journeyId)}/stage/${encodeURIComponent(resumable.skillName)}" title="Resume conversation">↻</a>`
          : '';
        const unregisteredPill = a.divergence === 'unregistered'
          ? ' <span class="sw-pill sw-pill--nodot sw-pill--neutral" title="Not registered in pipeline-state.json">Unregistered</span>'
          : '';
        return `<td><a class="doc-matrix__tick" href="${shellEscHtml(viewUrl)}" title="Open document">✓</a>${resumeLink}${unregisteredPill}</td>`;
      }).join('');
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s4-features-page-integration.js
```

Expected output: all Task 1 + Task 2 tests pass.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure(s). **This step now modifies `renderArtefactMatrix`, an existing `fadm-s1`-shipped function** — specifically confirm `tests/check-fadm-s1-document-matrix.js` still passes, since you've added a conditional pill that must not appear for any artefact without `divergence === 'unregistered'` (the fadm-s1 fixtures don't set `divergence` at all, so `a.divergence === 'unregistered'` is `false` for `undefined`, and the pill should not render — verify this explicitly, don't just trust it).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/features.js tests/check-cat-s4-features-page-integration.js
git commit -m "feat(cat-s4): add visible Unregistered pill and inferred-group bucketing to the artefact matrix"
```

---

## Task 3: orphaned-registration gap state (AC3)

**Recommended model class:** balanced.

**Files:**
- Modify: `src/web-ui/routes/features.js`
- Test: `tests/check-cat-s4-features-page-integration.js`

- [ ] **Step 1: Write the failing test**

Append, before the `Results` log line:

```js
console.log('\n[cat-s4] AC3 -- orphaned-registration story shows a distinct gap state, not silently dropped');
{
  var fakeTrace = {
    status: 'found', epics: [],
    stories: [{ slug: 'ghost-s1', name: 'Ghost Story', divergence: 'orphaned-registration' }],
    artefacts: []
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'ghost-feature');
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'ghost-feature', {});
  test('orphaned-registration story still appears in the rendered output', function() {
    assert.ok(html.indexOf('ghost-s1') !== -1, 'expected the orphaned story slug to appear');
  });
  test('orphaned-registration gap marker is distinct from the Unregistered pill text', function() {
    assert.ok(html.indexOf('No files found') !== -1 || html.indexOf('orphaned') !== -1 || html.indexOf('Registered, but') !== -1,
      'expected a distinct gap-state message, got HTML with no recognisable gap marker');
  });
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s4-features-page-integration.js
```

Expected output: both assertions fail — `renderArtefactMatrix` currently filters out any story with `artefacts.length === 0` entirely (`(epic.stories || []).filter((s) => s.artefacts.length > 0)`), so an orphaned-registration story with zero artefacts is silently dropped from rendering today.

- [ ] **Step 3: Write minimal implementation**

In `renderArtefactMatrix`, change the story-filtering logic to keep a story if it either has real artefacts OR is flagged `orphaned-registration`:

```js
  (grouped.epics || []).forEach((epic) => {
    const stories = (epic.stories || []).filter((s) => s.artefacts.length > 0 || s.divergence === 'orphaned-registration');
    if (stories.length > 0) {
      rowGroups.push({ epicName: epic.epicName || epic.epicSlug || '', epicSlug: epic.epicSlug || null, stories });
    }
  });
  const flatWithArtefacts = (grouped.flatStories || []).filter((s) => s.artefacts.length > 0 || s.divergence === 'orphaned-registration');
```

Then in the `storyRows` mapping, add a distinct rendering branch for a story with zero artefacts:

```js
    const storyRows = group.stories.map((story) => {
      if (story.artefacts.length === 0 && story.divergence === 'orphaned-registration') {
        return `<tr><td class="doc-matrix__story-col">${shellEscHtml(story.slug)}</td>` +
          `<td colspan="${colCount - 1}" class="doc-matrix__dash" title="Registered in pipeline-state.json but no matching file found on disk">Registered, but no files found</td></tr>`;
      }
      const byColumn = {};
      // ... existing byColumn/cells/statusCell logic unchanged for the normal case
```

(Insert this early-return branch at the top of the existing `storyRows` map callback — do not restructure the rest of that function.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s4-features-page-integration.js
```

Expected output: all Task 1-3 tests pass.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure(s). Confirm `tests/check-fadm-s1-document-matrix.js` still passes — its own fixtures never set `divergence: 'orphaned-registration'`, so the new filter condition's second clause (`s.divergence === 'orphaned-registration'`) is always `false` for them, preserving the original `artefacts.length > 0` filtering behaviour exactly.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/features.js tests/check-cat-s4-features-page-integration.js
git commit -m "feat(cat-s4): show a distinct gap state for orphaned-registration stories instead of silently dropping them"
```

---

## Task 4: Wire into handleGetFeatureArtefacts, not-yet-synced, routing gate change (AC4, AC5)

**Recommended model class:** deep-reasoning — this is the highest-risk task (modifies the live route handler; AC4's byte-identical guarantee depends entirely on getting this exactly right).

**Files:**
- Modify: `src/web-ui/routes/features.js`
- Test: `tests/check-cat-s4-features-page-integration.js`

- [ ] **Step 1: CAPTURE THE GOLDEN FIXTURE FIRST — before any other change in this task**

Before touching `handleGetFeatureArtefacts`, run the CURRENT (pre-this-task) route handler against the real, on-disk, fully-registered `2026-09-06-feature-artefact-document-matrix` feature (this repo's own dogfooding feature — 6 real stories, `cat-s1` through `cat-s6`) and save the exact HTML output to a fixture file for later comparison. Add this capture as a one-time script or an inline step — do not skip this. If you cannot exercise the real route handler directly (it needs `req`/`res`/`pool` objects), construct minimal mocks matching the existing test patterns already used elsewhere in this file's own test suite for `handleGetFeatureArtefacts` (search `tests/` for existing callers of this function for a template) — the goal is a byte-for-byte HTML snapshot of the `listHtml` portion specifically (the part `renderGroupedArtefactIndexHtml` produces), not the full page shell.

- [ ] **Step 2: Write the failing test**

Append, before the `Results` log line:

```js
console.log('\n[cat-s4] AC5 -- not-yet-synced feature shows a clear message, not a crash or empty page');
{
  var os = require('os');
  var unsyncedRoot = path.join(os.tmpdir(), 'wuce-unsynced-cat-s4-' + Date.now());
  var trace = mod._traceForRoute ? mod._traceForRoute(unsyncedRoot, 'any-slug') : require('../src/web-ui/adapters/artefact-trace').buildArtefactTrace(unsyncedRoot, 'any-slug');
  test('buildArtefactTrace itself returns not-yet-synced for this fixture', function() {
    assert.strictEqual(trace.status, 'not-yet-synced');
  });
}

console.log('\n[cat-s4] AC4 -- fully-registered, non-divergent feature renders byte-identical to the pre-cat-s4 golden fixture');
{
  var traceMod = require('../src/web-ui/adapters/artefact-trace');
  var trace = traceMod.buildArtefactTrace(REPO_ROOT, '2026-09-06-feature-artefact-document-matrix');
  var grouped = mod._buildGroupedFromTrace(trace, '2026-09-06-feature-artefact-document-matrix');
  var html = mod.renderGroupedArtefactIndexHtml(grouped, '2026-09-06-feature-artefact-document-matrix', {});
  var fs = require('fs');
  var goldenPath = path.resolve(__dirname, 'fixtures', 'cat-s4-golden-fadm-output.html');
  test('golden fixture file exists (captured in Step 1 before this task changed anything)', function() {
    assert.ok(fs.existsSync(goldenPath), 'expected the golden fixture captured in Step 1 at ' + goldenPath);
  });
  test('current output matches the golden pre-cat-s4 fixture byte-for-byte', function() {
    if (!fs.existsSync(goldenPath)) return; // already flagged by the previous test
    var golden = fs.readFileSync(goldenPath, 'utf8');
    assert.strictEqual(html, golden);
  });
}
```

- [ ] **Step 3: Run test — must fail (before wiring)**

```bash
node tests/check-cat-s4-features-page-integration.js
```

Expected output: the AC4 golden-fixture comparison likely fails or is close — this is expected until Step 4's wiring is complete AND the golden fixture from Step 1 is confirmed to match exactly what `_buildGroupedFromTrace` + the existing render functions now produce. If there's a genuine mismatch (not just "test doesn't exist yet"), that's real signal that Tasks 1-3's adapter has a bug — investigate and fix the adapter, do not adjust the golden fixture to match broken output.

- [ ] **Step 4: Write minimal implementation**

In `handleGetFeatureArtefacts`, replace the block:

```js
      const storyStructure = getFeatureStoryStructure(repoRoot, resolvedSlug);
      const totalStoryCount = storyStructure
        ? storyStructure.epics.reduce((sum, e) => sum + e.storySlugs.length, 0) + storyStructure.flatStorySlugs.length
        : 0;
      listHtml = (storyStructure && totalStoryCount > 1)
        ? renderGroupedArtefactIndexHtml(groupArtefactsByStory(artefacts, storyStructure), resolvedSlug, resumeLookup)
        : renderArtefactIndexHtml(artefacts, resolvedSlug, resumeLookup);
```

with:

```js
      const trace = buildArtefactTrace(repoRoot, resolvedSlug);
      if (trace.status === 'not-yet-synced') {
        listHtml = '<p class="artefact-list__empty">Still syncing this feature\'s artefacts — check back shortly.</p>';
      } else if (trace.status === 'found') {
        const grouped = _buildGroupedFromTrace(trace, resolvedSlug);
        listHtml = renderGroupedArtefactIndexHtml(grouped, resolvedSlug, resumeLookup);
      } else {
        // 'not-found' -- buildArtefactTrace found nothing on disk for this
        // slug, even though _listArtefacts (above) returned some artefacts
        // (e.g. Postgres-only rows with no local checkout backing them).
        // Fall back to the pre-cat-s4 flat rendering for this narrow case --
        // disk is canonical (ADR-029) for the grouped view, but content that
        // only exists in Postgres still deserves to be shown, just not
        // grouped/classified.
        listHtml = renderArtefactIndexHtml(artefacts, resolvedSlug, resumeLookup);
      }
```

**Important:** `getFeatureStoryStructure`/`groupArtefactsByStory` imports at the top of the file (line 24) become unused once this change lands — remove the `require('../adapters/feature-story-structure')` line entirely, but first grep the whole repo for any OTHER caller of `getFeatureStoryStructure`/`groupArtefactsByStory` (`grep -rn "feature-story-structure" src/`). If none exist outside this now-removed usage, the module file itself becomes dead code — leave the file in place (do not delete it in this task; confirm with the orchestrating session whether deletion is in scope before doing so) but do remove the now-unused import and the two now-unused local functions/branches this replaces.

Also fix the stale ADR-023 miscitation this story's own review flagged as "implementation-time work, not a definition/review-stage action" (see `decisions.md`, 2026-09-06 ARCH entry): if `feature-story-structure.js` is being fully retired by this change, this fix is moot (the file's own comment goes with it functionally, even if the file remains on disk unused). If it turns out something else still requires it, correct its line 7 comment from `ADR-023` to `ADR-029` while you're confirming that.

- [ ] **Step 5: Run test — must pass**

```bash
node tests/check-cat-s4-features-page-integration.js
```

Expected output: all tests pass, including the AC4 byte-identical golden-fixture comparison and the AC5 not-yet-synced test.

- [ ] **Step 6: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure(s). This is the most consequential regression check in this whole story — this task changes `handleGetFeatureArtefacts`, a real, live route handler with its own existing test coverage across multiple prior stories (`fapg-s1`, `fal-s1`, `alrf-s4`, `alrf-s10`, `dfr-s1`, `fadm-s1`, `pncg-s1`, and others named in the file's own comments). Specifically identify and run every existing test file that exercises this handler (grep `tests/` for `handleGetFeatureArtefacts`) and confirm each still passes — list them explicitly in your report, do not just report the aggregate full-suite number.

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/features.js tests/check-cat-s4-features-page-integration.js tests/fixtures/cat-s4-golden-fadm-output.html
git commit -m "feat(cat-s4): wire buildArtefactTrace into handleGetFeatureArtefacts, replacing feature-story-structure.js's independent derivation"
```

---

## Task 5: NFR tests and final regression pass

**Recommended model class:** fast/cheap.

**Files:**
- Modify: `tests/check-cat-s4-features-page-integration.js`

- [ ] **Step 1: Write the failing test**

Append, before the `Results` log line:

```js
console.log('\n[cat-s4] NFR -- page render for phase4-scale (205 files) does not regress beyond the walk+classify budget');
{
  var traceMod = require('../src/web-ui/adapters/artefact-trace');
  var start = process.hrtime.bigint();
  var trace = traceMod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4');
  var grouped = mod._buildGroupedFromTrace(trace, '2026-04-19-skills-platform-phase4');
  mod.renderGroupedArtefactIndexHtml(grouped, '2026-04-19-skills-platform-phase4', {});
  var elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  test('walk + classify + adapt + render completes well under 100ms for 205 files (measured: ' + elapsedMs.toFixed(1) + 'ms)', function() {
    assert.ok(elapsedMs < 100, 'expected < 100ms, got ' + elapsedMs.toFixed(1) + 'ms');
  });
}

console.log('\n[cat-s4] NFR -- Unregistered indicator never relies on color alone (MC-A11Y-02)');
{
  var fakeTrace = {
    status: 'found', epics: [], stories: [],
    artefacts: [{ path: 'x.md', type: 'feature-level', filename: 'x.md', storySlug: null, divergence: 'unregistered', inferredGroup: null }]
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'a11y-check');
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'a11y-check', {});
  test('the Unregistered pill carries visible text, not a color-only indicator', function() {
    assert.ok(/sw-pill[^>]*>[^<]*Unregistered/.test(html), 'expected visible "Unregistered" text inside the pill markup');
  });
}
```

- [ ] **Step 2: Run test**

```bash
node tests/check-cat-s4-features-page-integration.js
```

These are NOT expected to fail if Tasks 1-4 are correct — they're NFR assertions against already-working code. If either genuinely fails, investigate and fix (do not weaken the threshold to force a pass).

- [ ] **Step 3: Write minimal implementation**

No implementation change expected if Tasks 1-4 are correct.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s4-features-page-integration.js
```

Expected output: full file green.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure(s).

- [ ] **Step 6: Commit**

```bash
git add tests/check-cat-s4-features-page-integration.js
git commit -m "test(cat-s4): add NFR performance and accessibility checks, completing cat-s4's full AC coverage"
```

---

## Post-implementation note for /verify-completion

Walk through `artefacts/2026-09-06-canonical-artefact-trace/verification-scripts/cat-s4-features-page-integration-verification.md` scenario by scenario — this story's Scenario 4 (already-correct feature renders unchanged) and Scenario 1 (phase4 shows all 205 documents) both require **manually opening the live page in a browser**, not just running the automated test file, since the verification script's own Setup section requires a running server and real login. Do not skip the manual walkthrough for this story even if all automated tests pass — this is the first story in the epic that changes a real, user-visible page.
