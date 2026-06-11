## 1) What /discovery should produce (deliverables)
To run this discovery properly, we need outputs that let you:
- **Design an end-to-end digital journey** (web + mobile) including fallbacks to manual review.
- **Make the credit decision workflow compliant** with responsible lending requirements (and applicable lending conduct rules).
- **De-risk model governance** (independent validation, bias testing, documentation) before any “go-live” date.
- **Plan integrations** (core banking → bureau (Centrix) → decisioning → CRM/workflow → analyst tooling).
- **Set an implementation timeline** that realistically fits “go live before end of Q3”.

---

## 2) Key questions / open items the pipeline must resolve
### A. Regulatory / compliance (highest risk)
1. **Reasonable inquiries**: What exactly will the system collect and how will it evidence “reasonable inquiries” for responsible lending?
   - What fields/inputs are mandatory from the customer (income, expenses, dependants, existing liabilities, living costs, etc.)?
   - What do we rely on from bureau/core banking vs what must be asked directly from the customer?
2. **Explainability and adverse decisions**:
   - What reason codes will be shown?
   - What will happen if the customer challenges the decision?
3. **Privacy and consent**:
   - Will the mobile/web app capture explicit consent for bureau pull and internal data use?
   - Are consent logs required in Dynamics?
4. **FMA disclosure obligations**:
   - If you have already identified statistical differences in approval rates by demographic groups, what is the current regulatory stance and any reporting/engagement plan?
5. **Model governance / bias validation** (critical):
   - You noted bias concerns 8 months ago; discovery should define:
     - Independent validation scope and methodology
     - Target timelines and evidence required for sign-off
     - Whether the flow can launch with “limited amounts”/“holdout groups” while validation completes

### B. Credit policy and product constraints
6. **Loan up to $30,000 automated—what are the exact eligibility rules?**
   - Are there exclusions (e.g., employment type, existing arrears, CCJs/defaults, hardship markers, concentration limits)?
7. **Routing thresholds**:
   - Is it purely loan amount (> $30k → analyst), or are there other “manual review” triggers (e.g., missing data, low confidence, bureau error, inconsistent income)?
8. **Decision type**:
   - Will you produce “approve/decline” only, or also “conditional approve”?
9. **Affordability method**:
   - How will affordability be calculated from internal + bureau + customer-provided expenses?
   - How will you handle incomplete data?

### C. Customer journey design / data quality
10. **Data capture UX**:
   - What’s the minimum viable data entry to start while staying compliant?
   - How do we prevent users from entering inconsistent or incorrect info?
11. **Identity and authentication**:
   - What verification method (KYC) is used for mobile/web so you can safely pull bureau and financial data?
12. **Error handling**:
   - What happens if Centrix is unavailable?
   - What happens if bureau returns incomplete files?

### D. Integration and architecture
13. **Core banking transaction history pull**:
   - Which system(s) provide the transaction data?
   - What’s the data latency and rate limit?
14. **Decision service**:
   - Is decisioning via a rules engine, ML service, or offline model?
   - Do you need model versioning and decision traceability?
15. **Centrix bureau request**:
   - Latency target (same-day decisions implies fast responses)
   - Response schema and data quality checks
16. **Dynamics workflow**:
   - How do you create/update the application record?
   - How will analysts see the reason codes, bureau info, and internal risk scores?

### E. Assurance, monitoring, and auditability
17. **Decision traceability**:
   - For each application: what inputs were used, model version, rules triggered, bureau reference IDs?
18. **Monitoring and drift**:
   - How will you monitor approvals/declines by segment post-launch?
19. **Human escalation audit**:
   - Ensure any manual overrides are logged and reviewable.

---

## 3) Proposed discovery approach (practical plan)
### Phase 1 — Compliance + decision governance assessment (3–5 days)
- Map current **responsible lending** process (agent interview) into a **digital evidence framework**:
  - required customer statements
  - required bureau/internal data
  - calculations performed and stored
- Define **model risk posture**:
  - confirm what the internal bias review found
  - confirm the need for **independent validation** and what “done” looks like
- Output: “Go/no-go compliance checklist” and required remediation actions.

### Phase 2 — Current state process + target state journey (workshops)
- Workshops with:
  - Contact centre ops / credit analysts
  - Legal / risk / compliance
  - IT architecture + integration leads
