

# Discovery Report: Real-Time Payments (RTP) Inbound Processing

## Programme Overview

Payments NZ is launching a real-time payments scheme requiring the enterprise to participate as a scheme member. The immediate scope is **inbound RTP payment processing** — receiving payments to enterprise customer accounts, crediting them in real time, and acknowledging receipt within scheme-mandated timeframes.

The enterprise currently operates on batch processing rails with same-day settlement. This programme represents a fundamental architectural shift to 24/7/365 real-time processing.

---

## What We Know

### Scheme Requirements (Confirmed)
- **Transaction speed**: Payments must be received and sent within 60 seconds end-to-end.
- **Acknowledgement window**: 10 seconds from receipt of inbound payment message to scheme acknowledgement.
- **Availability**: 24/7/365 operation with immediate fund availability to customers.
- **Message format**: ISO 20022.
- **Fraud screening**: Required on all inbound payments per scheme rules.
- **AML screening**: Required on inbound payments above $1,000.
- **Go-live deadline**: 2026-09-01. Penalty of $50,000/day for delay, plus potential scheme suspension.

### Current State (Confirmed)
- Core banking system processes transactions in batch windows — it cannot credit accounts in real time as-is.
- Current fraud system runs as a batch job with no real-time API.
- AML system has a real-time API, but P99 latency is 8 seconds under load.
- Current domestic payment rails use batch processing with same-day settlement.

### Architectural Direction (Stated but not yet validated)
- A thin real-time processing layer will credit accounts immediately and reconcile with the batch core at end of day.
- Real-time fraud check estimated to add 2–4 seconds to processing time.

### Peak Volume Estimate
- 40,000 transactions per hour at peak (approximately 11 transactions per second).

---

## What We Don't Know

This is where the critical risks concentrate. I am grouping these by theme.

### 1. The Acknowledgement Time Budget Does Not Appear to Close

This is the most important finding from this discovery. The 10-second acknowledgement window must accommodate multiple sequential processing steps. Based on what has been stated:

| Step | Estimated Duration | Confidence |
|---|---|---|
| Network receipt and message parsing | Unknown | Not estimated |
| Fraud screening (real-time, not yet built) | 2–4 seconds (estimate) | Low — no real-time fraud capability exists today |
| AML screening (for transactions > $1,000) | Up to 8 seconds (P99 under load) | Measured, but not at RTP volumes |
| Account crediting (real-time layer, not yet built) | Unknown | Not estimated |
| Acknowledgement message construction and transmission | Unknown | Not estimated |

If we take the midpoint fraud estimate (3 seconds) and the P99 AML latency (8 seconds), those two steps alone consume 11 seconds — **already exceeding the 10-second window** before accounting for any other processing. Even at more optimistic percentiles, the combined latency of fraud + AML likely consumes most or all of the available budget, leaving no margin for the other steps.

**We do not currently have a credible design that fits within the acknowledgement window for AML-applicable transactions.** This needs to be resolved before detailed design proceeds, because it drives fundamental architectural decisions (parallel vs. sequential processing, asynchronous AML with post-credit screening, scheme rule negotiation on timeout handling, etc.).

#### Open Questions
- What is the full processing chain from message receipt to acknowledgement, with time estimates for every step?
- Can fraud and AML screening run in parallel rather than sequentially?
- What happens under scheme rules if we cannot acknowledge within 10 seconds — is the payment rejected, retried, or does the scheme provide a different flow?
- Is there a scheme-permitted model where AML screening occurs post-credit (i.e., accept and screen, with holds or clawback if flagged)?
- Has Payments NZ published latency budgets or reference architectures that other participants are using?
- What is the P50 and P95 latency of the AML system, not just P99? What percentage of transactions exceed the threshold that triggers AML?

### 2. Fraud Screening Capability Gap

The current fraud system has no real-time API. The 2–4 second estimate for a real-time fraud check is just that — an estimate, with no system to measure against.

#### Open Questions
- Where does the 2–4 second estimate come from? Is it based on vendor guidance, an analogous system, or an assumption?
- Are we building a real-time fraud capability in-house, purchasing a new product, or extending the existing system?
- What is the vendor's actual SLA for real-time decisioning at our volumes?
- What is the fraud screening decision model — binary accept/reject, or is there a "refer for review" path? If the latter, what happens to the payment while it is being reviewed?
- What fraud rules are required by the scheme vs. what is at our discretion?

### 3. AML System Performance at Scale

The AML system has a real-time API, which is positive. However, its P99 latency of 8 seconds was measured at current loads, and it has not been tested at RTP volumes.

#### Open Questions
- What volume and transaction mix was the AML system under when the 8-second P99 was measured?
- What happens to AML latency at 40,000 transactions/hour? What about the subset that are >$1,000 — what percentage of total volume is that?
- Can the AML system be scaled (horizontally or vertically) to bring P99 down to a level that fits within the time budget?
- What is the vendor's contracted SLA for real-time API response time?
- Is there a degradation or bypass mode if the AML system is slow or unavailable — and would such a mode be acceptable under scheme rules and AML regulations?

### 4. Real-Time Processing Layer Design

The concept of a thin real-time layer reconciling with the batch core at end of day is stated as the approach, but significant design questions remain.

#### Open Questions
- Has this pattern been validated with the core banking vendor? Are there known integration points or is this net-new development?
- What is the source of truth for account balances during the day — the real-time layer or the batch core? How are conflicts resolved at reconciliation?
- What happens if reconciliation fails? What is the remediation process?
- How are reversals, returns, and exceptions handled in a split real-time/batch architecture?
- What is the availability architecture for the real-time layer to meet 24/7/365 requirements? The batch core presumably has maintenance windows — what happens during those windows?
- Does the real-time layer need to enforce balance limits, holds, or account-level controls? If so, it needs more than a thin crediting capability.

