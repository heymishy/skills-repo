

# Discovery Document: Automated Payment Retry Mechanism

## Problem Statement

Of ~40,000 daily card payments, failures enter a single queue requiring manual triage. ~12% are retryable (transient timeouts, temporary declines) but are treated identically to permanent failures. This costs the operations team 2–3 hours/day, creates merchant uncertainty about retry behaviour, and generates avoidable disputes. With two high-volume merchants onboarding next month, volume will roughly double, making the manual process untenable.

---

## Key Questions & What I Need From You

I've structured the discovery around the areas where ambiguity could derail implementation. For each, I've noted what I think the likely answer is based on what you've described, but I need you to confirm or correct.

---

### 1. The Failed Payments Queue

**What I need to understand:** The shape of the data and infrastructure we're building on top of.

- **What backs the queue?** (e.g., database table with polling, message broker like SQS/RabbitMQ/Kafka, something else?)
- **What fields exist on a failed payment record?** At minimum I'd expect: payment ID, merchant ID, amount, failure code, failure message, gateway identifier, timestamp. What else is there? Is the raw gateway response stored, or just a normalized code?
- **Is there an existing status model?** (e.g., `FAILED`, `PENDING_REVIEW`, `RESOLVED`) — or is everything just `FAILED`?
- **What happens to a record after manual review today?** Does the operator re-submit through the same gateway API, mark it as permanently failed, or something else?

**Why this matters:** If we only have a normalized failure code and not the raw response, classification accuracy depends entirely on how good the normalization is. If the queue is a database table, we need to think about row-locking and concurrent access. If it's a message broker, we need to think about visibility timeouts and dead-letter behaviour.

---

### 2. Failure Code Classification

**This is the core logic of the MVP.** Getting it wrong means either retrying payments that shouldn't be retried (financial risk) or leaving retryable payments in the queue (defeating the purpose).

- **How many distinct failure codes do you see across all gateways?** Rough order of magnitude — are we talking 20, 100, 500?
- **Do you use multiple payment gateways, or a single one?** If multiple, do they return different code schemes?
- **Does someone already maintain a mapping of "retryable" vs "permanent" codes?** Even an informal spreadsheet the ops team uses would be valuable.
- **Are there codes that are ambiguous — retryable in some contexts but not others?** (e.g., "insufficient funds" might be retryable after a delay but not immediately; "do not honour" is often a judgment call.)

**My working assumption:** We'll build a static classification table — `failure_code → retryable | permanent | ambiguous` — as the starting point. "Ambiguous" codes stay in the manual queue. This is conservative but safe for MVP. We can tighten it over time with data. **Does that approach match your risk appetite?**

---

### 3. Retry Policy

Exponential backoff is mentioned. I need to pin down the parameters because they have real financial and operational consequences.

| Parameter | What I need to know | Why it matters |
|---|---|---|
| **Max retry attempts** | How many times before we give up and mark it permanent? My instinct is 3. | Too many retries on a genuinely failing payment wastes resources and could trigger issuer velocity flags. |
| **Backoff intervals** | e.g., 1 min → 5 min → 30 min? Or longer like 1 min → 15 min → 2 hours? | Needs to match the nature of transient failures. Network timeouts recover in seconds; issuer-side issues might take hours. |
| **Retry window** | Is there a hard cutoff? e.g., don't retry if the original failure is >24 hours old? | Stale retries can cause duplicate charges if the original actually went through. |
| **Idempotency** | Does the gateway support idempotency keys? If we retry a timed-out request, can we guarantee we won't double-charge? | **This is the single highest-risk question in the entire project.** If the gateway doesn't support idempotency, retrying timeout failures is dangerous. |

**If the gateway doesn't support idempotency keys**, we need to either: (a) exclude timeout failures from automatic retry entirely, or (b) build a pre-retry check that queries the gateway for the original transaction status. Both are more complex. I need to know which world we're in before scoping effort.

