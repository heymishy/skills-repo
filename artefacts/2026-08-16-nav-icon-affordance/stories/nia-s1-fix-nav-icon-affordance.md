# Story: Fix affordance mismatch on the sign-out control and theme-toggle button in the shared shell

**Epic reference:** None — short-track (bug/UX fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the validated beta-feedback triage below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As a **signed-in wuce user** (any authenticated user — not admin-only; this is a global nav element rendered by `renderShell`/`renderSidebar` on every page),
I want **the sidebar's sign-out control to visibly show what it does before I tap it, and the top-right theme-toggle button to stop looking like a profile/avatar placeholder**,
So that **I don't accidentally sign myself out with no warning, and I don't waste time tapping a button that looks like "my account" but silently does something unrelated (and nothing that looks like account/profile access exists anywhere in the nav)**.

## Benefit Linkage

**Metric moved:** No formal benefit-metric artefact — short-track. Operational/quality metric: real, validated beta-user-reported navigation defects (two of two High-severity signals fully confirmed against wuce-staging.fly.dev), directly observed rather than theoretical.
**How:** `artefacts/feedback/beta-001.md` (triage of the first real, non-internal beta usage signal, validated live 2026-08-16) confirmed two root causes, both in `src/web-ui/utils/html-shell.js`: (1) the sidebar's sign-out link (`.sw-signout`, `↗`) has no visible affordance signal beyond a hover-only `title` tooltip — invisible on the mobile Safari touch device the beta user was on — and performs a full, irreversible-feeling sign-out with zero warning, landing the user on the public marketing homepage (whose hero button reads "OPEN FRAMEWORK," matching exactly what the user described unexpectedly landing on). (2) The top-right `themeToggle` button (`◑`) sits exactly where a profile/account affordance conventionally lives and visually reads as a generic avatar placeholder in a zoomed screenshot, but is not a profile control at all — no profile/account menu exists anywhere in the nav. Fixing both closes two independently-confirmed High-severity usage defects from the platform's first real external user.

## Architecture Constraints

`src/web-ui/utils/html-shell.js`'s `renderSidebar` and `renderShell` are the sole owners of this markup — both fixes stay entirely inside this one file, per `.github/standards/web-ui/web-ui-patterns.md`'s shared-shell-module rule (never re-implement shell markup per-route). No route file touches this story.

**Design reasoning (documented per CLAUDE.md's requirement that a real design call be written down, not just implemented silently):**

1. **Sign-out control:** Two independent existing conventions in this codebase already answer "how does wuce warn a user before a destructive action?" — `products.js`'s module-delete and product-delete buttons, and `features.js`'s journey-delete button, all gate their destructive `fetch()` call behind a JS `confirm()` dialog with an explicit, specific message (e.g. `"Delete this product? This permanently removes it from wuce... Your GitHub repository will NOT be deleted..."`). Sign-out is analogous in kind (a single, surprising, hard-to-undo-feeling action triggered by one tap) even though the underlying mechanism differs (plain `<a href>` navigation, not a `fetch()` DELETE). The chosen fix reuses this exact established pattern rather than inventing a new one: gate the anchor's navigation behind `onclick="return confirm('Sign out of wuce?')"`, matching the codebase's own destructive-action convention. Layered with this, per the beta principle ("do the obvious thing its shape promises"), the control also gets a visible text label ("Sign out") next to the arrow glyph — so the confirm dialog is a second layer of protection, not the only signal; a user should be able to tell what the control does before ever tapping it, from the label alone.
2. **Theme-toggle button:** The near-universal convention for a dark/light toggle is a sun/moon icon pair, not a half-filled circle (which reads as a profile silhouette/avatar placeholder in this app's specific rendering, per the beta screenshot). Rather than introducing new JS-driven state tracking to decide which icon to show (a source of staleness bugs — the button currently doesn't even resync its own glyph with actual theme state), the fix reuses the exact CSS-driven, no-JS-flash technique this same file already uses for dark-mode color tokens (`[data-theme="dark"] { ... }` plus the `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]):not([data-theme="dark"]) { ... } }` no-JS fallback, both already present in `DESIGN_SYSTEM_CSS`). Two icon spans (sun, moon) are rendered inside the button; CSS shows exactly one depending on the live `data-theme` state, with no added JS and no flash-of-wrong-icon, since `data-theme` is already set synchronously in `<head>` by the existing anti-flash script before the button ever paints. The icon shown reflects the *current* active theme (sun visible when light is active, moon visible when dark is active) — the same current-state-indicator convention already implied by this codebase's own token-swap pattern, and the simplest, least error-prone option of the choices considered (see `decisions.md` for the alternative considered and rejected).

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the sidebar's sign-out control previously communicated its function only via a hover-only `title="Sign out"` tooltip (invisible on touch devices), When `renderSidebar` is updated, Then the rendered `.sw-signout` element contains a visible text node reading "Sign out" (not hidden, not hover-only) in addition to its icon, and its `href` remains `/auth/logout`, unchanged from before.

**AC2:** Given sign-out is a single-tap, no-warning, hard-to-undo-feeling action, When a user activates the sign-out control, Then the control's `onclick` handler invokes a JS `confirm()` dialog with an explicit message ("Sign out of wuce?") before navigation proceeds — matching the same `confirm()`-gated pattern this codebase already uses for its other destructive actions (`products.js` module/product delete, `features.js` journey delete) — and returns `false` (blocking navigation) when the dialog is not confirmed.

**AC3:** Given the theme-toggle button's `◑` glyph visually reads as a generic profile/avatar placeholder with no relation to its actual dark/light-mode function, When `renderShell`'s `themeToggle` markup is updated, Then the rendered button no longer contains the `◑` character; instead it contains two distinct icon elements (a sun-style glyph and a moon-style glyph), with CSS gating exactly one visible at a time based on the live `[data-theme]` state on `<html>` (sun visible in light mode, moon visible in dark mode, including the no-JS `prefers-color-scheme` fallback already established in `DESIGN_SYSTEM_CSS` for color tokens).

**AC4:** Given the theme toggle's existing class, click handler, and toggle behaviour must not regress, When the icon markup changes, Then the button still has `class="sw-theme-toggle"`, `onclick="swToggleTheme()"`, and `aria-label="Toggle dark mode"` unchanged, and calling `swToggleTheme()` still flips `data-theme` between `"light"` and `"dark"` on `<html>` and persists the choice to `localStorage['sw-theme']`, exactly as before this story.

## Out of Scope

- `requireAdmin` gating, `NAV_ITEMS`, or the sidebar's product-list rendering — untouched.
- Any other element in `html-shell.js` beyond `.sw-signout` and `.sw-theme-toggle`/`themeToggle`.
- A full account/profile menu or dropdown — out of scope for this bug fix; the theme-toggle fix only stops the button from *looking like* a profile control it isn't. A real profile/account menu, if wanted, is a separate, larger feature.
- Any change to the `/auth/logout` route itself, or to session/auth logic — this story only changes client-facing markup/confirmation, not what sign-out does once confirmed.
- Mobile compatibility investigation (beta-001 signal #2) and the billing portal 500 error (beta-001 signals #1/#6) — both explicitly routed as separate fix targets in `beta-001.md`, not this story.

## NFRs

- **Performance:** No measurable change — pure markup/CSS additions, no new network calls, no new JS execution beyond one `confirm()` call already gated behind a user click.
- **Security:** No change to the sign-out route or its behaviour once confirmed — the confirm dialog is a UX safeguard, not a security boundary. Net risk reduction: an accidental/misread tap can no longer silently sign a user out.
- **Accessibility:** Real, explicit concern — this is not incidental. The sign-out control's *only* prior affordance signal was a hover-only `title` attribute, which has no equivalent on touch input (no hover state exists on mobile Safari, where this was reported) — this made the control's function undiscoverable for touch/mobile and screen-reader users alike relying on visible text over tooltip text. AC1's visible "Sign out" label directly closes this gap; it is also a general improvement for keyboard/screen-reader users who would otherwise depend on `title` (a weak, frequently-skipped accessibility signal). AC3/AC4 preserve the theme-toggle's existing `aria-label` unchanged, so no accessibility regression is introduced by the icon swap.
- **Audit:** None identified — no change to logging behaviour.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

**Justification:** Not a purely mechanical swap (unlike `tmss-s1`'s shared-shell reuse) — this story required a real design judgment call on two independent conventions (confirm-dialog wording/pattern choice, sun/moon icon current-vs-target-state convention), both now written down above and in `decisions.md`. Scope itself (one file, two named elements) is fully bounded and stable — the "2" reflects design ambiguity resolved during authoring, not scope uncertainty.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
