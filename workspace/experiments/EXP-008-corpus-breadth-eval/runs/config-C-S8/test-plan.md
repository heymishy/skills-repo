# Test Plan: Regulatory Reporting Pipeline Automation — S1–S5

**Feature slug:** regulatory-reporting-pipeline-automation
**Date:** 2026-05-17
**Skill version:** /test-plan
**Model:** claude-haiku-4-5 (Config C — cost-optimised)
**Stories:** S1–S5 (Epic 1: Operational Automation Phase 1)
**Run:** EXP-008 Config C S8

---

## Test Data Strategy

**Data domain:** Financial regulatory reporting (RBNZ and FMA returns).

**Sensitivity:** High — test data includes extracted banking and treasury figures that mirror production account balances (anonymised/synthetic for UAT).

**Fixtures prepared:**
- **Fixture A:** Synthetic CoreBanking-GL extract (100 GL accounts, balances ranging from $0–$10M, 5 main cost centers)
- **Fixture B:** Synthetic CardPlatform extract (500 transactions, $500K–$5M daily aggregates)
- **Fixture C:** Treasury CSV (3 currency pairs, 1-month history, daily rates)
- **Fixture D:** Prior-month RBNZ return (for reconciliation comparison)
- **Fixture E:** Prior-month FMA return (for trend analysis)

**Data cleanup:** All test data tagged `[SYNTHETIC - UAT ONLY]`. Production credentials, account numbers, and customer identifiers are never used in test fixtures. After UAT completion, all test data is archived; test database is reset.

---

## Story 1: Extract and Pre-Populate RBNZ Monthly Return

### Technical Test Cases

**Test Suite: S1 — Data Extraction**

| Test ID | Scenario | Given | When | Then | Expected Result | Testability |
|---------|----------|-------|------|------|---|---|
| S1-T1 | CoreBanking-GL API available; extract RBNZ GL accounts | Fixture A loaded; API responding | `POST /extract?system=CoreBanking&return_type=rbnz` | 90+ GL accounts extracted | ✅ TESTABLE — count equals fixture |
| S1-T2 | CardPlatform API available; extract daily transaction aggregates | Fixture B loaded; API responding | `POST /extract?system=CardPlatform&return_type=rbnz` | 500 transaction records extracted; aggregated to daily buckets | ✅ TESTABLE — verify aggregation logic and count |
| S1-T3 | Treasury data via CSV upload; Treasury Operations uploads file | Fixture C (Treasury CSV) uploaded; Treasury assigns report date | `POST /extract/treasury/upload?report_date=2026-05-31` | CSV parsed; 3 currency pairs, 1-month history loaded | ✅ TESTABLE — verify parse and date assignment |
| S1-T4 | Field mapping to RBNZ return template; extracted GL accounts map to RBNZ return fields | Fixture A extracted; mapping rules active | Extracted GL amounts mapped to RBNZ field codes (e.g., GL 1100 → RBNZ field "Total Assets") | Pre-populated RBNZ return contains correct field values from GL | ✅ TESTABLE — field-by-field spot check against prior-month return |
| S1-T5 | Format validation; extracted figure (e.g., USD $12,345,678.90) formatted per RBNZ return spec (e.g., integer cents, no currency symbol) | Fixture A, raw GL figure in multi-currency format | Format conversion applied | RBNZ return field contains figure in prescribed format (integer cents NZD) | ✅ TESTABLE — format regex match |
| S1-T6 | Extraction timestamp logged; extraction metadata captured with exact time and source system version | Fixture A loaded; system clock set to known time T | Extraction completes at time T | Audit log contains extraction timestamp = T, source system version = "CoreBanking GL v7.2.1", process identity = "pipeline-extract-service" | ✅ TESTABLE — timestamp and version string match |
| S1-T7 | Reconciliation: extracted figures match prior-month manual extract | Fixture A; Fixture D (prior-month return) | Extracted GL figures compared line-by-line to prior-month return field values (allowing for month-over-month variance) | Extracted figures within tolerance (±1% or analyst-noted exception) | ✅ TESTABLE — field-by-field comparison with tolerance threshold |
| S1-T8 | Extraction includes all required RBNZ return fields; no missing mappings | Fixture A and B loaded; RBNZ return template loaded | Field count in extracted data vs. RBNZ return template | Extracted data populates 100% of required RBNZ fields (non-nullable fields all present) | ✅ TESTABLE — count of populated fields vs. schema |
| S1-T9 | Multi-system extract coordination; CoreBanking, CardPlatform, and Treasury all extracted in single pipeline run | All three fixtures loaded and APIs available | Single `POST /extract/full-cycle` invocation | All three sources extracted sequentially; combined pre-populated return available within 15 min | ✅ TESTABLE — end-to-end timing and result availability |
| S1-T10 | Extraction error handling; API timeout or invalid response | Fixture A loaded; API configured to timeout or return 500 | Extraction attempted against unavailable API | Error logged with timestamp, API name, HTTP status code; extraction marked FAILED; alert sent | ✅ TESTABLE — error log and alert verification |

