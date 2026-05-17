# Test Plan: Automated Regulatory Reporting Pipeline — RBNZ and FMA Return Automation

**Feature:** regulatory-reporting-pipeline-automation
**Review status:** Conditional pass (3 HIGH findings resolved inline — read from disk: `runs/config-A-S8/review.md`)
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Date:** 2026-05-17
**Run:** EXP-008 Config A S8

---

## Step 0 — Entry condition check (eval-mode)

- Definition artefact: ✅ read from disk (`runs/config-A-S8/definition.md`)
- Review artefact: ✅ read from disk (`runs/config-A-S8/review.md`) — conditional pass; 3 HIGH findings resolved inline in this test plan
- Context injection files: ✅ S8-ea-registry-regulatory-reporting-pipeline.md, S8-rbnz-fma-policy-doc.md — active
- Review H1 resolution: Story 2.3 abort-pathway audit completeness — operationalised in T-NORM-005 and T-NORM-006
- Review H2 resolution: Story 1.1 BS11 business-day calculation — operationalised in T-REG-003 and T-REG-004
- Review H3 resolution: Story 3.2 pre-launch producibility drill operational workflow — operationalised in T-AUDIT-007 and documented in Output 2 (AC verification script)

---

## Test scope

**Stories in scope:** 8 stories (2 Epic 1 compliance gate stories; 4 Epic 2 pipeline core stories; 2 Epic 3 analyst workflow and audit stories)
**Stories out of scope:** None — Epic 1 compliance gate stories require document-presence and gate-enforcement tests; they are not skippable.
**TDD discipline:** All tests written to fail first. No production code may be implemented for any story until the corresponding test file exists and is confirmed failing.

---

## Output 1 — Technical test plan (for coding agent / CI)

### Module 1 — Regulatory compliance gate tests (Epic 1: Stories 1.1 and 1.2)

These stories are governance/legal delivery items, not engineering implementations. The test suite verifies that compliance evidence records are present and correctly formed, and that technical enforcement gates are operational, before any dependent engineering story can be activated in production.

---

#### T-REG-001: Story 1.1 — RBNZ s.2.1 methodology notification document present and complete

```
Test file: tests/compliance-gates/rbnz-methodology-notification.test.js
Type: Integration (compliance document store check)
Story: 1.1
Constraint: C1

Given: The delivery has reached the RBNZ notification compliance gate checkpoint
When: The test suite is run
Then:
  - A document with type "rbnz-s2.1-methodology-notification" exists in the compliance document store (SharePoint Finance Compliance folder reference or equivalent)
  - The document has fields: { submission_date (ISO 8601), submitted_to: "RBNZ Prudential Reporting Team", status: "submitted", returns_affected: includes(["BS2","BS3","BS7"]), normalisation_disclosed: true }
  - The document is not in draft or pending status
  - The document references a self-disclosure field: { historical_unapproved_normalisation: true, period_of_unapproved_application: not null }

Fail condition (RED state): Document does not exist, or status !== "submitted", or normalisation_disclosed !== true, or historical_unapproved_normalisation !== true.
```

#### T-REG-002: Story 1.1 — RBNZ written acknowledgement document present

```
Test file: tests/compliance-gates/rbnz-methodology-notification.test.js
Type: Integration (compliance document store check)
Story: 1.1
Constraint: C1

Given: The RBNZ s.2.1 notification has been submitted (T-REG-001 passes)
When: The test suite is run at the go-live gate check
Then:
  - A document with type "rbnz-methodology-acknowledgement" exists in the compliance document store
  - The document has fields: { received_date (ISO 8601), rbnz_response_type: one of ["acknowledgement", "methodology-review-initiated"], filed_by: compliance officer identity }
  - If rbnz_response_type is "methodology-review-initiated", the go-live gate flag PIPELINE_GO_LIVE_APPROVED must be false — an automated assertion verifies this.

Fail condition: Acknowledgement document absent, or response type is "methodology-review-initiated" but PIPELINE_GO_LIVE_APPROVED is set to true.
```

#### T-REG-003: Story 1.1 — BS11 notification filed; deployment gate enforces business-day minimum

