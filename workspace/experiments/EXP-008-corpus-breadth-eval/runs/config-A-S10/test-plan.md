# Test Plan: Core Banking Loan Migration — LoanLedger-NZ Decommission

**Status:** Complete (eval-mode — EXP-008-corpus-breadth-eval / Config A / S10)
**Feature slug:** core-banking-loan-migration
**Date:** 2026-05-17
**Skill version:** /test-plan
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S10
**Prior artefacts read:** discovery.md ✅, definition.md ✅, review.md ✅
**Review findings carried in:** H1 (rollback mechanism), H2 (reporting fallback gate), H3 (PPSR gate on migration commencement) — all three HIGH findings resolved in review; tests below reflect resolved ACs.

---

## Section 1 — Regulatory constraint tests (C1 and C5)

### T-BS11-001 — BS11 notification record created with all required fields
**Story:** 1.1 AC1
**Type:** Unit / integration
**Description:** Create a BS11 notification record via the compliance tracking API. Assert that all mandatory fields are present in the created record: `filing_date`, `self_disclosure_filed` (boolean), `rbnz_acknowledgement_reference` (nullable string), `rbnz_acknowledgement_date` (nullable date), `senior_officer_accountable` (string — non-empty), `project_timeline_submitted` (boolean), `risk_assessment_submitted` (boolean), `notification_status` (enum — initial value PENDING_FILING).
**Pass condition:** HTTP 201 response; response body contains all fields; `notification_status` = PENDING_FILING; all boolean fields present and false by default.
**Fail condition:** Any mandatory field absent; `notification_status` missing or set to any value other than PENDING_FILING on creation.

### T-BS11-002 — BS11 notification status transitions correctly
**Story:** 1.1 AC1, AC2
**Type:** Unit
**Description:** Test the BS11 notification status state machine. Transitions: PENDING_FILING → FILED_AWAITING_ACK (on `filing_date` set); FILED_AWAITING_ACK → ACK_RECEIVED (on `rbnz_acknowledgement_reference` and `rbnz_acknowledgement_date` set); ACK_RECEIVED → SUPERVISORY_ENGAGEMENT_ACTIVE (on first supervisory meeting scheduled). Invalid transitions (e.g., PENDING_FILING → ACK_RECEIVED without intermediate FILED_AWAITING_ACK) must be rejected.
**Pass condition:** All valid transitions succeed; invalid transitions return HTTP 400 with status error message.
**Fail condition:** Any invalid transition succeeds; any valid transition rejected.

### T-BS11-003 — Development gate blocks Story 2.x work unless BS11 status is ACK_RECEIVED
**Story:** 1.1 AC3 (C5 gate)
**Type:** Integration — project governance gate
**Description:** Attempt to open a development sprint for a Story 2.x work item when `BS11_NOTIFICATION_STATUS` is PENDING_FILING. Assert that the sprint creation is rejected. Then set `BS11_NOTIFICATION_STATUS` to ACK_RECEIVED and re-attempt. Assert sprint creation succeeds.
**Pass condition:** Sprint creation blocked when status ≠ ACK_RECEIVED; sprint creation succeeds when status = ACK_RECEIVED.
**Fail condition:** Sprint creation succeeds when BS11_NOTIFICATION_STATUS = PENDING_FILING or FILED_AWAITING_ACK.
**Adversarial case:** Attempt to set `BS11_NOTIFICATION_STATUS` to ACK_RECEIVED without a populated `rbnz_acknowledgement_reference` — assert this is rejected (field validation prevents false gate bypass).

### T-BS11-004 — BS11 notification checklist validates all s.4.3 sections before submission
**Story:** 1.1 AC5
**Type:** Unit
**Description:** Attempt to submit the BS11 notification with one of the six required sections missing (test each section in turn). Assert that each missing section causes the submission to fail with a specific error naming the missing section.
**Pass condition:** Each of the six section-missing cases returns a validation error naming the specific missing section; all-sections-present submission succeeds.
**Fail condition:** Any submission with a missing section succeeds without error; error message does not name the specific missing section.

### T-BS11-005 — Three supervisory meeting obligations tracked with correct milestones
**Story:** 1.1 AC4
**Type:** Unit / integration
**Description:** Create a BS11 notification record. Assert that three supervisory meeting records are created with types INITIATION, PARALLEL_OP_START, and PRE_CUTOVER_30_DAYS, each with initial status PENDING. Schedule the PRE_CUTOVER_30_DAYS meeting for a date less than 30 days before the planned cutover date — assert this is rejected. Schedule it for exactly 30 days before cutover — assert accepted.
**Pass condition:** Three meeting records created on notification creation; PRE_CUTOVER meeting rejected when < 30 days before cutover; meeting scheduling at ≥ 30 days accepted.
**Fail condition:** Fewer than three meeting records created; date validation not enforced for PRE_CUTOVER meeting.

