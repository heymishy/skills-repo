Given the decommissioning of the legacy loan ledger system and the migration to the new core banking platform, here are the key components to consider in the migration project plan:

### Project Overview
- **Objective**: Migrate 280,000 active loan accounts from the legacy system to the new core banking platform within a 12-month timeline, ensuring data integrity and compliance with RBNZ regulatory reporting requirements.
- **Deadline**: Cutover to the new system must be completed within 12 months due to the expiration of the legacy system's support contract. 

### Key Phases

1. **Planning & Preparation (Month 1-2)**
   - **Stakeholder Engagement**: Involve stakeholders from IT, compliance, finance, and legal teams.
   - **Requirements Gathering**: Map out requirements for data migration, including data fields and regulatory reporting needs.
   - **Risk Assessment**: Identify potential risks beyond data integrity and develop mitigation plans. 
   - **Migration Toolset Familiarization**: The project team will be trained on the vendor's migration toolset.

2. **Design (Month 2-3)**
   - **Data Mapping**: Create a comprehensive data mapping document that identifies how legacy data will translate to the new platform.
   - **Reporting Requirements**: Work with the RBNZ relationship team to clarify all reporting needs and ensure the new platform can fulfill these requirements.

3. **Development & Configuration (Month 3-5)**
   - **Migration Tool Configuration**: Set up the migration tool and begin preparing the extraction, transformation, and loading (ETL) processes.
   - **System Configuration**: Ensure the new platform is configured to accommodate all loan account types and original terms.

4. **Testing (Month 5)**
   - **Data Integrity Testing**: Conduct tests to ensure accurate data migration by comparing legacy and new system datasets.
   - **Functional Testing**: Ensure all functions in the new platform work as intended for loan accounts and compliance reporting.

5. **Parallel Operation (Month 6-11)**
   - **Shadow Mode Execution**: Run both systems simultaneously. New loans originate on the new platform, while existing loans run in shadow mode.
   - **Data Verification**: Periodically validate data synchronization between the two systems.
   - **Reconciliation Pass**: At the end of month 6, run a detailed reconciliation of the two systems to identify discrepancies.

6. **Cutover & Migration (Month 12)**
   - **Final Validation**: Conduct a final round of testing and validation of the data integrity.
   - **Staged Migration**: Use a phased approach to migrate remaining legacy accounts in alignment with business hours to minimize disruptions.
   - **Validation Post-Cutover**: Immediately validate that all data has been successfully migrated and is operational.

7. **Post-Migration (Months 12-18)**
   - **Decommissioning the Legacy System**: Safely retire the legacy system and ensure data retention compliance for closed loans.
   - **Monitoring & Support**: Establish ongoing monitoring mechanisms for the new system.
   - **Reporting Review**: Work with RBNZ to confirm that all reports are accurate and meet regulatory standards.

### Team Structure
- **Project Manager**: Oversees the entire migration project, ensures timelines are adhered to, and maintains communication with stakeholders.
- **Engineering Team (6)**: Responsible for the technical aspects including development, testing, and migration tasks.
- **Data Architect (1)**: Manages data mapping and database design to ensure a smooth transition of records.

### Risks & Mitigations
- **Data Integrity Risks**: Mitigated through thorough testing and validation processes.
- **Regulatory Compliance**: Ensure active communication with the RBNZ relationship team throughout the project.
- **Resource Availability**: Ensure that project team members are fully available, and consider contingency plans for staff turnover or absences.

### Conclusion
This structured approach will enable the enterprise to successfully migrate loan accounts to the new core banking platform within the constraints of the 12-month deadline, while minimizing risks and ensuring compliance with regulatory requirements. Regular updates to all stakeholders will be crucial to maintaining transparency and addressing any issues promptly.