```
Test file: tests/compliance-gates/bs11-notification-gate.test.js
Type: Unit + Integration
Story: 1.1
Constraint: C1 (BS11)
Review finding: H2 (business-day calculation)

Given: The BS11_NOTIFICATION_DATE field is set in the deployment configuration
When: The CI/CD pre-deployment gate runs
Then:
  - The gate calculates elapsed business days (Monday–Friday, excluding New Zealand public holidays per the Holidays Act 2003 Schedule 1) between BS11_NOTIFICATION_DATE and the current deployment date
  - If elapsed business days < 30: the deployment is BLOCKED with an error message stating the earliest allowable deployment date (BS11_NOTIFICATION_DATE + 30 business days)
  - If elapsed business days ≥ 30: the gate passes

Fail condition (RED state): Gate passes when fewer than 30 business days have elapsed (calendar-day-only check defect); or gate fails to account for a public holiday in the 30-day window.
```

#### T-REG-004: Story 1.1 — BS11 business-day calculation — public holiday scenarios

```
Test file: tests/compliance-gates/bs11-notification-gate.test.js
Type: Unit
Story: 1.1
Constraint: C1 (BS11)
Review finding: H2

Given: Three test scenarios with known NZ public holiday dates in the window
When: The business-day gate calculation runs
Then:
  - Scenario A: 30-day window with no public holidays → gate passes at exactly 30 business days elapsed
  - Scenario B: 30-day window spanning Waitangi Day (February 6) → gate requires 31 calendar days to accumulate 30 business days; gate blocks at calendar day 30 but passes at calendar day 31
  - Scenario C: 25 business days elapsed (less than 30) → gate blocks; error message includes correct earliest allowable date

Fail condition: Any scenario produces incorrect pass/block result; error message omits or miscalculates the earliest allowable date.
```

#### T-REG-005: Story 1.2 — Normalisation logic specification document present and complete

```
Test file: tests/compliance-gates/normalisation-governance-gate.test.js
Type: Integration (compliance document store check)
Story: 1.2
Constraint: C5

Given: The normalisation governance review is complete
When: The test suite is run
Then:
  - A document with type "normalisation-logic-specification" exists in the compliance document store
  - The document has fields: { version: matches("normalisation-rules-v\d+\.\d+\.\d+"), authored_by (not null), specification_date (ISO 8601), field_inventory: array with length > 0, each_entry_has: ["source_system", "field_name", "input_condition", "transformation_rule", "output_effect", "rationale"] }
  - The specification version matches the version tag present in the engineering repository

Fail condition: Document absent; version field absent or does not match repository tag; field_inventory empty or entries missing required fields.
```

#### T-REG-006: Story 1.2 — Independent review report present and signed

```
Test file: tests/compliance-gates/normalisation-governance-gate.test.js
Type: Integration (compliance document store check)
Story: 1.2
Constraint: C5

Given: The normalisation logic specification document is present (T-REG-005 passes)
When: The test suite is run
Then:
  - A document with type "normalisation-logic-independent-review" exists
  - The document has fields: { reviewer_name (not null), reviewer_role (not null), review_date (ISO 8601), reviewed_version (matches normalisation-rules version in T-REG-005), conclusion: one of ["approved", "approved-with-conditions", "rejected"], logic_accurate: boolean, arithmetic_correct: boolean, limitations_documented: boolean }
  - reviewer_name is different from the author named in the normalisation-logic-specification document
  - conclusion is "approved" or "approved-with-conditions"

Fail condition: Independent review absent; reviewer is the same person as the specification author; conclusion is "rejected"; required fields absent.
```

#### T-REG-007: Story 1.2 — Governance sign-off document present; NORMALISATION_LAYER_APPROVED flag link verifiable

```
Test file: tests/compliance-gates/normalisation-governance-gate.test.js
Type: Integration
Story: 1.2
Constraint: C5

Given: Independent review is complete and approved (T-REG-006 passes)
When: The test suite is run
Then:
  - A document with type "normalisation-governance-signoff" exists with fields: { finance_ops_manager_signoff: { name, date (ISO 8601) }, compliance_officer_signoff: { name, date (ISO 8601) }, approved_version: matches normalisation-rules version tag }
  - The production deployment configuration contains NORMALISATION_LAYER_APPROVED field
  - The deployment configuration also contains fields { independent_review_doc_id (not null), governance_signoff_doc_id (not null) } referencing the SharePoint document IDs of the T-REG-006 and this sign-off document respectively

Fail condition: Sign-off document absent; either signoff name or date is null; deployment configuration missing document ID references.
```

---

### Module 2 — Source extraction tests (Epic 2: Stories 2.1 and 2.2)

#### T-EXTR-001: Story 2.1 — CoreBanking-GL extraction produces complete source data log entry

