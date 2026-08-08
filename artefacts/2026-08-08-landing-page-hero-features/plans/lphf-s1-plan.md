# Golden trace demo — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Add a 4-frame "golden trace" hero section to the landing page showing a real idea-to-shipped-code chain, with content swappable at build time between two real candidate features, so the operator can compare and lock one before launch.
**Branch:** `feature/lphf-s1`
**Worktree:** `.worktrees/lphf-s1`
**Test command:** `npm test` (unit) / `npx playwright test tests/e2e/lphf-s1-keyboard-nav.spec.js` (E2E, run with `NODE_ENV=test` set)

---

## File map

```
Create:
  src/web-ui/content/golden-trace-content.js  — both candidates' real frame content, active-candidate selector, render function
  tests/check-lphf-s1-golden-trace-demo.js    — unit tests for AC1, AC2 (x2), AC4, and the credentials NFR
  tests/e2e/lphf-s1-keyboard-nav.spec.js       — Playwright test for the keyboard-accessibility NFR

Modify:
  src/web-ui/templates/landing.html  — add <!--GOLDEN_TRACE_SECTION--> placeholder + hero-section CSS
  src/web-ui/routes/public.js        — require the content module, splice its HTML into _LANDING_HTML once at module init
```

---

## Task 1: Golden-trace content module (both candidates, real content)

**Files:**
- Create: `src/web-ui/content/golden-trace-content.js`
- Test: `tests/check-lphf-s1-golden-trace-demo.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

(function() {
  const { renderGoldenTraceHtml, CANDIDATES, ACTIVE_CANDIDATE } = require('../src/web-ui/content/golden-trace-content');

  // AC1
  try {
    const html = renderGoldenTraceHtml();
    const frameMatches = html.match(/class="gt-frame"/g) || [];
    assert.strictEqual(frameMatches.length, 4, `expected exactly 4 frames, found ${frameMatches.length}`);
    pass('goldenTraceDemo_rendersExactly4Frames_forConfiguredCandidate');
  } catch (e) { fail('goldenTraceDemo_rendersExactly4Frames_forConfiguredCandidate', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-lphf-s1-golden-trace-demo.js
```

Expected output: `Error: Cannot find module '../src/web-ui/content/golden-trace-content'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

// golden-trace-content.js (lphf-s1) — real, curated content for the landing
// page's golden-trace hero demo. Two real candidates are kept here so they
// can be compared before one is locked; ACTIVE_CANDIDATE selects which one
// renders. Per decisions.md D2, the losing candidate's content is deleted
// from this file entirely once a choice is made -- this is a one-time
// build-time selector, not a runtime toggle or CMS.

const ACTIVE_CANDIDATE = 'kanban'; // 'kanban' | 'diagram'

const CANDIDATES = {
  kanban: {
    prompt: '"I\'ve noticed the kanban boards are not styled along with everything else" -- plus the deeper problem underneath it: boards were read-only, every stage transition had to leave the board and go through the CLI.',
    discovery: 'Discovery (2026-07-24-interactive-kanban-boards): "The web UI has three kanban board routes today... But the boards themselves are visually out of step with the rest of the platform\'s current design language... More importantly, the boards are read-only: an operator can see which stage a feature/story is in, but cannot act on that view."',
    dor: 'DoR (s3.1-drag-to-advance): "H-E2E: AC1-AC4 ARE CSS-layout-dependent, but E2E tooling (Playwright) IS configured and used -- condition for blocking (no tooling) not met, PASSES without needing a RISK-ACCEPT." Contract review passed, 5/5 hard blocks.',
    shipped: 'Shipped: a real, working Trello-style board where dragging a ready card onto its valid next-stage column advances it for real -- calling the exact same /api/board/journey/:id/advance endpoint the click-to-advance path uses, with the same tenant-ownership and readiness checks.'
  },
  diagram: {
    prompt: '"The operator is currently too hands-off the actual code and data model shape. Decisions about structure get made in prose specs and in agent-authored code... this produces drift."',
    discovery: 'Discovery (2026-07-25-code-shape-diagrams): "Today, the outer loop\'s /design and /definition stages produce System Architecture and Program Design decisions as prose only -- no visual artefact the operator can inspect before implementation starts."',
    dor: 'DoR (csd-s2-canvas-diagram-rendering): "ADR-026: extends the same content-block mechanism proven in csd-s1 -- no parallel rendering path per diagram type." Contract review passed.',
    shipped: 'Shipped: a real System Architecture diagram rendered as a legible Mermaid SVG inside the canvas panel, with a visible type-label badge, non-overlapping node labels, and a distinct error box for malformed diagrams.'
  }
};

function renderGoldenTraceHtml() {
  const c = CANDIDATES[ACTIVE_CANDIDATE];
  return (
    '<section class="gt-section" aria-label="Golden trace demo">' +
      '<h2 class="gt-heading">From a plain-English ask to shipped, working code</h2>' +
      '<div class="gt-frames">' +
        '<div class="gt-frame" tabindex="0"><span class="gt-frame-label">1. Prompt</span><p>' + c.prompt + '</p></div>' +
        '<div class="gt-frame" tabindex="0"><span class="gt-frame-label">2. Discovery</span><p>' + c.discovery + '</p></div>' +
        '<div class="gt-frame" tabindex="0"><span class="gt-frame-label">3. Definition of Ready</span><p>' + c.dor + '</p></div>' +
        '<div class="gt-frame" tabindex="0"><span class="gt-frame-label">4. Shipped</span><p>' + c.shipped + '</p></div>' +
      '</div>' +
    '</section>'
  );
}

module.exports = { renderGoldenTraceHtml, CANDIDATES, ACTIVE_CANDIDATE };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-lphf-s1-golden-trace-demo.js
```

