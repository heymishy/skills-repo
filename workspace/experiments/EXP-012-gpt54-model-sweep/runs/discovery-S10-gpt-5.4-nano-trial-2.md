Understood. Below is a structured response in the style of a **/discovery pipeline** to capture scope, constraints, risks, critical decisions, and the concrete information you’ll need to finalize the migration plan for the legacy loan ledger → new loan capability on your existing core banking platform.

---

## 1) Current State (What exists today)
- **Legacy loan ledger system**
  - In production for **18 years**
  - Manages ~**280,000 active loan accounts**
  - Loan types: **personal loans, home loans, commercial lending**
  - Contains: full loan term data, **drawdown history**, **repayment schedules**, **arrears status**, and **security registrations**
- **New core banking platform (deposit accounts)**
  - Running successfully for **14 months**
  - Will become the **single core** for loans and deposits

---

## 2) Target State (What “done” means)
- Legacy loan ledger **fully decommissioned**
- All loan accounts migrated to the new platform
- During a planned **6-month parallel period**:
  - **New originations** go live on new platform immediately
  - Existing accounts operate on **legacy**, while transactions are **mirrored** to new platform in shadow mode
- At **6-month mark**:
  - Validate data integrity and run reconciliation
  - If satisfactory, perform **staged weekend cutovers** for remaining legacy accounts
- Post-cutover window:
  - **6 months to decommission** legacy infrastructure fully
- **Legal retention**:
  - Credit contract records retained for **7 years** (including **closed loans migrated**)

---

## 3) Constraints / Hard Deadlines
- Legacy vendor support ends in **12 months**
  - After that: no patches, security updates, or vendor support
  - Extending support is not possible (withdrawn product)
- Therefore, migration + decommissioning must be executed so legacy is retired **before the support end** (or at minimum with a risk-controlled cutover that prevents unsupported operations beyond your tolerance).

> Your plan currently implies: cutover validation at 6 months, then staged weekend migrations, then 6 months to retire. That totals ~12 months. You likely need to confirm the timeline math against the “hard cutover deadline” and how much legacy operation can occur after the vendor end date.

---

## 4) In-Scope Work (Discovery confirmation items)
### 4.1 Data migration scope
For **all 280,000 loan accounts**, migration must include:
- Original loan terms
- Drawdown history (all tranches / events)
- Repayment schedule(s)
- Current arrears status (including status history if required by rules/audit)
- **Security registrations** (type, priority, links/metadata to collateral/registers)
- Full **transaction history required for reporting** and audit (ensure “history” definition is explicit)

### 4.2 Shadow mode & transaction mirroring
- Define what is mirrored:
  - Posting transactions, reversals, adjustments, fees/interest accrual events, schedule generation events, customer events (repayments, redraws, restructures)
- Define how mirroring handles:
  - Operational differences (timing, rounding, posting sequence)
  - Corrections and backdated postings

### 4.3 Reporting scope (RBNZ)
- New platform must produce all regulatory reports currently produced by legacy
- Format and field definitions are prescribed
- RBNZ relationship team must confirm alignment

### 4.4 Operational controls & audit
- Evidence package:
  - Migration mapping specs
  - Reconciliation results
  - Controls for sign-off (technical + business + compliance)
- Change management:
  - Weekend cutover runbooks
  - Rollback strategy (even if “rollback” means “fall back to legacy”)

---

## 5) Key Risks (and discovery questions to mitigate them)
### Risk A — Data integrity (primary)
- **Failure modes**
  - Loss/corruption of history (drawdowns, schedule steps, arrears progression)
  - Mapping gaps between legacy schema and new platform schema
  - Differences in interest/fee calculation logic or rounding
  - Missing security registration relationships
- **Discovery questions**
  1. Do you have a **data dictionary** for legacy tables/events and the new platform objects?
  2. What exact definition of “full history” is required for:
     - accounting accuracy
     - reporting calculations
     - disputes/audit
  3. Are there known legacy exceptions (e.g., manual overrides, restructures, ad-hoc fees)?
  4. Is there a single source of truth for time-based calculations (posting dates vs value dates)?

### Risk B — Reconciliation cannot be exhaustive
- **Risk**: you reconcile at “record-level” but miss “event-level” differences.
- **Discovery questions**
  - What reconciliation dimensions will be used?
    - counts (events, schedules, accounts)
    - totals (balances, arrears totals)
    - hashes/checksums per account history stream
    - sample-based vs full-population approaches
  - What is the tolerance for numeric drift (rounding/interest accrual timing)?