```
Test file: tests/extraction/source-data-log.test.js
Type: Integration (with stubbed CoreBanking-GL API)
Story: 2.1
Constraint: C2

Given: A pipeline run is initiated for a test return period
When: The CoreBanking-GL extraction step completes
Then:
  - The audit log contains a source data log entry with all required fields: source_system="RRPL-UP-001", api_version (not null), extraction_timestamp (ISO 8601 with timezone), reporting_period_start (date), reporting_period_end (date), fields_extracted (array, length > 0), payload_hash (SHA-256 format), extraction_query_params (not null — includes endpoint, date range, field selection)
  - The log entry is written before any transformation step record appears in the audit log for the same run ID

Fail condition: Audit log entry absent; any required field is null; entry is written after a transformation log entry for the same run.
```

#### T-EXTR-002: Story 2.1 — Write-scope API call rejected; no write-back possible

```
Test file: tests/extraction/read-only-enforcement.test.js
Type: Integration
Story: 2.1
Constraint: C2 (data integrity)

Given: The extraction service account is configured
When: A write-scope API call (e.g., POST, PUT, DELETE) is attempted against CoreBanking-GL (RRPL-UP-001)
Then: The API returns a 403 Forbidden response; the extraction module logs the rejection; no write operation succeeds

Fail condition: Write-scope API call succeeds; or write-scope token is included in the service account configuration.
```

#### T-EXTR-003: Story 2.1 — Missing mandatory field causes pipeline abort before transformation

```
Test file: tests/extraction/field-completeness-validation.test.js
Type: Unit
Story: 2.1
Constraint: C2

Given: The CoreBanking-GL API returns a response missing one or more mandatory BS2 fields
When: Field completeness validation runs
Then:
  - The pipeline fails with a structured error message identifying the specific missing fields and the return form affected (e.g., "BS2 field [field_name] missing from RRPL-UP-001 extraction")
  - The transformation step does not execute
  - An audit log entry records the failure with run ID, failure type, and missing field list

Fail condition: Pipeline proceeds to transformation with incomplete source data; error message omits field names or return form; no audit log failure entry.
```

#### T-EXTR-004: Story 2.2 — Treasury CSV schema validation rejects out-of-schema files

```
Test file: tests/extraction/treasury-csv-ingestion.test.js
Type: Unit
Story: 2.2
Constraint: C2

Given: A treasury CSV file with a missing mandatory column is submitted for ingestion
When: Schema validation runs at ingestion time
Then:
  - The file is rejected with a structured error message identifying the specific missing column
  - No audit log ingestion record is created for the rejected file
  - The pipeline does not proceed to the transformation step

Fail condition: Out-of-schema file is ingested; audit log entry created for invalid file; pipeline proceeds to transformation.
```

#### T-EXTR-005: Story 2.2 — Treasury ingestion requires confirmation artefact reference; ingestion blocked without it

```
Test file: tests/extraction/treasury-csv-ingestion.test.js
Type: Integration
Story: 2.2
Constraint: C2 (audit trail completeness)
Review finding: M2 (treasury confirmation artefact)

Given: A valid treasury CSV file is submitted without a confirmation artefact reference (Jira task ID or SharePoint document ID in approved status)
When: The ingestion gate checks for a confirmation artefact
Then:
  - Ingestion is rejected with an error: "treasury CSV ingestion requires a confirmed approval artefact reference in approved status"
  - No audit log ingestion record is created

Given: A valid CSV is submitted with a Jira task ID in "Approved" status
When: The ingestion gate checks for the confirmation artefact
Then:
  - Ingestion proceeds
  - The audit log ingestion record contains the confirmation_artefact_reference field set to the Jira task ID

Fail condition: Ingestion proceeds without a confirmation artefact; or ingestion accepts a Jira task in "In Progress" status.
```

---

### Module 3 — Normalisation transformation engine tests (Epic 2: Story 2.3)

#### T-NORM-001: Story 2.3 — Normalisation applied correctly for each rule type; transformation log complete

```
Test file: tests/transformation/normalisation-engine.test.js
Type: Unit
Story: 2.3
Constraint: C2 (transformation log)

Given: A simulated source data payload with fields requiring normalisation per normalisation-rules-v1.0.0
When: The transformation engine processes the payload with NORMALISATION_LAYER_APPROVED=true
Then:
  - For each normalised field, the post-normalisation output matches the expected value defined in the normalisation rule specification
  - The audit log transformation log entry for each field contains: field_name, source_value, rule_id, rule_version="normalisation-rules-v1.0.0", logic_description (not null and not empty), approver_name (from governance sign-off document), output_value, pipeline_run_id, timestamp (ISO 8601 with timezone)
  - No normalisation step produces an audit log entry with any null required field

Fail condition: Normalised output value differs from expected; any transformation log entry is missing required fields.
```

