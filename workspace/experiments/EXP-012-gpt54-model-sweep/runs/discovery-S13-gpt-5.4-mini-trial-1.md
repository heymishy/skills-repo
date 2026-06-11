Below is a structured **discovery assessment** of the proposed NZ→AU trans-Tasman payment feature, focusing on product feasibility, regulatory risk, operating model, and key unknowns to resolve before build.

## 1) Executive summary

The concept is commercially attractive and appears technically and operationally plausible **if** the internal routing arrangement with the Australian counterpart is truly a controlled intragroup/partnered treasury settlement flow and **if** the customer-facing payment is still being made by the regulated NZ enterprise under its existing license/registration scope.

However, there are several **material regulatory and legal questions** that need formal validation before proceeding:

- Whether the new routing model is still covered by your existing **AML/CFT programme**, or whether it introduces a meaningfully different **wire transfer / cross-border transfer / correspondent-style** risk profile.
- Whether the Australian leg is merely a **settlement/crediting function** or an **outsourced payment service / agency arrangement** that creates additional obligations in Australia.
- Whether the launch constitutes a **material change** requiring notice, approval, or updated disclosures beyond the “standard notifications” process.
- Whether **consumer/customer disclosure**, FX handling, error resolution, complaints, and time-of-settlement claims are all aligned with the actual mechanics.
- Whether the <2 hour promise is operationally achievable across cut-off windows, holidays, exception handling, sanctions review, and benefit-of-funds timing.

The initiative should proceed, but only after a short, structured **pre-build regulatory and operating model review**. The main risk is not the product idea itself; it is **misclassifying the arrangement as “just another international payment” when it may be a new payment rail with different legal/regulatory characteristics**.

---

## 2) What this feature is, in plain terms

At a high level, the proposed flow is:

1. NZ enterprise customer instructs an NZ→AU payment.
2. NZ end processes the instruction.
3. Transfer is routed through internal enterprise treasury books rather than SWIFT.
4. AU counterpart credits the recipient’s Australian bank account.
5. End-of-day net settlement occurs between the NZ and AU entities in treasury books.
6. Customer sees rapid completion, targeted at within 2 hours.
7. Payments above NZD 10,000 continue on SWIFT at existing pricing.

This resembles a **closed-network cross-border payment corridor** using an internal/affiliate routing arrangement.

---

## 3) Commercial assessment

### Strengths
- Clear customer pain point: speed and cost are materially better than SWIFT.
- Strong competitive positioning against Wise and remittance providers.
- Significant revenue retention opportunity given the stated NZD 4.2M annual leakage.
- Natural fit for enterprise customers with AU counterparties.

### Commercial concerns
- The pricing threshold creates potential customer confusion if not clearly explained.
- “Under $5” may be difficult if compliance, operations, exception handling, and treasury costs are higher than anticipated.
- If the user experience is not nearly instant and highly reliable, the product may not materially beat alternatives.
- Enterprise customers may expect richer features: payment status tracking, batch files, beneficiary validation, and predictable FX quotes.

---

## 4) Regulatory / compliance assessment

### A. AML/CFT
Your current view is that existing sanctions screening and AML/CFT threshold reporting can be extended. That is a good starting point, but it is not yet sufficient as a conclusion.

Key questions:
- Does the new flow change the nature of the transfer such that it resembles a **new payment product** with distinct typologies and controls?
- Are you able to perform **screening at the right point in the chain** if the AU counterpart credits quickly?
- Will transaction monitoring capture structuring, velocity, mule activity, and unusual corridor usage?
- Are there any changes to **customer due diligence**, source-of-funds/source-of-wealth expectations, or beneficiary checks for a faster corridor?
- Does the AU counterpart apply equivalent AML/CFT controls, and is that formally documented?

### B. Cross-border / payments regulatory treatment
Even if the customer experience is simple, the back-end arrangement may raise issues around:
- payment service classification,
- agency/outsourcing obligations,
- reliance on a group entity or partner for fulfillment,
- records retention and auditability,
- liability allocation for failed, delayed, or misdirected payments.

### C. Notifications
You mentioned standard notifications. That may be true, but this needs confirmation against:
- whether the corridor is a **material new service line**,
- whether there is any requirement to notify a regulator about a new payment arrangement or significant outsourcing,
- whether there are board or senior management approvals required,
- whether any updated policy/controls documents need filing or attestation.

### D. Australia-side considerations
If the AU counterpart is crediting Australian accounts, check:
- whether it needs specific licensing/authorisation for the role it is performing,
- whether the arrangement creates obligations under Australian AML/CTF, payments, or consumer laws,
- whether the counterpart is acting as principal, agent, or outsourced operator.

