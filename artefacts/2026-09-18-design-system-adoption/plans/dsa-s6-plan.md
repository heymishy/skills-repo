# Fix Mobile-Responsiveness Gaps on the Already-Shipped Artefact Viewer and Dashboard — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in `artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s6-test-plan.md` pass. Add `@media (max-width: 768px)` CSS overrides to two already-shipped files: `src/web-ui/views/dashboard-view.js` (dashboard's `.sw-skill-grid`/`.sw-cols`) and `src/web-ui/routes/artefact.js` (artefact viewer's `.sw-artefact-layout`). Pure CSS fix — no functional/data changes to either screen.
**Branch:** `feature/dsa-s6`
**Worktree:** `.worktrees/dsa-s6`
**Test command:** `npm test` (unit/integration, via `node scripts/run-all-tests.js`); `npx playwright test tests/e2e/<file>` (Playwright, per-file)

---

## Pre-verified findings (from investigation before this plan was written — do not re-derive, verify against current code once per task instead)

**Dashboard's real target** (`src/web-ui/views/dashboard-view.js`, confirmed current in this worktree): `.sw-skill-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }` (line 70) and `.sw-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 40px; }` (line 84). Zero `@media` rules exist anywhere in this file.

**Artefact viewer's real target** (`src/web-ui/routes/artefact.js`, confirmed current in this worktree, inside the function building `.sw-artefact-layout`'s markup): `.sw-artefact-layout` is an INLINE style (not a `<style>` block rule) — `style="display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px"` (line ~101). Its two children, in real DOM order, are `.sw-doc` (the actual document content, `style="font-family:var(--serif)"`) FIRST, then `.sw-artefact-sidebar` (`style="display:flex;flex-direction:column;gap:16px"`, containing the Sign-off and Comments cards) SECOND. Zero `@media` rules exist anywhere in this file.

**Important simplification, confirmed by direct grep (`order:` not found anywhere in `artefact.js` or `html-shell.js`):** the DOM order is ALREADY document-first (`.sw-doc` before `.sw-artefact-sidebar`), and no CSS `order:` property anywhere overrides visual stacking order. This means AC4's "document body first" requirement is satisfied automatically by a plain single-column collapse — collapsing `.sw-artefact-layout`'s grid to one column at ≤768px will naturally stack `.sw-doc` above `.sw-artefact-sidebar`, matching DOM order, with ZERO additional reordering CSS/markup needed. Do not build any explicit `order:` property or markup reshuffling for this — it's unnecessary complexity the test-plan's own language slightly overstated ("not just a naive grid-to-block collapse") before this direct verification. A plain collapse IS sufficient and correct here.

**`.sw-artefact-layout` is a CSS-Grid inline style, not a class rule** — the `@media` override for it must target `.sw-artefact-layout` by class selector in a NEW `<style>` block this function's own markup doesn't currently have (or an existing shared `<style>` block if this route already injects one — verify at implementation time; if none exists, add one small `<style>` block to this function's own output, following this codebase's own established pattern of per-route inline `<style>` blocks, e.g. `dashboard-view.js`'s own `<style>` block at the top of its output). An inline `style=""` attribute cannot itself contain a media query — the override must be a real CSS rule in a `<style>` tag (or an appended class name toggled via matchMedia — but a plain CSS media-query rule is simpler and matches this codebase's own established pattern from every other restyle story this feature).

**`DESIGN.md`'s own text describes the wrong column compressing** for the artefact-viewer pattern (predicts the sidebar; the real, measured bug is the main `.sw-doc` content column collapsing to 0-14px width while the 320px sidebar stays fixed) — see `decisions.md`, "dsa-s6 created" entry, for the full investigation. The PRESCRIBED FIX (single-column stack, document-body-first) is correct regardless of which column was actually broken; this note is for context only, not something to correct in `DESIGN.md` itself.

**Corrected AC4 regression-spec approach:** this story's own AC5 requires re-running `dsa-s1`'s and `dsa-s2`'s own full pre-existing E2E suites. Confirm the exact current spec filenames at Task 3 time (`tests/e2e/dsa-s1-artefact-viewer-restyle.spec.js`, `tests/e2e/dsa-s2-dashboard-restyle.spec.js`, plus any other pre-existing specs referencing either route — verify via the same route/handler E2E coverage-check method `/verify-completion` already establishes, do not assume only these 2 files exist).

