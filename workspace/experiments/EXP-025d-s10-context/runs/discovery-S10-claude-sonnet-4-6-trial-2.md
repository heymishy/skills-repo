# Discovery Artefact — Legacy Loan Ledger Migration & Decommission

**Status:** Draft
**Feature slug:** `2025-07-15-loan-ledger-migration`
**Artefact path:** `artefacts/2025-07-15-loan-ledger-migration/discovery.md`

---

## Pre-population: Regulatory context applied

This discovery is produced under the regulated NZ financial services context (RBNZ primary regulator, registered bank). The following frameworks have been applied automatically from the injected regulatory context. Constraints and assumptions below reflect obligations from these frameworks regardless of whether the operator brief mentioned them.

Frameworks triggered by this input:
- **RBNZ BS11** — material change / core banking system migration
- **CCCFA** — 7-year credit record retention (consumer and home loan accounts)
- **CPG 220** — model risk (if any ML-based decisioning migrates with the loan data)
- **RBNZ RBNZ regulatory reporting** — prescribed format and field requirements for RBNZ reports

The following frameworks were **not** triggered by this input and are not surfaced:
- AML/CFT cross-border / SWIFT correspondent / DIA payment services / RBNZ FX — no payment channel change, no cross-border feature, no new payment service type described

---

## Problem Statement

The enterprise's legacy loan ledger system — 18 years in production, managing approximately 280,000 active loan accounts across personal loans, home loans, and commercial lending — is being withdrawn from market by its vendor. The vendor support contract ends in 12 months. After that date the system will receive no patches, no security updates, and no vendor support. There is no option to extend.

Operating an unsupported, unpatched core banking system beyond that date creates an unacceptable regulatory, security, and operational risk profile for a registered bank. The legacy system must be decommissioned. All loan accounts must be migrated to the new core banking platform (already operating successfully for deposit accounts for 14 months) before the vendor support end date.

The 12-month hard deadline is externally imposed and non-negotiable. It is not a business preference — it is a vendor end-of-life constraint with no fallback option.

---

## Personas

### P1 — Loan Operations Team (day-to-day system users)
Loan officers, arrears management staff, and operations administrators who process transactions, manage account status, and respond to customer enquiries using the current legacy system. They encounter the problem continuously: once vendor support ends, any system fault that cannot be self-resolved becomes a permanent operational outage with no vendor remediation path. During parallel operation they will work across two systems simultaneously, increasing cognitive load and error risk.

### P2 — Retail Borrowers (personal loan and home loan customers)
Approximately 280,000 account holders whose loan records, repayment schedules, arrears status, and security registrations must transfer with full integrity. They experience the risk if data is corrupted or lost in migration — wrong balance, incorrect repayment schedule, missing arrears history, or unenforceable security registration. Any such error carries direct customer harm, potential CCCFA breach, and reputational damage.

### P3 — Commercial Lending Clients
Commercial borrowers whose accounts are part of the ledger. Commercial lending arrangements often carry additional complexity (multi-tranche structures, covenant records, security registrations). Errors in commercial account migration carry financial and legal exposure beyond the retail population.

### P4 — RBNZ Relationship Team (internal)
The internal team responsible for the bank's regulatory relationship with RBNZ. They are the channel through which BS11 notification must be filed and through which RBNZ report format validation is confirmed. They experience the problem if the project proceeds without opening the BS11 notification window — the bank is exposed to a regulatory breach that the RBNZ relationship team will be accountable for managing.

### P5 — Chief Risk Officer / Board (governance)
Under CPG 220, any credit decisioning model that is migrated or replaced as part of this project cannot go live without CRO-level sign-off. The board carries prudential accountability for the migration's risk management. They experience the problem if the migration proceeds without appropriate governance gates — the bank's regulatory standing with RBNZ is at risk.

---

## Why Now

The trigger is unambiguous and externally imposed: the legacy system vendor has confirmed that their support contract ends in 12 months, and they are withdrawing the product from market entirely. Contract extension is not available.

After the support end date:
- No security patches will be issued. The bank will be operating an unpatched core banking system holding 280,000 loan records in production.
- No vendor support is available for defects, outages, or incidents.
- RBNZ supervisory expectations require registered banks to operate systems with adequate support and security patching. Operating an unsupported system for a material period is an identifiable prudential risk.

There is no option to delay. The 12-month window is the project runway, not a target.

---

## MVP Scope

The minimum viable outcome for this initiative is:

1. **All 280,000 active loan accounts migrated** to the new core banking platform with full data integrity — original loan terms, drawdown history, repayment schedules, arrears status, and associated security registrations — validated by reconciliation before cutover.
2. **RBNZ regulatory reports replicated** on the new platform at prescribed format and field definitions, confirmed with the RBNZ relationship team before go-live.
3. **CCCFA 7-year retention satisfied** on the new platform for all migrated records, including closed loan records carried across for retention compliance — confirmed before legacy system decommission.
4. **Legacy system formally retired** before the vendor support end date.

