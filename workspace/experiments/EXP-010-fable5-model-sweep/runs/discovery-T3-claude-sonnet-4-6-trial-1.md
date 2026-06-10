# Discovery: AML Transaction Monitoring Alerts

## What I'm working with

You have a clear regulatory driver, a concrete success metric, and a well-scoped MVP. This is a good foundation. Before moving to solution design, I want to surface the assumptions and risks that typically derail projects like this — because the gap between "alert fires" and "alert is useful and defensible to the FCA" is where complexity hides.

---

## What you've stated clearly ✓

| Element | Status |
|---|---|
| Threshold rule | £10,000 cash equivalents |
| Success metric | Detection < 15 minutes |
| Alert channels | Slack + email |
| Primary users | Compliance officers, MLRO |
| Deadline driver | Q4 FCA review |
| Current baseline | 18+ hours (morning batch report) |

---

## Critical questions before building anything

### 1. Data — where does the transaction event actually live?

This is the most common place projects stall.

- What system records the transaction? (Core banking? A payments processor? Multiple sources?)
- Is there an existing event stream (Kafka, webhook, CDC feed) or does detection require polling a database?
- **Polling introduces lag.** If you poll every 5 minutes, your worst-case detection is already 5 minutes before any processing time. What polling frequency is technically feasible?
- Do transactions appear in one place atomically, or do components settle asynchronously (e.g. transaction posted before amount confirmed)?

> **Risk flag:** If your answer is "we'll query the reporting database," you need to know its replication lag from the operational system. Reporting DBs are often 15–30 minutes behind. That alone could blow your 15-minute SLA before you write a line of code.

---

### 2. What exactly is "cash equivalent"?

The rule sounds simple. It usually isn't.

- Is this a single-field flag on the transaction record, or does your system classify transaction types and you need to map them?
- Does the £10,000 rule apply per-transaction, or do you need to aggregate (e.g. three £4,000 cash deposits in a day = structuring risk)?
- Foreign currency: a €11,500 transaction — does your system convert at point of transaction, or do you need to apply a rate?
- Joint accounts, business accounts — any scoping differences?

> **Why this matters now:** If "cash equivalent" requires joins across multiple tables or a classification lookup, a simple threshold check becomes a mini-data-pipeline. Scope creep happens here quietly.

---

### 3. Alert quality — false positive rate

- In the last 90 days, how many transactions exceeded £10,000 in cash equivalents per day on average?
- If that number is high (say, 50+ per day), you may be building a system that immediately overwhelms compliance officers with alerts, causing alert fatigue — which is a different version of the same problem.
- Do you want **every** breach to alert, or only unreviewed/novel ones? (Is there a whitelist of known high-volume clients, treasury operations, interbank transfers?)

> **This is worth resolving in discovery, not post-launch.** An FCA reviewer will ask whether your alert system is calibrated, not just whether it fires.

---

### 4. The workflow after the alert

You've described: *compliance officer reviews and clears or escalates.* This needs more definition before you build.

- Where does the officer record their decision? Currently? In the MVP?
- If they escalate to the MLRO, what does that handoff look like — another Slack message? A formal case in a system?
- **The FCA will want an audit trail.** "We sent a Slack message" is not an audit trail. Do you have a case management system, or does the MVP need to include a lightweight acknowledgement + decision log?
- What happens if the compliance officer is unavailable? Is there an escalation path (deputy, on-call MLRO)?

> **Recommendation:** The alert is not the product. The alert + documented review outcome is the product. Design for the audit trail from day one, even if the MVP version is a simple Google Form or a database table with a timestamp and a dropdown.

---

### 5. Slack + email as alert channels — specific concerns

