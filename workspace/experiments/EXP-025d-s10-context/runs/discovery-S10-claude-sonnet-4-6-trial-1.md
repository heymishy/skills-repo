# Discovery Artefact — Legacy Loan Ledger Decommission & Core Banking Migration

**Status:** Draft
**Feature slug:** `2025-07-15-loan-ledger-migration`
**Artefact path:** `artefacts/2025-07-15-loan-ledger-migration/discovery.md`

---

## Pre-population notes

**Product context files:** Not found — sections populated from operator input and injected regulatory context.

**Reference materials:** No reference folder found at `artefacts/2025-07-15-loan-ledger-migration/reference/` — proceeding from operator brief.

**EA registry:** `architecture.ea_registry_authoritative` not set in context — blast-radius query skipped (Path B).

**Reference corpus:** No `discovery-seed.md` or `constraint-index.md` found — proceeding from operator brief.

**Regulatory context (from injected context file):** The following frameworks were identified as triggered by this initiative and are surfaced as constraints and assumptions below:

| Framework | Trigger |
|---|---|
| RBNZ BS11 | Decommission and replacement of a core banking system (loan ledger) — material change |
| CCCFA | Migration of consumer credit records; decommission of source system; 7-year retention |
| AML/CFT Act 2009 | Loan and payment transaction data; potential payment channel modification |
| RBNZ FX Reporting | Commercial lending portfolio may include foreign-currency-denominated loans |
| CPG 220 | New platform may include AI/ML components for credit decisioning or arrears scoring |
| DIA Payment Services | Any new customer-facing payment channel created on the new platform |

---

## Problem Statement

The enterprise's legacy loan ledger system — 18 years in production, managing approximately 280,000 active loan accounts across personal, home, and commercial lending — will lose vendor support in 12 months. The vendor is withdrawing the product from market. Contract extension is not available. After the support end date, the system will receive no patches, no security updates, and no vendor-provided defect resolution.

Continued operation of an unsupported loan ledger beyond that date creates compounding and unacceptable risk across four dimensions:

1. **Operational risk:** Any defect, data corruption, or system failure after the vendor support end date becomes an internal engineering problem with no vendor escalation path — against a system whose codebase has 18 years of accumulated complexity.
2. **Security risk:** An unpatched core banking system is an active security liability. Regulatory obligations (RBNZ, CCCFA, Privacy Act 2020) do not suspend because a vendor contract has ended.
3. **Regulatory risk:** The legacy system currently generates RBNZ-prescribed regulatory reports. If the system is unsupported and a reporting failure occurs, the bank bears full remediation liability with no vendor support.
4. **Dual-core operating cost:** Running two core banking platforms in parallel (deposits on the new platform, loans on the legacy system) doubles operational overhead, reconciliation burden, and integration surface area. This state cannot be sustained indefinitely.

The 12-month hard deadline is externally imposed and non-negotiable.

---

## Personas

### P1 — Home Loan Borrower (existing account holder)
A retail customer with a home loan on the legacy system. During migration, they must experience no disruption to: repayment processing, direct debit execution, arrears status visibility, offset account linkage (if applicable), and ability to make lump-sum payments. Their loan contract terms — interest rate, repayment schedule, security registration — must survive migration identically. Any data corruption affecting their account is a personal financial harm, a potential CCCFA breach, and a complaints/dispute event.

### P2 — Personal Loan Borrower (existing account holder)
Similar to P1. This persona is more likely to be in active repayment management — potentially in arrears, in hardship arrangements, or approaching scheduled end-of-loan. The arrears status and any hardship agreement terms must migrate with the record. Loss of arrears history or hardship flag creates incorrect credit reporting, potential legal liability, and harm to a financially vulnerable customer.

### P3 — Commercial Lending Customer
A business customer with term lending facilities on the legacy system. More complex data structure: may have multiple facility tranches, drawn and undrawn limits, security registrations, covenant conditions, and currency exposure. Commercial lending migration carries higher per-account complexity. This persona will be directly affected if facility availability calculations, drawdown history, or security interests are incorrectly migrated.

