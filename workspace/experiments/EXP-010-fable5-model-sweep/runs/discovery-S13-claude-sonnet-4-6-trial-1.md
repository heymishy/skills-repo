# Discovery Report: Trans-Tasman Payment Feature

---

## Executive Summary

The commercial case is real and the technical mechanism is plausible, but this initiative carries **significantly more regulatory, compliance, and operational complexity than the brief anticipates**. Several assumptions embedded in the brief — particularly around AML/CFT adequacy, regulatory notification scope, and settlement mechanics — need to be stress-tested before committing to a 6-month build timeline. Left unresolved, these could cause a mid-build halt, a launch delay, or post-launch regulatory action.

This report sets out what we know, what we need to validate, the risks we see, and the questions that must be answered before this moves into delivery.

---

## 1. The Problem Worth Solving

The commercial signal is clear. Customers with trans-Tasman financial relationships are leaving for Wise and third-party remittance services for a straightforward reason: the existing SWIFT product is slow and expensive relative to alternatives that weren't available five years ago.

| Dimension | Current SWIFT Product | Wise / Typical Competitor | Target New Product |
|---|---|---|---|
| Speed | 1–2 business days | Minutes to hours | ~2 hours |
| Cost | $18–25 | $3–8 typical | <$5 |
| Customer experience | Opaque, form-heavy | App-native, transparent | TBD |

The $4.2M annual revenue loss figure should be treated as an **order-of-magnitude signal**, not a precise recovery target. Some proportion of that volume has left permanently — customers who have established Wise accounts won't automatically return. A more realistic recovery model needs to be built during discovery, segmenting by customer tenure, payment frequency, and whether the relationship is primarily personal remittance or business-to-business.

The focus on enterprise retail customers is appropriate as a pilot segment, but "enterprise retail" needs to be defined precisely for product scoping — does this mean the bank's enterprise customers who have retail-scale payment needs, or something else? This affects UI/UX, onboarding flow, and support model design.

---

## 2. The Proposed Mechanism — How It Actually Works

It is worth being precise about what this mechanism is, because the language used to describe it in the brief understates the structural novelty.

**What is being proposed is not a new international payment product in the conventional sense.** It is:

> A customer-facing payment instruction that is fulfilled not by moving money across a correspondent banking network, but by the enterprise group netting the obligation internally and having its Australian entity credit the beneficiary from its own AU-held funds, with intercompany settlement happening separately in treasury books.

This is structurally similar to how some large remittance operators work internally — but those operators are licensed remittance providers. The question is whether a retail bank doing this for customers is operating within its existing licence permissions, or whether it is providing a service that has a different regulatory character.

The mechanism works like this in practice:

```
NZ Customer instructs NZ Bank to send $X AUD to AU Beneficiary
        ↓
NZ Bank debits NZ Customer's NZD account (at prevailing FX rate)
        ↓
NZ Bank records intercompany payable to AU Bank
        ↓
AU Bank credits AU Beneficiary's account in AUD
        ↓
End of day: NZ Bank and AU Bank net intercompany positions and settle via treasury
```

This is operationally clean **if** the entities involved, the currencies involved, the volumes involved, and the regulatory environments involved all permit it. None of those conditions should be assumed.

---

## 3. Regulatory and Compliance Assessment

This is the highest-risk area of the brief, and the one where current assumptions are most likely to be wrong.

### 3.1 AML/CFT — The "Same Screening Logic" Assumption Is Insufficient

The brief states: *"Our compliance team is comfortable that the existing AML/CFT process covers the requirements."*

This needs to be challenged directly. Here is why:

**The existing SWIFT flow operates under a specific regulatory and technical framework.** SWIFT MT messages carry structured data fields (originator name, account, address; beneficiary name, account, address) that are mandated under the FATF Travel Rule and implemented in NZ under the AML/CFT Act 2009. Correspondent banks in the chain are themselves regulated and are performing their own screening. The compliance comfort around the current process is partly because the infrastructure enforces data completeness.

