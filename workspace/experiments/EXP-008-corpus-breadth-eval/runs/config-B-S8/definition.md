# Definition: Automated Regulatory Reporting Pipeline — RBNZ Prudential and FMA Returns

**Feature:** regulatory-reporting-pipeline-automation
**Discovery status:** Approved (eval-mode — read from disk: `runs/config-B-S8/discovery.md`)
**Benefit-metric:** NOT PRESENT — experimental simplification for EXP-008 CPF measurement (success indicators from discovery carried into stories)
**Model:** claude-opus-4-6 (Config B — Opus front-loaded)
**Date:** 2026-05-17
**Run:** EXP-008 Config B S8

---

## Step 0 — Entry condition check (eval-mode)

- Discovery artefact: ✅ read from disk (`runs/config-B-S8/discovery.md`, status: Approved, eval-mode)
- Context injection files active throughout: ✅ `S8-ea-registry-regulatory-reporting-pipeline.md`, `S8-rbnz-fma-policy-doc.md`
- Benefit-metric artefact: ⚠️ NOT PRESENT — experimental simplification

**Constraints carried in from discovery (verbatim from discovery CPF-TRACE):**
- C1 — RBNZ Prudential Reporting Standards: prescribed return formats and field definitions; monthly submission deadline (20th); s.2.1 prior written notification for any adjusted derivation methodology; s.2.2 normalisation = methodology adjustment + s.2.2 historical self-disclosure obligation + s.93 disclosure exposure; s.2.3 automated reporting system requirements (approved change-controlled logic, transformation log reconstruction depth, 7-year retention, 5-business-day producibility, subject to BS11); s.3.1 reporting-default mechanics; BS11 s.4.2 ≥30 business days advance notification for material technology change.
- C2 — FMA Financial Reporting Act 2013 / Regulatory Returns Guide 2022: complete audit trail with source data log, transformation log (rule ID/version/logic/approver/input/output), review and approval log, submission confirmation; s.2.2 write-once or equivalent immutability; s.2.3 methodology documentation current and producible; s.3.1 5-business-day producibility for any return in preceding 7 years; s.4.1 formal change management for all derivation logic (explicitly including Excel macros).
- C3 — Human sign-off mandatory: designated finance officer / analyst approval required before any submission; no auto-submission pathway; identity-attributed and timestamped review and approval log.
- C4 — Normalisation = material figure-derivation change: classified under RBNZ s.2.2 as methodology adjustment; also a BS11 s.4.2 material technology change.
- C5 — Normalisation logic governance gap: single-author 2019 Excel macro; no independent review; no change-control history; no test suite; comprehensibility concentrated in one person; encoding into a regulated pipeline transforms a historical audit gap into a forward-looking active control failure and converts key-person risk into key-system risk.

**Architecture constraints scan:** EA registry (RRPL) entry reviewed. All upstream interfaces (RRPL-UP-001 CoreBanking-GL, RRPL-UP-002 TreasuryLedger, RRPL-UP-003 CardPlatform) declared read-only; no write-back permitted. Downstream submission interfaces (RRPL-DN-001 RBNZ Reporting Portal, RRPL-DN-002 FMA Submission Gateway) operate only after designated finance officer sign-off — gateway integration must contain no auto-submission code path. Audit log (RRPL-AUD-001) is PostgreSQL write-once / immutable design. Analyst staging (RRPL-AUD-002) is SharePoint Online. RRPL-RISK-001 fixes TreasuryLedger ingestion to manual CSV. RRPL-RISK-002 establishes the normalisation governance gap requiring the FMA s.4.2 five-step remediation. RRPL-RISK-003 creates the historical RBNZ disclosure obligation. No additional platform-level guardrails required beyond those EA constraints.

**Slicing strategy:** Risk-first (Strategy 4). The B1, B2, and B3 blockers from discovery establish a mandatory critical path. Epic 1 (Regulatory Compliance Gate) contains the governance and disclosure delivery items that must complete before the normalisation transformation can run in production. Epic 1 stories are governance deliverables — they carry explicit ACs, named owners, named gate-owner approvers, and explicit document-artefact deliverables that downstream automated CI/CD checks read. Engineering work on Stories 2.1, 2.2, 2.4, 3.1, and 3.2 may proceed in parallel with Epic 1 in UAT, because none of those stories encode or activate the normalisation transformation. Story 2.3 (Normalisation Transformation Engine) MAY be implemented in UAT but MUST NOT activate in production until Stories 1.1, 1.2, and 1.3 are all complete and the `NORMALISATION_LAYER_APPROVED` deployment flag is set to `true` by the named Compliance Officer.

**Scope accumulator (against discovery MVP):** Eight stories across three epics. Story count maps to MVP scope items as follows: MVP item 1 → Story 2.1; MVP item 2 → Story 2.2; MVP item 3 → Story 2.3 (gated on Epic 1); MVP item 4 → Story 2.4; MVP item 5 → Story 3.1; MVP item 6 → Story 3.2. Compliance preconditions B1/B2/B3 → Stories 1.1/1.2/1.3. No scope additions beyond the discovery MVP. No stories added for out-of-scope items (treasury vendor API, FMA Annual Financial Statements return, retroactive correction, real-time reporting). Scope drift: none detected.

---

## Step 4a — Regulated Constraint Audit and Gate Owner Assignment

### Regulated constraints identified in discovery

| Constraint | Type | Regulatory source | Default oversight |
|-----------|------|-------------------|--------------------|
| C1 | Regulatory (RBNZ Act 2021, Deposit Takers Act 2023, BS11) | RBNZ Prudential Reporting Standards s.2.1, s.2.2, s.2.3, s.3.1, s.4.2; s.93 RBNZ Act 2021 | HIGH |
| C2 | Regulatory (Financial Reporting Act 2013) | FMA Regulatory Returns Guide 2022 s.2.1, s.2.2, s.3.1, s.4.1, s.4.2 | HIGH |
| C3 | Regulatory/operational | RBNZ + FMA submission protocols; FMA s.2.1(c) review and approval log | HIGH |
| C4 | Regulatory (derivative of C1) | RBNZ Prudential Reporting Standards s.2.2; BS11 s.4.2 | HIGH |
| C5 | Hidden governance gap (regulated control adequacy) | FMA Regulatory Returns Guide 2022 s.4.1 + s.4.2; RBNZ Prudential Reporting Standards s.2.3 | HIGH |

