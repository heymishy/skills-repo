# Test Plan: Trans-Tasman Payment Corridor — Proprietary Intra-Group Routing Channel

**Feature:** trans-tasman-payment-corridor
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Date:** 2026-05-17
**Run:** EXP-008 Config A S13
**Stage:** /test-plan
**Input artefacts read from disk:** `discovery.md`, `definition.md`, `review.md`

---

## Multi-jurisdiction NFR rationale

This payment corridor spans three regulatory legs — NZ (RBNZ AML/CFT, DIA), AU (AUSTRAC), and cross-border contractual (JPMorgan Chase). Each test group below targets one or more regulatory legs. Test assertions for jurisdiction-specific obligations are explicitly labelled with their jurisdiction.

**Assumption for Story 2.5 threshold reporting window:** No confirmed RBNZ threshold reporting window has been obtained under Story 1.1 AC2 at test-plan time. Test assertions in T5 use "same business day" as the default assertion. If Story 1.1 AC2 produces a different window, T5.3 must be updated.

**Assumption for Story 3.1 DST boundary:** Settlement cut-off is treated as NZ local time (shifts with NZST/NZDT) in T7.3 pending Story 3.1 AC1 clarification. Mark for review at implementation-plan stage.

---

## Test groups

### T1 — Deployment flag gate tests (all stories with intake or transmission paths)

**Jurisdiction legs:** NZ + AU + cross-border (gates enforce all five constraints)

| ID | Story | Type | Description | Assertion |
|----|-------|------|-------------|-----------|
| T1.1 | 2.1 | Unit | Intake with AMLCFT_CHANNEL_VALIDATED=false, all others true | Returns structured "service not yet available" error; identifies `AMLCFT_CHANNEL_VALIDATED` as unmet condition; no further processing occurs |
| T1.2 | 2.1 | Unit | Intake with AUSTRAC_CONFIRMATION_RECEIVED=false, all others true | Returns structured "service not yet available" error; identifies `AUSTRAC_CONFIRMATION_RECEIVED` as unmet condition |
| T1.3 | 2.1 | Unit | Intake with FX_REPORTING_VALIDATED=false, all others true | Returns structured "service not yet available" error; identifies `FX_REPORTING_VALIDATED` as unmet condition |
| T1.4 | 2.1 | Unit | Intake with DIA_REGISTRATION_CLEARED=false, all others true | Returns "service not yet available" response for all submission attempts; identifies `DIA_REGISTRATION_CLEARED` as unmet condition |
| T1.5 | 2.1 | Unit | Intake with CORRESPONDENT_AGREEMENT_CLEARED=false, all others true | Returns structured "service not yet available" error; identifies `CORRESPONDENT_AGREEMENT_CLEARED` as unmet condition |
| T1.6 | 2.1 | Unit | Intake with all five flags=true | Proceeds to eligibility determination; no gate error returned |
| T1.7 | 2.1 | Unit | Flag check precedes originator information validation: two flags false + originator info missing | Returns flag-gate error, not a field validation error; flag check must be the first processing step |
| T1.8 | 2.4 | Unit | Credit instruction transmission with CORRESPONDENT_AGREEMENT_CLEARED=false | Transmission step returns "channel not authorised" error; no instruction transmitted to enterprise's Australian counterpart via TTPS-ROUTE-001 |
| T1.9 | 2.4 | Unit | Credit instruction transmission with AUSTRAC_CONFIRMATION_RECEIVED=false | Transmission step returns "channel not authorised" error; no instruction transmitted |
| T1.10 | 2.4 | Unit | Credit instruction transmission with AMLCFT_CHANNEL_VALIDATED=false | Transmission step returns "channel not authorised" error; no instruction transmitted |
| T1.11 | 3.1 | Unit | Net settlement transmission with FX_REPORTING_VALIDATED=false | Net settlement transmission to TTPS-SET-001 blocked; alert sent to Enterprise Treasury Manager |

---

### T2 — Eligibility determination and threshold routing

