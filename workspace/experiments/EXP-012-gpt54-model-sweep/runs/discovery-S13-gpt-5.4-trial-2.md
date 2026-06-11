Below is the **/discovery output** for the proposed **NZ→AU trans-Tasman payment feature**.

---

# 1) Executive summary

This proposal is to introduce a **faster, lower-cost NZD→AUD retail/enterprise payment service** for **NZ enterprise retail customers** sending funds to **any Australian bank account**, using an **internal group routing channel** between the NZ entity and its Australian counterpart rather than the existing SWIFT rails.

The opportunity is commercially attractive and strategically aligned: it addresses a clear competitive gap versus Wise/remittance providers, improves customer experience materially, and may help recover part of the stated **NZD $4.2M annual payment revenue leakage**. The proposed 2-hour customer promise and sub-$5 pricing for payments up to $10,000 are likely to be compelling.

However, this is **not just a product enhancement**. It is effectively a **new cross-border payment rail and settlement model**, with meaningful implications across:
- regulatory perimeter and licensing analysis,
- cross-border payment obligations,
- AML/CFT and sanctions controls,
- disclosure/fair dealing,
- outsourcing/related-party/intragroup reliance,
- treasury and settlement risk,
- operational resilience,
- complaints/error handling,
- conduct and customer communications.

The statement that “existing AML/CFT process covers the requirements” is **not sufficient as a discovery conclusion**. Re-use of existing controls may be possible, but this must be validated against the changed operating model, settlement mechanism, speed, cut-offs, monitoring scenarios, reporting, and Australian receiving-side obligations.

There is a plausible path to launch, but **only if** the enterprise confirms:
1. the legal/regulatory basis for offering this as a customer-facing cross-border payment service via the internal routing arrangement,
2. the governance and contractual framework with the Australian counterpart,
3. customer disclosures and error/returns handling,
4. financial crime control design specific to this channel,
5. treasury/settlement risk limits and reconciliations,
6. whether any approvals/notifications are actually “standard” or whether this is a **material new arrangement** requiring deeper regulator engagement.

At discovery stage, this should be treated as **high-value but medium/high complexity and medium/high regulatory sensitivity**.

---

# 2) Problem statement

Customers with family or business ties to Australia are choosing alternative providers because current international payments:
- take **1–2 business days**,
- cost **$18–25** per transaction,
- are less competitive than Wise and remittance providers.

This causes:
- loss of customer activity and relationship primacy,
- estimated **NZD $4.2M annual revenue leakage**,
- a visible capability gap in an important corridor.

The proposed feature aims to:
- reduce transfer cost to **under $5** for payments up to **$10,000**,
- deliver funds within **2 hours**,
- leverage an existing **group routing and treasury relationship** with the Australian counterpart,
- launch in **6 months** with a pilot cohort.

---

# 3) Proposed solution as understood

## Customer proposition
- NZ enterprise retail customer initiates a payment in NZ.
- Beneficiary may be **any Australian bank account**.
- Payments **up to $10,000** use the new channel.
- Payments **above $10,000** continue via SWIFT with existing pricing.
- Customer sees expected settlement within **2 hours**.

## Internal operating model
- Payment instruction is accepted and processed by the NZ entity.
- Instead of using SWIFT end-to-end, the payment is routed through an **internal proprietary channel** to the Australian counterpart.
- The Australian counterpart credits the Australian recipient account.
- Net intercompany positions are settled **end of day** via group treasury books.
- Existing sanctions screening / AML logic is intended to be reused.

## Scope
- Phase 1: **NZ→AU only**
- Potential future phase: **AU→NZ**

---

# 4) Initial business assessment

## Strategic value
Strong. This addresses:
- customer retention,
- competitive parity/improvement,
- increased transaction volume,
- possible recovery of lost revenue,
- stronger everyday relevance of the bank/payment account relationship.

## Revenue/cost hypothesis
Potentially attractive, but needs better quantification:
- Current leakage: **$4.2M annually**
- New pricing: **< $5/txn** for ≤$10k
- Need to understand:
  - expected volumes and conversion from existing channels,
  - cannibalisation of higher-priced SWIFT revenue,
  - FX spread assumptions,
  - operational cost to serve,
  - exceptions/returns/manual handling rates,
  - treasury funding costs,
  - fraud loss assumptions,
  - pilot ramp and adoption curve.

## Customer desirability
Likely high, if:
- price is transparent,
- FX rate is competitive and disclosed,
- speed promise is reliable,
- there is confidence in beneficiary reach and error handling.

---

