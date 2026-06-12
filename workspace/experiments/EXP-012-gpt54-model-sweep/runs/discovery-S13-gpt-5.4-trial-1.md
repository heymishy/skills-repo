Below is the /discovery output for the proposed trans-Tasman payment feature.

---

# /discovery output

## 1) Opportunity summary

Build a low-cost, near-real-time NZ→AU payment capability for enterprise retail customers using an internal group routing channel between the NZ enterprise and its Australian counterpart, instead of the current SWIFT path for payments up to NZD 10,000.

### Customer problem
Customers with family or business connections in Australia currently prefer Wise/remittance providers because:
- current bank SWIFT payments take 1–2 business days
- current fees are NZD 18–25 per transaction
- competitors offer faster and cheaper alternatives

### Proposed value proposition
For NZ→AU payments up to NZD 10,000:
- settlement visible to customers within 2 hours
- price under NZD 5 per transaction
- recipient can be any Australian bank account
- delivered within the bank’s existing customer relationship and controls

### Strategic rationale
- closes a meaningful competitive gap
- defends/reclaims annual payment revenue currently lost to alternatives
- leverages existing group infrastructure and reciprocal treasury arrangements
- creates a platform for future AU→NZ expansion

### Stated commercial impact
- approximately NZD 4.2M annual payment revenue currently lost to alternative services

---

## 2) What is being proposed

### In scope
- NZ-originated customer payment instructions to Australian bank accounts
- payments up to NZD 10,000
- routing over an internal proprietary channel between the NZ enterprise and Australian counterpart
- end-of-day net settlement between entities via group treasury books
- same AML/CFT screening logic as current SWIFT international payments
- pilot with small customer cohort, then full rollout
- target build timeline: 6 months

### Out of scope / later phase
- AU→NZ payments
- payments above NZD 10,000
- replacing SWIFT for all international payments
- non-Australia destinations

---

## 3) Initial product framing

This is not just a pricing change to an existing international payment. It is a new payment rail/customer proposition with:
- a different execution path
- different speed claims
- different settlement model
- different operational dependencies
- possible different legal/regulatory treatment despite similar AML controls

The key discovery question is whether this should be treated as:
- a product enhancement to international payments, or
- a materially new designated banking/payment service requiring deeper legal, regulatory, operational risk, and disclosure review

At discovery stage, assume the latter until proven otherwise.

---

## 4) Key assumptions embedded in the proposal

The proposal currently assumes:
1. Existing AML/CFT screening logic is sufficient for the new channel.
2. Standard regulatory notifications are enough prior to launch.
3. Existing group treasury routing arrangements can be extended to customer payments without material legal/regulatory redesign.
4. “Settlement within 2 hours” is operationally reliable and can be represented to customers.
5. End-of-day net settlement creates no prudential, conduct, safeguarding, or settlement finality issues.
6. Pricing below NZD 5 is economically viable after implementation, ops, disputes, compliance, treasury, and FX impacts.
7. Limiting to NZ→AU and sub-NZD 10k meaningfully reduces complexity/risk.

These assumptions need validation.

---

## 5) Major discovery themes

## A. Regulatory and legal classification
This is the highest-priority discovery area.

Using an internal group channel and deferred intercompany settlement for customer payments may trigger issues beyond “same AML process as SWIFT.” Questions include:
- Is this still legally the same type of international payment service currently offered?
- Does the AU counterpart become a provider of a regulated payment service to NZ customers or NZ beneficiaries in substance?
- Are there licensing, permissions, outsourcing, agency, correspondent, stored-value, payment system, or remittance implications in NZ or AU?
- Does end-of-day net settlement between entities create distinct legal obligations around settlement finality, customer money treatment, or balance sheet recognition?
- Are there specific fair dealing or disclosure obligations associated with faster-payments claims and routing discretion?
- Are there internal group agreements sufficient for treasury flows but insufficient for customer payments?

### Why this matters
A proposal can look operationally simple but still materially change legal character because:
- customer funds are being routed differently
- another group entity is performing a customer-facing execution leg
- there is timing mismatch between customer debit, beneficiary credit, and intercompany settlement
- FX and payment execution responsibilities may sit across entities

### Discovery outcome needed
A formal legal/regulatory opinion, not just a notification plan.

---

## B. AML/CFT, sanctions, and financial crime
The proposal states the current SWIFT control set will be extended to the new channel. That is necessary, but may not be sufficient.

Questions:
- Does the new channel change the point(s) at which screening must occur?
- Who screens beneficiaries and payment messages on the AU side?
- Will both entities screen, or only NZ?
- Does the altered payment path affect travel rule / payment originator-beneficiary information obligations?
- Are there changed suspicious activity monitoring requirements because payments become cheaper/faster and may attract new use cases or structuring below the NZD 10,000 threshold?
- Does faster release increase exposure to mule activity, APP fraud, sanctions evasion, or typology shifts?
- Are threshold assumptions overly tied to current reporting arrangements?
- Are there enhanced obligations because beneficiary credit occurs before final intercompany settlement?