---

## File map

```
Modify:
  src/web-ui/views/dashboard-view.js  — add @media (max-width:768px) override for .sw-skill-grid and .sw-cols, collapsing both to grid-template-columns:1fr
  src/web-ui/routes/artefact.js       — add a @media (max-width:768px) override for .sw-artefact-layout, collapsing display:grid;grid-template-columns:minmax(0,1fr) 320px to a single column (grid-template-columns:1fr, or display:block) — no reordering needed, DOM order is already correct

Create:
  tests/e2e/dsa-s6-mobile-responsiveness.spec.js — E2E tests for AC1-AC5
```

---

## Task 1: Dashboard mobile fix (AC1, AC2)

**Files:**
- Modify: `src/web-ui/views/dashboard-view.js`

- [ ] **Step 1: Write the failing test**

Create `tests/e2e/dsa-s6-mobile-responsiveness.spec.js` (new file — becomes this story's own spec):

```javascript
'use strict';
const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

// dsa-s6 AC1/AC2: dashboard has no horizontal overflow and collapses to a
// legible single column at real mobile viewport widths (375px, 390px).
// Mirrors dsa-s2's own original overflow-measurement method (decisions.md).

withAuth('dsa-s6 AC1: dashboard has no horizontal overflow at 375px/390px', async ({ page }) => {
  // seed a real session with >=1 product (avoid the zero-products onboarding branch)
  // navigate to /dashboard, set viewport to 375px, measure document.body.scrollWidth <= 375
  // repeat at 390px
});

withAuth('dsa-s6 AC2: dashboard skill grid and columns collapse to single column, no illegible/wrapped cards', async ({ page }) => {
  // same page, both viewports
  // assert .sw-skill-grid's real computed grid-template-columns resolves to a single track at <=768px
  // assert .sw-cols likewise
  // assert no card/column renders narrower than a reasonable legibility floor (e.g. >= 280px, matching a typical mobile card-width convention -- confirm a sensible floor at implementation time by checking what width avoids the specific "Definition" / "of ready" wrap already documented)
});
```

Run it (expect fail — no `@media` rules exist yet): `NODE_ENV=test npx playwright test tests/e2e/dsa-s6-mobile-responsiveness.spec.js`

- [ ] **Step 2: Add the `@media` override**

In `dashboard-view.js`'s own `<style>` block (read the file fresh first — do not assume line numbers from this plan are still accurate), append (do not replace or reorder existing rules — pure append, matching this repo's own established pure-append discipline for shared/heavily-used files):

```css
@media (max-width: 768px) {
  .sw-skill-grid { grid-template-columns: 1fr; }
  .sw-cols { grid-template-columns: 1fr; }
}
```

- [ ] **Step 3: Verify AC1/AC2 tests pass**

`NODE_ENV=test npx playwright test tests/e2e/dsa-s6-mobile-responsiveness.spec.js` — AC1/AC2 tests pass.

- [ ] **Step 4: Complete task**
- Check off this task
- Record ending git SHA
- Commit: `feat(dsa-s6): collapse dashboard skill-grid and columns to single column below 768px (AC1, AC2)`

---

## Task 2: Artefact viewer mobile fix (AC3, AC4)

**Files:**
- Modify: `src/web-ui/routes/artefact.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/e2e/dsa-s6-mobile-responsiveness.spec.js`:

```javascript
withAuth('dsa-s6 AC3: artefact viewer has no overflow AND main content column is not collapsed at 375px/390px', async ({ page }) => {
  // navigate to a real seeded artefact page, set viewport to 375px
  // assert document.body.scrollWidth <= 375
  // assert .sw-doc's real rendered width is NOT near-zero (e.g. >= 250px, well above the previously-measured 0px/14px collapse) -- confirm a sensible floor at implementation time
  // repeat at 390px
});

withAuth('dsa-s6 AC4: artefact viewer stacks with document content before the sidebar at 375px/390px', async ({ page }) => {
  // same page, same viewports
  // assert .sw-doc's real getBoundingClientRect().top is less than .sw-artefact-sidebar's own top (i.e. doc renders above sidebar)
  // assert the layout is genuinely single-column (not a squeezed 2-column grid) -- e.g. .sw-artefact-sidebar's own top is >= .sw-doc's own bottom, confirming true vertical stacking not side-by-side compression
});
```

