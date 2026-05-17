# Test Plan: Automated Regulatory Reporting Pipeline — RBNZ Prudential and FMA Returns

**Feature:** regulatory-reporting-pipeline-automation
**Model:** claude-sonnet-4-6 (Config B — test-plan stage)
**Date:** 2026-05-17
**Skill:** /test-plan
**Run:** EXP-008 Config B S8
**Review status:** CONDITIONAL PASS (eval-mode waivers for H1/H2 applied)

---

## Test data strategy

**Classification: REGULATED — New Zealand banking and financial services.**

All test data must be synthetic. No production CoreBanking-GL, TreasuryLedger, CardPlatform, or audit log data may be used in any test environment. Synthetic data must cover representative field distributions for BS2, BS3, BS7, and FMA Statistical Return mandatory fields. Edge-case payloads (missing fields, wrong types, boundary values) must be explicitly constructed for each test scenario. Document IDs used in deployment-configuration gate tests must be clearly marked synthetic (prefix `TEST-` or equivalent) so no synthetic ID can be confused with a real regulatory submission record.

The following test fixture categories are required:

| Fixture | Used in stories | Notes |
|---------|---------------|-------|
| `bs2-extract-complete.json` — full BS2 field set from CoreBanking-GL | 2.1, 2.3, 2.4 | Must cover all mandatory fields per RBNZ BS2 specification |
| `bs2-extract-missing-field.json` — BS2 with one mandatory field absent | 2.1 | Used for completeness validation failure path |
| `bs3-extract-complete.json`, `bs7-extract-complete.json` | 2.1, 2.4 | Same pattern as BS2 |
| `fma-stat-return-extract-complete.json` | 2.4 | FMA Statistical Return fields |
| `treasury-csv-valid-v1.0.0.csv` — valid treasury CSV per schema | 2.2 | Must include Jira task ID in confirmation artefact field |
| `treasury-csv-missing-col.csv`, `treasury-csv-wrong-type.csv`, `treasury-csv-out-of-range.csv` | 2.2 | Schema rejection paths |
| `normalisation-rules-v1.0.0-fixture.json` — version-tagged rule set (3 rules minimum) | 2.3 | Must include a rule with non-trivial boundary behaviour |
| `deployment-config-complete.json` — all 14 deployment-configuration fields set to non-empty synthetic values | 1.1 AC5, 1.2 AC7, 1.3 AC5, 2.3 AC2 | Foundation for all gate-pass tests |
| `deployment-config-missing-[fieldname].json` — one fixture per field (14 fixtures) | 1.1 AC5, 1.2 AC7, 1.3 AC5, 2.3 AC2 | Foundation for all gate-block tests |
| `deployment-config-flag-false.json` — `NORMALISATION_LAYER_APPROVED=false`, all others set | 2.3 | Normalisation skip path |
| `deployment-config-bs11-insufficient.json` — `BS11_NOTIFICATION_DATE` set to yesterday | 1.1 AC5 | 30-business-day check failure path |
| `deployment-config-bs11-30bd.json` — `BS11_NOTIFICATION_DATE` set to 32 NZ business days ago | 1.1 AC5 | 30-business-day check pass path |
| `audit-log-schema-v1.json` — PostgreSQL schema definition | 3.2 | For schema validation tests |

---

## PART A — Technical test plan (coding agent)

### Story 1.1 — RBNZ Notifications and Self-Disclosure — CI/CD Gate

**Category:** Governance deliverable with CI/CD enforcement gate (AC5)

**Testable AC summary:**
- AC1–AC4: Document-artefact deliverables. The artefacts themselves are produced by human actors (Compliance Officer) outside the codebase. The coding agent's testable surface is: (a) the CI/CD gate that reads the deployment-configuration fields; (b) the NZ business-day calendar calculation.
- AC5: Fully automated gate — 4 test scenarios specified in the AC.

**Tests for AC5 — CI/CD pre-deployment gate:**

