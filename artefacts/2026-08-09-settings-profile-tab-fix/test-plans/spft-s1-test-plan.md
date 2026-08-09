## Test Plan: Fix the Settings page's Profile tab so it actually renders instead of showing blank

**Story reference:** artefacts/2026-08-09-settings-profile-tab-fix/stories/spft-s1-settings-profile-tab-fix.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Profile content visible on initial render (single active div) | 2 tests | — | — | — | — | 🟢 |
| AC2 | Profile content visible after switching away and back (no orphaned outer wrapper) | 1 test | — | — | — | — | 🟢 |
| AC3 | Exactly one `tab-panel-profile` element, no `-wrap` sibling | 1 test | — | — | — | — | 🟢 |
| AC4 | Non-admin rendering unaffected | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. The bug and its fix are both pure server-rendered HTML string shape — fully unit-testable via direct string assertions on `renderSettingsPage`'s output, matching this file's own existing test style (`check-c1-settings-shell-and-profile-tab.js`).

AC2 (the "click away and back" regression) is testable statically: since the fix removes the outer wrapper entirely, there is no longer a separate element whose `--active` class can be lost independently of the inner content div — so asserting the single-div shape (AC3) is sufficient to prove AC2 can no longer regress. The test still asserts it directly (checking the JS behavior is unreachable-by-construction) rather than only asserting the shape, for clarity of intent.

---

## Test Data Strategy

**Source:** Direct function calls to `settings.renderSettingsPage({...})` / inspecting its output string — the established pattern in this file's own existing tests (`check-c1-settings-shell-and-profile-tab.js`).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1/AC3 | A minimal `{user, linkedSet, isAdmin: false}` opts object | Hand-authored, matching existing test style | None | |
| AC2 | Same as above — regression is proven by construction (no separable wrapper exists post-fix) | Hand-authored | None | |
| AC4 | Non-admin opts object (no Credits/Impersonate tabs) | Hand-authored, matching existing `testCreditsTabAdminOnly` pattern | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### renderSettingsPage_profileTabHasSingleActiveDiv_onInitialRender

- **Verifies:** AC1
- **Precondition:** `renderSettingsPage({ user: { login: 'kim' }, linkedSet: new Set(), isAdmin: false })`
- **Action:** Inspect the returned HTML string
- **Expected result:** The HTML contains exactly one element with `id="tab-panel-profile"` and that element's `class` attribute includes both `sw-tab-panel` and `sw-tab-panel--active` on the SAME element — not split across a wrapper and an inner div
- **Edge case:** No

### renderSettingsPage_profileContentPresentInHtml_onInitialRender

- **Verifies:** AC1 (content-visibility half)
- **Precondition:** `renderSettingsPage({ user: { login: 'kim' }, linkedSet: new Set(['github']), isAdmin: false })`
- **Action:** Inspect the returned HTML string
- **Expected result:** The identity card and "Sign-in methods" section title (from `renderProfileTab`) are present in the HTML AND appear inside the element carrying `sw-tab-panel--active` (i.e., not nested inside a non-active wrapper that a browser would hide) — asserted via confirming no `tab-panel-profile-wrap` id exists anywhere in the output (that id must be gone entirely post-fix)
- **Edge case:** No

### renderSettingsPage_noOrphanedWrapperElement_forProfileTab

- **Verifies:** AC2
- **Precondition:** Same render call as above
- **Action:** Search the HTML for the string `tab-panel-profile-wrap`
- **Expected result:** Zero occurrences — the outer wrapper div is removed entirely, so there is no separate element whose `--active` class could ever become orphaned by `swShowSettingsTab`'s remove-then-readd-by-id logic
- **Edge case:** Yes — this is the exact defect being fixed (previously, this id existed and never regained `--active` after any tab switch)

### renderSettingsPage_exactlyOneTabPanelProfileElement

- **Verifies:** AC3
- **Precondition:** Same render call
- **Action:** Count occurrences of `id="tab-panel-profile"` in the HTML
- **Expected result:** Exactly 1 (previously there were 0 — the real content div had this id but the CSS-relevant `--active` lived on a different, wrongly-named element)
- **Edge case:** No

### renderSettingsPage_nonAdminRenderingUnaffected

- **Verifies:** AC4
- **Precondition:** `renderSettingsPage({ user: { login: 'liam' }, linkedSet: new Set(), isAdmin: false })`
- **Action:** Inspect the returned HTML string
- **Expected result:** Profile tab renders correctly (single active div, per AC1/AC3 assertions repeated here), Billing tab button present, Credits/Impersonate tab buttons absent — matching the existing `testCreditsTabAdminOnly` non-admin assertions in `check-c1-settings-shell-and-profile-tab.js`, confirming this fix doesn't disturb that existing, already-tested behaviour
- **Edge case:** No — regression guard

---

## Integration Tests

None required — `renderSettingsPage` is a pure function over its opts and its own output string; no additional cross-module integration surface is introduced by this fix.

---

## NFR Tests

None beyond the ACs above — no new security, performance, or accessibility surface introduced by a markup-structure correction.

---

## Out of Scope for This Test Plan

- Any live-browser/DOM test of the tab-switching JS itself (`swShowSettingsTab`) actually toggling visibility in a real browser — unchanged by this fix, and this file's existing tests don't drive it in a browser either (same established limitation noted for other inline-script stories this session).
- Billing/Credits/Impersonate tab content — untouched, already covered by their own existing tests (`check-c2-billing-tab.js`, `check-c3-credits-tab-restyle.js`, `check-d3-impersonation-audit-log.js`).

---

## Test Gaps and Risks

None identified.
