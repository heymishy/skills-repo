# Implementation Plan: Restyle the Landing Page to Match DESIGN.md

**Story:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s3.md
**Test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s3-test-plan.md
**DoR:** artefacts/2026-09-18-design-system-adoption/dor/dsa-s3-dor.md
**Date:** 2026-09-19

---

## Pre-flight facts (independently verified before writing this plan — do not re-derive, but spot-check anything you rely on)

- **Real target file:** `src/web-ui/templates/landing.html`, a fully self-contained HTML file (own inline `<style>`, own inline `<script>`) read into `_LANDING_HTML` by `src/web-ui/routes/public.js` at module load (lines ~31-34) and served verbatim by `handleRoot` for `GET /`. It is NOT rendered through `renderShell`/`html-shell.js` — it is unauthenticated, has no sidebar, and currently has NO dark/light toggle at all (single dark-only theme).
- **Current CSS is a completely different, older palette** (`#0d1117`/`#58a6ff`/GitHub-dark-style) than `DESIGN.md`'s tokens — this is a full re-theme, not a token-alias swap like `dsa-s1`/`dsa-s2`.
- **Real placeholder/dynamic content that MUST be preserved exactly** (do not touch the surrounding server-side substitution mechanism, only the CSS/HTML wrapping it):
  - `<!--GOLDEN_TRACE_SECTION-->` — replaced server-side (real, live golden-trace demo content; see `check-lphf-s1-golden-trace-demo.js`)
  - `<!--INSTRUCTION_HASH-->` inside the crypto-verification hero card — a real, live SHA-256 (see `check-ccrh-s1-real-instruction-hash.js`)
  - `<!--LEARNINGS_COUNT-->` inside the self-improving hero card — a real, live count with a fail-open default (see `check-lccf-s1-fail-open-learnings-count.js`)
  - `<!--CSRF_TOKEN-->` inside both `#form-signin` and `#form-signup` — a real CSRF token substitution (see `check-sec-perf-s3-auth-email-csrf.js`)
  - PostHog snippet + `cta_clicked`/`landing_page_viewed` tracking, injected server-side by `handleRoot` around this HTML — untouched by this story, but confirm your restyle doesn't remove/rename anything the injection targets (see `check-rpiw-s1-real-route-posthog-wiring.js`)
- **Real, pre-existing regression-guard suite (corrected 2026-09-19 in `decisions.md` — the test-plan/DoR ORIGINALLY cited the wrong file; use this real list):**
  - Node (9 files): `check-lab-s1.2-landing-page.js`, `check-lphf-s1-golden-trace-demo.js`, `check-lphf-s2-scope-contract-card.js`, `check-lphf-s3-crypto-verification-card.js`, `check-lphf-s4-self-improving-card.js`, `check-lphf-s5-auth-panel-restyle.js`, `check-ccrh-s1-real-instruction-hash.js`, `check-lccf-s1-fail-open-learnings-count.js`, `check-rpiw-s1-real-route-posthog-wiring.js`
  - E2E (5 files, 10 tests): `tests/e2e/lphf-s1-keyboard-nav.spec.js`, `lphf-s2-responsive.spec.js`, `lphf-s3-responsive.spec.js`, `lphf-s4-responsive.spec.js`, `lphf-s5-responsive.spec.js`
  - All 9 Node + 10 E2E independently confirmed passing on current (pre-restyle) code before this plan was written.
