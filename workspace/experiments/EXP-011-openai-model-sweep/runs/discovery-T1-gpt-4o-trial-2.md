Based on the problem and opportunity you've outlined, here are a few steps and considerations for developing an MVP that could effectively address the issues:

1. **Understand Failure Codes:**  
   - Compile a comprehensive list of error codes and their meanings from your payment gateway provider. Identify which ones are temporary (e.g., network timeouts, temporary issuer declines) and which ones are permanent (e.g., insufficient funds, closed accounts).

2. **Automated Classification:**  
   - Develop a system or script that can automatically classify incoming failures based on the error codes. This classification must differentiate between retryable and permanent failures.

3. **Retry Mechanism:**  
   - Implement a retry logic with exponential backoff. This means initially retrying after a short interval, and gradually increasing the delay between subsequent attempts to avoid overwhelming either your system or the payment processor.
   - Define a maximum number of retry attempts and a cutoff time after which no more retries are initiated.

4. **Queue Management:**  
   - Create a mechanism to move retryable failed payments out of the manual review queue and into a retry-specific process. Ensure that permanent failures are left in the queue for manual review.

5. **Monitoring and Logging:**  
   - Implement comprehensive logging for each retry attempt, including timestamps and outcomes, to facilitate monitoring and future troubleshooting.
   - Set up alerts for repeated failures on retryable transactions to catch systemic issues.

6. **Testing:**  
   - Test the MVP in a controlled environment with a small subset of transactions to ensure that the classification and retry logic functions as expected.
   - Consider failure simulation (timeouts, network drops) to verify the robustness of your retry mechanism.

7. **Feedback Loop:**  
   - Implement a feedback loop with the operations team to monitor the new process’s effectiveness and identify any unforeseen issues.
   - Conduct regular meetings with merchants to address concerns and adjust strategies based on their feedback and needs.

8. **Iterative Improvement:**  
   - Post-launch, monitor key metrics such as reduction in triage time, successful retries, merchant satisfaction, and dispute rates. Use these metrics to guide further optimizations.

By focusing on automating the retry process for retryable errors while keeping permanent errors flagged for human intervention, you should effectively mitigate the workload on your operations team, enhance merchant satisfaction, and prepare your system for increased transaction volumes resulting from new merchant onboarding.