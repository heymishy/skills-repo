## Story: Style the admin credits page with the shared design system shell

**Epic reference:** None — short-track (bounded styling fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator's direct observation (2026-07-24) that `/admin/credits` is bare, unstyled HTML with no shared nav/shell, raised alongside the kanban board styling gap in the same conversation.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below.

## User Story

As **Hamish King (Founder/Operator, acting as the platform's sole admin)**,
I want **the admin credits page (`/admin/credits`) to use the same navigation shell and design-system tokens as the rest of the platform**,
So that **adjusting a tenant's credit balance doesn't require leaving the platform's visual language for a bare, unstyled HTML page with no way back except the browser's back button**.

## Benefit Linkage

**Metric moved:** None — pure short-track UX consistency fix, not tied to a Tier 1 product metric (no benefit-metric artefact exists for this short-track story, per CLAUDE.md's short-track convention). Benefit stated directly: closes a real, confirmed visual gap (operator's own observation) using an existing, already-proven pattern (`renderShell`), at low cost and low risk.

## Architecture Constraints

- **Reuse `renderShell()` verbatim** (`src/web-ui/utils/html-shell.js`, confirmed signature: `renderShell({ title, bodyContent, user, active, crumbs, headerActions, isAdmin, impersonation })`) — do not hand-roll a new page shell. This is the exact same pattern `kfd1` (2026-06-17) already used to style the feature/artefact detail pages, and the exact CSS custom-property token set the kanban-board redesign (this same session, `s2.1-shared-token-redesign`) uses.
- **`admin-credits.js`'s current implementation is 100% bare, hand-rolled HTML** (confirmed via direct code read, 2026-07-24): no `renderShell`, no `<style>`, no nav, no back-link — just a raw `<!DOCTYPE html>`/`<h1>`/`<table>`. This story replaces that hand-rolled markup with `renderShell`-wrapped output, keeping the exact same functional content (tenant ID / balance / adjust-form table) and the exact same CSRF-protected POST flow (`csrfField`, `csrfGuard` — untouched).
- **Do not change any of the underlying data/validation/audit logic** (`getAllTenantBalances`, `getValidTenantIds`, `adjustBalanceWithAudit`, CSRF handling) — this is a pure presentation-layer restyle, identical to `kfd1`'s own scope boundary for its detail-page work.
- **`isAdmin: true`** should be passed to `renderShell` so the nav can show the existing admin-only affordance pattern already established elsewhere in the shell (confirmed `renderShell`'s param list already supports this).

## Dependencies

- **Upstream:** None.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given an authenticated admin visiting `/admin/credits`, When the page renders, Then it is wrapped in `renderShell()` — the platform's shared navigation, header, and CSS custom-property tokens are present (not the current bare `<!DOCTYPE html>` with no shell).

**AC2:** Given the styled page, When the operator views the tenant balance table, Then every tenant ID, balance, and adjust-form control still displays and functions identically to today — same data, same fields, no functional regression.

**AC3:** Given the styled page's adjust form, When the operator submits a valid top-up amount for a valid tenant, Then the existing CSRF-protected POST flow (`csrfField`/`csrfGuard`) and `adjustBalanceWithAudit` call behave identically to today — this story does not touch that logic, verified by the existing tests for `adminCreditsPost` still passing unmodified.

**AC4:** Given the styled page, When the operator wants to return to the main dashboard, Then a clear navigation path back exists (via the shared shell's own nav, not a page-specific back-link) — unlike today, where there is none.

## Out of Scope

- Any change to `adminCreditsPost`'s validation, audit-logging, or CSRF logic — pure GET-page restyle only.
- A richer admin credits UI (search/filter/sort on the tenant table, bulk actions, pagination) — out of scope; this story is a visual restyle of the existing table, not a feature expansion.
- The `requireAdmin` middleware itself — untouched.

## NFRs

- **Performance:** Negligible — `renderShell` is already used platform-wide with no measurable overhead.
- **Security:** None new — CSRF/validation/audit logic untouched; `escapeHtml` usage on tenant IDs/balances preserved exactly as today.
- **Accessibility:** Improvement — inherits `renderShell`'s existing accessibility conventions (nav landmarks, focus states) that the current bare page has none of.
- **Audit:** Not applicable — no change to the audit-logging path (`adjustBalanceWithAudit`).

## Complexity Rating

**Rating:** 1 — well understood; wraps existing, unchanged functional content in an existing, already-proven shell function. No new logic, no new data flow.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — N/A (short-track, no epic); Low oversight per Complexity Rating 1 and no data/logic changes