#### T-NORM-002: Story 2.3 — NORMALISATION_LAYER_APPROVED=false → abort; no return file generated; alert sent

```
Test file: tests/transformation/normalisation-engine.test.js
Type: Integration
Story: 2.3
Constraint: C1, C5
Review finding: H1

Given: NORMALISATION_LAYER_APPROVED is set to false in the deployment configuration
When: A pipeline run is initiated
Then:
  - The transformation engine logs a normalisation_skipped_abort entry in the audit log with: status="aborted", flag_state="false", pipeline_run_id, timestamp
  - The pipeline run halts — the return file generation step (Story 2.4) does NOT execute
  - No file exists in the SharePoint staging area with the aborted run's pipeline_run_id
  - An automated alert is sent to the finance operations manager with message identifying the reason (NORMALISATION_LAYER_APPROVED flag not set)
  - The audit log does NOT contain a run_complete entry for this run ID

Fail condition: Pipeline proceeds to return file generation after flag=false detection; or a file exists in SharePoint staging for the aborted run; or the audit log contains a run_complete entry for an aborted run.
```

#### T-NORM-003: Story 2.3 — Transformation log write failure → pipeline run aborts; no partial return file

```
Test file: tests/transformation/normalisation-engine.test.js
Type: Integration (with simulated audit log write failure)
Story: 2.3
Constraint: C2

Given: The audit log write fails during a normalisation step (simulated database error)
When: The transformation engine attempts to log the transformation step
Then:
  - The pipeline run aborts immediately
  - No partial return file is staged in SharePoint
  - An error record is written to a separate operations log (not the immutable audit log — which is unavailable) identifying the failure type and run ID

Fail condition: Pipeline proceeds past the logging failure; partial return file is staged; or the failure is silently swallowed.
```

#### T-NORM-004: Story 2.3 — Rule version mismatch (config references unapproved version) → pipeline fails explicitly

```
Test file: tests/transformation/normalisation-engine.test.js
Type: Unit
Story: 2.3
Constraint: C1, C5

Given: The transformation engine configuration references rule version "normalisation-rules-v2.0.0" which does not exist in the version-tagged repository
When: The transformation engine initialises
Then:
  - The pipeline fails immediately with an error identifying the mismatched version: "transformation engine config references normalisation-rules-v2.0.0 which is not present in the approved version list"
  - No extraction, transformation, or return file generation steps execute

Fail condition: Pipeline proceeds with an unrecognised rule version; or error message does not identify the specific version mismatch.
```

#### T-NORM-005: Story 2.3 — Post-abort verification: no staged file; abort entry in audit log

```
Test file: tests/transformation/normalisation-engine.test.js
Type: Integration
Story: 2.3
Constraint: C1, C5
Review finding: H1 (additional test coverage)

Given: A flag=false abort has occurred (T-NORM-002 scenario)
When: Post-abort verification queries SharePoint staging and the audit log
Then:
  - No file with the aborted run's pipeline_run_id exists in the SharePoint staging area
  - The audit log contains exactly one entry for the aborted run ID: the normalisation_skipped_abort entry
  - The audit log does not contain a source_data_log entry, a transformation_log entry, or a run_complete entry for the aborted run ID

Fail condition: Any file with the aborted run ID found in SharePoint; more than one audit log entry for the aborted run; audit log contains a run_complete entry for the aborted run.
```

#### T-NORM-006: Story 2.3 — Every normalisation step in a run has a corresponding audit log entry; no orphaned steps

```
Test file: tests/transformation/normalisation-engine.test.js
Type: Integration
Story: 2.3
Constraint: C2

Given: A complete pipeline run with 12 normalisation steps applied (test dataset with known step count)
When: The run completes and the audit log is queried for the run ID
Then:
  - The audit log contains exactly 12 transformation_log entries for the run ID
  - Each entry has a unique field_name and timestamp
  - No normalisation step produces more than one audit log entry for the same run ID and field_name

Fail condition: Audit log contains fewer than 12 transformation entries; any step is missing; any step produces a duplicate entry.
```

---

### Module 4 — Return file generation tests (Epic 2: Story 2.4)

#### T-RETFILE-001: Story 2.4 — Generated return file passes RBNZ format validation

