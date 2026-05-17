# Test Plan — Digital Personal Loan Origination Flow

**Feature slug:** 2026-05-17-digital-personal-loan-origination
**Test plan date:** 2026-05-17
**Pipeline:** EXP-008-corpus-breadth-eval / Config C / Story S2
**Stage model:** claude-haiku-4-5

**Definition reference:** [config-C-S2/definition.md](config-C-S2/definition.md)
**Review reference:** [config-C-S2/review.md](config-C-S2/review.md)

---

## Test data strategy

### Test personas

- **Applicant A:** Existing enterprise customer, income $80k/year, minimal debt, 12 months+ transaction history, good bureau score (750+). Expected outcome: APPROVE for ≤$30k.
- **Applicant B:** Existing enterprise customer, income $45k/year, high debt servicing obligations, incomplete transaction history (6 months), fair bureau score (650). Expected outcome: REFER due to insufficient data and high DDI.
- **Applicant C:** Existing enterprise customer, income $60k/year, moderate debt, full transaction history, bureau score 700. Expected outcome: Sensitive to model changes; test both APPROVE and REFER scenarios depending on DDI thresholds.
- **Applicant D:** New applicant (no transaction history with enterprise). Expected outcome: REFER (insufficient data).

### Test loan scenarios

| Scenario | Amount | Purpose | Term | Expected outcome | CPF constraint |
|----------|--------|---------|------|-----------------|-----------------|
| Under-threshold auto-approve | $25,000 | Vehicle | 60mo | APPROVE | C4 (decision ceiling) |
| Threshold-boundary | $30,000 | Home improvement | 48mo | Model decision + C4 override if needed | C4 |
| Over-threshold mandatory refer | $35,000 | Debt consolidation | 36mo | REFER (forced) | C4 |
| High-risk refer | $15,000 | Personal | 24mo | REFER (model) | C2 (fairness) |

### Test data protection

- All test applicants use synthetic data (no real PII)
- Transaction history is synthetic (no real financial records)
- Bureau scores are synthetic
- Test runs use isolated database (not production)
- Test data is purged post-test

---

## Acceptance Criteria Tests (Technical)

### E1.1: Customer completes digital loan application

#### AC1: Application form displays with all required fields

**Test case T1.1.1:**
- Setup: Navigate to loan application URL in mobile app and web browser
- Action: Load application form page
- Verify:
  - ✓ Form fields displayed: loan amount (input, currency format), loan purpose (select list: home improvement / vehicle / debt consolidation / other), loan term (select list: 12–60 months), customer-declared expenses (text input, numeric format)
  - ✓ All fields have labels and placeholder text
  - ✓ Amount field has input mask (enforces $1,000–$50,000 range)
  - ✓ Form is responsive (mobile: single column, desktop: two-column layout)
- Expected result: PASS ✓

#### AC2: Form validation and submission

**Test case T1.1.2a:** Valid submission
- Setup: Applicant A data, all fields populated
- Action: Tap "Submit Application"
- Verify:
  - ✓ No validation errors displayed
  - ✓ Application record created in database with submitted values
  - ✓ Customer is redirected to "Decision Pending" page
  - ✓ HTTP 200 response from submit endpoint
- Expected result: PASS ✓

**Test case T1.1.2b:** Invalid submission (empty amount)
- Setup: All fields populated except amount
- Action: Tap "Submit Application"
- Verify:
  - ✓ Validation error displayed: "Loan amount is required"
  - ✓ No application record created
  - ✓ User remains on application form
- Expected result: PASS ✓

**Test case T1.1.2c:** Invalid submission (amount out of bounds)
- Setup: Loan amount = $500 (below $1,000 minimum)
- Action: Tap "Submit Application"
- Verify:
  - ✓ Validation error: "Loan amount must be between $1,000 and $50,000"
  - ✓ No application record created
- Expected result: PASS ✓

**Test case T1.1.2d:** Server-side validation required
- Setup: Bypass client-side validation (e.g., API call with invalid amount)
- Action: POST invalid amount to /api/applications
- Verify:
  - ✓ API rejects with HTTP 400, error message
  - ✓ No application record created
  - ✓ No exception thrown (error handled gracefully)
- Expected result: PASS ✓

#### AC3: Decision Pending page displays

**Test case T1.1.3:**
- Setup: Application submitted (AC2a passing)
- Action: User is redirected to Decision Pending page
- Verify:
  - ✓ Page displays: application reference number (e.g., "PLO-20260517-00123"), estimated decision timeframe ("Typically within minutes"), notification method selection (SMS / email / in-app), next steps text
  - ✓ Reference number is persistent and retrievable for support
  - ✓ Next steps text is clear and actionable
