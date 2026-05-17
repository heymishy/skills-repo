# Definition — Digital Personal Loan Origination Flow

**Feature slug:** 2026-05-17-digital-personal-loan-origination
**Definition date:** 2026-05-17
**Pipeline:** EXP-008-corpus-breadth-eval / Config C / Story S2
**Stage model:** claude-haiku-4-5

**Discovery reference:** [config-C-S2/discovery.md](config-C-S2/discovery.md)

---

## Slicing strategy

**Chosen: User journey**

This feature is workflow-heavy: the customer's path through the application flow determines system behaviour (APPROVE/DECLINE/REFER gates, analyst escalation threshold, decision rationale delivery). Regulatory constraints (CCCFA, FMA) are embedded in the workflow, not isolated to a single layer. User journey slicing ensures each epic and story delivers observable end-to-end value and makes constraint propagation visible at each step.

---

## Epic structure

### Epic 1: Automated Digital Loan Application — Customer Journey

**Goal:** An existing enterprise customer can submit a personal loan application digitally (web or mobile), receive an automated decision for loans ≤$30,000, and understand the decision rationale — with all inputs logged for audit trail compliance.

**Complexity:** 2 (moderate — straightforward UI + integration flow, but regulatory constraints require legal sign-off and compliance gates)
**Scope stability:** Unstable (CCCFA reasonable inquiry methodology and FMA disclosure gates must be resolved before story ACs are locked)
**Human oversight:** High (regulatory compliance sign-off and FMA disclosure decisions require business/legal engagement before any coding begins)

**Out of scope:**
- Credit Decisioning Model algorithm changes or retraining (flagged as prerequisite gate)
- Demographic bias remediation or FMA algorithmic fairness validation (prerequisite gate — CDM-RISK-002)
- New-to-bank customer onboarding (existing customers only for MVP)
- Mobile app UI framework changes or new component library work (use existing components)
- Analyst tooling (Dynamics 365) customisation — analyst queue integration only via API

**Constraints carried forward:**
- C1 (CCCFA reasonable inquiry — legal sign-off required before launch)
- C2 (FMA algorithmic fairness — independent model validation required pre-deployment)
- C3 (Centrix DSA — new DSA required for personal lending)
- C4 (Automated decision ceiling at $30,000)
- C5 (FMA disclosure of demographic disparity — enforcement risk without resolution before go-live) **[BLOCKER]**

**Benefit metrics addressed:**

| Metric | Baseline | Target | Story impact |
|--------|----------|--------|--------------|
| Time-to-decision (loans ≤$30k) | 3–5 business days | Same-day automated decision (minutes) | E1.1–E1.3 deliver automated pathway; E1.4 ensures audit trail for CCCFA compliance |
| Application completion rate | Unknown (contact centre baseline to be established) | Digital rate ≥ contact centre rate | E1.1 (application UI) and E1.2 (decision delivery) move this metric |
| Automated approval rate | 0% (all manual) | ≥70% of submitted applications auto-decided | E1.3 (decisioning integration) and E1.4 (regulatory gates) move this metric |
| Compliance sign-off achieved | Not achieved | Written sign-off on CCCFA, Centrix DSA, FMA disclosure, model validation | E1.4 gates all metric delivery — no launch without compliance |

---

### Epic 2: Analyst Escalation Pathway — Manual Review for Above-Threshold Applications

**Goal:** Applications above $30,000 and REFER decisions are automatically routed to the analyst queue in Dynamics 365, enabling credit analysts to manage the manual review workflow within existing tooling without code changes.

**Complexity:** 1 (well-scoped integration — fixed threshold, straightforward API integration to Dynamics 365)
**Scope stability:** Stable (threshold is defined; Dynamics integration is well-understood)
**Human oversight:** Low (straightforward integration, no new UI or business logic changes)

**Out of scope:**
- Analyst Dynamics 365 workflow configuration (analyst team to configure their queue rules)
- Changes to analyst review turnaround times or queue SLAs
- New analyst reporting or monitoring dashboards
- Escalation reason coding beyond what the decisioning model outputs

**Constraints carried forward:**
- C4 (automated decision ceiling at $30,000 — all above-threshold apps route to analyst)
- C1 (analyst queue becomes part of CCCFA audit trail for escalated applications)

