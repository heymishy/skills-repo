Thanks — here’s a structured discovery summary for this problem/opportunity.

---

## Discovery framing

### Problem statement
Your AML transaction monitoring control for cash-equivalent transactions over **£10,000** is currently **batch/report-based and manually reviewed once daily**, creating a detection lag of up to **18+ hours**. This leaves the business exposed to regulatory, operational, and financial crime risk, and falls short of the FCA’s expectation for **near-real-time detection**.

### Why this matters
- **Regulatory risk:** FCA review is due in **Q4**, and current monitoring may be viewed as inadequate.
- **Control weakness:** Threshold breaches can sit undetected for many hours.
- **Operational risk:** Compliance and MLRO response is delayed, affecting timely review/escalation and SAR decision-making.
- **Recent evidence:** Two near-misses in the last 90 days show this is not theoretical.

---

## Opportunity
Implement **near-real-time AML threshold breach alerting** so compliance officers are notified quickly when a qualifying transaction occurs, enabling prompt review and escalation.

This is both:
- a **risk-reduction initiative**, and
- a **compliance capability uplift** ahead of FCA scrutiny.

---

## Target users / stakeholders
- **Compliance officers**  
  Need timely, actionable alerts and a simple workflow to review/clear/escalate.
- **MLRO**  
  Needs faster visibility into potentially reportable activity and confidence that monitoring controls are effective.
- **Risk team**  
  Needs reduced exposure window and evidence of stronger operational controls.
- **Potentially engineering / platform / security teams**  
  Needed to integrate transaction events, alert routing, audit trail, and reliability controls.

---

## Current state
- Rule exists: flag transactions over **£10,000** in cash equivalents.
- Detection output is reviewed via a **manual report every morning**.
- No real-time or near-real-time alerting.
- Breaches may remain unreviewed for **18+ hours**.

---

## Desired future state
- A transaction breaching the threshold is detected in **near real time**.
- Compliance team receives alerts via **Slack and email**.
- A compliance officer can **review, clear, or escalate**.
- Alerting and actioning are **auditable**.
- End-to-end detection time is reduced to **under 15 minutes**.

---

## MVP definition
### In scope
- Detect transactions that breach the **£10,000 threshold** for cash equivalents.
- Generate an alert in near real time.
- Deliver alert to:
  - **internal Slack**
  - **email**
- Provide a review workflow:
  - clear
  - escalate
- Record alert generation and disposition for audit purposes.

### Out of scope for MVP, unless required
- More advanced AML typologies/pattern detection
- Machine learning / anomaly detection
- Broader case management platform replacement
- Customer/account behavioral aggregation
- Automated SAR filing
- Full sanctions/fraud monitoring convergence

---

## Success criteria
### Primary success metric
- **Detection/alerting time reduced from 18+ hours to under 15 minutes**

### Supporting success metrics
- % of threshold breaches alerted within SLA
- Alert delivery success rate for Slack/email
- Time from alert to compliance acknowledgement
- Time from alert to clear/escalate decision
- Number of missed or delayed alerts
- Audit completeness for generated alerts and reviewer actions

---

## Risks and considerations to explore in discovery
### 1. Detection semantics
- What exactly counts as a **cash equivalent** transaction?
- Is the £10,000 threshold:
  - single transaction only?
  - cumulative over a period?
  - gross or net?
  - based on initiated, authorized, or settled transaction state?
- Are there exceptions, exclusions, or jurisdiction-specific nuances?

### 2. Real-time event availability
- Do transaction events already exist in a stream/webhook/queue?
- If not, what systems must be integrated?
- What is the earliest reliable point at which the transaction can be evaluated?

### 3. Alert workflow and ownership
- Who receives the first alert?
- Is Slack sufficient for awareness, or is email the system of record?
- What happens if no one acknowledges the alert?
- Is there an escalation SLA to the MLRO?

### 4. Audit and evidencing
- FCA will likely care not just that alerts exist, but that:
  - they are timely,
  - consistently generated,
  - reviewed,
  - and evidenced.
- Need immutable logs / audit trail of:
  - triggering transaction
  - alert timestamp
  - recipients
  - acknowledgement
  - disposition
  - escalation path

### 5. Operational resilience
- What happens if Slack is down?
- What happens if email delivery fails?
- Do we need retries, dead-letter handling, fallback routing, on-call notifications?

### 6. False positives / alert fatigue
- Will all >£10,000 threshold events be actionable?
- Could volume overwhelm compliance?
- Is deduplication needed if a transaction changes state multiple times?

### 7. Security and privacy
- What transaction/customer data can be included in Slack/email?
- Are internal channels approved for AML-sensitive data?
- Does alert content need masking or linking back to an internal system?

---

## Assumptions to validate
- The core threshold rule itself is already agreed and compliant.
- Transaction data can be accessed quickly enough to support sub-15-minute alerting.
- Slack and email are acceptable channels for AML operational alerts.
- Compliance has capacity and process readiness to act on alerts in near real time.
- Existing manual reporting can remain as a backup during rollout.

---

## Key discovery questions
### Business / compliance
- What exact FCA expectation are we aligning to: explicit rule, guidance, or supervisory expectation?
- What evidence will satisfy the Q4 review?
- What is the required response SLA after detection?
- Who is accountable for alert triage outside business hours?

### Process
- What does “clear” vs “escalate” mean operationally?
- When must MLRO be involved?
- Is there an existing case management tool to record decisions?

### Data / technical
- Where is the source-of-truth transaction data?
- How quickly is it available after transaction creation/authorization/settlement?
- Are there existing event-driven systems we can reuse?
- How will duplicate/replayed events be handled?
- How will latency be measured end to end?

### Controls / audit
- What logs are required for internal audit and FCA evidence?
- How long must alert and decision records be retained?
- How do we demonstrate no alerts were missed?

---

## Likely problem statement in one sentence
“We need to replace next-day manual review of AML threshold breaches with an auditable near-real-time alerting control so compliance can detect and act on >£10,000 cash-equivalent transactions within 15 minutes ahead of the FCA review.”

---

## Opportunity hypothesis
“If we implement near-real-time detection and alerting for >£10,000 cash-equivalent transactions, then compliance detection lag will fall from 18+ hours to under 15 minutes, materially reducing AML exposure and improving readiness for FCA review.”

---

## Recommended next output from discovery
The best next step would be to turn this into:
1. **A concise opportunity brief**
2. **Current vs future-state workflow**
3. **Risks/assumptions/questions log**
4. **MVP requirements with acceptance criteria**

If you want, I can produce the next artifact as a **discovery brief** or a **set of stakeholder / technical discovery questions**.