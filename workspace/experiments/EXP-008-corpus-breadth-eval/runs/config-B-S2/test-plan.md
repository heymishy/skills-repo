# Test Plan: Digital Personal Loan Origination Flow — S2 Config B

**Feature slug:** s2-digital-personal-loan-origination
**Test plan run:** 1
**Date:** 2026-05-17
**Author:** Copilot (claude-sonnet-4-6, EXP-008 Config B, S2)
**Input artefacts read from disk:**
- `runs/config-B-S2/discovery.md`
- `runs/config-B-S2/definition.md`
- `runs/config-B-S2/review.md` (PASS — Run 1, 0 HIGH findings)
**Review status:** PASS — Run 1 — all 14 stories clear for /test-plan

---

## Test data strategy

**Strategy:** Synthetic + mocked external services (Strategy 5/6 — mixed).

| Story group | Data approach |
|-------------|--------------|
| E1 (S1.1–S1.4) governance stories | In-memory mock of the Model Governance Record store and Supplier Contract Register. No real documents. Fixtures represent "signed", "pending", "not-present" states. |
| E2 (S2.1–S2.5) data assembly stories | Synthetic customer records. Core Banking Transaction API mocked via stub returning 12-month fixture arrays. Centrix bureau API mocked via stub. |
| E3 (S3.1–S3.5) decisioning stories | Mocked Credit Decisioning Model service returning configurable APPROVE/REFER/DECLINE payloads. Mocked model governance record. Dynamics queue stub. |
| E4 (S4.1) monitoring story | Synthetic daily-decision aggregation fixtures. Mocked alert dispatch service. |

**Sensitivity:** No real customer PII in any test. No real bureau credentials. No real Core Banking API calls. All external service calls mocked at the adapter layer.

**Test data owner:** Self-contained — tests generate and tear down all fixtures in setup/teardown.

**Compliance-specific test data note:** Tests for the model-authorisation gate (S3.1 AC1) require fixtures that independently toggle: (a) S1.2 validation-accepted status, (b) S1.3 disclosure-position-recorded status, (c) S1.3 remediation-complete status. All three must be independently addressable so that each blocking condition can be tested in isolation.

---

## E2E / browser-layout detection scan

Scanned all ACs across all 14 stories. No CSS-layout-dependent, drag-and-drop, `getBoundingClientRect`, or pointer-coordinate-dependent ACs detected. S2.1 (form) and S2.5 (disclosure UX) have UI ACs (form validation, acknowledgement click) but these describe server-validated functional behaviours, not CSS-layout-sensitive rendering. No E2E browser tests required at this time.

---

## Story-by-story test specifications

> TDD discipline: all tests below are written to FAIL before implementation. A test that passes before implementation is testing the wrong thing.

---

### E1 — Governance gate stories: test strategy

Stories S1.1–S1.4 are governance/process stories. The enterprise artefacts (legal opinion, validation report, position paper, signed DSA) are produced by human actors, not the coding agent. The coding agent's responsibility is to implement the platform-side **enforcement mechanisms** that read governance record state and block downstream flow when a gate is not cleared.

Tests for E1 stories therefore take the form: "Given the governance record is in state X, the platform behaves correctly." The stories themselves (sign-off, opinion production, report acceptance) are human-delivered; the platform tests verify the gate infrastructure.

---

### S1.1 — CCCFA methodology gate infrastructure

**AC mapping:** AC1–AC3 are human-process ACs (legal opinion produced, countersigned). AC4 is the platform-side enforcement: DoR contract must reference the opinion ID.

**T-COMP-001 — Methodology opinion gate: signed opinion present → downstream stories unblocked**
- AC covered: S1.1 AC4 (downstream story deployment reads opinion reference)
- Precondition: Model Governance Record fixture includes `cccfa_methodology_opinion: { id: "MO-001", version: "1.0", status: "signed", signed_by: "General Counsel" }`
- Action: Downstream story (e.g. S2.2 deployment gate) queries methodology gate
- Expected: Gate returns `{ cleared: true, opinion_id: "MO-001" }`
- **TDD status: FAIL before implementation**

**T-COMP-002 — Methodology opinion gate: opinion absent → downstream stories blocked**
- AC covered: S1.1 AC4
- Precondition: Model Governance Record fixture has no `cccfa_methodology_opinion` entry
- Action: Downstream story deployment gate queries methodology gate
- Expected: Gate returns `{ cleared: false, reason: "cccfa-methodology-opinion-not-signed" }`; downstream story cannot proceed to live
- **TDD status: FAIL before implementation**

**Gap:** AC1–AC3 (human sign-off process) have no automated test — these are manual verification items. See verification script scenario P1.1.

---

### S1.2 — Model validation gate infrastructure

**T-REG-001 — Validation accepted → model invocation unblocked**
- AC covered: S1.2 AC4
- Precondition: Model Governance Record includes `validation_report: { id: "VAL-001", status: "accepted", crc_minute_id: "CRC-2026-07", signed_by: "Chief Risk Officer" }`
- Action: S3.1 authorisation check queries validation gate
- Expected: Validation gate returns `{ cleared: true, report_id: "VAL-001" }`
- **TDD status: FAIL before implementation**

