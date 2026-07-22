## Test Plan: Drive Stripe test-mode plan selection on real staging

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a2-stripe-test-mode-plan-selection.md
**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-a-new-user-journey-e2e-staging-auth-foundation.md
**Test plan author:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Successful test-mode checkout activates plan state | — | — | 1 test | — | — | 🟢 |
| AC2 | Checkout redirect lands correctly, session stays authenticated | — | — | 1 test | — | — | 🟢 |
| AC3 | Declined test card leaves plan state unchanged, shows decline message | — | — | 1 test | — | — | 🟢 |

---

## Coverage gaps

None — all 3 ACs have an automated E2E test.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No — Stripe-documented test-mode card numbers only, never real card data
**Availability:** Available now (Stripe test-mode keys already provisioned per discovery `/clarify`)
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Stripe's documented successful test card number (e.g. `4242 4242 4242 4242`) | Fixtures (Stripe's own published test values) | None | Not a real card |
| AC2 | Same as AC1 | Fixtures | None | |
| AC3 | Stripe's documented decline test card number (e.g. `4000 0000 0000 0002`) | Fixtures (Stripe's own published test values) | None | Not a real card |

### PCI / sensitivity constraints

None — Stripe's own published test-mode card numbers are not real payment instruments and carry no PCI scope.

### Gaps

None.

---

## Unit Tests

None — this story's behaviour is inherently cross-system (real staging + real Stripe test-mode checkout), not a pure function/module in isolation.

---

## Integration Tests

None beyond what's covered by the E2E tests below — no non-browser seam requires separate coverage for this story.

---

## E2E Tests

### Successful Stripe test-mode checkout activates the tenant's plan

- **Verifies:** AC1
- **Precondition:** An authenticated staging user (from A1) with no active plan
- **Action:** Playwright spec navigates to plan selection, completes Stripe test-mode checkout with the successful test card
- **Expected result:** `GET /billing/plan-state` returns the selected plan as active for this tenant
- **Edge case:** No

### Checkout redirect returns to the expected page with an authenticated session

- **Verifies:** AC2
- **Precondition:** Same as AC1
- **Action:** Playwright spec follows the Stripe-hosted checkout redirect back to `wuce-staging`
- **Expected result:** The final page is the expected post-checkout page (not a generic error page), and a subsequent authenticated request succeeds (session cookie still valid)
- **Edge case:** No

### Declined test card leaves plan state unchanged and shows a decline message

- **Verifies:** AC3
- **Precondition:** An authenticated staging user with no active plan
- **Action:** Playwright spec attempts checkout using Stripe's documented decline test card
- **Expected result:** The UI displays a decline message, and `GET /billing/plan-state` still shows no active plan for this tenant (not silently marked active)
- **Edge case:** Yes — this is the story's one explicit negative-path AC

---

## NFR Tests

### None — confirmed with story owner

Performance and audit NFRs from the story ("no fixed threshold beyond Playwright's default action timeout" and "no audit beyond Stripe's own test-mode dashboard") do not require a distinct test — they are either bounded by the E2E test's own default timeout (no separate assertion needed) or explicitly out of scope for automated coverage. Security NFR (no real card data, no secrets in spec source) is enforced by code review at PR time, not a runtime test — no test card fixture in this plan is a real credential.

---

## Out of Scope for This Test Plan

- Every Stripe test-card scenario (3D Secure challenge, currency variations) — only the standard success path and one decline path are covered, per the story's own Out of Scope section
- Plan upgrade/downgrade/cancellation flows — not in this story's scope

---

## Test Gaps and Risks

None — no gaps identified for this story's test plan.
