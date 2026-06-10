

# Discovery Report: Automated Payment Retry Mechanism

## 1. Problem Definition

**Core problem:** Retryable payment failures (≈12% of all failures) are treated identically to permanent failures, creating a manual triage bottleneck that costs 2-3 hours/day and will double when new merchants onboard.

**What I understand clearly:**
- 40,000 payments/day → some failure rate → ≈12% of failures are retryable
- Failed payments land in a single queue with no classification
- Operators manually inspect each failure to decide: retry or escalate
- Merchants lack visibility into whether a failure is transient or permanent
- Two high-volume merchants onboarding next month creates a hard scaling deadline

**What I need to clarify before proceeding (listed below in §2).**

---

## 2. Open Questions

These are the things I'd want answered before writing a design document. I've grouped them by risk level — the first group could change the shape of the solution.

### Shape-changers (answer these first)

| # | Question | Why it matters |
|---|----------|---------------|
| 1 | **What's the actual daily failure count?** You said 12% of failures are retryable, but what's the total failure rate? If it's 2% of 40k (800 failures/day, ~96 retryable), that's a very different queue depth than 10% (4,000 failures, ~480 retryable). This sizes the system. | Throughput requirements, backoff timing windows, and whether batch vs. real-time retry matters. |
| 2 | **Where does the failed payments queue live?** Is it a database table with a status column? A message queue (SQS, RabbitMQ, Kafka DLQ)? A file? | Determines whether we poll, consume events, or need to build the queue abstraction ourselves. |
| 3 | **What payment gateway(s) are involved, and do they have idempotency keys?** If we retry a payment and the gateway doesn't support idempotent requests, we risk double-charging. | This is a correctness constraint, not a nice-to-have. If there's no idempotency mechanism, we need to build or verify one before any retry logic ships. |
| 4 | **Is there a canonical list of failure/decline codes your gateway(s) return?** Or are operators using tribal knowledge to classify retryable vs. permanent? | We need a definitive mapping to automate classification. If this doesn't exist yet, creating it is the actual first deliverable. |
| 5 | **What are the gateway's rate limits and retry policies?** Some gateways impose their own retry windows or will block merchants who retry too aggressively. Card networks (Visa, Mastercard) have explicit reattempt rules (e.g., Visa's 15-day / 15-attempt limits). | Violating network retry rules can result in fines or merchant account suspension. The backoff strategy must comply with these constraints. |

### Important but won't change the architecture

| # | Question | Why it matters |
|---|----------|---------------|
| 6 | **What does "retry" mean mechanically?** Is it re-submitting the same API call to the gateway? Creating a new payment intent? Triggering a downstream service? | Determines the retry action implementation. |
| 7 | **How do operators triage today?** Is there a UI, a database query, a spreadsheet? What decision do they make and what action do they take? | We need to make sure the automated path produces the same output the operator would, and that the remaining manual queue is presented in the same workflow. |
| 8 | **What's the merchant notification flow today when a payment fails?** Do they get a webhook, email, nothing? | If merchants currently get a "payment failed" notification immediately, and we later retry successfully, we need to make sure the success notification follows and doesn't create confusion. |
| 9 | **Are there payments that are technically retryable but shouldn't be retried for business reasons?** (e.g., high-value transactions, specific merchant categories, flagged accounts) | May need a lightweight exclusion/override mechanism even in the MVP. |
| 10 | **What observability exists today?** Logging, metrics, alerting on the payments pipeline. | Determines how much instrumentation we need to build vs. plug into. |

---

## 3. What I Think the Solution Looks Like (Pending Answers Above)

This is a preliminary sketch, not a commitment. Sharing it now so you can tell me where my assumptions are wrong.