- Expected result: PASS ✓

#### AC4: Audit log entry created

**Test case T1.1.4:**
- Setup: Application submitted (AC2a passing)
- Action: Query audit database for application ID
- Verify:
  - ✓ One audit log entry created with record: applicant ID (hashed), application timestamp, submitted values (amount, purpose, term, declared expenses), submission status "success"
  - ✓ Applicant ID in audit log is hashed (not clear text PII)
  - ✓ Timestamp matches submission time ±2 seconds
- Expected result: PASS ✓

#### AC5: Session retention (24-hour persistence)

**Test case T1.1.5a:** Session retained for 24 hours
- Setup: Applicant starts application, populates amount=$25,000 and purpose="Vehicle", closes browser
- Action: Wait 1 hour, re-open app, navigate to application flow
- Verify:
  - ✓ Partial form data is reloaded: amount=$25,000, purpose="Vehicle"
  - ✓ Application flow recognises existing session and allows continuation
  - ✓ Session ID is persisted server-side
- Expected result: PASS ✓

**Test case T1.1.5b:** Session discarded after 24 hours
- Setup: Applicant starts application, closes browser
- Action: Wait 25 hours, navigate to application flow
- Verify:
  - ✓ Form displays empty/fresh state (no partial data reloaded)
  - ✓ New session ID created
  - ✓ Old session data is not accessible
- Expected result: PASS ✓

**CPF constraint mapping (E1.1):** C1 (CCCFA reasonable inquiry — application questions and audit log satisfy inquiry standard); C4 (amount range validation enforces $50k hard ceiling)

---

### E1.2: Customer receives decision and rationale

#### AC1: Notification and decision URL delivery

**Test case T1.2.1:**
- Setup: Application (Applicant A, $25k) decisioning completes with APPROVE outcome
- Action: Decision is ready, system sends notification
- Verify:
  - ✓ SMS sent to applicant's registered phone (or email, or in-app notification per method selected in E1.1 AC3)
  - ✓ Notification contains: decision indicator ("Your application decision is ready"), decision URL, PIN code (5-6 digit)
  - ✓ URL format: `https://[domain]/decisions/[applicationId]?pin=[PIN]`
  - ✓ PIN is randomly generated, unique per application
- Expected result: PASS ✓

#### AC2: Decision page displays (APPROVE scenario)

**Test case T1.2.2a:**
- Setup: Navigate to decision URL with valid PIN for Applicant A APPROVE outcome
- Action: Load decision page
- Verify:
  - ✓ Page header: "Application APPROVED"
  - ✓ Decision timestamp: e.g., "Approved on 17 May 2026 at 14:23"
  - ✓ Decision rationale: e.g., "Application APPROVED — income verified via transaction analysis; debt-to-income ratio acceptable; bureau credit score within approved range"
  - ✓ Rationale does NOT disclose: model input features, model confidence score, specific thresholds (e.g., "> 0.60 confidence"), algorithm details
  - ✓ Next steps: "Download credit agreement", link to PDF/e-sign
- Expected result: PASS ✓

#### AC2b: Decision page displays (DECLINE scenario)

**Test case T1.2.2b:**
- Setup: Navigate to decision URL for Applicant B DECLINE outcome
- Action: Load decision page
- Verify:
  - ✓ Page header: "Application DECLINED"
  - ✓ Brief reason summary: "Application not approved — transaction analysis indicates insufficient affordability"
  - ✓ Reason does NOT disclose: specific thresholds, bureau score, income calculations
  - ✓ Next steps: "Contact our support team at [phone] or [email]"
  - ✓ Support contact is displayed prominently
- Expected result: PASS ✓

#### AC2c: Decision page displays (REFER scenario)

**Test case T1.2.2c:**
- Setup: Navigate to decision URL for REFER outcome
- Action: Load decision page
- Verify:
  - ✓ Page header: "Application Under Review"
  - ✓ Message: "Your application is being reviewed by our credit team — we'll contact you within 1 business day"
  - ✓ Analyst team phone number and email displayed
  - ✓ Estimated callback window: e.g., "We'll call you Tuesday 18 May between 9:00 and 17:00"
- Expected result: PASS ✓

#### AC3: Approved credit terms display

**Test case T1.2.3:**
- Setup: Decision page loaded for Applicant A APPROVE outcome
- Action: Scroll to "Credit Terms" section
- Verify:
  - ✓ Loan amount: $25,000
  - ✓ Interest rate: e.g., 7.5% p.a.
  - ✓ Monthly payment: e.g., $521.22 (correctly calculated for 60-month term)
  - ✓ Term: 60 months
  - ✓ Early repayment: "No early repayment penalty"
  - ✓ Links present: "Download credit agreement", "E-sign credit agreement"
