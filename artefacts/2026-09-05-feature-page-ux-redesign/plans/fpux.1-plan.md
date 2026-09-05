# Unify `/features/:slug`'s visual language across feature-level and per-story sections — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass without adding scope beyond the ACs.
**Branch:** `feature/fpux.1`
**Worktree:** `.worktrees/fpux.1`
**Test command:** `npm test` (unit suite, `node scripts/run-all-tests.js`) and `npm run test:e2e -- tests/e2e/fpux.1-*.spec.js` (Playwright, ADR-018)

---

## File map

```
Modify:
  src/web-ui/utils/html-shell.js   — add .sw-epic-group/.sw-story-row to DESIGN_SYSTEM_CSS
  src/web-ui/routes/features.js    — hoist renderStory to module scope, use new classes, export renderStory

Create:
  tests/check-fpux.1-unify-visual-language.js   — unit tests (AC1, AC5)
  tests/e2e/fpux.1-visual-consistency-theme.spec.js   — E2E (AC1, AC2)
  tests/e2e/fpux.1-keyboard-focus.spec.js             — E2E (AC3)
  tests/e2e/fpux.1-contrast-ratio.spec.js             — E2E (AC4)
```

---

## Task 1: Add `.sw-epic-group`/`.sw-story-row` shared CSS classes

**Files:**
- Modify: `src/web-ui/utils/html-shell.js`

No dedicated unit test for this task — CSS values are exercised by the E2E tests in Tasks 4–6. This is pure foundation for Task 2's markup change.

- [ ] **Step 1: Add the new CSS block to `DESIGN_SYSTEM_CSS`**

Open `src/web-ui/utils/html-shell.js`. Find this exact block (around line 706-710):

```js
/* ── Lists ──────────────────────────────────────────────────────────────────── */
.sw-list { list-style: none; margin: 0; padding: 0; background: var(--surface);
  border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.sw-list li { padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
.sw-list li + li { border-top: 1px solid var(--line); }
```

Insert this new block immediately after it (still inside the `DESIGN_SYSTEM_CSS` template literal):

```js

/* ── Epic/story accordion (fpux.1) ────────────────────────────────────────── */
.sw-epic-group {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 8px; margin: 8px 0; padding: 10px 14px;
}
.sw-epic-group > summary {
  cursor: pointer; font-size: 15px; font-weight: 600; color: var(--ink);
  display: flex; align-items: center; gap: 6px;
}
.sw-epic-group > summary::marker,
.sw-epic-group > summary::-webkit-details-marker { display: none; content: ''; }
.sw-epic-group > summary::before {
  content: '▸'; display: inline-block; transition: transform 0.15s ease;
  font-size: 12px; color: var(--muted);
}
.sw-epic-group[open] > summary::before { transform: rotate(90deg); }
.sw-epic-group > summary:focus-visible {
  outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px;
}
.sw-story-row { margin: 4px 0 4px 16px; padding: 6px 10px; }
.sw-story-row + .sw-story-row { border-top: 1px solid var(--line); }
.sw-story-row > summary {
  cursor: pointer; font-size: 14px; font-weight: 500; color: var(--ink);
  display: flex; align-items: center; gap: 6px;
}
.sw-story-row > summary::marker,
.sw-story-row > summary::-webkit-details-marker { display: none; content: ''; }
.sw-story-row > summary::before {
  content: '▸'; display: inline-block; transition: transform 0.15s ease;
  font-size: 11px; color: var(--muted);
}
.sw-story-row[open] > summary::before { transform: rotate(90deg); }
.sw-story-row > summary:focus-visible {
  outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px;
}
```

Every value used (`var(--surface)`, `var(--line)`, `var(--ink)`, `var(--muted)`, `var(--accent)`) is an existing token already defined in this same file's `:root`/`[data-theme]` blocks — no new literal colors, radii, or spacing units are introduced.

- [ ] **Step 2: Sanity-check the file still parses**

```bash
node -e "require('./src/web-ui/utils/html-shell.js')"
```

Expected output: no error (empty output, exit code 0).

- [ ] **Step 3: Commit**