### 5. ISO 20022 Integration

#### Open Questions
- Do we have existing ISO 20022 capability in any part of the payments stack, or is this entirely new?
- Has Payments NZ published the specific message set and implementation guide? Which messages are in scope for inbound receiving (pacs.008, pacs.002, etc.)?
- What connectivity model does the central infrastructure use — direct API, message queue, network gateway?
- Is there a scheme-provided test environment and certification process? What is the timeline for certification?

### 6. Operational Readiness for 24/7/365

The enterprise currently operates batch processing, which typically implies operational models oriented around business-hours support and scheduled maintenance windows.

#### Open Questions
- Do we have a 24/7 operations and support model today, or does this need to be established?
- What is the scheme's availability SLA? What are the penalties or consequences for downtime outside of agreed maintenance windows?
- What monitoring, alerting, and incident response capabilities are needed for a real-time payments system?
- How do we handle deployments and maintenance with zero downtime?
- What is the disaster recovery requirement — active-active, active-passive, RTO/RPO targets?

### 7. Sending Side and Future Scope

The brief states the receiving side is being built first.

#### Open Questions
- Is there a scheme deadline for sending capability, or is it discretionary timing?
- Are architectural decisions being made on the receiving side that could constrain or enable the sending side? Should we be designing for both now?
- What other scheme obligations (reporting, dispute resolution, directory services) are required by go-live?

### 8. Commercial and Regulatory

#### Open Questions
- Has legal review of the scheme participation agreement been completed? Are there obligations beyond what is described in this brief?
- What are the regulatory approval requirements for launching real-time payments — do we need Reserve Bank or FMA sign-off?
- What is the total programme budget and has it been approved?
- Is there a contractual relationship with Payments NZ that provides access to test environments, technical specifications, and implementation support? What is the timeline for accessing these?

---

## Key Risks

| # | Risk | Severity | Basis |
|---|---|---|---|
| 1 | **The 10-second acknowledgement window cannot be met** with sequential fraud + AML screening based on current estimates. This is not a marginal miss — the numbers as stated do not add up. | **Critical** | Fraud (2–4s) + AML P99 (8s) = 10–12s before any other processing. No remaining budget for message parsing, account crediting, or acknowledgement. |
| 2 | **No real-time fraud screening capability exists today.** This must be procured or built, and its latency characteristics are unproven. | **High** | Confirmed: current system is batch-only. The 2–4s estimate is unvalidated. |
| 3 | **AML system has not been load-tested at RTP volumes.** Latency is already marginal at current volumes and may degrade significantly under RTP peak load. | **High** | P99 of 8s at current load; 40k TPS/hour untested. |
| 4 | **The real-time processing layer is conceptual.** Core architectural questions about balance management, reconciliation, and availability are unresolved. | **High** | No design artefacts or vendor validation referenced. |
| 5 | **The go-live date carries significant financial penalty** ($50k/day) and the programme has multiple unresolved technical risks that could affect timeline. | **High** | Contractual obligation, 2026-09-01. |
| 6 | **24/7/365 operational model may not exist.** Transitioning from batch operations to real-time requires organisational change beyond technology delivery. | **Medium** | Not addressed in brief; assumed to be a gap based on batch heritage. |

---

## Recommended Next Steps

These are sequenced by dependency and criticality.

### Immediate (next 2 weeks)

1. **Resolve the time budget problem.** Map every processing step from message receipt to acknowledgement with realistic latency estimates. Confirm whether the 10-second window is achievable. If it is not, identify architectural options (parallel processing, async AML, scheme negotiation) and make a decision. This gates all downstream design work.

2. **Engage Payments NZ on scheme rules.** Specifically: what happens when acknowledgement times out? Is post-credit AML screening permissible? Are there reference architectures or latency budgets from other participants? Get the implementation guide and message specifications if not already obtained.

3. **Load-test the AML system at projected RTP volumes.** Determine actual latency distribution at 40,000 TPH, specifically for the subset of transactions above $1,000. Understand whether the system can be scaled and at what cost.

### Short-term (next 4–6 weeks)

4. **Define the fraud screening approach.** Decide build vs. buy. Obtain vendor latency commitments. Establish whether 2–4 seconds is realistic or optimistic.

5. **Validate the real-time processing layer architecture with the core banking vendor.** Confirm integration approach, balance management model, and reconciliation design. Identify constraints.

6. **Assess operational readiness for 24/7/365.** Identify gaps in support model, monitoring, incident management, and DR capability.

### Before committing to detailed design

7. **Produce a credible end-to-end latency model** that accounts for all processing steps, at P50, P95, and P99, at peak volume. This model must demonstrate that the 10-second acknowledgement window is achievable with margin. If it does not, escalate for architectural or commercial resolution before proceeding.

---

## Summary

The programme objective is clear and the deadline is hard. The most significant finding from this discovery is that **the acknowledgement time budget does not currently close** — the estimated latencies for fraud and AML screening alone meet or exceed the 10-second window before any other processing is accounted for. This is not a minor optimisation problem; it is a fundamental constraint that must be resolved before the architecture can be finalised.

Beyond the time budget, there are substantial open questions about the fraud screening capability (which does not exist today), AML system scalability (untested at target volumes), the real-time processing layer (conceptual), and operational readiness for 24/7/365 operation.

None of these are unusual for a programme at this stage, but they must be addressed systematically and soon given the fixed go-live date. The recommended next steps focus on closing the highest-risk unknowns first.