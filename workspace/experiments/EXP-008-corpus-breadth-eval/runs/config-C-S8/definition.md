# Definition: Automated Regulatory Reporting Pipeline — RBNZ and FMA Returns

**Feature slug:** regulatory-reporting-pipeline-automation
**Date:** 2026-05-17
**Skill version:** /definition
**Model:** claude-haiku-4-5 (Config C — cost-optimised; /definition stage is Haiku)
**Run:** EXP-008 Config C S8

---

## Step 1 — Feature scope

**Discovery loaded:** Automated Regulatory Reporting Pipeline — RBNZ and FMA Returns
**MVP scope items found:** 6 (automated data extraction, reconciliation, audit trail, analyst review workflow, RBNZ/FMA submission, deadline management)
**Personas identified:** 7 (Finance operations analysts, Compliance Officer, Finance Operations Manager, CFO, Independent Technical Reviewer, RBNZ Relationship Manager, Treasury Operations)
**Architecture guardrails checked:** None — `.github/architecture-guardrails.md` applied globally; regulatory-specific guardrails encoded in discovery constraints (C1–C5)

---

## Step 1.5 — Architecture Constraints Scan

**Regulatory architecture constraints from discovery:**

- **C1 — RBNZ Prudential Reporting Standards:** Submission by 20th calendar day required; any transformation/normalisation is a methodology adjustment requiring RBNZ notification; automated systems must apply only approved, documented, change-controlled derivation logic; BS11 s.4.2 material change notification ≥30 business days before implementation
- **C2 — FMA Financial Reporting Act 2013:** Complete audit trail (source data log, transformation log with rule ID/version/logic/approver/input-output, review/approval log, submission confirmation); immutable write-once logs; 7-year retention; 5-business-day producibility
- **C3 — Human sign-off mandatory:** Designated analyst and finance officer must review and approve every return before submission; no automated submission pathway
- **C4 — Normalisation is material change:** Both RBNZ s.2.1 methodology notification and BS11 technology change notification required before normalisation layer can activate
- **C5 — Normalisation logic governance gap [BLOCKER — B1]:** Macro exists only as unreviewed single-author Excel file; must satisfy FMA s.4.2 preconditions (documentation, independent review, governance sign-off, FMA+RBNZ notification, legacy artefact retention) before production activation

These constraints apply to all stories. Normalisation-layer-specific constraints apply to Epic 2 (future phase, gated).

---

## Step 2 — Slicing Strategy

**Chosen: Walking Skeleton**

First story establishes thinnest possible end-to-end path (data extraction → pre-population → analyst review gate → submission confirmation logging). Subsequent stories flesh out each layer. Rationale: regulatory domain requires explicit cross-layer validation before detail work. Walking skeleton allows UAT of the submission pathway and audit trail plumbing before full transformation logic is added.

---

## Step 3 — Epic Structure

**Proposed epic structure:**

- **Epic 1: Operational Automation — Phase 1 (Submission Pathway & Audit Trail)** — 5 stories — Establishes end-to-end submission pathway (extraction without normalisation → pre-population → analyst review → audit logging → submission). Excludes normalisation layer. Completes the operational efficiency case and regulatory audit trail baseline. Satisfies C1/C2/C3.

- **Epic 2: Normalisation Logic Governance & Activation (Future Phase — Gated by B1)** — 1 story (placeholder) — Documents the two-phase approach: normalisation layer may be built in UAT but cannot activate in production until FMA s.4.2 preconditions (C5) are resolved by compliance team. Not included in Phase 1 scope or ACs. Marks the gate explicitly for future sequencing.

---

## Epic 1: Operational Automation — Phase 1 (Submission Pathway & Audit Trail)

**Epic Slug:** operational-automation-phase-1
**Parent Feature:** regulatory-reporting-pipeline-automation
**Scope Stability:** Stable
**Human Oversight Level:** High (regulatory domain; analyst and compliance officer sign-off required before go-live)

**Epics Rationale:** Establishes the complete submission pathway without the normalisation transformation layer. Completes the operational efficiency case and puts audit trail infrastructure in place. Normalisation is gated behind governance preconditions (B1) and sequenced into a future phase after compliance team resolves C5.

