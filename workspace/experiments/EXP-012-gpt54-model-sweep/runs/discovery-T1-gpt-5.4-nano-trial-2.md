## Problem / Opportunity to Explore
Failed card payments are being handled in a “manual-only” way today. Roughly **40,000 card payments per day** feed into a **failed payments queue** whenever a payment attempt fails (e.g., **network timeouts, temporary issuer declines, gateway errors**). That queue is then **manually reviewed by operators** until a decision is made.

A key issue: about **12% of failures are actually retryable** (temporary decline codes, transient timeouts), but **they’re currently treated the same as permanent failures**, so they wait in the queue and consume manual triage time. This creates three downstream problems:
- **Payment Ops:** spends **2–3 hours/day** manually triaging failures.
- **Merchants:** face uncertainty about whether retrying will happen automatically (leading to operational confusion).
- **Finance/Disputes:** sees additional overhead for dispute reconciliation because merchants can’t reliably determine whether a failure should be retried.

### Why Now
You’re onboarding **two new high-volume merchants next month**, which will likely **double** the failed queue size and triage workload. Without automation, the current manual process won’t scale.

### Opportunity
Implement an MVP retry mechanism that:
1. Reads items from the failed payments queue
2. **Classifies failure codes** into **retryable vs permanent**
3. Automatically retries **retryable** failures using **exponential backoff**
4. Leaves **permanent** failures in the queue for manual review

### MVP Goal / Success Criteria
- **Retryable failures** should be processed automatically (no manual triage)
- **Ops triage time** should drop from **2–3 hours/day to under 30 minutes/day**

If you want, I can also rewrite this into a “discovery pipeline” problem statement format (1–2 paragraphs + crisp hypotheses) or help define the specific assumptions to validate (e.g., how to map failure codes, expected retry success rates, and risk of duplicate charges).