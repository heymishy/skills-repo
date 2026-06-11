Great, here's a synthesis of the problem/opportunity based on your description (you can use this to align your team or refine the scope further):

---

**Problem Statement:**  
Our current failed payments handling process is inefficient and non-scalable. All failed card payments—whether due to temporary (retryable) errors or permanent issues—are sent to a manual review queue. Operators must spend 2-3 hours daily triaging this queue to determine which failures should be retried. With upcoming high-volume merchant onboarding, queue volume (and time spent triaging) is expected to double. Merchants currently face uncertainty about retry expectations, leading to disputes and added reconciliation work for the finance team.

**Opportunity:**  
By introducing an automated retry mechanism for payments with retryable failure codes, we can eliminate most manual triage work, reduce merchant confusion, and scale operationally for volume growth.

---

**Who experiences it:**
- **Payment Operations Team:** High and increasing manual workload triaging failed payments.
- **Merchants:** Unclear next steps on failed payments; business impact from uncertainty; submit more disputes.
- **Finance Team:** Extra time resolving merchant disputes related to failed payments.

---

**Why now:**  
Upcoming onboarding of two high-volume merchants will at least double failed payment volume. Manual triage is not sustainable at this scale.

---

**Proposed MVP:**  
- **Automated Retry Logic:**  
  - Reads from the failed payments queue.
  - Classifies each failure as retryable vs. permanent (based on failure code).
  - Automatically retries retryable failures using exponential backoff.
  - Leaves permanent failures untouched for manual review.
- **Scope Exclusions:**  
  - No new circuit breaker logic (e.g., for excessive failures or fraud trends).
  - No new merchant-facing dashboards about retry status.
  - No upstream gateway or error-handling changes.

---

**Definition of Success:**  
- Retryable failures are retried and cleared without manual intervention.
- Operations daily triage time drops from 2-3 hours to <30 minutes.
- Merchant dispute and finance reconciliation workload is reduced.

---

**Next Steps / Clarification Suggestions:**
1. **Data Check:** Review recent failure codes to confirm that 12% estimate is accurate and codes are consistently classified.
2. **Edge Cases:** Identify how to handle ambiguous codes or errors with uncertain retryability.
3. **Alerting:** Ensure operators are notified if automatic retries fail multiple times for a single payment.
4. **Merchant Communication:** Consider how you’ll notify merchants of automatic retry actions in the current process (even though dashboards are out of scope).
5. **Metrics:** Set up before/after metrics to measure triage time and retry success rates.

Let me know if you want to break down risks, define detailed requirements, or proceed with solution design!