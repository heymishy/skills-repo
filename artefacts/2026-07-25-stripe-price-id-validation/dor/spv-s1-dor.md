## Definition of Ready: Reject a non-price-shaped Stripe price ID config

**Story reference:** artefacts/2026-07-25-stripe-price-id-validation/stories/spv-s1-reject-non-price-id-checkout-config.md
**Test plan reference:** artefacts/2026-07-25-stripe-price-id-validation/test-plans/spv-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-25

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 4 ACs |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named | ✅ | Direct operator-reported production-adjacent gap found during live staging verification (2026-07-25 Stripe checkout incident) |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | Short-track |
| H8 | No uncovered ACs | ✅ | |

**All hard blocks PASS.**

## Coding Agent Instructions

```
Proceed: Yes
Story: spv-s1 -- artefacts/2026-07-25-stripe-price-id-validation/stories/spv-s1-reject-non-price-id-checkout-config.md
Test plan: artefacts/2026-07-25-stripe-price-id-validation/test-plans/spv-s1-test-plan.md

In handlePostCheckout (src/web-ui/routes/billing.js), add a third condition
to the existing missing/placeholder price-ID validation chain (AC3 of the
original lab-s3.2 story): if priceId is present and not the placeholder but
does not start with "price_", log a specific console.error naming the env
var and expected vs. actual shape, then return the SAME generic 500
"Billing not configured" response already used by the other two failure
modes (do not leak the value or env var name to the client). No new Stripe
API call, no change to the two existing checks.

Oversight level: Low -- single additional string-prefix condition in an
existing, already-tested validation chain.
```

## Sign-off

**Oversight level:** Low
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25 (short-track, operator-directed same session, found via live staging verification)
