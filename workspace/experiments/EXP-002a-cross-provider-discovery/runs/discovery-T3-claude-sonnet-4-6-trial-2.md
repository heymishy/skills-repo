# Discovery: Real-Time AML Transaction Monitoring Alerts

## What I'm Working With

Before diving in, let me surface what I'm treating as **given** versus what needs validation — because the gap between these will determine whether this MVP succeeds or creates new problems.

---

## Problem Framing

### The Stated Problem
Detection lag: threshold breaches sit undetected for 18+ hours when the regulatory expectation is near-real-time.

### What's Actually Underneath That

The morning report isn't just slow — it's a **pull model** sitting on top of what is almost certainly a **push-capable data pipeline**. The transactions are being recorded in real time. The monitoring isn't. That's an architectural gap, not a data gap.

This matters because it means the fix is probably **not** "build something complex." It's "add an event trigger at the right point in an existing flow." The risk is over-engineering when the real need is a well-placed hook with reliable alerting.

---

## Stakeholder Analysis

| Stakeholder | Their actual problem | What could go wrong for them |
|---|---|---|
| **Compliance Officers** | Alert fatigue from false positives, or — worse — alert blindness | If every cash-equivalent spike triggers a Slack ping, they'll start ignoring them |
| **MLRO** | SAR filing window. Under POCA 2002 they have a 7-day consent window once suspicious activity is known. Detection lag compresses that window | If the alert fires but the escalation path is unclear, the MLRO is still exposed |
| **Risk Team** | The firm's exposure during detection lag, plus audit trail proving when detection occurred | A Slack message is not an audit trail |

**Critical observation:** The MLRO's exposure isn't just operational — it's legal. If a SAR should have been filed and wasn't because detection was slow, that's personal criminal liability territory. This elevates the stakes beyond an internal tooling improvement.

---

## Assumptions That Need to Be Tested

These are things being treated as true in the MVP framing that could break the solution:

### Assumption 1: £10,000 is a single-transaction threshold
**The risk:** Structuring. Bad actors deliberately break transactions into sub-£10,000 amounts (smurfing). If your MVP *only* catches single transactions over £10k, it may clear the FCA checkbox while missing the actual risk pattern.

**What to validate:** Does the FCA review expect only single-transaction monitoring, or will they ask about aggregate/structuring detection? Check your firm's existing AML policy — it almost certainly references structuring.

### Assumption 2: "Cash equivalents" is well-defined in your system
**The risk:** This term is doing a lot of work. Does your transaction data have a reliable field that flags cash equivalents? Or does a compliance officer currently make that judgment when reviewing the morning report?

**What to validate:** Pull the last 10 flagged transactions from the morning report. Can you write a SQL WHERE clause that would have caught all of them? If you need human judgment to classify them, the alerting system needs that logic codified first — or it will produce false negatives.

### Assumption 3: Slack + email is sufficient as an alert channel
**The risk:** Slack messages get lost. Email gets filtered. Neither provides guaranteed delivery confirmation, read receipts, or escalation on non-response.

**Harder question:** What happens if a breach fires at 11pm on a Friday and the Slack notification is not seen until Monday? You've improved from 18 hours to potentially longer. The channel choice matters less than the **escalation logic** on non-acknowledgement.

### Assumption 4: The alert is the intervention
**The risk:** An alert without a defined workflow is noise. Right now compliance officers have a morning report — they know what to do with it. An alert at 2pm on a Tuesday requires a defined response: who reviews it, what are they deciding, what does "clear" mean vs "escalate," and where is that decision recorded?

---

## Scope Risks in the MVP

### What's in scope and feels straightforward
- Detecting transactions > £10,000 at point of processing
- Sending a notification to a Slack channel and email
- Logging that the alert fired

### What's not in scope but will be asked about immediately
- **Acknowledgement tracking:** Did a compliance officer see this alert?
- **Decision recording:** Did they clear it, and why? Did they escalate?
- **Audit trail:** The FCA will want to see not just that you detected the breach, but what happened next and when
- **Duplicate suppression:** If the same transaction triggers multiple events in your pipeline, do you send five Slack messages?
- **Out-of-hours coverage:** Who is on call? Is there one?

I'd argue acknowledgement tracking and decision recording are **not** post-MVP nice-to-haves. They're what transforms this from "we send a Slack message" into "we have demonstrable near-real-time monitoring" — which is the FCA's actual bar.

---

## Technical Questions to Answer Before Building

