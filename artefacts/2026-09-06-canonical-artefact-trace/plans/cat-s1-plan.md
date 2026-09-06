# Build the canonical artefact trace from real disk structure for any feature — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in `tests/check-cat-s1-core-trace-builder.js` pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/cat-s1`
**Worktree:** `.worktrees/cat-s1`
**Test command:** `node tests/check-cat-s1-core-trace-builder.js` (single file), `node scripts/run-all-tests.js` (full suite)

---

## File map

```
Create:
  src/web-ui/adapters/artefact-trace.js       — buildArtefactTrace(repoRoot, featureSlug): single canonical trace builder
  tests/check-cat-s1-core-trace-builder.js    — 10 unit + 1 integration + 2 NFR tests
```

No existing files are modified by this story (additive only — `feature-story-structure.js` continues to be the live code path for existing consumers until `cat-s4`/`cat-s5` rewire them onto this new module).

---

## Task 1: Path resolution — not-found and not-yet-synced (AC4, AC5) ✅ DONE (699bdb63)

**Two-stage review:** spec compliance ✅ | code quality ✅ Approved (5 Minor notes: unused `pathExists` export, reinvents `fs.existsSync` vs. `artefact-list.js`'s convention, ES5 style vs. sibling adapters' ES6, no module header comment, future path-traversal-guard reminder for later route wiring — folded into Task 2's brief rather than a separate fix-review round, since none were Critical/Important)

**Recommended model class:** fast/cheap — mechanical branch logic, no ambiguity.

**Files:**
- Create: `src/web-ui/adapters/artefact-trace.js`
- Test: `tests/check-cat-s1-core-trace-builder.js`

- [ ] **Step 1: Write the failing test**

```js
'use strict';
// check-cat-s1-core-trace-builder.js -- cat-s1: single canonical builder for a
// feature's real disk artefact structure, cross-referencing pipeline-state.json
// for epic/story names where registered. Disk is canonical (ADR-029); this
// module walks disk first and treats pipeline-state.json as enrichment only.

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var os = require('os');

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

console.log('\n[cat-s1] AC4 -- genuinely nonexistent slug returns a typed not-found result');
{
  var result = mod.buildArtefactTrace(REPO_ROOT, 'definitely-does-not-exist-9f3a');
  test('status is not-found, not null, not thrown', function() {
    assert.ok(result !== null, 'result must not be null');
    assert.strictEqual(result.status, 'not-found');
  });
  test('does not return an empty-but-found shape', function() {
    assert.notStrictEqual(result.status, 'found');
  });
}

console.log('\n[cat-s1] AC5 -- unsynced tenant checkout returns a distinct not-yet-synced result');
{
  var unsyncedRoot = path.join(os.tmpdir(), 'wuce-unsynced-' + Date.now());
  var result = mod.buildArtefactTrace(unsyncedRoot, 'any-slug');
  test('status is not-yet-synced', function() {
    assert.strictEqual(result.status, 'not-yet-synced');
  });
  test('not-yet-synced is never conflated with not-found', function() {
    var notFoundResult = mod.buildArtefactTrace(REPO_ROOT, 'definitely-does-not-exist-9f3a');
    assert.notStrictEqual(result.status, notFoundResult.status);
  });
}

console.log('\n[cat-s1] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s1-core-trace-builder.js
```

Expected output: `Cannot find module '.../src/web-ui/adapters/artefact-trace.js'` (file does not exist yet)

- [ ] **Step 3: Write minimal implementation**

```js
'use strict';
var fs = require('fs');
var path = require('path');

function pathExists(p) {
  try { fs.accessSync(p); return true; }
  catch (_) { return false; }
}

function buildArtefactTrace(repoRoot, featureSlug) {
  if (!pathExists(repoRoot)) {
    return { status: 'not-yet-synced' };
  }

  var primaryDir = path.join(repoRoot, 'artefacts', featureSlug);
  var archivedDir = path.join(repoRoot, 'artefacts', 'archived', featureSlug);

  var resolvedDir = null;
  if (pathExists(primaryDir)) {
    resolvedDir = primaryDir;
  } else if (pathExists(archivedDir)) {
    resolvedDir = archivedDir;
  }

  if (!resolvedDir) {
    return { status: 'not-found' };
  }

  // Directory walk and pipeline-state cross-reference land in later tasks.
  return { status: 'found', resolvedDir: resolvedDir, epics: [], stories: [], artefacts: [] };
}

module.exports = { buildArtefactTrace: buildArtefactTrace, pathExists: pathExists };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s1-core-trace-builder.js
```

Expected output:
```
[cat-s1] AC4 -- genuinely nonexistent slug returns a typed not-found result
  [PASS] status is not-found, not null, not thrown
  [PASS] does not return an empty-but-found shape

[cat-s1] AC5 -- unsynced tenant checkout returns a distinct not-yet-synced result
  [PASS] status is not-yet-synced
  [PASS] not-yet-synced is never conflated with not-found

[cat-s1] Results: 4 passed, 0 failed
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: `622 file(s) run, 2 failed` (or `623 file(s) run` once this file is counted) — failures limited to the two pre-existing baseline files (`check-p3.5-validate-trace.js`, `check-pcr-s1-test-runner.js`), no new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/artefact-trace.js tests/check-cat-s1-core-trace-builder.js
git commit -m "feat(cat-s1): add not-found and not-yet-synced path resolution to artefact trace builder"
```

---

## Task 2: Archived-directory fallback — one implementation, not three (AC3) ✅ DONE (69f5f630)

**Two-stage review:** spec compliance ✅ | code quality ✅ Approved (0 issues)

**Recommended model class:** fast/cheap.

**Files:**
- Modify: `src/web-ui/adapters/artefact-trace.js`
- Test: `tests/check-cat-s1-core-trace-builder.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-cat-s1-core-trace-builder.js`, before the `Results` log line:

```js
console.log('\n[cat-s1] AC3 -- resolves a feature present only under artefacts/archived/');
{
  var fixtureRoot = path.join(os.tmpdir(), 'cat-s1-archived-fixture-' + Date.now());
  var archivedFeatureDir = path.join(fixtureRoot, 'artefacts', 'archived', 'archived-only-feature');
  fs.mkdirSync(archivedFeatureDir, { recursive: true });
  fs.writeFileSync(path.join(archivedFeatureDir, 'discovery.md'), '# Discovery\n');

  var result = mod.buildArtefactTrace(fixtureRoot, 'archived-only-feature');
  test('resolves via the archived/ fallback', function() {
    assert.strictEqual(result.status, 'found');
  });
  test('finds the file under the archived path', function() {
    var found = result.artefacts.some(function(a) { return a.path.indexOf('discovery.md') !== -1; });
    assert.ok(found, 'discovery.md should be present in artefacts[]');
  });

  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
```

Note: this test references `result.artefacts` populated by the directory walk, which doesn't exist yet — it will fail on the `found` assertion until Task 3 lands, but the `resolvedDir` selection itself (archived vs primary) is this task's own scope. Write the test now so Task 3's walk has something real to populate against; the `finds the file` assertion is expected to fail after Step 4 of this task and pass only once Task 3 is complete — note this explicitly in Step 4 below rather than treating it as a false green/red signal.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s1-core-trace-builder.js
```

Expected output: `[FAIL] finds the file under the archived path -- discovery.md should be present in artefacts[]` (walk not implemented yet — expected at this point, not a regression)

- [ ] **Step 3: Write minimal implementation**

The `pathExists(primaryDir)` / `else if (pathExists(archivedDir))` branch from Task 1 already implements the fallback — this task's code change is confirming there is exactly one such branch, not adding a second. No further code change needed here; add a one-line comment for future readers:

```js
// One fallback branch only (ADR-028) -- do not duplicate this logic in
// features.js, artefact-list.js, or artefact-fetcher.js; those modules
// should call buildArtefactTrace instead (cat-s4/cat-s5).
```

Insert this comment directly above the `var resolvedDir = null;` line in `src/web-ui/adapters/artefact-trace.js`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s1-core-trace-builder.js
```

Expected output: `resolves via the archived/ fallback` passes; `finds the file under the archived path` still fails (walk lands in Task 3) — this is expected, not a regression, per the note in Step 1.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same 2 pre-existing baseline failures only; this file's own new failure is expected and tracked, not a suite regression (it is fixed by Task 3, not backed out here).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/artefact-trace.js tests/check-cat-s1-core-trace-builder.js
git commit -m "test(cat-s1): add archived-directory fallback fixture ahead of directory walk"
```

---

## Task 3: Directory walk — every real file present, zero-registration case (AC2) ✅ DONE (c18c3951)

**Two-stage review:** spec compliance ✅ (phase4 now resolves via archived-fallback since an unrelated commit archived it mid-session — judged an acceptable substitution, AC2's behavior is branch-agnostic and AC3 already covers branch selection separately) | code quality ✅ with 1 Important (DRY vs. `artefact-list.js`'s `walkMdFiles`, logged in decisions.md as a follow-up for cat-s4/cat-s5, not fixed inline) + 3 Minor comment suggestions (folded into Task 4)

**Recommended model class:** balanced.

**Files:**
- Modify: `src/web-ui/adapters/artefact-trace.js`
- Test: `tests/check-cat-s1-core-trace-builder.js`

- [ ] **Step 1: Write the failing test**

Append:

```js
console.log('\n[cat-s1] AC2 -- zero-registration feature returns every real file, none dropped');
{
  var phase4Result = mod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4');
  test('status is found', function() {
    assert.strictEqual(phase4Result.status, 'found');
  });
  test('returns all 205 real files', function() {
    assert.strictEqual(phase4Result.artefacts.length, 205);
  });
  test('does not throw despite zero pipeline-state.json registration', function() {
    assert.doesNotThrow(function() {
      mod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4');
    });
  });
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s1-core-trace-builder.js
```

Expected output: `[FAIL] status is found -- Expected values to be strictly equal: + actual - expected + 'found' - undefined` (artefacts array is always empty, status hardcoded, no walk yet)

- [ ] **Step 3: Write minimal implementation**

Replace the `return { status: 'found', resolvedDir: resolvedDir, epics: [], stories: [], artefacts: [] };` line in `src/web-ui/adapters/artefact-trace.js` with:

```js
  var artefacts = walkDir(resolvedDir, resolvedDir);

  return { status: 'found', epics: [], stories: [], artefacts: artefacts };
```

And add the `walkDir` function above `buildArtefactTrace`:

```js
function walkDir(dir, base) {
  var results = [];
  var entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(function(entry) {
    var full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkDir(full, base));
    } else if (entry.isFile()) {
      var rel = path.relative(base, full).split(path.sep).join('/');
      var parts = rel.split('/');
      var type = parts.length > 1 ? parts[0] : 'feature-level';
      results.push({ path: rel, type: type, filename: entry.name });
    }
  });
  return results;
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s1-core-trace-builder.js
```

Expected output: all AC2 tests pass, plus Task 2's previously-failing `finds the file under the archived path` test now also passes (walk now populates `artefacts[]`).

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the two pre-existing baseline failures remain.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/artefact-trace.js tests/check-cat-s1-core-trace-builder.js
git commit -m "feat(cat-s1): add recursive directory walk so every real file is returned regardless of registration"
```

---

## Task 4: Pipeline-state cross-reference — full-registration case (AC1) ✅ DONE (1bb77341, fixup 513f15e0)

**Two-stage review:** spec compliance — first pass ❌ found 3 test-adequacy gaps (flat-shape coverage, sort-independent collision test, undocumented `epicSlug` asymmetry), all fixed in `513f15e0` and independently re-verified (reviewer reproduced the sort-dependency claim themselves, not just trusted the report) → ✅ | code quality ✅ Approved, 5 Minor polish notes (optional — extraction-into-helpers, one naming precision note, 2 clarifying comments, test-fixture-helper DRY). Fixture substituted from the plan's suggested `2026-09-06-feature-artefact-document-matrix` (found to have no `epics[]`) to `2026-07-01-landing-auth-billing` (3 real epics, resolves via primary path, closing the prior primary-path coverage gap flagged in Task 3's review).

