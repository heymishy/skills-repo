# Test Plan: Trans-Tasman Payment Corridor — Proprietary Intra-Group Routing Channel

**Feature:** trans-tasman-payment-corridor
**Stories covered:** 1.1–1.5 (Epic 1 — Regulatory Pre-conditions Gate), 2.1–2.5 (Epic 2 — Channel Core), 3.1–3.2 (Epic 3 — Settlement and Confirmation)
**Review status:** PASSED (review.md — zero HIGH findings)
**Test plan model:** claude-sonnet-4-6 (Config B — Sonnet for /test-plan)
**Date:** 2026-05-17
**Run:** EXP-008 Config B S13

---

## Part 1 — Technical test plan (coding agent and CI)

### Section 1 — Deployment configuration gate tests

These tests must FAIL before implementation begins (TDD). They test the five gate flags at system boundary.

#### 1.1 — `AMLCFT_CHANNEL_VALIDATED` gate (Story 1.1 / C1 / NZ leg)

**T-1.1.1 — Gate blocks intake when flag is false**
```
GIVEN: AMLCFT_CHANNEL_VALIDATED = false
WHEN: payment instruction received for NZ-to-AU transfer (AU beneficiary, amount ≤ NZD $10,000)
THEN: intake returns HTTP 422 with structured error body:
  { "code": "CHANNEL_NOT_ACTIVATED", "flag": "AMLCFT_CHANNEL_VALIDATED",
    "message": "channel not activated — RBNZ AML/CFT compliance validation pending" }
AND: no instruction record created in the payment ledger
```

**T-1.1.2 — Gate allows intake when flag is true**
```
GIVEN: AMLCFT_CHANNEL_VALIDATED = true AND all other gate flags = true
WHEN: eligible payment instruction received
THEN: intake proceeds to screening without channel-activation error
AND: instruction record created with state = ACCEPTED_PENDING_SCREENING
```

**T-1.1.3 — BS11 notification CI/CD gate blocks deployment when < 30 business days elapsed**
```
GIVEN: BS11_NOTIFICATION_DATE is set to [today - 15 business days]
WHEN: production deployment pipeline runs gate check
THEN: deployment is BLOCKED with error:
  "BS11 notification minimum period not satisfied: [days_elapsed] business days elapsed; 30 required"
```

**T-1.1.4 — BS11 notification CI/CD gate passes when ≥ 30 business days elapsed**
```
GIVEN: BS11_NOTIFICATION_DATE is set to [today - 31 business days]
WHEN: production deployment pipeline runs gate check
THEN: deployment gate PASSES for BS11 notification period check
```

**T-1.1.5 — Flag change control rejects change without compliance officer authorisation**
```
GIVEN: deployment configuration change request for AMLCFT_CHANNEL_VALIDATED → true
WHEN: change-control review runs without required document IDs (AC1 + AC2 confirmation documents) and without RBNZ AML/CFT Compliance Officer user identity linked to the change
THEN: change-control rejects the change with reason:
  "AMLCFT_CHANNEL_VALIDATED: change requires document IDs from RBNZ AML/CFT Compliance Officer written confirmations (AC1 and AC2)"
```

#### 1.2 — `AUSTRAC_CONFIRMATION_RECEIVED` gate (Story 1.2 / C2 / AU leg)

**T-1.2.1 — Gate blocks intake when flag is false**
```
GIVEN: AUSTRAC_CONFIRMATION_RECEIVED = false (all other gates = true)
WHEN: eligible payment instruction received
THEN: intake returns HTTP 422 with structured error body:
  { "code": "CHANNEL_NOT_ACTIVATED", "flag": "AUSTRAC_CONFIRMATION_RECEIVED",
    "message": "channel not activated — AUSTRAC originator information confirmation pending" }
AND: no instruction record created
```

**T-1.2.2 — Flag change control requires joint NZ + AU sign-off evidence**
```
GIVEN: deployment configuration change request for AUSTRAC_CONFIRMATION_RECEIVED → true
WHEN: change-control review runs with only NZ-side Payments Compliance Officer authorisation (no AU-side document ID)
THEN: change-control rejects the change with reason:
  "AUSTRAC_CONFIRMATION_RECEIVED: change requires document ID from Enterprise's Australian Counterpart Compliance Liaison (AU-side confirmer) in addition to NZ-side Payments Compliance Officer sign-off"
```

**T-1.2.3 — AUSTRAC originator information fields confirmed before channel activation**
```
GIVEN: AUSTRAC_CONFIRMATION_RECEIVED = true (confirmed originator field requirements from AU-side liaison)
WHEN: payment instruction with complete originator bundle (legal name, account number, NZ address, purpose)
THEN: instruction proceeds to screening
AND: originator fields match AC1 confirmation from Story 1.2 (exact names, formats, encoding)
```