```
Test file: tests/return-file/format-validation.test.js
Type: Unit + Integration
Story: 2.4
Constraint: C1
Review finding: M1

Given: A complete pipeline run produces a BS2 return file
When: RBNZ format validation runs against the stored format specification (version-controlled in repository)
Then:
  - All mandatory fields are present in the correct order
  - All field types match the specification
  - No mandatory field is null or empty
  - The validation result is logged with the format specification version used

Fail condition: A format-invalid return file is staged for analyst review; validation result not logged; format specification version not recorded.
```

#### T-RETFILE-002: Story 2.4 — Return file contains audit trail linkage fields

```
Test file: tests/return-file/audit-trail-linkage.test.js
Type: Unit
Story: 2.4
Constraint: C2

Given: A complete pipeline run produces a pre-populated return file
When: The return file metadata is inspected
Then:
  - The return file cover page contains: return_type, reporting_period, pipeline_run_id, audit_log_run_id
  - The audit_log_run_id resolves to a valid audit log entry in the audit log for the same run
  - The pipeline_run_id is included in the file name per the naming convention (Story 2.4 AC4)

Fail condition: Return file missing audit trail linkage fields; audit_log_run_id does not resolve to a valid audit log entry.
```

#### T-RETFILE-003: Story 2.4 — Pipeline blocks return file generation when upstream validation has failed

```
Test file: tests/return-file/upstream-failure-gate.test.js
Type: Integration
Story: 2.4
Constraint: C2

Given: An upstream extraction failure is recorded in the audit log for the current run (T-EXTR-003 scenario)
When: The return file generation step is invoked
Then:
  - Return file generation aborts immediately
  - No file is staged in SharePoint
  - The abort is recorded in the operations log with the upstream failure reference

Fail condition: Return file is generated despite an upstream failure record; partial or untraceable file staged in SharePoint.
```

---

### Module 5 — Analyst workflow and submission tests (Epic 3: Story 3.1)

#### T-WF-001: Story 3.1 — Submission gateway blocked when sign-off record absent

```
Test file: tests/workflow/submission-gate.test.js
Type: Integration
Story: 3.1
Constraint: C3

Given: A pre-populated return file is staged in SharePoint but no sign-off record exists in the audit log for the relevant return period
When: The submission gateway integration (RRPL-DN-001) is invoked
Then:
  - The submission call is blocked with an error: "submission blocked — no sign-off record found for return period [period]"
  - No HTTP request is sent to the RBNZ Reporting Portal or FMA Submission Gateway
  - The blocked attempt is recorded in the operations log

Fail condition: Submission proceeds without a sign-off record; any HTTP request reaches the gateway endpoint.
```

#### T-WF-002: Story 3.1 — Sign-off record present → submission proceeds; post-submission audit log entry created

```
Test file: tests/workflow/submission-gate.test.js
Type: Integration
Story: 3.1
Constraint: C2, C3

Given: A completed sign-off record exists in the audit log for the return period
When: The submission gateway integration runs
Then:
  - The submission request is sent to the correct gateway endpoint (RRPL-DN-001 for RBNZ, RRPL-DN-002 for FMA)
  - The audit log receives a submission_confirmation entry with: submission_timestamp (ISO 8601), submission_reference_number (from gateway response), return_period, return_type, submitting_user_identity

Fail condition: Submission proceeds but no post-submission audit log entry is written; or submission_reference_number is null.
```

#### T-WF-003: Story 3.1 — Analyst amendment record written to audit log; amendment fields complete

```
Test file: tests/workflow/analyst-amendment-log.test.js
Type: Integration
Story: 3.1
Constraint: C2

Given: An analyst makes a manual amendment to a field in the pre-populated return
When: The amendment is recorded
Then:
  - The audit log receives an analyst_amendment entry with: field_name, pre_amendment_value, amendment_value, amendment_rationale (not null), analyst_identity, amendment_timestamp (ISO 8601)
  - The amendment rationale field must not be empty — an amendment with an empty rationale is rejected

Fail condition: Amendment proceeds without writing an audit log entry; amendment_rationale is null or empty; analyst_identity is null.
```

---

### Module 6 — Audit log integrity and producibility tests (Epic 3: Story 3.2)

#### T-AUDIT-001: Story 3.2 — Audit log write-once: UPDATE and DELETE rejected for pipeline service account

