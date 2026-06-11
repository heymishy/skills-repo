# Discovery: Legacy Loan Ledger Decommission & Migration

## 1. Project Summary

Migrate ~280,000 active loan accounts (personal, home, commercial) from an 18-year-old legacy loan ledger to the incumbent core banking platform (live for deposits for 14 months), then retire the legacy system. Hard external deadline: vendor support ends in 12 months with no extension possible.

---

## 2. Objectives

| # | Objective | Type |
|---|-----------|------|
| O1 | All 280,000 loan accounts migrated with zero loss/corruption of records | Primary |
| O2 | Legacy system fully decommissioned; single core platform in operation | Primary |
| O3 | New platform produces all prescribed RBNZ regulatory reports, confirmed compliant | Compliance |
| O4 | 7-year retention of credit contract records preserved post-decommission (including closed loans) | Compliance |
| O5 | No disruption to loan servicing, repayments, arrears management during transition | Operational |

---

## 3. Timeline Analysis ⚠️

This is the area the brief most needs to confront. Working backwards from the stated plan:

```
Month 0          Month 6              Month 12             Month 18
|----------------|--------------------|--------------------|
  Build & prep     Parallel operation    Decommission window
  (mirroring,      (shadow mode +        (legacy retired by
  mapping, tooling) reconciliation)       month 18)
                                       ^ Hard cutover deadline
                                       ^ Vendor support ENDS
```

**Findings:**

1. **The entire build phase is compressed into ~6 months.** Data mapping for 18 years of loan history, the transaction mirroring mechanism, migration tooling integration, reconciliation framework, and RBNZ report build must all be production-ready before parallel operation can begin. Any slippage here directly eats the parallel period or pushes cutover past the support deadline.
2. **Cutover lands exactly on the support expiry date — there is zero buffer.** If the month-6 reconciliation gate fails, the fallback is running production lending on unsupported, unpatched software. The plan currently has no contingency for a failed validation gate.
3. **The post-cutover decommission window (months 12–18)** is lower risk since accounts will already be off the legacy system, but the legacy system will be unsupported during this period — its role and security posture during that window need defining.

**Recommendation:** Target cutover at month 10–11 to create buffer, or define an explicit contingency (e.g., partial/staged cutover by portfolio segment, isolation/hardening plan for an unsupported legacy system).

---

## 4. Scope

### In Scope
- Migration of 280,000 active loan accounts: full history — original terms, drawdowns, repayment schedules, arrears status, security registrations
- New originations onto new platform from day one of parallel period
- Transaction mirroring (legacy → new platform shadow mode) for 6 months
- Reconciliation and data integrity validation framework
- RBNZ regulatory reporting parity on new platform, validated with RBNZ relationship team
- 7-year archival solution for credit contract records (active and closed loans)
- Staged weekend cutover of remaining legacy accounts
- Legacy infrastructure retirement

### Implicitly In Scope (not stated — confirm)
- Interest accrual / rounding reconciliation between platform calculation engines
- Integrations: payment systems, direct debits, collections/arrears workflows, broker/origination channels, GL posting
- Security interest registers (PPSR, land title links for home loans) — re-pointing or re-registration
- Customer-facing impacts: statements, internet banking views, repayment references, required customer notifications
- Staff training and operational runbooks for loan servicing on the new platform

### Out of Scope (assumed — confirm)
- Deposit accounts (already migrated)
- Product redesign or loan term changes during migration
- Legacy vendor involvement beyond contract end

---

## 5. Constraints

| Constraint | Detail |
|---|---|
| **Hard deadline** | 12 months to cutover — vendor exiting market, no extension |
| **Regulatory** | RBNZ report formats/fields prescribed; 7-year credit record retention under consumer finance legislation |
| **Team** | 6 engineers, 1 data architect, 1 PM — fixed, in-house |
| **Tooling** | Migration toolset supplied by new platform vendor (capability/fit unverified) |
| **Cutover method** | Staged weekend migration — implies per-stage rollback capability needed |

---

## 6. Key Risks

