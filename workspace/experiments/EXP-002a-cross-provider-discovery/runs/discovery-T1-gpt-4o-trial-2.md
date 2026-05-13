Your situation presents a clear opportunity to streamline and automate your payment processing system to better handle transaction failures, particularly those with retryable failure codes. As you aim to scale up with new high-volume merchants, improving this aspect of your operations is crucial. Here's a structured approach to explore this opportunity:

### Problem Areas
1. **Triage Time for Operations Team**: Currently, the operations team spends a significant amount of time manually reviewing failed payments, which is unsustainable as transaction volumes increase.
2. **Merchant Uncertainty**: Merchants face uncertainty about whether to retry failed payments, leading to disputes and possibly affecting relationships.
3. **Scalability Concerns**: The current manual process does not scale well with the anticipated increase in transaction volumes.

### Opportunities for Improvement
1. **Automated Retry Mechanism**: Implement a system that can automatically detect retryable failures and attempt them again with exponential backoff, thus reducing manual intervention.
2. **Classifier for Failure Codes**: Develop a classification system that automatically distinguishes between retryable and permanent failures based on failure codes.
3. **Efficiency Gains**: Reduce the daily triage time significantly by automating the retry process for certain failure types.

### Proposed Solution (MVP)
1. **Automated Retry System**:
   - Integrate a mechanism that reads from the failed payments queue.
   - Classify failures into retryable vs permanent categories.
   - Automatically retry the transactions identified as retryable, using exponential backoff to avoid overwhelming the system.

2. **Focus on Manual Review**: Leave the permanent failure cases for manual review, thereby allowing operators to focus on complex cases that need human oversight.

### Success Metrics
- **Reduction in Triage Time**: Achieve a reduction in triage time to under 30 minutes per day from the current 2-3 hours.
- **Improved Merchant Experience**: Decrease in payment disputes related to retry uncertainties.
- **Operational Efficiency**: Ability to handle the increase in volume with minimal additional manual effort.

### Implementation Considerations
1. **Integration with Existing Systems**: Ensure that the retry mechanism integrates smoothly with existing payment processing infrastructure.
2. **Testing and Validation**: Rigorously test the automatic retry system to ensure that it doesn't disrupt other processes and effectively identifies truly retryable transactions.
3. **Monitoring and Feedback Loop**: Set up a system to monitor the retry process, and provide feedback to refine classification rules and improve accuracy over time.

By focusing on automating the retry process for retryable failures, you not only improve operational efficiency but also enhance the overall experience for your merchants, reducing disputes and fostering smoother transactions.