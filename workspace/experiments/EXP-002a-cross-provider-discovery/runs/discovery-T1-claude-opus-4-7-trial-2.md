I'll work through the discovery pipeline on this. Let me push back on a few things before we lock in the framing.

## Questions and challenges

**1. The 12% number — how confident are you in it?**

You've said "about 12% of those failures are retryable." At 40k payments/day with some failure rate (let's say 5-10%, so 2,000-4,000 failures), that's 240-480 retryable failures per day. The whole business case rests on this number. Questions:

- Where does 12% come from? Sampled review, gut feel from ops, or a tagged dataset?
- Is the classification (retryable vs permanent) actually stable across issuers and card networks, or does the same decline code mean different things in different contexts?
- What's the *success rate* of retries on those 12%? If you retry 300 "retryable" failures and only 30 actually succeed on retry, the value calculation changes.

**2. Why is operator triage taking 2-3 hours if 88% are permanent?**

If 88% of the queue is permanent failures, what is the operator doing with them for 2-3 hours? Two possibilities:

- They're spending most of their time on the 12% (deciding whether to retry) — in which case automation hits the bullseye.
- They're spending time on the 88% (reconciliation, merchant comms, refund handling) — in which case automation only shaves a fraction off the 2-3 hours, and your success metric (under 30 min/day) is unreachable.

You need to know which before committing to the success criterion.

**3. Idempotency and double-charge risk**

This is the one that worries me most about the MVP as scoped. Automatic retries on payment systems have a well-known failure mode: the original request actually succeeded at the issuer but the response was lost (network timeout). Retrying produces a duplicate charge.

- Does your gateway support idempotency keys end-to-end to the issuer? Not all do.
- A "network timeout" is *exactly* the case where you cannot safely assume the payment didn't go through.
- If you retry and double-charge even 0.1% of the time, you've moved cost from the ops team to the disputes team — and made the merchant complaint problem worse, not better.

I'd argue idempotency guarantees are not out of scope; they're a precondition. If they don't exist, the MVP needs to build them.

**4. "Exponential backoff" — over what window?**

Card auths are time-sensitive. Merchants expect a payment decision in seconds to minutes, not hours. If your backoff schedule is 1min / 5min / 30min, you may exceed the merchant's checkout session, the customer's patience, or the auth hold window. What's the tolerated latency from the merchant's perspective? This shapes the retry budget.

**5. The "why now" reasoning is sound but suggests a deadline risk**

New merchants onboard next month. If the MVP isn't ready, what's the fallback? Hiring temporary triage staff? Slowing onboarding? Knowing the fallback tells us how much we should compress scope vs. ship something half-baked.

**6. Out-of-scope item that might bite you: circuit breaker**

You've explicitly excluded circuit breaker logic. But: if an issuer is having an outage and returns "temporary decline" on thousands of payments in an hour, your retry mechanism will hammer them with retries, possibly making the outage worse or getting you rate-limited. At 40k/day you might be a small enough fish that this doesn't matter — but worth checking. A minimal kill-switch (manual or threshold-based) might belong in the MVP even if a full circuit breaker doesn't.

## What I'd want to see before moving to design

- A tagged sample of, say, 500 recent failures with: failure code, whether ops retried it manually, whether the retry succeeded. This validates the 12% and gives you the retry success rate.
- Confirmation from the gateway/PSP about idempotency guarantees on retries.
- A breakdown of where the 2-3 hours actually goes (time-and-motion or operator interview).
- The merchant-side latency budget for a final payment decision.

## What I think the MVP probably should be

Close to what you've described, but with two adjustments:
1. **Idempotency handling is in scope**, not out. Without it the MVP is unsafe.
2. **A retry kill-switch** (even just a config flag ops can flip) is in scope. Without it you can't safely turn this on during an issuer incident.

Want me to proceed to shaping the next pipeline stage (design / scoping), or do you want to go answer some of the validation questions above first?