**T-1.2.4 — Transmission blocked when AUSTRAC flag is false (redundant gate at transmission)**
```
GIVEN: AUSTRAC_CONFIRMATION_RECEIVED = false AND instruction passed intake gate (anomalous state)
WHEN: credit instruction transmission to TTPS-ROUTE-001 is attempted
THEN: transmission is BLOCKED with reason: "AUSTRAC_CONFIRMATION_RECEIVED flag not set — transmission rejected"
AND: instruction state set to BLOCKED_PENDING_CHANNEL_ACTIVATION
```

#### 1.3 — `FX_REPORTING_VALIDATED` gate (Story 1.3 / C3 / NZ leg)

**T-1.3.1 — Gate blocks intake when flag is false**
```
GIVEN: FX_REPORTING_VALIDATED = false (all other gates = true)
WHEN: eligible payment instruction received
THEN: intake returns HTTP 422 with structured error body:
  { "code": "CHANNEL_NOT_ACTIVATED", "flag": "FX_REPORTING_VALIDATED",
    "message": "channel not activated — RBNZ FX transaction reporting validation pending" }
```

**T-1.3.2 — Net settlement transmission gated by FX_REPORTING_VALIDATED**
```
GIVEN: FX_REPORTING_VALIDATED = false
WHEN: end-of-day net settlement batch runs for TTPS-SET-001 transmission
THEN: settlement transmission is BLOCKED with reason: "FX_REPORTING_VALIDATED not set — net settlement transmission suspended"
AND: alert raised to Enterprise Treasury Manager
```

**T-1.3.3 — Flag change control requires joint Treasury Manager + Regulatory Affairs team lead sign-off**
```
GIVEN: deployment configuration change request for FX_REPORTING_VALIDATED → true
WHEN: change-control review runs with only Enterprise Treasury Manager authorisation (no Regulatory Affairs team lead document ID)
THEN: change-control rejects the change with reason:
  "FX_REPORTING_VALIDATED: change requires document ID from both Enterprise Treasury Manager (analysis) and Regulatory Affairs team lead (determination confirmation)"
```

#### 1.4 — `DIA_REGISTRATION_CLEARED` gate (Story 1.4 / C4 / NZ leg)

**T-1.4.1 — Gate blocks intake when flag is false**
```
GIVEN: DIA_REGISTRATION_CLEARED = false (all other gates = true)
WHEN: eligible payment instruction received
THEN: intake returns HTTP 422 with structured error body:
  { "code": "CHANNEL_NOT_ACTIVATED", "flag": "DIA_REGISTRATION_CLEARED",
    "message": "channel not activated — DIA payment service type determination pending" }
```

**T-1.4.2 — Flag change control requires Regulatory Affairs Manager authorisation only**
```
GIVEN: deployment configuration change request for DIA_REGISTRATION_CLEARED → true
WHEN: change-control review runs with RBNZ AML/CFT Compliance Officer or Payments Compliance Officer user identity (not Regulatory Affairs Manager)
THEN: change-control rejects the change with reason:
  "DIA_REGISTRATION_CLEARED: change requires authorisation from Regulatory Affairs Manager only — not delegable to RBNZ AML/CFT Compliance, Payments Compliance, Treasury, or product management functions"
```

#### 1.5 — `CORRESPONDENT_AGREEMENT_CLEARED` gate (Story 1.5 / C5 / Cross-border contractual)

**T-1.5.1 — Gate blocks intake when flag is false**
```
GIVEN: CORRESPONDENT_AGREEMENT_CLEARED = false (all other gates = true)
WHEN: eligible payment instruction received
THEN: intake returns HTTP 422 with structured error body:
  { "code": "CHANNEL_NOT_ACTIVATED", "flag": "CORRESPONDENT_AGREEMENT_CLEARED",
    "message": "channel not activated — correspondent bank agreement review pending" }
AND: no instruction record created
```

**T-1.5.2 — CORRESPONDENT_AGREEMENT_CLEARED flag = false blocks transmission at boundary**
```
GIVEN: CORRESPONDENT_AGREEMENT_CLEARED = false AND instruction has passed prior gates (anomalous state)
WHEN: credit instruction transmission to TTPS-ROUTE-001 is attempted
THEN: transmission is BLOCKED with reason:
  "CORRESPONDENT_AGREEMENT_CLEARED: correspondent bank agreement (JPMorgan Chase) not yet cleared by Treasury Legal Counsel — transmission rejected"
AND: instruction state set to BLOCKED_PENDING_CHANNEL_ACTIVATION
AND: incident alert raised to Treasury Legal Counsel and CISO
```

