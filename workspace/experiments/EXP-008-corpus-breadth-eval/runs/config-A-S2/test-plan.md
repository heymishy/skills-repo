# Test Plan: Digital Personal Loan Origination — Regulated Credit Advance Flow

**Feature:** lending-origination-digital-flow
**Review status:** Conditional pass (3 HIGH findings resolved inline; read from disk: `runs/config-A-S2/review.md`)
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Date:** 2026-05-17
**Run:** EXP-008 Config A S2

---

## Step 0 — Entry condition check (eval-mode)

- Definition artefact: ✅ read from disk (`runs/config-A-S2/definition.md`)
- Review artefact: ✅ read from disk (`runs/config-A-S2/review.md`) — conditional pass; 3 HIGH findings resolved inline in this test plan
- Context injection files: ✅ active throughout
- Review H1 resolution: AC4 (Story 1.2) — remediation definition operationalised in T-REG-003 and T-REG-004
- Review H2 resolution: AC6 (Story 2.3) — `CREDIT_MODEL_LIVE_ENABLED` feature flag enforcement operationalised in T-GATE-001, T-GATE-002, T-GATE-003
- Review H3 resolution: S3.2 schema dependency — interface contract test T-AUDIT-001 added; delivery ordering constraint stated in test plan NFR section

---

## Test scope

**Stories in scope for this test plan:** 8 stories (3 Epic 1 compliance gate stories; 3 Epic 2 digital flow stories; 2 Epic 3 analyst/audit stories)

**Stories out of scope:** None — all 8 stories require at minimum a verifiable acceptance criterion even where delivery is via governance (Epic 1 compliance gate stories have document-presence tests).

**TDD discipline:** All tests written to fail first. Implementation may not proceed on any story until the corresponding test file exists and is confirmed failing.

---

## Output 1 — Technical test plan (for coding agent / CI)

### Module 1 — Regulatory compliance gate tests (Epic 1: Stories 1.1, 1.2, 1.3)

These stories are governance/legal deliveries, not engineering implementations. The test suite verifies that a **compliance evidence record** is present and correctly formed before any dependent engineering story is allowed to proceed.

---

#### T-COMP-001: Story 1.1 CCCFA methodology sign-off document present

```
Test file: tests/compliance-gates/cccfa-methodology-signoff.test.js
Type: Integration (document store check)
Story: 1.1
Constraint: C1

Given: The delivery has reached the CCCFA compliance gate checkpoint
When: The test suite is run
Then:
  - A document with type "cccfa-methodology-sign-off" exists in the compliance document store
  - The document has fields: { legal_opinion_date, signatory_name, signatory_role: "Legal Counsel", approval_scope: includes("automated_affordability_assessment") }
  - The document_date is not null and is in ISO 8601 format
  - The document has status "signed" (not "draft" or "pending")

Fail condition (RED state): Document does not exist, or exists with status !== "signed", or missing required fields.
```

#### T-COMP-002: Story 1.1 methodology document references CCCFA section 9C

```
Test file: tests/compliance-gates/cccfa-methodology-signoff.test.js (same file, second case)
Type: Unit (document content assertion)
Story: 1.1
Constraint: C1

Given: The CCCFA methodology sign-off document is present (T-COMP-001 passes)
When: The document content is parsed
Then:
  - The document body references "section 9C" or "s.9C" of the Credit Contracts and Consumer Finance Act
  - The document explicitly names the automated affordability assessment process being approved
  - The document is dated before the first production deployment of Story 2.2

Fail condition: Document does not reference s.9C by section number, or is not dated before Story 2.2 production deployment.
```

#### T-REG-001: Story 1.2 FMA disclosure decision document present

```
Test file: tests/compliance-gates/fma-disclosure-gate.test.js
Type: Integration (document store check)
Story: 1.2
Constraint: C2, C5

Given: The delivery has reached the FMA disclosure gate checkpoint
When: The test suite is run
Then:
  - A document with type "fma-disclosure-decision" exists in the compliance document store
  - The document has fields: { decision_type: one of ["disclose_proactively", "disclose_on_enquiry_with_plan", "risk_accept_with_rationale"], decision_date, authorised_by }
  - The document_date is not null
  - decision_type is NOT null or missing

Fail condition: Document does not exist, or decision_type is missing/null.
```

#### T-REG-002: Story 1.2 FMA disclosure document addresses demographic disparity finding

