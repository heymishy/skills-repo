## Story: Billing journey spec

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-3-test-suite.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As a **first beta customer**,
I want the trial→paid upgrade, usage-gate enforcement, and downgrade/cancellation flows to be protected by deterministic coverage,
So that a billing bug — which directly costs the business money and trust — doesn't reach production the same way the recent GitHub-OAuth-first-login and plan-limit bugs did.

## Benefit Linkage

**Metric moved:** Metric 4 — Risk-critical journeys have deterministic E2E coverage
**How:** Closes 1 of the 5 required journeys — specifically the one this session's own history shows is the most bug-prone (2 billing fixes shipped directly to prod in the days before this discovery).

## Architecture Constraints

- ADR-018: browser-driven Playwright spec, `@billing` tag (plus `@mocked` for the CI-fast variant).
- Stripe test mode is used for all `@mocked`/`@billing` runs — no real Stripe charges ever occur in CI (per discovery's "Stripe test mode" env-var default for staging).
- Webhook events are mocked (synthetic `checkout.session.completed`, payment-failure events), not sourced from a live Stripe webhook.

## Dependencies

- **Upstream:** S3.1 (mock LLM gateway) for the `@mocked` variant (billing flows still touch skill sessions for usage gating).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a new tenant on a trial plan, When they complete the Stripe test-mode checkout flow to upgrade to a paid plan, Then their session/tenant reflects the paid plan immediately after the (mocked) `checkout.session.completed` webhook is processed.

**AC2:** Given a tenant reaches their usage limit (e.g. `MAX_JOURNEYS_PER_TENANT` or the equivalent gate), When they attempt to exceed it, Then the pre-flight usage gate blocks the action with a clear, human-readable error — not a raw 402 with no explanation, consistent with the existing plan-limit fix (`f87bd515`).

**AC3:** Given a mocked Stripe webhook failure event (e.g. a failed payment), When it's processed, Then the tenant's plan state reflects the failure appropriately (e.g. reverted to trial or flagged past-due) — not silently ignored.

**AC4:** Given a paid tenant downgrades or cancels, When the (mocked) cancellation webhook is processed, Then their plan state and usage gates reflect the downgrade — access is restricted per the new plan, not left at the old plan's limits.

**AC5:** Given this spec is tagged `@mocked` and `@billing`, When it runs on every PR, Then it uses S3.1's mock gateway and Stripe test-mode/mocked webhooks — no real Stripe API calls or charges.

## Out of Scope

- Real Stripe webhook delivery testing (`@live`, pre-release only) — this story covers the `@mocked`/`@billing` per-PR variant; a smaller `@live` counterpart hitting Stripe's actual test-mode API is a follow-on, not built here.
- Per-seat/usage-based billing — explicitly deferred in `2026-07-09-team-identity-roles`'s discovery; this spec covers the existing single-plan-per-tenant model only.

## NFRs

- **Performance:** Contributes to the shared under-10-minute `@mocked` suite budget.
- **Security:** No real Stripe secret key or webhook signing secret is ever used in the `@mocked`/`@billing` CI variant — test-mode keys only, sourced from staging secrets (per discovery Constraints).
- **Accessibility:** Not applicable beyond the app's existing bar.
- **Audit:** None beyond standard CI logging; Stripe's own test-mode dashboard provides supplementary visibility if needed.

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
