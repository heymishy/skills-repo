# Selector derivation generalises beyond one AC, with a manual fallback for ACs with no E2E coverage — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. All 4 ACs are fully automatable — no manual scenario, no real secret or network dependency, unlike `rpca-s1`.
**Branch:** `feature/rpca-s2`
**Worktree:** `.worktrees/rpca-s2`
**Test command:** `node scripts/run-all-tests.js` (full suite); individual file: `node tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`

---

## File map

```
Create:
  tests/check-rpca-s2-selector-derivation-from-e2e-specs.js  — unit + integration tests

Modify:
  scripts/playback-capture.js  — add deriveSelectorFromSpec, loadManualFallback,
                                   buildCaptureList; export all three; no change to
                                   any existing exported function's own signature
```

---

## Task 1: `deriveSelectorFromSpec` — derives `{acId, selector}` from an E2E spec fixture

**Files:**
- Modify: `scripts/playback-capture.js`
- Create: `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` with this content:

```javascript
'use strict';
// check-rpca-s2-selector-derivation-from-e2e-specs.js -- TDD tests for rpca-s2
// (2026-10-19-real-playback-capture-automation).
// Story: artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s2-selector-derivation-from-e2e-specs.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

// AC1 (unit): derives a selector from a real-shaped E2E spec fixture
(function () {
  const { deriveSelectorFromSpec } = require('../scripts/playback-capture');
  try {
    const fixtureSpec = `'use strict';\n// fixture-spec.spec.js -- E2E for X (rpca-fixture-story AC1)\nconst { withAuth } = require('./fixtures/auth');\nwithAuth('does the thing', async ({ page }) => {\n  await page.goto('/fixture');\n  const el = page.locator('.fixture-selector');\n  await expect(el).toBeVisible();\n});\n`;
    const result = deriveSelectorFromSpec(fixtureSpec, 'AC1');
    assert.deepStrictEqual(result, { acId: 'AC1', selector: '.fixture-selector' }, 'expected the AC id and the nearest following locator selector');
    pass('AC1 (unit): derives a selector from a real-shaped E2E spec fixture');
  } catch (e) { fail('AC1 (unit): derives a selector from a real-shaped E2E spec fixture', e); }
})();

// AC1 (unit): returns null when the spec file does not name the AC at all
(function () {
  const { deriveSelectorFromSpec } = require('../scripts/playback-capture');
  try {
    const fixtureSpec = `// fixture-spec.spec.js -- E2E for X (rpca-fixture-story AC9)\nconst el = page.locator('.unrelated');\n`;
    const result = deriveSelectorFromSpec(fixtureSpec, 'AC1');
    assert.strictEqual(result, null, 'expected null when the AC id is not named in the spec file at all');
    pass('AC1 (unit): returns null when the spec file does not name the AC at all');
  } catch (e) { fail('AC1 (unit): returns null when the spec file does not name the AC at all', e); }
})();

