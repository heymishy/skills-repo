Understood. I’m running the **/discovery** skill on this scenario.

---

# /discovery output

## 1) Problem statement

Payments NZ is launching a new **real-time payments (RTP) scheme** and the enterprise must participate as a scheme member. The immediate scope is to build the **receiving side** for inbound RTP payments.

To do this, the enterprise must:
- Integrate with the **Payments NZ central infrastructure**
- Receive and process **ISO 20022** inbound payment messages
- **Credit enterprise customer accounts in real time**
- Send **scheme-required acknowledgements within 10 seconds**
- Operate **24/7/365** with immediate funds availability

The current environment is not real-time:
- Domestic payment rails are **batch-based with same-day settlement**
- The core banking system processes in **batch windows**
- Fraud screening is **batch only**
- AML has a real-time API, but **high latency** and unproven scale

A proposed approach is to introduce a **thin real-time processing layer** to post credits immediately and reconcile with the batch core at end of day.

This creates a critical delivery and compliance challenge:
- Need to meet **strict technical SLA**: acknowledgement within 10 seconds
- Need to meet **scheme control requirements**: fraud and AML screening
- Need to meet **go-live date**: **2026-09-01**
- Failure to meet date has material consequences: **$50,000/day penalty** and possible scheme suspension

---

## 2) Desired outcomes

### Business outcomes
- Achieve mandatory scheme participation by **2026-09-01**
- Avoid penalties and risk of suspension
- Enable customers to receive RTP payments with **immediate fund availability**
- Establish foundation for future outbound RTP capability

### Operational outcomes
- Process inbound RTP payments **24/7/365**
- Send scheme acknowledgements within **10 seconds**
- Credit customer accounts in real time with strong resilience and observability
- Reconcile real-time postings to the batch core reliably at end of day

### Risk and control outcomes
- Ensure **fraud screening** is applied to all inbound payments
- Ensure **AML screening** is applied to inbound payments above **$1,000**
- Demonstrate controls are compliant with scheme participation rules
- Avoid false real-time crediting without adequate control coverage

---

## 3) In-scope

- Inbound RTP receiving capability
- Integration with Payments NZ central infrastructure
- ISO 20022 inbound message handling
- Real-time account crediting layer
- Acknowledgement generation and transmission
- Fraud screening for all inbound payments
- AML screening for payments above $1,000
- End-of-day reconciliation into the batch core
- Performance, latency, scale, and operational readiness for inbound flow
- Scheme compliance for inbound receiving

---

## 4) Out-of-scope / not yet in scope

- Outbound RTP payment initiation/sending
- Full replacement of the batch core banking platform
- Broader payments modernization beyond RTP receiving
- Non-domestic or cross-border payment rails
- Customer-facing channel changes unless required for receiving visibility
- Long-term strategic ledger redesign beyond thin real-time layer

---

## 5) Key stakeholders

- Payments / Scheme participation program
- Core banking / deposits platform team
- Enterprise integration / middleware team
- Fraud team
- AML / Financial crime team
- Infrastructure / SRE / operations
- Architecture
- Risk and compliance
- Legal / scheme relationship management
- Customer operations / finance reconciliation
- Executive sponsor accountable for scheme readiness

---

## 6) Current state summary

### Payments processing
- Existing domestic rails are batch-based
- Settlement is same-day, not immediate
- No proven current capability for 24/7/365 real-time posting

### Core banking
- Core processes transactions in batch windows
- Cannot natively support immediate real-time customer crediting
- Proposed workaround is a thin real-time layer with deferred reconciliation

### Fraud
- Scheme requires fraud screening on all inbound payments
- Existing fraud system is batch only
- No current real-time API capability
- Estimated real-time fraud check latency: **2–4 seconds**
- Fit within end-to-end SLA is unconfirmed

### AML
- Required for inbound payments above **$1,000**
- AML system has a real-time API
- P99 latency under load is **8 seconds**
- Not load-tested for RTP peak volume: **40,000 tx/hour**

### Scheme / delivery
- Hard go-live deadline: **2026-09-01**
- Penalty for missing date: **$50,000/day**
- Possible suspension from scheme for failure to participate

---

## 7) Major constraints

- **10-second acknowledgement deadline**
- **24/7/365 availability**
- **Immediate funds availability**
- Legacy batch core architecture
- No existing real-time fraud capability
- AML real-time latency near SLA threshold
- Peak estimated volume of **40,000 transactions/hour**
- Fixed external deadline with financial penalties

---

## 8) Assumptions identified

These are currently implicit and need confirmation:

1. A payment can only be acknowledged after all mandatory controls and posting are complete.
2. Fraud screening must happen synchronously before customer funds are made available.
3. AML screening above $1,000 must also happen synchronously before acknowledgement.
4. The thin real-time layer is acceptable from accounting, risk, and regulatory perspectives.
5. End-of-day reconciliation to the batch core is sufficient for ledger integrity and reporting.
6. Payments NZ central infrastructure integration patterns and message behaviours are compatible with enterprise architecture.
7. The estimated peak volume of 40,000 tx/hour is accurate and includes expected growth/headroom.
8. Current AML latency measurements are representative of production behaviour under RTP conditions.
9. Scheme acknowledgements cannot be staged or sent independently from downstream completion states.
10. The enterprise can operationally support 24/7 real-time incident response.

---

## 9) Core business / technical capabilities required

- Real-time ISO 20022 message ingestion
- Scheme connectivity and security
- Message validation and parsing
- Routing and orchestration
- Real-time account lookup and posting
- Real-time available balance / account eligibility logic
- Fraud decisioning in real time
- AML decisioning in real time for threshold-triggered payments
- Acknowledgement generation within SLA
- Idempotency / duplicate detection
- Exception handling and repair
- Reconciliation between real-time layer and batch core
- Monitoring, alerting, audit, and operational support
- High availability, resilience, and disaster recovery

---

## 10) Risks discovered

### R1. End-to-end SLA may be infeasible
The 10-second acknowledgement window is at high risk given:
- Fraud estimated at **2–4s**
- AML P99 at **8s**
- Additional time needed for:
  - scheme message ingestion
  - validation/parsing
  - orchestration
  - account crediting
  - acknowledgement generation/transmission

**Impact:** missed acknowledgements, scheme non-compliance, payment failures, inability to go live.

---

### R2. Fraud control gap
Scheme requires fraud screening on all inbound payments, but current fraud capability is batch only.

**Impact:** compliance gap, inability to satisfy scheme rules, need for tactical workaround or accelerated fraud modernization.

---

### R3. AML scalability and latency risk
AML API already has **8-second P99** under load and is not tested at RTP volume.

**Impact:** systemic timeout failures, queue buildup, degraded customer experience, missed acknowledgements.

---

### R4. Thin real-time layer introduces ledger/reconciliation risk
Immediate customer crediting outside the batch core creates risk in:
- ledger consistency
- duplicate posting
- replay handling
- outage recovery
- customer balance correctness
- financial reporting

**Impact:** financial loss, customer harm, operational repair burden, audit issues.

---

### R5. 24/7/365 operational readiness gap
Current estate is batch-oriented. Real-time payments require:
- high availability
- on-call support
- continuous monitoring
- incident response outside business hours

**Impact:** service instability, scheme breaches, prolonged customer impact.

---

### R6. Deadline delivery risk
Hard external date with significant penalties and uncertain architecture/control feasibility.

**Impact:** $50,000/day penalties, suspension risk, reputational damage.

---

### R7. Requirements ambiguity risk
Key sequencing and compliance rules are not yet confirmed, especially:
- whether controls must complete before acknowledgement
- whether customer funds can be provisionally credited
- acceptable fallback paths on control timeout

**Impact:** building the wrong solution, rework, compliance failure.

---

## 11) Dependencies

- Payments NZ technical and certification environments
- Scheme rulebook and operational requirements clarification
- Core banking interfaces for real-time credit and end-of-day reconciliation
- Fraud solution availability or workaround
- AML system performance remediation and scale testing
- Infrastructure/platform support for always-on services
- Security, network, certificates, and operational connectivity
- Production support model and service management readiness

---

## 12) Unknowns / open questions

### Scheme / compliance
1. Does the scheme require acknowledgement only after successful posting and mandatory screening completion?
2. What are the exact acknowledgement message types and timeout semantics?
3. Is a “received/accepted for processing” acknowledgement allowed before downstream control completion?
4. What is the scheme-defined behaviour on timeout?
5. Are there exemptions or phased compliance options for inbound participation?
6. What evidence is required to demonstrate fraud/AML compliance at go-live?

### Fraud
7. Is the fraud screening expected to be blocking/synchronous?
8. Can a rules-based lightweight interim fraud control satisfy scheme requirements?
9. Can inbound credits be screened differently from outbound payments from a control standpoint?
10. What fraud decision outcomes are required in-line?

### AML
11. Must AML complete before funds are made available?
12. Are there allowed post-credit review models for AML for inbound payments over $1,000?
13. What is current average, P95, and timeout behaviour, not just P99?
14. What throughput can the AML API sustain at target concurrency?

### Architecture / processing
15. What system will be system-of-record for the immediate customer balance before batch reconciliation?
16. How will duplicate messages and replay events be handled?
17. How will partial failures be recovered if account is credited but acknowledgement fails, or vice versa?
18. How will end-of-day reconciliation exceptions be managed?
19. What RTO/RPO and availability targets apply?
20. What non-functional requirements exist for observability, audit, and security?

### Delivery / scope
21. Is inbound-only participation sufficient for scheme deadline, or is outbound also mandatory by a later phase?
22. What certification timelines and lead times apply with Payments NZ?
23. Are there internal change freezes or dependencies that threaten the date?

