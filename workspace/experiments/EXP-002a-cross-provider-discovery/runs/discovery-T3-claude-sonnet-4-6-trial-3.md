# Discovery: AML Threshold Breach Alerting

## What I'm working with

Let me reflect back what I'm hearing before going deeper, because precision matters here.

**The core problem:** You have detection capability but no alerting loop. Transactions are being flagged in a report, but reports require a human to go looking. The gap isn't in your rules logic — it's in the signal-to-person pipeline.

**The real risk:** It's not just the 18-hour lag itself. It's that during that window, a reportable transaction could age past the point where a SAR filing looks timely, or a customer relationship continues uninterrupted that should have been reviewed. The FCA concern isn't just operational — it touches on whether your SAR obligations are being met in practice.

**What you've defined as MVP:** Narrow and sensible. Threshold breach → alert fires → compliance officer acts. You're not trying to solve behavioural analytics or network-of-transactions risk in this pass.

---

## What I'd want to pressure-test

Before we go further, a few things I'd want to understand — some of these you may already have answers to, others are genuine open questions that will shape architecture and approach significantly.

---

### 1. Where does the breach detection currently happen?

This is the most important technical question. Options are roughly:

- **At ingestion** — a service or queue that processes transactions as they arrive and already applies the £10k rule
- **In a database/data warehouse** — transactions land in storage and the morning report is a scheduled query
- **In a third-party system** — a vendor platform that generates the report and you're consuming its output

The reason this matters: if detection already happens in near-real-time but you're only reading the output at batch time, the fix is almost trivial (trigger an alert when the flag is written). If detection *is* the batch query, you need to either move the detection earlier or run the detection more frequently — different problems.

**Do you know which of these is closest to your current state?**

---

### 2. What does "cash equivalents" cover in your current rule?

The £10k threshold sounds simple but implementation usually isn't. I want to understand:

- Is this a single-transaction threshold, or do you aggregate structuring patterns (e.g. three £4k transactions from the same customer in 24 hours)?
- Does it apply per-account, per-customer, per-counterparty, or per-transaction-ID?
- Are there currency conversion implications — do FX transactions get converted to GBP at point of detection?

This matters because if your MVP alert fires on the same logic as your current report, we just need to move when that logic runs. If there are edge cases in the current rule that produce false negatives, those become your problem to inherit.

---

### 3. What does "review and clear or escalate" look like today?

When a compliance officer sees the morning report, what do they actually do? I'm asking because:

- If the alert fires in Slack at 2am, does anyone action it, or does it wait until morning anyway?
- Is there a case management system where reviews are recorded, or is this currently email + spreadsheet?
- What does "escalate" mean in practice — is there a formal workflow to the MLRO, or is it a phone call?

**This shapes whether you need just an alert, or an alert plus a lightweight triage interface.** If the alert fires but there's no structured way to record "officer X reviewed this at 14:32 and determined Y," you may have improved detection time but still have an audit trail problem.

---

### 4. Coverage hours and on-call expectations

You want detection under 15 minutes. Detection by whom, at what hours?

- Do you have compliance officers available 24/7 or is this a business-hours operation?
- If a breach fires at 11pm on a Friday, what's the expected response path?
- Is the MLRO on-call, or does after-hours breach handling have a defined escalation path?

The FCA's "near-real-time" expectation doesn't necessarily mean 24/7 human response, but you should have a clear answer for what happens outside business hours. If the answer is currently "nothing," that's worth surfacing now rather than during the Q4 review.

---

### 5. Volume

Roughly how many transactions breach the £10k threshold per day/week? This affects:

- Alert fatigue risk (if it's 50 a day, Slack becomes noise very quickly)
- Whether you need deduplication logic (does one transaction generate one alert, or could the same breach surface multiple times?)
- Whether the compliance team can realistically handle real-time review or whether you're creating a new bottleneck

---

## What I think the shape of a good MVP looks like

Based on what you've told me, here's the logical structure I'd work toward — subject to the answers above:

```
Transaction occurs
      ↓
Detection logic runs (ideally at ingestion, not batch)
      ↓
Breach identified → event emitted
      ↓
Alert service receives event
      ↓
Notification sent: Slack (channel) + email (individual/group)
      ↓
Compliance officer opens alert → reviews transaction
      ↓
Records outcome: cleared / escalated to MLRO
      ↓
Audit log written (who reviewed, when, what decision)
```

The piece I'd push on is that last step. **The alert alone is probably not enough for the FCA.** They'll want to see not just that you detected it quickly, but that you have evidence of what happened next. A review record attached to each alert — even a simple one — is what turns "we alert" into "we have a defensible compliance process."

---

## My honest read on scope

You've framed this as a small MVP and I think that instinct is right. But there are two things I'd encourage you not to treat as out of scope for even the first version:

**Audit trail:** Every alert should generate a record. Who was notified, when, what they decided. Without this, you can demonstrate detection speed to the FCA but not control quality.

**Suppression / acknowledgement:** Without a way for an officer to mark an alert as "reviewed," you have no signal on whether alerts are being acted on vs. ignored. You also risk Slack becoming unusable if volume is non-trivial.

These aren't big features. They could be as simple as a Slack button that writes a row to a database. But they're the difference between a system and a notification.

---

## What I'd suggest as next steps

1. **Answer the detection location question** — this determines your technical approach more than anything else
2. **Get a number on breach volume** — this determines whether simple alerting is sufficient or whether you need a triage queue
3. **Define out-of-hours policy** — even a written decision ("out of hours breaches are reviewed first thing next morning, MLRO notified if > £X") gives you something defensible
4. **Confirm the audit trail requirement** — ideally with input from the MLRO, who will know what the FCA will actually ask for

---

What can you tell me about where detection currently sits — the report generation mechanism? That's the most load-bearing unknown right now.