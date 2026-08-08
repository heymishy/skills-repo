# Self-improving harness hero card — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Add a static hero card showing a real, dynamically-pulled count of `workspace/learnings.md` entries, with copy naming the human-review gate explicitly.
**Branch:** `feature/lphf-s4`
**Worktree:** `.worktrees/lphf-s4`
**Test command:** `npm test` (unit) / `NODE_ENV=test npx playwright test tests/e2e/lphf-s4-responsive.spec.js` (E2E)

---

## File map

```
Create:
  src/web-ui/content/learnings-count.js       — parses workspace/learnings.md, counts real entries (## headings)

Modify:
  src/web-ui/routes/public.js         — require learnings-count.js, splice the real count into the hero card content at module init
  src/web-ui/templates/landing.html   — add self-improving-harness hero card with a placeholder for the count

Create:
  tests/check-lphf-s4-self-improving-card.js  — unit tests for AC1, AC2, AC3
  tests/e2e/lphf-s4-responsive.spec.js        — Playwright test for AC4
```

---

## Task 1: Real learnings-count module (AC1)

**Files:**
- Create: `src/web-ui/content/learnings-count.js`
- Test: `tests/check-lphf-s4-self-improving-card.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

(function() {
  const { getLearningsCount } = require('../src/web-ui/content/learnings-count');

  // AC1
  try {
    const count = getLearningsCount();
    assert(Number.isInteger(count) && count > 0, `expected a real positive integer, got ${count}`);
    // Cross-check against an independent count of the same file, so this test
    // fails if the counting logic and the real file structure ever disagree --
    // not a hardcoded literal (per review finding 1-M1 on the story's own AC1).
    const fs = require('fs');
    const path = require('path');
    const raw = fs.readFileSync(path.join(__dirname, '..', 'workspace', 'learnings.md'), 'utf8');
    const independentCount = (raw.match(/^## /gm) || []).length;
    assert.strictEqual(count, independentCount, `getLearningsCount() (${count}) disagrees with an independent recount (${independentCount})`);
    pass('selfImprovingCard_displaysRealNonZeroLearningsCount');
  } catch (e) { fail('selfImprovingCard_displaysRealNonZeroLearningsCount', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-lphf-s4-self-improving-card.js
```

Expected output: `Error: Cannot find module '../src/web-ui/content/learnings-count'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

// learnings-count.js (lphf-s4) -- counts real entries in workspace/learnings.md
// for the self-improving-harness hero card. Computed at module init from the
// actual file, not hardcoded -- per review finding 1-M1 on the story's own
// AC1, a hardcoded number would go stale the moment a new entry is logged.

var fs = require('fs');
var path = require('path');

function getLearningsCount() {
  var filePath = path.join(__dirname, '..', '..', '..', 'workspace', 'learnings.md');
  var raw = fs.readFileSync(filePath, 'utf8');
  var matches = raw.match(/^## /gm) || [];
  return matches.length;
}

module.exports = { getLearningsCount: getLearningsCount };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-lphf-s4-self-improving-card.js
```

Expected output: `1 passed, 0 failed`

- [ ] **Step 5: Commit**

```
git add src/web-ui/content/learnings-count.js tests/check-lphf-s4-self-improving-card.js
git commit -m "lphf-s4: add real learnings-count module, no hardcoded number (AC1)"
```

---

## Task 2: Hero card markup, wired to the real count (AC1, AC2, AC3)

**Files:**
- Modify: `src/web-ui/templates/landing.html`
- Modify: `src/web-ui/routes/public.js`
- Test: `tests/check-lphf-s4-self-improving-card.js` (extend)

- [ ] **Step 1: Write the failing test**