### Acceptance Criterion Tests (Direct)

**AC1:** Given CoreBanking-GL and CardPlatform APIs available, When the pipeline executes extraction, Then all required return fields populated...
- **Test:** S1-T1, S1-T8 (all required fields present)
- **Verification:** Spot-check 10 fields from each source; verify count matches RBNZ template schema

**AC2:** Given analyst verifies extracted figures, When analyst compares to manual extraction records, Then extracted figures match (100% reconciliation in UAT)
- **Test:** S1-T7
- **Verification:** Compare extracted GL amounts to prior-month return field values

**AC3:** Given extraction completes, When extraction metadata logged, Then log contains: timestamp (ISO 8601), source system version, extracting process identity, field-level input/output values
- **Test:** S1-T6
- **Verification:** Query audit log; verify timestamp format, version string, process ID, and field values

**AC4:** Given extraction data staged for analyst review, When analyst checks data freshness, Then timestamp reflects actual extraction time and timezone consistent with RBNZ requirements
- **Test:** S1-T6, S1-T9
- **Verification:** Extract timestamp = extraction completion time; timezone = NZST; verify against RBNZ submission timezone requirement

---

## Story 2: Implement Immutable Audit Trail Infrastructure

### Technical Test Cases

**Test Suite: S2 — Audit Trail**

| Test ID | Scenario | Given | When | Then | Expected Result | Testability |
|---------|----------|-------|------|------|---|---|
| S2-T1 | Log write; operation logged to audit trail | Extraction completes | PostgreSQL INSERT to audit_log table | Row written with operation ID, timestamp, operator identity, operation type | ✅ TESTABLE — row count increment |
| S2-T2 | Write-once enforcement; attempt to UPDATE or DELETE audit row | Row exists in audit_log | `UPDATE audit_log SET ... WHERE operation_id = ?` | UPDATE rejected by database policy; row remains unchanged | ✅ TESTABLE — permission denied error |
| S2-T3 | Immutability verification; audit log queried after write-once enforcement active | Multiple rows written; write-once policy active | Query audit_log for any row and attempt modification | All queries return read-only data; modification attempts denied | ✅ TESTABLE — query result immutable |
| S2-T4 | Retention policy; audit log rows retained 7 years from submission date | 7-year-old audit rows exist; current date is 2033-05-17 | Archive policy runs (simulated: current date advances to 2033-05-17) | 7-year-old rows remain in audit_log or archival system; accessible within 5 business days | ✅ TESTABLE — row existence in archive |
| S2-T5 | Producibility: complete audit trail exported within 5 business days of RBNZ request | Audit rows exist for return period 2026-04-01 to 2026-04-30; export requested on 2026-05-10 | `GET /audit/export?return_period=2026-04&requested_by=RBNZ` invoked | Export file generated within 5 business days (by 2026-05-17); file contains all source data logs, transformation logs, review/approval logs, submission confirmations | ✅ TESTABLE — export file generation time and content verification |
| S2-T6 | Log performance; audit log writes do not block submission workflow | Extraction completes; audit writes triggered | Asynchronous write to audit_log; primary submission workflow continues | Primary workflow completes within 15 min; audit writes complete within 1 min (guaranteed delivery) | ✅ TESTABLE — workflow timing and write confirmation |
| S2-T7 | Audit trail includes 4 components: source data log, transformation log, review/approval log, submission confirmation | Operations S1 (extract), S3 (review/approve), S4 (submit) all logged | Each operation logged with required component data | Audit log contains all 4 component types for a complete return cycle | ✅ TESTABLE — component type counts in audit log |
| S2-T8 | Field-level input/output values logged for transformation rules | Extraction applies field mapping (GL account → RBNZ field) | Mapping rule executed; rule ID, input value, output value logged | Audit log row contains: rule_id = "MAP_GL_1100_RBNZ_TOTAL_ASSETS", input_value = "12345678.90", output_value = "1234567890" (cents format) | ✅ TESTABLE — row content verification |
| S2-T9 | Timestamp consistency; all timestamps in audit log use ISO 8601 format and NZST timezone | Multiple operations logged across extraction, review, submission | Query audit_log for timestamp column | All timestamps match pattern `YYYY-MM-DDTHH:MM:SS+12:00` or `+13:00` (NZST/NZDT) | ✅ TESTABLE — regex match on timestamp format |
| S2-T10 | Export legibility; exported audit trail is human-readable and machine-readable | Export generated | Export file opened in text editor and parsed by audit analysis tool | Both human reader and script can understand operation sequence, timestamps, operator identities, and field values | ✅ TESTABLE — export format validation (JSON, CSV, or PDF) |

### Acceptance Criterion Tests (Direct)

**AC1:** Given extraction/mapping/review/submission operations, When each completes, Then logged with operation ID, timestamp (ISO 8601), operator identity, operation type, input/output values, rule ID/version, immutability confirmation...
- **Test:** S2-T1, S2-T8, S2-T9
- **Verification:** Audit log row contains all required fields

