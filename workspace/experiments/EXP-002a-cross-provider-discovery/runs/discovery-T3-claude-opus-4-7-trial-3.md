I'll work through the discovery pipeline with you. Let me start by reflecting back what I'm hearing and then probe the areas that look thin.

## What I'm hearing

- **Problem:** Detection lag on AML threshold breaches (18+ hours → target <15 min)
- **Driver:** FCA review in Q4, two recent near-misses
- **MVP:** Real-time alerts to Slack + email when £10k threshold breached
- **Users:** Compliance officers (triage), MLRO (escalation), risk team (exposure)

That's a clear, well-scoped problem. Before we commit to the MVP shape, I want to push on a few things.

---

## Questions I'd want answered before building

### 1. Is "threshold breach" actually the right detection signal?
£10k cash-equivalent is one trigger, but AML monitoring typically also cares about:
- **Structuring** (multiple sub-threshold transactions, e.g. 3× £3,500 in a day from the same account)
- **Velocity anomalies** (unusual frequency)
- **Counterparty risk** (sanctioned/PEP exposure)

If the FCA review will look at your monitoring holistically, shipping only single-transaction threshold alerts might solve the symptom (the two near-misses) but leave you exposed on structuring. **Is structuring in scope or explicitly deferred?** Worth naming this out loud either way.

### 2. What's the expected alert volume?
At £10k threshold, how many transactions per day do you expect to trigger? This matters because:
- **Low volume (5-20/day):** Slack + email is fine, manual review works
- **High volume (100+/day):** You'll get alert fatigue fast, compliance officers will start ignoring them, and you've recreated the original problem in a new shape

Do you have data on how many transactions *would* have triggered over the last 90 days?

### 3. What does "cleared or escalated" actually mean operationally?
The MVP says compliance reviews and clears/escalates. But:
- What's the SLA for review? (If detection is <15 min but review takes 6 hours, the end-to-end risk window hasn't really shrunk much)
- What happens to the audit trail? FCA will want to see *who reviewed what, when, and why they cleared it*
- Slack messages are ephemeral and hard to audit. Is there a case management system the alert needs to write into?

### 4. What's the failure mode if alerting breaks?
If the Slack integration goes down at 2am, do breaches go undetected again? You need:
- A heartbeat / "alerting is alive" signal
- A fallback (does the morning report still run as a backstop?)
- Monitoring of the monitor

The FCA will ask about this.

### 5. Who owns the alert when it fires?
Slack channels can become "everyone's problem = no one's problem." Is there a rota? Primary/secondary on-call for compliance?

---

## What I'd suggest tightening in the MVP definition

**Current:** "Real-time alerting to the compliance team when a transaction breaches the £10,000 threshold."

**Sharper version to consider:**
- **In scope:** Single-transaction cash-equivalent breach ≥£10k, alert within 15 min via Slack + email to compliance rota, written to audit log with reviewer/decision/timestamp, fallback to existing morning report if alerting fails.
- **Explicitly out of scope (for now):** Structuring detection, counterparty/PEP screening, velocity anomalies, automated SAR drafting.
- **Success metric:** 95% of breaches detected and acknowledged within 15 min, 100% auditable, zero missed breaches verified against morning report reconciliation for first 30 days.

The "reconciliation against the morning report" is important — it gives you evidence for the FCA that the new system catches everything the old one did, plus faster.

---

## My honest take

The MVP as scoped will likely satisfy the immediate near-miss problem and demonstrate progress to the FCA, but if structuring is a real risk in your transaction profile, shipping threshold-only alerts could create false confidence. I'd want a clear answer on Q1 (structuring) and Q2 (volume) before locking scope.

**Which of these would you like to dig into first?** Or if you've already got answers to some, share them and we'll move forward.