**Jurisdiction leg:** NZ (routing decision is a domestic NZ system decision)

| ID | Story | Type | Description | Assertion |
|----|-------|------|-------------|-----------|
| T2.1 | 2.1 | Unit | AU beneficiary, amount=NZD $5,000 (≤$10,000) | Routed to intra-group channel path; routing log records: instruction ID, NZD $5,000, AU jurisdiction, "intra-group" outcome |
| T2.2 | 2.1 | Unit | AU beneficiary, amount=NZD $10,000 (boundary — ≤threshold) | Routed to intra-group channel path |
| T2.3 | 2.1 | Unit | AU beneficiary, amount=NZD $10,001 (>threshold) | Routed to SWIFT gateway (TTPS-SWIFT-001); existing SWIFT processing behaviour preserved; routing log records "SWIFT" outcome |
| T2.4 | 2.1 | Unit | Non-AU beneficiary (e.g., GB), any amount | Routed to SWIFT gateway regardless of amount; routing log records "SWIFT" outcome |
| T2.5 | 2.1 | Unit | AU beneficiary, amount=NZD $10,000 — intake record logged before further processing | Intake record present in audit trail before eligibility determination; contains: instruction ID, submission timestamp (ISO 8601 with timezone), source channel, amount, beneficiary jurisdiction, routing outcome, originator info completeness status |

---

### T3 — Originator information completeness validation

**Jurisdiction legs:** AU (AUSTRAC originator information provision obligation, C2) + NZ (RBNZ AML/CFT record-keeping, C1)

| ID | Story | Type | Description | Assertion |
|----|-------|------|-------------|-----------|
| T3.1 | 2.3 | Unit | Instruction with originator full legal name absent (blank) | Intake rejects before AML/CFT screening; response identifies "originator full legal name" as failing field and the violated rule (mandatory, minimum length) |
| T3.2 | 2.3 | Unit | Instruction with originator full legal name abbreviated (e.g., "J. Smith") | Intake rejects; response identifies abbreviated name as format violation |
| T3.3 | 2.3 | Unit | Instruction with originator account number absent | Intake rejects before AML/CFT screening; response identifies the missing field |
| T3.4 | 2.3 | Unit | Instruction with originator address using PO box as street address line 1 | Intake rejects if Story 1.2 AC1 excludes PO box; response identifies PO box as format violation |
| T3.5 | 2.3 | Unit | Instruction with originator country code ≠ "NZ" | Intake rejects; response identifies country code validation failure |
| T3.6 | 2.3 | Unit | Instruction with all four originator information fields valid and complete | Intake proceeds to AML/CFT screening; no field validation error |
| T3.7 | 2.3 | Unit | Instruction with incomplete originator info does not reach AML/CFT screening | No AML/CFT screening call is made for the instruction; screening service call count = 0 for the rejected instruction |
| T3.8 | 2.3 | Unit | 7-year retention: originator information fields present in audit trail record linked to instruction ID | Audit trail entry for instruction contains: full legal name, account number, registered address, purpose of payment; retention tag = 7 years from transaction date |

---

### T4 — AML/CFT sanctions screening integration

**Jurisdiction legs:** NZ PRIMARY (RBNZ AML/CFT Act 2009, C1) + AU contributing (DFAT list for AU beneficiary, C2)

