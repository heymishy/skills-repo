# Definition: Core Banking Loan Migration — LoanLedger-NZ Decommission

**Status:** Complete (eval-mode — EXP-008-corpus-breadth-eval / Config A / S10)
**Feature slug:** core-banking-loan-migration
**Date:** 2026-05-17
**Skill version:** /definition
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S10
**Prior artefact read from disk:** `runs/config-A-S10/discovery.md` ✅

---

## Step 0 — Entry condition check

- Discovery artefact: ✅ on disk (`runs/config-A-S10/discovery.md`) — status: Approved
- Blockers carried from discovery: B1 (RBNZ BS11 notification not filed — immediate pre-project remediation required)
- Context injection files: ✅ `S10-ea-registry-loan-ledger-legacy.md`, `S10-rbnz-bs11-excerpt.md` — active

---

## Step 1 — Slicing strategy

**Strategy selected:** Regulatory-first vertical slicing.

The discovery identified a hard blocker (B1 — BS11 notification not filed). The regulatory pre-conditions are strictly on the critical path: no development sprint can formally commence until BS11 notification is filed and acknowledged. Slicing strategy:

- **Epic 1 — Regulatory Pre-Conditions:** Stories that satisfy the RBNZ BS11 notification obligation and the RBNZ regulatory report equivalence requirement. These are compliance and governance actions, with the coding agent implementing tracking infrastructure, gate enforcement, and parallel reporting scaffolding.
- **Epic 2 — Data Migration Execution:** The technical migration MVP — toolchain deployment, pilot validation, data integrity framework, and staged account migration. Can be planned in parallel with Epic 1 but must not formally commence development until BS11 notification is acknowledged.
- **Epic 3 — PPSR, Cutover, and Decommission:** Legal obligations for security registrations, the physical cutover execution, and legacy system retirement.

---

## Step 4a — Scope accumulator

| Discovery MVP item | Story/AC covering it |
|-------------------|---------------------|
| BS11 notification filed and RBNZ supervisory engagement maintained | Story 1.1 — full coverage (notification record, gate, 3 supervisory meetings) |
| All 14 RBNZ report types confirmed producible from CoreBanking-NXT | Story 1.2 — full coverage (3 custom reports confirmed, parallel reporting, RBNZ written ack) |
| Migration toolchain deployed and validated with pilot | Story 2.1 — full coverage (toolchain deployment, pilot run, integrity reconciliation, performance benchmark) |
| All 280,000 active accounts + CCCFA-window closed accounts migrated, zero data loss | Story 2.2 — full coverage (staged migration, reconciliation, audit trail, source data retention) |
| PPSR security registration legal opinion and preservation | Story 3.1 — full coverage (legal opinion, 62,000 registration verification, cutover gate) |
| LoanLedger-NZ decommissioned within vendor deadline | Story 3.1 AC4 — covered (decommission gate tied to all prior story completions) |

**Scope drift check:** 5 stories; 6 MVP items. Story 3.1 covers both PPSR and decommission gate (logically paired — decommission cannot proceed until PPSR is resolved). No scope drift detected.

---

## Epics and Stories

---

### Epic 1 — Regulatory Pre-Conditions and RBNZ Engagement

**Epic goal:** Satisfy all RBNZ obligations that are pre-conditions for migration development and cutover: BS11 advance notification (must precede all development activity), regulatory report equivalence verification (must precede cutover). The coding agent builds compliance tracking infrastructure and gate enforcement; the compliance team and RBNZ relationship manager execute the substantive regulatory actions.

**Scope note:** Story 1.1 is the critical-path blocker for the entire project. No Story 2.x or 3.x development sprint can be formally commenced until AC3 of Story 1.1 is satisfied (BS11_NOTIFICATION_STATUS = ACK_RECEIVED).

---

#### Story 1.1 — RBNZ BS11 Notification and Supervisory Engagement Tracking

**As a** Compliance Officer,
**I want** a compliance tracking system for the RBNZ BS11 material change notification process,
**So that** the BS11 notification is filed immediately, the self-disclosure of late filing is recorded, RBNZ acknowledgement is tracked, and no development sprint can formally commence until RBNZ acknowledgement is received.