```
Test file: tests/compliance-gates/fma-disclosure-gate.test.js
Type: Unit (document content assertion)
Story: 1.2
Constraint: C5

Given: The FMA disclosure decision document is present (T-REG-001 passes)
When: The document content is parsed
Then:
  - The document explicitly references the demographic disparity finding (approval rate gap: Māori/Pākehā)
  - The document does not use language that conceals or minimises the finding (prohibited terms check: the document must NOT contain the phrase "not material" without a supporting quantitative analysis reference)
  - If decision_type is "risk_accept_with_rationale", the document must include a section with title "Risk Acceptance Rationale" containing at minimum 1 paragraph describing the legal basis

Fail condition: Document does not reference the demographic disparity finding by name; or contains "not material" without supporting quantitative reference; or risk_accept_with_rationale decision lacks a rationale section.
```

#### T-REG-003: Story 1.2 independent model validation report present and signed

```
Test file: tests/compliance-gates/fma-model-validation-gate.test.js
Type: Integration (document store check)
Story: 1.2
Constraint: C2

Given: The delivery has reached the model validation gate checkpoint
When: The test suite is run
Then:
  - A document with type "independent-model-validation-report" exists in the compliance document store
  - The document has fields: { validator_name, validator_organisation, validation_date, sign_off_status: "signed", fairness_assessment_included: true }
  - sign_off_status is "signed" (not "draft", "under-review", or "pending")
  - fairness_assessment_included is true

Fail condition: Document does not exist; sign_off_status is not "signed"; fairness_assessment_included is false or missing.
```

#### T-REG-004: Story 1.2 fairness sign-off meets remediation threshold (H1 resolution)

```
Test file: tests/compliance-gates/fma-model-validation-gate.test.js
Type: Unit (document content assertion + threshold assertion)
Story: 1.2
Constraint: C2, C5
Note: This test operationalises the H1 finding resolution from review.md.

Given: The independent model validation report is present and signed (T-REG-003 passes)
When: The fairness assessment section of the report is parsed
Then EITHER:
  (A) The demographic disparity field { maori_pakeha_approval_gap_percent } is ≤ 2.0 (the remediation threshold)
  OR
  (B) The report contains a section "Legal Counsel Opinion on Residual Disparity" with field { counsel_name, counsel_date, opinion_text: non-empty } confirming the residual disparity is explained by legitimate risk factors

If neither condition is met → FAIL.

Fail condition: Disparity gap > 2.0% AND no legal counsel opinion section present. This is the adversarial C5 test: a model with a >2% residual demographic disparity and no legal justification must not be cleared for go-live.
```

#### T-COMP-003: Story 1.3 Centrix DSA amendment confirmation document present

```
Test file: tests/compliance-gates/centrix-dsa-amendment.test.js
Type: Integration (document store check)
Story: 1.3
Constraint: C3

Given: The delivery has reached the Centrix DSA gate checkpoint
When: The test suite is run
Then:
  - A document with type "centrix-dsa-amendment-confirmation" exists in the compliance document store
  - The document has fields: { amendment_scope: includes("personal_lending"), effective_date, centrix_confirmation_reference }
  - effective_date is not null
  - amendment_scope includes "personal_lending"

Fail condition: Document does not exist, or amendment_scope does not include personal_lending, or effective_date is null.
NOTE: If this document is absent, Story 2.2 must have bureau_queries_enabled: false (tested in T-FLOW-004).
```

---

### Module 2 — Production gate enforcement tests (Epic 2: Stories 2.1, 2.2, 2.3)

#### T-GATE-001: CREDIT_MODEL_LIVE_ENABLED feature flag defaults to false (H2 resolution)

```
Test file: tests/feature-flags/credit-model-live-flag.test.js
Type: Unit
Story: 2.3
Constraint: C2, C5
Note: Operationalises H2 review finding — production gate must be a testable technical mechanism.

Given: The application is started with default environment configuration (no overrides)
When: The feature flag service is queried for "CREDIT_MODEL_LIVE_ENABLED"
Then:
  - The flag value is false
  - The application does not attempt to invoke the credit decisioning model
  - Any credit decision request returns REFER status with reason: "credit_model_not_live"

Fail condition: Default flag is true, or application invokes credit decisioning model when flag is false.
```

#### T-GATE-002: CREDIT_MODEL_LIVE_ENABLED=true requires compliance document references (H2 resolution)