---

## 13) Initial hypotheses

1. **Current architecture is unlikely to meet the 10-second SLA** if fraud and AML are both fully synchronous in the critical path without optimization.
2. **Real-time fraud capability is the biggest functional gap** because it does not currently exist.
3. **AML latency is the biggest performance risk** because existing P99 nearly consumes the full acknowledgement window.
4. A **minimal viable inbound receiving design** may be possible if:
   - acknowledgement semantics allow early response,
   - fraud is implemented with a lightweight real-time rules layer,
   - AML is optimized or decoupled where permitted,
   - real-time posting layer is deliberately narrow in scope.
5. The program likely needs **urgent scheme-rule clarification** before solution architecture is finalized.

---

## 14) Priority discovery themes

### Theme A: Scheme rule and compliance clarification
Highest priority because it determines whether the target architecture is even viable.

Questions:
- What must happen before acknowledgement?
- What must happen before funds availability?
- Are there any permitted asynchronous control patterns?

---

### Theme B: End-to-end latency budget
Need a measured budget across:
- message receipt
- validation
- fraud
- AML
- account lookup/posting
- acknowledgement transmission

Goal:
- Determine if 10 seconds is achievable under peak and degraded conditions

---

### Theme C: Real-time fraud approach
Need to determine:
- build, buy, or tactical interim rules engine
- minimum compliant control set
- latency profile
- decision quality and false positive/negative impacts

---

### Theme D: AML performance and scale
Need to validate:
- throughput
- concurrency
- queueing behaviour
- timeout thresholds
- optimization options

---

### Theme E: Real-time posting layer design
Need to confirm:
- posting model
- account balance handling
- reversals/repairs
- idempotency
- reconciliation integrity
- customer statement impacts

---

### Theme F: Delivery feasibility to deadline
Need integrated view of:
- architecture readiness
- control readiness
- certification path
- environment setup
- testing timeline
- operational readiness

---

## 15) Recommended immediate next steps

### Within 1–2 weeks
1. **Run a scheme rule clarification workshop**
   - Confirm acknowledgement timing semantics
   - Confirm mandatory sequencing of fraud/AML/posting
   - Confirm any phased or exception paths

2. **Create an end-to-end latency budget**
   - Allocate target milliseconds/seconds per processing component
   - Include network, retries, and failure handling
   - Define hard upper bounds

3. **Spike the thin real-time receiving architecture**
   - ISO 20022 ingestion
   - account lookup
   - real-time posting
   - acknowledgement generation
   - idempotency and replay handling

4. **Assess real-time fraud options**
   - Can current fraud vendor/system expose a synchronous API quickly?
   - Is an interim real-time rules service acceptable?
   - What decision time can be achieved at P99?

5. **Load-test AML at RTP-like concurrency**
   - Test against 40,000 tx/hour peak and stress scenarios
   - Measure average, P95, P99, timeout rates, and saturation points

6. **Establish delivery critical path**
   - Scheme integration
   - control implementation
   - certification
   - production readiness
   - contingency timeline to 2026-09-01

---

## 16) Likely decisions that will be needed soon

- Whether fraud and AML are in the synchronous path before acknowledgement
- Whether current AML platform is fit for RTP or requires remediation/replacement
- Whether to proceed with a thin real-time layer versus a broader core change
- Whether an interim tactical fraud capability is acceptable
- Whether scope must be narrowed to achieve deadline
- Whether additional funding / executive escalation is needed due to compliance and penalty exposure

---

## 17) Discovery deliverables suggested

- Problem framing and scope document
- Scheme rules decision log
- Current-state and target-state architecture diagrams
- End-to-end latency budget
- Control sequencing model for fraud/AML/posting/ack
- Risk register with owners and mitigations
- Delivery roadmap to 2026-09-01
- Decision paper on fraud and AML options
- Operational readiness checklist for 24/7 RTP receiving

---

## 18) Executive summary

This is a **high-urgency, high-risk mandatory compliance delivery**. The main issue is not just building inbound RTP receiving, but doing so within a **10-second acknowledgement window** while satisfying **real-time fraud and AML controls** using systems that are currently either **batch-only** or **too slow / unproven at scale**.

The most material discovery finding is:

> **There is a credible risk that the current control architecture cannot meet the RTP scheme timing requirements.**

Before solution design is locked, the enterprise must urgently confirm:
- exact scheme acknowledgement semantics,
- whether fraud/AML must complete synchronously,
- whether current AML can scale,
- and what tactical real-time fraud option is acceptable.

The deadline and penalties make this a program requiring **early executive attention, rapid technical spikes, and formal risk management**.

---

If you want, I can next turn this into one of these formats:
1. **Discovery summary table**
2. **Risk register with severity/mitigations**
3. **Assumptions / questions log**
4. **Target capability map**
5. **Executive briefing memo**
6. **Initiative charter draft**