# 5) Key assumptions that need validation

Several assumptions in the brief are material and should not be accepted without validation:

1. **“Existing AML/CFT process covers the requirements.”**  
   This may be partly true, but new rail/new settlement path often changes:
   - monitoring rules,
   - reporting triggers,
   - alert volumes,
   - receiving/pay-out due diligence,
   - name matching behavior,
   - sanctions screening timing,
   - handling of false positives and repairs,
   - suspicious activity escalation,
   - recordkeeping/data transfer requirements.

2. **“Regulatory notifications will be standard.”**  
   This may be understated. Depending on jurisdictional analysis, this could involve:
   - material change notifications,
   - outsourcing/critical service or intragroup arrangement review,
   - prudential/operational risk engagement,
   - conduct/disclosure review,
   - cross-border payment compliance analysis,
   - Australian legal review on the receiving-side activity.

3. **“Shared group infrastructure + reciprocal payment routing agreement” is sufficient legal basis.**  
   Existing treasury flow arrangements may not automatically authorize a new **customer-facing payment service**.

4. **2-hour settlement promise is operationally achievable.**  
   Requires confirmation of:
   - cut-offs,
   - weekend/public holiday handling,
   - account validation,
   - return/failure scenarios,
   - beneficiary bank processing variability,
   - support model for delays.

5. **Payments under $10k are lower risk.**  
   Lower value does not necessarily mean lower AML/fraud risk; structuring/smurfing and mule abuse are obvious concerns.

---

# 6) Regulatory and compliance themes

## A. Cross-border payments regulatory analysis
This feature is a cross-border payment product using an intragroup route rather than a traditional correspondent/SWIFT path. Key questions:
- Is the NZ entity still the sole regulated service provider to the customer, or is the AU counterpart also performing a regulated payment service?
- Does the AU counterpart’s activity amount to providing a payment service to NZ-originating customers or simply acting as an internal agent/provider to the NZ entity?
- Are there any restrictions or required authorisations for crediting “any Australian bank account” through this arrangement?
- Is this legally framed as remittance, international transfer, or intragroup settlement-supported payment execution?

This requires **formal legal analysis in both NZ and AU**.

## B. AML/CFT and sanctions
Re-using current controls is not enough as a conclusion. Need to test:
- when screening occurs,
- what data elements are available on this rail,
- whether payer/payee information is complete,
- how sanctions/name screening applies to beneficiaries and counterparties,
- how suspicious transaction monitoring differs under near-real-time processing,
- threshold and regulatory reporting impacts,
- treatment of repeated sub-$10k payments,
- reconciliation between payment instruction, FX conversion, and beneficiary credit.

Also consider:
- source-of-funds/source-of-wealth triggers,
- customer segmentation,
- enhanced due diligence where needed,
- typologies specific to fast cross-border retail/business payments.

## C. Conduct and disclosure
Customers must be told clearly:
- applicable fees,
- exchange rate / spread,
- delivery timeframe and caveats,
- eligibility criteria,
- cut-off times,
- when transfers may be delayed,
- cancellation rights if any,
- returns/recalls process,
- liability where customer provides incorrect beneficiary details.

Fast/cheap cross-border payment products are particularly sensitive to **fair, clear, and non-misleading communications**.

## D. Privacy and cross-border data sharing
Need to review:
- what customer and beneficiary data is shared with the Australian counterpart,
- legal basis for intra-group transfer,
- retention,
- access controls,
- auditability,
- any updates required to privacy notices or internal records of processing.

## E. Outsourcing / intragroup dependency / operational risk
Because customer outcomes depend on the Australian counterpart and shared infrastructure:
- is this considered a critical service or material intragroup dependency?
- what contractual SLAs, audit rights, business continuity, and incident obligations apply?
- what happens if the AU counterpart is unavailable?
- what is the fallback route?

## F. Prudential / settlement / treasury implications
End-of-day net settlement via treasury books introduces:
- intraday exposure between group entities,
- liquidity/funding requirements,
- failed settlement scenarios,
- reconciliation and break management,
- intercompany exposure limits,
- stress considerations if volumes spike or a control defect emerges.

---

# 7) Non-regulatory risk assessment

## 1. Financial crime risk
**High attention required**
- Faster payments can be abused for mule activity or rapid layering.
- Sub-$10k threshold may encourage structured transactions.
- “Any AU bank account” broadens misuse possibilities.
- Need real-time and post-event monitoring, suspicious pattern detection, and transaction velocity controls.

## 2. Fraud/scam risk
Likely significant:
- business email compromise,
- invoice redirection scams,
- authorized push payment-type scams,
- first-party fraud,
- account takeover.