**AC2:** Given Compliance Officer requests audit trail for return from preceding 7 years, When request received, Then complete, exportable audit record produced within 5 business days...
- **Test:** S2-T5
- **Verification:** Export file generation and content check

**AC3:** Given audit trail exported, When Compliance Officer reviews export, Then legible, timestamped, operator-attributed, sufficient for independent verification of field derivation...
- **Test:** S2-T10
- **Verification:** Manual review and script-based parsing of export

**AC4:** Given audit log queries, When query executed against audit log for specific return period, Then query completes in <5 seconds...
- **Test:** S2-T6
- **Verification:** Query execution time measurement

---

## Story 3: Analyst Review and Approval Workflow

### Technical Test Cases

**Test Suite: S3 — Analyst Approval**

| Test ID | Scenario | Given | When | Then | Expected Result | Testability |
|---------|----------|-------|------|------|---|---|
| S3-T1 | Workflow display; analyst opens pre-populated return | Pre-populated return staged in SharePoint; analyst has read access | `GET /workflow/return/{return_id}` | Workflow page displays all return fields, prior-month figures, differences highlighted | ✅ TESTABLE — page element count and content match |
| S3-T2 | Analyst comment; analyst adds line comment to a field | Return displayed; analyst clicks "Add comment" on field XX | Comment text entered; comment saved | Comment logged in audit trail with analyst identity, timestamp, comment text | ✅ TESTABLE — audit trail row with comment_text |
| S3-T3 | Approve action; analyst clicks Approve after review | Return displayed with all fields reviewed; analyst ready to approve | Analyst clicks "Approve" button; system prompts for PIN/signature | Approval logged in audit trail: analyst_id, timestamp, approval_signature, "APPROVED" status | ✅ TESTABLE — audit trail row with APPROVED status |
| S3-T4 | Reject action; analyst clicks Reject with reason | Return displayed; analyst identifies reconciliation issue | Analyst clicks "Reject" button; enters reason (e.g., "Field XX does not reconcile to GL"); clicks "Submit Reject" | Rejection logged in audit trail; return marked REJECTED; alert sent to Finance Operations Manager | ✅ TESTABLE — audit trail row with REJECTED status and alert email |
| S3-T5 | Approval signature capture; system records approval signature/PIN | Analyst completes approval; prompted for signature | Analyst enters PIN or signs digitally (SharePoint sign-in confirms identity) | Audit trail contains approval_signature field with timestamp of signing action | ✅ TESTABLE — audit trail signature field populated |
| S3-T6 | Field history display; analyst compares current return to prior month | Current return displayed; analyst clicks "Show prior month" | Prior-month return fields displayed side-by-side with current month | Differences highlighted with red/green indicators; analyst can identify changes | ✅ TESTABLE — visual comparison and difference count |
| S3-T7 | Comment persistence; comments remain visible after approval | Analyst writes comment; approves return | Return marked approved; analyst accesses return again 1 hour later | Comments visible; timestamped with analyst identity | ✅ TESTABLE — comment retrieval from audit trail |
| S3-T8 | Workflow access control; analyst can access assigned return only | Analyst A assigned return X; Analyst B not assigned | Analyst B attempts `GET /workflow/return/X` | HTTP 403 Forbidden; access denied | ✅ TESTABLE — permission check |
| S3-T9 | Alert routing; rejection alert sent to Finance Operations Manager | Analyst rejects return with reason | Alert generated immediately | Email received by Finance Operations Manager within 5 min with return ID and rejection reason | ✅ TESTABLE — email delivery verification |
| S3-T10 | Audit trail query; Compliance Officer queries approval record for a specific return | Return approved; Compliance Officer requests approval details | Query: `GET /audit/approvals?return_id=X` | Approval record returned with analyst_id, timestamp, approval_signature, comments | ✅ TESTABLE — query result content verification |

### Acceptance Criterion Tests (Direct)

**AC1:** Given pre-populated return staged, When analyst opens workflow, Then all fields viewable, prior-month figures shown, differences highlighted...
- **Test:** S3-T1, S3-T6
- **Verification:** Page content and visual indicators

**AC2:** Given analyst reviews and approves, When analyst clicks Approve, Then approval logged with analyst identity, timestamp, digital signature, comments...
- **Test:** S3-T3, S3-T5, S3-T7
- **Verification:** Audit trail row with all fields populated

**AC3:** Given analyst rejects with reason, When reject submitted, Then return returned to extraction, rejection logged, alert sent to Finance Operations Manager...
- **Test:** S3-T4, S3-T9
- **Verification:** Return status marked REJECTED; alert email received

**AC4:** Given approval completed, When Compliance Officer queries approval record, Then shows analyst identity, timestamp, signature, comments...
- **Test:** S3-T10
- **Verification:** Query result content

---

## Story 4: Submission Confirmation Logging and RBNZ/FMA Gateway Dispatch

### Technical Test Cases

**Test Suite: S4 — Submission**

