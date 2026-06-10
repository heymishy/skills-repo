# Discovery Report: Trans-Tasman Payment Feature

---

## Executive Summary

The commercial opportunity is real and the internal routing mechanism is technically plausible, but this initiative carries **significantly higher regulatory complexity than the brief anticipates**. Several assumptions embedded in the proposal — particularly around AML/CFT coverage and the "standard notifications" regulatory pathway — require material reassessment before committing to a build timeline. There are also product design questions, operational dependencies, and customer experience gaps that need resolution.

This report sets out what we know, what we don't know, what we're assuming, and where the risks are concentrated. The recommendation is to proceed to a structured discovery phase before any build commitment, with specific workstreams identified below.

---

## 1. The Opportunity

### What's compelling

- **Revenue leakage is quantified and credible.** NZD $4.2M annual loss to Wise and third-party remittance services is a meaningful number. Enterprise retail customers with trans-Tasman connections represent a definable, addressable segment.
- **The internal routing mechanism is a genuine structural advantage.** Most fintechs compete on margin against correspondent banking costs. This product would route *around* the correspondent banking chain entirely, which is how sub-$5 pricing becomes viable. This isn't a marginal improvement; it's a different architecture.
- **Customer demand signal is strong.** Customers are already expressing a preference by voting with their feet. The product doesn't need to create demand; it needs to recapture it.
- **Competitive timing is reasonable.** Wise and peers have strong brand recognition but limited integration with enterprise retail banking relationships. A bank-native product with familiar UX, account integration, and trust has genuine appeal to this segment.

### What we don't yet know about the opportunity

- What proportion of that $4.2M is recoverable? Some customers who have switched to Wise may not return even with a competitive product. We need a retention/acquisition model, not just a leakage figure.
- What is the payment volume and average transaction size distribution? The $10,000 threshold design has significant revenue implications if a large proportion of trans-Tasman payments are above that threshold.
- Who specifically are the enterprise retail customers in this segment? Do we have data on which customers are currently using SWIFT for AU payments vs. those we've lost entirely? The cohort for the pilot needs definition now, not at launch.

---

## 2. The Mechanism

### How it works (as proposed)

1. NZ customer submits a payment instruction to an Australian BSB/account number.
2. The NZ enterprise validates, screens, and accepts the instruction.
3. Rather than entering the SWIFT network, the instruction is routed internally to the AU counterpart entity via the existing group treasury channel.
4. The AU counterpart credits the Australian recipient's account through the Australian domestic payment system (NPP/PayID or BECS).
5. Net intercompany positions between NZ and AU entities are reconciled in treasury books at end of day.
6. Customer-facing status shows settlement within 2 hours.

### What's structurally sound about this

- The intercompany settlement model is well-established in banking groups. Using it to extend payment capability to retail customers is a logical step.
- The AU counterpart crediting via NPP (New Payments Platform) is what makes 2-hour settlement credible. NPP supports near-real-time credit to most Australian bank accounts. This is the right rail to target.
- End-of-day net settlement between treasury books is operationally manageable if the AU relationship and limits are correctly structured.

### Open mechanism questions

**AU-side access and SLA**
Does the AU counterpart have confirmed NPP access? Can they commit to a credit SLA that supports the 2-hour customer promise? This isn't a given — NPP participation tiers vary, and the AU counterpart's internal processing queues matter. We need a written operational SLA, not a relationship assumption.

**Intercompany limit adequacy**
What is the current intercompany settlement limit on the treasury channel? Was it sized for treasury flows only? Daily retail payment volumes at scale could be materially larger. If the limit is breached, what happens to customer payments? This is a failure mode that needs a defined answer before go-live.

**FX and rate setting**
The brief doesn't address foreign exchange. NZ customers are paying in NZD; Australian recipients receive AUD. Who takes the FX position? At what point in the flow is the rate fixed? Is the customer shown an exchange rate at initiation, and is that rate guaranteed? FX rate transparency is a significant customer experience and regulatory question (see Section 4).

