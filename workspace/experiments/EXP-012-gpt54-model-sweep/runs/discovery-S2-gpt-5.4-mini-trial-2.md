## Discovery Summary

You want to replace a manual personal-loan application process with a digital journey in mobile and web for existing enterprise customers, while keeping the lending decision compliant and fast enough to compete with ASB and ANZ.

### Current state
- Customer calls contact centre
- Agent enters details into Dynamics
- Credit analyst reviews:
  - bureau data
  - internal transaction history
  - scorecard output
- Decision time: 3–5 days end to end

### Target state
- Customer self-serves in mobile app / web
- Inputs:
  - loan purpose
  - amount
  - term
- System pulls:
  - transaction history from core banking
  - credit bureau report from Centrix
- System combines data with internal risk scorecard
- Automated decision for loans up to **$30,000**
- Above $30,000: route to manual credit analyst review

---

## Key business drivers
- Reduce application abandonment to competitors
- Offer same-day decisions
- Capture winter lending season
- Modernise origination for existing customers

---

## Major risks / issues identified

### 1) Responsible lending / CCA compliance risk
You currently meet reasonable-inquiries obligations through a manual interview.

**Open gap:**  
The automated journey must still satisfy responsible lending obligations under the CCCFA, but legal has not yet confirmed how.

**Implication:**  
This is a gating item. The digital flow cannot launch until the team has defined and signed off:
- what inquiries are required
- how they are captured digitally
- how completeness and sufficiency are evidenced
- what exceptions require manual intervention

---

### 2) Model governance / fairness / bias risk
The credit decisioning model has **not been independently validated for bias**.

An internal review 8 months ago found **statistically different approval rates across demographic groups**, and this was not escalated outside the reviewing team.

**Implications:**
- Potential fairness / discrimination risk
- Potential regulatory / conduct risk
- Potential issue if disclosed in a future review or audit
- Potential breach of internal model governance expectations
- Likely need for immediate escalation and remediation planning

This is also a likely launch blocker until:
- bias testing is completed
- model validation is performed independently
- governance sign-off is obtained
- disclosure / remediation obligations are assessed internally

---

### 3) Regulatory disclosure risk
The bias finding was **not disclosed to the FMA**.

**Implication:**  
You need legal/compliance assessment on whether this information must be:
- reported to the regulator
- documented as a known issue
- remediated prior to launch

This should be treated as a high-priority risk item.

---

## Proposed high-level capability scope

### Customer-facing
- Mobile app and web application form
- Capture:
  - purpose
  - requested amount
  - term
- Identity / eligibility checks as needed
- Consent to access bureau and internal data
- Status updates and outcome display

### Decisioning
- Retrieve:
  - core banking transaction history
  - Centrix bureau report
  - internal scorecard output
- Automate decision for loans ≤ $30k
- Manual review queue for loans > $30k
- Decision logging and audit trail

### Operations
- Manual credit analyst review workflow
- Case management / exception handling
- Customer communications
- Fraud / risk monitoring
- Audit and compliance reporting

---

## Critical dependencies
1. Legal sign-off on responsible lending digital process
2. Model validation / bias review
3. Compliance review of prior bias finding and disclosure obligations
4. Data integration with core banking
5. Bureau integration with Centrix
6. Mobile/web front-end build
7. Dynamics or case management integration
8. Decision audit logging and retention

---

## Delivery constraint
Targeting **end of Q3** means the following are likely on the critical path:
- legal/compliance decision on CCCFA process
- model governance remediation
- integration design and testing
- operational readiness

If those are not resolved quickly, the launch date is at high risk.

---

## Likely immediate next steps
1. Convene a cross-functional discovery workshop:
   - Lending
   - Legal
   - Compliance
   - Risk / Model Governance
   - Operations
   - Technology
   - Contact Centre / Credit Analysts
2. Confirm regulatory and policy requirements for digital responsible lending
3. Initiate independent model validation and bias assessment
4. Determine whether prior internal bias findings require escalation
5. Define MVP scope and launch guardrails
6. Map the end-to-end customer journey and decisioning workflow
7. Produce a delivery plan with launch gates and risk sign-offs

---

## Discovery conclusion
This is a strong customer and commercial use case, but **there are two major blockers before launch**:
- responsible lending compliance in a digital journey
- unresolved model fairness / bias governance issues

Until those are addressed, the project should be treated as **high risk** with a constrained MVP and formal sign-off gates.

If you want, I can turn this into a **discovery artefact** next:
- problem statement
- goals / non-goals
- assumptions
- risks
- MVP scope
- questions for stakeholders
- release plan / gating checklist