**Recommended model class:** deep-reasoning — matching heuristic has real ambiguity (per review finding 1-L1: exact field-naming/matching approach is not fully pinned by the AC text alone).

**Files:**
- Modify: `src/web-ui/adapters/artefact-trace.js`
- Test: `tests/check-cat-s1-core-trace-builder.js`

- [ ] **Step 1: Write the failing test**

Append:

```js
console.log('\n[cat-s1] AC1 -- fully-registered feature attributes every epic, story, and artefact correctly');
{
  var registeredResult = mod.buildArtefactTrace(REPO_ROOT, '2026-09-06-feature-artefact-document-matrix');
  test('status is found', function() {
    assert.strictEqual(registeredResult.status, 'found');
  });
  test('at least one epic is attributed', function() {
    assert.ok(registeredResult.epics.length > 0, 'expected at least one epic');
  });
  test('at least one story is attributed', function() {
    assert.ok(registeredResult.stories.length > 0, 'expected at least one story');
  });
  test('artefacts include a story-scoped file with a resolved storySlug', function() {
    var storyFile = registeredResult.artefacts.find(function(a) {
      return a.type === 'stories';
    });
    assert.ok(storyFile, 'expected at least one stories/ artefact');
    assert.ok(storyFile.storySlug, 'expected storySlug to be resolved, got: ' + storyFile.storySlug);
  });
}

console.log('\n[cat-s1] AC1 (regression guard) -- prefix-colliding story slugs do not cross-attribute');
{
  var fixtureRoot = path.join(os.tmpdir(), 'cat-s1-prefix-fixture-' + Date.now());
  var slug = 'prefix-fixture';
  var storiesDir = path.join(fixtureRoot, 'artefacts', slug, 'stories');
  fs.mkdirSync(storiesDir, { recursive: true });
  fs.writeFileSync(path.join(storiesDir, 'cat-s10-foo.md'), '# cat-s10\n');
  var stateDir = path.join(fixtureRoot, '.github');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'pipeline-state.json'), JSON.stringify({
    features: [{
      slug: slug,
      epics: [{ slug: 'e1', name: 'Epic', stories: [
        { slug: 'cat-s1', name: 'Story 1' },
        { slug: 'cat-s10', name: 'Story 10' }
      ] }]
    }]
  }));

  var result = mod.buildArtefactTrace(fixtureRoot, slug);
  test('cat-s10-foo.md attributes to cat-s10, never cat-s1', function() {
    var file = result.artefacts.find(function(a) { return a.filename === 'cat-s10-foo.md'; });
    assert.ok(file, 'fixture file should be present');
    assert.strictEqual(file.storySlug, 'cat-s10');
  });

  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s1-core-trace-builder.js
```