```
T1.1.1 — GATE BLOCKS: Missing RBNZ_S21_NOTIFICATION_DOC_ID
  Given: deployment-config-missing-RBNZ_S21_NOTIFICATION_DOC_ID.json
  When: pre-deployment gate runs
  Then: gate exits with non-zero status; error output names "RBNZ_S21_NOTIFICATION_DOC_ID" as the missing field

T1.1.2 — GATE BLOCKS: Missing RBNZ_S22_SELFDISCLOSURE_DOC_ID
  Given: deployment-config-missing-RBNZ_S22_SELFDISCLOSURE_DOC_ID.json
  When: pre-deployment gate runs
  Then: gate exits with non-zero status; error output names "RBNZ_S22_SELFDISCLOSURE_DOC_ID"

T1.1.3 — GATE BLOCKS: Missing BS11_NOTIFICATION_DOC_ID
  Given: deployment-config-missing-BS11_NOTIFICATION_DOC_ID.json
  When: pre-deployment gate runs
  Then: gate exits with non-zero status; error output names "BS11_NOTIFICATION_DOC_ID"

T1.1.4 — GATE BLOCKS: Missing RBNZ_S21_ACK_DOC_ID
  Given: deployment-config-missing-RBNZ_S21_ACK_DOC_ID.json
  When: pre-deployment gate runs
  Then: gate exits with non-zero status; error output names "RBNZ_S21_ACK_DOC_ID"

T1.1.5 — GATE BLOCKS: Missing RBNZ_REVIEW_OUTCOME_DOC_ID
  Given: deployment-config-missing-RBNZ_REVIEW_OUTCOME_DOC_ID.json
  When: pre-deployment gate runs
  Then: gate exits with non-zero status; error output names "RBNZ_REVIEW_OUTCOME_DOC_ID"

T1.1.6 — GATE BLOCKS: BS11_NOTIFICATION_DATE set but fewer than 30 NZ business days elapsed
  Given: deployment-config-bs11-insufficient.json (date = yesterday, all doc-IDs set)
  When: pre-deployment gate runs (simulated "today" = day after notification)
  Then: gate exits with non-zero status; error output names earliest allowable deployment date

T1.1.7 — GATE PASSES: All fields present and 30+ NZ business days elapsed
  Given: deployment-config-bs11-30bd.json (date = 32 NZ business days ago, all doc-IDs set)
  When: pre-deployment gate runs
  Then: gate exits with status 0

T1.1.8 — NZ HOLIDAY CALENDAR: RBNZ-published holiday correctly excluded from business-day count
  Given: BS11_NOTIFICATION_DATE spans a known NZ public holiday
  When: business-day count is calculated
  Then: the holiday is not counted; the 30-day minimum passes only when 30 actual NZ business days (holidays excluded) have elapsed
```

**Test file:** `tests/gates/rbnz-notifications-gate.test.js` (or equivalent)
**Test runner command:** `npm test -- --grep "T1.1"`
**Expected output on all pass:** 8 tests pass, 0 failures

---

### Story 1.2 — Normalisation Logic Documentation — CI/CD Gate

**Testable AC summary:**
- AC1–AC6: Governance deliverables. Coding agent's testable surface: CI/CD gate (AC7) and test suite in AC3.
- AC3: Test suite is itself a deliverable — the tests written for this story ARE the control evidence.
- AC7: Fully automated gate.

**Tests for AC3 — Normalisation rule set test suite (this IS the implementation deliverable):**

```
T1.2.1 — RULE POSITIVE: For each normalisation rule in normalisation-rules-v1.0.0, one positive test per rule
  Given: rule input X as specified in docs/normalisation-rules-v1.0.0.md
  When: transformation function is applied
  Then: output = Y per the documented mathematical formula
  [Note: minimum 3 tests (one per rule); parameterised fixture]

T1.2.2 — RULE BOUNDARY: For each rule with non-trivial boundary behaviour, one boundary test
  Given: input at the documented boundary value for a rule
  When: transformation function is applied
  Then: output matches expected boundary behaviour per the documented rule

T1.2.3 — EDGE CASE COVERAGE: Every edge case identified by the Independent Technical Reviewer in AC2 has a regression test
  Given: AC2 review report edge case list (fixture: edge-cases.json populated from ITR report)
  When: transformation function applied to each edge case input
  Then: output matches documented expected output for each edge case

T1.2.4 — COVERAGE ASSERTION: Every documented rule has at least one positive test
  Given: complete rule set from normalisation-rules-v1.0.0.md
  When: test coverage report is generated
  Then: rule coverage = 100% (no undocumented rule, no untested rule)
```

**Tests for AC7 — CI/CD pre-deployment gate:**