**Background / Context:**

The enterprise has commenced a material change to a core banking system (decommission of LoanLedger-NZ, 280,000 loan accounts) without filing the required RBNZ BS11 advance notification (Section 4.2 — notification triggered at project initiation/commitment, not at cutover). This is a continuing breach for every day the project proceeds without filing. The notification must be filed immediately, accompanied by self-disclosure of late filing per BS11 s.5.1.

For migrations exceeding 100,000 accounts, BS11 Section 4.4 requires the institution to make available three supervisory update meetings: at project initiation, at the start of parallel operation, and 30 days before planned cutover.

**Acceptance Criteria:**

- AC1: The system maintains a BS11 notification record with the following mandatory fields: `filing_date` (date notification filed with RBNZ), `self_disclosure_filed` (boolean — s.5.1 self-disclosure accompanying the notification), `rbnz_acknowledgement_reference` (string — populated when RBNZ acknowledges), `rbnz_acknowledgement_date` (date), `senior_officer_accountable` (name and role — required by BS11 s.4.3(e)), `project_timeline_submitted` (boolean — confirms s.4.3(b) compliant timeline included), `risk_assessment_submitted` (boolean — confirms s.4.3(c) compliant risk assessment included), `notification_status` (enum: PENDING_FILING / FILED_AWAITING_ACK / ACK_RECEIVED / SUPERVISORY_ENGAGEMENT_ACTIVE / SUPERVISORY_CONCERN_RAISED).
- AC2: A compliance dashboard displays the BS11 notification record in full, including current `notification_status`, date of filing, days since filing, and whether the 30-business-day clock has completed.
- AC3: All project development activity (any Story 2.x or 3.x work item) is gated behind a project governance flag (`BS11_NOTIFICATION_STATUS`). The flag must equal `ACK_RECEIVED` before any development sprint for Stories 2.x or 3.x is formally opened. The gate is enforced in the project governance tool and the gate status is displayed in the compliance dashboard.
- AC4: The system tracks the three BS11 s.4.4 supervisory meeting obligations for the 280,000-account scale migration. For each meeting (INITIATION / PARALLEL_OP_START / PRE_CUTOVER_30_DAYS) the record stores: `meeting_type`, `scheduled_date`, `status` (PENDING / SCHEDULED / COMPLETE), and `rbnz_attendee_confirmed` (boolean). The pre-cutover meeting must be scheduled at least 30 days before the planned cutover date; a gate check prevents cutover scheduling if this meeting is not COMPLETE.
- AC5: The notification filing package is assembled and validated before submission. The system confirms that all required sections per BS11 s.4.3 are present: (a) project description and scope; (b) full project timeline with key milestones; (c) risk assessment covering data integrity, regulatory reporting continuity, service continuity, and fallback capabilities; (d) governance approvals (board or board committee resolution reference); (e) senior officer name and role; (f) RBNZ contact details. A checklist is produced on submission that confirms all six sections are present.

---

#### Story 1.2 — RBNZ Regulatory Report Equivalence Verification

**As a** RBNZ Relationship Manager,
**I want** a structured workflow for validating that CoreBanking-NXT produces all 14 RBNZ-prescribed report types equivalently to LoanLedger-NZ,
**So that** RBNZ prudential reporting continuity is maintained through cutover, all 3 custom-development report types are scoped and built before parallel operation begins, and RBNZ written acknowledgement is obtained before the first regulatory return is submitted from CoreBanking-NXT.

**Background / Context:**

LoanLedger-NZ currently produces 14 RBNZ-prescribed report types (including BS3 Asset Quality and BS7 Statistical Return). CoreBanking-NXT produces 11 as standard. The remaining 3 require configuration or custom development — this work is not yet scoped. BS11 Section 6.2 requires: (a) demonstration of equivalent outputs before cutover approval; (b) parallel reporting from both systems for at least one full reporting cycle; (c) side-by-side comparison report submitted to RBNZ; (d) written acknowledgement from RBNZ prudential reporting team before the first return is submitted from CoreBanking-NXT.

**Acceptance Criteria:**

