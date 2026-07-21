## Story: Restructure account-level nav items and add a dangling-link regression test

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-b-navigation-fix.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **a tenant member (or, for the admin-only item, Hamish King as platform admin)**,
I want **Settings, and — if I'm an admin — Admin credits, placed near my identity at the bottom of the sidebar rather than mixed into the main product nav**,
So that **account-level actions are visually distinct from product-level navigation, matching how I actually think about them**.

## Benefit Linkage

**Metric moved:** Navigation dead-link rate (structurally enforced going forward) and Settings/account discoverability (this story is what makes Settings reachable from the sidebar at all — see Epic C)
**How:** This story adds the structural test that prevents the exact class of regression (`kbc-s1` removing routes without sweeping the nav) from recurring, and places the Settings/Admin entry point Epic C's page needs.

## Architecture Constraints

- Admin-only visibility (`Admin credits`) must be gated the same way the route itself already is — via the live `requireAdmin` role check, not a client-side-only visibility toggle that could be bypassed.
- None additional identified — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** B1 must be complete — this story assumes the dead links are already removed before adding the regression test.
- **Downstream:** C1 (Settings page shell) needs this story's `Settings` nav entry to link to it.

## Acceptance Criteria

**AC1:** Given the sidebar's bottom section, When a signed-in non-admin user views it, Then they see a `Settings` link and their identity block (avatar, login, sign out) — no `Admin credits` link.

**AC2:** Given the sidebar's bottom section, When a signed-in admin user views it, Then they additionally see an `Admin credits` link, gated on the same live role check `requireAdmin` already performs on the route itself (not a stale cached role from session start).

**AC3:** Given the full `NAV_ITEMS` array (including any items added by future stories), When a new automated test runs, Then it asserts every entry's `href` resolves to a route currently registered in `server.js`'s dispatch chain — this test fails loudly if a future story repeats `kbc-s1`'s gap (removing a route without sweeping the nav).

**AC4:** Given the same regression test, When run against the CURRENT (pre-fix) `NAV_ITEMS` array containing `Features`/`Actions`/`Status`, Then it fails — confirming the test actually catches the exact class of bug this story fixes, not just a shape it happens to pass.

## Out of Scope

- The actual content of the Settings page — that is Epic C.
- Any change to `requireAdmin`'s own logic — this story only consumes its existing live-role-check behaviour for nav visibility, it does not modify the admin-check mechanism itself.

## NFRs

- **Performance:** No measurable change.
- **Security:** Admin-only nav visibility must not be spoofable via client-side manipulation — the underlying `/admin/credits` route's own `requireAdmin` gate is the actual security boundary; the nav item's visibility is a UX convenience, not a security control, and must be documented as such.
- **Accessibility:** No change to existing keyboard/focus behaviour.
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
