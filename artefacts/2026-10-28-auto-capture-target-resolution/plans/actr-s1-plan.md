# Derive capture target (URL + selector) from a story's own E2E spec — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Add a shared, pure function that derives both a capture `url` and a CSS `selector` from an E2E spec file's own text, extending the existing selector-only logic (`deriveSelectorFromSpec`, `scripts/playback-capture.js`, story `rpca-s2`), relocated to a shared module reusable from both the CLI script and the web-ui route (`actr-s2`).
**Branch:** `feature/actr-s1`
**Worktree:** `.worktrees/actr-s1`
**Test command:** `node scripts/run-all-tests.js` (confirmed from `package.json`'s `scripts.test`); an individual check file runs directly via `node tests/check-actr-s1-capture-target-derivation.js`.

---

## File map

```
Create:
  src/utils/capture-target-derivation.js       — pure, I/O-free deriveCaptureTargetFromSpec(specText, acId) -> {acId, url, selector}|null
  tests/check-actr-s1-capture-target-derivation.js — unit tests for the new module (AC1, AC2, AC2b, AC3, AC4)

Modify:
  scripts/playback-capture.js                  — deriveSelectorFromSpec becomes a thin wrapper delegating to the new shared module, preserving its exact existing {acId, selector}-or-null contract (AC5)
```

No other files change. `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` is NOT modified — it is the regression guard for AC5 and must pass unchanged.

---

## Task 1: Core shared function — selector parity + no-match behaviour (AC1, AC4)

**Files:**
- Create: `src/utils/capture-target-derivation.js`
- Create: `tests/check-actr-s1-capture-target-derivation.js`

- [ ] **Step 1: Write the failing tests**

```javascript
'use strict';
// check-actr-s1-capture-target-derivation.js -- TDD tests for actr-s1
// (2026-10-28-auto-capture-target-resolution).
// Story: artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s1-derive-capture-target-from-e2e-spec.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

// AC1 (unit): selector parity -- same fixture shape as a real resolvable spec
// (tag, then goto, then locator -- matching fpd-s4-caption-sync.spec.js's own order)
(function () {
  const { deriveCaptureTargetFromSpec } = require('../src/utils/capture-target-derivation');
  try {
    const fixtureSpec = `// fixture.spec.js (actr-fixture AC1)\nwithAuth('does the thing', async ({ page }) => {\n  await page.goto('/playback/actr-fixture');\n  const el = page.locator('.actr-target');\n});\n`;
    const result = deriveCaptureTargetFromSpec(fixtureSpec, 'AC1');
    assert.strictEqual(result.selector, '.actr-target', 'expected the same selector deriveSelectorFromSpec would find');
    pass('AC1 (unit): derives the selector correctly');
  } catch (e) { fail('AC1 (unit): derives the selector correctly', e); }
})();

// AC4 (unit): no AC tag match anywhere -> null, never a throw
(function () {
  const { deriveCaptureTargetFromSpec } = require('../src/utils/capture-target-derivation');
  try {
    const fixtureSpec = `// fixture.spec.js (actr-fixture AC9)\nconst el = page.locator('.unrelated');\n`;
    const result = deriveCaptureTargetFromSpec(fixtureSpec, 'AC1');
    assert.strictEqual(result, null, 'expected null when the AC id is not named in the spec file at all');
    pass('AC4 (unit): returns null when the spec file does not name the AC at all');
  } catch (e) { fail('AC4 (unit): returns null when the spec file does not name the AC at all', e); }
})();