### Discovery outcome needed
A channel-specific financial crime risk assessment, not only reuse of existing SWIFT controls.

---

## C. Payments operations and settlement design
The proposition depends on a non-SWIFT execution path with customer-visible rapid settlement and end-of-day netting.

Questions:
- What exact payment rail is used on the AU side to reach “any Australian bank account”?
- How are cut-offs handled?
- What are failure scenarios if AU credit cannot be completed after NZ customer debit?
- What happens if the AU counterpart credits the recipient but end-of-day settlement fails or is delayed?
- Is intraday liquidity/funding required?
- What is the reconciliation model across NZ customer ledger, intercompany positions, FX entries, AU payout, and treasury settlement?
- What are dispute and returns mechanics?
- Can mistaken payments be recalled?
- What service levels are realistic on weekends/holidays across both jurisdictions?
- Is “within 2 hours” true in all normal cases, or only business hours?

### Discovery outcome needed
An end-to-end operating model and exception-handling design.

---

## D. Product, conduct, and customer disclosure
A faster and cheaper cross-border payment product will change customer expectations.

Questions:
- What exactly is the customer buying: international transfer, same-day transfer, or near-real-time AU deposit?
- Will the bank guarantee timing or present it as target SLA?
- How will FX rates and fees be disclosed?
- Will the rate be locked at instruction time?
- Are there circumstances where the payment is rerouted to SWIFT?
- What disclosures are needed for delays, reversals, failed credits, holidays, sanctions holds, and beneficiary bank issues?
- Is there any risk of misleading “quickly and cheaply” claims if availability is limited by cut-off, business days, or exceptions?
- Do enterprise retail customers understand this as domestic-like speed with international-payment reversibility constraints?

### Discovery outcome needed
Clear customer promise, T&Cs, disclosures, and complaints handling model.

---

## E. Economics and business case
The headline revenue opportunity is compelling, but the economics need more detail.

Questions:
- Of the NZD 4.2M “lost revenue,” how much is truly recoverable?
- Will lower pricing cannibalize existing SWIFT revenue from customers who would otherwise have stayed?
- What is expected transaction volume and average payment size under NZD 10,000?
- What are unit costs once treasury, operations, exceptions, fraud losses, dispute handling, and compliance uplift are included?
- What FX spread/revenue model applies?
- Is under NZD 5 a sustainable price or only a promotional target?
- Does the pilot cohort represent the highest-volume switchers?

### Discovery outcome needed
A channel-specific P&L and migration/cannibalization model.

---

## F. Technology and delivery feasibility
A 6-month build may be plausible, but depends on complexity hidden in integration and controls.

Questions:
- What systems must change at the NZ entity for initiation, screening, FX, booking, routing, tracking, and customer servicing?
- What systems must change at the AU counterpart for beneficiary payout, exception handling, reporting, and reconciliation?
- Is there already an API/message standard for treasury flows, and can it support customer payments?
- Are there audit trail and evidencing requirements beyond current treasury routing messages?
- How will payment status updates be surfaced to customers?
- What observability and operational tooling exist for the new path?
- Does the pilot need feature flags, customer segmentation, transaction limits, and kill switches?

### Discovery outcome needed
A realistic delivery plan with dependency mapping across both entities.

---

## 6) Key risks identified

### 1. Regulatory underestimation risk
The biggest red flag is the assumption that “standard notifications” are likely sufficient. If customer payments over an internal intercompany route are regulated differently, launch timing and design may materially change.

### 2. Legal structure risk
Existing reciprocal arrangements for internal treasury flows may not automatically permit customer-payment usage. Contractual architecture may need redesign.

### 3. Settlement and liquidity risk
Crediting recipients before intercompany settlement may create intraday exposure, liquidity demands, and unresolved ownership/finality questions.

### 4. Financial crime risk uplift
Faster, cheaper transfers can materially alter typologies and fraud attractiveness, even if sanctions screening logic is reused.

### 5. Conduct/reputation risk
If “2 hours” is marketed but frequently dependent on business hours, cut-offs, or exceptions, complaints and reputational damage may follow.

### 6. Operational exception risk
Cross-border exceptions are often where cost and customer dissatisfaction accumulate. Returns, failed credits, wrong account details, and investigations may erode the proposition.

### 7. Commercial cannibalization risk
Sub-NZD 10,000 routing may shift profitable SWIFT flows into a lower-margin channel more than it attracts new/recaptured volume.

### 8. Counterparty dependency risk
The customer proposition depends heavily on the Australian counterpart’s operational capability, resilience, and control environment.

---

## 7) Discovery questions by function

## Product
- What customer segment exactly is “enterprise retail customers”?
- What are the top use cases: family support, property, tuition, supplier payments, etc.?
- What volume/frequency split is expected?
- What is the exact customer promise on speed, availability, and pricing?
- What are transaction/channel limits?