### T-BS11-006 — Cutover gate blocked until PRE_CUTOVER supervisory meeting is COMPLETE
**Story:** 1.1 AC4
**Type:** Integration
**Description:** Attempt to schedule the cutover date when the PRE_CUTOVER_30_DAYS supervisory meeting is in PENDING status. Assert that cutover scheduling is rejected. Set the meeting status to COMPLETE. Assert that cutover scheduling now succeeds.
**Pass condition:** Cutover scheduling blocked when PRE_CUTOVER meeting ≠ COMPLETE; succeeds when COMPLETE.
**Fail condition:** Cutover scheduling succeeds while PRE_CUTOVER meeting is in PENDING or SCHEDULED status.

### T-BS11-007 — Self-disclosure flag required on late-filing notification
**Story:** 1.1 AC1 (C5 remediation gate)
**Type:** Unit
**Description:** Create a BS11 notification with `self_disclosure_filed: false` for a project that has been underway for more than 30 business days (i.e., project initiation date is more than 30 business days before the filing date). Assert that the submission is rejected with a warning requiring `self_disclosure_filed: true`. Create the same record with `self_disclosure_filed: true` — assert accepted.
**Pass condition:** Late-filing notification with `self_disclosure_filed: false` rejected; with `self_disclosure_filed: true` accepted.
**Fail condition:** Notification accepted without self-disclosure flag when project is demonstrably initiated more than 30 business days before filing.

---

## Section 2 — CCCFA data integrity tests (C2)

### T-MCON-001 — Zero records dropped in migration batch
**Story:** 2.2 AC2
**Type:** Integration — migration validation
**Description:** Execute a test migration batch of 1,000 accounts (representative sample). After the batch completes, query the migration audit log for records with status `FAILED_DROPPED`. Assert count = 0.
**Pass condition:** Zero accounts have FAILED_DROPPED status after batch completion.
**Fail condition:** Any account has FAILED_DROPPED status; reconciliation report omits any account that was in the source batch.

### T-MCON-002 — All mandatory financial fields present and correct after migration
**Story:** 2.2 AC3
**Type:** Integration — field-level reconciliation
**Description:** For a 1,000-account test migration, select 100 accounts at random for a field-level verification. For each account, compare source values (read directly from LoanLedger-NZ at migration time) and target values (read from CoreBanking-NXT after migration) for: `account_id`, `account_type`, `original_loan_amount`, `currency`, `interest_rate_history` (all records), `drawdown_history` (all records), `repayment_schedule`, `repayment_history` (all records), `arrears_status`, `arrears_history`, `security_registration_reference` (home loans only). Assert 100% field-level match on all records.
**Pass condition:** All 100 sampled accounts pass field-level verification; no discrepancies on any mandatory field.
**Fail condition:** Any field discrepancy on any mandatory field; any mandatory field missing in target that was present in source.

### T-MCON-003 — CCCFA 7-year closed account records migrated
**Story:** 2.2 AC3
**Type:** Integration
**Description:** Query CoreBanking-NXT for closed loan accounts with `closed_date` within the last 7 years. Compare count against the count of eligible closed accounts from LoanLedger-NZ (pre-migration export). Assert that count matches. Verify that 20 randomly-sampled closed accounts have `closed_date` populated and all mandatory history fields present.
**Pass condition:** Closed account count in CoreBanking-NXT matches LoanLedger-NZ eligible count; all 20 sampled accounts have populated `closed_date` and full history fields.
**Fail condition:** Count mismatch; any sampled account missing `closed_date` or history field.

### T-MCON-004 — Migration audit log captures source, transformation, and target for each record
**Story:** 2.2 AC5
**Type:** Unit / integration
**Description:** Migrate a test account. Query the migration audit log for that account. Assert that the log record contains: `source_account_id`, `source_fields` (full snapshot at migration time), `transformation_rules_applied` (list — may be empty if no transformation), `target_fields` (full snapshot after migration), `migration_batch_id`, `migration_timestamp`, `reconciliation_status`. All fields must be present.
**Pass condition:** Audit log record contains all required fields for the test account; `reconciliation_status` = SUCCESS.
**Fail condition:** Any mandatory audit log field absent; log record not queryable by account ID.

