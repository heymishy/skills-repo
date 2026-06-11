Based on the information provided, here’s a comprehensive outline of a migration strategy to decommission your legacy loan ledger system and migrate all accounts to the new core banking platform within the stipulated deadlines and preserving data integrity.

### Project Overview

**Objective:**
Migrate 280,000 loan accounts from a legacy loan ledger system to a new core banking platform within 12 months, ensuring complete data integrity and compliance with legal and regulatory requirements.

**Timeline:**
- **Current Phase:** Pre-migration Planning (0-3 Months)
- **Parallel Operation:** (Months 4-9)
- **Cutover & Validation:** (Months 10-11)
- **Retirement of Legacy System:** (Month 12)

### Key Phases of the Migration Plan

1. **Pre-migration Planning (Months 0-3)**
   - **Project Initiation**
     - Assemble project team (6 engineers, 1 data architect, 1 project manager).
     - Conduct a project kickoff meeting to outline goals, roles, and responsibilities.
   - **Risk Assessment**
     - Identify risks associated with the migration, focusing on data integrity issues and compliance.
     - Develop a risk mitigation plan.
   - **Stakeholder Engagement**
     - Engage with internal stakeholders (e.g., RBNZ relationship team, legal team, end-users) to understand requirements.
     - Confirm reporting formats and field definitions with the RBNZ.
   - **Migration Toolset Familiarization**
     - Receive training from the new platform vendor on the migration toolset.
   - **Data Mapping & Strategy Development**
     - Perform a detailed assessment of existing data models and map them to the new system.
     - Identify which data needs to be retained for compliance and how to archive closed loans.

2. **Parallel Operation (Months 4-9)**
   - **Setup Parallel Environment**
     - Configure the new platform to begin receiving new loan origins.
     - Implement shadow mode for existing accounts from the legacy system.
   - **Data Synchronization**
     - Establish real-time data mirroring from the legacy system to the new platform.
     - Ensure all transactions from the legacy system are correctly mirrored, including loan payments, adjustments, etc.
   - **Monitoring & Reporting**
     - Continuously monitor data synchronization processes for issues.
     - Generate interim reports to confirm consistent data between systems.
   - **Regular Validation**
     - Conduct interim reconciliations to ensure data integrity.
     - Adjust any discrepancies immediately to maintain accuracy in both systems.

3. **Cutover & Validation (Months 10-11)**
   - **Data Integrity Confirmation**
     - Run comprehensive validation tests on the data in the new platform to confirm all records have migrated correctly.
     - Perform a reconciliation pass to ensure both systems show the same results.
   - **Staged Migration of Legacy Accounts**
     - Plan a staged weekend migration for remaining legacy loan accounts.
     - Communicate with stakeholders about the migration schedule and necessary system downtimes, if applicable.
   - **Post-Migration Testing**
     - Validate functionality of the new platform with migrated accounts.
     - Confirm generation of required RBNZ reports with stakeholders.

4. **Legacy System Retirement (Month 12)**
   - **Finalize Documentation**
     - Document the entire migration process, including challenges encountered and solutions.
     - Create a final status report on data integrity, compliance, and system readiness.
   - **Decommission Legacy System**
     - Safely decommission the legacy loan ledger infrastructure.
     - Ensure any necessary data retention for legal compliance is securely archived.
   - **Post-Migration Review**
     - Conduct a post-migration review with all stakeholders to discuss lessons learned and successes.
     - Provide training on the new system as needed to the end-users.

### Additional Considerations
- **Compliance and Regulatory Reporting**
  - Ensure ongoing engagement with the RBNZ relationship team for continued feedback on report generation.
  - Document compliance processes in real-time as they evolve during the migration.

- **Change Management**
  - Ensure clear communication about changes and training for users transitioning to the new platform.
  - Prepare user support documentation for quick resolutions to any issues that might arise during the transition.

### Conclusion
This migration plan allows for a structured approach to transition from a legacy loan ledger system to a modern core banking solution while preserving data integrity and fulfilling legal requirements. Close monitoring, regular validation, and stakeholder engagement will be critical to the success of this project.