The migration toolset supplied by the new platform vendor is in scope. The six-month parallel operation period, weekend cutover event, and six-month decommission window are the delivery mechanism.

**Explicit deferrals (in-scope boundary):**
- Commercial lending complexity (multi-tranche, covenant records) is in scope for migration data completeness — but any re-engineering of commercial lending *workflows* on the new platform is deferred to a post-migration initiative.
- New loan origination feature development on the new platform is out of scope for this project (new originations will simply be directed to the platform that is already operating).

---

## Out of Scope

| Item | Reason |
|---|---|
| New loan product development or feature enhancement on the new platform | This is a migration and decommission project. Product capability changes are a separate initiative — including them risks scope creep that delays the hard cutover deadline. |
| Re-engineering of commercial lending workflows on the new platform | Commercial lending workflow optimisation should follow migration, not run concurrent with it. Conflating the two creates delivery risk within the 12-month window. |
| Replacement or upgrade of the new platform's deposit account capability | The deposit platform has been in production for 14 months and is operating well. It is not in scope. |
| Integration of third-party credit bureau or origination systems beyond what is required for migrated account data | New integration work beyond the minimum required to replicate existing RBNZ reporting and account management is deferred. |
| Post-migration product or pricing changes | Any changes to loan terms, pricing, or product configuration on the new platform are out of scope for this project and must be managed as a separate change. |

---

## Assumptions and Risks

### Regulatory assumptions — RBNZ BS11

> [ASSUMPTION] The RBNZ BS11 notification window has not yet been opened — unconfirmed, requires /clarify before scope is locked.

**Why this matters:** Migration, decommission, or replacement of a core banking system is a material change under RBNZ BS11. The bank must notify RBNZ at least 30 business days before any irreversible project activity begins — this means before infrastructure provisioning, data migration toolchain work, or any step that cannot be unwound. If the notification window has not been opened, it must be opened immediately. The 30-business-day clock starts from RBNZ acknowledgement, not from submission. This is not a go-live notification — it is a pre-commencement obligation.

**Risk if unresolved:** Commencing material project activity without BS11 notification is a regulatory breach. Given the 12-month hard deadline, delay caused by a late notification could compress the delivery window further or require project suspension.

> [ASSUMPTION] The RBNZ relationship team has been briefed on this project and is available to support BS11 notification filing — unconfirmed, requires /clarify before scope is locked.

### Regulatory assumptions — CCCFA retention

> [ASSUMPTION] The 7-year CCCFA retention obligation covers all consumer credit records (personal loans, home loans) and is understood to run from contract end date, not origination date — confirmed by operator (legal team confirmation noted in brief). Treated as a confirmed constraint.

**Confirmed constraint — CCCFA:** Credit contract records must be retained for 7 years from the date the contract ends. Source system decommission cannot proceed until retention compliance is confirmed on the destination system. The legacy system cannot be retired until the new platform is confirmed to satisfy retention for all migrated records, including closed loans. The six-month decommission window must include a formal retention compliance sign-off step before infrastructure retirement.

> [ASSUMPTION] The new platform's retention and archival capability has been confirmed as compliant with the 7-year CCCFA obligation — unconfirmed, requires /clarify before scope is locked.

**Risk if unresolved:** If the new platform cannot satisfy 7-year retention natively (e.g., records older than a certain period are archived to cold storage that cannot be retrieved in a court-admissible format), the legacy system cannot be decommissioned on schedule regardless of migration completion. This is a hard gate, not a documentation preference.

### Regulatory assumptions — RBNZ reporting

> [ASSUMPTION] The full set of RBNZ regulatory reports currently generated by the legacy system has been documented and is available as a specification input for the new platform configuration — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] The RBNZ relationship team has confirmed the process and timeline for RBNZ to validate new platform report outputs against prescribed formats before go-live — unconfirmed, requires /clarify before scope is locked.

**Risk if unresolved:** If RBNZ report validation requires RBNZ's own review cycle (not just internal testing), the timeline for that validation must be built into the project schedule. RBNZ review cycles are not within the project team's control. A late start on report validation could block cutover regardless of data migration readiness.

### Technical and delivery assumptions

> [ASSUMPTION] The new platform's vendor migration toolset has been used for migrations of comparable scale (280,000 loan accounts with full history) and has a known data integrity validation capability — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] The six-person engineering team, data architect, and project manager have capacity allocated exclusively or predominantly to this project for the 12-month window — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] Security registrations (e.g., PPSR registrations, mortgage records) are held in a format that can be migrated by the vendor toolset without manual re-keying — unconfirmed, requires /clarify before scope is locked.

