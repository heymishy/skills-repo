# Test Plan: KiwiSaver Online Fund Switching — Digital Self-Service with Regulatory Compliance

**Status:** Complete (eval-mode — EXP-008-corpus-breadth-eval / Config A / S9)
**Feature slug:** kiwisaver-online-fund-switching
**Date:** 2026-05-17
**Skill version:** /test-plan
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S9
**Prior artefacts read from disk:** `runs/config-A-S9/discovery.md` ✅, `runs/config-A-S9/definition.md` ✅, `runs/config-A-S9/review.md` ✅

---

## Step 0 — Entry condition check

- Review artefact: ✅ on disk — Conditional pass (3 HIGH findings; all to be resolved in this test plan)
- HIGH findings to resolve: H1 (fee gate SEN sequencing), H2 (hardship waiver API failure path), H3 (audit log orphaned instruction state)
- Context injection files: ✅ active

---

## Test data strategy

**Regulatory test data requirements:**
- Member dataset: 5 synthetic members covering all eligibility scenarios: (a) eligible — tenure ≥ 90 days, no holiday, no hardship, MFA verified; (b) ineligible — tenure < 90 days; (c) contributions holiday — `ACTIVE_SWITCH_BLOCKED`; (d) hardship active — `hardship_active: true`; (e) MFA not verified.
- Fee scenarios: (a) member with 0–2 prior switches (fee not applicable), (b) member with 3rd+ switch (fee applicable, no hardship), (c) member with 3rd+ switch + `hardship_active: true` (fee waiver applies).
- SEN record: Test fixture for SEN process records in each status: `PENDING_FILING`, `FILED_AWAITING_ACKNOWLEDGEMENT`, `NOTIFICATION_SENT`, `NOTIFICATION_PERIOD_COMPLETE`, `BLOCKED_BY_FMA_QUERY`.
- Contributions Management API mock: Returns controlled `hardship_active`, `contributions_holiday_status`, and `tenure_days` values per test case. Error simulation mode available.
- Unit Registry API mock: Returns success (200 + confirmation reference), non-200 error, and timeout scenarios.
- Audit log: Test against storage mock supporting write success, write failure, and reconciliation retry scenarios.
- All member IDs in test data are synthetic — no real KiwiSaver member records used.

---

## Test suite

### Part 1 — Story 1.1: FMA SEN Workflow

**T-SEN-001 — Feature flag blocked when SEN not complete**
```
GIVEN FUND_SWITCH_LIVE_ENABLED is false
AND the SEN process record status is not NOTIFICATION_PERIOD_COMPLETE
WHEN an attempt is made to set FUND_SWITCH_LIVE_ENABLED to true
THEN the attempt is rejected
AND the error message lists the unsatisfied SEN conditions
```
*Resolves: Story 1.1 AC3. Written to fail until SEN gate enforcement is implemented.*

**T-SEN-002 — Feature flag allowed when SEN complete and acknowledgement received**
```
GIVEN SEN process record shows status: NOTIFICATION_PERIOD_COMPLETE
AND fma_acknowledgement_reference is populated
WHEN FUND_SWITCH_LIVE_ENABLED is set to true
THEN the flag is accepted
AND the switch submission endpoint returns HTTP 200 (not 503)
```
*Resolves: Story 1.1 AC3. Written to fail until SEN gate passes.*

**T-SEN-003 — Feature flag blocked when FMA query is active**
```
GIVEN SEN status is BLOCKED_BY_FMA_QUERY
WHEN an attempt is made to set FUND_SWITCH_LIVE_ENABLED to true
THEN the attempt is rejected with error FMA_QUERY_OUTSTANDING
```
*Resolves: Story 1.1 AC5.*

**T-SEN-004 — SEN status transition audit records created**
```
GIVEN SEN process record status is PENDING_FILING
WHEN status is updated to FILED_AWAITING_ACKNOWLEDGEMENT
THEN an audit entry is created with previous_status, new_status, timestamp, and actor
```
*Resolves: Story 1.1 AC6.*