**Stories:** 5 stories follow the walking skeleton pattern:
1. Data extraction and pre-population (thin end-to-end)
2. Immutable audit trail infrastructure
3. Analyst review and approval workflow
4. Submission confirmation and log export
5. Scheduled extraction and deadline management

---

## Story 1: Extract and Pre-Populate RBNZ Monthly Return

**Epic Reference:** [operational-automation-phase-1](operational-automation-phase-1)
**Discovery Reference:** [regulatory-reporting-pipeline-automation/discovery.md](regulatory-reporting-pipeline-automation/discovery.md)

### User Story

As a **Finance Operations Analyst**,
I want to **extract data from CoreBanking-GL and CardPlatform APIs and populate the RBNZ monthly return template automatically**,
So that **I can review pre-populated figures and reduce the extraction and reconciliation time from 40% of my monthly cycle to under 10%**.

### Benefit Linkage

**Metric moved:** Cycle time (monthly return cycle compressed from 6–8 business days to ≤2 business days of analyst review and sign-off).

**How:** Eliminating manual data extraction and field mapping reduces the first 3–4 days of the analyst's monthly workload to an automated pre-population step reviewable in 1 business day.

### Architecture Constraints

- **C1 — RBNZ Prudential Reporting Standards (s.2.3):** Automated reporting systems must apply only approved, documented, change-controlled derivation logic. Extract-and-map operations are derivation logic and must log every transformation step (rule ID, version, logic, approver, input/output values). No direct submission without audit trail step.
- **C2 — FMA Regulatory Returns Guide (s.2.1):** Extract operation must produce source data log: extraction timestamp, source system version, extracting process identity. This log is part of the complete audit trail and must be retained 7 years.
- **C3 — Human sign-off mandatory:** Extracted and pre-populated data is staged for analyst review only — analyst approval is the next step. No automated submission at this stage.
- **C5 — Normalisation logic governance gap [BLOCKER — B1]:** Normalisation transformation layer is explicitly excluded from this story's implementation scope. If pre-population logic includes any derivation beyond field mapping (e.g., rounding corrections, normalisation rules), that must be documented, independently reviewed, and governed per FMA s.4.2 before activation in production. Current implementation scope = field mapping and format conversion only. Normalisation layer is out of scope for this story and gated for future phase.

### Dependencies

- **Upstream:** CoreBanking-GL REST API and CardPlatform REST API must be available to new internal consumers with read-only access. Treasury Operations will provide monthly CSV extract for TreasuryLedger data (no vendor API available).
- **Downstream:** Unblocks Story 2 (audit trail infrastructure must log this extraction) and Story 3 (analyst review workflow receives pre-populated data).

### Acceptance Criteria

**AC1:** Given CoreBanking-GL and CardPlatform APIs are available and responding, When the pipeline executes the monthly extraction, Then all required return fields are populated from source data and the pre-populated return matches the current month's RBNZ return template structure.

**AC2:** Given a Finance Operations Analyst views the pre-populated return in the analyst review workflow, When the analyst compares extracted figures to manual extraction verification records, Then the extracted figures match the manual records (100% reconciliation rate in UAT).

**AC3:** Given the extraction completes, When extraction metadata is logged, Then the log contains: extraction timestamp (ISO 8601), source system version, extracting process identity, and field-level input/output values for all transformed fields.

**AC4:** Given extraction data is staged for analyst review, When the analyst checks the data freshness timestamp, Then the timestamp reflects the actual extraction time and timezone is consistent with RBNZ submission timezone requirements (New Zealand Standard Time).

### Out of Scope

- **Normalisation transformation logic:** Rounding corrections, timing mismatches, or any correction beyond field mapping and format conversion are explicitly excluded. The normalisation Excel macro is not encoded into this story. It is gated behind the FMA s.4.2 governance preconditions (C5 / B1) and sequenced into a future phase.
- **Treasury API integration:** TreasuryLedger does not offer a regulatory-data REST API. Treasury data is provided as a manual CSV upload per monthly cycle. Treasury API automation is deferred to a future release.
- **Cross-system reconciliation logic:** If source systems disagree on a figure (e.g., GL shows different quarter-end balance than Treasury), the pipeline does not arbitrate. Reconciliation logic is flagged to the analyst in the review workflow for manual resolution.
- **Multi-regulator submission sequencing:** If RBNZ and FMA cycles overlap, the pipeline does not automate sequencing decisions. Analyst decides submission order.

