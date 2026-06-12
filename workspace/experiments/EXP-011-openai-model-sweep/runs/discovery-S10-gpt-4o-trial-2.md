Given the scope and requirements of your migration project, here are some steps and considerations for a successful transition from your legacy loan ledger system to the new core banking platform:

### Project Phases and Key Activities

#### 1. **Initiation and Planning**
   - **Define Scope and Objectives**: Clearly articulate what success looks like, including a comprehensive understanding of data integrity, system performance, and regulatory compliance.
   - **Assemble the Team**: Confirm roles and responsibilities. Your team should consist of six engineers, a data architect, a project manager, and key stakeholders like legal and compliance experts.
   - **Vendor Coordination**: Work closely with the new platform vendor to understand their migration toolset and ensure it meets your requirements.

#### 2. **Data Assessment and Preparation**
   - **Data Audit**: Conduct a thorough audit of the loan data on the legacy system, assessing data quality, identifying discrepancies, and cleaning data as necessary.
   - **Data Mapping**: Map fields from the legacy system to the new platform, ensuring all historical and current data elements are accounted for.
   - **Compliance Review**: Confirm with legal and compliance teams regarding data preservation and retention requirements, especially for closed loans.

#### 3. **System and Process Design**
   - **Design Parallel Operation Model**: Define how business processes will operate during the parallel run, including new loan originations and shadow operations.
   - **Regulatory Reporting**: Work with the RBNZ relationship team to understand reporting requirements and ensure that the new platform can produce necessary reports.

#### 4. **Implementation and Parallel Testing**
   - **Deploy Parallel Environment**: Set up and configure the new platform to run in parallel with the legacy system.
   - **Data Migration Pilot**: Conduct an initial data migration for a small subset of accounts to validate mappings and identify potential issues.
   - **Process Simulation**: Run simulations of loan originations and transactions to ensure the new system processes correctly when in parallel mode.
   - **User and Stakeholder Training**: Train staff on new processes and systems for effective adoption and identification of latent issues during dual operation.

#### 5. **Validation and Reconciliation**
   - **Data Integrity Checks**: Regularly validate data integrity during parallel operations, comparing transactions across both platforms.
   - **Reconciliation Pass**: Run a comprehensive reconciliation to confirm all data has been accurately transferred and mirrored.
   - **Secure Sign-offs**: Obtain approvals from legal and compliance teams to confirm regulatory obligations are met before cutover.

#### 6. **Cutover and Migration**
   - **Final Rehearsal**: Conduct a full migration rehearsal, including rollback plans.
   - **Staged Migration**: Over a weekend, execute the migration in stages to manage risks and allow quick adjustments if necessary.
   - **Post-Cutover Validation**: Immediately after cutover, verify that all data is intact and that the new system is fully operational.

#### 7. **Decommissioning and Project Closure**
   - **Legacy System Decommission**: Securely archive any required data from the legacy system to meet regulatory timelines before decommissioning.
   - **Infrastructure Retirement**: Takedown legacy infrastructure responsibly, ensuring no data breaches during the transition.
   - **Review and Lessons Learned**: Conduct a post-project review, focusing on lessons learned, to inform future migration projects.

### Key Risk Management Strategies
- **Data Loss Mitigation**: Develop a contingency plan including regular backups and a rollback procedure during the migration phase.
- **Regulatory Compliance Assurance**: Continually liaise with legal teams and the RBNZ to ensure compliance throughout the project.
- **Comprehensive Testing**: Implement thorough testing before, during, and after the cutover to catch and rectify potential discrepancies early.

By following these steps and maintaining thorough communication across teams and with your vendor, your enterprise should be well-prepared to execute a successful migration, retire the legacy system, and transition smoothly to functioning on a single core banking platform.