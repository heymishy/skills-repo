## Story: Give admins a real control to lift a tenant's journey cap, separate from credits

**Epic reference:** None — short-track (bug/small fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported pattern below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **admin (`ADMIN_GITHUB_LOGINS`) managing a tenant during testing or support**,
I want **a real control to lift a tenant's journey cap, distinct from adjusting their credits balance**,
So that **I don't have to run a real Stripe checkout just to unblock a tenant during testing, and I don't mistakenly believe topping up credits already does this**.

## Benefit Linkage

**Metric moved:** Operator/admin unblock time for the journey-cap gate (operational efficiency, not a formal benefit-metric artefact — short-track).
**How:** Confirmed live against `wuce-staging` (2026-08-06): `checkJourneyCap()` (`src/web-ui/modules/tenant-plan.js`) only lifts the 5-journey cap when a tenant's `tenant_plan` row shows `plan: 'paid', status: 'active'` — set *only* by a real Stripe `checkout.session.completed` webhook. Admin credit top-ups (`/admin/credits`) call `adjustBalanceWithAudit()`, which never touches `tenant_plan`. An admin has no way to lift the cap short of running a real (even test-mode) Stripe checkout. Giving admins a direct plan-state control removes that dead end.

## Architecture Constraints

- **ADR-025** (Multi-tenancy, application-layer `tenant_id` scoping): the new control reads/writes the same `tenant_plan` table, scoped by `tenant_id`, that `checkJourneyCap`/`setPlanState` already use — no new isolation mechanism.
- Reuses `src/web-ui/modules/tenant-plan.js`'s existing `setPlanState(tenantId, plan, status)` function directly — this story adds a UI/route entry point to an already-existing, already-tested function, not new plan-state logic.
- Mirrors `admin-credits.js`'s existing `requireAdmin`-gated route/form pattern — no new admin-authorization mechanism.

## Dependencies

- **Upstream:** None — `setPlanState`, `checkJourneyCap`, and the `tenant_plan` table already exist and are in production use (`jlc-s1`, `bri-s3.5`).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given an admin visits `/admin/credits` for a tenant, When the page renders, Then it shows that tenant's current plan (`trial`/`paid`) and status (`active`/`past_due`/`canceled`) alongside the existing credits balance, as two visibly distinct fields — not implying they're the same thing.

**AC2:** Given an admin submits the new plan-state control setting a tenant to `paid`/`active`, When that tenant next attempts to create a journey beyond their previous cap, Then the request succeeds — `checkJourneyCap` returns `{allowed: true, cap: null}` for that tenant, exactly as it already does for a real paid Stripe customer.

**AC3:** Given an admin adjusts a tenant's credits balance only (existing `/admin/credits` flow, unchanged), When that tenant's plan is still `trial`/non-`active`, Then the journey cap is NOT lifted and the existing "Journey limit reached" message is shown — confirming credits and plan remain intentionally distinct, not silently conflated by this story.

**AC4:** Given the "Journey limit reached" error page (`routes/journey.js`, `routes/products.js`), When an operator or admin views it, Then the page body contains the word "plan" and does not imply credits as the cause (e.g. reads "This limit is tied to your plan, not your credits balance — contact the operator to increase it"), so this exact confusion isn't repeated.

## Out of Scope

- **Any change to the credits system itself** (`adjustBalanceWithAudit`, `/admin/credits`'s existing form) — this story only adds a separate, adjacent control, never conflates the two systems.
- **A self-serve (non-admin) way to change plan state** — plan changes for real paying customers still only happen via real Stripe checkout; this control is admin/testing-only, mirroring `admin-credits.js`'s own scope.
- **Retroactively fixing already-confused operators' mental models** beyond the one error-message clarification in AC4 — no broader onboarding/help content is in scope.

## NFRs

- **Performance:** The new plan-state read/write is a single-row query against `tenant_plan`, matching `setPlanState`/`getPlanState`'s existing cost — no new N+1 or added latency of note.
- **Security:** Gated by the same `requireAdmin` live role check `/admin/credits` already uses — no new authorization mechanism, no new attack surface.
- **Accessibility:** WCAG 2.1 AA hard floor for the new form control, matching the existing `/admin/credits` page's accessibility baseline.
- **Audit:** The plan-state change is logged with the admin's identity, mirroring `adjustBalanceWithAudit`'s existing audit-trail pattern for credit adjustments (never `req.session.accessToken`, per `arl-s5`'s established convention).

## Complexity Rating

**Rating:** 1 — well understood, reuses existing, already-tested functions (`setPlanState`, `checkJourneyCap`) and an existing page's established pattern (`admin-credits.js`); only new work is a small UI addition and one route handler.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
