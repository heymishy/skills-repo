# Definition: Automated Regulatory Reporting Pipeline — RBNZ and FMA Return Automation

**Feature:** regulatory-reporting-pipeline-automation
**Discovery status:** Approved (eval-mode — read from disk: `runs/config-A-S8/discovery.md`)
**Benefit-metric:** NOT PRESENT — experimental simplification for EXP-008 CPF measurement
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Date:** 2026-05-17
**Run:** EXP-008 Config A S8

---

## Step 0 — Entry condition check (eval-mode)

- Discovery artefact: ✅ read from disk (`runs/config-A-S8/discovery.md`, status: Approved, eval-mode)
- Context injection files: ✅ S8-ea-registry-regulatory-reporting-pipeline.md, S8-rbnz-fma-policy-doc.md — active
- Benefit-metric artefact: ⚠️ NOT PRESENT — experimental simplification. Success indicators from discovery carried into stories.

**Constraints carried in from discovery:**
- C1 — RBNZ Prudential Reporting: methodology notification (s.2.1) before normalisation layer goes live; self-disclosure of historical unapproved normalisation (RRPL-RISK-003); BS11 technology change notification ≥30 business days before production; submission deadline 20th of month
- C2 — FMA Financial Reporting Act 2013: complete audit trail with rule ID, rule version, logic, and approver per transformation step; producible to FMA within 5 business days; 7-year retention
- C3 — Human sign-off mandatory: designated finance officer approval required before any return is dispatched; no auto-submission pathway
- C4 — Normalisation = material figure-derivation change: constitutes methodology adjustment under RBNZ s.2.2 requiring prior RBNZ notification; historical unapproved application creates self-disclosure obligation
- C5 — Normalisation logic governance gap: unreviewed single-analyst Excel macro from 2019, no change control, no second reviewer; must be independently reviewed, documented, change-controlled, and both regulators notified before encoding in pipeline (surfaced as [BLOCKER — B2] in discovery)

**Slicing strategy:** Risk-first (Strategy 4) — B1 and B2 blockers from discovery create a mandatory critical path. Epic 1 (compliance governance gate) must be complete before the normalisation transformation layer (Story 2.3) can be activated in production. Epic 1 stories are governance delivery items, not engineering stories; they carry explicit ACs and owner accountability because they gate the build. Engineering teams may build Stories 2.1, 2.2, 2.4, 3.1, and 3.2 in parallel with Epic 1 completion using UAT environments. Story 2.3 may NOT be activated in production until Epic 1 Stories 1.1 and 1.2 are both complete.

**Architecture constraints scan:** EA registry entry (RRPL) reviewed. All source connections read-only — no write-back permitted. Audit log is write-once (PostgreSQL with immutable log design per RRPL-AUD-001). SharePoint Online for analyst staging workflow (RRPL-AUD-002). TreasuryLedger has no regulatory-data API — treasury data enters via manual CSV handoff. No additional platform-level architecture guardrails applicable beyond the EA registry constraints already active in context.

---

## Step 4a — Regulated Constraint Audit

### Regulated constraints identified in discovery

| Constraint | Type | Regulatory source |
|-----------|------|-------------------|
| C1 — RBNZ Prudential Reporting: s.2.1 prior written notification before adjusted methodology used in any submitted return; s.2.2 normalisation = methodology adjustment; historical unapproved normalisation self-disclosure required; BS11 s.4.2 technology change notification ≥30 business days before production | Regulatory (external law — RBNZ Act 2021, Deposit Takers Act 2023, BS11) | RBNZ Prudential Reporting Standards s.2.1, s.2.2, s.2.3, s.3.1, s.4.2 |
| C2 — FMA Financial Reporting Act 2013: complete audit trail (rule ID, rule version, logic, approver, input/output per transformation step); producible within 5 business days; 7-year retention; immutable after return submission | Regulatory (external law — Financial Reporting Act 2013, FMA Regulatory Returns Guide 2022) | FMA Regulatory Returns Guide 2022 s.2.1, s.2.2, s.3.1, s.4.1 |

Non-regulated constraints (tracked; general CPF threshold):
- C3 — Human sign-off mandatory before submission (operational/regulatory non-negotiable)
- C4 — Normalisation = material figure-derivation change requiring RBNZ assessment (regulatory-adjacent; derivative of C1)
- C5 — Normalisation logic governance gap: unreviewed single-analyst Excel macro, no change control (hidden governance gap; surfaced at /discovery as B2 blocker)