Expected output: `[FAIL] at least one epic is attributed -- expected at least one epic` (pipeline-state.json is never read yet)

- [ ] **Step 3: Write minimal implementation**

Add `readPipelineStateForSlug` above `buildArtefactTrace`:

```js
function readPipelineStateForSlug(repoRoot, featureSlug) {
  var statePath = path.join(repoRoot, '.github', 'pipeline-state.json');
  if (!pathExists(statePath)) return null;
  var state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (_) {
    return null;
  }
  var feature = (state.features || []).find(function(f) { return f.slug === featureSlug; });
  return feature || null;
}
```

Replace the `return { status: 'found', epics: [], stories: [], artefacts: artefacts };` line with:

```js
  var feature = readPipelineStateForSlug(repoRoot, featureSlug);
  var epics = [];
  var stories = [];
  if (feature) {
    (feature.epics || []).forEach(function(epic) {
      epics.push({ slug: epic.slug, name: epic.name });
      (epic.stories || []).forEach(function(story) {
        stories.push({ slug: story.slug, name: story.name, epicSlug: epic.slug });
      });
    });
    (feature.stories || []).forEach(function(story) {
      stories.push({ slug: story.id || story.slug, name: story.name });
    });
  }

  // Longest-prefix match first, so 'cat-s10-foo.md' matches story 'cat-s10'
  // rather than the shorter 'cat-s1' also being a valid (wrong) prefix match.
  var sortedStories = stories.slice().sort(function(a, b) {
    return (b.slug || '').length - (a.slug || '').length;
  });
  artefacts.forEach(function(artefact) {
    var match = sortedStories.find(function(story) {
      return story.slug && artefact.filename.indexOf(story.slug + '-') === 0;
    });
    artefact.storySlug = match ? match.slug : null;
  });

  return { status: 'found', epics: epics, stories: stories, artefacts: artefacts };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s1-core-trace-builder.js
```

