Below is the structured **/discovery** output for the proposed loan-ledger decommissioning and migration.

---

# /discovery

## 1) Objective
Migrate all loan accounts and required historical records from the 18-year-old legacy loan ledger to the existing core banking platform, then decommission the legacy platform before vendor support ends in **12 months**.

Primary business goal:
- Operate a **single core banking platform** for both deposits and loans.

Primary delivery goal:
- Complete migration of **~280,000 active loan accounts** covering:
  - Personal loans
  - Home loans
  - Commercial lending

Primary constraint:
- **Hard deadline:** legacy vendor support ends in 12 months, with no extension available.

---

## 2) Business context
- The bank has already operated the new core platform for **deposit accounts** for **14 months** successfully.
- The remaining major dependency on the legacy core is the **loan ledger**.
- Retiring the legacy system reduces:
  - operational complexity
  - support risk
  - security exposure
  - duplicated platform costs

This is effectively a **time-bound platform exit** with material operational, legal, and regulatory implications.

---

## 3) Proposed delivery approach
### Migration model
A **6-month parallel run** is planned:
- **Day 1 of parallel run:**
  - all **new loan originations** are created directly in the new platform
  - existing loan accounts remain system-of-record on the legacy platform
  - transactions for existing loans are **mirrored** to the new platform in shadow mode

### Midpoint transition
At the end of the 6-month parallel period:
- perform **data integrity validation**
- execute **reconciliation**
- confirm outcomes are satisfactory
- proceed to **staged weekend cutover** of remaining legacy accounts

### Final phase
After cutover:
- **6 months** to:
  - decommission legacy infrastructure
  - retire related services/interfaces
  - complete formal shutdown

### Timeline summary
- Total deadline window: **12 months**
- Parallel operation: **6 months**
- Post-cutover decommissioning: **6 months**

This leaves very little contingency.

---

## 4) In-scope
### Systems / capabilities
- Legacy loan ledger decommissioning
- Migration into the existing core banking platform
- Migration tooling from the new platform vendor
- Data migration and reconciliation capability
- Regulatory reporting equivalence for RBNZ-prescribed reports
- Legacy infrastructure retirement and formal decommissioning

### Data scope
Must migrate all required loan data, including:
- original loan terms
- drawdown history
- repayment schedules
- arrears status
- associated security registrations
- full historical record required for retention and servicing

### Record populations
- **280,000 active loan accounts**
- closed/migrated loan records requiring preservation under retention obligations

### Product scope
- personal loans
- home loans
- commercial lending

---

## 5) Out of scope / assumed out of scope
Not explicitly stated; likely candidates to confirm:
- redesign of loan products beyond parity migration
- major business-process transformation unrelated to migration
- replacement of downstream systems not directly dependent on the loan ledger
- policy changes to collections, arrears, or loan servicing
- broad reporting redesign beyond mandatory equivalence

These need explicit confirmation.

---

## 6) Critical constraints
1. **Vendor support ends in 12 months**
   - no extension possible
   - hard cutover deadline

2. **6-month parallel run is mandated by plan**
   - consumes half the available time window

3. **Data integrity is non-negotiable**
   - no record loss
   - no corruption
   - history must be preserved

4. **Legal retention requirement**
   - credit contract records retained for **7 years**
   - includes closed loans that were migrated

5. **Regulatory reporting continuity**
   - new platform must produce all required **RBNZ** reports
   - format and field definitions are prescribed

6. **Resourcing appears lean for scope**
   - 6 engineers
   - 1 data architect
   - 1 project manager

---

## 7) Key stakeholders
### Internal
- Project manager
- Engineering team
- Data architect
- Loan operations / servicing teams
- Risk and compliance
- Legal
- Infrastructure / platform operations
- Security
- Finance / procurement
- RBNZ relationship team
- Business owners for lending products

### External
- New core banking platform vendor
- Potentially external auditors / assurance parties
- RBNZ, indirectly via reporting compliance and relationship engagement

---

## 8) Success criteria
A successful outcome would mean:

### Migration success
- All in-scope loan accounts and required historical records migrated accurately
- No material data loss or corruption
- Reconciliation completed successfully