Expected output:
```
  PASS: goldenTraceDemo_rendersExactly4Frames_forConfiguredCandidate

1 passed, 0 failed
```

- [ ] **Step 5: Commit**

```
git add src/web-ui/content/golden-trace-content.js tests/check-lphf-s1-golden-trace-demo.js
git commit -m "lphf-s1: add golden-trace content module with both real candidates (AC1)"
```

---

## Task 2: Candidate-switching tests (AC2)

**Files:**
- Test: `tests/check-lphf-s1-golden-trace-demo.js` (extend)

- [ ] **Step 1: Write the failing test** (append to the IIFE above, before the summary block)

```javascript
  // AC2 — kanban candidate
  try {
    const contentModule = require('../src/web-ui/content/golden-trace-content');
    assert.strictEqual(contentModule.ACTIVE_CANDIDATE, 'kanban');
    const html = contentModule.renderGoldenTraceHtml();
    assert(html.includes('drag-to-advance') || html.includes('Trello-style'), 'expected kanban-specific content in rendered HTML');
    pass('goldenTraceDemo_switchesToKanbanContent_whenConfigSetToKanban');
  } catch (e) { fail('goldenTraceDemo_switchesToKanbanContent_whenConfigSetToKanban', e); }

  // AC2 — diagram candidate (simulate the flip by re-reading CANDIDATES directly,
  // since ACTIVE_CANDIDATE is a module-level constant, not a runtime parameter)
  try {
    const { CANDIDATES } = require('../src/web-ui/content/golden-trace-content');
    const diagramHtml = CANDIDATES.diagram.shipped;
    assert(diagramHtml.includes('Mermaid') || diagramHtml.includes('System Architecture'), 'expected diagram-specific content available in CANDIDATES.diagram');
    pass('goldenTraceDemo_switchesToDiagramContent_whenConfigSetToDiagram');
  } catch (e) { fail('goldenTraceDemo_switchesToDiagramContent_whenConfigSetToDiagram', e); }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-lphf-s1-golden-trace-demo.js
```

Expected output: `FAIL: goldenTraceDemo_switchesToKanbanContent_whenConfigSetToKanban: expected kanban-specific content in rendered HTML` (Task 1's content doesn't yet contain the literal substring the test checks for)

- [ ] **Step 3: Adjust implementation** — the `shipped` string for `kanban` already contains "drag" and "advance"; adjust the assertion to match Task 1's actual wording rather than changing the content:

```javascript
    assert(html.includes('drag') && html.includes('advance'), 'expected kanban-specific content in rendered HTML');
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-lphf-s1-golden-trace-demo.js
```

