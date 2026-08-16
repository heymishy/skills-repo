# DoR Contract: Fix affordance mismatch on the sign-out control and theme-toggle button

**Story reference:** artefacts/2026-08-16-nav-icon-affordance/stories/nia-s1-fix-nav-icon-affordance.md
**Test plan reference:** artefacts/2026-08-16-nav-icon-affordance/test-plans/nia-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. In `src/web-ui/utils/html-shell.js`'s `renderSidebar`: replace the `.sw-signout` anchor's markup —
   `'<a class="sw-signout" href="/auth/logout" title="Sign out">↗</a>'` becomes an anchor with a visible
   "Sign out" text node alongside the existing `↗` glyph, and an `onclick` handler that gates navigation
   behind `confirm('Sign out of wuce?')` (matching `products.js`/`features.js`'s existing destructive-action
   `confirm()` convention). `href="/auth/logout"` stays unchanged.
2. In `renderShell`'s `themeToggle` constant: replace the single `◑` character with two child icon
   elements (sun, moon), each with a distinct class (`sw-theme-toggle-icon--light`,
   `sw-theme-toggle-icon--dark`). `class="sw-theme-toggle"`, `onclick="swToggleTheme()"`, and
   `aria-label="Toggle dark mode"` all remain unchanged on the outer `<button>`.
3. In `DESIGN_SYSTEM_CSS`: add CSS rules gating the two new icon spans by theme state, following the exact
   existing pattern already used for color tokens in the same file — a `[data-theme="dark"]` rule to show
   the dark-mode icon and hide the light-mode icon, plus a `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]):not([data-theme="dark"]) { ... } }` no-JS fallback block mirroring the token block already present. Default (no `data-theme` attribute, no dark OS preference) shows the light/sun icon.
4. `SHELL_JS`'s `swToggleTheme` function body is NOT modified — it already correctly flips `data-theme` and
   persists to `localStorage`; the new CSS rules key off the same `data-theme` attribute it already sets, so
   the icon updates automatically with zero new JS.
5. New test file `tests/check-nia-s1-nav-icon-affordance.js` covering all 4 ACs per the test plan.

**What will NOT be built:**
- No change to `NAV_ITEMS`, `requireAdmin` gating, or the sidebar's product-list rendering.
- No new account/profile menu or dropdown.
- No change to `/auth/logout`'s server-side route or session/auth logic.
- No new JS-driven icon-state-tracking logic — the fix is CSS-only, keyed off the `data-theme` attribute
  `swToggleTheme` already sets, deliberately avoiding a second, potentially-stale source of truth for which
  icon should show.
- No automated visual-regression (Playwright screenshot) test for AC3's real-device legibility — RISK-ACCEPTed
  per the test plan's Coverage gaps section; closed via the verification script's manual Scenario 3 instead.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (visible "Sign out" text label) | Unit test: call `renderSidebar(...)`, assert the `.sw-signout` element contains a "Sign out" text node and unchanged `href` | unit |
| AC2 (confirm() gates navigation) | Unit test: assert the `.sw-signout` element's `onclick` attribute contains `confirm(` with a non-empty message and a `return` gating navigation on the result | unit |
| AC3 (no `◑`, CSS-gated sun/moon pair) | Unit test: assert `◑` absent from the rendered button, two distinct icon-class elements present, and matching `[data-theme="dark"]` + `@media (prefers-color-scheme: dark)` CSS rules present in the inlined `<style>` block | unit |
| AC4 (class/handler/aria-label unchanged, toggle behaviour unregressed) | Unit test: assert `class`, `onclick`, `aria-label` attributes unchanged; source-scan `SHELL_JS`'s `swToggleTheme` body for its existing `data-theme` read/set + `localStorage.setItem` calls, unchanged | unit |

**Assumptions:**
- `renderSidebar`/`renderShell` are pure, synchronous string-building functions with no DB/session dependency beyond the `login`/`user` values already passed at every existing call site — no new test double infrastructure is needed beyond what `check-b2-account-nav.js` (an existing test of this same file) already establishes as the calling convention.
- The existing tests `tests/check-b2-account-nav.js` (asserts `html.includes('/auth/logout')`) and `tests/check-acps-s1-admin-credits-shell.js` (asserts `res._body.includes('sw-theme-toggle')`) both assert on substrings that remain present and unchanged after this fix — reviewed directly against this story's planned markup changes before writing this contract; neither requires a CORRECTION.
- The sun/moon icon shown reflects the *currently active* theme (sun when light is active, moon when dark is active) rather than the *target* theme the click would switch to — chosen as the simpler, less error-prone convention consistent with this file's own existing "state reflects `data-theme` directly" pattern for color tokens. See story's Architecture Constraints and `decisions.md` for the alternative considered and rejected.
- `confirm()`'s exact wording ("Sign out of wuce?") is a first design pass, matching the terse, direct tone of the codebase's other `confirm()` messages (`products.js`'s "Delete this product? ...") — refinable later without re-opening this story if user feedback suggests different wording; the AC only requires *a* clear, non-empty confirmation message gating navigation, not this exact string.

**Estimated touch points:**
Files: `src/web-ui/utils/html-shell.js` (modified — `renderSidebar`, `themeToggle` in `renderShell`, `DESIGN_SYSTEM_CSS`), `tests/check-nia-s1-nav-icon-affordance.js` (new).
Services: None.
APIs: None — no new routes, no changed request/response shape anywhere.

---

## Contract Review

Reviewed against all 4 ACs and the test plan. No mismatches found — every AC has a proposed implementation approach and a specific, matching test type (unit). AC3's inherently-visual dimension (does the icon genuinely read as "theme toggle" rather than "avatar" to a human eye) is explicitly out of unit-test scope and RISK-ACCEPTed with a manual verification-script fallback, consistent with CLAUDE.md's B2 CSS-layout-dependent-AC classification rule — not a silent gap.

✅ **Contract review passed** — proposed implementation aligns with all ACs.