**Benefit metrics addressed:**

| Metric | Baseline | Target | Story impact |
|--------|----------|--------|--------------|
| Analyst queue volume and throughput | 100% of applications manually reviewed | ≤30% of submitted applications in analyst queue (above-$30k + REFER cohort) | E2 routes above-threshold and REFER apps to analyst, reducing analyst queue from 100% to expected ≤30% for ≤$30k auto-approved cohort |

---

### Epic 3: Regulatory Audit Trail and Compliance Gates

**Goal:** Every loan application is logged with full input audit trail, decision rationale, and outcome in a queryable format retained for 7 years — satisfying CCCFA audit trail requirements and enabling FMA examination audit evidence.

**Complexity:** 1 (straightforward logging infrastructure — no new business logic)
**Scope stability:** Stable (CCCFA audit trail requirement is clear and fixed)
**Human oversight:** Medium (audit trail architecture must be reviewed by compliance/legal before implementation begins)

**Out of scope:**
- Customer-facing audit trail access interface (separate story, out of MVP scope)
- Real-time audit event streaming or alerting
- Audit log encryption or PII masking (compliance to specify requirements in AC)

**Constraints carried forward:**
- CCCFA audit trail requirement (7-year retention, queryable format)
- C1 (audit trail is part of CCCFA reasonable inquiry evidence)
- C5 (audit trail must capture demographic characteristics passed to the decisioning model — evidence for FMA enforcement review if C5 escalates)

**Benefit metrics addressed:**

| Metric | Baseline | Target | Story impact |
|--------|----------|--------|--------------|
| Compliance sign-off achieved | Not achieved | Audit trail architecture reviewed and approved by legal/compliance pre-go-live | E3 delivers the technical audit trail infrastructure that legal and compliance need to sign off on CCCFA and FMA requirements |

---

## Stories

### E1: Automated Digital Loan Application — Customer Journey

#### Story E1.1: Customer completes digital loan application via web or mobile interface

**Persona:** Existing enterprise customer seeking a personal loan (primary user)

**User Story:**
As an existing enterprise customer,
I want to complete a personal loan application through the enterprise mobile app or web without calling the contact centre,
So that I can receive an automated lending decision same-day rather than waiting 3–5 days.

**Benefit linkage:** Reduces time-to-decision from 3–5 business days to same-day for ≤$30k loans; improves application completion rate by eliminating friction of phone-based entry.

**Dependencies:**
- Upstream: C3 (Centrix DSA scope confirmation required before bureau query consent is collected)
- Upstream: C1 (CCCFA reasonable inquiry methodology sign-off required before application questions are finalized — must ensure transaction history + expenses declaration satisfies legal standard)
- Downstream: Unblocks E1.2, E1.3, E1.4

**Acceptance Criteria:**

1. **Given** a customer is logged into the enterprise mobile app or web browser **when** they navigate to the personal loan application flow **then** the application form is displayed with the following fields: loan amount ($1,000–$50,000), loan purpose (select list: home improvement, vehicle, debt consolidation, other), loan term (12–60 months), and customer-declared monthly expenses (text entry field).

2. **Given** the customer has entered loan amount, purpose, term, and expenses declaration **when** they tap "Submit Application" **then** the system validates that all required fields are present and amount is within bounds ($1,000–$50,000), and if valid, submits the application for processing; if invalid, displays specific validation errors in-context (not a new page).

3. **Given** the application has been submitted **when** the customer is redirected to a "Decision Pending" page **then** the page displays: (a) application reference number, (b) estimated decision timeframe ("Typically within minutes"), (c) notification method (SMS / email / in-app), (d) next steps (what happens after approval/decline/refer-to-analyst).

4. **Given** the application submission succeeds **when** the applicant email and phone number are recorded **then** an audit log entry is created recording: applicant ID, application timestamp, submitted form data (amount, purpose, term, declared expenses), and submission status (success / validation failure reason).

5. **Given** the applicant has a partially completed application session **when** they close the browser or app **then** the application session is retained server-side; if the customer re-enters the flow within 24 hours, the partial data is reloadable; after 24 hours, the session is discarded and the customer must start a new application.