### Story-to-regulated-constraint mapping

| Story | Triggers C1 | Triggers C2 | Triggers C4 | Triggers C5 |
|-------|------------|------------|------------|------------|
| 1.1 — RBNZ Notifications and Self-Disclosure | ✅ PRIMARY | — | ✅ PRIMARY | — |
| 1.2 — Normalisation Logic Independent Review and Change Control Gate | — | ✅ (rule version dependency for transformation log) | ✅ | ✅ PRIMARY |
| 2.1 — CoreBanking-GL and CardPlatform Extraction | — | ✅ (source data log component) | — | — |
| 2.2 — Treasury Manual CSV Extract Ingestion | — | ✅ (source data log component) | — | — |
| 2.3 — Normalisation Transformation Engine | ✅ (methodology compliance; normalisation flag enforcement) | ✅ PRIMARY (transformation log per step) | ✅ (encoding normalisation gated on approved methodology) | ✅ (feature flag enforcement of C5 gate) |
| 2.4 — Pre-populated Return File Generation | ✅ (prescribed format compliance) | ✅ (audit trail linkage to return file) | — | — |
| 3.1 — Analyst Review, Sign-Off, and Submission | ✅ (analyst approval before submission) | ✅ (review and approval log component) | — | — |
| 3.2 — Immutable Audit Log and 7-Year Retention | — | ✅ PRIMARY (write-once, 7-year retention, 5-business-day producibility) | — | — |

---

## Epic 1 — Regulatory Compliance Gate

**Purpose:** Establish the mandatory governance pre-conditions that gate the build. Epic 1 stories are compliance and governance delivery items. The normalisation transformation layer (Story 2.3) and the pipeline's production go-live are both blocked until Stories 1.1 and 1.2 are complete. Engineering teams may build Stories 2.1, 2.2, 2.4, 3.1, and 3.2 in UAT environments in parallel with Epic 1 — these stories do not encode or activate the normalisation logic. Story 2.3 MUST NOT be deployed to production until both 1.1 and 1.2 are complete and the `NORMALISATION_LAYER_APPROVED` deployment flag is set by the Compliance Officer.

---

### Story 1.1 — RBNZ Figure-Derivation Notification, Historical Self-Disclosure, and BS11 Technology Change Notification

**As a** compliance officer
**I want** to file the required RBNZ figure-derivation methodology notifications and BS11 technology change notification before the automated pipeline goes live
**So that** the enterprise meets its mandatory disclosure obligations to RBNZ and resolves the active self-disclosure obligation created by RRPL-RISK-003 before any automated return preparation system processes a return intended for submission

**Acceptance Criteria:**

AC1: A formal RBNZ s.2.1 figure-derivation methodology notification is prepared and submitted to the RBNZ prudential reporting team. The notification documents: (a) the normalisation transformation applied to CoreBanking-GL, TreasuryLedger, and CardPlatform source data before populating return fields; (b) the return fields affected (BS2, BS3, BS7 field-level breakdown); (c) before-and-after derivation methodology examples for each affected field; (d) that the methodology has been applied since 2019 without prior notification (historical use acknowledgement); (e) the planned automated pipeline implementation date.

AC2: A historical self-disclosure is included in or accompanies the s.2.1 notification, per RBNZ Prudential Reporting Standards s.2.2 ("institutions that have been applying unapproved adjustments to source data in submitted returns are required to self-disclose"). The self-disclosure explicitly references the 2019 normalisation methodology, all return series affected, and the period of unapproved application. The compliance officer confirms this document is filed in the Finance Compliance SharePoint folder with version control and submission date stamp.

AC3: A BS11 technology change notification is filed with RBNZ no fewer than 30 business days before the planned production go-live date of the pipeline. The notification includes: (a) description of the automated pipeline and its scope; (b) the returns and specific fields affected; (c) before-and-after derivation methodology; (d) evidence of internal governance approvals (including the independent normalisation logic review from Story 1.2); (e) planned go-live date; (f) rollback plan.