**T-1.5.3 — Flag change control rejects authorisation from any regulatory function**
```
GIVEN: deployment configuration change request for CORRESPONDENT_AGREEMENT_CLEARED → true
WHEN: change-control review runs with any of: RBNZ AML/CFT Compliance Officer, Payments Compliance Officer, Regulatory Affairs Manager, Enterprise Treasury Manager, product manager, Architecture Review Board
THEN: change-control rejects the change with reason:
  "CORRESPONDENT_AGREEMENT_CLEARED: change is non-delegable to regulatory functions — requires Treasury Legal Counsel authorisation only (bilateral commercial contract review, not regulatory)"
```

**T-1.5.4 — Flag requires clearance evidence: either clearance memorandum ID or notification acknowledgement ID**
```
GIVEN: CORRESPONDENT_AGREEMENT_CLEARED change request with Treasury Legal Counsel authorisation
WHEN: neither CORRESPONDENT_AGREEMENT_CLEARANCE_ID nor CORRESPONDENT_NOTIFICATION_ACK_ID is linked to the change record
THEN: change-control rejects with reason:
  "CORRESPONDENT_AGREEMENT_CLEARED: requires either CORRESPONDENT_AGREEMENT_CLEARANCE_ID (no obligation) or CORRESPONDENT_NOTIFICATION_ACK_ID (notification filed and acknowledged)"
```

**T-1.5.5 — All five gates must be true before any instruction proceeds (compound gate test)**
```
GIVEN: each flag is false in turn (test runs 5 times — once with each flag false)
WHEN: eligible payment instruction received
THEN: intake returns HTTP 422 for each configuration
AND: specific flag name included in error response body
AND: no instruction record created in any case
```

---

### Section 2 — AML/CFT sanctions screening tests (Story 2.2 / C1 / NZ leg)

**NFR-SCR-NZ-1: Synchronous pre-commitment screening (NZ leg regulatory requirement)**

Derived from: RBNZ AML/CFT Act 2009 s.A.3.2 (channel-independent screening obligation); ADR-CB-003 (mandatory synchronous pre-commitment call); ADR-CB-004 (fail-closed fallback).

**T-2.2.1 — Screening call is synchronous: instruction not committed before non-match result returned**
```
GIVEN: payment instruction passes intake gate
WHEN: instruction enters screening step
THEN: instruction state remains SCREENING_IN_PROGRESS until screening service response received
AND: instruction MUST NOT transition to SCREENING_PASSED or any downstream state without receiving a MATCH_NOT_FOUND result
AND: database commit of instruction record at SCREENING_PASSED state MUST NOT occur before screening response is stored
```

**T-2.2.2 — MATCH result → instruction declined (NZ leg RBNZ-designated persons list)**
```
GIVEN: sanctions screening returns MATCH against RBNZ-designated persons list
WHEN: screening result processed
THEN: instruction state = SCREENING_BLOCKED
AND: decline record created with: instruction_id, screening_list = "RBNZ_DESIGNATED_PERSONS", match_status = "MATCH", screening_list_version, timestamp
AND: instruction returned to customer interface with: code = "INSTRUCTION_DECLINED", reason = "sanctions screening — instruction cannot be processed"
AND: no originator data or instruction amount disclosed in decline response
```

**T-2.2.3 — MATCH result → instruction declined (OFAC SDN list)**
```
GIVEN: sanctions screening returns MATCH against OFAC SDN list
WHEN: screening result processed
THEN: instruction state = SCREENING_BLOCKED
AND: decline record created with: instruction_id, screening_list = "OFAC_SDN", match_status = "MATCH", screening_list_version, timestamp
```

**T-2.2.4 — MATCH result → instruction declined (DFAT consolidated list — AU beneficiary)**
```
GIVEN: payment instruction to AU beneficiary AND sanctions screening returns MATCH against DFAT consolidated list
WHEN: screening result processed
THEN: instruction state = SCREENING_BLOCKED
AND: decline record created with: instruction_id, screening_list = "DFAT_CONSOLIDATED", match_status = "MATCH", screening_list_version, timestamp
```

**T-2.2.5 — Fail-closed: screening service unavailable → instruction declined (not deferred)**
```
GIVEN: AML/CFT Sanctions Screening Service (TTPS-SCR-001) returns HTTP 503 or times out
WHEN: screening step processes the error
THEN: instruction state = SCREENING_ERROR_DECLINED
AND: instruction NOT placed into a queue for later screening
AND: instruction NOT deferred to an asynchronous screening batch
AND: decline response returned to customer: code = "INSTRUCTION_DECLINED", reason = "payment processing unavailable — please retry"
AND: alert raised to RBNZ AML/CFT Compliance Officer channel: "Screening service unavailable — fail-closed activated"
```
*Note: ADR-CB-004 CISO RISK-ACCEPT required before any deviation from fail-closed. This test enforces the default. No asynchronous screening path is permitted without ADR-CB-004 RISK-ACCEPT document ID recorded in deployment configuration.*