- AC1: The 3 RBNZ report types requiring custom development are formally identified with their report name, prescribed field definitions (source: RBNZ Reporting Standards), and a confirmed implementation scope (either CoreBanking-NXT configuration or custom development). This identification is completed and confirmed with the new platform vendor before parallel operation commences. A gate check prevents parallel operation start unless all 3 custom reports have `implementation_scope_confirmed: true`.
- AC2: CoreBanking-NXT is configured or extended to produce all 14 RBNZ report types before the parallel operation period begins. The report equivalence tracking record maintains per-report status for all 14 report types: `report_name`, `standard_output` (boolean — true for 11 standard types), `custom_development_complete` (boolean — applies to 3 custom types), `parallel_output_produced` (boolean), `reconciliation_complete` (boolean), `rbnz_sign_off_received` (boolean).
- AC3: During parallel operation, both LoanLedger-NZ and CoreBanking-NXT produce all 14 report types for at least one full calendar month (one complete monthly reporting cycle). The parallel reporting period is tracked with `parallel_start_date`, `parallel_end_date`, `reporting_cycles_completed` (minimum 1), and a field-level reconciliation result for each report in the cycle.
- AC4: A side-by-side comparison report for the parallel period is produced, reviewed, and formally submitted to RBNZ via the RBNZ relationship manager before cutover is approved. The comparison report covers: all 14 report types, the parallel period dates, any material discrepancies found and their resolution, and the sign-off of the Retail Lending Operations Lead and RBNZ Relationship Manager.
- AC5: Written acknowledgement from the RBNZ prudential reporting team is received and stored before the first regulatory return is submitted from CoreBanking-NXT. A gate check prevents first-return submission if `rbnz_sign_off_received` is false for any of the 14 report types.

---

### Epic 2 — Data Migration Execution

**Epic goal:** Deploy the migration toolchain, validate data integrity at scale through a pilot run, and execute the staged migration of all 280,000 active loan accounts (plus closed accounts within the CCCFA 7-year retention window) to CoreBanking-NXT with zero data loss, field-level reconciliation, and a complete audit trail as required by BS11 s.6.1 and CCCFA s.20.

**Scope note:** No Story 2.x development sprint can formally commence until Story 1.1 AC3 (BS11_NOTIFICATION_STATUS = ACK_RECEIVED) is satisfied. Technical planning and design activity may proceed in parallel with Story 1.1, but formal sprint execution is gated.

---

#### Story 2.1 — Migration Toolchain Deployment and Pilot Validation

**As a** Data Architect,
**I want** the CoreBanking-NXT vendor migration toolset procured, deployed in the non-production environment, and validated against a representative pilot dataset,
**So that** we have confirmed evidence of data integrity at the scale and data variety required before committing to parallel operation with 280,000 live accounts.

**Background / Context:**

The CoreBanking-NXT vendor migration utility uses a read-only JDBC connection to LoanLedger-NZ and writes to CoreBanking-NXT. Vendor reference implementations involved 50,000–80,000 accounts (3.5–5.6× smaller than the 280,000-account scope here). A pilot on a representative subset — covering all three loan types (personal, home, commercial) and including accounts with arrears, PPSR registrations, and historical drawdown records — is required to validate toolset fidelity and establish a performance baseline for the three-weekend staged cutover.

**Acceptance Criteria:**