AC4: RBNZ written acknowledgement of the s.2.1 methodology notification is received and filed in the Finance Compliance SharePoint folder. If RBNZ initiates a retroactive methodology review following the self-disclosure, production go-live is blocked until RBNZ communicates the outcome of that review to the compliance officer in writing. The compliance officer documents the RBNZ response (whether acknowledgement or notification of a methodology review) in a signed record filed alongside the notification.

AC5: A deployment configuration field `BS11_NOTIFICATION_DATE` is set (by the Compliance Officer, not the engineering team) in the production deployment configuration, recording the date the BS11 notification was filed. The CI/CD pipeline includes a pre-deployment gate that verifies the deployment date is ≥30 business days after `BS11_NOTIFICATION_DATE`. If this gate fails, the deployment is blocked with an error stating the earliest allowable deployment date. Automated tests verify: (a) gate blocks deployment when fewer than 30 business days have elapsed; (b) gate passes when the 30-business-day minimum is satisfied.

**Architecture constraints:** C1 (RBNZ s.2.1/s.2.2/s.4.2), C4 (normalisation = methodology adjustment), EA registry RRPL-RISK-003.
**Oversight level:** HIGH — compliance officer and CFO sign-off on notification documents; direct RBNZ communication.

---

### Story 1.2 — Normalisation Logic Independent Review, Documentation, and Change Control Gate

**As a** compliance officer and Finance Operations Manager
**I want** the existing normalisation logic to be independently reviewed, precisely documented, and placed under formal change control before it is encoded into the automated pipeline
**So that** the enterprise satisfies FMA Regulatory Returns Guide 2022 s.4.2 (formalising legacy informal derivation logic), resolves the single-point-of-failure governance risk in RRPL-RISK-002, and ensures the transformation log references a documented, approved, version-controlled rule set

**Acceptance Criteria:**

AC1: The normalisation logic (currently an Excel macro) is documented in a written specification of sufficient precision for independent reproduction. For each source field normalised, the documentation states: (a) the source system and field name; (b) the input condition triggering the normalisation; (c) the transformation rule (mathematical formula or conditional logic); (d) the output effect on the return field value; (e) the rationale (specific rounding artefact or timing mismatch introduced in the 2019 migration). The specification is authored by the analyst who wrote the original macro, reviewed for completeness, and declared accurate.

AC2: An independent technical review of the documented normalisation logic is completed by a person other than the original macro author. The reviewer confirms in a signed, dated review report: (a) the documented logic accurately represents the transformation applied to historical returns; (b) the transformation rules are arithmetically correct; (c) any limitations, edge cases, or conditions under which the transformation may be incorrect are documented. The review report is filed in the Finance Compliance SharePoint folder.

AC3: The normalisation logic specification is version-controlled in the engineering repository with an initial version tag `normalisation-rules-v1.0.0`. Each subsequent change to any normalisation rule requires a new version tag and a repeat of the independent review and governance sign-off steps. The pipeline's transformation engine reads normalisation rules exclusively from the version-tagged specification in the repository — not from the original Excel macro.

AC4: Finance Operations Manager and Compliance Officer provide documented governance sign-off confirming the logic is accurate, reviewed, and approved for use in the automated pipeline. Sign-off is recorded as a dated, identity-attributed document in the Finance Compliance SharePoint folder. This document includes the version tag of the approved rule set (`normalisation-rules-v1.0.0` or successor).

AC5: An FMA methodology change notification is submitted to the FMA, informing them that the normalisation logic previously applied informally (via analyst Excel macro) is being formalised into an automated pipeline per FMA Regulatory Returns Guide 2022 s.4.2(d). The notification references the independent review report and governance sign-off documents. The FMA notification is coordinated with the RBNZ BS11 notification from Story 1.1 so both regulators receive concurrent notification.

AC6: The pipeline codebase contains a deployment configuration flag `NORMALISATION_LAYER_APPROVED` that defaults to `false`. The transformation engine (Story 2.3) MUST NOT apply any normalisation step when this flag is `false` — and when the flag is `false`, the pipeline run MUST abort after logging the `normalisation_skipped` audit entry; it MUST NOT proceed to return file generation. The flag may only be set to `true` in the production deployment configuration when: (a) the Story 1.2 independent review report (AC2) and governance sign-off document (AC4) are both filed and their SharePoint document IDs are referenced in the deployment configuration; (b) the Compliance Officer confirms in writing that both documents are present and the AC5 FMA notification has been submitted. Automated tests verify: (a) flag=false → transformation engine aborts after logging `normalisation_skipped`; (b) flag=false → return file generation step does not execute; (c) flag=true → normalisation rules are loaded from the version-tagged repository specification; (d) governance document ID fields present and non-null in production config.

