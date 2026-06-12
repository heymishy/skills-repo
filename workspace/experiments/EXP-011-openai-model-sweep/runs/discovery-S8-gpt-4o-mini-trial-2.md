To build an automated regulatory reporting pipeline that meets the outlined requirements, we can approach the project in several key phases, focusing on data extraction, transformation, reconciliation, and compliance. Here’s a blueprint for implementing your automated solution:

### 1. **Project Definition and Scope**
   - **Identify Stakeholders**: Engage with senior analysts, compliance team, IT, and management.
   - **Define Requirements**: Incorporate input from the finance operations team and compliance to outline critical success factors, such as:
     - Data fields needed from the core banking, treasury, and card platforms
     - Normalisation logic to correct legacy artefacts
     - Compliance requirements for audit trails and traceability

### 2. **System Design**
   - **Architect the Pipeline**: 
     - Identify the architecture components: data source connectors, transformation engine, reconciliation logic, and output/report generation.
     - Design a modular architecture to keep components decoupled for easier maintenance and updates.

### 3. **Data Extraction**
   - **API Integration**:
     - Develop read-only APIs to extract necessary data fields from the core banking, treasury, and card platforms.
     - Ensure the APIs handle authentication, rate-limiting, and error management.

### 4. **Data Transformation and Normalisation**
   - **Define Normalisation Rules**: Work with analysts to clearly document the normalisation logic for fields that carry legacy artefacts. Example transformations may include:
     - Rounding adjustments
     - Timing adjustments for data discrepancies
   - **Implementation**: Develop the transformation layer using ETL (Extract, Transform, Load) tools to apply the normalisation rules to the extracted datasets.

### 5. **Reconciliation Logic**
   - Automate the reconciliation process using defined criteria and logic. This could include checks like:
     - Balancing checks between different data sets.
     - Variance checks to assess correctness and completeness.
 
### 6. **Output Generation**
   - **Pre-Populated Return Creation**: Design the pipeline to generate a pre-filled return file that will be reviewed and approved by analysts.
   - Ensure the output format meets the requirements for submission to RBNZ and FMA.

### 7. **Approval Workflow**
   - **Human Review**: Implement an approval workflow within the pipeline where the pre-filled returns can be reviewed by analysts before final submission.
   - Ensure analysts can annotate and document any changes or corrections made during their review process.

### 8. **Audit Trail Implementation**
   - **Logging Mechanism**: Integrate a comprehensive logging mechanism throughout the pipeline to maintain an audit trail of:
     - Data extraction
     - Transformation applied
     - Reconciliation results
     - Review and approval steps
   - Design records in such a way that they are easily accessible for regulatory scrutiny, with clear linkage back to source data.

### 9. **Testing and Validation**
   - **Unit Testing**: Test each component of the pipeline individually.
   - **Integration Testing**: Test the end-to-end pipeline to ensure all components work together seamlessly and meet performance requirements.
   - **User Acceptance Testing (UAT)**: Have analysts validate the pipeline’s output for accuracy and compliance.

### 10. **Deployment and Training**
   - Deploy the pipeline in a production environment.
   - Train the finance operations team on how to use the new system, including understanding the approval workflow and how to access audit trails.

### 11. **Post-Implementation Review**
   - Conduct a review after the first complete regulatory cycle using the automated pipeline to capture lessons learned and areas for improvement.

### 12. **Ongoing Maintenance and Enhancements**
   - Monitor the pipeline’s performance and gather feedback from users for continued improvement.
   - Keep the system updated with any changes in regulatory requirements.

### Conclusion
Implementing this automated regulatory reporting pipeline will significantly enhance the efficiency of your finance operations team, reduce the risk of errors in reporting, and ensure compliance with RBNZ and FMA standards, thereby mitigating the risk of missed submission deadlines and associated penalties.