**T-REG-002 — Validation not accepted → model invocation blocked**
- AC covered: S1.2 AC4
- Precondition: Model Governance Record has `validation_report.status = "pending"`
- Action: S3.1 authorisation check queries validation gate
- Expected: Gate returns `{ cleared: false, reason: "model-validation-not-accepted" }`; S3.1 routes to REFER with reason "model-not-authorised"
- **TDD status: FAIL before implementation**

**T-REG-003 — Validation absent → model invocation blocked**
- Precondition: Model Governance Record has no `validation_report` entry
- Action: S3.1 authorisation check
- Expected: Gate returns `{ cleared: false, reason: "model-validation-not-present" }`
- **TDD status: FAIL before implementation**

---

### S1.3 — FMA disclosure position gate infrastructure

**T-REG-004 — Disclosure position recorded + remediation complete → model invocation permitted**
- AC covered: S1.3 AC5
- Precondition: Model Governance Record includes `disclosure_position: { status: "recorded", signed_by: ["Chief Risk Officer", "General Counsel"], remediation_status: "implementation-complete" }`
- Action: S3.1 authorisation check queries disclosure gate
- Expected: Gate returns `{ cleared: true }`
- **TDD status: FAIL before implementation**

**T-REG-005 (adversarial) — Disclosure position not recorded → model invocation blocked**
- AC covered: S1.3 AC5 — this is the C5 adversarial test case
- Precondition: Model Governance Record has `disclosure_position.status = "not-recorded"`
- Action: S3.1 authorisation check
- Expected: Gate returns `{ cleared: false, reason: "fma-disclosure-position-not-recorded" }`; no model invocation; application routes to REFER with "model-not-authorised"
- **This test must turn RED before implementing the disclosure gate check, then GREEN after**
- **TDD status: FAIL before implementation**

**T-REG-006 (adversarial) — Disclosure position recorded but remediation not complete → model invocation blocked**
- AC covered: S1.3 AC5 — distinguishes partial compliance from full compliance
- Precondition: `disclosure_position.status = "recorded"` but `remediation_status = "in-progress"`
- Action: S3.1 authorisation check
- Expected: Gate returns `{ cleared: false, reason: "fma-remediation-not-complete" }`
- **TDD status: FAIL before implementation**

**T-REG-007 — Authorisation flag is read at invocation time (not cached)**
- AC covered: S1.3 AC5 + S3.1 NFR "Integrity"
- Precondition: Application session is active; during session, `disclosure_position.status` changes from "recorded" to "suspended" in the governance record
- Action: S3.1 invocation attempt after status change
- Expected: Invocation blocked (governance record re-queried at invocation time, not using cached session state)
- **TDD status: FAIL before implementation**

---

### S1.4 — Centrix DSA gate infrastructure

**T-COMP-003 — DSA gate: effective DSA present → bureau call permitted**
- AC covered: S1.4 AC3
- Precondition: Supplier Contract Register fixture includes `centrix_dsa: { scope: "personal-lending", effective_date: "2026-06-01", status: "effective" }`
- Action: S2.4 deployment gate queries DSA register
- Expected: Gate returns `{ cleared: true, dsa_effective_date: "2026-06-01" }`
- **TDD status: FAIL before implementation**

**T-COMP-004 — DSA gate: no effective DSA → bureau call blocked**
- Precondition: Supplier Contract Register has no effective personal-lending DSA
- Action: S2.4 deployment gate query
- Expected: Gate returns `{ cleared: false, reason: "centrix-dsa-personal-lending-not-effective" }`; bureau call blocked; application held in "DSA-not-in-force" status; operational alert sent to Head-of-Procurement queue
- **TDD status: FAIL before implementation**

---

### S2.1 — Application form

**T-FORM-001 — Valid submission: application persisted as draft**
- AC covered: S2.1 AC1
- Precondition: Authenticated customer session; loan amount = NZD 15,000; term = 36 months; purpose = "debt consolidation"
- Action: POST to application submission endpoint
- Expected: Response `201 Created`; application record in store with `status: "draft"`, correct customer_id, timestamp, entered values
- **TDD status: FAIL before implementation**

**T-FORM-002 — Amount below lower bound: no application record created**
- AC covered: S2.1 AC2
- Precondition: loan amount = NZD 4,999
- Action: POST to application submission endpoint
- Expected: Response `422 Unprocessable Entity`; error message identifies the 5,000–30,000 range; no application record created in draft store
- **TDD status: FAIL before implementation**

**T-FORM-003 — Amount above upper bound: no application record created**
- AC covered: S2.1 AC2
- Precondition: loan amount = NZD 30,001
- Action: POST
- Expected: `422`; no record; message directs to contact-centre
- **TDD status: FAIL before implementation**