**Architecture constraints:**
- No direct database access from UI — all form submission and audit logging via REST API
- Customer authentication must use existing enterprise SSO (no new auth implementation)
- Loan amount validation must be performed server-side (not just client-side)
- Audit log data schema reviewed and approved by legal/compliance (contains applicant PII and decision inputs; audit trail is part of CCCFA evidence)

**Out of scope:**
- UI framework or styling changes to the mobile app or web platform
- Multi-language support (English only for MVP)
- Accessibility compliance beyond WCAG 2.1 AA (existing platform baseline)
- Customer education or help documentation

---

#### Story E1.2: Customer receives automated lending decision and understands decision rationale

**Persona:** Existing enterprise customer seeking a personal loan

**User Story:**
As a customer who submitted a personal loan application,
I want to receive my lending decision with clear reasoning that I can understand,
So that I trust the decision and know what to do next (accept terms, contact support, reapply).

**Benefit linkage:** Moves time-to-decision metric — same-day decision delivery replaces 3–5 day wait. Moves application completion rate metric — transparent decision rationale reduces customer confusion and support escalations.

**Dependencies:**
- Upstream: E1.1 (application submission must complete)
- Upstream: E1.3 (decisioning model must be integrated to produce decision and rationale)
- Downstream: Unblocks E1.4 (audit trail must capture decision rationale for CCCFA evidence)

**Acceptance Criteria:**

1. **Given** an application has been submitted and the Credit Decisioning Model has returned an APPROVE, DECLINE, or REFER outcome **when** the decision is ready (typically within 2–5 minutes) **then** the customer is notified via SMS / email / in-app notification with a decision delivery URL and PIN to view the decision securely.

2. **Given** the customer accesses the decision page using the provided PIN **when** the page loads **then** it displays: (a) decision outcome (APPROVED / DECLINED / REFERRED TO ANALYST), (b) decision timestamp, (c) decision rationale summarising key factors that influenced the decision (e.g., "Application APPROVED — income verified via transaction analysis; debt-to-income ratio acceptable; bureau credit score within approved range"), (d) next steps (for APPROVE: download credit agreement; for DECLINE: contact support; for REFER: analyst will contact within 24 hours).

3. **Given** the outcome is APPROVE **when** the customer views the decision page **then** the approved credit terms are displayed: loan amount, interest rate, monthly payment, term, early repayment options, and a link to download or electronically sign the credit agreement.

4. **Given** the outcome is DECLINE **when** the customer views the decision page **then** a support contact number and email are displayed, and a brief reason summary is shown (e.g., "Application not approved — transaction analysis indicates insufficient affordability"); specific reasons (e.g., credit score, income, debt thresholds) are NOT disclosed (compliance guidance: provide enough transparency to build customer trust without exposing model details that could enable gaming).

5. **Given** the outcome is REFER **when** the customer views the decision page **then** the message states "Your application is being reviewed by our credit team — we'll contact you within 1 business day" with the analyst team phone number and estimated callback window.

6. **Given** a customer has viewed the decision page **when** they close the browser or app **then** the decision remains retrievable for 90 days via the decision page URL (for APPROVED customers to download terms and sign; for REFERRED customers to track analyst progress).

**Architecture constraints:**
- Decision rationale must be generated deterministically from the model output; rationale logic (not the model itself) is in the application layer and can be tested and audited for bias or incorrect framing
- Decision pages must not disclose model input features or weights
- All decision communications (SMS, email, in-app notification) must be templated and auditable (logged for CCCFA audit trail)

**Out of scope:**
- Email template design (use existing enterprise email template)
- SMS provider selection (use existing SMS service)
- Multi-language decision rationale (English only)
- Branding or visual design changes to decision page

---

#### Story E1.3: Credit Decisioning Model integration produces automated decision outcome

**Persona:** System (automated decisioning pipeline)

**User Story:**
As the automated lending system,
I want to invoke the Credit Decisioning Model with applicant transaction history, bureau data, and declared expenses,
So that I can produce a consistent automated lending decision (APPROVE / DECLINE / REFER) for applications within policy scope.

**Benefit linkage:** Enables same-day automated decision delivery; moves automated approval rate metric (target ≥70% of applications auto-decided for ≤$30k).

