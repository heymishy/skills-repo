## Story: Settings page shell with Profile tab

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-c-account-settings-page.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **a tenant member wanting to link a second sign-in method**,
I want **a real, styled Settings page showing my identity and linked sign-in methods, reachable from the sidebar**,
So that **I don't need to know the bare `/settings/link-account` URL by heart to manage how I sign in**.

## Benefit Linkage

**Metric moved:** Settings/account discoverability
**How:** This story is the page itself and its Profile tab — the first of the three orphaned capabilities to get a real, linked-to home.

## Architecture Constraints

- Must reuse `html-shell.js`'s `renderShell` — confirmed via code read that the current `handleGetLinkSettings` renders a bare, un-shelled `<!DOCTYPE html>` fragment; this story wraps the same underlying account-linking logic in the shared shell instead of replacing it.
- The existing `handleStartGoogleLink`/`handleStartGithubLink`/callback handlers in `account-linking.js` are reused as-is per discovery's Constraints — this story is presentation, not a rewrite of the linking logic.
- Tab structure (Profile / Billing / Credits-admin-only) established in this story's shell must be extensible for C2 and C3 without restructuring — build the tab container once, correctly, here.

## Dependencies

- **Upstream:** B2 (account nav restructure) — the sidebar's `Settings` link this story is reached from.
- **Downstream:** C2 (Billing tab) and C3 (Credits tab) both add tabs to the shell this story establishes.

## Acceptance Criteria

**AC1:** Given a signed-in user clicks `Settings` in the sidebar, When the page loads, Then it renders inside the shared shell (same header, sidebar, theme as the rest of the app) — not a bare unstyled fragment.

**AC2:** Given the Settings page, When it loads, Then the Profile tab shows the signed-in user's identity (avatar, login, which provider they signed in via) and a list of sign-in methods with their linked/not-linked status.

**AC3:** Given a user with only GitHub linked, When they click "Link Google account", Then they are taken through the existing `handleStartGoogleLink` OAuth flow, and on successful return, the Profile tab shows Google as linked without a full page reload feeling jarring (a redirect-and-refresh is acceptable; a broken or silently-failing link attempt is not).

**AC4:** Given a user who already has both GitHub and Google linked, When they view the Profile tab, Then both show as linked, and there is no "Link" action offered for either (since unlinking is out of scope, but re-offering to link an already-linked provider would be a confusing dead-end control).

## Out of Scope

- Billing and Credits tabs — C2 and C3 respectively; this story only builds the shell and Profile tab.
- Unlinking a sign-in method — confirmed out of scope at the epic level.

## NFRs

- **Performance:** Page loads within the same budget as other shell-wrapped pages in this app (no new performance concern beyond existing shell rendering).
- **Security:** Reuses existing CSRF-protected OAuth state handling already present in `account-linking.js` — no new auth logic introduced.
- **Accessibility:** Tab controls are keyboard-navigable (arrow keys or tab order) and have visible focus states, matching the shared shell's existing conventions.
- **Audit:** None identified — account-linking already has its own audit logging per the existing `tir-s2` story; this story doesn't change that.

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
