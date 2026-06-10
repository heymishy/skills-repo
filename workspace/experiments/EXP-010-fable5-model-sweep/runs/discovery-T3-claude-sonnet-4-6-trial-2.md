# Discovery: Real-Time AML Transaction Monitoring Alerts

## My read of the problem

Before jumping to solutions, let me surface what I'm seeing — including some things worth pressure-testing.

**The stated problem:** No real-time alerting means threshold breaches sit undetected for 18+ hours.

**The deeper problem:** Your compliance posture has a systematic detection gap that creates regulatory exposure *and* genuine money laundering risk. The manual morning report is a process designed for a different era of transaction volume and regulatory expectation.

**What I'd want to validate before building:**

> Is £10,000 the right threshold, or just the current one? UK AML regulations require monitoring of *suspicious* activity, not just threshold breaches. A real-time alert on a single threshold might solve the FCA optics problem without meaningfully improving AML effectiveness. Worth confirming with your MLRO whether the detection logic should be richer from day one, or whether a clean threshold alert genuinely covers the regulatory exposure you're worried about.

---

## Problem decomposition

### The alert pipeline has four distinct components — they fail independently

```
Transaction occurs
       ↓
[1] DETECTION    — does the system see the breach?
       ↓
[2] ROUTING      — does the right person get notified?
       ↓
[3] ACTION       — does the compliance officer act within SLA?
       ↓
[4] AUDIT TRAIL  — is the response documented for FCA evidence?
```

Your current gap is primarily at **[1]** — detection is delayed 18+ hours. But if you fix [1] without addressing [3] and [4], you've improved alerting without improving *outcomes*. The FCA will want to see the full loop closed.

**Key question for your MLRO:** What happened in those two near-misses? Did detection fail, or did detection succeed but action fail? The answer changes the design.

---

## Stakeholder map and what each one actually needs

| Stakeholder | Their real concern | What they need from this system | Risk if unmet |
|---|---|---|---|
| **Compliance officer** | Alert fatigue + false positives wasting time | Actionable alerts with enough context to triage *in the notification itself* | They start ignoring alerts |
| **MLRO** | SAR filing deadlines + personal liability | Clear escalation path from alert → SAR decision, with timestamps | Regulatory breach, personal liability |
| **Risk team** | Exposure window quantification | Metrics: how long between transaction and alert, alert and action | Can't evidence improvement to FCA |
| **FCA (Q4 review)** | Demonstrable, auditable near-real-time monitoring | Evidence of detection < 15 min *and* documented response workflow | Enforcement action |

**The stakeholder I'd add to your list:** whoever owns the transaction data source. If the data pipeline to your detection layer has its own latency, a real-time alerting system built on top won't hit your 15-minute target. This is a common failure mode.

---

## Assumptions worth stress-testing

These are things your framing implies but doesn't confirm. I'd want each one answered before writing a spec.

**1. "Real-time" means the transaction data is available in real-time**
> *Assumption:* Your core banking or payments system emits transaction events that can be consumed immediately.
> *Risk:* Many legacy systems batch-process transactions or have internal settlement delays. If your data arrives hourly, alerting infrastructure won't fix the latency.
> *Validate by:* Asking engineering how transaction data currently reaches the morning report. Is it a batch ETL job? An event stream? An API poll?

**2. £10,000 cash equivalents is clearly defined and consistently applied**
> *Assumption:* Everyone agrees what counts as a "cash equivalent" for this threshold.
> *Risk:* If the definition is ambiguous or applied inconsistently across transaction types, real-time alerting will either miss breaches or generate noise that erodes trust in the system.
> *Validate by:* Walking through three edge cases with the MLRO — crypto conversions, structured payments just under threshold, FX transactions.

**3. Slack and email are appropriate alert channels**
> *Assumption:* Compliance officers are reliably monitoring Slack during working hours.
> *Risk 1:* What happens outside working hours? Does a breach at 11pm wait until the 9am Slack check?
> *Risk 2:* Slack is not an auditable system of record. Using it as the primary alert mechanism may satisfy the spirit of "real-time" but not the letter of FCA evidence requirements.
> *Consider:* Whether alerts need to be logged in a system your MLRO controls, separate from delivery channels.

**4. A single threshold alert is the right detection logic**
> *Assumption:* Flagging transactions > £10,000 is both necessary and sufficient.
> *Risk:* Structuring — deliberately splitting transactions to stay under threshold — is a primary AML evasion technique and won't be caught by single-transaction monitoring.
> *This isn't necessarily an MVP blocker*, but your MLRO should explicitly sign off that structuring detection is out of scope for now, so that's documented.