```
Test file: tests/audit-log/immutability.test.js
Type: Integration (database-level)
Story: 3.2
Constraint: C2

Given: An audit log entry has been committed to the PostgreSQL audit log table
When: An UPDATE or DELETE SQL statement is executed using the pipeline service account
Then:
  - The database rejects the statement with a permission denied error
  - The audit log entry remains unchanged
  - The rejection is logged in the operations log

Fail condition: UPDATE or DELETE succeeds using the pipeline service account; audit log entry is modified or deleted.
```

#### T-AUDIT-002: Story 3.2 — Complete pipeline run produces all five audit log component types

```
Test file: tests/audit-log/completeness.test.js
Type: Integration
Story: 3.2
Constraint: C2

Given: A complete end-to-end pipeline run for a test return period (extraction → normalisation → return file → sign-off → submission)
When: The audit log is queried for the test run ID
Then:
  - source_data_log entries exist for all source systems (CoreBanking-GL, CardPlatform, TreasuryLedger-manual-extract) — 3 entries
  - transformation_log entries exist for all normalised fields (count matches normalisation step count for the test dataset)
  - analyst_amendment_log entries exist (nil-amendment record if no amendments were made)
  - sign_off_record entry exists with complete fields (approver name, approval date, return period)
  - submission_confirmation entry exists with all required fields

Fail condition: Any of the five component types is missing; nil-amendment record not created when no amendments are made.
```

#### T-AUDIT-003: Story 3.2 — Audit log export function produces all five component types within 60 seconds

```
Test file: tests/audit-log/export-performance.test.js
Type: Integration (performance)
Story: 3.2
Constraint: C2

Given: The audit log contains 7 years of historical data (simulated dataset for the test environment)
When: The export function is called for a specific return period
Then:
  - The export completes in ≤60 seconds (measured from function invocation to export file ready)
  - The exported file contains all five audit log component types for the specified return period
  - All required fields per each component type are present in the export

Fail condition: Export takes more than 60 seconds; any component type absent from export; any required field null in export.
```

#### T-AUDIT-004: Story 3.2 — 7-year retention policy configured; records not auto-deleted without authorisation

```
Test file: tests/audit-log/retention-policy.test.js
Type: Integration (database-level)
Story: 3.2
Constraint: C2

Given: The audit log contains a record dated more than 7 years ago (simulated)
When: The automated retention check runs
Then:
  - The record is flagged for compliance review (status set to "retention-review-required")
  - The record is NOT deleted by any automated process
  - A notification is sent to the compliance officer identifying the record and its age

Fail condition: Record is automatically deleted without compliance officer authorisation; or no retention flag is set.
```

#### T-AUDIT-005: Story 3.2 — Audit log export is machine-readable (CSV and JSON formats supported)

```
Test file: tests/audit-log/export-formats.test.js
Type: Unit
Story: 3.2
Constraint: C2 (FMA machine-readable requirement per s.2.2)

Given: A complete audit trail exists for a test return period
When: The export function is called with format=CSV and format=JSON respectively
Then:
  - Both exports are valid, parseable files in their respective formats
  - Both exports contain identical data (field values match between CSV and JSON exports for the same return period)
  - The JSON export validates against the audit log export schema

Fail condition: Either format produces a parse error; CSV and JSON exports contain different data; JSON export fails schema validation.
```

#### T-AUDIT-006: Story 3.2 — 20th-of-month deadline alert sent when T minus 2 business days and no sign-off

```
Test file: tests/workflow/deadline-alert.test.js
Type: Unit (with date stubbing)
Story: 3.1 (operationalised in Story 3.2 NFR context)
Constraint: C1 (submission deadline enforcement)

Given: The current date is stubbed to T minus 2 business days before the 20th of the month
And: No sign-off record exists in the audit log for the current month's return
When: The deadline monitoring job runs
Then:
  - An alert email is sent to the finance operations manager and designated finance officer
  - The alert identifies the return type, the return period, the deadline date, and the absence of sign-off
  - The alert configurable threshold (default T minus 2 business days) is read from configuration, not hardcoded

Fail condition: Alert not sent when T minus 2 with no sign-off; alert threshold is hardcoded.
```

#### T-AUDIT-007: Story 3.2 — Pre-launch producibility drill workflow validated in UAT