---

## 5) Operational assessment

### Likely feasible, but only with strong controls
The target of settlement within 2 hours is achievable in principle if:
- the corridor operates during defined hours,
- beneficiary validation is reliable,
- sanctions/AML checks are automated and low-friction,
- exception handling is fast,
- treasury netting and reconciliation are well designed.

### Main operational risks
- Holiday and cut-off mismatches between NZ and AU.
- Failed beneficiary credit due to account name mismatch or invalid bank details.
- Delays caused by manual review or sanctions alerts.
- Liquidity/treasury position issues if the netting arrangement is not tight.
- Customer support burden if “quick and cheap” becomes “fast when it works, slow when it doesn’t.”

### Controls needed
- Real-time payment status tracking.
- Clear handling for rejected, returned, and repaired payments.
- Escalation path for compliance holds.
- Reconciliation between customer instruction, treasury movement, and AU credit.
- End-of-day exceptions reporting and settlement break management.

---

## 6) Key risk areas to validate before build

### 1. Legal structure of the routing arrangement
You need a definitive view of:
- who is the contractual payer/payee service provider,
- whether the AU entity is a service provider, agent, or principal,
- who bears liability for errors, delays, fraud, and refunds,
- whether the arrangement changes your regulated perimeter.

### 2. AML/CFT programme adequacy
Confirm whether the current programme:
- explicitly covers this corridor,
- includes transaction monitoring scenarios for rapid low-value cross-border payments,
- has corridor-specific typologies,
- reflects any reliance on the AU counterpart’s controls.

### 3. Customer disclosures and terms
You will need to ensure the customer-facing terms cover:
- estimated delivery time, not guaranteed timing,
- foreign exchange treatment,
- cut-off times and holidays,
- recall/cancellation limits,
- beneficiary bank delays,
- fees and rate transparency.

### 4. Treasury and settlement risk
Since the model uses net positions at end of day, you must validate:
- intragroup credit exposure limits,
- funding requirements,
- daylight overdraft risk,
- reconciliation and break resolution,
- governance around failed settlement.

### 5. Data, privacy, and cross-border information sharing
Check:
- what customer data is shared with the AU counterpart,
- whether consent/disclosure is required,
- data retention and access controls,
- cross-border data transfer restrictions.

---

## 7) Suggested discovery questions

### Regulatory
1. Does the new flow fall within our current license/registration scope and AML/CFT programme as drafted?
2. Is the AU counterpart acting as agent, service provider, or principal?
3. Are there any notification, approval, or consultation requirements before launch?
4. What additional records must be kept for this corridor?
5. Are there corridor-specific reporting obligations for threshold or suspicious matters?

### Compliance
6. Can sanctions and AML screening be completed before AU crediting in all cases?
7. What alerts will be generated differently from SWIFT flows?
8. How will we handle false positives without blowing out the 2-hour SLA?
9. What are the required controls for beneficiary validation and payment repairs?

### Operations
10. What are the cut-offs by time zone and public holiday?
11. How will net settlement be reconciled and broken items resolved?
12. What is the fallback if the AU counterpart cannot credit same day?
13. What customer support scripts and refund rules apply?

### Commercial / product
14. Can we communicate “within 2 hours” as a target, or do we need “typically within 2 hours”?
15. What transaction types are excluded?
16. How will fees, FX margins, and limits be surfaced?
17. Do enterprise customers need bulk file initiation or API access from day one?

---

## 8) Recommendation

### Proceed, but gate the build behind a formal design and compliance review
I would recommend:
- **Approve discovery**
- **Do not approve build** until the following are completed:
  1. Legal/regulatory classification of the routing arrangement
  2. AML/CFT control mapping and sign-off
  3. Treasury settlement and liability model agreed
  4. Customer terms/disclosures drafted
  5. Operational cut-off and exception model defined
  6. AU counterpart responsibilities documented

---

## 9) Proposed next-step deliverables

To move efficiently, produce these four artifacts in discovery:

1. **Target operating model**
   - end-to-end flow
   - roles/responsibilities
   - settlement, reconciliation, refunds

2. **Regulatory assessment memo**
   - licensing/perimeter
   - AML/CFT
   - notifications and approvals
   - AU counterpart obligations

3. **Risk and control matrix**
   - sanctions
   - fraud
   - payment repair
   - customer disputes
   - liquidity and settlement breaks

4. **Product requirements brief**
   - eligibility criteria
   - pricing tiers
   - limits
   - SLA wording
   - UI/UX disclosures

If you want, I can turn this into a **formal discovery output template** with sections for **go/no-go, risks, assumptions, and open questions**, or into a **1-page exec memo** for leadership.