### P4 — Loan Operations Staff
Internal staff who process day-to-day loan transactions, handle arrears, manage security registrations, and respond to customer queries. During the 6-month parallel operation period, they will work across two systems. Post-cutover, they depend on the new platform having a complete and accurate view of every account's history. Incomplete migration — missing repayment history, wrong arrears status — creates an operational queue of exceptions that must be manually investigated and resolved, at significant cost.

### P5 — RBNZ Reporting Team
Internal regulatory reporting staff responsible for submitting RBNZ-prescribed reports. They currently generate these reports from the legacy system. After cutover, all reports must be generated from the new platform with the same field definitions and formats. Any reporting gap — a field missing, a format deviation, a timing failure — is a direct regulatory exposure. This persona must validate new platform reports against legacy outputs during the parallel operation period before cutover is approved.

### P6 — Chief Risk Officer / Board
The CRO and Board carry accountability for material system change under RBNZ BS11, for model risk under CPG 220 (if applicable), and for the bank's continued CCCFA compliance. They need assurance that the migration plan is formally notified to RBNZ within the BS11 window, that 7-year retention is confirmed on the destination system before the source is decommissioned, and that go/no-go decisions at cutover are made against documented, board-approved criteria.

---

## Why Now

The trigger is externally imposed and binary: the legacy loan ledger vendor is withdrawing the product from market, with support ending in 12 months. There is no contract extension pathway. This is not a discretionary modernisation programme — it is a forced migration with a hard deadline. The consequence of missing the deadline is operating a core banking system — managing 280,000 loan accounts — with no vendor security patching, no defect resolution, and no support escalation path. That state is operationally untenable and likely inconsistent with the bank's RBNZ obligations and its own risk appetite.

The bank has already absorbed the initial transition cost of deploying the new core banking platform for deposits. Migrating loans to the same platform is the natural and necessary completion of that programme. The alternative — sourcing a different loan system, or attempting to re-contract on any other basis — is not raised as an option and would not be viable within the 12-month window.

---

## MVP Scope

The minimum viable outcome is: **all 280,000 active loan accounts migrated to the new platform, the new platform producing all RBNZ-prescribed regulatory reports, and the legacy system formally decommissioned — within 12 months.**

Scoped in for MVP:

- Full migration of all active loan account records: personal, home loan, and commercial lending
- Migration of complete loan history per account: original terms, drawdown history, repayment history, arrears status, hardship arrangements, security registrations
- Migration of records for closed loans where the 7-year CCCFA retention period has not yet expired
- 6-month parallel operation phase: new originations on new platform from day one; existing accounts mirrored
- Data integrity validation and reconciliation framework — account-by-account reconciliation before cutover approval
- Staged weekend cutover of remaining legacy accounts at the 6-month mark
- New platform RBNZ regulatory report production — validated by the RBNZ reporting team against legacy outputs before cutover
- Formal legacy infrastructure decommission within 6 months of cutover
- RBNZ BS11 material change notification — filed before any irreversible project activity begins (see Constraints)

**Explicit deferrals from MVP scope:**
- New loan product features on the new platform (the migration scope is lift-and-match, not lift-and-enhance)
- Customer self-service portal enhancements enabled by the new platform
- Any AI/ML credit decisioning or arrears scoring capability on the new platform (see Constraints — CPG 220)
- Re-engineering of security registration processes beyond what is required to accurately represent existing registrations on the new platform

---

## Out of Scope

1. **New loan product development:** No new loan product types will be created or launched during this programme. The migration is a data and operational move, not a product expansion. New product work would introduce scope and dependency risk that the 12-month window cannot absorb.

2. **New customer-facing payment channels:** No new payment channel or payment service type will be created as part of this programme. If the new platform's payment processing architecture differs from the legacy system's, any net-new customer-facing channel must be assessed separately under DIA Payment Services Regulations and is out of scope for this migration.

