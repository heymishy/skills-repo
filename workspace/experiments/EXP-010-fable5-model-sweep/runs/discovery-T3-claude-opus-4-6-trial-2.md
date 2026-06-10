

# Discovery Report: Real-Time AML Threshold Breach Alerting

## Problem Statement

Transactions breaching the £10,000 cash-equivalent threshold are going undetected for 18+ hours because compliance officers rely on a manually-checked morning report. Two near-misses in 90 days expose the firm to regulatory action. The FCA expects near-real-time detection, a review is scheduled for Q4, and the firm currently cannot demonstrate that capability.

---

## What I Explored

I worked through the problem across five dimensions: the triggering event and data flow, the alerting mechanism, the human workflow after an alert fires, the regulatory and audit requirements, and the failure modes that could undermine the whole system.

---

## Key Findings & Questions

### 1. The Threshold Is Deceptively Simple — Until It Isn't

The £10,000 single-transaction threshold sounds straightforward, but AML regulations also care about **structuring** (smurfing) — multiple transactions deliberately kept below threshold to avoid detection.

**Questions that need answering before build:**
- Are we solving **only** for single transactions ≥ £10,000 in the MVP, or do we also need aggregation rules (e.g., multiple transactions from the same customer totalling ≥ £10,000 within a rolling 24-hour window)?
- What counts as "cash equivalents" in your system? Is that classification already reliable in the transaction data, or is there ambiguity (e.g., crypto, prepaid cards, money orders)?
- Are there different thresholds for different product lines or customer risk tiers?

**Why this matters:** If the MVP only catches single large transactions but the FCA review probes for structuring detection, you'll have a visible gap. We need to scope this explicitly — even if aggregation is Phase 2, we need to articulate that decision defensibly.

**My current assumption:** MVP covers single transactions ≥ £10,000 in explicitly flagged cash-equivalent types. Aggregation is Phase 2 but we design the data model to support it from day one.

---

### 2. "Real-Time" Needs a Precise Definition

You said the target is under 15 minutes. That's a very different technical problem from "under 15 seconds."

**Questions:**
- When exactly does a transaction become visible in your system? At initiation? At settlement? Is there a pipeline delay before it lands in a queryable state?
- What is the current transaction data architecture? (Batch ETL into a warehouse? Event stream? Database writes with no pub/sub?)
- Do you have an event bus or message broker (Kafka, RabbitMQ, SNS/SQS) already in the stack, or would we be introducing one?
- What's the transaction volume? (Hundreds per day vs. tens of thousands per day changes the approach significantly.)

**Why this matters:** If transactions already land in a database in near-real-time but nobody's listening, this is a relatively simple polling or change-data-capture problem. If transactions arrive via nightly batch files, we have a much harder upstream problem to solve first.

**My current assumption:** Transactions are written to a database in near-real-time (within seconds of processing), and the gap is that nothing watches that stream. If this assumption is wrong, the project scope changes substantially.

---

### 3. Alert Routing and Noise Management

Slack + email is a reasonable MVP channel, but alerting systems fail in predictable ways.

**Questions:**
- How many transactions per day currently breach the £10,000 threshold? (If it's 5, this is manageable. If it's 200, compliance officers will develop alert fatigue within a week.)
- Should alerts route to a specific person, a rota, or a team channel? What happens outside business hours — does someone need to respond at 2am?
- What's the expected false positive rate? Are there known categories of legitimate high-value transactions (e.g., corporate treasury movements) that should be pre-filtered or at least triaged differently?
- Is there an existing case management system where alerts should ultimately land, or is Slack/email the system of record for now?

**Why this matters:** An alerting system that fires too often with low-signal alerts is arguably worse than a morning report — it trains people to ignore it. We need to understand the volume and signal-to-noise ratio before committing to a channel strategy.

**My current assumption:** Volume is manageable (under 30 alerts per day), alerts go to a dedicated Slack channel with email backup, and business-hours response is acceptable for MVP with a clear documented rationale for the FCA.

---

### 4. The Compliance Workflow After the Alert

The alert is only the trigger. The FCA will want to see a documented, auditable process from detection through to resolution.

**Questions:**
- What does "clears or escalates" look like today? Is there a documented triage procedure?
- When a compliance officer escalates to the MLRO, what information do they need? (Transaction details, customer risk profile, transaction history, PEP/sanctions screening results?)
- What's the SLA expectation for acknowledgement vs. resolution? (Alert fires → someone acknowledges within X minutes → resolution/escalation within Y hours?)
- Does the MLRO need a different view or different alert, or do they just get looped in on escalated cases?
- Where does the audit trail live? The FCA will want to see: when the breach occurred, when it was detected, when it was reviewed, what decision was made, and by whom.

