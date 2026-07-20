## Story: Credits tab — restyle admin credit management into the shared design system

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-c-account-settings-page.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **Hamish King (Founder/Operator, in the platform-admin capacity)**,
I want **the existing tenant credit-balance table and top-up action inside the shared Settings page, styled consistently with the rest of the app**,
So that **I don't have to navigate to a bare, unstyled `/admin/credits` page separately from everything else I manage**.

## Benefit Linkage

**Metric moved:** Settings/account discoverability
**How:** Completes the third of three orphaned capabilities inside the real Settings page, and — being admin-only — is the direct link between Epic C and Epic B's admin-gated nav visibility.

## Architecture Constraints

- Reuses `adminCreditsGet`/`adminCreditsPost` (`admin-credits.js`) exactly as-is per discovery's Constraints — this story restyles the existing table and form, it does not change balance-adjustment behaviour, add a deduct capability, or alter the existing CSRF-token handling (`sec-perf-s3`'s `generateCsrfToken`/`csrfField`).
- Visibility gated by the same live `requireAdmin` check the underlying route already enforces (matching B2's nav-visibility approach) — the tab must not render its content client-side before the server confirms admin access.

## Dependencies

- **Upstream:** C1 (Settings shell) for the tab container; B2 (admin-only nav visibility pattern) for consistent admin-gating logic.
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a signed-in admin user, When they open Settings, Then a Credits tab is visible, showing the same tenant balance table `adminCreditsGet` already returns, restyled into the shared design system (not the current bare HTML table).

**AC2:** Given a signed-in non-admin user, When they open Settings, Then no Credits tab is visible at all — not a disabled/greyed-out tab, an absent one, matching this repo's existing admin-gating convention elsewhere.

**AC3:** Given an admin on the Credits tab, When they submit a top-up amount for a tenant via the restyled form, Then the request reaches `adminCreditsPost` with the same CSRF token and payload shape the existing bare-HTML form already sends — the restyle does not change the request contract.

**AC4:** Given an admin submits an invalid amount (e.g. zero, negative, or non-numeric) via the restyled form, When the existing server-side validation in `adminCreditsPost` rejects it, Then the restyled UI surfaces the same rejection clearly (not silently swallowing the error the old bare-HTML form may have simply displayed as raw JSON).

## Out of Scope

- Adding a deduct-credits capability — the existing `adminCreditsPost` route is add/top-up only; this story does not add new balance-adjustment logic.
- A tiered admin/reviewer permission model for credits — this repo has one admin role, not multiple tiers.

## NFRs

- **Performance:** No measurable change — same underlying queries, only the rendering layer changes.
- **Security:** The CSRF token flow (`sec-perf-s3`) must be preserved exactly — this is the single most security-relevant existing behaviour in this story's scope, and a restyle must not accidentally drop or mis-wire the hidden CSRF field.
- **Accessibility:** Table and form controls are keyboard-operable, matching the shared shell's existing table conventions (e.g. the product-view coverage table from this same session's earlier work).
- **Audit:** Existing credit-adjustment audit logging (if any exists in `adminCreditsPost`) is preserved unchanged — this story does not add or remove audit behaviour.

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
