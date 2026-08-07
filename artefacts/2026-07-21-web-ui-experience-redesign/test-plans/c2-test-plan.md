## Test Plan: Billing tab — plan status and Stripe portal access

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/c2-billing-tab.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-c-account-settings-page.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Trial status shown clearly | 1 | 1 | — | — | — | 🟢 |
| AC2 | Active paid status shown, no trial messaging | 1 | — | — | — | — | 🟢 |
| AC3 | Past_due/canceled visually distinct | 1 | — | — | — | — | 🟢 |
| AC4 | Manage billing reaches existing Stripe portal redirect | — | 1 | — | — | — | 🟢 |
| AC5 | Upgrade reaches existing Stripe Checkout route | — | 1 | — | — | — | 🟢 |

## Coverage gaps

None.

## Test Data Strategy

**Source:** Mixed — synthetic `/billing/plan-state` response fixtures for each plan/status combination.
**PCI/sensitivity in scope:** No — this story reads only plan status metadata already returned by the existing endpoint, never raw payment data.
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC3 | Fixture plan-state responses: trial, active, past_due, canceled | Synthetic | None | |
| AC4, AC5 | Existing route behaviour, mocked at the boundary | Synthetic | None | |

### PCI / sensitivity constraints

None — no card data ever reaches this tab; Stripe's hosted portal/checkout handle all of that.

### Gaps

None.

---

## Unit Tests

### Trial plan renders a clear "Trial" status
- **Verifies:** AC1
- **Precondition:** Fixture plan-state: `{ plan: 'trial', trialEndsInDays: 9 }`
- **Action:** Render the Billing tab
- **Expected result:** HTML shows a "Trial" status pill and the days-remaining detail

### Active paid plan shows no trial messaging
- **Verifies:** AC2
- **Precondition:** Fixture plan-state: `{ plan: 'pro', status: 'active' }`
- **Action:** Render
- **Expected result:** HTML shows "active"/paid status; no "Trial" text anywhere

### Past_due status is visually distinct from active
- **Verifies:** AC3
- **Precondition:** Fixture plan-state: `{ plan: 'pro', status: 'past_due' }`
- **Action:** Render
- **Expected result:** HTML includes a warning-toned status pill with the text "Past due" — a different CSS class/color token than the active-status rendering

---

## Integration Tests

### Billing tab fetches from the real /billing/plan-state endpoint
- **Verifies:** AC1
- **Components involved:** Billing tab route, `handleGetBillingPlanState`
- **Precondition:** Mocked underlying data source returning a trial state
- **Action:** Request the Settings page
- **Expected result:** The rendered Billing tab reflects exactly what `/billing/plan-state` returns — no separate/duplicated plan-status computation

### Manage billing button's request reaches the existing portal-redirect route
- **Verifies:** AC4
- **Components involved:** Billing tab, `handleGetBillingPortal`
- **Precondition:** N/A
- **Action:** Simulate clicking "Manage billing"
- **Expected result:** Request goes to `/settings/billing`, which redirects to Stripe exactly as it does today (confirmed via existing `lab-s3.5` test coverage, not reimplemented)

### Upgrade button's request reaches the existing Checkout-session route
- **Verifies:** AC5
- **Components involved:** Billing tab, `handlePostCheckout`
- **Precondition:** Mocked Stripe client (matching `lab-s3.2`'s existing test convention)
- **Action:** Simulate clicking "Upgrade to Pro"
- **Expected result:** Request goes to `/billing/checkout`, reusing the existing session-creation logic unmodified

---

## NFR Tests

### No sensitive payment data rendered
- **NFR addressed:** Security
- **Measurement method:** Inspect the rendered HTML for any field beyond what `/billing/plan-state` already returns (plan, status)
- **Pass threshold:** Zero additional fields present — no card number, no raw Stripe customer ID exposed
- **Tool:** Unit test asserting rendered output only contains known-safe fields

---

## Out of Scope for This Test Plan

- New billing logic, webhook handling, or Checkout-session creation logic itself — all reused as-is from `lab-s3.2`/`lab-s3.5`.

## Test Gaps and Risks

None.