```
T1.2.5 — GATE BLOCKS: Missing INDEPENDENT_REVIEW_REPORT_DOC_ID
  Given: deployment-config-missing-INDEPENDENT_REVIEW_REPORT_DOC_ID.json
  When: pre-deployment gate runs
  Then: gate exits non-zero; error names "INDEPENDENT_REVIEW_REPORT_DOC_ID"

T1.2.6 — GATE BLOCKS: Missing NORMALISATION_GOVERNANCE_APPROVAL_DOC_ID
  Given: deployment-config-missing-NORMALISATION_GOVERNANCE_APPROVAL_DOC_ID.json
  When: pre-deployment gate runs
  Then: gate exits non-zero; error names "NORMALISATION_GOVERNANCE_APPROVAL_DOC_ID"

T1.2.7 — GATE BLOCKS: Missing FMA_S42_NOTIFICATION_DOC_ID
  Given: deployment-config-missing-FMA_S42_NOTIFICATION_DOC_ID.json
  When: pre-deployment gate runs
  Then: gate exits non-zero; error names "FMA_S42_NOTIFICATION_DOC_ID"

T1.2.8 — GATE BLOCKS: Missing LEGACY_MACRO_DOC_ID
  Given: deployment-config-missing-LEGACY_MACRO_DOC_ID.json
  When: pre-deployment gate runs
  Then: gate exits non-zero; error names "LEGACY_MACRO_DOC_ID"

T1.2.9 — GATE BLOCKS: AC3 test suite failing on the version-tagged rule set
  Given: deployment-config-complete.json but normalisation test suite is failing (mock failure injected)
  When: pre-deployment gate runs
  Then: gate exits non-zero; error identifies failing test names

T1.2.10 — GATE PASSES: All four doc-IDs set and test suite passing
  Given: deployment-config-complete.json; test suite passes (all T1.2.1–T1.2.4 green)
  When: pre-deployment gate runs
  Then: gate exits 0
```

**Test file:** `tests/gates/normalisation-governance-gate.test.js`, `tests/normalisation/normalisation-rules.test.js`
**Expected output:** T1.2.1–T1.2.4: 6+ tests pass (parameterised); T1.2.5–T1.2.10: 6 tests pass

---

### Story 1.3 — Pre-Launch Producibility Drill — CI/CD Gate

**Testable AC summary:**
- AC1–AC4: Governance + UAT execution deliverables. Coding agent testable surface: CI/CD gate (AC5).
- AC5: Fully automated gate.

**Tests for AC5:**

```
T1.3.1 — GATE BLOCKS: Missing PRODUCIBILITY_DRILL_PASS_DOC_ID
  Given: deployment-config-missing-PRODUCIBILITY_DRILL_PASS_DOC_ID.json
  When: pre-deployment gate runs
  Then: gate exits non-zero; error names "PRODUCIBILITY_DRILL_PASS_DOC_ID"

T1.3.2 — GATE PASSES: PRODUCIBILITY_DRILL_PASS_DOC_ID set
  Given: deployment-config-complete.json (PRODUCIBILITY_DRILL_PASS_DOC_ID present and non-empty)
  When: pre-deployment gate runs
  Then: gate exits 0
```

**Test file:** `tests/gates/producibility-drill-gate.test.js`
**Expected output:** 2 tests pass

---

### Consolidated gate integration test

```
T-GATE-INT — MASTER GATE: All 14 deployment-configuration fields must be present for production deployment
  Given: deployment-config-complete.json (all 14 fields set, BS11 date 32 NZ business days ago)
  When: consolidated pre-deployment gate runs (calls all three sub-gates)
  Then: gate exits 0; output confirms all checks passed

T-GATE-INT-EMPTY — MASTER GATE BLOCKS ON EMPTY CONFIG
  Given: empty deployment configuration (all fields null/absent)
  When: consolidated pre-deployment gate runs
  Then: gate exits non-zero; error output lists all 14 missing fields
```

---

### Story 2.1 — CoreBanking-GL and CardPlatform Extraction

```
T2.1.1 — READ-ONLY TOKEN: Service account token request for CoreBanking-GL contains no write scope
  Given: service account configuration for RRPL-UP-001
  When: authentication is performed
  Then: token request payload contains no write-scope entries; integration test mock verifies scope list

T2.1.2 — READ-ONLY TOKEN: Service account token for CardPlatform contains no write scope
  Given: service account configuration for RRPL-UP-003
  When: authentication is performed
  Then: same assertion as T2.1.1

T2.1.3 — WRITE SCOPE REJECTED: Attempted write-scope API call returns 403
  Given: mock CoreBanking-GL API configured to reject write-scope calls with 403
  When: pipeline attempts a write-scope call (injected test probe)
  Then: response is 403; pipeline does not proceed; error is logged

T2.1.4 — SOURCE DATA LOG WRITTEN: Complete source data log entry before transformation
  Given: successful extraction of bs2-extract-complete.json
  When: pipeline completes extraction step
  Then: audit log entry exists with all 8 required fields (source system, interface ID, API version, ISO 8601 timestamp, reporting period start/end, complete field list, SHA-256 hash, pipeline run ID); the entry is written before any transformation step

T2.1.5 — FIELD COMPLETENESS VALIDATION FAILS: Missing mandatory BS2 field
  Given: bs2-extract-missing-field.json (one mandatory BS2 field absent)
  When: pipeline runs validation step
  Then: pipeline run fails with structured error naming the missing field and "BS2"; no transformation proceeds

T2.1.6 — FIELD COMPLETENESS VALIDATION FAILS: Missing mandatory BS3 field
  Given: bs3-extract-missing-field.json
  Then: same pattern as T2.1.5

T2.1.7 — FIELD COMPLETENESS VALIDATION FAILS: Missing mandatory BS7 field
  Given: bs7-extract-missing-field.json
  Then: same pattern as T2.1.5

T2.1.8 — RETRY WITH EXPONENTIAL BACKOFF: Transient API failure retried 3 times with correct delays
  Given: mock API configured to fail with transient error for 3 attempts
  When: pipeline runs extraction
  Then: retry delays are 5s, 10s, 20s (exponential doubling, max 60s); total 3 attempts; failure entry written to audit log after exhaustion; alert dispatched to finance operations manager channel; no partial run state remains

T2.1.9 — RETRY EXHAUSTION: After 3 failures pipeline writes audit log entry and alerts
  Given: mock API configured to always fail (simulated sustained outage)
  When: pipeline runs extraction (3 attempts)
  Then: audit log entry contains source system, failure type, retry count = 3; alert dispatched; pipeline exits cleanly with non-zero status
```