**The new channel removes the correspondent banking infrastructure.** When you route internally, you are the entire chain. This means:

- The Travel Rule obligation to pass originator and beneficiary information along the payment chain still applies — but you are now responsible for ensuring that information is structured, complete, and transmitted to your AU counterpart in a form that satisfies AU AML/CTF Act 2006 obligations, not just NZ obligations
- Your AU counterpart is a reporting entity under Australian law and has its own Customer Due Diligence and transaction monitoring obligations. The intercompany settlement instruction they receive needs to contain sufficient information for them to meet those obligations — this is not automatic
- AUSTRAC (AU financial intelligence unit) has different reporting thresholds and suspicious matter reporting obligations than the RBNZ/NZ Police FIU. "Extending the same logic" may not satisfy AU requirements
- The NZ AML/CFT Act requires that when a NZ reporting entity conducts an international wire transfer, it must obtain and hold originator information and pass it to the next institution. If the "next institution" is an internal treasury function rather than a correspondent bank, the legal basis for how that obligation is discharged needs explicit legal advice, not assumption

**Specific questions for the compliance team:**

1. Has external AML/CFT legal counsel reviewed the proposed mechanism against the NZ AML/CFT Act 2009 and the AU AML/CTF Act 2006 — not just the NZ obligations in isolation?
2. Does the AU counterpart's compliance team agree that the data fields passed in the intercompany instruction satisfy their Customer Due Diligence and record-keeping obligations for each underlying customer payment?
3. How are suspicious transaction reports handled when the AU counterpart identifies a concern on a transaction that originated from a NZ customer the AU counterpart has no direct relationship with?
4. What is the sanctions screening architecture — is NZ screening against NZ sanctions lists sufficient, or does the AU leg require AU-specific sanctions screening given OFAC and UN list implementation differences between the two jurisdictions?

### 3.2 RBNZ Regulatory Permissions — "Standard Notifications" Is Likely an Understatement

The brief anticipates "some regulatory notifications will be required before launch" and describes this as standard process.

This may be underestimating the RBNZ's likely interest. Consider what is novel about this arrangement:

- A NZ registered bank is taking customer funds and settling the obligation not through a licensed payment system or correspondent network, but through an intercompany treasury arrangement with a related entity in another jurisdiction
- The NZ customer has no direct relationship with the AU entity that actually credits their payment
- The NZ bank is, in effect, acting as an intermediary that converts a customer payment obligation into an internal group accounting entry

The RBNZ has supervisory interest in:

- **Outsourcing arrangements**: The AU entity is effectively performing a core customer-facing function (crediting the beneficiary). This may trigger RBNZ outsourcing notification or approval requirements under the Banking Supervision Handbook
- **Related party exposures**: The intercompany positions that build up intraday before end-of-day treasury settlement represent a related-party credit exposure. RBNZ has limits and disclosure requirements for related-party exposures
- **Operational risk**: A single-channel dependency on a proprietary intercompany routing arrangement concentrates operational risk in a way that RBNZ may want to understand
- **Consumer protection**: If the AU entity fails to credit the beneficiary, or if the group treasury settlement fails, what is the customer's position? RBNZ will want to see that customer remediation processes are clear

**This is likely to require a formal supervisory engagement with RBNZ, not a notification.** The timeline should reflect that. RBNZ engagements of this nature typically take 3–6 months to resolve, and that runs in parallel with — not after — the build.

### 3.3 ASIC and APRA Implications on the AU Side

The brief is written entirely from the NZ perspective. The AU counterpart has its own regulators. Before assuming the AU entity can simply credit beneficiary accounts on instruction from the NZ entity, the following needs to be confirmed:

