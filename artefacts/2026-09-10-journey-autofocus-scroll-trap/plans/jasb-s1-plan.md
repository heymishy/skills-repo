# /journey's unconditional autofocus on the "new feature" input auto-scrolls past the entire feature list on every page load — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Gate the `#jh-fname` input's `autofocus` attribute on the existing `showNewForm` boolean instead of emitting it unconditionally, so a plain `/journey` load no longer auto-scrolls the browser to the bottom of the (currently 269-item) feature list.
**Branch:** `feature/jasb-s1`
**Worktree:** `.worktrees/jasb-s1`
**Test command:** `npm test` (unit/integration, `scripts/run-all-tests.js`) and `npx playwright test tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js` (E2E, this story's own spec)

---

## File map

```
Create:
  tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js  — E2E tests for AC1 (auto-scroll-on-load bug, RED), AC2 and AC3 (regression guards, already-passing)

Modify:
  src/web-ui/routes/journey.js  — line 344: gate the #jh-fname input's `autofocus` attribute on the existing `showNewForm` boolean instead of emitting it unconditionally
```

**Note on TDD discipline for this story:** only AC1's test is expected to fail before implementation (it directly exercises the bug). AC2 and AC3 are regression guards for behaviour that is already correct today and must remain correct after the fix — per the test plan and DoR contract, both are expected to **pass immediately**, before and after the one-line change. This is intentional, not a sign the tests are wrong (test-plan skill's own TDD discipline note: "A test that would pass before implementation is testing the wrong thing — note it explicitly if found" — noted here explicitly; AC2/AC3 are correctly-passing regression guards, not mis-scoped RED tests).

---

## Task 1: AC1 — `/journey` loads scrolled to top when no `?new=1` is present (the primary fix)

