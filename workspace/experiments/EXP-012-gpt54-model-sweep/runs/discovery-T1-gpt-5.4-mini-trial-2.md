Great — here’s the problem/opportunity statement I’m taking into the discovery pipeline:

## Problem / Opportunity
A meaningful share of failed card payments are **temporarily retryable** (about 12%), but today **all failed payments are handled identically** and left for manual operator review. This creates:

- **Operational inefficiency**: 2–3 hours/day spent triaging failed payments
- **Merchant uncertainty**: no clear guidance on whether to retry failed payments
- **Finance overhead**: additional reconciliation work tied to disputes and unclear outcomes

With two new high-volume merchants coming online next month, the current manual workflow will not scale.

## Proposed MVP
Build an automated retry mechanism that:

- Reads from the failed payments queue
- Classifies failures as **retryable vs permanent**
- Automatically retries retryable failures using **exponential backoff**
- Leaves permanent failures in the manual review queue

## Out of scope
- Circuit breaker logic
- Proactive fraud screening on retries
- Merchant-facing retry status dashboard
- Upstream error handling changes

## Success criteria
- Retryable failures are handled automatically without manual triage
- Operations triage time drops from **2–3 hours/day** to **under 30 minutes/day**

If you’d like, I can next turn this into a discovery brief with:
1. assumptions to validate,  
2. key risks / unknowns,  
3. recommended discovery questions, and  
4. suggested experiment or data checks.