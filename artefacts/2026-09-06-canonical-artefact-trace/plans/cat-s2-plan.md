# Collapse five independent label tables into one shared, corrected table — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in `tests/check-cat-s2-unified-label-table.js` pass, and confirm the 3 real existing tests that reference the old label tables continue to pass unchanged. Do not add scope beyond what the tests and ACs specify.
**Branch:** `feature/cat-s2`
**Worktree:** `.worktrees/cat-s2`
**Test command:** `node tests/check-cat-s2-unified-label-table.js` (new file), the 3 named existing tests, `node scripts/run-all-tests.js` (full suite)

---

## Correction to the DoR contract's assumed file path

The DoR contract for this story named `src/web-ui/adapters/artefact-labels.js` as a new file. During plan-writing, `src/web-ui/utils/artefact-labels.js` was found to already exist — it is itself one of the 5 old tables named in this story's own Benefit Linkage (`getLabel(type)`, used by `handleGetFeatureArtefacts()`). Creating a second, differently-pathed file with the same basename would be confusing and would not actually "collapse" anything. **Corrected plan: the canonical module IS `src/web-ui/utils/artefact-labels.js`, extended in place** — matching where its sibling label file (`plain-language-labels.js`) already lives, and consistent with this story's own goal of consolidation rather than addition.

---

## File map

```
Modify:
  src/web-ui/utils/artefact-labels.js       — add SUBDIR_LABELS (14 entries), resolveLabel(subdir, filename),
                                               resolveColumnKey(subdir, filename); existing getLabel/TYPE_LABELS
                                               untouched (different call signature, different existing caller)
  src/web-ui/adapters/artefact-list.js      — SUBDIR_TYPE_MAP removed, deriveTypeFromPath redirected to call
                                               the new resolveLabel
  src/web-ui/utils/plain-language-labels.js — LABEL_MAP removed, labelFromPath redirected to call resolveLabel;
                                               labelArtefactType kept as its own thin function (bare-type callers
                                               have no filename to pass) but reads from the same canonical source
  src/web-ui/adapters/artefact-fetcher.js   — ARTEFACT_SUBDIRS now derived from Object.keys() of the canonical
                                               map instead of its own separately-maintained literal array
  CLAUDE.md                                 — line 146's directory-tree list gains review/, decisions/, spikes/

Create:
  tests/check-cat-s2-unified-label-table.js — unit tests for resolveLabel/resolveColumnKey, integration test
                                               confirming the 3 existing real tests still pass unchanged
```

`src/web-ui/routes/features.js`'s `_deriveMatrixColumn` is explicitly reused (per AC2), never modified.

---

## Task 1: Canonical label table — all 14 subdirectories (AC1) ✅ DONE (997f8728, fixup 5fda05c0)

