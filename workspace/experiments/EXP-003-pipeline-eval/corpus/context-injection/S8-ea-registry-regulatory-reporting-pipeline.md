# Synthetic EA Registry Entry
# Application: Regulatory Reporting Pipeline (Westpac NZ Finance Operations)
# Registry version: 2026-Q1
# Status: PROPOSED — not yet registered (this entry models the expected registration)
# Entry type: Internal Application

---

## Application Profile

**Name:** Regulatory Reporting Pipeline
**Owner:** Finance Operations, Westpac NZ
**Domain:** Finance / Regulatory Compliance
**Classification:** Regulated — RBNZ Prudential Reporting, FMA Financial Reporting
**Criticality:** HIGH — supports statutory regulatory submissions
**Data classification:** Confidential — contains aggregated financial and balance sheet data

**Description:**
Automated pipeline that extracts balance sheet and transaction data from core banking, treasury, and card source systems, applies reconciliation and normalisation transformations, and produces pre-populated regulatory return files for analyst review and submission to RBNZ and FMA regulatory portals. Analysts retain approval authority before any submission is dispatched.

**Hosting:** On-premises, Westpac NZ Auckland data centre
**Technology stack:** Python (transformation layer), Azure Data Factory (orchestration), PostgreSQL (audit log), SharePoint Online (return file staging for analyst review)
**Environment:** Production (proposed), Development, UAT

---

## Interface Map

### Upstream sources (READ ONLY — no write-back permitted)

| Interface ID | Application | Interface type | Data transferred | Access method |
|-------------|-------------|---------------|-----------------|---------------|
| RRPL-UP-001 | CoreBanking-GL (General Ledger) | Internal API — read only | Balance sheet ledger entries, account balances, daily closing positions | REST API (authenticated, read-only service account) |
| RRPL-UP-002 | TreasuryLedger | Internal API — read only | Treasury position data, FX exposures, derivative valuations, money market balances | REST API (authenticated, read-only service account) |
| RRPL-UP-003 | CardPlatform | Internal API — read only | Card transaction volumes, outstanding balances, charge-off data, interest accruals | REST API (authenticated, read-only service account) |

### Downstream / submission interfaces (WRITE — controlled submission pathway)

| Interface ID | Application | Interface type | Data transferred | Submission authority |
|-------------|-------------|---------------|-----------------|---------------------|
| RRPL-DN-001 | RBNZ Reporting Portal | External — RBNZ managed | Completed RBNZ prudential return files (BS2, BS3, BS7, BS11 quarterly attachments) | Designated finance officer sign-off required before submission |
| RRPL-DN-002 | FMA Submission Gateway | External — FMA managed | FMA regulatory return files (Annual Financial Statements return, FMA Statistical Return) | Designated finance officer sign-off required before submission |

### Audit and governance

| Interface ID | Application | Interface type | Purpose |
|-------------|-------------|---------------|---------|
| RRPL-AUD-001 | Internal Audit Log (PostgreSQL) | Internal write | Every transformation step logged with: input data version, transformation rule ID, transformation rule version, approver, timestamp, output hash |
| RRPL-AUD-002 | Finance SharePoint | Internal write | Analyst review workflow: pre-populated return file staged for review, review comments, approval signature, submission confirmation |

---

## Regulatory obligations affecting this application

| Obligation | Regulator | Relevant section |
|-----------|-----------|-----------------|
| RBNZ Prudential Reporting Standards — prescribed return formats and field definitions | RBNZ | BS2 Capital Adequacy Return, BS3 Asset Quality, BS7 Statistical Return |
| RBNZ submission deadline — 20th of each month for prior month prudential returns | RBNZ | Reporting Standards preamble |
| RBNZ Technology Risk Policy (BS11) — material changes to systems producing regulatory reports require 30-business-day advance notification | RBNZ | BS11 s.4.2 (material change definition includes changes to data processing systems that affect reported figures) |
| FMA Financial Reporting Act 2013 — full audit trail of all transformations, producible within 5 business days of regulator request | FMA | Regulatory Returns Guide 2022, s.3.4 |
| FMA methodology change — any change to how a reported figure is derived requires disclosure to FMA and, where material, prior FMA acknowledgement | FMA | Regulatory Returns Guide 2022, s.2.1 |

---

## Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| RRPL-RISK-001 | TreasuryLedger does not have a regulatory-data REST API in the vendor's standard offering. Current data flow requires manual CSV extract by treasury operations team. Automated extraction requires either custom API development or treasury vendor engagement. | HIGH |
| RRPL-RISK-002 | The normalisation transformation applied to source system fields (to correct rounding and timing mismatches from 2019 migration) has not been placed under formal change control. The transformation rules exist only in an Excel macro. This transformation changes figures that appear in regulatory returns. | CRITICAL — requires governance remediation before pipeline deployment |
| RRPL-RISK-003 | RBNZ has not been notified that normalised figures (rather than raw source figures) have been submitted in prudential returns. Retroactive disclosure obligation may exist. | HIGH |

---

## Dependencies

**This application depends on:**
- CoreBanking-GL — for GL ledger data
- TreasuryLedger — for treasury position data (current manual extract; automation TBD)
- CardPlatform — for card portfolio data
- RBNZ Reporting Portal — external submission channel
- FMA Submission Gateway — external submission channel
- Internal Audit Log (PostgreSQL) — for audit trail persistence

**Applications that depend on this application:**
- Finance Operations reporting dashboards (read from audit log for status monitoring)
- Internal Audit team (read-only access to audit trail for audit evidence)

---

## Change control requirements

Any change to transformation logic in this pipeline must follow the Finance Operations Change Control Procedure:
1. Change request raised in Jira Finance Change Board
2. Business owner approval (Finance Operations Manager)
3. Independent technical review of transformation rule changes
4. Legal / compliance sign-off if change affects figures submitted to RBNZ or FMA
5. RBNZ notification (BS11 s.4.2) at least 30 business days before implementation if change is material
6. Test evidence generated in UAT environment
7. CAB approval before production deployment

*Note: The normalisation transformation currently embedded in the Excel macro has NOT been through this procedure.*