**Risk if unresolved:** Security registrations that cannot be programmatically migrated require manual processing at scale. At 280,000 accounts, even a 5% rate of manual intervention is 14,000 records. Manual processing at this volume within the cutover window is a serious delivery risk.

> [ASSUMPTION] The parallel operation period's "shadow mirroring" architecture (all transactions mirrored to the new platform) is technically validated and does not introduce transaction processing latency or integrity risk on the legacy system — unconfirmed, requires /clarify before scope is locked.

### CPG 220 — credit decisioning models

> [ASSUMPTION] No AI or ML credit decisioning models are being migrated or replaced as part of this initiative — unconfirmed, requires /clarify before scope is locked.

**Why this matters:** If any model currently used for credit limit setting, arrears scoring, or collections decisioning is migrated to a new runtime environment or replaced as part of this project, CPG 220 requires independent model risk validation before production use. CRO-level sign-off is a hard go-live gate. If this applies, model validation must be scoped, resourced, and scheduled separately — it cannot be absorbed into the migration delivery timeline without explicit planning.

### Delivery risk

The 12-month hard deadline creates a compressed risk profile:

- The six-month parallel operation period is not negotiable unless there is a contingency plan for accelerated cutover.
- If the reconciliation pass at the six-month mark reveals data integrity issues, there is a six-month window remaining. That window must absorb remediation, re-reconciliation, and cutover — plus the six-month decommission period. There is no buffer in this plan beyond what is already built in.
- The project has no named fallback position if the new platform fails parallel operation validation. This must be resolved as a governance question before project commencement.

---

## Directional Success Indicators

### SI-1 — Data migration completeness
**Baseline:** 280,000 active loan accounts on legacy system. Full history including drawdown, repayment schedules, arrears, and security registrations.
**Target:** 100% of records migrated with zero data loss or corruption. Zero tolerance — this is a legal and regulatory requirement, not a quality preference.
**Measurement:** Automated reconciliation pass comparing legacy system records to new platform records field-by-field, plus manual spot-check sample (sample size to be defined by data architect). Reconciliation tooling to be agreed with vendor migration team.

### SI-2 — RBNZ report parity
**Baseline:** Legacy system generates [N] prescribed RBNZ regulatory reports. [UNKNOWN BASELINE — full report inventory not confirmed in brief.]
**Target:** New platform generates identical outputs for all prescribed reports, confirmed by RBNZ relationship team before cutover.
**Measurement:** Side-by-side report comparison across a minimum of three consecutive reporting periods during parallel operation. RBNZ relationship team sign-off required.

### SI-3 — CCCFA retention compliance
**Baseline:** Legacy system holds all credit contract records back to [UNKNOWN BASELINE — oldest active/closed record age not stated].
**Target:** New platform confirmed to satisfy 7-year retention from contract end date for 100% of migrated records before legacy decommission. Confirmed by legal team sign-off.
**Measurement:** Legal and compliance team retention audit on new platform before decommission gate is opened.

### SI-4 — Operational continuity during parallel operation
**Baseline:** Current legacy system SLA/uptime (not stated — [UNKNOWN BASELINE]).
**Target:** Zero unplanned customer-impacting outages attributable to the migration during the six-month parallel operation period. Any transaction processing errors during shadow mirroring caught and remediated before cutover.
**Measurement:** Incident log during parallel operation period; shadow mirroring discrepancy report (frequency to be defined).

### SI-5 — BS11 notification compliance
**Baseline:** [UNKNOWN BASELINE — whether notification has been opened is unconfirmed.]
**Target:** BS11 notification filed with RBNZ and 30-business-day window completed before any irreversible project activity begins.
**Measurement:** RBNZ acknowledgement receipt on file. Date of acknowledgement must precede date of first irreversible project step (infrastructure provisioning, toolchain deployment, data migration trial runs).

---

## Constraints

**C1 — Hard deadline:** Vendor support end date is 12 months from now. This is a non-negotiable external constraint. The legacy system must be decommissioned before this date.

**C2 — RBNZ BS11 notification (regulatory — hard):** Any material change to a core banking system requires RBNZ notification at least 30 business days before irreversible project activity begins. This notification must be filed immediately if it has not already been opened. Source: RBNZ BS11 Outsourcing Policy.

**C3 — CCCFA 7-year retention (regulatory — hard):** Consumer credit contract records (personal loans, home loans) must be retained for 7 years from contract end date. The legacy system cannot be decommissioned until retention compliance is confirmed on the new platform. Source: Credit Contracts and Consumer Finance Act 2003; confirmed by operator legal team.

**C4 — Data integrity — zero tolerance (regulatory and legal — hard):** No loan record can be lost or corrupted in migration. This is a legal obligation (CCCFA), a regulatory obligation (RBNZ prudential expectations), and a direct customer harm risk. A 100% reconciliation pass is mandatory before cutover. There is no acceptable loss tolerance.

