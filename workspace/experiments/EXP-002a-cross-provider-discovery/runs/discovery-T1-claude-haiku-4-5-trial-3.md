# Discovery Pipeline: Failed Payment Retry System

I'll work through this systematically to pressure-test your MVP and surface hidden assumptions.

---

## 1. PROBLEM VALIDATION

**What we're solving:**
- Manual triage of 40,000 daily payments (12% = ~4,800 failures, ~576 retryable)
- Operational overhead: 2-3 hours/day
- Merchant confusion: no clear signal on what to do
- Scaling risk: doubling volume next month

**Critical questions to answer:**

| Question | Why it matters | What we need to know |
|----------|----------------|----------------------|
| **Of the 12% retryable failures, how many succeed on retry?** | This determines actual ROI. If only 20% succeed, you're automating low-value work. | What's your historical retry success rate by failure code? |
| **What's the cost of an unwanted/duplicate retry?** | A retried payment that succeeds twice creates a bigger problem than manual triage. | What's your deduplication capability? Can you idempotency-key these? |
| **How long can a retryable failure wait?** | Exponential backoff timing depends on merchant tolerance and issuer behavior. | What SLA do merchants expect? (minutes? hours? next day?) |
| **Why do merchants raise disputes?** | Is it because they don't know retry happened, or because it failed silently? | Are you currently communicating retry status to merchants at all? |

**Red flag:** You mention merchants "don't know whether to retry or not" — this suggests they're manually retrying on their side. If your system auto-retries *and* they retry, you've created a duplicate problem.

---

## 2. MVP SCOPE PRESSURE TEST

**What you're including:**
- Automatic classification (retryable vs permanent)
- Exponential backoff retry loop
- Queue state management

**What you explicitly excluded (but should examine):**

| Excluded item | Why it might be critical anyway |
|---------------|--------------------------------|
| **Circuit breaker logic** | If a payment gateway is down for 10 minutes, exponential backoff will retry 100x. You need *some* way to detect "gateway is broken" vs "this one payment timed out." Even a simple "pause retries if 80% are failing" threshold would help. |
| **Fraud screening on retries** | If a card was declined for fraud, auto-retrying it might trigger additional fraud alerts or violate compliance. Have you checked with compliance/fraud team? |
| **Merchant webhook/status** | Merchants raising disputes suggests they don't *know* a retry happened. Even a simple notification ("payment retry scheduled") would solve the dispute problem without a full dashboard. |
| **Upstream error handling** | If the root cause is your gateway configuration timing out too fast, retrying won't fix it—it'll just mask it. Have you diagnosed *why* the timeouts are happening? |

**MVP narrowing question:** Could you get 80% of the benefit with a simpler solution?
- **Option A (current):** Full auto-retry + backoff
- **Option B (simpler):** Classification + human-in-the-loop (1-click retry UI instead of manual triage) — might be 1 week vs 4 weeks to build
- **Option C (hybrid):** Auto-retry only for the top 3 failure codes (likely 80% of retryable volume) with manual review for edge cases

---

## 3. CLASSIFICATION ACCURACY RISK

This is where your MVP is most likely to fail silently.

**Key unknowns:**

1. **Are your failure codes standardized?**
   - Gateway errors often return different codes for the same problem (timeout vs "connection reset")
   - Different issuers return different decline codes
   - Question: Do you have a normalized failure code taxonomy, or raw gateway responses?

2. **What's your ground truth for "retryable"?**
   - You say "12% are retryable" — how do you know this today?
   - Are operators manually classifying these, or do you have historical data on which ones eventually succeeded?
   - Question: Can you train a classifier on 6 months of manual triage data first, validate it, *then* automate?

3. **False positive cost:**
   - If you classify a permanent failure (e.g., "card expired") as retryable, you retry it. It fails again. Merchant gets charged again for a failed payment (if your pricing model charges per attempt). **This could be a revenue leak.**
   - Question: What's your cost per failed retry attempt? (2-3 hours/day suggests high overhead, but actual cost per retry?)

**Discovery task:** Before building the classifier, hand-audit 200 failed payments (mix of retried and permanent ones) to build a confusion matrix. This takes 4-8 hours and will reveal edge cases.

