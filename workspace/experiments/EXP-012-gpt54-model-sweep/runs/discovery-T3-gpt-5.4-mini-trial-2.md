Got it — here’s the discovery problem statement I’m capturing:

## Problem / opportunity
We need to implement **near-real-time AML transaction monitoring alerts** for **cash-equivalent transactions over £10,000**.

### Current state
- Transactions are currently flagged by a system rule, but **alerts are not sent in real time**.
- Compliance officers **manually review a report each morning**.
- This has led to **two near-misses in the last 90 days**, where threshold breaches remained undetected for **18+ hours**.

### Why it matters
- The **FCA expects near-real-time detection**.
- Delay creates **regulatory risk** and increases exposure if suspicious activity goes unreviewed.
- This affects:
  - **Compliance officers** — delayed detection and manual workload
  - **MLRO** — delayed SAR decisioning
  - **Risk team** — prolonged exposure to undetected breaches

### Timing
- An **FCA review is scheduled for Q4**, so this capability needs to be demonstrable before then.

### MVP
- Send **real-time alerts** to the compliance team when a transaction breaches the **£10,000 threshold**.
- Delivery channels:
  - **Internal Slack**
  - **Email**
- Compliance officer then **reviews and either clears or escalates**.

### Success criteria
- Reduce breach detection time from **18+ hours to under 15 minutes**.

If you want, I can next turn this into:
1. a **discovery brief**,  
2. **key assumptions / risks**, or  
3. **top discovery questions** to validate before solution design.