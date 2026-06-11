# Discovery: Automated Retry for Failed Card Payments

Good brief — clear problem, quantified pain, named stakeholders, and a forcing function. Before this moves to solution shaping, here's what discovery surfaces.

---

## Problem Statement (restated)

~4,800 retryable payment failures per day (12% of 40k) receive the same manual treatment as permanent failures. This costs 2–3 operator-hours daily, creates merchant disputes, and will roughly double with next month's onboarding.

The core insight: **this is a classification problem first, a retry problem second.** The retry mechanism is straightforward; the classification correctness is where the risk lives.

---

## Critical Assumptions to Validate

**1. "12% are retryable" — measured or estimated?**
If estimated, we need a sample audit of the queue before sizing the win. If measured, what was the methodology? The classification taxonomy you build will live or die on this data.

**2. A reliable code→retryable mapping exists.**
Decline codes are not uniform across issuers, schemes, and gateways. Some codes are ambiguously retryable (e.g., "insufficient funds" — retryable, but not in 30 seconds). Do you have one gateway or several? Who owns the canonical mapping, and how does it get updated when a gateway changes its codes?

**3. Retries are safe to execute automatically.**
This is the biggest unstated risk. Two sub-questions:
- **Idempotency:** Does your gateway support idempotency keys? A retry that double-charges a customer is far worse than the manual triage problem. What guarantees exist that a "timeout" failure didn't actually succeed upstream?
- **Race conditions:** Can the merchant or customer retry independently while your system retries? If yes, you need dedup before retry, not just backoff.

**4. Scheme compliance permits automated retries.**
Card networks have explicit rules here that the brief doesn't mention:
- Visa caps reattempts (15 retries per transaction within 30 days) and charges **excessive reattempt fees** for violations.
- Mastercard issues Merchant Advice Codes (MAC) — some explicitly mean "do not retry" or "retry after X."
- Repeatedly retrying certain decline codes can damage your merchant/acquirer standing.

Your classifier needs to respect these, not just internal heuristics. **This may reshape the MVP** — MAC codes should probably be a first-class input to classification.

---

## Open Questions

| # | Question | Why it matters |
|---|----------|----------------|
| 1 | What's the time window in which a retry is still valid? (Auth expiry, order expiry, merchant SLA) | Defines max backoff horizon |
| 2 | How many retry attempts before giving up, and what happens then — back to manual queue, flagged differently? | Operators need exhausted-retry items distinguishable from never-retried items |
| 3 | Do merchants need to *know* a retry is in flight, even without a dashboard? | If merchants retry while you retry → duplicates. A status field on the payment record or webhook may be unavoidable scope |
| 4 | One gateway or multiple? One scheme mix or several? | Multiplies classification taxonomy effort |
| 5 | What's the current retry *success* rate when operators manually retry? | If manual retries only succeed 20% of the time, the win is triage time, not recovery revenue — changes how you sell it |
| 6 | Is there a customer-consent dimension (e.g., one-off payments vs. stored credentials / recurring)? | Scheme rules differ for merchant-initiated retries on stored credentials |

---

## Risks (ranked)

1. **Duplicate charges** from retrying ambiguous timeouts. *Mitigation: idempotency keys + status query before retry, not blind resubmission.*
2. **Scheme penalty fees / compliance breach** from retrying "do not retry" codes. *Mitigation: MAC/scheme rules in classification layer; conservative default = permanent.*
3. **Misclassification drift** — gateways change codes; mapping rots silently. *Mitigation: monitoring on retry success rate per code; alert when a "retryable" code's success rate collapses.*
4. **Load amplification** — retries during a gateway outage multiply traffic. You've scoped out circuit breakers; consider at minimum a **global retry kill-switch and rate cap** as MVP safety, even if full circuit-breaker logic stays out.

---

## Sharpening the Success Criteria

Current criteria are good but partly unmeasurable as stated. Suggested refinement:

- **Primary:** ≥X% of retryable-classified failures resolved without operator touch (set X after the sample audit)
- **Guardrail:** **Zero duplicate charges** attributable to automated retry (non-negotiable)
- **Guardrail:** Zero scheme excessive-reattempt fees incurred
- **Secondary:** Operator triage time <30 min/day (measure how — time tracking? queue dwell time as proxy?)
- **Secondary:** Retry success rate per failure code (feeds classification tuning)

---

## Suggested Next Steps

1. **Data audit (1–2 days):** Pull 2–4 weeks of queue history. Validate the 12%, build the candidate code taxonomy, and measure manual-retry success rates per code.
2. **Gateway capability check:** Confirm idempotency support and post-timeout status query availability. This is a go/no-go gate for blind retry.
3. **Compliance review:** Confirm scheme retry rules applicable to your transaction types before finalizing the classifier.

**Before proceeding to solution shaping:** Can you answer questions 1–4 above, and confirm whether the 12% figure is measured? Those answers determine whether the MVP scope holds or needs the merchant-notification and kill-switch additions.