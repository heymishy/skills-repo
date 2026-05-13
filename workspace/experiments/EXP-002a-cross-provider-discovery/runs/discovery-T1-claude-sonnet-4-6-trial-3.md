# Discovery Report: Automated Payment Retry Mechanism

---

## What I'm Working With

You've given me a well-scoped problem with clear constraints. Before moving toward solution design, I want to surface assumptions, risks, and decision points that will determine whether this MVP succeeds — or creates new problems at higher volume. Several of these will need answers before implementation starts.

---

## The Core Problem, Restated

You have a classification problem disguised as a queue management problem. The real issue is that **all failures look the same to your system**, so humans have to do the classification work. The operations team isn't providing value during triage — they're compensating for missing logic.

At 40,000 payments/day with 12% failure rate, you're handling roughly 4,800 failures daily. About 576 of those are retryable by your estimate. That number doubles next month. The intervention is sound in principle. The risk is in the implementation details.

---

## Clarifying Questions That Need Answers

These aren't rhetorical. Each one gates a design decision.

**On failure classification:**

- Where does the 12% retryable estimate come from? Historical analysis, industry benchmarks, or intuition? If it's not from your own transaction data, the real number could be materially different — and the system's behaviour changes significantly if it's 5% or 25%.
- Do you have a documented mapping of failure/decline codes to retryable vs permanent today, or does the operations team carry this knowledge in their heads? If it's tacit knowledge, extracting it is a discovery task in itself.
- Which payment gateways and issuers are in scope? Decline codes are not standardised across networks. A `05 - Do Not Honour` from one issuer can be temporary; from another it signals fraud. The classification logic must be per-gateway, not generic.

**On retry behaviour:**

- What's the maximum number of retry attempts before a retryable failure is escalated to manual review?
- What's the acceptable retry window — hours, days? Some retryable failures (insufficient funds) resolve in 24 hours; others (network timeout) should be retried in seconds.
- Who owns the retry schedule? Is it uniform across all retryable codes, or does it vary by failure type? These are meaningfully different implementations.
- Do merchants have existing retry policies you need to respect or avoid conflicting with? If a merchant is already retrying on their side and your system also retries, you risk duplicate charges.

**On the queue:**

- What system manages the failed payments queue today? Is this a database table, a message queue, a third-party tool? The integration approach changes entirely depending on the answer.
- Are failed payments immutable once written, or can their status be updated in place? You need to track retry attempts, outcomes, and timestamps somewhere.
- What happens to a payment record when a retry succeeds? Does it exit the failed queue, move to a resolved state, trigger downstream reconciliation? The operations team currently owns this hand-off.

**On volume and timing:**

- Are the 4,800 daily failures distributed evenly, or are there peaks — end of business day, payroll runs, specific merchant settlement windows? Retry logic hitting an issuer during peak load can worsen transient failures rather than resolving them.
- What's the latency expectation for a retry attempt? Near-real-time (seconds after failure), batched (every N minutes), or scheduled (retry window defined per failure type)?

---

## Risks I'd Flag Before You Build

**Risk 1: Classification accuracy is the load-bearing assumption**

If the retryable/permanent classification is wrong, you're not saving operations time — you're automating bad decisions at scale. A false positive (retrying a permanent failure) can trigger fraud flags at the issuer, degrade your gateway relationship, or result in a declined-then-charged scenario if the retry succeeds when it shouldn't. This needs validation against real historical data before the retry logic goes live.

**Risk 2: Duplicate charge exposure**