```
Test file: tests/audit-log/producibility-drill.test.js (acceptance test — run in UAT environment)
Type: Acceptance (human-in-the-loop — must be conducted by compliance officer)
Story: 3.2
Constraint: C2
Review finding: H3

Given: The UAT environment has a simulated return period dataset with a complete 5-component audit trail
And: The compliance officer issues a written simulated FMA request specifying the return period and a specific figure to verify
When: The finance operations team uses the audit log export function to produce the complete audit trail for the specified period
Then:
  - All five audit log components are present in the export
  - The compliance officer confirms the export is complete, legible, and sufficient to independently verify the specified figure
  - The elapsed time from the simulated request to compliance officer confirmation is ≤5 business days (measured in the drill)
  - The compliance officer signs a drill completion record identifying: drill date, return period tested, elapsed time, and confirmation outcome

Fail condition: Export is incomplete (missing a component type); elapsed time exceeds 5 business days; compliance officer cannot independently verify the specified figure from the export; drill completion record not produced.

NOTE: This is a human-in-the-loop acceptance test. It cannot be automated. It must be executed and the compliance officer sign-off record produced before the go-live gate is cleared. The CI/CD go-live gate checks for the presence of a "producibility-drill-signoff" document in the compliance document store (parallel to the governance gate checks in Module 1).
```

---

## Non-functional requirements (NFRs)

All NFRs below are concrete, testable assertions. "Must be performant" or "must be secure" are not NFRs — each item below has a measurable threshold or named standard.

| NFR ID | Requirement | Threshold / Standard | Test |
|--------|------------|---------------------|------|
| NFR-C1-01 | RBNZ submission deadline compliance | Return submitted by 20th calendar day of following month for every monthly cycle | T-AUDIT-006 (alert trigger); T-WF-002 (submission gateway) |
| NFR-C1-02 | BS11 technology change notification timing | Notification filed ≥30 business days before production go-live (business days counted per Holidays Act 2003 Schedule 1) | T-REG-003, T-REG-004 |
| NFR-C1-03 | RBNZ s.2.1 methodology notification | Submitted and acknowledged before normalisation layer processes any live return | T-REG-001, T-REG-002 |
| NFR-C2-01 | FMA audit trail producibility | Complete audit trail for any return in preceding 7 years produced within 5 business days of written request | T-AUDIT-007 (drill) |
| NFR-C2-02 | Audit log export performance | Export for a single return period completes in ≤60 seconds with 7-year data volume present | T-AUDIT-003 |
| NFR-C2-03 | Audit log retention | Records retained for ≥7 years from submission date; no automated deletion without Compliance Officer authorisation | T-AUDIT-004 |
| NFR-C2-04 | Audit log immutability | No UPDATE or DELETE on committed audit log records by pipeline service account | T-AUDIT-001 |
| NFR-C2-05 | Transformation log completeness | Every normalisation step in a pipeline run has a corresponding audit log entry with all required fields (rule ID, rule version, logic, approver, input/output, timestamp) | T-NORM-001, T-NORM-006 |
| NFR-C2-06 | Audit log machine-readable formats | Export produces valid CSV and JSON — both parseable, both complete | T-AUDIT-005 |
| NFR-C3-01 | Human sign-off mandatory | No return dispatched to RBNZ or FMA without a completed sign-off record in the audit log | T-WF-001, T-WF-002 |
| NFR-C5-01 | Normalisation governance gate enforcement | Pipeline aborts before return file generation when NORMALISATION_LAYER_APPROVED=false; no partial file staged | T-NORM-002, T-NORM-005 |
| NFR-C5-02 | Normalisation rule versioning | Every transformation log entry references the approved normalisation-rules version tag; rule version mismatch causes pipeline abort with explicit error | T-NORM-001, T-NORM-004 |
| NFR-SEC-01 | Read-only source system access | No write-scope API calls to any source system (CoreBanking-GL, CardPlatform); service account tokens are read-only | T-EXTR-002 |
| NFR-PERF-01 | Extraction retry cap | Extraction retries capped at 3 attempts; maximum retry delay ≤60 seconds (exponential backoff); failure produces structured alert within 5 minutes of 3rd failure | T-EXTR-003 (implicit); integration test required |

---

## Output 2 — AC verification script (plain language, human review / smoke test)

This script is for the compliance officer and finance operations manager to verify regulated ACs before go-live and after each major deployment.

---

**Step 1 — Verify RBNZ methodology notification (C1)**
1. Open Finance Compliance SharePoint folder. Confirm document "rbnz-s2.1-methodology-notification" is present and has status "submitted" (not draft).
2. Confirm the document lists all three return series (BS2, BS3, BS7) and declares the historical unapproved normalisation period (2019 to date of notification).
3. Confirm a response document from RBNZ is present and has response type "acknowledgement" (not "methodology-review-initiated"). If RBNZ has initiated a methodology review, confirm PIPELINE_GO_LIVE_APPROVED is set to false in the deployment configuration.
4. Confirm the BS11 notification document is present. Calculate business days between the BS11 notification date and today (using business-day calendar including NZ public holidays). Confirm ≥30 business days have elapsed.