```
┌─────────────┐
│  Payment     │
│  Processing  │
│  Pipeline    │
└─────┬───────┘
      │ payment fails
      ▼
┌─────────────┐
│  Failed      │
│  Payments    │
│  Queue       │
└─────┬───────┘
      │
      ▼
┌─────────────────────────┐
│  Failure Classifier      │
│                          │
│  • Reads failure code    │
│  • Looks up code in     │
│    retryable/permanent   │
│    mapping table         │
│  • Tags payment record   │
│    as RETRYABLE or       │
│    PERMANENT             │
└─────┬──────────┬────────┘
      │          │
  RETRYABLE   PERMANENT
      │          │
      ▼          ▼
┌──────────┐  ┌──────────────┐
│  Retry    │  │  Manual       │
│  Queue    │  │  Review Queue │
│           │  │  (existing)   │
└─────┬────┘  └──────────────┘
      │
      ▼
┌─────────────────────────┐
│  Retry Executor          │
│                          │
│  • Exponential backoff   │
│    (e.g., 1m, 5m, 15m,  │
│    1h, 4h — TBD)        │
│  • Max retry count (TBD) │
│  • Idempotent submission │
│  • On success: mark PAID │
│  • On permanent failure: │
│    move to manual queue  │
│  • On retryable failure: │
│    re-enqueue with       │
│    incremented counter   │
└────────���────────────────┘
```

### Key components:

1. **Failure Code Mapping Table** — A configuration-driven (not hardcoded) lookup of `failure_code → retryable | permanent`. Operators can update this without a code deploy. This is the single most important artifact.

2. **Failure Classifier** — Reads from the failed payments queue, classifies, and routes. Stateless, idempotent.

3. **Retry Executor** — Picks up retryable payments, applies backoff schedule, enforces max attempts, and handles the three terminal outcomes (success, permanent failure, max retries exhausted).

4. **Audit trail** — Every classification and every retry attempt is logged with timestamp, attempt number, failure code, and outcome. Non-negotiable for a payments system.

### What I'm deliberately keeping simple in the MVP:

- **Backoff is time-based, not adaptive.** We're not learning optimal retry windows from historical data. A fixed exponential schedule is good enough to start.
- **No partial retry logic.** A payment either retries as a whole or it doesn't.
- **Classification is code-based only.** We're not inspecting response body text or doing fuzzy matching. If the failure code isn't in the mapping table, it defaults to PERMANENT (safe default).
- **No merchant-specific retry policies.** All merchants get the same retry behavior. This is explicitly out of scope but will almost certainly be requested after launch.

---

## 4. Risks I'm Watching

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Double-charging** — retry succeeds but original payment also eventually settles | **Critical** | Verify idempotency key support with gateway before building anything. If not supported, this becomes the first engineering task. |
| **Card network compliance** — exceeding Visa/MC reattempt rules | **High** | Research specific network rules, encode them as hard limits in the retry executor that cannot be overridden by the mapping table. |
| **Retry storms** — if a gateway is down, retrying aggressively makes it worse | **Medium** | Even though circuit breaker is out of scope, we need at minimum a global pause switch. One-line config to stop all retries. This is cheap to build and critical for incidents. |
| **Misclassification** — a code marked retryable is actually permanent for certain issuers | **Medium** | Start with a conservative mapping (fewer codes marked retryable). Monitor retry success rate per failure code. Expand the retryable set over time with data. |
| **Notification confusion** — merchant gets "failed" then "succeeded" | **Medium** | Understand current notification flow (Question #8) before shipping. May need to delay the failure notification for retryable payments or send a "retrying" status. |

---

## 5. Suggested Next Steps

1. **Answer the shape-changer questions (§2, #1-5).** I specifically need the queue technology, gateway idempotency story, and failure code inventory before I can write a real design.

2. **Build the failure code mapping table.** Pull the last 90 days of failure codes, frequency, and what operators actually did with them. This is the foundation of the classifier and can be done in parallel with engineering design.

3. **Check card network retry rules.** Visa Account Updater rules, Mastercard's reattempt guidelines. These are hard external constraints that will shape the backoff schedule and max retry counts.

4. **Once the above are answered**, I'll produce a detailed technical design document with: data model, API contracts, backoff schedule specifics, deployment plan, rollout strategy (likely: shadow mode first, then auto-retry for a single low-risk failure code, then expand), and monitoring/alerting requirements.

---

**What would you like to drill into first?** I'd suggest starting with the five shape-changer questions — particularly #2 (queue technology), #3 (idempotency), and #4 (failure code inventory), since those three answers will determine whether this is a two-week build or a two-month build.