3. **AI/ML-assisted decisioning or scoring on the new platform:** Any deployment of AI or ML models for credit decisioning, arrears prediction, or customer risk scoring is out of scope for this programme. Such deployment requires independent model validation and CRO sign-off under CPG 220 and cannot be added to the migration timeline without creating a hard-gate risk.

4. **Remediation of pre-existing data quality issues in the legacy system beyond what is required for migration:** The migration toolset will identify data quality issues. Remediation of issues that pre-date and are independent of the migration (e.g. historical data entry errors, incomplete security registration records) is out of scope except where the issues would cause migration validation failures.

5. **Cross-border or foreign-currency payment channel modification:** Any changes to how the bank processes cross-border payments or FX-denominated commercial lending facilities — beyond accurately representing existing account data on the new platform — is out of scope. If the new platform's FX reporting or payment routing differs from the legacy system, this must be assessed separately under RBNZ FX Reporting obligations and SWIFT correspondent agreement requirements before any live routing change is made.

---

## Assumptions and Risks

### Regulatory assumptions (unconfirmed — require /clarify)

> [ASSUMPTION] RBNZ BS11 material change notification has not yet been filed — the 30-business-day notification window must be opened immediately upon project initiation. This discovery artefact treats BS11 notification as a hard prerequisite to any irreversible project activity (infrastructure provisioning, data migration toolchain configuration, or any production data access). Unconfirmed — requires confirmation from the RBNZ relationship team before project kick-off.

> [ASSUMPTION] The 7-year CCCFA retention obligation is confirmed to apply to the loan records in scope, and the new platform has been assessed and confirmed as capable of meeting the retention obligation for all migrated records before the legacy system is decommissioned. The operator brief states the legal team has confirmed the retention obligation — the unconfirmed element is whether the new platform's retention capability has been formally assessed against that obligation. Requires confirmation from Legal/Compliance before the legacy system decommission schedule is locked.

> [ASSUMPTION] The new core banking platform does not introduce any AI/ML-based credit decisioning or risk scoring components in its loan module as deployed for this migration. If the new platform includes any such components — even as optional or background features — CPG 220 model validation requirements apply and create a hard go-live gate. Unconfirmed — requires confirmation from the platform vendor and technology team before platform deployment proceeds.

> [ASSUMPTION] The commercial lending portfolio does not include material foreign-currency-denominated loan facilities that would trigger RBNZ FX transaction reporting obligations under the new platform's settlement architecture. If FX-denominated commercial loans are present, the new platform's FX reporting capability must be confirmed as compliant before cutover. Unconfirmed — requires confirmation from the commercial lending and treasury teams.

> [ASSUMPTION] No new customer-facing payment channel or payment service type is created by deploying the new platform for loan accounts. If the new platform's payment processing is structurally different from the legacy system's (e.g. introduces a proprietary or intra-group settlement mechanism not currently in use), DIA Payment Services Regulations registration and SWIFT correspondent agreement notification may be required before live routing. Unconfirmed — requires confirmation from Treasury and the platform vendor.

> [ASSUMPTION] The AML/CFT transaction monitoring and suspicious transaction reporting (STR) obligations for loan repayment flows continue to be met without interruption during and after migration. The operator brief does not address how AML/CFT screening is implemented on the new platform relative to the legacy system. Unconfirmed — requires confirmation from the AML/CFT compliance team before go-live.

### Technical and operational assumptions

> [ASSUMPTION] The migration toolset provided by the new platform vendor is capable of migrating the full data schema of the legacy loan ledger — including all history fields, arrears status flags, hardship arrangement records, and security registration data — without data loss or type conversion errors. This has not been demonstrated in production conditions. Requires a formal toolset assessment against the legacy schema before the migration plan is finalised.

> [ASSUMPTION] The 6-month parallel operation period is sufficient to identify and remediate all data integrity issues before cutover. This assumption is load-bearing for the entire migration schedule. If the parallel operation period surfaces data quality or reconciliation issues that require more than 6 months to resolve, the cutover schedule and the 12-month deadline are in conflict. This is the primary schedule risk.

