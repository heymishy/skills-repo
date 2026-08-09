## Definition of Ready: bsc-s1 — Show a real, visible confirmation after a successful checkout instead of a silent redirect

**Story:** artefacts/2026-08-09-billing-success-confirmation/stories/bsc-s1-real-checkout-confirmation.md
**Review artefact:** artefacts/2026-08-09-billing-success-confirmation/review/bsc-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-09-billing-success-confirmation/test-plans/bsc-s1-test-plan.md
**Date:** 2026-08-09

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/modules/stripe-client.js` — `createCheckoutSession` gains a `planId` param, set as `metadata: { planId }` at session creation; new `retrieveCheckoutSession(sessionId)` function, same D37-injectable adapter pattern.
- `src/web-ui/routes/billing.js` — `handlePostCheckout` passes `planId` through to `createCheckoutSession`; `handleGetBillingSuccess` retrieves the real session, renders a confirmation page naming the real plan (via `renderShell`), fails open to the original 302 on any failure.
- `tests/check-bsc-s1-*.js` (new) — unit + integration tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `src/web-ui/routes/products.js` (`handleGetDashboard`) — no dashboard banner; confirmation is a dedicated page.
- `handlePostStripeWebhook` — entitlement-granting logic unchanged.
- `src/web-ui/modules/tenant-plan.js` — no polling or state-reading added; the confirmation is sourced from the checkout session itself, not from `getPlanState`.

### Architecture Constraints

No new architectural decision — extends the existing D37-injectable Stripe adapter pattern with one more function, following its own established shape exactly. No ADR required.

**Security note for the coding agent:** the plan name shown MUST come from `retrieveCheckoutSession(sessionId)`'s own metadata, never from `req.query.plan_name` or any other client-suppliable value — this is the specific vulnerability class AC1/the Security NFR exist to close, not just a style preference.

### Human oversight

**Low** — single route + one new adapter function, both following an already-established injectable pattern in this exact codebase; root cause (unpopulated query param) independently confirmed via source inspection before this story was written.

### Coding Agent Instructions

1. In `stripe-client.js`:
   - Add `planId` to `createCheckoutSession`'s params; set `metadata: { planId: planId }` in the `stripe.checkout.sessions.create(...)` call.
   - Add `retrieveCheckoutSession(sessionId)`:
     ```javascript
     async function retrieveCheckoutSession(sessionId) {
       var stripe = requireAdapter();
       return stripe.checkout.sessions.retrieve(sessionId);
     }
     ```
   - Export `retrieveCheckoutSession` alongside the existing exports.
2. In `billing.js`'s `handlePostCheckout`, pass `planId: planId` into the `createCheckoutSession(...)` call (the `planId` variable already exists there, uppercased from `body.planId`).
3. Rewrite `handleGetBillingSuccess`:
   - Keep the existing auth guard unchanged.
   - Read `req.query.session_id`. If absent, fall straight through to the existing 302-to-`/dashboard` behavior (AC5).
   - `try` to call `stripeClient.retrieveCheckoutSession(sessionId)`. On any thrown error, fall through to the existing 302-to-`/dashboard` behavior (AC5) — never let this crash the response.
   - On success, read `session.metadata && session.metadata.planId` as the real plan. Fire the `checkout_completed` PostHog event with this real `planName` (AC4) — keep this fire-and-forget, not awaited, matching the existing pattern.
   - Render a confirmation page via `renderShell` stating the payment succeeded and naming the plan (AC2), with a real `<a href="/dashboard">Continue to dashboard</a>`-style link (AC3) — do not auto-redirect away from this page; the user reads it and clicks through themselves.
   - If `session.metadata.planId` is somehow missing even though the retrieve succeeded, use a generic "Payment successful" message without naming a specific plan, rather than showing an empty/broken value.
4. Write the tests per the test plan; confirm AC1-AC5 with a mocked Stripe adapter (never a real Stripe API call in automated tests).
5. Re-run any existing `billing.js`-related tests (e.g. `tests/check-lab-s3.2-*.js`, `check-lab-s3.5-billing-portal.js` if present) to confirm no regression to `handlePostCheckout`'s other behaviour.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — the confirmation page's content/structure is what's tested, not pixel layout)

**PROCEED: Yes**