**Test file:** `tests/extraction/corbanking-cardplatform.test.js`
**Expected output:** 9 tests pass

---

### Story 2.2 — Treasury Manual CSV Ingestion

```
T2.2.1 — SCHEMA VALID CSV ACCEPTED
  Given: treasury-csv-valid-v1.0.0.csv (all columns present, correct types, values in range)
  When: pipeline ingests CSV
  Then: schema validation passes; source data log entry written; no error

T2.2.2 — SCHEMA INVALID: Missing mandatory column
  Given: treasury-csv-missing-col.csv
  When: pipeline ingests CSV
  Then: rejection with structured error identifying failing column name and "missing mandatory column"; no audit log ingestion entry created

T2.2.3 — SCHEMA INVALID: Wrong column type
  Given: treasury-csv-wrong-type.csv
  When: pipeline ingests CSV
  Then: rejection naming failing field, expected type, actual type; no audit log ingestion entry

T2.2.4 — SCHEMA INVALID: Out-of-range value
  Given: treasury-csv-out-of-range.csv
  When: pipeline ingests CSV
  Then: rejection naming failing row and field with the invalid value; no audit log ingestion entry

T2.2.5 — CONFIRMATION ARTEFACT: Jira task ID accepted
  Given: valid CSV + confirmation artefact reference = "JIRA-FINOPS-12345"
  When: pipeline ingests
  Then: ingestion succeeds; audit log entry contains confirmation artefact reference "JIRA-FINOPS-12345"

T2.2.6 — CONFIRMATION ARTEFACT: SharePoint document ID accepted
  Given: valid CSV + confirmation artefact reference = "SP-DOC-TEST-001"
  When: pipeline ingests
  Then: same as T2.2.5

T2.2.7 — CONFIRMATION ARTEFACT: No reference rejected
  Given: valid CSV + no confirmation artefact reference provided
  When: pipeline ingests
  Then: rejection with structured error "confirmation artefact reference required"; no audit log ingestion entry

T2.2.8 — CONFIRMATION ARTEFACT: Email reference rejected
  Given: valid CSV + confirmation artefact reference = "email:treasury-ops@example.com"
  When: pipeline ingests
  Then: rejection with structured error "email reference not accepted — provide Jira task ID or SharePoint document ID"

T2.2.9 — SOURCE DATA LOG ENTRY: Complete fields for treasury ingestion
  Given: treasury-csv-valid-v1.0.0.csv + valid confirmation artefact "JIRA-FINOPS-12345"
  When: ingestion completes
  Then: audit log entry contains all 7 required fields (source identifier "TreasuryLedger-manual-extract", interface ID RRPL-UP-002, ISO 8601 ingestion timestamp, reporting period start/end, SHA-256 hash, confirmation artefact reference ID, pipeline run ID)
```

**Test file:** `tests/ingestion/treasury-csv.test.js`
**Expected output:** 9 tests pass

---

### Story 2.3 — Normalisation Transformation Engine

