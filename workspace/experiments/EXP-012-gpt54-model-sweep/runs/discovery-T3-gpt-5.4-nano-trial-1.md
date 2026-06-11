**Problem / opportunity to explore:**  
Implement near-real-time transaction monitoring alerts for AML threshold breaches so that compliance is notified immediately when a customer transaction exceeds **£10,000 in cash equivalents**, rather than relying on a **manual morning review**. This aims to reduce detection lag (currently **18+ hours**, with **two near-misses in 90 days**) and meet **FCA expectations** ahead of a **Q4** review.

**What’s at stake / who it affects:**  
- **Compliance officers:** experience detection lag and delayed investigation/decision-making.  
- **MLRO:** potential delay in assessing/reporting obligations (SAR decisions).  
- **Risk team:** increased exposure while breaches remain undetected.

**Why now:**  
The FCA review in **Q4** requires demonstrable near-real-time monitoring capability. We need to show operational improvements before then.

**MVP scope / target behavior:**  
- Detect transactions breaching the **£10,000 threshold** in **real time**.  
- Trigger alerts to the **compliance team** via **internal Slack + email**.  
- Provide a workflow where compliance officers can **review, clear, or escalate** the alert.

**Success metric:**  
Reduce threshold breach detection time from **18+ hours** to **< 15 minutes** (with alert response starting within that window).