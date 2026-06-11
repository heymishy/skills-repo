Understood — the discovery focus is:

## Problem / opportunity
You need to implement **near-real-time AML transaction monitoring alerts** for **cash-equivalent transactions over £10,000**, replacing a **manual morning report process** that currently leaves breaches undetected for **18+ hours**.

## Why this matters
- **Compliance officers** are delayed in spotting breaches
- **MLRO** may miss timely escalation/SAR decisions
- **Risk exposure** persists while flagged transactions sit unseen
- **FCA scrutiny** is coming in **Q4**, so this needs to be demonstrable soon

## Current pain point
- System already identifies threshold breaches
- But alerting is not real-time
- Detection is manual and delayed
- Two near-misses in the last 90 days show the risk is real

## MVP scope
- Trigger alerts when a transaction exceeds **£10,000 cash equivalent**
- Send alerts to:
  - **Slack**
  - **Email**
- Compliance officer:
  - reviews alert
  - clears it
  - or escalates it to MLRO

## Success criteria
- Reduce detection lag from **18+ hours** to **under 15 minutes**

If you want, I can now turn this into the next discovery output: **problem framing, user stories, risks/constraints, or a lightweight solution outline**.