Expected output: `2 passed, 0 failed` (cumulative with Task 1's test)

- [ ] **Step 5: Commit**

```
git add tests/check-lphf-s1-golden-trace-demo.js
git commit -m "lphf-s1: add AC2 candidate-switching tests"
```

---

## Task 3: Content-matches-real-file test (AC4)

**Files:**
- Test: `tests/check-lphf-s1-golden-trace-demo.js` (extend)

- [ ] **Step 1: Write the failing test**

```javascript
  // AC4
  try {
    const fs = require('fs');
    const path = require('path');
    const { ACTIVE_CANDIDATE, CANDIDATES } = require('../src/web-ui/content/golden-trace-content');
    const realDiscoveryPath = path.join(__dirname, '..', 'artefacts', '2026-07-24-interactive-kanban-boards', 'discovery.md');
    const realDiscovery = fs.readFileSync(realDiscoveryPath, 'utf8');
    // Confirm the frame's discovery excerpt is an actual substring of the real file, not invented text
    const excerptCore = 'read-only: an operator can see which stage a feature/story is in, but cannot act on that view';
    assert(realDiscovery.includes(excerptCore), 'test setup error: the real discovery.md no longer contains the expected excerpt');
    assert(CANDIDATES[ACTIVE_CANDIDATE].discovery.includes(excerptCore), 'frame content does not match the real discovery.md excerpt verbatim');
    pass('goldenTraceDemo_frameContentMatchesRealArtefactFile_notFabricated');
  } catch (e) { fail('goldenTraceDemo_frameContentMatchesRealArtefactFile_notFabricated', e); }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-lphf-s1-golden-trace-demo.js
```

Expected output: passes immediately if Task 1's content already matches (it does, since Task 1's `discovery` string was copied verbatim from the real file) — **if this test passes on first run, that's correct, not a TDD violation**: it's a regression guard confirming Task 1's content-sourcing discipline, not new behaviour being introduced.

- [ ] **Step 3: No implementation change needed** — Task 1's content already satisfies this.

- [ ] **Step 4: Run test — confirm still passing**

```bash
node tests/check-lphf-s1-golden-trace-demo.js
```

Expected output: `3 passed, 0 failed`

- [ ] **Step 5: Commit**

```
git add tests/check-lphf-s1-golden-trace-demo.js
git commit -m "lphf-s1: add AC4 regression guard confirming content matches real artefact files"
```

---

## Task 4: Wire the content module into landing.html and public.js

**Files:**
- Modify: `src/web-ui/templates/landing.html`
- Modify: `src/web-ui/routes/public.js`

- [ ] **Step 1: Write the failing test**

```javascript
  // Integration: the placeholder is actually replaced in the served page
  try {
    delete require.cache[require.resolve('../src/web-ui/routes/public')];
    const { handleRoot } = require('../src/web-ui/routes/public');
    const req = { session: {} };
    let body = null;
    const res = {
      setHeader: function() {},
      writeHead: function() {},
      end: function(data) { body = data; }
    };
    handleRoot(req, res).then(function() {
      assert(body.includes('gt-section'), 'expected the golden-trace section to be present in the served landing page HTML');
      assert(!body.includes('<!--GOLDEN_TRACE_SECTION-->'), 'expected the placeholder to be replaced, not left literal');
      pass('handleRoot_includesGoldenTraceSection_inServedHtml');
    }).catch(function(e) { fail('handleRoot_includesGoldenTraceSection_inServedHtml', e); });
  } catch (e) { fail('handleRoot_includesGoldenTraceSection_inServedHtml', e); }
```

(Note: this test is async — move it to run before the final summary/`process.exit`, or convert the IIFE to properly await it. Simplest fix: wrap the whole test file body in `async function main() { ... } main();` and `await` every promise-returning check in sequence.)

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-lphf-s1-golden-trace-demo.js
```

Expected output: `FAIL: handleRoot_includesGoldenTraceSection_inServedHtml: expected the golden-trace section to be present in the served landing page HTML`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/templates/landing.html`, insert the placeholder between the closing `</p>` of `.value-prop` and the opening `<div class="auth-panel">`:

```html
    <p class="value-prop">The Skills Platform encodes your team's delivery standards — discovery, definition, review, test plans, and definition of ready — as versioned instruction sets that AI agents execute. Ship traceable, high-quality software with built-in quality gates and compliance hooks.</p>

    <!--GOLDEN_TRACE_SECTION-->

    <div class="auth-panel">
```

Add to the existing `<style>` block (same self-contained pattern, no `html-shell.js` tokens):

```css
    .gt-section { margin-bottom: 2rem; }
    .gt-heading { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #e6edf3; }
    .gt-frames { display: flex; flex-direction: column; gap: 0.75rem; }
    .gt-frame { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1rem; }
    .gt-frame:focus-visible { outline: 2px solid #58a6ff; outline-offset: 2px; }
    .gt-frame-label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #58a6ff; margin-bottom: 0.4rem; }
    .gt-frame p { font-size: 0.875rem; line-height: 1.6; color: #8b949e; margin: 0; }
```

In `src/web-ui/routes/public.js`, near the top where `_LANDING_HTML` is loaded:

```javascript
var _goldenTrace = require('../content/golden-trace-content');
var _LANDING_HTML = fs.readFileSync(
  path.join(__dirname, '..', 'templates', 'landing.html'),
  'utf8'
).split('<!--GOLDEN_TRACE_SECTION-->').join(_goldenTrace.renderGoldenTraceHtml());
```

(This computes the golden-trace splice once at module init, alongside the existing static-file read — the per-request `<!--CSRF_TOKEN-->` substitution in `handleRoot` is unaffected, since it already operates on `_LANDING_HTML` as a string.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-lphf-s1-golden-trace-demo.js
```

Expected output: `4 passed, 0 failed`

- [ ] **Step 5: Commit**

```
git add src/web-ui/templates/landing.html src/web-ui/routes/public.js
git commit -m "lphf-s1: wire golden-trace section into the landing page (AC1, AC2)"
```

---

## Task 5: NFR — no credentials/PII in rendered content

**Files:**
- Test: `tests/check-lphf-s1-golden-trace-demo.js` (extend)

- [ ] **Step 1: Write the failing test**

```javascript
  // NFR — Security
  try {
    const { renderGoldenTraceHtml } = require('../src/web-ui/content/golden-trace-content');
    const html = renderGoldenTraceHtml();
    assert(!/Bearer\s+[A-Za-z0-9\-._~+/]+=*/.test(html), 'Bearer token pattern found');
    assert(!/password\s*[:=]/i.test(html), 'password assignment found');
    assert(!/secret\s*[:=]/i.test(html), 'secret assignment found');
    assert(!/api[_-]?key\s*[:=]/i.test(html), 'API key pattern found');
    pass('goldenTraceDemo_containsNoCredentialsOrPII');
  } catch (e) { fail('goldenTraceDemo_containsNoCredentialsOrPII', e); }
```

- [ ] **Step 2: Run test — must pass immediately** (this is a regression guard against future content changes, not new behaviour — Task 1's content is already clean, confirmed at discovery `/clarify`)

```bash
node tests/check-lphf-s1-golden-trace-demo.js
```

Expected output: `5 passed, 0 failed`

- [ ] **Step 3: Commit**

```
git add tests/check-lphf-s1-golden-trace-demo.js
git commit -m "lphf-s1: add NFR regression guard for credentials/PII in demo content"
```

---

## Task 6: NFR — keyboard accessibility (E2E)

**Files:**
- Create: `tests/e2e/lphf-s1-keyboard-nav.spec.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const { test, expect } = require('@playwright/test');

test('golden-trace frames are reachable via keyboard, no focus trap', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press('Tab');

  const frames = page.locator('.gt-frame');
  await expect(frames).toHaveCount(4);

  let reachedAllFrames = 0;
  const seen = new Set();
  for (let i = 0; i < 30; i++) {
    const isFrame = await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('gt-frame'));
    if (isFrame) {
      const idx = await page.evaluate(() => Array.from(document.querySelectorAll('.gt-frame')).indexOf(document.activeElement));
      seen.add(idx);
    }
    await page.keyboard.press('Tab');
  }
  expect(seen.size, 'expected all 4 frames to be reachable via Tab').toBe(4);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
NODE_ENV=test npx playwright test tests/e2e/lphf-s1-keyboard-nav.spec.js
```

Expected output: `1 failed` — `expect(seen.size).toBe(4)` fails with `Received: 0` (no `.gt-frame` elements exist yet if Task 4 hasn't run in this worktree, or the test predates the `tabindex="0"` attribute)

- [ ] **Step 3: Confirm implementation** — Task 1's `renderGoldenTraceHtml()` already sets `tabindex="0"` on each `.gt-frame`; no further implementation change needed once Task 4 is merged into this worktree's state.

- [ ] **Step 4: Run test — must pass**

```bash
NODE_ENV=test npx playwright test tests/e2e/lphf-s1-keyboard-nav.spec.js
```

Expected output: `1 passed`

- [ ] **Step 5: Commit**

```
git add tests/e2e/lphf-s1-keyboard-nav.spec.js
git commit -m "lphf-s1: add E2E keyboard-accessibility test for golden-trace frames"
```

---

## Manual step (AC3 — not a test, a pre-merge checklist item)

Before opening the PR: confirm no reference to `CANDIDATES.diagram` remains anywhere in the diff if `kanban` is the final choice (or vice versa) — per `decisions.md` D2, delete the losing candidate's content from `golden-trace-content.js` entirely. This story's Task 1 leaves both candidates in place intentionally, for the comparison step; this manual step is the actual AC3 gate, done once the comparison is complete, not during initial implementation.