**T-SEN-005 — Bulk SEN member notification dispatch NFR (I2 resolution)**
```
GIVEN 52,000 synthetic member records with email/SMS preferences
WHEN SEN pre-change notification dispatch is triggered (Story 1.1 AC4)
THEN 95% of dispatches complete within 4 hours of trigger
AND 100% complete within 24 hours
AND failed deliveries are logged and retried within 6 hours
```
*Resolves: Review finding I2. NFR test — performance assertion.*

---

### Part 2 — Story 1.2: Switching Fee PDS Gate

**T-FEE-001 — Fee flag blocked when PDS not filed**
```
GIVEN SWITCH_FEE_ENABLED is false
AND pds_amendment_fma_filing_date is not populated
WHEN an attempt is made to set SWITCH_FEE_ENABLED to true
THEN the attempt is rejected with error FEE_GATE_NOT_SATISFIED: [PDS_NOT_FILED]
```
*Resolves: Story 1.2 AC1/AC2.*

**T-FEE-002 — Fee flag blocked when 20-business-day period not elapsed**
```
GIVEN pds_amendment_fma_filing_date is set to 10 business days ago
WHEN an attempt is made to set SWITCH_FEE_ENABLED to true
THEN the attempt is rejected with error FEE_GATE_NOT_SATISFIED: [PDS_NOTICE_PERIOD_NOT_ELAPSED]
AND the error states the earliest eligible date for fee activation
```
*Resolves: Story 1.2 AC1/AC2.*

**T-FEE-003 — Fee flag blocked when hardship waiver legal sign-off absent**
```
GIVEN pds_amendment_fma_filing_date is 25 business days ago
AND hardship_waiver_legal_sign_off is false
WHEN an attempt is made to set SWITCH_FEE_ENABLED to true
THEN the attempt is rejected with error FEE_GATE_NOT_SATISFIED: [HARDSHIP_WAIVER_NOT_SIGNED_OFF]
```
*Resolves: Story 1.2 AC1/AC2. This test directly verifies the hardship waiver legal gate.*

**T-FEE-004 — Fee flag requires FUND_SWITCH_LIVE_ENABLED (H1 resolution)**
```
GIVEN FUND_SWITCH_LIVE_ENABLED is false
AND all other fee gate conditions are satisfied (PDS filed 25 business days ago, hardship sign-off present)
WHEN an attempt is made to set SWITCH_FEE_ENABLED to true
THEN the attempt is rejected with error FEE_GATE_NOT_SATISFIED: [SWITCH_LIVE_NOT_ENABLED]
```
*Resolves: Review HIGH finding H1. Written to fail until sequencing constraint is implemented.*

**T-FEE-005 — Hardship waiver auto-applied when hardship_active: true**
```
GIVEN SWITCH_FEE_ENABLED is true
AND member has hardship_active: true (from Contributions Management mock)
AND member has 3 prior switches in current calendar year
WHEN the member submits a switch instruction (passing all other eligibility checks)
THEN fee_waiver_applied: true on the instruction record
AND fee amount in confirmation message is $0.00 with "Hardship waiver applied" notation
```
*Resolves: Story 1.2 AC3, AC4. C5 test — hardship waiver enforcement.*

**T-FEE-006 — Standard fee charged when hardship_active: false and 3rd+ switch**
```
GIVEN SWITCH_FEE_ENABLED is true
AND member has hardship_active: false
AND member has 3 prior switches in current calendar year
WHEN the member submits a switch instruction
THEN fee_waiver_applied: false on the instruction record
AND fee amount in confirmation message is $15.00
```
*Resolves: Story 1.2 AC3, AC4.*

---

### Part 3 — Story 2.1: Eligibility Check Layer

