## Test Plan: Relocate the theme toggle into Settings

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s1-relocate-theme-toggle.md
**Epic reference:** artefacts/2026-08-17-settings-improvements/epics/settings-improvements.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-17

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Toggle control visible in Profile tab panel | 1 test | — | — | — | — | 🟢 |
| AC2 | Click flips `data-theme` via existing `swToggleTheme()`, same `localStorage` key | 1 test | — | — | — | — | 🟢 |
| AC3 | Toggle exists in exactly one location (not also in topbar) | 1 test | — | — | — | — | 🟢 |
| AC4 | Click fires a new PostHog event | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are DOM-string/state assertions, testable in this codebase's existing `node tests/check-*.js` (no jsdom/browser needed — the render functions return HTML strings and `data-theme`/`localStorage` state is checked via existing `swToggleTheme()` unit coverage in `html-shell.js`'s own test file).

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own data in setup

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Rendered Profile tab HTML string | Call `renderProfileTab(user, linkedSet)` directly with a synthetic user object | None | No DB, no session needed |
| AC2 | `swToggleTheme()`'s existing behaviour | Reuse `html-shell.js`'s own toggle logic, unchanged | None | This story does not change the function |
| AC3 | Rendered topbar HTML (via `renderShell`) vs. rendered Settings page HTML | Call `renderShell()` and `renderSettingsPage()` directly | None | String search for `.sw-theme-toggle` markup in each |
| AC4 | Injected `_posthog` spy | Existing injectable-adapter pattern (`set*` seam) | None | Assert `capture` called with the new event name once, not on page load |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### rendersThemeToggleInProfileTab

- **Verifies:** AC1
- **Precondition:** `renderProfileTab(user, linkedSet)` called with a synthetic authenticated user
- **Action:** Call the function, inspect the returned HTML string
- **Expected result:** Output contains a `.sw-theme-toggle` element with `aria-label="Toggle dark mode"`, nested inside the Profile tab panel markup (`id="tab-panel-profile"`)
- **Edge case:** No

### themeToggleClickFlipsDataThemeAndLocalStorage

- **Verifies:** AC2
- **Precondition:** `data-theme` unset on `<html>`, no `sw-theme` key in `localStorage`
- **Action:** Simulate calling `window.swToggleTheme()` (existing, unmodified function)
- **Expected result:** `data-theme` becomes `"dark"`, `localStorage.getItem('sw-theme')` becomes `"dark"` — identical behaviour to the pre-relocation topbar toggle, since this story reuses the function unchanged
- **Edge case:** No — this test already exists in `html-shell.js`'s own test coverage; this story does not need to duplicate it, only confirm the relocated markup calls the same `onclick="swToggleTheme()"` handler (covered by AC1's markup assertion)

### themeToggleExistsInExactlyOneLocation

- **Verifies:** AC3
- **Precondition:** Full page render via `renderShell()` (topbar) and `renderSettingsPage()` (Settings page)
- **Action:** Search both rendered HTML strings for `.sw-theme-toggle`
- **Expected result:** `renderShell()`'s topbar output no longer contains `.sw-theme-toggle`; `renderSettingsPage()`'s Profile tab output contains exactly one instance
- **Edge case:** Yes — asserts absence from the old location, not just presence in the new one (a relocation that adds a second copy instead of moving it would still fail an "at least one" check but must fail this test)

### themeToggleClickFiresPostHogEvent

- **Verifies:** AC4
- **Precondition:** Injected `_posthog` spy via existing `set*` seam, no prior capture calls recorded
- **Action:** Trigger the relocated toggle's click handler
- **Expected result:** `_posthog.capture` called exactly once with the new event name (e.g. `settings_theme_toggle_clicked` — implementer names it; test asserts a real, non-empty, distinct string, not a specific literal, since the story's own AC4 left this to implementation)
- **Edge case:** No

---

## Integration Tests

None. This story has no cross-component seam beyond the existing `swToggleTheme()`/`localStorage` mechanism, which is reused unmodified.

---

## NFR Tests

### themeToggleRetainsAccessibilityAttributes

- **NFR addressed:** Accessibility
- **Measurement method:** String assertion on rendered markup
- **Pass threshold:** Relocated control retains `aria-label="Toggle dark mode"` and the same `:focus-visible` CSS class hooks as the original topbar markup
- **Tool:** `node tests/check-si-s1-theme-toggle-relocation.js`

### themeToggleRelocationNoPerformanceRegression

- **NFR addressed:** Performance
- **Measurement method:** Not a timed test — asserts no new client-side dependency or script tag was added
- **Pass threshold:** N/A — stated explicitly per NFR discipline: this NFR has no measurable automated threshold; confirmed by code review (no new `<script src>` added) rather than a timing assertion
- **Tool:** Manual code review at PR time

---

## Out of Scope for This Test Plan

- Visual regression / actual rendered colour verification — this story does not change the toggle's visual design, only its markup location; no CSS layout-dependent assertions apply.
- End-to-end browser test of the full page navigation flow — covered at a lower level (direct function calls against `renderShell`/`renderSettingsPage`/`renderProfileTab`), consistent with this codebase's existing test style for `settings.js`.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real click-rate data for the theme-toggle-relocation benefit metric | Only observable in production PostHog data, not in a pre-implementation test | AC4's test confirms the event *fires* correctly; the metric itself is measured post-release per the benefit-metric artefact's feedback loop, not by this test plan |