```javascript
  // AC1 (integration) + AC2 + AC3
  try {
    delete require.cache[require.resolve('../src/web-ui/routes/public')];
    const { handleRoot } = require('../src/web-ui/routes/public');
    const { getLearningsCount } = require('../src/web-ui/content/learnings-count');
    const req = { session: {} };
    let body = null;
    const res = { setHeader: function() {}, writeHead: function() {}, end: function(data) { body = data; } };
    await handleRoot(req, res);

    const cardMatch = body.match(/<section class="hero-card" data-hero="self-improving"[\s\S]*?<\/section>/);
    assert(cardMatch, 'expected to locate the self-improving-harness hero card section');
    const cardHtml = cardMatch[0].toLowerCase();

    const realCount = getLearningsCount();
    assert(cardHtml.includes(String(realCount)), `expected the card to display the real count (${realCount})`);

    // AC2 -- doesn't imply live updating
    assert(!/\blive\b|\bright now\b|\bupdating as you read\b/.test(cardHtml), 'copy should not imply real-time live updating');

    // AC3 -- names the human-review gate
    assert(cardHtml.includes('human review') || cardHtml.includes('gated by'), 'expected the copy to explicitly name the human-review gate');

    pass('selfImprovingCard_wiredToRealCount_andCorrectCopy');
  } catch (e) { fail('selfImprovingCard_wiredToRealCount_andCorrectCopy', e); }
```

(Note: this test is async — the test file's IIFE must be `async function() {...}` with this block `await`ed, matching the pattern already established in `lphf-s1`'s test file.)

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-lphf-s4-self-improving-card.js
```

Expected output: `FAIL: selfImprovingCard_wiredToRealCount_andCorrectCopy: expected to locate the self-improving-harness hero card section`

- [ ] **Step 3: Write minimal implementation**

Insert into `landing.html`, immediately after `lphf-s3`'s `</section>` closing tag (before `<div class="auth-panel">`):

```html
    <section class="hero-card" data-hero="self-improving" aria-label="Self-improving harness">
      <h2 class="hero-card-heading">This gets better every time it's used — with a human checking every change</h2>
      <p class="hero-card-text">Every completed feature feeds real delivery findings back into the pipeline. A person reviews and approves every proposed improvement before it ships — not an unsupervised self-modifying system.</p>
      <div class="hero-card-example">
        <div class="hero-card-example-row"><span class="hero-card-example-label">Learnings captured</span><code><!--LEARNINGS_COUNT--> and counting</code></div>
      </div>
    </section>
```

In `src/web-ui/routes/public.js`, alongside the existing `_goldenTrace` require/splice:

```javascript
var _learningsCount = require('../content/learnings-count'); // lphf-s4

var _LANDING_HTML = fs.readFileSync(
  path.join(__dirname, '..', 'templates', 'landing.html'),
  'utf8'
).split('<!--GOLDEN_TRACE_SECTION-->').join(_goldenTrace.renderGoldenTraceHtml())
 .split('<!--LEARNINGS_COUNT-->').join(String(_learningsCount.getLearningsCount()));
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-lphf-s4-self-improving-card.js
```

Expected output: `2 passed, 0 failed`

- [ ] **Step 5: Commit**

```
git add src/web-ui/templates/landing.html src/web-ui/routes/public.js tests/check-lphf-s4-self-improving-card.js
git commit -m "lphf-s4: wire self-improving-harness hero card to real learnings count (AC1, AC2, AC3)"
```

---

## Task 3: Responsive layout (AC4, E2E)

**Files:**
- Create: `tests/e2e/lphf-s4-responsive.spec.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const { test, expect } = require('@playwright/test');

for (const width of [320, 1280]) {
  test(`self-improving hero card has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(width);
    const card = page.locator('[data-hero="self-improving"]');
    await expect(card).toBeVisible();
  });
}
```

- [ ] **Step 2: Run test — must pass** (reuses the already-proven `.hero-card` responsive layout)

```bash
NODE_ENV=test npx playwright test tests/e2e/lphf-s4-responsive.spec.js
```

Expected output: `2 passed`

- [ ] **Step 3: Commit**

```
git add tests/e2e/lphf-s4-responsive.spec.js
git commit -m "lphf-s4: add E2E responsive-layout test (AC4)"
```