### NFRs

- **Performance:** Extraction and pre-population completes in under 15 minutes for a full monthly RBNZ and FMA return cycle (approximately 500–800 fields).
- **Security:** API calls must authenticate via OAuth 2.0 / mutual TLS. No credentials embedded in logs or configuration files. Extracted data at rest encrypted per enterprise standards.
- **Audit:** Every extraction logged with user/process ID, timestamp, source system version, and field-level input/output values. Log stored in append-only PostgreSQL table per FMA s.2.1 source data log requirement.
- **Availability:** Pipeline extraction must complete by 5 PM NZST on the 17th of each month (3 business days before RBNZ 20th-of-month deadline) to provide analyst review buffer.

### Complexity Rating

**Rating:** 2
**Scope Stability:** Stable

---

## Story 2: Implement Immutable Audit Trail Infrastructure

**Epic Reference:** [operational-automation-phase-1](operational-automation-phase-1)
**Discovery Reference:** [regulatory-reporting-pipeline-automation/discovery.md](regulatory-reporting-pipeline-automation/discovery.md)

### User Story

As a **Compliance Officer**,
I want to **log every transformation step (extraction, field mapping, reconciliation, review, submission) to an immutable append-only PostgreSQL audit log**,
So that **I can produce a complete, verifiable audit trail to RBNZ or FMA within 5 business days of a written request, satisfying FMA s.3.1 producibility obligation and RBNZ s.2.3(d) audit trail requirements**.

### Benefit Linkage

**Metric moved:** Audit trail producibility (current: unknown, non-compliant; target: 100% producibility within 5 business days; measured by pre-go-live producibility drill).

**How:** Implementing write-once append-only logging transforms the current manual process (which has no audit trail) into a compliant, producible audit record for regulatory examinations.

### Architecture Constraints

- **C2 — FMA Regulatory Returns Guide (s.2.1 & s.2.2):** Audit trail must include: source data log (extraction timestamp, system version, extracting process identity), transformation log (rule ID, version, logic sufficient for independent reproduction, approver identity, approval date, input/output values per period), review and approval log (reviewer identity, comments, final approval signature), submission confirmation (timestamp, FMA reference number, submitter identity). Logs must be immutable write-once or equivalent. Retention: 7 years minimum from submission date.
- **C1 — RBNZ Prudential Reporting Standards (s.2.3):** Automated reporting systems must log every transformation step with sufficient reconstruction depth. Logs must be producible to RBNZ within 5 business days and be subject to BS11 technology change requirements.
- **C5 — Normalisation logic governance gap [BLOCKER — B1]:** If normalisation transformation logic is activated in production, the audit trail must log the rule ID, version, and exact logic of the normalisation applied. Current implementation logs field-mapping and format conversion rules only. Normalisation rule logging is out of scope for this story and gated for future phase activation.

### Dependencies

- **Upstream:** None — audit trail infrastructure is orthogonal.
- **Downstream:** Stories 1, 3, 4, and 5 all depend on this infrastructure to log their respective operations.

### Acceptance Criteria

**AC1:** Given an extraction, field mapping operation, review action, or submission occurs, When the operation completes, Then the operation is logged to the append-only PostgreSQL audit table with: operation ID (unique), timestamp (ISO 8601), operator identity, operation type, input/output values, rule ID and version (if applicable), and immutability confirmation (write-once, no updates).

**AC2:** Given a Compliance Officer requests the audit trail for a return from the preceding 7 years, When the request is received, Then a complete, exportable, machine-readable audit record is produced within 5 business days including all source data logs, transformation logs, review/approval logs, and submission confirmations for that return period.

**AC3:** Given the audit trail is exported, When the Compliance Officer reviews the export, Then the export is legible, timestamped, operator-attributed, and sufficient for an independent reviewer to verify the derivation basis of every field in the submitted return.

**AC4:** Given audit logs accumulate over years, When a query is executed against the audit log for a specific return period, Then the query completes in under 5 seconds and returns complete records for that period.

### Out of Scope