**Files:**
- Create: `tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js` (this task writes the file's header, the shared `seedManyJourneys` helper, and the AC1 test only — AC2/AC3 tests are added to the same file by Tasks 2 and 3)
- Modify: `src/web-ui/routes/journey.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js
//
// jasb-s1: /journey's unconditional autofocus on the "new feature" input
// auto-scrolls the browser past the entire feature list on every page load.
// Root cause: journey.js's #jh-fname input carried an unconditional
// `autofocus` attribute; with 269 non-terminal features on wuce-staging
// (no pagination), the browser auto-scrolled ~26,900px to bring that
// bottom-of-page input into view on every plain /journey load.
//
// Seeds many synthetic journeys via the existing /test/seed-durable-stage
// endpoint (same pattern as tests/e2e/ep1-s4-stage-selector.spec.js) so the
// rendered page is taller than the viewport — otherwise this test can't
// distinguish "no scroll happened" from "there was nothing to scroll to".

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

async function seedStage(request, featureSlug, stageName) {
  const res = await request.post('/test/seed-durable-stage', {
    data: { featureSlug, stageName, tenantId: 'e2e-tester' }
  });
  return res.json();
}

async function seedManyJourneys(request, prefix, count) {
  for (let i = 0; i < count; i++) {
    await seedStage(request, `${prefix}-${i}-${Date.now()}`, 'discovery');
  }
}

// ── AC1: plain /journey load is not auto-scrolled ──────────────────────────

withAuth('AC1: /journey loads scrolled to top, not auto-scrolled to the bottom', async ({ page, request }) => {
  await seedManyJourneys(request, 'jasb-s1-ac1-scenario1', 40);

  await page.goto('/journey');

  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBe(0);

  const activeElementId = await page.evaluate(() => document.activeElement && document.activeElement.id);
  expect(activeElementId).not.toBe('jh-fname');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
npx playwright test tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js -g "AC1"
```

Expected output: `1 failed` — `expect(scrollY).toBe(0)` fails because `window.scrollY` is a large positive number (the page has auto-scrolled to bring the unconditionally-autofocused `#jh-fname` input into view).

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/web-ui/routes/journey.js — line 344, inside handleGetJourney's
// template literal array (the "Start a new feature" section). Change:
//
//   '<input id="jh-fname" class="jh-input" name="featureName" type="text" placeholder="e.g. Impact matrix tool" required autofocus>',
//
// to:
//
'<input id="jh-fname" class="jh-input" name="featureName" type="text" placeholder="e.g. Impact matrix tool" required' + (showNewForm ? ' autofocus' : '') + '>',
```

Apply this as a direct edit to the existing line 344 of `src/web-ui/routes/journey.js` — do not restructure the surrounding array, do not touch line 338's own `showNewForm` conditional (which already exists and is reused here unchanged).

- [ ] **Step 4: Run test — must pass**

```bash
npx playwright test tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js -g "AC1"
```

Expected output: `1 passed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: `632 file(s) run, 1 failed` — only the pre-existing, already-acknowledged `tests/check-p3.5-validate-trace.js` baseline failure (see `artefacts/2026-09-10-journey-autofocus-scroll-trap/decisions.md`), no new failures.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js src/web-ui/routes/journey.js
git commit -m "fix: gate journey new-feature input autofocus on showNewForm

Stops /journey from auto-scrolling to the bottom of the feature list
on every plain page load. The #jh-fname input carried an unconditional
autofocus attribute; with 269 non-terminal features and no pagination,
the browser scrolled ~26,900px to bring it into view before the
operator ever saw the feature list. autofocus now only applies when
showNewForm is true (?new=1), matching the panel's own existing
highlight-styling condition."
```

---

## Task 2: AC2 — `/journey?new=1` still autofocuses and scrolls the "Feature name" input into view

**Files:**
- Modify: `tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js` (append this test; no other file changes — Task 1's fix already fully satisfies this AC)

- [ ] **Step 1: Write the test**

```javascript
// Append to tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js, after the AC1 test.

// ── AC2: explicit "+ New feature" entry point is unchanged ─────────────────

withAuth('AC2: /journey?new=1 still autofocuses and scrolls #jh-fname into view', async ({ page, request }) => {
  await seedStage(request, `jasb-s1-ac2-scenario2-${Date.now()}`, 'discovery');

  await page.goto('/journey?new=1');

  const input = page.locator('#jh-fname');
  await expect(input).toBeFocused();
  await expect(input).toBeInViewport();
});
```

- [ ] **Step 2: Run test — expected to PASS already**

```bash
npx playwright test tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js -g "AC2"
```

Expected output: `1 passed` — this is a regression guard, not a RED test. Task 1's fix (`autofocus` gated on `showNewForm`) already makes `?new=1` behave exactly as it did before this story; this test proves that explicitly rather than leaving it unverified.

- [ ] **Step 3: No implementation step** — Task 1's fix already covers this AC completely.

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: `632 file(s) run, 1 failed` — same single pre-existing baseline failure as Task 1, no new failures.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js
git commit -m "test: add regression guard for journey ?new=1 autofocus behaviour"
```

---

## Task 3: AC3 — "Start a new feature" form still submits correctly

**Files:**
- Modify: `tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js` (append this test; no other file changes — this story does not touch form submission behaviour at all)

- [ ] **Step 1: Write the test**

```javascript
// Append to tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js, after the AC2 test.

// ── AC3 (regression guard): form submission is unaffected ──────────────────

withAuth('AC3: the "Start a new feature" form still submits and starts a new journey', async ({ page }) => {
  await page.goto('/journey');

  await page.fill('#jh-fname', `jasb-s1-ac3-${Date.now()}`);
  // "Formed idea — jump straight to discovery" is already checked by default.
  await page.click('button.jh-submit');

  await expect(page).toHaveURL(/\/skills\/discovery\/sessions\/[^/]+\/chat/);
});
```

- [ ] **Step 2: Run test — expected to PASS already**

```bash
npx playwright test tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js -g "AC3"
```

Expected output: `1 passed` — this is a regression guard. This story changes only the `autofocus` attribute's condition; the form's fields, validation, and `POST /api/journey` submit handler are untouched, so this test is expected to pass without any implementation change.

- [ ] **Step 3: No implementation step** — nothing in this story's scope touches form submission.

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: `632 file(s) run, 1 failed` — same single pre-existing baseline failure, no new failures.

- [ ] **Step 5: Run the full new E2E spec together — all 3 ACs pass**

```bash
npx playwright test tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js
```

Expected output: `3 passed`

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js
git commit -m "test: add regression guard for journey new-feature form submission"
```

---

<!-- All 3 ACs covered across 3 tasks. No further tasks — this story's entire
     implementation surface is the single conditional-attribute change made
     in Task 1; Tasks 2 and 3 add regression-guard test coverage only. -->
