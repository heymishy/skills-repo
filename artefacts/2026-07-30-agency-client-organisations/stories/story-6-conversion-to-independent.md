## Story: Client org self-service conversion to an independent paying account

**Epic reference:** artefacts/2026-07-30-agency-client-organisations/epics/agency-client-organisations.md
**Discovery reference:** artefacts/2026-07-30-agency-client-organisations/discovery.md
**Benefit-metric reference:** artefacts/2026-07-30-agency-client-organisations/benefit-metric.md
**Domain:** [payments, web-ui]

## User Story

As a **Client org member**,
I want to **convert my Client organisation into a fully independent, paying standalone account at my own initiative, keeping all my existing data**,
So that **I'm never locked into depending on the agency that originally set up my account if I want to become a direct customer**.

## Benefit Linkage

**Metric moved:** Agency-led client provisioning (indirectly — a credible "no lock-in" story makes agencies and their clients more willing to adopt the Agency/Client model in the first place, since a Client isn't trapped)
**How:** This story does not directly move either defined Tier 1 metric's measurement, but it removes a real adoption objection (being permanently dependent on an agency) that could otherwise suppress Metric 1 (agencies and clients may be reluctant to start the relationship at all without an exit path). Recorded here transparently rather than overstating a direct metric link.

## Architecture Constraints

- **ADR-025 (Multi-tenancy enforced at the application layer):** conversion is a single `org_type` update (`client` → `standalone`) on the existing `organisations` row — no new tenant boundary or infrastructure change, consistent with the existing application-layer scoping model.
- Per `decisions.md`'s logged decision: conversion must retain the same `org_id` and all existing data — never a second, brand-new org requiring data migration. This is a hard constraint on implementation, not a preference.
- Conversion triggers the *existing* Stripe checkout mechanism (`routes/billing.js`'s existing `createCheckoutSession` flow) — no new billing/payment code is introduced; only a new trigger path into it.
- **ARCH decision 2026-07-31 (see `decisions.md`, role-model entry):** AC1's "appropriate permissions" precondition is the existing `team_memberships.role === 'admin'` check (the same `requireAdmin`-equivalent pattern already used elsewhere in this codebase — `middleware/require-admin.js`, `resolveRoleForPerson`), evaluated against the Client org's own `tenant_id`. This is satisfied by the first invited user of that Client org, per Story 3 AC3, and reuses the existing role model rather than introducing a new one (ADR-026).

## Dependencies

- **Upstream:** Story 1 (organisation entity) and Story 3 (a Client org must exist to convert) must be complete.
- **Downstream:** None within this epic.

## Acceptance Criteria

**AC1:** Given a Client-org user whose `team_memberships.role` is `'admin'` for that org's own `tenant_id` (the existing role model, see Architecture Constraints — satisfied by the org's first invited user per Story 3 AC3) initiates "Convert to independent account," When they confirm the conversion, Then the organisation's `org_type` is updated from `client` to `standalone` in place — the same `org_id` row, with all existing products/journeys/artefacts still attached to that same `org_id`. A Client-org user whose role is not `'admin'` cannot trigger this action (403).

**AC2:** Given a Client org has just converted to `standalone`, When the conversion completes, Then the organisation is redirected into the existing Stripe checkout flow (the same one every new `standalone` signup uses) to establish its own independent billing.

**AC3:** Given a Client org converts to `standalone`, When the conversion completes, Then its existing Agency relationship(s) (from Story 2) and any previously-granted shared-access grants remain unchanged and continue to function exactly as before conversion — conversion adds independent billing/ownership, it does not sever existing agency relationships.

**AC4:** Given a Client org attempts to convert while an Agency-initiated action is concurrently in flight (e.g. a grant is being created at the same moment), When the conversion transaction runs, Then the `org_type` update and any concurrent grant operations do not corrupt each other's data — this is tested with a concurrency test, not just a manual check.

## Out of Scope

- Any change to the billing model itself (who pays, per-org vs. per-relationship pricing) — deferred to the follow-up billing-model-redesign discovery named in discovery.md. This story only adds a new trigger path into the existing, unchanged checkout mechanism.
- Reverting a conversion (converting a `standalone` org back to `client`) — not built; conversion is one-directional in this MVP.
- Any change to which Agency relationships a converted org has — conversion does not modify relationships, only `org_type` and billing status.

## NFRs

- **Performance:** Not a high-throughput path — conversion is a rare, deliberate user action, no specific latency target beyond this codebase's existing page-load norms.
- **Security:** Only a user with `team_memberships.role === 'admin'` on the Client org (not just any Client-org read-only viewer) can trigger conversion — this is a consequential, billing-affecting action and must not be triggerable by every account. Server-side check only, matching this codebase's existing convention that a client-side-only restriction is not a valid security boundary (see Story 3's AC2 for the same convention applied to org-type checks).
- **Accessibility:** Conversion flow uses real `<form>`/confirmation UI, keyboard-navigable.
- **Audit:** Conversion is logged with the converting `org_id`, the initiating user, and timestamp — this is a significant lifecycle event and should be as auditable as product creation or deletion elsewhere in this codebase.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
