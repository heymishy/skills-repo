## Story: Relocate the theme toggle into Settings

**Epic reference:** artefacts/2026-08-17-settings-improvements/epics/settings-improvements.md
**Discovery reference:** artefacts/2026-08-17-settings-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-08-17-settings-improvements/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **regular team member** (or account owner/admin — this preference is available to all signed-in users),
I want to **find the dark/light mode toggle inside Settings' Profile tab instead of the persistent topbar**,
So that **the control lives with my other personal preferences, closing the beta-reported "why is this in the topbar" friction**.

## Benefit Linkage

**Metric moved:** Theme toggle relocation — no usage regression
**How:** Relocating the toggle and instrumenting a click event on its new location produces the click-rate data the metric measures; a clean relocation with no drop-off directly satisfies the metric's target.

## Architecture Constraints

- Shared shell module (mandatory): the relocated control must continue to use `swToggleTheme()` exactly as defined in `src/web-ui/utils/html-shell.js` — do not duplicate or reimplement toggle logic in `settings.js`. Any new markup in `settings.js`'s Profile tab must use `escHtml()` for any dynamic string content, consistent with the rest of that file.
- No schema change — theme preference remains client-side (`localStorage.getItem('sw-theme')`), exactly as it works today. This story only moves where the control is rendered, not how the preference is stored.

## Dependencies

- **Upstream:** None
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a signed-in user on the Settings page's Profile tab, When the page renders, Then a dark/light mode toggle control is visible in the Profile tab's panel, styled consistently with the existing `.sw-theme-toggle` pattern in `html-shell.js`.

**AC2:** Given the relocated toggle in Settings, When a user clicks it, Then `data-theme` on `<html>` flips exactly as it does today via the existing topbar toggle (same `swToggleTheme()` function, same `localStorage` key `sw-theme`), and the visual theme changes immediately with no page reload.

**AC3:** Given the toggle has been relocated into Settings, When the Settings page or any other page renders, Then the toggle no longer appears in the persistent topbar — it exists in exactly one location (Settings' Profile tab), not both.

**AC4:** Given a user clicks the relocated toggle, When the click completes, Then a new click event is captured via the existing `_posthog.capture` convention (event name distinct from any prior topbar-toggle event, since no prior event existed to reuse), providing the click-rate data the theme-toggle-relocation metric needs.

## Out of Scope

- Any change to how the theme preference is stored (stays `localStorage`, not server-side) — cross-device sync is not part of this story.
- A discoverability aid (tooltip, redirect, or notice) pointing users from the old topbar location to the new one — only added later if the benefit metric shows a real drop-off, per the epic's feedback loop.
- Changing the toggle's visual design (icon, styling) — relocation only, not a redesign.

## NFRs

- **Performance:** No measurable page-load impact — this moves existing markup, does not add new client-side dependencies.
- **Security:** None identified — no user-supplied content involved.
- **Accessibility:** The relocated control retains its existing `aria-label="Toggle dark mode"` and keyboard focus behaviour (`:focus-visible` outline), unchanged from the current topbar implementation.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
