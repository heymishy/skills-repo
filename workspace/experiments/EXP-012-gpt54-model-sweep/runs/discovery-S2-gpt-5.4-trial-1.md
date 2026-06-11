**/discovery output**

## 1) Executive summary

The business wants to digitise personal loan origination for existing customers, reducing turnaround from **3–5 days to same-day** for loans up to **$30,000**, with larger loans routed for manual review. Strategic drivers are **competitive pressure**, **customer drop-off**, and **operational efficiency**.

This is **not ready to proceed directly to delivery** as described.

There are two major blockers:

1. **Responsible lending / CCCFA compliance is not yet designed for the digital journey**  
   The current compliance control depends on a manual agent interview. The future-state automated flow has no confirmed mechanism to satisfy the same obligation.

2. **Material model risk / conduct risk exists in automated decisioning**  
   There is known evidence of **statistically different approval rates across demographic groups**, the model has **not been independently validated for bias**, and the issue was **not escalated**. This creates significant legal, regulatory, reputational, and customer harm risk, especially if the bank automates adverse decisions at scale.

## 2) Recommendation

**Recommendation: Conditional proceed via phased discovery and gated delivery, not full go-live by current scope/timeline.**

Suggested path:

- **Phase 1:** Digital application intake + analyst-assisted decisioning
  - Build mobile/web application capture
  - Integrate core banking and Centrix
  - Pre-fill and package applications for credit analysts
  - No straight-through automated decline/approval until controls are validated

- **Phase 2:** Limited automation with strong guardrails
  - Potentially automate only low-risk approvals after legal, risk, and model validation sign-off
  - Keep declines and borderline cases in manual review initially

- **Phase 3:** Fuller automation if compliance, model validation, and governance are proven

If leadership insists on Q3, the safest feasible interpretation is likely **digital origination with partial automation**, not unrestricted automated decisioning.

## 3) Problem statement

Current state:
- Customer calls contact centre
- Agent manually enters information in Dynamics
- Credit analyst reviews using bureau + internal transaction history
- Decision in 3–5 days

Pain points:
- Slow turnaround
- Customer attrition to competitors with digital journeys
- Manual effort and operating cost
- Inconsistent customer experience

Desired future state:
- Existing customers apply via app/web
- Enter loan purpose, amount, term
- System gathers internal transaction data + Centrix report + internal scorecard
- Automated decision for loans up to $30,000
- Manual review above $30,000

## 4) Business outcomes sought

Primary outcomes:
- Reduce decision time from days to same-day
- Increase application conversion
- Retain customers versus ASB/ANZ
- Lower manual processing costs
- Improve digital customer experience

Potential measurable KPIs:
- Application-to-decision SLA
- Application abandonment rate
- Conversion rate
- Funded loan volume
- Cost per application
- Analyst workload reduction
- NPS / customer satisfaction
- Manual review rate
- Override rate
- Default / arrears performance by segment

## 5) Key stakeholders

Business:
- Personal Lending team
- Contact Centre
- Credit Analysts
- Digital / Channels team
- Product owner for personal loans

Risk / control:
- Credit Risk
- Model Risk Management
- Compliance
- Legal
- Conduct Risk
- Privacy
- Internal Audit

Technology / delivery:
- Mobile app team
- Web team
- Integration / API teams
- Core banking team
- Dynamics team
- Decisioning platform / scorecard owners
- Data / analytics / MLOps (if applicable)
- Security / IAM

External:
- Centrix
- Potential regulators indirectly affected: **FMA**
- Possibly lenders/consumer protection advisors internally

## 6) Scope decomposition

### In scope
- Digital application journey for existing customers
- Data capture: purpose, amount, term, customer declarations
- Pull internal transaction history
- Request and ingest Centrix bureau report
- Apply internal scorecard
- Decision routing:
  - <= $30k target automated path
  - > $30k manual analyst path
- Case management / referral workflow
- Customer communications and status updates

### Likely also required but not explicitly stated
- Identity/session/authentication controls for existing customers
- Consent capture for credit bureau check
- Responsible lending inquiries and attestations
- Adverse action / decline communications
- Audit logging and explainability
- Exception handling / fallback if services unavailable
- Monitoring and reporting
- Complaint handling process updates

### Out of scope for now
- New-to-bank customers
- Unsecured lending model redevelopment unless forced by risk/legal findings
- Full omnichannel transformation of all lending products

## 7) Current-state to future-state change

### Current controls embedded in manual process
The manual process is not just data entry; it contains hidden control points:
- Agent interview satisfies or contributes to CCCFA “reasonable inquiries”
- Analyst judgment may mitigate edge cases
- Humans may identify anomalies not captured by scorecard
- Manual review can detect inappropriate automation outcomes

