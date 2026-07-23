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

## Coding Agent Instructions — AC1/AC2/AC3 CI classification (a2ccf-s1 corrected finding, 2026-07-23)

**This supersedes an earlier same-day revision of this note that reclassified only AC2/AC3.** All three of this story's ACs — AC1, AC2, AND AC3 — are reclassified as **manual-verification-only in CI**. They remain real, valid, in-scope requirements — this reclassification changes only which verification path counts as the automated CI-blocking signal, not the ACs themselves.

**Reason:** AC1, AC2, and AC3 all drive a real browser through Stripe's hosted Checkout page (`checkout.stripe.com`) and submit the checkout form there — AC1's test body calls the same `goToCheckoutAndFillCard()` helper and clicks the same submit button as AC2/AC3, before its webhook-based plan-state assertion runs. Real network trace evidence, downloaded from a real CI run (PR #565, run 29984917608, artifact `scenario-a-e2e-traces-29984917608`), conclusively shows Stripe's hosted Checkout page loads an invisible hCaptcha challenge (`hcaptcha-invisible`, requests to `api.hcaptcha.com/getcaptcha/24ed0064-...`) as part of Stripe's own bot/fraud-detection layer, gating the checkout submission step itself — not merely the post-checkout browser redirect that only AC2/AC3 depend on. This was confirmed directly for AC1 specifically by examining AC1's own browser-page network trace (`1-trace.network`, not the API-only `0-trace.network`) from the same run 29984917608: the identical hcaptcha-invisible / api.hcaptcha.com sequence, then the same stall — the checkout submission never completes, so no webhook ever fires and `GET /billing/plan-state` correctly never flips to "paid." This is also consistent with all 4 real CI runs on this branch that reached test execution (29982995610, 29984917608, 29986106359, 29986188689): AC1 failed in every one of them, contradicting an earlier assumption that "AC1 passes reliably in CI." This is a genuine third-party (Stripe/hCaptcha) constraint, not a defect in this repo's code, and it is not fixable by adjusting worker counts, timeouts, or rate limits (all already tried and ruled out with real evidence — see `artefacts/2026-07-23-a2-stripe-ci-checkout-flake/decisions.md` for the full investigation history, including the corrective final entry documenting this AC1 finding).

**Corrected premise:** An earlier revision of this note reasoned that AC1 "verifies plan state via a fresh re-login against `GET /billing/plan-state` — a real server-to-server Stripe webhook check, no browser re-driven through Checkout" and therefore remained the CI-automated signal. That premise was incomplete: AC1 differs from AC2/AC3 only in how it verifies the *outcome* of checkout (a fresh re-login against the webhook-driven plan-state, rather than tracking the browser's own post-checkout redirect) — it still requires the same real-browser Checkout submission to succeed first, and that submission is exactly what Stripe's hCaptcha blocks for all three ACs alike.

**What changes:** In CI only (the `scenario-a-staging-e2e` job in `.github/workflows/e2e.yml`, where `process.env.CI === 'true'`), `tests/e2e/a2-stripe-test-mode-plan-selection.spec.js`'s AC1, AC2, and AC3 tests are ALL skipped via `test.skip()`. They are NOT skipped for local/interactive runs — a human (or a future environment Stripe's bot-detection doesn't target) can and should still run them directly, and a human running the verification script by hand can still complete a real Stripe test-mode checkout and confirm all three ACs manually. This story now contributes ZERO automated CI-blocking signal — the Scenario A CI-blocking gate (`a5-ci-gate-scenario-a-blocking`, PR #563) is A1 (staging-auth-stub) + A3 (product/feature/ideate) + A4 (session-resume) only. See `artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a2-stripe-test-mode-plan-selection-test-plan.md` (AC1/AC2/AC3 now all classified as gap type External-dependency) and `artefacts/2026-07-23-e2e-core-journey-coverage/verification-scripts/a2-stripe-test-mode-plan-selection-verification.md` (Scenarios 1, 2, and 3 are now the only way AC1/AC2/AC3 are verified — there is no CI-automated equivalent for any of them).

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
