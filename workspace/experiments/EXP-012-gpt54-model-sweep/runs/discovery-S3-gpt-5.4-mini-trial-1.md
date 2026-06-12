## Discovery Summary: RTP Receiving Capability

### Objective
Build the **receiving side** for Payments NZ RTP participation:
- Accept inbound ISO 20022 RTP messages
- Credit customer accounts in real time
- Send scheme acknowledgements within **10 seconds**
- Operate **24/7/365**
- Reconcile with batch core banking at end of day

---

## Key Findings

### 1) Core banking is not RTP-ready
- Current core processes in **batch windows** with same-day settlement.
- RTP requires **immediate crediting** and continuous availability.
- A **thin real-time posting layer** is required to front the batch core and reconcile later.

### 2) Scheme acknowledgement timing is tight
- Must acknowledge within **10 seconds** of receipt.
- Real-time fraud screening is estimated to add **2–4 seconds**.
- AML screening for payments over $1,000 has **P99 latency of 8 seconds** under load.
- Combined with message processing, this creates a **high risk of breaching the 10-second window**.

### 3) Fraud capability is not yet suitable
- Existing fraud system is **batch-only** and has **no real-time API**.
- A real-time fraud control is required for all inbound RTP payments.
- Current estimate suggests fraud integration may be feasible only if it is:
  - lightweight,
  - non-blocking, or
  - performed asynchronously with rules that still satisfy scheme obligations.

### 4) AML system performance is a major concern
- AML is required on inbound payments **above $1,000**.
- Real-time API exists, but **P99 = 8 seconds** under load.
- At peak RTP volumes of **40,000 tx/hour**, this is likely to be a bottleneck.
- This is the biggest technical risk to meeting the 10-second acknowledgement SLA.

### 5) Delivery deadline is fixed and commercially significant
- Go-live required by **2026-09-01**
- Missed deadline penalty:
  - **$50,000 per day**
  - plus potential **scheme suspension**
- This makes schedule risk material and urgent.

---

## Primary Risks

### Schedule / Delivery Risk
- The 2026-09-01 deadline is firm and penalties are steep.
- Dependency on fraud/AML redesign and performance testing could delay delivery.

### Performance Risk
- The 10-second acknowledgement window is threatened by AML latency alone.
- High-volume load testing has not been completed.

### Architectural Risk
- Batch core banking is incompatible with real-time RTP without an intermediary layer.
- Real-time posting and eventual reconciliation will require careful design to avoid double-posting or settlement mismatch.

### Compliance Risk
- Fraud screening and AML screening are mandatory scheme controls.
- If implemented asynchronously, we need confirmation that the scheme permits that operating model.

---

## Discovery Conclusions

### Likely required target architecture
A receiving RTP solution will likely need:
1. **RTP ingress/API layer**
2. **Message validation and schema parsing**
3. **Real-time fraud decisioning**
4. **AML screening orchestration**
5. **Immediate account posting service**
6. **Acknowledgement responder**
7. **End-of-day reconciliation to batch core**
8. **Operational monitoring and audit logging**

### Main unresolved question
Can fraud and AML checks be completed in a way that still guarantees:
- **acknowledgement within 10 seconds**, and
- compliance with scheme requirements?

At present, this is **not proven**.

---

## Recommended Next Steps

### Immediate discovery actions
1. **Confirm scheme rules**
   - Whether fraud/AML must complete synchronously before acknowledgement
   - Whether provisional crediting is allowed
   - Any timeout or retry requirements

2. **Load test AML system**
   - Validate P95/P99 latency at **40,000 tx/hour**
   - Confirm scalability or identify need for replacement/caching/queueing

3. **Assess fraud capability options**
   - Real-time API alternative
   - Third-party fraud service
   - Simplified rules engine for RTP inbound screening

4. **Define thin real-time posting layer**
   - Ledger model
   - idempotency controls
   - replay handling
   - reconciliation process with core banking

5. **Prototype end-to-end timing**
   - Measure total time from receipt to acknowledgement
   - Include validation, fraud, AML, posting, and response generation

---

## Go / No-Go Assessment

### Current status: **At risk**
The receiving capability is **not yet feasible with confidence** due to:
- batch-only fraud platform,
- AML latency risk,
- unproven end-to-end 10-second performance.

### What would make it feasible
- A real-time fraud control path that adds minimal latency
- AML processing that reliably stays within SLA at peak load
- A real-time posting layer independent of the batch core
- Scheme confirmation on synchronous vs asynchronous screening expectations

---

If you want, I can turn this into a **formal discovery artifact** next:
- **epic/problem statement**
- **assumptions**
- **risks/issues/dependencies**
- **high-level target architecture**
- or a **delivery recommendation**.