| ID | Story | Type | Description | Assertion |
|----|-------|------|-------------|-----------|
| T4.1 | 2.2 | Integration | Screening service returns clear result | Instruction proceeds to intra-group channel commitment step; screening record written: outcome=clear, list versions captured, immutable |
| T4.2 | 2.2 | Integration | Screening service returns match result (RBNZ-designated list) | Instruction declined; decline record written to audit trail: instruction ID, screening timestamp, lists checked, match indicator, matching list identifier; no AU beneficiary account detail disclosed in record; customer notified "payment cannot be processed"; no retry path available |
| T4.3 | 2.2 | Integration | Screening service returns match result (OFAC SDN) | Same assertions as T4.2; list identifier = OFAC SDN |
| T4.4 | 2.2 | Integration | Screening service returns match result (DFAT consolidated list — AU beneficiary, C2) | Same assertions as T4.2; list identifier = DFAT; AU-leg constraint enforcement confirmed |
| T4.5 | 2.2 | Integration | Screening service unavailable (timeout) | Instruction declined with fail-closed response (ADR-CB-004); NOT queued or deferred; service-unavailable record written: failure type=timeout, outcome=declined; customer notified "cannot be processed at this time" |
| T4.6 | 2.2 | Integration | Screening service unavailable (service error) | Same fail-closed assertions as T4.5; failure type=service-error |
| T4.7 | 2.2 | Integration | Match-declined instruction has no automated retry mechanism | Instruction with outcome=match has no automated resubmission path; a second intake attempt creates a new instruction with a new ID |
| T4.8 | 2.2 | Integration | Screening record contains all four required fields after each call | Each screening record contains: instruction ID, screening service call timestamp (ISO 8601 with timezone), screening list versions (RBNZ, OFAC, DFAT), overall outcome |

---

### T5 — RBNZ threshold transaction reporting

**Jurisdiction leg:** NZ PRIMARY (RBNZ AML/CFT Act 2009 s.A.4.2, C1)

| ID | Story | Type | Description | Assertion |
|----|-------|------|-------------|-----------|
| T5.1 | 2.5 | Unit | Instruction amount=NZD $9,999 (below threshold) | No threshold transaction report generated; no report record in audit trail |
| T5.2 | 2.5 | Unit | Instruction amount=NZD $10,000 (at threshold) | Threshold transaction report generated and submitted to TTPS-REP-001; report record written to audit trail; report contains: originator full legal name, originator account number, originator address, originator NZ country code, beneficiary name, beneficiary AU account, amount, instruction timestamp (ISO 8601), intra-group channel identifier, instruction ID |
| T5.3 | 2.5 | Integration | Threshold report submitted within reporting window (default: same business day) | Report submission timestamp is within same business day as instruction timestamp; update if Story 1.1 AC2 specifies a different window |
| T5.4 | 2.5 | Unit | Transaction splitting: single instruction amount=NZD $10,000 is NOT split across settlement sub-periods to bring apparent amount below threshold | Report threshold is applied to full instruction amount; splitting detection not required but amount used for reporting must equal the full instruction amount |
| T5.5 | 2.5 | Integration | Threshold report submission to TTPS-REP-001 fails | Instruction status updated to "pending-threshold-report"; alert sent to Payments Compliance Officer; report queued for resubmission |
| T5.6 | 2.5 | Integration | Instruction with status "pending-threshold-report" is excluded from net settlement calculation | Story 3.1 net settlement component does not include instructions with pending threshold reports; instruction carried forward to next settlement cycle |

---

### T6 — Credit instruction content (AUSTRAC originator information in transit)

**Jurisdiction leg:** AU PRIMARY (AUSTRAC AML/CTF Act 2006 s.B.1, C2) + cross-border (Story 2.4)

| ID | Story | Type | Description | Assertion |
|----|-------|------|-------------|-----------|
| T6.1 | 2.4 | Unit | Credit instruction transmitted to enterprise's Australian counterpart contains all four AUSTRAC originator information fields | Credit instruction payload includes: originator full legal name (untruncated), originator account number (untruncated), originator registered address (all components), purpose of payment; assertion: no field is absent, truncated, or substituted with a placeholder |
| T6.2 | 2.4 | Unit | Credit instruction contains AML/CFT screening reference | Credit instruction includes screening record ID from Story 2.2 AC4; the screening reference confirms pre-transmission screening clearance to the enterprise's Australian counterpart |
| T6.3 | 2.4 | Unit | Credit instruction contains instruction ID from intake | Credit instruction payload item (a) = instruction ID from Story 2.1 AC4; serves as idempotency key for TTPS-ROUTE-001 |
| T6.4 | 2.4 | Unit | Idempotency: credit instruction with the same instruction ID transmitted twice | Second transmission is identified as a duplicate via instruction ID; deduplication behaviour confirmed per TTPS-ROUTE-001 contract; AU-leg crediting occurs at most once per instruction ID (MEDIUM finding D1 from review — this test asserts the idempotency contract exists) |
| T6.5 | 2.4 | Integration | Enterprise's Australian counterpart acknowledgement received — instruction status updated | Instruction status transitions to "accepted-by-au-counterpart"; audit trail updated with: enterprise's Australian counterpart acknowledgement timestamp, enterprise's Australian counterpart reference ID |
| T6.6 | 2.4 | Integration | Enterprise's Australian counterpart returns rejection (invalid originator information) | Instruction status transitions to "rejected-by-au-counterpart"; rejection reason logged in audit trail; customer notified "payment could not be processed" with reason where disclosable; no automated retry |