### Operational success
- New originations processed on the new platform from day one of parallel run
- Legacy and new platforms run in parallel for 6 months without service disruption
- Staged weekend cutover completes safely
- Loan servicing continues uninterrupted

### Regulatory / legal success
- RBNZ reports generated by new platform match prescribed requirements
- Retention obligations for loan and credit contract records are met
- Associated security registration data remains complete and accessible

### Decommissioning success
- Legacy infrastructure retired within final 6 months
- Legacy platform no longer required for production servicing or reporting

---

## 9) Major risks
### 1. Data migration integrity risk
This is the top stated risk.
Potential failure modes:
- incomplete field mapping
- historical transaction loss
- repayment schedule distortion
- arrears state mismatch
- security registration linkage errors
- silent corruption not detected until post-cutover

### 2. Compressed timeline risk
The project has:
- a hard 12-month deadline
- a long parallel run
- limited apparent contingency

Any delay in:
- tool readiness
- data mapping
- reconciliation design
- report certification
could threaten the deadline.

### 3. Regulatory reporting risk
The new platform must reproduce prescribed RBNZ reports exactly enough to satisfy requirements.
Risks include:
- missing report fields
- semantic mismatches in data definitions
- timing differences
- inability to evidence equivalence

### 4. Parallel run complexity risk
Mirroring transactions for 6 months introduces:
- duplication/ordering issues
- latency mismatches
- exception handling problems
- divergent balances/statuses between systems

### 5. Weekend cutover risk
Staged migration over weekends can fail due to:
- batch overruns
- reconciliation exceptions
- rollback complexity
- customer-facing servicing disruption on Monday

### 6. Record retention / archival risk
Even after migration and decommissioning:
- closed loan records must remain preserved
- evidence must be accessible for 7 years
- archive strategy may be insufficiently defined

### 7. Resourcing risk
Current planned team may be underpowered for:
- data analysis
- test automation
- reconciliation tooling
- reporting validation
- environment support
- operational readiness
- decommissioning work

### 8. Dependency on vendor toolset risk
If the migration tooling is immature or poorly suited to historical loan constructs, the in-house team may need to build significant additional capability.

---

## 10) Assumptions identified
These are either explicit or implied and should be validated:

- The existing core banking platform can support all required loan products.
- The vendor migration toolset can handle both active and historical loan data.
- The new platform can represent all legacy concepts, including arrears and security data.
- Mirroring in shadow mode is technically feasible for all transaction types.
- Parallel operation for 6 months is sufficient to establish confidence.
- Weekend staged migration is operationally practical for the volume of remaining accounts.
- Required RBNZ reports can be produced without major platform customization.
- A compliant archival/retention solution exists for closed records and historical contracts.
- Existing downstream integrations can be redirected or retired in line with cutover.
- The planned team size is sufficient.

---

## 11) Dependencies
### Technical dependencies
- Migration toolset from new platform vendor
- Access to legacy data structures and extraction mechanisms
- Field mapping and transformation rules
- Reconciliation tooling and controls
- Shadow posting / mirroring capability
- Reporting configuration on the new platform
- Archive / records retention solution
- Environment availability for testing and parallel run

### Business / control dependencies
- Legal confirmation of retention and record-access requirements
- Compliance sign-off on migrated records and controls
- RBNZ relationship team engagement for report confirmation
- Lending operations input on servicing scenarios and exceptions
- Cutover planning and business continuity readiness

---

## 12) Unknowns / discovery questions
These are the highest-value questions to answer early.

### Data and migration
1. What is the precise volume of:
   - active loans
   - closed loans requiring retention
   - total transaction history
   - document/contract artifacts
2. What are the complete legacy data entities and relationships?
3. Are there product variants or custom exceptions accumulated over 18 years?
4. How are security registrations stored and linked today?
5. What data quality issues already exist in the legacy system?
6. What proportion of fields have no direct equivalent in the new platform?
7. Is full history being migrated into the new core, or partly migrated and partly archived?
8. Are scanned contracts/documents in scope, or only ledger and reference data?

### Parallel run and cutover
9. How will mirrored transactions be ordered, deduplicated, and reconciled?
10. Which system remains legal system-of-record during parallel run?
11. What are the cutover waves or segmentation strategy?
12. What is the rollback strategy if weekend migration fails?
13. What business freeze periods apply around cutover weekends?

