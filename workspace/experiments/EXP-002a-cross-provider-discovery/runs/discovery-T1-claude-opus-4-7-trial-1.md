I'll work through this discovery with you. Let me probe some areas before we commit to the framing.

## Questions on the problem framing

**1. The 12% number — how do you know?**

You said "about 12% of those failures are retryable." Is this from:
- A sampled analysis of the queue?
- Operator self-report ("I retried about this many")?
- A mapping of decline codes to retryability?

This matters because the MVP's value depends on this number being roughly right. At 40k/day with some failure rate (let's say 3% = 1,200 failures/day), 12% retryable = ~144 retries/day. If the real number is 2% or 30%, the economics shift a lot.

**2. What happens today when a retryable failure isn't retried?**

You mentioned merchants raising disputes — but disputes about *what*? Are they:
- Asking "why wasn't this retried?"
- Charging back because the customer was charged but the merchant thinks they weren't?
- Confused about the payment state?

The dispute pattern tells you whether the real problem is *retry automation* or *retry visibility/communication*. Those have different MVPs.

**3. Who currently decides to retry, and on what basis?**

When an operator triages a failure and decides "this is retryable," what do they do? Re-submit through the same gateway? Wait some interval? Notify the merchant first? The current manual process is your spec for the automated one — and if operators are using judgement that isn't captured in decline codes alone (e.g., "this merchant prefers we don't retry small amounts"), automation will either lose that or need to encode it.

## Questions on scope and risk

**4. Idempotency and double-charge risk.**

This is the one I'd push hardest on. Automated retry on payment systems has a well-known failure mode: the original transaction *succeeded* at the issuer but the response was lost (timeout, gateway error), so it looks like a failure. Retry → customer charged twice.

- Does your gateway support idempotency keys?
- Does the failed-payments queue distinguish "definitely failed" from "outcome unknown"?
- What's your reconciliation story if a retry double-charges?

If "outcome unknown" failures are in the same queue as "definitely declined" failures, automated retry is dangerous until you separate them. This might belong *inside* MVP scope, not outside it.

**5. "Exponential backoff" — backoff against what?**

Exponential backoff makes sense for transient infrastructure failures (gateway 503, network timeout). It makes less sense for issuer declines (issuer said "insufficient funds, try later" — retrying in 200ms then 400ms then 800ms doesn't help; you need hours or a day). 

Are you treating these as one class or two? The retry strategy probably needs to be code-specific, not a single backoff curve.

**6. The new merchants next month — is the deadline real?**

If the trigger is "volume doubles next month," then:
- Building, testing, and safely deploying automated payment retry in <4 weeks is aggressive given the double-charge risk
- A faster path might be: better triage tooling for operators (rules-based queue sorting, bulk-action UI) that gets triage time down without the automation risk

Worth asking whether the *operations team scaling* problem and the *automated retry* solution are tightly coupled or whether there's a lower-risk intermediate step.

## What I'd want to see in the MVP before agreeing it's the right shape

- Explicit handling of "outcome unknown" vs "definitely failed"
- Decline-code → retry-strategy mapping (not a single backoff)
- Idempotency guarantee end-to-end
- A kill switch / rate limit (if something goes wrong, we don't retry 144k times)
- Logging that lets finance reconcile retries against original attempts

## Suggested next step

Before locking the MVP, can you pull a sample of 100-200 recent failures from the queue and have an operator classify them: retryable/not-retryable/outcome-unknown, plus *why*? That gives us:
- A real retryable rate (replacing the "about 12%")
- The actual decline-code distribution
- Cases where automation would be wrong

This is maybe a day of work and de-risks the whole thing. Want to go that direction, or would you rather I push forward on a problem brief with the current assumptions flagged?