```bash
git add src/web-ui/utils/html-shell.js
git commit -m "feat: add sw-epic-group and sw-story-row shared CSS classes"
```

---

## Task 2: Use the new classes in `renderGroupedArtefactIndexHtml`, hoist `renderStory` (AC1)

**Files:**
- Modify: `src/web-ui/routes/features.js`
- Create: `tests/check-fpux.1-unify-visual-language.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-fpux.1-unify-visual-language.js`:

```js
'use strict';
// check-fpux.1-unify-visual-language.js -- fpux.1: renderGroupedArtefactIndexHtml
// and renderStory must emit the shared .sw-epic-group/.sw-story-row classes
// (html-shell.js) instead of the old page-local inline style="..." attributes,
// eliminating the visual seam against the .sw-card feature-level list above it.

var assert = require('assert');
var path = require('path');
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

var grouped = {
  featureLevel: [],
  epics: [
    {
      epicName: 'Phase 0 — Authorization Guard',
      epicSlug: 'phase-0',
      stories: [
        { slug: 'p0.1', artefacts: [{ type: 'dod', path: 'p0.1-dod.md', createdAt: '2026-01-01' }] }
      ]
    }
  ],
  flatStories: []
};

console.log('\n[fpux.1] AC1 -- sw-epic-group/sw-story-row classes present, old inline styles absent');
{
  var mod = freshRequire(FEATURES_PATH);
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'test-feature', {});

  test('T1: epic wrapper has class="sw-epic-group"', function() {
    assert.ok(html.indexOf('class="sw-epic-group"') !== -1, 'expected sw-epic-group class, got: ' + html.slice(0, 200));
  });
  test('T1: epic wrapper does NOT use the old inline style literal', function() {
    assert.ok(html.indexOf('style="margin:8px 0;padding:10px 14px;border:1px solid var(--line);border-radius:10px"') === -1,
      'old inline style literal still present');
  });
  test('T2: story row has class="sw-story-row"', function() {
    assert.ok(html.indexOf('class="sw-story-row"') !== -1, 'expected sw-story-row class, got: ' + html.slice(0, 400));
  });
  test('T2: story row does NOT use the old inline style literal', function() {
    assert.ok(html.indexOf('style="margin:4px 0 4px 16px;padding:6px 10px;border:1px solid var(--line);border-radius:8px"') === -1,
      'old inline style literal still present');
  });
}

console.log('\n--- fpux.1 (visual language) Results ---');
console.log('Passed:', passed, ' Failed:', failed);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpux.1-unify-visual-language.js
```

Expected output: `[FAIL] T1: epic wrapper has class="sw-epic-group"` and `[FAIL] T2: story row has class="sw-story-row"` (the other two "does NOT use old style" checks will pass trivially since the old class names haven't changed yet — that's fine, only the two class-presence checks must fail here).

- [ ] **Step 3: Write the implementation**

In `src/web-ui/routes/features.js`, replace the existing `renderGroupedArtefactIndexHtml` function (the block starting `function renderGroupedArtefactIndexHtml(grouped, featureSlug, resumeLookup) {` through its closing `}`) with:

```js
/**
 * fpux.1: renders one story's own disclosure row inside the grouped
 * epic/story accordion, using the .sw-story-row shared class (html-shell.js)
 * instead of the old inline style="..." attributes -- fixes the visual seam
 * against the feature-level .sw-card list above it.
 * Hoisted out of renderGroupedArtefactIndexHtml (was a closure) so it is
 * independently unit-testable and exported below.
 * @param {{slug: string, artefacts: Array}} story
 * @param {string} featureSlug
 * @param {Object<string, {skillName: string, sessionId: string, journeyId: string}>} [resumeLookup]
 * @returns {string} HTML string, or '' if the story has no artefacts
 */
function renderStory(story, featureSlug, resumeLookup) {
  if (story.artefacts.length === 0) return '';
  return '<details class="sw-story-row">' +
    '<summary>' + shellEscHtml(story.slug) + '</summary>' +
    '<div style="margin-top:8px">' + _renderArtefactListByType(story.artefacts, featureSlug, resumeLookup) + '</div>' +
  '</details>';
}

function renderGroupedArtefactIndexHtml(grouped, featureSlug, resumeLookup) {
  const featureLevelHtml = grouped.featureLevel.length > 0
    ? _renderArtefactListByType(grouped.featureLevel, featureSlug, resumeLookup)
    : '';

  const epicsHtml = grouped.epics.map((epic) => {
    const storiesHtml = epic.stories.map((story) => renderStory(story, featureSlug, resumeLookup)).join('');
    if (!storiesHtml) return '';
    return '<details class="sw-epic-group" open>' +
      '<summary>' + shellEscHtml(epic.epicName || epic.epicSlug || '') + '</summary>' +
      storiesHtml +
    '</details>';
  }).join('');

  const flatStoriesHtml = grouped.flatStories.length > 0
    ? '<details class="sw-epic-group" open>' +
        '<summary>Stories</summary>' +
        grouped.flatStories.map((story) => renderStory(story, featureSlug, resumeLookup)).join('') +
      '</details>'
    : '';

  return featureLevelHtml + epicsHtml + flatStoriesHtml;
}
```

