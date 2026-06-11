## /discovery — Migration discovery findings (loan ledger decommission)

### 1) Current-state understanding
- **Legacy scope:** ~280,000 active loan accounts across personal, home, and commercial lending.
- **Legacy longevity:** 18 years in production → high variability in historical data, edge-case transactions, and reporting logic.
- **Hard constraint:** Vendor support ends in **12 months**. No patches/security updates thereafter; product withdrawn from market.  
- **Target state:** Move all loan accounts onto the **new core banking platform** that already hosts **deposit accounts** and has been stable for **14 months**.
- **Migration approach planned:**
  - **6-month parallel period**
  - **Day 1:** all new originations on the new platform
  - Existing accounts in **shadow mode** on new platform with **transaction mirroring**
  - At **6 months:** data integrity validation + reconciliation
  - If satisfactory: **staged weekend cutovers** for remaining legacy accounts
  - **Post-cutover decommission window:** 6 months to fully retire legacy infrastructure

### 2) Key risks (with technical emphasis)
1. **Data integrity / completeness risk (primary):**
   - Must preserve **full history**: original terms, drawdowns, repayment schedules, arrears status, and security registrations.
   - “No loan record can be lost or corrupted” implies:
     - deterministic migration logic
     - replayable/multi-pass reconciliation
     - cryptographic or hash-based verification where possible
2. **Account lifecycle complexity risk:**
   - Mixed statuses: active, closed, refinancing, restructures, arrears transitions, partial repayments, additional drawdowns.
   - Older record formats likely differ from newer ones.
3. **Regulatory reporting parity risk:**
   - New platform must produce **RBNZ-prescribed reports** with correct field definitions and formatting.
4. **Parallel-run consistency risk:**
   - Shadow-mode mirroring must be exact in ordering, currency, timestamps, event semantics.
   - Any divergence during parallel can multiply during reconciliation.
5. **Security registration linkage risk:**
   - Security interests may be spread across relational structures and/or external registries; referential integrity must be maintained.
6. **Legal retention risk (7 years):**
   - Even closed loans migrated must remain queryable/retained for 7 years under the relevant consumer finance legislation.

### 3) Discovery questions to finalize scope (must answer to de-risk)
#### A. Data model & migration inventory
- What are the **exact legacy “tables/entities”** that represent:
  - loan master/contract terms
  - amortisation schedule(s)
  - drawdown events
  - repayments and posting lines
  - arrears status (and how it’s computed vs stored)
  - fees/interest calculations inputs
  - restructuring events and modifications
  - security registrations (and their lifecycle)
- For each entity, is history stored as:
  - **event ledger** (append-only) or
  - **state snapshots** with recalculation logic?
- Are there **known data quality issues** in legacy (missing fields, inconsistent dates, rounding differences, negative balances, custom products)?

#### B. Migration mechanics
- Does the vendor tool support:
  - full historical load for 280k accounts
  - then continuous “shadow” replication with event ordering guarantees?
- How do we handle:
  - schema evolution differences between legacy and target
  - currency/rounding differences
  - numbering conflicts (contract IDs, customer IDs, security IDs)
- What is the **migration cutover definition**?
  - Is it “stop legacy writes → switch read API” or a database switchover?
  - How are in-flight transactions handled over the weekend?

#### C. Reconciliation & verification
- What comparison approach will we use:
  - record-level checksums/hashes
  - totals-by-period (balances, interest accrued)
  - event-count and amount checks per account
  - regulatory report output comparison (field-by-field)
- What tolerances are acceptable (e.g., rounding to cents, FX conversions)?
- Do we have a **golden dataset** or sample population plan for progressive validation?

#### D. Regulatory reporting parity (RBNZ)
- What **specific report set** (names/codes) does legacy generate today?
- Are reports driven by:
  - static stored fields in legacy, or
  - recalculated from transaction history?
- Can we:
  - run legacy and new platform in parallel for report generation during shadow
  - capture output for defined reporting periods
- Do RBNZ requirements include:
  - specific calculation methodologies (not only field mapping)?
  - event-time vs posting-time definitions?

#### E. Retention & auditability
- Where will migrated historical records live:
  - in the new platform operational DB, or
  - in an archive/immutable store?
- Can we guarantee:
  - integrity over time (WORM/immutable logs, audit trails)
  - the ability to produce evidence for regulators and legal discovery

### 4) Proposed discovery deliverables (what we should produce next)
1. **Migration scope & data inventory matrix**
   - listing every legacy entity and its target mapping; include history depth and lifecycle transitions.
2. **Parallel-run mirroring design review**
   - event ordering, idempotency, clock/timestamp strategy, failure handling.
3. **Reconciliation strategy**
   - define reconciliation tiers:
     - Tier 1: migration completeness (counts + key fields)
     - Tier 2: financial integrity (balances, schedules, arrears roll-forward)
     - Tier 3: regulatory output parity (field-by-field)
     - Tier 4: audit evidence pack generation
4. **RBNZ report acceptance test plan**
   - mapping spec + test harness approach + sign-off gates with RBNZ relationship team.
5. **Cutover readiness criteria**
   - “go/no-go” thresholds at 6 months and per staged weekend migration wave.
6. **7-year retention architecture decision**
   - ensure closed-loan record preservation meets legal obligations and operational/audit needs.

### 5) Recommended immediate next steps (practical plan)
Given the 12-month hard deadline for vendor support end, discovery should run in parallel with early migration build activities:

1. **Week 1–2: Data & mapping workshops**
   - Legacy SMEs + new platform vendor + in-house data architect to enumerate entities and history logic.
2. **Week 2–3: Reporting workshop**
   - Produce the RBNZ report catalog, then confirm which are:
     - directly stored vs recalculated
     - dependent on arrears logic and historical cutover assumptions
3. **Week 3–4: Reconciliation framework**
   - Decide hash/checksum strategy, rounding tolerances, and “golden accounts” sampling.
4. **Week 4–6: Prototype migration + reconciliation on a representative sample**
   - Include:
     - multiple loan types (personal/home/commercial)
     - various statuses (active/closed/arrears)
     - security registrations

### 6) Team readiness notes (based on your staffing)
You have: **6 engineers + 1 data architect + PM** (in-house) with vendor toolset support.

To avoid discovery becoming a bottleneck, you likely need (at least part-time):
- legacy domain SMEs (loan product + arrears + security registration)
- reporting/regulatory SME (internal or via RBNZ relationship team involvement)
- QA/test lead to build automated comparison harnesses (could be one of the engineers, but must be explicit)

---

## Quick confirmation: to proceed
Answering the following will let me tailor the discovery outputs into a concrete risk/effort plan:

1. Are the legacy loan balances/arrears **stored** or **computed** on the fly?
2. Does the new platform already support **all loan product types** (including commercial structures) with matching calculation logic?
3. For RBNZ reports: do you have a **report list + sample outputs** from legacy (by reporting period)?
4. For security registrations: are they stored within the ledger database, or linked to an external system/registry?
5. What’s the planned cutover pattern for keys/IDs (customer, loan, security)—is there already an ID mapping strategy from the deposit migration?

If you provide these, I can produce a targeted discovery checklist and an acceptance/reconciliation plan aligned to your 6-month parallel + staged weekend cutover + 6-month decommission timeline.