### Future-state risk
Digitisation removes those human control points unless explicitly redesigned:
- No interview = possible compliance gap
- Automated model may embed bias at scale
- Same-day decisions reduce opportunity for manual correction
- Customer self-service may worsen misunderstanding or misrepresentation if questions are poorly designed

## 8) Major risks and issues

### A. Regulatory / legal risk — HIGH / BLOCKER
**Issue:** Legal has not confirmed how the automated flow will satisfy responsible lending obligations under the CCCFA.

Why this matters:
- Existing compliance relies on manual inquiry
- Automated journey must still make “reasonable inquiries” into financial situation
- If not properly designed, loans could be originated non-compliantly at scale

Discovery questions:
- What exact inquiries are mandatory?
- Which can be inferred from transaction data vs must be explicitly asked?
- What evidence must be retained?
- Are customer declarations alone sufficient?
- Is open banking/account analysis needed?  
- What affordability and suitability assessments are required?

**Assessment:** This is the most immediate go/no-go issue.

---

### B. Model bias / fairness / conduct risk — HIGH / BLOCKER
**Issue:** Internal review found statistically different approval rates across demographic groups; model has not been independently validated for bias; not escalated; not disclosed to FMA.

Why this matters:
- Automated decisioning can create systemic discrimination or unfair outcomes
- Prior knowledge of disparate outcomes increases severity
- Failure to escalate is a governance red flag
- If deployed broadly, issue becomes more visible and damaging

Discovery questions:
- What demographics showed differences?
- Was disparity explainable by legitimate risk factors or not?
- What fairness metrics were used?
- Was there testing for proxy discrimination?
- Who is model owner?
- What is current model validation status?
- What policy requires escalation / regulatory notification?
- What customer remediation exposure exists if already in use?

**Assessment:** No automated adverse decisions should go live until this is independently assessed and governance completed.

---

### C. Governance / non-financial risk escalation failure — HIGH
**Issue:** Material finding identified 8 months ago was not escalated beyond the reviewing team.

Implications:
- Weak risk governance
- Potential breach of internal policy
- Potential regulator concern if discovered
- Raises doubt about readiness for increased automation

Action:
- Immediate formal escalation to CRO / model risk / compliance / legal
- Determine whether historical use requires incident treatment

---

### D. Reputational risk — HIGH
If customers perceive unfair automated declines, or media/regulators focus on biased AI/automation in lending, impact could be significant.

---

### E. Operational risk — MED/HIGH
Dependencies on:
- Core banking transaction feeds
- Centrix availability/performance
- Decisioning engine reliability
- Referral workflow for >$30k and exceptions
- Customer support for abandoned/incomplete applications

---

### F. Privacy / data use risk — MED/HIGH
Need clear lawful basis, customer disclosures, consent where required, retention rules, and secure handling of:
- Bureau data
- Internal transaction data
- Potentially sensitive inferred financial information

---

### G. Credit risk — MED/HIGH
If scorecard not appropriate for straight-through automation, risk of:
- Increased losses
- Poor calibration in digital channel
- Gaming / misstatement
- Missing contextual information analysts currently use

## 9) Assumptions to test

- Existing customers in authenticated digital channels can be sufficiently identified
- Core banking transaction history is accessible in a timely, reliable way
- Centrix integration can be implemented within timeline
- Internal scorecard is suitable for automated origination
- Regulatory obligations can be satisfied digitally without manual interview
- Analysts can absorb referred workload
- Same-day decisioning materially improves conversion
- Customers are willing to complete digital application journey unaided

## 10) Critical unknowns

1. What legal design satisfies CCCFA “reasonable inquiries” in a digital flow?
2. Whether the current model can legally/ethically support automated decisions
3. Whether independent validation can be completed before Q3
4. What governance actions are required for the unescalated bias finding
5. What adverse action explanation is required for declines
6. Whether bureau and internal data are sufficient without additional income/expense capture
7. Whether all existing customers are in scope or only pre-qualified segments
8. What fraud controls are needed for digital origination
9. Whether current systems support real-time/near-real-time orchestration

## 11) Delivery feasibility by Q3

### Full stated scope by Q3
**Low confidence**

Because:
- Compliance design unresolved
- Model validation unresolved
- Governance issue may trigger broader review
- Multi-system integration is non-trivial
- Decisioning and customer communications need careful controls

### Reduced scope by Q3
**Moderate confidence**, if scoped to:
- Digital application intake
- Consent and disclosures
- Data aggregation
- Analyst workbench/case creation
- Manual final decision for all or most cases
- Possibly pilot automated approvals for narrowly defined low-risk segment only after approvals

## 12) Proposed discovery workstreams

### Workstream 1: Regulatory and legal design
Define:
- Required customer questions
- Evidence and record-keeping
- Suitability/affordability rules
- Disclosure requirements
- Consent requirements for bureau pull
- Use of transaction data in inquiries
- Whether automated decisioning changes obligations