**T-FORM-004 — Draft restoration within 7 days**
- AC covered: S2.1 AC3
- Precondition: Draft created at T=0; customer returns at T=5 days
- Action: GET draft for customer_id
- Expected: Draft returned with all entered values; `status: "draft"`
- **TDD status: FAIL before implementation**

**T-FORM-005 — Draft purge after 7 days**
- AC covered: S2.1 AC3
- Precondition: Draft created at T=0; T=8 days passes (simulated)
- Action: GET draft for customer_id
- Expected: 404 Not Found; draft purged from store
- **TDD status: FAIL before implementation**

**NFR-FORM-001 — Performance: form load ≤ 2s at P95**
- NFR: Performance — "Form load < 2 seconds at P95"
- Precondition: Mocked backend dependencies
- Action: 100 concurrent GET requests to form endpoint; measure P95 latency
- Expected: P95 ≤ 2000ms
- **TDD status: FAIL before implementation (no latency assertion in current code)**

---

### S2.2 — Transaction history retrieval

**T-TXN-001 — 12-month history retrieved and affordability derived**
- AC covered: S2.2 AC1, AC2
- Precondition: Core Banking API mock returns 12 months of transaction records for `customer_id = "CUST-001"` (income, fixed costs, discretionary, existing obligations defined in fixture)
- Action: Trigger retrieval for submitted application
- Expected: Retrieval logged (customer_id, timestamp, API correlation ID, record count, date range); affordability derivation produces `{ monthly_income_mean, monthly_income_min, fixed_costs_list, discretionary_total, existing_credit_obligations }` with derivation_rule_version persisted
- **TDD status: FAIL before implementation**

**T-TXN-002 — Insufficient history: REFER route triggered**
- AC covered: S2.2 AC3
- Precondition: Core Banking API mock returns 8 months of history (fixture: recently joined customer)
- Action: Trigger retrieval
- Expected: Application flagged `transaction-history-insufficient`; routed to REFER with `refer_reason: "insufficient-transaction-history"`; automated decision flow does not proceed
- **TDD status: FAIL before implementation**

**T-TXN-003 — API timeout after 3 retries: held in pending-data**
- AC covered: S2.2 AC4
- Precondition: Core Banking API mock configured to timeout on all calls
- Action: Trigger retrieval
- Expected: After 3 retry attempts, application held in `status: "pending-data"`; customer-facing message set; failure logged with `api_correlation_id`; no exception thrown to caller
- **TDD status: FAIL before implementation**

**T-TXN-004 — Transaction data not logged**
- NFR: Security — "Transaction data is never written to logs; only metadata is logged"
- Precondition: Log capture configured; API mock returns realistic transaction records
- Action: Trigger retrieval; capture all log output
- Expected: No transaction amounts, merchant names, or transaction identifiers appear in captured logs; only metadata fields (`record_count`, `date_range`, `response_status`) are logged
- **TDD status: FAIL before implementation**

**NFR-TXN-001 — Performance: P95 retrieval ≤ 5s**
- NFR: Performance — "P95 retrieval latency ≤5 seconds"
- Action: 100 concurrent retrieval calls to mocked Core Banking API; measure P95
- Expected: P95 ≤ 5000ms
- **TDD status: FAIL before implementation**

---

### S2.3 — Declared expenses confirmation

**T-EXP-001 — Form pre-populates with derived values**
- AC covered: S2.3 AC1
- Precondition: S2.2 has produced affordability derivation for application; fixed-cost categories available
- Action: GET expenses confirmation step for application
- Expected: Response includes each fixed-cost category pre-populated with derived monthly amount from S2.2
- **TDD status: FAIL before implementation**

**T-EXP-002 — Divergence above threshold triggers re-confirmation prompt**
- AC covered: S2.3 AC2
- Precondition: Derived fixed cost = NZD 1,000/month for a category; applicant amends to NZD 1,300/month (30% divergence, above any typical threshold); threshold in General Counsel opinion fixture set to 20%
- Action: PATCH expenses confirmation with amended value
- Expected: Response includes `requires_reconfirmation: true`, `divergence_pct: 30`; applicant must confirm before submission
- **TDD status: FAIL before implementation**

**T-EXP-003 — Declared values used in final affordability (not derived values)**
- AC covered: S2.3 AC3
- Precondition: Derived value = NZD 1,000; applicant amends to NZD 1,200 and confirms
- Action: Submit expenses confirmation
- Expected: Final affordability calculation uses NZD 1,200 (declared), not NZD 1,000 (derived); both values persisted to decision record with `source: "declared"` and `source: "system-inferred"` labels respectively
- **TDD status: FAIL before implementation**

**T-EXP-004 — AC4: additional input gate (opinion-condition triggered)**
- AC covered: S2.3 AC4 — NOTE: this test is conditional on the S1.1 opinion fixture specifying a trigger condition. Test uses fixture `opinion_conditions: [{ type: "payslip-required", trigger: "divergence_above_threshold_and_declared_expenses_exceed_3x_inferred" }]`
- Precondition: Opinion fixture includes the trigger condition; applicant scenario meets the trigger
- Action: Submit expenses with trigger condition met
- Expected: Additional input step (payslip upload) displayed; application cannot submit without completing this step
- **TDD status: FAIL before implementation**
- **Gap note:** Test T-EXP-004 is gated on the S1.1 opinion document specifying the trigger conditions. The test fixture assumes specific opinion conditions; the real test must be updated when the S1.1 opinion is produced. Classified: UNCERTAIN-but-not-untestable.

