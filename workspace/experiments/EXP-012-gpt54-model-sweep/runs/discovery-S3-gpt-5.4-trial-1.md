## Discovery Summary — RTP Receiving Capability

### 1) Problem statement
Payments NZ is mandating participation in the new RTP scheme. The enterprise must support inbound real-time payments first, including:
- Receiving RTP messages from the Payments NZ central infrastructure
- Processing ISO 20022 payment messages
- Crediting customer accounts within 60 seconds
- Sending mandatory acknowledgements within 10 seconds of receipt
- Operating 24/7/365
- Applying fraud screening to all inbound payments
- Applying AML screening to inbound payments over $1,000

Current architecture is not fit for this:
- Core banking is batch-oriented, not real-time
- Fraud screening is batch only
- AML has a real-time API but poor latency under load
- Real-time reconciliation to batch core is not yet established

There is a hard regulatory/scheme deadline of **2026-09-01**, with **$50,000/day penalties** and possible scheme suspension if missed.

---

### 2) Desired outcome
Deliver an inbound RTP receiving capability that:
- Accepts and validates inbound ISO 20022 RTP messages
- Performs required fraud and AML controls
- Credits enterprise customer accounts in real time
- Sends compliant acknowledgements within 10 seconds
- Reconciles real-time postings with the batch core safely
- Meets scheme go-live date and operational availability requirements

---

### 3) In-scope
- Inbound RTP payment processing only
- Integration with Payments NZ central infrastructure
- ISO 20022 message ingestion and parsing
- Real-time account crediting layer
- End-of-day reconciliation to batch core
- Fraud screening for all inbound RTP transactions
- AML screening for transactions above $1,000
- Scheme acknowledgement messaging
- Performance and timeout compliance for receiving flow
- Operational readiness for 24/7/365 receiving

### 4) Out-of-scope / later phase
- Outbound RTP payments
- Full core banking modernization
- Replacement of existing fraud platform unless required
- Non-RTP payment rails
- Broader customer channel changes unless needed for inbound posting visibility

---

## 5) Key facts and assumptions
### Known facts
- Current domestic rails are batch-based with same-day settlement
- RTP requires send/receive in 60 seconds, 24/7/365
- Acknowledgement must be sent within 10 seconds
- Fraud screening is mandatory for all inbound payments
- AML screening required for inbound payments over $1,000
- AML real-time API has P99 latency of 8 seconds under load
- Estimated RTP peak volume: 40,000 tx/hour
- Fraud real-time check is estimated at 2–4 seconds, but not yet implemented/confirmed
- Core banking cannot post in real time today

### Assumptions needing validation
- Whether acknowledgement can be sent before full downstream posting and/or screening completion
- Whether fraud and AML must complete before ack, before account credit, or before funds availability
- Whether a “thin real-time ledger/posting layer” is scheme- and risk-compliant
- Whether current AML platform can scale to RTP peak load
- Whether fraud screening can be adapted into a sufficiently low-latency service
- Whether inbound volume profile is evenly distributed or bursty

---

## 6) Primary risks and issues

### Critical risk 1: 10-second acknowledgement window may be missed
Potential path timing:
- Fraud check: 2–4 sec
- AML check: P99 8 sec for >$1,000
- Other steps: message validation, routing, posting, persistence, ack generation, network overhead

This strongly suggests a high risk that end-to-end synchronous processing will exceed 10 seconds, especially for transactions requiring AML.

**Impact:** Scheme non-compliance, rejects, operational instability, possible inability to go live.

---

### Critical risk 2: No real-time fraud capability exists today
Fraud is mandatory for all inbound payments, but current fraud processing is batch only.

**Impact:** Compliance blocker and design blocker. This is likely on the critical path.

---

### Critical risk 3: AML latency and capacity are unproven
An 8-second P99 under load is already close to the ack SLA by itself. RTP peak load has not been tested.

**Impact:** Major performance/compliance risk, especially under peak or degraded conditions.

---

### Critical risk 4: Core banking is batch-based
Immediate funds availability requires a real-time posting capability or equivalent customer-available balance layer.

**Impact:** Architecture, reconciliation, controls, and accounting complexity. Possible operational and financial risk if real-time and batch ledgers diverge.

---

### Critical risk 5: 24/7/365 operational model gap
Current systems/processes may rely on batch windows, maintenance windows, and daytime support patterns.

**Impact:** Service availability and incident response risks.

---

### Critical risk 6: Deadline pressure
Go-live deadline has direct financial penalties and strategic consequences.

**Impact:** Strong need for scope discipline, rapid architecture decisions, and executive escalation of blockers.

---

## 7) Likely architecture themes
A likely solution shape for discovery evaluation:

- **RTP gateway/integration layer**
  - Connects to Payments NZ
  - Handles message receipt/transmission
  - Parses and validates ISO 20022

- **Real-time orchestration/service layer**
  - Applies business validations
  - Invokes fraud and AML services
  - Manages timeout logic
  - Produces acknowledgement messages

- **Thin real-time posting/ledger layer**
  - Credits customer accounts immediately
  - Maintains real-time balances/holds/events
  - Feeds end-of-day reconciliation to core

- **Reconciliation and exception handling**
  - End-of-day posting to core
  - Break management
  - Replay/idempotency controls

- **Observability and operations**
  - End-to-end tracing
  - SLA monitoring
  - 24/7 alerting and support tooling

But the main unresolved design question is sequencing:
- ack before screening?
- ack after screening but before credit?
- credit before full batch core booking?
- what happens if screening flags after provisional credit?

This needs immediate clarification with scheme/risk/compliance stakeholders.

---

## 8) Discovery questions to answer urgently