Automatic retries on payment failures carry inherent duplicate charge risk. If a payment fails with a network timeout, the original transaction may have actually settled — the timeout was on the response, not the transaction. Retrying without idempotency controls can result in the customer being charged twice. This is not a fraud screening concern (which you've scoped out), but it's a fundamental payment integrity concern. You need idempotency keys on every retry attempt.

**Risk 3: The operations team's 2-3 hours isn't just classification**

Manual triage often involves more than reading a failure code. Operators may be cross-referencing merchant history, checking for patterns that suggest a larger issue, making judgment calls on edge cases, and communicating with merchants. If you remove their triage time but they're still needed for the 88% permanent failures plus edge cases, their actual workflow may not shrink as projected. Talk to them about what they're actually doing during those 2-3 hours.

**Risk 4: Retry amplification under load**

If a gateway or issuer is experiencing degraded service, your retry mechanism will fire on a large number of transient failures simultaneously — hitting an already-stressed downstream system. You've scoped circuit breakers out, which is reasonable for MVP, but you need at minimum a rate limit on retry attempts and a way to pause retries if a downstream system appears to be in an incident. Without this, the mechanism can make an outage worse.

**Risk 5: Merchant-side conflict**

You've scoped out the merchant-facing dashboard, which is pragmatic. But merchants who are currently manually retrying on their side don't know your system is now also retrying. Before go-live, merchants need to know that retryable failures are being handled automatically and they should not retry on their end. This is a communication and onboarding task, not just an engineering one.

---

## Assumptions Worth Making Explicit

These are things the MVP appears to take as given. Each one could be wrong.

| Assumption | Why It Matters |
|---|---|
| Failure codes are reliable indicators of retry eligibility | If codes are sometimes incorrect or missing, classification fails silently |
| The 12% retryable rate is stable across merchants | New high-volume merchants may have different profiles — different issuers, geographies, payment types |
| A successful retry completes downstream reconciliation automatically | If manual steps are still needed after a retry succeeds, triage time doesn't drop as expected |
| Operations staff have capacity to handle permanent failures faster once retryable ones are removed | If the team is bottlenecked by process, not volume, removing retryable failures may not free up the expected time |
| Exponential backoff parameters are known | The actual backoff schedule (initial delay, multiplier, max delay, max attempts) hasn't been specified and will affect both retry success rates and downstream load |

---

## What I'd Validate Before Writing Any Code

**Step 1: Mine your historical failure data**

Pull the last 90 days of failed payments. Map each failure code to its actual outcome — was it retried manually? Did it succeed? This gives you a real retryable rate, the actual code distribution, and empirical evidence for which codes should be classified as retryable. If this analysis hasn't been done, the 12% figure is unvalidated and the classification logic will be built on guesswork.

**Step 2: Interview the operations team**

Spend an hour watching someone do the manual triage. Not asking them to describe it — watching it. The gap between what people say they do and what they actually do is where the hidden complexity lives. You're likely to find edge cases, exceptions, and downstream steps that aren't captured in the current problem statement.

**Step 3: Audit gateway-specific decline code behaviour**

Request decline code documentation from each gateway in scope. Identify which codes genuinely map to transient vs permanent across each one. This is the core business logic. It should be explicit, documented, and reviewable — not buried in code.

**Step 4: Clarify the idempotency story with your payment engineering team**

Before retries go anywhere near production, confirm how idempotency is handled for each gateway integration. This is the duplicate charge question. If the answer is "we'd need to add idempotency keys," that's a prerequisite to the retry mechanism, not a later concern.

---

## MVP Scope Pressure-Test

Your proposed MVP is reasonable but a few boundary conditions need tightening.

**What's well-scoped:**
- Queue reading and classification
- Exponential backoff on retryable failures
- Permanent failures stay in queue for manual review
- Operations triage time as the primary success metric

**What needs more definition before implementation:**
- Maximum retry attempts per payment (without this, you have infinite loops)
- Retry window per failure type (without this, you have no basis for the backoff schedule)
- What a "successful retry" means in terms of downstream state changes
- Rate limiting on retry volume to protect downstream systems
- How retry history is stored and observable — even without a merchant dashboard, your operations team needs to see what the system has attempted

**What's missing from the out-of-scope list:**
Consider explicitly scoping out: retry attempt audit logging (it should be in scope, but if it's not stated, it will be cut under schedule pressure), alerting when retry success rate drops below a threshold, and the merchant communication process. Leaving these unstated means they either get built poorly or don't get built at all.

---

## Recommended Next Steps

1. **Data analysis first** — run the historical failure code analysis before committing to implementation. Two days of analysis could materially change the classification logic and validate (or challenge) the 12% assumption.

2. **Produce a failure code classification document** — a living document that maps each code, per gateway, to its retry eligibility, recommended backoff, and maximum attempts. This becomes the specification for the classification logic and a reference for operations staff.

3. **Confirm idempotency handling** with payment engineering — this is a go/no-go question for the retry mechanism.

4. **Define retry parameters explicitly** — max attempts, backoff schedule, retry window per failure category. These drive the implementation and the downstream load profile.

5. **Brief the operations team on what changes** — specifically, what they will and won't see in the queue once the mechanism is live. Their workflows will need to adjust.

6. **Set a monitoring requirement alongside the MVP** — at minimum, retry attempt count, retry success rate by failure code, and queue depth over time. You need observability from day one to know if the system is working and to catch classification errors early.

---

## What Good Looks Like After MVP

The success metric you've set — triage time under 30 minutes/day — is measurable and appropriate. A few additions worth tracking:

- Retry success rate by failure code (validates classification quality)
- Time-to-resolution for retryable failures (were they resolved faster than before?)
- False positive rate — permanent failures incorrectly classified as retryable (the costly failure mode)
- Queue depth trend as new merchants onboard (the scaling stress test)

If the mechanism is working, you should see operations triage time drop, retry success rate stabilise around the rate seen in historical manual retries, and queue depth remain manageable as merchant volume doubles. If you see retry success rate significantly below historical rates, your classification logic or backoff schedule needs adjustment.

---

The problem is well-understood and the intervention is the right kind. The main work before implementation is making the implicit explicit — failure code classification, idempotency, retry parameters, and what the operations team actually does during triage. Those answers will determine whether this is a two-week build or a more complex one.