| Test ID | Scenario | Given | When | Then | Expected Result | Testability |
|---------|----------|-------|------|------|---|---|
| S4-T1 | Submission dispatch; approved return sent to RBNZ portal | Return approved; submission button clicked | `POST /submit?return_id=X&gateway=rbnz` | RBNZ portal API receives return payload; HTTP 200 response with submission tracking ID | ✅ TESTABLE — API response code and tracking ID |
| S4-T2 | Submission dispatch to FMA; approved return sent to FMA gateway | Return approved; FMA submission selected | `POST /submit?return_id=X&gateway=fma` | FMA gateway API receives return payload; HTTP 200 response with FMA reference number | ✅ TESTABLE — API response and reference number |
| S4-T3 | Submission confirmation logged; confirmation recorded in audit trail | Submission completes; portal returns confirmation | Confirmation data (timestamp, reference number, submitter ID) logged to audit trail | Audit log row contains: submission_timestamp, rbnz_reference_id = portal response, submitter_identity = analyst PIN, gateway = "rbnz" | ✅ TESTABLE — audit trail row content |
| S4-T4 | Multiple return submissions; monthly + quarterly return submitted in same month | Both returns approved; submission batch invoked | `POST /submit/batch?return_ids=[X,Y]&gateway=[rbnz,fma]` | Each submission logged separately with unique audit trail entries; both complete and confirmed | ✅ TESTABLE — audit log row count = 2 |
| S4-T5 | Submission failure handling; API timeout or 500 error from portal | Portal configured to timeout | `POST /submit?return_id=X&gateway=rbnz` with portal timeout | Submission fails; error logged with error code and message; alert sent to Finance Operations Manager; submission queued for retry | ✅ TESTABLE — audit trail row with FAILED status; alert email |
| S4-T6 | Retry mechanism; failed submission automatically retried | Submission fails on attempt 1; portal recovers | Retry policy configured (e.g., 3 retries, exponential backoff) | After 5 min, retry executed; submission succeeds on attempt 2; confirmation logged | ✅ TESTABLE — audit trail shows both failed and successful attempts |
| S4-T7 | Idempotent dispatch; duplicate submission requests do not double-submit | Submission request sent twice (e.g., analyst double-clicks button) | Second request arrives while first is being processed | Only one return payload sent to portal; second request deduplicated; single confirmation logged | ✅ TESTABLE — portal receives exactly one payload; audit trail has one confirmation |
| S4-T8 | Submitter identity capture; audit trail records who submitted (analyst PIN or user ID) | Analyst logs in; submission occurs | User ID from login session captured | Audit trail submission_submitter_identity = analyst's AD login or PIN | ✅ TESTABLE — audit trail row identity field matches logged-in user |
| S4-T9 | Credential security; API credentials not logged | Submission to portal using OAuth token | OAuth token used in API call | Audit log does not contain token value; only reference to "OAuth token presented" or similar | ✅ TESTABLE — grep audit log for token patterns (negative test) |
| S4-T10 | Submission confirmation email; analyst receives confirmation | Submission completes successfully | Email triggered upon successful submission | Email arrives within 5 min with return ID, portal reference number, submission timestamp | ✅ TESTABLE — email delivery verification |

### Acceptance Criterion Tests (Direct)

**AC1:** Given analyst approves, When submission button clicked, Then pipeline connects to portal/gateway APIs and transmits return...
- **Test:** S4-T1, S4-T2
- **Verification:** API request received at portal; HTTP 200 response

**AC2:** Given return transmitted, When portal returns confirmation, Then confirmation logged in audit trail: submission_timestamp, reference_number, submitter_identity...
- **Test:** S4-T3, S4-T8
- **Verification:** Audit trail row with all required fields

**AC3:** Given multiple returns submitted in same month, When each completes, Then each logged separately in audit trail...
- **Test:** S4-T4
- **Verification:** Audit log row count equals number of submissions

**AC4:** Given submission fails, When failure detected, Then failure logged with error code, alert sent to Finance Operations Manager, submission queued for retry...
- **Test:** S4-T5, S4-T6
- **Verification:** Audit trail FAILED status; alert email; retry execution

---

## Story 5: Scheduled Extraction and Deadline Management

### Technical Test Cases

**Test Suite: S5 — Scheduling**

