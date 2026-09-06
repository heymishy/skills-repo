# Classify every divergence case the audit found, not just the common one — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in `tests/check-cat-s3-divergence-classification.js` pass. Do not add scope beyond what the tests and ACs specify.
**Branch:** `feature/cat-s3`
**Worktree:** `.worktrees/cat-s3`
**Test command:** `node tests/check-cat-s3-divergence-classification.js` (new file), `node scripts/run-all-tests.js` (full suite)

---

## File map

```
Modify:
  src/web-ui/adapters/artefact-trace.js       — add classifyDivergence(traceResult), declared above
                                                 buildArtefactTrace in the file, wire it into
                                                 buildArtefactTrace's 'found' branch
Create:
  tests/check-cat-s3-divergence-classification.js
```

`cat-s1` (this same module) is already merged to master. Read the current, real content of `src/web-ui/adapters/artefact-trace.js` before starting — it exports `buildArtefactTrace(repoRoot, featureSlug)`, currently returning `{ status: 'found', resolvedDir, epics, stories, artefacts }` where each artefact already has `storySlug` (a real story slug or `null`) from `cat-s1`'s own longest-prefix-match logic.

---

## Task 1: Core classification — registered, unregistered, orphaned-registration (AC2, AC4) ✅ DONE (5afb75a7, fixup bdbc1464)

**Two-stage review:** spec compliance ✅ (re-verified after fixup, confirmed pure refactor with byte-identical classification logic) | code quality — first pass found 2 Important issues: (1) unused `feature` parameter with no concrete task actually needing it — dropped entirely, `classifyDivergence` now takes just `traceResult`; (2) a TDZ-safety comment justified a fragile ordering invariant instead of removing it — fixed by declaring `classifyDivergence` above `buildArtefactTrace` as a fourth helper alongside `walkDir`/`readPipelineStateForSlug` → ✅ Approved. 4 Minor items left as documented, non-escalating nits (field-naming, test-header overclaim re: not-yet-synced coverage, one harmless redundant assertion, undocumented-but-fine O(stories×artefacts) scan).

**Recommended model class:** balanced.

**Files:**
- Modify: `src/web-ui/adapters/artefact-trace.js`
- Test: `tests/check-cat-s3-divergence-classification.js`

- [ ] **Step 1: Write the failing test**

```js
'use strict';
// check-cat-s3-divergence-classification.js -- cat-s3: classifies every
// artefact and story in a trace as registered, unregistered, or
// orphaned-registration, plus a feature-level not-yet-synced passthrough.
// Extends cat-s1's artefact-trace.js (ADR-028/029) with one more pass over
// already-collected data -- no second directory walk (Performance NFR).

var assert = require('assert');
var path = require('path');

var TRACE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-trace.js');
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

var mod = freshRequire(TRACE_PATH);

console.log('\n[cat-s3] AC4 -- correctly-matched document is marked registered with no flag');
{
  var trace = {
    status: 'found',
    epics: [],
    stories: [{ slug: 's1', name: 'Story 1' }],
    artefacts: [{ path: 'stories/s1-foo.md', type: 'stories', filename: 's1-foo.md', storySlug: 's1' }]
  };
  var result = mod.classifyDivergence(trace);
  test('matched artefact classification is registered', function() {
    assert.strictEqual(result.artefacts[0].divergence, 'registered');
  });
  test('registered story classification is registered', function() {
    assert.strictEqual(result.stories[0].divergence, 'registered');
  });
}

console.log('\n[cat-s3] AC2 -- registered story with zero matching files is orphaned-registration');
{
  var trace = {
    status: 'found',
    epics: [],
    stories: [{ slug: 'ghost-s1', name: 'Ghost Story' }],
    artefacts: []
  };
  var result = mod.classifyDivergence(trace);
  test('story with no matching artefacts is orphaned-registration', function() {
    assert.strictEqual(result.stories[0].divergence, 'orphaned-registration');
  });
}

console.log('\n[cat-s3] AC2 (non-conflation) -- orphaned-registration is never the same value as unregistered');
{
  var trace = {
    status: 'found',
    epics: [],
    stories: [{ slug: 'ghost-s1', name: 'Ghost Story' }],
    artefacts: [{ path: 'orphan.md', type: 'feature-level', filename: 'orphan.md', storySlug: null }]
  };
  var result = mod.classifyDivergence(trace);
  test('orphaned story and unregistered artefact have distinct classification values', function() {
    assert.notStrictEqual(result.stories[0].divergence, result.artefacts[0].divergence);
    assert.strictEqual(result.stories[0].divergence, 'orphaned-registration');
    assert.strictEqual(result.artefacts[0].divergence, 'unregistered');
  });
}

console.log('\n[cat-s3] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s3-divergence-classification.js
```