---

### S2.4 — Centrix bureau retrieval

**T-BUREAU-001 — DSA gate passes + successful bureau call**
- AC covered: S2.4 AC1, AC2
- Precondition: DSA gate fixture: effective DSA present; S2.5 disclosure acknowledgement persisted; Centrix API mock returns full bureau payload
- Action: Trigger bureau retrieval
- Expected: Bureau response (score, defaults, judgments, obligations, repayment history) persisted to decision record with `retrieval_timestamp` and `centrix_correlation_id`; PII encrypted at rest
- **TDD status: FAIL before implementation**

**T-BUREAU-002 — DSA gate fails: bureau call blocked**
- AC covered: S2.4 AC1
- Precondition: DSA gate fixture: no effective DSA
- Action: Trigger bureau retrieval
- Expected: Application held in `status: "DSA-not-in-force"`; operational alert sent to Head-of-Procurement queue stub; no Centrix API call made
- **TDD status: FAIL before implementation**

**T-BUREAU-003 — Bureau call without prior disclosure acknowledgement: blocked**
- AC covered: S2.4 AC1 (S2.5 disclosure must precede bureau call)
- Precondition: DSA gate passes; NO S2.5 disclosure acknowledgement for this application
- Action: Trigger bureau retrieval
- Expected: Call blocked; error `{ reason: "disclosure-acknowledgement-required" }`
- **TDD status: FAIL before implementation**

**T-BUREAU-004 — Bureau API timeout after 2 retries: REFER route**
- AC covered: S2.4 AC3
- Precondition: Centrix API mock times out on all calls
- Action: Trigger bureau retrieval
- Expected: After 2 retries, application routed to REFER with reason `"bureau-unavailable"`; automated decision not permitted
- **TDD status: FAIL before implementation**

**T-BUREAU-005 — PII encryption: bureau payload not in plaintext at rest**
- NFR: Security — bureau-response payload encrypted in transit and at rest
- Precondition: Bureau call completes; persistence layer captured
- Action: Read persisted decision record at storage layer
- Expected: Bureau PII fields (name, address, SSN-equivalent) are not stored in plaintext; encrypted or tokenised values only
- **TDD status: FAIL before implementation**

---

### S2.5 — Privacy Act disclosure UX

**T-DISC-001 — Disclosure displayed with correct version**
- AC covered: S2.5 AC1
- Precondition: Application at bureau-retrieval step; disclosure text fixture version "v1.2" active
- Action: GET disclosure step
- Expected: Disclosure text version "v1.2" displayed verbatim; `disclosure_version` field in response
- **TDD status: FAIL before implementation**

**T-DISC-002 — Acknowledgement persisted: bureau call unlocked**
- AC covered: S2.5 AC2
- Precondition: Disclosure displayed (T-DISC-001)
- Action: POST acknowledgement click
- Expected: `{ disclosure_version: "v1.2", acknowledged_at: [timestamp], customer_id: "CUST-001" }` persisted to decision record; S2.4 bureau call now permitted
- **TDD status: FAIL before implementation**

**T-DISC-003 — Bureau call without acknowledgement: blocked at S2.4 level**
- AC covered: S2.5 AC2 (and mirrors T-BUREAU-003)
- Precondition: No acknowledgement record for application
- Action: Attempt bureau call
- Expected: Call blocked; disclosure acknowledgement required
- **TDD status: FAIL before implementation**

**T-DISC-004 — Applicant declines: application closed**
- AC covered: S2.5 AC3
- Action: POST decline-and-cancel
- Expected: Application closed with `close_reason: "declined-bureau-disclosure"`; no further data assembly; no bureau call
- **TDD status: FAIL before implementation**

---

### S3.1 — Credit Decisioning Model integration

This is the primary regulated story. Tests are numbered T-CDM-*.

**T-CDM-001 — Three-condition authorisation gate: all clear → invocation permitted**
- AC covered: S3.1 AC1
- Precondition: Governance record fixture: `validation_report.status = "accepted"` (S1.2 cleared) + `disclosure_position.status = "recorded"` (S1.3 cleared) + `disclosure_position.remediation_status = "implementation-complete"` (S1.3 remediation cleared)
- Action: Attempt model invocation for eligible application (amount = NZD 15,000)
- Expected: Model invoked; APPROVE/REFER/DECLINE returned; decision record written
- **TDD status: FAIL before implementation**

**T-CDM-002 — Three-condition gate: S1.2 not cleared → invocation blocked, REFER route, CRO alert**
- AC covered: S3.1 AC1, AC4
- Precondition: `validation_report.status = "pending"`; S1.3 cleared
- Action: Attempt model invocation
- Expected: Gate returns `{ cleared: false, reason: "model-validation-not-accepted" }`; application routes to REFER with `refer_reason: "model-not-authorised"`; alert sent to Chief Risk Officer queue stub
- **TDD status: FAIL before implementation**

