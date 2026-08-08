# Restyle the existing auth panel as the page's closing CTA — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Reduce the auth panel's visual weight so it reads as a closing CTA among several page sections, not the page's only content — without changing any of its mechanics.
**Branch:** `feature/lphf-s5`
**Worktree:** `.worktrees/lphf-s5`
**Test command:** `npm test` (unit) / `NODE_ENV=test npx playwright test tests/e2e/lphf-s5-responsive.spec.js` (E2E)

---

## File map

```
Modify:
  src/web-ui/templates/landing.html  — reduce .auth-panel/.auth-btn padding and font-size

Create:
  tests/check-lphf-s5-auth-panel-restyle.js  — unit tests for AC2 (routes unchanged)
  tests/e2e/lphf-s5-responsive.spec.js       — Playwright tests for AC1 (reduced visual weight) and AC3 (responsive)
```

---

## Task 1: Confirm routes/mechanics are unchanged (AC2)

**Files:**
- Test: `tests/check-lphf-s5-auth-panel-restyle.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

(async function() {
  // AC2
  try {
    delete require.cache[require.resolve('../src/web-ui/routes/public')];
    const { handleRoot } = require('../src/web-ui/routes/public');
    const req = { session: {} };
    let body = null;
    const res = { setHeader: function() {}, writeHead: function() {}, end: function(data) { body = data; } };
    await handleRoot(req, res);

    assert(body.includes('href="/auth/github"'), 'expected GitHub sign-in to link to /auth/github');
    assert(body.includes('href="/auth/google"'), 'expected Google sign-in to link to /auth/google');
    assert(body.includes('action="/auth/email/login"'), 'expected sign-in form to post to /auth/email/login');
    assert(body.includes('action="/auth/email/signup"'), 'expected sign-up form to post to /auth/email/signup');
    pass('authPanel_routesUnchanged_afterRestyle');
  } catch (e) { fail('authPanel_routesUnchanged_afterRestyle', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
```

- [ ] **Step 2: Run test — should pass immediately** (this is a pre-restyle baseline confirmation — the test itself doesn't require any implementation change, it establishes the regression guard before Task 2 touches the CSS)

```bash
node tests/check-lphf-s5-auth-panel-restyle.js
```

Expected output: `1 passed, 0 failed`

- [ ] **Step 3: Commit**

```
git add tests/check-lphf-s5-auth-panel-restyle.js
git commit -m "lphf-s5: add AC2 baseline regression guard for auth panel routes"
```

---

## Task 2: Reduce visual weight (AC1)

**Files:**
- Modify: `src/web-ui/templates/landing.html`
- Test: `tests/e2e/lphf-s5-responsive.spec.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const { test, expect } = require('@playwright/test');

test('auth panel has reduced padding relative to the pre-redesign baseline (28px)', async ({ page }) => {
  await page.goto('/');
  const panel = page.locator('.auth-panel');
  const padding = await panel.evaluate((el) => window.getComputedStyle(el).paddingTop);
  const paddingPx = parseFloat(padding);
  // Pre-redesign baseline was 1.75rem (28px at the default 16px root font size).
  expect(paddingPx).toBeLessThan(28);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
NODE_ENV=test npx playwright test tests/e2e/lphf-s5-responsive.spec.js -g "reduced padding"
```

Expected output: `1 failed` — `expect(paddingPx).toBeLessThan(28)` fails, `Received: 28`

- [ ] **Step 3: Write minimal implementation**

In `landing.html`'s `<style>` block, reduce the auth panel's padding and button sizing:

```css
    .auth-panel { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1.25rem; }
    .auth-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 0.6rem 1rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; font-family: inherit; cursor: pointer; text-decoration: none; border: 1px solid #30363d; transition: background 0.15s, border-color 0.15s; }
```

(Replace the existing `.auth-panel` and `.auth-btn` rules with these — same properties, smaller values. No other rules change.)

- [ ] **Step 4: Run test — must pass**

```bash
NODE_ENV=test npx playwright test tests/e2e/lphf-s5-responsive.spec.js -g "reduced padding"
```

Expected output: `1 passed`

- [ ] **Step 5: Commit**

```
git add src/web-ui/templates/landing.html tests/e2e/lphf-s5-responsive.spec.js
git commit -m "lphf-s5: reduce auth panel visual weight (AC1)"
```

---

## Task 3: Responsive + functional at 320px/1280px (AC3)

**Files:**
- Test: `tests/e2e/lphf-s5-responsive.spec.js` (extend)

- [ ] **Step 1: Write the failing test**

```javascript
for (const width of [320, 1280]) {
  test(`auth panel is functional and readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(width);
    const githubBtn = page.locator('.auth-btn--github');
    await expect(githubBtn).toBeVisible();
    const box = await githubBtn.boundingBox();
    expect(box.width).toBeGreaterThan(0);
  });
}
```

- [ ] **Step 2: Run test — must pass** (Task 2's changes only reduce sizing, don't affect the existing responsive `width: 100%` layout)

```bash
NODE_ENV=test npx playwright test tests/e2e/lphf-s5-responsive.spec.js -g "functional and readable"
```

Expected output: `2 passed`

- [ ] **Step 3: Commit**

```
git add tests/e2e/lphf-s5-responsive.spec.js
git commit -m "lphf-s5: add E2E responsive-functional test (AC3)"
```