**1. Where in the transaction lifecycle does detection need to happen?**
Options with different implications:
- At transaction *submission* — you can potentially block or hold the transaction
- At transaction *processing/settlement* — real-time but post-fact
- At transaction *recording to ledger* — potentially seconds to minutes of lag depending on batch size

Which one you choose determines whether this is a pre-transaction control or a post-transaction alert. The FCA distinction matters.

**2. What is your transaction data source?**
- Core banking system with a webhook/event stream? → Relatively clean integration
- Database that gets written to by a batch process? → You need to decide whether to poll (adds latency) or change the upstream process
- Third-party payments processor? → You're dependent on their event model

**3. What's your current false positive rate on the morning report?**
If compliance officers currently see 50 flagged transactions per morning and 48 of them are cleared in under 2 minutes, real-time alerting will generate 50 Slack messages per day. That's a morale and attention problem within a week.

---

## Recommended MVP Scope (Revised)

Based on the above, I'd reframe the MVP as having two layers:

### Layer 1 — Detection & Notification (your stated MVP)
- Event-driven trigger when a transaction meeting the cash-equivalent criteria exceeds £10,000
- Deduplicated alert to a dedicated `#aml-alerts` Slack channel with structured message (transaction ID, amount, entity, timestamp, link to record)
- Parallel email to a monitored compliance inbox
- Immutable log entry recording: alert fired, timestamp, transaction ID

**Target:** Alert fires within 2 minutes of transaction event. This gives you headroom against the 15-minute success metric.

### Layer 2 — Response & Audit Trail (add this before the FCA review)
- Slack alert includes "Acknowledge / Escalate to MLRO / Clear with reason" action buttons (Slack Block Kit supports this natively)
- Response recorded to a case management log with timestamp and officer ID
- If no acknowledgement within 30 minutes, escalation fires to MLRO directly
- Weekly summary report auto-generated for compliance record-keeping

Layer 2 is what makes this **demonstrable** to the FCA rather than just operational for your team.

---

## Questions You Need to Answer Before Sprint 1

I'd want these answered before committing to a delivery timeline:

1. **Where does the transaction event first become available in your systems, and in what form?** (API event, database write, message queue?)

2. **Who owns the definition of "cash equivalent" in your data model?** Is it a transaction type code, a field flag, a combination of fields, or is it currently a human judgment?

3. **What is the expected daily volume of transactions that breach £10,000?** (Order of magnitude — tens, hundreds, thousands?)

4. **Is there an existing case management or incident tracking system** that the compliance team uses, or does everything currently live in the morning report spreadsheet/dashboard?

5. **What's the on-call arrangement for compliance outside business hours?** The FCA's "near-real-time" expectation does not have business hours.

6. **Has the MLRO reviewed and approved the escalation path in the proposed workflow?** Their sign-off on the design is itself a risk control.

---

## What Good Looks Like for the FCA Review

From a regulatory demonstrability standpoint, you want to be able to show:

- A transaction occurred → alert fired within X minutes (with timestamps proving it)
- Alert was received and acknowledged by a named compliance officer at Y time
- Officer made a documented decision: cleared (reason) or escalated to MLRO
- If escalated: SAR filing decision made within Z timeframe
- End-to-end audit trail is queryable and exportable

"We send a Slack message" is a start. "Here is the complete detection-to-decision audit trail for every threshold breach in the last 90 days" is what passes a review.

---

## Suggested Next Steps

| Action | Owner | Why |
|---|---|---|
| Map the transaction event lifecycle — identify the earliest reliable detection point | Engineering + Compliance | Determines feasibility of 15-min target |
| Codify the "cash equivalent" classification logic | Compliance + Engineering | Without this, alerting has unknown false positive/negative rates |
| MLRO review of proposed escalation path and out-of-hours coverage | MLRO + Compliance lead | Legal exposure mitigation; their sign-off is itself a control |
| Spike: can your current data pipeline support event-driven triggers without architectural changes? | Engineering | Scope and timeline risk |
| Review FCA expectations document / your last supervisory letter | Compliance lead | Validate that single-transaction threshold monitoring is sufficient or if structuring detection will be asked about |

---

## Bottom Line

The core ask is achievable and probably not technically complex. The risk is building something that looks like monitoring but fails under FCA scrutiny because the audit trail is thin or the escalation path is undefined.

The 15-minute detection target is the easy part. The harder question is: **15 minutes to detection, then what?** Answer that before you write the first line of code.