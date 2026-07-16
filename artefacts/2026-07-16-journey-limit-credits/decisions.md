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
**2026-07-16 | ARCH | outer-loop correction (premise invalidated)**
**Decision:** The 2026-07-16 discovery entry above (ARCH, "credit-balance-based bypass, since none exists") is **superseded**. Investigation was performed by reading `src/web-ui/modules/tenant-plan.js` directly from the operator's main checkout working directory, which was ~14 commits behind `origin/master` at the time (a known, pre-existing divergence caused by uncommitted unrelated work blocking a clean pull, unrelated to this story) — that stale copy showed pure count-only cap logic with no plan/credit awareness at all. Re-reading `origin/master`'s actual current file (via a fresh worktree checked out from `origin/master`) shows `bri-s3.5` already shipped a paid-plan bypass: `checkJourneyCap` already returns `allowed:true` when `getPlanState(tenantId)` is `{plan:'paid', status:'active'}`, and `billing.js`'s Stripe webhook handlers already call `setPlanState`. The real, previously-unknown defect: that plan state lives in a plain in-memory `Map()` with zero persistence, so any server restart silently reverts every tenant to the default trial state. This is a materially different (and more serious) finding than "no bypass exists" — it explains the operator's exact real-world symptom (a real paying-equivalent account hitting the trial cap) as a durability bug in already-shipped code, not a missing feature. The story, test plan, and DoR have all been rewritten to fix the real defect (persist plan state to Postgres) rather than the originally-assumed one (add a credits-based bypass that turned out to already exist in a different form).
**Alternatives considered:** Proceed with the original credit-balance-based bypass anyway, layered on top of the existing (buggy) plan-state mechanism — rejected, since it would leave the real, more likely-to-recur defect (in-memory state loss on every deploy) unfixed while adding a second, overlapping bypass path, increasing complexity for no benefit once the actual root cause was known.
**Rationale:** This is exactly the class of error this repo's `CLAUDE.md` and this session's own established discipline exist to catch — "verify against the real, current code, not a stale/assumed copy" — caught here by the dispatched coding agent itself noticing the discrepancy between the story's stated "current state" and the file it was actually looking at, and stopping to check rather than proceeding on the wrong premise.
**Made by:** Claude (agent) + Hamish King (Founder/Operator), 2026-07-16, following the coding agent's own investigation.
**Revisit trigger:** None — this is the corrected, final scope.
---
**2026-07-16 | ARCH | coding agent (fail-open scope for the new planStateDb adapter)**
**Decision:** `getPlanState` catches *any* error from the wired adapter (both "Adapter not wired" and a genuine DB read failure) and falls back to the safe default (`{plan:'trial', status:'active'}`) — it does not distinguish the two cases. `setPlanState` also catches and logs (never throws) on any write failure, so a Stripe webhook handler's `await setPlanState(...)` can never cause the handler to fail to respond 200 to Stripe. `checkJourneyCap` inherits this: it can never throw, and a persistence-layer failure of any kind degrades to the pre-existing count-cap behavior, never to unconditional unlimited access.
**Alternatives considered:** (1) Catch only the specific "Adapter not wired" error and let genuine DB errors propagate — rejected, because `getPlanState` is read on every journey-creation attempt; letting a transient DB outage 500 unrelated journey-creation requests (or block Stripe webhook processing) is a worse outcome than temporarily over-restricting a paid tenant to the trial cap until the DB recovers. (2) Retry-then-fail-closed (block all journeys) on adapter error — rejected, since blocking legitimate trial-tier usage on a DB hiccup is a bigger blast radius than one paid tenant briefly seeing the trial cap, which is the exact defect this story exists to minimize the frequency of, not reintroduce under a different trigger.
**Rationale:** The safe direction for this specific gate is always "apply the pre-existing, already-shipped count cap" — never "grant unlimited access" and never "500 the request." Both of the rejected alternatives risk the wrong failure direction (a full outage escalating to a worse symptom for either free or paid tenants) for a low-probability, self-healing condition (the DB read recovers on its own once whatever caused the transient error clears).
**Verified by:** `check-jlc-s1-credit-based-journey-cap.js` U2/U3 (unwired adapter) prove no throw and correct fallback; U4/U5 prove the plan-state gate's paid/downgraded decisions are unaffected when the adapter *is* healthy — the two paths are tested independently.
**Made by:** Claude (agent), coding agent execution, 2026-07-16.
**Revisit trigger:** If a future story needs to distinguish "adapter genuinely down" (e.g. to page on-call) from "adapter never wired" (a config gap), add distinct error typing at that time — today both degrade identically because the safe fallback is the same either way.
---

## Architecture Decision Records

<!-- Add further ADRs as needed. -->