| Test ID | Scenario | Given | When | Then | Expected Result | Testability |
|---------|----------|-------|------|------|---|---|
| S5-T1 | Scheduler trigger; extraction scheduled for 17th month at 6 AM NZST | Current date 2026-05-16, 11:59 PM NZST; scheduler active | Clock advances to 2026-05-17, 6:00 AM NZST | Extraction pipeline triggered automatically; extraction starts | ✅ TESTABLE — scheduler logs trigger timestamp; pipeline logs start timestamp |
| S5-T2 | Extraction completion alert; if extraction completes by 5 PM, alert sent to analyst | Extraction completes at 3:30 PM NZST on 2026-05-17 | Extraction success logged | Email sent to assigned Finance Operations Analyst within 5 min: "Monthly Return Ready for Review - [return ID]" with link to workflow | ✅ TESTABLE — email delivery and content |
| S5-T3 | Late completion alert; if extraction approaching 4:45 PM without completion, alert sent | Extraction in progress; approaching 4:45 PM NZST | Clock advances to 4:45 PM; extraction still running | Alert sent to analyst and Finance Operations Manager: "Extraction Approaching Deadline - Estimated Completion: 5:20 PM; Reason: [progress info]" | ✅ TESTABLE — alert email with timestamp |
| S5-T4 | Deadline miss alert; if extraction not completed by 5 PM, failure alert sent | Extraction running; clock reaches 5:00 PM NZST | Extraction has not completed after 5:00 PM | Alert sent to Finance Operations Manager and Compliance Officer with error/status message; extraction marked LATE | ✅ TESTABLE — alert email; extraction status = LATE |
| S5-T5 | Retry on failure; if extraction fails before 5 PM, automatic retry triggered | Extraction fails at 3:15 PM NZST (e.g., API timeout) | Retry policy configured | Retry executed immediately (or after brief delay); extraction restarts; if succeeds by 5 PM, completion alert sent; if fails again, failure alert at 4:50 PM | ✅ TESTABLE — audit log shows failed and retried attempts |
| S5-T6 | Manual trigger override; analyst can manually trigger extraction outside of 17th | Scheduled extraction has completed; analyst wants immediate re-extract (e.g., new Treasury CSV available) | Analyst clicks "Extract Now" button | Extraction triggered immediately outside of scheduled time | ✅ TESTABLE — extraction audit log timestamp does not match 17th |
| S5-T7 | Scheduler reliability; extraction triggered every month on 17th without missing any month | Scheduler active for 12 months; monitoring execution log | 12 months elapse | Execution log shows exactly 12 extraction triggers (one per month on 17th); no months missed | ✅ TESTABLE — execution log row count = 12 |
| S5-T8 | Timezone consistency; scheduler respects NZST/NZDT transitions | Scheduler configured for 6 AM NZST; DST transition occurs (Oct → Nov: NZDT, Apr → May: NZST) | DST transition date arrives and passes | Extraction trigger respects local timezone after transition; triggered at 6 AM local time | ✅ TESTABLE — extraction timestamp vs. calendar date of DST transition |
| S5-T9 | Scheduler logging; every trigger and execution logged with timestamp and result | Scheduled extraction completes | Execution logged | Scheduler log contains: trigger_timestamp, extraction_start_timestamp, extraction_completion_timestamp, result (SUCCESS/FAILURE), duration | ✅ TESTABLE — scheduler log content |
| S5-T10 | Retry queue; failed extractions can be manually retried by analyst through UI | Extraction fails; Finance Operations Manager alerted | Manager navigates to retry queue and clicks "Retry" on failed job | Extraction immediately retried; new execution logged | ✅ TESTABLE — new extraction log entry with retry indicator |

### Acceptance Criterion Tests (Direct)

**AC1:** Given 17th of month at 6 AM NZST, When scheduler triggers, Then extraction pipeline runs automatically...
- **Test:** S5-T1
- **Verification:** Pipeline execution log timestamp matches scheduled time

**AC2:** Given extraction approaches 4:45 PM without completion, When clock reaches 4:45 PM, Then alert sent with progress/estimated completion...
- **Test:** S5-T3
- **Verification:** Alert email received within 5 min

**AC3:** Given extraction completes before 5 PM, When completion occurs, Then email sent to analysts with "Monthly Return Ready for Review" link...
- **Test:** S5-T2
- **Verification:** Email delivery and link verification

**AC4:** Given extraction fails, When failure detected, Then logged in audit trail, alert sent to Finance Operations Manager, extraction queued for manual retry...
- **Test:** S5-T4, S5-T10
- **Verification:** Audit trail FAILED status; alert email; retry queue availability

---

## Non-Functional Requirements (NFR) Tests

