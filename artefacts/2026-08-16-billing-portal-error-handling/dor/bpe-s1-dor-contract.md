# DoR Contract: Add error handling and a missing-customer guard to the Stripe Billing Portal redirect

**Story reference:** artefacts/2026-08-16-billing-portal-error-handling/stories/bpe-s1-billing-portal-error-handling.md
**Test plan reference:** artefacts/2026-08-16-billing-portal-error-handling/test-plans/bpe-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. In `src/web-ui/routes/billing.js`, `handleGetBillingPortal`: after the existing AC2 auth guard (no session/no `accessToken` → 302 to `/`), add a new guard that checks `req.session.stripeCustomerId` for truthiness. If falsy (missing, `null`, `undefined`, or `''`), log a structured warning (`console.warn`, `{ event: 'billing_portal_no_customer_id', tenantId }`) and respond 302 to `/settings?error=no_billing_account` — never calling `stripeClient.createPortalSession`.
2. Wrap the existing `stripeClient.createPortalSession(customerId, '/dashboard')` call (and its subsequent 302 response) in a `try`/`catch`. On success, behaviour is byte-for-byte unchanged from today (302 to the returned portal URL). On a caught throw, log a structured error (`console.error`, `{ event: 'billing_portal_error', tenantId, message: err.message }`) and respond 302 to `/settings?error=billing_unavailable`.
3. New test file `tests/check-bpe-s1-billing-portal-error-handling.js` covering all 5 ACs per the test plan, following `tests/check-lab-s3.5-billing-portal.js`'s existing mock/adapter conventions for this same handler.

**What will NOT be built:**
- No change to `handlePostCheckout`, `handlePostStripeWebhook`, or any other handler in `billing.js` — only `handleGetBillingPortal` is touched.
- No change to `stripeClient.createPortalSession`'s own signature or implementation (`src/web-ui/modules/stripe-client.js`) — the fix is entirely at the caller.
- No change to `settings.js` or any rendering of the new `?error=` query-param codes into a visible banner — explicitly out of scope per the story.
- No change to how or when `req.session.stripeCustomerId` is set during checkout/webhook processing.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (valid customerId → redirect to portal URL) | Unit test: mock adapter, assert 302 + Location + adapter called with correct customer | unit |
| AC2 (returnUrl contains /dashboard) | Unit test: inspect args from the AC1 test's mock call | unit |
| AC3 (no session → 302 to /) | Unit test: two session shapes (`{}`, `null`), assert 302 + Location + adapter not called | unit |
| AC4 (missing/null/empty customerId → guarded redirect) | Unit test: three customerId shapes (absent key, `null`, `''`), assert 302 to `/settings?error=no_billing_account` + adapter not called | unit |
| AC5 (Stripe throws → caught, guarded redirect) | Unit test: mock adapter's `create` rejects, assert no throw escapes, 302 to `/settings?error=billing_unavailable` | unit |

**Assumptions:**
- `stripeClient.createPortalSession` remains D37-injectable via `setStripeAdapter()`, exactly as it is today — no changes needed there for this fix.
- `req.session.stripeCustomerId` being falsy is a legitimate, expected state for a tenant that has never completed Stripe Checkout (trial accounts), not only a data-integrity bug — the guard must handle it as a normal, expected branch, not treat it as an exceptional error path requiring a different (non-redirect) response.
- The exact real-world root cause of *why* the reported user's `stripeCustomerId` was missing despite an "Active — Paid plan" app-side state (per `beta-001.md`) is not being independently re-diagnosed by this story — this fix is a defensive guard against the symptom (unhandled throw), not a data-backfill fix for that specific account. This is named explicitly in the story's Out of Scope.

**Estimated touch points:**
Files: `src/web-ui/routes/billing.js` (modified), `tests/check-bpe-s1-billing-portal-error-handling.js` (new).
Services: None — no new external service, same Stripe adapter as before.
APIs: None — no new routes, no changed request shape; the response shape for the happy path (AC1/AC2/AC3) is unchanged, and the two new response shapes (AC4/AC5) are both 302 redirects, consistent with every other outcome this handler already produces.

---

## Contract Review

Reviewed against all 5 ACs and the test plan. No mismatches found — every AC has a proposed implementation approach and a specific, matching test type (unit). No AC requires an observable behaviour that the proposed unit-test approach cannot verify. The NFR test (`billingPortal_errorLogging_structuredNoRawErrorLeaked`) is additionally covered by the same implementation (structured logging via `console.warn`/`console.error`, never embedding the raw error in the response).

✅ **Contract review passed** — proposed implementation aligns with all ACs.
