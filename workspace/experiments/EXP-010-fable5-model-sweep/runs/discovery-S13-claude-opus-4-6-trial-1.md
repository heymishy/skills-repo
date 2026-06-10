

# Discovery Analysis: Trans-Tasman Payment Feature

## Executive Summary

This is a commercially compelling initiative targeting a real and quantifiable revenue gap. The core mechanism — leveraging an existing intra-group treasury channel — is sound and is a pattern used by other banking groups globally (e.g., HSBC, Westpac Group). However, this discovery has surfaced several areas where the current framing understates complexity or carries assumptions that need to be stress-tested before committing to a 6-month build timeline.

I want to be direct: the payments mechanism itself is probably the most straightforward part of this. The areas that will determine success or failure are regulatory treatment, FX execution, operational edge cases, and the customer experience details that haven't been specified yet.

---

## What Is Well-Understood

The following elements of the proposal are clear and appear well-founded:

**The commercial case is strong.** $4.2M in annual revenue leakage to Wise and remittance services is a concrete, measurable problem. The target pricing (under $5 for payments up to $10,000) is competitive with Wise's typical NZD-AUD fee band of $3–7 depending on amount and method. The 2-hour settlement window would be a genuine differentiator against SWIFT and competitive with Wise's fastest option.

**The intra-group treasury mechanism is a legitimate pattern.** Using reciprocal book entries between affiliated entities with end-of-day net settlement is how many banking groups handle cross-border flows. The existing treasury channel and routing agreement mean you are not building settlement infrastructure from scratch.

**The directional scoping is sensible.** Starting NZ-to-AU only, with a pilot cohort, is appropriate risk management for a new payment channel.

**The $10,000 threshold creating a two-tier routing model is reasonable.** It limits exposure on the new channel while you learn, and it aligns roughly with common AML reporting thresholds in both jurisdictions.

---

## What Needs to Be Challenged or Clarified

### 1. Regulatory Treatment Is Being Significantly Underestimated

The brief describes regulatory requirements as "standard notifications" that the regulatory team will manage. This framing concerns me. This is not a minor product variation — you are creating a new payment channel that bypasses the correspondent banking network for retail customer transactions. The regulatory implications are more substantive than notifications.

**Specific issues to investigate:**

- **RBNZ and APRA prudential treatment.** The intra-group channel currently handles treasury flows. Extending it to retail customer payments changes its risk profile and volume characteristics. Both regulators will likely want to understand the credit exposure management between the two entities. End-of-day net settlement means intraday credit exposure accumulates — what are the limits? What happens if one side cannot settle?

- **Australian licensing requirements.** The Australian counterpart will be receiving payment instructions and crediting accounts on behalf of NZ-originated customers. Depending on how the Australian counterpart treats these instructions operationally, there may be implications under Australian payments regulation. If the NZ entity is deemed to be providing a remittance service into Australia, there are AUSTRAC registration and reporting considerations that go beyond what the Australian counterpart's existing banking license covers.

- **New Zealand payments regulation.** The current Retail Payment System Act and any applicable designation orders — does this channel create any obligations around access, interchange, or reporting that don't apply to your SWIFT channel?

- **The $10,000 threshold will attract regulatory attention.** Any threshold in international payments that determines routing will be scrutinised for whether it facilitates structuring (breaking transactions into smaller amounts to avoid reporting or screening thresholds). You need to be able to demonstrate that the threshold is commercially motivated (which it is) and that your monitoring specifically watches for structuring patterns across this boundary.

**My recommendation:** Do not treat regulatory engagement as a parallel workstream that runs independently. Make it a **gate** before detailed build begins. Commission a specific regulatory impact assessment covering both NZ and AU requirements. A 6-month timeline that discovers a regulatory blocker in month 4 is worse than an 8-month timeline that resolves regulatory questions in month 1-2.

---

### 2. Foreign Exchange Execution Is Entirely Unaddressed

The brief does not mention FX at all. This is a cross-border payment between NZD and AUD. FX is not a detail — it is arguably the core of the product economics and customer experience.

**Questions that must be answered:**

- **Who provides the FX conversion?** Is the NZ entity converting NZD to AUD before instructing the Australian counterpart? Is the Australian counterpart receiving NZD-equivalent instructions and converting on their side? Is the group treasury function providing an internal rate?

- **What rate does the customer get?** Wise is transparent about mid-market rates plus a visible fee. If you charge under $5 but embed a 50-80 basis point FX margin, the total cost to customer on a $5,000 transfer could be $25-40 plus the fee. Customers who use Wise will notice this immediately. Your pricing story must account for total cost, not just the transaction fee.

