## Test Plan: Fix affordance mismatch on the sign-out control and theme-toggle button

**Story reference:** artefacts/2026-08-16-nav-icon-affordance/stories/nia-s1-fix-nav-icon-affordance.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Sign-out control has a visible "Sign out" text label, `href` unchanged | 1 test | — | — | — | — | 🟢 |
| AC2 | Sign-out `onclick` gates navigation behind `confirm()` | 1 test | — | — | — | — | 🟢 |
| AC3 | Theme toggle no longer renders `◑`; renders CSS-gated sun/moon icon pair | 1 test | — | — | — | — | 🟢 |
| AC4 | Theme toggle's class/handler/aria-label unchanged; `swToggleTheme()` behaviour unregressed | 1 test | — | — | — | — | 🟢 |

**E2E / browser-layout detection (Step 3a):** Scanned all 4 ACs for CSS-layout-dependent language (drag-drop, pointer/click coordinates, `getBoundingClientRect`/`offsetTop`/`scrollTop`, on-screen-position checks, `e.target` identity from stacking, visual rendering). AC3's actual *visual* correctness (does the sun/moon glyph render legibly and not look like an avatar at real device sizes) is inherently CSS-rendering-dependent and cannot be fully proven by a unit test inspecting the HTML/CSS string — this is the same category of gap CLAUDE.md's B2 rule requires classifying explicitly at DoR time. **Classification: RISK-ACCEPT + manual smoke test**, not automated visual regression — see `decisions.md` and the verification script's Scenario 3 below, plus a post-deployment smoke-test action item recorded in `workspace/state.json` `pendingActions`. The remaining three ACs (AC1, AC2, AC4) are pure DOM-structure/string/behavioural checks with no CSS layout dependency and are fully unit-testable.

---

## Coverage gaps

**AC3 (visual legibility of the sun/moon icon at real device sizes):** RISK-ACCEPT — automated unit tests can only prove the correct DOM/CSS *exists* (icon elements present, CSS selectors present, `◑` absent), not that the icon reads clearly as "theme toggle" rather than "avatar" to a real human eye on a real device. Closed via the verification script's Scenario 3 (manual check against staging) instead of a Playwright visual-regression test, per CLAUDE.md's B2 classification rule. See `decisions.md` for the RISK-ACCEPT entry.

---

## Test Data Strategy

**Source:** Synthetic (mock `req`/`session`, static call to `renderShell`/`renderSidebar` — no database state read; both elements are pure functions of their render-time inputs)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC4 | A `renderShell()`/`renderSidebar()` call with a minimal `user`/`login` value | Direct function call, no mock DB/session needed | None | Both elements are rendered unconditionally for any signed-in user; no admin/tenant state affects their markup |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the AC3 visual-legibility gap already logged above.

---

## Unit Tests

### htmlShell_signout_hasVisibleTextLabel

