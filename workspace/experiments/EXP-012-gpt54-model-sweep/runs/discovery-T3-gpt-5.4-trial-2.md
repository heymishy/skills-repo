Thanks — here’s a structured discovery summary for the problem/opportunity.

## Problem / Opportunity Statement

The business needs to move from **next-day manual review of AML threshold breaches** to **near-real-time transaction monitoring alerts**.

Today, transactions involving **cash equivalents over £10,000** are only identified through a report reviewed manually each morning. This creates a significant detection lag, and in the last 90 days there have been **two near-misses where breaches remained undetected for more than 18 hours**.

This exposes the firm to:
- **Regulatory risk** — FCA expects near-real-time detection
- **Operational risk** — compliance action is delayed
- **Financial crime risk** — suspicious activity may continue while undetected
- **Audit / review risk** — upcoming FCA review in Q4 will likely scrutinize monitoring timeliness

## Who is affected

- **Compliance officers**
  - Currently rely on manual report checks
  - Experience delays in identifying threshold breaches
- **MLRO**
  - May be delayed in reviewing and filing SARs where needed
- **Risk team**
  - Bears exposure while potential breaches sit unreviewed
- **Wider business**
  - Faces FCA criticism or remediation if controls are judged inadequate

## Why now

- **FCA review scheduled for Q4**
- Existing control has already shown weakness via **two recent near-misses**
- There is a clear gap between current-state monitoring and regulatory expectation for **near-real-time detection**

## MVP scope

Implement **real-time alerting** for transactions that breach the **£10,000 cash-equivalent AML threshold**, with:
- Alert delivery to **internal Slack**
- Alert delivery by **email**
- A workflow where a **compliance officer reviews** the alert and either:
  - clears it, or
  - escalates it

## Target outcome / success metric

Primary success metric:
- **Detection time reduced from 18+ hours to under 15 minutes**

Likely supporting metrics:
- % of threshold-breach transactions alerted within 15 minutes
- Alert delivery success rate to Slack/email
- Time from alert to compliance acknowledgment
- Time from alert to clear/escalate decision

## Concise framing

**We need to implement near-real-time AML threshold breach alerting so transactions over £10,000 in cash equivalents are surfaced to compliance within 15 minutes rather than being discovered the next morning.**

If helpful, I can next turn this into a **discovery brief**, **problem statement + goals/non-goals**, or a **set of stakeholder/interview questions** for the rest of the `/discovery` pipeline.