Need:
- customer authentication,
- risk scoring,
- confirmation/warnings,
- velocity controls,
- device/session intelligence where applicable,
- scam intervention and post-event processes.

## 3. Operational risk
- routing failures,
- duplicate payments,
- FX rate mismatch,
- reconciliation breaks,
- cut-off handling,
- manual repair queues,
- return/reject complexity,
- beneficiary data errors.

## 4. Settlement and liquidity risk
- intraday exposures between NZ entity and AU counterpart,
- net settlement concentration,
- treasury operational dependencies,
- unresolved items crossing EOD.

## 5. Customer and reputational risk
If marketed as “2 hours” and “cheap” but:
- many payments fail,
- recipients do not receive funds on time,
- pricing is unclear,
- recalls/refunds are difficult,
then reputational harm could be immediate.

## 6. Legal/contractual risk
Existing reciprocal routing agreement for treasury flows may not adequately cover:
- customer payment execution,
- service levels,
- liability allocation,
- indemnities,
- sanctions/fraud loss allocation,
- complaints handling,
- recordkeeping and audit rights.

---

# 8) Key design questions to answer in discovery

## Product and customer experience
- Who exactly are “enterprise retail customers”? SMEs? business banking? personal customers with business links?
- Will customer fund in NZD and recipient receive AUD?
- Is FX included? If yes, how is rate set and disclosed?
- Is there a guaranteed rate window?
- What hours/days support the 2-hour service?
- Are weekends/public holidays included?
- What payment statuses will customers see?
- What happens if recipient account details are wrong?
- Can payments be cancelled once sent?
- Will there be transaction/batch limits beyond $10,000 single payment cap?

## Channel and operations
- Which origination channels: branch, internet banking, mobile, API, assisted channels?
- Is beneficiary name/account validation available for AU accounts?
- How are payment messages formatted and enriched?
- How are rejects/returns handled?
- What is the fallback if AU counterpart channel is unavailable?
- Can a payment be rerouted to SWIFT automatically?

## Risk and controls
- Are sanctions screens run pre-dispatch, post-routing, both?
- Is beneficiary screening based on name only or richer data?
- How are split transactions detected?
- What fraud controls are real-time versus batch?
- What manual review team will support pilot/live?

## Treasury and settlement
- What are intraday and EOD net exposure limits?
- What if one side’s books are unavailable at EOD?
- Are there prefunding requirements?
- How are FX positions hedged and booked?
- Who owns reconciliation and break resolution?

## Governance
- Who is accountable: payments product, treasury, operations, compliance, technology?
- Is this a material change requiring formal risk committee approval?
- What is the launch go/no-go framework?

---

# 9) Regulatory questions for specialist review

These should be formally assigned rather than assumed resolved:

1. **NZ legal/regulatory classification**
   - Does this constitute a new regulated payment/remittance arrangement?
   - Are updated terms/disclosures required?
   - Are any customer money or settlement conduct issues triggered?

2. **AU legal/regulatory role of counterpart**
   - Is the AU entity merely providing internal operational support, or is it executing regulated payment functions?
   - Are there AU obligations tied to beneficiary crediting?

3. **AML/CFT**
   - Are current screening and monitoring scenarios sufficient for this rail?
   - Are new reporting workflows required?
   - Is the reliance/information-sharing framework between NZ and AU entities adequate?

4. **Sanctions**
   - Are existing sanctions controls suitable given the changed message format and speed?
   - Is there any risk of reduced transparency versus SWIFT fields?

5. **Privacy/data transfer**
   - Are cross-border disclosures, records, and controls sufficient?

6. **Outsourcing/intragroup arrangements**
   - Does this require material outsourcing or related-party governance treatment?

7. **Prudential/operational resilience**
   - Are notifications or prior engagement needed because this becomes a customer-critical payment service?

---

# 10) Delivery feasibility view

## Indicative complexity
**Medium-high to high**

A 6-month build may be achievable **only if**:
- legal/regulatory analysis confirms no major structural blockers,
- the internal routing capability already exists in reusable form,
- customer channels need moderate rather than major change,
- sanctions/AML/fraud controls can be adapted quickly,
- operations and reconciliation are not built from scratch,
- the AU counterpart is equally prioritised and resourced.

## Potential delivery workstreams
- product design and pricing
- legal/regulatory analysis
- AU counterpart agreement uplift
- payment processing/routing integration
- FX and treasury booking
- sanctions/AML/fraud controls
- customer channel UX and disclosures
- operations, reconciliations, exceptions, complaints
- pilot design and monitoring
- control testing and operational readiness

