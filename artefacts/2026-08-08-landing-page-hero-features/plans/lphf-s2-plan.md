# Scope-contract enforcement hero card — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Add a static hero card to the landing page explaining, concretely, how this platform's DoR scope contract and assurance gate stop a coding agent from silently expanding its own mandate mid-story.
**Branch:** `feature/lphf-s2`
**Worktree:** `.worktrees/lphf-s2`
**Test command:** `npm test` (unit) / `NODE_ENV=test npx playwright test tests/e2e/lphf-s2-responsive.spec.js` (E2E)

---

## File map

```
Modify:
  src/web-ui/templates/landing.html  — add scope-contract hero card markup + CSS

Create:
  tests/check-lphf-s2-scope-contract-card.js   — unit tests for AC1, AC2
  tests/e2e/lphf-s2-responsive.spec.js         — Playwright test for AC3
```

---

## Task 1: Hero card markup + copy (AC1, AC2)

**Files:**
- Modify: `src/web-ui/templates/landing.html`
- Test: `tests/check-lphf-s2-scope-contract-card.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

(function() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'web-ui', 'templates', 'landing.html'), 'utf8');

  // AC1
  try {
    assert(html.includes('class="hero-card"') && html.includes('scope-contract'), 'expected a hero-card element for scope-contract enforcement');
    assert(/hero-card-example/.test(html), 'expected a concrete example element inside the hero card');
    pass('scopeContractCard_rendersHeadlineSentenceAndExample');
  } catch (e) { fail('scopeContractCard_rendersHeadlineSentenceAndExample', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-lphf-s2-scope-contract-card.js
```

Expected output: `FAIL: scopeContractCard_rendersHeadlineSentenceAndExample: expected a hero-card element for scope-contract enforcement`

- [ ] **Step 3: Write minimal implementation**

Insert into `landing.html`, immediately after the `<!--GOLDEN_TRACE_SECTION-->` placeholder line:

```html
    <section class="hero-card" data-hero="scope-contract" aria-label="Scope-contract enforcement">
      <h2 class="hero-card-heading">Your agent can't quietly do more than you asked</h2>
      <p class="hero-card-text">Before any code is written, the DoR (Definition of Ready) artefact locks the exact files a story is allowed to touch. The assurance gate checks the merged diff against that list before anything ships — not a suggestion, a hard block.</p>
      <div class="hero-card-example">
        <div class="hero-card-example-row"><span class="hero-card-example-label">Locked scope</span><code>src/web-ui/routes/public.js, src/web-ui/templates/landing.html</code></div>
        <div class="hero-card-example-row"><span class="hero-card-example-label">Merged diff</span><code>2 files changed — both match ✓</code></div>
      </div>
    </section>
```

Add to the `<style>` block (extends the existing self-contained pattern):

```css
    .hero-card { margin-bottom: 1.25rem; }
    .hero-card-heading { font-size: 1.05rem; font-weight: 600; margin-bottom: 0.5rem; color: #e6edf3; }
    .hero-card-text { font-size: 0.875rem; line-height: 1.6; color: #8b949e; margin-bottom: 0.75rem; }
    .hero-card-example { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 0.75rem 1rem; }
    .hero-card-example-row { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.8125rem; padding: 0.25rem 0; }
    .hero-card-example-row + .hero-card-example-row { border-top: 1px solid #30363d; }
    .hero-card-example-label { color: #58a6ff; font-weight: 600; flex-shrink: 0; }
    .hero-card-example code { color: #8b949e; font-family: ui-monospace, monospace; font-size: 0.75rem; text-align: right; }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-lphf-s2-scope-contract-card.js
```

Expected output: `1 passed, 0 failed`

- [ ] **Step 5: Commit**

```
git add src/web-ui/templates/landing.html tests/check-lphf-s2-scope-contract-card.js
git commit -m "lphf-s2: add scope-contract enforcement hero card (AC1)"
```

---

## Task 2: Copy names the real mechanism, not generic marketing (AC2)

**Files:**
- Test: `tests/check-lphf-s2-scope-contract-card.js` (extend)

- [ ] **Step 1: Write the failing test**

```javascript
  // AC2
  try {
    const cardMatch = html.match(/<section class="hero-card" data-hero="scope-contract"[\s\S]*?<\/section>/);
    assert(cardMatch, 'expected to locate the scope-contract hero card section');
    const cardHtml = cardMatch[0].toLowerCase();
    assert(cardHtml.includes('dor') || cardHtml.includes('definition of ready'), 'expected the copy to name the real mechanism (DoR)');
    assert(cardHtml.includes('assurance gate'), 'expected the copy to name the assurance gate');
    assert(!/\bsafe ai\b/.test(cardHtml), 'copy should not use generic "safe AI" marketing language');
    pass('scopeContractCard_copyNamesRealMechanism_notGenericClaim');
  } catch (e) { fail('scopeContractCard_copyNamesRealMechanism_notGenericClaim', e); }
```

- [ ] **Step 2: Run test — confirm passes immediately** (Task 1's copy already names "DoR" and "assurance gate" — this is a regression guard, not new behaviour)

```bash
node tests/check-lphf-s2-scope-contract-card.js
```

Expected output: `2 passed, 0 failed`

- [ ] **Step 3: Commit**

```
git add tests/check-lphf-s2-scope-contract-card.js
git commit -m "lphf-s2: add AC2 regression guard for concrete-mechanism copy"
```

---

## Task 3: Responsive layout (AC3, E2E)

**Files:**
- Create: `tests/e2e/lphf-s2-responsive.spec.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const { test, expect } = require('@playwright/test');

for (const width of [320, 1280]) {
  test(`scope-contract hero card has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(width);
    const card = page.locator('[data-hero="scope-contract"]');
    await expect(card).toBeVisible();
  });
}
```

- [ ] **Step 2: Run test — must pass** (Task 1's CSS already uses flexible layout with no fixed widths; if it fails, the fix is to remove any fixed-width rule from `.hero-card-example-row`)

```bash
NODE_ENV=test npx playwright test tests/e2e/lphf-s2-responsive.spec.js
```

Expected output: `2 passed`

- [ ] **Step 3: Commit**

```
git add tests/e2e/lphf-s2-responsive.spec.js
git commit -m "lphf-s2: add E2E responsive-layout test (AC3)"
```