- AC1: The CoreBanking-NXT vendor migration toolset is procured under a formal contract that includes: data security obligations (read-only access to production data), NDA covering LoanLedger-NZ schema and customer data, and a vendor warranty on data integrity for accounts migrated using the toolset. Toolset is deployed in the non-production environment with the read-only JDBC connection to a LoanLedger-NZ non-production copy containing representative data.
- AC2: A pilot migration is completed on a representative sample of at least 10,000 loan accounts, covering: at least 3,000 personal loan accounts, at least 4,000 home loan accounts (including at least 1,000 with PPSR registrations), at least 1,000 commercial lending accounts, at least 500 accounts with arrears history, and at least 500 accounts with drawdown history spanning more than 5 years. Accounts are selected from the production data set for fidelity (anonymised copies for non-production use).
- AC3: A field-level reconciliation report is produced for the pilot migration. The report must show: total accounts attempted, total accounts migrated successfully, count of records with any field mismatch between source and target, count of records with transformation errors, and count of records dropped. The pass threshold for proceeding to parallel operation is: 0 (zero) records dropped, 0 (zero) records with data corruption, ≤ 0.1% records with non-critical field format differences (format normalisation only, no data loss).
- AC4: A performance benchmark report is produced covering: total migration time for the 10,000-account pilot, extrapolated time for full 280,000-account migration, estimated time per account type and per loan category. The benchmark must demonstrate that the full 280,000-account migration can complete within the 3-weekend cutover window (approximately 56 hours of available migration time across three weekends) with a 20% time contingency. If the benchmark fails this threshold, alternative tooling or phasing must be assessed before parallel operation begins.
- AC5: All pilot migration data (source values, transformation mapping, target values, timestamps) is retained in the migration audit log per BS11 s.6.1(a) requirements. The audit log must be queryable by account ID, migration batch ID, and migration timestamp.

---

#### Story 2.2 — Staged Account Migration with CCCFA Records Compliance

**As a** Retail Lending Operations Lead,
**I want** all loan accounts migrated from LoanLedger-NZ to CoreBanking-NXT in a staged weekend migration following the parallel operation period,
**So that** all 280,000 active loan records (plus closed records within the CCCFA 7-year retention window) are migrated with zero data loss, field-level reconciliation confirmed at each stage, a complete BS11-compliant audit trail maintained, and source data retained for 12 months post-cutover.

**Background / Context:**

The staged migration proceeds in batches across three weekends at the end of the parallel operation period. Per BS11 s.6.1: (a) a complete record of all migrated data (source, target, transformation logic) must be maintained; (b) reconciliation between source and target is required at each stage with documented sign-off before proceeding to the next stage; (c) source system data must remain read-accessible for 12 months post-cutover; (d) all statutory retention obligations must be met from day one (CCCFA s.20 — 7-year retention for all credit contract records including closed accounts). The CCCFA retention obligation applies not just to the 280,000 active accounts but to all closed loan records within the 7-year window (estimated 1.4 million total records: active + closed).

**Acceptance Criteria:**

- AC1: Before the weekend staged migration commences, a reconciliation baseline is taken from both LoanLedger-NZ and CoreBanking-NXT confirming: the exact count of accounts to be migrated in each weekend batch, the total record count including historical records within the CCCFA 7-year window, and the checksum of key financial fields (outstanding balance, arrears amount, original loan amount) for all accounts in the first batch. The baseline is signed off by the Data Architect and Retail Lending Operations Lead before each weekend migration commences.
- AC2: After each weekend migration batch completes, a reconciliation report is produced covering: accounts migrated in the batch (count and IDs), field-level integrity check for each migrated account (original loan terms, drawdown history, repayment schedules, arrears status, security registration reference), count of records with any discrepancy, and migration status (`SUCCESS`, `FAILED_INTEGRITY`, `FAILED_DROPPED`). Zero records may be in status `FAILED_DROPPED` or `FAILED_INTEGRITY` before the batch is accepted and the next batch proceeds. Any `FAILED_*` status triggers a rollback of the batch to LoanLedger-NZ.
- AC3: All loan accounts migrated include full 7-year CCCFA-window historical records. For each migrated account, the following fields are verified as present and correct: account_id, account_type (PERSONAL / HOME / COMMERCIAL), original_loan_amount, currency, interest_rate_history (all rate changes with dates), drawdown_history (all drawdown events), repayment_schedule, repayment_history (all payments received), arrears_status, arrears_history (all arrears events with dates), security_registration_reference (for home loans with PPSR). Closed accounts within the 7-year window are confirmed present in CoreBanking-NXT with all the same fields and a `closed_date` field populated.
- AC4: LoanLedger-NZ production instance is retained in a read-accessible (read-only) state for a minimum of 12 months post final cutover date, per BS11 s.6.1(c). A scheduled access review confirms read-accessibility at 3-month intervals during the 12-month retention period. Decommission of the read-only instance is gated behind: 12-month post-cutover date passed AND RBNZ relationship manager sign-off on the decommission action.
- AC5: The migration audit log for the full migration is finalised and archived on completion. The log contains: for every migrated record — source account ID, source field values at migration time, transformation rules applied (if any), target field values, migration batch ID, migration timestamp, and reconciliation status. The audit log is retained for the longer of 7 years (CCCFA obligation) or 12 months post-decommission (BS11 obligation).