Expected output: all AC1 tests pass, including the prefix-collision regression guard.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the two pre-existing baseline failures remain.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/artefact-trace.js tests/check-cat-s1-core-trace-builder.js
git commit -m "feat(cat-s1): cross-reference pipeline-state.json for epic/story attribution, longest-prefix-match first"
```

---

## Task 5: NFR tests and final regression pass ✅ DONE (c0c6e537, fixup aadc13b9)

**Two-stage review:** spec compliance ✅ (independent AC1-AC5 traceability re-check, all satisfied) | code quality — first pass found 2 Important issues (weak exec-string-match security check; dead-weight `doesNotThrow` assertion that could never independently fail) → fixed in `aadc13b9` → re-reviewed ✅ Approved, 0 issues. **All 5 story ACs + both NFRs independently verified twice across the task-level reviews.** Note: one implementer dispatch hit a session rate limit mid-fix; the orchestrating session verified the already-applied diff directly (ran both the file-level and full-suite tests itself) rather than losing the work, then committed it — re-review subagent confirmed the result was correct.

**Recommended model class:** fast/cheap.

**Files:**
- Modify: `tests/check-cat-s1-core-trace-builder.js` (no source changes expected)

- [ ] **Step 1: Write the failing test**

Append, before the `Results` log line:

```js
console.log('\n[cat-s1] NFR -- directory walk completes within 50ms for phase4 (205 files)');
{
  var start = process.hrtime.bigint();
  mod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4');
  var elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  test('walk completes in under 50ms (measured: ' + elapsedMs.toFixed(1) + 'ms)', function() {
    assert.ok(elapsedMs < 50, 'expected < 50ms, got ' + elapsedMs.toFixed(1) + 'ms');
  });
}