**Architecture constraints:** C5 (normalisation governance gap — PRIMARY), C2 (rule version referenced in transformation log per FMA s.2.1(b)), C4 (change control as prerequisite to encoding logic), FMA s.4.2, EA registry RRPL-RISK-002.
**Oversight level:** HIGH — independent technical reviewer, Finance Operations Manager, Compliance Officer governance sign-off required.

---

## Epic 2 — Automated Pipeline Core

**Purpose:** Build the automated extraction, transformation, and return file generation pipeline. Stories 2.1, 2.2 (source extraction) and Story 2.4 (return file generation) may be built and tested in UAT before Epic 1 completes. Story 2.3 (normalisation transformation engine) requires the `NORMALISATION_LAYER_APPROVED` flag to be `true` in production configuration before it activates normalisation processing.

---

### Story 2.1 — Source Data Extraction — CoreBanking-GL and CardPlatform API Integration

**As a** finance operations analyst
**I want** the pipeline to automatically extract required return data fields from CoreBanking-GL and CardPlatform via their read-only REST APIs
**So that** manual data extraction from two of the three source systems is eliminated

**Acceptance Criteria:**

AC1: The pipeline authenticates to CoreBanking-GL (RRPL-UP-001) and CardPlatform (RRPL-UP-003) using read-only service accounts. Write-scope API calls are not included in any service account token scope. Integration tests verify that no write-scope tokens are requested and that a write-scope API call to either system returns a 403 rejection.

AC2: For each pipeline run, the source data log records the following per source system, written to the immutable audit log before any transformation begins: source system name and interface ID (RRPL-UP-001/003), API version queried, extraction timestamp (ISO 8601 with timezone), reporting period (start and end date), list of fields extracted, SHA-256 hash of the extracted data payload.

AC3: The extraction process validates completeness against the expected mandatory field inventory for the return form being generated (BS2/BS3/BS7). Any missing mandatory field causes the pipeline run to fail with a structured error message identifying the specific missing fields and the return form affected. A partial or field-incomplete extraction MUST NOT proceed to the transformation step.

AC4: Transient API failure retries are capped at 3 attempts with exponential backoff (initial delay: 5 seconds; maximum delay: 60 seconds). After 3 consecutive failures, the pipeline records a structured failure entry in the audit log identifying the source system, failure type, and retry count, and sends an alert to the finance operations manager. No partial run state is left in the system after a failure.

**Architecture constraints:** C2 (source data log required per FMA s.2.1(a)), EA registry RRPL-UP-001 and RRPL-UP-003 read-only constraint.

---

### Story 2.2 — Treasury Manual CSV Extract Ingestion

**As a** finance operations analyst
**I want** the pipeline to ingest treasury position data from a manually produced CSV extract provided by treasury operations
**So that** treasury data can be included in automated return generation while the TreasuryLedger vendor has no regulatory-data API

**Acceptance Criteria:**

AC1: The pipeline accepts a treasury CSV extract in a defined, versioned schema (documented in the pipeline data dictionary, version-controlled in the engineering repository). Schema validation runs at ingestion time — files with missing mandatory columns, unexpected column types, or out-of-range values are rejected with a structured error message identifying the specific failing fields and rows. Rejected files are not ingested and no audit log entry is created for them.

AC2: Treasury operations confirms CSV coverage of the correct reporting period via a documented approval artefact (a Jira task approval in the Finance Change Board or a SharePoint confirmation document — not email alone). The pipeline stores the confirmation artefact reference (Jira task ID or SharePoint document ID) in the audit log ingestion record. Ingestion is rejected if no valid confirmation artefact reference is provided.

AC3: The source data log entry for treasury ingestion records: source identifier ("TreasuryLedger-manual-extract"), interface ID (RRPL-UP-002), file ingestion timestamp, reporting period (start and end date), SHA-256 hash of the CSV file, confirmation artefact reference ID.

