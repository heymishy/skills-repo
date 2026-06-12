To build the automated regulatory reporting pipeline you are aiming for, several steps and considerations must be addressed. Here's a high-level plan with considerations for next steps:

1. **Requirements Gathering:** 

   - Confirm the full list of data fields required from each source system for both RBNZ and FMA reports.
   - Document the specific reconciliation steps, including detailed normalisation logic and any adjustments needed.
   - Specify audit requirements, focusing on traceability and record-keeping that aligns with compliance needs.

2. **Technical Infrastructure:**

   - Identify and secure approval for using read-only APIs for the core banking, treasury, and card platforms.
   - Evaluate potential data pipeline tools and platforms (e.g., Apache Kafka, AWS Glue, or Azure Data Factory) that can meet your needs for data extraction, transformation, and loading (ETL).

3. **Data Pipeline Design:**

   - Design the ETL workflows to extract data from source systems. Ensure that these are resilient and capable of handling data size and complexity.
   - Implement the normalisation logic as a data transformation step within the pipeline. Consider leveraging frameworks like Apache Spark or Pandas (for Python-based tooling) for efficient data transformations.
   - Establish processes for generating pre-populated return files in the required format for RBNZ and FMA submissions.

4. **Audit Trail Implementation:**

   - Ensure every data transformation and reconciliation process logs a detailed record. Implement metadata logging to maintain traceability from input data to final report figures.
   - Use tools such as Apache Nifi or ELT automation software that can automatically generate an audit trail.

5. **Testing and Validation:**

   - Conduct thorough testing with historical data to validate the accuracy and completeness of the automated pipeline. Use a parallel run to compare automated outputs against existing manual processes.
   - Engage analysts in validating the automated extraction and reconciliation, ensuring outputs meet their approval.

6. **User Training and Documentation:**

   - Develop documentation on how the pipeline functions, including troubleshooting guides.
   - Provide training sessions to analysts to ensure they understand how to review and validate the pre-populated return files.

7. **Compliance and Security:**

   - Ensure data access controls are in place to protect sensitive financial data and meet regulatory compliance requirements.
   - Conduct a compliance review with legal and compliance teams to verify that all pipeline aspects meet auditing and regulatory standards.

8. **Go-Live and Monitoring:**

   - Upon successful testing and validation, plan for a phased roll-out.
   - Implement monitoring tools to ensure real-time detection of any issues in data extraction, transformation, or loading. Consider using tools such as Prometheus or Grafana for system monitoring.

9. **Iterative Improvement:**

   - Solicit analyst feedback post go-live to identify any additional improvements needed.
   - Regularly review the pipeline’s performance and reconcile requirements to continuously optimise processes.

Each of these steps is crucial to building a robust reporting pipeline that reduces manual effort, minimizes errors, and ensures compliance with RBNZ and FMA requirements. Engage relevant stakeholders regularly to ensure clarity around roles, responsibilities, and progress.