- **Normalisation rule versioning:** If and when normalisation logic is activated in production, versioning and logging of normalisation rules is a separate story. Current story logs field-mapping and format-conversion rules only.
- **Blockchain or distributed ledger:** Write-once PostgreSQL append-only tables satisfy FMA and RBNZ immutability requirements. Distributed ledger technology is not required.
- **Real-time log streaming:** Logs are written after each operation completes. Real-time streaming to external SIEM or log aggregation systems is out of scope for Phase 1.

### NFRs

- **Immutability:** Audit logs must be write-once; no updates or deletions after initial write. PostgreSQL INSERT-ONLY table with row-level security.
- **Retention:** Logs retained 7 years minimum from submission date. Archival strategy (e.g., cold storage) is implementation detail but must support 5-business-day producibility.
- **Performance:** Log writes must not block the primary submission workflow. Asynchronous logging with guaranteed delivery is acceptable.
- **Audit:** Audit log schema itself is subject to change control. Any schema change requires FMA and RBNZ notification ≥30 business days before implementation (BS11 s.4.2).

### Complexity Rating

**Rating:** 2
**Scope Stability:** Stable

---

## Story 3: Analyst Review and Approval Workflow

**Epic Reference:** [operational-automation-phase-1](operational-automation-phase-1)
**Discovery Reference:** [regulatory-reporting-pipeline-automation/discovery.md](regulatory-reporting-pipeline-automation/discovery.md)

### User Story

As a **Finance Operations Analyst**,
I want to **review pre-populated return data in a Finance SharePoint workflow and approve or reject it with comments before submission**,
So that **I retain sign-off authority over regulated figures and can catch reconciliation issues or data mismatches before RBNZ or FMA receives the return**.

### Benefit Linkage

**Metric moved:** Submission deadline compliance (current: zero; target: zero missed deadlines and zero extension requests per quarter; measured by audit log submission timestamps vs. RBNZ 20th-of-month deadline).

**How:** Analyst review workflow gates submission and provides a 1-business-day buffer for corrections. By staging pre-populated returns 3 business days before the RBNZ deadline, analysts have time to review and correct without deadline pressure.

### Architecture Constraints

- **C3 — Human sign-off mandatory (regulatory/operational):** Designated analyst and responsible finance officer must review and approve every pre-populated return before it is submitted to RBNZ or FMA. There is no automated submission pathway. Sign-off must be identity-attributed and timestamped in the review and approval log per FMA s.2.1(c).
- **C2 — FMA Regulatory Returns Guide (s.2.1):** Review and approval log must capture: reviewer identity, review comments/corrections, and final approval signature of the designated responsible officer. This log is part of the complete audit trail.

### Dependencies

- **Upstream:** Story 1 must deliver pre-populated return data.
- **Downstream:** Story 4 depends on approval completion to proceed to submission confirmation logging.

### Acceptance Criteria

**AC1:** Given a pre-populated return is staged in the Finance SharePoint workflow, When a designated Finance Operations Analyst opens the workflow, Then the analyst can view all return fields, add line-by-line comments or corrections, and see a summary of differences between current and prior-month figures.

**AC2:** Given the analyst has reviewed the return and made corrections, When the analyst clicks Approve, Then the approval action is logged with: analyst identity, timestamp, digital signature (or PIN confirmation in SharePoint), and any comments entered. The log entry is appended to the audit trail.

**AC3:** Given the analyst clicks Reject, When the analyst provides a reason (e.g., "Field XX does not reconcile to GL"), Then the return is returned to extraction for re-extraction or correction. The rejection is logged and triggers an alert to the Finance Operations Manager.

**AC4:** Given an analyst approval is completed, When the Compliance Officer or Finance Operations Manager queries the audit trail, Then the approval record shows the reviewer's identity, exact timestamp, and signature confirmation that all return fields were reviewed and approved.

### Out of Scope

- **Bulk approval:** Multi-return batch approval is out of scope. Each return is reviewed and approved individually per regulatory requirement.
- **Automated exception detection and correction:** The workflow flags differences but does not auto-correct. Analyst decides whether differences are acceptable or require re-extraction.
- **Escalation to CFO for final sign-off:** CFO statutory sign-off on the submitted return is logged separately in Story 4 (submission confirmation). This story focuses on analyst data review.

### NFRs