AC4: A process guide for treasury operations (defining the expected CSV schema, the reporting period coverage requirement, the file submission channel, and the confirmation approval step) is published and version-controlled alongside the pipeline codebase. The guide version in effect is recorded in the pipeline documentation at each release.

**Architecture constraints:** C2 (source data log required), EA registry RRPL-UP-002 (manual extract risk), RRPL-RISK-001 (vendor has no regulatory-data API).

---

### Story 2.3 — Normalisation Transformation Engine (Gated on Story 1.2)

**As a** finance operations analyst
**I want** the pipeline to apply the formalised, version-controlled normalisation rules to source data before populating return fields
**So that** the manual correction step is eliminated and every transformation is logged with its approved rule version, input value, and output value in a form that satisfies the FMA audit trail requirement

**Acceptance Criteria:**

AC1: The transformation engine reads normalisation rules exclusively from the version-tagged rule set produced by Story 1.2 (AC3) — the repository-stored `normalisation-rules-v1.0.0` (or successor version). The rule version identifier is recorded in the transformation log entry for every normalisation step applied (per AC3 of this story).

AC2: The `NORMALISATION_LAYER_APPROVED` flag (Story 1.2 AC6) is checked at pipeline startup. If the flag is `false`: (a) the transformation engine logs a `normalisation_skipped` entry in the audit log recording the flag state, the pipeline run ID, and the timestamp; (b) the pipeline run MUST abort immediately — it MUST NOT proceed to the return file generation step; (c) an automated alert is sent to the finance operations manager identifying the reason (governance flag not set). No partial return file may be staged in SharePoint from a run that did not complete normalisation. Integration tests verify: (a) flag=false → abort logged → no return file generated → alert sent; (b) flag=true → normalisation executes using the version-tagged rule set.

AC3: For each field normalised in a pipeline run, the transformation log entry records: (a) field name and source system; (b) source value (pre-normalisation); (c) rule ID; (d) rule version (e.g., `normalisation-rules-v1.0.0`); (e) transformation logic applied as a human-readable description sufficient for independent reproduction; (f) the name of the person who signed governance approval for this rule version (from AC4 of Story 1.2); (g) output value (post-normalisation); (h) pipeline run ID; (i) timestamp (ISO 8601 with timezone).

AC4: Transformation log entries are written to the immutable audit log (Story 3.2) atomically as part of each normalisation step. A transformation step that fails to write its log entry causes the entire pipeline run to fail — the pipeline MUST NOT proceed past a logging failure. The audit log write and the transformation step are treated as a unit: partial transformation without a corresponding log entry is not permitted.

AC5: A test suite covering the following cases must exist and pass before this story is considered complete: (a) known normalisation rule applied correctly — pre/post values match expected output; (b) `NORMALISATION_LAYER_APPROVED=false` → abort before return file generation, alert triggered, audit log entry written; (c) transformation log completeness — every normalisation step in a run has a corresponding audit log entry with all required fields; (d) rule version mismatch — transformation engine config references a rule version not present in the version-tagged repository → pipeline fails with an explicit error identifying the mismatched version; (e) log write failure simulation — transformation proceeds but log write fails → pipeline run aborts; no partial return file generated.

**Architecture constraints:** C1 (normalisation = RBNZ-approved methodology; feature flag enforces compliance gate), C2 (transformation log completeness per FMA s.2.1(b)), C4 (encoding normalisation gated on approved methodology and regulatory notification), C5 (feature flag as technical enforcement of governance gate).
**Dependencies:** Story 1.2 must be complete and `NORMALISATION_LAYER_APPROVED` set to `true` in production configuration before this story is active in production. Story 3.2 (audit log) must be deployed and operational before this story runs in any environment.

---

### Story 2.4 — Pre-populated Return File Generation

**As a** finance operations analyst
**I want** the pipeline to produce a pre-populated RBNZ return file (BS2, BS3, BS7) from extracted and normalised source data
**So that** analysts review and approve a complete pipeline-generated draft rather than manually populating each return field

**Acceptance Criteria:**