- **Critical mobile-responsiveness risk, flagged explicitly in `decisions.md`:** 4 of the existing E2E specs above (`lphf-s2` through `s5-responsive.spec.js`) already assert ZERO horizontal overflow at 320px on the CURRENT page — achieved trivially today because the current page has no multi-column grid at all (single centered `.container`, max-width 640px). `DESIGN.md`'s own mock (`Skills Platform - Landing.dc.html`, in this feature's `reference/` dir) DOES use multi-column grids (a `grid-template-columns:1fr 1fr` 2-up section for the "scope-contract"/"crypto-verification" hero cards, and the golden-trace section is also implied to be a grid in the current page's own placeholder text). **This is the exact defect class `dsa-s2` shipped and had to log as a post-merge gap** (a fixed-column grid with no mobile breakpoint). Do not repeat it here — build the mobile breakpoint in from the start, per `DESIGN.md`'s own new "Responsive behavior" section (single `768px` breakpoint; multi-column grids must either use `auto-fit`/`minmax()` or an explicit `@media (max-width:768px)` single-column override).
- **Theme toggle mechanism to reuse, not reinvent:** `html-shell.js` establishes `window.swToggleTheme()` (toggles `[data-theme]` on `<html>`, persists to `localStorage['sw-theme']`, has an anti-flash inline `<head>` script, and respects `prefers-color-scheme` when no explicit choice is stored). The landing page currently has none of this (dark-only). Reuse the SAME mechanism/naming (`swToggleTheme`, `data-theme`, `sw-theme` localStorage key) for consistency with the rest of the app and so AC1/AC2's "computed CSS custom-property values" assertions can use the exact same `getComputedStyle`/token-reading pattern `dsa-s1`'s and `dsa-s2`'s own E2E specs already established — do not invent a second theme mechanism. The landing page needs its OWN visible toggle control (it has no Settings page to defer to, unlike the authenticated app) — a simple button in the new header, matching the mock's own header layout.
- **The real token values** (dark + light) are the same ones `dsa-s1` already established in `html-shell.js`'s `:root`/`[data-theme="dark"]` blocks — copy the exact hex values from there (`--bg`, `--surface`, `--surface-2`, `--line`, `--line-2`, `--ink`, `--ink-2`, `--muted`, `--muted-2`, `--muted-3`, `--accent`, `--accent-soft`, `--accent-ink`, `--success`, `--warn`, `--danger`), do not re-derive from `DESIGN.md`'s own tables if they've ever drifted (they haven't as of this writing, but `html-shell.js` is the single source of truth per `dsa-s1`'s own established convention).
- **Mock reference file:** `artefacts/2026-09-18-design-system-adoption/reference/Skills Platform - Landing.dc.html` — read this in full before starting; it's a `.dc.html` file (Design Components format, inline styles, `sc-for`/`image-slot` custom elements for demo content) — treat it as a visual/structural reference, not literal markup to copy (per `DESIGN.md`'s own Rules for agents section: "Inline styles only... but keep values byte-identical... across files" applies to `.dc.html` files specifically; `landing.html` is real production code using a real `<style>` block with CSS custom properties, which is the correct, established pattern `dsa-s1`/`dsa-s2` both already use — do not switch to inline styles for this file).

---

## Task 1: Restyle `landing.html`'s CSS to DESIGN.md's tokens, layout pattern, and mobile breakpoint — preserve all existing dynamic content and auth functionality (AC1, AC2, AC3, AC5)

**Files:**
- Modify: `src/web-ui/templates/landing.html`

- [ ] **Step 1: Read the exact current state first**

Re-read `src/web-ui/templates/landing.html` in full (140 lines) immediately before editing — confirm the exact current structure of: the golden-trace placeholder comment, all 3 hero-card sections (`data-hero="scope-contract"`, `data-hero="crypto-verification"`, `data-hero="self-improving"`), the auth-panel (GitHub/Google/email tabs/forms), and the `showTab()` script. Also re-read the mock file (`reference/Skills Platform - Landing.dc.html`) in full for the target visual structure (header nav, hero, "product in action" browser-chrome section, 2-up grid section, closing section, footer).

- [ ] **Step 2: Write the failing tests**

