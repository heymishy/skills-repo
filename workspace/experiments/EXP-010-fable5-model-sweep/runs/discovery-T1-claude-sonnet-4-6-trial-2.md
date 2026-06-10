# Discovery: Automated Payment Retry Mechanism

## What I'm Working With

Before diving in, let me name what's clear, what needs pressure-testing, and what's genuinely unknown. The problem is well-articulated and the forcing function (merchant onboarding) is real. But there are several assumptions baked into the MVP framing that are worth examining before you commit to a design.

---

## Clarifying Questions Worth Answering Before You Build

These aren't blockers, but each one changes the design in meaningful ways. I'd want answers to these before writing a line of implementation.

**On the classification logic:**

- Where does your 12% retryable estimate come from? Is this from a sample audit, or is someone's intuition? The retry logic depends entirely on having a reliable, up-to-date mapping of failure codes to retryable/permanent. If that mapping doesn't exist in a structured form today, building it is a significant piece of work, not a footnote.
- Who owns the failure code mapping? Payment networks update decline codes. Card schemes change behaviour. If this mapping lives in code, it becomes a maintenance liability. If it lives in config, who updates it and how often?
- Do your gateway, issuer, and network failures all surface the same code structure? Many processors surface their own proprietary codes on top of scheme codes. You may have three or four different code vocabularies to normalise before you can classify anything.

**On retry behaviour:**

- What does "exponential backoff" mean in your context? Retrying a declined card 8 times over 48 hours is very different from retrying twice over 10 minutes. The right answer depends on your merchant contracts, your processor's rate limits, and card scheme rules (Visa and Mastercard both have retry rules with fee implications for non-compliance).
- Are you aware of the card scheme retry rules? Visa's retry rules (introduced 2019, updated since) limit how many times you can retry a declined transaction within a time window, with fines for violations. This isn't optional compliance. If your retry logic doesn't encode these rules, you could be building something that works operationally but generates scheme fines.
- What's the expected success rate on retried transactions? If 12% of failures are retryable but only 40% of those succeed on retry, the ops team still needs to handle the failed retries. Have you modelled what the queue looks like after automated retries run?

**On scope boundaries:**

- You've scoped out circuit breaker logic, but what happens if a gateway is down and you retry 500 transactions into it in 30 seconds? Even without a formal circuit breaker, you need some notion of gateway health awareness. Otherwise you risk retry storms that make the underlying problem worse.
- Fraud screening is out of scope, but have you confirmed with your fraud and risk team that retried transactions don't need re-evaluation? A transaction that failed and is being retried hours later may have a different risk profile. Even if you're not changing the fraud logic, you need sign-off that the existing controls cover retry scenarios.
- What happens to a transaction that's in the retry queue when the original payment authorisation window expires? Some payment types have time limits on capture after authorisation. Retrying outside that window may succeed at the gateway but fail at settlement.

**On success measurement:**