```
T2.3.1 — FLAG FALSE: Normalisation skipped when NORMALISATION_LAYER_APPROVED=false
  Given: deployment-config-flag-false.json (NORMALISATION_LAYER_APPROVED=false)
  When: pipeline startup checks flag
  Then: pipeline aborts; audit log entry with event_type="normalisation_skipped", flag_state=false, pipeline_run_id, ISO 8601 timestamp; no return file is generated; alert dispatched to finance operations manager

T2.3.2 — FLAG FALSE: No return file generated
  Given: deployment-config-flag-false.json + complete extraction data
  When: pipeline runs
  Then: audit log contains normalisation_skipped entry; return file staging area is empty for this run

T2.3.3 — FLAG TRUE: Normalisation executes with matching version tag
  Given: deployment-config-complete.json (NORMALISATION_LAYER_APPROVED=true, NORMALISATION_RULES_VERSION=normalisation-rules-v1.0.0)
  When: pipeline runs
  Then: normalisation executes using normalisation-rules-v1.0.0 fixture; no abort

T2.3.4 — VERSION MISMATCH: Rule set version in config does not match repository tag
  Given: deployment configuration specifying NORMALISATION_RULES_VERSION=normalisation-rules-v2.0.0 but only v1.0.0 exists in repository
  When: pipeline runs
  Then: pipeline fails with structured error identifying requested version "normalisation-rules-v2.0.0" and available versions ["normalisation-rules-v1.0.0"]; no transformation executed

T2.3.5 — TRANSFORMATION LOG COMPLETENESS: All 9 AC3 fields present per field normalised
  Given: deployment-config-complete.json; bs2-extract-complete.json
  When: normalisation runs on one field
  Then: transformation log entry contains all 9 fields: field name + source system; input value (pre); rule ID; rule version; human-readable transformation description; identity of FMA s.4.2(c) governance approval signatory; output value (post); pipeline run ID; ISO 8601 timestamp with timezone. Zero fields may be null.

T2.3.6 — ATOMIC LOG WRITE: Audit log write failure aborts the run
  Given: PostgreSQL connection failure injected during audit log write (mid-transformation)
  When: transformation attempts to write log entry
  Then: pipeline run aborts immediately; no transformation completes without log entry; no partial return file is staged; error logged to operations channel

T2.3.7 — ALERT ON FLAG FALSE: Finance operations manager alerted
  Given: deployment-config-flag-false.json
  When: pipeline aborts due to flag=false
  Then: alert message dispatched to operations alerting channel naming reason "NORMALISATION_LAYER_APPROVED=false — governance flag not set"

T2.3.8 — ACCESS POLICY: Non-Compliance-Officer principal cannot set NORMALISATION_LAYER_APPROVED=true
  Given: deployment configuration system access log
  When: a non-Compliance-Officer principal attempts to set NORMALISATION_LAYER_APPROVED=true
  Then: access is denied; access log entry records the denied attempt with principal ID, timestamp, and the field name
  [Note: this test validates against the deployment configuration system's access log, not the application code directly — verified via access log fixture]
```

**Test file:** `tests/transformation/normalisation-engine.test.js`
**Expected output:** 8 tests pass

---

### Story 2.4 — Pre-Populated Return File Generation

```
T2.4.1 — FORMAT VALIDATION PASS: BS2 file passes against stored specification
  Given: extraction + normalisation outputs producing a valid BS2 payload
  When: return file is generated and validated
  Then: validation passes; no error; file is staged

T2.4.2 — FORMAT VALIDATION FAIL: Missing field in BS2
  Given: pipeline extraction producing BS2 payload with one mandatory field absent post-transformation
  When: return file generation runs
  Then: validation fails with structured error naming the non-conforming field and "BS2"; no file staged; run aborts

T2.4.3 — FORMAT VALIDATION FAIL: Wrong field type in BS3
  Given: BS3 payload with wrong-type field
  Then: same pattern as T2.4.2 for BS3

T2.4.4 — FORMAT VALIDATION FAIL: Out-of-order fields in BS7
  Given: BS7 payload with fields in wrong order
  Then: validation fails; error names field order violation; no file staged

T2.4.5 — METADATA HEADER: Return file references source data and transformation log run IDs
  Given: complete pipeline run with pipeline run ID "TEST-RUN-001"
  When: return file is generated
  Then: file metadata header contains source data extract pipeline run ID = "TEST-RUN-001" and transformation log pipeline run ID = "TEST-RUN-001"

T2.4.6 — BLOCKED BY PRIOR FAILURE: Return file not generated if extraction failed
  Given: pipeline run where Story 2.1 AC3 validation recorded a failure for current run
  When: return file generation step is invoked
  Then: step does not execute; no file is staged; structured error references the prior validation failure

T2.4.7 — BLOCKED BY PRIOR FAILURE: Return file not generated if transformation log write failed
  Given: pipeline run where Story 2.3 AC4 recorded an audit log write failure
  When: return file generation step is invoked
  Then: same as T2.4.6

T2.4.8 — STAGING FILENAME: Structured filename convention enforced
  Given: return type BS2, reporting period 2026-01, pipeline run ID TEST-RUN-001
  When: file is staged
  Then: filename = "BS2-2026-01-TEST-RUN-001.[ext]"; file is placed in SharePoint staging area RRPL-AUD-002; cover page present with return type, reporting period, pipeline run ID, audit log run ID, and pipeline-generated notice
```

**Test file:** `tests/return-generation/return-file.test.js`
**Expected output:** 8 tests pass

---

