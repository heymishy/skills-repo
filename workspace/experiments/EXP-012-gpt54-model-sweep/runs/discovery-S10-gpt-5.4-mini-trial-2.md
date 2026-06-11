## Discovery summary: Legacy loan ledger decommission and loan migration

### 1) Situation overview
You are replacing an 18-year-old legacy loan ledger that manages about **280,000 active loan accounts** across:
- personal loans
- home loans
- commercial lending

A new core banking platform is already live for **deposit accounts** and has been operating successfully for **14 months**. The goal is to migrate all loan accounts onto that same platform and then retire the legacy loan system.

### 2) Deadline and constraints
- **Hard cutover deadline:** 12 months from now
- Legacy vendor support ends in 12 months:
  - no patches
  - no security updates
  - no vendor support
- Contract extension is **not possible**
- Therefore, the legacy system must be fully decommissioned before support ends

### 3) Target migration approach
Your plan is:
- **6-month parallel run**
  - New loan originations go to the new platform from day one
  - Existing accounts remain on legacy during the parallel period
  - Transactions on legacy are mirrored to the new platform in shadow mode
- At month 6:
  - validate data integrity
  - run reconciliation
  - if acceptable, perform a staged weekend migration for remaining legacy accounts
- Then there is a further **6 months** to:
  - decommission legacy infrastructure
  - formally retire the legacy system

### 4) Primary risks and requirements
#### Primary technical risk
- **Data integrity is the top risk**
- All **280,000 loan records** must migrate with full history, including:
  - original loan terms
  - drawdown history
  - repayment schedules
  - arrears status
  - associated security registrations
- **No loss or corruption** of records is acceptable

#### Legal / retention requirement
- Credit contract records must be retained for **7 years**
- This applies even to **closed loans**
- Therefore, migrated records must remain preserved and retrievable for the full legal retention period

#### Regulatory requirement
- The new platform must produce all **RBNZ regulatory reports** currently produced by the legacy system
- Report format and field definitions are prescribed
- Your **RBNZ relationship team** must validate that outputs meet requirements

### 5) Delivery model and team
- Project will be run **in-house**
- The **new platform vendor** will provide the migration toolset
- Expected team:
  - 6 engineers
  - 1 data architect
  - 1 project manager

---

## Initial discovery conclusions
### Key dependencies
1. **Data migration and reconciliation capability**
2. **Reporting parity for RBNZ**
3. **Retention and archive strategy for closed loans**
4. **Parallel-run transaction mirroring**
5. **Cutover readiness and rollback approach**
6. **Support for security registrations and associated records**

### Main delivery pressure points
- The **12-month vendor deadline** is immovable
- The **6-month parallel period** leaves limited time for defect discovery before cutover
- Full-history migration makes this more than a simple account balance move
- Regulatory reporting sign-off may become a gating item

---

## Discovery questions to resolve next
To complete discovery, the following should be confirmed:

### Data and migration
- What is the legacy system’s data model and record count by product type?
- Are there any known data quality issues in the legacy ledger?
- How will full transaction history and linked security records be migrated?
- What is the reconciliation method for mirroring transactions during parallel run?
- What tolerance is acceptable, if any, for mismatches during rehearsal?

### Operations and cutover
- Will the legacy system continue processing any transactions during shadow mode, or only read-only operations plus mirroring?
- What is the exact staged migration approach for the weekend cutover?
- What rollback plan exists if cutover fails?
- What is the business downtime tolerance during the migration weekend?

### Regulatory and reporting
- Which exact RBNZ reports must be replicated?
- Who in the RBNZ relationship team will sign off?
- Is there any historical reporting data that must also be preserved or regenerated?

### Retention and archive
- Where will closed loan records be stored for the 7-year retention period?
- Will the new core be the system of record for archived loans, or will there be a separate archive?
- What access/search requirements exist for retained records?

### Project governance
- Who owns business sign-off for loan product behavior, reporting, and reconciliation?
- What are the milestone gates between now and cutover?
- Are there non-functional requirements around performance, availability, auditability, and security?

---

## Suggested discovery output artifacts
At the end of discovery, you will likely want:
- migration scope and assumptions
- data mapping inventory
- reporting parity matrix
- reconciliation and exception-handling design
- cutover plan and rollback plan
- retention/archive design
- regulatory sign-off plan
- project timeline with critical path and risks

If you want, I can next turn this into a **formal discovery brief**, **project risks register**, or a **set of structured discovery questions for stakeholders**.