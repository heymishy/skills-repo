# Discovery Pipeline: Trans-Tasman Payment Feature

## Opportunity Summary
**Revenue recovery play**: Recapture ~NZD $4.2M annual payment revenue by offering faster (2-hour vs 1-2 day), cheaper (<$5 vs $18-25) payments to Australia using existing group infrastructure.

**Mechanics are sound**: Leveraging established treasury routing and settlement infrastructure is sensible and lower-risk than building new correspondent networks.

---

## Critical Discovery Issues to Resolve

### 1. **Regulatory & Compliance — HIGH PRIORITY**
Your compliance team's comfort is a yellow flag, not a green light. This needs structured validation:

**What needs urgent clarification:**
- **Regulatory perimeter**: Is this a "payment service" under NZ's Financial Markets Conduct Act or Payment Systems Registration? Does it trigger different AML/CFT obligations than your existing SWIFT payments?
  - Wise operates as a registered money services business in NZ/Australia. Are you creating a materially similar service?
  - The fact that settlement is internal (NZ end → AU end via treasury books, not customer-to-customer) may create different regulatory treatment, but this needs explicit confirmation.

- **Cross-border settlement risk**: When a NZ customer's money sits in NZ enterprise books waiting for AU counterpart to credit the recipient, who holds the customer's funds during the 2-hour window? What's the custodial/trust account treatment?

- **Sanctions screening scope**: Your current SWIFT process screens senders and recipients. Does your screening cover:
  - Australian-resident recipients against DFAT, US OFAC, and international lists?
  - Beneficiary ownership verification for payments over AUD $10k?

- **RBNZ reporting**: Does this channel require separate Large Transaction Reporting (LTR) or Suspicious Transaction Reporting (STR) treatment? The internal routing may change reporting requirements.

**Action**: Brief the RBNZ *before* design lock. A 15-minute pre-notification conversation (allowed under current policy) could clarify whether this is treated as a new payment service requiring formal notification vs. an operational extension of existing services.

---

### 2. **Australian Counterpart Regulatory Obligations — BLIND SPOT**
You've focused on NZ obligations, but your AU counterpart has its own AML/CFT regime:

**Critical unknowns:**
- Does the AU counterpart have a formal regulatory waiver/exemption for internal group settlement payments? (They may, but assume nothing.)
- Who is the "reporting entity" in Australia? Is your AU counterpart comfortable with their AML/CFT officer signing off on this flow?
- AUSTRAC (Australian regulator) has specific rules on settlement agents. Is your AU counterpart licensed to receive NZ customer funds for onward crediting?

**Action**: Explicitly confirm AU counterpart's legal/compliance team has sign-off. Make this a formal dependency in your project plan — not a "we'll handle it later" item.

---

### 3. **Customer Due Diligence (CDD) & KYC — PROCESS GAP**
You mention extending "the same AML/CFT screening logic," but transaction-level screening isn't the same as account opening CDD:

**Specific risks:**
- For customers already onboarded to your enterprise product, are you re-screening them for international payments, or relying on existing NZ KYC?
- Are you conducting beneficiary verification on the Australian recipient? (Wise does this; regulators expect it.)
- Payment-to-new-beneficiary vs. repeat-beneficiary: Do you need tiered CDD rules?

**Action**: Map your current SWIFT international payment KYC/CDD process. Explicitly state whether the trans-Tasman flow uses *identical* or *modified* CDD rules, and why.

---

### 4. **Settlement & Custody Risk — FINANCIAL CONTROL ISSUE**
The 2-hour settlement window introduces a float management problem:

**Unknowns:**
- If the AU counterpart is delayed crediting the recipient (system outage, wrong account details rejected), how long does the NZ customer's money sit in the AU counterpart's books?
- Is there a Service Level Agreement (SLA) with penalties if the AU counterpart misses the 2-hour settlement target?
- What happens if the AU counterpart becomes insolvent during settlement? (Unlikely with a group entity, but asset separation matters for customer protection.)
- Are customer funds ring-fenced in trust/suspense accounts, or commingled with the AU counterpart's operating funds?

**Action**: Ensure the reciprocal payment routing agreement explicitly covers:
- Settlement SLAs (2 hours max, with escalation)
- Cure procedures for failed beneficiary credits
- Custodial treatment and account segregation
- Counterparty insolvency scenarios

---

### 5. **Fraud & Operational Risk**
Two-hour settlement creates a tighter window for fraud detection and reversal:

**Questions:**
- How do you handle a customer disputing a payment after 90 minutes (when it's already in AU beneficiary's account)?
- Can the AU counterpart reverse a credit if the customer reports fraud post-settlement?
- What's your chargeback/dispute handling SLA vs. Wise (which typically allows 14–180 days)?

**Action**: Define fraud response procedures and customer communication (e.g., "trans-Tasman payments cannot be reversed after 2 hours").

---

### 6. **Pilot Cohort Definition — SCOPE CLARITY**
"Small cohort of customers" is vague for a regulated product:

**Define upfront:**
- Customer segment (e.g., SMEs with AU suppliers, not consumer remittances)?
- Volume cap during pilot (e.g., max 100 customers, max $10M/month)?
- Monitoring dashboard: What metrics trigger a pilot pause? (e.g., >3 fraud cases, >1 failed settlement)
- Pilot duration: 6 months assumes you'll hit natural decision points. What are the explicit go/no-go criteria?

---

### 7. **Reverse Flow (AU→NZ) Dependencies**
You're planning AU→NZ for Phase 2, but this affects design now:

**Forward-thinking questions:**
- Does your NZ regulatory perimeter assume unidirectional flow, or can it flex to bidirectional?
- Does the AU counterpart have the same appetite for AU→NZ as you do for NZ→AU?
- If bidirectional, how do you handle asymmetric pricing or feature availability?

---

## Recommended Immediate Actions (Next 2 Weeks)

1. **Schedule RBNZ pre-notification conversation** — clarify whether this is a new service vs. operational extension.
2. **Formal compliance sign-off memo** — replace "comfortable" with written confirmation that existing AML/CFT scope covers this channel.
3. **AU counterpart legal alignment** — confirm AUSTRAC/Australian AML/CFT obligations and custodial treatment.
4. **Define pilot success criteria** — fraud rates, settlement SLA compliance, customer adoption, revenue capture targets.
5. **Map customer dispute/reversal procedures** — especially for sub-2-hour disputes.

---

## Open Question for Your Team
**How are you measuring success against Wise?** If the competitive gap is "1–2 days + $18–25," but you're also capping payments at $10k and requiring SWIFT for larger amounts, are you capturing enough of the $4.2M revenue to justify the build?