- Expected result: PASS ✓

#### AC4: Decline page displays (DECLINE scenario)

**Test case T1.2.4:**
- Setup: Decision page for DECLINE outcome
- Action: View support contact section
- Verify:
  - ✓ Phone number displayed: e.g., "0800 [number]"
  - ✓ Email address displayed: e.g., "support@enterprise.com"
  - ✓ Hours of operation: e.g., "Monday–Friday 9:00–17:00 NZST"
  - ✓ No detailed decline reason disclosed
- Expected result: PASS ✓

#### AC5: REFER page displays analyst information (REFER scenario)

**Test case T1.2.5:**
- Setup: Decision page for REFER outcome
- Action: View analyst team section
- Verify:
  - ✓ "Your application is being reviewed by our credit team"
  - ✓ Estimated callback: "within 1 business day"
  - ✓ Phone number: analyst team contact
  - ✓ Email: analyst team contact
- Expected result: PASS ✓

#### AC6: Decision page persistence (90-day retention)

**Test case T1.2.6a:** Decision accessible within 90 days
- Setup: Decision URL generated, bookmark URL
- Action: Navigate to URL 80 days after decision
- Verify:
  - ✓ Decision page loads successfully with full content
  - ✓ HTTP 200 response
- Expected result: PASS ✓

**Test case T1.2.6b:** Decision inaccessible after 90 days
- Setup: Decision URL for application from >91 days ago
- Action: Navigate to decision URL
- Verify:
  - ✓ HTTP 404 response
  - ✓ Error message: "This decision is no longer available. Please contact support."
- Expected result: PASS ✓

**CPF constraint mapping (E1.2):** C1 (CCCFA disclosure obligation — decision rationale communicated to customer); C4 (decision ceiling boundary enforced via thresholds)

---

### E1.3: Credit Decisioning Model integration

#### AC1: Transaction history retrieval and sufficiency check

**Test case T1.3.1a:** Sufficient transaction history (≥12 months)
- Setup: Applicant A (12+ months history)
- Action: Trigger decisioning workflow
- Verify:
  - ✓ Core Banking API called successfully
  - ✓ 12 months of transactions retrieved
  - ✓ Continue to affordability calculation (AC2)
- Expected result: PASS ✓

**Test case T1.3.1b:** Insufficient transaction history (<12 months)
- Setup: Applicant D (no enterprise transaction history)
- Action: Trigger decisioning workflow
- Verify:
  - ✓ Core Banking API returns empty or insufficient records
  - ✓ System flags as REFER-TO-ANALYST condition
  - ✓ Application outcome is forced to REFER
  - ✓ Audit log records: "Insufficient transaction history — REFER"
- Expected result: PASS ✓

#### AC2: Affordability metrics calculation

**Test case T1.3.2:**
- Setup: Applicant A transaction history loaded
- Action: Affordability metrics calculated
- Verify:
  - ✓ Monthly income calculated from salary deposits and recurring income (e.g., $6,667/month from $80k annual)
  - ✓ Existing debt calculated from loan and credit card payments (e.g., $1,200/month)
  - ✓ Monthly living expenses inferred from utilities, groceries, subscriptions (e.g., $1,500/month)
  - ✓ Applicant-declared expenses added (e.g., $500/month from E1.1)
  - ✓ DDI calculated: DDI = ($1,200 + $500 + $1,500) / $6,667 = 0.406 (40.6%)
  - ✓ DDI stored in decisioning record
- Expected result: PASS ✓

#### AC3: Credit Decisioning Model invocation

**Test case T1.3.3:**
- Setup: Applicant A, affordability metrics calculated, model available
- Action: Model invoked with input vector
- Verify:
  - ✓ Input vector: [age_band: 35–45, income_band: $60k–$100k, existing_debt: $1,200, DDI: 0.406, transaction_recency: 12mo, bureau_score: 750, loan_amount: $25k, term: 60mo, purpose: vehicle]
  - ✓ Model endpoint called successfully
  - ✓ Response received: decision (APPROVE), risk_score (42), confidence (0.92)
  - ✓ No exception thrown if model unavailable (fallback to REFER)
- Expected result: PASS ✓

#### AC4: Business rules applied

**Test case T1.3.4a:** Amount > $30,000 forces REFER
- Setup: Applicant A, amount=$35,000
- Action: Business rules applied after model returns APPROVE
- Verify:
  - ✓ Rule: "if loan amount > $30,000, outcome is forced to REFER"
  - ✓ Final outcome: REFER (overrides model APPROVE)
  - ✓ Audit log records: "Amount $35,000 exceeds threshold; REFER forced"
