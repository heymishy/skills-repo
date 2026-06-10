

# Discovery Analysis: Trans-Tasman Payment Feature

## Executive Summary

This is a commercially compelling initiative addressing a real competitive gap with a clear revenue recovery opportunity. The internal routing mechanism via your Australian counterpart is a sound architectural choice that should deliver the speed and cost advantages you're targeting.

However, this discovery has surfaced several areas where the current plan underestimates complexity or carries assumptions that need stress-testing before committing to a 6-month build timeline. The most significant of these sit in the regulatory and compliance space, where I believe the current framing — "standard notifications" and "existing AML/CFT process covers the requirements" — understates what's actually involved.

I want to be direct: none of what follows is intended to slow this down unnecessarily. The commercial case is strong and the competitive pressure is real. But some of these items have the potential to delay launch by months or create serious post-launch exposure if not addressed early, so it's better to confront them now.

---

## What's Strong About This Proposal

**The commercial logic is sound.** You've quantified the revenue leakage ($4.2M annually), identified the specific competitive gap (Wise and remittance services winning on speed and price), and targeted a segment (retail customers with trans-Tasman connections) where you have a natural right to win. A sub-$5 price point for sub-$10K payments is competitive with Wise's typical NZD-to-AUD fees and dramatically undercuts your current $18–25 SWIFT pricing.

**The routing mechanism is the right approach.** Using existing group treasury infrastructure and the reciprocal routing agreement with your Australian counterpart avoids the need to build or integrate with a third-party payment rail. The end-of-day net settlement between entities is operationally clean and mirrors how many banking groups handle intra-group cross-border flows. This is your structural advantage over fintechs — they have to build or buy the corridor; you already have it.

**The phased rollout is sensible.** NZ-to-AU only, pilot cohort first, reverse direction in a future phase. This limits blast radius and gives you real operational data before scaling.

**The $10K threshold creating a two-tier routing model is pragmatic.** It keeps higher-value payments on the established SWIFT channel where the compliance and operational patterns are well-understood, while letting you compete aggressively on the high-volume, lower-value segment where you're losing customers to Wise.

---

## Areas Requiring Deeper Investigation

### 1. Regulatory Pathway Is Almost Certainly More Than "Standard Notifications"

This is the area where I have the most concern about the current framing.

**What the proposal assumes:** Regulatory notifications are routine, the regulatory team will manage them in the normal course, and the existing AML/CFT process covers what's needed.

**What's more likely true:** You are creating a new cross-border payment channel that operates outside the SWIFT/correspondent banking network. This is not the same as launching a new product variant on existing rails. From the regulators' perspective, several things are happening simultaneously:

- **You're establishing a de facto payment corridor** using intra-group book transfers rather than the standard correspondent banking infrastructure. The RBNZ and AUSTRAC (on the Australian side) will want to understand how this channel handles transaction monitoring, sanctions screening, and information sharing between the NZ and AU entities. The fact that you already do this for internal treasury flows doesn't automatically mean the regulators will be comfortable with it being extended to retail customer payments. Treasury flows between related entities and retail customer payments to unrelated third parties are categorically different from a regulatory risk perspective.

- **Your Australian counterpart is acting as a paying agent** for your NZ customers. The AU entity is receiving instructions from the NZ entity and crediting accounts of AU-based recipients who have no direct relationship with the AU entity (in the context of this transaction). AUSTRAC will have views on the AU entity's obligations here — including customer identification for recipients, suspicious transaction reporting, and IFTI (International Funds Transfer Instruction) reporting. Has the AU entity's compliance team independently assessed their obligations, or are you relying on the NZ-side assessment that "existing AML/CFT process covers the requirements"?

- **The $10K threshold will attract regulatory attention.** You've set this as an operational routing threshold (above $10K goes to SWIFT), but regulators will immediately see a structuring/smurfing risk — customers splitting a $15K payment into two sub-$10K payments to get the faster, cheaper channel. You need a clear answer on how you'll detect and prevent this, and you should expect the regulator to ask.

**What I'd recommend:** Before locking the build timeline, invest 4–6 weeks in a dedicated regulatory engagement workstream. This should include:

- A formal legal opinion on whether this channel constitutes a new "payment system" or "designated payment system" under the relevant NZ legislation, and what the RBNZ notification or approval requirements actually are — not what the team assumes they are.
- Direct engagement with the AU counterpart's compliance and legal teams to confirm they've independently assessed their AUSTRAC obligations for this channel. Do not treat this as something your NZ regulatory team can assess on their behalf.
- A specific structuring/splitting control design for the $10K threshold, documented and reviewed by compliance before build begins.
- Consideration of whether the FMA has any jurisdiction here (depending on how FX conversion is handled — see below).

**Why this matters for timeline:** If the regulatory pathway turns out to require more than notification — for example, if RBNZ wants to review and approve the channel design, or if AUSTRAC requires the AU entity to complete a specific registration or compliance program — this could add 3–6 months to your timeline. It's better to discover this in month 1 than month 5.

---