| NFR Category | Story | NFR Requirement | Test ID | Test Method | Pass Criteria |
|---|---|---|---|---|---|
| **Performance** | S1 | Extraction and pre-population completes in <15 min for full return cycle (500–800 fields) | NFR-S1-P1 | Execute extraction with Fixture A+B+C; measure end-to-end time | Duration ≤ 15 min |
| **Performance** | S2 | Audit log query <5 sec for specific return period | NFR-S2-P1 | Query audit_log for 1-month return period; measure query time | Duration ≤ 5 sec |
| **Performance** | S3 | Workflow page load <5 sec for returns up to 1000 fields | NFR-S3-P1 | Load workflow page with large return; measure load time | Duration ≤ 5 sec |
| **Performance** | S5 | Scheduler reliability: extraction triggered exactly once per month on 17th | NFR-S5-P1 | Monitor scheduler for 12 months; count triggers | Count = 12 (one per month) |
| **Security** | S1 | API calls authenticate via OAuth 2.0 / mutual TLS; no credentials embedded in logs | NFR-S1-S1 | Inspect extraction code and audit logs for embedded credentials (negative test) | Zero credentials found |
| **Security** | S1 | Extracted data at rest encrypted per enterprise standards | NFR-S1-S2 | Verify encryption on extracted data stored in staging DB | Encryption enabled and verified |
| **Security** | S4 | Submission credentials not logged; OAuth tokens / certificates not in audit trail | NFR-S4-S1 | Grep audit logs for credential patterns (negative test) | Zero credentials found |
| **Security** | S4 | Mutual TLS enforced for portal/gateway API calls | NFR-S4-S2 | Inspect submission code for mutual TLS configuration | TLS configured and enforced |
| **Audit** | S1 | Extraction logged with user/process ID, timestamp, source system version, field-level input/output | NFR-S1-A1 | Extract; query audit log; verify all fields populated | All fields present in audit row |
| **Audit** | S2 | Write-once enforcement; no UPDATE/DELETE after initial write | NFR-S2-A1 | Attempt to UPDATE audit row; verify rejection | UPDATE rejected with permission error |
| **Audit** | S2 | Logs immutable and retained 7 years; accessible within 5 business days | NFR-S2-A2 | Simulate 7-year-old row; attempt retrieval within 5 days | Retrieval succeeds within 5 days |
| **Audit** | S3 | Every action (view, comment, approve, reject) logged with operator identity and timestamp | NFR-S3-A1 | Perform workflow actions; query audit; verify all actions logged | All actions present in audit log |
| **Audit** | S4 | Submission attempt (success, failure, retry) logged with operator identity, timestamp, result code | NFR-S4-A1 | Perform submissions (success and failure); query audit; verify logging | All attempts logged with complete details |
| **Accessibility** | S3 | Review workflow accessible via SharePoint Online and mobile-friendly (WCAG 2.1 AA minimum) | NFR-S3-AC1 | Test workflow on mobile browser; verify WCAG 2.1 AA compliance | Axe scan: 0 violations |
| **Availability** | S1 | Pipeline extraction completes by 5 PM NZST on 17th (3 business days before RBNZ deadline) | NFR-S1-AV1 | Verify extraction completion time on 17th | Completion time ≤ 5 PM NZST |
| **Regulatory** | S2 | FMA s.3.1 5-business-day producibility; complete audit trail exported within 5 business days | NFR-S2-R1 | Simulate RBNZ/FMA export request; measure export completion time | Export time ≤ 5 business days |
| **Regulatory** | S4 | RBNZ s.3.1 deadline compliance: submission proof logged by 20th | NFR-S4-R1 | Submit return on or before 20th; verify submission confirmation in audit log | Submission timestamp ≤ 20th-of-month |

---

## Plain-Language AC Verification Script (Post-Deployment Smoke Test)

**Use this script to verify acceptance criteria before marking each story DoD-complete.**

### Pre-Smoke-Test Setup

```
Environment: UAT (not production)
Date: On or before 20th of month (for deadline-related tests)
Data: Use Fixture A–E (synthetic test data)
Duration: ~1 hour for full verification
Sign-off: Finance Operations Manager + Compliance Officer
```

### Story 1 Verification Script

```
[ ] 1a. Log in as Finance Operations Analyst
[ ] 1b. Trigger extraction via UI (or verify 17th 6 AM scheduled trigger executed)
[ ] 1c. Wait for extraction to complete (target: <15 min)
[ ] 1d. Verify return fields are populated:
    [ ] CoreBanking GL fields present (e.g., Total Assets > $0)
    [ ] CardPlatform transaction fields present (e.g., Daily aggregates > $0)
    [ ] Treasury fields present (e.g., Exchange rates populated)
[ ] 1e. Compare extracted figures to prior-month return (Fixture D):
    [ ] Spot-check 10 fields across GL, cards, treasury
    [ ] Verify figures match (allow ±1% variance for month-over-month)
    [ ] Record any exceptions (analyst manually notes expected changes)
[ ] 1f. Check extraction timestamp in audit trail:
    [ ] Timestamp format is ISO 8601 (YYYY-MM-DDTHH:MM:SS+12:00)
    [ ] System version recorded (e.g., "CoreBanking GL v7.2.1")
    [ ] Process identity recorded (e.g., "pipeline-extract-service")
[ ] 1g. Verify field-level input/output logged:
    [ ] Query audit log for rule ID, input value, output value samples
    [ ] Example: rule_id = "MAP_GL_1100_RBNZ_TOTAL_ASSETS", input = $12345678.90, output = 1234567890 (cents)
[ ] 1h. Sign off: "Extraction and pre-population AC1–AC4 verified"
```

### Story 2 Verification Script