- Expected result: PASS ✓

**Test case T1.3.4b:** Low confidence forces REFER
- Setup: Applicant B, model returns confidence=0.55 (below 0.60 threshold)
- Action: Business rules applied
- Verify:
  - ✓ Rule: "if model confidence < 0.60, outcome is forced to REFER"
  - ✓ Final outcome: REFER (overrides model decision)
- Expected result: PASS ✓

**Test case T1.3.4c:** Model REFER is always REFER
- Setup: Applicant C, model returns REFER
- Action: Business rules applied
- Verify:
  - ✓ Final outcome: REFER (no override)
- Expected result: PASS ✓

**Test case T1.3.4d:** Model DECLINE is always DECLINE
- Setup: Applicant B, model returns DECLINE
- Action: Business rules applied
- Verify:
  - ✓ Final outcome: DECLINE (no override)
- Expected result: PASS ✓

**Test case T1.3.4e:** Model APPROVE + confidence ≥0.60 + amount ≤$30,000 = APPROVE
- Setup: Applicant A, model APPROVE, confidence 0.92, amount $25,000
- Action: Business rules applied
- Verify:
  - ✓ Final outcome: APPROVE
- Expected result: PASS ✓

#### AC5: Decision record creation

**Test case T1.3.5:**
- Setup: Final decision determined (any outcome)
- Action: Decision record created
- Verify:
  - ✓ Record fields populated: applicant_id, application_id, decision_outcome (APPROVE/DECLINE/REFER), risk_score, model_confidence, decision_timestamp, model_version="CDMV1"
  - ✓ Record inserted into database
  - ✓ Record is retrievable for E1.2 (decision delivery) and E1.4 (audit trail)
- Expected result: PASS ✓

#### AC6: REFER routing to Dynamics 365

**Test case T1.3.6:**
- Setup: Decision record created with REFER outcome
- Action: Dynamics 365 integration triggered
- Verify:
  - ✓ API call to Dynamics 365 /api/opportunities endpoint
  - ✓ Payload includes: applicant name, loan amount, application ID, reason="model_refer", phone, email
  - ✓ HTTP 200 response from Dynamics
  - ✓ Application record marked with Dynamics opportunity ID
- Expected result: PASS ✓

**CPF constraint mapping (E1.3):** C1 (CCCFA reasonable inquiry — transaction analysis + expenses declaration satisfy standard); C2 (implicit assumption: model is independently validated); C3 (Centrix integration called in this story — upstream dependency: DSA must be in place); C4 (decision ceiling: amount > $30,000 forces REFER)

---

### E1.4: Complete audit trail — CCCFA compliance

#### AC1: Application inputs logged

**Test case T1.4.1:**
- Setup: Application submitted (E1.1)
- Action: Query audit database
- Verify:
  - ✓ Audit entry created: table "application_audit" with fields: applicant_id_hashed, application_id, submission_timestamp, form_data={amount, purpose, term, declared_expenses}, transaction_metadata={account_age, avg_income_range, debt_obligations}
  - ✓ Applicant ID is hashed (SHA256 or similar) — not clear text
  - ✓ Income stored as range (e.g., "$60k–$100k") not exact value
  - ✓ Entry is immutable (no delete/update, append-only)
- Expected result: PASS ✓

#### AC2: Model decision logged

**Test case T1.4.2:**
- Setup: Model invoked (E1.3)
- Action: Query audit database
- Verify:
  - ✓ Audit entry created: table "model_decision_audit" with fields: applicant_id_hashed, application_id, model_version, input_vector (age_band, income_band, debt_level, DDI, bureau_score_range, transaction_recency, loan_amount, term, purpose), decision, risk_score, confidence, timestamp
  - ✓ Input features are ranges/bands not exact values (PII protection)
  - ✓ Entry is immutable
- Expected result: PASS ✓

#### AC3: Decision delivery logged

**Test case T1.4.3:**
- Setup: Customer receives decision (E1.2)
- Action: Query audit database
- Verify:
  - ✓ Audit entry created: table "decision_delivery_audit" with fields: application_id, final_decision, delivery_method (SMS/email/in_app), delivery_timestamp, (if APPROVE: credit_terms={amount, rate, term, monthly_payment})
  - ✓ Entry is immutable
- Expected result: PASS ✓

#### AC4: Audit trail queryable by application and date range