### Story-to-constraint trigger table with named gate owners

For each (constraint, story) pair where the story triggers the constraint, the table names the **Gate Owner** — the specific role accountable for confirming the constraint is satisfied before that story is allowed to deliver to production. The Gate Owner is the single named approver; concurrence parties (where required) are listed in parentheses. Where a story is not gated by a constraint, the cell is "—".

| Story | C1 (RBNZ) | C2 (FMA audit trail) | C3 (human sign-off) | C4 (methodology change) | C5 (governance gap) |
|-------|-----------|----------------------|---------------------|--------------------------|----------------------|
| 1.1 RBNZ notifications & self-disclosure | **PRIMARY** — Gate Owner: Compliance Officer (concurrence: CFO for self-disclosure) | — | — | **PRIMARY** — Gate Owner: Compliance Officer | — |
| 1.2 Normalisation logic review & change control | — | Gate Owner: Compliance Officer (rule version tag referenced in transformation log) | — | Gate Owner: Compliance Officer (governance preconditions to encoding) | **PRIMARY** — Gate Owner: Compliance Officer (concurrence: Finance Operations Manager; review signature: Independent Technical Reviewer) |
| 1.3 Pre-launch audit trail producibility drill | — | **PRIMARY** — Gate Owner: Compliance Officer | — | — | — |
| 2.1 CoreBanking-GL + CardPlatform extraction | — | Gate Owner: Engineering Lead (source-data-log component delivered) | — | — | — |
| 2.2 Treasury manual CSV ingestion | — | Gate Owner: Engineering Lead (concurrence: Treasury Operations Manager for confirmation-artefact protocol) | — | — | — |
| 2.3 Normalisation transformation engine | Gate Owner: Compliance Officer (production activation flag) | Gate Owner: Engineering Lead (transformation log completeness — concurrence: Compliance Officer for FMA s.2.1(b) field set) | — | Gate Owner: Compliance Officer (encoding gated on B1/B2 completion) | Gate Owner: Compliance Officer (NORMALISATION_LAYER_APPROVED flag) |
| 2.4 Pre-populated return file generation | Gate Owner: Finance Operations Manager (RBNZ format conformance) | Gate Owner: Engineering Lead (audit trail linkage from return file to log) | — | — | — |
| 3.1 Analyst review, sign-off, and submission | Gate Owner: Finance Operations Manager (submission gateway integration verified non-auto-submitting) | Gate Owner: Engineering Lead (review and approval log component) | **PRIMARY** — Gate Owner: Finance Operations Manager (concurrence: CFO for designated signatory protocol) | — | — |
| 3.2 Immutable audit log and 7-year retention | — | **PRIMARY** — Gate Owner: Engineering Lead (concurrence: Compliance Officer for FMA s.3.1 producibility certification) | — | — | — |

### Gate owner role definitions (single set referenced throughout the stories)

| Gate Owner role | Accountability | Cannot delegate |
|------------------|---------------|------------------|
| **Compliance Officer** | All RBNZ and FMA disclosure decisions; setting any deployment flag whose state affects regulatory disclosure (NORMALISATION_LAYER_APPROVED, BS11_NOTIFICATION_DATE); signing the producibility drill outcome; signing governance approvals required by FMA s.4.2(c). | Any decision to file or withhold a regulatory notification; any decision to set a deployment flag whose state affects regulatory disclosure. |
| **Finance Operations Manager** | Business ownership of the pipeline; joint signatory (with Compliance Officer) on the FMA s.4.2(c) normalisation governance approval; sign-off on the analyst review and submission workflow design; format conformance acceptance for the RBNZ return files. | Joint governance signature for normalisation logic encoding (FMA s.4.2(c)); designated-signatory protocol approval. |
| **CFO (or designated delegated signatory)** | Per-period statutory submission sign-off; concurrence on the s.2.2 historical self-disclosure (CFO is the named recipient of any RBNZ s.3.1 reporting-default notice). | Per-period submission sign-off (may be delegated to a named alternate signatory, recorded in deployment configuration). |
| **Independent Technical Reviewer** | The FMA s.4.2(b) independent technical review signature for the documented normalisation rule set. Must not be the original macro author. Appointed from Finance Risk or Internal Audit, or externally where no internal candidate is qualified. | The review report signature — cannot be the macro author or any party in the macro author's reporting line. |
| **Engineering Lead** | Implementation correctness of source extraction, transformation, audit logging, format validation, and submission gateway integration; ensuring the codebase contains no auto-submission pathway; ensuring deployment configuration enforces the regulatory-disclosure flags. | Any change that affects whether the deployment-gate flags are read or honoured by the running pipeline. |
| **Treasury Operations Manager** | Per-cycle treasury CSV reporting-coverage confirmation; documented approval artefact (Jira or SharePoint, not email). | Confirmation artefact protocol selection (must produce an attributable, persistent document reference). |

---

## Epic 1 — Regulatory Compliance Gate

**Purpose:** Establish the mandatory governance and disclosure preconditions that gate the build. Epic 1 stories are governance deliverables. They carry explicit ACs, named Gate Owners, named gate-owner approvers, and document-artefact deliverables that downstream CI/CD checks read at deployment time. Stories 2.1, 2.2, 2.4, 3.1, and 3.2 may be built and tested in UAT in parallel with Epic 1; Story 2.3 may be implemented in UAT but MUST NOT activate normalisation in production until Stories 1.1, 1.2, and 1.3 are complete and the `NORMALISATION_LAYER_APPROVED` flag is set to `true` by the Compliance Officer.

---

### Story 1.1 — RBNZ s.2.1 Methodology Notification, s.2.2 Historical Self-Disclosure, and BS11 s.4.2 Technology Change Notification

**As a** Compliance Officer
**I want** to file the three required RBNZ disclosures (prospective methodology notification, historical self-disclosure, and BS11 technology change notification) and receive RBNZ written acknowledgement before the automated pipeline goes live
**So that** the enterprise resolves its existing s.93 disclosure exposure and meets the prior-notification obligations for the new pipeline before any production return is prepared by the new system

**Acceptance Criteria:**

