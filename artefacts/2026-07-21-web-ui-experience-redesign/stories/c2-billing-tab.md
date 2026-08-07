## Story: Billing tab — plan status and Stripe portal access

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-c-account-settings-page.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **a tenant member wanting to check or manage their plan**,
I want **to see my current plan status inside Settings and reach Stripe's billing portal from there**,
So that **I don't have to remember that `/settings/billing` silently redirects out to Stripe with zero in-app context first**.

## Benefit Linkage

**Metric moved:** Settings/account discoverability
**How:** Adds the second of three orphaned capabilities to the real, linked-to Settings page.

## Architecture Constraints

- Reuses the existing `/billing/plan-state` (GET, JSON), `/settings/billing` (redirect to Stripe portal), and `/billing/checkout` (POST, Stripe Checkout session creation — shipped by `lab-s3.2`) routes as-is per discovery's Constraints — this story is presentation only.
- No new Stripe API calls or webhook handling — this story reads the existing plan-state response and calls the two existing routes above, nothing more.

## Dependencies

- **Upstream:** C1 (Settings shell) — this story adds a tab to the shell C1 establishes.
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a user on a trial plan, When they open the Billing tab, Then it shows "Trial" as a clear visual status (not just plain text) alongside plan details fetched from `/billing/plan-state`.

**AC2:** Given a user on a paid plan with status `active`, When they open the Billing tab, Then it shows their plan as active with no trial messaging.

**AC3:** Given a user on a paid plan with status `past_due` or `canceled`, When they open the Billing tab, Then the status is visually distinct from `active` (e.g. a warning-toned indicator), so a billing problem is noticeable, not buried in plain text identical to the healthy state.

**AC4:** Given any user, When they click "Manage billing", Then they are taken to the existing `/settings/billing` route, which redirects to Stripe's hosted portal exactly as it does today — this story adds a discoverable entry point, it does not change the redirect behaviour itself.

**AC5:** Given a user on a trial plan, When they click "Upgrade to Pro", Then they are taken through the existing `/billing/checkout` route (Stripe Checkout session creation, already shipped by `lab-s3.2`) — this story wires an existing capability into a discoverable button, it does not build new checkout logic.

## Out of Scope

- Any new billing logic, plan-change flow, or Stripe webhook handling — this story is a read-and-link-out surface over existing routes.
- Building a new Stripe Checkout session creation mechanism — `/billing/checkout` already exists (`lab-s3.2`) and is reused as-is per AC5, resolved at /definition rather than deferred to DoR.

## NFRs

- **Performance:** Plan-state fetch and render completes within 1 second under normal conditions.
- **Security:** No plan or payment data is rendered that isn't already returned by the existing `/billing/plan-state` endpoint — this story does not expose any new sensitive field.
- **Accessibility:** Status indicators use both colour and a text label (e.g. "Past due", not colour alone), matching this session's established accessibility convention.
- **Audit:** None identified — Stripe's own systems are the audit source of truth for billing events; this story doesn't duplicate that.

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
