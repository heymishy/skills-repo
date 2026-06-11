**Problem/Opportunity Statement:**

**Problem:**  
The current payment failure triage process is inefficient and unscalable. About 40,000 card payments are processed daily; ~12% of failures are retryable (transient errors like network timeouts or temporary issuer declines), but these are manually reviewed alongside permanent failures in a single Failed Payments Queue. This results in significant manual effort (2-3 hours/day by the operations team), delays for merchants (who don’t know whether to retry), and increased workload for the finance team (more disputes to reconcile). The imminent onboarding of high-volume merchants will double this workload, making the current manual process untenable.

**Opportunity:**  
By automatically detecting and handling retryable failures (those likely to succeed if retried), we can streamline operations, reduce manual effort, improve merchant experience, decrease disputes, and ensure readiness for increased transaction volumes.

---

**Summary Table:**

| Aspect                  | Details                                                                                                     |
|-------------------------|------------------------------------------------------------------------------------------------------------|
| **Who**                 | Payment operations, merchants, finance/dispute teams                                                        |
| **What's Broken/Slow**  | Manual triage for both retryable and permanent failures; indistinguishable treatment of transient vs permanent errors      |
| **Why Now**             | Incoming volume spike with new high-volume merchants; current manual process doesn't scale                  |
| **Success Looks Like**  | Auto-classification and retry of retryable failures; triage time drops to <30min/day; operational load reduced               |

---

**Proposed Solution:**  
- **MVP:**  
    - Build a mechanism to read the failed payments queue  
    - Classify payment failures (via code mapping) into retryable vs permanent  
    - Automatically retry payments with retryable failure codes, using exponential backoff (to avoid hammering the processor)  
    - Leave permanent failures for manual review only  

- **Out of Scope:**  
    - No circuit breaker protection  
    - No fraud screening/monitoring enhancements during retries  
    - No merchant-facing UI updates for retry status  
    - No changes to upstream error handling  

---

**Impact:**  
- Eliminates manual effort for retryable failures  
- Operations triage time falls to <30min/day  
- Merchants receive faster, clearer resolution on failed transactions  
- Prepares the payment system for doubled transaction volume without additional headcount  
- Reduces dispute workload for finance team  

---

_Next step:_  
- Map existing failure codes to retryable/permanent  
- Design error-handler and retry logic (with exponential backoff)  
- Validate MVP on real queue before full rollout