## Major schedule risks
- underestimating legal/regulatory sign-off time,
- unclear ownership across NZ and AU entities,
- exception/returns handling complexity,
- insufficient fraud controls for pilot,
- inability to support customer promise consistently.

---

# 11) Gaps and concerns in the current proposal

1. **Overconfidence on compliance coverage**  
   “Existing AML/CFT process covers the requirements” is currently unsupported.

2. **No explicit fraud/scam strategy**  
   For fast low-cost payments, this is a major omission.

3. **No detail on FX economics and disclosure**  
   Pricing under $5 may still hide or rely on FX spread; this must be transparent and commercially modeled.

4. **No returns/recall/error handling model**  
   Critical for customer protection and complaint management.

5. **No clear contractual basis with AU counterpart for customer-facing execution**  
   Treasury flow agreement may not be enough.

6. **No service availability assumptions**  
   “Within 2 hours” needs caveats and operating hours.

7. **No risk appetite articulation**  
   Especially around loss, fraud, sanctions false negatives, settlement exposure, and customer remediation.

8. **No mention of pilot controls**  
   Pilot should likely have tighter limits, narrower customer eligibility, enhanced monitoring, and manual oversight.

---

# 12) Discovery recommendation

## Recommendation
**Proceed to structured feasibility / definition phase**, not straight to build.

This initiative appears strategically valuable and potentially executable, but it needs **formal validation across legal, compliance, treasury, fraud, and operational design** before the 6-month plan is treated as credible.

## Suggested status
**Amber / Proceed with conditions**

## Conditions to proceed
Before committing to implementation, obtain:

1. **Formal NZ and AU legal/regulatory memo**
   - on product structure, licensing/regulatory perimeter, customer disclosures, counterpart role.

2. **Financial crime control assessment**
   - sanctions, AML/CFT, transaction monitoring, fraud/scam controls specific to this rail.

3. **Treasury/settlement design paper**
   - intraday exposure, EOD netting, reconciliation, FX, failure scenarios, limit framework.

4. **Operating model and exception design**
   - rejects, returns, recalls, investigations, complaints, outage fallback.

5. **Commercial model**
   - volume, adoption, revenue recovery, cost to serve, fraud loss assumptions, FX economics.

6. **Intragroup contractual/governance uplift**
   - service levels, liability, audit rights, incident reporting, continuity, regulatory cooperation.

7. **Pilot risk framework**
   - limited cohort, lower exposure caps, enhanced monitoring, manual review, clear success criteria.

---

# 13) Suggested pilot guardrails

If the initiative proceeds, pilot with conservative controls:

- limited customer cohort with known transaction history,
- lower aggregate daily/monthly limits,
- manual review for first payments/new beneficiaries,
- restricted payment hours initially,
- enhanced sanctions/AML/fraud monitoring,
- explicit customer disclosure that timing is target, not absolute guarantee,
- dedicated support desk for exceptions,
- daily governance review during early pilot,
- predefined stop/go triggers for losses, delays, false positives, or reconciliation breaks.

---

# 14) Questions to take into the next workshop

1. What exact customer segment is in scope?
2. Is FX margin part of the economics, and how will it be disclosed?
3. What legal basis allows the AU counterpart to credit any AU bank account for this customer-facing service?
4. Are there any Australian scheme/access constraints on the payout leg?
5. What additional fraud controls will be implemented for near-real-time low-value cross-border payments?
6. How will split transactions and mule activity be detected?
7. What are the beneficiary validation capabilities in Australia?
8. What is the exact customer promise for weekends and public holidays?
9. What happens if the payment cannot be completed in 2 hours?
10. What is the fallback route if the internal channel or AU counterpart is unavailable?
11. Who owns reconciliations, and what are the break tolerances?
12. Does the existing intercompany agreement cover customer payment execution and liability?
13. What regulator engagement is required beyond “standard notifications”?
14. What are the pilot success metrics and kill criteria?

---

# 15) Bottom-line discovery view

This is a **strong opportunity with real customer and commercial upside**, but it should be treated as a **new payment rail with material control implications**, not merely a cheaper routing variation of SWIFT.

The idea is promising, but the current brief **understates legal/compliance/fraud/operational complexity**. The right next step is a **cross-functional feasibility phase** with explicit legal, compliance, treasury, fraud, and operating model deliverables before final investment approval.

If useful, I can next convert this into a **Discovery Decision Note**, a **RAID log**, or a **target-state capability map**.