### Story 3.1 — Analyst Review, Sign-Off, and Submission

```
T3.1.1 — NO SIGN-OFF BLOCKS SUBMISSION
  Given: pre-populated return file staged for analyst review; sign-off action NOT taken
  When: submission to RBNZ Reporting Portal is attempted
  Then: submission returns structured error "submission_blocked_no_signoff"; no gateway call is made; audit log entry with event_type="submission_blocked_no_signoff" written

T3.1.2 — NO SIGN-OFF BLOCKS FMA SUBMISSION
  Given: same scenario but for FMA Submission Gateway
  Then: same as T3.1.1

T3.1.3 — SIGN-OFF ENABLES SUBMISSION: RBNZ gateway called with identity-attributed entry
  Given: return file staged; sign-off action taken by DESIGNATED_SIGNATORY_NAME="TEST-SIGNATORY"
  When: submission to RBNZ Reporting Portal is invoked after sign-off
  Then: gateway call is made; audit log FMA s.2.1(c) review and approval entry written (signatory identity = "TEST-SIGNATORY", sign-off timestamp ISO 8601, pipeline run ID, return file reference)

T3.1.4 — SUBMISSION CONFIRMATION LOGGED: Gateway confirmation written to audit log
  Given: sign-off taken; gateway submission succeeds with reference "RBNZ-TEST-REF-001"
  When: submission completes
  Then: audit log contains FMA s.2.1(d) submission confirmation entry (submission timestamp, gateway reference "RBNZ-TEST-REF-001", identity of submitting principal)

T3.1.5 — GATEWAY FAILURE LOGGED: Gateway submission failure recorded; return file not marked submitted
  Given: sign-off taken; gateway mock returns error
  When: submission is attempted
  Then: audit log failure entry contains structured error fields; return file is not marked "submitted" in audit log; analyst is alerted

T3.1.6 — CODE SEARCH TEST: No auto-submission code path (structural test, must run in CI)
  Given: current codebase
  When: code-search test runs (static analysis pass)
  Then: zero call sites to the RBNZ or FMA gateway submission function exist in a code path that does not include the sign-off confirmation guard; test FAILS the build if any such call site is added
  [Implementation note: implement as a static analysis / AST traversal test in the test suite, not a lint rule — the failure must be caught in the CI test run that checks story ACs, not only in a lint pass]

T3.1.7 — DESIGNATED SIGNATORY FIELD: Submission only invokable by DESIGNATED_SIGNATORY_NAME
  Given: sign-off attempted by principal not matching DESIGNATED_SIGNATORY_NAME configuration
  When: sign-off action is submitted
  Then: action rejected with structured error "principal not authorised as designated signatory"; no submission proceeds
```

**Test file:** `tests/submission/analyst-signoff-submission.test.js`
**Expected output:** 7 tests pass; T3.1.6 is a CI structural test that must run as part of the main test suite

---

### Story 3.2 — Immutable Audit Log and 7-Year Retention

```
T3.2.1 — INSERT SUCCEEDS
  Given: PostgreSQL audit log with write-once role + row-update-rejecting trigger
  When: a new audit log row is inserted with all required fields
  Then: insert succeeds; row is readable with original field values

T3.2.2 — UPDATE REJECTED BY ROLE
  Given: same audit log; test attempts to UPDATE an existing row using the application role
  When: update is executed
  Then: PostgreSQL role permission rejects the update; exception raised; row is unchanged

T3.2.3 — UPDATE REJECTED BY TRIGGER
  Given: same audit log; test attempts to UPDATE an existing row using a role that bypasses application-level restriction (e.g. a test-privileged role) — simulating the trigger as the independent enforcement layer
  When: update is executed
  Then: row-update-rejecting trigger fires; update is rejected; row is unchanged

T3.2.4 — DELETE REJECTED
  Given: audit log row; test attempts to DELETE the row using the application role
  When: delete is executed
  Then: PostgreSQL role permission rejects the delete; exception raised; row count unchanged

T3.2.5 — DUAL LAYER INDEPENDENCE: Bypassing role still blocked by trigger
  Given: test role with UPDATE privilege granted (bypasses role layer)
  When: UPDATE is attempted
  Then: trigger independently rejects; confirming role and trigger are independent enforcement layers (removing one does not disable the other)

T3.2.6 — SCHEMA COVERS ALL LOG ENTRY TYPES
  Given: audit-log-schema-v1.json; all required log entry type fixtures (source-data-log, transformation-log, review-and-approval-log, submission-confirmation-log)
  When: schema validation is run against each fixture
  Then: all fixtures validate successfully; all FMA s.2.1(a)(b)(c)(d) component types have fields present

T3.2.7 — 7-YEAR RETENTION: Entry dated 7 years minus 1 day not purged
  Given: synthetic audit log entry with return_submission_date = today minus (7 years - 1 day)
  When: retention job runs
  Then: entry is still readable; retention job does not delete or archive it

T3.2.8 — EXPORT FUNCTION: Audit trail for one period exports to machine-readable file
  Given: audit log populated with synthetic entries for reporting period 2026-01
  When: export function is called for period 2026-01
  Then: JSON or CSV file produced; file is readable without pipeline access; all FMA s.2.1 components present for the period

T3.2.9 — EXPORT PERFORMANCE: Single-period export completes in under 1 hour
  Given: audit log populated with representative entry volume for one return period (use realistic synthetic row count for BS2/BS3/BS7 + FMA Statistical Return)
  When: export function runs
  Then: execution time < 3600 seconds (target: < 60 minutes, well under 5-business-day standard)
```