### 2. FX Conversion Mechanics Are Unspecified and Commercially Critical

The proposal doesn't address how currency conversion works, but this is central to both the customer experience and the economics.

**Key questions that need answers:**

- **When is the FX rate locked?** At the point the customer initiates the payment? At the point of settlement between the NZ and AU entities? This matters enormously for the customer experience and your FX risk exposure. If you promise a 2-hour settlement window but the rate isn't locked until settlement, the customer bears FX risk during that window. If the rate is locked at initiation, you bear the risk.
- **What rate are you offering?** Mid-market rate plus a spread? If so, what spread? This is where Wise has set customer expectations — they show the mid-market rate and a transparent fee. If your sub-$5 transaction fee is subsidised by a wide FX spread, customers will notice and you won't be as competitive as the headline pricing suggests.
- **Where does FX conversion actually happen?** Does the NZ entity convert NZD to AUD and then instruct the AU entity to pay in AUD? Or does the NZ entity send NZD-denominated instructions and the AU entity does the conversion? This affects which entity bears FX risk, how the treasury netting works, and potentially which regulatory regime governs the FX component.
- **Is the FX margin a revenue line?** If so, it needs to be modelled explicitly. The $4.2M revenue recovery target should be decomposed into transaction fee revenue and FX margin revenue so you understand the actual economics.

**What I'd recommend:** Define the FX model as a first-order design decision, not a downstream implementation detail. The FX approach affects pricing strategy, customer experience design, risk management, regulatory treatment, and the treasury settlement mechanics. It should be resolved in discovery, not during build.

---

### 3. The "2-Hour Settlement" Promise Needs Operational Design

The proposal states the customer-facing experience would show settlement within 2 hours. This is a strong competitive claim, but it needs operational backing.

**What "settlement" means to the customer vs. what actually happens:**

The customer will interpret "settled within 2 hours" as "the recipient has the money in their Australian bank account within 2 hours." But in your model, what's actually happening is:

1. NZ customer initiates payment.
2. NZ entity processes the instruction, performs AML/CFT screening.
3. NZ entity sends instruction to AU entity via the internal routing channel.
4. AU entity receives instruction and credits the recipient's account.
5. Net positions between NZ and AU entities are settled end-of-day in treasury books.

Steps 2–4 all need to happen within the 2-hour window. This raises questions:

- **What are the operating hours for this channel?** If a customer initiates a payment at 4:30pm NZ time (2:30pm AEST), does the AU entity process it same-day? What about Friday evenings? Weekends? Public holidays that differ between NZ and AU?
- **What happens if AML/CFT screening flags a transaction for manual review?** In your current SWIFT flow, a flagged transaction just takes longer within an already-slow process. In a 2-hour SLA, a manual review queue could blow the commitment. What's the customer communication if a payment is held for review? "Your payment is being processed" for 2 hours is fine; for 48 hours while compliance reviews it, you've created a worse experience than SWIFT.
- **Does the AU entity credit the recipient before or after performing its own checks?** If the AU entity has its own compliance obligations (and per point 1 above, it likely does), there's a second screening step that could introduce delay.
- **What's the failure/exception handling?** If the AU recipient account number is wrong, or the account is closed, or the receiving bank rejects the credit — how quickly does this information flow back to the NZ customer? In a SWIFT flow, there's a well-established message protocol for returns. In your internal channel, you need to build this.

**What I'd recommend:** Map the end-to-end operational flow with realistic timing for each step, including the exception paths. Define the SLA as an internal target with a customer-facing commitment that has some buffer. "Typically within 2 hours, same business day" is more defensible than a hard 2-hour promise, and avoids creating a complaint and remediation problem when transactions are legitimately delayed by compliance holds. Critically, align with the AU entity on their processing SLAs — your 2-hour commitment is only as good as their commitment to process your instructions within a specific window.

---

### 4. AML/CFT Coverage Is Probably Necessary But Not Sufficient

The proposal states that the existing AML/CFT screening logic (sanctions screening and RBNZ threshold reporting) will be extended to the new channel, and that the compliance team is comfortable this covers the requirements.

I'd push back on this gently but firmly.

**What's different about this channel compared to your existing SWIFT flow:**

- **Your existing SWIFT flow goes through correspondent banks** that perform their own independent sanctions screening. This provides a layered defence. Your internal routing channel removes this layer — you are the only screening point (and possibly the AU entity). This means your screening needs to be more robust, not just equivalent.
- **Transaction velocity and pattern detection may need recalibration.** If this channel is faster and cheaper, it will attract higher transaction volumes and potentially different usage patterns than your current international payment flow. Your existing AML/CFT transaction monitoring rules and thresholds were calibrated for a $18–25, 1–2 day payment product. A sub-$5, 2-hour product will generate different patterns. For example, the same customer sending multiple smaller payments in quick succession — is this legitimate behaviour enabled by cheaper pricing, or is it structuring? Your monitoring rules need to account for this.
- **The $10K routing threshold creates a specific structuring risk** that needs a specific control. This isn't covered by generic AML/CFT screening logic.
- **Originator and beneficiary information requirements under the AML/CFT Act and relevant FATF standards** require specific information to travel with cross-border wire transfers. In a SWIFT message, this information is carried in defined fields. In your internal routing channel, you need to ensure equivalent information is captured, transmitted, and stored. This isn't just about screening — it's about record-keeping and information availability for regulators and law enforcement.