**Dependencies:**
- Upstream: E1.1 (application data must be collected)
- Upstream: Core Banking Transaction API integration (must be available to pull 12-month history)
- Upstream: Centrix DSA scope confirmation (C3 — Centrix bureau integration cannot proceed without new DSA)
- Upstream: C1 gate: CCCFA methodology sign-off (model output + application inputs together must satisfy reasonable inquiry standard; legal must confirm)
- Upstream: C2 gate: Independent model validation (FMA Principle 2 — model must be validated for fairness before automated deployment)
- Downstream: Unblocks E1.2 (decision delivery), E1.4 (audit trail must capture model inputs and decision outcome)

**Acceptance Criteria:**

1. **Given** an application (E1.1) has been submitted with applicant ID, amount, purpose, term, declared expenses **when** the decisioning workflow is triggered **then** the system calls Core Banking Transaction API to fetch 12 months of transaction history for the applicant; if insufficient data is available (e.g., account created <12 months ago), the system flags this as a REFER-TO-ANALYST condition; if ≥12 months history is available, continue to next step.

2. **Given** transaction history is available **when** the decisioning workflow continues **then** the system computes affordability metrics: total monthly income (inferred from salary deposits and other recurring deposits), existing debt obligations (inferred from loan payments, credit card payments), monthly living expenses (inferred from outflows for utilities, groceries, subscriptions), and applicant-declared monthly expenses; a debt-to-income ratio (DDI) is calculated: DDI = (existing debt + applicant declared expenses) / monthly income.

3. **Given** affordability metrics are calculated **when** the workflow continues **then** the system invokes the Credit Decisioning Model (CDMV1) with input vector: [applicant age, income band, existing debt, DDI, transaction history recency, bureau credit score, loan amount, loan term, loan purpose]; the model returns: decision (APPROVE / DECLINE / REFER), risk score (0–100), and model confidence (0–1.0).

4. **Given** the Credit Decisioning Model has returned a decision **when** the decision is processed **then** the following business rules are applied: (a) if loan amount > $30,000, outcome is forced to REFER regardless of model decision; (b) if model confidence < 0.60, outcome is forced to REFER; (c) if model returns REFER, outcome is REFER; (d) if model returns APPROVE and amount ≤$30,000 and confidence ≥ 0.60, outcome is APPROVE; (e) if model returns DECLINE, outcome is DECLINE.

5. **Given** the final decision has been determined (APPROVE / DECLINE / REFER) **when** the outcome is ready **then** a decision record is created recording: applicant ID, application ID, decision outcome, risk score, model confidence, decision timestamp, and model version (CDMV1); this record is passed to E1.2 for delivery and to E1.4 for audit trail.

6. **Given** a REFER decision has been made **when** the decision record is created **then** the application record is sent to Dynamics 365 CRM for analyst queue routing (E2.1).

**Architecture constraints:**
- Model invocation must not block application submission — if the model service is unavailable, the outcome is REFER-TO-ANALYST
- Model input data (age, income, debt) must be validated for plausibility before invocation; invalid inputs trigger REFER
- Model output (decision, risk score, confidence) must be logged for audit and FMA examination evidence
- DDI calculation logic must be independently testable and auditable (code review and test coverage ≥80%)
- No model retraining or parameter tuning within this story (flagged as prerequisite gate)

**Out of scope:**
- Credit Decisioning Model algorithm changes or retraining
- Demographic bias remediation (prerequisite gate CDM-RISK-002)
- Alternative models or ensemble methods
- Real-time model performance monitoring (separate ops story)

---

#### Story E1.4: Complete audit trail — all application inputs, model decision, and decision outcome logged for CCCFA compliance

**Persona:** Legal and compliance team (audit trail consumer)

**User Story:**
As a member of the legal and compliance team,
I want a queryable audit trail recording every application's inputs, model decision, and outcome,
So that we can demonstrate compliance with CCCFA audit trail requirements during FMA examination and internal compliance reviews.

**Benefit linkage:** Enables compliance sign-off on CCCFA and FMA requirements — the audit trail is a prerequisite evidence artefact for go-live gate.

**Dependencies:**
- Upstream: E1.1 (application inputs must be captured)
- Upstream: E1.3 (model decision and model inputs must be captured)
- Upstream: Legal review and approval of audit trail schema and data retention policy (compliance sign-off required before implementation)

**Acceptance Criteria:**

