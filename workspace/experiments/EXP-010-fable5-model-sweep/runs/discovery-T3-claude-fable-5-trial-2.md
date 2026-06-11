# Discovery Pipeline — Stage 1: Problem Framing

Thanks — this is a strong starting brief. Clear problem, named stakeholders, regulatory forcing function, and a measurable target. Before we lock the problem statement and move to solution shaping, I've structured what you've given me and flagged the gaps that need answers.

---

## Problem Statement (synthesised)

> Compliance officers detect AML threshold breaches (>£10,000 cash-equivalent transactions) via a manual next-morning report, creating an 18+ hour detection lag. Two near-misses in 90 days. The FCA expects near-real-time detection; a Q4 review makes this urgent. Target: detection-to-notification under 15 minutes.

**Severity signals:** 2 near-misses / 90 days, regulatory exposure, MLRO personal liability for SAR filing delays.

---

## What's solid

- ✅ Quantified pain (18h lag, 2 incidents)
- ✅ Hard deadline (Q4 FCA review)
- ✅ Measurable success metric (15-min detection)
- ✅ Identified user (compliance officer as alert recipient and triage owner)

---

## Assumptions I need you to validate

**A1. Single-transaction threshold is sufficient for the MVP.**
The £10k flag catches single breaches — but the classic evasion pattern is *structuring* (multiple sub-threshold transactions). Is structuring detection explicitly **out of scope** for MVP, and will the FCA accept that for Q4? This is the biggest scope question.

**A2. Source data is available in near-real-time.**
The 15-minute target assumes transaction data reaches the monitoring layer within minutes. What's the current latency from the core banking/payments system? If transactions batch hourly upstream, no alerting layer can hit 15 minutes.

**A3. Slack is an acceptable channel for this data.**
Alerts will presumably contain customer/transaction details. Has InfoSec/DPO signed off on Slack for this classification of data? Alternative: alert in Slack with a *link* to a secure case view, no PII in the message.

**A4. "Detection" means notification, not resolution.**
Your metric is breach → alert in <15 min. The FCA will likely also care about alert → human action. Do we need a second metric: time-to-acknowledge / time-to-disposition?

---

## Open questions (grouped)

### Regulatory
1. Has the MLRO defined what "demonstrable" means for the FCA review — is an alert audit log sufficient, or do they need triage workflow evidence (who reviewed, decision, timestamp)?
2. Is there a documented escalation path if an alert sits unacknowledged? (FCA will ask.)

### Operational
3. **Coverage:** Transactions happen 24/7 (presumably). Who receives and actions alerts overnight/weekends? An alert nobody reads at 2am is the same 18-hour lag with extra steps.
4. **Volume:** How many >£10k transactions per day? If it's 200, a raw Slack ping per transaction creates alert fatigue and you'll recreate the morning-report problem inside a noisy channel. If it's 5, simple alerts work fine.
5. **Disposition tracking:** "Reviews and clears or escalates" — where does that decision get recorded? Slack reactions are not an audit trail.

### Technical
6. What system produces the current morning report, and can we tap its source feed rather than the report?
7. Currency/instrument scope — "cash equivalents" needs a precise definition (FX conversions at what rate, which instruments count)?

---

## Risks logged

| # | Risk | Impact |
|---|------|--------|
| R1 | Upstream data latency makes 15-min target impossible | Kills MVP premise — validate first |
| R2 | Structuring left out of scope; FCA flags it in Q4 review | Regulatory finding despite shipping |
| R3 | Alert fatigue at high volume → alerts ignored | Recreates original problem |
| R4 | No audit trail of triage decisions | Can't demonstrate compliance even with working alerts |
| R5 | PII in Slack messages | Data protection breach while fixing an AML gap |

---

## Proposed MVP refinement (for your reaction)

**In:** Real-time single-transaction threshold alerts → Slack + email, **with** acknowledgment tracking and an audit log of clear/escalate decisions. (The audit log is what makes it "demonstrable" — I'd argue it's not optional.)

**Out (explicitly, documented):** Structuring/aggregation rules, case management UI, automated SAR drafting.

**Success metrics:**
- Breach → alert: **<15 min** (your metric)
- Alert → acknowledgment: **<X min** (needs MLRO input)
- 100% of alerts have a recorded disposition

---

**Next step:** Answer A1–A4 and questions 1–7 (especially **data latency** and **daily volume** — those two determine whether this is a two-week build or a quarter-long programme). Then we move to Stage 2: solution options and sizing.

Which of these can you answer now, and which need the MLRO or a data/platform engineer in the room?