---

## 4. OPERATIONAL & SYSTEM DESIGN GAPS

**Retry timing — critical decision:**
- Exponential backoff, but over what period? (e.g., retry at T+30s, T+90s, T+5m, T+30m, then manual?)
- If you retry too fast, you hit the same network error. Too slow, and merchants are upset.
- **Question:** Have you checked issuer documentation on retry windows? Many issuers have rules about retry frequency.

**Queue state management:**
- How do you distinguish between "never retried," "retrying," "exhausted retries," and "manual review needed"?
- If a payment is in "retrying" state and an operator manually retries it, do you de-duplicate?
- **Question:** What's your queue schema? Do you have retry counters and timestamps?

**Monitoring & observability:**
- You're out of scope for a "dashboard," but you need *internal* visibility:
  - How many retries succeeded vs failed
  - Which failure codes have the highest retry success rate
  - False positive rate (retries that should never have been retried)
- **Question:** What's your instrumentation plan? This should be in the MVP.

---

## 5. STAKEHOLDER VALIDATION GAPS

**Operations team:**
- You say "triage time drops to <30 min/day" — but is that their goal, or did they say that?
- What will they do with the freed-up 2-3 hours? (Important: if there's no downstream work, you might reduce headcount—politically sensitive.)
- **Discovery:** Interview 2-3 operators: "If payments auto-retried correctly, what would you actually do differently?"

**Merchants:**
- Merchants raising disputes suggests they want *visibility*, not just auto-retry.
- Do they want to *opt in* to auto-retry, or will they distrust it?
- **Discovery:** Talk to 1-2 of the high-volume merchants coming onboard: "How would you feel if we auto-retried failed payments without telling you?"

**Finance/compliance:**
- Auto-retrying creates duplicate charges if deduplication fails. This is a compliance/fraud risk.
- Some payment networks have rules about retry limits.
- **Discovery:** Do you have compliance sign-off on the retry strategy?

---

## 6. RECOMMENDED DISCOVERY SEQUENCE (Before Building)

```
Week 1: Validate the problem
├─ Audit 200 failed payments manually
│  └─ Build confusion matrix: how accurately can you classify retryable?
├─ Interview 3 operators: what's the actual pain?
└─ Interview 1-2 merchants: retry transparency expectations?

Week 2: Refine MVP scope
├─ Analyze historical retry success rates by failure code
├─ Map failure codes to gateway/issuer documentation
├─ Define retry timing & backoff parameters
└─ Assess deduplication & fraud risk with Compliance

Week 3: De-risk implementation
├─ Prototype classifier on historical data
├─ Design queue schema & state machine
└─ Define observability/alerting (non-negotiable)

Then: Build & test with canary (e.g., 5% of queue first)
```

---

## 7. KEY DECISIONS BEFORE MVP

| Decision | Options | Recommendation |
|----------|---------|-----------------|
| **Retry scope** | All retryable codes vs. top 5 high-confidence codes | Start narrow (top 3 codes = likely 60% of retryable volume). Expand after validation. |
| **Human involvement** | Fully automatic vs. auto-classify + human approve | Hybrid: auto-retry for high-confidence codes (>95% accuracy), hold others for 1-click operator approval. |
| **Merchant comms** | Silent retry vs. notification webhook | Even a simple async webhook ("payment retry scheduled") solves the dispute problem. |
| **Circuit breaker** | Out of scope vs. simple threshold | At minimum: pause retries if >70% are failing within 5-min window. This is table-stakes reliability. |

---

## BOTTOM LINE

Your MVP is **directionally right but underspecified**. The biggest risks are:

1. **Classification accuracy** — if you misclassify permanent failures, you create more problems than you solve
2. **Deduplication** — duplicate charges are worse than manual triage
3. **Merchant trust** — silent auto-retry without visibility will generate *more* disputes, not fewer

**I'd recommend:** Spend 2 weeks on discovery before writing code. Hand-audit failures, validate the 12% assumption, talk to merchants, and build a confusion matrix for your classifier. This will either validate the MVP or reveal a simpler path (e.g., a 1-click operator UI gets 80% benefit with 20% effort).

What questions resonate most? Where do you have the most uncertainty?