**Why this matters:** If we build alerting but the downstream workflow is still informal (Slack messages, email threads, verbal escalations), the FCA will see a partially automated system with no audit trail. The alert pipeline and the case management / audit trail are equally important.

**My current assumption:** MVP needs at minimum a lightweight case log — even if it's a structured form or database entry — that captures timestamp of alert, timestamp of acknowledgement, reviewer identity, decision (clear/escalate/SAR), and rationale. This doesn't have to be a full case management system, but it can't just be Slack threads.

---

### 5. Failure Modes and Resilience

This is a compliance-critical system. "It was down and we didn't notice" is not an acceptable state.

**Questions:**
- What happens if the alerting system itself fails silently? Is there a monitoring-the-monitor mechanism?
- Should there be a daily reconciliation that compares "alerts fired" against "transactions that should have triggered alerts" as a safety net?
- What's the rollback plan if the system generates false positives at scale? (E.g., a bug flags every transaction as a breach — do you have a kill switch that reverts to the morning report process?)
- Who owns this system operationally? Is there an on-call engineering team, or does it need to be low-maintenance enough for a small compliance-tech function?

**Why this matters:** The FCA will ask about resilience and contingency. A system that works 95% of the time but fails silently the other 5% is a liability.

**My current assumption:** MVP includes a heartbeat monitor (alerts if the monitoring system itself hasn't run in X minutes) and a daily reconciliation report that the compliance team can eyeball alongside the legacy morning report during a transition period.

---

## Emerging Architecture (Conceptual, Not Prescriptive)

Based on assumptions so far:

```
[Transaction DB] 
       │
       ▼
[Listener/Poller] ── checks for new transactions every N seconds/minutes
       │               or listens to a change stream / event
       ▼
[Rule Engine] ── applies threshold logic (≥ £10,000, cash-equivalent type)
       │
       ▼
[Alert Dispatcher] ── sends to Slack channel + email
       │
       ▼
[Case Log] ── structured record: alert ID, timestamp, transaction details,
               assigned reviewer, acknowledgement time, decision, rationale
       │
       ▼
[Reconciliation Job] ── daily check: all qualifying transactions got alerts
       │
       ▼
[Heartbeat Monitor] ── alerts if the pipeline itself stops running
```

This is deliberately simple. The complexity is in getting the scoping decisions right, not in building a sophisticated system.

---

## Risks and Blockers I'd Want to Resolve This Week

| # | Risk / Blocker | Impact if Unresolved | Suggested Action |
|---|---|---|---|
| 1 | Transaction data isn't available in near-real-time (batch pipeline) | Entire approach needs rethinking; may need upstream work first | Confirm data availability with engineering — how and when do transactions become queryable? |
| 2 | "Cash equivalent" classification is unreliable in source data | False negatives (missed breaches) or false positives (noise) | Review data quality with 30 days of transaction data against known breaches |
| 3 | No clarity on structuring/aggregation expectations for FCA review | MVP ships but FCA flags a known gap | Get MLRO's read on what the FCA will specifically probe; scope Phase 2 explicitly |
| 4 | No audit trail mechanism exists | Alerting works but can't demonstrate compliance | Include lightweight case log in MVP scope, non-negotiable |
| 5 | Alert volume is higher than expected | Compliance team ignores alerts within 2 weeks | Pull 30 days of historical data to model expected alert volume before building |

---

## Recommended Next Steps

1. **Data availability confirmation** — Get a definitive answer from engineering on transaction data latency. This is the single biggest architectural dependency.

2. **Historical volume analysis** — Pull 30–60 days of transactions that would have triggered the £10,000 rule. Count them. This tells us whether the alert channel strategy is viable or whether we need filtering/tiering from day one.

3. **MLRO scoping conversation** — 30-minute session with the MLRO focused on: what will the FCA specifically ask about? Do they expect aggregation/structuring detection? What does the audit trail need to look like?

4. **Define the MVP case log** — Even a minimal spec: what fields, where it lives, who writes to it, who reads it. This is as important as the alerting itself.

5. **Agree the "monitoring the monitor" approach** — Heartbeat + daily reconciliation, or something else. Decide before build, not after first failure.

---

## What I'm Most Uncertain About

The thing that could most change the shape of this project is **whether the transaction data is actually available in near-real-time**. Everything above assumes it is. If it's not — if transactions arrive via batch files from a core banking system every 4 hours, for example — then the real project isn't "build an alerting system" but "re-engineer the transaction data pipeline," which is a fundamentally different scope, timeline, and cost.

The second uncertainty is **alert volume and signal quality**. If the historical analysis reveals 150+ threshold breaches per day, the MVP as described will fail not technically but operationally. We'd need to introduce risk-scoring or tiering before launch, which adds meaningful complexity.

I'd want both of these resolved before writing a line of code.