**T-ELIG-001 — Tenure restriction rejection (ELIG-001)**
```
GIVEN member tenure is 45 days from join date (< 90 days)
AND member has valid MFA
WHEN the member attempts to submit a switch instruction
THEN the system returns HTTP 422
AND rejection_reason: TENURE_RESTRICTION
AND the response includes paper form fallback instructions
AND no switch instruction record is created
```
*Resolves: Story 2.1 AC1.*

**T-ELIG-002 — Contributions holiday blocked switch (ELIG-002)**
```
GIVEN member tenure > 90 days
AND Contributions Management returns contributions_holiday_status: ACTIVE_SWITCH_BLOCKED
WHEN the member attempts to submit a switch instruction
THEN the system returns HTTP 422
AND rejection_reason: CONTRIBUTIONS_HOLIDAY_RESTRICTION
AND the response includes operations team contact instructions
```
*Resolves: Story 2.1 AC2.*

**T-ELIG-003 — MFA required before eligibility checks run (ELIG-004)**
```
GIVEN member has valid tenure and no holiday restriction
AND mfa_verified: false in identity token
WHEN the member attempts to access the switch submission endpoint
THEN the system returns HTTP 401 or redirect to MFA completion
AND ELIG-001 to ELIG-003 are not evaluated
```
*Resolves: Story 2.1 AC4 — MFA check must precede eligibility checks.*

**T-ELIG-004 — Eligibility result logged for rejected instructions**
```
GIVEN member fails ELIG-001 (tenure restriction)
WHEN the switch attempt is rejected
THEN an audit record is created with eligibility_check_result including ELIG-001: FAIL and rejection_reason: TENURE_RESTRICTION
AND the audit record timestamp is within 5 seconds of the rejection event
```
*Resolves: Story 2.1 AC5, Story 3.2 AC1.*

**T-ELIG-005 — Hardship API failure defaults to waiver (H2 resolution)**
```
GIVEN Contributions Management API returns HTTP 500 when queried for hardship_active field
WHEN the member passes ELIG-001 and ELIG-002 and reaches ELIG-003
THEN the switch instruction is ACCEPTED
AND fee_waiver_applied: true (fail-safe default toward member benefit)
AND audit record includes eligibility_check_result: ELIG-003: API_ERROR_WAIVER_DEFAULTED
```
*Resolves: Review HIGH finding H2. C5 adversarial test — fail-safe default protects hardship members when API is unavailable.*

**T-ELIG-006 — Contributions Management API unavailability halts eligibility (AC6)**
```
GIVEN Contributions Management API is completely unavailable (connection refused)
WHEN the member submits a switch instruction
THEN the system returns HTTP 503
AND rejection_reason: ELIGIBILITY_CHECK_UNAVAILABLE
AND no switch instruction is created
```
*Resolves: Story 2.1 AC6.*

---

### Part 4 — Story 2.2: Switch Instruction Submission

**T-SWITCH-001 — Successful switch instruction submission**
```
GIVEN eligible member (tenure > 90 days, no holiday, no hardship, MFA verified)
AND FUND_SWITCH_LIVE_ENABLED is true
AND Unit Registry API mock returns HTTP 200 with confirmation reference
WHEN the member selects target fund (conservative) from source fund (growth), confirms
THEN switch instruction is created with status COMMITTED
AND unit_registry_confirmation_reference is populated
AND a switch reference number is displayed to the member
```
*Resolves: Story 2.2 AC1, AC2.*

**T-SWITCH-002 — Pre-cutoff instruction gets same-day pricing date**
```
GIVEN eligible member and FUND_SWITCH_LIVE_ENABLED true
AND instruction submitted at 14:00 NZST on a business day
WHEN the switch instruction is committed to unit registry
THEN pricing_date on the instruction is today's business date
AND confirmation screen shows today's date as effective pricing date
```
*Resolves: Story 2.2 AC3. KiwiSaver Act s.45 compliance test.*