## Legal / Regulatory
- Does this constitute a new regulated service, arrangement, or payment mechanism in NZ or AU?
- Are intercompany agreements sufficient for customer money movement?
- What disclosures/terms changes are required?
- Is there any issue with end-of-day net settlement for customer transfers?
- Are additional approvals/registrations required beyond notification?

## Compliance / AML / Sanctions
- Is the current screening framework fit-for-purpose for this specific channel?
- What additional monitoring scenarios are needed?
- Who is responsible for screening and reporting on each leg?
- Does the threshold design increase structuring risk?
- Are new fraud controls needed alongside AML controls?

## Treasury / Finance
- How are FX rates determined and booked?
- Who bears intraday liquidity exposure?
- What are net settlement limits and collateral/credit arrangements between entities?
- How are failed/returned payments reflected in treasury positions?
- Is the pricing model viable?

## Operations
- What is the target operating model for straight-through processing vs manual review?
- What are exception categories and target resolution times?
- How are recalls, investigations, and complaints handled?
- What are support hours across NZ and AU?
- What are reconciliation breaks and ownership points?

## Technology
- What systems and interfaces are impacted in NZ and AU?
- What message fields are mandatory?
- How is payment tracking implemented?
- What monitoring/alerting is required?
- What kill switch and fallback mechanisms exist?

## Risk
- What non-financial risk assessment is required?
- How do we assess operational resilience and third-party/intra-group dependency?
- What scenario testing is needed for failed settlement, fraud, sanctions hits, and outage?

---

## 8) Missing information needed before shaping

The proposal does not yet specify:
- exact customer segment and expected transaction volumes
- whether FX conversion is included and how rates are set/disclosed
- exact AU payout rail/mechanism
- legal ownership and responsibility split between NZ entity and AU counterpart
- treatment of weekends, AU/NZ public holidays, and cut-off times
- handling of returns, recalls, errors, disputes, and fraud claims
- whether recipient name-checking/account verification is available
- intercompany exposure limits and liquidity arrangements
- target channels: online banking, branch, relationship manager-assisted, API, etc.
- whether customers can track payment status
- whether the service is available to all retail enterprise customers or only selected subsegments
- pilot success metrics and exit criteria

---

## 9) Initial hypothesis on complexity

### Customer desirability
High.

The need is clear, competitor substitution is already happening, and the proposition addresses real pain points on speed and cost.

### Business viability
Potentially high, but uncertain until economics are modeled.

There is a clear revenue defense/recovery story, but unit economics and cannibalization need validation.

### Delivery feasibility
Medium.

Operationally feasible in principle if group infrastructure is mature, but significant complexity likely sits in controls, reconciliation, and exception handling.

### Regulatory/legal feasibility
Uncertain/high risk.

This is the main gating dimension.

---

## 10) Recommendation

Proceed to structured discovery, but do not yet commit to the 6-month build or treat this as a straightforward enhancement.

### Recommendation detail
Advance to the next stage only if the following are commissioned immediately:

1. **Formal legal/regulatory assessment**
   - NZ and AU legal analysis of service classification
   - assessment of whether approvals/registrations/contract changes are required
   - review of end-of-day net settlement implications for customer payments

2. **Channel-specific financial crime assessment**
   - AML/CFT, sanctions, fraud, and transaction monitoring design for the new route
   - consideration of typology changes from lower cost/faster speed

3. **Target operating model**
   - end-to-end process from initiation to beneficiary credit to intercompany settlement
   - exception, returns, and investigations handling
   - service hours/cut-offs and customer promise design

4. **Commercial case refresh**
   - recoverable revenue estimate
   - unit economics
   - cannibalization analysis
   - pilot cohort economics

5. **Joint NZ/AU delivery scoping**
   - system dependencies
   - controls
   - reconciliation
   - support model
   - pilot controls and rollback plan

---

## 11) Suggested discovery decision

### Decision
**Proceed with caution to shaping/discovery deep-dive**

### Rationale
The opportunity is strategically attractive and customer-led, but the current proposal likely underestimates:
- regulatory/legal complexity
- settlement/liquidity implications
- fraud/financial crime uplift
- operational exception cost

This should be treated as a promising but non-trivial cross-border payment product, not merely a cheaper routing option.

---

## 12) Executive readout summary

- Strong customer and strategic case: clear gap vs Wise/remittance providers.
- Proposed proposition is compelling: under NZD 5, under 2 hours, NZ→AU up to NZD 10k.
- Biggest concern is not technology; it is legal/regulatory and settlement design.
- Reusing existing AML controls is necessary but probably not sufficient on its own.
- Existing internal treasury arrangements may not automatically support customer-payment use.
- Proceed, but only with formal legal, compliance, treasury, and operating-model discovery as gating work.

If useful, I can next convert this into a:
1. **one-page discovery brief**,  
2. **RAID log**, or  
3. **exec-friendly go/no-go decision memo**.