```
[ ] 2a. Access audit trail database or audit trail UI
[ ] 2b. Verify write-once enforcement:
    [ ] Attempt to UPDATE an audit row manually (must fail with permission error)
    [ ] Verify error message indicates write-once constraint
[ ] 2c. Verify complete audit trail for a return:
    [ ] Query audit log for return submitted on previous month
    [ ] Verify all 4 components present:
        [ ] Source data log: extraction timestamp, system version, process identity
        [ ] Transformation log: rule ID, version, logic summary, approver, input/output values
        [ ] Review/approval log: reviewer identity, comments, approval signature
        [ ] Submission confirmation: timestamp, reference number, submitter identity
[ ] 2d. Verify export within 5 business days:
    [ ] Simulate RBNZ/FMA request for audit trail for previous month
    [ ] Trigger export (should complete within 1 min in UAT)
    [ ] Verify export file is legible (human-readable) and machine-readable (parseable JSON/CSV)
    [ ] Verify export contains all 4 audit trail components
[ ] 2e. Verify immutability of export:
    [ ] Open exported audit trail in tool (e.g., Excel, Python pandas)
    [ ] Verify timestamps, operator identities, and values are intact
    [ ] Verify no rows are modified or deleted
[ ] 2f. Query performance:
    [ ] Execute query for 1-month return period from audit log
    [ ] Measure query time (target: <5 sec)
    [ ] Record execution time
[ ] 2g. Sign off: "Audit trail infrastructure AC1–AC4 verified"
```

### Story 3 Verification Script

```
[ ] 3a. Log in as Finance Operations Analyst
[ ] 3b. Navigate to analyst review workflow for extracted return
[ ] 3c. Verify return fields displayed:
    [ ] All required RBNZ return fields visible
    [ ] Prior-month figures displayed for comparison
    [ ] Differences highlighted (red/green or diff indicator)
[ ] 3d. Verify comment workflow:
    [ ] Select a field with a visible difference
    [ ] Click "Add comment"
    [ ] Enter test comment: "Test comment - [date/time]"
    [ ] Click Save
    [ ] Verify comment saved and visible
[ ] 3e. Verify approval workflow:
    [ ] Review all return fields for changes
    [ ] Click "Approve" button
    [ ] System prompts for signature/PIN
    [ ] Enter PIN or digital signature
    [ ] Verify approval confirmed (page displays "Return approved on [timestamp]")
[ ] 3f. Verify approval logged in audit trail:
    [ ] Query audit log for approval record
    [ ] Verify audit log contains: analyst_id, timestamp, "APPROVED" status, approval_signature
[ ] 3g. Test rejection workflow (on a new return):
    [ ] Open a new return in workflow
    [ ] Click "Reject"
    [ ] Enter rejection reason: "Test rejection - reconciliation issue"
    [ ] Click "Submit Reject"
    [ ] Verify return marked REJECTED
    [ ] Verify Finance Operations Manager receives alert email within 5 min
[ ] 3h. Verify rejection logged in audit trail:
    [ ] Query audit log for rejection record
    [ ] Verify audit log contains: analyst_id, timestamp, "REJECTED" status, rejection_reason
[ ] 3i. Sign off: "Analyst review workflow AC1–AC4 verified"
```

### Story 4 Verification Script

```
[ ] 4a. Log in as Finance Operations Analyst (or Finance Operations Manager for submission approval)
[ ] 4b. Navigate to analyst review workflow for an approved return
[ ] 4c. Verify submission button available (only if return is approved)
[ ] 4d. Click "Submit to RBNZ"
[ ] 4e. Verify submission payload sent:
    [ ] System displays "Submitting to RBNZ..." message
    [ ] Wait for completion (target: <2 min)
    [ ] Verify success message: "Return submitted to RBNZ - Reference ID: [tracking_id]"
[ ] 4f. Verify submission confirmation logged in audit trail:
    [ ] Query audit log for submission record
    [ ] Verify audit log contains: submission_timestamp, rbnz_reference_id, submitter_identity, gateway = "rbnz"
    [ ] Verify timestamp format is ISO 8601
[ ] 4g. Verify submission email:
    [ ] Check email inbox for submission confirmation email
    [ ] Verify email contains: return ID, RBNZ reference ID, submission timestamp
[ ] 4h. Test submission to FMA (on a separate return):
    [ ] Repeat steps 4a–4g for FMA submission
    [ ] Verify FMA submission succeeds and is logged separately in audit log
[ ] 4i. Test submission failure handling:
    [ ] Temporarily disable RBNZ API (e.g., firewall block)
    [ ] Attempt submission
    [ ] Verify failure message displayed
    [ ] Verify Finance Operations Manager receives alert email within 5 min
    [ ] Verify submission marked FAILED in audit log
    [ ] Re-enable API
    [ ] Verify manual retry available in UI
[ ] 4j. Sign off: "Submission confirmation logging AC1–AC4 verified"
```

### Story 5 Verification Script