**T-2.2.6 — Screening record retention: 7 years minimum (RBNZ AML/CFT s.A.4.3)**
```
GIVEN: screening record created for any instruction
WHEN: retention policy is applied
THEN: screening record is not eligible for deletion until [creation_date + 7 years]
AND: any attempt to delete a screening record with age < 7 years returns HTTP 403 with reason:
  "screening record retention period (7 years — RBNZ AML/CFT s.A.4.3) not yet elapsed"
```

**T-2.2.7 — All three lists screened for every instruction (not conditional on beneficiary country)**
```
GIVEN: payment instruction to AU beneficiary
WHEN: screening runs
THEN: screening request includes: RBNZ_DESIGNATED_PERSONS, OFAC_SDN, DFAT_CONSOLIDATED
AND: screening record lists all three list types in result
```
*The RBNZ-designated persons and OFAC SDN checks apply to all instructions regardless of beneficiary country. DFAT consolidated is required for AU beneficiary.*

---

### Section 3 — RBNZ threshold transaction reporting tests (Story 2.5 / C1 co-obligation / NZ leg)

**NFR-THR-NZ-1: Threshold reporting within 3 business days (NZ leg regulatory requirement)**

Derived from: RBNZ AML/CFT Act 2009 s.A.4.2; Story 1.1 AC2 (intra-group channel coverage confirmed by RBNZ AML/CFT Compliance Officer).

**T-2.5.1 — Threshold report generated for intra-group instruction ≥ NZD $10,000**
```
GIVEN: intra-group instruction with amount = NZD $10,000.00 (threshold boundary)
WHEN: instruction completes screening and is committed
THEN: threshold transaction report record created for TTPS-REP-001 with instruction_id, amount_nzd = 10000.00, beneficiary_details, originator_details, instruction_timestamp
AND: report scheduled for submission within [submission_deadline = instruction_date + 3 business days]
```

**T-2.5.2 — Threshold report NOT generated for instruction < NZD $10,000**
```
GIVEN: intra-group instruction with amount = NZD $9,999.99
WHEN: instruction completes screening and is committed
THEN: no threshold transaction report record created
```

**T-2.5.3 — Threshold report submission deadline enforced within 3 business days**
```
GIVEN: threshold report record with submission_deadline = [today + 3 business days]
WHEN: submission deadline monitor runs on [today + 4 business days] without report submitted
THEN: escalation alert raised to RBNZ AML/CFT Compliance Officer:
  "Threshold report for instruction [id] has passed 3-business-day submission deadline — immediate action required"
AND: report status set to OVERDUE
```
*Business day computation must exclude NZ public holidays per the Holidays Act 2003. Test data must include a boundary case where submission deadline falls on a public holiday and the deadline advances to the next business day.*

**T-2.5.4 — Threshold reporting coverage for intra-group channel (not only SWIFT)**
```
GIVEN: intra-group-routed instruction ≥ NZD $10,000 (routed via TTPS-ROUTE-001)
WHEN: reporting module processes the instruction
THEN: reporting module recognises intra-group channel as a covered routing channel
AND: report generated with channel_type = "INTRA_GROUP" in the submission record
AND: report is NOT suppressed or skipped due to channel type
```

**T-2.5.5 — Originator fields present in threshold report**
```
GIVEN: threshold report generated for intra-group instruction
WHEN: report record inspected
THEN: report contains all originator fields required by RBNZ threshold reporting (originator legal name, originator account number, originator address, payment purpose)
AND: report does not have null or empty values for any required originator field
```

---

### Section 4 — Originator information data model tests (Story 2.3 / C2 / AU leg)

**NFR-ORIG-AU-1: AUSTRAC originator fields confirmed before channel activation (AU leg regulatory requirement)**

Derived from: AUSTRAC AML/CTF Act 2006 (Cth) s.B.1; Stories 1.2 and 2.3; ADR-CB-006.

**T-2.3.1 — Intake rejects instruction with missing AUSTRAC required field (legal name absent)**
```
GIVEN: payment instruction submitted without originator_legal_name field
WHEN: originator information validation runs at intake
THEN: intake returns HTTP 422 with structured field-level error:
  { "code": "ORIGINATOR_INFORMATION_INCOMPLETE", "missing_fields": ["originator_legal_name"],
    "message": "originator legal name required for AU beneficiary transactions (AUSTRAC AML/CTF Act 2006 s.B.1)" }
AND: no instruction record created
```

**T-2.3.2 — Intake rejects instruction with missing account number**
```
GIVEN: payment instruction without originator_account_number
WHEN: originator information validation runs
THEN: intake returns HTTP 422 with missing_fields = ["originator_account_number"]
```