- **When is the rate locked?** At instruction time? At processing time? At settlement time? The 2-hour settlement window means FX rate movement is a real consideration. If the customer sees a rate at instruction time but you execute at a different rate, you will generate complaints and potentially fair dealing issues.

- **Who bears the FX risk in the intraday period?** Between the customer's instruction and the end-of-day treasury settlement, someone holds FX exposure. If volumes grow to the levels implied by recapturing $4.2M in revenue, this intraday exposure could be material.

**My recommendation:** FX execution design needs to be treated as a first-class workstream, not a detail to be resolved during build. The product manager and treasury need to jointly define the FX model before architecture begins, because it will fundamentally shape the technical design, the customer experience, and the commercial model.

---

### 3. AML/CFT Coverage Is Assumed, Not Demonstrated

The brief states that the compliance team is comfortable that existing AML/CFT processes cover the requirements. I would want to see this comfort documented with specific analysis, not just asserted, because there are meaningful differences between this channel and the existing SWIFT channel.

**Specific differences that need to be accounted for:**

- **Speed changes risk profiles.** Your current SWIFT flow has 1-2 business days during which suspicious transactions can be flagged, reviewed, and intercepted. A 2-hour settlement window compresses the time available for manual review of flagged transactions. If your sanctions screening or transaction monitoring flags a payment, what happens? Does the 2-hour clock stop? Does the customer see a different status? Does the Australian counterpart hold the credit?

- **Volume and pattern changes.** If this product succeeds, you will see a significant increase in trans-Tasman payment volume at lower average values. Your transaction monitoring rules, which were calibrated for the existing SWIFT flow (lower volume, higher average value), will need recalibration. Without this, you will either generate excessive false positives (destroying operational economics) or miss genuine suspicious patterns.

- **The $10,000 routing threshold intersects with AML reporting thresholds.** In Australia, the AUSTRAC threshold transaction reporting requirement is AUD $10,000. Your $10,000 threshold (presumably NZD) will sit very close to this, depending on the exchange rate. This is not necessarily a problem, but it needs to be explicitly addressed in your AML/CFT risk assessment because regulators will ask about it.

- **Dual-jurisdiction reporting.** On the current SWIFT flow, the correspondent banking chain handles some of the reporting obligations. On this new channel, reporting obligations in both NZ and AU need to be explicitly mapped. Who reports what, to which FIU, and when?

**My recommendation:** Commission a specific AML/CFT risk assessment for the new channel from your compliance team — not a general comfort statement, but a documented assessment that maps obligations, identifies gaps, and confirms controls. This should be a launch gate.

---

### 4. Operational Design Has Significant Open Questions

**Failure and exception handling:**

- What happens when the Australian counterpart cannot credit the recipient account (closed account, wrong BSB/account number, name mismatch)? On SWIFT, there are established return/reject message flows. On the internal channel, you need to define the equivalent. How does the customer get their money back? How long does that take? Who bears any FX loss on the return?

- What happens during Australian bank holidays when NZ is operating, or vice versa? The treasury settlement is end-of-day, but whose end of day? What happens on a Friday afternoon NZ time instruction when AU has a Monday holiday?

- What is the reconciliation process? End-of-day net settlement across a group treasury book requires robust reconciliation. What happens when there is a break? Who investigates? How are customers affected?

**The 2-hour SLA:**

- Is 2 hours a commitment to the customer or an expectation? This distinction matters enormously for complaint handling, regulatory treatment, and operational design. If it is a commitment, you need to define what happens when you miss it. If it is an expectation, your customer communications need to be carefully worded.

- What are the dependencies in the 2-hour window? Sanctions screening, FX execution, instruction transmission to AU, AU-side processing, credit to recipient account, confirmation back to NZ. Each of these can introduce delay. Have you mapped the end-to-end flow with realistic timing for each step, including manual review queues for flagged transactions?

**Recipient validation:**

- How does the NZ customer enter the Australian recipient's details? BSB and account number? PayID? Does the system validate the BSB? Does it do a name check against the account? Australian NPP (New Payments Platform) supports PayID and confirmation of payee — does the Australian counterpart's infrastructure support this? Getting recipient details wrong is one of the highest-friction failure modes in cross-border payments.

---

### 5. The $10,000 Threshold Creates a UX Cliff

A customer wanting to send $10,001 gets a completely different experience — different pricing ($18-25 vs under $5), different speed (1-2 days vs 2 hours), different channel (SWIFT vs internal). This is a jarring experience that competitors do not impose. Wise processes a $10,001 transfer identically to a $9,999 transfer.

**Considerations:**