- Produce:
  - target-state journey map (customer + system + analyst)
  - decisioning flow diagram (approve/decline/manual)
  - data dictionary (inputs/outputs per stage)
- Output: a “single source of truth” workflow spec.

### Phase 3 — Integration discovery (Centrix, core banking, Dynamics)
- Build an integration inventory:
  - APIs, batch options, eventing
  - latency budgets for same-day decisions
  - fallback behavior
- Output: integration plan + sequence diagrams.

### Phase 4 — Data, model, and audit requirements (assurance blueprint)
- Define:
  - required logging fields and audit trail
  - model versioning and fairness monitoring metrics
  - test strategy (UAT + compliance sign-off evidence)
- Output: Assurance & test plan.

### Phase 5 — Delivery plan against “end of Q3”
- Convert work into an implementation timeline with dependencies:
  - bias validation completion dates
  - legal confirmation for responsible lending evidence
  - integration readiness
  - security/privacy sign-offs
- Output: a realistic go-live roadmap + contingency plan.

---

## 4) Major risks that discovery should explicitly surface
1. **Bias not independently validated**: launching without independent fairness assessment will likely be a major regulatory/ethical breach, especially given prior internal findings.
2. **Responsible lending evidence**: if legal later concludes the system didn’t make “reasonable inquiries” in a sufficiently equivalent way to the agent interview, you may need a redesign (and delaying go-live).
3. **Same-day expectation vs integration latency**: Centrix/core banking response times can break the customer promise.
4. **Explainability requirements**: a “black box approve/decline” may be insufficient for adverse action handling.
5. **Customer data quality**: without strong KYC + validation, affordability calculations can be invalid.

---

## 5) Suggested “target-state” decision workflow (to validate in discovery)
**Stage 0: Pre-check / KYC**
- customer identity verified
- consent obtained (bureau + internal data)

**Stage 1: Application intake**
- loan purpose, amount, term
- mandatory financial inputs (income/expenses/liabilities/household data)
- affordability questionnaire + validation

**Stage 2: Data enrichment**
- pull transaction history from core banking
- request Centrix bureau
- compute internal features and risk scorecard inputs
- detect missing/contradictory data

**Stage 3: Automated decision**
- apply eligibility + affordability rules
- run decision model for loans **≤ $30,000**
- output: decision + reason codes + evidence trail

**Stage 4: Manual review routing**
- if **> $30,000** OR if data quality/confidence fails OR business rules require
- create analyst case in Dynamics with traceability

**Stage 5: Customer communication**
- instant response for automated cases (approve/decline/conditions)
- clear instructions and appeal/challenge path

---

## 6) Concrete outputs we should ask you for to proceed
To start discovery immediately, please provide (or confirm):
1. The **current credit decision model** type and how it’s deployed (rules vs ML, versioning, documentation).
2. The results of the **8-month bias review** (at least: which demographic groups, what “statistically different” means, and any action recommendations).
3. The **agent interview checklist** and the exact financial fields collected today.
4. What data you currently have available in core banking:
   - typical transaction history granularity
   - how long it’s stored and retrievable
5. Centrix bureau availability:
   - typical latency and any sandbox access
6. Dynamics workflow requirements:
   - where applications live, and how analysts review/override today.
7. Current intended integration pattern:
   - synchronous API calls vs async with polling/notifications.

---

## 7) Answer to “Can we go live before end of Q3?”
From a discovery perspective: **it is only realistic if legal sign-off and independent model validation are de-risked early**. Given:
- prior bias concern found but not escalated,
- legal hasn’t confirmed responsible lending evidence requirements for automation,
- you want same-day decisions (integration + monitoring + audit all must be ready),

…discovery should recommend one of two paths:
- **Conservative path (recommended)**: complete independent validation + compliance evidence design before enabling the automated decision for real customers (or restrict to very narrow eligibility with enhanced monitoring and manual confirmation).
- **Time-boxed path (riskier)**: limited pilot/soft launch with tight eligibility + “manual confirm” fallback, while validation is completed—only if legal/compliance approves the approach.

---

If you want, I can turn this into a **discovery workshop agenda** (day-by-day), plus a **checklist** of artifacts to produce (compliance evidence pack, decision traceability spec, integration latency test plan, and model validation requirements).