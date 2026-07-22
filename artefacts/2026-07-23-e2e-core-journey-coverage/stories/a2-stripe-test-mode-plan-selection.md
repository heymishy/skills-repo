## Story: Drive Stripe test-mode plan selection on real staging

**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-a-new-user-journey-e2e-staging-auth-foundation.md
**Discovery reference:** artefacts/2026-07-23-e2e-core-journey-coverage/discovery.md
**Benefit-metric reference:** artefacts/2026-07-23-e2e-core-journey-coverage/benefit-metric.md

## User Story

As a **Hamish King (Founder/Operator)**,
I want to **verify that a newly signed-up user can select a plan against the real Stripe test-mode environment using a Stripe test card, entirely on real staging**,
So that **a regression in billing/plan-selection wiring — the exact class of bug this session shipped undetected — is caught by CI before merge, moving the E2E CI gate metric (m1) toward its target**.

## Benefit Linkage

**Metric moved:** E2E CI gate on core signup/billing/creation journeys (m1)
**How:** Plan selection against real Stripe test-mode is one of the concrete steps named in Scenario A; without an automated assertion here, a broken Stripe webhook, redirect, or plan-state write would only be caught by the operator manually clicking through billing again, exactly the failure mode this whole feature exists to close.

## Architecture Constraints

- None identified beyond A1's staging-auth-stub dependency — checked against `.github/architecture-guardrails.md`.
- Uses this repo's real Stripe test-mode keys (confirmed already provisioned; operator supplies the specific test key/card values at implementation time per the discovery `/clarify` resolution) — never live Stripe keys.

## Dependencies

- **Upstream:** A1 (staging-safe auth stub) — this story's user must already be authenticated on staging before plan selection can be exercised.
- **Downstream:** A3 (product/feature creation) assumes an active, paid-or-trial plan state exists on the user's tenant.

## Acceptance Criteria

**AC1:** Given a freshly authenticated staging user (via A1's stub), When the spec navigates to plan selection and completes checkout using a Stripe test-mode card number, Then the tenant's plan state (as returned by `/billing/plan-state`) reflects the selected plan as active.

**AC2:** Given the same flow, When the Stripe test-mode checkout redirects back to `wuce-staging`, Then the redirect lands on the expected post-checkout page (not an error page) and the session remains authenticated.

**AC3:** Given a Stripe test-mode card that is deliberately declined (Stripe's documented decline test card number), When checkout is attempted, Then the UI surfaces a clear decline message and the tenant's plan state remains unchanged (not silently marked active).

## Out of Scope

- Testing every Stripe test-card scenario (3D Secure challenge flows, currency variations) — only the standard success path (AC1/AC2) and one decline path (AC3)
- Real (live-mode) Stripe billing — test-mode only, per discovery's Constraints section
- Plan upgrade/downgrade/cancellation flows post-initial-selection — out of scope for this MVP

## NFRs

- **Performance:** Stripe checkout redirect round-trip completes within Stripe's own test-mode latency plus staging network overhead — no fixed threshold beyond "does not time out the Playwright default action timeout."
- **Security:** No real card data is ever used — Stripe-documented test card numbers only; no card data or Stripe secret keys appear in spec source, logs, or committed artefacts.
- **Accessibility:** Not applicable — this story is test infrastructure, not user-facing UI.
- **Audit:** None identified beyond what Stripe's own test-mode dashboard already records.

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
