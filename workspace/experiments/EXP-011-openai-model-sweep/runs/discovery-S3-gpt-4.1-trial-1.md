Certainly! Here’s a structured discovery and risk log based on the scenario provided.

---

## 1. **Key Requirements Identified**

- **Receive inbound RTP payments**: Must accept and process inbound payments via Payments NZ RTP scheme, including integration to the central infrastructure.
- **Process and credit in real time**: Crediting enterprise customer accounts instantly, 24/7/365.
- **ISO 20022 message handling**: Must parse and generate ISO 20022 messages.
- **Send scheme ACKs within SLA**: Must acknowledge receipt (accept/reject) within 10 seconds.
- **Fraud screening**: All inbound payments must be screened for fraud before crediting.
- **AML screening**: All inbound payments greater than $1,000 must be AML checked; must happen in real time.
- **Current systems unsuitable**: Current core and fraud processing are batch-oriented; AML SLA is borderline.
- **Go-live Deadline**: Full compliance and go-live by 2026-09-01 or major daily penalties/suspension risks.
- **Peak Volume Estimate**: 40,000 inbound transactions/hour at peak.

## 2. **Discovery Questions & Unknowns**

### **Integration & Architecture:**
- **How will the ‘thin real-time layer’ interact with the batch-oriented core?**  
  - **Is there an existing API to credit accounts instantly?**
- **What are the exact interface specifications for connecting with Payments NZ central infrastructure?**
- **What are the requirements for the acknowledgement (ACK) message — can certain fields be returned immediately (pre-validation), or is full validation/crediting required prior to ACK?**

### **Fraud:**
- **Can the current fraud system be upgraded to offer a real-time synchronous API, or will a new fraud engine be required?**
- **What is the impact of a 2–4 second response on overall processing, given other steps in the critical path?**
- **What is the false positive rate and operational overhead if a higher-speed, more basic fraud screen is used?**

### **AML:**
- **Has the AML screening service been stress/load tested at 40,000/hr throughput, and what’s the observed response latency?**
- **Does the 8s P99 latency include dependencies (e.g., external data sources, manual reviews), or is it entirely internal computation?**
- **Is there a ‘risk-based’ approach possible (e.g., ACK within SLA if initial check passes, escalate for post-processing if in doubt), and would this meet scheme rules?**

### **General:**
- **What are the monitoring and alerting requirements for availability and SLA breaches?**
- **Is there a fallback process for when downstream systems or screening services are not available within the SLA window?**
- **What are the real-time reconciliation challenges between the thin layer and the batch-oriented core; how will discrepancies be handled?**

---

## 3. **Key Risks Identified**

| Risk                             | Description                                                                                | Likelihood | Impact | Mitigation/Next Steps                  |
|-----------------------------------|--------------------------------------------------------------------------------------------|------------|--------|----------------------------------------|
| **ACK SLA Breach**                | Exceeding 10s window due to cumulative latency (fraud + AML + other processing)            | Med/High   | High   | End-to-end timing tests; optimize flow |
| **Fraud Screening Capability**    | No real-time API in current fraud system; either upgrade or new system needed               | High       | High   | Feasibility study for real-time fraud  |
| **AML Screening Scalability**     | AML API P99 latency (8s) approaches 10s window; untested at peak volume                    | High       | High   | Load and performance testing           |
| **Batch Core Constraints**        | Batch processing core may limit real-time credit/posting & reconciliation complexity        | Med        | High   | Define interface, ensure idempotency   |
| **Change Management**             | Major process/systems change across several departments (Ops, Tech, Compliance, Risk)       | Med        | Med    | Governance, early comms                |
| **Go-live Slippage**              | Fall behind on timeline leading to financial penalties or scheme suspension                 | Med        | High   | Robust project planning, tracking      |
| **Operations Support**            | 24/7/365 operation requirement compared to existing business hours batch model              | Med        | Med    | Review support/troubleshooting cover   |

---

## 4. **Immediate Actions / Next Discovery Steps**

1. **System Architecture Workshop:**  
   - Validate integration approach for real-time ‘thin layer’ and downstream (core, ledger) interfaces.
2. **Fraud Screening Assessment:**  
   - Engage with current fraud system vendor/team — can SLAs be met? Explore alternatives if needed.
3. **AML Load Testing:**  
   - Test AML system under simulated RTP volumes; confirm P95 / P99 latencies.
4. **SLAs & Scheme Clarifications:**  
   - Clarify if acknowledgement must follow AML/fraud check, or if staged responses permitted.
5. **Risk and Issue Register:**  
   - Set up continuous monitoring of SLA/latency metrics and track risks (esp. technical readiness).
6. **Project Governance:**  
   - Appoint a project/program lead and initiate steering group to ensure cross-functional alignment.

Would you like a detailed breakdown of technical options for the thin real-time layer, or a timeline estimation based on these risks and actions?