**What I'd recommend:** Commission a specific AML/CFT risk assessment for this channel, rather than relying on the general comfort that existing processes are sufficient. This assessment should be done by your compliance team (or external AML/CFT advisors) and should specifically address: the loss of correspondent bank screening as a control layer, the structuring risk created by the $10K threshold, transaction monitoring rule recalibration for the new channel's expected volume and velocity patterns, and information requirements for the internal routing messages. This assessment should be completed before build begins, because it may surface requirements that affect the technical design.

---

### 5. The Recipient Experience on the AU Side

The proposal focuses heavily on the NZ customer experience but says little about the recipient experience in Australia.

**Questions to resolve:**

- **Does the recipient need to be an existing customer of the AU entity?** If not (which is presumably the case, since the value proposition is "send money to any Australian bank account"), then the AU entity is making payments to accounts at other Australian banks. How? Via NPP/PayID? Via Direct Entry? This affects speed, cost, and the AU entity's per-transaction costs — which in turn affect the economics of the NZ entity's sub-$5 pricing.
- **If the AU entity uses NPP** to credit recipient accounts at other banks, you potentially get near-instant crediting on the AU side, which helps your 2-hour SLA. But NPP has its own transaction limits and requirements.
- **If the AU entity uses Direct Entry**, crediting might take longer and could be batched, which could threaten the 2-hour window.
- **What information does the recipient see on their bank statement?** If the credit appears to come from the AU entity rather than from the NZ sender, this could cause confusion for recipients who don't understand the routing mechanism.

**What I'd recommend:** Engage the AU entity's payments operations team to define the "last mile" delivery mechanism on the AU side. This is not a detail — it's a critical path item that determines whether the 2-hour SLA is achievable and what the AU entity's per-transaction cost is.

---

### 6. Commercial Model and Revenue Recovery Assumptions

The $4.2M annual revenue leakage figure is a useful motivator, but the revenue recovery assumptions need scrutiny.

**Questions:**

- **How much of the $4.2M is actually recoverable?** Some customers who've moved to Wise have done so for reasons beyond price (better UX, transparent FX rates, multi-currency accounts). They won't automatically return for a sub-$5 transaction fee if the overall experience isn't competitive. What's the realistic recapture rate? 30%? 50%?
- **What's the cannibalisation impact?** Some customers currently using your $18–25 SWIFT product for sub-$10K payments will switch to the new sub-$5 channel. This is revenue you currently have that you'll be voluntarily reducing. The net revenue impact is: (recaptured revenue from Wise users) + (new revenue from previously non-sending customers) - (cannibalised revenue from existing SWIFT users switching to cheaper channel). Has this been modelled?
- **What's the per-transaction cost?** Sub-$5 pricing is the customer-facing price, but what does each transaction actually cost you? This should include: NZ-side processing costs, AML/CFT screening costs, internal routing channel costs, AU-side processing and "last mile" delivery costs, FX conversion costs/hedging costs, and a share of the build and ongoing maintenance costs. If the all-in cost is $3–4 per transaction, your margin on a sub-$5 price is thin and volume-dependent.

**What I'd recommend:** Build a proper P&L model for this product that accounts for cannibalisation, realistic recapture rates, and fully-loaded per-transaction costs. The business case should stand on its own economics, not just on a top-line revenue recovery number.

---

### 7. Technical Build Considerations

The proposal describes this as a 6-month build. Without knowing your internal systems landscape in detail, I'd flag the following areas that are commonly underestimated:

- **Integration with the AU entity's systems.** You have an existing internal routing channel for treasury flows, but extending this to carry retail payment instructions likely requires new message types, new APIs, new error handling, and new reconciliation processes. The AU entity needs to build their side too. Is their build effort included in the 6-month timeline? Do they have capacity?
- **Real-time FX rate engine.** If you're offering customers a locked rate at the point of initiation (which you should for competitive reasons), you need a real-time or near-real-time FX pricing engine that can quote, lock, and manage the risk of NZD/AUD rates. Do you have this, or does it need to be built?
- **Reconciliation between the NZ and AU entities.** End-of-day net settlement in the treasury books sounds clean, but it requires robust reconciliation of all transactions processed during the day, handling of exceptions, returns, and amendments, and agreement on the FX rates used for netting. This is operationally intensive to build correctly.
- **Customer-facing status tracking.** If you're promising 2-hour settlement, customers will want to see where their payment is. This means building a real-time status feed from both the NZ and AU processing stages — which means the AU entity needs to send status updates back through the internal channel.

**What I'd recommend:** Conduct a technical discovery spike (2–3 weeks) focused specifically on the integration points with the AU entity. Get their technical team in the room. The 6-month timeline should