### T-MCON-005 — Source data read-accessibility confirmed at 12-month retention gate
**Story:** 2.2 AC4
**Type:** Integration
**Description:** After final cutover, query LoanLedger-NZ read-only instance for an account that has been migrated to CoreBanking-NXT. Assert that the account record is readable (HTTP 200 with full account data) and that any write attempt is rejected (HTTP 403 or 405). Assert that the decommission gate check returns false until 12 months have elapsed since the final cutover date.
**Pass condition:** Read query succeeds; write query rejected; decommission gate returns false before 12 months.
**Fail condition:** Read query fails or returns incomplete data; write query not rejected; decommission gate returns true before 12 months.

### T-MCON-006 — Rollback mechanism reverses batch atomically on FAILED_INTEGRITY detection
**Story:** 2.2 AC2 (H1 resolution)
**Type:** Integration — adversarial
**Description:** Inject a data integrity failure into a test migration batch by corrupting one account's `repayment_history` in the test target system after the batch write completes (simulating a toolset error). Trigger the reconciliation check. Assert that: (a) the batch is detected as FAILED_INTEGRITY; (b) the rollback command is executed within 4 hours of failure detection; (c) all CoreBanking-NXT write operations from the failed batch are reversed (querying CoreBanking-NXT for migrated accounts returns not-found); (d) LoanLedger-NZ shadow mirror for those accounts remains intact.
**Pass condition:** Failure detected; rollback completes within 4 hours; CoreBanking-NXT writes reversed; LoanLedger-NZ data intact.
**Fail condition:** Failure not detected; rollback not triggered; rollback exceeds 4-hour SLA; any CoreBanking-NXT write from failed batch remains after rollback.

---

## Section 3 — RBNZ regulatory reporting tests (C1, C4)

### T-RPT-001 — All 14 report types confirmed before parallel operation start
**Story:** 1.2 AC1
**Type:** Integration
**Description:** Attempt to set parallel operation status to STARTED when any of the 3 custom report types has `implementation_scope_confirmed: false`. Assert rejection. Set all 3 to true. Assert parallel operation start is accepted.
**Pass condition:** Parallel operation start blocked until all 3 custom reports confirmed; succeeds when all confirmed.
**Fail condition:** Parallel operation start succeeds with any custom report unconfirmed.

### T-RPT-002 — Parallel reporting produces output from both systems for one full cycle
**Story:** 1.2 AC3
**Type:** Integration
**Description:** For a test reporting cycle, configure both LoanLedger-NZ and CoreBanking-NXT to produce a BS3 report. Assert that both reports are present in the parallel reporting record for the cycle. Assert that `reporting_cycles_completed` increments to 1 after the cycle. Assert that the cutover gate check returns false until `reporting_cycles_completed` ≥ 1 for all 14 report types.
**Pass condition:** Both system reports present; cycle counter increments; gate enforced.
**Fail condition:** Either system's report absent; counter not incremented; gate not enforced.

### T-RPT-003 — Side-by-side comparison report submission gate
**Story:** 1.2 AC4
**Type:** Integration
**Description:** Attempt to advance to cutover approval when the side-by-side comparison report has not been submitted. Assert that cutover approval is blocked. Submit the comparison report and confirm RBNZ Relationship Manager sign-off. Assert cutover approval unblocked.
**Pass condition:** Cutover blocked without comparison report submission; unblocked after sign-off.
**Fail condition:** Cutover advances without comparison report.

### T-RPT-004 — First CoreBanking-NXT regulatory return blocked until RBNZ written ack
**Story:** 1.2 AC5
**Type:** Integration
**Description:** Attempt to submit the first BS3 regulatory return from CoreBanking-NXT when `rbnz_sign_off_received` is false for any report type. Assert that submission is blocked. Set all 14 `rbnz_sign_off_received` to true. Assert submission proceeds.
**Pass condition:** First return submission blocked until all 14 sign-offs confirmed; succeeds when all confirmed.
**Fail condition:** Submission proceeds with any `rbnz_sign_off_received = false`.

### T-RPT-005 — Custom report escalation gate fires at 6-month milestone (H2 resolution)
**Story:** 1.2 (H2 resolution)
**Type:** Integration
**Description:** Set the 6-month milestone date to today (test). Assert that the system evaluates whether all 3 custom reports have `implementation_scope_confirmed: true`. With one unconfirmed, assert that an escalation record is created with type REPORTING_COMPLETENESS_RISK and status REQUIRES_CRO_NOTIFICATION. Assert that `reporting_completeness_confirmed` flag remains false. Assert that the cutover gate returns false while `reporting_completeness_confirmed` is false.
**Pass condition:** Escalation record created; `reporting_completeness_confirmed` remains false; cutover gate blocked.
**Fail condition:** No escalation triggered; cutover gate does not check `reporting_completeness_confirmed`.