### Regulatory reporting
14. What exact RBNZ reports are currently produced by the legacy system?
15. What fields, definitions, and submission timetables must be matched?
16. What evidence will RBNZ or internal compliance require to accept the new reports?

### Retention and decommissioning
17. What format and accessibility standard is required for 7-year retained records?
18. Can the legacy platform be fully shut down, or is a retained read-only archive required?
19. What evidence is needed to formally declare decommission complete?

### Resourcing and governance
20. Is additional specialist support required for:
   - testing
   - reporting
   - operational readiness
   - data QA
   - change management
21. Who is the accountable executive owner?
22. What governance cadence is required given the hard deadline?

---

## 13) Early warning indicators
These should be treated as red flags if they emerge:
- unclear field mappings after initial discovery
- significant historical data quality defects
- inability to mirror some transaction types cleanly
- unresolved gaps in security registration handling
- RBNZ report mismatches late in the project
- no agreed archival strategy by early design phase
- repeated reconciliation exceptions during parallel run
- vendor toolset limitations discovered after build begins
- cutover rehearsal exceeding weekend window
- project team operating at full capacity with no buffer

---

## 14) Recommended discovery workstreams
### A. Legacy data and product analysis
- inventory products, fields, and historical constructs
- identify exceptions and unsupported patterns
- quantify data volumes and quality issues

### B. Target-state mapping
- define canonical mapping from legacy loan concepts to new platform structures
- identify gaps requiring configuration, customization, or archival treatment

### C. Migration and reconciliation design
- define extract/transform/load approach
- define balancing and reconciliation controls
- define materiality thresholds and acceptance criteria

### D. Parallel run operating model
- design shadow posting / mirroring
- define exception management and ownership
- define system-of-record rules

### E. Regulatory reporting equivalence
- inventory current RBNZ reports
- map source fields and transformations
- plan validation with RBNZ relationship and compliance teams

### F. Retention / records strategy
- determine what must remain queryable
- define archive model for closed loans and contract history
- ensure legal admissibility and accessibility

### G. Cutover and decommission planning
- define migration waves
- rehearsal strategy
- rollback planning
- infrastructure shutdown sequence

---

## 15) Initial delivery concerns
Based on the information provided, the most material concern is not whether the migration is conceptually possible, but whether it can be executed with enough rigor inside the available timeframe.

Specific concern areas:
- The **12-month hard deadline** leaves little room for rework.
- A **6-month parallel run** means most design/build issues must be resolved very early.
- Loan migrations are typically more complex than deposit migrations due to:
  - amortization logic
  - arrears handling
  - product-specific schedules
  - collateral/security relationships
  - legal retention obligations
- The current team size may be light unless:
  - the target platform already supports all loan products with minimal change
  - the vendor toolset is mature
  - downstream integrations are limited
  - reporting equivalence is straightforward

---

## 16) Discovery-level recommendation
Proceed, but classify this as a **high-risk, deadline-driven migration and decommissioning program** requiring immediate structured discovery and tight governance.

### Recommended posture
- Start with a **time-boxed discovery phase immediately**
- Front-load:
  - data profiling
  - product gap analysis
  - reporting gap analysis
  - archival strategy
  - reconciliation design
- Treat **data integrity, RBNZ reporting, and retention compliance** as first-order workstreams, not downstream validation tasks
- Reassess delivery capacity early; likely need for additional specialist support should be expected

---

## 17) Suggested next artifacts
The next useful outputs from discovery would be:

1. **System context diagram**
2. **Migration scope inventory**
3. **Data entity and field mapping catalog**
4. **Regulatory reporting equivalence matrix**
5. **Parallel run control framework**
6. **Cutover and rollback strategy**
7. **Retention and archive design**
8. **Risk register with deadline-based milestones**
9. **Resource and capability assessment**
10. **Integrated 12-month delivery plan**

---

If you want, I can next turn this into one of the following:
- a **RAID log**
- a **discovery workshop agenda**
- a **project charter**
- a **risk-based delivery plan**
- a **target-state / migration architecture summary**