---

### T7 — Net settlement and RBNZ FX transaction reporting

**Jurisdiction leg:** NZ PRIMARY (RBNZ FX Transaction Reporting Rules, C3)

| ID | Story | Type | Description | Assertion |
|----|-------|------|-------------|-----------|
| T7.1 | 3.1 | Unit | Net settlement includes only instructions with status "accepted-by-au-counterpart" | Instructions with other statuses (declined, pending-threshold-report, transmission-failed) are excluded from net settlement calculation |
| T7.2 | 3.1 | Unit | Net settlement calculation: NZD/AUD net position = sum of all accepted intra-group instructions for the settlement day | Net position value is arithmetically correct; settlement record includes count of contributing instructions and their instruction IDs |
| T7.3 | 3.1 | Unit | Settlement cut-off time: instructions submitted before 17:00 NZST included; instructions submitted at or after 17:00 NZST carried to next cycle | Boundary test: instruction submitted at 16:59:59 NZST included in today's cycle; instruction submitted at 17:00:00 NZST carried to next cycle (timezone: NZ local time, shifts with NZDT — see plan assumption above) |
| T7.4 | 3.1 | Integration | FX_REPORTING_VALIDATED=true, FX report submission to RBNZ channel succeeds | Net settlement position transmitted to TTPS-SET-001 after FX report acknowledged; settlement record includes FX report submission timestamp and acknowledgement reference |
| T7.5 | 3.1 | Integration | FX report submission fails | Net settlement transmission to TTPS-SET-001 blocked; alert sent to Enterprise Treasury Manager; FX report queued for resubmission; settlement record reflects failure state |
| T7.6 | 3.1 | Integration | Pending threshold report (T5.6 path): instruction excluded from net settlement | Settlement record reflects that excluded instructions are not included in the net position; they appear in next settlement cycle once threshold report acknowledged |

---

### T8 — Customer confirmation and 2-hour SLA

