Great — here’s a structured summary of your **Problem/Opportunity Statement** for the /discovery pipeline:

---

### **Problem/Opportunity Statement**

**Problem/Opportunity:**  
You need to implement real-time transaction monitoring alerts for Anti-Money Laundering (AML) threshold breaches. Currently, thresholds (transactions over £10,000 in cash equivalents) are identified only via daily reports, leading to detection delays. This has caused two near-misses in the last 90 days, where threshold breaches went undetected for 18+ hours. The Financial Conduct Authority (FCA) expects near-real-time detection; the current process is not compliant.

**Who it affects:**  
- **Compliance officers**: Delays in detecting breaches increase risk and workload.
- **MLRO** (Money Laundering Reporting Officer): Responsible for prompt suspicious activity report (SAR) filings; exposed to regulatory risk from detection delay.
- **Risk team**: Heightened exposure and risk while breaches remain undetected.

**Why now:**  
- An **FCA review is scheduled for Q4**. You must demonstrate compliance with near-real-time monitoring requirements before the audit to avoid regulatory findings.

**MVP (Minimum Viable Product):**  
- Real-time alerting when a transaction breaches the £10,000 threshold.
- Alerts are sent via internal Slack and email to the compliance team.
- Compliance officer to review each alert and clear or escalate accordingly.

**Definition of Success:**  
- The time to detect and notify on threshold-breaching transactions is reduced from **18+ hours to under 15 minutes**.

---

**Is this accurate and complete?**  
If so, the next step is to define your user journeys and identify technical constraints or dependencies. If you’d like, I can help outline these as well. Let me know if you want to make any changes or go deeper on any aspect!