Run — fails (no `@media` rule exists yet for `.sw-artefact-layout`).

- [ ] **Step 2: Add the `@media` override**

Read the current `_buildArtefactBodyContent` function (or wherever `.sw-artefact-layout`'s markup is built) fresh before editing. Add a small `<style>` block to this function's own output (append, do not disturb existing markup) containing:

```css
@media (max-width: 768px) {
  .sw-artefact-layout { grid-template-columns: 1fr; }
}
```

No reordering markup is needed — confirmed DOM order (`.sw-doc` before `.sw-artefact-sidebar`) already satisfies AC4's document-body-first requirement once the grid collapses to one column. If this file doesn't already inject a `<style>` block anywhere in its own output, add the smallest possible one (do not import a new shared stylesheet mechanism — a single inline `<style>@media...</style>` tag matches this codebase's own existing per-route pattern).

- [ ] **Step 3: Verify AC3/AC4 tests pass**

`NODE_ENV=test npx playwright test tests/e2e/dsa-s6-mobile-responsiveness.spec.js` — all 4 tests so far pass.

- [ ] **Step 4: Complete task**
- Check off this task
- Record ending git SHA
- Commit: `feat(dsa-s6): collapse artefact-viewer layout to single column below 768px (AC3, AC4)`

---

## Task 3: Full regression verification (AC5) + npm test + live browser check

**Files:** verification only, no source changes expected (fix forward if Tasks 1-2 missed something).

- [ ] **Step 1: Re-run `dsa-s1`'s and `dsa-s2`'s own full pre-existing E2E suites unmodified.** Confirm the exact current spec filenames first (do not assume only 2 files exist — grep `tests/e2e/*.spec.js` for references to the real artefact-viewer route and the real `GET /dashboard` route, matching the same route/handler E2E coverage-check method `/verify-completion` already establishes for other stories in this feature). Run every locally-runnable one found.

- [ ] **Step 2: Run the full Node suite**

```bash
npm test
```

Foreground, wait for completion. Expect the same 2 already-acknowledged baseline failures (`tests/check-p3.5-validate-trace.js`, `tests/check-pcr-s1-test-runner.js`) — re-run any standalone to confirm before flagging as new.

- [ ] **Step 3: Live browser render check**

Given this story's own established precedent (every prior restyle story in this feature found real value in this check, and this story's own subject matter — narrow-viewport layout — is exactly the class of defect a live render catches that computed-style assertions alone can miss), load both real pages (dashboard with ≥1 product; a real artefact page) at a real narrow viewport. Confirm visually: the dashboard's skill grid and columns genuinely stack and read cleanly (not just pass a scrollWidth check); the artefact viewer's document content is genuinely visible and readable (not just non-zero-width per a computed-style assertion) with the sidebar visibly below it, not beside it. Use Playwright's own `page.setViewportSize()` for the narrow-width portion (this environment's `resize_window` browser tool is confirmed unable to reach true 375-390px widths, per this session's own repeated finding) — a live Chrome check at a normal desktop width plus Playwright-driven narrow-viewport screenshots together satisfy this step.

- [ ] **Step 4: Commit if any fixes were needed** (separate commit, own clear message).

---

## Post-plan note for /verify-completion

This story's diff touches `src/web-ui/routes/artefact.js` (a route/handler file) — `/verify-completion`'s mandatory route/handler E2E coverage check applies. Identify every pre-existing spec touching this route (not just `dsa-s1`'s own spec — grep broadly) and run every non-`@real-staging` one locally, naming any `@real-staging` ones as residual risk.

The mandatory live browser render check also applies (this diff changes rendered UI at narrow viewports specifically) — Chrome tooling was confirmed working as of this session's own recent deliveries; use it directly rather than assuming a RISK-ACCEPT is needed, unless it disconnects.