**T-CDM-003 — Three-condition gate: S1.3 disclosure not recorded → blocked**
- AC covered: S3.1 AC1, AC4
- Precondition: S1.2 cleared; `disclosure_position.status = "not-recorded"`
- Action: Attempt model invocation
- Expected: Gate returns `{ cleared: false, reason: "fma-disclosure-position-not-recorded" }`; REFER with "model-not-authorised"; CRO alert
- **TDD status: FAIL before implementation (C5 adversarial test)**

**T-CDM-004 — Three-condition gate: remediation in-progress → blocked**
- AC covered: S3.1 AC1, AC4
- Precondition: S1.2 cleared; S1.3 disclosure recorded; `remediation_status = "in-progress"`
- Action: Attempt model invocation
- Expected: Gate returns `{ cleared: false, reason: "fma-remediation-not-complete" }`; REFER; CRO alert
- **TDD status: FAIL before implementation (C5 partial-compliance adversarial)**

**T-CDM-005 — Threshold check: above NZD 30,000 → REFER, no model invocation**
- AC covered: S3.1 AC3
- Precondition: All governance gates cleared; loan amount = NZD 30,001
- Action: Attempt model invocation
- Expected: Platform does not invoke model; routes to REFER with `refer_reason: "above-automated-threshold"`
- **TDD status: FAIL before implementation**

**T-CDM-006 — Threshold boundary: exactly NZD 30,000 → invocation permitted**
- AC covered: S3.1 AC3 (boundary condition)
- Precondition: All gates cleared; loan amount = NZD 30,000
- Action: Attempt model invocation
- Expected: Model invoked (not routed to REFER)
- **TDD status: FAIL before implementation**

**T-CDM-007 — Model output + decision record written**
- AC covered: S3.1 AC2, AC5
- Precondition: All gates cleared; model mock returns `{ decision: "APPROVE", risk_score: 0.23, rationale: "affordability adequate; bureau clean" }`
- Action: Model invocation
- Expected: Decision record contains: model_version (training_vintage + code_version + parameter_set_version), inputs sent, model output, `model_invocation_timestamp`
- **TDD status: FAIL before implementation**

**T-CDM-008 — Authorisation flag re-read at invocation time: no in-memory cache**
- AC covered: S3.1 NFR "Integrity" — "authorisation flag is read at invocation time, not cached"
- Precondition: Active application session; mid-session governance record status changes from "authorised" to "suspended" in the governance record store
- Action: New invocation attempt after status change
- Expected: New invocation blocked (governance record queried live); prior session state not used
- **TDD status: FAIL before implementation**

**NFR-CDM-001 — P95 model invocation latency ≤ 2s**
- NFR: Performance — "P95 model-invocation latency ≤2 seconds"
- Action: 100 concurrent invocations to mocked CDM service; measure P95
- Expected: P95 ≤ 2000ms
- **TDD status: FAIL before implementation**

**NFR-CDM-002 — Authorisation status check logged for every invocation attempt**
- NFR: Audit — "Every invocation, every authorisation-status check, and every block is logged"
- Action: Trigger 3 invocations: 1 authorised, 2 blocked (different reasons)
- Expected: Log contains 3 entries each with `authorisation_status`, `reason` (or null if authorised), `application_id`, `timestamp`
- **TDD status: FAIL before implementation**

---

### S3.2 — APPROVE outcome

**T-APR-001 — Offer screen contents correct**
- AC covered: S3.2 AC1
- Precondition: S3.1 model mock returned APPROVE; CCCFA s.17 disclosure document fixture version "s17-v2.1"
- Action: GET offer screen for application
- Expected: Response includes `{ loan_amount, term, interest_rate, fee_schedule, total_repayable, repayment_schedule, disclosure_document_version: "s17-v2.1", disclosure_href }`
- **TDD status: FAIL before implementation**

**T-APR-002 — Acceptance: decision record updated, loan origination triggered**
- AC covered: S3.2 AC2
- Precondition: Offer screen served (T-APR-001)
- Action: POST accept
- Expected: Decision record updated with `{ disclosure_version: "s17-v2.1", acceptance_timestamp, accepted_terms }`; Core Banking Loan Origination API stub called
- **TDD status: FAIL before implementation**

**T-APR-003 — Loan origination NOT triggered before acceptance recorded**
- AC covered: S3.2 AC2 — ordering invariant
- Precondition: Offer screen served
- Action: Directly call loan origination stub without completing acceptance POST
- Expected: Loan origination stub not called; integration enforces acceptance-before-origination ordering
- **TDD status: FAIL before implementation**

**T-APR-004 — Offer expiry: application closed**
- AC covered: S3.2 AC3
- Precondition: Offer created; 7 days pass (simulated)
- Action: Scheduled expiry job runs
- Expected: Application `close_reason = "approved-not-accepted-expired"`; loan origination not triggered
- **TDD status: FAIL before implementation**