**T-SWITCH-003 — Post-cutoff instruction gets next-business-day pricing date**
```
GIVEN instruction submitted at 15:30 NZST on a business day
WHEN the switch instruction is committed
THEN pricing_date on the instruction is the next business date
AND confirmation screen shows next business day as effective pricing date
```
*Resolves: Story 2.2 AC3.*

**T-SWITCH-004 — Same fund switch rejected**
```
GIVEN member is currently in the growth fund
WHEN the member attempts to submit a switch instruction with target_fund: growth
THEN the system returns HTTP 400 with error SAME_FUND_SWITCH_INVALID
```
*Resolves: Story 2.2 AC4.*

**T-SWITCH-005 — Switch endpoint blocked when FUND_SWITCH_LIVE_ENABLED false**
```
GIVEN FUND_SWITCH_LIVE_ENABLED is false
WHEN any authenticated member accesses the switch submission endpoint
THEN the system returns an informational message that online switching is not yet available
AND the paper form contact details are displayed
```
*Resolves: Story 2.2 AC5.*

**T-SWITCH-006 — Unit Registry timeout triggers retry queue**
```
GIVEN Unit Registry API mock is configured to return timeout after 4 seconds
WHEN a switch instruction is submitted
THEN the instruction enters RETRY_QUEUE status
AND the system retries 3 times at 30-second intervals
AND after 3 failed retries the instruction is marked FAILED_REGISTRY_TIMEOUT
AND the member receives an email/SMS notification to contact operations
```
*Resolves: Story 2.2 AC6.*

**T-SWITCH-007 — Concurrent switch attempt blocked for member with in-progress instruction**
```
GIVEN member has a switch instruction in PROCESSING status
WHEN the same member attempts to submit another switch instruction
THEN the system returns HTTP 409 with error SWITCH_ALREADY_IN_PROGRESS
```
*Resolves: Story 2.2 AC7.*

---

### Part 5 — Story 3.1: Member Confirmation and Notification

**T-NOTIF-001 — Confirmation dispatched within one business day of COMMITTED status**
```
GIVEN switch instruction status transitions to COMMITTED with unit registry reference populated
WHEN one business day elapses from instruction timestamp
THEN a confirmation notification has been dispatched via MPSW-EXT-002
AND the notification includes: switch reference, source fund, target fund, pricing date, fee amount or waiver notation, and reference number
```
*Resolves: Story 3.1 AC1.*

**T-NOTIF-002 — Rejection notification dispatched for ELIG-001 failure**
```
GIVEN a switch attempt rejected with TENURE_RESTRICTION
WHEN one business day elapses
THEN a rejection notification has been dispatched
AND the notification states rejection reason in plain language
AND includes paper form contact details
```
*Resolves: Story 3.1 AC2.*

**T-NOTIF-003 — Confirmation discloses fee and waiver plainly (FMA CoC Part 2.2 / 4.2)**
```
GIVEN a completed switch with fee_waiver_applied: true
WHEN the confirmation notification is generated
THEN the notification body contains: the text "$0.00" for fee amount, and the text "Hardship waiver applied" or equivalent plain language
AND the target fund management fee is disclosed
AND the cooling-off period is disclosed
```
*Resolves: Story 3.1 AC3. FMA disclosure requirement test.*

---

### Part 6 — Story 3.2: Regulatory Audit Log

**T-AUDIT-001 — Audit record created for every switch event within 5 seconds**
```
GIVEN a switch instruction submission attempt (any outcome)
WHEN the event occurs
THEN an audit record is written to MPSW-AUD-001 within 5 seconds
AND the record includes: instruction_reference (UUID), member_id_hashed, event_type, event_timestamp, source/target fund codes, eligibility_check_result, fee_amount, fee_waiver_applied, unit_registry_confirmation_reference
```
*Resolves: Story 3.2 AC1, AC2.*

