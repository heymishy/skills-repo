# Discovery Report: Automated Payment Retry Mechanism

---

## What I understand you're building

A classification and retry layer that sits between your failed payments queue and your operations team. It reads failures off the queue, splits them into retryable vs permanent based on failure codes, automatically retries the retryable ones with exponential backoff, and only surfaces permanent failures for manual review.

Before going further, I want to make sure the shape of this is right — because several decisions you'll make in the next few weeks depend on assumptions buried in the problem statement.

---

## Clarifying questions worth answering before you build

**On failure classification:**

- Where does your failure code taxonomy live today? Is there a maintained list of codes per gateway/issuer, or does the operations team carry that knowledge in their heads? This matters because if classification logic is hardcoded and undocumented, you've just automated a guess.
- Do different gateways return different codes for the same underlying condition? A soft decline from Stripe looks different from one from Adyen. Your classifier needs to handle that mapping, or it will misclassify.
- What's the cost asymmetry between a misclassification in each direction? Retrying a permanent failure (e.g. a stolen card decline) isn't just wasted compute — it can trigger fraud signals at the issuer or burn retry allowances. Failing to retry a retryable failure costs a transaction. These aren't symmetric, and your classification confidence thresholds should reflect that.

**On retry behaviour:**

- Do your gateway agreements or card scheme rules constrain retry frequency or count? Visa and Mastercard have specific retry rules for declined transactions, with fines for non-compliance. If you don't have this mapped already, this is a compliance risk, not just a design question.
- What's the intended behaviour when a retry also fails? Does it re-enter the queue as a permanent failure? Does it retry again with a longer backoff? Is there a maximum attempt count? This needs a defined state machine before you write code.
- Who owns the retry schedule configuration — engineering, operations, or both? If operations needs to tune backoff parameters without a deployment, you need a configuration layer. If they don't, you don't.

**On the queue architecture:**

- What is the failed payments queue today, technically? A database table, a message queue, something else? The answer changes how you consume from it and how you handle idempotency.
- How do you guarantee a payment isn't retried twice if the retry service restarts mid-execution? Idempotency at the retry layer is non-negotiable for financial transactions and needs an explicit design, not an assumption.

**On success measurement:**

- How will you know a retry succeeded? Do you get a synchronous confirmation from the gateway, or do you need to reconcile against a settlement report later? This affects whether your success metrics are real-time or lagged.
- The 12% retryable figure — is that measured, or estimated? If it's an operations team gut-feel number, your actual classification outcome might look quite different once you have real data.

---

## Risks I'd want to surface now

**The classification confidence problem is the core risk.**

The MVP framing implies a binary classifier: retryable or permanent. But failure codes exist on a spectrum of certainty. Some codes are unambiguously permanent (do-not-honour with fraud flag). Some are unambiguously transient (network timeout). Many are neither — soft declines that might be temporary insufficient funds, or might indicate a compromised card, depending on context. If your classifier doesn't have an explicit "uncertain" bucket that still goes to manual review, you will automate bad decisions, not eliminate them.

**Compliance is a hard constraint, not a later consideration.**

Card scheme retry rules (particularly Mastercard's excessive retry fines introduced in 2021, and Visa's VROL programme) mean that retrying outside permitted windows or counts creates direct financial liability. This needs legal/compliance sign-off on the retry schedule before you go live, not after. The "out of scope" list doesn't mention this, which concerns me.

**Doubling volume is the forcing function, but it's also a test of your retry volume assumptions.**

If 12% of 40k/day are retryable, that's ~4,800 automated retries per day. When volume doubles, that's ~9,600. Does your gateway infrastructure and rate limiting handle that retry load on top of normal transaction volume? Worth a capacity check with your gateway account team before go-live.

**Merchant communication is out of scope, but merchant expectation isn't.**

You noted merchants are raising disputes because they don't know whether to retry. If your system now retries automatically, merchants also need to know not to manually retry in parallel — otherwise you get duplicate charges. You may not need a dashboard, but you need some communication mechanism, even if it's just an ops-to-merchant email process.

---

## Assumptions worth making explicit

| Assumption | Why it matters |
|---|---|
| Failure codes are a reliable signal for retry eligibility | If codes are inconsistent across gateways, classification accuracy degrades |
| The queue is consumable in a way that supports idempotent processing | If not, retry deduplication needs to be built separately |
| A failed retry should not silently disappear | You need explicit handling for retry exhaustion |
| Operations team will accept reduced queue volume as a metric for success | Worth confirming — they may have concerns about visibility into what's being retried |
| 30-minute triage target is achievable with only permanent failures remaining | If permanent failures require deeper investigation per item, time savings may be less than expected |

---

## What a minimal slice looks like

If you wanted to derisk this before the merchant onboarding deadline, there's a smaller-than-MVP option worth considering:

**Phase 0 (2–3 days of work):** Build the classifier only. Run it in shadow mode against your existing failed payments queue. Don't retry anything. Just log what it would classify as retryable vs permanent, and have your operations team validate the output against their manual triage for a week. This tells you your actual classification accuracy before you automate consequences.

**Phase 1 (the MVP):** Once you trust the classifier, wire up the retry execution and backoff logic.

This sequencing means your first deployment has zero blast radius — it can't cause a double-charge or a compliance violation because it doesn't act on anything. It also gives you real data on whether the 12% figure is right, before you've built the retry infrastructure around it.

---

## What I'd want to know before calling this well-scoped

1. **Compliance review status on retry rules.** Has anyone checked your retry schedule against Visa/Mastercard scheme rules? If not, this needs to happen before scoping is final.
2. **Idempotency design.** What's the mechanism that prevents a payment being retried twice? This should be explicit in the design, not assumed from the queue infrastructure.
3. **Classifier ownership.** Who maintains the retryable/permanent code list as new failure codes emerge? If it's engineering-only, expect ongoing maintenance tickets. If operations can update it, you need a UI or config layer.
4. **Gateway sandbox access.** Can you test retry behaviour end-to-end in a non-production environment? If not, your first real test is in production, which is a meaningful risk.

---

## Summary

The problem is real, the forcing function is genuine, and the MVP direction is sensible. The main risks aren't in the retry mechanism itself — they're in classification confidence, compliance constraints on retry rules, and idempotency design. None of these are blockers, but all three need an explicit answer before you start building. The shadow-mode classifier approach is worth considering as a low-risk way to validate your assumptions before you automate any consequences.