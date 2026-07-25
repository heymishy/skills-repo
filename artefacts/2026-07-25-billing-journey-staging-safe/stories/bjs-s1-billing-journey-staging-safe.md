## Story: bri-s3.5's billing journey runs against real staging (session seeding + webhook signature stub)

**Short-track:** security-scoped infra fix -- investigation of the reported "plan-state returns HTML instead of JSON" symptom traced through two separate, deeper staging-safety gaps. Operator reviewed and explicitly chose "fix both properly" via AskUserQuestion.

## User Story

As **Hamish King (Founder/Operator)**,
I want **`bri-s3.5` (Stripe test-mode checkout, usage-gate, payment-failure, and cancellation billing journeys) to run against real `wuce-staging` the same way it already does locally**,
So that **the staging smoke-test job's pass/fail signal for this spec is real, not permanently broken by two missing staging-safe paths**.

## Background / Investigation

The reported symptom ("`/billing/plan-state` returns HTML instead of JSON") is a downstream artefact, not the root cause. Trace:

1. `seedTenantSession()` calls `GET /test/session?sessionId=&tenantId=` — gated by `process.env.NODE_ENV === 'test'` directly (not `dss-s1`'s staging-safe `_isTestEndpointAllowed` gate). This is a 5th `/test/*` route that `dss-s1` did not cover (it explicitly scoped to exactly 4 named routes).
2. On staging, this route doesn't match, so the request falls through the entire router `if/else-if` chain to the final catch-all `else` branch — which returns **200 OK with the login page's HTML**, not a 404. `seedTenantSession()`'s own `expect(resp.ok()).toBeTruthy()` check is fooled into passing, even though no real session was ever created.
3. Every subsequent call using that bogus cookie hits `authGuard`'s 302-to-`/` redirect (unauthenticated). Playwright's `request.get()` follows redirects by default, landing on the same 200 HTML login page — this is the exact "`/billing/plan-state` returns HTML" symptom, correctly observed but at the wrong layer.

**Second, independent gap found during this investigation:** even after fixing (1)-(3), the spec drives plan-state transitions by POSTing synthetic Stripe webhook payloads to `/webhook/stripe`. Signature verification is faked out (`stripe.webhooks.constructEvent` simply parses the raw body) only inside the same `NODE_ENV==='test'` block that wires the fake Stripe adapter. Staging has a real `STRIPE_SECRET_KEY` wired (per `spv-s1`), so `verifyWebhookSignature` calls the REAL Stripe SDK there, which requires a genuine HMAC signature computed with the real `STRIPE_WEBHOOK_SECRET` — something Playwright cannot produce. Without a fix, `AC1`/`AC3`/`AC4` (all webhook-driven) would still fail on staging even with (1)-(3) fixed.

## Architecture Constraints

- **`/test/session` fix:** widen its existing `NODE_ENV === 'test'` condition to `_isTestEndpointAllowed(req)` (the exact same `dss-s1`-established gate function already used by the other 4 routes) -- no new gating mechanism.
- **Additional guard beyond the existing 4-route precedent:** unlike those 4 (read-only or onboarding-completion routes), `/test/session` MINTS a fully-authenticated session for a caller-chosen `tenantId`. Require any explicitly-supplied `tenantId` to match `/^e2e-/i` (the same convention `nis-s1` established) -- rejecting otherwise -- so a leaked secret can never mint a session for a real tenant. The existing default (`'e2e-tester'`) already complies.
- **Webhook signature stub:** a NEW staging-safe branch inside `handlePostStripeWebhook` (`routes/billing.js`), gated by the SAME `E2E_STAGING_AUTH_STUB_SECRET` plus a new, distinct header (`x-e2e-webhook-stub`, following the "same secret, new header per mechanism" convention). When active, parses the raw body directly as the event (mirroring the exact behaviour the existing `NODE_ENV=test` fake adapter already uses) instead of calling the real Stripe SDK.
- **Critical guard on the webhook stub:** every plausible tenantId-carrying field the parsed synthetic event could contain (`client_reference_id`, `metadata.tenant_id`, `subscription_details.metadata.tenant_id`) must be checked; if ANY present value does not start with `e2e-`, reject (400) before any plan-state/credit mutation runs. Without this, a leaked secret could POST an arbitrary "webhook event" that marks a REAL tenant as paid/active, or grants it arbitrary credits -- a materially worse risk than anything else built tonight, since it would bypass real payment entirely.
- **No change to the real production webhook path** -- when the stub gate doesn't match, `stripeClient.verifyWebhookSignature` runs exactly as before, unchanged.

## Dependencies

- **Upstream:** `dss-s1` (established the `_isTestEndpointAllowed` gate this story reuses), `nis-s1` (established the `e2e-` prefix convention this story reuses and extends to a new mechanism).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `E2E_STAGING_AUTH_STUB_SECRET` unset, When `GET /test/session` is called (any headers), Then behaviour is unchanged from today: the route only matches when `NODE_ENV==='test'`.

**AC2:** Given the secret set and a matching `x-e2e-test-endpoint-bypass` header (the existing `dss-s1` header, reused), When `GET /test/session` is called with no `tenantId` query param, Then it succeeds exactly as the `NODE_ENV=test` path already does, defaulting `tenantId` to `'e2e-tester'`.

**AC3:** Given the same gate, When `tenantId` IS supplied and does NOT start with `e2e-` (case-insensitive), Then the request is rejected (400) and no session is created.

**AC4:** Given the same gate, When `tenantId` starts with `e2e-`, Then the session is created for that tenantId exactly as before.

**AC5:** Given `E2E_STAGING_AUTH_STUB_SECRET` unset, When `POST /webhook/stripe` is called with the new webhook-stub header, Then the stub branch never activates -- real `verifyWebhookSignature` is attempted (and fails/succeeds exactly as it does today).

**AC6:** Given the secret set and a matching `x-e2e-webhook-stub` header, When the POSTed synthetic event's `client_reference_id`/`metadata.tenant_id`/`subscription_details.metadata.tenant_id` (whichever the event type carries) all start with `e2e-`, Then the stub branch activates: the raw body is parsed directly as the event (no real signature check), and the existing switch/dispatch logic runs completely unmodified.

**AC7:** Given the same gate, When ANY of those tenantId-shaped fields is present and does NOT start with `e2e-`, Then the request is rejected (400) before any plan-state or credit mutation runs.

**AC8:** Given `tests/e2e/bri-s3.5-billing-journey.spec.js` run locally (`NODE_ENV=test`, no secret present), Then it passes exactly as before -- zero behaviour change for the existing local harness path.

## Out of Scope

- A live re-run against real `wuce-staging` to confirm the fix end-to-end -- deferred to post-merge verification (matches `dss-s1`/`nis-s1` precedent).
- Any other `/test/*` route beyond `/test/session` -- this story's own investigation found no other staging-safety gap in `bri-s3.5`'s dependencies.
- Widening `verifyWebhookSignature`'s underlying Stripe-adapter wiring itself -- the fix stays scoped to `handlePostStripeWebhook`'s own call site, not the shared `stripe-client.js` module (keeps the real production call path untouched at the module boundary too).

## NFRs

- **Security:** the `e2e-` prefix guard on webhook-stub tenantIds is the single most important property of this story -- a leaked secret must never be able to mark a real tenant as paid or grant it real credits.
- **Backward compatibility:** zero behaviour change for the real production webhook path (secret unset) and the local `NODE_ENV=test` harness path (AC1, AC5, AC8).

## Complexity Rating

**Rating:** 3 -- touches a real payment-adjacent verification path; requires the same explicit threat-model rigor as `nis-s1`.
**Scope stability:** Stable (design reviewed and approved via AskUserQuestion before implementation began).
