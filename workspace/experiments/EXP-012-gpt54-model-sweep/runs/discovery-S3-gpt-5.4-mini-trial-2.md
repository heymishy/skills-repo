## Discovery summary — RTP inbound receiving capability

### What’s being asked
You need to build the **receiving side** of the new Payments NZ RTP scheme so the enterprise can:

- Receive inbound RTP payments to customer accounts
- Process **ISO 20022** payment messages
- Credit customer accounts **in real time**
- Send scheme-required acknowledgements within **10 seconds**
- Operate **24/7/365**
- Reconcile against the current batch core at end of day

### Key current-state constraints
- Current core banking is **batch-based**
- Real-time crediting will require a **thin real-time processing layer**
- Fraud screening is currently **batch-only**, no real-time API
- AML system has a real-time API, but **P99 latency is 8 seconds under load**
- Estimated peak RTP volume: **40,000 transactions/hour**
- Live date requirement: **2026-09-01**
- Delay penalty: **$50,000/day** plus potential scheme suspension

---

## Initial discovery findings

### 1) Acknowledgement window is the main delivery constraint
You must acknowledge inbound payments within **10 seconds** of receipt.  
That means the end-to-end inbound path must include:

1. Receive message from Payments NZ
2. Parse/validate ISO 20022 payload
3. Run fraud screening
4. Run AML screening for payments > $1,000
5. Decide accept/reject
6. Credit account in real time if accepted
7. Send acknowledgement back to scheme

This is a tight SLA, especially with AML at **P99 8 seconds**.

### 2) AML is the highest technical risk
The AML API latency alone may consume most of the 10-second window, leaving little room for:
- Network overhead
- Message validation
- Fraud screening
- Posting to the real-time credit layer
- Acknowledgement generation and delivery

At peak load, the AML system may not sustain the required throughput or latency.

### 3) Fraud capability is not yet scheme-ready
The current fraud process is **batch-only**.  
If real-time fraud screening is mandatory on all inbound payments, this is a functional gap that likely requires:
- A new real-time fraud service, or
- An interim rules-based screening layer, or
- A compensating control agreed with the scheme if allowed

The estimated **2–4 seconds** per check may still be workable on its own, but not safely when combined with AML and integration overhead.

### 4) Core banking needs a real-time posting facade
Because the core bank is batch-based, you’ll need a **real-time posting layer** to:
- Place immediate credit to customer accounts
- Maintain idempotency
- Buffer/reconcile with core batch posting later
- Support reversal and exception handling

This is a significant integration component, but it appears feasible.

---

## Key risks

### High risk
1. **AML latency exceeds acknowledgment SLA**
   - P99 8 seconds under load is too close to the 10-second limit
   - Likely to fail during peak periods or with network overhead

2. **Fraud system lacks real-time API**
   - Current batch-only model is incompatible with real-time acceptance flow

3. **Throughput uncertainty at 40,000 tx/hour**
   - Need to confirm whether AML, fraud, and posting components can sustain volume

### Medium risk
4. **Real-time layer/core reconciliation complexity**
   - Need robust idempotency, replay handling, and end-of-day reconciliation

5. **Scheme message handling correctness**
   - ISO 20022 parsing, validation, response codes, retries, duplicates, and timeouts need careful design

### Business risk
6. **Missed go-live date**
   - $50,000/day penalty
   - Potential suspension from scheme participation

---

## Initial dependency assessment

### Must-have capabilities for receiving MVP
- ISO 20022 inbound message handling
- Real-time account crediting layer
- Acknowledgement response flow within 10 seconds
- End-of-day reconciliation with core banking
- Monitoring/alerting and audit logging
- Fraud and AML decisioning path

### Potential blockers
- Real-time fraud screening solution
- AML performance and scalability
- Scheme interpretation of whether screening can be asynchronous or condition-based

---

## Recommended discovery actions

### 1) Validate scheme rules for screening timing
Clarify with Payments NZ:
- Must fraud and AML checks complete **before acknowledgement**?
- Is **conditional acceptance** allowed?
- Are there sanctioned deferred screening models for AML/fraud?
- What response codes and timeouts are scheme-compliant?

This is critical because it may materially change the architecture.

### 2) Load-test AML immediately
You need evidence for:
- P95/P99 latency at **40,000 tx/hour**
- Behavior under burst traffic
- Failover and timeout handling
- Whether horizontal scaling is possible

### 3) Assess real-time fraud options
Investigate whether you can:
- Expose batch fraud logic as a low-latency service
- Implement lightweight rules engine first
- Use a vendor/API-based service
- Temporarily apply only deterministic rules in real time and defer deeper analysis

### 4) Define real-time posting architecture
Design the thin layer to handle:
- Message intake
- Validation
- Duplicate detection
- Idempotent posting
- Immediate ledger update
- Core reconciliation

### 5) Run an end-to-end timing budget
Build a latency budget for:
- Inbound receipt
- Message parsing
- Fraud check
- AML check
- Posting
- Ack generation
- Network return path

This will show whether the 10-second SLA is achievable.

---

## Discovery conclusion
The RTP receiving capability is **feasible in principle**, but there is a **material delivery risk** around the **10-second acknowledgement SLA**, primarily due to:

- AML P99 latency of 8 seconds
- Lack of real-time fraud screening
- Peak load uncertainty
- Need for new real-time posting infrastructure

The highest-priority discovery items are:
1. **Confirm scheme screening timing rules**
2. **Benchmark AML under RTP load**
3. **Define a real-time fraud approach**
4. **Design the thin real-time posting and reconciliation layer**

If you want, I can turn this into a structured **discovery output template** with:
- scope
- assumptions
- risks
- dependencies
- open questions
- initial target architecture
- delivery plan to 2026-09-01