console.log(`\n[actr-s1-capture-target-derivation] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-actr-s1-capture-target-derivation.js
```

Expected output: `Error: Cannot find module '../src/utils/capture-target-derivation'` (module does not exist yet)

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';
// src/utils/capture-target-derivation.js -- actr-s1. Shared, pure, I/O-free
// derivation of a capture target {acId, url, selector} from a single E2E
// spec file's own text. Extends scripts/playback-capture.js's existing
// deriveSelectorFromSpec (story rpca-s2) with URL derivation, relocated here
// so both scripts/playback-capture.js and src/web-ui/routes/playback-
// evidence.js (actr-s2/actr-s3) can reuse it without duplicating the
// regex-based parsing. See decisions.md's 2026-10-28 CORRECTION entry for
// why this scans FORWARD from the AC tag, not backward.

/**
 * Derives a capture target {acId, url, selector} from a single E2E spec
 * file's own text. Pure, synchronous, no I/O.
 *
 * AC1/AC4: selector-half behaviour matches deriveSelectorFromSpec exactly --
 * same AC-tag anchor (`\b<acId>)`), same "nearest FOLLOWING
 * page.locator(...)" rule, same null-if-no-AC-tag-match behaviour.
 *
 * @param {string} specFileContent
 * @param {string} acId
 * @returns {{acId: string, url: string|null, selector: string|null}|null}
 */
function deriveCaptureTargetFromSpec(specFileContent, acId) {
  const acRe = new RegExp(`\\b${acId}\\)`);
  const acMatch = acRe.exec(specFileContent);
  if (!acMatch) return null;

  const rest = specFileContent.slice(acMatch.index);
  const locatorMatch = rest.match(/page\.locator\(['"]([^'"]+)['"]\)/);
  const selector = locatorMatch ? locatorMatch[1] : null;

  return { acId: acId, url: null, selector: selector };
}

module.exports = { deriveCaptureTargetFromSpec };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-actr-s1-capture-target-derivation.js
```

Expected output: `[actr-s1-capture-target-derivation] Results: 2 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (808 files — the 807 baseline plus this new file; this new file is not yet wired into `run-all-tests.js`'s own discovery until it is saved under `tests/check-*.js`, which it already is by this naming convention, so it is picked up automatically)

- [ ] **Step 6: Commit**

```bash
git add src/utils/capture-target-derivation.js tests/check-actr-s1-capture-target-derivation.js
git commit -m "feat(actr-s1): add deriveCaptureTargetFromSpec core (selector parity, no-match null)"
```

---

## Task 2: Forward goto-scan for URL derivation (AC2)

**Files:**
- Modify: `src/utils/capture-target-derivation.js`
- Modify: `tests/check-actr-s1-capture-target-derivation.js`

- [ ] **Step 1: Write the failing tests**

Add to `tests/check-actr-s1-capture-target-derivation.js`, immediately before the `console.log` summary line at the end:

```javascript
// AC2 (unit): url derived from a goto call appearing AFTER the AC tag --
// confirmed against the real fpd-s4-caption-sync.spec.js shape (tag, then
// goto, then locator) before this was written. See decisions.md's
// 2026-10-28 CORRECTION entry.
(function () {
  const { deriveCaptureTargetFromSpec } = require('../src/utils/capture-target-derivation');
  try {
    const fixtureSpec = `// fixture.spec.js (actr-fixture AC1)\nwithAuth('does the thing', async ({ page }) => {\n  await page.goto('/playback/actr-fixture');\n  const el = page.locator('.actr-target');\n});\n`;
    const result = deriveCaptureTargetFromSpec(fixtureSpec, 'AC1');
    assert.strictEqual(result.url, '/playback/actr-fixture', 'expected the goto path found after the tag');
    pass('AC2 (unit): derives url from a goto call appearing after the AC tag');
  } catch (e) { fail('AC2 (unit): derives url from a goto call appearing after the AC tag', e); }
})();

// AC2 (unit, regression guard for the corrected design): a goto call
// appearing BEFORE the AC tag must never be picked up -- this is the
// direction the first draft of this story got wrong; see decisions.md.
(function () {
  const { deriveCaptureTargetFromSpec } = require('../src/utils/capture-target-derivation');
  try {
    const fixtureSpec = `await page.goto('/should-not-be-used');\n// fixture.spec.js (actr-fixture AC1)\nconst el = page.locator('.actr-target');\n`;
    const result = deriveCaptureTargetFromSpec(fixtureSpec, 'AC1');
    assert.strictEqual(result.url, null, 'a goto call preceding the AC tag must never be returned as this AC\'s url');
    pass('AC2 (unit): does not find a url when the only goto call precedes the tag');
  } catch (e) { fail('AC2 (unit): does not find a url when the only goto call precedes the tag', e); }
})();

