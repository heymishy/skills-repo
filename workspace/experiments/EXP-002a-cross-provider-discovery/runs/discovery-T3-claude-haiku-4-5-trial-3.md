# Discovery Pipeline: AML Transaction Monitoring Alerts

## 1. Problem Validation

**Core problem confirmed:** Manual daily reporting creates unacceptable detection lag (18+ hours vs. FCA expectation of "near-real-time"). Two recent incidents validate this is real, not theoretical.

**Key tensions to surface:**
- What does "near-real-time" actually mean to FCA? (minutes? seconds? do you have written guidance?)
- Are the 18-hour gaps due to *detection* latency or *review* latency? (This shapes the solution entirely)
- Why weren't the two near-misses caught? System failure or process failure?

---

## 2. Stakeholder Discovery Questions

### Compliance Officers
- How many threshold breaches do you see *per day* on average?
- Of those, how many are false positives / require immediate action vs. routine escalation?
- What information do you need *in the alert* to make a quick decision? (Customer name, transaction amount, counterparty, transaction type, risk profile?)
- How would you prefer to be interrupted? (Slack during business hours—but what about 3am transactions?)
- What's your current escalation workflow post-detection?

### MLRO
- What's the SARs filing deadline once you have *confidence* in a breach? (Hours? Days?)
- Are you currently missing SARs deadlines because of detection lag?
- Do you need audit trail on who detected, when, and who cleared it?

### Risk/Treasury
- Are there legitimate reasons transactions hit £10k+ that shouldn't trigger alerts? (e.g., payroll batches, B2B transfers, known customer activity patterns?)
- Should we alert on *single* £10k+ transactions or *cumulative* daily activity?
- Any correlation with time-of-day, day-of-week, or customer profile that reduces false positives?

---

## 3. Technical Assumptions to Test

- **Data freshness:** How quickly after a transaction hits your core banking system can we detect it? (Real-time feed? 5-minute batch? end-of-day?)
- **Threshold logic:** Is it strictly "cash equivalents >£10k" or more nuanced? (e.g., certain customer types exempt, geographic exclusions?)
- **False positive rate:** If you implement naive real-time alerting, what % of alerts will be noise?
- **Integration:** Does your transaction system expose an event stream, API, or only batch files?

---

## 4. MVP Scope Refinement

**Proposed MVP:**
1. **Trigger:** Real-time alert when single transaction in [cash equivalent category] exceeds £10,000
2. **Channels:** Slack (immediate visual) + email (audit trail)
3. **Alert payload:** Transaction ID, amount, customer, counterparty, timestamp, risk score (if available)
4. **Compliance workflow:** Slack button to mark "reviewed + cleared" or "escalate to MLRO"
5. **Audit log:** Every action logged with timestamp and user

**Out of scope (Phase 2):**
- Cumulative daily/weekly limits
- Pattern-based detection
- Automated SARs filing
- Mobile app

---

## 5. Success Metrics to Lock Down

| Metric | Current | Target | Measure How |
|--------|---------|--------|-------------|
| Time to alert | 18+ hours | <15 min | Timestamp on transaction vs. alert sent |
| Alert volume | N/A | [?] per day | Monitor first week of live alerts |
| False positive rate | Unknown | <20% | % of alerts reviewed as legitimate activity |
| Mean time to review | ~8 hours (next morning) | <30 min | Timestamp from alert to "cleared" action |
| SARs filing latency | Unknown (at risk) | Consistently <deadline | MLRO to confirm |

---

## 6. Key Risks & Questions

🚩 **If compliance is drowning in alerts**, the system becomes worse than the status quo.  
→ *Do we have a working false-positive filter (risk scoring, customer whitelists)?*

🚩 **Slack alerts are ephemeral** — if no one's at their desk, they vanish.  
→ *Do we need escalation rules (e.g., alert MLRO after 10 min if not cleared)?*

🚩 **"Near-real-time" may not be technically feasible** if data latency is batch-based.  
→ *Have you audited actual end-to-end latency in your transaction pipeline?*

🚩 **FCA may require specific audit trails** we're not planning for.  
→ *Has your legal/compliance team reviewed what FCA expects in logs?*

---

## 7. Next Steps (Recommended Sequence)

1. **Confirm FCA expectations** (30 min call with MLRO + legal) — what does "near-real-time" mean in their last correspondence?
2. **Audit transaction latency** (1 day) — measure time from transaction settlement to system visibility
3. **Map compliance decision rules** (2 hours with compliance team) — what makes an alert actionable vs. noise?
4. **Spike on data access** (3 days) — can we tap a real-time feed or are we stuck with batch?
5. **Build MVP** (2 weeks) — basic alerting via Slack + email with manual clearance workflow
6. **Pilot with 1–2 compliance officers** (1 week) — measure false positive rate, refine alert rules
7. **Full rollout** + FCA readiness by Q4

---

**What would be most valuable to clarify first?**