> [ASSUMPTION] A team of 6 engineers, 1 data architect, and 1 project manager is sufficient for a migration of this scale and complexity (280,000 accounts, full history, regulated data, parallel operation). No independent resourcing assessment has been cited. If this assumption is wrong, the 12-month deadline is at risk.

> [ASSUMPTION] The new platform can produce all RBNZ-prescribed regulatory reports with the same field definitions and formats as the legacy system, without requiring custom development. If custom development is required, it must be scoped, resourced, and completed before the parallel operation period can be used for meaningful report validation.

### Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| BS11 notification not filed before irreversible project activity begins | Medium (not confirmed as filed) | High — RBNZ enforcement action, project pause | File notification immediately; treat as Day 1 action |
| CCCFA 7-year retention not confirmed on new platform before legacy decommission | Medium | High — regulatory breach, potential Commerce Commission action | Require formal retention assessment as a hard gate before decommission schedule is approved |
| Data integrity failures discovered after cutover | Medium | Critical — customer harm, CCCFA breach, operational exception queue | Account-by-account reconciliation; no cutover without reconciliation sign-off; post-cutover exception management plan |
| Migration toolset schema gaps (legacy fields not mappable) | Medium | High — data loss for affected accounts | Full schema mapping exercise before migration toolset procurement is finalised |
| 12-month deadline breach (parallel operation takes longer than 6 months) | Medium | High — unsupported legacy system in production | Contingency plan for operating the legacy system in a hardened, minimal-access state beyond the support end date; escalation to Board if schedule slips |
| RBNZ report format deviation on new platform | Medium | High — regulatory reporting failure | Report-by-report validation during parallel operation; sign-off by RBNZ reporting team before cutover approval |
| CPG 220 — undisclosed AI/ML component in new platform loan module | Low (but unconfirmed) | High — hard go-live gate if triggered | Vendor confirmation required; add to procurement/contract review checklist |

---

## Directional Success Indicators

**SI-1 — Data migration completeness:**
Baseline: 280,000 active loan accounts on legacy system (source of truth at migration start).
Target: 280,000 accounts on new platform, zero accounts lost, zero accounts with corrupt or incomplete core data fields (loan terms, repayment schedule, arrears status, security registrations).
Measured by: Account-by-account reconciliation report produced by the migration toolset, reviewed and signed off by the data architect and independent QA check before cutover approval.

**SI-2 — CCCFA retention compliance:**
Baseline: All loan records (active and closed, within 7-year window) on legacy system.
Target: All in-scope records present, intact, and retrievable on new platform before legacy system is decommissioned.
Measured by: Retention compliance audit — Legal/Compliance sign-off that destination system meets CCCFA 7-year retention obligation for all migrated record categories.

**SI-3 — RBNZ regulatory report accuracy:**
Baseline: Reports currently generated by legacy system (format and field definitions as prescribed by RBNZ).
Target: New platform produces identical report output (within prescribed tolerances) for the same input data across all RBNZ-prescribed report types.
Measured by: Side-by-side report comparison during parallel operation period, reviewed and signed off by RBNZ reporting team. Report deviation count: target zero material deviations before cutover approval.

**SI-4 — Cutover within deadline:**
Baseline: Legacy system support end date = T+12 months from project initiation.
Target: Full cutover of all legacy loan accounts completed by T+6 months; legacy infrastructure formally decommissioned by T+12 months.
Measured by: Project milestone tracking; go/no-go cutover decision documented and dated.

**SI-5 — Zero customer-impacting data errors post-cutover:**
Baseline: `[UNKNOWN BASELINE]` — current rate of loan data errors on legacy system not provided.
Target: Zero customer-impacting data errors attributable to migration in the 90 days post-cutover (i.e. errors that result in incorrect repayment amounts, incorrect arrears status, incorrect regulatory credit reporting, or customer complaints attributable to migration).
Measured by: Post-cutover incident log, customer complaints register, and credit reporting exception report for the 90-day window.