Deliverable:
- Signed-off compliance requirements for digital journey

### Workstream 2: Model risk and fairness review
Assess:
- Bias/fairness outcomes
- Independent validation status
- Explainability
- Override strategy
- Monitoring requirements
- Whether to allow auto-approval, auto-decline, or decision support only

Deliverable:
- Model risk opinion and go/no-go guardrails

### Workstream 3: Customer journey and UX
Design:
- App/web flows
- Data capture
- Customer declarations
- Clarifying questions
- Referral states
- Save/resume
- Help/support pathways

Deliverable:
- Journey maps, prototype, service blueprint

### Workstream 4: Data and integration architecture
Define:
- Core banking data extraction
- Centrix integration
- Decisioning orchestration
- Dynamics / case management integration
- Logging/audit trail
- Failure handling

Deliverable:
- Solution architecture and NFRs

### Workstream 5: Operations and controls
Design:
- Manual review queues
- SLA management
- Exceptions handling
- Customer complaints and remediation
- Monitoring dashboards
- Post-decision review sampling

Deliverable:
- Operating model and control framework

## 13) Suggested target operating model

Near-term safer TOM:
- Customer applies digitally
- System pre-fills and assesses
- If amount > $30k -> analyst queue
- If amount <= $30k:
  - Low-risk, policy-clean cases may be candidate for auto-approval only after sign-off
  - Declines and borderline cases route to analyst/manual review initially
- All decisions logged with reason codes
- Ongoing monitoring for fairness, overrides, complaints, arrears

This reduces harm from automated negative decisions while preserving some speed benefits.

## 14) Key decisions needed from sponsors

1. Are we willing to **de-scope full automation** to meet Q3?
2. Should automated declines be prohibited initially?
3. Will leadership accept that compliance and model validation are stage gates?
4. Do we treat the bias finding as a formal risk/incident requiring escalation now?
5. What customer segment do we launch with first?
6. What is the acceptable trade-off between speed and control?

## 15) Initial requirements list

### Functional
- Authenticated customer access via app/web
- Capture loan purpose, amount, term
- Capture additional financial information/declarations as legally required
- Bureau consent and retrieval
- Internal transaction data retrieval
- Scorecard execution
- Decision routing
- Analyst referral and case management
- Customer notifications
- Audit trail
- Application status tracking

### Non-functional
- Security and privacy
- Availability and resilience
- Low latency for same-day decisions
- Explainability and traceability
- Accessibility
- Monitoring and alerting
- Model performance monitoring
- Full decision auditability

## 16) Discovery artefacts to produce

- Problem statement and business case
- Current/future state maps
- Risk register
- Regulatory obligations matrix
- Model risk assessment summary
- Solution architecture options
- Service blueprint
- Delivery roadmap with gates
- MVP definition
- Success metrics
- RAID log

## 17) RAID snapshot

### Risks
- CCCFA non-compliance in digital journey
- Biased/discriminatory automated decisions
- Regulatory scrutiny due to prior non-escalation
- Integration delays
- Inadequate auditability

### Assumptions
- Existing customer data is sufficient
- Legal can define acceptable digital inquiries quickly
- Centrix API integration is straightforward

### Issues
- Known but unaddressed fairness concern
- No independent bias validation
- No confirmed legal approach for automated responsible lending

### Dependencies
- Legal/compliance decisions
- Model risk validation
- Core banking integration
- Centrix contract/API readiness
- Decisioning platform readiness

## 18) Go / no-go view

### As currently framed: **No-go for full automated decisioning**
Not until:
- Legal confirms CCCFA-compliant digital inquiry design
- Independent model bias/fairness validation is complete
- Governance/escalation issue is addressed
- Monitoring, explainability, and manual fallback are in place

### For a reduced-scope MVP: **Conditional go**
If MVP is reframed to:
- Digital capture
- Automated data gathering
- Decision support / analyst-assisted processing
- Limited or no automated declines
- Strong controls and staged rollout

## 19) Recommended next 2 weeks

1. **Immediate escalation** of model bias finding to Risk, Compliance, Legal, and executive sponsor
2. Convene **cross-functional discovery squad**
3. Run legal workshop on **CCCFA digital compliance design**
4. Commission **independent model validation/fairness review**
5. Define **Q3 MVP options**:
   - Option A: Digital intake + manual decision
   - Option B: Digital intake + auto-approve low-risk only
   - Option C: Full automation later
6. Produce architecture and dependency assessment
7. Draft risk-based stage gates for launch approval

## 20) Bottom line

There is a strong business case for digitising the journey, but the current proposal contains **serious compliance and fairness risks** that make a straight move to automated decisioning unsafe.

**Best path:** proceed with discovery immediately, reframe Q3 toward a **controlled MVP**, and require legal + model risk sign-off before any automated lending decisions are made at scale.