**T-AUDIT-002 — Audit record retrieval by instruction reference**
```
GIVEN audit records exist for instruction_reference: UUID-001
WHEN compliance API is queried with instruction_reference: UUID-001
THEN all records for that reference are returned in descending timestamp order
AND the endpoint is inaccessible to member-facing roles (returns HTTP 403)
```
*Resolves: Story 3.2 AC4.*

**T-AUDIT-003 — Audit record written before registry confirmation update (H3 resolution)**
```
GIVEN a switch instruction is committed to unit registry (registry returns 200)
WHEN the application processes the unit registry confirmation response
THEN the audit record with event_type: REGISTRY_CONFIRMED is written FIRST
THEN the instruction status is updated to COMMITTED
(Test: inject audit log write delay of 200ms; assert instruction stays PROCESSING until audit write completes)
```
*Resolves: Review HIGH finding H3 (ordering constraint). Written to fail until sequencing is enforced.*

**T-AUDIT-004 — Post-registry audit write failure triggers reconciliation retry (H3 resolution)**
```
GIVEN a switch instruction has been committed to unit registry (registry returned 200)
AND the audit log write fails (storage unavailable)
WHEN the failure is detected
THEN an operational alert is raised
AND a reconciliation job retries the audit write using unit_registry_confirmation_reference
AND the retry succeeds when storage becomes available
AND the instruction is not marked COMMITTED until audit record write succeeds
```
*Resolves: Review HIGH finding H3 (reconciliation pathway).*

**T-AUDIT-005 — Audit record deletion blocked at storage layer**
```
GIVEN an audit record exists in MPSW-AUD-001
WHEN a deletion attempt is made without dual-approval workflow
THEN the deletion is rejected at the storage ACL level
AND an alert is generated for the deletion attempt
```
*Resolves: Story 3.2 AC3 (tamper-evident retention).*

---

## NFR test cases

**T-NFR-001 — Eligibility check latency (Contributions Management API at P95)**
```
GIVEN 200 concurrent eligibility check requests
WHEN sent to the eligibility layer
THEN P95 response time from Contributions Management API is ≤ 500ms
AND no eligibility checks fail due to latency alone
```
*Resolves: Story 2.1 AC6 latency NFR.*

**T-NFR-002 — Unit Registry API response within 3 seconds**
```
GIVEN a standard switch instruction submission
WHEN submitted to the Unit Registry API
THEN the response is received within 3 seconds under normal load
(100 concurrent instructions — expected EOFY peak: 2,000 per MPSW-RISK-003; load test required separately)
```
*Resolves: Story 2.2 AC6 latency NFR.*

**T-NFR-003 — KiwiSaver Act s.45 same-day processing compliance (audit-trail verified)**
```
GIVEN 30-day post-launch audit log sample
WHEN all switch instructions submitted before 3pm NZST on business days are queried
THEN 100% have pricing_date equal to the business date of submission
(Verified via MPSW-AUD-001 retrieval API — T-AUDIT-002 retrieval function)
```
*Resolves: C1 compliance NFR — KiwiSaver Act s.45 same-day processing verification.*

**T-NFR-004 — Audit log retention policy enforcement (7-year)**
```
GIVEN audit records with event_timestamp older than 7 years
WHEN automated retention policy runs
THEN records are NOT deleted (7-year minimum retention enforced)
GIVEN audit records with event_timestamp older than 10 years
WHEN dual-approval deletion workflow is executed
THEN records are deleted
AND deletion event is logged
```
*Resolves: Story 3.2 AC3 retention NFR.*

---

## AC verification script (plain language — for human reviewer)

**Pre-launch compliance checks (run before setting FUND_SWITCH_LIVE_ENABLED = true):**