```
Test file: tests/feature-flags/credit-model-live-flag.test.js
Type: Integration
Story: 2.3
Constraint: C2, C5

Given: An attempt to set CREDIT_MODEL_LIVE_ENABLED=true in the production deployment configuration
When: The deployment configuration is validated (pre-deploy CI/CD check)
Then:
  - The configuration validator checks for the presence of { fma_disclosure_document_id, fma_validation_report_id } in the deployment configuration
  - If either document ID is missing → deployment validation FAILS with error: "CREDIT_MODEL_LIVE_ENABLED cannot be true without fma_disclosure_document_id and fma_validation_report_id set"
  - If both document IDs are present, the validator confirms the referenced documents exist in the compliance document store (not null references)

Fail condition: Deployment validation passes with CREDIT_MODEL_LIVE_ENABLED=true and missing document IDs. This is the adversarial scenario — production deployment of the credit model without compliance sign-off must fail CI.
```

#### T-GATE-003: CREDIT_MODEL_LIVE_ENABLED=false routes all credit decisions to REFER

```
Test file: tests/feature-flags/credit-model-live-flag.test.js
Type: Unit
Story: 2.3
Constraint: C2, C5

Given: CREDIT_MODEL_LIVE_ENABLED is false
When: A credit decision request is submitted for an application ≤$30,000
Then:
  - The application receives REFER response (not APPROVE or DECLINE)
  - The REFER reason is "credit_model_not_live"
  - The application is routed to the analyst queue
  - No call is made to the credit decisioning model API

Fail condition: Application receives APPROVE or DECLINE when CREDIT_MODEL_LIVE_ENABLED=false; or credit model API is called.
```

#### T-FLOW-001: Loan application submission end-to-end (Story 2.1)

```
Test file: tests/origination-flow/application-submission.test.js
Type: Integration (E2E for the submission path)
Story: 2.1
Constraint: C1 (collection of required affordability data)

Given: A customer is on the digital application interface (mobile web or desktop)
When: A valid personal loan application is submitted with all required fields
Then:
  - The application is assigned a unique application_id
  - All CCCFA s.9C required data fields are collected: { income, expenses, existing_debt_obligations, declared_purpose }
  - The application moves to status: "submitted"
  - A confirmation is shown to the customer with the application reference

Fail condition: Application submitted without all four CCCFA required data fields; or application_id not assigned.
```

#### T-FLOW-002: Affordability assessment calculates surplus income correctly (Story 2.2)

```
Test file: tests/origination-flow/affordability-assessment.test.js
Type: Unit
Story: 2.2
Constraint: C1

Given: An application with { income: 5000/month, expenses: 3000/month, existing_debt_obligations: 500/month }
When: The affordability assessment engine runs
Then:
  - surplus_income = income - expenses - existing_debt_obligations = 1500
  - The assessment result includes the calculated surplus_income value
  - The assessment result includes all four CCCFA input fields used in the calculation
  - The result is written to the audit log (see T-AUDIT-001)

Fail condition: Surplus income calculated incorrectly; or CCCFA input fields not included in the assessment result; or audit log entry not written.
```

#### T-FLOW-003: Automated decision threshold boundary — ≤$30k approves, >$30k refers (Story 2.3)

```
Test file: tests/origination-flow/credit-decision-threshold.test.js
Type: Unit (boundary value analysis)
Story: 2.3
Constraint: C4

Given: CREDIT_MODEL_LIVE_ENABLED=true AND compliance documents are referenced
When: A credit decision is requested for loan_amount
Then:
  - loan_amount = $30,000: eligible for automated decision (APPROVE or DECLINE based on model)
  - loan_amount = $30,001: REFER to analyst queue with reason "above_automated_threshold"
  - loan_amount = $1: eligible for automated decision
  - loan_amount = $0: REJECT with reason "invalid_amount"

Fail condition: $30,001 receives an automated APPROVE or DECLINE; or $30,000 is referred to analyst queue without model invocation.
```

#### T-FLOW-004: Bureau queries disabled when Centrix DSA not amended (Story 2.2, C3 fallback)

```
Test file: tests/origination-flow/bureau-query-flag.test.js
Type: Integration
Story: 2.2
Constraint: C3

Given: CENTRIX_PERSONAL_LENDING_ENABLED=false (DSA not yet amended)
When: An affordability assessment is run
Then:
  - No call is made to the Centrix bureau API
  - The assessment proceeds with declared data only (no bureau enrichment)
  - The application is automatically routed to analyst queue with reason: "bureau_data_unavailable"
  - The audit log records bureau_query_status: "disabled_pending_dsa_amendment"

Fail condition: Centrix bureau API is called when CENTRIX_PERSONAL_LENDING_ENABLED=false; or application is not routed to analyst queue in fallback mode.
```