---

### Epic 3 — PPSR, Cutover, and Decommission

**Epic goal:** Obtain the legal opinion on PPSR security registration transfer requirements, confirm all 62,000 home loan security registrations are preserved through migration, execute the final decommission of LoanLedger-NZ, and formally close the project with all regulatory obligations documented as met.

---

#### Story 3.1 — PPSR Security Registration Transfer and Legacy System Decommission

**As a** Legal Counsel,
**I want** a legal opinion on the PPSR security registration transfer requirements obtained before cutover, and all 62,000 registered home loan security interests confirmed as preserved through migration,
**So that** no perfected security interest lapses during or after migration, the enterprise's security position on all home loan accounts is maintained, and LoanLedger-NZ is formally decommissioned only after all regulatory and legal obligations are confirmed met.

**Background / Context:**

Approximately 62,000 home loan accounts (part of the 280,000 active accounts) have perfected security interests registered on the Personal Property Securities Register (PPSR) and/or the Landonline register. Migrating loan account records does not automatically transfer the PPSR/Landonline registrations — these are separate legal instruments. If a perfected security interest lapses during migration, the enterprise loses its secured creditor priority for that loan. The PPSR Act requires perfected security interests to remain perfected; any lapse during migration creates priority risk. A legal opinion must confirm: (a) whether PPSR registrations transfer automatically with the account migration; (b) whether re-registration is required and what the process is; (c) whether customer consent or notification is required.

**Acceptance Criteria:**

- AC1: A formal legal opinion on PPSR and Landonline security registration transfer requirements during account migration is obtained from an external law firm with New Zealand secured transactions expertise. The opinion must specifically address: (a) whether migration of the loan account record to CoreBanking-NXT requires any action on the PPSR/Landonline registration; (b) whether the existing registrations remain valid and enforceable against the migrated account; (c) any consents, notices, or actions required from the enterprise, the borrower, or a third party; (d) the risk of security interest lapse if migration proceeds without the recommended actions. The legal opinion must be in writing and signed by a qualified New Zealand solicitor. This opinion is obtained and its recommendations are documented before cutover proceeds.
- AC2: Based on the legal opinion, a PPSR/Landonline disposition schedule is produced. Every one of the 62,000 home loan accounts with a registered security interest is classified as one of: `TRANSFER_AUTOMATIC` (no further action required), `REQUIRES_REREGISTRATION` (enterprise must re-register on the new account identifier), or `REQUIRES_LEGAL_ACTION` (customer consent, court order, or other action required before migration). The schedule is signed off by Legal Counsel before cutover proceeds.
- AC3: Before cutover commences for any home loan account with a `REQUIRES_REREGISTRATION` classification, the re-registration action is completed and confirmed. Before cutover commences for any home loan account with a `REQUIRES_LEGAL_ACTION` classification, the required legal action is completed or, where not yet possible, the account is placed on a migration hold with Legal Counsel sign-off. No home loan account with an unresolved PPSR status may be cut over.
- AC4: The formal decommission of LoanLedger-NZ (beyond the 12-month read-only retention period) is gated behind all of the following confirmations: (a) Story 1.1 `notification_status = SUPERVISORY_ENGAGEMENT_ACTIVE` and all three supervisory meetings COMPLETE; (b) Story 1.2 all 14 RBNZ reports `rbnz_sign_off_received: true`; (c) Story 2.2 full migration reconciliation passed (zero `FAILED_*` records); (d) Story 2.2 12-month post-cutover read-only retention period complete; (e) Story 3.1 all 62,000 PPSR registrations with status confirmed as `TRANSFER_AUTOMATIC` or `REQUIRES_REREGISTRATION` and re-registration complete; (f) RBNZ Relationship Manager formal sign-off on decommission; (g) CRO/CTO sign-off on decommission. Only when all six conditions are confirmed may the decommission command be executed.