1. Confirm SEN process record shows `status: NOTIFICATION_PERIOD_COMPLETE` and `fma_acknowledgement_reference` is populated.
2. Confirm 30 calendar days have elapsed since member notification dispatch date.
3. Confirm `FUND_SWITCH_LIVE_ENABLED` cannot be set to `true` without both conditions above (run T-SEN-001 to verify gate enforcement).
4. If `SWITCH_FEE_ENABLED` is to be activated alongside: confirm `pds_amendment_fma_filing_date` is ≥ 20 business days ago, `hardship_waiver_legal_sign_off` is `true` with named reviewer and date, and `FUND_SWITCH_LIVE_ENABLED` is already `true` (run T-FEE-001 to T-FEE-004).

**Switch instruction eligibility verification (run T-ELIG-001 to T-ELIG-006):**

5. Submit a test switch for a member with tenure = 45 days — confirm rejection with `TENURE_RESTRICTION` and paper fallback message.
6. Submit a test switch for a member with `contributions_holiday_status: ACTIVE_SWITCH_BLOCKED` — confirm rejection with `CONTRIBUTIONS_HOLIDAY_RESTRICTION`.
7. Submit a test switch for a member with `hardship_active: true` and 3+ prior switches — confirm `fee_waiver_applied: true` and `$0.00` in confirmation. **This verifies C5 statutory compliance.**
8. Simulate Contributions Management API error for ELIG-003 — confirm switch is accepted with `fee_waiver_applied: true` defaulted (T-ELIG-005). **This verifies the hardship-safe failure mode.**

**Audit log spot check (run T-AUDIT-001, T-AUDIT-002):**

9. Submit 5 test switch instructions with different outcomes (approved, rejected, fee waiver, fee charged, API error). Retrieve audit log for each instruction reference. Confirm all events are present and timestamps are within 5 seconds of event occurrence.
10. Attempt audit record deletion without dual-approval — confirm blocked (T-AUDIT-005).

---

<!-- CPF-TRACE
stage: /test-plan
model: claude-sonnet-4-6
config: A

constraints_tested:
  - C1: "KiwiSaver Act s.45 — T-SWITCH-002 (pre-cutoff same-day pricing date), T-SWITCH-003 (post-cutoff next-business-day), T-NFR-003 (30-day audit sample compliance check)"
  - C2: "FMA SEN 30-day — T-SEN-001 (flag blocked when SEN not complete), T-SEN-002 (flag allowed when SEN complete), T-SEN-003 (FMA query blocks go-live)"
  - C3: "March 31 false urgency — T-SEN-001/T-SEN-002 indirectly verify that no bypass of SEN gate is possible regardless of date pressure"
  - C4: "KiwiSaver Act s.51A eligibility — T-ELIG-001 (tenure restriction), T-ELIG-002 (contributions holiday)"
  - C5: "KiwiSaver Act s.58 hardship waiver — T-FEE-003 (hardship legal gate blocks fee activation), T-FEE-005 (waiver auto-applied), T-ELIG-005 (fail-safe default when API unavailable)"

high_findings_resolved:
  - H1: "T-FEE-004 — SWITCH_FEE_ENABLED gate requires FUND_SWITCH_LIVE_ENABLED"
  - H2: "T-ELIG-005 — hardship API error defaults fee_waiver_applied to true"
  - H3: "T-AUDIT-003 (ordering constraint), T-AUDIT-004 (reconciliation retry)"

nfr_tests:
  - "T-NFR-001 — Contributions Management P95 ≤ 500ms under 200 concurrent"
  - "T-NFR-002 — Unit Registry API ≤ 3s response"
  - "T-NFR-003 — KiwiSaver Act s.45 compliance NFR (audit-trail verified)"
  - "T-NFR-004 — 7-year audit retention"

adversarial_tests:
  - "T-ELIG-005 — hardship API unavailable: fail-safe default to waiver"
  - "T-SWITCH-006 — Unit Registry timeout: retry queue and member notification"
  - "T-SEN-003 — FMA query blocks go-live"
  - "T-AUDIT-005 — audit deletion attempt blocked"

c5_test_coverage: complete
-->