// AC2 (real-file confirmation): the design's own motivating real-world case.
(function () {
  const { deriveCaptureTargetFromSpec } = require('../src/utils/capture-target-derivation');
  const fs = require('fs');
  const path = require('path');
  try {
    const content = fs.readFileSync(path.join(__dirname, 'e2e', 'fpd-s4-caption-sync.spec.js'), 'utf8');
    const result = deriveCaptureTargetFromSpec(content, 'AC3');
    assert.deepStrictEqual(
      result,
      { acId: 'AC3', url: '/playback/some-dod-complete-feature-with-a-real-package', selector: '.playback-ac__video' },
      'expected both url and selector resolved from the real fpd-s4 file'
    );
    pass('AC2 (real-file): resolves both url and selector from the real fpd-s4-caption-sync.spec.js');
  } catch (e) { fail('AC2 (real-file): resolves both url and selector from the real fpd-s4-caption-sync.spec.js', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-actr-s1-capture-target-derivation.js
```

Expected output: the 2 new primary-case assertions fail (`result.url` is still always `null` from Task 1's implementation); the "precedes the tag" guard test currently passes by coincidence (nothing is implemented yet, so url is already null) — that is expected and fine, it becomes a real guard once Step 3 below is in place.

- [ ] **Step 3: Write minimal implementation**

Replace `deriveCaptureTargetFromSpec`'s body in `src/utils/capture-target-derivation.js` with:

```javascript
/**
 * Finds the nearest page.goto('<path>') call AFTER `anchorIndex` -- same
 * scan direction as the existing selector logic (deriveSelectorFromSpec's
 * own "nearest FOLLOWING locator" rule). Returns the raw matched string
 * (not yet validated) or null if no goto appears after the anchor within
 * `boundedText`.
 * @param {string} boundedText - text to search (already sliced/bounded by the caller)
 * @returns {string|null}
 */
function _firstGotoIn(boundedText) {
  const gotoMatch = boundedText.match(/page\.goto\(['"]([^'"]+)['"]\)/);
  return gotoMatch ? gotoMatch[1] : null;
}

function deriveCaptureTargetFromSpec(specFileContent, acId) {
  const acRe = new RegExp(`\\b${acId}\\)`);
  const acMatch = acRe.exec(specFileContent);
  if (!acMatch) return null;

  const rest = specFileContent.slice(acMatch.index);
  const locatorMatch = rest.match(/page\.locator\(['"]([^'"]+)['"]\)/);
  const selector = locatorMatch ? locatorMatch[1] : null;

  const rawUrl = _firstGotoIn(rest);

  return { acId: acId, url: rawUrl, selector: selector };
}
```

(AC2b's section-boundary and AC3's relative-path guard are not yet applied to `rawUrl` -- Task 3 and Task 4 add those. Keep `_firstGotoIn` as a named, separately testable helper.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-actr-s1-capture-target-derivation.js
```

Expected output: `[actr-s1-capture-target-derivation] Results: 5 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/utils/capture-target-derivation.js tests/check-actr-s1-capture-target-derivation.js
git commit -m "feat(actr-s1): derive url from the nearest goto call after the AC tag"
```

---

## Task 3: Bound the scan to the AC's own section (AC2b)

**Files:**
- Modify: `src/utils/capture-target-derivation.js`
- Modify: `tests/check-actr-s1-capture-target-derivation.js`

- [ ] **Step 1: Write the failing test**

Add to the test file:

```javascript
// AC2b (unit): a later AC's own goto in the same file must never be
// attributed to an earlier AC -- the same class of bug rpca-s2-hotfix1
// already fixed for the selector side of this scan. AC1's OWN section
// deliberately has NO literal goto (its real-world equivalent: a dynamic or
// helper-wrapped navigation, like jcx-s3-emotion-curve.spec.js's own
// openCustomerExperienceView helper) so an unbounded forward scan falls
// through into AC2's section and finds AC2's goto instead -- that fall-
// through is the actual bug this AC exists to prevent. If AC1's own section
// already had a literal goto, Task 2's unbounded "first match in rest" scan
// would already return the right answer by coincidence (nearest-wins), and
// this test would not actually exercise the bug.
(function () {
  const { deriveCaptureTargetFromSpec } = require('../src/utils/capture-target-derivation');
  try {
    const fixtureSpec =
      `// fixture.spec.js (actr-fixture AC1)\n` +
      `withAuth('ac1 test', async ({ page }) => {\n  const el = page.locator('.ac1-target');\n});\n` +
      `// fixture.spec.js (actr-fixture AC2)\n` +
      `withAuth('ac2 test', async ({ page }) => {\n  await page.goto('/ac2-page');\n  const el = page.locator('.ac2-target');\n});\n`;
    const ac1Result = deriveCaptureTargetFromSpec(fixtureSpec, 'AC1');
    const ac2Result = deriveCaptureTargetFromSpec(fixtureSpec, 'AC2');
    assert.deepStrictEqual(ac1Result, { acId: 'AC1', url: null, selector: '.ac1-target' }, 'AC1 has no goto of its own and must not borrow AC2\'s');
    assert.deepStrictEqual(ac2Result, { acId: 'AC2', url: '/ac2-page', selector: '.ac2-target' }, 'AC2 must still resolve its own url/selector correctly');
    pass('AC2b (unit): bounds the scan so a later AC\'s goto never leaks into an earlier AC that has none of its own');
  } catch (e) { fail('AC2b (unit): bounds the scan so a later AC\'s goto never leaks into an earlier AC that has none of its own', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-actr-s1-capture-target-derivation.js
```

Expected output: the `AC1 has no goto of its own and must not borrow AC2's` assertion fails — Task 2's implementation scans `rest = specFileContent.slice(acMatch.index)` (AC1's tag to end of file, unbounded), so when AC1's own section has no literal `goto`, the scan falls through into AC2's section and incorrectly returns `url: '/ac2-page'` for AC1.

- [ ] **Step 3: Write minimal implementation**

Replace `deriveCaptureTargetFromSpec`'s body with:

```javascript
function deriveCaptureTargetFromSpec(specFileContent, acId) {
  const acRe = new RegExp(`\\b${acId}\\)`);
  const acMatch = acRe.exec(specFileContent);
  if (!acMatch) return null;

  // AC2b: bound the section to the next AC tag found anywhere in the file
  // (if any) -- generic \bAC\d+\) pattern, not this acId specifically, so a
  // later, DIFFERENT AC's own goto/locator can never be picked up for this
  // one. Mirrors rpca-s2-hotfix1's own per-AC-section isolation for the
  // selector scan, now applied uniformly to both fields.
  const afterTag = specFileContent.slice(acMatch.index + acMatch[0].length);
  const nextAcMatch = afterTag.match(/\bAC\d+\)/);
  const sectionEnd = nextAcMatch
    ? acMatch.index + acMatch[0].length + nextAcMatch.index
    : specFileContent.length;
  const section = specFileContent.slice(acMatch.index, sectionEnd);

  const locatorMatch = section.match(/page\.locator\(['"]([^'"]+)['"]\)/);
  const selector = locatorMatch ? locatorMatch[1] : null;

  const rawUrl = _firstGotoIn(section);

  return { acId: acId, url: rawUrl, selector: selector };
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-actr-s1-capture-target-derivation.js
```

Expected output: `[actr-s1-capture-target-derivation] Results: 6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing — pay particular attention to the existing `rpca-s2-hotfix1` shared-multi-AC-header test in `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` (not yet wired to this module, but conceptually the same scenario); this task's own Task 6 will confirm it directly once the delegation lands.

- [ ] **Step 6: Commit**

```bash
git add src/utils/capture-target-derivation.js tests/check-actr-s1-capture-target-derivation.js
git commit -m "feat(actr-s1): bound the url/selector scan to the AC's own section"
```

---

## Task 4: Relative-path guard on the derived URL (AC3)

**Files:**
- Modify: `src/utils/capture-target-derivation.js`
- Modify: `tests/check-actr-s1-capture-target-derivation.js`

- [ ] **Step 1: Write the failing tests**

Add to the test file:

```javascript
// AC3 (unit): an absolute URL found by the scan is never returned.
(function () {
  const { deriveCaptureTargetFromSpec } = require('../src/utils/capture-target-derivation');
  try {
    const fixtureSpec = `// fixture.spec.js (actr-fixture AC1)\nwithAuth('x', async ({ page }) => {\n  await page.goto('https://evil.example.com/x');\n  const el = page.locator('.actr-target');\n});\n`;
    const result = deriveCaptureTargetFromSpec(fixtureSpec, 'AC1');
    assert.strictEqual(result.url, null, 'an absolute URL must never be returned');
    pass('AC3 (unit): rejects an absolute goto URL');
  } catch (e) { fail('AC3 (unit): rejects an absolute goto URL', e); }
})();

// AC3 (unit, edge case): protocol-relative is not "relative" for this guard.
(function () {
  const { deriveCaptureTargetFromSpec } = require('../src/utils/capture-target-derivation');
  try {
    const fixtureSpec = `// fixture.spec.js (actr-fixture AC1)\nwithAuth('x', async ({ page }) => {\n  await page.goto('//evil.example.com/x');\n  const el = page.locator('.actr-target');\n});\n`;
    const result = deriveCaptureTargetFromSpec(fixtureSpec, 'AC1');
    assert.strictEqual(result.url, null, 'a protocol-relative URL must never be returned -- it still changes host');
    pass('AC3 (unit): rejects a protocol-relative goto URL');
  } catch (e) { fail('AC3 (unit): rejects a protocol-relative goto URL', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-actr-s1-capture-target-derivation.js
```

Expected output: both new assertions fail (`result.url` is currently the unvalidated raw string, e.g. `'https://evil.example.com/x'`, not `null`)

- [ ] **Step 3: Write minimal implementation**

Add this function and apply it in `deriveCaptureTargetFromSpec`:

```javascript
/**
 * actr-s1 (AC3): a spec-derived URL is only ever trusted if it is a
 * same-origin relative path -- never absolute (https://...) or
 * protocol-relative (//...), both of which would change the host a later,
 * session-authenticated Playwright page.goto() call actually navigates to.
 * See decisions.md's 2026-10-28 SECURITY entry.
 * @param {string|null} rawUrl
 * @returns {string|null}
 */
function _validateRelativeUrl(rawUrl) {
  if (!rawUrl) return null;
  if (rawUrl.startsWith('//')) return null;
  if (!rawUrl.startsWith('/')) return null;
  return rawUrl;
}
```

In `deriveCaptureTargetFromSpec`, change the final return to:

```javascript
  return { acId: acId, url: _validateRelativeUrl(rawUrl), selector: selector };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-actr-s1-capture-target-derivation.js
```

Expected output: `[actr-s1-capture-target-derivation] Results: 8 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/utils/capture-target-derivation.js tests/check-actr-s1-capture-target-derivation.js
git commit -m "feat(actr-s1): reject non-relative goto URLs (absolute and protocol-relative)"
```

---

## Task 5: Relocate deriveSelectorFromSpec to delegate to the shared module (AC5)

**Files:**
- Modify: `scripts/playback-capture.js`

- [ ] **Step 1: Confirm the regression baseline first (no new test file — this task's test IS the existing suite)**

```bash
node tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
```

Expected output (BEFORE this task's change): `[rpca-s2-selector-derivation-from-e2e-specs] Results: 8 passed, 0 failed` (confirms the starting baseline so any later failure is attributable to this task's own change, not a pre-existing issue)

- [ ] **Step 2: Replace `deriveSelectorFromSpec`'s body in `scripts/playback-capture.js`**

Find the existing `deriveSelectorFromSpec` function (originally defined around line 333, per the story's own Background reference — read the file directly to confirm the current exact line before editing, do not assume the line number is still exact after Tasks 1-4 touched other files). Add this import near the top of the file, alongside the other `require` statements:

```javascript
const { deriveCaptureTargetFromSpec } = require('../src/utils/capture-target-derivation');
```

Replace the existing `deriveSelectorFromSpec` function body with:

```javascript
function deriveSelectorFromSpec(specFileContent, acId) {
  const result = deriveCaptureTargetFromSpec(specFileContent, acId);
  if (!result || result.selector == null) return null;
  return { acId: result.acId, selector: result.selector };
}
```

Delete the function's own old regex-matching body (now superseded by the shared module) — keep the function's doc comment, updated to note it now delegates (see the full comment below).

Keep the doc comment, updated:

```javascript
// rpca-s2: thin wrapper preserving this function's own exact, long-standing
// {acId, selector}-or-null contract (assert.deepStrictEqual in
// tests/check-rpca-s2-selector-derivation-from-e2e-specs.js depends on this
// exact shape -- no extra `url` key). Core matching logic now lives in
// src/utils/capture-target-derivation.js (actr-s1), shared with the web-ui
// route (actr-s2). `result.selector == null` (not `!result`) preserves the
// old behaviour precisely: null both when the AC tag isn't found at all AND
// when it is found but no locator follows it in that AC's own section.
```

- [ ] **Step 3: Run the existing suite — must still pass unchanged**

```bash
node tests/check-rpca-s2-selector-derivation-from-e2e-specs.js
```

Expected output: `[rpca-s2-selector-derivation-from-e2e-specs] Results: 8 passed, 0 failed` — identical to Step 1's baseline

- [ ] **Step 4: Run the new module's own suite too — still passing**

```bash
node tests/check-actr-s1-capture-target-derivation.js
```

Expected output: `[actr-s1-capture-target-derivation] Results: 8 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing, 809 files run, 0 failed (807 baseline + the 2 new/modified check files)

- [ ] **Step 6: Commit**

```bash
git add scripts/playback-capture.js
git commit -m "refactor(actr-s1): relocate deriveSelectorFromSpec's core matching to the shared capture-target-derivation module"
```

---

## Post-implementation note for /verify-completion

AC1, AC2, AC2b, AC3, AC4 are verified by `tests/check-actr-s1-capture-target-derivation.js`. AC5 is verified by the UNCHANGED `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` passing identically before and after Task 5's refactor — do not edit that file as part of this story; any need to touch it is itself a sign Task 5's delegation broke the old contract.