AC1: The pipeline generates return files in the RBNZ-prescribed format for BS2, BS3, and BS7 returns. Field definitions and derivation methodology follow the RBNZ Prudential Reporting Standards for each return type. Before staging a return file for analyst review, every generated file is automatically validated against a stored RBNZ return format specification (field names, field types, field order, mandatory/optional classification). Format validation failures abort the run and produce a structured error identifying the non-conforming fields and return form. A partially validated return file MUST NOT be staged.

AC2: Each pre-populated return file references its source data extract version (via audit log run ID) and its transformation log run ID, creating a traceable link from any return field value back to the specific audit log entries that record the transformation producing that value.

AC3: If source data validation (Story 2.1 AC3 or Story 2.2 AC1) or transformation logging (Story 2.3 AC4) has recorded a failure during the current run, the return file generation step MUST NOT execute. No partial or untraceable return file is staged for analyst review.

AC4: The pipeline places the pre-populated return file in the SharePoint analyst review staging area (RRPL-AUD-002) with a structured filename: `[return-type]-[reporting-period-YYYY-MM]-[pipeline-run-id].pdf` (or approved format). The file includes a cover page identifying: return type, reporting period, pipeline run ID, audit log run ID, and a note that the file is pipeline-generated and requires analyst review and sign-off before submission.

**Architecture constraints:** C1 (prescribed RBNZ format compliance), C2 (audit trail linkage from return file to audit log entries), EA registry RRPL-DN-001 (RBNZ return file format requirements).

---

## Epic 3 — Analyst Workflow, Submission, and Audit Trail

---

### Story 3.1 — Analyst Review, Sign-Off, and Submission Workflow

**As a** finance operations analyst and designated finance officer
**I want** a structured workflow to review the pre-populated return, record corrections, formally approve submission, and have the pipeline submit the approved return to RBNZ or FMA
**So that** analyst sign-off authority is preserved, every submission has a traceable approval record, and the 20th-of-month RBNZ submission deadline is met without manual submission steps

**Acceptance Criteria:**

AC1: The analyst review workflow presents the pre-populated return in the SharePoint staging area (RRPL-AUD-002). The designated analyst can review field values, add correction notes, and record manual amendments to pre-populated figures. All amendments are logged with: field name, pre-amendment value, amendment value, amendment rationale, and the identity and timestamp of the analyst who made the amendment. Amendment records are written to the immutable audit log.

AC2: The workflow requires explicit digital sign-off from the designated finance officer (or a named, documented delegate) before the return is queued for submission to RBNZ or FMA. Sign-off is recorded as a dated, identity-attributed approval record in the immutable audit log — not as email confirmation alone. The sign-off record constitutes the authoritative approval document for the return period.

AC3: The submission gateway integration (RRPL-DN-001 for RBNZ, RRPL-DN-002 for FMA) is gated by the presence of a completed sign-off record in the audit log for the relevant return period. A return MUST NOT be dispatched if no completed sign-off record exists. Automated integration tests verify: (a) submission gateway call blocked when sign-off record is absent; (b) submission proceeds when sign-off record is present and complete.

AC4: After successful submission, the pipeline records in the audit log: submission timestamp (ISO 8601), submission reference number returned by the RBNZ Reporting Portal or FMA Submission Gateway, the return period and return type, and the identity of the submitting user.

AC5: The pipeline sends an automated alert to the finance operations manager and designated finance officer when the RBNZ submission deadline (20th of month) is T minus 2 business days and no sign-off has been recorded for the current month's return. Alert threshold is configurable (default: T minus 2 business days).

**Architecture constraints:** C2 (review and approval log per FMA s.2.1(c)/(d)), C3 (human sign-off non-negotiable — PRIMARY), EA registry RRPL-AUD-002.

---

### Story 3.2 — Immutable Audit Log and 7-Year Retention

**As a** compliance officer
**I want** the pipeline to produce and retain an immutable, complete, and producible audit trail for every return period
**So that** the enterprise can satisfy any FMA or RBNZ written request for audit trail evidence within 5 business days for any return submitted in the preceding 7 years, satisfying the FMA producibility obligation under FMA Regulatory Returns Guide 2022 s.3.1

**Acceptance Criteria:**

AC1: The audit log is stored in PostgreSQL (RRPL-AUD-001) with a write-once constraint enforced at the database level. The pipeline service account is granted INSERT privileges only on the audit log table — no UPDATE or DELETE privileges. An automated test verifies that an attempt to delete or update a committed audit log entry using the pipeline service account is rejected by the database with an error.