**T-2.3.3 — Intake rejects instruction with missing NZ address**
```
GIVEN: payment instruction without originator_nz_address (structured: street, suburb, city, postcode)
WHEN: originator information validation runs
THEN: intake returns HTTP 422 with missing_fields = ["originator_nz_address"]
```

**T-2.3.4 — Intake rejects instruction with missing payment purpose**
```
GIVEN: payment instruction without payment_purpose
WHEN: originator information validation runs
THEN: intake returns HTTP 422 with missing_fields = ["payment_purpose"]
```

**T-2.3.5 — Originator fields survive end-to-end into credit instruction to TTPS-ROUTE-001**
```
GIVEN: payment instruction with complete originator bundle (legal name, account number, NZ address, purpose)
WHEN: instruction completes all gates and screening and reaches credit instruction transmission
THEN: credit instruction transmitted to TTPS-ROUTE-001 contains all four originator fields with original values unchanged (no truncation, no encoding change, no substitution)
AND: transmitted originator field formats match the confirmed format from Story 1.2 AC1 (exact names, formats, encoding from AUSTRAC confirmation)
```

**T-2.3.6 — Transmission boundary blocks instruction with incomplete originator bundle (second validation)**
```
GIVEN: instruction with originator bundle that passed intake validation but a required field is null at transmission time (data pipeline corruption scenario)
WHEN: transmission boundary originator completeness check runs
THEN: transmission BLOCKED with reason: "originator information bundle incomplete at transmission boundary — field: [field_name] — instruction not transmitted"
AND: instruction state set to BLOCKED_ORIGINATOR_INCOMPLETE
AND: alert raised to Payments Compliance Officer
```

---

### Section 5 — Credit instruction transmission gate tests (Story 2.4 / C5 / Cross-border contractual)

**NFR-CORR-CB-1: CORRESPONDENT_AGREEMENT_CLEARED flag set before any transaction processed (Cross-border gate)**

Derived from: C5 — SWIFT bilateral correspondent banking agreement (JPMorgan Chase); ADR-CB-002; Story 1.5; Story 2.4 AC1.

**T-2.4.1 — Transmission blocked when CORRESPONDENT_AGREEMENT_CLEARED = false**
```
GIVEN: CORRESPONDENT_AGREEMENT_CLEARED = false
WHEN: screened, originator-complete instruction reaches transmission step
THEN: transmission to TTPS-ROUTE-001 is BLOCKED
AND: instruction state = BLOCKED_PENDING_CHANNEL_ACTIVATION
AND: reason recorded: "CORRESPONDENT_AGREEMENT_CLEARED: correspondent bank agreement (JPMorgan Chase) review by Treasury Legal Counsel not yet completed"
AND: no transmission request sent to TTPS-ROUTE-001 (verified by asserting zero outbound calls to TTPS-ROUTE-001 endpoint)
```

**T-2.4.2 — Gate owner verification: transmission configuration requires Treasury Legal Counsel evidence**
```
GIVEN: deployment configuration records for CORRESPONDENT_AGREEMENT_CLEARED = true
WHEN: configuration audit check runs
THEN: configuration record contains either:
  (a) CORRESPONDENT_AGREEMENT_CLEARANCE_ID referencing Treasury Legal Counsel clearance memorandum, OR
  (b) CORRESPONDENT_NOTIFICATION_ACK_ID referencing Treasury Legal Counsel notification + JPMorgan Chase acknowledgement
AND: the authorising user identity in the change record is Treasury Legal Counsel
AND: no configuration record exists where authorising role is any of: RBNZ AML/CFT Compliance Officer, Payments Compliance Officer, Regulatory Affairs Manager, Enterprise Treasury Manager, product manager
```

---

### Section 6 — Net settlement and RBNZ FX reporting tests (Story 3.1 / C3 / NZ leg)

**NFR-FX-NZ-1: RBNZ FX transaction reporting for net settlement positions (NZ leg regulatory requirement)**

Derived from: RBNZ FX Transaction Reporting Rules s.D.1 (net settlement = FX transaction); s.D.2 (NZD $100,000 reporting threshold); ADR-CB-008 (Treasury sign-off as DoR prerequisite); Story 1.3.

**T-3.1.1 — FX_REPORTING_VALIDATED gate blocks net settlement transmission when false**
```
GIVEN: FX_REPORTING_VALIDATED = false
WHEN: end-of-day net settlement batch runs
THEN: settlement transmission to TTPS-SET-001 is BLOCKED
AND: alert raised to Enterprise Treasury Manager and Regulatory Affairs team lead
```