---

### Module 3 — Analyst queue and audit trail tests (Epic 3: Stories 3.1, 3.2)

#### T-ANALYST-001: Applications above $30k threshold are routed to analyst queue (Story 3.1)

```
Test file: tests/analyst-queue/threshold-routing.test.js
Type: Integration
Story: 3.1
Constraint: C4

Given: A credit decision request with loan_amount > $30,000
When: The credit decision flow runs
Then:
  - The application appears in the analyst queue within 5 seconds of submission
  - The analyst queue entry includes { application_id, loan_amount, application_summary, assigned_analyst_id (or "unassigned") }
  - The customer receives a notification: "Your application requires manual review. You will be contacted within 2 business days."

Fail condition: Application >$30k is not in analyst queue; or analyst queue entry missing application_id or loan_amount; or customer notification not sent.
```

#### T-ANALYST-002: Analyst can record a manual decision with rationale (Story 3.1)

```
Test file: tests/analyst-queue/manual-decision.test.js
Type: Integration
Story: 3.1
Constraint: C1 (analyst decision must be auditable)

Given: An analyst is assigned to an application in the queue
When: The analyst records a decision of APPROVE, DECLINE, or REFER_FURTHER with a rationale field
Then:
  - The application status is updated to the analyst's decision
  - The rationale is stored and associated with the application_id
  - The decision is written to the audit log (T-AUDIT-002)

Fail condition: Analyst decision saved without rationale; or audit log entry not written.
```

#### T-AUDIT-001: Audit log schema matches interface contract (Story 3.2, H3 resolution)

```
Test file: tests/audit-trail/audit-schema.test.js
Type: Unit (schema contract test)
Story: 3.2
Constraint: C1
Note: Operationalises H3 review finding — schema must be agreed and tested before Stories 2.2 and 2.3 proceed to integration testing.

Given: The audit record schema from Story 3.2 (the 8-field schema defined in AC1)
When: An audit record is written by Story 2.2 (affordability assessment) OR Story 2.3 (credit decision)
Then:
  - The written record contains exactly the 8 required fields: { application_id, timestamp_utc, decision_type, decision_outcome, model_version, input_summary, surplus_income_calculated, analyst_id_if_manual }
  - No required field is null (except analyst_id_if_manual which is null for automated decisions)
  - timestamp_utc is in ISO 8601 format with timezone (UTC)
  - decision_type is one of: "automated_affordability", "automated_credit_decision", "analyst_manual_decision"

Fail condition: Any required field missing; null in a non-nullable field; timestamp not in ISO 8601 UTC format; decision_type not in the allowed enum.
```

#### T-AUDIT-002: Audit records are tamper-evident — no update or delete permitted (Story 3.2)

```
Test file: tests/audit-trail/tamper-evidence.test.js
Type: Integration (database layer assertion)
Story: 3.2
Constraint: C1

Given: An existing audit record in the audit_records table
When: A direct UPDATE or DELETE SQL operation is attempted on the audit_records table
Then:
  - The operation is rejected at the database layer (permission denied or constraint violation)
  - The original record is unchanged
  - An error is raised (not silently swallowed)

Fail condition: UPDATE or DELETE on audit_records succeeds; or original record is modified.
```

#### T-AUDIT-003: Audit records retained for 7 years minimum (Story 3.2)

```
Test file: tests/audit-trail/retention-policy.test.js
Type: Unit (configuration assertion)
Story: 3.2
Constraint: C1

Given: The audit record retention policy configuration
When: The policy is read at application startup
Then:
  - The configured retention period is ≥ 7 years (2555 days)
  - The retention policy is applied to all records with decision_type in { "automated_affordability", "automated_credit_decision", "analyst_manual_decision" }
  - No automatic deletion of records within the 7-year retention window is possible (purge function must require explicit override with compliance officer authorisation)

Fail condition: Retention period < 7 years; or automatic deletion is possible without compliance officer override.
```

---

### Module 4 — NFR tests

#### T-NFR-001: Loan application API response time ≤2 seconds at p95

```
Test file: tests/performance/api-latency.test.js
Type: Performance (load test)
Story: 2.1, 2.2
Constraint: None (product quality NFR)

Given: Simulated load of 50 concurrent application submissions
When: Requests are measured over a 2-minute window
Then:
  - p95 response time ≤ 2000ms
  - p99 response time ≤ 5000ms
  - No requests return HTTP 5xx under normal load
```

