**Problem / Opportunity to Explore:**  
Our payment system currently sends *all* failed card payments (e.g., network timeouts, temporary issuer declines, gateway errors) into a “failed payments” queue where they remain until an operator manually reviews them. However, ~**12%** of these failures are actually **retryable** (transient timeouts / temporary decline codes) and could succeed if retried, while the rest are **permanent** and should remain for manual handling.

**Who experiences it:**  
- **Payment operations team:** spends **2–3 hours/day** manually triaging the failed queue.  
- **Merchants:** lack clarity on whether retries happen, leading to uncertainty and disputes.  
- **Finance team:** incurs extra overhead reconciling disputes tied to unclear retry behavior.

**Why now:**  
We’re onboarding **two new high-volume merchants next month**, which will roughly **double** the volume of failed payments—and the current manual process won’t scale.

**Opportunity / Proposed direction (MVP):**  
Implement an automated retry mechanism for failed payments that:
1. Reads from the failed payments queue  
2. Classifies failures as **retryable vs permanent** based on failure codes  
3. Automatically retries **retryable** failures using **exponential backoff**  
4. Leaves **permanent** failures in the queue for manual review (no change to upstream error handling; no circuit breaker beyond MVP)

**Success metric:**  
- Reduce operations triage time from **2–3 hours/day** to **<30 minutes/day**  
- Ensure retryable failures no longer require manual intervention, decreasing merchant uncertainty and dispute volume.

If you want, I can translate this into a succinct “Discovery” problem statement + hypothesis format for the /discovery pipeline.