# Story: Add error handling and a missing-customer guard to the Stripe Billing Portal redirect

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; validated triage is `artefacts/feedback/beta-001.md`
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As a **tenant admin**,
I want **clicking "Manage billing" in Settings → Billing to always take me somewhere sensible — the real Stripe Billing Portal when my account is fully set up, or back to Settings without crashing otherwise**,
So that **I can reach my receipts and invoice history (which live inside Stripe's own hosted portal) instead of hitting a raw server error**.

## Benefit Linkage

**Metric moved:** No formal benefit-metric artefact — short-track. Operational/quality metric: a confirmed production defect directly reported by a real beta user, not a theoretical gap.
**How:** A real beta user reported "need receipts" for billing, twice, in different words (`artefacts/feedback/beta-001.md`, signals #1 and #6). Live validation against wuce-staging.fly.dev (authenticated, Chrome) confirmed "Manage billing" (Settings → Billing) returns a raw `500 Internal Server Error`, not a missing-feature UX gap. Root cause: `src/web-ui/routes/billing.js`'s `handleGetBillingPortal` (around line 443) has zero error handling and no guard for a missing `req.session.stripeCustomerId` before calling `stripeClient.createPortalSession()`. Since Stripe's Billing Portal is where invoice/receipt history is actually hosted, this single unhandled-throw bug is very plausibly the entire root cause of both reported signals. Fixing it removes an active, confirmed procurement-blocking defect (raw 500s are disqualifying for regulated/enterprise buyers) for a beta user already in the product, without requiring any new UI to be built — the portal itself already contains the receipts the user is asking for.

## Architecture Constraints

None beyond existing conventions already used elsewhere in this same file. This story follows `handleGetBillingSuccess`'s own existing "fail open" precedent in `billing.js` (an external Stripe API failure there is caught and falls back to a redirect, never an unhandled throw) and reuses the `?error=<code>` query-param convention already established by `src/web-ui/routes/products.js` (`handleGetProductNew`'s `plan_limit` guard) rather than inventing a new error-signalling mechanism. No new adapter, no change to `stripeClient`'s public contract, no change to `settings.js` (rendering the error code into a visible banner on the Settings page is explicitly out of scope below — a future story's job).

## Dependencies

- **Upstream:** None.
- **Downstream:** None. (A future story may add a visible error banner on the Settings page's Billing tab when `?error=` is present — not required for this fix to resolve the reported defect, since the change here already replaces the raw 500 with a normal navigation outcome.)

## Acceptance Criteria

**AC1:** Given an authenticated session (`req.session.accessToken` set) with a valid `req.session.stripeCustomerId`, When a GET request hits `/settings/billing`, Then `stripeClient.createPortalSession` is called with that customer ID and the response is a 302 redirect to the URL it returns — unchanged from the existing, already-shipped behaviour (regression coverage).

**AC2:** Given the same request as AC1, When `createPortalSession` is called, Then the `returnUrl` argument passed to it contains `/dashboard` — unchanged from the existing, already-shipped behaviour (regression coverage).

**AC3:** Given no session, or a session with no `accessToken`, When a GET request hits `/settings/billing`, Then the response is a 302 redirect to `/` and `stripeClient.createPortalSession` is never called — unchanged from the existing, already-shipped behaviour (regression coverage).

**AC4:** Given an authenticated session with a missing, `null`, `undefined`, or empty-string `req.session.stripeCustomerId`, When a GET request hits `/settings/billing`, Then `stripeClient.createPortalSession` is never called (no attempt to reach Stripe with an invalid customer), and the response is a 302 redirect to `/settings?error=no_billing_account` — not a raw 500.

**AC5:** Given an authenticated session with a valid-looking `stripeCustomerId`, When `stripeClient.createPortalSession` throws (a real Stripe API failure — network error, invalid/deleted customer on Stripe's side, Stripe outage, etc.), Then the throw is caught, no unhandled exception reaches the caller, and the response is a 302 redirect to `/settings?error=billing_unavailable` — not a raw 500.

## Out of Scope

- Any change to the Stripe checkout or webhook flow (`handlePostCheckout`, `handlePostStripeWebhook`) — this story touches only the GET `/settings/billing` portal-redirect handler (`handleGetBillingPortal`).
- Any new UI for displaying receipts directly inside this app — Stripe's own hosted Billing Portal already contains full invoice/receipt history; this story's job is only to make that portal reliably reachable, not to rebuild it.
- Rendering the new `?error=no_billing_account` / `?error=billing_unavailable` query-param codes into a visible banner on the Settings page (`settings.js`) — the redirect itself already resolves the reported defect (a raw crash becomes a normal navigation outcome); a follow-up story can add the visible banner using the same convention `products.js` already established, if warranted.
- Any change to how or when `req.session.stripeCustomerId` gets set in the first place (e.g. backfilling it after a successful checkout) — that is a separate, deeper investigation (why is it missing for an already-"Active — Paid plan" account?) explicitly flagged as future work, not blocking this defensive fix.

## NFRs

- **Performance:** No measurable change expected — same synchronous redirect logic, now wrapped in a guard and a try/catch with no new I/O.
- **Security:** Net risk reduction. The caught error is logged server-side only (`console.error`, structured JSON, no raw error object or stack sent to the client) — never reflected into the redirect response, so no new information-disclosure surface. No user-supplied input is newly rendered anywhere (the `?error=` values are fixed, hardcoded strings, not echoed request data).
- **Accessibility:** Not applicable — no new markup; the response remains a 302 redirect, same as the existing behaviour for every other outcome of this handler.
- **Audit:** New: a `billing_portal_no_customer_id` warning log and a `billing_portal_error` error log are emitted server-side on the two new failure paths (AC4, AC5), matching this file's existing structured-logging convention (`credits_provisioned`, `payment_failed`, `subscription_canceled` in the webhook handler above).

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
