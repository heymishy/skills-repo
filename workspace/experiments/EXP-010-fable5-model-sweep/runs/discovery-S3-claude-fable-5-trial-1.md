# Discovery: Inbound Real-Time Payments (RTP) Receiving Capability

## 1. Problem Statement

The enterprise must participate as a member in the Payments NZ RTP scheme, which mandates sending and receiving payments within 60 seconds, 24/7/365, with immediate fund availability. Current infrastructure is built around batch processing with same-day settlement and cannot meet these requirements. The first delivery phase is the **receiving side**: accepting inbound RTP payments, crediting customer accounts in real time, and meeting scheme messaging obligations.

**Hard deadline:** Live by **2026-09-01**. Failure costs **$50,000/day** plus risk of scheme suspension.

---

## 2. Business Drivers

| Driver | Detail |
|---|---|
| Regulatory/scheme mandate | Mandatory participation as scheme member |
| Financial penalty | $50,000/day for missing go-live |
| Existential risk | Potential suspension from the scheme |
| Strategic | Foundation for future send-side capability and real-time product offerings |

---

## 3. Scope

### In scope (Phase 1 — Receive)
- Integration with Payments NZ central infrastructure (connectivity, certificates, network)
- Inbound ISO 20022 message processing (parsing, validation, transformation)
- Scheme acknowledgement messaging within the **10-second timeout window**
- Real-time crediting layer ("thin layer") in front of the batch core banking system
- End-of-day reconciliation between real-time layer and batch core
- Real-time fraud screening on **all** inbound payments
- Real-time AML screening on inbound payments **> $1,000**
- 24/7/365 availability, including during core batch windows
- Immediate fund availability to customers

### Out of scope (Phase 1)
- Send-side / outbound RTP payments
- Replacement of core banking system
- Replacement of fraud or AML platforms (integration only — *to be validated, see risks*)

### Scope boundary questions
- Are returns/reversals of inbound payments in scope for Phase 1? (Scheme rules likely require it)
- Exception handling and manual repair workflows?
- Customer notification (alerts on credit)?

---

## 4. Key Requirements (Initial)

### Functional
- FR1: Receive and validate ISO 20022 inbound payment messages
- FR2: Credit beneficiary account in real time with immediate fund availability
- FR3: Send scheme acknowledgement (accept/reject) within 10 seconds of receipt
- FR4: Fraud-screen 100% of inbound payments before funds are released *(sequencing to be confirmed — see OQ3)*
- FR5: AML-screen inbound payments > $1,000 before funds are released *(sequencing to be confirmed)*
- FR6: Reconcile real-time ledger postings with batch core at end of day, with break detection and resolution workflow
- FR7: Handle rejections, timeouts, duplicates, and out-of-order messages per scheme rules

### Non-functional
- NFR1: **End-to-end processing ≤ 10 seconds** (ack window), with internal latency budget per component
- NFR2: Throughput: **40,000 tx/hour peak** (~11 TPS sustained; burst profile unknown — see OQ6)
- NFR3: Availability 24/7/365 — implies zero-downtime deployments, no maintenance windows, resilience during core batch runs
- NFR4: Idempotency / exactly-once crediting
- NFR5: Auditability and scheme reporting compliance

---

## 5. Critical Risks & Constraints

### 🔴 R1 — Latency budget likely does not close (BLOCKER-level risk)
The arithmetic as stated:

| Step | Estimated latency |
|---|---|
| Fraud check (estimated, unconfirmed) | 2–4 s |
| AML check (P99, **not load-tested**) | 8 s |
| Message parsing, validation, account credit, ack | unknown |
| **Sequential total** | **10–12s+ before other processing** |

Even if fraud and AML run **in parallel**, AML's P99 of 8s leaves only ~2s for everything else — and that P99 was measured **below RTP volumes**. At P99, ~1 in 100 payments (≈400/hour at peak) would approach or breach the timeout sequentially. **This must be resolved before architecture decisions are made.**

### 🔴 R2 — AML system untested at target load
P99 of 8s under current load; behavior at 40,000 tx/hour unknown. Latency typically degrades under load. A load test is a **mandatory early discovery spike**.

### 🔴 R3 — Fraud system has no real-time API
The 2–4s figure is an estimate for a capability that doesn't exist yet. Building a real-time fraud API (or procuring a real-time fraud product) may itself be a major sub-project on the critical path.