Then update `module.exports` at the bottom of the file — add `renderStory` alongside the existing `renderGroupedArtefactIndexHtml`:

```js
module.exports = {
  handleGetFeatureArtefacts,
  handleGetIdeas,
  handlePostIdea,
  handleDeleteIdea,
  setIdeasStore,
  setAuditLogger,
  setListArtefacts,
  setJourneyStoreModule,
  renderFeatureList,
  renderArtefactItem,
  renderArtefactIndexHtml,
  renderGroupedArtefactIndexHtml,
  renderStory,
  escHtml
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpux.1-unify-visual-language.js
```

Expected output: `Passed: 4  Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: `615 file(s) run` (now 616 with the new test file), same 2 pre-existing failures as the branch-setup baseline (`check-p3.5-validate-trace.js`, `check-pcr-s1-test-runner.js`) and 0 new failures. Specifically re-run `node tests/check-fapg-s1-group-artefacts-by-story.js` and `node tests/check-wuce20-artefact-index-html.js` directly to confirm no regression in the data-layer/flat-rendering paths this task didn't intend to touch.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/features.js tests/check-fpux.1-unify-visual-language.js
git commit -m "feat: use sw-epic-group/sw-story-row classes in grouped artefact rendering"
```

---

## Task 3: Regression guard — "Delete this feature" button unchanged (AC5)

**Files:**
- Test: `tests/check-fpux.1-unify-visual-language.js` (append to the file created in Task 2)

- [ ] **Step 1: Write the test (expected to already pass — pure regression guard, no implementation change in this task)**

Append to `tests/check-fpux.1-unify-visual-language.js`, before the final `console.log('\n--- fpux.1 ...')` block:

```js
console.log('\n[fpux.1] AC5 (regression guard) -- delete-feature button markup unchanged by this story');
{
  var fs = require('fs');
  var src = fs.readFileSync(FEATURES_PATH, 'utf8');
  test('AC5: alrf-s10-delete-feature-btn id still present', function() {
    assert.ok(src.indexOf('alrf-s10-delete-feature-btn') !== -1, 'delete button id missing from features.js');
  });
  test('AC5: delete confirm()/fetch() script block still present', function() {
    assert.ok(src.indexOf('btn.addEventListener("click"') !== -1, 'delete button click handler missing');
    assert.ok(src.indexOf('method:"DELETE"') !== -1, 'DELETE fetch call missing');
  });
}
```

- [ ] **Step 2: Run test — must already pass (this task changes no delete-button code)**

```bash
node tests/check-fpux.1-unify-visual-language.js
```

Expected output: `Passed: 6  Failed: 0` (4 from Task 2 + 2 new here). If either new assertion fails, Task 2's edit accidentally touched the delete-button block — investigate and fix before proceeding; do not weaken this test to make it pass.

- [ ] **Step 3: Commit**

```bash
git add tests/check-fpux.1-unify-visual-language.js
git commit -m "test: add AC5 regression guard for delete-feature button markup"
```

---

## Task 4: E2E — visual consistency and light/dark theme (AC1, AC2)