**T-3.1.2 — Net settlement FX report generated for net position ≥ NZD $100,000**
```
GIVEN: end-of-day net settlement run produces NZD/AUD net position = NZD $100,000.00 (reporting threshold boundary)
WHEN: FX reporting module processes the settlement
THEN: RBNZ FX transaction report record created with: settlement_date, net_position_nzd = 100000.00, settlement_channel = "INTRA_GROUP", reporting_entity_identifier
AND: report submitted to TTPS-REP-001 within end-of-business-day window
```

**T-3.1.3 — Net settlement FX report NOT generated for net position < NZD $100,000**
```
GIVEN: end-of-day net position = NZD $99,999.99
WHEN: FX reporting module processes the settlement
THEN: no RBNZ FX transaction report generated
AND: below-threshold log entry created for audit trail
```

**T-3.1.4 — Intra-group net settlement covered by FX reporting module (not just SWIFT per-payment)**
```
GIVEN: net settlement position arising from intra-group-routed instructions (channel_type = "INTRA_GROUP")
WHEN: FX reporting module runs
THEN: module recognises INTRA_GROUP channel type as a covered settlement type
AND: FX report channel designation = "INTRA_GROUP_NET" (distinct from "SWIFT_PER_PAYMENT")
AND: report is NOT suppressed due to channel type
```

---

### Section 7 — Multi-jurisdiction NFR consolidation

**NFR-MJ-1: NZ leg — sanctions screening is synchronous and fail-closed**
*Reference: T-2.2.1 through T-2.2.7; RBNZ AML/CFT Act 2009 s.A.3.2; ADR-CB-003/004*
- Screening call is synchronous: instruction NOT committed before non-match returned (T-2.2.1)
- Fail-closed: screening service error → decline, NOT defer or queue (T-2.2.5)
- All three lists screened per instruction (T-2.2.7)

**NFR-MJ-2: NZ leg — RBNZ threshold reporting within 3 business days**
*Reference: T-2.5.1 through T-2.5.5; RBNZ AML/CFT Act 2009 s.A.4.2*
- Threshold report generated for intra-group instruction ≥ NZD $10,000 (T-2.5.1)
- Report submission deadline ≤ 3 business days after instruction date (T-2.5.3)
- Business day calculation excludes NZ public holidays per Holidays Act 2003
- Intra-group channel explicitly covered (not only SWIFT-routed instructions) (T-2.5.4)

**NFR-MJ-3: NZ leg — originator fields present in payment record**
*Reference: T-2.3.1 through T-2.3.6; RBNZ AML/CFT Act 2009 s.A.4.3 (7-year retention)*
- All four AUSTRAC originator fields present and validated at intake (T-2.3.1–T-2.3.4)
- Fields present and unchanged in credit instruction at TTPS-ROUTE-001 boundary (T-2.3.5)
- Fields present in threshold transaction report (T-2.5.5)
- Screening records retained 7 years minimum (T-2.2.6)

**NFR-MJ-4: AU leg — AUSTRAC originator fields confirmed before channel activation**
*Reference: T-1.2.3; Story 1.2 AC1; AUSTRAC AML/CTF Act 2006 (Cth) s.B.1*
- AUSTRAC_CONFIRMATION_RECEIVED = false blocks all intake (T-1.2.1)
- AUSTRAC_CONFIRMATION_RECEIVED = true AND confirmed originator field requirements from AU-side liaison match originator fields in credit instruction (T-1.2.3)
- Flag change control requires joint NZ + AU sign-off: Payments Compliance Officer (NZ) + Enterprise's Australian Counterpart Compliance Liaison (AU) — NZ-side alone is NOT sufficient (T-1.2.2)

**NFR-MJ-5: Cross-border — CORRESPONDENT_AGREEMENT_CLEARED flag set before any transaction processed**
*Reference: T-1.5.1 through T-1.5.5, T-2.4.1, T-2.4.2; Story 1.5; ADR-CB-002*
- Flag = false → intake blocked (T-1.5.1)
- Flag = false → transmission blocked at boundary even if intake anomalously passed (T-1.5.2, T-2.4.1)
- Gate owner is Treasury Legal Counsel only: change-control rejects any authorisation from regulatory functions (T-1.5.3)
- Evidence required: CORRESPONDENT_AGREEMENT_CLEARANCE_ID (no obligation) or CORRESPONDENT_NOTIFICATION_ACK_ID (obligation confirmed) — not a generic approval (T-1.5.4, T-2.4.2)
- Jurisdiction-appropriate gate owner named: Treasury Legal Counsel — non-delegable to RBNZ AML/CFT Compliance, Payments Compliance, Regulatory Affairs, Enterprise Treasury Manager, product manager (T-1.5.3)

---

### Section 8 — Performance NFRs (from review finding D3)

**NFR-PERF-1: P95 intake processing latency**
```
GIVEN: payment instruction intake endpoint under 100 concurrent users (load test)
WHEN: latency distribution measured
THEN: P95 intake processing latency (from request received to intake acceptance or structured rejection) ≤ 500ms
AND: P99 intake latency ≤ 2000ms
```

