# Discovery: Real-Time AML Transaction Monitoring Alerts

## My read of the problem

Before diving in, let me surface what I'm actually seeing here — because the stated MVP and the real risk may not be perfectly aligned.

**The stated problem:** Slow detection of threshold breaches.
**The underlying problem:** Regulatory exposure and potential missed SAR obligations during detection lag.

These have different implications for what "done" looks like. A 15-minute alert that then sits unacknowledged for 2 hours doesn't meaningfully reduce your risk. So the solution needs to cover the full loop: detect → notify → acknowledge → decision → audit trail. I'll flag where this matters as we go.

---

## What I need to understand better

I have questions across a few dimensions. Some are blockers; others will shape the right approach.

### 1. Data & transaction pipeline

- Where do transactions live when they're first recorded? (Core banking system, payment processor, ledger service — and what's the latency between a transaction occurring and it hitting that system?)
- Is there already a message queue or event stream (Kafka, SQS, etc.) on transaction events, or is the current report pulling from a batch database query?
- What does "cash equivalents" mean in your system — is that a field, a transaction type code, a combination of conditions? Who owns that business logic today?
- Are we talking about single transactions over £10k, or do you also need to catch structured transactions (multiple smaller transactions that together breach the threshold — i.e., smurfing patterns)?

> ⚠️ **Important distinction:** If the FCA expectation includes structuring detection, a simple threshold trigger isn't sufficient and the MVP scope needs to expand or be explicitly deferred with a documented rationale.

### 2. Alert delivery

- Does your organisation already have a Slack integration for operational alerts, or does this need to be provisioned?
- Is there an email relay/SMTP service available, or would this go through something like SendGrid/SES?
- Who specifically receives the alert — a shared compliance channel, individual officers on a rota, or both?
- What happens out of hours? Is someone on call, or does this genuinely only need to cover business hours?

### 3. Acknowledge & decision workflow

This is the part that's often underspecified in MVPs and then causes problems:

- When a compliance officer receives an alert, what do they need to do? Presumably: review the transaction, decide whether to escalate to the MLRO for SAR consideration, and record that decision somewhere.
- Where does that decision get recorded today? (Spreadsheet, case management system, email thread?)
- Does the MLRO need to be notified differently — e.g., a separate higher-priority channel — when something is escalated versus when it's cleared?
- What's the expected decision turnaround time once alerted? This affects whether you need acknowledgement tracking and escalation chasing.

### 4. Audit trail & evidential requirements

- The FCA will want to see not just that alerts fired, but that they were acted on. Is there an existing compliance case management tool (Actimize, NICE, a homegrown system) that alerts need to feed into, or will this system need to be the record of action?
- Do alerts and their resolution need to be retained, and for how long? (POCA and FCA record-keeping rules likely apply here.)
- Who is the authoritative owner of the audit log — compliance, risk, or engineering?

### 5. False positive tolerance

- At current transaction volumes, roughly how many transactions per day breach £10k? (This affects alert fatigue risk significantly.)
- Has your team experienced alert fatigue from other monitoring systems? This shapes how much context needs to be in the alert itself.
- Is there a whitelist of known entities (large corporate clients, interbank transfers) where a breach is expected and low-risk? If so, does the MVP need to respect that, or is flagging everything and letting compliance filter acceptable for now?

---

## Assumptions I'm making (challenge these)

| Assumption | Why it matters |
|---|---|
| Transactions enter a system of record with low latency (seconds to low minutes) | If batch ingestion only runs hourly, near-real-time alerting requires upstream work first |
| The £10k threshold is the only trigger for MVP | Structuring and velocity patterns are out of scope for now but need a documented deferral |
| Compliance officers are available during business hours to action alerts | Out-of-hours coverage needs an explicit decision, not a silent gap |
| Slack + email is sufficient for the audit trail required | If the FCA expects a dedicated compliance system of record, this may not hold |
| Engineering has access to the transaction data stream or can create one | If this requires procurement or core banking vendor engagement, timeline shifts significantly |

---

## Risk flags worth naming explicitly

**1. The 15-minute SLA is an engineering SLA, not a compliance SLA.**
Detecting in 15 minutes is necessary but not sufficient. If the FCA asks "what happened with this breach," they'll want to see the full chain. Build the audit trail into MVP scope, not a follow-on.

**2. Slack is not a compliance system of record.**
Slack messages can be deleted, edited, or lost in channel noise. If Slack is the *only* place alerts and decisions live, that's a problem. The alert can go to Slack; the decision needs to land somewhere with integrity guarantees.

**3. Alert fatigue is a real failure mode.**
If compliance officers get 40 alerts a day and 38 are low-risk corporate transactions, they'll start ignoring them. That's worse than the current state in some ways. Volume estimate and whitelist logic matter.

**4. Out-of-hours is a gap that needs an explicit decision.**
A transaction breaching threshold at 11pm on a Friday and being actioned at 9am Monday is still 58 hours of lag. Does the MVP scope need to address this, or is it out of scope with a documented rationale accepted by the MLRO?

---

## A proposed scope breakdown

Given the Q4 FCA review, here's how I'd think about sequencing:

### Must-have for FCA demonstrability
- Real-time trigger on transaction breach (≤15 min from transaction event to alert)
- Alert to Slack (compliance channel) + email
- Alert contains: transaction ID, amount, entity, timestamp, and a direct link to review
- Acknowledgement mechanism — compliance officer can mark alert as "reviewed: cleared" or "reviewed: escalated"
- Durable log of every alert fired + its resolution, queryable and exportable
- MLRO escalation path (separate notification when escalated)

### Should-have but can be sprint 2
- Whitelist/suppression rules for known low-risk entities
- Out-of-hours escalation (e.g., on-call pager or SMS)
- Dashboard showing open/cleared/escalated alerts and mean time to acknowledge

### Explicitly out of scope for now (needs documented deferral)
- Structuring / smurfing detection
- Automated SAR pre-population
- Integration with external case management platforms

---

## What I'd suggest as next steps

1. **Answer the data pipeline question first.** Everything else depends on whether you have a real-time event stream or need to build one. This is likely the longest lead-time item.

2. **Get the MLRO's input on the audit trail requirement** before committing to architecture. They may have a strong view on where decisions need to be recorded.

3. **Get a transaction volume estimate** from the risk team so you can model alert volume and decide whether whitelist logic is MVP or not.

4. **Make the out-of-hours decision explicitly** at the MLRO level — this is a policy decision, not an engineering one, and it shouldn't default by omission.

5. **Document what's deferred and why** — for the FCA review, a clear scope rationale is nearly as valuable as the working system.

---

What would be most useful to go deeper on — the technical architecture, the alerting workflow design, or the audit/compliance trail requirements?