- **Slack:** Which workspace? Is this your internal corporate Slack or a separate compliance workspace? Who has access? Is Slack approved for handling potentially sensitive financial data in your information security policy?
- **Email:** To a shared mailbox or individual addresses? Shared mailbox is better for coverage; individual addresses create gaps when people are on leave.
- **Both channels simultaneously or Slack primary + email fallback?** Duplicate alerts can cause "someone else will handle it" diffusion of responsibility.
- Does your InfoSec/DPO need to sign off on transaction data (even partial — amount, account reference) flowing through Slack?

---

### 6. Regulatory defensibility of the MVP

The goal is a demonstrable system before Q4. Consider what "demonstrable" means to the FCA specifically.

- They will likely want to see: detection latency evidence, alert acknowledgement records, escalation to SAR filing where applicable, and evidence of calibration/tuning.
- A Slack alert with no downstream record may show *intent* but not *control effectiveness.*
- Is there an existing AML system (Actimize, NICE, Fintel, etc.) that you should be feeding into, rather than building a parallel alerting track?

---

## Risks to name explicitly

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Data source lag exceeds 15-min target regardless of alerting speed | Medium | High | Spike on data freshness before committing to SLA |
| False positive volume overwhelms compliance team | Medium | High | Audit last 90 days of data for breach frequency before go-live |
| No audit trail = FCA finding | High | High | Design acknowledgement logging into MVP scope |
| Slack/email approved channels question unresolved | Medium | Medium | InfoSec sign-off as a pre-build gate |
| "Cash equivalent" definition more complex than expected | Medium | Medium | Data modelling spike in week 1 |
| Alert goes to individual, individual is on leave | High | Medium | Shared channel/mailbox + on-call escalation path |

---

## What a well-shaped MVP actually includes

Based on the above, I'd reframe your MVP scope slightly:

**Core (must-have for FCA defensibility):**
1. Near-real-time detection engine polling/streaming transaction data
2. Threshold evaluation against the £10,000 cash equivalent rule (with explicit, documented definition of "cash equivalent")
3. Alert delivery to a shared compliance Slack channel and shared email mailbox
4. **Acknowledgement logging** — officer clicks/replies to confirm receipt and records outcome (clear / escalate to MLRO)
5. Basic dashboard or report showing: alert fired → acknowledged → outcome, with timestamps

**Out of scope for MVP (but document the gap):**
- Structuring / aggregation detection (multiple transactions summing to threshold)
- Automated SAR drafting
- Integration with existing AML case management (if any)
- ML-based risk scoring

---

## Recommended next steps

```
Week 1 — Spikes (resolve blockers before any build)
  ├── Data freshness spike: what is the actual lag from 
  │   transaction occurrence to query-able record?
  ├── Volume spike: how many qualifying transactions per day 
  │   in last 90 days? (sets false positive baseline)
  └── "Cash equivalent" definition: get sign-off from MLRO 
      on exact field/classification mapping

Week 1 — Decisions needed (not engineering decisions)
  ├── InfoSec sign-off on Slack/email for transaction data
  ├── Audit trail requirement: what format satisfies FCA? 
  │   (align with MLRO + legal/compliance)
  └── Escalation path design: who is on-call if primary 
      officer is unavailable?

Week 2 — Build (only after spikes resolve)
  ├── Detection engine + threshold rule
  ├── Alert delivery (Slack + email, shared channels)
  └── Acknowledgement + outcome logging (even if basic)

Week 3 — Testing
  ├── End-to-end latency test with production-like data
  ├── Simulate breach → alert → acknowledge → escalate flow
  └── Stress test: what happens at high alert volume?

Week 4 — Buffer + FCA preparation
  └── Evidence pack: latency measurements, test run logs, 
      decision audit trail examples
```

---

## The one question I'd prioritise above all others

**What is the actual data freshness of your transaction records, and can you measure it today?**

Everything else is solvable. If the data is 20 minutes stale before you even start processing, your 15-minute target is structurally impossible and you need to know that in week 1, not week 3.

---

*Want me to go deeper on any of these areas — for example, the audit trail design, the data pipeline architecture options, or how to frame the MVP evidence pack for the FCA review?*