**NFR-PERF-2: Screening service timeout**
```
GIVEN: AML/CFT sanctions screening call via TTPS-SCR-001
WHEN: screening service does not respond
THEN: screening call times out at 4000ms (4 seconds)
AND: timeout triggers fail-closed: instruction declined (T-2.2.5)
```

**NFR-PERF-3: Credit instruction transmission timeout**
```
GIVEN: credit instruction transmitted to TTPS-ROUTE-001
WHEN: acknowledgement not received
THEN: transmission call times out at configured timeout (default 30 seconds per Treasury Operations runbook)
AND: instruction transitions to PENDING_ACKNOWLEDGEMENT state
AND: alert raised to Treasury Operations
```

---

### Section 9 — Adversarial / edge-case tests

**T-ADV-1 — All flags false simultaneously**
```
GIVEN: all five gate flags = false
WHEN: eligible payment instruction received
THEN: intake returns a single HTTP 422 listing all five unmet flags:
  { "code": "CHANNEL_NOT_ACTIVATED", "unmet_flags": ["AMLCFT_CHANNEL_VALIDATED", "AUSTRAC_CONFIRMATION_RECEIVED", "FX_REPORTING_VALIDATED", "DIA_REGISTRATION_CLEARED", "CORRESPONDENT_AGREEMENT_CLEARED"],
    "message": "channel not activated — all pre-launch gates unmet" }
AND: no instruction record created
```

**T-ADV-2 — SWIFT fallback path when intra-group channel not yet activated**
```
GIVEN: AMLCFT_CHANNEL_VALIDATED = false (any single gate false)
AND: payment instruction eligible for intra-group channel (AU beneficiary, ≤ NZD $10,000)
WHEN: intake processes the instruction
THEN: instruction is NOT routed to SWIFT gateway silently
AND: intake returns HTTP 422 with channel-not-activated error (intra-group channel not activated; SWIFT is the separate routing pathway for instructions above-threshold or outside eligibility, not a fallback for an unactivated channel)
```

**T-ADV-3 — Instruction submitted past processing cut-off time**
```
GIVEN: payment instruction submitted at [channel_cut_off_time + 1 minute]
AND: all five gate flags = true
WHEN: intake processes the instruction
THEN: intake returns structured response indicating the instruction cannot be processed within the 2-hour SLA for today's cut-off window
AND: options presented: (a) schedule for next business day, OR (b) customer notified of expected delay
AND: no silent SLA breach without notification
```

**T-ADV-4 — Screening service returns MATCH but instruction is subsequently manually reviewed**
```
GIVEN: instruction declined with SCREENING_BLOCKED state
WHEN: manual AML review concludes the match was a false positive
THEN: no automated re-submission path exists (manual override path is OUT OF SCOPE per discovery)
AND: instruction remains in SCREENING_BLOCKED state
AND: AML analyst must create a NEW instruction via standard intake process if cleared
```

**T-ADV-5 — BS11 notification date set in the future**
```
GIVEN: BS11_NOTIFICATION_DATE = [tomorrow's date]
WHEN: CI/CD gate check runs
THEN: gate blocks deployment with error:
  "BS11_NOTIFICATION_DATE is in the future — notification not yet filed; 30-business-day minimum period cannot begin until notification is filed"
```

---

## Part 2 — Plain-language AC verification script (human review and smoke test)

This script is for: (a) human review of the implementation before coding agent handoff, and (b) post-deployment smoke testing after go-live.

### Pre-coding-agent review checklist

For each story, verify the following before marking the story ready for implementation:

**Epic 1 — Pre-condition gate stories (1.1–1.5)**
- [ ] Each story has a deployment configuration flag (named exactly as defined in the architecture)
- [ ] Each flag defaults to `false` in deployment configuration
- [ ] Change-control records for each flag require: (a) the named gate owner's user identity, (b) the document ID(s) from their written confirmation, and (c) no change accepted from any excluded role
- [ ] Non-delegable boundary language from the definition is preserved in the Coding Agent Instructions
- [ ] AUSTRAC gate requires JOINT NZ + AU sign-off (not NZ-alone)
- [ ] CORRESPONDENT_AGREEMENT_CLEARED gate explicitly blocks any regulatory function from authorising the change

**Epic 2 — Channel core stories (2.1–2.5)**
- [ ] Intake enforces all five gates before creating any instruction record
- [ ] Screening is synchronous: no code path processes an instruction without waiting for screening result
- [ ] Fail-closed: screening error path declines, does not queue or defer
- [ ] Originator fields validated at intake AND at transmission boundary
- [ ] Threshold reports cover intra-group channel (not only SWIFT)

