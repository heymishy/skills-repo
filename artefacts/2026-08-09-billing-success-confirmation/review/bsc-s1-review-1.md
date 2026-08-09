## Review: bsc-s1 — Show a real, visible confirmation after a successful checkout instead of a silent redirect

**Story:** artefacts/2026-08-09-billing-success-confirmation/stories/bsc-s1-real-checkout-confirmation.md
**Reviewer:** Claude (agent), operator-directed — UX gap found via agentic-review trial
**Date:** 2026-08-09

---

### Category A: Traceability

PASS. Benefit linkage names the exact live symptom (silent redirect, zero confirmation) and a second, deeper, independently-confirmed bug: `req.query.plan_name` is read in `handleGetBillingSuccess` but never populated anywhere, since `handlePostCheckout`'s `success_url` (line 164) only ever includes `session_id`. Both traced to one root cause (nothing carries the real plan forward).

### Category B: Scope discipline

PASS. Out of scope explicitly excludes touching `products.js`'s dashboard rendering (a larger, riskier surface), changing the webhook-driven entitlement mechanism, or adding webhook-completion polling. The fix is confined to `billing.js` and a new `stripe-client.js` function.

### Category C: AC quality

PASS. 5 ACs, each Given/When/Then, each independently testable: AC1 covers the real-data-sourcing fix, AC2/AC3 cover the visible-confirmation UX, AC4 covers the analytics-data fix, AC5 is an explicit fail-open guard. AC1's security reasoning (session metadata vs. client-suppliable query param) is stated as an explicit constraint, not left implicit.

### Category D: Completeness

PASS. NFRs stated, including a real Security NFR naming the specific tamperable-query-param risk this design avoids. Complexity rated 2 (correctly — this isn't purely mechanical, there's a real design decision). Dependencies correctly noted as none.

### Category E: Architecture compliance

PASS. Reuses the existing D37-injectable Stripe adapter pattern (`setStripeAdapter`/`requireAdapter`) for the new session-retrieval call rather than inventing a second Stripe-wiring mechanism. Explicitly preserves the webhook as the sole entitlement-granting authority — the confirmation page does not silently take over that responsibility, avoiding a subtle correctness regression (claiming a plan is active before the webhook has actually set it).

---

### Verdict

**PASS — 0 HIGH findings.** Well-scoped short-track fix. The security-conscious design choice (session metadata over a spoofable query parameter) and the explicit refusal to let the confirmation page imply entitlement has already been granted are both non-obvious, correctly-reasoned decisions for a fix of this size. Cleared to proceed to `/test-plan`.