---

### 4. State Machine & Observability

For the MVP, I'm proposing the following state model for a failed payment:

```
FAILED
  → RETRYABLE (classified as retryable, queued for retry)
      → RETRY_IN_PROGRESS
          → SUCCEEDED (retry worked)
          → RETRY_FAILED (single attempt failed, will retry again)
              → RETRY_EXHAUSTED (max attempts reached → moves to manual queue)
  → PERMANENT (classified as non-retryable, stays in manual queue)
```

**Questions:**
- Does anything downstream consume the payment status? (e.g., merchant notifications, reconciliation jobs, reporting dashboards?) If so, adding new states could break consumers.
- Do merchants currently receive webhook/callback notifications on failure? If we retry and succeed, do they need to be notified differently than a first-attempt success?

---

### 5. Operational Boundaries

- **Who "owns" the retry decision in production?** If the classifier gets a code wrong and retries something it shouldn't, who's accountable — and what's the blast radius? (I'm thinking about this in terms of: do we need a human-approval gate for the first N days?)
- **Should there be a kill switch?** A way to pause all automatic retries instantly if something goes wrong.
- **Merchant-level opt-out:** Should merchants be able to disable auto-retry for their payments? (You've said the merchant dashboard is out of scope, but the data model should probably support this even if the UI doesn't exist yet.)

---

### 6. Volume & Performance

- **Of the ~40,000 daily payments, how many fail?** (i.e., what's the daily ingest rate to the failed queue?) If it's 2%, that's ~800/day, of which ~96 are retryable. If it's 10%, that's 4,000/day and ~480 retryable.
- **What's the expected volume after the two new merchants onboard?** You said "double" — is that doubling total payments (80K/day) or doubling failures specifically?
- **Are there peak hours?** Retry scheduling should avoid compounding load during peak transaction times.

---

## What I Think the MVP Looks Like (Pending Your Answers)

**A background service that:**

1. **Reads** from the failed payments queue (poll or subscribe, depending on infrastructure).
2. **Classifies** each failure using a static lookup table: `retryable`, `permanent`, or `ambiguous`. Ambiguous and permanent stay in the manual queue.
3. **Schedules retries** with exponential backoff (parameters TBD per above).
4. **Executes retries** via the existing gateway API, using idempotency keys if available.
5. **Transitions state** per the state machine above.
6. **Logs every action** — classification decision, retry attempt, outcome — for audit and debugging.
7. **Exposes a kill switch** — a feature flag or config toggle to pause all retries.

**What it does NOT do (confirmed out of scope):**
- Circuit breaker logic (no adaptive behaviour based on gateway health)
- Fraud screening on retried payments
- Merchant-facing status UI
- Changes to upstream error handling

---

## Risks I Want to Flag Now

| Risk | Severity | Mitigation |
|---|---|---|
| **Double-charging on timeout retry** | **Critical** | Depends entirely on idempotency support. Must resolve before build. |
| **Misclassified failure code** | High | Start conservative — only auto-retry codes we're 100% confident about. Ambiguous → manual. |
| **Retry storm under load** | Medium | Cap concurrent retries. Don't retry during peak if volume is a concern. |
| **State transition breaks downstream consumers** | Medium | Audit all consumers of payment status before adding new states. |
| **Merchants unaware payments are being retried** | Medium | Even without a dashboard, consider whether existing notifications cover this. A retry that succeeds silently is fine; a retry that fails again and triggers a *second* failure notification is confusing. |

---

## Next Steps

I need answers to the bolded questions above — particularly around **idempotency support**, **queue infrastructure**, **failure code inventory**, and **downstream status consumers** — before I can write a meaningful technical spec.

If you can get me access to (or a sample of) the actual failure codes you see in production, I can draft the initial classification table as a concrete artifact to review with the ops team. That's probably the highest-leverage next step because it forces alignment on what "retryable" actually means in your specific payment ecosystem.

What can you get me first?