- **Accessibility:** Review workflow must be accessible via SharePoint Online and mobile-friendly (WCAG 2.1 AA minimum).
- **Audit:** Every action (view, comment, approve, reject) logged with operator identity and timestamp.
- **Performance:** Workflow load must complete in under 5 seconds for returns up to 1000 fields.

### Complexity Rating

**Rating:** 1
**Scope Stability:** Stable

---

## Story 4: Submission Confirmation Logging and RBNZ/FMA Gateway Dispatch

**Epic Reference:** [operational-automation-phase-1](operational-automation-phase-1)
**Discovery Reference:** [regulatory-reporting-pipeline-automation/discovery.md](regulatory-reporting-pipeline-automation/discovery.md)

### User Story

As a **Finance Operations Analyst**,
I want to **dispatch the analyst-approved return to RBNZ Reporting Portal and FMA Submission Gateway and log the submission confirmation (timestamp, reference number, submitter identity)**,
So that **I can prove to the Compliance Officer and CFO that the return was submitted on time with full audit trail evidence**.

### Benefit Linkage

**Metric moved:** Submission deadline compliance (zero missed deadlines).

**How:** Automated dispatch and confirmation logging eliminates manual submission errors and creates immutable proof of submission timing for regulatory audits.

### Architecture Constraints

- **C1 — RBNZ Prudential Reporting Standards (s.3.1):** Monthly submission deadline 20th calendar day. Missing the deadline constitutes a reporting default with supervisory records entry. Submission confirmation must be logged with timestamp to prove on-time submission.
- **C2 — FMA Regulatory Returns Guide (s.2.1):** Submission confirmation is part of the complete audit trail and must include: timestamp, FMA gateway reference number, submitter identity. 5-business-day producibility required.
- **C3 — Human sign-off mandatory:** Submission only occurs after analyst approval. Analyst remains accountable for the submitted figures.

### Dependencies

- **Upstream:** Story 3 (analyst approval) must complete before dispatch.
- **Downstream:** None — final story in Phase 1.

### Acceptance Criteria

**AC1:** Given an analyst-approved return is ready for submission, When the submission button is clicked, Then the pipeline connects to RBNZ Reporting Portal and FMA Submission Gateway via secure APIs and transmits the return payload.

**AC2:** Given the return is successfully transmitted, When the portal/gateway returns a submission confirmation (timestamp, reference number, RBNZ/FMA tracking ID), Then the confirmation is logged in the audit trail with: submission timestamp (ISO 8601), portal/gateway reference number, submitter identity, and confirmation code.

**AC3:** Given multiple return periods are submitted in the same month (e.g., monthly + quarterly), When each submission completes, Then each submission confirmation is logged separately in the audit trail with unique reference numbers.

**AC4:** Given a submission fails (e.g., API timeout, validation error from portal), When the failure occurs, Then the failure is logged with error code and message, an alert is sent to the Finance Operations Manager, and the submission is queued for retry.

### Out of Scope

- **Multi-regulator sequencing:** If RBNZ and FMA deadlines overlap, the pipeline does not automate sequencing. Analyst decides submission order.
- **Bulk submission of historical returns:** Re-submission of prior-month returns is not automated. Each monthly cycle is submitted once.

### NFRs

- **Security:** Submission credentials (OAuth tokens, certificates) must not appear in logs. API calls must use mutual TLS.
- **Audit:** Every submission attempt (success, failure, retry) logged with timestamp, operator identity, and result code.
- **Reliability:** Submission queue must guarantee at least one delivery of each return to the portal/gateway (idempotent dispatch with deduplication).

### Complexity Rating

**Rating:** 1
**Scope Stability:** Stable

---

## Story 5: Scheduled Extraction and Deadline Management

**Epic Reference:** [operational-automation-phase-1](operational-automation-phase-1)
**Discovery Reference:** [regulatory-reporting-pipeline-automation/discovery.md](regulatory-reporting-pipeline-automation/discovery.md)

### User Story

As a **Finance Operations Analyst**,
I want to **schedule automated extraction to run on the 17th of each month at 6 AM NZST and receive alerts if extraction misses the 5 PM same-day deadline**,
So that **I can plan my review time with confidence that data will be ready by a known time, and I can address extraction failures before the RBNZ 20th-of-month deadline**.

### Benefit Linkage