1. **Given** an application has been submitted (E1.1) **when** the application data is recorded **then** an audit log entry is created in the audit database recording: (a) applicant ID (hashed for PII protection in logs), (b) application ID (unique identifier), (c) submission timestamp, (d) form data submitted: loan amount, loan purpose, term, declared expenses, (e) applicant transaction history metadata: account opened date, average monthly income (numerical range, not exact), debt obligations list (types, not balances).

2. **Given** the Credit Decisioning Model has returned a decision (E1.3) **when** the decision is recorded **then** a model decision audit log entry is created recording: (a) applicant ID (hashed), (b) application ID, (c) model version, (d) model input vector (numeric): income band, debt level, DDI, bureau score, transaction recency, age band (ranges, not individual values for PII protection), (e) model decision, (f) model risk score, (g) model confidence, (h) decision timestamp.

3. **Given** the customer has received the decision (E1.2) **when** the decision is delivered **then** a decision delivery audit log entry is created recording: (a) application ID, (b) final decision (APPROVE / DECLINE / REFER), (c) decision delivery method (SMS / email / in-app), (d) delivery timestamp, (e) for APPROVED applications: credit terms offered (amount, rate, term, monthly payment).

4. **Given** multiple audit log entries exist for an application **when** a compliance officer queries the audit trail for a specific application ID **then** all entries are retrievable in chronological order in a structured format (JSON or CSV); the query interface requires authentication (enterprise SSO) and logs who accessed what and when.

5. **Given** audit log entries are created **when** they are stored **then** they are retained for 7 years in queryable storage (database or data lake); after 7 years, entries may be archived or deleted per compliance policy (to be specified by legal); retention dates are tracked in metadata for audit purposes.

6. **Given** the audit trail schema and retention policy have been defined **when** implementation begins **then** a legal and compliance sign-off is recorded in a compliance sign-off artefact (separate file) stating: "Audit trail schema reviewed and approved — satisfies CCCFA audit trail requirement; 7-year retention policy accepted."

**Architecture constraints:**
- Audit logs must not contain PII in clear text (applicant ID, account numbers, exact income, etc. must be hashed or range-encoded)
- Audit logs must be tamper-evident (consider append-only storage or cryptographic hashing)
- Audit query interface must be separate from the application system (not accessible by the application code)
- Audit logs must be queryable by application ID, applicant (hashed ID), date range, decision outcome

**Out of scope:**
- Real-time audit event alerting
- Audit log visualization dashboard (separate ops story)
- PII encryption in audit logs (compliance to specify data masking policy)
- Integration with external audit providers or SIEM systems

---

### E2: Analyst Escalation Pathway

#### Story E2.1: Above-threshold and REFER applications automatically route to analyst queue in Dynamics 365

**Persona:** Credit analyst (internal operator)

**User Story:**
As a credit analyst,
I want applications above $30,000 and REFER decisions to automatically appear in my Dynamics 365 queue,
So that I can manage my review workload in existing tooling without switching systems.

**Benefit linkage:** Reduces analyst context-switching friction; moves analyst queue volume metric (automated APPROVE/DECLINE reduces analyst queue from 100% to target ≤30% of submitted applications).

**Dependencies:**
- Upstream: E1.3 (decisioning model must produce REFER or above-threshold outcome)
- Downstream: None within MVP (analyst review workflow is out of scope — Dynamics configuration is analyst team responsibility)

**Acceptance Criteria:**

1. **Given** the Credit Decisioning Model has returned a REFER outcome or the application amount is > $30,000 **when** the decision is finalized **then** an API call is made to Dynamics 365 CRM to create a new lead / opportunity record in the analyst queue with: (a) applicant name (from application), (b) loan amount requested, (c) application reference ID, (d) reason for queue (REFER due to model confidence, or above-threshold amount), (e) applicant contact phone and email, (f) link to view full application details.

2. **Given** the Dynamics 365 record has been created **when** the analyst logs into Dynamics **then** the new lead appears in their default queue (analyst team to configure queue rules and SLAs).

3. **Given** an application has been routed to the analyst queue **when** the analyst reviews and makes a final credit decision (APPROVE / DECLINE) in Dynamics **then** the application status in the loan origination platform is updated to reflect the analyst decision; the decision is treated as final for that application (no further routing).