Expected output: `TypeError: mod.classifyDivergence is not a function`

- [ ] **Step 3: Write minimal implementation**

Add to `src/web-ui/adapters/artefact-trace.js`, above `module.exports`:

```js
/**
 * Classify every artefact and story in an already-built trace result as
 * 'registered', 'unregistered' (artefacts only), or 'orphaned-registration'
 * (stories only). Operates on the already-collected data from
 * buildArtefactTrace's own single pass -- performs no filesystem I/O and
 * adds no additional directory traversal (Performance NFR).
 * @param {object} traceResult  the object buildArtefactTrace produces internally
 *   before returning (status: 'found', with epics/stories/artefacts already populated) --
 *   this is sufficient on its own; no separate pipeline-state/feature parameter is
 *   needed since traceResult.stories/artefacts already reflect it (a `feature`
 *   parameter was considered and dropped during Task 1's own code-quality review
 *   as unused, speculative surface area -- add it back only when a real
 *   classification rule genuinely needs a field not already on traceResult)
 * @returns {object} a new object, same shape as traceResult, with a
 *   `divergence` field added to every artefact and every story
 */
function classifyDivergence(traceResult) {
  if (traceResult.status !== 'found') {
    // not-yet-synced / not-found: nothing to classify (AC3's own precedence
    // is automatically satisfied here -- there is no per-document data yet).
    return traceResult;
  }

  var artefacts = traceResult.artefacts.map(function(artefact) {
    return Object.assign({}, artefact, {
      divergence: artefact.storySlug ? 'registered' : 'unregistered'
    });
  });

  var stories = traceResult.stories.map(function(story) {
    var hasMatchingArtefact = artefacts.some(function(a) { return a.storySlug === story.slug; });
    return Object.assign({}, story, {
      divergence: hasMatchingArtefact ? 'registered' : 'orphaned-registration'
    });
  });

  return Object.assign({}, traceResult, { artefacts: artefacts, stories: stories });
}
```

Update `module.exports = { buildArtefactTrace };` to `module.exports = { buildArtefactTrace, classifyDivergence };`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s3-divergence-classification.js
```

Expected output: `[cat-s3] Results: 5 passed, 0 failed`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure(s). Specifically confirm `tests/check-cat-s1-core-trace-builder.js` (23 tests) still passes unchanged, since `buildArtefactTrace` itself is not yet modified in this task.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/artefact-trace.js tests/check-cat-s3-divergence-classification.js
git commit -m "feat(cat-s3): add classifyDivergence with core registered/unregistered/orphaned-registration classification"
```

---

## Task 2: Inference for unregistered documents (AC1)