- Does the AU entity's banking licence and APRA-approved business scope permit it to credit accounts on behalf of a related NZ entity's customers who are not direct customers of the AU entity?
- Does this arrangement need to be disclosed to APRA as a material change to business model or an outsourcing arrangement?
- Does ASIC have any view on whether the AU entity is providing a financial service to NZ customers — which could trigger Australian financial services licence considerations?

These are not hypothetical edge cases. They are foreseeable questions that AU regulators could raise.

### 3.4 FX and Payment Services Licensing

When the NZ entity accepts NZD from a customer and commits to delivering AUD to an Australian beneficiary, it is performing a foreign exchange conversion and an international value transfer. Both of these are regulated activities.

The NZ bank almost certainly holds permissions to do both. But the mechanism of delivery matters for licence scope. Legal counsel should confirm that the proposed delivery mechanism (internal routing, not correspondent banking) is within the scope of existing permissions — not assumed to be covered because the bank does FX and international payments generally.

---

## 4. Settlement and Treasury Risk

The brief describes end-of-day net settlement between the NZ and AU entities. This is operationally efficient but creates intraday risk that needs to be sized and governed.

**Intraday exposure:** If the product is successful at the target volume needed to recover $4.2M in revenue at <$5 per transaction, the transaction volume could be substantial. At $3 revenue per transaction (being conservative), recovering $4.2M requires approximately 1.4 million transactions per year, or roughly 5,500 transactions per business day. At an average of $2,000 per transaction (illustrative), that is $11M AUD of intraday exposure building up before end-of-day settlement.

This is not necessarily a problem, but it needs to be:
- Explicitly modelled against the group's related-party exposure limits
- Governed by a clear treasury policy covering what happens if end-of-day settlement fails
- Disclosed to RBNZ as part of the regulatory engagement

**FX rate risk:** The NZ customer pays NZD. The AU beneficiary receives AUD. The FX rate applied at point of instruction needs to be locked, and the group needs to hedge or absorb the FX risk between instruction time and settlement time. If settlement is end of day and there are 5,000 transactions throughout the day at varying NZD/AUD rates, the treasury team needs a clear policy on how this is managed. This is solvable but needs to be designed explicitly.

**What happens when something goes wrong:** If the AU entity fails to credit a beneficiary — technical outage, data error, sanctions hold — the NZ customer has been debited and the beneficiary has not been credited. The customer remediation process, SLA commitments, and compensation policy need to be designed before launch, not after the first incident.

---

## 5. Customer Experience and Product Design Gaps

The brief is mechanism-focused. The customer experience has not been designed. Key gaps:

**Beneficiary account validation:** The NZ customer needs to enter an Australian BSB and account number. Unlike NZ account numbers, AU BSB/account combinations have no publicly available validation service equivalent to NZ's bank account verification. What is the error rate expected, and what is the recovery flow when a payment is sent to an incorrect AU account? Account name verification (similar to NZ's "Confirmation of Payee" or the UK's CoP service) is not universally available in Australia, though NPP/Osko has some capability. This needs investigation.

**FX rate transparency:** Wise's success is partly built on showing customers exactly what exchange rate they are getting and exactly what fee they are paying, in real time, before they confirm. If the new product shows a rate and fee at initiation, it needs to be the rate and fee that actually applies. Rate lock duration, what happens if the customer abandons and returns, and what rate is shown need product design decisions.

**The 2-hour settlement promise:** This is a customer-facing commitment. What are the actual service level parameters? Does "2 hours" apply 24/7 or business hours only? What is the breach rate expected to be, and what is the customer communication when a payment takes longer? The 2-hour figure needs to be validated against the actual processing architecture, not assumed.

**Payment limits and controls:** The $10,000 threshold for routing to SWIFT versus internal channel needs to be clearly communicated to customers. A customer sending $9,999 gets a different experience and price than a customer sending $10,001. Is that the right threshold? Does it create any unintended structuring incentive? (This is also a question compliance should address.)

