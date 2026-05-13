# Discovery Report: Automated Payment Retry Mechanism

---

## What I understand you're building

A classification and retry layer that sits in front of your existing failed payments queue. It reads incoming failures, splits them into retryable and permanent, automatically retries the retryable ones with exponential backoff, and passes only permanent failures to the manual review queue.

Before we go further, I want to surface some things that will materially affect how you design this — and a few that could affect whether the MVP as scoped is safe to ship.

---

## What's well-defined

**The trigger condition** is clear: a payment enters the failed queue. The queue already exists. You're adding a processing layer on top of it, not changing the ingestion path.

**The success metric** is concrete and measurable: triage time under 30 minutes/day. That's a good anchor for scope decisions.

**The classification logic** has a natural starting point: failure codes. Most payment gateways return structured decline codes (Visa, Mastercard, and most acquirers publish them), and you already know 12% of your failures are retryable — which suggests someone has already done informal classification. That tribal knowledge needs to be made explicit and versioned before you automate against it.

**Exponential backoff** is well-understood as a pattern. The main design decisions are the initial interval, max attempts, and max window — all of which have meaningful downstream effects (covered below).

---

## What's unclear and needs resolution before you build

### 1. How is "retryable" currently being determined?

You say 12% are retryable, but by what method? If an operator is eyeballing decline codes against mental models, that classification logic lives in someone's head. Before you automate it, you need a written ruleset: which specific codes map to retryable, under what conditions, with what confidence. This isn't just a documentation task — if the ruleset is wrong or incomplete, your system will silently misclassify, and the failure mode is either retrying payments that shouldn't be retried (potential fraud surface, merchant relationship risk) or not retrying ones that should be (the problem you're trying to solve). **This is the single most important thing to nail before writing code.**

### 2. What does "retry" actually mean in your system?

This sounds obvious but it isn't. Does retry mean resubmitting the original payment object with the same payment method token, same amount, same idempotency key? Or does it mean creating a new payment attempt linked to the original? The answer affects idempotency handling, duplicate detection at the gateway, how you report it to the merchant, and how it shows up in reconciliation. Some gateways treat a retry with the same idempotency key as a no-op. Others don't. You need to know which behaviour your gateway(s) exhibit before assuming retry is straightforward.

### 3. Who are your gateways, and do they have per-merchant or per-card retry rules?

Card networks (Visa and Mastercard specifically) have formal retry rules — limits on how many times you can retry a declined transaction within a certain window, with specific rules varying by decline code. Exceeding these results in fines and potential card network violations. If you're processing 40,000 payments/day and 12% fail, you're talking about ~4,800 failures. Automated retries at volume without network-compliant retry logic isn't just a product risk, it's a compliance risk. This may or may not be in scope for the MVP, but you need to consciously decide that rather than discover it after the fact.

### 4. What happens when a retry also fails?

Your MVP description handles the happy path (retryable failure → retry → success) and the permanent failure path. It doesn't describe what happens when a retried payment fails again. Does it:
- Go back into the retry queue for another attempt?
- Escalate to the manual queue after N attempts?
- Get reclassified as permanent?

This is a concrete operational question. If you don't specify it, your system will need a default behaviour, and the wrong default could either flood the manual queue or loop indefinitely.

### 5. What does the merchant experience during retry?

You've scoped out the merchant-facing dashboard, which is reasonable for MVP. But "scoped out of the dashboard" doesn't mean "merchants don't need to know anything." If a payment fails at 2pm and your system retries it at 2:15pm and it succeeds, does the merchant see one transaction or two? Does their customer get notified? Does the original failure event still show up in their reporting? The merchant's confusion about retry behaviour is one of your stated problems — removing the dashboard from scope doesn't remove the underlying information need, it just means you're not building self-serve tooling for it. You'll need to decide whether operations manually communicates retry outcomes, or whether some minimal notification fires automatically.

### 6. What's the current queue infrastructure?

Is the failed payments queue a database table, a message queue (SQS, Kafka, RabbitMQ), a third-party tool? The retry mechanism needs to read from it and write back to it. The architecture of the retry service — whether it's a polling worker, an event-driven consumer, a scheduled job — depends heavily on what the queue actually is. If it's a database table with no eventing, a polling model may introduce latency or lock contention at the volume you're describing. This is a technical detail, but it's one that could force significant rework if you assume wrong.

---

## Risks worth flagging explicitly

**Volume risk at the new merchant milestone.** You've correctly identified that doubling volume breaks the manual process. But doubling volume also doubles the blast radius of any misclassification in your automated system. If your retryable/permanent ruleset has a 5% error rate that nobody noticed at current volume because operators catch it, that error rate becomes much more visible — and costly — at 2x volume. This suggests the classification logic needs to be validated against historical data before you go live, not after.

**Idempotency at the gateway level.** Worth repeating: automated retries without confirmed idempotency behaviour can result in double charges. This is a customer-facing and legal issue, not just a technical one.

**Card network retry rules (Mastercard specifically).** Mastercard's retry rules are enforced via fines billed to your acquirer, who will pass them to you. If this isn't already on your radar, put it there now.

**Ops team buy-in on the classification ruleset.** The operations team currently owns the triage process. If you automate classification without getting them to sign off on the ruleset, you risk either resistance ("the system is wrong") or loss of institutional knowledge about edge cases. The people doing 2-3 hours of manual triage daily are the subject matter experts for building your classifier — they should be in the loop on the classification rules, not just the recipients of the finished system.

---

## What a reasonable MVP scope looks like

Given all of the above, here's how I'd think about the MVP boundary:

**Must be in MVP:**
- Documented, version-controlled classification ruleset (retryable vs permanent), validated against a sample of recent historical failures
- Retry execution with exponential backoff, configurable per attempt count and interval
- Clear handling of "retry also fails" — most likely: move to manual queue after N attempts
- Idempotency-safe retry submission (confirmed with gateway docs or support)
- Logging of all retry attempts and outcomes, queryable by operations
- A way for operations to manually override the classification of a specific payment (escape hatch for the edge cases your ruleset won't cover)

**Explicitly parking for post-MVP (validate this is intentional):**
- Card network retry rule compliance checking
- Merchant notification of retry outcomes
- Per-merchant retry configuration

**The 30-minute triage target is achievable if:** the classifier handles the 12% retryable failures correctly, and the manual queue only receives genuine permanent failures plus the retry failures that exhausted attempts. If the classifier misclassifies at any meaningful rate, triage time won't drop — it'll shift from triaging all failures to debugging classifier errors, which is arguably worse.

---

## Suggested next steps

1. **Extract the classification ruleset.** Sit with the ops team, go through the last 30 days of failures, and produce a written mapping of failure codes to retryable/permanent. Get it reviewed and signed off. This is the foundation everything else sits on.

2. **Confirm gateway idempotency behaviour.** One conversation with your gateway's technical support or a read of their retry documentation. Don't assume.

3. **Check card network retry rules with your acquirer.** Specifically ask whether your current volume and retry patterns are already compliant, and what the automated retry limits are.

4. **Define the "retry also fails" state.** Make a deliberate decision before building, not after.

5. **Audit the queue infrastructure.** Confirm what the queue actually is and what the retry service needs to integrate with, so there are no architectural surprises mid-build.

---

The core idea here is sound and the problem is real. The main thing standing between a clean build and a painful one is making the classification logic explicit before you code it, and confirming that retry at your volume is compliant with card network rules. Both of those are resolvable in days, not weeks. Get those two things answered and the rest of the build is relatively straightforward.