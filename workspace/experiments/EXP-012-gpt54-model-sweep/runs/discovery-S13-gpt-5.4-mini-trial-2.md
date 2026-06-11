### Discovery assessment: trans-Tasman NZ→AU payment feature

#### Executive view
This is a promising commercial feature with clear customer demand and meaningful revenue leakage today. From a regulatory/discovery perspective, the proposed structure is **not just a UX enhancement to existing international payments**; it may be viewed as a **new payment rail / outsourcing / agency arrangement using group treasury settlement**, with additional obligations beyond your current SWIFT flow.

The main discovery question is whether the **legal and regulatory treatment of the internal routing channel** is sufficiently similar to existing international payments, or whether it creates a materially different arrangement requiring:
- specific licensing/registration analysis,
- updated AML/CFT controls and risk assessment,
- customer disclosure/terms changes,
- cross-border data and operational resilience review,
- payment system / settlement / treasury governance review,
- and potentially prior engagement with the regulator before pilot.

You should proceed, but only after a structured regulatory workstream confirms the exact perimeter.

---

## What I think the regulator will care about

### 1) Is this “just” an international payment, or a new payment service model?
Even though the customer outcome is “send money to an Australian bank account,” the proposed mechanism is materially different:
- NZ customer instruction processed locally,
- settled through enterprise group treasury books,
- AU counterpart credits recipient account,
- net positions settled EOD between entities.

That structure may raise questions about:
- **who is actually providing the payment service**,
- whether the AU entity is acting as an agent, correspondent, or outsourced service provider,
- whether the NZ entity is holding or transmitting funds in a way that changes the regulatory characterization,
- and whether the service is functionally a **domestic-to-domestic pseudo-settlement** wrapped around a cross-border back-end netting arrangement.

### 2) “Same AML/CFT screening” may not be enough
Reusing the existing sanctions screening and threshold reporting is a good start, but the new model could require:
- refreshed AML/CFT risk assessment for the new channel,
- customer/destination risk segmentation,
- suspicious activity monitoring tuned to faster settlement and lower fees,
- controls around intermediary/treasury netting,
- recordkeeping for the intercompany leg as well as the customer leg,
- and explicit analysis of whether any new cross-border correspondent-like exposure exists.

The fact that the compliance team is “comfortable” is helpful, but from discovery I would not treat that as sufficient conclusion yet.

### 3) Treasury netting and group settlement introduces operational and conduct questions
Because the customer-facing promise is **settlement within 2 hours**, you’ll need to validate:
- whether the AU counterpart can reliably pay in near-real time,
- what happens if the intercompany treasury leg fails or is delayed,
- whether customers get certainty of receipt or only best-efforts,
- what cut-offs, reversals, exceptions, and recalls are available,
- and how disputes are handled.

The regulator may care if the customer is effectively relying on internal group liquidity rather than an external settlement rail.

### 4) Pricing below $5 may trigger conduct and disclosure scrutiny
Low pricing is commercially attractive, but you should ensure:
- all fees, FX spread, intermediary charges, and recipient-side charges are transparently disclosed,
- “under $5” is not misleading if FX margins or exclusions apply,
- and the product does not create confusion with remittance services or domestic faster payments.

### 5) Limiting the initial scope to NZ→AU is sensible
This reduces complexity and is a good pilot strategy. It also means:
- the AU recipient side is the main regulatory dependency,
- AU licensing and operational obligations need to be mapped,
- and later AU→NZ expansion should be treated as a separate approval/change assessment, not assumed to be a simple extension.

---

## Key discovery risks

### High-risk items
1. **Regulatory perimeter uncertainty**
   - The structure may be treated differently from standard SWIFT international payments.
   - The “internal routing” concept could create new obligations for treasury, payments, or outsourced processing.

2. **AML/CFT adequacy**
   - “Same screening” may not cover the specific risk profile of faster, cheaper, near-real-time transfers.
   - Need to confirm whether threshold reporting, sanctions, and ongoing monitoring are sufficient.

3. **Customer disclosure / product terms**
   - Need to determine whether customers understand the role of the AU counterpart, timing guarantees, fees, and recourse.

4. **Operational resilience**
   - Group dependency and end-of-day net settlement create concentration risk and failure modes.

5. **Regulatory notification vs approval**
   - This may require more than a standard notification depending on the exact legal entity roles and flow of funds.

---

## Suggested discovery workstreams

### A. Regulatory classification
Answer:
- What is the legal nature of the product?
- Which entity is the service provider to the customer?
- Is the AU entity an agent, outsourced processor, or payment recipient service provider?
- Does the internal routing channel alter the licensing/registration position?

### B. AML/CFT gap assessment
Map:
- customer onboarding/KYC,
- sanctions screening,
- transaction monitoring,
- threshold reporting,
- recordkeeping,
- suspicious matter escalation,
- treasury netting controls,
- and AU counterpart controls.

### C. Payments, funds flow, and treasury architecture
Document:
- customer funds movement,
- timing of value transfer,
- intercompany settlement mechanics,
- exception handling,
- reversals/failed credits,
- liquidity management,
- and reconciliation.

### D. Customer journey / disclosures
Review:
- whether customers are told funds may be routed via a group entity,
- settlement time commitments,
- fees and FX,
- cut-offs,
- recipient bank coverage,
- and complaint handling.

### E. Cross-border legal and governance review
Check:
- contractual arrangements between the NZ and AU entities,
- outsourcing / intra-group service agreements,
- data-sharing and privacy implications,
- incident reporting responsibilities,
- and audit/access rights.

---

## Practical recommendation
I would classify this as **“proceed to structured regulatory design review”**, not “green light.”

### Likely outcome
- **Commercially viable**: yes.
- **Regulatory feasible**: probably yes, but with conditions.
- **Current assumption that existing AML/CFT process fully covers it**: not yet proven.
- **Pilot readiness in 6 months**: plausible if regulatory and legal scoping starts immediately.

---

## What I’d want answered before pilot approval
1. Exact legal entity flow and role of each entity.
2. Whether the AU counterpart can lawfully and operationally credit recipient accounts under the proposed model.
3. AML/CFT gap analysis against the new flow.
4. Customer disclosure pack and terms.
5. Treasury settlement failure and exception playbooks.
6. Confirmation whether regulator engagement is notification, consultation, or approval.
7. Whether AU launch dependencies create an AU regulatory perimeter issue.

If you want, I can turn this into a **discovery artifact** next:  
- a **risk register**,  
- a **regulatory questions list**, or  
- a **go/no-go recommendation memo**.