- Customers will structure their payments to stay under the threshold. A customer who needs to send $15,000 will try to send $10,000 and then $5,000. This has both AML implications (structuring) and commercial implications (you are handling two transactions for the price you expected for one).

- The threshold may need to be positioned differently — perhaps as a tiered pricing model rather than a hard channel switch. For example: under $5,000 costs $3, $5,000-$10,000 costs $5, $10,000-$25,000 costs $10 (still on the fast channel), above $25,000 uses SWIFT.

**My recommendation:** Reconsider whether $10,000 is a hard routing boundary or whether it should be a pricing tier boundary. The decision should be informed by the risk appetite discussion (how much intraday exposure is acceptable on the internal channel) rather than an arbitrary round number.

---

### 6. Competitive Response and Positioning

The brief frames this as recapturing revenue from Wise. Be realistic about what you are competing with:

- Wise offers mid-market rates with transparent fees, instant or near-instant transfers, a well-designed app experience, and coverage to many countries beyond Australia.
- Your product offers the trust of an existing banking relationship, integration with existing business banking platforms, and the convenience of not needing a separate service.

**Where you can win:** Business customers who want payments integrated into their existing banking workflow, customers who value the institutional backing of a bank, and customers for whom the "good enough" option that is already in their banking app beats the "best" option that requires a separate service.

**Where you will struggle:** Price-sensitive customers who will compare total cost (fee plus FX margin) to the decimal point, customers who also send money to countries other than Australia, and tech-forward customers who prefer Wise's UX.

**My recommendation:** Define the target customer segment precisely. "Enterprise retail customers with family or business connections in Australia" is too broad. Is this primarily personal remittances? Small business supplier payments? Both? The answer affects product design, pricing, compliance requirements, and go-to-market strategy.

---

## Suggested Next Steps (Ordered by Priority)

| Priority | Action | Owner | Purpose |
|----------|--------|-------|---------|
| 1 | Commission regulatory impact assessment covering both NZ and AU requirements | Regulatory team + external counsel | Confirm no launch blockers; define actual notification/approval requirements |
| 2 | Define FX execution model | Product + Treasury | Determines commercial viability, customer experience, and technical architecture |
| 3 | Commission AML/CFT risk assessment specific to new channel | Compliance | Documented assurance that controls are adequate; identify any gaps |
| 4 | Map end-to-end operational flow including all failure/exception paths | Product + Operations + AU counterpart | Validate the 2-hour SLA is achievable; identify operational build requirements |
| 5 | Define target customer segment and validate willingness to pay/switch | Product + Commercial | Confirm the commercial case with customer evidence, not just revenue leakage estimates |
| 6 | Revisit the $10,000 threshold design | Product + Risk + Compliance | Determine if hard routing boundary is the right model vs. tiered pricing |

---

## Assessment of the 6-Month Timeline

The 6-month timeline is plausible for the technical build if the regulatory and design questions above are resolved quickly. However, the timeline as presented appears to assume that regulatory, compliance, FX, and operational design work happens in parallel with or subordinate to the technical build.

A more realistic framing:

- **Months 1-2:** Resolve regulatory, compliance, and FX design questions. Detailed operational flow mapping. Technical discovery and architecture.
- **Months 3-5:** Build, integration with AU counterpart systems, testing.
- **Month 6-7:** Pilot with controlled cohort.
- **Month 8+:** Iterate based on pilot, full rollout.

This puts you at 8-9 months to full rollout, which is still fast for a new cross-border payment channel. I would be cautious about compressing this further — the reputational and regulatory risk of getting cross-border payments wrong significantly outweighs the cost of an additional 2-3 months of careful preparation.

---

## Summary of Key Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Regulatory requirements more substantial than anticipated | High | Medium-High | Early regulatory engagement; treat as launch gate |
| FX model erodes competitive pricing advantage | High | Medium | Define FX model early; benchmark total cost vs Wise |
| AML/CFT gaps discovered late | High | Medium | Specific risk assessment for new channel |
| 2-hour SLA not consistently achievable | Medium | Medium | End-to-end flow mapping with realistic timing |
| Structuring behaviour around $10K threshold | Medium | High | Monitoring controls; consider threshold redesign |
| AU counterpart operational readiness | Medium | Medium | Early engagement; joint operational design |

---

This is a good initiative pursuing a real opportunity with a sound core mechanism. The work needed is not to validate the concept — the concept is solid — but to resolve the design and regulatory questions that will determine whether the execution succeeds. The biggest risk I see is that enthusiasm for the commercial opportunity causes these questions to be treated as details to be resolved during the build, rather than prerequisites that should be resolved before the build is committed to.