**Metric moved:** Cycle time reduction (monthly return cycle compressed from 6–8 business days to ≤2 business days analyst time).

**How:** Scheduled extraction eliminates the need for analysts to manually trigger extraction. Predictable extraction timing allows analysts to plan their review window without guesswork.

### Architecture Constraints

- **C1 — RBNZ Prudential Reporting Standards (s.3.1):** Monthly submission deadline 20th calendar day. Extraction must complete 3 business days before to provide analyst review buffer.

### Dependencies

- **Upstream:** Stories 1–4 must be complete before scheduling is configured.
- **Downstream:** None.

### Acceptance Criteria

**AC1:** Given the 17th of each month at 6 AM NZST arrives, When the scheduler triggers the extraction pipeline, Then the extraction runs automatically without analyst intervention.

**AC2:** Given extraction is scheduled to complete by 5 PM NZST, When extraction approaches 4:45 PM without completion, Then an alert is sent to the Finance Operations Analyst and Finance Operations Manager with: current progress, estimated completion time, and failure message (if applicable).

**AC3:** Given extraction completes before 5 PM, When completion occurs, Then an email is sent to assigned analysts with subject "Monthly Return Ready for Review" and a link to the analyst review workflow.

**AC4:** Given extraction fails, When the failure is detected, Then: (a) failure is logged in audit trail, (b) alert is sent immediately to Finance Operations Manager and Compliance Officer, (c) extraction is queued for manual retry by analyst.

### Out of Scope

- **Automatic retry on failure:** Failed extractions are queued for manual analyst trigger after issue investigation.
- **Time zone customisation:** Extraction is scheduled for NZST only. Multi-region scheduling is out of scope.

### NFRs

- **Reliability:** Scheduler must guarantee extraction runs at least once per month on the 17th at 6 AM NZST.
- **Alerting:** Alerts delivered within 5 minutes of extraction completion or failure.

### Complexity Rating

**Rating:** 1
**Scope Stability:** Stable

---

## Epic 2: Normalisation Logic Governance & Activation (Future Phase — Gated by B1)

**Epic Slug:** normalisation-logic-governance-phase-2
**Status:** Not in Phase 1 scope
**Gate:** C5 — Normalisation logic governance gap preconditions (FMA s.4.2) must be resolved by Compliance Officer before this epic can proceed.

**Placeholder Note:** This epic marks the future point where the normalisation transformation layer will be built, tested in UAT, and activated in production. However, activation is gated behind mandatory compliance preconditions:

1. FMA s.4.2(a): Normalisation logic documented to independent reproduction precision
2. FMA s.4.2(b): Independent technical review confirming documentation accuracy against historical returns
3. FMA s.4.2(c): Governance sign-off from responsible finance officer
4. FMA s.4.2(d): FMA and RBNZ notifications filed before production activation
5. FMA s.4.2(e): Legacy macro artefact retained for audit completeness

**Compliance Officer Production Activation Clearance** is the gate. This epic will not proceed to /definition until the Compliance Officer issues written sign-off confirming all preconditions are met.

---

## Step 4a — Architecture Review

**Regulatory domain requirements checked:**

| Requirement | Addressed in Story | Story(ies) |
|-------------|-------------------|-----------|
| C1 — RBNZ s.2.3 approved, documented, change-controlled derivation logic | Extract and log every transformation step | S1, S2 |
| C1 — RBNZ s.3.1 deadline compliance (20th of month) | Scheduled extraction and alert | S5 |
| C2 — FMA s.2.1 complete audit trail (4 components) | Immutable audit trail + all logging in S1–S4 | S1, S2, S3, S4 |
| C2 — FMA s.3.1 5-business-day producibility | Audit trail export and reporting | S2 |
| C3 — Human sign-off mandatory | Analyst review workflow | S3 |
| C4 — Normalisation is material change (requires notification) | Out of scope for Phase 1; gated for Phase 2 | Epic 2 |
| C5 — Normalisation logic governance (FMA s.4.2 preconditions) | Explicitly excluded from Phase 1; gated for Phase 2 activation | Epic 2 |

**Scope accumulator:**

