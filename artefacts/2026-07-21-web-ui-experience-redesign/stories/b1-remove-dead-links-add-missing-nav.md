## Story: Remove dead nav links and add the missing Org board and Home List/Board toggle

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-b-navigation-fix.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **a tenant member using the app's left-hand navigation**,
I want **every nav item to lead somewhere real, and a way to reach the org-level kanban board**,
So that **I never click a nav item and land on a 404 or the catch-all login page, and I can reach every real view of my work without needing to know a URL by heart**.

## Benefit Linkage

**Metric moved:** Navigation dead-link rate
**How:** This story is the direct fix — removing the 3 confirmed-dead items and adding the confirmed-missing Org board entry takes the dead-link rate from 50% to 0%.

## Architecture Constraints

- Confirmed via code read: `Features`, `Actions`, `Status` routes were removed by `kbc-s1` (PR #506) — this story removes their corresponding `NAV_ITEMS` entries in `src/web-ui/utils/html-shell.js`, the same file `kbc-s1` should have swept but didn't (a real gap in that story's own AC5 dangling-reference check).
- `/dashboard?view=board` is a query-param variant of `/dashboard`, not a separate route — implemented as an inline toggle under the Home nav item, not a second top-level nav entry (confirmed design decision from this session's mockup).
- None additional identified — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** None
- **Downstream:** B2 (account-nav restructure + dangling-link test) builds on this story's cleaned-up `NAV_ITEMS` array.

## Acceptance Criteria

**AC1:** Given the current `NAV_ITEMS` array in `html-shell.js`, When this story ships, Then the `Features`, `Actions`, and `Status` entries no longer exist in the array.

**AC2:** Given a signed-in user viewing the sidebar, When they look under Home, Then a List/Board toggle is visible and switches between `/dashboard` and `/dashboard?view=board` without a full nav-item click.

**AC3:** Given a signed-in user viewing the sidebar, When they look at the main nav group, Then an "Org board" item is present linking to `/org/kanban`.

**AC4:** Given the sidebar after this story ships, When a user clicks every remaining nav item, Then each one resolves to a real, currently-registered route with an HTTP 200 (or the appropriate redirect for an unauthenticated session) — none returns 404 or falls through to the catch-all login page.

## Out of Scope

- Any change to how `/org/kanban` or `/dashboard?view=board` themselves render — this story only wires navigation to them, matching `kbc-s1`'s already-shipped rendering.
- Per-product kanban's nav placement (it correctly stays as a button on the product page, not the global sidebar).

## NFRs

- **Performance:** No measurable change — this is a static array edit, not a runtime computation.
- **Security:** None identified.
- **Accessibility:** The List/Board toggle is keyboard-operable and has a visible focus state.
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