---

## Section 4 — PPSR security registration tests

### T-PPSR-001 — PPSR disposition schedule gates migration commencement (H3 resolution)
**Story:** 2.2 AC1 (H3 resolution), 3.1 AC2
**Type:** Integration
**Description:** Attempt to commence the Weekend 1 staged migration when the PPSR disposition schedule status is PENDING (Legal Counsel sign-off not confirmed). Assert that the migration commencement is blocked. Set PPSR disposition schedule status to SIGNED_OFF (Legal Counsel confirmed). Assert migration commencement is accepted.
**Pass condition:** Migration blocked when PPSR disposition schedule not signed off; unblocked when signed off.
**Fail condition:** Migration commences without PPSR disposition schedule sign-off.

### T-PPSR-002 — Home loan with REQUIRES_LEGAL_ACTION classification cannot be migrated
**Story:** 3.1 AC3
**Type:** Integration
**Description:** Classify a test home loan account as `ppsr_status: REQUIRES_LEGAL_ACTION`. Attempt to include this account in a migration batch. Assert that the batch includes a pre-check that rejects the account. Assert that the account is placed on migration_hold status. Assert that the migration proceeds for all other accounts in the batch (isolation of held accounts).
**Pass condition:** REQUIRES_LEGAL_ACTION account rejected from batch; placed on hold; other accounts migrate normally.
**Fail condition:** REQUIRES_LEGAL_ACTION account included in migration batch; migration batch rejected entirely (should not be — only the held account should be excluded).

### T-PPSR-003 — Re-registration required accounts processed before cutover
**Story:** 3.1 AC3
**Type:** Integration
**Description:** Classify a test home loan account as `ppsr_status: REQUIRES_REREGISTRATION`. Attempt to cut over the account without confirming re-registration. Assert that the account is blocked from cutover. Confirm re-registration for the account. Assert that the account can now be cut over.
**Pass condition:** Account blocked from cutover without re-registration confirmation; unblocked when confirmed.
**Fail condition:** Account included in cutover without re-registration confirmed.

---

## Section 5 — Migration toolchain tests

### T-TOOL-001 — Pilot run passes reconciliation threshold
**Story:** 2.1 AC3
**Type:** Integration — pilot acceptance
**Description:** Execute a pilot migration of the 10,000-account representative sample (as defined in Story 2.1 AC2). After the pilot, check the reconciliation report: count `FAILED_DROPPED`, `FAILED_INTEGRITY`, and non-critical format-difference records. Assert: `FAILED_DROPPED` = 0, `FAILED_INTEGRITY` = 0, format-difference records ≤ 100 (0.1% of 10,000 accounts).
**Pass condition:** All three thresholds met.
**Fail condition:** Any dropped or corrupted records; format differences exceeding 0.1%.

### T-TOOL-002 — Performance benchmark validates 3-weekend cutover feasibility
**Story:** 2.1 AC4
**Type:** Performance test
**Description:** From the pilot timing data, extrapolate the estimated migration time for 280,000 accounts. Assert that the extrapolated time is ≤ 44.8 hours (56 hours available × 80% utilisation, allowing 20% contingency). If the extrapolated time exceeds the threshold, produce a migration phasing assessment report.
**Pass condition:** Extrapolated time ≤ 44.8 hours; benchmark report produced and archived.
**Fail condition:** Extrapolated time > 44.8 hours without a phasing assessment; benchmark report not produced.

### T-TOOL-003 — Vendor contract includes required data security obligations
**Story:** 2.1 AC1
**Type:** Compliance review (manual)
**Description:** Review the vendor migration toolset contract. Confirm presence of: (a) read-only JDBC access restriction; (b) NDA covering LoanLedger-NZ schema and customer data; (c) vendor data integrity warranty. Assert all three are present.
**Pass condition:** All three contract provisions confirmed present; Compliance Officer sign-off recorded.
**Fail condition:** Any provision absent; no Compliance Officer sign-off on record.

---

## Section 6 — NFR tests

### T-NFR-001 — Migration audit log queryable by account ID, batch ID, and timestamp
**Story:** 2.1 AC5, 2.2 AC5
**Type:** Performance / functional
**Description:** Populate the audit log with 1 million records (representative of full migration scope). Query by account_id (single record retrieval) — assert response time < 500ms. Query by batch_id (all records for a weekend batch, ~28,000 accounts) — assert response time < 5 seconds. Query by timestamp range (all records in a 4-hour window) — assert response time < 5 seconds.
**Pass condition:** All three query types meet response time thresholds.
**Fail condition:** Any query type exceeds threshold.