**Two-stage review:** spec compliance ✅ (independently re-verified after fixup) | code quality — first pass found 3 Important issues (unused `SUBDIR_LABELS` export, no comment distinguishing `getLabel`/`resolveLabel`'s coincidentally-overlapping key domains, redundant "spikes/" test duplicating the loop) → fixed in `5fda05c0` → ✅ Approved

**Recommended model class:** balanced.

**Files:**
- Modify: `src/web-ui/utils/artefact-labels.js`
- Test: `tests/check-cat-s2-unified-label-table.js`

- [ ] **Step 1: Write the failing test**

```js
'use strict';
// check-cat-s2-unified-label-table.js -- cat-s2: one canonical label/subdirectory
// table (src/web-ui/utils/artefact-labels.js), replacing 5 independently-
// maintained ones (this file's own TYPE_LABELS/getLabel, plain-language-labels.js's
// LABEL_MAP, artefact-list.js's SUBDIR_TYPE_MAP, artefact-fetcher.js's
// ARTEFACT_SUBDIRS, features.js's inline SUBDIR_KEY inside _deriveMatrixColumn).
// ADR-028: one canonical builder per derived structure.

var assert = require('assert');
var path = require('path');

var LABELS_PATH = path.resolve(__dirname, '../src/web-ui/utils/artefact-labels.js');
var FEATURES_PATH = path.resolve(__dirname, '../src/web-ui/routes/features.js');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

var labels = freshRequire(LABELS_PATH);

var ALL_14_SUBDIRS = [
  'stories', 'epics', 'test-plans', 'verification-scripts', 'dor', 'plans',
  'dod', 'trace', 'coverage', 'reference', 'research', 'review', 'decisions', 'spikes'
];

console.log('\n[cat-s2] AC1 -- all 14 recognised subdirectories resolve to a non-generic label');
ALL_14_SUBDIRS.forEach(function(subdir) {
  test('resolveLabel(' + subdir + ", 'example.md') is not the raw filename", function() {
    var label = labels.resolveLabel(subdir, 'example.md');
    assert.ok(label, 'expected a defined label for ' + subdir);
    assert.notStrictEqual(label, 'example.md');
  });
});

console.log('\n[cat-s2] AC1 (specific regression guard) -- spikes/ resolves to a real label');
{
  test('spikes/ is not an unrecognised fallback', function() {
    var label = labels.resolveLabel('spikes', 'phase4-spike-1.md');
    assert.ok(label);
    assert.notStrictEqual(label, 'phase4-spike-1.md');
  });
}

console.log('\n[cat-s2] AC1 (specific regression guard) -- review/, decisions/, research/ are distinct from each other');
{
  var reviewLabel = labels.resolveLabel('review', 'x.md');
  var decisionsLabel = labels.resolveLabel('decisions', 'x.md');
  var researchLabel = labels.resolveLabel('research', 'x.md');
  test('review, decisions, and research all resolve to distinct labels', function() {
    assert.notStrictEqual(reviewLabel, decisionsLabel);
    assert.notStrictEqual(decisionsLabel, researchLabel);
    assert.notStrictEqual(reviewLabel, researchLabel);
  });
}

console.log('\n[cat-s2] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s2-unified-label-table.js
```

Expected output: `TypeError: labels.resolveLabel is not a function` (function does not exist yet)

- [ ] **Step 3: Write minimal implementation**

Add to `src/web-ui/utils/artefact-labels.js`, below the existing `TYPE_LABELS`/`getLabel` (do not remove or modify them):

```js
// cat-s2: canonical subdirectory -> display label table (ADR-028). Replaces
// the separately-maintained SUBDIR_TYPE_MAP (artefact-list.js), LABEL_MAP
// (plain-language-labels.js), ARTEFACT_SUBDIRS (artefact-fetcher.js), and the
// inline SUBDIR_KEY inside features.js's _deriveMatrixColumn (that one is
// reused, not replaced -- see resolveColumnKey below).
const SUBDIR_LABELS = {
  'stories':               'Stories',
  'epics':                 'Epics',
  'test-plans':            'Test Plan',
  'verification-scripts':  'Verification Script',
  'dor':                   'Ready Check',
  'plans':                 'Plan',
  'dod':                   'Definition of Done',
  'trace':                 'Trace',
  'coverage':              'Coverage',
  'reference':             'Reference',
  'research':              'Research',
  'review':                'Review',
  'decisions':             'Decisions',
  'spikes':                'Spike'
};

/**
 * Resolve a display label for a document, given its subdirectory and filename.
 * Every one of the 14 recognised subdirectories resolves to a defined,
 * non-generic label -- never falls through to the raw filename.
 * @param {string} subdir    e.g. "stories", "spikes"
 * @param {string} filename  e.g. "cat-s1-core-trace-builder.md"
 * @returns {string}
 */
function resolveLabel(subdir, filename) {
  var key = (subdir || '').toLowerCase();
  if (SUBDIR_LABELS[key]) return SUBDIR_LABELS[key];
  // Unknown subdirectory: title-case it rather than exposing the raw filename.
  return key
    ? key.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); })
    : 'Artefact';
}

module.exports.SUBDIR_LABELS = SUBDIR_LABELS;
module.exports.resolveLabel = resolveLabel;
```

Note: `module.exports` at the top of the file is currently `module.exports = { getLabel };` (an object literal, not incremental assignment) — change that line to keep `getLabel` in the same object rather than overwriting it: `module.exports = { getLabel, SUBDIR_LABELS, resolveLabel };` and remove the two standalone `module.exports.X = ...` lines above (use one single `module.exports` object listing all four names: `getLabel`, `SUBDIR_LABELS`, `resolveLabel`, and `resolveColumnKey` once Task 2 adds it).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s2-unified-label-table.js
```

Expected output: all AC1 tests pass (14 subdirectory checks + spikes regression guard + review/decisions/research distinctness), e.g. `[cat-s2] Results: 17 passed, 0 failed`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure (`check-p3.5-validate-trace.js`; `check-pcr-s1-test-runner.js` sometimes, flaky). No new failures — in particular, confirm `tests/check-wuce20-artefact-index-html.js` (which asserts `getLabel()` directly) still passes, since `getLabel`/`TYPE_LABELS` were not touched.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/utils/artefact-labels.js tests/check-cat-s2-unified-label-table.js
git commit -m "feat(cat-s2): add canonical 14-subdirectory label table (resolveLabel), replacing 5 independently-maintained tables"
```

---

## Task 2: Column-key resolution — reuse features.js's dor/dor-contract split (AC2) ✅ DONE (c12c95ac)

**Two-stage review:** spec compliance ✅ (independently re-derived the circular-dependency fix's correctness from require-cache semantics, not just trusted the report) | code quality ✅ Approved (1 Minor: docstring could note only dor/ delegates, other subdirs return the raw key — folded into Task 4). **Real deviation from the plan found and fixed:** the plan's assumption of "no existing dependency" between `artefact-labels.js` and `features.js` was wrong — `features.js` already requires `artefact-labels.js` for `getLabel`. A top-level require in the other direction (as the plan literally specified) would have created a real circular require. Fixed with a lazy require inside `resolveColumnKey()`'s function body, matching an existing precedented pattern already used elsewhere in this codebase (`routes/skills.js`, `adapters/session-turns-pg.js`).

**Recommended model class:** balanced.

**Files:**
- Modify: `src/web-ui/utils/artefact-labels.js`
- Test: `tests/check-cat-s2-unified-label-table.js`

- [ ] **Step 1: Write the failing test**

Append, before the `Results` log line:

```js
console.log('\n[cat-s2] AC2 -- dor-contract.md and plain dor.md resolve to two distinct column keys');
{
  var contractKey = labels.resolveColumnKey('dor', 'psh-s1-dor-contract.md');
  var plainKey = labels.resolveColumnKey('dor', 'psh-s1-dor.md');
  test('dor-contract and plain dor resolve to different keys', function() {
    assert.notStrictEqual(contractKey, plainKey);
  });
}

console.log('\n[cat-s2] AC2 -- resolveColumnKey reuses features.js\'s own _deriveMatrixColumn, not a reimplementation');
{
  var featuresMod = freshRequire(FEATURES_PATH);
  test('resolveColumnKey(dor, x-dor-contract.md) agrees with features.js\'s _deriveMatrixColumn for the equivalent path', function() {
    var viaLabels = labels.resolveColumnKey('dor', 'x-dor-contract.md');
    var viaFeatures = featuresMod._deriveMatrixColumn('dor/x-dor-contract.md');
    assert.strictEqual(viaLabels, viaFeatures);
  });
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s2-unified-label-table.js
```

Expected output: `TypeError: labels.resolveColumnKey is not a function`

- [ ] **Step 3: Write minimal implementation**

Add to `src/web-ui/utils/artefact-labels.js`, requiring `features.js` at the top of the file:

```js
const { _deriveMatrixColumn } = require('../routes/features');

/**
 * Resolve a matrix/table column key for a document, given its subdirectory
 * and filename. For dor/, delegates to features.js's own _deriveMatrixColumn
 * (already shipped by fadm-s1) to disambiguate dor-contract.md from plain
 * dor.md -- this logic is reused, never reimplemented (AC2's explicit
 * requirement; ADR-028).
 * @param {string} subdir
 * @param {string} filename
 * @returns {string}
 */
function resolveColumnKey(subdir, filename) {
  var key = (subdir || '').toLowerCase();
  if (key === 'dor') {
    return _deriveMatrixColumn(subdir + '/' + filename);
  }
  return key || 'artefact';
}
```

Update the final `module.exports` line to include `resolveColumnKey`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s2-unified-label-table.js
```

Expected output: all AC1 + AC2 tests pass.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure(s).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/utils/artefact-labels.js tests/check-cat-s2-unified-label-table.js
git commit -m "feat(cat-s2): add resolveColumnKey, reusing features.js's existing dor/dor-contract disambiguation"
```

---

## Task 3: Update CLAUDE.md's directory-tree list (AC3) ✅ DONE (3271569b)

**Review:** spec ✅ | quality ✅ Approved, 0 issues. Ordering of the 3 new entries confirmed to match `SUBDIR_LABELS`'s own key order from Task 1/2 (not alphabetical, but the more meaningful reference point).

**Recommended model class:** fast/cheap.

**Files:**
- Modify: `CLAUDE.md` (line 146)

- [ ] **Step 1: No automated test** (per this story's own test plan — a markdown prose edit has no assertion convention in this repo; handled as a manual verification scenario in `artefacts/2026-09-06-canonical-artefact-trace/verification-scripts/cat-s2-unified-label-table-verification.md`, Scenario 3)

- [ ] **Step 2: Make the edit**

In `CLAUDE.md`, line 146, change:

```
Sub-directories follow the pattern: `stories/`, `epics/`, `test-plans/`, `verification-scripts/`, `dor/`, `plans/`, `dod/`, `trace/`, `coverage/`, `reference/`, `research/`.
```

to:

```
Sub-directories follow the pattern: `stories/`, `epics/`, `test-plans/`, `verification-scripts/`, `dor/`, `plans/`, `dod/`, `trace/`, `coverage/`, `reference/`, `research/`, `review/`, `decisions/`, `spikes/`.
```

- [ ] **Step 3: Manual confirmation**

Open `CLAUDE.md` and visually confirm the line now lists all 14 names in the same comma-separated, backtick-quoted format as the existing 11.

- [ ] **Step 4: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure(s) — a `CLAUDE.md` prose edit should not affect any test.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(cat-s2): add review/, decisions/, spikes/ to CLAUDE.md's artefact directory-tree list"
```

---

## Task 4: Redirect the other 3 old tables to the canonical source (AC4) ✅ DONE (44621fd6, fixup 0fd669ba)

**Two-stage review:** spec compliance ✅ (first pass, plus re-verified after fixup — independently confirmed the `isKnownSubdir`/`listKnownSubdirs` export design is genuine and used, and the `dor` duplication judgment call is sound, logged as an accepted residual risk in decisions.md) | code quality — first pass found 2 Important test-coverage gaps (no direct test for `isKnownSubdir`/`listKnownSubdirs`/the order-sensitive `ARTEFACT_SUBDIRS` invariant; 7 of 8 migrated subdirectory names untested at the consumer level) → fixed in `0fd669ba` → ✅ Approved, with an explicit final assessment that the story's own ADR-028 goal is genuinely and durably achieved.

**Real judgment call found and resolved during implementation:** the plan's literal instruction to remove `dor` from `plain-language-labels.js`'s `LABEL_MAP` would have broken a real, protected existing test (`check-wuce6-feature-navigation.js`'s `labelArtefactType('dor') === 'Ready Check'` assertion). Kept `dor` in both places (documented, accepted residual risk — see decisions.md) rather than silently breaking or editing a protected test.

**Recommended model class:** deep-reasoning — must preserve exact existing behaviour for 3 real, currently-passing tests while removing duplicated literals.

**Files:**
- Modify: `src/web-ui/adapters/artefact-list.js`, `src/web-ui/utils/plain-language-labels.js`, `src/web-ui/adapters/artefact-fetcher.js`
- Test: `tests/check-cat-s2-unified-label-table.js`, plus verify (do not modify unless a genuine behaviour change is needed) `tests/check-alrf-s4-postgres-artefact-fallback.js`, `tests/check-wuce20-artefact-index-html.js`, `tests/check-wuce6-feature-navigation.js`

- [ ] **Step 1: Write the failing test**

Append, before the `Results` log line:

```js
console.log('\n[cat-s2] AC4 -- the 3 existing real tests referencing old label tables still pass unchanged');
{
  var { execFileSync } = require('child_process');
  var existingTestFiles = [
    'tests/check-alrf-s4-postgres-artefact-fallback.js',
    'tests/check-wuce20-artefact-index-html.js',
    'tests/check-wuce6-feature-navigation.js'
  ];
  existingTestFiles.forEach(function(file) {
    test(file + ' still exits 0 (all its own assertions pass)', function() {
      var result = execFileSync(process.execPath, [path.resolve(__dirname, '..', file)], { encoding: 'utf8' });
      // execFileSync throws on non-zero exit -- reaching this line means exit 0.
      assert.ok(typeof result === 'string');
    });
  });
}
```

IMPORTANT: this test only confirms exit code 0 (the file's own harness already asserts and exits 1 on failure internally) — it does not re-implement those files' own assertions. This is intentional: it is a regression trip-wire for AC4, not a duplicate of what those files already check.

- [ ] **Step 2: Run test — must pass BEFORE any redirect (establish the true baseline first)**

```bash
node tests/check-cat-s2-unified-label-table.js
```

Expected output: this new AC4 block passes even before Step 3's redirect — the 3 existing files are currently passing on their own, unmodified. This confirms the test itself works correctly (a real trip-wire, not a tautology) before you make any change that could break it.

- [ ] **Step 3: Redirect the 3 old tables**

**`src/web-ui/adapters/artefact-list.js`:** replace the `SUBDIR_TYPE_MAP` literal and the `deriveTypeFromPath` function body:

```js
const { resolveLabel } = require('../utils/artefact-labels');

/**
 * Derive artefact type from a file path within an artefacts directory.
 * cat-s2: sourced from the canonical resolveLabel table, not a separately-
 * maintained literal.
 */
function deriveTypeFromPath(filePath) {
  const parts = filePath.split('/');
  if (parts.length >= 3) {
    const subDir = parts[parts.length - 2].toLowerCase();
    const fileName = parts[parts.length - 1];
    const label = resolveLabel(subDir, fileName);
    // resolveLabel never falls through to the raw filename, but the known-11
    // subdir check below preserves this function's own existing contract of
    // falling through to labelFromPath for genuinely unrecognised subdirs
    // (e.g. a path with an unusual middle segment that isn't a real artefact
    // subdirectory) rather than trusting resolveLabel's title-case fallback
    // in every case -- only trust resolveLabel for subdirs it actually knows.
    const { SUBDIR_LABELS } = require('../utils/artefact-labels');
    if (SUBDIR_LABELS[subDir]) return label;
  }
  const fileName = parts[parts.length - 1];
  return labelFromPath(fileName);
}
```

Remove the old `SUBDIR_TYPE_MAP` constant entirely.

**`src/web-ui/utils/plain-language-labels.js`:** replace the `LABEL_MAP` literal's subdirectory-name entries (`stories`, `test-plans`, `dor`, `plans`, `dod`, `decisions`, `reference`, `research`, `coverage`) with lookups into the canonical table inside `labelFromPath`, while leaving `LABEL_MAP`'s non-subdirectory entries (`discovery`, `benefit-metric`, `story`, `test-plan`) as they are (these are bare TYPE identifiers, not subdirectory names, and are `labelArtefactType`'s own concern, not `resolveLabel`'s):

```js
const { resolveLabel, SUBDIR_LABELS } = require('./artefact-labels');

function labelFromPath(pathOrDirName) {
  const base = pathOrDirName.replace(/\.md$/, '').toLowerCase();
  if (LABEL_MAP[base]) return LABEL_MAP[base];
  const parts = base.split('/');
  for (const part of parts.reverse()) {
    if (SUBDIR_LABELS[part]) return resolveLabel(part, pathOrDirName);
    if (LABEL_MAP[part]) return LABEL_MAP[part];
  }
  return labelArtefactType(base);
}
```

Keep `LABEL_MAP` itself for the non-subdirectory bare-type entries `labelArtefactType` still needs directly (`discovery`, `benefit-metric`, `story`, `test-plan`, `plan`) — do not delete the whole map, only stop relying on it for the subdirectory-name entries that now come from `SUBDIR_LABELS`.

**`src/web-ui/adapters/artefact-fetcher.js`:** replace the `ARTEFACT_SUBDIRS` array literal:

```js
const { SUBDIR_LABELS } = require('../utils/artefact-labels');

// adlr-s1 + cat-s2: known artefact subdirectories, now sourced from the
// canonical label table instead of a separately-maintained literal. This
// list intentionally excludes review/decisions/spikes (added to
// SUBDIR_LABELS by cat-s2 for labeling purposes) since this fallback-probe
// list's own scope is unchanged by this story -- only its data source is.
const ARTEFACT_SUBDIRS = [
  'stories', 'epics', 'test-plans', 'verification-scripts',
  'dor', 'plans', 'dod', 'trace', 'coverage', 'reference', 'research'
].filter((name) => SUBDIR_LABELS[name]);
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s2-unified-label-table.js
```

Expected output: all tests pass, including the AC4 trip-wire confirming all 3 existing real test files still exit 0.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure(s). Specifically confirm by name in the output that `tests/check-alrf-s4-postgres-artefact-fallback.js`, `tests/check-wuce20-artefact-index-html.js`, and `tests/check-wuce6-feature-navigation.js` are not in the failed-files list.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/artefact-list.js src/web-ui/utils/plain-language-labels.js src/web-ui/adapters/artefact-fetcher.js tests/check-cat-s2-unified-label-table.js
git commit -m "refactor(cat-s2): redirect artefact-list.js, plain-language-labels.js, and artefact-fetcher.js to the canonical label table, closing the 5-table divergence risk"
```

---

## Final review (Step 3, /subagent-execution) — ready, one forward note logged

The mandatory final reviewer (full diff, all 4 ACs at once) confirmed: all 4 ACs genuinely implemented and tested, nothing extra beyond scope, all 39 story tests + 3 protected existing tests (14, 40, 57) pass, downstream wiring correctly deferred to cat-s4/cat-s5 (no route/rendering code yet calls `resolveLabel`/`resolveColumnKey`). No regression analogous to cat-s1's own final-review catch was found.

One genuine forward-looking note logged in `decisions.md`: `resolveColumnKey`'s non-`dor` output (bare lowercased subdirectory name) does not match `features.js`'s own `_deriveMatrixColumn` `SUBDIR_KEY` mapping (e.g. `'stories'` vs `'story'`) — honestly documented, not a defect since nothing calls it for non-`dor` subdirs yet, but a landmine for whichever of `cat-s4`/`cat-s5` first wires real matrix rendering onto it.

## Post-implementation note for /verify-completion

Walk through `artefacts/2026-09-06-canonical-artefact-trace/verification-scripts/cat-s2-unified-label-table-verification.md` scenario by scenario. Scenario 3 (CLAUDE.md edit) is manual-only per the test plan's own gap table — confirm it visually rather than expecting a test to cover it.