**SI-6 — Loan operations staff exception queue:**
Baseline: `[UNKNOWN BASELINE]` — current exception queue volume on legacy system not provided.
Target: Post-cutover exception queue attributable to migration data issues returns to pre-migration baseline levels within 30 days of cutover.
Measured by: Loan operations team exception queue volume report, 30 days post-cutover.

---

## Constraints

**C1 — RBNZ BS11 material change notification (hard regulatory constraint):**
The decommission and replacement of the loan ledger is a material change to a core banking system under RBNZ BS11. The bank must notify RBNZ at least 30 business days before implementing any material change. Notification must be filed before any irreversible project activity begins — infrastructure provisioning, data migration toolchain configuration, and production data access all qualify as material steps. The RBNZ relationship team must be engaged on Day 1 of project initiation to open the notification window. The clock starts from RBNZ acknowledgement.
*Source: RBNZ BS11 — Outsourcing Policy (injected regulatory context)*

**C2 — CCCFA 7-year retention (hard regulatory constraint):**
Credit contract records — loan terms, drawdown history, repayment schedules, arrears status, responsible lending assessments — must be retained for 7 years from the date the contract ends. This applies to closed loans as well as active ones. The legacy system cannot be decommissioned until Legal/Compliance have formally confirmed that the new platform meets this retention obligation for all migrated record categories.
*Source: CCCFA 2003 s.99 and associated regulations; confirmed by operator brief (legal team)*

**C3 — RBNZ regulatory report format and field definitions (hard regulatory constraint):**
RBNZ-prescribed regulatory reports must continue to be produced without interruption and without format or field-definition deviation throughout and after migration. The new platform's report output must be validated against legacy outputs during the parallel operation period. Any format deviation must be resolved before cutover approval.
*Source: RBNZ regulatory reporting requirements; operator brief (RBNZ relationship team involvement)*

**C4 — 12-month hard deadline (external constraint, non-negotiable):**
The legacy system vendor support end date is a hard external deadline. No extension is available. All migration activity — parallel operation, reconciliation, cutover, and decommission planning — must be structured within this window.
*Source: Operator brief*

**C5 — No AI/ML credit decisioning on new platform without CPG 220 validation (hard regulatory constraint):**
Any AI or ML model deployed in credit decisioning, arrears scoring, or customer risk classification on the new platform must complete independent model validation and CRO sign-off before activation in production. This is a hard go-live gate. The migration programme must not activate any such component — even provisionally — before validation is complete.
*Source: CPG 220 (APRA Prudential Practice Guide — de facto standard for RBNZ model risk management)*

**C6 — AML/CFT obligations continuous during migration (hard regulatory constraint):**
The bank's AML/CFT obligations — threshold reporting, STR filing, originator information on cross-border payments — apply without interruption throughout the migration. Any modification to payment processing architecture on the new platform must be assessed against AML/CFT compliance before being activated in production.
*Source: AML/CFT Act 2009 (NZ)*

**C7 — SWIFT correspondent agreement notification (contractual constraint):**
If the new platform introduces any payment routing that differs from the existing SWIFT correspondent arrangement, the bilateral correspondent bank agreement requires prior written notification before live transaction volume is routed outside the covered SWIFT channel. This notification is independent of RBNZ regulatory notifications — both are required. Treasury must confirm whether the new platform's payment architecture triggers this obligation before any live routing change is made.
*Source: SWIFT correspondent bank agreement obligations (injected regulatory context)*

**C8 — DIA Payment Services Regulations (regulatory constraint — conditional):**
If the new platform's payment processing introduces a customer-facing payment service type not currently within the bank's licensed scope, DIA registration (or confirmation of exemption) is required before piloting with real customers. This must be assessed before the new platform processes any live customer loan repayments via a new channel architecture.
*Source: Payment Services Regulations 2021 (DIA)*

**C9 — Team scale vs. migration complexity (operational constraint, unconfirmed):**
The proposed team (6 engineers, 1 data architect, 1 project manager) has not been independently assessed against the scale of the migration (280,000 accounts, full history, regulated data, parallel operation, RBNZ reporting validation). This is a material schedule risk if the team is undersized.

