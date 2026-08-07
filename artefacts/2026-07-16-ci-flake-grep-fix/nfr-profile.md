# NFR Profile: cfg-s1 — Fix over-broad Stripe-key grep scope

**Data classification:** Public (no real secrets involved — this is about a check's own search scope)
**Compliance:** None applicable
**Performance:** Negligible — narrower grep scope
**Security:** The fix must not reduce detection of a real committed live-mode key in any runtime-relevant path (verified via AC4's fixture test)
**Accessibility:** Not applicable
**Audit:** None beyond existing logging