**NPP vs. BECS for AU credit**
NPP supports fast credit but not all Australian accounts are reachable via NPP in the same way. BECS (direct entry) is slower (next business day) but universal. If the AU counterpart routes some payments via BECS, the 2-hour promise fails for a subset of recipients. What's the fallback logic and how is it communicated to customers?

**Failure and exception handling**
What happens if the AU account number is invalid? If the payment is returned by the AU bank? If the intercompany channel has an outage? SWIFT's correspondent network has defined exception handling processes. This proprietary channel will need equivalent processes built from scratch.

---

## 3. Regulatory and Compliance — The Critical Risk Area

This is where the brief requires the most significant recalibration. The framing of "some regulatory notifications" and "standard notifications process" underestimates what is likely required. We are not saying this product can't be built — we are saying the regulatory pathway needs to be understood and confirmed before the build timeline is set.

### 3.1 What the brief gets right

The AML/CFT obligations are real, they are already being met on the SWIFT channel, and extending that screening logic to the new channel is the right instinct. Sanctions screening and RBNZ threshold reporting are non-negotiable baseline requirements and the compliance team's comfort with the existing process covering requirements is a reasonable starting position *for the AML/CFT question specifically*.

### 3.2 What the brief underestimates or hasn't addressed

**The "proprietary internal routing channel" may constitute a new payment service requiring regulatory engagement beyond notification**

In New Zealand, the Reserve Bank of New Zealand (RBNZ) and the Financial Markets Authority (FMA) have overlapping supervisory interests in payment services. More critically:

- The **Payments and Financial Infrastructure** landscape in NZ is actively evolving. The **Retail Payment System Act 2022** and the RBNZ's broader payments oversight role mean that novel payment mechanisms — particularly those involving a new settlement architecture — are likely to attract supervisory interest that goes beyond a standard notification.
- The intercompany treasury routing creates a structure where the NZ entity is, in effect, offering a payment product whose settlement depends on the balance sheet and operational capability of an Australian-regulated entity. The RBNZ may want to understand the group risk implications of this.

**Australian regulatory perimeter is not addressed**

The AU counterpart is an Australian-regulated entity. It is subject to APRA prudential oversight and AUSTRAC AML/CTF obligations. The AU counterpart crediting retail recipients on behalf of NZ customer instructions may bring the AU counterpart into scope for additional AUSTRAC obligations around the *originating* payment information — not just the domestic credit leg.

The **FATF Recommendation 16** "travel rule" (requiring originator and beneficiary information to accompany international wire transfers) applies to this payment flow. The question of how originator information is transmitted from the NZ entity to the AU counterpart through the proprietary channel — and whether it meets AUSTRAC's expectations for incoming international payment information — is **not resolved by applying existing SWIFT AML/CFT logic**. SWIFT carries structured message fields for this. The proprietary channel needs an equivalent mechanism explicitly designed for it.

This is a concrete gap, not a theoretical one. If AUSTRAC reviewed the AU counterpart's processing of these payments and found that originator information was not being transmitted and retained in a compliant manner, the exposure sits with the AU counterpart but the reputational and operational risk extends to the group.

**The compliance team's sign-off scope needs clarification**

The brief states the compliance team is "comfortable that the existing AML/CFT process covers the requirements." We need to understand the basis for that comfort:

- Does it reflect a formal review of the new channel's architecture, including the AU-side obligations?
- Or does it reflect confidence that the NZ-side screening (which is already fit for purpose) is sufficient?

These are different positions. We are not questioning the compliance team's competence — we are flagging that the AU regulatory dimension and the travel rule question are specific issues that may not have been in scope for their review.

**Remittance provider registration considerations**

Depending on how the service is structured and described, there may be questions about whether specific registration or licensing conditions apply under NZ or AU law for the customer-facing payment product. This warrants explicit legal advice, not assumption.