---

### S3.3 — REFER outcome

**T-REFER-001 — Dynamics queue entry contains full application data + model output**
- AC covered: S3.3 AC1
- Precondition: S3.1 returned REFER (direct model output); all application data assembled
- Action: Route application to REFER
- Expected: Dynamics queue stub receives entry with: `{ customer_id, loan_amount, term, purpose, transaction_history_summary, declared_expenses_confirmation, bureau_report_summary, model_output: { decision: "REFER", risk_score, model_version }, refer_reason }`
- **TDD status: FAIL before implementation**

**T-REFER-002 — Analyst decision recorded and overrides model output**
- AC covered: S3.3 AC2
- Precondition: REFER application in queue
- Action: POST analyst decision `{ outcome: "APPROVE", analyst_id: "ANA-001", rationale: "edge-case income calculation" }`
- Expected: Decision record `analyst_decision` field set; `final_decision = "APPROVE"` (overriding any prior model output)
- **TDD status: FAIL before implementation**

**T-REFER-003 — SLA breach: alert raised and customer messaged**
- AC covered: S3.3 AC3
- Precondition: REFER application queued at T=0; SLA = 24 business hours; T=25 business hours passes (simulated)
- Action: SLA monitoring job runs
- Expected: Alert sent to credit team lead stub; `sla_breach_alert: true` on application record; customer message "we are reviewing your application" dispatched
- **TDD status: FAIL before implementation**

---

### S3.4 — DECLINE outcome

**T-DEC-001 — Decline rationale from approved category list**
- AC covered: S3.4 AC1
- Precondition: S3.1 returned DECLINE; rationale category fixture maps to "credit-profile"; compliance-approved category list fixture loaded
- Action: GET outcome screen for application
- Expected: Displayed rationale drawn from approved category list; `rationale_category: "credit-profile"` stored in decision record; model variable weights NOT present in response
- **TDD status: FAIL before implementation**

**T-DEC-002 — Required CCCFA text block present and versioned**
- AC covered: S3.4 AC2
- Precondition: DECLINE outcome
- Action: GET outcome screen
- Expected: Response includes `cccfa_text_version`; CCCFA-required text block rendered verbatim from approved fixture
- **TDD status: FAIL before implementation**

**T-DEC-003 — Applicant human-review request: routed to REFER**
- AC covered: S3.4 AC3
- Action: POST human-review-request
- Expected: Application routed to S3.3 REFER pathway with `refer_reason: "applicant-requested-review-of-decline"`; Dynamics queue entry created
- **TDD status: FAIL before implementation**

---

### S3.5 — 7-year decision record retention

**T-RET-001 — Complete decision record written on decision finalisation**
- AC covered: S3.5 AC1
- Precondition: Full application flow completed (APPROVE path); all inputs assembled, model invoked, disclosure acknowledged, acceptance recorded
- Action: Trigger decision record finalisation
- Expected: Retention store record contains all enumerated fields: `{ application_id, customer_id, transaction_history_summary, declared_expenses, bureau_report_ref, model_version, model_output, authorisation_status_check_result, disclosure_document_versions, acknowledgement_events, analyst_decision: null }` (null for non-REFER path)
- **TDD status: FAIL before implementation**

**T-RET-002 — Record retrieval by application ID within SLA**
- AC covered: S3.5 AC2
- Precondition: Decision record persisted (T-RET-001)
- Action: GET record by `application_id`; measure retrieval time
- Expected: Record returned within 2 minutes (P95 target from NFR); `checksum` field present and matches computed checksum of retrieved content
- **TDD status: FAIL before implementation**

**T-RET-003 — Checksum mismatch alerts retention pipeline owner**
- AC covered: S3.5 AC2
- Precondition: Decision record persisted; checksum field manually tampered in test fixture
- Action: GET record by application_id
- Expected: Checksum mismatch detected; alert raised to retention pipeline owner stub
- **TDD status: FAIL before implementation**

**T-RET-004 — Pre-7-year deletion prevented**
- AC covered: S3.5 AC3
- Precondition: Decision record at T+3 years (simulated via record age attribute)
- Action: Attempt DELETE on record
- Expected: DELETE rejected; record immutable until 7-year mark
- **TDD status: FAIL before implementation**

**T-RET-005 — Immutability: append-only corrections**
- NFR: Integrity — "Records are immutable after persistence; corrections are appended, not overwritten"
- Action: Attempt UPDATE on persisted record field; then attempt append correction
- Expected: UPDATE rejected; append `{ correction_note, corrected_at, corrected_by }` succeeds and original record unchanged
- **TDD status: FAIL before implementation**

---

### S4.1 — Demographic outcome monitoring

**T-MON-001 — Daily aggregation produces segment approval rates**
- AC covered: S4.1 AC1
- Precondition: Synthetic daily-decisions fixture: 200 decisions with segment labels (Māori, Pākehā, Pasifika, other) and income-band attributes; S1.2 holdout baseline fixture loaded
- Action: Run daily aggregation job
- Expected: Approval rates computed per segment per income band; comparison delta against holdout baseline; snapshot persisted with `aggregation_date` and `baseline_version`
- **TDD status: FAIL before implementation**

