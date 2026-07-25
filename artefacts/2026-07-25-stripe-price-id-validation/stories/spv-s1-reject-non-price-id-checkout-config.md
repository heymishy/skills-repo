## Story: Fail fast with a clear log when a plan's Stripe price ID env var is misconfigured

**Short-track:** bug fix -- a real production-adjacent gap found via live manual staging verification.

## User Story

As **Hamish King (Founder/Operator)**,
I want **a misconfigured `STRIPE_PRICE_ID_*` env var (e.g. a Product ID pasted in by mistake) to fail with a clear, specific server-side log line**,
So that **the next time this happens, I don't have to live-tail Fly logs during a real user's checkout attempt to find a one-line root cause buried inside an unhandled Stripe API exception's stack trace**.

## Background / Investigation

On 2026-07-25, a manual staging verification of the Stripe checkout upgrade flow failed with a bare "Internal Server Error" before ever reaching Stripe's hosted checkout page. Tailing `fly logs -a wuce-staging` live during a retry surfaced the actual cause:

```
[authGuard] unhandled error in protected route handler: Error: No such price: 'prod_UucwFl0LpPlOod'
    at .../stripe-client.js:49:35
    at handlePostCheckout (/app/src/web-ui/routes/billing.js:109:36)
```

`prod_UucwFl0LpPlOod` is a Stripe **Product** ID (prefix `prod_`), not a **Price** ID (prefix `price_`) -- Stripe's Checkout Session API requires a price, and rejects a product ID with exactly this "No such price" error. The relevant Fly secret (`STRIPE_PRICE_ID_PRO` or `STRIPE_PRICE_ID_STARTER`) was set to the wrong kind of Stripe object ID.

`handlePostCheckout` (`src/web-ui/routes/billing.js:75-119`) already validates for two configuration failure modes -- a missing env var, and the literal `.env.example` placeholder sentinel (`STRIPE_PLAN_PRICE_ID_PLACEHOLDER`) -- both returning a clean `500 "Billing not configured"` response with no Stripe API call made at all (AC3, already tested). It does **not** validate that a present, non-placeholder value actually looks like a Price ID before handing it to Stripe. `authGuard` (`src/web-ui/routes/auth.js:391-397`) safely catches the resulting unhandled rejection and never leaks the stack trace to the client (confirmed by reading its `handleGuardedError` -- always responds with a plain, generic `"Internal Server Error"` text body) -- so there is no information-disclosure issue for the end user. The gap is purely operational: the *actual, specific* misconfiguration is only visible by reading raw server logs at the exact moment of a failing request, not from a purpose-written log line.

## Architecture Constraints

- **Extend the existing validation block in `handlePostCheckout`, not a new mechanism.** This is the same shape of check as the existing missing/placeholder check (AC3) -- add a third condition to the same `if`-chain, immediately before the Stripe API call.
- **Client-facing response stays exactly as generic as the existing two failure modes** (`500`, body `"Billing not configured"`) -- do not echo the actual misconfigured value or env var name to the client; that information belongs in the server log only, matching this route's existing precedent of never surfacing internal configuration detail in a response body.
- **The server-side log must be specific enough to fix the problem without needing a live log-tail session**: name the env var, state what was found vs. expected (a `price_...` value), matching the level of detail this story's own investigation needed to reconstruct after the fact.
- **Do not attempt to validate the price ID against Stripe's API** (e.g. an extra round-trip to check it resolves) -- that would add latency and a new failure mode (network/API errors) to every checkout attempt for a problem a simple string-prefix check already catches. Stripe's own ID-prefix convention (`price_` vs `prod_` vs `cus_` etc.) is stable and documented; a prefix check is the correct, minimal validation.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `STRIPE_PRICE_ID_<PLAN>` is set to a value that does not start with `price_` (e.g. a Product ID like `prod_...`, or any other non-price-shaped string) and is not the placeholder sentinel, When `POST /billing/checkout` is called for that plan, Then the response is `500` with body `"Billing not configured"` -- the same client-facing response as the existing missing/placeholder cases -- and no call to `stripeClient.createCheckoutSession` is made.

**AC2:** Given the same misconfigured-value scenario as AC1, When the request is handled, Then a single, specific `console.error` log line is emitted naming the env var (`STRIPE_PRICE_ID_<PLAN>`) and stating that its value does not look like a Stripe Price ID.

**AC3:** Given `STRIPE_PRICE_ID_<PLAN>` is set to a valid-looking `price_...` value, When `POST /billing/checkout` is called, Then behaviour is completely unchanged from today -- `stripeClient.createCheckoutSession` is called exactly as before (regression guard for the existing, already-tested happy path).

**AC4:** Given the existing missing-env-var and placeholder-sentinel checks (AC3 of the original lab-s3.2 story), When those specific conditions occur, Then their behaviour remains completely unchanged (this story adds a third, additional condition to the same chain -- it does not alter the first two).

## Out of Scope

- Validating the price ID actually exists / resolves against Stripe's API before checkout (see Architecture Constraints -- deliberately not done, a prefix check is sufficient and avoids a new round-trip failure mode).
- Any change to `authGuard`'s generic error-catching behaviour, or to what's shown to the end user on any other unhandled route error -- this story only adds an earlier, more specific check for this one known failure shape.
- Fixing the actual misconfigured Fly secret itself -- operator-owned, out of band from this code change.

## NFRs

- **Security:** No new information disclosed to the client (matches existing precedent -- generic message only). The specific env var name and value shape are logged server-side only, matching how `authGuard` already logs full stack traces server-side without exposing them to the client.
- **Performance:** No new network calls -- a single string-prefix check, no additional latency on any request.
- **Observability:** This is the entire point of the story -- convert an undiagnosable generic 500 into a self-explanatory log line.

## Complexity Rating

**Rating:** 1 -- a single additional condition in an existing, already-tested validation chain; no new mechanism, no schema/API changes.
**Scope stability:** Stable.