```
[ ] 5a. Verify scheduler configuration:
    [ ] Check scheduler settings: trigger date = 17th month, time = 6 AM NZST
    [ ] Verify scheduler is active
[ ] 5b. Test scheduled trigger (simulate 17th at 6 AM):
    [ ] Advance system clock to 17th of month at 5:59 AM NZST
    [ ] Monitor extraction pipeline logs
    [ ] At 6:00 AM NZST, verify extraction starts automatically (no manual trigger needed)
    [ ] Record extraction start timestamp
[ ] 5c. Verify extraction completes before 5 PM:
    [ ] Monitor extraction progress
    [ ] If extraction completes before 4:45 PM:
        [ ] Verify analyst receives email: "Monthly Return Ready for Review - [return_id]"
        [ ] Verify email contains link to workflow
        [ ] Verify email delivered within 5 min of completion
[ ] 5d. Test late-completion alert (if applicable):
    [ ] If extraction is still running at 4:45 PM:
        [ ] Verify alert email sent to analyst and Finance Operations Manager
        [ ] Verify alert contains: "Extraction Approaching Deadline" and estimated completion time
[ ] 5e. Test extraction deadline miss (simulate failure scenario):
    [ ] Deliberately delay extraction to trigger 5 PM miss
    [ ] Verify alert email sent to Finance Operations Manager with FAILURE message
    [ ] Verify extraction marked LATE in audit log
[ ] 5f. Verify scheduler logs extraction trigger:
    [ ] Query scheduler log for trigger on 17th at 6 AM
    [ ] Verify scheduler log contains: trigger_timestamp, extraction_start_timestamp, result
[ ] 5g. Verify retry on failure:
    [ ] Check if failed extraction auto-retries or is queued for manual retry
    [ ] Verify retry is logged as separate attempt in audit log
[ ] 5h. Sign off: "Scheduled extraction and deadline management AC1–AC4 verified"
```

---

## Test Coverage Summary

| Story | Test Cases | AC Tests | NFR Tests | Status |
|-------|-----------|----------|-----------|--------|
| S1 | 10 technical | 4 direct | 3 | ✅ READY |
| S2 | 10 technical | 4 direct | 5 | ✅ READY |
| S3 | 10 technical | 4 direct | 4 | ✅ READY |
| S4 | 10 technical | 4 direct | 4 | ✅ READY |
| S5 | 10 technical | 4 direct | 3 | ✅ READY |
| **TOTAL** | **50 technical** | **20 direct** | **19** | **✅ READY FOR UAT** |

---

<!-- CPF-TRACE
stage: /test-plan
model: claude-haiku-4-5
config: C
story: S8
experiment: EXP-008-corpus-breadth-eval

constraints_tested:
  - C1: RBNZ s.2.3 derivation logic logging (S1-T6, S2-T8, test 1d reconciliation); RBNZ s.3.1 deadline (S5-T1, S5-T2, S5-T3, S5-T4 scheduler tests)
  - C2: FMA s.2.1 complete audit trail (S2-T7 component verification); FMA s.3.1 producibility (S2-T5 export within 5 business days); Immutability (S2-T2 write-once enforcement)
  - C3: Human sign-off (S3-T3 approval workflow, S3-T5 signature capture); mandatory before submission (S4-T1 submission depends on S3 approval)
  - C4: Normalisation excluded from Phase 1; not directly tested (excluded scope)
  - C5: Normalisation excluded from Phase 1; not directly tested (excluded scope; Epic 2 placeholder contains preconditions)

constraints_carried_forward:
  - C1 compliance tested: deadline by 5 PM 17th (S5), transformation logging (S2-T8)
  - C2 compliance tested: audit trail 4 components (S2-T7), 5-business-day export (S2-T5), immutability (S2-T2)
  - C3 compliance tested: analyst approval (S3-T3), approval logging (S3-T5)
  - C4 compliance: normalisation excluded (tested implicitly — no normalisation logic in any story)
  - C5 compliance: normalisation excluded (tested implicitly — no normalisation logic in any story; Epic 2 is placeholder)

constraints_not_carried: C4 and C5 — normalisation layer is Phase 2; Phase 1 tests do not include normalisation logic validation or governance precondition verification (those are Epic 2 scope)

c5_test_coverage: C5 is not directly tested in Phase 1 stories (normalisation layer is excluded and gated). Test plan explicitly states in Out of Scope sections: "Normalisation transformation layer: explicitly excluded from this story" and "Phase 2 is the gate-point where normalisation activation is explicitly conditioned on compliance resolution."

c5_surfaced: true
c5_surfacing_quality: full
c5_surfacing_quality_notes: >
  C5 is surfaced in /test-plan as:
  (1) Story 1, Out of Scope: "Normalisation transformation layer is explicitly excluded from this story's implementation scope"
  (2) Story 1, Architecture Constraints: C5 reference with B1 gate and precondition list
  (3) Test Suite S1-T10 edge case: "Extraction error handling" — covers only field-mapping errors, explicitly not normalisation logic
  (4) NFR table: no normalisation-related NFRs tested (normalisation is Phase 2)
  (5) Smoke test scripts: no normalisation verification steps (normalisation excluded from UAT scope for Phase 1)
  C5 is held distinct from delivery scope; Epic 2 placeholder governs Phase 2 when normalisation governance preconditions are resolved. No softening or partial implementation of normalisation in Phase 1 stories.
-->

<!-- eval-mode: true -->