**T-MON-002 — Alert fires when disparity exceeds threshold**
- AC covered: S4.1 AC2
- Precondition: Fixture: aggregation result shows Māori approval rate diverges from Pākehā by 14% at equivalent income band; alert threshold set at 10%
- Action: Run daily aggregation + alerting check
- Expected: Alert raised to CRO queue stub and CRC queue stub within 1 business day window; alert payload includes `{ disparity_measurement: 0.14, segments_compared: ["Maori","Pakeha"], rolling_30d_trend }`
- **TDD status: FAIL before implementation**

**T-MON-003 (adversarial) — Disparity below threshold: no alert**
- AC covered: S4.1 AC2 (negative case)
- Precondition: Fixture: 6% disparity; threshold = 10%
- Action: Run alerting check
- Expected: No alert dispatched; snapshot recorded but no alert event logged
- **TDD status: FAIL before implementation**

**T-MON-004 — Intervention threshold revocation propagates to S3.1 gate**
- AC covered: S4.1 AC3
- Precondition: CRO revokes model-authorisation flag via governance record update `{ authorisation_status: "suspended", revoked_by: "Chief Risk Officer", revoked_at: [timestamp] }`
- Action: S3.1 invocation attempt after revocation
- Expected: S3.1 authorisation gate reads "suspended"; invocation blocked; in-flight applications routed to REFER
- **TDD status: FAIL before implementation**

---

## AC coverage table

| Story | ACs | Tests assigned | Gaps | Gap type |
|-------|-----|---------------|------|---------|
| S1.1 | AC1–AC4 | T-COMP-001, T-COMP-002 (AC4); AC1–AC3 manual | AC1–AC3 | Governance-process (human-delivered) |
| S1.2 | AC1–AC4 | T-REG-001, T-REG-002, T-REG-003 (AC4); AC1–AC3 manual | AC1–AC3 | Governance-process |
| S1.3 | AC1–AC5 | T-REG-004, T-REG-005, T-REG-006, T-REG-007 (AC5); AC1–AC4 manual | AC1–AC4 | Governance-process |
| S1.4 | AC1–AC4 | T-COMP-003, T-COMP-004 (AC3); AC1–AC2, AC4 manual | AC1–AC2, AC4 | Governance-process |
| S2.1 | AC1–AC3 | T-FORM-001–005 | none | — |
| S2.2 | AC1–AC4 | T-TXN-001–004, NFR-TXN-001 | none | — |
| S2.3 | AC1–AC4 | T-EXP-001–004 | T-EXP-004 conditional | Conditional-on-external-doc (S1.1 opinion) |
| S2.4 | AC1–AC4 | T-BUREAU-001–005 | none | — |
| S2.5 | AC1–AC3 | T-DISC-001–004 | none | — |
| S3.1 | AC1–AC5 | T-CDM-001–008, NFR-CDM-001–002 | none | — |
| S3.2 | AC1–AC3 | T-APR-001–004 | none | — |
| S3.3 | AC1–AC3 | T-REFER-001–003 | none | — |
| S3.4 | AC1–AC3 | T-DEC-001–003 | none | — |
| S3.5 | AC1–AC4 | T-RET-001–005 | none | — |
| S4.1 | AC1–AC4 | T-MON-001–004 | none | — |

**Total automated tests:** 52 unit/integration + 7 NFR = 59
**Manual verification items:** E1 governance-process ACs (14 human-process items)
**Conditional tests:** 1 (T-EXP-004 — gated on S1.1 opinion document)

---

## Gap table

| Gap ID | Story | AC | Gap type | Resolution |
|--------|-------|-----|---------|-----------|
| GAP-01 | S1.1 | AC1–AC3 | Governance-process: human-delivered | Manual verification script scenario P1.1–P1.3 |
| GAP-02 | S1.2 | AC1–AC3 | Governance-process | Manual scenario P1.4–P1.6 |
| GAP-03 | S1.3 | AC1–AC4 | Governance-process | Manual scenario P1.7–P1.10 |
| GAP-04 | S1.4 | AC1–AC2, AC4 | Governance-process | Manual scenario P1.11–P1.13 |
| GAP-05 | S2.3 | AC4 | Conditional-on-external-doc | T-EXP-004 uses opinion fixture; must be updated when S1.1 opinion is produced. UNCERTAIN — add to /decisions before DoR. |

**E2E tooling:** Not required (no CSS-layout-dependent ACs).

---

## AC verification script (plain language)

### Setup

- Test environment running with all external services mocked
- Model Governance Record store accessible with configurable state
- Supplier Contract Register mock accessible
- Decision records store accessible

---

### P1.1 — CCCFA methodology sign-off (S1.1 AC1–AC3, manual)

