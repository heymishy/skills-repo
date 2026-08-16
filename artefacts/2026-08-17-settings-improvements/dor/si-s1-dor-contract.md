# Contract Proposal: Relocate the theme toggle into Settings

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s1-relocate-theme-toggle.md
**Date:** 2026-08-17

---

**What will be built:**
- `renderProfileTab()` in `src/web-ui/routes/settings.js`: add the theme-toggle button markup (reusing `html-shell.js`'s existing `.sw-theme-toggle` structure/classes and `onclick="swToggleTheme()"` handler) into the Profile tab panel.
- `html-shell.js`'s `renderShell()`: remove the theme-toggle button from the topbar chrome markup it currently renders.
- A new PostHog capture call on the relocated toggle's click, via the existing injected `_posthog` adapter — no new adapter, reusing the established `set*` seam.

**What will NOT be built:**
- No change to `swToggleTheme()` itself, `localStorage` key name, or the anti-flash inline script — all reused verbatim.
- No visual redesign of the toggle (icon, colours, sizing) — relocation only.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Call `renderProfileTab()` directly, assert `.sw-theme-toggle` present in output | Unit |
| AC2 | Reuses existing `swToggleTheme()` behaviour, verified via markup assertion (handler wired) | Unit |
| AC3 | Call `renderShell()` and `renderSettingsPage()`, assert toggle absent from one, present exactly once in the other | Unit |
| AC4 | Injected `_posthog` spy, assert `capture` called once on click | Unit |

**Assumptions:**
- No other page currently renders `renderShell()`'s topbar toggle in a way that would break if removed (confirmed: it's rendered once, centrally, in the shared shell function).

**Estimated touch points:**
Files: `src/web-ui/routes/settings.js`, `src/web-ui/utils/html-shell.js`, `tests/check-si-s1-theme-toggle-relocation.js`. Services: none. APIs: none.

**Contract review outcome:** PASSED — proposed implementation aligns with all 4 ACs; no mismatches.