AC1: A formal RBNZ s.2.1 figure-derivation methodology notification document is prepared, signed by the Compliance Officer, and submitted via the RBNZ prudential reporting team's documented channel. The notification documents: (a) the normalisation transformation applied to CoreBanking-GL, TreasuryLedger, and CardPlatform source data before populating return fields; (b) the return fields affected (per-field breakdown for BS2, BS3, BS7); (c) before-and-after derivation methodology examples for each affected field; (d) the planned automated pipeline implementation date; (e) explicit acknowledgement that the methodology has been applied since 2019 without prior notification. The submitted document is filed in the Finance Compliance SharePoint folder with a stable document ID; the document ID is recorded in deployment configuration field `RBNZ_S21_NOTIFICATION_DOC_ID`. **Gate Owner: Compliance Officer.**

AC2: A historical self-disclosure document, per RBNZ Prudential Reporting Standards s.2.2 ("institutions that have been applying unapproved adjustments to source data in submitted returns are required to self-disclose"), is filed as either an integral section of the AC1 notification or a separately attached document referenced by document ID. The self-disclosure explicitly references the 2019 normalisation methodology, all return series and periods affected (BS2/BS3/BS7 from 2019 onward), and the period of unapproved application. The Compliance Officer signs the self-disclosure; the CFO co-signs as concurrence (CFO is the named recipient of any RBNZ s.3.1 reporting-default notice and so has standing on the historical position). The document ID is recorded in deployment configuration field `RBNZ_S22_SELFDISCLOSURE_DOC_ID`. **Gate Owner: Compliance Officer (CFO concurrence).**

AC3: A BS11 s.4.2 technology change notification is filed with RBNZ at least 30 business days before the planned production go-live date. The notification includes: (a) description of the automated pipeline and its scope; (b) the returns and specific fields affected; (c) before-and-after derivation methodology (referencing Story 1.2 documentation); (d) evidence of internal governance approvals (referencing the Story 1.2 independent review report and governance sign-off); (e) planned go-live date and rollback plan. The notification date is recorded in deployment configuration field `BS11_NOTIFICATION_DATE` (ISO 8601). The Compliance Officer signs and files the notification; the document ID is recorded in `BS11_NOTIFICATION_DOC_ID`. **Gate Owner: Compliance Officer.**

AC4: RBNZ written acknowledgement of the s.2.1 methodology notification (AC1) is received and filed in the Finance Compliance SharePoint folder; the acknowledgement document ID is recorded in `RBNZ_S21_ACK_DOC_ID`. If RBNZ initiates a retroactive methodology review following the self-disclosure (AC2), production go-live is blocked until the Compliance Officer files RBNZ's written review outcome with document ID recorded in `RBNZ_REVIEW_OUTCOME_DOC_ID`; if no review is initiated, the Compliance Officer records that fact in a signed memo and files the memo's document ID in the same field. **Gate Owner: Compliance Officer.**

AC5: A CI/CD pre-deployment gate runs at every production deployment attempt and rejects deployment if any of the following is unsatisfied: (a) `RBNZ_S21_NOTIFICATION_DOC_ID`, `RBNZ_S22_SELFDISCLOSURE_DOC_ID`, `BS11_NOTIFICATION_DOC_ID`, `RBNZ_S21_ACK_DOC_ID`, `RBNZ_REVIEW_OUTCOME_DOC_ID` all present and non-empty; (b) `BS11_NOTIFICATION_DATE` set and the planned deployment date is ≥30 business days after that date (business days = NZ business days excluding RBNZ-published holiday calendar). The gate emits a structured error naming the missing field(s) or the earliest allowable deployment date. Automated tests verify: (i) gate blocks deployment when any required field is null/empty; (ii) gate blocks deployment when fewer than 30 business days have elapsed since `BS11_NOTIFICATION_DATE`; (iii) gate passes when all fields are present and the 30-business-day minimum is satisfied; (iv) NZ holiday calendar is honoured in the business-day calculation. **Gate Owner: Engineering Lead (deployment gate implementation), with Compliance Officer as configuration owner of the gate inputs.**

**Architecture constraints:** C1 (RBNZ s.2.1, s.2.2, s.4.2, s.93 disclosure exposure — PRIMARY); C4 (normalisation as methodology adjustment under s.2.2 — PRIMARY); EA registry RRPL-RISK-003 (historical undisclosed normalisation). **Gate owners for this story: Compliance Officer (primary, AC1–AC4); Engineering Lead (deployment gate implementation, AC5); CFO concurrence (AC2 self-disclosure).**
**Oversight level:** HIGH.

---

### Story 1.2 — Normalisation Logic Documentation, Independent Technical Review, Change Control, and FMA s.4.2 Formalisation Notification

**As a** Compliance Officer
**I want** the existing normalisation logic documented to a reproducible standard, independently reviewed, governance-signed, version-controlled, and notified to the FMA before it is encoded into the automated pipeline
**So that** the enterprise satisfies FMA Regulatory Returns Guide 2022 s.4.2 and resolves the single-point-of-failure governance position described in RRPL-RISK-002 — bringing the rule set to the "approved, documented, change-controlled" standard required by RBNZ s.2.3 before it operates in a regulated production pathway

**Acceptance Criteria:**

AC1: The normalisation logic (currently the 2019 Excel macro) is documented in a written specification of sufficient precision for independent reproduction per FMA s.4.2(a). For each source field normalised, the documentation states: (a) source system and field name; (b) input condition triggering the normalisation; (c) transformation rule as a mathematical formula or conditional expression; (d) output effect on the return field value; (e) rationale (specific rounding artefact or timing mismatch from the 2019 migration). The original macro author authors the specification and signs an attestation that the documented rules accurately represent the macro as currently executed. The specification is stored in the engineering repository at path `docs/normalisation-rules-v1.0.0.md` with a stable commit reference. **Gate Owner: Finance Operations Manager (concurrence: original macro author for accuracy attestation).**

