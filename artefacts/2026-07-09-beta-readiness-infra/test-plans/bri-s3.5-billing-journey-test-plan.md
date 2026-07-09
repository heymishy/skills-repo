## Test Plan: Billing journey spec

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.5-billing-journey.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-3-test-suite.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

<!--
  Gap types:
    CSS-layout-dependent — relies on real browser rendering (drag-drop, getBoundingClientRect, CSS position)
    DOM-behaviour       — e2e-testable but not jsdom-compatible
    External-dependency — relies on third-party API/service unavailable in test
    Untestable-by-nature — inherently non-automatable (e.g. visual aesthetics, physical hardware)
-->

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Stripe test-mode checkout → plan reflects paid after mocked webhook | — | 1 | 1 | — | — | 🟢 |
| AC2 | Usage-limit pre-flight gate blocks with human-readable error | 1 | — | 1 | — | — | 🟢 |
| AC3 | Mocked payment-failure webhook → plan reflects failure state | — | 1 | 1 | — | — | 🟢 |
| AC4 | Mocked cancellation webhook → plan/usage gates reflect downgrade | — | 1 | 1 | — | — | 🟢 |
| AC5 | Spec tagged `@mocked`/`@billing`, no real Stripe API calls/charges | — | — | 1 | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Seeded staging database (bri-s2.4 synthetic tenants) + Stripe test-mode fixtures + mocked webhook payloads + S3.1's mock LLM gateway
**PCI/sensitivity in scope:** No — Stripe test mode uses no real payment instruments; test-mode card numbers are Stripe's own published synthetic values, not PCI-scoped
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A trial-plan tenant; a Stripe test-mode checkout session; a synthetic `checkout.session.completed` webhook payload | Stripe test mode + mocked webhook | None | Stripe test-mode keys only, per story's Security NFR |
| AC2 | A tenant at or over `MAX_JOURNEYS_PER_TENANT` | bri-s2.4 seed data or test setup | None | |
| AC3 | A synthetic payment-failure webhook payload | Mocked webhook | None | |
| AC4 | A paid-plan tenant; a synthetic cancellation/downgrade webhook payload | Mocked webhook | None | |
| AC5 | S3.1 mock gateway fixtures; Stripe test-mode keys | S3.1 fixtures + Stripe test mode | None | No real Stripe secret key or webhook signing secret ever used |

### PCI / sensitivity constraints

None — Stripe test mode is explicitly non-PCI-scoped; no real card data is ever present.

### Gaps

None.

---

## Unit Tests

### Usage-gate function blocks over-limit actions with a human-readable message

- **Verifies:** AC2.
- **Precondition:** A tenant's journey count at exactly `MAX_JOURNEYS_PER_TENANT`.
- **Action:** Call the pre-flight usage-gate function directly with an action that would exceed the limit.
- **Expected result:** The function returns a blocked result carrying a clear, human-readable error message — not a raw HTTP 402 with no explanation — consistent with the existing plan-limit fix (`f87bd515`). A call from a tenant under the limit is allowed through.
- **Edge case:** Yes — exactly-at-limit and one-under-limit are both exercised as boundary values.

---

## Integration Tests

### Mocked `checkout.session.completed` webhook upgrades tenant to paid

- **Verifies:** AC1.
- **Components involved:** Stripe webhook handler, tenant/session plan state store.
- **Precondition:** A trial-plan tenant; a synthetic `checkout.session.completed` payload shaped like Stripe's test-mode event.
- **Action:** Call the webhook handler directly with the synthetic payload (no browser, no real Stripe call).
- **Expected result:** The tenant's plan state is updated to paid immediately after processing; a subsequent session/tenant read reflects the paid plan.

### Mocked payment-failure webhook reflects failure state, not silently ignored

- **Verifies:** AC3.
- **Components involved:** Stripe webhook handler, tenant/session plan state store.
- **Precondition:** A paid or trial tenant; a synthetic payment-failure event payload.
- **Action:** Call the webhook handler directly with the synthetic failure payload.
- **Expected result:** The tenant's plan state reflects the failure appropriately (reverted to trial or flagged past-due) — a state read after processing must differ from the pre-event state; it must not remain unchanged (which would indicate the event was silently dropped).

### Mocked cancellation webhook downgrades plan and restricts usage gates

- **Verifies:** AC4.
- **Components involved:** Stripe webhook handler, tenant/session plan state store, usage-gate function.
- **Precondition:** A paid-plan tenant with usage above the trial-plan's limit; a synthetic cancellation webhook payload.
- **Action:** Call the webhook handler directly with the synthetic payload, then call the usage-gate function for an action that would be allowed under the paid plan but not the trial plan.
- **Expected result:** Tenant's plan state reflects the downgrade; the usage-gate function now blocks the action that the old (paid) plan would have allowed — access is restricted per the new plan, not left at the old plan's limits.

---

## E2E (Playwright — `tests/e2e/bri-s3.5-billing-journey.spec.js`, tagged `@mocked` `@billing`)

- **AC1:** Given a new tenant on a trial plan, When they complete the Stripe test-mode checkout flow to upgrade, Then their session/tenant reflects the paid plan immediately after the mocked `checkout.session.completed` webhook is processed.
- **AC2:** Given a tenant at their usage limit, When they attempt to exceed it through the browser UI, Then the pre-flight usage gate blocks the action with a clear, human-readable error visible in the UI, not a raw error page.
- **AC3:** Given a mocked Stripe payment-failure webhook is processed mid-session, When the user's session/plan state is inspected in the UI, Then it reflects the failure (reverted to trial or flagged past-due), not the prior paid state.
- **AC4:** Given a paid tenant downgrades or cancels, When the mocked cancellation webhook is processed, Then the UI reflects restricted access consistent with the new plan.
- **AC5:** Given the spec is tagged `@mocked` and `@billing`, When it runs on every PR, Then it uses S3.1's mock gateway and Stripe test-mode/mocked webhooks — zero real Stripe API calls or charges (asserted via a call-count spy on the real Stripe API client).

---

## NFR Tests

### `@mocked` suite runtime contribution

- **NFR addressed:** Performance
- **Measurement method:** Contributes to the shared under-10-minute `@mocked` suite budget (Metric 6).
- **Pass threshold:** N/A per-spec.
- **Tool:** CI suite timer (existing).

### No real Stripe secret key or webhook signing secret used in the `@mocked`/`@billing` CI variant

- **NFR addressed:** Security
- **Measurement method:** Configuration check confirming the CI environment sources Stripe test-mode keys (`sk_test_...`) and a test-mode webhook signing secret only, per discovery's staging env-var defaults — never a live key pattern.
- **Pass threshold:** Zero occurrences of a live-mode key pattern in CI configuration or environment for this spec.
- **Tool:** Hand-rolled `assert`-based Node script checking configured key prefixes.

### Accessibility

Not applicable beyond the app's existing bar — confirmed with story owner.

### Audit

None beyond standard CI logging — confirmed with story owner; Stripe's own test-mode dashboard provides supplementary visibility if needed.

---

## Out of Scope for This Test Plan

- Real Stripe webhook delivery testing (`@live`, pre-release only) — a smaller follow-on, not built here.
- Per-seat/usage-based billing — explicitly deferred in `2026-07-09-team-identity-roles`'s discovery.
- The mock LLM gateway's own internal logic — covered by S3.1's test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None identified | Stripe test mode and mocked webhooks give this story full coverage without any real external dependency in the `@mocked`/`@billing` variant | N/A |
