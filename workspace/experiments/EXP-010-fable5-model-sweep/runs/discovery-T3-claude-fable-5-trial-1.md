# Discovery: Real-Time AML Threshold Breach Alerting

Good brief — clear problem, named stakeholders, a hard deadline, and a measurable success criterion. Before we lock scope, let's pressure-test a few things.

## What's strong already

- **Quantified pain**: 18+ hour detection lag, two near-misses in 90 days
- **Forcing function**: FCA review in Q4 gives us a non-negotiable deadline
- **Measurable success**: <15 minutes detection is testable

## Key questions before we proceed

### 1. Where does the latency actually live?
Is detection itself batch (transactions only land in the report overnight), or is detection near-real-time but *notification* is batch? This changes the build dramatically:
- If transaction data already flows in near-real-time → this is mostly an alerting/workflow problem (smaller)
- If the source systems batch-export overnight → we have a data pipeline problem first, and <15 min may not be achievable without upstream changes (much bigger)

**This is the single most important unknown.** What's the ingestion latency from your transaction systems today?

### 2. Is single-transaction threshold detection actually enough for the FCA?
The £10k single-transaction rule misses **structuring/smurfing** — multiple sub-threshold transactions designed to evade detection. MLR 2017 and FCA guidance expect monitoring of linked transactions. Question for your MLRO: will the FCA review accept single-transaction alerting as "demonstrable near-real-time monitoring," or will they probe aggregation? If aggregation is expected, we need to know now — it affects architecture (stateful windowing vs. stateless filtering).

I'd suggest: **MVP = single-transaction alerts, but architect so aggregation rules can be added** — don't paint ourselves into a stateless corner.

### 3. Slack + email may not satisfy the audit requirement
The FCA will want evidence of: alert raised → acknowledged → dispositioned (cleared or escalated) → by whom → when. Slack and email are notification channels, not systems of record. Do you have a case management tool, or does the MVP need a minimal disposition log (even a structured database with an acknowledge/clear/escalate action)? Without this, you can prove detection but not *response* — and the FCA cares about both.

### 4. Alert volume and triage
How many transactions breach £10k on a typical day? If it's 5, Slack works fine. If it's 500 (legitimate corporate payments, payroll runs), you'll create alert fatigue and the real breaches get buried — arguably worse than the morning report. Do we need exemption lists or risk-scoring from day one?

### 5. Operational coverage
- Do transactions occur outside business hours? If a breach fires at 2am Saturday, does <15 min detection matter if nobody reviews until Monday? Define detection SLA vs. **response** SLA separately.
- "Cash equivalents" — does this include foreign currency transactions needing FX conversion at alert time? Whose rate?

### 6. Silent failure is the worst failure
If the alerting pipeline goes down, you're worse off than today — the team will trust the system and stop checking. We need a heartbeat/dead-man's-switch (e.g., daily "system healthy" confirmation or alert-on-no-data) in MVP scope.

## Proposed success metrics (refined)

| Metric | Target |
|---|---|
| Breach detection time | <15 min from transaction settlement |
| Alert acknowledgment time (business hours) | Define — suggest <30 min |
| Alert disposition audit trail | 100% of alerts logged with outcome |
| Pipeline availability / failure detection | Failures detected within X min |

## Next step

Can you answer questions **1, 2, and 4** first? Those determine whether this is a 4-week alerting build or a quarter-long data pipeline programme — and whether MVP scope survives contact with your MLRO.