4. **Given** the Dynamics 365 API integration **when** the integration is tested (pre-deployment) **then** a test record is successfully created and retrieved from Dynamics, confirming API connectivity and payload format are correct; API error handling is tested (timeout, auth failure, malformed response) and errors trigger a fallback alert to a support email address (not a customer-facing failure).

**Architecture constraints:**
- Dynamics 365 integration must use OAuth 2.0 authentication (no hardcoded credentials)
- API calls must be retried with exponential backoff if the Dynamics API is temporarily unavailable
- Integration must be non-blocking — if Dynamics API fails, the application is marked as "pending analyst queue delivery" with a retry job; customer is not blocked from viewing their decision

**Out of scope:**
- Dynamics 365 configuration (analyst team responsibility)
- Changes to analyst review workflow or SLA management
- New reporting or monitoring in Dynamics

---

### E3: Regulatory Audit Trail and Compliance Gates

#### Story E3.1: Compliance gate — CCCFA reasonable inquiry methodology signed off before go-live

**Persona:** Legal and compliance team

**User Story:**
As a member of the legal and compliance team,
I want formal written confirmation that the automated reasonable inquiry methodology satisfies CCCFA s.9C obligations before the system goes live,
So that the enterprise can proceed with full regulatory confidence and audit readiness.

**Benefit linkage:** Enables compliance sign-off — a prerequisite gate for the "compliance sign-off achieved" metric and go-live gate.

**Dependencies:**
- Upstream: E1.1 (application questions and transaction analysis logic must be designed before legal can review)
- Upstream: E1.4 (audit trail must be specified before legal can confirm evidence preservation requirements)
- Downstream: Gate — all coding work on E1–E2 is conditional on this gate passing

**Acceptance Criteria:**

1. **Given** the digital application flow (E1.1) has been designed **when** legal reviews the application questions and transaction analysis methodology **then** legal confirms in writing (sign-off memo) that: (a) the combination of applicant-entered financial data, transaction history analysis, and bureau credit report provides a reasonable inquiry into the applicant's financial situation under CCCFA s.9C, (b) the expenses declaration question captures applicant estimate of living expenses as required by Responsible Lending Code clause 7.6(c), (c) the audit trail (E1.4) preserves evidence of all inputs considered and decision rationale, satisfying record-keeping requirements.

2. **Given** legal review is complete **when** the sign-off memo is issued **then** the memo is filed in a compliance sign-off artefact (shared repository), dated, and signed by the legal signatory; the memo explicitly names the methodology version and implementation date (e.g., "Digital Personal Loan Origination v1 approved for go-live on [date]").

3. **Given** the sign-off memo has been issued **when** the feature approaches go-live **then** the memo is referenced in the go-live checklist; if the methodology is changed after sign-off, a new review cycle and sign-off are required (prevents scope creep).

**Architecture constraints:**
- No technical constraints — this is a gate story

**Out of scope:**
- Changes to CCCFA obligations or legal interpretation (legal team responsibility)
- Implementation of new application questions (that is E1.1; this story gates E1.1 before coding)

---

#### Story E3.2: Compliance gate — FMA demographic disparity disclosure resolved before go-live

**Persona:** Head of credit risk and legal team

**User Story:**
As the head of credit risk and a member of the legal team,
I want the undisclosed demographic disparity finding in the Credit Decisioning Model to be formally resolved (via FMA disclosure, remediation plan, or legal advice) before the digital channel goes live,
So that the enterprise can operate the automated channel with full regulatory and reputational protection.

**Benefit linkage:** Enables compliance sign-off — a prerequisite gate for the "compliance sign-off achieved" metric and go-live gate.

**Dependencies:**
- Upstream: None (prerequisite gate — must be resolved before any implementation work)
- Downstream: Gate — all coding work is conditional on this resolution

**Acceptance Criteria:**

1. **Given** the internal demographic disparity finding exists (12% approval rate difference between Māori and Pākehā applicants at the same income band) **when** the head of credit risk and legal have engaged with the FMA or obtained external legal advice **then** one of the following paths is completed: (a) FMA notification letter sent documenting the finding, investigation results, and remediation plan; (b) external legal opinion confirms that disclosure to FMA is not required because the disparity is driven by legitimate risk factors (e.g., income differences, existing debt patterns) rather than model bias; (c) internal remediation plan is approved by legal and risk, implementing model changes or decision rule adjustments to eliminate the disparity before the digital channel goes live.