**Files:**
- Create: `tests/e2e/fpux.1-visual-consistency-theme.spec.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/e2e/fpux.1-visual-consistency-theme.spec.js
'use strict';
const { test, expect } = require('@playwright/test');
const { renderShell } = require('../../src/web-ui/utils/html-shell.js');

function fixtureHtml(theme) {
  const body = '<div class="sw-card" id="ref"></div>' +
    '<details class="sw-epic-group" id="epic" open><summary id="epic-summary">Epic</summary>' +
      '<details class="sw-story-row" id="story"><summary id="story-summary">Story</summary></details>' +
    '</details>';
  const html = renderShell({ title: 'fpux.1 fixture', bodyContent: body, user: { login: 'fixture' } });
  return html.replace('<html lang="en">', `<html lang="en" data-theme="${theme}">`);
}

test('AC1: .sw-epic-group computed style matches .sw-card reference values', async ({ page }) => {
  await page.setContent(fixtureHtml('light'));
  const ref = await page.locator('#ref').evaluate((el) => {
    const s = getComputedStyle(el);
    return { radius: s.borderRadius, width: s.borderTopWidth, style: s.borderTopStyle, bg: s.backgroundColor };
  });
  const epic = await page.locator('#epic').evaluate((el) => {
    const s = getComputedStyle(el);
    return { radius: s.borderRadius, width: s.borderTopWidth, style: s.borderTopStyle, bg: s.backgroundColor };
  });
  expect(epic).toEqual(ref);
});

test('AC2a: .sw-epic-group/.sw-story-row resolve to light-theme token values', async ({ page }) => {
  await page.setContent(fixtureHtml('light'));
  const epicBg = await page.locator('#epic').evaluate((el) => getComputedStyle(el).backgroundColor);
  const storyColor = await page.locator('#story-summary').evaluate((el) => getComputedStyle(el).color);
  expect(epicBg).toBe('rgb(255, 255, 255)'); // --surface light: #FFFFFF
  expect(storyColor).toBe('rgb(24, 24, 27)'); // --ink light: #18181B
});

test('AC2b: .sw-epic-group/.sw-story-row resolve to dark-theme token values, different from light', async ({ page }) => {
  await page.setContent(fixtureHtml('dark'));
  const epicBg = await page.locator('#epic').evaluate((el) => getComputedStyle(el).backgroundColor);
  const storyColor = await page.locator('#story-summary').evaluate((el) => getComputedStyle(el).color);
  expect(epicBg).toBe('rgb(28, 28, 26)'); // --surface dark: #1C1C1A
  expect(storyColor).toBe('rgb(244, 244, 242)'); // --ink dark: #F4F4F2
  expect(epicBg).not.toBe('rgb(255, 255, 255)');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
npx playwright test tests/e2e/fpux.1-visual-consistency-theme.spec.js
```

Expected output before Task 1/2's CSS and markup land: fails (no `.sw-epic-group`/`.sw-story-row` rules exist yet). Since this task runs *after* Tasks 1–3 in this plan's own sequence, it should already pass on first run — if so, that's expected (Tasks 1–3 already implemented the target behaviour); confirm by temporarily reverting Task 1's CSS block and re-running to see it fail, then restore.

- [ ] **Step 3: Run test — must pass**

```bash
npx playwright test tests/e2e/fpux.1-visual-consistency-theme.spec.js
```

Expected output: `3 passed`

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/fpux.1-visual-consistency-theme.spec.js
git commit -m "test: add E2E visual-consistency and theme tests for AC1/AC2"
```

---

## Task 5: E2E — keyboard focus visibility and operability (AC3)

**Files:**
- Create: `tests/e2e/fpux.1-keyboard-focus.spec.js`

- [ ] **Step 1: Write the test**

```js
// tests/e2e/fpux.1-keyboard-focus.spec.js
'use strict';
const { test, expect } = require('@playwright/test');
const { renderShell } = require('../../src/web-ui/utils/html-shell.js');

