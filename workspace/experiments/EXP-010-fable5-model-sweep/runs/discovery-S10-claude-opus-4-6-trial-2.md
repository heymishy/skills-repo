

# Discovery Analysis: Legacy Loan Ledger Decommissioning & Migration

## Executive Summary

This is a core banking migration programme to consolidate approximately 280,000 active loan accounts from an end-of-life legacy ledger onto your existing core banking platform, driven by a hard 12-month deadline imposed by the vendor withdrawing the product from market. The programme design follows a parallel-run model with a 6-month shadow period, a staged cutover, and a 6-month decommissioning tail. The scope, constraints, and risk profile are well-articulated, but several areas require significantly deeper specification before execution planning can proceed safely.

---

## What Is Well-Defined

**The constraint envelope is clear and firm.** You have a 12-month hard deadline with no extension option, a defined parallel-run architecture, a known account volume, and an established target platform with 14 months of production history on the deposit side. The vendor is providing migration tooling. The team composition is specified. The legal retention requirement (7-year credit contract retention under New Zealand consumer finance legislation — likely the Credit Contracts and Consumer Finance Act 2003 and associated regulations) is identified. The RBNZ reporting obligation is flagged.

**The phased approach is sensible.** New originations on the new platform from day one reduces the migration population over time and immediately begins building operational confidence with loan products on the target platform. Shadow-mode mirroring during parallel run provides a reconciliation baseline. Staged weekend cutover limits blast radius. This is a well-established migration pattern for core banking transitions.

**The target platform has production credibility.** Fourteen months of stable deposit operations means your team already understands the platform's operational characteristics, deployment model, incident patterns, and vendor relationship dynamics. You are not adopting an unknown system — you are extending a known one into a new product domain.

---

## What Requires Clarification or Deeper Specification

### 1. Loan Product Complexity and Platform Readiness

**This is the area I am most concerned about.**

The brief references three loan product categories — personal loans, home loans, and commercial lending — but these are broad classes. The critical question is whether the new platform has been configured, tested, and validated for every loan product variant currently in the legacy system.

**Questions that need answers before this programme is viable:**

- How many distinct loan products exist on the legacy system? Not three categories — the actual product count. Legacy systems that have been in production for 18 years typically accumulate significant product variation. There will be products that were offered five or ten years ago, are no longer originated, but still have active accounts. Every one of these must be representable on the new platform.
- For each product, what are the specific calculation methodologies? Interest accrual methods (daily balance, monthly balance, flat rate, reducing balance), compounding frequencies, rate reset mechanisms for variable and fixed-rollover products, break cost formulas, fee capitalisation rules, early repayment calculation methods. These must produce identical financial outcomes on the new platform to the cent.
- Are there bespoke or manually-managed loan arrangements on the legacy system? Commercial lending in particular often involves negotiated terms, custom covenants, non-standard fee structures, or manually-overridden repayment schedules. How many of these exist and how will they be represented?
- Has the new platform vendor confirmed that their loan module supports all the required product configurations? What gap analysis has been performed? If there are gaps, what is the remediation path — platform configuration, customisation, or product rationalisation with customer consent?
- Are there any government-scheme loans (e.g., Welcome Home Loans/Kāinga Ora-linked products, or any historic government-guarantee arrangements) with specific contractual or reporting requirements?

**Why this matters:** If the new platform cannot accurately calculate interest, fees, and repayment schedules for every existing product variant, you do not have a migration — you have a financial misstatement problem. This is the single highest risk in the programme and it must be resolved in the first weeks, not discovered during parallel run.

### 2. The Parallel Run Model Needs Precise Definition

The brief describes "shadow mode with all transactions mirrored to the new platform." This concept needs to be decomposed into an actual technical architecture.

**Key questions:**

- **What does "mirrored" mean operationally?** Are transactions being replayed into the new platform in real-time, near-real-time, or in batch? Is the new platform processing these transactions through its own calculation engine (true dual-processing), or is it receiving pre-calculated results from the legacy system (data replication)?
- **If true dual-processing:** both systems independently calculate interest accruals, fee applications, repayment allocations, and arrears statuses for every account every day. This is the gold standard for validation but it is computationally and operationally expensive. It also requires that every product is already fully configured on the new platform before parallel run begins — which means product configuration is a pre-requisite, not a parallel activity.
- **If data replication:** you are copying legacy outputs into the new platform, which validates data transfer fidelity but does not validate that the new platform's own calculation engine produces correct results. You would need a separate calculation validation exercise.
- **What is the source of truth during parallel run?** The legacy system, presumably. But this must be explicitly stated and operationally enforced. Customer-facing channels, statements, and regulatory reports must all be sourced from the legacy system until cutover. What happens if a customer queries a balance and the two systems disagree?
- **How are corrections handled?** If a payment is reversed, a direct debit is dishonoured, or a manual adjustment is applied on the legacy system during parallel run, how does this propagate to the new platform? What is the latency tolerance?
- **What is the reconciliation methodology?** "Run a reconciliation pass" at the 6-month mark is insufficient as a specification. You need to define: reconciliation at what level of granularity (account balance, transaction-level, schedule-level), what tolerance thresholds (zero tolerance for principal balances, what tolerance for accrued interest given potential timing differences), and what is the escalation and remediation process for breaks.