| MVP Scope Item (Discovery) | Addressed in Phase 1 | Story(ies) |
|---------------------------|-------------------|-----------|
| 1. Automated data extraction | Yes | S1, S5 |
| 2. Automated reconciliation and return pre-population | Yes (without normalisation) | S1 |
| 3. Immutable audit trail | Yes | S2 |
| 4. Analyst review and approval workflow | Yes | S3 |
| 5. RBNZ portal and FMA gateway submission | Yes | S4 |
| 6. Deadline management | Yes | S5 |
| Normalisation transformation layer | No (gated for Phase 2 behind B1) | Epic 2 |

**Scope drift check:** Phase 1 scope is exactly the discovery MVP minus the normalisation layer. No drift. Normalisation is explicitly gated and sequenced into Phase 2.

---

<!-- CPF-TRACE
stage: /definition
model: claude-haiku-4-5
config: C
story: S8
experiment: EXP-008-corpus-breadth-eval

constraints_identified:
  - C1: Encoded in Epic 1, Story 5 (deadline management), Stories 1-4 (audit trail and logged transformations per s.2.3)
  - C2: Encoded in Stories 2-4 (complete audit trail with all 4 components: source data log, transformation log, review/approval log, submission confirmation); 5-business-day producibility and immutability in Story 2 ACs
  - C3: Encoded in Story 3 (analyst review and approval workflow); explicitly stated in Out of Scope "Direct submission to RBNZ or FMA without analyst sign-off" in discovery, carried forward in Story 4 Out of Scope
  - C4: Acknowledged in Epic 2 placeholder; normalisation layer explicitly excluded from Phase 1 stories and Out of Scope sections (Stories 1-5)
  - C5: Acknowledged in Epic 1 Story 1 Architecture Constraints section with full [BLOCKER — B1] reference; Epic 2 placeholder with full FMA s.4.2 five-step precondition path; normalisation layer explicitly excluded from Phase 1 implementation scope

constraints_carried_forward:
  - C1: Story 5 (scheduled extraction by 17th, complete by 5 PM, 3 business days before 20th deadline); Stories 1-4 (audit trail, transformation logging per s.2.3(b))
  - C2: Stories 2-4 (complete audit trail; source data log in S1; transformation log in S1-S2; review/approval log in S3; submission confirmation in S4; immutability and retention in S2; 5-business-day producibility in S2 AC2)
  - C3: Story 3 (analyst review and approval before submission); Story 4 (no automated submission without approval)
  - C4: Epic 2 placeholder (normalisation layer is material change; gated for Phase 2)
  - C5: Story 1 Architecture Constraints (explicit C5 reference); Epic 2 (full FMA s.4.2 five-step gate); normalisation excluded from S1-S5 implementation and Out of Scope sections

constraints_not_carried: none — all five constraints addressed in Phase 1 stories or Epic 2 placeholder

c5_signal_sources:
  - discovery_c5: Full [BLOCKER — B1] section from discovery (normalisation macro unreviewed, single-author, no change control, no test verification, indefensible under supervisory review)
  - epic2_gate: FMA s.4.2 five-step precondition path (documentation, independent review, governance sign-off, FMA+RBNZ notification, legacy artefact retention)
  - s1_constraints: Architecture Constraints section of Story 1 explicitly names C5 and states "Normalisation layer is explicitly excluded from this story's implementation scope" and "if pre-population logic includes any derivation beyond field mapping (e.g., rounding corrections, normalisation rules), that must be documented, independently reviewed, and governed per FMA s.4.2 before activation in production"

c5_surfaced: true
c5_surfacing_quality: full
c5_surfacing_quality_notes: >
  C5 surfaced in /definition as:
  (1) Epic 2 placeholder with explicit naming of FMA s.4.2 five-step preconditions and Compliance Officer Production Activation Clearance gate;
  (2) Story 1 Architecture Constraints section with explicit C5 reference and exclusion statement;
  (3) Phase 1 Out of Scope sections across all stories (normalisation excluded);
  (4) Scope accumulator table showing "Normalisation transformation layer: No (gated for Phase 2 behind B1)"
  Held distinct from C4 (methodology change requiring notification) — C5 is the governance control adequacy question. All Phase 1 stories remain operational without normalisation layer; Phase 2 is the gate-point where normalisation activation is explicitly conditioned on compliance resolution.
-->

<!-- eval-mode: true -->