**C10 — In-house execution with vendor migration toolset (operational constraint):**
The project will be run in-house. The vendor provides a migration toolset but the integration, validation, and reconciliation work is the bank's responsibility. The bank's engineering team must have or acquire sufficient depth in the legacy system schema, the new platform schema, and the migration toolset to own data integrity outcomes. Vendor support scope for toolset defects must be contractually confirmed before migration toolset deployment.

---

## /clarify recommendation

This discovery contains 8 unconfirmed assumptions that affect scope, regulatory compliance, and schedule integrity. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] RBNZ BS11 material change notification has not yet been filed — the 30-business-day notification window must be opened immediately upon project initiation.
- [ASSUMPTION] The 7-year CCCFA retention obligation is confirmed on the new platform before the legacy system decommission schedule is locked.
- [ASSUMPTION] The new platform does not introduce any AI/ML-based credit decisioning or risk scoring components — if it does, CPG 220 model validation is a hard go-live gate.
- [ASSUMPTION] The commercial lending portfolio does not include material FX-denominated loan facilities that would trigger RBNZ FX transaction reporting obligations on the new platform.
- [ASSUMPTION] No new customer-facing payment channel or payment service type is created by deploying the new platform — if one is, DIA Payment Services registration and SWIFT correspondent agreement notification may be required.
- [ASSUMPTION] AML/CFT transaction monitoring and STR obligations continue without interruption during and after migration — not yet confirmed from AML/CFT compliance team.
- [ASSUMPTION] The migration toolset is capable of migrating the full legacy data schema without data loss or type conversion errors — not yet demonstrated in production conditions.
- [ASSUMPTION] The proposed team of 6 engineers, 1 data architect, and 1 project manager is sufficient for a migration of this scale and regulatory complexity within the 12-month window — no independent resourcing assessment cited.

**Priority sequence for /clarify:** C1 (BS11 notification) and C2 (CCCFA retention confirmation on destination system) should be resolved first — both have the potential to create hard stops that affect whether and how the project can proceed at all. The AI/ML assumption (C5) should be resolved in parallel with vendor contract review.

---

## Attribution

**Contributors:**
- [Operator] — Problem owner / project sponsor — 2025-07-15

**Reviewers:**
- Pending

**Approved By:**
- Pending

> ⚠️ **Attribution required before Approved By can be set.** Populate Reviewers and Approved By before the Definition of Ready gate. A non-engineering approver is expected for M3 measurement. Leaving Approved By empty will result in a H-GOV hard block at Definition of Ready.

---

## Next steps

> **Discovery draft complete ✓**
>
> Given the regulatory complexity of this initiative — particularly the BS11 hard constraint on project initiation timing — I strongly recommend running **/clarify** before proceeding to /benefit-metric.
>
> The eight unconfirmed assumptions above include two that could halt the project at initiation (BS11 notification timing and CCCFA retention confirmation). Resolving these before any infrastructure work begins is not a documentation exercise — it is a regulatory obligation.
>
> How do you want to proceed?
> 1. Run /clarify now (strongly recommended given BS11 timing constraint)
> 2. Review and approve without /clarify — skip to sign-off
>
> Reply: 1 or 2

---

> **Before we close:** Run `/estimate` to record a rough focus-time forecast for this initiative. Given the 12-month hard deadline and regulatory complexity, an early effort estimate will help calibrate resourcing risk (Constraint C9) and feed the normalisation model at /improve.
>
> Reply: `/estimate` — or `skip` to continue

---

*Pipeline state update pending approval. On approval, `pipeline-state.json` will be updated: `stage: "discovery"`, `health: "green"`, `regulated: true`, `complianceProfile: "regulated"`, `complianceFrameworks: ["RBNZ-BS11", "CCCFA", "AML-CFT-ACT-2009", "RBNZ-FX-REPORTING", "CPG-220", "DIA-PAYMENT-SERVICES-2021"]`, and guardrails seeded for each framework with `status: "not-assessed"`.*

<!-- eval-mode: true -->