- How will you know a transaction was successfully retried versus successfully processed as a duplicate? If the original failure is already partially recorded somewhere downstream (in the merchant's system, in your ledger), a successful retry needs to reconcile against that record, not create a new one.
- The success metric is ops triage time under 30 minutes. But what's the failure mode you're watching for? If retry success rate is low, or if retried transactions generate a new wave of disputes, you might hit the time target while creating a different problem.

---

## What the MVP Actually Requires

Taking your stated MVP at face value and thinking through what's implied but not stated:

### The classification problem is harder than it looks

You need:

1. A structured, maintainable mapping of failure codes to `RETRYABLE | PERMANENT | UNKNOWN`
2. Normalisation logic to map gateway-specific codes to a canonical set
3. A decision on what to do with `UNKNOWN` — manual queue, retry-once-and-see, or conservative permanent treatment
4. A versioned history of this mapping, because when a code is misclassified and causes a problem, you need to know what the mapping said at the time

The 12% retryable figure suggests someone has done some of this analysis. The question is whether it's in a spreadsheet or in something the system can actually use.

### The retry loop needs more constraints than "exponential backoff"

A minimal retry policy needs to specify:

- Maximum retry attempts per transaction
- Minimum and maximum time between retries
- Whether retries are bounded by wall-clock time (e.g., don't retry after 24 hours) or by attempt count
- What happens when max retries are exhausted — does the transaction move to manual queue or get marked permanently failed?
- Whether retry scheduling is per-transaction or batched (batching is simpler but less precise)

Exponential backoff is a strategy for spacing retries. It doesn't answer any of the above questions.

### Idempotency is critical and worth calling out explicitly

Retrying a payment is inherently dangerous if your retry mechanism isn't idempotent. Before this goes anywhere near production:

- Every retry attempt needs to use a stable idempotency key that your payment gateway will recognise
- Your system needs to handle the case where a retry request times out but the charge actually succeeded at the processor
- Duplicate charge detection needs to be explicit, not assumed

This isn't an edge case. Gateway timeouts are in your list of failure types. A timeout means you don't know what happened. A naive retry can charge the customer twice.

### Observability isn't optional

For this to reduce ops burden rather than shift it, the team needs to see:

- Current queue depth split by retryable / permanent / in-retry / retry-exhausted
- Retry success and failure rates by failure code
- Retry attempt history per transaction
- Alerts when retry success rate drops (which may indicate a gateway or issuer problem)

Without this, when something goes wrong — and it will — you're back to manual investigation with less information than you had before.

---

## Risks Worth Naming Explicitly

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Card scheme retry rule violations | Medium | High — fines, potential processor relationship risk | Encode scheme rules explicitly in retry policy; get legal/compliance sign-off |
| Duplicate charges from retry on timeout | Medium | High — customer disputes, reputational damage | Idempotency keys on every retry; explicit timeout handling |
| Retry storms during gateway outages | Medium | Medium — worsens underlying incident | Basic gateway health check before retry dispatch, even without full circuit breaker |
| Misclassification of failure codes | High initially | Medium — some manual work remains, some permanent failures retried | `UNKNOWN` treated conservatively; monitoring on misclassification rate; easy mechanism to update mappings |
| Retry queue grows faster than it drains | Low-Medium | Medium — doesn't solve the scaling problem | Model retry throughput against projected failure volume before go-live |

---

## What a Phased Approach Could Look Like

Given the one-month forcing function, you can't do everything. Here's how I'd think about sequencing:

**Phase 1 — Classification only, no automated retry (1-2 weeks)**

Deploy the classification logic. Failed payments get labelled `RETRYABLE` or `PERMANENT` in the queue but nothing is automatically retried. Ops team still triages, but now they're working a sorted, labelled queue. This immediately reduces triage cognitive load, lets you validate your classification accuracy against human judgement, and gives you a baseline for retry success rate estimates.

This is low-risk and immediately valuable. It's also the foundation everything else depends on.

**Phase 2 — Automated retry for a single failure code type (2-3 weeks)**

Pick the highest-volume, lowest-risk retryable code (likely transient timeouts or a specific soft decline). Automate retry for that subset only. Everything else still goes to manual queue. Measure success rate, duplicate rate, and ops feedback. Tune the retry policy.

**Phase 3 — Expand retry coverage and add monitoring dashboard (post-merchant onboarding)**

Once you have confidence in classification accuracy and retry behaviour, expand to the full retryable set. Build the ops visibility tooling properly. This is also when you can have a more informed conversation about the merchant-facing status dashboard you've scoped out.

---

## What I'd Want to See Before Approving Implementation Work

1. **Failure code mapping document** — all codes the system currently receives, their source (gateway vs issuer vs scheme), and a human-validated classification for each. This needs sign-off from someone who knows the payment domain, not just an engineer's interpretation.

2. **Scheme retry rule summary** — a confirmed understanding of Visa/Mastercard retry rules applied to your transaction types. If you process Amex, their rules differ. This should have compliance or your processor's technical account manager in the loop.

3. **Idempotency key design** — how retry attempts are keyed, what your gateway's idempotency guarantees are, and how you handle the timeout-but-maybe-succeeded case.

4. **Retry volume model** — given current failure rates and the expected post-onboarding volume, what does the retry queue throughput need to be? Does your current infrastructure handle that without dedicated scaling work?

5. **Rollback plan** — if automated retries cause duplicate charges or a retry storm, what's the kill switch? How quickly can you disable retry dispatch without taking down the rest of the payments pipeline?

---

## Summary

The problem is real and the MVP direction is sensible. The main things I'd push back on:

- The classification problem is more work than it might appear, and getting it wrong has direct customer impact
- "Exponential backoff" needs to be a specific policy, not a phrase, before anyone can implement it safely
- Card scheme retry rules are a compliance issue that should be resolved before any automated retrying happens
- Idempotency needs to be explicit and verified, not assumed
- The phased approach — classify first, retry second — is lower risk than building both simultaneously under time pressure

The merchant onboarding deadline is a real constraint. The phased approach means you can deliver something genuinely useful in time while not shipping something that charges customers twice or generates processor fines.