console.log(`\n[rpca-s2-selector-derivation-from-e2e-specs] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
```

Expected output: `TypeError: deriveSelectorFromSpec is not a function` (or equivalent — the export does not exist yet)

- [ ] **Step 3: Write minimal implementation**

In `scripts/playback-capture.js`, add after `buildScreenshotPath` (before the `rpca-s1: real CLI entrypoint` comment block):

```javascript
// rpca-s2: scans a spec file's own text for a comment naming acId (matching the
// existing convention, e.g. tests/e2e/fpd-s4-caption-sync.spec.js's own header
// "(fpd-s4 AC3)"), then finds the NEAREST FOLLOWING page.locator(...) call --
// not just the first one in the file, since a spec file can cover several ACs.
// Returns null (never throws) when the AC isn't named at all -- a spec file
// simply not covering a given AC is a normal, expected case, not an error.
function deriveSelectorFromSpec(specFileContent, acId) {
  const acRe = new RegExp(`\\b${acId}\\b`);
  const acMatch = acRe.exec(specFileContent);
  if (!acMatch) return null;
  const rest = specFileContent.slice(acMatch.index);
  const locatorMatch = rest.match(/page\.locator\(['"]([^'"]+)['"]\)/);
  if (!locatorMatch) return null;
  return { acId, selector: locatorMatch[1] };
}
```

Add `deriveSelectorFromSpec` to the `module.exports` block at the bottom of the file.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
```

Expected output:
```
  [PASS] AC1 (unit): derives a selector from a real-shaped E2E spec fixture
  [PASS] AC1 (unit): returns null when the spec file does not name the AC at all

[rpca-s2-selector-derivation-from-e2e-specs] Results: 2 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add scripts/playback-capture.js tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
git commit -m "rpca-s2: derive {acId, selector} from an E2E spec file's own AC-naming comment (AC1)"
```

---

## Task 2: `loadManualFallback` — reads `selectors-manual.json` for an AC with no E2E match

**Files:**
- Modify: `scripts/playback-capture.js`
- Modify: `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`

- [ ] **Step 1: Write the failing test**

Insert into `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`, directly after the two AC1 tests and before the `console.log` summary line:

```javascript
// AC2 (unit): falls back to the manual file when no E2E match exists
(function () {
  const { loadManualFallback } = require('../scripts/playback-capture');
  const fs = require('fs');
  const path = require('path');
  const fixtureDir = path.join(__dirname, '..', 'artefacts', 'rpca-s2-test-fixture', 'playback', 'rpca-fixture-story');
  fs.mkdirSync(fixtureDir, { recursive: true });
  const fixturePath = path.join(fixtureDir, 'selectors-manual.json');
  fs.writeFileSync(fixturePath, JSON.stringify({ AC2: { url: '/fixture', selector: '.fixture' } }));
  try {
    const result = loadManualFallback('rpca-s2-test-fixture', 'rpca-fixture-story', 'AC2');
    assert.deepStrictEqual(result, { url: '/fixture', selector: '.fixture' }, 'expected the exact fallback entry for AC2');
    pass('AC2 (unit): falls back to the manual file when no E2E match exists');
  } catch (e) { fail('AC2 (unit): falls back to the manual file when no E2E match exists', e); }
  finally { fs.rmSync(path.join(__dirname, '..', 'artefacts', 'rpca-s2-test-fixture'), { recursive: true, force: true }); }
})();

// AC2 (unit): returns null when selectors-manual.json does not exist (normal case, not an error)
(function () {
  const { loadManualFallback } = require('../scripts/playback-capture');
  try {
    const result = loadManualFallback('no-such-feature-slug-rpca-s2-test', 'no-such-story', 'AC1');
    assert.strictEqual(result, null, 'expected null, not a throw, when the fallback file does not exist');
    pass('AC2 (unit): returns null when selectors-manual.json does not exist (normal case, not an error)');
  } catch (e) { fail('AC2 (unit): returns null when selectors-manual.json does not exist (normal case, not an error)', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
```

Expected output: `TypeError: loadManualFallback is not a function` (or equivalent)

- [ ] **Step 3: Write minimal implementation**

In `scripts/playback-capture.js`, add directly after `deriveSelectorFromSpec`:

```javascript
// rpca-s2: reads the manually-authored fallback file for one AC when no E2E
// spec covers it. A missing file is the normal, expected case for a feature
// that hasn't needed a manual entry yet -- returns null, never throws.
// featureSlug/storySlug come from the same untrusted-shaped CLI-argument
// origin buildScreenshotPath already guards (rpca-s1-hotfix1) -- applies the
// identical path-traversal guard before any fs access.
function loadManualFallback(featureSlug, storySlug, acId) {
  const path = require('path');
  const relPath = `artefacts/${featureSlug}/playback/${storySlug}/selectors-manual.json`;
  const repoRoot = path.resolve(__dirname, '..');
  const resolvedPath = path.resolve(repoRoot, relPath);
  if (!resolvedPath.startsWith(repoRoot + path.sep)) {
    throw new Error(`Refusing to read a manual fallback path outside the repo root -- check the feature-slug argument: "${featureSlug}"`);
  }
  if (!fs.existsSync(resolvedPath)) return null;
  const data = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  return data[acId] || null;
}
```

Add `loadManualFallback` to the `module.exports` block.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
```

Expected output:
```
  [PASS] AC1 (unit): derives a selector from a real-shaped E2E spec fixture
  [PASS] AC1 (unit): returns null when the spec file does not name the AC at all
  [PASS] AC2 (unit): falls back to the manual file when no E2E match exists
  [PASS] AC2 (unit): returns null when selectors-manual.json does not exist (normal case, not an error)

[rpca-s2-selector-derivation-from-e2e-specs] Results: 4 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add scripts/playback-capture.js tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
git commit -m "rpca-s2: loadManualFallback reads selectors-manual.json with a path-traversal guard (AC2)"
```

---

## Task 3: `buildCaptureList` — skips with a named warning when neither source has an entry

**Files:**
- Modify: `scripts/playback-capture.js`
- Modify: `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`

- [ ] **Step 1: Write the failing test**

Insert into `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`, directly after the AC2 tests and before the `console.log` summary line:

```javascript
// AC3 (unit): skips with a named warning, doesn't crash, when neither source has an entry
(function () {
  const { buildCaptureList } = require('../scripts/playback-capture');
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => { warnings.push(args.join(' ')); };
  try {
    const result = buildCaptureList('no-such-feature-slug-rpca-s2-test', 'no-such-story', ['AC9'], []);
    assert.deepStrictEqual(result.captured, [], 'expected no entries captured for an AC in neither source');
    assert.strictEqual(result.skipped, 1, 'expected exactly one AC skipped');
    assert.ok(warnings.some(w => w.includes('AC9')), 'expected a warning naming the specific skipped AC id');
    pass("AC3 (unit): skips with a named warning, doesn't crash, when neither source has an entry");
  } catch (e) { fail("AC3 (unit): skips with a named warning, doesn't crash, when neither source has an entry", e); }
  finally { console.warn = originalWarn; }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
```

Expected output: `TypeError: buildCaptureList is not a function` (or equivalent)

- [ ] **Step 3: Write minimal implementation**

In `scripts/playback-capture.js`, add directly after `loadManualFallback`:

```javascript
// rpca-s2: builds the real multi-AC capture list -- tries every spec file's
// own deriveSelectorFromSpec first (E2E specs are the primary source, per
// discovery's own MVP scope item 4), then loadManualFallback, then skips
// with a named warning identifying the specific AC. Never throws on a
// no-match AC -- that's the normal "not every AC has coverage yet" case,
// not an error; only a real path-traversal attempt (loadManualFallback's
// own guard) throws.
function buildCaptureList(featureSlug, storySlug, acIds, specFiles) {
  const captured = [];
  let skipped = 0;
  for (const acId of acIds) {
    let entry = null;
    for (const specContent of specFiles) {
      entry = deriveSelectorFromSpec(specContent, acId);
      if (entry) break;
    }
    if (!entry) {
      const fallback = loadManualFallback(featureSlug, storySlug, acId);
      if (fallback) entry = Object.assign({ acId }, fallback);
    }
    if (entry) {
      captured.push(entry);
    } else {
      skipped += 1;
      console.warn(`[playback-capture] No selector found for ${acId} -- skipping (no E2E spec match, no manual fallback entry)`);
    }
  }
  return { captured, skipped, summary: `${captured.length} captured, ${skipped} skipped` };
}
```

Add `buildCaptureList` to the `module.exports` block.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
```

Expected output:
```
  [PASS] AC1 (unit): derives a selector from a real-shaped E2E spec fixture
  [PASS] AC1 (unit): returns null when the spec file does not name the AC at all
  [PASS] AC2 (unit): falls back to the manual file when no E2E match exists
  [PASS] AC2 (unit): returns null when selectors-manual.json does not exist (normal case, not an error)
  [PASS] AC3 (unit): skips with a named warning, doesn't crash, when neither source has an entry

[rpca-s2-selector-derivation-from-e2e-specs] Results: 5 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add scripts/playback-capture.js tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
git commit -m "rpca-s2: buildCaptureList skips with a named warning when neither source matches (AC3)"
```

---

## Task 4: `buildCaptureList` full multi-AC integration — correct capture/skip counts

**Files:**
- Modify: `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` (no further `scripts/playback-capture.js` change — `buildCaptureList` already handles the multi-AC case from Task 3)

- [ ] **Step 1: Write the failing test**

Insert into `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`, directly after the AC3 test and before the `console.log` summary line:

```javascript
// AC4 (integration): a full multi-AC run reports correct capture/skip counts
(function () {
  const { buildCaptureList } = require('../scripts/playback-capture');
  const fs = require('fs');
  const path = require('path');
  const fixtureDir = path.join(__dirname, '..', 'artefacts', 'rpca-s2-test-fixture-ac4', 'playback', 'rpca-fixture-story');
  fs.mkdirSync(fixtureDir, { recursive: true });
  fs.writeFileSync(path.join(fixtureDir, 'selectors-manual.json'), JSON.stringify({ AC3: { url: '/fixture', selector: '.fixture-ac3' } }));
  try {
    const specFiles = [
      `// fixture-spec-1.spec.js -- E2E for X (rpca-fixture-story AC1)\nconst el = page.locator('.fixture-ac1');\n`,
      `// fixture-spec-2.spec.js -- E2E for Y (rpca-fixture-story AC2)\nconst el = page.locator('.fixture-ac2');\n`,
    ];
    const result = buildCaptureList('rpca-s2-test-fixture-ac4', 'rpca-fixture-story', ['AC1', 'AC2', 'AC3', 'AC4'], specFiles);
    assert.strictEqual(result.captured.length, 3, 'expected 3 ACs captured: AC1 + AC2 (E2E-derived), AC3 (manual fallback)');
    assert.strictEqual(result.skipped, 1, 'expected AC4 skipped (neither source)');
    assert.strictEqual(result.summary, '3 captured, 1 skipped', 'expected the exact summary string');
    assert.deepStrictEqual(result.captured.find(c => c.acId === 'AC1'), { acId: 'AC1', selector: '.fixture-ac1' });
    assert.deepStrictEqual(result.captured.find(c => c.acId === 'AC3'), { acId: 'AC3', url: '/fixture', selector: '.fixture-ac3' });
    pass('AC4 (integration): a full multi-AC run reports correct capture/skip counts');
  } catch (e) { fail('AC4 (integration): a full multi-AC run reports correct capture/skip counts', e); }
  finally { fs.rmSync(path.join(__dirname, '..', 'artefacts', 'rpca-s2-test-fixture-ac4'), { recursive: true, force: true }); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
```

Expected output: `AssertionError` on `result.captured.length` or `result.summary` if Task 3's own implementation has any ordering/shape bug not yet exercised by a single-AC test — this task is the first to prove the multi-AC path end to end. If Task 3's implementation is correct, this may pass immediately; write it as a failing-first test regardless by temporarily commenting out the `buildCaptureList` export to confirm the harness itself fails correctly, then restore it.

- [ ] **Step 3: Confirm implementation (no new code — Task 3's `buildCaptureList` already covers this)**

No new implementation step. If Step 2 reveals a real bug, fix it in `buildCaptureList` directly (in `scripts/playback-capture.js`) before proceeding.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
```

Expected output:
```
  [PASS] AC1 (unit): derives a selector from a real-shaped E2E spec fixture
  [PASS] AC1 (unit): returns null when the spec file does not name the AC at all
  [PASS] AC2 (unit): falls back to the manual file when no E2E match exists
  [PASS] AC2 (unit): returns null when selectors-manual.json does not exist (normal case, not an error)
  [PASS] AC3 (unit): skips with a named warning, doesn't crash, when neither source has an entry
  [PASS] AC4 (integration): a full multi-AC run reports correct capture/skip counts

[rpca-s2-selector-derivation-from-e2e-specs] Results: 6 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
git commit -m "rpca-s2: integration test proves the full multi-AC capture/skip path (AC4)"
```

---

## Final step: full regression suite

```bash
node scripts/run-all-tests.js
```

Expected output: all files pass, 0 failed (baseline was 763 files / 0 failed at `/branch-setup`; this story adds 1 new test file).