**Summary on regulatory risk**

| Regulatory area | Current status in brief | Assessment |
|---|---|---|
| NZ AML/CFT screening | Covered — extension of existing process | Reasonable, but confirm travel rule data transmission |
| RBNZ notification/engagement | "Standard notifications" assumed | Likely requires more substantive engagement; timeline risk |
| AUSTRAC (AU) obligations | Not addressed | Material gap; needs AU legal/compliance input |
| FATF travel rule (cross-border data) | Not addressed | Concrete gap in proprietary channel design |
| AU counterpart regulatory exposure | Not addressed | Needs APRA/AUSTRAC assessment by AU entity |

**Recommendation:** Before the build begins, commission a joint NZ/AU legal and regulatory opinion specifically covering (a) the travel rule requirements for the proprietary channel, (b) AUSTRAC obligations for the AU counterpart, and (c) the appropriate RBNZ engagement pathway. This opinion should inform whether the timeline is realistic and whether the channel design needs modification.

---

## 4. Product Design Gaps

### FX transparency and disclosure

Wise's competitive advantage isn't only speed and price — it's also radical transparency on exchange rates. Customers see the mid-market rate, the fee, and the exact amount the recipient will receive before they confirm. If this product shows a less transparent FX presentation, customers who have experienced Wise will notice and may not switch back regardless of price.

Questions to resolve:
- Will customers see the NZD amount, the exchange rate applied, the fee, and the AUD amount the recipient receives — all at initiation, before confirmation?
- Is the rate locked at initiation or at settlement? If the rate can move between initiation and settlement, how is this disclosed and managed?
- Who absorbs FX spread risk and how is the transfer pricing between NZ and AU entities structured?

### Transaction limits and the $10,000 threshold

The $10,000 threshold routes above-threshold payments to SWIFT. This design choice has implications:

- It creates a cliff-edge where a $10,001 payment costs dramatically more than a $9,999 payment. Customers will notice and may split payments to stay under the threshold, which creates AML/CFT structuring risk and an operational headache.
- Is $10,000 the right threshold? Understanding the actual distribution of trans-Tasman payment sizes among the target customer segment would inform whether this is optimal.
- Should the threshold be a hard limit or a soft one with customer-facing guidance? How will the UX handle a customer who inputs $10,500?

### Recipient experience and reachability

The NZ customer is the primary customer, but the AU recipient's experience matters for two reasons: it affects repeat usage ("did mum actually receive the money and when?") and it affects failure rates.