**Test case T1.4.4:**
- Setup: Multiple audit entries created over several applications
- Action: Query via compliance interface: SELECT * FROM audit WHERE application_id='PLO-20260517-00123' AND timestamp BETWEEN '2026-05-17 08:00' AND '2026-05-17 18:00'
- Verify:
  - ✓ Query returns all three audit entries (application, model decision, delivery) in chronological order
  - ✓ Results are in structured format (JSON or CSV)
  - ✓ Query interface requires enterprise SSO authentication
  - ✓ Query access is logged (who accessed what, when)
- Expected result: PASS ✓

#### AC5: 7-year retention enforcement

**Test case T1.4.5a:** Retention policy enforced
- Setup: Audit entries created on 17-05-2019 (7 years ago)
- Action: Automated retention job runs on 17-05-2026
- Verify:
  - ✓ Entries remain in queryable database on 16-05-2026 (day before 7-year expiry)
  - ✓ Entries are archived or deleted on or after 18-05-2026 per policy
  - ✓ Retention date metadata is updated (archived_date or deleted_date)
- Expected result: PASS ✓

#### AC6: Compliance sign-off recorded

**Test case T1.4.6:**
- Setup: Audit trail architecture reviewed by legal/compliance team
- Action: Compliance sign-off memo issued and filed
- Verify:
  - ✓ Sign-off memo file exists: `artefacts/2026-05-17-digital-personal-loan-origination/dor/compliance-sign-off-audit-trail.txt` (or similar)
  - ✓ Memo contents: "Audit trail schema reviewed and approved — satisfies CCCFA audit trail requirement; 7-year retention policy accepted; date [date]; signature [legal signatory]"
- Expected result: PASS ✓

**CPF constraint mapping (E1.4):** C1 (CCCFA audit trail requirement — 7-year retention, queryable format, evidence preservation)

---

### E2.1: Analyst escalation pathway

#### AC1: Dynamics 365 API integration (routing)

**Test case T2.1.1:**
- Setup: REFER application or amount > $30,000
- Action: Dynamics 365 API called with application payload
- Verify:
  - ✓ API endpoint: `POST https://[dynamics-instance].dynamics.com/api/opportunities`
  - ✓ Payload: {applicant_name, loan_amount, application_id, reason, phone, email}
  - ✓ HTTP 201 response with opportunity ID returned
  - ✓ Application record updated with dynamics_opportunity_id
- Expected result: PASS ✓

#### AC2: Analyst queue visibility

**Test case T2.1.2:**
- Setup: Dynamics opportunity created (AC1)
- Action: Analyst logs into Dynamics 365, views their queue
- Verify:
  - ✓ New lead/opportunity appears in analyst's queue (within 2 minutes of creation)
  - ✓ Lead title: "{Applicant Name} — Personal Loan ${Amount}"
  - ✓ Lead contact: phone and email populated
  - ✓ Application link: URL to view full application details
- Expected result: PASS ✓

#### AC3: Analyst decision updates origination platform

**Test case T2.1.3:**
- Setup: Analyst reviews application in Dynamics, makes decision (APPROVE or DECLINE)
- Action: Analyst updates Dynamics opportunity status to "Decision Made" and sets decision field to "Approved" or "Declined"
- Verify:
  - ✓ Dynamics integration webhook triggered
  - ✓ Application status in loan origination platform updated to reflect analyst decision
  - ✓ Application is removed from pending analyst queue (marked "decided")
  - ✓ Customer is notified of final decision (E1.2 logic applies)
- Expected result: PASS ✓

#### AC4: Integration error handling and testing

**Test case T2.1.4a:** Dynamics API unavailable (timeout)
- Setup: Dynamics 365 API is down
- Action: REFER application is routed; Dynamics API call times out
- Verify:
  - ✓ No exception thrown; fallback behavior triggered
  - ✓ Application marked as "pending_analyst_queue_delivery"
  - ✓ Retry job scheduled (exponential backoff: 5 min, 10 min, 30 min, 1 hour, then alert)
  - ✓ Support email alert sent: "Application [ID] failed to route to Dynamics; manual intervention required"
  - ✓ Customer is not blocked from viewing decision (E1.2 still works)
- Expected result: PASS ✓

**Test case T2.1.4b:** Dynamics API malformed response
- Setup: Dynamics 365 API returns HTTP 400 or malformed JSON
- Action: Integration processes response
- Verify:
  - ✓ Error logged (not silently ignored)
  - ✓ Retry job triggered per backoff schedule
  - ✓ Support alert sent
- Expected result: PASS ✓

**CPF constraint mapping (E2.1):** C4 (decision ceiling — above-threshold and REFER applications routed to analyst instead of auto-decided)

---

### E3.1: CCCFA compliance gate

