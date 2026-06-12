Thank you for the detailed background. Here’s a structured *discovery summary* to crystallize the challenge, opportunities, constraints, and immediate considerations for digitising the personal loan journey for enterprise customers:

---

## 1. **Current State**
- Application via **contact centre only**: Customer calls, agent inputs details into Dynamics.
- Manual process: Credit analyst reviews bureau data (Centrix) + internal transaction data + risk scorecard.
- **Turnaround:** 3–5 days end-to-end.
- Competitors (ASB, ANZ): Offer **same-day decisioning** via digital origination (web/mobile).
- **Lost business:** Customers are switching for better digital experiences and faster outcomes.

## 2. **Proposed Digital Flow**
- **Channels:** Web and mobile app for customer self-serve.
- **Process:** 
    - Customer completes digital form: loan purpose, amount, term.
    - Pull transaction history (core banking integration).
    - Pull Centrix bureau data (API integration).
    - Feed both into existing internal risk scorecard.
    - **Automated decision** for loans ≤$30,000.
    - **Manual review** for loans >$30,000 (workflow routed to credit analyst).
- **Timeframe:** Go live before end of Q3 to capitalize on winter peak.

## 3. **Key Risks & Issues**
### a) **Ethical and Regulatory Risk – Credit Model Bias**
- Model not independently validated for bias.
- Known statistical approval rate differences across demographics (found internally 8 months ago, but not escalated / disclosed to FMA).
- **Regulatory exposure:** Non-disclosure of a material issue under FMA expectations (conduct, fair outcomes).
- **Potential breach**: Unremediated bias may lead to adverse findings in an audit or customer complaint.

### b) **Responsible Lending (CCCFA, FMA Regulations)**
- Current manual process uses agent interview for reasonable inquiries into financial situation.
- Digital process *must* provide equivalent or better compliance (data sufficiency, affordability, suitability, express customer confirmation, etc).
- Legal hasn't confirmed whether proposed changes meet obligations.
- **Material blocker** if not addressed upfront.

## 4. **Success Measures**
- Loan decision turnaround time reduced to hours or real-time (for ≤$30,000).
- Improved win rate / reduction in application abandonment.
- Equivalent or improved compliance to responsible lending.
- Satisfactory model fairness and explainability.

## 5. **Dependencies & Unresolved Questions**
- **Legal Review:** Urgent need to clarify how digital process satisfies CCCFA responsible lending.
- **Model Validation:** Requirement for independent bias/fairness review and potentially retraining/adjusting model.
- **Tech Integration:** Confirm ability to ingest real-time Centrix data and deliver eligibility decisions instantaneously.
- **Customer Experience:** Design of UX for application journey, clear consent experiences (data sharing and affordability).
- **Operational Readiness:** Training, change management for credit analysts (new workflow, higher volumes).

## 6. **Risks if Not Addressed**
- Ongoing customer attrition to digital-first competitors.
- Reputational harm or regulatory censure if model bias or breach of lending obligations comes to light.
- Project delay if legal or compliance blockers emerge late in delivery.

---

## **Recommendations — Next Steps**
1. **Kick off legal and compliance validation** (parallel to solution design): Prioritize CCCFA mapping for digital processes — what data, inquiries, and customer explanations are required.
2. **Commission an independent review of the credit decision model**: Assess for unintended bias, document results, prepare remediation for any gaps. Establish FMA disclosure position.
3. **Technical feasibility check**: Confirm Centrix and transaction data integrations, and set system architecture.
4. **Define MVP scope**: Decide if any high-risk segments (e.g., certain amounts or demographics) are to remain manual until all issues resolved.
5. **Stakeholder comms**: Proactively inform the board/executive of model fairness concerns and action plan.

**Would you like help structuring workshops, mapping the end-to-end customer journey, or preparing a detailed risk log?**