console.log('\n[cat-s1] NFR -- no new unvalidated input surface (source review)');
{
  var src = fs.readFileSync(TRACE_PATH, 'utf8');
  test('featureSlug is never used in a shell/exec call', function() {
    assert.ok(src.indexOf('exec(') === -1 && src.indexOf('execSync(') === -1,
      'artefact-trace.js must not shell out with unvalidated input');
  });
}
```

- [ ] **Step 2: Run test — must fail**

Not expected to fail — this task adds NFR assertions against already-working code from Tasks 1-4. If either fails, it indicates a real regression (walk too slow, or unexpected shell-out) that must be fixed before proceeding, not accepted.

```bash
node tests/check-cat-s1-core-trace-builder.js
```

Expected output (if genuinely green already): both NFR tests pass on first run, since no new production code is added in this task.

- [ ] **Step 3: Write minimal implementation**

No implementation change expected. If the performance test fails, profile `walkDir` for an accidental synchronous stat-per-file redundancy (e.g. calling `fs.statSync` separately from `withFileTypes: true`, which already avoids the extra stat call) before adding any caching — per `product/mission.md`'s "not a persistent agent runtime" constraint, do not introduce a cache to pass this test; fix the walk itself.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s1-core-trace-builder.js
```

Expected output: full file green, e.g. `[cat-s1] Results: 17 passed, 0 failed`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: `623 file(s) run, 2 failed` — the same two pre-existing baseline failures (`check-p3.5-validate-trace.js`, `check-pcr-s1-test-runner.js`), zero new failures.

- [ ] **Step 6: Commit**

```bash
git add tests/check-cat-s1-core-trace-builder.js
git commit -m "test(cat-s1): add NFR performance and input-surface checks, completing cat-s1's full AC coverage"
```

---

## Final review (Step 3, /subagent-execution) — found and fixed one real regression

The mandatory final reviewer (full diff, all 5 ACs at once) found that `artefact-trace.js`'s story-attribution logic omitted the bare `<slug>.md` match arm that story `bsgm-s1` had added to `feature-story-structure.js` to fix a confirmed bug affecting 170 story files across 37 real features. None of the 5 task-level reviews caught this because the AC1 fixture used only hyphen-suffixed filenames. Reproduced directly against the real `2026-09-02-product-dashboard-triage` fixture (one of `bsgm-s1`'s own named affected features) — all 4 of its bare-slug files resolved to `storySlug: null` before the fix.

**Fixed in commit `8ca84e64`:** added `|| artefact.filename === story.slug + '.md'` to the match predicate, mirroring `feature-story-structure.js` exactly. Regression test added against the same real fixture, empirically verified by the implementer (reverted the fix → 2 assertions failed with the predicted `null` result → restored → all pass). Final reviewer independently re-reproduced the original repro against the fix and confirmed all 4 files now resolve correctly. Test count: 20 → 23.

This is the single most valuable catch of this story's entire execution — a defect that would have silently reintroduced a previously-fixed, audited bug into production once `cat-s4`/`cat-s5` wire consumers onto this "canonical" builder, precisely undermining the story's own stated purpose (Benefit Linkage: "so a future gap in this logic is fixed once, not rediscovered per consumer"). Caught only because the final review step compares the whole diff against all ACs together, rather than trusting 5 individually-passing task reviews.

## Post-implementation note for /verify-completion

Walk through `artefacts/2026-09-06-canonical-artefact-trace/verification-scripts/cat-s1-core-trace-builder-verification.md` scenario by scenario against this branch's own `node tests/check-cat-s1-core-trace-builder.js` output before opening the draft PR — the verification script's 5 scenarios map 1:1 to this plan's Tasks 1-4 (Task 5 is NFR-only, not a separate AC scenario).
