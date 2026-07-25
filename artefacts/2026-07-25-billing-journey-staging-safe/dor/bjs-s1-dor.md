## Definition of Ready: Billing journey staging-safe fixes (bjs-s1)

**Story reference:** artefacts/2026-07-25-billing-journey-staging-safe/stories/bjs-s1-billing-journey-staging-safe.md
**Test plan reference:** artefacts/2026-07-25-billing-journey-staging-safe/test-plans/bjs-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-25

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 8 ACs |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named | ✅ | Direct investigation of the queued bri-s3.5 gap, tracing beyond the originally-reported symptom |
| H6 | Complexity rated | ✅ | 3 |
| H7 | No unresolved HIGH | ✅ | Threat-model reviewed inline in story; operator explicitly chose "fix both properly" via AskUserQuestion |
| H8 | No uncovered ACs | ✅ | |
| H9 (security) | Security-scoped design explicit | ✅ | Webhook-stub blast radius (arbitrary tenant marked paid/credited) is the story's own stated critical risk; e2e- guard is the mitigation |

**All hard blocks PASS.**

## Coding Agent Instructions

```
Proceed: Yes
Story: bjs-s1 -- artefacts/2026-07-25-billing-journey-staging-safe/stories/bjs-s1-billing-journey-staging-safe.md
Test plan: artefacts/2026-07-25-billing-journey-staging-safe/test-plans/bjs-s1-test-plan.md

1. src/web-ui/server.js: widen /test/session's gate from
   `process.env.NODE_ENV === 'test'` to `_isTestEndpointAllowed(req)`
   (dss-s1's existing gate function). Add: if `req.query.tenantId` is
   supplied and does not match /^e2e-/i, respond 400 and return before
   creating any session. The existing default ('e2e-tester') already
   complies, no change needed there.
2. src/web-ui/routes/billing.js: add a staging-safe webhook-stub branch
   inside handlePostStripeWebhook, gated by process.env.E2E_STAGING_AUTH_STUB_SECRET
   set AND req.headers['x-e2e-webhook-stub'] timing-safe-matching it
   (mirror nis-s1's _namedIdentityStubEnabled/_namedIdentityStubHeaderMatches
   pattern). When active: parse `event = JSON.parse(rawBody.toString())`
   directly (skip stripeClient.verifyWebhookSignature entirely). Before
   proceeding to the existing idempotency/switch logic, collect every
   candidate tenantId the parsed event could carry (client_reference_id,
   metadata.tenant_id, subscription_details.metadata.tenant_id) and reject
   (400) if ANY present value does not match /^e2e-/i. When the gate
   doesn't match, call the real stripeClient.verifyWebhookSignature exactly
   as today -- zero change to that path.
3. tests/e2e/fixtures/staging-auth.js: add the new x-e2e-webhook-stub
   header constant + a webhookStubHeaders() helper mirroring the existing
   testEndpointBypassHeaders()/namedIdentityStubHeaders() pattern.
4. tests/e2e/bri-s3.5-billing-journey.spec.js: update seedTenantSession()
   to send testEndpointBypassHeaders() (dss-s1's existing header, already
   gates /test/session once widened) and postWebhook() to send
   webhookStubHeaders(). No tenantId renaming needed -- all of this spec's
   own literals already use the e2e- prefix.
5. Write tests/check-bjs-s1-billing-journey-staging-safe.js covering all
   8 ACs, mirroring nis-s1's mockReq/mockRes/freshRequire conventions.
6. Re-run the local Playwright suite for bri-s3.5 to confirm zero
   regression (AC8).

Oversight level: High -- webhook signature verification is a real
payment-adjacent security boundary. Do not weaken the e2e- prefix guard
for convenience; it is the only thing preventing a leaked secret from
marking a real tenant as paid.
```

## Sign-off

**Oversight level:** High
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25 (explicit "fix both properly" selection via AskUserQuestion after being shown the security trade-off; short-track, operator-directed, part of capture-log review batch)