#### AC1: Legal review and sign-off

**Test case T3.1.1:**
- Setup: Application methodology (E1.1) designed and documented
- Action: Legal team reviews methodology
- Verify:
  - ✓ Sign-off memo issued stating: "Applicant-entered financial data + transaction history analysis + bureau report + expenses declaration provides reasonable inquiry under CCCFA s.9C"
  - ✓ Memo explicitly names: expenses declaration requirement (Responsible Lending Code 7.6(c)), audit trail preservation (E1.4)
  - ✓ Memo is dated and signed by legal signatory
- Expected result: PASS ✓

#### AC2: Sign-off filing and documentation

**Test case T3.1.2:**
- Setup: Legal sign-off memo completed
- Action: Memo is filed in compliance repository
- Verify:
  - ✓ File path: `artefacts/2026-05-17-digital-personal-loan-origination/dor/cccfa-sign-off-memo.txt`
  - ✓ File is accessible to audit trail
  - ✓ File is checked into version control (git)
  - ✓ Go-live checklist references this file
- Expected result: PASS ✓

#### AC3: Scope creep prevention

**Test case T3.1.3:**
- Setup: E3.1 sign-off completed; new requirement proposed to add additional application questions
- Action: Product team proposes expanding application questions beyond current scope (e.g., add "employer name" field)
- Verify:
  - ✓ Change control process requires new legal review
  - ✓ New legal sign-off memo is required before changes are deployed
  - ✓ Previous sign-off is not carried forward (gate is per-version)
- Expected result: PASS ✓

**CPF constraint mapping (E3.1):** C1 (CCCFA reasonable inquiry — legal sign-off is the gate)

---

### E3.2: FMA demographic disparity disclosure resolution gate

#### AC1: Resolution path completed (one of three options)

**Test case T3.2.1a:** Path A — FMA notification
- Setup: Internal demographic disparity finding (12% Māori/Pākehā approval rate gap) exists
- Action: Enterprise sends formal notification letter to FMA documenting finding, investigation, and remediation plan
- Verify:
  - ✓ Letter sent to FMA (date, reference number recorded)
  - ✓ Letter includes: finding description, investigation methodology, remediation plan or timeline
  - ✓ FMA response received and filed (if applicable)
  - ✓ Sign-off memo references FMA notification letter
- Expected result: PASS ✓

**Test case T3.2.1b:** Path B — External legal opinion
- Setup: Enterprise obtains external legal advice on demographic disparity
- Action: Legal counsel reviews finding and provides opinion
- Verify:
  - ✓ Legal opinion letter obtained from external counsel
  - ✓ Opinion states: "Disparity is driven by [legitimate risk factors: income differences, existing debt patterns, credit score distribution] rather than model bias; no FMA disclosure required"
  - ✓ Opinion is filed and referenced in sign-off memo
- Expected result: PASS ✓

**Test case T3.2.1c:** Path C — Internal remediation plan
- Setup: Enterprise decides to remediate disparity before go-live
- Action: Internal remediation plan is developed (e.g., model retraining, decision rule adjustments)
- Verify:
  - ✓ Remediation plan documented with timeline and owners
  - ✓ Plan describes specific changes (e.g., "retrain model with balanced training data by [date]")
  - ✓ Plan is approved by legal and head of credit risk
  - ✓ Remediation verification is gated: digital channel cannot go live until remediation is complete and verified
- Expected result: PASS ✓

#### AC2: Compliance sign-off memo issued

**Test case T3.2.2:**
- Setup: One of three resolution paths completed
- Action: Sign-off memo is issued
- Verify:
  - ✓ Memo contents: "(a) resolution path chosen: [FMA notification | legal opinion | remediation], (b) reference: [letter/opinion/plan], (c) confirmation: 'Digital lending channel can proceed without additional regulatory exposure from historical disparity finding', (d) date and signature"
  - ✓ Memo is filed and accessible to compliance team
- Expected result: PASS ✓

#### AC3: Sign-off filed and referenced in go-live checklist

**Test case T3.2.3:**
- Setup: Sign-off memo completed
- Action: Go-live checklist is prepared
- Verify:
  - ✓ Go-live checklist includes: "☑ C5 FMA demographic disparity gate — sign-off memo on file: [link to memo]"
  - ✓ Checklist blocks go-live if this item is unchecked
  - ✓ Sign-off memo is retrievable at referenced location
- Expected result: PASS ✓

**CPF constraint mapping (E3.2):** C5 (FMA disclosure of demographic disparity — hard blocker for go-live)

---

## Regulatory and Non-Functional Requirements Tests