**Customer support:** When a trans-Tasman payment has a problem, who does the customer call? What can NZ-based support agents actually see and do for a payment that is sitting in the AU entity's processing queue? The support model needs to be designed.

---

## 6. Technical and Operational Risks

**Single channel dependency:** The current SWIFT channel has redundancy built into the global correspondent network. The new proprietary channel is a single path. What is the fallback when it is unavailable? Is there an automatic failover to SWIFT, and if so, how is the customer informed that their <$5 payment will now cost $18–25?

**Reconciliation:** Matching NZ customer payment instructions to AU entity credits and to end-of-day treasury settlement requires robust reconciliation. This is an operational risk area that needs dedicated design. Breaks in reconciliation at volume can be expensive and operationally disruptive.

**Pilot cohort design:** The brief mentions a pilot to a small cohort before full rollout. The pilot design matters. What does success look like? What metrics trigger go/no-go for full rollout? Who is in the cohort — customers with existing AU payment behaviour (easier to measure displacement) or a cross-section? A poorly designed pilot produces ambiguous results and delays the decision.

---

## 7. What the 6-Month Timeline Is Actually Buying

The brief presents this as a 6-month build. It would be more accurate to say: a 6-month build of the technical and product components, running in parallel with regulatory and compliance workstreams that may not resolve in 6 months.

A more realistic view of the parallel workstreams:

| Workstream | Realistic Timeline | Key Dependencies |
|---|---|---|
| Technical build (internal routing, core banking integration) | 4–6 months | Architecture decisions, AU entity API/integration specs |
| AML/CFT framework design and legal review (NZ + AU) | 3–5 months | External counsel engagement, AU counterpart compliance alignment |
| RBNZ supervisory engagement | 3–6 months | Engagement quality, RBNZ workload, whether questions arise |
| APRA/ASIC AU-side review | 2–4 months | AU legal counsel, AU counterpart regulatory team |
| FX and treasury policy design | 2–3 months | Treasury team capacity, group treasury governance |
| Customer experience design and testing | 3–4 months | Product design resource |
| Pilot cohort design and execution | 2–3 months post-build | Recruiting, instrumentation |

The critical path is almost certainly the regulatory engagement, not the technical build. A launch gate should not be set until the RBNZ and AU regulatory positions are clear.

---

## 8. Key Risks Summary

| Risk | Likelihood | Impact | Current Mitigation | Assessment |
|---|---|---|---|---|
| RBNZ requires material change approval rather than accepting notification | Medium-High | High — could delay or block launch | "Regulatory team will manage" | Inadequate — needs escalated engagement plan |
| AML/CFT framework found non-compliant on AU side | Medium | High — regulatory breach, potential enforcement | "Extending same logic" | Inadequate — needs dual-jurisdiction legal review |
| Intraday treasury exposure exceeds group related-party limits | Medium | Medium — requires product redesign or limit increase | Not assessed | Gap — needs treasury modelling |
| AU beneficiary account validation failures at volume | High | Medium — customer complaints, remediation cost | Not designed | Gap — needs product design |
| AU entity unable to participate due to its own regulatory constraints | Low-Medium | High — mechanism fails entirely | Not assessed | Gap — needs AU-side legal confirmation |
| Revenue recovery lower than $4.2M due to permanent customer attrition | Medium | Medium — commercial case weakens | Not modelled | Gap — needs segmented revenue model |
| SWIFT fallback cost surprises customers when primary channel unavailable | Medium | Low-Medium — customer trust | Not designed | Gap — needs product design |

---

## 9. Recommended Next Steps

The following actions should happen **before** the build begins, not in parallel with it.

**Immediate (next 4 weeks):**

1. **Commission dual-jurisdiction AML/CFT legal review.** Engage external counsel with NZ AML/CFT Act and AU AML/CTF Act expertise to review the proposed mechanism specifically — not a general overview, but a review of this specific routing architecture and the data flows between the two entities. The compliance team's internal comfort is a starting point