- **Verifies:** AC1
- **Precondition:** None — `renderSidebar` takes no session/DB dependency
- **Action:** Call `renderSidebar('dashboard', 'alice', false)` (mirroring `check-b2-account-nav.js`'s own existing call convention), inspect the `.sw-signout` element in the returned HTML
- **Expected result:** The HTML contains a `.sw-signout` anchor whose content includes the visible text "Sign out" (not only inside a `title` attribute — a real text node between opening/closing tags), and `href="/auth/logout"` is present and unchanged.
- **Edge case:** No

### htmlShell_signout_confirmGatesNavigation

- **Verifies:** AC2
- **Precondition:** Same as above
- **Action:** Inspect the `.sw-signout` element's `onclick` attribute value
- **Expected result:** The `onclick` attribute contains a call to `confirm(` with a non-empty message string, structured so a `false`/cancelled result blocks navigation (`onclick="return confirm(...)"` or equivalent — the test asserts the literal presence of `confirm(` and a `return` that gates on its result, not merely that some `onclick` exists).
- **Edge case:** No

### htmlShell_themeToggle_noLongerRendersAmbiguousGlyph

- **Verifies:** AC3
- **Precondition:** None — `renderShell` takes a minimal `opts` object (`title`, `bodyContent`, `user`)
- **Action:** Call `renderShell({ title: 't', bodyContent: '', user: { login: 'alice' } })`, inspect the `.sw-theme-toggle` button and the surrounding `DESIGN_SYSTEM_CSS` (exported indirectly via the full HTML string, since `renderShell` inlines `<style>`)
- **Expected result:** The rendered `<button class="sw-theme-toggle" ...>` no longer contains the literal `◑` character. It contains two distinct icon child elements (asserted by two distinct class names, e.g. `sw-theme-toggle-icon--light` and `sw-theme-toggle-icon--dark`). The inlined `<style>` block contains a `[data-theme="dark"]` rule referencing at least one of those two icon classes (proving the sun/moon pair is CSS-gated by theme state, not both permanently visible or both permanently hidden), and a `@media (prefers-color-scheme: dark)` rule with a matching no-JS fallback selector, mirroring the existing color-token pattern already in `DESIGN_SYSTEM_CSS`.
- **Edge case:** No

### htmlShell_themeToggle_classHandlerAriaLabelUnchangedAndToggleStillWorks

- **Verifies:** AC4
- **Precondition:** None
- **Action:** Call `renderShell(...)` as above, inspect the `.sw-theme-toggle` button's attributes; separately, source-scan `SHELL_JS`'s exported `swToggleTheme` logic (via a regex/string check on the module's own JS-string constant, since `SHELL_JS` is not directly unit-callable outside a browser DOM — matching this file's own existing testing convention for other inline-script behaviour, e.g. `check-d2-impersonation-banner.js`'s approach to `swExitImpersonation`)
- **Expected result:** The button retains exactly `class="sw-theme-toggle"`, `onclick="swToggleTheme()"`, and `aria-label="Toggle dark mode"`, unchanged from before this story. The `SHELL_JS` string still contains the `swToggleTheme` function definition, and its body still (a) reads `data-theme` from `<html>`, (b) computes the opposite of the current value, (c) calls `_html.setAttribute('data-theme', next)`, and (d) calls `localStorage.setItem('sw-theme', next)` — i.e. the toggle function's own logic is untouched by this story, only the button's rendered icon markup changed.
- **Edge case:** No

---

## Integration Tests

None — this story only changes static markup/CSS returned by two existing, already-integration-tested pure-string-building functions (`renderSidebar`, `renderShell`). No new component handoff is introduced.

---

## NFR Tests

### htmlShell_signout_accessibleNameNotToolTipOnly

- **Verifies:** Accessibility NFR (story NFR section) — the sign-out control's accessible name must not depend solely on `title`
- **Precondition:** None
- **Action:** Inspect the `.sw-signout` element's accessible-name-contributing content (visible text node, per AC1) versus its `title` attribute
- **Expected result:** A visible text node ("Sign out") exists independent of any `title` attribute — even if `title` is retained as supplementary hover text, it is not the sole source of the control's accessible name or visible affordance. (This is asserted as part of `htmlShell_signout_hasVisibleTextLabel` above, not a separate test file entry — listed here to make the NFR-to-test traceability explicit per CLAUDE.md's artefact-writing standard.)

---

## Out of Scope for This Test Plan

- A Playwright/automated visual-regression test proving the sun/moon icon is legible and doesn't resemble an avatar at real device sizes — RISK-ACCEPTed per the Coverage gaps section above; closed by the verification script's manual Scenario 3 instead.
- Any test of `NAV_ITEMS`, `requireAdmin` gating, or the sidebar's product-list rendering — untouched by this story.
- Any test of `/auth/logout`'s server-side route behaviour — unchanged by this story; only client-facing markup/confirmation changes.
- A full account/profile menu — not built by this story (see story's Out of Scope).

---

## Test Gaps and Risks

**AC3 visual-legibility gap (RISK-ACCEPT):** See Coverage gaps above and `decisions.md`. Not blocking DoR sign-off — closed via manual verification script scenario plus a recorded post-deployment smoke-test action item, per CLAUDE.md's B2 CSS-layout-dependent AC classification rule.
