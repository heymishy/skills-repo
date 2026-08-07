## Contract Proposal — Drive Stripe test-mode plan selection on real staging

**What will be built:**
- A Playwright spec (`tests/e2e/a2-stripe-test-mode-plan-selection.spec.js`) that reuses A1's staging-auth fixture to authenticate, then drives plan selection through to Stripe's hosted checkout page (cross-origin navigation), fills in the test card fields, and asserts back on `wuce-staging`.
- Assertions read `GET /billing/plan-state` (existing endpoint, not new) to confirm plan activation/non-activation.

**What will NOT be built:**
- 3D Secure challenge handling, currency variation tests, or plan upgrade/downgrade flows — explicitly out of scope.
- Any change to the real Stripe webhook handler or `/billing/plan-state` endpoint itself — this story only drives and observes existing billing code.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | E2E: complete checkout with Stripe success test card, assert plan-state active | E2E |
| AC2 | E2E: assert post-checkout redirect page and continued session validity | E2E |
| AC3 | E2E: complete checkout with Stripe decline test card, assert decline message + plan-state unchanged | E2E |

**Assumptions:**
- Stripe test-mode keys are already configured on `wuce-staging` (per discovery's `/clarify` resolution) and the operator will supply/confirm the exact test key values at implementation time.
- Stripe's hosted checkout page is reachable and stable for Playwright cross-origin navigation (no CAPTCHA or bot-detection blocking automated test traffic in test mode).

**Estimated touch points:**
Files: `tests/e2e/a2-stripe-test-mode-plan-selection.spec.js`
Services: `wuce-staging`, Stripe (test mode)
APIs: `GET /billing/plan-state` (existing, read-only in this story)