**Jurisdiction legs:** NZ + AU (confirmation gated on enterprise's Australian counterpart acknowledgement, C1+C2)

| ID | Story | Type | Description | Assertion |
|----|-------|------|-------------|-----------|
| T8.1 | 3.2 | Integration | Accepted instruction: customer confirmation dispatched within 2 hours of instruction submission timestamp | Confirmation dispatch timestamp − instruction submission timestamp ≤ 7200 seconds; confirmation sent via TTPS-CONF-001; confirmation contains: instruction ID, submission timestamp (ISO 8601), beneficiary name/masked account, amount (NZD), expected credit timeline, reference number |
| T8.2 | 3.2 | Integration | Rejected instruction (AU counterpart rejection): rejection notification dispatched within 2 hours | Rejection notification dispatch timestamp − instruction submission timestamp ≤ 7200 seconds; notification contains instruction ID, rejection timestamp, customer-appropriate explanation; no AML/CFT screening details disclosed |
| T8.3 | 3.2 | Unit | AML/CFT-declined instruction does not receive any confirmation | No confirmation or notification dispatched via TTPS-CONF-001 for instructions declined by Story 2.2 (clear result NOT received); confirms C1 constraint: confirmation only after AML/CFT screening cleared |
| T8.4 | 3.2 | Unit | SLA breach monitoring: instruction where 2-hour SLA is breached | SLA compliance status recorded as "outside-SLA" in audit trail entry; alert sent to Payments operations team |
| T8.5 | 3.2 | Unit | Confirmation audit record contents | Audit trail confirmation record contains: instruction ID, confirmation type (accepted/rejected), dispatch timestamp (ISO 8601), dispatch channel (TTPS-CONF-001), delivery status, SLA compliance status (within-SLA/outside-SLA) |

---

### T9 — Audit trail completeness (end-to-end, all constraints)

**Jurisdiction legs:** NZ + AU + cross-border (the audit trail satisfies RBNZ, AUSTRAC, and internal record-keeping obligations)

| ID | Story | Type | Description | Assertion |
|----|-------|------|-------------|-----------|
| T9.1 | All | Integration | Full instruction lifecycle: intake → screening → credit transmission → threshold report → net settlement → customer confirmation | Audit trail for one instruction contains linked records for all active processing steps; each record linked by instruction ID |
| T9.2 | 2.2+2.3 | Unit | Screening record immutability: no modification to screening record after it is written | Screening record written at T4.1/T4.2 cannot be overwritten or deleted; any write attempt returns an immutability error |
| T9.3 | 2.3 | Unit | 7-year retention: originator information in audit trail | Originator information fields in audit trail are tagged with 7-year retention from transaction date; satisfies both RBNZ s.A.5 and AUSTRAC retention requirements |
| T9.4 | 2.4+3.1 | Integration | Settlement audit record links to instruction IDs included in cycle | Net settlement record includes list of contributing instruction IDs; each instruction ID links back to its intake record (T2.5), screening record (T4.1), and credit instruction acknowledgement record (T6.5) |

---

### T10 — C5 specific: correspondent agreement gate and flag lifecycle

**Jurisdiction leg:** Cross-border contractual (JPMorgan Chase, C5)

| ID | Story | Type | Description | Assertion |
|----|-------|------|-------------|-----------|
| T10.1 | 1.5 | Unit | CORRESPONDENT_AGREEMENT_CLEARED=false → credit instruction transmission blocked | Story 2.4 transmission step returns "channel not authorised" without transmitting to enterprise's Australian counterpart; consistent with T1.8 |
| T10.2 | 1.5 | Unit | CORRESPONDENT_AGREEMENT_CLEARED=false → intake pre-flight gate blocks the instruction at entry | Story 2.1 AC1 flag check returns "service not yet available" identifying CORRESPONDENT_AGREEMENT_CLEARED as unmet; consistent with T1.5 |
| T10.3 | 1.5 | Unit | CORRESPONDENT_AGREEMENT_CLEARED=true → credit instruction transmission proceeds | After flag is set by Treasury Legal, transmission proceeds normally; no "channel not authorised" error |
| T10.4 | 1.5 | Unit | Flag revocation (E1 review finding): CORRESPONDENT_AGREEMENT_CLEARED reverted from true to false during active channel operation | All subsequent intake attempts return "service not yet available"; in-flight instructions already accepted-by-au-counterpart may complete settlement; new intake is blocked immediately; alert sent to Payments operations team |

---

## Human review script (AC verification — plain language)

For each Epic 1 story, pre-production verification consists of:
1. **Story 1.1**: Confirm RBNZ AML/CFT Compliance Officer has signed the written channel coverage confirmation. Confirm `AMLCFT_CHANNEL_VALIDATED` is `true` in deployment configuration. Confirm SharePoint document ID is recorded in deployment configuration.
2. **Story 1.2**: Confirm written AUSTRAC originator information field confirmation and AML/CTF Programme documentation confirmation are both filed. Confirm `AUSTRAC_CONFIRMATION_RECEIVED` is `true` in deployment configuration.
3. **Story 1.3**: Confirm Regulatory Affairs team written FX reporting determination is filed. Confirm `FX_REPORTING_VALIDATED` is `true` in deployment configuration.
4. **Story 1.4**: Confirm DIA written determination (or registration approval) is filed. Confirm `DIA_REGISTRATION_CLEARED` is `true` in deployment configuration.
5. **Story 1.5**: Confirm Treasury Legal clearance memorandum (or JPMorgan Chase notification acknowledgement) is filed. Confirm `CORRESPONDENT_AGREEMENT_CLEARED` is `true` in deployment configuration.

**Go-live gate check:** `AMLCFT_CHANNEL_VALIDATED AND AUSTRAC_CONFIRMATION_RECEIVED AND FX_REPORTING_VALIDATED AND DIA_REGISTRATION_CLEARED AND CORRESPONDENT_AGREEMENT_CLEARED` — all five must be `true` before any customer transaction is processed through the intra-group channel.

Post-deployment smoke test steps:
1. Submit a test NZD $5,000 AU-beneficiary instruction → confirm intra-group routing, screening pass, credit instruction transmitted, customer confirmation received within 2 hours.
2. Submit a test NZD $10,001 AU-beneficiary instruction → confirm SWIFT routing, standard processing.
3. Verify threshold transaction report generated for test instruction ≥NZD $10,000.
4. Verify end-of-day net settlement position calculated and transmitted with FX report (if applicable per Story 1.3 determination).

<!-- CPF-TRACE
stage: /test-plan
model: claude-sonnet-4-6
config: A

test_coverage_by_constraint:
- C1 (NZ leg — RBNZ AML/CFT): T4 (screening), T5 (threshold reporting), T3.8 (7-year retention), T9.3 (audit trail retention), T8.3 (no confirmation for screening-declined) — full NZ AML/CFT obligations tested ✅
- C2 (AU leg — AUSTRAC originator information): T3 (originator field completeness), T6 (originator fields in credit instruction), T6.4 (idempotency), T8.2 (rejection notification for AU counterpart rejections) — full AU-leg obligations tested ✅
- C3 (NZ leg — RBNZ FX reporting): T7 (net settlement + FX report), T5.6 (pending threshold report blocks settlement), T7.5 (FX report failure blocks settlement) — full FX reporting obligation tested ✅
- C4 (NZ leg — DIA registration): T1.4 (DIA_REGISTRATION_CLEARED=false → "service not yet available"), T1.6 (all flags=true → proceeds) — DIA gate tested ✅
- C5 (cross-border contractual — JPMorgan Chase): T1.5 (intake flag gate), T1.8 (transmission flag gate), T10 (full C5 flag lifecycle including revocation) — correspondent agreement constraint tested ✅

jurisdiction_leg_test_coverage:
- NZ leg: T2 (routing decision), T3 (originator validation under RBNZ), T4 (RBNZ AML/CFT screening), T5 (RBNZ threshold reporting), T7 (RBNZ FX reporting), T8 (SLA compliance) ✅
- AU leg: T3 (AUSTRAC originator fields), T4.4 (DFAT list for AU beneficiary), T6 (credit instruction AUSTRAC fields), T8.2 (AU counterpart rejection notification) ✅
- Cross-border: T1 (all five flag gates), T6.4 (idempotency / TTPS-ROUTE-001 contract), T10 (CORRESPONDENT_AGREEMENT_CLEARED full lifecycle) ✅

c5_tested_via:
- T1.5: intake-level CORRESPONDENT_AGREEMENT_CLEARED=false gate blocks instruction before any processing
- T1.8: credit instruction transmission CORRESPONDENT_AGREEMENT_CLEARED=false gate returns "channel not authorised"
- T10.1–T10.4: full C5 flag lifecycle; includes T10.4 flag revocation (review finding E1)

d1_review_finding_tested: T6.4 asserts idempotency contract (credit instruction with same instruction ID transmitted twice; deduplication confirmed)
e1_review_finding_tested: T10.4 asserts flag revocation behaviour (CORRESPONDENT_AGREEMENT_CLEARED reverted to false; active channel blocks new intake immediately)
-->