AC2: The Independent Technical Reviewer (a named individual from Finance Risk or Internal Audit, or an external party where no internal candidate qualifies — not the macro author and not in the macro author's reporting line) completes the FMA s.4.2(b) review. The reviewer produces a signed, dated review report stating: (a) the documented logic accurately represents the transformation applied to historical returns; (b) the transformation rules are arithmetically correct; (c) any limitations, edge cases, or conditions under which the transformation may be incorrect are documented; (d) the reviewer's qualifications and the time spent on review. The report is filed in the Finance Compliance SharePoint folder; the document ID is recorded in deployment configuration field `INDEPENDENT_REVIEW_REPORT_DOC_ID`. **Gate Owner: Compliance Officer; review signature provided by the named Independent Technical Reviewer.**

AC3: A test suite covering the version-tagged normalisation rule set is implemented in the engineering repository and passes. The suite includes: (a) one positive test per documented rule, asserting the implementation matches the documented mathematical formula on representative inputs; (b) one boundary test per rule with non-trivial boundary behaviour; (c) one regression test per known edge case identified by the Independent Technical Reviewer in AC2; (d) a coverage assertion confirming every documented rule has at least one positive test. The test suite is the constructed control that brings the rule set to the RBNZ s.2.3 "approved" automated-system standard; its passing state is a hard precondition of the version tag `normalisation-rules-v1.0.0`. **Gate Owner: Engineering Lead (test suite implementation); Independent Technical Reviewer confirms edge cases identified in AC2 are covered.**

AC4: Finance Operations Manager and Compliance Officer jointly sign the FMA s.4.2(c) governance approval document. The document confirms: (a) the AC1 specification is accurate (per macro author attestation); (b) the AC2 independent review report has been received and accepted; (c) the AC3 test suite is passing on the rule set version being approved; (d) the rule set version being approved (`normalisation-rules-v1.0.0` or successor); (e) the approval date. The document is filed in the Finance Compliance SharePoint folder; the document ID is recorded in deployment configuration field `NORMALISATION_GOVERNANCE_APPROVAL_DOC_ID`. **Gate Owner: Compliance Officer; co-signature required from Finance Operations Manager.**

AC5: The FMA s.4.2(d) formalisation notification is prepared and submitted to FMA via the prudential / market conduct contact for the enterprise. The notification informs FMA that the normalisation logic previously applied informally (as an analyst-maintained Excel macro since 2019) is being formalised into an automated pipeline. The notification references: (a) the AC2 independent review report document ID; (b) the AC4 governance approval document ID; (c) the rule set version tag (`normalisation-rules-v1.0.0`); (d) the planned production activation date. The notification is coordinated with the BS11 notification from Story 1.1 AC3 so both regulators receive concurrent disclosure. The Compliance Officer signs and submits; the document ID is recorded in deployment configuration field `FMA_S42_NOTIFICATION_DOC_ID`. **Gate Owner: Compliance Officer.**

AC6: The legacy Excel macro is retained in the Finance Compliance SharePoint folder alongside the version-tagged formalised rule set, per FMA s.4.2(e) ("documented legacy logic retained alongside formalised version for audit completeness"). The macro file's document ID is recorded in deployment configuration field `LEGACY_MACRO_DOC_ID`. **Gate Owner: Compliance Officer.**

AC7: A CI/CD pre-deployment gate at every production deployment attempt rejects deployment if any of `INDEPENDENT_REVIEW_REPORT_DOC_ID`, `NORMALISATION_GOVERNANCE_APPROVAL_DOC_ID`, `FMA_S42_NOTIFICATION_DOC_ID`, `LEGACY_MACRO_DOC_ID` is null/empty, OR if the AC3 test suite is not passing on the rule set version referenced in deployment configuration. The gate emits a structured error naming the missing field or failing test. Automated tests verify the gate behaviour for each missing-field and test-suite-failing scenario. **Gate Owner: Engineering Lead (gate implementation); Compliance Officer (configuration ownership).**

**Architecture constraints:** C5 (normalisation logic governance gap — PRIMARY); C2 (rule ID and rule version referenced in transformation log per FMA s.2.1(b)); C4 (change control as prerequisite to encoding the methodology); FMA s.4.2(a)–(e); RBNZ s.2.3 (approved/documented/change-controlled standard for automated systems); EA registry RRPL-RISK-002. **Gate owners for this story: Compliance Officer (primary for AC2, AC4, AC5, AC6); Finance Operations Manager (AC1 author concurrence, AC4 co-signature); Independent Technical Reviewer (AC2 review signature); Engineering Lead (AC3, AC7).**
**Oversight level:** HIGH.

---

### Story 1.3 — Pre-Launch Audit Trail Producibility Drill

**As a** Compliance Officer
**I want** the FMA s.3.1 5-business-day producibility standard to be demonstrated on a UAT submission cycle before the pipeline goes to production
**So that** the enterprise has signed evidence that the audit trail meets FMA's "complete, legible, exportable, sufficient for independent verification" definition before any production return is submitted

**Acceptance Criteria:**

AC1: A complete UAT submission cycle is executed for one simulated reporting period, exercising source extraction (Stories 2.1, 2.2), normalisation transformation with the version-tagged rule set (Story 2.3 in UAT), return file generation (Story 2.4), analyst review and sign-off (Story 3.1), and audit log writes (Story 3.2). The UAT submission is not dispatched to RBNZ or FMA — the submission step is mocked at the gateway boundary. **Gate Owner: Engineering Lead (cycle execution); Compliance Officer (cycle scope acceptance).**

AC2: A simulated FMA producibility request is raised against the UAT submission. The Compliance Officer requests the complete audit trail for one specific return field. The pipeline's audit-trail export function produces the trail as a machine-readable file (JSON or CSV — format documented in the export specification). The export completes within 5 business days, measured from the simulated request date — Compliance Officer records start and end timestamps in the drill record. **Gate Owner: Compliance Officer.**

AC3: The exported audit trail is reviewed by the Compliance Officer (acting in the simulated examiner role) and confirmed to be: (a) complete (every FMA s.2.1 component present — source data log, transformation log, review and approval log, submission confirmation); (b) legible (parsable and readable by a competent reviewer without further system access); (c) exportable (the file produced is independent of the pipeline runtime — can be archived and re-opened); (d) sufficient for independent verification of the specified return field value (a reviewer can reproduce the figure from the trail without access to the source systems). Each criterion is signed off line-by-line in the drill record. **Gate Owner: Compliance Officer.**

AC4: The drill outcome is documented in a signed Compliance Officer record stored in the Finance Compliance SharePoint folder. If any criterion in AC3 fails, the drill is marked failed and re-run after remediation; production go-live remains blocked until a passing drill record is filed. The passing drill document ID is recorded in deployment configuration field `PRODUCIBILITY_DRILL_PASS_DOC_ID`. **Gate Owner: Compliance Officer.**

AC5: A CI/CD pre-deployment gate at every production deployment attempt rejects deployment if `PRODUCIBILITY_DRILL_PASS_DOC_ID` is null/empty. The gate emits a structured error naming the missing field. Automated tests verify the gate blocks deployment when the field is unset and passes when set. **Gate Owner: Engineering Lead (gate implementation); Compliance Officer (configuration ownership).**

**Architecture constraints:** C2 (FMA s.3.1 producibility standard — PRIMARY; FMA s.2.1 audit trail completeness verified end-to-end). **Gate owners for this story: Compliance Officer (primary for AC2, AC3, AC4); Engineering Lead (AC1 cycle execution, AC5 gate implementation).**
**Oversight level:** HIGH.

---

## Epic 2 — Automated Pipeline Core

**Purpose:** Build the source extraction, transformation, and return-file generation components. Stories 2.1, 2.2, and 2.4 may be built and tested in UAT in parallel with Epic 1. Story 2.3 requires Epic 1 Stories 1.1 and 1.2 complete and the `NORMALISATION_LAYER_APPROVED` flag set in production deployment configuration before normalisation may execute in production.

---

### Story 2.1 — Source Data Extraction via Read-Only CoreBanking-GL and CardPlatform REST APIs

**As a** finance operations analyst
**I want** the pipeline to extract required return fields from CoreBanking-GL and CardPlatform automatically
**So that** manual data extraction from two of the three source systems is eliminated, with a source data log meeting FMA s.2.1(a) requirements

**Acceptance Criteria:**

AC1: The pipeline authenticates to CoreBanking-GL (RRPL-UP-001) and CardPlatform (RRPL-UP-003) using read-only service accounts. Write-scope is excluded from any service account token request. Integration tests verify that (a) no write-scope token is ever requested and (b) any attempted write-scope API call returns a 403 from the source system. **Gate Owner: Engineering Lead.**

AC2: Each pipeline run writes a source data log entry per source system to the audit log (Story 3.2) before any transformation step executes. The entry contains: source system name, interface ID (RRPL-UP-001 or RRPL-UP-003), API version queried, extraction timestamp (ISO 8601 with timezone), reporting period start and end date, complete list of fields extracted, SHA-256 hash of the extracted payload, pipeline run ID. **Gate Owner: Engineering Lead.**

AC3: The extraction step validates completeness against a stored mandatory-field inventory per return form (BS2, BS3, BS7). If any mandatory field is missing from the extracted payload, the pipeline run fails with a structured error naming the specific missing fields and the affected return form. The run does not proceed to the transformation step. Automated tests verify the failure path for one missing-field scenario per return form. **Gate Owner: Engineering Lead.**

AC4: Transient API failures are retried with exponential backoff: initial delay 5 seconds, doubling, maximum 60 seconds, capped at 3 attempts. After 3 consecutive failures, the pipeline writes a structured failure entry to the audit log (source system, failure type, retry count) and sends an alert via the operations alerting channel to the finance operations manager. No partial run state remains. Automated tests verify the retry sequence, the audit log entry on exhaustion, and the alert dispatch. **Gate Owner: Engineering Lead.**

**Architecture constraints:** C2 (source data log per FMA s.2.1(a) — concurrence: Compliance Officer for FMA field set); EA registry RRPL-UP-001 and RRPL-UP-003 read-only constraint. **Gate owners for this story: Engineering Lead (AC1–AC4); Compliance Officer (concurrence on FMA s.2.1(a) field set).**
**Oversight level:** MEDIUM.

---

### Story 2.2 — Treasury Manual CSV Extract Ingestion

**As a** finance operations analyst
**I want** the pipeline to ingest treasury data from a versioned manual CSV produced by Treasury Operations
**So that** treasury data can be included in automated return generation while RRPL-RISK-001 (no vendor regulatory-data API) remains active

**Acceptance Criteria:**

AC1: The pipeline accepts a treasury CSV in a defined schema documented and version-controlled in the engineering repository at path `docs/treasury-csv-schema-v1.0.0.md`. Schema validation runs at ingestion. Files with missing mandatory columns, unexpected column types, or out-of-range values are rejected with a structured error identifying the failing fields and rows. Rejected files are not ingested and produce no audit log ingestion entry. **Gate Owner: Engineering Lead.**

AC2: Treasury Operations confirms CSV reporting-period coverage via a documented approval artefact — either a Jira Finance Change Board task ID or a SharePoint document ID. Email-only confirmation is not accepted. The pipeline stores the confirmation artefact reference in the audit log ingestion record. Ingestion is rejected if no valid confirmation artefact reference is provided in the request. Automated tests verify (a) acceptance with a Jira task ID, (b) acceptance with a SharePoint document ID, (c) rejection with no reference, (d) rejection with an email reference. **Gate Owner: Engineering Lead (concurrence: Treasury Operations Manager for protocol approval).**

AC3: The source data log entry for treasury ingestion records: source identifier (`TreasuryLedger-manual-extract`), interface ID (RRPL-UP-002), file ingestion timestamp (ISO 8601 with timezone), reporting period start and end date, SHA-256 hash of the CSV file, confirmation artefact reference ID, pipeline run ID. **Gate Owner: Engineering Lead.**

AC4: A process guide for Treasury Operations documenting the expected CSV schema, the reporting-period coverage requirement, the file submission channel, and the confirmation approval step is published and version-controlled alongside the schema spec. The pipeline release notes record the guide version in effect at each release. **Gate Owner: Treasury Operations Manager (guide content); Engineering Lead (guide versioning).**

**Architecture constraints:** C2 (source data log per FMA s.2.1(a)); EA registry RRPL-UP-002 (manual extract); RRPL-RISK-001 (no vendor API). **Gate owners for this story: Engineering Lead (AC1, AC3); Engineering Lead with Treasury Operations Manager concurrence (AC2); Treasury Operations Manager and Engineering Lead (AC4).**
**Oversight level:** MEDIUM.

---

### Story 2.3 — Normalisation Transformation Engine (Production-Gated on Epic 1)

**As a** finance operations analyst
**I want** the pipeline to apply the formalised, version-controlled normalisation rules to extracted source data
**So that** the manual correction step is eliminated and every transformation is logged with rule ID, rule version, input value, output value, and the identity of the rule version approver — in a form meeting FMA s.2.1(b) requirements

**Acceptance Criteria:**

AC1: The transformation engine loads normalisation rules exclusively from the version-tagged repository specification produced in Story 1.2 AC1 (`docs/normalisation-rules-v1.0.0.md` or successor). The rule version identifier is recorded in deployment configuration field `NORMALISATION_RULES_VERSION`. If the engine receives a transformation request and the rule set version in configuration does not match a version tag present in the repository, the run fails with a structured error identifying the requested version and the available versions. Automated tests verify the version-mismatch failure path. **Gate Owner: Engineering Lead.**

AC2: The `NORMALISATION_LAYER_APPROVED` deployment flag (configured in deployment configuration; defaults to `false`) is checked at pipeline startup. If `false`: (a) the engine writes a `normalisation_skipped` entry to the audit log recording the flag state, pipeline run ID, and timestamp; (b) the pipeline run aborts immediately and does not proceed to return file generation; (c) an alert is sent to the finance operations manager identifying the reason (governance flag not set). When `true`, normalisation executes using the rule set version in `NORMALISATION_RULES_VERSION`. The flag may be set to `true` in production deployment configuration only by the Compliance Officer (controlled by deployment-configuration access policy), and only after Story 1.2 AC4 (governance approval) and AC5 (FMA notification) are complete and their document IDs are present in deployment configuration. Automated tests verify (a) flag false → abort logged, no return file generated, alert dispatched; (b) flag true with version tag present → normalisation executes; (c) deployment-configuration access policy rejects flag-set attempts from non-Compliance-Officer principals (verified by the deployment configuration system's access log). **Gate Owner: Compliance Officer (flag setting); Engineering Lead (enforcement implementation).**

AC3: For each field normalised in a run, the transformation log entry written to the audit log records: (a) field name and source system; (b) input value (pre-normalisation); (c) rule ID; (d) rule version (e.g., `normalisation-rules-v1.0.0`); (e) human-readable description of the transformation logic applied — sufficient for independent reproduction per FMA s.2.1(b); (f) identity of the person who signed the FMA s.4.2(c) governance approval for this rule version (from Story 1.2 AC4); (g) output value (post-normalisation); (h) pipeline run ID; (i) ISO 8601 timestamp with timezone. The field set is reviewed and confirmed by the Compliance Officer against the FMA s.2.1(b) specification before this story is marked complete. **Gate Owner: Engineering Lead (implementation); Compliance Officer (field set concurrence).**

AC4: Each transformation step's log entry is written atomically with the transformation. If the audit log write fails, the pipeline run aborts immediately — no transformation may complete without a corresponding log entry, and no partial return file may be staged. Automated tests verify the abort path on simulated audit log write failure (e.g. PostgreSQL connection drop, write rejection). **Gate Owner: Engineering Lead.**

AC5: The test suite for this story includes: (a) a positive test for one normalisation rule asserting input X produces output Y when `NORMALISATION_LAYER_APPROVED=true`; (b) a flag-false test verifying abort, audit entry, and alert dispatch; (c) a transformation-log-completeness test asserting every normalisation step in a run produces a log entry with all nine AC3 fields populated; (d) a rule-version-mismatch test (engine configured with a version not present in the repository → pipeline failure); (e) a log-write-failure test (transformation proceeds, log write fails → run aborts, no return file generated). All five tests must pass before this story is marked complete. **Gate Owner: Engineering Lead.**

**Architecture constraints:** C5 (NORMALISATION_LAYER_APPROVED flag is the technical enforcement of the C5 governance gate — Compliance Officer controls the flag); C1 (normalisation executes only when RBNZ disclosure obligations from Story 1.1 are complete — enforced indirectly via the dependency on Story 1.2 governance approval, which itself depends on rule documentation and review); C2 (transformation log per FMA s.2.1(b) — Compliance Officer concurrence on field set); C4 (encoding gated on completion of B1 and B2 in Epic 1). **Gate owners for this story: Compliance Officer (AC2 flag setting, AC3 field set concurrence — non-delegable for AC2); Engineering Lead (AC1, AC2 enforcement, AC3 implementation, AC4, AC5).**
**Dependencies:** Stories 1.1 and 1.2 must be complete and `NORMALISATION_LAYER_APPROVED` set to `true` in production deployment configuration before this story activates in production. Story 3.2 (audit log) must be deployed and operational before this story runs in any environment.
**Oversight level:** HIGH.

---

### Story 2.4 — Pre-Populated Return File Generation

**As a** finance operations analyst
**I want** the pipeline to produce pre-populated RBNZ return files (BS2, BS3, BS7) and the FMA Statistical Return from extracted and normalised source data
**So that** analysts review and approve a complete pipeline-generated draft rather than manually populating each return field

**Acceptance Criteria:**

AC1: The pipeline generates return files in the RBNZ-prescribed format for BS2, BS3, BS7, and the FMA Statistical Return. Before staging a file for analyst review, the generated file is automatically validated against a stored format specification (field names, field types, field order, mandatory/optional classification, RBNZ-prescribed checksum or schema if applicable). A format-validation failure aborts the run and emits a structured error naming the non-conforming fields and the return form. No partially validated file is staged. Automated tests verify the validation path for one missing-field, one wrong-type, and one out-of-order scenario per return form. **Gate Owner: Engineering Lead (validation implementation); Finance Operations Manager (format conformance acceptance).**

AC2: Each pre-populated return file's metadata header references its source data extract pipeline run ID and its transformation log pipeline run ID, providing a traceable link from any field value in the return to the specific audit log entries that record the transformation producing that value. **Gate Owner: Engineering Lead.**

AC3: If source data validation (Story 2.1 AC3 or Story 2.2 AC1) or transformation logging (Story 2.3 AC4) has recorded a failure during the current run, the return file generation step does not execute. No partial or untraceable file is staged. Automated tests verify the no-generation path on each failure type. **Gate Owner: Engineering Lead.**

AC4: The pipeline places the pre-populated file in the SharePoint analyst review staging area (RRPL-AUD-002) with a structured filename `[return-type]-[reporting-period-YYYY-MM]-[pipeline-run-id].[ext]`. The file includes a cover page identifying return type, reporting period, pipeline run ID, audit log run ID, and a note that the file is pipeline-generated and requires analyst review and CFO sign-off before submission. **Gate Owner: Engineering Lead.**

**Architecture constraints:** C1 (RBNZ-prescribed format compliance — Finance Operations Manager accepts format conformance); C2 (audit trail linkage from return file to audit log entries); EA registry RRPL-DN-001 (RBNZ format requirements), RRPL-AUD-002 (SharePoint staging location). **Gate owners for this story: Engineering Lead (AC1 implementation, AC2, AC3, AC4); Finance Operations Manager (AC1 format conformance acceptance).**
**Oversight level:** MEDIUM.

---

## Epic 3 — Review, Submission, and Audit Trail

**Purpose:** Implement the human review and sign-off workflow, the submission gateway integration, and the immutable audit log meeting FMA s.2.2 and s.3.1.

---

### Story 3.1 — Analyst Review, CFO Sign-Off, and Submission to RBNZ / FMA Gateways

**As a** designated finance officer (CFO or delegated signatory)
**I want** to review and explicitly sign off every pre-populated return before it is submitted to RBNZ or FMA
**So that** the regulatory and operational requirement for human approval before submission is met, with identity-attributed and timestamped sign-off in the FMA s.2.1(c) review and approval log

**Acceptance Criteria:**

AC1: An analyst opens the pre-populated return file from the SharePoint staging area (RRPL-AUD-002), reviews the file and the linked audit trail summary, and records review comments and any required corrections via the review workflow. The reviewer's identity and timestamp are written to the audit log (Story 3.2) at review-step completion. **Gate Owner: Engineering Lead (workflow implementation); Finance Operations Manager (review workflow design acceptance).**

AC2: Submission to RBNZ Reporting Portal (RRPL-DN-001) or FMA Submission Gateway (RRPL-DN-002) is only invoked after an explicit, identity-attributed sign-off action by the designated finance officer (CFO or alternate signatory named in deployment configuration field `DESIGNATED_SIGNATORY_NAME`). The sign-off action is recorded with: signatory identity, sign-off timestamp (ISO 8601 with timezone), pipeline run ID, return file reference. **Gate Owner: Finance Operations Manager (signatory protocol — concurrence: CFO).**

AC3: The codebase contains no auto-submission code path. A code-search automated test asserts that no call site to the RBNZ or FMA gateway submission function is reachable from any path that does not include the sign-off confirmation guard. The test fails the build if a new call site is added without the sign-off guard. **Gate Owner: Engineering Lead.**

AC4: Submission confirmation from the gateway (submission timestamp, gateway-issued submission reference number, identity of the submitting principal) is written to the audit log within the same pipeline run. If gateway submission fails, the failure is logged with structured error fields and the return file is not marked submitted in the audit log; the analyst is alerted. **Gate Owner: Engineering Lead.**

AC5: A test suite verifies: (a) submission cannot be invoked without sign-off (attempted invocation returns an error and writes a `submission_blocked_no_signoff` audit entry); (b) submission with sign-off invokes the correct gateway and writes the FMA s.2.1(c) review and approval log entry and the FMA s.2.1(d) submission confirmation log entry; (c) the code-search test from AC3 passes on the current codebase. **Gate Owner: Engineering Lead.**

**Architecture constraints:** C3 (human sign-off mandatory before submission — PRIMARY; Finance Operations Manager is signatory protocol owner, CFO concurrence on designated-signatory designation); C1 (gateway integration verified non-auto-submitting — Finance Operations Manager confirms during AC2 review); C2 (review and approval log per FMA s.2.1(c); submission confirmation per FMA s.2.1(d)); EA registry RRPL-DN-001, RRPL-DN-002, RRPL-AUD-002. **Gate owners for this story: Finance Operations Manager (AC2 signatory protocol); CFO (designated-signatory concurrence); Engineering Lead (AC1, AC3, AC4, AC5).**
**Oversight level:** HIGH.

---

### Story 3.2 — Immutable Audit Log with 7-Year Retention and 5-Business-Day Producibility

**As a** Compliance Officer
**I want** an immutable, complete, machine-readable audit log retained for 7 years and producible to RBNZ or FMA within 5 business days of written request
**So that** the FMA s.2.2 immutability requirement, the FMA s.3.1 producibility standard, the RBNZ s.2.3 reconstruction depth and 7-year retention requirement are all met by the pipeline

**Acceptance Criteria:**

AC1: The audit log is implemented on the PostgreSQL store referenced as RRPL-AUD-001. The schema enforces write-once or equivalent immutability: rows may be inserted but not updated or deleted (database role permissions and a row-update-rejecting trigger enforce this; both layers are tested). Automated tests verify: (a) insert succeeds; (b) update is rejected by both the role permission layer and the trigger; (c) delete is rejected; (d) bypassing one enforcement layer is independently blocked by the other. **Gate Owner: Engineering Lead.**

AC2: The schema supports all FMA s.2.1 audit trail components and all Story 2.1, 2.2, 2.3, 3.1 log entry types. Schema fields are confirmed by the Compliance Officer to satisfy FMA s.2.1(a), s.2.1(b), s.2.1(c), s.2.1(d) before this story is marked complete. **Gate Owner: Engineering Lead (schema implementation); Compliance Officer (schema field-set certification against FMA s.2.1).**

AC3: A documented and tested retention policy retains audit log entries for 7 years from the submission date of the related return. A retention test creates a synthetic entry, sets its return submission date to 7 years and 1 day in the past, runs the retention job, and asserts the entry is still readable (retention enforces a minimum, not a maximum — entries older than 7 years are not automatically purged unless purge policy is separately approved). **Gate Owner: Engineering Lead.**

AC4: An export function produces the audit trail for a specified return period or specified return field as a machine-readable JSON or CSV file. The export specification is documented in the engineering repository. A performance test produces an export for a representative single-period audit trail and asserts the export completes in well under the 5-business-day standard (target: under 1 hour for one return period). **Gate Owner: Engineering Lead.**

AC5: A producibility documentation set covering the export invocation procedure, file format specification, and supported request types is published and version-controlled alongside the pipeline codebase. The procedure is exercised end-to-end in the Story 1.3 pre-launch producibility drill, and the Compliance Officer signs off the procedure as fit for FMA s.3.1 use. **Gate Owner: Compliance Officer (procedure certification — concurrence: Engineering Lead for technical correctness).**

**Architecture constraints:** C2 (audit trail completeness per FMA s.2.1; immutability per s.2.2; producibility per s.3.1; 7-year retention per s.5 — PRIMARY); C1 (RBNZ s.2.3 reconstruction depth and 7-year retention met by the same log); EA registry RRPL-AUD-001 (PostgreSQL immutable audit log). **Gate owners for this story: Engineering Lead (AC1, AC2 implementation, AC3, AC4); Compliance Officer (AC2 schema field-set certification, AC5 procedure certification — both non-delegable for regulatory sign-off purposes).**
**Oversight level:** HIGH.

---

## Cross-cutting non-functional requirements (carried to /test-plan)

- All pipeline runs and audit log writes use ISO 8601 timestamps with timezone (NZ time or UTC, explicit on every entry — not implicit).
- All deployment-configuration document-ID fields referenced by CI/CD gates (`RBNZ_S21_NOTIFICATION_DOC_ID`, `RBNZ_S22_SELFDISCLOSURE_DOC_ID`, `RBNZ_S21_ACK_DOC_ID`, `RBNZ_REVIEW_OUTCOME_DOC_ID`, `BS11_NOTIFICATION_DOC_ID`, `BS11_NOTIFICATION_DATE`, `INDEPENDENT_REVIEW_REPORT_DOC_ID`, `NORMALISATION_GOVERNANCE_APPROVAL_DOC_ID`, `FMA_S42_NOTIFICATION_DOC_ID`, `LEGACY_MACRO_DOC_ID`, `PRODUCIBILITY_DRILL_PASS_DOC_ID`, `NORMALISATION_LAYER_APPROVED`, `NORMALISATION_RULES_VERSION`, `DESIGNATED_SIGNATORY_NAME`) are owned by the Compliance Officer (regulatory-disclosure fields) or the Finance Operations Manager (signatory protocol field). The deployment configuration system's access policy enforces these ownership boundaries; access changes are audited.
- The deployment-configuration access log itself is retained alongside the pipeline audit log for the 7-year window — this provides evidence of who set each regulatory-disclosure flag and when, supporting any supervisory inquiry into the gating chain.

---

<!-- CPF-TRACE
stage: /definition
model: claude-opus-4-6
config: B

constraints_inherited_from_discovery: C1, C2, C3, C4, C5 (all five — see Step 0 entry condition section above)

constraints_carried_into_stories:
- C1: Story 1.1 PRIMARY (RBNZ s.2.1 + s.2.2 + BS11 s.4.2 + RBNZ s.93 exposure); Story 1.1 AC5 (CI/CD gate enforces 30-business-day BS11 minimum + all RBNZ doc-IDs); Story 2.3 architecture constraints (normalisation activation gated on Story 1.1 completion); Story 2.4 AC1 (RBNZ-prescribed format compliance for BS2/BS3/BS7); Story 3.1 architecture constraints (gateway integration verified non-auto-submitting); Story 3.2 architecture constraints (RBNZ s.2.3 reconstruction depth and 7-year retention met by same log)
- C2: Story 1.2 AC3 (test suite as control evidence); Story 1.3 PRIMARY (FMA s.3.1 producibility drill); Story 2.1 AC2 (source data log per FMA s.2.1(a)); Story 2.2 AC3 (treasury source data log); Story 2.3 AC3 (transformation log per FMA s.2.1(b)); Story 2.4 AC2 (return file → audit log linkage); Story 3.1 AC1 (review log per FMA s.2.1(c)), AC4 (submission confirmation per FMA s.2.1(d)); Story 3.2 PRIMARY (immutable log per s.2.2; producibility per s.3.1; 7-year retention per s.5)
- C3: Story 3.1 PRIMARY (designated finance officer sign-off required for any submission); Story 3.1 AC3 (codebase contains no auto-submission path — enforced by code-search test); Story 3.1 AC5 (test suite verifies submission cannot proceed without sign-off)
- C4: Story 1.1 PRIMARY (s.2.1 methodology notification + s.2.2 historical self-disclosure); Story 1.2 architecture constraints (change control as prerequisite to encoding); Story 2.3 architecture constraints (encoding gated on B1 + B2 completion); Story 2.3 AC2 (NORMALISATION_LAYER_APPROVED flag depends on Story 1.2 governance approval and FMA notification document IDs)
- C5: Story 1.2 PRIMARY (full FMA s.4.2 five-step path: AC1 documentation, AC2 independent review, AC3 test suite as constructed RBNZ s.2.3 "approved" control, AC4 governance sign-off, AC5 FMA notification, AC6 legacy macro retention); Story 1.2 AC7 (CI/CD gate enforces all C5 doc-IDs + test suite passing); Story 2.3 AC2 (NORMALISATION_LAYER_APPROVED flag is the technical enforcement of the C5 governance gate — Compliance Officer is the named flag owner)

constraints_not_carried: none — all five constraints are present in story acceptance criteria, with named Gate Owner assignments

step_4a_gate_owner_assignment: complete — table at top of /definition assigns named Gate Owner per (constraint, story) pair; every story's Architecture Constraints block names the gate owners for that story; six gate owner roles defined with accountability and non-delegable boundaries; non-delegable boundaries enforced via deployment-configuration access policy referenced in cross-cutting NFRs

c5_surfaced: true (carried forward from /discovery)
c5_surface_in_definition: Story 1.2 (full FMA s.4.2 path operationalised with named Gate Owners — Compliance Officer primary, Finance Operations Manager co-signatory, Independent Technical Reviewer review signature, Engineering Lead for test suite and CI/CD gate enforcement); Story 2.3 AC2 (NORMALISATION_LAYER_APPROVED flag as named-owner-controlled technical enforcement of the C5 gate)

scope_against_discovery_mvp: aligned — eight stories cover discovery MVP items 1–6 plus compliance preconditions B1/B2/B3. No scope additions. No out-of-scope items introduced.
-->