**Test file:** `tests/audit-log/immutable-audit-log.test.js`
**Expected output:** 9 tests pass

---

## PART B — Plain-language AC verification script (human review)

This script is for use during pre-coding human review and post-merge smoke testing.

### Story 1.1 — RBNZ Notifications Gate

To verify this story is working:
1. Open the CI/CD pipeline deployment gate configuration.
2. Submit a deployment with an empty `RBNZ_S21_NOTIFICATION_DOC_ID`. **Expect:** deployment blocked; error message names the missing field.
3. Repeat for each of the five doc-ID fields (`RBNZ_S22_SELFDISCLOSURE_DOC_ID`, `BS11_NOTIFICATION_DOC_ID`, `RBNZ_S21_ACK_DOC_ID`, `RBNZ_REVIEW_OUTCOME_DOC_ID`). **Expect:** each blocked with the correct field name in the error.
4. Set `BS11_NOTIFICATION_DATE` to yesterday. **Expect:** blocked; error shows the earliest allowable date (30 NZ business days from today).
5. Set all fields to synthetic test values and `BS11_NOTIFICATION_DATE` to 32 NZ business days ago. **Expect:** deployment passes the gate.
6. Set `BS11_NOTIFICATION_DATE` to a date that spans a New Zealand public holiday. Verify the holiday is excluded from the count. **Expect:** the gate counts only NZ business days.

### Story 1.2 — Normalisation Governance Gate

1. Open the CI/CD gate for normalisation governance.
2. Remove `INDEPENDENT_REVIEW_REPORT_DOC_ID`. **Expect:** blocked.
3. Repeat for `NORMALISATION_GOVERNANCE_APPROVAL_DOC_ID`, `FMA_S42_NOTIFICATION_DOC_ID`, `LEGACY_MACRO_DOC_ID`. Each must block independently.
4. Set all four to synthetic test values and confirm the normalisation test suite is passing. **Expect:** gate passes.
5. Inject a failing normalisation test. **Expect:** gate blocks and names the failing test.

### Story 1.3 — Producibility Drill Gate

1. Remove `PRODUCIBILITY_DRILL_PASS_DOC_ID`. **Expect:** deployment blocked; error names the field.
2. Set it to a synthetic test value. **Expect:** gate passes.

### Story 2.3 — Normalisation Flag Control

1. Set `NORMALISATION_LAYER_APPROVED=false`. Run the pipeline. **Expect:** pipeline aborts; audit log shows `normalisation_skipped`; no return file appears in the staging area; an alert is sent to the finance operations manager channel.
2. Set `NORMALISATION_LAYER_APPROVED=true` with a valid version tag. Run the pipeline. **Expect:** normalisation executes; transformation log entries are written for each normalised field.
3. Attempt to set `NORMALISATION_LAYER_APPROVED=true` using a non-Compliance-Officer principal. **Expect:** access denied; access log records the denied attempt.

### Story 3.1 — Human Sign-Off Gate

1. Stage a return file without completing the sign-off workflow. Attempt to submit to RBNZ. **Expect:** blocked with `submission_blocked_no_signoff`; audit log entry written.
2. Complete the sign-off workflow as the designated signatory. Attempt submission again. **Expect:** gateway called; sign-off log entry written with signatory name, timestamp, and run ID.
3. Review the codebase for any gateway submission call site that does not pass through the sign-off guard. **Expect:** zero such call sites.
4. Attempt sign-off as a principal not in `DESIGNATED_SIGNATORY_NAME`. **Expect:** rejected.

### Story 3.2 — Audit Log Immutability

1. Insert a test row into the audit log. **Expect:** succeeds.
2. Attempt to update the test row using the application database role. **Expect:** rejected.
3. Attempt to delete the test row. **Expect:** rejected.
4. Using a test-privileged database role (bypassing application role restriction), attempt to update the row directly. **Expect:** the row-update trigger independently rejects the update.
5. Run the export function for a synthetic reporting period. **Expect:** machine-readable file produced; FMA s.2.1 components all present.