### C1: CCCFA Reasonable Inquiry Compliance

**Test C1.1:** Application questions capture required financial information
- Verify: Customer-declared expenses field is present in E1.1; transaction history is pulled in E1.3; audit trail captures all inputs (E1.4)
- Expected: PASS ✓

**Test C1.2:** Decision rationale communicates basis to customer
- Verify: E1.2 decision page displays rationale without exposing model details
- Expected: PASS ✓

**Test C1.3:** Audit trail evidence meets CCCFA record-keeping standards
- Verify: E1.4 logs inputs, model decision, outcome, timestamps, 7-year retention
- Expected: PASS ✓

**Test C1.4:** Legal sign-off obtained before go-live (E3.1 gate)
- Verify: Compliance sign-off memo exists and is dated
- Expected: PASS ✓

---

### C2: FMA Algorithmic Fairness (Independent Validation)

**Test C2.1:** Model validation is a prerequisite gate (external deliverable)
- Verify: E1.3 dependency notes: "Upstream: C2 gate: Independent model validation required"; no automated decision can occur without validation report on file
- Expected: PASS ✓ (external prerequisite, not implemented by feature)

---

### C3: Centrix DSA Scope Confirmation

**Test C3.1:** Centrix integration is gated on DSA confirmation
- Verify: E1.3 dependency notes: "Upstream: Centrix DSA scope confirmation required"; Centrix queries do not occur without DSA in place
- Expected: PASS ✓ (external prerequisite)

---

### C4: Automated Decision Ceiling ($30,000)

**Test C4.1:** Applications > $30,000 are forced to REFER
- Verify: E1.3 business rule AC4 enforces: "if loan amount > $30,000, outcome is forced to REFER"
- Test case T1.3.4a confirms this
- Expected: PASS ✓

**Test C4.2:** Decision form validates amount bounds ($1,000–$50,000)
- Verify: E1.1 amount field has input mask and server-side validation
- Test case T1.1.2c confirms rejection of out-of-bounds amounts
- Expected: PASS ✓

---

### C5: FMA Disclosure of Demographic Disparity Finding

**Test C5.1:** Undisclosed demographic disparity finding is formally resolved before go-live
- Verify: E3.2 gate requires one of three resolution paths (FMA notification, legal opinion, remediation plan)
- Expected: PASS ✓

**Test C5.2:** Go-live is blocked until C5 gate is passed
- Verify: Go-live checklist includes C5 sign-off as mandatory unchecked item
- Expected: PASS ✓

---

## Acceptance Criteria Verification Script (Plain Language)

**For QA / Manual Verification / Smoke Testing:**

### Story E1.1: Customer completes application

1. ✓ Open loan application form (web or mobile)
   - [ ] Verify form fields are displayed: amount, purpose, term, declared expenses
   - [ ] Verify amount field accepts $1,000–$50,000 range
   - [ ] Verify purpose is a dropdown (home improvement, vehicle, debt consolidation, other)
   - [ ] Verify term is a dropdown (12–60 months)

2. ✓ Submit application with valid data (e.g., $25,000, vehicle, 60 months, $500 monthly expenses)
   - [ ] Verify no validation errors appear
   - [ ] Verify "Decision Pending" page is displayed with application reference number
   - [ ] Verify reference number is permanent and retrievable

3. ✓ Query audit logs for the submitted application
   - [ ] Verify audit entry exists with submitted values (amount, purpose, term, expenses)
   - [ ] Verify applicant ID is hashed (not clear text)
   - [ ] Verify submission timestamp is recorded

4. ✓ Test session persistence (24-hour window)
   - [ ] Start application, populate amount=$25,000, close browser
   - [ ] Wait 1 hour, re-open app, navigate to application flow
   - [ ] Verify previously entered amount is reloaded

5. ✓ Test session expiry (after 24 hours)
   - [ ] Start application, populate amount=$25,000, close browser
   - [ ] Wait 25 hours, navigate to application flow
   - [ ] Verify form is empty (new session)

---

### Story E1.2: Customer receives decision and rationale

1. ✓ Submit application and wait for decision (2–5 minutes)
   - [ ] Verify customer receives notification (SMS/email/in-app)
   - [ ] Verify notification includes decision URL and PIN

2. ✓ Navigate to decision URL with PIN
   - [ ] For APPROVE outcome: Verify decision page displays "APPROVED", rationale, credit terms, link to download/e-sign agreement
   - [ ] For DECLINE outcome: Verify decision page displays "DECLINED", brief reason, support contact (no specific thresholds disclosed)
   - [ ] For REFER outcome: Verify decision page displays "Under Review", analyst callback estimate, analyst team phone