### T-NFR-002 — Migration audit log retained for CCCFA 7-year minimum
**Story:** 2.2 AC5
**Type:** Compliance / data lifecycle
**Description:** Assert that the audit log has a retention policy set with a minimum of 7 years from the migration date. Assert that a delete or archive operation on audit log records within 7 years is rejected.
**Pass condition:** 7-year retention policy confirmed; pre-7-year delete rejected.
**Fail condition:** No retention policy; delete within 7 years succeeds.

### T-NFR-003 — BS11 compliance dashboard renders all six s.4.3 checklist sections
**Story:** 1.1 AC5
**Type:** UI / integration
**Description:** Load the compliance dashboard with a submitted BS11 notification. Assert that all six sections per s.4.3 are displayed with their confirmation status: (a) project description and scope, (b) project timeline with milestones, (c) risk assessment, (d) governance approvals, (e) senior officer name and role, (f) RBNZ contact details. Assert that any section marked false renders with a visual warning indicator.
**Pass condition:** All six sections rendered; false sections show warning indicator.
**Fail condition:** Any section missing from dashboard; false section shows no warning.

---

## Section 7 — Decommission gate test

### T-DECOMM-001 — Full decommission gate requires all six conditions confirmed
**Story:** 3.1 AC4
**Type:** Integration
**Description:** Test the decommission gate with each of the six conditions unmet in turn. For each missing condition, assert that the decommission command is blocked. Then confirm all six conditions and assert that the decommission command succeeds.
**Pass condition:** Decommission blocked for each unmet condition individually; succeeds only when all six are confirmed.
**Fail condition:** Decommission proceeds with any condition unconfirmed.
**Adversarial case (T-DECOMM-001a):** Attempt to set `Story 2.2 12-month retention period complete` to true when the actual elapsed time is less than 12 months. Assert that the system calculates the retention period from the `final_cutover_date` field, not from a manually-set boolean, and rejects the bypass.

---

## Plain-language AC verification script (for human review / post-merge smoke test)

**Script purpose:** Manual checks to verify all five stories meet their ACs after implementation. Run before DoR sign-off and after deployment.

1. **Story 1.1 — BS11 notification tracking:**
   a. Navigate to the compliance dashboard. Confirm the BS11 notification record shows all fields listed in AC1.
   b. Check the development gate: attempt to open a Story 2.x sprint in the project governance tool without BS11 acknowledgement. Confirm the sprint creation is blocked.
   c. Confirm three supervisory meeting records exist (INITIATION, PARALLEL_OP_START, PRE_CUTOVER_30_DAYS) with PENDING status.
   d. Submit a test notification with one of the six s.4.3 sections missing. Confirm the system rejects it with a specific error.

2. **Story 1.2 — RBNZ report equivalence:**
   a. Check the per-report status table in the compliance dashboard. Confirm all 14 report types are listed.
   b. Confirm the 3 custom-development reports show `implementation_scope_confirmed: false` initially.
   c. Attempt to start parallel operation with a custom report unconfirmed. Confirm rejection.
   d. Confirm the parallel reporting cycle counter starts at 0 and the cutover gate is blocked.

3. **Story 2.1 — Migration toolchain:**
   a. Confirm the vendor contract is filed with all three required provisions (read-only JDBC, NDA, warranty).
   b. Check the pilot reconciliation report exists with FAILED_DROPPED = 0 and FAILED_INTEGRITY = 0.
   c. Confirm the performance benchmark report is present and states the projected migration time.

4. **Story 2.2 — Staged account migration:**
   a. Check the reconciliation baseline record exists before any weekend migration.
   b. For any test account: query the migration audit log by account ID. Confirm source fields, transformation, and target fields are all present.
   c. Confirm LoanLedger-NZ is accessible in read-only mode (returns data but rejects writes).
   d. Confirm the decommission gate returns false before 12 months post-cutover.

5. **Story 3.1 — PPSR and decommission:**
   a. Confirm the PPSR legal opinion document is filed and Legal Counsel sign-off recorded.
   b. Check the PPSR disposition schedule: confirm all 62,000 home loan accounts have a classification.
   c. Confirm that any account classified REQUIRES_LEGAL_ACTION cannot be added to a migration batch.
   d. Run the decommission gate check. Confirm it returns false if any of the six conditions is unmet.
