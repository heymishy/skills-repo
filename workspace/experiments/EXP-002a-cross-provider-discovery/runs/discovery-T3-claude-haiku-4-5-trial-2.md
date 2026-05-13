# Discovery Pipeline: AML Transaction Monitoring Alerts

I'll structure this to uncover the real constraints and dependencies before you build.

---

## 1. PROBLEM VALIDATION

**Confirm the actual pain:**

- [ ] **Detection lag root cause:** Is it purely manual report review, or are there upstream delays (transaction processing, data pipeline latency, reporting DB sync)?
- [ ] **The two near-misses:** What was the actual risk exposure? (Did money move before detection? Were SARs filed late? Or was it caught before any harm?) — this shapes urgency.
- [ ] **False positive cost:** If you alert on every £10k+ breach, how many per day? (If it's 100+, compliance officer alert fatigue kills adoption.)
- [ ] **Regulatory requirement clarity:** Does "near-real-time" have a defined SLA in your FCA guidance, or are you inferring it? (Confirm the actual deadline.)

---

## 2. SCOPE CREEP RISKS

**Questions to lock down the MVP:**

- **What counts as a "breach"?**
  - Single transaction over £10k? ✓
  - Cumulative (e.g., multiple transactions same customer in 24h)? 
  - Structured transactions (splitting to avoid threshold)?
  - Different entity types (individuals vs. corporates)?
  - Geographic/corridor rules? (Some corridors have lower thresholds)

- **Alert routing:** 
  - All threshold breaches → same person/team?
  - Or does it depend on customer risk profile, geography, transaction type?
  - What if compliance officer is offline? Escalation path?

- **What happens after alerting?**
  - Officer manually reviews and clears → how do you track it?
  - Auto-escalate to MLRO if not cleared in 2h?
  - Does this feed into SAR filing, or is that separate?

---

## 3. TECHNICAL DISCOVERY

**Data & system questions:**

- **Transaction source:** Where does the £10k transaction data live today?
  - Real-time streaming (Kafka, event bus)?
  - Batch database (daily load)?
  - Payment processor API?
  - → This defines your architecture.

- **Latency baseline:**
  - How long from transaction settlement to appearing in the system you'll monitor?
  - Is the 18+ hour gap data latency or alerting latency?

- **Data quality:**
  - How accurate is the "cash equivalent" field? (FX conversions? Commodity valuations?)
  - Exception handling: what if a transaction has no customer ID or amount?

- **Integration dependencies:**
  - Does Slack integration exist already, or build new?
  - Email system — is it monitored/logged for compliance audit?
  - Any existing monitoring platform (Datadog, Splunk) you should plug into?

---

## 4. COMPLIANCE & AUDIT CONCERNS

**These will block you if missed:**

- **Audit trail:** Every alert must be logged immutably with:
  - Timestamp generated
  - Officer who reviewed it
  - Action taken (cleared/escalated)
  - Reason/notes
  - → Who owns this log? Can compliance officer tamper with it?

- **False positives:** 
  - If you alert on £10k+ but the customer is a known bulk-cash business, do you suppress alerts or just label them?
  - Who decides if an alert is a "false positive" (the officer or a rule)?

- **Regulatory handoff:**
  - If an alert is cleared by an officer but later you discover it was actually suspicious, who's liable?
  - Does the alert system feed into your SAR decision workflow, or is that manual?

- **Data retention:** How long do you keep alert records? (Regulators typically expect 5+ years.)

---

## 5. STAKEHOLDER VALIDATION

**Talk to these people before building:**

| Role | Key Questions |
|------|---|
| **Compliance Officer** | How many alerts per day would they tolerate without tuning out? What context do they need in the alert to act fast? |
| **MLRO** | Does this alert feed their SAR decision, or do they have a separate review? Escalation SLA? |
| **Risk Team** | What metrics prove this reduces exposure? (Detection time? SARs filed on time?) |
| **IT/Security** | Slack integration approved? Alert data classified as PII/sensitive? Backup if Slack is down? |
| **FCA Relationship Manager** | (If you have one) Confirm "near-real-time" means <15 min or <1 hour? |

---

## 6. MVP BOUNDARY (BE STRICT)

**What's IN:**
- Real-time detection of single transactions > £10k
- Slack + email alert (structured message with: customer, amount, transaction ID, link to review)
- Compliance officer can manually mark "reviewed" (basic audit log)

**What's OUT:**
- Cumulative/structured transaction detection
- Auto-escalation rules
- Integration with SAR filing system
- Advanced ML/behavioral analytics
- Mobile app

---

## 7. ANTI-PATTERNS TO AVOID

- ❌ **"We'll figure out the compliance audit trail later"** → You won't, and FCA will flag it.
- ❌ **Alert on every £10k transaction without understanding baseline volume** → Build the alert, get 200/day, compliance team ignores all of them.
- ❌ **Slack-only alerting** → Compliance needs email + audit log for proof they were notified.
- ❌ **Launching before FCA clarifies SLA** → You might optimize for wrong deadline.

---

## NEXT STEPS (Discovery Outputs)

1. **Schedule 1-hour workshop:** Compliance + MLRO + tech lead — lock down alert scope (single vs. cumulative, routing rules).
2. **Data audit:** Confirm transaction latency (is £10k data available in <5 min? <1 hour?).
3. **FCA clarification:** Email your relationship manager: *"What's your expected SLA for threshold breach detection?"*
4. **Prototype alert spec:** Agree on Slack message format + audit log schema with compliance.
5. **Risk assessment:** If false positive rate is high, sketch a basic suppression rule (e.g., mute alerts for known bulk-cash customers).

---

**What do you want to tackle first?**