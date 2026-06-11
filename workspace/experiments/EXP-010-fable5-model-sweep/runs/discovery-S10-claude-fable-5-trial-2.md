# Discovery Report: Legacy Loan Ledger Decommission & Migration

## 1. Project Summary

Migrate ~280,000 active loan accounts (personal, home, commercial) from an 18-year-old legacy ledger to the incumbent core banking platform (live for deposits for 14 months), then retire the legacy system. Hard external deadline: vendor support ends in 12 months, with no extension possible.

---

## 2. Stated Goals

- Single core banking platform for deposits and lending
- Zero loan records lost or corrupted; full history migrated (terms, drawdowns, repayment schedules, arrears, security registrations)
- New platform produces all prescribed RBNZ regulatory reports
- 7-year retention of credit contract records preserved post-migration
- Legacy infrastructure formally decommissioned

---

## 3. Timeline Analysis ⚠️

This is the most significant finding from discovery. Working backwards from the 12-month support expiry:

| Phase | Window | Implication |
|---|---|---|
| Cutover (staged weekend) | Month ~12 | Lands **exactly** on the support expiry date |
| Parallel/shadow operation | Months 6–12 | Must begin no later than month 6 |
| Build & preparation | Months 0–6 | All remaining work compressed here |
| Decommission | Months 12–18 | Legacy runs **unsupported** during this period |

**Issues identified:**

1. **Zero schedule contingency.** Any slip in the 6-month prep phase either compresses the parallel period (undermining the validation it exists to provide) or pushes cutover past support expiry — meaning live loan accounts running on an unpatched, unsupported system.
2. **The prep phase carries enormous scope.** In ~6 months the team must: complete data mapping for 18 years of schema evolution, configure three loan product classes on the new platform, build the transaction mirroring infrastructure for shadow mode, stand up new-business origination on the new platform, develop and validate RBNZ reports, and define reconciliation criteria. This is the real critical path, not the cutover.
3. **Post-cutover legacy exposure.** The 6-month decommission window falls entirely after support expiry. Risk is lower if the system is read-only at that point, but this should be an explicit, documented risk acceptance — including what happens if a post-cutover reconciliation issue requires the legacy system as a live reference.

**Recommendation:** Treat month 6 (parallel-start readiness) as the governing milestone, not the month-12 cutover. Consider whether the parallel period can be tranche-based (e.g., personal loans enter shadow mode earlier than commercial) to de-risk the single big-bang readiness date.

---

## 4. Key Risks

| # | Risk | Severity | Notes |
|---|---|---|---|
| R1 | New platform has never run lending in production | **High** | 14 months of deposit operation does not prove loan capability — interest accrual, amortisation, drawdown facilities, arrears management, hardship variations. Commercial lending especially (facilities, revolving credit, multi-drawdown) is structurally different from deposits. Has the vendor's loan module run at comparable scale elsewhere? |
| R2 | Calculation divergence between systems | **High** | Day-count conventions, rounding rules, compounding, fee timing, and arrears interest will differ subtly between an 18-year-old system and a modern one. Cent-level divergence × 280k accounts × 6 months of parallel running = reconciliation noise that can mask real defects. Tolerance thresholds must be defined **before** parallel begins. |
| R3 | Data quality in the legacy system | **High** | 18 years implies multiple schema migrations, defunct product codes, manually patched records, and undocumented workarounds. Data profiling should be the **first** technical activity — it sizes everything else. |
| R4 | Shadow-mode mirroring is itself a build project | **High** | Real-time or batch mirroring of all transactions for 6 months, with mismatch detection, is significant engineering. It's listed as a plan feature but is actually a deliverable with its own design, build, and test cycle. |
| R5 | RBNZ report validation timeline | **Medium-High** | Prescribed formats leave no interpretation room. Reports should be produced from the shadow platform during the parallel period and reconciled against legacy outputs each cycle. RBNZ relationship team engagement should start now, not at validation. |
| R6 | Security registrations | **Medium-High** | PPSR financing statements and land title securities (LINZ) reference loan accounts. Does migration change any identifier embedded in registrations? Re-registration or registry corrections at scale carry legal effect and cost. Legal review needed early. |
| R7 | Cutover rollback undefined | **Medium-High** | "Staged weekend migration" needs a per-tranche go/no-go and rollback design. Once accounts transact on the new platform, rollback becomes reverse-migration — far harder than restore. Define the point of no return per tranche. |
| R8 | Team sizing | **Medium** | 6 engineers + 1 data architect + 1 PM, with no named QA/test capability, business analyst, lending SMEs, operations resource, or compliance liaison. Reconciliation at 280k-account scale is a substantial testing workload on its own. The vendor toolset reduces ETL effort but not validation effort. |
| R9 | In-flight and edge-case accounts | **Medium** | Loans in hardship arrangements, active collections, litigation holds, partially drawn facilities, or restructures mid-flight at cutover need explicit handling rules. These are precisely the accounts where errors cause customer harm and regulatory attention. |
| R10 | Payments and downstream integrations | **Medium** | Direct debits, repayment instructions, broker channels, statements, customer-facing channels, GL feeds, collections systems — every legacy integration point needs an inventory. None are mentioned in the brief. |

---

## 5. Assumptions Requiring Validation

- **A1:** The new platform's loan modules support all three product classes with current contractual features (offset arrangements, redraw, fixed/floating splits, fee structures) — *unvalidated*.
- **A2:** The vendor migration toolset handles full transactional history, not just current-state balances — *unvalidated; many migration tools migrate positions, not history*.
- **A3:** "Active" accounts (280k) is the full migration scope. **Open question:** what happens to closed-loan records within the 7-year retention window that exist only on the legacy system? They must be migrated, archived to an independent store, or the retention obligation is breached at decommission.
- **A4:** Mirroring is one-directional (legacy → new). If any writes occur on the new platform against legacy-mastered accounts during parallel, the architecture is materially harder.
- **A5:** Regulatory notification/non-objection requirements (RBNZ, and CCCFA-related conduct obligations) for a core migration of this scale have been confirmed by legal/compliance — *unvalidated*.

---

## 6. Open Questions

1. Has the new platform vendor's lending module run in production at ≥280k account scale at another institution? Reference checks?
2. What is the archival/retention strategy for closed loans and for legacy data not migrated — independent immutable archive, or full migration?
3. What are the reconciliation acceptance criteria and who signs off? (Recommend: defined per data class — balance tolerance, schedule match, arrears status exact-match, security registration exact-match.)
4. How are new originations between now and parallel-start handled — already on the new platform, or still entering legacy?
5. What is the staging dimension for the weekend cutover — by product, by branch, alphabetical, by risk tier? Recommend lowest-risk tranche first (simple closed-near or vanilla personal loans).
6. Customer communication obligations — do contract terms or CCCFA require notification of the servicing system change, payment reference changes, or statement format changes?
7. Is there a dress-rehearsal plan — full-volume mock migrations against production-scale data before the real event? (Strongly recommended: minimum two full rehearsals.)
8. What does the legacy decommission actually require in months 12–18 — data extraction for archive, licence wind-down, infrastructure teardown — and does any of it depend on