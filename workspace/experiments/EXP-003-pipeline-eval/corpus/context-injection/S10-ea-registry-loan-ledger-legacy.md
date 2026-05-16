# Synthetic EA Registry Entry
# Application: Core Banking Platform — Loan Ledger (Legacy System: LoanLedger-NZ)
# Registry version: 2026-Q1
# Status: DECOMMISSION PLANNED — migration to new core banking platform in progress
# Entry type: Internal Application (legacy)

---

## Application Profile

**Name:** LoanLedger-NZ (Legacy Loan Ledger System)
**Replacement system:** CoreBanking-NXT (already live for deposits; being extended to loans)
**Owner:** Retail Technology, the enterprise
**Domain:** Core Banking / Retail Lending
**Classification:** Regulated — CCCFA, RBNZ BS7/BS11, RBNZ Prudential Reporting
**Criticality:** CRITICAL — hosts 280,000 active loan accounts
**Data classification:** Restricted — customer credit account data, payment history, security registrations
**End-of-life:** Vendor support contract ends 12 months from project initiation. No extension available.

**Description:**
Legacy loan ledger system in production for 18 years. Manages all active personal loan, home loan, and commercial lending accounts at the enterprise. Produces RBNZ-prescribed prudential reports (BS3 Asset Quality, BS7 Statistical Return) directly from internal reporting modules. System is approaching vendor end-of-life. Migration to CoreBanking-NXT is required within the vendor deadline.

**Hosting:** On-premises, the enterprise Auckland data centre
**Technology stack:** IBM DB2, COBOL batch processing, J2EE reporting tier
**Environments:** Production only (no dev/UAT — new feature development has been frozen)

---

## Interface Map

### Upstream inputs (data written to LoanLedger-NZ)

| Interface ID | Application | Interface type | Data transferred | Notes |
|-------------|-------------|---------------|-----------------|-------|
| LLNZ-UP-001 | Loan Origination System | Batch interface | New loan applications approved and funded | Daily batch; new originations redirected to CoreBanking-NXT once migration starts |
| LLNZ-UP-002 | Direct Debit Processing | Internal batch | Repayment receipts and reversals | Will be re-pointed to CoreBanking-NXT at cutover |
| LLNZ-UP-003 | Hardship Operations System | Internal API | Hardship flag updates, repayment arrangement records | New integrations to CoreBanking-NXT must replicate this |

### Downstream consumers of LoanLedger-NZ data

| Interface ID | Application | Interface type | Data transferred | Notes |
|-------------|-------------|---------------|-----------------|-------|
| LLNZ-DN-001 | RBNZ Reporting Module (internal) | Internal batch | BS3 and BS7 prudential return data | Must be replicated in CoreBanking-NXT before decommission |
| LLNZ-DN-002 | Credit Collections System | Internal batch | Arrears flags, days-past-due, outstanding balance | Must be re-pointed to CoreBanking-NXT at cutover |
| LLNZ-DN-003 | Mortgage Register Integration | External | Security registration references for home loans | PPSR/Landonline registration IDs — must be preserved in migration |
| LLNZ-DN-004 | Customer Statements System | Internal batch | Loan account statements for customer delivery | Re-pointed at cutover |
| LLNZ-DN-005 | Analytics Platform | Internal data lake feed | Anonymised loan portfolio data for risk analysis | Re-pointed at cutover |

---

## Migration profile (LoanLedger-NZ → CoreBanking-NXT)

**Migration type:** Full account migration — all active and closed loan accounts within statutory retention period
**Data volume:** ~280,000 active accounts; estimated 1.4 million historical records (active + closed, 7-year window)
**Migration toolset:** CoreBanking-NXT vendor migration toolset (not yet procured or deployed)
**Parallel operation period:** 6 months (planned) — new originations on CoreBanking-NXT; existing accounts on LoanLedger-NZ with shadow mirroring
**Cutover approach:** Staged weekend migration; all remaining legacy accounts cut over in batches over 3 weekends at the end of parallel operation

### Migration constraints

| Constraint ID | Description | Source |
|--------------|-------------|--------|
| MCON-001 | All 280,000 active loan records must be migrated with zero data loss — original loan terms, drawdown history, repayment schedules, arrears status, security registrations | CCCFA record retention obligation |
| MCON-002 | Closed loan records within 7-year retention window must also be migrated — not just active accounts | CCCFA s.20 — credit contract records retained 7 years |
| MCON-003 | RBNZ BS11 — 30 business day advance notification required before implementation of material change to core banking system. Applies to both start of migration work and to the cutover date. | RBNZ BS11 s.4.2 |
| MCON-004 | CoreBanking-NXT must produce equivalent RBNZ BS3 and BS7 reports before cutover is approved | RBNZ Prudential Reporting Standards |
| MCON-005 | Security registrations (PPSR, Landonline) associated with migrated loan accounts must be verified as transferable or re-registered | Legal obligation — security interests must not lapse on migration |
| MCON-006 | No customer-visible service interruption longer than the agreed RTO during cutover weekends | Operational constraint — Board Risk Committee approved SLA |

---

## Regulatory obligations

| Obligation | Regulator | Detail |
|-----------|-----------|--------|
| RBNZ BS11 Technology Risk Policy — 30-business-day advance notification for material changes to core systems | RBNZ | See separate BS11 excerpt (context injection file S10-rbnz-bs11-excerpt.md) |
| RBNZ Prudential Reporting — BS3 (Asset Quality) and BS7 (Statistical Return) reports must continue without interruption through migration and be produced from CoreBanking-NXT before decommission | RBNZ | Reporting Standards |
| CCCFA s.20 — credit contract records retained 7 years; applies to both active and closed accounts | FCA / MBIE | Retention obligation survives migration |
| PPSR Act — perfected security interests (personal property) must remain perfected through migration; any lapse during migration creates priority risk | MBIE | Applies to personal loan security registrations |

---

## Known risks

| ID | Description | Severity |
|----|-------------|---------|
| LLNZ-RISK-001 | RBNZ BS11 30-business-day notification has not been filed. Project initiation may already have triggered the notification obligation. Filing must occur before development work begins. | CRITICAL |
| LLNZ-RISK-002 | CoreBanking-NXT vendor migration toolset has not been procured or demonstrated on the enterprise data volumes. Migration toolset capability is unproven. | HIGH |
| LLNZ-RISK-003 | RBNZ BS3/BS7 report equivalence on CoreBanking-NXT has not been validated. Report formats and field derivations may differ. | HIGH |
| LLNZ-RISK-004 | PPSR registration transfer process not confirmed with legal. Home loan security registrations may require manual re-registration at cutover. | HIGH |

---

## Dependencies

**LoanLedger-NZ depends on:**
- IBM DB2 (on-premises database — vendor support ending with contract)
- J2EE application server (legacy; no longer supported by vendor)

**Applications that depend on LoanLedger-NZ:**
- RBNZ Reporting Module
- Credit Collections System
- Mortgage Register Integration (PPSR/Landonline)
- Customer Statements System
- Analytics Platform
- CoreBanking-NXT (shadow mirror during parallel operation)