### 🟠 R4 — Real-time layer vs. batch core reconciliation
Stand-in processing introduces: intraday balance divergence, customer-visible inconsistency, overdraft/limit checks against stale balances, duplicate posting risk, and reconciliation break handling. Behavior **during the batch window itself** (when the core may be locked/unavailable) needs explicit design.

### 🟠 R5 — 24/7/365 availability vs. batch-era operating model
Current ops model (maintenance windows, batch-cycle dependencies, business-hours support) is incompatible. This is an organizational/operational change, not just a technical one.

### 🟠 R6 — Fixed external deadline with external dependencies
Payments NZ certification/testing windows, scheme onboarding gates, and industry test cycles are not under our control and may consume months of the runway. These dates must be obtained immediately.

### 🟡 R7 — Immediate fund availability vs. screening outcomes
If funds must be available immediately but fraud/AML screening flags a payment post-credit, recovery is complex (funds may be withdrawn). Scheme rules on hold/reject semantics are pivotal.

---

## 6. Open Questions

**Scheme rules & compliance**
1. **OQ1:** Does the 10-second window apply to a *technical* acknowledgement or a *business* accept/reject decision? Can we ack receipt and reject later?
2. **OQ2:** What does "immediate fund availability" precisely mean in scheme rules — can funds be held pending screening for some period?
3. **OQ3:** Must fraud/AML screening complete **before** crediting, or is post-credit screening with recall/freeze permitted (by scheme rules AND by our regulator/AML legislation)?
4. **OQ4:** What are the scheme certification milestones, industry test dates, and onboarding gates before 2026-09-01?
5. **OQ5:** What are the rules for rejects, returns, timeouts, and exception flows on the receive side?

**Volume & performance**
6. **OQ6:** What is the burst profile within the 40,000/hour peak (e.g., payroll spikes, top-of-minute bursts)? Average TPS (~11) vs. peak TPS could differ by an order of magnitude.
7. **OQ7:** What % of inbound payments will exceed the $1,000 AML threshold (determines AML call volume)?

**Systems**
8. **OQ8:** What is the source of the 2–4s fraud estimate? Has the fraud vendor/team committed to delivering a real-time API, and by when?
9. **OQ9:** Can the AML vendor commit to a latency SLA at RTP volumes? Is there a faster screening tier or pre-screening/caching option?
10. **OQ10:** What is the core banking system's API/posting capability outside batch — any real-time posting interface at all, or memo-post only?
11. **OQ11:** How are customer balances exposed to channels (internet banking, ATM) — will real-time credits be visible immediately?

**Operational**
12. **OQ12:** Who operates this 24/7 — existing ops team, new follow-the-sun model, or managed service?
13. **OQ13:** Settlement model with the scheme — prefunded settlement account? Liquidity management implications?

---

## 7. Assumptions (to validate)

| # | Assumption | Validation method |
|---|---|---|
| A1 | Fraud + AML can run in parallel | Compliance & vendor confirmation |
| A2 | Scheme permits ack-then-screen or short hold patterns | Scheme rulebook review (OQ1–3) |
| A3 | Core banking can accept an end-of-day file/feed from the real-time layer | Core vendor/team confirmation |
| A4 | 40,000 tx/hour is the correct peak sizing | Volume modelling with scheme/industry data |
| A5 | Existing AML system can be made fit-for-purpose | Load test (Spike S2) |

---

## 8. Stakeholders (Initial Map)

- **Payments NZ** — scheme rules, certification, test windows
- **Regulator / AML compliance officer** — screening sequencing constraints
- **Core banking platform team / vendor** — reconciliation interface, posting capability
- **Fraud platform team / vendor** — real-time API feasibility
- **AML platform team / vendor** — latency SLA, load capacity
- **Treasury/Liquidity** — settlement account funding
- **Operations / IT service management** — 24/7 model
- **Customer channels teams** — balance visibility
- **Legal/Risk** — penalty exposure, scheme agreement obligations

---

## 9. Recommended Discovery Spikes (Pre-Design)

| # | Spike | Purpose | Priority |
|---|---|---|---|
| S1 | **Latency budget model** — define the full 10s budget end-to-end with measured/committed numbers per hop | Determine if architecture is feasible as conceived | P0 |
| S2 | **AML load test** at 40k tx/hr + burst profile | Validate or invalidate AML system fit | P0 |
| S3 | **Scheme rulebook deep-dive** on ack semantics, screening sequencing, fund availability | Resolve OQ1–OQ3 — these determine the architecture | P0 |
| S4 | **Fraud real-time API feasibility & timeline** with vendor/team | Confirm critical-path dependency | P0 |
| S5 | **