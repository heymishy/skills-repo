# Decision Log: 2026-07-16-journey-limit-credits

**Feature:** Journey cap bypass for tenants with a positive credit balance
**Last updated:** 2026-07-16

## Decision categories

| Code | Meaning |
|------|---------|
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |
| `ARCH` | Architecture or significant technical design decision |

## Log entries

---
**2026-07-16 | ARCH | discovery (operator decision)**
**Decision:** The journey-count cap (`MAX_JOURNEYS_PER_TENANT`) applies to free/trial tenants unchanged. Any tenant with a positive credit balance (`credits.getBalance(tenantId) > 0`) bypasses the count cap entirely and is gated only by running out of credits. No new plan-tier/subscription-status field is introduced — credit balance itself is the paid signal.
**Alternatives considered:** (1) Give paid tenants a higher but still finite count cap (rejected by operator — credits already exist as the natural usage-based limiter, a second count cap would be redundant). (2) Introduce a formal plan-tier field synced from Stripe subscription status (rejected for this story — no such field exists today, and the operator's chosen policy doesn't require one; a future story could add it if a distinction other than "has credits" is ever needed).
**Rationale:** `credits.js` already exists as a real, Postgres-backed, per-tenant balance used elsewhere for usage-based gating (per-turn deduction) — reusing it here is the smallest correct change, with zero new concepts introduced.
**Made by:** Hamish King (Founder/Operator), 2026-07-16, discovered live when the operator's own account hit the flat 5-journey cap.
**Revisit trigger:** If the product later needs a genuine plan-tier distinction beyond "has credits or not" (e.g. different paid tiers with different behavior), revisit whether a formal `plan_tier` field is needed.
---
**2026-07-16 | GAP | definition-of-ready (H-GOV)**
**Decision:** H-GOV satisfied via the operator's direct in-session instruction to short-track this fix — same precedent as `pcr-s1` and `tst-s1`.
**Made by:** Claude (agent), definition-of-ready, 2026-07-16
**Revisit trigger:** Same as pcr-s1's/tst-s1's — resolve once, applies to all three.
---

## Architecture Decision Records

<!-- Add further ADRs as needed. -->
