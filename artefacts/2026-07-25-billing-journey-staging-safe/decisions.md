## Decisions: billing journey staging-safe fixes (bjs-s1)

### Decision: the reported symptom was a downstream artefact, not the bug

**Date:** 2026-07-25
**Context:** Task was framed as "`/billing/plan-state` returns HTML instead of JSON." Tracing the actual code confirmed `handleGetBillingPlanState` itself is correct (proper JSON response, proper 401 on missing auth). The real cause is upstream: `authGuard` redirects (302→`/`) on an unauthenticated request, Playwright's `request.get()` follows redirects by default, and lands on the router's catch-all 200-HTML login page.
**Decision:** Fix the actual upstream cause (`/test/session`'s missing staging-safe gate) rather than touching `handleGetBillingPlanState` or `authGuard` at all.
**Rationale:** Changing either of those would be a bigger, riskier, and wrong fix — both already behave correctly for real traffic. The bug is that `seedTenantSession()` never actually established a session on staging in the first place, so every downstream symptom (including the plan-state one originally reported) was accurately reflecting "you are not authenticated," just via a confusing path (a redirect silently followed to a 200 HTML page rather than a clear failure).

### Decision: `/test/session` gets the same `e2e-` tenantId guard as `nis-s1`

**Date:** 2026-07-25
**Context:** Widening `/test/session` from `NODE_ENV==='test'` to `dss-s1`'s `_isTestEndpointAllowed` gate is not equivalent to the other 4 routes that gate already covers — this one MINTS a fully-authenticated session for a caller-chosen `tenantId`, with `accessToken` set unconditionally. A leaked secret alone would let an attacker authenticate into ANY tenant.
**Decision:** Require any explicitly-supplied `tenantId` to match `/^e2e-/i`, rejecting (400) otherwise. The existing default (`'e2e-tester'`) already complies, so no behaviour change for callers that omit it.
**Rationale:** Direct reuse of the exact guard convention `nis-s1` established for the structurally identical risk (a staging mechanism that can authenticate as an arbitrary identity/tenant). Consistency here matters: a reviewer scanning this codebase's staging-only mechanisms should find the same guard shape everywhere the same risk exists.

### Decision: webhook-signature stub gets its own tenantId guard covering every candidate field, not just one

**Date:** 2026-07-25
**Context:** `handlePostStripeWebhook`'s dispatch switch reads tenantId from a different field depending on `event.type` (`client_reference_id` for `checkout.session.completed`; `metadata.tenant_id` or `subscription_details.metadata.tenant_id`, falling back to `client_reference_id`, for the others). A guard checking only one field would miss the others.
**Decision:** Added `_collectCandidateTenantIds(event)`, a small helper used ONLY by the security guard (not the real dispatch logic, which is completely unmodified) that collects every tenantId-shaped value the parsed event could carry, and rejects (400) if any one of them doesn't match `/^e2e-/i`.
**Rationale:** This is the single highest-risk mechanism built across this whole capture-log-review batch: unlike a read-only role lookup or a session that just grants tenant *access*, a stub webhook event can mark a tenant as PAID and grant real credits — bypassing actual payment entirely. The guard must cover every path the real switch statement reads from, not just the most common one, or a leaked secret plus a less-common event type (e.g. `invoice.payment_failed`'s `metadata.tenant_id` path) would slip through unguarded.

### Decision: no change to `stripe-client.js`'s module boundary

**Date:** 2026-07-25
**Context:** The staging-safe bypass could have been implemented by swapping the wired Stripe adapter itself (similar to how `NODE_ENV=test` already fakes it in `server.js`), rather than branching inside `handlePostStripeWebhook`.
**Decision:** Kept the bypass entirely inside `routes/billing.js`'s own call site; `stripe-client.js` and its real production wiring are completely untouched.
**Rationale:** Swapping the adapter would mean the real Stripe SDK is never even reachable when the secret happens to be set (regardless of the header), a coarser and riskier gate than checking the header on each individual request. Keeping the branch at the call site means the real, unmodified verification path runs on every request unless BOTH the secret and the request-specific header are present — matching the same per-request (not per-process) gating discipline every other staging-only mechanism in this codebase uses.