**Epic 3 — Settlement and confirmation stories (3.1–3.2)**
- [ ] FX_REPORTING_VALIDATED gate present at net settlement transmission
- [ ] FX reporting module recognises INTRA_GROUP settlement channel type
- [ ] Customer confirmation issued only after credit instruction acknowledged
- [ ] Processing cut-off boundary handled with explicit customer notification (no silent SLA breach)

### Post-deployment smoke test (after go-live)

**Gate flag status check:**
```
GET /api/admin/channel-activation-status
Expected: all five flags = true with document IDs present
```

**End-to-end eligibility test (test instruction — not live funds):**
```
POST /api/payments/intake
Body: { "amount_nzd": 50, "beneficiary_country": "AU", "originator": { "legal_name": "[test name]", "account_number": "[test account]", "nz_address": "[test address]", "purpose": "smoke test" } }
Expected: HTTP 202 — instruction accepted and proceeding to screening
```

**Fail-closed smoke test (if screening service test mode available):**
```
Trigger screening service unavailable mode for 5 seconds
Submit test instruction
Expected: HTTP 422 — instruction declined, not queued
Verify: no SCREENING_IN_PROGRESS records remain after timeout
```

---

## Test data strategy

**Jurisdiction-specific test data (regulated scenario):**

| Data type | NZ leg requirement | AU leg requirement |
|-----------|-------------------|-------------------|
| Originator legal name | Real NZ person name format (no test data that matches RBNZ designated persons test entries) | Must match AUSTRAC originator name field format confirmed by Story 1.2 |
| Originator address | Valid NZ structured address (Holidays Act public holiday test cases: use Wellington addresses with NZST timezone) | — |
| Beneficiary details | Must use clearly synthetic AU BSB/account numbers (not real production BSBs) | — |
| Payment purpose | From enumerated purpose list (or free text ≤ 140 chars — confirm with Story 2.3 field format) | — |

**Sanctions list test data:**
- Do not use real names appearing on RBNZ-designated persons list, OFAC SDN, or DFAT consolidated list in test instructions.
- Use clearly synthetic test-entry names provided by the screening service test environment (TTPS-SCR-001 staging).
- Test for MATCH: use the screening service's designated test-match identifiers.
- Test for MATCH_NOT_FOUND: use clearly synthetic names with no list proximity.

**Business day boundary test data:**
- Threshold reporting 3-business-day deadline: include a test case where deadline falls on Waitangi Day (6 February) to verify NZ public holiday exclusion.
- BS11 30-business-day gate: include a test case where the 30th business day falls on a NZ public holiday.

---

<!-- CPF-TRACE
stage: /test-plan
model: claude-sonnet-4-6
config: B
experiment: EXP-008-corpus-breadth-eval
run: config-B-S13
date: 2026-05-17
upstream_artefact: runs/config-B-S13/definition.md
review_artefact: runs/config-B-S13/review.md

c1_nz_leg_covered: true
  - sanctions_screening_synchronous: true (T-2.2.1, NFR-MJ-1)
  - fail_closed: true (T-2.2.5, NFR-MJ-1)
  - threshold_reporting_3_business_days: true (T-2.5.3, NFR-MJ-2)
  - threshold_reporting_intragroup_coverage: true (T-2.5.4, NFR-MJ-2)
  - originator_fields_present: true (T-2.3.1-T-2.3.6, NFR-MJ-3)

c2_au_leg_covered: true
  - austrac_originator_fields_confirmed_before_activation: true (T-1.2.3, NFR-MJ-4)
  - joint_nz_au_sign_off: true (T-1.2.2, NFR-MJ-4)
  - originator_fields_end_to_end: true (T-2.3.5)

c5_cross_border_covered: true
  - correspondent_agreement_cleared_before_any_transaction: true (T-1.5.1, T-2.4.1, NFR-MJ-5)
  - gate_owner_treasury_legal_counsel: true (T-1.5.3, T-2.4.2, NFR-MJ-5)
  - regulatory_functions_blocked: true (T-1.5.3)
  - evidence_required_clearance_or_notification_ack: true (T-1.5.4, T-2.4.2)

multi_jurisdiction_nfr_section: true (Section 7 — NFR-MJ-1 through NFR-MJ-5)
adversarial_cases: true (Section 9 — T-ADV-1 through T-ADV-5)
performance_nfrs_specific: true (Section 8 — NFR-PERF-1 through NFR-PERF-3 with thresholds)
all_five_gate_flags_tested: true (Section 1 — T-1.1.1 through T-1.5.5 plus T-ADV-1)
jurisdiction_appropriate_gate_owners_named: true (NFR-MJ-4 joint AU/NZ; NFR-MJ-5 Treasury Legal Counsel non-delegable)
-->