### Risk C — Shadow mode replication discrepancies
- **Discovery questions**
  - Does the new platform support receiving transaction mirrors without impacting live behavior?
  - Will the new platform’s internal posting engine produce identical derived values?
  - How do you handle “derived fields” (e.g., schedule regeneration) that may differ when driven by mirrored inputs?

### Risk D — Regulatory reporting gaps
- **Discovery questions**
  1. What specific RBNZ report suite is produced today (names + frequencies)?
  2. Are reports computed directly from stored fields or derived/calculated at runtime?
  3. Is there precedent of identical report outputs from both systems on sample datasets?
  4. Can report outputs be validated in a non-production environment with sign-off?

### Risk E — Cutover and weekend migration operational risk
- **Discovery questions**
  - What is the staged approach (by portfolio, by loan type, by risk tier, by branch/channel)?
  - What dependencies exist (e.g., security system feeds, customer servicing workflows, arrears handling workflows)?
  - What rollback is feasible (time-bounded), and what data locking rules apply?

### Risk F — 7-year retention and audit immutability
- **Discovery questions**
  - Are migrated records stored in a way that guarantees retention and legal defensibility?
  - Do you need an **archival snapshot** of legacy records or is new-platform persistence acceptable?
  - Are there requirements for cryptographic integrity / audit trails?

---

## 6) Integration & Dependencies (must be discovered)
Likely external or adjacent systems (confirm what applies in your environment):
- Security registration/collateral systems (or legal title systems)
- Payment channels / card rails / direct debit systems
- Customer servicing / call center tooling
- Data warehouse / reporting extracts (feeding RBNZ reports if applicable)
- Identity/KYC (if referenced in loan record context)
- Document management (credit contracts, disclosure documents)

**Discovery ask**: produce a dependency map of systems that read/write loan data.

---

## 7) Migration Approach Validation (Your plan vs reality)
Your plan:
- Parallel shadow mode for **6 months**
- Validate integrity at **6 months**
- Staged weekend cutover
- Then **6 months** to decommission

**Discovery checks to perform immediately**
- Confirm the **exact timeline** relative to the **vendor end date** and what “decommission” means operationally.
- Confirm the vendor provides:
  - migration toolset
  - ability to run dry-run migrations
  - shadow-mode integration patterns
  - support for schema mapping assistance
- Confirm environments:
  - dev/test/stage with realistic data volumes
  - performance testing for batch/report generation loads

---

## 8) Team & Operating Model
Given:
- **6 engineers**
- **1 data architect**
- **1 project manager**
- Vendor provides migration toolset

Discovery asks:
- Do you have:
  - a **test lead / QA**
  - a **business SME** for each loan type (consumer, mortgage, commercial)
  - compliance/Risk/RBNZ liaison availability
- What are the roles for:
  - data mapping owner
  - reconciliation owner
  - cutover lead
  - reporting sign-off lead

---

## 9) Deliverables to Produce (Discovery outputs you should plan for)
1. **Legacy-to-New mapping specification**
   - objects, fields, transformations, derivations, defaults
2. **History/event model definition**
   - what constitutes an “event” and how it’s represented in new system
3. **Reconciliation strategy**
   - full population checks vs sampling
   - numeric tolerances
   - acceptance thresholds
4. **RBNZ report inventory & validation plan**
   - report list, frequency, data sources, validation method, sign-off criteria
5. **Cutover runbook + rollback plan**
6. **Data retention / audit evidence plan**
   - ensure 7-year requirements satisfied

---

## 10) Immediate Next Questions (to proceed with the pipeline)
If you answer these, I can help convert discovery into an actionable plan with milestones and acceptance criteria:

1. **What is the exact legacy vendor product name and its migration/tool compatibility** (APIs, export formats, ability to run incremental loads)?
2. What exact **RBNZ reports** are currently generated? (names and frequency)
3. For each loan type (personal/home/commercial), what are the key **special cases** in legacy? (restructures, interest-only periods, variable-rate resets, arrears treatments, manual overrides)
4. Is the new platform capable of:
   - ingesting mirrored transactions without altering live servicing?
   - regenerating schedules in a deterministic way from mirrored events?
5. What data sources exist for:
   - **security registrations**
   - **credit contract documents**
   - **arrears and collections status history**
6. What does “staged weekend migration” concretely mean (partition key and number of accounts per wave)?
7. Are you required to deliver **parallel-run report outputs** during the 6-month period (not just at validation time)?

---

If you want, I can turn this into a **90-day discovery workplan** (with milestones, responsibilities, and test/reconciliation artifacts) aligned to the 12-month vendor support deadline.