- Can customers input Australian BSB and account numbers reliably? BSB validation should be built in to prevent failures.
- PayID (NPP's identifier service) allows AU recipients to receive via phone number or email rather than BSB/account. Is PayID lookup supported? This would improve UX and reduce error rates.
- How does the NZ customer know the payment has been received? Is there an end-to-end status notification or only a "payment sent" confirmation?

### The 2-hour SLA as a customer promise

"Settlement within 2 hours" is a customer-facing promise. What are the conditions under which it may not be met? Business hours only? Weekends? AU public holidays? NPP is a 24/7 system but the intercompany reconciliation and AU counterpart processing may not be. The customer-facing SLA needs to reflect actual operational capability, not best-case capability.

---

## 5. Operational Dependencies and Risks

### The AU counterpart relationship

The brief describes this as a "close relationship" with a "reciprocal payment routing agreement already in place." For a retail product launch, the following need to be confirmed as *formal commitments*, not relationship understandings:

- Written operational SLA covering processing times, cut-off times, holiday schedules, and escalation procedures
- Agreed limit framework for daily/transaction volumes
- Defined exception handling process (returns, recalls, invalid accounts)
- Agreed cost structure (what the AU counterpart charges the NZ entity for the AU credit leg)
- Change management process (who needs to be notified if either entity changes systems or processes)

A close relationship is an asset. It is not a substitute for operational documentation when a retail product depends on it.

### Reconciliation and error handling

The end-of-day net settlement model works smoothly when volumes are predictable and errors are rare. At retail scale:

- Payment returns from AU banks need to be processed back to NZ customers. What's the return timeline and how is the customer notified and refunded?
- What happens if the intercompany position exceeds limits mid-day? Does the queue pause? Does it fail? Does it route to SWIFT?
- Who is responsible for reconciliation exceptions and what's the resolution SLA?

These are build requirements, not operational afterthoughts. They need to be in scope for the 6-month timeline.

### Fraud and scam liability

Trans-Tasman payments are a target for authorised push payment (APP) fraud and investment scams. NZ has evolving expectations around bank liability for scam losses. The product design should address:

- What confirmation-of-payee or equivalent controls will be in place?
- What are the intervention points if a customer is suspected of being scam-influenced?
- How does the 2-hour settlement SLA interact with any cooling-off or delay capability for suspected fraud? Once funds are credited in Australia, recall becomes significantly harder.

---

## 6. The 6-Month Timeline

The 6-month estimate is optimistic if the regulatory and operational gaps identified above need to be resolved first. A more realistic sequencing:

| Phase | Duration | Key activities |
|---|---|---|
| Pre-build regulatory and legal | 6–8 weeks | Joint NZ/AU legal opinion; RBNZ engagement; AUSTRAC assessment; compliance sign-off on travel rule design |
| Discovery and design | 4–6 weeks | FX model; AU counterpart SLA; product design; failure mode mapping; customer research with target segment |
| Build | 14–18 weeks | Core payment flow; AML/CFT integration; FX rate engine; customer notifications; reconciliation tooling; exception handling |
| Pilot | 6–8 weeks | Small cohort; operational learning; regulatory feedback incorporation |
| Full rollout | — | Dependent on pilot outcomes |

This puts the realistic timeline at 9–12 months from now, not 6 months, unless the regulatory and design questions are already further progressed than the brief suggests.

If the project team is committed to a 6-month target, the pre-build regulatory and design phases need to start immediately and in parallel, and the scope of the initial pilot needs to be explicitly limited in ways that may affect revenue projections.

---

## 7. Risks Summary

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RBNZ engagement requires more than notification — delays launch | Medium | High | Early proactive engagement; don't wait for build to complete |
| AUSTRAC compliance gap on AU side identified late | Medium | High | Commission AU legal opinion now |
| Travel rule data transmission not designed into proprietary channel | Medium-High | High | Explicit design requirement before build |
| AU counterpart NPP SLA can't support 2-hour promise for all accounts | Medium | Medium | SLA confirmation and fallback design before launch |
| FX transparency falls short of customer expectations vs. Wise | Medium | Medium | Customer research; commit to mid-market rate disclosure |
| $10,000 threshold creates structuring incentive | Medium | Medium | Consider threshold design alternatives; build monitoring for split payments |
| Intercompany limits inadequate for retail volume at scale | Low-Medium | High | Formal limit review and documented escalation process |
| Fraud/scam losses on fast payment channel | Medium | Medium-High | Scam intervention design in scope for v1 |
| AU-to-NZ phase creates reciprocal obligations not yet scoped | Low (future phase) | Medium | Flag for phase 2 discovery; don't let phase 1 design close off options |

---

## 8. Recommended Next Steps

**Immediate (before any build commitment):**

1. **Commission joint NZ/AU legal and regulatory opinion** on travel rule requirements, AUSTRAC obligations for the AU counterpart, and appropriate RBNZ engagement pathway. This is the highest-priority gating item.

2. **Formal AU counterpart engagement** to convert the relationship-level routing agreement into a documented operational SLA covering all retail payment requirements.

3. **Clarify compliance team sign-off scope** — specifically confirm whether the existing AML/CFT review addressed AU-side