**Recommended model class:** deep-reasoning — the "reasonable inference" logic has genuine design freedom the story deliberately leaves open (per `/clarify`'s own resolved decision: "attempt inference where possible... never imply false confidence").

**Files:**
- Modify: `src/web-ui/adapters/artefact-trace.js`
- Test: `tests/check-cat-s3-divergence-classification.js`

- [ ] **Step 1: Write the failing test**

Append, before the `Results` log line:

```js
console.log('\n[cat-s3] AC1 -- unregistered document with a matching inferred pattern attaches to that grouping');
{
  var trace = {
    status: 'found',
    epics: [],
    stories: [],
    artefacts: [
      { path: 'phase4-story-3-notes.md', type: 'feature-level', filename: 'phase4-story-3-notes.md', storySlug: null },
      { path: 'phase4-story-3-plan.md', type: 'feature-level', filename: 'phase4-story-3-plan.md', storySlug: null },
      { path: 'phase4-story-9-notes.md', type: 'feature-level', filename: 'phase4-story-9-notes.md', storySlug: null }
    ]
  };
  var result = mod.classifyDivergence(trace);
  test('both phase4-story-3 files are marked unregistered', function() {
    assert.strictEqual(result.artefacts[0].divergence, 'unregistered');
    assert.strictEqual(result.artefacts[1].divergence, 'unregistered');
  });
  test('both phase4-story-3 files share the same inferredGroup', function() {
    assert.ok(result.artefacts[0].inferredGroup, 'expected an inferredGroup to be set');
    assert.strictEqual(result.artefacts[0].inferredGroup, result.artefacts[1].inferredGroup);
  });
  test('phase4-story-9 (no sibling) has no inferredGroup, but is still present and unregistered', function() {
    assert.strictEqual(result.artefacts[2].divergence, 'unregistered');
    assert.strictEqual(result.artefacts[2].inferredGroup, null);
  });
}

console.log('\n[cat-s3] AC1 -- real phase4 fixture: all files unregistered, no crash');
{
  var buildResult = mod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4');
  var classified = mod.classifyDivergence(buildResult);
  test('every one of the real phase4 files is classified unregistered', function() {
    var allUnregistered = classified.artefacts.every(function(a) { return a.divergence === 'unregistered'; });
    assert.ok(allUnregistered, 'expected every phase4 artefact to be unregistered');
  });
  test('does not throw for a large real unregistered fixture', function() {
    assert.doesNotThrow(function() {
      mod.classifyDivergence(mod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4'));
    });
  });
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s3-divergence-classification.js
```

Expected output: `inferredGroup` assertions fail (`undefined` instead of a truthy shared value) — inference logic doesn't exist yet.

- [ ] **Step 3: Write minimal implementation**

Add an inference helper above `classifyDivergence`, and call it from within `classifyDivergence`:

```js
/**
 * For artefacts with no registered story match, derive a plausible grouping
 * key from a shared filename prefix (dropping the final hyphen-segment,
 * treated as a free-text descriptor) -- e.g. 'phase4-story-3-notes.md' and
 * 'phase4-story-3-plan.md' both derive the prefix 'phase4-story-3'. Only
 * assigns inferredGroup when at least 2 unregistered artefacts share the
 * SAME derived prefix within the SAME type/subdir -- a single unmatched
 * file has no sibling to infer a grouping from, and is left with
 * inferredGroup: null rather than a fabricated single-member group.
 * This is a best-effort UX improvement only (resolved via /clarify) -- it
 * never upgrades an artefact's own divergence value away from 'unregistered'.
 */
function inferGroups(unregisteredArtefacts) {
  var derivePrefix = function(filename) {
    var stem = filename.replace(/\.md$/, '');
    var parts = stem.split('-');
    if (parts.length <= 1) return null;
    return parts.slice(0, -1).join('-');
  };

  var groupCounts = {};
  unregisteredArtefacts.forEach(function(artefact) {
    var prefix = derivePrefix(artefact.filename);
    if (!prefix) return;
    var key = artefact.type + '::' + prefix;
    groupCounts[key] = (groupCounts[key] || 0) + 1;
  });

  var assignments = {};
  unregisteredArtefacts.forEach(function(artefact) {
    var prefix = derivePrefix(artefact.filename);
    if (!prefix) { assignments[artefact.path] = null; return; }
    var key = artefact.type + '::' + prefix;
    assignments[artefact.path] = groupCounts[key] >= 2 ? prefix : null;
  });

  return assignments;
}
```

Update `classifyDivergence`'s artefact-mapping step to call this and attach `inferredGroup`:

```js
  var unregisteredArtefacts = traceResult.artefacts.filter(function(a) { return !a.storySlug; });
  var inferredGroupAssignments = inferGroups(unregisteredArtefacts);

  var artefacts = traceResult.artefacts.map(function(artefact) {
    var divergence = artefact.storySlug ? 'registered' : 'unregistered';
    var enriched = Object.assign({}, artefact, { divergence: divergence });
    if (divergence === 'unregistered') {
      enriched.inferredGroup = inferredGroupAssignments[artefact.path] || null;
    }
    return enriched;
  });
```

(Replace the existing simpler artefact-mapping block from Task 1 with this version — same function, extended.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s3-divergence-classification.js
```

Expected output: all Task 1 + Task 2 tests pass.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure(s).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/artefact-trace.js tests/check-cat-s3-divergence-classification.js
git commit -m "feat(cat-s3): infer grouping for unregistered documents from shared filename prefixes"
```

---

## Task 3: not-yet-synced precedence, wiring into buildArtefactTrace, and NFR (AC3)

**Recommended model class:** balanced.

**Files:**
- Modify: `src/web-ui/adapters/artefact-trace.js`
- Test: `tests/check-cat-s3-divergence-classification.js`

- [ ] **Step 1: Write the failing test**

Append, before the `Results` log line:

```js
console.log('\n[cat-s3] AC3 -- not-yet-synced status takes precedence, no per-document classification attempted');
{
  var os = require('os');
  var unsyncedRoot = path.join(os.tmpdir(), 'wuce-unsynced-cat-s3-' + Date.now());
  var result = mod.buildArtefactTrace(unsyncedRoot, 'any-slug');
  test('buildArtefactTrace itself returns not-yet-synced (classification never runs)', function() {
    assert.strictEqual(result.status, 'not-yet-synced');
  });
  test('classifyDivergence passed a not-yet-synced result returns it unchanged', function() {
    var classified = mod.classifyDivergence(result);
    assert.strictEqual(classified.status, 'not-yet-synced');
    assert.strictEqual(classified.artefacts, undefined);
  });
}

console.log('\n[cat-s3] Integration -- buildArtefactTrace now returns pre-classified artefacts directly, no second walk');
{
  var start = process.hrtime.bigint();
  var directResult = mod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4');
  var elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  test('buildArtefactTrace output already has divergence classification (wired in)', function() {
    assert.ok(directResult.artefacts.length > 0);
    assert.ok(directResult.artefacts.every(function(a) { return a.divergence === 'unregistered'; }));
  });
  test('wiring classification in adds no meaningful overhead (still well under 50ms for 205 files)', function() {
    assert.ok(elapsedMs < 50, 'expected < 50ms, got ' + elapsedMs.toFixed(1) + 'ms');
  });
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s3-divergence-classification.js
```

Expected output: `buildArtefactTrace output already has divergence classification (wired in)` fails — `buildArtefactTrace` doesn't call `classifyDivergence` internally yet, so `directResult.artefacts[0].divergence` is `undefined`.

- [ ] **Step 3: Write minimal implementation**

In `buildArtefactTrace`'s final return statement, replace:

```js
  return { status: 'found', resolvedDir, epics, stories, artefacts };
```

with:

```js
  return classifyDivergence({ status: 'found', resolvedDir, epics, stories, artefacts });
```

`classifyDivergence` is declared ABOVE `buildArtefactTrace` in the file (per Task 1's own code-quality fix) — this removes any question about declaration order or hoisting entirely; no TDZ reasoning is needed since the call site textually comes after the definition.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s3-divergence-classification.js
```

Expected output: all tests pass, e.g. `[cat-s3] Results: 12 passed, 0 failed`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure(s). **Specifically check `tests/check-cat-s1-core-trace-builder.js`'s own AC1 tests carefully** — they assert on `buildArtefactTrace`'s return shape directly (`epics.length > 0`, `stories.length > 0`, `storySlug` on artefacts); confirm none of them assert an EXACT object shape that a new `divergence`/`inferredGroup` field being ADDED would break (additive fields should never break an existing `assert.ok`/`assert.strictEqual` on a different field, but verify this assumption against the real file rather than trusting it).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/artefact-trace.js tests/check-cat-s3-divergence-classification.js
git commit -m "feat(cat-s3): wire classifyDivergence into buildArtefactTrace's own return path"
```

---

## Post-implementation note for /verify-completion

Walk through `artefacts/2026-09-06-canonical-artefact-trace/verification-scripts/cat-s3-divergence-classification-verification.md` scenario by scenario. Also re-confirm `cat-s1`'s own AC1-AC5 story is unaffected by this wiring change — this story's Task 3 modifies `buildArtefactTrace`'s return value shape (additively), which is exactly the kind of change that should be double-checked against `cat-s1`'s own already-merged, already-shipped test suite.