**Step 2 — Verify normalisation governance gate (C5)**
1. Confirm "normalisation-logic-specification" document is present in Finance Compliance SharePoint, is version-tagged, and was authored by the original Excel macro author.
2. Confirm "normalisation-logic-independent-review" is present, reviewer name is different from specification author, and conclusion is "approved" or "approved-with-conditions."
3. Confirm "normalisation-governance-signoff" is present with both Finance Operations Manager and Compliance Officer sign-off dates populated.
4. Confirm production deployment configuration has NORMALISATION_LAYER_APPROVED=true, independent_review_doc_id (not null), and governance_signoff_doc_id (not null).

**Step 3 — Verify pre-launch producibility drill (C2)**
1. Confirm "producibility-drill-signoff" document is present in Finance Compliance SharePoint.
2. Confirm the document records: drill date, return period tested, all five audit log component types confirmed present, elapsed time ≤5 business days, compliance officer signature.
3. If any component was missing or elapsed time exceeded 5 business days in the drill, confirm a remediation record is present before go-live.

**Step 4 — Verify human sign-off gate (C3)**
1. In a test environment, initiate a return submission without a sign-off record for the return period. Confirm the submission is blocked with the expected error message.
2. Add a sign-off record. Confirm the submission proceeds and a submission_confirmation entry appears in the audit log.

**Step 5 — Verify 20th-of-month deadline alert (C1)**
1. Confirm the DEADLINE_ALERT_THRESHOLD_BUSINESS_DAYS configuration field is present (default: 2).
2. Confirm the alert notification list includes the finance operations manager and designated finance officer.
3. In a test environment with a stubbed date at T minus 2 and no sign-off record: confirm the alert fires with the correct return period, deadline date, and absence-of-sign-off message.

---

<!-- CPF-TRACE
stage: /test-plan
model: claude-sonnet-4-6
config: A

constraints_tested:
- C1 (RBNZ methodology/BS11): T-REG-001 (s.2.1 notification document), T-REG-002 (RBNZ acknowledgement + go-live gate), T-REG-003 (BS11 CI/CD gate — business-day calculation), T-REG-004 (BS11 business-day public holiday scenarios), T-RETFILE-001 (prescribed format compliance), T-AUDIT-006 (20th-of-month deadline alert), NFR-C1-01/02/03
- C2 (FMA audit trail + producibility + retention): T-EXTR-001 (source data log), T-EXTR-004/005 (treasury ingestion audit record), T-NORM-001 (transformation log completeness per step), T-NORM-006 (all steps logged), T-NORM-003 (log write failure → abort), T-AUDIT-001 (immutability), T-AUDIT-002 (all five component types), T-AUDIT-003 (export ≤60s), T-AUDIT-004 (7-year retention), T-AUDIT-005 (machine-readable formats), T-AUDIT-007 (pre-launch drill — H3 resolution), T-WF-003 (amendment record), NFR-C2-01/02/03/04/05/06
- C3 (human sign-off mandatory): T-WF-001 (submission blocked without sign-off), T-WF-002 (submission proceeds with sign-off → post-submission audit entry), NFR-C3-01
- C4 (normalisation = figure-derivation change): T-REG-001 (s.2.1 notification covers normalisation as methodology adjustment), T-NORM-002 (flag=false → abort; normalisation not applied without approved methodology)
- C5 (normalisation governance gap): T-REG-005 (specification document), T-REG-006 (independent review), T-REG-007 (governance sign-off + deployment config document IDs), T-NORM-002/005 (abort-before-file; no staged file after abort — H1 resolution), T-NORM-004 (rule version mismatch abort), NFR-C5-01/02

review_HIGH_resolutions:
- H1 (abort-pathway audit completeness): T-NORM-005 (post-abort no-file verification + audit log status check — additional test beyond T-NORM-002)
- H2 (BS11 business-day calculation): T-REG-003 (business-day gate calculation), T-REG-004 (public holiday scenarios); NFR-C1-02 updated to specify Holidays Act 2003 Schedule 1
- H3 (pre-launch drill operational workflow): T-AUDIT-007 (human-in-the-loop acceptance test with compliance officer sign-off; drill completion record required for go-live gate)

all_constraints_have_named_tests: true
nfr_specificity: all NFRs are concrete thresholds or named standards — no generic statements
-->