**5. The compliance officer workflow after receiving an alert is defined**
> *Assumption:* Once alerted, officers know exactly what to do.
> *Risk:* If the alert arrives but the "clear or escalate" workflow is informal or undocumented, the FCA will find the gap at Q4. The alert is evidence you detected — the documented response is evidence you acted.

---

## What "under 15 minutes" actually requires — the latency budget

If your target is breach-to-alert in under 15 minutes, you need to understand where time is spent:

```
Transaction event created in source system
    ↓  [Data propagation latency — could be seconds or hours]
Transaction visible to detection layer
    ↓  [Detection processing — should be near-instant if streaming]
Threshold evaluation runs
    ↓  [Alert generation]
Alert delivered to Slack/email
    ↓  [Notification delivery — typically <1 min]
Compliance officer sees alert
```

**The only part you fully control is the middle section.** The first step — data propagation — is the most common place this breaks down. I'd recommend mapping this end-to-end with engineering before committing to the 15-minute SLA.

---

## MVP scope recommendation

Here's how I'd frame the MVP, with one addition to your framing:

### In scope
- Real-time evaluation of transactions against £10,000 threshold as events occur
- Alert delivery to compliance officer via Slack + email within 5 minutes of event (giving headroom on the 15-minute target)
- Alert contains: transaction ID, amount, account, timestamp, and a direct link to the transaction record
- All alerts logged to an auditable record (not just Slack) with delivered/acknowledged status
- Compliance officer can mark alert as "reviewed — cleared" or "reviewed — escalated" and that action is timestamped

### Explicitly out of scope for MVP (document this)
- Structuring / aggregation detection
- Automated SAR drafting
- Risk scoring or ML-based anomaly detection
- Alerts for transactions below threshold flagged on other grounds

### The thing I'd add to your MVP
A **15-minute SLA breach escalation**: if an alert hasn't been acknowledged within 15 minutes, it automatically escalates to the MLRO. Without this, you've solved detection latency but created a new gap — alert acknowledgment latency. The FCA will ask "what if the compliance officer misses the Slack message?"

---

## Questions I'd bring to your next stakeholder session

**For the MLRO:**
1. In the two near-misses, was the failure in detection or in response after detection?
2. What's your current documented procedure for responding to a threshold alert? If we automate detection, what does the written workflow look like for the compliance officer?
3. Are you comfortable with structuring detection being explicitly out of scope for the Q4 review?
4. What system of record should alert acknowledgments be logged in? (For FCA evidence purposes)

**For engineering / data team:**
1. How does transaction data currently reach the morning report — is it a batch job, an event stream, or an API?
2. What's the realistic latency from a transaction occurring to it being queryable in the data layer?
3. Do we have existing event streaming infrastructure (Kafka, SNS, etc.) or are we building from scratch?

**For compliance officers:**
1. How many threshold breach alerts would you expect per day on average? (Alert volume shapes whether Slack is viable or whether you need a triage queue)
2. What information do you need *in the alert itself* to make a triage decision without clicking through to another system?
3. Are you monitoring Slack outside of 9–5? What's the expectation for out-of-hours alerts?

---

## Risks to name explicitly

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Source data has batch latency that makes 15-min target impossible | Medium | High | Validate data pipeline latency before committing to SLA |
| Alert fatigue leads to compliance officers treating alerts as noise | Medium | High | Track acknowledgment rates; set a false positive budget |
| Slack used as system of record but isn't auditable | High | High | Log all alerts + responses to a durable, auditable store from day one |
| FCA Q4 review asks about structuring detection | Medium | Medium | Get MLRO sign-off that it's explicitly deferred, documented |
| Out-of-hours breach sits unacknowledged | High | High | Build escalation logic into MVP, not v2 |

---

## What I'd recommend as the next step

**Don't start with the alerting infrastructure.**

Start with a **data pipeline audit** — specifically, answer "how long does it currently take from a transaction occurring to it appearing in the morning report?" If that answer is "2 hours because of batch ETL," your first workstream is fixing the data pipeline, not building alert delivery.

Then run a **one-week manual simulation**: configure a real-time query against your transaction data (even a simple dashboard someone checks), and measure how many threshold breaches occur and what the manual-near-real-time detection rate looks like. This gives you baseline data for the FCA review and validates your threshold definition before you automate it.

The automated alerting infrastructure is then the third step — and by that point you'll have answered most of the open questions above.

---

*What would be most useful to go deeper on? I can draft the stakeholder interview questions in a format ready to use, map the technical architecture options for the detection pipeline, or sketch the compliance officer workflow that the FCA will want to see documented.*