### Scheme/compliance questions
1. What exactly must be completed before the 10-second acknowledgement?
   - receipt only?
   - validation only?
   - full acceptance decision?
   - screening complete?
2. Can an inbound payment be acknowledged as received while processing continues?
3. Must funds be made available before or after fraud/AML screening completes?
4. Are provisional credits allowed?
5. What are the reject/return obligations if screening fails after receipt?
6. What are the exact message types and timing obligations under Payments NZ RTP?

### Fraud questions
1. What minimum fraud control satisfies scheme rules for inbound payments?
2. Can an interim lightweight real-time fraud rules engine be used?
3. Is vendor enhancement available faster than building a new real-time fraud service?
4. What is acceptable risk treatment if fraud service is unavailable?

### AML questions
1. Is AML screening legally/scheme required before funds are made available, or only before completion/final settlement?
2. What is the actual latency distribution at expected RTP volume?
3. Can AML thresholds or pre-filtering reduce synchronous load?
4. What is the fallback behavior if AML times out?

### Core banking / finance questions
1. Can the thin real-time layer be the system of immediate customer balance truth?
2. How will GL/accounting treatment work until batch core reconciliation?
3. What is the tolerance for reconciliation differences and how are they resolved?
4. How are duplicate/replayed inbound messages prevented from double crediting?

### Operational questions
1. Can all components operate with no nightly downtime?
2. What are RTO/RPO expectations?
3. What support model is needed for 24/7/365?
4. What non-functional requirements apply for resilience, cyber, auditability, and DR?

---

## 9) Early hypotheses
1. **A fully synchronous flow including fraud + AML + posting may not meet the 10-second ack window.**
2. **An asynchronous or decoupled design may be required**, but may conflict with scheme/compliance rules depending on when screening must occur.
3. **A temporary or tactical real-time fraud capability** may be needed because current batch fraud is not viable.
4. **AML performance optimization or architectural isolation** will likely be required before production readiness.
5. **The thin real-time posting layer is unavoidable** if the batch core cannot support immediate funds availability.

---

## 10) Dependencies
- Payments NZ scheme technical specifications and certification process
- Fraud platform/product team or external vendor
- AML platform team/vendor
- Core banking team
- Finance/GL/reconciliation team
- Risk and compliance
- Infrastructure/SRE/operations
- Security and architecture governance
- Programme governance/executive sponsor for deadline risk decisions

---

## 11) Constraints
- Hard go-live date: **2026-09-01**
- Financial penalty: **$50,000/day**
- Existing batch core cannot be fully replaced in time
- Fraud capability gap
- AML latency concerns
- 24/7/365 requirement
- Strict acknowledgement SLA

---

## 12) Recommended discovery workstreams

### Workstream A: Scheme rules and timing interpretation
Goal: determine the precise sequencing obligations around ack, screening, and funds availability.

**Top priority** because it drives the architecture.

### Workstream B: End-to-end latency budget
Create a timing budget for each step:
- network receive
- ISO 20022 validation
- fraud
- AML
- posting
- persistence
- ack generation/send

Run performance modelling against peak and burst volumes.

### Workstream C: Real-time fraud options assessment
Compare:
- tactical rules engine
- wrapping current fraud capability with low-latency subset
- buying/accelerating vendor API capability
- risk-based staged screening

### Workstream D: AML performance and scalability testing
Load test at RTP projected peak and burst conditions, especially >$1,000 flows.
Validate timeout/failure behavior.

### Workstream E: Thin real-time ledger/posting design
Define:
- immediate customer credit model
- idempotency
- ledger events
- reversals/holds
- reconciliation and exception handling
- customer balance visibility

### Workstream F: Operating model / NFR readiness
Assess:
- 24/7 support
- resiliency
- observability
- DR
- incident response
- maintenance strategy without downtime

---

## 13) Initial delivery risks to escalate now
These should be raised immediately to programme/executive level:

1. **Compliance interpretation risk**: unclear if mandatory controls can fit before 10-second ack.
2. **Fraud capability gap**: no real-time fraud solution exists.
3. **AML performance risk**: current P99 likely incompatible with ack SLA.
4. **Architecture risk**: batch core cannot deliver immediate funds availability.
5. **Deadline risk**: hard date with significant penalties.

---

## 14) Candidate MVP framing
A pragmatic MVP for the receiving side may be:

- Receive inbound RTP messages
- Validate and acknowledge within scheme timing
- Perform real-time account credit via thin posting layer
- Apply minimum compliant fraud controls in real time
- Apply AML for >$1,000 with proven volume handling
- Reconcile to batch core end of day
- Handle rejects/exceptions manually where necessary initially

But this MVP is only viable if compliance/risk agree on transaction sequencing and control sufficiency.

---

## 15) Suggested next-step outputs from discovery
Produce these artifacts:

1. **Current-to-target process map**
2. **End-to-end sequence diagram with timing budget**
3. **Decision paper on ack/screening/funds sequencing**
4. **Architecture options paper**
5. **Fraud capability gap assessment**
6. **AML performance test plan**
7. **Thin real-time ledger concept design**
8. **Delivery roadmap to 2026-09-01**
9. **Top risks, assumptions, issues, dependencies log**
10. **Executive decisions required list**

---

## 16) Executive takeaway
This is a **high-urgency, high-risk compliance delivery**. The biggest unknown is whether required fraud/AML controls can coexist with the **10-second acknowledgement SLA** and **immediate funds availability** expectations. The programme likely needs:
- urgent clarification of scheme/control sequencing,
- a tactical real-time fraud solution,
- AML performance proof,
- and a thin real-time ledger/posting layer.

Without resolving those quickly, the enterprise faces a material risk of missing the mandatory go-live date and incurring penalties.

If you want, I can turn this into a **discovery backlog**, a **RAID log**, or a **one-page executive brief**.