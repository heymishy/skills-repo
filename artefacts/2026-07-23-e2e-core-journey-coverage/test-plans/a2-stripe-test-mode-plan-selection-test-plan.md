## Test Plan: Drive Stripe test-mode plan selection on real staging

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a2-stripe-test-mode-plan-selection.md
**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-a-new-user-journey-e2e-staging-auth-foundation.md
**Test plan author:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Successful test-mode checkout activates plan state | — | — | 1 test (CI-skipped, see gap) | 1 scenario | External-dependency | 🟡 |
| AC2 | Checkout redirect lands correctly, session stays authenticated | — | — | 1 test (CI-skipped, see gap) | 1 scenario | External-dependency | 🟡 |
| AC3 | Declined test card leaves plan state unchanged, shows decline message | — | — | 1 test (CI-skipped, see gap) | 1 scenario | External-dependency | 🟡 |

---

## Coverage gaps

**Updated 2026-07-23 (a2ccf-s1 corrected finding):** All three of AC1, AC2, and AC3's E2E tests exist and pass in a normal (non-CI) run, but are skipped via `test.skip()` specifically in the `scenario-a-staging-e2e` CI job. An earlier same-day revision of this table classified only AC2/AC3 this way, on the premise that AC1 (which verifies plan state via a fresh re-login/webhook check) does not re-drive the browser through Checkout. That premise was wrong — AC1's test body drives the identical real-browser Checkout submission as AC2/AC3 before its webhook-based assertion runs, and real network-trace evidence (AC1's own `1-trace.network` from CI run 29984917608) confirms it hits the identical hCaptcha stall. AC1 failed in all 4 real CI runs on this branch that reached test execution — there is no run in which it passed.

| Gap | AC | Gap type | Reason untestable in CI | Handling |
|-----|----|----|----------|---------|
| Stripe's hosted Checkout page (`checkout.stripe.com`) loads an invisible hCaptcha bot-detection challenge that blocks automated/headless browser traffic from completing the Checkout submission itself (not merely the post-checkout redirect). Real CI trace evidence (PR #565, run 29984917608, artifact `scenario-a-e2e-traces-29984917608`) shows the page stuck in ~20s of total network silence waiting on a CAPTCHA token, until each test's own timeout fires — confirmed for AC1's own browser page as well as AC2/AC3's. | AC1, AC2, AC3 | External-dependency | Stripe/hCaptcha's own third-party bot-detection is external to this repo's code and cannot be defeated or worked around appropriately (see `artefacts/2026-07-23-a2-stripe-ci-checkout-flake/decisions.md` for the full investigation, including ruled-out alternatives: worker concurrency and timeouts) | The automated E2E tests remain in the spec and run normally outside CI; a `test.skip()` guard scoped to `process.env.CI === 'true'` skips all three only in the CI job. The manual scenarios in `a2-stripe-test-mode-plan-selection-verification.md` (Scenarios 1, 2, and 3) are now the ONLY verification path for AC1/AC2/AC3 in the CI context — this story contributes zero automated CI-blocking signal; the Scenario A CI-blocking gate (`a5-ci-gate-scenario-a-blocking`) is A1 + A3 + A4 only. |

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

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1/AC2/AC3's automated E2E tests cannot complete in CI — Stripe's own hCaptcha bot-detection on hosted Checkout blocks automated/headless traffic at the checkout-submission step itself, which all three ACs depend on (see Coverage gaps above) | Third-party (Stripe/hCaptcha) platform behaviour, external to this repo's code | `test.skip()` scoped to `process.env.CI === 'true'` in the CI job only; manual verification via Scenarios 1/2/3 of the verification script; this story contributes no CI-blocking signal — the Scenario A gate is A1 + A3 + A4 only |
