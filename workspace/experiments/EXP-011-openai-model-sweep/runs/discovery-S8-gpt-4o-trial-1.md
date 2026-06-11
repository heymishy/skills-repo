Developing an automated regulatory reporting pipeline involves several stages that address your current challenges and regulatory requirements. Here's a detailed outline of how you can implement this solution:

### 1. Requirements Gathering and Analysis
- **Stakeholder Engagement:** Engage with analysts, IT, compliance, and other stakeholders to gather detailed requirements for the pipeline. Understand specific data points, reconciliation logic, and normalisation processes that need to be automated.
- **Documentation:** Document the workflow and processes, including data extraction, reconciliation, and normalisation steps.

### 2. System Integration
- **API Development:** Work with IT to develop read-only APIs for each of the three source systems (core banking, treasury, and card platforms). Ensure APIs can securely extract necessary data fields.
- **Security and Compliance:** Implement strict security measures to protect sensitive data during extraction and transit, ensuring compliance with internal and external data protection policies.

### 3. Data Transformation Logic
- **Normalisation Logic:** Collaborate with senior analysts to formalise the normalisation process as a data transformation layer in the pipeline. This should address legacy artefacts like rounding differences and timing mismatches.
- **Reconciliation Automation:** Develop scripts or logic that automate current manual reconciliation processes.

### 4. Audit Trail and Compliance
- **Logging and Monitoring:** Implement a comprehensive logging system that tracks every transformation and adjustment made to the data. This log should capture timestamps, user actions, and transformation details.
- **Traceability:** Ensure the system can produce a complete audit trail that links each figure in the return to its original source data, with explanations for any adjustments.

### 5. Workflow Automation
- **Scheduling:** Set up scheduling to automatically trigger data extraction and transformation processes at the start of each month, ensuring completion well before the submission deadline.
- **Pre-population:** Automate the creation of a pre-populated return file ready for analyst review.

### 6. Review and Sign-off
- **Analyst Review Interface:** Develop a user-friendly interface where analysts can review and approve pre-populated returns. Implement features for annotating changes or concerns.
- **Manual Override:** Allow analysts to manually adjust figures if necessary, with appropriate logging of any manual interventions.

### 7. Testing and Validation
- **Unit and Integration Testing:** Test individual components of the pipeline for accuracy and efficiency. Validate that the normalisation and reconciliation logic are correctly implemented.
- **User Acceptance Testing (UAT):** Conduct thorough UAT with stakeholders to ensure the pipeline meets all functional requirements and integrates seamlessly with existing workflows.

### 8. Deployment and Training
- **Deployment:** Deploy the pipeline in a live environment, ensuring all components are operational and stable.
- **Training:** Conduct training sessions for analysts and other users. Provide documentation and support to address any questions or issues that may arise.

### 9. Continuous Improvement
- **Feedback Loop:** Establish a feedback loop with users to identify areas for improvement and address any concerns arising from real-world use.
- **Performance Monitoring:** Continuously monitor the pipeline's performance to ensure it operates efficiently and meets all compliance requirements.

### 10. Compliance and Reporting
- **Regulatory Compliance:** Ensure that the automated process is compliant with RBNZ and FMA requirements. Be prepared for potential audits by maintaining a robust audit trail.
- **Timely Submission:** Ensure the pipeline supports on-time submission of RBNZ prudential returns by the 20th of each month, reducing the risk of non-compliance and penalties.

By implementing this automated pipeline, your organization can significantly reduce manual workloads, improve accuracy and compliance, and ensure timely submission of regulatory reports.