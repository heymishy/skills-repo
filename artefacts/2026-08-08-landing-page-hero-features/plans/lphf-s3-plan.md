# Cryptographic instruction-set verification hero card — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Add a static hero card explaining that every governed action commits an independently recomputable hash of the exact instruction set that governed it — provable, not just claimed.
**Branch:** `feature/lphf-s3`
**Worktree:** `.worktrees/lphf-s3`
**Test command:** `npm test` (unit) / `NODE_ENV=test npx playwright test tests/e2e/lphf-s3-responsive.spec.js` (E2E)

---

## File map

```
Modify:
  src/web-ui/templates/landing.html  — add cryptographic-verification hero card (reuses .hero-card/.hero-card-example CSS from lphf-s2)

Create:
  tests/check-lphf-s3-crypto-verification-card.js  — unit tests for AC1, AC2
  tests/e2e/lphf-s3-responsive.spec.js             — Playwright test for AC3
```

---

## Task 1: Hero card markup + copy (AC1, AC2)

**Files:**
- Modify: `src/web-ui/templates/landing.html`
- Test: `tests/check-lphf-s3-crypto-verification-card.js`

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
    assert(html.includes('data-hero="crypto-verification"'), 'expected a hero-card element for cryptographic verification');
    assert(/hero-card-example/.test(html.split('data-hero="crypto-verification"')[1] || ''), 'expected a concrete hash example inside this hero card');
    pass('cryptoVerificationCard_rendersHeadlineSentenceAndHashExample');
  } catch (e) { fail('cryptoVerificationCard_rendersHeadlineSentenceAndHashExample', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-lphf-s3-crypto-verification-card.js
```

Expected output: `FAIL: cryptoVerificationCard_rendersHeadlineSentenceAndHashExample: expected a hero-card element for cryptographic verification`

- [ ] **Step 3: Write minimal implementation**

Insert into `landing.html`, immediately after `lphf-s2`'s `</section>` closing tag (before `<div class="auth-panel">`):

```html
    <section class="hero-card" data-hero="crypto-verification" aria-label="Cryptographic instruction-set verification">
      <h2 class="hero-card-heading">Prove which standard governed this — don't just claim it</h2>
      <p class="hero-card-text">Every governed action commits a recomputable hash of the exact instruction set that governed it. Independently verifiable, not "trust us."</p>
      <div class="hero-card-example">
        <div class="hero-card-example-row"><span class="hero-card-example-label">Instruction set</span><code>skills/review/SKILL.md</code></div>
        <div class="hero-card-example-row"><span class="hero-card-example-label">Recomputed hash</span><code>sha256:e3b0c4... ✓ matches trace</code></div>
      </div>
    </section>
```

Add to the `<style>` block — reuses the existing `.hero-card`/`.hero-card-example` classes from `lphf-s2` (no new CSS needed).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-lphf-s3-crypto-verification-card.js
```

Expected output: `1 passed, 0 failed`

- [ ] **Step 5: Commit**

```
git add src/web-ui/templates/landing.html tests/check-lphf-s3-crypto-verification-card.js
git commit -m "lphf-s3: add cryptographic-verification hero card (AC1)"
```

---

## Task 2: Copy asserts provability, not an unfalsifiable claim (AC2)

**Files:**
- Test: `tests/check-lphf-s3-crypto-verification-card.js` (extend)

- [ ] **Step 1: Write the failing test**

```javascript
  // AC2
  try {
    const cardMatch = html.match(/<section class="hero-card" data-hero="crypto-verification"[\s\S]*?<\/section>/);
    assert(cardMatch, 'expected to locate the crypto-verification hero card section');
    const cardHtml = cardMatch[0].toLowerCase();
    assert(cardHtml.includes('recomputable') || cardHtml.includes('independently verifiable'), 'expected the copy to assert provability concretely');
    assert(!cardHtml.includes('trust us'), 'copy should not use an unfalsifiable "trust us" claim');
    pass('cryptoVerificationCard_assertsRecomputable_notUnfalsifiableClaim');
  } catch (e) { fail('cryptoVerificationCard_assertsRecomputable_notUnfalsifiableClaim', e); }
```

- [ ] **Step 2: Run test — confirm passes immediately** (Task 1's copy already contains "recomputable"/"independently verifiable" and explicitly contrasts with "trust us" as the thing it's NOT saying — regression guard, not new behaviour)

```bash
node tests/check-lphf-s3-crypto-verification-card.js
```

Expected output: `2 passed, 0 failed`

- [ ] **Step 3: Commit**

```
git add tests/check-lphf-s3-crypto-verification-card.js
git commit -m "lphf-s3: add AC2 regression guard for provability copy"
```

---

## Task 3: Responsive layout (AC3, E2E)

**Files:**
- Create: `tests/e2e/lphf-s3-responsive.spec.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const { test, expect } = require('@playwright/test');

for (const width of [320, 1280]) {
  test(`crypto-verification hero card has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(width);
    const card = page.locator('[data-hero="crypto-verification"]');
    await expect(card).toBeVisible();
  });
}
```

- [ ] **Step 2: Run test — must pass** (reuses `lphf-s2`'s already-proven-responsive `.hero-card-example` layout — if it fails, check for a fixed-width rule accidentally added to Task 1's markup)

```bash
NODE_ENV=test npx playwright test tests/e2e/lphf-s3-responsive.spec.js
```

Expected output: `2 passed`

- [ ] **Step 3: Commit**

```
git add tests/e2e/lphf-s3-responsive.spec.js
git commit -m "lphf-s3: add E2E responsive-layout test (AC3)"
```