AC2: The complete audit trail for any submitted return period comprises, at minimum, all five of the following components: (a) source data log — one entry per source system per run (per Stories 2.1 and 2.2); (b) transformation log — one entry per normalisation step applied (per Story 2.3); (c) analyst amendment log — one entry per amendment (or a documented nil-amendment record); (d) sign-off record — the designated finance officer's approval (per Story 3.1 AC2); (e) submission confirmation — timestamp, reference number, submitter identity (per Story 3.1 AC4). An automated test verifies that a complete pipeline run produces all five component types in the audit log for a test return period.

AC3: The audit log provides an export function that produces a complete, legible, machine-readable export (CSV or JSON) for a specified return period, covering all five audit log components. The export is tested to confirm: (a) all required fields per each component type are present in the export; (b) the export completes in ≤60 seconds for a single return period with 7 years of historical data present in the log.

AC4: Audit log records are retained for a minimum of 7 years from the submission date of the return period to which they relate. A retention policy is documented and configured at the database level. Records approaching or passing the 7-year mark are flagged for compliance officer review — automated deletion of audit log records requires explicit written authorisation from the Compliance Officer and is not permitted by the pipeline service account.

AC5: Before the pipeline is authorised to process any return intended for a live regulatory submission, a pre-launch producibility drill must be completed successfully using the UAT environment with a simulated return period dataset. The drill must confirm: (a) the export function produces all five audit log components per AC2; (b) the export is producible within 5 business days from request to delivery to a simulated FMA examiner. The compliance officer reviews and signs off the drill result. This sign-off is a mandatory go-live gate condition — it must be documented in the production deployment approval record. Quarterly producibility drills are run after go-live and results filed with the compliance team.

**Architecture constraints:** C2 (FMA audit trail producibility — 5 business days; 7-year retention; complete per FMA s.2.1; immutable per FMA s.2.2 — PRIMARY), RBNZ s.2.3(b)/(c)/(d), EA registry RRPL-AUD-001 (write-once immutable design).

---

<!-- CPF-TRACE
stage: /definition
model: claude-sonnet-4-6
config: A

constraints_in: C1 (RBNZ methodology notification + BS11 tech notification + self-disclosure), C2 (FMA audit trail + producibility + retention), C3 (human sign-off), C4 (normalisation = methodology change), C5 (normalisation governance gap)

story_constraint_propagation:
- Story 1.1: C1 ✅ PRIMARY (RBNZ s.2.1 methodology notification AC1; historical self-disclosure AC2; BS11 30-business-day notification AC3; BS11 CI/CD enforcement gate AC5); C4 ✅ (historical self-disclosure covers unapproved methodology adjustment AC2)
- Story 1.2: C5 ✅ PRIMARY (independent review AC2; documentation precision AC1; version control AC3; governance sign-off AC4; FMA notification AC5; feature flag enforcement AC6); C2 ✅ (rule version in transformation log depends on version-controlled spec AC3); C4 ✅ (change control as prerequisite to encoding logic AC3/AC4)
- Story 2.1: C2 ✅ (source data log per FMA s.2.1(a) AC2)
- Story 2.2: C2 ✅ (source data log with confirmation artefact reference AC3)
- Story 2.3: C1 ✅ (normalisation = RBNZ-approved methodology; feature flag enforcement of compliance gate AC2); C2 ✅ PRIMARY (transformation log: rule ID, version, logic, approver, input/output per step AC3); C4 ✅ (encoding normalisation gated on approved methodology and flag AC2); C5 ✅ (feature flag as technical enforcement — abort-before-return-file on flag=false AC2)
- Story 2.4: C1 ✅ (prescribed RBNZ format compliance AC1); C2 ✅ (audit trail linkage from return file to audit log run ID AC2)
- Story 3.1: C2 ✅ (review and approval log per FMA s.2.1(c)/(d) AC1-AC4); C3 ✅ PRIMARY (sign-off gate on submission gateway AC2-AC3)
- Story 3.2: C2 ✅ PRIMARY (write-once audit log AC1; all five components AC2; export and producibility AC3; 7-year retention AC4; pre-launch drill AC5)

constraints_not_propagated: none — all five constraints propagated to at least one story with explicit ACs
-->
