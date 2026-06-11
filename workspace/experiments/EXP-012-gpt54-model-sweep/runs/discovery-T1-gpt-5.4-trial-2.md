Got it — here’s a structured discovery summary for this problem/opportunity.

## Problem / Opportunity
Failed card payments are currently handled through a single manual review queue, regardless of whether the failure is temporary or permanent. Around **12% of failed payments are actually retryable** (for example: transient gateway issues, network timeouts, temporary issuer declines), but they are not being automatically retried.

This creates three main issues:

- **Operations inefficiency:** the payment operations team manually triages all failed payments, spending **2–3 hours per day**.
- **Merchant uncertainty:** merchants don’t know whether a payment should be retried, which leads to confusion and disputes.
- **Finance overhead:** disputes and reconciliation become more complex because retryable failures are not handled consistently.

With two new high-volume merchants onboarding next month, the failed-payment review volume is expected to **double**, making the current manual approach unscalable.

## Who experiences the problem
- **Payment operations team:** high manual triage burden
- **Merchants:** lack of clarity on retry behavior
- **Finance team:** added dispute and reconciliation work

## Why this matters now
- Existing process is already costly in time
- Volume is about to increase significantly
- Manual triage will not scale with onboarding growth

## Proposed MVP
Build an automated retry mechanism that:

1. Reads from the failed payments queue
2. Classifies failures as:
   - **Retryable**
   - **Permanent**
3. Automatically retries retryable failures using **exponential backoff**
4. Leaves permanent failures in the queue for manual review

## Out of scope
- Circuit breaker / retry suppression logic
- Fraud screening changes for retried payments
- Merchant-facing retry status dashboard
- Upstream error handling changes

## Success criteria
- Retryable failures no longer require manual triage
- Operations triage time decreases from **2–3 hours/day** to **under 30 minutes/day**

## Concise problem statement
We need to reduce manual failed-payment triage by automatically identifying and retrying temporary payment failures, so operations can focus only on permanent failures as payment volume grows.

## Key assumptions worth validating in discovery
To make this MVP successful, I’d want to validate:

- Failure codes can be reliably mapped into **retryable vs permanent**
- Retrying these payments is operationally safe and won’t create duplicate capture/authorization issues
- Exponential backoff timing can fit within gateway/issuer/payment lifecycle constraints
- Queue events contain enough data to support automated retry decisions
- Success can be measured through retry recovery rate, triage reduction, and dispute reduction

## Suggested discovery questions
1. What are the top failure codes by volume?
2. Of those, which are truly safe to retry automatically?
3. How many retries should be attempted, and over what time window?
4. What idempotency protections exist today?
5. What happens if a retry succeeds after a merchant has already taken manual action?
6. How should retries be logged/audited for ops and finance?
7. What are the SLA or latency expectations for retry attempts?

If you want, I can next turn this into a **clear discovery brief**, **problem statement + goals/non-goals**, or a **set of MVP requirements and edge cases**.