### 3. Data Migration Scope and Complexity

**280,000 active accounts is the headline number, but the actual migration population is larger.**

- How many **closed** loan accounts exist that must be migrated for the 7-year retention requirement? On an 18-year-old system, this could be several multiples of the active count. If the system has originated loans for 18 years, the closed-loan population could be 500,000+ records.
- What is the total data volume — not just account records, but the full transaction history, document attachments, correspondence records, and associated metadata?
- **Security registrations** are mentioned. This likely includes mortgage registrations (LINZ e-dealing records), PPSR registrations for personal property securities, and potentially caveats or other instruments. How are these linked in the legacy system? Are registration references stored as structured data or in free-text fields? Will the new platform maintain these linkages, and will any re-registration or notification to registries be required?
- **Associated parties and relationships:** Guarantors, co-borrowers, power-of-attorney arrangements, trust structures, company directorships for commercial lending. How are these modelled in the legacy system versus the new platform? Relationship model mismatches between legacy and target platforms are a common and painful source of migration defects.
- **Document and correspondence history:** Are scanned documents, loan offer letters, variation letters, and customer correspondence stored within the legacy system or in a separate document management system? If within the legacy system, they must be extracted and migrated or archived. If separate, the linkage keys must be preserved.

### 4. Regulatory Reporting — RBNZ and Beyond

The brief correctly identifies RBNZ reporting as a requirement. This needs to be expanded:

- **Which specific RBNZ returns are generated from the legacy system?** Likely candidates include the Standard Statistical Return (SSR), the Bank Balance Sheet (BBS) return, the Capital Adequacy return, and potentially the new Dashboard reporting requirements. Each has specific field definitions and the new platform must produce data that maps to these fields exactly.
- **Beyond RBNZ:** Are there other regulatory or compliance reporting obligations sourced from the legacy system? AML/CFT transaction monitoring feeds, IRD reporting (RWT on interest, resident withholding tax certificates), ORC or credit reporting bureau feeds (Centrix, Equifax/illion), hardship and arrears reporting for internal or external stakeholders?
- **During parallel run, which system produces regulatory reports?** If the legacy system remains the source of truth, this is straightforward. But the new platform's reporting must be validated against legacy outputs before cutover — ideally by running shadow reports for several reporting cycles and reconciling them.
- **Your RBNZ relationship team** being involved is necessary but not sufficient. You need someone on the project team who understands the field-level definitions of every prescribed report, can map legacy system fields to new platform fields, and can validate output. This is a specialist skill set. Is it available within the team as specified?

### 5. Cutover Risk and Rollback Strategy

**The staged weekend migration at the 6-month mark is described but not decomposed.**

- **What does "staged" mean?** By product type? By portfolio size? By risk profile? Staging implies multiple cutover weekends — how many? What is the order? What is the batch size per stage?
- **What is the rollback plan if a cutover stage fails validation?** Can you revert a batch of accounts to the legacy system on Monday morning if the weekend migration produces unacceptable results? What is the technical mechanism for rollback? How long does rollback take? What is the customer impact of a failed cutover stage?
- **What is the go/no-go decision framework?** Who has authority to abort a cutover stage? What are the quantitative criteria (e.g., reconciliation break count, balance variance threshold)? This must be defined and agreed before the first cutover weekend, not during it.
- **Customer communications:** Are customers notified of the migration? Account numbers may change, online banking interfaces may change, direct debit references may change. What is the customer communication plan and timeline?
- **What downstream systems consume data from the legacy loan ledger?** General ledger feeds, treasury and ALM systems, collections systems, credit decisioning systems, broker portals, insurance integrations, securitisation reporting. Every downstream integration must be re-pointed to the new platform at cutover. Each of these is its own mini-migration with its own validation requirement.

### 6. Team Capacity and Expertise

**Six engineers, one data architect, and a project manager is a lean team for this scope.**

This is not necessarily a problem — small, skilled teams often outperform larger groups on complex migration work — but it depends entirely on the experience profile.

- How many of these team members have deep knowledge of the legacy system's data model, product configuration, and operational behaviour? Legacy system expertise is the hardest thing to source and the most critical input to migration accuracy. If the legacy system has been running for 18 years, the people who understood it deeply may have left the organisation.
- Does the team include or have access to someone with lending operations expertise — not just technical knowledge, but understanding of how loan products work financially and legally? Migration defects in interest calculations or arrears management have direct financial and regulatory consequences.
- What is the vendor's commitment level? "Providing a migration toolset" is different from "providing migration engineering support." Is the vendor providing tools only, or tools plus consultants who know how to use them and have done this migration before? Has this vendor migrated loan portfolios of this scale from this specific legacy platform before?
- **What is the contingency if a key team member becomes unavailable?** With a team of eight, every person is critical. The data architect in particular is a single point of failure.

### 7. The 6-Month Decommissioning Tail

