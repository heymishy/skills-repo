# Discovery: Automated Payment Retry Mechanism

## What I'm Working From

Before diving in, let me name what I'm treating as **established** versus what needs interrogation:

**Taking as given:** The problem is real, the scale pressure is real, the MVP direction is reasonable.

**Worth pressure-testing:** Several assumptions embedded in the brief could quietly undermine the build if left unexamined.

---

## Risks and Open Questions

### 1. The Classification Problem Is Harder Than It Looks

The brief frames this as "classify failure codes as retryable vs permanent" — but failure codes are unreliable signals in practice.

**The issue:** The same decline code (e.g., `05 - Do Not Honor`) can be temporary or permanent depending on issuer, time of day, card type, and recent transaction history. Issuers reuse codes inconsistently. A rule-based classifier on codes alone will have meaningful false positive and false negative rates.

**Questions to answer before building:**
- Where is the retryable/permanent classification coming from? Human-curated code list? Heuristics? Something else?
- What's the acceptable false positive rate — retrying something that's genuinely permanent? That generates issuer friction, can flag the merchant for unusual retry patterns, and in some cases violates network rules (Visa and Mastercard have explicit rules against retrying certain decline codes).
- Who owns the classification list and how does it stay current when gateways change their error taxonomies?

**Recommendation:** Treat classification as a first-class component with its own accuracy requirements, not an implementation detail.

---

### 2. Retry Rules Are Partially Owned by Networks, Not You

This is the highest-severity risk in the brief and it isn't mentioned.

Visa's Retry Rule (effective April 2021, updated since) prohibits retrying a transaction declined with specific codes beyond defined limits — typically once in 24 hours, or not at all for hard declines. Mastercard has equivalent rules. Violations result in fines per transaction.

**This means:**
- Exponential backoff is not sufficient. The retry schedule must respect per-code, per-network retry windows.
- Some codes that look "transient" (network timeout on your side) may have already been declined at the issuer — retrying them without checking counts against network limits.
- You need a retry attempt ledger per payment, not just a queue state flag.

**Questions to answer:**
- Has legal/compliance reviewed the retry logic against current Visa/MC retry rules?
- Does your gateway expose the original network response code, or only a translated internal code? (This matters — you need the raw code to apply the right rule.)
- How will you track retry counts per payment per network to enforce per-code limits?

**Recommendation:** Get compliance sign-off on the retry ruleset before writing production code. This is a blocker, not a nice-to-have.

---

### 3. The Queue Architecture Is Unspecified

The brief says "reads the failed payments queue" but doesn't say what that queue is.

**This matters because:**
- If the queue is a database table being polled, you have concurrency and double-processing risks when volume doubles.
- If two retry workers pick up the same failed payment, you can process a duplicate charge — this is a compliance and merchant trust problem.
- At 40,000 payments/day (doubling to ~80,000), queue throughput and ordering guarantees become non-trivial.

**Questions to answer:**
- What is the actual queue substrate? (Database table, SQS, Kafka, Redis, something else?)
- Is there existing idempotency key infrastructure on the payments side? Retries must carry the same idempotency key as the original attempt, or the gateway may process them as new transactions.
- What happens to a payment in the queue if the retry worker crashes mid-flight?

---

### 4. The 12% Retryable Figure Needs Validation

The brief states "about 12% of failures are retryable" — but it's unclear where this number comes from.

**Why it matters:** If the actual retryable rate is higher (say, 20-25%), the operations team's current manual triage is catching permanent failures that automation would mis-classify as retryable and needlessly retry. If it's lower, the ROI case is weaker.

**Questions to answer:**
- Is the 12% based on systematic analysis of historical decline codes, or an approximation from spot-checking?
- Has anyone run a retrospective: of the retryable failures that were manually retried, what was the success rate? (If it's low, the codes being classified as retryable may not actually be transient.)
- Is the 12% stable across merchant types, payment methods, and time of day, or does it vary significantly?

---

### 5. Success Metric Has a Gap

"Operations team triage time drops to under 30 minutes/day" measures effort reduction, not outcome quality.

**The missing metrics:**
- **Retry success rate:** What percentage of retried payments succeed? If it's very low, you're adding infrastructure for marginal recovery.
- **Retry failure escalation path:** When an automated retry fails, what happens? It presumably goes back to the manual queue — but now it has additional metadata (retry attempts, timing) that the operator needs to interpret.
- **False positive rate on classification:** How many "permanent" failures are being auto-retried and generating network friction?
- **Merchant reconciliation clarity:** Merchants currently raise disputes because they don't know whether to retry. Does automated retry solve this, or do merchants now see payments that were retried multiple times with mixed statuses, which may be more confusing?

**Recommendation:** Add to the success criteria:
- Retry success rate > X% (to be determined from historical data)
- Zero network rule violations in first 90 days
- Merchant dispute rate on retried payments does not increase

---

### 6. The Manual Queue Experience After Automation

The brief focuses on reducing triage time but doesn't redesign the manual review experience for permanent failures.

**The emerging problem:** Once retryable failures are automated, the remaining manual queue will be 100% hard failures — which are typically more complex to resolve. The queue may be smaller but each item is harder. Does 30 minutes/day still hold?

**Also:** If operators were previously pattern-matching across the full mixed queue, removing the easy retryable cases might actually make it harder to spot systemic issues (e.g., a gateway outage causing elevated failures that looks like normal volume in a smaller queue).

---

## Suggested Additions to Scope

These are small enough to not blow the MVP but significant enough that omitting them creates downstream problems:

| Item | Why It Belongs in MVP |
|---|---|
| Retry attempt ledger per payment | Required for network rule compliance; also needed for debugging |
| Compliance-reviewed code classification list | Without this, you're guessing at a regulated boundary |
| Idempotency key pass-through on retries | Prevents duplicate charges; this is a correctness issue |
| Retry outcome logging with reason codes | Needed to measure retry success rate and improve classification over time |

---

## What I'd Want to Know in the Next Week

**Highest priority:**

1. Get the raw decline code distribution from the last 90 days. Validate the 12% figure and understand which specific codes are being treated as retryable.

2. Pull the current Visa/MC retry rules (or get a 30-minute call with your payment compliance contact) and map your proposed code list against them.

3. Confirm idempotency key behavior with your gateway: does retrying a payment with the same key return the original result, deduplicate, or process as new?

**Medium priority:**

4. Interview two or three operators who do the current triage. Understand what they're actually doing beyond "classifying codes" — there's likely tacit knowledge in that 2-3 hours that isn't captured in the brief.

5. Clarify queue substrate and concurrency model before the engineering kickoff.

---

## What Looks Solid

To be clear about what the brief gets right:

- The problem is well-defined and the scale pressure is a legitimate forcing function
- Keeping circuit breaker logic and fraud screening out of scope is correct — those are real concerns but they'd sink an MVP
- Exponential backoff is the right general approach; it just needs to be bounded by network rules, not just time
- The distinction between retryable and permanent is the right conceptual split; the challenge is implementing it accurately

---

## Summary Recommendation

**The MVP direction is sound. Two things need resolution before engineering starts:**

1. **Compliance review of the retry ruleset.** This is a regulatory and financial risk, not an engineering preference. It should happen in the next week, in parallel with technical scoping.

2. **Validation of the 12% figure and the classification logic.** The retry mechanism is only as good as the classification. Treat this as a data problem first — pull the historical code distribution, map it to proposed retry rules, and sanity-check the recovery rate before building the automation around it.

Everything else is either solvable during build or addressable in a fast follow. These two are the ones where building first and asking questions later has real downside.