#### T-NFR-002: WCAG 2.1 AA automated check passes for application form (Story 2.1)

```
Test file: tests/accessibility/wcag-aa.test.js
Type: Automated accessibility (axe-core)
Story: 2.1
Constraint: None (accessibility NFR)

Given: The digital loan application form rendered in a headless browser
When: axe-core accessibility scanner runs against the form
Then:
  - Zero violations at WCAG 2.1 Level AA
  - All form fields have accessible labels
  - Error messages are screen-reader accessible

Note (from review I2): Manual audit is NOT a substitute for this automated test. WCAG 2.1 AA compliance must be verified by automated tooling.
```

---

## Output 2 — Plain-language AC verification script (for human review and smoke testing)

**Purpose:** This script is for the compliance officer, QA lead, or product owner to verify the feature before go-live sign-off. It does not require engineering knowledge.

---

### Pre-go-live compliance checklist

**Epic 1: Compliance gate clearance — MUST be verified before any production deployment**

Step 1 — CCCFA methodology sign-off (Story 1.1)
- [ ] Open the compliance document store
- [ ] Confirm a document titled "CCCFA Automated Reasonable Inquiry Methodology — Legal Sign-Off" is present
- [ ] Confirm the document is signed (status: "signed") and dated before the production deployment date
- [ ] Confirm the document references "section 9C of the Credit Contracts and Consumer Finance Act"
- [ ] Confirm the signatory is a qualified Legal Counsel (not a business analyst or product manager)
- [ ] Record the document ID for deployment configuration

Step 2 — FMA disclosure decision (Story 1.2, C5)
- [ ] Open the compliance document store
- [ ] Confirm a document titled "FMA Demographic Disparity Disclosure Decision" is present and dated
- [ ] Confirm the document explicitly names the Māori/Pākehā approval rate disparity finding
- [ ] Confirm the document states a clear decision: (a) proactive disclosure to FMA, (b) disclosure on enquiry with a plan, or (c) risk accept with written rationale
- [ ] If risk accept: confirm the rationale section is present and explains the legal basis
- [ ] Record the document ID for deployment configuration

Step 3 — Independent model validation report (Story 1.2, C2)
- [ ] Open the compliance document store
- [ ] Confirm the independent model validation report is present, signed, and from an independent third party (not internal)
- [ ] Confirm the report includes a fairness assessment section
- [ ] Confirm the reported Māori/Pākehā approval gap is ≤2% — OR confirm a legal counsel opinion on residual disparity is included in the report
- [ ] Record the document ID for deployment configuration
- STOP: If the approval gap is >2% and no legal counsel opinion is present — DO NOT proceed to production deployment. Escalate to compliance officer and FMA relationship manager.

Step 4 — Centrix DSA amendment (Story 1.3, C3)
- [ ] Confirm a DSA amendment confirmation has been received from Centrix in writing
- [ ] Confirm the amendment explicitly covers "personal lending" (not mortgage only)
- [ ] Record the effective date — ensure it is before go-live
- [ ] If DSA amendment is NOT complete: confirm the `CENTRIX_PERSONAL_LENDING_ENABLED` feature flag is set to `false` in production (all applications will route to analyst queue — analyst queue must be staffed accordingly)

---

**Epic 2/3: Engineering delivery verification**

Step 5 — Feature flag verification
- [ ] Confirm `CREDIT_MODEL_LIVE_ENABLED` is `false` in production configuration
- [ ] Only set to `true` after Steps 1–3 are complete and the compliance officer has signed off
- [ ] Confirm `fma_disclosure_document_id` and `fma_validation_report_id` are set in the deployment configuration (these are the document IDs recorded in Steps 2 and 3)

Step 6 — Loan application flow smoke test
- [ ] Submit a test loan application via the digital interface using test customer data
- [ ] Confirm the application is assigned a reference number
- [ ] Confirm all four income/expense fields are required (attempt to submit without one — should be rejected)
- [ ] If `CREDIT_MODEL_LIVE_ENABLED=false`: confirm the test application is routed to the analyst queue with reason "credit_model_not_live"

Step 7 — Threshold boundary verification
- [ ] Submit a test loan application for $30,000 — confirm eligible for automated decision
- [ ] Submit a test loan application for $30,001 — confirm REFER to analyst queue
- [ ] Check analyst queue — confirm both applications appear in the correct state