2. **Given** one of the three paths has been completed **when** a compliance sign-off memo is issued **then** the memo explicitly states: (a) the resolution path chosen (disclosure / legal opinion / remediation), (b) the FMA notification letter reference or legal opinion citation, (c) confirmation that the digital lending channel can proceed without additional regulatory exposure from the historical disparity finding, (d) date of sign-off.

3. **Given** the sign-off memo has been issued **when** the feature approaches go-live **then** the memo is filed in the compliance sign-off artefact and referenced in the go-live checklist.

**Architecture constraints:**
- No technical constraints — this is a gate story

**Out of scope:**
- Implementation of model changes or demographic bias remediation (separate story if path 3 is chosen)
- FMA communication logistics (legal team responsibility)

---

## Scope accumulator

**Discovery MVP scope (in-scope items):**
- Digital application flow (mobile + web) ✓ E1.1
- Integration with Core Banking Transaction API ✓ E1.3
- Integration with Centrix Bureau API ✓ E1.3
- Credit Decisioning Model integration ✓ E1.3
- Automated decision for loans ≤$30,000 ✓ E1.3
- Decision delivery to customer ✓ E1.2
- Analyst escalation for above-threshold and REFER applications ✓ E2.1
- Decision rationale display to customer ✓ E1.2
- 7-year audit trail ✓ E1.4, E3.1, E3.2

**Discovery MVP scope (flagged out-of-scope):**
- Model retraining / algorithm changes — flagged as prerequisite gate ✓ not in any story
- Demographic bias remediation — flagged as prerequisite gate (C2 validation + C5 disclosure are E3.2 gates) ✓ E3.2
- New-to-bank lending — explicitly out of scope ✓ not in any story
- Lending above $50,000 — explicitly out of scope ✓ not in any story
- Analyst tooling customisation — out of scope, E2.1 integration only ✓ E2.1

**Constraint propagation check:**

| Constraint | Source | Carried in stories |
|-----------|--------|-------------------|
| C1 (CCCFA reasonable inquiry) | Discovery explicit | E1.1 (application questions), E1.4 (audit trail), E3.1 (sign-off gate) |
| C2 (FMA algorithmic fairness) | Discovery explicit + EA registry | E1.3 (implicit in "independent validation required"); E3.2 (implicit in FMA disclosure gate) |
| C3 (Centrix DSA scope) | Discovery explicit | E1.3 (upstream dependency: "Centrix DSA scope confirmation required before bureau query consent is collected") |
| C4 (Automated decision ceiling) | Discovery explicit | E1.3 (business rule: "if loan amount > $30,000, outcome is forced to REFER") |
| C5 (FMA disclosure of demographic disparity) | Discovery explicit + EA registry | E3.2 (explicit [BLOCKER] gate story) |

**No scope drift detected.** All discovery MVP scope items are in stories; all out-of-scope items are explicitly excluded; all 5 constraints are propagated into story acceptance criteria or gate conditions.

---

<!-- CPF-TRACE
stage: /definition
input_artefact: config-C-S2/discovery.md (constraints_identified: C1–C5 all explicit)
constraints_in_stories:
  - C1: E1.1 (application questions for CCCFA reasonable inquiry), E1.4 (audit trail for CCCFA compliance evidence), E3.1 (legal sign-off gate)
  - C2: E1.3 (model validation referenced as upstream dependency), E3.2 (implicit in FMA disclosure context)
  - C3: E1.3 (upstream dependency: Centrix DSA scope confirmation required)
  - C4: E1.3 (business rule explicitly states "if loan amount > $30,000, outcome is forced to REFER")
  - C5: E3.2 (explicit [BLOCKER] gate story; FMA disclosure, remediation plan, or legal advice required before go-live)
constraints_not_propagated: []
epics: 3
stories: 6 (E1.1–E1.4, E2.1, E3.1–E3.2)
slicing_strategy: user_journey
c5_surfaced: true
c5_surfacing_quality: full — C5 carried forward as explicit [BLOCKER] gate story (E3.2); all three sources from discovery retained (operator brief, EA registry CRITICAL rating, FMA Principle 3)
-->
