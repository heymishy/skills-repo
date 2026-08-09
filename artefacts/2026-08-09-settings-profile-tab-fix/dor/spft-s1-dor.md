## Definition of Ready: spft-s1 — Fix the Settings page's Profile tab so it actually renders instead of showing blank

**Story:** artefacts/2026-08-09-settings-profile-tab-fix/stories/spft-s1-settings-profile-tab-fix.md
**Review artefact:** artefacts/2026-08-09-settings-profile-tab-fix/review/spft-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-09-settings-profile-tab-fix/test-plans/spft-s1-test-plan.md
**Date:** 2026-08-09

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/routes/settings.js` — `renderSettingsPage`: remove the outer `<div class="sw-tab-panel sw-tab-panel--active" id="tab-panel-profile-wrap">` wrapper; give `renderProfileTab`'s own returned div (`id="tab-panel-profile"`) the `sw-tab-panel--active` class directly, matching Billing/Credits/Impersonate's single-div shape exactly.
- `tests/check-spft-s1-*.js` (new) — unit tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `renderProfileTab` itself — its returned div's `id`/`role`/`aria-labelledby` attributes and all its content stay exactly as they are; only `renderSettingsPage`'s wrapping of that return value changes.
- `_TAB_CSS` / `_TAB_JS` (`swShowSettingsTab`) — already correct; the bug is purely in the markup shape `renderSettingsPage` produces.
- `renderBillingTab`, `renderCreditsTab`, `renderImpersonationAuditTab` — untouched, already correctly single-div-shaped.

### Architecture Constraints

No new architectural decision — this converges Profile's markup onto the same single-div-per-panel shape every other tab already uses. No ADR required.

### Human oversight

**Low** — a one-line structural correction (delete a redundant wrapping div, move a class onto the div that should have had it) to a precisely identified, code-confirmed defect, following an already-proven-correct pattern sitting in the same function.

### Coding Agent Instructions

1. In `renderSettingsPage` (~line 400-407 of `src/web-ui/routes/settings.js`), replace:
   ```javascript
   '<div class="sw-tab-panel sw-tab-panel--active" id="tab-panel-profile-wrap">' +
     renderProfileTab(user, linkedSet) +
   '</div>' +
   ```
   with simply:
   ```javascript
   renderProfileTab(user, linkedSet) +
   ```
2. In `renderProfileTab` (~line 88 of the same file), change the outer div it returns from:
   ```javascript
   '<div id="tab-panel-profile" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-profile">'
   ```
   to:
   ```javascript
   '<div id="tab-panel-profile" class="sw-tab-panel sw-tab-panel--active" role="tabpanel" aria-labelledby="tab-profile">'
   ```
   This matches exactly how Billing's own panel div is written (`id="tab-panel-billing" class="sw-tab-panel"` — Billing does NOT get `--active` by default since it's not the initial tab; Profile's div needs `--active` baked in since it IS the initial/default tab).
3. Write the tests per the test plan, using the established `freshRequire(SETTINGS_PATH)` / `settings.renderSettingsPage({...})` pattern from `tests/check-c1-settings-shell-and-profile-tab.js`.
4. Re-run `tests/check-c1-settings-shell-and-profile-tab.js`, `tests/check-c2-billing-tab.js`, `tests/check-c3-credits-tab-restyle.js`, and `tests/check-d3-impersonation-audit-log.js` directly to confirm zero regression to the other three tabs or the admin/non-admin gating.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — all ACs assert on server-rendered HTML string shape, not rendered layout)

**PROCEED: Yes**