3. ✓ Verify decision page persists for 90 days
   - [ ] Check URL is accessible for 90 days
   - [ ] Verify URL returns 404 after 91 days

---

### Story E1.3: Model integration and decisions

1. ✓ Submit application for applicant with 12+ months transaction history
   - [ ] Verify decision is generated within 5 minutes
   - [ ] Verify decision outcome (APPROVE/DECLINE/REFER) is recorded

2. ✓ Submit application for applicant with insufficient transaction history
   - [ ] Verify decision outcome is REFER (insufficient data flag)
   - [ ] Verify audit log notes the reason

3. ✓ Submit application for $35,000 (above threshold)
   - [ ] Verify decision outcome is REFER (regardless of model decision)

4. ✓ Submit application for $15,000 (within threshold)
   - [ ] Verify model decision is applied (APPROVE/DECLINE/REFER per model output)

---

### Story E1.4: Audit trail

1. ✓ Query audit logs for any application
   - [ ] Verify all three audit entries exist: application submission, model decision, decision delivery
   - [ ] Verify entries are in chronological order
   - [ ] Verify no PII is visible in clear text (IDs are hashed, amounts are ranges)

2. ✓ Verify audit trail retention
   - [ ] Verify entries ≥7 years old are archived or deleted per policy
   - [ ] Verify retention dates are tracked

---

### Story E2.1: Analyst escalation

1. ✓ Submit REFER application
   - [ ] Verify Dynamics 365 opportunity is created within 2 minutes
   - [ ] Verify analyst can see application in their queue

2. ✓ Submit application for $35,000 (above threshold)
   - [ ] Verify Dynamics 365 opportunity is created with reason "above-threshold"
   - [ ] Verify analyst can see application in queue

3. ✓ Analyst updates Dynamics decision to "Approved"
   - [ ] Verify loan origination platform reflects analyst decision
   - [ ] Verify customer is notified of final decision

---

### Story E3.1: CCCFA gate

1. ✓ Verify CCCFA legal sign-off memo exists
   - [ ] Verify memo is dated and signed by legal signatory
   - [ ] Verify memo references E1.1 methodology, E1.4 audit trail
   - [ ] Verify memo is filed in compliance repository

2. ✓ Verify scope gate prevents unauthorized changes
   - [ ] If application questions are modified post-sign-off, verify new legal review is required

---

### Story E3.2: FMA demographic disparity gate

1. ✓ Verify one of three resolution paths is completed
   - [ ] Verify FMA notification letter is on file, OR
   - [ ] Verify external legal opinion is on file, OR
   - [ ] Verify internal remediation plan is on file and approved

2. ✓ Verify FMA compliance sign-off memo exists
   - [ ] Verify memo references the chosen resolution path
   - [ ] Verify memo is dated and signed

3. ✓ Verify go-live is blocked without C5 gate completion
   - [ ] Verify go-live checklist has C5 as mandatory item
   - [ ] Verify go-live cannot proceed if C5 item is unchecked

---

<!-- CPF-TRACE
stage: /test-plan
input_artefact: config-C-S2/review.md (6 stories, all review gates passed)
test_coverage:
  - E1.1: 5 ACs, 7 test cases (form display, validation, decision pending, audit log, session management)
  - E1.2: 6 ACs, 12 test cases (notification, decision display APPROVE/DECLINE/REFER, rationale, retention)
  - E1.3: 6 ACs, 13 test cases (transaction history, affordability, model invocation, business rules, REFER routing)
  - E1.4: 6 ACs, 8 test cases (audit logging, queryability, retention, sign-off)
  - E2.1: 4 ACs, 5 test cases (Dynamics integration, queue visibility, error handling)
  - E3.1: 3 ACs, 3 test cases (legal review, sign-off, scope gate)
  - E3.2: 3 ACs, 3 test cases (resolution paths, sign-off, go-live gate)
regulatory_nfr_tests:
  - C1 (CCCFA): 4 tests (application questions, rationale delivery, audit trail evidence, legal gate)
  - C2 (FMA fairness): 1 test (validation prerequisite gate)
  - C3 (Centrix DSA): 1 test (integration gating)
  - C4 (Decision ceiling): 2 tests (amount validation, $30k ceiling enforcement)
  - C5 (FMA disclosure): 2 tests (resolution paths, go-live gate)
test_data_strategy: 4 synthetic applicant personas (A–D), pre-defined scenarios, 7-year retention + purge
c5_surfaced: true
c5_surface_quality: full — C5 gates (E3.2) are a dedicated test story with 3 test cases validating resolution path completion, sign-off documentation, and go-live blocking
-->
