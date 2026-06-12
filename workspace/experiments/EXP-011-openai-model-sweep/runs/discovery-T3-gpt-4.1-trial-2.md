### Problem / Opportunity Statement

**Problem:**  
Our current AML (Anti-Money Laundering) process for transaction monitoring relies on batch reports: transactions exceeding the £10,000 cash equivalent threshold are flagged, but only reviewed once daily by compliance officers. This introduces a significant detection lag, as evidenced by recent near-miss incidents where suspicious activity remained unnoticed for over 18 hours. This exposes the organisation to regulatory, reputational, and financial risk.

**Opportunity:**  
By implementing near-real-time alerting for AML threshold breaches, we can vastly improve responsiveness, meet FCA expectations, and strengthen our statutory compliance posture ahead of the upcoming review.

---

### Who it Affects

- **Compliance Officers:** Must currently wait for daily reports, limiting their responsiveness and capacity to take timely action.
- **MLRO (Money Laundering Reporting Officer):** Ultimately responsible for regulatory reporting (SARs). Delays in detection could expose the company to sanctions.
- **Risk Team:** The “blind spot” while breaches are unflagged increases institutional risk and potential liability.

---

### Why Now

- **FCA Review Q4:** The Financial Conduct Authority will review our AML controls this year, with explicit regulatory expectation for near-real-time monitoring per FCA guidelines.
- **Recent Incidents:** Two recent cases highlight the risk of current lag. The risk of unreported money laundering is unacceptably high.
- **Competitive/Regulatory Pressure:** Industry standards and best practices are moving to real-time/automated alerting.

---

### Minimum Viable Product (MVP)

- **Scope:**  
  - Automatically flag any transaction >£10,000 (or cumulative linked transactions, if possible).
  - Real-time alert dispatch to compliance officers via internal Slack and email.
  - Workflow for compliance review: alert, investigate, escalate (as per existing process).
- **Goal:**  
  - <15 minutes from transaction processing to alert delivery.
- **Exclusions (for MVP):**  
  - Integration with external SAR filing.
  - Sophisticated pattern/risk scoring (just threshold-based for now).

---

### Success Criteria

- **Time-to-Detection:** Threshold breach alerts delivered and visible to compliance team within 15 minutes of transaction.
- **Operational Impact:** Compliance officers confirm ability to review, investigate, or escalate suspicious transactions in real-time, not batch.
- **Regulatory:** Demonstrable logs and metrics showing 100% of threshold breaches detected within SLA (15 min) — ready to present to the FCA.
- **Incident Reduction:** No more threshold breaches left undetected >15 minutes.

---

**Summary:**  
Implementing real-time alerts for AML threshold breaches will move us from slow, manual detection towards regulatory compliance and significantly reduce institutional risk. Tight, measurable MVP scope and clear success criteria ensure we’re prepared for the FCA review and protect the business.