**Problem / opportunity to explore:**  
Implement near-real-time transaction monitoring alerts for AML threshold breaches so that transactions exceeding **£10,000 in cash equivalents** are detected and acted on within minutes (vs. being manually reviewed the next morning), reducing the risk of delayed detection and strengthening our position ahead of an **FCA review in Q4**.

**Key symptoms / what’s not working today:**  
- Current monitoring flags threshold breaches only via a **daily manual report review** by compliance.  
- Two near-misses in the last **90 days** where breaches remained undetected for **18+ hours**.  
- We lack **real-time alerting/workflow**, so action depends on when the report is checked.

**Who is affected:**  
- **Compliance officers**: experience detection lag and manual triage; must clear or escalate.  
- **MLRO**: relies on timely identification to determine if **SARs** need to be filed.  
- **Risk team**: increased exposure while breaches remain undetected.

**Why this matters now:**  
- FCA expects **near-real-time detection**.  
- We need a credible uplift before **Q4** to show monitoring effectiveness and responsiveness.

**MVP scope (what we want to deliver first):**  
- Trigger **real-time alerts** when a transaction breaches the **£10,000 threshold** in cash equivalents.  
- Route alerts to the compliance team via **Slack + email**.  
- Provide a simple workflow for compliance to **review**, **clear**, or **escalate**.

**Success measure:**  
- Reduce detection/alerting lag from **18+ hours** to **under 15 minutes** for threshold breaches.