The brief allocates 6 months from cutover to full decommissioning. This needs clarification:

- What specifically happens during this period? Is the legacy system kept running in read-only mode as a reference? Or is it shut down immediately after cutover with data preserved in an archive?
- **The 7-year retention requirement:** Where do closed-loan records live after decommissioning? If they are migrated to the new platform, the new platform must support read-only historical records that are not part of active portfolio management but remain queryable and reportable. If they are moved to a separate archive, that archive must be specified, built, and validated. This is non-trivial — regulatory or legal queries against historical loan records do occur (e.g., customer complaints to the Banking Ombudsman, FMA inquiries, litigation discovery requests) and the records must be accessible and interpretable, not just stored.
- What happens to the legacy infrastructure (servers, databases, network segments, licences)? Is there a cost saving that the business case depends on? If so, the decommissioning timeline is financially significant, not just operationally tidy.

---

## Risks I Want to Highlight

| Risk | Severity | Likelihood | Notes |
|---|---|---|---|
| Loan product configuration gaps on new platform discovered late | **Critical** | Medium-High | 18-year-old systems accumulate product complexity that is poorly documented. Discovery of unsupported product variants during parallel run could blow the timeline. |
| Interest calculation discrepancies between platforms | **Critical** | Medium | Even small rounding or timing differences across 280,000 accounts create material financial variances and potential regulatory breach. |
| Legacy system knowledge attrition | **High** | Medium | Key people who understand the legacy data model, business rules, and operational workarounds may not be available or may not be on the project team. |
| Downstream integration re-pointing underestimated | **High** | Medium-High | The brief does not mention downstream systems at all. These integrations are frequently the source of cutover failures. |
| 12-month hard deadline creates pressure to accept known defects | **Critical** | Medium | When the deadline cannot move, scope and quality become the pressure relief valves. There must be an explicit framework for what happens if the programme is not ready at month 6 for parallel run, or at month 12 for cutover. |
| Parallel run reconciliation reveals systemic issues at month 5 | **High** | Medium | If reconciliation breaks are widespread late in the parallel run, there is no time to remediate and re-run. The go-live criteria and escalation path for this scenario must be defined early. |
| Customer impact at cutover inadequately managed | **Medium** | Medium | Account number changes, statement format changes, online banking changes, and direct debit re-establishment can generate significant customer contact volume and complaints. |
| Regulatory reporting gaps discovered post-cutover | **Critical** | Low-Medium | If an RBNZ return cannot be produced correctly from the new platform, this is a compliance breach. Validation must happen during parallel run, not after cutover. |

---

## Recommended Immediate Next Steps

**Before committing to the programme timeline, the following must be completed:**

1. **Full loan product inventory and gap analysis.** Catalogue every product variant on the legacy system — active and closed — with its calculation methodology, fee structure, and contractual terms. Map each to the new platform's capabilities. Identify gaps. This is the single most important pre-requisite and should start immediately. If this reveals significant gaps, the programme timeline may need restructuring.

2. **Legacy data model documentation and profiling.** The data architect should perform a complete data profiling exercise on the legacy database: table structures, field populations, data quality metrics, orphaned records, referential integrity status. Do not assume the legacy data is clean — 18-year-old systems always have data quality issues. Discover them now, not during migration.

3. **Downstream systems integration inventory.** Identify every system that receives data from or sends data to the legacy loan ledger. For each, document the interface mechanism, data format, frequency, and the team responsible. Each integration is a migration workstream.

4. **Regulatory reporting field-level mapping.** Engage the RBNZ relationship team immediately to obtain the current prescribed report formats and field definitions. Begin mapping legacy system fields to new platform fields. Identify any fields that the new platform does not currently produce.

5. **Detailed parallel run design.** Specify the technical architecture for transaction mirroring, the reconciliation methodology, tolerance thresholds, break management processes, and the go/no-go decision framework for cutover.

6. **Vendor engagement scoping.** Clarify exactly what the vendor's migration toolset includes, what professional services support is available, and whether the vendor has reference clients who have completed this specific migration path.

7. **Cutover and rollback planning.** Design the staged cutover sequence, the validation gates between stages, and the rollback mechanism for each stage. Test the rollback mechanism before you need it.

---

## Overall Assessment

This is a well-motivated and structurally sound migration programme operating under a genuine and immovable constraint. The 12-month deadline is real, the business case is clear (single-platform operation, elimination of unsupported legacy risk), and the parallel-run approach is the right architectural choice for a migration of this criticality.

However, the brief as stated is at **initiative level** — it describes the what and the why effectively but the how requires substantial decomposition before execution risk can be properly assessed and managed. The areas I have flagged above are not unusual for this stage of programme definition, but they are not optional — particularly the loan product gap analysis, the downstream integration inventory, and the parallel run reconciliation design. These three workstreams will determine whether the programme succeeds or fails, and all three should begin before the formal programme clock starts.

The team size is adequate if the expertise profile is right and the vendor provides meaningful engineering support, not just tooling. If either of those conditions is not met, the team needs to be augmented.

I would