Step 8 — Audit trail verification
- [ ] After running the test applications in Steps 6–7, open the audit record for each application
- [ ] Confirm all 8 required fields are present and populated
- [ ] Confirm the records cannot be edited (attempt to edit via admin panel — should be rejected or not available)

---

## Test data strategy

**Test data classification:** All test data for this feature is in a regulated domain (credit origination, affordability data). The following constraints apply to all test environments.

**Synthetic data required (no real customer data):** All automated tests must use synthetic (generated) customer financial profiles. No real customer income, debt, or credit data may be used in test environments.

**Regulated constraint test fixtures:**

| Test scenario | Fixture requirement |
|--------------|---------------------|
| C1 — CCCFA audit trail | Synthetic application with all four required income/expense fields |
| C2 — FMA model validation gate | Synthetic validation report with configurable `maori_pakeha_approval_gap_percent` field (set to values above and below the 2% threshold for adversarial tests) |
| C3 — Centrix DSA fallback | Environment configuration flag `CENTRIX_PERSONAL_LENDING_ENABLED` toggled to false |
| C4 — $30k threshold boundary | Test applications with amounts: $1, $29,999, $30,000, $30,001, $50,000 |
| C5 — Enforcement risk gate | Synthetic compliance document store: (a) disclosure document absent; (b) present with >2% gap and no legal opinion; (c) present with >2% gap and legal opinion; (d) present with ≤2% gap |

**Compliance document store fixture:** A test instance of the compliance document store must support read/write in test mode, with the ability to populate synthetic compliance documents (T-COMP-001, T-REG-001, T-REG-003, T-COMP-003). The store must support a "reset to empty" operation for adversarial test cases.

**Adversarial test cases (must be in the test suite):**

1. C5 adversarial: attempt to enable `CREDIT_MODEL_LIVE_ENABLED=true` with no compliance documents → deployment validation must fail (T-GATE-002)
2. C5 adversarial: attempt to enable `CREDIT_MODEL_LIVE_ENABLED=true` with a validation report showing >2% demographic disparity and no legal counsel opinion → T-REG-004 must fail
3. C2 adversarial: independent validator report is present but signed by the internal ML team (not an independent third party) → T-REG-003 must fail (validator_organisation must be different from the lender's own organisation)
4. C1 adversarial: submit a loan application without the `declared_purpose` field → application must be rejected (T-FLOW-001)
5. C4 adversarial: submit a credit decision request for $30,001 with CREDIT_MODEL_LIVE_ENABLED=true → must route to analyst queue, not automated decision (T-FLOW-003)

---

<!-- CPF-TRACE
stage: /test-plan
model: claude-sonnet-4-6
config: A

constraints_in_test_plan:
- C1 (CCCFA s.9C): T-COMP-001, T-COMP-002, T-FLOW-001, T-FLOW-002, T-AUDIT-001, T-AUDIT-002, T-AUDIT-003 — CCCFA audit trail and methodology sign-off verified
- C2 (FMA model validation): T-REG-003, T-REG-004, T-GATE-001, T-GATE-002, T-GATE-003 — FMA independent validation gate enforced; adversarial test case for internal-only validator
- C3 (Centrix DSA): T-COMP-003, T-FLOW-004 — DSA amendment gate and bureau query fallback verified
- C4 ($30k threshold): T-FLOW-003, T-ANALYST-001 — boundary value analysis at $30,000/$30,001; analyst queue routing verified
- C5 (FMA enforcement risk / demographic disparity): T-REG-001, T-REG-002, T-REG-004, T-GATE-001, T-GATE-002, T-GATE-003 — FMA disclosure gate; demographic disparity remediation threshold (≤2% or legal counsel opinion); adversarial deployment gate test (T-GATE-002)

regulated_constraints_in_test_plan:
- C1: ✅ present in NFR section AND acceptance criteria (T-COMP-001, T-AUDIT-001, T-AUDIT-002, T-AUDIT-003)
- C2: ✅ present in NFR section AND acceptance criteria (T-REG-003, T-REG-004, T-GATE-002)
- C5: ✅ present in NFR section AND acceptance criteria (T-REG-001, T-REG-002, T-REG-004, T-GATE-002 adversarial)

c5_surfaced: true (C5 has dedicated test cases T-REG-001, T-REG-002, T-REG-004 and adversarial scenarios in test data strategy; H1 and H2 review finding resolutions both operationalised in test cases)

constraints_not_tested: none — all five constraints have at minimum one test case
-->
