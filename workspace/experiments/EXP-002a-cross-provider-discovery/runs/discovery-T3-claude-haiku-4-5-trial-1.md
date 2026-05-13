# Discovery Pipeline: AML Transaction Monitoring Alerts

## 1. Problem Validation

**Key questions to test:**

- **Detection lag impact**: You mentioned 18+ hours — what's the actual range? (Was it 18–24 hours? Overnight-only lag?) This shapes urgency.
- **False positive cost**: How many daily transactions cross £10k? If it's 500+ a day, alert fatigue could overwhelm officers and create new risk (alert blindness). What's the current ratio?
- **Current workflow pain**: Why isn't the morning report working? (Staff absence? Cognitive load? System delay in populating the report?) Understanding the root might reveal cheaper fixes.
- **FCA precedent**: Have you seen FCA feedback on other firms' alert latency? Or is "near-real-time" your interpretation? (15 mins vs. 2 hours vs. same-day matters for scope/cost.)

**Red flags to check:**
- If alert volume is very high (100+ per day), you may need rule tuning *before* real-time infra.
- If the morning report is delayed because of data quality issues, real-time alerts will inherit those problems.

---

## 2. Scope Tightening

**Clarify the actual MVP boundary:**

| Aspect | Question | Why it matters |
|--------|----------|---|
| **Transaction types** | Does £10k apply to *all* cash equivalents, or specific products (international wires, FX, casino chips)? | Scope of data pipeline. |
| **Thresholds** | Single transaction, or rolling 24-hour aggregate? Patterns (5× £2.5k in 1 hour)? | Alters alert logic complexity. |
| **Escalation path** | Alert → compliance officer reviews → clears or flags to MLRO? Or auto-escalate to MLRO after N minutes? | Workflow assumptions. |
| **Geographic scope** | All customers, or higher-risk jurisdictions only? | Data governance & alert volume. |
| **Audit trail** | Who saw the alert? When? What decision? (Required for FCA.) | System design requirement. |

---

## 3. Assumption Testing (Quick Wins)

**Before building, test these fast:**

1. **Current report latency source** (1–2 days)
   - Instrument the morning report pipeline. Is the delay in data batch timing, SQL query, or manual review?
   - If it's batch timing, a scheduled alert on the existing data might be 80% of the fix (no new infrastructure).

2. **Alert volume baseline** (1 day)
   - Run yesterday's transactions through the rule. How many breach £10k?
   - Survey 3 compliance officers: "If you got this many alerts per day, would you action them?"

3. **FCA requirement specificity** (2 hours)
   - Pull your most recent FCA feedback or rulebook references.
   - Ask: "Near-real-time" = 15 min? 1 hour? Same calendar day? (This changes the entire tech stack decision.)

4. **Existing alerting infrastructure** (1 day)
   - Do you have Slack/email integrations already? Any real-time event bus or queue (Kafka, RabbitMQ)?
   - Reusing existing channels is 50% cheaper than building from scratch.

---

## 4. Strawman Solution Architecture

**Assuming:**
- High-volume (200+ breaches/day) → need smart filtering
- FCA wants < 1 hour detection
- You have a transactional database + Slack/email infra

**Minimal viable path:**

```
Transaction Posted
    ↓
Event (Kafka/SQS/DB trigger)
    ↓
Rule Engine: £10k + metadata check
    ↓
Alert Service (Slack + Email)
    ↓
Compliance Officer Dashboard (view, clear, escalate)
    ↓
Audit Log (for FCA evidence)
```

**Key design decisions to validate:**
- **Real-time source**: Can you capture transactions from the posting system in <2 min? Or is there a batch delay at the source?
- **Deduplication**: If a transaction is reprocessed, does the officer get 10 alerts or 1?
- **Correlation**: Should alerts group by customer or time window? (Single alert for a customer with 5 breaches, or 5 alerts?)

---

## 5. Risks & Unknowns

| Risk | Mitigation | Owner |
|------|-----------|-------|
| Alert fatigue → officers ignore alerts | Test alert volume *before* launch; build a "snooze" feature for systematic false positives. | Product |
| False negatives (legitimate transactions misflagged as clean) | Validate rule logic against 30 days of historical data. Run manual audit. | Compliance + Eng |
| System down → no alerts → FCA breach | Design for redundancy (fallback: batch alerts to MLRO email every 30 min if real-time fails). | Infra |
| Scope creep (more rules, more products) | Lock MVP to single rule (£10k cash only). Document backlog items separately. | PM |
| Data privacy (alert visibility) | Who can see alerts? Slack channel access controls? Encryption in transit? | Security |

---

## 6. Next Steps (Prioritized)

### **This week:**
1. **Interview 2 compliance officers**: "Walk me through how you process the morning report. What would break your workflow?"
2. **Pull transaction volume data**: Count breaches in last 30 days. Get distribution (per day, per customer).
3. **FCA rulebook check**: Cite the specific requirement for "near-real-time" and acceptable latency.

### **Next week:**
4. **Architecture review**: Can you source transactions in real-time from your core system? (Biggest technical risk.)
5. **Slack/email audit**: Do integrations already exist? Who owns them?
6. **Compliance dashboard mock-up**: Sketch what the officer sees, how they clear/escalate.

### **Before build:**
7. **Pilot alert rules** on historical data. Measure false-positive rate.
8. **Approval from MLRO**: "Is this alert path acceptable for SAR filing?"

---

**What's the highest-uncertainty item here for your team?** (Data source latency? Alert volume? FCA requirement clarity?) I'd suggest tackling that first.