**C5 — RBNZ report format and field definitions (regulatory — hard):** RBNZ regulatory reports must be produced in prescribed format. The new platform's report outputs must be validated against these prescriptions before cutover. The RBNZ relationship team must be involved in validation. Source: RBNZ reporting obligations; noted by operator.

**C6 — Team capacity (resource):** Six engineers, one data architect, one project manager. Additional resourcing beyond this team is not described in the brief. [ASSUMPTION] This team size is sufficient for the delivery scope within the 12-month window — unconfirmed, requires /clarify before scope is locked.

**C7 — CPG 220 model validation (regulatory — conditional):** If any AI or ML credit decisioning model is in scope, independent model risk validation and CRO sign-off are required before production use. Source: CPG 220 (APRA); applicable as de facto standard for NZ registered banks pending RBNZ BS2B. This constraint is conditional on whether such models are in scope (see Assumptions).

**C8 — New platform vendor migration toolset (technical):** The project is dependent on the vendor-supplied migration toolset. The capability, validation features, and support terms of this toolset are not yet confirmed. [ASSUMPTION] The toolset is fit for purpose at the required scale — unconfirmed, requires /clarify before scope is locked.

---

## /clarify recommendation

This discovery contains **10 unconfirmed assumptions** that affect scope, regulatory compliance, and delivery feasibility. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

1. [ASSUMPTION] The RBNZ BS11 notification window has not yet been opened — unconfirmed, requires /clarify before scope is locked.
2. [ASSUMPTION] The RBNZ relationship team has been briefed on this project and is available to support BS11 notification filing — unconfirmed, requires /clarify before scope is locked.
3. [ASSUMPTION] The new platform's retention and archival capability has been confirmed as compliant with the 7-year CCCFA obligation — unconfirmed, requires /clarify before scope is locked.
4. [ASSUMPTION] The full set of RBNZ regulatory reports currently generated by the legacy system has been documented and is available as a specification input for the new platform configuration — unconfirmed, requires /clarify before scope is locked.
5. [ASSUMPTION] The RBNZ relationship team has confirmed the process and timeline for RBNZ to validate new platform report outputs against prescribed formats before go-live — unconfirmed, requires /clarify before scope is locked.
6. [ASSUMPTION] The new platform's vendor migration toolset has been used for migrations of comparable scale and has a known data integrity validation capability — unconfirmed, requires /clarify before scope is locked.
7. [ASSUMPTION] The six-person engineering team, data architect, and project manager have capacity allocated exclusively or predominantly to this project for the 12-month window — unconfirmed, requires /clarify before scope is locked.
8. [ASSUMPTION] Security registrations are held in a format that can be migrated by the vendor toolset without manual re-keying — unconfirmed, requires /clarify before scope is locked.
9. [ASSUMPTION] The parallel operation period's shadow mirroring architecture is technically validated and does not introduce transaction processing latency or integrity risk on the legacy system — unconfirmed, requires /clarify before scope is locked.
10. [ASSUMPTION] No AI or ML credit decisioning models are being migrated or replaced as part of this initiative — unconfirmed, requires /clarify before scope is locked.

**Priority:** Assumptions 1 and 2 (BS11 notification) must be resolved first — they affect whether the project can legally commence irreversible activities. If BS11 notification has not been opened, that is the single most urgent action regardless of all other project activity.

---

## Attribution

**Contributors:**
- [Operator] — Initiating brief and problem statement — 2025-07-15

**Reviewers:**
- Pending

**Approved By:**
- Pending

> ⚠️ **Governance note:** This artefact must not be marked Approved until the Approved By field is populated with a named individual, role, and date. A non-engineering approver is expected for M3 measurement. Leaving Approved By empty will result in a H-GOV hard block at Definition of Ready.

---

## Approval gate

**Discovery draft complete ✓**

Given the volume of unresolved regulatory assumptions — particularly the BS11 notification status — running `/clarify` before approval is strongly recommended.

How do you want to proceed?
1. **Run /clarify now (recommended)** — resolve the 10 open assumptions before locking scope
2. **Review and approve without /clarify** — proceed to sign-off with assumptions on record

Reply: `1` or `2`

---

*Before closing: run `/estimate` to record a rough focus-time forecast for this feature. Reply `/estimate` or `skip`.*

---

> **Pipeline state update:** When approved, `.github/pipeline-state.json` will be updated with `stage: "discovery"`, `health: "green"`, `regulated: true`, `complianceProfile: "regulated"`, `complianceFrameworks: ["RBNZ_BS11", "CCCFA", "CPG_220", "RBNZ_Reporting"]`, and guardrails seeded for each framework at `status: "not-assessed"`.

<!-- eval-mode: true -->