test('AC3: summary shows a visible focus ring and toggles open via keyboard', async ({ page }) => {
  const body = '<details class="sw-story-row" id="story"><summary id="story-summary" tabindex="0">Story</summary><p>content</p></details>';
  const html = renderShell({ title: 'fpux.1 fixture', bodyContent: body, user: { login: 'fixture' } });
  await page.setContent(html);

  await page.locator('#story-summary').focus();
  const outline = await page.locator('#story-summary').evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');

  const openBefore = await page.locator('#story').evaluate((el) => el.hasAttribute('open'));
  expect(openBefore).toBe(false);

  await page.keyboard.press('Enter');
  const openAfter = await page.locator('#story').evaluate((el) => el.hasAttribute('open'));
  expect(openAfter).toBe(true);
});
```

- [ ] **Step 2: Run test — must fail before Task 1's focus-visible rule exists**

```bash
npx playwright test tests/e2e/fpux.1-keyboard-focus.spec.js
```

Expected: fails on the `outline` assertion if Task 1 hasn't landed; since Task 1 already ran in this plan's sequence, confirm the same way as Task 4 (temporarily comment out the `:focus-visible` rule, re-run, see it fail, restore).

- [ ] **Step 3: Run test — must pass**

```bash
npx playwright test tests/e2e/fpux.1-keyboard-focus.spec.js
```

Expected output: `1 passed`

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/fpux.1-keyboard-focus.spec.js
git commit -m "test: add E2E keyboard focus/operability test for AC3"
```

---

## Task 6: E2E — WCAG 2.1 AA contrast ratio (AC4)

**Files:**
- Create: `tests/e2e/fpux.1-contrast-ratio.spec.js`

- [ ] **Step 1: Write the test**

```js
// tests/e2e/fpux.1-contrast-ratio.spec.js
'use strict';
const { test, expect } = require('@playwright/test');
const { renderShell } = require('../../src/web-ui/utils/html-shell.js');

function relLuminance([r, g, b]) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function parseRgb(str) {
  const m = str.match(/\d+/g).map(Number);
  return [m[0], m[1], m[2]];
}
function contrastRatio(fg, bg) {
  const l1 = relLuminance(parseRgb(fg));
  const l2 = relLuminance(parseRgb(bg));
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function checkTheme(page, theme) {
  const body = '<details class="sw-epic-group" open><details class="sw-story-row" id="story" open><summary id="story-summary">Story</summary></details></details>';
  const html = renderShell({ title: 'fpux.1 fixture', bodyContent: body, user: { login: 'fixture' } });
  await page.setContent(html.replace('<html lang="en">', `<html lang="en" data-theme="${theme}">`));
  const { fg, bg } = await page.locator('#story-summary').evaluate((el) => {
    const s = getComputedStyle(el);
    let bgEl = el.closest('.sw-story-row');
    const bgColor = getComputedStyle(bgEl.parentElement).backgroundColor;
    return { fg: s.color, bg: bgColor };
  });
  return contrastRatio(fg, bg);
}

test('AC4: contrast ratio >= 4.5:1 in light theme', async ({ page }) => {
  const ratio = await checkTheme(page, 'light');
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});

test('AC4: contrast ratio >= 4.5:1 in dark theme', async ({ page }) => {
  const ratio = await checkTheme(page, 'dark');
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
```

- [ ] **Step 2: Run test — must fail against a deliberately-broken low-contrast fixture first, to prove the test can fail**

```bash
npx playwright test tests/e2e/fpux.1-contrast-ratio.spec.js
```

Since `--ink`/`--surface` are already-designed token pairs, this is expected to pass immediately — to confirm the test itself is not a false-positive, temporarily change the fixture's `#story-summary` inline style to `color: var(--surface)` (same as background) and confirm the test fails, then revert.

- [ ] **Step 3: Run test — must pass**

```bash
npx playwright test tests/e2e/fpux.1-contrast-ratio.spec.js
```

Expected output: `2 passed`

- [ ] **Step 4: Run the full E2E suite for this story together**

```bash
npx playwright test tests/e2e/fpux.1-*.spec.js
```

Expected output: `6 passed` (3 + 1 + 2 across the three spec files)

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/fpux.1-contrast-ratio.spec.js
git commit -m "test: add E2E WCAG 2.1 AA contrast-ratio test for AC4"
```