---

## NFR tests

**NFR-1: ISO 8601 timestamps with timezone**
All audit log entries and pipeline run records must use ISO 8601 timestamps with explicit timezone. Test: query the audit log after a synthetic run and assert that every timestamp field is a valid ISO 8601 string with timezone offset (not just date or naive datetime). `Expected: zero timestamp fields in NULL or naive format.`

**NFR-2: 7-year retention minimum enforced (no premature purge)**
See T3.2.7. Test asserts entries are not purged before 7 years from return submission date.

**NFR-3: 5-business-day producibility performance**
See T3.2.9. Export completes well under 1 hour for one return period.

**NFR-4: Deployment-configuration access log retained 7 years**
After a synthetic pipeline run, confirm the deployment-configuration access log entry for that run is present and retained alongside the pipeline audit log. `Expected: access log entry readable; retention policy applies same 7-year window.`

**NFR-5: SHA-256 hash on all source data extracts and CSV ingestions**
T2.1.4 and T2.2.9 both assert SHA-256 hash present in source data log entry. Additional NFR test: assert hash is a valid SHA-256 hex string (64 hex characters). `Expected: all source data log entries pass hex-format assertion.`

**NFR-6: Exponential backoff parameters enforced (Story 2.1 AC4)**
T2.1.8 asserts specific delay values (5s, 10s, 20s, cap 60s, 3 attempts). `Expected: retry timing matches specification within ±10% tolerance.`

---

## Test suite coverage summary

| Story | Tests | Key coverage |
|-------|-------|-------------|
| 1.1 | T1.1.1–T1.1.8 (8) | All 5 missing-field blocks, 30-business-day blocks and passes, NZ holiday calendar |
| 1.2 | T1.2.1–T1.2.10 (10+) | Rule positive/boundary/edge-case/coverage tests; all 4 missing-field gate blocks, test-suite-failing gate block |
| 1.3 | T1.3.1–T1.3.2 (2) | Missing-field block, set pass |
| GATE-INT | T-GATE-INT, T-GATE-INT-EMPTY (2) | All 14 fields together |
| 2.1 | T2.1.1–T2.1.9 (9) | Read-only tokens, write rejection, source data log, completeness validation, retry backoff, audit log on exhaustion, alert |
| 2.2 | T2.2.1–T2.2.9 (9) | Schema validation, confirmation artefact protocol (4 variants), source data log completeness |
| 2.3 | T2.3.1–T2.3.8 (8) | Flag-false paths (2), flag-true, version mismatch, transformation log completeness, atomic log write, alert, access policy |
| 2.4 | T2.4.1–T2.4.8 (8) | Format validation (3 return forms), metadata header, blocked-by-prior-failure (2), filename convention |
| 3.1 | T3.1.1–T3.1.7 (7) | No-sign-off blocks (2), sign-off enables with identity-attributed log, confirmation log, gateway failure, code-search test, designated-signatory check |
| 3.2 | T3.2.1–T3.2.9 (9) | Insert pass, update blocked by role, update blocked by trigger, delete blocked, dual-layer independence, schema coverage, 7-year retention, export, export performance |
| NFR | NFR-1–NFR-6 (6) | Timestamps, retention, performance, access log, SHA-256 format, backoff timing |
| **Total** | **~78 tests** | |

---

<!-- TEST-PLAN-TRACE
model: claude-sonnet-4-6
config: B
stage: /test-plan
story_testability_assessment:
  governance_stories_1.1_1.2_1.3: 
    assessment: "Governance stories have CI/CD gate tests that are fully automatable (T1.1.x, T1.2.x, T1.3.x). The document-artefact ACs (AC1-AC4 of 1.1, AC1-AC6 of 1.2, AC1-AC4 of 1.3) are human governance deliverables with no automated test surface beyond the gate checks on their resulting doc-IDs. These ACs score MEDIUM testability individually (the document production is human-executed), but the CI/CD gates that enforce them are fully testable. Overall testability score: 2 — the AC verification conditions are unambiguous and the automated enforcement pathway (gate checks) covers each governance deliverable."
  engineering_stories_2.x_3.x:
    assessment: "All ACs are implementation-testable. Story 3.1 AC3 includes a structural (code-search) test that must run in CI — this is a notable test pattern and is fully automatable."
  comparison_with_config_a_s8: "Config A S8 scored story_testability=2. Config B S8 governance stories do not reduce testability to 1 — the gate enforcement pathway makes each governance deliverable verifiable by automation. Testability does NOT drop to 1 as seen in S2 Config B. The analogous S2 Config B pattern (vague 'should be appropriate' ACs) is not present here — all governance ACs result in a specific doc-ID field checked by an automated gate."
-->