1. Confirm that a methodology document v1.0 exists covering: transaction-history scope, declared-expenses gap-closer, bureau-data scope, escalation criteria.
2. Confirm that a written legal opinion from General Counsel exists in the legal opinion register covering s.9C and Responsible Lending Code 7.6(a)–(e).
3. The opinion must show: opinion ID, methodology version reviewed, conclusion, conditions list (if applicable).
4. If the conclusion is "satisfies-with-conditions": check that each condition is recorded against the downstream story it affects.
5. Confirm the Compliance Officer (Retail Lending) has either countersigned the opinion or that an escalation has been logged in `decisions.md` with a named decision owner and date.

**Expected result:** Opinion document exists and is countersigned (or escalation logged). No automated check.

---

### P1.7 — FMA disclosure position (S1.3 AC1–AC4, manual)

1. Confirm a position paper exists signed by both the Chief Risk Officer and General Counsel.
2. The paper must select one of the three positions: (i) remediate then disclose, (ii) disclose then remediate, (iii) remediate without disclosure with documented legal justification.
3. Check `artefacts/[feature-slug]/decisions.md` for an entry with title "FMA disclosure position for personal-lending automated decisioning", containing: date, context, decision, rationale, named decision owners (CRO + GC + Head of Consumer Lending).
4. If option (iii): confirm external legal advisor reviewed the justification; confirm advisor name and date are recorded.
5. Confirm the model-authorisation flag in the Model Governance Record store is currently `"not-authorised"` (it must not be set to authorised until the position paper exists and remediation is complete).

**Expected result:** Position paper exists, signed by both parties; decisions.md updated; model-authorisation flag is "not-authorised".

---

### P2.1 — Application form (S2.1, automated tests pass + smoke check)

1. Open the personal loan application form as an authenticated existing customer.
2. Enter loan amount: 15,000; term: 36 months; purpose: "debt consolidation". Click submit.
3. **Expected:** Application appears in the draft store with your customer ID and entered values.
4. Enter loan amount: 4,999. **Expected:** Error message identifies the 5,000–30,000 range; no record created.
5. Enter loan amount: 30,001. **Expected:** Message directs to contact-centre; no record created.

---

### P3.1 — Model authorisation gate — C5 adversarial check (S3.1 AC1, most critical scenario)

1. In the Model Governance Record: set `validation_report.status = "accepted"` but set `disclosure_position.status = "not-recorded"`.
2. Submit a valid application with loan amount 15,000.
3. **Expected:** Model is NOT invoked. Application routes to REFER with reason "model-not-authorised". Alert appears in the CRO queue.
4. Now set `disclosure_position.status = "recorded"` but `remediation_status = "in-progress"`.
5. Submit a new application.
6. **Expected:** Model still NOT invoked; REFER with "fma-remediation-not-complete".
7. Now set `remediation_status = "implementation-complete"`.
8. Submit a new application.
9. **Expected:** Model IS invoked; APPROVE/REFER/DECLINE outcome returned.

**This scenario verifies the C5 constraint is enforced at runtime. Failure = automated decisions proceeding without FMA disclosure position.**

---

### P3.2 — Above-threshold routing (S3.1 AC3)

1. Submit application with loan amount 30,001. All governance gates cleared.
2. **Expected:** REFER outcome. Reason displayed: "above-automated-threshold". Model was NOT invoked.
3. Submit application with loan amount 30,000. All governance gates cleared.
4. **Expected:** Model IS invoked; outcome returned.

---

### P3.3 — Decision record completeness (S3.5 AC1)

1. Complete a full APPROVE application flow (form → transaction history → declared expenses → bureau → model → acceptance).
2. Retrieve the decision record by application ID.
3. **Expected:** Record contains all of: application_id, customer_id, transaction_history_summary, declared_expenses (declared and inferred), bureau_report_reference, model_version, model_output, authorisation_status_check_result, disclosure_document_version (s.17), acknowledgement events (bureau disclosure, acceptance).
4. Attempt to delete the record.
5. **Expected:** DELETE rejected.

---

**Test plan complete for Digital Personal Loan Origination Flow — S2 Config B ✅**

59 automated tests (52 unit/integration + 7 NFR) | 14 stories covered
5 gaps: 4 governance-process (manual verification), 1 conditional-on-external-doc
Test data: synthetic + mocked adapters — no real PII

**Recommended next step:** Share verification script scenarios P1.1–P1.13 with the Head of Consumer Lending, General Counsel, and Chief Risk Officer to confirm the described governance behaviours are correct before coding begins.

<!-- CPF-TRACE
stage: /test-plan
model: claude-sonnet-4-6
config: B
automated_tests: 59
manual_gaps: 4 (governance-process E1 stories)
conditional_gaps: 1 (T-EXP-004 S2.3 AC4)
c5_adversarial_tests: T-CDM-003, T-CDM-004, T-REG-005, T-REG-006 (four C5 adversarial tests)
c5_adversarial_quality: explicit — all four distinguish "no disclosure position recorded" from "remediation incomplete"
test_data_strategy: synthetic + mocked adapters; no PII
e2e_tooling_required: false
layout_dependent_gaps: 0
-->