Extend `tests/e2e/dsa-s3-landing-restyle.spec.js` (new file) with:
- AC1: dark-mode token assertions (`getComputedStyle` against the real `html-shell.js` token table — same 13-token pattern `dsa-s1`'s own spec established)
- AC2: light-mode token assertions (toggle via the new `swToggleTheme()`, same pattern)
- AC3: structural assertions — centered hero present, max-width ~900px copy, at least one full-bleed section below at max-width 1120px, a browser-chrome-framed element present (traffic-light dots + a framed content area) if you build the "product in action" section, OR document explicitly if you judge this section out of scope for a first pass (see Step 4 note below)
- AC5: mobile-viewport check — `page.setViewportSize({width:375,height:667})` and `{width:390,height:844}`, assert `document.body.scrollWidth` does not exceed the viewport width

- [ ] **Step 3: Run tests — must fail** (page not yet restyled)

- [ ] **Step 4: Write the implementation**

Rewrite `landing.html`'s `<style>` block and body structure:

1. **Token CSS custom properties**: add a `:root` block (light values) and `[data-theme="dark"]` block (dark values) with the exact hex values copied from `html-shell.js`. Add the same anti-flash inline `<script>` in `<head>` `html-shell.js` uses (reads `localStorage['sw-theme']`, sets `data-theme` before first paint) and the same `window.swToggleTheme()` function, adapted for a standalone page (no sidebar/settings — just toggles `data-theme` + persists).
2. **Header/nav**: add a simple header matching the mock's own layout (logo mark, nav links if desired — these can be static/inert since this is out of scope for auth changes — a "Sign in"/"Get started" pairing, and a visible theme-toggle button). Keep it minimal; do not build new navigation destinations that don't exist.
3. **Hero section**: centered, max-width ~900px copy, matching AC3's wording. Preserve the existing headline/value-prop TEXT content (do not rewrite marketing copy — Out of Scope) but restyle its presentation to match the mock's typographic treatment (Inter Tight, the scale from `DESIGN.md`).
4. **Golden-trace + 3 hero cards**: these currently render as a narrow single-column stack. Restyle to fit the new wider layout — judge based on the mock whether these best fit as the "product in action" browser-chrome section (if you build one) or as their own full-bleed section(s) using a 2-up grid (matching the mock's own `grid-template-columns:1fr 1fr` treatment) for the hero cards specifically. **If you judge the "product in action" browser-chrome/screenshot section is not buildable without new demo assets (the mock's own version uses `sc-for`/`image-slot` custom elements this story has no real equivalent for), it is acceptable to omit that specific mock element for this story's first pass — document this explicitly as a scope note in your task report, do not silently drop it.** The golden-trace section and 3 hero cards, however, are REAL existing content (not mock-only placeholders) and MUST remain present and functional.
5. **Any multi-column grid you introduce (the hero-card 2-up grid, or any other)** MUST include a `@media (max-width: 768px)` override collapsing to a single column, OR use `grid-template-columns: repeat(auto-fit, minmax(...))` — per `DESIGN.md`'s new Responsive behavior section and the pre-flight risk noted above. Verify with a real Playwright check at 375px/390px before considering this task done, not just by reading the CSS.
6. **Auth panel**: keep functionally identical (GitHub/Google/email-tab buttons, both forms, `showTab()` script, CSRF placeholders) — restyle its visual presentation (colors, spacing, radius) to match the new token values and the mock's own button/card styling conventions from `DESIGN.md`'s Components section, but do not change its structure, IDs, `name` attributes, `action` URLs, or the `showTab()` function's own logic.
7. **Footer**: add a simple footer matching the mock's own minimal footer if it fits naturally; not required by any AC, low priority.

- [ ] **Step 5: Run tests — must pass**

- [ ] **Step 6: Run the full regression suite** (the corrected AC4 list from `decisions.md`)

```bash
node tests/check-lab-s1.2-landing-page.js
node tests/check-lphf-s1-golden-trace-demo.js
node tests/check-lphf-s2-scope-contract-card.js
node tests/check-lphf-s3-crypto-verification-card.js
node tests/check-lphf-s4-self-improving-card.js
node tests/check-lphf-s5-auth-panel-restyle.js
node tests/check-ccrh-s1-real-instruction-hash.js
node tests/check-lccf-s1-fail-open-learnings-count.js
node tests/check-rpiw-s1-real-route-posthog-wiring.js
NODE_ENV=test npx playwright test tests/e2e/lphf-s1-keyboard-nav.spec.js tests/e2e/lphf-s2-responsive.spec.js tests/e2e/lphf-s3-responsive.spec.js tests/e2e/lphf-s4-responsive.spec.js tests/e2e/lphf-s5-responsive.spec.js
NODE_ENV=test npx playwright test tests/e2e/dsa-s3-landing-restyle.spec.js
```

All must pass. If any of the 9 Node/10 E2E pre-existing tests fail, investigate whether it's a real regression (fix the restyle) or a stale assertion against an intentionally-changed visual detail (e.g. `check-lphf-s5-auth-panel-restyle.js`'s own "reduced padding relative to the pre-redesign baseline (28px)" assertion — read it carefully, it may need its OWN literal value updated if your new auth-panel padding differs, matching this feature's own "update the stale assertion to the real new value, don't silently loosen it" convention already used in `dsa-s1`'s own delivery for the `bcf-s1` contrast test).

- [ ] **Step 7: Run ci-typecheck**

- [ ] **Step 8: Commit**

```bash
git add src/web-ui/templates/landing.html tests/e2e/dsa-s3-landing-restyle.spec.js
git commit -m "feat(dsa-s3): restyle landing.html to DESIGN.md's tokens, Marketing/landing layout, and mobile breakpoint (AC1-AC3, AC5)"
```

---

## Task 2: Full regression verification (AC4) + accessibility spot-check + Node suite + npm test

**Files:** verification only, no source changes expected (fix forward if Task 1 missed something).

- [ ] **Step 1: Re-run the full corrected AC4 suite** (same commands as Task 1 Step 6) — confirm clean on the committed state.

- [ ] **Step 2: Accessibility spot-check** (NFR, WCAG 2.1 AA floor) — this story's own NFR section requires "no regression to existing accessibility properties." Compare the new auth-panel/hero-card contrast ratios (text-on-background) against the OLD page's own values using the real new token hex values — this feature's own `dsa-s1` delivery found a real WCAG AA contrast regression this exact way (dark-mode `--accent` on a light button background dropping below 4.5:1) on an unrelated already-shipped story's buttons; check whether this restyle's own new button/link colors on the landing page have the same risk, given the accent color is the same as `dsa-s1`/`dsa-s2` already use. If a gap is found, follow the same pattern already established: fix the stale assertion to the real value, flag the real color gap as a decisions.md entry / follow-up, do not silently ship it uncaught.

- [ ] **Step 3: Run the full Node suite**

```bash
npm test
```

Foreground, wait for completion. Expect only the 2 already-documented pre-existing failures this session has confirmed repeatedly (`tests/check-p3.5-validate-trace.js`, `tests/check-pcr-s1-test-runner.js` — the latter passes standalone, confirmed orchestrator-level flakiness, not a real failure).

- [ ] **Step 4: Live browser render check** — given this story's own established precedent (both `dsa-s1` and `dsa-s2` found real visual defects only a live browser check caught), load the real restyled page in a real browser (Claude-in-Chrome or equivalent), both light and dark mode, at both a normal desktop viewport AND a real mobile viewport (375px). Confirm: no unstyled elements, no overlapping content, the theme toggle actually works, the auth buttons/forms are visually correct and functional-looking, and the mobile view is genuinely usable (not just technically non-overflowing).

- [ ] **Step 5: Commit if any fixes were needed** (separate commit, own clear message)

---

## Post-plan note for /verify-completion

This story's diff touches `src/web-ui/templates/landing.html` — the platform's real, live, first-impression, unauthenticated marketing/sign-up page. `/verify-completion`'s mandatory live browser render check applies with high priority here, matching `dsa-s1`'s and `dsa-s2`'s own experience that this check catches real defects automated tests miss — and mobile responsiveness specifically, given this story's own pre-flight investigation flagged a concrete regression risk (`dsa-s2`'s own shipped mobile-overflow gap) that this story's implementation must not repeat.

Any RISK-ACCEPTs already logged in `decisions.md` for this story carry forward — no new action needed at `/verify-completion` for those, unless Task 2's accessibility spot-check surfaces a new one.