| ID | Risk | Impact | Notes |
|----|------|--------|-------|
| R1 | Reconciliation gate fails at month 6 → cutover slips past support expiry | Critical | No stated contingency; production lending on unsupported software |
| R2 | Calculation divergence between platforms (interest accrual, rounding, arrears aging) makes mirrored shadow records irreconcilable | High | Classic dual-run failure mode; tolerance thresholds must be defined up front |
| R3 | 18 years of data — schema drift, historical data quality issues, undocumented legacy behaviours | High | Likely the largest hidden effort; profile data **early** |
| R4 | Vendor migration toolset doesn't fit legacy data model | High | Validate with a sample extract in month 1 |
| R5 | RBNZ report sign-off becomes a long-lead dependency | Medium | Engage RBNZ relationship team in build phase, not after parallel run |
| R6 | Security registrations not cleanly transferable; legal re-registration effort underestimated | Medium | Especially commercial lending securities |
| R7 | Team capacity: 8 people covering build, mirroring, reconciliation, reporting, cutover, archival in parallel | Medium | No stated coverage for testing, ops, or BA roles |
| R8 | Closed-loan records on legacy system missed from archival scope (focus is on 280k *active*) | Medium | 7-year retention applies to closed loans too — volume unknown |
| R9 | Mirroring mechanism introduces load/instability on aging legacy system | Medium | 18-year-old system may not tolerate real-time replication |

---

## 7. Open Questions

**Timeline & contingency**
1. What is the fallback if the month-6 validation gate fails — partial cutover, hardened unsupported operation, or other?
2. Is the build phase scoped — has anyone validated that mirroring + tooling + reports fit in ~6 months?

**Data**
3. How many *closed* loan records exist on legacy (beyond the 280k active) that fall within the 7-year retention window?
4. Has any data profiling of the legacy database been done? Known data quality issues?
5. What are acceptable reconciliation tolerances (cents-level interest differences, date handling)?

**Platform & integrations**
6. Does the new platform already support all three loan product types (personal, home, commercial) or is product configuration part of the build?
7. What systems integrate with the legacy ledger today (payments, collections, GL, credit bureau, broker channels)?
8. Is the vendor migration toolset proven on loan products, or only deposits?

**Regulatory & legal**
9. Which specific RBNZ reports are in scope, and what is the RBNZ confirmation process and lead time?
10. Where will archived records live for 7 years post-decommission — new platform, dedicated archive, or read-only data store? Who validates legal admissibility of migrated records?
11. Are customer notifications legally required for the servicing platform change?

**Operations**
12. During parallel/shadow mode, which system is the source of truth for customer servicing and arrears decisions?
13. What is the rollback plan for a failed weekend cutover stage?

---

## 8. Stakeholders

- **Project team** — PM, data architect, 6 engineers (in-house)
- **New platform vendor** — migration toolset, platform configuration support
- **Legacy vendor** — extracts/documentation support until contract end (secure commitments early)
- **RBNZ relationship team** — report compliance confirmation
- **Legal/compliance** — 7-year retention, customer notification obligations, security registrations
- **Loan operations / collections** — dual-run servicing, cutover validation, training
- **Customers** — 280,000 account holders (communication, statement continuity)
- **Internal audit / risk** — likely sign-off authority on the cutover gate (confirm)

---

## 9. Success Criteria (Draft)

1. 100% of active loan accounts migrated; reconciliation report shows zero unresolved discrepancies above agreed tolerance
2. Full historical record (terms, drawdowns, schedules, arrears, securities) retrievable on new platform for every migrated account
3. RBNZ reports generated from new platform confirmed compliant by RBNZ relationship team **before** cutover
4. 7-year archival solution operational and legally signed off before legacy decommission
5. Legacy system retired by month 18; no production dependency on it after cutover
6. No customer-impacting servicing errors attributable to migration (define measurement)

---

## 10. Recommended Next Steps

1. **Week 1–4: Data profiling spike** — extract a representative sample across all three loan types and oldest cohorts; run through the vendor toolset to validate fit (de-risks R3, R4)
2. **Define the cutover contingency plan** before committing the timeline (R1)
3. **Engage RBNZ relationship team now** to map the report confirmation process and lead time (R5)
4. **Scope the closed-loan archival problem** — volume, format, target store (R8)
5. **Inventory legacy integrations** to size the hidden integration workload
6. Re-baseline the plan with an internal cutover target of month 10–11, holding month 12 as contingency

Шall I proceed to the next pipeline stage (e.g., requirements elaboration or risk deep-dive on any of the items above)?